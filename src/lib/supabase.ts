import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://iiypmipvdxrtxpjyuafa.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JixBsL0q9vL1EdHURg570g_xYVq0wU-';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-supabase-url.supabase.co'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export * from '../utils/supabaseClient';

