// frontend/src/services/api.js

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export const predictCustomerChurn = async (customerData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status}`);
        }

        const data = await response.json();
        return data; // Kết quả trả về chứa { is_churn, churn_probability_percent, risk_level }
    } catch (error) {
        console.error("Lỗi khi gọi API dự đoán:", error);
        throw error;
    }
};