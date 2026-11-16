import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  GraduationCap,
  ShieldCheck,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  ArrowRight,
} from 'lucide-react';

import './AdminLoginPage.css';

function AdminLoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();

    setError('');

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        credentials: 'include',

        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Đăng nhập thất bại.'
        );
      }

      navigate('/admin/dashboard', {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message || 'Không thể kết nối đến máy chủ.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <GraduationCap size={34} strokeWidth={2} />
        </div>

        <div className="admin-login-heading">
          <span className="admin-login-badge">
            <ShieldCheck size={15} />
            KHU VỰC QUẢN TRỊ
          </span>

          <h1>Chào mừng trở lại!</h1>

          <p>
            Đăng nhập để quản lý hệ thống
            VKU AI Student Support.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="admin-login-field">
            <label htmlFor="admin-username">
              Tên đăng nhập
            </label>

            <div className="admin-login-input">
              <UserRound size={19} />

              <input
                id="admin-username"
                type="text"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">
              Mật khẩu
            </label>

            <div className="admin-login-input">
              <LockKeyhole size={19} />

              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                disabled={loading}
                required
              />

              <button
                type="button"
                className="admin-login-eye"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? 'Ẩn mật khẩu'
                    : 'Hiện mật khẩu'
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={19}
                  className="admin-login-spinner"
                />
                Đang đăng nhập...
              </>
            ) : (
              <>
                Đăng nhập
                <ArrowRight size={19} />
              </>
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>VKU AI Student Support</p>
          <span>Hệ thống hỗ trợ sinh viên thông minh</span>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;