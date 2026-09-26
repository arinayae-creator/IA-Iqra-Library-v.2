import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const rawUrl = (process.env.VITE_SUPABASE_URL || '').trim();
const supabaseUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
  ? rawUrl
  : 'https://prfmtippvgarzelaiaol.supabase.co';

const rawKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const supabaseKey = (rawKey && !rawKey.startsWith('http'))
  ? rawKey
  : 'sb_publishable_hMux2AAB-kBd2zRyJdNUNg_Hiqzba0r';

export const supabase = createClient(supabaseUrl, supabaseKey);
