import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useRootstockWallet } from '../../../../web3/provider';

interface PredictionInputProps {
  selectedBins: number[];
  onAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
  isPlacing: boolean;
  cost: string;
  potentialWinnings: string;
}

export function PredictionInput({
  selectedBins,
  onAmountChange,
  onPlaceBet,
  isPlacing,
  cost,
  potentialWinnings
}: PredictionInputProps) {
  const { isConnected, balance, account } = useRootstockWallet();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // Validate amount input
  useEffect(() => {
    if (!amount) {
      setError('');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (balance && numAmount > parseFloat(balance)) {
      setError('Insufficient balance');
      return;
    }

    if (numAmount < 0.001) {
      setError('Minimum bet is 0.001 RBTC');
      return;
    }

    setError('');
  }, [amount, balance]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    onAmountChange(value);
  };

  const handlePlaceBet = () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (selectedBins.length === 0) {
      setError('Please select at least one prediction bin');
      return;
    }

    if (error) {
      return;
    }

    onPlaceBet();
  };

  const formatBalance = (balance: string | null) => {
    if (!balance) return '0.000';
    return parseFloat(balance).toFixed(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Place Your Prediction
        </h3>
      </div>

      {/* Wallet Connection Status */}
      {!isConnected ? (
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning-600" />
            <span className="text-warning-700 dark:text-warning-300">
              Please connect your wallet to place predictions
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span className="text-success-700 dark:text-success-300 font-medium">
                Wallet Connected
              </span>
            </div>
            <span className="text-sm text-success-600 dark:text-success-400">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </span>
          </div>
          <div className="mt-2 text-sm text-success-600 dark:text-success-400">
            Balance: {formatBalance(balance)} RBTC
          </div>
        </div>
      )}

      {/* Selected Bins Display */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
          Selected Predictions ({selectedBins.length})
        </label>
        {selectedBins.length === 0 ? (
          <div className="text-sm text-secondary-500 dark:text-secondary-400 italic">
            Click on the heatmap to select prediction bins
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedBins.map((bin, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm"
              >
                Bin {bin + 1}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
          Bet Amount (RBTC)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-secondary-400" />
          </div>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.000"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              error
                ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
                : 'border-secondary-300 dark:border-secondary-600'
            } bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100`}
            disabled={!isConnected || isPlacing}
          />
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-1 text-sm text-error-600">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Cost and Potential Winnings */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-secondary-600" />
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Total Cost
            </span>
          </div>
          <div className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            {cost} RBTC
          </div>
        </div>

        <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success-600" />
            <span className="text-sm font-medium text-success-700 dark:text-success-300">
              Potential Winnings
            </span>
          </div>
          <div className="text-lg font-semibold text-success-900 dark:text-success-100">
            {potentialWinnings} RBTC
          </div>
        </div>
      </div>

      {/* Place Bet Button */}
      <button
        onClick={handlePlaceBet}
        disabled={!isConnected || selectedBins.length === 0 || !!error || isPlacing || !amount}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
          !isConnected || selectedBins.length === 0 || !!error || isPlacing || !amount
            ? 'bg-secondary-300 dark:bg-secondary-700 text-secondary-500 dark:text-secondary-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
        }`}
      >
        {isPlacing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Placing Bet...
          </div>
        ) : (
          'Place Prediction'
        )}
      </button>

      {/* Additional Info */}
      <div className="mt-4 text-xs text-secondary-500 dark:text-secondary-400">
        <p>• Minimum bet: 0.001 RBTC</p>
        <p>• Fees are included in the total cost</p>
        <p>• Predictions are final once placed</p>
      </div>
    </motion.div>
  );
}
