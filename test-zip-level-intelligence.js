// Test ZIP-Level Historical Intelligence Pipeline
// Tests the complete data loading → RAG embedding → chat AI integration

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testZipLevelIntelligence() {
  console.log('🧪 Testing ZIP-Level Historical Intelligence Pipeline');
  console.log('==================================================');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Test 1: Check if ZIP-level data is loaded
  console.log('\\n📊 Test 1: ZIP-Level Data Availability');
  console.log('--------------------------------------');
  
  try {
    const { data: zipCount, error: countError } = await supabase
      .from('zip_level_rents')
      .select('count');
    
    if (countError) {
      console.log('⚠️ ZIP-level data table not found - needs to be loaded');
      console.log('💡 Run: node scripts/load-zip-level-data.js');
      console.log('Expected: 7,324 ZIP codes with historical data');
    } else {
      console.log('✅ ZIP-level data table exists');
      console.log(`📈 ZIP codes loaded: ${zipCount?.length || 'Unknown'}`);
    }
    
    // Sample ZIP data check
    const { data: sampleZips, error: sampleError } = await supabase
      .from('zip_level_rents')
      .select('zip_code, city, state_code, latest_rent, yearly_change')
      .not('latest_rent', 'is', null)
      .limit(5);
    
    if (!sampleError && sampleZips) {
      console.log('\\n📍 Sample ZIP Data:');
      sampleZips.forEach(zip => {
        console.log(`  ${zip.zip_code} (${zip.city}, ${zip.state_code}): $${zip.latest_rent?.toLocaleString()} (${zip.yearly_change?.toFixed(1)}% YoY)`);
      });
    }
    
  } catch (error) {
    console.error('❌ ZIP data test failed:', error);
  }
  
  // Test 2: Check location embeddings
  console.log('\\n\\n🧠 Test 2: Location Embeddings');
  console.log('------------------------------');
  
  try {
    const { data: embeddingCount, error: embeddingError } = await supabase
      .from('location_embeddings')
      .select('count');
    
    if (embeddingError) {
      console.log('⚠️ Location embeddings table not found');
      console.log('💡 Location embeddings will be created during data loading');
    } else {
      console.log('✅ Location embeddings table exists');
      console.log(`🔍 Embeddings created: ${embeddingCount?.length || 'Unknown'}`);
    }
    
  } catch (error) {
    console.error('❌ Embedding test failed:', error);
  }
  
  // Test 3: Test location query intelligence
  console.log('\\n\\n🎯 Test 3: Location Query Intelligence');
  console.log('--------------------------------------');
  
  const testQueries = [
    'rents in Austin',
    'Austin rental market trends',
    'ZIP 78701 rent analysis',
    'Houston apartment costs',
    'rent prices in Dallas Texas',
    'Chicago rental market',
    'New York rent trends',
    'What are rents like in Boise?'
  ];
  
  for (const query of testQueries) {
    console.log(`\\n🔍 Testing: "${query}"`);
    
    try {
      // Test the enhanced chat AI with location intelligence
      const { data, error } = await supabase.functions.invoke('chat-ai-enhanced', {
        body: {
          message: query,
          history: [],
          enableToolCalling: true,
          availableTools: ['search_knowledge_base'],
          context: {
            userId: 'test-user',
            chatType: 'market_analysis'
          }
        }
      });
      
      if (error) {
        console.log('❌ Query failed:', error.message);
        continue;
      }
      
      const response = data.text || '';
      const hasLocationData = response.includes('ZIP') || 
                             response.includes('historical') || 
                             response.includes('trend') ||
                             response.includes('$');
      
      console.log(`  📊 Response length: ${response.length} chars`);
      console.log(`  🎯 Contains location intelligence: ${hasLocationData ? '✅' : '❌'}`);
      
      if (hasLocationData) {
        const preview = response.substring(0, 200) + (response.length > 200 ? '...' : '');
        console.log(`  📝 Preview: ${preview}`);
        
        // Check for specific intelligence markers
        const intelligenceMarkers = {
          zipCode: /ZIP \\d{5}/.test(response),
          rentAmount: /\\$[\\d,]+/.test(response),
          percentageChange: /\\d+(\\.\\d+)?%/.test(response),
          historicalReference: /(historical|trend|annual|yearly|monthly)/.test(response.toLowerCase())
        };
        
        console.log('  🧠 Intelligence Detected:');
        Object.entries(intelligenceMarkers).forEach(([key, detected]) => {
          console.log(`    ${key}: ${detected ? '✅' : '❌'}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Test query failed:', error.message);
    }
  }
  
  // Test 4: Historical trend analysis
  console.log('\\n\\n📈 Test 4: Historical Trend Analysis');
  console.log('------------------------------------');
  
  const specificLocationTests = [
    { zip: '78701', city: 'Austin', state: 'TX' },
    { zip: '77449', city: 'Katy', state: 'TX' },
    { zip: '60601', city: 'Chicago', state: 'IL' }
  ];
  
  for (const location of specificLocationTests) {
    console.log(`\\n📍 Testing ${location.city}, ${location.state} (${location.zip})`);
    
    try {
      // Test specific ZIP lookup
      const { data: zipData, error: zipError } = await supabase
        .from('zip_level_rents')
        .select('*')
        .eq('zip_code', location.zip)
        .single();
      
      if (zipError) {
        console.log(`  ⚠️ ZIP ${location.zip} not found in database`);
      } else {
        console.log(`  ✅ ZIP ${location.zip} data available`);
        console.log(`  💰 Current rent: $${zipData.latest_rent?.toLocaleString()}`);
        console.log(`  📊 Annual change: ${zipData.yearly_change?.toFixed(1)}%`);
        console.log(`  📅 Data range: ${zipData.data_start_date} to ${zipData.data_end_date}`);
        
        // Check historical data richness
        const rentDataPoints = zipData.rent_data ? Object.keys(zipData.rent_data).length : 0;
        console.log(`  📈 Historical data points: ${rentDataPoints}`);
        
        if (rentDataPoints >= 100) {
          console.log('  🏆 Excellent historical coverage (10+ years)');
        } else if (rentDataPoints >= 50) {
          console.log('  ✅ Good historical coverage (4+ years)');
        } else {
          console.log('  ⚠️ Limited historical coverage');
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing ${location.zip}:`, error.message);
    }
  }
  
  // Test 5: Real vs Synthetic Intelligence
  console.log('\\n\\n🎭 Test 5: Real vs Synthetic Intelligence Comparison');
  console.log('--------------------------------------------------');
  
  const comparisonQuery = "What's the rental market like in Austin?";
  
  console.log(`🔍 Query: "${comparisonQuery}"`);
  console.log('\\n📊 Expected Intelligence Types:');
  console.log('  Real Historical: "Austin ZIP 78701 rents increased 4.2% annually"');
  console.log('  Synthetic: "Austin is a strong rental market"');
  console.log('  Fake Precision: "73% success rate for negotiations"');
  
  try {
    const { data, error } = await supabase.functions.invoke('chat-ai-enhanced', {
      body: {
        message: comparisonQuery,
        history: [],
        enableToolCalling: true,
        availableTools: ['search_knowledge_base', 'get_market_data'],
        context: {
          userId: 'test-user',
          chatType: 'market_analysis'
        }
      }
    });
    
    if (!error && data.text) {
      const response = data.text;
      
      // Analyze intelligence quality
      const qualityMetrics = {
        hasSpecificNumbers: /\\$[\\d,]+/.test(response),
        hasPercentages: /\\d+(\\.\\d+)?%/.test(response),
        hasZIPCodes: /ZIP \\d{5}/.test(response) || /\\d{5}/.test(response),
        hasTimeReferences: /(annual|yearly|monthly|historical|trend)/.test(response.toLowerCase()),
        hasFakePrecision: /(\\d{2,3}% success rate|exactly \\d+%)/.test(response),
        usesRealData: /(ZORI|HUD|census|historical data|ZIP-level)/.test(response.toLowerCase())
      };
      
      console.log('\\n🔍 Intelligence Quality Analysis:');
      Object.entries(qualityMetrics).forEach(([metric, detected]) => {
        const icon = detected ? '✅' : '❌';
        const status = metric === 'hasFakePrecision' ? (detected ? '❌ (bad)' : '✅ (good)') : icon;
        console.log(`  ${metric}: ${status}`);
      });
      
      // Overall assessment
      const realDataScore = Object.entries(qualityMetrics)
        .filter(([key, value]) => key !== 'hasFakePrecision' && value)
        .length;
      
      const hasFakePrecision = qualityMetrics.hasFakePrecision;
      
      console.log('\\n🏆 Overall Assessment:');
      if (realDataScore >= 4 && !hasFakePrecision) {
        console.log('  🌟 EXCELLENT: High-quality real intelligence');
      } else if (realDataScore >= 2 && !hasFakePrecision) {
        console.log('  ✅ GOOD: Decent intelligence with room for improvement');
      } else if (hasFakePrecision) {
        console.log('  ⚠️ WARNING: Contains fake precision - avoid specific success rates');
      } else {
        console.log('  ❌ POOR: Limited intelligence, mostly generic responses');
      }
      
    } else {
      console.log('❌ Comparison test failed:', error?.message);
    }
    
  } catch (error) {
    console.error('❌ Comparison test error:', error);
  }
  
  // Summary
  console.log('\\n\\n🎯 ZIP-Level Intelligence Test Summary');
  console.log('======================================');
  
  console.log('\\n📋 Implementation Checklist:');
  console.log('□ Load 7,324 ZIP codes into Supabase (scripts/load-zip-level-data.js)');
  console.log('□ Create location embeddings for semantic search');
  console.log('□ Deploy enhanced SQL functions for historical analysis');
  console.log('□ Test location query detection in chat AI');
  console.log('□ Verify real historical data vs synthetic responses');
  
  console.log('\\n🚀 Expected Results After Full Implementation:');
  console.log('• "Rents in Austin" → Real ZIP-level historical trends');
  console.log('• "78701 market analysis" → Specific neighborhood intelligence');
  console.log('• "Houston vs Dallas rents" → Comparative historical analysis');
  console.log('• 10+ years of monthly trend data for negotiation context');
  
  console.log('\\n💡 Next Steps:');
  console.log('1. Run data loading script: node scripts/load-zip-level-data.js');
  console.log('2. Deploy SQL functions: execute scripts/enhanced-location-rag.sql');
  console.log('3. Test with real user queries');
  console.log('4. Monitor for location detection accuracy');
  
  console.log('\\n✅ This system will provide REAL historical intelligence instead of synthetic predictions!');
}

// Run the test
testZipLevelIntelligence().catch(console.error);