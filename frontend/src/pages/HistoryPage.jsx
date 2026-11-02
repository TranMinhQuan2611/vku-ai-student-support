import { useEffect, useMemo, useState } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Trash2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';

import './HistoryPage.css';

const API_URL = 'http://localhost:3001';

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // =====================================
  // LẤY LỊCH SỬ TỪ BACKEND
  // =====================================

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/history`);

      if (!response.ok) {
        throw new Error('Không thể tải lịch sử hội thoại.');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Có lỗi xảy ra.');
      }

      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // =====================================
  // TÌM KIẾM LỊCH SỬ
  // =====================================

  const filteredHistory = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return history;

    return history.filter((item) => {
      return (
        item.question?.toLowerCase().includes(keyword) ||
        item.answer?.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword)
      );
    });
  }, [history, search]);

  // =====================================
  // ĐỊNH DẠNG THỜI GIAN
  // =====================================

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';

    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // =====================================
  // XÓA MỘT LỊCH SỬ
  // =====================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xóa hội thoại này?'
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const response = await fetch(
        `${API_URL}/api/history/${id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể xóa lịch sử.');
      }

      setHistory((prev) =>
        prev.filter((item) => item.id !== id)
      );

      if (expandedId === id) {
        setExpandedId(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================
  // XÓA TOÀN BỘ LỊCH SỬ
  // =====================================

  const handleDeleteAll = async () => {
    if (history.length === 0) return;

    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử hội thoại? Hành động này không thể hoàn tác.'
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/history`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể xóa lịch sử.');
      }

      setHistory([]);
      setExpandedId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // GIAO DIỆN
  // =====================================

  return (
    <div className="history-page">
      <div className="history-container">

        {/* HEADER */}
        <section className="history-hero">
          <div>
            <span className="history-badge">
              <Sparkles size={14} />
              NHẬT KÝ TRỢ LÝ AI VKU
            </span>

            <h1>Lịch sử hội thoại</h1>

            <p>
              Xem lại những câu hỏi và câu trả lời trước đây
              của bạn với trợ lý AI VKU.
            </p>
          </div>

          <div className="history-hero-icon">
            <History size={30} />
          </div>
        </section>

        {/* THỐNG KÊ */}
        <section className="history-stats">
          <div className="history-stat-card">
            <div className="history-stat-icon blue">
              <MessageCircle size={21} />
            </div>

            <div>
              <strong>{history.length}</strong>
              <span>Tổng số hội thoại</span>
            </div>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-icon green">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <strong>
                {history.filter((item) => item.matched).length}
              </strong>
              <span>Câu hỏi được giải đáp</span>
            </div>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-icon purple">
              <CalendarDays size={21} />
            </div>

            <div>
              <strong>{filteredHistory.length}</strong>
              <span>Kết quả đang hiển thị</span>
            </div>
          </div>
        </section>

        {/* THANH CÔNG CỤ */}
        <section className="history-toolbar">
          <div className="history-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi, câu trả lời hoặc danh mục..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            className="history-refresh-btn"
            onClick={fetchHistory}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Làm mới
          </button>

          <button
            className="history-delete-all-btn"
            onClick={handleDeleteAll}
            disabled={loading || history.length === 0}
          >
            <Trash2 size={17} />
            Xóa tất cả
          </button>
        </section>

        {/* DANH SÁCH */}
        <section className="history-list-section">
          <div className="history-section-heading">
            <div>
              <h2>Danh sách hội thoại</h2>

              <p>
                Tìm thấy {filteredHistory.length} hội thoại
              </p>
            </div>
          </div>

          {loading ? (
            <div className="history-state">
              <Loader2 className="history-spinner" size={30} />
              <p>Đang tải lịch sử hội thoại...</p>
            </div>
          ) : error ? (
            <div className="history-state">
              <AlertCircle size={32} />
              <p>{error}</p>

              <button onClick={fetchHistory}>
                Thử lại
              </button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="history-state">
              <History size={36} />

              <h3>Chưa có hội thoại</h3>

              <p>
                Lịch sử sẽ xuất hiện tại đây sau khi
                bạn đặt câu hỏi cho trợ lý AI.
              </p>
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map((item) => {
                const isExpanded = expandedId === item.id;

                return (
                  <article
                    key={item.id}
                    className={`history-item ${
                      isExpanded ? 'expanded' : ''
                    }`}
                  >
                    <div className="history-item-top">
                      <div className="history-item-icon">
                        <MessageCircle size={20} />
                      </div>

                      <button
                        className="history-item-content"
                        onClick={() =>
                          setExpandedId(
                            isExpanded ? null : item.id
                          )
                        }
                      >
                        <span className="history-item-category">
                          {item.category || 'Câu hỏi chung'}
                        </span>

                        <h3>{item.question}</h3>

                        <span className="history-item-date">
                          <CalendarDays size={13} />
                          {formatDate(item.created_at)}
                        </span>
                      </button>

                      <div className="history-item-actions">
                        <button
                          className="history-item-delete"
                          title="Xóa hội thoại"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={17} />
                        </button>

                        <button
                          className="history-item-expand"
                          title="Xem chi tiết"
                          onClick={() =>
                            setExpandedId(
                              isExpanded ? null : item.id
                            )
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="history-item-answer">
                        <div className="history-answer-label">
                          <Sparkles size={16} />
                          Câu trả lời từ trợ lý AI
                        </div>

                        <p>{item.answer}</p>

                        <div className="history-answer-footer">
                          <span
                            className={`history-match-badge ${
                              item.matched
                                ? 'matched'
                                : 'unmatched'
                            }`}
                          >
                            {item.matched
                              ? 'Đã tìm thấy câu trả lời'
                              : 'Chưa tìm thấy câu trả lời'}
                          </span>
                        </div>
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

export default HistoryPage;