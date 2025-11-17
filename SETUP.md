# Task-Chainz Setup Guide

## Quick Start

This guide will help you set up and run Task-Chainz locally.

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Git** - [Download](https://git-scm.com/)
3. **MetaMask** - [Install Browser Extension](https://metamask.io/)

## Step-by-Step Setup

### 1. Clone Repository

```bash
git clone https://github.com/clduab11/task-chainz.git
cd task-chainz
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 3. Setup Smart Contracts

```bash
cd contracts

# Copy environment template
cp .env.example .env

# Compile contracts
npm run compile

# Run tests
npm test
```

### 4. Deploy Contracts Locally

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npm run deploy

# Note: Save the deployed contract addresses shown in the output
```

### 5. Configure Backend

```bash
cd ../backend

# Copy environment template
cp .env.example .env

# Edit .env and add:
# - ANTHROPIC_API_KEY (get from https://console.anthropic.com/)
# - IPFS configuration (optional, defaults work for testing)

# Start backend server
npm run dev
```

The backend will run on http://localhost:3001

### 6. Configure Frontend

```bash
cd ../frontend

# Copy environment template
cp .env.example .env

# Edit .env and add:
# - Contract addresses from step 4
# - VITE_NETWORK_CHAIN_ID=31337 (for local Hardhat)

# Start frontend
npm run dev
```

The frontend will run on http://localhost:3000

### 7. Configure MetaMask

1. Open MetaMask
2. Click network dropdown → Add Network → Add Network Manually
3. Enter Hardhat Network details:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
4. Import one of the test accounts from Hardhat node output
5. Connect to the dApp at http://localhost:3000

### 8. Get Test Tokens

```bash
cd contracts
npx hardhat console --network localhost

# In console:
const token = await ethers.getContractAt("TaskChainzToken", "YOUR_TOKEN_ADDRESS")
await token.transfer("YOUR_WALLET_ADDRESS", ethers.parseEther("1000"))
```

## Deploying to Polygon Mumbai Testnet

### 1. Get Test MATIC

Visit [Mumbai Faucet](https://faucet.polygon.technology/) to get test MATIC.

### 2. Configure Environment

```bash
cd contracts

# Edit .env:
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com/
PRIVATE_KEY=your_private_key_here  # NEVER commit this!
```

### 3. Deploy to Mumbai

```bash
npm run deploy -- --network mumbai

# Verify contracts (optional)
npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS
```

### 4. Update Frontend Config

Update `frontend/.env` with Mumbai contract addresses and chain ID 80001.

### 5. Configure The Graph

```bash
cd ../subgraph

# Edit subgraph.yaml:
# - Update network to "mumbai"
# - Update contract addresses
# - Update startBlock

# Deploy subgraph
graph auth --product hosted-service YOUR_ACCESS_TOKEN
npm run deploy
```

## Production Deployment

### Smart Contracts

1. Audit contracts thoroughly
2. Deploy to Polygon mainnet
3. Verify on Polygonscan
4. Set up multi-sig for owner functions

### Backend

1. Deploy to cloud provider (AWS, Railway, etc.)
2. Set up environment variables
3. Configure HTTPS
4. Set up monitoring and logging
5. Enable rate limiting

### Frontend

1. Build production bundle: `npm run build`
2. Deploy to hosting (Vercel, Netlify, Fleek)
3. Configure domain and SSL
4. Update contract addresses in env

### The Graph

1. Deploy to The Graph Network
2. Update frontend with subgraph URL
3. Monitor indexing status

## Troubleshooting

### "Insufficient funds" error
- Make sure your wallet has enough ETH/MATIC for gas
- For local testing, import a Hardhat test account

### Contract interaction fails
- Verify you're connected to the correct network
- Check contract addresses in frontend .env
- Ensure contracts are deployed

### Backend AI features not working
- Verify ANTHROPIC_API_KEY is set correctly
- Check API quota and rate limits
- Review backend logs for errors

### IPFS upload fails
- Verify IPFS configuration
- Try using Infura IPFS instead
- Check network connectivity

## Environment Variables Reference

### Contracts (.env)
```
POLYGON_RPC_URL=
MUMBAI_RPC_URL=
PRIVATE_KEY=
POLYGONSCAN_API_KEY=
REPORT_GAS=false
```

### Backend (.env)
```
PORT=3001
NODE_ENV=development
ANTHROPIC_API_KEY=
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_TASK_TOKEN_ADDRESS=
VITE_REPUTATION_NFT_ADDRESS=
VITE_TASK_BOUNTY_ADDRESS=
VITE_TASK_DAO_ADDRESS=
VITE_NETWORK_CHAIN_ID=31337
```

## Next Steps

1. ✅ Complete setup
2. ✅ Deploy contracts
3. ✅ Start services
4. 🎮 Create your first task
5. 🎮 Apply for tasks
6. 🎮 Build your reputation
7. 🚀 Go to production!

## Support

For issues and questions:
- Check existing GitHub issues
- Open a new issue with details
- Include error messages and logs

Happy building! 🎉
