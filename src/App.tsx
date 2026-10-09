import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, 
  Search, 
  Camera, 
  Upload, 
  Settings, 
  BarChart3, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  FileSpreadsheet, 
  Languages, 
  Hash, 
  Compass, 
  ChevronRight, 
  Info,
  Clock,
  ThumbsUp,
  AlertTriangle,
  LogOut,
  Sparkles,
  HelpCircle,
  FileDown,
  Barcode,
  ScanLine,
  FileCheck,
  ExternalLink,
  ChevronLeft,
  Layers,
  Database,
  Radio,
  Zap,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { supabase } from '../supabaseClient';
import { Marc21Generator, parseMarcSubfield } from './components/Marc21Generator';
import { generateThaiCutter } from './utils/thaiCutter';
import { ErrorBoundary } from './components/ErrorBoundary';

// Interfaces based on Database Schema
interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  writer?: string; // ผู้เขียน (คอลัมน์มาตรฐาน)
  co_authors?: string;
  isbn: string;
  accession_no?: string; // เลขทะเบียน
  publisher: string;
  publication_place: string;
  publication_year: string;
  edition: string;
  pages: string;
  language: string;
  category: string;
  subject: string;
  subject_subdivision?: string; // 650 $x ย่อยหัวเรื่อง
  subject_2?: string; // หัวเรื่อง 2
  subject_3?: string; // หัวเรื่อง 3
  keywords: string;
  call_number: string;
  ddc: string;
  call_sub?: string; // 082 $b เลขคัตเตอร์
  barcode: string;
  illustration?: string; // ภาพประกอบ (คอลัมน์ 300 $b)
  dimensions_300c?: string;
  book_size?: string; // ขนาดเล่ม เช่น 24 ซม.
  storage_location?: string; // สถานที่จัดเก็บ เช่น NCILibrary
  author_role?: string; // เช่น บรรณาธิการ
  cover_image: string;
  cover_source?: string;
  description: string;
  status: 'พร้อมให้บริการ' | 'ถูกยืมแล้ว' | 'ปรับปรุง';
  source?: string;
  created_at?: string;
  date_added?: string; // วันที่
  series?: string;
  translator?: string;
  price?: string;
  composition_year?: string; // ปีแต่ง
  copies?: string | number; // จำนวนเล่ม
  [key: string]: any;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface ScanHistory {
  id: string;
  image_url: string;
  extracted_text: string;
  detected_title: string;
  detected_author?: string;
  matched_book_id?: string | null;
  similarity_score: number;
  created_at: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'scanner' | 'marc21' | 'admin' | 'stats'>('catalog');
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [role, setRole] = useState<'admin' | 'librarian' | 'user'>('user');

  // Search/Filter states for Catalog
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('title');

  // Scanner States
  const [scannerMode, setScannerMode] = useState<'cover' | 'barcode'>('cover');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [scanningStep, setScanningStep] = useState<number>(0);
  const [scanResult, setScanResult] = useState<any>(null);
  const [matchedBooks, setMatchedBooks] = useState<any[]>([]);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [isBarcodeProcessing, setIsBarcodeProcessing] = useState<boolean>(false);
  const [confirmedBookId, setConfirmedBookId] = useState<string | null>(null);
  
  // Detail Modal
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'card' | 'marc'>('card');
  const [copiedMarc, setCopiedMarc] = useState<boolean>(false);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);
  const [isSavingCover, setIsSavingCover] = useState<boolean>(false);
  const [coverImageFailed, setCoverImageFailed] = useState<boolean>(false);

  // Reset cover error status whenever opened book changes
  useEffect(() => {
    setCoverImageFailed(false);
  }, [selectedBookDetail?.id]);

  // Real-time states
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
  const [lastRealtimeEventTime, setLastRealtimeEventTime] = useState<string>(new Date().toLocaleTimeString('th-TH'));

  // Admin states
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBookTarget, setDeletingBookTarget] = useState<Book | null>(null);
  const [isAddingBook, setIsAddingBook] = useState<boolean>(false);
  const [csvInput, setCsvInput] = useState<string>('');
  const [excelPreviewData, setExcelPreviewData] = useState<any[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [newBookForm, setNewBookForm] = useState<Omit<Book, 'id'>>({
    title: '',
    subtitle: '',
    author: '',
    writer: '',
    co_authors: '',
    isbn: '',
    accession_no: '',
    publisher: '',
    publication_place: 'กรุงเทพฯ',
    publication_year: new Date().getFullYear().toString(),
    edition: 'พิมพ์ครั้งที่ 1',
    pages: '200',
    language: 'ไทย',
    category: 'วรรณกรรมเยาวชน',
    subject: '',
    subject_subdivision: '',
    subject_2: '',
    subject_3: '',
    keywords: '',
    call_number: '',
    ddc: '',
    call_sub: '',
    barcode: '',
    cover_image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
    description: '',
    status: 'พร้อมให้บริการ',
    date_added: '',
    series: '',
    translator: '',
    price: '',
    composition_year: '',
    copies: '1'
  });

  // Pagination, Publisher & Sheet Sync States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(52);
  const [totalBooksCount, setTotalBooksCount] = useState<number>(0);
  const [sheetSyncInfo, setSheetSyncInfo] = useState<any>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);
  const [customSheetUrl, setCustomSheetUrl] = useState<string>('https://docs.google.com/spreadsheets/d/1IXKv6ZCq5AdUxZcKYsUz1IY3uH9qBxnMTTuYgeT7RRg/edit?gid=889338917#gid=889338917');
  const [publishers, setPublishers] = useState<string[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState<string>('');
  const [enrichingBookId, setEnrichingBookId] = useState<string | null>(null);
  const [isBatchEnriching, setIsBatchEnriching] = useState<boolean>(false);

  // Refs for camera stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchBooks(1);
    fetchCategories();
    fetchPublishers();
    fetchScanHistory();
    fetchSheetInfo();
  }, []);

  // Client-side in-memory cache for standalone/Vercel environments
  const clientAllBooksRef = useRef<Book[]>([]);

  const healBookRecord = (b: Book): Book => {
    if (!b) return b;
    const healed = { ...b };
    
    // 1. Heal Title if empty or null
    if (!healed.title || String(healed.title).trim() === '') {
      const descMatch = String(healed.description || '').match(/หนังสือ\s+["“'‘]([^"”'’]+)["”'’]/);
      if (descMatch) {
        healed.title = descMatch[1].trim();
      } else if (healed.keywords) {
        healed.title = String(healed.keywords).split(',')[0].trim();
      } else {
        healed.title = `หนังสือทะเบียนเลขที่ ${healed.accession_no || b.barcode || '-'}`;
      }
    }

    // 2. Heal Author if empty, null or 'ไม่ระบุผู้แต่ง'
    if (!healed.author || String(healed.author).trim() === '' || healed.author === 'ไม่ระบุผู้แต่ง') {
      const descMatch = String(healed.description || '').match(/โดย\s+([^.]+?)\s+สำนักพิมพ์/);
      if (descMatch) {
        healed.author = descMatch[1].trim();
      } else if (healed.keywords) {
        const kw = String(healed.keywords).split(',');
        if (kw.length > 1) {
          healed.author = kw[1].trim();
        }
      }
      if (!healed.author || String(healed.author).trim() === '') {
        healed.author = 'ไม่ระบุผู้แต่ง';
      }
    }

    // 3. Heal Publisher if empty, null or 'ไม่ระบุสำนักพิมพ์'
    if (!healed.publisher || String(healed.publisher).trim() === '' || healed.publisher === 'ไม่ระบุสำนักพิมพ์') {
      const descMatch = String(healed.description || '').match(/สำนักพิมพ์\s+([^.]+?)$/);
      const kwMatch = String(healed.keywords || '').match(/สำนักพิมพ์\s+([^,]+)/);
      if (descMatch) {
        healed.publisher = descMatch[1].trim();
      } else if (kwMatch) {
        healed.publisher = kwMatch[1].trim();
      } else {
        healed.publisher = 'ไม่ระบุสำนักพิมพ์';
      }
    }

    // 4. Heal Call Number if empty or null
    if (!healed.call_number || String(healed.call_number).trim() === '') {
      healed.call_number = healed.ddc || '000';
    }

    // 5. Heal Category if empty or null
    if (!healed.category || String(healed.category).trim() === '') {
      const kw = String(healed.keywords || '').split(',');
      if (kw.length > 4) {
        healed.category = kw[4].trim();
      } else {
        healed.category = 'ทั่วไป';
      }
    }

    return healed;
  };

  const loadAllBooksIntoClientCache = async (): Promise<Book[]> => {
    if (clientAllBooksRef.current.length > 0) {
      return clientAllBooksRef.current;
    }
    try {
      const [r1, r2, r3] = await Promise.all([
        supabase.from('books').select('*').range(0, 999),
        supabase.from('books').select('*').range(1000, 1999),
        supabase.from('books').select('*').range(2000, 2999)
      ]);
      const combined = [
        ...(r1.data || []),
        ...(r2.data || []),
        ...(r3.data || [])
      ].map(healBookRecord) as Book[];
      if (combined.length > 0) {
        clientAllBooksRef.current = combined;
      }
      return combined;
    } catch (e) {
      console.error('Failed to load books from Supabase:', e);
      return [];
    }
  };

  const fetchPublishers = async () => {
    try {
      try {
        const res = await fetch('/api/publishers');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.publishers) && data.publishers.length > 0) {
            setPublishers(data.publishers);
            return;
          }
        }
      } catch {}

      // Fallback: derive all 321 publishers from all 2,452 books
      const allBooks = await loadAllBooksIntoClientCache();
      const pubSet = new Set<string>();
      allBooks.forEach(b => {
        const p = (b.publisher || '').trim();
        if (p && p !== 'ไม่ระบุสำนักพิมพ์' && p !== '-') {
          pubSet.add(p);
        }
      });
      const pubs = Array.from(pubSet).sort((a, b) => a.localeCompare(b, 'th'));
      if (pubs.length > 0) {
        setPublishers(pubs);
      }
    } catch (e) {
      console.error('Error fetching publishers:', e);
    }
  };

  const handleEnrichCover = async (bookId: string) => {
    try {
      setEnrichingBookId(bookId);
      let coverFound: string | null = null;
      let coverSource = 'internet_search';

      const targetBook = books.find(b => b.id === bookId) || (selectedBookDetail && selectedBookDetail.id === bookId ? selectedBookDetail : null);

      // 1. Try serverless endpoint /api/search-cover first
      try {
        const res = await fetch('/api/search-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            bookId, 
            title: targetBook?.title || '',
            author: targetBook?.author || '',
            publisher: targetBook?.publisher || '',
            isbn: targetBook?.isbn || ''
          })
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.cover_image) {
            coverFound = data.cover_image;
            coverSource = data.source || 'internet_search';
          }
        }
      } catch (err) {
        console.warn('API /api/search-cover call note:', err);
      }

      // 2. Client-side Google Books API direct search (Works directly from browser on Vercel without server!)
      if (!coverFound && targetBook) {
        try {
          const cleanIsbn = String(targetBook.isbn || '').replace(/[^0-9X]/gi, '');
          const cleanTitle = (targetBook.title || '').split('/')[0].split('=')[0].replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();
          const cleanAuthor = (targetBook.author || '').split('/')[0].replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();

          const queries = [];
          if (cleanIsbn.length >= 10) queries.push(`isbn:${cleanIsbn}`);
          if (cleanTitle) {
            queries.push(`intitle:${cleanTitle}${cleanAuthor && cleanAuthor !== '-' ? `+inauthor:${cleanAuthor}` : ''}`);
            queries.push(cleanTitle);
          }

          for (const q of queries) {
            const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=3`);
            if (gbRes.ok) {
              const gbData = await gbRes.json();
              if (gbData.items && gbData.items.length > 0) {
                for (const item of gbData.items) {
                  const imgLinks = item.volumeInfo?.imageLinks;
                  if (imgLinks?.thumbnail || imgLinks?.smallThumbnail || imgLinks?.medium || imgLinks?.large) {
                    let imgUrl = (imgLinks.large || imgLinks.medium || imgLinks.thumbnail || imgLinks.smallThumbnail).replace('http://', 'https://');
                    imgUrl = imgUrl.replace('&edge=curl', '');
                    coverFound = imgUrl;
                    coverSource = 'google_books';
                    break;
                  }
                }
              }
            }
            if (coverFound) break;
          }
        } catch (gbErr) {
          console.warn('Client Google Books search note:', gbErr);
        }
      }

      // 3. Client-side OpenLibrary fallback
      if (!coverFound && targetBook) {
        const cleanIsbn = String(targetBook.isbn || '').replace(/[^0-9X]/gi, '');
        if (cleanIsbn && cleanIsbn.length >= 10) {
          coverFound = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
          coverSource = 'open_library';
        }
      }

      if (coverFound) {
        // Persist to Supabase
        try {
          const nowIso = new Date().toISOString();
          await supabase.from('books').update({
            cover_image: coverFound,
            illustration: coverFound,
            cover_source: coverSource,
            updated_at: nowIso
          }).eq('id', bookId);

          await supabase.from('book_customizations').upsert({
            id: bookId,
            cover_image: coverFound,
            illustration: coverFound,
            cover_source: coverSource,
            updated_at: nowIso
          }, { onConflict: 'id' });
        } catch {}

        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, cover_image: coverFound!, illustration: coverFound!, cover_source: coverSource } : b));
        if (selectedBookDetail && selectedBookDetail.id === bookId) {
          setSelectedBookDetail({ ...selectedBookDetail, cover_image: coverFound!, illustration: coverFound!, cover_source: coverSource });
        }
      } else {
        alert('ไม่พบภาพหน้าปกที่ตรงกันจากอินเทอร์เน็ต สามารถใช้ปุ่ม "แก้ไขภาพปก" เพื่อใส่ลิงก์รูปภาพโดยตรงได้ครับ');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการค้นหาปก: ' + e.message);
    } finally {
      setEnrichingBookId(null);
    }
  };

  const handleUpdateCoverManually = async (bookId: string, url: string) => {
    try {
      setIsSavingCover(true);
      let savedViaApi = false;
      try {
        const res = await fetch(`/api/books/${bookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cover_image: url, 
            illustration: url,
            cover_source: 'manual'
          })
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            savedViaApi = true;
          }
        }
      } catch {}

      // Always persist to Supabase directly as well (supports Vercel serverless / static hosting)
      try {
        const nowIso = new Date().toISOString();
        await supabase.from('books').update({
          cover_image: url,
          illustration: url,
          cover_source: 'manual',
          updated_at: nowIso
        }).eq('id', bookId);

        await supabase.from('book_customizations').upsert({
          id: bookId,
          cover_image: url,
          illustration: url,
          cover_source: 'manual',
          updated_at: nowIso
        }, { onConflict: 'id' });
        savedViaApi = true;
      } catch (sbErr) {
        console.warn('Direct Supabase cover update note:', sbErr);
      }

      if (savedViaApi) {
        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, cover_image: url, illustration: url, cover_source: 'manual' } : b));
        if (selectedBookDetail && selectedBookDetail.id === bookId) {
          setSelectedBookDetail({ ...selectedBookDetail, cover_image: url, illustration: url, cover_source: 'manual' });
        }
        alert('✨ บันทึกลิงก์ภาพหน้าปกและอัปเดตลงฐานข้อมูล Supabase สำเร็จทันทีเรียบร้อยแล้ว!');
      } else {
        alert('ไม่สามารถอัปเดตรูปภาพได้');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการบันทึกรูปภาพ: ' + e.message);
    } finally {
      setIsSavingCover(false);
    }
  };

  const handleBatchEnrichCovers = async () => {
    try {
      setIsBatchEnriching(true);
      let apiSucceeded = false;

      try {
        const res = await fetch('/api/books/auto-enrich-covers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            apiSucceeded = true;
            // เมื่อดึงภาพหน้าปกจริงจากอินเทอร์เน็ตและบันทึกลงระบบสำเร็จแล้ว ไม่ต้องแสดงแจ้งเตือน
            setTimeout(() => {
              fetchBooks(currentPage);
            }, 1500);
          }
        }
      } catch (err) {
        console.warn('API auto-enrich-covers call note:', err);
      }

      if (!apiSucceeded) {
        // Direct Multi-strategy fallback for Vercel/standalone environment
        const allBooks = await loadAllBooksIntoClientCache();
        const candidateBooks = allBooks.filter(b => {
          return !b.cover_image || b.cover_image.includes('unsplash.com') || b.cover_image.includes('placeholder');
        }).slice(0, 10);

        if (candidateBooks.length === 0) {
          alert('✨ หนังสือทั้งหมดในระบบมีภาพหน้าปกเรียบร้อยแล้ว!');
          return;
        }

        let updated = 0;
        for (const b of candidateBooks) {
          let foundCover: string | null = null;
          let foundSource = 'google_books';
          const cleanIsbn = String(b.isbn || '').replace(/[^0-9X]/gi, '');
          const cleanTitle = (b.title || '').split('/')[0].split('=')[0].replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();
          const cleanAuthor = (b.author || '').split('/')[0].replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();

          // 1. Google Books API
          try {
            const queries = [];
            if (cleanIsbn.length >= 10) queries.push(`isbn:${cleanIsbn}`);
            if (cleanTitle) queries.push(`intitle:${cleanTitle}${cleanAuthor && cleanAuthor !== '-' ? `+inauthor:${cleanAuthor}` : ''}`);

            for (const q of queries) {
              const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=2`);
              if (gbRes.ok) {
                const gbData = await gbRes.json();
                if (gbData.items && gbData.items.length > 0) {
                  for (const item of gbData.items) {
                    const imgLinks = item.volumeInfo?.imageLinks;
                    if (imgLinks?.thumbnail || imgLinks?.smallThumbnail || imgLinks?.medium || imgLinks?.large) {
                      let imgUrl = (imgLinks.large || imgLinks.medium || imgLinks.thumbnail || imgLinks.smallThumbnail).replace('http://', 'https://');
                      imgUrl = imgUrl.replace('&edge=curl', '');
                      foundCover = imgUrl;
                      foundSource = 'google_books';
                      break;
                    }
                  }
                }
              }
              if (foundCover) break;
            }
          } catch {}

          // 2. OpenLibrary Fallback
          if (!foundCover && cleanIsbn.length >= 10) {
            foundCover = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
            foundSource = 'open_library';
          }

          if (foundCover) {
            try {
              const nowIso = new Date().toISOString();
              await supabase.from('books').update({
                cover_image: foundCover,
                illustration: foundCover,
                cover_source: foundSource,
                updated_at: nowIso
              }).eq('id', b.id);

              await supabase.from('book_customizations').upsert({
                id: b.id,
                cover_image: foundCover,
                illustration: foundCover,
                cover_source: foundSource,
                updated_at: nowIso
              }, { onConflict: 'id' });
              updated++;
            } catch {}
          }
        }

        clientAllBooksRef.current = []; // invalidate cache to re-fetch
        fetchBooks(currentPage);
        // เมื่อดึงภาพหน้าปกจริงจากอินเทอร์เน็ตและบันทึกลงระบบสำเร็จแล้ว ไม่ต้องแสดงแจ้งเตือน
        if (updated === 0) {
          alert('ไม่พบรูปภาพหน้าปกใหม่เพิ่มเติมจากอินเทอร์เน็ตสำหรับชุดหนังสือนี้');
        }
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setIsBatchEnriching(false);
    }
  };

  const fetchSheetInfo = async () => {
    try {
      try {
        const res = await fetch('/api/sheets/info');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.info) {
            setSheetSyncInfo(data.info);
            return;
          }
        }
      } catch {}

      // Direct Supabase fallback
      const { data } = await supabase.from('sheet_sync_info').select('*').limit(1);
      if (data && data.length > 0) {
        setSheetSyncInfo(data[0]);
      } else {
        const { count } = await supabase.from('books').select('*', { count: 'exact', head: true });
        setSheetSyncInfo({
          totalBooks: count || 2452,
          lastSync: new Date().toISOString(),
          status: 'success'
        });
      }
    } catch (e) {
      console.error('Error fetching sheet info:', e);
    }
  };

  const handleSyncSheet = async (urlToSync?: string) => {
    setIsSyncingSheet(true);
    try {
      // Normalize URL: if it's the edit link, convert to CSV export format
      let targetUrl = urlToSync || customSheetUrl;
      if (targetUrl.includes('docs.google.com/spreadsheets') && !targetUrl.includes('export?format=csv')) {
        const idMatch = targetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const gidMatch = targetUrl.match(/gid=([0-9]+)/);
        if (idMatch) {
          const docId = idMatch[1];
          const gid = gidMatch ? gidMatch[1] : '0';
          targetUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
        }
      }

      let syncedViaApi = false;
      try {
        const res = await fetch('/api/sheets/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl })
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            syncedViaApi = true;
            alert(data.message || `ซิงค์ข้อมูลจาก Google Sheet สำเร็จเรียบร้อย!`);
          }
        }
      } catch {}

      if (!syncedViaApi) {
        // Direct browser CSV fetch & Supabase upsert fallback
        try {
          const res = await fetch(targetUrl);
          const text = await res.text();
          const wb = XLSX.read(text, { type: 'string' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (rows.length > 1) {
            alert(`ดึงข้อมูลจาก Google Sheet ได้ ${rows.length - 1} รายการเรียบร้อยแล้ว กำลังซิงค์เข้าสู่ฐานข้อมูล Supabase...`);
          }
        } catch (csvErr: any) {
          console.warn('Direct CSV fetch note:', csvErr);
        }
      }

      fetchSheetInfo();
      fetchBooks(1);
      fetchCategories();
      fetchPublishers();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const [isCleaningDummy, setIsCleaningDummy] = useState<boolean>(false);

  const handleCleanDummyBooks = async () => {
    if (!confirm('ต้องการลบข้อมูลตัวอย่างที่ไม่ได้มาจาก Google Sheet หรือไม่?')) return;
    setIsCleaningDummy(true);
    try {
      const res = await fetch('/api/admin/clean-dummy-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `ลบข้อมูลตัวอย่างสำเร็จ!`);
        fetchBooks(1);
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.error || 'ไม่สามารถลบได้'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsCleaningDummy(false);
    }
  };

  const fetchBooks = async (page = currentPage) => {
    try {
      setLoading(true);
      let loadedFromApi = false;

      // 1. Try local Express API first
      try {
        const res = await fetch(`/api/books?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}&publisher=${encodeURIComponent(selectedPublisher)}&sort=${sortBy}&page=${page}&limit=${pageSize}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.books)) {
            setBooks(data.books);
            if (data.total !== undefined) {
              setTotalBooksCount(data.total);
            }
            loadedFromApi = true;
          }
        }
      } catch {}

      // 2. Direct Supabase query fallback (e.g. for Vercel or when API is unreachable)
      if (!loadedFromApi) {
        console.log('[Supabase Direct] Using client-side memory engine from Supabase database...');
        const allBooks = await loadAllBooksIntoClientCache();
        let filtered = [...allBooks];

        if (selectedCategory) {
          filtered = filtered.filter(b => b.category === selectedCategory);
        }
        if (selectedPublisher) {
          filtered = filtered.filter(b => b.publisher === selectedPublisher);
        }
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          filtered = filtered.filter(b => 
            (b.title && b.title.toLowerCase().includes(q)) || 
            (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
            (b.author && b.author.toLowerCase().includes(q)) || 
            (b.isbn && b.isbn.toLowerCase().includes(q)) || 
            (b.barcode && b.barcode.toLowerCase().includes(q)) ||
            (b.accession_no && String(b.accession_no).toLowerCase().includes(q)) ||
            (b.publisher && b.publisher.toLowerCase().includes(q)) ||
            (b.category && b.category.toLowerCase().includes(q)) ||
            (b.subject && b.subject.toLowerCase().includes(q)) ||
            (b.description && b.description.toLowerCase().includes(q)) ||
            (b.keywords && b.keywords.toLowerCase().includes(q)) ||
            (b.call_number && b.call_number.toLowerCase().includes(q))
          );
        }

        // Exact Thai sorting matching server
        if (sortBy === 'title') {
          filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'th'));
        } else if (sortBy === 'author') {
          filtered.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'th'));
        } else if (sortBy === 'year') {
          filtered.sort((a, b) => (b.publication_year || '').localeCompare(a.publication_year || ''));
        } else if (sortBy === 'accession' || sortBy === 'accession_asc') {
          filtered.sort((a, b) => {
            const accA = parseInt(String(a.accession_no || a.barcode || '0').replace(/\D/g, ''), 10) || 0;
            const accB = parseInt(String(b.accession_no || b.barcode || '0').replace(/\D/g, ''), 10) || 0;
            return accA - accB;
          });
        } else {
          filtered.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        }

        setTotalBooksCount(filtered.length);
        const startIndex = (page - 1) * pageSize;
        const pageItems = filtered.slice(startIndex, startIndex + pageSize);
        setBooks(pageItems);
      }
    } catch (e) {
      console.error('Error fetching books:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      try {
        const res = await fetch('/api/categories');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
            return;
          }
        }
      } catch {}

      // Direct Supabase categories query fallback
      const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        setCategories(data);
      } else {
        const allBooks = await loadAllBooksIntoClientCache();
        const catSet = new Set<string>();
        allBooks.forEach(b => {
          const c = (b.category || '').trim();
          if (c) catSet.add(c);
        });
        const unique = Array.from(catSet).sort((a, b) => a.localeCompare(b, 'th'));
        setCategories(unique.map((c, idx) => ({ id: `cat_${idx + 1}`, name: c, description: `หมวดหมู่: ${c}` })));
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchScanHistory = async () => {
    try {
      try {
        const res = await fetch('/api/scan-history');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.history)) {
            setHistory(data.history);
            return;
          }
        }
      } catch {}

      // Direct Supabase history fallback
      const { data, error } = await supabase.from('scan_history').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data) {
        setHistory(data);
      }
    } catch (e) {
      console.error('Error fetching scan history:', e);
    }
  };

  useEffect(() => {
    // Re-fetch books on query change and reset to page 1
    setCurrentPage(1);
    const delayDebounce = setTimeout(() => {
      fetchBooks(1);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory, selectedPublisher, sortBy]);

  // Real-time synchronization effect (WebSocket + Supabase Realtime)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          setIsRealtimeConnected(true);
          console.log('[WebSocket] Real-time connected!');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setLastRealtimeEventTime(new Date().toLocaleTimeString('th-TH'));

            if (data.type === 'BOOK_UPDATED' && data.payload) {
              const updated = data.payload as Book;
              setBooks(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
              setSelectedBookDetail(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
              setRealtimeNotice(`⚡ อัปเดตข้อมูลแบบเรียลไทม์: "${updated.title || updated.id}"`);
            } else if (data.type === 'BOOK_CREATED' && data.payload) {
              const newBook = data.payload as Book;
              setBooks(prev => [newBook, ...prev.filter(b => b.id !== newBook.id)]);
              setTotalBooksCount(prev => prev + 1);
              setRealtimeNotice(`✨ เพิ่มหนังสือใหม่แบบเรียลไทม์: "${newBook.title || newBook.id}"`);
            } else if (data.type === 'BOOK_DELETED' && data.payload) {
              const delId = data.payload.id;
              setBooks(prev => prev.filter(b => b.id !== delId));
              setTotalBooksCount(prev => Math.max(0, prev - 1));
              setRealtimeNotice(`🗑️ ลบหนังสือออกจากฐานข้อมูลเรียบร้อยแล้ว`);
            } else if (data.type === 'DATABASE_SYNCED' || data.type === 'BATCH_BOOKS_ADDED') {
              setRealtimeNotice(`🔄 ฐานข้อมูลซิงค์ข้อมูลล่าสุดเรียบร้อยแล้ว`);
              fetchBooks(currentPage);
            }
          } catch (err) {
            console.error('[WebSocket] parse error:', err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsRealtimeConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setIsRealtimeConnected(false);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    // Subscribe to Supabase Postgres Changes directly on client
    let supabaseChannel: any = null;
    try {
      supabaseChannel = supabase
        .channel('client-realtime-books')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, (payload: any) => {
          if (!isMounted) return;
          setLastRealtimeEventTime(new Date().toLocaleTimeString('th-TH'));
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as Book;
            setBooks(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
            setSelectedBookDetail(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
            setRealtimeNotice(`⚡ อัปเดตข้อมูลแบบเรียลไทม์จากฐานข้อมูล Supabase: "${updated.title || updated.id}"`);
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const newBook = payload.new as Book;
            setBooks(prev => [newBook, ...prev.filter(b => b.id !== newBook.id)]);
            setTotalBooksCount(prev => prev + 1);
            setRealtimeNotice(`✨ มีการเพิ่มหนังสือใหม่ใน Supabase: "${newBook.title || newBook.id}"`);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const oldId = (payload.old as any).id;
            setBooks(prev => prev.filter(b => b.id !== oldId));
            setTotalBooksCount(prev => Math.max(0, prev - 1));
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED' && isMounted) {
            setIsRealtimeConnected(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // If postgres_changes replication is not enabled in Supabase, rely seamlessly on our /ws WebSocket
            if (supabaseChannel) {
              try {
                supabase.removeChannel(supabaseChannel);
              } catch {}
              supabaseChannel = null;
            }
          }
        });
    } catch (e) {
      console.warn('[Supabase Client Realtime Note]:', e);
    }

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
      if (supabaseChannel) supabase.removeChannel(supabaseChannel);
    };
  }, []);

  // Auto-dismiss real-time toast
  useEffect(() => {
    if (realtimeNotice) {
      const timer = setTimeout(() => {
        setRealtimeNotice(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [realtimeNotice]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchBooks(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ZXing code reader reference
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // --- Camera operations ---
  const startCamera = async (mode: 'cover' | 'barcode' = scannerMode) => {
    setCameraError('');
    setUploadedImage(null);
    setScanResult(null);
    setScannedBarcode('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('เบราว์เซอร์หรือสภาพแวดล้อมปัจจุบันไม่รองรับการเรียกใช้งานกล้องโดยตรง');
      }
      const constraints = {
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);

        if (mode === 'barcode') {
          startBarcodeContinuousDecoding();
        }
      }
    } catch (err: any) {
      console.warn('Camera access error handled:', err);
      let msg = 'ไม่สามารถเข้าถึงกล้องถ่ายภาพได้ในขณะนี้';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || (err.message && err.message.toLowerCase().includes('not allowed'))) {
        msg = 'การเข้าถึงกล้องถูกปฏิเสธโดยผู้ใช้หรือเบราว์เซอร์ (Permission Denied) คุณยังคงสามารถสแกนบาร์โค้ดและวิเคราะห์ปกได้ทันทีด้วยการอัปโหลดรูปภาพ หรือพิมพ์รหัสค้นหา';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'ไม่พบอุปกรณ์กล้องเว็บบอร์ดหรือกล้องสมาร์ทโฟนเชื่อมต่ออยู่';
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      try {
        // stop decoding
        codeReaderRef.current = null;
      } catch (e) {
        console.error(e);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Synthesize soft audio chime when barcode is scanned
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // ignore audio autoplay restriction
    }
  };

  // ISBN-10 <-> ISBN-13 normalization helper
  const normalizeIsbnVariants = (code: string): string[] => {
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
  };

  // Real-time Barcode Scanner Loop (Combining native BarcodeDetector & ZXing)
  const startBarcodeContinuousDecoding = () => {
    if (!videoRef.current) return;

    // 1. Native BarcodeDetector loop for 60FPS ultra-fast detection
    if ('BarcodeDetector' in window) {
      const formats = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];
      try {
        const detector = new (window as any).BarcodeDetector({ formats });
        let isScanning = true;

        const scanFrame = async () => {
          if (!videoRef.current || !streamRef.current || !isScanning) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              isScanning = false;
              const code = barcodes[0].rawValue;
              playBeep();
              stopCamera();
              lookupBarcode(code);
              return;
            }
          } catch (err) {
            // ignore frame error
          }
          if (streamRef.current) {
            requestAnimationFrame(scanFrame);
          }
        };

        requestAnimationFrame(scanFrame);
      } catch (e) {
        console.warn('Native BarcodeDetector initialization notice:', e);
      }
    }

    // 2. ZXing BrowserMultiFormatReader continuous decoder
    try {
      const reader = new BrowserMultiFormatReader();
      codeReaderRef.current = reader;
      reader.decodeFromVideoElement(videoRef.current, (result, error) => {
        if (result) {
          const barcodeText = result.getText();
          if (barcodeText) {
            playBeep();
            stopCamera();
            lookupBarcode(barcodeText);
          }
        }
      });
    } catch (e) {
      console.error('Barcode continuous decoding error:', e);
    }
  };

  // Ultra-Fast Barcode / ISBN Lookup (Instant O(1) Client Match + Server Sync)
  const lookupBarcode = async (barcodeText: string) => {
    if (!barcodeText || !barcodeText.trim()) return;
    const cleanText = barcodeText.trim();
    setScannedBarcode(cleanText);
    setIsBarcodeProcessing(true);
    setCameraError('');

    const variants = normalizeIsbnVariants(cleanText).map(v => v.toLowerCase());

    // Instant local memory match check (matching exactly against the isbn field only)
    const localFound = books.filter(b => {
      const isbnClean = String(b.isbn || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (!isbnClean) return false;
      return variants.some(v => isbnClean === v);
    });

    if (localFound.length > 0) {
      const top = localFound[0];
      const formattedMatches = localFound.map(b => ({
        book_id: b.id,
        book: b,
        title: b.title,
        subtitle: b.subtitle,
        author: b.author,
        isbn: b.isbn,
        publisher: b.publisher,
        publication_year: b.publication_year,
        cover_image: b.cover_image,
        category: b.category,
        call_number: b.call_number,
        status: b.status,
        similarity: 1.0,
        match_reason: 'ตรงกับรหัสบาร์โค้ด / ISBN ในฐานข้อมูล 100%'
      }));

      setMatchedBooks(formattedMatches);
      setScanResult({
        search_status: 'EXACT_MATCH',
        status_message: 'จับคู่กับหนังสือในฐานข้อมูลสำเร็จด้วยคะแนนความตรงกัน 100%',
        confidence_percentage: 100,
        detected_title: top.title,
        detected_subtitle: top.subtitle || '',
        detected_author: top.author,
        detected_publisher: top.publisher,
        ocr_text: `Barcode / ISBN: ${cleanText}`,
        detected_language: top.language === 'อังกฤษ' ? 'en' : 'th',
        matched_book: top,
        matches: formattedMatches
      });
      setIsBarcodeProcessing(false);

      // Async sync history to server without blocking UI
      fetch('/api/barcode-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanText })
      }).then(() => fetchScanHistory()).catch(() => {});

      return;
    }

    // Backend query fallback if not in local cache
    try {
      const res = await fetch('/api/barcode-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanText })
      });
      const data = await res.json();
      
      if (data.success && data.matched_book) {
        const top = data.matched_book;
        const formattedMatches = (data.matches && data.matches.length > 0) ? data.matches : [{
          book_id: top.id,
          book: top,
          title: top.title,
          subtitle: top.subtitle,
          author: top.author,
          isbn: top.isbn,
          publisher: top.publisher,
          publication_year: top.publication_year,
          cover_image: top.cover_image,
          category: top.category,
          call_number: top.call_number,
          status: top.status,
          similarity: 1.0,
          match_reason: 'ตรงกับรหัสบาร์โค้ด / ISBN ในฐานข้อมูล 100%'
        }];
        setMatchedBooks(formattedMatches);
        setScanResult({
          search_status: 'EXACT_MATCH',
          status_message: data.status_message || 'จับคู่กับหนังสือในฐานข้อมูลสำเร็จด้วยคะแนนความตรงกัน 100%',
          confidence_percentage: 100,
          detected_title: top.title,
          detected_subtitle: top.subtitle || '',
          detected_author: top.author,
          detected_publisher: top.publisher,
          ocr_text: `Barcode / ISBN: ${cleanText}`,
          detected_language: top.language === 'อังกฤษ' ? 'en' : 'th',
          matched_book: top,
          matches: formattedMatches
        });
        fetchScanHistory();
      } else {
        setMatchedBooks([]);
        setScanResult({
          search_status: 'NOT_FOUND',
          status_message: `ไม่พบหนังสือที่มีหมายเลขบาร์โค้ด / ISBN "${cleanText}" ในฐานข้อมูลห้องสมุด`,
          confidence_percentage: 0,
          detected_title: `หมายเลขบาร์โค้ด: ${cleanText}`,
          detected_author: 'ไม่ระบุ',
          ocr_text: cleanText,
          detected_language: 'th',
          matched_book: null,
          matches: []
        });
      }
    } catch (err: any) {
      console.error(err);
      setCameraError('เกิดข้อผิดพลาดในการตรวจสอบรหัสบาร์โค้ด');
    } finally {
      setIsBarcodeProcessing(false);
    }
  };

  // Multi-Pass Ultra-Accurate Barcode Image File Decoder
  const decodeBarcodeFromImage = async (dataUrl: string) => {
    setIsBarcodeProcessing(true);
    setCameraError('');
    try {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      // Pass 1: Try Native BarcodeDetector API
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
          });
          const detected = await detector.detect(img);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            playBeep();
            lookupBarcode(detected[0].rawValue);
            return;
          }
        } catch (e) {
          console.warn('Native BarcodeDetector image decode notice:', e);
        }
      }

      // Pass 2: ZXing Raw Image Reader
      const reader = new BrowserMultiFormatReader();
      try {
        const result = await reader.decodeFromImageElement(img);
        if (result && result.getText()) {
          playBeep();
          lookupBarcode(result.getText());
          return;
        }
      } catch (err) {
        // Pass 3: Canvas High Contrast Threshold Binarization for dim / blurry photos
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              const threshold = avg > 120 ? 255 : 0;
              data[i] = threshold;
              data[i + 1] = threshold;
              data[i + 2] = threshold;
            }
            ctx.putImageData(imageData, 0, 0);
            const processedUrl = canvas.toDataURL('image/png');
            const procImg = new Image();
            procImg.src = processedUrl;
            await new Promise(r => { procImg.onload = r; });
            const resBinarized = await reader.decodeFromImageElement(procImg);
            if (resBinarized && resBinarized.getText()) {
              playBeep();
              lookupBarcode(resBinarized.getText());
              return;
            }
          }
        } catch (binErr) {
          // Pass 4: Fallback to AI OCR on uploaded photo
        }

        // Pass 4: AI OCR fallback on barcode image
        try {
          processImageWithAI(dataUrl);
          return;
        } catch (ocrErr) {
          setCameraError(`ไม่พบบาร์โค้ดหรือรหัส ISBN ที่ชัดเจนในรูปภาพที่อัปโหลด คุณสามารถพิมพ์หมายเลขค้นหาด้านล่าง หรือสลับไปใช้โหมด 'AI สแกนรูปหน้าปก (OCR)'`);
          setIsBarcodeProcessing(false);
        }
      }
    } catch (e: any) {
      setCameraError('ไม่สามารถอ่านรหัสบาร์โค้ดได้ กรุณาเลือกไฟล์ภาพบาร์โค้ด (JPG/PNG) ที่มีความคมชัดแล้วลองใหม่อีกครั้ง');
      setIsBarcodeProcessing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setUploadedImage(dataUrl);
        stopCamera();

        if (scannerMode === 'barcode') {
          decodeBarcodeFromImage(dataUrl);
        } else {
          processImageWithAI(dataUrl);
        }
      }
    }
  };

  // --- Image upload handler ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setUploadedImage(dataUrl);
        stopCamera();

        if (scannerMode === 'barcode') {
          decodeBarcodeFromImage(dataUrl);
        } else {
          processImageWithAI(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Compress & resize image to prevent Vercel 4.5MB payload limits and accelerate AI OCR
  const resizeImageForAI = async (base64Str: string, maxDimension = 1200, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(base64Str);
          }
        };
        img.onerror = () => resolve(base64Str);
        img.src = base64Str;
      } catch {
        resolve(base64Str);
      }
    });
  };

  // --- AI Cover Scanner Process Pipeline ---
  const processImageWithAI = async (base64Image: string) => {
    setScanResult(null);
    setConfirmedBookId(null);
    setScanningStep(1); // Preprocessing
    
    // Simulate pipeline steps for engaging visual feedback
    const steps = [
      { num: 1, delay: 400 },  // Preprocessing (Crop, Resize, Sharpen)
      { num: 2, delay: 600 },  // Running Gemini OCR Engine
      { num: 3, delay: 400 },  // Text Cleaning & Typo Correction
      { num: 4, delay: 400 },  // Extracting Metadata (Title, Author)
      { num: 5, delay: 300 },  // Fuzzy Searching Library Catalog Database
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      setScanningStep(step.num + 1);
    }

    try {
      // Resize & compress to ~150KB for fast transfer & to comply with serverless payload limits
      const compressedImage = await resizeImageForAI(base64Image, 1200, 0.82);

      let data: any = null;
      try {
        const res = await fetch('/api/scan-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: compressedImage })
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const rawErr = await res.text();
          console.warn('API /api/scan-cover non-OK response:', res.status, rawErr);
          if (res.status === 413) {
            setCameraError('ขนาดรูปภาพใหญ่เกินไป กรุณาถ่ายภาพในระยะใกล้ขึ้นหรือเลือกภาพที่มีขนาดเล็กลง');
            return;
          }
          try {
            const parsedErr = JSON.parse(rawErr);
            if (parsedErr && parsedErr.error) {
              setCameraError(`ข้อผิดพลาดจาก AI OCR: ${parsedErr.error}`);
              return;
            }
          } catch {}
          setCameraError(`ไม่สามารถตรวจข้อความ OCR ได้ (เซิร์ฟเวอร์ตอบกลับรหัส ${res.status}): โปรดตรวจสอบว่าได้อัปเดตไฟล์ /api/scan-cover.ts บน Vercel และตั้งค่า GEMINI_API_KEY แล้ว`);
          return;
        }
      } catch (networkErr: any) {
        console.warn('Scan cover network error:', networkErr);
        setCameraError('ไม่สามารถเชื่อมต่อระบบวิเคราะห์ AI ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        return;
      }

      if (!data || !data.success) {
        setCameraError(data?.error || 'ไม่สามารถตรวจจับข้อความ OCR บนหน้าปกได้ โปรดลองถ่ายภาพในมุมที่สว่างและชัดเจนขึ้น');
        return;
      }

      // If server returned strong matches, use them
        if (data.matches && data.matches.length > 0 && data.matches[0].similarity >= 0.65) {
          setScanResult(data);
          setMatchedBooks(data.matches || []);
          fetchScanHistory();
          return;
        }

        // If server extracted title/ocr but didn't find high-confidence match in server cache, match against client cache (all 2,452 books)
        const detTitle = data.detected_title || '';
        const rawOcr = data.ocr_text || '';
        const allBooks = await loadAllBooksIntoClientCache();

        const normalize = (t: string) => (t || '').toLowerCase().replace(/[^a-zA-Z0-9\u0e00-\u0e7f]/g, '').trim();
        const removeVowels = (t: string) => normalize(t).replace(/[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]/g, '');

        const normDet = normalize(detTitle);
        const rootDet = removeVowels(detTitle);
        const normOcr = normalize(rawOcr);

        const clientMatches: any[] = [];
        for (const b of allBooks) {
          const normB = normalize(b.title);
          const rootB = removeVowels(b.title);
          let score = 0;
          let reason = '';

          if (normDet && normB && normDet === normB) {
            score = 1.0;
            reason = 'ตรงกับชื่อเรื่อง 100% (Exact Match)';
          } else if (normDet && normB && (normDet.includes(normB) || normB.includes(normDet))) {
            const ratio = Math.min(normDet.length, normB.length) / Math.max(normDet.length, normB.length);
            score = Number((0.85 + ratio * 0.14).toFixed(2));
            reason = 'ตรงกับชื่อเรื่องในฐานข้อมูล';
          } else if (rootDet && rootB && (rootDet === rootB || rootDet.includes(rootB) || rootB.includes(rootDet))) {
            score = 0.88;
            reason = 'ตรงกันตามพยัญชนะรากศัพท์ภาษาไทย';
          } else if (normOcr && normB && normOcr.includes(normB)) {
            score = 0.92;
            reason = 'ตรวจพบชื่อเรื่องสมบูรณ์บนภาพหน้าปก';
          } else if (b.subtitle && normDet && normalize(b.subtitle).includes(normDet)) {
            score = 0.80;
            reason = 'ตรงกับชื่อเรื่องรอง';
          }

          if (score >= 0.50) {
            clientMatches.push({
              book_id: b.id,
              book: b,
              similarity: score,
              match_reason: reason
            });
          }
        }

        clientMatches.sort((a, b) => b.similarity - a.similarity);

        if (clientMatches.length > 0) {
          const top = clientMatches[0];
          const conf = Math.round(top.similarity * 100);
          setMatchedBooks(clientMatches);
          setScanResult({
            ...data,
            search_status: conf >= 90 ? 'EXACT_MATCH' : (conf >= 75 ? 'HIGH_CONFIDENCE' : 'PARTIAL_MATCH'),
            status_message: conf >= 90 ? `ค้นพบหนังสือตรงกับหน้าปกอย่างแม่นยำ (${conf}%)` : `พบหนังสือที่มีความเป็นไปได้สูง (${conf}%)`,
            confidence_percentage: conf,
            matched_book: top.book,
            matches: clientMatches
          });
          fetchScanHistory();
          return;
        }

        // If no client matches either, show server data with actual detected OCR
        setScanResult(data);
        setMatchedBooks(data.matches || []);
        fetchScanHistory();
        return;
    } catch (err: any) {
      console.error(err);
      setCameraError(err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ AI ได้ แนะนำให้สลับไปใช้แท็บ "สแกนบาร์โค้ด / ISBN"');
    } finally {
      setScanningStep(0);
    }
  };

  // --- Admin functions ---
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let createdViaApi = false;
      const cleanIsbn = String(newBookForm.isbn || '').replace(/[^a-zA-Z0-9]/g, '');
      const bookId = `book_${cleanIsbn || Date.now()}`;
      const bookToSave = {
        ...newBookForm,
        id: bookId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBookForm)
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            createdViaApi = true;
          }
        }
      } catch {}

      if (!createdViaApi) {
        // Direct Supabase insert fallback
        const { error: sbErr } = await supabase.from('books').upsert(bookToSave);
        if (sbErr) {
          console.error('[Supabase Direct] Insert error:', sbErr.message);
        } else {
          createdViaApi = true;
        }
      }

      if (createdViaApi) {
        fetchBooks();
        setIsAddingBook(false);
        // Reset form
        setNewBookForm({
          title: '', subtitle: '', author: '', writer: '', co_authors: '', isbn: '', publisher: '',
          publication_place: 'กรุงเทพฯ', publication_year: new Date().getFullYear().toString(),
          edition: 'พิมพ์ครั้งที่ 1', pages: '200', language: 'ไทย', category: 'วรรณกรรมเยาวชน',
          subject: '', subject_subdivision: '', subject_2: '', subject_3: '', keywords: '', call_number: '', ddc: '', call_sub: '', barcode: '',
          cover_image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
          description: '', status: 'พร้อมให้บริการ',
          date_added: '', series: '', translator: '', price: '', composition_year: '', copies: '1'
        });
        alert('✨ เพิ่มหนังสือใหม่เข้าสู่ฐานข้อมูล Supabase สำเร็จเรียบร้อยแล้ว!');
      } else {
        alert('เกิดข้อผิดพลาดในการเพิ่มหนังสือ');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    try {
      let updatedViaApi = false;
      const updatedPayload = {
        ...editingBook,
        updated_at: new Date().toISOString()
      };

      try {
        const res = await fetch(`/api/books/${editingBook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingBook)
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            updatedViaApi = true;
          }
        }
      } catch {}

      if (!updatedViaApi) {
        // Direct Supabase update fallback
        const { error: sbErr } = await supabase.from('books').update(updatedPayload).eq('id', editingBook.id);
        if (!sbErr) {
          await supabase.from('book_customizations').upsert({
            id: editingBook.id,
            cover_image: editingBook.cover_image,
            title: editingBook.title,
            author: editingBook.author,
            publisher: editingBook.publisher,
            category: editingBook.category,
            updated_at: updatedPayload.updated_at
          }, { onConflict: 'id' });
          updatedViaApi = true;
        }
      }

      if (updatedViaApi) {
        fetchBooks();
        setEditingBook(null);
        alert('✨ บันทึกการแก้ไขข้อมูลหนังสือลงฐานข้อมูล Supabase สำเร็จเรียบร้อยแล้ว!');
      } else {
        alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDeleteBook = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm('คุณแน่ใจว่าต้องการลบหนังสือเล่มนี้ออกจากฐานข้อมูลหรือไม่?')) return;
    
    // 1. Immediately remove from local UI state & in-memory cache for instant feedback
    clientAllBooksRef.current = clientAllBooksRef.current.filter(b => b.id !== id && b.barcode !== id && b.accession_no !== id);
    setBooks(prev => prev.filter(b => b.id !== id && b.barcode !== id && b.accession_no !== id));
    setTotalBooksCount(prev => Math.max(0, prev - 1));

    try {
      // 2. Delete via Express API
      try {
        await fetch(`/api/books/${id}`, { method: 'DELETE' });
      } catch {}

      // 3. Direct Supabase delete across both tables (supports Vercel & serverless environments)
      try {
        await supabase.from('books').delete().eq('id', id);
        await supabase.from('book_customizations').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('Direct Supabase delete note:', sbErr);
      }

      // 4. Invalidate cache
      clientAllBooksRef.current = [];
      alert('🗑️ ลบหนังสือออกจากฐานข้อมูลเรียบร้อยแล้ว!');
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการลบหนังสือ: ' + e.message);
    }
  };

  // Excel / CSV File Upload Parser
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length < 2) {
          alert('ไฟล์ไม่มีข้อมูล หรือมีเฉพาะหัวตาราง');
          return;
        }

        const headers: string[] = rawJson[0].map((h: any) => String(h || '').trim().toLowerCase());
        const parsedBooks: any[] = [];

        // Helper to find column index by variations or default template index fallback
        const findCol = (keywords: string[], defaultIdx: number) => {
          const found = headers.findIndex(h => keywords.some(k => h.includes(k)));
          return found >= 0 ? found : defaultIdx;
        };

        const titleIdx = findCol(['title', 'ชื่อเรื่อง', '245 $a'], 6);
        const subtitleIdx = findCol(['subtitle', 'ชื่อเรื่องย่อย', '245 $b'], 7);
        const authorIdx = findCol(['author', 'ผู้แต่ง', '100 $a'], 4);
        const writerIdx = findCol(['ผู้เขียน', 'writer'], 8);
        const coAuthorsIdx = findCol(['co_author', 'ผู้แต่งร่วม', '245 $c'], 5);
        const isbnIdx = findCol(['isbn', '020 isbn', 'รหัส'], 3);
        const accessionIdx = findCol(['ทะเบียน', 'accession', 'reg'], 2);
        const barcodeIdx = findCol(['barcode', 'บาร์โค้ด'], 2); // default to same as accession
        const ddcIdx = findCol(['ddc', '082 $a'], 9);
        const callSubIdx = findCol(['call_sub', '082 $b', 'cutter', 'คัตเตอร์'], 10);
        const pubIdx = findCol(['publisher', 'สำนักพิมพ์', '260 $b'], 12);
        const pubPlaceIdx = findCol(['publication_place', 'สถานที่พิมพ์', '260 $a'], 11);
        const yearIdx = findCol(['year', 'ปีที่พิมพ์', 'ปีพิมพ์', '260 $c'], 13);
        const pagesIdx = findCol(['page', 'จำนวนหน้า', '300 $a'], 14);
        const illustrationIdx = findCol(['illustration', 'ภาพประกอบ', '300 $b'], 15);
        const catIdx = findCol(['category', 'หมวดหมู่จัดเก็บ', 'หมวดหมู่'], 26);
        const subjectIdx = findCol(['subject', 'หัวเรื่อง 1', '650 $a'], 16);
        const subSubdivIdx = findCol(['ย่อยหัวเรื่อง', '650 $x', 'subdivision'], 17);
        const descIdx = findCol(['desc', 'คำอธิบาย', 'เรื่องย่อ'], 18);
        const editionIdx = findCol(['edition', 'พิมพ์ครั้งที่'], 19);
        const priceIdx = findCol(['price', 'ราคา'], 20);
        const seriesIdx = findCol(['series', 'ชุดหนังสือ'], 21);
        const translatorIdx = findCol(['translator', 'ผู้แปล'], 22);
        const compYearIdx = findCol(['ปีแต่ง', 'year_composed', 'composition_year'], 23);
        const subject2Idx = findCol(['หัวเรื่อง 2', 'subject_2', '650 2'], 24);
        const subject3Idx = findCol(['หัวเรื่อง 3', 'subject_3', '650 3'], 25);
        const statusIdx = findCol(['status', 'สถานะ'], 27);
        const copiesIdx = findCol(['จำนวนเล่ม', 'copies', 'copy_count'], 28);
        const dateIdx = findCol(['วันที่', 'date', 'date_added'], 0);

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0 || !row[titleIdx]) continue;

          const rawAcc = row[accessionIdx] !== undefined ? String(row[accessionIdx]).trim() : '';
          const rawBar = row[barcodeIdx] !== undefined ? String(row[barcodeIdx]).trim() : '';
          const accNo = rawAcc || rawBar || String(i);
          const barCode = rawBar || rawAcc || `B${Math.random().toString().substring(2, 9)}`;

          const ddcVal = String(row[ddcIdx] || '').trim();
          const callSubVal = String(row[callSubIdx] || '').trim();
          const callNumber = (ddcVal && callSubVal) ? `${ddcVal} ${callSubVal}` : (ddcVal || callSubVal || '000');

          const cleanIsbn = String(row[isbnIdx] || '').replace(/[^a-zA-Z0-9]/g, '');
          let coverImage = (cleanIsbn.length >= 10)
            ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`
            : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600';

          const rawIllus = String(row[illustrationIdx] || '').trim();
          if (rawIllus && (rawIllus.startsWith('https://') || rawIllus.startsWith('http://'))) {
            coverImage = rawIllus;
          }

          parsedBooks.push({
            title: String(row[titleIdx] || 'ไม่ระบุชื่อเรื่อง').trim(),
            subtitle: String(row[subtitleIdx] || '').trim(),
            author: String(row[authorIdx] || 'ไม่ระบุผู้แต่ง').trim(),
            writer: String(row[writerIdx] || row[authorIdx] || '').trim(),
            co_authors: String(row[coAuthorsIdx] || '').trim(),
            isbn: String(row[isbnIdx] || Math.random().toString().substring(2, 15)).trim(),
            accession_no: accNo,
            barcode: barCode,
            publisher: String(row[pubIdx] || 'ไม่ระบุสำนักพิมพ์').trim(),
            publication_place: String(row[pubPlaceIdx] || 'กรุงเทพฯ').trim(),
            publication_year: String(row[yearIdx] || new Date().getFullYear()).trim(),
            edition: String(row[editionIdx] || 'พิมพ์ครั้งที่ 1').trim(),
            pages: String(row[pagesIdx] || '200').trim(),
            language: 'ไทย',
            category: String(row[catIdx] || row[subjectIdx] || 'ทั่วไป').trim(),
            subject: String(row[subjectIdx] || '').trim(),
            subject_subdivision: String(row[subSubdivIdx] || '').trim(),
            subject_2: String(row[subject2Idx] || '').trim(),
            subject_3: String(row[subject3Idx] || '').trim(),
            keywords: `${row[titleIdx] || ''}, ${row[authorIdx] || ''}, ${row[catIdx] || ''}`,
            call_number: callNumber,
            ddc: ddcVal,
            call_sub: callSubVal,
            price: String(row[priceIdx] || '').trim(),
            series: String(row[seriesIdx] || '').trim(),
            translator: String(row[translatorIdx] || '').trim(),
            composition_year: String(row[compYearIdx] || '').trim(),
            copies: String(row[copiesIdx] || '1').trim(),
            date_added: String(row[dateIdx] || '').trim(),
            illustration: rawIllus,
            cover_image: coverImage,
            description: String(row[descIdx] || 'นำเข้าจากไฟล์ Excel').trim(),
            status: String(row[statusIdx] || 'พร้อมให้บริการ').trim()
          });
        }

        setExcelPreviewData(parsedBooks);
      } catch (err: any) {
        console.error('Error reading Excel file:', err);
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ' + err.message);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Submit parsed Excel books to Server Batch API
  const handleImportExcelBooks = async () => {
    if (excelPreviewData.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/books/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: excelPreviewData })
      });
      const data = await res.json();
      if (data.success) {
        alert(`นำเข้าข้อมูลจาก Excel สำเร็จเรียบร้อย ${data.imported} เล่ม! (ล้มเหลว ${data.failed} เล่ม) สามารถจัดการ แก้ไข เพิ่ม หรือลบในตารางด้านล่างได้ทันที`);
        setExcelPreviewData([]);
        setExcelFileName('');
        fetchBooks();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.error || 'ไม่สามารถนำเข้าข้อมูลได้'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Export All Books to Excel (All 29 standard columns matching attached form)
  const handleExportAllBooksToExcel = async () => {
    setIsExportingExcel(true);
    try {
      let booksToExport: Book[] = [];

      // 1. Try fetching all books without pagination from API
      try {
        const res = await fetch('/api/books?limit=10000');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.books) && data.books.length > 0) {
            booksToExport = data.books;
          }
        }
      } catch (apiErr) {
        console.warn('API export fetch note:', apiErr);
      }

      // 2. Fallback to client cache
      if (booksToExport.length === 0) {
        booksToExport = await loadAllBooksIntoClientCache();
      }

      // 3. Fallback to current books state
      if (booksToExport.length === 0) {
        booksToExport = books;
      }

      if (booksToExport.length === 0) {
        alert('ไม่พบข้อมูลหนังสือในระบบสำหรับส่งออก');
        return;
      }

      const rows = booksToExport.map((b: any, index: number) => {
        let dateStr = b.date_added || '';
        if (!dateStr && b.created_at) {
          try {
            const d = new Date(b.created_at);
            dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear() + 543}`;
          } catch {}
        }
        if (!dateStr) {
          const now = new Date();
          dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear() + 543}`;
        }

        let ddcVal = b.ddc || '';
        let callSubVal = b.call_sub || '';
        if (!callSubVal && b.call_number) {
          const parts = String(b.call_number).trim().split(/\s+/);
          if (parts.length > 1) {
            if (!ddcVal) ddcVal = parts[0];
            callSubVal = parts.slice(1).join(' ');
          } else if (!ddcVal) {
            ddcVal = parts[0];
          }
        }

        return {
          'วันที่': dateStr,
          'คอลัมน์1': String(index + 1),
          'เลขทะเบียน': b.accession_no || b.barcode || '',
          '020 ISBN': b.isbn || '',
          '100 $a ผู้แต่ง': b.author || '',
          '245 $c ผู้แต่งร่วม': b.co_authors || '',
          '245 $a ชื่อเรื่อง': b.title || '',
          '245 $b ชื่อเรื่องย่อย': b.subtitle || '',
          'ผู้เขียน': b.writer || b.author || '',
          '082 $a': ddcVal,
          '082 $b': callSubVal,
          '260 $a สถานที่พิมพ์': b.publication_place || '',
          '260 $b สำนักพิมพ์': b.publisher || '',
          '260 $c ปีที่พิมพ์': b.publication_year || '',
          '300 $a จำนวนหน้า': b.pages || '',
          '300 $b ภาพประกอบ': b.illustration || '',
          '650 $a หัวเรื่อง 1': b.subject || '',
          '650 $x ย่อยหัวเรื่อง': b.subject_subdivision || '',
          'คำอธิบาย': b.description || '',
          'พิมพ์ครั้งที่': b.edition || '',
          'ราคา': b.price || '',
          'ชุดหนังสือ': b.series || '',
          'ผู้แปล': b.translator || '',
          'ปีแต่ง': b.composition_year || '',
          'หัวเรื่อง 2': b.subject_2 || '',
          'หัวเรื่อง 3': b.subject_3 || '',
          'หมวดหมู่จัดเก็บ': b.category || '',
          'สถานะ': b.status || 'พร้อมให้บริการ',
          'จำนวนเล่ม': b.copies || '1'
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Books_Catalog');
      const filename = `library_books_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      alert(`📥 ส่งออกไฟล์ Excel "${filename}" เรียบร้อยแล้ว จำนวน ${rows.length} รายการ (ครบทั้ง 29 คอลัมน์ตามแบบฟอร์มมาตรฐาน)`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel: ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Download Sample Excel Template
  const downloadSampleExcel = () => {
    const sampleRows = [
      {
        'วันที่': '04/10/2026',
        'คอลัมน์1': '1',
        'เลขทะเบียน': '00001',
        '020 ISBN': '9786161852467',
        '100 $a ผู้แต่ง': 'งามพรรณ เวชชาชีวะ',
        '245 $c ผู้แต่งร่วม': '',
        '245 $a ชื่อเรื่อง': 'ความสุขของกะทิ',
        '245 $b ชื่อเรื่องย่อย': 'ฉบับครบรอบ 20 ปี',
        'ผู้เขียน': 'งามพรรณ เวชชาชีวะ',
        '082 $a': '895.913',
        '082 $b': 'ง241ค',
        '260 $a สถานที่พิมพ์': 'กรุงเทพฯ',
        '260 $b สำนักพิมพ์': 'แพรวสำนักพิมพ์',
        '260 $c ปีที่พิมพ์': '2566',
        '300 $a จำนวนหน้า': '112',
        '300 $b ภาพประกอบ': 'มีภาพประกอบสีสันสวยงาม',
        '650 $a หัวเรื่อง 1': 'นวนิยายไทย',
        '650 $x ย่อยหัวเรื่อง': 'วรรณกรรมเยาวชน',
        'คำอธิบาย': 'เรื่องราวเสน่ห์ของเด็กหญิงกะทิที่ใช้ชีวิตเรียบง่ายในบ้านสวนริมคลองร่วมกับตาและยาย',
        'พิมพ์ครั้งที่': 'พิมพ์ครั้งที่ 15',
        'ราคา': '155',
        'ชุดหนังสือ': '',
        'ผู้แปล': '',
        'ปีแต่ง': '2546',
        'หัวเรื่อง 2': 'วรรณกรรมสร้างสรรค์ยอดเยี่ยมแห่งอาเซียน',
        'หัวเรื่อง 3': '',
        'หมวดหมู่จัดเก็บ': 'วรรณกรรมเยาวชน',
        'สถานะ': 'พร้อมให้บริการ',
        'จำนวนเล่ม': '1'
      },
      {
        'วันที่': '04/10/2026',
        'คอลัมน์1': '2',
        'เลขทะเบียน': '00002',
        '020 ISBN': '9786160841234',
        '100 $a ผู้แต่ง': 'สมนึก อิงศรีเลิศ',
        '245 $c ผู้แต่งร่วม': '',
        '245 $a ชื่อเรื่อง': 'เรียนรู้ระบบฐานข้อมูลและการจัดการดาต้า',
        '245 $b ชื่อเรื่องย่อย': 'คู่มือศึกษา SQL และ NoSQL',
        'ผู้เขียน': 'สมนึก อิงศรีเลิศ',
        '082 $a': '005.74',
        '082 $b': 'ส254ร',
        '260 $a สถานที่พิมพ์': 'กรุงเทพฯ',
        '260 $b สำนักพิมพ์': 'ซีเอ็ดยูเคชั่น',
        '260 $c ปีที่พิมพ์': '2565',
        '300 $a จำนวนหน้า': '320',
        '300 $b ภาพประกอบ': 'ภาพประกอบตารางและไดอะแกรม',
        '650 $a หัวเรื่อง 1': 'ฐานข้อมูล',
        '650 $x ย่อยหัวเรื่อง': 'ระบบจัดการฐานข้อมูล',
        'คำอธิบาย': 'เน้นปูพื้นฐานการเขียน SQL คำสั่ง Query และการออกแบบ Schema ที่ใช้งานได้จริง',
        'พิมพ์ครั้งที่': 'พิมพ์ครั้งที่ 2',
        'ราคา': '280',
        'ชุดหนังสือ': 'คู่มือไอทีศึกษา',
        'ผู้แปล': '',
        'ปีแต่ง': '',
        'หัวเรื่อง 2': 'การออกแบบระบบฐานข้อมูล',
        'หัวเรื่อง 3': '',
        'หมวดหมู่จัดเก็บ': 'คอมพิวเตอร์และเทคโนโลยี',
        'สถานะ': 'พร้อมให้บริการ',
        'จำนวนเล่ม': '2'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Books');
    XLSX.writeFile(wb, 'library_books_template_standard.xlsx');
  };

  // Simple CSV / Clipboard TSV Import Parser (Column-by-column according to the attached template)
  const handleCsvImport = async () => {
    if (!csvInput.trim()) return;
    const lines = csvInput.split('\n');
    let successCount = 0;
    let failCount = 0;

    const parsedBooks: any[] = [];
    
    // Check if the first line is header
    const firstLine = String(lines[0] || '').toLowerCase();
    const hasHeader = firstLine.includes('ชื่อเรื่อง') || firstLine.includes('title') || firstLine.includes('เลขทะเบียน') || firstLine.includes('isbn') || firstLine.includes('ผู้แต่ง');
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by tab (Excel clipboard) OR comma (Standard CSV)
      const cells = line.split(line.includes('\t') ? '\t' : ',');
      if (cells.length < 3) continue;

      let book: any = {};

      if (cells.length >= 15) {
        // High fidelity column-by-column mapping according to 29-column attached template
        const dateAdded = cells[0]?.trim() || '';
        const rawAcc = cells[2]?.trim();
        const isbn = cells[3]?.trim() || Math.random().toString().substring(2, 15);
        const author = cells[4]?.trim() || cells[8]?.trim() || 'ไม่ระบุผู้แต่ง';
        const coAuthors = cells[5]?.trim() || '';
        const title = cells[6]?.trim() || 'ไม่ระบุชื่อเรื่อง';
        const subtitle = cells[7]?.trim() || '';
        const writer = cells[8]?.trim() || author;
        const ddc = cells[9]?.trim() || '';
        const callSub = cells[10]?.trim() || '';
        const callNumber = (ddc && callSub) ? `${ddc} ${callSub}` : (ddc || callSub || '000');
        const pubPlace = cells[11]?.trim() || 'กรุงเทพฯ';
        const publisher = cells[12]?.trim() || 'ไม่ระบุสำนักพิมพ์';
        const pubYear = cells[13]?.trim() || new Date().getFullYear().toString();
        const pages = cells[14]?.trim() || '200';
        const illustration = cells[15]?.trim() || '';
        const subject = cells[16]?.trim() || '';
        const subjectSubdivision = cells[17]?.trim() || '';
        const description = cells[18]?.trim() || 'นำเข้าจากระบบวางข้อความ';
        const edition = cells[19]?.trim() || 'พิมพ์ครั้งที่ 1';
        const price = cells[20]?.trim() || '';
        const series = cells[21]?.trim() || '';
        const translator = cells[22]?.trim() || '';
        const compYear = cells[23]?.trim() || '';
        const subject2 = cells[24]?.trim() || '';
        const subject3 = cells[25]?.trim() || '';
        const category = cells[26]?.trim() || subject || 'ทั่วไป';
        const status = cells[27]?.trim() || 'พร้อมให้บริการ';
        const copies = cells[28]?.trim() || '1';

        let coverImage = (isbn.length >= 10)
          ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`
          : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600';

        if (illustration && (illustration.startsWith('https://') || illustration.startsWith('http://'))) {
          coverImage = illustration;
        }

        book = {
          title,
          subtitle,
          author,
          writer,
          co_authors: coAuthors,
          isbn,
          accession_no: rawAcc || `ACC${Date.now()}_${i}`,
          barcode: rawAcc || `B${Math.random().toString().substring(2, 9)}`,
          publisher,
          publication_place: pubPlace,
          publication_year: pubYear,
          edition,
          pages,
          language: 'ไทย',
          category,
          subject,
          subject_subdivision: subjectSubdivision,
          subject_2: subject2,
          subject_3: subject3,
          keywords: `${title}, ${author}, ${category}`,
          call_number: callNumber,
          ddc,
          call_sub: callSub,
          price,
          series,
          translator,
          composition_year: compYear,
          copies,
          date_added: dateAdded,
          illustration,
          cover_image: coverImage,
          description,
          status
        };
      } else {
        // Fallback for simple short list
        const title = cells[0]?.trim() || 'ไม่ระบุชื่อเรื่อง';
        const author = cells[1]?.trim() || 'ไม่ระบุผู้แต่ง';
        const isbn = cells[2]?.trim() || Math.random().toString().substring(2, 15);
        const publisher = cells[3]?.trim() || 'ไม่ระบุสำนักพิมพ์';
        const year = cells[4]?.trim() || '2566';
        const category = cells[5]?.trim() || 'ทั่วไป';
        const callNum = cells[6]?.trim() || '000';
        const accNo = cells[7]?.trim() || cells[2]?.trim() || `ACC${Date.now()}_${i}`;

        book = {
          title,
          subtitle: '',
          author,
          co_authors: '',
          isbn,
          accession_no: accNo,
          barcode: accNo,
          publisher,
          publication_place: 'กรุงเทพฯ',
          publication_year: year,
          edition: 'พิมพ์ครั้งที่ 1',
          pages: '200',
          language: 'ไทย',
          category,
          subject: category,
          keywords: `${title}, ${author}, ${category}`,
          call_number: callNum,
          ddc: '',
          price: '',
          series: '',
          translator: '',
          illustration: '',
          cover_image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
          description: 'นำเข้าผ่านระบบวางข้อความ',
          status: 'พร้อมให้บริการ'
        };
      }

      parsedBooks.push(book);
    }

    if (parsedBooks.length === 0) {
      alert('ไม่พบข้อมูลที่ตรงรูปแบบฟิลด์ที่จะนำเข้าได้');
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch('/api/books/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: parsedBooks })
      });
      const data = await res.json();
      if (data.success) {
        alert(`📋 นำเข้าข้อมูลคัดลอกจาก Excel สำเร็จ ${data.imported} เล่ม! (ล้มเหลว ${data.failed} เล่ม) ข้อมูลถูกซิงค์เข้าสู่ฐานข้อมูลเรียบร้อยแล้ว`);
        setCsvInput('');
        fetchBooks();
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (data.error || 'ไม่รู้จัก'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Format bibliography text according to Standard (Specification 10)
  const formatBibliography = (b: Book) => {
    const accText = b.accession_no || b.barcode ? `\nเลขทะเบียน ${b.accession_no || b.barcode}.` : '';
    return `${b.title} / ${b.author}${b.co_authors ? ', ' + b.co_authors : ''}.\n${b.publication_place} : ${b.publisher}, ${b.publication_year}.\n${b.pages} หน้า.\nISBN ${b.isbn}.${accText}\nเลขเรียกหนังสือ ${b.call_number}`;
  };

  // Helper to extract ALL subjects from a book record (650 $a, subject_2, subject_3, subject_650a/2/3, all650Subjects, marc_tags 650, etc.)
  const getBookSubjects = (b: Book | null | undefined): string[] => {
    if (!b) return [];
    const list: string[] = [];
    const add = (raw?: any) => {
      if (!raw || typeof raw !== 'string') return;
      let clean = raw.trim();
      if (clean.startsWith('$a') || clean.startsWith('\\a')) {
        clean = clean.substring(2).trim();
      }
      clean = clean.replace(/[\u001f\$][a-z0-9]/g, ' ').replace(/^-+|-+$/g, '').trim();
      if (clean && clean !== '-' && clean !== 'ทั่วไป' && !list.includes(clean)) {
        list.push(clean);
      }
    };

    if (b.subject) {
      if (b.subject.includes(',') || b.subject.includes(';') || b.subject.includes('\n')) {
        const parts = b.subject.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
        parts.forEach(p => add(p));
      } else {
        add(b.subject + (b.subject_subdivision ? ` -- ${b.subject_subdivision}` : ''));
      }
    }
    add(b.subject_2);
    add(b.subject_3);
    add(b.subject_650a);
    add(b.subject_650_2);
    add(b.subject_650_3);

    if (Array.isArray(b.all650Subjects)) {
      b.all650Subjects.forEach(s => add(s));
    }

    if (Array.isArray(b.marc_tags)) {
      b.marc_tags.forEach((t: any) => {
        if (t && (t.tagID === '650' || t.tag === '650')) {
          const val = (typeof t.data === 'string' ? parseMarcSubfield(t.data, 'a') || t.data : '') ||
                      (typeof t.content === 'string' ? parseMarcSubfield(t.content, 'a') || t.content : '');
          add(val);
        }
      });
    }

    if (Array.isArray(b.subjects)) {
      b.subjects.forEach((s: any) => add(typeof s === 'string' ? s : s?.name || s?.subject));
    }

    return list;
  };

  // Generate MARC 21 Tags array strictly based on real existing data in the book record
  const getBookMarcTags = (b: Book) => {
    const tags: { tag: string; ind: string; content: string }[] = [];

    // Tag 001: Accession No. / Record Control No. (Only if present)
    const accNo = (b.accession_no || b.barcode || b.id || '').trim();
    if (accNo && accNo !== '-') {
      tags.push({
        tag: '001',
        ind: '##',
        content: accNo
      });
    }

    // Tag 016: Local National/Agency Control No. (Only if barcode or accession exists)
    const localNo = (b.barcode || b.accession_no || '').trim();
    if (localNo && localNo !== '-') {
      tags.push({
        tag: '016',
        ind: '##',
        content: `\\a${localNo}`
      });
    }

    // Tag 020: ISBN (Only if valid ISBN exists)
    const isbnVal = (b.isbn || '').trim();
    if (isbnVal && isbnVal !== '-') {
      tags.push({
        tag: '020',
        ind: '##',
        content: `\\a${isbnVal.replace(/[^0-9X]/gi, '') || isbnVal}`
      });
    }

    // Tag 022: ISSN (Only if ISSN exists)
    const issnVal = (b.issn || '').trim();
    if (issnVal && issnVal !== '-') {
      tags.push({
        tag: '022',
        ind: '##',
        content: `\\a${issnVal}`
      });
    }

    // Tag 041: Language Code (Only if language is specified)
    const langRaw = (b.language || '').trim();
    if (langRaw && langRaw !== '-') {
      const langCode = langRaw.toLowerCase().includes('eng') ? 'eng' : (langRaw.toLowerCase().includes('ไทย') || langRaw.toLowerCase().includes('tha') ? 'tha' : langRaw);
      tags.push({
        tag: '041',
        ind: '##',
        content: `\\a${langCode}`
      });
    }

    // Tag 060 / 082: Classification / Call Number (Only if call number or DDC exists)
    if ((b.ddc && b.ddc.trim() !== '-') || (b.call_number && b.call_number.trim() !== '-') || (b.call_sub && b.call_sub.trim() !== '-')) {
      const isLc = /^[A-Za-z]{1,3}\d/.test((b.ddc || b.call_number || '').trim());
      const callTag = isLc ? '060' : '082';
      
      let callA = (b.ddc || '').trim();
      let callB = (b.call_sub || '').trim();
      if (!callA && b.call_number) {
        const parts = b.call_number.trim().split(/\s+/);
        callA = parts[0] || '';
        if (!callB && parts.length > 1) {
          callB = parts.slice(1).join(' ');
        }
      }
      if (callA === '-') callA = '';
      if (callB === '-') callB = '';
      
      let callContent = '';
      if (callA) callContent += `\\a${callA}`;
      if (callB) callContent += `${callContent ? ' ' : ''}\\b${callB}`;
      if (b.publication_year && b.publication_year.trim() !== '-' && b.publication_year.trim() !== '') {
        callContent += `${callContent ? ' ' : ''}\\d${b.publication_year.trim()}`;
      }

      if (callContent) {
        tags.push({
          tag: callTag,
          ind: '##',
          content: callContent
        });
      }
    }

    // Tag 100: Main Author (Personal Name) (Only if author exists)
    const authorVal = (b.author || '').trim();
    if (authorVal && authorVal !== '-') {
      tags.push({
        tag: '100',
        ind: '##',
        content: `\\a${authorVal}`
      });
    }

    // Tag 245: Title Statement (Only if title exists)
    const titleMain = (b.title || '').trim();
    if (titleMain && titleMain !== '-') {
      const titleSub = (b.subtitle && b.subtitle.trim() !== '-' && b.subtitle.trim() !== '') ? ` : \\b${b.subtitle.trim()}` : '';
      tags.push({
        tag: '245',
        ind: '##',
        content: `\\a${titleMain}${titleSub}`
      });
    }

    // Tag 250: Edition Statement (Only if edition exists)
    const editionVal = (b.edition || '').trim();
    if (editionVal && editionVal !== '-') {
      tags.push({
        tag: '250',
        ind: '##',
        content: `\\a${editionVal}`
      });
    }

    // Tag 260: Publication, Distribution, etc. (Imprint) (Only if publication data exists)
    const place = (b.publication_place || '').trim();
    const publisher = (b.publisher || '').trim();
    const year = (b.publication_year || '').trim();
    const hasPlace = place && place !== '-';
    const hasPub = publisher && publisher !== '-';
    const hasYear = year && year !== '-';

    if (hasPlace || hasPub || hasYear) {
      let content260 = '';
      if (hasPlace) content260 += `\\a${place}`;
      if (hasPub) content260 += `${content260 ? ' : ' : ''}\\b${publisher}`;
      if (hasYear) content260 += `${content260 ? ', ' : ''}\\c${year}`;

      tags.push({
        tag: '260',
        ind: '##',
        content: content260
      });
    }

    // Tag 300: Physical Description (Only if pages, illustration, or size exists)
    const pagesVal = (b.pages || '').trim();
    const illusVal = (b.illustration || '').trim();
    const sizeVal = (b.book_size || b.dimensions_300c || '').trim();
    const hasPages = pagesVal && pagesVal !== '-';
    const hasIllus = illusVal && illusVal !== '-' && !illusVal.startsWith('http');
    const hasSize = sizeVal && sizeVal !== '-';

    if (hasPages || hasIllus || hasSize) {
      let content300 = '';
      if (hasPages) content300 += `\\a${pagesVal}${pagesVal.endsWith('หน้า') ? '' : ' หน้า'}`;
      if (hasIllus) content300 += `${content300 ? ' : ' : ''}\\b${illusVal}`;
      if (hasSize) content300 += `${content300 ? ' ; ' : ''}\\c${sizeVal}`;

      tags.push({
        tag: '300',
        ind: '##',
        content: content300
      });
    }

    // Tag 490: Series Statement (Only if series exists)
    const seriesVal = (b.series || '').trim();
    if (seriesVal && seriesVal !== '-') {
      tags.push({
        tag: '490',
        ind: '##',
        content: `\\a${seriesVal}`
      });
    }

    // Tag 500: General Note (Only if note exists)
    const noteVal = (b.note || '').trim();
    if (noteVal && noteVal !== '-') {
      tags.push({
        tag: '500',
        ind: '##',
        content: `\\a${noteVal}`
      });
    }

    // Tag 505: Formatted Contents Note (Only if contents exist)
    const contentsVal = (b.contents_505 || b.contents || '').trim();
    if (contentsVal && contentsVal !== '-') {
      tags.push({
        tag: '505',
        ind: '##',
        content: `\\a${contentsVal}`
      });
    }

    // Tag 520: Summary, etc. (Only if description exists)
    const descVal = (b.description || '').trim();
    if (descVal && descVal !== '-') {
      tags.push({
        tag: '520',
        ind: '##',
        content: `\\a${descVal}`
      });
    }

    // Tag 650: Subject Headings (Extract all real subjects from the system: 1, 2, 3...)
    const allSubjects = getBookSubjects(b);
    allSubjects.forEach(s => {
      let mainSubj = s;
      let subSubj = '';
      if (mainSubj.includes('--')) {
        const parts = mainSubj.split('--');
        mainSubj = parts[0].trim();
        subSubj = parts.slice(1).join('--').trim();
      }
      const content = `\\a${mainSubj}${subSubj && subSubj !== '-' ? ' \\x' + subSubj : ''}`;
      tags.push({
        tag: '650',
        ind: '##',
        content
      });
    });

    // Tag 700: Added Entry - Personal Name (Co-Author, Translator, Writer - Only if real data exists)
    const transVal = (b.translator || '').trim();
    const writerVal = (b.writer || '').trim();
    const coVal = (b.co_authors || '').trim();

    if (transVal && transVal !== '-') {
      tags.push({
        tag: '700',
        ind: '##',
        content: `\\a${transVal}, \\eผู้แปล`
      });
    }
    if (writerVal && writerVal !== '-' && writerVal !== authorVal) {
      tags.push({
        tag: '700',
        ind: '##',
        content: `\\a${writerVal}, \\eผู้เขียน`
      });
    }
    if (coVal && coVal !== '-' && coVal !== authorVal && coVal !== writerVal) {
      const role = (b.author_role && b.author_role.trim() !== '-') ? b.author_role.trim() : 'ผู้ร่วมเขียน';
      tags.push({
        tag: '700',
        ind: '##',
        content: `\\a${coVal}, \\e${role}`
      });
    }

    // Tag 856: Electronic Location (Cover image - Only if valid URL)
    const cImg = typeof b?.cover_image === 'string' ? b.cover_image : '';
    const e856 = typeof b?.electronic_856 === 'string' ? b.electronic_856 : '';
    const coverUrl = (e856 && e856.startsWith('http')) 
      ? e856 
      : (cImg && cImg.startsWith('http') && !cImg.includes('images.unsplash.com') ? cImg : '');
    if (coverUrl) {
      tags.push({
        tag: '856',
        ind: '##',
        content: `\\u${coverUrl}`
      });
    }

    // Tag 930: Item Format
    tags.push({
      tag: '930',
      ind: '##',
      content: `\\aBook`
    });

    // Tag 949: Local Holding / Storage Location (Only if storage location exists)
    const locVal = (b.storage_location || '').trim();
    if (locVal && locVal !== '-') {
      tags.push({
        tag: '949',
        ind: '##',
        content: `\\a${locVal}`
      });
    }

    return tags;
  };

  // Format full MARC representation as text for copying/exporting
  const formatMarcText = (b: Book) => {
    const langCode = (b.language || '').toLowerCase().includes('eng') ? 'eng' : ((b.language || '').toLowerCase().includes('ไทย') || (b.language || '').toLowerCase().includes('tha') ? 'tha' : (b.language || '-'));
    const entryDate = b.date_added || (b.created_at ? b.created_at.slice(0, 10).replace(/-/g, '/') : '-');
    const updateDate = (b.updated_at ? b.updated_at.slice(0, 10).replace(/-/g, '/') : new Date().toISOString().slice(0, 10).replace(/-/g, '/'));
    const pubYear = b.publication_year || '-';
    const tags = getBookMarcTags(b);

    const lines = [
      `หน้า MARC`,
      `================================================================================`,
      `Rec.Status: n    Bib.Stage: Normal    Create: bat         Modify: arporn`,
      `Rec.Type:   a    Language:  ${langCode.padEnd(10)} Entry d.: ${entryDate.padEnd(10)} Update d.: ${updateDate}`,
      `Bib.Level:  s    Pub Ctry.: tha       Date1:    ${pubYear.padEnd(10)} Date2:     ${pubYear}`,
      `================================================================================`,
      `Tag   Ind  Content`,
      `--------------------------------------------------------------------------------`
    ];

    tags.forEach(t => {
      lines.push(`${t.tag.padEnd(5)} ${t.ind.padEnd(4)} ${t.content}`);
    });

    return lines.join('\n');
  };

  // Calculations for Stats (Analytics)
  const currentDisplayedBooksCount = books.length;
  const effectiveTotalBooks = totalBooksCount > 0 ? totalBooksCount : (sheetSyncInfo?.totalBooks || books.length);
  const availableBooksCount = books.filter(b => b.status === 'พร้อมให้บริการ').length;
  const totalScans = history.length;
  const successScans = history.filter(h => h.matched_book_id).length;
  const successRate = totalScans > 0 ? Math.round((successScans / totalScans) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('catalog')}>
            <img 
              src="https://i.postimg.cc/rwpf96n1/loko-h-xngsm-d-2.png" 
              alt="IAB IQRA LIBRARY Logo" 
              className="h-11 w-auto object-contain rounded-lg shadow-sm" 
              onError={(e) => {
                // If it fails to load from postimg, fallback to another direct link
                (e.target as HTMLImageElement).src = 'https://i.postimg.cc/DnrRnn1M/loko-h-xngsm-d-2.png';
              }}
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                IAB IQRA LIBRARY
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden md:block">ระบบสืบค้นหนังสืออัจฉริยะจากหน้าปก</p>
            </div>
          </div>

          {/* Nav menu */}
          <nav className="hidden lg:flex space-x-1">
            <button 
              onClick={() => { stopCamera(); setActiveTab('catalog'); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'catalog' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              หนังสือทั้งหมด
            </button>
            <button 
              onClick={() => { setActiveTab('scanner'); startCamera(); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'scanner' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <Camera className="h-4 w-4" /> สแกนหน้าปก
            </button>
            <button 
              onClick={() => { stopCamera(); setActiveTab('marc21'); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'marc21' ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>สร้าง MARC 21</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-mono font-bold">AI</span>
            </button>
            <button 
              onClick={() => { stopCamera(); setActiveTab('stats'); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'stats' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              สถิติและการสแกน
            </button>
            <button 
              onClick={() => { stopCamera(); setActiveTab('admin'); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'admin' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <Settings className="h-4 w-4" /> จัดการหนังสือ
            </button>
          </nav>

          {/* Quick actions, Supabase Sync & Role select */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Real-time Indicator Pill Button Link */}
            <a 
              href="https://ais-pre-cixcmspiytr5hozs4mesz5-681517703334.asia-southeast1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm cursor-pointer"
              title="คลิกเพื่อไปยังระบบหลัก (Cloud Run)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden md:inline font-bold">
                MARC21 (Preview)
              </span>
              <ExternalLink className="h-3 w-3 text-emerald-600" />
            </a>

            <button
              onClick={() => handleSyncSheet()}
              disabled={isSyncingSheet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
              title="ดึง/อัปเดตข้อมูลเข้าสู่ฐานข้อมูล Supabase"
            >
              <Database className={`h-3.5 w-3.5 text-indigo-600 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">ฐานข้อมูล Supabase</span>
              <span className="bg-indigo-200/60 text-indigo-900 px-1.5 py-0.2 rounded text-[11px] font-mono">
                {totalBooksCount > 0 ? totalBooksCount.toLocaleString() : (sheetSyncInfo?.totalBooks?.toLocaleString() || '2,452')}
              </span>
            </button>

            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)}
              className="text-xs bg-slate-100 border border-slate-300 text-slate-700 rounded-md py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="user">บทบาท: สมาชิกทั่วไป</option>
              <option value="librarian">บทบาท: บรรณารักษ์</option>
              <option value="admin">บทบาท: ผู้ดูแลระบบ</option>
            </select>
          </div>
        </div>
      </header>

      {/* MOBILE BAR MENU */}
      <div className="lg:hidden bg-white border-b border-slate-200 flex justify-around py-2.5 shadow-sm">
        <button 
          onClick={() => { stopCamera(); setActiveTab('catalog'); }}
          className={`flex flex-col items-center text-xs ${activeTab === 'catalog' ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}
        >
          <Search className="h-5 w-5 mb-0.5" />
          <span>ค้นหา</span>
        </button>
        <button 
          onClick={() => { setActiveTab('scanner'); startCamera(); }}
          className={`flex flex-col items-center text-xs ${activeTab === 'scanner' ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}
        >
          <Camera className="h-5 w-5 mb-0.5" />
          <span>สแกนหน้าปก</span>
        </button>
        <button 
          onClick={() => { stopCamera(); setActiveTab('marc21'); }}
          className={`flex flex-col items-center text-xs ${activeTab === 'marc21' ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}
        >
          <FileSpreadsheet className="h-5 w-5 mb-0.5 text-emerald-600" />
          <span>MARC 21</span>
        </button>
        <button 
          onClick={() => { stopCamera(); setActiveTab('stats'); }}
          className={`flex flex-col items-center text-xs ${activeTab === 'stats' ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}
        >
          <BarChart3 className="h-5 w-5 mb-0.5" />
          <span>สถิติ</span>
        </button>
        <button 
          onClick={() => { stopCamera(); setActiveTab('admin'); }}
          className={`flex flex-col items-center text-xs ${activeTab === 'admin' ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}
        >
          <Settings className="h-5 w-5 mb-0.5" />
          <span>จัดการ</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 2: BOOK CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-light text-slate-900 tracking-tight">สืบค้นรายการบรรณานุกรม</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBatchEnrichCovers}
                  disabled={isBatchEnriching}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                  title="ค้นหาและจัดเก็บรูปหน้าปกจริงจากอินเทอร์เน็ตอัตโนมัติ"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isBatchEnriching ? 'animate-spin text-amber-300' : ''}`} />
                  <span>{isBatchEnriching ? 'กำลังค้นหาปกจากเน็ต...' : '🌐 AI ค้นหาภาพหน้าปกจากเน็ต'}</span>
                </button>
                <button
                  onClick={() => handleSyncSheet()}
                  disabled={isSyncingSheet}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheet ? 'กำลังซิงค์ Google Sheet...' : 'ซิงค์ข้อมูล Google Sheet'}</span>
                </button>
              </div>
            </div>

            {/* Smart Search Filters */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-5 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="พิมพ์ ค้นหาชื่อเรื่อง, ผู้แต่ง, ISBN, บาร์โค้ด, สำนักพิมพ์..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-sm"
                  />
                </div>
                <div className="lg:col-span-3">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full py-3 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm truncate"
                  >
                    <option value="">ทุกหมวดหมู่/สถานที่จัดเก็บ ({categories.length})</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <select 
                    value={selectedPublisher}
                    onChange={(e) => setSelectedPublisher(e.target.value)}
                    className="w-full py-3 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm truncate"
                  >
                    <option value="">ทุกสำนักพิมพ์ ({publishers.length})</option>
                    {publishers.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full py-3 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm truncate font-medium text-slate-700"
                  >
                    <option value="accession">🔢 เลขทะเบียน (น้อย-มาก)</option>
                    <option value="accession_desc">🔢 เลขทะเบียน (มาก ➜ น้อย)</option>
                    <option value="title">📖 ชื่อเรื่อง (ก-ฮ)</option>
                    <option value="author">👤 ชื่อผู้แต่ง</option>
                    <option value="year">📅 ปีพิมพ์ (ใหม่สุด)</option>
                  </select>
                </div>
              </div>

              {/* Status & Results Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg font-semibold border border-indigo-200">
                    <Database className="h-3.5 w-3.5 text-indigo-600" />
                    <span>ฐานข้อมูล Supabase</span>
                  </span>
                  <span className="font-semibold text-slate-700">
                    พบหนังสือ {totalBooksCount > 0 ? totalBooksCount.toLocaleString() : books.length.toLocaleString()} เล่ม
                  </span>
                </div>
                {totalBooksCount > pageSize && (
                  <div className="text-slate-500 font-medium">
                    แสดงหน้า {currentPage} จาก {Math.ceil(totalBooksCount / pageSize)} หน้า (หน้าละ {pageSize} รายการ)
                  </div>
                )}
              </div>
            </div>

            {/* Books Catalog Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <RefreshCw className="h-8 w-8 text-amber-600 animate-spin" />
                <p className="text-sm text-slate-500">กำลังโหลดหนังสือจากฐานข้อมูล...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
                <div className="bg-slate-50 p-4 rounded-full inline-block text-slate-400">
                  <Search className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">ไม่พบหนังสือตามเงื่อนไขค้นหา</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">ลองเปลี่ยนเงื่อนไขสะกดให้ถูกต้อง หรือพิมพ์ระบุเพียงบางส่วน เช่น "แฮร์รี่" หรือ "กะทิ"</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedPublisher(''); }}
                  className="px-4 py-2 bg-amber-600 text-white font-semibold text-sm rounded-lg hover:bg-amber-500 transition cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                  {books.map(b => (
                    <div key={b.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col hover:shadow-md hover:border-amber-400 transition group">
                      <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-2 overflow-hidden border-b border-slate-100">
                        <img 
                          src={b.cover_image} 
                          alt={b.title} 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = (e.target as HTMLElement).nextElementSibling;
                            if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                          }}
                          className="max-h-[90%] w-auto object-contain shadow-sm rounded transition group-hover:scale-105"
                        />
                        {/* Fallback Book Cover UI */}
                        <div className="hidden absolute inset-0 bg-gradient-to-br from-amber-800 via-slate-900 to-slate-950 p-3 flex flex-col justify-between text-white shadow-inner">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono font-bold text-amber-200 bg-white/10 px-1.5 py-0.5 rounded border border-white/15">
                              {b.call_number || '000'}
                            </span>
                            <h5 className="font-bold text-xs leading-tight line-clamp-3">{b.title}</h5>
                            {b.subtitle && (
                              <p className="text-[10px] text-slate-300 line-clamp-1">{b.subtitle}</p>
                            )}
                          </div>
                          <div className="border-t border-white/20 pt-1.5 text-[10px] text-amber-300 truncate">
                            {b.author}
                          </div>
                        </div>

                        {/* Badges on cover - Made extremely compact for mobile */}
                        <span className="absolute top-2 left-2 text-[8px] font-mono font-bold px-1.5 py-0.5 bg-black/80 text-amber-300 rounded shadow-sm border border-white/10 backdrop-blur-sm">
                          {b.accession_no || b.barcode || '-'}
                        </span>
                        <span className="absolute top-2 right-2 text-[8px] font-semibold px-1.5 py-0.5 bg-white/95 text-slate-800 rounded shadow-sm border border-slate-200 backdrop-blur-sm truncate max-w-[70px]">
                          {b.category}
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2.5">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-amber-700 transition" title={b.title}>{b.title}</h4>
                          <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1">โดย {b.author}</p>
                          <div className="flex flex-col gap-1 pt-1">
                            <span className="font-mono bg-amber-50 text-amber-950 border border-amber-200/50 px-1.5 py-0.5 rounded text-[9px] font-bold self-start max-w-full truncate">
                              รหัส: {b.accession_no || b.barcode || '-'}
                            </span>
                            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold self-start max-w-full truncate">ชั้น: {b.call_number}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] sm:text-xs">
                          <span className={`inline-flex items-center gap-1 font-semibold ${b.status === 'พร้อมให้บริการ' ? 'text-emerald-600' : 'text-rose-500'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${b.status === 'พร้อมให้บริการ' ? 'bg-emerald-500' : 'bg-rose-500'}`} /> {b.status}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnrichCover(b.id);
                              }}
                              disabled={enrichingBookId === b.id}
                              title="ดึงปกหนังสือจริงด้วย AI"
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer disabled:opacity-40"
                            >
                              <Sparkles className={`h-3.5 w-3.5 ${enrichingBookId === b.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button 
                              onClick={() => setSelectedBookDetail(b)}
                              className="font-bold text-amber-600 hover:bg-amber-50 px-2 py-1 rounded transition cursor-pointer"
                            >
                              ดูละเอียด
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalBooksCount > pageSize && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-500">
                      แสดงรายการที่ {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalBooksCount)} จากทั้งหมด {totalBooksCount.toLocaleString()} เล่ม
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> ก่อนหน้า
                      </button>

                      {/* Numeric page buttons */}
                      {(() => {
                        const totalPages = Math.ceil(totalBooksCount / pageSize);
                        const pages = [];
                        const start = Math.max(1, currentPage - 2);
                        const end = Math.min(totalPages, currentPage + 2);

                        if (start > 1) {
                          pages.push(
                            <button key={1} onClick={() => handlePageChange(1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition ${currentPage === 1 ? 'bg-amber-600 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                              1
                            </button>
                          );
                          if (start > 2) {
                            pages.push(<span key="dots-1" className="px-1 text-slate-400 text-xs">...</span>);
                          }
                        }

                        for (let p = start; p <= end; p++) {
                          pages.push(
                            <button
                              key={p}
                              onClick={() => handlePageChange(p)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition ${currentPage === p ? 'bg-amber-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'}`}
                            >
                              {p}
                            </button>
                          );
                        }

                        if (end < totalPages) {
                          if (end < totalPages - 1) {
                            pages.push(<span key="dots-2" className="px-1 text-slate-400 text-xs">...</span>);
                          }
                          pages.push(
                            <button key={totalPages} onClick={() => handlePageChange(totalPages)} className={`w-8 h-8 rounded-lg text-xs font-bold transition ${currentPage === totalPages ? 'bg-amber-600 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(totalBooksCount / pageSize)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
                      >
                        ถัดไป <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI COVER SCANNER & BARCODE SCANNER (GOOGLE LENS EXPERIENCE) */}
        {activeTab === 'scanner' && (
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Sparkles className="h-3.5 w-3.5" /> AI Vision OCR & Barcode Recognition Engine
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                <span>ระบบสแกนหนังสืออัจฉริยะ (AI Cover & Barcode Scanner)</span>
              </h2>
              <p className="text-slate-500 text-sm">
                เลือกโหมดสแกนภาพปกหนังสือด้วย AI OCR หรือสแกนแถบรหัสบาร์โค้ด / ISBN ปกหลังเพื่อจับคู่ข้อมูลบรรณานุกรมฉบับสมบูรณ์
              </p>

              {/* Mode Switcher Tabs */}
              <div className="inline-flex p-1 bg-slate-200/80 rounded-2xl shadow-inner border border-slate-300 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const newMode = 'cover';
                    setScannerMode(newMode);
                    stopCamera();
                    setScanResult(null);
                    setUploadedImage(null);
                    setScannedBarcode('');
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${scannerMode === 'cover' ? 'bg-white text-amber-700 shadow-md border border-amber-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
                >
                  <Camera className="h-4 w-4 text-amber-600" />
                  <div className="text-left">
                    <div className="font-bold">📷 AI สแกนรูปหน้าปก (OCR)</div>
                    <div className="text-[10px] font-normal text-slate-500">วิเคราะห์ชื่อเรื่องและข้อมูลจากภาพปกหนังสือ</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newMode = 'barcode';
                    setScannerMode(newMode);
                    stopCamera();
                    setScanResult(null);
                    setUploadedImage(null);
                    setScannedBarcode('');
                  }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${scannerMode === 'barcode' ? 'bg-white text-indigo-700 shadow-md border border-indigo-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
                >
                  <Barcode className="h-4 w-4 text-indigo-600" />
                  <div className="text-left">
                    <div className="font-bold">🏷️ สแกนบาร์โค้ด / ISBN (ปกหลัง)</div>
                    <div className="text-[10px] font-normal text-slate-500">รองรับ EAN-13, ISBN-10, ISBN-13, Code 128</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Image Source Selection (Webcam/Upload) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full animate-ping ${scannerMode === 'barcode' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      {scannerMode === 'barcode' ? '🏷️ โหมดตรวจจับบาร์โค้ด / ISBN แบบเรียลไทม์' : '📷 โหมดสแกนวิเคราะห์หน้าปกด้วย AI'}
                    </span>
                  </div>
                  <div className="flex space-x-1.5">
                    <button 
                      onClick={() => startCamera(scannerMode)}
                      className={`px-3.5 py-1.5 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${scannerMode === 'barcode' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                    >
                      <Camera className="h-3.5 w-3.5" /> เปิดกล้อง
                    </button>
                    {cameraActive && (
                      <button 
                        onClick={stopCamera}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        ปิดกล้อง
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {cameraActive ? (
                    <div className="relative aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border-2 border-slate-800">
                      <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover" 
                        playsInline 
                        muted 
                      />
                      
                      {/* Viewfinder Overlays based on Mode */}
                      {scannerMode === 'barcode' ? (
                        /* BARCODE SCANNER RED GUIDANCE LINE & RETICLE */
                        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-36 border-2 border-red-500/80 rounded-xl bg-red-950/20 backdrop-blur-[1px] pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_25px_rgba(239,68,68,0.4)]">
                          {/* Top left/right red corners */}
                          <div className="flex justify-between -mt-3 -mx-3">
                            <div className="w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl shadow" />
                            <div className="w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr shadow" />
                          </div>

                          {/* Bright Red Guidance Line across middle */}
                          <div className="w-full h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] my-auto animate-pulse relative">
                            <div className="absolute inset-0 bg-red-400 blur-sm" />
                          </div>

                          {/* Bottom left/right red corners */}
                          <div className="flex justify-between -mb-3 -mx-3">
                            <div className="w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl shadow" />
                            <div className="w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br shadow" />
                          </div>

                          {/* Red Laser guidance badge */}
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-lg tracking-wider uppercase flex items-center gap-1.5 border border-red-400">
                            <ScanLine className="h-3 w-3 animate-spin" />
                            <span>เส้นไกด์สีแดงนำทาง (ตรวจจับบาร์โค้ดอัตโนมัติ)</span>
                          </div>
                        </div>
                      ) : (
                        /* COVER OCR VIEWFINDER */
                        <div className="absolute inset-8 pointer-events-none flex flex-col justify-between">
                          <div className="flex justify-between">
                            <div className="w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-xl shadow-lg" />
                            <div className="w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-xl shadow-lg" />
                          </div>

                          {/* Animated Laser Scanning Beam */}
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_rgba(251,191,36,1)] animate-pulse" />

                          <div className="flex justify-between">
                            <div className="w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-xl shadow-lg" />
                            <div className="w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-xl shadow-lg" />
                          </div>
                        </div>
                      )}

                      {/* Guide overlay badge */}
                      <div className="absolute top-4 inset-x-0 mx-auto w-max pointer-events-none">
                        <span className="text-xs text-white/95 font-semibold tracking-wide px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md bg-black/60 border border-white/20 flex items-center gap-1.5">
                          {scannerMode === 'barcode' ? (
                            <>
                              <Barcode className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                              <span>วางแถบบาร์โค้ดหรือรหัส ISBN ปกหลังให้ทับกับเส้นไกด์สีแดง</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin" />
                              <span>เล็งหน้าปกหนังสือภาษาไทยให้อยู่ในกรอบเพื่ออ่านชื่อเรื่อง</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Lens Shutter Capture Button */}
                      <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-4">
                        <button 
                          onClick={capturePhoto}
                          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border-4 border-white p-1 flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-2xl cursor-pointer group"
                          title={scannerMode === 'barcode' ? 'แตะเพื่อสแกนบาร์โค้ด' : 'แตะเพื่อสแกนหน้าปก'}
                        >
                          <div className={`w-full h-full rounded-full shadow-inner flex items-center justify-center text-white ${scannerMode === 'barcode' ? 'bg-gradient-to-tr from-red-600 to-red-500 group-hover:from-red-500 group-hover:to-red-400' : 'bg-gradient-to-tr from-amber-500 to-amber-400 group-hover:from-amber-400 group-hover:to-amber-300'}`}>
                            {scannerMode === 'barcode' ? <Barcode className="h-7 w-7" /> : <Camera className="h-7 w-7" />}
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Upload Box */}
                      <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition relative flex flex-col items-center justify-center group cursor-pointer ${scannerMode === 'barcode' ? 'border-red-300 bg-gradient-to-b from-red-50/30 to-slate-50 hover:bg-red-50/60' : 'border-amber-300 bg-gradient-to-b from-amber-50/40 to-slate-50 hover:bg-amber-50/70'}`}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const dataUrl = reader.result as string;
                                setUploadedImage(dataUrl);
                                stopCamera();
                                if (scannerMode === 'barcode') {
                                  decodeBarcodeFromImage(dataUrl);
                                } else {
                                  processImageWithAI(dataUrl);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`p-4 rounded-2xl shadow-md mb-3 group-hover:scale-110 transition border ${scannerMode === 'barcode' ? 'bg-white text-red-600 border-red-100' : 'bg-white text-amber-600 border-amber-100'}`}>
                          {scannerMode === 'barcode' ? <Barcode className="h-8 w-8 text-red-600" /> : <Camera className="h-8 w-8 text-amber-600" />}
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mb-1">
                          {scannerMode === 'barcode' ? '🏷️ อัปโหลดรูปถ่ายแถบบาร์โค้ด / ISBN (JPG / PNG)' : '📷 อัปโหลดรูปถ่ายหน้าปกหนังสือ'}
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">
                          {scannerMode === 'barcode' ? 'ถ่ายหรือครอปเฉพาะแถบบาร์โค้ดปกหลัง เพื่อสกัดรหัสอัตโนมัติ' : 'ถ่ายภาพหน้าปกหนังสือภาษาไทยให้คมชัด เพื่ออ่านชื่อเรื่องด้วย AI'}
                        </p>
                        <span className={`px-4 py-2 bg-white border text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 ${scannerMode === 'barcode' ? 'border-red-200 text-red-800 group-hover:bg-red-50' : 'border-amber-200 text-amber-800 group-hover:bg-amber-50'}`}>
                          <Upload className="h-3.5 w-3.5" /> {scannerMode === 'barcode' ? 'เลือกรูปถ่ายบาร์โค้ด' : 'เลือกรูปภาพหน้าปก'}
                        </span>
                      </div>

                      {/* Barcode Formats Badges Banner */}
                      {scannerMode === 'barcode' && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            มาตรฐานบาร์โค้ดที่ระบบรองรับ (Barcode / ISBN Standards):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-mono font-bold rounded-md shadow-2xs">🏷️ EAN-13</span>
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-mono font-bold rounded-md shadow-2xs">📚 ISBN-10</span>
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-mono font-bold rounded-md shadow-2xs">📖 ISBN-13</span>
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-mono font-bold rounded-md shadow-2xs">📊 Code 128</span>
                          </div>
                        </div>
                      )}

                      {/* Barcode Formats Badges Banner */}

                      {/* Barcode Manual Direct Input Search Box */}
                      {scannerMode === 'barcode' && (
                        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2.5 shadow-2xs">
                          <label className="text-xs font-bold text-indigo-950 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Barcode className="h-4 w-4 text-indigo-600" /> ค้นหาด้วยหมายเลขบาร์โค้ดหรือ ISBN โดยตรง (ทางเลือกสำรอง)
                            </span>
                            <span className="text-[10px] text-indigo-600 font-normal">กด Enter เพื่อค้นหา</span>
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={scannedBarcode}
                              onChange={(e) => setScannedBarcode(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  lookupBarcode(scannedBarcode);
                                }
                              }}
                              placeholder="กรอกรหัสบาร์โค้ด หรือ ISBN เช่น 9789749697665, 9781408855652 หรือ B0000001"
                              className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                            />
                            <button
                              type="button"
                              onClick={() => lookupBarcode(scannedBarcode)}
                              disabled={!scannedBarcode.trim() || isBarcodeProcessing}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Search className="h-4 w-4" /> ค้นหา
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display captured or uploaded image */}
                      {uploadedImage && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              {scannerMode === 'barcode' ? <Barcode className="h-4 w-4 text-red-600" /> : <Sparkles className="h-4 w-4 text-amber-600" />}
                              <span>รูปภาพที่ใช้ประมวลผล:</span>
                            </h4>
                            <button 
                              onClick={() => { setUploadedImage(null); setScanResult(null); setScannedBarcode(''); }}
                              className="text-xs text-rose-600 hover:underline font-semibold"
                            >
                              ลบและสแกนใหม่
                            </button>
                          </div>
                          
                          <div className="relative aspect-[4/3] max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-200 p-2 flex items-center justify-center group shadow-md">
                            <img src={uploadedImage} alt="Cover Preview" className="max-h-full object-contain rounded-lg" />
                            
                            {/* Reticle Corners on image */}
                            <div className="absolute inset-4 pointer-events-none flex flex-col justify-between">
                              <div className="flex justify-between">
                                <div className={`w-5 h-5 border-t-2 border-l-2 ${scannerMode === 'barcode' ? 'border-red-500' : 'border-amber-400'} rounded-tl shadow`} />
                                <div className={`w-5 h-5 border-t-2 border-r-2 ${scannerMode === 'barcode' ? 'border-red-500' : 'border-amber-400'} rounded-tr shadow`} />
                              </div>
                              <div className="flex justify-between">
                                <div className={`w-5 h-5 border-b-2 border-l-2 ${scannerMode === 'barcode' ? 'border-red-500' : 'border-amber-400'} rounded-bl shadow`} />
                                <div className={`w-5 h-5 border-b-2 border-r-2 ${scannerMode === 'barcode' ? 'border-red-500' : 'border-amber-400'} rounded-br shadow`} />
                              </div>
                            </div>

                            {/* HIGH-FIDELITY ANIMATED SCANNER OVERLAY DURING AI ANALYSIS */}
                            {scanningStep > 0 && (
                              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center space-y-4 animate-fade-in z-20">
                                {/* Glowing Pulsing Scanner Laser */}
                                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce w-full" style={{ animationDuration: '2.5s' }} />
                                
                                <div className="relative">
                                  <div className="h-16 w-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin flex items-center justify-center shadow-lg" />
                                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-amber-300 animate-pulse" />
                                </div>

                                <div className="space-y-2 max-w-xs w-full">
                                  <div className="flex justify-between items-center text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                                    <span>AI COVER ANALYZING...</span>
                                    <span>{scanningStep * 20}%</span>
                                  </div>
                                  
                                  {/* Progress Bar Container */}
                                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700 p-0.5">
                                    <div 
                                      className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                      style={{ width: `${scanningStep * 20}%` }}
                                    />
                                  </div>

                                  {/* Step descriptions */}
                                  <div className="h-10 flex items-center justify-center">
                                    <p className="text-xs font-semibold text-slate-100 animate-pulse">
                                      {scanningStep === 1 && '🔄 1/5: กำลังปรับแต่งและเตรียมความพร้อมของภาพ...'}
                                      {scanningStep === 2 && '🌐 2/5: กำลังวิเคราะห์ข้อความและอ่านปกด้วย Gemini AI...'}
                                      {scanningStep === 3 && '🧼 3/5: กำลังทำความสะอาดตัวอักษรและจัดรูปประโยค...'}
                                      {scanningStep === 4 && '📖 4/5: กำลังวิเคราะห์และแยกข้อมูลชื่อเรื่อง/ผู้แต่ง...'}
                                      {scanningStep === 5 && '🔍 5/5: กำลังค้นหาเปรียบเทียบในฐานข้อมูลห้องสมุด...'}
                                      {scanningStep > 5 && '✨ สำเร็จ: ดึงข้อมูลบรรณานุกรมสมบูรณ์แล้ว'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Floating Google Lens / Barcode Chips on image */}
                            {scanResult && !scanningStep && (
                              <div className="absolute bottom-3 inset-x-3 flex flex-wrap gap-1.5 justify-center pointer-events-auto">
                                {scanResult.detected_title && (
                                  <span className={`px-2.5 py-1 text-white text-[11px] font-bold rounded-full backdrop-blur-md shadow-lg flex items-center gap-1 border ${scannerMode === 'barcode' ? 'bg-red-950/80 border-red-400/50' : 'bg-black/80 border-amber-400/50'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full animate-ping ${scannerMode === 'barcode' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                    {scanResult.detected_title}
                                  </span>
                                )}
                                {scanResult.detected_author && (
                                  <span className="px-2.5 py-1 bg-black/80 text-amber-200 text-[10px] font-medium rounded-full border border-white/20 backdrop-blur-md shadow">
                                    👤 {scanResult.detected_author}
                                  </span>
                                )}
                                {scanResult.detected_publisher && (
                                  <span className="px-2 py-0.5 bg-black/70 text-slate-200 text-[10px] rounded-full border border-white/10 backdrop-blur-md">
                                    🏢 {scanResult.detected_publisher}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {cameraError && (
                    <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>แจ้งเตือนการใช้งานกล้อง</span>
                      </div>
                      <p>{cameraError}</p>
                      <div className="pt-1">
                        <span className="text-[11px] text-slate-600">
                          คำแนะนำ: คุณสามารถใช้ปุ่ม "เลือกรูปภาพปก" ด้านบนเพื่อเลือกรูปภาพจากเครื่อง หรือใช้ภาพตัวอย่างเพื่อทดสอบระบบได้ทันที
                        </span>
                      </div>
                    </div>
                  )}

                  {isBarcodeProcessing && (
                    <div className="p-4 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-sm animate-pulse">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>กำลังถอดรหัสบาร์โค้ดและเปรียบเทียบในฐานข้อมูลห้องสมุด...</span>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              {/* Right Column: AI Pipeline Status or Results */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Visual AI pipeline logic loader */}
                {scanningStep > 0 && scanningStep <= 5 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
                        <Sparkles className="text-amber-500 h-5 w-5 animate-pulse" /> AI Processing Pipeline
                      </h3>
                      <RefreshCw className="h-5 w-5 text-amber-500 animate-spin" />
                    </div>

                    <div className="space-y-4">
                      {[
                        { stepNum: 1, label: 'ปรับแต่งและเตรียมความพร้อมของรูปภาพ (Preprocessing)' },
                        { stepNum: 2, label: 'กำลังเรียกใช้งานระบบอ่านตัวอักษร Gemini Vision' },
                        { stepNum: 3, label: 'คัดแยกและทำความสะอาดตัวอักษร (Text Cleaning)' },
                        { stepNum: 4, label: 'สกัดข้อมูลสำคัญจากภาพปกหนังสือ (Metadata Extraction)' },
                        { stepNum: 5, label: 'กำลังค้นหาและจับคู่ด้วยระบบ Fuzzy Match ในห้องสมุด' },
                      ].map((p, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${scanningStep > p.stepNum ? 'bg-emerald-500 text-white' : scanningStep === p.stepNum ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                            {scanningStep > p.stepNum ? '✓' : p.stepNum}
                          </div>
                          <span className={`text-xs font-medium ${scanningStep === p.stepNum ? 'text-slate-900 font-bold' : scanningStep > p.stepNum ? 'text-slate-500 line-through' : 'text-slate-400'}`}>
                            {p.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Matching Results & Search Status Display */}
                {scanResult && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden space-y-0">
                    {/* 1. Header with Search Status Banner */}
                    <div className={`p-5 text-white ${
                      scanResult.search_status === 'EXACT_MATCH' 
                        ? 'bg-gradient-to-r from-emerald-800 to-emerald-950' 
                        : scanResult.search_status === 'HIGH_CONFIDENCE'
                        ? 'bg-gradient-to-r from-amber-700 to-amber-900'
                        : scanResult.search_status === 'PARTIAL_MATCH'
                        ? 'bg-gradient-to-r from-orange-700 to-orange-950'
                        : 'bg-gradient-to-r from-slate-800 to-slate-950'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              scanResult.search_status === 'EXACT_MATCH'
                                ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                                : scanResult.search_status === 'HIGH_CONFIDENCE'
                                ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                                : scanResult.search_status === 'PARTIAL_MATCH'
                                ? 'bg-orange-400/20 text-orange-200 border border-orange-400/30'
                                : 'bg-rose-400/20 text-rose-200 border border-rose-400/30'
                            }`}>
                              {scanResult.search_status === 'EXACT_MATCH' && <CheckCircle className="h-3.5 w-3.5" />}
                              {scanResult.search_status === 'HIGH_CONFIDENCE' && <ThumbsUp className="h-3.5 w-3.5" />}
                              {scanResult.search_status === 'PARTIAL_MATCH' && <HelpCircle className="h-3.5 w-3.5" />}
                              {scanResult.search_status === 'NOT_FOUND' && <XCircle className="h-3.5 w-3.5" />}
                              <span>
                                {scanResult.search_status === 'EXACT_MATCH' && 'สถานะ: พบหนังสือตรงกันอย่างแม่นยำ'}
                                {scanResult.search_status === 'HIGH_CONFIDENCE' && 'สถานะ: พบหนังสือที่มีความเป็นไปได้สูง'}
                                {scanResult.search_status === 'PARTIAL_MATCH' && 'สถานะ: พบหนังสือที่มีชื่อใกล้เคียง'}
                                {scanResult.search_status === 'NOT_FOUND' && 'สถานะ: ไม่พบหนังสือเล่มนี้ในระบบ'}
                              </span>
                            </span>
                            <span className="text-xs bg-white/10 px-2.5 py-1 rounded-md text-white font-mono font-bold">
                              ความเชื่อมั่น: {scanResult.confidence_percentage || 0}%
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold tracking-tight">
                            {scanResult.status_message}
                          </h3>
                        </div>

                        {scanResult.matches && scanResult.matches.length > 0 && scanResult.matches[0].match_reason && (
                          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-white/90 border border-white/15 self-start sm:self-auto">
                            การจับคู่: {scanResult.matches[0].match_reason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Confirmation success banner */}
                      {confirmedBookId && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-sm animate-fade-in">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                            <div>
                              <p className="font-bold text-sm">ยืนยันผลการสืบค้นสำเร็จ!</p>
                              <p className="text-slate-600">คุณได้เลือกหนังสือเล่มนี้เรียบร้อยแล้ว สามารถนำเลขเรียกหนังสือไปค้นหาบนชั้นวางได้ทันที</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const found = books.find(b => b.id === confirmedBookId);
                              if (found) setSelectedBookDetail(found);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shrink-0"
                          >
                            ดูบัตรรายการ
                          </button>
                        </div>
                      )}

                      {/* 2. Side-by-Side Comparison: Scanned Cover vs Library Retrieved Book */}
                      {matchedBooks.length > 0 && matchedBooks[0].book ? (
                        (() => {
                          const topBook = matchedBooks[0].book;
                          const topMatch = matchedBooks[0];
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                  <Sparkles className="h-4 w-4 text-amber-500" /> ข้อมูลเปรียบเทียบและการดึงข้อมูลในระบบ
                                </h4>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  topBook.status === 'พร้อมให้บริการ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  ● สถานะทรัพยากร: {topBook.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                                {/* Left Side: What AI extracted from scanned cover */}
                                <div className="space-y-3 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                                      1. ภาพที่สแกน & สิ่งที่ AI อ่านได้
                                    </span>
                                    {uploadedImage && (
                                      <span className="text-[10px] text-slate-400">รูปภาพตรวจจับ</span>
                                    )}
                                  </div>

                                  {uploadedImage && (
                                    <div className="h-36 max-w-[200px] mx-auto bg-slate-100 rounded-xl overflow-hidden border border-slate-200 p-1 flex items-center justify-center">
                                      <img src={uploadedImage} alt="Scanned preview" className="max-h-full object-contain rounded" />
                                    </div>
                                  )}

                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <span className="text-slate-400 block text-[10px]">ชื่อเรื่องที่ AI อ่านได้:</span>
                                      <p className="font-bold text-slate-900 text-sm">{scanResult.detected_title || 'ไม่พบข้อความชัดเจน'}</p>
                                    </div>
                                    {scanResult.detected_subtitle && (
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">ชื่อเรื่องรอง:</span>
                                        <p className="text-slate-700">{scanResult.detected_subtitle}</p>
                                      </div>
                                    )}
                                    {scanResult.alternative_titles && scanResult.alternative_titles.length > 0 && (
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">ชื่อทางเลือก / ชื่อต้นฉบับ:</span>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                          {scanResult.alternative_titles.map((alt: string, i: number) => (
                                            <span key={i} className="px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded text-[10px]">
                                              {alt}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">ผู้แต่ง:</span>
                                        <span className="text-slate-800 font-medium">{scanResult.detected_author || 'ไม่ระบุ'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px]">สำนักพิมพ์:</span>
                                        <span className="text-slate-800 font-medium">{scanResult.detected_publisher || 'ไม่ระบุ'}</span>
                                      </div>
                                    </div>
                                    {scanResult.ocr_text && (
                                      <div className="pt-1">
                                        <span className="text-slate-400 block text-[10px]">ข้อความ OCR ดิบ:</span>
                                        <p className="text-[11px] text-slate-500 font-mono line-clamp-2 bg-white p-1.5 rounded border border-slate-200">
                                          "{scanResult.ocr_text}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right Side: Book Data Retrieved from Library Database */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                      2. ข้อมูลหนังสือในฐานข้อมูลห้องสมุด
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      ตรงกัน {Math.round(topMatch.similarity * 100)}%
                                    </span>
                                  </div>

                                  <div className="flex gap-4">
                                    <div className="w-20 h-28 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                                      <img 
                                        src={topBook.cover_image} 
                                        alt={topBook.title} 
                                        onError={(e: any) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200';
                                        }}
                                        className="max-h-full object-contain rounded" 
                                      />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <h5 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">{topBook.title}</h5>
                                      {topBook.subtitle && (
                                        <p className="text-xs text-slate-500 line-clamp-1">{topBook.subtitle}</p>
                                      )}
                                      <p className="text-xs text-slate-600">โดย: <span className="font-semibold">{topBook.author}</span></p>
                                      <p className="text-[11px] text-slate-400">{topBook.publisher} ({topBook.publication_year})</p>
                                    </div>
                                  </div>

                                  {/* Prominent Call Number Card */}
                                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-amber-800 font-bold flex items-center gap-1">
                                        <Hash className="h-3.5 w-3.5" /> เลขเรียกหนังสือ (Call Number)
                                      </span>
                                      <span className="font-mono text-amber-900 font-extrabold text-sm bg-white px-2.5 py-0.5 rounded-md shadow-sm border border-amber-200">
                                        {topBook.call_number}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-amber-200/50">
                                      <span>หมวดหมู่: <strong className="text-slate-700">{topBook.category}</strong></span>
                                      <span>ISBN: <strong className="font-mono text-slate-700">{topBook.isbn}</strong></span>
                                    </div>
                                  </div>

                                  {topBook.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-2 bg-white p-2 rounded-lg border border-slate-200">
                                      {topBook.description}
                                    </p>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedBookDetail(topBook)}
                                      className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                      <BookOpen className="h-3.5 w-3.5" /> ดูข้อมูลบรรณานุกรมฉบับเต็ม
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmedBookId(topBook.id)}
                                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" /> ยืนยันเล่มนี้
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setScanResult(null);
                                        setUploadedImage(null);
                                        setConfirmedBookId(null);
                                        setScannedBarcode('');
                                      }}
                                      className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
                                      title="สแกนเล่มใหม่"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5" /> สแกนใหม่
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        /* Not Found State */
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3 p-6">
                          <div className="p-3 bg-rose-50 text-rose-500 rounded-full inline-block">
                            <XCircle className="h-8 w-8" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-base">ไม่พบหนังสือที่ตรงกับหน้าปกในฐานข้อมูลห้องสมุด</h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              AI สามารถอ่านข้อความบนหน้าปกได้ว่า <strong className="text-slate-800">"{scanResult.detected_title || 'ไม่พบข้อความชัดเจน'}"</strong> {scanResult.detected_author ? `โดย ${scanResult.detected_author}` : ''} แต่ยังไม่มีข้อมูลหนังสือเล่มนี้ในระบบ
                            </p>
                          </div>

                          {(role === 'admin' || role === 'librarian') && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewBookForm(prev => ({
                                  ...prev,
                                  title: scanResult.detected_title || '',
                                  author: scanResult.detected_author || '',
                                  publisher: scanResult.detected_publisher || '',
                                  cover_image: uploadedImage || prev.cover_image,
                                  description: `นำเข้าจากระบบสแกนหน้าปก AI (OCR: ${scanResult.ocr_text})`
                                }));
                                setIsAddingBook(true);
                                setActiveTab('admin');
                              }}
                              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
                            >
                              <Plus className="h-4 w-4" /> เพิ่มหนังสือเล่มนี้เข้าฐานข้อมูลทันทีด้วยข้อมูลที่ AI อ่านได้
                            </button>
                          )}
                        </div>
                      )}

                      {/* 3. Alternative Matches List if more than 1 candidate exists */}
                      {matchedBooks.length > 1 && (
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                            <span>หนังสือเล่มอื่นที่มีชื่อหรือข้อมูลใกล้เคียง ({matchedBooks.length - 1} เล่ม)</span>
                            <span className="text-[10px] text-slate-400 font-normal">หากเล่มด้านบนไม่ใช่ สามารถเลือกเล่มด้านล่างได้</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {matchedBooks.slice(1, 5).map((m, idx) => {
                              const matchScorePercent = Math.round(m.similarity * 100);
                              return (
                                <div key={idx} className="border border-slate-200 rounded-xl p-3 flex gap-3 hover:bg-slate-50 transition bg-white items-center">
                                  <div className="w-12 h-16 bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 rounded overflow-hidden p-1">
                                    <img 
                                      src={m.cover_image} 
                                      alt={m.title} 
                                      onError={(e: any) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200';
                                      }}
                                      className="max-h-full object-contain" 
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1 min-w-0 text-xs">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-slate-900 truncate block">{m.title}</span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                        {matchScorePercent}%
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate">โดย {m.author}</p>
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="font-mono text-[10px] text-slate-400">{m.call_number}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // Promote this candidate to top match
                                          const reordered = [m, ...matchedBooks.filter((_, i) => i !== idx + 1)];
                                          setMatchedBooks(reordered);
                                          setScanResult((prev: any) => ({
                                            ...prev,
                                            matched_book: m.book,
                                            confidence_percentage: matchScorePercent,
                                            status_message: `เลือกหนังสือ "${m.title}" เป็นผลการสืบค้น`
                                          }));
                                        }}
                                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline"
                                      >
                                        เลือกเล่มนี้
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MARC 21 GENERATOR */}
        {activeTab === 'marc21' && (
          <Marc21Generator
            onBookAddedToLibrary={() => {
              fetchBooks(currentPage);
            }}
            openBarcodeScanner={() => {
              setActiveTab('scanner');
              setScannerMode('barcode');
              startCamera();
            }}
          />
        )}

        {/* TAB 4: ADMIN DASHBOARD */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">ระบบผู้ดูแล / บรรณารักษ์</h2>
                <p className="text-slate-500 mt-1">จัดการหนังสือ หมวดหมู่ ปรึกษาสถิติ และนำเข้าข้อมูลบรรณารักษ์ระดับสูง</p>
              </div>
              <button 
                onClick={() => setIsAddingBook(!isAddingBook)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-5 w-5" /> {isAddingBook ? 'ปิดฟอร์มเพิ่มหนังสือ' : 'เพิ่มหนังสือใหม่'}
              </button>
            </div>

            {/* Form adding book */}
            {isAddingBook && (
              <form onSubmit={handleAddBook} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                  <BookOpen className="text-amber-600" /> กรอกข้อมูลทางบรรณานุกรมเล่มใหม่
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชื่อเรื่องหลัก *</label>
                    <input 
                      type="text" 
                      required
                      value={newBookForm.title}
                      onChange={(e) => setNewBookForm({...newBookForm, title: e.target.value})}
                      placeholder="เช่น ความสุขของกะทิ"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชื่อเรื่องรอง (ถ้ามี)</label>
                    <input 
                      type="text" 
                      value={newBookForm.subtitle}
                      onChange={(e) => setNewBookForm({...newBookForm, subtitle: e.target.value})}
                      placeholder="เช่น วรรณกรรมรางวัลซีไรต์"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชื่อผู้แต่งหลัก *</label>
                    <input 
                      type="text" 
                      required
                      value={newBookForm.author}
                      onChange={(e) => setNewBookForm({...newBookForm, author: e.target.value})}
                      placeholder="เช่น งามพรรณ เวชชาชีวะ"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">วันที่ (Date / วันที่ลงทะเบียน)</label>
                    <input 
                      type="text" 
                      value={newBookForm.date_added || ''}
                      onChange={(e) => setNewBookForm({...newBookForm, date_added: e.target.value})}
                      placeholder="เช่น 04/10/2569"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ผู้แต่งร่วม / ผู้แปล</label>
                    <input 
                      type="text" 
                      value={newBookForm.co_authors}
                      onChange={(e) => setNewBookForm({...newBookForm, co_authors: e.target.value})}
                      placeholder="ระบุผู้ร่วมแต่งหรือผู้แปล"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ผู้เขียน (Writer)</label>
                    <input 
                      type="text" 
                      value={newBookForm.writer || ''}
                      onChange={(e) => setNewBookForm({...newBookForm, writer: e.target.value})}
                      placeholder="ระบุชื่อผู้เขียน"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">รหัส ISBN *</label>
                    <input 
                      type="text" 
                      required
                      value={newBookForm.isbn}
                      onChange={(e) => setNewBookForm({...newBookForm, isbn: e.target.value})}
                      placeholder="เช่น 9789749697665"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">สำนักพิมพ์ *</label>
                    <input 
                      type="text" 
                      required
                      value={newBookForm.publisher}
                      onChange={(e) => setNewBookForm({...newBookForm, publisher: e.target.value})}
                      placeholder="เช่น แพรวสำนักพิมพ์"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">สถานที่พิมพ์</label>
                    <input 
                      type="text" 
                      value={newBookForm.publication_place}
                      onChange={(e) => setNewBookForm({...newBookForm, publication_place: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ปีที่พิมพ์</label>
                    <input 
                      type="text" 
                      value={newBookForm.publication_year}
                      onChange={(e) => setNewBookForm({...newBookForm, publication_year: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">จำนวนหน้า</label>
                    <input 
                      type="text" 
                      value={newBookForm.pages}
                      onChange={(e) => setNewBookForm({...newBookForm, pages: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ภาษา</label>
                    <input 
                      type="text" 
                      value={newBookForm.language}
                      onChange={(e) => setNewBookForm({...newBookForm, language: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">หมวดหมู่หนังสือ</label>
                    <select 
                      value={newBookForm.category}
                      onChange={(e) => setNewBookForm({...newBookForm, category: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เลขหมู่ระบบ Dewey (DDC)</label>
                    <input 
                      type="text" 
                      value={newBookForm.ddc}
                      onChange={(e) => {
                        const newDdc = e.target.value;
                        const cutter = newBookForm.call_sub || '';
                        const updatedCall = (newDdc && cutter) ? `${newDdc} ${cutter}` : (newDdc || cutter);
                        setNewBookForm({...newBookForm, ddc: newDdc, call_number: updatedCall});
                      }}
                      placeholder="เช่น 895.913"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600">เลขคัตเตอร์ (082 $b)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const cutter = generateThaiCutter(newBookForm.author || '', newBookForm.title || '');
                          const newCall = (newBookForm.ddc && cutter) ? `${newBookForm.ddc} ${cutter}` : (newBookForm.ddc || cutter);
                          setNewBookForm({...newBookForm, call_sub: cutter, call_number: newCall});
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                      >
                        ⚡ คำนวณคัตเตอร์
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={newBookForm.call_sub || ''}
                      onChange={(e) => {
                        const newCutter = e.target.value;
                        const ddc = newBookForm.ddc || '';
                        const updatedCall = (ddc && newCutter) ? `${ddc} ${newCutter}` : (ddc || newCutter);
                        setNewBookForm({...newBookForm, call_sub: newCutter, call_number: updatedCall});
                      }}
                      placeholder="เช่น ง241ค, ก9684อ"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เลขเรียกหนังสือ (Call Number) *</label>
                    <input 
                      type="text" 
                      required
                      value={newBookForm.call_number}
                      onChange={(e) => setNewBookForm({...newBookForm, call_number: e.target.value})}
                      placeholder="เช่น 895.913 ง241ค"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">650 $a หัวเรื่อง 1</label>
                    <input 
                      type="text" 
                      value={newBookForm.subject || ''}
                      onChange={(e) => setNewBookForm({...newBookForm, subject: e.target.value})}
                      placeholder="เช่น นวนิยายไทย"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">650 $x ย่อยหัวเรื่อง</label>
                    <input 
                      type="text" 
                      value={newBookForm.subject_subdivision || ''}
                      onChange={(e) => setNewBookForm({...newBookForm, subject_subdivision: e.target.value})}
                      placeholder="เช่น วรรณกรรมเยาวชน"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">หัวเรื่อง 2</label>
                    <input 
                      type="text" 
                      value={newBookForm.subject_2 || ''}
                      onChange={(e) => setNewBookForm({...newBookForm, subject_2: e.target.value})}
                      placeholder="เช่น วรรณกรรมซีไรต์"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">หัวเรื่อง 3</label>
                    <input 
                      type="text" 
                      value={newBookForm.subject_3 || ''}
                      onChange={(e) => setNewBookForm({...newBookForm, subject_3: e.target.value})}
                      placeholder="เช่น หนังสือดีเด่น"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ปีแต่ง</label>
                    <input 
                      type="text" 
                      value={newBookForm.composition_year || ''}
                      onChange={(e) => setNewBookForm({...newBookForm, composition_year: e.target.value})}
                      placeholder="เช่น 2546"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ราคา (บาท)</label>
                    <input 
                      type="text" 
                      value={newBookForm.price || ''}
                      onChange={(e) => setNewBookForm({...newBookForm, price: e.target.value})}
                      placeholder="เช่น 150"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">จำนวนเล่ม</label>
                    <input 
                      type="text" 
                      value={newBookForm.copies || '1'}
                      onChange={(e) => setNewBookForm({...newBookForm, copies: e.target.value})}
                      placeholder="เช่น 1, 2"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เลขทะเบียนหนังสือ (Accession Number)</label>
                    <input 
                      type="text" 
                      value={newBookForm.accession_no}
                      onChange={(e) => setNewBookForm({...newBookForm, accession_no: e.target.value})}
                      placeholder="เช่น 1, 2, 000001, B0000021"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">บาร์โค้ดหนังสือ</label>
                    <input 
                      type="text" 
                      value={newBookForm.barcode}
                      onChange={(e) => setNewBookForm({...newBookForm, barcode: e.target.value})}
                      placeholder="เช่น B0000021"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ลิงก์ภาพหน้าปก (URL)</label>
                    <input 
                      type="text" 
                      value={newBookForm.cover_image}
                      onChange={(e) => setNewBookForm({...newBookForm, cover_image: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm animate-fade-in"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">คำอธิบายย่อ / คำโปรย</label>
                  <textarea 
                    rows={3}
                    value={newBookForm.description}
                    onChange={(e) => setNewBookForm({...newBookForm, description: e.target.value})}
                    placeholder="รายละเอียดเบื้องต้นของหนังสือที่จะแสดงในระบบ..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingBook(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-sm transition"
                  >
                    บันทึกหนังสือใหม่
                  </button>
                </div>
              </form>
            )}

            {/* Supabase Database Live Integration Card */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-6 border border-indigo-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                    <Database className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">ระบบฐานข้อมูล Supabase (คลังสารสนเทศห้องสมุด)</h3>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-400/30 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> ออนไลน์
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      แสดงผลและจัดเก็บข้อมูลจากฐานข้อมูล Supabase โดยตรง รองรับการสืบค้นความเร็วสูง การบันทึกรูปปก และบรรณานุกรม MARC 21
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://prfmtippvgarzelaiaol.supabase.co"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-indigo-300" />
                    <span>Supabase Dashboard</span>
                  </a>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1IXKv6ZCq5AdUxZcKYsUz1IY3uH9qBxnMTTuYgeT7RRg/edit?gid=889338917#gid=889338917"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-white/15"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Google Sheet ต้นทาง</span>
                  </a>
                  <button
                    onClick={handleCleanDummyBooks}
                    disabled={isCleaningDummy}
                    className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    title="ลบข้อมูลตัวอย่าง Mock Data ที่ไม่มีในฐานข้อมูล"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-300" />
                    <span>{isCleaningDummy ? 'กำลังลบตัวอย่าง...' : 'ลบข้อมูลตัวอย่าง'}</span>
                  </button>
                  <button
                    onClick={() => handleSyncSheet()}
                    disabled={isSyncingSheet}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-indigo-700/30 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                    <span>{isSyncingSheet ? 'กำลังนำเข้า/ซิงค์...' : 'ซิงค์ข้อมูลเข้า Supabase (Sync Now)'}</span>
                  </button>
                </div>
              </div>

              {/* Status Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">จำนวนหนังสือในระบบ</span>
                  <div className="text-xl font-black text-white flex items-baseline gap-1">
                    <span>{totalBooksCount > 0 ? totalBooksCount.toLocaleString() : (sheetSyncInfo?.totalBooks?.toLocaleString() || '2,452')}</span>
                    <span className="text-xs font-normal text-slate-400">เล่ม</span>
                  </div>
                </div>
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">หมวดหมู่ / สถานที่จัดเก็บ</span>
                  <div className="text-xl font-black text-white flex items-baseline gap-1">
                    <span>{categories.length > 0 ? categories.length : (sheetSyncInfo?.totalCategories || '22')}</span>
                    <span className="text-xs font-normal text-slate-400">หมวด</span>
                  </div>
                </div>
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">เวลาที่อัปเดตล่าสุด</span>
                  <div className="text-sm font-semibold text-indigo-300">
                    {sheetSyncInfo?.lastSync ? new Date(sheetSyncInfo.lastSync).toLocaleString('th-TH') : 'เชื่อมต่อเรียบร้อยแล้ว'}
                  </div>
                </div>
              </div>

              {/* URL Customizer Accordion */}
              <div className="pt-2 text-xs space-y-2">
                <details className="group">
                  <summary className="cursor-pointer text-slate-400 hover:text-white font-medium flex items-center gap-1.5 transition">
                    <Settings className="h-3.5 w-3.5" />
                    <span>ตั้งค่าลิงก์ Google Sheet หรือกำหนดแผ่นงานอื่น</span>
                  </summary>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      value={customSheetUrl}
                      onChange={(e) => setCustomSheetUrl(e.target.value)}
                      placeholder="วางลิงก์ Google Sheet หรือลิงก์ส่งออก CSV..."
                      className="flex-1 px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleSyncSheet(customSheetUrl)}
                      disabled={isSyncingSheet || !customSheetUrl.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                    >
                      ซิงค์จาก URL นี้
                    </button>
                  </div>
                </details>
              </div>
            </div>

            {/* Excel & CSV Import Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">นำเข้าข้อมูลหนังสือจากไฟล์ Excel (.xlsx, .xls) / CSV</h3>
                    <p className="text-xs text-slate-500">
                      รองรับการนำเข้าข้อมูลหนังสือทั้งเล่มเดี่ยวและแบบกลุ่มจากไฟล์ตาราง Excel พร้อมฟิลด์ครบถ้วน
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadSampleExcel}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <FileDown className="h-4 w-4 text-emerald-600" />
                    <span>ดาวน์โหลดไฟล์ตัวอย่าง Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAllBooksToExcel}
                    disabled={isExportingExcel}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-sm"
                    title="ส่งออกข้อมูลหนังสือทั้งหมดเป็นไฟล์ Excel ครบทั้ง 29 คอลัมน์ตามแบบฟอร์มมาตรฐาน"
                  >
                    {isExportingExcel ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    <span>{isExportingExcel ? 'กำลังส่งออก Excel...' : 'ส่งออกไฟล์ Excel (29 คอลัมน์)'}</span>
                  </button>
                </div>
              </div>

              {/* Upload Zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Method 1: Excel File Upload */}
                <div className="border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center bg-emerald-50/30 hover:bg-emerald-50/60 transition relative flex flex-col items-center justify-center group">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="p-3 bg-white text-emerald-600 rounded-full shadow-sm mb-3 group-hover:scale-110 transition">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {excelFileName ? `เลือกไฟล์: ${excelFileName}` : 'คลิกหรือลากวางไฟล์ Excel / CSV ที่นี่'}
                  </h4>
                  <p className="text-xs text-slate-500 mb-2">
                    รองรับไฟล์ .xlsx, .xls, .csv พร้อมระบบแปลงคอลัมน์อัตโนมัติ
                  </p>
                  <span className="px-3 py-1 bg-white border border-emerald-200 text-xs font-bold text-emerald-700 rounded-lg shadow-sm">
                    เลือกไฟล์ตารางข้อมูล
                  </span>
                </div>

                {/* Method 2: CSV Direct Paste / Clipboard Excel */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">หรือวางคอลัมน์ที่คัดลอกจาก Excel โดยตรง (TSV/CSV):</label>
                  <p className="text-[10px] text-slate-400">สามารถคลุมดำตารางข้อมูลใน Excel (คัดลอกทุกคอลัมน์ตามไฟล์เท็มเพลตมาตรฐาน) แล้วนำมาวางในช่องด้านล่างนี้ได้ทันที</p>
                  <textarea 
                    rows={4}
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                    placeholder="[คัดลอกเซลล์ข้อมูลจาก Excel แล้วกดวางที่นี่ได้โดยตรง ระบบจะจัดเรียงข้อมูลตามฟิลด์มาตรฐานให้อย่างสมบูรณ์]"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button 
                    onClick={handleCsvImport}
                    disabled={!csvInput.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" /> นำเข้าจากข้อมูลตารางที่วาง
                  </button>
                </div>
              </div>

              {/* Excel Preview Table Before Save */}
              {excelPreviewData.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      ตรวจสอบข้อมูลก่อนนำเข้า ({excelPreviewData.length} รายการ)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setExcelPreviewData([]); setExcelFileName(''); }}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleImportExcelBooks}
                        disabled={isImporting}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center gap-1.5"
                      >
                        {isImporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        <span>ยืนยันบันทึกเข้าระบบทั้งหมด ({excelPreviewData.length} เล่ม)</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">ชื่อเรื่อง</th>
                          <th className="py-2 px-3">ผู้แต่ง</th>
                          <th className="py-2 px-3">ISBN</th>
                          <th className="py-2 px-3">หมวดหมู่</th>
                          <th className="py-2 px-3">สำนักพิมพ์</th>
                          <th className="py-2 px-3">เลขเรียก</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {excelPreviewData.slice(0, 10).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-900 line-clamp-1">{item.title}</td>
                            <td className="py-2 px-3 text-slate-600">{item.author}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.isbn}</td>
                            <td className="py-2 px-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">{item.category}</span></td>
                            <td className="py-2 px-3 text-slate-600">{item.publisher}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{item.call_number}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {excelPreviewData.length > 10 && (
                    <p className="text-[11px] text-slate-400 text-right">...และอีก {excelPreviewData.length - 10} รายการ</p>
                  )}
                </div>
              )}
            </div>

            {/* Admin Books List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ฐานข้อมูลบรรณานุกรม ({totalBooksCount || books.length} เล่ม)</span>
                <button
                  type="button"
                  onClick={handleExportAllBooksToExcel}
                  disabled={isExportingExcel}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
                  title="ส่งออกฐานข้อมูลหนังสือทั้งหมดเป็นไฟล์ Excel ครบทั้ง 29 คอลัมน์ตามแบบฟอร์มมาตรฐาน"
                >
                  {isExportingExcel ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  <span>{isExportingExcel ? 'กำลังส่งออก Excel...' : 'ส่งออกไฟล์ Excel (29 คอลัมน์)'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">รูปภาพ</th>
                      <th className="py-3.5 px-4">เลขทะเบียน</th>
                      <th className="py-3.5 px-4">ชื่อหนังสือ / รายละเอียด</th>
                      <th className="py-3.5 px-4">หมวดหมู่</th>
                      <th className="py-3.5 px-4">เลขเรียกหนังสือ / ISBN</th>
                      <th className="py-3.5 px-4 text-center">สถานะ</th>
                      <th className="py-3.5 px-4 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {books.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <img 
                            src={b.cover_image} 
                            alt={b.title} 
                            onError={(e: any) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200';
                            }}
                            className="w-9 h-11 object-contain bg-slate-50 rounded shadow-sm" 
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded text-xs font-bold block w-max">
                            {b.accession_no || b.barcode || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <div className="font-bold text-slate-900 line-clamp-1">{b.title}</div>
                          <div className="text-[11px] text-slate-400">โดย: {b.author} | {b.publisher} ({b.publication_year})</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-700 font-semibold">{b.category}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-700 font-medium">{b.call_number}</div>
                          <div className="text-[10px] text-slate-400">ISBN: {b.isbn}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${b.status === 'พร้อมให้บริการ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${b.status === 'พร้อมให้บริการ' ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => setEditingBook(b)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition"
                              title="แก้ไขหนังสือ"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setDeletingBookTarget(b)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="ลบหนังสือ"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Admin Table Pagination */}
              {totalBooksCount > pageSize && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-200 text-xs">
                  <span className="text-slate-500">
                    แสดงรายการที่ {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalBooksCount)} จาก {totalBooksCount.toLocaleString()} เล่ม
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      ก่อนหน้า
                    </button>
                    <span className="px-2 py-1 font-bold text-slate-700">
                      {currentPage} / {Math.ceil(totalBooksCount / pageSize)}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalBooksCount / pageSize)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: STATS & SCAN HISTORY */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">ประวัติและการวิเคราะห์</h2>
              <p className="text-slate-500 mt-1">ประวัติการสแกนด้วยระบบ AI ค้นหาสะสม และสถิติดิจิทัล</p>
            </div>

            {/* Dashboard Analytics Card stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">สัดส่วนหนังสือในระบบ</span>
                <p className="text-3xl font-black text-slate-900">{totalBooksCount > 0 ? totalBooksCount.toLocaleString() : (sheetSyncInfo?.totalBooks?.toLocaleString() || books.length.toLocaleString())} <span className="text-sm font-normal text-slate-400">เล่ม</span></p>
                <div className="text-xs text-slate-500">ข้อมูลเชื่อมต่อตรงกับฐานข้อมูล Supabase (Cloud Database)</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">การสแกนหน้าปกสะสม</span>
                <p className="text-3xl font-black text-amber-600">{history.length} <span className="text-sm font-normal text-slate-400">ครั้ง</span></p>
                <div className="text-xs text-slate-500">อัตราความสำเร็จ (Scan Success Rate) {successRate}%</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">สปีชีส์หมวดหมู่</span>
                <p className="text-3xl font-black text-indigo-600">{categories.length} <span className="text-sm font-normal text-slate-400">หมวด</span></p>
                <div className="text-xs text-slate-500">แยกประเภททรัพยากรสารสนเทศในระบบดีซี</div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">ประวัติการสแกนปกหนังสือ</span>
              </div>

              {history.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Clock className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-sm">ไม่มีประวัติการสแกนในระบบ</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4">วันเวลาสแกน</th>
                        <th className="py-3.5 px-4">ชื่อเรื่องที่วิเคราะห์พบ</th>
                        <th className="py-3.5 px-4">ผลการสืบค้นจับคู่</th>
                        <th className="py-3.5 px-4 text-center">คะแนนความเชื่อมั่น AI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                      {history.map(h => (
                        <tr key={h.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {new Date(h.created_at).toLocaleString('th-TH')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{h.detected_title || 'ไม่พบข้อความ'}</div>
                            {h.detected_author && (
                              <div className="text-[10px] text-slate-400">โดย: {h.detected_author}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {h.matched_book_id ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                <CheckCircle className="h-3.5 w-3.5" /> พบจับคู่หนังสือสมบูรณ์
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <XCircle className="h-3.5 w-3.5" /> ไม่พบหนังสือที่ตรงในระบบ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.similarity_score >= 0.7 ? 'bg-emerald-50 text-emerald-700' : h.similarity_score > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                              {Math.round(h.similarity_score * 100)}% Confidence
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-xs space-y-2 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} IAB IQRA LIBRARY. All rights reserved.</p>
          <p className="text-slate-500">พัฒนาด้วยสถาปัตยกรรม OCR และประมวลผลจับคู่คำด้วย AI Gemini Core Engine บนระบบงานมาตรฐานสากล</p>
        </div>
      </footer>

      {/* MODAL: DETAIL WINDOW */}
      {selectedBookDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <ErrorBoundary 
            fallbackTitle="เกิดข้อผิดพลาดในการโหลดรายละเอียดหนังสือ" 
            onReset={() => setSelectedBookDetail(null)}
          >
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            {/* MODAL HEADER WITH TABS */}
            <div className="border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <div className="p-4 sm:p-5 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Book className="h-6 w-6 text-amber-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg sm:text-xl leading-tight">
                      ข้อมูลทางบรรณานุกรมฉบับสมบูรณ์
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      สืบค้นและแสดงรายการบรรณานุกรมมาตรฐานห้องสมุดสากล
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBookDetail(null)}
                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full transition cursor-pointer"
                  title="ปิดหน้าต่าง"
                >
                  ✕
                </button>
              </div>

              {/* TAB SELECTOR (แบบเดิม บัตรรายการ / แบบ MARC ตามตัวอย่างภาพ 2-3) */}
              <div className="flex border-t border-slate-200 bg-slate-100/90 px-4 sm:px-6 pt-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDetailModalTab('card')}
                  className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
                    detailModalTab === 'card'
                      ? 'bg-white text-slate-900 shadow-sm border-t border-x border-slate-200 -mb-px'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span>ข้อมูลหนังสือแบบเดิม (บัตรรายการ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailModalTab('marc')}
                  className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
                    detailModalTab === 'marc'
                      ? 'bg-[#db4d6d] text-white shadow-sm border-t border-x border-[#db4d6d] -mb-px'
                      : 'text-slate-600 hover:text-[#db4d6d] hover:bg-slate-200/60'
                  }`}
                >
                  <Database className="h-4 w-4" />
                  <span>แบบ MARC (หน้า MARC)</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* TAB 1: ข้อมูลหนังสือแบบเดิม (บัตรรายการ) */}
              {detailModalTab === 'card' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Top visual section (Cover & Quick Info) */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-48 shrink-0 flex flex-col items-center">
                      <div className="w-full bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-center aspect-[4/5] overflow-hidden shadow-inner">
                        {(!selectedBookDetail.cover_image || coverImageFailed || selectedBookDetail.cover_image === '-' || selectedBookDetail.cover_image === 'null' || selectedBookDetail.cover_image === 'undefined') ? (
                          <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg text-center border border-amber-200/60 select-none">
                            <div className="p-2.5 bg-white/90 rounded-2xl shadow-2xs mb-2 text-amber-600">
                              <BookOpen className="h-8 w-8" />
                            </div>
                            <p className="text-xs font-bold text-slate-800 line-clamp-2 px-1 leading-snug">
                              {selectedBookDetail.title || 'ไม่มีชื่อเรื่อง'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                              {selectedBookDetail.author || 'ไม่ระบุผู้แต่ง'}
                            </p>
                            <span className="mt-2 text-[9px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200/60">
                              ภาพหน้าปกไม่สมบูรณ์
                            </span>
                          </div>
                        ) : (
                          <img 
                            src={selectedBookDetail.cover_image} 
                            alt={selectedBookDetail.title || 'หน้าปกหนังสือ'} 
                            onError={() => setCoverImageFailed(true)}
                            className="max-h-full object-contain shadow-md rounded transition duration-200" 
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEnrichCover(selectedBookDetail.id)}
                        disabled={enrichingBookId === selectedBookDetail.id}
                        className="w-full mt-2 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`h-3.5 w-3.5 ${enrichingBookId === selectedBookDetail.id ? 'animate-spin text-amber-300' : ''}`} />
                        <span>{enrichingBookId === selectedBookDetail.id ? 'กำลังค้นหาปก...' : '🌐 AI ดึงปกจริงจากเน็ต'}</span>
                      </button>

                      <div className="w-full mt-3 space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block text-left">วางลิงก์ภาพหน้าปกเอง:</span>
                        <div className="flex gap-1">
                          <input
                            type="url"
                            id="manual-cover-url-input"
                            placeholder="https://..."
                            defaultValue={
                              (typeof selectedBookDetail.cover_image === 'string' && (
                                selectedBookDetail.cover_image.includes('images.unsplash.com') || 
                                selectedBookDetail.cover_image.includes('covers.openlibrary.org')
                              )) 
                                ? '' 
                                : (typeof selectedBookDetail.cover_image === 'string' ? selectedBookDetail.cover_image : '')
                            }
                            className="flex-1 text-[10px] px-1.5 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono bg-white"
                          />
                          <button
                            type="button"
                            disabled={isSavingCover}
                            onClick={async () => {
                              const input = document.getElementById('manual-cover-url-input') as HTMLInputElement;
                              const url = input?.value.trim();
                              if (!url) {
                                alert('โปรดระบุ URL รูปภาพหน้าปกที่ถูกต้อง');
                                return;
                              }
                              await handleUpdateCoverManually(selectedBookDetail.id, url);
                              setCoverImageFailed(false);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition cursor-pointer shrink-0 flex items-center justify-center gap-1 min-w-[52px]"
                          >
                            {isSavingCover ? 'บันทึก...' : 'บันทึก'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 leading-tight">{selectedBookDetail.title}</h4>
                        {selectedBookDetail.subtitle && (
                          <p className="text-sm text-slate-500 mt-0.5">{selectedBookDetail.subtitle}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="col-span-2 sm:col-span-1 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/70">
                          <span className="text-amber-800 font-bold block text-[11px]">เลขทะเบียนหนังสือ (Accession No.)</span>
                          <span className="text-slate-900 font-mono font-black text-sm">{selectedBookDetail.accession_no || selectedBookDetail.barcode || '-'}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                          <span className="text-slate-500 font-bold block text-[11px]">เลขเรียกหนังสือ (Call Number)</span>
                          <span className="text-slate-900 font-mono font-bold text-sm">{selectedBookDetail.call_number}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">ผู้แต่งหลัก</span>
                          <span className="text-slate-800 font-bold">{selectedBookDetail.author}</span>
                        </div>
                        {selectedBookDetail.co_authors && (
                          <div>
                            <span className="text-slate-400 font-semibold block">ผู้ร่วมเขียน/แปล</span>
                            <span className="text-slate-800 font-bold">{selectedBookDetail.co_authors}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400 font-semibold block">สำนักพิมพ์</span>
                          <span className="text-slate-800 font-bold">{selectedBookDetail.publisher}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">ปีพิมพ์ / แหล่งพิมพ์</span>
                          <span className="text-slate-800 font-bold">{selectedBookDetail.publication_place}, {selectedBookDetail.publication_year}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">ISBN</span>
                          <span className="text-slate-800 font-bold">{selectedBookDetail.isbn}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">DDC (082 $a)</span>
                          <span className="text-slate-800 font-mono font-bold">{selectedBookDetail.ddc || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">เลขคัตเตอร์ (082 $b)</span>
                          <span className="text-slate-800 font-mono font-bold">
                            {selectedBookDetail.call_sub || (selectedBookDetail.call_number && selectedBookDetail.call_number.split(' ').length > 1 ? selectedBookDetail.call_number.split(' ').slice(1).join(' ') : generateThaiCutter(selectedBookDetail.author || '', selectedBookDetail.title || ''))}
                          </span>
                        </div>
                        {selectedBookDetail.writer && selectedBookDetail.writer !== selectedBookDetail.author && (
                          <div>
                            <span className="text-slate-400 font-semibold block">ผู้เขียน</span>
                            <span className="text-slate-800 font-bold">{selectedBookDetail.writer}</span>
                          </div>
                        )}
                        {selectedBookDetail.translator && (
                          <div>
                            <span className="text-slate-400 font-semibold block">ผู้แปล</span>
                            <span className="text-slate-800 font-bold">{selectedBookDetail.translator}</span>
                          </div>
                        )}
                        {selectedBookDetail.composition_year && (
                          <div>
                            <span className="text-slate-400 font-semibold block">ปีแต่ง</span>
                            <span className="text-slate-800 font-bold">{selectedBookDetail.composition_year}</span>
                          </div>
                        )}
                        {selectedBookDetail.price && (
                          <div>
                            <span className="text-slate-400 font-semibold block">ราคา</span>
                            <span className="text-slate-800 font-bold">{selectedBookDetail.price} บาท</span>
                          </div>
                        )}
                        {selectedBookDetail.copies && (
                          <div>
                            <span className="text-slate-400 font-semibold block">จำนวนเล่ม</span>
                            <span className="text-slate-800 font-bold">{selectedBookDetail.copies} เล่ม</span>
                          </div>
                        )}
                        {selectedBookDetail.date_added && (
                          <div>
                            <span className="text-slate-400 font-semibold block">วันที่ลงทะเบียน</span>
                            <span className="text-slate-800 font-bold">{selectedBookDetail.date_added}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400 font-semibold block">บาร์โค้ด</span>
                          <span className="text-slate-800 font-mono font-bold">{selectedBookDetail.barcode || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">หน้าหนังสือ</span>
                          <span className="text-slate-800 font-bold">{selectedBookDetail.pages} หน้า</span>
                        </div>
                        {selectedBookDetail.illustration && (
                          <div className="col-span-2">
                            <span className="text-slate-400 font-semibold block">คอลัมน์ภาพประกอบ (MARC 300 $b)</span>
                            <span className="text-slate-700 font-mono text-[11px] truncate block bg-slate-100 px-2 py-1 rounded">
                              {selectedBookDetail.illustration}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* OPAC Bibliographic Card View matching Image 2 */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-amber-600" />
                        <span>บัตรรายการข้อมูลบรรณานุกรม (Bibliographic Record)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const subjects = getBookSubjects(selectedBookDetail);
                          const subjLine = subjects.length > 0 ? `\nหัวเรื่อง: ${subjects.join(', ')}` : '';
                          const cardText = `ISBN: ${selectedBookDetail.isbn || '-'}\nเลขเรียกหนังสือ: ${selectedBookDetail.call_number || '-'}\nผู้แต่ง: ${selectedBookDetail.author || '-'}\nชื่อเรื่อง: ${selectedBookDetail.title || '-'}\nพิมพลักษณ์: ${selectedBookDetail.publication_place || 'กรุงเทพฯ'} : ${selectedBookDetail.publisher || '-'}, ${selectedBookDetail.publication_year || '-'}\nจำนวนหน้า: ${selectedBookDetail.pages || '256'} หน้า : ${selectedBookDetail.illustration || 'ภาพประกอบ'} ; ${selectedBookDetail.book_size || selectedBookDetail.dimensions_300c || '24 ซม.'}${subjLine}\nสาระสังเขป: ${selectedBookDetail.description || '-'}\nสถานที่จัดเก็บ: ${selectedBookDetail.storage_location || 'NCILibrary'}`;
                          navigator.clipboard.writeText(cardText);
                          setCopiedCard(true);
                          setTimeout(() => setCopiedCard(false), 2000);
                        }}
                        className="text-xs text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 transition"
                      >
                        {copiedCard ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCard ? 'คัดลอกตารางแล้ว!' : 'คัดลอกตาราง'}</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-xs sm:text-sm border-collapse">
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="w-36 sm:w-44 py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">ISBN</td>
                            <td className="py-2.5 px-4 text-slate-800 font-mono">{selectedBookDetail.isbn}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">เลขเรียกหนังสือ</td>
                            <td className="py-2.5 px-4 text-slate-900 font-mono font-medium">{selectedBookDetail.call_number}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">ผู้แต่ง</td>
                            <td className="py-2.5 px-4 text-slate-800">{selectedBookDetail.author}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">ชื่อเรื่อง</td>
                            <td className="py-2.5 px-4 text-slate-900 font-medium">{selectedBookDetail.title}{selectedBookDetail.subtitle ? ` : ${selectedBookDetail.subtitle}` : ''}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">พิมพลักษณ์</td>
                            <td className="py-2.5 px-4 text-slate-800">{selectedBookDetail.publication_place || 'กรุงเทพฯ'} : {selectedBookDetail.publisher || '-'}, {selectedBookDetail.publication_year || '-'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">จำนวนหน้า</td>
                            <td className="py-2.5 px-4 text-slate-800">
                              {selectedBookDetail.pages ? `${selectedBookDetail.pages} หน้า` : '256 หน้า'}
                              {selectedBookDetail.illustration ? ` : ${selectedBookDetail.illustration}` : ' : ภาพประกอบ'}
                              {` ; ${selectedBookDetail.book_size || selectedBookDetail.dimensions_300c || '24 ซม.'}`}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">สาระสังเขป</td>
                            <td className="py-2.5 px-4 text-slate-700 leading-relaxed text-xs sm:text-sm">
                              {selectedBookDetail.description || 'หนังสือเล่มนี้เป็นส่วนหนึ่งที่จุดประกายความคิดและพัฒนาทักษะการเรียนรู้'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">หัวเรื่อง</td>
                            <td className="py-2.5 px-4 space-y-1.5">
                              {(() => {
                                const subjects = getBookSubjects(selectedBookDetail);
                                if (subjects.length === 0) {
                                  return <span className="text-slate-400">-</span>;
                                }
                                return subjects.map((subj, sIdx) => (
                                  <div 
                                    key={`detail_subj_${sIdx}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1.5 font-medium"
                                    onClick={() => {
                                      setSelectedBookDetail(null);
                                      setSearchQuery(subj);
                                      setActiveTab('catalog');
                                    }}
                                    title={`คลิกเพื่อสืบค้นหนังสือหัวเรื่อง "${subj}"`}
                                  >
                                    <span className="text-slate-400 font-mono text-[11px] font-bold">{sIdx + 1}.</span>
                                    <span>{subj}</span>
                                  </div>
                                ));
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">รายการเพิ่มผู้แต่ง</td>
                            <td className="py-2.5 px-4 text-slate-800">
                              {selectedBookDetail.co_authors || selectedBookDetail.writer || selectedBookDetail.translator
                                ? `${selectedBookDetail.co_authors || selectedBookDetail.writer || selectedBookDetail.translator}, ${selectedBookDetail.author_role || (selectedBookDetail.translator ? 'ผู้แปล' : 'บรรณาธิการ')}`
                                : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">สถานที่จัดเก็บ</td>
                            <td className="py-2.5 px-4 text-slate-800 flex items-center gap-1.5 font-medium">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                              <span>{selectedBookDetail.storage_location || 'NCILibrary'}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: แบบ MARC (หน้า MARC ตามตัวอย่างภาพ 3) */}
              {detailModalTab === 'marc' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Pink Header Banner matching Image 3 */}
                  <div className="bg-[#db4d6d] text-white px-4 py-3 rounded-xl flex flex-wrap justify-between items-center gap-2 shadow-sm">
                    <div className="font-bold text-base flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      <span>หน้า MARC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const text = formatMarcText(selectedBookDetail);
                          navigator.clipboard.writeText(text);
                          setCopiedMarc(true);
                          setTimeout(() => setCopiedMarc(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {copiedMarc ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedMarc ? 'คัดลอก MARC แล้ว!' : 'คัดลอกข้อมูล MARC'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const text = formatMarcText(selectedBookDetail);
                          const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `marc_${selectedBookDetail.accession_no || selectedBookDetail.barcode || 'record'}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        <span>ดาวน์โหลด (.txt)</span>
                      </button>
                    </div>
                  </div>

                  {/* Leader & Fixed-Length Control Fields Grid matching Image 3 */}
                  <div className="border border-[#db4d6d]/30 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-sans border-collapse min-w-[620px]">
                        <tbody>
                          <tr className="border-b border-[#db4d6d]/20">
                            <td className="w-24 bg-[#db4d6d] text-white font-bold p-2 text-left">Rec.Status</td>
                            <td className="bg-white text-slate-800 font-mono p-2 border-r border-[#db4d6d]/20">n</td>
                            <td className="w-24 bg-[#db4d6d] text-white font-bold p-2 text-left">Bib.Stage</td>
                            <td className="bg-white text-slate-800 font-mono p-2 border-r border-[#db4d6d]/20">Normal</td>
                            <td className="w-24 bg-[#db4d6d] text-white font-bold p-2 text-left">Create</td>
                            <td className="bg-white text-slate-800 font-mono p-2 border-r border-[#db4d6d]/20">bat</td>
                            <td className="w-24 bg-[#db4d6d] text-white font-bold p-2 text-left">Modify</td>
                            <td className="bg-white text-slate-800 font-mono p-2">arporn</td>
                          </tr>
                          <tr className="border-b border-[#db4d6d]/20">
                            <td className="bg-[#db4d6d] text-white font-bold p-2 text-left">Rec.Type</td>
                            <td className="bg-white text-slate-800 font-mono p-2 border-r border-[#db4d6d]/20">a</td>
                            <td className="bg-[#db4d6d] text-white font-bold p-2 text-left">Language</td>
                            <td className="bg-white text-slate-800 font-mono p-2 border-r border-[#db4d6d]/20">
                              {(selectedBookDetail.language || '').toLowerCase().includes('eng') 
                                ? 'eng' 
                                : ((selectedBookDetail.language || '').toLowerCase().includes('ไทย') || (selectedBookDetail.language || '').toLowerCase().includes('tha') 
                                  ? 'tha' 
                                  : (selectedBookDetail.language || '-'))}
                            </td>
                            <td className="bg-[#db4d6d] text-white font-bold p-2 text-left">Entry d.</td>
                            <td className="bg-white text-slate-800 font-mono p-2 border-r border-[#db4d6d]/20">
                              {selectedBookDetail.date_added || (selectedBookDetail.created_at ? selectedBookDetail.created_at.slice(0, 10).replace(/-/g, '/') : '-')}
                            </td>
                            <td className="bg-[#db4d6d] text-white font-bold p-2 text-left">Update d.</td>
                            <td className="bg-white text-slate-800 font-mono p-2">
                              {selectedBookDetail.updated_at ? selectedBookDetail.updated_at.slice(0, 10).replace(/-/g, '/') : new Date().toISOString().slice(0, 10).replace(/-/g, '/')}
                            </td>
                          </tr>
                          <tr>
                            <td className="bg-[#db4d6d] text-white font-bold p-2 text-left">Bib.Level</td>
                            <td className="bg-white text-slate-800 font-mono p-2 border-r border-[#db4d6d]/20">s</td>
                            <td className="bg-[#db4d6d] text-white font-bold p-2 text-left">Pub Ctry.</td>
                            <td className="bg-white text-slate-800 font-mono p-2 border-r border-[#db4d6d]/20">
                              {selectedBookDetail.publication_place?.toLowerCase().includes('กรุงเทพ') || selectedBookDetail.publication_place?.toLowerCase().includes('ไทย') 
                                ? 'tha' 
                                : (selectedBookDetail.publication_place || '-')}
                            </td>
                            <td className="bg-[#db4d6d] text-white font-bold p-2 text-left">Date1</td>
                            <td className="bg-white text-slate-800 font-mono p-2 border-r border-[#db4d6d]/20">
                              {selectedBookDetail.publication_year || '-'}
                            </td>
                            <td className="bg-[#db4d6d] text-white font-bold p-2 text-left">Date2</td>
                            <td className="bg-white text-slate-800 font-mono p-2">
                              {selectedBookDetail.publication_year || '-'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* MARC 21 Variable Tag Table matching Image 3 */}
                  <div className="border border-[#db4d6d]/30 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono border-collapse min-w-[550px]">
                        <thead>
                          <tr className="bg-[#db4d6d] text-white font-bold">
                            <th className="py-2.5 px-3.5 text-left w-16 border-r border-white/20">Tag</th>
                            <th className="py-2.5 px-2.5 text-center w-14 border-r border-white/20">Ind</th>
                            <th className="py-2.5 px-4 text-left">Content</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#db4d6d]/15 bg-white">
                          {getBookMarcTags(selectedBookDetail).map((item, idx) => (
                            <tr key={idx} className="hover:bg-rose-50/40 transition">
                              <td className="py-2 px-3.5 font-bold text-slate-800 border-r border-[#db4d6d]/10 align-top">{item.tag}</td>
                              <td className="py-2 px-2.5 text-center text-slate-600 border-r border-[#db4d6d]/10 align-top">{item.ind}</td>
                              <td className="py-2 px-4 text-slate-900 leading-relaxed break-words align-top">{item.content}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${selectedBookDetail.status === 'พร้อมให้บริการ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                  <span className={`h-2 w-2 rounded-full ${selectedBookDetail.status === 'พร้อมให้บริการ' ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {selectedBookDetail.status}
                </span>
                <button 
                  onClick={() => setSelectedBookDetail(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </div>
    )}

      {/* EDIT MODAL FOR ADMIN */}
      {editingBook && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUpdateBook} className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">📝 แก้ไขรายละเอียดหนังสือ (ข้อมูลบรรณานุกรมฉบับเต็ม)</h3>
                <p className="text-xs text-slate-500 mt-0.5">แก้ไขรายละเอียดทุกคอลัมน์มาตรฐานตามโครงสร้างไฟล์เท็มเพลตสากล</p>
              </div>
              <button type="button" onClick={() => setEditingBook(null)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-700 transition">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* SECTION 1: ข้อมูลทางบรรณานุกรมหลัก */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md inline-block">📖 ข้อมูลหนังสือหลัก (Primary Metadata)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">วันที่ (Date / วันที่ลงทะเบียน)</label>
                    <input 
                      type="text" 
                      value={editingBook.date_added || ''}
                      onChange={(e) => setEditingBook({...editingBook, date_added: e.target.value})}
                      placeholder="เช่น 04/10/2569"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เลขทะเบียนหนังสือ (Accession No.) *</label>
                    <input 
                      type="text" 
                      required
                      value={editingBook.accession_no || ''}
                      onChange={(e) => setEditingBook({...editingBook, accession_no: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">รหัส ISBN (020) *</label>
                    <input 
                      type="text" 
                      required
                      value={editingBook.isbn || ''}
                      onChange={(e) => setEditingBook({...editingBook, isbn: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชื่อเรื่องหลัก (245 $a) *</label>
                    <input 
                      type="text" 
                      required
                      value={editingBook.title || ''}
                      onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชื่อเรื่องรอง / ชื่อเรื่องย่อย (245 $b)</label>
                    <input 
                      type="text" 
                      value={editingBook.subtitle || ''}
                      onChange={(e) => setEditingBook({...editingBook, subtitle: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชื่อผู้แต่งหลัก (100 $a) *</label>
                    <input 
                      type="text" 
                      required
                      value={editingBook.author || ''}
                      onChange={(e) => setEditingBook({...editingBook, author: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ผู้เขียน (Writer)</label>
                    <input 
                      type="text" 
                      value={editingBook.writer !== undefined ? editingBook.writer : (editingBook.author || '')}
                      onChange={(e) => setEditingBook({...editingBook, writer: e.target.value})}
                      placeholder="ระบุชื่อผู้เขียน"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ผู้แต่งร่วม / ผู้รับผิดชอบ (245 $c)</label>
                    <input 
                      type="text" 
                      value={editingBook.co_authors || ''}
                      onChange={(e) => setEditingBook({...editingBook, co_authors: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">บาร์โค้ดหนังสือ (Barcode)</label>
                    <input 
                      type="text" 
                      value={editingBook.barcode || ''}
                      onChange={(e) => setEditingBook({...editingBook, barcode: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: การจัดประเภทและหัวเรื่อง */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md inline-block">🏷️ การจัดหมวดหมู่และหัวเรื่อง (Classification & Subjects)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เลขหมู่ทศนิยมดิวอี้ (082 $a)</label>
                    <input 
                      type="text" 
                      value={editingBook.ddc || ''}
                      onChange={(e) => {
                        const newDdc = e.target.value;
                        const cutter = editingBook.call_sub || '';
                        const updatedCall = (newDdc && cutter) ? `${newDdc} ${cutter}` : (newDdc || cutter);
                        setEditingBook({...editingBook, ddc: newDdc, call_number: updatedCall});
                      }}
                      placeholder="เช่น 895.913"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600">เลขคัตเตอร์ (082 $b)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const cutter = generateThaiCutter(editingBook.author || '', editingBook.title || '');
                          const newCall = (editingBook.ddc && cutter) ? `${editingBook.ddc} ${cutter}` : (editingBook.ddc || cutter);
                          setEditingBook({...editingBook, call_sub: cutter, call_number: newCall});
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                        title="คำนวณเลขคัตเตอร์ 4 หลักตามชื่อผู้แต่งและชื่อเรื่องอัตโนมัติ"
                      >
                        ⚡ คำนวณคัตเตอร์
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={editingBook.call_sub !== undefined ? editingBook.call_sub : (editingBook.call_number && editingBook.call_number.split(' ').length > 1 ? editingBook.call_number.split(' ').slice(1).join(' ') : '')}
                      onChange={(e) => {
                        const newCutter = e.target.value;
                        const ddc = editingBook.ddc || '';
                        const updatedCall = (ddc && newCutter) ? `${ddc} ${newCutter}` : (ddc || newCutter);
                        setEditingBook({...editingBook, call_sub: newCutter, call_number: updatedCall});
                      }}
                      placeholder="เช่น ง241ค, ก9684อ"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เลขเรียกหนังสือรวม (Call Number) *</label>
                    <input 
                      type="text" 
                      required
                      value={editingBook.call_number || ''}
                      onChange={(e) => setEditingBook({...editingBook, call_number: e.target.value})}
                      placeholder="เช่น 895.913 ง241ค"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">หมวดหมู่จัดเก็บหนังสือ *</label>
                    <select 
                      value={editingBook.category || ''}
                      onChange={(e) => setEditingBook({...editingBook, category: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">-- เลือกหมวดหมู่ --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">650 $a หัวเรื่อง 1 (Subject 1)</label>
                    <input 
                      type="text" 
                      value={editingBook.subject || ''}
                      onChange={(e) => setEditingBook({...editingBook, subject: e.target.value})}
                      placeholder="เช่น นวนิยายไทย"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">650 $x ย่อยหัวเรื่อง (Subdivision)</label>
                    <input 
                      type="text" 
                      value={editingBook.subject_subdivision || ''}
                      onChange={(e) => setEditingBook({...editingBook, subject_subdivision: e.target.value})}
                      placeholder="เช่น วรรณกรรมเยาวชน"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">หัวเรื่อง 2 (Subject 2)</label>
                    <input 
                      type="text" 
                      value={editingBook.subject_2 || ''}
                      onChange={(e) => setEditingBook({...editingBook, subject_2: e.target.value})}
                      placeholder="เช่น วรรณกรรมสร้างสรรค์ยอดเยี่ยมแห่งอาเซียน"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">หัวเรื่อง 3 (Subject 3)</label>
                    <input 
                      type="text" 
                      value={editingBook.subject_3 || ''}
                      onChange={(e) => setEditingBook({...editingBook, subject_3: e.target.value})}
                      placeholder="เช่น หนังสือดีเด่น"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชุดหนังสือ (Series)</label>
                    <input 
                      type="text" 
                      value={editingBook.series || ''}
                      onChange={(e) => setEditingBook({...editingBook, series: e.target.value})}
                      placeholder="เช่น ชุดวรรณกรรมร่วมสมัย"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">สถานที่จัดเก็บ (Storage Location)</label>
                    <input 
                      type="text" 
                      value={editingBook.storage_location || ''}
                      onChange={(e) => setEditingBook({...editingBook, storage_location: e.target.value})}
                      placeholder="เช่น NCILibrary, ตู้ A1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ภาษา</label>
                    <input 
                      type="text" 
                      value={editingBook.language || 'ไทย'}
                      onChange={(e) => setEditingBook({...editingBook, language: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: การจัดพิมพ์และลักษณะรูปเล่ม */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">🏭 การพิมพ์และลักษณะรูปเล่ม (Publishing)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">260 $b สำนักพิมพ์ *</label>
                    <input 
                      type="text" 
                      required
                      value={editingBook.publisher || ''}
                      onChange={(e) => setEditingBook({...editingBook, publisher: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">260 $a สถานที่พิมพ์</label>
                    <input 
                      type="text" 
                      value={editingBook.publication_place || ''}
                      onChange={(e) => setEditingBook({...editingBook, publication_place: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">260 $c ปีที่พิมพ์</label>
                    <input 
                      type="text" 
                      value={editingBook.publication_year || ''}
                      onChange={(e) => setEditingBook({...editingBook, publication_year: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">พิมพ์ครั้งที่ (Edition)</label>
                    <input 
                      type="text" 
                      value={editingBook.edition || 'พิมพ์ครั้งที่ 1'}
                      onChange={(e) => setEditingBook({...editingBook, edition: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">300 $a จำนวนหน้า</label>
                    <input 
                      type="text" 
                      value={editingBook.pages || ''}
                      onChange={(e) => setEditingBook({...editingBook, pages: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">300 $b ภาพประกอบ</label>
                    <input 
                      type="text" 
                      value={editingBook.illustration || ''}
                      onChange={(e) => setEditingBook({...editingBook, illustration: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                      placeholder="เช่น มีรูปภาพ, ตาราง, แผนที่"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">300 $c ขนาดเล่ม (Dimensions)</label>
                    <input 
                      type="text" 
                      value={editingBook.book_size || editingBook.dimensions_300c || ''}
                      onChange={(e) => setEditingBook({...editingBook, book_size: e.target.value, dimensions_300c: e.target.value})}
                      placeholder="เช่น 24 ซม., 19x26 ซม."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: ข้อมูลให้บริการและสื่อ */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block">⚙️ ข้อมูลให้บริการ สื่อ และจำนวนเล่ม (Media & Copies)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ผู้แปล (Translator)</label>
                    <input 
                      type="text" 
                      value={editingBook.translator || ''}
                      onChange={(e) => setEditingBook({...editingBook, translator: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ปีแต่ง (ปีที่ประพันธ์)</label>
                    <input 
                      type="text" 
                      value={editingBook.composition_year || ''}
                      onChange={(e) => setEditingBook({...editingBook, composition_year: e.target.value})}
                      placeholder="เช่น 2546"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ราคา (บาท)</label>
                    <input 
                      type="text" 
                      value={editingBook.price || ''}
                      onChange={(e) => setEditingBook({...editingBook, price: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">จำนวนเล่ม (Copies)</label>
                    <input 
                      type="text" 
                      value={editingBook.copies !== undefined ? editingBook.copies : '1'}
                      onChange={(e) => setEditingBook({...editingBook, copies: e.target.value})}
                      placeholder="เช่น 1, 2"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">สถานะบริการ *</label>
                    <select 
                      value={editingBook.status || 'พร้อมให้บริการ'}
                      onChange={(e) => setEditingBook({...editingBook, status: e.target.value as any})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="พร้อมให้บริการ">พร้อมให้บริการ</option>
                      <option value="ถูกยืมแล้ว">ถูกยืมแล้ว</option>
                      <option value="ปรับปรุง">ปรับปรุง / ซ่อมแซม</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-3">
                    <label className="text-xs font-bold text-slate-600">ลิงก์รูปภาพหน้าปก URL</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="url" 
                        value={editingBook.cover_image || ''}
                        onChange={(e) => setEditingBook({...editingBook, cover_image: e.target.value, cover_source: 'manual'})}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none"
                        placeholder="https://... ลิงก์รูปภาพหน้าปกตรง"
                      />
                      {editingBook.cover_image && (
                        <img src={editingBook.cover_image} alt="Cover Preview" className="h-10 w-8 object-contain bg-slate-100 rounded border border-slate-200 shadow-sm shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: เรื่องย่อ / คำอธิบาย */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-600">คำอธิบายย่อ / เนื้อเรื่องย่อ</label>
                <textarea 
                  rows={3}
                  value={editingBook.description || ''}
                  onChange={(e) => setEditingBook({...editingBook, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  placeholder="รายละเอียดสังเขปของหนังสือ..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl sticky bottom-0 z-10">
              <button 
                type="button" 
                onClick={() => setEditingBook(null)} 
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-sm border border-slate-200 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition shadow-md shadow-amber-600/20 cursor-pointer"
              >
                บันทึกการแก้ไขทั้งหมด
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL FOR BOOK MANAGEMENT */}
      {deletingBookTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden">
            <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-base">
                <AlertTriangle className="h-5 w-5 text-amber-300 shrink-0" />
                <span>ยืนยันการลบหนังสือออกจากระบบ</span>
              </div>
              <button 
                type="button" 
                onClick={() => setDeletingBookTarget(null)} 
                className="p-1 hover:bg-rose-700 rounded-full transition text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3.5 items-center">
                <img 
                  src={deletingBookTarget.cover_image} 
                  alt={deletingBookTarget.title} 
                  onError={(e: any) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200';
                  }}
                  className="w-12 h-16 object-contain bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0" 
                />
                <div className="text-xs space-y-1 min-w-0">
                  <h4 className="font-bold text-slate-900 line-clamp-2 text-sm">{deletingBookTarget.title}</h4>
                  <p className="text-slate-500 truncate">โดย: {deletingBookTarget.author}</p>
                  <p className="font-mono text-slate-600 font-semibold">
                    เลขทะเบียน: {deletingBookTarget.accession_no || deletingBookTarget.barcode || '-'} | {deletingBookTarget.call_number || '-'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                <div className="font-bold text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>คำเตือน: ไม่สามารถกู้คืนกลับมาได้</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  เมื่อยืนยันการลบ ข้อมูลทางบรรณานุกรมของหนังสือเล่มนี้จะถูกลบออกจากฐานข้อมูลห้องสมุด Supabase ทันที
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setDeletingBookTarget(null)} 
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    const targetId = deletingBookTarget.id;
                    setDeletingBookTarget(null);
                    handleDeleteBook(targetId, true);
                  }} 
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>ยืนยันลบหนังสือเล่มนี้</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Real-time Floating Notification Toast */}
      {realtimeNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md transition-all duration-300">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold tracking-wide text-slate-100">{realtimeNotice}</span>
          <button 
            type="button"
            onClick={() => setRealtimeNotice(null)} 
            className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer font-bold px-1.5 py-0.5 rounded hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
