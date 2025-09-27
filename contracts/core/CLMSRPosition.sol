// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/ICLMSRPosition.sol";

/**
 * @title CLMSRPosition
 * @notice ERC721 NFT contract for managing CLMSR prediction market positions
 * @dev Each position is represented as an NFT with metadata containing market information
 */
contract CLMSRPosition is ERC721, Ownable, ICLMSRPosition {
    using Counters for Counters.Counter;

    // State variables
    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => PositionMetadata) private _positionMetadata;
    mapping(uint256 => uint256[]) private _marketPositions;
    mapping(address => uint256[]) private _ownerPositions;
    mapping(uint256 => uint256) private _marketPositionCount;
    mapping(address => uint256) private _ownerPositionCount;

    // Access control
    address private _marketCore;

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

    // Errors
    error UnauthorizedCaller();
    error PositionNotFound();
    error InvalidTokenId();

    /**
     * @notice Constructor
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {}

    /**
     * @notice Set the market core contract address
     * @param marketCore The address of the CLMSRMarketCore contract
     */
    function setMarketCore(address marketCore) external onlyOwner {
        _marketCore = marketCore;
    }

    /**
     * @notice Mint a new position NFT
     * @param to The address to mint the NFT to
     * @param marketId The market ID
     * @param lowerTick The lower tick of the position
     * @param upperTick The upper tick of the position
     * @param quantity The initial quantity
     * @param costBasis The initial cost basis
     * @return tokenId The minted token ID
     */
    function mint(
        address to,
        uint256 marketId,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 quantity,
        uint256 costBasis
    ) external returns (uint256 tokenId) {
        if (msg.sender != _marketCore) revert UnauthorizedCaller();

        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();

        // Set position metadata
        _positionMetadata[tokenId] = PositionMetadata({
            marketId: marketId,
            lowerTick: lowerTick,
            upperTick: upperTick,
            quantity: quantity,
            costBasis: costBasis,
            isActive: true
        });

        // Update market positions
        _marketPositions[marketId].push(tokenId);
        _marketPositionCount[marketId]++;

        // Update owner positions
        _ownerPositions[to].push(tokenId);
        _ownerPositionCount[to]++;

        // Mint the NFT
        _safeMint(to, tokenId);

        emit PositionMinted(tokenId, to, marketId, lowerTick, upperTick);
    }

    /**
     * @notice Burn a position NFT
     * @param tokenId The token ID to burn
     */
    function burn(uint256 tokenId) external {
        if (msg.sender != _marketCore) revert UnauthorizedCaller();
        if (!_exists(tokenId)) revert PositionNotFound();

        address owner = ownerOf(tokenId);
        PositionMetadata memory metadata = _positionMetadata[tokenId];

        // Remove from market positions
        _removeFromArray(_marketPositions[metadata.marketId], tokenId);
        _marketPositionCount[metadata.marketId]--;

        // Remove from owner positions
        _removeFromArray(_ownerPositions[owner], tokenId);
        _ownerPositionCount[owner]--;

        // Clear metadata
        delete _positionMetadata[tokenId];

        // Burn the NFT
        _burn(tokenId);

        emit PositionBurned(tokenId);
    }

    /**
     * @notice Update position metadata
     * @param tokenId The token ID
     * @param quantity The new quantity
     * @param costBasis The new cost basis
     */
    function updatePosition(
        uint256 tokenId,
        uint256 quantity,
        uint256 costBasis
    ) external {
        if (msg.sender != _marketCore) revert UnauthorizedCaller();
        if (!_exists(tokenId)) revert PositionNotFound();

        _positionMetadata[tokenId].quantity = quantity;
        _positionMetadata[tokenId].costBasis = costBasis;

        emit PositionUpdated(tokenId, quantity, costBasis);
    }

    /**
     * @notice Get position metadata
     * @param tokenId The token ID
     * @return The position metadata
     */
    function getPositionMetadata(uint256 tokenId) external view returns (PositionMetadata memory) {
        if (!_exists(tokenId)) revert PositionNotFound();
        return _positionMetadata[tokenId];
    }

    /**
     * @notice Get all positions for a market
     * @param marketId The market ID
     * @return Array of token IDs
     */
    function getMarketPositions(uint256 marketId) external view returns (uint256[] memory) {
        return _marketPositions[marketId];
    }

    /**
     * @notice Get all positions for an owner
     * @param owner The owner address
     * @return Array of token IDs
     */
    function getOwnerPositions(address owner) external view returns (uint256[] memory) {
        return _ownerPositions[owner];
    }

    /**
     * @notice Get the number of positions for a market
     * @param marketId The market ID
     * @return The number of positions
     */
    function getMarketPositionCount(uint256 marketId) external view returns (uint256) {
        return _marketPositionCount[marketId];
    }

    /**
     * @notice Get the number of positions for an owner
     * @param owner The owner address
     * @return The number of positions
     */
    function getOwnerPositionCount(address owner) external view returns (uint256) {
        return _ownerPositionCount[owner];
    }

    /**
     * @notice Get the market core contract address
     * @return The market core address
     */
    function getMarketCore() external view returns (address) {
        return _marketCore;
    }

    /**
     * @notice Get the total number of minted tokens
     * @return The total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @notice Check if a token exists
     * @param tokenId The token ID
     * @return Whether the token exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @notice Get token URI for metadata
     * @param tokenId The token ID
     * @return The token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert PositionNotFound();

        PositionMetadata memory metadata = _positionMetadata[tokenId];
        
        // Generate dynamic metadata
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(abi.encodePacked(
                '{"name":"CLMSR Position #', _toString(tokenId), '",',
                '"description":"CLMSR Prediction Market Position",',
                '"attributes":[',
                '{"trait_type":"Market ID","value":', _toString(metadata.marketId), '},',
                '{"trait_type":"Lower Tick","value":', _toString(metadata.lowerTick), '},',
                '{"trait_type":"Upper Tick","value":', _toString(metadata.upperTick), '},',
                '{"trait_type":"Quantity","value":', _toString(metadata.quantity), '},',
                '{"trait_type":"Cost Basis","value":', _toString(metadata.costBasis), '},',
                '{"trait_type":"Active","value":', metadata.isActive ? "true" : "false", '}',
                ']}'
            ))
        ));
    }

    /**
     * @notice Remove an element from an array
     * @param array The array to modify
     * @param element The element to remove
     */
    function _removeFromArray(uint256[] storage array, uint256 element) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    /**
     * @notice Convert uint256 to string
     * @param value The value to convert
     * @return The string representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @notice Base64 encode data
     * @param data The data to encode
     * @return The base64 encoded string
     */
    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        string memory result = new string(4 * ((data.length + 2) / 3));

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, mload(data)) {
                i := add(i, 3)
            } {
                let input := and(mload(add(data, add(32, i))), 0xffffff)

                let out := mload(add(tablePtr, and(shr(250, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(244, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(238, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(232, input), 0x3F))), 0xFF))
                out := shl(224, out)

                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            switch mod(mload(data), 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }
        }

        return result;
    }
}
