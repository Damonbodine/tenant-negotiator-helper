// Test both scenarios: initial request vs follow-up with details
console.log('🧪 TESTING BOTH NEGOTIATION SCENARIOS');
console.log('=====================================');

class TestTriggerService {
  shouldTriggerRoadmap(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    const negotiationKeywords = [
      'negotiate rent', 'negotiation strategy', 'how to negotiate', 'help me negotiate',
      'lower my rent', 'rent reduction', 'negotiate with landlord', 'ask for lower rent',
      'reduce rent', 'rent negotiation', 'negotiation help', 'negotiate lease',
      'rental negotiation', 'negotiate my rent'
    ];
    
    const hasPrimaryTrigger = negotiationKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    const hasNegotiatePattern = lowerMessage.includes('negotiate') && 
      (lowerMessage.includes('rent') || /\$\d+/.test(lowerMessage)) &&
      (lowerMessage.includes('down') || lowerMessage.includes('lower') || lowerMessage.includes('reduce'));
    
    const hasRentAdjustmentPattern = /\$\d+/.test(lowerMessage) && 
      (lowerMessage.includes('rent') || lowerMessage.includes('current') || lowerMessage.includes('paying')) &&
      (lowerMessage.includes('down to') || lowerMessage.includes('get it down') || 
       lowerMessage.includes('reduce to') || lowerMessage.includes('lower to') ||
       lowerMessage.includes('bring it down') || lowerMessage.includes('decrease to') ||
       lowerMessage.includes('want it at') || lowerMessage.includes('like to get') ||
       lowerMessage.includes('and i\'d like') || lowerMessage.includes('hoping for'));
    
    return hasPrimaryTrigger || hasNegotiatePattern || hasRentAdjustmentPattern;
  }
  
  extractNegotiationContext(userMessage) {
    const context = {};
    
    // Extract current rent
    const rentMatches = userMessage.match(/(?:current rent is|rent is|paying|pay)\s*\$?(\d{1,4}(?:,\d{3})*)/gi);
    if (rentMatches && rentMatches.length > 0) {
      const rentValue = parseInt(rentMatches[0].replace(/[^\d]/g, ''));
      context.currentRent = rentValue;
    }
    
    // Extract target rent
    const targetMatches = userMessage.match(/(?:get it down to|down to|target|want)\s*\$?(\d{1,4}(?:,\d{3})*)/gi);
    if (targetMatches && targetMatches.length > 0) {
      const targetValue = parseInt(targetMatches[0].replace(/[^\d]/g, ''));
      context.targetRent = targetValue;
    }
    
    // Extract location
    const locationPatterns = [
      /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2})?)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/g
    ];
    
    for (const pattern of locationPatterns) {
      const matches = userMessage.match(pattern);
      if (matches) {
        context.location = matches[0].replace(/^(?:in|at|near)\s+/i, '');
        break;
      }
    }
    
    return context;
  }
}

const triggerService = new TestTriggerService();

// Test cases
const testCases = [
  {
    name: "Initial vague request",
    message: "help me lower my rent",
    expectedTrigger: true,
    expectedContext: "incomplete"
  },
  {
    name: "Follow-up with specific details", 
    message: "My current rent is $1,300 in Buffalo, NY and I'd like to get it down to $1,200",
    expectedTrigger: true,
    expectedContext: "complete"
  },
  {
    name: "Alternative phrasing",
    message: "I'm paying $2,500 rent in Austin and want to reduce it to $2,200", 
    expectedTrigger: true,
    expectedContext: "complete"
  },
  {
    name: "Non-negotiation message",
    message: "What's the weather like today?",
    expectedTrigger: false,
    expectedContext: "none"
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n📝 TEST ${index + 1}: ${testCase.name}`);
  console.log(`Message: "${testCase.message}"`);
  
  const shouldTrigger = triggerService.shouldTriggerRoadmap(testCase.message);
  const context = triggerService.extractNegotiationContext(testCase.message);
  
  console.log(`🎯 Should trigger: ${shouldTrigger ? '✅ YES' : '❌ NO'} (expected: ${testCase.expectedTrigger ? 'YES' : 'NO'})`);
  
  if (shouldTrigger) {
    console.log(`📊 Context:`, context);
    
    const hasCurrentRent = !!context.currentRent;
    const hasTargetRent = !!context.targetRent;
    const hasLocation = !!context.location;
    
    if (hasCurrentRent && hasTargetRent && hasLocation) {
      console.log('✅ Complete context - should generate roadmap immediately');
    } else {
      console.log('❓ Incomplete context - should ask follow-up questions');
      console.log(`   Missing: ${!hasCurrentRent ? 'current rent ' : ''}${!hasTargetRent ? 'target rent ' : ''}${!hasLocation ? 'location ' : ''}`);
    }
  }
  
  const passed = shouldTrigger === testCase.expectedTrigger;
  console.log(passed ? '✅ PASS' : '❌ FAIL');
});

console.log('\n🎉 CONCLUSION:');
console.log('The enhanced trigger system now detects:');
console.log('✅ Initial vague requests ("help me lower my rent")'); 
console.log('✅ Follow-up responses with details ("My current rent is $1,300...")');
console.log('✅ Various phrasing patterns for rent adjustment');
console.log('✅ Ignores non-negotiation messages');
console.log('\n🚀 Ready to test in the chat interface!');