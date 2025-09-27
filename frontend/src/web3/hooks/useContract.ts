import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useRootstockWallet } from '../provider';
import toast from 'react-hot-toast';

// Common contract ABIs
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

export const MARKET_CORE_ABI = [
  'function createMarket(string memory question, uint256 endTime, uint256[] memory outcomes) returns (uint256)',
  'function openPosition(uint256 marketId, uint256[] memory bins, uint256 amount) returns (bool)',
  'function closePosition(uint256 marketId, uint256[] memory bins, uint256 amount) returns (bool)',
  'function claim(uint256 marketId, uint256[] memory bins) returns (uint256)',
  'function getMarket(uint256 marketId) view returns (tuple(string question, uint256 endTime, bool isSettled, uint256[] outcomes))',
  'function getUserPositions(address user, uint256 marketId) view returns (uint256[] memory)',
  'function getMarketStats(uint256 marketId) view returns (tuple(uint256 totalVolume, uint256 totalTrades, uint256 activeUsers))',
];

export function useContract() {
  const { getProvider, getSigner, getContract, isConnected, account } = useRootstockWallet();

  // Get contract instance
  const getContractInstance = useCallback((address: string, abi: any[]) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return null;
    }
    return getContract(address, abi);
  }, [isConnected, getContract]);

  // Get ERC20 token contract
  const getTokenContract = useCallback((tokenAddress: string) => {
    return getContractInstance(tokenAddress, ERC20_ABI);
  }, [getContractInstance]);

  // Get Market Core contract
  const getMarketContract = useCallback((marketAddress: string) => {
    return getContractInstance(marketAddress, MARKET_CORE_ABI);
  }, [getContractInstance]);

  // Get token balance
  const getTokenBalance = useCallback(async (tokenAddress: string, userAddress?: string) => {
    try {
      const contract = getTokenContract(tokenAddress);
      if (!contract) return null;

      const address = userAddress || account;
      if (!address) return null;

      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting token balance:', error);
      toast.error('Failed to get token balance');
      return null;
    }
  }, [getTokenContract, account]);

  // Approve token spending
  const approveToken = useCallback(async (
    tokenAddress: string, 
    spenderAddress: string, 
    amount: string
  ) => {
    try {
      const contract = getTokenContract(tokenAddress);
      if (!contract) return false;

      const amountWei = ethers.parseEther(amount);
      const tx = await contract.approve(spenderAddress, amountWei);
      
      toast.loading('Approving token...', { id: 'approve-token' });
      await tx.wait();
      
      toast.success('Token approved successfully', { id: 'approve-token' });
      return true;
    } catch (error: any) {
      console.error('Error approving token:', error);
      toast.error(`Failed to approve token: ${error.message}`, { id: 'approve-token' });
      return false;
    }
  }, [getTokenContract]);

  // Check token allowance
  const getTokenAllowance = useCallback(async (
    tokenAddress: string, 
    spenderAddress: string
  ) => {
    try {
      const contract = getTokenContract(tokenAddress);
      if (!contract || !account) return null;

      const allowance = await contract.allowance(account, spenderAddress);
      return ethers.formatEther(allowance);
    } catch (error) {
      console.error('Error getting token allowance:', error);
      return null;
    }
  }, [getTokenContract, account]);

  // Send transaction with error handling
  const sendTransaction = useCallback(async (
    contractMethod: () => Promise<any>,
    successMessage: string,
    loadingMessage: string
  ) => {
    try {
      toast.loading(loadingMessage, { id: 'transaction' });
      
      const tx = await contractMethod();
      await tx.wait();
      
      toast.success(successMessage, { id: 'transaction' });
      return tx;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      toast.error(`Transaction failed: ${error.message}`, { id: 'transaction' });
      throw error;
    }
  }, []);

  // Get network info
  const getNetworkInfo = useCallback(async () => {
    try {
      const provider = getProvider();
      if (!provider) return null;

      const network = await provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name,
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }, [getProvider]);

  return {
    getContractInstance,
    getTokenContract,
    getMarketContract,
    getTokenBalance,
    approveToken,
    getTokenAllowance,
    sendTransaction,
    getNetworkInfo,
  };
}
