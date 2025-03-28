
import { createClient } from '@supabase/supabase-js';

// Supabase project details
const supabaseUrl = 'https://grzedejulegiuxythgzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyemVkZWp1bGVnaXV4eXRoZ3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDIzOTgsImV4cCI6MjA1ODc3ODM5OH0.-kmp812qh9-dQ92p-wd-j0eo54eGtgT1ObwmFXIeBIQ';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
