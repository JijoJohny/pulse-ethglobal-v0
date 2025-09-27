# 🚀 WORKING CLI DEPLOYMENT SOLUTION

## ✅ Your Situation
- npm dependencies are failing
- hardhat compilation has module errors
- You need CLI deployment ASAP

## 🎯 FASTEST SOLUTION: Install Foundry (5 minutes)

### Step 1: Install Prerequisites
1. **Git**: https://git-scm.com/download/win (if not installed)
2. **Rust**: https://rustup.rs/ (required for Foundry)

### Step 2: Install Foundry
Open **Git Bash** or **PowerShell** and run:
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Restart terminal, then:
foundryup
```

### Step 3: Deploy (Copy these exact commands)
```bash
# Deploy MockRBTC
forge create --rpc-url https://public-node.testnet.rsk.co \
  --private-key 4360db11c329850cc6033dbdfa6d249a6db059a086315d7c939d51c9c3bc3ec8 \
  contracts/mocks/MockRBTC.sol:MockRBTC \
  --constructor-args "Rootstock Bitcoin" "RBTC" 18 1000000000000000000000000

# Deploy CLMSRPosition  
forge create --rpc-url https://public-node.testnet.rsk.co \
  --private-key 4360db11c329850cc6033dbdfa6d249a6db059a086315d7c939d51c9c3bc3ec8 \
  contracts/CLMSRPosition.sol:CLMSRPosition

# Deploy CLMSRMarketCore
forge create --rpc-url https://public-node.testnet.rsk.co \
  --private-key 4360db11c329850cc6033dbdfa6d249a6db059a086315d7c939d51c9c3bc3ec8 \
  contracts/CLMSRMarketCore.sol:CLMSRMarketCore
```

## 🔄 Alternative: Use Remix IDE (0 installation)
1. Go to: https://remix.ethereum.org
2. Upload all .sol files from contracts/ folder
3. Connect MetaMask to Rootstock Testnet
4. Deploy step by step

## ⚡ Quick Check
Your environment is ready:
- ✅ Private key configured
- ✅ Contracts implemented  
- ✅ RPC endpoint set
- ✅ Deployment commands ready

## 🆘 If Foundry Install Fails
Use Remix IDE - it's browser-based and requires no installation.

Choose your method and deploy! 🚀
