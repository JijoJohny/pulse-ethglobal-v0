import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";

interface DeploymentResult {
  marketCore: Contract;
  position: Contract;
  rbtcToken?: Contract;
}

async function main(): Promise<DeploymentResult> {
  console.log("🚀 Starting CLMSR Protocol deployment on Rootstock...");

  const [deployer, admin, keeper] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy or use existing RBTC token (on testnet we might need a mock)
  let rbtcTokenAddress: string;
  let rbtcToken: Contract | undefined;

  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId);

  if (network.chainId === 31n || network.chainId === 30n) {
    // Rootstock mainnet/testnet - use actual RBTC token
    // On Rootstock, RBTC is the native token, but we might need an ERC20 wrapper
    rbtcTokenAddress = process.env.RBTC_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
    console.log("🪙 Using RBTC token at:", rbtcTokenAddress);
  } else {
    // Deploy mock RBTC token for testing
    console.log("🧪 Deploying mock RBTC token for testing...");
    const MockRBTC = await ethers.getContractFactory("MockRBTC");
    rbtcToken = await MockRBTC.deploy(
      "Rootstock Bitcoin",
      "RBTC",
      18,
      ethers.parseEther("1000000") // 1M RBTC supply
    );
    await rbtcToken.waitForDeployment();
    rbtcTokenAddress = await rbtcToken.getAddress();
    console.log("✅ Mock RBTC deployed at:", rbtcTokenAddress);
  }

  // Deploy CLMSRPosition contract
  console.log("🎨 Deploying CLMSRPosition NFT contract...");
  const CLMSRPosition = await ethers.getContractFactory("CLMSRPosition");
  
  const position = await upgrades.deployProxy(
    CLMSRPosition,
    [
      ethers.ZeroAddress, // marketCore will be set after deployment
      "CLMSR Position NFT",
      "CLMSR-POS",
      "https://api.pulse08.com/metadata/position/", // Base URI
      "https://api.pulse08.com/metadata/contract" // Contract URI
    ],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );
  await position.waitForDeployment();
  const positionAddress = await position.getAddress();
  console.log("✅ CLMSRPosition deployed at:", positionAddress);

  // Deploy CLMSRMarketCore contract
  console.log("🏪 Deploying CLMSRMarketCore contract...");
  const CLMSRMarketCore = await ethers.getContractFactory("CLMSRMarketCore");
  
  const marketCore = await upgrades.deployProxy(
    CLMSRMarketCore,
    [
      rbtcTokenAddress,
      positionAddress
    ],
    {
      initializer: "initialize",
      kind: "uups"
    }
  );
  await marketCore.waitForDeployment();
  const marketCoreAddress = await marketCore.getAddress();
  console.log("✅ CLMSRMarketCore deployed at:", marketCoreAddress);

  // Update position contract with market core address
  console.log("🔗 Linking contracts...");
  const MARKET_CORE_ROLE = await position.MARKET_CORE_ROLE();
  await position.grantRole(MARKET_CORE_ROLE, marketCoreAddress);
  console.log("✅ Granted MARKET_CORE_ROLE to CLMSRMarketCore");

  // Grant roles
  console.log("👑 Setting up roles...");
  
  // Market Core roles
  const ADMIN_ROLE = await marketCore.ADMIN_ROLE();
  const KEEPER_ROLE = await marketCore.KEEPER_ROLE();
  
  if (admin && admin.address !== deployer.address) {
    await marketCore.grantRole(ADMIN_ROLE, admin.address);
    console.log("✅ Granted ADMIN_ROLE to:", admin.address);
  }
  
  if (keeper && keeper.address !== deployer.address) {
    await marketCore.grantRole(KEEPER_ROLE, keeper.address);
    console.log("✅ Granted KEEPER_ROLE to:", keeper.address);
  }

  // Position contract roles
  const POSITION_ADMIN_ROLE = await position.ADMIN_ROLE();
  if (admin && admin.address !== deployer.address) {
    await position.grantRole(POSITION_ADMIN_ROLE, admin.address);
    console.log("✅ Granted Position ADMIN_ROLE to:", admin.address);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract Addresses:");
  console.log("   CLMSRMarketCore:", marketCoreAddress);
  console.log("   CLMSRPosition:  ", positionAddress);
  console.log("   RBTC Token:     ", rbtcTokenAddress);

  console.log("\n🔧 Configuration:");
  console.log("   Deployer:", deployer.address);
  console.log("   Admin:   ", admin?.address || "Not set");
  console.log("   Keeper:  ", keeper?.address || "Not set");

  // Verify contracts on block explorer if not local network
  if (network.chainId !== 31337n) {
    console.log("\n🔍 To verify contracts, run:");
    console.log(`npx hardhat verify --network ${network.name} ${marketCoreAddress}`);
    console.log(`npx hardhat verify --network ${network.name} ${positionAddress}`);
    if (rbtcToken) {
      console.log(`npx hardhat verify --network ${network.name} ${rbtcTokenAddress} "Rootstock Bitcoin" "RBTC" 18 1000000000000000000000000`);
    }
  }

  return {
    marketCore,
    position,
    rbtcToken
  };
}

// Handle deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

export default main;
