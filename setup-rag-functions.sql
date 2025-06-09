-- Create vector search functions for RAG
-- This will be executed directly in the database

-- Create the search function for document chunks
CREATE OR REPLACE FUNCTION search_document_chunks_by_similarity(
    query_embedding text,
    p_user_id UUID DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.6,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    content TEXT,
    similarity FLOAT,
    chunk_index INTEGER,
    metadata JSONB,
    report_title TEXT,
    report_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.document_id,
        dc.content,
        1 - (dc.embedding::vector <=> query_embedding::vector) AS similarity,
        dc.chunk_index,
        dc.metadata,
        rr.title,
        rr.report_type
    FROM document_chunks dc
    LEFT JOIN rental_reports rr ON dc.document_id = rr.id
    WHERE 
        dc.embedding IS NOT NULL
        AND 1 - (dc.embedding::vector <=> query_embedding::vector) > match_threshold
        AND (p_user_id IS NULL OR rr.user_id = p_user_id OR rr.user_id IS NULL)
    ORDER BY dc.embedding::vector <=> query_embedding::vector
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create location-specific search function
CREATE OR REPLACE FUNCTION search_rental_data_by_location(
    location_query TEXT,
    query_embedding text,
    match_threshold FLOAT DEFAULT 0.6,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    chunk_id UUID,
    content TEXT,
    similarity FLOAT,
    location_mentioned TEXT,
    report_title TEXT,
    report_type TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.content,
        1 - (dc.embedding::vector <=> query_embedding::vector) AS similarity,
        location_query AS location_mentioned,
        rr.title,
        rr.report_type,
        dc.metadata
    FROM document_chunks dc
    LEFT JOIN rental_reports rr ON dc.document_id = rr.id
    WHERE 
        dc.embedding IS NOT NULL
        AND (
            -- Semantic similarity search
            1 - (dc.embedding::vector <=> query_embedding::vector) > match_threshold
            OR 
            -- Text search for location names
            dc.content ILIKE '%' || location_query || '%'
        )
        AND (
            -- Filter for content that likely contains rental/market data
            dc.content ILIKE '%rent%' 
            OR dc.content ILIKE '%market%'
            OR dc.content ILIKE '%price%'
            OR dc.content ILIKE '%growth%'
            OR rr.report_type IN ('market_analysis', 'property_analysis', 'rental_data')
        )
    ORDER BY 
        CASE 
            WHEN dc.content ILIKE '%' || location_query || '%' THEN 0 -- Exact location match gets priority
            ELSE 1
        END,
        dc.embedding::vector <=> query_embedding::vector
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;