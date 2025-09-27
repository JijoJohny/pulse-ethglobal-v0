import React, { useState } from 'react';
import BN from "bn.js";
import { useMetamaskWallet } from '../../../web3/MetamaskWalletProvider';
import { dollarFormatter, avgPriceFormatter } from '../../../utils/formatter';
import { formatBN, parseBN } from '../../../utils/format-bn';
import cn from '../../../utils/cn';

interface PredictionInputProps {
  shares: BN;
  selectedMarketId: number;
  currentBins: number[];
  selectedDate: Date;
  currRange: [number, number] | null;
  cost: string;
  setCost: (amount: string) => void;
  balance: number;
  isTicketLoading: boolean;
  refreshMap: () => Promise<void>;
}

export default function PredictionInput({
  selectedMarketId,
  currentBins,
  selectedDate,
  currRange,
  shares,
  cost,
  setCost,
  balance,
  isTicketLoading,
  refreshMap,
}: PredictionInputProps) {
  const { isConnected } = useMetamaskWallet();
  const [isLoading, setIsLoading] = useState(false);
  
  const ZERO = new BN(0);
  const avgPrice = shares.gt(ZERO)
    ? parseBN(cost || "0", 6)
        .mul(parseBN("1"))
        .div(shares)
    : ZERO;

  const avgPriceText = avgPriceFormatter(avgPrice);

  const handlePredict = async () => {
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    if (!currRange || currentBins.length === 0) {
      alert('Please select a price range');
      return;
    }

    if (!cost || parseFloat(cost) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      // Mock prediction logic - in real app, this would call smart contract
      console.log('Placing prediction:', {
        range: currRange,
        amount: cost,
        bins: currentBins,
        date: selectedDate
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      await refreshMap();
      alert('Prediction placed successfully!');
    } catch (error) {
      console.error('Prediction failed:', error);
      alert('Failed to place prediction');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
  };

  return (
    <div className="rounded-xl border border-neutral-200 p-5">
      <div>
        <p className="text-neutral-500 font-medium">Prediction</p>
        <div className="flex justify-between mb-5">
          {currRange ? (
            <div className="font-bold text-xl">
              <p className="underline">
                {dollarFormatter(currRange[0])} ~{" "}
                {dollarFormatter(currRange[1])}
              </p>
              <p>
                on{" "}
                <u>
                  {selectedDate.getDate()}{" "}
                  {selectedDate.toLocaleString("en-US", { month: "short" })}{" "}
                  {selectedDate.getFullYear()}
                </u>
              </p>
            </div>
          ) : (
            <p className="font-bold text-xl">Select your Prediction</p>
          )}
        </div>

        <hr className="border-neutral-200" />

        <div className="flex justify-between my-5">
          <p className="text-neutral-500 font-medium">avg price</p>
          <p className="text-neutral-900 text-xl font-bold">
            {isTicketLoading ? `...` : avgPriceText}
          </p>
        </div>

        <hr className="border-neutral-200" />

        {/* Amount Input */}
        <div className="my-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-neutral-500 font-medium">Amount</p>
            <p className="text-sm text-neutral-400">
              Balance: {formatBalance(balance)} ETH
            </p>
          </div>
          <div className="relative">
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
              min="0"
              step="0.01"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-500 font-medium">
              ETH
            </span>
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="flex gap-2 mt-3">
            {[0.01, 0.1, 0.5, 1].map((amount) => (
              <button
                key={amount}
                onClick={() => setCost(amount.toString())}
                className="chip hover:bg-neutral-100 transition-colors"
              >
                {amount} ETH
              </button>
            ))}
          </div>
        </div>

        <hr className="border-neutral-200" />

        {/* To Win */}
        <div className="flex justify-between my-5">
          <p className="text-neutral-500 font-medium">to win</p>
          <div className="text-right">
            <p className="text-neutral-900 text-xl font-bold">
              {isTicketLoading ? '...' : formatBN(shares)} shares
            </p>
            <p className="text-sm text-neutral-500">
              ≈ ${(parseFloat(cost || '0') * 2000).toFixed(2)} potential
            </p>
          </div>
        </div>
      </div>

      {/* Predict Button */}
      <button
        onClick={handlePredict}
        className={cn(
          isLoading || !isConnected ? "btn-secondary" : "btn-primary",
          "w-full"
        )}
        disabled={isLoading}
      >
        {isLoading ? (
          'Placing Prediction...'
        ) : !isConnected ? (
          'Connect Wallet to Predict'
        ) : (
          'Place Prediction'
        )}
      </button>
    </div>
  );
}
