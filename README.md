# TaskChainz

A decentralized Web3 task management platform with blockchain-based task tracking, ERC-20 token rewards, and IPFS metadata storage.

## Features

- **Smart Contract Layer**: Solidity contracts for task creation, completion, and token rewards
- **ERC-20 Token Rewards**: TASK tokens minted as rewards for completing tasks
- **IPFS Integration**: Task metadata and completion proofs stored on IPFS
- **Web3 Authentication**: Signature-based task validation
- **React Frontend**: Modern UI with MetaMask wallet connection
- **Gas Optimized**: Contracts optimized for minimal gas usage

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- MetaMask wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/clduab11/task-chainz.git
cd task-chainz

# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Configuration

1. Copy the environment example:
```bash
cp .env.example .env
```

2. Fill in your configuration:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_key
```

### Development

```bash
# Start local Hardhat node
npm run node

# Deploy contracts to local network
npm run deploy:local

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Start frontend development server
npm run frontend:dev
```

### Deployment

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify contracts on Etherscan
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## Architecture

### Smart Contracts

#### TaskToken.sol
- ERC-20 token for task rewards
- Capped supply of 1 billion tokens
- Role-based minting (MINTER_ROLE)
- ERC20Permit for gasless approvals

#### TaskChainz.sol
- Main task management contract
- Task lifecycle: Open -> InProgress -> Completed
- IPFS integration for metadata storage
- Signature-based validation system
- Platform fee mechanism (2.5% default)
- Dispute resolution system

### Frontend

- **Next.js 14** with App Router
- **RainbowKit** for wallet connection
- **wagmi** for React hooks
- **TailwindCSS** for styling

## Usage

### Creating a Task

```typescript
import { useTaskChainz } from './hooks/useTaskChainz';

const { createTask } = useTaskChainz(chainId);

// Upload metadata to IPFS first
const ipfsHash = await uploadToIPFS({
  title: 'Build REST API',
  description: 'Create a REST API with authentication',
  requirements: ['Node.js', 'Express', 'JWT'],
});

// Create task on-chain
await createTask(
  ipfsHash,
  '100', // 100 TASK tokens reward
  Math.floor(Date.now() / 1000) + 86400 // 24 hour deadline
);
```

### Completing a Task

```typescript
const { assignTask, completeTask } = useTaskChainz(chainId);

// First assign the task to yourself
await assignTask(taskId);

// Upload completion proof to IPFS
const completionHash = await uploadToIPFS({
  description: 'API implemented with full test coverage',
  evidence: ['https://github.com/...'],
});

// Complete the task
await completeTask(taskId, completionHash);
```

## Testing

The project includes comprehensive tests with 90%+ coverage:

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Generate coverage report
npm run test:coverage
```

## Gas Optimization

- Solidity optimizer enabled with 200 runs
- viaIR compilation for better optimization
- Efficient storage packing in structs
- Events for off-chain indexing

## Security

- OpenZeppelin contracts for battle-tested implementations
- AccessControl for role-based permissions
- ReentrancyGuard on all state-changing functions
- Input validation with custom errors
- Signature verification to prevent replay attacks

## Docker Deployment

```bash
# Build the Docker image
npm run docker:build

# Run with docker-compose
npm run docker:run
```

## NPM Package

The project can be used as an NPM package:

```typescript
import {
  TaskChainz__factory,
  TaskToken__factory,
  TaskStatus,
  formatTaskTokens,
  parseTaskTokens
} from 'task-chainz';

// Deploy contracts
const taskToken = await new TaskToken__factory(signer).deploy(initialSupply);
const taskChainz = await new TaskChainz__factory(signer).deploy(
  taskToken.address,
  feeRecipient
);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.
