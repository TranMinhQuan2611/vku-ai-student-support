import { useState } from 'react';

// ==========================================
// IMPORT COMPONENTS
// ==========================================

import Sidebar from './components/Sidebar';

// ==========================================
// IMPORT PAGES
// ==========================================

import ChatPage from './pages/ChatPage';
import FAQPage from './pages/FAQPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';

// ==========================================
// IMPORT CSS
// ==========================================

import './App.css';

// ==========================================
// MAIN APPLICATION
// ==========================================

function App() {
  const [activePage, setActivePage] = useState('chat');

  // ========================================
  // HIỂN THỊ TRANG THEO MENU
  // ========================================

  const renderPage = () => {
    switch (activePage) {

      // TRỢ LÝ AI
      case 'chat':
        return <ChatPage />;

      // CÂU HỎI THƯỜNG GẶP
      case 'faq':
        return <FAQPage />;

      // LỊCH SỬ HỘI THOẠI
      case 'history':
        return <HistoryPage />;

      // QUẢN TRỊ HỆ THỐNG
      case 'admin':
        return <AdminPage />;

      // MẶC ĐỊNH
      default:
        return <ChatPage />;
    }
  };

  // ========================================
  // GIAO DIỆN CHÍNH
  // ========================================

  return (
    <div className="app-layout">

      {/* THANH ĐIỀU HƯỚNG */}
      <Sidebar
        activeItem={activePage}
        onNavigate={setActivePage}
      />

      {/* NỘI DUNG TRANG */}
      <main className="app-main">
        {renderPage()}
      </main>

    </div>
  );
}

export default App;