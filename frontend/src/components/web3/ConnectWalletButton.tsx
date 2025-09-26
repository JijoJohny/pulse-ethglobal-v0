import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Loader2, CheckCircle } from 'lucide-react';
import { useRootstockWallet } from '../../web3/provider';

export function ConnectWalletButton() {
  const { isConnected, isConnecting, connect, disconnect, account } = useRootstockWallet();

  const handleClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      try {
        await connect();
      } catch (error) {
        console.error('Error connecting wallet:', error);
        // You might want to show a toast notification here
      }
    }
  };

  if (isConnected && account) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className="flex items-center space-x-2 px-4 py-2 bg-success-100 hover:bg-success-200 dark:bg-success-900/20 dark:hover:bg-success-900/40 text-success-700 dark:text-success-300 rounded-lg transition-colors"
      >
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={isConnecting}
      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </span>
    </motion.button>
  );
}
