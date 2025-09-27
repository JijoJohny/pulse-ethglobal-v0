import React from 'react';
import { useMetamaskWallet } from './MetamaskWalletProvider';

export default function MetamaskConnectButton() {
  const { account, isConnected, isConnecting, balance, connect, disconnect } = useMetamaskWallet();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className="btn-primary"
      style={{
        backgroundColor: "var(--color-primary)",
        height: "40px",
        borderRadius: "10px",
        fontSize: "14px",
        minWidth: "120px"
      }}
    >
      {isConnecting ? (
        'Connecting...'
      ) : isConnected ? (
        <div className="flex flex-col items-center">
          <span>{formatAddress(account!)}</span>
          <span className="text-xs opacity-80">{balance} ETH</span>
        </div>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}
