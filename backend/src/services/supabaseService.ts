import { supabase, getSupabaseClient, getSupabaseServiceClient } from '../config/supabase';
import { MarketModel } from '../models/Market';
import { PositionModel } from '../models/Position';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

export class SupabaseService {
  private client = getSupabaseClient();
  private serviceClient = getSupabaseServiceClient();

  // =============================================================================
  // HEALTH CHECK
  // =============================================================================

  /**
   * Check database health
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await supabase.healthCheck();
    } catch (error) {
      logger.error('Supabase health check failed:', error);
      return false;
    }
  }

  // =============================================================================
  // MARKET OPERATIONS
  // =============================================================================

  /**
   * Get all markets with filtering
   */
  async getMarkets(options: {
    page?: number;
    limit?: number;
    status?: 'active' | 'settled' | 'inactive';
    createdBy?: string;
  } = {}) {
    try {
      logger.info('Getting markets from Supabase', { options });
      
      const result = await MarketModel.findAll(options);
      
      return {
        success: true,
        data: result.data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total: result.total
        }
      };
    } catch (error) {
      logger.error('Error getting markets from Supabase:', error);
      throw error;
    }
  }

  /**
   * Get market by ID
   */
  async getMarketById(id: string) {
    try {
      logger.info('Getting market by ID from Supabase', { id });
      
      const market = await MarketModel.findById(id);
      
      if (!market) {
        return {
          success: false,
          error: 'Market not found'
        };
      }

      return {
        success: true,
        data: market
      };
    } catch (error) {
      logger.error('Error getting market by ID from Supabase:', error);
      throw error;
    }
  }

  /**
   * Get market by market_id
   */
  async getMarketByMarketId(marketId: string) {
    try {
      logger.info('Getting market by market ID from Supabase', { marketId });
      
      const market = await MarketModel.findByMarketId(marketId);
      
      if (!market) {
        return {
          success: false,
          error: 'Market not found'
        };
      }

      return {
        success: true,
        data: market
      };
    } catch (error) {
      logger.error('Error getting market by market ID from Supabase:', error);
      throw error;
    }
  }

  /**
   * Create market
   */
  async createMarket(marketData: any) {
    try {
      logger.info('Creating market in Supabase', { marketData });
      
      const market = await MarketModel.create(marketData);
      
      return {
        success: true,
        data: market
      };
    } catch (error) {
      logger.error('Error creating market in Supabase:', error);
      throw error;
    }
  }

  /**
   * Update market
   */
  async updateMarket(id: string, updates: any) {
    try {
      logger.info('Updating market in Supabase', { id, updates });
      
      const market = await MarketModel.updateById(id, updates);
      
      return {
        success: true,
        data: market
      };
    } catch (error) {
      logger.error('Error updating market in Supabase:', error);
      throw error;
    }
  }

  /**
   * Settle market
   */
  async settleMarket(marketId: string, settlementData: any) {
    try {
      logger.info('Settling market in Supabase', { marketId, settlementData });
      
      const market = await MarketModel.settle(marketId, settlementData);
      
      return {
        success: true,
        data: market
      };
    } catch (error) {
      logger.error('Error settling market in Supabase:', error);
      throw error;
    }
  }

  // =============================================================================
  // POSITION OPERATIONS
  // =============================================================================

  /**
   * Get all positions with filtering
   */
  async getPositions(options: {
    page?: number;
    limit?: number;
    userAddress?: string;
    marketId?: string;
    outcome?: 'OPEN' | 'WIN' | 'LOSS';
  } = {}) {
    try {
      logger.info('Getting positions from Supabase', { options });
      
      const result = await PositionModel.findAll(options);
      
      return {
        success: true,
        data: result.data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total: result.total
        }
      };
    } catch (error) {
      logger.error('Error getting positions from Supabase:', error);
      throw error;
    }
  }

  /**
   * Get position by ID
   */
  async getPositionById(id: string) {
    try {
      logger.info('Getting position by ID from Supabase', { id });
      
      const position = await PositionModel.findById(id);
      
      if (!position) {
        return {
          success: false,
          error: 'Position not found'
        };
      }

      return {
        success: true,
        data: position
      };
    } catch (error) {
      logger.error('Error getting position by ID from Supabase:', error);
      throw error;
    }
  }

  /**
   * Get user positions
   */
  async getUserPositions(userAddress: string, options: {
    page?: number;
    limit?: number;
    outcome?: 'OPEN' | 'WIN' | 'LOSS';
    marketId?: string;
  } = {}) {
    try {
      logger.info('Getting user positions from Supabase', { userAddress, options });
      
      const result = await PositionModel.findByUser(userAddress, options);
      
      return {
        success: true,
        data: result.data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total: result.total
        }
      };
    } catch (error) {
      logger.error('Error getting user positions from Supabase:', error);
      throw error;
    }
  }

  /**
   * Create position
   */
  async createPosition(positionData: any) {
    try {
      logger.info('Creating position in Supabase', { positionData });
      
      const position = await PositionModel.create(positionData);
      
      // Update user statistics
      await this.updateUserStats(position.user_address);
      
      return {
        success: true,
        data: position
      };
    } catch (error) {
      logger.error('Error creating position in Supabase:', error);
      throw error;
    }
  }

  /**
   * Update position
   */
  async updatePosition(id: string, updates: any) {
    try {
      logger.info('Updating position in Supabase', { id, updates });
      
      const position = await PositionModel.updateById(id, updates);
      
      return {
        success: true,
        data: position
      };
    } catch (error) {
      logger.error('Error updating position in Supabase:', error);
      throw error;
    }
  }

  /**
   * Close position
   */
  async closePosition(positionId: string, outcome: 'WIN' | 'LOSS') {
    try {
      logger.info('Closing position in Supabase', { positionId, outcome });
      
      const position = await PositionModel.close(positionId, outcome);
      
      // Update user statistics
      await this.updateUserStats(position.user_address);
      
      return {
        success: true,
        data: position
      };
    } catch (error) {
      logger.error('Error closing position in Supabase:', error);
      throw error;
    }
  }

  /**
   * Claim position rewards
   */
  async claimPositionRewards(positionId: string) {
    try {
      logger.info('Claiming position rewards in Supabase', { positionId });
      
      const position = await PositionModel.claim(positionId);
      
      return {
        success: true,
        data: position
      };
    } catch (error) {
      logger.error('Error claiming position rewards in Supabase:', error);
      throw error;
    }
  }

  // =============================================================================
  // USER OPERATIONS
  // =============================================================================

  /**
   * Get user by address
   */
  async getUserByAddress(address: string) {
    try {
      logger.info('Getting user by address from Supabase', { address });
      
      const user = await UserModel.findByAddress(address);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      logger.error('Error getting user by address from Supabase:', error);
      throw error;
    }
  }

  /**
   * Create or get user
   */
  async getOrCreateUser(address: string, userData?: any) {
    try {
      logger.info('Getting or creating user in Supabase', { address, userData });
      
      const user = await UserModel.getOrCreate(address, userData);
      
      return {
        success: true,
        data: user
      };
    } catch (error) {
      logger.error('Error getting or creating user in Supabase:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(address: string, updates: any) {
    try {
      logger.info('Updating user in Supabase', { address, updates });
      
      const user = await UserModel.updateByAddress(address, updates);
      
      return {
        success: true,
        data: user
      };
    } catch (error) {
      logger.error('Error updating user in Supabase:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userAddress: string) {
    try {
      logger.info('Getting user profile from Supabase', { userAddress });
      
      const profile = await UserModel.getProfile(userAddress);
      
      return {
        success: true,
        data: profile
      };
    } catch (error) {
      logger.error('Error getting user profile from Supabase:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userAddress: string, updates: any) {
    try {
      logger.info('Updating user profile in Supabase', { userAddress, updates });
      
      const profile = await UserModel.updateProfile(userAddress, updates);
      
      return {
        success: true,
        data: profile
      };
    } catch (error) {
      logger.error('Error updating user profile in Supabase:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userAddress: string) {
    try {
      logger.info('Getting user statistics from Supabase', { userAddress });
      
      const stats = await UserModel.getStats(userAddress);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Error getting user statistics from Supabase:', error);
      throw error;
    }
  }

  /**
   * Update user statistics
   */
  async updateUserStats(userAddress: string) {
    try {
      logger.info('Updating user statistics in Supabase', { userAddress });
      
      // Get position statistics
      const positionStats = await PositionModel.getUserStatistics(userAddress);
      
      // Update user stats
      const stats = await UserModel.getOrCreateStats(userAddress, {
        total_positions: positionStats.total,
        total_volume: positionStats.totalVolume,
        total_pnl: positionStats.totalPnL,
        winning_positions: positionStats.won,
        losing_positions: positionStats.lost,
        win_rate: positionStats.winRate
      });
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Error updating user statistics in Supabase:', error);
      throw error;
    }
  }

  // =============================================================================
  // ANALYTICS OPERATIONS
  // =============================================================================

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    try {
      logger.info('Getting platform statistics from Supabase');
      
      const [marketStats, userStats] = await Promise.all([
        MarketModel.getStatistics(),
        UserModel.getPlatformStats()
      ]);
      
      return {
        success: true,
        data: {
          markets: marketStats,
          users: userStats
        }
      };
    } catch (error) {
      logger.error('Error getting platform statistics from Supabase:', error);
      throw error;
    }
  }

  /**
   * Get market statistics
   */
  async getMarketStatistics(marketId: string) {
    try {
      logger.info('Getting market statistics from Supabase', { marketId });
      
      const stats = await PositionModel.getMarketStatistics(marketId);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Error getting market statistics from Supabase:', error);
      throw error;
    }
  }

  /**
   * Get user leaderboard
   */
  async getUserLeaderboard(options: {
    page?: number;
    limit?: number;
    sortBy?: 'total_pnl' | 'win_rate' | 'total_volume' | 'total_positions';
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    try {
      logger.info('Getting user leaderboard from Supabase', { options });
      
      const result = await UserModel.getLeaderboard(options);
      
      return {
        success: true,
        data: result.data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total: result.total
        }
      };
    } catch (error) {
      logger.error('Error getting user leaderboard from Supabase:', error);
      throw error;
    }
  }

  // =============================================================================
  // REAL-TIME OPERATIONS
  // =============================================================================

  /**
   * Subscribe to market updates
   */
  subscribeToMarkets(callback: (payload: any) => void) {
    logger.info('Subscribing to market updates');
    
    return this.client
      .channel('market-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'markets' 
        }, 
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to position updates for a user
   */
  subscribeToUserPositions(userAddress: string, callback: (payload: any) => void) {
    logger.info('Subscribing to user position updates', { userAddress });
    
    return this.client
      .channel(`user-positions-${userAddress}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'positions',
          filter: `user_address=eq.${userAddress}`
        }, 
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to user statistics updates
   */
  subscribeToUserStats(userAddress: string, callback: (payload: any) => void) {
    logger.info('Subscribing to user statistics updates', { userAddress });
    
    return this.client
      .channel(`user-stats-${userAddress}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_stats',
          filter: `user_address=eq.${userAddress}`
        }, 
        callback
      )
      .subscribe();
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channel: any) {
    logger.info('Unsubscribing from channel');
    
    return this.client.removeChannel(channel);
  }

  // =============================================================================
  // UTILITY OPERATIONS
  // =============================================================================

  /**
   * Search markets
   */
  async searchMarkets(searchTerm: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    try {
      logger.info('Searching markets in Supabase', { searchTerm, options });
      
      const result = await MarketModel.search(searchTerm, options);
      
      return {
        success: true,
        data: result.data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total: result.total
        }
      };
    } catch (error) {
      logger.error('Error searching markets in Supabase:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    try {
      logger.info('Searching users in Supabase', { searchTerm, options });
      
      const result = await UserModel.search(searchTerm, options);
      
      return {
        success: true,
        data: result.data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total: result.total
        }
      };
    } catch (error) {
      logger.error('Error searching users in Supabase:', error);
      throw error;
    }
  }

  /**
   * Get recent positions
   */
  async getRecentPositions(limit: number = 10) {
    try {
      logger.info('Getting recent positions from Supabase', { limit });
      
      const positions = await PositionModel.getRecent(limit);
      
      return {
        success: true,
        data: positions
      };
    } catch (error) {
      logger.error('Error getting recent positions from Supabase:', error);
      throw error;
    }
  }
}
