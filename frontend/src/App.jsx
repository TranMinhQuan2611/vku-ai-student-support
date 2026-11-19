import { useEffect, useState } from 'react';

import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

// ==========================================
// COMPONENTS
// ==========================================

import Sidebar from './components/Sidebar';

// ==========================================
// STUDENT PAGES
// ==========================================

import ChatPage from './pages/ChatPage';
import FAQPage from './pages/FAQPage';
import HistoryPage from './pages/HistoryPage';
import SupportPage from './pages/SupportPage';

// ==========================================
// ADMIN PAGES
// ==========================================

import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';

// ==========================================
// CSS
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
// PROTECTED ADMIN ROUTE
// ==========================================

function ProtectedAdminRoute() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function checkAdminSession() {
      try {
        const response = await fetch('/api/admin/me', {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          setAuthenticated(false);
          return;
        }

        const data = await response.json();

        setAuthenticated(
          data.success === true &&
          data.authenticated === true &&
          data.admin?.role === 'admin'
        );
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setAuthenticated(false);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    checkAdminSession();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f8ff',
          color: '#2563eb',
          fontSize: '15px',
          fontWeight: 600,
        }}
      >
        Đang xác minh quyền quản trị...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

// ==========================================
// MAIN APPLICATION
// ==========================================

function App() {
  return (
    <Routes>
      {/* STUDENT PORTAL */}
      <Route element={<StudentLayout />}>
        <Route path="/" element={<ChatPage />} />

        <Route path="/faq" element={<FAQPage />} />

        <Route path="/history" element={<HistoryPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Route>

      {/* ADMIN LOGIN */}
      <Route
        path="/admin/login"
        element={<AdminLoginPage />}
      />

      {/* PROTECTED ADMIN PORTAL */}
      <Route element={<ProtectedAdminRoute />}>
        <Route
          path="/admin/dashboard"
          element={<AdminPage />}
        />
      </Route>

      {/* ADMIN DEFAULT */}
      <Route
        path="/admin"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />

      {/* UNKNOWN ROUTES */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;