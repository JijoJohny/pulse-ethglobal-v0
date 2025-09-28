import { supabase, TABLES } from '../config/supabase';
import { logger } from '../utils/logger';

export interface TransactionData {
  transactionHash: string;
  positionId: string;
  userAddress: string;
  marketId: string;
  lowerTick: number;
  upperTick: number;
  quantity: string;
  costBasis: string;
  priceMin?: number;
  priceMax?: number;
  avgPriceCents?: number;
  betAmountUsd?: number;
  potentialWinUsd?: number;
  potentialLossUsd?: number;
}

export class SupabaseTransactionService {
  /**
   * Store transaction data in Supabase after smart contract transaction
   */
  static async storeTransactionData(data: TransactionData): Promise<{
    position: any;
    predictionAnalytics: any;
  }> {
    try {
      logger.info('Storing transaction data in Supabase', {
        transactionHash: data.transactionHash,
        positionId: data.positionId,
        userAddress: data.userAddress
      });

      // Generate unique position ID for database
      const dbPositionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create position record
      const positionData = {
        position_id: dbPositionId,
        user_address: data.userAddress.toLowerCase(),
        market_id: data.marketId,
        lower_tick: data.lowerTick,
        upper_tick: data.upperTick,
        quantity: data.quantity,
        cost_basis: data.costBasis,
        outcome: 'OPEN' as const,
        is_claimed: false,
        is_active: true,
        transaction_hash: data.transactionHash,
        smart_contract_position_id: data.positionId,
        date_label: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      };

      const { data: position, error: positionError } = await supabase.getClient()
        .from(TABLES.POSITIONS)
        .insert(positionData as any)
        .select()
        .single();

      if (positionError) {
        logger.error('Error creating position in Supabase:', positionError);
        throw new Error(`Failed to create position: ${positionError.message}`);
      }

      logger.info('Position created successfully in Supabase', { positionId: (position as any)?.id });

      // Create prediction analytics entry if UI data is provided
      let predictionAnalytics = null;
      if (data.priceMin && data.priceMax && data.avgPriceCents && data.betAmountUsd && data.potentialWinUsd && data.potentialLossUsd) {
        const analyticsData = {
          user_address: data.userAddress.toLowerCase(),
          market_id: data.marketId,
          position_id: dbPositionId,
          price_min: data.priceMin,
          price_max: data.priceMax,
          avg_price_cents: data.avgPriceCents,
          bet_amount_usd: data.betAmountUsd,
          potential_win_usd: data.potentialWinUsd,
          potential_loss_usd: data.potentialLossUsd,
          status: 'live' as const,
          date_label: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          transaction_hash: data.transactionHash,
          smart_contract_position_id: data.positionId
        };

        const { data: analytics, error: analyticsError } = await supabase.getClient()
          .from(TABLES.PREDICTION_ANALYTICS)
          .insert(analyticsData as any)
          .select()
          .single();

        if (analyticsError) {
          logger.error('Error creating prediction analytics in Supabase:', analyticsError);
          // Don't throw error here, position was created successfully
        } else {
          predictionAnalytics = analytics;
          logger.info('Prediction analytics created successfully in Supabase', { analyticsId: (analytics as any)?.id });
        }
      }

      // Update user statistics
      await this.updateUserStats(data.userAddress);

      logger.info('Transaction data stored successfully in Supabase', {
        positionId: (position as any)?.id,
        transactionHash: data.transactionHash,
        smartContractPositionId: data.positionId
      });

      return {
        position,
        predictionAnalytics
      };

    } catch (error) {
      logger.error('Error storing transaction data in Supabase:', error);
      throw error;
    }
  }

  /**
   * Update user statistics after transaction
   */
  private static async updateUserStats(userAddress: string): Promise<void> {
    try {
      // Get or create user
      const { data: user, error: userError } = await supabase.getClient()
        .from(TABLES.USERS)
        .upsert({
          address: userAddress.toLowerCase(),
          is_active: true,
          is_verified: false
        } as any, {
          onConflict: 'address'
        })
        .select()
        .single();

      if (userError) {
        logger.error('Error creating/updating user:', userError);
        return;
      }

      // Update user stats
      const { error: statsError } = await supabase.getClient()
        .from(TABLES.USER_STATS)
        .upsert({
          user_address: userAddress.toLowerCase(),
          total_positions: 1, // This should be calculated properly
          total_volume: '0',
          total_pnl: '0',
          winning_positions: 0,
          losing_positions: 0,
          win_rate: 0,
          average_position_size: '0',
          first_position_at: new Date().toISOString(),
          last_position_at: new Date().toISOString()
        } as any, {
          onConflict: 'user_address'
        });

      if (statsError) {
        logger.error('Error updating user stats:', statsError);
      } else {
        logger.info('User stats updated successfully', { userAddress });
      }

    } catch (error) {
      logger.error('Error updating user statistics:', error);
    }
  }

  /**
   * Get transaction data by transaction hash
   */
  static async getTransactionByHash(transactionHash: string): Promise<any> {
    try {
      const { data, error } = await supabase.getClient()
        .from(TABLES.POSITIONS)
        .select('*')
        .eq('transaction_hash', transactionHash)
        .single();

      if (error) {
        logger.error('Error fetching transaction by hash:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error fetching transaction by hash:', error);
      return null;
    }
  }

  /**
   * Get user's positions with smart contract data
   */
  static async getUserPositions(userAddress: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.getClient()
        .from(TABLES.POSITIONS)
        .select('*')
        .eq('user_address', userAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user positions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching user positions:', error);
      return [];
    }
  }

  /**
   * Verify transaction data integrity
   */
  static async verifyTransactionData(transactionHash: string, expectedData: Partial<TransactionData>): Promise<boolean> {
    try {
      const transaction = await this.getTransactionByHash(transactionHash);
      
      if (!transaction) {
        return false;
      }

      // Verify key fields match
      const matches = (
        transaction.user_address.toLowerCase() === expectedData.userAddress?.toLowerCase() &&
        transaction.market_id === expectedData.marketId &&
        transaction.lower_tick === expectedData.lowerTick &&
        transaction.upper_tick === expectedData.upperTick
      );

      logger.info('Transaction data verification', {
        transactionHash,
        matches,
        expected: expectedData,
        actual: transaction
      });

      return matches;
    } catch (error) {
      logger.error('Error verifying transaction data:', error);
      return false;
    }
  }
}
