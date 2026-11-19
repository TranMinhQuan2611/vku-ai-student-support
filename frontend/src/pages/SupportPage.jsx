import { useState } from 'react';
import {
  Headphones,
  Send,
  Search,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardList,
  Clock3,
  Building2,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react';

import './SupportPage.css';

const INITIAL_FORM = {
  student_name: '',
  student_email: '',
  category: 'Khác',
  subject: '',
  description: '',
};

const CATEGORIES = [
  'Đào tạo',
  'Công tác sinh viên',
  'Học phí',
  'Ký túc xá',
  'Công nghệ thông tin',
  'Khác',
];

const STATUS_LABELS = {
  pending: 'Đang chờ xử lý',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  rejected: 'Đã từ chối',
};

function SupportPage() {
  const [activeTab, setActiveTab] = useState('create');

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdRequest, setCreatedRequest] = useState(null);
  const [copied, setCopied] = useState(false);

  const [lookupToken, setLookupToken] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState(null);

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setCreateError('');
    setCreatedRequest(null);
    setCopied(false);

    try {
      const response = await fetch('/api/support-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Không thể gửi yêu cầu hỗ trợ.'
        );
      }

      if (!data.request?.lookup_token) {
        throw new Error(
          'Yêu cầu đã được gửi nhưng chưa nhận được mã tra cứu.'
        );
      }

      setCreatedRequest(data.request);
      setForm(INITIAL_FORM);
    } catch (error) {
      setCreateError(
        error.message || 'Đã xảy ra lỗi khi gửi yêu cầu.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyToken() {
    if (!createdRequest?.lookup_token) return;

    try {
      await navigator.clipboard.writeText(
        createdRequest.lookup_token
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      setCopied(false);
    }
  }

  async function handleLookup(event) {
    event.preventDefault();

    if (lookingUp) return;

    setLookingUp(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const response = await fetch(
        '/api/support-requests/lookup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lookup_token: lookupToken.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Không thể tra cứu yêu cầu.'
        );
      }

      setLookupResult(data.request);
    } catch (error) {
      setLookupError(
        error.message || 'Đã xảy ra lỗi khi tra cứu.'
      );
    } finally {
      setLookingUp(false);
    }
  }

  function formatDate(value) {
    if (!value) return 'Chưa cập nhật';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Chưa cập nhật';
    }

    return date.toLocaleString('vi-VN');
  }

  return (
    <div className="support-page">
      <header className="support-header">
        <div className="support-header-icon">
          <Headphones size={27} />
        </div>

        <div>
          <span className="support-eyebrow">
            VKU STUDENT SUPPORT
          </span>

          <h1>Yêu cầu hỗ trợ sinh viên</h1>

          <p>
            Gửi yêu cầu đến nhà trường và theo dõi
            tiến độ xử lý một cách thuận tiện.
          </p>
        </div>
      </header>

      <div className="support-tabs">
        <button
          type="button"
          className={
            activeTab === 'create'
              ? 'support-tab active'
              : 'support-tab'
          }
          onClick={() => setActiveTab('create')}
        >
          <Send size={17} />
          Gửi yêu cầu
        </button>

        <button
          type="button"
          className={
            activeTab === 'lookup'
              ? 'support-tab active'
              : 'support-tab'
          }
          onClick={() => setActiveTab('lookup')}
        >
          <Search size={17} />
          Tra cứu yêu cầu
        </button>
      </div>

      {activeTab === 'create' && (
        <section className="support-card">
          <div className="support-card-heading">
            <ClipboardList size={22} />

            <div>
              <h2>Gửi yêu cầu hỗ trợ</h2>
              <p>
                Điền thông tin để bộ phận phụ trách
                tiếp nhận và xử lý.
              </p>
            </div>
          </div>

          <form
            className="support-form"
            onSubmit={handleSubmit}
          >
            <div className="support-form-grid">
              <label className="support-field">
                <span>Họ và tên *</span>

                <input
                  type="text"
                  name="student_name"
                  value={form.student_name}
                  onChange={updateForm}
                  placeholder="Nhập họ và tên"
                  maxLength={150}
                  required
                />
              </label>

              <label className="support-field">
                <span>Email *</span>

                <input
                  type="email"
                  name="student_email"
                  value={form.student_email}
                  onChange={updateForm}
                  placeholder="Nhập địa chỉ email"
                  maxLength={255}
                  required
                />
              </label>
            </div>

            <label className="support-field">
              <span>Danh mục hỗ trợ *</span>

              <select
                name="category"
                value={form.category}
                onChange={updateForm}
                required
              >
                {CATEGORIES.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="support-field">
              <span>Tiêu đề *</span>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={updateForm}
                placeholder="Nhập tiêu đề yêu cầu"
                maxLength={255}
                required
              />
            </label>

            <label className="support-field">
              <span>Nội dung yêu cầu *</span>

              <textarea
                name="description"
                value={form.description}
                onChange={updateForm}
                placeholder="Mô tả chi tiết vấn đề cần hỗ trợ..."
                rows={6}
                required
              />
            </label>

            {createError && (
              <div
                className="support-alert error"
                role="alert"
              >
                <AlertCircle size={19} />
                <span>{createError}</span>
              </div>
            )}

            <button
              type="submit"
              className="support-primary-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2
                    size={18}
                    className="support-spin"
                  />
                  Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Gửi yêu cầu hỗ trợ
                </>
              )}
            </button>
          </form>

          {createdRequest && (
            <div className="support-success-panel">
              <div className="support-success-heading">
                <CheckCircle2 size={24} />

                <div>
                  <h3>Gửi yêu cầu thành công!</h3>

                  <p>
                    Mã yêu cầu: #{createdRequest.id}
                  </p>
                </div>
              </div>

              <p className="support-token-description">
                Hãy lưu mã tra cứu bên dưới. Bạn sẽ
                cần mã này để kiểm tra tiến độ và xem
                phản hồi từ nhà trường.
              </p>

              <div className="support-token-box">
                <code>
                  {createdRequest.lookup_token}
                </code>

                <button
                  type="button"
                  onClick={handleCopyToken}
                  title="Sao chép mã tra cứu"
                >
                  <Copy size={17} />
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>

              <div className="support-security-note">
                <ShieldCheck size={18} />
                Không chia sẻ mã tra cứu với người khác.
                Mã này chỉ được hiển thị khi tạo yêu cầu.
              </div>

              <button
                type="button"
                className="support-secondary-button"
                onClick={() => {
                  setLookupToken(
                    createdRequest.lookup_token
                  );
                  setLookupResult(null);
                  setLookupError('');
                  setActiveTab('lookup');
                }}
              >
                <Search size={17} />
                Tra cứu yêu cầu vừa gửi
              </button>
            </div>
          )}
        </section>
      )}

      {activeTab === 'lookup' && (
        <section className="support-card">
          <div className="support-card-heading">
            <Search size={22} />

            <div>
              <h2>Tra cứu yêu cầu hỗ trợ</h2>

              <p>
                Nhập mã tra cứu được cấp khi gửi yêu cầu.
              </p>
            </div>
          </div>

          <form
            className="support-form"
            onSubmit={handleLookup}
          >
            <label className="support-field">
              <span>Mã tra cứu *</span>

              <input
                type="text"
                value={lookupToken}
                onChange={(event) =>
                  setLookupToken(event.target.value)
                }
                placeholder="Nhập mã tra cứu gồm 64 ký tự"
                maxLength={64}
                autoComplete="off"
                spellCheck={false}
                required
              />
            </label>

            {lookupError && (
              <div
                className="support-alert error"
                role="alert"
              >
                <AlertCircle size={19} />
                <span>{lookupError}</span>
              </div>
            )}

            <button
              type="submit"
              className="support-primary-button"
              disabled={lookingUp}
            >
              {lookingUp ? (
                <>
                  <Loader2
                    size={18}
                    className="support-spin"
                  />
                  Đang tra cứu...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Tra cứu yêu cầu
                </>
              )}
            </button>
          </form>

          {lookupResult && (
            <div className="support-result">
              <div className="support-result-header">
                <div>
                  <span className="support-result-id">
                    Yêu cầu #{lookupResult.id}
                  </span>

                  <h3>{lookupResult.subject}</h3>
                </div>

                <span
                  className={`support-status ${
                    lookupResult.status || 'pending'
                  }`}
                >
                  {STATUS_LABELS[lookupResult.status] ||
                    'Chưa xác định'}
                </span>
              </div>

              <div className="support-result-grid">
                <div className="support-info-item">
                  <Building2 size={18} />

                  <div>
                    <span>Phòng ban phụ trách</span>
                    <strong>
                      {lookupResult.assigned_department ||
                        'Chưa phân công'}
                    </strong>
                  </div>
                </div>

                <div className="support-info-item">
                  <Clock3 size={18} />

                  <div>
                    <span>Ngày gửi</span>
                    <strong>
                      {formatDate(
                        lookupResult.created_at
                      )}
                    </strong>
                  </div>
                </div>

                <div className="support-info-item">
                  <ClipboardList size={18} />

                  <div>
                    <span>Danh mục</span>
                    <strong>
                      {lookupResult.category || 'Khác'}
                    </strong>
                  </div>
                </div>

                <div className="support-info-item">
                  <Clock3 size={18} />

                  <div>
                    <span>Cập nhật gần nhất</span>
                    <strong>
                      {formatDate(
                        lookupResult.updated_at
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="support-response-box">
                <div className="support-response-title">
                  <MessageSquareText size={19} />
                  <h4>Phản hồi từ nhà trường</h4>
                </div>

                {lookupResult.admin_response ? (
                  <p>{lookupResult.admin_response}</p>
                ) : (
                  <p className="support-response-empty">
                    Yêu cầu của bạn đang được tiếp nhận.
                    Hiện chưa có phản hồi từ Admin.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default SupportPage;