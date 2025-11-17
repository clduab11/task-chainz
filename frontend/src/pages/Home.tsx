import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import './Home.css';

const Home = () => {
  const { isConnected } = useWeb3();

  return (
    <div className="home">
      <section className="hero">
        <h1>Decentralized Task Marketplace</h1>
        <p className="subtitle">
          Earn crypto rewards by completing tasks. Powered by blockchain, AI, and IPFS.
        </p>
        
        {!isConnected && (
          <p className="connect-prompt">
            Connect your wallet to get started
          </p>
        )}
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>Crypto Bounties</h3>
          <p>Get paid in TASKZ tokens with secure escrow and instant payouts</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Reputation NFTs</h3>
          <p>Build your on-chain reputation and unlock better opportunities</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <h3>AI Matching</h3>
          <p>Smart task recommendations based on your skills and history</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚖️</div>
          <h3>DAO Governance</h3>
          <p>Community-driven dispute resolution and platform decisions</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <h3>IPFS Storage</h3>
          <p>Decentralized storage for task data and deliverables</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Polygon Network</h3>
          <p>Fast transactions with low fees on Polygon blockchain</p>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to get started?</h2>
        <div className="cta-buttons">
          <Link to="/tasks" className="button button-primary">
            Browse Tasks
          </Link>
          <Link to="/create" className="button">
            Create a Task
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
