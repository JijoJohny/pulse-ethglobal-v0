# 🔥 Foundry CLI Deployment Commands

## Prerequisites
1. Install Git: https://git-scm.com/download/win
2. Install Rust: https://rustup.rs/
3. Install Foundry:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

## Manual Deployment Commands

### Step 1: Set Environment Variables
```bash
# In Git Bash or PowerShell
export RPC_URL="https://public-node.testnet.rsk.co"
export PRIVATE_KEY="4360db11c329850cc6033dbdfa6d249a6db059a086315d7c939d51c9c3bc3ec8"
```

### Step 2: Deploy MockRBTC
```bash
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/mocks/MockRBTC.sol:MockRBTC \
  --constructor-args "Rootstock Bitcoin" "RBTC" 18 1000000000000000000000000
```

**Save the deployed address!**

### Step 3: Deploy CLMSRPosition
```bash
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/CLMSRPosition.sol:CLMSRPosition
```

**Save the deployed address!**

### Step 4: Deploy CLMSRMarketCore
```bash
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/CLMSRMarketCore.sol:CLMSRMarketCore
```

**Save the deployed address!**

### Step 5: Initialize Contracts
You'll need to call the initialize functions on each contract with the appropriate parameters.

## Alternative: Use the Script
If Foundry is installed, you can run:
```bash
chmod +x foundry-deploy.sh
./foundry-deploy.sh
```

## Troubleshooting
- Make sure you have testnet RBTC: https://faucet.testnet.rsk.co/
- Verify your private key is correct in .env
- Check network connectivity to Rootstock testnet
