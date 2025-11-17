# Task Chainz 🔗

A decentralized task management platform where users earn cryptocurrency tokens for completing tasks and can stake tokens to create bounties for tasks they need done.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)

## 🌟 Features

### Smart Contracts (Solidity)
- **TaskChainzToken (ERC-20)**: Reward token with vesting, minting controls, and pausable transfers
- **ReputationNFT (ERC-721)**: Soul-bound NFTs representing user reputation with tiered levels
- **TaskManager**: Task creation, assignment, escrow, and completion with automated payments
- **TaskChainzDAO**: Decentralized governance with timelock and dispute resolution
- **Gamification**: Streaks, leaderboards, referrals, and community challenges

### Frontend (React + TypeScript)
- Wallet integration (MetaMask, WalletConnect)
- Task board with filtering and search
- Task creation wizard with AI assistance
- User profiles with reputation scores
- DAO governance dashboard
- Real-time notifications
- Responsive design with dark mode

### Backend (Node.js + Express)
- RESTful API for off-chain data
- IPFS integration for task descriptions
- The Graph integration for indexed blockchain events
- Analytics and reporting
- WebSocket support for real-time updates

### AI Integration (Claude)
- Automatic task categorization
- Skill-based task recommendations
- Fraud detection for suspicious tasks
- Task complexity estimation
- Auto-generated task templates

### Gamification
- Daily task completion streaks with multipliers
- Achievement system with unlockable badges
- Global and category-specific leaderboards
- Referral rewards program
- Community challenges with pooled rewards

## 🏗️ Architecture

```
task-chainz/
├── contracts/          # Smart contracts (Solidity + Hardhat)
│   ├── contracts/     # Solidity source files
│   ├── scripts/       # Deployment scripts
│   ├── test/          # Contract tests
│   └── hardhat.config.ts
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── hooks/
│   └── vite.config.ts
├── backend/           # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── middleware/
│   └── tsconfig.json
├── subgraph/          # The Graph configuration
│   ├── schema.graphql
│   └── subgraph.yaml
├── ai/                # AI services
└── docs/              # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ and npm
- MetaMask or another Web3 wallet
- (Optional) Docker for local blockchain

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/task-chainz.git
cd task-chainz
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Contracts
cp contracts/.env.example contracts/.env
# Edit contracts/.env with your values

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys
```

4. **Compile smart contracts**
```bash
cd contracts
npm run build
```

5. **Run tests**
```bash
npm test
```

### Local Development

1. **Start local blockchain**
```bash
cd contracts
npx hardhat node
```

2. **Deploy contracts (new terminal)**
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

3. **Start backend server**
```bash
cd backend
npm run dev
```

4. **Start frontend**
```bash
cd frontend
npm run dev
```

5. **Access the app**
Open http://localhost:3000 in your browser

## 📋 Deployment

### Testnet Deployment (Polygon Mumbai)

1. **Get testnet MATIC**
   - Visit [Mumbai Faucet](https://faucet.polygon.technology/)

2. **Configure network**
```bash
# Edit contracts/.env
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key
POLYGONSCAN_API_KEY=your_api_key
```

3. **Deploy contracts**
```bash
cd contracts
npm run deploy:testnet
```

4. **Verify contracts**
```bash
npm run verify -- --network polygonMumbai <CONTRACT_ADDRESS>
```

### Mainnet Deployment (Polygon)

⚠️ **IMPORTANT**: Complete security audit before mainnet deployment!

See `docs/DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📖 Documentation

### Smart Contracts

- **TaskChainzToken** (`contracts/contracts/TaskChainzToken.sol`): ERC-20 token with 1B max supply
- **ReputationNFT** (`contracts/contracts/ReputationNFT.sol`): Soul-bound reputation NFTs
- **TaskManager** (`contracts/contracts/TaskManager.sol`): Core task management with escrow
- **TaskChainzDAO** (`contracts/contracts/TaskChainzDAO.sol`): Governance and dispute resolution
- **Gamification** (`contracts/contracts/Gamification.sol`): Gamification features

### API Endpoints

#### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create new task

#### Users
- `GET /api/users/:address` - Get user profile

#### AI
- `POST /api/ai/categorize` - Categorize task
- `POST /api/ai/estimate-complexity` - Estimate task complexity
- `POST /api/ai/detect-fraud` - Detect fraudulent tasks
- `POST /api/ai/recommend` - Get task recommendations
- `POST /api/ai/generate-template` - Generate task template

#### IPFS
- `POST /api/ipfs/upload` - Upload to IPFS
- `GET /api/ipfs/:cid` - Retrieve from IPFS

## 🧪 Testing

```bash
# Smart contract tests
cd contracts
npm test

# Coverage report
npm run test:coverage
```

## 🔒 Security

- All smart contracts follow OpenZeppelin standards
- Comprehensive access control with role-based permissions
- Reentrancy guards on all state-changing functions
- Rate limiting on API endpoints
- Input validation and sanitization
- Security audit checklist: `docs/SECURITY_AUDIT.md`

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- The Graph for blockchain indexing
- Anthropic Claude for AI capabilities
- Polygon for low-cost transactions
- IPFS for decentralized storage

## 🗺️ Roadmap

- [x] Smart contract development
- [x] Frontend MVP
- [x] Backend API
- [x] AI integration
- [ ] Security audit
- [ ] Testnet launch
- [ ] Community testing
- [ ] Mainnet deployment
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Integration with other DeFi protocols
- [ ] Cross-chain support

---

Built with ❤️ by the Task Chainz team
