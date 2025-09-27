// Test setup for MetaMask mocking
import { vi } from 'vitest'

// Mock window.ethereum for tests
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
}

// Use Object.defineProperty to properly mock the read-only property
Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: false,
  configurable: true,
})

// Export for use in tests
export { mockEthereum }
