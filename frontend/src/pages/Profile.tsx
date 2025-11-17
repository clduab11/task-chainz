import { useWeb3 } from '../contexts/Web3Context';
import './Profile.css';

const Profile = () => {
  const { account, isConnected } = useWeb3();

  // Mock user data
  const userData = {
    tasksCompleted: 12,
    totalEarned: '4500',
    rating: 4.8,
    level: 3,
    nftTokenId: '42',
    skills: ['React', 'TypeScript', 'Solidity', 'Web3']
  };

  if (!isConnected) {
    return (
      <div className="profile">
        <div className="card">
          <p>Please connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <h1>My Profile</h1>

      <div className="profile-grid">
        <div className="profile-card">
          <h2>Wallet Information</h2>
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Address</span>
              <span className="info-value address">{account}</span>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h2>Reputation NFT</h2>
          <div className="nft-display">
            <div className="nft-image">
              🏆
            </div>
            <div className="nft-info">
              <div className="nft-level">Level {userData.level}</div>
              <div className="nft-token">Token #{userData.nftTokenId}</div>
            </div>
          </div>
        </div>

        <div className="profile-card stats-card">
          <h2>Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <div className="stat-value">{userData.tasksCompleted}</div>
                <div className="stat-label">Tasks Completed</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-value">{userData.totalEarned} TASKZ</div>
                <div className="stat-label">Total Earned</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <div className="stat-value">{userData.rating}/5.0</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">Level {userData.level}</div>
                <div className="stat-label">User Level</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h2>Skills</h2>
          <div className="skills-list">
            {userData.skills.map((skill, index) => (
              <span key={index} className="skill-badge">
                {skill}
              </span>
            ))}
          </div>
          <button className="button button-secondary">
            Edit Skills
          </button>
        </div>

        <div className="profile-card">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">✅</span>
              <span>Completed "Build React Dashboard"</span>
              <span className="activity-time">2 days ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">💰</span>
              <span>Earned 500 TASKZ</span>
              <span className="activity-time">2 days ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📝</span>
              <span>Applied to "Design Logo"</span>
              <span className="activity-time">5 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
