#!/usr/bin/env node

/**
 * HUD Fair Market Rent Data Ingestion Script
 * Downloads and processes HUD FMR data for all counties
 * Populates the hud_fair_market_rents table
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_CONFIG = {
  url: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M'
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// HUD FMR data URLs (recent years)
const HUD_DATA_URLS = {
  2024: 'https://www.huduser.gov/portal/datasets/fmr/fmr2024f/FMR2024F.xlsx',
  2023: 'https://www.huduser.gov/portal/datasets/fmr/fmr2023f/FMR2023F.xlsx',
  2022: 'https://www.huduser.gov/portal/datasets/fmr/fmr2022f/FMR2022F.xlsx',
  2021: 'https://www.huduser.gov/portal/datasets/fmr/fmr2021f/FMR2021F.xlsx',
  2020: 'https://www.huduser.gov/portal/datasets/fmr/fmr2020f/FMR2020F.xlsx'
};

// State code mapping
const STATE_CODES = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE',
  '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
  '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM',
  '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY', '72': 'PR', '78': 'VI'
};

const STATE_NAMES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado',
  'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts',
  'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana',
  'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
  'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming', 'PR': 'Puerto Rico', 'VI': 'Virgin Islands'
};

class HUDDataIngester {
  constructor() {
    this.dataDir = './hud_data';
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async downloadHUDFile(year) {
    const url = HUD_DATA_URLS[year];
    if (!url) {
      throw new Error(`No URL found for year ${year}`);
    }

    const filename = `FMR${year}.xlsx`;
    const filepath = path.join(this.dataDir, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`📄 File already exists: ${filename}`);
      return filepath;
    }

    console.log(`📥 Downloading HUD FMR data for ${year}...`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      fs.writeFileSync(filepath, buffer);
      console.log(`✅ Downloaded: ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
      return filepath;
    } catch (error) {
      console.error(`❌ Error downloading ${year} data:`, error.message);
      throw error;
    }
  }

  parseHUDFile(filepath, year) {
    console.log(`📊 Parsing HUD file: ${path.basename(filepath)}`);
    
    try {
      const workbook = XLSX.readFile(filepath);
      const sheetName = workbook.SheetNames[0]; // Usually first sheet contains the data
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log(`📋 Found ${data.length} rows in ${year} data`);

      const processedData = [];
      for (const row of data) {
        // HUD files have different column naming conventions by year
        // We need to identify the correct columns
        const fipsCode = this.extractFIPSCode(row);
        const countyName = this.extractCountyName(row);
        
        if (!fipsCode || !countyName) continue;

        const stateCode = STATE_CODES[fipsCode.substring(0, 2)];
        if (!stateCode) continue;

        const record = {
          fips_code: fipsCode,
          county_name: countyName,
          state_code: stateCode,
          state_name: STATE_NAMES[stateCode],
          year: year,
          studio_fmr: this.extractRent(row, 'studio'),
          one_br_fmr: this.extractRent(row, '1br'),
          two_br_fmr: this.extractRent(row, '2br'),
          three_br_fmr: this.extractRent(row, '3br'),
          four_br_fmr: this.extractRent(row, '4br')
        };

        processedData.push(record);
      }

      console.log(`✅ Processed ${processedData.length} valid records for ${year}`);
      return processedData;
    } catch (error) {
      console.error(`❌ Error parsing ${year} file:`, error.message);
      throw error;
    }
  }

  extractFIPSCode(row) {
    // Common column names for FIPS code
    const possibleKeys = ['fips2010', 'fips_code', 'FIPS', 'fips', 'countycode', 'County Code'];
    for (const key of possibleKeys) {
      if (row[key]) {
        return String(row[key]).padStart(5, '0');
      }
    }
    return null;
  }

  extractCountyName(row) {
    // Common column names for county name
    const possibleKeys = ['countyname', 'County Name', 'County', 'areaname', 'Area Name'];
    for (const key of possibleKeys) {
      if (row[key]) {
        return String(row[key]).trim();
      }
    }
    return null;
  }

  extractRent(row, bedrooms) {
    // Common column naming patterns for rent values
    const patterns = {
      'studio': ['fmr_0', 'fmr0', 'Efficiency', 'Studio', 'eff_fmr'],
      '1br': ['fmr_1', 'fmr1', 'One-Bedroom', '1 Bedroom', 'br1_fmr'],
      '2br': ['fmr_2', 'fmr2', 'Two-Bedroom', '2 Bedroom', 'br2_fmr'],
      '3br': ['fmr_3', 'fmr3', 'Three-Bedroom', '3 Bedroom', 'br3_fmr'],
      '4br': ['fmr_4', 'fmr4', 'Four-Bedroom', '4 Bedroom', 'br4_fmr']
    };

    const possibleKeys = patterns[bedrooms] || [];
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        const value = parseFloat(String(row[key]).replace(/[,$]/g, ''));
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    }
    return null;
  }

  async insertDataBatch(records, batchSize = 100) {
    console.log(`💾 Inserting ${records.length} records in batches of ${batchSize}...`);
    
    let inserted = 0;
    let errors = 0;

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
          console.error(`❌ Batch error (${i}-${i + batch.length}):`, error.message);
          errors += batch.length;
        } else {
          inserted += batch.length;
          console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)}`);
        }
      } catch (error) {
        console.error(`❌ Batch error (${i}-${i + batch.length}):`, error.message);
        errors += batch.length;
      }
    }

    console.log(`📊 Insertion complete: ${inserted} inserted, ${errors} errors`);
    return { inserted, errors };
  }

  async processYear(year) {
    console.log(`\n🚀 Processing HUD FMR data for ${year}...`);
    
    try {
      // Download the file
      const filepath = await this.downloadHUDFile(year);
      
      // Parse the file
      const records = this.parseHUDFile(filepath, year);
      
      if (records.length === 0) {
        console.log(`⚠️ No valid records found for ${year}`);
        return { year, success: false, count: 0 };
      }

      // Insert into database
      const result = await this.insertDataBatch(records);
      
      return { 
        year, 
        success: result.errors === 0, 
        count: result.inserted,
        errors: result.errors 
      };
    } catch (error) {
      console.error(`❌ Failed to process ${year}:`, error.message);
      return { year, success: false, error: error.message };
    }
  }

  async processAllYears() {
    console.log('🏠 Starting HUD Fair Market Rent data ingestion...\n');
    
    const results = [];
    const years = Object.keys(HUD_DATA_URLS).map(Number).sort((a, b) => b - a);
    
    for (const year of years) {
      const result = await this.processYear(year);
      results.push(result);
    }

    // Summary
    console.log('\n📊 INGESTION SUMMARY');
    console.log('='.repeat(50));
    
    let totalRecords = 0;
    let totalErrors = 0;
    let successfulYears = 0;

    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.year}: ${result.count || 0} records${result.errors ? ` (${result.errors} errors)` : ''}`);
      
      if (result.success) {
        successfulYears++;
        totalRecords += result.count || 0;
        totalErrors += result.errors || 0;
      }
    }

    console.log('='.repeat(50));
    console.log(`📈 Successfully processed: ${successfulYears}/${years.length} years`);
    console.log(`📊 Total records inserted: ${totalRecords.toLocaleString()}`);
    if (totalErrors > 0) {
      console.log(`⚠️ Total errors: ${totalErrors.toLocaleString()}`);
    }

    return results;
  }

  async getExampleData() {
    console.log('\n🔍 Sample of ingested data:');
    
    try {
      const { data, error } = await supabase
        .from('hud_fair_market_rents')
        .select('*')
        .eq('state_code', 'NY')
        .eq('county_name', 'Erie County')
        .order('year', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Error fetching sample data:', error.message);
        return;
      }

      if (data && data.length > 0) {
        console.table(data);
      } else {
        console.log('📭 No sample data found for Erie County, NY');
      }
    } catch (error) {
      console.error('❌ Error fetching sample data:', error.message);
    }
  }
}

// Main execution
async function main() {
  const ingester = new HUDDataIngester();
  
  try {
    await ingester.processAllYears();
    await ingester.getExampleData();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default HUDDataIngester;