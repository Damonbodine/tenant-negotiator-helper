-- Rental Negotiation AI Chat Memory Architecture
-- This migration creates a comprehensive memory system for rental negotiation AI

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- 1. Enhanced User Profiles (extends existing user_profiles)
-- First, check if user_profiles exists and alter if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles_rental') THEN
        CREATE TABLE user_profiles_rental (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            -- User context for AI personalization
            location TEXT,
            current_situation TEXT CHECK (current_situation IN ('searching', 'renewal', 'current_tenant', 'relocating')),
            budget_range_min INTEGER,
            budget_range_max INTEGER,
            
            -- Aggregated insights (computed fields)
            total_properties_analyzed INTEGER DEFAULT 0,
            total_conversations INTEGER DEFAULT 0,
            negotiation_experience_level TEXT DEFAULT 'beginner',
            
            -- Preferences
            preferred_communication_style TEXT DEFAULT 'friendly',
            ai_context_preferences JSONB DEFAULT '{}'::JSONB
        );
    END IF;
END $$;

-- 2. Properties (Central Property Repository)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Property identification
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    property_type TEXT CHECK (property_type IN ('apartment', 'house', 'condo', 'townhouse', 'other')),
    
    -- Property details
    bedrooms INTEGER,
    bathrooms NUMERIC(3,1),
    square_feet INTEGER,
    rent_amount INTEGER, -- in cents to avoid decimal issues
    
    -- Listing information
    listing_url TEXT,
    listing_source TEXT,
    listing_date DATE,
    date_listed INTEGER,
    
    -- AI analysis cache
    market_analysis JSONB,
    comparable_properties JSONB,
    negotiation_insights JSONB,
    
    -- Metadata
    property_source TEXT CHECK (property_source IN ('user_input', 'listing_analyzer', 'comparable_search', 'manual_entry')),
    confidence_score NUMERIC(3,2),
    
    -- Indexing
    location_vector VECTOR(1536), -- For semantic search of similar properties
    
    CONSTRAINT unique_property_address UNIQUE(address, city, state)
);

-- 3. User-Property Relationships
CREATE TABLE IF NOT EXISTS user_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Relationship context
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'target', 'current', 'comparable', 'analyzed', 'rejected'
    )),
    
    -- User-specific property context
    user_notes TEXT,
    priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    
    -- User's property-specific data
    user_target_rent INTEGER,
    user_max_rent INTEGER,
    negotiation_status TEXT CHECK (negotiation_status IN ('not_started', 'in_progress', 'successful', 'failed', 'withdrawn')),
    actual_negotiated_rent INTEGER,
    
    CONSTRAINT unique_user_property_relationship UNIQUE(user_id, property_id, relationship_type)
);

-- 4. Conversations (Enhanced from existing)
CREATE TABLE IF NOT EXISTS rental_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Conversation metadata
    conversation_type TEXT NOT NULL CHECK (conversation_type IN (
        'listing_analyzer', 'comparables', 'negotiation_help', 'voice_chat',
        'email_script_builder', 'price_analysis', 'general_advice'
    )),
    
    title TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    
    -- Context and intent
    primary_property_id UUID REFERENCES properties(id),
    conversation_intent JSONB,
    
    -- AI context management
    context_properties UUID[] DEFAULT '{}',
    context_summary TEXT,
    key_insights JSONB DEFAULT '[]'::JSONB,
    
    -- Conversation outcomes
    action_items JSONB DEFAULT '[]'::JSONB,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating BETWEEN 1 AND 5)
);

-- 5. Messages (Enhanced from existing)
CREATE TABLE IF NOT EXISTS rental_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    conversation_id UUID NOT NULL REFERENCES rental_conversations(id) ON DELETE CASCADE,
    
    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Message metadata
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'analysis', 'comparison', 'recommendation', 'template')),
    
    -- AI processing
    token_count INTEGER,
    processing_time_ms INTEGER,
    model_used TEXT,
    
    -- Context references
    referenced_properties UUID[] DEFAULT '{}',
    generated_insights JSONB,
    
    -- Message threading
    parent_message_id UUID REFERENCES rental_messages(id),
    
    -- Embeddings for semantic search
    content_vector VECTOR(1536)
);

-- 6. Analyses (Cached AI Analysis Results)
CREATE TABLE IF NOT EXISTS rental_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Analysis scope
    analysis_type TEXT NOT NULL CHECK (analysis_type IN (
        'single_property', 'comparative', 'market_trend', 'negotiation_strategy', 'price_analysis'
    )),
    
    -- Analysis targets
    primary_property_id UUID REFERENCES properties(id),
    compared_properties UUID[] DEFAULT '{}',
    
    -- Analysis results
    analysis_results JSONB NOT NULL,
    confidence_score NUMERIC(3,2),
    
    -- Generated artifacts
    summary TEXT,
    recommendations JSONB DEFAULT '[]'::JSONB,
    talking_points JSONB DEFAULT '[]'::JSONB,
    
    -- Usage tracking
    conversation_id UUID REFERENCES rental_conversations(id),
    reused_count INTEGER DEFAULT 0,
    
    -- Validation
    user_feedback_rating INTEGER CHECK (user_feedback_rating BETWEEN 1 AND 5),
    accuracy_validated BOOLEAN DEFAULT FALSE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(city, state);
CREATE INDEX IF NOT EXISTS idx_properties_rent ON properties(rent_amount);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);

-- User properties indexes  
CREATE INDEX IF NOT EXISTS idx_user_properties_user ON user_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_user_properties_relationship ON user_properties(relationship_type);
CREATE INDEX IF NOT EXISTS idx_user_properties_status ON user_properties(status);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_rental_conversations_user ON rental_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_conversations_type ON rental_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_rental_conversations_created ON rental_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_rental_conversations_property ON rental_conversations(primary_property_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_rental_messages_conversation ON rental_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_rental_messages_created ON rental_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_rental_messages_role ON rental_messages(role);

-- Analyses indexes
CREATE INDEX IF NOT EXISTS idx_rental_analyses_user ON rental_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_analyses_type ON rental_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_rental_analyses_property ON rental_analyses(primary_property_id);
CREATE INDEX IF NOT EXISTS idx_rental_analyses_conversation ON rental_analyses(conversation_id);

-- Vector indexes
CREATE INDEX IF NOT EXISTS idx_properties_location_vector 
    ON properties USING ivfflat (location_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_rental_messages_content_vector 
    ON rental_messages USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);

-- =============================================
-- CONTEXT AGGREGATION FUNCTIONS
-- =============================================

-- Function to get user's property context
CREATE OR REPLACE FUNCTION get_user_property_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    context JSONB := '{}';
BEGIN
    SELECT jsonb_build_object(
        'target_properties', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'property_id', p.id,
                'address', p.address,
                'city', p.city,
                'state', p.state,
                'rent_amount', p.rent_amount,
                'user_target_rent', up.user_target_rent,
                'relationship_type', up.relationship_type,
                'priority_level', up.priority_level,
                'negotiation_status', up.negotiation_status
            )), '[]'::jsonb)
            FROM properties p
            JOIN user_properties up ON p.id = up.property_id
            WHERE up.user_id = p_user_id AND up.relationship_type = 'target' AND up.status = 'active'
        ),
        'comparable_properties', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'property_id', p.id,
                'address', p.address,
                'city', p.city,
                'rent_amount', p.rent_amount,
                'property_type', p.property_type
            )), '[]'::jsonb)
            FROM properties p
            JOIN user_properties up ON p.id = up.property_id
            WHERE up.user_id = p_user_id AND up.relationship_type = 'comparable'
        ),
        'analysis_history', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'analysis_id', id,
                'analysis_type', analysis_type,
                'summary', summary,
                'confidence_score', confidence_score,
                'created_at', created_at
            )), '[]'::jsonb)
            FROM rental_analyses
            WHERE user_id = p_user_id
            ORDER BY created_at DESC
            LIMIT 10
        ),
        'user_profile', (
            SELECT jsonb_build_object(
                'location', location,
                'current_situation', current_situation,
                'budget_range_min', budget_range_min,
                'budget_range_max', budget_range_max,
                'negotiation_experience_level', negotiation_experience_level,
                'preferred_communication_style', preferred_communication_style
            )
            FROM user_profiles_rental
            WHERE id = p_user_id
        )
    ) INTO context;
    
    RETURN context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to build conversation context
CREATE OR REPLACE FUNCTION build_conversation_context(p_conversation_id UUID)
RETURNS JSONB AS $$
DECLARE
    conv RECORD;
    context JSONB := '{}';
BEGIN
    -- Get conversation details
    SELECT * INTO conv FROM rental_conversations WHERE id = p_conversation_id;
    
    IF NOT FOUND THEN
        RETURN '{}'::jsonb;
    END IF;
    
    -- Build comprehensive context
    SELECT jsonb_build_object(
        'conversation_info', jsonb_build_object(
            'id', conv.id,
            'type', conv.conversation_type,
            'title', conv.title,
            'primary_property_id', conv.primary_property_id,
            'context_properties', conv.context_properties
        ),
        'user_context', get_user_property_context(conv.user_id),
        'conversation_history', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'role', role,
                'content', content,
                'message_type', message_type,
                'referenced_properties', referenced_properties,
                'created_at', created_at
            ) ORDER BY created_at), '[]'::jsonb)
            FROM rental_messages
            WHERE conversation_id = p_conversation_id
        ),
        'relevant_analyses', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'analysis_type', analysis_type,
                'summary', summary,
                'recommendations', recommendations,
                'confidence_score', confidence_score
            )), '[]'::jsonb)
            FROM rental_analyses
            WHERE user_id = conv.user_id
                AND (
                    primary_property_id = conv.primary_property_id 
                    OR primary_property_id = ANY(conv.context_properties)
                    OR conv.primary_property_id IS NULL
                )
            ORDER BY created_at DESC
            LIMIT 5
        ),
        'primary_property_details', (
            SELECT jsonb_build_object(
                'id', p.id,
                'address', p.address,
                'city', p.city,
                'state', p.state,
                'rent_amount', p.rent_amount,
                'property_type', p.property_type,
                'bedrooms', p.bedrooms,
                'bathrooms', p.bathrooms,
                'square_feet', p.square_feet,
                'market_analysis', p.market_analysis,
                'negotiation_insights', p.negotiation_insights
            )
            FROM properties p
            WHERE p.id = conv.primary_property_id
        )
    ) INTO context;
    
    RETURN context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile aggregates
CREATE OR REPLACE FUNCTION update_user_aggregates(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles_rental SET 
        total_properties_analyzed = (
            SELECT COUNT(DISTINCT property_id) 
            FROM user_properties 
            WHERE user_id = p_user_id AND relationship_type IN ('analyzed', 'target')
        ),
        total_conversations = (
            SELECT COUNT(*) 
            FROM rental_conversations 
            WHERE user_id = p_user_id
        ),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS FOR AUTOMATION
-- =============================================

-- Trigger to update user aggregates when properties or conversations change
CREATE OR REPLACE FUNCTION trigger_update_user_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'user_properties' THEN
        PERFORM update_user_aggregates(NEW.user_id);
        IF OLD IS NOT NULL AND OLD.user_id != NEW.user_id THEN
            PERFORM update_user_aggregates(OLD.user_id);
        END IF;
    ELSIF TG_TABLE_NAME = 'rental_conversations' THEN
        PERFORM update_user_aggregates(NEW.user_id);
        IF OLD IS NOT NULL AND OLD.user_id != NEW.user_id THEN
            PERFORM update_user_aggregates(OLD.user_id);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_user_properties_aggregates ON user_properties;
CREATE TRIGGER trigger_user_properties_aggregates
    AFTER INSERT OR UPDATE OR DELETE ON user_properties
    FOR EACH ROW EXECUTE FUNCTION trigger_update_user_aggregates();

DROP TRIGGER IF EXISTS trigger_rental_conversations_aggregates ON rental_conversations;
CREATE TRIGGER trigger_rental_conversations_aggregates
    AFTER INSERT OR UPDATE OR DELETE ON rental_conversations
    FOR EACH ROW EXECUTE FUNCTION trigger_update_user_aggregates();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles_rental ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_analyses ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own rental profile" ON user_profiles_rental 
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own rental profile" ON user_profiles_rental 
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own rental profile" ON user_profiles_rental 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties policies (public read, user-restricted write)
CREATE POLICY "Properties are publicly readable" ON properties 
    FOR SELECT USING (true);
CREATE POLICY "Users can insert properties" ON properties 
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update properties they've referenced" ON properties 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_properties 
            WHERE user_properties.property_id = properties.id 
            AND user_properties.user_id = auth.uid()
        )
    );

-- User properties policies
CREATE POLICY "Users can manage own property relationships" ON user_properties 
    FOR ALL USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can manage own rental conversations" ON rental_conversations 
    FOR ALL USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can manage own rental messages" ON rental_messages 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM rental_conversations 
            WHERE rental_conversations.id = rental_messages.conversation_id 
            AND rental_conversations.user_id = auth.uid()
        )
    );

-- Analyses policies
CREATE POLICY "Users can manage own rental analyses" ON rental_analyses 
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTIONS FOR API USAGE
-- =============================================

-- Function to search similar properties by vector
CREATE OR REPLACE FUNCTION search_similar_properties(
    query_vector VECTOR(1536),
    p_user_id UUID DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.7,
    result_limit INT DEFAULT 10
)
RETURNS TABLE (
    property_id UUID,
    address TEXT,
    city TEXT,
    rent_amount INTEGER,
    similarity FLOAT,
    market_analysis JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.address,
        p.city,
        p.rent_amount,
        1 - (p.location_vector <=> query_vector) AS similarity,
        p.market_analysis
    FROM properties p
    WHERE p.location_vector IS NOT NULL
        AND 1 - (p.location_vector <=> query_vector) > similarity_threshold
    ORDER BY p.location_vector <=> query_vector
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's recent conversations with context
CREATE OR REPLACE FUNCTION get_user_recent_conversations(
    p_user_id UUID,
    conversation_limit INT DEFAULT 5
)
RETURNS TABLE (
    conversation_id UUID,
    conversation_type TEXT,
    title TEXT,
    created_at TIMESTAMPTZ,
    message_count BIGINT,
    primary_property_address TEXT,
    context_summary TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.conversation_type,
        c.title,
        c.created_at,
        COALESCE(msg_count.count, 0) as message_count,
        p.address as primary_property_address,
        c.context_summary
    FROM rental_conversations c
    LEFT JOIN properties p ON c.primary_property_id = p.id
    LEFT JOIN (
        SELECT conversation_id, COUNT(*) as count
        FROM rental_messages
        GROUP BY conversation_id
    ) msg_count ON c.id = msg_count.conversation_id
    WHERE c.user_id = p_user_id
    ORDER BY c.updated_at DESC
    LIMIT conversation_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 