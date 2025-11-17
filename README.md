# Task-Chainz ⛓️

**Decentralized Task Marketplace with Crypto Rewards**

A complete Web3 task marketplace built on Polygon, featuring ERC-20 token bounties, ERC-721 reputation NFTs, DAO governance, AI-powered task matching, and decentralized storage.

## 🚀 Features

### Core Functionality
- **Task Bounty System**: Create and complete tasks with ERC-20 token (TASKZ) rewards
- **Escrow System**: Secure fund locking until task completion
- **Dispute Resolution**: DAO-based governance for conflict resolution
- **Reputation NFTs**: ERC-721 tokens tracking user achievements and skills
- **AI Task Matching**: Claude API integration for intelligent task categorization and recommendations
- **Fraud Detection**: AI-powered content analysis for safety and security

### Technology Stack

#### Smart Contracts
- **Solidity 0.8.20** with OpenZeppelin contracts
- **Hardhat** for development and testing
- **TaskChainzToken** (ERC-20): Platform utility token
- **ReputationNFT** (ERC-721): On-chain reputation system
- **TaskBounty**: Main marketplace contract with escrow
- **TaskDAO**: Decentralized governance for disputes

#### Backend
- **Node.js** with Express
- **Claude API** for AI features:
  - Task categorization
  - Skill-based recommendations
  - Quality scoring
  - Fraud detection
- **IPFS** integration for decentralized storage

#### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **ethers.js v6** for blockchain interaction
- **MetaMask** integration for wallet connection
- Responsive UI with dark/light mode support

#### Web3 Infrastructure
- **Polygon Network**: Fast, low-cost transactions
- **The Graph**: Blockchain indexing and querying
- **IPFS**: Decentralized file storage

## 📦 Project Structure

```
task-chainz/
├── contracts/          # Smart contracts (Hardhat)
│   ├── contracts/      # Solidity contracts
│   ├── test/          # Contract tests
│   └── scripts/       # Deployment scripts
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   └── services/  # Business logic (AI, IPFS)
│   └── package.json
├── frontend/          # React + TypeScript app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   └── services/    # API clients
│   └── package.json
├── subgraph/          # The Graph indexer
│   ├── schema.graphql
│   └── src/mapping.ts
└── package.json       # Root workspace config
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Polygon testnet (Mumbai) or mainnet RPC access

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all

# Or install individually
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables

**Contracts** (`contracts/.env`):
```bash
cp contracts/.env.example contracts/.env
# Edit contracts/.env with your values:
# - POLYGON_RPC_URL
# - MUMBAI_RPC_URL
# - PRIVATE_KEY (for deployment)
# - POLYGONSCAN_API_KEY (for verification)
```

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values:
# - ANTHROPIC_API_KEY (for AI features)
# - IPFS_HOST, IPFS_PORT (for IPFS)
# - INFURA_PROJECT_ID/SECRET (if using Infura IPFS)
```

### 3. Compile Smart Contracts

```bash
cd contracts
npm run compile
```

### 4. Run Tests

```bash
# Smart contract tests
cd contracts
npm test

# Backend tests (when implemented)
cd backend
npm test
```

### 5. Deploy Smart Contracts

```bash
# Deploy to local Hardhat network
cd contracts
npx hardhat node  # In one terminal
npm run deploy    # In another terminal

# Deploy to Mumbai testnet
npm run deploy -- --network mumbai

# Deploy to Polygon mainnet
npm run deploy -- --network polygon
```

After deployment, contract addresses will be saved to `contracts/deployments/`.

### 6. Configure The Graph Subgraph

```bash
cd subgraph
# Update subgraph.yaml with deployed contract addresses
# Update network and startBlock
npm run codegen
npm run build
npm run deploy  # Requires The Graph account
```

### 7. Start Development Servers

```bash
# Start backend (terminal 1)
cd backend
npm run dev  # Runs on http://localhost:3001

# Start frontend (terminal 2)
cd frontend
npm run dev  # Runs on http://localhost:3000

# Or run both from root
npm run dev
```

## 🎮 Usage

### For Task Creators

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask
2. **Create Task**: Navigate to "Create Task"
   - Enter task details
   - Set bounty amount (TASKZ tokens)
   - Set deadline
   - Task description stored on IPFS
3. **Review Applications**: Workers apply for your tasks
4. **Assign Task**: Choose the best applicant
5. **Review Submission**: Approve or dispute completed work
6. **Release Payment**: Funds automatically released from escrow

### For Workers

1. **Connect Wallet**: Connect your Web3 wallet
2. **Browse Tasks**: View all available tasks
3. **Apply**: Submit application for tasks matching your skills
4. **Complete Work**: Deliver according to requirements
5. **Submit**: Submit completed work for review
6. **Get Paid**: Receive TASKZ tokens upon approval
7. **Build Reputation**: Earn NFTs and increase your level

### AI Features

The backend provides AI-powered endpoints:

- **POST /api/ai/categorize**: Auto-categorize tasks
- **POST /api/ai/recommend**: Get personalized task recommendations
- **POST /api/ai/fraud-detection**: Analyze content for fraud
- **POST /api/ai/quality-score**: Score task quality

## 🔐 Security Features

- ✅ Escrow system for secure payments
- ✅ ReentrancyGuard on all state-changing functions
- ✅ AI-powered fraud detection
- ✅ DAO governance for dispute resolution
- ✅ OpenZeppelin audited contracts
- ✅ Decentralized storage on IPFS

## 🧪 Testing

```bash
# Smart contracts
cd contracts
npm test
npm run coverage

# Run with gas reporting
REPORT_GAS=true npm test
```

## 📊 Smart Contract Architecture

### TaskChainzToken (ERC-20)
- Platform utility token
- Used for task bounties
- Mintable by owner
- Burnable by holders

### ReputationNFT (ERC-721)
- One NFT per user
- Tracks completion stats
- Dynamic level system
- Rating system (0-100)

### TaskBounty
- Main marketplace logic
- Escrow management
- Task lifecycle (Open → Assigned → Submitted → Completed)
- 2.5% platform fee
- Dispute creation

### TaskDAO
- Governance token voting
- Proposal system
- Dispute resolution
- Parameter updates

## 🌐 Network Support

- **Polygon Mainnet** (Chain ID: 137)
- **Mumbai Testnet** (Chain ID: 80001)
- **Local Hardhat** (Chain ID: 31337)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [The Graph Documentation](https://thegraph.com/docs)
- [Polygon Documentation](https://docs.polygon.technology/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Anthropic Claude API](https://docs.anthropic.com/)

## 💬 Support

For questions and support, please open an issue on GitHub.

---

Built with ❤️ using Web3 technologies
