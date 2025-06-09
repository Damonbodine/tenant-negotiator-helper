-- Enable RLS on rent_predictions table and add public read access
ALTER TABLE rent_predictions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to rent predictions
CREATE POLICY "Public read access for rent predictions" ON rent_predictions
FOR SELECT USING (true);

-- Ensure the service role can still write
CREATE POLICY "Service role full access" ON rent_predictions
FOR ALL USING (true)
WITH CHECK (true);