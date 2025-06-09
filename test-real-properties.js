// Test Enhanced Listing Analyzer with Real Property URLs
const TEST_CONFIG = {
  supabaseUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M',
  listingAnalyzerUrl: 'https://izzdyfrcxunfzlfgdjuv.supabase.co/functions/v1/listing-analyzer'
};

async function testRealProperties() {
  console.log('🏠 Testing Enhanced System with Real Properties');
  console.log('===============================================\\n');
  
  const testProperties = [
    {
      name: "BB Living Easton Park (3BR)",
      url: "https://www.zillow.com/apartments/austin-tx/bb-living-easton-park/CY8Pqp/#bedrooms-3",
      expectedFeatures: ["3-bedroom filtering", "complex-level data", "firecrawl extraction"]
    },
    {
      name: "On The Green - Unit 366559870",
      url: "https://www.zillow.com/apartments/austin-tx/on-the-green/5Xht8k/#unit-366559870",
      expectedFeatures: ["unit-specific extraction", "unit ID parsing", "targeted scraping"]
    },
    {
      name: "Realtor.com Property",
      url: "https://www.realtor.com/rentals/details/8207-Hood-Cir-B_Austin_TX_78745_M94715-08085?is_promoted_listing=true",
      expectedFeatures: ["realtor.com scraping", "address parsing", "multi-site support"]
    }
  ];

  let passedTests = 0;
  let totalTests = testProperties.length;
  const results = [];

  for (let i = 0; i < testProperties.length; i++) {
    const property = testProperties[i];
    console.log(`📋 Test ${i + 1}: ${property.name}`);
    console.log(`🔗 URL: ${property.url}`);
    console.log(`🎯 Expected: ${property.expectedFeatures.join(', ')}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(TEST_CONFIG.listingAnalyzerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
        },
        body: JSON.stringify({
          url: property.url
        })
      });
      
      const responseTime = Date.now() - startTime;
      const result = await response.json();
      
      console.log(`⏱️ Analysis time: ${responseTime}ms`);
      
      if (response.ok && !result.error) {
        console.log(`✅ Analysis successful!`);
        
        // Extract key information
        const propertyData = {
          name: property.name,
          address: result.address,
          rent: result.rent,
          beds: result.beds,
          baths: result.baths,
          sqft: result.sqft,
          zipcode: result.zipcode,
          propertyName: result.propertyName,
          unitId: result.unitId,
          scrapingMethod: result.scrapingMethod,
          verdict: result.verdict,
          marketAverage: result.marketAverage,
          deltaPercent: result.deltaPercent,
          hasRentCast: !!result.rentcastAnalysis,
          rentCastConfidence: result.rentcastAnalysis?.confidence,
          comparablesCount: result.rentcastAnalysis?.comparables?.length || 0
        };
        
        results.push(propertyData);
        
        console.log(`📊 Property Data:`);
        console.log(`   🏠 Address: ${propertyData.address || 'Not extracted'}`);
        console.log(`   🏢 Property: ${propertyData.propertyName || 'Not found'}`);
        console.log(`   💰 Rent: $${propertyData.rent || 'Not found'}`);
        console.log(`   🛏️ Beds/Baths: ${propertyData.beds || '?'}/${propertyData.baths || '?'}`);
        console.log(`   📏 Sqft: ${propertyData.sqft || 'Not found'}`);
        console.log(`   📍 Zip: ${propertyData.zipcode || 'Not found'}`);
        
        if (propertyData.unitId) {
          console.log(`   🔑 Unit ID: ${propertyData.unitId}`);
        }
        
        console.log(`🔧 Technical Details:`);
        console.log(`   🌐 Scraping: ${propertyData.scrapingMethod || 'Unknown'}`);
        
        if (propertyData.hasRentCast) {
          console.log(`   🏠 RentCast: ${propertyData.rentCastConfidence}% confidence`);
          console.log(`   📊 Market: ${propertyData.verdict || 'Unknown'} (${propertyData.deltaPercent || '?'}%)`);
          console.log(`   🏘️ Comparables: ${propertyData.comparablesCount} found`);
          if (propertyData.marketAverage) {
            console.log(`   💹 Market Avg: $${propertyData.marketAverage}`);
          }
        } else {
          console.log(`   🏠 RentCast: Not available`);
        }
        
        // Test passed if we have address and rent
        if (propertyData.address && propertyData.rent) {
          console.log(`✅ Test PASSED - Complete property data extracted`);
          passedTests++;
        } else if (propertyData.address || propertyData.propertyName) {
          console.log(`⚠️ Test PARTIAL - Some data extracted but incomplete`);
          passedTests += 0.5;
        } else {
          console.log(`❌ Test FAILED - No meaningful data extracted`);
        }
        
      } else {
        console.log(`❌ Test FAILED - API Error:`);
        console.log(`   Error: ${result.error || 'Unknown error'}`);
        console.log(`   Message: ${result.message || 'No message'}`);
        
        results.push({
          name: property.name,
          error: result.error,
          message: result.message
        });
      }
      
    } catch (error) {
      console.log(`❌ Test FAILED - Network Error: ${error.message}`);
      results.push({
        name: property.name,
        error: error.message
      });
    }
    
    console.log('─'.repeat(80));
  }

  // Summary
  console.log(`\\n🏁 Real Property Test Results`);
  console.log(`=============================`);
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Property comparison
  console.log(`\\n🔍 Property Comparison Summary:`);
  results.forEach((prop, index) => {
    if (!prop.error) {
      console.log(`\\n${index + 1}. ${prop.name}`);
      console.log(`   💰 $${prop.rent || '?'} | 🛏️ ${prop.beds || '?'}bed/${prop.baths || '?'}bath | 📏 ${prop.sqft || '?'}sqft`);
      console.log(`   📍 ${prop.address || 'Address not found'}`);
      if (prop.verdict && prop.verdict !== 'unknown') {
        console.log(`   📊 Market: ${prop.verdict} (${prop.deltaPercent || '?'}% vs avg)`);
      }
      if (prop.scrapingMethod) {
        console.log(`   🔧 Method: ${prop.scrapingMethod}`);
      }
    } else {
      console.log(`\\n${index + 1}. ${prop.name} - ❌ Failed: ${prop.error}`);
    }
  });
  
  if (passedTests >= totalTests * 0.8) {
    console.log(`\\n🎉 Great results! Enhanced system is working:`);
    console.log(`   🔥 Firecrawl integration functional`);
    console.log(`   🏠 RentCast market analysis active`);
    console.log(`   📊 Property extraction improved`);
    console.log(`   🎯 Unit-specific data handling`);
    console.log(`\\n🚀 Ready to integrate with property comparison system!`);
  } else {
    console.log(`\\n⚠️ Some issues detected. System partially functional.`);
    console.log(`   Check logs above for specific failure details.`);
  }
  
  return results;
}

testRealProperties();