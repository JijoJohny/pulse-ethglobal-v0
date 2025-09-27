# Pulse CLMSR Contracts - Quick Deployment Guide

This guide will help you quickly deploy the Pulse CLMSR prediction market contracts to Rootstock.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask or similar wallet
- Private key with sufficient RBTC balance

## Step 1: Setup Environment

```bash
# Navigate to contracts-pulse directory
cd contracts-pulse

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env file with your configuration
# Required: PRIVATE_KEY=your_private_key_here
```

## Step 2: Configure Network

### For Testnet Deployment

Add Rootstock Testnet to MetaMask:
- **Network Name:** Rootstock Testnet
- **RPC URL:** `https://public-node.testnet.rsk.co`
- **Chain ID:** `31`
- **Symbol:** `tRBTC`
- **Block Explorer:** `https://explorer.testnet.rsk.co`

Get testnet RBTC from: https://faucet.testnet.rsk.co/

### For Mainnet Deployment

Add Rootstock Mainnet to MetaMask:
- **Network Name:** Rootstock Mainnet
- **RPC URL:** `https://public-node.rsk.co`
- **Chain ID:** `30`
- **Symbol:** `RBTC`
- **Block Explorer:** `https://explorer.rsk.co`

## Step 3: Compile Contracts

```bash
npm run compile
```

## Step 4: Run Tests (Optional)

```bash
## what will i do right  now
npm test
```

## Step 5: Deploy

### Testnet Deployment

```bash
npm run deploy:testnet
```

### Mainnet Deployment

```bash
npm run deploy:mainnet
```

### Local Development

```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy locally
npm run deploy:local
```

## Step 6: Verify Deployment

After successful deployment, you'll see:

```
🎉 Testnet deployment completed successfully!
📊 Deployment Summary:
CLMSRPosition Address: 0x...
CLMSRMarketCore Address: 0x...
```

The deployment info is saved to:
- `deployment-testnet.json` (for testnet)
- `deployment-mainnet.json` (for mainnet)

## Step 7: Verify Contracts (Optional)

```bash
# For testnet
npm run verify

# For mainnet
npm run verify:mainnet
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PRIVATE_KEY` | Your wallet private key | ✅ Yes |
| `FEE_RECIPIENT` | Address to receive fees | ❌ No |
| `REPORT_GAS` | Enable gas reporting | ❌ No |
| `ROOTSTOCK_API_KEY` | For contract verification | ❌ No |

## Common Issues

### ❌ "No signers available"
- Check your `PRIVATE_KEY` in `.env` file
- Ensure the private key is valid (64 hex characters, no 0x prefix)

### ❌ "Wrong network"
- Make sure you're connected to the correct Rootstock network
- Check MetaMask network settings

### ❌ "Insufficient balance"
- For testnet: Get RBTC from https://faucet.testnet.rsk.co/
- For mainnet: Ensure you have enough RBTC for deployment costs

### ❌ "Verification failed"
- Check your `ROOTSTOCK_API_KEY` in `.env`
- Verify contracts manually on the block explorer

## Next Steps

1. **Update Frontend:** Add contract addresses to your frontend `.env`
2. **Update Backend:** Add contract addresses to your backend `.env`
3. **Test Integration:** Verify contract interactions work correctly
4. **Monitor:** Set up monitoring for contract events and transactions

## Contract Addresses

After deployment, you'll have:

- **CLMSRPosition:** ERC721 NFT contract for positions
- **CLMSRMarketCore:** Main contract for market operations

## Support

If you encounter issues:
1. Check the deployment logs for detailed error messages
2. Verify all prerequisites are met
3. Ensure network configuration is correct
4. Review the full README.md for detailed documentation

## Security Reminders

- ✅ Keep your private key secure
- ✅ Test thoroughly on testnet before mainnet
- ✅ Monitor deployed contracts
- ✅ Store deployment info securely
- ✅ Use hardware wallets for mainnet deployments
