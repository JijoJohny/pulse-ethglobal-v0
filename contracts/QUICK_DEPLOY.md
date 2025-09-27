# ⚡ QUICK DEPLOYMENT GUIDE

## 🎯 Your Environment is Ready!

✅ Private Key: Configured in .env  
✅ Rootstock Testnet: Connected  
✅ Contracts: All implemented and ready  

## 🚀 FASTEST DEPLOYMENT METHOD

### Option 1: Remix IDE (Recommended - 10 minutes)

1. **Go to**: https://remix.ethereum.org
2. **Upload all .sol files** from `contracts/` folder
3. **Connect MetaMask** to Rootstock Testnet (Chain ID: 31)
4. **Deploy in order**: MockRBTC → CLMSRPosition → CLMSRMarketCore
5. **Link contracts** and test

**Full guide**: See `deploy-remix-guide.md`

### Option 2: Use Foundry (CLI - 5 minutes)

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy (from contracts directory)
chmod +x foundry-deploy.sh
./foundry-deploy.sh
```

## 📱 Your Wallet Info

**Address**: Check your MetaMask  
**Network**: Rootstock Testnet (Chain ID: 31)  
**RPC**: https://public-node.testnet.rsk.co  
**Faucet**: https://faucet.testnet.rsk.co/  

## 🎯 What You'll Get

After deployment:
- **MockRBTC**: Test token for trading
- **CLMSRPosition**: NFT contract for positions  
- **CLMSRMarketCore**: Main trading contract
- **Working prediction market** ready for use!

## 🔥 Ready to Deploy?

**Choose your method and let's go!** 🚀

The contracts are production-ready and fully tested.
