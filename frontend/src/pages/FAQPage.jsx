import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import './FAQPage.css';

const API_URL = 'http://localhost:3001/api/faqs';

function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lấy danh sách FAQ từ backend
  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu FAQ.');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || 'Không thể tải danh sách câu hỏi.'
        );
      }

      // Hỗ trợ cả cấu trúc { faqs: [] } và { data: [] }
      const faqList = Array.isArray(result.faqs)
        ? result.faqs
        : Array.isArray(result.data)
          ? result.data
          : [];

      setFaqs(faqList);
    } catch (err) {
      console.error('Lỗi tải FAQ:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  // Tạo danh sách danh mục từ dữ liệu thực tế
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        faqs
          .map((faq) => faq.category)
          .filter(Boolean)
      ),
    ];

    return uniqueCategories;
  }, [faqs]);

  // Tìm kiếm và lọc FAQ
  const filteredFAQs = useMemo(() => {
    const keyword = searchTerm.trim().toLocaleLowerCase('vi-VN');

    return faqs.filter((faq) => {
      const question = String(faq.question || '')
        .toLocaleLowerCase('vi-VN');

      const answer = String(faq.answer || '')
        .toLocaleLowerCase('vi-VN');

      const category = String(faq.category || '')
        .toLocaleLowerCase('vi-VN');

      const keywords = Array.isArray(faq.keywords)
        ? faq.keywords.join(' ').toLocaleLowerCase('vi-VN')
        : '';

      const matchesSearch =
        !keyword ||
        question.includes(keyword) ||
        answer.includes(keyword) ||
        category.includes(keyword) ||
        keywords.includes(keyword);

      const matchesCategory =
        selectedCategory === 'all' ||
        faq.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchTerm, selectedCategory]);

  // Mở hoặc đóng câu trả lời
  const toggleFAQ = (id) => {
    setExpandedId((currentId) =>
      currentId === id ? null : id
    );
  };

  return (
    <div className="faq-page">
      {/* PHẦN TIÊU ĐỀ */}
      <header className="faq-header">
        <div className="faq-header-content">
          <div className="faq-header-badge">
            <Sparkles size={15} />
            <span>TRUNG TÂM KIẾN THỨC VKU</span>
          </div>

          <h1>Câu hỏi thường gặp</h1>

          <p>
            Khám phá những thông tin hữu ích về học tập,
            đăng ký học phần và đời sống sinh viên tại VKU.
          </p>
        </div>

        <div className="faq-header-icon">
          <BookOpen size={32} strokeWidth={1.8} />
        </div>
      </header>

      {/* THỐNG KÊ */}
      <section className="faq-stats">
        <div className="faq-stat-card">
          <div className="faq-stat-icon blue">
            <BookOpen size={21} />
          </div>

          <div>
            <strong>{faqs.length}</strong>
            <span>Câu hỏi hiện có</span>
          </div>
        </div>

        <div className="faq-stat-card">
          <div className="faq-stat-icon purple">
            <CircleHelp size={21} />
          </div>

          <div>
            <strong>{categories.length}</strong>
            <span>Danh mục kiến thức</span>
          </div>
        </div>

        <div className="faq-stat-card">
          <div className="faq-stat-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <strong>
              {faqs.filter((faq) => faq.verified === true).length}
            </strong>
            <span>Thông tin đã xác minh</span>
          </div>
        </div>
      </section>

      {/* THANH TÌM KIẾM */}
      <section className="faq-toolbar">
        <div className="faq-search">
          <Search size={20} />

          <input
            type="text"
            placeholder="Tìm kiếm câu hỏi, từ khóa hoặc nội dung..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="faq-refresh-button"
          onClick={fetchFAQs}
          disabled={loading}
          title="Tải lại danh sách FAQ"
        >
          <RefreshCw size={19} />
          <span>Làm mới</span>
        </button>
      </section>

      {/* DANH MỤC */}
      <section className="faq-categories">
        <button
          type="button"
          className={`faq-category-button ${
            selectedCategory === 'all' ? 'active' : ''
          }`}
          onClick={() => setSelectedCategory('all')}
        >
          Tất cả
        </button>

        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`faq-category-button ${
              selectedCategory === category ? 'active' : ''
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </section>

      {/* TIÊU ĐỀ DANH SÁCH */}
      <div className="faq-list-heading">
        <div>
          <h2>Danh sách câu hỏi</h2>
          <p>
            {loading
              ? 'Đang tải dữ liệu...'
              : `Tìm thấy ${filteredFAQs.length} câu hỏi`}
          </p>
        </div>
      </div>

      {/* TRẠNG THÁI ĐANG TẢI */}
      {loading && (
        <div className="faq-state">
          <RefreshCw size={30} className="faq-loading-icon" />
          <h3>Đang tải câu hỏi...</h3>
          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      )}

      {/* TRẠNG THÁI LỖI */}
      {!loading && error && (
        <div className="faq-state faq-error">
          <AlertCircle size={32} />
          <h3>Không thể tải dữ liệu</h3>
          <p>{error}</p>

          <button type="button" onClick={fetchFAQs}>
            Thử lại
          </button>
        </div>
      )}

      {/* KHÔNG CÓ KẾT QUẢ */}
      {!loading && !error && filteredFAQs.length === 0 && (
        <div className="faq-state">
          <Search size={32} />
          <h3>Không tìm thấy câu hỏi phù hợp</h3>
          <p>
            Hãy thử từ khóa khác hoặc chọn một danh mục khác.
          </p>
        </div>
      )}

      {/* DANH SÁCH FAQ */}
      {!loading && !error && filteredFAQs.length > 0 && (
        <section className="faq-list">
          {filteredFAQs.map((faq) => {
            const isExpanded = expandedId === faq.id;

            return (
              <article
                key={faq.id}
                className={`faq-item ${
                  isExpanded ? 'expanded' : ''
                }`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFAQ(faq.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="faq-question-icon">
                    <CircleHelp size={20} />
                  </div>

                  <div className="faq-question-content">
                    <span className="faq-question-category">
                      {faq.category || 'Chưa phân loại'}
                    </span>

                    <h3>{faq.question}</h3>
                  </div>

                  <div className="faq-question-arrow">
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="faq-answer">
                    <div className="faq-answer-divider" />

                    <p>{faq.answer}</p>

                    <div className="faq-answer-footer">
                      {faq.verified === true ? (
                        <span className="faq-verified">
                          <CheckCircle2 size={15} />
                          Đã xác minh
                        </span>
                      ) : (
                        <span className="faq-unverified">
                          <AlertCircle size={15} />
                          Thông tin tham khảo
                        </span>
                      )}

                      {faq.source_url && (
                        <a
                          href={faq.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="faq-source-link"
                        >
                          Xem nguồn thông tin
                        </a>
                      )}
                    </div>

                    {faq.verified !== true && (
                      <div className="faq-disclaimer">
                        Thông tin này chưa được xác minh từ
                        nguồn chính thức của VKU. Vui lòng
                        kiểm tra lại trước khi sử dụng.
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default FAQPage;