import {
  GraduationCap,
  MessageCircle,
  BookOpen,
  History,
  ClipboardList,
  Sparkles,
  ChevronRight,
  CircleHelp,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

import './Sidebar.css';

// ==========================================
// STUDENT NAVIGATION
// ==========================================

const menuItems = [
  {
    id: 'chat',
    label: 'Trợ lý AI',
    icon: MessageCircle,
    path: '/',
  },
  {
    id: 'faq',
    label: 'Câu hỏi thường gặp',
    icon: BookOpen,
    path: '/faq',
  },
  {
    id: 'history',
    label: 'Lịch sử hội thoại',
    icon: History,
    path: '/history',
  },
  {
  id: 'support',
  label: 'Yêu cầu hỗ trợ',
  icon: ClipboardList,
  path: '/support',
},
];

// ==========================================
// SIDEBAR COMPONENT
// ==========================================

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <GraduationCap size={26} strokeWidth={2.2} />
          </div>

          <div className="sidebar-brand-text">
            <h2>VKU AI</h2>
            <span>Student Support</span>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-title">
            KHÔNG GIAN LÀM VIỆC
          </span>

          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={19} strokeWidth={2} />

                      <span>{item.label}</span>

                      {isActive && (
                        <ChevronRight
                          className="sidebar-chevron"
                          size={16}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-ai-card">
          <div className="sidebar-ai-icon">
            <Sparkles size={20} />
          </div>

          <h3>Trợ lý AI VKU</h3>

          <p>
            Đồng hành cùng bạn trong học tập
            và cuộc sống sinh viên.
          </p>

          <div className="sidebar-ai-status">
            <span className="status-dot"></span>
            Sẵn sàng hỗ trợ
          </div>
        </div>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <CircleHelp size={18} />
          <span>Trung tâm hỗ trợ</span>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-logo">
            <GraduationCap size={19} />
          </div>

          <div>
            <strong>VKU AI Student Support</strong>
            <small>Phiên bản 1.0.0</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;