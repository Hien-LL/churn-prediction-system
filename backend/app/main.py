import os
from pathlib import Path
import pandas as pd
from fastapi import FastAPI, Query
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


# =========================================================================
# ĐỌC VÀ XỬ LÝ DỮ LIỆU TỪ FILE CSV DÀNH CHO TRANG CUSTOMERS
# =========================================================================
# Tự động tìm đường dẫn file CSV dù bạn chạy uvicorn ở bất kỳ thư mục nào
BASE_DIR = Path(__file__).resolve().parent
CSV_PATH_1 = BASE_DIR / "data" / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
CSV_PATH_2 = BASE_DIR / "app" / "data" / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
CSV_PATH_3 = BASE_DIR.parent / "data" / "WA_Fn-UseC_-Telco-Customer-Churn.csv"

if CSV_PATH_1.exists():
    CSV_FILE = CSV_PATH_1
elif CSV_PATH_2.exists():
    CSV_FILE = CSV_PATH_2
elif CSV_PATH_3.exists():
    CSV_FILE = CSV_PATH_3
else:
    CSV_FILE = "data/WA_Fn-UseC_-Telco-Customer-Churn.csv"

try:
    df_customers = pd.read_csv(CSV_FILE)
    print(f"✅ Đã tải thành công {len(df_customers)} khách hàng từ: {CSV_FILE}")
except Exception as e:
    df_customers = pd.DataFrame()
    print(f"⚠️ Chưa tìm thấy file CSV tại {CSV_FILE}. Lỗi: {e}")


@app.get("/api/v1/customers", tags=["Customers"])
def get_customers(limit: int = Query(50, ge=1, le=7050), skip: int = Query(0, ge=0)):
    """
    Lấy danh sách khách hàng từ file CSV để hiển thị lên trang Customers.jsx
    """
    if df_customers.empty:
        return {"total": 0, "customers": []}

    # Lấy phân trang dựa vào skip và limit
    records = df_customers.iloc[skip : skip + limit].copy()
    customers_list = []

    for _, row in records.iterrows():
        # Ép kiểu an toàn cho TotalCharges (tránh lỗi do khoảng trắng trong CSV)
        try:
            total_charge = float(row["TotalCharges"])
        except (ValueError, TypeError):
            total_charge = 0.0

        cust_id = str(row["customerID"])
        is_churn = str(row["Churn"]).strip().lower() == "yes"

        customers_list.append({
            "id": cust_id,
            "name": f"Customer {cust_id[:5]}",
            "gender": row["gender"],
            "seniorCitizen": int(row["SeniorCitizen"]),
            "partner": row["Partner"],
            "dependents": row["Dependents"],
            "tenure": int(row["tenure"]),
            "phoneService": row["PhoneService"],
            "multipleLines": row["MultipleLines"],
            "contractType": row["Contract"],
            "internetService": row["InternetService"],
            "monthlyCharges": float(row["MonthlyCharges"]),
            "totalCharges": total_charge,
            "paymentMethod": row["PaymentMethod"],
            "techSupport": row["TechSupport"],
            "onlineSecurity": row["OnlineSecurity"],
            "onlineBackup": row["OnlineBackup"],
            "deviceProtection": row["DeviceProtection"],
            "streamingTV": row["StreamingTV"],
            "streamingMovies": row["StreamingMovies"],
            "paperlessBilling": row["PaperlessBilling"],
            
            # Tạm thời gán tỷ lệ Churn từ nhãn dữ liệu gốc để hiển thị trên bảng
            "churnProbability": 82 if is_churn else 15,
            "riskLevel": "High" if is_churn else "Low",
            "topDriver": "Month-to-month Contract" if row["Contract"] == "Month-to-month" else "Long Tenure"
        })

    return {
        "total": len(df_customers),
        "skip": skip,
        "limit": limit,
        "customers": customers_list
    }


# Endpoint kiểm tra sức khỏe của Server (Health Check)
@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "success",
        "message": "Backend API đang hoạt động bình thường!",
        "docs_url": "/docs" # Đường dẫn tới trang test API tự động
    }