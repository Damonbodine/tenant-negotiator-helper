import { rentCastService, RentCastPropertyDetails, RentCastComparable } from './rentCastService';
import { createClient } from '@supabase/supabase-js';

// Enhanced RentCast Service - Bedroom-Aware Market Analysis with ZIP-Level Intelligence
// Addresses apartment size variation AND geographic granularity using ZIP-level ZORI data

export interface BedroomMarketProfile {
  demographics: string[];
  priceElasticity: 'low' | 'medium' | 'high';
  seasonality: 'low' | 'moderate' | 'high';
  competitionLevel: 'low' | 'moderate' | 'high';
  negotiationPower: 'weak' | 'moderate' | 'strong';
  amenityPriorities: string[];
  marketSegment: string;
}

export interface ZipLevelContext {
  zipCode: string;
  currentRent: number;
  yearlyChange: number;
  monthlyChange: number;
  percentileVsCity: number;
  neighborhood: string;
  dataSource: 'ZORI_ZIP' | 'ESTIMATED' | 'CITY_PROXY';
}

export interface GeographicGranularity {
  zipLevel: ZipLevelContext | null;
  cityLevel: {
    averageRent: number;
    medianRent: number;
    trendDirection: 'rising' | 'stable' | 'cooling';
  };
  metroLevel: {
    averageRent: number;
    regionalTrend: number;
  };
  granularityScore: number; // 0-100, higher = more precise location data
}

export interface EnhancedMarketAnalysis {
  propertyEstimate: number;
  confidence: number;
  rentRange: { min: number; max: number };
  
  // Bedroom-specific analysis
  bedroomProfile: BedroomMarketProfile;
  comparablesByTier: {
    exact: RentCastComparable[];     // Same bed/bath count
    similar: RentCastComparable[];   // ±1 bedroom
    broader: RentCastComparable[];   // Market context
  };
  
  // Geographic Intelligence - NEW
  geographicContext: GeographicGranularity;
  
  // Market positioning (enhanced with ZIP-level data)
  marketPosition: {
    percentile: number;              // Where this property ranks (0-100)
    vsComparables: number;           // % above/below comparable median
    vsZipMedian: number;             // % above/below ZIP median (NEW)
    pricingTier: 'budget' | 'market' | 'premium' | 'luxury';
    locationPremium: number;         // Premium/discount for specific location
  };
  
  // Negotiation intelligence (enhanced with location factors)
  negotiationContext: {
    supply: 'low' | 'moderate' | 'high';
    demand: 'weak' | 'moderate' | 'strong';
    seasonalFactor: 'favorable' | 'neutral' | 'unfavorable';
    competitivePressure: number;    // 0-100 scale
    locationLeverage: string;       // ZIP-specific negotiation points
    recommendedStrategy: string;
  };
  
  // Data quality metrics
  dataQuality: {
    comparableCount: number;
    avgDistance: number;
    avgCorrelation: number;
    dataRecency: string;
    zipLevelAccuracy: 'high' | 'medium' | 'low';
  };
}

export class EnhancedRentCastService {
  private supabaseUrl: string;
  private supabaseKey: string;
  
  constructor() {
    // Get Supabase credentials from environment
    this.supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  }
  
  /**
   * Bedroom Market Profiles - Different dynamics by apartment size
   */
  private readonly bedroomProfiles: Record<string, BedroomMarketProfile> = {
    '0': { // Studio
      demographics: ['young professionals', 'students', 'minimalists'],
      priceElasticity: 'high',
      seasonality: 'high', // August-September peak
      competitionLevel: 'high',
      negotiationPower: 'weak',
      amenityPriorities: ['location', 'transit access', 'wifi/utilities'],
      marketSegment: 'entry-level urban'
    },
    
    '1': { // 1 Bedroom  
      demographics: ['young professionals', 'couples', 'remote workers'],
      priceElasticity: 'medium',
      seasonality: 'moderate',
      competitionLevel: 'high',
      negotiationPower: 'moderate',
      amenityPriorities: ['location', 'parking', 'in-unit laundry', 'workspace'],
      marketSegment: 'professional urban'
    },
    
    '2': { // 2 Bedroom
      demographics: ['couples', 'roommates', 'small families', 'professionals'],
      priceElasticity: 'medium',
      seasonality: 'moderate',
      competitionLevel: 'moderate',
      negotiationPower: 'moderate',
      amenityPriorities: ['space', 'parking', 'amenities', 'storage'],
      marketSegment: 'mainstream rental'
    },
    
    '3': { // 3 Bedroom
      demographics: ['families', 'established professionals', 'groups'],
      priceElasticity: 'low',
      seasonality: 'low',
      competitionLevel: 'low',
      negotiationPower: 'strong',
      amenityPriorities: ['schools', 'safety', 'space', 'parking', 'yard'],
      marketSegment: 'family-oriented'
    },
    
    '4+': { // 4+ Bedrooms
      demographics: ['large families', 'executive housing', 'shared housing'],
      priceElasticity: 'low',
      seasonality: 'low',
      competitionLevel: 'low',
      negotiationPower: 'strong',
      amenityPriorities: ['space', 'privacy', 'luxury amenities', 'location prestige'],
      marketSegment: 'premium/executive'
    }
  };
  
  /**
   * Get comprehensive bedroom-aware market analysis with ZIP-level intelligence
   */
  async getEnhancedMarketAnalysis(property: RentCastPropertyDetails): Promise<EnhancedMarketAnalysis> {
    console.log('🚀 Starting enhanced bedroom-aware RentCast analysis with ZIP-level intelligence...');
    
    try {
      // PARALLEL EXECUTION: Run RentCast API and ZIP-level analysis simultaneously
      const [rentCastData, geographicContext] = await Promise.all([
        rentCastService.getComprehensiveAnalysis(property),
        this.getGeographicIntelligence(property)
      ]);
      
      // Get bedroom profile
      const bedroomKey = this.getBedroomKey(property.bedrooms || 1);
      const bedroomProfile = this.bedroomProfiles[bedroomKey];
      
      // Categorize comparables by relevance
      const comparablesByTier = this.categorizeComparables(
        [...rentCastData.rentEstimate.comparables, ...rentCastData.activeRentals],
        property.bedrooms || 1
      );
      
      // Enhanced market positioning with ZIP-level context
      const marketPosition = this.calculateEnhancedMarketPosition(
        rentCastData.rentEstimate.estimate,
        comparablesByTier,
        geographicContext
      );
      
      // Enhanced negotiation intelligence with location factors
      const negotiationContext = this.generateEnhancedNegotiationIntelligence(
        bedroomProfile,
        marketPosition,
        comparablesByTier,
        geographicContext,
        property
      );
      
      // Enhanced data quality metrics with ZIP-level accuracy
      const dataQuality = this.calculateEnhancedDataQuality(
        [...rentCastData.rentEstimate.comparables, ...rentCastData.activeRentals],
        geographicContext
      );
      
      return {
        propertyEstimate: rentCastData.rentEstimate.estimate,
        confidence: rentCastData.rentEstimate.confidence,
        rentRange: rentCastData.rentEstimate.rentRange,
        bedroomProfile,
        comparablesByTier,
        geographicContext,
        marketPosition,
        negotiationContext,
        dataQuality
      };
      
    } catch (error) {
      console.error('Enhanced RentCast analysis failed:', error);
      throw error;
    }
  }
  
  /**
   * Categorize comparables by bedroom relevance
   */
  private categorizeComparables(allComparables: RentCastComparable[], targetBedrooms: number) {
    const exact: RentCastComparable[] = [];
    const similar: RentCastComparable[] = [];
    const broader: RentCastComparable[] = [];
    
    allComparables.forEach(comp => {
      const bedDiff = Math.abs(comp.bedrooms - targetBedrooms);
      
      if (bedDiff === 0) {
        exact.push(comp);
      } else if (bedDiff === 1) {
        similar.push(comp);
      } else {
        broader.push(comp);
      }
    });
    
    // Sort each category by correlation/distance
    const sortComparables = (comps: RentCastComparable[]) => 
      comps.sort((a, b) => (b.correlation || 0) - (a.correlation || 0) || a.distance - b.distance);
    
    return {
      exact: sortComparables(exact).slice(0, 10),    // Top 10 exact matches
      similar: sortComparables(similar).slice(0, 8), // Top 8 similar
      broader: sortComparables(broader).slice(0, 5)  // Top 5 broader context
    };
  }
  
  /**
   * Get geographic intelligence using ZIP-level ZORI data from your CSV
   */
  private async getGeographicIntelligence(property: RentCastPropertyDetails): Promise<GeographicGranularity> {
    console.log('🗺️ Analyzing geographic granularity...');
    
    try {
      // Extract ZIP code from property address
      const zipCode = this.extractZipCode(property.address);
      
      let zipLevelContext: ZipLevelContext | null = null;
      let granularityScore = 0;
      
      if (zipCode && this.supabaseUrl && this.supabaseKey) {
        try {
          const supabase = createClient(this.supabaseUrl, this.supabaseKey);
          
          // Query your CSV data from Supabase for this specific ZIP
          const { data: zipData, error } = await supabase
            .from('zip_level_rents') // Assuming you've loaded the CSV into this table
            .select('*')
            .eq('RegionName', zipCode)
            .single();
          
          if (!error && zipData) {
            // Extract latest rent data from ZORI CSV structure
            const latestColumn = this.getLatestZoriColumn(zipData);
            const previousYearColumn = this.getPreviousYearColumn(zipData);
            
            const currentRent = zipData[latestColumn];
            const previousRent = zipData[previousYearColumn];
            const yearlyChange = previousRent ? ((currentRent - previousRent) / previousRent) * 100 : 0;
            
            zipLevelContext = {
              zipCode,
              currentRent: Math.round(currentRent),
              yearlyChange: Math.round(yearlyChange * 10) / 10,
              monthlyChange: 0, // Would need month-over-month calculation
              percentileVsCity: this.calculateZipPercentileVsCity(zipData),
              neighborhood: zipData.City || 'Unknown',
              dataSource: 'ZORI_ZIP'
            };
            
            granularityScore = 95; // High accuracy with ZIP-level data
            console.log('✅ ZIP-level data found:', zipLevelContext);
          }
        } catch (dbError) {
          console.log('⚠️ ZIP database query failed:', dbError);
        }
      }
      
      // Fallback to city-level analysis if ZIP not available
      const cityLevel = await this.getCityLevelContext(property);
      const metroLevel = await this.getMetroLevelContext(property);
      
      if (!zipLevelContext) {
        granularityScore = 60; // Medium accuracy with city-level data
      }
      
      return {
        zipLevel: zipLevelContext,
        cityLevel,
        metroLevel,
        granularityScore
      };
      
    } catch (error) {
      console.log('⚠️ Geographic intelligence error:', error);
      
      // Fallback with estimated data
      return {
        zipLevel: null,
        cityLevel: {
          averageRent: 2000, // Generic fallback
          medianRent: 1900,
          trendDirection: 'stable'
        },
        metroLevel: {
          averageRent: 1950,
          regionalTrend: 2.5
        },
        granularityScore: 30 // Low accuracy - using estimates
      };
    }
  }

  /**
   * Enhanced market positioning with ZIP-level context
   */
  private calculateEnhancedMarketPosition(
    propertyRent: number, 
    comparablesByTier: any, 
    geographicContext: GeographicGranularity
  ) {
    // Original comparable-based analysis
    const originalPosition = this.calculateMarketPosition(propertyRent, comparablesByTier);
    
    // Enhanced with ZIP-level data
    let vsZipMedian = 0;
    let locationPremium = 0;
    
    if (geographicContext.zipLevel) {
      const zipMedian = geographicContext.zipLevel.currentRent;
      vsZipMedian = ((propertyRent - zipMedian) / zipMedian) * 100;
      
      // Calculate location premium based on ZIP vs city performance
      const cityMedian = geographicContext.cityLevel.medianRent;
      locationPremium = ((zipMedian - cityMedian) / cityMedian) * 100;
    }
    
    return {
      ...originalPosition,
      vsZipMedian: Math.round(vsZipMedian),
      locationPremium: Math.round(locationPremium)
    };
  }

  /**
   * Calculate market positioning with bedroom context (original method)
   */
  private calculateMarketPosition(propertyRent: number, comparablesByTier: any) {
    // Use exact matches first, fall back to similar
    const primaryComps = comparablesByTier.exact.length >= 3 
      ? comparablesByTier.exact 
      : [...comparablesByTier.exact, ...comparablesByTier.similar];
    
    if (primaryComps.length === 0) {
      return {
        percentile: 50,
        vsComparables: 0,
        pricingTier: 'market' as const
      };
    }
    
    // Calculate percentile position
    const sortedRents = primaryComps.map(c => c.rent).sort((a, b) => a - b);
    const percentile = this.calculatePercentile(propertyRent, sortedRents);
    
    // Calculate vs comparables median
    const medianRent = this.calculateMedian(sortedRents);
    const vsComparables = ((propertyRent - medianRent) / medianRent) * 100;
    
    // Determine pricing tier
    let pricingTier: 'budget' | 'market' | 'premium' | 'luxury';
    if (percentile >= 90) pricingTier = 'luxury';
    else if (percentile >= 75) pricingTier = 'premium';
    else if (percentile >= 25) pricingTier = 'market';
    else pricingTier = 'budget';
    
    return {
      percentile,
      vsComparables: Math.round(vsComparables),
      pricingTier
    };
  }
  
  /**
   * Enhanced negotiation intelligence with location factors
   */
  private generateEnhancedNegotiationIntelligence(
    bedroomProfile: BedroomMarketProfile,
    marketPosition: any,
    comparablesByTier: any,
    geographicContext: GeographicGranularity,
    property: RentCastPropertyDetails
  ) {
    // Get base negotiation intelligence
    const baseContext = this.generateNegotiationIntelligence(
      bedroomProfile, 
      marketPosition, 
      comparablesByTier, 
      property
    );
    
    // Generate location-specific leverage
    const locationLeverage = this.generateLocationLeverage(geographicContext, marketPosition);
    
    // Enhanced strategy with location factors
    const enhancedStrategy = this.enhanceStrategyWithLocation(
      baseContext.recommendedStrategy,
      geographicContext,
      marketPosition
    );
    
    return {
      ...baseContext,
      locationLeverage,
      recommendedStrategy: enhancedStrategy
    };
  }

  /**
   * Generate bedroom-specific negotiation intelligence (original method)
   */
  private generateNegotiationIntelligence(
    bedroomProfile: BedroomMarketProfile,
    marketPosition: any,
    comparablesByTier: any,
    property: RentCastPropertyDetails
  ) {
    // Calculate supply (number of comparables available)
    const totalComps = comparablesByTier.exact.length + comparablesByTier.similar.length;
    const supply: 'low' | 'moderate' | 'high' = totalComps > 15 ? 'high' : totalComps > 8 ? 'moderate' : 'low';
    
    // Calculate demand based on bedroom profile and market position
    const demandFactors = {
      competition: bedroomProfile.competitionLevel,
      pricing: marketPosition.pricingTier,
      elasticity: bedroomProfile.priceElasticity
    };
    
    let demand: 'weak' | 'moderate' | 'strong';
    if (demandFactors.competition === 'high' && demandFactors.pricing !== 'luxury') {
      demand = 'strong';
    } else if (demandFactors.competition === 'low' || demandFactors.pricing === 'budget') {
      demand = 'weak';
    } else {
      demand = 'moderate';
    }
    
    // Seasonal factor based on current month and bedroom profile
    const seasonalFactor = this.calculateSeasonalFactor(bedroomProfile.seasonality);
    
    // Competitive pressure (0-100)
    const competitivePressure = this.calculateCompetitivePressure(
      supply,
      demand,
      bedroomProfile.competitionLevel,
      comparablesByTier.exact.length
    );
    
    // Generate strategy recommendation
    const recommendedStrategy = this.generateNegotiationStrategy(
      bedroomProfile,
      marketPosition,
      { supply, demand, seasonalFactor, competitivePressure }
    );
    
    return {
      supply,
      demand,
      seasonalFactor,
      competitivePressure,
      recommendedStrategy
    };
  }
  
  /**
   * Generate bedroom-specific negotiation strategy
   */
  private generateNegotiationStrategy(
    bedroomProfile: BedroomMarketProfile,
    marketPosition: any,
    context: any
  ): string {
    const strategies = [];
    
    // Base strategy by bedroom count
    if (bedroomProfile.marketSegment === 'entry-level urban') {
      strategies.push('Emphasize reliability and stable income');
      strategies.push('Compare to similar studios with better location/amenities');
    } else if (bedroomProfile.marketSegment === 'family-oriented') {
      strategies.push('Highlight long-term stability and family responsibility');
      strategies.push('Negotiate for family-friendly terms (pet policy, lease flexibility)');
    } else {
      strategies.push('Focus on tenant quality and professional background');
    }
    
    // Market position adjustments
    if (marketPosition.vsComparables > 10) {
      strategies.push(`Property is ${marketPosition.vsComparables}% above comparable units - strong negotiation leverage`);
    } else if (marketPosition.vsComparables < -10) {
      strategies.push('Property is well-priced - focus on lease terms rather than rent reduction');
    }
    
    // Supply/demand dynamics
    if (context.supply === 'high' && context.demand !== 'strong') {
      strategies.push('Abundant supply gives tenants strong negotiating position');
    } else if (context.supply === 'low') {
      strategies.push('Limited supply - emphasize tenant quality over price negotiation');
    }
    
    // Seasonal timing
    if (context.seasonalFactor === 'favorable') {
      strategies.push('Favorable seasonal timing for rent negotiations');
    }
    
    return strategies.join('. ') + '.';
  }
  
  // Helper methods
  private getBedroomKey(bedrooms: number): string {
    if (bedrooms === 0) return '0';
    if (bedrooms === 1) return '1';
    if (bedrooms === 2) return '2';
    if (bedrooms === 3) return '3';
    return '4+';
  }
  
  private calculatePercentile(value: number, sortedArray: number[]): number {
    if (sortedArray.length === 0) return 50;
    
    let rank = 0;
    for (const item of sortedArray) {
      if (value > item) rank++;
    }
    
    return Math.round((rank / sortedArray.length) * 100);
  }
  
  private calculateMedian(sortedArray: number[]): number {
    if (sortedArray.length === 0) return 0;
    
    const mid = Math.floor(sortedArray.length / 2);
    return sortedArray.length % 2 === 0
      ? (sortedArray[mid - 1] + sortedArray[mid]) / 2
      : sortedArray[mid];
  }
  
  private calculateSeasonalFactor(seasonality: string): 'favorable' | 'neutral' | 'unfavorable' {
    const currentMonth = new Date().getMonth(); // 0-11
    
    if (seasonality === 'high') {
      // High seasonality (studios): Aug-Sep unfavorable, Nov-Feb favorable
      if (currentMonth >= 7 && currentMonth <= 8) return 'unfavorable'; // Aug-Sep
      if (currentMonth >= 10 || currentMonth <= 1) return 'favorable'; // Nov-Feb
    } else if (seasonality === 'moderate') {
      // Moderate seasonality: Spring/summer unfavorable, fall/winter favorable
      if (currentMonth >= 3 && currentMonth <= 7) return 'unfavorable'; // Apr-Aug
      if (currentMonth >= 9 || currentMonth <= 2) return 'favorable'; // Sep-Mar
    }
    
    return 'neutral';
  }
  
  private calculateCompetitivePressure(
    supply: string,
    demand: string,
    competitionLevel: string,
    exactMatches: number
  ): number {
    let pressure = 50; // Base
    
    // Supply adjustments
    if (supply === 'high') pressure -= 20;
    else if (supply === 'low') pressure += 20;
    
    // Demand adjustments
    if (demand === 'strong') pressure += 15;
    else if (demand === 'weak') pressure -= 15;
    
    // Competition level
    if (competitionLevel === 'high') pressure += 10;
    else if (competitionLevel === 'low') pressure -= 10;
    
    // Exact matches availability
    if (exactMatches < 3) pressure += 10;
    else if (exactMatches > 8) pressure -= 10;
    
    return Math.max(0, Math.min(100, pressure));
  }
  
  private calculateEnhancedDataQuality(
    allComparables: RentCastComparable[], 
    geographicContext: GeographicGranularity
  ) {
    const baseQuality = this.calculateDataQuality(allComparables);
    
    // Determine ZIP-level accuracy
    let zipLevelAccuracy: 'high' | 'medium' | 'low' = 'low';
    if (geographicContext.granularityScore >= 90) zipLevelAccuracy = 'high';
    else if (geographicContext.granularityScore >= 60) zipLevelAccuracy = 'medium';
    
    return {
      ...baseQuality,
      zipLevelAccuracy
    };
  }

  private calculateDataQuality(allComparables: RentCastComparable[]) {
    if (allComparables.length === 0) {
      return {
        comparableCount: 0,
        avgDistance: 0,
        avgCorrelation: 0,
        dataRecency: 'No data'
      };
    }
    
    const avgDistance = allComparables.reduce((sum, c) => sum + c.distance, 0) / allComparables.length;
    const avgCorrelation = allComparables.reduce((sum, c) => sum + (c.correlation || 0.5), 0) / allComparables.length;
    
    // Estimate data recency (RentCast doesn't provide daysOld, so estimate)
    const dataRecency = 'Recent'; // RentCast data is typically current
    
    return {
      comparableCount: allComparables.length,
      avgDistance: Math.round(avgDistance * 100) / 100,
      avgCorrelation: Math.round(avgCorrelation * 100) / 100,
      dataRecency
    };
  }

  // Geographic Intelligence Helper Methods
  
  private extractZipCode(address?: string): string | null {
    if (!address) return null;
    
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
    return zipMatch ? zipMatch[1].substring(0, 5) : null;
  }
  
  private getLatestZoriColumn(zipData: any): string {
    // Find the latest date column from your ZORI CSV
    const dateColumns = Object.keys(zipData).filter(key => key.match(/^\d{4}-\d{2}-\d{2}$/));
    dateColumns.sort();
    return dateColumns[dateColumns.length - 1] || '2024-12-31';
  }
  
  private getPreviousYearColumn(zipData: any): string {
    const latestColumn = this.getLatestZoriColumn(zipData);
    const latestDate = new Date(latestColumn);
    const previousYear = new Date(latestDate.getFullYear() - 1, latestDate.getMonth(), latestDate.getDate());
    
    const previousYearString = previousYear.toISOString().split('T')[0];
    
    // Find closest date column to a year ago
    const dateColumns = Object.keys(zipData).filter(key => key.match(/^\d{4}-\d{2}-\d{2}$/));
    return dateColumns.find(col => col === previousYearString) || dateColumns[Math.max(0, dateColumns.length - 13)];
  }
  
  private calculateZipPercentileVsCity(_zipData: any): number {
    // This would ideally compare against city-wide ZIP data
    // For now, return a reasonable estimate
    return 50;
  }
  
  private async getCityLevelContext(property: RentCastPropertyDetails) {
    // Extract city from address or use provided city
    const city = property.city || this.extractCityFromAddress(property.address);
    
    // Use sample data - in production, query your city-level ZORI data
    const cityData = {
      'Austin': { avg: 1850, median: 1750, trend: 'rising' },
      'Houston': { avg: 1556, median: 1450, trend: 'stable' },
      'Dallas': { avg: 1900, median: 1800, trend: 'rising' }
    };
    
    const data = cityData[city as keyof typeof cityData] || { avg: 1800, median: 1700, trend: 'stable' };
    
    return {
      averageRent: data.avg,
      medianRent: data.median,
      trendDirection: data.trend as 'rising' | 'stable' | 'cooling'
    };
  }
  
  private async getMetroLevelContext(_property: RentCastPropertyDetails) {
    // Metro-level analysis - sample data
    return {
      averageRent: 1750,
      regionalTrend: 3.2
    };
  }
  
  private extractCityFromAddress(address?: string): string {
    if (!address) return 'Unknown';
    
    // Extract city from address format "123 Main St, Austin, TX"
    const parts = address.split(',');
    return parts.length >= 2 ? parts[parts.length - 2].trim() : 'Unknown';
  }
  
  private generateLocationLeverage(
    geographicContext: GeographicGranularity, 
    marketPosition: any
  ): string {
    const leveragePoints: string[] = [];
    
    if (geographicContext.zipLevel) {
      const { zipLevel } = geographicContext;
      
      // ZIP-specific trends
      if (zipLevel.yearlyChange < 0) {
        leveragePoints.push(`ZIP ${zipLevel.zipCode} rents declining ${Math.abs(zipLevel.yearlyChange)}% annually`);
      } else if (zipLevel.yearlyChange > 8) {
        leveragePoints.push(`ZIP ${zipLevel.zipCode} rents rising rapidly at ${zipLevel.yearlyChange}% annually`);
      }
      
      // Location premium analysis
      if (marketPosition.locationPremium > 15) {
        leveragePoints.push(`Property in premium ZIP location (${marketPosition.locationPremium}% above city average)`);
      } else if (marketPosition.locationPremium < -10) {
        leveragePoints.push(`Property location trades at discount (${Math.abs(marketPosition.locationPremium)}% below city average)`);
      }
      
      // ZIP vs property comparison
      if (marketPosition.vsZipMedian > 10) {
        leveragePoints.push(`Property priced ${marketPosition.vsZipMedian}% above ZIP median`);
      }
    }
    
    if (leveragePoints.length === 0) {
      leveragePoints.push('Use comparable properties in neighboring areas as price references');
    }
    
    return leveragePoints.join('. ');
  }
  
  private enhanceStrategyWithLocation(
    baseStrategy: string,
    geographicContext: GeographicGranularity,
    marketPosition: any
  ): string {
    let enhancedStrategy = baseStrategy;
    
    if (geographicContext.zipLevel) {
      const { zipLevel } = geographicContext;
      
      // Add ZIP-specific strategy elements
      if (zipLevel.yearlyChange < 0) {
        enhancedStrategy += ` Reference declining rent trend in ZIP ${zipLevel.zipCode} as market justification.`;
      }
      
      if (marketPosition.vsZipMedian > 15) {
        enhancedStrategy += ` Emphasize property is significantly above local ZIP median (${marketPosition.vsZipMedian}%).`;
      }
      
      if (geographicContext.granularityScore >= 90) {
        enhancedStrategy += ` Use hyperlocal ZIP-level data (${zipLevel.zipCode}) for precise market positioning.`;
      }
    }
    
    return enhancedStrategy;
  }
}

export const enhancedRentCastService = new EnhancedRentCastService();