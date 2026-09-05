from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field


# ==========================================
# 1. Prediction Schemas
# ==========================================
class CustomerInput(BaseModel):
  # --- Numerical Features (4 cột) ---
  SeniorCitizen: int = Field(
      ..., description="1 if customer is a senior citizen, 0 otherwise"
  )
  tenure: int = Field(
      ...,
      description="Number of months the customer has stayed with the company",
  )
  MonthlyCharges: float = Field(
      ..., description="The amount charged to the customer monthly"
  )

  # Dùng Union[float, str] vì đôi khi dataset thô có dấu khoảng trắng (" ") cho TotalCharges
  TotalCharges: Union[float, str] = Field(
      ..., description="The total amount charged to the customer"
  )

  # --- Categorical Features (15 cột) ---
  gender: str = Field(..., description="Female or Male")
  Partner: str = Field(..., description="Yes or No")
  Dependents: str = Field(..., description="Yes or No")
  PhoneService: str = Field(..., description="Yes or No")
  MultipleLines: str = Field(..., description="Yes, No, or No phone service")
  InternetService: str = Field(..., description="DSL, Fiber optic, or No")
  OnlineSecurity: str = Field(
      ..., description="Yes, No, or No internet service"
  )
  OnlineBackup: str = Field(..., description="Yes, No, or No internet service")
  DeviceProtection: str = Field(
      ..., description="Yes, No, or No internet service"
  )
  TechSupport: str = Field(..., description="Yes, No, or No internet service")
  StreamingTV: str = Field(..., description="Yes, No, or No internet service")
  StreamingMovies: str = Field(
      ..., description="Yes, No, or No internet service"
  )
  Contract: str = Field(
      ..., description="Month-to-month, One year, or Two year"
  )
  PaperlessBilling: str = Field(..., description="Yes or No")
  PaymentMethod: str = Field(
      ...,
      description=(
          "Electronic check, Mailed check, Bank transfer (automatic), or"
          " Credit card (automatic)"
      ),
  )

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
              "PaymentMethod": "Electronic check",
          }
      }
  }


class RecommendationItem(BaseModel):
    id: str
    code: str
    title: str
    desc: str
    impactValue: float
    simulatedProb: float

class PredictionOutput(BaseModel):
    is_churn: bool = Field(
        ...,
        description="True if the model predicts the customer will churn based on the threshold",
    )
    churn_probability_percent: float = Field(
        ..., description="The probability of churning in percentage"
    )
    risk_level: str = Field(..., description="Risk category: High, Medium, or Low")
    shap_values: Optional[Dict[str, float]] = Field(
        None, description="SHAP feature importances for explanation"
    )
    # Thêm trường này để Backend trả về mảng đề xuất
    recommendations: Optional[List[RecommendationItem]] = Field(
        default=[], description="List of counterfactual recommendations simulated by AI"
    )


# ==========================================
# 2. Dashboard Schemas
# ==========================================
class SummaryMetrics(BaseModel):
  total_customers: int = Field(..., description="Tổng số lượng khách hàng")
  high_risk_count: int = Field(
      ..., description="Số khách hàng có nguy cơ rời bỏ cao"
  )
  medium_risk_count: int = Field(
      ..., description="Số khách hàng có nguy cơ trung bình"
  )
  low_risk_count: int = Field(..., description="Số khách hàng an toàn")
  churn_rate_percent: float = Field(
      ..., description="Tỉ lệ khách hàng rủi ro cao (%)"
  )
  monthly_revenue_at_risk: float = Field(
      ..., description="Doanh thu hàng tháng có nguy cơ thất thoát ($)"
  )


class TopRiskCustomer(BaseModel):
  customerID: str = Field(..., description="Mã khách hàng")
  tenure: int = Field(..., description="Số tháng sử dụng dịch vụ")
  Contract: str = Field(..., description="Loại hợp đồng")
  MonthlyCharges: float = Field(..., description="Cước phí hàng tháng ($)")
  churn_probability: float = Field(..., description="Xác suất rời bỏ (%)")
  risk_level: str = Field(..., description="Mức độ rủi ro (High)")


class DashboardResponse(BaseModel):
  summary: SummaryMetrics
  top_risk_customers: List[TopRiskCustomer]