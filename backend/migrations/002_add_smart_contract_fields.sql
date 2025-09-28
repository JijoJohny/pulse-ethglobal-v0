-- =============================================================================
-- ADD SMART CONTRACT FIELDS TO POSITIONS TABLE
-- =============================================================================

-- Add smart contract related fields to positions table
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS smart_contract_position_id VARCHAR(255);

-- Add smart contract related fields to prediction_analytics table
ALTER TABLE prediction_analytics 
ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS smart_contract_position_id VARCHAR(255);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_positions_transaction_hash ON positions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_positions_smart_contract_position_id ON positions(smart_contract_position_id);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_transaction_hash ON prediction_analytics(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_smart_contract_position_id ON prediction_analytics(smart_contract_position_id);

-- Add constraints for transaction hash format
ALTER TABLE positions 
ADD CONSTRAINT valid_transaction_hash CHECK (transaction_hash IS NULL OR transaction_hash ~ '^0x[a-fA-F0-9]{64}$');

ALTER TABLE prediction_analytics 
ADD CONSTRAINT valid_transaction_hash CHECK (transaction_hash IS NULL OR transaction_hash ~ '^0x[a-fA-F0-9]{64}$');
