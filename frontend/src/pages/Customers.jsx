import React, { useState } from 'react';
import { Search, RotateCcw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockCustomers } from '../mockData';
import ChurnRiskBadge from '../components/common/ChurnRiskBadge';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();

  // State quản lý bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [riskLevel, setRiskLevel] = useState('All');
  const [contractType, setContractType] = useState('All');
  const [internetService, setInternetService] = useState('All');

  // Hàm Reset toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSearchTerm('');
    setRiskLevel('All');
    setContractType('All');
    setInternetService('All');
  };

  // Logic lọc danh sách khách hàng dựa trên state
  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskLevel === 'All' || customer.riskLevel === riskLevel;
    const matchesContract = contractType === 'All' || customer.contractType === contractType;
    const matchesInternet = internetService === 'All' || customer.internetService === internetService;

    return matchesSearch && matchesRisk && matchesContract && matchesInternet;
  });

  return (
    <div className="customers-container">
      {/* 1. Header Trang */}
      <div className="customers-header">
        <h1>Customers</h1>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 2. Thanh Bộ Lọc (Filters) */}
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

      {/* 3. Bảng Dữ Liệu Khách Hàng */}
      <div className="table-card">
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
            {filteredCustomers.length > 0 ? (
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
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Không tìm thấy khách hàng nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 4. Phân Trang (Pagination Giả) */}
        <div className="pagination">
          <button className="page-btn" disabled>
            <ChevronLeft size={16} />
          </button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <span>...</span>
          <button className="page-btn">71</button>
          <button className="page-btn">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Customers;