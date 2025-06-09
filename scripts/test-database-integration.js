// Test Database Integration Without Embeddings
// Tests the database structure for historical data integration

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://izzdyfrcxunfzlfgdjuv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M";

class DatabaseIntegrationTester {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  async testDatabaseIntegration() {
    console.log('🧪 Testing Database Integration for Historical Data');
    console.log('==================================================');
    
    try {
      // Step 1: Test database connection
      await this.testConnection();
      
      // Step 2: Check existing schema
      await this.checkExistingSchema();
      
      // Step 3: Test insert without embedding
      await this.testHistoricalInsert();
      
      // Step 4: Test search without embedding
      await this.testBasicSearch();
      
      // Step 5: Clean up test data
      await this.cleanupTestData();
      
      console.log('\n✅ Database integration test completed successfully!');
      console.log('\n🎯 READY FOR HISTORICAL DATA INTEGRATION');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  async testConnection() {
    console.log('\n🔗 Testing database connection...');
    
    const { data, error } = await this.supabase
      .from('document_chunks')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log(`✅ Connected to Supabase successfully`);
  }

  async checkExistingSchema() {
    console.log('\n📋 Checking existing schema...');
    
    // Check current chunk count
    const { count: currentCount } = await this.supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Current chunks: ${currentCount}`);
    
    // Check source types
    const { data: chunks } = await this.supabase
      .from('document_chunks')
      .select('metadata');
    
    if (chunks) {
      const sourceTypes = {};
      chunks.forEach(chunk => {
        const sourceType = chunk.metadata?.source_type || 'unknown';
        sourceTypes[sourceType] = (sourceTypes[sourceType] || 0) + 1;
      });
      
      console.log('\n📋 Current source types:');
      Object.entries(sourceTypes).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count} chunks`);
      });
    }
  }

  async testHistoricalInsert() {
    console.log('\n📊 Testing historical data insert...');
    
    const testChunk = {
      content: `
Austin, TX - Historical Rent Analysis (TEST DATA):

Current Market: $2,100/month
10-Year Growth: 42.3% total (4.2% annually)
Recent Trend: -2.1% (last 12 months)

Market Cycles:
• Peak: $2,400 (2022-08)
• Trough: $1,200 (2015-01)

Negotiation Intelligence: Declining market (-2.1%) provides strong negotiation leverage.
Reference recent rent decreases for better deals.

Search Context: Austin rent trends, Austin TX rental market, historical rent data Austin
      `.trim(),
      metadata: {
        source_type: 'zori_historical_test',
        zip_code: '78701',
        city: 'Austin',
        state: 'TX',
        data_type: 'historical_trends',
        trend_analysis: {
          totalGrowth: 42.3,
          annualGrowth: 4.2,
          recentGrowth: -2.1,
          peak: { amount: 2400, date: '2022-08' },
          trough: { amount: 1200, date: '2015-01' },
          currentRent: 2100
        },
        processed_at: new Date().toISOString(),
        search_terms: 'Austin rent trends, Austin TX rental market, ZIP 78701 historical data',
        test_data: true
      },
      chunk_index: 0,
      embedding: null // Skip embedding for now
    };
    
    const { data: insertResult, error: insertError } = await this.supabase
      .from('document_chunks')
      .insert(testChunk)
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    console.log(`✅ Successfully inserted test historical chunk: ${insertResult.id}`);
    this.testChunkId = insertResult.id;
    
    // Verify insertion
    const { data: verifyData } = await this.supabase
      .from('document_chunks')
      .select('*')
      .eq('id', insertResult.id)
      .single();
    
    if (verifyData) {
      console.log(`✅ Verified chunk exists in database`);
      console.log(`📍 Location: ${verifyData.metadata?.city}, ${verifyData.metadata?.state}`);
      console.log(`📈 Source: ${verifyData.metadata?.source_type}`);
    }
  }

  async testBasicSearch() {
    console.log('\n🔍 Testing basic search functionality...');
    
    // Test metadata-based search
    const { data: searchResults } = await this.supabase
      .from('document_chunks')
      .select('*')
      .eq('metadata->source_type', 'zori_historical_test')
      .eq('metadata->city', 'Austin');
    
    console.log(`📊 Found ${searchResults?.length || 0} test historical chunks`);
    
    if (searchResults && searchResults.length > 0) {
      const result = searchResults[0];
      console.log(`✅ Sample result:`);
      console.log(`   City: ${result.metadata?.city}, ${result.metadata?.state}`);
      console.log(`   ZIP: ${result.metadata?.zip_code}`);
      console.log(`   Growth: ${result.metadata?.trend_analysis?.totalGrowth}%`);
      console.log(`   Content: ${result.content.substring(0, 100)}...`);
    }
    
    // Test content-based search
    const { data: contentResults } = await this.supabase
      .from('document_chunks')
      .select('*')
      .textSearch('content', 'Austin historical rent');
    
    console.log(`🔍 Text search found ${contentResults?.length || 0} results for "Austin historical rent"`);
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    if (this.testChunkId) {
      const { error } = await this.supabase
        .from('document_chunks')
        .delete()
        .eq('id', this.testChunkId);
      
      if (error) {
        console.warn('⚠️ Failed to clean up test chunk:', error.message);
      } else {
        console.log('✅ Test data cleaned up successfully');
      }
    }
    
    // Also clean up any other test data
    const { data: testChunks } = await this.supabase
      .from('document_chunks')
      .select('id')
      .eq('metadata->test_data', true);
    
    if (testChunks && testChunks.length > 0) {
      const { error } = await this.supabase
        .from('document_chunks')
        .delete()
        .eq('metadata->test_data', true);
      
      if (!error) {
        console.log(`✅ Cleaned up ${testChunks.length} additional test chunks`);
      }
    }
  }
}

// Run test
const tester = new DatabaseIntegrationTester();
tester.testDatabaseIntegration().catch(console.error);

export { DatabaseIntegrationTester };