import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, ShieldAlert, CheckCircle2, RefreshCw, Ticket, TrendingDown, Search, User, ArrowRight } from 'lucide-react';
import ChurnRiskBadge from '../components/common/ChurnRiskBadge';
import axios from 'axios';
import './Predict.css';

const translateFeatureName = (key, form) => {
  const dictionary = {
    'tenure': `Thời gian sử dụng (${form.tenure} tháng)`,
    'MonthlyCharges': `Cước phí hàng tháng ($${form.monthlyCharges})`,
    'TotalCharges': `Tổng cước phí ($${form.totalCharges})`,
    'Contract_Month-to-month': 'Loại hợp đồng (Từng tháng)',
    'Contract_One year': 'Loại hợp đồng (1 Năm)',
    'Contract_Two year': 'Loại hợp đồng (2 Năm)',
    'TechSupport_No': 'Dịch vụ Hỗ trợ Kỹ thuật (Không)',
    'TechSupport_Yes': 'Dịch vụ Hỗ trợ Kỹ thuật (Có)',
    'PaymentMethod_Electronic check': 'Hình thức thanh toán (Electronic check)',
    'InternetService_Fiber optic': 'Dịch vụ Internet (Cáp quang)',
    'OnlineSecurity_No': 'Bảo mật trực tuyến (Không)'
  };
  return dictionary[key] || key; 
};

const Predict = () => {
  const location = useLocation();
  const selectedCustomer = location.state?.customer;

  const [hasPredicted, setHasPredicted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState('');

  const [formData, setFormData] = useState({
    customerId: 'CUST-NEW',
    gender: 'Male',
    tenure: 1,
    contractType: 'Month-to-month',
    internetService: 'Fiber optic',
    monthlyCharges: 50.0,
    totalCharges: 50.0,
    paymentMethod: 'Electronic check',
    techSupport: 'No',
    onlineSecurity: 'No',
  });

  const [prediction, setPrediction] = useState({ churnProbability: 0, riskLevel: 'Low', originalProb: 0 });
  const [shapData, setShapData] = useState([]);
  const [actions, setActions] = useState([]);

  useEffect(() => {
    if (selectedCustomer) {
      populateForm(selectedCustomer);
    }
  }, [selectedCustomer]);

  const populateForm = (data) => {
    setFormData({
      customerId: data.id || data.customerId || data.customerID || 'CUST-NEW',
      gender: data.gender || 'Male',
      tenure: data.tenure || 1,
      contractType: data.contractType || data.Contract || 'Month-to-month',
      internetService: data.internetService || data.InternetService || 'Fiber optic',
      monthlyCharges: data.monthlyCharges || data.MonthlyCharges || 50.0,
      totalCharges: data.totalCharges || data.TotalCharges || 50.0,
      paymentMethod: data.paymentMethod || data.PaymentMethod || 'Electronic check',
      techSupport: data.techSupport || data.TechSupport || 'No',
      onlineSecurity: data.onlineSecurity || data.OnlineSecurity || 'No',
    });
    setSearchId(data.id || data.customerId || data.customerID || '');
    setHasPredicted(false);
  };

  const handleSearchCustomer = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return alert("Vui lòng nhập ID Khách hàng");
    
    setIsSearching(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/v1/customer/${searchId.trim()}`);
      populateForm(response.data);
    } catch (error) {
      alert("Không tìm thấy khách hàng này trong hệ thống. Vui lòng kiểm tra lại ID.");
    } finally {
      setIsSearching(false);
    }
  };

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
        gender: formData.gender,
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
        originalProb: data.churn_probability_percent, // Lưu lại mốc ban đầu để so sánh
        riskLevel: data.risk_level,
      });

      if (data.shap_values) {
        const shapArray = Object.entries(data.shap_values).map(([key, value]) => {
          return {
            featureKey: key, 
            feature: translateFeatureName(key, formData),
            impact: parseFloat((Math.abs(value) * 100).toFixed(1)), 
            isPositive: value > 0, 
            rawValue: value
          };
        });
        setShapData(shapArray.sort((a, b) => Math.abs(b.rawValue) - Math.abs(a.rawValue)).slice(0, 5));
      }
      
      // Lấy trực tiếp danh sách action sinh ra từ AI Backend
      if (data.recommendations) {
        setActions(data.recommendations.map(act => ({ ...act, applied: false })));
      } else {
        setActions([]);
      }
      
      setHasPredicted(true);
    } catch (error) {
      alert("Lỗi kết nối Backend. Hãy thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAction = (id) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, applied: true } : a));
    const appliedAction = actions.find(a => a.id === id);
    if (appliedAction) {
      setPrediction(prev => {
        // Cập nhật tỷ lệ risk đúng bằng con số backend đã mô phỏng
        const newProb = appliedAction.simulatedProb;
        return { 
          ...prev,
          churnProbability: newProb, 
          riskLevel: newProb >= 70 ? 'High' : newProb >= 40 ? 'Medium' : 'Low' 
        };
      });
    }
  };

  return (
    <div className="predict-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="predict-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Counterfactual Engine</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Mô phỏng tác động giảm rủi ro bằng AI sinh giả thuyết (What-if Analysis)</p>
        </div>
        {hasPredicted && (
          <button onClick={() => setHasPredicted(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
            <RefreshCw size={16} /> Phân tích Khách hàng khác
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: hasPredicted ? '420px 1fr' : 'minmax(300px, 750px)', justifyContent: hasPredicted ? 'stretch' : 'center', gap: '24px', transition: 'all 0.4s ease-in-out' }}>
        
        {/* CARD BÊN TRÁI - FORM NHẬP LIỆU */}
        <div className="predict-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Hồ Sơ Khách Hàng</h3>
          </div>

          {/* KHU VỰC TÌM KIẾM THEO ID */}
          <form onSubmit={handleSearchCustomer} style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <User size={16} /> Tìm kiếm Customer ID
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={searchId} 
                onChange={(e) => setSearchId(e.target.value)} 
                placeholder="VD: 7590-VHVEG" 
                style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '2px solid #bfdbfe', fontSize: '14px', outline: 'none' }} 
              />
              <button 
                type="submit" 
                disabled={isSearching}
                style={{ padding: '0 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: isSearching ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
              >
                <Search size={16} /> {isSearching ? 'Đang tìm...' : 'Tìm ID'}
              </button>
            </div>
          </form>

          {/* FORM CHÍNH THỨC */}
          <form onSubmit={handlePredict}>
            <div style={{ display: 'grid', gridTemplateColumns: hasPredicted ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Giới tính</label>
                <select name="gender" value={formData.gender} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="Female">Nữ</option>
                  <option value="Male">Nam</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Thời gian sử dụng (Tháng)</label>
                <input type="number" name="tenure" value={formData.tenure} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Loại hợp đồng</label>
                <select name="contractType" value={formData.contractType} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Cước hàng tháng ($)</label>
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
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Hỗ trợ kỹ thuật</label>
                <select name="techSupport" value={formData.techSupport} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="No">Không (No)</option>
                  <option value="Yes">Có (Yes)</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: hasPredicted ? '1' : '1 / span 2' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Kênh thanh toán</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={{ width: '100%', marginTop: '24px', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
              <Activity size={18} /> {isLoading ? 'AI Đang chạy mô phỏng...' : 'Mô Phỏng Counterfactual'}
            </button>
          </form>
        </div>

        {/* CARD BÊN PHẢI - KẾT QUẢ */}
        {hasPredicted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Cảnh báo Hiện tại</h3>
                </div>
                <div style={{ flex: 1, backgroundColor: prediction.riskLevel === 'High' ? '#fef2f2' : prediction.riskLevel === 'Medium' ? '#fffbeb' : '#f0fdf4', borderRadius: '8px', padding: '20px', textAlign: 'center', border: `1px solid ${prediction.riskLevel === 'High' ? '#fca5a5' : prediction.riskLevel === 'Medium' ? '#fde68a' : '#86efac'}` }}>
                  <ShieldAlert size={40} color={prediction.riskLevel === 'High' ? '#ef4444' : prediction.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>TỶ LỆ CHURN (P)</div>
                  <h1 style={{ fontSize: '42px', fontWeight: '800', margin: '4px 0', color: prediction.riskLevel === 'High' ? '#ef4444' : prediction.riskLevel === 'Medium' ? '#d97706' : '#16a34a' }}>{prediction.churnProbability}%</h1>
                  <ChurnRiskBadge level={prediction.riskLevel} />
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>3</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Thủ phạm (SHAP Drivers)</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shapData.map((item, index) => (
                    <div key={index}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                        <span style={{ color: '#334155' }}>{item.feature}</span>
                        <span style={{ fontWeight: '600', color: item.isPositive ? '#ef4444' : '#10b981' }}>
                          {item.isPositive ? `+${item.impact}` : `-${item.impact}`}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, item.impact * 2.5)}%`, backgroundColor: item.isPositive ? '#ef4444' : '#10b981', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BẢNG ĐỀ XUẤT COUNTERFACTUAL ĐỘNG TỪ AI */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>4</span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Khuyến Nghị (Theo Kết Quả Mô Phỏng)</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {actions.map((act) => (
                  <div key={act.id} style={{ border: act.applied ? '1px solid #86efac' : '1px solid #cbd5e1', backgroundColor: act.applied ? '#f0fdf4' : '#f8fafc', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justify: 'space-between', transition: 'all 0.3s' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Ticket size={12} /> {act.code}
                        </span>
                      </div>

                      {/* Hiển thị con số mô phỏng từ Backend thay vì fix cứng */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', backgroundColor: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>{prediction.originalProb}%</span>
                        <ArrowRight size={14} color="#64748b"/>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>{act.simulatedProb}%</span>
                        <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <TrendingDown size={14} /> -{act.impactValue} pts
                        </span>
                      </div>

                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>{act.title}</h4>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>{act.desc}</p>
                    </div>
                    <button 
                      disabled={act.applied} 
                      onClick={() => handleApplyAction(act.id)} 
                      style={{ marginTop: '16px', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: act.applied ? 'default' : 'pointer', backgroundColor: act.applied ? '#bbf7d0' : '#2563eb', color: act.applied ? '#15803d' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      {act.applied ? <><CheckCircle2 size={16} /> Đã Áp Dụng Giả Thuyết</> : 'Thử Nghiệm Hành Động Này'}
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