// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICLMSRPosition {
    struct PositionMetadata {
        uint256 marketId;
        uint256 lowerTick;
        uint256 upperTick;
        uint256 quantity;
        uint256 costBasis;
        bool isActive;
    }

    // Events
    event PositionMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 indexed marketId,
        uint256 lowerTick,
        uint256 upperTick
    );

    event PositionBurned(uint256 indexed tokenId);

    event PositionUpdated(
        uint256 indexed tokenId,
        uint256 quantity,
        uint256 costBasis
    );

    // Functions
    function mint(
        address to,
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity,
        uint256 costBasis
    ) external returns (uint256 tokenId);

    function burn(uint256 tokenId) external;

    function updatePosition(
        uint256 tokenId,
        uint256 quantity,
        uint256 costBasis
    ) external;

    // View functions
    function getPositionMetadata(uint256 tokenId) external view returns (PositionMetadata memory);

    function getMarketPositions(uint256 marketId) external view returns (uint256[] memory);

    function getOwnerPositions(address owner) external view returns (uint256[] memory);

    function getMarketPositionCount(uint256 marketId) external view returns (uint256);

    function getOwnerPositionCount(address owner) external view returns (uint256);
}
