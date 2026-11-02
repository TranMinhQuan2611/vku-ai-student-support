import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  LayoutDashboard,
  BookOpen,
  BadgeCheck,
  AlertCircle,
  MessageCircle,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Database,
  Server,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

import './AdminPage.css';

const API_BASE = 'http://localhost:3001';

function AdminPage() {
  const [faqs, setFaqs] = useState([]);
  const [history, setHistory] = useState([]);

  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  // ==========================================
  // LẤY DỮ LIỆU TỪ BACKEND
  // ==========================================

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    const [healthResult, faqResult, historyResult] =
      await Promise.allSettled([
        fetch(`${API_BASE}/api/health`),
        fetch(`${API_BASE}/api/faqs`),
        fetch(`${API_BASE}/api/history`),
      ]);

    // Kiểm tra Backend
    if (healthResult.status === 'fulfilled') {
      setBackendOnline(healthResult.value.ok);
    } else {
      setBackendOnline(false);
    }

    // Lấy FAQ
    if (
      faqResult.status === 'fulfilled' &&
      faqResult.value.ok
    ) {
      try {
        const data = await faqResult.value.json();

        if (data.success && Array.isArray(data.faqs)) {
          setFaqs(data.faqs);
        } else {
          setFaqs([]);
          setError('Dữ liệu FAQ không hợp lệ.');
        }
      } catch {
        setFaqs([]);
        setError('Không thể đọc dữ liệu FAQ.');
      }
    } else {
      setFaqs([]);
      setError('Không thể kết nối API FAQ.');
    }

    // Lấy lịch sử
    if (
      historyResult.status === 'fulfilled' &&
      historyResult.value.ok
    ) {
      try {
        const data = await historyResult.value.json();

        setHistory(
          data.success && Array.isArray(data.history)
            ? data.history
            : []
        );
      } catch {
        setHistory([]);
      }
    } else {
      setHistory([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ==========================================
  // THỐNG KÊ
  // ==========================================

  const stats = useMemo(() => {
    const verified = faqs.filter(
      (faq) => faq.verified === true
    ).length;

    return {
      total: faqs.length,
      verified,
      unverified: faqs.length - verified,
      conversations: history.length,
    };
  }, [faqs, history]);

  // ==========================================
  // TÌM KIẾM VÀ LỌC
  // ==========================================

  const filteredFaqs = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');

    return faqs.filter((faq) => {
      const text = [
        faq.question,
        faq.answer,
        faq.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('vi');

      const matchesSearch =
        !keyword || text.includes(keyword);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'verified' && faq.verified === true) ||
        (filter === 'unverified' && faq.verified !== true);

      return matchesSearch && matchesFilter;
    });
  }, [faqs, search, filter]);

  const formatDate = (value) => {
    if (!value) return 'Chưa có thông tin';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Không xác định';
    }

    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="admin-page">
      <div className="admin-container">

        {/* HEADER */}
        <header className="admin-hero">
          <div className="admin-hero-content">
            <div className="admin-eyebrow">
              <Sparkles size={15} />
              TRUNG TÂM QUẢN TRỊ VKU AI
            </div>

            <h1>Quản trị hệ thống</h1>

            <p>
              Theo dõi dữ liệu, kiểm tra trạng thái hệ thống
              và quản lý kho tri thức của trợ lý AI VKU.
            </p>
          </div>

          <div className="admin-hero-icon">
            <LayoutDashboard size={34} />
          </div>
        </header>

        {/* THỐNG KÊ */}
        <section className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              <BookOpen size={23} />
            </div>

            <div>
              <strong>{loading ? '...' : stats.total}</strong>
              <span>Tổng số FAQ</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon green">
              <BadgeCheck size={23} />
            </div>

            <div>
              <strong>
                {loading ? '...' : stats.verified}
              </strong>
              <span>FAQ đã xác minh</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon orange">
              <AlertCircle size={23} />
            </div>

            <div>
              <strong>
                {loading ? '...' : stats.unverified}
              </strong>
              <span>FAQ chưa xác minh</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon purple">
              <MessageCircle size={23} />
            </div>

            <div>
              <strong>
                {loading ? '...' : stats.conversations}
              </strong>
              <span>Hội thoại gần đây (tối đa 100)</span>
            </div>
          </div>
        </section>

        {/* TRẠNG THÁI HỆ THỐNG */}
        <section className="admin-system-card">
          <div className="admin-section-heading">
            <div>
              <h2>
                <Server size={20} />
                Trạng thái hệ thống
              </h2>

              <p>
                Theo dõi kết nối đến dịch vụ Backend.
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh-btn"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                className={loading ? 'admin-spinning' : ''}
              />
              Làm mới
            </button>
          </div>

          <div className="admin-system-status">
            <div className="admin-system-icon">
              <Database size={21} />
            </div>

            <div className="admin-system-text">
              <strong>VKU AI Backend</strong>
              <span>API tại localhost:3001</span>
            </div>

            <div
              className={`admin-status-badge ${
                backendOnline ? 'online' : 'offline'
              }`}
            >
              {backendOnline ? (
                <>
                  <CheckCircle2 size={16} />
                  Đang hoạt động
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  Mất kết nối
                </>
              )}
            </div>
          </div>
        </section>

        {/* QUẢN LÝ FAQ */}
        <section className="admin-faq-section">
          <div className="admin-section-heading">
            <div>
              <h2>
                <ShieldCheck size={21} />
                Kho tri thức FAQ
              </h2>

              <p>
                Kiểm tra nội dung và trạng thái xác minh
                của các câu hỏi thường gặp.
              </p>
            </div>

            <span className="admin-count-badge">
              {filteredFaqs.length} câu hỏi
            </span>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={19} />

              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi, câu trả lời hoặc danh mục..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div className="admin-filters">
              <button
                type="button"
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                Tất cả
              </button>

              <button
                type="button"
                className={
                  filter === 'verified' ? 'active' : ''
                }
                onClick={() => setFilter('verified')}
              >
                Đã xác minh
              </button>

              <button
                type="button"
                className={
                  filter === 'unverified' ? 'active' : ''
                }
                onClick={() => setFilter('unverified')}
              >
                Chưa xác minh
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="admin-empty">
              Đang tải dữ liệu quản trị...
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="admin-empty">
              Không tìm thấy câu hỏi phù hợp.
            </div>
          ) : (
            <div className="admin-faq-list">
              {filteredFaqs.map((faq) => {
                const expanded = expandedId === faq.id;

                return (
                  <article
                    key={faq.id}
                    className={`admin-faq-item ${
                      expanded ? 'expanded' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="admin-faq-toggle"
                      onClick={() =>
                        setExpandedId(
                          expanded ? null : faq.id
                        )
                      }
                      aria-expanded={expanded}
                    >
                      <div className="admin-faq-icon">
                        <BookOpen size={19} />
                      </div>

                      <div className="admin-faq-title">
                        <small>
                          {faq.category || 'Chưa phân loại'}
                        </small>

                        <strong>{faq.question}</strong>
                      </div>

                      <span
                        className={`admin-verified-badge ${
                          faq.verified
                            ? 'verified'
                            : 'unverified'
                        }`}
                      >
                        {faq.verified
                          ? 'Đã xác minh'
                          : 'Chưa xác minh'}
                      </span>

                      {expanded ? (
                        <ChevronUp size={19} />
                      ) : (
                        <ChevronDown size={19} />
                      )}
                    </button>

                    {expanded && (
                      <div className="admin-faq-details">
                        <h4>Câu trả lời</h4>

                        <p>{faq.answer}</p>

                        <div className="admin-faq-meta">
                          <span>
                            <strong>Nguồn:</strong>{' '}
                            {faq.source_type || 'Chưa rõ'}
                          </span>

                          <span>
                            <strong>Cập nhật:</strong>{' '}
                            {formatDate(faq.updated_at)}
                          </span>
                        </div>

                        {faq.source_url && (
                          <a
                            href={faq.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-source-link"
                          >
                            Xem nguồn tham khảo
                            <ExternalLink size={15} />
                          </a>
                        )}

                        {!faq.verified && (
                          <div className="admin-warning">
                            <AlertCircle size={17} />
                            Nội dung này chưa được xác minh
                            từ nguồn chính thức của VKU.
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminPage;