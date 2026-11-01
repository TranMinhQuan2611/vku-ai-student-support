import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-main">
        <ChatPage />
      </main>
    </div>
  );
}

export default App;