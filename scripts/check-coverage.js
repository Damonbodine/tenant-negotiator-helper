#!/usr/bin/env node

/**
 * Check current geographic coverage of the prediction system
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://izzdyfrcxunfzlfgdjuv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCoverage() {
  console.log('🗺️ Checking geographic coverage of rent prediction system...\n');

  // Check HUD county coverage
  console.log('📊 HUD Fair Market Rent Data Coverage:');
  const { data: hudCounties } = await supabase
    .from('hud_fair_market_rents')
    .select('county_name, state_code, state_name')
    .order('state_code, county_name');

  if (hudCounties) {
    const countiesByState = {};
    hudCounties.forEach(county => {
      if (!countiesByState[county.state_code]) {
        countiesByState[county.state_code] = new Set();
      }
      countiesByState[county.state_code].add(county.county_name);
    });

    Object.keys(countiesByState).forEach(state => {
      console.log(`  ${state}: ${countiesByState[state].size} counties`);
    });
    
    const totalCounties = Object.values(countiesByState).reduce((sum, counties) => sum + counties.size, 0);
    console.log(`\n  📍 Total HUD Counties: ${totalCounties}`);
  }

  // Check Zillow metro coverage
  console.log('\n📊 Zillow Metro Area Data Coverage:');
  const { data: zillowMetros } = await supabase
    .from('zillow_rent_data')
    .select('metro_area, state_code')
    .order('state_code, metro_area');

  if (zillowMetros) {
    const metrosByState = {};
    const uniqueMetros = new Set();
    
    zillowMetros.forEach(metro => {
      if (!metrosByState[metro.state_code]) {
        metrosByState[metro.state_code] = new Set();
      }
      metrosByState[metro.state_code].add(metro.metro_area);
      uniqueMetros.add(metro.metro_area);
    });

    Object.keys(metrosByState).forEach(state => {
      console.log(`  ${state}: ${metrosByState[state].size} metro areas`);
    });
    
    console.log(`\n  📍 Total Metro Areas: ${uniqueMetros.size}`);
  }

  // Check prediction coverage
  console.log('\n📊 Rent Predictions Coverage:');
  const { data: predictions } = await supabase
    .from('rent_predictions')
    .select('location_name, location_type, prediction_horizon')
    .order('location_name, prediction_horizon');

  if (predictions) {
    const locationsByType = {};
    predictions.forEach(pred => {
      if (!locationsByType[pred.location_type]) {
        locationsByType[pred.location_type] = new Set();
      }
      locationsByType[pred.location_type].add(pred.location_name);
    });

    Object.keys(locationsByType).forEach(type => {
      console.log(`  ${type}: ${locationsByType[type].size} locations`);
      Array.from(locationsByType[type]).forEach(location => {
        console.log(`    - ${location}`);
      });
    });
    
    console.log(`\n  📍 Total Predictions: ${predictions.length}`);
  }

  // Show sample predictions
  console.log('\n📋 Sample Current Predictions:');
  const { data: samplePreds } = await supabase
    .from('rent_predictions')
    .select('location_name, prediction_horizon, current_rent, predicted_rent, predicted_change_percent, confidence_score')
    .order('location_name, prediction_horizon')
    .limit(10);

  if (samplePreds) {
    console.table(samplePreds.map(p => ({
      location: p.location_name.length > 20 ? p.location_name.substring(0, 20) + '...' : p.location_name,
      horizon: `${p.prediction_horizon}mo`,
      current: `$${Math.round(p.current_rent)}`,
      predicted: `$${Math.round(p.predicted_rent)}`,
      change: `${p.predicted_change_percent >= 0 ? '+' : ''}${p.predicted_change_percent.toFixed(1)}%`,
      confidence: `${Math.round(p.confidence_score * 100)}%`
    })));
  }
}

checkCoverage().catch(console.error);