import { useParams } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import './TaskDetail.css';

const TaskDetail = () => {
  const { id } = useParams();
  const { isConnected } = useWeb3();

  // Mock task data
  const task = {
    id: id,
    title: 'Build a React Dashboard',
    description: 'Create a responsive admin dashboard with charts, tables, and user management features. Must be built with React, TypeScript, and use modern UI libraries.',
    bounty: '500',
    category: 'Development',
    status: 'Open',
    deadline: '2024-12-31',
    creator: '0x1234...5678',
    skills: ['React', 'TypeScript', 'CSS', 'UI/UX']
  };

  const handleApply = () => {
    if (!isConnected) {
      alert('Please connect your wallet to apply');
      return;
    }
    alert('Task application will be implemented with smart contract integration');
  };

  return (
    <div className="task-detail">
      <div className="task-content">
        <div className="task-main">
          <div className="task-status-bar">
            <span className={`status-badge ${task.status.toLowerCase()}`}>
              {task.status}
            </span>
            <span className="category-tag">{task.category}</span>
          </div>

          <h1>{task.title}</h1>

          <div className="task-meta">
            <div className="meta-item">
              <span className="meta-label">Bounty</span>
              <span className="meta-value bounty-value">💰 {task.bounty} TASKZ</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Deadline</span>
              <span className="meta-value">
                ⏰ {new Date(task.deadline).toLocaleDateString()}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Creator</span>
              <span className="meta-value creator-address">{task.creator}</span>
            </div>
          </div>

          <div className="task-section">
            <h2>Description</h2>
            <p className="task-description">{task.description}</p>
          </div>

          <div className="task-section">
            <h2>Required Skills</h2>
            <div className="skills-list">
              {task.skills.map((skill, index) => (
                <span key={index} className="skill-badge">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="task-sidebar">
          <div className="sidebar-card">
            <h3>Apply for this Task</h3>
            {isConnected ? (
              <>
                <p className="sidebar-info">
                  Submit your application to work on this task. The creator will review and assign it to you if approved.
                </p>
                <button onClick={handleApply} className="button button-primary full-width">
                  Apply Now
                </button>
              </>
            ) : (
              <p className="sidebar-info">
                Please connect your wallet to apply for this task.
              </p>
            )}
          </div>

          <div className="sidebar-card">
            <h3>Task Info</h3>
            <div className="info-list">
              <div className="info-item">
                <span>Platform Fee</span>
                <span>2.5%</span>
              </div>
              <div className="info-item">
                <span>Your Reward</span>
                <span className="highlight">{(parseFloat(task.bounty) * 0.975).toFixed(1)} TASKZ</span>
              </div>
              <div className="info-item">
                <span>Payment Method</span>
                <span>TASKZ Token</span>
              </div>
              <div className="info-item">
                <span>Escrow</span>
                <span className="success">✓ Secured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
