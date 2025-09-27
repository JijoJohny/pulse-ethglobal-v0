import Joi from 'joi';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Market ID validation
export const validateMarketId = (marketId: string) => {
  const schema = Joi.string().pattern(/^[a-zA-Z0-9-_]+$/).required();
  return schema.validate(marketId);
};

// Position ID validation
export const validatePositionId = (positionId: string) => {
  const schema = Joi.string().pattern(/^[a-zA-Z0-9-_]+$/).required();
  return schema.validate(positionId);
};

// User address validation (Ethereum address format)
export const validateUserAddress = (address: string) => {
  const schema = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required();
  return schema.validate(address);
};

// Market query validation
export const validateMarketQuery = (query: any) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('active', 'settled', 'inactive').optional(),
    network: Joi.string().optional(),
  });
  return schema.validate(query);
};

// Position query validation
export const validatePositionQuery = (query: any) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    user: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
    market: Joi.string().optional(),
    status: Joi.string().valid('open', 'won', 'lost').optional(),
  });
  return schema.validate(query);
};

// User query validation
export const validateUserQuery = (query: any) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('volume', 'positions', 'pnl', 'winRate').default('volume'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  });
  return schema.validate(query);
};

// Analytics query validation
export const validateAnalyticsQuery = (query: any) => {
  const schema = Joi.object({
    timeframe: Joi.string().valid('24h', '7d', '30d', '90d', 'all').default('24h'),
    granularity: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly').default('daily'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('volume', 'trades', 'liquidity', 'positions').default('volume'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  });
  return schema.validate(query);
};

// Create market validation
export const validateCreateMarket = (data: any) => {
  const schema = Joi.object({
    minTick: Joi.number().integer().required(),
    maxTick: Joi.number().integer().required(),
    tickSpacing: Joi.number().integer().min(1).required(),
    startTimestamp: Joi.number().integer().min(0).required(),
    endTimestamp: Joi.number().integer().min(0).required(),
    liquidityParameter: Joi.string().pattern(/^\d+(\.\d+)?$/).required(),
  }).custom((value, helpers) => {
    if (value.minTick >= value.maxTick) {
      return helpers.error('custom.minMaxTick');
    }
    if (value.startTimestamp >= value.endTimestamp) {
      return helpers.error('custom.startEndTimestamp');
    }
    return value;
  });
  return schema.validate(data);
};

// Open position validation
export const validateOpenPosition = (data: any) => {
  const schema = Joi.object({
    user: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    marketId: Joi.string().required(),
    lowerTick: Joi.number().integer().required(),
    upperTick: Joi.number().integer().required(),
    quantity: Joi.string().pattern(/^\d+(\.\d+)?$/).required(),
    maxCost: Joi.string().pattern(/^\d+(\.\d+)?$/).required(),
  }).custom((value, helpers) => {
    if (value.lowerTick >= value.upperTick) {
      return helpers.error('custom.lowerUpperTick');
    }
    if (parseFloat(value.quantity) <= 0) {
      return helpers.error('custom.invalidQuantity');
    }
    if (parseFloat(value.maxCost) <= 0) {
      return helpers.error('custom.invalidMaxCost');
    }
    return value;
  });
  return schema.validate(data);
};

// Settle market validation
export const validateSettleMarket = (data: any) => {
  const schema = Joi.object({
    settlementTick: Joi.number().integer().optional(),
    settlementValue: Joi.string().optional(),
  }).custom((value, helpers) => {
    if (!value.settlementTick && !value.settlementValue) {
      return helpers.error('custom.missingSettlement');
    }
    return value;
  });
  return schema.validate(data);
};

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

// Generic validation middleware
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map((detail: any) => detail.message).join(', ');
      return res.status(400).json({
        error: 'Validation Error',
        message: errorMessage,
        details: error.details
      });
    }
    
    req[property] = value;
    next();
  };
};

// =============================================================================
// CUSTOM VALIDATION MESSAGES
// =============================================================================

// Custom Joi error messages
export const customJoiMessages = {
  'custom.minMaxTick': 'minTick must be less than maxTick',
  'custom.startEndTimestamp': 'startTimestamp must be less than endTimestamp',
  'custom.lowerUpperTick': 'lowerTick must be less than upperTick',
  'custom.invalidQuantity': 'quantity must be greater than 0',
  'custom.invalidMaxCost': 'maxCost must be greater than 0',
  'custom.missingSettlement': 'Either settlementTick or settlementValue is required',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Check if string is valid Ethereum address
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Check if string is valid market ID format
export const isValidMarketId = (marketId: string): boolean => {
  return /^[a-zA-Z0-9-_]+$/.test(marketId);
};

// Check if string is valid position ID format
export const isValidPositionId = (positionId: string): boolean => {
  return /^[a-zA-Z0-9-_]+$/.test(positionId);
};

// Check if number is valid tick value
export const isValidTick = (tick: number): boolean => {
  return Number.isInteger(tick) && tick >= -887272 && tick <= 887272;
};

// Check if string is valid amount (positive number)
export const isValidAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

// Sanitize input string
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Validate pagination parameters
export const validatePagination = (page: number, limit: number): { page: number; limit: number } => {
  const validPage = Math.max(1, Math.floor(page) || 1);
  const validLimit = Math.min(100, Math.max(1, Math.floor(limit) || 20));
  return { page: validPage, limit: validLimit };
};

// Validate timeframe parameter
export const validateTimeframe = (timeframe: string): string => {
  const validTimeframes = ['24h', '7d', '30d', '90d', 'all'];
  return validTimeframes.includes(timeframe) ? timeframe : '24h';
};

// Validate sort parameters
export const validateSortParams = (sortBy: string, sortOrder: string, allowedFields: string[]): { sortBy: string; sortOrder: string } => {
  const validSortBy = allowedFields.includes(sortBy) ? sortBy : allowedFields[0];
  const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
  return { sortBy: validSortBy, sortOrder: validSortOrder };
};
