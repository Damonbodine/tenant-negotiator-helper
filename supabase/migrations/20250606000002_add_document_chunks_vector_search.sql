-- Add vector search functionality for document_chunks table
-- This migration adds proper vector similarity search for RAG

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a function to search document_chunks using vector similarity
CREATE OR REPLACE FUNCTION search_document_chunks_by_similarity(
    query_embedding VECTOR(1536),
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
        1 - (dc.embedding::vector <=> query_embedding) AS similarity,
        dc.chunk_index,
        dc.metadata,
        rr.title,
        rr.report_type
    FROM document_chunks dc
    LEFT JOIN rental_reports rr ON dc.document_id = rr.id
    WHERE 
        dc.embedding IS NOT NULL
        AND 1 - (dc.embedding::vector <=> query_embedding) > match_threshold
        AND (p_user_id IS NULL OR rr.user_id = p_user_id OR rr.user_id IS NULL)
    ORDER BY dc.embedding::vector <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to search for location-specific rental data
CREATE OR REPLACE FUNCTION search_rental_data_by_location(
    location_query TEXT,
    query_embedding VECTOR(1536),
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
        1 - (dc.embedding::vector <=> query_embedding) AS similarity,
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
            1 - (dc.embedding::vector <=> query_embedding) > match_threshold
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
        dc.embedding::vector <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_vector 
    ON document_chunks USING ivfflat ((embedding::vector) vector_cosine_ops) 
    WITH (lists = 100);

-- Text search index for hybrid search
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_text 
    ON document_chunks USING gin(to_tsvector('english', content));

-- Index for chunk ordering within documents
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_index 
    ON document_chunks(document_id, chunk_index);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_document_chunks_by_similarity TO authenticated;
GRANT EXECUTE ON FUNCTION search_rental_data_by_location TO authenticated;