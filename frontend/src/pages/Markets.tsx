import { motion } from 'framer-motion';
import { TrendingUp, Filter, Search } from 'lucide-react';

export default function Markets() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Markets
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-2">
            Explore and trade prediction markets on Rootstock
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search markets..."
              className="pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter */}
          <button className="flex items-center space-x-2 px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Market Cards */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="card p-6 hover:shadow-medium transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Market {i}
              </h3>
              <span className="badge badge-success">Active</span>
            </div>
            
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
              Will Bitcoin reach $100,000 by end of 2024?
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">Volume</span>
                <span className="font-medium">1,234 RBTC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">Trades</span>
                <span className="font-medium">567</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">Ends</span>
                <span className="font-medium">Dec 31, 2024</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <button className="w-full btn btn-primary">
                <TrendingUp className="w-4 h-4 mr-2" />
                Trade
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
