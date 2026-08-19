from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import router
from app.services.ml_service import load_model

app = FastAPI(title="Telco Churn Prediction API", version="1.0")

# Cấu hình CORS cho Frontend gọi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong thực tế nên đổi "*" thành URL của frontend (VD: http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model ngay khi server khởi động
@app.on_event("startup")
async def startup_event():
    load_model()

# Đăng ký router
app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Backend FastAPI is running!"}