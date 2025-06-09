// Test the Universal RAG system directly
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M'
};

async function testUniversalRAG() {
  console.log('🧪 Testing Universal RAG System');
  console.log('===============================\n');
  
  const testMessage = "How's the market in Buffalo?";
  
  console.log(`💬 Test Query: "${testMessage}"`);
  console.log('📡 Sending to chat-ai-enhanced function...\n');
  
  try {
    const chatPayload = {
      message: testMessage,
      history: [],
      systemPrompt: "You are a rental market expert with access to comprehensive market data.",
      context: {
        userId: null, // Test without user to see if RAG still works
        chatType: 'market_analysis',
        propertyContext: null
      }
    };
    
    const startTime = Date.now();
    const chatResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/functions/v1/chat-ai-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      },
      body: JSON.stringify(chatPayload)
    });
    
    const responseTime = Date.now() - startTime;
    const chatResult = await chatResponse.json();
    
    console.log(`⏱️ Response Time: ${responseTime}ms`);
    console.log(`📊 Response Status: ${chatResponse.status}\n`);
    
    if (chatResponse.ok) {
      console.log('✅ Chat Response Analysis:');
      console.log(`   • Text Length: ${(chatResult.text || '').length} chars`);
      console.log(`   • Has Memory: ${chatResult.hasMemory || false}`);
      console.log(`   • Has Knowledge Base: ${chatResult.hasKnowledgeBase || false}`);
      console.log(`   • Stored in Memory: ${chatResult.storedInMemory || false}`);
      console.log(`   • RAG Context Length: ${chatResult.ragContextLength || 0}`);
      console.log(`   • Memory Context Length: ${chatResult.memoryContextLength || 0}`);
      console.log(`   • Tool Calls: ${(chatResult.toolCalls || []).length}`);
      
      const responseText = chatResult.text || '';
      const hasBuffaloMention = responseText.toLowerCase().includes('buffalo');
      const hasMarketData = responseText.includes('rent') || responseText.includes('market') || responseText.includes('%');
      const hasSpecificData = responseText.includes('growth') || responseText.includes('data') || responseText.includes('analysis');
      
      console.log('\n🔍 Content Analysis:');
      console.log(`   • Mentions Buffalo: ${hasBuffaloMention}`);
      console.log(`   • Contains Market Data: ${hasMarketData}`);
      console.log(`   • Has Specific Insights: ${hasSpecificData}`);
      console.log(`   • Response Quality: ${responseText.length > 500 ? 'Detailed' : 'Generic'}`);
      
      console.log('\n💬 AI Response Preview:');
      console.log(`"${responseText.substring(0, 400)}..."`);
      
      // Check if Universal RAG is working
      if (chatResult.hasKnowledgeBase && chatResult.ragContextLength > 0) {
        console.log('\n🎉 SUCCESS: Universal RAG is working!');
        console.log(`   ✅ Knowledge base context loaded (${chatResult.ragContextLength} chars)`);
        console.log(`   ✅ Enhanced responses active`);
      } else if (chatResult.ragContextLength > 0) {
        console.log('\n⚠️ PARTIAL: RAG context loaded but not flagged properly');
      } else {
        console.log('\n❌ ISSUE: Universal RAG not activating');
        console.log('   Check edge function logs for errors');
      }
      
    } else {
      console.log('❌ Chat request failed:', chatResult);
    }
    
  } catch (error) {
    console.log('❌ Error during test:', error.message);
  }
}

testUniversalRAG();