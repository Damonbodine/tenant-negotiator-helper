-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base table for RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  metadata JSONB,
  chat_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation history for context and learning
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  chat_type VARCHAR(50) NOT NULL,
  user_message TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  tool_calls JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles for personalization
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  preferences JSONB,
  chat_history_summary TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool usage tracking
CREATE TABLE IF NOT EXISTS tool_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  tool_name VARCHAR(100) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding 
  ON knowledge_base USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_chat_type 
  ON knowledge_base(chat_type);

CREATE INDEX IF NOT EXISTS idx_conversation_history_user 
  ON conversation_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_history_chat_type 
  ON conversation_history(chat_type, created_at DESC);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  chat_type text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source VARCHAR(255),
  similarity float,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.content,
    kb.source,
    (kb.embedding <=> query_embedding) * -1 + 1 AS similarity,
    kb.metadata
  FROM knowledge_base kb
  WHERE 
    (chat_type IS NULL OR kb.chat_type = chat_type OR kb.chat_type = 'general')
    AND (kb.embedding <=> query_embedding) * -1 + 1 > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get user conversation context
CREATE OR REPLACE FUNCTION get_user_context(
  p_user_id UUID,
  p_chat_type VARCHAR DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_message TEXT,
  agent_response TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.user_message,
    ch.agent_response,
    ch.created_at
  FROM conversation_history ch
  WHERE 
    ch.user_id = p_user_id
    AND (p_chat_type IS NULL OR ch.chat_type = p_chat_type)
  ORDER BY ch.created_at DESC
  LIMIT p_limit;
END;
$$;

-- RLS policies (if needed)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your auth requirements)
CREATE POLICY "Knowledge base is publicly readable" 
  ON knowledge_base FOR SELECT 
  USING (true);

CREATE POLICY "Users can read their own conversation history" 
  ON conversation_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation history" 
  ON conversation_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = user_id); 