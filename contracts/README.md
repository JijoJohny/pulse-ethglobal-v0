# CLMSR Protocol Smart Contracts

A comprehensive implementation of Continuous Logarithmic Market Scoring Rule (CLMSR) for prediction markets on Rootstock Bitcoin sidechain.

## 🏗️ Architecture

### Core Contracts

#### CLMSRMarketCore.sol
The main contract that implements the CLMSR mechanism for prediction markets.

**Features:**
- Market creation and management
- Position opening, increasing, decreasing, closing
- CLMSR cost calculations with chunk-split support
- Emergency pause/unpause functionality
- Upgradeable with UUPS pattern

**Key Functions:**
- `createMarket()` - Create new prediction market
- `openPosition()` - Open trading position in tick range
- `increasePosition()` - Add to existing position
- `decreasePosition()` - Sell part of position
- `closePosition()` - Close entire position
- `settleMarket()` - Settle market with final outcome
- `claimPayout()` - Claim winnings from settled positions

#### CLMSRPosition.sol
ERC721 NFT contract for position management with dynamic metadata.

**Features:**
- Position minting, burning, and updates
- Market-local token indexing
- Dynamic metadata generation
- Gas-optimized storage layout
- Enumerable positions by owner/market

**Key Functions:**
- `mint()` - Mint position NFT
- `getPosition()` - Get basic position data
- `getPositionDetails()` - Get complete position information
- `getPositionsByOwner()` - Get all positions for an owner
- `tokenURI()` - Generate dynamic metadata

### Libraries

#### FixedPointMath.sol
Safe mathematical operations with 18-decimal fixed-point arithmetic.

**Features:**
- Multiplication, division, addition, subtraction
- Exponential and logarithmic functions
- Square root calculations
- Overflow/underflow protection

#### LazyMulSegmentTree.sol
Efficient segment tree for range multiplicative updates and sum queries.

**Features:**
- Range multiplicative updates
- Range sum queries
- Lazy propagation for efficiency
- Optimized for CLMSR probability distributions

### Interfaces & Errors

#### Interfaces
- `ICLMSRMarketCore.sol` - Market core interface
- `ICLMSRPosition.sol` - Position NFT interface

#### Error Handling
- `CLMSRErrors.sol` - Comprehensive custom errors

## 🚀 Deployment

### Prerequisites

```bash
npm install
```

### Environment Setup

Create `.env` file:
```bash
ROOTSTOCK_RPC_URL=https://public-node.testnet.rsk.co
CONTRACT_DEPLOYER_PRIVATE_KEY=your_private_key
ROOTSTOCK_API_KEY=your_api_key
RBTC_TOKEN_ADDRESS=0x... # Optional, for mainnet
```

### Deploy to Testnet

```bash
npm run deploy
```

### Deploy to Mainnet

```bash
npm run deploy:mainnet
```

### Verification

```bash
npm run verify
# or for mainnet
npm run verify:mainnet
```

## 🧪 Testing

Run comprehensive test suite:

```bash
npm run test
```

Run with coverage:

```bash
npm run test:coverage
```

### Test Structure

- **Market Management Tests**
  - Market creation with various parameters
  - Market settlement and reopening
  - Access control validation

- **Position Management Tests**
  - Position opening with cost calculations
  - Position modifications (increase/decrease)
  - Position closing and settlement

- **CLMSR Algorithm Tests**
  - Cost calculation accuracy
  - Probability distribution updates
  - Settlement payout calculations

- **Edge Cases & Security**
  - Invalid parameter handling
  - Overflow/underflow protection
  - Access control enforcement

## 📊 Gas Optimization

### Efficient Data Structures
- Packed structs for reduced storage slots
- Lazy segment tree for batch operations
- Optimized indexing for position lookups

### Batch Operations
- Range updates via segment tree
- Chunk-split cost calculations
- Efficient metadata generation

## 🔒 Security Features

### Access Control
- Role-based permissions (Admin, Keeper, Market Core)
- Multi-signature compatible
- Upgradeable with timelock (recommended)

### Safety Mechanisms
- Pausable contract functionality
- Reentrancy protection
- Safe mathematical operations
- Input validation and bounds checking

### Upgradability
- UUPS proxy pattern
- Storage gap preservation
- Migration-safe upgrades

## 🔧 Configuration

### Market Parameters

```solidity
struct Market {
    uint256 marketId;           // Unique market identifier
    bool isActive;              // Market active status
    bool isSettled;             // Settlement status
    uint256 minTick;            // Minimum tick value
    uint256 maxTick;            // Maximum tick value
    uint256 tickSpacing;        // Spacing between ticks
    uint256 numBins;            // Number of outcome bins
    uint256 startTimestamp;     // Market start time
    uint256 endTimestamp;       // Market end time
    uint256 settlementTick;     // Final settlement tick
    uint256 liquidityParameter; // CLMSR liquidity parameter (alpha)
    // ... additional fields
}
```

### Position Structure

```solidity
struct Position {
    uint256 positionId;         // Unique position identifier
    address owner;              // Position owner
    uint256 marketId;           // Associated market
    uint256 lowerTick;          // Lower bound of position
    uint256 upperTick;          // Upper bound of position
    uint256 quantity;           // Position quantity
    uint256 cost;               // Total cost paid
    uint256 payout;             // Settlement payout
    bool isSettled;             // Settlement status
    bool isClaimed;             // Claim status
    // ... timestamps
}
```

## 📈 CLMSR Algorithm

### Cost Function
The cost to buy quantity `q` in range `[a, b]` is calculated as:

```
C(q) = α * ln(Σ(exp(q_i / α)))
```

Where:
- `α` is the liquidity parameter
- `q_i` is the quantity in bin `i`
- The sum is over all bins in the range

### Probability Calculation
Market probabilities are derived from the exponential distribution:

```
P_i = exp(q_i / α) / Σ(exp(q_j / α))
```

### Settlement
Winning positions receive payout equal to their quantity. Losing positions receive zero payout.

## 🔗 Integration

### Frontend Integration

```typescript
import { ethers } from 'ethers';
import CLMSRMarketCoreABI from './abis/CLMSRMarketCore.json';
import CLMSRPositionABI from './abis/CLMSRPosition.json';

// Connect to contracts
const marketCore = new ethers.Contract(
  MARKET_CORE_ADDRESS,
  CLMSRMarketCoreABI,
  provider
);

const position = new ethers.Contract(
  POSITION_ADDRESS,
  CLMSRPositionABI,
  provider
);

// Open position
const tx = await marketCore.openPosition(
  userAddress,
  marketId,
  lowerTick,
  upperTick,
  quantity,
  maxCost
);
```

### Backend Integration

```typescript
// Monitor events
marketCore.on('PositionOpened', (positionId, user, marketId, ...args) => {
  console.log('New position opened:', { positionId, user, marketId });
});

// Calculate costs
const cost = await marketCore.calculateOpenCost(
  marketId,
  lowerTick,
  upperTick,
  quantity
);
```

## 📚 Additional Resources

### Documentation
- [CLMSR Algorithm Explanation](./docs/clmsr-algorithm.md)
- [Gas Optimization Guide](./docs/gas-optimization.md)
- [Security Best Practices](./docs/security.md)
- [Integration Examples](./docs/integration.md)

### Rootstock Resources
- [Rootstock Developer Portal](https://developers.rsk.co/)
- [Rootstock Testnet Faucet](https://faucet.testnet.rsk.co/)
- [Rootstock Explorer](https://explorer.testnet.rsk.co/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This code is provided as-is for educational and development purposes. Conduct thorough testing and auditing before deploying to mainnet. The developers are not responsible for any losses incurred through the use of this software.

## 🔍 Audit Status

- [ ] Internal code review completed
- [ ] External security audit pending
- [ ] Bug bounty program (planned)

## 📞 Support

For technical support and questions:
- GitHub Issues: [Create an issue](../../issues)
- Discord: [Join our community](#)
- Email: dev@pulse08.com
