import { supabase, TABLES, Database } from '../config/supabase';
import { logger } from '../utils/logger';

type PredictionAnalyticsRow = Database['public']['Tables']['prediction_analytics']['Row'];
type PredictionAnalyticsInsert = Database['public']['Tables']['prediction_analytics']['Insert'];
type PredictionAnalyticsUpdate = Database['public']['Tables']['prediction_analytics']['Update'];

export class PredictionAnalyticsModel {
  private static readonly table = TABLES.PREDICTION_ANALYTICS;

  // =============================================================================
  // CREATE OPERATIONS
  // =============================================================================

  /**
   * Create a new prediction analytics entry
   */
  static async create(data: PredictionAnalyticsInsert): Promise<PredictionAnalyticsRow> {
    try {
      logger.info('Creating prediction analytics entry', { data });

      const { data: result, error } = await (supabase.getClient() as any)
        .from(this.table)
        .insert(data as any)
        .select()
        .single();

      if (error) {
        logger.error('Error creating prediction analytics entry:', error);
        throw new Error(`Failed to create prediction analytics entry: ${error.message}`);
      }

      if (!result) {
        throw new Error('No data returned from prediction analytics creation');
      }

      logger.info('Prediction analytics entry created successfully', { id: result.id });
      return result as PredictionAnalyticsRow;
    } catch (error) {
      logger.error('Error creating prediction analytics entry:', error);
      throw error;
    }
  }

  // =============================================================================
  // READ OPERATIONS
  // =============================================================================

  /**
   * Get prediction analytics by ID
   */
  static async findById(id: string): Promise<PredictionAnalyticsRow | null> {
    try {
      logger.info('Finding prediction analytics by ID', { id });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error finding prediction analytics by ID:', error);
        throw new Error(`Failed to find prediction analytics: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error finding prediction analytics by ID:', error);
      throw error;
    }
  }

  /**
   * Get prediction analytics by position ID
   */
  static async findByPositionId(positionId: string): Promise<PredictionAnalyticsRow | null> {
    try {
      logger.info('Finding prediction analytics by position ID', { positionId });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .eq('position_id', positionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error finding prediction analytics by position ID:', error);
        throw new Error(`Failed to find prediction analytics: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error finding prediction analytics by position ID:', error);
      throw error;
    }
  }

  /**
   * Get all prediction analytics with filtering and pagination
   */
  static async findAll(options: {
    page?: number;
    limit?: number;
    userAddress?: string;
    marketId?: string;
    status?: 'live' | 'ended';
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<{ data: PredictionAnalyticsRow[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        userAddress,
        marketId,
        status,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = options;

      logger.info('Finding prediction analytics', { options });

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

      if (status) {
        query = query.eq('status', status);
      }

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error finding prediction analytics:', error);
        throw new Error(`Failed to find prediction analytics: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error finding prediction analytics:', error);
      throw error;
    }
  }

  /**
   * Get user prediction analytics
   */
  static async findByUser(userAddress: string, options: {
    page?: number;
    limit?: number;
    status?: 'live' | 'ended';
    marketId?: string;
  } = {}): Promise<{ data: PredictionAnalyticsRow[]; total: number }> {
    try {
      const { page = 1, limit = 20, status, marketId } = options;

      logger.info('Finding prediction analytics by user', { userAddress, options });

      let query = supabase.getClient()
        .from(this.table)
        .select('*', { count: 'exact' })
        .eq('user_address', userAddress);

      if (status) {
        query = query.eq('status', status);
      }

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error finding prediction analytics by user:', error);
        throw new Error(`Failed to find prediction analytics by user: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error finding prediction analytics by user:', error);
      throw error;
    }
  }

  // =============================================================================
  // UPDATE OPERATIONS
  // =============================================================================

  /**
   * Update prediction analytics by ID
   */
  static async updateById(id: string, updates: PredictionAnalyticsUpdate): Promise<PredictionAnalyticsRow> {
    try {
      logger.info('Updating prediction analytics by ID', { id, updates });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.table)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating prediction analytics:', error);
        throw new Error(`Failed to update prediction analytics: ${error.message}`);
      }

      logger.info('Prediction analytics updated successfully', { id });
      return data;
    } catch (error) {
      logger.error('Error updating prediction analytics:', error);
      throw error;
    }
  }

  /**
   * Update prediction analytics by position ID
   */
  static async updateByPositionId(positionId: string, updates: PredictionAnalyticsUpdate): Promise<PredictionAnalyticsRow> {
    try {
      logger.info('Updating prediction analytics by position ID', { positionId, updates });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.table)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('position_id', positionId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating prediction analytics:', error);
        throw new Error(`Failed to update prediction analytics: ${error.message}`);
      }

      logger.info('Prediction analytics updated successfully', { positionId });
      return data;
    } catch (error) {
      logger.error('Error updating prediction analytics:', error);
      throw error;
    }
  }

  /**
   * Mark prediction as ended
   */
  static async markAsEnded(positionId: string): Promise<PredictionAnalyticsRow> {
    try {
      logger.info('Marking prediction as ended', { positionId });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.table)
        .update({
          status: 'ended',
          updated_at: new Date().toISOString()
        })
        .eq('position_id', positionId)
        .select()
        .single();

      if (error) {
        logger.error('Error marking prediction as ended:', error);
        throw new Error(`Failed to mark prediction as ended: ${error.message}`);
      }

      logger.info('Prediction marked as ended successfully', { positionId });
      return data;
    } catch (error) {
      logger.error('Error marking prediction as ended:', error);
      throw error;
    }
  }

  // =============================================================================
  // DELETE OPERATIONS
  // =============================================================================

  /**
   * Delete prediction analytics by ID
   */
  static async deleteById(id: string): Promise<void> {
    try {
      logger.info('Deleting prediction analytics by ID', { id });

      const { error } = await supabase.getClient()
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting prediction analytics:', error);
        throw new Error(`Failed to delete prediction analytics: ${error.message}`);
      }

      logger.info('Prediction analytics deleted successfully', { id });
    } catch (error) {
      logger.error('Error deleting prediction analytics:', error);
      throw error;
    }
  }

  // =============================================================================
  // ANALYTICS OPERATIONS
  // =============================================================================

  /**
   * Get prediction statistics for a user
   */
  static async getUserStatistics(userAddress: string): Promise<{
    total: number;
    live: number;
    ended: number;
    totalBetAmount: number;
    totalPotentialWin: number;
    totalPotentialLoss: number;
    averageBetSize: number;
    averagePotentialWin: number;
  }> {
    try {
      logger.info('Getting user prediction statistics', { userAddress });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('status, bet_amount_usd, potential_win_usd, potential_loss_usd')
        .eq('user_address', userAddress);

      if (error) {
        logger.error('Error getting user prediction statistics:', error);
        throw new Error(`Failed to get user prediction statistics: ${error.message}`);
      }

      const stats = {
        total: data.length,
        live: (data as any[]).filter(p => p.status === 'live').length,
        ended: (data as any[]).filter(p => p.status === 'ended').length,
        totalBetAmount: 0,
        totalPotentialWin: 0,
        totalPotentialLoss: 0,
        averageBetSize: 0,
        averagePotentialWin: 0
      };

      // Calculate totals
      (data as any[]).forEach(prediction => {
        stats.totalBetAmount += prediction.bet_amount_usd;
        stats.totalPotentialWin += prediction.potential_win_usd;
        stats.totalPotentialLoss += prediction.potential_loss_usd;
      });

      // Calculate averages
      if (data.length > 0) {
        stats.averageBetSize = stats.totalBetAmount / data.length;
        stats.averagePotentialWin = stats.totalPotentialWin / data.length;
      }

      return stats;
    } catch (error) {
      logger.error('Error getting user prediction statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent predictions
   */
  static async getRecent(limit: number = 10): Promise<PredictionAnalyticsRow[]> {
    try {
      logger.info('Getting recent predictions', { limit });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error getting recent predictions:', error);
        throw new Error(`Failed to get recent predictions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting recent predictions:', error);
      throw error;
    }
  }
}
