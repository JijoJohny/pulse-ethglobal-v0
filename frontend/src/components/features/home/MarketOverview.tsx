import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users } from 'lucide-react';

export function MarketOverview() {
  const markets = [
    {
      id: 1,
      title: 'Bitcoin Price Prediction',
      description: 'Will Bitcoin reach $100,000 by end of 2024?',
      volume: '234 RBTC',
      trades: 45,
      endDate: 'Dec 31, 2024',
      status: 'active' as const,
    },
    {
      id: 2,
      title: 'Ethereum Merge Success',
      description: 'Will Ethereum successfully complete the merge?',
      volume: '189 RBTC',
      trades: 32,
      endDate: 'Sep 15, 2024',
      status: 'active' as const,
    },
    {
      id: 3,
      title: 'DeFi TVL Growth',
      description: 'Will DeFi TVL exceed $200B by Q4 2024?',
      volume: '156 RBTC',
      trades: 28,
      endDate: 'Dec 31, 2024',
      status: 'active' as const,
    },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
          Market Overview
        </h2>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {markets.map((market, index) => (
          <motion.div
            key={market.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
                  {market.title}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {market.description}
                </p>
              </div>
              <span className={`badge ${
                market.status === 'active' ? 'badge-success' : 'badge-warning'
              }`}>
                {market.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-secondary-600" />
                <span className="text-secondary-600 dark:text-secondary-400">Volume</span>
                <span className="font-medium">{market.volume}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-secondary-600" />
                <span className="text-secondary-600 dark:text-secondary-400">Trades</span>
                <span className="font-medium">{market.trades}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-secondary-600" />
                <span className="text-secondary-600 dark:text-secondary-400">Ends</span>
                <span className="font-medium">{market.endDate}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

