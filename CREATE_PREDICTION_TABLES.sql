-- ======================================================
-- RENT PREDICTION SYSTEM - TABLE CREATION SCRIPT
-- Run this in your Supabase SQL Editor to create all tables
-- ======================================================

-- 1. HUD Fair Market Rent historical data table
CREATE TABLE IF NOT EXISTS hud_fair_market_rents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fips_code TEXT NOT NULL,
    county_name TEXT NOT NULL,
    state_code TEXT NOT NULL,
    state_name TEXT,
    year INTEGER NOT NULL,
    studio_fmr DECIMAL(10,2),
    one_br_fmr DECIMAL(10,2),
    two_br_fmr DECIMAL(10,2),
    three_br_fmr DECIMAL(10,2),
    four_br_fmr DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fips_code, year)
);

-- 2. Zillow rent data table
CREATE TABLE IF NOT EXISTS zillow_rent_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metro_area TEXT NOT NULL,
    state_code TEXT NOT NULL,
    report_date DATE NOT NULL,
    median_rent DECIMAL(10,2),
    month_over_month_change DECIMAL(5,2),
    year_over_year_change DECIMAL(5,2),
    inventory_count INTEGER,
    days_on_market DECIMAL(5,1),
    price_per_sqft DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metro_area, report_date)
);

-- 3. Rent predictions table
CREATE TABLE IF NOT EXISTS rent_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL,
    location_type TEXT NOT NULL,
    location_name TEXT NOT NULL,
    prediction_date DATE NOT NULL,
    prediction_horizon INTEGER NOT NULL,
    data_sources TEXT[] NOT NULL,
    
    -- Current and predicted values
    current_rent DECIMAL(10,2),
    predicted_rent DECIMAL(10,2),
    predicted_change_percent DECIMAL(5,2),
    confidence_score DECIMAL(3,2),
    
    -- Confidence intervals
    lower_bound DECIMAL(10,2),
    upper_bound DECIMAL(10,2),
    
    -- Contributing factors
    contributing_factors JSONB,
    market_cycle_stage TEXT,
    
    -- Model metadata
    model_version TEXT DEFAULT 'v1.0',
    model_accuracy DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(location_id, prediction_date, prediction_horizon)
);

-- 4. Economic indicators table (optional for enhanced predictions)
CREATE TABLE IF NOT EXISTS economic_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL,
    location_type TEXT NOT NULL,
    indicator_date DATE NOT NULL,
    
    -- Employment data
    unemployment_rate DECIMAL(5,2),
    employment_growth_rate DECIMAL(5,2),
    labor_force_size INTEGER,
    
    -- Population and demographics
    population_count INTEGER,
    population_growth_rate DECIMAL(5,2),
    median_household_income DECIMAL(12,2),
    median_age DECIMAL(4,1),
    
    -- Housing supply indicators
    construction_permits INTEGER,
    housing_units INTEGER,
    rental_vacancy_rate DECIMAL(5,2),
    homeownership_rate DECIMAL(5,2),
    
    -- Economic indicators
    median_home_price DECIMAL(12,2),
    price_to_rent_ratio DECIMAL(8,2),
    mortgage_rate DECIMAL(5,2),
    
    data_source TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(location_id, indicator_date, data_source)
);

-- 5. User market signals table
CREATE TABLE IF NOT EXISTS user_market_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    zip_code TEXT,
    
    -- User-reported data
    reported_rent DECIMAL(10,2),
    property_type TEXT,
    square_footage INTEGER,
    amenities TEXT[],
    
    -- Negotiation outcomes
    negotiation_attempted BOOLEAN DEFAULT FALSE,
    negotiation_successful BOOLEAN,
    original_asking_rent DECIMAL(10,2),
    final_agreed_rent DECIMAL(10,2),
    savings_achieved DECIMAL(10,2),
    negotiation_strategy TEXT,
    
    -- Market observations
    landlord_flexibility_score INTEGER CHECK (landlord_flexibility_score BETWEEN 1 AND 10),
    time_on_market_days INTEGER,
    competition_level TEXT,
    
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hud_fmr_location_year ON hud_fair_market_rents(fips_code, year);
CREATE INDEX IF NOT EXISTS idx_hud_fmr_state_year ON hud_fair_market_rents(state_code, year);

CREATE INDEX IF NOT EXISTS idx_zillow_metro_date ON zillow_rent_data(metro_area, report_date);
CREATE INDEX IF NOT EXISTS idx_zillow_state_date ON zillow_rent_data(state_code, report_date);

CREATE INDEX IF NOT EXISTS idx_predictions_location_date ON rent_predictions(location_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictions_horizon ON rent_predictions(prediction_horizon);

CREATE INDEX IF NOT EXISTS idx_economic_location_date ON economic_indicators(location_id, indicator_date);
CREATE INDEX IF NOT EXISTS idx_economic_source ON economic_indicators(data_source);

CREATE INDEX IF NOT EXISTS idx_user_signals_location ON user_market_signals(location);
CREATE INDEX IF NOT EXISTS idx_user_signals_user ON user_market_signals(user_id);

-- Grant permissions for authenticated users
GRANT ALL ON hud_fair_market_rents TO authenticated;
GRANT ALL ON zillow_rent_data TO authenticated;
GRANT ALL ON rent_predictions TO authenticated;
GRANT ALL ON economic_indicators TO authenticated;
GRANT ALL ON user_market_signals TO authenticated;

-- Enable RLS on user-specific tables
ALTER TABLE user_market_signals ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_market_signals
DROP POLICY IF EXISTS "Users can only see their own market signals" ON user_market_signals;
CREATE POLICY "Users can only see their own market signals" ON user_market_signals
    FOR ALL USING (auth.uid() = user_id);

-- Insert some test data for Buffalo to verify system works
INSERT INTO hud_fair_market_rents (fips_code, county_name, state_code, state_name, year, studio_fmr, one_br_fmr, two_br_fmr, three_br_fmr, four_br_fmr) 
VALUES
    ('36029', 'Erie County', 'NY', 'New York', 2024, 750, 950, 1200, 1450, 1650),
    ('36029', 'Erie County', 'NY', 'New York', 2023, 720, 920, 1150, 1380, 1580),
    ('36029', 'Erie County', 'NY', 'New York', 2022, 690, 880, 1100, 1320, 1520),
    ('36029', 'Erie County', 'NY', 'New York', 2021, 660, 840, 1050, 1260, 1450)
ON CONFLICT (fips_code, year) DO NOTHING;

-- Test Zillow data for Buffalo metro
INSERT INTO zillow_rent_data (metro_area, state_code, report_date, median_rent, month_over_month_change, year_over_year_change)
VALUES
    ('Buffalo-Cheektowaga-Niagara Falls, NY', 'NY', '2024-12-01', 1250, 0.5, 3.2),
    ('Buffalo-Cheektowaga-Niagara Falls, NY', 'NY', '2024-11-01', 1245, 0.3, 2.8),
    ('Buffalo-Cheektowaga-Niagara Falls, NY', 'NY', '2024-10-01', 1241, 0.2, 2.5)
ON CONFLICT (metro_area, report_date) DO NOTHING;

-- Create a sample prediction for Buffalo
INSERT INTO rent_predictions (
    location_id, location_type, location_name, prediction_date, prediction_horizon,
    data_sources, current_rent, predicted_rent, predicted_change_percent, confidence_score,
    lower_bound, upper_bound, contributing_factors, market_cycle_stage
) VALUES (
    '36029', 'county', 'Erie County, NY', CURRENT_DATE, 12,
    ARRAY['HUD Fair Market Rent', 'Zillow Market Data'], 1250, 1285, 2.8, 0.75,
    1240, 1330, 
    '{"key_factors": ["Historical trend: 2.5% annually", "Seasonal effect: -0.5%", "Market cycle: stable"], "trend_contribution": 0.4, "seasonal_contribution": 0.15, "market_cycle_contribution": 0.2, "momentum_contribution": 0.25, "data_quality_score": 0.8}',
    'stable'
) ON CONFLICT (location_id, prediction_date, prediction_horizon) DO NOTHING;

-- ======================================================
-- VERIFICATION QUERIES
-- Run these to verify everything worked:
-- ======================================================

-- Check table creation
SELECT schemaname, tablename FROM pg_tables WHERE tablename LIKE '%hud%' OR tablename LIKE '%zillow%' OR tablename LIKE '%prediction%';

-- Check sample data
SELECT COUNT(*) as hud_records FROM hud_fair_market_rents;
SELECT COUNT(*) as zillow_records FROM zillow_rent_data;
SELECT COUNT(*) as prediction_records FROM rent_predictions;

-- Test prediction query
SELECT location_name, predicted_rent, predicted_change_percent, confidence_score, market_cycle_stage 
FROM rent_predictions 
WHERE location_name ILIKE '%Erie%';

-- ======================================================
-- SUCCESS! 
-- Your prediction system is now ready for data population
-- ======================================================