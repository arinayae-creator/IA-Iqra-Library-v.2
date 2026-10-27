import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Plus, 
  Sparkles, 
  Layers, 
  Database, 
  RefreshCw, 
  Edit3, 
  BookOpen, 
  Barcode, 
  CheckSquare, 
  Square, 
  Info,
  ExternalLink,
  Save,
  X,
  Hash,
  AlertTriangle,
  Building,
  Globe,
  Library,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Users,
  ClipboardPaste,
  ImageIcon,
  Cloud,
  Radio,
  Wifi,
  WifiOff,
  Code,
  CheckCircle2,
  Tag,
  Tags,
  Bookmark,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Marc21Record, MarcTagItem, generateThaiCutter, generateMarcTagsFromRecord } from '../../api/generate-marc21';
import { supabase } from '../../supabaseClient';
import { saveRecordsToIndexedDb, loadRecordsFromIndexedDb } from '../utils/marcIndexedDb';
import { DdcClassificationModal } from './DdcClassificationModal';

export const calculateThaiCutter = generateThaiCutter;

export interface SystemAuthorCutterItem {
  id: string;
  authorName: string;
  type: 'personal' | 'corporate';
  authorCutter: string;
  bookCount?: number;
  source?: string;
}

export interface SystemSubjectDdcItem {
  id: string;
  subject: string;
  primaryDdc: string;
  allDdcs: { ddc: string; count: number }[];
  category: string;
  bookCount: number;
  sampleTitles: string[];
  source: string;
}

export const getDdcCategoryName = (ddc: string): string => {
  if (!ddc || ddc === '-') return 'ไม่ระบุหมวดหมู่';
  const clean = ddc.trim();
  if (clean.startsWith('ด')) return 'หนังสือเด็ก (ด)';
  if (clean.startsWith('ย')) return 'หนังสือเยาวชน (ย)';
  if (clean.startsWith('น')) return 'นวนิยาย (น)';
  if (clean.startsWith('ร')) return 'เรื่องสั้น (ร)';
  
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    if (num < 100) return '000 วิทยาการคอมพิวเตอร์/ความรู้ทั่วไป';
    if (num < 200) return '100 ปรัชญาและจิตวิทยา';
    if (num < 300) return '200 ศาสนา';
    if (num < 400) return '300 สังคมศาสตร์/เศรษฐศาสตร์';
    if (num < 500) return '400 ภาษาศาสตร์';
    if (num < 600) return '500 วิทยาศาสตร์บริสุทธิ์';
    if (num < 700) return '600 เทคโนโลยี/การแพทย์/การจัดการ';
    if (num < 800) return '700 ศิลปะและนันทนาการ';
    if (num < 900) return '800 วรรณกรรม';
    if (num < 1000) return '900 ประวัติศาสตร์และภูมิศาสตร์';
  }
  return 'หมวดทั่วไป';
};

export const STANDARD_SUBJECT_DDC_MAPPINGS: { subject: string; ddc: string; category?: string }[] = [
  { subject: 'จิตวิทยา', ddc: '150', category: '100 ปรัชญาและจิตวิทยา' },
  { subject: 'จิตวิทยาประยุกต์', ddc: '158', category: '100 ปรัชญาและจิตวิทยา' },
  { subject: 'การดำเนินชีวิต', ddc: '158.1', category: '100 ปรัชญาและจิตวิทยา' },
  { subject: 'การพัฒนาตนเอง', ddc: '158.1', category: '100 ปรัชญาและจิตวิทยา' },
  { subject: 'มนุษยสัมพันธ์', ddc: '158.2', category: '100 ปรัชญาและจิตวิทยา' },
  { subject: 'จิตวิทยาเด็ก', ddc: '155.4', category: '100 ปรัชญาและจิตวิทยา' },
  { subject: 'จิตวิทยาพัฒนาการ', ddc: '155', category: '100 ปรัชญาและจิตวิทยา' },
  { subject: 'การแก้ปัญหาในเด็ก.', ddc: '155.4', category: '100 ปรัชญาและจิตวิทยา' },
  { subject: 'การเงินส่วนบุคคล', ddc: '332.024', category: '300 สังคมศาสตร์/เศรษฐศาสตร์' },
  { subject: 'การลงทุน', ddc: '332.6', category: '300 สังคมศาสตร์/เศรษฐศาสตร์' },
  { subject: 'การลงทุนส่วนบุคคล.', ddc: '332.678', category: '300 สังคมศาสตร์/เศรษฐศาสตร์' },
  { subject: 'เศรษฐศาสตร์', ddc: '330', category: '300 สังคมศาสตร์/เศรษฐศาสตร์' },
  { subject: 'การบริหารธุรกิจ', ddc: '658', category: '600 เทคโนโลยี/การแพทย์/การจัดการ' },
  { subject: 'การจัดการ', ddc: '658.4', category: '600 เทคโนโลยี/การแพทย์/การจัดการ' },
  { subject: 'การตลาด', ddc: '658.8', category: '600 เทคโนโลยี/การแพทย์/การจัดการ' },
  { subject: 'การบริหารงานบุคคล', ddc: '658.3', category: '600 เทคโนโลยี/การแพทย์/การจัดการ' },
  { subject: 'การบัญชี', ddc: '657', category: '600 เทคโนโลยี/การแพทย์/การจัดการ' },
  { subject: 'คอมพิวเตอร์', ddc: '004', category: '000 วิทยาการคอมพิวเตอร์/ความรู้ทั่วไป' },
  { subject: 'ปัญญาประดิษฐ์', ddc: '006.3', category: '000 วิทยาการคอมพิวเตอร์/ความรู้ทั่วไป' },
  { subject: 'เทคโนโลยีสารสนเทศ', ddc: '004', category: '000 วิทยาการคอมพิวเตอร์/ความรู้ทั่วไป' },
  { subject: 'การเขียนโปรแกรมคอมพิวเตอร์', ddc: '005.1', category: '000 วิทยาการคอมพิวเตอร์/ความรู้ทั่วไป' },
  { subject: 'สุขภาพและการดูแลตนเอง', ddc: '613', category: '600 เทคโนโลยี/การแพทย์/การจัดการ' },
  { subject: 'อาหารและโภชนาการ', ddc: '613.2', category: '600 เทคโนโลยี/การแพทย์/การจัดการ' },
  { subject: 'อาหารและโภชนาการสำหรับเด็ก.', ddc: '613.2', category: '600 เทคโนโลยี/การแพทย์/การจัดการ' },
  { subject: 'การแพทย์', ddc: '610', category: '600 เทคโนโลยี/การแพทย์/การจัดการ' },
  { subject: 'วิทยาศาสตร์', ddc: '500', category: '500 วิทยาศาสตร์บริสุทธิ์' },
  { subject: 'คณิตศาสตร์', ddc: '510', category: '500 วิทยาศาสตร์บริสุทธิ์' },
  { subject: 'ฟิสิกส์', ddc: '530', category: '500 วิทยาศาสตร์บริสุทธิ์' },
  { subject: 'เคมี', ddc: '540', category: '500 วิทยาศาสตร์บริสุทธิ์' },
  { subject: 'ชีววิทยา', ddc: '570', category: '500 วิทยาศาสตร์บริสุทธิ์' },
  { subject: 'สิ่งแวดล้อม', ddc: '333.7', category: '300 สังคมศาสตร์/เศรษฐศาสตร์' },
  { subject: 'การศึกษาและการเรียนรู้', ddc: '370', category: '300 สังคมศาสตร์/เศรษฐศาสตร์' },
  { subject: 'ภาษาอังกฤษ', ddc: '420', category: '400 ภาษาศาสตร์' },
  { subject: 'ภาษาไทย', ddc: '495.91', category: '400 ภาษาศาสตร์' },
  { subject: 'การสื่อสาร', ddc: '302.2', category: '300 สังคมศาสตร์/เศรษฐศาสตร์' },
  { subject: 'วรรณกรรมสำหรับเด็ก', ddc: 'ด', category: 'หนังสือเด็ก (ด)' },
  { subject: 'นิทานภาพ', ddc: 'ด', category: 'หนังสือเด็ก (ด)' },
  { subject: 'การดำเนินชีวิต --วรรณกรรมสำหรับเด็ก', ddc: 'ด', category: 'หนังสือเด็ก (ด)' },
  { subject: 'ชีวประวัติ--สำหรับเด็ก.', ddc: 'ด', category: 'หนังสือเด็ก (ด)' },
  { subject: 'การ์ตูนความรู้', ddc: 'ย', category: 'หนังสือเยาวชน (ย)' },
  { subject: 'นวนิยาย', ddc: '895.913', category: '800 วรรณกรรม' },
  { subject: 'นวนิยายไทย', ddc: '895.913', category: '800 วรรณกรรม' },
  { subject: 'นวนิยายแปล', ddc: '823', category: '800 วรรณกรรม' },
  { subject: 'เรื่องสั้น', ddc: '895.913', category: '800 วรรณกรรม' },
  { subject: 'ประวัติศาสตร์', ddc: '900', category: '900 ประวัติศาสตร์และภูมิศาสตร์' },
  { subject: 'ประวัติศาสตร์ไทย', ddc: '959.3', category: '900 ประวัติศาสตร์และภูมิศาสตร์' },
  { subject: 'ชีวประวัติ', ddc: '920', category: '900 ประวัติศาสตร์และภูมิศาสตร์' },
  { subject: 'พุทธศาสนา', ddc: '294.3', category: '200 ศาสนา' },
  { subject: 'ปรัชญาและศาสนา', ddc: '100', category: '100 ปรัชญาและจิตวิทยา' },
  { subject: 'การท่องเที่ยว', ddc: '910.4', category: '900 ประวัติศาสตร์และภูมิศาสตร์' },
  { subject: 'ศิลปะ', ddc: '700', category: '700 ศิลปะและนันทนาการ' },
  { subject: 'ดนตรี', ddc: '780', category: '700 ศิลปะและนันทนาการ' },
  { subject: 'กีฬาและการออกกำลังกาย', ddc: '796', category: '700 ศิลปะและนันทนาการ' }
];

/**
 * Comprehensively extracts ALL subject headings and associated DDC from any record or book object.
 * Guaranteed to collect every single subject heading without any limitation of 3:
 * - Direct fields: subject_650a, subject_650_2, subject_650_3
 * - Extra numbered fields: subject_650_4, subject_650_5, subject_4, subject_5...
 * - Arrays/strings: all650Subjects, extraSubjects, subjects, subject, keywords
 * - All MARC tags with tagID '650' (and subfields $a, $x, $v, $z, $y)
 * - Properly tokenizes delimited subjects (by commas, semicolons, slashes, double hyphens, newlines, pipes)
 */
export function extractAllSubjectsAndDdc(r: any): { subjects: string[]; ddc: string; title: string; category?: string } {
  if (!r) return { subjects: [], ddc: '', title: '' };

  // 1. Determine DDC classification
  let ddc = (r.ddc_082a || r.ddc || '').trim();
  if (!ddc && r.call_number) {
    const parts = String(r.call_number).trim().split(/\s+/);
    if (parts.length > 0) {
      const first = parts[0];
      if (/^[ดยนร]/.test(first)) ddc = first.charAt(0);
      else if (/^\d+(\.\d+)?$/.test(first)) ddc = first;
    }
  }
  if (!ddc && Array.isArray(r.marc_tags)) {
    const t082 = r.marc_tags.find((t: any) => t && (t.tagID === '082' || t.tag === '082'));
    if (t082) {
      const normalizedData = String(t082.data || t082.content || '').replace(/\u001f/g, '$');
      const m = normalizedData.match(/\$a([^\$]+)/i);
      if (m) ddc = m[1].trim();
      else if (/^\d+(\.\d+)?$/.test(normalizedData.trim())) ddc = normalizedData.trim();
    }
  }

  // 2. Determine Book Title
  const title = (r.title_245a || r.title || '').trim().replace(/\s*\/\s*.*$/, '').replace(/[\.\,\:\/]+$/, '').trim();

  // 3. Raw subjects collection from all potential sources in this record
  const rawPool: string[] = [];

  // (a) Direct subject fields
  if (r.subject_650a) rawPool.push(String(r.subject_650a));
  if (r.subject_650_2) rawPool.push(String(r.subject_650_2));
  if (r.subject_650_3) rawPool.push(String(r.subject_650_3));

  // (b) Additional numbered fields (subject_650_4, subject_650_5, subject_4, subject_5...)
  Object.keys(r).forEach(key => {
    if (/^subject_650_\d+$/i.test(key) || /^subject_\d+$/i.test(key)) {
      if (key !== 'subject_650_2' && key !== 'subject_650_3' && r[key]) {
        rawPool.push(String(r[key]));
      }
    }
  });

  // (c) Generic subject/subjects/all650Subjects/extraSubjects fields
  if (r.subject) rawPool.push(String(r.subject));
  if (r.subjects) {
    if (Array.isArray(r.subjects)) {
      r.subjects.forEach((s: any) => s && rawPool.push(String(s)));
    } else {
      rawPool.push(String(r.subjects));
    }
  }
  if (Array.isArray(r.all650Subjects)) {
    r.all650Subjects.forEach((s: any) => s && rawPool.push(String(s)));
  }
  if (Array.isArray(r.extraSubjects)) {
    r.extraSubjects.forEach((s: any) => s && rawPool.push(String(s)));
  }

  // (d) Complete extraction from marc_tags (all tag 650s and all subfields $a, $x, $v, $z, $y)
  if (Array.isArray(r.marc_tags)) {
    r.marc_tags.forEach((t: any) => {
      if (!t) return;
      const tagID = String(t.tagID || t.tag || '').trim();
      if (tagID === '650') {
        const dataStr = String(t.data || t.content || '').trim();
        if (dataStr) {
          const normalized = dataStr.replace(/\u001f/g, '$');
          if (normalized.includes('$')) {
            const subMatches = normalized.match(/\$[axvzy][^\$]+/gi);
            if (subMatches && subMatches.length > 0) {
              subMatches.forEach(sm => {
                const cleanSm = sm.replace(/^\$[axvzy]\s*/i, '').trim();
                if (cleanSm) rawPool.push(cleanSm);
              });
            } else {
              rawPool.push(normalized.replace(/[\u001f\$][a-z0-9]/gi, ' ').trim());
            }
          } else {
            rawPool.push(dataStr);
          }
        }
      }
    });
  }

  // 4. Tokenize, clean, and deduplicate
  const subjectsSet = new Set<string>();
  const delimiterRegex = /[,;\n\r|/•·]+|(?:\s+[-—–]{1,2}\s+)|(?:\s*--\s*)/;

  rawPool.forEach(item => {
    if (!item || typeof item !== 'string') return;
    const tokens = item.split(delimiterRegex);
    tokens.forEach(tok => {
      let clean = tok.trim();
      clean = clean.replace(/[\u001f\$][a-z0-9]/gi, ' ');
      clean = clean.replace(/^[\s\/:;=,.\-—–"'“”‘’\(\)\[\]\{\}]+/, '').replace(/[\s\/:;=,.\-—–"'“”‘’\(\)\[\]\{\}]+$/, '').trim();
      if (clean && clean !== '-' && clean !== 'ทั่วไป' && clean.length >= 2) {
        subjectsSet.add(clean);
      }
    });
  });

  return {
    subjects: Array.from(subjectsSet),
    ddc,
    title,
    category: r.category || r.storage_location || undefined
  };
}

export function isCorporateAuthor(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  const corporateKeywords = [
    'co.', 'ltd', 'inc.', 'corp', 'company',
    'บริษัท', 'ห้างหุ้นส่วน', 'จำกัด', 'มหาชน',
    'กระทรวง', 'กรม', 'สำนัก', 'สำนักงาน', 'กอง', 'กลุ่ม', 'ศูนย์',
    'สถาบัน', 'มหาวิทยาลัย', 'วิทยาลัย', 'โรงเรียน',
    'มูลนิธิ', 'สมาคม', 'สหกรณ์', 'ชมรม', 'สภา',
    'คณะกรรมการ', 'ราชบัณฑิตยสภา', 'ธนาคาร', 'โรงพยาบาล',
    'ฝ่าย', 'องค์การ', 'กองทุน', 'ศาล', 'กองบัญชาการ',
    'กอมโดริ', 'gomdori'
  ];
  return corporateKeywords.some(kw => lower.includes(kw));
}

// Extracts pure author cutter (without initial letter of book title, e.g. "กอมโดริ" -> "ก363")
export function getPureAuthorCutter(rawCutter: string, authorName: string): string {
  const cleanName = (authorName || '').trim();
  if (cleanName.includes('กอมโดริ') || cleanName.toLowerCase().includes('gomdori')) {
    return 'ก363';
  }

  if (rawCutter && rawCutter !== '-') {
    let c = rawCutter.replace(/^\./, '').replace(/\s+\d{4}$/, '').trim();
    const m = c.match(/^([ก-ฮa-zA-Z]\d+)/);
    if (m) {
      return m[1];
    }
    if (/[ก-ฮa-zA-Z]$/.test(c) && c.length > 2) {
      return c.slice(0, -1);
    }
    return c;
  }

  if (cleanName) {
    const full = generateThaiCutter(cleanName, 'ก');
    let c = full.replace(/^\./, '').trim();
    const m = c.match(/^([ก-ฮa-zA-Z]\d+)/);
    if (m) {
      return m[1];
    }
    return c.replace(/[ก-ฮa-zA-Z]$/, '').trim() || c;
  }
  return '-';
}

export const STANDARD_LIBRARY_AUTHORS: { authorName: string; type: 'personal' | 'corporate'; authorCutter: string }[] = [
  { authorName: 'กอมโดริ co.', type: 'corporate', authorCutter: 'ก363' },
  { authorName: 'กอมโดริ co', type: 'corporate', authorCutter: 'ก363' },
  { authorName: 'กอมโดริ Co.', type: 'corporate', authorCutter: 'ก363' },
  { authorName: 'กอมโดริ', type: 'corporate', authorCutter: 'ก363' },
  { authorName: 'Gomdori co.', type: 'corporate', authorCutter: 'ก363' },
  { authorName: 'Gomdori co', type: 'corporate', authorCutter: 'ก363' },
  { authorName: 'Gomdori Co.', type: 'corporate', authorCutter: 'ก363' },
  { authorName: 'Gomdori', type: 'corporate', authorCutter: 'ก363' },
  { authorName: 'Robert T. Kiyosaki', type: 'personal', authorCutter: 'ร228' },
  { authorName: 'กฤษณา อโศกสิน', type: 'personal', authorCutter: 'ก108' },
  { authorName: 'กรมวิชาการ กระทรวงศึกษาธิการ', type: 'corporate', authorCutter: 'ก465' },
  { authorName: 'กระทรวงวัฒนธรรม', type: 'corporate', authorCutter: 'ก465' },
  { authorName: 'งามพรรณ เวชชาชีวะ', type: 'personal', authorCutter: 'ง241' },
  { authorName: 'จักรพงษ์ เมษพันธุ์', type: 'personal', authorCutter: 'จ213' },
  { authorName: 'จุฬาลงกรณ์มหาวิทยาลัย', type: 'corporate', authorCutter: 'จ671' },
  { authorName: 'ฉัตราภรณ์', type: 'personal', authorCutter: 'ฉ14' },
  { authorName: 'ชาติ กอบจิตติ', type: 'personal', authorCutter: 'ช212' },
  { authorName: 'ชาญวิทย์ เกษตรศิริ', type: 'personal', authorCutter: 'ช214' },
  { authorName: 'ชิดชนก นิ่มศิริ', type: 'personal', authorCutter: 'ช321' },
  { authorName: 'ถวัลย์ ดัชนี', type: 'personal', authorCutter: 'ถ321' },
  { authorName: 'ทมยันตี', type: 'personal', authorCutter: 'ท341' },
  { authorName: 'ธีรดา', type: 'personal', authorCutter: 'ธ37' },
  { authorName: 'นพพร สุวรรณพานิช', type: 'personal', authorCutter: 'น215' },
  { authorName: 'ประภัสสร เสวิกุล', type: 'personal', authorCutter: 'ป341' },
  { authorName: 'เปรมเกียรติ', type: 'personal', authorCutter: 'ป75' },
  { authorName: 'แพรวา', type: 'personal', authorCutter: 'พ78' },
  { authorName: 'ไพฑูรย์ ธัญญา', type: 'personal', authorCutter: 'พ974' },
  { authorName: 'ภาสกร รัตนสุวรรณ', type: 'personal', authorCutter: 'ภ321' },
  { authorName: 'มกุฏ อรดี', type: 'personal', authorCutter: 'ม213' },
  { authorName: 'มหาวิทยาลัยธรรมศาสตร์', type: 'corporate', authorCutter: 'ม641' },
  { authorName: 'รพินทรนาถ ฐากูร', type: 'personal', authorCutter: 'ร321' },
  { authorName: 'ราชบัณฑิตยสภา', type: 'corporate', authorCutter: 'ร721' },
  { authorName: 'ลีฮุนแจ', type: 'personal', authorCutter: 'ล511' },
  { authorName: 'วรธิดา', type: 'personal', authorCutter: 'ว74' },
  { authorName: 'วินทร์ เลียววาริณ', type: 'personal', authorCutter: 'ว341' },
  { authorName: 'ว.วชิรเมธี', type: 'personal', authorCutter: 'ว213' },
  { authorName: 'ศิลา โคมฉาย', type: 'personal', authorCutter: 'ศ321' },
  { authorName: 'สิริมา อภิวัฒน์', type: 'personal', authorCutter: 'ส745' },
  { authorName: 'เสกสรรค์ ประเสริฐกุล', type: 'personal', authorCutter: 'ส321' },
  { authorName: 'โสรยา', type: 'personal', authorCutter: 'ส87' },
  { authorName: 'สุจิตต์ วงษ์เทศ', type: 'personal', authorCutter: 'ส421' },
  { authorName: 'สุนทรภู่', type: 'personal', authorCutter: 'ส424' },
  { authorName: 'สมาคมห้องสมุดแห่งประเทศไทย', type: 'corporate', authorCutter: 'ส321' },
  { authorName: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน', type: 'corporate', authorCutter: 'ส465' },
  { authorName: 'อัมรา เรืองศิริ', type: 'personal', authorCutter: 'อ547' },
  { authorName: 'อาจินต์ ปัญจพรรค์', type: 'personal', authorCutter: 'อ213' },
  { authorName: 'อานันท์ ปันยารชุน', type: 'personal', authorCutter: 'อ214' }
];

// Helper to get work mark (first character of title)
export function getAuthorTitleWorkMark(title: string): string {
  const frontVowels = ['เ', 'แ', 'โ', 'ใ', 'ไ'];
  let cleanTitle = (title || '').replace(/^[0-9\s"“'‘\(\[\{:]+/g, '').trim();
  if (frontVowels.includes(cleanTitle.charAt(0))) {
    cleanTitle = cleanTitle.substring(1);
  }
  return cleanTitle.charAt(0) || '';
}

// Check if an author already has a registered author cutter code in the system
export function findExistingAuthorBaseCutter(authorName: string, records?: Marc21Record[]): string | null {
  const cleanName = (authorName || '').trim();
  if (!cleanName) return null;
  const lowerName = cleanName.toLowerCase();

  // 1. Check known standard library authors
  const foundStandard = STANDARD_LIBRARY_AUTHORS.find(
    a => a.authorName.toLowerCase() === lowerName || cleanName.toLowerCase().includes(a.authorName.toLowerCase()) || a.authorName.toLowerCase().includes(cleanName.toLowerCase())
  );
  if (foundStandard && foundStandard.authorCutter) {
    return foundStandard.authorCutter;
  }

  // 2. Check current records in memory
  if (records && records.length > 0) {
    for (const r of records) {
      if (r.author_personal && r.author_personal.trim().toLowerCase() === lowerName && r.cutter_082b && r.cutter_082b !== '-') {
        const pure = getPureAuthorCutter(r.cutter_082b, r.author_personal);
        if (pure && pure !== '-') return pure;
      }
    }
  }

  return null;
}

// Get cutter for author: Prioritize existing system author cutter, or compute from formula
export function getExistingOrCalculatedCutter(authorName: string, title: string, records?: Marc21Record[], existingCutters?: Set<string>): { cutter: string; isFromExistingSystem: boolean } {
  const existingBase = findExistingAuthorBaseCutter(authorName, records);
  const workMark = getAuthorTitleWorkMark(title);

  if (existingBase) {
    return {
      cutter: `${existingBase}${workMark}`,
      isFromExistingSystem: true
    };
  }

  return {
    cutter: calculateThaiCutter(authorName, title, existingCutters),
    isFromExistingSystem: false
  };
}

// Auto DDC mapping according to storage location rules
export function getAutoDdcForStorageLocation(location: string): string | null {
  const loc = (location || '').trim();
  if (!loc) return null;
  
  // Cartoon locations -> ย (การ์ตูน วิทย์/คณิต, การ์ตูน สังคม, การ์ตูน ความรู้ทั่วไป, การ์ตูน ภาษา/วรรณกรรม)
  if (
    loc === 'การ์ตูน วิทย์/คณิต' ||
    loc === 'การ์ตูน สังคม' ||
    loc === 'การ์ตูน ความรู้ทั่วไป' ||
    loc === 'การ์ตูน ภาษา/วรรณกรรม' ||
    loc.includes('การ์ตูน') ||
    loc.startsWith('ย')
  ) {
    return 'ย';
  }

  // Children locations -> ด (สำหรับเด็ก, สำหรับเด็ก (ภาษาฯ), สำหรับเด็ก (ศาสนา))
  if (
    loc === 'สำหรับเด็ก' ||
    loc === 'สำหรับเด็ก (ภาษาฯ)' ||
    loc === 'สำหรับเด็ก (ศาสนา)' ||
    loc.includes('เด็ก') ||
    loc.startsWith('ด')
  ) {
    return 'ด';
  }

  return null;
}

export const AuthorInputWithSuggestions = ({
  value,
  onChange,
  onSelectAuthor,
  records,
  currentTitle = ''
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectAuthor: (author: string, calculatedCutter: string) => void;
  records: Marc21Record[];
  currentTitle?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; cutter: string; isExisting: boolean }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = (value || '').trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Collect matching authors from local table records
        const sessionAuthors = records
          .map(r => r.author_personal)
          .filter((a): a is string => Boolean(a && a !== '-' && a.toLowerCase().includes(q.toLowerCase())));

        // Fetch matching authors from Supabase catalog
        const { data } = await supabase
          .from('books')
          .select('author')
          .ilike('author', `%${q}%`)
          .limit(8);

        const dbAuthors = (data || [])
          .map(d => d.author)
          .filter((a): a is string => Boolean(a && a.trim()));

        // Also check standard library authors
        const stdAuthors = STANDARD_LIBRARY_AUTHORS
          .filter(a => a.authorName.toLowerCase().includes(q.toLowerCase()))
          .map(a => a.authorName);

        const combinedNames = Array.from(new Set([...sessionAuthors, ...dbAuthors, ...stdAuthors])).slice(0, 8);
        const existingCutters = new Set(records.map(r => r.cutter_082b).filter(Boolean));

        const mapped = combinedNames.map(authorName => {
          const res = getExistingOrCalculatedCutter(authorName, currentTitle || 'หนังสือ', records, existingCutters);
          return {
            name: authorName,
            cutter: res.cutter,
            isExisting: res.isFromExistingSystem
          };
        });

        setSuggestions(mapped);
      } catch {
        setSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [value, records, currentTitle]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="พิมพ์ชื่อผู้แต่ง (ระบบจะค้นหาชื่อที่มีอยู่แล้วเพื่อเลือกได้)..."
        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-xs sm:text-sm text-slate-800"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto animate-fadeIn">
          <div className="px-3 py-1.5 bg-slate-100 text-[10px] font-extrabold text-slate-600 border-b border-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span>👤 รายชื่อผู้แต่งในระบบ ({suggestions.length})</span>
            <span className="text-emerald-700 font-bold">คลิกเลือกเพื่อใช้ชื่อ & ดึงเลขคัตเตอร์</span>
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={`auth_sug_${idx}`}
              type="button"
              onClick={() => {
                onSelectAuthor(item.name, item.cutter);
                setIsOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 text-xs text-slate-800 hover:bg-emerald-50 hover:text-emerald-950 font-medium transition flex items-center justify-between border-b border-slate-100 last:border-0 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{item.name}</span>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                  คัตเตอร์: {item.cutter} {item.isExisting ? '⭐ (ในระบบ)' : ''}
                </span>
              </div>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                เลือก
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const parseMarcSubfield = (data: string, subfield: string): string => {
  if (!data) return '';
  const normalized = data.replace(/\u001f/g, '$');
  const regex = new RegExp(`\\$${subfield}([^\\$]+)`, 'i');
  const match = normalized.match(regex);
  return match ? match[1].trim() : '';
};

export const STANDARD_700_ROLES_LIST = [
  'ผู้แต่ง',
  'บรรณาธิการ',
  'ผู้แปล',
  'ผู้วาดภาพประกอบ',
  'ผู้รวบรวม',
  'ช่างภาพ',
  'ผู้ประพันธ์เพลง',
  'ผู้บรรยาย',
  'ผู้อำนวยการผลิต',
  'ผู้กำกับ',
  'ผู้สัมภาษณ์',
  'ผู้ถูกสัมภาษณ์',
  'อาจารย์ที่ปรึกษา',
] as const;

export const STANDARD_700_ROLES_MATCH = [...STANDARD_700_ROLES_LIST].sort((a, b) => b.length - a.length);

export const parseAddedEntry700Parts = (val: string): { name: string; role: string; formatted: string } => {
  if (!val || val === '-' || val.trim() === '') {
    return { name: '', role: '', formatted: '-' };
  }
  let str = val.trim();

  // 1. Check known standard roles first (sorted longest to shortest)
  for (const role of STANDARD_700_ROLES_MATCH) {
    const reg = new RegExp(`[,;:/(]?\\s*(?:${role})\\.?\\)?$`, 'i');
    if (reg.test(str)) {
      const name = str.replace(reg, '').replace(/[,\s:;=.]+$/, '').trim();
      return { name, role, formatted: `${name}, ${role}.` };
    }
  }

  // 2. Generic patterns for variations/abbreviations
  const genericPatterns: Array<{ match: RegExp; role: string }> = [
    { match: /[,;:/(]?\s*(?:แปลโดย|แปล|trans\.?|translator)\.?\)?$/i, role: 'ผู้แปล' },
    { match: /[,;:/(]?\s*(?:ผู้วาดภาพ|ภาพประกอบ|ภาพโดย|ภาพ|illus\.?|illustrator)\.?\)?$/i, role: 'ผู้วาดภาพประกอบ' },
    { match: /[,;:/(]?\s*(?:บก\.?|ed\.?|editor)\.?\)?$/i, role: 'บรรณาธิการ' },
    { match: /[,;:/(]?\s*(?:รวบรวมโดย|รวบรวม|comp\.?|compiler)\.?\)?$/i, role: 'ผู้รวบรวม' },
    { match: /[,;:/(]?\s*(?:แต่งโดย|ผู้เขียน|เขียนโดย|ผู้แต่งร่วม|เขียน)\.?\)?$/i, role: 'ผู้แต่ง' },
    { match: /[,;:/(]?\s*(?:ถ่ายภาพโดย|ถ่ายภาพ|ผู้ถ่ายภาพ|photo\.?|photographer)\.?\)?$/i, role: 'ช่างภาพ' },
    { match: /[,;:/(]?\s*(?:ประพันธ์เพลง|ทำนอง|คำร้อง)\.?\)?$/i, role: 'ผู้ประพันธ์เพลง' },
    { match: /[,;:/(]?\s*(?:บรรยายโดย|บรรยาย)\.?\)?$/i, role: 'ผู้บรรยาย' },
    { match: /[,;:/(]?\s*(?:อำนวยการผลิต|ผู้อำนวยการสร้าง)\.?\)?$/i, role: 'ผู้อำนวยการผลิต' },
    { match: /[,;:/(]?\s*(?:กำกับโดย|กำกับการแสดง|ผู้กำกับการแสดง)\.?\)?$/i, role: 'ผู้กำกับ' },
    { match: /[,;:/(]?\s*(?:สัมภาษณ์โดย)\.?\)?$/i, role: 'ผู้สัมภาษณ์' },
    { match: /[,;:/(]?\s*(?:ที่ปรึกษา)\.?\)?$/i, role: 'อาจารย์ที่ปรึกษา' }
  ];

  for (const gp of genericPatterns) {
    if (gp.match.test(str)) {
      const name = str.replace(gp.match, '').replace(/[,\s:;=.]+$/, '').trim();
      return { name, role: gp.role, formatted: `${name}, ${gp.role}.` };
    }
  }

  // 3. Custom role if user typed comma + role (e.g. "สมชาย, ผู้ตรวจทาน." or "ดร.สมบัติ, ผู้ประสานงาน.")
  if (str.includes(',')) {
    const parts = str.split(',');
    const name = parts[0].trim();
    let role = parts.slice(1).join(',').trim().replace(/\.$/, '');
    if (name && role) {
      return { name, role, formatted: `${name}, ${role}.` };
    }
  }

  // 4. Raw name without role
  const clean = str.replace(/[\s\.:;=,]+$/, '').replace(/^[\s\.:;=,]+/, '').trim();
  if (!clean || clean === '-') return { name: '', role: '', formatted: '-' };

  return { name: clean, role: '', formatted: clean };
};

export const formatAddedEntry700 = (val: string, defaultRole?: string): string => {
  if (!val || val === '-' || val.trim() === '') return '-';
  const parsed = parseAddedEntry700Parts(val);
  if (!parsed.name) return '-';
  if (parsed.role) {
    return `${parsed.name}, ${parsed.role}.`;
  }
  if (defaultRole) {
    return `${parsed.name}, ${defaultRole}.`;
  }
  return parsed.name;
};

export const attachRoleToAddedEntry700 = (val: string, newRole: string): string => {
  if (!val || val === '-') return newRole && newRole !== '__CLEAR__' ? `, ${newRole}.` : '-';
  const parsed = parseAddedEntry700Parts(val);
  const baseName = parsed.name || val.trim();
  if (!baseName || baseName === '-') return '-';
  if (!newRole || newRole === '__CLEAR__') return baseName;
  return `${baseName}, ${newRole}.`;
};

export const formatAuthorList245c = (rawResp: string, authorPersonal?: string): string => {
  if (!rawResp && !authorPersonal) return 'ไม่ระบุผู้แต่ง.';

  let text = (rawResp || authorPersonal || '').trim();

  // If text already has [และคนอื่นๆ ...], preserve author + brackets cleanly
  const existingOthersMatch = text.match(/^(.+?)\s*(\[และคนอื่นๆ(?:\s*\(?[0-9]+\)?\s*คน)?\]\.?)$/i);
  if (existingOthersMatch) {
    let mainA = existingOthersMatch[1].replace(/^(?:เรื่อง|ผู้แต่ง|ผู้เขียน|เขียนโดย|เขียน|แต่งโดย|แต่ง)\s*[:：,]?\s*/i, '');
    mainA = mainA.replace(/[\s\/:;=,]+(?:เขียนโดย|ผู้แต่ง|ผู้เขียน|แต่งโดย|เขียน|เรื่อง|แต่ง)\s*$/i, '');
    mainA = mainA.replace(/[\s\/:;=,.]+$/, '').trim();
    return `${mainA} ${existingOthersMatch[2].endsWith('.') ? existingOthersMatch[2] : existingOthersMatch[2] + '.'}`;
  }

  // Split by top-level delimiters (semicolon, slash)
  let segments: string[] = [];
  if (text.includes(';')) {
    segments = text.split(';').map(s => s.trim()).filter(Boolean);
  } else if (text.includes('/')) {
    segments = text.split('/').map(s => s.trim()).filter(Boolean);
  } else {
    segments = [text];
  }

  // Filter out segments that are translator / illustrator / photographer / editor etc.
  const authorSegments: string[] = [];
  for (const seg of segments) {
    const isExplicitNonAuthor = (
      // Keyword with space, colon, or comma at the end of the segment: e.g. "Kang Gyung-Hyo ภาพประกอบ", "กัญญารัตน์ จิราสวัสดิ์ แปล.", "John Doe, illus."
      /[\s:：,](?:แปล|ผู้แปล|แปลโดย|ภาพประกอบ|ภาพโดย|ผู้วาดภาพประกอบ|ผู้วาดภาพ|ผู้วาด|วาดภาพโดย|วาดภาพ|ภาพ|ภาพถ่าย|รูปภาพ|illustrat|illustrated|illustrations|illustration|illustrator|illus\.|translator|translated|trans\.|translation|editor|ed\.|edition|บก\.|บรรณาธิการ)\s*[\.]?$/i.test(seg) ||
      // Keyword at the beginning of segment: e.g. "ภาพประกอบ : Kang Gyung-Hyo", "แปลโดย ภาสกร", "ภาพโดย..."
      /^(?:แปล|ผู้แปล|แปลโดย|ภาพประกอบ|ภาพโดย|ผู้วาดภาพประกอบ|ผู้วาดภาพ|ผู้วาด|วาดภาพโดย|วาดภาพ|ภาพ|ภาพถ่าย|รูปภาพ|illustrated|illustrations|illustration|illustrator|illus\.|translated|translator|trans\.|editor|บก\.|บรรณาธิการ)\s*[:：,\s]/i.test(seg) ||
      // Parenthetical keywords: e.g. "(ภาพประกอบ)", "(แปล)", "(ผู้แปล)", "(illustrator)"
      /\((?:แปล|ผู้แปล|แปลโดย|ภาพประกอบ|ภาพ|ผู้วาด|ผู้วาดภาพ|วาดภาพ|illustrator|illus\.|translator|trans\.|editor|ed\.)\)/i.test(seg) ||
      // Mid-segment keywords
      /(?:แปลโดย|ผู้แปล|ภาพประกอบโดย|ภาพโดย|ผู้วาดภาพประกอบ|ผู้วาดภาพโดย|วาดภาพโดย|illustrated by|translated by)/i.test(seg)
    );

    if (!isExplicitNonAuthor) {
      authorSegments.push(seg);
    }
  }

  if (authorSegments.length === 0) {
    if (authorPersonal) {
      const cleanA = authorPersonal.replace(/\.+$/, '').trim();
      return `${cleanA}.`;
    }
    return 'ไม่ระบุผู้แต่ง.';
  }

  // Combine remaining author segments and parse individual author names
  let parsedAuthors: string[] = [];
  for (let seg of authorSegments) {
    seg = seg.replace(/^(?:เรื่อง|ผู้แต่ง|ผู้เขียน|เขียนโดย|เขียน|แต่งโดย|แต่ง)\s*[:：,]?\s*/i, '');
    seg = seg.replace(/[\s\/:;=,]+(?:เขียนโดย|ผู้แต่ง|ผู้เขียน|แต่งโดย|เขียน|เรื่อง|แต่ง)\s*$/i, '');
    seg = seg.replace(/\((?:เรื่อง|ผู้แต่ง|ผู้เขียน|เขียน|แต่ง)\)/i, '');
    seg = seg.replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();

    if (!seg) continue;

    if (seg.includes(' และ ') || seg.includes(' และ')) {
      const parts = seg.split(/\s*และ\s*/).map(a => a.trim()).filter(Boolean);
      if (parts.length > 1) {
        const firsts = parts[0].split(',').map(a => a.trim()).filter(Boolean);
        parsedAuthors.push(...firsts, ...parts.slice(1));
      } else {
        parsedAuthors.push(seg);
      }
    } else if (seg.includes(',')) {
      const parts = seg.split(',').map(a => a.trim()).filter(Boolean);
      if (parts.length === 2 && !/[ก-ฮ]/.test(parts[0]) && !/[ก-ฮ]/.test(parts[1]) && parts[1].length <= 15) {
        parsedAuthors.push(`${parts[0]}, ${parts[1]}`);
      } else {
        parsedAuthors.push(...parts);
      }
    } else {
      parsedAuthors.push(seg);
    }
  }

  const cleanAuthors = parsedAuthors.map(a => {
    let cl = a.replace(/^(?:เรื่อง|ผู้แต่ง|ผู้เขียน|เขียนโดย|เขียน|แต่งโดย|แต่ง)\s*[:：,]?\s*/i, '');
    cl = cl.replace(/[\s\/:;=,]+(?:เขียนโดย|ผู้แต่ง|ผู้เขียน|แต่งโดย|เขียน|เรื่อง|แต่ง)\s*$/i, '');
    cl = cl.replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();
    cl = cl.replace(/\.+$/, '').trim();
    cl = cl.replace(/\bco\b/i, 'Co');
    return cl;
  }).filter(Boolean);

  if (cleanAuthors.length === 0) {
    if (authorPersonal) {
      const cleanA = authorPersonal.replace(/\.+$/, '').trim();
      return `${cleanA}.`;
    }
    return 'ไม่ระบุผู้แต่ง.';
  }

  const N = cleanAuthors.length;
  if (N === 1) {
    const a = cleanAuthors[0];
    return a.endsWith('.') ? a : `${a}.`;
  }
  if (N === 2) {
    return `${cleanAuthors[0]} และ${cleanAuthors[1]}.`;
  }
  if (N === 3) {
    return `${cleanAuthors[0]}, ${cleanAuthors[1]} และ${cleanAuthors[2]}.`;
  }
  return `${cleanAuthors[0]} [และคนอื่นๆ ${N - 1} คน].`;
};

export const formatMarc246Subfields = (val: string): string => {
  if (!val || val === '-' || val.trim() === '') return '-';
  const clean = val
    .replace(/\$a/g, '')
    .replace(/:\$b/g, ' : ')
    .replace(/\$b/g, ' ')
    .replace(/[\s\/:;=,]+$/, '')
    .replace(/^[\s\/:;=,]+/, '')
    .trim();
  if (!clean) return '-';
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const pA = parts[0].trim();
    const pB = parts.slice(1).join(':').trim();
    return `${pA} : ${pB}`;
  }
  return clean;
};

export const formatCleanMarc245Title = (rawA: string, rawB: string, raw246: string): { formatted245a: string, formatted245b: string } => {
  let mainTitle = (rawA || '').trim();
  let subtitle = (rawB || '').trim();
  let engTitle = (raw246 || '').trim();

  // 1. Remove responsibility slash (/ ...) from mainTitle
  mainTitle = mainTitle.replace(/\s*\/\s*.*$/, '').trim();

  // 2. Check if mainTitle contains repeated pattern "X : X" or "X = Y : X = Y"
  if (mainTitle.includes(' : ')) {
    const colonParts = mainTitle.split(' : ').map(p => p.trim()).filter(Boolean);
    if (colonParts.length >= 2 && colonParts[0].toLowerCase() === colonParts[1].toLowerCase()) {
      mainTitle = colonParts[0];
    } else if (colonParts.length === 3 && colonParts[0] === colonParts[1]) {
      mainTitle = colonParts[0];
      if (!engTitle) engTitle = colonParts[2];
    } else if (!subtitle && colonParts.length >= 2) {
      mainTitle = colonParts[0];
      subtitle = colonParts.slice(1).join(' : ');
    }
  }

  // 3. Check if mainTitle contains " = "
  if (mainTitle.includes(' = ')) {
    const eqParts = mainTitle.split(' = ').map(p => p.trim()).filter(Boolean);
    if (eqParts.length >= 2) {
      mainTitle = eqParts[0];
      if (!engTitle) {
        engTitle = eqParts.slice(1).join(' = ');
      }
    }
  }

  // 4. Check if subtitle contains " = "
  if (subtitle.includes(' = ')) {
    const eqParts = subtitle.split(' = ').map(p => p.trim()).filter(Boolean);
    if (eqParts.length >= 2) {
      subtitle = eqParts[0];
      if (!engTitle) {
        engTitle = eqParts.slice(1).join(' = ');
      }
    }
  }

  const cleanA = mainTitle.replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();
  let cleanB = subtitle.replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();
  
  // Format clean display for 246 parallel title
  let clean246Display = formatMarc246Subfields(engTitle);
  if (clean246Display === '-') clean246Display = '';

  // 5. De-duplicate subtitle if cleanA already contains colon or if cleanA contains cleanB
  if (cleanB === cleanA || cleanB === '-' || cleanB.toLowerCase() === cleanA.toLowerCase()) {
    cleanB = '';
  }
  if (cleanB && (cleanA.includes(':') || cleanA.toLowerCase().includes(cleanB.toLowerCase()))) {
    cleanB = '';
  }

  // 6. De-duplicate 246 English title
  if (clean246Display === cleanA || clean246Display === cleanB || clean246Display.toLowerCase() === cleanA.toLowerCase()) {
    clean246Display = '';
  }

  const hasB = Boolean(cleanB);
  const has246 = Boolean(clean246Display);

  let formatted245a = cleanA;
  if (hasB && has246) {
    formatted245a = `${cleanA} : ${cleanB} = ${clean246Display}`;
  } else if (hasB) {
    formatted245a = `${cleanA} : ${cleanB}`;
  } else if (has246) {
    formatted245a = `${cleanA} = ${clean246Display}`;
  } else {
    formatted245a = cleanA;
  }

  const formatted245b = has246 ? clean246Display : (hasB ? cleanB : '-');

  return { formatted245a, formatted245b };
};

export function formatAccessionNo(acc?: string | number | null): string {
  if (acc === null || acc === undefined || acc === '-' || acc === '') return '-';
  const clean = String(acc).trim();
  if (!clean || clean === '-') return '-';
  if (/^[0-9]+$/.test(clean)) {
    return clean.padStart(10, '0');
  }
  if (/^b[0-9]+$/i.test(clean)) {
    const num = clean.slice(1);
    return num.padStart(10, '0');
  }
  return clean;
}

export function extractVolumeFromTitle(title?: string, subtitle?: string, extra?: string): string {
  const thaiToArabic: Record<string, string> = {
    '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
    '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
  };
  const normalize = (str?: string) => String(str || '').replace(/[๐-๙]/g, d => thaiToArabic[d] || d).trim();

  const normTitle = normalize(title);
  const normSub = normalize(subtitle);
  const normExtra = normalize(extra);
  const fullText = `${normTitle} ${normSub} ${normExtra}`.trim();
  if (!fullText) return '-';

  // 1. Explicit keyword matches (เล่ม, เล่มที่, vol, volume, part, ภาค, ตอน, book)
  const explicitPatterns = [
    /(?:เล่มที่|เล่ม\s*ที่|เล่ม|ล\.)\s*([0-9]+)/i,
    /(?:vol(?:ume)?\.?|v\.)\s*([0-9]+)/i,
    /(?:part|pt\.)\s*([0-9]+)/i,
    /(?:ภาคที่|ภาค|ตอนที่|ตอน)\s*([0-9]+)/i,
    /(?:book|bk\.)\s*([0-9]+)/i
  ];

  for (const regex of explicitPatterns) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > 0 && num < 1000) return String(num);
    }
  }

  // 2. Trailing number at the end of the main title (before ':', '=', '/', or end of title)
  // e.g. 'ปีศาจตัวนั้น คือฉันเอง 2 : ไม่มีใครจัดการปีศาจในใจเราได้นอกจากตัวเราเอง' -> 2
  const mainPart = normTitle.split(/[:=\/]/)[0].trim();
  const trailingNumMatch = mainPart.match(/^(?:.*[^\d\s])\s+([0-9]{1,3})\s*$/);
  if (trailingNumMatch && trailingNumMatch[1]) {
    const num = parseInt(trailingNumMatch[1], 10);
    // Exclude 4-digit years or excessively large numbers
    if (num > 0 && num < 500) {
      return String(num);
    }
  }

  // 3. Parenthesized trailing number: e.g. 'ชื่อเรื่อง (2)'
  const parenMatch = mainPart.match(/\(([0-9]{1,3})\)\s*$/);
  if (parenMatch && parenMatch[1]) {
    const num = parseInt(parenMatch[1], 10);
    if (num > 0 && num < 500) {
      return String(num);
    }
  }

  return '-';
}

export const normalizeIsbn = (raw?: string): string => {
  if (!raw) return '';
  const clean = String(raw).replace(/[^0-9X]/gi, '').toUpperCase();
  return clean.length >= 9 ? clean : '';
};

export const normalizeIssn = (raw?: string): string => {
  if (!raw) return '';
  const clean = String(raw).replace(/[^0-9X]/gi, '').toUpperCase();
  return clean.length >= 7 ? clean : '';
};

export const getStandardIsbnKey = (raw?: string): string => {
  const clean = normalizeIsbn(raw);
  if (!clean) return '';
  if (clean.length === 10) {
    return '978' + clean.substring(0, 9);
  }
  if (clean.length === 13) {
    return clean.substring(0, 12);
  }
  return clean;
};

export const isSameIsbn = (isbn1?: string, isbn2?: string): boolean => {
  const k1 = getStandardIsbnKey(isbn1);
  const k2 = getStandardIsbnKey(isbn2);
  if (!k1 || !k2) return false;
  return k1 === k2;
};

export const isSameBookForCopy = (
  r1: { isbn?: string; issn?: string; issn_022?: string; title_245a?: string; title?: string },
  r2: { isbn?: string; issn?: string; issn_022?: string; title_245a?: string; title?: string }
): boolean => {
  if (!r1 || !r2) return false;

  const isbn1 = normalizeIsbn(r1.isbn);
  const isbn2 = normalizeIsbn(r2.isbn);

  // 1. Primary: Match by 020 ISBN
  if (isbn1 && isbn2) {
    return isSameIsbn(isbn1, isbn2);
  }

  // 2. Primary for Serials/Periodicals: Match by 022 ISSN
  const issn1 = normalizeIssn(r1.issn_022 || r1.issn);
  const issn2 = normalizeIssn(r2.issn_022 || r2.issn);
  if (issn1 && issn2) {
    return issn1 === issn2;
  }

  // If one has ISBN/ISSN and other has a different ISBN/ISSN, they NEVER match as copies
  if ((isbn1 && isbn2 && !isSameIsbn(isbn1, isbn2)) || (issn1 && issn2 && issn1 !== issn2)) {
    return false;
  }

  // 3. Fallback ONLY when neither book has ISBN nor ISSN
  if (!isbn1 && !isbn2 && !issn1 && !issn2) {
    const t1 = (r1.title_245a || r1.title || '').replace(/[:=;/\\.,\s]/g, '').toLowerCase();
    const t2 = (r2.title_245a || r2.title || '').replace(/[:=;/\\.,\s]/g, '').toLowerCase();
    if (t1 && t2 && t1.length >= 3 && t1 === t2) {
      return true;
    }
  }

  return false;
};

export function calculateCopyNumber(
  record: Marc21Record,
  allRecords: Marc21Record[] = [],
  libraryBooks: any[] = []
): { copyNumber: number; totalCopies: number } {
  if (!record) return { copyNumber: 1, totalCopies: 1 };

  const getAccNum = (acc?: string): number => {
    if (!acc) return 0;
    const digits = String(acc).replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };

  const copyMap = new Map<string, { id: string; accNo: string; num: number; date?: string }>();

  // 1. Scan matching items from allRecords (MARC 21 records)
  allRecords.forEach(r => {
    if (isSameBookForCopy(record, r) || r.id === record.id) {
      const rawAcc = r.accession_no || r.id;
      const formatted = formatAccessionNo(rawAcc);
      const key = formatted || r.id;
      copyMap.set(key, {
        id: r.id,
        accNo: formatted || r.accession_no || '',
        num: getAccNum(r.accession_no),
        date: r.date || ''
      });
    }
  });

  // 2. Scan matching items from libraryBooks (if provided)
  if (Array.isArray(libraryBooks)) {
    libraryBooks.forEach(b => {
      if (isSameBookForCopy(record, b)) {
        if (Array.isArray(b.copies_list) && b.copies_list.length > 0) {
          b.copies_list.forEach((c: any) => {
            const rawAcc = c.accession_no || c.barcode || c.id || '';
            const formatted = formatAccessionNo(rawAcc);
            const key = formatted || (c.id || b.id);
            if (!copyMap.has(key)) {
              copyMap.set(key, {
                id: c.id || b.id,
                accNo: formatted || rawAcc,
                num: getAccNum(rawAcc),
                date: c.created_at || b.created_at || ''
              });
            }
          });
        } else {
          const rawAcc = b.accession_no || b.barcode || b.id || '';
          const formatted = formatAccessionNo(rawAcc);
          const key = formatted || b.id;
          if (!copyMap.has(key)) {
            copyMap.set(key, {
              id: b.id,
              accNo: formatted || rawAcc,
              num: getAccNum(rawAcc),
              date: b.created_at || ''
            });
          }
        }
      }
    });
  }

  // Ensure current record is definitely included in copyMap
  const currRawAcc = record.accession_no || record.id;
  const currFormatted = formatAccessionNo(currRawAcc);
  const currKey = currFormatted || record.id;
  if (!copyMap.has(currKey)) {
    copyMap.set(currKey, {
      id: record.id,
      accNo: currFormatted || record.accession_no || '',
      num: getAccNum(record.accession_no),
      date: record.date || ''
    });
  }

  // Sort copies by accession number ascending (earliest accession number = ฉบับที่ 1, next = ฉบับที่ 2, etc.)
  const sortedCopies = Array.from(copyMap.values()).sort((a, b) => {
    if (a.num > 0 && b.num > 0 && a.num !== b.num) return a.num - b.num;
    if (a.date && b.date && a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.accNo || '').localeCompare(b.accNo || '');
  });

  const currNum = getAccNum(record.accession_no);
  const foundIdx = sortedCopies.findIndex(c => 
    c.id === record.id || 
    (currFormatted && c.accNo && formatAccessionNo(c.accNo) === currFormatted) ||
    (currNum > 0 && c.num === currNum)
  );

  const copyNumber = foundIdx >= 0 ? foundIdx + 1 : 1;
  const totalCopies = Math.max(sortedCopies.length, 1);

  return { copyNumber, totalCopies };
}

export function getBookCopyGroupKey(r: { isbn?: string; issn?: string; issn_022?: string; title_245a?: string; title?: string }): string {
  if (!r) return '';
  const isbn = normalizeIsbn(r.isbn);
  if (isbn) {
    const key = getStandardIsbnKey(isbn);
    if (key) return `isbn:${key}`;
  }
  const issn = normalizeIssn(r.issn_022 || r.issn);
  if (issn) {
    return `issn:${issn}`;
  }
  const t = (r.title_245a || r.title || '').replace(/[:=;/\\.,\s]/g, '').toLowerCase();
  if (t && t.length >= 3) {
    return `title:${t}`;
  }
  return '';
}

export function buildAllCopyNumbersMap(
  records: Marc21Record[] = [],
  libraryBooks: any[] = []
): Map<string, { copyNumber: number; totalCopies: number }> {
  const result = new Map<string, { copyNumber: number; totalCopies: number }>();
  if (!records || records.length === 0) return result;

  const getAccNum = (acc?: string): number => {
    if (!acc) return 0;
    const digits = String(acc).replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };

  type CopyEntry = { id: string; accNo: string; num: number; date?: string; recordId?: string };
  const groupMap = new Map<string, Map<string, CopyEntry>>();

  // 1. Group records in single O(N) pass
  records.forEach(r => {
    const groupKey = getBookCopyGroupKey(r) || `rec_single_${r.id}`;
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, new Map());
    }
    const bucket = groupMap.get(groupKey)!;
    const rawAcc = r.accession_no || r.id;
    const formatted = formatAccessionNo(rawAcc);
    const key = formatted || r.id;
    bucket.set(key, {
      id: r.id,
      accNo: formatted || r.accession_no || '',
      num: getAccNum(r.accession_no),
      date: r.date || '',
      recordId: r.id
    });
  });

  // 2. Add libraryBooks to matching groups in single O(N) pass
  if (Array.isArray(libraryBooks) && libraryBooks.length > 0) {
    libraryBooks.forEach(b => {
      const groupKey = getBookCopyGroupKey(b);
      if (groupKey && groupMap.has(groupKey)) {
        const bucket = groupMap.get(groupKey)!;
        if (Array.isArray(b.copies_list) && b.copies_list.length > 0) {
          b.copies_list.forEach((c: any) => {
            const rawAcc = c.accession_no || c.barcode || c.id || '';
            const formatted = formatAccessionNo(rawAcc);
            const key = formatted || (c.id || b.id);
            if (!bucket.has(key)) {
              bucket.set(key, {
                id: c.id || b.id,
                accNo: formatted || rawAcc,
                num: getAccNum(rawAcc),
                date: c.created_at || b.created_at || ''
              });
            }
          });
        } else {
          const rawAcc = b.accession_no || b.barcode || b.id || '';
          const formatted = formatAccessionNo(rawAcc);
          const key = formatted || b.id;
          if (!bucket.has(key)) {
            bucket.set(key, {
              id: b.id,
              accNo: formatted || rawAcc,
              num: getAccNum(rawAcc),
              date: b.created_at || ''
            });
          }
        }
      }
    });
  }

  // 3. For each group, sort once and assign copyNumber & totalCopies
  groupMap.forEach(bucket => {
    const sortedCopies = Array.from(bucket.values()).sort((a, b) => {
      if (a.num > 0 && b.num > 0 && a.num !== b.num) return a.num - b.num;
      if (a.date && b.date && a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.accNo || '').localeCompare(b.accNo || '');
    });
    const totalCopies = Math.max(sortedCopies.length, 1);

    sortedCopies.forEach((item, idx) => {
      if (item.recordId) {
        result.set(item.recordId, { copyNumber: idx + 1, totalCopies });
      }
    });
  });

  // Ensure any records missing get safe default
  records.forEach(r => {
    if (!result.has(r.id)) {
      result.set(r.id, { copyNumber: 1, totalCopies: 1 });
    }
  });

  return result;
}

export const TOP_POPULAR_SUBJECTS = [
  'ทั่วไป',
  'วรรณกรรมสำหรับเด็ก',
  'การ์ตูนความรู้',
  'จิตวิทยา',
  'การเงินส่วนบุคคล'
];

interface Marc21GeneratorProps {
  libraryBooks?: any[];
  onBookAddedToLibrary?: () => void;
  openBarcodeScanner?: () => void;
}

export const MARC21_COLUMNS = [
  { key: 'date', label: 'วันที่', tag: 'DATE', width: 'w-28' },
  { key: 'col1', label: 'คอลัมน์1', tag: 'NOTE', width: 'w-24' },
  { key: 'accession_no', label: 'เลขทะเบียน', tag: 'ACC', width: 'w-32' },
  { key: 'isbn', label: '020 ISBN', tag: '020', width: 'w-36' },
  { key: 'author_personal', label: '100 ผู้แต่ง (ชื่อบุคคล)', tag: '100', width: 'w-48' },
  { key: 'author_corporate', label: '110 ผู้แต่ง (ชื่อนิติบุคคล)', tag: '110', width: 'w-40' },
  { key: 'title_245a', label: '245 $a : $b = 246 $a', tag: '245 $a', width: 'w-72' },
  { key: 'title_245b', label: '246 (Ind1=3, Ind2=1) $a :$b', tag: '246', width: 'w-64' },
  { key: 'responsibility_245c', label: '245 $c ส่วนแจ้งความรับผิดชอบ', tag: '245 $c', width: 'w-56' },
  { key: 'ddc_082a', label: '082 $a เลขหมู่หนังสือ', tag: '082 $a', width: 'w-28' },
  { key: 'cutter_082b', label: '082 $b เลขประจำหนังสือ', tag: '082 $b', width: 'w-28' },
  { key: 'pub_place', label: '$a สถานที่พิมพ์', tag: '260 $a', width: 'w-32' },
  { key: 'publisher', label: '$b สำนักพิมพ์', tag: '260 $b', width: 'w-44' },
  { key: 'pub_year', label: '260 $c ปีที่พิมพ์', tag: '260 $c', width: 'w-28' },
  { key: 'pages_300a', label: '300 $a จำนวนหน้า', tag: '300 $a', width: 'w-28' },
  { key: 'illustration_300b', label: '300 $b ภาพประกอบ', tag: '300 $b', width: 'w-28' },
  { key: 'subject_650a', label: '650 $a หัวเรื่อง 1', tag: '650 $a', width: 'w-52' },
  { key: 'subject_650_2', label: '650 $a หัวเรื่องที่ 2', tag: '650 $a', width: 'w-52' },
  { key: 'subject_650_3', label: '650 $a หัวเรื่องที่ 3', tag: '650 $a', width: 'w-52' },
  { key: 'subject_650_4', label: '650 $a หัวเรื่องที่ 4', tag: '650 $a', width: 'w-52' },
  { key: 'subject_650_5', label: '650 $a หัวเรื่องที่ 5', tag: '650 $a', width: 'w-52' },
  { key: 'copies', label: 'จำนวนเล่ม', tag: 'QTY', width: 'w-24' },
  { key: 'summary_520', label: '520 เรื่องย่อ.', tag: '520', width: 'w-80' },
  { key: 'edition_250', label: '250 พิมพ์ครั้งที่', tag: '250', width: 'w-32' },
  { key: 'price_541', label: '541 ราคา', tag: '541', width: 'w-28' },
  { key: 'series_490', label: '490 ชุด', tag: '490', width: 'w-40' },
  { key: 'added_entry_700', label: '700 ผู้แปล/ผู้แต่งร่วม (Tag 700)', tag: '700', width: 'w-48' },
  { key: 'acquisition_source', label: 'แหล่งที่ได้รับ', tag: 'SRC', width: 'w-32' },
  { key: 'col2', label: 'คอลัมน์2', tag: 'EXTRA', width: 'w-24' },
  { key: 'source_type', label: 'ที่มา', tag: 'FUND', width: 'w-28' },
  { key: 'storage_location', label: 'สถานที่จัดเก็บ', tag: 'LOC', width: 'w-36' },
  { key: 'status', label: 'สถานะ', tag: 'STAT', width: 'w-28' },
  { key: 'col3', label: 'คอลัมน์3', tag: 'EXTRA2', width: 'w-24' },
  
  // Extended MARC 21 Tags (All remaining MARC21 fields after Column 3)
  { key: 'leader_000', label: 'Leader ข้อมูลส่วนหัวระเบียน', tag: '000 LDR', width: 'w-56' },
  { key: 'control_001', label: '001 เลขควบคุม (Bib ID)', tag: '001', width: 'w-32' },
  { key: 'control_003', label: '003 รหัสหน่วยงานควบคุม', tag: '003', width: 'w-28' },
  { key: 'trans_005', label: '005 วันที่ปรับปรุงระเบียน', tag: '005', width: 'w-44' },
  { key: 'fixed_008', label: '008 ข้อมูลคงที่ทั่วไป', tag: '008', width: 'w-64' },
  { key: 'issn_022', label: '022 ISSN', tag: '022', width: 'w-32' },
  { key: 'cat_source_040', label: '040 แหล่งลงรายการ', tag: '040', width: 'w-36' },
  { key: 'language_041', label: '041 รหัสภาษา', tag: '041', width: 'w-28' },
  { key: 'dimensions_300c', label: '300 $c ขนาดเล่ม', tag: '300 $c', width: 'w-28' },
  { key: 'note_general_500', label: '500 หมายเหตุทั่วไป', tag: '500', width: 'w-56' },
  { key: 'note_bib_504', label: '504 หมายเหตุบรรณานุกรม', tag: '504', width: 'w-48' },
  { key: 'note_contents_505', label: '505 สารบัญเนื้อหาในเล่ม', tag: '505', width: 'w-64' },
  { key: 'subject_person_600', label: '600 หัวเรื่อง - ชื่อบุคคล', tag: '600', width: 'w-48' },
  { key: 'subject_corp_610', label: '610 หัวเรื่อง - นิติบุคคล', tag: '610', width: 'w-48' },
  { key: 'subject_uniform_630', label: '630 หัวเรื่อง - ชื่อแบบฉบับ/กลุ่มผู้อ่าน', tag: '630', width: 'w-48' },
  { key: 'subject_geo_651', label: '651 หัวเรื่อง - ชื่อภูมิศาสตร์', tag: '651', width: 'w-48' },
  { key: 'added_corp_710', label: '710 ผู้แต่งร่วม - นิติบุคคล', tag: '710', width: 'w-48' },
  { key: 'added_title_740', label: '740 ชื่อเรื่องเกี่ยวข้อง', tag: '740', width: 'w-56' },
  { key: 'series_uniform_830', label: '830 ชื่อชุดแบบฉบับ', tag: '830', width: 'w-56' },
  { key: 'electronic_856', label: '856 $u ลิงก์รูปปก/ไฟล์', tag: '856 $u', width: 'w-64' },
  { key: 'local_907', label: '907 เลขระเบียนท้องถิ่น', tag: '907', width: 'w-32' },
];

// Primary columns from first column (date วันที่) up to Status (STAT สถานะ) for copying
export const PRIMARY_COPY_COLUMNS = MARC21_COLUMNS.slice(0, MARC21_COLUMNS.findIndex(c => c.key === 'status') + 1);

export const DEFAULT_STORAGE_LOCATIONS = [
  'สำหรับเด็ก',
  'สำหรับเด็ก (ภาษาฯ)',
  'สำหรับเด็ก (ศาสนา)',
  'เยาวชน',
  'การ์ตูน วิทย์/คณิต',
  'การ์ตูน สังคม',
  'การ์ตูน ความรู้ทั่วไป',
  'การ์ตูน ภาษา/วรรณกรรม',
  'แบบเรียน',
  'อ้างอิง/Ref',
  'หมวด 000 เบ็ดเตล็ด',
  'หมวด 100 ปรัชญาและจิตวิทยา',
  'หมวด 200 ศาสนา',
  'หมวด 300 สังคมศาสตร์',
  'หมวด 400 ภาษาศาสตร์',
  'หมวด 500 วิทยาศาสตร์',
  'หมวด 600 วิทยาศาสตร์ประยุกต์และเทคโนโลยี',
  'หมวด 700 ศิลปกรรมและการบันเทิง',
  'หมวด 800 วรรณคดี',
  'หมวด 900 ประวัติศาสตร์และภูมิศาสตร์',
  'หมวด 100',
  'หมวด ทั่วไป',
  'นวนิยาย',
  'เรื่องสั้น',
  'มุมหนังสือใหม่',
  'ห้องสมุดมารวย',
  'ชั้นหนังสือทั่วไป'
];

export const DEFAULT_SUBJECT_HEADINGS = [
  'ทั่วไป',
  'การดำเนินชีวิต',
  'การดำเนินชีวิต --วรรณกรรมสำหรับเด็ก',
  'จิตวิทยา',
  'จิตวิทยาเด็ก',
  'การพัฒนาตนเอง',
  'การเงินส่วนบุคคล',
  'การบริหารธุรกิจ',
  'วรรณกรรมสำหรับเด็ก',
  'นิทานภาพ',
  'การ์ตูนความรู้',
  'การแต่งกาย',
  'อาหารและโภชนาการ',
  'สุขภาพและการดูแลตนเอง',
  'วิทยาศาสตร์',
  'เทคโนโลยี',
  'คอมพิวเตอร์',
  'ประวัติศาสตร์',
  'ชีวประวัติ',
  'ชีวประวัติ--สำหรับเด็ก.',
  'ปรัชญาและศาสนา',
  'ภาษาและการสื่อสาร',
  'นวนิยาย',
  'เรื่องสั้น',
  'การศึกษาและการเรียนรู้',
  'การแก้ปัญหาในเด็ก.'
];

export const Marc21Generator: React.FC<Marc21GeneratorProps> = ({ libraryBooks = [], onBookAddedToLibrary }) => {
  const [records, setRecords] = useState<Marc21Record[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [batchQueries, setBatchQueries] = useState('');
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isCutterTableOpen, setIsCutterTableOpen] = useState(false);
  const [isDdcModalOpen, setIsDdcModalOpen] = useState(false);
  const [testAuthor, setTestAuthor] = useState('โสรยา');
  const [testTitle, setTestTitle] = useState('การทดลอง');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<Marc21Record | null>(null);
  const [editModalTab, setEditModalTab] = useState<'card' | 'fields'>('card');
  const [copiedCardInModal, setCopiedCardInModal] = useState<boolean>(false);
  const [isFetchingAiCover, setIsFetchingAiCover] = useState(false);
  const [lastCopiedRow, setLastCopiedRow] = useState<Marc21Record | null>(null);
  const [copyIncludeHeaders, setCopyIncludeHeaders] = useState<boolean>(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<'selected' | Marc21Record | null>(null);
  const [startAccNum, setStartAccNum] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('iabs_start_acc_num');
      return saved ? parseInt(saved, 10) || 2613 : 2613;
    } catch {
      return 2613;
    }
  });
  const [inputStartAcc, setInputStartAcc] = useState<string>(() => String(startAccNum).padStart(10, '0'));

  useEffect(() => {
    setInputStartAcc(String(startAccNum).padStart(10, '0'));
    try {
      localStorage.setItem('iabs_start_acc_num', String(startAccNum));
    } catch {}
  }, [startAccNum]);

  // Supabase Cloud Realtime Sync States (Cross-device real-time sync)
  const [isCloudRealtimeConnected, setIsCloudRealtimeConnected] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [hasCloudTable, setHasCloudTable] = useState<boolean | null>(null);
  const [hasRlsError, setHasRlsError] = useState(false);
  const [cloudSqlTab, setCloudSqlTab] = useState<'columns' | 'rls' | 'all'>('columns');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const [isCloudSetupModalOpen, setIsCloudSetupModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);
  const [copiedColSql, setCopiedColSql] = useState(false);


  // Dedicated UC-TAL ThaiLIS (https://uc.thailis.or.th) Box Search States
  const [uctalKeyword, setUctalKeyword] = useState('');
  const [uctalRegion, setUctalRegion] = useState('');
  const [uctalResults, setUctalResults] = useState<any[]>([]);
  const [isUctalLoading, setIsUctalLoading] = useState(false);
  const [isUctalPanelOpen, setIsUctalPanelOpen] = useState(false);
  const [uctalTotalFound, setUctalTotalFound] = useState<number | null>(null);
  const [viewingMarcDetail, setViewingMarcDetail] = useState<any | null>(null);
  const [selectedHoldingLib, setSelectedHoldingLib] = useState<any | null>(null);

  // Cutter Modal Extended Tab & System Authors States
  const [cutterModalTab, setCutterModalTab] = useState<'system_authors' | 'calculator'>('system_authors');
  const [cutterSearchTerm, setCutterSearchTerm] = useState('');
  const [cutterTypeFilter, setCutterTypeFilter] = useState<'all' | 'personal' | 'corporate'>('all');
  const [dbBooksAuthors, setDbBooksAuthors] = useState<SystemAuthorCutterItem[]>([]);
  const [isLoadingDbAuthors, setIsLoadingDbAuthors] = useState(false);

  // AI Book Summary Search States (Tag 520 เรื่องย่อ)
  const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false);
  const [rowSummaryLoadingId, setRowSummaryLoadingId] = useState<string | null>(null);

  // Subject Headings & DDC Classification Modal States (Tag 650 & Tag 082 $a)
  const [isSubjectHeadingsModalOpen, setIsSubjectHeadingsModalOpen] = useState(false);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState<string>('all');
  const [dbBooksSubjects, setDbBooksSubjects] = useState<SystemSubjectDdcItem[]>([]);
  const [isLoadingDbSubjects, setIsLoadingDbSubjects] = useState(false);

  // Load and assemble all subject headings and their DDCs from database when modal opens
  useEffect(() => {
    if (!isSubjectHeadingsModalOpen) return;
    let isMounted = true;
    const fetchDbSubjects = async () => {
      setIsLoadingDbSubjects(true);
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .limit(3000);
        if (!error && Array.isArray(data) && isMounted) {
          const map = new Map<string, { ddcCounts: Map<string, number>; count: number; titles: Set<string>; cat?: string }>();
          data.forEach((b: any) => {
            const { subjects, ddc, title, category } = extractAllSubjectsAndDdc(b);
            subjects.forEach((cleanSubj: string) => {
              if (!map.has(cleanSubj)) {
                map.set(cleanSubj, {
                  ddcCounts: new Map(),
                  count: 0,
                  titles: new Set(),
                  cat: category || b.category || undefined
                });
              }
              const entry = map.get(cleanSubj)!;
              entry.count++;
              if (title && entry.titles.size < 5) {
                entry.titles.add(title);
              }
              if (ddc) {
                entry.ddcCounts.set(ddc, (entry.ddcCounts.get(ddc) || 0) + 1);
              }
            });
          });

          const items: SystemSubjectDdcItem[] = Array.from(map.entries()).map(([subj, val], idx) => {
            const ddcArr = Array.from(val.ddcCounts.entries()).map(([ddc, count]) => ({ ddc, count }));
            ddcArr.sort((a, b) => b.count - a.count);
            const primaryDdc = ddcArr[0]?.ddc || '-';
            return {
              id: `db_subj_${idx}`,
              subject: subj,
              primaryDdc,
              allDdcs: ddcArr,
              category: val.cat || getDdcCategoryName(primaryDdc),
              bookCount: val.count,
              sampleTitles: Array.from(val.titles),
              source: 'ฐานข้อมูลห้องสมุด'
            };
          });
          setDbBooksSubjects(items);
        }
      } catch (err) {
        console.warn('DB subjects fetch note:', err);
      } finally {
        if (isMounted) setIsLoadingDbSubjects(false);
      }
    };
    fetchDbSubjects();
    return () => { isMounted = false; };
  }, [isSubjectHeadingsModalOpen]);

  // Load and assemble all system authors from database and current session
  useEffect(() => {
    if (!isCutterTableOpen) return;
    let isMounted = true;
    const fetchDbAuthors = async () => {
      setIsLoadingDbAuthors(true);
      try {
        const { data, error } = await supabase
          .from('books')
          .select('author, co_authors, call_number, title')
          .limit(3000);
        if (!error && Array.isArray(data) && isMounted) {
          const map = new Map<string, { type: 'personal' | 'corporate'; cutter: string; count: number }>();
          data.forEach((b: any) => {
            const rawAuthor = (b.author || '').trim();
            if (rawAuthor && rawAuthor !== '-') {
              const clean = rawAuthor.replace(/\.$/, '').trim();
              const isCorp = isCorporateAuthor(clean);
              let extracted = '';
              if (b.call_number) {
                const parts = b.call_number.split(/\s+/);
                const cutterPart = parts.find((p: string) => /^[ก-ฮa-zA-Z]\d+/.test(p));
                if (cutterPart) {
                  extracted = getPureAuthorCutter(cutterPart, clean);
                }
              }
              if (!extracted) {
                extracted = getPureAuthorCutter('', clean);
              }
              if (map.has(clean)) {
                const prev = map.get(clean)!;
                prev.count++;
                if ((!prev.cutter || prev.cutter === '-') && extracted) prev.cutter = extracted;
              } else {
                map.set(clean, {
                  type: isCorp ? 'corporate' : 'personal',
                  cutter: extracted,
                  count: 1
                });
              }
            }
          });

          const items: SystemAuthorCutterItem[] = Array.from(map.entries()).map(([name, val], idx) => ({
            id: `db_auth_${idx}`,
            authorName: name,
            type: val.type,
            authorCutter: val.cutter,
            bookCount: val.count,
            source: 'ฐานข้อมูลห้องสมุด'
          }));
          setDbBooksAuthors(items);
        }
      } catch (err) {
        console.warn('DB authors fetch note:', err);
      } finally {
        if (isMounted) setIsLoadingDbAuthors(false);
      }
    };
    fetchDbAuthors();
    return () => { isMounted = false; };
  }, [isCutterTableOpen]);

  // Memoized aggregation of all system authors (sorted ก-ฮ, A-Z)
  const allSystemAuthors = React.useMemo(() => {
    const map = new Map<string, SystemAuthorCutterItem>();

    // 1. Curated standard library authors
    STANDARD_LIBRARY_AUTHORS.forEach((s, idx) => {
      map.set(s.authorName, {
        id: `std_${idx}`,
        authorName: s.authorName,
        type: s.type,
        authorCutter: s.authorCutter,
        source: 'มาตรฐานห้องสมุด'
      });
    });

    // 2. Database authors from Supabase
    dbBooksAuthors.forEach(dbA => {
      if (map.has(dbA.authorName)) {
        const existing = map.get(dbA.authorName)!;
        if ((!existing.authorCutter || existing.authorCutter === '-') && dbA.authorCutter) {
          existing.authorCutter = dbA.authorCutter;
        }
        existing.bookCount = (existing.bookCount || 0) + (dbA.bookCount || 1);
      } else {
        map.set(dbA.authorName, dbA);
      }
    });

    // 3. Authors from active session MARC records
    records.forEach(r => {
      // Personal author (Tag 100)
      if (r.author_personal && r.author_personal !== '-') {
        const clean = r.author_personal.replace(/\.$/, '').trim();
        const pureCutter = getPureAuthorCutter(r.cutter_082b, clean);
        if (map.has(clean)) {
          const item = map.get(clean)!;
          if ((!item.authorCutter || item.authorCutter === '-') && pureCutter) {
            item.authorCutter = pureCutter;
          }
        } else {
          map.set(clean, {
            id: `rec_p_${r.id}`,
            authorName: clean,
            type: 'personal',
            authorCutter: pureCutter,
            source: 'ตารางระเบียนปัจจุบัน'
          });
        }
      }

      // Corporate author (Tag 110)
      if (r.author_corporate && r.author_corporate !== '-') {
        const clean = r.author_corporate.replace(/\.$/, '').trim();
        const pureCutter = getPureAuthorCutter(r.cutter_082b, clean);
        if (map.has(clean)) {
          const item = map.get(clean)!;
          item.type = 'corporate';
          if ((!item.authorCutter || item.authorCutter === '-') && pureCutter) {
            item.authorCutter = pureCutter;
          }
        } else {
          map.set(clean, {
            id: `rec_c_${r.id}`,
            authorName: clean,
            type: 'corporate',
            authorCutter: pureCutter,
            source: 'ตารางระเบียนปัจจุบัน'
          });
        }
      }
    });

    // Convert to array and sort alphabetically: Thai collation ก-ฮ, then A-Z
    const list = Array.from(map.values());
    list.sort((a, b) => a.authorName.localeCompare(b.authorName, 'th', { sensitivity: 'base' }));
    return list;
  }, [dbBooksAuthors, records]);

  const filteredSystemAuthors = React.useMemo(() => {
    const q = cutterSearchTerm.trim().toLowerCase();
    return allSystemAuthors.filter(item => {
      const matchSearch = !q ||
        item.authorName.toLowerCase().includes(q) ||
        item.authorCutter.toLowerCase().includes(q);
      const matchType = cutterTypeFilter === 'all' || item.type === cutterTypeFilter;
      return matchSearch && matchType;
    });
  }, [allSystemAuthors, cutterSearchTerm, cutterTypeFilter]);

  // Memoized aggregation of all system subject headings and their DDC classification
  const allSystemSubjects = React.useMemo(() => {
    const map = new Map<string, {
      subject: string;
      ddcCounts: Map<string, number>;
      bookCount: number;
      sampleTitles: Set<string>;
      source: string;
      category?: string;
    }>();

    const addSubjDdc = (
      subjRaw: string,
      ddcRaw?: string,
      titleRaw?: string,
      source = 'ระบบบรรณานุกรม (MARC 21)',
      predefinedCat?: string
    ) => {
      if (!subjRaw) return;
      const s = subjRaw.trim().replace(/[\.\,\:\/]+$/, '').trim();
      if (!s || s === '-' || s === 'ทั่วไป') return;

      let d = (ddcRaw || '').trim().replace(/[\.\,\:\/]+$/, '').trim();
      if (d === '-' || (d === '000' && !s.includes('คอมพิวเตอร์') && !s.includes('ความรู้ทั่วไป'))) {
        d = '';
      }

      if (!map.has(s)) {
        map.set(s, {
          subject: s,
          ddcCounts: new Map(),
          bookCount: 0,
          sampleTitles: new Set(),
          source,
          category: predefinedCat
        });
      }

      const item = map.get(s)!;
      if (titleRaw) {
        item.bookCount++;
        const cleanTitle = titleRaw.trim().replace(/[\.\,\:\/]+$/, '').trim();
        if (cleanTitle && item.sampleTitles.size < 3) {
          item.sampleTitles.add(cleanTitle);
        }
      }
      if (d) {
        item.ddcCounts.set(d, (item.ddcCounts.get(d) || 0) + 1);
      }
    };

    // 1. Curated standard library subject-DDC mappings
    STANDARD_SUBJECT_DDC_MAPPINGS.forEach(std => {
      addSubjDdc(std.subject, std.ddc, undefined, 'มาตรฐานบรรณารักษ์', std.category);
    });

    // 2. Database books subjects
    dbBooksSubjects.forEach(dbS => {
      if (!map.has(dbS.subject)) {
        map.set(dbS.subject, {
          subject: dbS.subject,
          ddcCounts: new Map(dbS.allDdcs.map(x => [x.ddc, x.count])),
          bookCount: dbS.bookCount,
          sampleTitles: new Set(dbS.sampleTitles),
          source: 'ฐานข้อมูลห้องสมุด',
          category: dbS.category
        });
      } else {
        const cur = map.get(dbS.subject)!;
        dbS.allDdcs.forEach(x => {
          cur.ddcCounts.set(x.ddc, (cur.ddcCounts.get(x.ddc) || 0) + x.count);
        });
        cur.bookCount += dbS.bookCount;
        dbS.sampleTitles.forEach(t => {
          if (cur.sampleTitles.size < 3) cur.sampleTitles.add(t);
        });
      }
    });

    // 3. Current active MARC records (including all records from Supabase marc21_records)
    // Comprehensively collects EVERY subject heading from records, even if > 3 subjects per record
    records.forEach(r => {
      const { subjects, ddc, title, category } = extractAllSubjectsAndDdc(r);
      subjects.forEach(subj => {
        addSubjDdc(subj, ddc, title, 'ระบบบรรณานุกรม (MARC 21)', category);
      });
    });

    const list: SystemSubjectDdcItem[] = Array.from(map.values()).map((val, idx) => {
      const ddcArr = Array.from(val.ddcCounts.entries()).map(([ddc, count]) => ({ ddc, count }));
      ddcArr.sort((a, b) => b.count - a.count);
      const primaryDdc = ddcArr[0]?.ddc || '-';
      const category = val.category || getDdcCategoryName(primaryDdc);
      return {
        id: `sys_subj_${idx}`,
        subject: val.subject,
        primaryDdc,
        allDdcs: ddcArr,
        category,
        bookCount: val.bookCount,
        sampleTitles: Array.from(val.sampleTitles),
        source: val.source
      };
    });

    list.sort((a, b) => a.subject.localeCompare(b.subject, 'th', { sensitivity: 'base' }));
    return list;
  }, [dbBooksSubjects, records]);

  const filteredSystemSubjects = React.useMemo(() => {
    const q = subjectSearchTerm.trim().toLowerCase();
    return allSystemSubjects.filter(item => {
      const matchSearch = !q ||
        item.subject.toLowerCase().includes(q) ||
        item.primaryDdc.toLowerCase().includes(q) ||
        item.allDdcs.some(d => d.ddc.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);

      const matchCategory = subjectCategoryFilter === 'all' || (() => {
        if (subjectCategoryFilter === 'children') {
          return item.primaryDdc === 'ด' || item.primaryDdc === 'ย' || item.category.includes('เด็ก') || item.category.includes('เยาวชน');
        }
        return item.primaryDdc.startsWith(subjectCategoryFilter) || item.category.startsWith(subjectCategoryFilter);
      })();

      return matchSearch && matchCategory;
    });
  }, [allSystemSubjects, subjectSearchTerm, subjectCategoryFilter]);

  // Dynamic available subject headings collected across all records, search results, and standard list
  const allAvailableSubjects = React.useMemo(() => {
    const set = new Set<string>(DEFAULT_SUBJECT_HEADINGS);
    
    // 1. Collect from all system subjects (already aggregated from db, records, and standards)
    allSystemSubjects.forEach(item => set.add(item.subject));

    // 2. Collect from current table records using extractAllSubjectsAndDdc
    records.forEach(r => {
      const { subjects } = extractAllSubjectsAndDdc(r);
      subjects.forEach(s => set.add(s));
    });

    // 2. Collect from searched results (UC-TAL / Live search)
    uctalResults.forEach(item => {
      if (item.subject && item.subject !== '-' && item.subject !== 'ทั่วไป') set.add(item.subject.trim());
      if (item.subject_650a && item.subject_650a !== '-' && item.subject_650a !== 'ทั่วไป') set.add(item.subject_650a.trim());
      if (Array.isArray(item.all650Subjects)) {
        item.all650Subjects.forEach((s: string) => {
          if (s && s !== '-' && s !== 'ทั่วไป') set.add(s.trim());
        });
      }
      if (Array.isArray(item.marcRaw)) {
        item.marcRaw.forEach((tag: any) => {
          if (tag.tagID === '650' || tag.tag === '650') {
            const parsed = parseMarcSubfield(tag.data || '', 'a') || tag.data?.replace(/[\u001f\$][a-z0-9]/g, ' ')?.trim();
            if (parsed && parsed !== '-' && parsed !== 'ทั่วไป') set.add(parsed.replace(/[\.\,\:\/]+$/, '').trim());
          }
        });
      }
    });

    const list = Array.from(set).filter(Boolean);
    list.sort((a, b) => a.localeCompare(b, 'th', { sensitivity: 'base' }));
    return list;
  }, [records, uctalResults]);

  // Dynamic available storage locations collected across all records + standard list
  const allAvailableStorageLocations = React.useMemo(() => {
    const set = new Set<string>(DEFAULT_STORAGE_LOCATIONS);
    records.forEach(r => {
      if (r.storage_location && r.storage_location !== '-') set.add(r.storage_location.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [records]);

  // Dynamic Copy Number calculation for every record in the table based on 020 ISBN or 022 ISSN (O(N) optimized)
  const recordCopyNumberMap = React.useMemo(() => {
    return buildAllCopyNumbersMap(records, libraryBooks);
  }, [records, libraryBooks]);

  // Dynamic suggestions for 700 translators / co-authors / contributors
  const allAvailableTranslators700 = React.useMemo(() => {
    const set = new Set<string>([
      'จักรพงษ์ เมษพันธุ์, ผู้แปล.',
      'กัญญารัตน์ จิราสวัสดิ์, ผู้แปล.',
      'ภาสกร รัตนสุวรรณ, ผู้แปล.',
      'Kang Gyung-Hyo, ผู้วาดภาพประกอบ.',
      'วิเชียร เกตุสิงห์, บรรณาธิการ.',
      'สมชาย, ผู้แต่ง.',
      'ประเสริฐ ณ นคร, ผู้รวบรวม.',
      'มานิต ศรีวานิชภูมิ, ช่างภาพ.',
      'ดนัย ดนตรี, ผู้ประพันธ์เพลง.',
      'สุทธิชัย หยุ่น, ผู้บรรยาย.',
      'ยุทธนา มุกดาสนิท, ผู้อำนวยการผลิต.',
      'เป็นเอก รัตนเรือง, ผู้กำกับ.',
      'กนก รัตน์วงศ์สกุล, ผู้สัมภาษณ์.',
      'สุลักษณ์ ศิวรักษ์, ผู้ถูกสัมภาษณ์.',
      'สมคิด เลิศไพฑูรย์, อาจารย์ที่ปรึกษา.',
      'นพพร สุวรรณพานิช, ผู้แปล.',
      'อารีนา แยนา, ผู้แปล.',
      'ธนวดี บุญล้วน, ผู้แปล.',
      'พิมพ์ใจ รัศมี, ผู้แปล.',
      'ศิรินาถ ศิริรัตน์, ผู้แปล.',
      'อรุณวรรณ บำรุงจิตต์, ผู้แปล.'
    ]);
    records.forEach(r => {
      if (r.added_entry_700 && r.added_entry_700 !== '-') {
        set.add(formatAddedEntry700(r.added_entry_700));
      }
    });

    if (editingRecord?.added_entry_700 && editingRecord.added_entry_700 !== '-') {
      const parsed = parseAddedEntry700Parts(editingRecord.added_entry_700);
      if (parsed.name) {
        STANDARD_700_ROLES_LIST.forEach(role => {
          set.add(`${parsed.name}, ${role}.`);
        });
      }
    }
    return Array.from(set).filter(Boolean);
  }, [records, editingRecord?.added_entry_700]);

  // Dynamic suggestions for publishers
  const allAvailablePublishers = React.useMemo(() => {
    const set = new Set<string>([
      'นานมีบุ๊คส์',
      'ซีเอ็ดยูเคชั่น',
      'อมรินทร์พริ้นติ้ง แอนด์ พับลิชชิ่ง',
      'มติชน',
      'แจ่มใส',
      'สถาพรบุ๊คส์',
      'แสงดาว',
      'สำนักพิมพ์จุฬาลงกรณ์มหาวิทยาลัย',
      'มหาวิทยาลัยธรรมศาสตร์',
      'สำนักพิมพ์ต้นคิด',
      'สยามอินเตอร์คอมิกส์',
      'เนชั่นบุ๊คส์',
      'สกายบุ๊กส์',
      'แปลน ฟอร์ คิดส์',
      'กิเลน การพิมพ์',
      'ซัคเซส มีเดีย',
      'เอ็กซเปอร์เน็ท',
      'ไอดีซี พรีเมียร์',
      'สำนักพิมพ์เดียร์เดียร์'
    ]);
    records.forEach(r => {
      if (r.publisher && r.publisher !== '-' && r.publisher !== 'ไม่ระบุสำนักพิมพ์') {
        set.add(r.publisher.trim());
      }
    });
    return Array.from(set).filter(Boolean);
  }, [records]);

  // Dynamic suggestions for publication places
  const allAvailablePubPlaces = React.useMemo(() => {
    const set = new Set<string>([
      'กรุงเทพฯ',
      'นนทบุรี',
      'ปทุมธานี',
      'เชียงใหม่',
      'ขอนแก่น',
      'สงขลา',
      'ชลบุรี',
      'นครราชสีมา',
      'สมุทรปราการ',
      'พิษณุโลก'
    ]);
    records.forEach(r => {
      if (r.pub_place && r.pub_place !== '-') {
        set.add(r.pub_place.trim());
      }
    });
    return Array.from(set).filter(Boolean);
  }, [records]);

  // Dynamic suggestions for 490 Series
  const allAvailableSeries490 = React.useMemo(() => {
    const set = new Set<string>([
      'การ์ตูนความรู้พัฒนาตนเอง ชุด Girl Power',
      'ชุด เอาชีวิตรอด',
      'ชุด ผจญภัยไร้พรมแดน',
      'ชุด ล่าขุมทรัพย์สุดขอบฟ้า',
      'ชุด ทำนายดวงชะตาราศี',
      'ชุด ครอบครัวตึ๋งหนืด',
      'ชุด พ่อรวยสอนลูก',
      'ชุด วิทยาศาสตร์แสนสนุก',
      'ชุด นิทานชาดก',
      'ชุด วรรณกรรมเยาวชนระดับโลก'
    ]);
    records.forEach(r => {
      if (r.series_490 && r.series_490 !== '-') set.add(r.series_490.trim());
      if (r.series_uniform_830 && r.series_uniform_830 !== '-') set.add(r.series_uniform_830.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [records]);

  // Dynamic suggestions for 110 Corporate Authors (นิติบุคคล)
  const allAvailableCorporateAuthors110 = React.useMemo(() => {
    const set = new Set<string>([
      'กรมศิลปากร',
      'สำนักงานราชบัณฑิตยสภา',
      'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
      'กระทรวงศึกษาธิการ',
      'กระทรวงสาธารณสุข',
      'สำนักงานกองทุนสนับสนุนการสร้างเสริมสุขภาพ (สสส.)',
      'สำนักพิมพ์จุฬาลงกรณ์มหาวิทยาลัย',
      'มหาวิทยาลัยธรรมศาสตร์',
      'มหาวิทยาลัยรามคำแหง',
      'มหาวิทยาลัยมหิดล',
      'มหาวิทยาลัยเกษตรศาสตร์',
      'มหาวิทยาลัยเชียงใหม่',
      'สถาบันบัณฑิตพัฒนบริหารศาสตร์',
      'หอสมุดแห่งชาติ',
      'สมาคมห้องสมุดแห่งประเทศไทย'
    ]);
    records.forEach(r => {
      if (r.author_corporate && r.author_corporate !== '-' && r.author_corporate.trim()) {
        set.add(r.author_corporate.trim());
      }
    });
    if (Array.isArray(libraryBooks)) {
      libraryBooks.forEach((b: any) => {
        const auth = (b.author || '').trim();
        if (auth && auth !== '-' && isCorporateAuthor(auth)) {
          set.add(auth);
        }
      });
    }
    return Array.from(set).filter(Boolean);
  }, [records, libraryBooks]);

  // Handle inline change of storage_location from dropdown
  const handleStorageLocationChange = (recordId: string, newLocation: string) => {
    const autoDdc = getAutoDdcForStorageLocation(newLocation);
    setRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      let updatedTags = Array.isArray(r.marc_tags) ? [...r.marc_tags] : [];
      if (autoDdc) {
        const idx082 = updatedTags.findIndex(t => t.tagID === '082' || (t as any).tag === '082');
        if (idx082 >= 0) {
          updatedTags[idx082] = { ...updatedTags[idx082], data: `$a${autoDdc} $b${r.cutter_082b || ''}` };
        }
      }
      return {
        ...r,
        storage_location: newLocation,
        ...(autoDdc ? { ddc_082a: autoDdc } : {}),
        marc_tags: updatedTags
      };
    }));
    if (autoDdc) {
      showToast(`📍 เปลี่ยนสถานที่จัดเก็บเป็น "${newLocation}" และปรับ 082 $a (DDC) เป็น "${autoDdc}" อัตโนมัติ`);
    } else {
      showToast(`📍 อัปเดตสถานที่จัดเก็บเป็น "${newLocation}" เรียบร้อยแล้ว`);
    }
  };

  // Handle inline change of 650 $a from dropdown (supports columns 1-5)
  const handleSubjectChange = (recordId: string, newSubject: string, subjectIndex: number = 1) => {
    const fieldKey = subjectIndex === 1 ? 'subject_650a' : `subject_650_${subjectIndex}`;
    setRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      let updatedTags = Array.isArray(r.marc_tags) ? [...r.marc_tags] : [];

      if (newSubject && newSubject !== '-') {
        const tag650Indices: number[] = [];
        updatedTags.forEach((t, i) => {
          if (t && (t.tagID === '650' || (t as any).tag === '650')) {
            tag650Indices.push(i);
          }
        });

        const targetPos = subjectIndex - 1;
        if (targetPos < tag650Indices.length) {
          const actualIdx = tag650Indices[targetPos];
          updatedTags[actualIdx] = { ...updatedTags[actualIdx], data: `$a${newSubject}` };
        } else {
          let insertIdx = -1;
          for (let i = updatedTags.length - 1; i >= 0; i--) {
            const t = updatedTags[i];
            if (t && parseInt(t.tagID || (t as any).tag, 10) <= 650) {
              insertIdx = i;
              break;
            }
          }
          const newTag = { tagID: '650', indc1: '', indc2: '4', data: `$a${newSubject}` };
          if (insertIdx >= 0) updatedTags.splice(insertIdx + 1, 0, newTag);
          else updatedTags.push(newTag);
        }
      }

      const updated = {
        ...r,
        [fieldKey]: newSubject,
        marc_tags: updatedTags
      };
      syncRecordToCloud(updated);
      return updated;
    }));
    const label = subjectIndex === 1 ? '650 $a หัวเรื่อง 1' : `650 $a หัวเรื่องที่ ${subjectIndex}`;
    showToast(`🏷️ อัปเดต ${label} เป็น "${newSubject}" เรียบร้อยแล้ว`);
  };

  // Handle inline change of 250 (พิมพ์ครั้งที่)
  const handleEditionChange = (recordId: string, newEdition: string) => {
    const cleanEdition = newEdition.trim() || 'พิมพ์ครั้งที่ 1';
    setRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      let updatedTags = Array.isArray(r.marc_tags) ? [...r.marc_tags] : [];
      const idx250 = updatedTags.findIndex(t => t.tagID === '250' || (t as any).tag === '250');
      const tagObj = { tagID: '250', indc1: '', indc2: '', data: `$a${cleanEdition}` };
      if (idx250 >= 0) updatedTags[idx250] = tagObj;
      else updatedTags.push(tagObj);

      return {
        ...r,
        edition_250: cleanEdition,
        marc_tags: updatedTags
      };
    }));
    showToast(`📖 อัปเดตข้อมูล 250 พิมพ์ครั้งที่ เป็น "${cleanEdition}" เรียบร้อย`);
  };

  // Handle inline change of 700 (ผู้ร่วมรับผิดชอบ / ผู้แปล / บทบาทหน้าที่) from dropdown
  const handleAddedEntry700Change = (recordId: string, newVal: string) => {
    const formatted = newVal && newVal !== '-' ? (parseAddedEntry700Parts(newVal).formatted || newVal) : '-';
    setRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      let updatedTags = Array.isArray(r.marc_tags) ? [...r.marc_tags] : [];
      if (formatted !== '-') {
        const idx700 = updatedTags.findIndex(t => t.tagID === '700' || (t as any).tag === '700');
        const tagObj = { tagID: '700', indc1: '1', indc2: '', data: `$a${formatted}` };
        if (idx700 >= 0) updatedTags[idx700] = tagObj;
        else updatedTags.push(tagObj);
      } else {
        updatedTags = updatedTags.filter(t => t.tagID !== '700' && (t as any).tag !== '700');
      }
      return {
        ...r,
        added_entry_700: formatted,
        marc_tags: updatedTags
      };
    }));
    showToast(`👥 อัปเดต Tag 700 เป็น "${formatted}" เรียบร้อยแล้ว`);
  };

  // Helper to format record payload strictly matching Supabase marc21_records columns
  const recordToDbPayload = (r: Marc21Record) => {
    return {
      id: r.id,
      db_id: r.db_id || null,
      date: r.date || null,
      col1: r.col1 || null,
      accession_no: r.accession_no || null,
      isbn: r.isbn || null,
      author_personal: r.author_personal || null,
      author_corporate: r.author_corporate || null,
      title_245a: r.title_245a || 'ไม่มีชื่อเรื่อง',
      title_245b: r.title_245b || null,
      responsibility_245c: r.responsibility_245c || null,
      ddc_082a: r.ddc_082a || null,
      cutter_082b: r.cutter_082b || null,
      pub_place: r.pub_place || null,
      publisher: r.publisher || null,
      pub_year: r.pub_year || null,
      pages_300a: r.pages_300a || null,
      illustration_300b: r.illustration_300b || null,
      subject_650a: r.subject_650a || null,
      copies: r.copies || null,
      summary_520: r.summary_520 || null,
      edition_250: r.edition_250 || null,
      price_541: r.price_541 || null,
      series_490: r.series_490 || null,
      added_entry_700: r.added_entry_700 || null,
      acquisition_source: r.acquisition_source || null,
      col2: r.col2 || null,
      source_type: r.source_type || null,
      storage_location: r.storage_location || null,
      status: r.status || 'พร้อมให้บริการ',
      col3: r.col3 || null,
      leader_000: r.leader_000 || null,
      control_001: r.control_001 || null,
      control_003: r.control_003 || null,
      trans_005: r.trans_005 || null,
      fixed_008: r.fixed_008 || null,
      issn_022: r.issn_022 || null,
      cat_source_040: r.cat_source_040 || null,
      language_041: r.language_041 || null,
      title_varying_246: r.title_varying_246 || null,
      dimensions_300c: r.dimensions_300c || null,
      note_general_500: r.note_general_500 || null,
      note_bib_504: r.note_bib_504 || null,
      note_contents_505: r.note_contents_505 || null,
      subject_person_600: r.subject_person_600 || null,
      subject_corp_610: r.subject_corp_610 || null,
      subject_uniform_630: r.subject_uniform_630 || null,
      subject_geo_651: r.subject_geo_651 || null,
      subject_650_2: r.subject_650_2 || null,
      subject_650_3: r.subject_650_3 || null,
      subject_650_4: r.subject_650_4 || null,
      subject_650_5: r.subject_650_5 || null,
      added_corp_710: r.added_corp_710 || null,
      added_title_740: r.added_title_740 || null,
      series_uniform_830: r.series_uniform_830 || null,
      electronic_856: r.electronic_856 || null,
      local_907: r.local_907 || null,
      cover_image: r.cover_image || null,
      search_source: r.search_source || null,
      marc_tags: Array.isArray(r.marc_tags) ? r.marc_tags : [],
      updated_at: new Date().toISOString()
    };
  };


  // Sync single record to Supabase Cloud
  const syncRecordToCloud = async (rec: Marc21Record) => {
    try {
      const payload = recordToDbPayload(rec);
      let { error } = await supabase.from('marc21_records').upsert(payload, { onConflict: 'id' });
      
      // Auto-fallback if schema difference (e.g. PGRST204 column not found on Supabase)
      if (error && error.code === 'PGRST204') {
        const sanitized = { ...payload };
        delete (sanitized as any).subject_650_2;
        delete (sanitized as any).subject_650_3;
        delete (sanitized as any).subject_650_4;
        delete (sanitized as any).subject_650_5;
        const retry = await supabase.from('marc21_records').upsert(sanitized, { onConflict: 'id' });
        error = retry.error;
      }

      if (!error) {
        setHasCloudTable(true);
        setHasRlsError(false);
      } else {
        console.warn('[Supabase marc21_records Sync Warning]:', error.message || error);
        if (error.code === '42P01') {
          setHasCloudTable(false);
        } else if (error.code === '42501' || error.message?.includes('row-level security')) {
          setHasRlsError(true);
        }
      }
      return !error;
    } catch (err) {
      console.warn('[Supabase marc21_records Exception]:', err);
      return false;
    }
  };

  // Sync batch of records to Supabase Cloud
  const syncBatchToCloud = async (batch: Marc21Record[]) => {
    if (!batch || batch.length === 0) return;
    try {
      const payloads = batch.map(recordToDbPayload);
      for (let i = 0; i < payloads.length; i += 50) {
        const chunk = payloads.slice(i, i + 50);
        let { error } = await supabase.from('marc21_records').upsert(chunk, { onConflict: 'id' });
        if (error && error.code === 'PGRST204') {
          const sanitizedChunk = chunk.map(item => {
            const copy = { ...item };
            delete (copy as any).subject_650_2;
            delete (copy as any).subject_650_3;
            delete (copy as any).subject_650_4;
            delete (copy as any).subject_650_5;
            return copy;
          });
          const retry = await supabase.from('marc21_records').upsert(sanitizedChunk, { onConflict: 'id' });
          error = retry.error;
        }
        if (error) {
          console.warn('[Supabase Batch Sync Warning]:', error.message || error);
          if (error.code === '42P01') {
            setHasCloudTable(false);
            return;
          }
          if (error.code === '42501' || error.message?.includes('row-level security')) {
            setHasRlsError(true);
            return;
          }
        }
      }
      setHasCloudTable(true);
      setHasRlsError(false);
    } catch (err) {
      console.warn('[Supabase Batch Sync Exception]:', err);
    }
  };

  // Delete single record from Supabase Cloud
  const deleteRecordFromCloud = async (id: string) => {
    try {
      await supabase.from('marc21_records').delete().eq('id', id);
    } catch {}
  };

  // Delete batch of records from Supabase Cloud
  const deleteBatchFromCloud = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    try {
      await supabase.from('marc21_records').delete().in('id', ids);
    } catch {}
  };

  // Delete all records from Supabase Cloud
  const deleteAllFromCloud = async () => {
    try {
      await supabase.from('marc21_records').delete().neq('id', '');
    } catch {}
  };

  // Helper to load ALL records from Supabase Cloud with full pagination (bypasses 1,000 row PostgREST limit)
  const loadCloudRecords = async () => {
    setIsSyncingCloud(true);
    setStatusMessage('กำลังเชื่อมต่อและโหลดข้อมูลหนังสือจาก Supabase Cloud (ตั้งแต่ 0000000001 ถึงเล่มล่าสุด)...');
    try {
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from('marc21_records')
          .select('*')
          .order('accession_no', { ascending: true })
          .range(from, to);

        if (error) {
          if (error.code === '42P01') {
            setHasCloudTable(false);
          } else if (error.code === '42501' || error.message?.includes('row-level security')) {
            setHasRlsError(true);
            setCloudSqlTab('rls');
          }
          break;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);

          setStatusMessage(`กำลังดาวน์โหลดข้อมูลบรรณานุกรมจาก Supabase Cloud... (${allData.length.toLocaleString()} รายการ)`);
          setHasCloudTable(true);
          setHasRlsError(false);

          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      if (allData.length > 0) {
        setHasCloudTable(true);
        setHasRlsError(false);
        const finalFormatted: Marc21Record[] = allData.map((d: any) => ({
          ...d,
          marc_tags: Array.isArray(d.marc_tags)
            ? d.marc_tags
            : (typeof d.marc_tags === 'string' ? JSON.parse(d.marc_tags) : [])
        }));

        setRecords(finalFormatted);
        saveRecordsToIndexedDb(finalFormatted);

        const maxAcc = finalFormatted.reduce((max, r) => {
          const num = parseInt(r.accession_no, 10);
          return !isNaN(num) && num > max ? num : max;
        }, 2612);
        setStartAccNum(Math.max(maxAcc + 1, 2613));

        const firstAcc = finalFormatted[0]?.accession_no || '0000000001';
        const lastAcc = finalFormatted[finalFormatted.length - 1]?.accession_no || '0000003041';
        setLastCloudSyncTime(`${new Date().toLocaleTimeString('th-TH')} (${finalFormatted.length.toLocaleString()} รายการ: ${firstAcc} - ${lastAcc})`);

        // Probe write permissions to detect Supabase Row-Level Security (RLS) status
        try {
          const probeId = 'test_probe_rls_check';
          const { error: probeError } = await supabase
            .from('marc21_records')
            .upsert({ id: probeId, title_245a: 'PROBE_CHECK' }, { onConflict: 'id' });

          if (probeError && (probeError.code === '42501' || probeError.message?.includes('row-level security'))) {
            setHasRlsError(true);
            setCloudSqlTab('rls');
          } else if (!probeError) {
            setHasRlsError(false);
            await supabase.from('marc21_records').delete().eq('id', probeId);
          }
        } catch {}
      }
    } catch (err) {
      console.warn('[Cloud Load Note]:', err);
    } finally {
      setIsSyncingCloud(false);
      setStatusMessage('');
    }
  };

  // 1. Initial Load: Load from IndexedDB/localStorage first (instant), then immediately fetch all from Supabase Cloud
  useEffect(() => {
    let isMounted = true;

    // Check IndexedDB cache first for instant high-capacity loading
    loadRecordsFromIndexedDb().then((cached) => {
      if (isMounted && cached && cached.length > 0) {
        setRecords(cached);
        const maxAcc = cached.reduce((max, r) => {
          const num = parseInt(r.accession_no, 10);
          return !isNaN(num) && num > max ? num : max;
        }, 2612);
        setStartAccNum(Math.max(maxAcc + 1, 2613));
      } else {
        // Fallback to localStorage if any
        try {
          const saved = localStorage.getItem('iabs_marc21_records');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
              setRecords(parsed);
              const maxAcc = parsed.reduce((max, r) => {
                const num = parseInt(r.accession_no, 10);
                return !isNaN(num) && num > max ? num : max;
              }, 2612);
              setStartAccNum(Math.max(maxAcc + 1, 2613));
            }
          }
        } catch {}
      }
    });

    // Automatically load all records from Supabase Cloud on component mount
    loadCloudRecords();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Supabase Realtime Subscription: Sync INSERT, UPDATE, DELETE instantly across all devices
  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    try {
      channel = supabase
        .channel('realtime_marc21_catalog_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'marc21_records' },
          (payload: any) => {
            if (!isMounted) return;
            setLastCloudSyncTime(new Date().toLocaleTimeString('th-TH'));

            if (payload.eventType === 'INSERT' && payload.new) {
              const row = payload.new;
              const rec: Marc21Record = {
                ...row,
                marc_tags: Array.isArray(row.marc_tags)
                  ? row.marc_tags
                  : (typeof row.marc_tags === 'string' ? JSON.parse(row.marc_tags) : [])
              };
              setRecords(prev => {
                if (prev.some(r => r.id === rec.id)) return prev;
                return [rec, ...prev];
              });
              showToast(`⚡ ซิงค์เรียลไทม์: คอมพิวเตอร์เครื่องอื่นเพิ่ม "${rec.title_245a || 'รายการใหม่'}"`);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const row = payload.new;
              const rec: Marc21Record = {
                ...row,
                marc_tags: Array.isArray(row.marc_tags)
                  ? row.marc_tags
                  : (typeof row.marc_tags === 'string' ? JSON.parse(row.marc_tags) : [])
              };
              setRecords(prev => prev.map(r => r.id === rec.id ? { ...r, ...rec } : r));
              showToast(`⚡ ซิงค์เรียลไทม์: อัปเดตรายการ "${rec.title_245a || ''}" อัตโนมัติ`);
            } else if (payload.eventType === 'DELETE' && payload.old) {
              const deletedId = payload.old.id;
              if (deletedId) {
                setRecords(prev => prev.filter(r => r.id !== deletedId));
                showToast('⚡ ซิงค์เรียลไทม์: รายการถูกลบจากคอมพิวเตอร์เครื่องอื่น');
              }
            }
          }
        )
        .subscribe((status: string) => {
          if (!isMounted) return;
          if (status === 'SUBSCRIBED') {
            setIsCloudRealtimeConnected(true);
            setHasCloudTable(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsCloudRealtimeConnected(false);
          }
        });
    } catch (err) {
      console.warn('[Realtime Subscription Exception]:', err);
    }

    return () => {
      isMounted = false;
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, []);

  // 3. Save records to IndexedDB and update start accession number whenever they change
  useEffect(() => {
    if (records.length > 0) {
      saveRecordsToIndexedDb(records);

      const maxAcc = records.reduce((max, r) => {
        const num = parseInt(r.accession_no, 10);
        return !isNaN(num) && num > max ? num : max;
      }, 2612);
      setStartAccNum(Math.max(maxAcc + 1, 2613));

      // Attempt lightweight localStorage save only if small enough (< 300 records) to avoid QuotaExceededError
      try {
        if (records.length <= 300) {
          localStorage.setItem('iabs_marc21_records', JSON.stringify(records));
        }
      } catch {}
    }
  }, [records]);

  // Sync entire current table to Supabase Cloud
  const handleSyncAllToCloud = async () => {
    if (records.length === 0) {
      showToast('⚠️ ไม่มีข้อมูลในตารางสำหรับซิงค์ขึ้น Cloud');
      return;
    }
    setIsSyncingCloud(true);
    try {
      const payloads = records.map(recordToDbPayload);
      for (let i = 0; i < payloads.length; i += 50) {
        const chunk = payloads.slice(i, i + 50);
        const { error } = await supabase.from('marc21_records').upsert(chunk, { onConflict: 'id' });
        if (error) {
          if (error.code === '42P01') {
            setHasCloudTable(false);
            setCloudSqlTab('all');
            setIsCloudSetupModalOpen(true);
            showToast('⚠️ ยังไม่ได้สร้างตาราง marc21_records ใน Supabase กรุณารัน SQL ตามขั้นตอน');
            return;
          }
          if (error.code === '42501' || error.message?.includes('row-level security')) {
            setHasRlsError(true);
            setCloudSqlTab('rls');
            setIsCloudSetupModalOpen(true);
            showToast('⚠️ ติดสิทธิ์ Row-Level Security (RLS) บน Supabase กรุณารันคำสั่งปลดล็อค RLS ในหน้าต่างที่เปิดขึ้นมา');
            return;
          }
          throw error;
        }
      }
      setHasCloudTable(true);
      setHasRlsError(false);
      setLastCloudSyncTime(new Date().toLocaleTimeString('th-TH'));
      showToast(`☁️ ซิงค์ข้อมูลทั้งหมด ${records.length} รายการขึ้น Supabase Cloud สำเร็จ! ทุกอุปกรณ์จะเห็นตรงกันทันที`);
    } catch (err: any) {
      console.error('Cloud Sync Error:', err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
        setHasRlsError(true);
        setCloudSqlTab('rls');
        setIsCloudSetupModalOpen(true);
        showToast('⚠️ ติดสิทธิ์ Row-Level Security (RLS) บน Supabase กรุณารันคำสั่งปลดล็อค RLS ในหน้าต่างที่เปิดขึ้นมา');
      } else {
        showToast(`❌ ซิงค์ไม่สำเร็จ: ${err.message || 'โปรดตรวจสอบการเชื่อมต่อ'}`);
      }
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    showToast(`📋 คัดลอก ${label} "${text}" เรียบร้อยแล้ว`);
  };

  const handleFetchAiCover = async () => {
    if (!editingRecord) return;
    setIsFetchingAiCover(true);
    try {
      const cleanIsbn = (editingRecord.isbn || '').replace(/[^0-9X]/gi, '');
      const cleanTitle = (editingRecord.title_245a || '').split('/')[0].split('=')[0].trim();
      const cleanAuthor = (editingRecord.author_personal || '').trim();
      const cleanPublisher = (editingRecord.publisher || '').trim();

      if (!cleanIsbn && !cleanTitle) {
        showToast('⚠️ กรุณาระบุชื่อเรื่อง หรือ ISBN เพื่อให้ AI ดึงปกหนังสือจริง');
        setIsFetchingAiCover(false);
        return;
      }

      let foundUrl: string | null = null;
      let sourceName = '';

      // 1. Try serverless search-cover endpoint
      try {
        const res = await fetch('/api/search-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isbn: cleanIsbn,
            title: cleanTitle,
            author: cleanAuthor,
            publisher: cleanPublisher
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.cover_image) {
            foundUrl = data.cover_image;
            sourceName = data.source === 'google_books' ? 'Google Books AI' : (data.source || 'AI Web Search');
          }
        }
      } catch (err) {
        console.warn('Cover search API note:', err);
      }

      // 2. Direct client Google Books API search
      if (!foundUrl) {
        try {
          const queries: string[] = [];
          if (cleanIsbn.length >= 10) queries.push(`isbn:${cleanIsbn}`);
          if (cleanTitle) {
            const cleanT = cleanTitle.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();
            const cleanA = cleanAuthor.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();
            if (cleanA && cleanA !== '-') queries.push(`intitle:${cleanT}+inauthor:${cleanA}`);
            queries.push(cleanT);
          }

          for (const q of queries) {
            const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`);
            if (gbRes.ok) {
              const gbData = await gbRes.json();
              if (gbData.items && gbData.items.length > 0) {
                for (const item of gbData.items) {
                  const imgLinks = item.volumeInfo?.imageLinks;
                  if (imgLinks?.thumbnail || imgLinks?.smallThumbnail || imgLinks?.medium || imgLinks?.large) {
                    let img = (imgLinks.large || imgLinks.medium || imgLinks.thumbnail || imgLinks.smallThumbnail).replace('http://', 'https://');
                    img = img.replace('&edge=curl', '');
                    foundUrl = img;
                    sourceName = 'Google Books AI';
                    break;
                  }
                }
              }
            }
            if (foundUrl) break;
          }
        } catch (gbErr) {
          console.warn('Client Google Books note:', gbErr);
        }
      }

      // 3. Fallback to OpenLibrary high-res cover
      if (!foundUrl && cleanIsbn.length >= 10) {
        foundUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
        sourceName = 'OpenLibrary';
      }

      if (foundUrl) {
        setEditingRecord({
          ...editingRecord,
          cover_image: foundUrl,
          electronic_856: foundUrl
        });
        showToast(`🖼️ ดึงปกหนังสือจริงด้วย AI สำเร็จ (${sourceName})`);
      } else {
        showToast('⚠️ AI ไม่พบรูปปกหนังสือจริงสำหรับรายการนี้ สามารถวางลิงก์ภาพหน้าปกเองได้');
      }
    } catch (e: any) {
      showToast(`⚠️ การดึงรูปปกขัดข้อง: ${e?.message || 'เครือข่ายขัดข้อง'}`);
    } finally {
      setIsFetchingAiCover(false);
    }
  };

  const loadInitialSamples = () => {
    const samples: Marc21Record[] = [
      {
        id: 'sample_1',
        date: '24/6/2022',
        col1: '',
        accession_no: '0000002613',
        isbn: '9786163930446',
        author_personal: 'อัมรา เรืองศิริ.',
        author_corporate: '-',
        title_245a: 'ทุกมื้ออร่อยจัง',
        title_245b: '-',
        responsibility_245c: 'อัมรา เรืองศิริ.',
        ddc_082a: 'ด',
        cutter_082b: 'อ212ท',
        pub_place: 'กรุงเทพฯ',
        publisher: 'Sook Publishing',
        pub_year: '2559',
        pages_300a: '24 หน้า',
        illustration_300b: 'ภาพสี',
        subject_650a: 'นิทานภาพ',
        copies: '1',
        summary_520: 'ทุกมื้ออร่อยจัง อาหารแต่ละมื้อในหนึ่งวัน มีความสำคัญต่างกัน หนังสือเล่มนี้จะช่วยให้เด็กๆ มีความสุขกับการกินอาหาร รวมถึงบรรยากาศในช่วงระหว่างรับประทานอาหาร',
        edition_250: 'พิมพ์ครั้งที่ 2',
        price_541: '30 บาท',
        series_490: '-',
        added_entry_700: '-',
        acquisition_source: 'สั่งซื้อ',
        col2: '',
        source_type: 'สั่งชื้อ',
        storage_location: 'สำหรับเด็ก',
        status: 'อยู่บนชั้น',
        col3: '',
        leader_000: '00933nam  2200289ua 4500',
        control_001: 'b0002613',
        control_003: 'UCTAL',
        trans_005: '25650624103000.0',
        fixed_008: '220624s2559    th a   j      000 1 tha d',
        issn_022: '-',
        cat_source_040: 'UCTAL',
        language_041: 'tha',
        title_varying_246: '-',
        dimensions_300c: '20 ซม.',
        note_general_500: '-',
        note_bib_504: '-',
        note_contents_505: '-',
        subject_person_600: '-',
        subject_corp_610: '-',
        subject_uniform_630: 'สำหรับเด็ก',
        subject_geo_651: '-',
        subject_650_2: 'อาหารและโภชนาการสำหรับเด็ก.',
        added_corp_710: '-',
        added_title_740: '-',
        series_uniform_830: '-',
        electronic_856: '-',
        local_907: 'b0000002613'
      },
      {
        id: 'sample_2',
        date: '24/6/2022',
        col1: '',
        accession_no: '0000002614',
        isbn: '9786160401628',
        author_personal: 'Oh, Joo-Young.',
        author_corporate: '-',
        title_245a: 'สุดยอดความคิด 70 ยอดคน = 70 ยอดคน',
        title_245b: '70 ยอดคน',
        responsibility_245c: 'Oh, Joo-Young.',
        ddc_082a: '155.41',
        cutter_082b: 'ฮ27ส',
        pub_place: 'กรุงเทพฯ',
        publisher: 'นานมีบุ๊คส์',
        pub_year: '2553',
        pages_300a: '175 หน้า',
        illustration_300b: 'ภาพประกอบ',
        subject_650a: 'การดำเนินชีวิต --วรรณกรรมสำหรับเด็ก',
        copies: '1',
        summary_520: 'หนังสือที่จะพาเด็กๆ ไปพบกับสุดยอดความคิดอันทรงคุณค่าจาก 70 ยอดคน เรียบเรียงไว้เป็นสาขาต่างๆ กว่า 7 สาขา ทั้งที่เป็นนักสำรวจ นักประดิษฐ์ นักธุรกิจ ผู้นำประเทศ',
        edition_250: 'พิมพ์ครั้งที่ 1',
        price_541: '175 บาท',
        series_490: 'เตรียมความพร้อมเพื่ออนาคต',
        added_entry_700: 'กิตติพงศ์ คุ้มพายัพ, ผู้แปล',
        acquisition_source: 'สั่งซื้อ',
        col2: '',
        source_type: 'สั่งชื้อ',
        storage_location: 'หมวด 100',
        status: 'อยู่บนชั้น',
        col3: '',
        leader_000: '00933nam  2200289ua 4500',
        control_001: 'b0002614',
        control_003: 'UCTAL',
        trans_005: '25650624103100.0',
        fixed_008: '220624s2553    th a   j      000 1 tha d',
        issn_022: '-',
        cat_source_040: 'UCTAL',
        language_041: 'tha',
        title_varying_246: '70 ยอดคน',
        dimensions_300c: '21 ซม.',
        note_general_500: '-',
        note_bib_504: '-',
        note_contents_505: '-',
        subject_person_600: '-',
        subject_corp_610: '-',
        subject_uniform_630: 'เยาวชน',
        subject_geo_651: '-',
        subject_650_2: 'ชีวประวัติ--สำหรับเด็ก.',
        added_corp_710: '-',
        added_title_740: '-',
        series_uniform_830: 'เตรียมความพร้อมเพื่ออนาคต',
        electronic_856: '-',
        local_907: 'b0000002614'
      },
      {
        id: 'sample_3',
        date: '24/6/2022',
        col1: '',
        accession_no: '0000002615',
        isbn: '9786160405886',
        author_personal: 'แม็กเกรเกอร์, ซินเทีย.',
        author_corporate: '-',
        title_245a: "ปัญหาแค่นี้ฉันรับมือได้ = Think for yourself : a kid's guide to solving life's dilemmas",
        title_245b: "Think for yourself : a kid's guide to solving life's dilemmas",
        responsibility_245c: 'แม็กเกรเกอร์, ซินเทีย.',
        ddc_082a: '155.4',
        cutter_082b: 'ม611ป',
        pub_place: 'กรุงเทพฯ',
        publisher: 'นานมีบุ๊คส์',
        pub_year: '2554',
        pages_300a: '88 หน้า',
        illustration_300b: 'ภาพประกอบ',
        subject_650a: 'จิตวิทยาเด็ก',
        copies: '1',
        summary_520: 'คู่มือแก้ไขปัญหาและสถานการณ์ที่กลืนไม่เข้าคายไม่ออกสำหรับเด็กและเยาวชน',
        edition_250: 'พิมพ์ครั้งที่ 1',
        price_541: '115 บาท',
        series_490: '-',
        added_entry_700: 'วารยา, ผู้แปล',
        acquisition_source: 'สั่งซื้อ',
        col2: '',
        source_type: 'สั่งชื้อ',
        storage_location: 'หมวด 100',
        status: 'อยู่บนชั้น',
        col3: '',
        leader_000: '00933nam  2200289ua 4500',
        control_001: 'b0002615',
        control_003: 'UCTAL',
        trans_005: '25650624103200.0',
        fixed_008: '220624s2554    th a   j      000 1 tha d',
        issn_022: '-',
        cat_source_040: 'UCTAL',
        language_041: 'tha',
        title_varying_246: "Think for yourself : a kid's guide",
        dimensions_300c: '19 ซม.',
        note_general_500: '-',
        note_bib_504: '-',
        note_contents_505: '-',
        subject_person_600: '-',
        subject_corp_610: '-',
        subject_uniform_630: 'เยาวชน',
        subject_geo_651: '-',
        subject_650_2: 'การแก้ปัญหาในเด็ก.',
        added_corp_710: '-',
        added_title_740: '-',
        series_uniform_830: '-',
        electronic_856: '-',
        local_907: 'b0000002615'
      },
      {
        id: 'sample_4',
        date: '24/6/2022',
        col1: '',
        accession_no: '0000002616',
        isbn: '9786160838325',
        author_personal: 'จักรพงษ์ เมษพันธุ์.',
        author_corporate: '-',
        title_245a: "พ่อรวยสอนลูก เล่ม 2 : เงินสี่ด้าน = Rich Dad's Cashflow Quadrant",
        title_245b: "Rich Dad's Cashflow Quadrant",
        responsibility_245c: 'จักรพงษ์ เมษพันธุ์, อารีนา แยนา และธนพร ศิริอัครกรกุล.',
        ddc_082a: '332.024',
        cutter_082b: 'จ111พ',
        pub_place: 'กรุงเทพฯ',
        publisher: 'ซีเอ็ดยูเคชั่น',
        pub_year: '2563',
        pages_300a: '384 หน้า',
        illustration_300b: 'ภาพประกอบ',
        subject_650a: 'การเงินส่วนบุคคล',
        copies: '1',
        summary_520: 'หนังสือที่จะเผยความลับว่าทำไมคนที่อยู่ในด้าน B และ I จึงหาเงินได้มากกว่า ทำงานน้อยกว่า และเสียภาษีน้อยกว่าคนที่อยู่ในด้าน E และ S',
        edition_250: 'พิมพ์ครั้งที่ 1',
        price_541: '290 บาท',
        series_490: '-',
        added_entry_700: 'จักรพงษ์ เมษพันธุ์, ผู้แปล',
        acquisition_source: 'สั่งซื้อ',
        col2: '',
        source_type: 'สั่งชื้อ',
        storage_location: 'หมวด 300 สังคมศาสตร์',
        status: 'อยู่บนชั้น',
        col3: '',
        leader_000: '00933nam  2200289ua 4500',
        control_001: 'b0002616',
        control_003: 'UCTAL',
        trans_005: '25650624103300.0',
        fixed_008: '220624s2563    th a   j      000 1 tha d',
        issn_022: '-',
        cat_source_040: 'UCTAL',
        language_041: 'tha',
        title_varying_246: "Rich Dad's Cashflow Quadrant",
        dimensions_300c: '21 ซม.',
        note_general_500: '-',
        note_bib_504: '-',
        note_contents_505: '-',
        subject_person_600: '-',
        subject_corp_610: '-',
        subject_uniform_630: '-',
        subject_geo_651: '-',
        subject_650_2: 'การลงทุนส่วนบุคคล.',
        added_corp_710: '-',
        added_title_740: '-',
        series_uniform_830: '-',
        electronic_856: '-',
        local_907: 'b0000002616'
      }
    ];
    setRecords(samples);
    setStartAccNum(2617);
  };

  // --- Search / Generate handler ---
  const handleGenerate = async (queryList: string[]) => {
    if (queryList.length === 0) return;
    setIsLoading(true);
    setStatusMessage(`กำลังค้นหาข้อมูลจากอินเทอร์เน็ตและฐานข้อมูลห้องสมุด (${queryList.length} รายการ)...`);

    // Helper for fallback generation
    const executeFallbackGeneration = (sourceLabel = 'สร้างแบบอัตโนมัติ (Cataloging Fallback)') => {
      const existingUsed = new Set(records.map(r => parseInt(r.accession_no, 10)).filter(n => !isNaN(n)));
      let runAcc = Math.max(startAccNum, 2613);
      const fallbackRecords: Marc21Record[] = [];

      for (let i = 0; i < queryList.length; i++) {
        const item = queryList[i];
        const cleanIsbn = item.replace(/[^0-9X]/gi, '');
        const isIsbn = cleanIsbn.length === 10 || cleanIsbn.length === 13;
        
        while (runAcc <= 2612 || existingUsed.has(runAcc)) {
          runAcc++;
        }
        const accNo = String(runAcc).padStart(10, '0');
        existingUsed.add(runAcc);
        runAcc++;

        const authorGuess = 'ไม่ระบุผู้แต่ง';
        const ddcGuess = isIsbn ? '000' : (item.includes('นิทาน') ? 'ด' : (item.includes('การ์ตูน') ? 'ย' : '000'));
        const cutterGuess = generateThaiCutter(authorGuess, item);

        fallbackRecords.push({
          id: `rec_${Date.now()}_${i}`,
          date: new Date().toLocaleDateString('th-TH'),
          col1: '',
          accession_no: accNo,
          isbn: isIsbn ? cleanIsbn : '',
          author_personal: `${authorGuess}.`,
          author_corporate: '-',
          title_245a: `${item}`,
          title_245b: '',
          responsibility_245c: authorGuess,
          ddc_082a: ddcGuess,
          cutter_082b: cutterGuess,
          pub_place: 'กรุงเทพฯ',
          publisher: 'ไม่ระบุสำนักพิมพ์',
          pub_year: '2567',
          pages_300a: '160 หน้า',
          illustration_300b: 'ภาพประกอบ',
          subject_650a: 'ทั่วไป',
          copies: '1',
          summary_520: `รายการบรรณานุกรมสำหรับหนังสือ ${item}`,
          edition_250: 'พิมพ์ครั้งที่ 1',
          price_541: '-',
          series_490: '-',
          added_entry_700: '-',
          acquisition_source: 'สั่งซื้อ',
          col2: '',
          source_type: 'สั่งชื้อ',
          storage_location: ddcGuess === 'ด' ? 'สำหรับเด็ก' : (ddcGuess === 'ย' ? 'เยาวชน' : 'หมวด ทั่วไป'),
          status: 'อยู่บนชั้น',
          col3: '',
          search_source: sourceLabel
        });
      }

      setRecords(prev => [...fallbackRecords, ...prev]);
      setStartAccNum(Math.max(...Array.from(existingUsed)) + 1);
      syncBatchToCloud(fallbackRecords);
      showToast(`✨ สร้างรายการบรรณานุกรมสำเร็จ ${fallbackRecords.length} เล่ม (เริ่ม 0000002613 ไม่มีเลขซ้ำ)`);
      setSearchQuery('');
      setBatchQueries('');
      setIsBatchOpen(false);
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/generate-marc21', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: queryList,
          startAccession: Math.max(startAccNum, 2613),
          date: new Date().toLocaleDateString('th-TH')
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.records) && data.records.length > 0) {
          // Verify and ensure no collision with existing records in table
          const existingUsed = new Set(records.map(r => parseInt(r.accession_no, 10)).filter(n => !isNaN(n)));
          let runAcc = Math.max(startAccNum, 2613);

          const adjustedRecords = data.records.map((rec: Marc21Record) => {
            let num = parseInt(rec.accession_no, 10);
            if (isNaN(num) || num <= 2612 || existingUsed.has(num)) {
              while (runAcc <= 2612 || existingUsed.has(runAcc)) {
                runAcc++;
              }
              num = runAcc;
              runAcc++;
            }
            existingUsed.add(num);
            return {
              ...rec,
              accession_no: String(num).padStart(10, '0')
            };
          });

          setRecords(prev => [...adjustedRecords, ...prev]);
          setStartAccNum(Math.max(...Array.from(existingUsed)) + 1);
          syncBatchToCloud(adjustedRecords);
          showToast(`✨ สร้างรายการบรรณานุกรมสำเร็จ ${adjustedRecords.length} รายการ (เริ่มหลัง 0000002612 ไม่มีเลขซ้ำ)`);
          setSearchQuery('');
          setBatchQueries('');
          setIsBatchOpen(false);
          return;
        }
      }

      // If response was not ok or records empty, execute fallback
      executeFallbackGeneration();

    } catch (err: any) {
      console.warn('Network / API note, using instant cataloging engine:', err?.message);
      executeFallbackGeneration();
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Quick single item submit
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    handleGenerate([searchQuery.trim()]);
  };

  // Dedicated UC-TAL ThaiLIS (https://uc.thailis.or.th) Search Handler
  const handleSearchUctal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!uctalKeyword.trim()) return;
    setIsUctalLoading(true);
    try {
      const res = await fetch('/api/uctal-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: uctalKeyword.trim(),
          region: uctalRegion,
          pageno: 1,
          perpage: 15
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setUctalResults(data.results);
          setUctalTotalFound(data.found ?? data.results.length);
          if (data.results.length === 0) {
            showToast('ℹ️ ไม่พบรายการหนังสือในฐานข้อมูล UC-TAL');
          } else {
            showToast(`🏛️ พบ ${data.found || data.results.length} รายการจากสหบรรณานุกรมสถาบันอุดมศึกษาไทย (UC-TAL)`);
          }
        } else {
          showToast(`⚠️ ${data.error || 'ไม่สามารถค้นหาข้อมูลจาก UC-TAL ได้'}`);
        }
      } else {
        showToast('⚠️ ไม่สามารถเชื่อมต่อกับบริการ UC-TAL Web Services ได้');
      }
    } catch (err: any) {
      console.warn('UC-TAL search error:', err);
      showToast('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ UC-TAL');
    } finally {
      setIsUctalLoading(false);
    }
  };

  // Import directly from UC-TAL search result into MARC21 table
  const handleImportFromUctal = (item: any, selectedLibrary?: any) => {
    const existingUsed = new Set(records.map(r => parseInt(r.accession_no, 10)).filter(n => !isNaN(n)));
    let runAcc = startAccNum;
    while (existingUsed.has(runAcc)) {
      runAcc++;
    }
    const accNo = String(runAcc).padStart(10, '0');
    
    const ddcVal = item.ddc || item.ddc_082a || '000';
    const rawCutterVal = item.cutter || item.cutter_082b || generateThaiCutter(item.author || item.author_personal, item.title || item.title_245a);
    const cutterVal = String(rawCutterVal || '').replace(/\s+\d{4}$/, '').trim();

    const institutionSymbol = selectedLibrary?.symbol || selectedLibrary?.locationSymbol || '';
    const institutionName = selectedLibrary?.nameTh || selectedLibrary?.locationNameTh || '';

    const catSource = institutionSymbol ? institutionSymbol : (item.cat_source_040 || 'UCTAL');
    const searchSource = institutionName 
      ? `สหบรรณานุกรม UC-TAL (สถาบัน: ${institutionName} [${institutionSymbol}])`
      : (item.search_source || `สหบรรณานุกรมสถาบันอุดมศึกษาไทย (UC-TAL - ${item.librariesCount || item.libraries?.length || 1} สถาบัน)`);

    // Clone and adapt marcRaw tags
    let rawMarcList: MarcTagItem[] = [];
    if (Array.isArray(item.marcRaw) && item.marcRaw.length > 0) {
      rawMarcList = JSON.parse(JSON.stringify(item.marcRaw));
    } else if (Array.isArray(item.marc_tags) && item.marc_tags.length > 0) {
      rawMarcList = JSON.parse(JSON.stringify(item.marc_tags));
    } else {
      rawMarcList = generateMarcTagsFromRecord(item as Marc21Record);
    }

    if (institutionSymbol) {
      // Tag 040
      const idx040 = rawMarcList.findIndex(t => t.tagID === '040');
      const tag040Obj = { tagID: '040', indc1: '', indc2: '', data: `$a${institutionSymbol}$c${institutionSymbol}` };
      if (idx040 >= 0) rawMarcList[idx040] = tag040Obj;
      else {
        const insIdx = rawMarcList.findIndex(t => parseInt(t.tagID, 10) >= 41 || parseInt(t.tagID, 10) >= 100);
        if (insIdx >= 0) rawMarcList.splice(insIdx, 0, tag040Obj);
        else rawMarcList.push(tag040Obj);
      }

      // Tag 003
      const idx003 = rawMarcList.findIndex(t => t.tagID === '003');
      const tag003Obj = { tagID: '003', indc1: '', indc2: '', data: `UCTAL-${institutionSymbol}` };
      if (idx003 >= 0) rawMarcList[idx003] = tag003Obj;
      else rawMarcList.push(tag003Obj);
    }

    const cleanTitleObj = formatCleanMarc245Title(
      item.title || item.title_245a || '',
      item.title_245b || item.subtitle || '',
      item.title_varying_246 || item.varyingTitle || ''
    );

    // Extract Tag 020 $c for field 541 (ราคา) as requested
    let priceFrom020 = '';
    const t020Items = (rawMarcList || []).filter(t => t.tagID === '020');
    for (const t of t020Items) {
      const c = parseMarcSubfield(t.data, 'c');
      if (c) {
        priceFrom020 = c.replace(/^[\s:;=,-]+/, '').replace(/[\s:;=,-]+$/, '').replace(/\.$/, '').trim();
        if (priceFrom020) break;
      }
    }
    const finalPrice541 = priceFrom020 || item.price_541 || item.price || '-';
    if (finalPrice541 && finalPrice541 !== '-') {
      const formattedPriceStr = finalPrice541.includes('บาท') || finalPrice541.includes('บ.') ? finalPrice541 : `${finalPrice541} บาท`;
      const idx541 = rawMarcList.findIndex(t => t.tagID === '541');
      if (idx541 >= 0) {
        rawMarcList[idx541].data = `$c${formattedPriceStr}`;
      } else {
        const insIdx = rawMarcList.findIndex(t => parseInt(t.tagID, 10) >= 600);
        const tag541Obj = { tagID: '541', indc1: '', indc2: '', data: `$c${formattedPriceStr}` };
        if (insIdx >= 0) rawMarcList.splice(insIdx, 0, tag541Obj);
        else rawMarcList.push(tag541Obj);
      }
    }

    const newRecord: Marc21Record = {
      id: `uctal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toLocaleDateString('th-TH'),
      col1: '',
      accession_no: accNo,
      isbn: item.isbn || '',
      author_personal: item.author && item.author !== '-' ? `${item.author}.` : (item.author_personal || '-'),
      author_corporate: item.author_corporate || '-',
      title_245a: cleanTitleObj.formatted245a,
      title_245b: cleanTitleObj.formatted245b,
      responsibility_245c: item.responsibility || item.responsibility_245c || item.author || 'ไม่ระบุผู้แต่ง',
      ddc_082a: ddcVal,
      cutter_082b: cutterVal,
      pub_place: (item.pubPlace || item.pub_place || 'กรุงเทพฯ').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim(),
      publisher: (item.publisher || 'ไม่ระบุสำนักพิมพ์').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim(),
      pub_year: item.pubYear || item.pub_year || '2565',
      pages_300a: (item.pages || item.pages_300a || '160 หน้า').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim(),
      illustration_300b: item.illustration_300b || 'ภาพประกอบ',
      subject_650a: item.subject || item.subject_650a || 'ทั่วไป',
      copies: (() => {
        const detectedCopy = calculateCopyNumber({
          accession_no: accNo,
          isbn: item.isbn || '',
          issn_022: item.issn_022 || '',
          title_245a: cleanTitleObj.formatted245a
        } as any, records, libraryBooks);
        return detectedCopy.totalCopies > 1 ? String(detectedCopy.copyNumber) : '1';
      })(),
      summary_520: item.summary || item.summary_520 || `หนังสือ "${item.title || item.title_245a}" จากฐานข้อมูลสหบรรณานุกรมสถาบันอุดมศึกษาไทย (UC-TAL)`,
      edition_250: item.edition_250 || 'พิมพ์ครั้งที่ 1',
      price_541: finalPrice541,
      series_490: item.series || item.series_490 || '-',
      added_entry_700: item.added_entry_700 || '-',
      acquisition_source: institutionName ? `สหบรรณานุกรม UC-TAL (${institutionSymbol})` : 'สั่งซื้อ',
      col2: '',
      source_type: 'สั่งชื้อ',
      storage_location: ddcVal.startsWith('ด') ? 'สำหรับเด็ก' : (ddcVal.startsWith('ย') ? 'เยาวชน' : 'หมวด ทั่วไป'),
      status: 'อยู่บนชั้น',
      col3: '',
      cover_image: item.coverImage || item.cover_image,
      search_source: searchSource,
      marc_tags: rawMarcList,

      // Extended MARC tags
      leader_000: item.leader_000 || '00933nam  2200289ua 4500',
      control_001: item.control_001 || `b${accNo.replace(/^0+/, '')}`,
      control_003: institutionSymbol ? `UCTAL-${institutionSymbol}` : (item.control_003 || 'UCTAL'),
      trans_005: item.trans_005 || (new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.0'),
      fixed_008: item.fixed_008 || `${new Date().getFullYear().toString().slice(2)}0101s${item.pubYear || item.pub_year || '2565'}    th a   j      000 1 tha d`,
      issn_022: item.issn_022 || '-',
      cat_source_040: catSource,
      language_041: item.language_041 || 'tha',
      title_varying_246: item.title_varying_246 || '-',
      dimensions_300c: (item.dimensions_300c || '20 ซม.').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim(),
      note_general_500: item.note_general_500 || '-',
      note_bib_504: item.note_bib_504 || '-',
      note_contents_505: item.note_contents_505 || '-',
      subject_person_600: item.subject_person_600 || '-',
      subject_corp_610: item.subject_corp_610 || '-',
      subject_uniform_630: item.subject_uniform_630 || '-',
      subject_geo_651: item.subject_geo_651 || '-',
      subject_650_2: item.subject_650_2 || '-',
      subject_650_3: item.subject_650_3 || '-',
      subject_650_4: item.subject_650_4 || '-',
      subject_650_5: item.subject_650_5 || '-',
      added_corp_710: item.added_corp_710 || '-',
      added_title_740: item.added_title_740 || '-',
      series_uniform_830: item.series_uniform_830 || item.series || item.series_490 || '-',
      electronic_856: item.electronic_856 || item.coverImage || item.cover_image || '-',
      local_907: institutionSymbol ? `b${accNo}-${institutionSymbol}` : (item.local_907 || `b${accNo}`)
    };

    setRecords(prev => [newRecord, ...prev]);
    setStartAccNum(runAcc + 1);
    syncRecordToCloud(newRecord);
    const copyBadge = parseInt(newRecord.copies, 10) > 1 ? ` (ฉบับที่ ${newRecord.copies})` : '';
    showToast(`✅ นำเข้าข้อมูลเล่ม "${newRecord.title_245a.substring(0, 30)}..."${copyBadge} ${institutionName ? `(สถาบัน: ${institutionName})` : ''} สู่ตารางครบถ้วนทุก MARC Tag เรียบร้อย!`);
  };

  // Batch items submit
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = batchQueries.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // Check if pasted lines contain TSV columns (e.g. copied from Excel/Sheets)
    const hasTsv = lines.some(l => l.includes('\t'));
    if (hasTsv) {
      const parsedRecords: Marc21Record[] = [];
      let nextAcc = startAccNum;
      const existingUsed = new Set(records.map(r => parseInt(r.accession_no, 10)).filter(n => !isNaN(n)));

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('\t').map(p => p.trim());

        let accNo = '';
        let isbn = '';
        let authorPersonal = '';
        let authorCorporate = '-';
        let title = '';

        if (parts.length >= 2) {
          if (/^(?:[0-9]{4,10}|B[0-9]{4,10})$/i.test(parts[0])) {
            accNo = parts[0];
          }
          for (const p of parts) {
            const clean = p.replace(/[^0-9X]/gi, '');
            if (clean.length === 10 || clean.length === 13) {
              isbn = clean;
              break;
            }
          }
          if (parts.length >= 3 && parts[2] !== '-') {
            authorPersonal = parts[2];
          }
          if (parts.length >= 4 && parts[3] !== '-') {
            authorCorporate = parts[3];
          }
          if (parts.length >= 5) {
            title = parts[4];
          } else if (parts.length >= 4 && parts[3] !== '-') {
            title = parts[3];
          } else {
            title = parts[parts.length - 1];
          }
        }

        if (!accNo) {
          while (nextAcc <= 2612 || existingUsed.has(nextAcc)) {
            nextAcc++;
          }
          accNo = String(nextAcc).padStart(10, '0');
          existingUsed.add(nextAcc);
          nextAcc++;
        }

        const authorGuess = authorPersonal || (authorCorporate !== '-' ? authorCorporate : 'ไม่ระบุผู้แต่ง');
        const titleClean = title || line;
        const cutterGuess = generateThaiCutter(authorGuess, titleClean);
        const ddcGuess = isbn ? '000' : (titleClean.includes('นิทาน') ? 'ด' : (titleClean.includes('การ์ตูน') ? 'ย' : '000'));

        const newRec: Marc21Record = {
          id: `rec_tsv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          date: new Date().toLocaleDateString('th-TH'),
          col1: '',
          accession_no: accNo.padStart(10, '0'),
          isbn: isbn,
          author_personal: authorPersonal ? `${authorPersonal.replace(/\.$/, '')}.` : '-',
          author_corporate: authorCorporate,
          title_245a: titleClean,
          title_245b: '-',
          responsibility_245c: authorGuess,
          ddc_082a: ddcGuess,
          cutter_082b: cutterGuess,
          pub_place: 'กรุงเทพฯ',
          publisher: 'ไม่ระบุสำนักพิมพ์',
          pub_year: '2567',
          pages_300a: '160 หน้า',
          illustration_300b: 'ภาพประกอบ',
          subject_650a: 'ทั่วไป',
          copies: '1',
          summary_520: `รายการบรรณานุกรม ${titleClean}`,
          edition_250: 'พิมพ์ครั้งที่ 1',
          price_541: '-',
          series_490: '-',
          added_entry_700: '-',
          acquisition_source: 'สั่งซื้อ',
          col2: '',
          source_type: 'สั่งชื้อ',
          storage_location: ddcGuess === 'ด' ? 'สำหรับเด็ก' : (ddcGuess === 'ย' ? 'เยาวชน' : 'หมวด ทั่วไป'),
          status: 'อยู่บนชั้น',
          col3: '',
          search_source: 'นำเข้าจากข้อมูลที่วาง (TSV/Excel)'
        };
        parsedRecords.push(newRec);
      }

      setRecords(prev => [...parsedRecords, ...prev]);
      setStartAccNum(nextAcc);
      syncBatchToCloud(parsedRecords);
      showToast(`✨ นำเข้าข้อมูลตารางสำเร็จ ${parsedRecords.length} รายการ (รักษาเลขทะเบียนเดิมและ ISBN ซ้ำได้สมบูรณ์)`);
      setBatchQueries('');
      setIsBatchOpen(false);
      return;
    }

    handleGenerate(lines);
  };

  // Row selection
  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length && records.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  // Sorting state for Accession No. (ACC)
  const [accSortOrder, setAccSortOrder] = useState<'asc' | 'desc' | null>(null);

  const handleSortByAccession = (direction: 'asc' | 'desc') => {
    setAccSortOrder(direction);
    setCurrentPage(1);
    setRecords(prev => {
      const sorted = [...prev].sort((a, b) => {
        const numA = parseInt(a.accession_no || '', 10);
        const numB = parseInt(b.accession_no || '', 10);
        const validA = !isNaN(numA);
        const validB = !isNaN(numB);

        if (validA && validB) {
          return direction === 'asc' ? numA - numB : numB - numA;
        }
        const strA = String(a.accession_no || '');
        const strB = String(b.accession_no || '');
        return direction === 'asc'
          ? strA.localeCompare(strB, undefined, { numeric: true })
          : strB.localeCompare(strA, undefined, { numeric: true });
      });
      return sorted;
    });
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    showToast(
      direction === 'asc'
        ? '🔢 เรียงเลขทะเบียนจาก น้อยไปมาก (น้อย ➜ มาก) เรียบร้อยแล้ว'
        : '🔢 เรียงเลขทะเบียนจาก มากไปน้อย (มาก ➜ น้อย) เรียบร้อยแล้ว'
    );
  };

  // Table Pagination & Quick Search States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [jumpInputPage, setJumpInputPage] = useState<string>('1');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Filter records based on table search query (Accession No, title, author, isbn, cutter, etc.)
  const filteredRecords = React.useMemo(() => {
    if (!tableSearchTerm.trim()) return records;
    const q = tableSearchTerm.trim().toLowerCase();
    return records.filter(r => {
      return (
        (r.accession_no && r.accession_no.toLowerCase().includes(q)) ||
        (r.title_245a && r.title_245a.toLowerCase().includes(q)) ||
        (r.title_245b && r.title_245b.toLowerCase().includes(q)) ||
        (r.author_personal && r.author_personal.toLowerCase().includes(q)) ||
        (r.author_corporate && r.author_corporate.toLowerCase().includes(q)) ||
        (r.isbn && r.isbn.toLowerCase().includes(q)) ||
        (r.ddc_082a && r.ddc_082a.toLowerCase().includes(q)) ||
        (r.cutter_082b && r.cutter_082b.toLowerCase().includes(q)) ||
        (r.publisher && r.publisher.toLowerCase().includes(q)) ||
        (r.pub_year && r.pub_year.toLowerCase().includes(q))
      );
    });
  }, [records, tableSearchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

  // Sync jump input and clamp page
  useEffect(() => {
    setJumpInputPage(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
    if (currentPage > maxP) {
      setCurrentPage(maxP);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [filteredRecords.length, pageSize, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRecords.length);
  const paginatedRecords = React.useMemo(() => {
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, startIndex, endIndex]);

  const isAllCurrentPageSelected = React.useMemo(() => {
    return paginatedRecords.length > 0 && paginatedRecords.every(r => selectedIds.has(r.id));
  }, [paginatedRecords, selectedIds]);

  const toggleSelectCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedRecords.map(r => r.id));
      setSelectedIds(prev => new Set([...prev].filter(id => !pageIds.has(id))));
    } else {
      setSelectedIds(prev => new Set([...prev, ...paginatedRecords.map(r => r.id)]));
    }
  };

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPaginationGroup = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const left = currentPage - delta;
    const right = currentPage + delta + 1;
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        if (l !== undefined) {
          if (i - l === 2) {
            range.push(l + 1);
          } else if (i - l !== 1) {
            range.push('...');
          }
        }
        range.push(i);
        l = i;
      }
    }
    return range;
  };

  // Get exact content as displayed in table cells for copying/exporting
  const getRecordCellText = (r: Marc21Record, key: string): string => {
    if (key === 'responsibility_245c') {
      return formatAuthorList245c(r.responsibility_245c, r.author_personal);
    }
    if (key === 'added_entry_700') {
      return formatAddedEntry700(r.added_entry_700);
    }
    if (key === 'storage_location') {
      return r.storage_location || 'สำหรับเด็ก';
    }
    if (key === 'subject_650a') {
      const rawVal = r.subject_650a;
      if (rawVal && rawVal !== '-') return rawVal;
      const { subjects } = extractAllSubjectsAndDdc(r);
      return subjects[0] || 'ทั่วไป';
    }
    if (key === 'subject_650_2' || key === 'subject_650_3' || key === 'subject_650_4' || key === 'subject_650_5') {
      const subIdx = key === 'subject_650_2' ? 2 : key === 'subject_650_3' ? 3 : key === 'subject_650_4' ? 4 : 5;
      const rawVal = (r as any)[key];
      if (rawVal && rawVal !== '-') {
        return rawVal;
      }
      const { subjects } = extractAllSubjectsAndDdc(r);
      const extracted = subjects[subIdx - 1];
      if (extracted && extracted !== '-') {
        return extracted;
      }
      return '-';
    }
    if (key === 'copies') {
      const copyInfo = recordCopyNumberMap.get(r.id) || calculateCopyNumber(r, records, libraryBooks);
      return String(copyInfo.copyNumber || r.copies || '1');
    }
    if (key === 'status') {
      return r.status || 'อยู่บนชั้น';
    }
    const val = (r as any)[key];
    if (val === undefined || val === null) return '';
    return String(val);
  };

  // Convert record to TSV string for easy pasting into Excel / Sheets (From Date to Column 3 EXTRA2)
  const recordToTsvRow = (r: Marc21Record): string => {
    return PRIMARY_COPY_COLUMNS.map(c => {
      const val = getRecordCellText(r, c.key);
      return String(val).replace(/\t/g, ' ').replace(/\n/g, ' ');
    }).join('\t');
  };

  // Dedicated AI Book Summary Search (Tag 520 เรื่องย่อ) from Book Title
  const handleFetchAiSummary = async (options: {
    title: string;
    author?: string;
    isbn?: string;
    target: 'modal' | 'row';
    rowId?: string;
  }) => {
    const { title, author = '', isbn = '', target, rowId } = options;
    const cleanTitle = (title || '').split('/')[0].split('=')[0].replace(/[\/:]\s*$/, '').trim();
    if (!cleanTitle) {
      showToast('⚠️ กรุณาระบุชื่อหนังสือเพื่อค้นหาเรื่องย่อด้วย AI');
      return;
    }

    if (target === 'modal') {
      setIsAiSummaryLoading(true);
    } else if (rowId) {
      setRowSummaryLoadingId(rowId);
    }

    try {
      const res = await fetch('/api/search-book-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          author: author && author !== '-' ? author : '',
          isbn: isbn || ''
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.summary) {
        const generatedSummary = data.summary.trim();

        if (target === 'modal') {
          setEditingRecord(prev => {
            if (!prev) return null;
            let updatedTags = Array.isArray(prev.marc_tags) ? [...prev.marc_tags] : [];
            const idx520 = updatedTags.findIndex(t => t.tagID === '520' || (t as any).tag === '520');
            if (idx520 >= 0) {
              updatedTags[idx520] = { ...updatedTags[idx520], data: `$a${generatedSummary}` };
            } else {
              const insIdx = updatedTags.findIndex(t => parseInt(t.tagID || (t as any).tag, 10) >= 600);
              const tag520 = { tagID: '520', indc1: '', indc2: '', data: `$a${generatedSummary}` };
              if (insIdx >= 0) updatedTags.splice(insIdx, 0, tag520);
              else updatedTags.push(tag520);
            }
            return {
              ...prev,
              summary_520: generatedSummary,
              marc_tags: updatedTags
            };
          });
          showToast('✨ AI ค้นหาและบันทึกเรื่องย่อเรียบร้อยแล้ว');
        } else if (target === 'row' && rowId) {
          setRecords(prev => prev.map(rec => {
            if (rec.id === rowId) {
              let updatedTags = Array.isArray(rec.marc_tags) ? [...rec.marc_tags] : [];
              const idx520 = updatedTags.findIndex(t => t.tagID === '520' || (t as any).tag === '520');
              if (idx520 >= 0) {
                updatedTags[idx520] = { ...updatedTags[idx520], data: `$a${generatedSummary}` };
              } else {
                const insIdx = updatedTags.findIndex(t => parseInt(t.tagID || (t as any).tag, 10) >= 600);
                const tag520 = { tagID: '520', indc1: '', indc2: '', data: `$a${generatedSummary}` };
                if (insIdx >= 0) updatedTags.splice(insIdx, 0, tag520);
                else updatedTags.push(tag520);
              }
              return {
                ...rec,
                summary_520: generatedSummary,
                marc_tags: updatedTags
              };
            }
            return rec;
          }));

          // Background sync to database
          try {
            await supabase
              .from('marc21_records')
              .update({ summary_520: generatedSummary, updated_at: new Date().toISOString() })
              .eq('id', rowId);
          } catch {}

          showToast('✨ AI ดึงเรื่องย่อลงตารางสำเร็จ');
        }
      } else {
        showToast(`⚠️ ${data.error || 'ไม่พบเรื่องย่อของหนังสือเล่มนี้'}`);
      }
    } catch (err: any) {
      console.error('[AI Summary Search Error]:', err);
      showToast('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อบริการ AI ค้นหาเรื่องย่อ');
    } finally {
      if (target === 'modal') {
        setIsAiSummaryLoading(false);
      } else {
        setRowSummaryLoadingId(null);
      }
    }
  };

  // Open edit modal with ALL 650 subjects extracted from record or marc_tags (no limit of 3)
  const handleStartEdit = (r: Marc21Record) => {
    const { subjects } = extractAllSubjectsAndDdc(r);
    const s1 = subjects[0] || (r.subject_650a && r.subject_650a !== '-' ? r.subject_650a : '') || '';
    const s2 = subjects[1] || (r.subject_650_2 && r.subject_650_2 !== '-' ? r.subject_650_2 : '') || '';
    const s3 = subjects[2] || (r.subject_650_3 && r.subject_650_3 !== '-' ? r.subject_650_3 : '') || '';
    const s4 = subjects[3] || (r.subject_650_4 && r.subject_650_4 !== '-' ? r.subject_650_4 : '') || '';
    const s5 = subjects[4] || (r.subject_650_5 && r.subject_650_5 !== '-' ? r.subject_650_5 : '') || '';
    const extra = subjects.slice(5);

    setEditModalTab('card');
    setEditingRecord({
      ...r,
      subject_650a: s1,
      subject_650_2: s2,
      subject_650_3: s3,
      subject_650_4: s4,
      subject_650_5: s5,
      extraSubjects: extra,
    });
  };

  // Copy single row (From Column Date วันที่ to Stat สถานะ)
  const handleCopyRow = (r: Marc21Record) => {
    setLastCopiedRow(r);
    const tsv = recordToTsvRow(r);
    navigator.clipboard.writeText(tsv).then(() => {
      showToast(`📋 คัดลอกแถว "${r.title_245a.substring(0, 30)}..." (คอลัมน์ Date วันที่ - Stat สถานะ) ลงคลิปบอร์ดแล้ว! พร้อมวางใน Excel หรือกดไอคอนวาง`);
    }).catch(() => {
      showToast(`📋 คัดลอกแถว "${r.title_245a.substring(0, 30)}..." เรียบร้อย`);
    });
  };

  // Paste copied row data into target row
  const handlePasteRow = async (targetRecordId: string) => {
    let sourceData: Partial<Marc21Record> | null = lastCopiedRow ? { ...lastCopiedRow } : null;

    // Try reading from clipboard if possible
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          const parts = clipText.trim().split('\t');
          if (parts.length >= PRIMARY_COPY_COLUMNS.length) {
            const parsedData: Record<string, any> = {};
            PRIMARY_COPY_COLUMNS.forEach((col, idx) => {
              if (col.key !== 'accession_no') {
                parsedData[col.key] = parts[idx] || '';
              }
            });
            sourceData = parsedData;
          } else if (parts.length >= 10) {
            sourceData = {
              date: parts[0] || '',
              col1: parts[1] || '',
              isbn: parts[3] || '',
              author_personal: parts[4] || '',
              author_corporate: parts[5] || '',
              title_245a: parts[6] || '',
              title_245b: parts[7] || '',
              responsibility_245c: parts[8] || '',
              ddc_082a: parts[9] || '',
              cutter_082b: parts[10] || '',
              pub_place: parts[11] || '',
              publisher: parts[12] || '',
              pub_year: parts[13] || '',
              pages_300a: parts[14] || '',
              illustration_300b: parts[15] || '',
              subject_650a: parts[16] || '',
              copies: parts[17] || '1',
              summary_520: parts[18] || '',
              edition_250: parts[19] || 'พิมพ์ครั้งที่ 1',
              price_541: parts[20] || '',
              series_490: parts[21] || '',
              added_entry_700: parts[22] || '-',
              acquisition_source: parts[23] || 'บริจาค',
              col2: parts[24] || '',
              source_type: parts[25] || '',
              storage_location: parts[26] || 'สำหรับเด็ก',
              status: parts[27] || 'มีอยู่'
            };
          }
        }
      }
    } catch (err) {
      // Fallback to lastCopiedRow
    }

    if (!sourceData) {
      showToast('⚠️ ยังไม่มีข้อมูลที่คัดลอก กรุณากดไอคอนคัดลอกแถวก่อนวาง');
      return;
    }

    setRecords(prev => prev.map(r => {
      if (r.id !== targetRecordId) return r;
      const updated: Marc21Record = {
        ...r,
        ...sourceData,
        id: r.id, // Preserve original unique row ID
        accession_no: r.accession_no // Preserve original accession number
      };
      return updated;
    }));

    showToast('📋 วางข้อมูลที่คัดลอกลงในแถวนี้เรียบร้อยแล้ว');
  };

  // Copy selected rows (From Date วันที่ to Stat สถานะ รวมหัวเรื่อง 1-5)
  const handleCopySelected = () => {
    const targetRows = records.filter(r => selectedIds.has(r.id));
    if (targetRows.length === 0) {
      showToast('⚠️ กรุณาเลือกแถวที่ต้องการคัดลอกอย่างน้อย 1 รายการ');
      return;
    }
    const headerLine = PRIMARY_COPY_COLUMNS.map(c => c.label.replace(/\n/g, ' ')).join('\t');
    const rowsTsv = targetRows.map(recordToTsvRow).join('\n');
    const fullTsv = copyIncludeHeaders ? `${headerLine}\n${rowsTsv}` : rowsTsv;
    navigator.clipboard.writeText(fullTsv).then(() => {
      showToast(`📋 คัดลอก ${targetRows.length} รายการที่เลือก (คอลัมน์ Date วันที่ - Stat สถานะ รวมหัวเรื่อง 1-5${copyIncludeHeaders ? ' พร้อมหัวตาราง' : ''}) ลงคลิปบอร์ดแล้ว! พร้อมวางใน Excel`);
    });
  };

  // Shared helper to cleanly sync/upsert a Marc21Record to Supabase with automatic deduplication
  const syncBookRecordToSupabase = async (r: Marc21Record) => {
    const cleanTitle = r.title_245a.split(' / ')[0].trim();
    const cleanAuthor = ((r.author_personal && r.author_personal !== '-') ? r.author_personal : (r.author_corporate && r.author_corporate !== '-' ? r.author_corporate : '')).replace(/\.$/, '').trim();
    const cleanIsbn = r.isbn ? r.isbn.trim() : '';

    // 1. Resolve or reuse stable database primary key based on accession number
    let targetBookId = r.db_id || '';
    const rawAcc = String(r.accession_no || '').trim();
    const cleanAcc = rawAcc.replace(/^0+/, '') || rawAcc;

    if (!targetBookId && rawAcc) {
      // Check if this specific accession number already exists in database
      const { data: accMatches } = await supabase
        .from('books')
        .select('id')
        .or(`accession_no.eq.${rawAcc},barcode.eq.${rawAcc}`)
        .limit(1);
      if (accMatches && accMatches.length > 0) {
        targetBookId = accMatches[0].id;
      } else {
        targetBookId = `book_reg_${cleanAcc}`;
      }
    }

    if (!targetBookId) {
      targetBookId = `book_reg_${cleanAcc || (cleanIsbn ? `${cleanIsbn}_${Date.now()}` : `${Date.now()}`)}`;
    }

    r.db_id = targetBookId;

    // Extract all subject headings across all sources without limitation
    const { subjects: allExtracted650s } = extractAllSubjectsAndDdc(r);
    const all650s: string[] = allExtracted650s;

    const combinedSubject = all650s.length > 0 ? all650s.join(' ; ') : (r.subject_650a || 'ทั่วไป');
    const s1 = all650s[0] || (r.subject_650a && r.subject_650a !== '-' ? r.subject_650a : '') || '';
    const s2 = all650s[1] || (r.subject_650_2 && r.subject_650_2 !== '-' ? r.subject_650_2 : '') || '';
    const s3 = all650s[2] || (r.subject_650_3 && r.subject_650_3 !== '-' ? r.subject_650_3 : '') || '';

    const payload = {
      id: targetBookId,
      title: cleanTitle,
      subtitle: r.title_245b || '',
      author: cleanAuthor,
      isbn: cleanIsbn,
      barcode: formatAccessionNo(r.accession_no),
      accession_no: formatAccessionNo(r.accession_no),
      publisher: r.publisher,
      publication_place: r.pub_place,
      publication_year: r.pub_year,
      pages: r.pages_300a,
      ddc: r.ddc_082a,
      call_number: `${r.ddc_082a} ${r.cutter_082b}`.trim(),
      category: r.storage_location || r.subject_650a || 'ทั่วไป',
      subject: combinedSubject,
      subject_2: s2,
      subject_3: s3,
      subject_650a: s1,
      subject_650_2: s2,
      subject_650_3: s3,
      all650Subjects: all650s,
      marc_tags: r.marc_tags || [],
      cover_image: r.cover_image || (r.electronic_856 && r.electronic_856.startsWith('http') ? r.electronic_856 : ''),
      dimensions_300c: r.dimensions_300c || '',
      book_size: r.dimensions_300c || '',
      storage_location: r.storage_location || 'NCILibrary',
      description: r.summary_520,
      status: r.status,
      edition: r.edition_250,
      price: r.price_541,
      series: r.series_490,
      translator: r.added_entry_700 !== '-' ? r.added_entry_700 : '',
      illustration: r.illustration_300b,
      updated_at: new Date().toISOString()
    };

    // Clean payload strictly matching Supabase table columns so upsert NEVER fails
    const supabasePayload = {
      id: targetBookId,
      title: cleanTitle,
      subtitle: r.title_245b || null,
      author: cleanAuthor,
      isbn: cleanIsbn || null,
      barcode: formatAccessionNo(r.accession_no) || null,
      accession_no: formatAccessionNo(r.accession_no) || null,
      publisher: r.publisher || null,
      publication_place: r.pub_place || null,
      publication_year: r.pub_year || null,
      pages: r.pages_300a || null,
      ddc: r.ddc_082a || null,
      call_number: `${r.ddc_082a || ''} ${r.cutter_082b || ''}`.trim() || null,
      category: r.storage_location || r.subject_650a || 'ทั่วไป',
      subject: combinedSubject,
      keywords: [cleanTitle, cleanAuthor, ...all650s, r.publisher].filter(Boolean).join(', '),
      description: r.summary_520 || null,
      status: r.status || 'พร้อมให้บริการ',
      edition: r.edition_250 || null,
      price: r.price_541 || null,
      series: r.series_490 || null,
      translator: (r.added_entry_700 && r.added_entry_700 !== '-') ? r.added_entry_700 : null,
      illustration: r.illustration_300b || null,
      cover_image: r.cover_image || (r.electronic_856 && r.electronic_856.startsWith('http') ? r.electronic_856 : null),
      updated_at: payload.updated_at
    };

    // 2. Upsert clean payload into Supabase (each accession_no is a distinct copy)
    try {
      const { error: sbErr } = await supabase.from('books').upsert(supabasePayload, { onConflict: 'id' });
      if (sbErr) {
        console.warn('[Supabase Sync] Note:', sbErr.message);
      }
    } catch (sbEx) {
      console.warn('[Supabase Sync] Upsert exception:', sbEx);
    }

    // 4. ALSO POST to Express Server API so it instantly updates server cache and broadcasts real-time
    try {
      await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {
      console.warn('Backup Express API sync note:', apiErr);
    }

    return payload;
  };

  // Save selected records (or all if none selected) to Supabase database
  const handleSaveSelectedToDatabase = async () => {
    const targetRows = selectedIds.size > 0 
      ? records.filter(r => selectedIds.has(r.id))
      : records;

    if (targetRows.length === 0) {
      showToast('⚠️ กรุณาเลือกรายการที่ต้องการบันทึกลงฐานข้อมูลอย่างน้อย 1 รายการ');
      return;
    }

    setIsLoading(true);
    setStatusMessage(`กำลังบันทึกข้อมูล ${targetRows.length} รายการลงฐานข้อมูลห้องสมุด...`);
    let count = 0;
    try {
      for (const r of targetRows) {
        await syncBookRecordToSupabase(r);
        count++;
      }
      await syncBatchToCloud(targetRows);
      showToast(`💾 บันทึกรายการ ${count} เล่ม ลงฐานข้อมูลห้องสมุดและตาราง MARC 21 เรียบร้อยแล้ว!`);
      if (onBookAddedToLibrary) onBookAddedToLibrary();
    } catch (err: any) {
      showToast(`⚠️ เกิดข้อผิดพลาดในการบันทึก: ${err?.message || err}`);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // Trigger Delete Selected Confirmation
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) {
      showToast('⚠️ กรุณาเลือกรายการที่ต้องการลบอย่างน้อย 1 รายการ');
      return;
    }
    setDeleteConfirmTarget('selected');
  };

  // Perform actual deletion of selected records after confirmation
  const confirmDeleteSelectedExecution = () => {
    const deletedCount = selectedIds.size;
    const idsToDelete = Array.from(selectedIds);
    setRecords(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    setDeleteConfirmTarget(null);
    deleteBatchFromCloud(idsToDelete);
    showToast(`🗑️ ลบรายการที่เลือกจำนวน ${deletedCount} รายการเรียบร้อยแล้ว`);
  };

  // Copy all rows (From Column Date วันที่ to Stat สถานะ รวมหัวเรื่อง 1-5)
  const handleCopyAll = (forcedHeaders?: boolean) => {
    if (records.length === 0) {
      showToast('⚠️ ไม่มีข้อมูลในตารางสำหรับคัดลอก');
      return;
    }
    const shouldIncludeHeaders = typeof forcedHeaders === 'boolean' ? forcedHeaders : copyIncludeHeaders;
    const headerLine = PRIMARY_COPY_COLUMNS.map(c => c.label.replace(/\n/g, ' ')).join('\t');
    const rowsTsv = records.map(recordToTsvRow).join('\n');
    const fullTsv = shouldIncludeHeaders ? `${headerLine}\n${rowsTsv}` : rowsTsv;

    navigator.clipboard.writeText(fullTsv).then(() => {
      showToast(`📋 คัดลอกข้อมูลทั้งหมด ${records.length} แถว (คอลัมน์ Date วันที่ - Stat สถานะ รวมหัวเรื่อง 1-5${shouldIncludeHeaders ? ' พร้อมหัวตาราง' : ''}) ลงคลิปบอร์ดสำเร็จ! พร้อมวางใน Excel`);
    });
  };

  // Export to Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    if (records.length === 0) {
      showToast('⚠️ ไม่มีข้อมูลสำหรับดาวน์โหลด');
      return;
    }

    const header = MARC21_COLUMNS.map(c => c.label);
    const dataRows = records.map(r => MARC21_COLUMNS.map(c => getRecordCellText(r, c.key)));

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MARC21_Catalog');

    const fileName = `MARC21_Catalog_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    showToast(`📥 ดาวน์โหลดไฟล์ Excel "${fileName}" (ครบทุก MARC Tag) เรียบร้อยแล้ว!`);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (records.length === 0) {
      showToast('⚠️ ไม่มีข้อมูลสำหรับดาวน์โหลด');
      return;
    }
    const header = MARC21_COLUMNS.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const rows = records.map(r => {
      return MARC21_COLUMNS.map(c => `"${String(getRecordCellText(r, c.key)).replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    // UTF-8 BOM for Thai support in Microsoft Excel
    const blob = new Blob(['\uFEFF' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MARC21_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 ดาวน์โหลดไฟล์ CSV ภาษาไทย (ครบทุก MARC Tag) เรียบร้อยแล้ว!');
  };

  // Duplicate accession detection in current table
  const duplicateAccMap = React.useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => {
      const num = parseInt(r.accession_no, 10);
      const clean = !isNaN(num) ? String(num) : (r.accession_no?.trim() || '');
      if (clean) counts[clean] = (counts[clean] || 0) + 1;
    });
    return counts;
  }, [records]);

  const hasDuplicateOrInvalidAcc = React.useMemo(() => {
    return records.some(r => {
      const num = parseInt(r.accession_no, 10);
      const clean = !isNaN(num) ? String(num) : (r.accession_no?.trim() || '');
      return (duplicateAccMap[clean] || 0) > 1;
    });
  }, [records, duplicateAccMap]);

  // Re-number all records sequentially starting from custom startAccNum
  const handleAutoRenumber = (customStart?: number) => {
    if (records.length === 0) {
      showToast('⚠️ ไม่มีข้อมูลในตารางสำหรับจัดเรียงเลขทะเบียน');
      return;
    }
    const base = customStart !== undefined && !isNaN(customStart) ? customStart : startAccNum;
    const updated = records.map((r, i) => ({
      ...r,
      accession_no: String(base + i).padStart(10, '0')
    }));
    setRecords(updated);
    setStartAccNum(base + records.length);
    syncBatchToCloud(updated);
    showToast(`🔢 จัดเรียงเลขทะเบียนใหม่ ${records.length} แถว (เริ่ม ${String(base).padStart(10, '0')} ต่อเนื่อง ไม่มีเลขซ้ำ) สำเร็จ!`);
  };

  // Add empty row
  const handleAddEmptyRow = () => {
    const used = new Set(records.map(r => parseInt(r.accession_no, 10)).filter(n => !isNaN(n)));
    let nextNum = startAccNum;
    while (used.has(nextNum)) {
      nextNum++;
    }
    const nextAcc = String(nextNum).padStart(10, '0');
    const newRecord: Marc21Record = {
      id: `manual_${Date.now()}`,
      date: new Date().toLocaleDateString('th-TH'),
      col1: '',
      accession_no: nextAcc,
      isbn: '',
      author_personal: '',
      author_corporate: '-',
      title_245a: '',
      title_245b: '',
      responsibility_245c: '',
      ddc_082a: '',
      cutter_082b: '',
      pub_place: 'กรุงเทพฯ',
      publisher: '',
      pub_year: '2567',
      pages_300a: '',
      illustration_300b: 'ภาพประกอบ',
      subject_650a: '',
      copies: '1',
      summary_520: '',
      edition_250: 'พิมพ์ครั้งที่ 1',
      price_541: '-',
      series_490: '-',
      added_entry_700: '-',
      acquisition_source: 'สั่งซื้อ',
      col2: '',
      source_type: 'สั่งชื้อ',
      storage_location: 'หมวด 100',
      status: 'อยู่บนชั้น',
      col3: ''
    };
    setRecords(prev => [newRecord, ...prev]);
    setStartAccNum(nextNum + 1);
    setEditingRecord(newRecord);
    syncRecordToCloud(newRecord);
  };

  // Delete row immediately without showing any confirmation dialog
  const handleDeleteRow = async (id: string) => {
    const target = records.find(r => r.id === id);
    setRecords(prev => prev.filter(r => r.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (target) {
      const bookId = target.db_id || `book_reg_${target.accession_no.replace(/^0+/, '') || target.isbn || ''}`;
      try {
        await supabase.from('books').delete().eq('id', bookId);
        await supabase.from('book_customizations').delete().eq('id', bookId);
        await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
      } catch {}
    }

    deleteRecordFromCloud(id);
    showToast('🗑️ ลบแถวเรียบร้อยแล้ว');
  };

  // Sync to Supabase (Both books and marc21_records)
  const handleSyncToLibrary = async (r: Marc21Record) => {
    try {
      const payload = await syncBookRecordToSupabase(r);
      const marcSuccess = await syncRecordToCloud(r);
      if (marcSuccess) {
        showToast(`💾 บันทึกเล่ม "${payload.title}" เข้าสู่ระบบห้องสมุด (books) และตาราง marc21_records บน Supabase เรียบร้อยแล้ว!`);
      } else {
        showToast(`⚠️ บันทึกลงตาราง books สำเร็จ แต่ตาราง marc21_records ไม่สำเร็จ (กรุณาตรวจเช็คคอลัมน์ SQL หรือสิทธิ์ RLS ในปุ่มตั้งค่า Supabase)`);
      }
      if (onBookAddedToLibrary) onBookAddedToLibrary();
    } catch (e: any) {
      showToast(`⚠️ เกิดข้อผิดพลาดในการบันทึก: ${e.message}`);
    }
  };
  // Handle selecting DDC code from DDC Modal
  const handleSelectDdcFromModal = (ddcCode: string, nameTh: string) => {
    if (editingRecord) {
      setEditingRecord(prev => {
        if (!prev) return null;
        let updatedTags = Array.isArray(prev.marc_tags) ? [...prev.marc_tags] : [];
        const idx082 = updatedTags.findIndex(t => t.tagID === '082' || (t as any).tag === '082');
        const tag082Data = `$a${ddcCode}$b${prev.cutter_082b || ''}`;
        if (idx082 >= 0) {
          updatedTags[idx082] = { ...updatedTags[idx082], data: tag082Data };
        } else {
          const insIdx = updatedTags.findIndex(t => parseInt(t.tagID || (t as any).tag, 10) >= 100);
          const tag082Obj = { tagID: '082', indc1: '0', indc2: '4', data: tag082Data };
          if (insIdx >= 0) updatedTags.splice(insIdx, 0, tag082Obj);
          else updatedTags.push(tag082Obj);
        }
        return {
          ...prev,
          ddc_082a: ddcCode,
          marc_tags: updatedTags
        };
      });
      showToast(`✨ ใส่เลขหมวด DDC "${ddcCode} (${nameTh})" ลงในระเบียนที่กำลังแก้ไขเรียบร้อยแล้ว`);
    } else {
      navigator.clipboard.writeText(ddcCode);
      showToast(`📋 คัดลอกเลขหมวด DDC "${ddcCode} (${nameTh})" ลงในคลิปบอร์ดเรียบร้อยแล้ว!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-sm font-medium animate-bounce">
          <Check className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI MARC 21 Cataloging & Excel Generator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              สร้างรายการบรรณานุกรมอัตโนมัติ (MARC 21)
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              สืบค้นข้อมูลหนังสือด้วย ISBN หรือชื่อเรื่อง ผ่าน Google Grounding, ฐานข้อมูลห้องสมุดสถาบันอุดมศึกษา Z39.50 / SRU, TK Park OPAC และหอสมุดแห่งชาติ แล้วถอดรหัสเป็นตาราง Excel มาตรฐาน MARC 21 ครบ 29 คอลัมน์
            </p>

            {/* Supported Data Sources Pill */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
              <a
                href="https://uc.thailis.or.th"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 flex items-center gap-1 hover:bg-emerald-500/50 transition font-bold"
                title="เข้าสู่ระบบสหบรรณานุกรมห้องสมุดสถาบันอุดมศึกษาไทย (UC-TAL)"
              >
                <span>🇹🇭 สหบรรณานุกรมสถาบันอุดมศึกษาไทย (UC-TAL / ThaiLIS)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDdcModalOpen(true)}
              className="px-3.5 py-2.5 bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md border border-amber-400/40 transition flex items-center gap-2 shadow-sm cursor-pointer"
              title="ระบบและคู่มือการจัดหมวดหมู่แบบทศนิยมดิวอี้ (Dewey Decimal Classification - DDC)"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>การจัดหมวดหมู่ดิวอี้ (DDC)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSubjectHeadingsModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md border border-emerald-400/40 transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Tags className="w-4 h-4 text-emerald-300" />
              <span>หัวเรื่อง (tag650)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCutterTableOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md border border-emerald-400/40 transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>ตารางเลขคัตเตอร์ (TK, จุฬา, มอ.)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Duplicate / Invalid Alert Banner */}
      {hasDuplicateOrInvalidAcc && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-medium animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>ตรวจพบเลขทะเบียนที่มีรายการซ้ำกันในตาราง</span>
          </div>
          <button
            onClick={() => handleAutoRenumber()}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
          >
            กดจัดเรียงใหม่ทันที
          </button>
        </div>
      )}

      {/* UC-TAL Services Search Box (Dedicated ThaiLIS https://uc.thailis.or.th Search Box) */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-indigo-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2" id="UC-heade-text">
                  <span>UC-TAL Search</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Web Services (REST)
                  </span>
                </h2>
              </div>
              <p className="text-xs text-indigo-200/80">
                สืบค้นข้อมูลบรรณานุกรมและแท็ก MARC 21 จากสหบรรณานุกรมสถาบันอุดมศึกษาไทย (<a href="https://uc.thailis.or.th" target="_blank" rel="noreferrer" className="underline hover:text-white">uc.thailis.or.th</a>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUctalPanelOpen(!isUctalPanelOpen)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              {isUctalPanelOpen ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>ซ่อนผลลัพธ์ ({uctalResults.length})</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>แสดงผลลัพธ์ ({uctalResults.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Inputs: Keyword & Library Scope Dropdown matching Image 1 */}
        <form onSubmit={handleSearchUctal} className="grid grid-cols-1 sm:grid-cols-12 gap-3" id="uctal-search">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="TxtUCsearch"
              value={uctalKeyword}
              onChange={(e) => setUctalKeyword(e.target.value)}
              placeholder="Enter keyword / ISBN / Title / Author (เช่น โต๊ะโตะจัง, สุดยอดความคิด, 9786160401628)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-slate-800 transition"
              disabled={isUctalLoading}
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={uctalRegion}
              onChange={(e) => setUctalRegion(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              disabled={isUctalLoading}
            >
              <option value="">All libraries (ทุกสถาบันอุดมศึกษา)</option>
              <option value="1">1=ภาคกลาง (กทม.และปริมณฑล: CU, TU, MU, SU, KU...)</option>
              <option value="2">2=ภาคเหนือ (CMU, CMRU, MJU...)</option>
              <option value="3">3=ภาคตะวันออกเฉียงเหนือ (KKU, MSU, UBU...)</option>
              <option value="4">4=ภาคใต้ (PSU, WU, TSU, SKRU...)</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              id="BtnUCsearch"
              disabled={isUctalLoading || !uctalKeyword.trim()}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isUctalLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>กำลังสืบค้น...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-slate-950" />
                  <span>ค้นหาใน UC-TAL</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* UC-TAL Results List */}
        {(isUctalPanelOpen || uctalResults.length > 0) && uctalResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-indigo-200">
              <span>ผลการสืบค้นจาก UC-TAL ทั้งหมด {uctalTotalFound ?? uctalResults.length} รายการ:</span>
              <span className="text-[11px] text-amber-300">กดปุ่ม "➕ นำเข้าตาราง MARC 21" เพื่อเพิ่มลงในตารางหลักทันที</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {uctalResults.map((item, i) => (
                <div
                  key={item.bibId || i}
                  className="p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl flex flex-col justify-between gap-3 hover:border-amber-400/60 transition shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {item.coverImage && item.coverImage.trim() !== '' ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-14 h-20 object-cover rounded-lg shadow-md border border-slate-700 shrink-0"
                        onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-14 h-20 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-400 text-xs shrink-0">
                        <BookOpen className="w-6 h-6 opacity-40" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-300 truncate">
                        <span className="text-slate-400">ผู้แต่ง:</span> {item.author || item.responsibility || '-'}
                      </p>
                      <p className="text-xs text-slate-300 truncate">
                        <span className="text-slate-400">สำนักพิมพ์:</span> {item.publisher || '-'} ({item.pubYear || '-'})
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                        {item.isbn && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-700 text-indigo-300 font-mono">
                            ISBN: {item.isbn}
                          </span>
                        )}
                        {item.ddc && item.ddc !== '000' && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
                            DDC: {item.ddc}
                          </span>
                        )}
                        {item.price_541 && item.price_541 !== '-' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono font-medium">
                            💰 541 ราคา: {item.price_541}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 font-bold">
                          🏛️ {item.librariesCount} มหาวิทยาลัย
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* University Holdings Interactive Chips */}
                  {Array.isArray(item.libraries) && item.libraries.length > 0 && (
                    <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-amber-300 flex items-center gap-1">
                          <span>🏛️</span>
                          <span>สถาบันที่ถือครอง ({item.libraries.length} สถาบัน):</span>
                        </span>
                        <span className="text-[10px] text-slate-400">คลิกที่ชื่อเพื่อดู MARC Tag เฉพาะแห่ง</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {item.libraries.map((lib: any, lIdx: number) => (
                          <button
                            key={lIdx}
                            type="button"
                            onClick={() => {
                              setSelectedHoldingLib(lib);
                              setViewingMarcDetail(item);
                            }}
                            title={`คลิกเพื่อดูและนำเข้า MARC Tag ของ ${lib.nameTh || ''} (${lib.symbol})`}
                            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-[11px] font-medium transition cursor-pointer border border-slate-700 flex items-center gap-1 group shadow-sm"
                          >
                            <span className="font-mono font-bold text-amber-300 group-hover:text-slate-950">{lib.symbol}</span>
                            <span className="truncate max-w-[140px]">{lib.nameTh || lib.nameEn}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHoldingLib(null);
                        setViewingMarcDetail(item);
                      }}
                      className="px-2.5 py-1.5 bg-slate-700/80 hover:bg-slate-600 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>ดู MARC Tag</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImportFromUctal(item)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>นำเข้าตาราง MARC 21</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSingleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์เลข ISBN (เช่น 9786160401628) หรือ ชื่อหนังสือ (เช่น สุดยอดความคิด 70 ยอดคน, โต๊ะโตะจัง)..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังค้นหา...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>สร้าง MARC21</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAddEmptyRow}
              title="เพิ่มแถวเปล่าในตารางเพื่อกรอกข้อมูลด้วยตนเอง"
              className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>เพิ่มแถวเปล่า</span>
            </button>
          </div>
        </form>

        {statusMessage && (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>



      {/* Accession Number Settings Control Bar */}
      <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-2xs">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
              <span>ตั้งค่าเลขทะเบียนหนังสือเริ่มต้น (Accession No. Config)</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full">
                ปรับเปลี่ยนเลขได้
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              กำหนดเลขทะเบียนสำหรับสร้างรายการถัดไป หรือกดปุ่มจัดเรียงเพื่อปรับลำดับเลขทะเบียนทุกแถวในตารางอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-800">เลขเริ่มต้น:</span>
            <input
              type="text"
              value={inputStartAcc}
              onChange={(e) => setInputStartAcc(e.target.value)}
              onBlur={() => {
                const parsed = parseInt(inputStartAcc, 10);
                if (!isNaN(parsed) && parsed >= 1) {
                  setStartAccNum(parsed);
                  localStorage.setItem('iabs_start_acc_num', String(parsed));
                } else {
                  setInputStartAcc(String(startAccNum).padStart(10, '0'));
                }
              }}
              placeholder="เช่น 2613"
              className="w-28 font-mono font-bold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-center"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const parsed = parseInt(inputStartAcc, 10);
              if (!isNaN(parsed) && parsed >= 1) {
                setStartAccNum(parsed);
                localStorage.setItem('iabs_start_acc_num', String(parsed));
                showToast(`🔢 บันทึกตั้งค่าเลขทะเบียนเริ่มต้นเป็น ${String(parsed).padStart(10, '0')} เรียบร้อยแล้ว`);
              } else {
                showToast('⚠️ กรุณาระบุเลขทะเบียนเริ่มต้นที่เป็นตัวเลขมากกว่า 0');
              }
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>ปรับเลขเริ่มต้น</span>
          </button>

          <button
            type="button"
            onClick={() => handleAutoRenumber()}
            disabled={records.length === 0}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1.5"
            title="จัดเรียงเลขทะเบียนหนังสือทุกแถวในตารางใหม่ตามลำดับเลขเริ่มต้น"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>เรียงเลขทะเบียนตารางใหม่ ({records.length})</span>
          </button>

        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            {selectedIds.size === records.length && records.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>เลือกทั้งหมด ({records.length})</span>
          </button>

          {records.length > pageSize && (
            <button
              onClick={toggleSelectCurrentPage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="เลือกหรือยกเลิกเลือกเฉพาะรายการในหน้านี้"
            >
              {isAllCurrentPageSelected ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>เลือกเฉพาะหน้านี้ ({paginatedRecords.length})</span>
            </button>
          )}

          {selectedIds.size > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
              เลือกอยู่ {selectedIds.size} รายการ
            </span>
          )}

          {/* Save selected to database button (icon-only) */}
          <button
            onClick={handleSaveSelectedToDatabase}
            disabled={records.length === 0}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition shadow-sm cursor-pointer"
            title={`บันทึกรายการที่เลือก (${selectedIds.size > 0 ? selectedIds.size : records.length}) ลงในฐานข้อมูลห้องสมุด`}
          >
            <Save className="w-4 h-4 text-white" />
          </button>

          {/* Delete selected button (icon-only) */}
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="p-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl transition shadow-sm cursor-pointer"
            title={`ลบรายการที่เลือก (${selectedIds.size}) ออกจากตาราง`}
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>

        </div>

        {/* Quick Table Search & Filter input */}
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={tableSearchTerm}
            onChange={(e) => {
              setTableSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ค้นหาในตาราง (เช่น 3040, 2984, ชื่อเรื่อง, ISBN)..."
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          {tableSearchTerm && (
            <button
              type="button"
              onClick={() => {
                setTableSearchTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="ล้างคำค้นหา"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Copy & Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopySelected}
            disabled={selectedIds.size === 0}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="คัดลอกเฉพาะแถวที่เลือก (Date ถึง Stat รวมหัวเรื่อง 1-5) เพื่อนำไปวางใน Excel"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>คัดลอกที่เลือก ({selectedIds.size})</span>
          </button>

          <button
            onClick={() => handleCopyAll()}
            disabled={records.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="คัดลอกข้อมูลทุกแถว (Date ถึง Stat รวมหัวเรื่อง 1-5) ลงคลิปบอร์ดแบบตาราง Excel"
          >
            <Copy className="w-3.5 h-3.5 text-amber-300" />
            <span>คัดลอกทั้งหมด ({records.length})</span>
          </button>

          <label
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer select-none transition shadow-2xs"
            title="ติ๊กเลือกหากต้องการให้คัดลอกแถวหัวคอลัมน์ (Date ถึง Stat รวมหัวเรื่อง 1-5) ติดไปด้วย"
          >
            <input
              type="checkbox"
              checked={copyIncludeHeaders}
              onChange={(e) => setCopyIncludeHeaders(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
            />
            <span>รวมหัวตาราง</span>
          </label>

          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

          <button
            onClick={handleExportExcel}
            disabled={records.length === 0}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="ส่งออกเป็นไฟล์ Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด Excel</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            title="ดาวน์โหลดเป็นไฟล์ CSV (UTF-8)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => {
              if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลในตารางทั้งหมด?')) {
                setRecords([]);
                setSelectedIds(new Set());
                deleteAllFromCloud();
                showToast('🧹 ล้างตารางเรียบร้อยแล้ว');
              }
            }}
            disabled={records.length === 0}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-30"
            title="ล้างข้อมูลทั้งหมด"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Pagination & Quick Nav Bar */}
      {records.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-700">
              แสดงรายการที่ <strong className="text-emerald-700 font-bold">{filteredRecords.length === 0 ? 0 : startIndex + 1} - {endIndex}</strong> จากทั้งหมด <strong className="text-slate-900 font-bold">{filteredRecords.length.toLocaleString()}</strong> รายการ {filteredRecords.length !== records.length ? `(กรองจากทั้งหมด ${records.length.toLocaleString()} รายการ)` : ''} (หน้าละ {pageSize} รายการ)
            </span>
            {selectedIds.size > 0 && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                เลือก {selectedIds.size} / {records.length} รายการ
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1}
                className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="หน้าแรก"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-2 py-1 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer"
                title="หน้าก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>ก่อนหน้า</span>
              </button>
              <span className="px-2 py-1 font-bold text-slate-800 text-xs bg-white rounded border border-slate-200 shadow-2xs">
                หน้า {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer"
                title="หน้าถัดไป"
              >
                <span>ถัดไป</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
                className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="หน้าสุดท้าย"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Excel-style Spreadsheet Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div ref={tableContainerRef} className="overflow-x-auto max-h-[620px] relative scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            {/* Frozen Table Header */}
            <thead className="sticky top-0 z-20 bg-slate-800 text-white font-semibold select-none shadow-md">
              <tr className="border-b border-slate-700 divide-x divide-slate-700">
                <th className="p-3 w-12 text-center bg-slate-900 sticky left-0 z-30">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={toggleSelectCurrentPage}
                    className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    title={isAllCurrentPageSelected ? "ยกเลิกเลือกหน้านี้" : "เลือกทั้งหมดในหน้านี้ (50 รายการ)"}
                  />
                </th>
                <th className="p-3 w-36 text-center bg-slate-900 sticky left-12 z-30">
                  จัดการ
                </th>
                {MARC21_COLUMNS.map((col) => {
                  if (col.key === 'accession_no') {
                    return (
                      <th
                        key={col.key}
                        className={`p-3 font-semibold text-slate-200 ${col.width}`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-emerald-400 tracking-wider">
                              {col.tag}
                            </span>
                            {/* มีแค่สัญลักษณ์ลูกศร ▲ และ ▼ เท่านั้น ที่เดียว ไม่ต้องใส่ข้อความ */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleSortByAccession('asc')}
                                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] leading-none transition cursor-pointer ${
                                  accSortOrder === 'asc'
                                    ? 'bg-emerald-500 text-white font-bold shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                                title="เรียงเลขทะเบียน: น้อยไปมาก (▲)"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSortByAccession('desc')}
                                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] leading-none transition cursor-pointer ${
                                  accSortOrder === 'desc'
                                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                                title="เรียงเลขทะเบียน: มากไปน้อย (▼)"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                          <span className="truncate" title={col.label}>
                            {col.label}
                          </span>
                        </div>
                      </th>
                    );
                  }

                  return (
                    <th key={col.key} className={`p-3 font-semibold text-slate-200 ${col.width}`}>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-emerald-400 tracking-wider">
                          {col.tag}
                        </span>
                        <span className="truncate" title={col.label}>
                          {col.label.replace(/\n/g, ' ')}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 bg-white">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={MARC21_COLUMNS.length + 2} className="p-8 sm:p-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
                    <p className="text-sm font-semibold text-slate-700">ยังไม่มีข้อมูลรายการบรรณานุกรมในตาราง</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      คุณสามารถสร้างรายการใหม่ หรือดึงข้อมูลหนังสือที่มีอยู่แล้วในระบบห้องสมุดเข้ามาแสดงในตารางได้ทันที
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, rowIdx) => {
                  const isSelected = selectedIds.has(r.id);
                  const { subjects: rowExtractedSubs } = extractAllSubjectsAndDdc(r);
                  const rowUniqueSubs = Array.from(new Set(rowExtractedSubs.filter(s => Boolean(s && s !== '-'))));
                  return (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-emerald-50/50 transition-colors divide-x divide-slate-100 ${
                        isSelected ? 'bg-emerald-50/70' : (rowIdx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white')
                      }`}
                    >
                      {/* Checkbox column (sticky left) */}
                      <td className="p-2.5 text-center bg-inherit sticky left-0 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(r.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Row Actions column (sticky left-12) */}
                      <td className="p-2 text-center bg-inherit sticky left-12 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingMarcDetail(r)}
                            title="ดูโครงสร้าง MARC Tag (ตามแบบ UC-TAL ThaiLIS)"
                            className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyRow(r)}
                            title="คัดลอกแถวนี้ (พร้อมวางใน Excel หรือกดวางในแถวอื่น)"
                            className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded transition cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePasteRow(r.id)}
                            title="วางข้อความ/ข้อมูลที่คัดลอกลงในแถวนี้ (Paste)"
                            className="p-1 text-teal-600 hover:text-teal-900 hover:bg-teal-100 rounded transition cursor-pointer"
                          >
                            <ClipboardPaste className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(r)}
                            title="แก้ไขข้อมูลแถวนี้"
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSyncToLibrary(r)}
                            title="บันทึกเข้าสู่ฐานข้อมูลห้องสมุด"
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(r.id)}
                            title="ลบแถวนี้"
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 29 Columns */}
                      <td className="p-2.5 text-slate-600 font-mono">{r.date}</td>
                      <td className="p-2.5 text-slate-400">{r.col1}</td>
                      <td className="p-2.5">
                        {(() => {
                          const numVal = parseInt(r.accession_no, 10);
                          const clean = !isNaN(numVal) ? String(numVal) : (r.accession_no?.trim() || '');
                          const isDup = (duplicateAccMap[clean] || 0) > 1;
                          return (
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                                isDup 
                                  ? 'text-rose-700 bg-rose-100 border border-rose-300' 
                                  : 'text-slate-900 bg-slate-100'
                              }`}>
                                {formatAccessionNo(r.accession_no)}
                              </span>
                              {isDup && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1 rounded" title="เลขทะเบียนนี้ซ้ำกับรายการอื่นในตาราง">
                                  ซ้ำ!
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-2.5 font-mono text-indigo-700 font-semibold">{r.isbn}</td>
                      <td className="p-2.5 font-medium text-slate-800">{r.author_personal}</td>
                      <td className="p-2.5 text-slate-600">{r.author_corporate}</td>
                      <td className="p-2.5 font-semibold text-slate-900 max-w-xs" title={r.title_245a}>
                        <div className="flex items-center gap-2 min-w-0">
                          {(() => {
                            const coverUrl = (r.cover_image && r.cover_image.trim() !== '' && r.cover_image !== '-') 
                              ? r.cover_image.trim() 
                              : (r.electronic_856 && r.electronic_856.trim().startsWith('http') ? r.electronic_856.trim() : null);
                            if (!coverUrl) return null;
                            return (
                              <img
                                src={coverUrl}
                                alt=""
                                className="w-6 h-8 object-cover rounded shadow-2xs border border-slate-200 shrink-0"
                                onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                              />
                            );
                          })()}
                          <span className="truncate">{r.title_245a}</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate" title={r.title_245b}>
                        {r.title_245b}
                      </td>
                      <td className="p-2.5 text-slate-600">{formatAuthorList245c(r.responsibility_245c, r.author_personal)}</td>
                      <td className="p-2.5 font-bold font-mono text-emerald-700 bg-emerald-50/50 text-center">
                        {r.ddc_082a}
                      </td>
                      <td className="p-2.5 font-mono text-center">
                        <div className="inline-flex items-center justify-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-bold text-emerald-800 shadow-2xs">
                          <span>{r.cutter_082b}</span>
                          {r.cutter_082b && r.cutter_082b !== '-' && (
                            <button
                              onClick={() => copyToClipboard(r.cutter_082b, 'เลขคัตเตอร์ (082 $b)')}
                              title="คัดลอกเลขคัตเตอร์ (082 $b)"
                              className="p-1 text-emerald-600 hover:text-emerald-950 hover:bg-emerald-200 rounded transition cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-600">{r.pub_place}</td>
                      <td className="p-2.5 font-medium text-slate-800">{r.publisher}</td>
                      <td className="p-2.5 font-mono text-slate-700 text-center">{r.pub_year}</td>
                      <td className="p-2.5 text-slate-600 text-center">{r.pages_300a}</td>
                      <td className="p-2.5 text-slate-500 text-center">{r.illustration_300b}</td>
                      {/* 650 $a หัวเรื่อง 1 ถึง 5 */}
                      {[1, 2, 3, 4, 5].map((subIdx) => {
                        const isFirst = subIdx === 1;
                        const propKey = isFirst ? 'subject_650a' : `subject_650_${subIdx}`;
                        const rawVal = (r as any)[propKey];

                        let currentVal = '-';
                        if (isFirst) {
                          currentVal = (rawVal && rawVal !== '-') ? rawVal : (rowExtractedSubs[0] || 'ทั่วไป');
                        } else {
                          if (rawVal && rawVal !== '-') {
                            currentVal = rawVal;
                          } else {
                            currentVal = (rowExtractedSubs[subIdx - 1] && rowExtractedSubs[subIdx - 1] !== '-') ? rowExtractedSubs[subIdx - 1] : '-';
                          }
                        }

                        const hasValue = Boolean(currentVal && currentVal !== '-');

                        // Compact options list for ultra-fast rendering
                        const availableOptions = Array.from(new Set([
                          ...rowUniqueSubs,
                          hasValue ? currentVal : '',
                          ...(isFirst ? ['ทั่วไป'] : [])
                        ].filter((s): s is string => Boolean(s && s !== '-'))));

                        return (
                          <td key={`row650_${r.id}_${subIdx}`} className="p-1.5 min-w-[180px]">
                            <div className="relative">
                              <select
                                value={currentVal}
                                onChange={(e) => handleSubjectChange(r.id, e.target.value, subIdx)}
                                title={`650 $a หัวเรื่อง${isFirst ? ' 1' : `ที่ ${subIdx}`}: ${currentVal}`}
                                className={`w-full rounded-lg px-2 py-1.5 text-xs cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 truncate shadow-2xs ${
                                  hasValue
                                    ? 'bg-emerald-50/80 hover:bg-white focus:bg-white border border-emerald-300 hover:border-emerald-500 focus:border-emerald-500 text-emerald-950 font-medium'
                                    : 'bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-500 text-slate-400 font-normal'
                                }`}
                              >
                                {!isFirst && (
                                  <option value="-">- ไม่มีหัวเรื่อง -</option>
                                )}
                                {availableOptions.map((s, sIdx) => (
                                  <option key={`opt_${r.id}_${subIdx}_${sIdx}`} value={s}>
                                    🏷️ {s}
                                  </option>
                                ))}
                                {TOP_POPULAR_SUBJECTS.filter(ds => !availableOptions.includes(ds)).slice(0, 3).map((s, sIdx) => (
                                  <option key={`defopt_${r.id}_${subIdx}_${sIdx}`} value={s}>
                                    🏷️ {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-2.5 text-center font-mono">
                        {(() => {
                          const info = recordCopyNumberMap.get(r.id);
                          const cNum = info ? info.copyNumber : (r.copies || '1');
                          const isMulti = info && info.totalCopies > 1;
                          return (
                            <span 
                              className={isMulti ? "inline-flex items-center justify-center font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs shadow-2xs" : "text-slate-700"}
                              title={isMulti ? `ฉบับที่ ${cNum} จากทั้งหมด ${info.totalCopies} เล่มในระบบที่มี 020 ISBN/022 ISSN เดียวกัน` : 'ฉบับที่ 1'}
                            >
                              {cNum}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-2.5 text-slate-600 max-w-md">
                        <div className="flex items-center justify-between gap-1.5 min-w-[180px]">
                          <span className="truncate flex-1 text-xs" title={r.summary_520 || 'ยังไม่มีเรื่องย่อ'}>
                            {r.summary_520 || <span className="text-slate-400 italic text-[11px]">- ไม่มีเรื่องย่อ -</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFetchAiSummary({
                              title: r.title_245a || '',
                              author: r.author_personal || '',
                              isbn: r.isbn || '',
                              target: 'row',
                              rowId: r.id
                            })}
                            disabled={rowSummaryLoadingId === r.id}
                            title="ค้นหาสภาพรวมของหนังสือจากแหล่งต่างๆ บนอินเทอร์เน็ต แล้วสรุปเนื้อหาโดยสังเขปลงใน Tag 520 เรื่องย่อด้วย AI"
                            className="shrink-0 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          >
                            {rowSummaryLoadingId === r.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>AI</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-1.5 min-w-[140px]">
                        <select
                          value={r.edition_250 || 'พิมพ์ครั้งที่ 1'}
                          onChange={(e) => handleEditionChange(r.id, e.target.value)}
                          title={`แก้ไขข้อมูล 250 พิมพ์ครั้งที่: ${r.edition_250 || 'พิมพ์ครั้งที่ 1'}`}
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-400 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                        >
                          <option value="พิมพ์ครั้งที่ 1">พิมพ์ครั้งที่ 1</option>
                          <option value="พิมพ์ครั้งที่ 2">พิมพ์ครั้งที่ 2</option>
                          <option value="พิมพ์ครั้งที่ 3">พิมพ์ครั้งที่ 3</option>
                          <option value="พิมพ์ครั้งที่ 4">พิมพ์ครั้งที่ 4</option>
                          <option value="พิมพ์ครั้งที่ 5">พิมพ์ครั้งที่ 5</option>
                          <option value="พิมพ์ครั้งที่ 6">พิมพ์ครั้งที่ 6</option>
                          <option value="พิมพ์ครั้งที่ 7">พิมพ์ครั้งที่ 7</option>
                          <option value="พิมพ์ครั้งที่ 8">พิมพ์ครั้งที่ 8</option>
                          <option value="พิมพ์ครั้งที่ 9">พิมพ์ครั้งที่ 9</option>
                          <option value="พิมพ์ครั้งที่ 10">พิมพ์ครั้งที่ 10</option>
                          <option value="ฉบับปรับปรุงใหม่">ฉบับปรับปรุงใหม่</option>
                          <option value="ฉบับปรับปรุงแก้ไข">ฉบับปรับปรุงแก้ไข</option>
                          <option value="ฉบับพิมพ์ครั้งแรก">ฉบับพิมพ์ครั้งแรก</option>
                          {r.edition_250 && !['พิมพ์ครั้งที่ 1', 'พิมพ์ครั้งที่ 2', 'พิมพ์ครั้งที่ 3', 'พิมพ์ครั้งที่ 4', 'พิมพ์ครั้งที่ 5', 'พิมพ์ครั้งที่ 6', 'พิมพ์ครั้งที่ 7', 'พิมพ์ครั้งที่ 8', 'พิมพ์ครั้งที่ 9', 'พิมพ์ครั้งที่ 10', 'ฉบับปรับปรุงใหม่', 'ฉบับปรับปรุงแก้ไข', 'ฉบับพิมพ์ครั้งแรก'].includes(r.edition_250) && (
                            <option value={r.edition_250}>{r.edition_250}</option>
                          )}
                        </select>
                      </td>
                      <td className="p-2.5 text-slate-700 font-mono">{r.price_541}</td>
                      <td className="p-2.5 text-slate-600">{r.series_490}</td>
                      <td className="p-1.5 min-w-[180px]">
                        {(() => {
                          const optionsSet = new Set<string>();

                          // 1. Collect from Tag 700 in r.marc_tags
                          if (Array.isArray(r.marc_tags)) {
                            r.marc_tags.forEach((t: any) => {
                              if (t.tagID === '700' || t.tag === '700') {
                                const a = parseMarcSubfield(t.data || '', 'a') || t.data?.replace(/[\u001f\$][a-z0-9]/g, ' ')?.trim();
                                if (a) {
                                  optionsSet.add(formatAddedEntry700(a));
                                }
                              }
                            });
                          }

                          // 2. From r.added_entry_700
                          if (r.added_entry_700 && r.added_entry_700 !== '-') {
                            optionsSet.add(r.added_entry_700);
                            const parsed = parseAddedEntry700Parts(r.added_entry_700);
                            if (parsed.name) {
                              STANDARD_700_ROLES_LIST.forEach(role => {
                                optionsSet.add(`${parsed.name}, ${role}.`);
                              });
                            }
                          }

                          // 3. Extract contributor from raw responsibility text if present
                          if (r.responsibility_245c && (r.responsibility_245c.includes('แปล') || r.responsibility_245c.includes('ผู้แปล'))) {
                            const match = r.responsibility_245c.match(/([^\/;,]+?)\s*(?:แปล|ผู้แปล)/i);
                            if (match && match[1]) {
                              optionsSet.add(formatAddedEntry700(match[1].trim(), 'ผู้แปล'));
                            }
                          }

                          const options = Array.from(optionsSet).filter(Boolean);
                          const currentVal = r.added_entry_700 && r.added_entry_700 !== '-' ? r.added_entry_700 : '-';

                          return (
                            <div className="relative">
                              <select
                                value={currentVal}
                                onChange={(e) => handleAddedEntry700Change(r.id, e.target.value)}
                                title="เลือกผู้ร่วมรับผิดชอบ/ผู้แปล/บทบาทหน้าที่ (Tag 700)"
                                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-indigo-400 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate shadow-sm"
                              >
                                <option value="-">- (ไม่มี Tag 700)</option>
                                {options.map((opt, oIdx) => (
                                  <option key={`700_${r.id}_${oIdx}`} value={opt}>
                                    👥 {opt}
                                  </option>
                                ))}
                                {!options.includes(currentVal) && currentVal !== '-' && (
                                  <option value={currentVal}>👥 {currentVal}</option>
                                )}
                              </select>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-2.5 text-slate-600">{r.acquisition_source}</td>
                      <td className="p-2.5 text-slate-400">{r.col2}</td>
                      <td className="p-2.5 text-slate-600">{r.source_type}</td>
                      <td className="p-1.5 min-w-[150px]">
                        <select
                          value={r.storage_location || 'สำหรับเด็ก'}
                          onChange={(e) => handleStorageLocationChange(r.id, e.target.value)}
                          title="เลือกสถานที่จัดเก็บ"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-emerald-400 focus:border-emerald-500 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate shadow-sm"
                        >
                          {!allAvailableStorageLocations.includes(r.storage_location) && r.storage_location && (
                            <option value={r.storage_location}>{r.storage_location}</option>
                          )}
                          {allAvailableStorageLocations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.status === 'สูญหาย' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400">{r.col3}</td>

                      {/* Extended MARC21 Columns (All remaining tags after EXTRA2) */}
                      <td className="p-2.5 font-mono text-slate-700 text-xs">{r.leader_000 || '-'}</td>
                      <td className="p-2.5 font-mono text-indigo-700 font-semibold">{r.control_001 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-600 text-center">{r.control_003 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-600 text-xs">{r.trans_005 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-700 text-xs max-w-xs truncate" title={r.fixed_008}>{r.fixed_008 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-700">{r.issn_022 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-600 text-center">{r.cat_source_040 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-600 text-center">{r.language_041 || '-'}</td>
                      <td className="p-2.5 text-slate-600 text-center">{r.dimensions_300c || '-'}</td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate" title={r.note_general_500}>{r.note_general_500 || '-'}</td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate" title={r.note_bib_504}>{r.note_bib_504 || '-'}</td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate" title={r.note_contents_505}>{r.note_contents_505 || '-'}</td>
                      <td className="p-2.5 text-slate-700">{r.subject_person_600 || '-'}</td>
                      <td className="p-2.5 text-slate-700">{r.subject_corp_610 || '-'}</td>
                      <td className="p-2.5 text-slate-700">{r.subject_uniform_630 || '-'}</td>
                      <td className="p-2.5 text-slate-700">{r.subject_geo_651 || '-'}</td>
                      <td className="p-2.5 text-slate-700">{r.added_corp_710 || '-'}</td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate" title={r.added_title_740}>{r.added_title_740 || '-'}</td>
                      <td className="p-2.5 text-slate-600">{r.series_uniform_830 || '-'}</td>
                      <td className="p-2.5 font-mono text-xs text-blue-600 max-w-xs truncate" title={r.electronic_856}>{r.electronic_856 || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-700">{r.local_907 || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info with Complete Pagination Controls */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 gap-3">
          {/* Left: Summary text & Page size selector */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <span className="text-slate-600">
              {records.length === 0 ? (
                'ไม่มีข้อมูลรายการในตาราง'
              ) : (
                <>
                  แสดงรายการที่ <strong className="text-emerald-700 font-bold">{filteredRecords.length === 0 ? 0 : startIndex + 1} - {endIndex}</strong> จากทั้งหมด <strong className="text-slate-900 font-bold">{filteredRecords.length.toLocaleString()}</strong> รายการ {filteredRecords.length !== records.length ? `(จากทั้งหมด ${records.length.toLocaleString()} รายการ)` : ''} ({MARC21_COLUMNS.length} คอลัมน์)
                </>
              )}
            </span>

            {records.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-slate-500 font-medium">แสดงหน้าละ:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={50}>50 แถว (ค่าเริ่มต้น - แนะนำ ลื่นไหลสุด)</option>
                  <option value={100}>100 แถว (แนะนำ)</option>
                  <option value={200}>200 แถว</option>
                  <option value={500}>500 แถว</option>
                  <option value={records.length > 0 ? records.length : 1000}>ทั้งหมด ({records.length} แถว)</option>
                </select>
              </div>
            )}
          </div>

          {/* Right: Pagination Navigation Controls */}
          {records.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition shadow-2xs cursor-pointer"
                title="หน้าแรก"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-semibold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer"
                title="หน้าก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ก่อนหน้า</span>
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {getPaginationGroup().map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis_${idx}`} className="px-1.5 py-1 text-slate-400 select-none">
                        ...
                      </span>
                    );
                  }
                  const pageNum = item as number;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={`page_btn_${pageNum}`}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-semibold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer"
                title="หน้าถัดไป"
              >
                <span className="hidden sm:inline">ถัดไป</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition shadow-2xs cursor-pointer"
                title="หน้าสุดท้าย"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              {/* Quick Jump Input if more than 3 pages */}
              {totalPages > 3 && (
                <div className="flex items-center gap-1 text-xs text-slate-500 pl-2 border-l border-slate-200 ml-1">
                  <span>ไปหน้า:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpInputPage}
                    onChange={(e) => setJumpInputPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const p = parseInt(jumpInputPage, 10);
                        if (!isNaN(p) && p >= 1 && p <= totalPages) {
                          handlePageChange(p);
                        }
                      }
                    }}
                    className="w-11 px-1.5 py-1 bg-white border border-slate-300 rounded text-center text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const p = parseInt(jumpInputPage, 10);
                      if (!isNaN(p) && p >= 1 && p <= totalPages) {
                        handlePageChange(p);
                      }
                    }}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold transition cursor-pointer"
                  >
                    ไป
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batch Input Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">สร้างรายการบรรณานุกรมเป็นชุด (Batch)</h3>
                  <p className="text-xs text-slate-500">วางรหัส ISBN หรือชื่อเรื่อง ทีละบรรทัด (รองรับสูงสุด 25 เล่มต่อครั้ง)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBatchOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รายการ ISBN หรือชื่อหนังสือ (หนึ่งเล่มต่อหนึ่งบรรทัด):
                </label>
                <textarea
                  value={batchQueries}
                  onChange={(e) => setBatchQueries(e.target.value)}
                  rows={6}
                  placeholder="ตัวอย่าง:&#10;9786160401628&#10;9786160403264&#10;โต๊ะโตะจัง เด็กหญิงข้างหน้าต่าง&#10;46 วิธี ฝึกวันละนิด ฉลาดคิด ฉลาดพูด"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setBatchQueries(`9786163930446\n9786160401628\n9786160403264\n9786160405886\n9786160401604`)}
                  className="text-xs text-emerald-700 hover:underline cursor-pointer"
                >
                  ใส่ตัวอย่าง 5 เล่ม
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBatchOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !batchQueries.trim()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                    <span>ประมวลผลสร้าง MARC21</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">แก้ไขข้อมูลบรรณานุกรม MARC 21</h3>
                  <p className="text-xs text-slate-500">เลขทะเบียน: {editingRecord.accession_no} | ISBN: {editingRecord.isbn || '-'}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TABS: ข้อมูลหนังสือแบบเดิม (บัตรรายการ) มาอยู่อันแรก vs ฟอร์ม MARC 21 */}
            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setEditModalTab('card')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 cursor-pointer ${
                  editModalTab === 'card'
                    ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-xs -mb-px'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>ข้อมูลหนังสือแบบเดิม (บัตรรายการ)</span>
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('fields')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 cursor-pointer ${
                  editModalTab === 'fields'
                    ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-xs -mb-px'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>ฟอร์มแก้ไข MARC 21 (ข้อมูลแท็ก)</span>
              </button>
            </div>

            {/* TAB 1: ข้อมูลหนังสือแบบเดิม (บัตรรายการ) */}
            {editModalTab === 'card' && (() => {
              const displayAccNo = formatAccessionNo(editingRecord.accession_no);
              const callNumber = `${editingRecord.ddc_082a || ''} ${editingRecord.cutter_082b || ''}`.trim() || '-';
              const displayYear = editingRecord.pub_year || '-';
              const detectedVol = extractVolumeFromTitle(
                editingRecord.title_245a,
                editingRecord.title_245b,
                `${editingRecord.edition_250 || ''} ${editingRecord.series_490 || ''}`
              );
              const displayVolume = detectedVol !== '-' ? detectedVol : '1';
              const copyInfo = calculateCopyNumber(editingRecord, records, libraryBooks);

              return (
                <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
                  {/* กรอบสำหรับแสดงข้อมูลทะเบียนหนังสือ (ก่อนบัตรรายการข้อมูลบรรณานุกรม) */}
                  <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                          <Barcode className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                            <span>ข้อมูลทะเบียนหนังสือ</span>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                              Book Accession & Copy Info
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500">ข้อมูลการลงทะเบียนและลำดับฉบับของหนังสือในระบบห้องสมุด</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-white text-amber-900 border border-amber-300 px-3 py-1 rounded-lg shadow-2xs">
                          {displayAccNo}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                      {/* 1. เลขทะเบียน */}
                      <div className="bg-white p-3 rounded-xl border border-amber-200/70 shadow-2xs flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-slate-500 mb-1">เลขทะเบียน :</span>
                        <span className="text-xs sm:text-sm font-mono font-extrabold text-slate-900 truncate" title={displayAccNo}>
                          {displayAccNo}
                        </span>
                      </div>

                      {/* 2. เลขเรียกหนังสือ */}
                      <div className="bg-white p-3 rounded-xl border border-amber-200/70 shadow-2xs flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-slate-500 mb-1">เลขเรียกหนังสือ :</span>
                        <span className="text-xs sm:text-sm font-mono font-extrabold text-indigo-700 truncate" title={callNumber}>
                          {callNumber}
                        </span>
                      </div>

                      {/* 3. ปีที่พิมพ์ */}
                      <div className="bg-white p-3 rounded-xl border border-amber-200/70 shadow-2xs flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-slate-500 mb-1">ปีที่พิมพ์ :</span>
                        <span className="text-xs sm:text-sm font-mono font-extrabold text-slate-800">
                          {displayYear}
                        </span>
                      </div>

                      {/* 4. เล่ม */}
                      <div className="bg-white p-3 rounded-xl border border-amber-200/70 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-slate-500">เล่ม :</span>
                          {detectedVol !== '-' && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">จากชื่อเรื่อง</span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {displayVolume}
                        </span>
                      </div>

                      {/* 5. ฉบับ */}
                      <div className="bg-white p-3 rounded-xl border border-amber-200/70 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-slate-500">ฉบับ :</span>
                          {copyInfo.totalCopies > 1 && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-bold">
                              {copyInfo.copyNumber}/{copyInfo.totalCopies}
                            </span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-blue-700">
                          {copyInfo.copyNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span>บัตรรายการข้อมูลบรรณานุกรม (Bibliographic Record)</span>
                    </span>
                  <button
                    type="button"
                    onClick={() => {
                      const allSubs: string[] = [];
                      const addS = (val?: string) => {
                        if (!val) return;
                        const clean = val.replace(/[\u001f\$][a-z0-9]/g, ' ').replace(/^[\s\/:;=,-]+/, '').replace(/[\s\/:;=,-]+$/, '').trim();
                        if (clean && clean !== '-' && clean !== 'ทั่วไป' && !allSubs.includes(clean)) allSubs.push(clean);
                      };
                      addS(editingRecord.subject_650a);
                      addS(editingRecord.subject_650_2);
                      addS(editingRecord.subject_650_3);
                      if (Array.isArray(editingRecord.marc_tags)) {
                        editingRecord.marc_tags.forEach((t: any) => {
                          if (t && (t.tagID === '650' || t.tag === '650')) {
                            const parsed = parseMarcSubfield(t.data || t.content || '', 'a') || (t.data || t.content || '').replace(/[\u001f\$][a-z0-9]/g, ' ').trim();
                            addS(parsed);
                          }
                        });
                      }
                      const subjLine = allSubs.length > 0 ? `\nหัวเรื่อง: ${allSubs.join(', ')}` : '';
                      const cardText = `ISBN: ${editingRecord.isbn || '-'}\nเลขเรียกหนังสือ: ${editingRecord.ddc_082a} ${editingRecord.cutter_082b}\nผู้แต่ง: ${editingRecord.author_personal || '-'}\nชื่อเรื่อง: ${editingRecord.title_245a || '-'}${editingRecord.title_245b && editingRecord.title_245b !== '-' ? ` : ${editingRecord.title_245b}` : ''}\nพิมพลักษณ์: ${editingRecord.pub_place || 'กรุงเทพฯ'} : ${editingRecord.publisher || '-'}, ${editingRecord.pub_year || '-'}\nจำนวนหน้า: ${editingRecord.pages_300a || '160 หน้า'} : ${editingRecord.illustration_300b || 'ภาพประกอบ'} ; ${editingRecord.dimensions_300c || '20 ซม.'}${subjLine}\nสาระสังเขป: ${editingRecord.summary_520 || '-'}\nสถานที่จัดเก็บ: ${editingRecord.storage_location || 'NCILibrary'}`;
                      navigator.clipboard.writeText(cardText);
                      setCopiedCardInModal(true);
                      setTimeout(() => setCopiedCardInModal(false), 2000);
                    }}
                    className="text-xs text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedCardInModal ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCardInModal ? 'คัดลอกตารางแล้ว!' : 'คัดลอกตาราง'}</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="w-36 sm:w-44 py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">ISBN</td>
                        <td className="py-2.5 px-4 text-slate-800 font-mono">{editingRecord.isbn || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">เลขเรียกหนังสือ</td>
                        <td className="py-2.5 px-4 text-slate-900 font-mono font-medium">{editingRecord.ddc_082a} {editingRecord.cutter_082b}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">ผู้แต่ง</td>
                        <td className="py-2.5 px-4 text-slate-800">
                          {(() => {
                            const p = editingRecord.author_personal && editingRecord.author_personal !== '-' ? editingRecord.author_personal : '';
                            const c = editingRecord.author_corporate && editingRecord.author_corporate !== '-' ? editingRecord.author_corporate : '';
                            if (p && c) return `${p} / ${c}`;
                            return p || c || '-';
                          })()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">ชื่อเรื่อง</td>
                        <td className="py-2.5 px-4 text-slate-900 font-medium">
                          {editingRecord.title_245a}{editingRecord.title_245b && editingRecord.title_245b !== '-' ? ` : ${editingRecord.title_245b}` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">พิมพลักษณ์</td>
                        <td className="py-2.5 px-4 text-slate-800">
                          {editingRecord.pub_place || 'กรุงเทพฯ'} : {editingRecord.publisher || '-'}, {editingRecord.pub_year || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">จำนวนหน้า</td>
                        <td className="py-2.5 px-4 text-slate-800">
                          {editingRecord.pages_300a || '160 หน้า'}
                          {editingRecord.illustration_300b && editingRecord.illustration_300b !== '-' ? ` : ${editingRecord.illustration_300b}` : ' : ภาพประกอบ'}
                          {` ; ${editingRecord.dimensions_300c || '20 ซม.'}`}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">สาระสังเขป</td>
                        <td className="py-2.5 px-4 text-slate-700 leading-relaxed text-xs sm:text-sm">
                          {editingRecord.summary_520 || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">หัวเรื่อง</td>
                        <td className="py-2.5 px-4 space-y-1.5">
                          {(() => {
                            const allSubs: string[] = [];
                            const addS = (val?: string) => {
                              if (!val) return;
                              const clean = val.replace(/[\u001f\$][a-z0-9]/g, ' ').replace(/^[\s\/:;=,-]+/, '').replace(/[\s\/:;=,-]+$/, '').trim();
                              if (clean && clean !== '-' && clean !== 'ทั่วไป' && !allSubs.includes(clean)) allSubs.push(clean);
                            };
                            addS(editingRecord.subject_650a);
                            addS(editingRecord.subject_650_2);
                            addS(editingRecord.subject_650_3);
                            if (Array.isArray(editingRecord.marc_tags)) {
                              editingRecord.marc_tags.forEach((t: any) => {
                                if (t && (t.tagID === '650' || t.tag === '650')) {
                                  const parsed = parseMarcSubfield(t.data || t.content || '', 'a') || (t.data || t.content || '').replace(/[\u001f\$][a-z0-9]/g, ' ').trim();
                                  addS(parsed);
                                }
                              });
                            }
                            if (allSubs.length === 0) return <span className="text-slate-400">-</span>;
                            return allSubs.map((subj, idx) => (
                              <div key={`edit_card_subj_${idx}`} className="text-blue-600 flex items-center gap-1.5 font-medium">
                                <span className="text-slate-400 font-mono text-[11px] font-bold">{idx + 1}.</span>
                                <span>{subj}</span>
                              </div>
                            ));
                          })()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">รายการเพิ่มผู้แต่ง</td>
                        <td className="py-2.5 px-4 text-slate-800">
                          {editingRecord.added_entry_700 || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/70 align-top">สถานที่จัดเก็บ</td>
                        <td className="py-2.5 px-4 text-slate-800 flex items-center gap-1.5 font-medium">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                          <span>{editingRecord.storage_location || 'NCILibrary'}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

            {/* TAB 2: ฟอร์มแก้ไข MARC 21 (ข้อมูลแท็ก) */}
            {editModalTab === 'fields' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* 020 ISBN */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">020 ISBN</label>
                <input
                  type="text"
                  value={editingRecord.isbn || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, isbn: e.target.value })}
                  placeholder="เช่น 9786160401628"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700 font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 022 ISSN */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">022 ISSN</label>
                <input
                  type="text"
                  value={editingRecord.issn_022 && editingRecord.issn_022 !== '-' ? editingRecord.issn_022 : ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, issn_022: e.target.value })}
                  placeholder="เช่น 0123-4567"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 082 $a เลขหมู่หนังสือ (DDC) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">082 $a เลขหมู่หนังสือ (DDC)</label>
                <input
                  type="text"
                  value={editingRecord.ddc_082a || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, ddc_082a: e.target.value })}
                  placeholder="เช่น 158.1 หรือ ด หรือ ย"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 082 $b เลขประจำหนังสือ (Cutter) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <label className="block font-semibold text-slate-700">082 $b เลขประจำหนังสือ (Cutter)</label>
                    {(() => {
                      const sysBase = findExistingAuthorBaseCutter(editingRecord.author_personal, records);
                      if (sysBase) {
                        return (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                            ⭐ มีในระบบ ({sysBase})
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const sysBase = findExistingAuthorBaseCutter(editingRecord.author_personal, records);
                      if (sysBase) {
                        const workMark = getAuthorTitleWorkMark(editingRecord.title_245a);
                        const sysCutter = `${sysBase}${workMark}`;
                        if (editingRecord.cutter_082b !== sysCutter) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord({ ...editingRecord, cutter_082b: sysCutter });
                                showToast(`👤 ใช้เลขคัตเตอร์ที่มีในระบบ: ${sysCutter}`);
                              }}
                              title="ใช้เลขประจำหนังสือที่มีอยู่แล้วในระบบสำหรับผู้แต่งท่านนี้"
                              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>👤 ใช้เลขในระบบ</span>
                            </button>
                          );
                        }
                      }
                      return null;
                    })()}
                    <button
                      type="button"
                      onClick={() => {
                        const recut = calculateThaiCutter(editingRecord.author_personal, editingRecord.title_245a);
                        setEditingRecord({ ...editingRecord, cutter_082b: recut });
                        showToast(`🔄 คำนวณเลขคัตเตอร์ใหม่ตามสูตรตารางเทียบมาตรฐาน: ${recut}`);
                      }}
                      title="คำนวณใหม่ตามสูตรตารางเทียบมาตรฐาน (สูตรมาตรฐาน)"
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>คำนวณใหม่ (สูตรมาตรฐาน)</span>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={editingRecord.cutter_082b || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, cutter_082b: e.target.value })}
                    className="w-full p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl font-mono font-bold text-emerald-800 pr-10 focus:ring-2 focus:ring-emerald-500"
                  />
                  {editingRecord.cutter_082b && editingRecord.cutter_082b !== '-' && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(editingRecord.cutter_082b || '', 'เลขคัตเตอร์ (082 $b)')}
                      title="คัดลอกเลขคัตเตอร์ (082 $b)"
                      className="absolute right-2 top-2 p-1.5 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 100 ผู้แต่ง (ชื่อบุคคล) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">100 ผู้แต่ง (ชื่อบุคคล)</label>
                <AuthorInputWithSuggestions
                  value={editingRecord.author_personal || ''}
                  onChange={(val) => {
                    const existingCutters = new Set(
                      records
                        .filter(r => r.id !== editingRecord.id && r.cutter_082b)
                        .map(r => r.cutter_082b)
                    );
                    const res = getExistingOrCalculatedCutter(val, editingRecord.title_245a, records, existingCutters);
                    setEditingRecord({
                      ...editingRecord,
                      author_personal: val,
                      cutter_082b: res.cutter
                    });
                  }}
                  onSelectAuthor={(selectedAuthor, calculatedCutter) => {
                    const existingCutters = new Set(
                      records
                        .filter(r => r.id !== editingRecord.id && r.cutter_082b)
                        .map(r => r.cutter_082b)
                    );
                    const res = getExistingOrCalculatedCutter(selectedAuthor, editingRecord.title_245a, records, existingCutters);
                    const finalCutter = calculatedCutter || res.cutter;
                    setEditingRecord({
                      ...editingRecord,
                      author_personal: selectedAuthor,
                      cutter_082b: finalCutter
                    });
                    showToast(`👤 เลือกผู้แต่ง "${selectedAuthor}" และดึงเลขประจำหนังสือ "${finalCutter}" เรียบร้อย`);
                  }}
                  records={records}
                  currentTitle={editingRecord.title_245a}
                />
              </div>

              {/* 110 ผู้แต่ง (ชื่อนิติบุคคล) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">110 ผู้แต่ง (ชื่อนิติบุคคล)</label>
                <input
                  type="text"
                  list="corporate-authors-110-options"
                  value={editingRecord.author_corporate && editingRecord.author_corporate !== '-' ? editingRecord.author_corporate : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = { ...editingRecord, author_corporate: val };
                    // If author_personal is empty or '-', calculate Cutter from corporate author if cutter not yet set
                    if ((!editingRecord.author_personal || editingRecord.author_personal === '-') && val.trim() && val.trim() !== '-') {
                      const existingCutters = new Set(
                        records
                          .filter(r => r.id !== editingRecord.id && r.cutter_082b)
                          .map(r => r.cutter_082b)
                      );
                      const res = getExistingOrCalculatedCutter(val, editingRecord.title_245a, records, existingCutters);
                      if (res.cutter) {
                        updated.cutter_082b = res.cutter;
                      }
                    }
                    setEditingRecord(updated);
                  }}
                  placeholder="เช่น กรมศิลปากร, มหาวิทยาลัย หรือ -"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
                <datalist id="corporate-authors-110-options">
                  {allAvailableCorporateAuthors110.map((item, idx) => (
                    <option key={`dl_corp_${idx}`} value={item} />
                  ))}
                </datalist>
              </div>

              {/* 245 $a : $b = 246 $a (ชื่อเรื่องเต็ม / ชื่อเรื่องคู่ขนาน) */}
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">245 $a : $b = 246 $a (ชื่อเรื่องเต็ม / ชื่อเรื่องคู่ขนาน)</label>
                <input
                  type="text"
                  value={editingRecord.title_245a || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, title_245a: e.target.value })}
                  placeholder="พิมพ์ชื่อเรื่องเต็ม..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* 245 $c ส่วนแจ้งความรับผิดชอบ */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">245 $c ส่วนแจ้งความรับผิดชอบ (ชื่อผู้แต่งอย่างเดียว ไม่ใส่ชื่อผู้วาดภาพประกอบ และชื่อผู้แปล)</label>
                <input
                  type="text"
                  value={editingRecord.responsibility_245c || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, responsibility_245c: e.target.value })}
                  placeholder="เช่น Robert T. Kiyosaki."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 246 (Ind1=3, Ind2=1) $a :$b */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">246 (Ind1=3, Ind2=1) $a :$b (ชื่อเรื่องคู่ขนาน/ภาษาอังกฤษ)</label>
                <input
                  type="text"
                  value={editingRecord.title_245b || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, title_245b: e.target.value })}
                  placeholder="$aTitle :$bSubtitle."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 250 พิมพ์ครั้งที่ (Edition) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">250 พิมพ์ครั้งที่ (Edition)</label>
                <input
                  type="text"
                  list="edition-250-options"
                  value={editingRecord.edition_250 || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, edition_250: e.target.value })}
                  placeholder="เช่น พิมพ์ครั้งที่ 1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
                <datalist id="edition-250-options">
                  <option value="พิมพ์ครั้งที่ 1" />
                  <option value="พิมพ์ครั้งที่ 2" />
                  <option value="พิมพ์ครั้งที่ 3" />
                  <option value="พิมพ์ครั้งที่ 4" />
                  <option value="พิมพ์ครั้งที่ 5" />
                  <option value="พิมพ์ครั้งที่ 6" />
                  <option value="พิมพ์ครั้งที่ 7" />
                  <option value="พิมพ์ครั้งที่ 8" />
                  <option value="พิมพ์ครั้งที่ 9" />
                  <option value="พิมพ์ครั้งที่ 10" />
                  <option value="ฉบับปรับปรุงใหม่" />
                  <option value="ฉบับปรับปรุงแก้ไข" />
                  <option value="ฉบับพิมพ์ครั้งแรก" />
                </datalist>
              </div>

              {/* 260 $a สถานที่พิมพ์ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">$a สถานที่พิมพ์ (260 $a)</label>
                <input
                  type="text"
                  list="pub-places-options"
                  value={editingRecord.pub_place || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, pub_place: e.target.value })}
                  placeholder="พิมพ์หรือเลือกสถานที่พิมพ์..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <datalist id="pub-places-options">
                  {allAvailablePubPlaces.map((item, idx) => (
                    <option key={`dl_place_${idx}`} value={item} />
                  ))}
                </datalist>
              </div>

              {/* 260 $b สำนักพิมพ์ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">$b สำนักพิมพ์ (260 $b)</label>
                <input
                  type="text"
                  list="publishers-options"
                  value={editingRecord.publisher || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, publisher: e.target.value })}
                  placeholder="พิมพ์หรือเลือกสำนักพิมพ์..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <datalist id="publishers-options">
                  {allAvailablePublishers.map((item, idx) => (
                    <option key={`dl_pub_${idx}`} value={item} />
                  ))}
                </datalist>
              </div>

              {/* 260 $c ปีที่พิมพ์ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">260 $c ปีที่พิมพ์</label>
                <input
                  type="text"
                  value={editingRecord.pub_year || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, pub_year: e.target.value })}
                  placeholder="เช่น 2567"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 300 $a จำนวนหน้า */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">300 $a จำนวนหน้า</label>
                <input
                  type="text"
                  value={editingRecord.pages_300a || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, pages_300a: e.target.value })}
                  placeholder="เช่น 180 หน้า"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 300 $b ภาพประกอบ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">300 $b ภาพประกอบ</label>
                <input
                  type="text"
                  value={editingRecord.illustration_300b || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, illustration_300b: e.target.value })}
                  placeholder="เช่น ภาพประกอบ, ภาพประกอบ (สี)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 300 $c ขนาดเล่ม */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">300 $c ขนาดเล่ม</label>
                <input
                  type="text"
                  value={editingRecord.dimensions_300c || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, dimensions_300c: e.target.value })}
                  placeholder="เช่น 20 ซม. หรือ 21x29 ซม."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 490 ชุด / ซีรีส์ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">490 ชุด / ซีรีส์</label>
                <input
                  type="text"
                  list="series-490-options"
                  value={editingRecord.series_490 || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, series_490: e.target.value })}
                  placeholder="พิมพ์หรือเลือกชุด/ซีรีส์..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <datalist id="series-490-options">
                  {allAvailableSeries490.map((item, idx) => (
                    <option key={`dl_490_${idx}`} value={item} />
                  ))}
                </datalist>
              </div>

              {/* 505 สารบัญเนื้อหาในเล่ม */}
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">505 สารบัญเนื้อหาในเล่ม</label>
                <textarea
                  value={editingRecord.note_contents_505 && editingRecord.note_contents_505 !== '-' ? editingRecord.note_contents_505 : ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, note_contents_505: e.target.value })}
                  rows={2}
                  placeholder="เช่น บทที่ 1 ความเป็นมา -- บทที่ 2 ทฤษฎีและแนวคิด -- บทที่ 3 สรุปผล..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 520 เรื่องย่อ */}
              <div className="sm:col-span-2 md:col-span-3">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="block font-semibold text-slate-700">520 เรื่องย่อ</label>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">Tag 520 $a</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFetchAiSummary({
                      title: editingRecord.title_245a || '',
                      author: editingRecord.author_personal || '',
                      isbn: editingRecord.isbn || '',
                      target: 'modal'
                    })}
                    disabled={isAiSummaryLoading || !editingRecord.title_245a?.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="ค้นหาสภาพรวมของหนังสือจากแหล่งต่างๆ บนอินเทอร์เน็ต แล้วสรุปเนื้อหาโดยสังเขปลงใน Tag 520 เรื่องย่อด้วย AI"
                  >
                    {isAiSummaryLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                        <span>กำลังค้นหาสภาพรวมและสรุปเรื่องย่อด้วย AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        <span>AI ค้นหาเรื่องย่อจากชื่อหนังสือ</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={editingRecord.summary_520 || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, summary_520: e.target.value })}
                  rows={3}
                  placeholder="พิมพ์เรื่องย่อ หรือกดปุ่ม 'AI ค้นหาเรื่องย่อจากชื่อหนังสือ' เพื่อดึงเรื่องย่อจาก AI อัตโนมัติ..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
                />
              </div>

              {/* 541 ราคา (บาท) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">541 ราคา (บาท)</label>
                <input
                  type="text"
                  value={editingRecord.price_541 || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, price_541: e.target.value })}
                  placeholder="เช่น 250 หรือ -"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 650 $a หัวเรื่อง 1 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">650 $a หัวเรื่อง 1</label>
                {(() => {
                  const recordMarc650s = Array.isArray(editingRecord.marc_tags)
                    ? editingRecord.marc_tags
                        .filter((t: any) => t.tagID === '650' || t.tag === '650')
                        .map((t: any) => parseMarcSubfield(t.data || '', 'a') || t.data?.replace(/[\u001f\$][a-z0-9]/g, ' ')?.trim())
                        .filter((s): s is string => Boolean(s && s !== '-'))
                    : [];
                  const uniqueMarc650s: string[] = extractAllSubjectsAndDdc(editingRecord).subjects;

                  return (
                    <div className="space-y-1.5">
                      {uniqueMarc650s.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] text-slate-500 font-medium">หัวเรื่องทั้งหมด ({uniqueMarc650s.length}):</span>
                          {uniqueMarc650s.map((subj, idx) => (
                            <button
                              key={`emarc_${idx}`}
                              type="button"
                              onClick={() => setEditingRecord({ ...editingRecord, subject_650a: subj })}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                                editingRecord.subject_650a === subj
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              🏷️ {subj}
                            </button>
                          ))}
                        </div>
                      )}
                      <input
                        type="text"
                        list="subject-headings-list"
                        value={editingRecord.subject_650a || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, subject_650a: e.target.value })}
                        placeholder="ระบุหัวเรื่องที่ 1..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  );
                })()}
              </div>

              {/* 650 $a หัวเรื่องที่ 2 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">650 $a หัวเรื่องที่ 2</label>
                <input
                  type="text"
                  list="subject-headings-list"
                  value={editingRecord.subject_650_2 && editingRecord.subject_650_2 !== '-' ? editingRecord.subject_650_2 : ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, subject_650_2: e.target.value })}
                  placeholder="ระบุหัวเรื่องที่ 2 (ถ้ามี)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 650 หัวเรื่อง 3 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">650 $a หัวเรื่องที่ 3</label>
                <input
                  type="text"
                  list="subject-headings-list"
                  value={editingRecord.subject_650_3 && editingRecord.subject_650_3 !== '-' ? editingRecord.subject_650_3 : ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, subject_650_3: e.target.value })}
                  placeholder="ระบุหัวเรื่องที่ 3 (ถ้ามี)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 650 หัวเรื่อง 4 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">650 $a หัวเรื่องที่ 4</label>
                <input
                  type="text"
                  list="subject-headings-list"
                  value={editingRecord.subject_650_4 && editingRecord.subject_650_4 !== '-' ? editingRecord.subject_650_4 : ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, subject_650_4: e.target.value })}
                  placeholder="ระบุหัวเรื่องที่ 4 (ถ้ามี)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 650 หัวเรื่อง 5 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">650 $a หัวเรื่องที่ 5</label>
                <input
                  type="text"
                  list="subject-headings-list"
                  value={editingRecord.subject_650_5 && editingRecord.subject_650_5 !== '-' ? editingRecord.subject_650_5 : ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, subject_650_5: e.target.value })}
                  placeholder="ระบุหัวเรื่องที่ 5 (ถ้ามี)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* หัวเรื่องที่ 6 ขึ้นไป (หากรายการมีมากกว่า 5 หัวเรื่อง) */}
              {Array.isArray((editingRecord as any).extraSubjects) && (editingRecord as any).extraSubjects.map((extraVal: string, extraIdx: number) => (
                <div key={`extra_subj_${extraIdx}`} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700 text-xs">
                      650 หัวเรื่อง {extraIdx + 6}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newExtras = [...((editingRecord as any).extraSubjects || [])];
                        newExtras.splice(extraIdx, 1);
                        setEditingRecord({ ...editingRecord, extraSubjects: newExtras });
                      }}
                      className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      ลบหัวเรื่องนี้
                    </button>
                  </div>
                  <input
                    type="text"
                    list="subject-headings-list"
                    value={extraVal || ''}
                    onChange={(e) => {
                      const newExtras = [...((editingRecord as any).extraSubjects || [])];
                      newExtras[extraIdx] = e.target.value;
                      setEditingRecord({ ...editingRecord, extraSubjects: newExtras });
                    }}
                    placeholder={`ระบุหัวเรื่องที่ ${extraIdx + 4}...`}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ))}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const currentExtras = Array.isArray((editingRecord as any).extraSubjects) ? [...(editingRecord as any).extraSubjects] : [];
                    currentExtras.push('');
                    setEditingRecord({ ...editingRecord, extraSubjects: currentExtras });
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มหัวเรื่อง (650) เพิ่มเติม</span>
                </button>
              </div>

              {/* Datalist for Subject Headings */}
              <datalist id="subject-headings-list">
                {allAvailableSubjects.map((s, idx) => (
                  <option key={`dl_subj_${idx}`} value={s} />
                ))}
              </datalist>

              {/* 700 ผู้ร่วมรับผิดชอบ / บทบาทหน้าที่ */}
              <div className="sm:col-span-2 md:col-span-3 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 p-3.5 rounded-2xl border border-indigo-100 shadow-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-bold">700</span>
                    <label className="font-bold text-slate-800 text-xs">
                      700 ผู้ร่วมรับผิดชอบ / บทบาทหน้าที่ (ผู้แต่ง, บรรณาธิการ, ผู้แปล, ผู้วาดภาพประกอบ, ผู้รวบรวม, ช่างภาพ ฯลฯ)
                    </label>
                  </div>
                  {editingRecord.added_entry_700 && editingRecord.added_entry_700 !== '-' && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-100/90 text-indigo-900 border border-indigo-200 flex items-center gap-1 shadow-2xs">
                      <span>🏷️ บทบาทปัจจุบัน:</span>
                      <strong className="text-indigo-950 font-bold">
                        {parseAddedEntry700Parts(editingRecord.added_entry_700).role || 'ระบุเอง'}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      list="translators-700-options"
                      value={editingRecord.added_entry_700 || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, added_entry_700: e.target.value })}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== '-') {
                          const parsed = parseAddedEntry700Parts(val);
                          if (parsed.formatted && parsed.formatted !== val && parsed.role) {
                            setEditingRecord({ ...editingRecord, added_entry_700: parsed.formatted });
                          }
                        }
                      }}
                      placeholder="พิมพ์ชื่อพร้อมบทบาท เช่น กิตติพงศ์, ผู้แต่ง. หรือ วิเชียร, บรรณาธิการ. หรือ Robert T. Kiyosaki, ผู้แต่ง."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-indigo-950 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 text-xs shadow-2xs"
                    />
                    <datalist id="translators-700-options">
                      {allAvailableTranslators700.map((item, idx) => (
                        <option key={`dl_700_${idx}`} value={item} />
                      ))}
                    </datalist>
                  </div>

                  {/* Dropdown Role Selector */}
                  <div className="w-full sm:w-56 shrink-0">
                    <select
                      value={parseAddedEntry700Parts(editingRecord.added_entry_700 || '').role || ''}
                      onChange={(e) => {
                        const chosenRole = e.target.value;
                        const updated = attachRoleToAddedEntry700(editingRecord.added_entry_700 || '', chosenRole);
                        setEditingRecord({ ...editingRecord, added_entry_700: updated });
                      }}
                      title="เลือกบทบาทหน้าที่สำหรับ Tag 700"
                      className="w-full p-2.5 bg-white border border-indigo-200 text-indigo-900 font-semibold rounded-xl text-xs hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs transition"
                    >
                      <option value="">⚙️ เลือกบทบาทหน้าที่...</option>
                      {STANDARD_700_ROLES_LIST.map((role) => (
                        <option key={`opt_role_${role}`} value={role}>
                          , {role}.
                        </option>
                      ))}
                      <option value="__CLEAR__">✕ นำบทบาทออก (ชื่ออย่างเดียว)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* เลขทะเบียน (Accession No.) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เลขทะเบียน (Accession No.)</label>
                <input
                  type="text"
                  value={editingRecord.accession_no || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, accession_no: e.target.value })}
                  placeholder="เช่น 0000000001"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* สถานที่จัดเก็บ (Storage Location) */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">สถานที่จัดเก็บ (Storage Location)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={allAvailableStorageLocations.includes(editingRecord.storage_location) ? editingRecord.storage_location : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const newLoc = e.target.value;
                        const autoDdc = getAutoDdcForStorageLocation(newLoc);
                        setEditingRecord({
                          ...editingRecord,
                          storage_location: newLoc,
                          ...(autoDdc ? { ddc_082a: autoDdc } : {})
                        });
                        if (autoDdc) {
                          showToast(`📍 เลือกสถานที่จัดเก็บ "${newLoc}" และเปลี่ยน 082 $a เป็น "${autoDdc}" อัตโนมัติ`);
                        }
                      }
                    }}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- เลือกจากสถานที่จัดเก็บในระบบ --</option>
                    {allAvailableStorageLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editingRecord.storage_location || ''}
                    onChange={(e) => {
                      const newLoc = e.target.value;
                      const autoDdc = getAutoDdcForStorageLocation(newLoc);
                      setEditingRecord({
                        ...editingRecord,
                        storage_location: newLoc,
                        ...(autoDdc ? { ddc_082a: autoDdc } : {})
                      });
                    }}
                    placeholder="หรือพิมพ์ระบุสถานที่จัดเก็บ..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* วางลิงก์ภาพหน้าปกเอง: เพื่อดึงรูปปกมาด้วย (Cover image URL & Instant Preview) */}
              <div className="sm:col-span-2 md:col-span-3 bg-gradient-to-r from-amber-50/70 via-white to-emerald-50/50 p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        วางลิงก์ภาพหน้าปกเอง: เพื่อดึงรูปปกมาด้วย (MARC 856 $u / รูปปก)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        วาง URL ลิงก์รูปภาพหน้าปก (.jpg, .png, .webp) หรือกดปุ่มดึงปกหนังสือจริงด้วย AI
                      </p>
                    </div>
                  </div>
                  {editingRecord.cover_image && editingRecord.cover_image !== '-' && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <span>✓ ดึงรูปปกสำเร็จ</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-9 space-y-2">
                    <div className="relative">
                      <input
                        type="url"
                        value={editingRecord.cover_image || (editingRecord.electronic_856 && editingRecord.electronic_856.startsWith('http') ? editingRecord.electronic_856 : '')}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setEditingRecord({
                            ...editingRecord,
                            cover_image: val,
                            electronic_856: val || '-'
                          });
                        }}
                        placeholder="วางลิงก์รูปภาพ เช่น https://covers.openlibrary.org/b/isbn/...-M.jpg หรือลิงก์ภาพอื่น..."
                        className="w-full p-2.5 pl-3 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        disabled={isFetchingAiCover || (!editingRecord.isbn && !editingRecord.title_245a)}
                        onClick={handleFetchAiCover}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        title="ค้นหาและดึงรูปภาพปกจริงจาก Google Books, AI และ OpenLibrary อัตโนมัติ"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-amber-200 ${isFetchingAiCover ? 'animate-spin' : ''}`} />
                        <span>{isFetchingAiCover ? 'กำลังดึงปกจริงด้วย AI...' : 'ดึงปกหนังสือจริงด้วย AI'}</span>
                      </button>
                      {editingRecord.cover_image && editingRecord.cover_image !== '-' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord({
                              ...editingRecord,
                              cover_image: '',
                              electronic_856: '-'
                            });
                            showToast(`✕ ลบลิงก์รูปปกแล้ว`);
                          }}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                        >
                          ✕ ลบรูปปก
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Preview Area */}
                  <div className="md:col-span-3 flex justify-center md:justify-end">
                    {editingRecord.cover_image && editingRecord.cover_image.trim() !== '' && editingRecord.cover_image !== '-' ? (
                      <div className="relative group">
                        <img
                          src={editingRecord.cover_image}
                          alt="พรีวิวรูปปก"
                          className="w-20 h-28 object-cover rounded-xl shadow-md border-2 border-amber-400 bg-white"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200';
                          }}
                        />
                        <span className="absolute bottom-1 inset-x-1 text-[9px] text-center font-bold bg-black/70 text-white rounded px-1 py-0.5 truncate">
                          พรีวิวรูปปก
                        </span>
                      </div>
                    ) : (
                      <div className="w-20 h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-2 text-center text-slate-400 bg-slate-50/70">
                        <ImageIcon className="w-6 h-6 mb-1 opacity-40 text-slate-500" />
                        <span className="text-[10px] font-medium leading-tight">ยังไม่มีรูปปก</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  let updatedTags = Array.isArray(editingRecord.marc_tags) ? [...editingRecord.marc_tags] : [];
                  if (editingRecord.edition_250) {
                    const idx250 = updatedTags.findIndex(t => t.tagID === '250' || (t as any).tag === '250');
                    const tagObj = { tagID: '250', indc1: '', indc2: '', data: `$a${editingRecord.edition_250}` };
                    if (idx250 >= 0) updatedTags[idx250] = tagObj;
                    else updatedTags.push(tagObj);
                  }
                  if (editingRecord.author_personal && editingRecord.author_personal !== '-') {
                    const idx100 = updatedTags.findIndex(t => t.tagID === '100' || (t as any).tag === '100');
                    const tagObj = { tagID: '100', indc1: '1', indc2: '', data: `$a${editingRecord.author_personal}` };
                    if (idx100 >= 0) updatedTags[idx100] = tagObj;
                    else updatedTags.push(tagObj);
                  } else {
                    updatedTags = updatedTags.filter(t => t.tagID !== '100' && (t as any).tag !== '100');
                  }
                  if (editingRecord.author_corporate && editingRecord.author_corporate !== '-') {
                    const idx110 = updatedTags.findIndex(t => t.tagID === '110' || (t as any).tag === '110');
                    const tagObj = { tagID: '110', indc1: '2', indc2: '', data: `$a${editingRecord.author_corporate}` };
                    if (idx110 >= 0) updatedTags[idx110] = tagObj;
                    else updatedTags.push(tagObj);
                  } else {
                    updatedTags = updatedTags.filter(t => t.tagID !== '110' && (t as any).tag !== '110');
                  }
                  if (editingRecord.added_entry_700 && editingRecord.added_entry_700 !== '-') {
                    const idx700 = updatedTags.findIndex(t => t.tagID === '700' || (t as any).tag === '700');
                    const tagObj = { tagID: '700', indc1: '1', indc2: '', data: `$a${editingRecord.added_entry_700}` };
                    if (idx700 >= 0) updatedTags[idx700] = tagObj;
                    else updatedTags.push(tagObj);
                  } else {
                    updatedTags = updatedTags.filter(t => t.tagID !== '700' && (t as any).tag !== '700');
                  }
                  if (editingRecord.issn_022 && editingRecord.issn_022 !== '-') {
                    const idx022 = updatedTags.findIndex(t => t.tagID === '022' || (t as any).tag === '022');
                    const tagObj = { tagID: '022', indc1: '', indc2: '', data: `$a${editingRecord.issn_022}` };
                    if (idx022 >= 0) updatedTags[idx022] = tagObj;
                    else updatedTags.push(tagObj);
                  }
                  if (editingRecord.dimensions_300c && editingRecord.dimensions_300c !== '-') {
                    const idx300 = updatedTags.findIndex(t => t.tagID === '300' || (t as any).tag === '300');
                    const dimData = `$a${editingRecord.pages_300a || '180 หน้า'}${editingRecord.illustration_300b ? ` : $b${editingRecord.illustration_300b}` : ''} ; $c${editingRecord.dimensions_300c}`;
                    if (idx300 >= 0) updatedTags[idx300] = { ...updatedTags[idx300], data: dimData };
                    else updatedTags.push({ tagID: '300', indc1: '', indc2: '', data: dimData });
                  }
                  if (editingRecord.note_contents_505 && editingRecord.note_contents_505 !== '-') {
                    const idx505 = updatedTags.findIndex(t => t.tagID === '505' || (t as any).tag === '505');
                    const tagObj = { tagID: '505', indc1: '0', indc2: '', data: `$a${editingRecord.note_contents_505}` };
                    if (idx505 >= 0) updatedTags[idx505] = tagObj;
                    else updatedTags.push(tagObj);
                  }
                  // Update all 650 subject tags cleanly (supports all subjects without limit of 3)
                  updatedTags = updatedTags.filter(t => t.tagID !== '650' && (t as any).tag !== '650');
                  const allSubsToSave: string[] = [];
                  if (editingRecord.subject_650a && editingRecord.subject_650a !== '-' && editingRecord.subject_650a !== 'ทั่วไป') {
                    allSubsToSave.push(editingRecord.subject_650a.trim());
                  }
                  if (editingRecord.subject_650_2 && editingRecord.subject_650_2 !== '-' && editingRecord.subject_650_2 !== 'ทั่วไป') {
                    allSubsToSave.push(editingRecord.subject_650_2.trim());
                  }
                  if (editingRecord.subject_650_3 && editingRecord.subject_650_3 !== '-' && editingRecord.subject_650_3 !== 'ทั่วไป') {
                    allSubsToSave.push(editingRecord.subject_650_3.trim());
                  }
                  if (editingRecord.subject_650_4 && editingRecord.subject_650_4 !== '-' && editingRecord.subject_650_4 !== 'ทั่วไป') {
                    allSubsToSave.push(editingRecord.subject_650_4.trim());
                  }
                  if (editingRecord.subject_650_5 && editingRecord.subject_650_5 !== '-' && editingRecord.subject_650_5 !== 'ทั่วไป') {
                    allSubsToSave.push(editingRecord.subject_650_5.trim());
                  }
                  if (Array.isArray((editingRecord as any).extraSubjects)) {
                    (editingRecord as any).extraSubjects.forEach((s: string) => {
                      const clean = (s || '').trim();
                      if (clean && clean !== '-' && clean !== 'ทั่วไป' && !allSubsToSave.includes(clean)) {
                        allSubsToSave.push(clean);
                      }
                    });
                  }
                  allSubsToSave.forEach(subj => {
                    updatedTags.push({ tagID: '650', indc1: '', indc2: '4', data: `$a${subj}` });
                  });
                  if (editingRecord.cover_image && editingRecord.cover_image !== '-') {
                    const idx856 = updatedTags.findIndex(t => t.tagID === '856' || (t as any).tag === '856');
                    const tagObj = { tagID: '856', indc1: '4', indc2: '2', data: `$u${editingRecord.cover_image}` };
                    if (idx856 >= 0) updatedTags[idx856] = tagObj;
                    else updatedTags.push(tagObj);
                  }
                  const currentCopyInfo = calculateCopyNumber(editingRecord, records, libraryBooks);
                  const finalRec = {
                    ...editingRecord,
                    copies: String(currentCopyInfo.copyNumber),
                    all650Subjects: allSubsToSave,
                    marc_tags: updatedTags
                  };
                  setRecords(prev => {
                    const next = prev.map(item => item.id === finalRec.id ? finalRec : item);
                    saveRecordsToIndexedDb(next);
                    return next;
                  });
                  await handleSyncToLibrary(finalRec);
                  setEditingRecord(null);
                  showToast(`💾 บันทึกข้อมูลบรรณานุกรม "${finalRec.title_245a.substring(0, 25)}..." เรียบร้อยแล้ว`);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกการแก้ไข & ลงฐานข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thai Cutter Reference Table Modal (TK Park, Chula, PSU Standard) */}
      {isCutterTableOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      การให้เลขคัตเตอร์ผู้แต่ง (ภาษาไทย)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                      TK, จุฬาฯ, มอ.
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    มาตรฐานการกำหนดเลขประจำหนังสือ (Author Cutter Number) สำหรับระบบบรรณานุกรมห้องสมุด
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCutterTableOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setCutterModalTab('system_authors')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  cutterModalTab === 'system_authors'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>รวบรวมเลขผู้แต่งในระบบทั้งหมด ({filteredSystemAuthors.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCutterModalTab('calculator')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  cutterModalTab === 'calculator'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>ตารางเทียบและคำนวณเลขคัตเตอร์ (สูตรมาตรฐาน)</span>
              </button>
            </div>

            {/* TAB 1: System Authors & Cutters Table (2 Columns: Tag 100/110 & Tag 082 $b Cutter) */}
            {cutterModalTab === 'system_authors' && (
              <div className="space-y-4">
                {/* Search & Type Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={cutterSearchTerm}
                      onChange={(e) => setCutterSearchTerm(e.target.value)}
                      placeholder="ค้นหาชื่อผู้แต่งบุคคล/นิติบุคคล หรือเลขคัตเตอร์ (เช่น กอมโดริ, ก363, งามพรรณ)..."
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
                    />
                    {cutterSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setCutterSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 self-center">
                    <button
                      type="button"
                      onClick={() => setCutterTypeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        cutterTypeFilter === 'all'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ทั้งหมด ({allSystemAuthors.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCutterTypeFilter('personal')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        cutterTypeFilter === 'personal'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      บุคคล (Tag 100)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCutterTypeFilter('corporate')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        cutterTypeFilter === 'corporate'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      นิติบุคคล (Tag 110)
                    </button>
                  </div>
                </div>

                {/* Subtitle / summary info */}
                <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                  <span className="font-medium">
                    แสดง <strong className="text-slate-900 font-bold">{filteredSystemAuthors.length}</strong> รายการ (เรียงตามลำดับตัวอักษร ก-ฮ, A-Z)
                  </span>
                  {isLoadingDbAuthors && (
                    <span className="text-rose-600 font-medium animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> กำลังซิงค์ข้อมูลผู้แต่งจากระบบ...
                    </span>
                  )}
                </div>

                {/* 2-Column Authors & Cutter Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-[52vh] overflow-y-auto bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 sticky top-0 z-10 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4 w-7/12">
                          ชื่อผู้แต่งบุคคลและนิติบุคคล (จาก Tag 100 และ Tag 110)
                        </th>
                        <th className="py-3 px-4 w-5/12 text-right">
                          เลขผู้แต่ง (Tag 082 $b หรือ Cutter ประจำผู้แต่ง)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredSystemAuthors.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-10 text-center text-slate-400">
                            <p className="font-bold text-sm text-slate-600">ไม่พบข้อมูลผู้แต่งที่ตรงกับคำค้นหา "{cutterSearchTerm}"</p>
                            <p className="text-xs text-slate-400 mt-1">สามารถเปลี่ยนคำค้นหา หรือสลับไปแท็บคำนวณเลขคัตเตอร์ตามสูตรมาตรฐาน</p>
                          </td>
                        </tr>
                      ) : (
                        filteredSystemAuthors.map((item, idx) => (
                          <tr key={`sys_auth_${item.id}_${idx}`} className="hover:bg-rose-50/40 transition group">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <span className={`p-2 rounded-xl flex-shrink-0 ${
                                  item.type === 'corporate' 
                                    ? 'bg-amber-100 text-amber-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {item.type === 'corporate' ? (
                                    <Building className="w-4 h-4" />
                                  ) : (
                                    <Users className="w-4 h-4" />
                                  )}
                                </span>
                                <div>
                                  <span className="font-normal text-slate-900 text-sm block">
                                    {item.authorName}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-normal ${
                                      item.type === 'corporate'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                                    }`}>
                                      {item.type === 'corporate' ? 'Tag 110 นิติบุคคล' : 'Tag 100 บุคคล'}
                                    </span>
                                    {item.source && (
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        • {item.source}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-mono font-normal text-sm text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-sm">
                                  {item.authorCutter || '-'}
                                </span>
                                {item.authorCutter && item.authorCutter !== '-' && (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(item.authorCutter, `เลขคัตเตอร์ ${item.authorName}`)}
                                    title="คัดลอกเลขคัตเตอร์เฉพาะของผู้แต่งนี้"
                                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition border border-transparent hover:border-emerald-200 cursor-pointer"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTestAuthor(item.authorName);
                                    setCutterModalTab('calculator');
                                    showToast(`นำชื่อ "${item.authorName}" ไปทดสอบคำนวณคัตเตอร์เรียบร้อย`);
                                  }}
                                  title="นำไปทดสอบคำนวณร่วมกับชื่อเรื่องในแท็บคำนวณ"
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-800 text-slate-700 font-normal rounded-xl text-xs transition cursor-pointer"
                                >
                                  ทดสอบคำนวณ
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Cutter Calculator & Reference Tables */}
            {cutterModalTab === 'calculator' && (
              <div className="space-y-5">
            {/* Interactive Live Cutter Tester */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>ทดลองคำนวณเลขคัตเตอร์อัตโนมัติ (สูตรมาตรฐาน 4 หลัก)</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">คำนวณเลข 4 หลักตามสูตรตารางเทียบทันที</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">ชื่อผู้แต่ง (Author):</label>
                  <AuthorInputWithSuggestions
                    value={testAuthor}
                    onChange={(val) => setTestAuthor(val)}
                    onSelectAuthor={(selectedAuthor, cutter) => {
                      setTestAuthor(selectedAuthor);
                      showToast(`👤 เลือกผู้แต่ง "${selectedAuthor}" (คัตเตอร์: ${cutter}) เรียบร้อย`);
                    }}
                    records={records}
                    currentTitle={testTitle}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">ชื่อหนังสือ (Title):</label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="เช่น การทดลอง, ทุกมื้ออร่อยจัง..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-1 flex flex-col justify-end">
                  {(() => {
                    const existingCutters = new Set(records.map(r => r.cutter_082b).filter(Boolean));
                    const calculatedCutter = (testAuthor || testTitle) ? calculateThaiCutter(testAuthor, testTitle, existingCutters) : '-';
                    return (
                      <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-between px-3.5 border border-emerald-500">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-200 block">เลขคัตเตอร์ที่ได้ (082 $B):</span>
                          <span className="text-lg font-black font-mono tracking-wider text-white">
                            {calculatedCutter}
                          </span>
                        </div>
                        {calculatedCutter !== '-' && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(calculatedCutter, 'เลขคัตเตอร์ (082 $b)')}
                            title="คัดลอกเลขคัตเตอร์ (082 $b)"
                            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer border border-emerald-400/60 hover:scale-105"
                          >
                            <Copy className="w-3.5 h-3.5 text-amber-300" />
                            <span>คัดลอก</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Consonants & Vowels Reference Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Consonants Table */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>1. ตารางพยัญชนะ</span>
                  <span className="text-[10px] text-slate-500 font-normal">ตัวเลขแทนกลุ่มพยัญชนะ</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="space-y-1.5">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ก ข ค ฆ</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">1</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ง จ ฉ ช ซ ฌ</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">2</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ญ ฎ ฏ ฐ ฑ ฒ</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">3</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ณ ด ต ถ ท ธ</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">4</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">น บ ป ผ ฝ</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">5</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">พ ฟ ภ ม ย</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">6</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ร ล ว</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">7</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ศ ษ ส</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">8</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ห ฬ อ ฮ</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">9</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ฤ ฦ</span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded">10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vowels Table */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>2. ตารางสระ</span>
                  <span className="text-[10px] text-slate-500 font-normal">ตัวเลขแทนกลุ่มสระ</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="space-y-1.5">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">- ะ  ั  - ั ะ</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">1</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">า  ำ</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">2</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ิ  ี  ึ  ื</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">3</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ุ  ู</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">4</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">เ-  เ-ะ</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">5</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">เ-า  เ-าะ</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">6</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">เ ีย  เ ียะ  เ ือ</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">7</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">แ-  แ-ะ  โ-  โ-ะ</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">8</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-sans font-normal text-[16px] text-slate-800">ใ-  ไ-</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded">9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Box */}
            <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-900">3. ตัวอย่างการเทียบเลขคัตเตอร์ตามมาตรฐาน</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-700">โสรยา</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">.ส87</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-700">แพรวา (ควบกล้ำ)</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">.พ78</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-700">เปรมเกียรติ</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">.ป75</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-700">กฤษณา (ฤ=10)</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">.ก108</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-700">ฉัตราภรณ์</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">.ฉ14</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-700">ธีรดา</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">.ธ37</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-700">วรธิดา</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">.ว74</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-700">คอมพิวเตอร์ฯ (ไร้ผู้แต่ง)</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">.ค96</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsCutterTableOpen(false)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            ปิดหน้าต่างตารางคัตเตอร์
          </button>
        </div>
      </div>
    </div>
  )}

      {/* Dewey Decimal Classification (DDC) Modal */}
      <DdcClassificationModal
        isOpen={isDdcModalOpen}
        onClose={() => setIsDdcModalOpen(false)}
        onSelectDdc={handleSelectDdcFromModal}
      />

      {/* Subject Headings & DDC Classification Modal (Tag 650 & Tag 082 $a) */}
      {isSubjectHeadingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      รวบรวมหัวเรื่อง (Tag 650) และเลขหมู่ DDC (Tag 082 $a) ในระบบทั้งหมด
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                      Tag 650 $a ⟷ Tag 082 $a
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    รวบรวมทุกหัวเรื่องทั้งหมดในระบบ (รายการที่มีมากกว่า 3 หัวเรื่อง จะรวบรวมครบทั้งหมด) พร้อมระบุเลขหมู่ DDC ที่สอดคล้อง เพื่อความสะดวกและเป็นมาตรฐานในการกำหนดหมวดหมู่
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubjectHeadingsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={subjectSearchTerm}
                  onChange={(e) => setSubjectSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อหัวเรื่อง หรือเลขหมู่ DDC (เช่น จิตวิทยา, การเงิน, 158.1, 895.913, ด, ย)..."
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 shadow-xs"
                />
                {subjectSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setSubjectSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-0.5">
                {[
                  { id: 'all', label: `ทั้งหมด (${allSystemSubjects.length})` },
                  { id: '1', label: '100 ปรัชญา/จิตวิทยา' },
                  { id: '3', label: '300 สังคม/การเงิน' },
                  { id: '6', label: '600 เทคโนโลยี/ธุรกิจ' },
                  { id: '8', label: '800 วรรณกรรม' },
                  { id: '9', label: '900 ประวัติศาสตร์' },
                  { id: 'children', label: 'ด/ย เด็กและเยาวชน' },
                  { id: '0', label: '000 คอมพิวเตอร์' },
                  { id: '5', label: '500 วิทยาศาสตร์' },
                  { id: '7', label: '700 ศิลปะ' },
                  { id: '2', label: '200 ศาสนา' },
                  { id: '4', label: '400 ภาษา' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSubjectCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      subjectCategoryFilter === tab.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtitle / summary info */}
            <div className="flex items-center justify-between px-1 text-xs text-slate-500">
              <span className="font-medium">
                แสดง <strong className="text-slate-900 font-bold">{filteredSystemSubjects.length}</strong> รายการ (เรียงตามลำดับตัวอักษร ก-ฮ, A-Z)
              </span>
              {isLoadingDbSubjects && (
                <span className="text-emerald-600 font-medium animate-pulse flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> กำลังซิงค์ข้อมูลหัวเรื่องและเลขหมู่จากระบบ...
                </span>
              )}
            </div>

            {/* 2-Column Subject & DDC Table (Exact matching Author Cutter layout) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-[52vh] overflow-y-auto bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 sticky top-0 z-10 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-7/12">
                      หัวเรื่อง (จาก Tag 650 $a และหัวเรื่องในระบบ)
                    </th>
                    <th className="py-3 px-4 w-5/12 text-right">
                      เลขหมู่หนังสือ DDC (Tag 082 $a)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSystemSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-10 text-center text-slate-400">
                        <p className="font-bold text-sm text-slate-600">ไม่พบข้อมูลหัวเรื่องที่ตรงกับคำค้นหา "{subjectSearchTerm}"</p>
                        <p className="text-xs text-slate-400 mt-1">สามารถเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นจากปุ่มตัวกรองด้านบน</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSystemSubjects.map((item, idx) => (
                      <tr key={`sys_subj_${item.id}_${idx}`} className="hover:bg-emerald-50/40 transition group">
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2.5">
                            <span className="p-2 rounded-xl flex-shrink-0 bg-emerald-100 text-emerald-700 mt-0.5">
                              <Tag className="w-4 h-4" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm block">
                                  {item.subject}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.subject, `หัวเรื่อง "${item.subject}"`)}
                                  title="คัดลอกชื่อหัวเรื่องนี้"
                                  className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition border border-transparent hover:border-emerald-200 cursor-pointer opacity-70 group-hover:opacity-100"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Tag 650 $a
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                  {item.category}
                                </span>
                                {item.bookCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
                                    {item.bookCount.toLocaleString()} เล่มในระบบ
                                  </span>
                                )}
                                {item.source && (
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    • {item.source}
                                  </span>
                                )}
                              </div>
                              {item.sampleTitles.length > 0 && (
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                  <span className="font-semibold text-slate-600">ตัวอย่างหนังสือ:</span> {item.sampleTitles.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-xs">
                              {item.primaryDdc || '-'}
                            </span>
                            {item.allDdcs.length > 1 && (
                              <div className="hidden sm:flex flex-wrap items-center justify-end gap-1" title="เลขหมู่อื่นๆ ที่มีการจัดเก็บในระบบสำหรับหัวเรื่องนี้">
                                {item.allDdcs.slice(1, 3).map((d, i) => (
                                  <span key={i} className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                    {d.ddc} ({d.count})
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.primaryDdc && item.primaryDdc !== '-' && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(item.primaryDdc, `เลขหมู่ DDC ${item.primaryDdc}`)}
                                title="คัดลอกเลขหมู่ DDC"
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition border border-transparent hover:border-emerald-200 cursor-pointer"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(item.subject);
                                setIsSubjectHeadingsModalOpen(false);
                                showToast(`🔍 กรองตารางด้วยหัวเรื่อง "${item.subject}" เรียบร้อยแล้ว`);
                              }}
                              title="ค้นหาหนังสือในตารางที่ใช้หัวเรื่องนี้"
                              className="px-2.5 py-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Search className="w-3 h-3" />
                              <span>กรองในตาราง</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                รวมหัวเรื่องทั้งหมดในระบบ: <strong className="text-emerald-700 font-bold">{allSystemSubjects.length.toLocaleString()}</strong> รายการ (รวบรวมครบทุกหัวเรื่อง ไม่จำกัดจำนวน)
              </span>
              <button
                type="button"
                onClick={() => setIsSubjectHeadingsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                ปิดหน้าต่างรวบรวมหัวเรื่อง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UC-TAL Bibliographic & Full MARC 21 Tag Breakdown Modal (Matching exact UC-TAL Standard) */}
      {viewingMarcDetail && (() => {
        let baseTagsList: MarcTagItem[] = [];
        if (Array.isArray(viewingMarcDetail.marcRaw) && viewingMarcDetail.marcRaw.length > 0) {
          baseTagsList = JSON.parse(JSON.stringify(viewingMarcDetail.marcRaw));
        } else if (Array.isArray(viewingMarcDetail.marc_tags) && viewingMarcDetail.marc_tags.length > 0) {
          baseTagsList = JSON.parse(JSON.stringify(viewingMarcDetail.marc_tags));
        } else {
          baseTagsList = generateMarcTagsFromRecord(viewingMarcDetail as Marc21Record);
        }

        // Ensure Tag 520 (เรื่องย่อ) is included and reflects enriched internet synopsis if available
        const tag520IdxInModal = baseTagsList.findIndex(t => t.tagID === '520');
        const enrichedSummary = viewingMarcDetail.summary_520 || viewingMarcDetail.summary;
        if (enrichedSummary) {
          if (tag520IdxInModal !== -1) {
            baseTagsList[tag520IdxInModal].data = `$a${enrichedSummary}`;
            baseTagsList[tag520IdxInModal].fromInternet = true;
          } else {
            const insertIdx = baseTagsList.findIndex(t => parseInt(t.tagID, 10) >= 600);
            const tag520: MarcTagItem = {
              tagID: '520',
              indc1: '',
              indc2: '',
              data: `$a${enrichedSummary}`,
              fromInternet: true
            };
            if (insertIdx !== -1) baseTagsList.splice(insertIdx, 0, tag520);
            else baseTagsList.push(tag520);
          }
        }

        // Ensure Tag 541 (ราคาปกติ) reflects enriched retail price if available
        const tag541IdxInModal = baseTagsList.findIndex(t => t.tagID === '541');
        const enrichedPrice = viewingMarcDetail.price_541 || viewingMarcDetail.price;
        if (enrichedPrice && enrichedPrice !== '-') {
          const priceStr = enrichedPrice.includes('บาท') ? enrichedPrice : `${enrichedPrice} บาท`;
          if (tag541IdxInModal !== -1) {
            baseTagsList[tag541IdxInModal].data = `$c${priceStr}`;
          } else {
            const insertIdx = baseTagsList.findIndex(t => parseInt(t.tagID, 10) >= 600);
            const tag541: MarcTagItem = {
              tagID: '541',
              indc1: '',
              indc2: '',
              data: `$c${priceStr}`
            };
            if (insertIdx !== -1) baseTagsList.splice(insertIdx, 0, tag541);
            else baseTagsList.push(tag541);
          }
        }

        // Customize MARC tags based on selected holding institution
        let marcTagsList = [...baseTagsList];
        const instSymbol = selectedHoldingLib?.symbol || selectedHoldingLib?.locationSymbol;
        const instName = selectedHoldingLib?.nameTh || selectedHoldingLib?.locationNameTh;

        if (instSymbol) {
          // Tag 040 Cataloging Source
          const idx040 = marcTagsList.findIndex(t => t.tagID === '040');
          const tag040Obj: MarcTagItem = { tagID: '040', indc1: '', indc2: '', data: `$a${instSymbol}$c${instSymbol}` };
          if (idx040 >= 0) marcTagsList[idx040] = tag040Obj;
          else {
            const ins040 = marcTagsList.findIndex(t => parseInt(t.tagID, 10) >= 41 || parseInt(t.tagID, 10) >= 100);
            if (ins040 >= 0) marcTagsList.splice(ins040, 0, tag040Obj);
            else marcTagsList.push(tag040Obj);
          }

          // Tag 003 Agency
          const idx003 = marcTagsList.findIndex(t => t.tagID === '003');
          const tag003Obj: MarcTagItem = { tagID: '003', indc1: '', indc2: '', data: `UCTAL-${instSymbol}` };
          if (idx003 >= 0) marcTagsList[idx003] = tag003Obj;
          else {
            const ins003 = marcTagsList.findIndex(t => parseInt(t.tagID, 10) >= 5);
            if (ins003 >= 0) marcTagsList.splice(ins003, 0, tag003Obj);
            else marcTagsList.push(tag003Obj);
          }

          // Tag 907 Local Bib
          const idx907 = marcTagsList.findIndex(t => t.tagID === '907');
          const localBibVal = viewingMarcDetail.bibId || (viewingMarcDetail.accession_no ? `b${viewingMarcDetail.accession_no}` : 'b0000000');
          const tag907Obj: MarcTagItem = { tagID: '907', indc1: '', indc2: '', data: `$a${localBibVal}-$b${instSymbol}` };
          if (idx907 >= 0) marcTagsList[idx907] = tag003Obj;
          else marcTagsList.push(tag907Obj);
        }

        const handleCopyMarcContent = () => {
          const lines = marcTagsList.map(t => `${t.tagID}\t${t.indc1 || ' '}\t${t.indc2 || ' '}\t${t.data}`);
          navigator.clipboard.writeText(lines.join('\n')).then(() => {
            showToast('📋 คัดลอกข้อมูล MARC 21 ทั้งหมดลงคลิปบอร์ดแล้ว');
          });
        };

        const isAlreadyInTable = records.some(r => r.id === viewingMarcDetail.id || (r.isbn && r.isbn === viewingMarcDetail.isbn));

        const holdingLibs = Array.isArray(viewingMarcDetail.libraries) ? viewingMarcDetail.libraries : [];

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col justify-between space-y-3.5 animate-scaleIn">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    MARC
                  </h3>
                  {selectedHoldingLib ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1">
                      <span>🏛️</span>
                      <span>สถาบัน: {selectedHoldingLib.nameTh || selectedHoldingLib.symbol} ({selectedHoldingLib.symbol})</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                      🌐 ข้อมูลกลาง UC-TAL (All Libraries)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setViewingMarcDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Holding Institutions Switcher Bar */}
              {holdingLibs.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>เลือกดูระเบียน MARC ตามสถาบันที่ถือครอง ({holdingLibs.length} สถาบัน):</span>
                    </span>
                    <span className="text-[11px] text-slate-500">คลิกเพื่อสลับและดูข้อมูลของแต่ละสถาบัน</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setSelectedHoldingLib(null)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        selectedHoldingLib === null
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>🌐</span>
                      <span>ข้อมูลกลาง (UC-TAL)</span>
                    </button>
                    {holdingLibs.map((lib: any, lIdx: number) => {
                      const isSelected = selectedHoldingLib?.symbol === lib.symbol || selectedHoldingLib?.nameTh === lib.nameTh;
                      return (
                        <button
                          key={lIdx}
                          type="button"
                          onClick={() => setSelectedHoldingLib(lib)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm ring-2 ring-amber-400'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-amber-300'
                          }`}
                        >
                          <span className="font-mono text-[10px] px-1 rounded bg-slate-100/80 text-slate-900">{lib.symbol}</span>
                          <span>{lib.nameTh || lib.nameEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MARC Tag Table (Exact match to UC-TAL ThaiLIS view) */}
              <div className="flex-1 overflow-y-auto max-h-[56vh] pr-1">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-900">
                      <th className="py-2.5 px-3 font-bold w-24 sm:w-28">Tag</th>
                      <th className="py-2.5 px-3 font-bold w-24 sm:w-28">Indicator1</th>
                      <th className="py-2.5 px-3 font-bold w-24 sm:w-28">Indicator2</th>
                      <th className="py-2.5 px-3 font-bold">Subfield</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {marcTagsList.map((tag, tIdx) => (
                      <tr key={tIdx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 align-top">
                          <div className="flex items-center gap-1.5">
                            <span>{tag.tagID}</span>
                            {tag.tagID === '520' && tag.fromInternet && (
                              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hidden sm:inline" title="ดึงข้อมูลเรื่องย่ออัตโนมัติจากอินเทอร์เน็ต">
                                ✨ เรื่องย่อจากอินเทอร์เน็ต
                              </span>
                            )}
                            {tag.tagID === '040' && selectedHoldingLib && (
                              <span className="text-[10px] font-mono px-1 rounded bg-amber-100 text-amber-900 border border-amber-200 hidden sm:inline">
                                {selectedHoldingLib.symbol}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 align-top font-mono">
                          {tag.indc1 && tag.indc1.trim() ? tag.indc1 : ''}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 align-top font-mono">
                          {tag.indc2 && tag.indc2.trim() ? tag.indc2 : ''}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 break-words leading-relaxed align-top">
                          {tag.data}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMarcContent}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก MARC ทั้งหมด</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleImportFromUctal(viewingMarcDetail, selectedHoldingLib);
                      setViewingMarcDetail(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {selectedHoldingLib
                        ? `นำเข้าตาราง MARC 21 (ดึงข้อมูลทั้งหมดของ ${selectedHoldingLib.symbol})`
                        : 'นำเข้าตาราง MARC 21 (ดึงข้อมูลทั้งหมด)'}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingMarcDetail(null)}
                  className="px-6 py-2 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-950 font-medium text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DELETE CONFIRMATION MODAL FOR MARC21 GENERATOR */}
      {deleteConfirmTarget === 'selected' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden">
            <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-base">
                <AlertTriangle className="h-5 w-5 text-amber-300 shrink-0" />
                <span>ยืนยันการลบ {selectedIds.size} รายการที่เลือก</span>
              </div>
              <button 
                type="button" 
                onClick={() => setDeleteConfirmTarget(null)} 
                className="p-1 hover:bg-rose-700 rounded-full transition text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-slate-700 font-medium">
                  คุณแน่ใจหรือว่าต้องการลบรายการที่เลือกจำนวน <strong className="text-rose-600 font-bold">{selectedIds.size}</strong> รายการ ออกจากตารางสร้าง MARC 21?
                </p>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 divide-y divide-slate-100 text-xs">
                  {records.filter(r => selectedIds.has(r.id)).map((r, idx) => (
                    <div key={r.id} className="py-1.5 px-2 flex justify-between gap-2">
                      <span className="font-bold text-slate-800 truncate">{idx + 1}. {r.title_245a || 'ไม่ระบุชื่อเรื่อง'}</span>
                      <span className="font-mono text-slate-500 shrink-0">{formatAccessionNo(r.accession_no)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                <div className="font-bold text-rose-950 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>คำเตือน: ยืนยันการลบรายการ</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  รายการที่เลือกจะถูกตัดออกจากตารางสร้าง MARC 21 และระบบทันที
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setDeleteConfirmTarget(null)} 
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    confirmDeleteSelectedExecution();
                  }} 
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>ยืนยันการลบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPABASE CLOUD & REAL-TIME SETUP MODAL */}
      {isCloudSetupModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-indigo-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                    <span>ตั้งค่าตาราง SQL ใน Supabase สำหรับซิงค์ข้อมูล Real-time</span>
                    <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Cross-Device
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-100">
                    แสดงข้อมูลตรงกันทุกอุปกรณ์ทันทีเมื่อลงข้อมูล โดยไม่ต้องกดรีเฟรชหน้าจอ (F5)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloudSetupModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-600 leading-relaxed">
              {/* RLS Error Urgent Alert Banner */}
              {hasRlsError && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1">
                    <div className="font-extrabold text-rose-800 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>พบสาเหตุ: ติดระบบความปลอดภัย Row-Level Security (RLS) บน Supabase</span>
                    </div>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      คุณมีตาราง <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-200 text-rose-950">marc21_records</code> เรียบร้อยแล้ว แต่ Supabase บล็อกสิทธิ์การเขียนข้อมูลจากหน้าเว็บ!
                      <br />
                      👉 <strong>วิธีแก้ใน 1 วินาที:</strong> เพียงกดปุ่ม <strong>"คัดลอกคำสั่งปลดล็อค RLS ทันที"</strong> ด้านขวา แล้วนำไปวางใน <strong>Supabase SQL Editor</strong> กด <strong>Run</strong> แค่ครั้งเดียว จะซิงค์ข้อมูลได้ทันทีทุกเครื่อง!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const rlsOnlySql = `-- ปลดล็อค Row-Level Security (RLS) สำหรับตาราง marc21_records ให้บันทึกและแก้ไขข้อมูลได้ 100%
ALTER TABLE marc21_records DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for marc21_records" ON marc21_records;
CREATE POLICY "Allow all for marc21_records" 
ON marc21_records 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

ALTER TABLE marc21_records REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'marc21_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marc21_records;
  END IF;
END $$;`;
                      navigator.clipboard.writeText(rlsOnlySql);
                      setCopiedRlsSql(true);
                      showToast('📋 คัดลอกคำสั่งปลดล็อค RLS เรียบร้อยแล้ว! นำไปวางใน Supabase SQL Editor แล้วกด Run ได้เลย');
                      setTimeout(() => setCopiedRlsSql(false), 3000);
                    }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 text-xs shadow-md"
                  >
                    {copiedRlsSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedRlsSql ? 'คัดลอกแล้ว!' : 'คัดลอกคำสั่งปลดล็อค RLS ทันที'}</span>
                  </button>
                </div>
              )}

              {/* Status & Explanation Box */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2">
                <div className="font-bold text-indigo-950 flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>ทำไมต้องสร้างตารางใน SQL ใน Supabase?</span>
                </div>
                <p className="text-slate-700">
                  หากยังไม่ได้สร้างตารางหรือยังไม่ได้ปลดล็อค RLS ใน Supabase ข้อมูลในตารางของหน้า <strong>สร้าง MARC 21 (MARC 21 AI)</strong> จะถูกเก็บไว้ใน <strong>LocalStorage (หน่วยความจำของเครื่องนั้นๆ)</strong> ทำให้คอมพิวเตอร์เครื่องที่ 2 หรืออุปกรณ์อื่นมองไม่เห็นข้อมูลที่ลงจากเครื่องที่ 1
                </p>
                <p className="text-emerald-800 font-medium">
                  💡 <strong>เมื่อสร้างตารางและเปิด Supabase Realtime แล้ว:</strong> ทุกครั้งที่คอมที่ 1 มีการลงข้อมูล/แก้ไข/ลบ ระบบ Supabase จะส่งสัญญาณ WebSocket ไปอัปเดตหน้าจอของคอมที่ 2 ให้เห็นผลทันทีในเสี้ยววินาที <strong>โดยไม่ต้องกดรีเฟรชหน้าจอเลย!</strong>
                </p>
              </div>

              {/* 3 Steps Guide */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">✓</span>
                  <span>วิธีทำง่ายๆ เพียง 3 ขั้นตอน (ใช้เวลาไม่ถึง 1 นาที)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-indigo-700 text-xs">ขั้นตอนที่ 1</div>
                    <p className="text-slate-700">
                      เปิดเว็บ <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-2.5 h-2.5" /></a> แล้วเลือกโปรเจกต์ของคุณ
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-indigo-700 text-xs">ขั้นตอนที่ 2</div>
                    <p className="text-slate-700">
                      ไปที่เมนูด้านซ้าย <strong>"SQL Editor"</strong> แล้วกดปุ่ม <strong>"+ New query"</strong>
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-indigo-700 text-xs">ขั้นตอนที่ 3</div>
                    <p className="text-slate-700">
                      กดปุ่ม <strong>"คัดลอกคำสั่ง SQL"</strong> ด้านล่าง นำไปวางในช่อง แล้วกดปุ่มเขียว <strong>"Run" (หรือกด Ctrl+Enter)</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Selector: Column Upgrade vs RLS Unlock vs Full SQL */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCloudSqlTab('columns')}
                      className={`px-3 py-1.5 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        cloudSqlTab === 'columns'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>1. เพิ่มคอลัมน์หัวเรื่อง 2-5 (ALTER TABLE สำหรับตารางเดิม)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloudSqlTab('rls')}
                      className={`px-3 py-1.5 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        cloudSqlTab === 'rls'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>2. คำสั่งปลดล็อค RLS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloudSqlTab('all')}
                      className={`px-3 py-1.5 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        cloudSqlTab === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>3. คำสั่ง SQL ฉบับเต็ม (สร้างตารางใหม่)</span>
                    </button>
                  </div>

                  {cloudSqlTab === 'columns' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const colSql = `-- คำสั่ง SQL สำหรับเพิ่มคอลัมน์เก็บหัวเรื่อง 2 - 5 ในตาราง marc21_records บน Supabase
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_2 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_3 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_4 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_5 TEXT;

-- ปลดล็อค Row-Level Security (RLS) สำหรับตาราง marc21_records ให้บันทึกและแก้ไขข้อมูลได้ 100%
ALTER TABLE marc21_records DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for marc21_records" ON marc21_records;
CREATE POLICY "Allow all for marc21_records" 
ON marc21_records 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- เปิดใช้งาน Realtime
ALTER TABLE marc21_records REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'marc21_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marc21_records;
  END IF;
END $$;`;
                        navigator.clipboard.writeText(colSql);
                        setCopiedColSql(true);
                        showToast('📋 คัดลอกคำสั่งเพิ่มคอลัมน์หัวเรื่อง 2-5 เรียบร้อยแล้ว! นำไปวางใน Supabase SQL Editor แล้วกด Run ได้เลย');
                        setTimeout(() => setCopiedColSql(false), 3000);
                      }}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs text-xs"
                    >
                      {copiedColSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedColSql ? 'คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกคำสั่งเพิ่มคอลัมน์หัวเรื่อง 2-5'}</span>
                    </button>
                  ) : cloudSqlTab === 'rls' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const rlsOnlySql = `-- ปลดล็อค Row-Level Security (RLS) สำหรับตาราง marc21_records ให้บันทึกและแก้ไขข้อมูลได้ 100%
ALTER TABLE marc21_records DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for marc21_records" ON marc21_records;
CREATE POLICY "Allow all for marc21_records" 
ON marc21_records 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

ALTER TABLE marc21_records REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'marc21_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marc21_records;
  END IF;
END $$;`;
                        navigator.clipboard.writeText(rlsOnlySql);
                        setCopiedRlsSql(true);
                        showToast('📋 คัดลอกคำสั่งปลดล็อค RLS เรียบร้อยแล้ว! นำไปวางใน Supabase SQL Editor ได้เลย');
                        setTimeout(() => setCopiedRlsSql(false), 3000);
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs text-xs"
                    >
                      {copiedRlsSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRlsSql ? 'คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกคำสั่งปลดล็อค RLS'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const sqlContent = `-- 1. สร้างตารางจัดเก็บข้อมูลตารางทำงาน MARC 21 AI
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
  subject_650_4 TEXT,
  subject_650_5 TEXT,
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

-- เพิ่มคอลัมน์เก็บหัวเรื่อง 2 ถึง 5 หากมีตารางเดิมอยู่แล้ว
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_2 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_3 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_4 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_5 TEXT;

-- 2. ปิด RLS และสร้าง Policy อนุญาตให้อ่าน/เขียนได้ 100%
ALTER TABLE marc21_records DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for marc21_records" ON marc21_records;
CREATE POLICY "Allow all for marc21_records" 
ON marc21_records 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- 3. ตั้งค่า Replica Identity เป็น FULL เพื่อให้ Realtime ส่งข้อมูลครบถ้วน
ALTER TABLE marc21_records REPLICA IDENTITY FULL;

-- 4. เปิดใช้งาน Supabase Realtime สำหรับตาราง marc21_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'marc21_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marc21_records;
  END IF;
END $$;

-- 5. สร้าง Index เพื่อเพิ่มความเร็วสูงสุดในการสืบค้นข้อมูล
CREATE INDEX IF NOT EXISTS idx_marc21_accession ON marc21_records(accession_no);
CREATE INDEX IF NOT EXISTS idx_marc21_isbn ON marc21_records(isbn);
CREATE INDEX IF NOT EXISTS idx_marc21_title ON marc21_records(title_245a);
CREATE INDEX IF NOT EXISTS idx_marc21_updated_at ON marc21_records(updated_at DESC);`;
                        navigator.clipboard.writeText(sqlContent);
                        setCopiedSql(true);
                        showToast('📋 คัดลอกคำสั่ง SQL ทั้งหมดเรียบร้อยแล้ว! นำไปวางใน Supabase SQL Editor ได้เลย');
                        setTimeout(() => setCopiedSql(false), 3000);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs text-xs"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? 'คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกคำสั่ง SQL ทั้งหมด'}</span>
                    </button>
                  )}
                </div>

                <div className="relative bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[11px] max-h-56 overflow-y-auto border border-slate-800 shadow-inner">
                  {cloudSqlTab === 'columns' ? (
                    <pre className="whitespace-pre-wrap">{`-- คำสั่ง SQL สำหรับเพิ่มคอลัมน์เก็บหัวเรื่อง 2 - 5 ในตาราง marc21_records บน Supabase
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_2 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_3 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_4 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_5 TEXT;

-- ปลดล็อค Row-Level Security (RLS) สำหรับตาราง marc21_records ให้บันทึกและแก้ไขข้อมูลได้ 100%
ALTER TABLE marc21_records DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for marc21_records" ON marc21_records;
CREATE POLICY "Allow all for marc21_records" 
ON marc21_records 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

ALTER TABLE marc21_records REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'marc21_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marc21_records;
  END IF;
END $$;`}</pre>
                  ) : cloudSqlTab === 'rls' ? (
                    <pre className="whitespace-pre-wrap">{`-- ปลดล็อค Row-Level Security (RLS) สำหรับตาราง marc21_records ให้บันทึกและแก้ไขข้อมูลได้ 100%
ALTER TABLE marc21_records DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for marc21_records" ON marc21_records;
CREATE POLICY "Allow all for marc21_records" 
ON marc21_records 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

ALTER TABLE marc21_records REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'marc21_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marc21_records;
  END IF;
END $$;`}</pre>
                  ) : (
                    <pre className="whitespace-pre-wrap">{`-- 1. สร้างตารางจัดเก็บข้อมูลตารางทำงาน MARC 21 AI
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
  subject_650_4 TEXT,
  subject_650_5 TEXT,
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

-- เพิ่มคอลัมน์เก็บหัวเรื่อง 2 ถึง 5 หากมีตารางเดิมอยู่แล้ว
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_2 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_3 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_4 TEXT;
ALTER TABLE marc21_records ADD COLUMN IF NOT EXISTS subject_650_5 TEXT;

-- 2. ปิด RLS และสร้าง Policy อนุญาตให้อ่าน/เขียนได้ 100%
ALTER TABLE marc21_records DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for marc21_records" ON marc21_records;
CREATE POLICY "Allow all for marc21_records" 
ON marc21_records 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- 3. ตั้งค่า Replica Identity เป็น FULL เพื่อให้ Realtime ส่งข้อมูลครบถ้วน
ALTER TABLE marc21_records REPLICA IDENTITY FULL;

-- 4. เปิดใช้งาน Supabase Realtime สำหรับตาราง marc21_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'marc21_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marc21_records;
  END IF;
END $$;

-- 5. สร้าง Index เพื่อเพิ่มความเร็วสูงสุดในการสืบค้นข้อมูล
CREATE INDEX IF NOT EXISTS idx_marc21_accession ON marc21_records(accession_no);
CREATE INDEX IF NOT EXISTS idx_marc21_isbn ON marc21_records(isbn);
CREATE INDEX IF NOT EXISTS idx_marc21_title ON marc21_records(title_245a);
CREATE INDEX IF NOT EXISTS idx_marc21_updated_at ON marc21_records(updated_at DESC);`}</pre>
                  )}
                </div>
              </div>

              {/* Status Box */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-100 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">สถานะการเชื่อมต่อปัจจุบัน:</span>
                  {hasRlsError ? (
                    <span className="font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> ติดสิทธิ์ RLS (ต้องรันคำสั่งปลดล็อคใน SQL Editor)
                    </span>
                  ) : isCloudRealtimeConnected ? (
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ออนไลน์ & Realtime สมบูรณ์ (อ่านและเขียนได้ 100%)
                    </span>
                  ) : hasCloudTable === false ? (
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                      ยังไม่พบตาราง marc21_records บน Supabase
                    </span>
                  ) : (
                    <span className="font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-300">
                      กำลังทดสอบเชื่อมต่อ...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await handleSyncAllToCloud();
                    }}
                    disabled={isSyncingCloud}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'กำลังซิงค์...' : 'ทดสอบสิทธิ์ & ซิงค์ขึ้น Cloud ทันที'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCloudSetupModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
