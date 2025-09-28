# Smart Contract Integration Guide

This document explains how the predict button has been integrated with the CLMSR smart contracts for creating predictions on the blockchain.

## Overview

The integration connects the frontend predict button to the deployed CLMSR smart contracts, allowing users to:
- Create positions directly on the blockchain
- Store transaction data in the backend database
- Track positions with both on-chain and off-chain data

## Architecture

```
Frontend (React) → Smart Contract Service → CLMSR Contracts → Backend API → Database
```

## Components

### 1. Smart Contract Service (`lib/contracts.ts`)
- Handles contract initialization and interaction
- Provides methods for opening positions, calculating costs
- Manages transaction signing and confirmation
- Error handling and transaction status tracking

### 2. Contract Configuration (`lib/contract-config.ts`)
- Manages contract addresses for different networks
- Network detection and configuration
- Deployment instructions

### 3. Updated Bet Panel (`components/bet-panel.tsx`)
- Integrates smart contract calls into the predict flow
- Handles contract initialization
- Transaction error handling and user feedback
- Fallback to offline mode if contracts fail

### 4. Backend Integration (`backend/src/api/predictions.ts`)
- Accepts smart contract transaction data
- Stores transaction hash and position ID
- Links on-chain and off-chain data

## Smart Contract Methods Used

### CLMSRMarketCore Contract
- `calculateOpenCost()` - Calculate the cost of opening a position
- `openPosition()` - Create a new position on the blockchain
- `getMarket()` - Get market information
- `getPosition()` - Get position details

### CLMSRPosition Contract
- `mint()` - Mint NFT for position (called by market core)
- `getOwnerPositions()` - Get user's positions

## Transaction Flow

1. **User clicks Predict button**
2. **Contract initialization check** - Ensure contracts are loaded
3. **Calculate position cost** - Call `calculateOpenCost()`
4. **Open position** - Call `openPosition()` with user's parameters
5. **Wait for confirmation** - Monitor transaction status
6. **Store in backend** - Save transaction data to database
7. **Update UI** - Show success/error status

## Configuration

### Contract Addresses
Update the addresses in `lib/contract-config.ts`:

```typescript
export const CONTRACT_ADDRESSES: NetworkConfig = {
  testnet: {
    CLMSR_MARKET_CORE: '0x...', // Replace with actual testnet address
    CLMSR_POSITION: '0x...',    // Replace with actual testnet address
  },
  mainnet: {
    CLMSR_MARKET_CORE: '0x...', // Replace with actual mainnet address
    CLMSR_POSITION: '0x...',    // Replace with actual mainnet address
  }
};
```

### Database Schema
The database has been updated to include smart contract fields:
- `transaction_hash` - Blockchain transaction hash
- `smart_contract_position_id` - On-chain position ID

## Deployment Steps

### 1. Deploy Smart Contracts
```bash
cd pulse-08/contracts
npm install
cp env.example .env
# Edit .env with your private key
npm run deploy:testnet  # or deploy:mainnet
```

### 2. Update Contract Addresses
After deployment, update the addresses in `lib/contract-config.ts` with the deployed addresses.

### 3. Run Database Migration
```bash
cd pulse-08/backend
# Run the migration to add smart contract fields
psql -d your_database -f migrations/002_add_smart_contract_fields.sql
```

### 4. Test Integration
1. Connect wallet to Rootstock network
2. Select a price range on the heatmap
3. Click the Predict button
4. Confirm the transaction in MetaMask
5. Verify the position is created on-chain and stored in the database

## Error Handling

The integration includes comprehensive error handling:

- **Contract not initialized** - Shows initialization status
- **Transaction failed** - Displays error message with retry option
- **Network mismatch** - Prompts user to switch networks
- **Insufficient funds** - Shows balance requirements
- **Fallback mode** - Works offline if contracts are unavailable

## Security Considerations

- All transactions require user approval via MetaMask
- Private keys are never exposed to the frontend
- Contract addresses are validated before initialization
- Transaction data is verified before storing in database

## Testing

### Local Testing
1. Deploy contracts to local Hardhat network
2. Update contract addresses in config
3. Test the full flow with local wallet

### Testnet Testing
1. Deploy to Rootstock testnet
2. Get testnet RBTC from faucet
3. Test with real transactions

### Production Deployment
1. Deploy to Rootstock mainnet
2. Update production contract addresses
3. Test with small amounts first

## Troubleshooting

### Common Issues

1. **"Smart contracts not initialized"**
   - Check contract addresses are correct
   - Verify network connection
   - Ensure contracts are deployed

2. **"Transaction failed"**
   - Check user has sufficient balance
   - Verify gas limits
   - Check contract state

3. **"Network mismatch"**
   - User needs to switch to Rootstock network
   - Check MetaMask network settings

### Debug Mode
Enable debug logging by setting:
```typescript
console.log('Contract service debug:', contractService.isInitialized());
```

## Future Enhancements

- Position management (increase/decrease/close)
- Real-time position updates
- Batch operations for multiple positions
- Advanced error recovery
- Gas optimization
- Position analytics and reporting
