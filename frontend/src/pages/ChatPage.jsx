import { useState } from 'react';
import {
  Sparkles,
  Send,
  BookOpen,
  GraduationCap,
  CalendarDays,
  House,
  Volume2,
  Bot,
  UserRound,
  CircleCheck,
} from 'lucide-react';

import './ChatPage.css';

// Địa chỉ Backend
const API_URL = 'http://localhost:3001/api/ask';

// Các câu hỏi gợi ý
const suggestions = [
  {
    icon: BookOpen,
    title: 'Đăng ký học phần',
    question: 'Làm thế nào để đăng ký học phần tại VKU?',
  },
  {
    icon: GraduationCap,
    title: 'Xét tốt nghiệp',
    question: 'Điều kiện xét tốt nghiệp tại VKU là gì?',
  },
  {
    icon: House,
    title: 'Ký túc xá',
    question: 'Làm thế nào để đăng ký ký túc xá tại VKU?',
  },
  {
    icon: CalendarDays,
    title: 'Lịch thi',
    question: 'Làm thế nào để xem lịch thi tại VKU?',
  },
];

function ChatPage() {
  // Nội dung đang nhập
  const [input, setInput] = useState('');

  // Danh sách tin nhắn
  const [messages, setMessages] = useState([]);

  // Trạng thái chờ AI
  const [isLoading, setIsLoading] = useState(false);

  // Gửi câu hỏi đến Backend
  const handleSend = async (question = input) => {
    const text = question.trim();

    // Không gửi câu hỏi rỗng hoặc khi đang chờ
    if (!text || isLoading) return;

    // Giới hạn theo Backend
    if (text.length > 1000) {
      alert('Câu hỏi không được vượt quá 1000 ký tự.');
      return;
    }

    // Tạo tin nhắn người dùng
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    // Hiển thị câu hỏi ngay lập tức
    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    // Xóa nội dung ô nhập
    setInput('');

    // Bắt đầu trạng thái chờ
    setIsLoading(true);

    try {
      // Gửi câu hỏi đến Express Backend
      const response = await fetch(API_URL, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          question: text,
        }),
      });

      // Đọc dữ liệu Backend trả về
      const data = await response.json();

      // Kiểm tra lỗi HTTP hoặc lỗi xử lý
      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || 'Không thể xử lý câu hỏi.'
        );
      }

      // Lấy nội dung trả lời từ n8n
      const answer =
        typeof data.answer === 'string' &&
        data.answer.trim()
          ? data.answer
          : 'Xin lỗi, tôi chưa tìm thấy câu trả lời phù hợp. Bạn vui lòng thử đặt câu hỏi khác.';

      // Tạo tin nhắn AI
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
        verified: data.verified,
        category: data.category || null,
      };

      // Hiển thị câu trả lời AI
      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

    } catch (error) {
      console.error('Lỗi gửi câu hỏi:', error);

      // Hiển thị lỗi ngay trong khung chat
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          error.message ||
          'Không thể kết nối đến hệ thống. Vui lòng thử lại sau.',
        isError: true,
      };

      setMessages((previous) => [
        ...previous,
        errorMessage,
      ]);

    } finally {
      // Kết thúc trạng thái chờ
      setIsLoading(false);
    }
  };

  // Đọc câu trả lời bằng giọng nói
  const handleSpeak = (text) => {
    // Kiểm tra trình duyệt hỗ trợ TTS
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt chưa hỗ trợ đọc văn bản.');
      return;
    }

    // Dừng giọng đọc trước đó
    window.speechSynthesis.cancel();

    // Lấy danh sách giọng đọc
    const voices = window.speechSynthesis.getVoices();

    // Ưu tiên giọng nữ miền Nam
    const selectedVoice = voices.find(
      (voice) =>
        voice.name.includes('Vietnamese (Southern)') &&
        voice.name.includes('female2')
    );

    // Nếu không có giọng female2, tìm giọng miền Nam khác
    const southernVoice = voices.find(
      (voice) =>
        voice.name.includes('Vietnamese (Southern)')
    );

    // Nếu không có giọng miền Nam, tìm giọng tiếng Việt
    const vietnameseVoice = voices.find(
      (voice) =>
        voice.lang?.toLowerCase().startsWith('vi')
    );

    // Tạo nội dung cần đọc
    const utterance = new SpeechSynthesisUtterance(text);

    // Chọn giọng đọc phù hợp
    utterance.voice =
      selectedVoice ||
      southernVoice ||
      vietnameseVoice ||
      null;

    // Ngôn ngữ tiếng Việt
    utterance.lang = 'vi-VN';

    // Tốc độ đọc chậm, dễ nghe
    utterance.rate = 0.9;

    // Cao độ giọng nói
    utterance.pitch = 1;

    // Âm lượng tối đa
    utterance.volume = 1;

    // Theo dõi khi bắt đầu đọc
    utterance.onstart = () => {
      console.log('Đã bắt đầu đọc câu trả lời.');
    };

    // Theo dõi khi đọc xong
    utterance.onend = () => {
      console.log('Đã đọc xong câu trả lời.');
    };

    // Xử lý lỗi phát giọng nói
    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        console.error('Lỗi phát giọng nói:', event.error);
      }
    };

    // Bắt đầu đọc
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="chat-page">

      {/* HEADER */}
      <header className="chat-header">
        <div>
          <div className="chat-eyebrow">
            <Sparkles size={15} />
            KHÔNG GIAN TRỢ LÝ AI
          </div>

          <h1>Xin chào! 👋</h1>

          <p>
            Tôi có thể giúp gì cho bạn hôm nay?
          </p>
        </div>

        <div className="chat-online">
          <span className="chat-online-dot" />

          {isLoading
            ? 'Đang xử lý câu hỏi...'
            : 'Trợ lý sẵn sàng'}
        </div>
      </header>

      {/* KHUNG CHAT */}
      <section className="chat-panel">

        {messages.length === 0 ? (

          // Giao diện chào mừng
          <div className="chat-welcome">

            <div className="chat-welcome-icon">
              <Sparkles size={30} />
            </div>

            <div className="chat-badge">
              <CircleCheck size={14} />
              VKU AI STUDENT SUPPORT
            </div>

            <h2>
              Học tập dễ dàng hơn
              <br />
              cùng trợ lý AI VKU
            </h2>

            <p className="chat-description">
              Khám phá thông tin học tập, đăng ký học phần,
              lịch thi và dịch vụ sinh viên trong một
              không gian hỗ trợ thông minh.
            </p>

            {/* Câu hỏi gợi ý */}
            <div className="chat-suggestions">

              {suggestions.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    type="button"
                    className="chat-suggestion"
                    onClick={() => handleSend(item.question)}
                    disabled={isLoading}
                  >
                    <span className="chat-suggestion-icon">
                      <Icon size={19} />
                    </span>

                    <span>{item.title}</span>
                  </button>
                );
              })}

            </div>
          </div>

        ) : (

          // Danh sách tin nhắn
          <div className="chat-messages">

            {messages.map((message) => (

              <div
                key={message.id}
                className={`chat-message ${message.role}`}
              >

                {/* Avatar */}
                <div className="chat-avatar">

                  {message.role === 'user' ? (
                    <UserRound size={19} />
                  ) : (
                    <Bot size={19} />
                  )}

                </div>

                {/* Nội dung tin nhắn */}
                <div className="chat-message-body">

                  <div className="chat-message-label">
                    {message.role === 'user'
                      ? 'Bạn'
                      : 'VKU AI Assistant'}
                  </div>

                  <div className="chat-bubble">
                    {message.content}
                  </div>

                  {/* Thông báo FAQ chưa xác minh */}
                  {message.role === 'assistant' &&
                    message.verified === false && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#9a6700',
                          marginTop: '8px',
                          lineHeight: '1.5',
                        }}
                      >
                        ⚠️ Thông tin tham khảo,
                        chưa được xác minh từ nguồn chính thức.
                      </p>
                    )}

                  {/* Nút đọc câu trả lời */}
                  {message.role === 'assistant' &&
                    !message.isError && (

                      <button
                        type="button"
                        className="chat-speak-button"
                        onClick={() =>
                          handleSpeak(message.content)
                        }
                      >
                        <Volume2 size={15} />
                        Nghe câu trả lời
                      </button>

                    )}

                </div>
              </div>

            ))}

            {/* Trạng thái AI đang trả lời */}
            {isLoading && (

              <div className="chat-message assistant">

                <div className="chat-avatar">
                  <Bot size={19} />
                </div>

                <div className="chat-message-body">

                  <div className="chat-message-label">
                    VKU AI Assistant
                  </div>

                  <div className="chat-bubble">
                    <span>✨ Đang tìm câu trả lời...</span>
                  </div>

                </div>
              </div>

            )}

          </div>

        )}

        {/* Ô nhập câu hỏi */}
        <form
          className="chat-input-area"
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
        >

          <div className="chat-input-box">

            <Sparkles
              className="chat-input-sparkle"
              size={20}
            />

            <input
              type="text"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder={
                isLoading
                  ? 'Đang chờ trợ lý trả lời...'
                  : 'Nhập câu hỏi của bạn tại đây...'
              }
              aria-label="Nhập câu hỏi"
              maxLength={1000}
              disabled={isLoading}
            />

            <button
              type="submit"
              className="chat-send-button"
              disabled={!input.trim() || isLoading}
              aria-label="Gửi câu hỏi"
            >
              <Send size={19} />
            </button>

          </div>

          <p className="chat-input-note">
            Trợ lý AI hỗ trợ thông tin sinh viên VKU.
            Hãy kiểm tra các thông báo chính thức
            khi cần xác nhận thông tin quan trọng.
          </p>

        </form>

      </section>
    </div>
  );
}

export default ChatPage;