import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-main">
        <h1>VKU AI Student Support</h1>
        <p>
          Chào mừng bạn đến với hệ thống trợ lý AI hỗ trợ sinh viên VKU.
        </p>
      </main>
    </div>
  );
}

export default App;