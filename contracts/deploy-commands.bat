@echo off
echo 🚀 CLMSR Protocol CLI Deployment Commands
echo ==========================================

echo.
echo Your environment:
echo RPC URL: https://public-node.testnet.rsk.co
echo Private Key: [CONFIGURED]
echo.

echo 📋 Manual Deployment Commands:
echo.

echo 1. Deploy MockRBTC:
echo forge create --rpc-url https://public-node.testnet.rsk.co ^
  --private-key 4360db11c329850cc6033dbdfa6d249a6db059a086315d7c939d51c9c3bc3ec8 ^
  contracts/mocks/MockRBTC.sol:MockRBTC ^
  --constructor-args "Rootstock Bitcoin" "RBTC" 18 1000000000000000000000000

echo.
echo 2. Deploy CLMSRPosition:
echo forge create --rpc-url https://public-node.testnet.rsk.co ^
  --private-key 4360db11c329850cc6033dbdfa6d249a6db059a086315d7c939d51c9c3bc3ec8 ^
  contracts/CLMSRPosition.sol:CLMSRPosition

echo.
echo 3. Deploy CLMSRMarketCore:
echo forge create --rpc-url https://public-node.testnet.rsk.co ^
  --private-key 4360db11c329850cc6033dbdfa6d249a6db059a086315d7c939d51c9c3bc3ec8 ^
  contracts/CLMSRMarketCore.sol:CLMSRMarketCore

echo.
echo ⚡ Quick Install Foundry:
echo 1. Download Git: https://git-scm.com/download/win
echo 2. Download Rust: https://rustup.rs/
echo 3. Open Git Bash and run: curl -L https://foundry.paradigm.xyz ^| bash
echo 4. Run: foundryup
echo 5. Copy and run the commands above

echo.
echo 🎯 Alternative: Use the script after installing Foundry:
echo ./foundry-deploy.sh

pause
