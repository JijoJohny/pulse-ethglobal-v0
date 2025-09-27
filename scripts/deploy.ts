import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("🚀 Starting CLMSR Contracts Deployment to Rootstock Testnet");
  console.log("=" .repeat(60));

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployer address:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "RBTC");

  // Check if we have enough balance
  const balance = await deployer.provider.getBalance(deployer.address);
  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  Warning: Low balance. You may need more RBTC for deployment.");
    console.log("💡 Get testnet RBTC from: https://faucet.rootstock.io/");
  }

  console.log("\n📦 Deploying Contracts...");
  console.log("-".repeat(40));

  // Deploy CLMSRPosition contract first
  console.log("1️⃣  Deploying CLMSRPosition...");
  const CLMSRPosition = await ethers.getContractFactory("CLMSRPosition");
  const positionContract = await CLMSRPosition.deploy(
    "CLMSR Positions",
    "CLMSR"
  );
  await positionContract.waitForDeployment();
  const positionAddress = await positionContract.getAddress();
  console.log("✅ CLMSRPosition deployed to:", positionAddress);

  // Deploy CLMSRMarketCore contract
  console.log("2️⃣  Deploying CLMSRMarketCore...");
  const CLMSRMarketCore = await ethers.getContractFactory("CLMSRMarketCore");
  const marketCore = await CLMSRMarketCore.deploy(positionAddress);
  await marketCore.waitForDeployment();
  const marketCoreAddress = await marketCore.getAddress();
  console.log("✅ CLMSRMarketCore deployed to:", marketCoreAddress);

  // Set the market core address in the position contract
  console.log("3️⃣  Setting market core address in position contract...");
  const setMarketCoreTx = await positionContract.setMarketCore(marketCoreAddress);
  await setMarketCoreTx.wait();
  console.log("✅ Market core address set in position contract");

  console.log("\n🎉 Deployment Complete!");
  console.log("=" .repeat(60));
  console.log("📋 Contract Addresses:");
  console.log("   CLMSRPosition:", positionAddress);
  console.log("   CLMSRMarketCore:", marketCoreAddress);
  console.log("\n🔗 Network: Rootstock Testnet (Chain ID: 31)");
  console.log("🌐 Explorer: https://explorer.testnet.rsk.co");
  console.log("\n📝 Next Steps:");
  console.log("   1. Verify contracts on explorer");
  console.log("   2. Create a test market");
  console.log("   3. Test position opening/closing");
  console.log("   4. Deploy to mainnet when ready");

  // Save deployment info
  const deploymentInfo = {
    network: "rskTestnet",
    chainId: 31,
    deployer: deployer.address,
    contracts: {
      CLMSRPosition: positionAddress,
      CLMSRMarketCore: marketCoreAddress,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n💾 Deployment info saved to deployment.json");
  
  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
