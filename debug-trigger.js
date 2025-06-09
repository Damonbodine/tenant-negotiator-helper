// Debug trigger detection
const message = "Help me negotiate my $2,500 rent in Austin, TX down by $300";

// Test the trigger detection logic directly
class TestTriggerService {
  shouldTriggerRoadmap(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Primary triggers - direct negotiation requests
    const negotiationKeywords = [
      'negotiate rent',
      'negotiation strategy',
      'how to negotiate',
      'help me negotiate',
      'lower my rent',
      'rent reduction',
      'negotiate with landlord',
      'ask for lower rent',
      'reduce rent',
      'rent negotiation',
      'negotiation help',
      'negotiate lease',
      'rental negotiation',
      'negotiate my rent'
    ];
    
    // Check for primary triggers
    const hasPrimaryTrigger = negotiationKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    // Enhanced pattern matching: "negotiate" + mention of rent/amount + action
    const hasNegotiatePattern = lowerMessage.includes('negotiate') && 
      (lowerMessage.includes('rent') || /\$\d+/.test(lowerMessage)) &&
      (lowerMessage.includes('down') || lowerMessage.includes('lower') || lowerMessage.includes('reduce'));
    
    const secondaryKeywords = [
      'too expensive',
      'overpriced', 
      'can\'t afford',
      'budget tight',
      'rent too high',
      'above market',
      'similar properties cheaper'
    ];
    
    const hasSecondaryTrigger = secondaryKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    ) && (
      lowerMessage.includes('rent') || 
      lowerMessage.includes('apartment') || 
      lowerMessage.includes('lease')
    );
    
    console.log(`\n🔍 Trigger Analysis:`);
    console.log(`   Primary trigger: ${hasPrimaryTrigger}`);
    console.log(`   Negotiate pattern: ${hasNegotiatePattern}`);
    console.log(`   Secondary trigger: ${hasSecondaryTrigger}`);
    
    return hasPrimaryTrigger || hasNegotiatePattern || hasSecondaryTrigger;
  }
  
  extractNegotiationContext(userMessage) {
    const context = {};
    
    // Extract current rent
    const rentMatches = userMessage.match(/\$?(\d{1,4}(?:,\d{3})*)\s*(?:\/month|per month|rent|monthly)/gi);
    if (rentMatches && rentMatches.length > 0) {
      const rentValue = parseInt(rentMatches[0].replace(/[^\d]/g, ''));
      context.currentRent = rentValue;
    }
    
    // Extract target rent or reduction - UPDATED with our fix
    const reductionMatches = userMessage.match(/reduce.*by.*\$?(\d+)|lower.*by.*\$?(\d+)|down by.*\$?(\d+)|\$?(\d+).*less/gi);
    if (reductionMatches && context.currentRent) {
      const reduction = parseInt(reductionMatches[0].replace(/[^\d]/g, ''));
      context.targetRent = context.currentRent - reduction;
      console.log(`🎯 Extracted reduction: $${reduction}, Target rent: $${context.targetRent}`);
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

console.log('🔍 DEBUGGING TRIGGER DETECTION');
console.log('================================');
console.log(`Message: "${message}"`);

const testTrigger = new TestTriggerService();
const shouldTrigger = testTrigger.shouldTriggerRoadmap(message);
console.log(`\n🎯 Should trigger negotiation roadmap: ${shouldTrigger ? '✅ YES' : '❌ NO'}`);

if (shouldTrigger) {
  const context = testTrigger.extractNegotiationContext(message);
  console.log(`\n📊 Extracted context:`, context);
  
  // Check our fix
  if (context.targetRent) {
    console.log(`\n✅ TARGET RENT FIX WORKING: $${context.currentRent} → $${context.targetRent}`);
  }
} else {
  console.log('\n❌ TRIGGER NOT DETECTED - This is the problem!');
}

console.log('\n💡 CONCLUSION:');
if (shouldTrigger) {
  console.log('✅ Trigger detection works - issue is likely authentication in edge function');
  console.log('🔧 Need to check browser console for 401 errors');
} else {
  console.log('❌ Trigger detection broken - need to fix keywords');
}