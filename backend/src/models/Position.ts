import { supabase, TABLES, Database } from '../config/supabase';
import { logger } from '../utils/logger';

type PositionRow = Database['public']['Tables']['positions']['Row'];
type PositionInsert = Database['public']['Tables']['positions']['Insert'];
type PositionUpdate = Database['public']['Tables']['positions']['Update'];

export class PositionModel {
  private static readonly table = TABLES.POSITIONS;

  // =============================================================================
  // CREATE OPERATIONS
  // =============================================================================

  /**
   * Create a new position
   */
  static async create(positionData: PositionInsert): Promise<PositionRow> {
    try {
      logger.info('Creating position in database', { positionData });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .insert(positionData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating position:', error);
        throw new Error(`Failed to create position: ${error.message}`);
      }

      logger.info('Position created successfully', { id: data.id });
      return data;
    } catch (error) {
      logger.error('Error creating position:', error);
      throw error;
    }
  }

  // =============================================================================
  // READ OPERATIONS
  // =============================================================================

  /**
   * Get position by ID
   */
  static async findById(id: string): Promise<PositionRow | null> {
    try {
      logger.info('Finding position by ID', { id });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error finding position by ID:', error);
        throw new Error(`Failed to find position: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error finding position by ID:', error);
      throw error;
    }
  }

  /**
   * Get position by position_id
   */
  static async findByPositionId(positionId: string): Promise<PositionRow | null> {
    try {
      logger.info('Finding position by position ID', { positionId });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .eq('position_id', positionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error finding position by position ID:', error);
        throw new Error(`Failed to find position: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error finding position by position ID:', error);
      throw error;
    }
  }

  /**
   * Get all positions with filtering and pagination
   */
  static async findAll(options: {
    page?: number;
    limit?: number;
    userAddress?: string;
    marketId?: string;
    outcome?: 'OPEN' | 'WIN' | 'LOSS';
    isActive?: boolean;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<{ data: PositionRow[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        userAddress,
        marketId,
        outcome,
        isActive,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = options;

      logger.info('Finding positions', { options });

      let query = supabase.getClient()
        .from(this.table)
        .select('*', { count: 'exact' });

      // Apply filters
      if (userAddress) {
        query = query.eq('user_address', userAddress);
      }

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      if (outcome) {
        query = query.eq('outcome', outcome);
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error finding positions:', error);
        throw new Error(`Failed to find positions: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error finding positions:', error);
      throw error;
    }
  }

  /**
   * Get user positions
   */
  static async findByUser(userAddress: string, options: {
    page?: number;
    limit?: number;
    outcome?: 'OPEN' | 'WIN' | 'LOSS';
    marketId?: string;
  } = {}): Promise<{ data: PositionRow[]; total: number }> {
    try {
      const { page = 1, limit = 20, outcome, marketId } = options;

      logger.info('Finding positions by user', { userAddress, options });

      let query = supabase.getClient()
        .from(this.table)
        .select('*', { count: 'exact' })
        .eq('user_address', userAddress);

      if (outcome) {
        query = query.eq('outcome', outcome);
      }

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error finding positions by user:', error);
        throw new Error(`Failed to find positions by user: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error finding positions by user:', error);
      throw error;
    }
  }

  /**
   * Get market positions
   */
  static async findByMarket(marketId: string, options: {
    page?: number;
    limit?: number;
    outcome?: 'OPEN' | 'WIN' | 'LOSS';
  } = {}): Promise<{ data: PositionRow[]; total: number }> {
    try {
      const { page = 1, limit = 20, outcome } = options;

      logger.info('Finding positions by market', { marketId, options });

      let query = supabase.getClient()
        .from(this.table)
        .select('*', { count: 'exact' })
        .eq('market_id', marketId);

      if (outcome) {
        query = query.eq('outcome', outcome);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error finding positions by market:', error);
        throw new Error(`Failed to find positions by market: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error finding positions by market:', error);
      throw error;
    }
  }

  // =============================================================================
  // UPDATE OPERATIONS
  // =============================================================================

  /**
   * Update position by ID
   */
  static async updateById(id: string, updates: PositionUpdate): Promise<PositionRow> {
    try {
      logger.info('Updating position by ID', { id, updates });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating position:', error);
        throw new Error(`Failed to update position: ${error.message}`);
      }

      logger.info('Position updated successfully', { id });
      return data;
    } catch (error) {
      logger.error('Error updating position:', error);
      throw error;
    }
  }

  /**
   * Update position by position_id
   */
  static async updateByPositionId(positionId: string, updates: PositionUpdate): Promise<PositionRow> {
    try {
      logger.info('Updating position by position ID', { positionId, updates });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('position_id', positionId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating position:', error);
        throw new Error(`Failed to update position: ${error.message}`);
      }

      logger.info('Position updated successfully', { positionId });
      return data;
    } catch (error) {
      logger.error('Error updating position:', error);
      throw error;
    }
  }

  /**
   * Close position
   */
  static async close(positionId: string, outcome: 'WIN' | 'LOSS'): Promise<PositionRow> {
    try {
      logger.info('Closing position', { positionId, outcome });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .update({
          outcome,
          is_active: false,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('position_id', positionId)
        .select()
        .single();

      if (error) {
        logger.error('Error closing position:', error);
        throw new Error(`Failed to close position: ${error.message}`);
      }

      logger.info('Position closed successfully', { positionId, outcome });
      return data;
    } catch (error) {
      logger.error('Error closing position:', error);
      throw error;
    }
  }

  /**
   * Claim position rewards
   */
  static async claim(positionId: string): Promise<PositionRow> {
    try {
      logger.info('Claiming position rewards', { positionId });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('position_id', positionId)
        .select()
        .single();

      if (error) {
        logger.error('Error claiming position rewards:', error);
        throw new Error(`Failed to claim position rewards: ${error.message}`);
      }

      logger.info('Position rewards claimed successfully', { positionId });
      return data;
    } catch (error) {
      logger.error('Error claiming position rewards:', error);
      throw error;
    }
  }

  // =============================================================================
  // DELETE OPERATIONS
  // =============================================================================

  /**
   * Delete position by ID
   */
  static async deleteById(id: string): Promise<void> {
    try {
      logger.info('Deleting position by ID', { id });

      const { error } = await supabase.getClient()
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting position:', error);
        throw new Error(`Failed to delete position: ${error.message}`);
      }

      logger.info('Position deleted successfully', { id });
    } catch (error) {
      logger.error('Error deleting position:', error);
      throw error;
    }
  }

  // =============================================================================
  // ANALYTICS OPERATIONS
  // =============================================================================

  /**
   * Get position statistics for a user
   */
  static async getUserStatistics(userAddress: string): Promise<{
    total: number;
    open: number;
    won: number;
    lost: number;
    totalVolume: string;
    totalPnL: string;
    winRate: number;
  }> {
    try {
      logger.info('Getting user position statistics', { userAddress });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('outcome, quantity, cost_basis')
        .eq('user_address', userAddress);

      if (error) {
        logger.error('Error getting user position statistics:', error);
        throw new Error(`Failed to get user position statistics: ${error.message}`);
      }

      const stats = {
        total: data.length,
        open: data.filter(p => p.outcome === 'OPEN').length,
        won: data.filter(p => p.outcome === 'WIN').length,
        lost: data.filter(p => p.outcome === 'LOSS').length,
        totalVolume: '0',
        totalPnL: '0',
        winRate: 0
      };

      // Calculate volume and PnL
      let totalVolume = 0;
      let totalPnL = 0;
      let settledCount = 0;

      data.forEach(position => {
        const quantity = parseFloat(position.quantity || '0');
        const costBasis = parseFloat(position.cost_basis || '0');
        
        totalVolume += costBasis;
        
        if (position.outcome === 'WIN') {
          totalPnL += quantity - costBasis;
          settledCount++;
        } else if (position.outcome === 'LOSS') {
          totalPnL -= costBasis;
          settledCount++;
        }
      });

      stats.totalVolume = totalVolume.toString();
      stats.totalPnL = totalPnL.toString();
      stats.winRate = settledCount > 0 ? (stats.won / settledCount) * 100 : 0;

      return stats;
    } catch (error) {
      logger.error('Error getting user position statistics:', error);
      throw error;
    }
  }

  /**
   * Get position statistics for a market
   */
  static async getMarketStatistics(marketId: string): Promise<{
    total: number;
    open: number;
    won: number;
    lost: number;
    totalVolume: string;
    totalLiquidity: string;
    uniqueUsers: number;
  }> {
    try {
      logger.info('Getting market position statistics', { marketId });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('outcome, quantity, cost_basis, user_address')
        .eq('market_id', marketId);

      if (error) {
        logger.error('Error getting market position statistics:', error);
        throw new Error(`Failed to get market position statistics: ${error.message}`);
      }

      const stats = {
        total: data.length,
        open: data.filter(p => p.outcome === 'OPEN').length,
        won: data.filter(p => p.outcome === 'WIN').length,
        lost: data.filter(p => p.outcome === 'LOSS').length,
        totalVolume: '0',
        totalLiquidity: '0',
        uniqueUsers: 0
      };

      // Calculate volume and unique users
      let totalVolume = 0;
      let totalLiquidity = 0;
      const uniqueUsers = new Set<string>();

      data.forEach(position => {
        const quantity = parseFloat(position.quantity || '0');
        const costBasis = parseFloat(position.cost_basis || '0');
        
        totalVolume += costBasis;
        totalLiquidity += quantity;
        uniqueUsers.add(position.user_address);
      });

      stats.totalVolume = totalVolume.toString();
      stats.totalLiquidity = totalLiquidity.toString();
      stats.uniqueUsers = uniqueUsers.size;

      return stats;
    } catch (error) {
      logger.error('Error getting market position statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent positions
   */
  static async getRecent(limit: number = 10): Promise<PositionRow[]> {
    try {
      logger.info('Getting recent positions', { limit });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error getting recent positions:', error);
        throw new Error(`Failed to get recent positions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting recent positions:', error);
      throw error;
    }
  }
}

