// Comprehensive Artifact System Testing
// Tests current affordability calculator vs negotiation roadmap integration

console.log('🧪 Starting Comprehensive Artifact System Testing...\n');

// Test scenarios to verify current behavior
const testScenarios = [
  {
    id: 'T001',
    category: 'Affordability Only',
    message: 'Can I afford $2500/month rent on a $80000 salary?',
    expectedTriggers: ['affordability'],
    description: 'Should trigger only affordability calculator'
  },
  {
    id: 'T002', 
    category: 'Negotiation Only',
    message: 'Help me negotiate my rent down with my landlord',
    expectedTriggers: ['negotiation'],
    description: 'Should trigger only negotiation roadmap'
  },
  {
    id: 'T003',
    category: 'Budget + Specific Rent',
    message: 'Show budget calculator for $2500 rent',
    expectedTriggers: ['affordability'],
    description: 'Direct affordability request with amount'
  },
  {
    id: 'T004',
    category: 'Negotiation + Amount',
    message: 'I need help negotiating my $2500/month rent down by $200',
    expectedTriggers: ['negotiation'],
    description: 'Specific negotiation request with amounts'
  },
  {
    id: 'T005',
    category: 'Potential Conflict',
    message: 'My $2500 rent is too expensive for my budget, help me negotiate it down',
    expectedTriggers: ['both', 'negotiation', 'affordability'],
    description: 'Could trigger both - test for conflicts'
  },
  {
    id: 'T006',
    category: 'Financial Stress',
    message: 'I can\'t afford my current rent anymore, what should I do?',
    expectedTriggers: ['affordability', 'negotiation'],
    description: 'Financial stress scenario - may trigger both'
  },
  {
    id: 'T007',
    category: 'Location Context',
    message: 'Help me negotiate my $2800 rent in Buffalo, NY down to $2400',
    expectedTriggers: ['negotiation'],
    description: 'Location-specific negotiation (tests document_chunks integration potential)'
  },
  {
    id: 'T008',
    category: 'Market Analysis',
    message: 'Is $2500 too much for a 2BR in Buffalo? Should I negotiate?',
    expectedTriggers: ['negotiation', 'market_analysis'],
    description: 'Market question leading to negotiation advice'
  },
  {
    id: 'T009',
    category: 'Quick Actions',
    message: 'Show affordability analysis',
    expectedTriggers: ['affordability'],
    description: 'Direct quick action trigger'
  },
  {
    id: 'T010',
    category: 'Complex Scenario',
    message: 'I make $75000, paying $2800 for 1BR in NYC, market rate is $2400, need negotiation strategy',
    expectedTriggers: ['both'],
    description: 'Complex scenario with income, amounts, market data, and negotiation request'
  }
];

// Testing framework
class ArtifactTestFramework {
  constructor() {
    this.results = [];
    this.conflicts = [];
    this.triggerStats = {
      affordability: 0,
      negotiation: 0,
      both: 0,
      neither: 0
    };
  }

  // Simulate trigger detection (based on actual logic)
  detectAffordabilityTrigger(message) {
    const affordabilityKeywords = [
      'afford', 'budget', 'income', 'salary', 'expenses', 'cost analysis',
      'financial', 'calculation', 'calculator', 'show budget', 'affordability analysis'
    ];
    
    const lowerMessage = message.toLowerCase();
    return affordabilityKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  detectNegotiationTrigger(message) {
    const negotiationKeywords = [
      'negotiate', 'negotiation', 'lower rent', 'reduce rent', 'rent reduction',
      'negotiate with landlord', 'ask for lower', 'rent down', 'strategy',
      'too expensive', 'overpriced', 'help me negotiate'
    ];
    
    const lowerMessage = message.toLowerCase();
    return negotiationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  runTest(scenario) {
    console.log(`\n🔍 Testing ${scenario.id}: ${scenario.category}`);
    console.log(`Message: "${scenario.message}"`);
    
    const affordabilityDetected = this.detectAffordabilityTrigger(scenario.message);
    const negotiationDetected = this.detectNegotiationTrigger(scenario.message);
    
    let actualTriggers = [];
    if (affordabilityDetected) actualTriggers.push('affordability');
    if (negotiationDetected) actualTriggers.push('negotiation');
    if (actualTriggers.length === 0) actualTriggers.push('neither');
    if (actualTriggers.length === 2) actualTriggers.push('both');

    // Check for conflicts
    const hasConflict = affordabilityDetected && negotiationDetected;
    if (hasConflict) {
      this.conflicts.push({
        scenario: scenario.id,
        message: scenario.message,
        triggers: actualTriggers
      });
    }

    // Update stats
    if (affordabilityDetected && negotiationDetected) {
      this.triggerStats.both++;
    } else if (affordabilityDetected) {
      this.triggerStats.affordability++;
    } else if (negotiationDetected) {
      this.triggerStats.negotiation++;
    } else {
      this.triggerStats.neither++;
    }

    // Analyze result
    const expectedSet = new Set(scenario.expectedTriggers);
    const actualSet = new Set(actualTriggers);
    const matches = [...expectedSet].some(expected => actualSet.has(expected));
    
    const result = {
      scenario: scenario.id,
      category: scenario.category,
      message: scenario.message,
      expected: scenario.expectedTriggers,
      actual: actualTriggers,
      matches: matches,
      hasConflict: hasConflict,
      pass: matches
    };

    this.results.push(result);

    // Log result
    console.log(`Expected: [${scenario.expectedTriggers.join(', ')}]`);
    console.log(`Actual: [${actualTriggers.join(', ')}]`);
    console.log(`Result: ${result.pass ? '✅ PASS' : '❌ FAIL'}`);
    if (hasConflict) console.log(`⚠️  CONFLICT DETECTED`);

    return result;
  }

  runAllTests() {
    console.log('🚀 Running all test scenarios...\n');
    
    testScenarios.forEach(scenario => {
      this.runTest(scenario);
    });

    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.pass).length;
    const failed = this.results.filter(r => !r.pass).length;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${Math.round((passed / this.results.length) * 100)}%`);

    console.log('\n📈 TRIGGER STATISTICS');
    console.log('-'.repeat(30));
    console.log(`Affordability Only: ${this.triggerStats.affordability}`);
    console.log(`Negotiation Only: ${this.triggerStats.negotiation}`);
    console.log(`Both Triggered: ${this.triggerStats.both}`);
    console.log(`Neither Triggered: ${this.triggerStats.neither}`);

    if (this.conflicts.length > 0) {
      console.log('\n⚠️  POTENTIAL CONFLICTS');
      console.log('-'.repeat(30));
      this.conflicts.forEach(conflict => {
        console.log(`${conflict.scenario}: "${conflict.message}"`);
        console.log(`  Triggers: [${conflict.triggers.join(', ')}]`);
      });
    } else {
      console.log('\n✅ NO CONFLICTS DETECTED');
    }

    console.log('\n🔍 FAILED TESTS ANALYSIS');
    console.log('-'.repeat(30));
    const failedTests = this.results.filter(r => !r.pass);
    if (failedTests.length === 0) {
      console.log('All tests passed! 🎉');
    } else {
      failedTests.forEach(test => {
        console.log(`${test.scenario}: Expected [${test.expected.join(',')}], Got [${test.actual.join(',')}]`);
      });
    }

    console.log('\n🎯 RECOMMENDATIONS');
    console.log('-'.repeat(30));
    
    if (this.conflicts.length > 0) {
      console.log('• Implement conflict resolution logic for dual triggers');
      console.log('• Consider priority system (negotiation > affordability)');
      console.log('• Add user preference for default artifact');
    }
    
    if (this.triggerStats.neither > 0) {
      console.log('• Improve trigger detection for edge cases');
      console.log('• Add fallback handling for unclear requests');
    }
    
    if (this.triggerStats.both > 2) {
      console.log('• Design dual-artifact UI layout');
      console.log('• Test artifact panel performance with multiple components');
    }

    console.log('• Test with real chat-ai-enhanced function');
    console.log('• Verify document_chunks integration readiness');
  }
}

// Run the comprehensive test
const testFramework = new ArtifactTestFramework();
testFramework.runAllTests();