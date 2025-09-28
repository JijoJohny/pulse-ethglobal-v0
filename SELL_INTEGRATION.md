# Smart Contract Sell Integration

This document explains the complete sell functionality integration with CLMSR smart contracts, allowing users to sell their positions both partially and completely.

## Overview

The sell integration provides two types of selling:
- **Partial Sell** - Decrease position size using `decreasePosition()`
- **Complete Sell** - Close entire position using `closePosition()`

## Architecture

```
Frontend Sell Dialog → Smart Contract Service → CLMSR Contracts → Backend API → Supabase
```

## Components

### 1. Smart Contract Service (`lib/contracts.ts`)
- `calculateDecreaseProceeds()` - Calculate proceeds for partial sell
- `calculateCloseProceeds()` - Calculate proceeds for complete sell
- `decreasePosition()` - Execute partial sell transaction
- `closePosition()` - Execute complete sell transaction

### 2. Sell Dialog (`components/sell-dialog.tsx`)
- Interactive UI for selecting sell type and amount
- Real-time proceeds calculation
- Smart contract integration with error handling
- Backend API integration for transaction recording

### 3. Backend API (`backend/src/api/predictions.ts`)
- `POST /api/predictions/sell` - Record sell transactions
- `GET /api/predictions/:id/sell-info` - Get position sell information
- Supabase integration for transaction storage

### 4. History Page Integration (`app/history/page.tsx`)
- Sell buttons for each position
- Integration with sell dialog
- Position status management

## Smart Contract Methods

### CLMSRMarketCore Contract
```solidity
// Calculate proceeds for partial sell
function calculateDecreaseProceeds(uint256 positionId, uint256 quantity) external returns (uint256 proceeds);

// Calculate proceeds for complete sell
function calculateCloseProceeds(uint256 positionId) external returns (uint256 proceeds);

// Execute partial sell
function decreasePosition(uint256 positionId, uint256 quantity) external;

// Execute complete sell
function closePosition(uint256 positionId) external;
```

## User Flow

### 1. User Initiates Sell
```typescript
// User clicks "Sell" button in history page
<Button onClick={() => setSellFor(p.id)}>
  Sell
</Button>
```

### 2. Sell Dialog Opens
```typescript
// Sell dialog with smart contract integration
<SellDialog
  open={!!sellFor}
  positionId={currentSell?.positionId}
  positionData={currentSell?.positionData}
  onSellComplete={handleSellComplete}
/>
```

### 3. User Selects Sell Type
- **Partial Sell**: User specifies amount to sell
- **Complete Sell**: User sells entire position

### 4. Proceeds Calculation
```typescript
// Real-time proceeds calculation
useEffect(() => {
  const calculateProceeds = async () => {
    if (sellType === 'complete') {
      calculatedProceeds = await contractService.calculateCloseProceeds(positionId)
    } else {
      calculatedProceeds = await contractService.calculateDecreaseProceeds(positionId, quantityToSell)
    }
    setProceeds(calculatedProceeds)
  }
  calculateProceeds()
}, [positionId, amount, sellType])
```

### 5. Execute Sell Transaction
```typescript
const handleSell = async () => {
  let result: any

  if (sellType === 'complete') {
    result = await contractService.closePosition(positionId)
  } else {
    result = await contractService.decreasePosition(positionId, quantityToSell)
  }

  if (result.success) {
    // Record transaction in backend
    await apiClient.recordSellTransaction({
      transactionHash: result.transactionHash,
      positionId: positionId,
      userAddress: address,
      sellType: sellType,
      proceeds: proceeds,
      marketId: marketId
    })
  }
}
```

## Backend Integration

### Sell Transaction Recording
```typescript
// POST /api/predictions/sell
router.post('/sell', [
  body('transactionHash').isString().notEmpty(),
  body('positionId').isString().notEmpty(),
  body('userAddress').isEthereumAddress(),
  body('sellType').isIn(['partial', 'complete']),
  body('proceeds').isString().notEmpty(),
], async (req, res) => {
  // Update position status
  const updateData = {
    transaction_hash: transactionHash,
    updated_at: new Date().toISOString()
  }

  if (sellType === 'complete') {
    updateData.is_active = false
    updateData.closed_at = new Date().toISOString()
  }

  // Update position in database
  const { data: updatedPosition } = await supabase.getClient()
    .from(TABLES.POSITIONS)
    .update(updateData)
    .eq('smart_contract_position_id', positionId)
    .select()
    .single()

  // Create sell transaction record
  const sellTransactionData = {
    trade_id: `sell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_address: userAddress.toLowerCase(),
    market_id: marketId,
    position_id: updatedPosition.position_id,
    type: sellType === 'complete' ? 'CLOSE' : 'DECREASE',
    quantity: quantitySold || updatedPosition.quantity,
    cost: proceeds,
    transaction_hash: transactionHash,
    timestamp: new Date().toISOString()
  }

  await supabase.getClient()
    .from(TABLES.TRADES)
    .insert(sellTransactionData)
})
```

## Database Schema

### Positions Table Updates
```sql
-- Position status tracking
is_active BOOLEAN DEFAULT true
closed_at TIMESTAMPTZ
outcome VARCHAR(10) DEFAULT 'OPEN'
transaction_hash VARCHAR(66)
```

### Trades Table
```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id VARCHAR(255) UNIQUE NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  market_id VARCHAR(255) NOT NULL,
  position_id VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL, -- 'OPEN', 'CLOSE', 'INCREASE', 'DECREASE'
  quantity VARCHAR(255) NOT NULL,
  cost VARCHAR(255) NOT NULL,
  price VARCHAR(255) NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Error Handling

### Smart Contract Errors
- **Insufficient Position Size** - User tries to sell more than available
- **Position Not Found** - Invalid position ID
- **Market Not Active** - Position cannot be sold
- **Gas Estimation Failures** - Network issues

### Backend Errors
- **Transaction Recording Failures** - Database connection issues
- **Position Update Failures** - Concurrent modification conflicts
- **Validation Errors** - Invalid input parameters

### Frontend Errors
- **Wallet Connection Issues** - User not connected
- **Network Mismatch** - Wrong blockchain network
- **Contract Initialization** - Smart contracts not loaded

## Security Considerations

### Transaction Validation
- All transactions require user approval via MetaMask
- Position ownership verification on smart contract
- Transaction hash validation and uniqueness
- Gas limit protection against failed transactions

### Data Integrity
- Position status consistency between blockchain and database
- Transaction recording with proper error handling
- User permission validation for sell operations

## Testing

### Local Testing
1. **Deploy contracts to local network**
2. **Create test positions**
3. **Test partial and complete sells**
4. **Verify database updates**

### Testnet Testing
1. **Deploy to Rootstock testnet**
2. **Test with real transactions**
3. **Verify transaction recording**
4. **Test error scenarios**

## Monitoring and Analytics

### Transaction Tracking
```typescript
logger.info('Position sell recorded successfully', {
  positionId: updatedPosition.id,
  transactionHash,
  sellType,
  proceeds
});
```

### Analytics Data
- Sell volume metrics
- Position closure rates
- User selling patterns
- Market liquidity impact

## Future Enhancements

### Planned Features
- **Batch Selling** - Sell multiple positions at once
- **Sell Orders** - Set sell prices for automatic execution
- **Position Analytics** - Detailed position performance metrics
- **Advanced Order Types** - Stop-loss, take-profit orders

### Performance Optimizations
- **Gas Optimization** - Batch transactions for multiple sells
- **Caching** - Position data caching for faster UI
- **Real-time Updates** - WebSocket integration for live updates

## Deployment Checklist

- [ ] Deploy smart contracts with sell functionality
- [ ] Update contract addresses in configuration
- [ ] Run database migrations for trades table
- [ ] Test sell flow end-to-end
- [ ] Verify transaction recording
- [ ] Monitor performance and error rates
- [ ] Set up analytics and monitoring

## Troubleshooting

### Common Issues

1. **"Position not found"**
   - Check position ID validity
   - Verify position ownership
   - Ensure position is active

2. **"Insufficient position size"**
   - Check available quantity
   - Verify partial sell amounts
   - Ensure position is not already closed

3. **"Transaction failed"**
   - Check gas limits
   - Verify network connection
   - Ensure sufficient balance

### Debug Tools

```typescript
// Check position status
const position = await contractService.getPosition(positionId);

// Verify sell eligibility
const canSell = position.isActive && position.owner === userAddress;

// Calculate proceeds
const proceeds = await contractService.calculateCloseProceeds(positionId);
```

This complete sell integration ensures that users can efficiently manage their positions with full smart contract integration, proper error handling, and comprehensive transaction tracking.
