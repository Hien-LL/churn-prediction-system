import React from 'react';
import { 
  Users, AlertTriangle, TrendingUp, ShieldCheck, 
  Calendar, ArrowUpRight, ArrowDownRight, ArrowRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

import { 
  mockDashboardStats, mockChurnOverTime, 
  mockChurnByContract, mockTopChurnDrivers, mockCustomers 
} from '../mockData';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  // Lọc 5 khách hàng có nguy cơ rời đi cao nhất cho bảng thu nhỏ ở dưới
  const recentHighRisk = mockCustomers
    .filter(c => c.riskLevel === 'High')
    .slice(0, 5);

  return (
    <div className="dashboard-container">
      {/* Header Trang */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="date-picker-btn">
          <Calendar size={16} />
          <span>May 1 – May 31, 2025</span>
        </button>
      </div>

      {/* 1. TOP STAT CARDS (4 Thẻ KPI) */}
      <div className="stats-grid">
        {/* Card 1: Total Customers */}
        <div className="stat-card">
          <div className="stat-info">
            <p>Total Customers</p>
            <h3>{mockDashboardStats.totalCustomers.value}</h3>
            <span className="stat-change positive">
              <ArrowUpRight size={14} />
              {mockDashboardStats.totalCustomers.change} vs last month
            </span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Users size={24} />
          </div>
        </div>

        {/* Card 2: High Risk Customers */}
        <div className="stat-card">
          <div className="stat-info">
            <p>High Risk Customers</p>
            <h3>{mockDashboardStats.highRiskCustomers.value}</h3>
            <span className="stat-change negative">
              <ArrowUpRight size={14} />
              {mockDashboardStats.highRiskCustomers.change} vs last month
            </span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Card 3: Churn Rate */}
        <div className="stat-card">
          <div className="stat-info">
            <p>Churn Rate</p>
            <h3>{mockDashboardStats.churnRate.value}</h3>
            <span className="stat-change negative">
              <ArrowUpRight size={14} />
              {mockDashboardStats.churnRate.change} vs last month
            </span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 4: Retention Rate */}
        <div className="stat-card">
          <div className="stat-info">
            <p>Retention Rate</p>
            <h3>{mockDashboardStats.retentionRate.value}</h3>
            <span className="stat-change positive">
              <ArrowUpRight size={14} />
              {mockDashboardStats.retentionRate.change} vs last month
            </span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* 2. MAIN CHARTS (Xu hướng Churn & Loại Hợp Đồng) */}
      <div className="charts-grid">
        {/* Biểu đồ Đường: Churn Rate Over Time */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Churn Rate Over Time</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={mockChurnOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value) => [`${value}%`]} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="churnRate" 
                  name="Churn Rate" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="retentionRate" 
                  name="Retention Rate" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ Tròn (Donut): Churn by Contract Type */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Churn by Contract Type</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={mockChurnByContract}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="percentage"
                >
                  {mockChurnByContract.map((entry, index) => (
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
        {/* Biểu đồ Thanh Ngang: Top Churn Drivers */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Top Churn Drivers</h3>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart 
                layout="vertical" 
                data={mockTopChurnDrivers} 
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 0.3]} />
                <YAxis dataKey="driver" type="category" stroke="#475569" fontSize={12} tickLine={false} width={140} />
                <Tooltip />
                <Bar dataKey="impact" name="Impact Score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bảng Mini: Recent High Risk Customers */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Recent High Risk Customers</h3>
            <span className="view-all-link" onClick={() => navigate('/customers')}>
              View all customers →
            </span>
          </div>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Churn Probability</th>
                <th>Top Driver</th>
              </tr>
            </thead>
            <tbody>
              {recentHighRisk.map((customer) => (
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
    </div>
  );
};

export default Dashboard;