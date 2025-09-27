// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CLMSRErrors
 * @dev Custom errors for the CLMSR protocol
 */
library CLMSRErrors {
    // =============================================================================
    // MARKET ERRORS
    // =============================================================================

    /// @dev Market does not exist or is not active
    error MarketNotActive();

    /// @dev Market is already settled
    error MarketAlreadySettled();

    /// @dev Market is not settled yet
    error MarketNotSettled();

    /// @dev Market has not started yet
    error MarketNotStarted();

    /// @dev Market has already ended
    error MarketEnded();

    /// @dev Market has not ended yet
    error MarketNotEnded();

    /// @dev Invalid market timing parameters
    error InvalidTiming();

    /// @dev Invalid tick range
    error InvalidTickRange();

    /// @dev Invalid tick spacing
    error InvalidTickSpacing();

    /// @dev Tick is out of valid range
    error TickOutOfRange();

    /// @dev Invalid liquidity parameter
    error InvalidLiquidityParameter();

    // =============================================================================
    // POSITION ERRORS
    // =============================================================================

    /// @dev Position does not exist
    error PositionNotExists();

    /// @dev Position is already settled
    error PositionAlreadySettled();

    /// @dev Position is already claimed
    error PositionAlreadyClaimed();

    /// @dev Position is not settled yet
    error PositionNotSettled();

    /// @dev Invalid position quantity
    error InvalidQuantity();

    /// @dev Insufficient quantity for operation
    error InsufficientQuantity();

    /// @dev Invalid position cost
    error InvalidCost();

    /// @dev Cost exceeds maximum allowed
    error CostExceedsMax();

    /// @dev Proceeds below minimum required
    error ProceedsBelowMin();

    // =============================================================================
    // ACCESS ERRORS
    // =============================================================================

    /// @dev Caller is not authorized
    error Unauthorized();

    /// @dev Invalid user address
    error InvalidUser();

    /// @dev Market is settled, operation not allowed
    error MarketSettled();

    // =============================================================================
    // MATH ERRORS
    // =============================================================================

    /// @dev Mathematical operation overflow
    error MathOverflow();

    /// @dev Mathematical operation underflow
    error MathUnderflow();

    /// @dev Division by zero
    error DivisionByZero();

    /// @dev Invalid mathematical input
    error InvalidMathInput();

    /// @dev Logarithm of zero or negative number
    error InvalidLogarithm();

    /// @dev Exponential overflow
    error ExponentialOverflow();

    // =============================================================================
    // SEGMENT TREE ERRORS
    // =============================================================================

    /// @dev Invalid segment tree range
    error InvalidRange();

    /// @dev Segment tree index out of bounds
    error IndexOutOfBounds();

    /// @dev Segment tree not initialized
    error TreeNotInitialized();

    /// @dev Invalid segment tree size
    error InvalidTreeSize();

    // =============================================================================
    // GENERAL ERRORS
    // =============================================================================

    /// @dev Invalid address provided
    error InvalidAddress();

    /// @dev Contract is paused
    error ContractPaused();

    /// @dev Invalid function parameters
    error InvalidParameters();

    /// @dev Operation failed
    error OperationFailed();

    /// @dev Insufficient balance
    error InsufficientBalance();

    /// @dev Transfer failed
    error TransferFailed();
}
