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

        # 3. Khởi tạo SHAP Explainer (khởi tạo 1 lần duy nhất để tối ưu tốc độ)
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

    def predict(self, input_dict: dict):
        df_raw = pd.DataFrame([input_dict])
        
        # Tiền xử lý
        df_transformed = self.preprocess_data(df_raw)
        
        # Dự đoán xác suất Churn
        prob = float(self.model.predict_proba(df_transformed)[0][1])
        prediction = bool(prob >= self.threshold)

        # Tính toán SHAP Values
        shap_raw = self.explainer.shap_values(df_transformed)
        
        # Xử lý output SHAP của Random Forest (lấy SHAP value của class Churn = 1)
        if isinstance(shap_raw, list):
            churn_shap = shap_raw[1][0]
        elif isinstance(shap_raw, np.ndarray) and len(shap_raw.shape) == 3:
            churn_shap = shap_raw[0, :, 1]
        else:
            churn_shap = shap_raw[0]

        # Map tên feature với giá trị SHAP tương ứng
        shap_dict = {col: float(val) for col, val in zip(df_transformed.columns, churn_shap)}
        
        

        return {
            "is_churn": prediction,
            "churn_probability_percent": round(prob * 100, 2),
            "risk_level": "High" if prob > 0.7 else ("Medium" if prob > self.threshold else "Low"),
            "shap_values": shap_dict
        }
    
    def get_dashboard_summary(self):
      """Đọc file CSV trong thư mục data và tính toán dữ liệu tổng quan cho Dashboard"""
      data_path = os.path.join(
          BASE_DIR, "data", "WA_Fn-UseC_-Telco-Customer-Churn.csv"
      )

      if not os.path.exists(data_path):
        return {"error": f"Không tìm thấy file CSV tại {data_path}"}

      # 1. Đọc file CSV
      df = pd.read_csv(data_path)

      # 2. Tiền xử lý dữ liệu hàng loạt bằng hàm preprocess_data có sẵn
      df_transformed = self.preprocess_data(df)

      # 3. Dự đoán xác suất rủi ro cho toàn bộ khách hàng
      probs = self.model.predict_proba(df_transformed)[:, 1]

      df["churn_probability"] = (probs * 100).round(2)
      df["risk_level"] = df["churn_probability"].apply(
          lambda p: (
              "High"
              if p > 70
              else ("Medium" if p >= self.threshold * 100 else "Low")
          )
      )

      # 4. Tính toán thống kê tổng quan
      total_customers = len(df)
      high_risk_df = df[df["risk_level"] == "High"]
      high_risk_count = len(high_risk_df)
      med_risk_count = len(df[df["risk_level"] == "Medium"])
      low_risk_count = len(df[df["risk_level"] == "Low"])

      monthly_charges = pd.to_numeric(
          df["MonthlyCharges"], errors="coerce"
      ).fillna(0)
      revenue_at_risk = monthly_charges[df["risk_level"] == "High"].sum()

      # 5. Top 10 khách hàng rủi ro cao nhất
      select_cols = [
          c
          for c in [
              "customerID",
              "tenure",
              "Contract",
              "MonthlyCharges",
              "churn_probability",
              "risk_level",
          ]
          if c in df.columns
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
                  if total_customers > 0
                  else 0
              ),
              "monthly_revenue_at_risk": round(float(revenue_at_risk), 2),
          },
          "top_risk_customers": top_risk_customers,
      }    

# Khởi tạo instance duy nhất
model_service = ModelService()