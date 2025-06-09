// Test direct RAG functionality with existing data
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M'
};

async function testDirectRAG() {
  console.log('🔍 Testing Direct RAG Access');
  console.log('============================\n');
  
  try {
    // First, let's see what document chunks we have
    console.log('📄 Checking document_chunks table...');
    const chunksResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/document_chunks?select=id,content,chunk_index,metadata,document_id&limit=10`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    const chunksData = await chunksResponse.json();
    console.log(`✅ Found ${chunksData.length} document chunks`);
    
    if (chunksData.length > 0) {
      console.log('\n📋 Sample chunks:');
      chunksData.slice(0, 3).forEach((chunk, index) => {
        console.log(`${index + 1}. ${chunk.content.substring(0, 100)}...`);
        console.log(`   Chunk ${chunk.chunk_index}, Document: ${chunk.document_id}`);
        console.log(`   Metadata: ${JSON.stringify(chunk.metadata || {})}`);
        console.log('');
      });
      
      // Check for Austin-related content
      const austinChunks = chunksData.filter(chunk => 
        chunk.content.toLowerCase().includes('austin') ||
        chunk.content.toLowerCase().includes('texas') ||
        chunk.content.toLowerCase().includes('rent') ||
        chunk.content.toLowerCase().includes('market')
      );
      
      console.log(`🏙️ Found ${austinChunks.length} chunks with rental/location content`);
      
      if (austinChunks.length > 0) {
        console.log('\n🎯 Relevant content for Austin queries:');
        austinChunks.slice(0, 2).forEach((chunk, index) => {
          console.log(`${index + 1}. "${chunk.content.substring(0, 200)}..."`);
        });
      }
    }
    
    // Check rental_reports table
    console.log('\n📊 Checking rental_reports table...');
    const reportsResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/rental_reports?select=id,title,report_type,created_at&limit=5`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    const reportsData = await reportsResponse.json();
    console.log(`✅ Found ${reportsData.length} rental reports`);
    
    if (reportsData.length > 0) {
      console.log('\n📋 Available reports:');
      reportsData.forEach((report, index) => {
        console.log(`${index + 1}. ${report.title} (${report.report_type})`);
        console.log(`   Created: ${new Date(report.created_at).toLocaleDateString()}`);
      });
    }
    
    // Now test the enhanced chat with this knowledge
    console.log('\n🤖 Testing enhanced chat with RAG context...');
    
    const testMessage = "What rental market trends should I know about for Austin?";
    
    const chatPayload = {
      message: testMessage,
      enableToolCalling: true,
      availableTools: ['search_knowledge_base'],
      context: {
        chatType: 'market_analysis',
        userId: 'test-rag-user'
      },
      systemPrompt: `You are a rental market expert. Use any available market data to provide specific insights about rental trends, pricing, and market conditions. If you have access to Austin market data, reference it specifically.`
    };
    
    const chatResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/functions/v1/chat-ai-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      },
      body: JSON.stringify(chatPayload)
    });
    
    const chatResult = await chatResponse.json();
    
    if (chatResponse.ok) {
      console.log('✅ Enhanced chat response received!');
      console.log(`📝 Response length: ${(chatResult.text || '').length} chars`);
      console.log(`🧠 Has knowledge base: ${chatResult.hasKnowledgeBase}`);
      console.log(`🔧 Tool calls: ${(chatResult.toolCalls || []).length}`);
      
      const responseText = chatResult.text || '';
      const hasAustinContent = responseText.toLowerCase().includes('austin');
      const hasMarketData = responseText.includes('rent') || responseText.includes('market') || responseText.includes('%');
      
      console.log(`🎯 Content analysis:`);
      console.log(`   • Austin mentioned: ${hasAustinContent}`);
      console.log(`   • Market data included: ${hasMarketData}`);
      
      if (chatResult.toolCalls && chatResult.toolCalls.length > 0) {
        console.log(`\n🛠️ Tool results:`);
        chatResult.toolCalls.forEach(tool => {
          console.log(`   ${tool.name}: ${tool.result?.total_results || 0} results`);
        });
      }
      
      console.log(`\n💬 AI Response Preview:`);
      console.log(`"${responseText.substring(0, 400)}..."`);
      
    } else {
      console.log('❌ Chat failed:', chatResult);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testDirectRAG();