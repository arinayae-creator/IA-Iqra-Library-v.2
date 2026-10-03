import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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
    const { image } = body || {};
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image data is required in base64' });
    }

    let mimeType = 'image/jpeg';
    let base64Data = image;
    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      mimeType = parts[0].split(':')[1] || 'image/jpeg';
      base64Data = parts[1] || image;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel Environment Variables'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const promptText = `You are a world-class AI Librarian and Vision OCR specialist with deep expertise in Thai and multilingual literature, book recognition, and library cataloging.

Carefully inspect the provided book cover image and extract high-precision bibliographical information:

Tasks:
1. "title": The exact, clean main title of the book in its primary language (especially Thai).
   - DO NOT include subtitles, awards (e.g. "รางวัลซีไรต์", "หนังสือขายดี", "Bestseller"), author names, volume numbers, or publisher slogans in the title.
   - For example: if cover says "ความสุขของกะทิ วรรณกรรมสร้างสรรค์ยอดเยี่ยมแห่งอาเซียน", title MUST be "ความสุขของกะทิ".
2. "subtitle": Any secondary title or tagline on the cover.
3. "author": The primary author, illustrator, or translator. Exclude prefixes like "เขียนโดย" or "เรื่องโดย" or "by".
4. "publisher": The publishing house or imprint if visible (e.g. นานมีบุ๊คส์, ซีเอ็ด, มติชน, แจ่มใส, เอ็มไอเอส).
5. "isbn": If visible anywhere on the cover or barcode sticker (10 or 13 digits).
6. "ocr_text": Complete, raw transcription of all readable text on the cover from top to bottom.
7. "alternative_titles": Any alternative title, romanized/English title, or original title if translated.
8. "lens_tags": Structured tags for visual labeling:
   [
     { "label": "ชื่อเรื่อง", "text": "..." },
     { "label": "ผู้แต่ง", "text": "..." },
     { "label": "สำนักพิมพ์", "text": "..." }
   ]

Return strictly valid JSON:
{
  "title": "Clean Main Title",
  "subtitle": "Subtitle if present",
  "author": "Author name",
  "publisher": "Publisher name",
  "isbn": "ISBN if detected",
  "ocr_text": "all raw text extracted from cover",
  "language": "th",
  "alternative_titles": ["Alt title 1", "Original Title"],
  "lens_tags": [
    { "label": "ชื่อเรื่อง", "text": "..." },
    { "label": "ผู้แต่ง", "text": "..." },
    { "label": "สำนักพิมพ์", "text": "..." }
  ]
}`;

    let rawText = "{}";
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType
            }
          },
          promptText
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });
      rawText = response.text || "{}";
    } catch (m1Err: any) {
      console.warn('Primary model gemini-3.8-flash notice, attempting fallback model gemini-3.1-flash-lite:', m1Err?.message || m1Err);
      await new Promise(resolve => setTimeout(resolve, 1200));
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            },
            promptText
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });
        rawText = fallbackResponse.text || "{}";
      } catch (fbErr: any) {
        console.warn('Fallback model gemini-3.1-flash-lite notice:', fbErr?.message || fbErr);
        rawText = "{}";
      }
    }

    const result = JSON.parse(rawText);
    const detectedTitle = result.title || "";
    const detectedSubtitle = result.subtitle || "";
    const detectedAuthor = result.author || "";
    const detectedPublisher = result.publisher || "";
    const detectedIsbn = result.isbn || "";
    const ocrText = result.ocr_text || detectedTitle || "";
    const alternativeTitles = Array.isArray(result.alternative_titles) ? result.alternative_titles : [];
    const lensTags = Array.isArray(result.lens_tags) ? result.lens_tags : [];

    return res.status(200).json({
      success: true,
      search_status: 'PROCESSING',
      status_message: 'วิเคราะห์ภาพหน้าปกด้วย AI สำเร็จ',
      confidence_percentage: 95,
      ocr_text: ocrText,
      detected_title: detectedTitle,
      detected_subtitle: detectedSubtitle,
      detected_author: detectedAuthor,
      detected_publisher: detectedPublisher,
      detected_isbn: detectedIsbn,
      detected_language: result.language || 'th',
      alternative_titles: alternativeTitles,
      lens_tags: lensTags,
      matches: []
    });
  } catch (error: any) {
    console.error('API /api/scan-cover error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการวิเคราะห์ด้วย AI'
    });
  }
}
