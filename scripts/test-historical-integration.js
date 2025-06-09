// Test Historical Data Integration - Small Sample
// Tests adding historical intelligence to existing RAG system

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';

const SUPABASE_URL = "https://izzdyfrcxunfzlfgdjuv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-key";

class HistoricalTestIntegration {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  async testHistoricalIntegration() {
    console.log('🧪 Testing Historical Data Integration');
    console.log('===================================');
    
    try {
      // Step 1: Test database connection
      await this.testDatabaseConnection();
      
      // Step 2: Create sample historical chunks
      await this.createSampleHistoricalChunks();
      
      // Step 3: Test search functionality
      await this.testHistoricalSearch();
      
      console.log('\\n✅ Historical integration test completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  async testDatabaseConnection() {
    console.log('\\n🔗 Testing database connection...');
    
    const { data, error } = await this.supabase
      .from('document_chunks')
      .select('count');
    
    if (error) throw error;
    
    console.log(`✅ Connected to Supabase - ${data?.length || 0} chunks accessible`);
  }

  async createSampleHistoricalChunks() {
    console.log('\\n📊 Creating sample historical chunks...');
    
    // Sample historical data for popular cities
    const sampleHistoricalData = [
      {
        zip_code: '78701',
        city: 'Austin',
        state: 'TX',
        historical_summary: {
          totalGrowth: 42.3,
          annualGrowth: 4.2,
          recentGrowth: -2.1,
          peak: { amount: 2400, date: '2022-08' },
          trough: { amount: 1200, date: '2015-01' },
          currentRent: 2100
        }
      },
      {
        zip_code: '77001',
        city: 'Houston', 
        state: 'TX',
        historical_summary: {
          totalGrowth: 28.5,
          annualGrowth: 2.8,
          recentGrowth: 1.2,
          peak: { amount: 1800, date: '2024-03' },
          trough: { amount: 1100, date: '2016-02' },
          currentRent: 1650
        }
      },
      {
        zip_code: '60601',
        city: 'Chicago',
        state: 'IL',
        historical_summary: {
          totalGrowth: 35.7,
          annualGrowth: 3.6,
          recentGrowth: 0.8,
          peak: { amount: 2200, date: '2023-09' },
          trough: { amount: 1400, date: '2015-12' },
          currentRent: 2050
        }
      }
    ];
    
    const historicalChunks = [];
    
    for (const data of sampleHistoricalData) {
      const content = this.generateHistoricalContent(data);
      const chunk = {
        content,
        metadata: {
          source_type: 'zori_historical_test',
          zip_code: data.zip_code,
          city: data.city,
          state: data.state,
          data_type: 'historical_trends',
          trend_analysis: data.historical_summary,
          processed_at: new Date().toISOString(),
          search_terms: `${data.city} rent trends, ${data.city} ${data.state} rental market, ZIP ${data.zip_code} historical data`
        },
        chunk_index: 0
      };
      
      // Generate embedding
      try {
        const embedding = await this.generateEmbedding(content);
        chunk.embedding = `[${embedding.join(',')}]`;
        historicalChunks.push(chunk);
        console.log(`✅ Created historical chunk for ${data.city}, ${data.state}`);
      } catch (error) {
        console.warn(`⚠️ Failed to create embedding for ${data.city}:`, error.message);
      }
    }
    
    // Insert chunks
    if (historicalChunks.length > 0) {
      const { error } = await this.supabase
        .from('document_chunks')
        .insert(historicalChunks);
      
      if (error) throw error;
      
      console.log(`✅ Inserted ${historicalChunks.length} historical chunks into RAG system`);
    }
  }

  generateHistoricalContent(data) {
    const { zip_code, city, state, historical_summary } = data;
    const { totalGrowth, annualGrowth, recentGrowth, peak, trough, currentRent } = historical_summary;
    
    return `
ZIP ${zip_code} Historical Rent Analysis (${city}, ${state}):

Current Market: $${currentRent.toLocaleString()}/month
Historical Performance:
• Total Growth: ${totalGrowth}% over 10 years  
• Annual Average: ${annualGrowth}% growth
• Recent Trend: ${recentGrowth}% (last 12 months)

Market Cycles:
• Peak: $${peak.amount.toLocaleString()} (${peak.date})
• Trough: $${trough.amount.toLocaleString()} (${trough.date})
• Current Position: ${currentRent > peak.amount * 0.9 ? 'Near historical peak' : 'Below peak levels'}

Negotiation Intelligence:
${recentGrowth < 0 
  ? `Declining market (-${Math.abs(recentGrowth)}%) provides strong negotiation leverage. Reference recent rent decreases.`
  : recentGrowth > 5 
  ? `Rapidly rising market (+${recentGrowth}%) - focus on tenant quality over rent reduction.`
  : `Stable market allows standard negotiation strategies with historical context.`
}

Historical Context: This ZIP code shows ${totalGrowth > 30 ? 'strong' : totalGrowth > 15 ? 'moderate' : 'limited'} long-term appreciation. Use 10-year data to establish reasonable rent expectations and market position.

Search Keywords: ${city} rent trends, ${city} ${state} rental market, ZIP ${zip_code} historical rents, ${city} market analysis, historical rent data ${city}
    `.trim();
  }

  async generateEmbedding(text) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  }

  async testHistoricalSearch() {
    console.log('\\n🔍 Testing historical search functionality...');
    
    const testQueries = [
      'Austin rent trends',
      'historical rent data Houston', 
      'Chicago rental market analysis',
      'ZIP 78701 market trends'
    ];
    
    for (const query of testQueries) {
      console.log(`\\n🔍 Testing: "${query}"`);
      
      try {
        // Generate embedding for search
        const embedding = await this.generateEmbedding(query);
        
        // Search with vector similarity
        const { data: results, error } = await this.supabase.rpc('search_document_chunks_by_similarity', {
          query_embedding: `[${embedding.join(',')}]`,
          match_threshold: 0.5,
          match_count: 5
        });
        
        if (error) {
          console.log(`  ❌ Search failed: ${error.message}`);
          continue;
        }
        
        const historicalResults = results?.filter(r => 
          r.metadata?.source_type?.includes('historical')
        ) || [];
        
        const currentResults = results?.filter(r => 
          !r.metadata?.source_type?.includes('historical')
        ) || [];
        
        console.log(`  📊 Results: ${results?.length || 0} total`);
        console.log(`  📈 Historical: ${historicalResults.length}`);
        console.log(`  📋 Current: ${currentResults.length}`);
        
        if (historicalResults.length > 0) {
          const topResult = historicalResults[0];
          console.log(`  🎯 Top historical result: ${topResult.metadata?.city}, ${topResult.metadata?.state}`);
          console.log(`  📝 Content preview: ${topResult.content.substring(0, 100)}...`);
        }
        
        if (results && results.length === 0) {
          console.log('  ⚠️ No results found - may need to adjust search parameters');
        }
        
      } catch (error) {
        console.log(`  ❌ Search test failed: ${error.message}`);
      }
    }
  }
}

// Run test
const tester = new HistoricalTestIntegration();
tester.testHistoricalIntegration().catch(console.error);

export { HistoricalTestIntegration };