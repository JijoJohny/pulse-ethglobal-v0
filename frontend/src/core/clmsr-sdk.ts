import { Big } from 'big.js';

// CLMSR (Continuous Logarithmic Market Scoring Rule) SDK
// This implements the mathematical engine for prediction market calculations

export interface MarketState {
  liquidity: Big;
  outcomes: Big[];
}

export interface Position {
  outcome: number;
  quantity: Big;
}

export interface MarketParams {
  liquidity: string;
  outcomes: string[];
}

export class CLMSRSDK {
  private static readonly PRECISION = 18;
  private static readonly MIN_LIQUIDITY = new Big('0.001');

  /**
   * Calculate the cost of opening a new position
   * @param marketState Current market state
   * @param position New position to open
   * @returns Cost in RBTC
   */
  static calculateOpenCost(marketState: MarketState, position: Position): Big {
    const { liquidity, outcomes } = marketState;
    const { outcome, quantity } = position;

    if (outcome < 0 || outcome >= outcomes.length) {
      throw new Error('Invalid outcome index');
    }

    if (quantity.lte(0)) {
      throw new Error('Quantity must be positive');
    }

    // Create new outcomes array with the position added
    const newOutcomes = outcomes.map((outcomeLiquidity, index) => {
      if (index === outcome) {
        return outcomeLiquidity.plus(quantity);
      }
      return outcomeLiquidity;
    });

    // Calculate the cost using CLMSR formula
    const oldSum = this.calculateSum(outcomes);
    const newSum = this.calculateSum(newOutcomes);
    
    const cost = liquidity.times(
      newSum.minus(oldSum).div(liquidity).exp().minus(1)
    );

    return cost;
  }

  /**
   * Calculate the cost of increasing an existing position
   * @param marketState Current market state
   * @param position Position to increase
   * @returns Cost in RBTC
   */
  static calculateIncreaseCost(marketState: MarketState, position: Position): Big {
    return this.calculateOpenCost(marketState, position);
  }

  /**
   * Calculate the proceeds from decreasing a position
   * @param marketState Current market state
   * @param position Position to decrease
   * @returns Proceeds in RBTC
   */
  static calculateDecreaseProceeds(marketState: MarketState, position: Position): Big {
    const { liquidity, outcomes } = marketState;
    const { outcome, quantity } = position;

    if (outcome < 0 || outcome >= outcomes.length) {
      throw new Error('Invalid outcome index');
    }

    if (quantity.lte(0)) {
      throw new Error('Quantity must be positive');
    }

    if (outcomes[outcome].lt(quantity)) {
      throw new Error('Cannot decrease position by more than current holdings');
    }

    // Create new outcomes array with the position decreased
    const newOutcomes = outcomes.map((outcomeLiquidity, index) => {
      if (index === outcome) {
        return outcomeLiquidity.minus(quantity);
      }
      return outcomeLiquidity;
    });

    // Calculate the proceeds using CLMSR formula
    const oldSum = this.calculateSum(outcomes);
    const newSum = this.calculateSum(newOutcomes);
    
    const proceeds = liquidity.times(
      oldSum.minus(newSum).div(liquidity).exp().minus(1)
    );

    return proceeds;
  }

  /**
   * Calculate the proceeds from closing a position
   * @param marketState Current market state
   * @param position Position to close
   * @returns Proceeds in RBTC
   */
  static calculateCloseProceeds(marketState: MarketState, position: Position): Big {
    return this.calculateDecreaseProceeds(marketState, position);
  }

  /**
   * Calculate the claim amount for a winning position
   * @param marketState Market state at settlement
   * @param position Winning position
   * @returns Claim amount in RBTC
   */
  static calculateClaim(marketState: MarketState, position: Position): Big {
    const { outcomes } = marketState;
    const { outcome, quantity } = position;

    if (outcome < 0 || outcome >= outcomes.length) {
      throw new Error('Invalid outcome index');
    }

    // In CLMSR, the claim amount is simply the quantity of the winning outcome
    return quantity;
  }

  /**
   * Calculate the quantity that can be purchased for a given cost
   * @param marketState Current market state
   * @param outcome Target outcome
   * @param maxCost Maximum cost willing to pay
   * @returns Maximum quantity that can be purchased
   */
  static calculateQuantityFromCost(
    marketState: MarketState, 
    outcome: number, 
    maxCost: Big
  ): Big {
    const { liquidity, outcomes } = marketState;

    if (outcome < 0 || outcome >= outcomes.length) {
      throw new Error('Invalid outcome index');
    }

    if (maxCost.lte(0)) {
      return new Big(0);
    }

    // Use binary search to find the maximum quantity
    let low = new Big(0);
    let high = maxCost.times(10); // Start with a reasonable upper bound
    let bestQuantity = new Big(0);

    const tolerance = new Big('0.000001');
    const maxIterations = 100;
    let iterations = 0;

    while (low.lt(high) && iterations < maxIterations) {
      const mid = low.plus(high).div(2);
      
      try {
        const testPosition: Position = { outcome, quantity: mid };
        const cost = this.calculateOpenCost(marketState, testPosition);
        
        if (cost.lte(maxCost)) {
          bestQuantity = mid;
          low = mid.plus(tolerance);
        } else {
          high = mid.minus(tolerance);
        }
      } catch (error) {
        high = mid.minus(tolerance);
      }
      
      iterations++;
    }

    return bestQuantity;
  }

  /**
   * Calculate the current market price for an outcome
   * @param marketState Current market state
   * @param outcome Target outcome
   * @returns Price as a percentage (0-1)
   */
  static calculatePrice(marketState: MarketState, outcome: number): Big {
    const { liquidity, outcomes } = marketState;

    if (outcome < 0 || outcome >= outcomes.length) {
      throw new Error('Invalid outcome index');
    }

    const sum = this.calculateSum(outcomes);
    const outcomeLiquidity = outcomes[outcome];
    
    return outcomeLiquidity.div(sum);
  }

  /**
   * Calculate the total liquidity in the market
   * @param marketState Current market state
   * @returns Total liquidity
   */
  static calculateTotalLiquidity(marketState: MarketState): Big {
    return this.calculateSum(marketState.outcomes);
  }

  /**
   * Validate market state
   * @param marketState Market state to validate
   * @returns True if valid, false otherwise
   */
  static validateMarketState(marketState: MarketState): boolean {
    const { liquidity, outcomes } = marketState;

    if (liquidity.lte(0)) {
      return false;
    }

    if (outcomes.length < 2) {
      return false;
    }

    for (const outcome of outcomes) {
      if (outcome.lt(0)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create a new market state
   * @param params Market parameters
   * @returns New market state
   */
  static createMarketState(params: MarketParams): MarketState {
    const liquidity = new Big(params.liquidity);
    const outcomes = params.outcomes.map(outcome => new Big(outcome));

    if (liquidity.lt(this.MIN_LIQUIDITY)) {
      throw new Error('Liquidity must be at least 0.001 RBTC');
    }

    if (outcomes.length < 2) {
      throw new Error('Market must have at least 2 outcomes');
    }

    for (const outcome of outcomes) {
      if (outcome.lt(0)) {
        throw new Error('Outcome liquidity cannot be negative');
      }
    }

    return { liquidity, outcomes };
  }

  /**
   * Calculate the sum of all outcomes (helper method)
   * @param outcomes Array of outcome liquidities
   * @returns Sum of all outcomes
   */
  private static calculateSum(outcomes: Big[]): Big {
    return outcomes.reduce((sum, outcome) => sum.plus(outcome), new Big(0));
  }

  /**
   * Format a Big number to a readable string
   * @param value Big number to format
   * @param decimals Number of decimal places
   * @returns Formatted string
   */
  static formatValue(value: Big, decimals: number = 6): string {
    return value.toFixed(decimals);
  }

  /**
   * Parse a string value to a Big number
   * @param value String value to parse
   * @returns Big number
   */
  static parseValue(value: string): Big {
    return new Big(value);
  }
}

// Export utility functions for common operations
export const CLMSRUtils = {
  /**
   * Calculate the cost of a multi-outcome position
   * @param marketState Current market state
   * @param positions Array of positions
   * @returns Total cost
   */
  calculateMultiPositionCost: (marketState: MarketState, positions: Position[]): Big => {
    let totalCost = new Big(0);
    
    for (const position of positions) {
      const cost = CLMSRSDK.calculateOpenCost(marketState, position);
      totalCost = totalCost.plus(cost);
    }
    
    return totalCost;
  },

  /**
   * Calculate the potential winnings for a position
   * @param marketState Current market state
   * @param position Position to calculate winnings for
   * @returns Potential winnings
   */
  calculatePotentialWinnings: (marketState: MarketState, position: Position): Big => {
    const price = CLMSRSDK.calculatePrice(marketState, position.outcome);
    return position.quantity.times(price);
  },

  /**
   * Calculate the risk-adjusted return for a position
   * @param marketState Current market state
   * @param position Position to calculate return for
   * @returns Risk-adjusted return
   */
  calculateRiskAdjustedReturn: (marketState: MarketState, position: Position): Big => {
    const cost = CLMSRSDK.calculateOpenCost(marketState, position);
    const potentialWinnings = CLMSRUtils.calculatePotentialWinnings(marketState, position);
    
    if (cost.lte(0)) {
      return new Big(0);
    }
    
    return potentialWinnings.minus(cost).div(cost);
  }
};
