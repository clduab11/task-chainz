import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'TaskChainz',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo',
  }
);

export const config = createConfig({
  connectors,
  chains: [mainnet, sepolia, hardhat],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
});

// Contract addresses by chain
export const CONTRACT_ADDRESSES: Record<number, { taskToken: string; taskChainz: string }> = {
  [mainnet.id]: {
    taskToken: '',
    taskChainz: '',
  },
  [sepolia.id]: {
    taskToken: process.env.NEXT_PUBLIC_TASK_TOKEN_ADDRESS || '',
    taskChainz: process.env.NEXT_PUBLIC_TASK_CHAINZ_ADDRESS || '',
  },
  [hardhat.id]: {
    taskToken: '',
    taskChainz: '',
  },
};
