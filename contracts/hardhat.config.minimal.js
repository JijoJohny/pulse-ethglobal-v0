require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    testnet: {
      url: process.env.ROOTSTOCK_RPC_URL || "https://public-node.testnet.rsk.co",
      chainId: 31,
      accounts: process.env.CONTRACT_DEPLOYER_PRIVATE_KEY
        ? [process.env.CONTRACT_DEPLOYER_PRIVATE_KEY]
        : [],
      gasPrice: 20000000000, // 20 Gwei
      gas: 8000000,
    },
    mainnet: {
      url: process.env.ROOTSTOCK_RPC_URL || "https://public-node.rsk.co",
      chainId: 30,
      accounts: process.env.CONTRACT_DEPLOYER_PRIVATE_KEY
        ? [process.env.CONTRACT_DEPLOYER_PRIVATE_KEY]
        : [],
      gasPrice: 20000000000, // 20 Gwei
      gas: 8000000,
    },
  },
};
