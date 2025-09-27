import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MetamaskConnectButton from '../../web3/MetamaskConnectButton';

export function Header() {
  const location = useLocation();
  const [isFaucetModalOpen, setIsFaucetModalOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl px-6 mx-auto">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-xl flex items-center gap-1.5 font-bold text-primary"
            >
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              Signals
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsFaucetModalOpen(true)}
              className="cursor-pointer hover:text-primary transition-colors"
            >
              Faucet
            </button>
            <Link 
              to="/history"
              className={`hover:text-primary transition-colors ${
                isActive('/history') ? 'text-primary' : 'text-gray-700'
              }`}
            >
              History
            </Link>
            <MetamaskConnectButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
