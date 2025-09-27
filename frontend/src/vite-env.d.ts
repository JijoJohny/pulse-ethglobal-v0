/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ROOTSTOCK_RPC_URL: string
  readonly VITE_CLMSR_MARKET_CORE_ADDRESS: string
  readonly VITE_USDC_ADDRESS: string
  readonly VITE_GRAPH_ENDPOINT: string
  readonly VITE_GRAPH_API_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_NOTIFICATIONS: string
  readonly VITE_ENABLE_DARK_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
