import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, BarChart3 } from 'lucide-react';

interface PredictionRange {
  min: number;
  max: number;
  shares: string;
  percentage: number;
  isHighlighted?: boolean;
}

interface PredictionMarketCardProps {
  id: string;
  title: string;
  endDate: string;
  totalShares: string;
  ranges: PredictionRange[];
  avgPrice?: string;
  amount?: string;
  onBet?: (range: PredictionRange, amount: string) => void;
}

export function PredictionMarketCard({
  id,
  title,
  endDate,
  totalShares,
  ranges,
  avgPrice,
  amount,
  onBet
}: PredictionMarketCardProps) {
  const [selectedRange, setSelectedRange] = useState<PredictionRange | null>(null);
  const [betAmount, setBetAmount] = useState(amount || '100');

  const handleRangeSelect = (range: PredictionRange) => {
    setSelectedRange(range);
  };

  const handlePlaceBet = () => {
    if (selectedRange && onBet) {
      onBet(selectedRange, betAmount);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <BarChart3 className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-600">Signals</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Profile</p>
              <div className="flex items-center justify-end space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-900">GetIn: 4821c3</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{endDate}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{totalShares}</span>
            </div>
          </div>
        </div>

        {/* Prediction Section */}
        <div className="px-4 py-4">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-900 mb-1 uppercase tracking-wide">PREDICTION</h3>
            <p className="text-lg font-bold text-gray-900 mb-4">{title}</p>
          </div>

          {/* Price Ranges Table */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-medium text-gray-600 mb-2 px-2">
              <span>PREDICTION</span>
              <span>SHARES</span>
            </div>
            
            <div className="space-y-1">
              {ranges.map((range, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center justify-between px-3 py-2 rounded text-sm cursor-pointer transition-all duration-200 ${
                    range.isHighlighted 
                      ? 'bg-orange-500 text-white' 
                      : selectedRange === range
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleRangeSelect(range)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      range.isHighlighted ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatCurrency(range.min)} - {formatCurrency(range.max)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${
                      range.isHighlighted ? 'text-white' : 'text-gray-900'
                    }`}>
                      {range.shares}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Prediction Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-right mb-2">
              <div className="text-lg font-bold text-gray-900">
                $88,000 - $88,500
              </div>
              <div className="text-sm text-gray-600">
                on 19 Apr 2025
              </div>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600">Avg Price</span>
              <span className="font-medium text-gray-900">21.0¢</span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              <span>Amount</span>
            </div>
            <div className="text-sm text-gray-500 mb-3">
              Your confidence is
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-4">
              {betAmount}USDC
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex justify-center space-x-2 mb-4">
            {['+1', '+10', '+50', 'Max'].map((btn) => (
              <button
                key={btn}
                className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                onClick={() => {
                  if (btn === 'Max') {
                    setBetAmount('1000');
                  } else {
                    const increment = parseInt(btn.replace('+', ''));
                    setBetAmount((prev) => (parseInt(prev || '0') + increment).toString());
                  }
                }}
              >
                {btn}
              </button>
            ))}
          </div>

          {/* Win Amount */}
          <div className="text-center mb-4">
            <div className="text-xs text-gray-500">To win</div>
            <div className="text-lg font-bold text-green-600">$461.78</div>
          </div>

          {/* Approve Button */}
          <button
            onClick={handlePlaceBet}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Approve USDC
          </button>
        </div>
      </motion.div>
    </div>
  );
}
