// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICLMSRMarketCore {
    struct Market {
        uint256 marketId;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 settlementValue;
        bool isActive;
        bool isSettled;
        uint256 liquidityParameter; // α
        address paymentToken;
        uint256 lowerTick;
        uint256 upperTick;
        uint256 tickSpacing;
    }

    struct Position {
        uint256 positionId;
        address owner;
        uint256 marketId;
        uint256 lowerTick;
        uint256 upperTick;
        uint256 quantity;
        uint256 costBasis;
        bool isActive;
    }

    // Events
    event MarketCreated(
        uint256 indexed marketId,
        uint256 startTimestamp,
        uint256 endTimestamp,
        uint256 liquidityParameter,
        address paymentToken,
        uint256 lowerTick,
        uint256 upperTick
    );

    event PositionOpened(
        uint256 indexed positionId,
        address indexed owner,
        uint256 indexed marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity,
        uint256 cost
    );

    event PositionIncreased(
        uint256 indexed positionId,
        uint256 quantity,
        uint256 cost
    );

    event PositionDecreased(
        uint256 indexed positionId,
        uint256 quantity,
        uint256 proceeds
    );

    event PositionClosed(
        uint256 indexed positionId,
        uint256 proceeds
    );

    event MarketSettled(
        uint256 indexed marketId,
        uint256 settlementValue
    );

    event Claimed(
        uint256 indexed positionId,
        address indexed owner,
        uint256 amount
    );

    // Functions
    function createMarket(
        uint256 startTimestamp,
        uint256 endTimestamp,
        uint256 liquidityParameter,
        address paymentToken,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 tickSpacing
    ) external returns (uint256 marketId);

    function openPosition(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) external returns (uint256 positionId);

    function increasePosition(
        uint256 positionId,
        uint256 quantity
    ) external;

    function decreasePosition(
        uint256 positionId,
        uint256 quantity
    ) external;

    function closePosition(uint256 positionId) external;

    function settleMarket(uint256 marketId, uint256 settlementValue) external;

    function claim(uint256 positionId) external;

    // View functions
    function getMarket(uint256 marketId) external view returns (Market memory);

    function getPosition(uint256 positionId) external view returns (Position memory);

    function calculateOpenCost(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) external returns (uint256 cost);

    function calculateIncreaseCost(
        uint256 positionId,
        uint256 quantity
    ) external returns (uint256 cost);

    function calculateDecreaseProceeds(
        uint256 positionId,
        uint256 quantity
    ) external returns (uint256 proceeds);

    function calculateCloseProceeds(uint256 positionId) external returns (uint256 proceeds);

    function calculateClaim(uint256 positionId) external view returns (uint256 amount);
}
