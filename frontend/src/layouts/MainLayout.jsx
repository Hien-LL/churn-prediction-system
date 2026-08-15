import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, LogOut, Hexagon } from 'lucide-react';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="layout-container">
      {/* Cột trái: Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <Hexagon size={28} color="#3b82f6" />
          <span>ChurnAI</span>
        </div>

        <nav className="nav-menu">
          {/* Dùng NavLink thay cho <a> để chuyển trang không bị load lại trình duyệt */}
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/customers" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Users size={20} />
            <span>Customers</span>
          </NavLink>

          <NavLink to="/predict" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Activity size={20} />
            <span>Predict</span>
          </NavLink>
        </nav>

        {/* Nút Logout nằm ở cuối */}
        <div className="nav-menu" style={{ flex: 'none' }}>
          <button className="nav-item" style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Cột phải: Khu vực nội dung thay đổi tùy theo URL */}
      <main className="content-area">
        {/* Component <Outlet /> chính là nơi các trang (Dashboard, Customers...) được render vào */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;