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
  Plus,
  X,
  Save,
  Pencil,
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFaq, setEditFaq] = useState({ category: '', question: '', answer: '', source_url: '' });
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [newFaq, setNewFaq] = useState({
    category: '', question: '', answer: '', source_url: ''
  });

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

  // THÊM FAQ MỚI QUA BACKEND
  const handleAddFaq = async (event) => {
    event.preventDefault();
    if (savingFaq) return;
    setFormError('');
    setFormSuccess('');

    const payload = {
      category: newFaq.category.trim(),
      question: newFaq.question.trim(),
      answer: newFaq.answer.trim(),
      source_url: newFaq.source_url.trim() || null,
    };
    if (!payload.category || !payload.question || !payload.answer) {
      setFormError('Vui lòng điền đầy đủ danh mục, câu hỏi và câu trả lời.');
      return;
    }
    if (payload.question.length > 1000) {
      setFormError('Câu hỏi không được vượt quá 1000 ký tự.');
      return;
    }
    if (payload.source_url) {
      try {
        const url = new URL(payload.source_url);
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid URL');
      } catch {
        setFormError('Đường dẫn nguồn phải bắt đầu bằng http:// hoặc https://.');
        return;
      }
    }

    setSavingFaq(true);
    try {
      const response = await fetch(`${API_BASE}/api/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        throw new Error(result.message || 'Không thể thêm câu hỏi FAQ.');
      }
      setNewFaq({ category: '', question: '', answer: '', source_url: '' });
      setSearch('');
      setFilter('all');
      setShowAddForm(false);
      setFormSuccess('Đã thêm câu hỏi FAQ thành công.');
      await loadDashboard();
    } catch (err) {
      setFormError(err.message || 'Không thể kết nối Backend.');
    } finally {
      setSavingFaq(false);
    }
  };

  const startEditing = (faq) => {
    setEditingId(faq.id);
    setExpandedId(faq.id);
    setEditError('');
    setEditFaq({
      category: faq.category || '',
      question: faq.question || '',
      answer: faq.answer || '',
      source_url: faq.source_url || '',
    });
  };

  const cancelEditing = () => {
    if (savingEdit) return;
    setEditingId(null);
    setEditError('');
  };

  const handleUpdateFaq = async (event) => {
    event.preventDefault();
    if (savingEdit || editingId === null) return;
    setEditError('');
    setFormSuccess('');

    const payload = {
      category: editFaq.category.trim(),
      question: editFaq.question.trim(),
      answer: editFaq.answer.trim(),
      source_url: editFaq.source_url.trim() || null,
    };
    if (!payload.category || !payload.question || !payload.answer) {
      setEditError('Vui lòng điền đầy đủ danh mục, câu hỏi và câu trả lời.');
      return;
    }
    if (payload.category.length > 150 || payload.question.length > 1000) {
      setEditError('Danh mục tối đa 150 ký tự, câu hỏi tối đa 1000 ký tự.');
      return;
    }
    if (payload.source_url) {
      try {
        const url = new URL(payload.source_url);
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid URL');
      } catch {
        setEditError('Đường dẫn nguồn phải bắt đầu bằng http:// hoặc https://.');
        return;
      }
    }

    setSavingEdit(true);
    try {
      const response = await fetch(`${API_BASE}/api/faqs/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        throw new Error(result.message || 'Không thể cập nhật FAQ.');
      }
      setEditingId(null);
      setFormSuccess('Đã cập nhật câu hỏi FAQ thành công.');
      await loadDashboard();
    } catch (err) {
      setEditError(err.message || 'Không thể kết nối Backend.');
    } finally {
      setSavingEdit(false);
    }
  };

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

            <div className="admin-faq-heading-actions">
              <span className="admin-count-badge">
                {filteredFaqs.length} câu hỏi
              </span>
              <button
                type="button"
                className="admin-add-btn"
                onClick={() => {
                  setShowAddForm((value) => !value);
                  setFormError('');
                  setFormSuccess('');
                }}
              >
                {showAddForm ? <X size={17} /> : <Plus size={17} />}
                {showAddForm ? 'Đóng biểu mẫu' : 'Thêm câu hỏi'}
              </button>
            </div>
          </div>

          {formSuccess && (
            <div className="admin-form-success" role="status">
              <CheckCircle2 size={18} /> {formSuccess}
            </div>
          )}

          {showAddForm && (
            <form className="admin-add-form" onSubmit={handleAddFaq}>
              <h3>Thêm câu hỏi thường gặp</h3>
              <p>FAQ mới sẽ được đánh dấu chưa xác minh.</p>
              <div className="admin-form-grid">
                <label>
                  Danh mục <span>*</span>
                  <input
                    required
                    maxLength={150}
                    placeholder="Ví dụ: Học phí"
                    value={newFaq.category}
                    onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                  />
                </label>
                <label>
                  Nguồn tham khảo (không bắt buộc)
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newFaq.source_url}
                    onChange={(e) => setNewFaq({ ...newFaq, source_url: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Câu hỏi <span>*</span>
                <input
                  required
                  maxLength={1000}
                  placeholder="Nhập câu hỏi..."
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                />
              </label>
              <label>
                Câu trả lời <span>*</span>
                <textarea
                  required
                  rows={5}
                  placeholder="Nhập câu trả lời..."
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                />
              </label>
              {formError && <div className="admin-form-error" role="alert">{formError}</div>}
              <div className="admin-form-actions">
                <button type="button" className="admin-cancel-btn" onClick={() => setShowAddForm(false)} disabled={savingFaq}>
                  Hủy
                </button>
                <button type="submit" className="admin-add-btn" disabled={savingFaq}>
                  <Save size={17} /> {savingFaq ? 'Đang lưu...' : 'Lưu câu hỏi'}
                </button>
              </div>
            </form>
          )}

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
                        {editingId === faq.id ? (
                          <form className="admin-edit-form" onSubmit={handleUpdateFaq}>
                            <h3>Chỉnh sửa câu hỏi FAQ</h3>
                            <div className="admin-form-grid">
                              <label>
                                Danh mục <span>*</span>
                                <input required maxLength={150} value={editFaq.category}
                                  onChange={(e) => setEditFaq({ ...editFaq, category: e.target.value })} />
                              </label>
                              <label>
                                Nguồn tham khảo
                                <input type="url" placeholder="https://..." value={editFaq.source_url}
                                  onChange={(e) => setEditFaq({ ...editFaq, source_url: e.target.value })} />
                              </label>
                            </div>
                            <label>
                              Câu hỏi <span>*</span>
                              <input required maxLength={1000} value={editFaq.question}
                                onChange={(e) => setEditFaq({ ...editFaq, question: e.target.value })} />
                            </label>
                            <label>
                              Câu trả lời <span>*</span>
                              <textarea required rows={5} value={editFaq.answer}
                                onChange={(e) => setEditFaq({ ...editFaq, answer: e.target.value })} />
                            </label>
                            {editError && <div className="admin-form-error" role="alert">{editError}</div>}
                            <div className="admin-form-actions">
                              <button type="button" className="admin-cancel-btn" onClick={cancelEditing} disabled={savingEdit}>Hủy</button>
                              <button type="submit" className="admin-add-btn" disabled={savingEdit}>
                                <Save size={17} /> {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="admin-edit-actions">
                              <button type="button" className="admin-edit-btn" onClick={() => startEditing(faq)}>
                                <Pencil size={16} /> Sửa câu hỏi
                              </button>
                            </div>
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
                          </>
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