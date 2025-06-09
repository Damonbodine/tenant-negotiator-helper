#!/usr/bin/env node

/**
 * Setup prediction database tables
 * Runs the migration SQL to create all prediction-related tables
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_CONFIG = {
  url: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzIwMjMwOCwiZXhwIjoyMDU4Nzc4MzA4fQ.h5Oy_qEZz6c-Y9AeSMHUgLBT-CQhwNvzCdh6lmMoVhk'
};

async function setupTables() {
  console.log('🔧 Setting up prediction database tables...');
  
  const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceKey);
  
  // Read the migration SQL
  const migrationSQL = fs.readFileSync('./supabase/migrations/20250106000001_rent_prediction_schema.sql', 'utf8');
  
  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try executing each statement separately
      console.log('🔄 Trying individual statements...');
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
          if (stmtError) {
            console.log(`⚠️ Statement failed: ${statement.substring(0, 50)}...`);
            console.log(`   Error: ${stmtError.message}`);
          } else {
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
          }
        } catch (e) {
          console.log(`⚠️ Exception: ${e.message}`);
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }
    
    // Test table creation
    console.log('\n🧪 Testing table creation...');
    
    const tables = [
      'hud_fair_market_rents',
      'zillow_rent_data', 
      'rent_predictions',
      'economic_indicators',
      'user_market_signals'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' not accessible: ${error.message}`);
        } else {
          console.log(`✅ Table '${table}' created successfully`);
        }
      } catch (e) {
        console.log(`❌ Table '${table}' test failed: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run setup
setupTables();