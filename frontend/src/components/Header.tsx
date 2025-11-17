import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import './Header.css';

const Header = () => {
  const { account, connect, disconnect, isConnected, chainId } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>⛓️ Task-Chainz</h1>
        </Link>
        
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/tasks">Browse Tasks</Link>
          <Link to="/create">Create Task</Link>
          {isConnected && <Link to="/profile">Profile</Link>}
        </nav>

        <div className="wallet-section">
          {chainId && (
            <span className="chain-badge">
              Chain: {chainId === 137 ? 'Polygon' : chainId === 80001 ? 'Mumbai' : chainId}
            </span>
          )}
          
          {isConnected ? (
            <div className="wallet-info">
              <span className="address">{formatAddress(account!)}</span>
              <button onClick={disconnect} className="button">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={connect} className="button button-primary">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
