#!/usr/bin/env node

/**
 * Test database connection and permissions
 */

import { createClient } from '@supabase/supabase-js';

// Try both keys to see which one works
const SUPABASE_URL = 'https://izzdyfrcxunfzlfgdjuv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzIwMjMwOCwiZXhwIjoyMDU4Nzc4MzA4fQ.h5Oy_qEZz6c-Y9AeSMHUgLBT-CQhwNvzCdh6lmMoVhk';

async function testConnection(keyName, key) {
  console.log(`\n🔧 Testing ${keyName}...`);
  const supabase = createClient(SUPABASE_URL, key);
  
  try {
    // Test basic access
    const { data, error } = await supabase
      .from('hud_fair_market_rents')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ ${keyName} Error:`, error.message);
      return false;
    } else {
      console.log(`✅ ${keyName} Works - basic access successful`);
      
      // Test insert permission
      const testRecord = {
        fips_code: 'TEST_001',
        county_name: 'Test County',
        state_code: 'XX',
        state_name: 'Test State',
        year: 2025,
        studio_fmr: 500,
        one_br_fmr: 600,
        two_br_fmr: 700,
        three_br_fmr: 800,
        four_br_fmr: 900
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('hud_fair_market_rents')
        .insert([testRecord])
        .select();
      
      if (insertError) {
        console.log(`⚠️ ${keyName} Insert Error:`, insertError.message);
        return false;
      } else {
        console.log(`✅ ${keyName} Insert Works`);
        
        // Clean up test record
        await supabase
          .from('hud_fair_market_rents')
          .delete()
          .eq('fips_code', 'TEST_001');
        
        return true;
      }
    }
  } catch (error) {
    console.log(`❌ ${keyName} Exception:`, error.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n📊 Checking if tables exist...');
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  
  const tables = ['hud_fair_market_rents', 'zillow_rent_data', 'rent_predictions'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}':`, error.message);
      } else {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        console.log(`✅ Table '${table}': exists (${count} records)`);
      }
    } catch (error) {
      console.log(`❌ Table '${table}' error:`, error.message);
    }
  }
}

async function main() {
  console.log('🧪 Testing database connection and permissions...');
  
  await checkTables();
  
  const anonWorks = await testConnection('ANON_KEY', ANON_KEY);
  const serviceWorks = await testConnection('SERVICE_KEY', SERVICE_KEY);
  
  console.log('\n📋 SUMMARY:');
  console.log(`- ANON_KEY works: ${anonWorks ? '✅' : '❌'}`);
  console.log(`- SERVICE_KEY works: ${serviceWorks ? '✅' : '❌'}`);
  
  if (serviceWorks) {
    console.log('\n🎯 Use SERVICE_KEY for data insertion');
  } else if (anonWorks) {
    console.log('\n🎯 Use ANON_KEY for data insertion');
  } else {
    console.log('\n❌ Neither key works - check configuration');
  }
}

main().catch(console.error);