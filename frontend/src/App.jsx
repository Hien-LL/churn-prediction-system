import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Layout
import MainLayout from './layouts/MainLayout';

// Import Pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Predict from './pages/Predict';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<MainLayout />}>
          
          {/* Cấu hình các đường dẫn (URL) tương ứng với từng trang */}
          <Route index element={<Dashboard />} />                 {/* Đường dẫn: localhost:5173/ */}
          <Route path="customers" element={<Customers />} />      {/* Đường dẫn: localhost:5173/customers */}
          <Route path="predict" element={<Predict />} />          {/* Đường dẫn: localhost:5173/predict */}
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;