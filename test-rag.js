// Test script for RAG integration
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M',
  chatFunctionUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co/functions/v1/chat-ai-enhanced'
};

async function testRAGIntegration() {
  console.log('🧪 Testing RAG Integration');
  
  // Test 1: Check knowledge base content
  console.log('\n📊 Checking knowledge base content...');
  
  try {
    const kbResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/knowledge_base?select=id,content,source,chat_type`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    const kbData = await kbResponse.json();
    console.log(`Found ${kbData.length} knowledge base entries`);
    
    if (kbData.length > 0) {
      console.log('Sample entries:');
      kbData.slice(0, 3).forEach((entry, index) => {
        console.log(`  ${index + 1}. [${entry.chat_type}] ${entry.content.substring(0, 80)}...`);
      });
    } else {
      console.log('⚠️  Knowledge base is empty. Need to populate it first.');
      return;
    }
  } catch (error) {
    console.error('❌ Error checking knowledge base:', error);
    return;
  }
  
  // Test 2: Test RAG-enhanced chat
  console.log('\n🤖 Testing RAG-enhanced chat...');
  
  const testMessage = "What are some good strategies for negotiating rent reduction?";
  
  const chatPayload = {
    message: testMessage,
    enableToolCalling: true,
    availableTools: ['search_knowledge_base'],
    context: {
      chatType: 'negotiation',
      userId: 'test-user-id'
    },
    systemPrompt: "You are a helpful rental negotiation assistant with access to a knowledge base of tips and strategies."
  };
  
  try {
    const chatResponse = await fetch(TEST_CONFIG.chatFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      },
      body: JSON.stringify(chatPayload)
    });
    
    const chatResult = await chatResponse.json();
    
    if (chatResponse.ok) {
      console.log('✅ Chat response received:');
      console.log(`📝 Response: ${chatResult.text?.substring(0, 200)}...`);
      console.log(`🧠 Has Memory: ${chatResult.hasMemory}`);
      console.log(`📚 Has Knowledge Base: ${chatResult.hasKnowledgeBase}`);
      console.log(`🔧 Tool Calls: ${chatResult.toolCalls?.length || 0}`);
      
      if (chatResult.toolCalls && chatResult.toolCalls.length > 0) {
        console.log('\n🛠️  Tool execution results:');
        chatResult.toolCalls.forEach((tool, index) => {
          console.log(`  ${index + 1}. ${tool.name}: ${tool.result?.total_results || 'N/A'} results`);
        });
      }
    } else {
      console.error('❌ Chat error:', chatResult);
    }
  } catch (error) {
    console.error('❌ Error testing chat:', error);
  }
  
  console.log('\n🏁 RAG integration test complete!');
}

// Run the test
testRAGIntegration();