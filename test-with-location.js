// Test negotiation roadmap with location to isolate market intelligence error
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithLocation() {
  console.log('🧪 Testing negotiation roadmap WITH location...');
  
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
    },
    location: 'Austin, TX' // This is what's causing the error
  };

  try {
    console.log('📤 Testing WITH location (Austin, TX)...');
    
    const response = await fetch('http://localhost:54321/functions/v1/negotiation-roadmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📥 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📥 Raw response (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('❌ Error response:', responseText);
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Parsed error:', errorData);
      } catch (e) {
        console.error('❌ Could not parse error response');
      }
      return;
    }

    const data = JSON.parse(responseText);
    console.log('✅ Success with location!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWithLocation();