import { supabase } from '../supabaseClient';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

function healBookRecord(b: any): any {
  if (!b) return b;
  const healed = { ...b };
  
  // 1. Heal Title if empty or null
  if (!healed.title || String(healed.title).trim() === '') {
    const descMatch = String(healed.description || '').match(/หนังสือ\s+["“'‘]([^"”'’]+)["”'’]/);
    if (descMatch) {
      healed.title = descMatch[1].trim();
    } else if (healed.keywords) {
      healed.title = String(healed.keywords).split(',')[0].trim();
    } else {
      healed.title = `หนังสือทะเบียนเลขที่ ${healed.accession_no || healed.barcode || '-'}`;
    }
  }

  // 2. Heal Author if empty, null or 'ไม่ระบุผู้แต่ง'
  if (!healed.author || String(healed.author).trim() === '' || healed.author === 'ไม่ระบุผู้แต่ง') {
    const descMatch = String(healed.description || '').match(/โดย\s+([^.]+?)\s+สำนักพิมพ์/);
    if (descMatch) {
      healed.author = descMatch[1].trim();
    } else if (healed.keywords) {
      const kw = String(healed.keywords).split(',');
      if (kw.length > 1) {
        healed.author = kw[1].trim();
      }
    }
    if (!healed.author || String(healed.author).trim() === '') {
      healed.author = 'ไม่ระบุผู้แต่ง';
    }
  }

  // 3. Heal Publisher if empty, null or 'ไม่ระบุสำนักพิมพ์'
  if (!healed.publisher || String(healed.publisher).trim() === '' || healed.publisher === 'ไม่ระบุสำนักพิมพ์') {
    const descMatch = String(healed.description || '').match(/สำนักพิมพ์\s+([^.]+?)$/);
    const kwMatch = String(healed.keywords || '').match(/สำนักพิมพ์\s+([^,]+)/);
    if (descMatch) {
      healed.publisher = descMatch[1].trim();
    } else if (kwMatch) {
      healed.publisher = kwMatch[1].trim();
    } else {
      healed.publisher = 'ไม่ระบุสำนักพิมพ์';
    }
  }

  // 4. Heal Call Number if empty or null
  if (!healed.call_number || String(healed.call_number).trim() === '') {
    const ddcVal = healed.ddc || '000';
    const kw = String(healed.keywords || '').toLowerCase();
    const cutMatch = kw.match(/หมวด\s*(\d+)/) || kw.match(/หมวด\s*([ก-ฮ])/);
    healed.call_number = `${ddcVal} ${cutMatch ? cutMatch[0] : ''}`.trim();
  }

  // 5. Heal Category if empty or null
  if (!healed.category || String(healed.category).trim() === '') {
    const kw = String(healed.keywords || '').split(',');
    if (kw.length > 4) {
      healed.category = kw[4].trim();
    } else {
      healed.category = 'ทั่วไป';
    }
  }

  return healed;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const qSearch = req.query.q ? String(req.query.q).toLowerCase() : '';
      const qCategory = req.query.category ? String(req.query.category) : '';
      const qPublisher = req.query.publisher ? String(req.query.publisher) : '';
      const qSort = req.query.sort ? String(req.query.sort) : 'title';

      const cachePath = path.join(process.cwd(), 'books_cache_v2.json');
      let cachedData: any = null;
      try {
        if (fs.existsSync(cachePath)) {
          const raw = fs.readFileSync(cachePath, 'utf8');
          cachedData = JSON.parse(raw);
        }
      } catch (e) {
        console.error('Error loading books_cache_v2.json in serverless:', e);
      }

      // Query Supabase for real-time / newly added books
      let supaBooks: any[] = [];
      try {
        const { data, error } = await supabase.from('books').select('*');
        if (!error && data) {
          supaBooks = data;
        }
      } catch (err) {
        console.warn('Supabase query error in books handler:', err);
      }

      // Query customizations
      let customData: any[] = [];
      try {
        const { data, error } = await supabase.from('book_customizations').select('*');
        if (!error && data) {
          customData = data;
        }
      } catch (err) {
        console.warn('Supabase customization query error in books handler:', err);
      }

      // Map and merge books
      const mergedBooksMap = new Map<string, any>();

      // 1. Base books from local cache
      if (cachedData && Array.isArray(cachedData.books)) {
        cachedData.books.forEach((b: any) => {
          mergedBooksMap.set(b.id, { ...b, source: b.source || 'Google Sheet (MARC 21)' });
        });
      }

      // 2. Merge from Supabase books (new books and edits)
      if (supaBooks && supaBooks.length > 0) {
        supaBooks.forEach((sb: any) => {
          const cb = mergedBooksMap.get(sb.id);
          const healedSb = healBookRecord(sb);
          if (!cb) {
            mergedBooksMap.set(healedSb.id, {
              ...healedSb,
              source: healedSb.source || 'ฐานข้อมูล Supabase'
            });
          } else {
            // Keep newer one based on updated_at
            const sbTime = sb.updated_at ? new Date(sb.updated_at).getTime() : 0;
            const cbTime = cb.updated_at ? new Date(cb.updated_at).getTime() : 0;
            if (sbTime >= cbTime) {
              mergedBooksMap.set(healedSb.id, {
                ...cb,
                ...healedSb,
                source: healedSb.source || cb.source || 'ฐานข้อมูล Supabase'
              });
            }
          }
        });
      }

      // 3. Merge custom edits
      if (customData && customData.length > 0) {
        customData.forEach((custom: any) => {
          if (mergedBooksMap.has(custom.id)) {
            const merged = { ...mergedBooksMap.get(custom.id) };
            for (const [key, val] of Object.entries(custom)) {
              if (val !== null && val !== undefined && val !== '') {
                merged[key] = val;
              }
            }
            mergedBooksMap.set(custom.id, merged);
          }
        });
      }

      let books = Array.from(mergedBooksMap.values()).map(b => {
        const healed = healBookRecord(b);
        return {
          ...healed,
          accession_no: healed.accession_no || healed.barcode || ''
        };
      });

      // Filter by category
      if (qCategory) {
        books = books.filter(b => b.category === qCategory);
      }

      // Filter by publisher
      if (qPublisher) {
        books = books.filter(b => b.publisher === qPublisher);
      }

      // Filter by search query
      if (qSearch) {
        books = books.filter(b => 
          (b.title && b.title.toLowerCase().includes(qSearch)) || 
          (b.subtitle && b.subtitle.toLowerCase().includes(qSearch)) ||
          (b.author && b.author.toLowerCase().includes(qSearch)) || 
          (b.isbn && b.isbn.toLowerCase().includes(qSearch)) || 
          (b.barcode && b.barcode.toLowerCase().includes(qSearch)) ||
          (b.accession_no && String(b.accession_no).toLowerCase().includes(qSearch)) ||
          (b.publisher && b.publisher.toLowerCase().includes(qSearch)) ||
          (b.category && b.category.toLowerCase().includes(qSearch)) ||
          (b.subject && b.subject.toLowerCase().includes(qSearch)) ||
          (b.description && b.description.toLowerCase().includes(qSearch)) ||
          (b.keywords && b.keywords.toLowerCase().includes(qSearch)) ||
          (b.call_number && b.call_number.toLowerCase().includes(qSearch))
        );
      }

      // Accession Number Natural Sorting Helper
      const parseAccession = (val: any): { num: number; raw: string } => {
        if (val === undefined || val === null) return { num: Infinity, raw: '' };
        const s = String(val).trim();
        const match = s.match(/\d+/);
        const num = match ? parseInt(match[0], 10) : Infinity;
        return { num, raw: s };
      };

      // Sort books
      if (qSort === 'accession' || qSort === 'accession_asc') {
        books.sort((a, b) => {
          const accA = a.accession_no || a.barcode || '';
          const accB = b.accession_no || b.barcode || '';
          const pA = parseAccession(accA);
          const pB = parseAccession(accB);
          if (pA.num !== pB.num && pA.num !== Infinity && pB.num !== Infinity) {
            return pA.num - pB.num;
          }
          return String(accA).localeCompare(String(accB), undefined, { numeric: true });
        });
      } else if (qSort === 'accession_desc') {
        books.sort((a, b) => {
          const accA = a.accession_no || a.barcode || '';
          const accB = b.accession_no || b.barcode || '';
          const pA = parseAccession(accA);
          const pB = parseAccession(accB);
          if (pA.num !== pB.num && pA.num !== Infinity && pB.num !== Infinity) {
            return pB.num - pA.num;
          }
          return String(accB).localeCompare(String(accA), undefined, { numeric: true });
        });
      } else if (qSort === 'title') {
        books.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'th'));
      } else if (qSort === 'year') {
        books.sort((a, b) => (b.publication_year || '').localeCompare(a.publication_year || ''));
      } else if (qSort === 'author') {
        books.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'th'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const limitNum = parseInt(req.query.limit as string) || 0;
      const total = books.length;

      if (limitNum > 0) {
        const startIndex = (page - 1) * limitNum;
        const paginatedBooks = books.slice(startIndex, startIndex + limitNum);
        return res.status(200).json({
          success: true,
          books: paginatedBooks,
          total,
          page,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        });
      } else {
        return res.status(200).json({ success: true, books, total });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const bookData = req.body;
      if (!bookData.title || !bookData.author || !bookData.isbn) {
        return res.status(400).json({ success: false, error: 'Title, Author and ISBN are required.' });
      }

      const cleanIsbn = String(bookData.isbn || '').replace(/[^a-zA-Z0-9]/g, '');
      const bookId = bookData.id || `book_${cleanIsbn || Date.now()}`;

      const data = {
        ...bookData,
        id: bookId,
        created_at: bookData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to Supabase (Source of Truth)
      const { error: bErr } = await supabase.from('books').upsert(data, { onConflict: 'id' });
      if (bErr) {
        throw new Error(bErr.message);
      }

      // Save to Book Customizations to ensure it survives any spreadsheet syncs
      await supabase.from('book_customizations').upsert({
        id: bookId,
        cover_image: data.cover_image,
        illustration: data.illustration || data.cover_image,
        cover_source: data.cover_source || 'manual',
        status: data.status,
        title: data.title,
        author: data.author,
        publisher: data.publisher,
        category: data.category,
        call_number: data.call_number,
        updated_at: data.updated_at
      }, { onConflict: 'id' });

      return res.status(201).json({ success: true, id: bookId, book: data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
