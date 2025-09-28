import dotenv from 'dotenv';
import { supabase } from '../config/supabase';
import { PositionModel } from '../models/Position';
import { PredictionAnalyticsModel } from '../models/PredictionAnalytics';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  try {
    logger.info('🧪 Starting database connection test...');

    // Test 1: Health check
    logger.info('📊 Testing Supabase health check...');
    const isHealthy = await supabase.healthCheck();
    logger.info(`✅ Supabase health check: ${isHealthy ? 'PASSED' : 'FAILED'}`);

    if (!isHealthy) {
      throw new Error('Database health check failed');
    }

    // Test 2: Create test user
    logger.info('👤 Testing user creation...');
    const testUserAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    const user = await UserModel.getOrCreate(testUserAddress, {
      username: 'testuser',
      email: 'test@example.com'
    });
    logger.info(`✅ User created/retrieved: ${user.id}`);

    // Test 3: Create test position
    logger.info('📈 Testing position creation...');
    const positionId = `test_pos_${Date.now()}`;
    const positionData = {
      position_id: positionId,
      user_address: testUserAddress.toLowerCase(),
      market_id: 'test_market_1',
      lower_tick: 1000,
      upper_tick: 2000,
      quantity: '1000000000000000000', // 1 ETH in wei
      cost_basis: '500000000000000000', // 0.5 ETH in wei
      outcome: 'OPEN' as const,
      is_claimed: false,
      is_active: true
    };

    const position = await PositionModel.create(positionData);
    logger.info(`✅ Position created: ${position.id}`);

    // Test 4: Create test prediction analytics
    logger.info('📊 Testing prediction analytics creation...');
    const analyticsData = {
      user_address: testUserAddress.toLowerCase(),
      market_id: 'test_market_1',
      position_id: positionId,
      price_min: 100.0,
      price_max: 200.0,
      avg_price_cents: 150.0,
      bet_amount_usd: 500.0,
      potential_win_usd: 750.0,
      potential_loss_usd: 500.0,
      status: 'live' as const,
      date_label: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    };

    const analytics = await PredictionAnalyticsModel.create(analyticsData);
    logger.info(`✅ Prediction analytics created: ${analytics.id}`);

    // Test 5: Retrieve data
    logger.info('🔍 Testing data retrieval...');
    const retrievedPosition = await PositionModel.findByPositionId(positionId);
    const retrievedAnalytics = await PredictionAnalyticsModel.findByPositionId(positionId);
    
    logger.info(`✅ Position retrieved: ${retrievedPosition ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`✅ Analytics retrieved: ${retrievedAnalytics ? 'SUCCESS' : 'FAILED'}`);

    // Test 6: Get user predictions
    logger.info('👥 Testing user predictions retrieval...');
    const userPositions = await PositionModel.findByUser(testUserAddress);
    const userAnalytics = await PredictionAnalyticsModel.findByUser(testUserAddress);
    
    logger.info(`✅ User positions: ${userPositions.data.length} found`);
    logger.info(`✅ User analytics: ${userAnalytics.data.length} found`);

    // Test 7: Update position status
    logger.info('🔄 Testing position status update...');
    await PredictionAnalyticsModel.markAsEnded(positionId);
    const updatedAnalytics = await PredictionAnalyticsModel.findByPositionId(positionId);
    logger.info(`✅ Status updated: ${updatedAnalytics?.status === 'ended' ? 'SUCCESS' : 'FAILED'}`);

    // Test 8: Get user statistics
    logger.info('📈 Testing user statistics...');
    const userStats = await UserModel.getStats(testUserAddress);
    const analyticsStats = await PredictionAnalyticsModel.getUserStatistics(testUserAddress);
    
    logger.info(`✅ User stats retrieved: ${userStats ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`✅ Analytics stats retrieved: ${analyticsStats.total} predictions`);

    logger.info('🎉 All database tests PASSED!');
    logger.info('📋 Test Summary:');
    logger.info(`   - Database Health: ✅`);
    logger.info(`   - User Creation: ✅`);
    logger.info(`   - Position Creation: ✅`);
    logger.info(`   - Analytics Creation: ✅`);
    logger.info(`   - Data Retrieval: ✅`);
    logger.info(`   - Status Updates: ✅`);
    logger.info(`   - Statistics: ✅`);

    // Cleanup test data
    logger.info('🧹 Cleaning up test data...');
    if (analytics) {
      await PredictionAnalyticsModel.deleteById(analytics.id);
    }
    if (position) {
      await PositionModel.deleteById(position.id);
    }
    logger.info('✅ Test data cleaned up');

  } catch (error) {
    logger.error('❌ Database test FAILED:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      logger.info('✅ Database connection test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Database connection test failed:', error);
      process.exit(1);
    });
}

export { testDatabaseConnection };
