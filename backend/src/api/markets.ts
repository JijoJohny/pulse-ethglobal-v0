import express from 'express';
import { Request, Response } from 'express';
import { MarketService } from '../services/market';
import { TheGraphService } from '../services/thegraph';
import { RootstockService } from '../services/rootstock';
import { logger } from '../utils/logger';
import { validateMarketId, validateMarketQuery } from '../utils/validation';

const router = express.Router();
const marketService = new MarketService();
const theGraphService = new TheGraphService();
const rootstockService = new RootstockService();

// =============================================================================
// GET /api/markets
// Get all markets with optional filtering
// =============================================================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, network } = req.query;
    
    // Validate query parameters
    const validation = validateMarketQuery(req.query);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validation.error.details[0].message
      });
    }

    logger.info('Fetching markets', { page, limit, status, network });

    // Get markets from The Graph
    const markets = await theGraphService.getMarkets({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      network: network as string
    });

    res.json({
      success: true,
      data: markets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: markets.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching markets:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch markets'
    });
  }
});

// =============================================================================
// GET /api/markets/:id
// Get specific market by ID
// =============================================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate market ID
    const validation = validateMarketId(id);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid market ID format'
      });
    }

    logger.info('Fetching market', { id });

    // Get market from The Graph
    const market = await theGraphService.getMarket(id);
    
    if (!market) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Market not found'
      });
    }

    // Get additional market data from Rootstock
    const marketData = await rootstockService.getMarketData(id);
    
    res.json({
      success: true,
      data: {
        ...market,
        ...marketData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching market:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch market'
    });
  }
});

// =============================================================================
// GET /api/markets/:id/positions
// Get positions for a specific market
// =============================================================================
router.get('/:id/positions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, user } = req.query;
    
    // Validate market ID
    const validation = validateMarketId(id);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid market ID format'
      });
    }

    logger.info('Fetching market positions', { id, page, limit, user });

    // Get positions from The Graph
    const positions = await theGraphService.getMarketPositions(id, {
      page: Number(page),
      limit: Number(limit),
      user: user as string
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
    logger.error('Error fetching market positions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch market positions'
    });
  }
});

// =============================================================================
// GET /api/markets/:id/analytics
// Get analytics for a specific market
// =============================================================================
router.get('/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { timeframe = '24h' } = req.query;
    
    // Validate market ID
    const validation = validateMarketId(id);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid market ID format'
      });
    }

    logger.info('Fetching market analytics', { id, timeframe });

    // Get analytics from The Graph
    const analytics = await theGraphService.getMarketAnalytics(id, timeframe as string);
    
    // Get additional analytics from Rootstock
    const marketAnalytics = await rootstockService.getMarketAnalytics(id);

    res.json({
      success: true,
      data: {
        ...analytics,
        ...marketAnalytics
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
// POST /api/markets/:id/settle
// Settle a market (admin only)
// =============================================================================
router.post('/:id/settle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { settlementTick, settlementValue } = req.body;
    
    // Validate market ID
    const validation = validateMarketId(id);
    if (validation.error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid market ID format'
      });
    }

    // Validate settlement data
    if (!settlementTick && !settlementValue) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Settlement tick or value is required'
      });
    }

    logger.info('Settling market', { id, settlementTick, settlementValue });

    // Settle market on Rootstock
    const result = await rootstockService.settleMarket(id, {
      settlementTick,
      settlementValue
    });

    res.json({
      success: true,
      data: result,
      message: 'Market settled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error settling market:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to settle market'
    });
  }
});

export default router;
