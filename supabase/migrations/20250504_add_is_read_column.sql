
-- Add is_read column to chat_history table
ALTER TABLE IF EXISTS public.chat_history
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT true;
