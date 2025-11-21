import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  account: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: (chainId: number) => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider')
  }
  return context
}

interface Web3ProviderProps {
  children: ReactNode
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const isConnected = !!account

  const connect = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    try {
      setIsConnecting(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()

      setProvider(provider)
      setSigner(signer)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))

      // Store connection preference
      localStorage.setItem('walletConnected', 'true')

      toast.success('Wallet connected!')
    } catch (error: any) {
      console.error('Connection error:', error)
      toast.error(error.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setProvider(null)
    setSigner(null)
    setAccount(null)
    setChainId(null)
    localStorage.removeItem('walletConnected')
    toast.success('Wallet disconnected')
  }

  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!')
      return
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (error: any) {
      // Chain not added to MetaMask
      if (error.code === 4902) {
        try {
          // Add Polygon Mumbai testnet
          if (targetChainId === 80001) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x13881',
                  chainName: 'Polygon Mumbai',
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
                  blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
                },
              ],
            })
          }
          // Add Polygon mainnet
          else if (targetChainId === 137) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x89',
                  chainName: 'Polygon Mainnet',
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18,
                  },
                  rpcUrls: ['https://polygon-rpc.com'],
                  blockExplorerUrls: ['https://polygonscan.com/'],
                },
              ],
            })
          }
        } catch (addError) {
          console.error('Error adding network:', addError)
          toast.error('Failed to add network')
        }
      } else {
        console.error('Error switching network:', error)
        toast.error('Failed to switch network')
      }
    }
  }

  // Auto-connect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected')
    if (wasConnected === 'true' && window.ethereum) {
      connect()
    }
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAccount(accounts[0])
        toast.success('Account changed')
      }
    }

    const handleChainChanged = async (chainId: string) => {
      const newChainId = parseInt(chainId, 16)
      setChainId(newChainId)
      
      // Gracefully handle network change without full page reload
      try {
        // Reset provider and signer to use new network
        const newProvider = new ethers.BrowserProvider(window.ethereum)
        setProvider(newProvider)
        
        if (account) {
          const newSigner = await newProvider.getSigner()
          setSigner(newSigner)
        }
        
        toast.success(`Network changed to chain ID: ${newChainId}`)
      } catch (error) {
        console.error('Error handling network change:', error)
        toast.error('Network change failed. Please refresh the page.')
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const value: Web3ContextType = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    switchNetwork,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
