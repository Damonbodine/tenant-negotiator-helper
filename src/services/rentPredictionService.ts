import { supabase } from '../integrations/supabase/client';

export interface HUDFairMarketRent {
  fips_code: string;
  county_name: string;
  state_code: string;
  year: number;
  studio_fmr: number;
  one_br_fmr: number;
  two_br_fmr: number;
  three_br_fmr: number;
  four_br_fmr: number;
  metro_area?: string;
  efficiency_fmr?: number;
}

export interface ZillowRentData {
  region_id: string;
  region_name: string;
  state: string;
  metro_area: string;
  date: string;
  zori: number; // Zillow Observed Rent Index
  rent_growth_yoy: number;
  rent_growth_mom: number;
  inventory_level?: number;
}

export interface RentPrediction {
  location_id: string;
  prediction_date: Date;
  current_rent: number;
  predicted_rent_6mo: number;
  predicted_rent_12mo: number;
  confidence_score: number;
  data_sources: string[];
  contributing_factors: {
    historical_trend: number;
    seasonal_adjustment: number;
    market_cycle_stage: string;
    economic_indicators: any;
  };
}

export class RentPredictionService {
  private hudBaseUrl = 'https://www.huduser.gov/portal/datasets/fmr';
  private zillowApiKey?: string;

  constructor(zillowApiKey?: string) {
    this.zillowApiKey = zillowApiKey;
  }

  /**
   * Download and process HUD Fair Market Rent data
   * HUD publishes FMR data annually for all counties
   */
  async ingestHUDData(startYear: number = 2010, endYear: number = 2024): Promise<void> {
    console.log(`🏛️ Starting HUD FMR data ingestion for ${startYear}-${endYear}`);

    for (let year = startYear; year <= endYear; year++) {
      try {
        await this.processHUDYear(year);
        console.log(`✅ Processed HUD data for ${year}`);
        
        // Add delay to be respectful to HUD servers
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error processing HUD data for ${year}:`, error);
      }
    }

    console.log('🎉 HUD data ingestion complete!');
  }

  private async processHUDYear(year: number): Promise<void> {
    // HUD FMR data URLs follow a pattern
    const hudUrl = `https://www.huduser.gov/portal/datasets/fmr/fmr${year}/FY${year}_4050_FMR.xlsx`;
    
    try {
      console.log(`📥 Fetching HUD data for ${year}...`);
      
      // For now, we'll implement a CSV-based approach since direct Excel parsing is complex
      // HUD also provides CSV versions of their data
      const csvUrl = this.getHUDCSVUrl(year);
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch HUD data for ${year}: ${response.statusText}`);
      }

      const csvData = await response.text();
      const parsedData = this.parseHUDCSV(csvData, year);
      
      // Batch insert to database
      await this.insertHUDData(parsedData);
      
    } catch (error) {
      console.error(`Error processing HUD ${year}:`, error);
      throw error;
    }
  }

  private getHUDCSVUrl(year: number): string {
    // HUD provides both Excel and CSV formats
    // Using a fallback approach for CSV data
    return `https://www.huduser.gov/portal/datasets/fmr/fmr${year}/FY${year}_4050_FMR.csv`;
  }

  private parseHUDCSV(csvData: string, year: number): HUDFairMarketRent[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data: HUDFairMarketRent[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      
      if (row.length < headers.length) continue;
      
      try {
        const record: HUDFairMarketRent = {
          fips_code: row[headers.indexOf('fips2010')] || row[headers.indexOf('fipscode')] || row[0],
          county_name: row[headers.indexOf('countyname')] || row[headers.indexOf('areaname')] || row[1],
          state_code: row[headers.indexOf('state')] || row[headers.indexOf('state_alpha')] || row[2],
          year: year,
          studio_fmr: parseFloat(row[headers.indexOf('fmr_0')] || row[headers.indexOf('studio')] || '0'),
          one_br_fmr: parseFloat(row[headers.indexOf('fmr_1')] || row[headers.indexOf('onebr')] || '0'),
          two_br_fmr: parseFloat(row[headers.indexOf('fmr_2')] || row[headers.indexOf('twobr')] || '0'),
          three_br_fmr: parseFloat(row[headers.indexOf('fmr_3')] || row[headers.indexOf('threebr')] || '0'),
          four_br_fmr: parseFloat(row[headers.indexOf('fmr_4')] || row[headers.indexOf('fourbr')] || '0'),
          metro_area: row[headers.indexOf('metro_code')] || row[headers.indexOf('metro')] || undefined
        };
        
        data.push(record);
      } catch (error) {
        console.warn(`Skipping malformed row ${i} for year ${year}`);
      }
    }
    
    return data;
  }

  private async insertHUDData(data: HUDFairMarketRent[]): Promise<void> {
    const batchSize = 100;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('hud_fair_market_rents')
        .upsert(batch, { 
          onConflict: 'fips_code,year',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error inserting HUD batch:', error);
        throw error;
      }
    }
  }

  /**
   * Ingest Zillow Rent Data
   * Using Zillow Observed Rent Index (ZORI) data
   */
  async ingestZillowData(): Promise<void> {
    console.log('🏠 Starting Zillow rent data ingestion');

    try {
      // Zillow publishes ZORI data as CSV files
      const zoriUrl = 'https://files.zillowstatic.com/research/public_csvs/zori/Metro_zori_uc_sfrcondomhoa_month.csv';
      
      const response = await fetch(zoriUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Zillow data: ${response.statusText}`);
      }

      const csvData = await response.text();
      const parsedData = this.parseZillowCSV(csvData);
      
      await this.insertZillowData(parsedData);
      
      console.log('✅ Zillow data ingestion complete!');
    } catch (error) {
      console.error('❌ Error ingesting Zillow data:', error);
      throw error;
    }
  }

  private parseZillowCSV(csvData: string): ZillowRentData[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data: ZillowRentData[] = [];
    
    // Find date columns (format: YYYY-MM-DD)
    const dateColumns = headers.filter(h => /^\d{4}-\d{2}-\d{2}$/.test(h));
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      
      if (row.length < headers.length) continue;
      
      const regionId = row[headers.indexOf('RegionID')];
      const regionName = row[headers.indexOf('RegionName')];
      const state = row[headers.indexOf('State')];
      const metro = row[headers.indexOf('Metro')];
      
      // Process each date column to create time series data
      dateColumns.forEach((date, dateIndex) => {
        const zoriValue = parseFloat(row[headers.indexOf(date)]);
        
        if (!isNaN(zoriValue) && zoriValue > 0) {
          // Calculate year-over-year growth if we have previous year data
          const prevYearDate = new Date(date);
          prevYearDate.setFullYear(prevYearDate.getFullYear() - 1);
          const prevYearColumn = prevYearDate.toISOString().split('T')[0];
          const prevYearValue = parseFloat(row[headers.indexOf(prevYearColumn)] || '0');
          
          const yoyGrowth = prevYearValue > 0 ? 
            ((zoriValue - prevYearValue) / prevYearValue) * 100 : 0;

          data.push({
            region_id: regionId,
            region_name: regionName,
            state: state,
            metro_area: metro,
            date: date,
            zori: zoriValue,
            rent_growth_yoy: yoyGrowth,
            rent_growth_mom: 0 // We'll calculate this separately
          });
        }
      });
    }
    
    return data;
  }

  private async insertZillowData(data: ZillowRentData[]): Promise<void> {
    const batchSize = 100;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('zillow_rent_data')
        .upsert(batch, { 
          onConflict: 'region_id,date',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error inserting Zillow batch:', error);
        throw error;
      }
    }
  }

  /**
   * Calculate rent predictions based on historical data
   */
  async generateRentPrediction(
    location: string, 
    bedroomCount: number = 2, 
    predictionMonths: number = 12
  ): Promise<RentPrediction | null> {
    try {
      console.log(`🔮 Generating rent prediction for ${location}, ${bedroomCount}BR`);

      // Get historical HUD data for trend analysis
      const hudData = await this.getHUDHistoricalData(location, bedroomCount);
      
      // Get Zillow data for current market trends
      const zillowData = await this.getZillowCurrentData(location);
      
      if (!hudData.length && !zillowData.length) {
        console.warn(`No data found for location: ${location}`);
        return null;
      }

      // Calculate historical trend
      const historicalTrend = this.calculateHistoricalTrend(hudData);
      
      // Get current market conditions
      const currentRent = this.getCurrentRent(hudData, zillowData, bedroomCount);
      
      // Apply seasonal adjustments
      const seasonalAdjustment = this.calculateSeasonalAdjustment(new Date());
      
      // Generate prediction
      const prediction: RentPrediction = {
        location_id: location,
        prediction_date: new Date(),
        current_rent: currentRent,
        predicted_rent_6mo: this.projectRent(currentRent, historicalTrend, seasonalAdjustment, 6),
        predicted_rent_12mo: this.projectRent(currentRent, historicalTrend, seasonalAdjustment, 12),
        confidence_score: this.calculateConfidence(hudData.length, zillowData.length),
        data_sources: ['hud_fmr', 'zillow_zori'],
        contributing_factors: {
          historical_trend: historicalTrend,
          seasonal_adjustment: seasonalAdjustment,
          market_cycle_stage: this.determineMarketCycle(hudData, zillowData),
          economic_indicators: {} // To be enhanced later
        }
      };

      // Store prediction
      await this.storePrediction(prediction);
      
      return prediction;
      
    } catch (error) {
      console.error('Error generating rent prediction:', error);
      throw error;
    }
  }

  private async getHUDHistoricalData(location: string, bedroomCount: number): Promise<any[]> {
    const column = this.getHUDBedoomColumn(bedroomCount);
    
    const { data, error } = await supabase
      .from('hud_fair_market_rents')
      .select(`year, ${column}, county_name, state_code`)
      .or(`county_name.ilike.%${location}%,state_code.ilike.%${location}%`)
      .order('year', { ascending: true });

    if (error) {
      console.error('Error fetching HUD data:', error);
      return [];
    }

    return data || [];
  }

  private async getZillowCurrentData(location: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('zillow_rent_data')
      .select('*')
      .or(`region_name.ilike.%${location}%,state.ilike.%${location}%,metro_area.ilike.%${location}%`)
      .order('date', { ascending: false })
      .limit(12); // Last 12 months

    if (error) {
      console.error('Error fetching Zillow data:', error);
      return [];
    }

    return data || [];
  }

  private getHUDBedoomColumn(bedroomCount: number): string {
    const columnMap = {
      0: 'studio_fmr',
      1: 'one_br_fmr', 
      2: 'two_br_fmr',
      3: 'three_br_fmr',
      4: 'four_br_fmr'
    };
    return columnMap[bedroomCount as keyof typeof columnMap] || 'two_br_fmr';
  }

  private calculateHistoricalTrend(hudData: any[]): number {
    if (hudData.length < 2) return 0;

    // Calculate year-over-year growth rates
    const growthRates: number[] = [];
    
    for (let i = 1; i < hudData.length; i++) {
      const current = hudData[i];
      const previous = hudData[i - 1];
      
      const currentRent = this.extractRentFromHUDRecord(current);
      const previousRent = this.extractRentFromHUDRecord(previous);
      
      if (currentRent && previousRent && previousRent > 0) {
        const growthRate = ((currentRent - previousRent) / previousRent) * 100;
        growthRates.push(growthRate);
      }
    }
    
    // Return average growth rate
    return growthRates.length > 0 ? 
      growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0;
  }

  private extractRentFromHUDRecord(record: any): number {
    // Try different bedroom columns and return the first valid value
    const columns = ['two_br_fmr', 'one_br_fmr', 'three_br_fmr', 'studio_fmr', 'four_br_fmr'];
    
    for (const column of columns) {
      const value = parseFloat(record[column]);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
    
    return 0;
  }

  private getCurrentRent(hudData: any[], zillowData: any[], bedroomCount: number): number {
    // Prefer Zillow data for current market rates, fallback to latest HUD
    if (zillowData.length > 0) {
      const latestZillow = zillowData[0];
      return latestZillow.zori || 0;
    }
    
    if (hudData.length > 0) {
      const latestHUD = hudData[hudData.length - 1];
      return this.extractRentFromHUDRecord(latestHUD);
    }
    
    return 0;
  }

  private calculateSeasonalAdjustment(currentDate: Date): number {
    const month = currentDate.getMonth(); // 0-11
    
    // Rental market seasonality (based on typical patterns)
    const seasonalFactors = [
      -0.02, // January - slower market
      -0.01, // February
      0.01,  // March - spring pickup
      0.02,  // April
      0.03,  // May - peak season
      0.03,  // June
      0.02,  // July
      0.02,  // August
      0.01,  // September
      -0.01, // October - market cooling
      -0.02, // November
      -0.02  // December
    ];
    
    return seasonalFactors[month];
  }

  private projectRent(
    currentRent: number, 
    annualTrend: number, 
    seasonalAdjustment: number, 
    months: number
  ): number {
    // Convert annual trend to monthly
    const monthlyTrend = annualTrend / 12;
    
    // Apply trend and seasonal adjustment
    const trendAdjustment = (monthlyTrend / 100) * months;
    const seasonalImpact = seasonalAdjustment;
    
    const projectedRent = currentRent * (1 + trendAdjustment + seasonalImpact);
    
    return Math.round(projectedRent);
  }

  private calculateConfidence(hudDataPoints: number, zillowDataPoints: number): number {
    // Confidence based on data availability
    let confidence = 0;
    
    if (hudDataPoints >= 5) confidence += 40; // Historical trend confidence
    else if (hudDataPoints >= 2) confidence += 20;
    
    if (zillowDataPoints >= 6) confidence += 40; // Current market confidence  
    else if (zillowDataPoints >= 3) confidence += 20;
    
    if (hudDataPoints > 0 && zillowDataPoints > 0) confidence += 20; // Multi-source bonus
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  private determineMarketCycle(hudData: any[], zillowData: any[]): string {
    // Simple market cycle determination based on recent trends
    if (zillowData.length >= 3) {
      const recentGrowth = zillowData.slice(0, 3).map(d => d.rent_growth_yoy);
      const avgRecentGrowth = recentGrowth.reduce((sum, growth) => sum + growth, 0) / recentGrowth.length;
      
      if (avgRecentGrowth > 5) return 'hot';
      if (avgRecentGrowth > 2) return 'rising';
      if (avgRecentGrowth > -1) return 'stable';
      return 'cooling';
    }
    
    return 'stable';
  }

  private async storePrediction(prediction: RentPrediction): Promise<void> {
    const { error } = await supabase
      .from('rent_predictions')
      .upsert(prediction, { 
        onConflict: 'location_id,prediction_date',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error storing prediction:', error);
      throw error;
    }
  }

  /**
   * Get the latest prediction for a location
   */
  async getLatestPrediction(location: string): Promise<RentPrediction | null> {
    const { data, error } = await supabase
      .from('rent_predictions')
      .select('*')
      .eq('location_id', location)
      .order('prediction_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching prediction:', error);
      return null;
    }

    return data;
  }
}