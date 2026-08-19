import pickle
import pandas as pd
import os

# Đường dẫn tới file model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../model_files/rf_model.pkl")

# Biến global để lưu model trong bộ nhớ
model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
    else:
        print("Chưa tìm thấy file model. Vui lòng train và đưa vào thư mục model_files/")

def predict_churn(customer: dict):
    # Đảm bảo model đã được load
    if model is None:
        return {"error": "Model is not loaded"}
    
    # Chuyển dữ liệu dictionary thành DataFrame (giống dạng model đã học)
    df = pd.DataFrame([customer])
    
    # Ở đây giả sử model của bạn đã bao gồm cả pipeline (Scaler/Encoder)
    prediction = model.predict(df)
    probability = model.predict_proba(df)[0][1] # Lấy xác suất của class 1 (Churn)
    
    result = "Yes" if prediction[0] == 1 else "No"
    
    return {
        "churn_prediction": result,
        "probability": round(float(probability) * 100, 2),
        "shap_explanation": {"message": "Tính năng SHAP sẽ được tích hợp sau"}
    }