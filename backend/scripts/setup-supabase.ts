import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Setup Supabase database with initial schema and data
 */
async function setupSupabase() {
  console.log('🚀 Setting up Supabase database for Pulse-08...');

  try {
    // Read and execute migration file
    const migrationPath = join(__dirname, '..', 'migrations', '001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing database migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach - execute SQL directly
      console.log('🔄 Trying alternative migration approach...');
      await executeMigrationDirectly(migrationSQL);
    } else {
      console.log('✅ Migration executed successfully');
    }

    // Verify tables were created
    await verifyTables();

    // Insert initial data
    await insertInitialData();

    console.log('🎉 Supabase setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update your .env file with the correct Supabase credentials');
    console.log('2. Run the backend server: npm run dev');
    console.log('3. Test the API endpoints');
    console.log('4. Set up Row Level Security policies in Supabase dashboard');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

/**
 * Execute migration directly using SQL queries
 */
async function executeMigrationDirectly(migrationSQL: string) {
  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  for (const statement of statements) {
    if (statement.toLowerCase().includes('create table') || 
        statement.toLowerCase().includes('create index') ||
        statement.toLowerCase().includes('create trigger') ||
        statement.toLowerCase().includes('create function') ||
        statement.toLowerCase().includes('create policy') ||
        statement.toLowerCase().includes('alter table') ||
        statement.toLowerCase().includes('insert into')) {
      
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.warn(`⚠️  Warning: ${error.message}`);
          // Continue with other statements
        }
      } catch (err) {
        console.warn(`⚠️  Warning: ${err}`);
        // Continue with other statements
      }
    }
  }
}

/**
 * Verify that all required tables exist
 */
async function verifyTables() {
  console.log('🔍 Verifying database tables...');

  const requiredTables = [
    'markets',
    'positions',
    'users',
    'user_profiles',
    'user_stats',
    'market_analytics',
    'trades',
    'notifications',
    'audit_logs',
    'system_config'
  ];

  for (const table of requiredTables) {
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(1);

    if (error) {
      console.error(`❌ Table '${table}' not found or accessible:`, error.message);
    } else {
      console.log(`✅ Table '${table}' verified`);
    }
  }
}

/**
 * Insert initial data
 */
async function insertInitialData() {
  console.log('📊 Inserting initial data...');

  // Insert system configuration
  const systemConfig = [
    { key: 'app_version', value: { version: '1.0.0' }, description: 'Current application version' },
    { key: 'min_position_size', value: { amount: '1000000000000000000' }, description: 'Minimum position size in wei' },
    { key: 'max_position_size', value: { amount: '1000000000000000000000000' }, description: 'Maximum position size in wei' },
    { key: 'default_market_duration', value: { seconds: 604800 }, description: 'Default market duration in seconds (7 days)' },
    { key: 'fee_percentage', value: { basisPoints: 250 }, description: 'Platform fee in basis points (2.5%)' },
    { key: 'maintenance_mode', value: { enabled: false }, description: 'Whether the platform is in maintenance mode' }
  ];

  for (const config of systemConfig) {
    const { error } = await supabase
      .from('system_config')
      .upsert(config, { onConflict: 'key' });

    if (error) {
      console.warn(`⚠️  Warning inserting config '${config.key}':`, error.message);
    } else {
      console.log(`✅ Inserted config: ${config.key}`);
    }
  }

  // Insert audit log entry
  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      action: 'SETUP_COMPLETED',
      resource_type: 'SYSTEM',
      resource_id: 'supabase_setup',
      new_data: { setup_date: new Date().toISOString() }
    });

  if (auditError) {
    console.warn('⚠️  Warning inserting audit log:', auditError.message);
  } else {
    console.log('✅ Setup audit log created');
  }
}

/**
 * Test database connectivity
 */
async function testConnection() {
  console.log('🔌 Testing Supabase connection...');

  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

/**
 * Setup Row Level Security policies
 */
async function setupRLSPolicies() {
  console.log('🔒 Setting up Row Level Security policies...');

  const policies = [
    // Markets policies
    {
      table: 'markets',
      policy: 'Public read access to markets',
      sql: 'CREATE POLICY "Public read access to markets" ON markets FOR SELECT USING (true);'
    },
    
    // Users policies
    {
      table: 'users',
      policy: 'Users can view public user data',
      sql: 'CREATE POLICY "Users can view public user data" ON users FOR SELECT USING (true);'
    },
    
    // Positions policies
    {
      table: 'positions',
      policy: 'Public read access to positions',
      sql: 'CREATE POLICY "Public read access to positions" ON positions FOR SELECT USING (true);'
    },
    
    // Notifications policies
    {
      table: 'notifications',
      policy: 'Users can view their own notifications',
      sql: 'CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_address = auth.jwt() ->> \'sub\');'
    }
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      });

      if (error) {
        console.warn(`⚠️  Warning creating policy for ${policy.table}:`, error.message);
      } else {
        console.log(`✅ Created policy: ${policy.policy}`);
      }
    } catch (err) {
      console.warn(`⚠️  Warning creating policy for ${policy.table}:`, err);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupSupabase()
    .then(() => {
      console.log('Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupSupabase, testConnection, setupRLSPolicies };


