// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FixedPointMath.sol";
import "../errors/CLMSRErrors.sol";

/**
 * @title LazyMulSegmentTree
 * @dev Lazy propagation segment tree with multiplicative updates for CLMSR
 * @notice This library implements a segment tree that supports range multiplicative updates
 * and range sum queries, optimized for CLMSR probability distribution updates
 */
library LazyMulSegmentTree {
    using FixedPointMath for uint256;

    // =============================================================================
    // STRUCTS
    // =============================================================================

    struct Node {
        uint256 sum;          // Sum of the range
        uint256 lazyMul;      // Lazy multiplicative factor
        bool hasLazy;         // Whether there's a pending lazy update
    }

    struct Tree {
        Node[] nodes;         // Tree nodes
        uint256 size;         // Size of the underlying array
        uint256 treeSize;     // Size of the tree array
        bool initialized;     // Whether the tree is initialized
    }

    // =============================================================================
    // CONSTANTS
    // =============================================================================

    /// @dev Default value for uninitialized segments (1.0 in fixed-point)
    uint256 private constant DEFAULT_VALUE = 1e18;

    /// @dev Identity element for multiplication (1.0 in fixed-point)
    uint256 private constant IDENTITY_MUL = 1e18;

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    /**
     * @dev Initialize the segment tree with given size
     * @param self The tree storage reference
     * @param n Size of the underlying array
     */
    function initialize(Tree storage self, uint256 n) internal {
        if (n == 0) revert CLMSRErrors.InvalidTreeSize();
        
        self.size = n;
        self.treeSize = 4 * n; // Ensure enough space for the tree
        
        // Initialize nodes array
        delete self.nodes;
        for (uint256 i = 0; i < self.treeSize; i++) {
            self.nodes.push(Node({
                sum: DEFAULT_VALUE,
                lazyMul: IDENTITY_MUL,
                hasLazy: false
            }));
        }
        
        self.initialized = true;
        
        // Build the initial tree
        _build(self, 1, 0, n - 1);
    }

    /**
     * @dev Build the segment tree recursively
     * @param self The tree storage reference
     * @param node Current node index
     * @param start Start of the range
     * @param end End of the range
     */
    function _build(
        Tree storage self,
        uint256 node,
        uint256 start,
        uint256 end
    ) private {
        if (start == end) {
            // Leaf node
            self.nodes[node].sum = DEFAULT_VALUE;
        } else {
            uint256 mid = (start + end) / 2;
            uint256 leftChild = 2 * node;
            uint256 rightChild = 2 * node + 1;
            
            _build(self, leftChild, start, mid);
            _build(self, rightChild, mid + 1, end);
            
            // Internal node sum is sum of children
            self.nodes[node].sum = self.nodes[leftChild].sum.add(self.nodes[rightChild].sum);
        }
        
        self.nodes[node].lazyMul = IDENTITY_MUL;
        self.nodes[node].hasLazy = false;
    }

    // =============================================================================
    // UPDATE OPERATIONS
    // =============================================================================

    /**
     * @dev Update a range [l, r] by multiplying with a factor
     * @param self The tree storage reference
     * @param l Left boundary of the range (inclusive)
     * @param r Right boundary of the range (inclusive)
     * @param factor Multiplicative factor in fixed-point format
     */
    function updateRange(
        Tree storage self,
        uint256 l,
        uint256 r,
        uint256 factor
    ) internal {
        if (!self.initialized) revert CLMSRErrors.TreeNotInitialized();
        if (l > r || r >= self.size) revert CLMSRErrors.InvalidRange();
        
        _updateRange(self, 1, 0, self.size - 1, l, r, factor);
    }

    /**
     * @dev Internal recursive function for range updates
     * @param self The tree storage reference
     * @param node Current node index
     * @param start Start of current node's range
     * @param end End of current node's range
     * @param l Left boundary of update range
     * @param r Right boundary of update range
     * @param factor Multiplicative factor
     */
    function _updateRange(
        Tree storage self,
        uint256 node,
        uint256 start,
        uint256 end,
        uint256 l,
        uint256 r,
        uint256 factor
    ) private {
        // Push down any lazy updates
        _pushLazy(self, node, start, end);
        
        // No overlap
        if (start > r || end < l) {
            return;
        }
        
        // Complete overlap
        if (start >= l && end <= r) {
            _applyLazy(self, node, start, end, factor);
            return;
        }
        
        // Partial overlap
        uint256 mid = (start + end) / 2;
        uint256 leftChild = 2 * node;
        uint256 rightChild = 2 * node + 1;
        
        _updateRange(self, leftChild, start, mid, l, r, factor);
        _updateRange(self, rightChild, mid + 1, end, l, r, factor);
        
        // Update current node's sum
        _pushLazy(self, leftChild, start, mid);
        _pushLazy(self, rightChild, mid + 1, end);
        
        self.nodes[node].sum = self.nodes[leftChild].sum.add(self.nodes[rightChild].sum);
    }

    /**
     * @dev Apply lazy multiplicative update to a node
     * @param self The tree storage reference
     * @param node Node index
     * @param start Start of node's range
     * @param end End of node's range
     * @param factor Multiplicative factor
     */
    function _applyLazy(
        Tree storage self,
        uint256 node,
        uint256 start,
        uint256 end,
        uint256 factor
    ) private {
        // Update the sum by multiplying with factor
        self.nodes[node].sum = self.nodes[node].sum.mul(factor);
        
        // Update lazy propagation
        if (self.nodes[node].hasLazy) {
            self.nodes[node].lazyMul = self.nodes[node].lazyMul.mul(factor);
        } else {
            self.nodes[node].lazyMul = factor;
            self.nodes[node].hasLazy = true;
        }
    }

    /**
     * @dev Push lazy updates down to children
     * @param self The tree storage reference
     * @param node Node index
     * @param start Start of node's range
     * @param end End of node's range
     */
    function _pushLazy(
        Tree storage self,
        uint256 node,
        uint256 start,
        uint256 end
    ) private {
        if (!self.nodes[node].hasLazy) {
            return;
        }
        
        // If not a leaf node, push to children
        if (start != end) {
            uint256 leftChild = 2 * node;
            uint256 rightChild = 2 * node + 1;
            uint256 mid = (start + end) / 2;
            
            _applyLazy(self, leftChild, start, mid, self.nodes[node].lazyMul);
            _applyLazy(self, rightChild, mid + 1, end, self.nodes[node].lazyMul);
        }
        
        // Clear lazy flag
        self.nodes[node].lazyMul = IDENTITY_MUL;
        self.nodes[node].hasLazy = false;
    }

    // =============================================================================
    // QUERY OPERATIONS
    // =============================================================================

    /**
     * @dev Query the sum of a range [l, r]
     * @param self The tree storage reference
     * @param l Left boundary of the range (inclusive)
     * @param r Right boundary of the range (inclusive)
     * @return Sum of the range in fixed-point format
     */
    function getSum(
        Tree storage self,
        uint256 l,
        uint256 r
    ) internal view returns (uint256) {
        if (!self.initialized) revert CLMSRErrors.TreeNotInitialized();
        if (l > r || r >= self.size) revert CLMSRErrors.InvalidRange();
        
        return _getSum(self, 1, 0, self.size - 1, l, r);
    }

    /**
     * @dev Internal recursive function for range sum queries
     * @param self The tree storage reference
     * @param node Current node index
     * @param start Start of current node's range
     * @param end End of current node's range
     * @param l Left boundary of query range
     * @param r Right boundary of query range
     * @return Sum of the queried range
     */
    function _getSum(
        Tree storage self,
        uint256 node,
        uint256 start,
        uint256 end,
        uint256 l,
        uint256 r
    ) private view returns (uint256) {
        // No overlap
        if (start > r || end < l) {
            return 0;
        }
        
        // Complete overlap
        if (start >= l && end <= r) {
            uint256 sum = self.nodes[node].sum;
            
            // Apply any pending lazy updates
            if (self.nodes[node].hasLazy) {
                sum = sum.mul(self.nodes[node].lazyMul);
            }
            
            return sum;
        }
        
        // Partial overlap
        uint256 mid = (start + end) / 2;
        uint256 leftChild = 2 * node;
        uint256 rightChild = 2 * node + 1;
        
        uint256 leftSum = _getSum(self, leftChild, start, mid, l, r);
        uint256 rightSum = _getSum(self, rightChild, mid + 1, end, l, r);
        
        uint256 totalSum = leftSum.add(rightSum);
        
        // Apply lazy multiplication if present
        if (self.nodes[node].hasLazy) {
            totalSum = totalSum.mul(self.nodes[node].lazyMul);
        }
        
        return totalSum;
    }

    /**
     * @dev Get the value at a specific index
     * @param self The tree storage reference
     * @param index Index to query
     * @return Value at the index in fixed-point format
     */
    function getValue(
        Tree storage self,
        uint256 index
    ) internal view returns (uint256) {
        if (!self.initialized) revert CLMSRErrors.TreeNotInitialized();
        if (index >= self.size) revert CLMSRErrors.IndexOutOfBounds();
        
        return getSum(self, index, index);
    }

    /**
     * @dev Get the total sum of all elements
     * @param self The tree storage reference
     * @return Total sum in fixed-point format
     */
    function getTotalSum(Tree storage self) internal view returns (uint256) {
        if (!self.initialized) revert CLMSRErrors.TreeNotInitialized();
        if (self.size == 0) return 0;
        
        return getSum(self, 0, self.size - 1);
    }

    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================

    /**
     * @dev Check if the tree is initialized
     * @param self The tree storage reference
     * @return Whether the tree is initialized
     */
    function isInitialized(Tree storage self) internal view returns (bool) {
        return self.initialized;
    }

    /**
     * @dev Get the size of the underlying array
     * @param self The tree storage reference
     * @return Size of the array
     */
    function getSize(Tree storage self) internal view returns (uint256) {
        return self.size;
    }

    /**
     * @dev Reset the tree to initial state (all values = 1.0)
     * @param self The tree storage reference
     */
    function reset(Tree storage self) internal {
        if (!self.initialized) revert CLMSRErrors.TreeNotInitialized();
        
        // Reinitialize with the same size
        uint256 currentSize = self.size;
        initialize(self, currentSize);
    }

    /**
     * @dev Get statistics about the tree for debugging
     * @param self The tree storage reference
     * @return size Size of the underlying array
     * @return treeSize Size of the tree array
     * @return totalSum Total sum of all elements
     * @return initialized Whether the tree is initialized
     */
    function getStats(Tree storage self) 
        internal 
        view 
        returns (
            uint256 size,
            uint256 treeSize,
            uint256 totalSum,
            bool initialized
        ) 
    {
        size = self.size;
        treeSize = self.treeSize;
        totalSum = self.initialized ? getTotalSum(self) : 0;
        initialized = self.initialized;
    }
}
