// Test Enhanced Market Data System
// Tests the new multi-source analysis vs old hardcoded values

const { supabase } = require('./src/integrations/supabase/client.ts');

async function testEnhancedMarketData() {
  console.log('🧪 Testing Enhanced Market Data System');
  console.log('=====================================');
  
  const testCases = [
    { 
      message: "What's the market like for a 2BR apartment in Austin, TX?",
      expected: "Should return REAL Austin data (HUD + ZORI + Census + BLS)"
    },
    {
      message: "Is $2,500 fair for a 2BR in Chicago?",
      expected: "Should analyze using actual percentile data, not hardcoded values"
    },
    {
      message: "I'm looking at a property in Houston for $1,800. How does that compare?",
      expected: "Should provide multi-source validation with confidence scoring"
    }
  ];
  
  for (const testCase of testCases) {
    console.log('\n🔍 Testing:', testCase.message);
    console.log('Expected:', testCase.expected);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai-enhanced', {
        body: { 
          message: testCase.message,
          history: [],
          systemPrompt: 'You are a rental negotiation expert. Use available tools to provide data-driven analysis.',
          context: {
            userId: 'test-user',
            chatType: 'market_analysis',
            propertyContext: null
          }
        },
      });

      if (error) {
        console.error('❌ Error:', error);
        continue;
      }

      console.log('✅ Response received');
      
      // Check if response contains real data indicators
      const responseText = data.text || '';
      const hasRealData = responseText.includes('HUD') || 
                         responseText.includes('ZORI') || 
                         responseText.includes('Census') ||
                         responseText.includes('percentile') ||
                         responseText.includes('confidence');
      
      const hasHardcodedData = responseText.includes('$2,400') && 
                              responseText.includes('$2,350');
      
      console.log('📊 Analysis Results:');
      console.log('  - Contains real data sources:', hasRealData ? '✅' : '❌');
      console.log('  - Contains hardcoded values:', hasHardcodedData ? '❌ (bad)' : '✅ (good)');
      console.log('  - Response length:', responseText.length, 'chars');
      
      // Show a sample of the response
      if (responseText.length > 200) {
        console.log('📝 Sample response:', responseText.substring(0, 200) + '...');
      } else {
        console.log('📝 Full response:', responseText);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }
  
  console.log('\n🏁 Enhanced Market Data Test Complete');
  console.log('=====================================');
  
  // Test RAG population status
  console.log('\n🔍 Checking RAG Population Status...');
  
  try {
    const { data: chunks, error: ragError } = await supabase
      .from('document_chunks')
      .select('id, metadata')
      .not('content', 'is', null)
      .limit(10);

    if (ragError) {
      console.error('❌ RAG query error:', ragError);
    } else {
      console.log(`📚 Total RAG chunks available: ${chunks?.length || 0}`);
      
      if (chunks && chunks.length > 0) {
        const locationChunks = chunks.filter(chunk => 
          chunk.metadata?.city || 
          chunk.metadata?.location_keywords ||
          chunk.metadata?.area_name
        );
        
        console.log(`📍 Location-aware chunks: ${locationChunks.length}/${chunks.length}`);
        
        if (locationChunks.length > 0) {
          console.log('📋 Sample locations found:');
          locationChunks.slice(0, 3).forEach(chunk => {
            const location = chunk.metadata?.city || 
                           chunk.metadata?.area_name || 
                           'Unknown';
            const state = chunk.metadata?.state || '';
            console.log(`  - ${location}${state ? ', ' + state : ''}`);
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ RAG status check failed:', error);
  }
  
  // Test Census API (verify your key works)
  console.log('\n🏛️ Testing Census API with your key...');
  
  try {
    const censusApiKey = '6047d2393fe6ae5a6e0fd92a4d1fde8175f27b8a';
    const url = `https://api.census.gov/data/2022/acs/acs1?get=B19013_001E,B25064_001E&for=state:48&key=${censusApiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 1) {
      const values = data[1];
      const medianIncome = parseInt(values[0]);
      const medianRent = parseInt(values[1]);
      
      console.log('✅ Census API working:');
      console.log(`  - Texas Median Income: $${medianIncome?.toLocaleString()}`);
      console.log(`  - Texas Median Rent: $${medianRent?.toLocaleString()}`);
    } else {
      console.log('⚠️ Census API returned unexpected data:', data);
    }
  } catch (error) {
    console.error('❌ Census API test failed:', error);
  }
  
  // Test BLS API
  console.log('\n📊 Testing BLS CPI Rent Data...');
  
  try {
    const url = 'https://api.bls.gov/publicAPI/v1/timeseries/data/CUUR0000SEHA?startyear=2024&endyear=2025';
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'REQUEST_SUCCEEDED' && data.Results.series[0].data.length > 0) {
      const latest = data.Results.series[0].data[0];
      console.log('✅ BLS API working:');
      console.log(`  - Latest CPI Rent Index: ${latest.value} (${latest.year}-${latest.period})`);
    } else {
      console.log('⚠️ BLS API returned:', data.status);
    }
  } catch (error) {
    console.error('❌ BLS API test failed:', error);
  }
}

// Run the test
testEnhancedMarketData().catch(console.error);