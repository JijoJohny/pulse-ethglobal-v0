import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MetamaskWalletContextType {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const MetamaskWalletContext = createContext<MetamaskWalletContextType | null>(null);

interface MetamaskWalletProviderProps {
  children: ReactNode;
}

export function MetamaskWalletProvider({ children }: MetamaskWalletProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0');

  const isConnected = !!account;

  const connect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await getBalance(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setBalance('0');
  };

  const getBalance = async (address: string) => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      
      // Convert from Wei to ETH
      const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
      setBalance(ethBalance.toFixed(4));
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            await getBalance(accounts[0]);
          }
        } catch (error) {
          console.error('Failed to check connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          getBalance(accounts[0]);
        } else {
          disconnect();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const value = {
    account,
    isConnected,
    isConnecting,
    balance,
    connect,
    disconnect,
  };

  return (
    <MetamaskWalletContext.Provider value={value}>
      {children}
    </MetamaskWalletContext.Provider>
  );
}

export const useMetamaskWallet = () => {
  const context = useContext(MetamaskWalletContext);
  if (!context) {
    throw new Error('useMetamaskWallet must be used within MetamaskWalletProvider');
  }
  return context;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
