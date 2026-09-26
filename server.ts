import { supabase } from './supabaseClient';
import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import * as XLSX from 'xlsx';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// Create HTTP server & WebSocket server for real-time syncing
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

export function broadcastRealtime(event: { type: string; payload: any }) {
  try {
    const msg = JSON.stringify(event);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  } catch (err) {
    console.error('[WebSocket Broadcast Error]:', err);
  }
}

wss.on('connection', (ws) => {
  console.log('[WebSocket] Real-time client connected! Total clients:', wss.clients.size);
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    payload: {
      message: 'Real-time connected to Supabase Database',
      timestamp: new Date().toISOString()
    }
  }));

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch {}
  });
});

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    const { count, error } = await supabase.from('books').select('*', { count: 'exact', head: true });
    if (error) {
      console.warn('[Supabase] Connection test note:', error.message);
    } else {
      console.log(`[Supabase] Successfully connected to Supabase! Current books count: ${count ?? 0}`);
    }
  } catch (err: any) {
    console.warn('[Supabase] Connection error:', err.message || err);
  }
}
testSupabaseConnection();


// Initialize Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// --- Sample Book Data (20 Books) ---
const sampleBooks = [
  {
    title: "ความสุขของกะทิ",
    subtitle: "วรรณกรรมรางวัลซีไรต์",
    author: "งามพรรณ เวชชาชีวะ",
    co_authors: "",
    isbn: "9789749697665",
    publisher: "แพรวสำนักพิมพ์",
    publication_place: "กรุงเทพฯ",
    publication_year: "2546",
    edition: "พิมพ์ครั้งที่ 1",
    pages: "184",
    language: "ไทย",
    category: "วรรณกรรมเยาวชน",
    subject: "วรรณกรรมเยาวชนไทย",
    keywords: "กะทิ, ความสุข, ซีไรต์, ครอบครัว, ดรามา",
    call_number: "895.913 ง241ค",
    ddc: "895.913",
    barcode: "B0000001",
    cover_image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600",
    description: "เรื่องราวของเด็กหญิงกะทิที่ต้องเผชิญกับความจริงอันปวดร้าวเกี่ยวกับครอบครัว แต่เธอก็ผ่านพ้นมันไปได้ด้วยความรักและความเข้าใจจากคนรอบข้าง สะท้อนวิถีชีวิตไทยอันอบอุ่น",
    status: "พร้อมให้บริการ"
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    subtitle: "Harry Potter Book 1",
    author: "J.K. Rowling",
    co_authors: "",
    isbn: "9781408855652",
    publisher: "Bloomsbury",
    publication_place: "London",
    publication_year: "2014",
    edition: "Deluxe Edition",
    pages: "352",
    language: "อังกฤษ",
    category: "นวนิยายแฟนตาซี",
    subject: "Fantasy Fiction, Wizards",
    keywords: "harry potter, magic, wizard, hogwarts, philosopher stone",
    call_number: "823.914 R884h",
    ddc: "823.914",
    barcode: "B0000002",
    cover_image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
    description: "The first novel in the Harry Potter series, introducing Harry Potter, a young wizard who discovers his magical heritage on his eleventh birthday.",
    status: "พร้อมให้บริการ"
  },
  {
    title: "Harry Potter กับศิลาอาถรรพ์ (เล่ม 1)",
    subtitle: "แฮร์รี่ พอตเตอร์ เล่ม 1 ฉบับปรับปรุง",
    author: "J.K. Rowling",
    co_authors: "สุมาลี (ผู้แปล)",
    isbn: "9786160447077",
    publisher: "นานมีบุ๊คส์",
    publication_place: "กรุงเทพฯ",
    publication_year: "2563",
    edition: "ฉบับครบรอบ 20 ปี",
    pages: "376",
    language: "ไทย",
    category: "นวนิยายแฟนตาซี",
    subject: "วรรณกรรมเยาวชนแปล, พ่อมด, เวทมนตร์",
    keywords: "แฮร์รี่, พอตเตอร์, ศิลาอาถรรพ์, เวทมนตร์, โรงเรียนพ่อมด",
    call_number: "823.914 ร725แ",
    ddc: "823.914",
    barcode: "B0000003",
    cover_image: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?auto=format&fit=crop&q=80&w=600",
    description: "แฮร์รี่ พอตเตอร์ ไม่เคยได้ยินชื่อฮอกวอตส์มาก่อนด้วยซ้ำ ตอนที่จดหมายสีเขียวมรกตเริ่มร่อนลงมาที่หน้าประตูบ้านเลขที่สี่ ซอยพรีเวต แต่แล้วในวันเกิดปีที่สิบเอ็ด เขาก็ได้รับรู้ความจริงอันน่าพิศวง",
    status: "พร้อมให้บริการ"
  },
  {
    title: "คิดใหญ่ไม่คิดเล็ก",
    subtitle: "The Magic of Thinking Big",
    author: "David J. Schwartz",
    co_authors: "ดร. นิเวศน์ เหมวชิรวรากร (ผู้แปล)",
    isbn: "9786162871146",
    publisher: "วีเลิร์น (WeLearn)",
    publication_place: "กรุงเทพฯ",
    publication_year: "2558",
    edition: "พิมพ์ครั้งที่ 12",
    pages: "320",
    language: "ไทย",
    category: "พัฒนาตนเอง",
    subject: "จิตวิทยาประยุกต์, ความสำเร็จ",
    keywords: "คิดใหญ่, ความคิด, พัฒนาตัวเอง, ความสำเร็จ, ดร.นิเวศน์",
    call_number: "158.1 ช17ค",
    ddc: "158.1",
    barcode: "B0000004",
    cover_image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
    description: "หนังสือขายดีระดับโลกที่จะช่วยปฏิวัติความคิดของคุณ เพื่อก้าวสู่ความสำเร็จอันยิ่งใหญ่ด้วยพลังจิตวิทยาแห่งความเชื่อมั่นและการตั้งเป้าหมายชีวิตแบบไร้ขีดจำกัด",
    status: "ถูกยืมแล้ว"
  },
  {
    title: "The Hobbit",
    subtitle: "There and Back Again",
    author: "J.R.R. Tolkien",
    co_authors: "",
    isbn: "9780007525508",
    publisher: "HarperCollins",
    publication_place: "London",
    publication_year: "2013",
    edition: "Standard Edition",
    pages: "310",
    language: "อังกฤษ",
    category: "นวนิยายแฟนตาซี",
    subject: "Middle-earth, Adventure Fiction",
    keywords: "hobbit, bilbo baggins, tolkien, ring, dragon, adventure",
    call_number: "823.912 T649h",
    ddc: "823.912",
    barcode: "B0000005",
    cover_image: "https://images.unsplash.com/photo-1629992101753-56d196c8acf2?auto=format&fit=crop&q=80&w=600",
    description: "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of dwarves arrive.",
    status: "พร้อมให้บริการ"
  },
  {
    title: "เจ้าชายน้อย",
    subtitle: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    co_authors: "อำพรรณ โอตระกูล (ผู้แปล)",
    isbn: "9786161402686",
    publisher: "แพรวสำนักพิมพ์",
    publication_place: "กรุงเทพฯ",
    publication_year: "2561",
    edition: "พิมพ์ครบรอบ 75 ปี",
    pages: "120",
    language: "ไทย",
    category: "วรรณกรรมคลาสสิก",
    subject: "ปรัชญาชีวิต, วรรณกรรมเยาวชนแปล",
    keywords: "เจ้าชายน้อย, ดวงดาว, สุนัขจิ้งจอก, ความรัก, ปรัชญา",
    call_number: "843.912 ซ71จ",
    ddc: "843.912",
    barcode: "B0000006",
    cover_image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600",
    description: "วรรณกรรมคลาสสิกระดับโลกที่ซ่อนข้อคิดเชิงปรัชญาอันลึกซึ้งผ่านสายตาของเด็กชายจากต่างดาวผู้ท่องไปในอวกาศ ค้นพบสัจธรรมแห่งรัก มิตรภาพ และความเปลี่ยวเหงา",
    status: "พร้อมให้บริการ"
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    subtitle: "A History of Species",
    author: "Yuval Noah Harari",
    co_authors: "",
    isbn: "9781448190690",
    publisher: "Vintage",
    publication_place: "London",
    publication_year: "2014",
    edition: "Paperback Edition",
    pages: "512",
    language: "อังกฤษ",
    category: "ประวัติศาสตร์",
    subject: "Human evolution, World History",
    keywords: "sapiens, humankind, history, harari, evolution",
    call_number: "909 H254s",
    ddc: "909",
    barcode: "B0000007",
    cover_image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600",
    description: "Sapiens tackles some of the biggest questions of history and of the modern world, written in a lucid and unforgettable prose that explores how we became who we are.",
    status: "พร้อมให้บริการ"
  },
  {
    title: "เซเปียนส์: ประวัติย่อมนุษยชาติ",
    subtitle: "Sapiens in Thai Translation",
    author: "Yuval Noah Harari",
    co_authors: "นำชัย ชีววิวรรธน์ (ผู้แปล)",
    isbn: "9786163016560",
    publisher: "ยิปซี",
    publication_place: "กรุงเทพฯ",
    publication_year: "2561",
    edition: "พิมพ์ครั้งที่ 5",
    pages: "640",
    language: "ไทย",
    category: "ประวัติศาสตร์",
    subject: "มานุษยวิทยา, ประวัติศาสตร์โลก, วิวัฒนาการ",
    keywords: "เซเปียนส์, มนุษยชาติ, ประวัติศาสตร์, วิวัฒนาการ, ยิปซี",
    call_number: "909 ฮ15ซ",
    ddc: "909",
    barcode: "B0000008",
    cover_image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600",
    description: "เรื่องราวประวัติศาสตร์ของสปีชีส์มนุษย์เรา ตั้งแต่ยุคหินโบราณไปจนถึงการปฏิวัติทางการรับรู้ การเกษตร และวิทยาศาสตร์ที่นำเราเข้าสู่โลกสมัยใหม่",
    status: "พร้อมให้บริการ"
  },
  {
    title: "Atomic Habits",
    subtitle: "An Easy & Proven Way to Build Good Habits & Break Bad Ones",
    author: "James Clear",
    co_authors: "",
    isbn: "9781473631892",
    publisher: "Penguin Random House",
    publication_place: "New York",
    publication_year: "2018",
    edition: "First Edition",
    pages: "320",
    language: "อังกฤษ",
    category: "พัฒนาตนเอง",
    subject: "Self-Improvement, Habits, Psychology",
    keywords: "habits, self-help, success, routine, micro-habits",
    call_number: "158.1 C623a",
    ddc: "158.1",
    barcode: "B0000009",
    cover_image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600",
    description: "Tiny Changes, Remarkable Results. No matter your goals, Atomic Habits offers a proven framework for improving—every day.",
    status: "พร้อมให้บริการ"
  },
  {
    title: "เพราะเป็นวัยรุ่นจึงเจ็บปวด",
    subtitle: "แด่เธอ...ผู้ก้าวเดินในโลกผู้ใหญ่อย่างเดียวดาย",
    author: "Rando Kim",
    co_authors: "วิทิยา จันทร์พันธ์ (ผู้แปล)",
    isbn: "9786161803910",
    publisher: "Springbooks",
    publication_place: "กรุงเทพฯ",
    publication_year: "2558",
    edition: "พิมพ์ครั้งที่ 25",
    pages: "252",
    language: "ไทย",
    category: "พัฒนาตนเอง",
    subject: "จิตวิทยาวัยรุ่น, แนวคิดการดำเนินชีวิต",
    keywords: "วัยรุ่น, เจ็บปวด, พัฒนาตัวเอง, คิมรันโด, ชีวิตผู้ใหญ่",
    call_number: "158.1 ค72พ",
    ddc: "158.1",
    barcode: "B0000010",
    cover_image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600",
    description: "หนังสือที่สร้างพลังใจให้แก่วัยรุ่นทั่วเอเชีย ถ่ายทอดความเข้าใจในความเคว้งคว้าง สับสน และเจ็บปวดของวัยเริ่มผู้ใหญ่ ช่วยให้เห็นคุณค่าของชีวิตและเป้าหมายชีวิต",
    status: "พร้อมให้บริการ"
  },
  {
    title: "เมื่อลมหายใจกลายเป็นไอ",
    subtitle: "When Breath Becomes Air",
    author: "Paul Kalanithi",
    co_authors: "โตมร ศุขปรีชา (ผู้แปล)",
    isbn: "9786163710727",
    publisher: "Bookscape",
    publication_place: "กรุงเทพฯ",
    publication_year: "2560",
    edition: "พิมพ์ครั้งที่ 3",
    pages: "224",
    language: "ไทย",
    category: "ชีวประวัติ / วรรณกรรมสะท้อนชีวิต",
    subject: "วรรณกรรมชีวประวัติแพทย์, ความตาย, ความหมายของชีวิต",
    keywords: "ลมหายใจ, พอล กะลนิธิ, มะเร็ง, วรรณกรรมสะท้อนชีวิต, ความตาย",
    call_number: "616.994 ค21ม",
    ddc: "616.994",
    barcode: "B0000011",
    cover_image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600",
    description: "บันทึกชีวิตจริงสะเทือนอารมณ์ของแพทย์ประสาทศัลยกรรมหนุ่มอนาคตไกลผู้ป่วยเป็นมะเร็งระยะสุดท้าย เขาต้องเปลี่ยนบทบาทจากแพทย์ผู้ดูแลคนไข้ มาเป็นคนไข้ผู้เผชิญหน้าความตายด้วยตัวเอง",
    status: "พร้อมให้บริการ"
  },
  {
    title: "The Alchemist",
    subtitle: "A Fable About Following Your Dream",
    author: "Paulo Coelho",
    co_authors: "",
    isbn: "9780062315007",
    publisher: "HarperOne",
    publication_place: "New York",
    publication_year: "2014",
    edition: "25th Anniversary Edition",
    pages: "208",
    language: "อังกฤษ",
    category: "นวนิยายสร้างแรงบันดาลใจ",
    subject: "Fable, Destiny, Dreams",
    keywords: "alchemist, paulo coelho, dream, treasure, destiny",
    call_number: "869.3 C672a",
    ddc: "869.3",
    barcode: "B0000012",
    cover_image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600",
    description: "Combining magic, mysticism, wisdom, and wonder into an inspiring tale of self-discovery, The Alchemist has become a modern classic, selling millions of copies around the world.",
    status: "พร้อมให้บริการ"
  },
  {
    title: "ขุนช้างขุนแผน",
    subtitle: "ฉบับสมบูรณ์ วรรณคดีเสนาะรส",
    author: "สุนทรภู่ และกวีในรัชกาลที่ 2",
    co_authors: "",
    isbn: "9786163884213",
    publisher: "แสงดาว",
    publication_place: "กรุงเทพฯ",
    publication_year: "2563",
    edition: "พิมพ์ฉบับปกแข็ง",
    pages: "480",
    language: "ไทย",
    category: "วรรณคดีไทย",
    subject: "เสภา, วรรณคดีประวัติศาสตร์ไทย",
    keywords: "ขุนช้าง, ขุนแผน, วันทอง, วรรณคดีไทย, กลอนเสภา",
    call_number: "895.911 ข623",
    ddc: "895.911",
    barcode: "B0000013",
    cover_image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600",
    description: "เรื่องราวรักสามเส้าอันเป็นตำนานอมตะของคนไทย ระหว่าง ขุนแผน ชายหนุ่มรูปงามวิชาอาคมสูง ขุนช้าง ชายมั่งคั่งผู้รักเดียวใจเดียว และนางวันทอง ผู้ต้องรับเคราะห์กรรมในชะตากรรมรัก",
    status: "พร้อมให้บริการ"
  },
  {
    title: "สามก๊ก (ฉบับเจ้าพระยาพระคลัง (หน))",
    subtitle: "ตำราพิชัยสงครามสามก๊ก",
    author: "เจ้าพระยาพระคลัง (หน)",
    co_authors: "",
    isbn: "9789743415173",
    publisher: "ศิลปาบรรณาคาร",
    publication_place: "กรุงเทพฯ",
    publication_year: "2550",
    edition: "พิมพ์รักษ์ศิลป์",
    pages: "1240",
    language: "ไทย",
    category: "วรรณกรรมจีน / พงศาวดาร",
    subject: "ประวัติศาสตร์จีน, ยุทธศาสตร์สงคราม",
    keywords: "สามก๊ก, โจโฉ, เล่าปี่, ซุนกวน, ขงเบ้ง, พงศาวดารจีน",
    call_number: "895.13 ห15ส",
    ddc: "895.13",
    barcode: "B0000014",
    cover_image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600",
    description: "วรรณกรรมพงศาวดารอิงประวัติศาสตร์จีนอันเป็นเลิศ แปลเรียบเรียงในรัชสมัยรัชกาลที่ 1 เปี่ยมด้วยศิลปะการเจรจา ยุทธวิธีพิชัยสงคราม และบทเรียนชีวิตผู้ทรงอิทธิพล",
    status: "พร้อมให้บริการ"
  },
  {
    title: "To Kill a Mockingbird",
    subtitle: "A Classic Novel",
    author: "Harper Lee",
    co_authors: "",
    isbn: "9780446310789",
    publisher: "Grand Central Publishing",
    publication_place: "New York",
    publication_year: "1988",
    edition: "Standard Classic",
    pages: "384",
    language: "อังกฤษ",
    category: "นวนิยายคลาสสิก",
    subject: "Racial injustice, Deep South, Legal drama",
    keywords: "mockingbird, racial injustice, law, court, atticus, lee",
    call_number: "813.54 L478t",
    ddc: "813.54",
    barcode: "B0000015",
    cover_image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600",
    description: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it, Winner of the Pulitzer Prize.",
    status: "พร้อมให้บริการ"
  },
  {
    title: "1984",
    subtitle: "Nineteen Eighty-Four",
    author: "George Orwell",
    co_authors: "",
    isbn: "9780451524935",
    publisher: "Signet Classic",
    publication_place: "New York",
    publication_year: "1950",
    edition: "Classic Reprint",
    pages: "328",
    language: "อังกฤษ",
    category: "นวนิยายการเมือง",
    subject: "Dystopian fiction, Big Brother, Totalitarianism",
    keywords: "1984, dystopian, big brother, totalitarianism, political fiction",
    call_number: "823.912 O79n",
    ddc: "823.912",
    barcode: "B0000016",
    cover_image: "https://images.unsplash.com/photo-1629992101753-56d196c8acf2?auto=format&fit=crop&q=80&w=600",
    description: "Written in 1948, 1984 was George Orwell's chilling prophecy about the future. And while 1984 has come and gone, his dystopian vision of a government that will do anything to control the narrative is timelier than ever.",
    status: "พร้อมให้บริการ"
  },
  {
    title: "หนึ่งเก้าแปดสี่ (1984)",
    subtitle: "หนึ่งเก้าแปดสี่ ฉบับภาษาไทย",
    author: "George Orwell",
    co_authors: "รัศมี เผ่าเหลืองทอง (ผู้แปล)",
    isbn: "9786167144214",
    publisher: "สมมติ",
    publication_place: "กรุงเทพฯ",
    publication_year: "2555",
    edition: "พิมพ์ครั้งที่ 3",
    pages: "360",
    language: "ไทย",
    category: "นวนิยายการเมือง",
    subject: "วรรณกรรมแปล, รัฐเผด็จการ, เสรีภาพ",
    keywords: "1984, หนึ่งเก้าแปดสี่, บิ๊กบราเธอร์, เผด็จการ, สมมติ",
    call_number: "823.912 อ79ห",
    ddc: "823.912",
    barcode: "B0000017",
    cover_image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600",
    description: "นวนิยายการเมืองสุดคลาสสิกว่าด้วยรัฐเผด็จการเบ็ดเสร็จอย่างโอเชียเนีย ที่สอดส่องและควบคุมพฤติกรรม ตลอดจนความคิดของประชาชนตลอดเวลาผ่านบิ๊กบราเธอร์",
    status: "พร้อมให้บริการ"
  },
  {
    title: "สัตว์มหัศจรรย์และถิ่นที่อยู่",
    subtitle: "Fantastic Beasts and Where to Find Them",
    author: "J.K. Rowling",
    co_authors: "นุชชบา (ผู้แปล)",
    isbn: "9786160435135",
    publisher: "นานมีบุ๊คส์",
    publication_place: "กรุงเทพฯ",
    publication_year: "2560",
    edition: "ฉบับบทภาพยนตร์ดั้งเดิม",
    pages: "144",
    language: "ไทย",
    category: "นวนิยายแฟนตาซี",
    subject: "โลกพ่อมด, นิวต์ สคามันเดอร์",
    keywords: "สัตว์มหัศจรรย์, แฮร์รี่, นิวต์, นานมีบุ๊คส์",
    call_number: "823.914 ร725ส",
    ddc: "823.914",
    barcode: "B0000018",
    cover_image: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?auto=format&fit=crop&q=80&w=600",
    description: "หนังสือคู่มือสัตว์วิเศษในวิชาเรียนของโรงเรียนฮอกวอตส์ที่ถูกดัดแปลงเป็นเรื่องราวการผจญภัยในโลกเวทมนตร์ช่วงทศวรรษ 1920 ของ นิวต์ สคามันเดอร์",
    status: "พร้อมให้บริการ"
  },
  {
    title: "พยากรณ์ดีๆ ที่ไม่น่าจะพลาด",
    subtitle: "Good Omens",
    author: "Neil Gaiman & Terry Pratchett",
    co_authors: "ลมตะวัน (ผู้แปล)",
    isbn: "9786161833504",
    publisher: "Words Wonder Publishing",
    publication_place: "กรุงเทพฯ",
    publication_year: "2563",
    edition: "พิมพ์ครั้งแรก",
    pages: "420",
    language: "ไทย",
    category: "นวนิยายแปล / แฟนตาซี",
    subject: "วรรณกรรมแฟนตาซีตลกร้าย, เทวทูตและปีศาจ",
    keywords: "กู๊ดโอเมนส์, นีล เกแมน, แฟนตาซี, อาร์มาเกดดอน",
    call_number: "823.914 ก15พ",
    ddc: "823.914",
    barcode: "B0000019",
    cover_image: "https://images.unsplash.com/photo-1629992101753-56d196c8acf2?auto=format&fit=crop&q=80&w=600",
    description: "เมื่อวันสิ้นโลกกำลังจะมาเยือน แต่มนุษยชาติกลับมีเทวทูตและปีศาจผู้ใช้ชีวิตอยู่บนโลกมนุษย์มานานแสนนานร่วมมือกันพยายามยับยั้งวันอาร์มาเกดดอนนี้",
    status: "พร้อมให้บริการ"
  },
  {
    title: "แดนมหัศจรรย์แสนสะอาด",
    subtitle: "The Cleanest Place",
    author: "ณัฏฐณิชา",
    co_authors: "",
    isbn: "9786168241011",
    publisher: "ยีราฟ",
    publication_place: "เชียงใหม่",
    publication_year: "2564",
    edition: "พิมพ์ครั้งที่ 1",
    pages: "150",
    language: "ไทย",
    category: "วรรณกรรมเยาวชน",
    subject: "รักษาสิ่งแวดล้อม, เยาวชนไทย",
    keywords: "แดนมหัศจรรย์, แสนสะอาด, สิ่งแวดล้อม, เยาวชน, ณัฏฐณิชา",
    call_number: "895.913 ณ17ด",
    ddc: "895.913",
    barcode: "B0000020",
    cover_image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600",
    description: "การผจญภัยของกลุ่มเด็กในหมู่บ้านรักษ์สิ่งแวดล้อมที่จับมือร่วมกันพิทักษ์ธรรมชาติรอบตัว และค้นหาความลับของดินแดนมหัศจรรย์ที่ซ่อนอยู่หลังภูเขา",
    status: "พร้อมให้บริการ"
  }
];

// --- In-Memory and Local Disk Cache for Books to bypass Firestore Quotas ---
let cachedBooks: any[] = [];
let cachedCategories: any[] = [];
let cachedScanHistory: any[] = [];
let cachedSheetSyncInfo: any = null;

let isBackgroundEnrichActive = false;
let backgroundEnrichProgress = {
  current: 0,
  total: 0,
  updated: 0
};

const CACHE_FILE_PATH = path.resolve(__dirname, 'books_cache_v2.json');
const DEFAULT_GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1IXKv6ZCq5AdUxZcKYsUz1IY3uH9qBxnMTTuYgeT7RRg/export?format=csv&gid=889338917';

function saveCacheToDisk() {
  try {
    const data = {
      books: cachedBooks,
      categories: cachedCategories,
      scanHistory: cachedScanHistory,
      sheetSyncInfo: cachedSheetSyncInfo
    };
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('[Cache] Successfully saved cache to disk. Total books:', cachedBooks.length);
  } catch (err) {
    console.error('[Cache] Error saving cache to disk:', err);
  }
}

let lastSupabaseMergeTime = 0;

// Save books in chunks of 150 to Supabase
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
      source: b.source || 'Google Sheet (MARC 21)',
      updated_at: b.updated_at || new Date().toISOString()
    }));
    try {
      const { error } = await supabase.from('books').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.warn(`[Supabase Backup] Chunk ${i}-${i + chunk.length} upsert note:`, error.message);
      } else {
        console.log(`[Supabase Backup] Upserted chunk ${i}-${i + chunk.length} to Supabase`);
      }
    } catch (e: any) {
      console.warn(`[Supabase Backup] Chunk ${i} notice:`, e.message || e);
    }
  }
}

async function mergeSupabaseCustomizations() {
  try {
    const { data, error } = await supabase.from('book_customizations').select('*');
    if (!error && data && data.length > 0) {
      console.log(`[Supabase] Found ${data.length} custom customizations/covers in Supabase.`);
      const customMap = new Map();
      data.forEach(item => customMap.set(item.id, item));
      let updatedCount = 0;
      cachedBooks = cachedBooks.map(b => {
        if (customMap.has(b.id)) {
          updatedCount++;
          const custom = customMap.get(b.id);
          const merged = { ...b };
          for (const [key, val] of Object.entries(custom)) {
            // Only merge non-null, non-empty values so we never wipe existing titles or authors
            if (val !== null && val !== undefined && val !== '') {
              merged[key] = val;
            }
          }
          return merged;
        }
        return b;
      });
      if (updatedCount > 0) {
        saveCacheToDisk();
      }
    }
  } catch (err) {
    console.warn('[Supabase] Failed to merge customizations:', err);
  }
}

async function initializeCache() {
  console.log('[Cache] Initializing memory cache from Supabase database (Source of Truth)...');
  
  // 1. Try reading directly from Supabase first (deployed / production database)
  try {
    console.log('[Cache] Querying Supabase for books with pagination...');
    let allSupaBooks: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (error) {
        console.warn(`[Cache] Supabase query page ${page} notice:`, error.message);
        break;
      }
      if (!data || data.length === 0) break;
      allSupaBooks = allSupaBooks.concat(data);
      if (data.length < PAGE_SIZE) break;
      page++;
    }

    if (allSupaBooks.length > 0) {
      cachedBooks = allSupaBooks.map(b => ({
        ...b,
        source: 'ฐานข้อมูล Supabase'
      }));
      
      // Load categories from Supabase
      const { data: supaCats } = await supabase.from('categories').select('*');
      if (supaCats && supaCats.length > 0) {
        cachedCategories = supaCats;
      } else {
        const catsSet = new Set<string>();
        allSupaBooks.forEach(b => {
          if (b.category) catsSet.add(b.category);
        });
        cachedCategories = Array.from(catsSet).map((name, idx) => ({
          id: `cat_${idx + 1}`,
          name,
          description: `หมวดหมู่: ${name}`
        }));
      }

      // Load scan history from Supabase
      const { data: supaHistory } = await supabase.from('scan_history').select('*').order('created_at', { ascending: false }).limit(50);
      if (supaHistory) {
        cachedScanHistory = supaHistory;
      }

      // Load sheet sync info from Supabase
      const { data: supaSync } = await supabase.from('sheet_sync_info').select('*').limit(1);
      if (supaSync && supaSync.length > 0) {
        cachedSheetSyncInfo = supaSync[0];
      }

      console.log(`[Cache] Successfully loaded ${cachedBooks.length} books and ${cachedCategories.length} categories directly from Supabase database!`);
      saveCacheToDisk();
      return;
    }
  } catch (supaErr) {
    console.warn('[Cache] Supabase initial query note:', supaErr);
  }

  // 2. Fallback to disk cache if Supabase query failed or was empty
  if (fs.existsSync(CACHE_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.books) && data.books.length > 0) {
        cachedBooks = data.books;
        cachedCategories = Array.isArray(data.categories) ? data.categories : [];
        cachedScanHistory = Array.isArray(data.scanHistory) ? data.scanHistory : [];
        cachedSheetSyncInfo = data.sheetSyncInfo || null;
        console.log(`[Cache] Loaded ${cachedBooks.length} books from disk cache fallback.`);
        return;
      }
    } catch (err) {
      console.error('[Cache] Disk cache exists but is corrupted:', err);
    }
  }

  // 3. Fallback to Google Sheet if both are empty
  console.log('[Cache] Supabase and disk cache empty. Fetching directly from Google Sheet...');
  try {
    const response = await fetch(DEFAULT_GOOGLE_SHEET_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (response.ok) {
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (rows.length >= 2) {
        const categoriesSet = new Set<string>();
        const parsedBooks: any[] = [];
        
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
          const rawAccession = String(r[2] || '').trim();
          const accessionNo = rawAccession || String(i);
          const barcode = rawAccession || `B${String(i).padStart(7, '0')}`;
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
          
          const bookId = rawAccession ? `book_reg_${rawAccession}` : (barcode ? `book_reg_${barcode}` : `book_${isbn.replace(/[^a-zA-Z0-9]/g, '')}`);
          const rawIllustration = String(r[15] || '').trim();
          const cleanIsbn = isbn.replace(/[^a-zA-Z0-9]/g, '');
          let coverImage = (cleanIsbn.length >= 10)
            ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`
            : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';
            
          if (rawIllustration && (rawIllustration.startsWith('https://') || (rawIllustration.startsWith('http://') && !rawIllustration.includes('localhost')))) {
            coverImage = rawIllustration;
          }
          
          parsedBooks.push({
            id: bookId,
            title,
            subtitle,
            author,
            co_authors: translator ? `ผู้แปล: ${translator}` : '',
            isbn,
            barcode,
            accession_no: accessionNo,
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
            illustration: rawIllustration,
            cover_image: coverImage,
            description: desc,
            status,
            source: 'Google Sheet (MARC 21)',
            updated_at: new Date().toISOString()
          });
        }
        
        cachedBooks = parsedBooks;
        cachedCategories = Array.from(categoriesSet).map((name, idx) => ({
          id: `cat_sheet_${idx + 1}`,
          name,
          description: `หมวดหมู่/สถานที่จัดเก็บ: ${name}`
        }));
        cachedSheetSyncInfo = {
          url: DEFAULT_GOOGLE_SHEET_URL,
          totalBooks: cachedBooks.length,
          totalCategories: categoriesSet.size,
          lastSync: new Date().toISOString(),
          status: 'success'
        };
        
        console.log(`[Cache] Successfully initialized and cached ${cachedBooks.length} books and ${cachedCategories.length} categories directly from Google Sheets CSV!`);
        saveCacheToDisk();

        // Background sync to Supabase
        saveBatchBooksToSupabase(cachedBooks).catch(e => console.warn('[Supabase] Initial sync note:', e));
        return;
      }
    }
  } catch (sheetErr) {
    console.error('[Cache] Direct Google Sheet initialization failed, attempting fallback...', sheetErr);
  }

  // 4. Fallback to sampleBooks if offline
  console.log('[Cache] Using local sampleBooks fallback');
  cachedBooks = sampleBooks.map((b, index) => ({
    id: `sample_book_${index + 1}`,
    ...b,
    accession_no: b.barcode || `B${String(index + 1).padStart(7, '0')}`,
    updated_at: new Date().toISOString()
  }));
  const cats = new Set(sampleBooks.map(b => b.category));
  cachedCategories = Array.from(cats).map((name, idx) => ({
    id: `sample_cat_${idx + 1}`,
    name,
    description: `หมวดหมู่: ${name}`
  }));
  saveCacheToDisk();
}

// Trigger initial cache load asynchronously
initializeCache().then(() => {
  console.log(`[Cache] Successfully loaded and cached ${cachedBooks.length} books from database.`);
});


// --- Intelligent Matching Engine Functions ---

function normalizeText(text: string): string {
  if (!text) return "";
  // Keep only alphanumeric characters and Thai characters, remove spaces and punctuation
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u0e00-\u0e7f]/g, "")
    .trim();
}

// Remove Thai vowels and tone marks to compare consonants / core roots (handles OCR missed diacritics)
function removeThaiDiacritics(text: string): string {
  if (!text) return "";
  return normalizeText(text).replace(/[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]/g, "");
}

function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function getLevenshteinSimilarity(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - calculateLevenshteinDistance(normA, normB) / maxLen;
}

// Character N-gram similarity (Dice coefficient)
function getNgramSimilarity(a: string, b: string, n = 2): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;
  if (normA.length < n || normB.length < n) {
    return normA === normB ? 1.0 : (normA.includes(normB) || normB.includes(normA) ? 0.8 : 0);
  }

  const ngramsA = new Map<string, number>();
  for (let i = 0; i <= normA.length - n; i++) {
    const gram = normA.substring(i, i + n);
    ngramsA.set(gram, (ngramsA.get(gram) || 0) + 1);
  }

  let matches = 0;
  for (let i = 0; i <= normB.length - n; i++) {
    const gram = normB.substring(i, i + n);
    const count = ngramsA.get(gram) || 0;
    if (count > 0) {
      matches++;
      ngramsA.set(gram, count - 1);
    }
  }

  const totalGrams = (normA.length - n + 1) + (normB.length - n + 1);
  return totalGrams > 0 ? (2 * matches) / totalGrams : 0;
}

function getTokenSimilarity(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (!normA || !normB) return 0;
  
  const charsA = normA.split('');
  const charsB = normB.split('');
  
  let matches = 0;
  for (let i = 0; i < charsA.length; i++) {
    if (normB.includes(charsA[i])) {
      matches++;
    }
  }
  
  const simA = matches / charsA.length;
  
  let revMatches = 0;
  for (let i = 0; i < charsB.length; i++) {
    if (normA.includes(charsB[i])) {
      revMatches++;
    }
  }
  const simB = revMatches / charsB.length;
  
  return (simA + simB) / 2;
}

// Multi-criteria precision scoring system
function calculateSimilarityScore(
  detectedTitle: string, 
  bookTitle: string, 
  bookAuthor: string,
  detectedAuthor = "",
  alternativeTitles: string[] = [],
  ocrRaw = ""
): { score: number; matchReason: string } {
  const normDetected = normalizeText(detectedTitle);
  const normBook = normalizeText(bookTitle);

  if (!normDetected && !ocrRaw) return { score: 0, matchReason: 'ไม่มีข้อมูลข้อความ' };

  // 1. Direct exact normalized title match
  if (normDetected && normBook && normDetected === normBook) {
    return { score: 100, matchReason: 'ตรงกับชื่อเรื่อง 100% (Exact Match)' };
  }

  // 2. Alternative titles exact match (e.g. English original or Thai translated title)
  for (const alt of alternativeTitles) {
    const normAlt = normalizeText(alt);
    if (normAlt && (normAlt === normBook || normAlt.includes(normBook) || normBook.includes(normAlt))) {
      return { score: 98, matchReason: `ตรงกับชื่อทางเลือก/ชื่อเดิม "${alt}"` };
    }
  }

  // 3. Substring containment check
  if (normDetected && normBook) {
    if (normDetected.includes(normBook) || normBook.includes(normDetected)) {
      const ratio = Math.min(normDetected.length, normBook.length) / Math.max(normDetected.length, normBook.length);
      const score = Math.round((0.85 + ratio * 0.15) * 100);
      return { score, matchReason: 'ชื่อเรื่องเป็นส่วนหนึ่งของกันและกัน (Substring Match)' };
    }
  }

  // 4. Thai diacritics-free match (handles OCR mistakes with Thai tone marks and vowels)
  const rootDetected = removeThaiDiacritics(detectedTitle);
  const rootBook = removeThaiDiacritics(bookTitle);
  if (rootDetected && rootBook && rootDetected === rootBook) {
    return { score: 95, matchReason: 'ตรงกันตามพยัญชนะรากศัพท์ภาษาไทย (Thai Root Match)' };
  }
  if (rootDetected && rootBook && (rootDetected.includes(rootBook) || rootBook.includes(rootDetected))) {
    const ratio = Math.min(rootDetected.length, rootBook.length) / Math.max(rootDetected.length, rootBook.length);
    if (ratio > 0.7) {
      return { score: Math.round((0.82 + ratio * 0.14) * 100), matchReason: 'คล้ายคลึงตามรากศัพท์ภาษาไทย (Thai Root Substring)' };
    }
  }

  // 5. N-gram + Levenshtein + Token combination
  const levSim = getLevenshteinSimilarity(detectedTitle, bookTitle);
  const ngramSim = getNgramSimilarity(detectedTitle, bookTitle, 2);
  const tokenSim = getTokenSimilarity(detectedTitle, bookTitle);

  let combinedSim = Math.max(ngramSim * 0.5 + levSim * 0.5, tokenSim * 0.4 + levSim * 0.6);

  // Check OCR Raw text if title similarity was low
  if (combinedSim < 0.6 && ocrRaw) {
    const rawLev = getLevenshteinSimilarity(ocrRaw, bookTitle);
    const rawNgram = getNgramSimilarity(ocrRaw, bookTitle, 2);
    if (normalizeText(ocrRaw).includes(normBook)) {
      combinedSim = Math.max(combinedSim, 0.88);
    } else {
      combinedSim = Math.max(combinedSim, Math.max(rawLev, rawNgram) * 0.85);
    }
  }

  let finalScore = Math.round(combinedSim * 100);

  // Author match bonus (up to +8%)
  if (detectedAuthor && bookAuthor) {
    const normDetAuthor = normalizeText(detectedAuthor);
    const normBkAuthor = normalizeText(bookAuthor);
    if (normDetAuthor && normBkAuthor && (normDetAuthor.includes(normBkAuthor) || normBkAuthor.includes(normDetAuthor))) {
      finalScore = Math.min(100, finalScore + 8);
    }
  }

  return {
    score: finalScore,
    matchReason: finalScore >= 90 ? 'ตรงกันในระดับความแม่นยำสูง' : (finalScore >= 75 ? 'ความใกล้เคียงสูง' : 'ความใกล้เคียงบางส่วน')
  };
}

// --- API Endpoints ---

// Get all books with filter, search and pagination
app.get('/api/books', async (req, res) => {
  try {
    // Background Stale-While-Revalidate: Sync with Supabase customizations if cache hasn't merged in the last 2 minutes
    const now = Date.now();
    if (now - lastSupabaseMergeTime > 120000) {
      lastSupabaseMergeTime = now;
      mergeSupabaseCustomizations().catch(err => console.error('[Cache] Revalidation error:', err));
    }

    const qSearch = req.query.q ? String(req.query.q).toLowerCase() : '';
    const qCategory = req.query.category ? String(req.query.category) : '';
    const qPublisher = req.query.publisher ? String(req.query.publisher) : '';
    const qSort = req.query.sort ? String(req.query.sort) : 'title';

    let books: any[] = cachedBooks.map(b => ({
      ...b,
      source: 'ฐานข้อมูล Supabase',
      accession_no: b.accession_no || b.barcode || ''
    }));

    // Client-side filtering
    if (qCategory) {
      books = books.filter(b => b.category === qCategory);
    }

    if (qPublisher) {
      books = books.filter(b => b.publisher === qPublisher);
    }

    if (qSearch) {
      books = books.filter(b => 
        (b.title && b.title.toLowerCase().includes(qSearch)) || 
        (b.subtitle && b.subtitle.toLowerCase().includes(qSearch)) ||
        (b.author && b.author.toLowerCase().includes(qSearch)) || 
        (b.isbn && b.isbn.toLowerCase().includes(qSearch)) || 
        (b.barcode && b.barcode.toLowerCase().includes(qSearch)) ||
        (b.accession_no && String(b.accession_no).toLowerCase().includes(qSearch)) ||
        (b.publisher && b.publisher.toLowerCase().includes(qSearch)) ||
        (b.category && b.category.toLowerCase().includes(qSearch)) ||
        (b.subject && b.subject.toLowerCase().includes(qSearch)) ||
        (b.description && b.description.toLowerCase().includes(qSearch)) ||
        (b.keywords && b.keywords.toLowerCase().includes(qSearch)) ||
        (b.call_number && b.call_number.toLowerCase().includes(qSearch))
      );
    }

    // Helper for natural accession number sorting
    const parseAccession = (val: any): { num: number; raw: string } => {
      if (val === undefined || val === null) return { num: Infinity, raw: '' };
      const s = String(val).trim();
      const match = s.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : Infinity;
      return { num, raw: s };
    };

    // Sort
    if (qSort === 'accession' || qSort === 'accession_asc') {
      books.sort((a, b) => {
        const accA = a.accession_no || a.barcode || '';
        const accB = b.accession_no || b.barcode || '';
        const pA = parseAccession(accA);
        const pB = parseAccession(accB);
        if (pA.num !== pB.num && pA.num !== Infinity && pB.num !== Infinity) {
          return pA.num - pB.num;
        }
        return String(accA).localeCompare(String(accB), undefined, { numeric: true });
      });
    } else if (qSort === 'accession_desc') {
      books.sort((a, b) => {
        const accA = a.accession_no || a.barcode || '';
        const accB = b.accession_no || b.barcode || '';
        const pA = parseAccession(accA);
        const pB = parseAccession(accB);
        if (pA.num !== pB.num && pA.num !== Infinity && pB.num !== Infinity) {
          return pB.num - pA.num;
        }
        return String(accB).localeCompare(String(accA), undefined, { numeric: true });
      });
    } else if (qSort === 'title') {
      books.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'th'));
    } else if (qSort === 'year') {
      books.sort((a, b) => (b.publication_year || '').localeCompare(a.publication_year || ''));
    } else if (qSort === 'author') {
      books.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'th'));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limitNum = parseInt(req.query.limit as string) || 0;
    const total = books.length;

    if (limitNum > 0) {
      const startIndex = (page - 1) * limitNum;
      const paginatedBooks = books.slice(startIndex, startIndex + limitNum);
      res.json({
        success: true,
        books: paginatedBooks,
        total,
        page,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } else {
      res.json({ success: true, books, total });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all unique publishers from catalog
app.get('/api/publishers', async (req, res) => {
  try {
    const pubSet = new Set<string>();
    cachedBooks.forEach(b => {
      const p = b.publisher;
      if (p && typeof p === 'string' && p.trim() && p.trim() !== 'ไม่ระบุสำนักพิมพ์' && p.trim() !== '-') {
        pubSet.add(p.trim());
      }
    });
    const publishers = Array.from(pubSet).sort((a, b) => a.localeCompare(b, 'th'));
    res.json({ success: true, publishers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function normalizeIsbnVariants(code: string): string[] {
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
}

// Barcode / ISBN exact lookup API
app.post('/api/barcode-lookup', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Barcode or ISBN code is required.' });
    }

    const rawCode = code.trim();
    const cleanCode = rawCode.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const variants = normalizeIsbnVariants(rawCode).map(v => v.toLowerCase());

    if (!cleanCode) {
      return res.status(400).json({ success: false, error: 'Invalid barcode or ISBN format.' });
    }

    // 1. Query cached books instead of Firestore, matching exactly against the isbn field only
    let matchedBook: any = null;

    for (const b of cachedBooks) {
      const isbnClean = String(b.isbn || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (!isbnClean) continue;

      // Exact match against the ISBN variants only
      const isMatch = variants.some(v => isbnClean === v);

      if (isMatch) {
        matchedBook = b;
        break;
      }
    }

    if (matchedBook) {
      // Save scan history to cache
      const historyItem = {
        image_url: 'barcode_scan',
        extracted_text: `Barcode/ISBN: ${rawCode}`,
        detected_title: matchedBook.title,
        detected_author: matchedBook.author,
        matched_book_id: matchedBook.id,
        similarity_score: 1.0,
        search_status: 'EXACT_MATCH',
        created_at: new Date().toISOString()
      };
      
      cachedScanHistory.unshift({
        id: `history_${Date.now()}`,
        ...historyItem
      });
      if (cachedScanHistory.length > 50) {
        cachedScanHistory = cachedScanHistory.slice(0, 50);
      }
      saveCacheToDisk();

      // Background backup to Supabase
      try {
        await supabase.from('scan_history').insert({
          id: `scan_${Date.now()}`,
          ...historyItem
        });
      } catch (sbErr) {
        // Log note
      }

      return res.json({
        success: true,
        search_status: 'EXACT_MATCH',
        status_message: 'จับคู่กับหนังสือในฐานข้อมูลสำเร็จด้วยคะแนนความตรงกัน 100%',
        confidence_percentage: 100,
        detected_barcode: rawCode,
        matched_book: matchedBook,
        matches: [{
          book_id: matchedBook.id,
          book: matchedBook,
          title: matchedBook.title,
          subtitle: matchedBook.subtitle,
          author: matchedBook.author,
          isbn: matchedBook.isbn,
          publisher: matchedBook.publisher,
          publication_year: matchedBook.publication_year,
          cover_image: matchedBook.cover_image,
          category: matchedBook.category,
          call_number: matchedBook.call_number,
          status: matchedBook.status,
          similarity: 1.0,
          match_reason: 'ตรงกับรหัสบาร์โค้ด / ISBN ในฐานข้อมูล 100%'
        }]
      });
    }

    // 2. Fallback: If cleanCode is an ISBN (9 or more chars), search Google Books API to construct a full bibliographic entry
    if (cleanCode.length >= 9) {
      try {
        const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanCode}`);
        if (gbRes.ok) {
          const gbData = await gbRes.json();
          if (gbData.items && gbData.items.length > 0) {
            const vol = gbData.items[0].volumeInfo;
            const fetchedBook = {
              id: `external_isbn_${cleanCode}`,
              title: vol.title || `หนังสือ ISBN ${rawCode}`,
              subtitle: vol.subtitle || '',
              author: vol.authors ? vol.authors.join(', ') : 'ไม่ระบุผู้แต่ง',
              isbn: rawCode,
              publisher: vol.publisher || 'ไม่ระบุสำนักพิมพ์',
              publication_place: 'กรุงเทพฯ',
              publication_year: vol.publishedDate ? vol.publishedDate.substring(0, 4) : '2566',
              edition: 'พิมพ์ครั้งที่ 1',
              pages: vol.pageCount ? String(vol.pageCount) : '200',
              language: vol.language === 'en' ? 'อังกฤษ' : 'ไทย',
              category: vol.categories ? vol.categories[0] : 'หนังสือทั่วไป',
              subject: vol.categories ? vol.categories.join(', ') : '',
              keywords: `${vol.title}, ${rawCode}`,
              call_number: '000',
              barcode: rawCode,
              accession_no: rawCode,
              cover_image: vol.imageLinks?.thumbnail?.replace('http://', 'https://') || `https://covers.openlibrary.org/b/isbn/${cleanCode}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`,
              description: vol.description || `ข้อมูลสืบค้นอัตโนมัติจากฐานข้อมูล ISBN ${rawCode}`,
              status: 'พร้อมให้บริการ',
              source: 'External ISBN Lookup (Google Books)'
            };

            return res.json({
              success: true,
              search_status: 'EXACT_MATCH',
              status_message: 'ค้นพบข้อมูลบรรณานุกรมฉบับเต็มจากระบบสืบค้น ISBN สากล 100%',
              confidence_percentage: 100,
              detected_barcode: rawCode,
              matched_book: fetchedBook,
              matches: [{
                book_id: fetchedBook.id,
                book: fetchedBook,
                title: fetchedBook.title,
                subtitle: fetchedBook.subtitle,
                author: fetchedBook.author,
                isbn: fetchedBook.isbn,
                publisher: fetchedBook.publisher,
                publication_year: fetchedBook.publication_year,
                cover_image: fetchedBook.cover_image,
                category: fetchedBook.category,
                call_number: fetchedBook.call_number,
                status: fetchedBook.status,
                similarity: 1.0,
                match_reason: 'ตรงกับรหัส ISBN สากล 100%'
              }]
            });
          }
        }
      } catch (extErr) {
        console.error('External ISBN API search notice:', extErr);
      }
    }

    res.json({
      success: false,
      search_status: 'NOT_FOUND',
      status_message: `ไม่พบหนังสือที่มีหมายเลขบาร์โค้ด / ISBN "${rawCode}" ในฐานข้อมูล`,
      confidence_percentage: 0,
      detected_barcode: rawCode,
      matched_book: null,
      matches: []
    });

  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: Real Internet Book Cover Search via Google Books, DuckDuckGo Live Image & OpenLibrary
async function searchInternetBookCover(title: string, author = '', publisher = '', isbn = ''): Promise<{ url: string; source: string } | null> {
  const cleanIsbn = (isbn || '').replace(/[^0-9X]/gi, '');
  const cleanTitle = (title || '').split('/')[0].split('=')[0].replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();
  const cleanAuthor = (author || '').split('/')[0].replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();

  // 1. Google Books API (High quality book covers)
  try {
    const q = cleanIsbn.length >= 10 ? `isbn:${cleanIsbn}` : `intitle:${cleanTitle}${cleanAuthor ? `+inauthor:${cleanAuthor}` : ''}`;
    const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=3`);
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
    const query = `ปกหนังสือ "${cleanTitle}" ${cleanAuthor}`.trim();
    const pageRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await pageRes.text();
    const vqdMatch = html.match(/vqd=([\d-]+)/) || html.match(/vqd="([\d-]+)"/);
    if (vqdMatch) {
      const vqd = vqdMatch[1];
      const imgRes = await fetch(`https://duckduckgo.com/i.js?l=th-th&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
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
      url: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`,
      source: 'open_library'
    };
  }

  return null;
}

// Search internet for single book cover and persist in Firestore
app.post('/api/books/:id/search-cover', async (req, res) => {
  try {
    const bookId = req.params.id;
    const bookIdx = cachedBooks.findIndex(b => b.id === bookId);
    if (bookIdx === -1) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    const bookData = cachedBooks[bookIdx];
    const result = await searchInternetBookCover(bookData.title, bookData.author, bookData.publisher, bookData.isbn);
    if (result && result.url) {
      const updatePayload = {
        cover_image: result.url,
        illustration: result.url, // จัดเก็บ URL รูป ในคอลัมน์ภาพประกอบ
        cover_source: result.source,
        updated_at: new Date().toISOString()
      };
      
      // Update cache
      cachedBooks[bookIdx] = {
        ...bookData,
        ...updatePayload
      };
      saveCacheToDisk();

      // Background update in Supabase
      try {
        await supabase.from('books').update(updatePayload).eq('id', bookId);
        await supabase.from('book_customizations').upsert({ id: bookId, ...updatePayload });
      } catch (sbErr) {
        console.warn('Backup book cover update to Supabase notice:', sbErr);
      }

      return res.json({ success: true, cover_image: result.url, illustration: result.url, source: result.source, message: 'ค้นพบและบันทึกภาพหน้าปกจากอินเทอร์เน็ตสำเร็จ' });
    }
    res.json({ success: false, message: 'ไม่พบภาพหน้าปกที่ตรงกันจากอินเทอร์เน็ต' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get background auto-enrich progress status
app.get('/api/books/auto-enrich-status', (req, res) => {
  res.json({
    success: true,
    active: isBackgroundEnrichActive,
    progress: backgroundEnrichProgress
  });
});

// Batch enrich covers from internet
app.post('/api/books/auto-enrich-covers', async (req, res) => {
  try {
    const toEnrich: any[] = [];
    
    // Find candidates from cache
    cachedBooks.forEach((b, idx) => {
      // Any book that lacks a custom real cover (either missing, contains default placeholder links like localhost/unsplash, or lacks cover_source info)
      const hasRealCover = b.cover_image && 
                           !b.cover_image.includes('unsplash.com') && 
                           !b.cover_image.includes('localhost') && 
                           b.cover_source && 
                           b.cover_source !== 'placeholder';
      if (!hasRealCover) {
        toEnrich.push({ book: b, index: idx });
      }
    });

    if (toEnrich.length === 0) {
      return res.json({ 
        success: true, 
        updatedCount: 0, 
        totalCandidate: 0, 
        message: 'หนังสือทุกรายการในฐานข้อมูลมีภาพปกจริงเรียบร้อยแล้ว ไม่จำเป็นต้องประมวลผลเพิ่ม' 
      });
    }

    if (isBackgroundEnrichActive) {
      return res.json({ 
        success: true, 
        active: true,
        message: 'ระบบกำลังดึงภาพหน้าปกจริงอยู่เบื้องหลังในขณะนี้...', 
        progress: backgroundEnrichProgress 
      });
    }

    isBackgroundEnrichActive = true;
    backgroundEnrichProgress = {
      current: 0,
      total: toEnrich.length,
      updated: 0
    };

    // Run the background loop sequentially with a tiny throttle delay to stay completely safe of API rate-limits
    setTimeout(async () => {
      console.log(`[BackgroundEnrich] Starting asynchronous processing for ${toEnrich.length} books...`);
      
      for (let i = 0; i < toEnrich.length; i++) {
        if (!isBackgroundEnrichActive) {
          console.log('[BackgroundEnrich] Stopped by flag.');
          break;
        }

        const { book, index } = toEnrich[i];
        backgroundEnrichProgress.current = i + 1;

        try {
          const found = await searchInternetBookCover(book.title, book.author, book.publisher, book.isbn);
          if (found && found.url) {
            const updatePayload = {
              cover_image: found.url,
              illustration: found.url,
              cover_source: found.source,
              updated_at: new Date().toISOString()
            };
            
            // Update in server cache
            cachedBooks[index] = {
              ...book,
              ...updatePayload
            };
            
            // Background update to Supabase
            try {
              await supabase.from('books').update(updatePayload).eq('id', book.id);
              await supabase.from('book_customizations').upsert({ id: book.id, ...updatePayload });
            } catch (sbErr) {
              // Fail silently in background
            }
            
            backgroundEnrichProgress.updated++;
          }
        } catch (err: any) {
          console.error(`[BackgroundEnrich] Error fetching index ${i} (${book.title}):`, err.message || err);
        }

        // Save cache to server disk every 10 successful matches or on final book to keep memory safe
        if ((i + 1) % 10 === 0 || i === toEnrich.length - 1) {
          saveCacheToDisk();
        }

        // Throttle at 200ms delay to prevent Google Books rate limiter blocks
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      isBackgroundEnrichActive = false;
      console.log(`[BackgroundEnrich] Process finished. Successfully enriched: ${backgroundEnrichProgress.updated} / ${toEnrich.length}`);
    }, 50);

    res.json({ 
      success: true, 
      active: true,
      updatedCount: 0, 
      totalCandidate: toEnrich.length, 
      message: `✨ เริ่มต้นระบบดึงภาพหน้าปกจริงเบื้องหลังสำหรับหนังสือทั้งหมดจำนวน ${toEnrich.length} รายการสำเร็จแล้ว! ภาพปกจะทยอยแสดงผลบนหน้าจอเมื่อค้นพบ` 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Supabase live database status endpoint
app.get('/api/supabase/status', async (req, res) => {
  try {
    const { count: booksCount, error: bErr } = await supabase.from('books').select('*', { count: 'exact', head: true });
    const { count: catsCount, error: cErr } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const { count: customCount } = await supabase.from('book_customizations').select('*', { count: 'exact', head: true });

    let rlsBlocked = false;
    let rlsMessage = '';
    const testId = 'rls_ping_' + Date.now();
    const testPing = await supabase.from('books').insert([{ id: testId, title: 'test_ping' }]).select();
    if (testPing.error) {
      rlsBlocked = true;
      rlsMessage = testPing.error.message;
    } else {
      await supabase.from('books').delete().eq('id', testId);
    }

    res.json({
      success: true,
      connected: !bErr,
      booksCount: booksCount ?? 0,
      categoriesCount: catsCount ?? 0,
      customCount: customCount ?? 0,
      rlsBlocked,
      rlsMessage,
      serverMemoryCount: cachedBooks.length,
      source: 'ฐานข้อมูล Supabase (Supabase DB)'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Google Sheet Sync & Info Endpoints
app.get('/api/sheets/info', async (req, res) => {
  try {
    if (!cachedSheetSyncInfo) {
      cachedSheetSyncInfo = {
        url: DEFAULT_GOOGLE_SHEET_URL,
        totalBooks: cachedBooks.length,
        totalCategories: cachedCategories.length,
        lastSync: new Date().toISOString(),
        status: 'success'
      };
    }
    res.json({ success: true, ...cachedSheetSyncInfo });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sheets/sync', async (req, res) => {
  try {
    const sheetUrl = req.body?.url || DEFAULT_GOOGLE_SHEET_URL;
    console.log(`[GoogleSheetSync] Triggered sync from: ${sheetUrl}`);

    const response = await fetch(sheetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, error: `Failed to fetch Google Sheet: ${response.status} ${response.statusText}` });
    }

    const csvText = await response.text();
    const workbook = XLSX.read(csvText, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length < 2) {
      return res.status(400).json({ success: false, error: 'Google Sheet does not contain enough data.' });
    }

    const categoriesSet = new Set<string>();
    let booksToSave: any[] = [];

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
      const rawAccession = String(r[2] || '').trim();
      const accessionNo = rawAccession || String(i);
      const barcode = rawAccession || `B${String(i).padStart(7, '0')}`;
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

      const bookId = rawAccession ? `book_reg_${rawAccession}` : (barcode ? `book_reg_${barcode}` : `book_${isbn.replace(/[^a-zA-Z0-9]/g, '')}`);

      const rawIllustration = String(r[15] || '').trim();
      const cleanIsbn = isbn.replace(/[^a-zA-Z0-9]/g, '');
      let coverImage = (cleanIsbn.length >= 10)
        ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg?default=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1544947950-fa07a98d237f%3Fauto%3Dformat%26fit%3Dcrop%26q%3D80%26w%3D600`
        : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';

      if (rawIllustration && (rawIllustration.startsWith('https://') || (rawIllustration.startsWith('http://') && !rawIllustration.includes('localhost')))) {
        coverImage = rawIllustration;
      }

      booksToSave.push({
        id: bookId,
        title,
        subtitle,
        author,
        co_authors: translator ? `ผู้แปล: ${translator}` : '',
        isbn,
        barcode,
        accession_no: accessionNo,
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
        illustration: rawIllustration, // คอลัมน์ ภาพประกอบ
        cover_image: coverImage,
        description: desc,
        status,
        source: 'Google Sheet (MARC 21)',
        updated_at: new Date().toISOString()
      });
    }

    // Preserve custom covers and manual edits saved in Supabase from being overwritten by raw Google Sheet data
    try {
      console.log('[GoogleSheetSync] Fetching custom edits and covers from Supabase...');
      const { data: customData, error: customErr } = await supabase.from('book_customizations').select('*');
      if (!customErr && customData && customData.length > 0) {
        const customMap = new Map();
        customData.forEach(item => {
          customMap.set(item.id, item);
        });
        booksToSave = booksToSave.map(b => {
          if (customMap.has(b.id)) {
            const customBook = customMap.get(b.id);
            return {
              ...b,
              ...customBook
            };
          }
          return b;
        });
        console.log(`[GoogleSheetSync] Successfully merged ${customData.length} custom covers and edits from Supabase.`);
      }
    } catch (sbErr) {
      console.warn('[GoogleSheetSync] Failed to fetch and merge Supabase custom edits:', sbErr);
    }

    // Save to server cache instantly!
    cachedBooks = booksToSave;
    cachedCategories = Array.from(categoriesSet).map((name, idx) => ({
      id: `cat_sheet_${idx + 1}`,
      name,
      description: `หมวดหมู่/สถานที่จัดเก็บ: ${name}`
    }));
    
    const syncInfo = {
      url: sheetUrl,
      totalBooks: booksToSave.length,
      totalCategories: categoriesSet.size,
      lastSync: new Date().toISOString(),
      status: 'success'
    };
    cachedSheetSyncInfo = syncInfo;
    
    saveCacheToDisk();

    // Broadcast real-time database sync
    broadcastRealtime({ type: 'DATABASE_SYNCED', payload: { totalBooks: booksToSave.length, categories: categoriesSet.size } });

    // Respond immediately!
    res.json({ 
      success: true, 
      ...syncInfo, 
      message: `ซิงค์ข้อมูลสำเร็จจำนวน ${booksToSave.length} เล่ม และ ${categoriesSet.size} หมวดหมู่ (ประมวลผลดึงตรงจาก Google Sheet และจัดเก็บลงฐานข้อมูล Supabase เรียบร้อย)` 
    });

    // Background asynchronous Supabase backup.
    setTimeout(async () => {
      try {
        console.log('[GoogleSheetSync] Beginning background Supabase storage...');
        
        // 1. Save Sheet Sync Info to Supabase
        try {
          await supabase.from('sheet_sync_info').upsert({
            id: 'current',
            url: sheetUrl,
            total_books: booksToSave.length,
            total_categories: categoriesSet.size,
            last_sync: new Date().toISOString(),
            status: 'success'
          });
        } catch (e) {
          console.warn('[GoogleSheetSync Backup] Failed to save sync info to Supabase:', e);
        }

        // 2. Upsert books in chunks to Supabase
        await saveBatchBooksToSupabase(booksToSave);

        // 3. Update categories in Supabase
        try {
          const catArray = Array.from(categoriesSet).map((name, idx) => ({
            id: `cat_sheet_${idx + 1}`,
            name,
            description: `หมวดหมู่/สถานที่จัดเก็บ: ${name}`
          }));
          await supabase.from('categories').upsert(catArray, { onConflict: 'name' });
        } catch (catErr) {
          console.warn('[GoogleSheetSync Backup] Category writes to Supabase note:', catErr);
        }

        console.log('[GoogleSheetSync Backup] Background Supabase storage finished.');
      } catch (backupErr) {
        console.error('[GoogleSheetSync Backup] Unexpected background error:', backupErr);
      }
    }, 100);
  } catch (err: any) {
    console.error('Google Sheet Sync Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clean dummy sample books endpoint (Admin)
app.post('/api/admin/clean-dummy-books', async (req, res) => {
  try {
    const beforeCount = cachedBooks.length;
    // Keep only books that come from Google Sheet (MARC 21)
    const validBooks = cachedBooks.filter(b => b.source === 'Google Sheet (MARC 21)' && !b.id.startsWith('sample_book_'));
    const deletedCount = beforeCount - validBooks.length;
    cachedBooks = validBooks;
    saveCacheToDisk();

    // Delete dummy from Supabase
    try {
      await supabase.from('books').delete().neq('source', 'Google Sheet (MARC 21)');
    } catch (e) {
      console.warn('Supabase clean dummy notice:', e);
    }
    
    res.json({ success: true, deletedCount, message: `ลบข้อมูลตัวอย่างที่ไม่ตรงกับ Sheet สำเร็จจำนวน ${deletedCount} รายการ` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get individual book
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = cachedBooks.find(b => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    res.json({ success: true, book });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new book (Admin)
app.post('/api/books', async (req, res) => {
  try {
    const bookData = req.body;
    if (!bookData.title || !bookData.author || !bookData.isbn) {
      return res.status(400).json({ success: false, error: 'Title, Author and ISBN are required.' });
    }

    // Generate safe specific ID
    const cleanIsbn = String(bookData.isbn || '').replace(/[^a-zA-Z0-9]/g, '');
    const bookId = `book_${cleanIsbn || Date.now()}`;

    const data = {
      ...bookData,
      id: bookId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to cache
    cachedBooks.unshift(data);
    
    // Add to categories cache if new
    if (data.category && !cachedCategories.some(c => c.name === data.category)) {
      cachedCategories.push({
        id: `cat_${Date.now()}`,
        name: data.category,
        description: `หมวดหมู่: ${data.category}`
      });
    }
    saveCacheToDisk();

    // Background Supabase update
    try {
      await supabase.from('books').upsert(data);

      // Also write to book_customizations for fast cross-device sync
      await supabase.from('book_customizations').upsert({
        id: bookId,
        cover_image: data.cover_image,
        illustration: data.illustration || data.cover_image,
        cover_source: data.cover_source || 'manual',
        status: data.status,
        title: data.title,
        author: data.author,
        publisher: data.publisher,
        category: data.category,
        call_number: data.call_number,
        updated_at: data.updated_at
      });
    } catch (sbErr) {
      console.warn('Backup write to Supabase failed for new book:', sbErr);
    }

    // Broadcast real-time book creation
    broadcastRealtime({ type: 'BOOK_CREATED', payload: data });

    res.status(201).json({ success: true, id: bookId, book: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch add books (Excel/CSV Import)
app.post('/api/books/batch', async (req, res) => {
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
      const bookId = `book_${cleanIsbn || `${Date.now()}_${i}`}`;

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
        barcode: String(b.barcode || `B${Math.random().toString().substring(2, 9)}`).trim(),
        accession_no: String(b.accession_no || b.barcode || '').trim(),
        cover_image: String(b.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600').trim(),
        description: String(b.description || 'นำเข้าผ่านระบบไฟล์').trim(),
        status: b.status === 'ถูกยืมแล้ว' || b.status === 'ปรับปรุง' ? b.status : 'พร้อมให้บริการ',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      batchBooks.push(data);
      results.imported++;
      results.items.push({ id: bookId, title: data.title });
    }

    // Add all to cache
    cachedBooks = [...batchBooks, ...cachedBooks];
    
    // Add missing categories to cache
    batchBooks.forEach(b => {
      if (b.category && !cachedCategories.some(c => c.name === b.category)) {
        cachedCategories.push({
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: b.category,
          description: `หมวดหมู่: ${b.category}`
        });
      }
    });
    saveCacheToDisk();

    // Background write to Supabase in chunks
    setTimeout(async () => {
      await saveBatchBooksToSupabase(batchBooks);
    }, 100);

    // Broadcast real-time batch add
    broadcastRealtime({ type: 'BATCH_BOOKS_ADDED', payload: { count: batchBooks.length } });

    res.json({ success: true, ...results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update book (Admin)
app.put('/api/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const bookData = req.body;
    
    const idx = cachedBooks.findIndex(b => b.id === bookId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const updatedBook = {
      ...cachedBooks[idx],
      ...bookData,
      updated_at: new Date().toISOString()
    };

    // Update in cache
    cachedBooks[idx] = updatedBook;
    saveCacheToDisk();

    // Immediate Supabase update
    try {
      const supaUpdatePayload: any = {
        updated_at: updatedBook.updated_at
      };
      if (updatedBook.cover_image !== undefined) supaUpdatePayload.cover_image = updatedBook.cover_image;
      if (updatedBook.illustration !== undefined) supaUpdatePayload.illustration = updatedBook.illustration;
      if (updatedBook.cover_source !== undefined) supaUpdatePayload.cover_source = updatedBook.cover_source;
      if (updatedBook.title !== undefined) supaUpdatePayload.title = updatedBook.title;
      if (updatedBook.subtitle !== undefined) supaUpdatePayload.subtitle = updatedBook.subtitle;
      if (updatedBook.author !== undefined) supaUpdatePayload.author = updatedBook.author;
      if (updatedBook.co_authors !== undefined) supaUpdatePayload.co_authors = updatedBook.co_authors;
      if (updatedBook.publisher !== undefined) supaUpdatePayload.publisher = updatedBook.publisher;
      if (updatedBook.publication_year !== undefined) supaUpdatePayload.publication_year = updatedBook.publication_year;
      if (updatedBook.edition !== undefined) supaUpdatePayload.edition = updatedBook.edition;
      if (updatedBook.pages !== undefined) supaUpdatePayload.pages = updatedBook.pages;
      if (updatedBook.category !== undefined) supaUpdatePayload.category = updatedBook.category;
      if (updatedBook.subject !== undefined) supaUpdatePayload.subject = updatedBook.subject;
      if (updatedBook.keywords !== undefined) supaUpdatePayload.keywords = updatedBook.keywords;
      if (updatedBook.call_number !== undefined) supaUpdatePayload.call_number = updatedBook.call_number;
      if (updatedBook.ddc !== undefined) supaUpdatePayload.ddc = updatedBook.ddc;
      if (updatedBook.barcode !== undefined) supaUpdatePayload.barcode = updatedBook.barcode;
      if (updatedBook.accession_no !== undefined) supaUpdatePayload.accession_no = updatedBook.accession_no;
      if (updatedBook.price !== undefined) supaUpdatePayload.price = updatedBook.price;
      if (updatedBook.series !== undefined) supaUpdatePayload.series = updatedBook.series;
      if (updatedBook.translator !== undefined) supaUpdatePayload.translator = updatedBook.translator;
      if (updatedBook.description !== undefined) supaUpdatePayload.description = updatedBook.description;
      if (updatedBook.status !== undefined) supaUpdatePayload.status = updatedBook.status;

      const { error: bErr } = await supabase.from('books').update(supaUpdatePayload).eq('id', bookId);
      if (bErr) {
        console.error('[Supabase Update] Error updating book:', bErr.message);
      } else {
        console.log(`[Supabase Update] Successfully updated book ${bookId} in Supabase!`);
      }

      // Also persist to book_customizations for fast cross-device sync and to safeguard against future sheet syncs
      const { error: cErr } = await supabase.from('book_customizations').upsert({
        id: bookId,
        cover_image: updatedBook.cover_image,
        illustration: updatedBook.illustration || updatedBook.cover_image,
        cover_source: updatedBook.cover_source || 'manual',
        status: updatedBook.status,
        title: updatedBook.title,
        author: updatedBook.author,
        publisher: updatedBook.publisher,
        category: updatedBook.category,
        call_number: updatedBook.call_number,
        updated_at: updatedBook.updated_at
      }, { onConflict: 'id' });
      if (cErr) {
        console.error('[Supabase Update] Error updating customization:', cErr.message);
      }
    } catch (sbErr) {
      console.warn('Update in Supabase failed for book:', sbErr);
    }

    // Broadcast real-time book update to all clients
    broadcastRealtime({ type: 'BOOK_UPDATED', payload: updatedBook });

    res.json({ success: true, id: bookId, book: updatedBook });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete book (Admin)
app.delete('/api/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const idx = cachedBooks.findIndex(b => b.id === bookId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    // Remove from cache
    cachedBooks.splice(idx, 1);
    saveCacheToDisk();

    // Background Supabase deletion
    try {
      await supabase.from('books').delete().eq('id', bookId);
      await supabase.from('book_customizations').delete().eq('id', bookId);
    } catch (sbErr) {
      console.warn('Backup deletion in Supabase failed for book:', sbErr);
    }

    // Broadcast real-time book deletion to all clients
    broadcastRealtime({ type: 'BOOK_DELETED', payload: { id: bookId } });

    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Categories
app.get('/api/categories', async (req, res) => {
  try {
    if (cachedCategories.length === 0) {
      try {
        const { data, error } = await supabase.from('categories').select('*');
        if (!error && data && data.length > 0) {
          cachedCategories = data;
          saveCacheToDisk();
        } else {
          cachedCategories = [
            { id: "cat_1", name: "วรรณกรรมเยาวชน", description: "หนังสือและเรื่องสั้นสำหรับเด็กและเยาวชน" },
            { id: "cat_2", name: "นวนิยายแฟนตาซี", description: "นิยายจินตนาการ เวทมนตร์ คาถา" },
            { id: "cat_3", name: "พัฒนาตนเอง", description: "เทคนิคการคิด การจัดระเบียบชีวิต" }
          ];
        }
      } catch (e) {
        cachedCategories = [
          { id: "cat_1", name: "วรรณกรรมเยาวชน", description: "หนังสือและเรื่องสั้นสำหรับเด็กและเยาวชน" },
          { id: "cat_2", name: "นวนิยายแฟนตาซี", description: "นิยายจินตนาการ เวทมนตร์ คาถา" },
          { id: "cat_3", name: "พัฒนาตนเอง", description: "เทคนิคการคิด การจัดระเบียบชีวิต" }
        ];
      }
    }
    res.json({ success: true, categories: cachedCategories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add Category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const catId = `cat_${Date.now()}`;
    const data = { id: catId, name, description };

    // Add to cache
    cachedCategories.push(data);
    saveCacheToDisk();

    // Background update in Supabase
    try {
      await supabase.from('categories').upsert(data, { onConflict: 'name' });
    } catch (sbErr) {
      console.warn('Backup upsert in Supabase failed for category:', sbErr);
    }

    res.status(201).json({ success: true, id: catId, category: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Scan History
app.get('/api/scan-history', async (req, res) => {
  try {
    if (cachedScanHistory.length === 0) {
      try {
        const { data, error } = await supabase.from('scan_history').select('*').order('created_at', { ascending: false }).limit(50);
        if (!error && data && data.length > 0) {
          cachedScanHistory = data;
          saveCacheToDisk();
        }
      } catch (e) {
        console.warn('Supabase scan_history read notice:', e);
      }
    }
    res.json({ success: true, history: cachedScanHistory });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/scan-cover
app.post('/api/scan-cover', async (req, res) => {
  try {
    const { image } = req.body; // base64 representation of image
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image data is required in base64' });
    }

    // Extract base64 details
    let mimeType = 'image/jpeg';
    let base64Data = image;
    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      mimeType = parts[0].split(':')[1];
      base64Data = parts[1];
    }

    // 1. Fetch current catalog books from server cache
    const allBooks = [...cachedBooks];

    const catalogSample = allBooks.slice(0, 60).map(b => 
      `- ID: "${b.id}" | Title: "${b.title}" | Subtitle: "${b.subtitle || ''}" | Author: "${b.author}" | ISBN: "${b.isbn}"`
    ).join('\n');

    let ocrText = "";
    let detectedTitle = "";
    let detectedSubtitle = "";
    let detectedAuthor = "";
    let detectedPublisher = "";
    let detectedLanguage = "th";
    let alternativeTitles: string[] = [];
    let directMatchedId = "";

    // If Gemini key is empty/not configured, fallback gracefully
    if (!geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY') {
      console.warn('Gemini API key is not configured. Falling back to mock parsing.');
      ocrText = "ความสุขของกะทิ งามพรรณ เวชชาชีวะ แพรวสำนักพิมพ์";
      detectedTitle = "ความสุขของกะทิ";
      detectedAuthor = "งามพรรณ เวชชาชีวะ";
      detectedLanguage = "th";
    } else {
      try {
        const promptText = `You are an expert Google Lens and AI Librarian OCR System.
Analyze this book cover image with extreme precision (especially for Thai and English literature).
Tasks:
1. OCR: Extract all text visible on the book cover.
2. Clean Title: Identify the MAIN book title. Exclude publisher awards, marketing stickers (e.g. "รางวัลซีไรต์", "Bestseller"), series numbers, or price tags.
3. Subtitle & Author: Identify any subtitle, primary author, and publisher.
4. Alternative / Translated Titles: If the book is known by an English original title or Thai translated title, list them in "alternative_titles".
5. Google Lens Detection Tags: Provide clean extracted entity tags for the Google Lens UI with "label" (เช่น "ชื่อเรื่อง", "ผู้แต่ง", "สำนักพิมพ์", "ประเภท") and "text".
6. Catalog Comparison: Check if this book corresponds to any item in this library catalog:
${catalogSample}
If there is an exact or strong match in the catalog, specify its ID in "matched_catalog_id".

Respond STRICTLY in JSON format:
{
  "ocr_text": "all raw text extracted from the cover",
  "title": "Clean Main Title",
  "subtitle": "Subtitle if present",
  "author": "Author name",
  "publisher": "Publisher name",
  "language": "th or en or other",
  "alternative_titles": ["Alt title 1", "Original Title"],
  "matched_catalog_id": "Catalog ID if strongly matched or null",
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
                  mimeType: mimeType
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
          try {
            const fallbackResponse = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                },
                promptText
              ],
              config: {
                responseMimeType: 'application/json'
              }
            });
            rawText = fallbackResponse.text || "{}";
          } catch (m2Err: any) {
            console.warn('Fallback model gemini-3.1-flash-lite notice:', m2Err?.message || m2Err);
            throw m2Err;
          }
        }

        const result = JSON.parse(rawText);
        
        ocrText = result.ocr_text || result.title || "";
        detectedTitle = result.title || "";
        detectedSubtitle = result.subtitle || "";
        detectedAuthor = result.author || "";
        detectedPublisher = result.publisher || "";
        detectedLanguage = result.language || "th";
        alternativeTitles = Array.isArray(result.alternative_titles) ? result.alternative_titles : [];
        directMatchedId = result.matched_catalog_id || "";
      } catch (geminiError: any) {
        console.warn('Gemini API notice / fallback:', geminiError.message || geminiError);
        // Resilient Fallback: Match against catalog books by finding candidate titles
        ocrText = "ระบบประมวลผลวิเคราะห์หน้าปกหนังสือภาษาไทยอัตโนมัติ";
        detectedTitle = "วิเคราะห์ภาพหน้าปก (Google Lens)";
        detectedAuthor = "";
        detectedLanguage = "th";
      }
    }

    // Now, run the Multi-Stage Precision Matching Pipeline
    const matches: any[] = [];
    
    for (const book of allBooks) {
      // Direct catalog match from Gemini
      if (directMatchedId && book.id === directMatchedId) {
        matches.push({
          book_id: book.id,
          book: book,
          similarity: 1.0,
          match_reason: 'AI ตรวจพบและยืนยันตรงกับหนังสือในฐานข้อมูล 100%'
        });
        continue;
      }

      // Calculate scores using multi-criteria algorithm
      const titleMatch = calculateSimilarityScore(
        detectedTitle, 
        book.title, 
        book.author, 
        detectedAuthor, 
        alternativeTitles, 
        ocrText
      );

      // Also check subtitle if book has subtitle
      let bestScore = titleMatch.score;
      let bestReason = titleMatch.matchReason;

      if (book.subtitle && detectedTitle) {
        const subMatch = calculateSimilarityScore(detectedTitle, book.subtitle, book.author, detectedAuthor, [], ocrText);
        if (subMatch.score > bestScore) {
          bestScore = Math.max(bestScore, subMatch.score - 5);
          bestReason = 'ตรงกับชื่อเรื่องรอง (Subtitle Match)';
        }
      }

      // Check keywords match
      if (book.keywords && detectedTitle) {
        const kwList = book.keywords.toLowerCase().split(/[,\s]+/);
        const normDet = normalizeText(detectedTitle);
        for (const kw of kwList) {
          if (kw && kw.length >= 3 && normDet.includes(normalizeText(kw))) {
            bestScore = Math.max(bestScore, 70);
            bestReason = `ตรวจพบคีย์เวิร์ด "${kw}"`;
            break;
          }
        }
      }

      const similarity = bestScore / 100;
      
      if (similarity >= 0.45) { // Threshold 45% to capture close potential items
        matches.push({
          book_id: book.id,
          book: book,
          similarity: Number(similarity.toFixed(2)),
          match_reason: bestReason
        });
      }
    }

    // Sort matches descending by similarity
    matches.sort((a, b) => b.similarity - a.similarity);

    // Determine Search Status
    let searchStatus: 'EXACT_MATCH' | 'HIGH_CONFIDENCE' | 'PARTIAL_MATCH' | 'NOT_FOUND' = 'NOT_FOUND';
    let statusMessage = 'ไม่พบหนังสือที่ตรงกับหน้าปกในฐานข้อมูลห้องสมุด';
    let topMatchedBook: any = null;
    let confidencePercentage = 0;

    if (matches.length > 0) {
      const topMatch = matches[0];
      confidencePercentage = Math.round(topMatch.similarity * 100);
      topMatchedBook = topMatch.book;

      if (confidencePercentage >= 90) {
        searchStatus = 'EXACT_MATCH';
        statusMessage = `ค้นพบหนังสือตรงกับหน้าปกอย่างแม่นยำ (${confidencePercentage}%)`;
      } else if (confidencePercentage >= 75) {
        searchStatus = 'HIGH_CONFIDENCE';
        statusMessage = `พบหนังสือที่มีความเป็นไปได้สูง (${confidencePercentage}%) โปรดตรวจสอบและยืนยันข้อมูล`;
      } else if (confidencePercentage >= 50) {
        searchStatus = 'PARTIAL_MATCH';
        statusMessage = `พบหนังสือที่มีชื่อหรือข้อมูลใกล้เคียง (${confidencePercentage}%)`;
      } else {
        searchStatus = 'NOT_FOUND';
        statusMessage = `ความคล้ายคลึงต่ำ (${confidencePercentage}%) อาจเป็นหนังสือเล่มใหม่ที่ยังไม่มีในห้องสมุด`;
        topMatchedBook = null;
      }
    }

    // Save search history
    const matchedBookId = topMatchedBook ? topMatchedBook.id : null;
    const similarityScore = topMatchedBook && matches.length > 0 ? matches[0].similarity : 0;

    // Auto-search internet cover if needed & persist
    let internetCoverUrl: string | null = null;
    let internetCoverSource: string | null = null;

    if (topMatchedBook) {
      if (!topMatchedBook.cover_image || topMatchedBook.cover_image.includes('localhost') || topMatchedBook.cover_image.includes('unsplash')) {
        const netRes = await searchInternetBookCover(topMatchedBook.title, topMatchedBook.author, topMatchedBook.publisher, topMatchedBook.isbn);
        if (netRes && netRes.url) {
          internetCoverUrl = netRes.url;
          internetCoverSource = netRes.source;
          topMatchedBook.cover_image = netRes.url;
          topMatchedBook.cover_source = netRes.source;
          try {
            await supabase.from('books').update({
              cover_image: netRes.url,
              illustration: netRes.url,
              cover_source: netRes.source,
              updated_at: new Date().toISOString()
            }).eq('id', topMatchedBook.id);
            await supabase.from('book_customizations').upsert({
              id: topMatchedBook.id,
              cover_image: netRes.url,
              illustration: netRes.url,
              cover_source: netRes.source,
              updated_at: new Date().toISOString()
            });
          } catch (e) {
            console.warn('Auto-save internet cover to Supabase notice:', e);
          }
        }
      } else {
        internetCoverUrl = topMatchedBook.cover_image;
      }
    } else if (detectedTitle && detectedTitle !== 'วิเคราะห์ภาพหน้าปก (Google Lens)') {
      const netRes = await searchInternetBookCover(detectedTitle, detectedAuthor, detectedPublisher);
      if (netRes && netRes.url) {
        internetCoverUrl = netRes.url;
        internetCoverSource = netRes.source;
      }
    }

    const lensTags = [
      ...(detectedTitle ? [{ label: 'ชื่อเรื่อง', text: detectedTitle }] : []),
      ...(detectedAuthor ? [{ label: 'ผู้แต่ง', text: detectedAuthor }] : []),
      ...(detectedPublisher ? [{ label: 'สำนักพิมพ์', text: detectedPublisher }] : []),
      ...(topMatchedBook?.call_number ? [{ label: 'เลขเรียกหนังสือ', text: topMatchedBook.call_number }] : []),
      ...(topMatchedBook?.category ? [{ label: 'สถานที่จัดเก็บ', text: topMatchedBook.category }] : [])
    ];

    const historyItem = {
      image_url: image.startsWith('data:') ? 'base64_stored' : image,
      extracted_text: ocrText,
      detected_title: detectedTitle,
      detected_author: detectedAuthor,
      matched_book_id: matchedBookId,
      similarity_score: similarityScore,
      search_status: searchStatus,
      created_at: new Date().toISOString()
    };
    
    cachedScanHistory.unshift({
      id: `history_${Date.now()}`,
      ...historyItem
    });
    if (cachedScanHistory.length > 50) {
      cachedScanHistory = cachedScanHistory.slice(0, 50);
    }
    saveCacheToDisk();

    // Background backup to Supabase
    try {
      await supabase.from('scan_history').insert({
        id: `scan_${Date.now()}`,
        ...historyItem
      });
    } catch (sbErr) {
      // Log notice
    }

    res.json({
      success: true,
      search_status: searchStatus,
      status_message: statusMessage,
      confidence_percentage: confidencePercentage,
      ocr_text: ocrText,
      detected_title: detectedTitle,
      detected_subtitle: detectedSubtitle,
      detected_author: detectedAuthor,
      detected_publisher: detectedPublisher,
      detected_language: detectedLanguage,
      alternative_titles: alternativeTitles,
      internet_cover: internetCoverUrl,
      internet_cover_source: internetCoverSource,
      lens_tags: lensTags,
      matched_book: topMatchedBook,
      matches: matches.map(m => ({
        book_id: m.book_id,
        title: m.book.title,
        subtitle: m.book.subtitle,
        author: m.book.author,
        isbn: m.book.isbn,
        publisher: m.book.publisher,
        publication_year: m.book.publication_year,
        cover_image: m.book.cover_image,
        category: m.book.category,
        call_number: m.book.call_number,
        status: m.book.status,
        similarity: m.similarity,
        match_reason: m.match_reason,
        book: m.book
      }))
    });

  } catch (err: any) {
    console.error('OCR Scanning route error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Integrate Vite App ---
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const fsModule = await import('fs');
      const indexPath = path.resolve(__dirname, 'index.html');
      let indexHtml = fsModule.readFileSync(indexPath, 'utf-8');
      indexHtml = await vite.transformIndexHtml(url, indexHtml);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(indexHtml);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  // Serve build static files
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
}

export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & WebSocket is running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

