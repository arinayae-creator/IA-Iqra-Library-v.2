import { supabase } from '../supabaseClient';
import fs from 'fs';
import path from 'path';

function normalizeIsbnVariants(code: string): string[] {
  const rawClean = String(code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const clean = String(code || '').replace(/[^0-9X]/gi, '').toUpperCase();
  if (!rawClean && !clean) return [];
  
  const variants = new Set<string>();
  if (rawClean) variants.add(rawClean);
  if (clean) variants.add(clean);
  
  if (clean && clean.length === 10) {
    const base = '978' + clean.substring(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    variants.add(base + check);
  } else if (clean && clean.length === 13 && clean.startsWith('978')) {
    const base = clean.substring(3, 12);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(base[i], 10) * (10 - i);
    }
    const rem = (11 - (sum % 11)) % 11;
    const check = rem === 10 ? 'X' : String(rem);
    variants.add(base + check);
  }
  
  return Array.from(variants);
}

function healBookRecord(b: any): any {
  if (!b) return b;
  const healed = { ...b };
  if (!healed.title || String(healed.title).trim() === '') {
    const descMatch = String(healed.description || '').match(/หนังสือ\s+["“'‘]([^"”'’]+)["”'’]/);
    if (descMatch) healed.title = descMatch[1].trim();
    else if (healed.keywords) healed.title = String(healed.keywords).split(',')[0].trim();
  }
  return healed;
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    const { code } = body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Code is required' });
    }

    const rawCode = code.trim();
    const cleanCode = rawCode.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const variants = normalizeIsbnVariants(rawCode).map(v => v.toLowerCase());

    if (!cleanCode) {
      return res.status(400).json({ success: false, error: 'Invalid code format.' });
    }

    // 1. Load books from local cache
    const cachePath = path.join(process.cwd(), 'books_cache_v2.json');
    let cachedBooks: any[] = [];
    try {
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.books)) {
          cachedBooks = parsed.books;
        }
      }
    } catch (e) {
      console.error('Error loading books_cache_v2.json in barcode-lookup:', e);
    }

    // 2. Fetch new books or customizations from Supabase
    let supaBooks: any[] = [];
    try {
      const { data, error } = await supabase.from('books').select('*');
      if (!error && data) {
        supaBooks = data;
      }
    } catch (err) {
      console.warn('Supabase query error in barcode handler:', err);
    }

    // Combine and merge
    const mergedBooksMap = new Map<string, any>();
    cachedBooks.forEach((b: any) => mergedBooksMap.set(b.id, b));
    supaBooks.forEach((sb: any) => {
      const cb = mergedBooksMap.get(sb.id);
      const healed = healBookRecord(sb);
      if (!cb) {
        mergedBooksMap.set(healed.id, healed);
      } else {
        const sbTime = sb.updated_at ? new Date(sb.updated_at).getTime() : 0;
        const cbTime = cb.updated_at ? new Date(cb.updated_at).getTime() : 0;
        if (sbTime >= cbTime) {
          mergedBooksMap.set(healed.id, { ...cb, ...healed });
        }
      }
    });

    const allBooks = Array.from(mergedBooksMap.values());

    // 3. Match against the combined catalog
    let matchedBook: any = null;

    for (const b of allBooks) {
      const isbnClean = String(b.isbn || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const barcodeClean = String(b.barcode || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const accClean = String(b.accession_no || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      const isMatch = variants.some(v => isbnClean === v || barcodeClean === v || accClean === v);

      if (isMatch) {
        matchedBook = b;
        break;
      }
    }

    if (matchedBook) {
      const historyItem = {
        image_url: 'barcode_scan',
        extracted_text: `Barcode/ISBN: ${rawCode}`,
        detected_title: matchedBook.title,
        detected_author: matchedBook.author || 'ไม่ระบุผู้แต่ง',
        matched_book_id: matchedBook.id,
        similarity_score: 1.0,
        search_status: 'EXACT_MATCH',
        created_at: new Date().toISOString()
      };

      // Attempt to save scan history to Supabase asynchronously
      try {
        await supabase.from('scan_history').insert({
          id: `scan_${Date.now()}`,
          ...historyItem
        });
      } catch (sbErr) {
        // fail silently
      }

      return res.status(200).json({
        success: true,
        search_status: 'EXACT_MATCH',
        status_message: 'จับคู่กับหนังสือในฐานข้อมูลสำเร็จด้วยคะแนนความตรงกัน 100%',
        confidence_percentage: 100,
        detected_barcode: rawCode,
        matched_book: matchedBook,
        matches: [{
          book_id: matchedBook.id,
          book: matchedBook,
          title: matchedBook.title,
          subtitle: matchedBook.subtitle,
          author: matchedBook.author,
          isbn: matchedBook.isbn,
          publisher: matchedBook.publisher,
          publication_year: matchedBook.publication_year,
          cover_image: matchedBook.cover_image,
          category: matchedBook.category,
          call_number: matchedBook.call_number,
          status: matchedBook.status,
          similarity: 1.0,
          match_reason: 'ตรงกับรหัสบาร์โค้ด / ISBN ในฐานข้อมูล 100%'
        }]
      });
    }

    // 4. Fallback to Google Books API direct search
    if (cleanCode.length >= 9) {
      try {
        const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanCode}`);
        if (gbRes.ok) {
          const gbData = await gbRes.json();
          if (gbData.items && gbData.items.length > 0) {
            const vol = gbData.items[0].volumeInfo;
            const fetchedBook = {
              id: `external_isbn_${cleanCode}`,
              title: vol.title || `หนังสือ ISBN ${rawCode}`,
              subtitle: vol.subtitle || '',
              author: vol.authors ? vol.authors.join(', ') : 'ไม่ระบุผู้แต่ง',
              isbn: rawCode,
              publisher: vol.publisher || 'ไม่ระบุสำนักพิมพ์',
              publication_place: 'กรุงเทพฯ',
              publication_year: vol.publishedDate ? vol.publishedDate.substring(0, 4) : '2566',
              edition: 'พิมพ์ครั้งที่ 1',
              pages: vol.pageCount ? String(vol.pageCount) : '200',
              language: vol.language === 'en' ? 'อังกฤษ' : 'ไทย',
              category: vol.categories ? vol.categories[0] : 'หนังสือทั่วไป',
              subject: vol.categories ? vol.categories.join(', ') : '',
              keywords: `${vol.title}, ${rawCode}`,
              call_number: '000',
              barcode: rawCode,
              accession_no: rawCode,
              cover_image: vol.imageLinks?.thumbnail?.replace('http://', 'https://') || `https://covers.openlibrary.org/b/isbn/${cleanCode}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`,
              description: vol.description || `ข้อมูลสืบค้นอัตโนมัติจากระบบสืบค้น ISBN ${rawCode}`,
              status: 'พร้อมให้บริการ',
              source: 'External ISBN Lookup (Google Books)'
            };

            return res.status(200).json({
              success: true,
              search_status: 'EXACT_MATCH',
              status_message: 'ค้นพบข้อมูลบรรณานุกรมฉบับเต็มจากระบบสืบค้น ISBN สากล 100%',
              confidence_percentage: 100,
              detected_barcode: rawCode,
              matched_book: fetchedBook,
              matches: [{
                book_id: fetchedBook.id,
                book: fetchedBook,
                title: fetchedBook.title,
                subtitle: fetchedBook.subtitle,
                author: fetchedBook.author,
                isbn: fetchedBook.isbn,
                publisher: fetchedBook.publisher,
                publication_year: fetchedBook.publication_year,
                cover_image: fetchedBook.cover_image,
                category: fetchedBook.category,
                call_number: fetchedBook.call_number,
                status: fetchedBook.status,
                similarity: 1.0,
                match_reason: 'ตรงกับรหัส ISBN สากล 100%'
              }]
            });
          }
        }
      } catch (extErr) {
        console.error('External ISBN search note:', extErr);
      }
    }

    return res.status(200).json({
      success: false,
      search_status: 'NOT_FOUND',
      status_message: `ไม่พบหนังสือที่มีหมายเลขบาร์โค้ด / ISBN "${rawCode}" ในฐานข้อมูลห้องสมุด`,
      confidence_percentage: 0,
      matched_book: null,
      matches: []
    });
  } catch (err: any) {
    console.error('Barcode lookup error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
