-- =============================================================================
-- PULSE-08 DATABASE SCHEMA
-- Initial migration for Supabase setup
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- MARKETS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    min_tick BIGINT NOT NULL,
    max_tick BIGINT NOT NULL,
    tick_spacing BIGINT NOT NULL,
    start_timestamp TIMESTAMPTZ NOT NULL,
    end_timestamp TIMESTAMPTZ NOT NULL,
    settlement_value DECIMAL(78, 18),
    settlement_tick BIGINT,
    is_active BOOLEAN DEFAULT true,
    is_settled BOOLEAN DEFAULT false,
    liquidity_parameter VARCHAR(255) NOT NULL,
    payment_token VARCHAR(42) NOT NULL,
    total_liquidity VARCHAR(255) DEFAULT '0',
    total_volume VARCHAR(255) DEFAULT '0',
    total_trades INTEGER DEFAULT 0,
    created_by VARCHAR(42) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_tick_range CHECK (min_tick < max_tick),
    CONSTRAINT valid_time_range CHECK (start_timestamp < end_timestamp),
    CONSTRAINT valid_payment_token CHECK (payment_token ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_creator CHECK (created_by ~ '^0x[a-fA-F0-9]{40}$')
);

-- =============================================================================
-- POSITIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id VARCHAR(255) UNIQUE NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    market_id VARCHAR(255) NOT NULL,
    lower_tick BIGINT NOT NULL,
    upper_tick BIGINT NOT NULL,
    quantity VARCHAR(255) NOT NULL,
    cost_basis VARCHAR(255) NOT NULL,
    outcome VARCHAR(10) DEFAULT 'OPEN' CHECK (outcome IN ('OPEN', 'WIN', 'LOSS')),
    is_claimed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    -- Additional fields for UI display
    date_label VARCHAR(50), -- Formatted date for display (e.g., "Dec 25, 2024")
    avg_price_cents DECIMAL(10, 2), -- Average price in cents for display
    potential_win_usd DECIMAL(20, 2), -- Potential win amount in USD
    potential_loss_usd DECIMAL(20, 2), -- Potential loss amount in USD (TO LOSE column)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_market_id CHECK (market_id != ''),
    CONSTRAINT valid_tick_range CHECK (lower_tick < upper_tick),
    CONSTRAINT valid_quantity CHECK (CAST(quantity AS DECIMAL) > 0),
    CONSTRAINT valid_cost_basis CHECK (CAST(cost_basis AS DECIMAL) >= 0),
    CONSTRAINT valid_avg_price CHECK (avg_price_cents IS NULL OR avg_price_cents > 0),
    CONSTRAINT valid_potential_win CHECK (potential_win_usd IS NULL OR potential_win_usd >= 0),
    CONSTRAINT valid_potential_loss CHECK (potential_loss_usd IS NULL OR potential_loss_usd >= 0),
    CONSTRAINT valid_claim_state CHECK (
        (is_claimed = false) OR 
        (is_claimed = true AND claimed_at IS NOT NULL)
    )
);

-- =============================================================================
-- USERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    CONSTRAINT valid_address CHECK (address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT valid_username CHECK (username IS NULL OR length(username) >= 3)
);

-- =============================================================================
-- USER PROFILES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) UNIQUE NOT NULL,
    bio TEXT,
    website TEXT,
    twitter VARCHAR(255),
    discord VARCHAR(255),
    telegram VARCHAR(255),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_website CHECK (website IS NULL OR website ~ '^https?://'),
    CONSTRAINT valid_twitter CHECK (twitter IS NULL OR twitter ~ '^@[a-zA-Z0-9_]+$')
);

-- =============================================================================
-- USER STATISTICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) UNIQUE NOT NULL,
    total_positions INTEGER DEFAULT 0,
    total_volume VARCHAR(255) DEFAULT '0',
    total_pnl VARCHAR(255) DEFAULT '0',
    winning_positions INTEGER DEFAULT 0,
    losing_positions INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0.00,
    average_position_size VARCHAR(255) DEFAULT '0',
    first_position_at TIMESTAMPTZ,
    last_position_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_positions CHECK (total_positions >= 0),
    CONSTRAINT valid_winning CHECK (winning_positions >= 0),
    CONSTRAINT valid_losing CHECK (losing_positions >= 0),
    CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100),
    CONSTRAINT valid_volume CHECK (CAST(total_volume AS DECIMAL) >= 0),
    CONSTRAINT valid_pnl CHECK (CAST(total_pnl AS DECIMAL) IS NOT NULL),
    CONSTRAINT valid_position_size CHECK (CAST(average_position_size AS DECIMAL) >= 0)
);

-- =============================================================================
-- MARKET ANALYTICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS market_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id VARCHAR(255) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    total_volume VARCHAR(255) DEFAULT '0',
    total_trades INTEGER DEFAULT 0,
    total_liquidity VARCHAR(255) DEFAULT '0',
    average_price VARCHAR(255) DEFAULT '0',
    highest_price VARCHAR(255) DEFAULT '0',
    lowest_price VARCHAR(255) DEFAULT '0',
    price_change_24h VARCHAR(255) DEFAULT '0',
    volume_24h VARCHAR(255) DEFAULT '0',
    volume_7d VARCHAR(255) DEFAULT '0',
    volume_30d VARCHAR(255) DEFAULT '0',
    unique_users INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_market_id CHECK (market_id != ''),
    CONSTRAINT valid_timeframe CHECK (timeframe IN ('24h', '7d', '30d', '90d', 'all')),
    CONSTRAINT valid_trades CHECK (total_trades >= 0),
    CONSTRAINT valid_users CHECK (unique_users >= 0),
    CONSTRAINT valid_win_rate CHECK (win_rate >= 0 AND win_rate <= 100),
    CONSTRAINT valid_volume CHECK (CAST(total_volume AS DECIMAL) >= 0),
    CONSTRAINT valid_liquidity CHECK (CAST(total_liquidity AS DECIMAL) >= 0),
    CONSTRAINT valid_prices CHECK (
        CAST(average_price AS DECIMAL) >= 0 AND
        CAST(highest_price AS DECIMAL) >= 0 AND
        CAST(lowest_price AS DECIMAL) >= 0
    ),
    UNIQUE(market_id, timeframe)
);

-- =============================================================================
-- TRADES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id VARCHAR(255) UNIQUE NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    market_id VARCHAR(255) NOT NULL,
    position_id VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('OPEN', 'CLOSE', 'INCREASE', 'DECREASE')),
    quantity VARCHAR(255) NOT NULL,
    cost VARCHAR(255) NOT NULL,
    price VARCHAR(255) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_market_id CHECK (market_id != ''),
    CONSTRAINT valid_position_id CHECK (position_id != ''),
    CONSTRAINT valid_quantity CHECK (CAST(quantity AS DECIMAL) > 0),
    CONSTRAINT valid_cost CHECK (CAST(cost AS DECIMAL) >= 0),
    CONSTRAINT valid_price CHECK (CAST(price AS DECIMAL) >= 0),
    CONSTRAINT valid_tx_hash CHECK (transaction_hash ~ '^0x[a-fA-F0-9]{64}$'),
    CONSTRAINT valid_block_number CHECK (block_number > 0)
);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('POSITION_UPDATE', 'MARKET_UPDATE', 'SYSTEM', 'REWARD')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_title CHECK (length(title) > 0),
    CONSTRAINT valid_message CHECK (length(message) > 0),
    CONSTRAINT valid_read_state CHECK (
        (is_read = false AND read_at IS NULL) OR
        (is_read = true AND read_at IS NOT NULL)
    )
);

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_user_address CHECK (user_address IS NULL OR user_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_action CHECK (length(action) > 0),
    CONSTRAINT valid_resource_type CHECK (length(resource_type) > 0)
);

-- =============================================================================
-- PREDICTION ANALYTICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS prediction_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    market_id VARCHAR(255) NOT NULL,
    position_id VARCHAR(255) NOT NULL,
    -- Price range data
    price_min DECIMAL(10, 2) NOT NULL,
    price_max DECIMAL(10, 2) NOT NULL,
    avg_price_cents DECIMAL(10, 2) NOT NULL,
    -- Betting data
    bet_amount_usd DECIMAL(20, 2) NOT NULL,
    potential_win_usd DECIMAL(20, 2) NOT NULL,
    potential_loss_usd DECIMAL(20, 2) NOT NULL,
    -- Status and timing
    status VARCHAR(10) DEFAULT 'live' CHECK (status IN ('live', 'ended')),
    date_label VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_user_address CHECK (user_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_market_id CHECK (market_id != ''),
    CONSTRAINT valid_position_id CHECK (position_id != ''),
    CONSTRAINT valid_price_range CHECK (price_min < price_max),
    CONSTRAINT valid_avg_price CHECK (avg_price_cents > 0),
    CONSTRAINT valid_bet_amount CHECK (bet_amount_usd > 0),
    CONSTRAINT valid_potential_win CHECK (potential_win_usd >= 0),
    CONSTRAINT valid_potential_loss CHECK (potential_loss_usd >= 0),
    CONSTRAINT valid_date_label CHECK (length(date_label) > 0)
);

-- =============================================================================
-- SYSTEM CONFIG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_key CHECK (length(key) > 0)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Markets indexes
CREATE INDEX IF NOT EXISTS idx_markets_market_id ON markets(market_id);
CREATE INDEX IF NOT EXISTS idx_markets_is_active ON markets(is_active);
CREATE INDEX IF NOT EXISTS idx_markets_is_settled ON markets(is_settled);
CREATE INDEX IF NOT EXISTS idx_markets_created_by ON markets(created_by);
CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(created_at);
CREATE INDEX IF NOT EXISTS idx_markets_start_timestamp ON markets(start_timestamp);
CREATE INDEX IF NOT EXISTS idx_markets_end_timestamp ON markets(end_timestamp);

-- Positions indexes
CREATE INDEX IF NOT EXISTS idx_positions_position_id ON positions(position_id);
CREATE INDEX IF NOT EXISTS idx_positions_user_address ON positions(user_address);
CREATE INDEX IF NOT EXISTS idx_positions_market_id ON positions(market_id);
CREATE INDEX IF NOT EXISTS idx_positions_outcome ON positions(outcome);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON positions(is_active);
CREATE INDEX IF NOT EXISTS idx_positions_is_claimed ON positions(is_claimed);
CREATE INDEX IF NOT EXISTS idx_positions_created_at ON positions(created_at);
CREATE INDEX IF NOT EXISTS idx_positions_user_market ON positions(user_address, market_id);
-- New indexes for UI fields
CREATE INDEX IF NOT EXISTS idx_positions_date_label ON positions(date_label);
CREATE INDEX IF NOT EXISTS idx_positions_avg_price_cents ON positions(avg_price_cents);
CREATE INDEX IF NOT EXISTS idx_positions_potential_win ON positions(potential_win_usd);
CREATE INDEX IF NOT EXISTS idx_positions_potential_loss ON positions(potential_loss_usd);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_address ON user_profiles(user_address);

-- User stats indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_user_address ON user_stats(user_address);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_pnl ON user_stats(total_pnl);
CREATE INDEX IF NOT EXISTS idx_user_stats_win_rate ON user_stats(win_rate);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_volume ON user_stats(total_volume);

-- Market analytics indexes
CREATE INDEX IF NOT EXISTS idx_market_analytics_market_id ON market_analytics(market_id);
CREATE INDEX IF NOT EXISTS idx_market_analytics_timeframe ON market_analytics(timeframe);
CREATE INDEX IF NOT EXISTS idx_market_analytics_market_timeframe ON market_analytics(market_id, timeframe);

-- Trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_trade_id ON trades(trade_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_address ON trades(user_address);
CREATE INDEX IF NOT EXISTS idx_trades_market_id ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_position_id ON trades(position_id);
CREATE INDEX IF NOT EXISTS idx_trades_type ON trades(type);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);
CREATE INDEX IF NOT EXISTS idx_trades_transaction_hash ON trades(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_trades_block_number ON trades(block_number);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_address ON notifications(user_address);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_address ON audit_logs(user_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- System config indexes
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Prediction analytics indexes
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_user_address ON prediction_analytics(user_address);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_market_id ON prediction_analytics(market_id);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_position_id ON prediction_analytics(position_id);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_status ON prediction_analytics(status);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_date_label ON prediction_analytics(date_label);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_created_at ON prediction_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_prediction_analytics_user_market ON prediction_analytics(user_address, market_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables with updated_at column
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_analytics_updated_at BEFORE UPDATE ON market_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prediction_analytics_updated_at BEFORE UPDATE ON prediction_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to markets and positions
CREATE POLICY "Public read access to markets" ON markets FOR SELECT USING (true);
CREATE POLICY "Public read access to positions" ON positions FOR SELECT USING (true);
CREATE POLICY "Public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access to user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Public read access to user_stats" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Public read access to market_analytics" ON market_analytics FOR SELECT USING (true);
CREATE POLICY "Public read access to prediction_analytics" ON prediction_analytics FOR SELECT USING (true);
CREATE POLICY "Public read access to trades" ON trades FOR SELECT USING (true);

-- Create policies for authenticated users
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for notifications (users can only see their own)
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_address = auth.jwt() ->> 'sub');

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
('app_version', '"1.0.0"', 'Current application version'),
('min_position_size', '"1000000000000000000"', 'Minimum position size in wei'),
('max_position_size', '"1000000000000000000000000"', 'Maximum position size in wei'),
('default_market_duration', '604800', 'Default market duration in seconds (7 days)'),
('fee_percentage', '250', 'Platform fee in basis points (2.5%)'),
('maintenance_mode', 'false', 'Whether the platform is in maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get user portfolio summary
CREATE OR REPLACE FUNCTION get_user_portfolio(user_addr VARCHAR(42))
RETURNS TABLE (
    total_positions BIGINT,
    open_positions BIGINT,
    won_positions BIGINT,
    lost_positions BIGINT,
    total_volume DECIMAL,
    total_pnl DECIMAL,
    win_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_positions,
        COUNT(*) FILTER (WHERE outcome = 'OPEN') as open_positions,
        COUNT(*) FILTER (WHERE outcome = 'WIN') as won_positions,
        COUNT(*) FILTER (WHERE outcome = 'LOSS') as lost_positions,
        COALESCE(SUM(CAST(cost_basis AS DECIMAL)), 0) as total_volume,
        COALESCE(SUM(CASE 
            WHEN outcome = 'WIN' THEN CAST(quantity AS DECIMAL) - CAST(cost_basis AS DECIMAL)
            WHEN outcome = 'LOSS' THEN -CAST(cost_basis AS DECIMAL)
            ELSE 0
        END), 0) as total_pnl,
        CASE 
            WHEN COUNT(*) FILTER (WHERE outcome IN ('WIN', 'LOSS')) > 0 
            THEN (COUNT(*) FILTER (WHERE outcome = 'WIN')::DECIMAL / COUNT(*) FILTER (WHERE outcome IN ('WIN', 'LOSS'))) * 100
            ELSE 0
        END as win_rate
    FROM positions 
    WHERE user_address = user_addr;
END;
$$ LANGUAGE plpgsql;

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_stats(user_addr VARCHAR(42))
RETURNS VOID AS $$
DECLARE
    portfolio_stats RECORD;
BEGIN
    SELECT * INTO portfolio_stats FROM get_user_portfolio(user_addr);
    
    INSERT INTO user_stats (
        user_address,
        total_positions,
        total_volume,
        total_pnl,
        winning_positions,
        losing_positions,
        win_rate,
        average_position_size,
        first_position_at,
        last_position_at
    ) VALUES (
        user_addr,
        portfolio_stats.total_positions,
        portfolio_stats.total_volume::TEXT,
        portfolio_stats.total_pnl::TEXT,
        portfolio_stats.won_positions,
        portfolio_stats.lost_positions,
        portfolio_stats.win_rate,
        CASE 
            WHEN portfolio_stats.total_positions > 0 
            THEN (portfolio_stats.total_volume / portfolio_stats.total_positions)::TEXT
            ELSE '0'
        END,
        (SELECT MIN(created_at) FROM positions WHERE user_address = user_addr),
        (SELECT MAX(created_at) FROM positions WHERE user_address = user_addr)
    )
    ON CONFLICT (user_address) DO UPDATE SET
        total_positions = EXCLUDED.total_positions,
        total_volume = EXCLUDED.total_volume,
        total_pnl = EXCLUDED.total_pnl,
        winning_positions = EXCLUDED.winning_positions,
        losing_positions = EXCLUDED.losing_positions,
        win_rate = EXCLUDED.win_rate,
        average_position_size = EXCLUDED.average_position_size,
        first_position_at = EXCLUDED.first_position_at,
        last_position_at = EXCLUDED.last_position_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to populate UI fields for positions
CREATE OR REPLACE FUNCTION populate_position_ui_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate average price in cents
    NEW.avg_price_cents := (NEW.lower_tick + NEW.upper_tick) / 2.0;
    
    -- Format date label for display
    NEW.date_label := TO_CHAR(NEW.created_at, 'Mon DD, YYYY');
    
    -- Calculate potential win/loss (simplified calculation)
    -- In a real implementation, this would use the CLMSR formula
    DECLARE
        bet_amount DECIMAL := CAST(NEW.cost_basis AS DECIMAL);
        avg_price DECIMAL := NEW.avg_price_cents;
        odds DECIMAL := GREATEST(0.5, 100.0 / GREATEST(1, avg_price));
    BEGIN
        NEW.potential_win_usd := bet_amount * odds;
        NEW.potential_loss_usd := bet_amount;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to populate UI fields when position is created
CREATE TRIGGER populate_position_ui_fields_trigger
    BEFORE INSERT ON positions
    FOR EACH ROW
    EXECUTE FUNCTION populate_position_ui_fields();

-- =============================================================================
-- COMPLETION
-- =============================================================================

-- Log completion
INSERT INTO audit_logs (action, resource_type, resource_id) 
VALUES ('MIGRATION_COMPLETED', 'SCHEMA', '001_initial_schema');

COMMENT ON SCHEMA public IS 'Pulse-08  Protocol Database Schema - Initial Setup';

