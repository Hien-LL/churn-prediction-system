from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    CustomerInput,
    PredictionOutput,
    DashboardResponse,
)
from app.services.predictor import model_service

router = APIRouter()

@router.get(
    "/dashboard-summary",
    # response_model=DashboardResponse, # Tạm ẩn để trả về dictionary tự do khớp với UI
    summary="Lấy dữ liệu tổng quan cho Dashboard từ CSV",
)
def get_dashboard_summary():
    try:
        # 1. Lấy dữ liệu thực từ service
        raw_data = model_service.get_dashboard_summary()
        
        # Chuyển Pydantic model thành Dictionary (nếu cần)
        if hasattr(raw_data, "model_dump"):
            data_dict = raw_data.model_dump()
        elif hasattr(raw_data, "dict"):
            data_dict = raw_data.dict()
        else:
            data_dict = raw_data

        # 2. Xử lý an toàn: Lấy số liệu thực tế, nếu Backend chưa tính thì để fallback mặc định
        total_cust = data_dict.get("total_customers", 7043)
        churn_rate = data_dict.get("churn_rate", 26.5)
        high_risk = data_dict.get("high_risk_count", 1869)
        
        # 3. Format lại thành cấu trúc JSON chuẩn xác mà UI Dashboard.jsx đang chờ
        formatted_response = {
            "stats": {
                "totalCustomers": {"value": f"{total_cust:,}", "change": "+2.5%"},
                "highRiskCustomers": {"value": f"{high_risk:,}", "change": "-1.2%"},
                "churnRate": {"value": f"{churn_rate}%", "change": "-0.5%"},
                "retentionRate": {"value": f"{100 - churn_rate:.1f}%", "change": "+0.5%"}
            },
            # Nếu model_service có mảng này thì dùng, không thì trả về mock để UI vẽ được biểu đồ
            "churnOverTime": data_dict.get("churn_over_time", [
                {"month": "Jan", "churnRate": 28.0, "retentionRate": 72.0},
                {"month": "Feb", "churnRate": 27.5, "retentionRate": 72.5},
                {"month": "Mar", "churnRate": 27.0, "retentionRate": 73.0},
                {"month": "Apr", "churnRate": 26.8, "retentionRate": 73.2},
                {"month": "May", "churnRate": 26.5, "retentionRate": 73.5}
            ]),
            "churnByContract": data_dict.get("churn_by_contract", [
                {"name": "Month-to-month", "percentage": 55, "color": "#ef4444"},
                {"name": "One year", "percentage": 25, "color": "#f59e0b"},
                {"name": "Two year", "percentage": 20, "color": "#10b981"}
            ]),
            "topChurnDrivers": data_dict.get("top_churn_drivers", [
                {"driver": "Month-to-month Contract", "impact": 0.28},
                {"driver": "High Monthly Charges", "impact": 0.15},
                {"driver": "No Tech Support", "impact": 0.12},
                {"driver": "Fiber Optic Internet", "impact": 0.10}
            ]),
            "recentHighRisk": data_dict.get("recent_high_risk", [
                {"id": "CUST-8273", "churnProbability": 88, "topDriver": "Month-to-month"},
                {"id": "CUST-9122", "churnProbability": 85, "topDriver": "High Charges"},
                {"id": "CUST-3341", "churnProbability": 82, "topDriver": "No Tech Support"},
                {"id": "CUST-1198", "churnProbability": 79, "topDriver": "Fiber Optic"}
            ])
        }
        
        return formatted_response

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Lỗi khi xử lý dữ liệu Dashboard: {str(e)}"
        )


@router.post(
    "/predict",
    response_model=PredictionOutput,
    summary="Dự đoán tỉ lệ rời bỏ của khách hàng",
)
def predict_churn(data: CustomerInput):
    """Nhận thông tin khách hàng và trả về dự đoán Churn (rời bỏ)."""
    try:
        input_dict = data.model_dump()
        result = model_service.predict(input_dict)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi hệ thống trong quá trình dự đoán: {str(e)}",
        )