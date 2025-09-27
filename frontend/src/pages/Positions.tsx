import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Filter,
  Search,
  SortAsc,
  MoreHorizontal,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useRootstockWallet } from '../web3/provider';

interface Position {
  id: string;
  market: string;
  question: string;
  quantity: number;
  costBasis: number;
  currentValue: number;
  pnl: number;
  status: 'open' | 'closed' | 'expired';
  endDate: Date;
  createdAt: Date;
  txHash?: string;
}

export default function Positions() {
  const { isConnected } = useRootstockWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  // Mock data - in real app, this would come from API
  const positions: Position[] = [
    {
      id: '1',
      market: 'Bitcoin Price Prediction',
      question: 'Will Bitcoin reach $100,000 by end of 2024?',
      quantity: 10.5,
      costBasis: 8.2,
      currentValue: 12.1,
      pnl: 3.9,
      status: 'open',
      endDate: new Date('2024-12-31'),
      createdAt: new Date('2024-01-15'),
      txHash: '0x1234...5678'
    },
    {
      id: '2',
      market: 'Ethereum Merge',
      question: 'Will Ethereum successfully complete the merge?',
      quantity: 5.2,
      costBasis: 4.8,
      currentValue: 3.1,
      pnl: -1.7,
      status: 'closed',
      endDate: new Date('2024-09-15'),
      createdAt: new Date('2024-01-10'),
      txHash: '0x2345...6789'
    },
    {
      id: '3',
      market: 'DeFi TVL Growth',
      question: 'Will DeFi TVL exceed $200B by Q4 2024?',
      quantity: 7.8,
      costBasis: 6.5,
      currentValue: 8.9,
      pnl: 2.4,
      status: 'open',
      endDate: new Date('2024-12-31'),
      createdAt: new Date('2024-01-20'),
      txHash: '0x3456...7890'
    },
    {
      id: '4',
      market: 'Crypto Regulation',
      question: 'Will crypto face stricter regulation in 2024?',
      quantity: 3.2,
      costBasis: 2.8,
      currentValue: 0,
      pnl: -2.8,
      status: 'expired',
      endDate: new Date('2024-01-31'),
      createdAt: new Date('2024-01-05'),
      txHash: '0x4567...8901'
    }
  ];

  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.market.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || position.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'badge-success';
      case 'closed': return 'badge-secondary';
      case 'expired': return 'badge-error';
      default: return 'badge-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'closed': return 'Closed';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const copyTxHash = async (txHash: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy transaction hash:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
            Connect your MetaMask wallet to view your positions and trading history.
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
            Your Positions
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-2">
            Track your prediction market positions and performance
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 lg:flex-none lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Positions</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Positions</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {positions.length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Open Positions</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {positions.filter(p => p.status === 'open').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-warning-600" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Total P&L</p>
              <p className={`text-2xl font-bold ${
                positions.reduce((sum, p) => sum + p.pnl, 0) >= 0 ? 'text-success-600' : 'text-error-600'
              }`}>
                {positions.reduce((sum, p) => sum + p.pnl, 0) >= 0 ? '+' : ''}
                {positions.reduce((sum, p) => sum + p.pnl, 0).toFixed(4)} RBTC
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-success-600" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Win Rate</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {Math.round((positions.filter(p => p.pnl > 0).length / positions.length) * 100)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success-600" />
          </div>
        </div>
      </div>

      {/* Positions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPositions.map((position, index) => (
          <motion.div
            key={position.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="card p-6 hover:shadow-medium transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-1 truncate">
                  {position.market}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-2">
                  {position.question}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <span className={`badge ${getStatusColor(position.status)}`}>
                  {getStatusText(position.status)}
                </span>
                <button className="p-1 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">Quantity</p>
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {position.quantity.toFixed(4)} RBTC
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">Cost Basis</p>
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {position.costBasis.toFixed(4)} RBTC
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">Current Value</p>
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {position.currentValue.toFixed(4)} RBTC
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">P&L</p>
                  <p className={`text-sm font-medium ${
                    position.pnl >= 0 ? 'text-success-600' : 'text-error-600'
                  }`}>
                    {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(4)} RBTC
                  </p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400">
                  <span>Created: {position.createdAt.toLocaleDateString()}</span>
                  <span>Ends: {position.endDate.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 btn btn-outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </button>
              {position.status === 'open' && (
                <button className="flex-1 btn btn-primary">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Close Position
                </button>
              )}
              {position.txHash && (
                <button
                  onClick={() => copyTxHash(position.txHash!)}
                  className="btn btn-ghost"
                  title="Copy transaction hash"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPositions.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
            No positions found
          </h3>
          <p className="text-secondary-600 dark:text-secondary-400">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'You haven\'t opened any positions yet.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
    