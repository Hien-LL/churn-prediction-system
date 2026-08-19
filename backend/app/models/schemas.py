from pydantic import BaseModel
from typing import Optional

# Dữ liệu khách hàng từ Frontend gửi xuống
class CustomerData(BaseModel):
    gender: str
    SeniorCitizen: int
    Partner: str
    Dependents: str
    tenure: int
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: float

# Dữ liệu Backend trả về Frontend
class PredictionResponse(BaseModel):
    churn_prediction: str       # "Yes" hoặc "No"
    probability: float          # Tỉ lệ phần trăm rời bỏ
    shap_explanation: dict      # (Tùy chọn) Gợi ý giữ chân từ SHAP