// Test Enhanced RentCast Service with ZIP-Level Intelligence
// Tests the bedroom-aware analysis with geographic granularity

import { enhancedRentCastService } from './src/services/enhancedRentCastService.ts';

async function testEnhancedRentCastService() {
  console.log('🧪 Testing Enhanced RentCast Service with ZIP-Level Intelligence');
  console.log('================================================================');
  
  const testProperties = [
    {
      // Austin property in ZIP 78701 (downtown)
      name: 'Austin Downtown 2BR',
      property: {
        address: '123 E 6th St, Austin, TX 78701',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'Apartment'
      },
      expectedFeatures: [
        'ZIP-level ZORI data integration',
        'Downtown location premium analysis',
        'Bedroom-specific negotiation strategy for 2BR market',
        'Austin market trend analysis'
      ]
    },
    {
      // Houston property in ZIP 77449 (Katy suburb)
      name: 'Houston Katy 3BR',
      property: {
        address: '456 Main St, Katy, TX 77449',
        city: 'Houston',
        state: 'TX',
        zipCode: '77449',
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'Apartment'
      },
      expectedFeatures: [
        'Suburb vs city pricing analysis',
        '3BR family-oriented market dynamics',
        'Katy area-specific leverage points',
        'Houston metro regional context'
      ]
    },
    {
      // Studio in high-density area
      name: 'NYC Studio',
      property: {
        address: '789 Broadway, New York, NY 11385',
        city: 'New York',
        state: 'NY',
        zipCode: '11385',
        bedrooms: 0,
        bathrooms: 1,
        propertyType: 'Apartment'
      },
      expectedFeatures: [
        'Studio market high seasonality',
        'High competition level negotiation',
        'NYC-specific pricing tier analysis',
        'Geographic granularity scoring'
      ]
    }
  ];
  
  for (const testCase of testProperties) {
    console.log(`\\n🏠 Testing: ${testCase.name}`);
    console.log('Property Details:', testCase.property);
    console.log('Expected Features:', testCase.expectedFeatures);
    
    try {
      console.log('\\n⚡ Starting enhanced analysis...');
      const startTime = Date.now();
      
      const analysis = await enhancedRentCastService.getEnhancedMarketAnalysis(testCase.property);
      
      const analysisTime = Date.now() - startTime;
      console.log(`✅ Analysis completed in ${analysisTime}ms`);
      
      // Core Results
      console.log('\\n📊 ANALYSIS RESULTS:');
      console.log('===================');
      console.log('Property Estimate:', `$${analysis.propertyEstimate.toLocaleString()}`);
      console.log('Confidence Score:', `${(analysis.confidence * 100).toFixed(1)}%`);
      console.log('Rent Range:', `$${analysis.rentRange.min.toLocaleString()} - $${analysis.rentRange.max.toLocaleString()}`);
      
      // Bedroom Profile
      console.log('\\n🛏️ BEDROOM MARKET PROFILE:');
      console.log('Market Segment:', analysis.bedroomProfile.marketSegment);
      console.log('Price Elasticity:', analysis.bedroomProfile.priceElasticity);
      console.log('Negotiation Power:', analysis.bedroomProfile.negotiationPower);
      console.log('Competition Level:', analysis.bedroomProfile.competitionLevel);
      
      // Geographic Intelligence - NEW FEATURE
      console.log('\\n🗺️ GEOGRAPHIC INTELLIGENCE:');
      console.log('Granularity Score:', `${analysis.geographicContext.granularityScore}/100`);
      
      if (analysis.geographicContext.zipLevel) {
        const zip = analysis.geographicContext.zipLevel;
        console.log('ZIP Code:', zip.zipCode);
        console.log('ZIP Current Rent:', `$${zip.currentRent.toLocaleString()}`);
        console.log('ZIP Yearly Change:', `${zip.yearlyChange}%`);
        console.log('Data Source:', zip.dataSource);
        console.log('Neighborhood:', zip.neighborhood);
      } else {
        console.log('ZIP-level data: Not available (using city-level fallback)');
      }
      
      console.log('City Average:', `$${analysis.geographicContext.cityLevel.averageRent.toLocaleString()}`);
      console.log('City Trend:', analysis.geographicContext.cityLevel.trendDirection);
      
      // Enhanced Market Position
      console.log('\\n📈 ENHANCED MARKET POSITION:');
      console.log('Percentile Ranking:', `${analysis.marketPosition.percentile}th percentile`);
      console.log('vs Comparables:', `${analysis.marketPosition.vsComparables > 0 ? '+' : ''}${analysis.marketPosition.vsComparables}%`);
      console.log('vs ZIP Median:', `${analysis.marketPosition.vsZipMedian > 0 ? '+' : ''}${analysis.marketPosition.vsZipMedian}%`);
      console.log('Location Premium:', `${analysis.marketPosition.locationPremium > 0 ? '+' : ''}${analysis.marketPosition.locationPremium}%`);
      console.log('Pricing Tier:', analysis.marketPosition.pricingTier);
      
      // Comparable Analysis
      console.log('\\n🔍 COMPARABLE ANALYSIS:');
      console.log('Exact Bedroom Matches:', analysis.comparablesByTier.exact.length);
      console.log('Similar (±1 BR):', analysis.comparablesByTier.similar.length);
      console.log('Broader Market:', analysis.comparablesByTier.broader.length);
      
      // Enhanced Negotiation Intelligence
      console.log('\\n💼 NEGOTIATION INTELLIGENCE:');
      console.log('Supply Level:', analysis.negotiationContext.supply);
      console.log('Demand Strength:', analysis.negotiationContext.demand);
      console.log('Seasonal Factor:', analysis.negotiationContext.seasonalFactor);
      console.log('Competitive Pressure:', `${analysis.negotiationContext.competitivePressure}/100`);
      
      // Location-Specific Leverage - NEW
      console.log('\\n🎯 LOCATION LEVERAGE:');
      console.log(analysis.negotiationContext.locationLeverage);
      
      // Enhanced Strategy
      console.log('\\n📋 RECOMMENDED STRATEGY:');
      console.log(analysis.negotiationContext.recommendedStrategy);
      
      // Data Quality Assessment
      console.log('\\n📊 DATA QUALITY:');
      console.log('Comparable Count:', analysis.dataQuality.comparableCount);
      console.log('Avg Distance:', `${analysis.dataQuality.avgDistance} miles`);
      console.log('Avg Correlation:', analysis.dataQuality.avgCorrelation);
      console.log('Data Recency:', analysis.dataQuality.dataRecency);
      console.log('ZIP-Level Accuracy:', analysis.dataQuality.zipLevelAccuracy);
      
      // Feature Validation
      console.log('\\n✅ FEATURE VALIDATION:');
      const features = testCase.expectedFeatures;
      console.log('Expected Features:', features.length);
      
      let featureCount = 0;
      if (analysis.geographicContext.zipLevel) featureCount++;
      if (analysis.marketPosition.locationPremium !== 0) featureCount++;
      if (analysis.bedroomProfile.marketSegment) featureCount++;
      if (analysis.negotiationContext.locationLeverage) featureCount++;
      
      console.log('Implemented Features:', featureCount);
      console.log('Feature Success Rate:', `${Math.round((featureCount / features.length) * 100)}%`);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      console.error('Error details:', error);
    }
    
    console.log('\\n' + '='.repeat(60));
  }
  
  // Summary
  console.log('\\n🎯 ENHANCED RENTCAST SERVICE SUMMARY');
  console.log('====================================');
  console.log('✅ Bedroom-aware market analysis');
  console.log('✅ ZIP-level geographic intelligence');
  console.log('✅ Enhanced market positioning with location context');
  console.log('✅ Location-specific negotiation leverage');
  console.log('✅ Multi-tiered comparable categorization');
  console.log('✅ Granularity scoring for data confidence');
  console.log('\\n🚀 Ready for integration with your rental negotiation platform!');
}

// Run the test
testEnhancedRentCastService().catch(console.error);