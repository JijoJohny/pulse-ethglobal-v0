import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users } from 'lucide-react';

export function RecentMarkets() {
  const recentMarkets = [
    {
      id: 1,
      title: 'Bitcoin ETF Approval',
      description: 'Will Bitcoin ETF be approved in 2024?',
      volume: '89 RBTC',
      trades: 12,
      timeAgo: '2h ago',
    },
    {
      id: 2,
      title: 'Ethereum Shanghai Upgrade',
      description: 'Will Shanghai upgrade be successful?',
      volume: '67 RBTC',
      trades: 8,
      timeAgo: '4h ago',
    },
    {
      id: 3,
      title: 'DeFi Regulation',
      description: 'Will DeFi face stricter regulation?',
      volume: '45 RBTC',
      trades: 6,
      timeAgo: '6h ago',
    },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Recent Markets
        </h3>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {recentMarkets.map((market, index) => (
          <motion.div
            key={market.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-secondary-900 dark:text-secondary-100 text-sm">
                  {market.title}
                </h4>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                  {market.description}
                </p>
              </div>
              <span className="text-xs text-secondary-500 dark:text-secondary-500">
                {market.timeAgo}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-secondary-600" />
                  <span className="text-secondary-600 dark:text-secondary-400">{market.volume}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-secondary-600" />
                  <span className="text-secondary-600 dark:text-secondary-400">{market.trades}</span>
                </div>
              </div>
              <button className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                Trade
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
