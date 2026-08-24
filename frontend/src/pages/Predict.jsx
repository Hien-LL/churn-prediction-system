import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, Ticket, TrendingDown } from 'lucide-react';
import ChurnRiskBadge from '../components/common/ChurnRiskBadge';
import axios from 'axios';
import './Predict.css';

// === HÀM RULE ENGINE ĐỀ XUẤT MÃ KHUYẾN MÃI / BỎ TRỢ DỰA TRÊN THỦ PHẠM CHURN ===
const generateRecommendations = (shapData) => {
  const dynamicActions = [];
  let actionId = 1;

  const riskDrivers = shapData.filter(item => item.isPositive);

  riskDrivers.forEach(driver => {
    const featureName = driver.feature.toLowerCase();

    // Hợp đồng ngắn hạn
    if (featureName.includes('month-to-month') || featureName.includes('tháng') || featureName.includes('contract')) {
      dynamicActions.push({
        id: actionId++,
        code: 'CONTRACT_1Y_15',
        title: 'Khuyến mãi chuyển sang Hợp đồng 1 năm',
        desc: 'Giảm 15% cước phí hàng tháng nếu khách hàng cam kết gia hạn hợp đồng 12 tháng.',
        riskReduction: '-25% Rủi ro',
        impactValue: 25, 
        applied: false
      });
    }
    // Cước phí cao
    else if (featureName.includes('monthly charges') || featureName.includes('cước phí')) {
      dynamicActions.push({
        id: actionId++,
        code: 'DISCOUNT_10USD',
        title: 'Tặng Voucher giảm giá cước trực tiếp',
        desc: 'Trừ $10/tháng trực tiếp vào hóa đơn trong 3 tháng liên tiếp.',
        riskReduction: '-15% Rủi ro',
        impactValue: 15,
        applied: false
      });
    }
    // Thiếu Tech Support
    else if (featureName.includes('tech support') || featureName.includes('hỗ trợ')) {
      dynamicActions.push({
        id: actionId++,
        code: 'FREE_TECH_6M',
        title: 'Tặng miễn phí gói Tech Support VIP (6 tháng)',
        desc: 'Hỗ trợ kỹ thuật ưu tiên 24/7 hoàn toàn miễn phí nâng cao trải nghiệm sử dụng.',
        riskReduction: '-12% Rủi ro',
        impactValue: 12,
        applied: false
      });
    }
    // Thanh toán check thủ công
    else if (featureName.includes('electronic check') || featureName.includes('payment')) {
      dynamicActions.push({
        id: actionId++,
        code: 'AUTO_PAY_BONUS',
        title: 'Hướng dẫn đăng ký Auto-Pay (Thanh toán tự động)',
        desc: 'Tặng ngay $5 vào tài khoản khi khách hàng liên kết thẻ tín dụng/ngân hàng.',
        riskReduction: '-5% Rủi ro',
        impactValue: 5,
        applied: false
      });
    }
  });

  if (dynamicActions.length === 0) {
    dynamicActions.push({
      id: actionId++,
      code: 'VIP_TRIAN',
      title: 'Chương trình Tri ân Khách hàng Thân thiết',
      desc: 'Tặng gói nâng cấp băng thông Internet tốc độ cao miễn phí trong 3 tháng.',
      riskReduction: '-10% Rủi ro',
      impactValue: 10,
      applied: false
    });
  }

  return dynamicActions.slice(0, 3);
};

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
  const [actions, setActions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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

      // Tạo SHAP data mô phỏng từ form thực tế
      const mockShapData = [
        { feature: `Loại hợp đồng (${formData.contractType})`, impact: 28, isPositive: formData.contractType === 'Month-to-month' },
        { feature: `Cước phí hàng tháng ($${formData.monthlyCharges})`, impact: 22, isPositive: formData.monthlyCharges > 65 },
        { feature: `Thời gian sử dụng (${formData.tenure} tháng)`, impact: 18, isPositive: formData.tenure < 12 },
        { feature: `Dịch vụ Hỗ trợ Kỹ thuật (${formData.techSupport})`, impact: 12, isPositive: formData.techSupport === 'No' },
        { feature: `Hình thức thanh toán (${formData.paymentMethod})`, impact: 8, isPositive: formData.paymentMethod === 'Electronic check' },
      ];
      
      setShapData(mockShapData);
      setActions(generateRecommendations(mockShapData));
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
    
    const appliedAction = actions.find(a => a.id === id);
    if (appliedAction) {
      setPrediction(prev => {
        const newProb = Math.max(5, prev.churnProbability - appliedAction.impactValue);
        return {
          churnProbability: newProb,
          riskLevel: newProb >= 70 ? 'High' : newProb >= 40 ? 'Medium' : 'Low',
        };
      });
    }
  };

  return (
    <div className="predict-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* HEADER TRANG */}
      <div className="predict-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Predict & Retain Customer Churn</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Dự báo nguy cơ rời bỏ dịch vụ và kích hoạt giải pháp giữ chân khách hàng</p>
        </div>
        {hasPredicted && (
          <button 
            onClick={() => setHasPredicted(false)} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#475569' }}
          >
            <RefreshCw size={16} /> Làm mới Form
          </button>
        )}
      </div>

      {/* DYNAMIC GRID LAYOUT */}
      <div 
        className="predict-main-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: hasPredicted ? '420px 1fr' : 'minmax(300px, 750px)',
          justifyContent: hasPredicted ? 'stretch' : 'center',
          gap: '24px',
          transition: 'all 0.4s ease-in-out'
        }}
      >
        {/* ================= BƯỚC 1: FORM NHẬP THÔNG TIN (LUÔN HIỂN THỊ) ================= */}
        <div className="predict-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Thông Tin Khách Hàng</h3>
          </div>

          <form onSubmit={handlePredict}>
            <div style={{ display: 'grid', gridTemplateColumns: hasPredicted ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Thời gian sử dụng (Tenure - Tháng)</label>
                <input type="number" name="tenure" value={formData.tenure} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Loại hợp đồng (Contract)</label>
                <select name="contractType" value={formData.contractType} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Cước hàng tháng ($ Monthly)</label>
                <input type="number" step="0.1" name="monthlyCharges" value={formData.monthlyCharges} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Dịch vụ Internet</label>
                <select name="internetService" value={formData.internetService} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="DSL">DSL</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Hỗ trợ kỹ thuật (Tech Support)</label>
                <select name="techSupport" value={formData.techSupport} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="No">Không (No)</option>
                  <option value="Yes">Có (Yes)</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Kênh thanh toán</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Credit card">Credit card</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <Activity size={18} />
              {isLoading ? 'Đang phân tích dữ liệu AI...' : 'Chạy Dự Đoán Risk Churn'}
            </button>
          </form>
        </div>

        {/* ================= BƯỚC 2 + 3 + 4: KẾT QUẢ & PHÂN TÍCH (HIỂN THỊ KHI BẤM PREDICT) ================= */}
        {hasPredicted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease' }}>
            
            {/* HÀNG TRÊN: BƯỚC 2 (KẾT QUẢ DỰ BÁO) & BƯỚC 3 (GIẢI THÍCH NGUYÊN NHÂN SHAP) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
              
              {/* BƯỚC 2: KẾT QUẢ DỰ BÁO */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Kết Quả Dự Báo</h3>
                </div>

                <div style={{ flex: 1, backgroundColor: prediction.riskLevel === 'High' ? '#fef2f2' : prediction.riskLevel === 'Medium' ? '#fffbeb' : '#f0fdf4', borderRadius: '8px', padding: '20px', textAlign: 'center', border: `1px solid ${prediction.riskLevel === 'High' ? '#fca5a5' : prediction.riskLevel === 'Medium' ? '#fde68a' : '#86efac'}` }}>
                  <ShieldAlert size={40} color={prediction.riskLevel === 'High' ? '#ef4444' : prediction.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>TỶ LỆ RỜI BỎ (CHURN RISK)</div>
                  <h1 style={{ fontSize: '42px', fontWeight: '800', margin: '4px 0', color: prediction.riskLevel === 'High' ? '#ef4444' : prediction.riskLevel === 'Medium' ? '#d97706' : '#16a34a' }}>
                    {prediction.churnProbability}%
                  </h1>
                  <ChurnRiskBadge level={prediction.riskLevel} />
                </div>
              </div>

              {/* BƯỚC 3: PHÂN TÍCH NGUYÊN NHÂN (SHAP VALUES) */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>3</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Nguyên Nhân Gây Rủi Ro (SHAP)</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shapData.map((item, index) => (
                    <div key={index}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                        <span style={{ color: '#334155' }}>{item.feature}</span>
                        <span style={{ fontWeight: '600', color: item.isPositive ? '#ef4444' : '#10b981' }}>
                          {item.isPositive ? `+${item.impact}% Risk` : `-${item.impact}% Risk`}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${Math.min(100, item.impact * 2.5)}%`, 
                            backgroundColor: item.isPositive ? '#ef4444' : '#10b981',
                            borderRadius: '4px',
                            transition: 'width 0.6s ease'
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* BƯỚC 4: DANH SÁCH KHUYẾN MÃI / KỊCH BẢN GIỮ CHÂN */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>4</span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Đề Xuất Chương Trình Khuyến Mãi Giữ Chân Khách Hàng</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {actions.map((act) => (
                  <div 
                    key={act.id} 
                    style={{ 
                      border: act.applied ? '1px solid #86efac' : '1px solid #cbd5e1', 
                      backgroundColor: act.applied ? '#f0fdf4' : '#f8fafc',
                      borderRadius: '8px', 
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      position: 'relative',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Ticket size={12} /> {act.code}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <TrendingDown size={14} /> {act.riskReduction}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>{act.title}</h4>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>{act.desc}</p>
                    </div>

                    <button
                      disabled={act.applied}
                      onClick={() => handleApplyAction(act.id)}
                      style={{
                        marginTop: '16px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: act.applied ? 'default' : 'pointer',
                        backgroundColor: act.applied ? '#bbf7d0' : '#2563eb',
                        color: act.applied ? '#15803d' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {act.applied ? (
                        <>
                          <CheckCircle2 size={16} /> Đã Kích Hoạt Đề Xuất
                        </>
                      ) : (
                        'Áp Dụng Khuyến Mãi Này'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Predict;