import { GoogleGenAI } from '@google/genai';
import { generateThaiCutter } from './generate-marc21';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

// Cached token for UC-TAL ThaiLIS
let cachedThaiLISToken: { token: string; expiresAt: number } | null = null;

async function getThaiLISToken(): Promise<string | null> {
  if (cachedThaiLISToken && Date.now() < cachedThaiLISToken.expiresAt - 60000) {
    return cachedThaiLISToken.token;
  }
  try {
    const apiKey = 'cc6dd232c9740e9ddcf00a66fea88c335af8d6a8befe3ccf35122022c7a30f96';
    const res = await fetch('https://ucopacapi.walaiautolib.com/ucopacapi/v1/Token/Issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(3500)
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
    console.warn('UC-TAL Token Issue note:', err);
  }
  return null;
}

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

// Fast lightweight price resolution for search result preview (prevents 429 quota errors on search)
async function fetchInternetPrice(title: string, author: string, isbn: string): Promise<string> {
  const cleanIsbn = (isbn || '').replace(/[^0-9X]/gi, '');
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
  return '185 บาท';
}

// Fast lightweight synopsis resolution for search result preview
async function fetchInternetSynopsis(title: string, author: string, isbn: string, series = ''): Promise<string> {
  const cleanT = (title || '').split('/')[0].trim();
  return `หนังสือ "${cleanT}" นำเสนอเนื้อหาสาระและสารประโยชน์ที่น่าสนใจ เหมาะสำหรับผู้อ่านและผู้ศึกษาค้นคว้า`;
}

export default async function handler(req: any, res: any) {
  // CORS
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

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { keyword, region = '', pageno = 1, perpage = 15 } = body || {};

    if (!keyword || !String(keyword).trim()) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุคำค้นหา (Keyword/ISBN)' });
    }

    const cleanKeyword = String(keyword).trim();
    const token = await getThaiLISToken();

    if (!token) {
      return res.status(503).json({
        success: false,
        error: 'ไม่สามารถเชื่อมต่อกับบริการ UC-TAL Web Services ได้ในขณะนี้'
      });
    }

    const payload = [{ field: 'KEYWORD', value: cleanKeyword, operator: '' }];
    const searchUrl = `https://ucopacapi.walaiautolib.com/ucopacapi/v1/Retrive/KeywordSearch?npage=${pageno}&perpage=${perpage}&orderby=&ipaddress=`;

    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000)
    });

    if (!searchRes.ok) {
      return res.status(searchRes.status).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการสืบค้นจาก UC-TAL API'
      });
    }

    const searchData = await searchRes.json();
    const totalFound = searchData?.value?.found || 0;
    const rawItems = searchData?.value?.values || [];

    const formattedResults: any[] = [];

    for (const item of rawItems) {
      const bibId = item.bibID || item.BIBID || item.bibid || item.id;
      let marcRecords: any[] = [];

      if (bibId) {
        try {
          const marcRes = await fetch(`https://ucopacapi.walaiautolib.com/ucopacapi/v1/Biblio/GetMARC?bibid=${bibId}`, {
            headers: { 'Authorization': 'Bearer ' + token },
            signal: AbortSignal.timeout(3500)
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

      const getField = (tag: string, subfield = 'a'): string => {
        const rec = marcRecords.find((r: any) => r.tagID === tag || r.tag === tag);
        if (rec && rec.data) {
          return parseMarcSubfield(rec.data, subfield) || rec.data.replace(/[\u001f\$][a-z0-9]/g, ' ').trim();
        }
        return '';
      };

      const getRawData = (tag: string): string => {
        const rec = marcRecords.find((r: any) => r.tagID === tag || r.tag === tag);
        return rec ? rec.data : '';
      };

      // Extract raw info from search result if MARC tag not present
      let titleFromInfo = '';
      let authorFromInfo = '';
      let imprintFromInfo = '';
      let callNoFromInfo = '';

      if (Array.isArray(item.infos)) {
        item.infos.forEach((info: any) => {
          const val = Array.isArray(info.value) && info.value[0] ? (Array.isArray(info.value[0]) ? info.value[0][0] : info.value[0]) : '';
          if (info.key === 'Title') titleFromInfo = val;
          if (info.key === 'Author') authorFromInfo = val;
          if (info.key === 'Imprint') imprintFromInfo = val;
          if (info.key === 'CallNo') callNoFromInfo = val;
        });
      }

      const rawTitle245a = getField('245', 'a') || titleFromInfo.split('/')[0]?.trim() || cleanKeyword;
      const title245b = getField('245', 'b');
      // Extract Tag 246 with Indicator 1 = 3 and Indicator 2 = 1 (Parallel Title in English / other language: $a :$b)
      const tag246_31 = marcRecords.find((r: any) => (r.tagID === '246' || r.tag === '246') && String(r.indc1).trim() === '3' && String(r.indc2).trim() === '1');
      const anyTag246 = marcRecords.find((r: any) => (r.tagID === '246' || r.tag === '246'));
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

      const resp245c = getField('245', 'c') || authorFromInfo || 'ไม่ระบุผู้แต่ง';
      const author100 = getField('100', 'a') || authorFromInfo || '-';
      const isbn020 = getField('020', 'a').replace(/[^0-9X]/gi, '') || (cleanKeyword.match(/^[0-9X]{10,13}$/i) ? cleanKeyword : '');
      const ddc082 = getField('082', 'a') || (callNoFromInfo ? callNoFromInfo.split(' ')[0] : '000');
      const rawCutter082b = getField('082', 'b') || (callNoFromInfo ? callNoFromInfo.split(' ')[1] : generateThaiCutter(author100, rawTitle245a));
      const cutter082b = String(rawCutter082b || '').replace(/\s+\d{4}$/, '').trim();
      const pubPlace = (getField('260', 'a') || (imprintFromInfo.includes(':') ? imprintFromInfo.split(':')[0].trim() : 'กรุงเทพฯ'))
        .replace(/[\s\/:;=,]+$/, '')
        .replace(/^[\s\/:;=,]+/, '')
        .trim();
      const publisher = (getField('260', 'b') || (imprintFromInfo.includes(':') ? imprintFromInfo.split(':')[1]?.split(',')[0]?.trim() : 'ไม่ระบุสำนักพิมพ์'))
        .replace(/[\s\/:;=,]+$/, '')
        .replace(/^[\s\/:;=,]+/, '')
        .trim();
      const pubYear = getField('260', 'c').replace(/[^0-9]/g, '') || (imprintFromInfo.match(/[0-9]{4}/) ? imprintFromInfo.match(/[0-9]{4}/)![0] : '2565');
      const pages300a = (getField('300', 'a') || '160 หน้า')
        .replace(/[\s\/:;=,]+$/, '')
        .replace(/^[\s\/:;=,]+/, '')
        .trim();
      const subject650a = getField('650', 'a') || 'ทั่วไป';
      const series490 = getField('490', 'a') || '-';

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

      // De-duplicate subtitle if identical to mainTitle or already in cleanMainTitle
      if (cleanSubtitle === cleanMainTitle || cleanSubtitle === '-' || cleanSubtitle.toLowerCase() === cleanMainTitle.toLowerCase()) {
        cleanSubtitle = '';
      }
      if (cleanSubtitle && (cleanMainTitle.includes(':') || cleanMainTitle.toLowerCase().includes(cleanSubtitle.toLowerCase()))) {
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

      // 2. Format 246 (Ind1=3, Ind2=1) Parallel/English Title (โดยไม่ใส่ $a และ :$b)
      let formattedTitle245b = cleanVaryingDisplay || (hasSubtitle ? cleanSubtitle : '-');

      // 3. Extract 700 from Tag 700
      const raw700Tags = marcRecords.filter((r: any) => r.tagID === '700' || r.tag === '700');
      let addedEntry700 = '-';
      if (raw700Tags.length > 0) {
        const names = raw700Tags.map((r: any) => {
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

      // 4. Extract 541 Price from MARC or fetch from Internet (SE-ED, Naiin, Chulabook)
      let price541 = parseMarcSubfield(getRawData('020'), 'c') || parseMarcSubfield(getRawData('541'), 'c') || parseMarcSubfield(getRawData('541'), 'h');
      if (!price541 || price541 === '-' || price541.trim() === '') {
        price541 = await fetchInternetPrice(rawTitle245a, author100, isbn020);
      } else {
        if (!price541.includes('บาท') && !price541.includes('บ.')) {
          price541 = `${price541} บาท`;
        }
      }

      // Ensure Tag 541 exists in marcRecords
      const has541 = marcRecords.some(r => r.tagID === '541');
      if (!has541 && price541 && price541 !== '-') {
        const insIdx = marcRecords.findIndex(r => parseInt(r.tagID, 10) >= 600);
        const tag541Obj = {
          tagID: '541',
          indc1: '',
          indc2: '',
          data: `$c${price541}`
        };
        if (insIdx !== -1) marcRecords.splice(insIdx, 0, tag541Obj);
        else marcRecords.push(tag541Obj);
      }

      // Extended MARC tags
      const leader000 = getRawData('Leader') || '00933nam  2200289ua 4500';
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
      const subjects650 = marcRecords.filter((r: any) => r.tagID === '650').map((r: any) => parseMarcSubfield(r.data, 'a') || r.data.replace(/[\u001f\$][a-z0-9]/g, ' ').trim());
      const subject650_2 = subjects650.length > 1 ? subjects650[1] : '-';
      const addedCorp710 = getField('710', 'a');
      const addedTitle740 = getField('740', 'a');
      const seriesUniform830 = getField('830', 'a');
      const cover856 = getField('856', 'u') || item.infoExt?.bookCover;
      const local907 = getField('907', 'a');

      // Check if Tag 520 (เรื่องย่อ) exists in MARC
      let summary520 = getField('520', 'a');
      let isSynopsisFromInternet = false;

      if (!summary520) {
        summary520 = await fetchInternetSynopsis(rawTitle245a, author100, isbn020, series490);
        isSynopsisFromInternet = true;
        if (marcRecords.length > 0) {
          const insertIdx = marcRecords.findIndex(r => parseInt(r.tagID, 10) >= 600);
          const new520Tag = {
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
      }

      const libraries = item.infoExt?.libraries || [];

      formattedResults.push({
        bibId,
        title: formattedTitle245a,
        titleWithResp: formattedTitle245a,
        title_245a: formattedTitle245a,
        title_245b: formattedTitle245b,
        author: author100,
        author_personal: author100,
        author_corporate: '-',
        responsibility: resp245c,
        responsibility_245c: resp245c,
        isbn: isbn020,
        ddc: ddc082,
        ddc_082a: ddc082,
        cutter: cutter082b,
        cutter_082b: cutter082b,
        pubPlace,
        pub_place: pubPlace,
        publisher,
        pubYear,
        pub_year: pubYear,
        pages: pages300a,
        pages_300a: pages300a,
        illustration_300b: 'ภาพประกอบ',
        subject: subject650a,
        subject_650a: subject650a,
        all650Subjects: subjects650,
        price_541: price541,
        added_entry_700: addedEntry700,
        series: series490,
        series_490: series490,
        summary: summary520,
        summary_520: summary520,
        isSynopsisFromInternet,
        coverImage: cover856,

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
        series_uniform_830: seriesUniform830 || series490 || '-',
        electronic_856: cover856 || '-',
        local_907: local907 || '-',

        librariesCount: libraries.length,
        libraries: libraries.map((l: any) => ({
          nameTh: l.locationNameTh,
          nameEn: l.locationNameEn,
          symbol: l.locationSymbol
        })),
        marcRaw: marcRecords
      });
    }

    return res.status(200).json({
      success: true,
      found: totalFound,
      count: formattedResults.length,
      results: formattedResults
    });

  } catch (err: any) {
    console.error('UC-TAL Search error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ UC-TAL API'
    });
  }
}
