// ==============================================================================
// SRI YMB TRADING COMPANY — SUPABASE CLIENT & CONFIGURATION
// Supports Vite environment variables (.env) + Runtime Config Override
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from .env or localStorage fallback for easy initial setup
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('sri_ymb_supabase_url');
  const localKey = localStorage.getItem('sri_ymb_supabase_anon_key');

  const url = (localUrl && localUrl.trim()) || (envUrl && envUrl.trim()) || '';
  const key = (localKey && localKey.trim()) || (envKey && envKey.trim()) || '';

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseCredentials();
  return (
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('your-project-ref') &&
    key.length > 20 &&
    !key.includes('your-supabase-anon')
  );
}

const { url: initialUrl, key: initialKey } = getSupabaseCredentials();

// Dummy fallback client if credentials are not configured yet, to prevent app crashing
const fallbackUrl = 'https://placeholder-sriymb.supabase.co';
const fallbackKey = 'placeholder-key-for-initial-render-1234567890';

export const supabase = createClient(
  initialUrl || fallbackUrl,
  initialKey || fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Save credentials dynamically from Settings UI
 */
export function saveRuntimeCredentials(url, key) {
  if (url) localStorage.setItem('sri_ymb_supabase_url', url.trim());
  if (key) localStorage.setItem('sri_ymb_supabase_anon_key', key.trim());
  window.location.reload();
}

/**
 * Test connectivity to Supabase
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials are not configured or still have placeholder values.',
    };
  }

  try {
    const { error } = await supabase.from('cold_storages').select('id').limit(1);
    if (error) {
      // If error is about RLS or tables, check details
      return {
        connected: false,
        message: `Database error: ${error.message} (Code: ${error.code || 'UNKNOWN'})`,
        details: error,
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL database!',
    };
  } catch (err) {
    return {
      connected: false,
      message: err.message || 'Network error connecting to Supabase',
    };
  }
}
