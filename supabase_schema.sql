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

-- 7. สร้าง Index เพื่อเพิ่มความเร็วสูงสุดในการสืบค้นข้อมูล
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_barcode ON books(barcode);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_accession ON books(accession_no);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
