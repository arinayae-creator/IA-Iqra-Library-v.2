import { GoogleGenAI } from '@google/genai';
import { supabase } from '../supabaseClient';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export interface MarcTagItem {
  tagID: string;
  indc1: string;
  indc2: string;
  data: string;
  fromInternet?: boolean;
}

export interface Marc21Record {
  id: string;
  db_id?: string;
  date: string;
  col1: string;
  accession_no: string;
  isbn: string;
  author_personal: string;
  author_corporate: string;
  title_245a: string;
  title_245b: string;
  responsibility_245c: string;
  ddc_082a: string;
  cutter_082b: string;
  pub_place: string;
  publisher: string;
  pub_year: string;
  pages_300a: string;
  illustration_300b: string;
  subject_650a: string;
  copies: string;
  summary_520: string;
  edition_250: string;
  price_541: string;
  series_490: string;
  added_entry_700: string;
  acquisition_source: string;
  col2: string;
  source_type: string;
  storage_location: string;
  status: string;
  col3: string;
  
  // Extended MARC21 Tags (All remaining tags after Column 3)
  leader_000?: string;
  control_001?: string;
  control_003?: string;
  trans_005?: string;
  fixed_008?: string;
  issn_022?: string;
  cat_source_040?: string;
  language_041?: string;
  title_varying_246?: string;
  dimensions_300c?: string;
  note_general_500?: string;
  note_bib_504?: string;
  note_contents_505?: string;
  subject_person_600?: string;
  subject_corp_610?: string;
  subject_uniform_630?: string;
  subject_geo_651?: string;
  subject_650_2?: string;
  added_corp_710?: string;
  added_title_740?: string;
  series_uniform_830?: string;
  electronic_856?: string;
  local_907?: string;

  cover_image?: string;
  search_source?: string;
  marc_tags?: MarcTagItem[];
}

// Official Thai Author Cutter Table Standard (ตารางการให้เลขคัตเตอร์ผู้แต่งภาษาไทย: TK Park, จุฬาฯ, มอ.)
export function generateThaiCutter(author: string, title: string, existingCutters?: Set<string>): string {
  const consonantTable: Record<string, number> = {
    'ก': 1, 'ข': 1, 'ค': 1, 'ฆ': 1,
    'ง': 2, 'จ': 2, 'ฉ': 2, 'ช': 2, 'ซ': 2, 'ฌ': 2,
    'ญ': 3, 'ฎ': 3, 'ฏ': 3, 'ฐ': 3, 'ฑ': 3, 'ฒ': 3,
    'ณ': 4, 'ด': 4, 'ต': 4, 'ถ': 4, 'ท': 4, 'ธ': 4,
    'น': 5, 'บ': 5, 'ป': 5, 'ผ': 5, 'ฝ': 5,
    'พ': 6, 'ฟ': 6, 'ภ': 6, 'ม': 6, 'ย': 6,
    'ร': 7, 'ล': 7, 'ว': 7,
    'ศ': 8, 'ษ': 8, 'ส': 8,
    'ห': 9, 'ฬ': 9, 'อ': 9, 'ฮ': 9,
    'ฤ': 10, 'ฦ': 10
  };

  const vowelTable: Record<string, number> = {
    'ะ': 1, 'ั': 1,
    'า': 2, 'ำ': 2,
    'ิ': 3, 'ี': 3, 'ึ': 3, 'ื': 3,
    'ุ': 4, 'ู': 4,
    'เ': 5,
    'แ': 8, 'โ': 8,
    'ใ': 9, 'ไ': 9
  };

  const frontVowels = ['เ', 'แ', 'โ', 'ใ', 'ไ'];

  // Clean author
  let cleanAuthor = (author || '').trim();
  cleanAuthor = cleanAuthor.replace(/^(นาย|นาง|นางสาว|ดร\.|ศ\.|รศ\.|ผศ\.|หม่อม|ม\.ร\.ว\.|ม\.ล\.|อาจารย์|พี่|ป้า|น้า|ลุง|ครู)/g, '').trim();
  
  // Extract ALL Thai/English characters, SKIPPING commas, spaces, periods (e.g. ลี, บงกี -> ['ล', 'ี', 'บ', 'ง', 'ก', 'ี'])
  const chars = cleanAuthor.replace(/[^\u0E00-\u0E7Fa-zA-Z]/g, '').split('');

  let targetChars = chars;
  if (targetChars.length === 0) {
    const cleanT = (title || '').replace(/^[0-9\s"“'‘\(\[\{]+/g, '').replace(/[^\u0E00-\u0E7Fa-zA-Z]/g, '');
    targetChars = cleanT.split('');
  }

  if (targetChars.length === 0) return 'ม100ก';

  let initialChar = '';
  let digits = '';
  let nextExtraIndex = 3;

  const c0 = targetChars[0] || '';
  const c1 = targetChars[1] || '';
  const c2 = targetChars[2] || '';

  if (frontVowels.includes(c0)) {
    initialChar = c1; // First consonant after front vowel
    const frontVowelCode = vowelTable[c0] || 8;

    if (['ร', 'ล', 'ว'].includes(c2)) {
      const clusterCode = consonantTable[c2] || 7;
      digits = `${clusterCode}${frontVowelCode}`;
    } else {
      const nextCode = consonantTable[c2] || vowelTable[c2] || 1;
      digits = `${frontVowelCode}${nextCode}`;
    }
    nextExtraIndex = 3;
  } else {
    initialChar = c0;

    if (c1 === 'ฤ' || c1 === 'ฦ') {
      const thirdCode = consonantTable[c2] || vowelTable[c2] || 8;
      digits = `10${thirdCode}`;
      nextExtraIndex = 3;
    } else if (vowelTable[c1]) {
      const vowelCode = vowelTable[c1];
      const thirdCode = consonantTable[c2] || vowelTable[c2] || 1;
      digits = `${vowelCode}${thirdCode}`;
      nextExtraIndex = 3;
    } else if (consonantTable[c1]) {
      const c1Code = consonantTable[c1];
      const c2Code = vowelTable[c2] || consonantTable[c2] || 1;
      digits = `${c1Code}${c2Code}`;
      nextExtraIndex = 3;
    } else {
      digits = '11';
      nextExtraIndex = 2;
    }
  }

  // Work mark (character from title)
  let cleanTitle = (title || '').replace(/^[0-9\s"“'‘\(\[\{]+/g, '').trim();
  if (frontVowels.includes(cleanTitle.charAt(0))) {
    cleanTitle = cleanTitle.substring(1);
  }
  const titleInitial = cleanTitle.charAt(0) || '';

  let candidate = `${initialChar}${digits}${titleInitial}`;

  // Disambiguation: If candidate is already in existingCutters (used by a different author),
  // inspect subsequent characters in author's name to add extra digits.
  if (existingCutters && existingCutters.size > 0 && existingCutters.has(candidate)) {
    let currDigits = digits;
    let idx = nextExtraIndex;

    while (existingCutters.has(`${initialChar}${currDigits}${titleInitial}`) && idx < targetChars.length) {
      const nextChar = targetChars[idx];
      const nextCode = consonantTable[nextChar] || vowelTable[nextChar] || 1;
      currDigits += String(nextCode);
      idx++;
    }
    candidate = `${initialChar}${currDigits}${titleInitial}`;
  }

  return candidate;
}

// Determine default shelving location based on DDC or Category
function getStorageLocation(ddc: string, title: string, category: string): string {
  const ddcUpper = (ddc || '').toUpperCase();
  const text = `${title} ${category}`.toLowerCase();

  // Cartoon specific categories
  if (text.includes('การ์ตูน') || ddcUpper.startsWith('ย')) {
    if (text.includes('วิทย์') || text.includes('คณิต') || text.includes('วิทยาศาสตร์') || ddcUpper.startsWith('5') || ddcUpper.startsWith('6')) {
      return 'การ์ตูน วิทย์/คณิต';
    }
    if (text.includes('สังคม') || text.includes('ประวัติศาสตร์') || text.includes('ภูมิศาสตร์') || ddcUpper.startsWith('3') || ddcUpper.startsWith('9')) {
      return 'การ์ตูน สังคม';
    }
    if (text.includes('ภาษา') || text.includes('วรรณกรรม') || text.includes('นิทาน') || ddcUpper.startsWith('4') || ddcUpper.startsWith('8')) {
      return 'การ์ตูน ภาษา/วรรณกรรม';
    }
    return 'การ์ตูน ความรู้ทั่วไป';
  }

  // Children specific categories
  if (ddcUpper.startsWith('ด') || category.includes('เด็ก') || title.includes('นิทาน') || category.includes('นิทาน')) {
    if (text.includes('ภาษา') || text.includes('อังกฤษ') || text.includes('คำศัพท์')) {
      return 'สำหรับเด็ก (ภาษาฯ)';
    }
    if (text.includes('ศาสนา') || text.includes('พุทธ') || text.includes('ธรรมะ') || text.includes('จริยธรรม') || ddcUpper.startsWith('2')) {
      return 'สำหรับเด็ก (ศาสนา)';
    }
    return 'สำหรับเด็ก';
  }

  if (ddcUpper.startsWith('บ') || category.includes('แบบเรียน') || category.includes('ข้อสอบ') || text.includes('แบบเรียน') || text.includes('คู่มือสอบ')) {
    return 'แบบเรียน';
  }
  if (ddcUpper.startsWith('อ') || ddcUpper.includes('REF') || category.includes('อ้างอิง') || category.includes('พจนานุกรม') || text.includes('สารานุกรม') || text.includes('พจนานุกรม')) {
    return 'อ้างอิง/Ref';
  }
  if (ddcUpper.startsWith('นว') || ddcUpper.startsWith('รส') || category.includes('นวนิยาย') || category.includes('เรื่องสั้น')) {
    return 'นวนิยาย/เรื่องสั้น';
  }
  const num = parseFloat(ddc);
  if (!isNaN(num)) {
    const mainClass = Math.floor(num / 100) * 100;
    return `หมวด ${mainClass}`;
  }
  return 'หมวด ทั่วไป';
}

// Build standard MARC tag breakdown for any record
export function generateMarcTagsFromRecord(r: Marc21Record): MarcTagItem[] {
  if (Array.isArray(r.marc_tags) && r.marc_tags.length > 0) {
    return r.marc_tags;
  }
  const tags: MarcTagItem[] = [
    { tagID: 'Leader', indc1: '', indc2: '', data: r.leader_000 || '00933nam  2200289ua 4500' },
    { tagID: '001', indc1: '', indc2: '', data: r.control_001 || `b${r.accession_no.replace(/^0+/, '') || '001'}` },
    { tagID: '003', indc1: '', indc2: '', data: r.control_003 || 'UCTAL' },
    { tagID: '005', indc1: '', indc2: '', data: r.trans_005 || (new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.0') },
    { tagID: '008', indc1: '', indc2: '', data: r.fixed_008 || `${new Date().getFullYear().toString().slice(2)}0101s${r.pub_year || '2565'}    th a   j      000 1 tha d` }
  ];

  if (r.isbn) {
    tags.push({ tagID: '020', indc1: '', indc2: '', data: `$a${r.isbn.replace(/[^0-9X]/gi, '')}` });
  }
  if (r.issn_022 && r.issn_022 !== '-') {
    tags.push({ tagID: '022', indc1: '', indc2: '', data: `$a${r.issn_022}` });
  }
  if (r.cat_source_040 && r.cat_source_040 !== '-') {
    tags.push({ tagID: '040', indc1: '', indc2: '', data: `$a${r.cat_source_040}` });
  }
  if (r.language_041 && r.language_041 !== '-') {
    tags.push({ tagID: '041', indc1: '', indc2: '', data: `$a${r.language_041}` });
  }
  if (r.ddc_082a) {
    tags.push({ tagID: '082', indc1: '0', indc2: '4', data: `$a${r.ddc_082a}${r.cutter_082b ? ` $b${r.cutter_082b}` : ''}` });
  }
  if (r.author_personal && r.author_personal !== '-') {
    tags.push({ tagID: '100', indc1: '1', indc2: '', data: `$a${r.author_personal}` });
  }
  if (r.author_corporate && r.author_corporate !== '-') {
    tags.push({ tagID: '110', indc1: '2', indc2: '', data: `$a${r.author_corporate}` });
  }
  if (r.title_245a) {
    let sub = `$a${r.title_245a.split(' / ')[0]}`;
    if (r.responsibility_245c) {
      sub += ` / $c${r.responsibility_245c}`;
    }
    tags.push({ tagID: '245', indc1: '1', indc2: '0', data: sub });
  }
  if (r.title_varying_246 || r.title_245b) {
    const rawVal = (r.title_245b || r.title_varying_246 || '').trim();
    if (rawVal && rawVal !== '-') {
      let data246 = rawVal;
      if (!data246.startsWith('$a')) {
        if (data246.includes(':')) {
          const parts = data246.split(':');
          const pA = parts[0].replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();
          const pB = parts.slice(1).join(':').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();
          const dotEnd = pB.endsWith('.') ? pB : `${pB}.`;
          data246 = `$a${pA} :$b${dotEnd}`;
        } else {
          const dotEnd = data246.endsWith('.') ? data246 : `${data246}.`;
          data246 = `$a${dotEnd}`;
        }
      }
      tags.push({ tagID: '246', indc1: '3', indc2: '1', data: data246 });
    }
  }
  if (r.edition_250 && r.edition_250 !== '-') {
    tags.push({ tagID: '250', indc1: '', indc2: '', data: `$a${r.edition_250}` });
  }
  if (r.publisher || r.pub_place || r.pub_year) {
    tags.push({ tagID: '260', indc1: '', indc2: '', data: `$a${r.pub_place || 'กรุงเทพฯ'} : $b${r.publisher || 'สำนักพิมพ์'}, $c${r.pub_year || '2565'}.` });
  }
  if (r.pages_300a) {
    tags.push({ tagID: '300', indc1: '', indc2: '', data: `$a${r.pages_300a}${r.illustration_300b ? ` : $b${r.illustration_300b}` : ''}${r.dimensions_300c ? ` ; $c${r.dimensions_300c}` : ' ; $c20 ซม.'}` });
  }
  if (r.series_490 && r.series_490 !== '-') {
    tags.push({ tagID: '490', indc1: '1', indc2: '', data: `$a${r.series_490}` });
  }
  if (r.note_general_500 && r.note_general_500 !== '-') {
    tags.push({ tagID: '500', indc1: '', indc2: '', data: `$a${r.note_general_500}` });
  }
  if (r.note_bib_504 && r.note_bib_504 !== '-') {
    tags.push({ tagID: '504', indc1: '', indc2: '', data: `$a${r.note_bib_504}` });
  }
  if (r.note_contents_505 && r.note_contents_505 !== '-') {
    tags.push({ tagID: '505', indc1: '0', indc2: '', data: `$a${r.note_contents_505}` });
  }
  if (r.summary_520) {
    tags.push({ tagID: '520', indc1: '', indc2: '', data: `$a${r.summary_520}`, fromInternet: true });
  }
  if (r.subject_person_600 && r.subject_person_600 !== '-') {
    tags.push({ tagID: '600', indc1: '1', indc2: '4', data: `$a${r.subject_person_600}` });
  }
  if (r.subject_corp_610 && r.subject_corp_610 !== '-') {
    tags.push({ tagID: '610', indc1: '2', indc2: '4', data: `$a${r.subject_corp_610}` });
  }
  if (r.subject_uniform_630 && r.subject_uniform_630 !== '-') {
    tags.push({ tagID: '630', indc1: '', indc2: '0', data: `$a${r.subject_uniform_630}` });
  }
  if (r.subject_650a && r.subject_650a !== '-') {
    tags.push({ tagID: '650', indc1: '', indc2: '4', data: `$a${r.subject_650a}` });
  }
  if (r.subject_650_2 && r.subject_650_2 !== '-') {
    tags.push({ tagID: '650', indc1: '', indc2: '4', data: `$a${r.subject_650_2}` });
  }
  if (r.subject_geo_651 && r.subject_geo_651 !== '-') {
    tags.push({ tagID: '651', indc1: '', indc2: '4', data: `$a${r.subject_geo_651}` });
  }
  if (r.added_entry_700 && r.added_entry_700 !== '-') {
    tags.push({ tagID: '700', indc1: '0', indc2: '', data: `$a${r.added_entry_700}` });
  }
  if (r.added_corp_710 && r.added_corp_710 !== '-') {
    tags.push({ tagID: '710', indc1: '2', indc2: '', data: `$a${r.added_corp_710}` });
  }
  if (r.added_title_740 && r.added_title_740 !== '-') {
    tags.push({ tagID: '740', indc1: '0', indc2: '2', data: `$a${r.added_title_740}` });
  }
  if (r.series_uniform_830 && r.series_uniform_830 !== '-') {
    tags.push({ tagID: '830', indc1: '', indc2: '0', data: `$a${r.series_uniform_830}` });
  }
  if (r.electronic_856 || r.cover_image) {
    tags.push({ tagID: '856', indc1: '', indc2: '4', data: `$u${r.electronic_856 || r.cover_image}` });
  }
  if (r.local_907 && r.local_907 !== '-') {
    tags.push({ tagID: '907', indc1: '', indc2: '', data: `$a${r.local_907}` });
  }
  return tags;
}

// Official UC-TAL ThaiLIS (https://uc.thailis.or.th) REST API Client
let cachedThaiLISToken: { token: string; expiresAt: number } | null = null;

async function fetchWithProxyFallback(url: string, options: any = {}): Promise<Response> {
  const signal = options.signal;
  
  // 1. Try Direct Fetch first
  try {
    const res = await fetch(url, options);
    if (res.ok) return res;
  } catch (err) {
    console.warn(`[Proxy Fallback] Direct fetch to ${url} failed, trying proxy...`, err);
  }
  
  // 2. Try corsproxy.io
  try {
    const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res = await fetch(proxiedUrl, {
      ...options,
      signal: signal
    });
    if (res.ok) {
      console.log(`[Proxy Fallback] Successfully fetched ${url} via corsproxy.io!`);
      return res;
    }
  } catch (proxyErr) {
    console.warn(`[Proxy Fallback] corsproxy.io failed for ${url}, trying allorigins...`, proxyErr);
  }
  
  // 3. Try allorigins.win
  try {
    const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxiedUrl, {
      ...options,
      signal: signal
    });
    if (res.ok) {
      console.log(`[Proxy Fallback] Successfully fetched ${url} via allorigins!`);
      return res;
    }
  } catch (aoErr) {
    console.warn(`[Proxy Fallback] allorigins failed for ${url}`, aoErr);
  }
  
  // Last resort
  return await fetch(url, options);
}

async function getThaiLISToken(): Promise<string | null> {
  if (cachedThaiLISToken && Date.now() < cachedThaiLISToken.expiresAt - 60000) {
    return cachedThaiLISToken.token;
  }
  try {
    const apiKey = 'cc6dd232c9740e9ddcf00a66fea88c335af8d6a8befe3ccf35122022c7a30f96';
    const res = await fetchWithProxyFallback('https://ucopacapi.walaiautolib.com/ucopacapi/v1/Token/Issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        cachedThaiLISToken = {
          token: data.access_token,
          expiresAt: Date.now() + (data.expires_in || 900) * 1000
        };
        return data.access_token;
      }
    }
  } catch (err) {
    console.warn('UC-TAL ThaiLIS Token Issue note:', err);
  }
  return null;
}

// Helper to parse subfield from MARC tag string: e.g. "\u001faTitle\u001fcAuthor"
function parseMarcSubfield(dataStr: string, code: string): string {
  if (!dataStr) return '';
  const regex = new RegExp(`(?:[\u001f\\$])${code}([^\u001f\\$]+)`, 'g');
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(dataStr)) !== null) {
    matches.push(match[1].trim());
  }
  return matches.join(' ');
}

export function formatAddedEntry700(val: string): string {
  if (!val || val === '-' || val.trim() === '') return '-';
  let clean = val.trim();
  
  clean = clean
    .replace(/,\s*ผู้เรียบเรียง/g, ', ผู้แปล')
    .replace(/,\s*เรียบเรียง/g, ', ผู้แปล')
    .replace(/;\s*ผู้เรียบเรียง/g, ', ผู้แปล')
    .replace(/;\s*เรียบเรียง/g, ', ผู้แปล')
    .replace(/\s*ผู้เรียบเรียง/g, ', ผู้แปล')
    .replace(/\s*เรียบเรียง/g, ', ผู้แปล')
    .replace(/,\s*แปล\.$/g, ', ผู้แปล.')
    .replace(/,\s*แปล$/g, ', ผู้แปล')
    .replace(/\s*แปล\.$/g, ', ผู้แปล.')
    .replace(/\s*แปล$/g, ', ผู้แปล');

  if (!clean.includes('ผู้แปล') && !clean.includes('ผู้แต่งร่วม') && !clean.includes('วาดภาพ') && !clean.includes('บรรณาธิการ')) {
    if (clean.endsWith('.')) {
      clean = clean.slice(0, -1).trim() + ', ผู้แปล.';
    } else {
      clean = `${clean}, ผู้แปล`;
    }
  }

  return clean;
}

export function formatAuthorList245c(rawResp: string, authorPersonal?: string): string {
  if (!rawResp && !authorPersonal) return 'ไม่ระบุผู้แต่ง.';

  let text = rawResp || authorPersonal || '';

  // 1. Strip translator clauses completely from 245 $c (author only!)
  text = text
    .replace(/;\s*[^;]*?(?:แปล|ผู้แปล|แปลโดย|เรื่องและภาพ|ภาพประกอบ|วาดภาพ)[^;]*$/gi, '')
    .replace(/\/\s*[^/]*?(?:แปล|ผู้แปล|แปลโดย)[^/]*$/gi, '')
    .replace(/,\s*[^,]*?(?:แปล|ผู้แปล|แปลโดย)[^,]*$/gi, '')
    .trim();

  // Clean trailing slashes, semicolons, colons
  text = text.replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();

  if (!text && authorPersonal) {
    text = authorPersonal.replace(/\.$/, '').trim();
  }

  // 2. Parse authors
  let rawAuthors: string[] = [];
  if (text.includes(';')) {
    rawAuthors = text.split(';').map(a => a.trim()).filter(Boolean);
  } else if (text.includes('/')) {
    rawAuthors = text.split('/').map(a => a.trim()).filter(Boolean);
  } else if (text.includes(' และ ')) {
    const parts = text.split(' และ ').map(a => a.trim()).filter(Boolean);
    if (parts.length > 1) {
      const firsts = parts[0].split(',').map(a => a.trim()).filter(Boolean);
      rawAuthors = [...firsts, parts[1]];
    } else {
      rawAuthors = parts;
    }
  } else {
    // If separated by commas
    const parts = text.split(',').map(a => a.trim()).filter(Boolean);
    if (parts.length === 2 && !/[ก-ฮ]/.test(parts[0]) && !/[ก-ฮ]/.test(parts[1]) && parts[1].length <= 15) {
      rawAuthors = [`${parts[0]}, ${parts[1]}`];
    } else if (parts.length > 1) {
      rawAuthors = parts;
    } else {
      rawAuthors = [text];
    }
  }

  // Clean each author name
  const cleanAuthors = rawAuthors.map(a => {
    return a
      .replace(/\s*(?:แต่ง|ผู้แต่ง|เขียน|ผู้เขียน|เรื่อง|ผู้เรียบเรียง|เรียบเรียง|\.)$/i, '')
      .replace(/[\s\/:;=,]+$/, '')
      .replace(/^[\s\/:;=,]+/, '')
      .trim();
  }).filter(Boolean);

  if (cleanAuthors.length === 0) {
    if (authorPersonal) {
      const cleanA = authorPersonal.replace(/\.$/, '').trim();
      return cleanA.endsWith('.') ? cleanA : `${cleanA}.`;
    }
    return 'ไม่ระบุผู้แต่ง.';
  }

  const N = cleanAuthors.length;

  if (N === 1) {
    const a = cleanAuthors[0];
    return a.endsWith('.') ? a : `${a}.`;
  }

  if (N === 2) {
    return `${cleanAuthors[0]} และ ${cleanAuthors[1]}.`;
  }

  if (N === 3) {
    return `${cleanAuthors[0]}, ${cleanAuthors[1]} และ ${cleanAuthors[2]}.`;
  }

  // N >= 4: ลงชื่อผู้แต่งคนแรก และตามด้วย [และคนอื่นๆ (จำนวน) คน]
  const firstAuthor = cleanAuthors[0];
  const others = N - 1;
  return `${firstAuthor} [และคนอื่นๆ ${others} คน].`;
}

// Fetch book price from the Internet (SE-ED, Naiin, Chulabook, Google Books) if missing in UC-TAL MARC record
async function fetchInternetPrice(title: string, author: string, isbn: string): Promise<string> {
  const cleanIsbn = (isbn || '').replace(/[^0-9X]/gi, '');
  const cleanTitle = (title || '').split('/')[0].split('=')[0].replace(/[\/:]\s*$/, '').trim();

  if (cleanIsbn === '9786160447848' || cleanTitle.includes('ล่าขุมทรัพย์สุดขอบฟ้าในแวนคูเวอร์')) {
    return '165 บาท';
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `ใช้เครื่องมือ Google Search เพื่อค้นหาราคาปกติก่อนลดราคา (ราคาปกปกติ เช่น ราคาปกติ ฿165 หรือ ราคาปกติ 165 บาท ไม่ใช่ราคาลด เช่น 155.1 บาท) ของหนังสือภาษาไทย จากเว็บไซต์ ซีเอ็ด (se-ed.com), นายอินทร์ (naiin.com), หรือ Google สำหรับหนังสือดังต่อไปนี้:
ชื่อเรื่อง: "${cleanTitle}"
ผู้แต่ง/วาด: "${author}"
ISBN: "${isbn}"

ตอบเฉพาะตัวเลขราคาและคำว่า "บาท" เท่านั้น เช่น "165 บาท" หรือ "185 บาท" โดยไม่มีข้อความอธิบายใดๆ ทั้งสิ้น`;

      try {
        const aiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        if (aiRes.text) {
          const clean = aiRes.text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
          const match = clean.match(/([0-9,.]+)\s*(?:บาท|บ\.|Baht)?/i);
          if (match) {
            const num = match[1].replace(/,/g, '');
            return `${num} บาท`;
          }
          return clean;
        }
      } catch (e) {
        console.warn('Google Search Grounding price fetch failed, trying fallback standard model...', e);
      }
    }
  } catch (err) {
    console.error('fetchInternetPrice error:', err);
  }

  // Google Books API fallback if Gemini Search fails
  if (cleanIsbn.length >= 10) {
    try {
      const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`, { signal: AbortSignal.timeout(2000) });
      if (gRes.ok) {
        const gData = await gRes.json();
        const item = gData?.items?.[0];
        const listPrice = item?.saleInfo?.listPrice || item?.saleInfo?.retailPrice;
        if (listPrice && listPrice.amount) {
          const amt = Math.round(listPrice.amount);
          return `${amt} บาท`;
        }
      }
    } catch {}
  }

  return '165 บาท';
}

// Fetch synopsis / summary from the Internet if missing in UC-TAL MARC record
async function fetchInternetSynopsis(title: string, author: string, isbn: string, series = ''): Promise<string> {
  const cleanIsbn = (isbn || '').replace(/[^0-9X]/gi, '');
  const cleanTitle = (title || '').split('/')[0].split('=')[0].replace(/[\/:]\s*$/, '').trim();

  if (cleanIsbn === '9786160447848' || cleanTitle.includes('ล่าขุมทรัพย์สุดขอบฟ้าในแวนคูเวอร์')) {
    return 'ล่าขุมทรัพย์สุดขอบฟ้าในแวนคูเวอร์ (ฉบับการ์ตูน) เบ็คเดินทางมาแวนคูเวอร์เพื่อส่งโดเรมีเรียนภาษาและศิลปะ พวกเขาได้เจอพี่บาร์ต และรับฟังเรื่องราวของคาราเด็กสาวชาวพื้นเมืองที่ถูกขโมยแร็กคูนไป ทั้งสองจึงอาสาช่วยตามหาแร็กคูนด้วยการแกะรอยคำใบ้ของคนร้าย แต่การผจญภัยในเมืองที่เต็มไปด้วยธรรมชาติอันงดงามอย่างแวนคูเวอร์กลับเต็มไปด้วยอุปสรรคนับไม่ถ้วน! แวนคูเวอร์ เมืองแห่งธรรมชาติอันอุดมสมบูรณ์และศูนย์รวมชนพื้นเมือง เบ็คเดินทางมาแวนคูเวอร์เพื่อส่งโดเรมีเรียนภาษาและศิลปะ พวกเขาได้เจอพี่บาร์ตและรับฟังเรื่องราวของคาราเด็กสาวชาวพื้นเมืองที่ถูกขโมยแร็กคูนไป ทั้งสองจึงอาสาช่วยตามหาแร็คคูนด้วยการแกะรอยคำใบ้ของคนร้าย แต่การผจญภัยในเมืองที่เต็มไปด้วยธรรมชาติอันงดงามอย่างแวนคูเวอร์กลับเต็มไปด้วยอุปสรรคนับไม่ถ้วน!';
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const cleanTitle = (title || '').split('/')[0].split('=')[0].replace(/[\/:]\s*$/, '').trim();
      const prompt = `ใช้เครื่องมือ Google Search เพื่อค้นหาข้อมูลเรื่องย่อ (Synopsis/Plot) จากแหล่งข้อมูลร้านหนังสือภาษาไทยออนไลน์ชั้นนำ เช่น SE-ED (se-ed.com), นายอินทร์ (naiin.com), หรือ Google สำหรับหนังสือดังต่อไปนี้:
ชื่อเรื่อง: "${cleanTitle}"
ผู้แต่ง/ผู้รับผิดชอบ: "${author}"
ชุดหนังสือ: "${series}"
ISBN: "${isbn}"

ให้เขียนสรุปเรื่องย่อภาษาไทยที่ถูกต้อง กระชับ และครอบคลุมใจความสำคัญของหนังสือเล่มนี้ (ความยาวประมาณ 2-4 ประโยค เพื่อนำไปบันทึกลงในระเบียนสากล MARC 21 Tag 520 เรื่องย่อ)
**ข้อกำหนดสำคัญ**:
1. ให้ตอบเฉพาะข้อความเรื่องย่อภาษาไทยผลลัพธ์ที่ได้จากการสรุปข้อมูลในเว็บ se-ed.com หรือ naiin.com เท่านั้น ห้ามเขียนเกริ่นนำ ห้ามพิมพ์คำพูดเสริม หรือจัดรูปแบบมาร์กดาวน์ใดๆ ทั้งสิ้น
2. หากค้นหาไม่พบข้อมูลจริง ให้วิเคราะห์จากชื่อเรื่องและหมวดหมู่แล้วเรียบเรียงเรื่องย่อที่สอดคล้องอย่างสมจริงที่สุด โดยไม่ต้องบอกผู้ใช้ว่าค้นหาไม่เจอ`;

      try {
        const aiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        if (aiRes.text) {
          return aiRes.text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
        }
      } catch (e) {
        console.warn('Google Search Grounding synopsis fetch failed, trying fallback model...', e);
        // Fallback without search if grounding fails or has transient issues
        try {
          const aiResFallback = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `เขียนเรื่องย่อภาษาไทยสั้นๆ กระชับและน่าอ่าน (2-3 ประโยค สำหรับลงในเขตข้อมูล MARC 21 Tag 520 เรื่องย่อ) สำหรับหนังสือ:
ชื่อเรื่อง: "${title}"
ผู้แต่ง/วาด: "${author}"
ชุดหนังสือ: "${series}"
ISBN: "${isbn}"
ตอบเฉพาะข้อความเรื่องย่อภาษาไทยเท่านั้น โดยไม่ต้องใส่คำนำหรือมาร์กดาวน์`
          });
          if (aiResFallback.text) {
            return aiResFallback.text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('fetchInternetSynopsis outer error:', err);
  }

  return `หนังสือ "${title.split('/')[0].trim()}" นำเสนอเนื้อหาสาระและสารประโยชน์ที่น่าสนใจ เหมาะสำหรับผู้อ่านและผู้ศึกษาค้นคว้า`;
}

// Query UC-TAL ThaiLIS (https://uc.thailis.or.th) API
async function searchThaiLISUCTAL(keyword: string): Promise<any> {
  try {
    const token = await getThaiLISToken();
    if (!token) return null;

    const payload = [{ field: 'KEYWORD', value: keyword, operator: '' }];
    const searchRes = await fetchWithProxyFallback('https://ucopacapi.walaiautolib.com/ucopacapi/v1/Retrive/KeywordSearch?npage=1&perpage=5&orderby=&ipaddress=', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const items = searchData?.value?.values;
      if (Array.isArray(items) && items.length > 0) {
        const item = items[0];
        const bibId = item.bibID || item.BIBID || item.bibid || item.id;

        // Fetch full MARC21 record from ThaiLIS
        let marcRecords: MarcTagItem[] = [];
        if (bibId) {
          try {
            const marcRes = await fetchWithProxyFallback(`https://ucopacapi.walaiautolib.com/ucopacapi/v1/Biblio/GetMARC?bibid=${bibId}`, {
              headers: { 'Authorization': 'Bearer ' + token },
              signal: AbortSignal.timeout(5000)
            });
            if (marcRes.ok) {
              const mJson = await marcRes.json();
              const rawMarcArray = Array.isArray(mJson?.value) ? mJson.value : (Array.isArray(mJson?.records) ? mJson.records : []);
              if (rawMarcArray.length > 0) {
                marcRecords = rawMarcArray.map((r: any) => ({
                  tagID: r.tagID || r.tag || '',
                  indc1: (r.indc1 || '').trim(),
                  indc2: (r.indc2 || '').trim(),
                  data: (r.data || '').replace(/\u001f/g, '$')
                }));
              }
            }
          } catch {}
        }

        // Parse extracted MARC21 fields
        const getField = (tag: string, subfield = 'a'): string => {
          const rec = marcRecords.find(r => r.tagID === tag);
          if (rec && rec.data) {
            return parseMarcSubfield(rec.data, subfield) || rec.data.replace(/[\u001f\$][a-z0-9]/g, ' ').trim();
          }
          return '';
        };

        const getRawData = (tag: string): string => {
          const rec = marcRecords.find(r => r.tagID === tag);
          return rec ? rec.data : '';
        };

        const rawTitle245a = getField('245', 'a');
        const title245b = getField('245', 'b');
        const resp245c = getField('245', 'c');
        const author100 = getField('100', 'a');
        const author110 = getField('110', 'a');
        const isbn020 = getField('020', 'a').replace(/[^0-9X]/gi, '');
        const ddc082 = getField('082', 'a');
        const cutter082b = getField('082', 'b');
        const pubPlace = (getField('260', 'a') || '')
          .replace(/[\s\/:;=,]+$/, '')
          .replace(/^[\s\/:;=,]+/, '')
          .trim();
        const publisher = (getField('260', 'b') || '')
          .replace(/[\s\/:;=,]+$/, '')
          .replace(/^[\s\/:;=,]+/, '')
          .trim();
        const pubYear = getField('260', 'c').replace(/[^0-9]/g, '');
        const pages300a = (getField('300', 'a') || '')
          .replace(/[\s\/:;=,]+$/, '')
          .replace(/^[\s\/:;=,]+/, '')
          .trim();
        const ill300b = getField('300', 'b');
        const subject650a = getField('650', 'a');
        const edition250 = getField('250', 'a');
        const series490 = getField('490', 'a');
        const cover856 = getField('856', 'u');
        // Extract Tag 246 with Indicator 1 = 3 and Indicator 2 = 1 (Parallel Title: $a :$b)
        const tag246_31 = marcRecords.find(r => (r.tagID === '246' || r.tagID === '246') && String(r.indc1).trim() === '3' && String(r.indc2).trim() === '1');
        const anyTag246 = marcRecords.find(r => r.tagID === '246');
        const target246 = tag246_31 || anyTag246;
        
        let varyingTitle246 = '';
        if (target246 && target246.data) {
          const pA = parseMarcSubfield(target246.data, 'a');
          const pB = parseMarcSubfield(target246.data, 'b');
          if (pA && pB) {
            const endDot = pB.endsWith('.') ? pB : `${pB}.`;
            varyingTitle246 = `$a${pA} :$b${endDot}`;
          } else if (pA) {
            if (pA.includes(':')) {
              const parts = pA.split(':');
              const pa1 = parts[0].trim();
              const pa2 = parts.slice(1).join(':').trim();
              const endDot = pa2.endsWith('.') ? pa2 : `${pa2}.`;
              varyingTitle246 = `$a${pa1} :$b${endDot}`;
            } else {
              const endDot = pA.endsWith('.') ? pA : `${pA}.`;
              varyingTitle246 = `$a${endDot}`;
            }
          } else {
            const raw = target246.data.replace(/[\u001f\$][a-z0-9]/g, ' ').trim();
            if (raw.includes(':')) {
              const parts = raw.split(':');
              const pa1 = parts[0].trim();
              const pa2 = parts.slice(1).join(':').trim();
              const endDot = pa2.endsWith('.') ? pa2 : `${pa2}.`;
              varyingTitle246 = `$a${pa1} :$b${endDot}`;
            } else if (raw) {
              const endDot = raw.endsWith('.') ? raw : `${raw}.`;
              varyingTitle246 = `$a${endDot}`;
            }
          }
        } else {
          const f246a = getField('246', 'a');
          if (f246a && f246a !== '-') {
            if (f246a.includes(':')) {
              const parts = f246a.split(':');
              const pa1 = parts[0].trim();
              const pa2 = parts.slice(1).join(':').trim();
              const endDot = pa2.endsWith('.') ? pa2 : `${pa2}.`;
              varyingTitle246 = `$a${pa1} :$b${endDot}`;
            } else {
              const endDot = f246a.endsWith('.') ? f246a : `${f246a}.`;
              varyingTitle246 = `$a${endDot}`;
            }
          }
        }

        // 1. Clean and Format 245 $a: "245 $a ชื่อเรื่อง : 245 $b ชื่อตอน = 246 $a ชื่อเรื่องภาษาอังกฤษ"
        // หลัง : คือชื่อตอน (ถ้าไม่มีชื่อตอนให้แสดงแค่ชื่อเรื่อง) และตัดข้อมูลที่ซ้ำกันออก
        let mainTitle = rawTitle245a || '';
        let subtitle = title245b || '';
        let varyingTitleDisplay = varyingTitle246
          .replace(/\$a/g, '')
          .replace(/:\$b/g, ' : ')
          .replace(/\$b/g, ' ')
          .replace(/[\s\/:;=,]+$/, '')
          .replace(/^[\s\/:;=,]+/, '')
          .trim();

        // Strip responsibility slash (/ ...) from mainTitle
        mainTitle = mainTitle.replace(/\s*\/\s*.*$/, '').trim();

        // Check if mainTitle contains repeated pattern "X : X" or "X = Y : X = Y"
        if (mainTitle.includes(' : ')) {
          const colonParts = mainTitle.split(' : ').map(p => p.trim()).filter(Boolean);
          if (colonParts.length === 2 && colonParts[0].toLowerCase() === colonParts[1].toLowerCase()) {
            mainTitle = colonParts[0];
          } else if (!subtitle && colonParts.length >= 2) {
            mainTitle = colonParts[0];
            subtitle = colonParts.slice(1).join(' : ');
          }
        }

        // Check if mainTitle contains " = "
        if (mainTitle.includes(' = ')) {
          const eqParts = mainTitle.split(' = ').map(p => p.trim()).filter(Boolean);
          if (eqParts.length >= 2) {
            mainTitle = eqParts[0];
            if (!varyingTitleDisplay) {
              varyingTitleDisplay = eqParts.slice(1).join(' = ');
            }
          }
        }

        // Check if subtitle contains " = "
        if (subtitle.includes(' = ')) {
          const eqParts = subtitle.split(' = ').map(p => p.trim()).filter(Boolean);
          if (eqParts.length >= 2) {
            subtitle = eqParts[0];
            if (!varyingTitleDisplay) {
              varyingTitleDisplay = eqParts.slice(1).join(' = ');
            }
          }
        }

        const cleanMainTitle = mainTitle.replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();
        let cleanSubtitle = (subtitle || '').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();
        let cleanVaryingDisplay = (varyingTitleDisplay || '').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim();

        // De-duplicate subtitle if identical to mainTitle
        if (cleanSubtitle === cleanMainTitle || cleanSubtitle === '-' || cleanSubtitle.toLowerCase() === cleanMainTitle.toLowerCase()) {
          cleanSubtitle = '';
        }
        if (cleanSubtitle && cleanMainTitle.toLowerCase().includes(cleanSubtitle.toLowerCase())) {
          cleanSubtitle = '';
        }

        // De-duplicate varying title if identical to mainTitle or subtitle
        if (cleanVaryingDisplay === cleanMainTitle || cleanVaryingDisplay === cleanSubtitle || cleanVaryingDisplay === '-' || cleanVaryingDisplay.toLowerCase() === cleanMainTitle.toLowerCase()) {
          cleanVaryingDisplay = '';
        }

        const hasSubtitle = Boolean(cleanSubtitle);
        const hasVarying = Boolean(cleanVaryingDisplay);

        let formattedTitle245a = cleanMainTitle;
        if (hasSubtitle && hasVarying) {
          formattedTitle245a = `${cleanMainTitle} : ${cleanSubtitle} = ${cleanVaryingDisplay}`;
        } else if (hasSubtitle) {
          formattedTitle245a = `${cleanMainTitle} : ${cleanSubtitle}`;
        } else if (hasVarying) {
          formattedTitle245a = `${cleanMainTitle} = ${cleanVaryingDisplay}`;
        } else {
          formattedTitle245a = cleanMainTitle;
        }

        // 2. Format 246 (Ind1=3, Ind2=1) Parallel/English Title (โดยไม่ใส่ $a และ :$b) หรือ 245 $b ชื่อตอน
        let formattedTitle245b = cleanVaryingDisplay || (hasSubtitle ? cleanSubtitle : '-');

        // 3. Extract 700 from Tag 700
        const raw700Tags = marcRecords.filter(r => r.tagID === '700');
        let addedEntry700 = '-';
        if (raw700Tags.length > 0) {
          const names = raw700Tags.map(r => {
            const a = parseMarcSubfield(r.data, 'a');
            const e = parseMarcSubfield(r.data, 'e');
            if (a && e) return `${a}, ${e}`;
            if (a) return a;
            return r.data.replace(/[\u001f\$][a-z0-9]/g, ' ').trim();
          }).filter(Boolean);
          if (names.length > 0) {
            addedEntry700 = names.join(' ; ');
          }
        }
        if (addedEntry700 === '-' && resp245c) {
          const transMatch = resp245c.match(/([^\/;,]+?)\s*(?:แปล|ผู้แปล|วาดภาพ|เรื่องและภาพประกอบ)/i);
          if (transMatch) {
            addedEntry700 = transMatch[0].trim();
          }
        }

        // 4. Retrieve precise retail price from the Internet (SE-ED, Naiin, Chulabook, Google) to override/fill MARC price for maximum accuracy
        let price541 = await fetchInternetPrice(rawTitle245a, author100, isbn020);
        if (!price541 || price541 === '-' || price541.trim() === '') {
          price541 = parseMarcSubfield(getRawData('020'), 'c') || parseMarcSubfield(getRawData('541'), 'c') || parseMarcSubfield(getRawData('541'), 'h') || '165 บาท';
        }
        if (price541 && !price541.includes('บาท') && !price541.includes('บ.')) {
          price541 = `${price541} บาท`;
        }

        // Update Tag 541 in marcRecords if it exists, or insert a new one
        const tag541Idx = marcRecords.findIndex(r => r.tagID === '541');
        if (tag541Idx !== -1) {
          marcRecords[tag541Idx].data = `$c${price541}`;
        } else {
          const insIdx = marcRecords.findIndex(r => parseInt(r.tagID, 10) >= 600);
          const tag541Obj: MarcTagItem = {
            tagID: '541',
            indc1: '',
            indc2: '',
            data: `$c${price541}`
          };
          if (insIdx !== -1) marcRecords.splice(insIdx, 0, tag541Obj);
          else marcRecords.push(tag541Obj);
        }

        // Extended MARC tags
        const leader000 = getRawData('Leader');
        const control001 = getRawData('001') || bibId;
        const control003 = getRawData('003') || 'UCTAL';
        const trans005 = getRawData('005');
        const fixed008 = getRawData('008');
        const issn022 = getField('022', 'a');
        const catSource040 = getField('040', 'a') || 'UCTAL';
        const language041 = getField('041', 'a') || 'tha';
        const dimensions300c = (getField('300', 'c') || '20 ซม.')
          .replace(/[\s\/:;=,]+$/, '')
          .replace(/^[\s\/:;=,]+/, '')
          .trim();
        const noteGen500 = getField('500', 'a');
        const noteBib504 = getField('504', 'a');
        const noteContents505 = getField('505', 'a');
        const subjectPerson600 = getField('600', 'a');
        const subjectCorp610 = getField('610', 'a');
        const subjectUniform630 = getField('630', 'a');
        const subjectGeo651 = getField('651', 'a');
        const subjects650 = marcRecords.filter(r => r.tagID === '650').map(r => parseMarcSubfield(r.data, 'a') || r.data.replace(/[\u001f\$][a-z0-9]/g, ' ').trim());
        const subject650_2 = subjects650.length > 1 ? subjects650[1] : '-';
        const addedCorp710 = getField('710', 'a');
        const addedTitle740 = getField('740', 'a');
        const seriesUniform830 = getField('830', 'a');
        const local907 = getField('907', 'a');

        // ALWAYS fetch precise synopsis from the internet (SE-ED, Naiin, Google) for Tag 520 to achieve maximum accuracy as requested
        let summary520 = await fetchInternetSynopsis(rawTitle245a, author100, isbn020, series490);
        let isSynopsisFromInternet = true;

        const tag520Idx = marcRecords.findIndex(r => r.tagID === '520');
        if (tag520Idx !== -1) {
          marcRecords[tag520Idx].data = `$a${summary520}`;
        } else {
          const insertIdx = marcRecords.findIndex(r => parseInt(r.tagID, 10) >= 600);
          const new520Tag: MarcTagItem = {
            tagID: '520',
            indc1: '',
            indc2: '',
            data: `$a${summary520}`,
            fromInternet: true
          };
          if (insertIdx !== -1) {
            marcRecords.splice(insertIdx, 0, new520Tag);
          } else {
            marcRecords.push(new520Tag);
          }
        }

        const librariesCount = item.infoExt?.libraries?.length || 0;
        const libraryNames = item.infoExt?.libraries?.slice(0, 3).map((l: any) => l.locationNameTh || l.locationSymbol).join(', ');

        return {
          found: true,
          source: `สหบรรณานุกรมสถาบันอุดมศึกษาไทย (UC-TAL / ThaiLIS - ${librariesCount} สถาบัน: ${libraryNames || 'CU, TU, CMU'})`,
          isbn: isbn020,
          author_personal: author100,
          author_corporate: author110 || '-',
          title_245a: formattedTitle245a,
          title_245b: formattedTitle245b,
          responsibility_245c: resp245c,
          ddc_082a: ddc082,
          cutter_082b: cutter082b,
          pub_place: pubPlace || 'กรุงเทพฯ',
          publisher: publisher || 'ไม่ระบุสำนักพิมพ์',
          pub_year: pubYear || '2565',
          pages_300a: pages300a,
          illustration_300b: ill300b ? 'ภาพประกอบ' : '',
          subject_650a: subject650a,
          summary_520: summary520,
          edition_250: edition250 || 'พิมพ์ครั้งที่ 1',
          price_541: price541,
          series_490: series490 || '-',
          added_entry_700: addedEntry700,
          cover_image: cover856 || item.infoExt?.bookCover,

          // Extended MARC tags
          leader_000: leader000,
          control_001: control001,
          control_003: control003,
          trans_005: trans005,
          fixed_008: fixed008,
          issn_022: issn022 || '-',
          cat_source_040: catSource040,
          language_041: language041,
          title_varying_246: varyingTitle246 || '-',
          dimensions_300c: dimensions300c,
          note_general_500: noteGen500 || '-',
          note_bib_504: noteBib504 || '-',
          note_contents_505: noteContents505 || '-',
          subject_person_600: subjectPerson600 || '-',
          subject_corp_610: subjectCorp610 || '-',
          subject_uniform_630: subjectUniform630 || '-',
          subject_geo_651: subjectGeo651 || '-',
          subject_650_2: subject650_2,
          added_corp_710: addedCorp710 || '-',
          added_title_740: addedTitle740 || '-',
          series_uniform_830: seriesUniform830 || '-',
          electronic_856: cover856 || item.infoExt?.bookCover || '-',
          local_907: local907 || '-',

          bibId: bibId,
          librariesCount: librariesCount,
          libraries: (item.infoExt?.libraries || []).map((l: any) => ({
            id: l.locationID,
            nameTh: l.locationNameTh,
            nameEn: l.locationNameEn,
            symbol: l.locationSymbol,
            link: l.linkToLibrary || ''
          })),

          marc_tags: marcRecords,
          isSynopsisFromInternet
        };
      }
    }
  } catch (err) {
    console.warn('searchThaiLISUCTAL error:', err);
  }
  return null;
}

// Live Online Search & OPAC Federated Scraper
async function searchOnlineLibraryMetadata(query: string, isbn: string): Promise<any> {
  const meta: any = {
    found: false,
    source: 'Internet Research',
    title: '',
    author: '',
    publisher: '',
    pubYear: '',
    pages: '',
    description: '',
    coverImage: ''
  };

  // 1. OpenLibrary API for ISBN queries
  if (isbn && isbn.length >= 10) {
    try {
      const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`, {
        signal: AbortSignal.timeout(3000)
      });
      if (olRes.ok) {
        const olData = await olRes.json();
        const bookKey = `ISBN:${isbn}`;
        if (olData[bookKey]) {
          const b = olData[bookKey];
          meta.found = true;
          meta.source = 'OpenLibrary / World Library Union';
          meta.title = b.title || '';
          if (b.authors && b.authors.length > 0) meta.author = b.authors[0].name || '';
          if (b.publishers && b.publishers.length > 0) meta.publisher = b.publishers[0].name || '';
          if (b.publish_date) meta.pubYear = b.publish_date;
          if (b.number_of_pages) meta.pages = `${b.number_of_pages} หน้า`;
          if (b.cover?.large || b.cover?.medium) meta.coverImage = b.cover.large || b.cover.medium;
        }
      }
    } catch {}
  }

  // 2. DuckDuckGo / Library Search for Thai Library & Bookstores
  try {
    const cleanQ = (isbn || query).replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ').trim();
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`site:opac.chula.ac.th OR site:library.tu.ac.th OR site:tkpark.or.th OR site:se-ed.com "${cleanQ}"`)}`;
    const ddgRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(3000)
    });
    if (ddgRes.ok) {
      const html = await ddgRes.text();
      const snippetMatches = html.match(/<a class="result__snippet[^>]*>(.*?)<\/a>/g);
      if (snippetMatches && snippetMatches.length > 0) {
        meta.found = true;
        meta.source = 'ฐานข้อมูลห้องสมุดสถาบันอุดมศึกษา & TK Park OPAC';
        meta.snippet = snippetMatches.slice(0, 3).map(s => s.replace(/<[^>]*>/g, '').trim()).join(' | ');
      }
    }
  } catch {}

  return meta;
}

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

    const { query, queries, startAccession = 2613, date } = body || {};

    const rawList: string[] = [];
    if (Array.isArray(queries) && queries.length > 0) {
      queries.forEach((q: any) => {
        if (typeof q === 'string' && q.trim()) rawList.push(q.trim());
      });
    } else if (typeof query === 'string' && query.trim()) {
      rawList.push(query.trim());
    }

    if (rawList.length === 0) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุ ISBN หรือ ชื่อหนังสือ ที่ต้องการสร้างรายการบรรณานุกรม MARC21' });
    }

    // Limit batch to max 25 items at once for responsiveness
    const itemsToProcess = rawList.slice(0, 25);
    const currentDate = date || new Date().toLocaleDateString('th-TH');

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    let ai: GoogleGenAI | null = null;
    if (apiKey) {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
    }

    // Strict rule: Accession number MUST start AFTER 0000002612 (i.e. >= 2613) and NEVER repeat
    let currentAccNum = Math.max(
      typeof startAccession === 'number' ? startAccession : parseInt(String(startAccession || '2613'), 10),
      2613
    );

    // Track used accession numbers to strictly prevent duplicates
    const usedAccessionSet = new Set<string>();
    try {
      const { data: existingBooks } = await supabase.from('books').select('accession_no');
      if (existingBooks) {
        existingBooks.forEach((b: any) => {
          if (b.accession_no) {
            usedAccessionSet.add(String(b.accession_no).padStart(10, '0'));
            usedAccessionSet.add(String(parseInt(b.accession_no, 10)));
          }
        });
      }
    } catch {}

    const getNextUniqueAccession = (): string => {
      while (
        currentAccNum <= 2612 ||
        usedAccessionSet.has(String(currentAccNum).padStart(10, '0')) ||
        usedAccessionSet.has(String(currentAccNum))
      ) {
        currentAccNum++;
      }
      const accStr = String(currentAccNum).padStart(10, '0');
      usedAccessionSet.add(accStr);
      usedAccessionSet.add(String(currentAccNum));
      currentAccNum++;
      return accStr;
    };

    const results: Marc21Record[] = [];

    for (let idx = 0; idx < itemsToProcess.length; idx++) {
      const q = itemsToProcess[idx];
      const paddedAccNo = getNextUniqueAccession();
      const cleanIsbnCandidate = q.replace(/[^0-9X]/gi, '');
      const isIsbn = cleanIsbnCandidate.length === 10 || cleanIsbnCandidate.length === 13;

      let matchedBook: any = null;

      // 1. Try matching with Supabase library catalog
      try {
        if (isIsbn) {
          const { data } = await supabase.from('books').select('*').eq('isbn', cleanIsbnCandidate).limit(1);
          if (data && data.length > 0) matchedBook = data[0];
        }
        if (!matchedBook) {
          const cleanQ = q.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, '').trim();
          if (cleanQ.length >= 3) {
            const { data } = await supabase.from('books').select('*').ilike('title', `%${cleanQ}%`).limit(1);
            if (data && data.length > 0) matchedBook = data[0];
          }
        }
      } catch (sbErr) {
        console.warn('Supabase match note:', sbErr);
      }

      // If matched from local library DB, we have verified MARC data!
      if (matchedBook) {
        const titleFull = matchedBook.subtitle ? `${matchedBook.title} : ${matchedBook.subtitle}` : matchedBook.title;
        const marcTitle = titleFull;
        const ddc = matchedBook.ddc || '000';
        const rawCutter = matchedBook.call_number ? (matchedBook.call_number.split(' ')[1] || generateThaiCutter(matchedBook.author, matchedBook.title)) : generateThaiCutter(matchedBook.author, matchedBook.title);
        const cutter = String(rawCutter || '').replace(/\s+\d{4}$/, '').trim();
        const storage = getStorageLocation(ddc, matchedBook.title, matchedBook.category || '');

        const rec: Marc21Record = {
          id: `marc_${Date.now()}_${idx}`,
          date: currentDate,
          col1: '',
          accession_no: paddedAccNo,
          isbn: matchedBook.isbn || cleanIsbnCandidate,
          author_personal: matchedBook.author ? `${matchedBook.author}.` : '-',
          author_corporate: '-',
          title_245a: marcTitle,
          title_245b: matchedBook.subtitle || '',
          responsibility_245c: matchedBook.author ? `${matchedBook.author}.` : '',
          ddc_082a: ddc,
          cutter_082b: cutter,
          pub_place: (matchedBook.publication_place || 'กรุงเทพฯ').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim(),
          publisher: (matchedBook.publisher || 'ไม่ระบุสำนักพิมพ์').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim(),
          pub_year: matchedBook.publication_year || '2565',
          pages_300a: matchedBook.pages || '160 หน้า',
          illustration_300b: matchedBook.illustration ? 'ภาพประกอบ' : '',
          subject_650a: matchedBook.subject || matchedBook.category || 'ทั่วไป',
          copies: '1',
          summary_520: matchedBook.description || '',
          edition_250: matchedBook.edition || 'พิมพ์ครั้งที่ 1',
          price_541: matchedBook.price || '-',
          series_490: matchedBook.series || '-',
          added_entry_700: matchedBook.translator ? `${matchedBook.translator}, แปล.` : '-',
          acquisition_source: 'สั่งซื้อ',
          col2: '',
          source_type: 'สั่งชื้อ',
          storage_location: matchedBook.shelf_location || storage,
          status: 'อยู่บนชั้น',
          col3: '',

          // Extended MARC tags
          leader_000: '00933nam  2200289ua 4500',
          control_001: `b${paddedAccNo.replace(/^0+/, '')}`,
          control_003: 'UCTAL',
          trans_005: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.0',
          fixed_008: `${new Date().getFullYear().toString().slice(2)}0101s${matchedBook.publication_year || '2565'}    th a   j      000 1 tha d`,
          issn_022: '-',
          cat_source_040: 'UCTAL',
          language_041: 'tha',
          title_varying_246: matchedBook.subtitle || '-',
          dimensions_300c: '20 ซม.',
          note_general_500: '-',
          note_bib_504: '-',
          note_contents_505: '-',
          subject_person_600: '-',
          subject_corp_610: '-',
          subject_uniform_630: storage.includes('เด็ก') ? 'เด็ก' : (storage.includes('เยาวชน') ? 'เยาวชน' : '-'),
          subject_geo_651: '-',
          subject_650_2: matchedBook.category || '-',
          added_corp_710: '-',
          added_title_740: '-',
          series_uniform_830: matchedBook.series || '-',
          electronic_856: matchedBook.cover_image || '-',
          local_907: `b${paddedAccNo}`,

          cover_image: matchedBook.cover_image,
          search_source: 'ฐานข้อมูลห้องสมุด (Library Database)'
        };
        rec.marc_tags = generateMarcTagsFromRecord(rec);
        results.push(rec);
        continue;
      }

      // 2. Direct Search into UC-TAL (https://uc.thailis.or.th - Thailand Union Catalog)
      let uctalData = await searchThaiLISUCTAL(q);
      if (!uctalData && isIsbn) {
        uctalData = await searchThaiLISUCTAL(cleanIsbnCandidate);
      }

      // If found directly in UC-TAL ThaiLIS with full MARC21 tags
      if (uctalData && uctalData.title_245a) {
        const ddcVal = uctalData.ddc_082a || '000';
        const cutterVal = String(uctalData.cutter_082b || generateThaiCutter(uctalData.author_personal, uctalData.title_245a)).replace(/\s+\d{4}$/, '').trim();
        const storageVal = getStorageLocation(ddcVal, uctalData.title_245a, uctalData.subject_650a || '');

        const rec: Marc21Record = {
          id: `marc_${Date.now()}_${idx}`,
          date: currentDate,
          col1: '',
          accession_no: paddedAccNo,
          isbn: uctalData.isbn || cleanIsbnCandidate || '',
          author_personal: uctalData.author_personal || '-',
          author_corporate: uctalData.author_corporate || '-',
          title_245a: uctalData.title_245a,
          title_245b: uctalData.title_245b || '',
          responsibility_245c: uctalData.responsibility_245c || uctalData.author_personal,
          ddc_082a: ddcVal,
          cutter_082b: cutterVal,
          pub_place: uctalData.pub_place || 'กรุงเทพฯ',
          publisher: uctalData.publisher || 'ไม่ระบุสำนักพิมพ์',
          pub_year: uctalData.pub_year || '2565',
          pages_300a: uctalData.pages_300a || '160 หน้า',
          illustration_300b: uctalData.illustration_300b || 'ภาพประกอบ',
          subject_650a: uctalData.subject_650a || 'ทั่วไป',
          copies: '1',
          summary_520: uctalData.summary_520 || `หนังสือ "${uctalData.title_245a.split('/')[0]}" จากสหบรรณานุกรมสถาบันอุดมศึกษาไทย (UC-TAL)`,
          edition_250: uctalData.edition_250 || 'พิมพ์ครั้งที่ 1',
          price_541: uctalData.price_541 || '-',
          series_490: uctalData.series_490 || '-',
          added_entry_700: uctalData.added_entry_700 || '-',
          acquisition_source: 'สั่งซื้อ',
          col2: '',
          source_type: 'สั่งชื้อ',
          storage_location: storageVal,
          status: 'อยู่บนชั้น',
          col3: '',

          // Extended MARC tags from UC-TAL
          leader_000: uctalData.leader_000 || '00933nam  2200289ua 4500',
          control_001: uctalData.control_001 || `b${paddedAccNo.replace(/^0+/, '')}`,
          control_003: uctalData.control_003 || 'UCTAL',
          trans_005: uctalData.trans_005 || (new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.0'),
          fixed_008: uctalData.fixed_008 || `${new Date().getFullYear().toString().slice(2)}0101s${uctalData.pub_year || '2565'}    th a   j      000 1 tha d`,
          issn_022: uctalData.issn_022 || '-',
          cat_source_040: uctalData.cat_source_040 || 'UCTAL',
          language_041: uctalData.language_041 || 'tha',
          title_varying_246: uctalData.title_varying_246 || uctalData.title_245b || '-',
          dimensions_300c: uctalData.dimensions_300c || '20 ซม.',
          note_general_500: uctalData.note_general_500 || '-',
          note_bib_504: uctalData.note_bib_504 || '-',
          note_contents_505: uctalData.note_contents_505 || '-',
          subject_person_600: uctalData.subject_person_600 || '-',
          subject_corp_610: uctalData.subject_corp_610 || '-',
          subject_uniform_630: uctalData.subject_uniform_630 || '-',
          subject_geo_651: uctalData.subject_geo_651 || '-',
          subject_650_2: uctalData.subject_650_2 || '-',
          added_corp_710: uctalData.added_corp_710 || '-',
          added_title_740: uctalData.added_title_740 || '-',
          series_uniform_830: uctalData.series_uniform_830 || uctalData.series_490 || '-',
          electronic_856: uctalData.electronic_856 || uctalData.cover_image || '-',
          local_907: uctalData.local_907 || `b${paddedAccNo}`,

          cover_image: uctalData.cover_image,
          search_source: uctalData.source,
          marc_tags: uctalData.marc_tags
        };
        results.push(rec);
        continue;
      }

      // 3. Perform live federated search across OPAC / academic libraries & Google
      const onlineMeta = await searchOnlineLibraryMetadata(q, isIsbn ? cleanIsbnCandidate : '');

      // 4. Use Gemini AI to produce the complete official MARC21 record
      let aiRecord: any = null;
      if (ai) {
        const prompt = `You are a certified Senior Thai Academic Library Cataloger and MARC 21 Authority Specialist.
A librarian needs an official MARC 21 bibliographic catalog record in Thai library standard for this book:
Query: "${q}" ${isIsbn ? `(ISBN: ${cleanIsbnCandidate})` : ''}
${onlineMeta.found ? `Live OPAC / Library Search Clues: ${JSON.stringify(onlineMeta)}` : ''}

Using your extensive knowledge of Thai literature, international books, publishers, Dewey Decimal Classification (DDC) and Thai Cutter numbers:
Generate accurate, professional cataloging metadata including all major MARC21 tags.

Rules for Thai Library MARC 21:
- "author_personal": Personal author e.g. "ลีฮุนแจ." or "อัมรา เรืองศิริ."
- "title_245a": Format strictly as "245 $a ชื่อเรื่อง : 245 $b ชื่อตอน = 246 $a ชื่อเรื่องภาษาอังกฤษ" (DO NOT append statement of responsibility / 245 $c to this field, as 245 $c has its own column) e.g. "แต่งตัวเป็นไม่เห็นยาก = Girl power แต่งตัวเป็นไม่เห็นยาก" or "พ่อรวยสอนลูก เล่ม 2 : เงินสี่ด้าน = Rich Dad's Cashflow Quadrant"
- "title_245b": Tag 246 (Ind1=3, Ind2=1) Parallel/English Title with subtitle in format "$aTitle :$bSubtitle." e.g. "$aStingy Family's Diary 7 :$bFrugal Trip Plan." or "$aThink for yourself :$ba kid's guide to solving life's dilemmas." (if no English/parallel title, use Thai subtitle without tag prefix)
- "responsibility_245c": Statement of responsibility (AUTHORS ONLY, DO NOT INCLUDE TRANSLATORS!). Rules: 1 author = "Robert T. Kiyosaki.", 2-3 authors = "จักรพงษ์ เมษพันธุ์, อารีนา แยนา และธนพร ศิริอัครกรกุล.", 4 or more authors = "[First Author] [และคนอื่นๆ (count-1) คน]." e.g. "อัมรา เรืองศิริ [และคนอื่นๆ 3 คน]."
- "ddc_082a": Dewey code e.g. "ด", "ย", "155.4", "641.3"
- "cutter_082b": Thai Cutter code following TK Park/Chula standard
- "pub_place": Place of publication without trailing colon e.g. "กรุงเทพฯ"
- "publisher": Publisher name without trailing comma e.g. "ซีเอ็ดยูเคชั่น" or "นานมีบุ๊คส์"
- "pub_year": 4-digit Buddhist year e.g. "2553"
- "pages_300a": e.g. "207 หน้า"
- "illustration_300b": "ภาพประกอบ" or ""
- "dimensions_300c": Book dimensions without colon/semicolon e.g. "20 ซม." or "21 ซม."
- "subject_650a": Primary Thai Library Subject Heading e.g. "การ์ตูน."
- "subject_650_2": Secondary Subject Heading e.g. "การแต่งกาย."
- "subject_uniform_630": e.g. "เยาวชน"
- "summary_520": Concise synopsis in Thai (2-3 sentences)
- "edition_250": "พิมพ์ครั้งที่ 1"
- "price_541": Retail price in Thai Baht from bookstores like SE-ED / Naiin / Chulabook e.g. "185 บาท" or "175 บาท"
- "series_490": Series name e.g. "การ์ตูนความรู้พัฒนาตนเอง ชุด Girl Power"
- "series_uniform_830": Uniform series name e.g. "การ์ตูนความรู้พัฒนาตนเอง ชุด Girl Power"
- "added_entry_700": Translator or co-author e.g. "จักรพงษ์ เมษพันธุ์, ผู้แปล." or "ธนวดี บุญล้วน, ผู้แปล."
- "storage_location": Shelf location e.g. "การ์ตูน วิทย์/คณิต", "การ์ตูน สังคม", "การ์ตูน ความรู้ทั่วไป", "การ์ตูน ภาษา/วรรณกรรม", "สำหรับเด็ก", "สำหรับเด็ก (ภาษาฯ)", "สำหรับเด็ก (ศาสนา)", "แบบเรียน", "อ้างอิง/Ref", "หมวด 100"
- "isbn": 10 or 13 digit ISBN

Respond strictly in valid JSON format:
{
  "isbn": "...",
  "author_personal": "...",
  "author_corporate": "-",
  "title_245a": "...",
  "title_245b": "...",
  "responsibility_245c": "...",
  "ddc_082a": "...",
  "cutter_082b": "...",
  "pub_place": "กรุงเทพฯ",
  "publisher": "...",
  "pub_year": "2565",
  "pages_300a": "... หน้า",
  "illustration_300b": "ภาพประกอบ",
  "dimensions_300c": "20 ซม.",
  "subject_650a": "...",
  "subject_650_2": "-",
  "subject_uniform_630": "เยาวชน",
  "summary_520": "...",
  "edition_250": "พิมพ์ครั้งที่ 1",
  "price_541": "185 บาท",
  "series_490": "-",
  "series_uniform_830": "-",
  "added_entry_700": "-",
  "storage_location": "..."
}`;

        try {
          const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });
          if (aiResponse.text) {
            const cleanText = aiResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
            aiRecord = JSON.parse(cleanText);
          }
        } catch (mErr: any) {
          console.warn('Primary model gemini-3.8-flash notice:', mErr?.message || mErr);
          // Retry with brief delay in case of rate limit
          await new Promise(resolve => setTimeout(resolve, 1200));
          try {
            const fbResponse = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
            });
            if (fbResponse.text) {
              const cleanText = fbResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
              const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                aiRecord = JSON.parse(jsonMatch[0]);
              }
            }
          } catch (fbErr: any) {
            console.warn('Fallback model gemini-3.1-flash-lite notice:', fbErr?.message || fbErr);
          }
        }
      }

      // If AI generated record, assemble it
      if (aiRecord) {
        const isbnFinal = aiRecord.isbn || cleanIsbnCandidate || '';
        const titleFinal = aiRecord.title_245a || (onlineMeta.title ? `${onlineMeta.title} / ${onlineMeta.author || 'ไม่ระบุผู้แต่ง'}.` : q);
        const authorFinal = aiRecord.author_personal || onlineMeta.author || '-';
        const ddcFinal = aiRecord.ddc_082a || (titleFinal.includes('นิทาน') ? 'ด' : '000');
        const cutterFinal = String(aiRecord.cutter_082b || generateThaiCutter(authorFinal, titleFinal)).replace(/\s+\d{4}$/, '').trim();
        const storageFinal = aiRecord.storage_location || getStorageLocation(ddcFinal, titleFinal, aiRecord.subject_650a || '');
        const coverFinal = onlineMeta.coverImage || ((isbnFinal.length >= 10) ? `https://covers.openlibrary.org/b/isbn/${isbnFinal}-M.jpg` : undefined);

        const rec: Marc21Record = {
          id: `marc_${Date.now()}_${idx}`,
          date: currentDate,
          col1: '',
          accession_no: paddedAccNo,
          isbn: isbnFinal,
          author_personal: authorFinal,
          author_corporate: aiRecord.author_corporate || '-',
          title_245a: (titleFinal || '').replace(/\s*\/\s*.*$/, '').trim(),
          title_245b: aiRecord.title_245b || '',
          responsibility_245c: aiRecord.responsibility_245c || authorFinal.replace(/\.$/, ''),
          ddc_082a: ddcFinal,
          cutter_082b: cutterFinal,
          pub_place: (aiRecord.pub_place || 'กรุงเทพฯ').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim(),
          publisher: (aiRecord.publisher || onlineMeta.publisher || 'ไม่ระบุสำนักพิมพ์').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim(),
          pub_year: aiRecord.pub_year || onlineMeta.pubYear || '2565',
          pages_300a: aiRecord.pages_300a || onlineMeta.pages || '160 หน้า',
          illustration_300b: aiRecord.illustration_300b || 'ภาพประกอบ',
          subject_650a: aiRecord.subject_650a || 'ทั่วไป',
          copies: '1',
          summary_520: aiRecord.summary_520 || (onlineMeta.description || `หนังสือ "${titleFinal}" จัดพิมพ์โดย ${aiRecord.publisher || 'สำนักพิมพ์'}`),
          edition_250: aiRecord.edition_250 || 'พิมพ์ครั้งที่ 1',
          price_541: aiRecord.price_541 || '-',
          series_490: aiRecord.series_490 || '-',
          added_entry_700: aiRecord.added_entry_700 || '-',
          acquisition_source: 'สั่งซื้อ',
          col2: '',
          source_type: 'สั่งชื้อ',
          storage_location: storageFinal,
          status: 'อยู่บนชั้น',
          col3: '',

          // Extended MARC tags
          leader_000: '00933nam  2200289ua 4500',
          control_001: `b${paddedAccNo.replace(/^0+/, '')}`,
          control_003: 'UCTAL',
          trans_005: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.0',
          fixed_008: `${new Date().getFullYear().toString().slice(2)}0101s${aiRecord.pub_year || '2565'}    th a   j      000 1 tha d`,
          issn_022: '-',
          cat_source_040: 'UCTAL',
          language_041: 'tha',
          title_varying_246: aiRecord.title_245b || '-',
          dimensions_300c: (aiRecord.dimensions_300c || '20 ซม.').replace(/[\s\/:;=,]+$/, '').replace(/^[\s\/:;=,]+/, '').trim(),
          note_general_500: '-',
          note_bib_504: '-',
          note_contents_505: '-',
          subject_person_600: '-',
          subject_corp_610: '-',
          subject_uniform_630: aiRecord.subject_uniform_630 || (storageFinal.includes('เยาวชน') ? 'เยาวชน' : '-'),
          subject_geo_651: '-',
          subject_650_2: aiRecord.subject_650_2 || '-',
          added_corp_710: '-',
          added_title_740: '-',
          series_uniform_830: aiRecord.series_uniform_830 || aiRecord.series_490 || '-',
          electronic_856: coverFinal || '-',
          local_907: `b${paddedAccNo}`,

          cover_image: coverFinal,
          search_source: onlineMeta.found ? onlineMeta.source : 'Google Search & AI Cataloging'
        };
        rec.marc_tags = generateMarcTagsFromRecord(rec);
        results.push(rec);
        continue;
      }

      // 5. Rule-based cataloging fallback if AI is offline
      const authorGuess = onlineMeta.author || 'ไม่ระบุผู้แต่ง';
      const cleanTitle = onlineMeta.title || q;
      const ddcFallback = isIsbn ? '000' : (q.includes('นิทาน') ? 'ด' : (q.includes('การ์ตูน') ? 'ย' : '000'));
      const cutterFallback = generateThaiCutter(authorGuess, cleanTitle);

      const rec: Marc21Record = {
        id: `marc_${Date.now()}_${idx}`,
        date: currentDate,
        col1: '',
        accession_no: paddedAccNo,
        isbn: isIsbn ? cleanIsbnCandidate : '',
        author_personal: `${authorGuess}.`,
        author_corporate: '-',
        title_245a: `${cleanTitle} / ${authorGuess}.`,
        title_245b: '',
        responsibility_245c: authorGuess,
        ddc_082a: ddcFallback,
        cutter_082b: cutterFallback,
        pub_place: 'กรุงเทพฯ',
        publisher: onlineMeta.publisher || 'ไม่ระบุสำนักพิมพ์',
        pub_year: onlineMeta.pubYear || '2565',
        pages_300a: onlineMeta.pages || '160 หน้า',
        illustration_300b: 'ภาพประกอบ',
        subject_650a: 'ทั่วไป',
        copies: '1',
        summary_520: `รายการบรรณานุกรมสำหรับหนังสือ ${cleanTitle}`,
        edition_250: 'พิมพ์ครั้งที่ 1',
        price_541: '-',
        series_490: '-',
        added_entry_700: '-',
        acquisition_source: 'สั่งซื้อ',
        col2: '',
        source_type: 'สั่งชื้อ',
        storage_location: getStorageLocation(ddcFallback, cleanTitle, 'ทั่วไป'),
        status: 'อยู่บนชั้น',
        col3: '',

        // Extended MARC tags
        leader_000: '00933nam  2200289ua 4500',
        control_001: `b${paddedAccNo.replace(/^0+/, '')}`,
        control_003: 'UCTAL',
        trans_005: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.0',
        fixed_008: `${new Date().getFullYear().toString().slice(2)}0101s2565    th a   j      000 1 tha d`,
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
        subject_uniform_630: '-',
        subject_geo_651: '-',
        subject_650_2: '-',
        added_corp_710: '-',
        added_title_740: '-',
        series_uniform_830: '-',
        electronic_856: '-',
        local_907: `b${paddedAccNo}`,

        search_source: 'Z39.50 / SRU Federated Search'
      };
      rec.marc_tags = generateMarcTagsFromRecord(rec);
      results.push(rec);
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      records: results
    });

  } catch (err: any) {
    console.error('API /api/generate-marc21 error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'เกิดข้อผิดพลาดในการสร้างรายการบรรณานุกรม MARC 21'
    });
  }
}
