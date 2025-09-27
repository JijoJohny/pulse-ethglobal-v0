// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

/**
 * @title ICLMSRPosition
 * @dev Interface for the CLMSR Position NFT contract
 */
interface ICLMSRPosition is IERC721Upgradeable {
    // =============================================================================
    // STRUCTS
    // =============================================================================

    struct Position {
        uint256 positionId;
        address owner;
        uint256 marketId;
        uint256 lowerTick;
        uint256 upperTick;
        uint256 quantity;
        uint256 cost;
        uint256 payout;
        bool isSettled;
        bool isClaimed;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    struct PositionMetadata {
        string name;
        string description;
        string image;
        string externalUrl;
        string animationUrl;
        string backgroundColor;
        string[] attributes;
    }

    // =============================================================================
    // EVENTS
    // =============================================================================

    event PositionMinted(
        uint256 indexed positionId,
        address indexed owner,
        uint256 indexed marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    );

    event PositionBurned(uint256 indexed positionId, address indexed owner);

    event PositionUpdated(
        uint256 indexed positionId,
        uint256 newQuantity,
        uint256 newCost
    );

    event PositionSettled(
        uint256 indexed positionId,
        uint256 payout,
        bool isWinning
    );

    event PositionClaimed(uint256 indexed positionId, address indexed owner);

    event PositionClosed(uint256 indexed positionId, address indexed owner);

    // =============================================================================
    // POSITION MANAGEMENT
    // =============================================================================

    function mint(
        address to,
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) external returns (uint256);

    function burn(uint256 positionId) external;

    function increaseQuantity(uint256 positionId, uint256 additionalQuantity) external;

    function decreaseQuantity(uint256 positionId, uint256 sellQuantity) external;

    function close(uint256 positionId) external;

    function settle(uint256 positionId, uint256 payout) external;

    function claim(uint256 positionId) external;

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    function getPosition(uint256 positionId)
        external
        view
        returns (
            address owner,
            uint256 marketId,
            uint256 lowerTick,
            uint256 upperTick,
            uint256 quantity
        );

    function getPositionDetails(uint256 positionId)
        external
        view
        returns (Position memory);

    function getPositionsByOwner(address owner)
        external
        view
        returns (uint256[] memory);

    function getPositionsByMarket(uint256 marketId)
        external
        view
        returns (uint256[] memory);

    function nextPositionId() external view returns (uint256);

    function marketCore() external view returns (address);

    function totalSupply() external view returns (uint256);

    function exists(uint256 positionId) external view returns (bool);

    // =============================================================================
    // METADATA FUNCTIONS
    // =============================================================================

    function tokenURI(uint256 positionId) external view returns (string memory);

    function contractURI() external view returns (string memory);

    function setBaseURI(string memory baseURI) external;

    function setContractURI(string memory contractURI) external;
}
