// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ICLMSRMarketCore.sol";
import "../interfaces/ICLMSRPosition.sol";
import "../libraries/FixedPointMath.sol";
import "../libraries/LazyMulSegmentTree.sol";

/**
 * @title CLMSRMarketCore
 * @notice Core contract for CLMSR prediction market trading
 * @dev Implements the Continuous Logarithmic Market Scoring Rule for automated market making
 */
contract CLMSRMarketCore is ICLMSRMarketCore, Ownable, ReentrancyGuard {
    using FixedPointMath for uint256;
    using SafeERC20 for IERC20;
    using LazyMulSegmentTree for LazyMulSegmentTree.SegmentTree;

    // State variables
    mapping(uint256 => Market) private _markets;
    mapping(uint256 => Position) private _positions;
    mapping(uint256 => LazyMulSegmentTree.SegmentTree) private _marketDistributions;
    mapping(uint256 => mapping(uint256 => uint256)) private _binStates; // marketId => binIndex => quantity
    
    uint256 private _nextMarketId = 1;
    uint256 private _nextPositionId = 1;
    
    address private _positionContract;
    
    // Constants
    uint256 private constant MAX_CHUNKS_PER_TX = 1000;
    uint256 private constant MIN_LIQUIDITY_PARAMETER = 1e18; // 1.0 in WAD
    uint256 private constant MAX_LIQUIDITY_PARAMETER = 1000000e18; // 1,000,000 in WAD
    uint256 private constant MIN_TICK_SPACING = 1;
    uint256 private constant MAX_TICK_SPACING = 10000;

    // Events are defined in the interface

    // Errors
    error InvalidMarketParameters(string reason);
    error MarketNotFound();
    error PositionNotFound();
    error InvalidTickRange();
    error InvalidQuantity();
    error InsufficientBalance();
    error MarketNotActive();
    error MarketExpired();
    error MarketNotSettled();
    error PositionNotActive();
    error UnauthorizedCaller();
    error InvalidLiquidityParameter();
    error InvalidTickSpacing();
    error TransferFailed();

    /**
     * @notice Constructor
     * @param positionContract The address of the CLMSRPosition contract
     */
    constructor(address positionContract) Ownable(msg.sender) {
        _positionContract = positionContract;
    }

    /**
     * @notice Create a new prediction market
     * @param startTimestamp When the market starts
     * @param endTimestamp When the market ends
     * @param liquidityParameter The liquidity parameter (α)
     * @param paymentToken The payment token address
     * @param lowerTick The lower tick bound
     * @param upperTick The upper tick bound
     * @param tickSpacing The spacing between ticks
     * @return marketId The created market ID
     */
    function createMarket(
        uint256 startTimestamp,
        uint256 endTimestamp,
        uint256 liquidityParameter,
        address paymentToken,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 tickSpacing
    ) external onlyOwner returns (uint256 marketId) {
        // Validate parameters
        if (startTimestamp >= endTimestamp) {
            revert InvalidMarketParameters("Invalid time range");
        }
        if (liquidityParameter < MIN_LIQUIDITY_PARAMETER || liquidityParameter > MAX_LIQUIDITY_PARAMETER) {
            revert InvalidLiquidityParameter();
        }
        if (lowerTick >= upperTick) {
            revert InvalidTickRange();
        }
        if (tickSpacing < MIN_TICK_SPACING || tickSpacing > MAX_TICK_SPACING) {
            revert InvalidTickSpacing();
        }
        if (paymentToken == address(0)) {
            revert InvalidMarketParameters("Invalid payment token");
        }

        marketId = _nextMarketId++;
        
        // Calculate number of bins
        uint256 binCount = (upperTick - lowerTick) / tickSpacing + 1;
        
        // Create market
        _markets[marketId] = Market({
            marketId: marketId,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            settlementValue: 0,
            isActive: true,
            isSettled: false,
            liquidityParameter: liquidityParameter,
            paymentToken: paymentToken,
            lowerTick: lowerTick,
            upperTick: upperTick,
            tickSpacing: tickSpacing
        });

        // Initialize segment tree for this market
        LazyMulSegmentTree.initialize(_marketDistributions[marketId], binCount);

        emit MarketCreated(
            marketId,
            startTimestamp,
            endTimestamp,
            liquidityParameter,
            paymentToken,
            lowerTick,
            upperTick
        );
    }

    /**
     * @notice Open a new position
     * @param marketId The market ID
     * @param lowerTick The lower tick of the position
     * @param upperTick The upper tick of the position
     * @param quantity The quantity to purchase
     * @return positionId The created position ID
     */
    function openPosition(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) external nonReentrant returns (uint256 positionId) {
        Market storage market = _markets[marketId];
        if (market.marketId == 0) revert MarketNotFound();
        if (!market.isActive) revert MarketNotActive();
        if (block.timestamp < market.startTimestamp) {
            revert InvalidMarketParameters("Market not started");
        }
        if (block.timestamp > market.endTimestamp) {
            market.isActive = false;
            revert InvalidMarketParameters("Market expired");
        }
        if (quantity == 0) revert InvalidQuantity();

        // Calculate cost
        uint256 cost = _calculateOpenCost(marketId, lowerTick, upperTick, quantity);
        if (cost == 0) revert InvalidQuantity();

        // Transfer payment
        IERC20(market.paymentToken).safeTransferFrom(msg.sender, address(this), cost);

        // Create position
        positionId = _nextPositionId++;
        _positions[positionId] = Position({
            positionId: positionId,
            owner: msg.sender,
            marketId: marketId,
            lowerTick: lowerTick,
            upperTick: upperTick,
            quantity: quantity,
            costBasis: cost,
            isActive: true
        });

        // Update market distribution
        _updateMarketDistribution(marketId, lowerTick, upperTick, quantity, true);

        // Mint position NFT
        ICLMSRPosition(_positionContract).mint(
            msg.sender,
            marketId,
            lowerTick,
            upperTick,
            quantity,
            cost
        );

        emit PositionOpened(positionId, msg.sender, marketId, lowerTick, upperTick, quantity, cost);
    }

    /**
     * @notice Increase an existing position
     * @param positionId The position ID
     * @param quantity The quantity to add
     */
    function increasePosition(
        uint256 positionId,
        uint256 quantity
    ) external nonReentrant {
        Position storage position = _positions[positionId];
        if (position.positionId == 0) revert PositionNotFound();
        if (position.owner != msg.sender) revert UnauthorizedCaller();
        if (!position.isActive) revert PositionNotActive();
        if (quantity == 0) revert InvalidQuantity();

        Market storage market = _markets[position.marketId];
        if (!market.isActive) revert MarketNotActive();
        if (block.timestamp > market.endTimestamp) {
            market.isActive = false;
            revert InvalidMarketParameters("Market expired");
        }

        // Calculate cost
        uint256 cost = _calculateIncreaseCost(positionId, quantity);
        if (cost == 0) revert InvalidQuantity();

        // Transfer payment
        IERC20(market.paymentToken).safeTransferFrom(msg.sender, address(this), cost);

        // Update position
        position.quantity += quantity;
        position.costBasis += cost;

        // Update market distribution
        _updateMarketDistribution(position.marketId, position.lowerTick, position.upperTick, quantity, true);

        // Update position NFT
        ICLMSRPosition(_positionContract).updatePosition(positionId, position.quantity, position.costBasis);

        emit PositionIncreased(positionId, quantity, cost);
    }

    /**
     * @notice Decrease an existing position
     * @param positionId The position ID
     * @param quantity The quantity to remove
     */
    function decreasePosition(
        uint256 positionId,
        uint256 quantity
    ) external nonReentrant {
        Position storage position = _positions[positionId];
        if (position.positionId == 0) revert PositionNotFound();
        if (position.owner != msg.sender) revert UnauthorizedCaller();
        if (!position.isActive) revert PositionNotActive();
        if (quantity == 0 || quantity > position.quantity) revert InvalidQuantity();

        Market storage market = _markets[position.marketId];
        if (!market.isActive) revert MarketNotActive();
        if (block.timestamp > market.endTimestamp) {
            market.isActive = false;
            revert InvalidMarketParameters("Market expired");
        }

        // Calculate proceeds
        uint256 proceeds = _calculateDecreaseProceeds(positionId, quantity);
        if (proceeds == 0) revert InvalidQuantity();

        // Update position
        position.quantity -= quantity;
        position.costBasis = position.costBasis * (position.quantity + quantity) / (position.quantity + quantity);

        // Update market distribution
        _updateMarketDistribution(position.marketId, position.lowerTick, position.upperTick, quantity, false);

        // Update position NFT
        ICLMSRPosition(_positionContract).updatePosition(positionId, position.quantity, position.costBasis);

        // Transfer proceeds
        IERC20(market.paymentToken).safeTransfer(msg.sender, proceeds);

        emit PositionDecreased(positionId, quantity, proceeds);
    }

    /**
     * @notice Close a position completely
     * @param positionId The position ID
     */
    function closePosition(uint256 positionId) external nonReentrant {
        Position storage position = _positions[positionId];
        if (position.positionId == 0) revert PositionNotFound();
        if (position.owner != msg.sender) revert UnauthorizedCaller();
        if (!position.isActive) revert PositionNotActive();

        Market storage market = _markets[position.marketId];
        if (!market.isActive) revert MarketNotActive();
        if (block.timestamp > market.endTimestamp) {
            market.isActive = false;
            revert InvalidMarketParameters("Market expired");
        }

        uint256 quantity = position.quantity;
        uint256 proceeds = _calculateCloseProceeds(positionId);

        // Update position
        position.quantity = 0;
        position.isActive = false;

        // Update market distribution
        _updateMarketDistribution(position.marketId, position.lowerTick, position.upperTick, quantity, false);

        // Burn position NFT
        ICLMSRPosition(_positionContract).burn(positionId);

        // Transfer proceeds
        if (proceeds > 0) {
            IERC20(market.paymentToken).safeTransfer(msg.sender, proceeds);
        }

        emit PositionClosed(positionId, proceeds);
    }

    /**
     * @notice Settle a market
     * @param marketId The market ID
     * @param settlementValue The settlement value
     */
    function settleMarket(uint256 marketId, uint256 settlementValue) external onlyOwner {
        Market storage market = _markets[marketId];
        if (market.marketId == 0) revert MarketNotFound();
        if (market.isSettled) revert InvalidMarketParameters("Market already settled");
        if (block.timestamp < market.endTimestamp) {
            revert InvalidMarketParameters("Market not ended");
        }

        market.isSettled = true;
        market.settlementValue = settlementValue;
        market.isActive = false;

        emit MarketSettled(marketId, settlementValue);
    }

    /**
     * @notice Claim winnings from a settled position
     * @param positionId The position ID
     */
    function claim(uint256 positionId) external nonReentrant {
        Position storage position = _positions[positionId];
        if (position.positionId == 0) revert PositionNotFound();
        if (position.owner != msg.sender) revert UnauthorizedCaller();
        if (!position.isActive) revert PositionNotActive();

        Market storage market = _markets[position.marketId];
        if (!market.isSettled) revert MarketNotSettled();

        uint256 claimAmount = _calculateClaim(positionId);
        if (claimAmount == 0) revert InvalidQuantity();

        // Update position
        position.isActive = false;

        // Transfer winnings
        IERC20(market.paymentToken).safeTransfer(msg.sender, claimAmount);

        emit Claimed(positionId, msg.sender, claimAmount);
    }

    /**
     * @notice Calculate the cost to open a position
     * @param marketId The market ID
     * @param lowerTick The lower tick
     * @param upperTick The upper tick
     * @param quantity The quantity
     * @return The cost in payment token units
     */
    function calculateOpenCost(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) external returns (uint256) {
        return _calculateOpenCost(marketId, lowerTick, upperTick, quantity);
    }

    /**
     * @notice Calculate the cost to increase a position
     * @param positionId The position ID
     * @param quantity The quantity to add
     * @return The cost in payment token units
     */
    function calculateIncreaseCost(
        uint256 positionId,
        uint256 quantity
    ) external returns (uint256) {
        return _calculateIncreaseCost(positionId, quantity);
    }

    /**
     * @notice Calculate the proceeds from decreasing a position
     * @param positionId The position ID
     * @param quantity The quantity to remove
     * @return The proceeds in payment token units
     */
    function calculateDecreaseProceeds(
        uint256 positionId,
        uint256 quantity
    ) external returns (uint256) {
        return _calculateDecreaseProceeds(positionId, quantity);
    }

    /**
     * @notice Calculate the proceeds from closing a position
     * @param positionId The position ID
     * @return The proceeds in payment token units
     */
    function calculateCloseProceeds(uint256 positionId) external returns (uint256) {
        return _calculateCloseProceeds(positionId);
    }

    /**
     * @notice Calculate the claim amount for a settled position
     * @param positionId The position ID
     * @return The claim amount in payment token units
     */
    function calculateClaim(uint256 positionId) external view returns (uint256) {
        return _calculateClaim(positionId);
    }

    /**
     * @notice Get market information
     * @param marketId The market ID
     * @return The market struct
     */
    function getMarket(uint256 marketId) external view returns (Market memory) {
        if (_markets[marketId].marketId == 0) revert MarketNotFound();
        return _markets[marketId];
    }

    /**
     * @notice Get position information
     * @param positionId The position ID
     * @return The position struct
     */
    function getPosition(uint256 positionId) external view returns (Position memory) {
        if (_positions[positionId].positionId == 0) revert PositionNotFound();
        return _positions[positionId];
    }

    /**
     * @notice Internal function to calculate open cost using CLMSR
     */
    function _calculateOpenCost(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) internal returns (uint256) {
        Market memory market = _markets[marketId];
        LazyMulSegmentTree.SegmentTree storage distribution = _marketDistributions[marketId];
        
        // Calculate current sum
        uint256 currentSum = distribution.getTotalSum();
        
        // Calculate new sum after adding quantity
        uint256 newSum = 0;
        for (uint256 tick = lowerTick; tick <= upperTick; tick += market.tickSpacing) {
            uint256 binIndex = (tick - market.lowerTick) / market.tickSpacing;
            uint256 currentValue = distribution.getBinValue(binIndex);
            uint256 newValue = currentValue + quantity;
            newSum += _exp(newValue.wadDiv(market.liquidityParameter));
        }
        
        // Calculate cost using CLMSR formula: C = α * ln(Σ_after / Σ_before)
        if (currentSum == 0) {
            return market.liquidityParameter.wadMul(_wadLn(newSum));
        }
        
        uint256 costWad = market.liquidityParameter.wadMul(_wadLn(newSum.wadDiv(currentSum)));
        return costWad.fromWadRoundUp();
    }

    /**
     * @notice Internal function to calculate increase cost
     */
    function _calculateIncreaseCost(
        uint256 positionId,
        uint256 quantity
    ) internal returns (uint256) {
        Position memory position = _positions[positionId];
        return _calculateOpenCost(position.marketId, position.lowerTick, position.upperTick, quantity);
    }

    /**
     * @notice Internal function to calculate decrease proceeds
     */
    function _calculateDecreaseProceeds(
        uint256 positionId,
        uint256 quantity
    ) internal returns (uint256) {
        Position memory position = _positions[positionId];
        Market memory market = _markets[position.marketId];
        LazyMulSegmentTree.SegmentTree storage distribution = _marketDistributions[position.marketId];
        
        // Calculate current sum
        uint256 currentSum = distribution.getTotalSum();
        
        // Calculate new sum after removing quantity
        uint256 newSum = 0;
        for (uint256 tick = position.lowerTick; tick <= position.upperTick; tick += market.tickSpacing) {
            uint256 binIndex = (tick - market.lowerTick) / market.tickSpacing;
            uint256 currentValue = distribution.getBinValue(binIndex);
            uint256 newValue = currentValue > quantity ? currentValue - quantity : 0;
            newSum += _exp(newValue.wadDiv(market.liquidityParameter));
        }
        
        // Calculate proceeds using CLMSR formula: P = α * ln(Σ_before / Σ_after)
        if (newSum == 0) {
            return market.liquidityParameter.wadMul(_wadLn(currentSum));
        }
        
        uint256 proceedsWad = market.liquidityParameter.wadMul(_wadLn(currentSum.wadDiv(newSum)));
        return proceedsWad.fromWadRoundUp();
    }

    /**
     * @notice Internal function to calculate close proceeds
     */
    function _calculateCloseProceeds(
        uint256 positionId
    ) internal returns (uint256) {
        Position memory position = _positions[positionId];
        return _calculateDecreaseProceeds(positionId, position.quantity);
    }

    /**
     * @notice Internal function to calculate claim amount
     */
    function _calculateClaim(
        uint256 positionId
    ) internal view returns (uint256) {
        Position memory position = _positions[positionId];
        Market memory market = _markets[position.marketId];
        
        // Check if settlement value is within position range
        if (market.settlementValue >= position.lowerTick && market.settlementValue <= position.upperTick) {
            // Position wins - return cost basis plus proportional winnings
            return position.costBasis;
        } else {
            // Position loses - return 0
            return 0;
        }
    }

    /**
     * @notice Internal function to update market distribution
     */
    function _updateMarketDistribution(
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity,
        bool isAdd
    ) internal {
        Market memory market = _markets[marketId];
        LazyMulSegmentTree.SegmentTree storage distribution = _marketDistributions[marketId];
        
        for (uint256 tick = lowerTick; tick <= upperTick; tick += market.tickSpacing) {
            uint256 binIndex = (tick - market.lowerTick) / market.tickSpacing;
            uint256 currentValue = distribution.getBinValue(binIndex);
            uint256 newValue = isAdd ? currentValue + quantity : (currentValue > quantity ? currentValue - quantity : 0);
            distribution.setBinValue(binIndex, newValue);
        }
    }

    /**
     * @notice Internal function to calculate exponential
     */
    function _exp(uint256 x) internal pure returns (uint256) {
        return x.wadExp();
    }

    /**
     * @notice Internal function to calculate natural logarithm
     */
    function _wadLn(uint256 x) internal pure returns (uint256) {
        return x.wadLn();
    }

    /**
     * @notice Set the position contract address
     * @param positionContract The new position contract address
     */
    function setPositionContract(address positionContract) external onlyOwner {
        _positionContract = positionContract;
    }

    /**
     * @notice Get the position contract address
     * @return The position contract address
     */
    function getPositionContract() external view returns (address) {
        return _positionContract;
    }

    /**
     * @notice Get the next market ID
     * @return The next market ID
     */
    function getNextMarketId() external view returns (uint256) {
        return _nextMarketId;
    }

    /**
     * @notice Get the next position ID
     * @return The next position ID
     */
    function getNextPositionId() external view returns (uint256) {
        return _nextPositionId;
    }
}
