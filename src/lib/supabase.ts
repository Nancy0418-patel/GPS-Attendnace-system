import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Validate that real Supabase credentials are provided
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-anon-key') {
  console.warn('⚠️  Supabase credentials not configured. Please create a .env file with your actual Supabase URL and anon key.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);