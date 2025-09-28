import express from 'express';
import { Request, Response } from 'express';
import { TheGraphService } from '../services/thegraph';
import { logger } from '../utils/logger';
import { validateUserAddress } from '../utils/validation';

const router = express.Router();
const theGraphService = new TheGraphService();

// =============================================================================
// GET /api/users/:address
// Get user profile and basic information
// =============================================================================
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Validate user address
    const validation = validateUserAddress(address);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid user address format'
      });
    }

    logger.info('Fetching user profile', { address });

    // Get user stats from The Graph
    const userStats = await theGraphService.getUserStats(address);
    
    if (!userStats) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Get user positions for additional context
    const userPositions = await theGraphService.getUserPositions(address, {
      page: 1,
      limit: 10
    });

    res.json({
      success: true,
      data: {
        address: userStats.address,
        totalPositions: userStats.totalPositions,
        totalVolume: userStats.totalVolume,
        totalPnL: userStats.totalPnL,
        winningPositions: userStats.winningPositions,
        losingPositions: userStats.losingPositions,
        winRate: userStats.winRate,
        averagePositionSize: userStats.averagePositionSize,
        firstPositionAt: userStats.firstPositionAt,
        lastPositionAt: userStats.lastPositionAt,
        recentPositions: userPositions
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user profile'
    });
  }
});

// =============================================================================
// GET /api/users/:address/stats
// Get detailed user statistics
// =============================================================================
router.get('/:address/stats', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Validate user address
    const validation = validateUserAddress(address);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid user address format'
      });
    }

    logger.info('Fetching user statistics', { address });

    // Get user stats from The Graph
    const stats = await theGraphService.getUserStats(address);

    if (!stats) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user statistics'
    });
  }
});

// =============================================================================
// GET /api/users/:address/positions
// Get all positions for a user
// =============================================================================
router.get('/:address/positions', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    // Validate user address
    const validation = validateUserAddress(address);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid user address format'
      });
    }

    logger.info('Fetching user positions', { address, page, limit, status });

    // Get positions from The Graph
    const positions = await theGraphService.getUserPositions(address, {
      page: Number(page),
      limit: Number(limit),
      status: status as string
    });

    res.json({
      success: true,
      data: positions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: positions.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user positions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user positions'
    });
  }
});

// =============================================================================
// GET /api/users/:address/portfolio
// Get user portfolio summary
// =============================================================================
router.get('/:address/portfolio', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Validate user address
    const validation = validateUserAddress(address);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid user address format'
      });
    }

    logger.info('Fetching user portfolio', { address });

    // Get user stats and positions
    const [stats, positions] = await Promise.all([
      theGraphService.getUserStats(address),
      theGraphService.getUserPositions(address, { page: 1, limit: 100 })
    ]);

    if (!stats) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Calculate portfolio metrics
    const openPositions = positions.filter((pos: any) => pos.outcome === 'OPEN');
    const settledPositions = positions.filter((pos: any) => pos.outcome !== 'OPEN');
    
    const totalInvested = positions.reduce((sum: number, pos: any) => 
      sum + parseFloat(pos.costBasis || '0'), 0
    );
    
    const totalValue = settledPositions.reduce((sum: number, pos: any) => {
      if (pos.outcome === 'WIN') {
        return sum + parseFloat(pos.quantity || '0');
      }
      return sum;
    }, 0);

    const portfolio = {
      address: stats.address,
      summary: {
        totalPositions: stats.totalPositions,
        openPositions: openPositions.length,
        settledPositions: settledPositions.length,
        totalInvested,
        totalValue,
        totalPnL: stats.totalPnL,
        winRate: stats.winRate
      },
      performance: {
        winningPositions: stats.winningPositions,
        losingPositions: stats.losingPositions,
        averagePositionSize: stats.averagePositionSize,
        bestPerformingMarket: findBestPerformingMarket(positions || []),
        worstPerformingMarket: findWorstPerformingMarket(positions || [])
      },
      timeline: {
        firstPositionAt: stats.firstPositionAt,
        lastPositionAt: stats.lastPositionAt,
        totalVolume: stats.totalVolume
      }
    };

    res.json({
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user portfolio:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user portfolio'
    });
  }
});

// =============================================================================
// GET /api/users/:address/leaderboard
// Get user leaderboard position
// =============================================================================
router.get('/:address/leaderboard', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { timeframe = 'all' } = req.query;
    
    // Validate user address
    const validation = validateUserAddress(address);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid user address format'
      });
    }

    logger.info('Fetching user leaderboard position', { address, timeframe });

    // This would require additional implementation to get leaderboard data
    // For now, returning basic ranking information
    const userStats = await theGraphService.getUserStats(address);

    if (!userStats) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Placeholder leaderboard data
    const leaderboardData = {
      user: {
        address: userStats.address,
        rank: 'N/A', // Would need to calculate this
        totalPnL: userStats.totalPnL,
        winRate: userStats.winRate,
        totalVolume: userStats.totalVolume
      },
      timeframe,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: leaderboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user leaderboard:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user leaderboard'
    });
  }
});

// =============================================================================
// PRIVATE HELPER METHODS
// =============================================================================

/**
 * Find best performing market for user
 */
function findBestPerformingMarket(positions: any[]): any {
  if (!positions || positions.length === 0) {
    return null;
  }
  
  const marketPerformance = positions.reduce((acc: any, pos: any) => {
    if (!acc[pos.market]) {
      acc[pos.market] = { wins: 0, losses: 0, totalPnL: 0 };
    }
    
    if (pos.outcome === 'WIN') {
      acc[pos.market].wins += 1;
      acc[pos.market].totalPnL += parseFloat(pos.quantity || '0') - parseFloat(pos.costBasis || '0');
    } else if (pos.outcome === 'LOSS') {
      acc[pos.market].losses += 1;
      acc[pos.market].totalPnL -= parseFloat(pos.costBasis || '0');
    }
    
    return acc;
  }, {});

  let bestMarket = null;
  let bestPnL = -Infinity;

  for (const [market, perf] of Object.entries(marketPerformance)) {
    if ((perf as any).totalPnL > bestPnL) {
      bestPnL = (perf as any).totalPnL;
      bestMarket = market;
    }
  }

  return bestMarket ? { market: bestMarket, pnl: bestPnL } : null;
}

/**
 * Find worst performing market for user
 */
function findWorstPerformingMarket(positions: any[]): any {
  if (!positions || positions.length === 0) {
    return null;
  }
  
  const marketPerformance = positions.reduce((acc: any, pos: any) => {
    if (!acc[pos.market]) {
      acc[pos.market] = { wins: 0, losses: 0, totalPnL: 0 };
    }
    
    if (pos.outcome === 'WIN') {
      acc[pos.market].wins += 1;
      acc[pos.market].totalPnL += parseFloat(pos.quantity || '0') - parseFloat(pos.costBasis || '0');
    } else if (pos.outcome === 'LOSS') {
      acc[pos.market].losses += 1;
      acc[pos.market].totalPnL -= parseFloat(pos.costBasis || '0');
    }
    
    return acc;
  }, {});

  let worstMarket = null;
  let worstPnL = Infinity;

  for (const [market, perf] of Object.entries(marketPerformance)) {
    if ((perf as any).totalPnL < worstPnL) {
      worstPnL = (perf as any).totalPnL;
      worstMarket = market;
    }
  }

  return worstMarket ? { market: worstMarket, pnl: worstPnL } : null;
}

export default router;
