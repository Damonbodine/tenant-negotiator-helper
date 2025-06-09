#!/usr/bin/env node

/**
 * Test script to validate chat system improvements
 * Tests the enhanced context analysis, location detection, and property specificity
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const CHAT_ENDPOINT = `${SUPABASE_URL}/functions/v1/chat-ai-enhanced`;

// Test cases based on our market research analysis
const testCases = [
  {
    name: "Market Analysis Without Location",
    message: "What's the average rent for similar properties in this neighborhood?",
    expected: {
      shouldPromptForLocation: true,
      contextAnalysis: {
        isMarketAnalysis: true,
        needsLocationPrompt: true
      }
    }
  },
  {
    name: "Market Analysis With Location",
    message: "What's the average rent for 2BR apartments in Austin, TX?",
    expected: {
      shouldPromptForLocation: false,
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
      contextAnalysis: {
        hasPropertyDetails: true,
        hasLocation: true
      },
      detectedPropertyDetails: {
        rent: "$2,400",
        bedrooms: "2",
        bathrooms: "1"
      }
    }
  },
  {
    name: "Negotiation Help Without Context",
    message: "How much below asking price is reasonable to negotiate?",
    expected: {
      contextAnalysis: {
        isNegotiationHelp: true,
        needsPropertyPrompt: true
      }
    }
  },
  {
    name: "Enhanced Property Specificity Test",
    message: "I'm looking at a 1200 sq ft studio loft built in 2010 for $2800/month in Chicago with parking and balcony",
    expected: {
      detectedPropertyDetails: {
        squareFootage: 1200,
        propertyType: "loft",
        yearBuilt: 2010,
        amenities: ["parking", "balcony"]
      }
    }
  }
];

async function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📝 Message: "${testCase.message}"`);
  
  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      body: JSON.stringify({
        message: testCase.message,
        test: false, // Use normal mode to test improvements
        enableToolCalling: true,
        availableTools: ['analyze_property', 'get_market_data', 'search_knowledge_base']
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Analyze results
    console.log('📊 Context Analysis Results:');
    if (result.contextAnalysis) {
      console.log('  ✅ Enhanced context analysis present');
      console.log(`  🎯 Detected Location: ${result.contextAnalysis.detectedLocation || 'None'}`);
      console.log(`  🏠 Has Property Details: ${result.contextAnalysis.hasPropertyDetails || false}`);
      console.log(`  📈 Is Market Analysis: ${result.contextAnalysis.isMarketAnalysis || false}`);
      console.log(`  🤝 Is Negotiation Help: ${result.contextAnalysis.isNegotiationHelp || false}`);
      console.log(`  ❗ Needs Location Prompt: ${result.contextAnalysis.needsLocationPrompt || false}`);
      console.log(`  ❗ Needs Property Prompt: ${result.contextAnalysis.needsPropertyPrompt || false}`);
      
      if (result.contextAnalysis.detectedPropertyDetails) {
        console.log('  🏗️ Property Details:');
        Object.entries(result.contextAnalysis.detectedPropertyDetails).forEach(([key, value]) => {
          if (value) console.log(`    - ${key}: ${JSON.stringify(value)}`);
        });
      }
    } else {
      console.log('  ❌ No context analysis found');
    }
    
    // Check if expectations are met
    let testPassed = true;
    const expected = testCase.expected;
    
    if (expected.contextAnalysis) {
      Object.entries(expected.contextAnalysis).forEach(([key, expectedValue]) => {
        const actualValue = result.contextAnalysis?.[key];
        if (actualValue !== expectedValue) {
          console.log(`  ❌ Expected ${key}: ${expectedValue}, got: ${actualValue}`);
          testPassed = false;
        }
      });
    }
    
    if (expected.detectedPropertyDetails) {
      Object.entries(expected.detectedPropertyDetails).forEach(([key, expectedValue]) => {
        const actualValue = result.contextAnalysis?.detectedPropertyDetails?.[key];
        if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
          console.log(`  ❌ Expected ${key}: ${JSON.stringify(expectedValue)}, got: ${JSON.stringify(actualValue)}`);
          testPassed = false;
        }
      });
    }
    
    if (testPassed) {
      console.log('  ✅ Test PASSED');
    } else {
      console.log('  ❌ Test FAILED');
    }
    
    // Show response snippet
    console.log(`📝 Response snippet: "${result.text?.substring(0, 150)}..."`);
    
    return { testCase: testCase.name, passed: testPassed, result };
    
  } catch (error) {
    console.log(`  ❌ Test ERROR: ${error.message}`);
    return { testCase: testCase.name, passed: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Testing Chat System Improvements');
  console.log('=' * 50);
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
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
    console.log('\n🎉 All tests passed! Chat improvements are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
  
  return results;
}

// Run tests if this script is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testCases };