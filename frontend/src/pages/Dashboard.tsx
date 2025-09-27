import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Award,
  Activity,
  BarChart3,
  Users,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useRootstockWallet } from '../web3/provider';
import { UserStats } from '../components/features/dashboard/UserStats';
import { RecentActivity } from '../components/features/dashboard/RecentActivity';
import { PerformanceChart } from '../components/features/dashboard/PerformanceChart';

interface ActivityItem {
  id: string;
  type: 'open' | 'close' | 'claim' | 'expired';
  market: string;
  amount: number;
  pnl?: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
}

interface PerformanceData {
  date: string;
  pnl: number;
  cumulativePnl: number;
  trades: number;
}

export default function Dashboard() {
  const { isConnected, account } = useRootstockWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  // Mock user stats
  const userStats = {
    totalPnl: 12.45,
    winRate: 68.5,
    totalTrades: 24,
    activePositions: 8,
    totalVolume: 156.78,
    rank: 15,
    streak: 5,
    bestTrade: 8.92
  };

  // Mock recent activity
  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'open',
      market: 'Bitcoin Price Prediction',
      amount: 5.2,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'confirmed',
      txHash: '0x1234...5678'
    },
    {
      id: '2',
      type: 'close',
      market: 'Ethereum Merge',
      amount: 3.8,
      pnl: 1.2,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      status: 'confirmed',
      txHash: '0x2345...6789'
    },
    {
      id: '3',
      type: 'claim',
      market: 'DeFi TVL Growth',
      amount: 2.1,
      pnl: 0.8,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      status: 'confirmed',
      txHash: '0x3456...7890'
    },
    {
      id: '4',
      type: 'expired',
      market: 'Crypto Regulation',
      amount: 1.5,
      pnl: -0.3,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'confirmed',
      txHash: '0x4567...8901'
    }
  ];

  // Mock performance data
  const performanceData: PerformanceData[] = [
    { date: '2024-01-01', pnl: 2.1, cumulativePnl: 2.1, trades: 1 },
    { date: '2024-01-02', pnl: -0.5, cumulativePnl: 1.6, trades: 2 },
    { date: '2024-01-03', pnl: 1.8, cumulativePnl: 3.4, trades: 3 },
    { date: '2024-01-04', pnl: 0.9, cumulativePnl: 4.3, trades: 4 },
    { date: '2024-01-05', pnl: -1.2, cumulativePnl: 3.1, trades: 5 },
    { date: '2024-01-06', pnl: 2.3, cumulativePnl: 5.4, trades: 6 },
    { date: '2024-01-07', pnl: 1.1, cumulativePnl: 6.5, trades: 7 }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // In a real app, this would fetch new data based on the time range
  };

  const handleViewActivityDetails = (activity: ActivityItem) => {
    console.log('View activity details:', activity);
    // In a real app, this would navigate to the activity details page
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
            Connect your MetaMask wallet to view your dashboard and trading performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Dashboard
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-2">
            Track your trading performance and market activity
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* User Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <UserStats {...userStats} />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Performance Chart - Takes up 2 columns on xl screens */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="xl:col-span-2"
        >
          <PerformanceChart 
            data={performanceData} 
            onTimeRangeChange={handleTimeRangeChange}
          />
        </motion.div>

        {/* Recent Activity - Takes up 1 column on xl screens */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <RecentActivity 
            activities={recentActivity}
            onViewDetails={handleViewActivityDetails}
          />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Open Position
              </p>
              <p className="text-xs text-secondary-600 dark:text-secondary-400">
                Start trading
              </p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
            <div className="w-10 h-10 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-success-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                View Markets
              </p>
              <p className="text-xs text-secondary-600 dark:text-secondary-400">
                Browse predictions
              </p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
            <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-warning-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Analytics
              </p>
              <p className="text-xs text-secondary-600 dark:text-secondary-400">
                View insights
              </p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
            <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-secondary-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Leaderboard
              </p>
              <p className="text-xs text-secondary-600 dark:text-secondary-400">
                See rankings
              </p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Market Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Market Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
            <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
              Active Markets
            </h4>
            <p className="text-2xl font-bold text-primary-600">24</p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Currently trading
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-8 h-8 text-success-600" />
            </div>
            <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
              Total Volume
            </h4>
            <p className="text-2xl font-bold text-success-600">1,234 RBTC</p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Last 24 hours
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-warning-600" />
            </div>
            <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
              Active Traders
            </h4>
            <p className="text-2xl font-bold text-warning-600">89</p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Online now
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
