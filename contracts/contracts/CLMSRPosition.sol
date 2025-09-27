// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";

import "./interfaces/ICLMSRPosition.sol";
import "./errors/CLMSRErrors.sol";

/**
 * @title CLMSRPosition
 * @dev ERC721 NFT contract for CLMSR position management
 * @notice Each NFT represents a position in a prediction market with specific tick range and quantity
 */
contract CLMSRPosition is 
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ICLMSRPosition
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using StringsUpgradeable for uint256;

    // =============================================================================
    // CONSTANTS
    // =============================================================================

    bytes32 public constant MARKET_CORE_ROLE = keccak256("MARKET_CORE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    /// @dev Counter for position IDs
    CountersUpgradeable.Counter private _positionIdCounter;

    /// @dev Market core contract address
    address public override marketCore;

    /// @dev Base URI for metadata
    string private _baseTokenURI;

    /// @dev Contract URI for collection metadata
    string private _contractURI;

    /// @dev Mapping from position ID to position data
    mapping(uint256 => Position) private _positions;

    /// @dev Mapping from owner to list of position IDs
    mapping(address => uint256[]) private _ownerPositions;

    /// @dev Mapping from market ID to list of position IDs
    mapping(uint256 => uint256[]) private _marketPositions;

    /// @dev Mapping from position ID to index in owner's position list
    mapping(uint256 => uint256) private _ownerPositionIndex;

    /// @dev Mapping from position ID to index in market's position list
    mapping(uint256 => uint256) private _marketPositionIndex;

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    function initialize(
        address _marketCore,
        string memory _name,
        string memory _symbol,
        string memory baseURI,
        string memory contractURI_
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(MARKET_CORE_ROLE, _marketCore);

        marketCore = _marketCore;
        _baseTokenURI = baseURI;
        _contractURI = contractURI_;

        // Start position IDs from 1
        _positionIdCounter.increment();
    }

    // =============================================================================
    // POSITION MANAGEMENT
    // =============================================================================

    /**
     * @dev Mint a new position NFT
     * @param to Address to mint the NFT to
     * @param marketId Market ID
     * @param lowerTick Lower tick of the position
     * @param upperTick Upper tick of the position
     * @param quantity Initial quantity of the position
     * @return positionId The minted position ID
     */
    function mint(
        address to,
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity
    ) external override onlyRole(MARKET_CORE_ROLE) returns (uint256) {
        if (to == address(0)) revert CLMSRErrors.InvalidAddress();
        if (quantity == 0) revert CLMSRErrors.InvalidQuantity();
        if (lowerTick >= upperTick) revert CLMSRErrors.InvalidTickRange();

        uint256 positionId = _positionIdCounter.current();
        _positionIdCounter.increment();

        // Create position data
        _positions[positionId] = Position({
            positionId: positionId,
            owner: to,
            marketId: marketId,
            lowerTick: lowerTick,
            upperTick: upperTick,
            quantity: quantity,
            cost: 0, // Will be updated by market core
            payout: 0,
            isSettled: false,
            isClaimed: false,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        // Mint the NFT
        _safeMint(to, positionId);

        // Update indexes
        _addToOwnerPositions(to, positionId);
        _addToMarketPositions(marketId, positionId);

        emit PositionMinted(positionId, to, marketId, lowerTick, upperTick, quantity);

        return positionId;
    }

    /**
     * @dev Burn a position NFT
     * @param positionId Position ID to burn
     */
    function burn(uint256 positionId) external override onlyRole(MARKET_CORE_ROLE) {
        if (!_exists(positionId)) revert CLMSRErrors.PositionNotExists();

        Position storage position = _positions[positionId];
        address owner = position.owner;
        uint256 marketId = position.marketId;

        // Remove from indexes
        _removeFromOwnerPositions(owner, positionId);
        _removeFromMarketPositions(marketId, positionId);

        // Burn the NFT
        _burn(positionId);

        // Delete position data
        delete _positions[positionId];

        emit PositionBurned(positionId, owner);
    }

    /**
     * @dev Increase position quantity
     * @param positionId Position ID
     * @param additionalQuantity Additional quantity to add
     */
    function increaseQuantity(
        uint256 positionId,
        uint256 additionalQuantity
    ) external override onlyRole(MARKET_CORE_ROLE) {
        if (!_exists(positionId)) revert CLMSRErrors.PositionNotExists();
        if (additionalQuantity == 0) revert CLMSRErrors.InvalidQuantity();

        Position storage position = _positions[positionId];
        if (position.isSettled) revert CLMSRErrors.PositionAlreadySettled();

        uint256 newQuantity = position.quantity + additionalQuantity;
        position.quantity = newQuantity;
        position.lastUpdated = block.timestamp;

        emit PositionUpdated(positionId, newQuantity, position.cost);
    }

    /**
     * @dev Decrease position quantity
     * @param positionId Position ID
     * @param sellQuantity Quantity to remove
     */
    function decreaseQuantity(
        uint256 positionId,
        uint256 sellQuantity
    ) external override onlyRole(MARKET_CORE_ROLE) {
        if (!_exists(positionId)) revert CLMSRErrors.PositionNotExists();
        if (sellQuantity == 0) revert CLMSRErrors.InvalidQuantity();

        Position storage position = _positions[positionId];
        if (position.isSettled) revert CLMSRErrors.PositionAlreadySettled();
        if (sellQuantity > position.quantity) revert CLMSRErrors.InsufficientQuantity();

        uint256 newQuantity = position.quantity - sellQuantity;
        position.quantity = newQuantity;
        position.lastUpdated = block.timestamp;

        emit PositionUpdated(positionId, newQuantity, position.cost);
    }

    /**
     * @dev Close a position (burn the NFT)
     * @param positionId Position ID to close
     */
    function close(uint256 positionId) external override onlyRole(MARKET_CORE_ROLE) {
        if (!_exists(positionId)) revert CLMSRErrors.PositionNotExists();

        Position storage position = _positions[positionId];
        address owner = position.owner;

        emit PositionClosed(positionId, owner);

        // Burn the position
        burn(positionId);
    }

    /**
     * @dev Settle a position with payout amount
     * @param positionId Position ID
     * @param payout Payout amount
     */
    function settle(
        uint256 positionId,
        uint256 payout
    ) external override onlyRole(MARKET_CORE_ROLE) {
        if (!_exists(positionId)) revert CLMSRErrors.PositionNotExists();

        Position storage position = _positions[positionId];
        if (position.isSettled) revert CLMSRErrors.PositionAlreadySettled();

        position.payout = payout;
        position.isSettled = true;
        position.lastUpdated = block.timestamp;

        bool isWinning = payout > 0;
        emit PositionSettled(positionId, payout, isWinning);
    }

    /**
     * @dev Claim a settled position
     * @param positionId Position ID
     */
    function claim(uint256 positionId) external override onlyRole(MARKET_CORE_ROLE) {
        if (!_exists(positionId)) revert CLMSRErrors.PositionNotExists();

        Position storage position = _positions[positionId];
        if (!position.isSettled) revert CLMSRErrors.PositionNotSettled();
        if (position.isClaimed) revert CLMSRErrors.PositionAlreadyClaimed();

        position.isClaimed = true;
        position.lastUpdated = block.timestamp;

        emit PositionClaimed(positionId, position.owner);
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    /**
     * @dev Get basic position information
     * @param positionId Position ID
     * @return owner Position owner
     * @return marketId Market ID
     * @return lowerTick Lower tick
     * @return upperTick Upper tick
     * @return quantity Position quantity
     */
    function getPosition(uint256 positionId)
        external
        view
        override
        returns (
            address owner,
            uint256 marketId,
            uint256 lowerTick,
            uint256 upperTick,
            uint256 quantity
        )
    {
        if (!_exists(positionId)) revert CLMSRErrors.PositionNotExists();

        Position storage position = _positions[positionId];
        return (
            position.owner,
            position.marketId,
            position.lowerTick,
            position.upperTick,
            position.quantity
        );
    }

    /**
     * @dev Get detailed position information
     * @param positionId Position ID
     * @return position Complete position data
     */
    function getPositionDetails(uint256 positionId)
        external
        view
        override
        returns (Position memory position)
    {
        if (!_exists(positionId)) revert CLMSRErrors.PositionNotExists();
        return _positions[positionId];
    }

    /**
     * @dev Get all positions owned by an address
     * @param owner Owner address
     * @return positionIds Array of position IDs
     */
    function getPositionsByOwner(address owner)
        external
        view
        override
        returns (uint256[] memory positionIds)
    {
        return _ownerPositions[owner];
    }

    /**
     * @dev Get all positions in a market
     * @param marketId Market ID
     * @return positionIds Array of position IDs
     */
    function getPositionsByMarket(uint256 marketId)
        external
        view
        override
        returns (uint256[] memory positionIds)
    {
        return _marketPositions[marketId];
    }

    /**
     * @dev Get next position ID
     * @return Next position ID
     */
    function nextPositionId() external view override returns (uint256) {
        return _positionIdCounter.current();
    }

    /**
     * @dev Check if a position exists
     * @param positionId Position ID
     * @return Whether the position exists
     */
    function exists(uint256 positionId) external view override returns (bool) {
        return _exists(positionId);
    }

    // =============================================================================
    // METADATA FUNCTIONS
    // =============================================================================

    /**
     * @dev Generate token URI with dynamic metadata
     * @param positionId Position ID
     * @return Token URI
     */
    function tokenURI(uint256 positionId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ICLMSRPosition)
        returns (string memory)
    {
        if (!_exists(positionId)) revert CLMSRErrors.PositionNotExists();

        Position storage position = _positions[positionId];
        
        // Generate dynamic metadata
        string memory json = Base64Upgradeable.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "CLMSR Position #',
                        positionId.toString(),
                        '", "description": "CLMSR Market Position NFT", "image": "',
                        _generateImageURI(positionId),
                        '", "attributes": [',
                        _generateAttributes(position),
                        ']}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @dev Get contract URI
     * @return Contract URI
     */
    function contractURI() external view override returns (string memory) {
        return _contractURI;
    }

    /**
     * @dev Set base URI (admin only)
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external override onlyRole(ADMIN_ROLE) {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Set contract URI (admin only)
     * @param contractURI_ New contract URI
     */
    function setContractURI(string memory contractURI_) external override onlyRole(ADMIN_ROLE) {
        _contractURI = contractURI_;
    }

    // =============================================================================
    // INTERNAL FUNCTIONS
    // =============================================================================

    /**
     * @dev Add position to owner's position list
     * @param owner Owner address
     * @param positionId Position ID
     */
    function _addToOwnerPositions(address owner, uint256 positionId) internal {
        _ownerPositionIndex[positionId] = _ownerPositions[owner].length;
        _ownerPositions[owner].push(positionId);
    }

    /**
     * @dev Remove position from owner's position list
     * @param owner Owner address
     * @param positionId Position ID
     */
    function _removeFromOwnerPositions(address owner, uint256 positionId) internal {
        uint256 index = _ownerPositionIndex[positionId];
        uint256 lastIndex = _ownerPositions[owner].length - 1;
        
        if (index != lastIndex) {
            uint256 lastPositionId = _ownerPositions[owner][lastIndex];
            _ownerPositions[owner][index] = lastPositionId;
            _ownerPositionIndex[lastPositionId] = index;
        }
        
        _ownerPositions[owner].pop();
        delete _ownerPositionIndex[positionId];
    }

    /**
     * @dev Add position to market's position list
     * @param marketId Market ID
     * @param positionId Position ID
     */
    function _addToMarketPositions(uint256 marketId, uint256 positionId) internal {
        _marketPositionIndex[positionId] = _marketPositions[marketId].length;
        _marketPositions[marketId].push(positionId);
    }

    /**
     * @dev Remove position from market's position list
     * @param marketId Market ID
     * @param positionId Position ID
     */
    function _removeFromMarketPositions(uint256 marketId, uint256 positionId) internal {
        uint256 index = _marketPositionIndex[positionId];
        uint256 lastIndex = _marketPositions[marketId].length - 1;
        
        if (index != lastIndex) {
            uint256 lastPositionId = _marketPositions[marketId][lastIndex];
            _marketPositions[marketId][index] = lastPositionId;
            _marketPositionIndex[lastPositionId] = index;
        }
        
        _marketPositions[marketId].pop();
        delete _marketPositionIndex[positionId];
    }

    /**
     * @dev Generate image URI for position
     * @param positionId Position ID
     * @return Image URI
     */
    function _generateImageURI(uint256 positionId) internal view returns (string memory) {
        // Return placeholder or generate dynamic SVG
        return string(abi.encodePacked(_baseTokenURI, positionId.toString(), ".png"));
    }

    /**
     * @dev Generate JSON attributes for position
     * @param position Position data
     * @return JSON attributes string
     */
    function _generateAttributes(Position storage position) internal view returns (string memory) {
        return string(
            abi.encodePacked(
                '{"trait_type": "Market ID", "value": ',
                position.marketId.toString(),
                '}, {"trait_type": "Lower Tick", "value": ',
                position.lowerTick.toString(),
                '}, {"trait_type": "Upper Tick", "value": ',
                position.upperTick.toString(),
                '}, {"trait_type": "Quantity", "value": ',
                position.quantity.toString(),
                '}, {"trait_type": "Status", "value": "',
                position.isSettled ? (position.isClaimed ? "Claimed" : "Settled") : "Active",
                '"}'
            )
        );
    }

    /**
     * @dev Get base URI
     * @return Base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // =============================================================================
    // OVERRIDES
    // =============================================================================

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 positionId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, positionId, batchSize);

        // Update position owner and indexes on transfer
        if (from != address(0) && to != address(0)) {
            Position storage position = _positions[positionId];
            position.owner = to;
            position.lastUpdated = block.timestamp;

            // Update owner indexes
            _removeFromOwnerPositions(from, positionId);
            _addToOwnerPositions(to, positionId);
        }
    }

    function _burn(uint256 positionId)
        internal
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    {
        super._burn(positionId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable, IERC165Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
}
