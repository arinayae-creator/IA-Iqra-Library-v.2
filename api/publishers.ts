import { supabase } from '../supabaseClient';
import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const cachePath = path.join(process.cwd(), 'books_cache_v2.json');
    let cachedData: any = null;
    try {
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf8');
        cachedData = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading books_cache_v2.json in publishers serverless:', e);
    }

    // Query Supabase to combine real-time entries
    let supaBooks: any[] = [];
    try {
      const { data, error } = await supabase.from('books').select('publisher');
      if (!error && data) {
        supaBooks = data;
      }
    } catch (err) {
      console.warn('Supabase query error in publishers handler:', err);
    }

    const pubSet = new Set<string>();

    // 1. Add publishers from local cache
    if (cachedData && Array.isArray(cachedData.books)) {
      cachedData.books.forEach((b: any) => {
        const p = b.publisher;
        if (p && typeof p === 'string' && p.trim() && p.trim() !== 'ไม่ระบุสำนักพิมพ์' && p.trim() !== '-') {
          pubSet.add(p.trim());
        }
      });
    }

    // 2. Add publishers from Supabase
    if (supaBooks && supaBooks.length > 0) {
      supaBooks.forEach((sb: any) => {
        const p = sb.publisher;
        if (p && typeof p === 'string' && p.trim() && p.trim() !== 'ไม่ระบุสำนักพิมพ์' && p.trim() !== '-') {
          pubSet.add(p.trim());
        }
      });
    }

    const publishers = Array.from(pubSet).sort((a, b) => a.localeCompare(b, 'th'));
    return res.status(200).json({ success: true, publishers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
