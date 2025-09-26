import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

export default function Positions() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Your Positions
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-2">
            Track your prediction market positions and performance
          </p>
        </div>
      </div>

      {/* Positions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder Position Cards */}
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Position #{i}
              </h3>
              <span className={`badge ${
                i % 3 === 0 ? 'badge-success' : 
                i % 3 === 1 ? 'badge-warning' : 'badge-error'
              }`}>
                {i % 3 === 0 ? 'Won' : i % 3 === 1 ? 'Open' : 'Lost'}
              </span>
            </div>
            
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
              Will Bitcoin reach $100,000 by end of 2024?
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">Quantity</span>
                <span className="font-medium">10.5 RBTC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">Cost Basis</span>
                <span className="font-medium">8.2 RBTC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">Current Value</span>
                <span className="font-medium">12.1 RBTC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600 dark:text-secondary-400">P&L</span>
                <span className={`font-medium ${
                  i % 3 === 0 ? 'text-success-600' : 
                  i % 3 === 1 ? 'text-warning-600' : 'text-error-600'
                }`}>
                  {i % 3 === 0 ? '+3.9 RBTC' : 
                   i % 3 === 1 ? '+1.9 RBTC' : '-2.1 RBTC'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <div className="flex space-x-3">
                <button className="flex-1 btn btn-outline">
                  <Clock className="w-4 h-4 mr-2" />
                  View Details
                </button>
                {i % 3 === 1 && (
                  <button className="flex-1 btn btn-primary">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Close Position
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
