import os
import json
import joblib
import pandas as pd
import numpy as np
import shap

# Đường dẫn tới thư mục model_files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model_files")

class ModelService:
    def __init__(self):
        # 1. Load các file pkl và json
        self.model = joblib.load(os.path.join(MODEL_DIR, "rf_churn_model.pkl"))
        self.encoder = joblib.load(os.path.join(MODEL_DIR, "onehot_encoder.pkl"))
        
        with open(os.path.join(MODEL_DIR, "model_metadata.json"), "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

        # 2. Đọc cấu hình từ JSON
        self.cat_cols = self.metadata["categorical_cols"]
        self.num_cols = self.metadata["numerical_cols"]
        self.expected_features = self.metadata["feature_columns"]
        self.threshold = self.metadata["threshold"]
        self.median_total_charges = self.metadata["median_total_charges"]

        # 3. Khởi tạo SHAP Explainer
        self.explainer = shap.TreeExplainer(self.model)

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """ Tiền xử lý dữ liệu đầu vào """
        df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
        df['TotalCharges'] = df['TotalCharges'].fillna(self.median_total_charges)

        df_num = df[self.num_cols].reset_index(drop=True)
        df_cat = df[self.cat_cols].reset_index(drop=True)

        encoded_array = self.encoder.transform(df_cat)
        encoded_col_names = self.encoder.get_feature_names_out(self.cat_cols)
        
        df_encoded = pd.DataFrame(encoded_array, columns=encoded_col_names)
        df_processed = pd.concat([df_num, df_encoded], axis=1)

        df_final = df_processed.reindex(columns=self.expected_features, fill_value=0)
        return df_final

    def _get_prediction_prob(self, input_dict: dict) -> float:
        """Hàm phụ trợ: Trả về duy nhất xác suất Churn để phục vụ việc giả lập nhanh"""
        df_raw = pd.DataFrame([input_dict])
        df_transformed = self.preprocess_data(df_raw)
        return float(self.model.predict_proba(df_transformed)[0][1])

    def predict(self, input_dict: dict):
        df_raw = pd.DataFrame([input_dict])
        
        # Tiền xử lý dữ liệu gốc
        df_transformed = self.preprocess_data(df_raw)
        
        # Dự đoán xác suất Churn gốc
        prob = float(self.model.predict_proba(df_transformed)[0][1])
        prediction = bool(prob >= self.threshold)
        current_prob_percent = round(prob * 100, 2)

        # Tính toán SHAP Values
        shap_raw = self.explainer.shap_values(df_transformed)
        if isinstance(shap_raw, list):
            churn_shap = shap_raw[1][0]
        elif isinstance(shap_raw, np.ndarray) and len(shap_raw.shape) == 3:
            churn_shap = shap_raw[0, :, 1]
        else:
            churn_shap = shap_raw[0]

        shap_dict = {col: float(val) for col, val in zip(df_transformed.columns, churn_shap)}
        
        # ==============================================================
        # COUNTERFACTUAL RECOMMENDATION ENGINE (Mô phỏng giả thuyết)
        # ==============================================================
        recommendations = []

        # Giả thuyết 1: Thay đổi Hợp đồng sang 1 Năm
        if input_dict.get('Contract') == 'Month-to-month':
            sim_dict = input_dict.copy()
            sim_dict['Contract'] = 'One year'
            sim_prob = self._get_prediction_prob(sim_dict)
            sim_prob_percent = round(sim_prob * 100, 2)
            reduction = round(current_prob_percent - sim_prob_percent, 2)
            
            if reduction > 2.0:
                recommendations.append({
                    "id": "ACT_CONTRACT",
                    "code": "CONTRACT_1Y",
                    "title": "Khuyến mãi chuyển sang Hợp đồng 1 năm",
                    "desc": "Theo mô phỏng AI, việc khách hàng cam kết gia hạn 12 tháng sẽ làm thay đổi mạnh nhất ý định rời bỏ.",
                    "impactValue": reduction,
                    "simulatedProb": sim_prob_percent
                })

        # Giả thuyết 2: Thêm Dịch vụ Hỗ trợ Kỹ thuật
        if input_dict.get('TechSupport') == 'No':
            sim_dict = input_dict.copy()
            sim_dict['TechSupport'] = 'Yes'
            sim_prob = self._get_prediction_prob(sim_dict)
            sim_prob_percent = round(sim_prob * 100, 2)
            reduction = round(current_prob_percent - sim_prob_percent, 2)
            
            if reduction > 1.0:
                recommendations.append({
                    "id": "ACT_TECH",
                    "code": "FREE_TECH_6M",
                    "title": "Tặng miễn phí Tech Support VIP (6 tháng)",
                    "desc": "Cung cấp hỗ trợ kỹ thuật kịp thời giúp giảm bớt trở ngại trải nghiệm và rủi ro rời bỏ.",
                    "impactValue": reduction,
                    "simulatedProb": sim_prob_percent
                })

        # Giả thuyết 3: Giảm cước phí 10 USD
        sim_dict_discount = input_dict.copy()
        current_charge = float(sim_dict_discount.get('MonthlyCharges', 0))
        if current_charge > 20: # Chỉ giảm nếu cước đang cao
            sim_dict_discount['MonthlyCharges'] = max(0, current_charge - 10.0)
            sim_prob_discount = self._get_prediction_prob(sim_dict_discount)
            sim_prob_percent_discount = round(sim_prob_discount * 100, 2)
            reduction_discount = round(current_prob_percent - sim_prob_percent_discount, 2)
            
            if reduction_discount > 1.0:
                recommendations.append({
                    "id": "ACT_DISCOUNT",
                    "code": "DISCOUNT_10USD",
                    "title": "Tặng Voucher giảm giá $10",
                    "desc": "Giảm áp lực cước phí hàng tháng giúp tăng độ hài lòng về mặt tài chính.",
                    "impactValue": reduction_discount,
                    "simulatedProb": sim_prob_percent_discount
                })

        # Fallback nếu model không tìm thấy thay đổi nào đáng kể
        if not recommendations:
            recommendations.append({
                "id": "ACT_FALLBACK",
                "code": "VIP_CARE",
                "title": "Chương trình Tri ân Khách hàng",
                "desc": "Tặng gói nâng cấp băng thông Internet trong 3 tháng để chăm sóc tiêu chuẩn.",
                "impactValue": 5.0, # Mức giảm giả định tối thiểu cho fallback
                "simulatedProb": max(0, round(current_prob_percent - 5.0, 2))
            })

        # Xếp hạng phương án theo số điểm rủi ro giảm được nhiều nhất
        recommendations.sort(key=lambda x: x['impactValue'], reverse=True)

        return {
            "is_churn": prediction,
            "churn_probability_percent": current_prob_percent,
            "risk_level": "High" if prob > 0.7 else ("Medium" if prob > self.threshold else "Low"),
            "shap_values": shap_dict,
            "recommendations": recommendations[:3] # Giới hạn hiển thị 3 kịch bản tốt nhất
        }
    
    def get_dashboard_summary(self):
      """Đọc file CSV trong thư mục data và tính toán dữ liệu tổng quan cho Dashboard"""
      data_path = os.path.join(
          BASE_DIR, "data", "WA_Fn-UseC_-Telco-Customer-Churn.csv"
      )

      if not os.path.exists(data_path):
        return {"error": f"Không tìm thấy file CSV tại {data_path}"}

      df = pd.read_csv(data_path)
      df_transformed = self.preprocess_data(df)
      probs = self.model.predict_proba(df_transformed)[:, 1]

      df["churn_probability"] = (probs * 100).round(2)
      df["risk_level"] = df["churn_probability"].apply(
          lambda p: (
              "High"
              if p > 70
              else ("Medium" if p >= self.threshold * 100 else "Low")
          )
      )

      total_customers = len(df)
      high_risk_df = df[df["risk_level"] == "High"]
      high_risk_count = len(high_risk_df)
      med_risk_count = len(df[df["risk_level"] == "Medium"])
      low_risk_count = len(df[df["risk_level"] == "Low"])

      monthly_charges = pd.to_numeric(
          df["MonthlyCharges"], errors="coerce"
      ).fillna(0)
      revenue_at_risk = monthly_charges[df["risk_level"] == "High"].sum()

      select_cols = [
          c for c in [
              "customerID", "tenure", "Contract", "MonthlyCharges", "churn_probability", "risk_level",
          ] if c in df.columns
      ]
      top_risk_customers = (
          df.sort_values(by="churn_probability", ascending=False)
          .head(10)[select_cols]
          .to_dict(orient="records")
      )

      return {
          "summary": {
              "total_customers": total_customers,
              "high_risk_count": high_risk_count,
              "medium_risk_count": med_risk_count,
              "low_risk_count": low_risk_count,
              "churn_rate_percent": (
                  round((high_risk_count / total_customers) * 100, 2)
                  if total_customers > 0 else 0
              ),
              "monthly_revenue_at_risk": round(float(revenue_at_risk), 2),
          },
          "top_risk_customers": top_risk_customers,
      }    

# Khởi tạo instance duy nhất
model_service = ModelService()