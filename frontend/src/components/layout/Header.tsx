import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  User, 
  Menu, 
  X,
  Wallet,
  Settings
} from 'lucide-react';

import { ConnectWalletButton } from '../web3/ConnectWalletButton';
import { useRootstockWallet } from '../../web3/provider';

export function Header() {
  const location = useLocation();
  const { isConnected, account, network } = useRootstockWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: TrendingUp },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Markets', href: '/markets', icon: BarChart3 },
    { name: 'Positions', href: '/positions', icon: User },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'UI Demo', href: '/ui-demo', icon: Settings },
    { name: 'Wallet Test', href: '/wallet-test', icon: Wallet },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Pulse-08</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(item.href) 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Network Indicator */}
            {network && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  {network.name}
                </span>
              </div>
            )}

            {/* Account Info */}
            {isConnected && account && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                <Wallet className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            )}

            {/* Connect Wallet Button */}
            <ConnectWalletButton />

            {/* Settings */}
            <Link
              to="/profile"
              className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-100 dark:hover:bg-secondary-800 rounded-md transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-100 dark:hover:bg-secondary-800 rounded-md transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-secondary-200 dark:border-secondary-700"
          >
            <div className="py-4 space-y-4">
              {/* Mobile Navigation Links */}
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-100 dark:hover:bg-secondary-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Actions */}
              <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 space-y-4">
                {/* Network Indicator */}
                {network && (
                  <div className="flex items-center space-x-3 px-4 py-3 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                    <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                    <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                      {network.name}
                    </span>
                  </div>
                )}

                {/* Account Info */}
                {isConnected && account && (
                  <div className="flex items-center space-x-3 px-4 py-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                    <Wallet className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                  </div>
                )}

                {/* Connect Wallet Button */}
                <div className="px-4">
                  <ConnectWalletButton />
                </div>

                {/* Settings */}
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm font-medium">Settings</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}
