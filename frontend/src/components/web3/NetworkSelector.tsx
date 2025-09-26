import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { useRootstockWallet } from '../../web3/provider';
import { ROOTSTOCK_CONFIG } from '../../config/constants';

export function NetworkSelector() {
  const { network, switchNetwork, isConnected } = useRootstockWallet();
  const [isOpen, setIsOpen] = useState(false);

  const networks = [
    {
      id: 'testnet' as const,
      name: ROOTSTOCK_CONFIG.testnet.name,
      chainId: ROOTSTOCK_CONFIG.testnet.chainId,
      color: 'bg-warning-500',
      description: 'Test network for development',
    },
    {
      id: 'mainnet' as const,
      name: ROOTSTOCK_CONFIG.mainnet.name,
      chainId: ROOTSTOCK_CONFIG.mainnet.chainId,
      color: 'bg-success-500',
      description: 'Production network',
    },
  ];

  const handleNetworkSwitch = async (networkId: 'testnet' | 'mainnet') => {
    try {
      await switchNetwork(networkId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-secondary-100 dark:bg-secondary-800 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full ${
          network ? 'bg-success-500' : 'bg-error-500'
        }`} />
        <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
          {network ? network.name : 'Wrong Network'}
        </span>
        <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 z-50"
        >
          <div className="p-2">
            {networks.map((net) => (
              <button
                key={net.id}
                onClick={() => handleNetworkSwitch(net.id as 'testnet' | 'mainnet')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${net.color}`} />
                  <div className="text-left">
                    <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {net.name}
                    </div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400">
                      {net.description}
                    </div>
                  </div>
                </div>
                {network?.chainId === net.chainId && (
                  <Check className="w-4 h-4 text-success-600" />
                )}
              </button>
            ))}
          </div>
          
          {!network && (
            <div className="p-3 border-t border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center space-x-2 text-warning-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Please switch to Rootstock network</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
