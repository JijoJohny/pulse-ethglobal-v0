import { ethers } from "hardhat";
import { Contract } from "ethers";

// Configuration for the test market
const MARKET_CONFIG = {
  startTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  endTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  liquidityParameter: ethers.parseEther("1000"), // 1000.0 in WAD
  paymentToken: "0x0000000000000000000000000000000000000000", // RBTC (address(0))
  lowerTick: 50000, // $50,000
  upperTick: 100000, // $100,000
  tickSpacing: 1000, // $1,000 increments
};

async function main() {
  console.log("🎯 Creating CLMSR Prediction Market");
  console.log("=" .repeat(50));

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer address:", deployer.address);

  // Get the deployed contract addresses
  const marketCoreAddress = process.env.MARKET_CORE_ADDRESS;
  if (!marketCoreAddress) {
    console.error("❌ MARKET_CORE_ADDRESS environment variable not set");
    console.log("💡 Set it to the deployed CLMSRMarketCore address");
    process.exit(1);
  }

  console.log("📦 Market Core Address:", marketCoreAddress);

  // Connect to the deployed contract
  const CLMSRMarketCore = await ethers.getContractFactory("CLMSRMarketCore");
  const marketCore = CLMSRMarketCore.attach(marketCoreAddress) as Contract;

  console.log("\n📊 Market Configuration:");
  console.log("   Start Time:", new Date(MARKET_CONFIG.startTimestamp * 1000).toISOString());
  console.log("   End Time:", new Date(MARKET_CONFIG.endTimestamp * 1000).toISOString());
  console.log("   Liquidity Parameter:", ethers.formatEther(MARKET_CONFIG.liquidityParameter));
  console.log("   Payment Token:", MARKET_CONFIG.paymentToken);
  console.log("   Lower Tick:", MARKET_CONFIG.lowerTick);
  console.log("   Upper Tick:", MARKET_CONFIG.upperTick);
  console.log("   Tick Spacing:", MARKET_CONFIG.tickSpacing);

  console.log("\n🚀 Creating market...");
  
  try {
    const createMarketTx = await marketCore.createMarket(
      MARKET_CONFIG.startTimestamp,
      MARKET_CONFIG.endTimestamp,
      MARKET_CONFIG.liquidityParameter,
      MARKET_CONFIG.paymentToken,
      MARKET_CONFIG.lowerTick,
      MARKET_CONFIG.upperTick,
      MARKET_CONFIG.tickSpacing
    );

    console.log("⏳ Transaction submitted:", createMarketTx.hash);
    const receipt = await createMarketTx.wait();
    console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);

    // Get the market ID from the event
    const marketCreatedEvent = receipt?.logs.find(
      (log: any) => log.topics[0] === marketCore.interface.getEvent("MarketCreated").topicHash
    );

    if (marketCreatedEvent) {
      const decoded = marketCore.interface.parseLog(marketCreatedEvent);
      const marketId = decoded?.args.marketId;
      console.log("🎉 Market created successfully!");
      console.log("📋 Market ID:", marketId.toString());
      
      // Get market details
      const market = await marketCore.getMarket(marketId);
      console.log("\n📊 Market Details:");
      console.log("   Market ID:", market.marketId.toString());
      console.log("   Start Timestamp:", market.startTimestamp.toString());
      console.log("   End Timestamp:", market.endTimestamp.toString());
      console.log("   Liquidity Parameter:", ethers.formatEther(market.liquidityParameter));
      console.log("   Payment Token:", market.paymentToken);
      console.log("   Lower Tick:", market.lowerTick.toString());
      console.log("   Upper Tick:", market.upperTick.toString());
      console.log("   Tick Spacing:", market.tickSpacing.toString());
      console.log("   Is Active:", market.isActive);
      console.log("   Is Settled:", market.isSettled);

      console.log("\n🔗 View on Explorer:");
      console.log("   Transaction:", `https://explorer.testnet.rsk.co/tx/${createMarketTx.hash}`);
      
      return {
        marketId: marketId.toString(),
        transactionHash: createMarketTx.hash,
        blockNumber: receipt?.blockNumber,
        market: market,
      };
    } else {
      console.log("⚠️  Market created but could not extract market ID from event");
    }
  } catch (error) {
    console.error("❌ Failed to create market:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
