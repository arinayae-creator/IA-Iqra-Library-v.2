import { supabase } from '../../supabaseClient';
import * as XLSX from 'xlsx';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const DEFAULT_GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1IXKv6ZCq5AdUxZcKYsUz1IY3uH9qBxnMTTuYgeT7RRg/export?format=csv&gid=889338917';

async function saveBatchBooksToSupabase(books: any[]) {
  if (!books || books.length === 0) return;
  const CHUNK_SIZE = 200;
  for (let i = 0; i < books.length; i += CHUNK_SIZE) {
    const chunk = books.slice(i, i + CHUNK_SIZE).map(b => ({
      id: b.id,
      title: b.title || '',
      subtitle: b.subtitle || null,
      author: b.author || null,
      co_authors: b.co_authors || null,
      isbn: b.isbn || null,
      barcode: b.barcode || null,
      accession_no: b.accession_no || null,
      publisher: b.publisher || null,
      publication_place: b.publication_place || null,
      publication_year: b.publication_year || null,
      edition: b.edition || null,
      pages: b.pages || null,
      language: b.language || 'ไทย',
      category: b.category || null,
      subject: b.subject || null,
      keywords: b.keywords || null,
      call_number: b.call_number || null,
      ddc: b.ddc || null,
      price: b.price || null,
      series: b.series || null,
      translator: b.translator || null,
      illustration: b.illustration || null,
      cover_image: b.cover_image || null,
      cover_source: b.cover_source || null,
      description: b.description || null,
      status: b.status || 'พร้อมให้บริการ',
      source: b.source || 'Google Sheet (MARC 21)',
      updated_at: b.updated_at || new Date().toISOString()
    }));
    const { error } = await supabase.from('books').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.warn(`[Supabase Sync] Chunk upsert error:`, error.message);
    }
  }
}

export default async function handler(req: any, res: any) {
  // CORS Headers
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
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const sheetUrl = req.body?.url || DEFAULT_GOOGLE_SHEET_URL;

    const response = await fetch(sheetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, error: `Failed to fetch Google Sheet: ${response.status} ${response.statusText}` });
    }

    const csvText = await response.text();
    const workbook = XLSX.read(csvText, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length < 2) {
      return res.status(400).json({ success: false, error: 'Google Sheet does not contain enough data.' });
    }

    const categoriesSet = new Set<string>();
    let booksToSave: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 7) continue;

      const rawTitle = String(r[6] || '').trim();
      if (!rawTitle) continue;

      let title = rawTitle;
      let subtitle = String(r[7] || '').trim();

      if (rawTitle.includes(' = ')) {
        const parts = rawTitle.split(' = ');
        title = parts[0].trim();
        if (!subtitle && parts[1]) {
          subtitle = parts[1].split(' / ')[0].trim();
        }
      }
      if (title.includes(' / ')) {
        title = title.split(' / ')[0].trim();
      }
      title = title.replace(/[\/:]\s*$/, '').trim();

      const author = String(r[4] || r[5] || r[8] || 'ไม่ระบุผู้แต่ง').replace(/[\/]\s*$/, '').trim();
      const rawAccession = String(r[2] || '').trim();
      const accessionNo = rawAccession || String(i);
      const barcode = rawAccession || `B${String(i).padStart(7, '0')}`;
      const isbn = String(r[3] || '').trim() || barcode;
      const ddc = String(r[9] || '').trim();
      const callSub = String(r[10] || '').trim();
      const callNumber = (ddc && callSub) ? `${ddc} ${callSub}` : (ddc || callSub || '000');
      const pubPlace = String(r[11] || 'กรุงเทพฯ').trim();
      const publisher = String(r[12] || 'ไม่ระบุสำนักพิมพ์').trim();
      const pubYear = String(r[13] || '').trim() || '2560';
      const pages = String(r[14] || '200').trim();
      const subject = String(r[16] || '').trim();
      const shelfCategory = String(r[26] || '').trim();
      const category = shelfCategory || subject || 'ทั่วไป';
      categoriesSet.add(category);

      const desc = String(r[18] || '').trim() || `หนังสือ "${title}" โดย ${author} สำนักพิมพ์ ${publisher}`;
      const edition = String(r[19] || 'พิมพ์ครั้งที่ 1').trim();
      const price = String(r[20] || '').trim();
      const series = String(r[21] || '').trim();
      const translator = String(r[22] || '').trim();
      const rawStatus = String(r[27] || '').trim();
      const status = rawStatus === 'ถูกยืม' || rawStatus === 'ถูกยืมแล้ว' ? 'ถูกยืมแล้ว' : 'พร้อมให้บริการ';

      const bookId = rawAccession ? `book_reg_${rawAccession}` : (barcode ? `book_reg_${barcode}` : `book_${isbn.replace(/[^a-zA-Z0-9]/g, '')}`);

      const rawIllustration = String(r[15] || '').trim();
      const cleanIsbn = isbn.replace(/[^a-zA-Z0-9]/g, '');
      let coverImage = (cleanIsbn.length >= 10)
        ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`
        : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';

      if (rawIllustration && (rawIllustration.startsWith('https://') || (rawIllustration.startsWith('http://') && !rawIllustration.includes('localhost')))) {
        coverImage = rawIllustration;
      }

      booksToSave.push({
        id: bookId,
        title,
        subtitle,
        author,
        co_authors: translator ? `ผู้แปล: ${translator}` : '',
        isbn,
        barcode,
        accession_no: accessionNo,
        publisher,
        publication_place: pubPlace,
        publication_year: pubYear,
        edition,
        pages,
        language: 'ไทย',
        category,
        subject,
        keywords: `${title}, ${author}, ${category}, ${publisher}, ${subject}`,
        call_number: callNumber,
        ddc,
        price,
        series,
        translator,
        illustration: rawIllustration,
        cover_image: coverImage,
        description: desc,
        status,
        source: 'Google Sheet (MARC 21)',
        updated_at: new Date().toISOString()
      });
    }

    // Merge manual customization overrides from Supabase
    try {
      const { data: customData } = await supabase.from('book_customizations').select('*');
      if (customData && customData.length > 0) {
        const customMap = new Map();
        customData.forEach(item => customMap.set(item.id, item));
        booksToSave = booksToSave.map(b => {
          if (customMap.has(b.id)) {
            return {
              ...b,
              ...customMap.get(b.id)
            };
          }
          return b;
        });
      }
    } catch {}

    // Save to Supabase (Source of Truth)
    await saveBatchBooksToSupabase(booksToSave);

    // Save Sync Info to Supabase
    const syncInfo = {
      id: 'current',
      url: sheetUrl,
      total_books: booksToSave.length,
      total_categories: categoriesSet.size,
      last_sync: new Date().toISOString(),
      status: 'success'
    };
    await supabase.from('sheet_sync_info').upsert(syncInfo);

    // Upsert categories
    try {
      const catArray = Array.from(categoriesSet).map((name, idx) => ({
        id: `cat_sheet_${idx + 1}`,
        name,
        description: `หมวดหมู่/สถานที่จัดเก็บ: ${name}`
      }));
      await supabase.from('categories').upsert(catArray, { onConflict: 'name' });
    } catch {}

    return res.status(200).json({
      success: true,
      url: sheetUrl,
      totalBooks: booksToSave.length,
      totalCategories: categoriesSet.size,
      lastSync: syncInfo.last_sync,
      status: 'success',
      message: `ซิงค์ข้อมูลสำเร็จจำนวน ${booksToSave.length} เล่ม และ ${categoriesSet.size} หมวดหมู่ ลงฐานข้อมูล Supabase เรียบร้อย`
    });
  } catch (err: any) {
    console.error('Google Sheet Sync Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
