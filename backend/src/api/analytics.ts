import express from 'express';
import { Request, Response } from 'express';
import { TheGraphService } from '../services/thegraph';
import { RootstockService } from '../services/rootstock';
import { logger } from '../utils/logger';

const router = express.Router();
const theGraphService = new TheGraphService();
const rootstockService = new RootstockService();

// =============================================================================
// GET /api/analytics/overview
// Get platform overview analytics
// =============================================================================
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    logger.info('Fetching platform overview analytics', { timeframe });

    // Get all markets for overview calculations
    const markets = await theGraphService.getMarkets({
      page: 1,
      limit: 1000
    });

    // Calculate platform-wide metrics
    const totalMarkets = markets.length;
    const activeMarkets = markets.filter(m => m.isActive && !m.isSettled).length;
    const settledMarkets = markets.filter(m => m.isSettled).length;
    
    const totalVolume = markets.reduce((sum: number, market: any) => 
      sum + parseFloat(market.totalVolume || '0'), 0
    );
    
    const totalLiquidity = markets.reduce((sum: number, market: any) => 
      sum + parseFloat(market.totalLiquidity || '0'), 0
    );
    
    const totalTrades = markets.reduce((sum: number, market: any) => 
      sum + parseInt(market.totalTrades || '0'), 0
    );

    // Calculate unique users
    const allPositions = markets.flatMap((market: any) => market.positions || []);
    const uniqueUsers = new Set(allPositions.map((pos: any) => pos.user)).size;

    const overview = {
      platform: {
        totalMarkets,
        activeMarkets,
        settledMarkets,
        totalVolume: totalVolume.toString(),
        totalLiquidity: totalLiquidity.toString(),
        totalTrades,
        uniqueUsers
      },
      timeframe,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching platform overview analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch platform overview analytics'
    });
  }
});

// =============================================================================
// GET /api/analytics/markets
// Get market analytics summary
// =============================================================================
router.get('/markets', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, sortBy = 'volume', sortOrder = 'desc' } = req.query;
    
    logger.info('Fetching market analytics', { page, limit, sortBy, sortOrder });

    // Get markets with analytics
    const markets = await theGraphService.getMarkets({
      page: Number(page),
      limit: Number(limit)
    });

    // Calculate analytics for each market
    const marketAnalytics = await Promise.all(
      markets.map(async (market: any) => {
        try {
          const analytics = await theGraphService.getMarketAnalytics(
            market.marketId, 
            '24h'
          );
          
          return {
            ...market,
            analytics
          };
        } catch (error) {
          logger.error(`Error getting analytics for market ${market.marketId}:`, error);
          return {
            ...market,
            analytics: null
          };
        }
      })
    );

    // Sort markets based on sortBy parameter
    const sortedMarkets = marketAnalytics.sort((a: any, b: any) => {
      const aValue = parseFloat(a.analytics?.[sortBy as string] || '0');
      const bValue = parseFloat(b.analytics?.[sortBy as string] || '0');
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    res.json({
      success: true,
      data: sortedMarkets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: sortedMarkets.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching market analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch market analytics'
    });
  }
});

// =============================================================================
// GET /api/analytics/volume
// Get volume analytics
// =============================================================================
router.get('/volume', async (req: Request, res: Response) => {
  try {
    const { timeframe = '7d', granularity = 'daily' } = req.query;
    
    logger.info('Fetching volume analytics', { timeframe, granularity });

    // Get all markets for volume calculations
    const markets = await theGraphService.getMarkets({
      page: 1,
      limit: 1000
    });

    // Calculate volume data points
    const volumeData = calculateVolumeData(markets, timeframe as string, granularity as string);

    res.json({
      success: true,
      data: {
        timeframe,
        granularity,
        volumeData,
        summary: {
          totalVolume: volumeData.reduce((sum: number, point: any) => sum + point.volume, 0),
          averageVolume: volumeData.reduce((sum: number, point: any) => sum + point.volume, 0) / volumeData.length,
          peakVolume: Math.max(...volumeData.map((point: any) => point.volume)),
          peakVolumeDate: volumeData.find((point: any) => 
            point.volume === Math.max(...volumeData.map((p: any) => p.volume))
          )?.timestamp
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching volume analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch volume analytics'
    });
  }
});

// =============================================================================
// GET /api/analytics/users
// Get user analytics
// =============================================================================
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, sortBy = 'volume', sortOrder = 'desc' } = req.query;
    
    logger.info('Fetching user analytics', { page, limit, sortBy, sortOrder });

    // Get all markets to extract user data
    const markets = await theGraphService.getMarkets({
      page: 1,
      limit: 1000
    });

    // Extract and aggregate user data
    const userMap = new Map();
    
    markets.forEach((market: any) => {
      const positions = market.positions || [];
      positions.forEach((position: any) => {
        const user = position.user;
        if (!userMap.has(user)) {
          userMap.set(user, {
            address: user,
            totalPositions: 0,
            totalVolume: 0,
            totalPnL: 0,
            winningPositions: 0,
            losingPositions: 0,
            markets: new Set()
          });
        }
        
        const userData = userMap.get(user);
        userData.totalPositions += 1;
        userData.totalVolume += parseFloat(position.costBasis || '0');
        userData.markets.add(market.marketId);
        
        if (position.outcome === 'WIN') {
          userData.winningPositions += 1;
          userData.totalPnL += parseFloat(position.quantity || '0') - parseFloat(position.costBasis || '0');
        } else if (position.outcome === 'LOSS') {
          userData.losingPositions += 1;
          userData.totalPnL -= parseFloat(position.costBasis || '0');
        }
      });
    });

    // Convert to array and calculate additional metrics
    const users = Array.from(userMap.values()).map((user: any) => ({
      ...user,
      markets: user.markets.size,
      winRate: user.totalPositions > 0 ? (user.winningPositions / (user.winningPositions + user.losingPositions)) * 100 : 0,
      averagePositionSize: user.totalPositions > 0 ? user.totalVolume / user.totalPositions : 0
    }));

    // Sort users
    const sortedUsers = users.sort((a: any, b: any) => {
      const aValue = a[sortBy as string] || 0;
      const bValue = b[sortBy as string] || 0;
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: users.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user analytics'
    });
  }
});

// =============================================================================
// GET /api/analytics/performance
// Get platform performance metrics
// =============================================================================
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    logger.info('Fetching platform performance metrics', { timeframe });

    // Get all markets for performance calculations
    const markets = await theGraphService.getMarkets({
      page: 1,
      limit: 1000
    });

    // Calculate performance metrics
    const allPositions = markets.flatMap((market: any) => market.positions || []);
    
    const totalPositions = allPositions.length;
    const winningPositions = allPositions.filter((pos: any) => pos.outcome === 'WIN').length;
    const losingPositions = allPositions.filter((pos: any) => pos.outcome === 'LOSS').length;
    const openPositions = allPositions.filter((pos: any) => pos.outcome === 'OPEN').length;
    
    const overallWinRate = totalPositions > 0 ? (winningPositions / (winningPositions + losingPositions)) * 100 : 0;
    
    const totalVolume = allPositions.reduce((sum: number, pos: any) => 
      sum + parseFloat(pos.costBasis || '0'), 0
    );
    
    const totalPnL = allPositions.reduce((sum: number, pos: any) => {
      if (pos.outcome === 'WIN') {
        return sum + (parseFloat(pos.quantity || '0') - parseFloat(pos.costBasis || '0'));
      } else if (pos.outcome === 'LOSS') {
        return sum - parseFloat(pos.costBasis || '0');
      }
      return sum;
    }, 0);

    const performance = {
      positions: {
        total: totalPositions,
        winning: winningPositions,
        losing: losingPositions,
        open: openPositions
      },
      metrics: {
        overallWinRate,
        totalVolume,
        totalPnL,
        averagePositionSize: totalPositions > 0 ? totalVolume / totalPositions : 0
      },
      timeframe,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching platform performance metrics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch platform performance metrics'
    });
  }
});

// =============================================================================
// PRIVATE HELPER METHODS
// =============================================================================

/**
 * Calculate volume data points for charts
 */
function calculateVolumeData(markets: any[], timeframe: string, granularity: string): any[] {
  // This is a simplified implementation
  // In a real scenario, you'd want to aggregate volume data by time periods
  
  const dataPoints = [];
  const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Calculate volume for this day (simplified)
    const volume = markets.reduce((sum: number, market: any) => 
      sum + parseFloat(market.totalVolume || '0') / days, 0
    );
    
    dataPoints.push({
      timestamp: date.toISOString(),
      volume,
      trades: Math.floor(Math.random() * 100), // Placeholder
      liquidity: volume * 0.8 // Placeholder
    });
  }
  
  return dataPoints;
}

export default router;
