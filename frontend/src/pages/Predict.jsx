import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sliders, Activity, BarChart2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import ChurnRiskBadge from '../components/common/ChurnRiskBadge';
import './Predict.css';

const Predict = () => {
  const location = useLocation();
  const selectedCustomer = location.state?.customer;

  // 1. State Quản lý Form Nhập Liệu
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

  // Tự động điền dữ liệu nếu chuyển sang từ trang Customers
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
    }
  }, [selectedCustomer]);

  // 2. State Kết quả Dự đoán & SHAP Values
  const [prediction, setPrediction] = useState({
    churnProbability: selectedCustomer ? selectedCustomer.churnProbability : 91,
    riskLevel: selectedCustomer ? selectedCustomer.riskLevel : 'High',
  });

  // Dữ liệu mô phỏng SHAP Values (Yếu tố ảnh hưởng)
  const [shapData, setShapData] = useState([
    { feature: 'Month-to-month Contract', impact: +28, isPositive: true },
    { feature: 'High Monthly Charges ($85.5)', impact: +22, isPositive: true },
    { feature: 'Low Tenure (2 months)', impact: +18, isPositive: true },
    { feature: 'No Tech Support Service', impact: +12, isPositive: true },
    { feature: 'Fiber Optic Service', impact: +8, isPositive: true },
    { feature: 'Automatic Payment Disabled', impact: -5, isPositive: false },
  ]);

  // Danh sách đề xuất Retain Action
  const [actions, setActions] = useState([
    {
      id: 1,
      title: 'Khuyến mãi chuyển sang Hợp đồng 1 năm',
      desc: 'Giảm 15% cước phí hàng tháng nếu khách hàng cam kết gia hạn 12 tháng.',
      riskReduction: '-25% Churn Risk',
      applied: false,
    },
    {
      id: 2,
      title: 'Tặng miễn phí gói Tech Support (6 tháng)',
      desc: 'Hỗ trợ kỹ thuật 24/7 giúp tăng độ hài lòng cho gói Fiber Optic.',
      riskReduction: '-12% Churn Risk',
      applied: false,
    },
    {
      id: 3,
      title: 'Hướng dẫn đăng ký Thanh toán tự động',
      desc: 'Tặng 5$ cước tháng đầu khi liên kết thẻ ngân hàng/chuyển khoản tự động.',
      riskReduction: '-5% Churn Risk',
      applied: false,
    },
  ]);

  // Handler xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler Chạy Mô hình Dự đoán
  const handlePredict = (e) => {
    e.preventDefault();
    // Logic tính toán mô phỏng khi người dùng bấm Re-predict
    let calculatedProb = 50;
    if (formData.contractType === 'Month-to-month') calculatedProb += 25;
    if (formData.contractType === 'Two year') calculatedProb -= 30;
    if (Number(formData.tenure) < 6) calculatedProb += 15;
    if (formData.techSupport === 'No') calculatedProb += 10;

    calculatedProb = Math.min(Math.max(calculatedProb, 5), 98);
    
    let level = 'Low';
    if (calculatedProb >= 70) level = 'High';
    else if (calculatedProb >= 40) level = 'Medium';

    setPrediction({
      churnProbability: calculatedProb,
      riskLevel: level,
    });
  };

  // Handler áp dụng hành động giữ chân
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

  // Cấu hình dữ liệu cho Biểu đồ Bán nguyệt (Risk Gauge)
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
      {/* Header Trang */}
      <div className="predict-header">
        <h1>Customer Churn Prediction & Analysis</h1>
        <p>Phân tích chi tiết nguy cơ rời đi và mô phỏng các phương án giữ chân cho {formData.name} ({formData.customerId})</p>
      </div>

      <div className="predict-grid">
        {/* CỘT TRÁI: FORM NHẬP LIỆU BỘ THAM SỐ */}
        <div className="predict-card">
          <h3 className="predict-card-title">
            <Sliders size={20} className="text-blue-600" />
            Customer Features Input
          </h3>

          <form onSubmit={handlePredict}>
            <div className="form-grid">
              <div className="form-group">
                <label>Tenure (Months)</label>
                <input
                  type="number"
                  name="tenure"
                  value={formData.tenure}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Contract Type</label>
                <select name="contractType" value={formData.contractType} onChange={handleChange}>
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div className="form-group">
                <label>Monthly Charges ($)</label>
                <input
                  type="number"
                  step="0.1"
                  name="monthlyCharges"
                  value={formData.monthlyCharges}
                  onChange={handleChange}
                />
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

            <button type="submit" className="predict-btn">
              <Activity size={18} />
              Run Prediction Model
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: PHÂN TÍCH KẾT QUẢ, SHAP & RETENTION */}
        <div>
          {/* 1. Risk Gauge Card (Biểu đồ bán nguyệt) */}
          <div className="predict-card">
            <h3 className="predict-card-title">
              <ShieldAlert size={20} />
              Churn Risk Score
            </h3>

            <div className="gauge-wrapper">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="80%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell fill={getGaugeColor(prediction.riskLevel)} />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="gauge-center-info">
                <div className="gauge-percentage">{prediction.churnProbability}%</div>
                <div className="gauge-subtitle">
                  <ChurnRiskBadge level={prediction.riskLevel} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. SHAP Feature Contribution Chart */}
          <div className="predict-card">
            <h3 className="predict-card-title">
              <BarChart2 size={20} />
              SHAP Explanation (Top Risk Drivers)
            </h3>

            <div className="shap-list">
              {shapData.map((item, index) => (
                <div key={index} className="shap-item">
                  <div className="shap-label">
                    <span>{item.feature}</span>
                    <span className={`shap-impact ${item.isPositive ? 'positive' : 'negative'}`}>
                      {item.isPositive ? `+${item.impact}%` : `${item.impact}%`}
                    </span>
                  </div>
                  <div className="shap-bar-bg">
                    <div
                      className="shap-bar-fill"
                      style={{
                        width: `${Math.abs(item.impact) * 2.5}%`,
                        backgroundColor: item.isPositive ? '#ef4444' : '#10b981',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Retention Action Recommendations */}
          <div className="predict-card">
            <h3 className="predict-card-title">
              <Sparkles size={20} />
              Recommended Retention Actions
            </h3>

            <div className="action-cards-list">
              {actions.map((act) => (
                <div key={act.id} className="action-card-item">
                  <div className="action-info">
                    <h4>{act.title}</h4>
                    <p>{act.desc}</p>
                    <span className="action-badge">{act.riskReduction}</span>
                  </div>

                  <button
                    className="apply-action-btn"
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
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} color="#16a34a" /> Applied
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
      </div>
    </div>
  );
};

export default Predict;