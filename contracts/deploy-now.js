const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABIs and Bytecodes (simplified versions)
const MockRBTC_ABI = [
  "constructor(string memory name, string memory symbol, uint8 decimals_, uint256 initialSupply)",
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

async function main() {
  console.log('🚀 Deploying CLMSR Protocol to Rootstock Testnet');
  console.log('==================================================');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.ROOTSTOCK_RPC_URL);
  
  // Check if private key exists
  let privateKey = process.env.CONTRACT_DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ CONTRACT_DEPLOYER_PRIVATE_KEY not found in .env file');
    console.log('Please add your private key to the .env file');
    return;
  }
  
  // Ensure private key has 0x prefix
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📝 Deployer address:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'RBTC');

  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ Insufficient balance! Need at least 0.01 RBTC');
    console.log('🔗 Get testnet RBTC: https://faucet.testnet.rsk.co/');
    return;
  }

  // Get network info
  const network = await provider.getNetwork();
  console.log('🌐 Connected to Chain ID:', network.chainId.toString());

  if (network.chainId !== 31n) {
    console.warn('⚠️  Warning: Not connected to Rootstock Testnet (Chain ID 31)');
    console.log('Current Chain ID:', network.chainId.toString());
  }

  console.log('\n📋 Deployment Status:');
  console.log('✅ Environment configured');
  console.log('✅ Wallet connected');
  console.log('✅ Sufficient balance');
  
  console.log('\n🎯 Next Steps:');
  console.log('Since we need compiled contract bytecode, please use one of these methods:');
  console.log('');
  console.log('🔥 RECOMMENDED: Use Remix IDE');
  console.log('1. Go to https://remix.ethereum.org');
  console.log('2. Upload all contract files from contracts/ folder');
  console.log('3. Compile contracts');
  console.log('4. Connect MetaMask to Rootstock Testnet');
  console.log('5. Deploy in this order:');
  console.log('   - MockRBTC');
  console.log('   - CLMSRPosition');
  console.log('   - CLMSRMarketCore');
  console.log('');
  console.log('🔧 Alternative: Install Foundry');
  console.log('1. Install: curl -L https://foundry.paradigm.xyz | bash');
  console.log('2. Run: foundryup');
  console.log('3. Use the foundry-deploy.sh script');
  console.log('');
  console.log('📱 Your deployment wallet is ready!');
  console.log('Address:', wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'RBTC');
}

main().catch(console.error);
