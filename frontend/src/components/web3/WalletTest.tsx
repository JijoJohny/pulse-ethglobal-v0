import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Network, 
  DollarSign, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useRootstockWallet } from '../../web3/provider';
import { useContract } from '../../web3/hooks/useContract';
import { CONTRACT_ADDRESSES } from '../../config/constants';

export function WalletTest() {
  const { 
    isConnected, 
    isConnecting, 
    account, 
    balance, 
    network, 
    connect, 
    disconnect 
  } = useRootstockWallet();
  
  const { getTokenBalance, getNetworkInfo } = useContract();
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get token balance
  const fetchTokenBalance = async () => {
    if (!isConnected || !account) return;
    
    try {
      const balance = await getTokenBalance(CONTRACT_ADDRESSES.USDC, account);
      setTokenBalance(balance);
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  // Get network info
  const fetchNetworkInfo = async () => {
    try {
      const info = await getNetworkInfo();
      setNetworkInfo(info);
    } catch (error) {
      console.error('Error fetching network info:', error);
    }
  };

  // Refresh all data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchTokenBalance(),
        fetchNetworkInfo(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (account) {
      await navigator.clipboard.writeText(account);
      // You could add a toast notification here
    }
  };

  // Open in explorer
  const openInExplorer = () => {
    if (account && network) {
      window.open(`${network.explorerUrl}/address/${account}`, '_blank');
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchTokenBalance();
      fetchNetworkInfo();
    }
  }, [isConnected, account]);

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 text-center"
      >
        <Wallet className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400 mb-6">
          Connect your MetaMask wallet to interact with Rootstock
        </p>
        <button
          onClick={connect}
          disabled={isConnecting}
          className="btn btn-primary"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Wallet Status */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Wallet Status
          </h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {network ? (
                <CheckCircle className="w-5 h-5 text-success-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-warning-600" />
              )}
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Connection Status
              </span>
            </div>
            <span className={`text-sm font-medium ${
              network ? 'text-success-600' : 'text-warning-600'
            }`}>
              {network ? 'Connected' : 'Wrong Network'}
            </span>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-secondary-600" />
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Network
              </span>
            </div>
            <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {network ? network.name : 'Unknown'}
            </span>
          </div>

          {/* Account */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-secondary-600" />
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Account
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </span>
              <button
                onClick={copyAddress}
                className="p-1 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={openInExplorer}
                className="p-1 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-secondary-600" />
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                RBTC Balance
              </span>
            </div>
            <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {balance ? `${parseFloat(balance).toFixed(4)} RBTC` : 'Loading...'}
            </span>
          </div>

          {/* Token Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-secondary-600" />
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                USDC Balance
              </span>
            </div>
            <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              {tokenBalance ? `${parseFloat(tokenBalance).toFixed(4)} USDC` : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 btn btn-outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={disconnect}
              className="flex-1 btn btn-secondary"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Network Info */}
      {networkInfo && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Network Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Chain ID</span>
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {networkInfo.chainId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Network Name</span>
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {networkInfo.name}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
