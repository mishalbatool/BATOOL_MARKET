import { createClient } from '@supabase/supabase-js';

// Clean and normalize provided URL: remove any trailing /rest/v1 or /rest/v1/
function normalizeSupabaseUrl(rawUrl: string): string {
  let clean = (rawUrl || '').trim();
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

// User credentials configured for your Supabase project:
// Project: https://tvtzpgvfvvgxqlmhqnek.supabase.co
const DEFAULT_SUPABASE_URL = "https://tvtzpgvfvvgxqlmhqnek.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_o5fe-jyeiBZHrH-KXUj-bA_k0fttWQa";

const envUrl = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();

const rawUrl = envUrl || DEFAULT_SUPABASE_URL;
const rawKey = envKey || DEFAULT_SUPABASE_KEY;

export const supabaseUrl = normalizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = rawKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

// Create the active Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
