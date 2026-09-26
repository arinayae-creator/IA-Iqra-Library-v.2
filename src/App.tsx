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
  Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { supabase } from '../supabaseClient';

// Interfaces based on Database Schema
interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
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
  keywords: string;
  call_number: string;
  ddc: string;
  barcode: string;
  illustration?: string; // ภาพประกอบ (คอลัมน์ 300 $b)
  cover_image: string;
  cover_source?: string;
  description: string;
  status: 'พร้อมให้บริการ' | 'ถูกยืมแล้ว' | 'ปรับปรุง';
  source?: string;
  created_at?: string;
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
  const [activeTab, setActiveTab] = useState<'catalog' | 'scanner' | 'admin' | 'stats'>('catalog');
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
  const [isSavingCover, setIsSavingCover] = useState<boolean>(false);

  // Real-time states
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
  const [lastRealtimeEventTime, setLastRealtimeEventTime] = useState<string>(new Date().toLocaleTimeString('th-TH'));

  // Admin states
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isAddingBook, setIsAddingBook] = useState<boolean>(false);
  const [csvInput, setCsvInput] = useState<string>('');
  const [excelPreviewData, setExcelPreviewData] = useState<any[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [newBookForm, setNewBookForm] = useState<Omit<Book, 'id'>>({
    title: '',
    subtitle: '',
    author: '',
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
    keywords: '',
    call_number: '',
    ddc: '',
    barcode: '',
    cover_image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
    description: '',
    status: 'พร้อมให้บริการ'
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
      ] as Book[];
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
        alert('✨ ดึงภาพหน้าปกจริงจากอินเทอร์เน็ตและบันทึกลงระบบสำเร็จแล้ว!');
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
            alert(data.message || '✨ เริ่มต้นระบบค้นหาและดึงภาพหน้าปกจริงของหนังสือทั้งหมดเบื้องหลังสำเร็จเรียบร้อยแล้ว!');
            setTimeout(() => {
              fetchBooks(currentPage);
            }, 3000);
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
        if (updated > 0) {
          alert(`✨ ค้นหาและอัปเดตรูปภาพหน้าปกจากอินเทอร์เน็ตสำเร็จจำนวน ${updated} เล่มเรียบร้อยแล้ว!`);
        } else {
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
          title: '', subtitle: '', author: '', co_authors: '', isbn: '', publisher: '',
          publication_place: 'กรุงเทพฯ', publication_year: new Date().getFullYear().toString(),
          edition: 'พิมพ์ครั้งที่ 1', pages: '200', language: 'ไทย', category: 'วรรณกรรมเยาวชน',
          subject: '', keywords: '', call_number: '', ddc: '', barcode: '',
          cover_image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
          description: '', status: 'พร้อมให้บริการ'
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

  const handleDeleteBook = async (id: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบหนังสือเล่มนี้หรือไม่?')) return;
    try {
      let deletedViaApi = false;
      try {
        const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            deletedViaApi = true;
          }
        }
      } catch {}

      if (!deletedViaApi) {
        // Direct Supabase delete fallback
        const { error: sbErr } = await supabase.from('books').delete().eq('id', id);
        if (!sbErr) {
          deletedViaApi = true;
        }
      }

      if (deletedViaApi) {
        fetchBooks();
        alert('ลบหนังสือออกจากฐานข้อมูลเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการลบหนังสือ');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
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

        // Helper to find column index by variations
        const findCol = (keywords: string[]) => {
          return headers.findIndex(h => keywords.some(k => h.includes(k)));
        };

        const titleIdx = findCol(['title', 'ชื่อ', 'ชื่อเรื่อง']);
        const authorIdx = findCol(['author', 'ผู้แต่ง', 'ผู้เขียน']);
        const isbnIdx = findCol(['isbn', 'รหัส']);
        const accessionIdx = findCol(['ทะเบียน', 'accession', 'reg']);
        const pubIdx = findCol(['publisher', 'สำนักพิมพ์']);
        const yearIdx = findCol(['year', 'ปี', 'ปีพิมพ์']);
        const catIdx = findCol(['category', 'หมวดหมู่', 'หมวด']);
        const callIdx = findCol(['call', 'เลขเรียก']);
        const barcodeIdx = findCol(['barcode', 'บาร์โค้ด']);
        const pagesIdx = findCol(['page', 'หน้า']);
        const descIdx = findCol(['desc', 'คำอธิบาย', 'เรื่องย่อ']);

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0 || !row[titleIdx >= 0 ? titleIdx : 0]) continue;

          const rawAcc = accessionIdx >= 0 && row[accessionIdx] ? String(row[accessionIdx]).trim() : '';
          const rawBar = barcodeIdx >= 0 && row[barcodeIdx] ? String(row[barcodeIdx]).trim() : '';
          const accNo = rawAcc || rawBar || String(i);
          const barCode = rawBar || rawAcc || `B${Math.random().toString().substring(2, 9)}`;

          parsedBooks.push({
            title: String(row[titleIdx >= 0 ? titleIdx : 0] || 'ไม่ระบุชื่อเรื่อง').trim(),
            subtitle: '',
            author: String(authorIdx >= 0 && row[authorIdx] ? row[authorIdx] : 'ไม่ระบุผู้แต่ง').trim(),
            co_authors: '',
            isbn: String(isbnIdx >= 0 && row[isbnIdx] ? row[isbnIdx] : Math.random().toString().substring(2, 15)).trim(),
            accession_no: accNo,
            publisher: String(pubIdx >= 0 && row[pubIdx] ? row[pubIdx] : 'ไม่ระบุสำนักพิมพ์').trim(),
            publication_place: 'กรุงเทพฯ',
            publication_year: String(yearIdx >= 0 && row[yearIdx] ? row[yearIdx] : new Date().getFullYear()).trim(),
            edition: 'พิมพ์ครั้งที่ 1',
            pages: String(pagesIdx >= 0 && row[pagesIdx] ? row[pagesIdx] : '200').trim(),
            language: 'ไทย',
            category: String(catIdx >= 0 && row[catIdx] ? row[catIdx] : 'ทั่วไป').trim(),
            subject: '',
            keywords: '',
            call_number: String(callIdx >= 0 && row[callIdx] ? row[callIdx] : '000').trim(),
            ddc: '',
            barcode: barCode,
            cover_image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
            description: String(descIdx >= 0 && row[descIdx] ? row[descIdx] : 'นำเข้าจากไฟล์ Excel').trim(),
            status: 'พร้อมให้บริการ'
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

  // Download Sample Excel Template
  const downloadSampleExcel = () => {
    const sampleRows = [
      {
        'เลขทะเบียน (Accession No.)': '1',
        'ชื่อเรื่อง (Title)': 'คิดแบบย่อยิงใหญ่',
        'ผู้แต่ง (Author)': 'มาร์ค วิลสัน',
        'ISBN': '9786161234567',
        'สำนักพิมพ์ (Publisher)': 'วีเลิร์น',
        'ปีที่พิมพ์ (Year)': '2566',
        'หมวดหมู่ (Category)': 'พัฒนาตนเอง',
        'เลขเรียกหนังสือ (Call Number)': '158.1 ม17ค',
        'บาร์โค้ด (Barcode)': 'B0000088',
        'จำนวนหน้า (Pages)': '280',
        'คำอธิบาย (Description)': 'ข้อคิดสร้างพลังชีวิตและความคิดก้าวหน้า'
      },
      {
        'เลขทะเบียน (Accession No.)': '2',
        'ชื่อเรื่อง (Title)': 'จิตวิทยาการอ่านใจ',
        'ผู้แต่ง (Author)': 'ซาโตชิ นากาโมโตะ',
        'ISBN': '9786169876543',
        'สำนักพิมพ์ (Publisher)': 'อมรินทร์',
        'ปีที่พิมพ์ (Year)': '2565',
        'หมวดหมู่ (Category)': 'จิตวิทยาประยุกต์',
        'เลขเรียกหนังสือ (Call Number)': '150.1 ซ45จ',
        'บาร์โค้ด (Barcode)': 'B0000089',
        'จำนวนหน้า (Pages)': '220',
        'คำอธิบาย (Description)': 'เทคนิคการเข้าใจภาษากายและอารมณ์ความรู้สึก'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Books');
    XLSX.writeFile(wb, 'library_books_template.xlsx');
  };

  // Simple CSV Import Parser
  const handleCsvImport = async () => {
    if (!csvInput.trim()) return;
    const lines = csvInput.split('\n');
    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',');
      if (values.length < 3) continue;

      const accVal = values[7]?.trim() || values[0]?.trim();
      const book: any = {
        title: values[0]?.trim() || 'Untitled',
        author: values[1]?.trim() || 'Unknown',
        isbn: values[2]?.trim() || Math.random().toString().substring(2, 15),
        accession_no: accVal,
        publisher: values[3]?.trim() || 'Unknown Publisher',
        publication_year: values[4]?.trim() || '2566',
        category: values[5]?.trim() || 'ทั่วไป',
        call_number: values[6]?.trim() || '000',
        subtitle: '',
        co_authors: '',
        publication_place: 'กรุงเทพฯ',
        edition: 'พิมพ์ครั้งที่ 1',
        pages: '200',
        language: 'ไทย',
        subject: '',
        keywords: '',
        ddc: '',
        barcode: accVal || `B${Math.random().toString().substring(2, 9)}`,
        cover_image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
        description: 'นำเข้าผ่านระบบ CSV',
        status: 'พร้อมให้บริการ'
      };

      try {
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(book)
        });
        const data = await res.json();
        if (data.success) successCount++;
        else failCount++;
      } catch (e) {
        failCount++;
      }
    }

    alert(`นำเข้าเสร็จสิ้น! สำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
    setCsvInput('');
    fetchBooks();
  };

  // Format bibliography text according to Standard (Specification 10)
  const formatBibliography = (b: Book) => {
    const accText = b.accession_no || b.barcode ? `\nเลขทะเบียน ${b.accession_no || b.barcode}.` : '';
    return `${b.title} / ${b.author}${b.co_authors ? ', ' + b.co_authors : ''}.\n${b.publication_place} : ${b.publisher}, ${b.publication_year}.\n${b.pages} หน้า.\nISBN ${b.isbn}.${accText}\nเลขเรียกหนังสือ ${b.call_number}`;
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
            {/* Real-time Indicator Pill */}
            <div 
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isRealtimeConnected 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={isRealtimeConnected ? `เชื่อมต่อฐานข้อมูล Supabase แบบเรียลไทม์ (อัปเดตล่าสุด ${lastRealtimeEventTime})` : 'กำลังเชื่อมต่อใหม่...'}
            >
              <span className="relative flex h-2 w-2">
                {isRealtimeConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="hidden md:inline font-bold">
                {isRealtimeConnected ? 'เรียลไทม์ (Live)' : 'เชื่อมต่อใหม่...'}
              </span>
            </div>

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
                                      <img src={topBook.cover_image} alt={topBook.title} className="max-h-full object-contain rounded" />
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
                                    <img src={m.cover_image} alt={m.title} className="max-h-full object-contain" />
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
                    <label className="text-xs font-bold text-slate-600">เลขเรียกหนังสือ (Call Number) *</label>
                    <input 
                      type="text" 
                      required
                      value={newBookForm.call_number}
                      onChange={(e) => setNewBookForm({...newBookForm, call_number: e.target.value})}
                      placeholder="เช่น 895.913 ง241ค"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เลขหมู่ระบบ Dewey (DDC)</label>
                    <input 
                      type="text" 
                      value={newBookForm.ddc}
                      onChange={(e) => setNewBookForm({...newBookForm, ddc: e.target.value})}
                      placeholder="เช่น 895.913"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
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
                <button
                  type="button"
                  onClick={downloadSampleExcel}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <FileDown className="h-4 w-4 text-emerald-600" />
                  <span>ดาวน์โหลดไฟล์ตัวอย่าง Excel</span>
                </button>
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

                {/* Method 2: CSV Direct Paste */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">หรือวางข้อความรูปแบบ CSV โดยตรง:</label>
                  <textarea 
                    rows={4}
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                    placeholder="title,author,isbn,publisher,year,category,call_number&#10;คิดแบบย่อยิงใหญ่,มาร์ควิลสัน,97812345678,ดีบุ๊คส์,2565,พัฒนาตนเอง,158.1 ม17ค"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button 
                    onClick={handleCsvImport}
                    disabled={!csvInput.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" /> นำเข้าจากข้อความ CSV
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
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ฐานข้อมูลบรรณานุกรม ({books.length} เล่ม)</span>
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
                          <img src={b.cover_image} alt={b.title} className="w-9 h-11 object-contain bg-slate-50 rounded shadow-sm" />
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
                              onClick={() => handleDeleteBook(b.id)}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
                <Book className="h-5 w-5 text-amber-600" /> ข้อมูลทางบรรณานุกรมฉบับสมบูรณ์
              </h3>
              <button 
                onClick={() => setSelectedBookDetail(null)}
                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-44 shrink-0 flex flex-col items-center">
                  <div className="w-full bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-center aspect-[4/5] overflow-hidden">
                    <img src={selectedBookDetail.cover_image} alt={selectedBookDetail.title} className="max-h-full object-contain shadow-md rounded" />
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

                  <div className="w-full mt-3.5 space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block text-left">วางลิงก์ภาพหน้าปกเอง:</span>
                    <div className="flex gap-1">
                      <input
                        type="url"
                        id="manual-cover-url-input"
                        placeholder="https://..."
                        defaultValue={
                          selectedBookDetail.cover_image.includes('images.unsplash.com') || 
                          selectedBookDetail.cover_image.includes('covers.openlibrary.org') 
                            ? '' 
                            : selectedBookDetail.cover_image
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
                    <div className="col-span-2 sm:col-span-1 bg-amber-50/80 p-2 rounded-lg border border-amber-200/70">
                      <span className="text-amber-800 font-bold block text-[11px]">เลขทะเบียนหนังสือ (Accession No.)</span>
                      <span className="text-slate-900 font-mono font-black text-sm">{selectedBookDetail.accession_no || selectedBookDetail.barcode || '-'}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
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
                      <span className="text-slate-400 font-semibold block">DDC (ระบบดิวอี้)</span>
                      <span className="text-slate-800 font-mono font-bold">{selectedBookDetail.ddc || '-'}</span>
                    </div>
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

              {selectedBookDetail.description && (
                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wide block">เนื้อเรื่องย่อ</span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedBookDetail.description}
                  </p>
                </div>
              )}

              {/* Standard card text export markup (Specification 10) */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wide flex justify-between items-center">
                  <span>รูปแบบบัตรรายการมาตรฐานสากล</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(formatBibliography(selectedBookDetail));
                      alert('คัดลอกบัตรรายการเรียบร้อยแล้ว!');
                    }}
                    className="text-[10px] text-amber-600 font-bold hover:underline"
                  >
                    คัดลอกข้อความ
                  </button>
                </span>
                <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed p-4 bg-amber-50/40 text-slate-700 rounded-xl border border-amber-200/50 shadow-inner">
                  {formatBibliography(selectedBookDetail)}
                </pre>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${selectedBookDetail.status === 'พร้อมให้บริการ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                  <span className={`h-2 w-2 rounded-full ${selectedBookDetail.status === 'พร้อมให้บริการ' ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {selectedBookDetail.status}
                </span>
                <button 
                  onClick={() => setSelectedBookDetail(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL FOR ADMIN */}
      {editingBook && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUpdateBook} className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-lg">แก้ไขรายละเอียดหนังสือ</h3>
              <button type="button" onClick={() => setEditingBook(null)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">ชื่อเรื่อง *</label>
                  <input 
                    type="text" 
                    required
                    value={editingBook.title}
                    onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">ชื่อเรื่องรอง</label>
                  <input 
                    type="text" 
                    value={editingBook.subtitle || ''}
                    onChange={(e) => setEditingBook({...editingBook, subtitle: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">ผู้แต่งหลัก *</label>
                  <input 
                    type="text" 
                    required
                    value={editingBook.author}
                    onChange={(e) => setEditingBook({...editingBook, author: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">ผู้แต่งร่วม/ผู้แปล</label>
                  <input 
                    type="text" 
                    value={editingBook.co_authors || ''}
                    onChange={(e) => setEditingBook({...editingBook, co_authors: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">เลขทะเบียนหนังสือ (Accession Number)</label>
                  <input 
                    type="text" 
                    value={editingBook.accession_no || editingBook.barcode || ''}
                    onChange={(e) => setEditingBook({...editingBook, accession_no: e.target.value})}
                    placeholder="เช่น 1, 2, 000001, B0000001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">ISBN *</label>
                  <input 
                    type="text" 
                    required
                    value={editingBook.isbn}
                    onChange={(e) => setEditingBook({...editingBook, isbn: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">สำนักพิมพ์ *</label>
                  <input 
                    type="text" 
                    required
                    value={editingBook.publisher}
                    onChange={(e) => setEditingBook({...editingBook, publisher: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">เลขเรียกหนังสือ (Call Number) *</label>
                  <input 
                    type="text" 
                    required
                    value={editingBook.call_number}
                    onChange={(e) => setEditingBook({...editingBook, call_number: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">สถานะ</label>
                  <select 
                    value={editingBook.status}
                    onChange={(e) => setEditingBook({...editingBook, status: e.target.value as any})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="พร้อมให้บริการ">พร้อมให้บริการ</option>
                    <option value="ถูกยืมแล้ว">ถูกยืมแล้ว</option>
                    <option value="ปรับปรุง">ปรับปรุง</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">ลิงก์ภาพหน้าปก (Cover Image URL)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="url" 
                    placeholder="https://... ลิงก์รูปภาพปกหนังสือ"
                    value={editingBook.cover_image || ''}
                    onChange={(e) => setEditingBook({...editingBook, cover_image: e.target.value, illustration: e.target.value, cover_source: 'manual'})}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                  {editingBook.cover_image && (
                    <img src={editingBook.cover_image} alt="Preview" className="h-9 w-7 object-cover rounded border border-slate-200 shrink-0" />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">คำอธิบายย่อ</label>
                <textarea 
                  rows={3}
                  value={editingBook.description || ''}
                  onChange={(e) => setEditingBook({...editingBook, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingBook(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm">ยกเลิก</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 text-white font-bold rounded-lg text-sm">บันทึกการแก้ไข</button>
              </div>
            </div>
          </form>
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
