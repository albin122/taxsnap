import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iiypmipvdxrtxpjyuafa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JixBsL0q9vL1EdHURg570g_xYVq0wU-';

export const BACKEND_URL = import.meta.env.VITE_RENDER_URL || 'https://taxsnap-evh2.onrender.com';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

