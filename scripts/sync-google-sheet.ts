import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import * as XLSX from 'xlsx';

const configPath = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1IXKv6ZCq5AdUxZcKYsUz1IY3uH9qBxnMTTuYgeT7RRg/export?format=csv&gid=889338917';

export async function syncBooksFromGoogleSheet(sheetUrl: string = DEFAULT_SHEET_URL) {
  console.log(`[GoogleSheetSync] Fetching from ${sheetUrl}...`);
  const response = await fetch(sheetUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`[GoogleSheetSync] Total rows parsed: ${rows.length}`);
  if (rows.length < 2) {
    throw new Error('Google Sheet does not contain enough data.');
  }

  const categoriesSet = new Set<string>();
  const booksToSave: any[] = [];

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
    const barcode = String(r[2] || '').trim() || `B${String(i).padStart(7, '0')}`;
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

    // Safe document ID using registration number or isbn
    const bookId = barcode ? `book_reg_${barcode}` : `book_${isbn.replace(/[^a-zA-Z0-9]/g, '')}`;

    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    const coverImage = (cleanIsbn.length >= 10)
      ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`
      : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';

    booksToSave.push({
      id: bookId,
      title,
      subtitle,
      author,
      co_authors: translator ? `ผู้แปล: ${translator}` : '',
      isbn,
      barcode,
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
      cover_image: coverImage,
      description: desc,
      status,
      source: 'Google Sheet (MARC 21)',
      updated_at: new Date().toISOString()
    });
  }

  console.log(`[GoogleSheetSync] Processed ${booksToSave.length} valid books. Writing in Firestore batches...`);

  // Write books in batches of 400
  const BATCH_SIZE = 400;
  for (let i = 0; i < booksToSave.length; i += BATCH_SIZE) {
    const chunk = booksToSave.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const b of chunk) {
      const { id, ...data } = b;
      batch.set(doc(db, 'books', id), {
        ...data,
        created_at: new Date().toISOString()
      }, { merge: true });
    }
    await batch.commit();
    console.log(`[GoogleSheetSync] Committed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(booksToSave.length / BATCH_SIZE)} (${chunk.length} items)`);
  }

  // Update categories collection
  console.log(`[GoogleSheetSync] Syncing ${categoriesSet.size} categories...`);
  const catArray = Array.from(categoriesSet);
  const catBatch = writeBatch(db);
  for (let i = 0; i < catArray.length; i++) {
    const catName = catArray[i];
    const catId = `cat_sheet_${i + 1}`;
    catBatch.set(doc(db, 'categories', catId), {
      name: catName,
      description: `หมวดหมู่/สถานที่จัดเก็บ: ${catName}`
    }, { merge: true });
  }
  await catBatch.commit();

  // Save sync metadata
  const syncInfo = {
    url: sheetUrl,
    totalBooks: booksToSave.length,
    totalCategories: categoriesSet.size,
    lastSync: new Date().toISOString(),
    status: 'success'
  };

  await setDoc(doc(db, 'system', 'sheet_sync_info'), syncInfo, { merge: true });
  console.log('[GoogleSheetSync] Successfully completed synchronization!');
  return syncInfo;
}

// Run directly if called as a script
if (process.argv[1] && process.argv[1].endsWith('sync-google-sheet.ts')) {
  syncBooksFromGoogleSheet()
    .then((info) => {
      console.log('Sync finished:', info);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Sync failed:', err);
      process.exit(1);
    });
}
