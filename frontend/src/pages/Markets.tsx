import { motion } from 'framer-motion';
import { TrendingUp, Filter, Search, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { PredictionMarketCard } from '../components/features/markets/PredictionMarketCard';
import { MarketDetailsView } from '../components/features/markets/MarketDetailsView';

export default function Markets() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'details'>('grid');

  // Mock market data
  const markets = [
    {
      id: '1',
      title: '$89,000 - $89,500 on 19 Apr 2025',
      endDate: '19 days after (19 Apr 2025)',
      totalShares: '1.48K (24.1%)',
      ranges: [
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
      ],
      avgPrice: '21.0¢',
      amount: '100',
    },
    {
      id: '2',
      title: '$88,000 - $92,000 on 4 Apr 2025',
      endDate: '4 Apr 2025',
      totalShares: '2.1K',
      ranges: [
        { min: 88000, max: 88500, shares: '0.3K (14.3%)', percentage: 14.3 },
        { min: 88500, max: 89000, shares: '0.5K (23.8%)', percentage: 23.8 },
        { min: 89000, max: 89500, shares: '0.4K (19.0%)', percentage: 19.0, isHighlighted: true },
        { min: 89500, max: 90000, shares: '0.3K (14.3%)', percentage: 14.3 },
        { min: 90000, max: 90500, shares: '0.2K (9.5%)', percentage: 9.5 },
        { min: 90500, max: 91000, shares: '0.2K (9.5%)', percentage: 9.5 },
        { min: 91000, max: 91500, shares: '0.1K (4.8%)', percentage: 4.8 },
        { min: 91500, max: 92000, shares: '0.1K (4.8%)', percentage: 4.8 },
      ],
      avgPrice: '25¢',
      amount: '0',
    }
  ];

  const handleMarketSelect = (marketId: string) => {
    setSelectedMarket(marketId);
    setViewMode('details');
  };

  const handleBackToGrid = () => {
    setSelectedMarket(null);
    setViewMode('grid');
  };

  if (viewMode === 'details' && selectedMarket) {
    const market = markets.find(m => m.id === selectedMarket);
    if (market) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToGrid}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>←</span>
              <span>Back to Markets</span>
            </button>
          </div>
          
          <MarketDetailsView
            title={market.title}
            dateRange={market.endDate}
            currentPrice="$89,500.30 - $89,980.24"
            priceChange={2.5}
            amount="0"
            confidence={25}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Prediction Markets
          </h1>
          <p className="text-gray-600">
            Trade on future events with decentralized prediction markets
          </p>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {markets.map((market, index) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PredictionMarketCard
                id={market.id}
                title={market.title}
                endDate={market.endDate}
                totalShares={market.totalShares}
                ranges={market.ranges}
                avgPrice={market.avgPrice}
                amount={market.amount}
                onBet={(range, amount) => {
                  console.log('Bet placed:', { range, amount, marketId: market.id });
                  // Handle bet placement
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
