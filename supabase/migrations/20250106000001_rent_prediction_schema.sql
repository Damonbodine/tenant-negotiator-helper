-- Migration to add rent prediction and historical data tables
-- This enables predictive rent analysis using HUD + Zillow data

-- Table for HUD Fair Market Rent historical data
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

-- Table for Zillow rent data
CREATE TABLE IF NOT EXISTS zillow_rent_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metro_area TEXT NOT NULL,
    state_code TEXT NOT NULL,
    report_date DATE NOT NULL,
    median_rent DECIMAL(10,2),
    month_over_month_change DECIMAL(5,2), -- percentage
    year_over_year_change DECIMAL(5,2), -- percentage
    inventory_count INTEGER,
    days_on_market DECIMAL(5,1),
    price_per_sqft DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metro_area, report_date)
);

-- Table for rent predictions
CREATE TABLE IF NOT EXISTS rent_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL, -- FIPS code or metro area
    location_type TEXT NOT NULL, -- 'county', 'metro', 'zip'
    location_name TEXT NOT NULL,
    prediction_date DATE NOT NULL,
    prediction_horizon INTEGER NOT NULL, -- months ahead
    data_sources TEXT[] NOT NULL, -- ['hud_fmr', 'zillow', 'census', 'bls']
    
    -- Current and predicted values
    current_rent DECIMAL(10,2),
    predicted_rent DECIMAL(10,2),
    predicted_change_percent DECIMAL(5,2),
    confidence_score DECIMAL(3,2), -- 0.0 to 1.0
    
    -- Confidence intervals
    lower_bound DECIMAL(10,2),
    upper_bound DECIMAL(10,2),
    
    -- Contributing factors
    contributing_factors JSONB,
    market_cycle_stage TEXT, -- 'peak', 'cooling', 'trough', 'recovery'
    
    -- Model metadata
    model_version TEXT DEFAULT 'v1.0',
    model_accuracy DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(location_id, prediction_date, prediction_horizon)
);

-- Table for economic indicators that affect rent predictions
CREATE TABLE IF NOT EXISTS economic_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id TEXT NOT NULL, -- FIPS code or metro area
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
    
    data_source TEXT NOT NULL, -- 'census', 'bls', 'fred', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(location_id, indicator_date, data_source)
);

-- Table to track user-reported market signals
CREATE TABLE IF NOT EXISTS user_market_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    zip_code TEXT,
    
    -- User-reported data
    reported_rent DECIMAL(10,2),
    property_type TEXT, -- 'studio', '1br', '2br', etc.
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
    competition_level TEXT, -- 'low', 'medium', 'high'
    
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
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

-- Function to calculate rent growth rate
CREATE OR REPLACE FUNCTION calculate_rent_growth_rate(
    p_location_id TEXT,
    p_years_back INTEGER DEFAULT 5
)
RETURNS TABLE (
    year INTEGER,
    avg_rent DECIMAL(10,2),
    year_over_year_change DECIMAL(5,2)
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH yearly_rents AS (
        SELECT 
            h.year,
            ROUND(
                (COALESCE(h.studio_fmr, 0) + 
                 COALESCE(h.one_br_fmr, 0) + 
                 COALESCE(h.two_br_fmr, 0) + 
                 COALESCE(h.three_br_fmr, 0)) / 
                NULLIF((CASE WHEN h.studio_fmr IS NOT NULL THEN 1 ELSE 0 END +
                       CASE WHEN h.one_br_fmr IS NOT NULL THEN 1 ELSE 0 END +
                       CASE WHEN h.two_br_fmr IS NOT NULL THEN 1 ELSE 0 END +
                       CASE WHEN h.three_br_fmr IS NOT NULL THEN 1 ELSE 0 END), 0), 2
            ) as avg_rent
        FROM hud_fair_market_rents h
        WHERE h.fips_code = p_location_id
        AND h.year >= EXTRACT(YEAR FROM CURRENT_DATE) - p_years_back
        ORDER BY h.year
    ),
    growth_rates AS (
        SELECT 
            yr.year,
            yr.avg_rent,
            ROUND(
                CASE 
                    WHEN LAG(yr.avg_rent) OVER (ORDER BY yr.year) IS NOT NULL
                    THEN ((yr.avg_rent - LAG(yr.avg_rent) OVER (ORDER BY yr.year)) / 
                          LAG(yr.avg_rent) OVER (ORDER BY yr.year)) * 100
                    ELSE NULL
                END, 2
            ) as yoy_change
        FROM yearly_rents yr
    )
    SELECT gr.year, gr.avg_rent, gr.yoy_change
    FROM growth_rates gr
    ORDER BY gr.year;
END;
$$;

-- Function to get latest market predictions for a location
CREATE OR REPLACE FUNCTION get_latest_rent_prediction(
    p_location_id TEXT,
    p_horizon_months INTEGER DEFAULT 12
)
RETURNS TABLE (
    predicted_rent DECIMAL(10,2),
    predicted_change_percent DECIMAL(5,2),
    confidence_score DECIMAL(3,2),
    market_cycle_stage TEXT,
    contributing_factors JSONB
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.predicted_rent,
        rp.predicted_change_percent,
        rp.confidence_score,
        rp.market_cycle_stage,
        rp.contributing_factors
    FROM rent_predictions rp
    WHERE rp.location_id = p_location_id
    AND rp.prediction_horizon = p_horizon_months
    ORDER BY rp.prediction_date DESC
    LIMIT 1;
END;
$$;

-- Enable RLS on user-specific tables
ALTER TABLE user_market_signals ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_market_signals
CREATE POLICY "Users can only see their own market signals" ON user_market_signals
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON hud_fair_market_rents TO authenticated;
GRANT ALL ON zillow_rent_data TO authenticated;
GRANT ALL ON rent_predictions TO authenticated;
GRANT ALL ON economic_indicators TO authenticated;
GRANT ALL ON user_market_signals TO authenticated;

-- Insert some example data for testing
INSERT INTO hud_fair_market_rents (fips_code, county_name, state_code, state_name, year, studio_fmr, one_br_fmr, two_br_fmr, three_br_fmr, four_br_fmr) VALUES
('36029', 'Erie County', 'NY', 'New York', 2024, 750, 950, 1200, 1450, 1650),
('36029', 'Erie County', 'NY', 'New York', 2023, 720, 920, 1150, 1380, 1580),
('36029', 'Erie County', 'NY', 'New York', 2022, 690, 880, 1100, 1320, 1520),
('36029', 'Erie County', 'NY', 'New York', 2021, 660, 840, 1050, 1260, 1450),
('36029', 'Erie County', 'NY', 'New York', 2020, 640, 810, 1000, 1200, 1380);

-- Comments for documentation
COMMENT ON TABLE hud_fair_market_rents IS 'Historical HUD Fair Market Rent data by county and year';
COMMENT ON TABLE zillow_rent_data IS 'Zillow rent report data with monthly market trends';
COMMENT ON TABLE rent_predictions IS 'Generated rent predictions with confidence intervals';
COMMENT ON TABLE economic_indicators IS 'Economic data that influences rental markets';
COMMENT ON TABLE user_market_signals IS 'User-reported market conditions and negotiation outcomes';