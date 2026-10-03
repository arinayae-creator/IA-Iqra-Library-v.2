import { supabase } from '../../supabaseClient';
import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Book ID is required' });
  }

  if (req.method === 'GET') {
    try {
      // 1. Try fetching from Supabase first
      const { data: supaBook, error: supaErr } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!supaErr && supaBook) {
        return res.status(200).json({ success: true, book: supaBook });
      }

      // 2. Fallback to reading from local JSON cache
      const cachePath = path.join(process.cwd(), 'books_cache_v2.json');
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.books)) {
          const matched = parsed.books.find((b: any) => b.id === id);
          if (matched) {
            return res.status(200).json({ success: true, book: matched });
          }
        }
      }

      return res.status(404).json({ success: false, error: 'Book not found' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const bookData = req.body;
      const updated_at = new Date().toISOString();

      const supaUpdatePayload: any = {
        updated_at,
        ...bookData
      };

      // Perform update in Supabase 'books'
      const { error: bErr } = await supabase
        .from('books')
        .update(supaUpdatePayload)
        .eq('id', id);

      if (bErr) {
        throw new Error(bErr.message);
      }

      // Also persist to book_customizations table to ensure it survives any sheet syncs
      await supabase.from('book_customizations').upsert({
        id,
        cover_image: bookData.cover_image,
        illustration: bookData.illustration || bookData.cover_image,
        cover_source: bookData.cover_source || 'manual',
        status: bookData.status,
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        category: bookData.category,
        call_number: bookData.call_number,
        updated_at
      }, { onConflict: 'id' });

      return res.status(200).json({ success: true, id, book: { id, ...bookData, updated_at } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Delete from Supabase 'books' & 'book_customizations'
      await supabase.from('books').delete().eq('id', id);
      await supabase.from('book_customizations').delete().eq('id', id);

      return res.status(200).json({ success: true, id, message: 'Book deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
