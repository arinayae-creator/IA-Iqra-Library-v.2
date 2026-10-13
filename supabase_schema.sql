-- =========================================================================
-- สคริปต์สร้างตารางฐานข้อมูลสำหรับระบบห้องสมุดบน Supabase (PostgreSQL)
-- สามารถคัดลอกทั้งหมดนี้ไปรันในเมนู "SQL Editor" บน Supabase ได้ทันที
-- =========================================================================

-- 1. ตารางหนังสือหลัก (books) รองรับ MARC 21 จาก Google Sheet
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT,
  co_authors TEXT,
  isbn TEXT,
  barcode TEXT,
  accession_no TEXT,
  publisher TEXT,
  publication_place TEXT,
  publication_year TEXT,
  edition TEXT,
  pages TEXT,
  language TEXT DEFAULT 'ไทย',
  category TEXT,
  subject TEXT,
  keywords TEXT,
  call_number TEXT,
  ddc TEXT,
  price TEXT,
  series TEXT,
  translator TEXT,
  illustration TEXT,
  cover_image TEXT,
  cover_source TEXT,
  description TEXT,
  status TEXT DEFAULT 'พร้อมให้บริการ',
  source TEXT DEFAULT 'Google Sheet (MARC 21)',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- เพิ่มคอลัมน์กรณีสร้างตาราง books ไว้ก่อนหน้าแล้ว
ALTER TABLE books ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS co_authors TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS accession_no TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publication_place TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publication_year TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS edition TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS pages TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ไทย';
ALTER TABLE books ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS ddc TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS price TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS series TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS translator TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Google Sheet (MARC 21)';
ALTER TABLE books ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. ตารางจัดเก็บปกและการปรับปรุงเฉพาะเล่ม (book_customizations)
CREATE TABLE IF NOT EXISTS book_customizations (
  id TEXT PRIMARY KEY,
  cover_image TEXT,
  illustration TEXT,
  cover_source TEXT,
  status TEXT,
  title TEXT,
  author TEXT,
  publisher TEXT,
  category TEXT,
  call_number TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตารางหมวดหมู่หนังสือ (categories)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ตารางประวัติการสแกนและตรวจจับหน้าปก (scan_history)
CREATE TABLE IF NOT EXISTS scan_history (
  id TEXT PRIMARY KEY,
  image_url TEXT,
  extracted_text TEXT,
  detected_title TEXT,
  detected_author TEXT,
  matched_book_id TEXT,
  similarity_score NUMERIC,
  search_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ตารางข้อมูลสถานะการซิงค์จาก Google Sheet (sheet_sync_info)
CREATE TABLE IF NOT EXISTS sheet_sync_info (
  id TEXT PRIMARY KEY DEFAULT 'current',
  url TEXT,
  total_books INTEGER,
  total_categories INTEGER,
  last_sync TIMESTAMP WITH TIME ZONE,
  status TEXT
);

-- 6. ปิด Row Level Security (RLS) เพื่อให้ระบบหลังบ้านและคีย์ Publish สามารถอ่าน/เขียนได้โดยตรง
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE book_customizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_sync_info DISABLE ROW LEVEL SECURITY;

-- 7. ตารางจัดเก็บข้อมูลตารางทำงาน MARC 21 AI (marc21_records)
-- รองรับการใช้งานข้ามอุปกรณ์ (Cross-device Sync) และแสดงผลทันทีโดยไม่ต้องรีเฟรชหน้าจอ (Real-time Sync)
CREATE TABLE IF NOT EXISTS marc21_records (
  id TEXT PRIMARY KEY,
  db_id TEXT,
  date TEXT,
  col1 TEXT,
  accession_no TEXT,
  isbn TEXT,
  author_personal TEXT,
  author_corporate TEXT,
  title_245a TEXT NOT NULL,
  title_245b TEXT,
  responsibility_245c TEXT,
  ddc_082a TEXT,
  cutter_082b TEXT,
  pub_place TEXT,
  publisher TEXT,
  pub_year TEXT,
  pages_300a TEXT,
  illustration_300b TEXT,
  subject_650a TEXT,
  copies TEXT,
  summary_520 TEXT,
  edition_250 TEXT,
  price_541 TEXT,
  series_490 TEXT,
  added_entry_700 TEXT,
  acquisition_source TEXT,
  col2 TEXT,
  source_type TEXT,
  storage_location TEXT,
  status TEXT DEFAULT 'พร้อมให้บริการ',
  col3 TEXT,
  leader_000 TEXT,
  control_001 TEXT,
  control_003 TEXT,
  trans_005 TEXT,
  fixed_008 TEXT,
  issn_022 TEXT,
  cat_source_040 TEXT,
  language_041 TEXT,
  title_varying_246 TEXT,
  dimensions_300c TEXT,
  note_general_500 TEXT,
  note_bib_504 TEXT,
  note_contents_505 TEXT,
  subject_person_600 TEXT,
  subject_corp_610 TEXT,
  subject_uniform_630 TEXT,
  subject_geo_651 TEXT,
  subject_650_2 TEXT,
  subject_650_3 TEXT,
  added_corp_710 TEXT,
  added_title_740 TEXT,
  series_uniform_830 TEXT,
  electronic_856 TEXT,
  local_907 TEXT,
  cover_image TEXT,
  search_source TEXT,
  marc_tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ปิด RLS เพื่อให้อ่าน/เขียนจากหน้าเว็บได้โดยตรง
ALTER TABLE marc21_records DISABLE ROW LEVEL SECURITY;

-- ตั้งค่า Replica Identity เป็น FULL เพื่อให้ Realtime ส่งข้อมูลการแก้ไขและลบครบถ้วนทุกคอลัมน์
ALTER TABLE marc21_records REPLICA IDENTITY FULL;

-- เปิดใช้งาน Supabase Realtime สำหรับตาราง marc21_records
-- (คอมพิวเตอร์เครื่องที่ 2 จะได้รับข้อมูลอัปเดตทันทีผ่าน WebSocket โดยไม่ต้องรีเฟรชหน้าจอ)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'marc21_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marc21_records;
  END IF;
END $$;

-- 8. สร้าง Index เพื่อเพิ่มความเร็วสูงสุดในการสืบค้นข้อมูล
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_barcode ON books(barcode);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_accession ON books(accession_no);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);

CREATE INDEX IF NOT EXISTS idx_marc21_accession ON marc21_records(accession_no);
CREATE INDEX IF NOT EXISTS idx_marc21_isbn ON marc21_records(isbn);
CREATE INDEX IF NOT EXISTS idx_marc21_title ON marc21_records(title_245a);
CREATE INDEX IF NOT EXISTS idx_marc21_updated_at ON marc21_records(updated_at DESC);

