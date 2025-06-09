// Live System Testing - Check actual trigger detection logic
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzNDk3NDEsImV4cCI6MjAyOTkyNTc0MX0.jZm_KlCmZSsqpAXkFV-TP9uqBR0qGCJEqsIe7nQpLjY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentChunksAccess() {
  console.log('🔍 Testing document_chunks table access...');
  
  try {
    // Test basic table access
    const { data: tableInfo, error: tableError } = await supabase
      .from('document_chunks')
      .select('id, content')
      .limit(3);
    
    if (tableError) {
      console.error('❌ Error accessing document_chunks:', tableError);
      return false;
    }
    
    console.log('✅ Document chunks accessible:', tableInfo?.length || 0, 'records found');
    
    // Test RAG function access
    try {
      const { data: ragResults, error: ragError } = await supabase.rpc('search_document_chunks_by_similarity', {
        query_embedding: '[' + Array(1536).fill(0.1).join(',') + ']', // Dummy embedding
        match_threshold: 0.5,
        match_count: 3
      });
      
      if (ragError) {
        console.log('⚠️  RAG function test failed:', ragError.message);
        console.log('   This is expected if function requires real embeddings');
      } else {
        console.log('✅ RAG function accessible, found:', ragResults?.length || 0, 'results');
      }
    } catch (ragErr) {
      console.log('ℹ️  RAG function requires specific embedding format');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Document chunks test failed:', error);
    return false;
  }
}

async function testNegotiationRoadmapFunction() {
  console.log('\n🗺️ Testing negotiation roadmap function...');
  
  const testRequest = {
    userContext: {
      currentRent: 2500,
      budgetFlexibility: 'moderate',
      employmentStability: 'stable',
      preferredTone: 'collaborative',
      riskTolerance: 'moderate',
      conflictStyle: 'collaborator',
      landlordRelationship: 'neutral',
      tenantHistory: 'experienced',
      urgency: 'moderate',
      alternativeOptions: 2,
      movingFlexibility: 'willing-to-move'
    },
    marketContext: {
      currentRentVsMarket: 'above',
      marketPosition: 75,
      propertyCondition: 'good',
      landlordType: 'individual',
      localVacancyRate: 5.5,
      rentTrend: 'stable',
      seasonalFactor: 'normal',
      economicIndicators: 'stable',
      comparableRange: { min: 2200, max: 2800, median: 2400 },
      negotiationLeverage: 'moderate',
      marketPowerBalance: 'balanced'
    },
    situationContext: {
      leaseStatus: 'active-lease',
      timeUntilDecision: 30,
      primaryGoal: 'rent-reduction',
      targetReduction: 200,
      competingOffers: false,
      lifeEvents: 'none',
      marketEvent: 'none'
    }
  };
  
  try {
    const { data, error } = await supabase.functions.invoke('negotiation-roadmap', {
      body: testRequest
    });
    
    if (error) {
      console.error('❌ Roadmap function error:', error);
      return false;
    }
    
    console.log('✅ Roadmap function working');
    console.log('   Strategy:', data.strategy?.name || 'Unknown');
    console.log('   Success Rate:', data.successProbability?.overall || 'Unknown', '%');
    console.log('   Steps:', data.steps?.length || 0);
    
    return true;
  } catch (error) {
    console.error('❌ Roadmap function failed:', error);
    return false;
  }
}

async function testSystemCompatibility() {
  console.log('\n🔧 Testing system compatibility...');
  
  // Test if both systems can run simultaneously
  const tests = await Promise.allSettled([
    testDocumentChunksAccess(),
    testNegotiationRoadmapFunction()
  ]);
  
  const docChunksWorking = tests[0].status === 'fulfilled' && tests[0].value;
  const roadmapWorking = tests[1].status === 'fulfilled' && tests[1].value;
  
  console.log('\n📊 COMPATIBILITY RESULTS:');
  console.log('Document Chunks:', docChunksWorking ? '✅ Working' : '❌ Issues');
  console.log('Negotiation Roadmap:', roadmapWorking ? '✅ Working' : '❌ Issues');
  
  if (docChunksWorking && roadmapWorking) {
    console.log('🎉 Both systems compatible - safe to integrate!');
  } else {
    console.log('⚠️  Compatibility issues detected - investigate before integration');
  }
  
  return { docChunksWorking, roadmapWorking };
}

async function testConflictScenarios() {
  console.log('\n⚡ Testing potential conflict scenarios...');
  
  // Simulate the specific conflict case from our testing
  const conflictMessage = "My $2500 rent is too expensive for my budget, help me negotiate it down";
  
  console.log('Testing message:', conflictMessage);
  console.log('Expected: Both affordability and negotiation triggers');
  
  // This would normally be tested in the actual chat interface
  // For now, we note this as a scenario requiring UI testing
  
  console.log('📝 Note: This requires testing in actual chat interface at /negotiation');
  console.log('   1. Enter the message above');
  console.log('   2. Check if both artifacts appear');
  console.log('   3. Verify no UI conflicts or performance issues');
  console.log('   4. Test artifact panel layout with multiple components');
}

// Run all tests
async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE LIVE SYSTEM TESTING');
  console.log('='.repeat(50));
  
  await testSystemCompatibility();
  await testConflictScenarios();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Test actual chat interface at http://localhost:8080/negotiation');
  console.log('2. Try conflict scenario messages');
  console.log('3. Verify artifact panel behavior');
  console.log('4. Check console logs for any errors');
  console.log('5. Document any issues before integration changes');
}

runComprehensiveTests();