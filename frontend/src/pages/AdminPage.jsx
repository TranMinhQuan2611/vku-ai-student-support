import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
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
  Trash2,
  ClipboardList,
} from 'lucide-react';

import './AdminPage.css';

const API_BASE = '';

const EMPTY_FAQ = {
  category: '',
  question: '',
  answer: '',
  source_url: '',
};

function AdminPage() {
    const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Không thể đăng xuất. Vui lòng thử lại.');
      }

      navigate('/admin/login', { replace: true });
    } catch (error) {
      alert(error.message || 'Đăng xuất thất bại.');
    } finally {
      setLoggingOut(false);
    }
  };
  const [faqs, setFaqs] = useState([]);
  const [history, setHistory] = useState([]);

  // Yêu cầu hỗ trợ sinh viên (API yêu cầu phiên đăng nhập Admin).
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState('');
  const [supportSearch, setSupportSearch] = useState('');
  const [supportStatus, setSupportStatus] = useState('all');
  const [expandedSupportId, setExpandedSupportId] = useState(null);
// ==========================================
// CHỈNH SỬA YÊU CẦU HỖ TRỢ SINH VIÊN
// ==========================================

// ID yêu cầu đang chỉnh sửa
const [editingSupportId, setEditingSupportId] = useState(null);

// Dữ liệu đang chỉnh sửa
const [supportForm, setSupportForm] = useState({
  status: 'pending',
  priority: 'normal',
  admin_response: '',
});

// Trạng thái đang lưu
const [savingSupport, setSavingSupport] = useState(false);

// Thông báo kết quả
const [supportFormMessage, setSupportFormMessage] = useState('');

  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFaq, setNewFaq] = useState({ ...EMPTY_FAQ });
  const [savingFaq, setSavingFaq] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editFaq, setEditFaq] = useState({ ...EMPTY_FAQ });
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

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

    if (healthResult.status === 'fulfilled') {
      setBackendOnline(healthResult.value.ok);
    } else {
      setBackendOnline(false);
    }

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

  const loadSupportRequests = useCallback(async () => {
    setSupportLoading(true);
    setSupportError('');
    try {
      const response = await fetch('/api/admin/support-requests', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.status === 401) {
        throw new Error('Phiên Admin đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (!response.ok) {
        throw new Error(`Không thể tải yêu cầu hỗ trợ (HTTP ${response.status}).`);
      }
      const data = await response.json();
      if (data.success !== true || !Array.isArray(data.requests)) {
        throw new Error('Dữ liệu yêu cầu hỗ trợ không hợp lệ.');
      }
      setSupportRequests(data.requests);
    } catch (err) {
      setSupportError(err.message || 'Không thể tải yêu cầu hỗ trợ.');
    } finally {
      setSupportLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupportRequests();
  }, [loadSupportRequests]);
  // ==========================================
// BẮT ĐẦU CHỈNH SỬA YÊU CẦU HỖ TRỢ
// ==========================================

const handleEditSupport = (request) => {
  setEditingSupportId(request.id);

  setSupportForm({
    status: request.status || 'pending',
    priority: request.priority || 'normal',
    admin_response: request.admin_response || '',
  });

  setSupportFormMessage('');
};

// ==========================================
// LƯU THAY ĐỔI YÊU CẦU HỖ TRỢ
// ==========================================

const handleUpdateSupportRequest = async (id) => {
  if (savingSupport) return;

  setSavingSupport(true);
  setSupportFormMessage('');

  try {
    const response = await fetch(
      `/api/admin/support-requests/${id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supportForm),
      }
    );

    const data = await response.json();

    if (!response.ok || data.success !== true) {
      throw new Error(
        data.message || 'Không thể cập nhật yêu cầu hỗ trợ.'
      );
    }

    setSupportRequests((previous) =>
      previous.map((request) =>
        request.id === id ? data.request : request
      )
    );

    setEditingSupportId(null);

    setSupportFormMessage(
      `Đã cập nhật thành công yêu cầu #${id}.`
    );

  } catch (error) {
    setSupportFormMessage(
      error.message || 'Đã xảy ra lỗi khi cập nhật.'
    );
  } finally {
    setSavingSupport(false);
  }
};

  const supportStatuses = useMemo(() =>
    [...new Set(supportRequests.map((item) => String(item.status ?? 'Chưa có trạng thái')))],
    [supportRequests]
  );

  const filteredSupportRequests = useMemo(() => {
    const keyword = supportSearch.trim().toLocaleLowerCase('vi');
    return supportRequests.filter((item) => {
      const status = String(item.status ?? 'Chưa có trạng thái');
      const matchesStatus = supportStatus === 'all' || supportStatus === status;
      const searchable = [item.id, item.name, item.full_name, item.student_name,
        item.email, item.subject, item.title, item.message, item.content,
        item.question, item.status].filter((value) => value != null)
        .join(' ').toLocaleLowerCase('vi');
      return matchesStatus && (!keyword || searchable.includes(keyword));
    });
  }, [supportRequests, supportSearch, supportStatus]);

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

  // ==========================================
  // KIỂM TRA DỮ LIỆU FAQ
  // ==========================================

  const validateFaq = (faq) => {
    const payload = {
      category: faq.category.trim(),
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      source_url: faq.source_url.trim() || null,
    };

    if (
      !payload.category ||
      !payload.question ||
      !payload.answer
    ) {
      throw new Error(
        'Vui lòng điền đầy đủ danh mục, câu hỏi và câu trả lời.'
      );
    }

    if (
      payload.category.length > 150 ||
      payload.question.length > 1000
    ) {
      throw new Error(
        'Danh mục tối đa 150 ký tự, câu hỏi tối đa 1000 ký tự.'
      );
    }

    if (payload.source_url) {
      let url;

      try {
        url = new URL(payload.source_url);
      } catch {
        throw new Error(
          'Đường dẫn nguồn không hợp lệ.'
        );
      }

      if (!['https:', 'http:'].includes(url.protocol)) {
        throw new Error(
          'Đường dẫn nguồn phải bắt đầu bằng http:// hoặc https://.'
        );
      }
    }

    return payload;
  };

  // ==========================================
  // THÊM FAQ
  // ==========================================

  const handleAddFaq = async (event) => {
    event.preventDefault();

    if (savingFaq) return;

    setFormError('');
    setFormSuccess('');

    let payload;

    try {
      payload = validateFaq(newFaq);
    } catch (err) {
      setFormError(err.message);
      return;
    }

    setSavingFaq(true);

    try {
      const response = await fetch(`${API_BASE}/api/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || 'Không thể thêm câu hỏi FAQ.'
        );
      }

      setNewFaq({ ...EMPTY_FAQ });
      setSearch('');
      setFilter('all');
      setShowAddForm(false);

      await loadDashboard();

      setFormSuccess('Đã thêm câu hỏi FAQ thành công.');
    } catch (err) {
      setFormError(
        err.message || 'Không thể kết nối Backend.'
      );
    } finally {
      setSavingFaq(false);
    }
  };

  // ==========================================
  // BẮT ĐẦU CHỈNH SỬA FAQ
  // ==========================================

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

  // ==========================================
  // CẬP NHẬT FAQ
  // ==========================================

  const handleUpdateFaq = async (event) => {
    event.preventDefault();

    if (savingEdit || editingId === null) return;

    setEditError('');
    setFormSuccess('');

    let payload;

    try {
      payload = validateFaq(editFaq);
    } catch (err) {
      setEditError(err.message);
      return;
    }

    setSavingEdit(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/faqs/${editingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || 'Không thể cập nhật FAQ.'
        );
      }

      setEditingId(null);

      await loadDashboard();

      setFormSuccess('Đã cập nhật câu hỏi FAQ thành công.');
    } catch (err) {
      setEditError(
        err.message || 'Không thể kết nối Backend.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // ==========================================
  // XÓA FAQ
  // ==========================================

  const handleDelete = async (faq) => {
    if (
      deletingId !== null ||
      savingEdit ||
      verifyingId !== null
    ) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa câu hỏi sau không?\n\n` +
      `"${faq.question}"\n\n` +
      `Hành động này không thể hoàn tác.`
    );

    if (!confirmed) return;

    setDeletingId(faq.id);
    setFormSuccess('');
    setError('');

    try {
      const response = await fetch(
        `${API_BASE}/api/faqs/${faq.id}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || 'Không thể xóa câu hỏi FAQ.'
        );
      }

      // Cập nhật danh sách ngay sau khi xóa
      setFaqs((previousFaqs) =>
        previousFaqs.filter(
          (item) => item.id !== faq.id
        )
      );

      // Đóng FAQ vừa xóa
      setExpandedId((currentId) =>
        currentId === faq.id ? null : currentId
      );

      // Đóng biểu mẫu sửa nếu đang sửa FAQ này
      if (editingId === faq.id) {
        setEditingId(null);
        setEditError('');
      }

      setFormSuccess(
        'Đã xóa câu hỏi FAQ thành công.'
      );
    } catch (err) {
      console.error('Lỗi xóa FAQ:', err);

      setError(
        err.message || 'Có lỗi xảy ra khi xóa câu hỏi.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // XÁC MINH / HỦY XÁC MINH FAQ
  // ==========================================

  const handleVerify = async (faq) => {
    if (
      verifyingId !== null ||
      deletingId !== null ||
      savingEdit
    ) return;

    const newVerifiedStatus = faq.verified !== true;

    setVerifyingId(faq.id);
    setFormSuccess('');
    setError('');

    try {
      const response = await fetch(
        `${API_BASE}/api/faqs/${faq.id}/verify`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verified: newVerifiedStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message ||
          'Không thể cập nhật trạng thái xác minh FAQ.'
        );
      }

      // Cập nhật trạng thái FAQ ngay lập tức
      setFaqs((previousFaqs) =>
        previousFaqs.map((item) =>
          item.id === faq.id
            ? {
                ...item,
                verified: newVerifiedStatus,
              }
            : item
        )
      );

      setFormSuccess(
        newVerifiedStatus
          ? 'Đã xác minh câu hỏi FAQ thành công.'
          : 'Đã hủy xác minh câu hỏi FAQ thành công.'
      );

    } catch (err) {
      console.error('Lỗi xác minh FAQ:', err);

      setError(
        err.message ||
        'Không thể kết nối Backend.'
      );
    } finally {
      setVerifyingId(null);
    }
  };

  // ==========================================
  // ĐỊNH DẠNG NGÀY
  // ==========================================

  const formatDate = (value) => {
    if (!value) return 'Chưa có thông tin';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Không xác định';
    }

    return date.toLocaleString('vi-VN');
  };

  // ==========================================
  // GIAO DIỆN
  // ==========================================

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

                    <div className="admin-header-actions">
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={18} />

              <span>
                {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </span>
            </button>

            <div className="admin-hero-icon">
              <LayoutDashboard size={34} />
            </div>
          </div>
        </header>

        {/* THỐNG KÊ */}

        <section className="admin-stats">

          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              <BookOpen size={23} />
            </div>

            <div>
              <strong>
                {loading ? '...' : stats.total}
              </strong>
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
                className={
                  loading ? 'admin-spinning' : ''
                }
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
                {showAddForm ? (
                  <X size={17} />
                ) : (
                  <Plus size={17} />
                )}

                {showAddForm
                  ? 'Đóng biểu mẫu'
                  : 'Thêm câu hỏi'}
              </button>

            </div>
          </div>

          {/* THÔNG BÁO THÀNH CÔNG */}

          {formSuccess && (
            <div
              className="admin-form-success"
              role="status"
            >
              <CheckCircle2 size={18} />
              {formSuccess}
            </div>
          )}

          {/* BIỂU MẪU THÊM FAQ */}

          {showAddForm && (
            <form
              className="admin-add-form"
              onSubmit={handleAddFaq}
            >
              <h3>Thêm câu hỏi thường gặp</h3>

              <p>
                FAQ mới sẽ được đánh dấu chưa xác minh.
              </p>

              <div className="admin-form-grid">

                <label>
                  Danh mục <span>*</span>

                  <input
                    required
                    maxLength={150}
                    placeholder="Ví dụ: Học phí"
                    value={newFaq.category}
                    onChange={(e) =>
                      setNewFaq({
                        ...newFaq,
                        category: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Nguồn tham khảo (không bắt buộc)

                  <input
                    type="url"
                    placeholder="https://..."
                    value={newFaq.source_url}
                    onChange={(e) =>
                      setNewFaq({
                        ...newFaq,
                        source_url: e.target.value,
                      })
                    }
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
                  onChange={(e) =>
                    setNewFaq({
                      ...newFaq,
                      question: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Câu trả lời <span>*</span>

                <textarea
                  required
                  rows={5}
                  placeholder="Nhập câu trả lời..."
                  value={newFaq.answer}
                  onChange={(e) =>
                    setNewFaq({
                      ...newFaq,
                      answer: e.target.value,
                    })
                  }
                />
              </label>

              {formError && (
                <div
                  className="admin-form-error"
                  role="alert"
                >
                  {formError}
                </div>
              )}

              <div className="admin-form-actions">

                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setShowAddForm(false)}
                  disabled={savingFaq}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="admin-add-btn"
                  disabled={savingFaq}
                >
                  <Save size={17} />

                  {savingFaq
                    ? 'Đang lưu...'
                    : 'Lưu câu hỏi'}
                </button>

              </div>
            </form>
          )}

          {/* THANH TÌM KIẾM VÀ BỘ LỌC */}

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
                className={
                  filter === 'all' ? 'active' : ''
                }
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

          {/* THÔNG BÁO LỖI */}

          {error && (
            <div className="admin-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* DANH SÁCH FAQ */}

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

                    {/* TIÊU ĐỀ FAQ */}

                    <button
                      type="button"
                      className="admin-faq-toggle"
                      onClick={() => {
                        if (editingId === faq.id) {
                          cancelEditing();
                        }

                        setExpandedId(
                          expanded ? null : faq.id
                        );
                      }}
                      aria-expanded={expanded}
                    >

                      <div className="admin-faq-icon">
                        <BookOpen size={19} />
                      </div>

                      <div className="admin-faq-title">
                        <small>
                          {faq.category || 'Chưa phân loại'}
                        </small>

                        <strong>
                          {faq.question}
                        </strong>
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

                    {/* CHI TIẾT FAQ */}

                    {expanded && (
                      <div className="admin-faq-details">

                        {editingId === faq.id ? (

                          /* BIỂU MẪU SỬA FAQ */

                          <form
                            className="admin-edit-form"
                            onSubmit={handleUpdateFaq}
                          >

                            <h3>
                              Chỉnh sửa câu hỏi FAQ
                            </h3>

                            <div className="admin-form-grid">

                              <label>
                                Danh mục <span>*</span>

                                <input
                                  required
                                  maxLength={150}
                                  value={editFaq.category}
                                  onChange={(e) =>
                                    setEditFaq({
                                      ...editFaq,
                                      category: e.target.value,
                                    })
                                  }
                                />
                              </label>

                              <label>
                                Nguồn tham khảo

                                <input
                                  type="url"
                                  placeholder="https://..."
                                  value={editFaq.source_url}
                                  onChange={(e) =>
                                    setEditFaq({
                                      ...editFaq,
                                      source_url: e.target.value,
                                    })
                                  }
                                />
                              </label>

                            </div>

                            <label>
                              Câu hỏi <span>*</span>

                              <input
                                required
                                maxLength={1000}
                                value={editFaq.question}
                                onChange={(e) =>
                                  setEditFaq({
                                    ...editFaq,
                                    question: e.target.value,
                                  })
                                }
                              />
                            </label>

                            <label>
                              Câu trả lời <span>*</span>

                              <textarea
                                required
                                rows={5}
                                value={editFaq.answer}
                                onChange={(e) =>
                                  setEditFaq({
                                    ...editFaq,
                                    answer: e.target.value,
                                  })
                                }
                              />
                            </label>

                            {editError && (
                              <div
                                className="admin-form-error"
                                role="alert"
                              >
                                {editError}
                              </div>
                            )}

                            <div className="admin-form-actions">

                              <button
                                type="button"
                                className="admin-cancel-btn"
                                onClick={cancelEditing}
                                disabled={savingEdit}
                              >
                                Hủy
                              </button>

                              <button
                                type="submit"
                                className="admin-add-btn"
                                disabled={savingEdit}
                              >
                                <Save size={17} />

                                {savingEdit
                                  ? 'Đang lưu...'
                                  : 'Lưu thay đổi'}
                              </button>

                            </div>

                          </form>
                        ) : (
                          <>

                            {/* CÁC NÚT THAO TÁC FAQ */}

                            <div
                              className="admin-edit-actions"
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '10px',
                                flexWrap: 'wrap',
                              }}
                            >

                              {/* NÚT XÁC MINH / HỦY XÁC MINH */}

                              <button
                                type="button"
                                onClick={() => handleVerify(faq)}
                                disabled={
                                  verifyingId !== null ||
                                  deletingId !== null ||
                                  savingEdit
                                }
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  padding: '10px 14px',
                                  border: faq.verified
                                    ? '1px solid #fed7aa'
                                    : '1px solid #a7f3d0',
                                  borderRadius: '9px',
                                  background: faq.verified
                                    ? '#fff7ed'
                                    : '#ecfdf5',
                                  color: faq.verified
                                    ? '#ea580c'
                                    : '#059669',
                                  fontSize: '13px',
                                  fontWeight: 650,
                                  cursor:
                                    verifyingId !== null
                                      ? 'not-allowed'
                                      : 'pointer',
                                  opacity:
                                    verifyingId !== null
                                      ? 0.6
                                      : 1,
                                }}
                              >

                                {verifyingId === faq.id ? (
                                  <>
                                    <RefreshCw
                                      size={16}
                                      className="admin-spinning"
                                    />
                                    Đang xử lý...
                                  </>
                                ) : faq.verified ? (
                                  <>
                                    <XCircle size={16} />
                                    Hủy xác minh
                                  </>
                                ) : (
                                  <>
                                    <BadgeCheck size={16} />
                                    Xác minh FAQ
                                  </>
                                )}

                              </button>

                              {/* NÚT SỬA */}

                              <button
                                type="button"
                                className="admin-edit-btn"
                                onClick={() =>
                                  startEditing(faq)
                                }
                                disabled={
                                  verifyingId !== null ||
                                  deletingId !== null
                                }
                              >
                                <Pencil size={16} />
                                Sửa câu hỏi
                              </button>

                              {/* NÚT XÓA */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(faq)
                                }
                                disabled={
                                  deletingId !== null ||
                                  verifyingId !== null
                                }
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  padding: '10px 14px',
                                  border: '1px solid #fecaca',
                                  borderRadius: '9px',
                                  background: '#fff1f2',
                                  color: '#dc2626',
                                  fontSize: '13px',
                                  fontWeight: 650,
                                  cursor:
                                    deletingId !== null
                                      ? 'not-allowed'
                                      : 'pointer',
                                  opacity:
                                    deletingId !== null
                                      ? 0.6
                                      : 1,
                                }}
                              >
                                <Trash2 size={16} />

                                {deletingId === faq.id
                                  ? 'Đang xóa...'
                                  : 'Xóa câu hỏi'}
                              </button>

                            </div>

                            {/* CÂU TRẢ LỜI */}

                            <h4>Câu trả lời</h4>

                            <p>{faq.answer}</p>

                            {/* THÔNG TIN FAQ */}

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

                            {/* NGUỒN THAM KHẢO */}

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

                            {/* CẢNH BÁO CHƯA XÁC MINH */}

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

        {/* QUẢN LÝ YÊU CẦU HỖ TRỢ SINH VIÊN */}
        <section className="admin-faq-section" style={{ marginTop: 24 }}>
          <div className="admin-section-heading">
            <div>
              <h2><ClipboardList size={21} /> Yêu cầu hỗ trợ sinh viên</h2>
              <p>Theo dõi các yêu cầu được gửi đến hệ thống.</p>
            </div>
            <div className="admin-faq-heading-actions">
              <span className="admin-count-badge">{supportRequests.length} yêu cầu</span>
              <button type="button" className="admin-refresh-btn"
                onClick={loadSupportRequests} disabled={supportLoading}>
                <RefreshCw size={17} className={supportLoading ? 'admin-spinning' : ''} />
                Làm mới
              </button>
            </div>
          </div>

          <div className="admin-toolbar" style={{ flexWrap: 'wrap' }}>
            <div className="admin-search">
              <Search size={19} />
              <input type="search" value={supportSearch}
                onChange={(event) => setSupportSearch(event.target.value)}
                placeholder="Tìm tên, email, nội dung, mã yêu cầu..." />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Trạng thái:</span>
              <select value={supportStatus}
                onChange={(event) => setSupportStatus(event.target.value)}
                style={{ padding: '10px 12px', border: '1px solid #dbe4ff', borderRadius: 9 }}>
                <option value="all">Tất cả</option>
                {supportStatuses.map((status) =>
                  <option key={status} value={status}>{status}</option>
                )}
              </select>
            </label>
          </div>

          {supportError && <div className="admin-error" role="alert">
            <AlertCircle size={18} /> {supportError}
          </div>}
          {supportLoading ? (
            <div className="admin-empty">Đang tải yêu cầu hỗ trợ...</div>
          ) : filteredSupportRequests.length === 0 ? (
            <div className="admin-empty">
              {supportRequests.length === 0
                ? 'Chưa có yêu cầu hỗ trợ nào.'
                : 'Không có yêu cầu phù hợp với bộ lọc.'}
            </div>
          ) : (
            <div className="admin-faq-list">
              {filteredSupportRequests.map((request, index) => {
                const id = request.id ?? `index-${index}`;
                const expanded = expandedSupportId === id;
                const title = request.subject || request.title || request.question ||
                  request.message || request.content || `Yêu cầu #${id}`;
                const sender = request.student_name || request.full_name ||
                  request.name || request.email || 'Chưa có tên người gửi';
                const status = request.status ?? 'Chưa có trạng thái';
                return (
                  <article className={`admin-faq-item ${expanded ? 'expanded' : ''}`}
                    key={id}>
                    <button type="button" className="admin-faq-toggle"
                      onClick={() => setExpandedSupportId(expanded ? null : id)}
                      aria-expanded={expanded}>
                      <div className="admin-faq-icon"><MessageCircle size={19} /></div>
                      <div className="admin-faq-title">
                        <small>{sender}</small>
                        <strong>{String(title)}</strong>
                      </div>
                      <span className="admin-count-badge">{String(status)}</span>
                      {expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
                    </button>
                    {expanded && (
                      <div className="admin-faq-details">
                        <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  }}
>
  <h4 style={{ margin: 0 }}>Chi tiết yêu cầu</h4>

  <button
    type="button"
    className="admin-refresh-btn"
    onClick={() => handleEditSupport(request)}
  >
    Chỉnh sửa
  </button>
</div>
                        <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 3fr', gap: '12px 16px', overflowWrap: 'anywhere' }}>
                          {Object.entries(request).filter(([, value]) =>
                            value !== null && value !== undefined && typeof value !== 'object'
                          ).map(([key, value]) => (
                            <Fragment key={key}><dt style={{ fontWeight: 650 }}>{key}</dt><dd style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{String(value)}</dd></Fragment>
                          ))}
                        </dl>
                        {editingSupportId === request.id && (
  <div
    style={{
      marginTop: 20,
      padding: 20,
      border: '1px solid #dbe4ff',
      borderRadius: 12,
      background: '#f8faff',
    }}
  >
    <h4 style={{ marginTop: 0 }}>
      Chỉnh sửa yêu cầu #{request.id}
    </h4>

    {/* TRẠNG THÁI */}
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={`support-status-${request.id}`}
        style={{ display: 'block', marginBottom: 8 }}
      >
        Trạng thái xử lý
      </label>

      <select
        id={`support-status-${request.id}`}
        value={supportForm.status}
        onChange={(event) =>
          setSupportForm((previous) => ({
            ...previous,
            status: event.target.value,
          }))
        }
        style={{
          width: '100%',
          padding: 12,
          border: '1px solid #dbe4ff',
          borderRadius: 8,
        }}
      >
        <option value="pending">Chờ xử lý</option>
        <option value="in_progress">Đang xử lý</option>
        <option value="resolved">Đã giải quyết</option>
        <option value="rejected">Từ chối</option>
      </select>
    </div>

    {/* MỨC ƯU TIÊN */}
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={`support-priority-${request.id}`}
        style={{ display: 'block', marginBottom: 8 }}
      >
        Mức độ ưu tiên
      </label>

      <select
        id={`support-priority-${request.id}`}
        value={supportForm.priority}
        onChange={(event) =>
          setSupportForm((previous) => ({
            ...previous,
            priority: event.target.value,
          }))
        }
        style={{
          width: '100%',
          padding: 12,
          border: '1px solid #dbe4ff',
          borderRadius: 8,
        }}
      >
        <option value="low">Thấp</option>
        <option value="normal">Bình thường</option>
        <option value="high">Cao</option>
        <option value="urgent">Khẩn cấp</option>
      </select>
    </div>

    {/* PHẢN HỒI ADMIN */}
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={`support-response-${request.id}`}
        style={{ display: 'block', marginBottom: 8 }}
      >
        Nội dung phản hồi
      </label>

      <textarea
        id={`support-response-${request.id}`}
        value={supportForm.admin_response}
        maxLength={5000}
        onChange={(event) =>
          setSupportForm((previous) => ({
            ...previous,
            admin_response: event.target.value,
          }))
        }
        placeholder="Nhập nội dung phản hồi cho sinh viên..."
        rows={5}
        style={{
          width: '100%',
          padding: 12,
          border: '1px solid #dbe4ff',
          borderRadius: 8,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
    </div>

    {/* NÚT THAO TÁC */}
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        className="admin-refresh-btn"
        onClick={() => handleUpdateSupportRequest(request.id)}
        disabled={savingSupport}
      >
        {savingSupport ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>

      <button
        type="button"
        className="admin-refresh-btn"
        onClick={() => {
          setEditingSupportId(null);
          setSupportFormMessage('');
        }}
        disabled={savingSupport}
      >
        Hủy
      </button>
    </div>
  </div>
)}

{supportFormMessage && (
  <p
    role="status"
    style={{
      marginTop: 12,
      color: '#2563eb',
      fontWeight: 500,
    }}
  >
    {supportFormMessage}
  </p>
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