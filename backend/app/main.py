from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import router từ file app/api/router.py
from app.api.router import router as api_router

# Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="Telco Customer Churn Prediction API",
    description="API dự đoán tỉ lệ rời bỏ của khách hàng dựa trên mô hình RandomForest.",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)

# Gắn router đã tạo vào ứng dụng gốc, thêm tiền tố /api/v1
app.include_router(api_router, prefix="/api/v1", tags=["Prediction"])

# Endpoint kiểm tra sức khỏe của Server (Health Check)
@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "success",
        "message": "Backend API đang hoạt động bình thường!",
        "docs_url": "/docs" # Đường dẫn tới trang test API tự động
    }