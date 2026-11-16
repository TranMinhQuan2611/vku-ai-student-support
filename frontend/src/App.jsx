import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

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

// ==========================================
// IMPORT CSS
// ==========================================

import './App.css';

// ==========================================
// STUDENT LAYOUT
// ==========================================

function StudentLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

// ==========================================
// MAIN APPLICATION ROUTES
// ==========================================

function App() {
  return (
    <Routes>
      {/* STUDENT PORTAL */}
      <Route element={<StudentLayout />}>
        <Route path="/" element={<ChatPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>

      {/* ADMIN PORTAL - CHƯA TRIỂN KHAI */}
      <Route
        path="/admin/*"
        element={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>VKU AI - Admin Portal</h2>
            <p>Khu vực quản trị đang được xây dựng.</p>
          </div>
        }
      />

      {/* UNKNOWN ROUTES */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;