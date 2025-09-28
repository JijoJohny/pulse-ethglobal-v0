#  CLMSR Price Forcasting  on  Rootstock

[![Hardhat](https://img.shields.io/badge/Hardhat-2.19.0-yellow)](https://hardhat.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue)](https://soliditylang.org/)
[![Rootstock](https://img.shields.io/badge/Rootstock-Testnet-orange)](https://rootstock.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> ** Continuous Logarithmic Market Scoring Rule prediction market on Rootstock testnet.**

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [🔧 Core Contracts](#-core-contracts)
- [🚀 Quick Start](#-quick-start)
- [📦 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [📚 Usage Examples](#-usage-examples)
- [🔒 Security](#-security)
- [📄 License](#-license)

## 🎯 Overview

This repository contains a minimized implementation of CLMSR prediction market contracts designed for deployment on Rootstock testnet. The contracts provide:

- **CLMSR Algorithm**: Complete implementation of the continuous logarithmic market scoring rule
- **Position Management**: ERC721 NFTs for position tracking
- **Market Creation**: Automated market making with configurable parameters
- **Gas Optimization**: Efficient algorithms for large trades
- **Rootstock Ready**: Optimized for Rootstock testnet deployment

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ CLMSRMarketCore │    │ CLMSRPosition   │    │ FixedPointMath  │
│ (Core Logic)    │───▶│ (NFT Mgmt)      │    │ (Math Library)  │
│   ✅ ACTIVE     │    │   ✅ ACTIVE     │    │   ✅ ACTIVE     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ LazyMulSegTree  │    │ ICLMSRMarketCore│    │ ICLMSRPosition  │
│ (Efficient DS)  │    │ (Interface)     │    │ (Interface)     │
│   ✅ ACTIVE     │    │   ✅ ACTIVE     │    │   ✅ ACTIVE     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### CLMSR Formula

- **Price Formula**: `P_i = exp(q_i/α) / Σ_j exp(q_j/α)`
- **Cost Formula**: `C = α * ln(Σ_after / Σ_before)`
- **Liquidity Parameter**: `α` (configurable per market)

## 📁 Project Structure

```
pulse-08/
├── 📄 contracts/                    # Smart Contracts
│   ├── 🎯 core/                     # Core contracts
│   │   ├── CLMSRMarketCore.sol      # Main trading logic
│   │   └── CLMSRPosition.sol        # NFT position management
│   ├── 🔌 interfaces/               # Contract interfaces
│   │   ├── ICLMSRMarketCore.sol     # Market core interface
│   │   └── ICLMSRPosition.sol       # Position interface
│   └── 📚 libraries/                # Math & data structure libraries
│       ├── FixedPointMath.sol       # Safe math operations
│       └── LazyMulSegmentTree.sol   # Efficient segment tree
├── 🚀 scripts/                      # Deployment scripts
│   ├── deploy.ts                    # Main deployment script
│   └── create-market.ts             # Market creation script
├── ⚙️ hardhat.config.ts             # Hardhat configuration
├── 📦 package.json                  # Dependencies
├── 🔧 .env.example                  # Environment variables template
└── 📋 README.md                     # This file
```

## 🔧 Core Contracts

### 1. CLMSRMarketCore.sol
- **Purpose**: Core trading logic and market management
- **Features**:
  - Market creation and management
  - Position opening, increasing, decreasing, closing
  - CLMSR cost calculations with chunk-split support
  - Emergency pause/unpause functionality
- **Security**: Comprehensive attack prevention mechanisms

### 2. CLMSRPosition.sol
- **Purpose**: ERC721 NFT for position management
- **Features**:
  - Position minting, burning, and updates
  - Market-local token indexing
  - Dynamic metadata generation
  - Gas-optimized storage layout

### 3. Libraries
- **FixedPointMath.sol**: Safe mathematical operations with overflow protection
- **LazyMulSegmentTree.sol**: Efficient segment tree for range operations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Rootstock testnet RBTC (get from [faucet](https://faucet.rootstock.io/))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pulse-08

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your private key
# PRIVATE_KEY=your_private_key_here
```

### Compilation

```bash
# Compile contracts
npm run compile
```

### Testing

```bash
# Run tests
npm test

# Run tests with gas report
npm run gas-report
```

## 📦 Deployment

### 1. Deploy to Rootstock Testnet

```bash
# Deploy contracts
npm run deploy:rsk-testnet
```

### 2. Create a Test Market

```bash
# Set the deployed contract address in .env
# MARKET_CORE_ADDRESS=0x...

# Create a test market
npx hardhat run scripts/create-market.ts --network rskTestnet
```

### 3. Verify Contracts

```bash
# Verify on explorer
npm run verify:rsk-testnet
```

## 🧪 Testing

### Test Categories

- **Unit Tests**: Individual contract functionality
- **Integration Tests**: Cross-contract interactions
- **Gas Tests**: Optimization verification
- **Security Tests**: Attack prevention scenarios

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/CLMSRMarketCore.test.ts

# Run tests with coverage
npm run coverage
```

## 📚 Usage Examples

### Creating a Market

```typescript
// Market configuration
const marketConfig = {
  startTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  endTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  liquidityParameter: ethers.parseEther("1000"), // 1000.0 in WAD
  paymentToken: "0x0000000000000000000000000000000000000000", // RBTC
  lowerTick: 50000, // $50,000
  upperTick: 100000, // $100,000
  tickSpacing: 1000, // $1,000 increments
};

// Create market
const tx = await marketCore.createMarket(
  marketConfig.startTimestamp,
  marketConfig.endTimestamp,
  marketConfig.liquidityParameter,
  marketConfig.paymentToken,
  marketConfig.lowerTick,
  marketConfig.upperTick,
  marketConfig.tickSpacing
);
```

### Opening a Position

```typescript
// Open position
const tx = await marketCore.openPosition(
  marketId,
  lowerTick,
  upperTick,
  quantity
);

// Get position ID from event
const receipt = await tx.wait();
const event = receipt.logs.find(log => log.topics[0] === marketCore.interface.getEvent("PositionOpened").topicHash);
const positionId = marketCore.interface.parseLog(event).args.positionId;
```

### Calculating Costs

```typescript
// Calculate open cost
const cost = await marketCore.calculateOpenCost(
  marketId,
  lowerTick,
  upperTick,
  quantity
);

// Calculate increase cost
const increaseCost = await marketCore.calculateIncreaseCost(
  positionId,
  quantity
);
```

## 🔒 Security

### Security Features

1. **Reentrancy Protection**: All external functions protected
2. **Access Control**: Owner-only functions for critical operations
3. **Input Validation**: Comprehensive parameter validation
4. **Overflow Protection**: Safe math operations throughout
5. **Gas Optimization**: Efficient algorithms to prevent DoS

### Security Considerations

- **Private Key Security**: Never commit private keys to version control
- **Testnet First**: Always test on testnet before mainnet deployment
- **Audit**: Consider professional audit before mainnet deployment
- **Upgrades**: Contracts are not upgradeable by design for security

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

- **Documentation**: [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discord**: [Signals Protocol Discord](https://discord.gg/signals)

---

**Built with ❤️ for the Rootstock ecosystem**

*For more information about Rootstock, visit [rootstock.io](https://rootstock.io/)*
