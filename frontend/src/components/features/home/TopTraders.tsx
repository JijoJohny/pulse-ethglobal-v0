import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Trophy, Users } from 'lucide-react';

export function TopTraders() {
  const topTraders = [
    {
      rank: 1,
      address: '0x1234...5678',
      volume: '234 RBTC',
      trades: 45,
      winRate: '78%',
      pnl: '+12.5 RBTC',
    },
    {
      rank: 2,
      address: '0x2345...6789',
      volume: '189 RBTC',
      trades: 32,
      winRate: '72%',
      pnl: '+8.9 RBTC',
    },
    {
      rank: 3,
      address: '0x3456...7890',
      volume: '156 RBTC',
      trades: 28,
      winRate: '68%',
      pnl: '+6.2 RBTC',
    },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Top Traders
        </h3>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {topTraders.map((trader, index) => (
          <motion.div
            key={trader.rank}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  trader.rank === 1 ? 'bg-warning-100 text-warning-600' :
                  trader.rank === 2 ? 'bg-secondary-100 text-secondary-600' :
                  'bg-error-100 text-error-600'
                }`}>
                  {trader.rank === 1 ? <Trophy className="w-3 h-3" /> : trader.rank}
                </div>
                <span className="font-medium text-secondary-900 dark:text-secondary-100 text-sm">
                  {trader.address}
                </span>
              </div>
              <span className="text-sm font-medium text-success-600">
                {trader.pnl}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-secondary-600" />
                <span className="text-secondary-600 dark:text-secondary-400">Volume</span>
                <span className="font-medium">{trader.volume}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-secondary-600" />
                <span className="text-secondary-600 dark:text-secondary-400">Trades</span>
                <span className="font-medium">{trader.trades}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-secondary-600 dark:text-secondary-400">Win Rate</span>
                <span className="font-medium text-success-600">{trader.winRate}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
