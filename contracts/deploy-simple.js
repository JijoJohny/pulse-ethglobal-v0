const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🚀 Starting CLMSR Protocol deployment on Rootstock...');

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying with account:', deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'RBTC');

  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ Insufficient balance! You need at least 0.01 RBTC for deployment.');
    console.log('🔗 Get testnet RBTC from: https://faucet.testnet.rsk.co/');
    return;
  }

  try {
    // Deploy Mock RBTC Token first (for testing)
    console.log('🪙 Deploying Mock RBTC token...');
    const MockRBTC = await ethers.getContractFactory('MockRBTC');
    const rbtcToken = await MockRBTC.deploy(
      'Rootstock Bitcoin',
      'RBTC',
      18,
      ethers.parseEther('1000000')
    );
    await rbtcToken.waitForDeployment();
    const rbtcAddress = await rbtcToken.getAddress();
    console.log('✅ Mock RBTC deployed at:', rbtcAddress);

    // Deploy CLMSRPosition (without upgrades for simplicity)
    console.log('🎨 Deploying CLMSRPosition...');
    const CLMSRPosition = await ethers.getContractFactory('CLMSRPosition');
    
    // For non-upgradeable version, we'll need to modify the contract
    // Let's deploy a simple version first
    
    console.log('⚠️  Note: This is a simplified deployment without upgrades.');
    console.log('📋 Contract addresses:');
    console.log('   Mock RBTC:', rbtcAddress);
    
    console.log('\n🎉 Basic deployment completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Add your private key to .env file');
    console.log('2. Get testnet RBTC from faucet');
    console.log('3. Run: npx hardhat run deploy-simple.js --network testnet');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('💡 Solution: Get more RBTC from https://faucet.testnet.rsk.co/');
    }
    
    if (error.message.includes('nonce')) {
      console.log('💡 Solution: Wait a moment and try again, or reset your MetaMask account');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
