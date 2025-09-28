# Smart Contract Transaction Data Flow to Supabase

This document outlines the complete data flow from smart contract transactions to Supabase storage.

## Overview

When a user creates a prediction through the smart contract, the following process ensures all transaction data is properly stored in Supabase:

## Complete Data Flow

### 1. Frontend Transaction Initiation
```typescript
// User clicks predict button in bet-panel.tsx
async function predict() {
  // 1. Validate inputs and contract state
  if (!contractInitialized || !address) return;
  
  // 2. Prepare position parameters
  const positionParams = {
    marketId: "1",
    lowerTick: Math.floor(selection.priceMin * 100),
    upperTick: Math.floor(selection.priceMax * 100),
    quantity: (amount * 1e18).toString(),
  };
  
  // 3. Calculate cost on smart contract
  const cost = await contractService.calculateOpenCost(positionParams);
  
  // 4. Execute transaction on blockchain
  const result = await contractService.openPosition(positionParams);
}
```

### 2. Smart Contract Interaction
```typescript
// contracts.ts - ContractService.openPosition()
public async openPosition(params: PositionParams): Promise<TransactionResult> {
  // 1. Estimate gas
  const gasEstimate = await this.marketCoreContract.openPosition.estimateGas(...);
  
  // 2. Execute transaction
  const tx = await this.marketCoreContract.openPosition(...);
  
  // 3. Wait for confirmation
  const receipt = await tx.wait();
  
  // 4. Extract position ID from events
  const positionId = extractPositionIdFromEvents(receipt);
  
  return {
    success: true,
    transactionHash: tx.hash,
    positionId
  };
}
```

### 3. Supabase Data Storage
```typescript
// bet-panel.tsx - After successful transaction
if (result.success) {
  // Store transaction data in Supabase
  const response = await apiClient.storeTransactionData({
    transactionHash: result.transactionHash!,
    positionId: result.positionId!,
    userAddress: address,
    marketId: "btc_price_market_1",
    lowerTick: positionParams.lowerTick,
    upperTick: positionParams.upperTick,
    quantity: positionParams.quantity,
    costBasis: cost,
    priceMin: selection.priceMin,
    priceMax: selection.priceMax,
    avgPriceCents: selection.avgPriceCents,
    betAmountUsd: amount,
    potentialWinUsd: toWin,
    potentialLossUsd: amount,
  });
}
```

### 4. Backend API Processing
```typescript
// predictions.ts - POST /api/predictions/transaction
router.post('/transaction', [...validation], async (req, res) => {
  const result = await SupabaseTransactionService.storeTransactionData({
    transactionHash,
    positionId,
    userAddress,
    marketId,
    lowerTick,
    upperTick,
    quantity,
    costBasis,
    priceMin,
    priceMax,
    avgPriceCents,
    betAmountUsd,
    potentialWinUsd,
    potentialLossUsd
  });
  
  res.status(201).json({
    success: true,
    message: 'Transaction data stored successfully',
    data: result
  });
});
```

### 5. Supabase Service Storage
```typescript
// supabase-transaction-service.ts
static async storeTransactionData(data: TransactionData) {
  // 1. Create position record
  const positionData = {
    position_id: dbPositionId,
    user_address: data.userAddress.toLowerCase(),
    market_id: data.marketId,
    lower_tick: data.lowerTick,
    upper_tick: data.upperTick,
    quantity: data.quantity,
    cost_basis: data.costBasis,
    outcome: 'OPEN',
    is_claimed: false,
    is_active: true,
    transaction_hash: data.transactionHash,
    smart_contract_position_id: data.positionId,
    date_label: new Date().toLocaleDateString('en-US', {...})
  };
  
  const { data: position } = await supabase.getClient()
    .from(TABLES.POSITIONS)
    .insert(positionData)
    .select()
    .single();
  
  // 2. Create prediction analytics record
  const analyticsData = {
    user_address: data.userAddress.toLowerCase(),
    market_id: data.marketId,
    position_id: dbPositionId,
    price_min: data.priceMin,
    price_max: data.priceMax,
    avg_price_cents: data.avgPriceCents,
    bet_amount_usd: data.betAmountUsd,
    potential_win_usd: data.potentialWinUsd,
    potential_loss_usd: data.potentialLossUsd,
    status: 'live',
    date_label: new Date().toLocaleDateString('en-US', {...}),
    transaction_hash: data.transactionHash,
    smart_contract_position_id: data.positionId
  };
  
  const { data: analytics } = await supabase.getClient()
    .from(TABLES.PREDICTION_ANALYTICS)
    .insert(analyticsData)
    .select()
    .single();
  
  // 3. Update user statistics
  await this.updateUserStats(data.userAddress);
  
  return { position, predictionAnalytics: analytics };
}
```

## Database Schema

### Positions Table
```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id VARCHAR(255) UNIQUE NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  market_id VARCHAR(255) NOT NULL,
  lower_tick BIGINT NOT NULL,
  upper_tick BIGINT NOT NULL,
  quantity VARCHAR(255) NOT NULL,
  cost_basis VARCHAR(255) NOT NULL,
  outcome VARCHAR(10) DEFAULT 'OPEN',
  is_claimed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  transaction_hash VARCHAR(66), -- NEW: Smart contract transaction hash
  smart_contract_position_id VARCHAR(255), -- NEW: On-chain position ID
  date_label VARCHAR(50),
  avg_price_cents DECIMAL(10, 2),
  potential_win_usd DECIMAL(20, 2),
  potential_loss_usd DECIMAL(20, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ
);
```

### Prediction Analytics Table
```sql
CREATE TABLE prediction_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address VARCHAR(42) NOT NULL,
  market_id VARCHAR(255) NOT NULL,
  position_id VARCHAR(255) NOT NULL,
  price_min DECIMAL(10, 2) NOT NULL,
  price_max DECIMAL(10, 2) NOT NULL,
  avg_price_cents DECIMAL(10, 2) NOT NULL,
  bet_amount_usd DECIMAL(20, 2) NOT NULL,
  potential_win_usd DECIMAL(20, 2) NOT NULL,
  potential_loss_usd DECIMAL(20, 2) NOT NULL,
  status VARCHAR(10) DEFAULT 'live',
  date_label VARCHAR(50) NOT NULL,
  transaction_hash VARCHAR(66), -- NEW: Smart contract transaction hash
  smart_contract_position_id VARCHAR(255), -- NEW: On-chain position ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Data Verification

### Transaction Integrity
```typescript
// Verify transaction data matches expected values
const isValid = await SupabaseTransactionService.verifyTransactionData(
  transactionHash,
  {
    userAddress: '0x...',
    marketId: 'btc_price_market_1',
    lowerTick: 1000,
    upperTick: 2000
  }
);
```

### Data Consistency Checks
- Transaction hash format validation
- Position ID uniqueness verification
- User address normalization
- Market data consistency across tables

## Error Handling

### Transaction Failures
1. **Smart Contract Revert** → No Supabase storage
2. **Network Issues** → Retry mechanism
3. **Gas Estimation Failures** → User feedback

### Storage Failures
1. **Supabase Connection Issues** → Fallback to local storage
2. **Data Validation Errors** → Error logging and user notification
3. **Duplicate Position IDs** → Conflict resolution

## Monitoring and Logging

### Transaction Tracking
```typescript
logger.info('Storing smart contract transaction data', {
  transactionHash,
  positionId,
  userAddress,
  marketId
});

logger.info('Smart contract transaction data stored successfully', {
  positionId: result.position.id,
  transactionHash
});
```

### Analytics Data
- Transaction volume metrics
- User activity tracking
- Market performance data
- Error rate monitoring

## Security Considerations

### Data Validation
- All addresses are validated and normalized
- Transaction hashes are verified format
- Position IDs are unique and validated
- User permissions are enforced

### Privacy
- User addresses are hashed for analytics
- Personal data is not stored
- Transaction data is public on blockchain
- Analytics are aggregated and anonymized

## Testing

### Local Testing
1. **Start Local Supabase** → Use Supabase CLI
2. **Run Migrations** → Apply schema changes
3. **Test API Endpoints** → Verify data storage
4. **Check Data Integrity** → Validate stored data

### Production Testing
1. **Deploy to Staging** → Test with real transactions
2. **Monitor Performance** → Check response times
3. **Verify Data Quality** → Ensure data accuracy
4. **Test Error Handling** → Verify failure scenarios

## Deployment Checklist

- [ ] Deploy smart contracts to target network
- [ ] Update contract addresses in configuration
- [ ] Run database migrations
- [ ] Test transaction flow end-to-end
- [ ] Verify data integrity
- [ ] Monitor performance metrics
- [ ] Set up error alerting

This complete integration ensures that all smart contract transactions are properly tracked and stored in Supabase, providing a comprehensive audit trail and analytics capabilities for the prediction market platform.
