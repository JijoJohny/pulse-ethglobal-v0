import { supabase, TABLES, Database } from '../config/supabase';
import { logger } from '../utils/logger';

type MarketAnalyticsRow = Database['public']['Tables']['market_analytics']['Row'];
type MarketAnalyticsInsert = Database['public']['Tables']['market_analytics']['Insert'];
type MarketAnalyticsUpdate = Database['public']['Tables']['market_analytics']['Update'];

type TradeRow = Database['public']['Tables']['trades']['Row'];
type TradeInsert = Database['public']['Tables']['trades']['Insert'];

export class AnalyticsModel {
  private static readonly marketAnalyticsTable = TABLES.MARKET_ANALYTICS;
  private static readonly tradesTable = TABLES.TRADES;

  // =============================================================================
  // MARKET ANALYTICS OPERATIONS
  // =============================================================================

  /**
   * Create or update market analytics
   */
  static async upsertMarketAnalytics(analyticsData: MarketAnalyticsInsert): Promise<MarketAnalyticsRow> {
    try {
      logger.info('Upserting market analytics', { analyticsData });

      const { data, error } = await supabase.getClient()
        .from(this.marketAnalyticsTable)
        .upsert(analyticsData as any, { onConflict: 'market_id,timeframe' })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting market analytics:', error);
        throw new Error(`Failed to upsert market analytics: ${error.message}`);
      }

      logger.info('Market analytics upserted successfully', { id: (data as any)?.id });
      return data;
    } catch (error) {
      logger.error('Error upserting market analytics:', error);
      throw error;
    }
  }

  /**
   * Get market analytics by market ID and timeframe
   */
  static async getMarketAnalytics(marketId: string, timeframe: string): Promise<MarketAnalyticsRow | null> {
    try {
      logger.info('Getting market analytics', { marketId, timeframe });

      const { data, error } = await supabase.getClient()
        .from(this.marketAnalyticsTable)
        .select('*')
        .eq('market_id', marketId)
        .eq('timeframe', timeframe)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error getting market analytics:', error);
        throw new Error(`Failed to get market analytics: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error getting market analytics:', error);
      throw error;
    }
  }

  /**
   * Get all market analytics for a market
   */
  static async getAllMarketAnalytics(marketId: string): Promise<MarketAnalyticsRow[]> {
    try {
      logger.info('Getting all market analytics', { marketId });

      const { data, error } = await supabase.getClient()
        .from(this.marketAnalyticsTable)
        .select('*')
        .eq('market_id', marketId)
        .order('timeframe', { ascending: true });

      if (error) {
        logger.error('Error getting all market analytics:', error);
        throw new Error(`Failed to get all market analytics: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting all market analytics:', error);
      throw error;
    }
  }

  /**
   * Update market analytics
   */
  static async updateMarketAnalytics(marketId: string, timeframe: string, updates: MarketAnalyticsUpdate): Promise<MarketAnalyticsRow> {
    try {
      logger.info('Updating market analytics', { marketId, timeframe, updates });

      const { data, error } = await supabase.getClient()
        .from(this.marketAnalyticsTable)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as any)
        .eq('market_id', marketId)
        .eq('timeframe', timeframe)
        .select()
        .single();

      if (error) {
        logger.error('Error updating market analytics:', error);
        throw new Error(`Failed to update market analytics: ${error.message}`);
      }

      logger.info('Market analytics updated successfully', { marketId, timeframe });
      return data;
    } catch (error) {
      logger.error('Error updating market analytics:', error);
      throw error;
    }
  }

  // =============================================================================
  // TRADES OPERATIONS
  // =============================================================================

  /**
   * Create a new trade record
   */
  static async createTrade(tradeData: TradeInsert): Promise<TradeRow> {
    try {
      logger.info('Creating trade record', { tradeData });

      const { data, error } = await supabase.getClient()
        .from(this.tradesTable)
        .insert(tradeData as any)
        .select()
        .single();

      if (error) {
        logger.error('Error creating trade record:', error);
        throw new Error(`Failed to create trade record: ${error.message}`);
      }

      logger.info('Trade record created successfully', { id: (data as any)?.id });
      return data;
    } catch (error) {
      logger.error('Error creating trade record:', error);
      throw error;
    }
  }

  /**
   * Get trades by user
   */
  static async getTradesByUser(userAddress: string, options: {
    page?: number;
    limit?: number;
    marketId?: string;
    type?: 'OPEN' | 'CLOSE' | 'INCREASE' | 'DECREASE';
  } = {}): Promise<{ data: TradeRow[]; total: number }> {
    try {
      const { page = 1, limit = 20, marketId, type } = options;

      logger.info('Getting trades by user', { userAddress, options });

      let query = supabase.getClient()
        .from(this.tradesTable)
        .select('*', { count: 'exact' })
        .eq('user_address', userAddress);

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error, count } = await query
        .order('timestamp', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error getting trades by user:', error);
        throw new Error(`Failed to get trades by user: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error getting trades by user:', error);
      throw error;
    }
  }

  /**
   * Get trades by market
   */
  static async getTradesByMarket(marketId: string, options: {
    page?: number;
    limit?: number;
    type?: 'OPEN' | 'CLOSE' | 'INCREASE' | 'DECREASE';
  } = {}): Promise<{ data: TradeRow[]; total: number }> {
    try {
      const { page = 1, limit = 20, type } = options;

      logger.info('Getting trades by market', { marketId, options });

      let query = supabase.getClient()
        .from(this.tradesTable)
        .select('*', { count: 'exact' })
        .eq('market_id', marketId);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error, count } = await query
        .order('timestamp', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error getting trades by market:', error);
        throw new Error(`Failed to get trades by market: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error getting trades by market:', error);
      throw error;
    }
  }

  /**
   * Get recent trades
   */
  static async getRecentTrades(limit: number = 10): Promise<TradeRow[]> {
    try {
      logger.info('Getting recent trades', { limit });

      const { data, error } = await supabase.getClient()
        .from(this.tradesTable)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error getting recent trades:', error);
        throw new Error(`Failed to get recent trades: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting recent trades:', error);
      throw error;
    }
  }

  // =============================================================================
  // ANALYTICS CALCULATIONS
  // =============================================================================

  /**
   * Calculate market analytics from trades
   */
  static async calculateMarketAnalytics(marketId: string, timeframe: string): Promise<MarketAnalyticsRow> {
    try {
      logger.info('Calculating market analytics', { marketId, timeframe });

      // Get all trades for the market
      const { data: trades, error } = await supabase.getClient()
        .from(this.tradesTable)
        .select('*')
        .eq('market_id', marketId);

      if (error) {
        logger.error('Error getting trades for analytics:', error);
        throw new Error(`Failed to get trades for analytics: ${error.message}`);
      }

      const tradeList = trades || [];

      // Calculate analytics
      const totalTrades = tradeList.length;
      const totalVolume = tradeList.reduce((sum, trade) => sum + parseFloat(trade.cost), 0);
      const totalLiquidity = tradeList.reduce((sum, trade) => sum + parseFloat(trade.quantity), 0);

      // Calculate price statistics
      const prices = tradeList.map(trade => parseFloat(trade.price)).filter(price => price > 0);
      const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
      const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

      // Calculate unique users
      const uniqueUsers = new Set(tradeList.map(trade => trade.user_address)).size;

      // Calculate time-based volume (simplified)
      const now = new Date();
      const volume24h = this.calculateVolumeForPeriod(tradeList, 24 * 60 * 60 * 1000, now);
      const volume7d = this.calculateVolumeForPeriod(tradeList, 7 * 24 * 60 * 60 * 1000, now);
      const volume30d = this.calculateVolumeForPeriod(tradeList, 30 * 24 * 60 * 60 * 1000, now);

      // Calculate price change (simplified)
      const priceChange24h = this.calculatePriceChange(tradeList, 24 * 60 * 60 * 1000, now);

      // Get win rate from positions
      const { data: positions } = await supabase.getClient()
        .from(TABLES.POSITIONS)
        .select('outcome')
        .eq('market_id', marketId);

      const positionList = positions || [];
      const wonPositions = positionList.filter(p => p.outcome === 'WIN').length;
      const lostPositions = positionList.filter(p => p.outcome === 'LOSS').length;
      const winRate = (wonPositions + lostPositions) > 0 ? (wonPositions / (wonPositions + lostPositions)) * 100 : 0;

      const analyticsData: MarketAnalyticsInsert = {
        market_id: marketId,
        timeframe,
        total_volume: totalVolume.toString(),
        total_trades: totalTrades,
        total_liquidity: totalLiquidity.toString(),
        average_price: averagePrice.toString(),
        highest_price: highestPrice.toString(),
        lowest_price: lowestPrice.toString(),
        price_change_24h: priceChange24h.toString(),
        volume_24h: volume24h.toString(),
        volume_7d: volume7d.toString(),
        volume_30d: volume30d.toString(),
        unique_users: uniqueUsers,
        win_rate: winRate
      };

      return await this.upsertMarketAnalytics(analyticsData);
    } catch (error) {
      logger.error('Error calculating market analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate volume for a specific time period
   */
  private static calculateVolumeForPeriod(trades: TradeRow[], periodMs: number, endTime: Date): number {
    const startTime = new Date(endTime.getTime() - periodMs);
    
    return trades
      .filter(trade => {
        const tradeTime = new Date(trade.timestamp);
        return tradeTime >= startTime && tradeTime <= endTime;
      })
      .reduce((sum, trade) => sum + parseFloat(trade.cost), 0);
  }

  /**
   * Calculate price change for a specific time period
   */
  private static calculatePriceChange(trades: TradeRow[], periodMs: number, endTime: Date): number {
    const startTime = new Date(endTime.getTime() - periodMs);
    
    const recentTrades = trades
      .filter(trade => {
        const tradeTime = new Date(trade.timestamp);
        return tradeTime >= startTime && tradeTime <= endTime;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (recentTrades.length < 2) {
      return 0;
    }

    const firstPrice = parseFloat(recentTrades[0].price);
    const lastPrice = parseFloat(recentTrades[recentTrades.length - 1].price);

    return firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  }

  // =============================================================================
  // PLATFORM ANALYTICS
  // =============================================================================

  /**
   * Get platform analytics summary
   */
  static async getPlatformAnalytics(): Promise<{
    totalMarkets: number;
    totalPositions: number;
    totalTrades: number;
    totalVolume: number;
    totalUsers: number;
    averageWinRate: number;
  }> {
    try {
      logger.info('Getting platform analytics');

      const [
        { count: marketsCount },
        { count: positionsCount },
        { count: tradesCount },
        { count: usersCount }
      ] = await Promise.all([
        supabase.getClient().from(TABLES.MARKETS).select('count', { count: 'exact', head: true }),
        supabase.getClient().from(TABLES.POSITIONS).select('count', { count: 'exact', head: true }),
        supabase.getClient().from(this.tradesTable).select('count', { count: 'exact', head: true }),
        supabase.getClient().from(TABLES.USERS).select('count', { count: 'exact', head: true })
      ]);

      // Get total volume from trades
      const { data: trades } = await supabase.getClient()
        .from(this.tradesTable)
        .select('cost');

      const totalVolume = trades?.reduce((sum, trade) => sum + parseFloat((trade as any).cost), 0) || 0;

      // Calculate average win rate
      const { data: positions } = await supabase.getClient()
        .from(TABLES.POSITIONS)
        .select('outcome');

      const positionList = positions || [];
      const wonPositions = positionList.filter(p => p.outcome === 'WIN').length;
      const lostPositions = positionList.filter(p => p.outcome === 'LOSS').length;
      const averageWinRate = (wonPositions + lostPositions) > 0 ? (wonPositions / (wonPositions + lostPositions)) * 100 : 0;

      return {
        totalMarkets: marketsCount || 0,
        totalPositions: positionsCount || 0,
        totalTrades: tradesCount || 0,
        totalVolume,
        totalUsers: usersCount || 0,
        averageWinRate
      };
    } catch (error) {
      logger.error('Error getting platform analytics:', error);
      throw error;
    }
  }
}


