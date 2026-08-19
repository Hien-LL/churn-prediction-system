from fastapi import APIRouter
from app.models.schemas import CustomerData, PredictionResponse
from app.services.ml_service import predict_churn

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
def predict_customer_churn(data: CustomerData):
    # Chuyển Pydantic model thành dictionary
    customer_dict = data.dict()
    
    # Gọi hàm dự đoán từ ml_service
    result = predict_churn(customer_dict)
    
    return result