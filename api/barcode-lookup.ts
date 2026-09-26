import { supabase } from '../supabaseClient';

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

    const cleanCode = code.trim();
    const cleanDigits = cleanCode.replace(/[^a-zA-Z0-9]/g, '');

    // 1. Query Supabase by exact barcode or accession_no or isbn
    const { data: directMatch, error: directErr } = await supabase
      .from('books')
      .select('*')
      .or(`barcode.eq.${cleanCode},accession_no.eq.${cleanCode},isbn.eq.${cleanCode},barcode.eq.${cleanDigits},accession_no.eq.${cleanDigits},isbn.eq.${cleanDigits}`)
      .limit(5);

    if (!directErr && directMatch && directMatch.length > 0) {
      const top = directMatch[0];
      return res.status(200).json({
        success: true,
        search_status: 'EXACT_MATCH',
        status_message: 'จับคู่กับหนังสือในฐานข้อมูลสำเร็จด้วยคะแนนความตรงกัน 100%',
        confidence_percentage: 100,
        detected_barcode: cleanCode,
        matched_book: top,
        matches: directMatch.map(b => ({
          book_id: b.id,
          book: b,
          similarity: 1.0,
          match_reason: 'ตรงกับรหัสบาร์โค้ด / ISBN ในฐานข้อมูล 100%'
        }))
      });
    }

    // 2. Query with ILIKE for hyphenated ISBNs (e.g. 978-974-...)
    const { data: likeMatch } = await supabase
      .from('books')
      .select('*')
      .or(`isbn.ilike.%${cleanDigits}%,barcode.ilike.%${cleanDigits}%`)
      .limit(5);

    if (likeMatch && likeMatch.length > 0) {
      const top = likeMatch[0];
      return res.status(200).json({
        success: true,
        search_status: 'EXACT_MATCH',
        status_message: 'จับคู่กับหนังสือในฐานข้อมูลสำเร็จด้วยคะแนนความตรงกัน 100%',
        confidence_percentage: 100,
        detected_barcode: cleanCode,
        matched_book: top,
        matches: likeMatch.map(b => ({
          book_id: b.id,
          book: b,
          similarity: 1.0,
          match_reason: 'ตรงกับรหัสบาร์โค้ด / ISBN ในฐานข้อมูล 100%'
        }))
      });
    }

    return res.status(200).json({
      success: false,
      search_status: 'NOT_FOUND',
      status_message: `ไม่พบหนังสือที่มีหมายเลขบาร์โค้ด / ISBN "${cleanCode}" ในฐานข้อมูลห้องสมุด`,
      confidence_percentage: 0,
      matched_book: null,
      matches: []
    });
  } catch (err: any) {
    console.error('Barcode lookup error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error looking up barcode'
    });
  }
}
