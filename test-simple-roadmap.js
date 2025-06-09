// Test negotiation roadmap with minimal payload to isolate error
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleRoadmap() {
  console.log('🧪 Testing simple negotiation roadmap...');
  
  const testPayload = {
    userContext: {
      currentRent: 2500,
      budgetFlexibility: 'moderate',
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
    }
    // NO location to test if market intelligence is causing the error
  };

  try {
    console.log('📤 Testing without location...');
    
    const response = await fetch('http://localhost:54321/functions/v1/negotiation-roadmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);

    if (!response.ok) {
      console.error('❌ Error response:', responseText);
      return;
    }

    const data = JSON.parse(responseText);
    console.log('✅ Success! Roadmap generated:');
    console.log('Strategy:', data.strategy?.name);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleRoadmap();