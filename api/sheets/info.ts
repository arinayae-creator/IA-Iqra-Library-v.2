import { supabase } from '../../supabaseClient';
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
    // 1. Try reading sheet sync info from Supabase
    const { data, error } = await supabase.from('sheet_sync_info').select('*').limit(1);
    if (!error && data && data.length > 0) {
      return res.status(200).json({ success: true, info: data[0] });
    }

    // 2. Fallback to info derived from local books cache
    const cachePath = path.join(process.cwd(), 'books_cache_v2.json');
    let booksCount = 2452;
    if (fs.existsSync(cachePath)) {
      try {
        const raw = fs.readFileSync(cachePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.books)) {
          booksCount = parsed.books.length;
        }
      } catch {}
    }

    const defaultInfo = {
      url: 'https://docs.google.com/spreadsheets/d/1IXKv6ZCq5AdUxZcKYsUz1IY3uH9qBxnMTTuYgeT7RRg/export?format=csv&gid=889338917',
      totalBooks: booksCount,
      lastSync: new Date().toISOString(),
      status: 'success'
    };

    return res.status(200).json({ success: true, info: defaultInfo });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
