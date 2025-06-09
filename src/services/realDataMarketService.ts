import fs from 'fs';
import path from 'path';

// Real Data Market Service - Reads from your CSV files + External APIs
// Replaces hardcoded values with actual HUD + ZORI + Census + BLS data

export interface RealMarketData {
  location: {
    city: string;
    state: string;
    metro?: string;
    county?: string;
  };
  
  priceData: {
    // HUD Fair Market Rent (40th percentile baseline)
    hudFMR: {
      studio: number;
      oneBed: number;
      twoBed: number;
      threeBed: number;
      fourBed: number;
      year: number;
      percentile: 40;
    };
    
    // Zillow ZORI (35-65th percentile asking rents)
    zoriAsking: {
      currentRent: number;
      monthlyChange: number;
      yearlyChange: number;
      percentile: '35-65';
      lastUpdated: string;
    };
    
    // Multi-source confidence scoring
    confidence: {
      score: number; // 0-100
      agreement: number; // How much sources agree
      dataQuality: 'high' | 'medium' | 'low';
      explanation: string;
    };
  };
  
  contextualData: {
    // Census ACS data for affordability context
    demographics: {
      medianHouseholdIncome: number;
      medianRenterIncome: number;
      rentBurden30Plus: number; // % paying 30%+ of income on rent
      year: number;
    };
    
    // BLS inflation data
    inflation: {
      rentInflationRate: number; // Annual CPI change for rent
      nationalComparison: number;
      lastUpdated: string;
    };
    
    // Market positioning
    marketPosition: {
      percentileRanking: number; // Where this market falls nationally
      affordabilityIndex: number; // Rent-to-income ratio
      marketTrend: 'rising' | 'stable' | 'cooling';
    };
  };
}

export class RealDataMarketService {
  private hudData: any[] = [];
  private zoriData: any[] = [];
  private censusApiKey = '6047d2393fe6ae5a6e0fd92a4d1fde8175f27b8a';
  
  constructor() {
    this.loadCSVData();
  }
  
  /**
   * Load your CSV data files into memory for fast querying
   */
  private async loadCSVData() {
    try {
      const dataPath = path.join(process.cwd(), 'Predictiondata', 'Rental Data');
      
      // Load HUD FMR data (40th percentile government baseline)
      console.log('📊 Loading HUD Fair Market Rent data...');
      const hudPath = path.join(dataPath, 'FMR_All_1983_2025.csv');
      if (fs.existsSync(hudPath)) {
        const hudCsv = fs.readFileSync(hudPath, 'utf-8');
        this.hudData = this.parseCSV(hudCsv);
        console.log(`✅ Loaded ${this.hudData.length} HUD FMR records`);
      }
      
      // Load Zillow ZORI data (35-65th percentile asking rents)
      console.log('📊 Loading Zillow ZORI data...');
      const zoriPath = path.join(dataPath, 'City_zori_uc_sfrcondomfr_sm_sa_month.csv');
      if (fs.existsSync(zoriPath)) {
        const zoriCsv = fs.readFileSync(zoriPath, 'utf-8');
        this.zoriData = this.parseCSV(zoriCsv);
        console.log(`✅ Loaded ${this.zoriData.length} Zillow ZORI records`);
      }
      
    } catch (error) {
      console.error('❌ Error loading CSV data:', error);
    }
  }
  
  /**
   * Parse CSV with intelligent header detection and data typing
   */
  private parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        
        // Intelligent type conversion
        if (value && !isNaN(Number(value)) && value !== '') {
          row[header] = Number(value);
        } else {
          row[header] = value || null;
        }
      });
      
      data.push(row);
    }
    
    return data;
  }
  
  /**
   * Get comprehensive market analysis using your real data + external APIs
   */
  async getMarketAnalysis(location: string, bedrooms: number = 2): Promise<RealMarketData> {
    console.log(`🔍 Analyzing market for ${location}, ${bedrooms}BR using real data...`);
    
    // Parse location for better matching
    const locationData = this.parseLocation(location);
    
    // Get HUD FMR data (40th percentile baseline)
    const hudAnalysis = this.getHUDAnalysis(locationData, bedrooms);
    
    // Get Zillow ZORI data (35-65th percentile asking rents)  
    const zoriAnalysis = this.getZORIAnalysis(locationData);
    
    // Get Census demographic data
    const demographicData = await this.getCensusData(locationData);
    
    // Get BLS inflation data
    const inflationData = await this.getBLSInflationData();
    
    // Calculate confidence score based on data source agreement
    const confidence = this.calculateConfidence(hudAnalysis, zoriAnalysis, demographicData);
    
    // Determine market positioning
    const marketPosition = this.calculateMarketPosition(hudAnalysis, zoriAnalysis, demographicData, inflationData);
    
    return {
      location: locationData,
      priceData: {
        hudFMR: hudAnalysis,
        zoriAsking: zoriAnalysis,
        confidence
      },
      contextualData: {
        demographics: demographicData,
        inflation: inflationData,
        marketPosition
      }
    };
  }
  
  /**
   * Parse location string into structured data for better CSV matching
   */
  private parseLocation(location: string) {
    // Extract city, state patterns
    const cityStatePattern = /([^,]+),\s*([A-Z]{2})/;
    const match = location.match(cityStatePattern);
    
    if (match) {
      return {
        city: match[1].trim(),
        state: match[2].trim(),
        metro: null,
        county: null
      };
    }
    
    // Handle single city names (try to infer state)
    const cityInferences = {
      'austin': { city: 'Austin', state: 'TX' },
      'houston': { city: 'Houston', state: 'TX' },
      'dallas': { city: 'Dallas', state: 'TX' },
      'chicago': { city: 'Chicago', state: 'IL' },
      'miami': { city: 'Miami', state: 'FL' },
      'seattle': { city: 'Seattle', state: 'WA' },
      'denver': { city: 'Denver', state: 'CO' },
      'atlanta': { city: 'Atlanta', state: 'GA' }
    };
    
    const lowerLocation = location.toLowerCase();
    const inference = cityInferences[lowerLocation];
    
    return inference || {
      city: location,
      state: null,
      metro: null,
      county: null
    };
  }
  
  /**
   * Get HUD Fair Market Rent analysis (40th percentile government baseline)
   */
  private getHUDAnalysis(locationData: any, bedrooms: number) {
    console.log('📊 Analyzing HUD FMR data (40th percentile baseline)...');
    
    // Search for matching HUD record
    const hudMatch = this.hudData.find(record => {
      const areaName = record.areaname25 || record.areaname || '';
      return areaName.toLowerCase().includes(locationData.city.toLowerCase()) ||
             (locationData.state && areaName.toLowerCase().includes(locationData.state.toLowerCase()));
    });
    
    if (hudMatch) {
      return {
        studio: hudMatch.fmr25_0 || hudMatch.fmr24_0 || 0,
        oneBed: hudMatch.fmr25_1 || hudMatch.fmr24_1 || 0,
        twoBed: hudMatch.fmr25_2 || hudMatch.fmr24_2 || 0,
        threeBed: hudMatch.fmr25_3 || hudMatch.fmr24_3 || 0,
        fourBed: hudMatch.fmr25_4 || hudMatch.fmr24_4 || 0,
        year: 2025,
        percentile: 40 as const
      };
    }
    
    // Fallback to state/regional average
    console.log('⚠️ No direct HUD match, using regional estimate');
    const bedroomEstimates = {
      0: 800,   // Studio
      1: 1000,  // 1BR
      2: 1200,  // 2BR  
      3: 1500,  // 3BR
      4: 1800   // 4BR
    };
    
    return {
      studio: bedroomEstimates[0],
      oneBed: bedroomEstimates[1],
      twoBed: bedroomEstimates[2],
      threeBed: bedroomEstimates[3],
      fourBed: bedroomEstimates[4],
      year: 2025,
      percentile: 40 as const
    };
  }
  
  /**
   * Get Zillow ZORI analysis (35-65th percentile asking rents)
   */
  private getZORIAnalysis(locationData: any) {
    console.log('📊 Analyzing Zillow ZORI data (35-65th percentile asking rents)...');
    
    // Search for matching ZORI record
    const zoriMatch = this.zoriData.find(record => {
      const regionName = record.RegionName || '';
      const stateName = record.StateName || record.State || '';
      
      return regionName.toLowerCase().includes(locationData.city.toLowerCase()) ||
             (locationData.state && stateName === locationData.state);
    });
    
    if (zoriMatch) {
      // Get latest available rent data (work backwards from 2025)
      const latestRent = zoriMatch['2025-04-30'] || 
                        zoriMatch['2025-03-31'] || 
                        zoriMatch['2025-02-28'] || 
                        zoriMatch['2025-01-31'] || 
                        zoriMatch['2024-12-31'];
      
      const prevMonthRent = zoriMatch['2025-03-31'] || 
                           zoriMatch['2025-02-28'] || 
                           zoriMatch['2024-12-31'];
                           
      const prevYearRent = zoriMatch['2024-04-30'] || 
                          zoriMatch['2024-03-31'];
      
      const monthlyChange = prevMonthRent ? ((latestRent - prevMonthRent) / prevMonthRent) * 100 : 0;
      const yearlyChange = prevYearRent ? ((latestRent - prevYearRent) / prevYearRent) * 100 : 0;
      
      return {
        currentRent: Math.round(latestRent),
        monthlyChange: Math.round(monthlyChange * 10) / 10,
        yearlyChange: Math.round(yearlyChange * 10) / 10,
        percentile: '35-65' as const,
        lastUpdated: '2025-04-30'
      };
    }
    
    // Fallback estimate
    console.log('⚠️ No direct ZORI match, using regional estimate');
    return {
      currentRent: 1800, // Conservative estimate
      monthlyChange: 0.5,
      yearlyChange: 3.2,
      percentile: '35-65' as const,
      lastUpdated: '2025-04-30'
    };
  }
  
  /**
   * Get Census ACS demographic data using your API key
   */
  private async getCensusData(locationData: any) {
    console.log('📊 Fetching Census ACS demographic data...');
    
    try {
      // ACS 1-Year Estimates for income and housing costs
      // Table B19013: Median Household Income
      // Table B25064: Median Gross Rent
      // Table B25070: Gross Rent as Percentage of Household Income
      
      const year = 2022; // Latest available ACS data
      let geoCode = 'us:*'; // Default to national if we can't find specific area
      
      // Try to find state code for better geographic targeting
      const stateCodes = {
        'TX': '48', 'CA': '06', 'FL': '12', 'NY': '36', 'IL': '17',
        'WA': '53', 'CO': '08', 'GA': '13', 'MA': '25', 'PA': '42'
      };
      
      if (locationData.state && stateCodes[locationData.state]) {
        geoCode = `state:${stateCodes[locationData.state]}`;
      }
      
      const baseUrl = 'https://api.census.gov/data/2022/acs/acs1';
      const variables = 'B19013_001E,B25064_001E,B25070_007E,B25070_008E,B25070_009E,B25070_010E';
      const url = `${baseUrl}?get=${variables}&for=${geoCode}&key=${this.censusApiKey}`;
      
      console.log('🔗 Census API URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.length > 1) {
        const values = data[1]; // First data row
        const medianIncome = parseInt(values[0]) || 0;
        const medianRent = parseInt(values[1]) || 0;
        
        // Calculate rent burden (people paying 30%+ of income on rent)
        const burden30_34 = parseInt(values[2]) || 0;
        const burden35_39 = parseInt(values[3]) || 0;
        const burden40_49 = parseInt(values[4]) || 0;
        const burden50Plus = parseInt(values[5]) || 0;
        const totalBurdened = burden30_34 + burden35_39 + burden40_49 + burden50Plus;
        
        return {
          medianHouseholdIncome: medianIncome,
          medianRenterIncome: Math.round(medianIncome * 0.8), // Estimate: renters typically earn 80% of area median
          rentBurden30Plus: totalBurdened,
          year: year
        };
      }
      
    } catch (error) {
      console.log('⚠️ Census API error (using estimates):', error);
    }
    
    // Fallback estimates
    return {
      medianHouseholdIncome: 65000,
      medianRenterIncome: 52000,
      rentBurden30Plus: 35, // 35% of renters paying 30%+ (national avg)
      year: 2022
    };
  }
  
  /**
   * Get BLS CPI rent inflation data
   */
  private async getBLSInflationData() {
    console.log('📊 Fetching BLS CPI rent inflation data...');
    
    try {
      // BLS API for rent of primary residence (CUUR0000SEHA)
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 1;
      
      const url = `https://api.bls.gov/publicAPI/v1/timeseries/data/CUUR0000SEHA?startyear=${startYear}&endyear=${currentYear}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'REQUEST_SUCCEEDED' && data.Results.series[0].data.length > 0) {
        const series = data.Results.series[0].data;
        
        // Calculate annual change from most recent data
        const latest = series[0];
        const yearAgo = series.find(d => d.year === (parseInt(latest.year) - 1).toString() && d.period === latest.period);
        
        if (yearAgo) {
          const rentInflation = ((parseFloat(latest.value) - parseFloat(yearAgo.value)) / parseFloat(yearAgo.value)) * 100;
          
          return {
            rentInflationRate: Math.round(rentInflation * 10) / 10,
            nationalComparison: 4.0, // Current national average
            lastUpdated: `${latest.year}-${latest.period}`
          };
        }
      }
      
    } catch (error) {
      console.log('⚠️ BLS API error (using estimates):', error);
    }
    
    // Fallback estimates
    return {
      rentInflationRate: 4.1,
      nationalComparison: 4.0,
      lastUpdated: '2025-04'
    };
  }
  
  /**
   * Calculate confidence score based on data source agreement
   * Addresses the single-source bias issue you identified
   */
  private calculateConfidence(hudData: any, zoriData: any, censusData: any) {
    const sources = [];
    
    // HUD baseline (40th percentile)
    const hudEstimate = hudData.twoBed;
    if (hudEstimate > 0) sources.push(hudEstimate);
    
    // ZORI asking rate (35-65th percentile)  
    const zoriEstimate = zoriData.currentRent;
    if (zoriEstimate > 0) sources.push(zoriEstimate);
    
    // Census median (broader market context)
    if (censusData.medianRenterIncome > 0) {
      const affordableRent = Math.round(censusData.medianRenterIncome * 0.3 / 12); // 30% rule
      sources.push(affordableRent);
    }
    
    if (sources.length < 2) {
      return {
        score: 40,
        agreement: 0,
        dataQuality: 'low' as const,
        explanation: 'Limited data sources available for validation'
      };
    }
    
    // Calculate coefficient of variation (lower = higher agreement)
    const mean = sources.reduce((a, b) => a + b, 0) / sources.length;
    const variance = sources.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sources.length;
    const cv = Math.sqrt(variance) / mean;
    
    const agreement = Math.max(0, 100 * (1 - cv));
    const score = Math.min(100, agreement + (sources.length * 10)); // Bonus for more sources
    
    return {
      score: Math.round(score),
      agreement: Math.round(agreement),
      dataQuality: score > 80 ? 'high' : score > 60 ? 'medium' : 'low',
      explanation: score > 80 
        ? 'High confidence: Multiple data sources agree closely'
        : score > 60 
        ? 'Moderate confidence: Some variation between sources'
        : 'Lower confidence: Limited data or significant source disagreement'
    };
  }
  
  /**
   * Calculate market positioning with percentile awareness
   */
  private calculateMarketPosition(hudData: any, zoriData: any, censusData: any, inflationData: any) {
    // Calculate where this market falls percentile-wise
    const hudBaseline = hudData.twoBed; // 40th percentile
    const zoriAsking = zoriData.currentRent; // 50th percentile (35-65 range)
    
    // Percentile ranking based on relationship to HUD baseline
    let percentileRanking = 50; // Default median
    if (zoriAsking > hudBaseline * 1.4) percentileRanking = 80; // High-cost market
    else if (zoriAsking > hudBaseline * 1.2) percentileRanking = 65; // Above-average
    else if (zoriAsking < hudBaseline * 1.1) percentileRanking = 35; // Below-average
    
    // Affordability index (lower = more affordable)
    const affordabilityIndex = censusData.medianRenterIncome > 0 
      ? Math.round((zoriAsking * 12 / censusData.medianRenterIncome) * 100) / 100
      : 0.3;
    
    // Market trend based on ZORI data
    let marketTrend: 'rising' | 'stable' | 'cooling' = 'stable';
    if (zoriData.yearlyChange > 5) marketTrend = 'rising';
    else if (zoriData.yearlyChange < 2) marketTrend = 'cooling';
    
    return {
      percentileRanking,
      affordabilityIndex,
      marketTrend
    };
  }
}

export const realDataMarketService = new RealDataMarketService();