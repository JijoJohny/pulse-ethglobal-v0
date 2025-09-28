import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables first
dotenv.config();

// Supabase configuration interface
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

// Database table names
export const TABLES = {
  MARKETS: 'markets',
  POSITIONS: 'positions',
  USERS: 'users',
  USER_PROFILES: 'user_profiles',
  USER_STATS: 'user_stats',
  MARKET_ANALYTICS: 'market_analytics',
  PREDICTION_ANALYTICS: 'prediction_analytics',
  PLATFORM_ANALYTICS: 'platform_analytics',
  TRADES: 'trades',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_CONFIG: 'system_config',
} as const;

// Database schema types
export interface Database {
  public: {
    Tables: {
      markets: {
        Row: {
          id: string;
          market_id: string;
          title: string;
          description: string;
          min_tick: number;
          max_tick: number;
          tick_spacing: number;
          start_timestamp: string;
          end_timestamp: string;
          settlement_value: number | null;
          settlement_tick: number | null;
          is_active: boolean;
          is_settled: boolean;
          liquidity_parameter: string;
          payment_token: string;
          total_liquidity: string;
          total_volume: string;
          total_trades: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          market_id: string;
          title: string;
          description: string;
          min_tick: number;
          max_tick: number;
          tick_spacing: number;
          start_timestamp: string;
          end_timestamp: string;
          settlement_value?: number | null;
          settlement_tick?: number | null;
          is_active?: boolean;
          is_settled?: boolean;
          liquidity_parameter: string;
          payment_token: string;
          total_liquidity?: string;
          total_volume?: string;
          total_trades?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          market_id?: string;
          title?: string;
          description?: string;
          min_tick?: number;
          max_tick?: number;
          tick_spacing?: number;
          start_timestamp?: string;
          end_timestamp?: string;
          settlement_value?: number | null;
          settlement_tick?: number | null;
          is_active?: boolean;
          is_settled?: boolean;
          liquidity_parameter?: string;
          payment_token?: string;
          total_liquidity?: string;
          total_volume?: string;
          total_trades?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      positions: {
        Row: {
          id: string;
          position_id: string;
          user_address: string;
          market_id: string;
          lower_tick: number;
          upper_tick: number;
          quantity: string;
          cost_basis: string;
          outcome: 'OPEN' | 'WIN' | 'LOSS';
          is_claimed: boolean;
          is_active: boolean;
          date_label: string | null;
          avg_price_cents: number | null;
          potential_win_usd: number | null;
          potential_loss_usd: number | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
          claimed_at: string | null;
        };
        Insert: {
          id?: string;
          position_id: string;
          user_address: string;
          market_id: string;
          lower_tick: number;
          upper_tick: number;
          quantity: string;
          cost_basis: string;
          outcome?: 'OPEN' | 'WIN' | 'LOSS';
          is_claimed?: boolean;
          is_active?: boolean;
          date_label?: string | null;
          avg_price_cents?: number | null;
          potential_win_usd?: number | null;
          potential_loss_usd?: number | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
          claimed_at?: string | null;
        };
        Update: {
          id?: string;
          position_id?: string;
          user_address?: string;
          market_id?: string;
          lower_tick?: number;
          upper_tick?: number;
          quantity?: string;
          cost_basis?: string;
          outcome?: 'OPEN' | 'WIN' | 'LOSS';
          is_claimed?: boolean;
          is_active?: boolean;
          date_label?: string | null;
          avg_price_cents?: number | null;
          potential_win_usd?: number | null;
          potential_loss_usd?: number | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
          claimed_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          address: string;
          username: string | null;
          email: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          address: string;
          username?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          address?: string;
          username?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_address: string;
          bio: string | null;
          website: string | null;
          twitter: string | null;
          discord: string | null;
          telegram: string | null;
          preferences: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_address: string;
          bio?: string | null;
          website?: string | null;
          twitter?: string | null;
          discord?: string | null;
          telegram?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_address?: string;
          bio?: string | null;
          website?: string | null;
          twitter?: string | null;
          discord?: string | null;
          telegram?: string | null;
          preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_address: string;
          total_positions: number;
          total_volume: string;
          total_pnl: string;
          winning_positions: number;
          losing_positions: number;
          win_rate: number;
          average_position_size: string;
          first_position_at: string | null;
          last_position_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_address: string;
          total_positions?: number;
          total_volume?: string;
          total_pnl?: string;
          winning_positions?: number;
          losing_positions?: number;
          win_rate?: number;
          average_position_size?: string;
          first_position_at?: string | null;
          last_position_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_address?: string;
          total_positions?: number;
          total_volume?: string;
          total_pnl?: string;
          winning_positions?: number;
          losing_positions?: number;
          win_rate?: number;
          average_position_size?: string;
          first_position_at?: string | null;
          last_position_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      market_analytics: {
        Row: {
          id: string;
          market_id: string;
          timeframe: string;
          total_volume: string;
          total_trades: number;
          total_liquidity: string;
          average_price: string;
          highest_price: string;
          lowest_price: string;
          price_change_24h: string;
          volume_24h: string;
          volume_7d: string;
          volume_30d: string;
          unique_users: number;
          win_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          market_id: string;
          timeframe: string;
          total_volume: string;
          total_trades: number;
          total_liquidity: string;
          average_price: string;
          highest_price: string;
          lowest_price: string;
          price_change_24h: string;
          volume_24h: string;
          volume_7d: string;
          volume_30d: string;
          unique_users: number;
          win_rate: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          market_id?: string;
          timeframe?: string;
          total_volume?: string;
          total_trades?: number;
          total_liquidity?: string;
          average_price?: string;
          highest_price?: string;
          lowest_price?: string;
          price_change_24h?: string;
          volume_24h?: string;
          volume_7d?: string;
          volume_30d?: string;
          unique_users?: number;
          win_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      prediction_analytics: {
        Row: {
          id: string;
          user_address: string;
          market_id: string;
          position_id: string;
          price_min: number;
          price_max: number;
          avg_price_cents: number;
          bet_amount_usd: number;
          potential_win_usd: number;
          potential_loss_usd: number;
          status: 'live' | 'ended';
          date_label: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_address: string;
          market_id: string;
          position_id: string;
          price_min: number;
          price_max: number;
          avg_price_cents: number;
          bet_amount_usd: number;
          potential_win_usd: number;
          potential_loss_usd: number;
          status?: 'live' | 'ended';
          date_label: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_address?: string;
          market_id?: string;
          position_id?: string;
          price_min?: number;
          price_max?: number;
          avg_price_cents?: number;
          bet_amount_usd?: number;
          potential_win_usd?: number;
          potential_loss_usd?: number;
          status?: 'live' | 'ended';
          date_label?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          trade_id: string;
          user_address: string;
          market_id: string;
          position_id: string;
          type: 'OPEN' | 'CLOSE' | 'INCREASE' | 'DECREASE';
          quantity: string;
          cost: string;
          price: string;
          transaction_hash: string;
          block_number: number;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_id: string;
          user_address: string;
          market_id: string;
          position_id: string;
          type: 'OPEN' | 'CLOSE' | 'INCREASE' | 'DECREASE';
          quantity: string;
          cost: string;
          price: string;
          transaction_hash: string;
          block_number: number;
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trade_id?: string;
          user_address?: string;
          market_id?: string;
          position_id?: string;
          type?: 'OPEN' | 'CLOSE' | 'INCREASE' | 'DECREASE';
          quantity?: string;
          cost?: string;
          price?: string;
          transaction_hash?: string;
          block_number?: number;
          timestamp?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_address: string;
          type: 'POSITION_UPDATE' | 'MARKET_UPDATE' | 'SYSTEM' | 'REWARD';
          title: string;
          message: string;
          data: any;
          is_read: boolean;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_address: string;
          type: 'POSITION_UPDATE' | 'MARKET_UPDATE' | 'SYSTEM' | 'REWARD';
          title: string;
          message: string;
          data?: any;
          is_read?: boolean;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          user_address?: string;
          type?: 'POSITION_UPDATE' | 'MARKET_UPDATE' | 'SYSTEM' | 'REWARD';
          title?: string;
          message?: string;
          data?: any;
          is_read?: boolean;
          created_at?: string;
          read_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Supabase client singleton
class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient<Database>;
  private serviceClient: SupabaseClient<Database> | null = null;

  private constructor() {
    const config = this.getConfig();
    
    // Create main client
    this.client = createClient<Database>(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });

    // Create service client if service role key is provided
    if (config.serviceRoleKey) {
      this.serviceClient = createClient<Database>(config.url, config.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    logger.info('Supabase client initialized', {
      url: config.url,
      hasServiceRole: !!config.serviceRoleKey,
    });
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public getClient(): SupabaseClient<Database> {
    return this.client;
  }

  public getServiceClient(): SupabaseClient<Database> {
    if (!this.serviceClient) {
      throw new Error('Service role key not configured');
    }
    return this.serviceClient;
  }

  private getConfig(): SupabaseConfig {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      throw new Error('Missing required Supabase configuration: SUPABASE_URL and SUPABASE_ANON_KEY');
    }

    return {
      url,
      anonKey,
      serviceRoleKey,
    };
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from(TABLES.MARKETS)
        .select('count')
        .limit(1);
      
      if (error) {
        logger.error('Supabase health check failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Supabase health check error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabase = SupabaseService.getInstance();

// Export convenience methods
export const getSupabaseClient = () => supabase.getClient();
export const getSupabaseServiceClient = () => supabase.getServiceClient();

