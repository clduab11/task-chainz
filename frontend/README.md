# Task-Chainz Frontend

React + TypeScript frontend for the Task-Chainz decentralized task marketplace.

## Features

- **Wallet Integration**: MetaMask connection with ethers.js v6
- **Task Management**: Create, browse, and complete tasks
- **Reputation System**: View and track user reputation NFTs
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Mode**: Automatic theme switching

## Tech Stack

- React 18
- TypeScript
- Vite
- ethers.js v6
- React Router
- CSS3 with custom properties

## Development

### Install Dependencies
```bash
npm install
```

### Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

Required environment variables:
- `VITE_API_URL` - Backend API URL
- `VITE_TASK_TOKEN_ADDRESS` - TaskChainz Token contract address
- `VITE_REPUTATION_NFT_ADDRESS` - ReputationNFT contract address
- `VITE_TASK_BOUNTY_ADDRESS` - TaskBounty contract address
- `VITE_TASK_DAO_ADDRESS` - TaskDAO contract address
- `VITE_NETWORK_CHAIN_ID` - Network chain ID (137 for Polygon, 80001 for Mumbai)

### Start Development Server
```bash
npm run dev
```

App runs on http://localhost:3000

### Build for Production
```bash
npm run build
```

Output in `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable components
│   ├── Header.tsx
│   └── Header.css
├── pages/         # Page components
│   ├── Home.tsx
│   ├── CreateTask.tsx
│   ├── BrowseTasks.tsx
│   ├── TaskDetail.tsx
│   └── Profile.tsx
├── contexts/      # React contexts
│   └── Web3Context.tsx
├── services/      # API clients (future)
├── hooks/         # Custom hooks (future)
├── types/         # TypeScript types (future)
└── utils/         # Utility functions (future)
```

## Components

### Web3Context
Manages wallet connection and Web3 state:
```typescript
const { account, connect, disconnect, isConnected } = useWeb3();
```

### Header
Navigation bar with wallet connection button.

### Pages
- **Home**: Landing page with features
- **CreateTask**: Form to create new tasks
- **BrowseTasks**: Browse and filter available tasks
- **TaskDetail**: View task details and apply
- **Profile**: User dashboard with stats and reputation

## Wallet Integration

### MetaMask Setup
1. Install MetaMask browser extension
2. Create or import wallet
3. Add network (Polygon/Mumbai)
4. Connect to dApp

### Network Configuration

**Polygon Mainnet:**
```
Network Name: Polygon
RPC URL: https://polygon-rpc.com/
Chain ID: 137
Currency: MATIC
Block Explorer: https://polygonscan.com/
```

**Mumbai Testnet:**
```
Network Name: Mumbai Testnet
RPC URL: https://rpc-mumbai.maticvigil.com/
Chain ID: 80001
Currency: MATIC
Block Explorer: https://mumbai.polygonscan.com/
```

## Smart Contract Interaction

Contracts are integrated via ethers.js:

```typescript
import { Contract } from 'ethers';
import TaskBountyABI from './abis/TaskBounty.json';

const contract = new Contract(
  process.env.VITE_TASK_BOUNTY_ADDRESS,
  TaskBountyABI,
  signer
);

// Create task
await contract.createTask(title, descriptionHash, bounty, deadline);
```

## Styling

- CSS Modules for component-specific styles
- Global styles in `index.css`
- CSS custom properties for theming
- Responsive design with flexbox and grid

## Deployment

### Vercel
```bash
npm run build
vercel deploy
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

### Fleek (IPFS)
```bash
npm run build
fleek deploy
```

## Environment-specific Configuration

### Development
- Local Hardhat network (Chain ID: 31337)
- Backend at localhost:3001

### Staging
- Mumbai testnet (Chain ID: 80001)
- Staging backend URL

### Production
- Polygon mainnet (Chain ID: 137)
- Production backend URL

## Performance Optimization

- Code splitting with React.lazy()
- Image optimization
- Vite's built-in optimizations
- Tree shaking
- Minification

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires MetaMask or compatible Web3 wallet.

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Screen reader friendly

## Future Enhancements

- [ ] WalletConnect support
- [ ] ENS name resolution
- [ ] Transaction history
- [ ] Task notifications
- [ ] Advanced filtering and search
- [ ] Social features (comments, ratings)
- [ ] Multiple language support
