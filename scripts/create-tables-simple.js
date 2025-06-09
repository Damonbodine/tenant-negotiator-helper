#!/usr/bin/env node

/**
 * Simple table creation for prediction system
 * Creates essential tables one by one
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M'
);

async function createTables() {
  console.log('🔧 Creating prediction tables...');
  
  // Create HUD Fair Market Rent table
  console.log('📊 Creating hud_fair_market_rents table...');
  const hudSQL = `
    CREATE TABLE IF NOT EXISTS hud_fair_market_rents (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      fips_code TEXT NOT NULL,
      county_name TEXT NOT NULL,
      state_code TEXT NOT NULL,
      state_name TEXT,
      year INTEGER NOT NULL,
      studio_fmr DECIMAL(10,2),
      one_br_fmr DECIMAL(10,2),
      two_br_fmr DECIMAL(10,2),
      three_br_fmr DECIMAL(10,2),
      four_br_fmr DECIMAL(10,2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(fips_code, year)
    );
  `;
  
  try {
    const { error } = await supabase.rpc('exec', { sql: hudSQL });
    if (error) {
      console.log('❌ HUD table creation failed:', error.message);
    } else {
      console.log('✅ HUD table created');
    }
  } catch (e) {
    console.log('❌ HUD table error:', e.message);
  }

  // Create Zillow rent data table
  console.log('📊 Creating zillow_rent_data table...');
  const zillowSQL = `
    CREATE TABLE IF NOT EXISTS zillow_rent_data (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      metro_area TEXT NOT NULL,
      state_code TEXT NOT NULL,
      report_date DATE NOT NULL,
      median_rent DECIMAL(10,2),
      month_over_month_change DECIMAL(5,2),
      year_over_year_change DECIMAL(5,2),
      inventory_count INTEGER,
      days_on_market DECIMAL(5,1),
      price_per_sqft DECIMAL(8,2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(metro_area, report_date)
    );
  `;
  
  try {
    const { error } = await supabase.rpc('exec', { sql: zillowSQL });
    if (error) {
      console.log('❌ Zillow table creation failed:', error.message);
    } else {
      console.log('✅ Zillow table created');
    }
  } catch (e) {
    console.log('❌ Zillow table error:', e.message);
  }

  // Create rent predictions table
  console.log('📊 Creating rent_predictions table...');
  const predictionsSQL = `
    CREATE TABLE IF NOT EXISTS rent_predictions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      location_id TEXT NOT NULL,
      location_type TEXT NOT NULL,
      location_name TEXT NOT NULL,
      prediction_date DATE NOT NULL,
      prediction_horizon INTEGER NOT NULL,
      data_sources TEXT[] NOT NULL,
      current_rent DECIMAL(10,2),
      predicted_rent DECIMAL(10,2),
      predicted_change_percent DECIMAL(5,2),
      confidence_score DECIMAL(3,2),
      lower_bound DECIMAL(10,2),
      upper_bound DECIMAL(10,2),
      contributing_factors JSONB,
      market_cycle_stage TEXT,
      model_version TEXT DEFAULT 'v1.0',
      model_accuracy DECIMAL(5,2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(location_id, prediction_date, prediction_horizon)
    );
  `;
  
  try {
    const { error } = await supabase.rpc('exec', { sql: predictionsSQL });
    if (error) {
      console.log('❌ Predictions table creation failed:', error.message);
    } else {
      console.log('✅ Predictions table created');
    }
  } catch (e) {
    console.log('❌ Predictions table error:', e.message);
  }

  // Test all tables
  console.log('\n🧪 Testing table access...');
  const tables = ['hud_fair_market_rents', 'zillow_rent_data', 'rent_predictions'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: accessible`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
  
  console.log('\n🎯 Ready to populate data!');
}

createTables();