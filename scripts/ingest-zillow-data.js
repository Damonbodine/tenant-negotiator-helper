#!/usr/bin/env node

/**
 * Zillow Rent Data Ingestion Script
 * Processes manually downloaded Zillow CSV files
 * Populates the zillow_rent_data table
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// Supabase configuration
const SUPABASE_CONFIG = {
  url: 'https://izzdyfrcxunfzlfgdjuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6emR5ZnJjeHVuZnpsZmdkanV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzMDgsImV4cCI6MjA1ODc3ODMwOH0.rLBqA9Ok3tKPx90Hgvf9bTx0rUjJWcMj2a-SRy_sA8M'
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Metro area mapping for consistent naming
const METRO_MAPPINGS = {
  'Buffalo-Cheektowaga-Niagara Falls, NY': { state: 'NY', region: 'Buffalo' },
  'Rochester, NY': { state: 'NY', region: 'Rochester' },
  'Syracuse, NY': { state: 'NY', region: 'Syracuse' },
  'Albany-Schenectady-Troy, NY': { state: 'NY', region: 'Albany' },
  'New York-Newark-Jersey City, NY-NJ-PA': { state: 'NY', region: 'New York' },
  'Los Angeles-Long Beach-Anaheim, CA': { state: 'CA', region: 'Los Angeles' },
  'Chicago-Naperville-Elgin, IL-IN-WI': { state: 'IL', region: 'Chicago' },
  'Austin-Round Rock, TX': { state: 'TX', region: 'Austin' },
  'Dallas-Fort Worth-Arlington, TX': { state: 'TX', region: 'Dallas' },
  'Houston-The Woodlands-Sugar Land, TX': { state: 'TX', region: 'Houston' },
  'Miami-Fort Lauderdale-West Palm Beach, FL': { state: 'FL', region: 'Miami' },
  'Seattle-Tacoma-Bellevue, WA': { state: 'WA', region: 'Seattle' },
  'Denver-Aurora-Lakewood, CO': { state: 'CO', region: 'Denver' },
  'Atlanta-Sandy Springs-Roswell, GA': { state: 'GA', region: 'Atlanta' },
  'Boston-Cambridge-Newton, MA-NH': { state: 'MA', region: 'Boston' }
};

class ZillowDataIngester {
  constructor() {
    this.dataDir = './zillow_data';
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log(`📁 Created data directory: ${this.dataDir}`);
      console.log(`📥 Please add your downloaded Zillow CSV files to: ${path.resolve(this.dataDir)}`);
    }
  }

  async parseZillowCSV(filepath) {
    console.log(`📊 Parsing: ${path.basename(filepath)}`);
    
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];

      fs.createReadStream(filepath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const processed = this.processZillowRow(row);
            if (processed && processed.length > 0) {
              results.push(...processed);
            }
          } catch (error) {
            errors.push({ row: Object.keys(row)[0], error: error.message });
          }
        })
        .on('end', () => {
          console.log(`✅ Parsed ${results.length} records (${errors.length} errors)`);
          if (errors.length > 0 && errors.length < 5) {
            console.log('Sample errors:', errors.slice(0, 3));
          }
          resolve(results);
        })
        .on('error', reject);
    });
  }

  processZillowRow(row) {
    // Handle different Zillow CSV formats
    const regionName = row.RegionName || row['Region Name'] || row.Metro || row.metro_area;
    if (!regionName) {
      return [];
    }

    // Try exact match first, then partial match
    let mapping = METRO_MAPPINGS[regionName];
    if (!mapping) {
      // Try partial matching for Buffalo, Rochester, etc.
      const matchedKey = Object.keys(METRO_MAPPINGS).find(key => 
        key.toLowerCase().includes(regionName.toLowerCase()) ||
        regionName.toLowerCase().includes(METRO_MAPPINGS[key].region.toLowerCase())
      );
      if (matchedKey) {
        mapping = METRO_MAPPINGS[matchedKey];
        // Update mapping for future use
        METRO_MAPPINGS[regionName] = mapping;
      }
    }

    if (!mapping) {
      // Skip unmapped regions for now
      return [];
    }

    const records = [];

    // Process monthly columns (formats: YYYY-MM-DD, YYYY-MM, or MM/YYYY)
    Object.keys(row).forEach(key => {
      let date = null;
      
      // Try different date formats
      if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(key);
      } else if (key.match(/^\d{4}-\d{2}$/)) {
        date = new Date(key + '-01');
      } else if (key.match(/^\d{2}\/\d{4}$/)) {
        const [month, year] = key.split('/');
        date = new Date(year, month - 1, 1);
      }

      if (date && !isNaN(date.getTime())) {
        const value = parseFloat(row[key]);
        if (!isNaN(value) && value > 0) {
          // Calculate month-over-month change if possible
          const prevMonthKey = this.findPreviousMonthKey(key, row);
          let momChange = null;
          if (prevMonthKey && row[prevMonthKey]) {
            const prevValue = parseFloat(row[prevMonthKey]);
            if (!isNaN(prevValue) && prevValue > 0) {
              momChange = ((value - prevValue) / prevValue) * 100;
            }
          }

          // Calculate year-over-year change
          const prevYearKey = this.findPreviousYearKey(key, row);
          let yoyChange = null;
          if (prevYearKey && row[prevYearKey]) {
            const prevYearValue = parseFloat(row[prevYearKey]);
            if (!isNaN(prevYearValue) && prevYearValue > 0) {
              yoyChange = ((value - prevYearValue) / prevYearValue) * 100;
            }
          }

          records.push({
            metro_area: regionName,
            state_code: mapping.state,
            report_date: date.toISOString().split('T')[0],
            median_rent: value,
            month_over_month_change: momChange ? parseFloat(momChange.toFixed(2)) : null,
            year_over_year_change: yoyChange ? parseFloat(yoyChange.toFixed(2)) : null,
            inventory_count: this.extractInventoryData(row, key),
            days_on_market: this.extractDOMData(row, key),
            price_per_sqft: this.extractPricePerSqFt(row, key)
          });
        }
      }
    });

    return records;
  }

  findPreviousMonthKey(currentKey, row) {
    // Try to find the previous month's data
    const keys = Object.keys(row);
    const dateKeys = keys.filter(k => k.match(/^\d{4}-\d{2}/) || k.match(/^\d{2}\/\d{4}/));
    
    const currentDate = this.parseKeyToDate(currentKey);
    if (!currentDate) return null;

    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);

    return dateKeys.find(k => {
      const keyDate = this.parseKeyToDate(k);
      return keyDate && 
             keyDate.getFullYear() === prevMonth.getFullYear() && 
             keyDate.getMonth() === prevMonth.getMonth();
    });
  }

  findPreviousYearKey(currentKey, row) {
    const keys = Object.keys(row);
    const dateKeys = keys.filter(k => k.match(/^\d{4}-\d{2}/) || k.match(/^\d{2}\/\d{4}/));
    
    const currentDate = this.parseKeyToDate(currentKey);
    if (!currentDate) return null;

    const prevYear = new Date(currentDate);
    prevYear.setFullYear(prevYear.getFullYear() - 1);

    return dateKeys.find(k => {
      const keyDate = this.parseKeyToDate(k);
      return keyDate && 
             keyDate.getFullYear() === prevYear.getFullYear() && 
             keyDate.getMonth() === prevYear.getMonth();
    });
  }

  parseKeyToDate(key) {
    if (key.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(key);
    } else if (key.match(/^\d{4}-\d{2}$/)) {
      return new Date(key + '-01');
    } else if (key.match(/^\d{2}\/\d{4}$/)) {
      const [month, year] = key.split('/');
      return new Date(year, month - 1, 1);
    }
    return null;
  }

  extractInventoryData(row, dateKey) {
    // Look for inventory-related columns
    const inventoryKeys = [`inventory_${dateKey}`, `count_${dateKey}`, `listings_${dateKey}`];
    for (const key of inventoryKeys) {
      if (row[key]) {
        const value = parseInt(row[key]);
        if (!isNaN(value)) return value;
      }
    }
    return null;
  }

  extractDOMData(row, dateKey) {
    // Look for days on market data
    const domKeys = [`dom_${dateKey}`, `days_on_market_${dateKey}`, `DOM_${dateKey}`];
    for (const key of domKeys) {
      if (row[key]) {
        const value = parseFloat(row[key]);
        if (!isNaN(value)) return value;
      }
    }
    return null;
  }

  extractPricePerSqFt(row, dateKey) {
    // Look for price per square foot data
    const psfKeys = [`psf_${dateKey}`, `price_per_sqft_${dateKey}`, `$/sqft_${dateKey}`];
    for (const key of psfKeys) {
      if (row[key]) {
        const value = parseFloat(row[key]);
        if (!isNaN(value)) return value;
      }
    }
    return null;
  }

  async processAllCSVFiles() {
    console.log('📁 Processing local Zillow CSV files...');
    
    const csvFiles = fs.readdirSync(this.dataDir)
      .filter(f => f.endsWith('.csv'))
      .map(f => path.join(this.dataDir, f));

    if (csvFiles.length === 0) {
      console.log('📭 No CSV files found in', path.resolve(this.dataDir));
      console.log('📥 Please add your downloaded Zillow CSV files to this directory');
      return [];
    }

    console.log(`📊 Found ${csvFiles.length} CSV files to process`);

    const allRecords = [];
    for (const filepath of csvFiles) {
      try {
        const records = await this.parseZillowCSV(filepath);
        allRecords.push(...records);
      } catch (error) {
        console.error(`❌ Error processing ${path.basename(filepath)}:`, error.message);
      }
    }

    return allRecords;
  }

  async insertZillowData(records, batchSize = 100) {
    if (records.length === 0) {
      console.log('📭 No records to insert');
      return { inserted: 0, errors: 0 };
    }

    console.log(`💾 Inserting ${records.length} Zillow records...`);
    
    let inserted = 0;
    let errors = 0;

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

    console.log(`📊 Zillow insertion complete: ${inserted} inserted, ${errors} errors`);
    return { inserted, errors };
  }

  deduplicateRecords(records) {
    const seen = new Set();
    return records.filter(record => {
      const key = `${record.metro_area}_${record.report_date}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async run() {
    console.log('🏢 Starting Zillow rent data ingestion...\n');
    
    try {
      // Process all CSV files
      const allRecords = await this.processAllCSVFiles();
      
      if (allRecords.length === 0) {
        return;
      }

      // Remove duplicates
      const uniqueRecords = this.deduplicateRecords(allRecords);
      console.log(`🔄 Deduplicated: ${allRecords.length} → ${uniqueRecords.length} records`);

      // Insert into database
      await this.insertZillowData(uniqueRecords);
      
      // Show sample data
      await this.getSampleData();

    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      throw error;
    }
  }

  async getSampleData() {
    console.log('\n🔍 Sample of ingested Zillow data:');
    
    try {
      const { data, error } = await supabase
        .from('zillow_rent_data')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Error fetching sample data:', error.message);
        return;
      }

      if (data && data.length > 0) {
        console.table(data.map(d => ({
          metro: d.metro_area.length > 30 ? d.metro_area.substring(0, 30) + '...' : d.metro_area,
          date: d.report_date,
          rent: `$${d.median_rent}`,
          mom: d.month_over_month_change ? `${d.month_over_month_change}%` : 'N/A',
          yoy: d.year_over_year_change ? `${d.year_over_year_change}%` : 'N/A'
        })));
      } else {
        console.log('📭 No data found in database');
      }
    } catch (error) {
      console.error('❌ Error fetching sample data:', error.message);
    }
  }
}

// Main execution
async function main() {
  const ingester = new ZillowDataIngester();
  await ingester.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ZillowDataIngester;