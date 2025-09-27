import { TheGraphService } from './thegraph';
import { RootstockService } from './rootstock';
import { logger } from '../utils/logger';
import { PositionData } from '../types/market';

export class PositionService {
  private theGraphService: TheGraphService;
  private rootstockService: RootstockService;

  constructor() {
    this.theGraphService = new TheGraphService();
    this.rootstockService = new RootstockService();
  }

  // =============================================================================
  // POSITION MANAGEMENT
  // =============================================================================

  /**
   * Get position by ID with combined data
   */
  async getPositionById(positionId: string): Promise<any> {
    try {
      logger.info('Getting position by ID', { positionId });

      // Get position data from Rootstock
      const rootstockData = await this.rootstockService.getPositionData(positionId);

      // Get additional data from The Graph
      const userPositions = await this.theGraphService.getUserPositions(rootstockData.user, {
        page: 1,
        limit: 1000
      });

      const graphPosition = userPositions.find((pos: any) => pos.positionId === positionId);

      // Combine data
      const combinedPosition = {
        ...rootstockData,
        ...graphPosition,
        lastUpdated: new Date().toISOString()
      };

      return combinedPosition;
    } catch (error) {
      logger.error('Error getting position by ID:', error);
      throw error;
    }
  }

  /**
   * Get user positions with filtering and pagination
   */
  async getUserPositions(userAddress: string, options: {
    page: number;
    limit: number;
    status?: string;
    marketId?: string;
  }): Promise<any[]> {
    try {
      logger.info('Getting user positions', { userAddress, options });

      // Get positions from The Graph
      const positions = await this.theGraphService.getUserPositions(userAddress, {
        page: options.page,
        limit: options.limit,
        status: options.status
      });

      // Filter by market if specified
      let filteredPositions = positions;
      if (options.marketId) {
        filteredPositions = positions.filter((pos: any) => pos.market === options.marketId);
      }

      // Enrich with Rootstock data for each position
      const enrichedPositions = await Promise.all(
        filteredPositions.map(async (position: any) => {
          try {
            const rootstockData = await this.rootstockService.getPositionData(position.positionId);
            return {
              ...position,
              ...rootstockData,
              lastUpdated: new Date().toISOString()
            };
          } catch (error) {
            logger.error(`Error enriching position ${position.positionId}:`, error);
            return position;
          }
        })
      );

      return enrichedPositions;
    } catch (error) {
      logger.error('Error getting user positions:', error);
      throw error;
    }
  }

  /**
   * Get all positions with filtering
   */
  async getAllPositions(options: {
    page: number;
    limit: number;
    user?: string;
    market?: string;
    status?: string;
  }): Promise<any[]> {
    try {
      logger.info('Getting all positions', { options });

      // Get all markets to extract positions
      const markets = await this.theGraphService.getMarkets({
        page: 1,
        limit: 1000
      });

      // Extract all positions
      const allPositions = markets.flatMap((market: any) => 
        (market.positions || []).map((position: any) => ({
          ...position,
          marketId: market.marketId
        }))
      );

      // Apply filters
      let filteredPositions = allPositions;

      if (options.user) {
        filteredPositions = filteredPositions.filter((pos: any) => 
          pos.user.toLowerCase() === options.user!.toLowerCase()
        );
      }

      if (options.market) {
        filteredPositions = filteredPositions.filter((pos: any) => 
          pos.market === options.market
        );
      }

      if (options.status) {
        if (options.status === 'open') {
          filteredPositions = filteredPositions.filter((pos: any) => pos.outcome === 'OPEN');
        } else if (options.status === 'won') {
          filteredPositions = filteredPositions.filter((pos: any) => pos.outcome === 'WIN');
        } else if (options.status === 'lost') {
          filteredPositions = filteredPositions.filter((pos: any) => pos.outcome === 'LOSS');
        }
      }

      // Apply pagination
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedPositions = filteredPositions.slice(startIndex, endIndex);

      // Enrich with Rootstock data
      const enrichedPositions = await Promise.all(
        paginatedPositions.map(async (position: any) => {
          try {
            const rootstockData = await this.rootstockService.getPositionData(position.positionId);
            return {
              ...position,
              ...rootstockData,
              lastUpdated: new Date().toISOString()
            };
          } catch (error) {
            logger.error(`Error enriching position ${position.positionId}:`, error);
            return position;
          }
        })
      );

      return enrichedPositions;
    } catch (error) {
      logger.error('Error getting all positions:', error);
      throw error;
    }
  }

  // =============================================================================
  // POSITION OPERATIONS
  // =============================================================================

  /**
   * Open a new position
   */
  async openPosition(positionData: {
    user: string;
    marketId: string;
    lowerTick: number;
    upperTick: number;
    quantity: string;
    maxCost: string;
  }): Promise<any> {
    try {
      logger.info('Opening position', { positionData });

      // Validate position data
      this.validatePositionData(positionData);

      // Open position on Rootstock
      const result = await this.rootstockService.openPosition(positionData);

      return result;
    } catch (error) {
      logger.error('Error opening position:', error);
      throw error;
    }
  }

  /**
   * Close a position
   */
  async closePosition(positionId: string): Promise<any> {
    try {
      logger.info('Closing position', { positionId });

      // Close position on Rootstock
      const result = await this.rootstockService.closePosition(positionId);

      return result;
    } catch (error) {
      logger.error('Error closing position:', error);
      throw error;
    }
  }

  /**
   * Claim position rewards
   */
  async claimPositionRewards(positionId: string): Promise<any> {
    try {
      logger.info('Claiming position rewards', { positionId });

      // Claim rewards on Rootstock
      const result = await this.rootstockService.claimPositionRewards(positionId);

      return result;
    } catch (error) {
      logger.error('Error claiming position rewards:', error);
      throw error;
    }
  }

  // =============================================================================
  // POSITION ANALYTICS
  // =============================================================================

  /**
   * Get position statistics
   */
  async getPositionStats(positionId: string): Promise<any> {
    try {
      logger.info('Getting position statistics', { positionId });

      const position = await this.getPositionById(positionId);

      // Calculate position metrics
      const costBasis = parseFloat(position.costBasis || '0');
      const quantity = parseFloat(position.quantity || '0');
      const currentValue = position.outcome === 'WIN' ? quantity : 0;
      const pnl = currentValue - costBasis;
      const pnlPercentage = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      const stats = {
        positionId,
        basic: {
          user: position.user,
          marketId: position.marketId,
          lowerTick: position.lowerTick,
          upperTick: position.upperTick,
          outcome: position.outcome,
          isClaimed: position.isClaimed
        },
        financial: {
          quantity,
          costBasis,
          currentValue,
          pnl,
          pnlPercentage
        },
        timing: {
          createdAt: position.createdAt,
          duration: position.endTimestamp ? 
            parseInt(position.endTimestamp) - parseInt(position.createdAt) : null
        },
        lastUpdated: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      logger.error('Error getting position statistics:', error);
      throw error;
    }
  }

  /**
   * Get user position summary
   */
  async getUserPositionSummary(userAddress: string): Promise<any> {
    try {
      logger.info('Getting user position summary', { userAddress });

      // Get all user positions
      const positions = await this.getUserPositions(userAddress, {
        page: 1,
        limit: 1000
      });

      // Calculate summary metrics
      const totalPositions = positions.length;
      const openPositions = positions.filter((pos: any) => pos.outcome === 'OPEN').length;
      const wonPositions = positions.filter((pos: any) => pos.outcome === 'WIN').length;
      const lostPositions = positions.filter((pos: any) => pos.outcome === 'LOSS').length;

      const totalInvested = positions.reduce((sum: number, pos: any) => 
        sum + parseFloat(pos.costBasis || '0'), 0
      );

      const totalWon = positions
        .filter((pos: any) => pos.outcome === 'WIN')
        .reduce((sum: number, pos: any) => sum + parseFloat(pos.quantity || '0'), 0);

      const totalPnL = totalWon - totalInvested;
      const winRate = (wonPositions + lostPositions) > 0 ? 
        (wonPositions / (wonPositions + lostPositions)) * 100 : 0;

      const averagePositionSize = totalPositions > 0 ? totalInvested / totalPositions : 0;

      // Calculate market distribution
      const marketDistribution = positions.reduce((acc: any, pos: any) => {
        if (!acc[pos.marketId]) {
          acc[pos.marketId] = { count: 0, totalValue: 0 };
        }
        acc[pos.marketId].count += 1;
        acc[pos.marketId].totalValue += parseFloat(pos.costBasis || '0');
        return acc;
      }, {});

      const summary = {
        user: userAddress,
        positions: {
          total: totalPositions,
          open: openPositions,
          won: wonPositions,
          lost: lostPositions
        },
        financial: {
          totalInvested,
          totalWon,
          totalPnL,
          winRate,
          averagePositionSize
        },
        distribution: {
          markets: Object.keys(marketDistribution).length,
          marketBreakdown: marketDistribution
        },
        lastUpdated: new Date().toISOString()
      };

      return summary;
    } catch (error) {
      logger.error('Error getting user position summary:', error);
      throw error;
    }
  }

  // =============================================================================
  // POSITION VALIDATION
  // =============================================================================

  /**
   * Validate position data
   */
  private validatePositionData(positionData: {
    user: string;
    marketId: string;
    lowerTick: number;
    upperTick: number;
    quantity: string;
    maxCost: string;
  }): void {
    // Validate user address
    if (!positionData.user || !/^0x[a-fA-F0-9]{40}$/.test(positionData.user)) {
      throw new Error('Invalid user address format');
    }

    // Validate market ID
    if (!positionData.marketId) {
      throw new Error('Market ID is required');
    }

    // Validate tick range
    if (positionData.lowerTick >= positionData.upperTick) {
      throw new Error('Lower tick must be less than upper tick');
    }

    // Validate quantity
    if (!positionData.quantity || parseFloat(positionData.quantity) <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Validate max cost
    if (!positionData.maxCost || parseFloat(positionData.maxCost) <= 0) {
      throw new Error('Max cost must be greater than 0');
    }
  }

  /**
   * Check if position can be closed
   */
  async canClosePosition(positionId: string): Promise<boolean> {
    try {
      const position = await this.getPositionById(positionId);
      
      // Check if position exists and is not already closed
      if (!position || position.outcome !== 'OPEN') {
        return false;
      }

      // Check if market is still active
      const market = await this.rootstockService.getMarketData(position.marketId);
      if (!market.isActive || market.isSettled) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error checking if position can be closed:', error);
      return false;
    }
  }

  /**
   * Check if position rewards can be claimed
   */
  async canClaimRewards(positionId: string): Promise<boolean> {
    try {
      const position = await this.getPositionById(positionId);
      
      // Check if position exists and has won
      if (!position || position.outcome !== 'WIN' || position.isClaimed) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error checking if position rewards can be claimed:', error);
      return false;
    }
  }
}
