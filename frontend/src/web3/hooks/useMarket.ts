import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useRootstockWallet } from '../provider';
import { useContract } from './useContract';
import toast from 'react-hot-toast';

interface MarketData {
  id: string;
  question: string;
  endTime: number;
  isSettled: boolean;
  outcomes: string[];
  totalVolume: string;
  totalTrades: number;
  activeUsers: number;
}

interface PositionData {
  bins: number[];
  amount: string;
  cost: string;
  potentialWinnings: string;
}

export function useMarket() {
  const { isConnected, account } = useRootstockWallet();
  const { getMarketContract, sendTransaction, getTokenBalance, approveToken, getTokenAllowance } = useContract();
  const [isLoading, setIsLoading] = useState(false);

  // Get market data
  const getMarketData = useCallback(async (marketId: string, marketAddress: string): Promise<MarketData | null> => {
    try {
      const contract = getMarketContract(marketAddress);
      if (!contract) return null;

      const [marketInfo, stats] = await Promise.all([
        contract.getMarket(marketId),
        contract.getMarketStats(marketId),
      ]);

      return {
        id: marketId,
        question: marketInfo.question,
        endTime: Number(marketInfo.endTime),
        isSettled: marketInfo.isSettled,
        outcomes: marketInfo.outcomes.map((outcome: any) => outcome.toString()),
        totalVolume: ethers.formatEther(stats.totalVolume),
        totalTrades: Number(stats.totalTrades),
        activeUsers: Number(stats.activeUsers),
      };
    } catch (error) {
      console.error('Error getting market data:', error);
      toast.error('Failed to get market data');
      return null;
    }
  }, [getMarketContract]);

  // Get user positions for a market
  const getUserPositions = useCallback(async (marketId: string, marketAddress: string): Promise<PositionData[]> => {
    try {
      const contract = getMarketContract(marketAddress);
      if (!contract || !account) return [];

      const positions = await contract.getUserPositions(account, marketId);
      
      // Convert positions to readable format
      return positions.map((position: any) => ({
        bins: position.bins.map((bin: any) => Number(bin)),
        amount: ethers.formatEther(position.amount),
        cost: ethers.formatEther(position.cost),
        potentialWinnings: ethers.formatEther(position.potentialWinnings),
      }));
    } catch (error) {
      console.error('Error getting user positions:', error);
      return [];
    }
  }, [getMarketContract, account]);

  // Open a position in a market
  const openPosition = useCallback(async (
    marketId: string,
    marketAddress: string,
    bins: number[],
    amount: string,
    tokenAddress?: string
  ) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setIsLoading(true);
    
    try {
      const contract = getMarketContract(marketAddress);
      if (!contract) return false;

      const amountWei = ethers.parseEther(amount);

      // If using a token (not native RBTC), approve spending first
      if (tokenAddress) {
        const allowance = await getTokenAllowance(tokenAddress, marketAddress);
        const allowanceAmount = allowance ? parseFloat(allowance) : 0;
        const requiredAmount = parseFloat(amount);

        if (allowanceAmount < requiredAmount) {
          const approved = await approveToken(tokenAddress, marketAddress, amount);
          if (!approved) return false;
        }
      }

      // Open position
      await sendTransaction(
        () => contract.openPosition(marketId, bins, amountWei),
        'Position opened successfully!',
        'Opening position...'
      );

      return true;
    } catch (error) {
      console.error('Error opening position:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, getMarketContract, getTokenAllowance, approveToken, sendTransaction]);

  // Close a position in a market
  const closePosition = useCallback(async (
    marketId: string,
    marketAddress: string,
    bins: number[],
    amount: string
  ) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setIsLoading(true);
    
    try {
      const contract = getMarketContract(marketAddress);
      if (!contract) return false;

      const amountWei = ethers.parseEther(amount);

      await sendTransaction(
        () => contract.closePosition(marketId, bins, amountWei),
        'Position closed successfully!',
        'Closing position...'
      );

      return true;
    } catch (error) {
      console.error('Error closing position:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, getMarketContract, sendTransaction]);

  // Claim winnings from a settled market
  const claimWinnings = useCallback(async (
    marketId: string,
    marketAddress: string,
    bins: number[]
  ) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setIsLoading(true);
    
    try {
      const contract = getMarketContract(marketAddress);
      if (!contract) return false;

      const tx = await sendTransaction(
        () => contract.claim(marketId, bins),
        'Winnings claimed successfully!',
        'Claiming winnings...'
      );

      return tx;
    } catch (error) {
      console.error('Error claiming winnings:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, getMarketContract, sendTransaction]);

  // Calculate position cost (this would typically be done off-chain or via a view function)
  const calculatePositionCost = useCallback(async (
    marketId: string,
    marketAddress: string,
    bins: number[],
    amount: string
  ): Promise<{ cost: string; potentialWinnings: string } | null> => {
    try {
      // This is a simplified calculation
      // In a real implementation, you'd call a view function on the contract
      const amountNum = parseFloat(amount);
      const cost = amountNum * 0.95; // 5% fee
      const potentialWinnings = amountNum * 1.8; // Simplified calculation
      
      return {
        cost: cost.toFixed(6),
        potentialWinnings: potentialWinnings.toFixed(6),
      };
    } catch (error) {
      console.error('Error calculating position cost:', error);
      return null;
    }
  }, []);

  return {
    getMarketData,
    getUserPositions,
    openPosition,
    closePosition,
    claimWinnings,
    calculatePositionCost,
    isLoading,
  };
}
