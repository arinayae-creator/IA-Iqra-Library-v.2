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
  FileText,
  Users,
  ClipboardPaste,
  ImageIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Marc21Record, MarcTagItem, generateThaiCutter, generateMarcTagsFromRecord } from '../../api/generate-marc21';
import { supabase } from '../../supabaseClient';

export const calculateThaiCutter = generateThaiCutter;

export interface SystemAuthorCutterItem {
  id: string;
  authorName: string;
  type: 'personal' | 'corporate';
  authorCutter: string;
  bookCount?: number;
  source?: string;
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

export function calculateCopyNumber(
  record: Marc21Record,
  allRecords: Marc21Record[],
  libraryBooks: any[] = []
): { copyNumber: number; totalCopies: number } {
  if (!record) return { copyNumber: 1, totalCopies: 1 };

  const targetIsbn = (record.isbn || '').replace(/[^0-9X]/gi, '');
  const targetIssn = (record.issn_022 || '').replace(/[^0-9X]/gi, '');
  const targetTitle = (record.title_245a || '').replace(/[:=;/\\.,]/g, '').trim().toLowerCase();

  const getAccNum = (acc?: string): number => {
    if (!acc) return 0;
    const digits = acc.replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };

  const copyMap = new Map<string, { id: string; accNo: string; num: number }>();

  // Add all matching items from allRecords
  allRecords.forEach(r => {
    let match = false;
    const rIsbn = (r.isbn || '').replace(/[^0-9X]/gi, '');
    const rIssn = (r.issn_022 || '').replace(/[^0-9X]/gi, '');
    const rTitle = (r.title_245a || '').replace(/[:=;/\\.,]/g, '').trim().toLowerCase();

    if (targetIsbn && targetIsbn.length >= 8 && rIsbn) {
      match = (rIsbn === targetIsbn || rIsbn.includes(targetIsbn) || targetIsbn.includes(rIsbn));
    } else if (targetIssn && targetIssn.length >= 7 && rIssn) {
      match = (rIssn === targetIssn);
    } else if (targetTitle && targetTitle.length > 2 && rTitle) {
      match = (rTitle === targetTitle);
    }

    if (match || r.id === record.id) {
      const key = r.accession_no || r.id;
      copyMap.set(key, {
        id: r.id,
        accNo: r.accession_no,
        num: getAccNum(r.accession_no)
      });
    }
  });

  // Add matching items from libraryBooks (if provided)
  if (Array.isArray(libraryBooks)) {
    libraryBooks.forEach(b => {
      let match = false;
      const bIsbn = (b.isbn || '').replace(/[^0-9X]/gi, '');
      const bIssn = (b.issn || b.issn_022 || '').replace(/[^0-9X]/gi, '');
      const bTitle = (b.title || '').replace(/[:=;/\\.,]/g, '').trim().toLowerCase();

      if (targetIsbn && targetIsbn.length >= 8 && bIsbn) {
        match = (bIsbn === targetIsbn || bIsbn.includes(targetIsbn) || targetIsbn.includes(bIsbn));
      } else if (targetIssn && targetIssn.length >= 7 && bIssn) {
        match = (bIssn === targetIssn);
      } else if (targetTitle && targetTitle.length > 2 && bTitle) {
        match = (bTitle === targetTitle);
      }

      if (match) {
        const acc = b.accession_no || b.barcode || b.id || '';
        const key = acc || b.id;
        if (!copyMap.has(key)) {
          copyMap.set(key, {
            id: b.id,
            accNo: acc,
            num: getAccNum(acc)
          });
        }
      }
    });
  }

  // Ensure current record is definitely included
  const currKey = record.accession_no || record.id;
  if (!copyMap.has(currKey)) {
    copyMap.set(currKey, {
      id: record.id,
      accNo: record.accession_no,
      num: getAccNum(record.accession_no)
    });
  }

  // Sort copies by accession number ascending
  const sortedCopies = Array.from(copyMap.values()).sort((a, b) => {
    if (a.num !== b.num) return a.num - b.num;
    return (a.accNo || '').localeCompare(b.accNo || '');
  });

  const currNum = getAccNum(record.accession_no);
  const foundIdx = sortedCopies.findIndex(c => c.id === record.id || c.accNo === record.accession_no || (currNum > 0 && c.num === currNum));

  const copyNumber = foundIdx >= 0 ? foundIdx + 1 : 1;
  const totalCopies = Math.max(sortedCopies.length, 1);

  return { copyNumber, totalCopies };
}

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
  { key: 'subject_650_2', label: '650 หัวเรื่อง 2', tag: '650 (2)', width: 'w-48' },
  { key: 'added_corp_710', label: '710 ผู้แต่งร่วม - นิติบุคคล', tag: '710', width: 'w-48' },
  { key: 'added_title_740', label: '740 ชื่อเรื่องเกี่ยวข้อง', tag: '740', width: 'w-56' },
  { key: 'series_uniform_830', label: '830 ชื่อชุดแบบฉบับ', tag: '830', width: 'w-56' },
  { key: 'electronic_856', label: '856 $u ลิงก์รูปปก/ไฟล์', tag: '856 $u', width: 'w-64' },
  { key: 'local_907', label: '907 เลขระเบียนท้องถิ่น', tag: '907', width: 'w-32' },
];

// Primary 29 columns from first column (date) up to Column 3 (EXTRA2) for copying
export const PRIMARY_COPY_COLUMNS = MARC21_COLUMNS.slice(0, 29);

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

  // Dynamic available subject headings collected across all records, search results, and standard list
  const allAvailableSubjects = React.useMemo(() => {
    const set = new Set<string>(DEFAULT_SUBJECT_HEADINGS);
    
    // 1. Collect from current table records
    records.forEach(r => {
      if (r.subject_650a && r.subject_650a !== '-' && r.subject_650a !== 'ทั่วไป') set.add(r.subject_650a.trim());
      if (r.subject_650_2 && r.subject_650_2 !== '-' && r.subject_650_2 !== 'ทั่วไป') set.add(r.subject_650_2.trim());
      if (r.subject_650_3 && r.subject_650_3 !== '-' && r.subject_650_3 !== 'ทั่วไป') set.add(r.subject_650_3.trim());
      if (Array.isArray(r.marc_tags)) {
        r.marc_tags.forEach((tag: any) => {
          if (tag.tagID === '650' || tag.tag === '650') {
            const parsed = parseMarcSubfield(tag.data || '', 'a') || tag.data?.replace(/[\u001f\$][a-z0-9]/g, ' ')?.trim();
            if (parsed && parsed !== '-' && parsed !== 'ทั่วไป') set.add(parsed.replace(/[\.\,\:\/]+$/, '').trim());
          }
        });
      }
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

  // Handle inline change of 650 $a from dropdown
  const handleSubjectChange = (recordId: string, newSubject: string) => {
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, subject_650a: newSubject } : r));
    showToast(`🏷️ อัปเดตหัวเรื่อง 650 $a เป็น "${newSubject}" เรียบร้อยแล้ว`);
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

  // Load saved records from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('iabs_marc21_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
          if (parsed.length > 0) {
            const maxAcc = parsed.reduce((max, r) => {
              const num = parseInt(r.accession_no, 10);
              return !isNaN(num) && num > max ? num : max;
            }, 2612);
            setStartAccNum(Math.max(maxAcc + 1, 2613));
          }
          return;
        }
      }
      setRecords([]);
    } catch {
      setRecords([]);
    }
  }, []);

  // Save records to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('iabs_marc21_records', JSON.stringify(records));
      if (records.length > 0) {
        const maxAcc = records.reduce((max, r) => {
          const num = parseInt(r.accession_no, 10);
          return !isNaN(num) && num > max ? num : max;
        }, 2612);
        setStartAccNum(Math.max(maxAcc + 1, 2613));
      }
    } catch {}
  }, [records]);

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
      copies: '1',
      summary_520: item.summary || item.summary_520 || `หนังสือ "${item.title || item.title_245a}" จากฐานข้อมูลสหบรรณานุกรมสถาบันอุดมศึกษาไทย (UC-TAL)`,
      edition_250: item.edition_250 || 'พิมพ์ครั้งที่ 1',
      price_541: item.price_541 || '-',
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
      added_corp_710: item.added_corp_710 || '-',
      added_title_740: item.added_title_740 || '-',
      series_uniform_830: item.series_uniform_830 || item.series || item.series_490 || '-',
      electronic_856: item.electronic_856 || item.coverImage || item.cover_image || '-',
      local_907: institutionSymbol ? `b${accNo}-${institutionSymbol}` : (item.local_907 || `b${accNo}`)
    };

    setRecords(prev => [newRecord, ...prev]);
    setStartAccNum(runAcc + 1);
    showToast(`✅ นำเข้าข้อมูลเล่ม "${newRecord.title_245a.substring(0, 30)}..." ${institutionName ? `(สถาบัน: ${institutionName})` : ''} สู่ตารางครบถ้วนทุก MARC Tag เรียบร้อย!`);
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
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
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
      return r.subject_650a || 'ทั่วไป';
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

  // Open edit modal with all 3 650 subjects extracted from record or marc_tags
  const handleStartEdit = (r: Marc21Record) => {
    const extractedSubs: string[] = [];
    const addSub = (val?: string) => {
      if (!val || typeof val !== 'string') return;
      let clean = val.trim();
      if (clean.startsWith('$a') || clean.startsWith('\\a')) {
        clean = clean.substring(2).trim();
      }
      clean = clean.replace(/[\u001f\$][a-z0-9]/g, ' ').replace(/^[\s\/:;=,-]+/, '').replace(/[\s\/:;=,-]+$/, '').trim();
      if (clean && clean !== '-' && clean !== 'ทั่วไป' && !extractedSubs.includes(clean)) {
        extractedSubs.push(clean);
      }
    };

    if (Array.isArray(r.marc_tags)) {
      r.marc_tags.forEach((t: any) => {
        if (t && (t.tagID === '650' || t.tag === '650')) {
          const parsed = parseMarcSubfield(t.data || t.content || '', 'a') || (t.data || t.content || '').replace(/[\u001f\$][a-z0-9]/g, ' ').trim();
          addSub(parsed);
        }
      });
    }

    if (r.subject_650a) {
      r.subject_650a.split(/[,;\n]+/).forEach(s => addSub(s));
    }
    if ((r as any).subject) {
      String((r as any).subject).split(/[,;\n]+/).forEach(s => addSub(s));
    }
    addSub(r.subject_650_2);
    addSub(r.subject_650_3);

    const s1 = extractedSubs[0] || (r.subject_650a && r.subject_650a !== '-' ? r.subject_650a : '') || '';
    const s2 = extractedSubs[1] || (r.subject_650_2 && r.subject_650_2 !== '-' ? r.subject_650_2 : '') || '';
    const s3 = extractedSubs[2] || (r.subject_650_3 && r.subject_650_3 !== '-' ? r.subject_650_3 : '') || '';

    setEditModalTab('card');
    setEditingRecord({
      ...r,
      subject_650a: s1,
      subject_650_2: s2,
      subject_650_3: s3,
    });
  };

  // Copy single row (From Column 1 to Column 3 EXTRA2)
  const handleCopyRow = (r: Marc21Record) => {
    setLastCopiedRow(r);
    const tsv = recordToTsvRow(r);
    navigator.clipboard.writeText(tsv).then(() => {
      showToast(`📋 คัดลอกแถว "${r.title_245a.substring(0, 30)}..." (คอลัมน์แรก - คอลัมน์3) ลงคลิปบอร์ดแล้ว! พร้อมวางใน Excel หรือกดไอคอนวาง`);
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
          if (parts.length >= 10) {
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
              status: parts[27] || 'มีอยู่',
              col3: parts[28] || ''
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

  // Copy selected rows (From Column 1 to Column 3 EXTRA2)
  const handleCopySelected = () => {
    const targetRows = records.filter(r => selectedIds.has(r.id));
    if (targetRows.length === 0) {
      showToast('⚠️ กรุณาเลือกแถวที่ต้องการคัดลอกอย่างน้อย 1 รายการ');
      return;
    }
    const tsv = targetRows.map(recordToTsvRow).join('\n');
    navigator.clipboard.writeText(tsv).then(() => {
      showToast(`📋 คัดลอก ${targetRows.length} รายการที่เลือก (คอลัมน์แรก - คอลัมน์3) ลงคลิปบอร์ดแล้ว! พร้อมวางใน Excel`);
    });
  };

  // Shared helper to cleanly sync/upsert a Marc21Record to Supabase with automatic deduplication
  const syncBookRecordToSupabase = async (r: Marc21Record) => {
    const cleanTitle = r.title_245a.split(' / ')[0].trim();
    const cleanAuthor = r.author_personal.replace(/\.$/, '').trim();
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

    // Extract all subject headings across 650 fields and marc_tags
    const all650s: string[] = [];
    const addS = (val?: string) => {
      if (!val || typeof val !== 'string') return;
      let clean = val.trim();
      if (clean.startsWith('$a') || clean.startsWith('\\a')) clean = clean.substring(2).trim();
      clean = clean.replace(/[\u001f\$][a-z0-9]/g, ' ').replace(/^[\s\/:;=,-]+/, '').replace(/[\s\/:;=,-]+$/, '').trim();
      if (clean && clean !== '-' && clean !== 'ทั่วไป' && !all650s.includes(clean)) {
        all650s.push(clean);
      }
    };
    if (r.subject_650a) r.subject_650a.split(/[,;\n]+/).forEach(addS);
    if ((r as any).subject) String((r as any).subject).split(/[,;\n]+/).forEach(addS);
    addS(r.subject_650_2);
    addS(r.subject_650_3);
    if (Array.isArray(r.marc_tags)) {
      r.marc_tags.forEach((t: any) => {
        if (t && (t.tagID === '650' || t.tag === '650')) {
          const parsed = parseMarcSubfield(t.data || t.content || '', 'a') || (t.data || t.content || '').replace(/[\u001f\$][a-z0-9]/g, ' ').trim();
          addS(parsed);
        }
      });
    }

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
      showToast(`💾 บันทึกรายการ ${count} เล่ม ลงฐานข้อมูลห้องสมุดเรียบร้อยแล้ว!`);
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
    setRecords(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    setDeleteConfirmTarget(null);
    showToast(`🗑️ ลบรายการที่เลือกจำนวน ${deletedCount} รายการเรียบร้อยแล้ว`);
  };

  // Copy all rows (From Column 1 to Column 3 EXTRA2)
  const handleCopyAll = (includeHeaders = false) => {
    if (records.length === 0) {
      showToast('⚠️ ไม่มีข้อมูลในตารางสำหรับคัดลอก');
      return;
    }
    const headerLine = PRIMARY_COPY_COLUMNS.map(c => c.label.replace(/\n/g, ' ')).join('\t');
    const rowsTsv = records.map(recordToTsvRow).join('\n');
    const fullTsv = includeHeaders ? `${headerLine}\n${rowsTsv}` : rowsTsv;

    navigator.clipboard.writeText(fullTsv).then(() => {
      showToast(`📋 คัดลอกข้อมูลทั้งหมด ${records.length} แถว (คอลัมน์แรก - คอลัมน์3 EXTRA2) ลงคลิปบอร์ดสำเร็จ! พร้อมวางใน Excel`);
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

    showToast('🗑️ ลบแถวเรียบร้อยแล้ว');
  };

  // Sync to Supabase
  const handleSyncToLibrary = async (r: Marc21Record) => {
    try {
      const payload = await syncBookRecordToSupabase(r);
      showToast(`💾 บันทึกเล่ม "${payload.title}" เข้าสู่ระบบห้องสมุดเรียบร้อยแล้ว!`);
      if (onBookAddedToLibrary) onBookAddedToLibrary();
    } catch (e: any) {
      showToast(`⚠️ เกิดข้อผิดพลาดในการบันทึก: ${e.message}`);
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
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-200 border border-white/10 flex items-center gap-1">
                <span>🌐 Google Search Grounding</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-200 border border-white/10 flex items-center gap-1">
                <span>📚 TK Park OPAC & หอสมุดแห่งชาติ</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCutterTableOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md border border-emerald-400/40 transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>ตารางเลขคัตเตอร์ (TK, จุฬา, มอ.)</span>
            </button>
            <button
              onClick={() => setIsBatchOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/20 transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-300" />
              <span>สร้างเป็นชุด (Batch)</span>
            </button>
            <button
              onClick={handleAddEmptyRow}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-950/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มแถวเปล่า</span>
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
            onClick={() => {
              const parsed = parseInt(inputStartAcc, 10);
              const base = !isNaN(parsed) && parsed >= 1 ? parsed : startAccNum;
              handleAutoRenumber(base);
            }}
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

        {/* Copy & Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopySelected}
            disabled={selectedIds.size === 0}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="คัดลอกเฉพาะแถวที่เลือกเพื่อนำไปวางใน Excel"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>คัดลอกที่เลือก ({selectedIds.size})</span>
          </button>

          <button
            onClick={() => handleCopyAll(false)}
            disabled={records.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="คัดลอกข้อมูลทุกแถวลงคลิปบอร์ดแบบตาราง Excel"
          >
            <Copy className="w-3.5 h-3.5 text-amber-300" />
            <span>คัดลอกทั้งหมด ({records.length})</span>
          </button>

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

      {/* Excel-style Spreadsheet Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] relative scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            {/* Frozen Table Header */}
            <thead className="sticky top-0 z-20 bg-slate-800 text-white font-semibold select-none shadow-md">
              <tr className="border-b border-slate-700 divide-x divide-slate-700">
                <th className="p-3 w-12 text-center bg-slate-900 sticky left-0 z-30">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === records.length && records.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="p-3 w-36 text-center bg-slate-900 sticky left-12 z-30">
                  จัดการ
                </th>
                {MARC21_COLUMNS.map((col) => (
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
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 bg-white">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={MARC21_COLUMNS.length + 2} className="p-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
                    <p className="text-sm font-semibold text-slate-600">ยังไม่มีข้อมูลรายการบรรณานุกรมในตาราง</p>
                    <p className="text-xs text-slate-400 mt-1">
                      พิมพ์ ISBN หรือชื่อหนังสือในกล่องค้นหาด้านบน หรือกดปุ่ม "รีเซ็ตตัวอย่าง" เพื่อดูตัวอย่างรายการ MARC 21
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((r, rowIdx) => {
                  const isSelected = selectedIds.has(r.id);
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
                      <td className="p-1.5 min-w-[190px]">
                        {(() => {
                          const thisRow650s = Array.isArray(r.marc_tags) 
                            ? r.marc_tags
                                .filter((t: any) => t.tagID === '650' || t.tag === '650')
                                .map((t: any) => parseMarcSubfield(t.data || '', 'a') || t.data?.replace(/[\u001f\$][a-z0-9]/g, ' ')?.trim())
                                .filter((s): s is string => Boolean(s && s !== '-'))
                            : [];

                          const rowSpecificSubjects = Array.from(new Set([
                            ...thisRow650s,
                            r.subject_650a,
                            r.subject_650_2
                          ].filter((s): s is string => Boolean(s && s !== '-'))));

                          if (rowSpecificSubjects.length === 0) {
                            rowSpecificSubjects.push(r.subject_650a || 'ทั่วไป');
                          }

                          const currentVal = r.subject_650a || rowSpecificSubjects[0];

                          return (
                            <div className="relative">
                              <select
                                value={currentVal}
                                onChange={(e) => handleSubjectChange(r.id, e.target.value)}
                                title={`หัวเรื่องตรงของเล่มนี้ (Tag 650): ${currentVal}`}
                                className="w-full bg-emerald-50/80 hover:bg-white focus:bg-white border border-emerald-300 hover:border-emerald-500 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs text-emerald-950 font-medium cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 truncate shadow-2xs"
                              >
                                {rowSpecificSubjects.map((s, sIdx) => (
                                  <option key={`row650_${r.id}_${sIdx}`} value={s}>
                                    🏷️ {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-2.5 text-center font-mono">{r.copies}</td>
                      <td className="p-2.5 text-slate-600 max-w-md truncate" title={r.summary_520}>
                        {r.summary_520}
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
                      <td className="p-2.5 text-slate-700">{r.subject_650_2 || '-'}</td>
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

        {/* Table Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span>แสดงทั้งหมด <strong>{records.length}</strong> แถว (<strong>{MARC21_COLUMNS.length}</strong> คอลัมน์ พร้อมข้อมูล MARC 21 Tags ทั้งหมดสมบูรณ์แบบ)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              💡 คลิกไอคอน <Copy className="w-3 h-3 inline text-emerald-700" /> เพื่อคัดลอกแถวไปวางใน Excel ได้ทันที
            </span>
          </div>
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
                        <td className="py-2.5 px-4 text-slate-800">{editingRecord.author_personal || '-'}</td>
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
                <label className="block font-semibold text-slate-700 mb-1">520 เรื่องย่อ</label>
                <textarea
                  value={editingRecord.summary_520 || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, summary_520: e.target.value })}
                  rows={2}
                  placeholder="พิมพ์เรื่องย่อ..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                  const uniqueMarc650s: string[] = Array.from(new Set([...recordMarc650s, editingRecord.subject_650_2, editingRecord.subject_650_3].filter((s): s is string => Boolean(s && s !== '-'))));

                  return (
                    <div className="space-y-1.5">
                      {uniqueMarc650s.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] text-slate-500 font-medium">ใน MARC:</span>
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

              {/* 650 หัวเรื่อง 2 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">650 หัวเรื่อง 2</label>
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
                <label className="block font-semibold text-slate-700 mb-1">650 หัวเรื่อง 3</label>
                <input
                  type="text"
                  list="subject-headings-list"
                  value={editingRecord.subject_650_3 && editingRecord.subject_650_3 !== '-' ? editingRecord.subject_650_3 : ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, subject_650_3: e.target.value })}
                  placeholder="ระบุหัวเรื่องที่ 3 (ถ้ามี)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
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
                  // Update all 650 subject tags cleanly
                  updatedTags = updatedTags.filter(t => t.tagID !== '650' && (t as any).tag !== '650');
                  if (editingRecord.subject_650a && editingRecord.subject_650a !== '-' && editingRecord.subject_650a !== 'ทั่วไป') {
                    updatedTags.push({ tagID: '650', indc1: '', indc2: '4', data: `$a${editingRecord.subject_650a}` });
                  }
                  if (editingRecord.subject_650_2 && editingRecord.subject_650_2 !== '-' && editingRecord.subject_650_2 !== 'ทั่วไป') {
                    updatedTags.push({ tagID: '650', indc1: '', indc2: '4', data: `$a${editingRecord.subject_650_2}` });
                  }
                  if (editingRecord.subject_650_3 && editingRecord.subject_650_3 !== '-' && editingRecord.subject_650_3 !== 'ทั่วไป') {
                    updatedTags.push({ tagID: '650', indc1: '', indc2: '4', data: `$a${editingRecord.subject_650_3}` });
                  }
                  if (editingRecord.cover_image && editingRecord.cover_image !== '-') {
                    const idx856 = updatedTags.findIndex(t => t.tagID === '856' || (t as any).tag === '856');
                    const tagObj = { tagID: '856', indc1: '4', indc2: '2', data: `$u${editingRecord.cover_image}` };
                    if (idx856 >= 0) updatedTags[idx856] = tagObj;
                    else updatedTags.push(tagObj);
                  }
                  const finalRec = { ...editingRecord, marc_tags: updatedTags };
                  setRecords(prev => prev.map(item => item.id === finalRec.id ? finalRec : item));
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
    </div>
  );
};
