// Simple test to verify our RAG integration is working
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M',
  chatFunctionUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co/functions/v1/chat-ai-enhanced'
};

async function testRAGWithLocationQuery() {
  console.log('🧪 Testing RAG with Location Query');
  console.log('==================================\n');
  
  // Test with a specific Austin rental market query
  const testMessage = "What's the current rental market situation in Austin, Texas? Are prices going up or down?";
  
  console.log(`💬 Query: "${testMessage}"`);
  
  try {
    const chatPayload = {
      message: testMessage,
      enableToolCalling: true,
      availableTools: ['search_knowledge_base'],
      context: {
        chatType: 'market_analysis',
        userId: 'test-user-austin-123'
      },
      systemPrompt: "You are a rental market expert with access to current market data. Provide specific insights based on available data about rental markets, pricing trends, and local conditions."
    };
    
    console.log('📡 Sending request to chat function...');
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
    
    console.log(`⏱️ Response time: ${responseTime}ms`);
    
    if (chatResponse.ok) {
      console.log('✅ Chat response received successfully!');
      console.log(`📊 Response analysis:`);
      console.log(`   • Response length: ${(chatResult.text || '').length} characters`);
      console.log(`   • Has knowledge base context: ${chatResult.hasKnowledgeBase || false}`);
      console.log(`   • Tool calls made: ${(chatResult.toolCalls || []).length}`);
      console.log(`   • Stored in memory: ${chatResult.storedInMemory || false}`);
      
      // Check if response contains specific market data
      const responseText = chatResult.text || '';
      const containsAustin = responseText.toLowerCase().includes('austin');
      const containsMarketData = responseText.includes('%') || responseText.includes('price') || responseText.includes('rent');
      const containsSpecificData = responseText.includes('drop') || responseText.includes('increase') || responseText.includes('growth');
      
      console.log(`\n🔍 Content analysis:`);
      console.log(`   • Mentions Austin: ${containsAustin}`);
      console.log(`   • Contains market data: ${containsMarketData}`);
      console.log(`   • Has specific insights: ${containsSpecificData}`);
      
      if (chatResult.toolCalls && chatResult.toolCalls.length > 0) {
        console.log(`\n🛠️ Tool execution results:`);
        chatResult.toolCalls.forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool.name}:`);
          console.log(`      • Total results: ${tool.result?.total_results || 0}`);
          console.log(`      • Document chunks: ${tool.result?.document_chunks || 0}`);
          console.log(`      • Knowledge base items: ${tool.result?.knowledge_base_items || 0}`);
          console.log(`      • Location query: ${tool.result?.is_location_query || false}`);
          
          if (tool.result?.results && tool.result.results.length > 0) {
            console.log(`      • Sample result: "${tool.result.results[0].content?.substring(0, 100) || 'N/A'}..."`);
          }
        });
      }
      
      console.log(`\n💡 AI Response Preview:`);
      console.log(`"${responseText.substring(0, 300)}..."`);
      
      // Determine success
      const isSuccessful = containsMarketData && (chatResult.hasKnowledgeBase || (chatResult.toolCalls && chatResult.toolCalls.length > 0));
      
      if (isSuccessful) {
        console.log(`\n🎉 SUCCESS: RAG integration is working!`);
        console.log(`   The AI is now able to provide data-driven insights.`);
      } else {
        console.log(`\n⚠️ PARTIAL SUCCESS: Basic chat working, RAG needs enhancement.`);
      }
      
    } else {
      console.log(`❌ Chat request failed:`, chatResult);
    }
    
  } catch (error) {
    console.log(`❌ Error during test:`, error.message);
  }
}

// Run the test
testRAGWithLocationQuery();