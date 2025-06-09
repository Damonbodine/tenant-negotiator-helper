#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://izzdyfrcxunfzlfgdjuv.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzIwMjMwOCwiZXhwIjoyMDU4Nzc4MzA4fQ.h5Oy_qEZz6c-Y9AeSMHUgLBT-CQhwNvzCdh6lmMoVhk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPolicy() {
  console.log('🔧 Fixing RLS policy for rent_predictions...');
  
  try {
    // First check if we can access the table
    const { data: testData, error: testError } = await supabase
      .from('rent_predictions')
      .select('count')
      .limit(1);
      
    console.log('Test access result:', { testError: testError?.message, hasData: !!testData });
    
    if (!testError) {
      console.log('✅ Table is accessible via service role');
      
      // Test if anon key can access
      const anonClient = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M');
      
      const { data: anonData, error: anonError } = await anonClient
        .from('rent_predictions')
        .select('count')
        .limit(1);
        
      console.log('Anon access result:', { anonError: anonError?.message, hasData: !!anonData });
      
      if (anonError) {
        console.log('🔧 Need to fix RLS policy - anon user cannot access');
        
        // Try to run SQL directly
        const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `
            -- Drop existing policies if they exist
            DROP POLICY IF EXISTS "Public read access for rent predictions" ON rent_predictions;
            DROP POLICY IF EXISTS "Service role full access" ON rent_predictions;
            
            -- Enable RLS
            ALTER TABLE rent_predictions ENABLE ROW LEVEL SECURITY;
            
            -- Allow public read access 
            CREATE POLICY "Public read access for rent predictions" ON rent_predictions
            FOR SELECT USING (true);
            
            -- Allow service role full access
            CREATE POLICY "Service role full access" ON rent_predictions 
            FOR ALL USING (auth.role() = 'service_role');
          `
        });
        
        if (sqlError) {
          console.log('⚠️ exec_sql failed, trying alternative approach:', sqlError.message);
          
          // Alternative: Create the policies using raw queries
          const policies = [
            "ALTER TABLE rent_predictions ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY IF NOT EXISTS \"anon_read_rent_predictions\" ON rent_predictions FOR SELECT TO anon USING (true);",
            "CREATE POLICY IF NOT EXISTS \"authenticated_read_rent_predictions\" ON rent_predictions FOR SELECT TO authenticated USING (true);",
            "CREATE POLICY IF NOT EXISTS \"service_role_all_rent_predictions\" ON rent_predictions FOR ALL TO service_role USING (true);"
          ];
          
          for (const policy of policies) {
            try {
              console.log('Executing:', policy);
              const result = await supabase.rpc('exec_sql', { sql: policy });
              console.log('Result:', result.error ? result.error.message : 'success');
            } catch (e) {
              console.log('Failed:', e.message);
            }
          }
        } else {
          console.log('✅ SQL executed successfully');
        }
        
        // Test again after policy changes
        const { data: finalTest, error: finalError } = await anonClient
          .from('rent_predictions')
          .select('count')
          .limit(1);
          
        console.log('Final test result:', { finalError: finalError?.message, hasData: !!finalTest });
        
      } else {
        console.log('✅ Anon user can already access the table');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRLSPolicy().catch(console.error);