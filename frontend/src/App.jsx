import { useState } from 'react';

import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import FAQPage from './pages/FAQPage';
import HistoryPage from './pages/HistoryPage';

import './App.css';

function App() {
  // Quản lý trang đang được chọn
  const [activePage, setActivePage] = useState('chat');

  // Hiển thị nội dung theo mục được chọn trên Sidebar
  const renderPage = () => {
    switch (activePage) {
      case 'chat':
        return <ChatPage />;

      case 'faq':
        return <FAQPage />;

      case 'history':
        return <HistoryPage />;

      case 'admin':
        return (
          <div style={{ padding: '40px' }}>
            <h1>Quản trị hệ thống</h1>
            <p>Chức năng đang được phát triển.</p>
          </div>
        );

      default:
        return <ChatPage />;
    }
  };

  return (
    <div className="app-layout">
      {/* Thanh điều hướng bên trái */}
      <Sidebar
        activeItem={activePage}
        onNavigate={setActivePage}
      />

      {/* Nội dung trang chính */}
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;