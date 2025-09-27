# 🚀 CLI Deployment on Windows

## Method 1: Install Foundry (Recommended)

### Step 1: Install Prerequisites

**Install Git** (if not already installed):
1. Download from: https://git-scm.com/download/win
2. Install with default settings

**Install Rust** (required for Foundry):
1. Go to: https://rustup.rs/
2. Download and run `rustup-init.exe`
3. Follow installation prompts

### Step 2: Install Foundry

Open **Git Bash** (or PowerShell) and run:

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Restart your terminal, then run:
foundryup
```

### Step 3: Deploy Contracts

```bash
# Navigate to contracts directory
cd pulse-08/contracts

# Make script executable (if using Git Bash)
chmod +x foundry-deploy.sh

# Run deployment
./foundry-deploy.sh
```

## Method 2: Manual Foundry Commands

If the script doesn't work, run commands manually:

```bash
# Set environment variables
export RPC_URL="https://public-node.testnet.rsk.co"
export PRIVATE_KEY="your_private_key_from_env"

# Deploy MockRBTC
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/mocks/MockRBTC.sol:MockRBTC \
  --constructor-args "Rootstock Bitcoin" "RBTC" 18 1000000000000000000000000

# Deploy CLMSRPosition (save the address)
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/CLMSRPosition.sol:CLMSRPosition

# Deploy CLMSRMarketCore (save the address)  
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/CLMSRMarketCore.sol:CLMSRMarketCore
```

## Method 3: PowerShell Script (Alternative)

If Foundry doesn't work, here's a PowerShell approach:
