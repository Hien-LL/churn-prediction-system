import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, TrendingUp, ShieldCheck, 
  Calendar, ArrowUpRight, ArrowDownRight, RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Khởi tạo state với cấu trúc rỗng mặc định để tránh lỗi undefined khi render lần đầu
  const [data, setData] = useState({
    stats: {
      totalCustomers: { value: 0, change: '0%' },
      highRiskCustomers: { value: 0, change: '0%' },
      churnRate: { value: '0%', change: '0%' },
      retentionRate: { value: '0%', change: '0%' }
    },
    churnOverTime: [],
    churnByContract: [],
    topChurnDrivers: [],
    recentHighRisk: []
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // ĐÃ SỬA: Đổi URL từ /dashboard thành /dashboard-summary để khớp với FastAPI router
      const response = await axios.get('http://127.0.0.1:8000/api/v1/dashboard-summary');
      
      // Kiểm tra nếu có data trả về thì mới set vào state
      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu Dashboard:", error);
      alert("Không thể tải dữ liệu. Vui lòng kiểm tra xem Backend FastAPI đã chạy chưa.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Header Trang */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="date-picker-btn" 
            onClick={fetchDashboardData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            <span>{isLoading ? 'Syncing...' : 'Sync Data'}</span>
          </button>
          <button className="date-picker-btn">
            <Calendar size={16} />
            <span>May 1 – May 31, 2026</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ height: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
          <h2>Đang tải dữ liệu hệ thống...</h2>
        </div>
      ) : (
        <>
          {/* 1. TOP STAT CARDS (4 Thẻ KPI) */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <p>Total Customers</p>
                <h3>{data?.stats?.totalCustomers?.value || 0}</h3>
                <span className={`stat-change ${(data?.stats?.totalCustomers?.change || '').includes('-') ? 'negative' : 'positive'}`}>
                  {(data?.stats?.totalCustomers?.change || '').includes('-') ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  {data?.stats?.totalCustomers?.change || '0%'} vs last month
                </span>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <Users size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <p>High Risk Customers</p>
                <h3>{data?.stats?.highRiskCustomers?.value || 0}</h3>
                <span className={`stat-change ${(data?.stats?.highRiskCustomers?.change || '').includes('+') ? 'negative' : 'positive'}`}>
                  {(data?.stats?.highRiskCustomers?.change || '').includes('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {data?.stats?.highRiskCustomers?.change || '0%'} vs last month
                </span>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                <AlertTriangle size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <p>Churn Rate</p>
                <h3>{data?.stats?.churnRate?.value || '0%'}</h3>
                <span className={`stat-change ${(data?.stats?.churnRate?.change || '').includes('+') ? 'negative' : 'positive'}`}>
                  {(data?.stats?.churnRate?.change || '').includes('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {data?.stats?.churnRate?.change || '0%'} vs last month
                </span>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <p>Retention Rate</p>
                <h3>{data?.stats?.retentionRate?.value || '0%'}</h3>
                <span className={`stat-change ${(data?.stats?.retentionRate?.change || '').includes('-') ? 'negative' : 'positive'}`}>
                  {(data?.stats?.retentionRate?.change || '').includes('-') ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  {data?.stats?.retentionRate?.change || '0%'} vs last month
                </span>
              </div>
              <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>

          {/* 2. MAIN CHARTS (Xu hướng Churn & Loại Hợp Đồng) */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Churn Rate Over Time</h3>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={data?.churnOverTime || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(value) => [`${value}%`]} />
                    <Legend />
                    <Line type="monotone" dataKey="churnRate" name="Churn Rate" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="retentionRate" name="Retention Rate" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Churn by Contract Type</h3>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={data?.churnByContract || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="percentage">
                      {(data?.churnByContract || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`]} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. BOTTOM GRID (Top Drivers & Recent High Risk Customers) */}
          <div className="bottom-grid">
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Top Churn Drivers</h3>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart layout="vertical" data={data?.topChurnDrivers || []} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 0.4]} />
                    <YAxis dataKey="driver" type="category" stroke="#475569" fontSize={12} tickLine={false} width={140} />
                    <Tooltip />
                    <Bar dataKey="impact" name="Impact Score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Recent High Risk Customers</h3>
                <span className="view-all-link" onClick={() => navigate('/customers')} style={{ cursor: 'pointer', color: '#2563eb' }}>
                  View all customers →
                </span>
              </div>
              <table className="mini-table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Churn Probability</th>
                    <th>Top Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentHighRisk || []).map((customer) => (
                    <tr key={customer.id}>
                      <td style={{ fontWeight: '600' }}>{customer.id}</td>
                      <td style={{ color: '#dc2626', fontWeight: '600' }}>{customer.churnProbability}%</td>
                      <td style={{ color: '#ea580c' }}>{customer.topDriver}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;