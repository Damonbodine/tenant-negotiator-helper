#!/usr/bin/env node

/**
 * Data Population Script for Rent Prediction System
 * Processes HUD and Zillow CSV files and populates database tables
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = 'https://izzdyfrcxunfzlfgdjuv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class DataPopulator {
  constructor() {
    this.dataPath = './Predictiondata/Rental Data/';
    this.hudRecordsProcessed = 0;
    this.zillowRecordsProcessed = 0;
    this.errors = [];
  }

  async populateAllData() {
    console.log('🚀 Starting data population for rent prediction system...\n');

    try {
      // 1. Process HUD Fair Market Rent data
      console.log('📊 Processing HUD Fair Market Rent data...');
      await this.processHUDData();

      // 2. Process Zillow rent data
      console.log('\n📊 Processing Zillow rent data...');
      await this.processZillowData();

      // 3. Show summary
      this.showSummary();

    } catch (error) {
      console.error('❌ Fatal error in data population:', error.message);
      throw error;
    }
  }

  async processHUDData() {
    const hudFile = path.join(this.dataPath, 'FMR_All_1983_2025.csv');
    
    if (!fs.existsSync(hudFile)) {
      console.log(`⚠️ HUD file not found: ${hudFile}`);
      return;
    }

    console.log(`📂 Reading HUD data from: ${hudFile}`);
    
    return new Promise((resolve, reject) => {
      const hudRecords = [];
      let recordCount = 0;

      fs.createReadStream(hudFile)
        .pipe(csv())
        .on('data', (row) => {
          try {
            recordCount++;
            
            // Focus on key areas for initial implementation
            const areaName = row.areaname || row.name || '';
            const stateCode = this.extractStateCode(areaName, row);
            
            // Skip if not a key area we're focusing on
            if (!this.isKeyArea(areaName, stateCode)) {
              return;
            }

            // Transform wide format to long format (years 2021-2025)
            const years = [2025, 2024, 2023, 2022, 2021];
            
            for (const year of years) {
              const yearSuffix = year.toString().slice(-2);
              
              const studio_fmr = this.parseNumber(row[`fmr${yearSuffix}_0`]);
              const one_br_fmr = this.parseNumber(row[`fmr${yearSuffix}_1`]);
              const two_br_fmr = this.parseNumber(row[`fmr${yearSuffix}_2`]);
              const three_br_fmr = this.parseNumber(row[`fmr${yearSuffix}_3`]);
              const four_br_fmr = this.parseNumber(row[`fmr${yearSuffix}_4`]);

              // Only add if we have valid rent data
              if (one_br_fmr > 0 || two_br_fmr > 0) {
                hudRecords.push({
                  fips_code: row.fips || row.id || `HUD_${recordCount}`,
                  county_name: this.cleanAreaName(areaName),
                  state_code: stateCode,
                  state_name: this.getStateName(stateCode),
                  year,
                  studio_fmr,
                  one_br_fmr,
                  two_br_fmr,
                  three_br_fmr,
                  four_br_fmr
                });
              }
            }

            if (recordCount % 1000 === 0) {
              console.log(`   📈 Processed ${recordCount} HUD rows...`);
            }

          } catch (error) {
            this.errors.push(`HUD row ${recordCount}: ${error.message}`);
          }
        })
        .on('end', async () => {
          console.log(`📋 Parsed ${hudRecords.length} HUD records from ${recordCount} rows`);
          
          try {
            await this.insertHUDRecords(hudRecords);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  async processZillowData() {
    const zillowFiles = [
      'Metro_zori_uc_sfrcondomfr_sm_sa_month.csv',
      'County_zori_uc_sfrcondomfr_sm_sa_month.csv'
    ];

    for (const fileName of zillowFiles) {
      const filePath = path.join(this.dataPath, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Zillow file not found: ${filePath}`);
        continue;
      }

      console.log(`📂 Reading Zillow data from: ${fileName}`);
      await this.processZillowFile(filePath);
    }
  }

  async processZillowFile(filePath) {
    return new Promise((resolve, reject) => {
      const zillowRecords = [];
      let recordCount = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            recordCount++;
            
            const regionName = row.RegionName;
            const stateName = row.StateName;
            
            // Focus on key areas
            if (!this.isKeyZillowArea(regionName, stateName)) {
              return;
            }

            // Process monthly data from 2021 onwards
            const columns = Object.keys(row);
            const dateColumns = columns.filter(col => col.match(/^\d{4}-\d{2}-\d{2}$/));
            
            for (const dateCol of dateColumns) {
              const date = new Date(dateCol);
              
              // Only process recent data (2021 onwards)
              if (date.getFullYear() < 2021) continue;
              
              const rent = this.parseNumber(row[dateCol]);
              if (rent > 0) {
                // Calculate month-over-month change
                const prevMonth = this.getPreviousMonth(dateCol, dateColumns, row);
                const mom_change = prevMonth ? ((rent - prevMonth) / prevMonth) * 100 : null;
                
                // Calculate year-over-year change
                const prevYear = this.getPreviousYear(dateCol, dateColumns, row);
                const yoy_change = prevYear ? ((rent - prevYear) / prevYear) * 100 : null;

                zillowRecords.push({
                  metro_area: regionName,
                  state_code: this.getStateCodeFromName(stateName),
                  report_date: dateCol,
                  median_rent: rent,
                  month_over_month_change: mom_change,
                  year_over_year_change: yoy_change,
                  inventory_count: null,
                  days_on_market: null,
                  price_per_sqft: null
                });
              }
            }

            if (recordCount % 100 === 0) {
              console.log(`   📈 Processed ${recordCount} Zillow rows...`);
            }

          } catch (error) {
            this.errors.push(`Zillow row ${recordCount}: ${error.message}`);
          }
        })
        .on('end', async () => {
          console.log(`📋 Parsed ${zillowRecords.length} Zillow records from ${recordCount} rows`);
          
          try {
            await this.insertZillowRecords(zillowRecords);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  async insertHUDRecords(records) {
    if (records.length === 0) return;

    console.log(`💾 Inserting ${records.length} HUD records...`);
    
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('hud_fair_market_rents')
          .upsert(batch, {
            onConflict: 'fips_code,year',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ HUD batch error (${i}-${i + batch.length}):`, error.message);
          this.errors.push(`HUD batch ${i}: ${error.message}`);
        } else {
          inserted += batch.length;
          console.log(`   ✅ HUD batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} inserted`);
        }
      } catch (error) {
        console.error(`❌ HUD batch exception (${i}-${i + batch.length}):`, error.message);
        this.errors.push(`HUD batch ${i}: ${error.message}`);
      }
    }

    this.hudRecordsProcessed = inserted;
    console.log(`✅ Inserted ${inserted} HUD records`);
  }

  async insertZillowRecords(records) {
    if (records.length === 0) return;

    console.log(`💾 Inserting ${records.length} Zillow records...`);
    
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('zillow_rent_data')
          .upsert(batch, {
            onConflict: 'metro_area,report_date',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ Zillow batch error (${i}-${i + batch.length}):`, error.message);
          this.errors.push(`Zillow batch ${i}: ${error.message}`);
        } else {
          inserted += batch.length;
          console.log(`   ✅ Zillow batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} inserted`);
        }
      } catch (error) {
        console.error(`❌ Zillow batch exception (${i}-${i + batch.length}):`, error.message);
        this.errors.push(`Zillow batch ${i}: ${error.message}`);
      }
    }

    this.zillowRecordsProcessed = inserted;
    console.log(`✅ Inserted ${inserted} Zillow records`);
  }

  isKeyArea(areaName, stateCode) {
    // 🚀 EPIC MODE: Process ALL US areas for complete coverage!
    // No geographic filtering - every county and metro gets processed
    return true;
  }

  isKeyZillowArea(regionName, stateName) {
    // 🚀 EPIC MODE: Process ALL Zillow metros and counties!
    // Complete US coverage - every region gets processed
    return true;
  }

  extractStateCode(areaName, row) {
    // Try to extract state code from area name
    const match = areaName.match(/,\s*([A-Z]{2})\s*$/);
    if (match) return match[1];
    
    // Check other fields
    if (row.state) return row.state;
    if (row.state_code) return row.state_code;
    
    // Default mappings for known areas
    const stateMap = {
      'montgomery': 'AL',
      'birmingham': 'AL',
      'buffalo': 'NY',
      'new york': 'NY',
      'los angeles': 'CA',
      'chicago': 'IL',
      'dallas': 'TX',
      'houston': 'TX',
      'miami': 'FL',
      'washington': 'DC',
      'philadelphia': 'PA',
      'boston': 'MA',
      'seattle': 'WA'
    };
    
    const areaLower = areaName.toLowerCase();
    for (const [area, state] of Object.entries(stateMap)) {
      if (areaLower.includes(area)) return state;
    }
    
    return 'XX'; // Unknown
  }

  getStateCodeFromName(stateName) {
    const stateMap = {
      'New York': 'NY',
      'California': 'CA',
      'Illinois': 'IL',
      'Texas': 'TX',
      'Florida': 'FL',
      'District of Columbia': 'DC',
      'Virginia': 'VA',
      'Pennsylvania': 'PA',
      'Massachusetts': 'MA',
      'Washington': 'WA',
      'Alabama': 'AL'
    };
    
    return stateMap[stateName] || 'XX';
  }

  getStateName(stateCode) {
    const stateNames = {
      'NY': 'New York',
      'CA': 'California',
      'IL': 'Illinois',
      'TX': 'Texas',
      'FL': 'Florida',
      'DC': 'District of Columbia',
      'VA': 'Virginia',
      'PA': 'Pennsylvania',
      'MA': 'Massachusetts',
      'WA': 'Washington',
      'AL': 'Alabama'
    };
    
    return stateNames[stateCode] || stateCode;
  }

  cleanAreaName(areaName) {
    // Remove MSA, HUD, Metro suffixes and clean up
    return areaName
      .replace(/\s+(MSA|HUD Metro FMR Area|Metro)$/i, '')
      .replace(/,\s*[A-Z]{2}\s*$/, '')
      .trim();
  }

  parseNumber(value) {
    if (!value || value === '' || value === null || value === undefined) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  getPreviousMonth(currentDate, dateColumns, row) {
    const current = new Date(currentDate);
    const prevMonth = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    const prevDateStr = prevMonth.toISOString().slice(0, 10);
    
    if (dateColumns.includes(prevDateStr)) {
      return this.parseNumber(row[prevDateStr]);
    }
    return null;
  }

  getPreviousYear(currentDate, dateColumns, row) {
    const current = new Date(currentDate);
    const prevYear = new Date(current.getFullYear() - 1, current.getMonth(), 1);
    const prevDateStr = prevYear.toISOString().slice(0, 10);
    
    if (dateColumns.includes(prevDateStr)) {
      return this.parseNumber(row[prevDateStr]);
    }
    return null;
  }

  showSummary() {
    console.log('\n📊 DATA POPULATION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ HUD Records Processed: ${this.hudRecordsProcessed}`);
    console.log(`✅ Zillow Records Processed: ${this.zillowRecordsProcessed}`);
    console.log(`❌ Errors Encountered: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n⚠️ First 5 errors:');
      this.errors.slice(0, 5).forEach(error => console.log(`   ${error}`));
      if (this.errors.length > 5) {
        console.log(`   ... and ${this.errors.length - 5} more errors`);
      }
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Run prediction algorithm: node scripts/generate-predictions.js');
    console.log('2. Test chat integration with real data');
  }

  async verifyDataInsertion() {
    console.log('\n🔍 Verifying data insertion...');
    
    try {
      // Check HUD data
      const { data: hudData, error: hudError } = await supabase
        .from('hud_fair_market_rents')
        .select('count')
        .limit(1);
        
      if (!hudError) {
        const { count: hudCount } = await supabase
          .from('hud_fair_market_rents')
          .select('*', { count: 'exact', head: true });
        console.log(`📊 HUD records in database: ${hudCount}`);
      }

      // Check Zillow data
      const { data: zillowData, error: zillowError } = await supabase
        .from('zillow_rent_data')
        .select('count')
        .limit(1);
        
      if (!zillowError) {
        const { count: zillowCount } = await supabase
          .from('zillow_rent_data')
          .select('*', { count: 'exact', head: true });
        console.log(`📊 Zillow records in database: ${zillowCount}`);
      }

      // Show sample data
      const { data: sampleHUD } = await supabase
        .from('hud_fair_market_rents')
        .select('county_name, state_code, year, two_br_fmr')
        .order('year', { ascending: false })
        .limit(3);

      const { data: sampleZillow } = await supabase
        .from('zillow_rent_data')
        .select('metro_area, state_code, report_date, median_rent')
        .order('report_date', { ascending: false })
        .limit(3);

      if (sampleHUD && sampleHUD.length > 0) {
        console.log('\n📋 Sample HUD data:');
        console.table(sampleHUD);
      }

      if (sampleZillow && sampleZillow.length > 0) {
        console.log('\n📋 Sample Zillow data:');
        console.table(sampleZillow);
      }

    } catch (error) {
      console.error('❌ Verification error:', error.message);
    }
  }
}

// Main execution
async function main() {
  const populator = new DataPopulator();
  
  try {
    await populator.populateAllData();
    await populator.verifyDataInsertion();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DataPopulator;