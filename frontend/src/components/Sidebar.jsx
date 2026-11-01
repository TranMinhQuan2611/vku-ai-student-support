import './Sidebar.css';
import {
  GraduationCap,
  MessageCircle,
  BookOpen,
  History,
  Settings,
  Sparkles
} from 'lucide-react';

function Sidebar() {
  const menuItems = [
    { icon: MessageCircle, label: 'Trợ lý AI', active: true },
    { icon: BookOpen, label: 'Câu hỏi thường gặp' },
    { icon: History, label: 'Lịch sử hội thoại' },
    { icon: Settings, label: 'Quản trị hệ thống' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <GraduationCap size={28} />
        </div>

        <div>
          <h2>VKU AI</h2>
          <p>Student Support</p>
        </div>
      </div>

      <div className="sidebar-section-title">
        KHÁM PHÁ
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className={`sidebar-menu-item ${
                item.active ? 'active' : ''
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-ai-card">
          <Sparkles size={22} />

          <h3>Trợ lý sinh viên VKU</h3>

          <p>
            Hỗ trợ giải đáp thắc mắc về học tập,
            đăng ký học phần và dịch vụ sinh viên.
          </p>
        </div>

        <div className="sidebar-footer">
          <span>VKU AI Student Support</span>
          <small>Version 1.0.0</small>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;