
import { createClient } from '@supabase/supabase-js';

// These should be replaced with your actual Supabase project details
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
