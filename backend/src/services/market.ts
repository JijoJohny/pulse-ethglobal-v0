import { TheGraphService } from './thegraph';
import { RootstockService } from './rootstock';
import { logger } from '../utils/logger';
import { MarketData, MarketAnalytics } from '../types/market';

export class MarketService {
  private theGraphService: TheGraphService;
  private rootstockService: RootstockService;

  constructor() {
    this.theGraphService = new TheGraphService();
    this.rootstockService = new RootstockService();
  }

  // =============================================================================
  // MARKET MANAGEMENT
  // =============================================================================

  /**
   * Get market by ID with combined data from The Graph and Rootstock
   */
  async getMarketById(marketId: string): Promise<any> {
    try {
      logger.info('Getting market by ID', { marketId });

      // Get market data from The Graph
      const graphMarket = await this.theGraphService.getMarket(marketId);
      
      if (!graphMarket) {
        throw new Error('Market not found');
      }

      // Get additional data from Rootstock
      const rootstockData = await this.rootstockService.getMarketData(marketId);

      // Combine data
      const combinedMarket = {
        ...graphMarket,
        ...rootstockData,
        lastUpdated: new Date().toISOString()
      };

      return combinedMarket;
    } catch (error) {
      logger.error('Error getting market by ID:', error);
      throw error;
    }
  }

  /**
   * Get all markets with filtering and pagination
   */
  async getMarkets(options: {
    page: number;
    limit: number;
    status?: string;
    network?: string;
  }): Promise<any[]> {
    try {
      logger.info('Getting markets', { options });

      // Get markets from The Graph
      const markets = await this.theGraphService.getMarkets(options);

      // Enrich with Rootstock data for each market
      const enrichedMarkets = await Promise.all(
        markets.map(async (market: any) => {
          try {
            const rootstockData = await this.rootstockService.getMarketData(market.marketId);
            return {
              ...market,
              ...rootstockData,
              lastUpdated: new Date().toISOString()
            };
          } catch (error) {
            logger.error(`Error enriching market ${market.marketId}:`, error);
            return market;
          }
        })
      );

      return enrichedMarkets;
    } catch (error) {
      logger.error('Error getting markets:', error);
      throw error;
    }
  }

  /**
   * Get market analytics with combined data
   */
  async getMarketAnalytics(marketId: string, timeframe: string): Promise<any> {
    try {
      logger.info('Getting market analytics', { marketId, timeframe });

      // Get analytics from The Graph
      const graphAnalytics = await this.theGraphService.getMarketAnalytics(marketId, timeframe);
      
      // Get analytics from Rootstock
      const rootstockAnalytics = await this.rootstockService.getMarketAnalytics(marketId);

      // Combine analytics
      const combinedAnalytics = {
        ...graphAnalytics,
        ...rootstockAnalytics,
        timeframe,
        lastUpdated: new Date().toISOString()
      };

      return combinedAnalytics;
    } catch (error) {
      logger.error('Error getting market analytics:', error);
      throw error;
    }
  }

  /**
   * Get market positions
   */
  async getMarketPositions(marketId: string, options: {
    page: number;
    limit: number;
    user?: string;
  }): Promise<any[]> {
    try {
      logger.info('Getting market positions', { marketId, options });

      // Get positions from The Graph
      const positions = await this.theGraphService.getMarketPositions(marketId, options);

      // Enrich with Rootstock data for each position
      const enrichedPositions = await Promise.all(
        positions.map(async (position: any) => {
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
      logger.error('Error getting market positions:', error);
      throw error;
    }
  }

  // =============================================================================
  // MARKET OPERATIONS
  // =============================================================================

  /**
   * Create a new market
   */
  async createMarket(marketData: {
    minTick: number;
    maxTick: number;
    tickSpacing: number;
    startTimestamp: number;
    endTimestamp: number;
    liquidityParameter: string;
  }): Promise<any> {
    try {
      logger.info('Creating market', { marketData });

      // Create market on Rootstock
      const result = await this.rootstockService.createMarket(marketData);

      return result;
    } catch (error) {
      logger.error('Error creating market:', error);
      throw error;
    }
  }

  /**
   * Settle a market
   */
  async settleMarket(marketId: string, settlementData: {
    settlementTick?: number;
    settlementValue?: string;
  }): Promise<any> {
    try {
      logger.info('Settling market', { marketId, settlementData });

      // Settle market on Rootstock
      const result = await this.rootstockService.settleMarket(marketId, settlementData);

      return result;
    } catch (error) {
      logger.error('Error settling market:', error);
      throw error;
    }
  }

  /**
   * Update market status
   */
  async updateMarketStatus(marketId: string, status: 'active' | 'inactive' | 'settled'): Promise<any> {
    try {
      logger.info('Updating market status', { marketId, status });

      // This would typically involve calling a smart contract method
      // For now, returning a placeholder response
      return {
        success: true,
        marketId,
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error updating market status:', error);
      throw error;
    }
  }

  // =============================================================================
  // MARKET STATISTICS
  // =============================================================================

  /**
   * Get market statistics
   */
  async getMarketStats(marketId: string): Promise<any> {
    try {
      logger.info('Getting market statistics', { marketId });

      const [market, analytics, positions] = await Promise.all([
        this.getMarketById(marketId),
        this.getMarketAnalytics(marketId, '24h'),
        this.getMarketPositions(marketId, { page: 1, limit: 1000 })
      ]);

      const stats = {
        marketId,
        basic: {
          isActive: market.isActive,
          isSettled: market.isSettled,
          startTimestamp: market.startTimestamp,
          endTimestamp: market.endTimestamp,
          settlementTick: market.settlementTick
        },
        volume: {
          totalVolume: market.totalVolume,
          totalLiquidity: market.totalLiquidity,
          totalTrades: market.totalTrades
        },
        positions: {
          total: positions.length,
          open: positions.filter((pos: any) => pos.outcome === 'OPEN').length,
          won: positions.filter((pos: any) => pos.outcome === 'WIN').length,
          lost: positions.filter((pos: any) => pos.outcome === 'LOSS').length
        },
        analytics: {
          winRate: analytics.winRate,
          averagePositionSize: analytics.averagePositionSize,
          averagePrice: analytics.averagePrice
        },
        lastUpdated: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      logger.error('Error getting market statistics:', error);
      throw error;
    }
  }

  /**
   * Get market price history
   */
  async getMarketPriceHistory(marketId: string, timeframe: string = '24h'): Promise<any[]> {
    try {
      logger.info('Getting market price history', { marketId, timeframe });

      // Get market data
      const market = await this.getMarketById(marketId);
      
      // Get positions for price calculation
      const positions = await this.getMarketPositions(marketId, { page: 1, limit: 1000 });

      // Calculate price history (simplified implementation)
      const priceHistory = this.calculatePriceHistory(positions, timeframe);

      return priceHistory;
    } catch (error) {
      logger.error('Error getting market price history:', error);
      throw error;
    }
  }

  /**
   * Get market liquidity distribution
   */
  async getMarketLiquidityDistribution(marketId: string): Promise<any> {
    try {
      logger.info('Getting market liquidity distribution', { marketId });

      // Get market positions
      const positions = await this.getMarketPositions(marketId, { page: 1, limit: 1000 });

      // Calculate liquidity distribution
      const distribution = this.calculateLiquidityDistribution(positions);

      return distribution;
    } catch (error) {
      logger.error('Error getting market liquidity distribution:', error);
      throw error;
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Calculate price history from positions
   */
  private calculatePriceHistory(positions: any[], timeframe: string): any[] {
    // This is a simplified implementation
    // In a real scenario, you'd want to use actual trade data
    
    const history = [];
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Calculate average price for this day (simplified)
      const dayPositions = positions.filter((pos: any) => {
        const posDate = new Date(parseInt(pos.createdAt) * 1000);
        return posDate.toDateString() === date.toDateString();
      });
      
      const averagePrice = dayPositions.length > 0 
        ? dayPositions.reduce((sum: number, pos: any) => sum + parseFloat(pos.costBasis || '0') / parseFloat(pos.quantity || '1'), 0) / dayPositions.length
        : 0;
      
      history.push({
        timestamp: date.toISOString(),
        price: averagePrice,
        volume: dayPositions.reduce((sum: number, pos: any) => sum + parseFloat(pos.quantity || '0'), 0)
      });
    }
    
    return history;
  }

  /**
   * Calculate liquidity distribution across tick ranges
   */
  private calculateLiquidityDistribution(positions: any[]): any {
    const distribution: any = {};
    
    positions.forEach((position: any) => {
      const lowerTick = parseInt(position.lowerTick);
      const upperTick = parseInt(position.upperTick);
      const quantity = parseFloat(position.quantity || '0');
      
      for (let tick = lowerTick; tick <= upperTick; tick += 100) { // Assuming 100 tick spacing
        if (!distribution[tick]) {
          distribution[tick] = 0;
        }
        distribution[tick] += quantity;
      }
    });
    
    return {
      distribution,
      totalLiquidity: Object.values(distribution).reduce((sum: number, val: any) => sum + val, 0),
      lastUpdated: new Date().toISOString()
    };
  }
}
