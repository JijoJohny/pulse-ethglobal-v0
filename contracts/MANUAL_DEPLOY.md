# Manual CLI Deployment Commands

## After installing Foundry, run these commands one by one:

### Set Environment Variables
```bash
export RPC_URL="https://public-node.testnet.rsk.co"
export PRIVATE_KEY="4360db11c329850cc6033dbdfa6d249a6db059a086315d7c939d51c9c3bc3ec8"
```

### Deploy MockRBTC
```bash
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/mocks/MockRBTC.sol:MockRBTC \
  --constructor-args "Rootstock Bitcoin" "RBTC" 18 1000000000000000000000000
```

### Deploy CLMSRPosition
```bash
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/CLMSRPosition.sol:CLMSRPosition
```

### Deploy CLMSRMarketCore
```bash
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/CLMSRMarketCore.sol:CLMSRMarketCore
```

Save all the deployed addresses for later use!
