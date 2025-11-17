import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Header from './components/Header';
import Home from './pages/Home';
import CreateTask from './pages/CreateTask';
import BrowseTasks from './pages/BrowseTasks';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateTask />} />
              <Route path="/tasks" element={<BrowseTasks />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
