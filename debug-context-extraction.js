// Debug context extraction for the user's message
const testMessage = "My current rent is $1,300 in Buffalo, NY and I'd like to get it down to $1,200";

console.log('🔍 DEBUGGING CONTEXT EXTRACTION');
console.log('================================');
console.log(`Message: "${testMessage}"`);

// Test the trigger detection logic
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
    
    // NEW: Context-rich rent adjustment patterns
    const hasRentAdjustmentPattern = /\$\d+/.test(lowerMessage) && 
      (lowerMessage.includes('rent') || lowerMessage.includes('current') || lowerMessage.includes('paying')) &&
      (lowerMessage.includes('down to') || lowerMessage.includes('get it down') || 
       lowerMessage.includes('reduce to') || lowerMessage.includes('lower to') ||
       lowerMessage.includes('bring it down') || lowerMessage.includes('decrease to') ||
       lowerMessage.includes('want it at') || lowerMessage.includes('like to get') ||
       lowerMessage.includes('and i\'d like') || lowerMessage.includes('hoping for'));
    
    console.log(`Primary trigger found: ${hasPrimaryTrigger}`);
    console.log(`Negotiate pattern found: ${hasNegotiatePattern}`);
    console.log(`🆕 Rent adjustment pattern found: ${hasRentAdjustmentPattern}`);
    
    return hasPrimaryTrigger || hasNegotiatePattern || hasRentAdjustmentPattern;
  }
  
  extractNegotiationContext(userMessage) {
    console.log('\n📊 EXTRACTING CONTEXT...');
    const context = {};
    
    // Extract current rent - multiple patterns
    console.log('🔍 Looking for current rent...');
    const rentMatches = userMessage.match(/(?:current rent is|rent is|paying|pay)\s*\$?(\d{1,4}(?:,\d{3})*)/gi);
    console.log('Rent matches found:', rentMatches);
    
    if (rentMatches && rentMatches.length > 0) {
      const rentValue = parseInt(rentMatches[0].replace(/[^\d]/g, ''));
      context.currentRent = rentValue;
      console.log(`✅ Current rent extracted: $${rentValue}`);
    } else {
      console.log('❌ No current rent found');
    }
    
    // Extract target rent
    console.log('\n🔍 Looking for target rent...');
    const targetMatches = userMessage.match(/(?:get it down to|down to|target|want)\s*\$?(\d{1,4}(?:,\d{3})*)/gi);
    console.log('Target matches found:', targetMatches);
    
    if (targetMatches && targetMatches.length > 0) {
      const targetValue = parseInt(targetMatches[0].replace(/[^\d]/g, ''));
      context.targetRent = targetValue;
      console.log(`✅ Target rent extracted: $${targetValue}`);
    } else {
      console.log('❌ No target rent found');
    }
    
    // Extract location
    console.log('\n🔍 Looking for location...');
    const locationPatterns = [
      /(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2})?)/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/g
    ];
    
    for (const pattern of locationPatterns) {
      const matches = userMessage.match(pattern);
      if (matches) {
        context.location = matches[0].replace(/^(?:in|at|near)\s+/i, '');
        console.log(`✅ Location extracted: ${context.location}`);
        break;
      }
    }
    
    if (!context.location) {
      console.log('❌ No location found');
    }
    
    return context;
  }
}

const triggerService = new TestTriggerService();

console.log('\n🎯 TESTING TRIGGER DETECTION...');
const shouldTrigger = triggerService.shouldTriggerRoadmap(testMessage);
console.log(`\nShould trigger roadmap: ${shouldTrigger ? '✅ YES' : '❌ NO'}`);

console.log('\n📊 TESTING CONTEXT EXTRACTION...');
const context = triggerService.extractNegotiationContext(testMessage);
console.log('\nFinal extracted context:', context);

console.log('\n🔧 ANALYSIS:');
if (context.currentRent && context.targetRent && context.location) {
  console.log('✅ Complete context extracted - should generate roadmap immediately');
  console.log(`✅ Current: $${context.currentRent}, Target: $${context.targetRent}, Location: ${context.location}`);
} else {
  console.log('❌ Incomplete context - will ask follow-up questions');
  console.log('Missing:', {
    currentRent: !context.currentRent,
    targetRent: !context.targetRent, 
    location: !context.location
  });
}