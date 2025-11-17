import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { HomePage } from './pages/HomePage'
import { TaskBoardPage } from './pages/TaskBoardPage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { CreateTaskPage } from './pages/CreateTaskPage'
import { ProfilePage } from './pages/ProfilePage'
import { DAOPage } from './pages/DAOPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { StakingPage } from './pages/StakingPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tasks" element={<TaskBoardPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/create-task" element={<CreateTaskPage />} />
          <Route path="/profile/:address?" element={<ProfilePage />} />
          <Route path="/dao" element={<DAOPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/staking" element={<StakingPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
