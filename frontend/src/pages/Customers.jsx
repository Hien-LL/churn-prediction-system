import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RotateCcw, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChurnRiskBadge from '../components/common/ChurnRiskBadge';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();

  // --- STATE QUẢN LÝ DỮ LIỆU TỪ API ---
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- STATE QUẢN LÝ PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10; // Số lượng khách hàng mỗi trang

  // --- STATE QUẢN LÝ BỘ LỌC (Local Filtering) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [riskLevel, setRiskLevel] = useState('All');
  const [contractType, setContractType] = useState('All');
  const [internetService, setInternetService] = useState('All');

  // 1. HÀM GỌI API LẤY DỮ LIỆU TỪ FASTAPI
  const fetchCustomers = async (page) => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * recordsPerPage;
      // Gọi API đến Backend FastAPI bạn vừa viết
      const response = await axios.get(`http://127.0.0.1:8000/api/v1/customers`, {
        params: {
          limit: recordsPerPage,
          skip: skip
        }
      });
      
      setCustomers(response.data.customers);
      setTotalRecords(response.data.total);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu khách hàng:", err);
      setError("Không thể kết nối đến Backend. Đảm bảo FastAPI đang chạy tại http://127.0.0.1:8000");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. CHẠY GỌI API MỖI KHI ĐỔI TRANG (currentPage)
  useEffect(() => {
    fetchCustomers(currentPage);
  }, [currentPage]);

  // 3. HÀM RESET BỘ LỌC
  const handleResetFilters = () => {
    setSearchTerm('');
    setRiskLevel('All');
    setContractType('All');
    setInternetService('All');
    setCurrentPage(1); // Quay về trang 1 khi reset
  };

  // 4. LỌC DỮ LIỆU (Trên những khách hàng đang hiển thị ở trang hiện tại)
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskLevel === 'All' || customer.riskLevel === riskLevel;
    const matchesContract = contractType === 'All' || customer.contractType === contractType;
    const matchesInternet = internetService === 'All' || customer.internetService === internetService;
    return matchesSearch && matchesRisk && matchesContract && matchesInternet;
  });

  // 5. TÍNH TOÁN SỐ TRANG
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="customers-container">
      {/* --- HEADER --- */}
      <div className="customers-header">
        <h1>Customers</h1>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search customer ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- THANH BỘ LỌC --- */}
      <div className="filter-card">
        <div className="filter-group">
          <label>Risk Level</label>
          <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Contract Type</label>
          <select value={contractType} onChange={(e) => setContractType(e.target.value)}>
            <option value="All">All</option>
            <option value="Month-to-month">Month-to-month</option>
            <option value="One year">One year</option>
            <option value="Two year">Two year</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Internet Service</label>
          <select value={internetService} onChange={(e) => setInternetService(e.target.value)}>
            <option value="All">All</option>
            <option value="Fiber optic">Fiber optic</option>
            <option value="DSL">DSL</option>
            <option value="No">No</option>
          </select>
        </div>
        <button className="reset-btn" onClick={handleResetFilters}>
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {/* --- BẢNG DỮ LIỆU --- */}
      <div className="table-card">
        {error && (
          <div style={{ padding: '20px', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <table className="customer-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Tenure (months)</th>
              <th>Churn Probability</th>
              <th>Risk Level</th>
              <th>Top Driver</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <Loader2 className="spinner" size={32} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6', margin: '0 auto' }} />
                  <p style={{ marginTop: '12px', color: '#64748b' }}>Đang tải dữ liệu từ server...</p>
                  <style>
                    {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                  </style>
                </td>
              </tr>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td style={{ fontWeight: '600' }}>{customer.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.tenure}</td>
                  <td>{customer.churnProbability}%</td>
                  <td>
                    <ChurnRiskBadge level={customer.riskLevel} />
                  </td>
                  <td>{customer.topDriver}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="action-btn"
                      title="View Details & Predict"
                      onClick={() => navigate('/predict', { state: { customer } })}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#eff6ff',
                        color: '#3b82f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Không tìm thấy khách hàng nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* --- PHÂN TRANG THẬT TỪ API --- */}
        {!isLoading && totalRecords > 0 && (
          <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              Hiển thị <strong>{((currentPage - 1) * recordsPerPage) + 1}</strong> đến <strong>{Math.min(currentPage * recordsPerPage, totalRecords)}</strong> trong tổng số <strong>{totalRecords}</strong> khách hàng
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="page-btn" 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
                style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <button className="page-btn active" style={{ fontWeight: 'bold', backgroundColor: '#3b82f6', color: 'white' }}>
                {currentPage}
              </button>
              
              <span style={{ display: 'flex', alignItems: 'center', margin: '0 4px', color: '#94a3b8' }}>/</span>
              
              <button className="page-btn" style={{ pointerEvents: 'none' }}>
                {totalPages}
              </button>
              
              <button 
                className="page-btn" 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;