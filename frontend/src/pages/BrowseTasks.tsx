import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './BrowseTasks.css';

interface Task {
  id: number;
  title: string;
  description: string;
  bounty: string;
  category: string;
  status: string;
  deadline: string;
}

const BrowseTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // TODO: Fetch tasks from The Graph or smart contract
    // Mock data for now
    const mockTasks: Task[] = [
      {
        id: 1,
        title: 'Build a React Dashboard',
        description: 'Create a responsive admin dashboard with charts and tables',
        bounty: '500',
        category: 'Development',
        status: 'Open',
        deadline: '2024-12-31'
      },
      {
        id: 2,
        title: 'Design Logo and Brand Identity',
        description: 'Create a modern logo and brand guidelines for a tech startup',
        bounty: '300',
        category: 'Design',
        status: 'Open',
        deadline: '2024-12-25'
      }
    ];
    setTasks(mockTasks);
  }, []);

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === filter);

  return (
    <div className="browse-tasks">
      <div className="browse-header">
        <h1>Browse Tasks</h1>
        <div className="filters">
          <button 
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'Development' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('Development')}
          >
            Development
          </button>
          <button 
            className={filter === 'Design' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('Design')}
          >
            Design
          </button>
          <button 
            className={filter === 'Marketing' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('Marketing')}
          >
            Marketing
          </button>
          <button 
            className={filter === 'Writing' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('Writing')}
          >
            Writing
          </button>
        </div>
      </div>

      <div className="tasks-grid">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks found. Check back later or create your own!</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <Link to={`/tasks/${task.id}`} key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className="category-badge">{task.category}</span>
              </div>
              <p className="task-description">{task.description}</p>
              <div className="task-footer">
                <div className="bounty">
                  💰 {task.bounty} TASKZ
                </div>
                <div className="deadline">
                  ⏰ {new Date(task.deadline).toLocaleDateString()}
                </div>
              </div>
              <div className="status-badge">{task.status}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default BrowseTasks;
