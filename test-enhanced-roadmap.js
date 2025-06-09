// Test Enhanced Negotiation Roadmap with RAG Integration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzNDk3NDEsImV4cCI6MjAyOTkyNTc0MX0.jZm_KlCmZSsqpAXkFV-TP9uqBR0qGCJEqsIe7nQpLjY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnhancedRoadmap() {
  console.log('🧪 TESTING ENHANCED NEGOTIATION ROADMAP WITH RAG');
  console.log('='.repeat(60));
  
  // Test scenarios with different locations
  const testScenarios = [
    {
      name: 'Austin, TX Market Test',
      request: {
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
          comparableRange: { min: 2200, max: 2800, median: 2400 },
          negotiationLeverage: 'moderate',
          marketPowerBalance: 'balanced'
        },
        situationContext: {
          leaseStatus: 'active-lease',
          timeUntilDecision: 30,
          primaryGoal: 'rent-reduction',
          targetReduction: 300,
          competingOffers: false,
          lifeEvents: 'none',
          marketEvent: 'none'
        },
        location: 'Austin, TX'
      }
    },
    {
      name: 'Buffalo, NY Market Test',
      request: {
        userContext: {
          currentRent: 1400,
          budgetFlexibility: 'tight',
          employmentStability: 'stable',
          preferredTone: 'diplomatic',
          riskTolerance: 'conservative',
          conflictStyle: 'collaborator',
          landlordRelationship: 'positive',
          tenantHistory: 'veteran',
          urgency: 'moderate',
          alternativeOptions: 3,
          movingFlexibility: 'committed-to-stay'
        },
        marketContext: {
          currentRentVsMarket: 'above',
          marketPosition: 80,
          propertyCondition: 'good',
          landlordType: 'individual',
          localVacancyRate: 6.2,
          rentTrend: 'stable',
          seasonalFactor: 'normal',
          economicIndicators: 'stable',
          comparableRange: { min: 1100, max: 1500, median: 1250 },
          negotiationLeverage: 'high',
          marketPowerBalance: 'tenant-favored'
        },
        situationContext: {
          leaseStatus: 'renewal-period',
          timeUntilDecision: 45,
          primaryGoal: 'rent-reduction',
          targetReduction: 200,
          competingOffers: false,
          lifeEvents: 'none',
          marketEvent: 'none'
        },
        location: 'Buffalo, NY'
      }
    },
    {
      name: 'No Location Test (Fallback)',
      request: {
        userContext: {
          currentRent: 2000,
          budgetFlexibility: 'moderate',
          employmentStability: 'stable',
          preferredTone: 'assertive',
          riskTolerance: 'aggressive',
          conflictStyle: 'competitor',
          landlordRelationship: 'neutral',
          tenantHistory: 'experienced',
          urgency: 'urgent',
          alternativeOptions: 1,
          movingFlexibility: 'willing-to-move'
        },
        marketContext: {
          currentRentVsMarket: 'significantly-above',
          marketPosition: 85,
          propertyCondition: 'fair',
          landlordType: 'corporate',
          localVacancyRate: 7.0,
          rentTrend: 'decreasing',
          seasonalFactor: 'slow',
          economicIndicators: 'uncertain',
          comparableRange: { min: 1600, max: 2200, median: 1800 },
          negotiationLeverage: 'high',
          marketPowerBalance: 'tenant-favored'
        },
        situationContext: {
          leaseStatus: 'active-lease',
          timeUntilDecision: 14,
          primaryGoal: 'rent-reduction',
          targetReduction: 400,
          competingOffers: true,
          lifeEvents: 'none',
          marketEvent: 'new-competition'
        }
        // No location provided to test fallback
      }
    }
  ];

  for (const scenario of testScenarios) {
    console.log(`\n🎯 ${scenario.name}`);
    console.log('-'.repeat(40));
    
    try {
      const { data, error } = await supabase.functions.invoke('negotiation-roadmap', {
        body: scenario.request
      });
      
      if (error) {
        console.error(`❌ Error:`, error);
        continue;
      }
      
      console.log(`✅ Success! Strategy: ${data.strategy?.name}`);
      console.log(`📊 Leverage Score: ${data.leverageScore?.total}/10`);
      console.log(`🎯 Success Probability: ${data.successProbability?.overall}%`);
      
      // Check for market intelligence
      if (data.marketIntelligence) {
        console.log(`🏙️ Market Intelligence Available:`);
        console.log(`   • Comparable Properties: ${data.marketIntelligence.comparableProperties?.length || 0}`);
        console.log(`   • Evidence Points: ${data.marketIntelligence.evidencePoints?.length || 0}`);
        console.log(`   • Average Rent: $${data.marketIntelligence.marketTrends?.avgRent || 'N/A'}`);
        console.log(`   • Location Insights: ${data.marketIntelligence.locationInsights ? 'Yes' : 'No'}`);
        
        // Show first evidence point if available
        if (data.marketIntelligence.evidencePoints && data.marketIntelligence.evidencePoints[0]) {
          console.log(`   • Key Evidence: "${data.marketIntelligence.evidencePoints[0]}"`);
        }
        
        // Show first comparable if available
        if (data.marketIntelligence.comparableProperties && data.marketIntelligence.comparableProperties[0]) {
          const comp = data.marketIntelligence.comparableProperties[0];
          console.log(`   • Top Comparable: $${comp.rent} ${comp.type || ''}`);
        }
      } else {
        console.log(`⚠️ No Market Intelligence (using fallback data)`);
      }
      
      // Check enhanced steps
      const firstStep = data.steps?.[0];
      if (firstStep && firstStep.successMetrics) {
        console.log(`📋 Enhanced Step Metrics: ${firstStep.successMetrics.length} metrics`);
        if (firstStep.successMetrics[0]?.includes('$')) {
          console.log(`   • Real Data Metric: "${firstStep.successMetrics[0]}"`);
        }
      }
      
    } catch (err) {
      console.error(`❌ Test failed:`, err.message);
    }
    
    console.log(''); // Add spacing
  }
  
  console.log('\n🎉 TESTING COMPLETE!');
  console.log('\n📝 Next Steps:');
  console.log('1. Test live UI at http://localhost:8081/negotiation');
  console.log('2. Try message: "Help me negotiate my $2,500 rent in Austin, TX"');
  console.log('3. Check for real market data in the roadmap artifact');
  console.log('4. Verify enhanced email templates with actual comparable data');
}

testEnhancedRoadmap().catch(console.error);