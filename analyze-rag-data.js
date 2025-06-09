import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://izzdyfrcxunfzlfgdjuv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzA4NjcwNywiZXhwIjoyMDQ4NjYyNzA3fQ.FyBNcx4Nm_pqy-x7NItryGRJ9HdovNMX6jWcWJvftGQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeRAGData() {
  console.log('🔍 ANALYZING RAG DATA COMPOSITION...\n');

  // Get overall statistics
  const { data: stats, error: statsError } = await supabase
    .from('document_chunks')
    .select('content, metadata, chunk_index')
    .not('content', 'is', null);

  if (statsError) {
    console.error('Error fetching stats:', statsError);
    return;
  }

  console.log(`📊 TOTAL CHUNKS: ${stats.length}`);
  
  // Analyze by source type
  const sourceTypes = {};
  const dataTypes = {};
  const contentLengths = [];
  
  stats.forEach(chunk => {
    const sourceType = chunk.metadata?.source_type || 'unknown';
    const dataType = chunk.metadata?.data_type || 'unknown';
    const contentLength = chunk.content?.length || 0;
    
    sourceTypes[sourceType] = (sourceTypes[sourceType] || 0) + 1;
    dataTypes[dataType] = (dataTypes[dataType] || 0) + 1;
    contentLengths.push(contentLength);
  });

  console.log('\n📋 BY SOURCE TYPE:');
  Object.entries(sourceTypes)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} chunks`);
    });

  console.log('\n📋 BY DATA TYPE:');
  Object.entries(dataTypes)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} chunks`);
    });

  console.log('\n📏 CONTENT LENGTH ANALYSIS:');
  const avgLength = contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length;
  const minLength = Math.min(...contentLengths);
  const maxLength = Math.max(...contentLengths);
  
  console.log(`  Average: ${Math.round(avgLength)} chars`);
  console.log(`  Range: ${minLength} - ${maxLength} chars`);
  
  // Sample some content to see what we're working with
  console.log('\n📄 SAMPLE CONTENT ANALYSIS:');
  const samples = stats.slice(0, 5);
  samples.forEach((chunk, i) => {
    console.log(`\n  Sample ${i + 1}:`);
    console.log(`    Source: ${chunk.metadata?.source_type || 'unknown'}`);
    console.log(`    Type: ${chunk.metadata?.data_type || 'unknown'}`);
    console.log(`    Length: ${chunk.content?.length || 0} chars`);
    console.log(`    Preview: "${chunk.content?.substring(0, 100)}..."`);
  });

  // Find potentially low-value content
  console.log('\n🎯 OPTIMIZATION OPPORTUNITIES:');
  
  // Very short chunks (likely low value)
  const shortChunks = stats.filter(chunk => (chunk.content?.length || 0) < 100);
  console.log(`  📉 Very short chunks (<100 chars): ${shortChunks.length}`);
  
  // Very long chunks (might be too generic)
  const longChunks = stats.filter(chunk => (chunk.content?.length || 0) > 2000);
  console.log(`  📈 Very long chunks (>2000 chars): ${longChunks.length}`);
  
  // Chunks with specific keywords that are high-value for negotiation
  const negotiationKeywords = ['negotiate', 'rent reduction', 'leverage', 'market rate', 'comparable', 'strategy'];
  const highValueChunks = stats.filter(chunk => 
    negotiationKeywords.some(keyword => 
      chunk.content?.toLowerCase().includes(keyword)
    )
  );
  console.log(`  🎯 High-value negotiation chunks: ${highValueChunks.length}`);

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('  1. Consider removing very short chunks (<100 chars)');
  console.log('  2. Review very long chunks for splitting or removal');
  console.log('  3. Prioritize chunks with negotiation keywords');
  console.log('  4. Focus on specific source types that provide actionable advice');
}

analyzeRAGData().catch(console.error);