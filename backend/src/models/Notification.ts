import { supabase, TABLES, Database } from '../config/supabase';
import { logger } from '../utils/logger';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export class NotificationModel {
  private static readonly table = TABLES.NOTIFICATIONS;

  // =============================================================================
  // CREATE OPERATIONS
  // =============================================================================

  /**
   * Create a new notification
   */
  static async create(notificationData: NotificationInsert): Promise<NotificationRow> {
    try {
      logger.info('Creating notification', { notificationData });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating notification:', error);
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      logger.info('Notification created successfully', { id: data.id });
      return data;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create multiple notifications
   */
  static async createMultiple(notificationsData: NotificationInsert[]): Promise<NotificationRow[]> {
    try {
      logger.info('Creating multiple notifications', { count: notificationsData.length });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .insert(notificationsData)
        .select();

      if (error) {
        logger.error('Error creating multiple notifications:', error);
        throw new Error(`Failed to create multiple notifications: ${error.message}`);
      }

      logger.info('Multiple notifications created successfully', { count: data?.length || 0 });
      return data || [];
    } catch (error) {
      logger.error('Error creating multiple notifications:', error);
      throw error;
    }
  }

  // =============================================================================
  // READ OPERATIONS
  // =============================================================================

  /**
   * Get notification by ID
   */
  static async findById(id: string): Promise<NotificationRow | null> {
    try {
      logger.info('Finding notification by ID', { id });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error finding notification by ID:', error);
        throw new Error(`Failed to find notification: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error finding notification by ID:', error);
      throw error;
    }
  }

  /**
   * Get user notifications with filtering and pagination
   */
  static async findByUser(userAddress: string, options: {
    page?: number;
    limit?: number;
    type?: 'POSITION_UPDATE' | 'MARKET_UPDATE' | 'SYSTEM' | 'REWARD';
    isRead?: boolean;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<{ data: NotificationRow[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        isRead,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = options;

      logger.info('Finding notifications by user', { userAddress, options });

      let query = supabase.getClient()
        .from(this.table)
        .select('*', { count: 'exact' })
        .eq('user_address', userAddress);

      // Apply filters
      if (type) {
        query = query.eq('type', type);
      }

      if (isRead !== undefined) {
        query = query.eq('is_read', isRead);
      }

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error finding notifications by user:', error);
        throw new Error(`Failed to find notifications by user: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Error finding notifications by user:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count for user
   */
  static async getUnreadCount(userAddress: string): Promise<number> {
    try {
      logger.info('Getting unread notifications count', { userAddress });

      const { count, error } = await supabase.getClient()
        .from(this.table)
        .select('count', { count: 'exact', head: true })
        .eq('user_address', userAddress)
        .eq('is_read', false);

      if (error) {
        logger.error('Error getting unread notifications count:', error);
        throw new Error(`Failed to get unread notifications count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      logger.error('Error getting unread notifications count:', error);
      throw error;
    }
  }

  /**
   * Get recent notifications for user
   */
  static async getRecent(userAddress: string, limit: number = 5): Promise<NotificationRow[]> {
    try {
      logger.info('Getting recent notifications', { userAddress, limit });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('*')
        .eq('user_address', userAddress)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error getting recent notifications:', error);
        throw new Error(`Failed to get recent notifications: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting recent notifications:', error);
      throw error;
    }
  }

  // =============================================================================
  // UPDATE OPERATIONS
  // =============================================================================

  /**
   * Mark notification as read
   */
  static async markAsRead(id: string): Promise<NotificationRow> {
    try {
      logger.info('Marking notification as read', { id });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error marking notification as read:', error);
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }

      logger.info('Notification marked as read successfully', { id });
      return data;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userAddress: string): Promise<number> {
    try {
      logger.info('Marking all notifications as read', { userAddress });

      const { count, error } = await supabase.getClient()
        .from(this.table)
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_address', userAddress)
        .eq('is_read', false);

      if (error) {
        logger.error('Error marking all notifications as read:', error);
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
      }

      logger.info('All notifications marked as read successfully', { userAddress, count });
      return count || 0;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Update notification
   */
  static async update(id: string, updates: NotificationUpdate): Promise<NotificationRow> {
    try {
      logger.info('Updating notification', { id, updates });

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating notification:', error);
        throw new Error(`Failed to update notification: ${error.message}`);
      }

      logger.info('Notification updated successfully', { id });
      return data;
    } catch (error) {
      logger.error('Error updating notification:', error);
      throw error;
    }
  }

  // =============================================================================
  // DELETE OPERATIONS
  // =============================================================================

  /**
   * Delete notification by ID
   */
  static async deleteById(id: string): Promise<void> {
    try {
      logger.info('Deleting notification by ID', { id });

      const { error } = await supabase.getClient()
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting notification:', error);
        throw new Error(`Failed to delete notification: ${error.message}`);
      }

      logger.info('Notification deleted successfully', { id });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete old notifications
   */
  static async deleteOld(daysOld: number = 30): Promise<number> {
    try {
      logger.info('Deleting old notifications', { daysOld });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { count, error } = await supabase.getClient()
        .from(this.table)
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        logger.error('Error deleting old notifications:', error);
        throw new Error(`Failed to delete old notifications: ${error.message}`);
      }

      logger.info('Old notifications deleted successfully', { count });
      return count || 0;
    } catch (error) {
      logger.error('Error deleting old notifications:', error);
      throw error;
    }
  }

  // =============================================================================
  // NOTIFICATION TYPES
  // =============================================================================

  /**
   * Create position update notification
   */
  static async createPositionUpdateNotification(
    userAddress: string,
    positionData: any,
    updateType: 'OPENED' | 'CLOSED' | 'CLAIMED'
  ): Promise<NotificationRow> {
    const messages = {
      OPENED: `Your position has been opened in market "${positionData.marketId}"`,
      CLOSED: `Your position has been closed in market "${positionData.marketId}"`,
      CLAIMED: `You have claimed rewards from your position in market "${positionData.marketId}"`
    };

    return await this.create({
      user_address: userAddress,
      type: 'POSITION_UPDATE',
      title: `Position ${updateType.toLowerCase()}`,
      message: messages[updateType],
      data: {
        positionId: positionData.positionId,
        marketId: positionData.marketId,
        updateType,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create market update notification
   */
  static async createMarketUpdateNotification(
    userAddress: string,
    marketData: any,
    updateType: 'CREATED' | 'SETTLED' | 'UPDATED'
  ): Promise<NotificationRow> {
    const messages = {
      CREATED: `A new market "${marketData.title}" has been created`,
      SETTLED: `Market "${marketData.title}" has been settled`,
      UPDATED: `Market "${marketData.title}" has been updated`
    };

    return await this.create({
      user_address: userAddress,
      type: 'MARKET_UPDATE',
      title: `Market ${updateType.toLowerCase()}`,
      message: messages[updateType],
      data: {
        marketId: marketData.marketId,
        marketTitle: marketData.title,
        updateType,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create system notification
   */
  static async createSystemNotification(
    userAddress: string,
    title: string,
    message: string,
    data?: any
  ): Promise<NotificationRow> {
    return await this.create({
      user_address: userAddress,
      type: 'SYSTEM',
      title,
      message,
      data: data || {}
    });
  }

  /**
   * Create reward notification
   */
  static async createRewardNotification(
    userAddress: string,
    rewardData: any
  ): Promise<NotificationRow> {
    return await this.create({
      user_address: userAddress,
      type: 'REWARD',
      title: 'Reward Claimed',
      message: `You have received a reward of ${rewardData.amount} tokens`,
      data: {
        rewardType: rewardData.type,
        amount: rewardData.amount,
        token: rewardData.token,
        timestamp: new Date().toISOString()
      }
    });
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  /**
   * Create notifications for all users
   */
  static async createBroadcastNotification(
    title: string,
    message: string,
    type: 'SYSTEM' | 'MARKET_UPDATE' = 'SYSTEM',
    data?: any
  ): Promise<number> {
    try {
      logger.info('Creating broadcast notification', { title, type });

      // Get all active users
      const { data: users, error } = await supabase.getClient()
        .from(TABLES.USERS)
        .select('address')
        .eq('is_active', true);

      if (error) {
        logger.error('Error getting users for broadcast:', error);
        throw new Error(`Failed to get users for broadcast: ${error.message}`);
      }

      if (!users || users.length === 0) {
        logger.info('No active users found for broadcast');
        return 0;
      }

      // Create notifications for all users
      const notifications = users.map(user => ({
        user_address: user.address,
        type,
        title,
        message,
        data: data || {}
      }));

      const created = await this.createMultiple(notifications);
      
      logger.info('Broadcast notification created successfully', { count: created.length });
      return created.length;
    } catch (error) {
      logger.error('Error creating broadcast notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    try {
      logger.info('Getting notification statistics');

      const { data, error } = await supabase.getClient()
        .from(this.table)
        .select('is_read, type');

      if (error) {
        logger.error('Error getting notification statistics:', error);
        throw new Error(`Failed to get notification statistics: ${error.message}`);
      }

      const notifications = data || [];
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        byType: notifications.reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      logger.error('Error getting notification statistics:', error);
      throw error;
    }
  }
}
