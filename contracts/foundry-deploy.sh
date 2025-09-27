#!/bin/bash
# Foundry deployment script for Rootstock
# Install Foundry first: curl -L https://foundry.paradigm.xyz | bash && foundryup

# Load environment variables
source .env

# Rootstock Testnet RPC
RPC_URL="https://public-node.testnet.rsk.co"

echo "🚀 Deploying CLMSR Protocol to Rootstock Testnet"
echo "=================================================="

# Deploy MockRBTC
echo "📝 Deploying MockRBTC..."
MOCK_RBTC=$(forge create --rpc-url $RPC_URL \
  --private-key $CONTRACT_DEPLOYER_PRIVATE_KEY \
  contracts/mocks/MockRBTC.sol:MockRBTC \
  --constructor-args "Rootstock Bitcoin" "RBTC" 18 1000000000000000000000000 \
  --json | jq -r '.deployedTo')

echo "✅ MockRBTC deployed at: $MOCK_RBTC"

# Deploy CLMSRPosition (simplified version without upgrades)
echo "📝 Deploying CLMSRPosition..."
POSITION=$(forge create --rpc-url $RPC_URL \
  --private-key $CONTRACT_DEPLOYER_PRIVATE_KEY \
  contracts/CLMSRPosition.sol:CLMSRPosition \
  --json | jq -r '.deployedTo')

echo "✅ CLMSRPosition deployed at: $POSITION"

# Deploy CLMSRMarketCore (simplified version without upgrades)
echo "📝 Deploying CLMSRMarketCore..."
MARKET_CORE=$(forge create --rpc-url $RPC_URL \
  --private-key $CONTRACT_DEPLOYER_PRIVATE_KEY \
  contracts/CLMSRMarketCore.sol:CLMSRMarketCore \
  --json | jq -r '.deployedTo')

echo "✅ CLMSRMarketCore deployed at: $MARKET_CORE"

echo ""
echo "🎉 Deployment completed!"
echo "========================"
echo "MockRBTC:        $MOCK_RBTC"
echo "CLMSRPosition:   $POSITION"
echo "CLMSRMarketCore: $MARKET_CORE"
echo ""
echo "🔗 View on Explorer:"
echo "https://explorer.testnet.rsk.co/address/$MARKET_CORE"
