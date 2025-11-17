# Task-Chainz Smart Contracts

Smart contracts for the Task-Chainz decentralized task marketplace.

## Contracts

### TaskChainzToken.sol
ERC-20 utility token for the platform.
- **Symbol**: TASKZ
- **Initial Supply**: 1 billion tokens
- **Features**: Mintable by owner, burnable by holders

### ReputationNFT.sol
ERC-721 NFT for user reputation tracking.
- **Features**: 
  - One NFT per user
  - Tracks tasks completed, earnings, rating, and level
  - Dynamic level system based on completions
  - URI storage for metadata

### TaskBounty.sol
Main marketplace contract.
- **Features**:
  - Create tasks with token escrow
  - Assign tasks to workers
  - Submit and approve completions
  - Dispute creation and resolution
  - 2.5% platform fee
  - ReentrancyGuard protection

### TaskDAO.sol (governance/)
DAO governance for dispute resolution.
- **Features**:
  - Proposal system
  - Token-weighted voting
  - Configurable voting parameters
  - Proposal execution

## Development

### Install Dependencies
```bash
npm install
```

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm test

# With gas reporting
REPORT_GAS=true npm test

# With coverage
npm run coverage
```

### Deploy

```bash
# Local Hardhat network
npm run deploy

# Mumbai testnet
npm run deploy -- --network mumbai

# Polygon mainnet
npm run deploy -- --network polygon
```

### Verify on PolygonScan
```bash
npx hardhat verify --network polygon DEPLOYED_CONTRACT_ADDRESS
```

## Contract Addresses

After deployment, addresses are saved to `deployments/{network}.json`.

## Security

- Uses OpenZeppelin v5 audited contracts
- ReentrancyGuard on all state-changing functions
- Ownable for access control
- Escrow mechanism for secure payments

## Testing

Test coverage includes:
- Task creation and escrow
- Task assignment and lifecycle
- Payment release and fee calculation
- Dispute creation and resolution
- Reputation NFT minting and updates

## Gas Optimization

- Optimized storage packing
- Efficient event emissions
- Minimal SLOAD operations
- Compiler optimization enabled (200 runs)
