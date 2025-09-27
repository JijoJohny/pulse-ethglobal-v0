# 🚀 Rootstock Deployment Guide

## Quick Start

### 1. Environment Setup

Create a `.env` file in the contracts directory:

```bash
ROOTSTOCK_RPC_URL=https://public-node.testnet.rsk.co
CONTRACT_DEPLOYER_PRIVATE_KEY=your_private_key_without_0x_prefix
ROOTSTOCK_API_KEY=optional_for_verification
```

### 2. Get Testnet RBTC

Visit [Rootstock Testnet Faucet](https://faucet.testnet.rsk.co/) and get some RBTC for gas fees.

### 3. Network Configuration

The contracts are configured for:
- **Testnet**: Chain ID 31, RPC: https://public-node.testnet.rsk.co
- **Mainnet**: Chain ID 30, RPC: https://public-node.rsk.co

### 4. Deployment Options

#### Option A: Using Hardhat (Recommended)

```bash
# Install dependencies (if npm works)
npm install

# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.ts --network testnet

# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network mainnet
```

#### Option B: Manual Deployment (If npm issues persist)

1. Use Remix IDE:
   - Go to [remix.ethereum.org](https://remix.ethereum.org)
   - Upload all contract files
   - Connect to Rootstock network
   - Deploy manually

2. Use Foundry (Alternative):
   ```bash
   # Install Foundry
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   
   # Deploy with forge
   forge create --rpc-url https://public-node.testnet.rsk.co \
     --private-key $PRIVATE_KEY \
     contracts/CLMSRMarketCore.sol:CLMSRMarketCore
   ```

### 5. Contract Verification

After deployment, verify on Rootstock Explorer:

```bash
npx hardhat verify --network testnet CONTRACT_ADDRESS
```

## Contract Addresses (After Deployment)

Update these after successful deployment:

```
Testnet:
- CLMSRMarketCore: 0x...
- CLMSRPosition: 0x...
- Mock RBTC: 0x...

Mainnet:
- CLMSRMarketCore: 0x...
- CLMSRPosition: 0x...
- RBTC Token: 0x... (use existing RBTC)
```

## Troubleshooting

### Common Issues:

1. **Insufficient funds**: Get more RBTC from faucet
2. **Nonce too high**: Reset MetaMask account or wait
3. **Gas estimation failed**: Increase gas limit in hardhat.config.ts
4. **Contract size too large**: Enable optimizer in hardhat.config.ts

### Gas Optimization:

The contracts are optimized for Rootstock's gas costs:
- Optimizer enabled with 200 runs
- Gas price: 20 Gwei
- Gas limit: 8M

### Network Issues:

If RPC issues occur, try alternative endpoints:
- Primary: https://public-node.testnet.rsk.co
- Alternative: https://testnet.sovryn.app/rpc

## Post-Deployment Setup

1. **Grant Roles**:
   ```javascript
   // Grant admin roles
   await marketCore.grantRole(ADMIN_ROLE, adminAddress);
   await marketCore.grantRole(KEEPER_ROLE, keeperAddress);
   ```

2. **Create First Market**:
   ```javascript
   await marketCore.createMarket(
     0,        // minTick
     1000,     // maxTick  
     10,       // tickSpacing
     startTime,
     endTime,
     ethers.parseEther("100") // liquidityParameter
   );
   ```

3. **Test Position**:
   ```javascript
   await marketCore.openPosition(
     userAddress,
     1,        // marketId
     100,      // lowerTick
     200,      // upperTick
     ethers.parseEther("10"), // quantity
     ethers.parseEther("50")  // maxCost
   );
   ```

## Security Checklist

- [ ] Private keys secured
- [ ] Multi-sig setup for admin functions
- [ ] Timelock for upgrades (recommended)
- [ ] Contract verification completed
- [ ] Initial testing on testnet
- [ ] Audit completed (for mainnet)

## Support

For deployment issues:
- Check Rootstock documentation: https://developers.rsk.co/
- Rootstock Discord: https://discord.gg/rootstock
- GitHub Issues: Create an issue in the repository
