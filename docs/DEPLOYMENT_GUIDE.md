# Task Chainz Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Testnet Deployment](#testnet-deployment)
5. [Mainnet Deployment](#mainnet-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- Node.js v18+ and npm
- Git
- MetaMask or hardware wallet
- (Optional) Docker for local blockchain

### Required Accounts

- Polygon RPC provider account (Infura, Alchemy, or QuickNode)
- PolygonScan API key (for contract verification)
- IPFS provider account (Infura, Pinata, or your own node)
- Anthropic API key (for AI features)
- The Graph account (for subgraph deployment)

### Required Funds

**Testnet (Mumbai):**
- MATIC tokens from faucet (free)
- https://faucet.polygon.technology/

**Mainnet (Polygon):**
- ~10 MATIC for deployment gas fees
- Additional MATIC for initial contract funding

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/task-chainz.git
cd task-chainz
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 3. Configure Environment Variables

#### Contracts (.env)

```bash
cd contracts
cp .env.example .env
```

Edit `contracts/.env`:

```env
# Network RPC URLs
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Deployer private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# API Keys
POLYGONSCAN_API_KEY=your_polygonscan_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Gas reporting
REPORT_GAS=true
```

#### Backend (.env)

```bash
cd ../backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taskchainz

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Contract Addresses (fill after deployment)
TASK_TOKEN_ADDRESS=
REPUTATION_NFT_ADDRESS=
TASK_MANAGER_ADDRESS=
GAMIFICATION_ADDRESS=
DAO_ADDRESS=

# IPFS
IPFS_PROJECT_ID=your_infura_ipfs_project_id
IPFS_PROJECT_SECRET=your_infura_ipfs_secret

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# JWT
JWT_SECRET=generate_a_secure_random_string
```

## Local Development

### 1. Start Local Blockchain

```bash
cd contracts
npx hardhat node
```

This starts a local Ethereum node at `http://127.0.0.1:8545`

### 2. Deploy Contracts Locally

In a new terminal:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

Save the contract addresses from the output.

### 3. Import Account to MetaMask

1. Copy a private key from the Hardhat node output
2. In MetaMask: Import Account → Private Key
3. Add custom network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

Server runs at `http://localhost:4000`

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:3000`

### 6. Test the Application

1. Connect MetaMask to localhost network
2. Visit http://localhost:3000
3. Connect wallet
4. Create and complete a test task

## Testnet Deployment

### 1. Get Testnet Tokens

Visit https://faucet.polygon.technology/ and request Mumbai MATIC

### 2. Compile Contracts

```bash
cd contracts
npm run build
```

### 3. Run Tests

```bash
npm test
```

Ensure all tests pass before deploying!

### 4. Deploy to Mumbai

```bash
npm run deploy:testnet
```

The script will output contract addresses. **Save these addresses!**

Example output:
```
TaskChainzToken:      0x1234...
ReputationNFT:        0x5678...
TaskManager:          0x9abc...
Gamification:         0xdef0...
TimelockController:   0x1357...
TaskChainzDAO:        0x2468...
```

### 5. Verify Contracts

```bash
npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS]
```

Example:
```bash
npx hardhat verify --network polygonMumbai 0x1234...
npx hardhat verify --network polygonMumbai 0x5678...
npx hardhat verify --network polygonMumbai 0x9abc... 0x1234... 0x5678... 0xYourAddress
```

### 6. Update Backend Configuration

Edit `backend/.env` with deployed contract addresses.

### 7. Deploy Subgraph

```bash
cd subgraph

# Update subgraph.yaml with contract addresses
# Edit the 'address' fields under dataSources

# Authenticate with The Graph
graph auth --studio <YOUR_DEPLOY_KEY>

# Deploy
npm run deploy
```

### 8. Deploy Backend

**Option A: Traditional Hosting (VPS, EC2, etc.)**

```bash
cd backend
npm run build
npm start
```

**Option B: Docker**

```bash
docker build -t task-chainz-backend .
docker run -p 4000:4000 --env-file .env task-chainz-backend
```

### 9. Deploy Frontend

**Option A: Vercel**

```bash
cd frontend
vercel deploy
```

**Option B: Netlify**

```bash
cd frontend
npm run build
netlify deploy --prod
```

**Option C: IPFS (for full decentralization)**

```bash
cd frontend
npm run build
# Upload dist/ folder to IPFS
```

### 10. Test Testnet Deployment

1. Visit your deployed frontend URL
2. Connect MetaMask to Mumbai network
3. Test all features:
   - Create a task
   - Apply for a task
   - Complete a task
   - Check reputation updates
   - Test DAO features

## Mainnet Deployment

⚠️ **WARNING**: Only deploy to mainnet after:
- Complete security audit
- Extensive testnet testing
- Code freeze and final review
- Emergency response plan in place

### Pre-Deployment Checklist

- [ ] Security audit completed
- [ ] All tests passing (100% coverage recommended)
- [ ] Testnet deployment tested for 1+ week
- [ ] Bug bounty program ready
- [ ] Emergency pause procedures documented
- [ ] Insurance considered (if applicable)
- [ ] Legal review completed
- [ ] Team ready for launch monitoring

### 1. Final Security Review

Review `docs/SECURITY_AUDIT.md` and ensure all items are checked.

### 2. Prepare Deployment Account

**Strongly recommended**: Use a hardware wallet (Ledger, Trezor) for mainnet deployment.

Fund the deployment account with ~10 MATIC.

### 3. Update Configuration

Edit `contracts/.env`:
```env
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_mainnet_deployer_key
```

### 4. Deploy to Mainnet

```bash
cd contracts
npm run deploy:mainnet
```

**Monitor the deployment carefully!** Save all transaction hashes and contract addresses.

### 5. Verify All Contracts

```bash
# Verify each contract
npx hardhat verify --network polygon <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS]
```

### 6. Transfer Ownership

If using a multi-sig wallet (recommended):

```bash
# Transfer DEFAULT_ADMIN_ROLE to multi-sig
npx hardhat run scripts/transfer-ownership.ts --network polygon
```

### 7. Fund Contracts

```bash
# Transfer initial TASKZ tokens to Gamification contract
# Set up initial liquidity (if applicable)
```

### 8. Deploy Infrastructure

Deploy backend and frontend following the same steps as testnet, but using mainnet configuration.

### 9. Deploy Mainnet Subgraph

```bash
cd subgraph
# Update subgraph.yaml with mainnet addresses
npm run deploy
```

## Post-Deployment

### 1. Initial Monitoring

Monitor for the first 24-48 hours:
- Transaction activity
- Contract balances
- Error logs
- User feedback

### 2. Set Up Monitoring

- Configure transaction monitoring (Tenderly, Defender)
- Set up alerts for unusual activity
- Monitor API performance
- Set up uptime monitoring

### 3. Announce Launch

- Blog post
- Social media
- Discord/Telegram announcement
- Email newsletter

### 4. Community Support

- Be available for questions
- Monitor support channels
- Address issues promptly
- Gather feedback

## Troubleshooting

### Contract Deployment Fails

**Issue**: Transaction fails or reverts

**Solutions**:
- Check account has sufficient MATIC for gas
- Verify RPC endpoint is working
- Check if contract size exceeds limit (optimize if needed)
- Try increasing gas limit

### Contract Verification Fails

**Issue**: PolygonScan verification error

**Solutions**:
- Ensure constructor arguments are correct
- Check compiler version matches
- Verify optimization settings match
- Try manual verification on PolygonScan

### Frontend Can't Connect to Contracts

**Issue**: Transactions fail or contracts not found

**Solutions**:
- Verify contract addresses in frontend config
- Check MetaMask is on correct network
- Ensure contracts are deployed and verified
- Check RPC endpoint is working

### Subgraph Not Indexing

**Issue**: Subgraph not updating with new events

**Solutions**:
- Verify contract addresses in subgraph.yaml
- Check startBlock is correct
- Ensure events are being emitted
- Check The Graph Studio for errors

### Backend API Errors

**Issue**: API returns 500 errors

**Solutions**:
- Check environment variables are set
- Verify database connection
- Check RPC endpoint is working
- Review application logs
- Ensure Redis is running (if used)

## Support

If you encounter issues not covered here:

1. Check GitHub Issues
2. Join Discord support channel
3. Email: support@taskchainz.io

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Polygon Documentation](https://docs.polygon.technology/)
- [The Graph Documentation](https://thegraph.com/docs/)
- [OpenZeppelin Documentation](https://docs.openzeppelin.com/)

---

**Last Updated**: 2024
**Version**: 1.0.0
