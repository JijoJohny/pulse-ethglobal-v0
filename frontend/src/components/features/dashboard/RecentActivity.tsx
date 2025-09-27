import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Copy
} from 'lucide-react';

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

interface RecentActivityProps {
  activities: ActivityItem[];
  onViewDetails: (activity: ActivityItem) => void;
}

export function RecentActivity({ activities, onViewDetails }: RecentActivityProps) {
  const getActivityIcon = (type: string, status: string) => {
    if (status === 'failed') return XCircle;
    if (status === 'pending') return Clock;
    if (type === 'open') return TrendingUp;
    if (type === 'close') return TrendingDown;
    if (type === 'claim') return CheckCircle;
    return Clock;
  };

  const getActivityColor = (type: string, status: string) => {
    if (status === 'failed') return 'error';
    if (status === 'pending') return 'warning';
    if (type === 'open') return 'primary';
    if (type === 'close') return 'secondary';
    if (type === 'claim') return 'success';
    return 'secondary';
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'open': return 'Opened Position';
      case 'close': return 'Closed Position';
      case 'claim': return 'Claimed Winnings';
      case 'expired': return 'Position Expired';
      default: return 'Unknown Activity';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const copyTxHash = async (txHash: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy transaction hash:', error);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Recent Activity
        </h3>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600 dark:text-secondary-400">
              No recent activity
            </p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type, activity.status);
            const color = getActivityColor(activity.type, activity.status);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 bg-${color}-100 dark:bg-${color}-900/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 text-${color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {getActivityText(activity.type)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activity.status === 'confirmed' ? 'bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-300' :
                          activity.status === 'pending' ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300' :
                          'bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-300'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2 truncate">
                        {activity.market}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-secondary-500 dark:text-secondary-400">
                        <span>{formatTimeAgo(activity.timestamp)}</span>
                        <span>{activity.amount.toFixed(4)} RBTC</span>
                        {activity.pnl !== undefined && (
                          <span className={`${
                            activity.pnl >= 0 ? 'text-success-600' : 'text-error-600'
                          }`}>
                            {activity.pnl >= 0 ? '+' : ''}{activity.pnl.toFixed(4)} RBTC
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {activity.txHash && (
                      <button
                        onClick={() => copyTxHash(activity.txHash!)}
                        className="p-1 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 transition-colors"
                        title="Copy transaction hash"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onViewDetails(activity)}
                      className="p-1 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
