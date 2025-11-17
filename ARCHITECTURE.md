# Task-Chainz Architecture

## System Overview

Task-Chainz is a decentralized task marketplace built on Polygon blockchain with AI-powered features and decentralized storage.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React + TypeScript (Vite)                               │  │
│  │  - Wallet Connection (MetaMask)                          │  │
│  │  - Task Creation/Browsing UI                             │  │
│  │  - Profile & Reputation Display                          │  │
│  │  - ethers.js v6 for blockchain interaction              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express API Server                            │  │
│  │  ┌────────────────┐  ┌─────────────────┐                │  │
│  │  │  AI Service    │  │  IPFS Service   │                │  │
│  │  │  (Claude API)  │  │  (Decentralized │                │  │
│  │  │  - Categorize  │  │   Storage)      │                │  │
│  │  │  - Recommend   │  │  - Upload       │                │  │
│  │  │  - Fraud Check │  │  - Retrieve     │                │  │
│  │  │  - Quality     │  │  - Pin          │                │  │
│  │  └────────────────┘  └─────────────────┘                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER                            │
│                    (Polygon Network)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Smart Contracts (Solidity 0.8.20)                       │  │
│  │  ┌────────────────┐  ┌──────────────────┐               │  │
│  │  │ TaskChainzToken│  │  ReputationNFT   │               │  │
│  │  │    (ERC-20)    │  │    (ERC-721)     │               │  │
│  │  └────────────────┘  └──────────────────┘               │  │
│  │  ┌────────────────┐  ┌──────────────────┐               │  │
│  │  │  TaskBounty    │  │     TaskDAO      │               │  │
│  │  │  (Marketplace) │  │   (Governance)   │               │  │
│  │  └────────────────┘  └──────────────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                       INDEXING LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  The Graph Subgraph                                       │  │
│  │  - Indexes blockchain events                             │  │
│  │  - GraphQL API for queries                               │  │
│  │  - Real-time task updates                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IPFS (InterPlanetary File System)                       │  │
│  │  - Task descriptions and metadata                        │  │
│  │  - User profiles and avatars                             │  │
│  │  - Task deliverables                                     │  │
│  │  - Reputation NFT metadata                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

### Task Creation Flow
```
User → Frontend → Smart Contract (TaskBounty)
                     ↓
                  Escrow TASKZ Tokens
                     ↓
               Emit TaskCreated Event
                     ↓
              The Graph Indexes Event
                     ↓
            Frontend Updates Task List
```

### Task Completion Flow
```
Worker → Submit Task → Smart Contract
                          ↓
                   Creator Approves
                          ↓
                Release Escrow Funds
                          ↓
              Update Reputation NFT
                          ↓
           Transfer TASKZ to Worker
                          ↓
              Emit TaskCompleted Event
```

### AI Task Matching Flow
```
User Request → Backend AI Service → Claude API
                       ↓
              Analyze Task/User Data
                       ↓
           Generate Recommendations
                       ↓
              Return to Frontend
```

### Dispute Resolution Flow
```
Dispute Created → TaskBounty Contract
                       ↓
              TaskDAO Proposal Created
                       ↓
           Community Token Voting
                       ↓
              DAO Resolves Dispute
                       ↓
            Funds Released to Winner
```

## Smart Contract Architecture

### TaskChainzToken (ERC-20)
```
Properties:
- name: "TaskChainz Token"
- symbol: "TASKZ"
- totalSupply: 1,000,000,000 (1 billion)

Functions:
- mint(address, amount): Owner only
- burn(amount): Any holder
- transfer/approve: Standard ERC-20
```

### ReputationNFT (ERC-721)
```
Properties:
- One NFT per user address
- Tracks: tasksCompleted, totalEarned, rating, level

Functions:
- mintReputation(address, tokenURI): TaskBounty only
- updateReputation(address, tasks, earned, rating): TaskBounty only
- calculateLevel(tasksCompleted): View function
- getUserReputation(address): View function
```

### TaskBounty (Main Contract)
```
State Variables:
- taskToken: TASKZ token address
- reputationNFT: NFT contract address
- daoGovernance: DAO contract address
- platformFee: 2.5% (250 basis points)

Task States:
Open → Assigned → Submitted → Completed
                            ↘ Disputed → Resolved
                            ↘ Cancelled

Functions:
- createTask(): Lock tokens in escrow
- assignTask(): Assign to worker
- submitTask(): Worker submits completion
- approveTask(): Release funds + update reputation
- cancelTask(): Return funds to creator
- createDispute(): Initiate dispute
- resolveDispute(): DAO resolves (by governance)
```

### TaskDAO (Governance)
```
Proposal Types:
- DisputeResolution
- ParameterChange
- General

Voting Process:
1. Create proposal (requires threshold)
2. Voting period (configurable)
3. Count votes (token-weighted)
4. Execute if passed (quorum met)

Parameters:
- votingPeriod: ~1 week
- proposalThreshold: 1000 TASKZ
- quorumVotes: 10000 TASKZ
```

## Data Flow

### On-Chain Data
- Task metadata references (IPFS hashes)
- Token balances and transfers
- Reputation scores and levels
- Dispute status and resolution
- DAO proposals and votes

### Off-Chain Data (IPFS)
- Full task descriptions
- Task deliverables
- User profile information
- Reputation NFT metadata
- Supporting documents

### Indexed Data (The Graph)
- Task listings with full history
- User statistics and rankings
- Dispute records
- Token transfer history
- Contract events timeline

## Security Model

### Smart Contract Security
- OpenZeppelin audited contracts
- ReentrancyGuard on fund transfers
- Ownable for admin functions
- Access control for critical operations
- Escrow pattern for payments

### AI Security
- Fraud detection on submissions
- Content moderation
- Spam prevention
- Quality scoring

### Data Security
- IPFS for immutable storage
- Private data encrypted client-side
- No personal data on-chain
- Wallet signatures for authentication

## Scalability Considerations

### Layer 2 Solution
- Polygon for low-cost transactions
- Fast block times (~2 seconds)
- EVM compatibility

### Caching Strategy
- The Graph for indexed queries
- Frontend caching of task data
- IPFS pinning for availability

### Load Distribution
- Backend API for heavy operations
- Smart contracts for critical state
- IPFS for large data storage
- The Graph for complex queries

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + TypeScript | User interface |
| Wallet | ethers.js + MetaMask | Blockchain interaction |
| Backend | Node.js + Express | API server |
| AI | Claude API | Task matching & fraud detection |
| Blockchain | Polygon | Smart contract platform |
| Contracts | Solidity + Hardhat | Business logic |
| Standards | ERC-20, ERC-721 | Tokens & NFTs |
| Indexing | The Graph | Blockchain querying |
| Storage | IPFS | Decentralized storage |
| Governance | Custom DAO | Dispute resolution |

## Deployment Architecture

### Development
- Local Hardhat node
- Local IPFS node
- Localhost backend
- Vite dev server

### Staging
- Mumbai testnet
- Infura IPFS
- Staging backend (Railway/Heroku)
- Preview deployment (Vercel/Netlify)

### Production
- Polygon mainnet
- Pinata/Infura IPFS
- Production backend (AWS/GCP)
- CDN deployment (Vercel/Cloudflare)
- The Graph hosted service

## Monitoring & Analytics

### Smart Contracts
- PolygonScan transaction monitoring
- Gas usage tracking
- Event log analysis

### Backend
- API request logging
- Error tracking (Sentry)
- Performance monitoring (New Relic)

### Frontend
- User analytics (Google Analytics)
- Error tracking (Sentry)
- Performance monitoring (Web Vitals)

### Blockchain
- The Graph indexing status
- Token supply and distribution
- Active users and tasks
- Revenue analytics

## Future Enhancements

1. **Multi-chain Support**: Expand to Ethereum, BSC, Arbitrum
2. **Advanced Matching**: ML-based task-worker matching
3. **Reputation System**: More granular reputation metrics
4. **Social Features**: Comments, ratings, forums
5. **Mobile Apps**: Native iOS/Android apps
6. **Batch Operations**: Create/complete multiple tasks
7. **Escrow Milestones**: Split payments for large tasks
8. **Insurance Pool**: Protect against disputes
9. **Staking**: Stake TASKZ for governance power
10. **Cross-chain Bridge**: Move tokens between chains
