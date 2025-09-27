// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FixedPointMath
 * @notice A library for fixed-point arithmetic operations
 * @dev Provides safe mathematical operations with overflow protection
 */
library FixedPointMath {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant RAY = 1e27;
    uint256 internal constant MAX_UINT256 = type(uint256).max;

    error FixedPointMathOverflow();
    error FixedPointMathUnderflow();
    error FixedPointMathDivisionByZero();

    /**
     * @notice Convert a number to WAD (18 decimals)
     * @param x The number to convert
     * @return The number in WAD format
     */
    function toWad(uint256 x) internal pure returns (uint256) {
        return x * WAD;
    }

    /**
     * @notice Convert a WAD number to regular number
     * @param x The WAD number to convert
     * @return The regular number
     */
    function fromWad(uint256 x) internal pure returns (uint256) {
        return x / WAD;
    }

    /**
     * @notice Convert a WAD number to regular number with rounding up
     * @param x The WAD number to convert
     * @return The regular number rounded up
     */
    function fromWadRoundUp(uint256 x) internal pure returns (uint256) {
        return (x + WAD - 1) / WAD;
    }

    /**
     * @notice Multiply two WAD numbers
     * @param x First WAD number
     * @param y Second WAD number
     * @return The product in WAD format
     */
    function wadMul(uint256 x, uint256 y) internal pure returns (uint256) {
        if (x == 0 || y == 0) return 0;
        
        uint256 result = (x * y) / WAD;
        if (result == 0) revert FixedPointMathUnderflow();
        return result;
    }

    /**
     * @notice Divide two WAD numbers
     * @param x Dividend in WAD format
     * @param y Divisor in WAD format
     * @return The quotient in WAD format
     */
    function wadDiv(uint256 x, uint256 y) internal pure returns (uint256) {
        if (y == 0) revert FixedPointMathDivisionByZero();
        if (x == 0) return 0;
        
        return (x * WAD) / y;
    }

    /**
     * @notice Calculate x^y using binary exponentiation
     * @param x Base in WAD format
     * @param y Exponent
     * @return x^y in WAD format
     */
    function wadPow(uint256 x, uint256 y) internal pure returns (uint256) {
        if (y == 0) return WAD;
        if (x == 0) return 0;
        
        uint256 result = WAD;
        uint256 base = x;
        
        while (y > 0) {
            if (y & 1 == 1) {
                result = wadMul(result, base);
            }
            base = wadMul(base, base);
            y >>= 1;
        }
        
        return result;
    }

    /**
     * @notice Calculate natural logarithm using Taylor series approximation
     * @param x Input in WAD format (must be > 0)
     * @return ln(x) in WAD format
     */
    function wadLn(uint256 x) internal pure returns (uint256) {
        if (x == 0) revert FixedPointMathUnderflow();
        if (x == WAD) return 0;
        
        // Normalize x to be between 1 and 2
        uint256 normalized = x;
        uint256 result = 0;
        
        // Handle x > 2
        while (normalized >= 2 * WAD) {
            normalized = wadDiv(normalized, 2 * WAD);
            result += 693147180559945309417; // ln(2) in WAD
        }
        
        // Handle x < 1
        while (normalized < WAD) {
            normalized = wadMul(normalized, 2 * WAD);
            result -= 693147180559945309417; // ln(2) in WAD
        }
        
        // Taylor series for ln(1 + z) where z = normalized - 1
        uint256 z = normalized - WAD;
        uint256 term = z;
        uint256 sum = z;
        
        for (uint256 i = 2; i <= 20; i++) {
            term = wadMul(term, z);
            if (i % 2 == 0) {
                sum -= wadDiv(term, i * WAD);
            } else {
                sum += wadDiv(term, i * WAD);
            }
        }
        
        return result + sum;
    }

    /**
     * @notice Calculate exponential function using Taylor series
     * @param x Input in WAD format
     * @return exp(x) in WAD format
     */
    function wadExp(uint256 x) internal pure returns (uint256) {
        if (x == 0) return WAD;
        
        // Handle negative exponents
        bool isNegative = x > type(uint128).max;
        if (isNegative) {
            x = type(uint256).max - x + 1;
        }
        
        uint256 result = WAD;
        uint256 term = WAD;
        
        for (uint256 i = 1; i <= 20; i++) {
            term = wadMul(term, x);
            term = wadDiv(term, i * WAD);
            result += term;
        }
        
        if (isNegative) {
            return wadDiv(WAD, result);
        }
        
        return result;
    }

    /**
     * @notice Calculate square root using Newton's method
     * @param x Input in WAD format
     * @return sqrt(x) in WAD format
     */
    function wadSqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        if (x == WAD) return WAD;
        
        uint256 z = (x + WAD) / 2;
        uint256 y = x;
        
        while (z < y) {
            y = z;
            z = (wadDiv(x, z) + z) / 2;
        }
        
        return y;
    }

    /**
     * @notice Calculate absolute value
     * @param x Input
     * @return Absolute value
     */
    function abs(int256 x) internal pure returns (uint256) {
        return x < 0 ? uint256(-x) : uint256(x);
    }

    /**
     * @notice Calculate minimum of two numbers
     * @param x First number
     * @param y Second number
     * @return Minimum value
     */
    function min(uint256 x, uint256 y) internal pure returns (uint256) {
        return x < y ? x : y;
    }

    /**
     * @notice Calculate maximum of two numbers
     * @param x First number
     * @param y Second number
     * @return Maximum value
     */
    function max(uint256 x, uint256 y) internal pure returns (uint256) {
        return x > y ? x : y;
    }
}
