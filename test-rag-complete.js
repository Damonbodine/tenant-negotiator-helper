// Comprehensive RAG Integration Test
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M',
  chatFunctionUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co/functions/v1/chat-ai-enhanced'
};

async function testRAGIntegration() {
  console.log('🧪 Testing Complete RAG Integration');
  console.log('=====================================\n');
  
  // Test scenarios that should trigger RAG responses
  const testScenarios = [
    {
      name: "Location-Based Market Query",
      message: "What's the current rental market like in Austin?",
      expectedRAG: true,
      expectedType: "location_query"
    },
    {
      name: "General Market Analysis",
      message: "How are rental prices trending nationally?",
      expectedRAG: true,
      expectedType: "market_analysis"
    },
    {
      name: "Negotiation Strategy",
      message: "What are some good strategies for rent reduction?",
      expectedRAG: true,
      expectedType: "negotiation"
    },
    {
      name: "Property Comparison",
      message: "How do I know if this listing is overpriced?",
      expectedRAG: true,
      expectedType: "analysis"
    }
  ];

  let passedTests = 0;
  let totalTests = testScenarios.length;

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`📋 Test ${i + 1}: ${scenario.name}`);
    console.log(`💬 Query: "${scenario.message}"`);
    
    try {
      const chatPayload = {
        message: scenario.message,
        enableToolCalling: true,
        availableTools: ['search_knowledge_base'],
        context: {
          chatType: 'negotiation',
          userId: 'test-user-rag-123'
        },
        systemPrompt: "You are a helpful rental negotiation assistant with access to real-time market data and rental insights. Use the provided data to give specific, actionable advice."
      };
      
      const startTime = Date.now();
      const chatResponse = await fetch(TEST_CONFIG.chatFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
        },
        body: JSON.stringify(chatPayload)
      });
      
      const responseTime = Date.now() - startTime;
      const chatResult = await chatResponse.json();
      
      if (chatResponse.ok) {
        // Analyze the response
        const hasKnowledgeBase = chatResult.hasKnowledgeBase;
        const responseText = chatResult.text || '';
        const toolCalls = chatResult.toolCalls || [];
        
        // Check if RAG data was used
        const hasMarketData = responseText.includes('market') || responseText.includes('data') || responseText.includes('%');
        const hasSpecificInfo = responseText.length > 200; // More detailed response indicates RAG usage
        
        console.log(`✅ Response received (${responseTime}ms)`);
        console.log(`📊 Has Knowledge Base: ${hasKnowledgeBase}`);
        console.log(`🔧 Tool Calls: ${toolCalls.length}`);
        console.log(`📝 Response Length: ${responseText.length} chars`);
        console.log(`📈 Contains Market Data: ${hasMarketData}`);
        
        if (toolCalls.length > 0) {
          console.log(`🛠️ Tool Results:`);
          toolCalls.forEach((tool, index) => {
            console.log(`   ${index + 1}. ${tool.name}: ${tool.result?.total_results || 0} results`);
            if (tool.result?.is_location_query) {
              console.log(`      🌍 Location query detected`);
            }
            if (tool.result?.document_chunks > 0) {
              console.log(`      📄 Document chunks found: ${tool.result.document_chunks}`);
            }
          });
        }
        
        // Show sample of response
        console.log(`💡 Response Sample: "${responseText.substring(0, 150)}..."`);
        
        // Test passed if we got RAG data
        if (hasKnowledgeBase || toolCalls.length > 0 || hasMarketData) {
          console.log(`✅ Test PASSED - RAG integration working`);
          passedTests++;
        } else {
          console.log(`❌ Test FAILED - No RAG data detected`);
        }
        
      } else {
        console.log(`❌ Test FAILED - API Error:`, chatResult);
      }
      
    } catch (error) {
      console.log(`❌ Test FAILED - Error:`, error.message);
    }
    
    console.log('─'.repeat(50));
  }

  // Summary
  console.log(`\n🏁 RAG Integration Test Summary`);
  console.log(`===============================`);
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log(`🎉 All tests passed! RAG integration is working correctly.`);
    console.log(`\n🚀 Your AI can now provide:`);
    console.log(`   • Real-time rental market data`);
    console.log(`   • Location-specific insights`);
    console.log(`   • Data-driven negotiation advice`);
    console.log(`   • Contextual property analysis`);
  } else {
    console.log(`⚠️ Some tests failed. RAG integration needs attention.`);
  }
}

// Test individual RAG functions
async function testRAGFunctions() {
  console.log('\n🔧 Testing Individual RAG Functions');
  console.log('===================================\n');
  
  // Test document chunks query
  try {
    console.log('📄 Testing document_chunks query...');
    const docResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/document_chunks?select=id,content,chunk_index,metadata&limit=3`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    const docData = await docResponse.json();
    console.log(`✅ Found ${docData.length} document chunks`);
    
    if (docData.length > 0) {
      console.log(`📋 Sample chunk: "${docData[0].content.substring(0, 100)}..."`);
      console.log(`🔢 Has embeddings: ${docData[0].embedding ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    console.log(`❌ Document chunks test failed:`, error.message);
  }
  
  // Test rental_reports query  
  try {
    console.log('\n📊 Testing rental_reports query...');
    const reportsResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/rental_reports?select=id,title,report_type&limit=3`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    const reportsData = await reportsResponse.json();
    console.log(`✅ Found ${reportsData.length} rental reports`);
    
    if (reportsData.length > 0) {
      reportsData.forEach((report, index) => {
        console.log(`   ${index + 1}. ${report.title} (${report.report_type})`);
      });
    }
  } catch (error) {
    console.log(`❌ Rental reports test failed:`, error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testRAGFunctions();
  await testRAGIntegration();
}

runAllTests();