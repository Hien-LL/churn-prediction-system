import os
import json
import joblib
import pandas as pd

# Đường dẫn tới thư mục model_files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "model_files")

class ModelService:
    def __init__(self):
        # 1. Load các file pkl và json với tên MỚI CHÍNH XÁC
        self.model = joblib.load(os.path.join(MODEL_DIR, "rf_churn_model.pkl"))
        self.encoder = joblib.load(os.path.join(MODEL_DIR, "onehot_encoder.pkl"))
        
        # Đã sửa "modelmetadata.json" thành "model_metadata.json"
        with open(os.path.join(MODEL_DIR, "model_metadata.json"), "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

        # 2. Đọc cấu hình từ JSON
        self.cat_cols = self.metadata["categorical_cols"]
        self.num_cols = self.metadata["numerical_cols"]
        self.expected_features = self.metadata["feature_columns"]
        
        # Ngưỡng cắt (threshold) tối ưu
        self.threshold = self.metadata["threshold"]
        
        # Giá trị điền khuyết cho TotalCharges
        self.median_total_charges = self.metadata["median_total_charges"]

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """ Tiền xử lý dữ liệu đầu vào """
        
        # 1. Xử lý missing value cho TotalCharges 
        df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
        df['TotalCharges'] = df['TotalCharges'].fillna(self.median_total_charges)

        # 2. Tách riêng dữ liệu số và phân loại
        df_num = df[self.num_cols].reset_index(drop=True)
        df_cat = df[self.cat_cols].reset_index(drop=True)

        # 3. One-hot encoding cho dữ liệu phân loại
        encoded_array = self.encoder.transform(df_cat)
        encoded_col_names = self.encoder.get_feature_names_out(self.cat_cols)
        
        df_encoded = pd.DataFrame(encoded_array, columns=encoded_col_names)

        # 4. Ghép lại
        df_processed = pd.concat([df_num, df_encoded], axis=1)

        # 5. Sắp xếp lại thứ tự cột cho khớp 100% với feature_columns trong JSON
        df_final = df_processed.reindex(columns=self.expected_features, fill_value=0)

        return df_final

    def predict(self, input_dict: dict):
        df_raw = pd.DataFrame([input_dict])
        
        # Tiền xử lý
        df_transformed = self.preprocess_data(df_raw)
        
        # Chạy dự đoán (Lấy xác suất của class 1 - Churn)
        prob = float(self.model.predict_proba(df_transformed)[0][1])
        
        # So sánh với ngưỡng 0.4247 thay vì 0.5
        prediction = bool(prob >= self.threshold)

        return {
            "is_churn": prediction,
            "churn_probability_percent": round(prob * 100, 2),
            "risk_level": "High" if prob > 0.7 else ("Medium" if prob > self.threshold else "Low")
        }

# Khởi tạo instance duy nhất
model_service = ModelService()