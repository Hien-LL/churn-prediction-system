import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sliders, Activity, BarChart2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import ChurnRiskBadge from '../components/common/ChurnRiskBadge';
import axios from 'axios';
import './Predict.css';

const Predict = () => {
  const location = useLocation();
  const selectedCustomer = location.state?.customer;

  // 1. State kiểm soát hiển thị kết quả (Mặc định ẩn)
  const [hasPredicted, setHasPredicted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2. State Quản lý Form Nhập Liệu
  const [formData, setFormData] = useState({
    customerId: 'CUST_100023',
    name: 'Michael Brown',
    tenure: 2,
    contractType: 'Month-to-month',
    internetService: 'Fiber optic',
    monthlyCharges: 85.50,
    totalCharges: 171.00,
    paymentMethod: 'Electronic check',
    techSupport: 'No',
    onlineSecurity: 'No',
  });

  useEffect(() => {
    if (selectedCustomer) {
      setFormData({
        customerId: selectedCustomer.id || 'CUST_100023',
        name: selectedCustomer.name || 'Michael Brown',
        tenure: selectedCustomer.tenure || 2,
        contractType: selectedCustomer.contractType || 'Month-to-month',
        internetService: selectedCustomer.internetService || 'Fiber optic',
        monthlyCharges: selectedCustomer.monthlyCharges || 85.50,
        totalCharges: selectedCustomer.totalCharges || 171.00,
        paymentMethod: selectedCustomer.paymentMethod || 'Electronic check',
        techSupport: selectedCustomer.techSupport || 'No',
        onlineSecurity: selectedCustomer.onlineSecurity || 'No',
      });
      // Nếu đi từ trang Customer sang, bạn có thể cho hiện kết quả luôn hoặc bắt user bấm. 
      // Ở đây mình vẫn reset để user bấm nút.
      setHasPredicted(false);
    }
  }, [selectedCustomer]);

  // 3. State Kết quả Dự đoán & SHAP Values
  const [prediction, setPrediction] = useState({
    churnProbability: 0,
    riskLevel: 'Low',
  });
  const [shapData, setShapData] = useState([]);

  // Danh sách đề xuất Retain Action (Có thể reset lại khi predict mới)
  const [actions, setActions] = useState([
    { id: 1, title: 'Khuyến mãi chuyển sang Hợp đồng 1 năm', desc: 'Giảm 15% cước phí hàng tháng nếu khách hàng cam kết gia hạn 12 tháng.', riskReduction: '-25% Churn Risk', applied: false },
    { id: 2, title: 'Tặng miễn phí gói Tech Support (6 tháng)', desc: 'Hỗ trợ kỹ thuật 24/7 giúp tăng độ hài lòng cho gói Fiber Optic.', riskReduction: '-12% Churn Risk', applied: false },
    { id: 3, title: 'Hướng dẫn đăng ký Thanh toán tự động', desc: 'Tặng 5$ cước tháng đầu khi liên kết thẻ ngân hàng/chuyển khoản tự động.', riskReduction: '-5% Churn Risk', applied: false },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setHasPredicted(false); // Ẩn kết quả cũ đi khi đang load

    try {
      // Gắn thêm các dữ liệu mặc định để đủ 19 trường gửi cho Backend
      const payload = {
        SeniorCitizen: 0,
        gender: "Female",
        Partner: "Yes",
        Dependents: "No",
        PhoneService: "Yes",
        MultipleLines: "No",
        OnlineSecurity: formData.onlineSecurity || "No",
        OnlineBackup: "Yes",
        DeviceProtection: "No",
        StreamingTV: "Yes",
        StreamingMovies: "No",
        PaperlessBilling: "Yes",
        
        // Các trường lấy từ form người dùng
        tenure: Number(formData.tenure),
        MonthlyCharges: Number(formData.monthlyCharges),
        TotalCharges: Number(formData.totalCharges),
        Contract: formData.contractType,
        InternetService: formData.internetService,
        TechSupport: formData.techSupport,
        PaymentMethod: formData.paymentMethod
      };

      // Lưu ý: URL đổi thành /api/v1/predict theo code backend bạn đã chạy
      const response = await axios.post('http://127.0.0.1:8000/api/v1/predict', payload);
      
      // Dữ liệu thật từ Backend (đã cấu hình ở bước trước)
      const data = response.data;
      
      setPrediction({
        churnProbability: data.churn_probability_percent,
        riskLevel: data.risk_level,
      });

      // *TẠM THỜI*: Vì backend hiện tại chưa trả về SHAP value, ta dùng dữ liệu mock để vẽ biểu đồ
      setShapData([
        { feature: 'Month-to-month Contract', impact: +28, isPositive: true },
        { feature: `Monthly Charges ($${formData.monthlyCharges})`, impact: +22, isPositive: true },
        { feature: `Tenure (${formData.tenure} months)`, impact: +18, isPositive: true },
        { feature: 'No Tech Support', impact: +12, isPositive: true },
        { feature: 'Electronic check payment', impact: +8, isPositive: true },
      ]);

      // Bật cờ hiển thị kết quả
      setHasPredicted(true);

    } catch (error) {
      console.error("Lỗi khi gọi API dự đoán:", error);
      alert("Không thể kết nối đến Backend FastAPI. Vui lòng kiểm tra server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAction = (id) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, applied: true } : a));
    setPrediction(prev => {
      const newProb = Math.max(10, prev.churnProbability - 15);
      return {
        churnProbability: newProb,
        riskLevel: newProb >= 70 ? 'High' : newProb >= 40 ? 'Medium' : 'Low',
      };
    });
  };

  const gaugeData = [
    { name: 'Risk', value: prediction.churnProbability },
    { name: 'Remaining', value: 100 - prediction.churnProbability },
  ];

  const getGaugeColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="predict-container">
      <div className="predict-header">
        <h1>Predict Churn</h1>
      </div>

      <div className="predict-grid">
        {/* ---------------- CỘT 1: FORM NHẬP LIỆU (Luôn hiển thị) ---------------- */}
        <div className="predict-col">
          <div className="predict-card">
            <h3 className="predict-card-title text-blue-600 font-bold">
              <span className="step-number text-blue-600 mr-2">1.</span> Customer Information
            </h3>
            <form onSubmit={handlePredict}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tenure (months)</label>
                  <input type="number" name="tenure" value={formData.tenure} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Contract</label>
                  <select name="contractType" value={formData.contractType} onChange={handleChange}>
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Monthly Charges ($)</label>
                  <input type="number" step="0.1" name="monthlyCharges" value={formData.monthlyCharges} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Internet Service</label>
                  <select name="internetService" value={formData.internetService} onChange={handleChange}>
                    <option value="Fiber optic">Fiber optic</option>
                    <option value="DSL">DSL</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tech Support</label>
                  <select name="techSupport" value={formData.techSupport} onChange={handleChange}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                    <option value="Electronic check">Electronic check</option>
                    <option value="Mailed check">Mailed check</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="Credit card">Credit card</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="predict-btn w-full mt-6 bg-blue-600 text-white p-3 rounded flex justify-center items-center gap-2" disabled={isLoading}>
                <Activity size={18} />
                {isLoading ? 'Processing...' : 'Predict Churn'}
              </button>
            </form>
          </div>
        </div>

        {/* ---------------- CỘT 2 & 3: KẾT QUẢ (Chỉ hiển thị khi có kết quả) ---------------- */}
        {hasPredicted && (
          <>
            {/* CỘT 2: KẾT QUẢ DỰ ĐOÁN & BIỂU ĐỒ SHAP */}
            <div className="predict-col flex flex-col gap-4">
              {/* Step 2 */}
              <div className="predict-card" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}>
                <h3 className="predict-card-title font-bold">
                  <span className="step-number text-blue-600 mr-2">2.</span> Prediction Result
                </h3>
                <div className="text-center py-6">
                  <ShieldAlert size={48} color="#ef4444" className="mx-auto mb-2" />
                  <h2 style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>{prediction.riskLevel.toUpperCase()} RISK</h2>
                  <p>This customer is likely to churn.</p>
                  <h1 style={{ color: '#ef4444', fontSize: '42px', fontWeight: 'bold' }}>{prediction.churnProbability}%</h1>
                  <p className="text-sm font-medium">Churn Probability</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="predict-card flex-grow">
                <h3 className="predict-card-title font-bold">
                  <span className="step-number text-blue-600 mr-2">3.</span> Why is this customer at risk?
                </h3>
                <div className="shap-list mt-4">
                  {shapData.map((item, index) => (
                    <div key={index} className="shap-item mb-3">
                      <div className="shap-label flex justify-between text-sm mb-1">
                        <span>{item.feature}</span>
                        <span className={item.isPositive ? 'text-red-500' : 'text-green-500'}>
                          {item.isPositive ? `+0.${item.impact}` : `-0.${Math.abs(item.impact)}`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded">
                        <div 
                          className={`h-full rounded ${item.isPositive ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.abs(item.impact) * 2}%`, float: item.isPositive ? 'right' : 'left' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CỘT 3: HÀNH ĐỘNG GIỮ CHÂN */}
            <div className="predict-col">
              <div className="predict-card h-full">
                <h3 className="predict-card-title font-bold">
                  <span className="step-number text-blue-600 mr-2">4.</span> Recommended Retention Actions
                </h3>
                <div className="action-cards-list mt-4">
                  {actions.map((act) => (
                    <div key={act.id} className="action-card-item border rounded p-4 mb-4 relative">
                      <div className="action-info">
                        <h4 className="font-bold text-gray-800">{act.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{act.desc}</p>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block mt-2 font-medium">
                          {act.riskReduction}
                        </span>
                      </div>
                      <button
                        className="w-full mt-3 py-2 rounded text-sm font-medium border"
                        disabled={act.applied}
                        onClick={() => handleApplyAction(act.id)}
                        style={{
                          backgroundColor: act.applied ? '#f1f5f9' : '#ffffff',
                          color: act.applied ? '#94a3b8' : '#2563eb',
                          borderColor: act.applied ? '#e2e8f0' : '#2563eb',
                          cursor: act.applied ? 'default' : 'pointer',
                        }}
                      >
                        {act.applied ? (
                          <span className="flex items-center justify-center gap-1">
                            <CheckCircle2 size={16} color="#16a34a" /> Đã áp dụng
                          </span>
                        ) : (
                          'Apply Offer'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Predict;