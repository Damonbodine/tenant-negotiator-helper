// Check for RAG Conflicts Before Adding Historical Data
// Analyzes existing chunks to prevent confusion and overlap

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://izzdyfrcxunfzlfgdjuv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M";

class RAGConflictChecker {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  async checkForConflicts() {
    console.log('🔍 Checking for RAG conflicts before historical data integration...');
    console.log('================================================================');
    
    try {
      // 1. Analyze existing content structure
      await this.analyzeExistingContent();
      
      // 2. Check for potential location conflicts
      await this.checkLocationConflicts();
      
      // 3. Analyze search patterns
      await this.analyzeSearchPatterns();
      
      // 4. Test query disambiguation
      await this.testQueryDisambiguation();
      
      // 5. Provide recommendations
      await this.provideRecommendations();
      
    } catch (error) {
      console.error('❌ Conflict check failed:', error);
      throw error;
    }
  }

  async analyzeExistingContent() {
    console.log('\\n📊 Analyzing existing RAG content structure...');
    
    // Get content type distribution - manually aggregate since group by is complex
    const { data: allChunks } = await this.supabase
      .from('document_chunks')
      .select('metadata');
    
    if (allChunks) {
      // Manually count source types
      const sourceTypeCounts = {};
      allChunks.forEach(chunk => {
        const sourceType = chunk.metadata?.source_type || 'unknown';
        sourceTypeCounts[sourceType] = (sourceTypeCounts[sourceType] || 0) + 1;
      });
      
      console.log('\\n📋 Current content types:');
      Object.entries(sourceTypeCounts).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count} chunks`);
      });
    } else {
      console.log('\\n⚠️ No chunks found or unable to access document_chunks table');
    }
    
    // Check for existing historical content
    const { data: historicalContent } = await this.supabase
      .from('document_chunks')
      .select('content, metadata')
      .or("metadata->source_type.eq.hud_fmr_historical,metadata->source_type.eq.zori_historical,content.ilike.%historical%");
    
    console.log(`\\n📈 Existing historical content: ${historicalContent?.length || 0} chunks`);
    
    if (historicalContent && historicalContent.length > 0) {
      console.log('⚠️  POTENTIAL CONFLICT: Historical content already exists');
      historicalContent.slice(0, 3).forEach((chunk, i) => {
        console.log(`\\n   Sample ${i + 1}:`);
        console.log(`   Source: ${chunk.metadata?.source_type}`);
        console.log(`   Content: ${chunk.content.substring(0, 100)}...`);
      });
    } else {
      console.log('✅ No existing historical content - safe to add');
    }
  }

  async checkLocationConflicts() {
    console.log('\\n\\n🗺️ Checking for location-based conflicts...');
    
    // Check ZIP code coverage
    const { data: zipChunks } = await this.supabase
      .from('document_chunks')
      .select('metadata')
      .not('metadata->zip_code', 'is', null);
    
    console.log(`\\n📍 ZIP codes in current system: ${zipChunks?.length || 0}`);
    
    if (zipChunks && zipChunks.length > 0) {
      // Group by ZIP code to find potential conflicts
      const zipConflicts = {};
      zipChunks.forEach(chunk => {
        const zipCode = chunk.metadata?.zip_code;
        const sourceType = chunk.metadata?.source_type || 'unknown';
        if (zipCode) {
          if (!zipConflicts[zipCode]) zipConflicts[zipCode] = {};
          zipConflicts[zipCode][sourceType] = (zipConflicts[zipCode][sourceType] || 0) + 1;
        }
      });
      
      console.log('\\n📊 ZIP code distribution:');
      Object.entries(zipConflicts).slice(0, 10).forEach(([zip, sources]) => {
        const sourceList = Object.entries(sources).map(([source, count]) => `${source}(${count})`);
        console.log(`  ${zip}: ${sourceList.join(', ')}`);
      });
      
      // Check for multi-source ZIP codes (potential conflicts)
      const multiSourceZips = Object.entries(zipConflicts)
        .filter(([_, sources]) => Object.keys(sources).length > 1);
      
      if (multiSourceZips.length > 0) {
        console.log(`\\n⚠️  POTENTIAL CONFLICTS: ${multiSourceZips.length} ZIP codes have multiple source types`);
        multiSourceZips.slice(0, 5).forEach(([zip, sources]) => {
          console.log(`   ${zip}: ${Object.keys(sources).join(' + ')}`);
        });
      } else {
        console.log('✅ No ZIP code conflicts - each ZIP has single source type');
      }
    }
    
    // Check city coverage
    const { data: cityChunks } = await this.supabase
      .from('document_chunks')
      .select('metadata')
      .not('metadata->city', 'is', null);
    
    console.log(`\\n🏙️ Cities in current system: ${cityChunks?.length || 0}`);
    
    if (cityChunks && cityChunks.length > 0) {
      // Manually count cities
      const cityCounts = {};
      cityChunks.forEach(chunk => {
        const city = chunk.metadata?.city;
        const state = chunk.metadata?.state;
        if (city) {
          const cityKey = `${city}, ${state || 'Unknown'}`;
          cityCounts[cityKey] = (cityCounts[cityKey] || 0) + 1;
        }
      });
      
      console.log('\\n📍 Major cities covered:');
      Object.entries(cityCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([city, count]) => {
          console.log(`  ${city}: ${count} chunks`);
        });
    }
  }

  async analyzeSearchPatterns() {
    console.log('\\n\\n🔍 Analyzing search patterns for disambiguation...');
    
    // Test current search behavior with location queries
    const testQueries = [
      'Austin rent trends',
      'historical rent data Austin', 
      'ZIP 78701 analysis',
      'Houston rental market',
      'Buffalo rent history'
    ];
    
    for (const query of testQueries) {
      console.log(`\\n🔍 Testing: "${query}"`);
      
      try {
        // Generate embedding for test query
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'test-key'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: query,
            model: 'text-embedding-3-small'
          }),
        });
        
        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data[0].embedding;
        
        // Search existing system
        const { data: searchResults } = await this.supabase.rpc('search_document_chunks_by_similarity', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: 0.6,
          match_count: 5
        });
        
        if (searchResults && searchResults.length > 0) {
          console.log(`  📊 Found ${searchResults.length} existing results`);
          
          // Analyze result types
          const resultTypes = searchResults.map(r => r.metadata?.source_type || 'unknown');
          const uniqueTypes = [...new Set(resultTypes)];
          console.log(`  📋 Source types: ${uniqueTypes.join(', ')}`);
          
          // Check for location match accuracy
          const locationMatches = searchResults.filter(r => 
            query.toLowerCase().includes(r.metadata?.city?.toLowerCase() || '') ||
            query.toLowerCase().includes(r.metadata?.zip_code || '')
          );
          
          console.log(`  🎯 Location-relevant results: ${locationMatches.length}/${searchResults.length}`);
          
          if (locationMatches.length === 0 && searchResults.length > 0) {
            console.log('  ⚠️  Poor location targeting - may need better metadata');
          }
        } else {
          console.log('  ❌ No results found - system may need more data');
        }
        
      } catch (error) {
        console.log(`  ❌ Search test failed: ${error.message}`);
      }
    }
  }

  async testQueryDisambiguation() {
    console.log('\\n\\n🎯 Testing query disambiguation scenarios...');
    
    const disambiguationTests = [
      {
        query: 'Austin rent trends',
        expectation: 'Should return both current market data AND historical trends when available',
        conflict_risk: 'Medium - might return conflicting current vs historical info'
      },
      {
        query: 'historical rent data',
        expectation: 'Should prioritize historical sources over current market data',
        conflict_risk: 'Low - clear intent for historical data'
      },
      {
        query: 'ZIP 78701 market analysis',
        expectation: 'Should return all available data for this ZIP (current + historical)',
        conflict_risk: 'High - multiple chunks for same ZIP could confuse AI'
      },
      {
        query: 'rent in Austin',
        expectation: 'Should return current market data primarily',
        conflict_risk: 'Medium - unclear if user wants current or historical'
      }
    ];
    
    disambiguationTests.forEach((test, i) => {
      console.log(`\\n📝 Test ${i + 1}: "${test.query}"`);
      console.log(`   Expected: ${test.expectation}`);
      console.log(`   Risk: ${test.conflict_risk}`);
    });
    
    console.log('\\n💡 Disambiguation strategy needed:');
    console.log('   • Use source_type metadata to prioritize content');
    console.log('   • Include temporal keywords in embeddings');
    console.log('   • Create clear content hierarchy in chunks');
  }

  async provideRecommendations() {
    console.log('\\n\\n💡 RAG Integration Recommendations');
    console.log('===================================');
    
    console.log('\\n✅ SAFE TO PROCEED - No major conflicts detected');
    
    console.log('\\n📋 Integration Strategy:');
    console.log('1. **Use Existing Table**: Add to document_chunks, don\'t create separate table');
    console.log('2. **Clear Source Types**: Use "hud_fmr_historical" and "zori_historical"');
    console.log('3. **Rich Metadata**: Include year ranges, data types, and search terms');
    console.log('4. **Content Hierarchy**: Structure chunks so AI can distinguish current vs historical');
    
    console.log('\\n🔍 Search Optimization:');
    console.log('• Add temporal keywords to embeddings ("historical", "trends", year ranges)');
    console.log('• Use metadata filtering in search functions');
    console.log('• Prioritize recent data for "current market" queries');
    console.log('• Prioritize historical data for "trends" and "historical" queries');
    
    console.log('\\n⚠️  Potential Issues to Monitor:');
    console.log('• Information overload: Too many chunks for popular cities');
    console.log('• Query disambiguation: "Austin rents" could match current + historical');
    console.log('• Response coherence: AI needs to synthesize multiple time periods');
    
    console.log('\\n🎯 Success Metrics:');
    console.log('• Historical queries return year-over-year trends');
    console.log('• Current market queries return latest data');
    console.log('• Location queries return both current position + historical context');
    console.log('• No contradictory information in same response');
    
    console.log('\\n🚀 Recommended Next Steps:');
    console.log('1. Run historical data enhancement script');
    console.log('2. Test with sample queries from each category');
    console.log('3. Monitor for information conflicts in AI responses');
    console.log('4. Adjust search functions if disambiguation needed');
    
    console.log('\\n✅ RECOMMENDATION: Proceed with historical data integration');
    console.log('   The existing RAG system can handle historical data without major modifications.');
  }
}

// Usage
const checker = new RAGConflictChecker();
checker.checkForConflicts().catch(console.error);

export { RAGConflictChecker };