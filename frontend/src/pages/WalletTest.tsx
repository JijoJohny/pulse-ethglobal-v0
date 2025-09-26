import React from 'react';
import { WalletTest } from '../components/web3/WalletTest';

export default function WalletTestPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
          Wallet Integration Test
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
          Test MetaMask wallet integration with Rootstock network. Connect your wallet, 
          switch networks, and view your balances.
        </p>
      </div>

      {/* Wallet Test Component */}
      <WalletTest />

      {/* Instructions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          How to Test
        </h3>
        <div className="space-y-3 text-sm text-secondary-600 dark:text-secondary-400">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 font-medium text-xs">1</span>
            <p>Make sure MetaMask is installed and unlocked</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 font-medium text-xs">2</span>
            <p>Click "Connect Wallet" to connect your MetaMask wallet</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 font-medium text-xs">3</span>
            <p>If you're not on Rootstock, the app will prompt you to switch networks</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 font-medium text-xs">4</span>
            <p>Use the network selector to switch between Rootstock Testnet and Mainnet</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 font-medium text-xs">5</span>
            <p>View your RBTC and USDC balances, and test the refresh functionality</p>
          </div>
        </div>
      </div>

      {/* Network Information */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Rootstock Network Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              Rootstock Testnet
            </h4>
            <div className="space-y-1 text-sm text-secondary-600 dark:text-secondary-400">
              <p><strong>Chain ID:</strong> 31</p>
              <p><strong>RPC URL:</strong> https://public-node.testnet.rsk.co</p>
              <p><strong>Explorer:</strong> https://explorer.testnet.rsk.co</p>
              <p><strong>Currency:</strong> RBTC (Rootstock Bitcoin)</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              Rootstock Mainnet
            </h4>
            <div className="space-y-1 text-sm text-secondary-600 dark:text-secondary-400">
              <p><strong>Chain ID:</strong> 30</p>
              <p><strong>RPC URL:</strong> https://public-node.rsk.co</p>
              <p><strong>Explorer:</strong> https://explorer.rsk.co</p>
              <p><strong>Currency:</strong> RBTC (Rootstock Bitcoin)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
