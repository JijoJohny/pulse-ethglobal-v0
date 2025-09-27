# Supabase Integration Setup Guide

This guide will help you set up Supabase for the Pulse-08 backend with complete database services, real-time subscriptions, and authentication.

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose your organization and region
3. Set a strong database password
4. Wait for the project to be created

### 2. Get Your Credentials

In your Supabase dashboard, go to **Settings > API**:

```bash
# Copy these values to your .env file
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Run Database Setup

```bash
# Install dependencies
npm install

# Run the setup script
npm run setup:supabase
```

## 📊 Database Schema

The setup creates the following tables:

### Core Tables
- **markets** - Market information and configuration
- **positions** - User positions in markets
- **users** - User profiles and authentication data
- **user_profiles** - Extended user profile information
- **user_stats** - User performance statistics

### Analytics Tables
- **market_analytics** - Market performance metrics
- **trades** - Individual trade records
- **notifications** - User notifications system

### System Tables
- **audit_logs** - System audit trail
- **system_config** - Application configuration

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional: Database connection (for direct access if needed)
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=your_database_password
DB_SSL=true
```

### Row Level Security (RLS)

The setup automatically enables RLS on all tables with appropriate policies:

- **Public read access** for markets, positions, and user data
- **User-specific access** for notifications and private data
- **Admin access** for system configuration and audit logs

## 🏗️ Architecture

### Service Layer

```
src/
├── config/
│   └── supabase.ts          # Supabase client configuration
├── models/
│   ├── Market.ts            # Market data operations
│   ├── Position.ts          # Position data operations
│   ├── User.ts              # User data operations
│   ├── Analytics.ts         # Analytics calculations
│   └── Notification.ts      # Notification system
├── services/
│   ├── supabaseService.ts   # Main Supabase service
│   ├── market.ts            # Market business logic
│   └── position.ts          # Position business logic
└── migrations/
    └── 001_initial_schema.sql # Database schema
```

### Data Flow

1. **API Requests** → Backend Services
2. **Backend Services** → Supabase Models
3. **Supabase Models** → Supabase Database
4. **Real-time Updates** → WebSocket Clients

## 📡 Real-time Features

### WebSocket Subscriptions

The backend provides real-time updates for:

```typescript
// Subscribe to market updates
const marketSubscription = supabaseService.subscribeToMarkets((payload) => {
  console.log('Market updated:', payload);
});

// Subscribe to user position updates
const positionSubscription = supabaseService.subscribeToUserPositions(
  userAddress, 
  (payload) => {
    console.log('Position updated:', payload);
  }
);

// Subscribe to user statistics updates
const statsSubscription = supabaseService.subscribeToUserStats(
  userAddress,
  (payload) => {
    console.log('Stats updated:', payload);
  }
);
```

### Event Types

- **INSERT** - New records created
- **UPDATE** - Existing records modified
- **DELETE** - Records removed

## 🔐 Authentication

### User Management

```typescript
// Create or get user
const user = await supabaseService.getOrCreateUser(address, {
  username: 'john_doe',
  email: 'john@example.com'
});

// Update user profile
const profile = await supabaseService.updateUserProfile(address, {
  bio: 'Crypto trader',
  website: 'https://johndoe.com'
});

// Update user statistics
await supabaseService.updateUserStats(address);
```

### Row Level Security

Users can only access their own data:

```sql
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (user_address = auth.jwt() ->> 'sub');
```

## 📈 Analytics

### Market Analytics

```typescript
// Get market analytics
const analytics = await supabaseService.getMarketStatistics(marketId);

// Calculate analytics from trades
const calculatedAnalytics = await AnalyticsModel.calculateMarketAnalytics(
  marketId, 
  '24h'
);
```

### Platform Analytics

```typescript
// Get platform overview
const platformStats = await supabaseService.getPlatformStats();

// Get user leaderboard
const leaderboard = await supabaseService.getUserLeaderboard({
  page: 1,
  limit: 20,
  sortBy: 'total_pnl',
  sortOrder: 'desc'
});
```

## 🔔 Notifications

### Creating Notifications

```typescript
// Position update notification
await NotificationModel.createPositionUpdateNotification(
  userAddress,
  positionData,
  'OPENED'
);

// Market update notification
await NotificationModel.createMarketUpdateNotification(
  userAddress,
  marketData,
  'SETTLED'
);

// System broadcast
await NotificationModel.createBroadcastNotification(
  'System Maintenance',
  'The platform will be under maintenance from 2-4 AM UTC',
  'SYSTEM'
);
```

### Managing Notifications

```typescript
// Get user notifications
const notifications = await NotificationModel.findByUser(userAddress, {
  page: 1,
  limit: 20,
  isRead: false
});

// Mark as read
await NotificationModel.markAsRead(notificationId);

// Mark all as read
await NotificationModel.markAllAsRead(userAddress);
```

## 🛠️ Development

### Running the Backend

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Database Migrations

```bash
# Run setup script
npm run setup:supabase

# Manual migration (if needed)
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/001_initial_schema.sql
```

### Testing

```bash
# Run tests
npm test

# Test with coverage
npm run test:coverage
```

## 📊 Monitoring

### Health Checks

```typescript
// Check database health
const isHealthy = await supabaseService.healthCheck();

// Get platform statistics
const stats = await supabaseService.getPlatformStats();
```

### Audit Logs

All important operations are logged:

```typescript
// Audit logs are automatically created for:
// - Market creation/settlement
// - Position opening/closing
// - User registration/updates
// - System configuration changes
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check your SUPABASE_URL and keys
   - Verify your project is active
   - Check firewall settings

2. **Permission Denied**
   - Verify RLS policies are set up correctly
   - Check user authentication
   - Ensure service role key is used for admin operations

3. **Migration Failed**
   - Check SQL syntax in migration file
   - Verify database permissions
   - Run migration manually if needed

### Debug Mode

Enable debug logging:

```bash
DEBUG=true npm run dev
```

### Database Browser

Use Supabase dashboard to:
- Browse data in real-time
- Run SQL queries
- Monitor performance
- Manage RLS policies

## 🚀 Production Deployment

### Security Checklist

- [ ] Enable RLS on all tables
- [ ] Set up proper API keys
- [ ] Configure CORS settings
- [ ] Set up monitoring and alerts
- [ ] Enable audit logging
- [ ] Configure backup strategy

### Performance Optimization

- [ ] Create appropriate indexes
- [ ] Optimize queries
- [ ] Set up connection pooling
- [ ] Monitor query performance
- [ ] Configure caching strategy

### Scaling

- [ ] Set up read replicas
- [ ] Configure CDN for static assets
- [ ] Implement rate limiting
- [ ] Set up horizontal scaling
- [ ] Monitor resource usage

## 📚 API Reference

### Market Operations

```typescript
// Get markets
GET /api/markets?page=1&limit=20&status=active

// Get market by ID
GET /api/markets/:id

// Create market
POST /api/markets
{
  "title": "Market Title",
  "description": "Market Description",
  "minTick": -1000,
  "maxTick": 1000,
  "startTimestamp": "2024-01-01T00:00:00Z",
  "endTimestamp": "2024-01-08T00:00:00Z",
  "liquidityParameter": "1000000000000000000"
}
```

### Position Operations

```typescript
// Get user positions
GET /api/positions/user/:address?page=1&limit=20

// Open position
POST /api/positions/open
{
  "user": "0x...",
  "marketId": "market_123",
  "lowerTick": -500,
  "upperTick": 500,
  "quantity": "1000000000000000000",
  "maxCost": "1000000000000000000"
}
```

### Analytics

```typescript
// Get platform overview
GET /api/analytics/overview

// Get market analytics
GET /api/markets/:id/analytics?timeframe=24h

// Get user leaderboard
GET /api/analytics/users?sortBy=total_pnl&sortOrder=desc
```

## 🎯 Next Steps

1. **Set up your Supabase project** using this guide
2. **Configure environment variables** with your credentials
3. **Run the setup script** to create the database schema
4. **Test the API endpoints** to ensure everything works
5. **Set up monitoring** and alerts for production use
6. **Configure authentication** for user management
7. **Set up file storage** for user avatars and documents

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check the backend logs for error details
4. Verify your configuration and credentials

---

**Happy coding! 🚀**
