# 🚀 Deploy CLMSR Contracts using Remix IDE

Since we're having npm dependency issues, **Remix IDE is the most reliable way** to deploy your contracts.

## 📋 Step-by-Step Deployment Guide

### Step 1: Prepare Remix IDE

1. **Go to [Remix IDE](https://remix.ethereum.org)**
2. **Create a new workspace** called "CLMSR-Protocol"

### Step 2: Upload Contract Files

Upload these files to Remix (copy-paste the content):

```
contracts/
├── CLMSRMarketCore.sol
├── CLMSRPosition.sol
├── mocks/MockRBTC.sol
├── interfaces/ICLMSRMarketCore.sol
├── interfaces/ICLMSRPosition.sol  
├── libraries/FixedPointMath.sol
├── libraries/LazyMulSegmentTree.sol
└── errors/CLMSRErrors.sol
```

### Step 3: Configure MetaMask for Rootstock Testnet

Add Rootstock Testnet to MetaMask:
- **Network Name**: Rootstock Testnet
- **RPC URL**: https://public-node.testnet.rsk.co
- **Chain ID**: 31
- **Currency Symbol**: tRBTC
- **Block Explorer**: https://explorer.testnet.rsk.co

### Step 4: Get Testnet RBTC

Visit [Rootstock Faucet](https://faucet.testnet.rsk.co/) and get some tRBTC for gas fees.

### Step 5: Deploy Contracts in Order

#### 🪙 Deploy MockRBTC First

1. In Remix, go to "Solidity Compiler"
2. Compile `MockRBTC.sol`
3. Go to "Deploy & Run Transactions"
4. Select "Injected Provider - MetaMask"
5. Select `MockRBTC` contract
6. Enter constructor parameters:
   ```
   name: "Rootstock Bitcoin"
   symbol: "RBTC"
   decimals_: 18
   initialSupply: 1000000000000000000000000
   ```
7. Click **Deploy**
8. **Save the deployed address** (e.g., 0x123...)

#### 🎨 Deploy CLMSRPosition Second

1. Compile `CLMSRPosition.sol`
2. Select `CLMSRPosition` contract
3. Deploy with **no constructor parameters** (it's upgradeable)
4. After deployment, call `initialize` function with:
   ```
   _marketCore: 0x0000000000000000000000000000000000000000
   _name: "CLMSR Position NFT"
   _symbol: "CLMSR-POS"
   baseURI: "https://api.pulse08.com/metadata/position/"
   contractURI_: "https://api.pulse08.com/metadata/contract"
   ```
5. **Save the deployed address** (e.g., 0x456...)

#### 🏪 Deploy CLMSRMarketCore Third

1. Compile `CLMSRMarketCore.sol`
2. Select `CLMSRMarketCore` contract
3. Deploy with **no constructor parameters**
4. After deployment, call `initialize` function with:
   ```
   _rbtcToken: [MockRBTC address from step 1]
   _positionContract: [CLMSRPosition address from step 2]
   ```
5. **Save the deployed address** (e.g., 0x789...)

#### 🔗 Link Contracts

1. In CLMSRPosition contract, call:
   ```
   grantRole(MARKET_CORE_ROLE, [CLMSRMarketCore address])
   ```
   - First call `MARKET_CORE_ROLE()` to get the role hash
   - Then call `grantRole(role_hash, market_core_address)`

### Step 6: Test Deployment

#### Create a Test Market

In CLMSRMarketCore, call `createMarket`:
```
minTick: 0
maxTick: 1000
tickSpacing: 10
startTimestamp: [current timestamp + 3600]
endTimestamp: [current timestamp + 86400]
liquidityParameter: 100000000000000000000 (100 in wei)
```

#### Open a Test Position

1. First, in MockRBTC, call `approve`:
   ```
   spender: [CLMSRMarketCore address]
   amount: 50000000000000000000 (50 in wei)
   ```

2. Then in CLMSRMarketCore, call `openPosition`:
   ```
   user: [your wallet address]
   marketId: 1
   lowerTick: 100
   upperTick: 200
   quantity: 10000000000000000000 (10 in wei)
   maxCost: 50000000000000000000 (50 in wei)
   ```

## 🎉 Success!

If all steps complete successfully, you'll have:
- ✅ MockRBTC token deployed
- ✅ CLMSRPosition NFT contract deployed
- ✅ CLMSRMarketCore trading contract deployed
- ✅ Contracts linked and functional
- ✅ Test market created
- ✅ Test position opened

## 📝 Save Your Deployment Info

**Contract Addresses:**
- MockRBTC: `0x...`
- CLMSRPosition: `0x...`
- CLMSRMarketCore: `0x...`

**Transaction Hashes:**
- MockRBTC Deploy: `0x...`
- CLMSRPosition Deploy: `0x...`
- CLMSRMarketCore Deploy: `0x...`

## 🔍 Verify on Explorer

Visit [Rootstock Testnet Explorer](https://explorer.testnet.rsk.co) and search for your contract addresses to verify deployment.

## 🆘 Troubleshooting

**Common Issues:**
- **Out of gas**: Increase gas limit in MetaMask
- **Transaction failed**: Check you have enough tRBTC
- **Contract not found**: Wait for transaction confirmation
- **Function call failed**: Check parameters are correct

**Need Help?**
- Check transaction details on explorer
- Verify contract addresses are correct
- Ensure MetaMask is connected to Rootstock Testnet
