// Analysis script for document_chunks table
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M'
};

async function analyzeDocumentChunks() {
  console.log('🔍 Analyzing document_chunks table...\n');
  
  try {
    // Get all chunks with their metadata
    const chunksResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/document_chunks?select=*`, {
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      }
    });
    
    if (!chunksResponse.ok) {
      throw new Error(`HTTP ${chunksResponse.status}: ${await chunksResponse.text()}`);
    }
    
    const chunks = await chunksResponse.json();
    console.log(`📊 Total chunks found: ${chunks.length}\n`);
    
    if (chunks.length === 0) {
      console.log('⚠️  No chunks found in document_chunks table');
      return;
    }
    
    // Analyze metadata structure
    const sourceTypes = {};
    const dataTypes = {};
    const contentLengths = [];
    const contentByType = {};
    const metadataKeys = {};
    
    chunks.forEach((chunk, index) => {
      const contentLength = chunk.content?.length || 0;
      contentLengths.push(contentLength);
      
      if (chunk.metadata) {
        let meta;
        try {
          meta = typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata;
        } catch (e) {
          console.log(`⚠️  Could not parse metadata for chunk ${index}`);
          return;
        }
        
        // Track source types
        if (meta.source_type) {
          sourceTypes[meta.source_type] = (sourceTypes[meta.source_type] || 0) + 1;
          
          // Store sample content by type
          if (!contentByType[meta.source_type]) {
            contentByType[meta.source_type] = [];
          }
          if (contentByType[meta.source_type].length < 3) {
            contentByType[meta.source_type].push({
              content: chunk.content?.substring(0, 200) + '...',
              length: contentLength,
              metadata: meta
            });
          }
        }
        
        // Track data types
        if (meta.data_type) {
          dataTypes[meta.data_type] = (dataTypes[meta.data_type] || 0) + 1;
        }
        
        // Track metadata keys
        Object.keys(meta).forEach(key => {
          metadataKeys[key] = (metadataKeys[key] || 0) + 1;
        });
      }
    });
    
    // Display results
    console.log('📋 SOURCE TYPES DISTRIBUTION:');
    console.log('=' .repeat(50));
    Object.entries(sourceTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / chunks.length) * 100).toFixed(1);
        console.log(`  ${type}: ${count} chunks (${percentage}%)`);
      });
    
    console.log('\n📋 DATA TYPES DISTRIBUTION:');
    console.log('=' .repeat(50));
    Object.entries(dataTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / chunks.length) * 100).toFixed(1);
        console.log(`  ${type}: ${count} chunks (${percentage}%)`);
      });
    
    console.log('\n📋 METADATA KEYS FOUND:');
    console.log('=' .repeat(50));
    Object.entries(metadataKeys)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, count]) => {
        console.log(`  ${key}: ${count} occurrences`);
      });
    
    // Content length analysis
    const avgLength = contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length;
    const minLength = Math.min(...contentLengths);
    const maxLength = Math.max(...contentLengths);
    const medianLength = contentLengths.sort((a, b) => a - b)[Math.floor(contentLengths.length / 2)];
    
    console.log('\n📏 CONTENT LENGTH ANALYSIS:');
    console.log('=' .repeat(50));
    console.log(`  Average: ${Math.round(avgLength)} characters`);
    console.log(`  Median: ${Math.round(medianLength)} characters`);
    console.log(`  Min: ${minLength} characters`);
    console.log(`  Max: ${maxLength} characters`);
    
    // Length distribution by source type
    console.log('\n📏 AVERAGE LENGTH BY SOURCE TYPE:');
    console.log('=' .repeat(50));
    Object.keys(sourceTypes).forEach(sourceType => {
      const typeLengths = chunks
        .filter(chunk => {
          try {
            const meta = typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata;
            return meta?.source_type === sourceType;
          } catch {
            return false;
          }
        })
        .map(chunk => chunk.content?.length || 0);
      
      if (typeLengths.length > 0) {
        const avgTypeLength = typeLengths.reduce((a, b) => a + b, 0) / typeLengths.length;
        console.log(`  ${sourceType}: ${Math.round(avgTypeLength)} chars avg`);
      }
    });
    
    // Sample content by type
    console.log('\n📄 SAMPLE CONTENT BY SOURCE TYPE:');
    console.log('=' .repeat(50));
    Object.entries(contentByType).forEach(([sourceType, samples]) => {
      console.log(`\n🏷️  ${sourceType.toUpperCase()}:`);
      samples.forEach((sample, index) => {
        console.log(`  Sample ${index + 1} (${sample.length} chars):`);
        console.log(`    "${sample.content}"`);
        console.log(`    Metadata keys: ${Object.keys(sample.metadata).join(', ')}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error analyzing document chunks:', error);
  }
}

// Run the analysis
analyzeDocumentChunks();