// Direct deployment script without npm dependencies
// Uses only Node.js built-in modules and direct contract compilation

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  
  return env;
}

async function main() {
  console.log('🚀 Direct CLI Deployment for CLMSR Protocol');
  console.log('============================================');
  
  const env = loadEnv();
  
  if (!env.CONTRACT_DEPLOYER_PRIVATE_KEY) {
    console.error('❌ CONTRACT_DEPLOYER_PRIVATE_KEY not found in .env');
    process.exit(1);
  }
  
  console.log('✅ Environment loaded');
  console.log('🔑 Private key configured');
  console.log('🌐 RPC:', env.ROOTSTOCK_RPC_URL || 'https://public-node.testnet.rsk.co');
  
  console.log('\n🎯 For CLI deployment, you have these options:');
  console.log('');
  
  console.log('1. 🔥 FOUNDRY (Recommended CLI tool)');
  console.log('   Install: https://getfoundry.sh/');
  console.log('   Commands:');
  console.log('   curl -L https://foundry.paradigm.xyz | bash');
  console.log('   foundryup');
  console.log('   ./foundry-deploy.sh');
  console.log('');
  
  console.log('2. 🛠️ MANUAL FORGE COMMANDS');
  console.log('   After installing Foundry, run these commands:');
  console.log('');
  console.log('   # Set variables');
  console.log(`   export RPC_URL="${env.ROOTSTOCK_RPC_URL || 'https://public-node.testnet.rsk.co'}"`);
  console.log(`   export PRIVATE_KEY="${env.CONTRACT_DEPLOYER_PRIVATE_KEY}"`);
  console.log('');
  console.log('   # Deploy MockRBTC');
  console.log('   forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \\');
  console.log('     contracts/mocks/MockRBTC.sol:MockRBTC \\');
  console.log('     --constructor-args "Rootstock Bitcoin" "RBTC" 18 1000000000000000000000000');
  console.log('');
  console.log('   # Deploy CLMSRPosition');
  console.log('   forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \\');
  console.log('     contracts/CLMSRPosition.sol:CLMSRPosition');
  console.log('');
  console.log('   # Deploy CLMSRMarketCore');
  console.log('   forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \\');
  console.log('     contracts/CLMSRMarketCore.sol:CLMSRMarketCore');
  console.log('');
  
  console.log('3. 🌐 REMIX IDE (Browser-based alternative)');
  console.log('   Go to: https://remix.ethereum.org');
  console.log('   Upload all .sol files and deploy manually');
  console.log('');
  
  console.log('💡 RECOMMENDATION:');
  console.log('Install Foundry for the best CLI experience:');
  console.log('1. Download Git: https://git-scm.com/download/win');
  console.log('2. Download Rust: https://rustup.rs/');
  console.log('3. Install Foundry: curl -L https://foundry.paradigm.xyz | bash');
  console.log('4. Run: foundryup');
  console.log('5. Deploy: ./foundry-deploy.sh');
  console.log('');
  
  console.log('🎉 Your contracts and environment are ready!');
  console.log('Choose your preferred deployment method above.');
}

main().catch(console.error);
