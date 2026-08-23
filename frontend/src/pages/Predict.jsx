import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sliders, Activity, BarChart2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import ChurnRiskBadge from '../components/common/ChurnRiskBadge';
import axios from 'axios';
import './Predict.css';

// === BƯỚC 1: THÊM HÀM RULE ENGINE Ở ĐÂY (Ngoài component Predict) ===
const generateRecommendations = (shapData) => {
  const dynamicActions = [];
  let actionId = 1;

  // Lấy những yếu tố làm TĂNG nguy cơ Churn (isPositive = true)
  const riskDrivers = shapData.filter(item => item.isPositive);

  riskDrivers.forEach(driver => {
    const featureName = driver.feature.toLowerCase();

    // Hợp đồng ngắn hạn
    if (featureName.includes('month-to-month') || featureName.includes('tháng') || featureName.includes('contract')) {
      dynamicActions.push({
        id: actionId++,
        title: 'Khuyến mãi chuyển sang Hợp đồng 1 năm',
        desc: 'Giảm 15% cước phí hàng tháng nếu khách hàng cam kết gia hạn 12 tháng.',
        riskReduction: '-25% Churn Risk',
        impactValue: 25, 
        applied: false
      });
    }
    // Cước phí cao
    else if (featureName.includes('monthly charges') || featureName.includes('cước phí')) {
      dynamicActions.push({
        id: actionId++,
        title: 'Tặng Voucher giảm giá cước',
        desc: 'Giảm trực tiếp $10/tháng trong vòng 3 tháng tiếp theo để giảm áp lực tài chính.',
        riskReduction: '-15% Churn Risk',
        impactValue: 15,
        applied: false
      });
    }
    // Thiếu Tech Support
    else if (featureName.includes('tech support') || featureName.includes('hỗ trợ kỹ thuật')) {
      dynamicActions.push({
        id: actionId++,
        title: 'Tặng miễn phí gói Tech Support (6 tháng)',
        desc: 'Hỗ trợ kỹ thuật VIP 24/7 hoàn toàn miễn phí để cải thiện trải nghiệm.',
        riskReduction: '-12% Churn Risk',
        impactValue: 12,
        applied: false
      });
    }
    // Thanh toán check thủ công
    else if (featureName.includes('electronic check') || featureName.includes('payment')) {
      dynamicActions.push({
        id: actionId++,
        title: 'Hướng dẫn đăng ký Thanh toán tự động',
        desc: 'Tặng ngay $5 vào tài khoản khi khách hàng liên kết thẻ Visa/Mastercard tự động.',
        riskReduction: '-5% Churn Risk',
        impactValue: 5,
        applied: false
      });
    }
  });

  // Nếu không có rule nào match, hiển thị mặc định
  if (dynamicActions.length === 0) {
    dynamicActions.push({
      id: actionId++,
      title: 'Chương trình Tri ân Khách hàng VIP',
      desc: 'Tặng gói nâng cấp băng thông Internet miễn phí hoặc điểm tích lũy đổi quà.',
      riskReduction: '-10% Churn Risk',
      impactValue: 10,
      applied: false
    });
  }

  return dynamicActions.slice(0, 3); // Trả về tối đa 3 gợi ý
};
// ===================================================================

const Predict = () => {
  const location = useLocation();
  const selectedCustomer = location.state?.customer;

  const [hasPredicted, setHasPredicted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      setHasPredicted(false);
    }
  }, [selectedCustomer]);

  const [prediction, setPrediction] = useState({
    churnProbability: 0,
    riskLevel: 'Low',
  });
  const [shapData, setShapData] = useState([]);

  // State actions bắt đầu rỗng, sẽ được điền khi bấm Predict
  const [actions, setActions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setHasPredicted(false);

    try {
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
        tenure: Number(formData.tenure),
        MonthlyCharges: Number(formData.monthlyCharges),
        TotalCharges: Number(formData.totalCharges),
        Contract: formData.contractType,
        InternetService: formData.internetService,
        TechSupport: formData.techSupport,
        PaymentMethod: formData.paymentMethod
      };

      const response = await axios.post('http://127.0.0.1:8000/api/v1/predict', payload);
      const data = response.data;
      
      setPrediction({
        churnProbability: data.churn_probability_percent,
        riskLevel: data.risk_level,
      });

      // Tạm thời dùng mock data cho SHAP
      const mockShapData = [
        { feature: 'Month-to-month Contract', impact: +28, isPositive: true },
        { feature: `Monthly Charges ($${formData.monthlyCharges})`, impact: +22, isPositive: true },
        { feature: `Tenure (${formData.tenure} months)`, impact: +18, isPositive: true },
        { feature: 'No Tech Support', impact: +12, isPositive: true },
        { feature: 'Electronic check payment', impact: +8, isPositive: true },
      ];
      
      setShapData(mockShapData);

      // === BƯỚC 2: GỌI HÀM SINH ĐỀ XUẤT ĐỘNG Ở ĐÂY ===
      const dynamicRecommendations = generateRecommendations(mockShapData);
      setActions(dynamicRecommendations);
      // ==============================================

      setHasPredicted(true);
    } catch (error) {
      console.error("Lỗi khi gọi API dự đoán:", error);
      alert("Không thể kết nối đến Backend FastAPI. Vui lòng kiểm tra server.");
    } finally {
      setIsLoading(false);
    }
  };

  // === BƯỚC 3: CẬP NHẬT HÀM APPLY ACTION ===
  const handleApplyAction = (id) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, applied: true } : a));
    
    // Tìm action để lấy impactValue trừ đi
    const appliedAction = actions.find(a => a.id === id);
    if (appliedAction) {
      setPrediction(prev => {
        // Trừ đi % rủi ro, không cho giảm dưới 5%
        const newProb = Math.max(5, prev.churnProbability - appliedAction.impactValue);
        return {
          churnProbability: newProb,
          riskLevel: newProb >= 70 ? 'High' : newProb >= 40 ? 'Medium' : 'Low',
        };
      });
    }
  };
  // =========================================

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
        {/* CỘT 1: FORM */}
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

        {/* CỘT 2 & 3 */}
        {hasPredicted && (
          <>
            <div className="predict-col flex flex-col gap-4">
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