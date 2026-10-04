import { supabase } from '../supabaseClient';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE_PATH = path.resolve(__dirname, '../books_cache_v2.json');
const CSV_FILE_PATH = path.resolve(__dirname, '../google_sheet.csv');

interface BookRecord {
  id: string;
  title: string;
  subtitle?: string | null;
  author?: string | null;
  co_authors?: string | null;
  isbn?: string | null;
  barcode?: string | null;
  accession_no?: string | null;
  publisher?: string | null;
  publication_place?: string | null;
  publication_year?: string | null;
  edition?: string | null;
  pages?: string | null;
  language?: string | null;
  category?: string | null;
  subject?: string | null;
  keywords?: string | null;
  call_number?: string | null;
  ddc?: string | null;
  price?: string | null;
  series?: string | null;
  translator?: string | null;
  illustration?: string | null;
  cover_image?: string | null;
  cover_source?: string | null;
  description?: string | null;
  status?: string | null;
  source?: string | null;
  created_at?: string;
  updated_at?: string;
}

function cleanTitle(raw: string): { title: string; subtitle: string } {
  let title = (raw || '').trim();
  let subtitle = '';

  if (title.includes(' = ')) {
    const parts = title.split(' = ');
    title = parts[0].trim();
    if (parts[1]) {
      subtitle = parts[1].split(' / ')[0].trim();
    }
  }
  if (title.includes(' / ')) {
    title = title.split(' / ')[0].trim();
  }
  title = title.replace(/[\/:]\s*$/, '').trim();
  return { title, subtitle };
}

function normalizeTitle(t: string): string {
  if (!t) return '';
  const clean = t.split('/')[0].split('=')[0].trim();
  return clean.replace(/[\s\W_]+/g, '').toLowerCase();
}

function cleanAuthor(r4: string, r5: string, r8: string): string {
  let a = (r4 || '').trim();
  if (!a || a === '-') {
    a = (r5 || '').trim();
  }
  if (!a || a === '-') {
    a = (r8 || '').trim();
  }
  return a.replace(/[\/.]\s*$/, '').trim();
}

export async function runUpdate(dryRun = false) {
  console.log(`[Update] Starting book catalog update... (dryRun: ${dryRun})`);

  // 1. Load existing cache
  let cacheData: any = {};
  try {
    cacheData = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
  } catch (err) {
    console.error('Failed to read cache file:', err);
    return;
  }
  const existingBooks: BookRecord[] = cacheData.books || [];
  console.log(`[Update] Existing books in cache: ${existingBooks.length}`);

  // Build lookups
  const byAcc = new Map<number, BookRecord>();
  const byNormTitle = new Map<string, BookRecord>();

  for (const b of existingBooks) {
    const rawAcc = b.accession_no || b.barcode || '';
    const m = String(rawAcc).match(/\d+/);
    if (m) {
      const intAcc = parseInt(m[0], 10);
      byAcc.set(intAcc, b);
    }
    const nt = normalizeTitle(b.title);
    if (nt && !byNormTitle.has(nt)) {
      byNormTitle.set(nt, b);
    }
  }

  // 2. Read CSV
  const csvRaw = fs.readFileSync(CSV_FILE_PATH, 'utf8');
  const workbook = XLSX.read(csvRaw, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`[Update] CSV total rows: ${rows.length}`);

  let updatedBooksCount = 0;
  let addedBooksCount = 0;
  const missingFromSystem: { acc: number; title: string; author: string; isbn: string }[] = [];
  const updatedDetailsList: { id: string; title: string; changes: string[] }[] = [];

  const nowIso = new Date().toISOString();
  const booksToUpsertSupabase: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 7) continue;

    const rawAcc = String(r[2] || '').trim();
    const rawTitle = String(r[6] || '').trim();

    // Skip empty rows or blank placeholders like 'ว่่าง'
    if (!rawTitle || rawTitle === 'ว่่าง' || rawTitle === 'แบบเรียน') {
      continue;
    }

    const m = rawAcc.match(/\d+/);
    const intAcc = m ? parseInt(m[0], 10) : null;
    const nt = normalizeTitle(rawTitle);

    const { title: parsedTitle, subtitle: parsedSub } = cleanTitle(rawTitle);
    const csvSubtitle = String(r[7] || '').trim() || parsedSub;
    const csvAuthor = cleanAuthor(String(r[4] || ''), String(r[5] || ''), String(r[8] || ''));
    const csvIsbn = String(r[3] || '').trim();
    const csvDdc = String(r[9] || '').trim();
    const csvCutter = String(r[10] || '').trim();
    const csvCallNumber = (csvDdc && csvCutter) ? `${csvDdc} ${csvCutter}` : (csvDdc || csvCutter || '000');
    const csvPubPlace = String(r[11] || 'กรุงเทพฯ').trim();
    const csvPublisher = String(r[12] || '').trim();
    const csvPubYear = String(r[13] || '').trim();
    const csvPages = String(r[14] || '').trim();
    const csvSubject = String(r[16] || '').trim();
    const csvDesc = String(r[18] || '').trim();
    const csvEdition = String(r[19] || '').trim();
    const csvPrice = String(r[20] || '').trim();
    const csvSeries = String(r[21] || '').trim();
    const csvTranslator = String(r[22] || '').trim();
    const csvCategory = String(r[26] || '').trim() || 'ทั่วไป';
    const csvStatus = String(r[27] || '').trim();
    const normalizedStatus = (csvStatus === 'อยู่บนชั้น' || !csvStatus) ? 'พร้อมให้บริการ' : csvStatus;

    // Determine target record
    let targetBook: BookRecord | undefined;
    if (intAcc !== null && byAcc.has(intAcc)) {
      targetBook = byAcc.get(intAcc);
    } else if (nt && byNormTitle.has(nt)) {
      targetBook = byNormTitle.get(nt);
    }

    if (targetBook) {
      // Record exists -> check and enrich missing/incomplete fields
      const changes: string[] = [];

      // 1. Title
      if ((!targetBook.title || targetBook.title.trim() === '') && parsedTitle) {
        targetBook.title = parsedTitle;
        changes.push(`ชื่อเรื่อง: ${parsedTitle}`);
      }
      // 2. Subtitle (ชื่อเรื่องที่แตกต่าง)
      if ((!targetBook.subtitle || targetBook.subtitle.trim() === '') && csvSubtitle) {
        targetBook.subtitle = csvSubtitle;
        changes.push(`ชื่อเรื่องที่แตกต่าง: ${csvSubtitle}`);
      }
      // 3. Author (ชื่อผู้แต่ง)
      if ((!targetBook.author || targetBook.author === '-' || targetBook.author === 'ไม่ระบุผู้แต่ง') && csvAuthor) {
        targetBook.author = csvAuthor;
        changes.push(`ผู้แต่ง: ${csvAuthor}`);
      }
      // 4. Call Number (เลขเรียกหนังสือ)
      if ((!targetBook.call_number || targetBook.call_number === '000' || targetBook.call_number.trim() === '') && csvCallNumber !== '000') {
        targetBook.call_number = csvCallNumber;
        targetBook.ddc = csvDdc || targetBook.ddc;
        changes.push(`เลขเรียกหนังสือ: ${csvCallNumber}`);
      }
      // 5. Price (ราคา)
      if ((!targetBook.price || targetBook.price.trim() === '' || targetBook.price === '0') && csvPrice) {
        targetBook.price = csvPrice;
        changes.push(`ราคา: ${csvPrice}`);
      }
      // 6. Series (ชื่อชุด)
      if ((!targetBook.series || targetBook.series.trim() === '' || targetBook.series === '-') && csvSeries && csvSeries !== '-') {
        targetBook.series = csvSeries;
        changes.push(`ชื่อชุด: ${csvSeries}`);
      }
      // 7. Co-authors / Translator (ผู้แต่งร่วม / ผู้แปล)
      if (!targetBook.co_authors && (csvTranslator || String(r[8] || '').trim())) {
        const coAuth = csvTranslator ? `ผู้แปล: ${csvTranslator}` : String(r[8] || '').trim();
        if (coAuth && coAuth !== targetBook.author) {
          targetBook.co_authors = coAuth;
          changes.push(`ผู้แต่งร่วม: ${coAuth}`);
        }
      }
      // 8. Category / Shelf Location (สถานที่จัดเก็บ)
      if ((!targetBook.category || targetBook.category === 'ทั่วไป') && csvCategory && csvCategory !== 'ทั่วไป') {
        targetBook.category = csvCategory;
        changes.push(`สถานที่จัดเก็บ: ${csvCategory}`);
      }
      // 9. Publisher
      if ((!targetBook.publisher || targetBook.publisher === 'ไม่ระบุสำนักพิมพ์') && csvPublisher) {
        targetBook.publisher = csvPublisher;
        changes.push(`สำนักพิมพ์: ${csvPublisher}`);
      }
      // 10. Publication Year
      if (!targetBook.publication_year && csvPubYear) {
        targetBook.publication_year = csvPubYear;
        changes.push(`ปีพิมพ์: ${csvPubYear}`);
      }
      // 11. Pages
      if (!targetBook.pages && csvPages) {
        targetBook.pages = csvPages;
        changes.push(`จำนวนหน้า: ${csvPages}`);
      }
      // 12. Description / Summary
      if ((!targetBook.description || targetBook.description.startsWith('หนังสือ "')) && csvDesc) {
        targetBook.description = csvDesc;
        changes.push(`เรื่องย่อ: ${csvDesc.slice(0, 30)}...`);
      }
      // 13. Subject
      if (!targetBook.subject && csvSubject) {
        targetBook.subject = csvSubject;
        changes.push(`หัวเรื่อง: ${csvSubject}`);
      }
      // 14. Accession no normalization
      if (intAcc !== null && (!targetBook.accession_no || targetBook.accession_no !== String(intAcc))) {
        targetBook.accession_no = String(intAcc);
        targetBook.barcode = targetBook.barcode || String(intAcc);
      }

      if (changes.length > 0) {
        targetBook.updated_at = nowIso;
        updatedBooksCount++;
        booksToUpsertSupabase.push(targetBook);
        if (updatedDetailsList.length < 25) {
          updatedDetailsList.push({ id: targetBook.id, title: targetBook.title, changes });
        }
      }
    } else {
      // Record does NOT exist in system
      if (intAcc !== null) {
        missingFromSystem.push({
          acc: intAcc,
          title: parsedTitle || rawTitle,
          author: csvAuthor,
          isbn: csvIsbn
        });

        // Create new book record
        const newId = `book_reg_${intAcc}`;
        const cleanIsbn = csvIsbn.replace(/[^0-9X]/gi, '');
        const coverImage = (cleanIsbn.length >= 10)
          ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`
          : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';

        const newBook: BookRecord = {
          id: newId,
          title: parsedTitle || rawTitle,
          subtitle: csvSubtitle || null,
          author: csvAuthor || 'ไม่ระบุผู้แต่ง',
          co_authors: csvTranslator ? `ผู้แปล: ${csvTranslator}` : (String(r[8] || '').trim() || null),
          isbn: csvIsbn || String(intAcc),
          barcode: String(intAcc),
          accession_no: String(intAcc),
          publisher: csvPublisher || 'ไม่ระบุสำนักพิมพ์',
          publication_place: csvPubPlace || 'กรุงเทพฯ',
          publication_year: csvPubYear || '2565',
          edition: csvEdition || 'พิมพ์ครั้งที่ 1',
          pages: csvPages || '200',
          language: 'ไทย',
          category: csvCategory,
          subject: csvSubject || null,
          keywords: `${parsedTitle}, ${csvAuthor}, ${csvCategory}`,
          call_number: csvCallNumber,
          ddc: csvDdc || '000',
          price: csvPrice || null,
          series: csvSeries || null,
          translator: csvTranslator || null,
          illustration: String(r[15] || '').trim() || null,
          cover_image: coverImage,
          cover_source: 'open_library',
          description: csvDesc || `หนังสือ "${parsedTitle}" โดย ${csvAuthor}`,
          status: normalizedStatus,
          source: 'นำเข้าจากทะเบียนหนังสือ (Google Sheet / CSV)',
          created_at: nowIso,
          updated_at: nowIso
        };

        existingBooks.push(newBook);
        byAcc.set(intAcc, newBook);
        booksToUpsertSupabase.push(newBook);
        addedBooksCount++;
      }
    }
  }

  console.log(`[Update] Completed scan:`);
  console.log(` - Updated existing records with missing data: ${updatedBooksCount}`);
  console.log(` - Added new records from file: ${addedBooksCount}`);
  console.log(` - Missing from system previously: ${missingFromSystem.length}`);

  if (!dryRun) {
    // Save to disk cache
    cacheData.books = existingBooks;
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2), 'utf8');
    console.log(`[Update] Successfully saved updated cache to ${CACHE_FILE_PATH}`);

    // Deduplicate booksToUpsertSupabase by id to prevent Postgres on conflict batch error
    const uniqueBooksMap = new Map<string, any>();
    for (const b of booksToUpsertSupabase) {
      if (b && b.id) {
        uniqueBooksMap.set(b.id, b);
      }
    }
    const uniqueBooksToUpsert = Array.from(uniqueBooksMap.values());

    // Save to Supabase in chunks
    console.log(`[Update] Saving ${uniqueBooksToUpsert.length} unique books to Supabase database...`);
    const CHUNK_SIZE = 100;
    let savedToSupabase = 0;
    for (let i = 0; i < uniqueBooksToUpsert.length; i += CHUNK_SIZE) {
      const chunk = uniqueBooksToUpsert.slice(i, i + CHUNK_SIZE);
      try {
        const { error } = await supabase.from('books').upsert(chunk, { onConflict: 'id' });
        if (error) {
          console.warn(`[Supabase] Chunk ${i}-${i + chunk.length} upsert error:`, error.message);
        } else {
          savedToSupabase += chunk.length;
          console.log(`[Supabase] Successfully upserted ${savedToSupabase}/${uniqueBooksToUpsert.length} books.`);
        }
      } catch (err: any) {
        console.warn(`[Supabase] Chunk error:`, err.message || err);
      }
    }
  }

  // Print sample updates and full report
  const report = {
    updatedBooksCount,
    addedBooksCount,
    missingFromSystemCount: missingFromSystem.length,
    missingFromSystemList: missingFromSystem,
    sampleUpdates: updatedDetailsList
  };
  fs.writeFileSync('update_report.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('[Update] Written update_report.json');
}

runUpdate(process.argv.includes('--dry-run'));
