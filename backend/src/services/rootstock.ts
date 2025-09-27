import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { MarketData, MarketAnalytics, PositionData, SettlementData } from '../types/market';

export class RootstockService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private marketContract: ethers.Contract;
  private positionContract: ethers.Contract;

  constructor() {
    // Initialize Rootstock provider
    this.provider = new ethers.JsonRpcProvider(
      process.env.ROOTSTOCK_RPC_URL || 'https://public-node.testnet.rsk.co'
    );

    // Initialize wallet if private key is provided
    if (process.env.CONTRACT_DEPLOYER_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(
        process.env.CONTRACT_DEPLOYER_PRIVATE_KEY,
        this.provider
      );
    }

    // Initialize contracts (addresses will be set after deployment)
    this.marketContract = new ethers.Contract(
      process.env.CLMSR_MARKET_CORE_ADDRESS || '',
      this.getMarketABI(),
      this.wallet || this.provider
    );

    this.positionContract = new ethers.Contract(
      process.env.CLMSR_POSITION_ADDRESS || '',
      this.getPositionABI(),
      this.wallet || this.provider
    );
  }

  // =============================================================================
  // MARKET DATA METHODS
  // =============================================================================

  /**
   * Get market data from Rootstock
   */
  async getMarketData(marketId: string): Promise<MarketData> {
    try {
      logger.info('Fetching market data from Rootstock', { marketId });

      const market = await this.marketContract.getMarket(marketId);
      
      return {
        marketId: market.marketId.toString(),
        isActive: market.isActive,
        isSettled: market.isSettled,
        minTick: market.minTick.toString(),
        maxTick: market.maxTick.toString(),
        tickSpacing: market.tickSpacing.toString(),
        startTimestamp: market.startTimestamp.toString(),
        endTimestamp: market.endTimestamp.toString(),
        settlementTick: market.settlementTick?.toString(),
        liquidityParameter: market.liquidityParameter.toString(),
        totalLiquidity: market.totalLiquidity.toString(),
        totalVolume: market.totalVolume.toString(),
        totalTrades: market.totalTrades.toString(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching market data from Rootstock:', error);
      throw new Error('Failed to fetch market data from Rootstock');
    }
  }

  /**
   * Get market analytics from Rootstock
   */
  async getMarketAnalytics(marketId: string): Promise<MarketAnalytics> {
    try {
      logger.info('Fetching market analytics from Rootstock', { marketId });

      // Get market statistics
      const stats = await this.marketContract.getMarketStats(marketId);
      
      // Get price data
      const priceData = await this.marketContract.getMarketPriceData(marketId);
      
      // Get volume data
      const volumeData = await this.marketContract.getMarketVolumeData(marketId);

      return {
        marketId,
        totalVolume: stats.totalVolume.toString(),
        totalTrades: stats.totalTrades.toString(),
        averagePrice: priceData.averagePrice.toString(),
        highestPrice: priceData.highestPrice.toString(),
        lowestPrice: priceData.lowestPrice.toString(),
        priceChange24h: priceData.priceChange24h.toString(),
        volume24h: volumeData.volume24h.toString(),
        volume7d: volumeData.volume7d.toString(),
        volume30d: volumeData.volume30d.toString(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching market analytics from Rootstock:', error);
      throw new Error('Failed to fetch market analytics from Rootstock');
    }
  }

  /**
   * Get position data from Rootstock
   */
  async getPositionData(positionId: string): Promise<PositionData> {
    try {
      logger.info('Fetching position data from Rootstock', { positionId });

      const position = await this.positionContract.getPosition(positionId);
      
      return {
        positionId: position.positionId.toString(),
        user: position.user,
        marketId: position.marketId.toString(),
        lowerTick: position.lowerTick.toString(),
        upperTick: position.upperTick.toString(),
        quantity: position.quantity.toString(),
        costBasis: position.costBasis.toString(),
        outcome: position.outcome,
        isClaimed: position.isClaimed,
        createdAt: position.createdAt.toString(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching position data from Rootstock:', error);
      throw new Error('Failed to fetch position data from Rootstock');
    }
  }

  // =============================================================================
  // MARKET OPERATIONS
  // =============================================================================

  /**
   * Settle a market
   */
  async settleMarket(marketId: string, settlementData: SettlementData): Promise<any> {
    try {
      logger.info('Settling market on Rootstock', { marketId, settlementData });

      if (!this.wallet) {
        throw new Error('Wallet not initialized for market settlement');
      }

      const tx = await this.marketContract.settleMarket(
        marketId,
        settlementData.settlementTick,
        settlementData.settlementValue
      );

      const receipt = await tx.wait();
      
      logger.info('Market settled successfully', {
        marketId,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error settling market on Rootstock:', error);
      throw new Error('Failed to settle market on Rootstock');
    }
  }

  /**
   * Create a new market
   */
  async createMarket(marketData: any): Promise<any> {
    try {
      logger.info('Creating market on Rootstock', { marketData });

      if (!this.wallet) {
        throw new Error('Wallet not initialized for market creation');
      }

      const tx = await this.marketContract.createMarket(
        marketData.minTick,
        marketData.maxTick,
        marketData.tickSpacing,
        marketData.startTimestamp,
        marketData.endTimestamp,
        marketData.liquidityParameter
      );

      const receipt = await tx.wait();
      
      logger.info('Market created successfully', {
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error creating market on Rootstock:', error);
      throw new Error('Failed to create market on Rootstock');
    }
  }

  // =============================================================================
  // POSITION OPERATIONS
  // =============================================================================

  /**
   * Open a new position
   */
  async openPosition(positionData: any): Promise<any> {
    try {
      logger.info('Opening position on Rootstock', { positionData });

      if (!this.wallet) {
        throw new Error('Wallet not initialized for position opening');
      }

      const tx = await this.marketContract.openPosition(
        positionData.user,
        positionData.marketId,
        positionData.lowerTick,
        positionData.upperTick,
        positionData.quantity,
        positionData.maxCost
      );

      const receipt = await tx.wait();
      
      logger.info('Position opened successfully', {
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error opening position on Rootstock:', error);
      throw new Error('Failed to open position on Rootstock');
    }
  }

  /**
   * Close a position
   */
  async closePosition(positionId: string): Promise<any> {
    try {
      logger.info('Closing position on Rootstock', { positionId });

      if (!this.wallet) {
        throw new Error('Wallet not initialized for position closing');
      }

      const tx = await this.marketContract.closePosition(positionId);
      const receipt = await tx.wait();
      
      logger.info('Position closed successfully', {
        positionId,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error closing position on Rootstock:', error);
      throw new Error('Failed to close position on Rootstock');
    }
  }

  /**
   * Claim position rewards
   */
  async claimPositionRewards(positionId: string): Promise<any> {
    try {
      logger.info('Claiming position rewards on Rootstock', { positionId });

      if (!this.wallet) {
        throw new Error('Wallet not initialized for claiming rewards');
      }

      const tx = await this.positionContract.claimRewards(positionId);
      const receipt = await tx.wait();
      
      logger.info('Position rewards claimed successfully', {
        positionId,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error claiming position rewards on Rootstock:', error);
      throw new Error('Failed to claim position rewards on Rootstock');
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get current block number
   */
  async getCurrentBlockNumber(): Promise<number> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      return blockNumber;
    } catch (error) {
      logger.error('Error getting current block number:', error);
      throw new Error('Failed to get current block number');
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<any> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting network information:', error);
      throw new Error('Failed to get network information');
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Get market contract ABI
   */
  private getMarketABI(): any[] {
    return [
      // Market creation
      {
        "inputs": [
          {"internalType": "uint256", "name": "startTimestamp", "type": "uint256"},
          {"internalType": "uint256", "name": "endTimestamp", "type": "uint256"},
          {"internalType": "uint256", "name": "liquidityParameter", "type": "uint256"},
          {"internalType": "address", "name": "paymentToken", "type": "address"},
          {"internalType": "uint256", "name": "lowerTick", "type": "uint256"},
          {"internalType": "uint256", "name": "upperTick", "type": "uint256"},
          {"internalType": "uint256", "name": "tickSpacing", "type": "uint256"}
        ],
        "name": "createMarket",
        "outputs": [{"internalType": "uint256", "name": "marketId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      // Position operations
      {
        "inputs": [
          {"internalType": "uint256", "name": "marketId", "type": "uint256"},
          {"internalType": "uint256", "name": "lowerTick", "type": "uint256"},
          {"internalType": "uint256", "name": "upperTick", "type": "uint256"},
          {"internalType": "uint256", "name": "quantity", "type": "uint256"}
        ],
        "name": "openPosition",
        "outputs": [{"internalType": "uint256", "name": "positionId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "positionId", "type": "uint256"}],
        "name": "closePosition",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "uint256", "name": "marketId", "type": "uint256"},
          {"internalType": "uint256", "name": "settlementValue", "type": "uint256"}
        ],
        "name": "settleMarket",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      // View functions
      {
        "inputs": [{"internalType": "uint256", "name": "marketId", "type": "uint256"}],
        "name": "getMarket",
        "outputs": [
          {
            "components": [
              {"internalType": "uint256", "name": "marketId", "type": "uint256"},
              {"internalType": "uint256", "name": "startTimestamp", "type": "uint256"},
              {"internalType": "uint256", "name": "endTimestamp", "type": "uint256"},
              {"internalType": "uint256", "name": "settlementValue", "type": "uint256"},
              {"internalType": "bool", "name": "isActive", "type": "bool"},
              {"internalType": "bool", "name": "isSettled", "type": "bool"},
              {"internalType": "uint256", "name": "liquidityParameter", "type": "uint256"},
              {"internalType": "address", "name": "paymentToken", "type": "address"},
              {"internalType": "uint256", "name": "lowerTick", "type": "uint256"},
              {"internalType": "uint256", "name": "upperTick", "type": "uint256"},
              {"internalType": "uint256", "name": "tickSpacing", "type": "uint256"}
            ],
            "internalType": "struct ICLMSRMarketCore.Market",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "positionId", "type": "uint256"}],
        "name": "getPosition",
        "outputs": [
          {
            "components": [
              {"internalType": "uint256", "name": "positionId", "type": "uint256"},
              {"internalType": "address", "name": "owner", "type": "address"},
              {"internalType": "uint256", "name": "marketId", "type": "uint256"},
              {"internalType": "uint256", "name": "lowerTick", "type": "uint256"},
              {"internalType": "uint256", "name": "upperTick", "type": "uint256"},
              {"internalType": "uint256", "name": "quantity", "type": "uint256"},
              {"internalType": "uint256", "name": "costBasis", "type": "uint256"},
              {"internalType": "bool", "name": "isActive", "type": "bool"}
            ],
            "internalType": "struct ICLMSRMarketCore.Position",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      // Events
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "uint256", "name": "marketId", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "startTimestamp", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "endTimestamp", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "liquidityParameter", "type": "uint256"},
          {"indexed": false, "internalType": "address", "name": "paymentToken", "type": "address"},
          {"indexed": false, "internalType": "uint256", "name": "lowerTick", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "upperTick", "type": "uint256"}
        ],
        "name": "MarketCreated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "uint256", "name": "positionId", "type": "uint256"},
          {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
          {"indexed": true, "internalType": "uint256", "name": "marketId", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "lowerTick", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "upperTick", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "cost", "type": "uint256"}
        ],
        "name": "PositionOpened",
        "type": "event"
      }
    ];
  }

  /**
   * Get position contract ABI
   */
  private getPositionABI(): any[] {
    return [
      // Position operations
      {
        "inputs": [{"internalType": "uint256", "name": "positionId", "type": "uint256"}],
        "name": "claimRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "positionId", "type": "uint256"}],
        "name": "getPosition",
        "outputs": [
          {
            "components": [
              {"internalType": "uint256", "name": "positionId", "type": "uint256"},
              {"internalType": "address", "name": "owner", "type": "address"},
              {"internalType": "uint256", "name": "marketId", "type": "uint256"},
              {"internalType": "uint256", "name": "lowerTick", "type": "uint256"},
              {"internalType": "uint256", "name": "upperTick", "type": "uint256"},
              {"internalType": "uint256", "name": "quantity", "type": "uint256"},
              {"internalType": "uint256", "name": "costBasis", "type": "uint256"},
              {"internalType": "bool", "name": "isActive", "type": "bool"},
              {"internalType": "bool", "name": "isClaimed", "type": "bool"}
            ],
            "internalType": "struct ICLMSRPosition.Position",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      // Events
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "uint256", "name": "positionId", "type": "uint256"},
          {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
          {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "Claimed",
        "type": "event"
      }
    ];
  }
}
