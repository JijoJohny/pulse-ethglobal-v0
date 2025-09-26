// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

import "./interfaces/ICLMSRMarketCore.sol";
import "./interfaces/ICLMSRPosition.sol";
import "./libraries/FixedPointMath.sol";
import "./libraries/LazyMulSegmentTree.sol";
import "./errors/CLMSRErrors.sol";

/**
 * @title CLMSRMarketCore
 * @dev Continuous Logarithmic Market Scoring Rule implementation for Rootstock
 * @notice This contract implements the CLMSR mechanism for prediction markets on Rootstock Bitcoin sidechain
 */
contract CLMSRMarketCore is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ICLMSRMarketCore
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;
    using FixedPointMath for uint256;
    using LazyMulSegmentTree for LazyMulSegmentTree.Tree;

    // =============================================================================
    // CONSTANTS
    // =============================================================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    /// @dev Next market ID
    uint256 public nextMarketId;

    /// @dev RBTC token address
    address public rbtcToken;

    /// @dev Position contract address
    address public positionContract;

    /// @dev Markets mapping
    mapping(uint256 => Market) public markets;

    /// @dev Market distributions for each market
    mapping(uint256 => LazyMulSegmentTree.Tree) public marketDistributions;

    /// @dev Market statistics
    mapping(uint256 => MarketStats) public marketStats;

    /// @dev User statistics
    mapping(address => UserStats) public userStats;

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
    // INITIALIZATION
    // =============================================================================

    function initialize(
        address _rbtcToken,
        address _positionContract
    ) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        rbtcToken = _rbtcToken;
        positionContract = _positionContract;
        nextMarketId = 1;
    }

    // =============================================================================
    // MARKET MANAGEMENT
    // =============================================================================

    /**
     * @dev Create a new market
     * @param minTick Minimum tick value
     * @param maxTick Maximum tick value
     * @param tickSpacing Tick spacing
     * @param startTimestamp Market start timestamp
     * @param endTimestamp Market end timestamp
     * @param liquidityParameter Liquidity parameter (alpha)
     */
    function createMarket(
        uint256 minTick,
        uint256 maxTick,
        uint256 tickSpacing,
        uint256 startTimestamp,
        uint256 endTimestamp,
        uint256 liquidityParameter
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        if (minTick >= maxTick) revert CLMSRErrors.InvalidTickRange();
        if (tickSpacing == 0) revert CLMSRErrors.InvalidTickSpacing();
        if (startTimestamp >= endTimestamp) revert CLMSRErrors.InvalidTiming();
        if (liquidityParameter == 0) revert CLMSRErrors.InvalidLiquidityParameter();

        uint256 marketId = nextMarketId++;
        uint256 numBins = (maxTick - minTick) / tickSpacing;

        markets[marketId] = Market({
            marketId: marketId,
            isActive: true,
            isSettled: false,
            minTick: minTick,
            maxTick: maxTick,
            tickSpacing: tickSpacing,
            numBins: numBins,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            settlementTick: 0,
            liquidityParameter: liquidityParameter,
            totalLiquidity: 0,
            totalVolume: 0,
            totalTrades: 0,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        // Initialize market distribution
        marketDistributions[marketId].initialize(numBins);

        emit MarketCreated(
            marketId,
            minTick,
            maxTick,
            tickSpacing,
            startTimestamp,
            endTimestamp,
            liquidityParameter
        );

        return marketId;
    }

    /**
     * @dev Settle a market
     * @param marketId Market ID
     * @param settlementTick Settlement tick
     */
    function settleMarket(
        uint256 marketId,
        uint256 settlementTick
    ) external onlyRole(KEEPER_ROLE) {
        Market storage market = markets[marketId];
        if (!market.isActive) revert CLMSRErrors.MarketNotActive();
        if (market.isSettled) revert CLMSRErrors.MarketAlreadySettled();
        if (block.timestamp < market.endTimestamp) revert CLMSRErrors.MarketNotEnded();

        market.isSettled = true;
        market.settlementTick = settlementTick;
        market.lastUpdated = block.timestamp;

        emit MarketSettled(marketId, settlementTick, settlementTick);
    }

    /**
     * @dev Reopen a market
     * @param marketId Market ID
     */
    function reopenMarket(uint256 marketId) external onlyRole(ADMIN_ROLE) {
        Market storage market = markets[marketId];
        if (!market.isSettled) revert CLMSRErrors.MarketNotSettled();

        market.isSettled = false;
        market.settlementTick = 0;
        market.lastUpdated = block.timestamp;

        emit MarketReopened(marketId);
    }

    /**
     * @dev Update market timing
     * @param marketId Market ID
     * @param newStartTimestamp New start timestamp
     * @param newEndTimestamp New end timestamp
     */
    function updateMarketTiming(
        uint256 marketId,
        uint256 newStartTimestamp,
        uint256 newEndTimestamp
    ) external onlyRole(ADMIN_ROLE) {
        Market storage market = markets[marketId];
        if (!market.isActive) revert CLMSRErrors.MarketNotActive();
        if (newStartTimestamp >= newEndTimestamp) revert CLMSRErrors.InvalidTiming();

        market.startTimestamp = newStartTimestamp;
        market.endTimestamp = newEndTimestamp;
        market.lastUpdated = block.timestamp;

        emit MarketTimingUpdated(marketId, newStartTimestamp, newEndTimestamp);
    }

    // =============================================================================
    // POSITION MANAGEMENT
    // =============================================================================

    /**
     * @dev Open a new position
     * @param user User address
     * @param marketId Market ID
     * @param lowerTick Lower tick
     * @param upperTick Upper tick
     * @param quantity Position quantity
     * @param maxCost Maximum cost
     */
    function openPosition(
        address user,
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity,
        uint256 maxCost
    ) external nonReentrant whenNotPaused returns (uint256) {
        if (user == address(0)) revert CLMSRErrors.InvalidUser();
        if (quantity == 0) revert CLMSRErrors.InvalidQuantity();
        if (maxCost == 0) revert CLMSRErrors.InvalidCost();

        Market storage market = markets[marketId];
        if (!market.isActive) revert CLMSRErrors.MarketNotActive();
        if (market.isSettled) revert CLMSRErrors.MarketSettled();
        if (block.timestamp < market.startTimestamp) revert CLMSRErrors.MarketNotStarted();
        if (block.timestamp > market.endTimestamp) revert CLMSRErrors.MarketEnded();

        // Validate tick range
        if (lowerTick >= upperTick) revert CLMSRErrors.InvalidTickRange();
        if (lowerTick < market.minTick || upperTick > market.maxTick) {
            revert CLMSRErrors.TickOutOfRange();
        }

        // Calculate cost using CLMSR formula
        uint256 cost = calculateOpenCost(marketId, lowerTick, upperTick, quantity);
        if (cost > maxCost) revert CLMSRErrors.CostExceedsMax();

        // Transfer RBTC from user
        IERC20Upgradeable(rbtcToken).safeTransferFrom(user, address(this), cost);

        // Create position
        uint256 positionId = ICLMSRPosition(positionContract).mint(
            user,
            marketId,
            lowerTick,
            upperTick,
            quantity
        );

        // Update market distribution
        updateMarketDistribution(marketId, lowerTick, upperTick, quantity, true);

        // Update statistics
        updateMarketStats(marketId, cost, quantity);
        updateUserStats(user, cost, quantity);

        emit PositionOpened(positionId, user, marketId, lowerTick, upperTick, quantity, cost);

        return positionId;
    }

    /**
     * @dev Increase position
     * @param positionId Position ID
     * @param additionalQuantity Additional quantity
     * @param maxCost Maximum additional cost
     */
    function increasePosition(
        uint256 positionId,
        uint256 additionalQuantity,
        uint256 maxCost
    ) external nonReentrant whenNotPaused {
        if (additionalQuantity == 0) revert CLMSRErrors.InvalidQuantity();
        if (maxCost == 0) revert CLMSRErrors.InvalidCost();

        // Get position data
        (address user, uint256 marketId, uint256 lowerTick, uint256 upperTick, uint256 currentQuantity) = 
            ICLMSRPosition(positionContract).getPosition(positionId);

        if (user != msg.sender) revert CLMSRErrors.Unauthorized();

        Market storage market = markets[marketId];
        if (!market.isActive) revert CLMSRErrors.MarketNotActive();
        if (market.isSettled) revert CLMSRErrors.MarketSettled();

        // Calculate additional cost
        uint256 additionalCost = calculateOpenCost(marketId, lowerTick, upperTick, additionalQuantity);
        if (additionalCost > maxCost) revert CLMSRErrors.CostExceedsMax();

        // Transfer RBTC from user
        IERC20Upgradeable(rbtcToken).safeTransferFrom(user, address(this), additionalCost);

        // Update position
        ICLMSRPosition(positionContract).increaseQuantity(positionId, additionalQuantity);

        // Update market distribution
        updateMarketDistribution(marketId, lowerTick, upperTick, additionalQuantity, true);

        // Update statistics
        updateMarketStats(marketId, additionalCost, additionalQuantity);
        updateUserStats(user, additionalCost, additionalQuantity);

        emit PositionIncreased(positionId, additionalQuantity, additionalCost, currentQuantity + additionalQuantity);
    }

    /**
     * @dev Decrease position
     * @param positionId Position ID
     * @param sellQuantity Quantity to sell
     * @param minProceeds Minimum proceeds
     */
    function decreasePosition(
        uint256 positionId,
        uint256 sellQuantity,
        uint256 minProceeds
    ) external nonReentrant whenNotPaused {
        if (sellQuantity == 0) revert CLMSRErrors.InvalidQuantity();

        // Get position data
        (address user, uint256 marketId, uint256 lowerTick, uint256 upperTick, uint256 currentQuantity) = 
            ICLMSRPosition(positionContract).getPosition(positionId);

        if (user != msg.sender) revert CLMSRErrors.Unauthorized();
        if (sellQuantity > currentQuantity) revert CLMSRErrors.InsufficientQuantity();

        Market storage market = markets[marketId];
        if (!market.isActive) revert CLMSRErrors.MarketNotActive();

        // Calculate proceeds
        uint256 proceeds = calculateSellProceeds(marketId, lowerTick, upperTick, sellQuantity);
        if (proceeds < minProceeds) revert CLMSRErrors.ProceedsBelowMin();

        // Update position
        ICLMSRPosition(positionContract).decreaseQuantity(positionId, sellQuantity);

        // Update market distribution
        updateMarketDistribution(marketId, lowerTick, upperTick, sellQuantity, false);

        // Transfer RBTC to user
        IERC20Upgradeable(rbtcToken).safeTransfer(user, proceeds);

        // Update statistics
        updateMarketStats(marketId, 0, sellQuantity);
        updateUserStats(user, 0, sellQuantity);

        emit PositionDecreased(positionId, sellQuantity, proceeds, currentQuantity - sellQuantity);
    }

    /**
     * @dev Close position
     * @param positionId Position ID
     * @param minProceeds Minimum proceeds
     */
    function closePosition(
        uint256 positionId,
        uint256 minProceeds
    ) external nonReentrant whenNotPaused {
        // Get position data
        (address user, uint256 marketId, uint256 lowerTick, uint256 upperTick, uint256 quantity) = 
            ICLMSRPosition(positionContract).getPosition(positionId);

        if (user != msg.sender) revert CLMSRErrors.Unauthorized();

        Market storage market = markets[marketId];
        if (!market.isActive) revert CLMSRErrors.MarketNotActive();

        // Calculate proceeds
        uint256 proceeds = calculateSellProceeds(marketId, lowerTick, upperTick, quantity);
        if (proceeds < minProceeds) revert CLMSRErrors.ProceedsBelowMin();

        // Close position
        ICLMSRPosition(positionContract).close(positionId);

        // Update market distribution
        updateMarketDistribution(marketId, lowerTick, upperTick, quantity, false);

        // Transfer RBTC to user
        IERC20Upgradeable(rbtcToken).safeTransfer(user, proceeds);

        // Update statistics
        updateMarketStats(marketId, 0, quantity);
        updateUserStats(user, 0, quantity);

        emit PositionClosed(positionId, proceeds, quantity);
    }

    // =============================================================================
    // SETTLEMENT AND CLAIMS
    // =============================================================================

    /**
     * @dev Settle position
     * @param positionId Position ID
     */
    function settlePosition(uint256 positionId) external nonReentrant {
        // Get position data
        (address user, uint256 marketId, uint256 lowerTick, uint256 upperTick, uint256 quantity) = 
            ICLMSRPosition(positionContract).getPosition(positionId);

        Market storage market = markets[marketId];
        if (!market.isSettled) revert CLMSRErrors.MarketNotSettled();

        // Calculate payout
        uint256 payout = calculatePayout(lowerTick, upperTick, market.settlementTick, quantity);

        // Update position
        ICLMSRPosition(positionContract).settle(positionId, payout);

        // Transfer payout to user
        if (payout > 0) {
            IERC20Upgradeable(rbtcToken).safeTransfer(user, payout);
        }

        emit PositionSettled(positionId, user, payout);
    }

    /**
     * @dev Claim payout
     * @param positionId Position ID
     */
    function claimPayout(uint256 positionId) external nonReentrant {
        // Get position data
        (address user, uint256 marketId, uint256 lowerTick, uint256 upperTick, uint256 quantity) = 
            ICLMSRPosition(positionContract).getPosition(positionId);

        if (user != msg.sender) revert CLMSRErrors.Unauthorized();

        Market storage market = markets[marketId];
        if (!market.isSettled) revert CLMSRErrors.MarketNotSettled();

        // Calculate payout
        uint256 payout = calculatePayout(lowerTick, upperTick, market.settlementTick, quantity);

        // Update position
        ICLMSRPosition(positionContract).claim(positionId);

        // Transfer payout to user
        if (payout > 0) {
            IERC20Upgradeable(rbtcToken).safeTransfer(user, payout);
        }

        emit PositionClaimed(positionId, user, payout);
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    /**
     * @dev Calculate cost to open position
     * @param marketId Market ID
     * @param lowerTick Lower tick
     * @param upperTick Upper tick
     * @param quantity Position quantity
     */
    function calculateOpenCost(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) public view returns (uint256) {
        Market storage market = markets[marketId];
        if (!market.isActive) revert CLMSRErrors.MarketNotActive();

        // Get current distribution
        LazyMulSegmentTree.Tree storage tree = marketDistributions[marketId];
        
        // Calculate cost using CLMSR formula
        uint256 alpha = market.liquidityParameter;
        uint256 affectedSum = tree.getSum(lowerTick, upperTick);
        
        if (affectedSum == 0) {
            // First position in range
            return quantity.mul(alpha).div(1e18);
        }

        // Calculate factor: exp(quantity / alpha)
        uint256 factor = FixedPointMath.exp(quantity.mul(1e18).div(alpha));
        
        // Calculate new affected sum
        uint256 newAffectedSum = affectedSum.mul(factor).div(1e18);
        
        // Calculate cost: alpha * ln(newSum / oldSum)
        uint256 cost = alpha.mul(FixedPointMath.ln(newAffectedSum.mul(1e18).div(affectedSum))).div(1e18);
        
        return cost;
    }

    /**
     * @dev Calculate proceeds from selling position
     * @param marketId Market ID
     * @param lowerTick Lower tick
     * @param upperTick Upper tick
     * @param quantity Quantity to sell
     */
    function calculateSellProceeds(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) public view returns (uint256) {
        Market storage market = markets[marketId];
        if (!market.isActive) revert CLMSRErrors.MarketNotActive();

        // Get current distribution
        LazyMulSegmentTree.Tree storage tree = marketDistributions[marketId];
        
        // Calculate proceeds using CLMSR formula
        uint256 alpha = market.liquidityParameter;
        uint256 affectedSum = tree.getSum(lowerTick, upperTick);
        
        if (affectedSum == 0) {
            return 0;
        }

        // Calculate factor: exp(-quantity / alpha)
        uint256 factor = FixedPointMath.exp(quantity.mul(1e18).div(alpha).mul(-1));
        
        // Calculate new affected sum
        uint256 newAffectedSum = affectedSum.mul(factor).div(1e18);
        
        // Calculate proceeds: alpha * ln(oldSum / newSum)
        uint256 proceeds = alpha.mul(FixedPointMath.ln(affectedSum.mul(1e18).div(newAffectedSum))).div(1e18);
        
        return proceeds;
    }

    /**
     * @dev Calculate payout for settled position
     * @param lowerTick Lower tick
     * @param upperTick Upper tick
     * @param settlementTick Settlement tick
     * @param quantity Position quantity
     */
    function calculatePayout(
        uint256 lowerTick,
        uint256 upperTick,
        uint256 settlementTick,
        uint256 quantity
    ) public pure returns (uint256) {
        if (settlementTick >= lowerTick && settlementTick < upperTick) {
            return quantity;
        }
        return 0;
    }

    /**
     * @dev Get market data
     * @param marketId Market ID
     */
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    /**
     * @dev Get market statistics
     * @param marketId Market ID
     */
    function getMarketStats(uint256 marketId) external view returns (MarketStats memory) {
        return marketStats[marketId];
    }

    /**
     * @dev Get user statistics
     * @param user User address
     */
    function getUserStats(address user) external view returns (UserStats memory) {
        return userStats[user];
    }

    // =============================================================================
    // INTERNAL FUNCTIONS
    // =============================================================================

    /**
     * @dev Update market distribution
     * @param marketId Market ID
     * @param lowerTick Lower tick
     * @param upperTick Upper tick
     * @param quantity Quantity
     * @param isBuy Whether this is a buy or sell
     */
    function updateMarketDistribution(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity,
        bool isBuy
    ) internal {
        LazyMulSegmentTree.Tree storage tree = marketDistributions[marketId];
        
        if (isBuy) {
            // Apply multiplicative factor for buy
            uint256 factor = FixedPointMath.exp(quantity.mul(1e18).div(markets[marketId].liquidityParameter));
            tree.updateRange(lowerTick, upperTick, factor);
        } else {
            // Apply multiplicative factor for sell
            uint256 factor = FixedPointMath.exp(quantity.mul(1e18).div(markets[marketId].liquidityParameter).mul(-1));
            tree.updateRange(lowerTick, upperTick, factor);
        }
    }

    /**
     * @dev Update market statistics
     * @param marketId Market ID
     * @param cost Cost
     * @param quantity Quantity
     */
    function updateMarketStats(
        uint256 marketId,
        uint256 cost,
        uint256 quantity
    ) internal {
        MarketStats storage stats = marketStats[marketId];
        stats.totalVolume = stats.totalVolume.add(cost);
        stats.totalTrades = stats.totalTrades.add(1);
        stats.lastUpdated = block.timestamp;
    }

    /**
     * @dev Update user statistics
     * @param user User address
     * @param cost Cost
     * @param quantity Quantity
     */
    function updateUserStats(
        address user,
        uint256 cost,
        uint256 quantity
    ) internal {
        UserStats storage stats = userStats[user];
        stats.totalVolume = stats.totalVolume.add(cost);
        stats.totalTrades = stats.totalTrades.add(1);
        stats.lastUpdated = block.timestamp;
    }

    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Authorize upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Emergency withdraw
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(ADMIN_ROLE) {
        IERC20Upgradeable(token).safeTransfer(msg.sender, amount);
    }
}
