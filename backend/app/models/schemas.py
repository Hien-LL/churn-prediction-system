from pydantic import BaseModel, Field
from typing import Union

class CustomerInput(BaseModel):
    # --- Numerical Features (4 cột) ---
    SeniorCitizen: int = Field(..., description="1 if customer is a senior citizen, 0 otherwise")
    tenure: int = Field(..., description="Number of months the customer has stayed with the company")
    MonthlyCharges: float = Field(..., description="The amount charged to the customer monthly")
    
    # Dùng Union[float, str] vì đôi khi dataset thô có dấu khoảng trắng (" ") cho TotalCharges
    TotalCharges: Union[float, str] = Field(..., description="The total amount charged to the customer")

    # --- Categorical Features (15 cột) ---
    gender: str = Field(..., description="Female or Male")
    Partner: str = Field(..., description="Yes or No")
    Dependents: str = Field(..., description="Yes or No")
    PhoneService: str = Field(..., description="Yes or No")
    MultipleLines: str = Field(..., description="Yes, No, or No phone service")
    InternetService: str = Field(..., description="DSL, Fiber optic, or No")
    OnlineSecurity: str = Field(..., description="Yes, No, or No internet service")
    OnlineBackup: str = Field(..., description="Yes, No, or No internet service")
    DeviceProtection: str = Field(..., description="Yes, No, or No internet service")
    TechSupport: str = Field(..., description="Yes, No, or No internet service")
    StreamingTV: str = Field(..., description="Yes, No, or No internet service")
    StreamingMovies: str = Field(..., description="Yes, No, or No internet service")
    Contract: str = Field(..., description="Month-to-month, One year, or Two year")
    PaperlessBilling: str = Field(..., description="Yes or No")
    PaymentMethod: str = Field(..., description="Electronic check, Mailed check, Bank transfer (automatic), or Credit card (automatic)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "SeniorCitizen": 0,
                "tenure": 12,
                "MonthlyCharges": 85.5,
                "TotalCharges": 1026.0,
                "gender": "Female",
                "Partner": "Yes",
                "Dependents": "No",
                "PhoneService": "Yes",
                "MultipleLines": "No",
                "InternetService": "Fiber optic",
                "OnlineSecurity": "No",
                "OnlineBackup": "Yes",
                "DeviceProtection": "No",
                "TechSupport": "Yes",
                "StreamingTV": "Yes",
                "StreamingMovies": "No",
                "Contract": "Month-to-month",
                "PaperlessBilling": "Yes",
                "PaymentMethod": "Electronic check"
            }
        }
    }

class PredictionOutput(BaseModel):
    is_churn: bool = Field(..., description="True if the model predicts the customer will churn based on the threshold")
    churn_probability_percent: float = Field(..., description="The probability of churning in percentage")
    risk_level: str = Field(..., description="Risk category: High, Medium, or Low")