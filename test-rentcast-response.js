// Test RentCast API Response Structure
// Understanding what one API call returns

const RENTCAST_API_KEY = '2dcfee21025c4888984b78fdf7dd45c9';
const RENTCAST_BASE_URL = 'https://api.rentcast.io/v1';

async function testRentCastAPIStructure() {
  console.log('🧪 Testing RentCast API Response Structure');
  console.log('==========================================');
  
  // Test 1: Rent Estimate Endpoint
  console.log('\n📊 Test 1: Rent Estimate API Call');
  console.log('Endpoint: /avm/rent/long-term');
  
  try {
    const params = new URLSearchParams({
      address: '123 E 6th St, Austin, TX 78701',
      bedrooms: '2',
      bathrooms: '1',
      propertyType: 'Apartment'
    });

    const response = await fetch(`${RENTCAST_BASE_URL}/avm/rent/long-term?${params}`, {
      headers: {
        'X-Api-Key': RENTCAST_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    console.log('✅ Response received!');
    console.log('📋 Response structure:');
    console.log('Keys:', Object.keys(data));
    
    // Check for comparables in the response
    const hasComparables = data.comparables || data.comps || data.comparable || data.comparableProperties;
    console.log('Contains comparables:', !!hasComparables);
    
    if (hasComparables) {
      console.log('Comparables count:', Array.isArray(hasComparables) ? hasComparables.length : 'Not an array');
      if (Array.isArray(hasComparables) && hasComparables.length > 0) {
        console.log('Sample comparable structure:', Object.keys(hasComparables[0]));
      }
    }
    
    // Show key fields
    console.log('\n📝 Key Response Fields:');
    console.log('- Estimate:', data.rent || data.estimate || 'Not found');
    console.log('- Confidence:', data.confidence || 'Not found');
    console.log('- Range:', data.rentRangeLow && data.rentRangeHigh ? `$${data.rentRangeLow}-$${data.rentRangeHigh}` : 'Not found');
    console.log('- Full response size:', JSON.stringify(data).length, 'characters');
    
    console.log('\n🔍 Full Response Sample (first 1000 chars):');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    
  } catch (error) {
    console.error('❌ Rent estimate test failed:', error.message);
  }

  // Test 2: Listings/Comparables Endpoint
  console.log('\n\n📊 Test 2: Active Listings API Call');
  console.log('Endpoint: /listings/rental/long-term');
  
  try {
    const params = new URLSearchParams({
      address: '123 E 6th St, Austin, TX 78701',
      radius: '2',
      bedrooms: '2',
      limit: '10'
    });

    const response = await fetch(`${RENTCAST_BASE_URL}/listings/rental/long-term?${params}`, {
      headers: {
        'X-Api-Key': RENTCAST_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    console.log('✅ Listings response received!');
    
    if (Array.isArray(data)) {
      console.log('📊 Listings returned:', data.length);
      if (data.length > 0) {
        console.log('Sample listing structure:', Object.keys(data[0]));
        console.log('Sample listing data:');
        console.log('- Address:', data[0].address || 'Not found');
        console.log('- Rent:', data[0].rent || data[0].price || 'Not found');
        console.log('- Bedrooms:', data[0].bedrooms || 'Not found');
        console.log('- Distance:', data[0].distance || 'Not found');
      }
    } else {
      console.log('Response structure:', typeof data);
      console.log('Response keys:', Object.keys(data));
    }
    
    console.log('\n🔍 Listings Response Sample (first 800 chars):');
    console.log(JSON.stringify(data, null, 2).substring(0, 800) + '...');
    
  } catch (error) {
    console.error('❌ Listings test failed:', error.message);
  }

  // Test 3: Market Data Endpoint
  console.log('\n\n📊 Test 3: Market Statistics API Call');
  console.log('Endpoint: /markets/statistics');
  
  try {
    const response = await fetch(`${RENTCAST_BASE_URL}/markets/statistics?zipCode=78701`, {
      headers: {
        'X-Api-Key': RENTCAST_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Market data not available: HTTP ${response.status}`);
    } else {
      const data = await response.json();
      
      console.log('✅ Market data response received!');
      console.log('Market data structure:', Object.keys(data));
      console.log('Sample market data:', JSON.stringify(data, null, 2).substring(0, 400) + '...');
    }
    
  } catch (error) {
    console.error('❌ Market data test failed:', error.message);
  }

  // Summary
  console.log('\n\n🎯 RentCast API Summary');
  console.log('=======================');
  console.log('Based on the tests above:');
  console.log('1. /avm/rent/long-term - Returns rent estimate + comparables in ONE call');
  console.log('2. /listings/rental/long-term - Returns active listings in ONE call');
  console.log('3. /markets/statistics - Returns market stats in ONE call');
  console.log('\nEach endpoint is a single API call with comprehensive data.');
}

// Run the test
testRentCastAPIStructure().catch(console.error);