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
        <div className="py-5">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-neutral-500 font-medium">Amount</span>
              <p className="text-neutral-500 text-xs mt-1">Your confidence 🙌</p>
            </div>
            <div>
              <div className="inline-flex items-center text-xl font-bold">
                <input
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="outline-none text-right"
                  placeholder="$0"
                />
                <p className="ml-1">USDC</p>
              </div>

              <p className="text-neutral-500 text-xs text-right">
                Balance: {formatBalance(balance)}
              </p>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setCost((parseFloat(cost || '0') + 1).toString())} className="chip">
              +$1
            </button>
            <button onClick={() => setCost((parseFloat(cost || '0') + 3).toString())} className="chip">
              +$3
            </button>
            <button onClick={() => setCost((parseFloat(cost || '0') + 5).toString())} className="chip">
              +$5
            </button>
            <button onClick={() => setCost(balance.toString())} className="chip">
              Max
            </button>
          </div>
        </div>

        <hr className="border-neutral-200" />

        {/* To Win */}
        <div className="flex justify-between my-5">
          <p className="text-neutral-500 font-medium">To Win</p>
          <div className="text-right">
            <p className="text-success text-2xl font-bold">
              ${(parseFloat(cost || '0') * 158.75).toFixed(2)}
            </p>
            <p className="text-sm text-neutral-500">
              Avg {avgPriceText}
            </p>
          </div>
        </div>
      </div>

      {/* Predict Button */}
      <button
        onClick={handlePredict}
        className={cn(
          !isConnected ? "btn-primary" : "btn-primary",
          "w-full"
        )}
        disabled={isLoading}
      >
        {isLoading ? (
          'Placing Bet...'
        ) : !isConnected ? (
          'Connect Wallet'
        ) : (
          'Log in to Bet'
        )}
      </button>
    </div>
  );
}
