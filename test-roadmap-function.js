// Test the negotiation roadmap edge function
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://izzdyfrcxunfzlfgdjuv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzNDk3NDEsImV4cCI6MjAyOTkyNTc0MX0.jZm_KlCmZSsqpAXkFV-TP9uqBR0qGCJEqsIe7nQpLjY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNegotiationRoadmap() {
  console.log('🚀 Testing negotiation roadmap edge function...');
  
  const testRequest = {
    userContext: {
      currentRent: 2500,
      budgetFlexibility: 'moderate',
      employmentStability: 'stable',
      preferredTone: 'collaborative',
      riskTolerance: 'moderate',
      conflictStyle: 'collaborator',
      landlordRelationship: 'neutral',
      tenantHistory: 'experienced',
      urgency: 'moderate',
      alternativeOptions: 2,
      movingFlexibility: 'willing-to-move'
    },
    marketContext: {
      currentRentVsMarket: 'above',
      marketPosition: 75,
      propertyCondition: 'good',
      landlordType: 'individual',
      localVacancyRate: 5.5,
      rentTrend: 'stable',
      seasonalFactor: 'normal',
      economicIndicators: 'stable',
      comparableRange: {
        min: 2200,
        max: 2800,
        median: 2400
      },
      negotiationLeverage: 'moderate',
      marketPowerBalance: 'balanced'
    },
    situationContext: {
      leaseStatus: 'active-lease',
      timeUntilDecision: 30,
      primaryGoal: 'rent-reduction',
      targetReduction: 200,
      competingOffers: false,
      lifeEvents: 'none',
      marketEvent: 'none'
    }
  };
  
  try {
    const { data, error } = await supabase.functions.invoke('negotiation-roadmap', {
      body: testRequest
    });
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('✅ Roadmap generated successfully!');
    console.log('📊 Strategy:', data.strategy.name);
    console.log('🎯 Success Probability:', data.successProbability.overall + '%');
    console.log('⚡ Leverage Score:', data.leverageScore.total + '/10');
    console.log('📋 Number of Steps:', data.steps.length);
    console.log('⏱️ Timeline:', data.timeline.estimatedDuration);
    
    console.log('\n🗺️ Full roadmap data:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testNegotiationRoadmap();