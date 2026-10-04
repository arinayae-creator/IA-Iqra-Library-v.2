import { supabase } from '../../supabaseClient';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

async function saveBatchBooksToSupabase(books: any[]) {
  if (!books || books.length === 0) return;
  const CHUNK_SIZE = 150;
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
      source: b.source || 'Imported Excel/CSV',
      updated_at: b.updated_at || new Date().toISOString()
    }));
    const { error } = await supabase.from('books').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.warn(`[Supabase Batch] Chunk upsert error:`, error.message);
    }
  }
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, error: 'Books array is required.' });
    }

    const results = {
      imported: 0,
      failed: 0,
      items: [] as any[]
    };

    const batchBooks: any[] = [];

    for (let i = 0; i < books.length; i++) {
      const b = books[i];
      if (!b.title || !b.isbn) {
        results.failed++;
        continue;
      }

      const cleanIsbn = String(b.isbn || '').replace(/[^a-zA-Z0-9]/g, '');
      const bookId = b.id || `book_${cleanIsbn || `${Date.now()}_${i}`}`;

      const data = {
        id: bookId,
        title: String(b.title || '').trim(),
        subtitle: String(b.subtitle || '').trim(),
        author: String(b.author || 'ไม่ระบุผู้แต่ง').trim(),
        co_authors: String(b.co_authors || '').trim(),
        isbn: String(b.isbn || '').trim(),
        publisher: String(b.publisher || 'ไม่ระบุสำนักพิมพ์').trim(),
        publication_place: String(b.publication_place || 'กรุงเทพฯ').trim(),
        publication_year: String(b.publication_year || new Date().getFullYear()).trim(),
        edition: String(b.edition || 'พิมพ์ครั้งที่ 1').trim(),
        pages: String(b.pages || '200').trim(),
        language: String(b.language || 'ไทย').trim(),
        category: String(b.category || 'ทั่วไป').trim(),
        subject: String(b.subject || '').trim(),
        keywords: String(b.keywords || '').trim(),
        call_number: String(b.call_number || '000').trim(),
        ddc: String(b.ddc || '').trim(),
        barcode: String(b.barcode || b.accession_no || `B${Math.random().toString().substring(2, 9)}`).trim(),
        accession_no: String(b.accession_no || b.barcode || '').trim(),
        cover_image: String(b.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600').trim(),
        description: String(b.description || 'นำเข้าจากระบบพอร์ตไฟล์').trim(),
        status: b.status === 'ถูกยืมแล้ว' || b.status === 'ปรับปรุง' ? b.status : 'พร้อมให้บริการ',
        price: String(b.price || '').trim(),
        series: String(b.series || '').trim(),
        translator: String(b.translator || '').trim(),
        illustration: String(b.illustration || '').trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      batchBooks.push(data);
      results.imported++;
      results.items.push({ id: bookId, title: data.title });
    }

    // Save batch books directly in chunks to Supabase
    await saveBatchBooksToSupabase(batchBooks);

    // Upsert categories in Supabase
    try {
      const categoriesSet = new Set<string>();
      batchBooks.forEach(b => {
        if (b.category) categoriesSet.add(b.category);
      });
      if (categoriesSet.size > 0) {
        const catArray = Array.from(categoriesSet).map((name, idx) => ({
          id: `cat_batch_${idx + 1}_${Date.now()}`,
          name,
          description: `หมวดหมู่: ${name}`
        }));
        await supabase.from('categories').upsert(catArray, { onConflict: 'name' });
      }
    } catch {}

    return res.status(200).json({ success: true, ...results });
  } catch (err: any) {
    console.error('[Batch API Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
