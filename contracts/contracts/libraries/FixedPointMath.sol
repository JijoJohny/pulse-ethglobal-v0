// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../errors/CLMSRErrors.sol";

/**
 * @title FixedPointMath
 * @dev Fixed-point mathematical operations for CLMSR calculations
 * @notice This library provides safe mathematical operations with fixed-point arithmetic
 */
library FixedPointMath {
    // =============================================================================
    // CONSTANTS
    // =============================================================================

    /// @dev The scale factor for fixed-point arithmetic (18 decimals)
    uint256 internal constant SCALE = 1e18;

    /// @dev The natural logarithm of 2 in fixed-point format
    uint256 internal constant LOG2_E = 1442695040888963407;

    /// @dev The natural logarithm of 10 in fixed-point format  
    uint256 internal constant LOG10_E = 2302585092994045684;

    /// @dev Euler's number in fixed-point format
    uint256 internal constant E = 2718281828459045235;

    /// @dev Maximum value for safe exponential calculation
    uint256 internal constant MAX_EXP_INPUT = 133084258667509499441;

    /// @dev Minimum value for logarithm calculation
    uint256 internal constant MIN_LOG_INPUT = 1;

    // =============================================================================
    // BASIC OPERATIONS
    // =============================================================================

    /**
     * @dev Multiplies two fixed-point numbers
     * @param a First number in fixed-point format
     * @param b Second number in fixed-point format
     * @return Result in fixed-point format
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        
        uint256 c = a * b;
        if (c / a != b) revert CLMSRErrors.MathOverflow();
        
        return c / SCALE;
    }

    /**
     * @dev Divides two fixed-point numbers
     * @param a Dividend in fixed-point format
     * @param b Divisor in fixed-point format
     * @return Result in fixed-point format
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        if (b == 0) revert CLMSRErrors.DivisionByZero();
        
        uint256 c = a * SCALE;
        if (c / a != SCALE) revert CLMSRErrors.MathOverflow();
        
        return c / b;
    }

    /**
     * @dev Adds two fixed-point numbers
     * @param a First number in fixed-point format
     * @param b Second number in fixed-point format
     * @return Result in fixed-point format
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        if (c < a) revert CLMSRErrors.MathOverflow();
        return c;
    }

    /**
     * @dev Subtracts two fixed-point numbers
     * @param a Minuend in fixed-point format
     * @param b Subtrahend in fixed-point format
     * @return Result in fixed-point format
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        if (b > a) revert CLMSRErrors.MathUnderflow();
        return a - b;
    }

    // =============================================================================
    // EXPONENTIAL AND LOGARITHMIC FUNCTIONS
    // =============================================================================

    /**
     * @dev Calculates the natural exponential function (e^x)
     * @param x Input in fixed-point format
     * @return Result in fixed-point format
     */
    function exp(uint256 x) internal pure returns (uint256) {
        if (x == 0) return SCALE;
        if (x > MAX_EXP_INPUT) revert CLMSRErrors.ExponentialOverflow();

        // Use Taylor series approximation for e^x
        // e^x = 1 + x + x^2/2! + x^3/3! + x^4/4! + ...
        uint256 result = SCALE; // Start with 1
        uint256 term = x; // First term: x
        uint256 factorial = 1;

        for (uint256 i = 1; i <= 20 && term > 0; i++) {
            result = add(result, term);
            
            // Calculate next term: x^(i+1) / (i+1)!
            term = mul(term, x) / SCALE;
            factorial = factorial * (i + 1);
            
            if (factorial > 0) {
                term = term / factorial;
            } else {
                break; // Prevent overflow
            }
        }

        return result;
    }

    /**
     * @dev Calculates the natural logarithm (ln(x))
     * @param x Input in fixed-point format
     * @return Result in fixed-point format
     */
    function ln(uint256 x) internal pure returns (uint256) {
        if (x < MIN_LOG_INPUT) revert CLMSRErrors.InvalidLogarithm();
        if (x == SCALE) return 0; // ln(1) = 0

        // Use the approximation: ln(x) = ln(1 + (x-1)) for x close to 1
        // Or ln(x) = ln(2) * log2(x) for larger values
        
        if (x < SCALE) {
            // For x < 1, use ln(x) = -ln(1/x)
            return _lnInternal(div(SCALE, x), true);
        } else {
            return _lnInternal(x, false);
        }
    }

    /**
     * @dev Internal function to calculate natural logarithm
     * @param x Input in fixed-point format (assumed x >= 1)
     * @param negative Whether the result should be negative
     * @return Result in fixed-point format
     */
    function _lnInternal(uint256 x, bool negative) private pure returns (uint256) {
        uint256 result = 0;
        
        // Scale down large numbers using ln(a*b) = ln(a) + ln(b)
        while (x >= 2 * SCALE) {
            result = add(result, 693147180559945309); // ln(2)
            x = div(x, 2 * SCALE);
        }

        // Now x is between 1 and 2, use Taylor series
        // ln(1 + y) = y - y^2/2 + y^3/3 - y^4/4 + ...
        uint256 y = sub(x, SCALE); // y = x - 1
        uint256 yPower = y;
        
        for (uint256 i = 1; i <= 15 && yPower > 0; i++) {
            if (i % 2 == 1) {
                result = add(result, yPower / i);
            } else {
                if (yPower / i <= result) {
                    result = sub(result, yPower / i);
                }
            }
            yPower = mul(yPower, y) / SCALE;
        }

        return negative ? (result > 0 ? 0 : result) : result;
    }

    /**
     * @dev Calculates x raised to the power of y (x^y)
     * @param x Base in fixed-point format
     * @param y Exponent in fixed-point format
     * @return Result in fixed-point format
     */
    function pow(uint256 x, uint256 y) internal pure returns (uint256) {
        if (x == 0) return 0;
        if (y == 0) return SCALE; // x^0 = 1
        if (x == SCALE) return SCALE; // 1^y = 1

        // Use the identity: x^y = e^(y * ln(x))
        uint256 lnX = ln(x);
        uint256 product = mul(y, lnX);
        return exp(product);
    }

    /**
     * @dev Calculates the square root of a fixed-point number
     * @param x Input in fixed-point format
     * @return Result in fixed-point format
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        if (x == SCALE) return SCALE;

        // Use Newton's method: y_n+1 = (y_n + x/y_n) / 2
        uint256 y = x;
        uint256 z = add(x, SCALE) / 2;

        while (z < y) {
            y = z;
            z = add(div(x, z), z) / 2;
        }

        return y;
    }

    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================

    /**
     * @dev Converts a regular uint256 to fixed-point format
     * @param x Input number
     * @return Result in fixed-point format
     */
    function toFixedPoint(uint256 x) internal pure returns (uint256) {
        if (x > type(uint256).max / SCALE) revert CLMSRErrors.MathOverflow();
        return x * SCALE;
    }

    /**
     * @dev Converts a fixed-point number to regular uint256
     * @param x Input in fixed-point format
     * @return Result as regular uint256
     */
    function fromFixedPoint(uint256 x) internal pure returns (uint256) {
        return x / SCALE;
    }

    /**
     * @dev Returns the absolute value of a signed fixed-point number
     * @param x Input in fixed-point format (treated as signed)
     * @return Result in fixed-point format
     */
    function abs(int256 x) internal pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }

    /**
     * @dev Returns the minimum of two fixed-point numbers
     * @param a First number in fixed-point format
     * @param b Second number in fixed-point format
     * @return Minimum value
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the maximum of two fixed-point numbers
     * @param a First number in fixed-point format
     * @param b Second number in fixed-point format
     * @return Maximum value
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
}
