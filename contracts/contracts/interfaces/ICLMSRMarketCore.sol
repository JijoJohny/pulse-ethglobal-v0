// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ICLMSRMarketCore
 * @dev Interface for the CLMSR Market Core contract
 */
interface ICLMSRMarketCore {
    // =============================================================================
    // STRUCTS
    // =============================================================================

    struct Market {
        uint256 marketId;
        bool isActive;
        bool isSettled;
        uint256 minTick;
        uint256 maxTick;
        uint256 tickSpacing;
        uint256 numBins;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 settlementTick;
        uint256 liquidityParameter;
        uint256 totalLiquidity;
        uint256 totalVolume;
        uint256 totalTrades;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    struct MarketStats {
        uint256 totalVolume;
        uint256 totalTrades;
        uint256 totalUsers;
        uint256 avgTradeSize;
        uint256 lastUpdated;
    }

    struct UserStats {
        uint256 totalVolume;
        uint256 totalTrades;
        uint256 totalPositions;
        uint256 totalPnL;
        uint256 lastUpdated;
    }

    // =============================================================================
    // EVENTS
    // =============================================================================

    event MarketCreated(
        uint256 indexed marketId,
        uint256 minTick,
        uint256 maxTick,
        uint256 tickSpacing,
        uint256 startTimestamp,
        uint256 endTimestamp,
        uint256 liquidityParameter
    );

    event MarketSettled(
        uint256 indexed marketId,
        uint256 settlementTick,
        uint256 settlementValue
    );

    event MarketReopened(uint256 indexed marketId);

    event MarketTimingUpdated(
        uint256 indexed marketId,
        uint256 newStartTimestamp,
        uint256 newEndTimestamp
    );

    event PositionOpened(
        uint256 indexed positionId,
        address indexed user,
        uint256 indexed marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity,
        uint256 cost
    );

    event PositionIncreased(
        uint256 indexed positionId,
        uint256 additionalQuantity,
        uint256 additionalCost,
        uint256 newQuantity
    );

    event PositionDecreased(
        uint256 indexed positionId,
        uint256 sellQuantity,
        uint256 proceeds,
        uint256 newQuantity
    );

    event PositionClosed(
        uint256 indexed positionId,
        uint256 proceeds,
        uint256 totalQuantity
    );

    event PositionSettled(
        uint256 indexed positionId,
        address indexed user,
        uint256 payout
    );

    event PositionClaimed(
        uint256 indexed positionId,
        address indexed user,
        uint256 payout
    );

    // =============================================================================
    // MARKET MANAGEMENT
    // =============================================================================

    function createMarket(
        uint256 minTick,
        uint256 maxTick,
        uint256 tickSpacing,
        uint256 startTimestamp,
        uint256 endTimestamp,
        uint256 liquidityParameter
    ) external returns (uint256);

    function settleMarket(uint256 marketId, uint256 settlementTick) external;

    function reopenMarket(uint256 marketId) external;

    function updateMarketTiming(
        uint256 marketId,
        uint256 newStartTimestamp,
        uint256 newEndTimestamp
    ) external;

    // =============================================================================
    // POSITION MANAGEMENT
    // =============================================================================

    function openPosition(
        address user,
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity,
        uint256 maxCost
    ) external returns (uint256);

    function increasePosition(
        uint256 positionId,
        uint256 additionalQuantity,
        uint256 maxCost
    ) external;

    function decreasePosition(
        uint256 positionId,
        uint256 sellQuantity,
        uint256 minProceeds
    ) external;

    function closePosition(uint256 positionId, uint256 minProceeds) external;

    function settlePosition(uint256 positionId) external;

    function claimPayout(uint256 positionId) external;

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    function calculateOpenCost(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) external view returns (uint256);

    function calculateSellProceeds(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) external view returns (uint256);

    function calculatePayout(
        uint256 lowerTick,
        uint256 upperTick,
        uint256 settlementTick,
        uint256 quantity
    ) external pure returns (uint256);

    function getMarket(uint256 marketId) external view returns (Market memory);

    function getMarketStats(uint256 marketId) external view returns (MarketStats memory);

    function getUserStats(address user) external view returns (UserStats memory);

    function nextMarketId() external view returns (uint256);

    function rbtcToken() external view returns (address);

    function positionContract() external view returns (address);
}
