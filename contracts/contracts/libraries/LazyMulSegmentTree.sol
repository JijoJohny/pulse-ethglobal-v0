// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FixedPointMath.sol";

/**
 * @title LazyMulSegmentTree
 * @notice A segment tree with lazy multiplication updates for efficient range operations
 * @dev Optimized for CLMSR calculations with logarithmic time complexity
 */
library LazyMulSegmentTree {
    using FixedPointMath for uint256;

    struct Node {
        uint256 value;      // Current value
        uint256 lazy;       // Lazy multiplication factor
        bool hasLazy;       // Whether lazy update is pending
    }

    struct SegmentTree {
        Node[] nodes;
        uint256 size;
        uint256 capacity;
    }

    error SegmentTreeInvalidIndex();
    error SegmentTreeInvalidRange();
    error SegmentTreeEmpty();

    /**
     * @notice Initialize a segment tree with given capacity
     * @param tree The segment tree to initialize
     * @param capacity The maximum number of elements
     */
    function initialize(SegmentTree storage tree, uint256 capacity) internal {
        if (capacity == 0) revert SegmentTreeInvalidRange();
        
        // Calculate tree size (next power of 2)
        tree.capacity = capacity;
        tree.size = 1;
        while (tree.size < capacity) {
            tree.size <<= 1;
        }
        
        // Initialize nodes array (size * 2 for complete binary tree)
        delete tree.nodes;
        
        // Initialize all nodes
        for (uint256 i = 0; i < tree.size * 2; i++) {
            tree.nodes.push(Node({
                value: 0,
                lazy: 0,
                hasLazy: false
            }));
        }
    }

    /**
     * @notice Update a single element
     * @param tree The segment tree
     * @param index The index to update
     * @param value The new value
     */
    function update(SegmentTree storage tree, uint256 index, uint256 value) internal {
        if (index >= tree.capacity) revert SegmentTreeInvalidIndex();
        
        _updateRange(tree, 1, 0, tree.size - 1, index, index, value, false);
    }

    /**
     * @notice Update a range of elements with multiplication
     * @param tree The segment tree
     * @param left Left boundary (inclusive)
     * @param right Right boundary (inclusive)
     * @param multiplier The multiplication factor
     */
    function updateRange(
        SegmentTree storage tree,
        uint256 left,
        uint256 right,
        uint256 multiplier
    ) internal {
        if (left > right || right >= tree.capacity) revert SegmentTreeInvalidRange();
        
        _updateRange(tree, 1, 0, tree.size - 1, left, right, multiplier, true);
    }

    /**
     * @notice Query a single element
     * @param tree The segment tree
     * @param index The index to query
     * @return The value at the index
     */
    function query(SegmentTree storage tree, uint256 index) internal returns (uint256) {
        if (index >= tree.capacity) revert SegmentTreeInvalidIndex();
        
        return _queryRange(tree, 1, 0, tree.size - 1, index, index);
    }

    /**
     * @notice Query the sum of a range
     * @param tree The segment tree
     * @param left Left boundary (inclusive)
     * @param right Right boundary (inclusive)
     * @return The sum of the range
     */
    function queryRange(
        SegmentTree storage tree,
        uint256 left,
        uint256 right
    ) internal returns (uint256) {
        if (left > right || right >= tree.capacity) revert SegmentTreeInvalidRange();
        
        return _queryRange(tree, 1, 0, tree.size - 1, left, right);
    }

    /**
     * @notice Get the total sum of all elements
     * @param tree The segment tree
     * @return The total sum
     */
    function getTotalSum(SegmentTree storage tree) internal returns (uint256) {
        if (tree.capacity == 0) revert SegmentTreeEmpty();
        
        return _queryRange(tree, 1, 0, tree.size - 1, 0, tree.capacity - 1);
    }

    /**
     * @notice Internal function to update a range
     */
    function _updateRange(
        SegmentTree storage tree,
        uint256 node,
        uint256 nodeLeft,
        uint256 nodeRight,
        uint256 left,
        uint256 right,
        uint256 value,
        bool isMultiply
    ) internal {
        // Apply lazy updates
        _pushLazy(tree, node, nodeLeft, nodeRight);
        
        // No overlap
        if (nodeRight < left || nodeLeft > right) {
            return;
        }
        
        // Complete overlap
        if (left <= nodeLeft && nodeRight <= right) {
            if (isMultiply) {
                tree.nodes[node].lazy = value;
                tree.nodes[node].hasLazy = true;
            } else {
                tree.nodes[node].value = value;
            }
            _pushLazy(tree, node, nodeLeft, nodeRight);
            return;
        }
        
        // Partial overlap - recurse
        uint256 mid = (nodeLeft + nodeRight) / 2;
        _updateRange(tree, node * 2, nodeLeft, mid, left, right, value, isMultiply);
        _updateRange(tree, node * 2 + 1, mid + 1, nodeRight, left, right, value, isMultiply);
        
        // Update current node
        tree.nodes[node].value = tree.nodes[node * 2].value + tree.nodes[node * 2 + 1].value;
    }

    /**
     * @notice Internal function to query a range
     */
    function _queryRange(
        SegmentTree storage tree,
        uint256 node,
        uint256 nodeLeft,
        uint256 nodeRight,
        uint256 left,
        uint256 right
    ) internal returns (uint256) {
        // Apply lazy updates
        _pushLazy(tree, node, nodeLeft, nodeRight);
        
        // No overlap
        if (nodeRight < left || nodeLeft > right) {
            return 0;
        }
        
        // Complete overlap
        if (left <= nodeLeft && nodeRight <= right) {
            return tree.nodes[node].value;
        }
        
        // Partial overlap - recurse
        uint256 mid = (nodeLeft + nodeRight) / 2;
        uint256 leftSum = _queryRange(tree, node * 2, nodeLeft, mid, left, right);
        uint256 rightSum = _queryRange(tree, node * 2 + 1, mid + 1, nodeRight, left, right);
        
        return leftSum + rightSum;
    }

    /**
     * @notice Push lazy updates down the tree
     */
    function _pushLazy(
        SegmentTree storage tree,
        uint256 node,
        uint256 nodeLeft,
        uint256 nodeRight
    ) internal {
        if (!tree.nodes[node].hasLazy) {
            return;
        }
        
        // Apply lazy multiplication
        if (tree.nodes[node].lazy != 0) {
            tree.nodes[node].value = tree.nodes[node].value.wadMul(tree.nodes[node].lazy);
        }
        
        // Push to children if not leaf
        if (nodeLeft != nodeRight) {
            tree.nodes[node * 2].lazy = tree.nodes[node].lazy;
            tree.nodes[node * 2].hasLazy = true;
            tree.nodes[node * 2 + 1].lazy = tree.nodes[node].lazy;
            tree.nodes[node * 2 + 1].hasLazy = true;
        }
        
        // Clear lazy update
        tree.nodes[node].lazy = 0;
        tree.nodes[node].hasLazy = false;
    }

    /**
     * @notice Get the number of bins in the tree
     * @param tree The segment tree
     * @return The number of bins
     */
    function getBinCount(SegmentTree storage tree) internal view returns (uint256) {
        return tree.capacity;
    }

    /**
     * @notice Get the value at a specific bin
     * @param tree The segment tree
     * @param binIndex The bin index
     * @return The value at the bin
     */
    function getBinValue(SegmentTree storage tree, uint256 binIndex) internal returns (uint256) {
        return query(tree, binIndex);
    }

    /**
     * @notice Set the value at a specific bin
     * @param tree The segment tree
     * @param binIndex The bin index
     * @param value The new value
     */
    function setBinValue(SegmentTree storage tree, uint256 binIndex, uint256 value) internal {
        update(tree, binIndex, value);
    }

    /**
     * @notice Multiply all bins by a factor
     * @param tree The segment tree
     * @param factor The multiplication factor
     */
    function multiplyAllBins(SegmentTree storage tree, uint256 factor) internal {
        if (tree.capacity > 0) {
            updateRange(tree, 0, tree.capacity - 1, factor);
        }
    }
}
