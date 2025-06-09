// Quick test of date column detection
import fs from 'fs';
import csv from 'csv-parser';

let tested = false;
fs.createReadStream('./Predictiondata/Rental Data/Zip_zori_uc_sfrcondomfr_sm_sa_month.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (!tested) {
      const dateColumns = Object.keys(row).filter(key => key.match(/^\d{4}-\d{2}-\d{2}$/));
      console.log('City:', row.City);
      console.log('State:', row.State);
      console.log('ZIP:', row.RegionName);
      console.log('Date columns found:', dateColumns.length);
      console.log('Sample dates:', dateColumns.slice(0, 5));
      console.log('Sample rent value:', row['2024-01-31']);
      tested = true;
      process.exit(0);
    }
  })
  .on('error', (error) => {
    console.error('Error:', error);
    process.exit(1);
  });