# Supabase Integration for Smart Contract Transactions

This document explains how smart contract transaction data is stored and managed in Supabase after blockchain transactions are completed.

## Overview

When a user creates a prediction through the smart contract, the following data flow occurs:

1. **Smart Contract Transaction** → User interacts with CLMSR contracts
2. **Transaction Confirmation** → Blockchain confirms the transaction
3. **Data Storage** → Transaction data is stored in Supabase
4. **Analytics** → Data is used for user analytics and position tracking

## Database Schema Updates

### Positions Table
The `positions` table has been updated to include smart contract fields:

```sql
ALTER TABLE positions 
ADD COLUMN transaction_hash VARCHAR(66),
ADD COLUMN smart_contract_position_id VARCHAR(255);
```

### Prediction Analytics Table
The `prediction_analytics` table also includes smart contract fields:

```sql
ALTER TABLE prediction_analytics 
ADD COLUMN transaction_hash VARCHAR(66),
ADD COLUMN smart_contract_position_id VARCHAR(255);
```

## Data Flow

### 1. Frontend Transaction
```typescript
// User clicks predict button
const result = await contractService.openPosition(positionParams);

// Transaction confirmed on blockchain
if (result.success) {
  // Store in Supabase
  await apiClient.storeTransactionData({
    transactionHash: result.transactionHash,
    positionId: result.positionId,
    userAddress: address,
    // ... other data
  });
}
```

### 2. Backend Processing
```typescript
// API endpoint: POST /api/predictions/transaction
const result = await SupabaseTransactionService.storeTransactionData({
  transactionHash,
  positionId,
  userAddress,
  marketId,
  lowerTick,
  upperTick,
  quantity,
  costBasis,
  // ... UI data
});
```

### 3. Supabase Storage
The service creates records in multiple tables:

- **positions** - Core position data with smart contract references
- **prediction_analytics** - UI analytics data with transaction info
- **users** - User profile and statistics
- **user_stats** - Aggregated user statistics

## API Endpoints

### Store Transaction Data
```http
POST /api/predictions/transaction
Content-Type: application/json

{
  "transactionHash": "0x...",
  "positionId": "123",
  "userAddress": "0x...",
  "marketId": "btc_price_market_1",
  "lowerTick": 1000,
  "upperTick": 2000,
  "quantity": "1000000000000000000",
  "costBasis": "500000000000000000",
  "priceMin": 100.0,
  "priceMax": 200.0,
  "avgPriceCents": 150.0,
  "betAmountUsd": 500.0,
  "potentialWinUsd": 750.0,
  "potentialLossUsd": 500.0
}
```

### Response
```json
{
  "success": true,
  "message": "Transaction data stored successfully",
  "data": {
    "position": {
      "id": "uuid",
      "position_id": "pos_...",
      "transaction_hash": "0x...",
      "smart_contract_position_id": "123",
      // ... other fields
    },
    "predictionAnalytics": {
      "id": "uuid",
      "transaction_hash": "0x...",
      "smart_contract_position_id": "123",
      // ... other fields
    }
  }
}
```

## Data Verification

### Transaction Integrity
The system includes verification methods to ensure data integrity:

```typescript
// Verify transaction data matches expected values
const isValid = await SupabaseTransactionService.verifyTransactionData(
  transactionHash,
  expectedData
);
```

### Data Consistency
- Transaction hash is validated against blockchain
- Position ID is verified with smart contract
- User address is normalized and validated
- Market data is consistent across tables

## User Statistics

### Automatic Updates
When a transaction is stored, user statistics are automatically updated:

- **Total Positions** - Incremented
- **Total Volume** - Updated with position value
- **Last Position** - Timestamp updated
- **Win/Loss Tracking** - For future settlement

### Analytics Data
The system tracks:

- Position creation timestamps
- Transaction costs and values
- Market performance metrics
- User behavior patterns

## Error Handling

### Transaction Failures
If the smart contract transaction fails:

1. **No Supabase Storage** - Data is not stored
2. **User Feedback** - Error message displayed
3. **Retry Option** - User can try again

### Storage Failures
If Supabase storage fails:

1. **Transaction Confirmed** - Blockchain transaction is valid
2. **Data Recovery** - Manual data entry possible
3. **Verification** - Transaction can be verified on-chain

## Monitoring and Logging

### Transaction Tracking
All transactions are logged with:

- Transaction hash
- User address
- Position details
- Timestamps
- Success/failure status

### Analytics
The system provides:

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

## Migration Scripts

### Database Migration
Run the migration to add smart contract fields:

```bash
cd pulse-08/backend
psql -d your_database -f migrations/002_add_smart_contract_fields.sql
```

### Data Migration
For existing data, you can:

1. **Backfill Transaction Data** - Add transaction hashes to existing positions
2. **Verify Data Integrity** - Ensure all data is consistent
3. **Update Analytics** - Recalculate user statistics

## Testing

### Local Testing
1. **Start Local Supabase** - Use Supabase CLI
2. **Run Migrations** - Apply schema changes
3. **Test API Endpoints** - Verify data storage
4. **Check Data Integrity** - Validate stored data

### Production Testing
1. **Deploy to Staging** - Test with real transactions
2. **Monitor Performance** - Check response times
3. **Verify Data Quality** - Ensure data accuracy
4. **Test Error Handling** - Verify failure scenarios

## Troubleshooting

### Common Issues

1. **Transaction Not Stored**
   - Check API endpoint availability
   - Verify Supabase connection
   - Check data validation errors

2. **Data Inconsistency**
   - Verify transaction hash format
   - Check position ID uniqueness
   - Validate user address format

3. **Performance Issues**
   - Monitor database query performance
   - Check for missing indexes
   - Optimize data structure

### Debug Tools

```typescript
// Check transaction data
const transaction = await SupabaseTransactionService.getTransactionByHash(hash);

// Verify user positions
const positions = await SupabaseTransactionService.getUserPositions(address);

// Validate data integrity
const isValid = await SupabaseTransactionService.verifyTransactionData(hash, data);
```

## Future Enhancements

### Planned Features
- Real-time position updates
- Advanced analytics dashboard
- Transaction history export
- Performance optimization

### Scalability
- Database indexing optimization
- Caching strategies
- Batch processing
- Data archival

This integration ensures that all smart contract transactions are properly tracked and stored in Supabase, providing a complete audit trail and analytics capabilities for the prediction market platform.
