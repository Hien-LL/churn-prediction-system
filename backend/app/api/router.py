from fastapi import APIRouter, HTTPException
from app.models.schemas import CustomerInput, PredictionOutput
from app.services.predictor import model_service

router = APIRouter()


@router.get(
    "/dashboard-summary", summary="Lấy dữ liệu tổng quan cho Dashboard từ CSV"
)
def get_dashboard_summary():
  """Đọc dữ liệu từ file CSV mẫu và trả về các chỉ số thống kê tổng quan cho
  Dashboard.

  - **Summary**: Tổng số khách hàng, số lượng theo từng mức độ rủi ro (High,
  Medium, Low), doanh thu có rủi ro mất.
  - **Top Risk Customers**: Danh sách 10 khách hàng có tỉ lệ rời bỏ cao nhất.
  """
  try:
    return model_service.get_dashboard_summary()
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
  """Nhận thông tin khách hàng và trả về dự đoán Churn (rời bỏ).

  - **data**: JSON payload chứa 19 thông tin (categorical & numerical) của khách
  hàng.
  """
  try:
    # Chuyển Pydantic model (CustomerInput) thành Python Dictionary
    # Lưu ý: Dùng model_dump() cho Pydantic v2 (FastAPI bản mới), nếu lỗi bạn đổi thành dict()
    input_dict = data.model_dump()

    # Gọi hàm xử lý từ model_service
    result = model_service.predict(input_dict)

    # Trả về kết quả khớp với cấu trúc của PredictionOutput
    return result

  except Exception as e:
    # Bắt lỗi và trả về HTTP 500 kèm chi tiết lỗi nếu có sự cố
    raise HTTPException(
        status_code=500,
        detail=f"Lỗi hệ thống trong quá trình dự đoán: {str(e)}",
    )