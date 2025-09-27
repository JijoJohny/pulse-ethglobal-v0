import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Filter } from 'lucide-react';

interface MarketDetailsViewProps {
  title: string;
  dateRange: string;
  currentPrice: string;
  priceChange: number;
  amount: string;
  confidence: number;
  onBet?: (amount: string) => void;
}

export function MarketDetailsView({
  title,
  dateRange,
  currentPrice,
  priceChange,
  amount,
  confidence,
  onBet
}: MarketDetailsViewProps) {
  const [betAmount, setBetAmount] = useState(amount || '0');
  const [selectedTimeframe, setSelectedTimeframe] = useState('10 days after');

  // Mock chart data - in real app, this would come from props or API
  const chartData = [
    { price: 89200, height: 25 },
    { price: 89400, height: 45 },
    { price: 89600, height: 35 },
    { price: 89800, height: 50 },
    { price: 90000, height: 60 },
    { price: 90200, height: 40 },
  ];

  const handlePlaceBet = () => {
    if (onBet) {
      onBet(betAmount);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <BarChart3 className="w-3 h-3 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{dateRange}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-3 h-3 text-gray-400" />
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="10 days after">10 days after (19 Apr 2025)</option>
              <option value="1 month after">1 month after</option>
              <option value="3 months after">3 months after</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-xl font-bold text-gray-900">{currentPrice}</span>
                <span className="text-xs text-gray-600">on 4 Apr 2025</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Avg Price</span>
                <span className="text-sm font-semibold text-gray-900">25¢</span>
              </div>
            </div>

            {/* Chart Container */}
            <div className="bg-gray-50 rounded-lg p-4 h-48 relative">
              {/* Chart Bars */}
              <div className="flex items-end justify-between h-32 px-4">
                {chartData.map((point, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-blue-500 rounded-t w-6"
                      style={{ 
                        height: `${point.height}%`,
                        minHeight: '4px'
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Confidence Box */}
              <div className="absolute top-4 right-4 bg-white rounded-lg px-3 py-2 shadow-sm border">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{confidence}%</div>
                </div>
              </div>

              {/* Price Labels */}
              <div className="flex justify-between mt-2 text-xs text-gray-500 px-4">
                <span>$89,000</span>
                <span>$92,000</span>
              </div>
            </div>
          </div>

          {/* Betting Panel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-center mb-4">
              <div className="text-xs text-gray-600 mb-1">Amount</div>
              <div className="text-xs text-gray-500 mb-2">Your confidence is</div>
              <div className="text-2xl font-bold text-gray-900 mb-4">${betAmount}</div>
            </div>

            <div className="space-y-4">
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {['+1', '+10', '+50', 'Max'].map((btn) => (
                  <button
                    key={btn}
                    className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-medium transition-colors"
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

              <button
                onClick={handlePlaceBet}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors duration-200"
              >
                Log in to Bet
              </button>

              <div className="text-center text-xs text-gray-500">
                Potential payout: <span className="font-semibold text-gray-900">$400</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
