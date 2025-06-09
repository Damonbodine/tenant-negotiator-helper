// Simple test of enhanced listing analyzer
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M',
  listingAnalyzerUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co/functions/v1/listing-analyzer'
};

async function testSimple() {
  console.log('🧪 Testing Enhanced Listing Analyzer - Simple Test');
  console.log('=================================================\\n');
  
  // Test with a simple URL that should work
  const testUrl = "https://www.apartments.com/search/austin-tx";
  
  console.log('🔗 Testing URL:', testUrl);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(TEST_CONFIG.listingAnalyzerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      },
      body: JSON.stringify({
        url: testUrl
      })
    });
    
    const responseTime = Date.now() - startTime;
    const result = await response.json();
    
    console.log(`⏱️ Response time: ${responseTime}ms`);
    console.log('📄 Raw response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ API call successful');
      
      // Check for enhanced features
      if (result.scrapingMethod) {
        console.log(`🔥 Scraping method: ${result.scrapingMethod}`);
      }
      
      if (result.rentcastAnalysis) {
        console.log('🏠 RentCast analysis included');
      }
      
    } else {
      console.log('❌ API call failed');
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testSimple();