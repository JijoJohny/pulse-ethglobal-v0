import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PositionModel } from '../models/Position';
import { PredictionAnalyticsModel } from '../models/PredictionAnalytics';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';

const router = Router();

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

const createPredictionValidation = [
  body('userAddress').isEthereumAddress().withMessage('Valid Ethereum address required'),
  body('marketId').isString().notEmpty().withMessage('Market ID is required'),
  body('lowerTick').isInt({ min: 0 }).withMessage('Valid lower tick required'),
  body('upperTick').isInt({ min: 0 }).withMessage('Valid upper tick required'),
  body('quantity').isString().notEmpty().withMessage('Quantity is required'),
  body('costBasis').isString().notEmpty().withMessage('Cost basis is required'),
  body('priceMin').optional().isFloat({ min: 0 }).withMessage('Valid price min required'),
  body('priceMax').optional().isFloat({ min: 0 }).withMessage('Valid price max required'),
  body('avgPriceCents').optional().isFloat({ min: 0 }).withMessage('Valid average price required'),
  body('betAmountUsd').optional().isFloat({ min: 0 }).withMessage('Valid bet amount required'),
  body('potentialWinUsd').optional().isFloat({ min: 0 }).withMessage('Valid potential win required'),
  body('potentialLossUsd').optional().isFloat({ min: 0 }).withMessage('Valid potential loss required'),
];

// =============================================================================
// CREATE PREDICTION
// =============================================================================

/**
 * @route POST /api/predictions
 * @desc Create a new prediction/position
 * @access Public
 */
router.post('/', createPredictionValidation, async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      userAddress,
      marketId,
      lowerTick,
      upperTick,
      quantity,
      costBasis,
      priceMin,
      priceMax,
      avgPriceCents,
      betAmountUsd,
      potentialWinUsd,
      potentialLossUsd
    } = req.body;

    logger.info('Creating new prediction', {
      userAddress,
      marketId,
      lowerTick,
      upperTick,
      quantity,
      costBasis
    });

    // Generate unique position ID
    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create position in database
    const positionData = {
      position_id: positionId,
      user_address: userAddress.toLowerCase(),
      market_id: marketId,
      lower_tick: parseInt(lowerTick),
      upper_tick: parseInt(upperTick),
      quantity,
      cost_basis: costBasis,
      outcome: 'OPEN' as const,
      is_claimed: false,
      is_active: true
    };

    const position = await PositionModel.create(positionData);

    // Create prediction analytics entry if UI data is provided
    let predictionAnalytics = null;
    if (priceMin && priceMax && avgPriceCents && betAmountUsd && potentialWinUsd && potentialLossUsd) {
      const analyticsData = {
        user_address: userAddress.toLowerCase(),
        market_id: marketId,
        position_id: positionId,
        price_min: parseFloat(priceMin),
        price_max: parseFloat(priceMax),
        avg_price_cents: parseFloat(avgPriceCents),
        bet_amount_usd: parseFloat(betAmountUsd),
        potential_win_usd: parseFloat(potentialWinUsd),
        potential_loss_usd: parseFloat(potentialLossUsd),
        status: 'live' as const,
        date_label: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      };

      predictionAnalytics = await PredictionAnalyticsModel.create(analyticsData);
    }

    // Get or create user
    await UserModel.getOrCreate(userAddress.toLowerCase());

    // Update user statistics
    await UserModel.updateStats(userAddress.toLowerCase(), {
      total_positions: 1, // This will be calculated properly by the function
    });

    logger.info('Prediction created successfully', {
      positionId,
      userId: position.id
    });

    res.status(201).json({
      success: true,
      message: 'Prediction created successfully',
      data: {
        position,
        predictionAnalytics
      }
    });

  } catch (error) {
    logger.error('Error creating prediction:', error);
    errorHandler(error, req, res, () => {});
  }
});

// =============================================================================
// GET USER PREDICTIONS
// =============================================================================

/**
 * @route GET /api/predictions/user/:address
 * @desc Get all predictions for a user
 * @access Public
 */
router.get('/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    logger.info('Getting user predictions', { address, page, limit, status });

    // Get positions
    const positionsResult = await PositionModel.findByUser(address, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      outcome: status as 'OPEN' | 'WIN' | 'LOSS'
    });

    // Get prediction analytics
    const analyticsResult = await PredictionAnalyticsModel.findByUser(address, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as 'live' | 'ended'
    });

    res.json({
      success: true,
      message: 'User predictions retrieved successfully',
      data: {
        positions: positionsResult.data,
        positionsTotal: positionsResult.total,
        analytics: analyticsResult.data,
        analyticsTotal: analyticsResult.total
      }
    });

  } catch (error) {
    logger.error('Error getting user predictions:', error);
    errorHandler(error, req, res, () => {});
  }
});

// =============================================================================
// GET PREDICTION BY ID
// =============================================================================

/**
 * @route GET /api/predictions/:id
 * @desc Get a specific prediction by position ID
 * @access Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info('Getting prediction by ID', { id });

    // Get position
    const position = await PositionModel.findByPositionId(id);
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Get prediction analytics
    const analytics = await PredictionAnalyticsModel.findByPositionId(id);

    res.json({
      success: true,
      message: 'Prediction retrieved successfully',
      data: {
        position,
        analytics
      }
    });

  } catch (error) {
    logger.error('Error getting prediction:', error);
    errorHandler(error, req, res, () => {});
  }
});

// =============================================================================
// UPDATE PREDICTION STATUS
// =============================================================================

/**
 * @route PATCH /api/predictions/:id/status
 * @desc Update prediction status
 * @access Public
 */
router.patch('/:id/status', [
  body('status').isIn(['live', 'ended']).withMessage('Valid status required'),
  body('outcome').optional().isIn(['OPEN', 'WIN', 'LOSS']).withMessage('Valid outcome required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, outcome } = req.body;

    logger.info('Updating prediction status', { id, status, outcome });

    // Update prediction analytics status
    if (status) {
      await PredictionAnalyticsModel.updateByPositionId(id, { status });
    }

    // Update position outcome if provided
    if (outcome) {
      await PositionModel.updateByPositionId(id, { outcome });
    }

    res.json({
      success: true,
      message: 'Prediction status updated successfully'
    });

  } catch (error) {
    logger.error('Error updating prediction status:', error);
    errorHandler(error, req, res, () => {});
  }
});

// =============================================================================
// GET USER STATISTICS
// =============================================================================

/**
 * @route GET /api/predictions/user/:address/stats
 * @desc Get user prediction statistics
 * @access Public
 */
router.get('/user/:address/stats', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    logger.info('Getting user prediction statistics', { address });

    // Get position statistics
    const positionStats = await PositionModel.getUserStatistics(address);

    // Get prediction analytics statistics
    const analyticsStats = await PredictionAnalyticsModel.getUserStatistics(address);

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        positions: positionStats,
        analytics: analyticsStats
      }
    });

  } catch (error) {
    logger.error('Error getting user statistics:', error);
    errorHandler(error, req, res, () => {});
  }
});

// =============================================================================
// DELETE PREDICTION
// =============================================================================

/**
 * @route DELETE /api/predictions/:id
 * @desc Delete a prediction (admin only)
 * @access Private
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info('Deleting prediction', { id });

    // Delete prediction analytics
    const analytics = await PredictionAnalyticsModel.findByPositionId(id);
    if (analytics) {
      await PredictionAnalyticsModel.deleteById(analytics.id);
    }

    // Delete position
    await PositionModel.deleteById(id);

    res.json({
      success: true,
      message: 'Prediction deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting prediction:', error);
    errorHandler(error, req, res, () => {});
  }
});

export default router;
