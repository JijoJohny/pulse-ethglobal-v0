import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, BarChart3, DollarSign } from 'lucide-react';

export function StatsCards() {
  const stats = [
    {
      title: 'Total Volume',
      value: '1,234 RBTC',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'primary' as const,
    },
    {
      title: 'Active Markets',
      value: '24',
      change: '+3',
      changeType: 'positive' as const,
      icon: BarChart3,
      color: 'success' as const,
    },
    {
      title: 'Total Trades',
      value: '567',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'warning' as const,
    },
    {
      title: 'Active Users',
      value: '89',
      change: '+15',
      changeType: 'positive' as const,
      icon: Users,
      color: 'secondary' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="card p-6 hover:shadow-medium transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-100 dark:bg-${stat.color}-900/20 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-success-600' : 'text-error-600'
              }`}>
                {stat.change}
              </span>
            </div>
            
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {stat.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

