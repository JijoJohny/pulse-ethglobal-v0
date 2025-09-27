import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Award,
  Activity,
  BarChart3,
  Users
} from 'lucide-react';

interface UserStatsProps {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  activePositions: number;
  totalVolume: number;
  rank: number;
  streak: number;
  bestTrade: number;
}

export function UserStats({
  totalPnl,
  winRate,
  totalTrades,
  activePositions,
  totalVolume,
  rank,
  streak,
  bestTrade
}: UserStatsProps) {
  const stats = [
    {
      title: 'Total P&L',
      value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(4)} RBTC`,
      change: totalPnl >= 0 ? 'positive' : 'negative',
      icon: totalPnl >= 0 ? TrendingUp : TrendingDown,
      color: totalPnl >= 0 ? 'success' : 'error',
    },
    {
      title: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      change: winRate >= 50 ? 'positive' : 'negative',
      icon: Target,
      color: winRate >= 50 ? 'success' : 'warning',
    },
    {
      title: 'Total Trades',
      value: totalTrades.toString(),
      change: 'neutral',
      icon: BarChart3,
      color: 'primary',
    },
    {
      title: 'Active Positions',
      value: activePositions.toString(),
      change: 'neutral',
      icon: Activity,
      color: 'secondary',
    },
    {
      title: 'Total Volume',
      value: `${totalVolume.toFixed(2)} RBTC`,
      change: 'neutral',
      icon: DollarSign,
      color: 'primary',
    },
    {
      title: 'Rank',
      value: `#${rank}`,
      change: 'neutral',
      icon: Award,
      color: 'warning',
    },
    {
      title: 'Win Streak',
      value: streak.toString(),
      change: 'positive',
      icon: TrendingUp,
      color: 'success',
    },
    {
      title: 'Best Trade',
      value: `${bestTrade.toFixed(4)} RBTC`,
      change: 'positive',
      icon: Award,
      color: 'success',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="card p-4 hover:shadow-medium transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-${stat.color}-100 dark:bg-${stat.color}-900/20 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div className={`w-2 h-2 rounded-full ${
                stat.change === 'positive' ? 'bg-success-500' :
                stat.change === 'negative' ? 'bg-error-500' : 'bg-secondary-400'
              }`} />
            </div>
            
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                {stat.title}
              </p>
              <p className={`text-lg font-bold ${
                stat.change === 'positive' ? 'text-success-600' :
                stat.change === 'negative' ? 'text-error-600' : 'text-secondary-900 dark:text-secondary-100'
              }`}>
                {stat.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
