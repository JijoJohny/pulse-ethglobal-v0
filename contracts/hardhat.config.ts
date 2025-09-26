import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "hardhat-abi-exporter";
import "solidity-coverage";
import "dotenv/config";

const config: HardhatUserConfig = {
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
      forking: {
        url: process.env.ROOTSTOCK_RPC_URL || "https://public-node.testnet.rsk.co",
        blockNumber: undefined,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
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
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 20,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [],
  },
  abiExporter: {
    path: "./abis",
    clear: true,
    flat: true,
    only: [],
    spacing: 2,
  },
  etherscan: {
    apiKey: {
      testnet: process.env.ROOTSTOCK_API_KEY || "",
      mainnet: process.env.ROOTSTOCK_API_KEY || "",
    },
    customChains: [
      {
        network: "testnet",
        chainId: 31,
        urls: {
          apiURL: "https://blockscout.com/rsk/testnet/api",
          browserURL: "https://explorer.testnet.rsk.co",
        },
      },
      {
        network: "mainnet",
        chainId: 30,
        urls: {
          apiURL: "https://blockscout.com/rsk/api",
          browserURL: "https://explorer.rsk.co",
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    admin: {
      default: 1,
    },
    keeper: {
      default: 2,
    },
  },
  deploy: {
    testnet: {
      tags: ["testnet"],
    },
    mainnet: {
      tags: ["mainnet"],
    },
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;
