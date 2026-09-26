import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key] || '';
    }
  } catch {}
  return '';
};

const rawUrl = getEnv('VITE_SUPABASE_URL').trim();
const supabaseUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
  ? rawUrl
  : 'https://prfmtippvgarzelaiaol.supabase.co';

const rawKey = getEnv('VITE_SUPABASE_ANON_KEY').trim();
const supabaseKey = (rawKey && !rawKey.startsWith('http'))
  ? rawKey
  : 'sb_publishable_hMux2AAB-kBd2zRyJdNUNg_Hiqzba0r';

export const supabase = createClient(supabaseUrl, supabaseKey);

