-- Enhanced RAG Functions for Location-Aware Historical Intelligence
-- Enables queries like "rents in Austin" to return real historical trend data

-- Function 1: Search ZIP-level historical data by location
CREATE OR REPLACE FUNCTION search_historical_rent_data(
  location_query TEXT,
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  zip_code TEXT,
  city TEXT,
  state_code TEXT,
  metro TEXT,
  current_rent DECIMAL,
  yearly_change DECIMAL,
  historical_summary TEXT,
  seasonal_patterns TEXT,
  similarity FLOAT
)
LANGUAGE SQL
AS $$
  WITH location_matches AS (
    -- Direct location name matching
    SELECT 
      zr.zip_code,
      zr.city,
      zr.state_code,
      zr.metro,
      zr.latest_rent as current_rent,
      zr.yearly_change,
      le.content as historical_summary,
      'Seasonal analysis available' as seasonal_patterns,
      1.0 as similarity
    FROM zip_level_rents zr
    LEFT JOIN location_embeddings le ON zr.zip_code = le.zip_code
    WHERE 
      LOWER(zr.city) LIKE LOWER('%' || location_query || '%') OR
      LOWER(zr.metro) LIKE LOWER('%' || location_query || '%') OR
      zr.zip_code = location_query OR
      LOWER(zr.state_code) = LOWER(location_query)
    ORDER BY zr.latest_rent DESC
    LIMIT match_count
  ),
  embedding_matches AS (
    -- Semantic similarity matching
    SELECT 
      le.zip_code,
      le.city,
      le.state_code,
      le.metro,
      zr.latest_rent as current_rent,
      zr.yearly_change,
      le.content as historical_summary,
      'Historical trends available' as seasonal_patterns,
      (le.embedding <=> query_embedding) as similarity
    FROM location_embeddings le
    JOIN zip_level_rents zr ON le.zip_code = zr.zip_code
    WHERE le.embedding <=> query_embedding < (1 - match_threshold)
    ORDER BY le.embedding <=> query_embedding
    LIMIT match_count
  )
  
  -- Combine and deduplicate results
  SELECT DISTINCT ON (zip_code)
    zip_code,
    city,
    state_code,
    metro,
    current_rent,
    yearly_change,
    historical_summary,
    seasonal_patterns,
    similarity
  FROM (
    SELECT * FROM location_matches
    UNION ALL
    SELECT * FROM embedding_matches
  ) combined
  ORDER BY zip_code, similarity ASC
  LIMIT match_count;
$$;

-- Function 2: Get detailed historical analysis for specific location
CREATE OR REPLACE FUNCTION get_location_historical_analysis(
  target_zip_code TEXT DEFAULT NULL,
  target_city TEXT DEFAULT NULL,
  target_state TEXT DEFAULT NULL
)
RETURNS TABLE (
  zip_code TEXT,
  city TEXT,
  state_code TEXT,
  analysis_summary JSONB
)
LANGUAGE PLPGSQL
AS $$
DECLARE
  rent_data_json JSONB;
  historical_analysis JSONB;
BEGIN
  -- Get the rent data for the specified location
  SELECT zr.rent_data, zr.zip_code, zr.city, zr.state_code
  INTO rent_data_json, zip_code, city, state_code
  FROM zip_level_rents zr
  WHERE 
    (target_zip_code IS NULL OR zr.zip_code = target_zip_code) AND
    (target_city IS NULL OR LOWER(zr.city) = LOWER(target_city)) AND
    (target_state IS NULL OR LOWER(zr.state_code) = LOWER(target_state))
  ORDER BY zr.latest_rent DESC
  LIMIT 1;
  
  -- Generate historical analysis
  historical_analysis := jsonb_build_object(
    'data_points', jsonb_object_keys(rent_data_json),
    'latest_rent', (SELECT MAX((value->>'value')::numeric) FROM jsonb_each(rent_data_json)),
    'earliest_rent', (SELECT MIN((value->>'value')::numeric) FROM jsonb_each(rent_data_json)),
    'trend_summary', 'Historical analysis of ' || city || ', ' || state_code,
    'data_coverage', 'Monthly data from 2015 to 2025'
  );
  
  analysis_summary := historical_analysis;
  
  RETURN NEXT;
END;
$$;

-- Function 3: Compare location to regional averages
CREATE OR REPLACE FUNCTION compare_location_to_region(
  target_zip_code TEXT,
  comparison_radius_miles INT DEFAULT 25
)
RETURNS TABLE (
  target_location TEXT,
  target_rent DECIMAL,
  regional_average DECIMAL,
  percentile_rank FLOAT,
  comparison_summary TEXT
)
LANGUAGE SQL
AS $$
  WITH target_data AS (
    SELECT zip_code, city, state_code, latest_rent, metro
    FROM zip_level_rents
    WHERE zip_code = target_zip_code
  ),
  regional_data AS (
    SELECT zr.latest_rent
    FROM zip_level_rents zr, target_data td
    WHERE 
      zr.state_code = td.state_code AND
      (zr.metro = td.metro OR zr.city = td.city) AND
      zr.latest_rent IS NOT NULL
  ),
  stats AS (
    SELECT 
      td.city || ', ' || td.state_code || ' ' || td.zip_code as target_location,
      td.latest_rent as target_rent,
      AVG(rd.latest_rent) as regional_average,
      (
        SELECT COUNT(*) 
        FROM regional_data rd2 
        WHERE rd2.latest_rent <= td.latest_rent
      )::FLOAT / (
        SELECT COUNT(*) 
        FROM regional_data
      ) * 100 as percentile_rank
    FROM target_data td, regional_data rd
    GROUP BY td.city, td.state_code, td.zip_code, td.latest_rent
  )
  
  SELECT 
    target_location,
    target_rent,
    ROUND(regional_average, 0) as regional_average,
    ROUND(percentile_rank, 1) as percentile_rank,
    CASE 
      WHEN percentile_rank >= 80 THEN 'Premium location - top 20% of regional rents'
      WHEN percentile_rank >= 60 THEN 'Above average location - upper market segment'
      WHEN percentile_rank >= 40 THEN 'Market rate location - typical for region'
      WHEN percentile_rank >= 20 THEN 'Below average - good value for region'
      ELSE 'Budget location - bottom 20% of regional rents'
    END as comparison_summary
  FROM stats;
$$;

-- Function 4: Enhanced search combining historical data with RAG
CREATE OR REPLACE FUNCTION search_location_intelligence(
  user_query TEXT,
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  location_summary TEXT,
  historical_data JSONB,
  market_intelligence TEXT,
  negotiation_context TEXT,
  data_confidence TEXT,
  similarity FLOAT
)
LANGUAGE PLPGSQL
AS $$
DECLARE
  location_record RECORD;
  historical_json JSONB;
  intelligence_text TEXT;
  negotiation_text TEXT;
  confidence_level TEXT;
BEGIN
  -- Search for matching locations
  FOR location_record IN 
    SELECT * FROM search_historical_rent_data(
      user_query, 
      query_embedding, 
      match_threshold, 
      match_count
    )
  LOOP
    -- Build historical data summary
    historical_json := jsonb_build_object(
      'zip_code', location_record.zip_code,
      'city', location_record.city,
      'state', location_record.state_code,
      'metro', location_record.metro,
      'current_rent', location_record.current_rent,
      'yearly_change', location_record.yearly_change,
      'trend_direction', CASE 
        WHEN location_record.yearly_change > 5 THEN 'Rising rapidly'
        WHEN location_record.yearly_change > 2 THEN 'Rising moderately'
        WHEN location_record.yearly_change > -2 THEN 'Stable'
        WHEN location_record.yearly_change > -5 THEN 'Declining moderately'
        ELSE 'Declining rapidly'
      END
    );
    
    -- Generate market intelligence
    intelligence_text := format(
      'ZIP %s (%s, %s): Current rent $%s, %s%% annual change. %s market trend with %s.',
      location_record.zip_code,
      location_record.city,
      location_record.state_code,
      location_record.current_rent,
      location_record.yearly_change,
      CASE 
        WHEN location_record.yearly_change > 2 THEN 'Rising'
        WHEN location_record.yearly_change < -2 THEN 'Declining'
        ELSE 'Stable'
      END,
      location_record.seasonal_patterns
    );
    
    -- Generate negotiation context
    negotiation_text := CASE 
      WHEN location_record.yearly_change < -2 THEN 
        'Strong negotiation position: Market declining. Reference local rent trends as leverage.'
      WHEN location_record.yearly_change > 5 THEN 
        'Challenging negotiation environment: Rapidly rising market. Focus on tenant quality and lease terms.'
      ELSE 
        'Moderate negotiation position: Stable market allows for standard strategies.'
    END;
    
    -- Determine confidence level
    confidence_level := CASE 
      WHEN location_record.similarity > 0.9 THEN 'High - Direct location match'
      WHEN location_record.similarity > 0.7 THEN 'Medium - Good semantic match'
      ELSE 'Low - Broad regional context'
    END;
    
    -- Return results
    location_summary := format('%s, %s %s', location_record.city, location_record.state_code, location_record.zip_code);
    historical_data := historical_json;
    market_intelligence := intelligence_text;
    negotiation_context := negotiation_text;
    data_confidence := confidence_level;
    similarity := location_record.similarity;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;