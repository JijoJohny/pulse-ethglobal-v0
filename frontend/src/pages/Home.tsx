import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, BarChart3, Shield } from 'lucide-react';

import { MarketOverview } from '../components/features/home/MarketOverview';
import { RecentMarkets } from '../components/features/home/RecentMarkets';
import { TopTraders } from '../components/features/home/TopTraders';
import { StatsCards } from '../components/features/home/StatsCards';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-6xl font-bold gradient-text">
          Pulse-08 Signals Protocol
        </h1>
        <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
          Decentralized prediction markets on Rootstock Bitcoin sidechain with The Graph integration
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full">
            <Shield className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Bitcoin Security
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-success-50 dark:bg-success-900/20 rounded-full">
            <BarChart3 className="w-5 h-5 text-success-600" />
            <span className="text-sm font-medium text-success-700 dark:text-success-300">
              The Graph Indexing
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 dark:bg-warning-900/20 rounded-full">
            <TrendingUp className="w-5 h-5 text-warning-600" />
            <span className="text-sm font-medium text-warning-700 dark:text-warning-300">
              CLMSR Mechanism
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary-50 dark:bg-secondary-900/20 rounded-full">
            <Users className="w-5 h-5 text-secondary-600" />
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Decentralized
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatsCards />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Market Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <MarketOverview />
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          <RecentMarkets />
          <TopTraders />
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
            Why Choose Pulse-08?
          </h2>
          <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
            Built on Rootstock for Bitcoin security with The Graph for decentralized indexing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Bitcoin Security</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Inherits Bitcoin's security model through Rootstock sidechain
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">The Graph Indexing</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Decentralized data indexing for reliable and fast queries
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-warning-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">CLMSR Mechanism</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Continuous Logarithmic Market Scoring Rule for fair pricing
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-secondary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Decentralized</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              No central authority, fully decentralized prediction markets
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
