import { supabase } from '../supabaseClient';
import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const cachePath = path.join(process.cwd(), 'books_cache_v2.json');
      let cachedData: any = null;
      try {
        if (fs.existsSync(cachePath)) {
          const raw = fs.readFileSync(cachePath, 'utf8');
          cachedData = JSON.parse(raw);
        }
      } catch (e) {
        console.error('Error loading books_cache_v2.json in categories:', e);
      }

      // Query Supabase categories
      let supaCategories: any[] = [];
      try {
        const { data, error } = await supabase.from('categories').select('*');
        if (!error && data) {
          supaCategories = data;
        }
      } catch (err) {
        console.warn('Supabase query error in categories handler:', err);
      }

      const mergedCategoriesMap = new Map<string, any>();

      // Default fallback categories
      const fallbackCategories = [
        { id: "cat_1", name: "วรรณกรรมเยาวชน", description: "หนังสือและเรื่องสั้นสำหรับเด็กและเยาวชน" },
        { id: "cat_2", name: "นวนิยายแฟนตาซี", description: "นิยายจินตนาการ เวทมนตร์ คาถา" },
        { id: "cat_3", name: "พัฒนาตนเอง", description: "เทคนิคการคิด การจัดระเบียบชีวิต" }
      ];
      fallbackCategories.forEach(c => mergedCategoriesMap.set(c.name, c));

      // 1. Add categories from local cache
      if (cachedData && Array.isArray(cachedData.categories)) {
        cachedData.categories.forEach((c: any) => {
          mergedCategoriesMap.set(c.name, c);
        });
      }

      // 2. Add categories from Supabase
      if (supaCategories && supaCategories.length > 0) {
        supaCategories.forEach((c: any) => {
          mergedCategoriesMap.set(c.name, c);
        });
      }

      const categories = Array.from(mergedCategoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'th'));
      return res.status(200).json({ success: true, categories });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }
      const catId = `cat_${Date.now()}`;
      const data = { id: catId, name, description };

      // Save to Supabase (Source of Truth)
      const { error } = await supabase.from('categories').upsert(data, { onConflict: 'name' });
      if (error) {
        throw new Error(error.message);
      }

      return res.status(201).json({ success: true, id: catId, category: data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
