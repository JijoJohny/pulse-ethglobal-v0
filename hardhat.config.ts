import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    rskTestnet: {
      url: "https://public-node.testnet.rsk.co",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 31,
      gasPrice: 60000000, // 0.06 gwei
      gas: 8000000,
    },
    rskMainnet: {
      url: "https://public-node.rsk.co",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 30,
      gasPrice: 60000000, // 0.06 gwei
      gas: 8000000,
    },
  },
  etherscan: {
    apiKey: {
      rskTestnet: process.env.RSK_EXPLORER_API_KEY || "",
      rskMainnet: process.env.RSK_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "rskTestnet",
        chainId: 31,
        urls: {
          apiURL: "https://api.explorer.testnet.rsk.co/api",
          browserURL: "https://explorer.testnet.rsk.co",
        },
      },
      {
        network: "rskMainnet",
        chainId: 30,
        urls: {
          apiURL: "https://api.explorer.rsk.co/api",
          browserURL: "https://explorer.rsk.co",
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
  typechain: {
    outDir: "./typechain-types",
    target: "ethers-v6",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;
