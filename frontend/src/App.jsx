import { useState } from 'react';

import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import FAQPage from './pages/FAQPage';

import './App.css';

function App() {
  const [activePage, setActivePage] = useState('chat');

  const renderPage = () => {
    switch (activePage) {
      case 'chat':
        return <ChatPage />;

      case 'faq':
        return <FAQPage />;

      case 'history':
        return (
          <div style={{ padding: '40px' }}>
            <h1>Lịch sử hội thoại</h1>
            <p>Chức năng đang được phát triển.</p>
          </div>
        );

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
      <Sidebar
        activeItem={activePage}
        onNavigate={setActivePage}
      />

      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;