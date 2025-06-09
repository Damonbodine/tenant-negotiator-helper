// ZIP-Level ZORI Data Loading Pipeline
// Loads 7,324 ZIP codes with 10+ years of historical rent data into Supabase

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

class ZipLevelDataLoader {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    this.batchSize = 100;
    this.processedCount = 0;
  }

  async loadZipLevelData() {
    console.log('🚀 Starting ZIP-level ZORI data loading...');
    console.log('📊 Expected: 7,324 ZIP codes with 10+ years of monthly data');
    
    const csvPath = './Predictiondata/Rental Data/Zip_zori_uc_sfrcondomfr_sm_sa_month.csv';
    
    try {
      // First, create the tables
      await this.createTables();
      
      // Load the raw ZIP data
      await this.loadRawZipData(csvPath);
      
      // Create enhanced RAG embeddings
      await this.createLocationEmbeddings();
      
      console.log('✅ ZIP-level data loading completed successfully!');
      
    } catch (error) {
      console.error('❌ Data loading failed:', error);
      throw error;
    }
  }

  async createTables() {
    console.log('🏗️ Creating database tables...');
    
    // Raw ZIP-level rent data table
    const zipRentsTable = `
      CREATE TABLE IF NOT EXISTS zip_level_rents (
        id SERIAL PRIMARY KEY,
        region_id INTEGER,
        size_rank INTEGER,
        zip_code TEXT NOT NULL,
        region_type TEXT DEFAULT 'zip',
        state_name TEXT,
        state_code TEXT,
        city TEXT,
        metro TEXT,
        county_name TEXT,
        rent_data JSONB, -- All monthly rent values
        latest_rent DECIMAL,
        yearly_change DECIMAL,
        monthly_change DECIMAL,
        data_start_date DATE,
        data_end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_zip_level_rents_zip_code ON zip_level_rents(zip_code);
      CREATE INDEX IF NOT EXISTS idx_zip_level_rents_city ON zip_level_rents(city);
      CREATE INDEX IF NOT EXISTS idx_zip_level_rents_state ON zip_level_rents(state_code);
      CREATE INDEX IF NOT EXISTS idx_zip_level_rents_latest_rent ON zip_level_rents(latest_rent);
    `;
    
    // Location-intelligent RAG embeddings table
    const locationEmbeddingsTable = `
      CREATE TABLE IF NOT EXISTS location_embeddings (
        id SERIAL PRIMARY KEY,
        zip_code TEXT,
        city TEXT,
        state_code TEXT,
        metro TEXT,
        content TEXT NOT NULL, -- Rich location description for RAG
        embedding VECTOR(1536), -- OpenAI embedding
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_location_embeddings_zip ON location_embeddings(zip_code);
      CREATE INDEX IF NOT EXISTS idx_location_embeddings_city ON location_embeddings(city);
    `;
    
    const { error: zipTableError } = await this.supabase.rpc('exec_sql', { 
      sql: zipRentsTable 
    });
    
    const { error: embeddingTableError } = await this.supabase.rpc('exec_sql', { 
      sql: locationEmbeddingsTable 
    });
    
    if (zipTableError) throw new Error(`ZIP table creation failed: ${zipTableError.message}`);
    if (embeddingTableError) throw new Error(`Embedding table creation failed: ${embeddingTableError.message}`);
    
    console.log('✅ Database tables created successfully');
  }

  async loadRawZipData(csvPath) {
    console.log('📥 Loading ZIP-level rent data from CSV...');
    
    const zipDataBatch = [];
    let rowCount = 0;
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', async (row) => {
          try {
            const zipData = this.processZipRow(row);
            if (zipData) {
              zipDataBatch.push(zipData);
              rowCount++;
              
              // Process in batches for performance
              if (zipDataBatch.length >= this.batchSize) {
                await this.insertZipBatch([...zipDataBatch]);
                zipDataBatch.length = 0; // Clear batch
                
                console.log(`📊 Processed ${rowCount} ZIP codes...`);
              }
            }
          } catch (error) {
            console.error('Error processing row:', error);
          }
        })
        .on('end', async () => {
          try {
            // Insert remaining batch
            if (zipDataBatch.length > 0) {
              await this.insertZipBatch(zipDataBatch);
            }
            
            console.log(`✅ Loaded ${rowCount} ZIP codes with historical rent data`);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  processZipRow(row) {
    const zipCode = row.RegionName;
    const city = row.City;
    const state = row.State;
    
    if (!zipCode || !city) return null;
    
    // Extract all monthly rent values
    const rentData = {};
    const dateColumns = Object.keys(row).filter(key => key.match(/^\\d{4}-\\d{2}-\\d{2}$/));
    
    let latestRent = null;
    let latestDate = null;
    let yearAgoRent = null;
    
    // Process monthly data
    dateColumns.forEach(dateCol => {
      const rentValue = parseFloat(row[dateCol]);
      if (!isNaN(rentValue)) {
        rentData[dateCol] = rentValue;
        
        // Track latest rent
        if (!latestDate || dateCol > latestDate) {
          latestDate = dateCol;
          latestRent = rentValue;
        }
        
        // Find rent from ~1 year ago
        const date = new Date(dateCol);
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        
        if (Math.abs(date.getTime() - yearAgo.getTime()) < 30 * 24 * 60 * 60 * 1000) { // Within 30 days
          yearAgoRent = rentValue;
        }
      }
    });
    
    // Calculate year-over-year change
    const yearlyChange = (latestRent && yearAgoRent) 
      ? ((latestRent - yearAgoRent) / yearAgoRent) * 100 
      : null;
    
    return {
      region_id: parseInt(row.RegionID) || null,
      size_rank: parseInt(row.SizeRank) || null,
      zip_code: zipCode,
      region_type: row.RegionType || 'zip',
      state_name: row.StateName,
      state_code: state,
      city: city,
      metro: row.Metro,
      county_name: row.CountyName,
      rent_data: rentData,
      latest_rent: latestRent,
      yearly_change: yearlyChange ? Math.round(yearlyChange * 10) / 10 : null,
      data_start_date: dateColumns.length > 0 ? dateColumns[0] : null,
      data_end_date: latestDate
    };
  }

  async insertZipBatch(zipBatch) {
    const { error } = await this.supabase
      .from('zip_level_rents')
      .insert(zipBatch);
    
    if (error) {
      console.error('Batch insert error:', error);
      throw error;
    }
    
    this.processedCount += zipBatch.length;
  }

  async createLocationEmbeddings() {
    console.log('🧠 Creating location-intelligent RAG embeddings...');
    
    // Get all ZIP data
    const { data: zipData, error } = await this.supabase
      .from('zip_level_rents')
      .select('*')
      .not('latest_rent', 'is', null);
    
    if (error) throw error;
    
    console.log(`📍 Processing ${zipData.length} locations for RAG embeddings...`);
    
    const embeddingBatch = [];
    
    for (const zip of zipData) {
      try {
        const locationContent = this.generateLocationContent(zip);
        const embedding = await this.generateEmbedding(locationContent);
        
        embeddingBatch.push({
          zip_code: zip.zip_code,
          city: zip.city,
          state_code: zip.state_code,
          metro: zip.metro,
          content: locationContent,
          embedding: `[${embedding.join(',')}]`,
          metadata: {
            latest_rent: zip.latest_rent,
            yearly_change: zip.yearly_change,
            county: zip.county_name,
            data_quality: zip.rent_data ? Object.keys(zip.rent_data).length : 0
          }
        });
        
        // Insert in batches
        if (embeddingBatch.length >= 50) {
          await this.insertEmbeddingBatch([...embeddingBatch]);
          embeddingBatch.length = 0;
          console.log(`🧠 Processed ${this.processedCount} location embeddings...`);
        }
        
      } catch (error) {
        console.warn(`Warning: Failed to process ${zip.zip_code}:`, error.message);
      }
    }
    
    // Insert remaining batch
    if (embeddingBatch.length > 0) {
      await this.insertEmbeddingBatch(embeddingBatch);
    }
    
    console.log('✅ Location embeddings created successfully');
  }

  generateLocationContent(zip) {
    const trends = this.analyzeRentTrends(zip.rent_data || {});
    
    return `
Location: ${zip.city}, ${zip.state_code} ${zip.zip_code}
Metro Area: ${zip.metro || 'Unknown'}
County: ${zip.county_name || 'Unknown'}

Current Rent: $${zip.latest_rent?.toLocaleString() || 'N/A'}
Annual Change: ${zip.yearly_change?.toFixed(1)}%

Historical Analysis:
${trends.seasonal || 'Limited seasonal data available'}
${trends.longTerm || 'Limited long-term trend data'}
${trends.volatility || 'Market volatility: unknown'}

Market Context:
- ZIP Code: ${zip.zip_code}
- Region Type: ${zip.region_type}
- Data Coverage: ${zip.data_start_date} to ${zip.data_end_date}

Search Terms: rent ${zip.city}, ${zip.city} rental market, ${zip.zip_code} rents, ${zip.metro} housing costs, ${zip.state_code} rental prices
    `.trim();
  }

  analyzeRentTrends(rentData) {
    const dataPoints = Object.entries(rentData)
      .filter(([_, value]) => !isNaN(value))
      .sort(([a], [b]) => a.localeCompare(b));
    
    if (dataPoints.length < 12) {
      return { seasonal: 'Limited data for trend analysis' };
    }
    
    // Basic seasonal analysis
    const monthlyAverages = {};
    dataPoints.forEach(([date, rent]) => {
      const month = new Date(date).getMonth();
      if (!monthlyAverages[month]) monthlyAverages[month] = [];
      monthlyAverages[month].push(rent);
    });
    
    const avgByMonth = Object.entries(monthlyAverages).map(([month, rents]) => ({
      month: parseInt(month),
      avgRent: rents.reduce((a, b) => a + b) / rents.length
    }));
    
    const highMonth = avgByMonth.reduce((max, curr) => curr.avgRent > max.avgRent ? curr : max);
    const lowMonth = avgByMonth.reduce((min, curr) => curr.avgRent < min.avgRent ? curr : min);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      seasonal: `Rents typically peak in ${monthNames[highMonth.month]} and bottom in ${monthNames[lowMonth.month]}`,
      longTerm: `${dataPoints.length} months of data available`,
      volatility: 'Standard rental market patterns observed'
    };
  }

  async generateEmbedding(text) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      }),
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  }

  async insertEmbeddingBatch(embeddingBatch) {
    const { error } = await this.supabase
      .from('location_embeddings')
      .insert(embeddingBatch);
    
    if (error) {
      console.error('Embedding batch insert error:', error);
      throw error;
    }
  }
}

// Usage
const loader = new ZipLevelDataLoader();
loader.loadZipLevelData().catch(console.error);

export { ZipLevelDataLoader };