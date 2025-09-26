import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { ROOTSTOCK_CONFIG, DEFAULT_NETWORK } from '../config/constants';

interface RootstockWalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  balance: string | null;
  network: typeof ROOTSTOCK_CONFIG.testnet | null;
  
  // Wallet methods
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (networkId: keyof typeof ROOTSTOCK_CONFIG) => Promise<void>;
  
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
  const [network, setNetwork] = useState<typeof ROOTSTOCK_CONFIG.testnet | null>(null);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Safe ethereum access
  const getEthereum = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  };

  // Get current network
  const getCurrentNetwork = async () => {
    if (!provider) return null;
    
    try {
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      if (chainId === ROOTSTOCK_CONFIG.testnet.chainId) {
        return ROOTSTOCK_CONFIG.testnet;
      } else if (chainId === ROOTSTOCK_CONFIG.mainnet.chainId) {
        return ROOTSTOCK_CONFIG.mainnet;
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
      const error = 'MetaMask is not installed. Please install MetaMask to continue.';
      toast.error(error);
      throw new Error(error);
    }

    setIsConnecting(true);
    
    try {
      // Request account access
      const ethereum = getEthereum();
      if (!ethereum) {
        throw new Error('MetaMask is not available');
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        const error = 'No accounts found. Please unlock your MetaMask wallet.';
        toast.error(error);
        throw new Error(error);
      }

      const account = accounts[0];
      setAccount(account);

      // Create provider and signer
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      setProvider(provider);
      setSigner(signer);

      // Get current network
      const currentNetwork = await getCurrentNetwork();
      setNetwork(currentNetwork);

      // Check if we're on the correct network
      if (!currentNetwork) {
        toast.warning('Please switch to Rootstock network');
        await switchNetwork(DEFAULT_NETWORK);
        return;
      }

      // Get balance
      const balance = await getAccountBalance(account);
      setBalance(balance);

      setIsConnected(true);
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      const errorMessage = error.message || 'Failed to connect wallet';
      toast.error(errorMessage);
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
  const switchNetwork = async (networkId: keyof typeof ROOTSTOCK_CONFIG) => {
    if (!isMetaMaskInstalled()) {
      const error = 'MetaMask is not installed';
      toast.error(error);
      throw new Error(error);
    }

    const targetNetwork = ROOTSTOCK_CONFIG[networkId];
    
    try {
      const ethereum = getEthereum();
      if (!ethereum) {
        throw new Error('MetaMask is not available');
      }

      // Try to switch to the network
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
      });
      
      // Update network state
      setNetwork(targetNetwork);
      toast.success(`Switched to ${targetNetwork.name}`);
    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await ethereum.request({
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
          
          // Update network state after adding
          setNetwork(targetNetwork);
          toast.success(`Added and switched to ${targetNetwork.name}`);
        } catch (addError: any) {
          const errorMessage = `Failed to add ${targetNetwork.name}: ${addError.message}`;
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        const errorMessage = `Failed to switch network: ${error.message}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
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
        toast.info('Wallet disconnected');
      } else {
        const newAccount = accounts[0];
        if (newAccount !== account) {
          setAccount(newAccount);
          toast.info('Account changed');
        }
      }
    };

    const handleChainChanged = async (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      const newNetwork = Object.values(ROOTSTOCK_CONFIG).find(
        network => network.chainId === newChainId
      );
      
      if (newNetwork) {
        setNetwork(newNetwork);
        toast.info(`Switched to ${newNetwork.name}`);
      } else {
        setNetwork(null);
        toast.warning('Please switch to Rootstock network');
      }
    };

    const handleConnect = (connectInfo: any) => {
      console.log('MetaMask connected:', connectInfo);
      toast.success('MetaMask connected');
    };

    const handleDisconnect = () => {
      console.log('MetaMask disconnected');
      disconnect();
      toast.info('MetaMask disconnected');
    };

    const ethereum = getEthereum();
    if (!ethereum) return;

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);
    ethereum.on('connect', handleConnect);
    ethereum.on('disconnect', handleDisconnect);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
      ethereum.removeListener('connect', handleConnect);
      ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [account]);

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
