from pathlib import Path

import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router as api_router
from app.services.predictor import model_service


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Telco Customer Churn Prediction API",
    description="API dự đoán tỉ lệ rời bỏ của khách hàng dựa trên RandomForest.",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTER CHÍNH
# ============================================================

app.include_router(
    api_router,
    prefix="/api/v1",
    tags=["Prediction"]
)


# ============================================================
# TÌM FILE CSV
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

CSV_PATH_1 = (
    BASE_DIR
    / "data"
    / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
)

CSV_PATH_2 = (
    BASE_DIR
    / "app"
    / "data"
    / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
)

CSV_PATH_3 = (
    BASE_DIR.parent
    / "data"
    / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
)

if CSV_PATH_1.exists():
    CSV_FILE = CSV_PATH_1
elif CSV_PATH_2.exists():
    CSV_FILE = CSV_PATH_2
elif CSV_PATH_3.exists():
    CSV_FILE = CSV_PATH_3
else:
    CSV_FILE = BASE_DIR / "data" / "WA_Fn-UseC_-Telco-Customer-Churn.csv"


# ============================================================
# ĐỌC CSV
# ============================================================

try:
    df_customers = pd.read_csv(CSV_FILE)

    print(
        f"✅ Đã tải {len(df_customers)} khách hàng từ: "
        f"{CSV_FILE}"
    )

except Exception as e:
    df_customers = pd.DataFrame()

    print(
        f"❌ Không thể đọc CSV tại: {CSV_FILE}"
    )
    print(f"❌ Lỗi: {e}")


# ============================================================
# API: CUSTOMERS
# ============================================================

@app.get(
    "/api/v1/customers",
    tags=["Customers"]
)
def get_customers(
    limit: int = Query(50, ge=1, le=7050),
    skip: int = Query(0, ge=0)
):
    """
    Lấy danh sách khách hàng cho Customers.jsx.

    churnProbability được tính bằng chính
    rf_churn_model.pkl thông qua model_service.

    Không sử dụng cột Churn của CSV để giả lập probability.
    """

    if df_customers.empty:
        return {
            "total": 0,
            "skip": skip,
            "limit": limit,
            "customers": []
        }

    # --------------------------------------------------------
    # PHÂN TRANG
    # --------------------------------------------------------

    records = df_customers.iloc[
        skip: skip + limit
    ].copy()

    customers_list = []

    # --------------------------------------------------------
    # XỬ LÝ TỪNG KHÁCH HÀNG
    # --------------------------------------------------------

    for _, row in records.iterrows():

        customer_id = str(row["customerID"])

        # ====================================================
        # TẠO INPUT CHO MODEL
        # ====================================================

        model_input = row.to_dict()

        # Không đưa label thật vào model
        model_input.pop("Churn", None)

        # customerID chỉ là định danh
        model_input.pop("customerID", None)

        # ====================================================
        # ÉP KIỂU
        # ====================================================

        try:
            model_input["SeniorCitizen"] = int(
                model_input["SeniorCitizen"]
            )
        except Exception:
            model_input["SeniorCitizen"] = 0

        try:
            model_input["tenure"] = int(
                model_input["tenure"]
            )
        except Exception:
            model_input["tenure"] = 0

        try:
            model_input["MonthlyCharges"] = float(
                model_input["MonthlyCharges"]
            )
        except Exception:
            model_input["MonthlyCharges"] = 0.0

        try:
            model_input["TotalCharges"] = float(
                model_input["TotalCharges"]
            )
        except Exception:
            model_input["TotalCharges"] = None

        # ====================================================
        # CHẠY CÙNG MODEL VỚI PREDICT
        # ====================================================

        try:

            probability = model_service._get_prediction_prob(
                model_input
            )

            churn_probability = round(
                probability * 100,
                2
            )

            # Risk giống predictor.py hiện tại
            if probability > 0.7:
                risk_level = "High"
            elif probability > model_service.threshold:
                risk_level = "Medium"
            else:
                risk_level = "Low"

            model_prediction = (
                probability >= model_service.threshold
            )

        except Exception as e:

            print(
                f"❌ Lỗi prediction cho "
                f"{customer_id}: {e}"
            )

            churn_probability = 0.0
            risk_level = "Low"
            model_prediction = False

        # ====================================================
        # TOTAL CHARGES
        # ====================================================

        try:
            total_charges = float(row["TotalCharges"])
        except Exception:
            total_charges = 0.0

        # ====================================================
        # TOP DRIVER
        # ====================================================

        if row["Contract"] == "Month-to-month":
            top_driver = "Month-to-month Contract"

        elif row["TechSupport"] == "No":
            top_driver = "No Tech Support"

        elif float(row["MonthlyCharges"]) >= 70:
            top_driver = "High Monthly Charges"

        else:
            top_driver = "Customer Profile"

        # ====================================================
        # OBJECT TRẢ VỀ CHO CUSTOMERS.JSX
        # ====================================================

        customers_list.append({

            "id": customer_id,

            "name": f"Customer {customer_id[:5]}",

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

            "totalCharges": total_charges,

            "paymentMethod": row["PaymentMethod"],

            "techSupport": row["TechSupport"],

            "onlineSecurity": row["OnlineSecurity"],

            "onlineBackup": row["OnlineBackup"],

            "deviceProtection": row["DeviceProtection"],

            "streamingTV": row["StreamingTV"],

            "streamingMovies": row["StreamingMovies"],

            "paperlessBilling": row["PaperlessBilling"],

            # =================================================
            # QUAN TRỌNG:
            # KẾT QUẢ TỪ MODEL, KHÔNG PHẢI CHURN TRONG CSV
            # =================================================

            "churnProbability": churn_probability,

            "riskLevel": risk_level,

            "topDriver": top_driver,

            "modelPrediction": model_prediction
        })

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "total": len(df_customers),
        "skip": skip,
        "limit": limit,
        "customers": customers_list
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get(
    "/",
    tags=["Health Check"]
)
def root():

    return {
        "status": "success",
        "message": "Backend API đang hoạt động bình thường!",
        "docs_url": "/docs"
    }