import { supabase } from '../supabaseClient';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// Helper: Real Internet Book Cover Search via Google Books, DuckDuckGo & OpenLibrary
async function searchInternetBookCover(title: string, author = '', publisher = '', isbn = ''): Promise<{ url: string; source: string } | null> {
  const cleanIsbn = (isbn || '').replace(/[^0-9X]/gi, '');
  const cleanTitle = (title || '').split('/')[0].split('=')[0].replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();
  const cleanAuthor = (author || '').split('/')[0].replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();

  // 1. Google Books API (High quality book covers)
  try {
    const q = cleanIsbn.length >= 10 ? `isbn:${cleanIsbn}` : `intitle:${cleanTitle}${cleanAuthor ? `+inauthor:${cleanAuthor}` : ''}`;
    const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`);
    if (gbRes.ok) {
      const gbData = await gbRes.json();
      if (gbData.items && gbData.items.length > 0) {
        for (const item of gbData.items) {
          const imgLinks = item.volumeInfo?.imageLinks;
          if (imgLinks?.thumbnail || imgLinks?.smallThumbnail || imgLinks?.medium || imgLinks?.large) {
            let imgUrl = (imgLinks.large || imgLinks.medium || imgLinks.thumbnail || imgLinks.smallThumbnail).replace('http://', 'https://');
            imgUrl = imgUrl.replace('&edge=curl', '');
            return { url: imgUrl, source: 'google_books' };
          }
        }
      }
    }
  } catch (e) {
    console.error('Google Books API search notice:', e);
  }

  // 2. DuckDuckGo Image Live Search
  try {
    const query = `ปกหนังสือ "${cleanTitle}" ${cleanAuthor || publisher}`.trim();
    const pageRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await pageRes.text();
    const vqdMatch = html.match(/vqd=([\d-]+)/) || html.match(/vqd="([\d-]+)"/);
    if (vqdMatch) {
      const vqd = vqdMatch[1];
      const imgRes = await fetch(`https://duckduckgo.com/i.js?l=th-th&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://duckduckgo.com/'
        }
      });
      const data = await imgRes.json();
      if (data.results && data.results.length > 0) {
        const valid = data.results.find((r: any) => 
          r.image && 
          r.image.startsWith('https://') && 
          !r.image.includes('.svg') &&
          !r.image.includes('avatar')
        );
        if (valid) {
          return { url: valid.image, source: 'internet_search' };
        }
      }
    }
  } catch (e) {
    console.error('DuckDuckGo image search notice:', e);
  }

  // 3. Open Library by ISBN fallback
  if (cleanIsbn.length >= 10) {
    return {
      url: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`,
      source: 'open_library'
    };
  }

  return null;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
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
    const { bookId, title, author, publisher, isbn } = body || {};

    let targetTitle = title || '';
    let targetAuthor = author || '';
    let targetPublisher = publisher || '';
    let targetIsbn = isbn || '';

    // If only bookId is passed, fetch details from Supabase
    if (bookId && (!targetTitle || targetTitle.trim() === '')) {
      try {
        const { data: book } = await supabase.from('books').select('*').eq('id', bookId).single();
        if (book) {
          targetTitle = book.title || '';
          targetAuthor = book.author || '';
          targetPublisher = book.publisher || '';
          targetIsbn = book.isbn || '';
        }
      } catch (sbErr) {
        console.warn('Fetch book details from Supabase note:', sbErr);
      }
    }

    if (!targetTitle && !targetIsbn) {
      return res.status(400).json({ success: false, error: 'Title or ISBN is required to search cover' });
    }

    const result = await searchInternetBookCover(targetTitle, targetAuthor, targetPublisher, targetIsbn);

    if (result && result.url) {
      // If bookId is present, persist to Supabase
      if (bookId) {
        const nowIso = new Date().toISOString();
        const updatePayload = {
          cover_image: result.url,
          illustration: result.url,
          cover_source: result.source,
          updated_at: nowIso
        };
        try {
          await supabase.from('books').update(updatePayload).eq('id', bookId);
          await supabase.from('book_customizations').upsert({ id: bookId, ...updatePayload });
        } catch (sbUpdateErr) {
          console.warn('Update cover to Supabase note:', sbUpdateErr);
        }
      }

      return res.status(200).json({
        success: true,
        cover_image: result.url,
        illustration: result.url,
        source: result.source,
        message: 'ค้นพบและบันทึกภาพหน้าปกจากอินเทอร์เน็ตสำเร็จ'
      });
    }

    return res.status(200).json({
      success: false,
      message: 'ไม่พบภาพหน้าปกที่ตรงกันจากอินเทอร์เน็ต'
    });
  } catch (error: any) {
    console.error('API /api/search-cover error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการค้นหาภาพปก'
    });
  }
}
