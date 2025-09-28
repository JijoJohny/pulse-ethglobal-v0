import { supabase, TABLES, Database } from '../config/supabase';
import { logger } from '../utils/logger';

type MarketRow = Database['public']['Tables']['markets']['Row'];
type MarketInsert = Database['public']['Tables']['markets']['Insert'];
type MarketUpdate = Database['public']['Tables']['markets']['Update'];

export class MarketModel {
  private static readonly table = TABLES.MARKETS;

  // =============================================================================
  // CREATE OPERATIONS
  // =============================================================================

  /**
   * Create a new market
   */
  static async create(marketData: MarketInsert): Promise<MarketRow> {
    try {
      logger.info('Creating market in database', { marketData });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .insert(marketData as any)
        .select()
        .single();

      if (error) {
        logger.error('Error creating market:', error);
        throw new Error(`Failed to create market: ${error.message}`);
      }

      logger.info('Market created successfully', { id: (data as any)?.id });
      return data;
    } catch (error) {
      logger.error('Error creating market:', error);
      throw error;
    }
  }

  // =============================================================================
  // READ OPERATIONS
  // =============================================================================

  /**
   * Get market by ID
   */
  static async findById(id: string): Promise<MarketRow | null> {
    try {
      logger.info('Finding market by ID', { id });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error finding market by ID:', error);
        throw new Error(`Failed to find market: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error finding market by ID:', error);
      throw error;
    }
  }

  /**
   * Get market by market_id
   */
  static async findByMarketId(marketId: string): Promise<MarketRow | null> {
    try {
      logger.info('Finding market by market ID', { marketId });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .eq('market_id', marketId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error finding market by market ID:', error);
        throw new Error(`Failed to find market: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error finding market by market ID:', error);
      throw error;
    }
  }

  /**
   * Get all markets with filtering and pagination
   */
  static async findAll(options: {
    page?: number;
    limit?: number;
    status?: 'active' | 'settled' | 'inactive';
    createdBy?: string;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<{ data: MarketRow[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        createdBy,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = options;

      logger.info('Finding markets', { options });

      let query = supabase.getClient()
        .from(this.table)
        .select('*', { count: 'exact' });

      // Apply filters
      if (status === 'active') {
        query = query.eq('is_active', true).eq('is_settled', false);
      } else if (status === 'settled') {
        query = query.eq('is_settled', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (createdBy) {
        query = query.eq('created_by', createdBy);
      }

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error finding markets:', error);
        throw new Error(`Failed to find markets: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error finding markets:', error);
      throw error;
    }
  }

  /**
   * Search markets by title or description
   */
  static async search(searchTerm: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: MarketRow[]; total: number }> {
    try {
      const { page = 1, limit = 20 } = options;

      logger.info('Searching markets', { searchTerm, options });

      const { data, error, count } = await supabase.getClient()
        .from(this.table)
        .select('*', { count: 'exact' })
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error searching markets:', error);
        throw new Error(`Failed to search markets: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error searching markets:', error);
      throw error;
    }
  }

  // =============================================================================
  // UPDATE OPERATIONS
  // =============================================================================

  /**
   * Update market by ID
   */
  static async updateById(id: string, updates: MarketUpdate): Promise<MarketRow> {
    try {
      logger.info('Updating market by ID', { id, updates });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating market:', error);
        throw new Error(`Failed to update market: ${error.message}`);
      }

      logger.info('Market updated successfully', { id });
      return data;
    } catch (error) {
      logger.error('Error updating market:', error);
      throw error;
    }
  }

  /**
   * Update market by market_id
   */
  static async updateByMarketId(marketId: string, updates: MarketUpdate): Promise<MarketRow> {
    try {
      logger.info('Updating market by market ID', { marketId, updates });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as any)
        .eq('market_id', marketId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating market:', error);
        throw new Error(`Failed to update market: ${error.message}`);
      }

      logger.info('Market updated successfully', { marketId });
      return data;
    } catch (error) {
      logger.error('Error updating market:', error);
      throw error;
    }
  }

  /**
   * Settle market
   */
  static async settle(marketId: string, settlementData: {
    settlementValue?: number;
    settlementTick?: number;
  }): Promise<MarketRow> {
    try {
      logger.info('Settling market', { marketId, settlementData });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .update({
          is_settled: true,
          is_active: false,
          settlement_value: settlementData.settlementValue,
          settlement_tick: settlementData.settlementTick,
          updated_at: new Date().toISOString()
        } as any)
        .eq('market_id', marketId)
        .select()
        .single();

      if (error) {
        logger.error('Error settling market:', error);
        throw new Error(`Failed to settle market: ${error.message}`);
      }

      logger.info('Market settled successfully', { marketId });
      return data;
    } catch (error) {
      logger.error('Error settling market:', error);
      throw error;
    }
  }

  // =============================================================================
  // DELETE OPERATIONS
  // =============================================================================

  /**
   * Delete market by ID
   */
  static async deleteById(id: string): Promise<void> {
    try {
      logger.info('Deleting market by ID', { id });

      const { error } = await supabase.getClient()
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting market:', error);
        throw new Error(`Failed to delete market: ${error.message}`);
      }

      logger.info('Market deleted successfully', { id });
    } catch (error) {
      logger.error('Error deleting market:', error);
      throw error;
    }
  }

  // =============================================================================
  // ANALYTICS OPERATIONS
  // =============================================================================

  /**
   * Get market statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    active: number;
    settled: number;
    totalVolume: string;
    totalLiquidity: string;
  }> {
    try {
      logger.info('Getting market statistics');

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('is_active, is_settled, total_volume, total_liquidity');

      if (error) {
        logger.error('Error getting market statistics:', error);
        throw new Error(`Failed to get market statistics: ${error.message}`);
      }

      const stats = {
        total: data.length,
        active: data.filter(m => (m as any).is_active && !(m as any).is_settled).length,
        settled: data.filter(m => (m as any).is_settled).length,
        totalVolume: data.reduce((sum, m) => sum + parseFloat((m as any).total_volume || '0'), 0).toString(),
        totalLiquidity: data.reduce((sum, m) => sum + parseFloat((m as any).total_liquidity || '0'), 0).toString()
      };

      return stats;
    } catch (error) {
      logger.error('Error getting market statistics:', error);
      throw error;
    }
  }

  /**
   * Get markets by creator
   */
  static async getByCreator(creatorAddress: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: MarketRow[]; total: number }> {
    try {
      const { page = 1, limit = 20 } = options;

      logger.info('Getting markets by creator', { creatorAddress, options });

      const { data, error, count } = await supabase.getClient()
        .from(this.table)
        .select('*', { count: 'exact' })
        .eq('created_by', creatorAddress)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error getting markets by creator:', error);
        throw new Error(`Failed to get markets by creator: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error getting markets by creator:', error);
      throw error;
    }
  }
}

