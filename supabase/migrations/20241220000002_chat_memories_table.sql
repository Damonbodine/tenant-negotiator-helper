-- Create chat_memories table if it doesn't exist
-- This is completely separate from existing tables and won't affect performance
CREATE TABLE IF NOT EXISTS chat_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  summary TEXT NOT NULL,
  raw_chat_log TEXT NOT NULL,
  feature_type VARCHAR(50) NOT NULL DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance (won't affect existing queries)
CREATE INDEX IF NOT EXISTS idx_chat_memories_user_id ON chat_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_memories_feature_type ON chat_memories(feature_type);
CREATE INDEX IF NOT EXISTS idx_chat_memories_timestamp ON chat_memories(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_memories_active ON chat_memories(is_active) WHERE is_active = true;

-- Row Level Security policies (isolated to this table only)
ALTER TABLE chat_memories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own memories
CREATE POLICY "Users can read own memories" ON chat_memories
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own memories  
CREATE POLICY "Users can insert own memories" ON chat_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own memories
CREATE POLICY "Users can update own memories" ON chat_memories
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own memories
CREATE POLICY "Users can delete own memories" ON chat_memories
  FOR DELETE USING (auth.uid() = user_id); 