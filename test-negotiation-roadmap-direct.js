// Test negotiation roadmap edge function directly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'; // Local anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNegotiationRoadmap() {
  console.log('🧪 Testing negotiation roadmap function directly...');
  
  const testPayload = {
    userContext: {
      currentRent: 2500,
      budgetFlexibility: 'moderate',
      creditScore: 720,
      employmentStability: 'stable',
      preferredTone: 'diplomatic',
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
      comparableRange: { min: 2200, max: 2600, median: 2400 },
      negotiationLeverage: 'moderate',
      marketPowerBalance: 'balanced'
    },
    situationContext: {
      leaseStatus: 'active-lease',
      timeUntilDecision: 21,
      primaryGoal: 'rent-reduction',
      targetReduction: 300,
      competingOffers: false,
      lifeEvents: 'none',
      marketEvent: 'none'
    },
    location: 'Austin, TX'
  };

  try {
    console.log('📤 Sending request to edge function...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const { data, error } = await supabase.functions.invoke('negotiation-roadmap', {
      body: testPayload
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      console.error('Error details:', error.message);
      return;
    }

    console.log('✅ Success! Roadmap generated:');
    console.log('Strategy:', data.strategy?.name);
    console.log('Success probability:', data.successProbability?.overall + '%');
    console.log('Leverage score:', data.leverageScore?.total);
    console.log('Timeline:', data.timeline?.estimatedDuration);
    console.log('Steps count:', data.steps?.length);
    console.log('Market intelligence:', data.marketIntelligence ? 'Present' : 'Not available');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testNegotiationRoadmap();