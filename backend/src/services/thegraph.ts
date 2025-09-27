import { GraphQLClient } from 'graphql-request';
import { logger } from '../utils/logger';

export class TheGraphService {
  private client: GraphQLClient;
  private subgraphUrl: string;

  constructor() {
    this.subgraphUrl = process.env.THE_GRAPH_SUBGRAPH_URL || 
      'https://api.thegraph.com/subgraphs/name/pulse-08/pulse-08-testnet';
    this.client = new GraphQLClient(this.subgraphUrl);
  }

  // =============================================================================
  // MARKET QUERIES
  // =============================================================================

  /**
   * Get all markets with optional filtering
   */
  async getMarkets(options: {
    page: number;
    limit: number;
    status?: string;
    network?: string;
  }): Promise<any[]> {
    try {
      logger.info('Fetching markets from The Graph', { options });

      const query = `
        query GetMarkets($first: Int!, $skip: Int!, $where: Market_filter) {
          markets(
            first: $first,
            skip: $skip,
            where: $where,
            orderBy: createdAt,
            orderDirection: desc
          ) {
            id
            marketId
            isActive
            isSettled
            minTick
            maxTick
            tickSpacing
            startTimestamp
            endTimestamp
            settlementTick
            liquidityParameter
            totalLiquidity
            totalVolume
            totalTrades
            createdAt
            lastUpdated
            positions(first: 10) {
              id
              positionId
              user
              lowerTick
              upperTick
              quantity
              costBasis
              outcome
              isClaimed
            }
          }
        }
      `;

      const variables = {
        first: options.limit,
        skip: (options.page - 1) * options.limit,
        where: this.buildMarketFilter(options)
      };

      const response = await this.client.request(query, variables) as any;
      return response.markets || [];
    } catch (error) {
      logger.error('Error fetching markets from The Graph:', error);
      throw new Error('Failed to fetch markets from The Graph');
    }
  }

  /**
   * Get specific market by ID
   */
  async getMarket(marketId: string): Promise<any> {
    try {
      logger.info('Fetching market from The Graph', { marketId });

      const query = `
        query GetMarket($id: ID!) {
          market(id: $id) {
            id
            marketId
            isActive
            isSettled
            minTick
            maxTick
            tickSpacing
            startTimestamp
            endTimestamp
            settlementTick
            liquidityParameter
            totalLiquidity
            totalVolume
            totalTrades
            createdAt
            lastUpdated
            positions(first: 100) {
              id
              positionId
              user
              lowerTick
              upperTick
              quantity
              costBasis
              outcome
              isClaimed
              createdAt
            }
            trades(first: 100, orderBy: timestamp, orderDirection: desc) {
              id
              user
              type
              quantity
              cost
              price
              timestamp
              transactionHash
            }
          }
        }
      `;

      const response = await this.client.request(query, { id: marketId }) as any;
      return response.market;
    } catch (error) {
      logger.error('Error fetching market from The Graph:', error);
      throw new Error('Failed to fetch market from The Graph');
    }
  }

  /**
   * Get market positions
   */
  async getMarketPositions(marketId: string, options: {
    page: number;
    limit: number;
    user?: string;
  }): Promise<any[]> {
    try {
      logger.info('Fetching market positions from The Graph', { marketId, options });

      const query = `
        query GetMarketPositions($marketId: String!, $first: Int!, $skip: Int!, $where: Position_filter) {
          positions(
            first: $first,
            skip: $skip,
            where: $where,
            orderBy: createdAt,
            orderDirection: desc
          ) {
            id
            positionId
            user
            market
            lowerTick
            upperTick
            quantity
            costBasis
            outcome
            isClaimed
            createdAt
            lastUpdated
            trades(first: 10, orderBy: timestamp, orderDirection: desc) {
              id
              type
              quantity
              cost
              price
              timestamp
              transactionHash
            }
          }
        }
      `;

      const variables = {
        marketId,
        first: options.limit,
        skip: (options.page - 1) * options.limit,
        where: this.buildPositionFilter(options)
      };

      const response = await this.client.request(query, variables) as any;
      return response.positions || [];
    } catch (error) {
      logger.error('Error fetching market positions from The Graph:', error);
      throw new Error('Failed to fetch market positions from The Graph');
    }
  }

  /**
   * Get market analytics
   */
  async getMarketAnalytics(marketId: string, timeframe: string): Promise<any> {
    try {
      logger.info('Fetching market analytics from The Graph', { marketId, timeframe });

      const query = `
        query GetMarketAnalytics($marketId: String!, $timeframe: String!) {
          market(id: $marketId) {
            id
            totalVolume
            totalTrades
            totalLiquidity
            positions(first: 1000) {
              id
              quantity
              costBasis
              outcome
              createdAt
            }
            trades(first: 1000, orderBy: timestamp, orderDirection: desc) {
              id
              type
              quantity
              cost
              price
              timestamp
            }
          }
        }
      `;

      const response = await this.client.request(query, { marketId, timeframe }) as any;
      const market = response.market;

      if (!market) {
        return null;
      }

      // Calculate analytics
      const analytics = this.calculateMarketAnalytics(market, timeframe);
      return analytics;
    } catch (error) {
      logger.error('Error fetching market analytics from The Graph:', error);
      throw new Error('Failed to fetch market analytics from The Graph');
    }
  }

  // =============================================================================
  // POSITION QUERIES
  // =============================================================================

  /**
   * Get user positions
   */
  async getUserPositions(userAddress: string, options: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<any[]> {
    try {
      logger.info('Fetching user positions from The Graph', { userAddress, options });

      const query = `
        query GetUserPositions($user: String!, $first: Int!, $skip: Int!, $where: Position_filter) {
          positions(
            first: $first,
            skip: $skip,
            where: $where,
            orderBy: createdAt,
            orderDirection: desc
          ) {
            id
            positionId
            user
            market
            lowerTick
            upperTick
            quantity
            costBasis
            outcome
            isClaimed
            createdAt
            lastUpdated
            market {
              id
              marketId
              isActive
              isSettled
              startTimestamp
              endTimestamp
              settlementTick
            }
          }
        }
      `;

      const variables = {
        user: userAddress,
        first: options.limit,
        skip: (options.page - 1) * options.limit,
        where: this.buildUserPositionFilter(options)
      };

      const response = await this.client.request(query, variables) as any;
      return response.positions || [];
    } catch (error) {
      logger.error('Error fetching user positions from The Graph:', error);
      throw new Error('Failed to fetch user positions from The Graph');
    }
  }

  // =============================================================================
  // USER QUERIES
  // =============================================================================

  /**
   * Get user statistics
   */
  async getUserStats(userAddress: string): Promise<any> {
    try {
      logger.info('Fetching user stats from The Graph', { userAddress });

      const query = `
        query GetUserStats($user: String!) {
          user(id: $user) {
            id
            address
            totalPositions
            totalVolume
            totalPnL
            winningPositions
            losingPositions
            winRate
            averagePositionSize
            firstPositionAt
            lastPositionAt
            positions(first: 100) {
              id
              positionId
              market
              quantity
              costBasis
              outcome
              createdAt
            }
          }
        }
      `;

      const response = await this.client.request(query, { user: userAddress }) as any;
      return response.user;
    } catch (error) {
      logger.error('Error fetching user stats from The Graph:', error);
      throw new Error('Failed to fetch user stats from The Graph');
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Build market filter for GraphQL query
   */
  private buildMarketFilter(options: any): any {
    const where: any = {};

    if (options.status) {
      if (options.status === 'active') {
        where.isActive = true;
        where.isSettled = false;
      } else if (options.status === 'settled') {
        where.isSettled = true;
      } else if (options.status === 'inactive') {
        where.isActive = false;
      }
    }

    return where;
  }

  /**
   * Build position filter for GraphQL query
   */
  private buildPositionFilter(options: any): any {
    const where: any = {};

    if (options.user) {
      where.user = options.user;
    }

    return where;
  }

  /**
   * Build user position filter for GraphQL query
   */
  private buildUserPositionFilter(options: any): any {
    const where: any = {};

    if (options.status) {
      if (options.status === 'open') {
        where.outcome = 'OPEN';
      } else if (options.status === 'won') {
        where.outcome = 'WIN';
      } else if (options.status === 'lost') {
        where.outcome = 'LOSS';
      }
    }

    return where;
  }

  /**
   * Calculate market analytics from raw data
   */
  private calculateMarketAnalytics(market: any, timeframe: string): any {
    const positions = market.positions || [];
    const trades = market.trades || [];

    // Calculate basic statistics
    const totalPositions = positions.length;
    const totalVolume = market.totalVolume || '0';
    const totalTrades = market.totalTrades || '0';

    // Calculate position outcomes
    const wonPositions = positions.filter((p: any) => p.outcome === 'WIN').length;
    const lostPositions = positions.filter((p: any) => p.outcome === 'LOSS').length;
    const openPositions = positions.filter((p: any) => p.outcome === 'OPEN').length;

    // Calculate win rate
    const settledPositions = wonPositions + lostPositions;
    const winRate = settledPositions > 0 ? (wonPositions / settledPositions) * 100 : 0;

    // Calculate average position size
    const totalQuantity = positions.reduce((sum: number, p: any) => sum + parseInt(p.quantity), 0);
    const averagePositionSize = totalPositions > 0 ? totalQuantity / totalPositions : 0;

    // Calculate price statistics from trades
    const prices = trades.map((t: any) => parseFloat(t.price)).filter((p: number) => p > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length : 0;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

    return {
      marketId: market.id,
      totalPositions,
      totalVolume,
      totalTrades,
      wonPositions,
      lostPositions,
      openPositions,
      winRate,
      averagePositionSize,
      averagePrice,
      highestPrice,
      lowestPrice,
      timeframe,
      lastUpdated: new Date().toISOString()
    };
  }
}
