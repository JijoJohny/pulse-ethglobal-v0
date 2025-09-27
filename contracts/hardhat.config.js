require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    "rootstock-testnet": {
      url: "https://public-node.testnet.rsk.co",
      chainId: 31,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 60000000, // 0.06 gwei
    },
    "rootstock-mainnet": {
      url: "https://public-node.rsk.co",
      chainId: 30,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 60000000, // 0.06 gwei
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      rootstock: "your-rootstock-api-key",
    },
    customChains: [
      {
        network: "rootstock",
        chainId: 30,
        urls: {
          apiURL: "https://api.rootstock.blockscout.com/api",
          browserURL: "https://rootstock.blockscout.com",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
          solidity: {
            version: "0.8.24",
            settings: {
              optimizer: {
                enabled: true,
                runs: 200,
              },
              viaIR: true,
            },
          },
};
