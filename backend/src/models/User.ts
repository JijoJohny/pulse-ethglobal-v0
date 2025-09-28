import { supabase, TABLES, Database } from '../config/supabase';
import { logger } from '../utils/logger';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

type UserStatsRow = Database['public']['Tables']['user_stats']['Row'];
type UserStatsInsert = Database['public']['Tables']['user_stats']['Insert'];
type UserStatsUpdate = Database['public']['Tables']['user_stats']['Update'];

export class UserModel {
  private static readonly usersTable = TABLES.USERS;
  private static readonly profilesTable = TABLES.USER_PROFILES;
  private static readonly statsTable = TABLES.USER_STATS;

  // =============================================================================
  // USER OPERATIONS
  // =============================================================================

  /**
   * Create a new user
   */
  static async create(userData: UserInsert): Promise<UserRow> {
    try {
      logger.info('Creating user in database', { userData });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.usersTable)
        .insert(userData as any)
        .select()
        .single();

      if (error) {
        logger.error('Error creating user:', error);
        throw new Error(`Failed to create user: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from user creation');
      }

      logger.info('User created successfully', { id: data.id });
      return data as UserRow;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by address
   */
  static async findByAddress(address: string): Promise<UserRow | null> {
    try {
      logger.info('Finding user by address', { address });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.usersTable)
        .select('*')
        .eq('address', address.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error finding user by address:', error);
        throw new Error(`Failed to find user: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error finding user by address:', error);
      throw error;
    }
  }

  /**
   * Update user by address
   */
  static async updateByAddress(address: string, updates: UserUpdate): Promise<UserRow> {
    try {
      logger.info('Updating user by address', { address, updates });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.usersTable)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('address', address.toLowerCase())
        .select()
        .single();

      if (error) {
        logger.error('Error updating user:', error);
        throw new Error(`Failed to update user: ${error.message}`);
      }

      logger.info('User updated successfully', { address });
      return data;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Get or create user
   */
  static async getOrCreate(address: string, userData?: Partial<UserInsert>): Promise<UserRow> {
    try {
      let user = await this.findByAddress(address);
      
      if (!user) {
        logger.info('User not found, creating new user', { address });
        user = await this.create({
          address: address.toLowerCase(),
          ...userData
        });
      }

      return user;
    } catch (error) {
      logger.error('Error getting or creating user:', error);
      throw error;
    }
  }

  /**
   * Update last login time
   */
  static async updateLastLogin(address: string): Promise<void> {
    try {
      logger.info('Updating last login time', { address });

      const { error } = await (supabase.getClient() as any)
        .from(this.usersTable)
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('address', address.toLowerCase());

      if (error) {
        logger.error('Error updating last login time:', error);
        throw new Error(`Failed to update last login time: ${error.message}`);
      }

      logger.info('Last login time updated successfully', { address });
    } catch (error) {
      logger.error('Error updating last login time:', error);
      throw error;
    }
  }

  // =============================================================================
  // USER PROFILE OPERATIONS
  // =============================================================================

  /**
   * Create user profile
   */
  static async createProfile(profileData: UserProfileInsert): Promise<UserProfileRow> {
    try {
      logger.info('Creating user profile', { profileData });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.profilesTable)
        .insert(profileData as any)
        .select()
        .single();

      if (error) {
        logger.error('Error creating user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from user profile creation');
      }

      logger.info('User profile created successfully', { id: data.id });
      return data;
    } catch (error) {
      logger.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userAddress: string): Promise<UserProfileRow | null> {
    try {
      logger.info('Getting user profile', { userAddress });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.profilesTable)
        .select('*')
        .eq('user_address', userAddress.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error getting user profile:', error);
        throw new Error(`Failed to get user profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userAddress: string, updates: UserProfileUpdate): Promise<UserProfileRow> {
    try {
      logger.info('Updating user profile', { userAddress, updates });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.profilesTable)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_address', userAddress.toLowerCase())
        .select()
        .single();

      if (error) {
        logger.error('Error updating user profile:', error);
        throw new Error(`Failed to update user profile: ${error.message}`);
      }

      logger.info('User profile updated successfully', { userAddress });
      return data;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get or create user profile
   */
  static async getOrCreateProfile(userAddress: string, profileData?: Partial<UserProfileInsert>): Promise<UserProfileRow> {
    try {
      let profile = await this.getProfile(userAddress);
      
      if (!profile) {
        logger.info('User profile not found, creating new profile', { userAddress });
        profile = await this.createProfile({
          user_address: userAddress.toLowerCase(),
          ...profileData
        });
      }

      return profile;
    } catch (error) {
      logger.error('Error getting or creating user profile:', error);
      throw error;
    }
  }

  // =============================================================================
  // USER STATISTICS OPERATIONS
  // =============================================================================

  /**
   * Create user statistics
   */
  static async createStats(statsData: UserStatsInsert): Promise<UserStatsRow> {
    try {
      logger.info('Creating user statistics', { statsData });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.statsTable)
        .insert(statsData as any)
        .select()
        .single();

      if (error) {
        logger.error('Error creating user statistics:', error);
        throw new Error(`Failed to create user statistics: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from user statistics creation');
      }

      logger.info('User statistics created successfully', { id: data.id });
      return data;
    } catch (error) {
      logger.error('Error creating user statistics:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getStats(userAddress: string): Promise<UserStatsRow | null> {
    try {
      logger.info('Getting user statistics', { userAddress });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.statsTable)
        .select('*')
        .eq('user_address', userAddress.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error getting user statistics:', error);
        throw new Error(`Failed to get user statistics: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error getting user statistics:', error);
      throw error;
    }
  }

  /**
   * Update user statistics
   */
  static async updateStats(userAddress: string, updates: UserStatsUpdate): Promise<UserStatsRow> {
    try {
      logger.info('Updating user statistics', { userAddress, updates });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.statsTable)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_address', userAddress.toLowerCase())
        .select()
        .single();

      if (error) {
        logger.error('Error updating user statistics:', error);
        throw new Error(`Failed to update user statistics: ${error.message}`);
      }

      logger.info('User statistics updated successfully', { userAddress });
      return data;
    } catch (error) {
      logger.error('Error updating user statistics:', error);
      throw error;
    }
  }

  /**
   * Get or create user statistics
   */
  static async getOrCreateStats(userAddress: string, statsData?: Partial<UserStatsInsert>): Promise<UserStatsRow> {
    try {
      let stats = await this.getStats(userAddress);
      
      if (!stats) {
        logger.info('User statistics not found, creating new stats', { userAddress });
        stats = await this.createStats({
          user_address: userAddress.toLowerCase(),
          total_positions: 0,
          total_volume: '0',
          total_pnl: '0',
          winning_positions: 0,
          losing_positions: 0,
          win_rate: 0,
          average_position_size: '0',
          ...statsData
        });
      }

      return stats;
    } catch (error) {
      logger.error('Error getting or creating user statistics:', error);
      throw error;
    }
  }

  // =============================================================================
  // ANALYTICS OPERATIONS
  // =============================================================================

  /**
   * Get user leaderboard
   */
  static async getLeaderboard(options: {
    page?: number;
    limit?: number;
    sortBy?: 'total_pnl' | 'win_rate' | 'total_volume' | 'total_positions';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ data: UserStatsRow[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'total_pnl',
        sortOrder = 'desc'
      } = options;

      logger.info('Getting user leaderboard', { options });

      const { data, error, count } = await (supabase.getClient() as any)
        .from(this.statsTable)
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error getting user leaderboard:', error);
        throw new Error(`Failed to get user leaderboard: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error getting user leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user rank
   */
  static async getUserRank(userAddress: string, sortBy: string = 'total_pnl'): Promise<number> {
    try {
      logger.info('Getting user rank', { userAddress, sortBy });

      const { data, error } = await (supabase.getClient() as any)
        .from(this.statsTable)
        .select('user_address')
        .order(sortBy, { ascending: false });

      if (error) {
        logger.error('Error getting user rank:', error);
        throw new Error(`Failed to get user rank: ${error.message}`);
      }

      const rank = data.findIndex((user: any) => 
        user.user_address.toLowerCase() === userAddress.toLowerCase()
      );

      return rank >= 0 ? rank + 1 : 0;
    } catch (error) {
      logger.error('Error getting user rank:', error);
      throw error;
    }
  }

  /**
   * Get platform user statistics
   */
  static async getPlatformStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    totalVolume: string;
    totalPnL: string;
  }> {
    try {
      logger.info('Getting platform user statistics');

      const [usersData, statsData] = await Promise.all([
        supabase.getClient()
          .from(this.usersTable)
          .select('is_active, is_verified'),
        supabase.getClient()
          .from(this.statsTable)
          .select('total_volume, total_pnl')
      ]);

      if (usersData.error) {
        logger.error('Error getting users data:', usersData.error);
        throw new Error(`Failed to get users data: ${usersData.error.message}`);
      }

      if (statsData.error) {
        logger.error('Error getting stats data:', statsData.error);
        throw new Error(`Failed to get stats data: ${statsData.error.message}`);
      }

      const users = usersData.data || [];
      const stats = statsData.data || [];

      const platformStats = {
        totalUsers: users.length,
        activeUsers: (users as any[]).filter(u => u.is_active).length,
        verifiedUsers: (users as any[]).filter(u => u.is_verified).length,
        totalVolume: (stats as any[]).reduce((sum, s) => sum + parseFloat(s.total_volume || '0'), 0).toString(),
        totalPnL: (stats as any[]).reduce((sum, s) => sum + parseFloat(s.total_pnl || '0'), 0).toString()
      };

      return platformStats;
    } catch (error) {
      logger.error('Error getting platform user statistics:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  static async search(searchTerm: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: UserRow[]; total: number }> {
    try {
      const { page = 1, limit = 20 } = options;

      logger.info('Searching users', { searchTerm, options });

      const { data, error, count } = await (supabase.getClient() as any)
        .from(this.usersTable)
        .select('*', { count: 'exact' })
        .or(`address.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        logger.error('Error searching users:', error);
        throw new Error(`Failed to search users: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }
}

