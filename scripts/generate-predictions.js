#!/usr/bin/env node

/**
 * Rent Prediction Algorithm
 * Combines HUD historical data with Zillow market trends to generate predictions
 * Uses multiple models: trend analysis, seasonal adjustments, and market cycle detection
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration  
const SUPABASE_URL = 'https://izzdyfrcxunfzlfgdjuv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Prediction configuration
const PREDICTION_CONFIG = {
  horizons: [3, 6, 12, 24], // months ahead to predict
  confidence_threshold: 0.5, // minimum confidence to store prediction (lowered for initial testing)
  seasonal_window: 3, // years to analyze for seasonal patterns
  trend_window: 5, // years for trend analysis
  market_cycle_months: 72 // typical real estate cycle length
};

class RentPredictionEngine {
  constructor() {
    this.currentDate = new Date();
    this.currentYear = this.currentDate.getFullYear();
    this.currentMonth = this.currentDate.getMonth();
    
    // Percentile adjustment factors for data normalization
    this.percentileAdjustments = {
      // HUD FMR represents 40th percentile (affordable housing baseline)
      hud_to_market_median: 1.18,     // ~18% adjustment from 40th to 50th percentile
      hud_to_market_rate: 1.35,       // ~35% adjustment from 40th to market rate (60th percentile)
      
      // Zillow ZORI represents 35th-65th percentile median (market rate)
      zillow_to_market_median: 1.0,   // Already at market median
      
      // Data source reliability weights
      hud_weight: 0.35,    // Strong for long-term trends, conservative baseline
      zillow_weight: 0.65  // Strong for current market conditions, recent trends
    };
  }

  // Main prediction generation
  async generateAllPredictions() {
    console.log('🔮 Starting rent prediction generation...\n');

    try {
      // Get all unique locations with data
      const locations = await this.getLocationsWithData();
      console.log(`📍 Found ${locations.length} locations with data`);

      const results = [];
      for (const location of locations) {
        console.log(`\n🏠 Processing: ${location.name} (${location.type})`);
        
        try {
          const predictions = await this.generateLocationPredictions(location);
          results.push(...predictions);
        } catch (error) {
          console.error(`❌ Error predicting for ${location.name}:`, error.message);
        }
      }

      // Store predictions in database
      await this.storePredictions(results);

      console.log(`\n✅ Generated ${results.length} total predictions`);
      return results;

    } catch (error) {
      console.error('❌ Fatal error in prediction generation:', error.message);
      throw error;
    }
  }

  async getLocationsWithData() {
    const locations = [];

    // Get HUD locations (county-level) - focusing on key areas
    try {
      const { data: hudData, error: hudError } = await supabase
        .from('hud_fair_market_rents')
        .select('fips_code, county_name, state_code, state_name')
        .gte('year', this.currentYear - 5)
        // 🚀 EPIC MODE: Process ALL states for complete US coverage!
        .order('fips_code');

      if (!hudError && hudData) {
        const uniqueHUD = this.deduplicateBy(hudData, 'fips_code');
        uniqueHUD.forEach(loc => {
          // 🚀 EPIC MODE: Process ALL counties for complete coverage!
          locations.push({
            id: loc.fips_code,
            name: `${loc.county_name}, ${loc.state_code}`,
            type: 'county',
            state_code: loc.state_code,
            state_name: loc.state_name
          });
        });
      }
    } catch (error) {
      console.error('Error getting HUD locations:', error.message);
    }

    // Get Zillow locations (metro-level) - focusing on key metros
    try {
      const { data: zillowData, error: zillowError } = await supabase
        .from('zillow_rent_data')
        .select('metro_area, state_code')
        .gte('report_date', new Date(this.currentYear - 2, 0, 1).toISOString().split('T')[0])
        .order('metro_area');

      if (!zillowError && zillowData) {
        const uniqueZillow = this.deduplicateBy(zillowData, 'metro_area');
        uniqueZillow.forEach(loc => {
          // 🚀 EPIC MODE: Process ALL metro areas for complete coverage!
          locations.push({
            id: loc.metro_area,
            name: loc.metro_area,
            type: 'metro',
            state_code: loc.state_code
          });
        });
      }
    } catch (error) {
      console.error('Error getting Zillow locations:', error.message);
    }

    return locations;
  }

  async generateLocationPredictions(location) {
    const predictions = [];

    // Get historical data for this location
    const historicalData = await this.getHistoricalData(location);
    if (!historicalData || historicalData.length < 12) {
      console.log(`⚠️ Insufficient data for ${location.name} (${historicalData?.length || 0} points)`);
      return [];
    }

    console.log(`📊 Analyzing ${historicalData.length} data points`);

    // Calculate current baseline rent
    const currentRent = this.getCurrentRent(historicalData);
    if (!currentRent) {
      console.log(`⚠️ Cannot determine current rent for ${location.name}`);
      return [];
    }

    // Run prediction models for each horizon
    for (const horizon of PREDICTION_CONFIG.horizons) {
      try {
        const prediction = await this.predictRentChange(location, historicalData, currentRent, horizon);
        if (prediction) {
          console.log(`    🎯 Confidence: ${(prediction.confidence_score * 100).toFixed(1)}% (threshold: ${(PREDICTION_CONFIG.confidence_threshold * 100).toFixed(0)}%)`);
          if (prediction.confidence_score >= PREDICTION_CONFIG.confidence_threshold) {
            predictions.push(prediction);
          } else {
            console.log(`    ⚠️ Below confidence threshold, not storing`);
          }
        }
      } catch (error) {
        console.error(`❌ Error predicting ${horizon}mo for ${location.name}:`, error.message);
      }
    }

    console.log(`✅ Generated ${predictions.length}/${PREDICTION_CONFIG.horizons.length} valid predictions`);
    return predictions;
  }

  async getHistoricalData(location) {
    const data = [];

    if (location.type === 'county') {
      // Get HUD data - transform from wide to long format
      const { data: hudData, error } = await supabase
        .from('hud_fair_market_rents')
        .select('*')
        .eq('fips_code', location.id)
        .gte('year', this.currentYear - PREDICTION_CONFIG.trend_window)
        .order('year');

      if (!error && hudData) {
        hudData.forEach(row => {
          // Calculate average rent across bedroom types for overall trend
          const rents = [
            row.studio_fmr,
            row.one_br_fmr,
            row.two_br_fmr,
            row.three_br_fmr,
            row.four_br_fmr
          ].filter(r => r && r > 0);

          if (rents.length > 0) {
            const avgRent = rents.reduce((a, b) => a + b, 0) / rents.length;
            
            // Apply percentile adjustment to normalize HUD data to market median
            const adjustedRent = avgRent * this.percentileAdjustments.hud_to_market_median;
            
            data.push({
              date: new Date(row.year, 11, 31), // End of year
              rent: adjustedRent,
              raw_rent: avgRent, // Keep original HUD value
              source: 'hud',
              percentile_type: '40th_percentile_adjusted',
              adjustment_factor: this.percentileAdjustments.hud_to_market_median,
              two_br_rent: row.two_br_fmr ? row.two_br_fmr * this.percentileAdjustments.hud_to_market_median : null
            });
          }
        });
      }
    } else if (location.type === 'metro') {
      // Get Zillow data
      const { data: zillowData, error } = await supabase
        .from('zillow_rent_data')
        .select('*')
        .eq('metro_area', location.id)
        .gte('report_date', new Date(this.currentYear - PREDICTION_CONFIG.trend_window, 0, 1).toISOString().split('T')[0])
        .order('report_date');

      if (!error && zillowData) {
        zillowData.forEach(row => {
          if (row.median_rent && row.median_rent > 0) {
            data.push({
              date: new Date(row.report_date),
              rent: row.median_rent, // Already at market median (35th-65th percentile)
              raw_rent: row.median_rent,
              mom_change: row.month_over_month_change,
              yoy_change: row.year_over_year_change,
              source: 'zillow',
              percentile_type: '35th_65th_percentile_median',
              adjustment_factor: 1.0 // No adjustment needed
            });
          }
        });
      }
    }

    return data.sort((a, b) => a.date - b.date);
  }

  getCurrentRent(historicalData) {
    if (!historicalData || historicalData.length === 0) return null;
    
    // Get recent data from both sources if available
    const recentData = historicalData.slice(-12); // Last 12 months/years
    const hudData = recentData.filter(d => d.source === 'hud');
    const zillowData = recentData.filter(d => d.source === 'zillow');
    
    // Blend sources with percentile-aware weighting
    if (hudData.length > 0 && zillowData.length > 0) {
      const latestHUD = hudData[hudData.length - 1];
      const latestZillow = zillowData[zillowData.length - 1];
      
      // Weight by recency and data source reliability
      const hudWeight = this.percentileAdjustments.hud_weight;
      const zillowWeight = this.percentileAdjustments.zillow_weight;
      
      // Apply time decay for older data
      const hudAge = (this.currentDate - latestHUD.date) / (1000 * 60 * 60 * 24 * 30); // months
      const zillowAge = (this.currentDate - latestZillow.date) / (1000 * 60 * 60 * 24 * 30);
      
      const hudTimeWeight = Math.max(0.1, 1 - (hudAge / 12)); // Decay over 12 months
      const zillowTimeWeight = Math.max(0.1, 1 - (zillowAge / 6)); // Decay over 6 months
      
      const finalHudWeight = hudWeight * hudTimeWeight;
      const finalZillowWeight = zillowWeight * zillowTimeWeight;
      const totalWeight = finalHudWeight + finalZillowWeight;
      
      const blendedRent = (
        (latestHUD.rent * finalHudWeight) + 
        (latestZillow.rent * finalZillowWeight)
      ) / totalWeight;
      
      console.log(`    📊 Blended current rent: HUD $${latestHUD.rent} (${(finalHudWeight/totalWeight*100).toFixed(1)}%) + Zillow $${latestZillow.rent} (${(finalZillowWeight/totalWeight*100).toFixed(1)}%) = $${blendedRent.toFixed(0)}`);
      
      return blendedRent;
    }
    
    // Use single source if only one available
    const latest = historicalData[historicalData.length - 1];
    return latest.rent;
  }

  async predictRentChange(location, historicalData, currentRent, horizonMonths) {
    console.log(`  🔍 Predicting ${horizonMonths}mo ahead...`);

    // 1. Trend Analysis
    const trendAnalysis = this.calculateTrendAnalysis(historicalData);
    
    // 2. Seasonal Analysis
    const seasonalAnalysis = this.calculateSeasonalAnalysis(historicalData, horizonMonths);
    
    // 3. Market Cycle Analysis
    const marketCycleAnalysis = this.calculateMarketCycleAnalysis(historicalData);
    
    // 4. Recent Momentum Analysis (for Zillow data)
    const momentumAnalysis = this.calculateMomentumAnalysis(historicalData);

    // 5. Data Quality Assessment
    const dataQuality = this.assessDataQuality(historicalData);

    // 6. Combine models with data quality weighting
    const prediction = this.combineModels({
      currentRent,
      horizonMonths,
      trend: trendAnalysis,
      seasonal: seasonalAnalysis,
      marketCycle: marketCycleAnalysis,
      momentum: momentumAnalysis,
      dataQuality
    });

    // 7. Calculate confidence and bounds
    console.log(`    📊 DataQuality score: ${dataQuality.score?.toFixed(2)}, percentileConfidence: ${dataQuality.percentileConfidence?.toFixed(2)}`);
    const confidence = this.calculateConfidence(historicalData, prediction, dataQuality);
    console.log(`    📊 Calculated confidence: ${confidence?.toFixed(3)}`);
    const bounds = this.calculateConfidenceBounds(prediction, confidence);

    const result = {
      location_id: location.id,
      location_type: location.type,
      location_name: location.name,
      prediction_date: new Date().toISOString().split('T')[0],
      prediction_horizon: horizonMonths,
      data_sources: this.getDataSources(historicalData),
      current_rent: currentRent,
      predicted_rent: prediction.predictedRent,
      predicted_change_percent: prediction.changePercent,
      confidence_score: confidence,
      lower_bound: bounds.lower,
      upper_bound: bounds.upper,
      contributing_factors: {
        trend_contribution: trendAnalysis.weight,
        seasonal_contribution: seasonalAnalysis.weight,
        market_cycle_contribution: marketCycleAnalysis.weight,
        momentum_contribution: momentumAnalysis.weight,
        data_quality_score: dataQuality.score,
        key_factors: prediction.keyFactors
      },
      market_cycle_stage: marketCycleAnalysis.stage,
      model_version: 'v1.0'
    };

    console.log(`    💰 $${currentRent} → $${prediction.predictedRent.toFixed(0)} (${prediction.changePercent >= 0 ? '+' : ''}${prediction.changePercent.toFixed(1)}%, conf: ${(confidence * 100).toFixed(0)}%)`);

    return result;
  }

  calculateTrendAnalysis(data) {
    if (data.length < 6) {
      return { annualGrowthRate: 0, weight: 0, reliability: 'low' };
    }

    // For HUD data (annual), calculate year-over-year growth rates
    if (data[0].source === 'hud') {
      const growthRates = [];
      for (let i = 1; i < data.length; i++) {
        const currentRent = data[i].rent;
        const previousRent = data[i - 1].rent;
        if (previousRent > 0) {
          const growth = ((currentRent - previousRent) / previousRent) * 100;
          growthRates.push(growth);
        }
      }

      if (growthRates.length === 0) return { annualGrowthRate: 0, weight: 0, reliability: 'low' };

      // Weight recent years more heavily
      const weightedGrowth = growthRates.reduce((sum, rate, index) => {
        const weight = (index + 1) / growthRates.length;
        return sum + (rate * weight);
      }, 0) / growthRates.reduce((sum, _, index) => sum + ((index + 1) / growthRates.length), 0);

      return {
        annualGrowthRate: weightedGrowth,
        weight: Math.min(0.4, 0.2 + (growthRates.length * 0.05)),
        reliability: growthRates.length >= 3 ? 'high' : 'medium',
        dataPoints: growthRates.length
      };
    }

    // For Zillow data (monthly), annualize the trend
    if (data[0].source === 'zillow') {
      const monthlyGrowthRates = [];
      for (let i = 1; i < data.length; i++) {
        const currentRent = data[i].rent;
        const previousRent = data[i - 1].rent;
        if (previousRent > 0) {
          const monthlyGrowth = ((currentRent - previousRent) / previousRent) * 100;
          monthlyGrowthRates.push(monthlyGrowth);
        }
      }

      if (monthlyGrowthRates.length === 0) return { annualGrowthRate: 0, weight: 0, reliability: 'low' };

      // Calculate average monthly growth and annualize
      const avgMonthlyGrowth = monthlyGrowthRates.reduce((a, b) => a + b, 0) / monthlyGrowthRates.length;
      const annualGrowthRate = Math.pow(1 + avgMonthlyGrowth / 100, 12) - 1;

      return {
        annualGrowthRate: annualGrowthRate * 100,
        weight: Math.min(0.35, 0.15 + (monthlyGrowthRates.length * 0.002)),
        reliability: monthlyGrowthRates.length >= 24 ? 'high' : 'medium',
        dataPoints: monthlyGrowthRates.length
      };
    }

    return { annualGrowthRate: 0, weight: 0, reliability: 'low' };
  }

  calculateSeasonalAnalysis(data, horizonMonths) {
    // Analyze seasonal patterns
    const monthlyData = {};
    
    data.forEach(point => {
      const month = point.date.getMonth();
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(point.rent);
    });

    // Calculate average rent by month
    const monthlyAverages = {};
    Object.keys(monthlyData).forEach(month => {
      const rents = monthlyData[month];
      if (rents.length > 0) {
        monthlyAverages[month] = rents.reduce((a, b) => a + b, 0) / rents.length;
      }
    });

    const currentMonth = this.currentMonth;
    const targetMonth = (currentMonth + horizonMonths) % 12;
    
    // Calculate seasonal adjustment
    const monthlyAvgs = Object.values(monthlyAverages);
    if (monthlyAvgs.length === 0) {
      return { seasonalAdjustment: 0, weight: 0, reliability: 'low' };
    }

    const overallAverage = monthlyAvgs.reduce((a, b) => a + b, 0) / monthlyAvgs.length;
    const currentSeasonalFactor = monthlyAverages[currentMonth] ? monthlyAverages[currentMonth] / overallAverage : 1;
    const targetSeasonalFactor = monthlyAverages[targetMonth] ? monthlyAverages[targetMonth] / overallAverage : 1;
    
    const seasonalAdjustment = (targetSeasonalFactor / currentSeasonalFactor - 1) * 100;

    return {
      seasonalAdjustment,
      weight: Object.keys(monthlyAverages).length >= 6 ? 0.15 : 0.05,
      reliability: Object.keys(monthlyAverages).length >= 12 ? 'high' : 'low',
      targetMonth,
      currentMonth
    };
  }

  calculateMarketCycleAnalysis(data) {
    if (data.length < 24) {
      return { stage: 'unknown', cyclicalAdjustment: 0, weight: 0 };
    }

    // Analyze recent trend to determine market cycle stage
    const recentData = data.slice(-Math.min(24, data.length)); // Last 2 years or available data
    const recentGrowthRates = [];
    
    for (let i = 1; i < recentData.length; i++) {
      const growth = ((recentData[i].rent - recentData[i-1].rent) / recentData[i-1].rent) * 100;
      // Annualize if monthly data
      const annualizedGrowth = recentData[i].source === 'zillow' ? growth * 12 : growth;
      recentGrowthRates.push(annualizedGrowth);
    }

    if (recentGrowthRates.length === 0) {
      return { stage: 'unknown', cyclicalAdjustment: 0, weight: 0 };
    }

    const avgRecentGrowth = recentGrowthRates.reduce((a, b) => a + b, 0) / recentGrowthRates.length;
    const growthVolatility = this.calculateStandardDeviation(recentGrowthRates);

    // Determine market cycle stage based on growth and volatility
    let stage = 'unknown';
    let cyclicalAdjustment = 0;

    if (avgRecentGrowth > 8 && growthVolatility < 3) {
      stage = 'peak';
      cyclicalAdjustment = -1.5; // Expect cooldown
    } else if (avgRecentGrowth > 3 && growthVolatility < 4) {
      stage = 'growth';
      cyclicalAdjustment = 0.5; // Continued growth
    } else if (avgRecentGrowth < -2 && growthVolatility > 4) {
      stage = 'trough';
      cyclicalAdjustment = 1.5; // Expect recovery
    } else if (avgRecentGrowth < 2 && growthVolatility > 3) {
      stage = 'cooling';
      cyclicalAdjustment = -0.5; // Continued softness
    } else {
      stage = 'stable';
      cyclicalAdjustment = 0;
    }

    return {
      stage,
      cyclicalAdjustment,
      weight: 0.2,
      avgRecentGrowth,
      growthVolatility,
      dataPoints: recentGrowthRates.length
    };
  }

  calculateMomentumAnalysis(data) {
    // Focus on recent momentum from Zillow data if available
    const recentData = data.slice(-6); // Last 6 months
    
    if (recentData.length === 0 || !recentData[0].mom_change) {
      return { momentumFactor: 0, weight: 0 };
    }

    // Use month-over-month changes if available
    const momChanges = recentData
      .filter(d => d.mom_change !== null && d.mom_change !== undefined && !isNaN(d.mom_change))
      .map(d => d.mom_change);

    if (momChanges.length === 0) {
      return { momentumFactor: 0, weight: 0 };
    }

    const avgMomentum = momChanges.reduce((a, b) => a + b, 0) / momChanges.length;
    
    // Annualize the momentum factor
    const annualizedMomentum = avgMomentum * 12;

    return {
      momentumFactor: annualizedMomentum,
      weight: 0.25,
      dataPoints: momChanges.length,
      reliability: momChanges.length >= 3 ? 'high' : 'medium'
    };
  }

  assessDataQuality(data) {
    let score = 0.5; // Base score

    // Data recency
    const latestDate = data[data.length - 1].date;
    const monthsOld = (new Date() - latestDate) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld <= 3) score += 0.2;
    else if (monthsOld <= 6) score += 0.15;
    else if (monthsOld <= 12) score += 0.1;

    // Data quantity
    if (data.length >= 60) score += 0.2; // 5+ years monthly or good coverage
    else if (data.length >= 36) score += 0.15;
    else if (data.length >= 24) score += 0.1;
    else if (data.length >= 12) score += 0.05;

    // Data source diversity and percentile coverage
    const hasZillow = data.some(d => d.source === 'zillow');
    const hasHUD = data.some(d => d.source === 'hud');
    const hudData = data.filter(d => d.source === 'hud');
    const zillowData = data.filter(d => d.source === 'zillow');
    
    if (hasZillow && hasHUD) {
      score += 0.15; // Both sources provide percentile coverage
      
      // Bonus for good temporal overlap after adjustment
      const recentHUD = hudData.filter(d => d.date > new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000));
      const recentZillow = zillowData.filter(d => d.date > new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000));
      
      if (recentHUD.length > 0 && recentZillow.length > 0) {
        score += 0.1; // Good recent overlap for cross-validation
      }
    } else if (hasZillow || hasHUD) {
      score += 0.05; // Single source
    }

    // Percentile adjustment confidence
    let percentileConfidence = 0.8; // Base confidence in adjustments
    
    if (hasZillow && hasHUD) {
      // Check if adjusted HUD and Zillow data are reasonably aligned
      const recentHUD = hudData.slice(-6);
      const recentZillow = zillowData.slice(-6);
      
      if (recentHUD.length > 0 && recentZillow.length > 0) {
        const avgHUD = recentHUD.reduce((sum, d) => sum + d.rent, 0) / recentHUD.length;
        const avgZillow = recentZillow.reduce((sum, d) => sum + d.rent, 0) / recentZillow.length;
        
        const variance = Math.abs(avgHUD - avgZillow) / Math.max(avgHUD, avgZillow);
        
        if (variance < 0.1) percentileConfidence += 0.15; // <10% variance = high confidence
        else if (variance < 0.2) percentileConfidence += 0.1; // <20% variance = medium confidence
        else if (variance > 0.3) percentileConfidence -= 0.1; // >30% variance = lower confidence
      }
    }

    return {
      score: Math.min(1.0, Math.max(0.1, score)),
      percentileConfidence: Math.min(1.0, Math.max(0.1, percentileConfidence)),
      monthsOld,
      dataPoints: data.length,
      sources: [...new Set(data.map(d => d.source))],
      sourceBreakdown: {
        hud: hudData.length,
        zillow: zillowData.length
      },
      percentileCoverage: {
        affordable_housing: hasHUD ? '40th percentile (adjusted)' : null,
        market_rate: hasZillow ? '35th-65th percentile median' : null
      }
    };
  }

  combineModels(inputs) {
    const { currentRent, horizonMonths, trend, seasonal, marketCycle, momentum, dataQuality } = inputs;

    // Start with trend-based prediction
    let annualGrowthRate = trend.annualGrowthRate * trend.weight;
    const keyFactors = [];

    // Add components
    if (trend.weight > 0) {
      keyFactors.push(`Historical trend: ${trend.annualGrowthRate.toFixed(1)}% annually`);
    }

    // Seasonal adjustment
    if (seasonal.weight > 0 && Math.abs(seasonal.seasonalAdjustment) > 0.5) {
      const seasonalContribution = seasonal.seasonalAdjustment * seasonal.weight;
      annualGrowthRate += seasonalContribution;
      keyFactors.push(`Seasonal effect: ${seasonal.seasonalAdjustment >= 0 ? '+' : ''}${seasonal.seasonalAdjustment.toFixed(1)}%`);
    }

    // Market cycle adjustment
    if (marketCycle.weight > 0) {
      const cycleContribution = marketCycle.cyclicalAdjustment * marketCycle.weight;
      annualGrowthRate += cycleContribution;
      keyFactors.push(`Market cycle: ${marketCycle.stage} stage`);
    }

    // Recent momentum (for shorter-term predictions)
    if (momentum.weight > 0 && horizonMonths <= 12) {
      const momentumWeight = momentum.weight * (12 / horizonMonths); // More weight for shorter predictions
      const momentumContribution = momentum.momentumFactor * momentumWeight;
      annualGrowthRate += momentumContribution;
      if (Math.abs(momentum.momentumFactor) > 1) {
        keyFactors.push(`Recent momentum: ${momentum.momentumFactor >= 0 ? '+' : ''}${momentum.momentumFactor.toFixed(1)}% annually`);
      }
    }

    // Apply data quality weighting including percentile confidence
    const qualityWeight = dataQuality.score * dataQuality.percentileConfidence;
    annualGrowthRate *= qualityWeight;
    
    // Add percentile methodology explanation to key factors
    if (dataQuality.percentileCoverage.affordable_housing && dataQuality.percentileCoverage.market_rate) {
      keyFactors.push(`Data sources: HUD (40th percentile, adjusted +18%) + Zillow (market median)`);
    } else if (dataQuality.percentileCoverage.affordable_housing) {
      keyFactors.push(`Data source: HUD Fair Market Rent (40th percentile, adjusted to market rate)`);
    } else if (dataQuality.percentileCoverage.market_rate) {
      keyFactors.push(`Data source: Zillow market rate (35th-65th percentile median)`);
    }

    // Apply time horizon
    const totalGrowthRate = (annualGrowthRate / 12) * horizonMonths;
    const predictedRent = currentRent * (1 + totalGrowthRate / 100);
    const changePercent = totalGrowthRate;

    return {
      predictedRent,
      changePercent,
      annualGrowthRate,
      keyFactors
    };
  }

  calculateConfidence(historicalData, prediction, dataQuality) {
    let confidence = 0.4; // Base confidence

    // Data quality contributes significantly, including percentile confidence
    confidence += dataQuality.score * 0.25;
    confidence += dataQuality.percentileConfidence * 0.15;

    // Reasonable prediction range increases confidence
    if (Math.abs(prediction.changePercent) <= 15) confidence += 0.15;
    if (Math.abs(prediction.changePercent) <= 8) confidence += 0.1;

    // Multiple data sources with percentile coverage
    const sources = this.getDataSources(historicalData);
    if (sources.length > 1) {
      confidence += 0.1; // Multiple sources increase confidence more with percentile adjustment
    } else {
      confidence += 0.05; // Single source
    }

    // Bonus for well-aligned percentile-adjusted data
    const hudData = historicalData.filter(d => d.source === 'hud');
    const zillowData = historicalData.filter(d => d.source === 'zillow');
    
    if (hudData.length > 0 && zillowData.length > 0) {
      // Check alignment of recent data after percentile adjustment
      const recentHUD = hudData.slice(-3);
      const recentZillow = zillowData.slice(-3);
      
      if (recentHUD.length > 0 && recentZillow.length > 0) {
        const avgHUD = recentHUD.reduce((sum, d) => sum + d.rent, 0) / recentHUD.length;
        const avgZillow = recentZillow.reduce((sum, d) => sum + d.rent, 0) / recentZillow.length;
        const alignment = 1 - Math.min(0.3, Math.abs(avgHUD - avgZillow) / Math.max(avgHUD, avgZillow));
        
        confidence += alignment * 0.1; // Up to 10% bonus for good alignment
      }
    }

    // Prediction magnitude reasonableness
    if (prediction.changePercent >= -10 && prediction.changePercent <= 25) {
      confidence += 0.1; // Reasonable range
    }

    return Math.min(1.0, Math.max(0.1, confidence));
  }

  calculateConfidenceBounds(prediction, confidence) {
    // Wider bounds for lower confidence
    const uncertainty = (1 - confidence) * 0.25; // 0-25% uncertainty range
    const range = prediction.predictedRent * uncertainty;

    return {
      lower: Math.max(prediction.predictedRent * 0.7, prediction.predictedRent - range), // Floor at 30% drop
      upper: Math.min(prediction.predictedRent * 1.5, prediction.predictedRent + range)  // Cap at 50% increase
    };
  }

  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  getDataSources(historicalData) {
    const sources = [...new Set(historicalData.map(d => d.source))];
    return sources;
  }

  deduplicateBy(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  async storePredictions(predictions) {
    if (predictions.length === 0) {
      console.log('📭 No predictions to store');
      return;
    }

    console.log(`💾 Storing ${predictions.length} predictions...`);

    const batchSize = 50;
    let stored = 0;
    let errors = 0;

    for (let i = 0; i < predictions.length; i += batchSize) {
      const batch = predictions.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('rent_predictions')
          .upsert(batch, {
            onConflict: 'location_id,prediction_date,prediction_horizon',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ Batch error (${i}-${i + batch.length}):`, error.message);
          errors += batch.length;
        } else {
          stored += batch.length;
          console.log(`✅ Stored batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(predictions.length/batchSize)}`);
        }
      } catch (error) {
        console.error(`❌ Batch error (${i}-${i + batch.length}):`, error.message);
        errors += batch.length;
      }
    }

    console.log(`📊 Storage complete: ${stored} stored, ${errors} errors`);
  }

  async getSamplePredictions() {
    console.log('\n🔍 Sample predictions:');
    
    try {
      const { data, error } = await supabase
        .from('rent_predictions')
        .select('*')
        .order('prediction_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching predictions:', error.message);
        return;
      }

      if (data && data.length > 0) {
        console.table(data.map(p => ({
          location: p.location_name.length > 25 ? p.location_name.substring(0, 25) + '...' : p.location_name,
          horizon: `${p.prediction_horizon}mo`,
          current: `$${Math.round(p.current_rent)}`,
          predicted: `$${Math.round(p.predicted_rent)}`,
          change: `${p.predicted_change_percent >= 0 ? '+' : ''}${p.predicted_change_percent.toFixed(1)}%`,
          confidence: `${Math.round(p.confidence_score * 100)}%`,
          cycle: p.market_cycle_stage
        })));
      } else {
        console.log('📭 No predictions found');
      }
    } catch (error) {
      console.error('❌ Error fetching predictions:', error.message);
    }
  }
}

// Main execution
async function main() {
  const engine = new RentPredictionEngine();
  
  try {
    await engine.generateAllPredictions();
    await engine.getSamplePredictions();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default RentPredictionEngine;