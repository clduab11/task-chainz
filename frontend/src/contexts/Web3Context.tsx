import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface Web3ContextType {
  account: string | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  
  // Store handler references for targeted cleanup (prevents removing other components' listeners)
  const accountsChangedHandler = useRef<((accounts: string[]) => void) | null>(null);
  const chainChangedHandler = useRef<(() => void) | null>(null);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setChainId(null);
  }, []);

  const connect = useCallback(async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use this dApp');
        return;
      }

      // Remove our specific handlers if they exist (preserves other listeners)
      if (accountsChangedHandler.current) {
        window.ethereum.removeListener?.('accountsChanged', accountsChangedHandler.current);
      }
      if (chainChangedHandler.current) {
        window.ethereum.removeListener?.('chainChanged', chainChangedHandler.current);
      }

      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const signerInstance = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(signerInstance);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      // Create new handlers and store references
      accountsChangedHandler.current = (newAccounts: string[]) => {
        if (newAccounts.length === 0) {
          disconnect();
        } else {
          setAccount(newAccounts[0]);
        }
      };

      chainChangedHandler.current = () => {
        window.location.reload();
      };

      // Attach listeners
      window.ethereum.on('accountsChanged', accountsChangedHandler.current);
      window.ethereum.on('chainChanged', chainChangedHandler.current);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }, [disconnect]);

  useEffect(() => {
    // Check if already connected
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          connect();
        }
      });
    }

    // Cleanup only our specific listeners on unmount
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        if (accountsChangedHandler.current) {
          window.ethereum.removeListener?.('accountsChanged', accountsChangedHandler.current);
        }
        if (chainChangedHandler.current) {
          window.ethereum.removeListener?.('chainChanged', chainChangedHandler.current);
        }
      }
    };
  }, [connect]);

  const value = {
    account,
    signer,
    provider,
    chainId,
    connect,
    disconnect,
    isConnected: !!account,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
