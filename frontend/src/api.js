// frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // URL của FastAPI backend

export const predictChurn = async (customerData) => {
    try {
        const response = await axios.post(`${API_URL}/predict`, customerData);
        return response.data; // Trả về { churnProbability, shapValues }
    } catch (error) {
        console.error("Lỗi khi gọi API dự đoán:", error);
        throw error;
    }
};