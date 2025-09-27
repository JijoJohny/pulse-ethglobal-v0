import React from 'react';
import { motion } from 'framer-motion';
import { PredictionMarketCard, MarketDetailsView } from '../components/features/markets';

export default function UIDemo() {
  // Mock data for the first card
  const mockRanges = [
    { min: 89000, max: 89500, shares: '1.48K (24.1%)', percentage: 24.1 },
    { min: 89500, max: 90000, shares: '2.3K (37.0%)', percentage: 37.0 },
    { min: 90000, max: 90500, shares: '1.5K (25.0%)', percentage: 25.0 },
    { min: 90500, max: 91000, shares: '0.85K (14.2%)', percentage: 14.2 },
    { min: 91000, max: 91500, shares: '0.6K (9.9%)', percentage: 9.9 },
    { min: 91500, max: 92000, shares: '0.4K (6.8%)', percentage: 6.8, isHighlighted: true },
    { min: 92000, max: 92500, shares: '0.25K (4.1%)', percentage: 4.1 },
    { min: 92500, max: 93000, shares: '0.15K (2.5%)', percentage: 2.5 },
    { min: 93000, max: 93500, shares: '0.1K (1.7%)', percentage: 1.7 },
    { min: 93500, max: 94000, shares: '0.08K (1.3%)', percentage: 1.3 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            UI Components Demo
          </h1>
          <p className="text-gray-600">
            Modern prediction market interfaces based on your designs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* First Design - Prediction Market Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 text-center">
              Design 1: Prediction Market Card
            </h2>
            <PredictionMarketCard
              id="demo-1"
              title="$89,000 - $89,500 on 19 Apr 2025"
              endDate="19 days after (19 Apr 2025)"
              totalShares="1.48K (24.1%)"
              ranges={mockRanges}
              avgPrice="21.0¢"
              amount="100"
              onBet={(range, amount) => {
                console.log('Demo bet:', { range, amount });
              }}
            />
          </motion.div>

          {/* Second Design - Market Details View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 text-center">
              Design 2: Market Details View
            </h2>
            <MarketDetailsView
              title="Today (17 Apr 2025)"
              dateRange="10 days after (19 Apr 2025)"
              currentPrice="$89,500.30 - $89,980.24"
              priceChange={2.5}
              amount="0"
              confidence={25}
              onBet={(amount) => {
                console.log('Demo bet amount:', amount);
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
