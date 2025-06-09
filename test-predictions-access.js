#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://izzdyfrcxunfzlfgdjuv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testAccess() {
  console.log('Testing current access to rent_predictions...');
  
  const { data, error } = await supabase
    .from('rent_predictions')
    .select('*')
    .or('location_name.ilike.%Buffalo%,location_id.ilike.%Buffalo%')
    .eq('prediction_horizon', 12)
    .limit(1);

  console.log('Result:', { 
    hasData: !!data, 
    dataLength: data?.length, 
    error: error?.message 
  });

  if (error) {
    console.log('Full error:', error);
    
    // Check if RLS is the issue
    if (error.message.includes('RLS') || error.message.includes('policy')) {
      console.log('🔧 RLS policy issue detected. The rent_predictions table needs public read access.');
      console.log('💡 This needs to be fixed in the Supabase dashboard by adding a policy like:');
      console.log('   CREATE POLICY "anon_read_predictions" ON rent_predictions FOR SELECT TO anon USING (true);');
    }
  } else if (data && data.length > 0) {
    console.log('✅ Access works! Sample prediction:', {
      location: data[0].location_name,
      current: Math.round(data[0].current_rent),
      predicted: Math.round(data[0].predicted_rent),
      confidence: Math.round(data[0].confidence_score * 100) + '%'
    });
  } else {
    console.log('⚠️ No data found for Buffalo');
  }
}

testAccess().catch(console.error);