import express from 'express';
import { Request, Response } from 'express';
import { PositionService } from '../services/position';
import { TheGraphService } from '../services/thegraph';
import { RootstockService } from '../services/rootstock';
import { logger } from '../utils/logger';
import { validatePositionId, validatePositionQuery } from '../utils/validation';

const router = express.Router();
const positionService = new PositionService();
const theGraphService = new TheGraphService();
const rootstockService = new RootstockService();

// =============================================================================
// GET /api/positions
// Get all positions with optional filtering
// =============================================================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, user, market, status } = req.query;
    
    // Validate query parameters
    const validation = validatePositionQuery(req.query);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validation.error.details[0].message
      });
    }

    logger.info('Fetching positions', { page, limit, user, market, status });

    // Get positions from The Graph
    const positions = await theGraphService.getUserPositions(
      user as string || '',
      {
        page: Number(page),
        limit: Number(limit),
        status: status as string
      }
    );

    // If market filter is specified, filter positions by market
    let filteredPositions = positions;
    if (market) {
      filteredPositions = positions.filter((pos: any) => pos.market === market);
    }

    res.json({
      success: true,
      data: filteredPositions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredPositions.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching positions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch positions'
    });
  }
});

// =============================================================================
// GET /api/positions/:id
// Get specific position by ID
// =============================================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate position ID
    const validation = validatePositionId(id);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid position ID format'
      });
    }

    logger.info('Fetching position', { id });

    // Get position from The Graph
    const position = await theGraphService.getUserPositions('', {
      page: 1,
      limit: 1
    }).then(positions => positions.find((pos: any) => pos.positionId === id));
    
    if (!position) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Position not found'
      });
    }

    // Get additional position data from Rootstock
    const positionData = await rootstockService.getPositionData(id);
    
    res.json({
      success: true,
      data: {
        ...position,
        ...positionData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching position:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch position'
    });
  }
});

// =============================================================================
// GET /api/positions/user/:userAddress
// Get all positions for a specific user
// =============================================================================
router.get('/user/:userAddress', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    // Validate user address
    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid user address format'
      });
    }

    logger.info('Fetching user positions', { userAddress, page, limit, status });

    // Get positions from The Graph
    const positions = await theGraphService.getUserPositions(userAddress, {
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
// GET /api/positions/user/:userAddress/stats
// Get user position statistics
// =============================================================================
router.get('/user/:userAddress/stats', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;
    
    // Validate user address
    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid user address format'
      });
    }

    logger.info('Fetching user position stats', { userAddress });

    // Get user stats from The Graph
    const stats = await theGraphService.getUserStats(userAddress);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user position stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user position stats'
    });
  }
});

// =============================================================================
// POST /api/positions/open
// Open a new position
// =============================================================================
router.post('/open', async (req: Request, res: Response) => {
  try {
    const {
      user,
      marketId,
      lowerTick,
      upperTick,
      quantity,
      maxCost
    } = req.body;
    
    // Validate required fields
    if (!user || !marketId || !lowerTick || !upperTick || !quantity || !maxCost) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'All fields are required: user, marketId, lowerTick, upperTick, quantity, maxCost'
      });
    }

    // Validate user address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(user)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid user address format'
      });
    }

    logger.info('Opening position', { user, marketId, lowerTick, upperTick, quantity, maxCost });

    // Open position on Rootstock
    const result = await rootstockService.openPosition({
      user,
      marketId,
      lowerTick,
      upperTick,
      quantity,
      maxCost
    });

    res.json({
      success: true,
      data: result,
      message: 'Position opened successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error opening position:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to open position'
    });
  }
});

// =============================================================================
// POST /api/positions/:id/close
// Close a position
// =============================================================================
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate position ID
    const validation = validatePositionId(id);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid position ID format'
      });
    }

    logger.info('Closing position', { id });

    // Close position on Rootstock
    const result = await rootstockService.closePosition(id);

    res.json({
      success: true,
      data: result,
      message: 'Position closed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error closing position:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to close position'
    });
  }
});

// =============================================================================
// POST /api/positions/:id/claim
// Claim position rewards
// =============================================================================
router.post('/:id/claim', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate position ID
    const validation = validatePositionId(id);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid position ID format'
      });
    }

    logger.info('Claiming position rewards', { id });

    // Claim position rewards on Rootstock
    const result = await rootstockService.claimPositionRewards(id);

    res.json({
      success: true,
      data: result,
      message: 'Position rewards claimed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error claiming position rewards:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to claim position rewards'
    });
  }
});

export default router;
