// =============================================================================
// MARKET TYPES
// =============================================================================

export interface MarketData {
  marketId: string;
  isActive: boolean;
  isSettled: boolean;
  minTick: string;
  maxTick: string;
  tickSpacing: string;
  startTimestamp: string;
  endTimestamp: string;
  settlementTick?: string;
  liquidityParameter: string;
  totalLiquidity: string;
  totalVolume: string;
  totalTrades: string;
  lastUpdated: string;
}

export interface MarketAnalytics {
  marketId: string;
  totalVolume: string;
  totalTrades: string;
  averagePrice: string;
  highestPrice: string;
  lowestPrice: string;
  priceChange24h: string;
  volume24h: string;
  volume7d: string;
  volume30d: string;
  lastUpdated: string;
}

export interface PositionData {
  positionId: string;
  user: string;
  marketId: string;
  lowerTick: string;
  upperTick: string;
  quantity: string;
  costBasis: string;
  outcome: 'OPEN' | 'WIN' | 'LOSS';
  isClaimed: boolean;
  createdAt: string;
  lastUpdated: string;
}

export interface SettlementData {
  settlementTick?: number;
  settlementValue?: string;
}

export interface CreateMarketData {
  minTick: number;
  maxTick: number;
  tickSpacing: number;
  startTimestamp: number;
  endTimestamp: number;
  liquidityParameter: string;
}

export interface OpenPositionData {
  user: string;
  marketId: string;
  lowerTick: number;
  upperTick: number;
  quantity: string;
  maxCost: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// =============================================================================
// USER TYPES
// =============================================================================

export interface UserStats {
  address: string;
  totalPositions: number;
  totalVolume: string;
  totalPnL: string;
  winningPositions: number;
  losingPositions: number;
  winRate: number;
  averagePositionSize: number;
  firstPositionAt?: string;
  lastPositionAt?: string;
}

export interface UserPosition {
  positionId: string;
  marketId: string;
  lowerTick: string;
  upperTick: string;
  quantity: string;
  costBasis: string;
  outcome: 'OPEN' | 'WIN' | 'LOSS';
  isClaimed: boolean;
  createdAt: string;
  lastUpdated: string;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface PlatformOverview {
  platform: {
    totalMarkets: number;
    activeMarkets: number;
    settledMarkets: number;
    totalVolume: string;
    totalLiquidity: string;
    totalTrades: number;
    uniqueUsers: number;
  };
  timeframe: string;
  lastUpdated: string;
}

export interface VolumeDataPoint {
  timestamp: string;
  volume: number;
  trades: number;
  liquidity: number;
}

export interface MarketPerformance {
  positions: {
    total: number;
    winning: number;
    losing: number;
    open: number;
  };
  metrics: {
    overallWinRate: number;
    totalVolume: number;
    totalPnL: number;
    averagePositionSize: number;
  };
  timeframe: string;
  lastUpdated: string;
}

// =============================================================================
// WEBSOCKET TYPES
// =============================================================================

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'message' | 'error';
  channel?: string;
  data?: any;
  message?: string;
  timestamp: string;
}

export interface WebSocketSubscription {
  type: 'markets' | 'positions' | 'analytics' | 'user';
  id?: string;
  userId?: string;
}

// =============================================================================
// CONTRACT TYPES
// =============================================================================

export interface ContractEvent {
  address: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  args: any;
  event: string;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  status: number;
  logs: any[];
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface TheGraphConfig {
  subgraphUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface RootstockConfig {
  rpcUrl: string;
  networkId: number;
  privateKey?: string;
  contractAddresses: {
    marketCore: string;
    position: string;
  };
}

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  corsOrigins: string[];
  database: DatabaseConfig;
  redis: RedisConfig;
  theGraph: TheGraphConfig;
  rootstock: RootstockConfig;
  jwtSecret: string;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type MarketStatus = 'active' | 'inactive' | 'settled';
export type PositionStatus = 'open' | 'won' | 'lost';
export type Timeframe = '24h' | '7d' | '30d' | '90d' | 'all';
export type SortOrder = 'asc' | 'desc';
export type SortField = 'volume' | 'trades' | 'liquidity' | 'positions' | 'createdAt' | 'updatedAt';

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  status?: string;
  timeframe?: Timeframe;
}

export interface MarketQueryParams extends QueryParams {
  network?: string;
}

export interface PositionQueryParams extends QueryParams {
  user?: string;
  market?: string;
}

export interface UserQueryParams extends QueryParams {
  address?: string;
}

export interface AnalyticsQueryParams extends QueryParams {
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}
