// Rootstock Network Configuration
export const ROOTSTOCK_CONFIG = {
  testnet: {
    chainId: 31,
    name: 'Rootstock Testnet',
    rpcUrl: import.meta.env.VITE_ROOTSTOCK_RPC_URL || 'https://public-node.testnet.rsk.co',
    explorerUrl: 'https://explorer.testnet.rsk.co',
    currency: {
      name: 'RBTC',
      symbol: 'RBTC',
      decimals: 18,
    },
  },
  mainnet: {
    chainId: 30,
    name: 'Rootstock Mainnet',
    rpcUrl: 'https://public-node.rsk.co',
    explorerUrl: 'https://explorer.rsk.co',
    currency: {
      name: 'RBTC',
      symbol: 'RBTC',
      decimals: 18,
    },
  },
};

// Contract Addresses
export const CONTRACT_ADDRESSES = {
  CLMSR_MARKET_CORE: import.meta.env.VITE_CLMSR_MARKET_CORE_ADDRESS || '0x1234567890123456789012345678901234567890',
  USDC: import.meta.env.VITE_USDC_ADDRESS || '0x1234567890123456789012345678901234567890',
};

// The Graph Configuration
export const GRAPH_CONFIG = {
  endpoint: import.meta.env.VITE_GRAPH_ENDPOINT || 'https://api.thegraph.com/subgraphs/name/pulse-08/pulse-08-subgraph',
  apiKey: import.meta.env.VITE_GRAPH_API_KEY || '',
};

// Application Configuration
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Pulse-08',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  description: import.meta.env.VITE_APP_DESCRIPTION || 'Decentralized prediction markets on Rootstock',
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
};

// Feature Flags
export const FEATURE_FLAGS = {
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  darkMode: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
};

// Default Network
export const DEFAULT_NETWORK = 'testnet';

// Network Names
export const NETWORK_NAMES = {
  [ROOTSTOCK_CONFIG.testnet.chainId]: ROOTSTOCK_CONFIG.testnet.name,
  [ROOTSTOCK_CONFIG.mainnet.chainId]: ROOTSTOCK_CONFIG.mainnet.name,
};
