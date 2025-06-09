#!/usr/bin/env node

/**
 * Unit tests for the enhanced context analysis logic
 * Tests the location detection and property detail extraction
 */

// Simulate the enhanced context analysis logic from our improvements
function analyzeContext(userMessage) {
  let detectedLocation = null;
  let detectedPropertyDetails = null;
  let contextAnalysis = {};
  
  if (userMessage && userMessage.length > 5) {
    console.log('🔍 ENHANCED CONTEXT ANALYSIS: Analyzing user message for location and property details');
    
    // Enhanced location detection
    const locationPatterns = [
      /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})\b/, // City, State
      /\b([A-Z][a-z]+)\s*,?\s*([A-Z]{2})\b/, // City State or City, State
      /\b(\d{5}(?:-\d{4})?)\b/, // ZIP codes
      /\b(austin|dallas|houston|san antonio|chicago|new york|los angeles|miami|atlanta|denver|seattle|boston|philadelphia|phoenix|detroit|buffalo|rochester|syracuse|albany|orlando|tampa|fort lauderdale|jacksonville|nashville|memphis|charlotte|raleigh|richmond|virginia beach|washington|baltimore|san diego|san francisco|san jose|sacramento|fresno|riverside|bakersfield|stockton|anaheim|santa ana|portland|las vegas|reno|salt lake city|boise|tucson|albuquerque|colorado springs|omaha|wichita|kansas city|st louis|milwaukee|madison|green bay|minneapolis|saint paul|fargo|sioux falls|des moines|cedar rapids|oklahoma city|tulsa|little rock|jackson|birmingham|montgomery|mobile|huntsville|knoxville|clarksville|columbus|cleveland|cincinnati|toledo|akron|dayton|youngstown|canton|louisville|lexington|indianapolis|fort wayne|evansville|south bend|grand rapids|flint|lansing|ann arbor|detroit|dearborn)\b/gi // Major cities
    ];
    
    for (const pattern of locationPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        detectedLocation = match[0];
        console.log('✅ Detected location:', detectedLocation);
        break;
      }
    }
    
    // Enhanced property details detection
    const rentMatch = userMessage.match(/\$[\d,]+(?:\.\d{2})?/);
    const bedroomMatch = userMessage.match(/(\d+)\s*(?:bed|br|bedroom)/i);
    const bathroomMatch = userMessage.match(/(\d+(?:\.\d)?)\s*(?:bath|ba|bathroom)/i);
    const addressMatch = userMessage.match(/\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|dr|drive|rd|road|blvd|boulevard|way|lane|ln|ct|court|pl|place)\b/i);
    const squareFootageMatch = userMessage.match(/(\d+)\s*(?:sq\.?\s?ft|sqft|square\s+feet)/i);
    const apartmentTypeMatch = userMessage.match(/\b(studio|loft|condo|apartment|house|townhome|duplex)\b/i);
    const amenitiesMatch = userMessage.match(/\b(parking|garage|pool|gym|balcony|patio|dishwasher|washer|dryer|pets?\s+allowed|dog\s+friendly|cat\s+friendly)\b/gi);
    const floorMatch = userMessage.match(/(\d+)(?:st|nd|rd|th)\s+floor/i);
    const yearBuiltMatch = userMessage.match(/built\s+in\s+(\d{4})|(\d{4})\s+built/i);
    
    if (rentMatch || bedroomMatch || bathroomMatch || addressMatch || squareFootageMatch || apartmentTypeMatch) {
      detectedPropertyDetails = {
        rent: rentMatch ? rentMatch[0] : null,
        bedrooms: bedroomMatch ? bedroomMatch[1] : null,
        bathrooms: bathroomMatch ? bathroomMatch[1] : null,
        address: addressMatch ? addressMatch[0] : null,
        squareFootage: squareFootageMatch ? parseInt(squareFootageMatch[1]) : null,
        propertyType: apartmentTypeMatch ? apartmentTypeMatch[1] : null,
        amenities: amenitiesMatch || [],
        floor: floorMatch ? parseInt(floorMatch[1]) : null,
        yearBuilt: yearBuiltMatch ? parseInt(yearBuiltMatch[1] || yearBuiltMatch[2]) : null
      };
      console.log('✅ Detected enhanced property details:', detectedPropertyDetails);
    }
    
    // Chat type analysis
    const marketAnalysisKeywords = ['average rent', 'market data', 'rent trends', 'market conditions', 'comparable', 'median rent', 'rent prices'];
    const negotiationKeywords = ['negotiate', 'negotiation', 'below asking', 'rent reduction', 'discount', 'lower rent'];
    
    contextAnalysis = {
      hasLocation: !!detectedLocation,
      hasPropertyDetails: !!detectedPropertyDetails,
      isMarketAnalysis: marketAnalysisKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)),
      isNegotiationHelp: negotiationKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)),
      needsLocationPrompt: marketAnalysisKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) && !detectedLocation,
      needsPropertyPrompt: negotiationKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) && !detectedPropertyDetails
    };
    
    console.log('📊 Context Analysis:', contextAnalysis);
  }

  return {
    detectedLocation,
    detectedPropertyDetails,
    contextAnalysis
  };
}

// Test cases
const testCases = [
  {
    name: "Market Analysis Without Location",
    message: "What's the average rent for similar properties in this neighborhood?",
    expected: {
      contextAnalysis: {
        isMarketAnalysis: true,
        needsLocationPrompt: true,
        hasLocation: false
      }
    }
  },
  {
    name: "Market Analysis With Location",
    message: "What's the average rent for 2BR apartments in Austin, TX?",
    expected: {
      detectedLocation: "Austin, TX",
      contextAnalysis: {
        isMarketAnalysis: true,
        hasLocation: true,
        needsLocationPrompt: false
      }
    }
  },
  {
    name: "Property Analysis With Details",
    message: "I found a 2BR/1BA apartment at 123 Main St, Austin TX for $2,400/month with parking and gym. Should I negotiate?",
    expected: {
      detectedLocation: "Austin TX",
      detectedPropertyDetails: {
        rent: "$2,400",
        bedrooms: "2",
        bathrooms: "1",
        address: "123 Main St"
      },
      contextAnalysis: {
        hasPropertyDetails: true,
        hasLocation: true
      }
    }
  },
  {
    name: "Negotiation Help Without Context",
    message: "How much below asking price is reasonable to negotiate?",
    expected: {
      contextAnalysis: {
        isNegotiationHelp: true,
        needsPropertyPrompt: true,
        hasPropertyDetails: false
      }
    }
  },
  {
    name: "Enhanced Property Specificity Test",
    message: "I'm looking at a 1200 sq ft studio loft built in 2010 for $2800/month in Chicago with parking and balcony",
    expected: {
      detectedLocation: "Chicago",
      detectedPropertyDetails: {
        squareFootage: 1200,
        propertyType: "studio",
        yearBuilt: 2010,
        rent: "$2800",
        amenities: ["parking", "balcony"]
      }
    }
  }
];

function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📝 Message: "${testCase.message}"`);
  
  const result = analyzeContext(testCase.message);
  
  // Check if expectations are met
  let testPassed = true;
  const expected = testCase.expected;
  
  if (expected.detectedLocation) {
    if (result.detectedLocation !== expected.detectedLocation) {
      console.log(`  ❌ Expected location: ${expected.detectedLocation}, got: ${result.detectedLocation}`);
      testPassed = false;
    } else {
      console.log(`  ✅ Location detected correctly: ${result.detectedLocation}`);
    }
  }
  
  if (expected.contextAnalysis) {
    Object.entries(expected.contextAnalysis).forEach(([key, expectedValue]) => {
      const actualValue = result.contextAnalysis[key];
      if (actualValue !== expectedValue) {
        console.log(`  ❌ Expected ${key}: ${expectedValue}, got: ${actualValue}`);
        testPassed = false;
      } else {
        console.log(`  ✅ ${key}: ${actualValue}`);
      }
    });
  }
  
  if (expected.detectedPropertyDetails) {
    if (!result.detectedPropertyDetails) {
      console.log(`  ❌ Expected property details but none detected`);
      testPassed = false;
    } else {
      Object.entries(expected.detectedPropertyDetails).forEach(([key, expectedValue]) => {
        const actualValue = result.detectedPropertyDetails[key];
        if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
          console.log(`  ❌ Expected ${key}: ${JSON.stringify(expectedValue)}, got: ${JSON.stringify(actualValue)}`);
          testPassed = false;
        } else {
          console.log(`  ✅ ${key}: ${JSON.stringify(actualValue)}`);
        }
      });
    }
  }
  
  if (testPassed) {
    console.log('  ✅ Test PASSED');
  } else {
    console.log('  ❌ Test FAILED');
  }
  
  return { testCase: testCase.name, passed: testPassed };
}

function runAllTests() {
  console.log('🚀 Testing Enhanced Context Analysis Logic');
  console.log('=' * 50);
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = runTest(testCase);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('=' * 30);
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testCase}`);
  });
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Context analysis improvements are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
  
  return results;
}

// Run tests
runAllTests();