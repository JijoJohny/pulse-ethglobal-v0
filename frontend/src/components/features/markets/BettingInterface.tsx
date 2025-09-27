import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface BettingInterfaceProps {
  selectedOption?: string;
  currentPrice?: string;
  potentialWin?: string;
  onPlaceBet?: (amount: string, option: string) => void;
  disabled?: boolean;
  className?: string;
}

export function BettingInterface({
  selectedOption,
  currentPrice,
  potentialWin,
  onPlaceBet,
  disabled = false,
  className = ''
}: BettingInterfaceProps) {
  const [betAmount, setBetAmount] = useState('100');
  const [isLoading, setIsLoading] = useState(false);

  const quickAmounts = ['+1', '+10', '+50', 'Max'];

  const handleQuickAmount = (action: string) => {
    if (action === 'Max') {
      setBetAmount('1000');
    } else {
      const increment = parseInt(action.replace('+', ''));
      setBetAmount((prev) => (parseInt(prev || '0') + increment).toString());
    }
  };

  const handlePlaceBet = async () => {
    if (!onPlaceBet || !selectedOption) return;
    
    setIsLoading(true);
    try {
      await onPlaceBet(betAmount, selectedOption);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePotentialWin = () => {
    const amount = parseFloat(betAmount || '0');
    const multiplier = 4.6; // Example multiplier
    return (amount * multiplier).toFixed(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}
    >
      <div className="space-y-6">
        {/* Selected Option Display */}
        {selectedOption && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Selected</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600">{selectedOption}</span>
              </div>
            </div>
            {currentPrice && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Price</span>
                <span className="text-sm font-semibold text-gray-900">{currentPrice}</span>
              </div>
            )}
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Bet Amount
          </label>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="block w-full pl-10 pr-16 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              placeholder="0"
              disabled={disabled}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm font-medium">USDC</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex space-x-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickAmount(amount)}
                disabled={disabled}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Potential Win Display */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Percent className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Potential Win</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              ${potentialWin || calculatePotentialWin()}
            </span>
          </div>
          <div className="mt-2 text-xs text-green-600">
            Includes your ${betAmount} stake
          </div>
        </div>

        {/* Place Bet Button */}
        <button
          onClick={handlePlaceBet}
          disabled={disabled || !selectedOption || !betAmount || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              <span>{disabled ? 'Connect Wallet' : 'Place Bet'}</span>
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center">
          By placing a bet, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:underline">Risk Disclosure</a>
        </p>
      </div>
    </motion.div>
  );
}
