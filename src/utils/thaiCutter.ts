// Official Thai Author Cutter Table Standard (ตารางการให้เลขคัตเตอร์ผู้แต่งภาษาไทย: TK Park, จุฬาฯ, มอ. - สูตรมาตรฐานเลข 4 หลัก)

export const consonantTable: Record<string, number> = {
  'ก': 1, 'ข': 1, 'ค': 1, 'ฆ': 1,
  'ง': 2, 'จ': 2, 'ฉ': 2, 'ช': 2, 'ซ': 2, 'ฌ': 2,
  'ญ': 3, 'ฎ': 3, 'ฏ': 3, 'ฐ': 3, 'ฑ': 3, 'ฒ': 3,
  'ณ': 4, 'ด': 4, 'ต': 4, 'ถ': 4, 'ท': 4, 'ธ': 4,
  'น': 5, 'บ': 5, 'ป': 5, 'ผ': 5, 'ฝ': 5,
  'พ': 6, 'ฟ': 6, 'ภ': 6, 'ม': 6, 'ย': 6,
  'ร': 7, 'ล': 7, 'ว': 7,
  'ศ': 8, 'ษ': 8, 'ส': 8,
  'ห': 9, 'ฬ': 9, 'อ': 9, 'ฮ': 9,
  'ฤ': 1, 'ฦ': 1
};

export const vowelTable: Record<string, number> = {
  'ะ': 1, 'ั': 1,
  'า': 2, 'ำ': 2,
  'ิ': 3, 'ี': 3, 'ึ': 3, 'ื': 3,
  'ุ': 4, 'ู': 4,
  'เ': 5,
  'แ': 8, 'โ': 8,
  'ใ': 9, 'ไ': 9
};

export const frontVowels = ['เ', 'แ', 'โ', 'ใ', 'ไ'];

/**
 * คำนวณเลขประจำหนังสือ (Thai Author Cutter) ตามสูตรตารางเทียบมาตรฐาน 4 หลัก
 * แปลงรหัสพยัญชนะและสระของผู้แต่งเป็นตัวเลข 4 หลัก + ตัวอักษรระบุชื่อเรื่อง
 * เช่น:
 * กอมโดริ + เอาชีวิตรอด -> ก9684อ
 * ว.วชิรเมธี + ธรรมะ -> ว7237ธ
 * สุนทรภู่ + พระอภัยมณี -> ส4547พ
 * ชาติ กอบจิตติ + การทดลอง -> ช2431ก
 */
export function generateThaiCutter(author: string, title: string, existingCutters?: Set<string>): string {
  let cleanAuthor = (author || '').trim();
  cleanAuthor = cleanAuthor.replace(/^(นาย|นาง|นางสาว|ดร\.|ศ\.|รศ\.|ผศ\.|หม่อม|ม\.ร\.ว\.|ม\.ล\.|อาจารย์|พี่|ป้า|น้า|ลุง|ครู)/g, '').trim();

  // Extract ALL Thai/English characters, SKIPPING punctuation, spaces, periods
  const chars = cleanAuthor.replace(/[^\u0E00-\u0E7Fa-zA-Z]/g, '').split('');

  let targetChars = chars;
  if (targetChars.length === 0) {
    const cleanT = (title || '').replace(/^[0-9\s"“'‘\(\[\{]+/g, '').replace(/[^\u0E00-\u0E7Fa-zA-Z]/g, '');
    targetChars = cleanT.split('');
  }

  if (targetChars.length === 0) return 'ม1000ก';

  let initialChar = '';
  const digitsArray: number[] = [];

  const c0 = targetChars[0] || '';
  let startIndex = 1;

  if (frontVowels.includes(c0)) {
    initialChar = targetChars[1] || 'ก';
    const frontVowelCode = vowelTable[c0] || 5;
    digitsArray.push(frontVowelCode);
    startIndex = 2;
  } else {
    initialChar = c0;
    startIndex = 1;
  }

  for (let i = startIndex; i < targetChars.length && digitsArray.length < 4; i++) {
    const ch = targetChars[i];
    if (ch === '์' || ch === '็' || ch === '่' || ch === '้' || ch === '๊' || ch === '๋') continue; // tone marks
    const code = vowelTable[ch] !== undefined ? vowelTable[ch] : consonantTable[ch];
    if (code !== undefined) {
      digitsArray.push(code);
    }
  }

  // Pad to exactly 4 digits if needed
  while (digitsArray.length < 4) {
    if (digitsArray.length === 0) digitsArray.push(1);
    else if (digitsArray.length === 1) digitsArray.push(1);
    else if (digitsArray.length === 2) digitsArray.push(0);
    else digitsArray.push(0);
  }

  const digits = digitsArray.slice(0, 4).join('');

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
    let idx = startIndex + 3;

    while (existingCutters.has(`${initialChar}${currDigits}${titleInitial}`) && idx < targetChars.length) {
      const nextChar = targetChars[idx];
      const nextCode = vowelTable[nextChar] !== undefined ? vowelTable[nextChar] : consonantTable[nextChar] || 1;
      currDigits += String(nextCode);
      idx++;
    }
    candidate = `${initialChar}${currDigits}${titleInitial}`;
  }

  return candidate;
}
