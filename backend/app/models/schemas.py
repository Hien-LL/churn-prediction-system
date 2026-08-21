from pydantic import BaseModel

class CustomerInput(BaseModel):
    tenure: int
    MonthlyCharges: float
    TotalCharges: float
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str

class PredictionOutput(BaseModel):
    is_churn: bool
    churn_probability_percent: float
    risk_level: str