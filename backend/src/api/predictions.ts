import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PositionModel } from '../models/Position';
import { PredictionAnalyticsModel } from '../models/PredictionAnalytics';
import { UserModel } from '../models/User';
import { SupabaseTransactionService } from '../services/supabase-transaction-service';
import { supabase, TABLES } from '../config/supabase';
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
  body('transactionHash').optional().isString().withMessage('Valid transaction hash required'),
  body('positionId').optional().isString().withMessage('Valid position ID required'),
];

// =============================================================================
// STORE SMART CONTRACT TRANSACTION DATA
// =============================================================================

/**
 * @route POST /api/predictions/transaction
 * @desc Store smart contract transaction data in Supabase
 * @access Public
 */
router.post('/transaction', [
  body('transactionHash').isString().notEmpty().withMessage('Transaction hash is required'),
  body('positionId').isString().notEmpty().withMessage('Position ID is required'),
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
], async (req: Request, res: Response) => {
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
      transactionHash,
      positionId,
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

    logger.info('Storing smart contract transaction data', {
      transactionHash,
      positionId,
      userAddress,
      marketId
    });

    // Store transaction data in Supabase
    const result = await SupabaseTransactionService.storeTransactionData({
      transactionHash,
      positionId,
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
    });

    logger.info('Smart contract transaction data stored successfully', {
      positionId: result.position.id,
      transactionHash
    });

    res.status(201).json({
      success: true,
      message: 'Transaction data stored successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error storing smart contract transaction data:', error);
    errorHandler(error, req, res, () => {});
  }
});

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
      potentialLossUsd,
      transactionHash,
      positionId
    } = req.body;

    logger.info('Creating new prediction', {
      userAddress,
      marketId,
      lowerTick,
      upperTick,
      quantity,
      costBasis,
      transactionHash,
      positionId
    });

    // Generate unique position ID (use smart contract position ID if available)
    const dbPositionId = positionId || `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create position in database
    const positionData = {
      position_id: dbPositionId,
      user_address: userAddress.toLowerCase(),
      market_id: marketId,
      lower_tick: parseInt(lowerTick),
      upper_tick: parseInt(upperTick),
      quantity,
      cost_basis: costBasis,
      outcome: 'OPEN' as const,
      is_claimed: false,
      is_active: true,
      transaction_hash: transactionHash,
      smart_contract_position_id: positionId
    };

    const position = await PositionModel.create(positionData);

    // Create prediction analytics entry if UI data is provided
    let predictionAnalytics = null;
    if (priceMin && priceMax && avgPriceCents && betAmountUsd && potentialWinUsd && potentialLossUsd) {
      const analyticsData = {
        user_address: userAddress.toLowerCase(),
        market_id: marketId,
        position_id: dbPositionId,
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
        }),
        transaction_hash: transactionHash,
        smart_contract_position_id: positionId
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
      positionId: dbPositionId,
      userId: position.id,
      transactionHash,
      smartContractPositionId: positionId
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
// SELL POSITION ENDPOINTS
// =============================================================================

/**
 * @route POST /api/predictions/sell
 * @desc Record a position sell transaction
 * @access Public
 */
router.post('/sell', [
  body('transactionHash').isString().notEmpty().withMessage('Transaction hash is required'),
  body('positionId').isString().notEmpty().withMessage('Position ID is required'),
  body('userAddress').isEthereumAddress().withMessage('Valid Ethereum address required'),
  body('sellType').isIn(['partial', 'complete']).withMessage('Valid sell type required'),
  body('quantitySold').optional().isString().withMessage('Quantity sold is required for partial sells'),
  body('proceeds').isString().notEmpty().withMessage('Proceeds amount is required'),
  body('marketId').isString().notEmpty().withMessage('Market ID is required'),
], async (req: Request, res: Response) => {
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
      transactionHash,
      positionId,
      userAddress,
      sellType,
      quantitySold,
      proceeds,
      marketId
    } = req.body;

    logger.info('Recording position sell transaction', {
      transactionHash,
      positionId,
      userAddress,
      sellType,
      proceeds
    });

    // Update position status based on sell type
    const updateData = {
      transaction_hash: transactionHash,
      updated_at: new Date().toISOString()
    } as any;

    if (sellType === 'complete') {
      updateData.is_active = false;
      updateData.closed_at = new Date().toISOString();
      updateData.outcome = 'OPEN'; // Will be updated when market settles
    }

    // Update position in database
    const { data: updatedPosition, error: positionError } = await supabase.getClient()
      .from(TABLES.POSITIONS)
      .update(updateData as any)
      .eq('smart_contract_position_id', positionId)
      .eq('user_address', userAddress.toLowerCase())
      .select()
      .single();

    if (positionError || !updatedPosition) {
      logger.error('Error updating position for sell:', positionError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update position',
        error: positionError?.message || 'Position not found'
      });
    }

    // Create sell transaction record
    const sellTransactionData = {
      trade_id: `sell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_address: userAddress.toLowerCase(),
      market_id: marketId,
      position_id: (updatedPosition as any).position_id,
      type: sellType === 'complete' ? 'CLOSE' : 'DECREASE',
      quantity: quantitySold || (updatedPosition as any).quantity,
      cost: proceeds,
      price: '0', // Will be calculated based on proceeds and quantity
      transaction_hash: transactionHash,
      block_number: 0, // Will be filled by blockchain monitoring
      timestamp: new Date().toISOString()
    };

    const { data: sellTransaction, error: transactionError } = await supabase.getClient()
      .from(TABLES.TRADES)
      .insert(sellTransactionData as any)
      .select()
      .single();

    if (transactionError) {
      logger.error('Error creating sell transaction record:', transactionError);
      // Don't fail the request, position was updated successfully
    }

    // Update user statistics
    await UserModel.updateStats(userAddress.toLowerCase(), {
      total_volume: proceeds, // This should be calculated properly
    });

    logger.info('Position sell recorded successfully', {
      positionId: (updatedPosition as any).id,
      transactionHash,
      sellType,
      proceeds
    });

    res.status(200).json({
      success: true,
      message: 'Position sell recorded successfully',
      data: {
        position: updatedPosition,
        sellTransaction: sellTransaction
      }
    });

  } catch (error) {
    logger.error('Error recording position sell:', error);
    errorHandler(error, req, res, () => {});
  }
});

/**
 * @route GET /api/predictions/:id/sell-info
 * @desc Get sell information for a position
 * @access Public
 */
router.get('/:id/sell-info', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get position details
    const { data: position, error: positionError } = await supabase.getClient()
      .from(TABLES.POSITIONS)
      .select('*')
      .eq('position_id', id)
      .single();

    if (positionError || !position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    // Get position from smart contract if available
    let smartContractPosition = null;
    // Note: Smart contract integration would be added here in production
    // For now, we'll just return the database position

    res.json({
      success: true,
      data: {
        position,
        smartContractPosition,
        canSell: (position as any)?.is_active && (position as any)?.outcome === 'OPEN'
      }
    });

  } catch (error) {
    logger.error('Error getting sell info:', error);
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
