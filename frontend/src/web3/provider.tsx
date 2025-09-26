import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Rootstock Network Configuration
const ROOTSTOCK_NETWORKS = {
  testnet: {
    chainId: 31,
    name: 'Rootstock Testnet',
    rpcUrl: 'https://public-node.testnet.rsk.co',
    explorerUrl: 'https://explorer.testnet.rsk.co',
    currency: {
      name: 'RBTC',
      symbol: 'RBTC',
      decimals: 18,
    },
  },
  mainnet: {
    chainId: 30,
    name: 'Rootstock Mainnet',
    rpcUrl: 'https://public-node.rsk.co',
    explorerUrl: 'https://explorer.rsk.co',
    currency: {
      name: 'RBTC',
      symbol: 'RBTC',
      decimals: 18,
    },
  },
};

interface RootstockWalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  balance: string | null;
  network: typeof ROOTSTOCK_NETWORKS.testnet | null;
  
  // Wallet methods
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (networkId: keyof typeof ROOTSTOCK_NETWORKS) => Promise<void>;
  
  // Provider methods
  getProvider: () => ethers.Provider | null;
  getSigner: () => ethers.Signer | null;
  
  // Contract methods
  getContract: (address: string, abi: any[]) => ethers.Contract | null;
}

const RootstockWalletContext = createContext<RootstockWalletContextType | null>(null);

export function useRootstockWallet() {
  const context = useContext(RootstockWalletContext);
  if (!context) {
    throw new Error('useRootstockWallet must be used within a RootstockWalletProvider');
  }
  return context;
}

interface RootstockWalletProviderProps {
  children: React.ReactNode;
}

export function RootstockWalletProvider({ children }: RootstockWalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<typeof ROOTSTOCK_NETWORKS.testnet | null>(null);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Get current network
  const getCurrentNetwork = async () => {
    if (!provider) return null;
    
    try {
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      if (chainId === ROOTSTOCK_NETWORKS.testnet.chainId) {
        return ROOTSTOCK_NETWORKS.testnet;
      } else if (chainId === ROOTSTOCK_NETWORKS.mainnet.chainId) {
        return ROOTSTOCK_NETWORKS.mainnet;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting network:', error);
      return null;
    }
  };

  // Get account balance
  const getAccountBalance = async (address: string) => {
    if (!provider) return null;
    
    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  };

  // Connect wallet
  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    setIsConnecting(true);
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      setAccount(account);

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      setProvider(provider);
      setSigner(signer);

      // Get current network
      const currentNetwork = await getCurrentNetwork();
      setNetwork(currentNetwork);

      // Get balance
      const balance = await getAccountBalance(account);
      setBalance(balance);

      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setAccount(null);
    setBalance(null);
    setNetwork(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
  };

  // Switch network
  const switchNetwork = async (networkId: keyof typeof ROOTSTOCK_NETWORKS) => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    const targetNetwork = ROOTSTOCK_NETWORKS[networkId];
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${targetNetwork.chainId.toString(16)}`,
              chainName: targetNetwork.name,
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: [targetNetwork.explorerUrl],
              nativeCurrency: targetNetwork.currency,
            },
          ],
        });
      } else {
        throw error;
      }
    }

    // Update network state
    setNetwork(targetNetwork);
  };

  // Get provider
  const getProvider = () => provider;

  // Get signer
  const getSigner = () => signer;

  // Get contract instance
  const getContract = (address: string, abi: any[]) => {
    if (!signer) return null;
    return new ethers.Contract(address, abi, signer);
  };

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload the page to reset the app state
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Update balance periodically
  useEffect(() => {
    if (!account || !provider) return;

    const updateBalance = async () => {
      const balance = await getAccountBalance(account);
      setBalance(balance);
    };

    updateBalance();
    const interval = setInterval(updateBalance, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [account, provider]);

  const value: RootstockWalletContextType = {
    isConnected,
    isConnecting,
    account,
    balance,
    network,
    connect,
    disconnect,
    switchNetwork,
    getProvider,
    getSigner,
    getContract,
  };

  return (
    <RootstockWalletContext.Provider value={value}>
      {children}
    </RootstockWalletContext.Provider>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
