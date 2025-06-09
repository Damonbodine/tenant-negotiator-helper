// Debug what's actually in the RAG database
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M'
};

async function debugRAGContents() {
  console.log('🔍 Debugging RAG Database Contents');
  console.log('==================================\n');
  
  try {
    // Get all document chunks to see what we have
    console.log('📄 Fetching ALL document chunks...');
    const chunksResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/document_chunks?select=id,content,chunk_index,metadata,document_id&limit=50`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    const chunksData = await chunksResponse.json();
    console.log(`✅ Found ${chunksData.length} total document chunks\n`);
    
    // Look for Buffalo-specific content
    const buffaloChunks = chunksData.filter(chunk => 
      chunk.content && (
        chunk.content.toLowerCase().includes('buffalo') ||
        chunk.content.toLowerCase().includes('14') // Buffalo zip codes start with 14
      )
    );
    
    console.log(`🏙️ Buffalo-specific chunks: ${buffaloChunks.length}`);
    if (buffaloChunks.length > 0) {
      console.log('Buffalo content found:');
      buffaloChunks.forEach((chunk, index) => {
        console.log(`${index + 1}. "${chunk.content.substring(0, 200)}..."`);
        console.log(`   Metadata: ${JSON.stringify(chunk.metadata)}\n`);
      });
    }
    
    // Look for rental market data
    const marketChunks = chunksData.filter(chunk => 
      chunk.content && (
        chunk.content.toLowerCase().includes('rent') ||
        chunk.content.toLowerCase().includes('market') ||
        chunk.content.toLowerCase().includes('price') ||
        chunk.content.toLowerCase().includes('zori') // Zillow metric
      )
    );
    
    console.log(`📊 Market-related chunks: ${marketChunks.length}`);
    if (marketChunks.length > 0) {
      console.log('\nTop 5 market-related chunks:');
      marketChunks.slice(0, 5).forEach((chunk, index) => {
        console.log(`${index + 1}. "${chunk.content.substring(0, 300)}..."`);
        console.log(`   Source: ${chunk.metadata?.source_type || 'Unknown'}`);
        console.log(`   Chunk ${chunk.chunk_index}, Doc: ${chunk.document_id}\n`);
      });
    }
    
    // Check for CSV/Excel data
    const csvChunks = chunksData.filter(chunk => 
      chunk.metadata && (
        chunk.metadata.source_type?.includes('csv') ||
        chunk.metadata.source_type?.includes('excel') ||
        chunk.content?.includes('zori') ||
        chunk.content?.includes('zip')
      )
    );
    
    console.log(`📊 CSV/Excel data chunks: ${csvChunks.length}`);
    if (csvChunks.length > 0) {
      console.log('\nCSV/Excel content:');
      csvChunks.forEach((chunk, index) => {
        console.log(`${index + 1}. "${chunk.content.substring(0, 400)}..."`);
        console.log(`   Metadata: ${JSON.stringify(chunk.metadata)}\n`);
      });
    }
    
    // Now test what our current RAG system is actually returning
    console.log('🧪 Testing current RAG system output...');
    
    const testQuery = "Buffalo rental market data";
    
    console.log(`\n💬 Test Query: "${testQuery}"`);
    console.log('📡 Generating embedding...');
    
    // This mimics what the chat function does
    const simpleQuery = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/document_chunks?select=id,content,chunk_index,metadata&not=content.is.null&limit=6`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    const simpleResults = await simpleQuery.json();
    
    console.log(`\n📋 Current RAG system returns these ${simpleResults.length} chunks:`);
    simpleResults.forEach((chunk, index) => {
      console.log(`${index + 1}. "${chunk.content.substring(0, 150)}..."`);
      console.log(`   Relevance to Buffalo: ${chunk.content.toLowerCase().includes('buffalo') ? '✅ HIGH' : chunk.content.toLowerCase().includes('rent') || chunk.content.toLowerCase().includes('market') ? '⚠️ MEDIUM' : '❌ LOW'}`);
    });
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (buffaloChunks.length > 0) {
      console.log('✅ Buffalo data exists - need better vector similarity search');
    } else {
      console.log('❌ No Buffalo data found - need to embed the CSV file');
    }
    
    if (csvChunks.length > 0) {
      console.log('✅ CSV data exists - ensure it includes Buffalo zip codes');
    } else {
      console.log('❌ No CSV data found - the Excel file may not be embedded yet');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

debugRAGContents();