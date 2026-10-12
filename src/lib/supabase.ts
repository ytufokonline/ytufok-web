import { createClient } from '@supabase/supabase-js';

// Supabase environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id')
  );
};

// Create Supabase client (using dummy credentials fallback to avoid crashing on launch if env vars are missing)
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key'
);

export const getSupabaseConfigStatus = () => {
  return {
    isConfigured: isSupabaseConfigured(),
    url: supabaseUrl || 'Henüz ayarlanmadı',
    hasKey: Boolean(supabaseAnonKey && !supabaseAnonKey.includes('placeholder'))
  };
};
