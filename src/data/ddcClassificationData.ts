export interface DdcSection {
  code: string;
  nameTh: string;
  nameEn?: string;
  description?: string;
}

export interface DdcDivision {
  code: string;
  nameTh: string;
  nameEn?: string;
  sections: DdcSection[];
}

export interface DdcMainClass {
  code: string; // e.g. "000", "100", ... "900"
  range: string; // e.g. "000 - 099"
  nameTh: string;
  nameEn: string;
  icon: string;
  color: string; // Tailwind color theme
  divisions: DdcDivision[];
}

export const DDC_MAIN_CLASSES: DdcMainClass[] = [
  {
    code: '000',
    range: '000 - 099',
    nameTh: 'คอมพิวเตอร์ ความรู้ทั่วไป และสารสนเทศ',
    nameEn: 'Computer Science, Information & General Works',
    icon: '💻',
    color: 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold',
    divisions: [
      {
        code: '000',
        nameTh: 'วิทยาการคอมพิวเตอร์ ความรู้ทั่วไป',
        nameEn: 'Computer Science, Knowledge & Systems',
        sections: [
          { code: '000', nameTh: 'วิทยาการคอมพิวเตอร์และความรู้ทั่วไป', nameEn: 'Computer Science & Generalities' },
          { code: '001', nameTh: 'ความรู้ทั่วไป วิจัย และทฤษฎีระบบ', nameEn: 'Knowledge, Research & System Theory' },
          { code: '002', nameTh: 'หนังสือและวรรณกรรมทั่วไป', nameEn: 'The Book & Reading' },
          { code: '003', nameTh: 'ระบบงาน และแบบจำลอง', nameEn: 'Systems & Computer Models' },
          { code: '004', nameTh: 'การประมวลผลข้อมูล และวิทยาการคอมพิวเตอร์ (Hardware / Networks)', nameEn: 'Data Processing & Computer Science' },
          { code: '005', nameTh: 'การโปรแกรมคอมพิวเตอร์ ซอฟต์แวร์ และข้อมูล (Programming & Software)', nameEn: 'Computer Programming, Programs & Data' },
          { code: '006', nameTh: 'วิธีการพิเศษทางคอมพิวเตอร์ (AI, Graphics, Virtual Reality, Multimedia)', nameEn: 'Special Computer Methods (AI, Graphics, VR)' },
          { code: '007', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '008', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '009', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      },
      {
        code: '010',
        nameTh: 'บรรณานุกรม',
        nameEn: 'Bibliographies',
        sections: [
          { code: '010', nameTh: 'บรรณานุกรมทั่วไป', nameEn: 'Bibliographies' },
          { code: '011', nameTh: 'บรรณานุกรมประเภทต่างๆ', nameEn: 'Bibliographies of Types of Works' },
          { code: '012', nameTh: 'บรรณานุกรมบุคคล', nameEn: 'Bibliographies of Individuals' },
          { code: '013', nameTh: 'บรรณานุกรมผลงานของผู้เขียนเฉพาะกลุ่ม', nameEn: 'Bibliographies of Specific Authors' },
          { code: '014', nameTh: 'บรรณานุกรมหนังสือไม่ระบุชื่อผู้แต่ง', nameEn: 'Bibliographies of Anonymous Works' },
          { code: '015', nameTh: 'บรรณานุกรมสิ่งพิมพ์แห่งชาติ', nameEn: 'Bibliographies of Works from Specific Places' },
          { code: '016', nameTh: 'บรรณานุกรมวิชาเฉพาะ', nameEn: 'Bibliographies of Works on Specific Subjects' },
          { code: '017', nameTh: 'บรรณานุกรมรวมของห้องสมุด', nameEn: 'General Subject Catalogs' },
          { code: '018', nameTh: 'บรรณานุกรมเรียงตามผู้แต่ง', nameEn: 'Catalogs Arranged by Author' },
          { code: '019', nameTh: 'บรรณานุกรมเรียงตามชื่อเรื่อง', nameEn: 'Dictionary Catalogs' },
        ]
      },
      {
        code: '020',
        nameTh: 'บรรณารักษศาสตร์และสารสนเทศศาสตร์',
        nameEn: 'Library & Information Sciences',
        sections: [
          { code: '020', nameTh: 'บรรณารักษศาสตร์และสารสนเทศศาสตร์', nameEn: 'Library & Information Science' },
          { code: '021', nameTh: 'ความสัมพันธ์ของห้องสมุดกับชุมชน', nameEn: 'Library Relationships & Cooperation' },
          { code: '022', nameTh: 'อาคาร สิ่งก่อสร้าง และอุปกรณ์ห้องสมุด', nameEn: 'Library Physical Plant & Equipment' },
          { code: '023', nameTh: 'การบริหารงานบุคคลและบุคลากรห้องสมุด', nameEn: 'Personnel Administration' },
          { code: '024', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '025', nameTh: 'การดำเนินงานห้องสมุด (การจัดหมวดหมู่, ทำบัตรรายการ, ยืม-คืน)', nameEn: 'Library Operations (Cataloging, MARC 21)' },
          { code: '026', nameTh: 'ห้องสมุดเฉพาะ', nameEn: 'Specific Subject Libraries' },
          { code: '027', nameTh: 'ห้องสมุดทั่วไป (ห้องสมุดประชาชน, โรงเรียน, มหาวิทยาลัย)', nameEn: 'General Libraries (Public, School, Academic)' },
          { code: '028', nameTh: 'การอ่านและการใช้วิธีการบันทึกข้อมูลอื่น', nameEn: 'Reading & Use of Other Information Media' },
          { code: '029', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      },
      {
        code: '030',
        nameTh: 'สารานุกรมทั่วไป',
        nameEn: 'General Encyclopedic Works',
        sections: [
          { code: '030', nameTh: 'สารานุกรมทั่วไป', nameEn: 'General Encyclopedic Works' },
          { code: '031', nameTh: 'สารานุกรมภาษาอเมริกัน', nameEn: 'American General Encyclopedias' },
          { code: '032', nameTh: 'สารานุกรมภาษาอังกฤษ', nameEn: 'English General Encyclopedias' },
          { code: '033', nameTh: 'สารานุกรมภาษาเยอรมัน', nameEn: 'German General Encyclopedias' },
          { code: '034', nameTh: 'สารานุกรมภาษาฝรั่งเศส', nameEn: 'French General Encyclopedias' },
          { code: '035', nameTh: 'สารานุกรมภาษาอิตาลี', nameEn: 'Italian General Encyclopedias' },
          { code: '036', nameTh: 'สารานุกรมภาษาสเปน', nameEn: 'Spanish General Encyclopedias' },
          { code: '037', nameTh: 'สารานุกรมภาษารัสเซีย', nameEn: 'Russian General Encyclopedias' },
          { code: '038', nameTh: 'สารานุกรมภาษาอื่นๆ', nameEn: 'Encyclopedias in Other Languages' },
          { code: '039', nameTh: 'สารานุกรมภาษาไทยและภาษาเอเชีย', nameEn: 'Thai & Asian Encyclopedias' },
        ]
      },
      {
        code: '040',
        nameTh: 'ว่าง (เลิกใช้)',
        nameEn: 'Unassigned (Former Essays)',
        sections: [
          { code: '040', nameTh: 'ว่าง (เลิกใช้)', nameEn: 'Unassigned' },
          { code: '041', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '042', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '043', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '044', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '045', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '046', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '047', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '048', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '049', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      },
      {
        code: '050',
        nameTh: 'วารสาร สิ่งพิมพ์ต่อเนื่อง',
        nameEn: 'General Serial Publications',
        sections: [
          { code: '050', nameTh: 'วารสารและสิ่งพิมพ์ต่อเนื่องทั่วไป', nameEn: 'General Serials & Periodicals' },
          { code: '051', nameTh: 'วารสารภาษาอเมริกัน', nameEn: 'American Serials' },
          { code: '052', nameTh: 'วารสารภาษาอังกฤษ', nameEn: 'English Serials' },
          { code: '053', nameTh: 'วารสารภาษาเยอรมัน', nameEn: 'German Serials' },
          { code: '054', nameTh: 'วารสารภาษาฝรั่งเศส', nameEn: 'French Serials' },
          { code: '055', nameTh: 'วารสารภาษาอิตาลี', nameEn: 'Italian Serials' },
          { code: '056', nameTh: 'วารสารภาษาสเปน', nameEn: 'Spanish Serials' },
          { code: '057', nameTh: 'วารสารภาษารัสเซีย', nameEn: 'Russian Serials' },
          { code: '058', nameTh: 'วารสารภาษาอื่นๆ', nameEn: 'Serials in Other Languages' },
          { code: '059', nameTh: 'วารสารภาษาไทยและภาษาเอเชีย', nameEn: 'Thai & Asian Serials' },
        ]
      },
      {
        code: '060',
        nameTh: 'องค์การ สมาคม พิพิธภัณฑ์',
        nameEn: 'General Organizations & Museum Science',
        sections: [
          { code: '060', nameTh: 'องค์การ สมาคม และสถาบันทั่วไป', nameEn: 'General Organizations & Associations' },
          { code: '061', nameTh: 'องค์การและสมาคมในอเมริกาเหนือ', nameEn: 'Organizations in North America' },
          { code: '062', nameTh: 'องค์การและสมาคมในอังกฤษ', nameEn: 'Organizations in British Isles' },
          { code: '063', nameTh: 'องค์การและสมาคมในเยอรมนี', nameEn: 'Organizations in Germany' },
          { code: '064', nameTh: 'องค์การและสมาคมในฝรั่งเศส', nameEn: 'Organizations in France' },
          { code: '065', nameTh: 'องค์การและสมาคมในอิตาลี', nameEn: 'Organizations in Italy' },
          { code: '066', nameTh: 'องค์การและสมาคมในสเปน', nameEn: 'Organizations in Spain' },
          { code: '067', nameTh: 'องค์การและสมาคมในรัสเซีย', nameEn: 'Organizations in Russia' },
          { code: '068', nameTh: 'องค์การและสมาคมในประเทศอื่นๆ (ไทย/เอเชีย)', nameEn: 'Organizations in Other Areas' },
          { code: '069', nameTh: 'พิพิธภัณฑสถานวิทยา (Museology)', nameEn: 'Museology (Museum Science)' },
        ]
      },
      {
        code: '070',
        nameTh: 'สื่อสารมวลชน วารสารศาสตร์ และการพิมพ์',
        nameEn: 'News Media, Journalism & Publishing',
        sections: [
          { code: '070', nameTh: 'สื่อสารมวลชน วารสารศาสตร์ และการพิมพ์', nameEn: 'News Media, Journalism & Publishing' },
          { code: '071', nameTh: 'หนังสือพิมพ์ในอเมริกาเหนือ', nameEn: 'Newspapers in North America' },
          { code: '072', nameTh: 'หนังสือพิมพ์ในอังกฤษ', nameEn: 'Newspapers in British Isles' },
          { code: '073', nameTh: 'หนังสือพิมพ์ในเยอรมนี', nameEn: 'Newspapers in Germany' },
          { code: '074', nameTh: 'หนังสือพิมพ์ในฝรั่งเศส', nameEn: 'Newspapers in France' },
          { code: '075', nameTh: 'หนังสือพิมพ์ในอิตาลี', nameEn: 'Newspapers in Italy' },
          { code: '076', nameTh: 'หนังสือพิมพ์ในสเปน', nameEn: 'Newspapers in Spain' },
          { code: '077', nameTh: 'หนังสือพิมพ์ในรัสเซีย', nameEn: 'Newspapers in Russia' },
          { code: '078', nameTh: 'หนังสือพิมพ์ในสแกนดิเนเวีย', nameEn: 'Newspapers in Scandinavia' },
          { code: '079', nameTh: 'หนังสือพิมพ์ในประเทศไทยและเอเชีย', nameEn: 'Newspapers in Thailand & Asia' },
        ]
      },
      {
        code: '080',
        nameTh: 'ชุมนุมนิพนธ์ เรื่องทั่วไป',
        nameEn: 'General Collections',
        sections: [
          { code: '080', nameTh: 'ชุมนุมนิพนธ์ เรื่องทั่วไป', nameEn: 'General Collections' },
          { code: '081', nameTh: 'ชุมนุมนิพนธ์ภาษาอเมริกัน', nameEn: 'American Collections' },
          { code: '082', nameTh: 'ชุมนุมนิพนธ์ภาษาอังกฤษ', nameEn: 'English Collections' },
          { code: '083', nameTh: 'ชุมนุมนิพนธ์ภาษาเยอรมัน', nameEn: 'German Collections' },
          { code: '084', nameTh: 'ชุมนุมนิพนธ์ภาษาฝรั่งเศส', nameEn: 'French Collections' },
          { code: '085', nameTh: 'ชุมนุมนิพนธ์ภาษาอิตาลี', nameEn: 'Italian Collections' },
          { code: '086', nameTh: 'ชุมนุมนิพนธ์ภาษาสเปน', nameEn: 'Spanish Collections' },
          { code: '087', nameTh: 'ชุมนุมนิพนธ์ภาษารัสเซีย', nameEn: 'Slavic Collections' },
          { code: '088', nameTh: 'ชุมนุมนิพนธ์ภาษาอื่นๆ', nameEn: 'Collections in Other Languages' },
          { code: '089', nameTh: 'ชุมนุมนิพนธ์ภาษาไทย', nameEn: 'Thai Collections' },
        ]
      },
      {
        code: '090',
        nameTh: 'ต้นฉบับตัวเขียน และหนังสือหายาก',
        nameEn: 'Manuscripts & Rare Books',
        sections: [
          { code: '090', nameTh: 'ต้นฉบับตัวเขียน และหนังสือหายาก', nameEn: 'Manuscripts & Rare Books' },
          { code: '091', nameTh: 'ต้นฉบับตัวเขียน (Manuscripts)', nameEn: 'Manuscripts' },
          { code: '092', nameTh: 'หนังสือพิมพ์บล็อกไม้', nameEn: 'Block Books' },
          { code: '093', nameTh: 'หนังสือพิมพ์ยุคแรก (Incunabula)', nameEn: 'Incunabula' },
          { code: '094', nameTh: 'หนังสือพิมพ์จำกัดจำนวน', nameEn: 'Printed Books' },
          { code: '095', nameTh: 'หนังสือเข้าเล่มสวยงาม', nameEn: 'Books Notable for Bindings' },
          { code: '096', nameTh: 'หนังสือมีภาพประกอบพิเศษ', nameEn: 'Books Notable for Illustrations' },
          { code: '097', nameTh: 'หนังสือพิสูจน์ความเป็นเจ้าของ (Ex-libris)', nameEn: 'Books Notable for Ownership' },
          { code: '098', nameTh: 'หนังสือต้องห้าม', nameEn: 'Prohibited Works' },
          { code: '099', nameTh: 'หนังสือรูปเล่มพิเศษ', nameEn: 'Books Notable for Format' },
        ]
      }
    ]
  },
  {
    code: '100',
    range: '100 - 199',
    nameTh: 'ปรัชญา จิตวิทยา และจริยธรรม',
    nameEn: 'Philosophy & Psychology',
    icon: '🧠',
    color: 'border-purple-500 bg-purple-50 text-purple-700 font-semibold',
    divisions: [
      {
        code: '100',
        nameTh: 'ปรัชญาและจิตวิทยา',
        nameEn: 'Philosophy & Psychology',
        sections: [
          { code: '100', nameTh: 'ปรัชญาและจิตวิทยาเรื่องทั่วไป', nameEn: 'Philosophy & Psychology' },
          { code: '101', nameTh: 'ทฤษฎีปรัชญา', nameEn: 'Theory of Philosophy' },
          { code: '102', nameTh: 'เบ็ดเตล็ดทางปรัชญา', nameEn: 'Miscellany of Philosophy' },
          { code: '103', nameTh: 'พจนานุกรม สารานุกรมปรัชญา', nameEn: 'Dictionaries of Philosophy' },
          { code: '104', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '105', nameTh: 'สิ่งพิมพ์ต่อเนื่องทางปรัชญา', nameEn: 'Serial Publications of Philosophy' },
          { code: '106', nameTh: 'องค์การ สมาคมทางปรัชญา', nameEn: 'Organizations of Philosophy' },
          { code: '107', nameTh: 'การศึกษา และการสอนปรัชญา', nameEn: 'Education & Study in Philosophy' },
          { code: '108', nameTh: 'ชุมนุมนิพนธ์ทางปรัชญา', nameEn: 'Kinds of Persons in Philosophy' },
          { code: '109', nameTh: 'ประวัติศาสตร์ปรัชญา', nameEn: 'Historical Treatment of Philosophy' },
        ]
      },
      {
        code: '110',
        nameTh: 'อภิปรัชญา',
        nameEn: 'Metaphysics',
        sections: [
          { code: '110', nameTh: 'อภิปรัชญา (Metaphysics)', nameEn: 'Metaphysics' },
          { code: '111', nameTh: 'ภววิทยา (Ontology)', nameEn: 'Ontology' },
          { code: '112', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '113', nameTh: 'เอกภพวิทยา (Cosmology)', nameEn: 'Cosmology' },
          { code: '114', nameTh: 'เรื่องเกี่ยวกับอวกาศ', nameEn: 'Space' },
          { code: '115', nameTh: 'เรื่องเกี่ยวกับเวลา', nameEn: 'Time' },
          { code: '116', nameTh: 'การเปลี่ยนแปลง และการเกิด', nameEn: 'Change' },
          { code: '117', nameTh: 'สสาร และพลังงาน', nameEn: 'Structure' },
          { code: '118', nameTh: 'แรง และพลังงาน', nameEn: 'Force & Energy' },
          { code: '119', nameTh: 'จำนวน และปริมาณ', nameEn: 'Number & Quantity' },
        ]
      },
      {
        code: '120',
        nameTh: 'ทฤษฎีความรู้ มนุษยชาติ',
        nameEn: 'Epistemology, Causation & Human Kind',
        sections: [
          { code: '120', nameTh: 'ญาณวิทยา และทฤษฎีความรู้', nameEn: 'Epistemology' },
          { code: '121', nameTh: 'ทฤษฎีความรู้', nameEn: 'Theory of Knowledge' },
          { code: '122', nameTh: 'เหตุและผล (Causation)', nameEn: 'Causation' },
          { code: '123', nameTh: 'เสรีภาพ และพรหมลิขิต', nameEn: 'Determinism & Indeterminism' },
          { code: '124', nameTh: 'อันตวิทยา (Teleology)', nameEn: 'Teleology' },
          { code: '125', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '126', nameTh: 'ตัวตน จิตสำนึก', nameEn: 'The Self' },
          { code: '127', nameTh: 'จิตไร้สำนึก', nameEn: 'The Unconscious' },
          { code: '128', nameTh: 'มนุษยชาติ จิตวิญญาณ และชีวิต', nameEn: 'Human Mankind & Soul' },
          { code: '129', nameTh: 'กำเนิดและชะตากรรมของดวงวิญญาณ', nameEn: 'Origin & Destiny of Individual Souls' },
        ]
      },
      {
        code: '130',
        nameTh: 'จิตวิทยาลึกลับ ปรากฏการณ์เหนือธรรมชาติ',
        nameEn: 'Parapsychology & Occultism',
        sections: [
          { code: '130', nameTh: 'ปรจิตวิทยา และปรากฏการณ์ลึกลับ', nameEn: 'Parapsychology & Occultism' },
          { code: '131', nameTh: 'วิธีการทางปรจิตวิทยา', nameEn: 'Parapsychological Methods' },
          { code: '132', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '133', nameTh: 'ไสยศาสตร์ โหราศาสตร์ และจิตวิญญาณ', nameEn: 'Specific Topics in Parapsychology & Astrology' },
          { code: '134', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '135', nameTh: 'ความฝัน และสิ่งลึกลับ', nameEn: 'Dreams & Mysteries' },
          { code: '136', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '137', nameTh: 'กราโฟโลยี การวิเคราะห์ลายมือ', nameEn: 'Divinatory Graphology' },
          { code: '138', nameTh: 'นัยน์ตาศาสตร์ (Physiognomy)', nameEn: 'Physiognomy' },
          { code: '139', nameTh: 'กะโหลกศีรษะศาสตร์ (Phrenology)', nameEn: 'Phrenology' },
        ]
      },
      {
        code: '140',
        nameTh: 'แนวคิดทางปรัชญาเฉพาะกลุ่ม',
        nameEn: 'Specific Philosophical Schools',
        sections: [
          { code: '140', nameTh: 'แนวคิดทางปรัชญาเฉพาะกลุ่ม', nameEn: 'Specific Philosophical Schools' },
          { code: '141', nameTh: 'จิตนิยม (Idealism) และลัทธิที่เกี่ยวข้อง', nameEn: 'Idealism & Related Systems' },
          { code: '142', nameTh: 'ปรัชญาคุณค่า และปรากฏการณ์วิทยา', nameEn: 'Critical Philosophy' },
          { code: '143', nameTh: 'สัจนิยม และส Intuitionism', nameEn: 'Intuitionism & Bergsonism' },
          { code: '144', nameTh: 'มนุษยนิยม และธรรมชาตินิยม', nameEn: 'Humanism & Naturalism' },
          { code: '145', nameTh: 'สัตนิยม และการสังเคราะห์', nameEn: 'Sensationalism' },
          { code: '146', nameTh: 'สสารนิยม (Materialism) และปฏิบัตินิยม', nameEn: 'Materialism & Positivism' },
          { code: '147', nameTh: 'ปานเทพนิยม (Pantheism)', nameEn: 'Pantheism' },
          { code: '148', nameTh: 'ลัทธิอนุรักษนิยม และเสรีนิยมทางปรัชญา', nameEn: 'Dogmatism & Eclecticism' },
          { code: '149', nameTh: 'ลัทธิปรัชญาอื่นๆ (วิจารณญาณนิยม, สังเกตนิยม)', nameEn: 'Other Philosophical Systems' },
        ]
      },
      {
        code: '150',
        nameTh: 'จิตวิทยา',
        nameEn: 'Psychology',
        sections: [
          { code: '150', nameTh: 'จิตวิทยาเรื่องทั่วไป', nameEn: 'Psychology' },
          { code: '151', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '152', nameTh: 'การรับรู้ สัมผัส อารมณ์ และแรงจูงใจ', nameEn: 'Sensory Perception, Emotions & Motivation' },
          { code: '153', nameTh: 'กระบวนการทางปัญญา สติปัญญา และความคิด', nameEn: 'Consciousness, Intelligence & Thought' },
          { code: '154', nameTh: 'จิตใต้สำนึก ความฝัน และสภาวะจิต', nameEn: 'Subconscious & Altered States' },
          { code: '155', nameTh: 'จิตวิทยาพัฒนาการ (พัฒนาการเด็ก, วัยรุ่น, ผู้ใหญ่)', nameEn: 'Differential & Developmental Psychology' },
          { code: '156', nameTh: 'จิตวิทยาเปรียบเทียบสัตววิทยา', nameEn: 'Comparative Psychology' },
          { code: '157', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '158', nameTh: 'จิตวิทยาประยุกต์ การพัฒนาตนเอง มนุษยสัมพันธ์', nameEn: 'Applied Psychology & Self-Improvement' },
          { code: '159', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      },
      {
        code: '160',
        nameTh: 'ตรรกวิทยา',
        nameEn: 'Logic',
        sections: [
          { code: '160', nameTh: 'ตรรกวิทยา (Logic)', nameEn: 'Logic' },
          { code: '161', nameTh: 'การอุปนัย (Induction)', nameEn: 'Induction' },
          { code: '162', nameTh: 'การนิรนัย (Deduction)', nameEn: 'Deduction' },
          { code: '163', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '164', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '165', nameTh: 'เหตุผลวิบัติ และข้อผิดพลาดในการคิด', nameEn: 'Fallacies & Sources of Error' },
          { code: '166', nameTh: 'ตรรกบท (Syllogism)', nameEn: 'Syllogisms' },
          { code: '167', nameTh: 'สมมติฐาน', nameEn: 'Hypotheses' },
          { code: '168', nameTh: 'การโต้แย้งและการชี้แจงเหตุผล', nameEn: 'Argument & Persuasion' },
          { code: '169', nameTh: 'การจัดลำดับและอนุกรม', nameEn: 'Analogy' },
        ]
      },
      {
        code: '170',
        nameTh: 'จริยศาสตร์ ศีลธรรม และจริยธรรม',
        nameEn: 'Ethics (Moral Philosophy)',
        sections: [
          { code: '170', nameTh: 'จริยศาสตร์ และศีลธรรมทั่วไป', nameEn: 'Ethics (Moral Philosophy)' },
          { code: '171', nameTh: 'ระบบและทฤษฎีทางจริยศาสตร์', nameEn: 'Ethical Systems' },
          { code: '172', nameTh: 'จริยธรรมทางการเมืองและรัฐบาล', nameEn: 'Political Ethics' },
          { code: '173', nameTh: 'จริยธรรมในครอบครัว', nameEn: 'Ethics of Family Relationships' },
          { code: '174', nameTh: 'จริยธรรมวิชาชีพ (แพทย์, ครู, นักธุรกิจ, คอมพิวเตอร์)', nameEn: 'Occupational Ethics' },
          { code: '175', nameTh: 'จริยธรรมในการพักผ่อนและนันทนาการ', nameEn: 'Ethics of Recreation' },
          { code: '176', nameTh: 'จริยธรรมเรื่องเพศและการเจริญพันธุ์', nameEn: 'Ethics of Sex & Reproduction' },
          { code: '177', nameTh: 'จริยธรรมในมนุษยสัมพันธ์และสังคม', nameEn: 'Ethics of Social Relations' },
          { code: '178', nameTh: 'จริยธรรมเกี่ยวกับการบริโภค เครื่องดื่ม', nameEn: 'Ethics of Consumption' },
          { code: '179', nameTh: 'ประเด็นจริยธรรมอื่นๆ (สิทธิสัตว์, สิ่งแวดล้อม)', nameEn: 'Other Ethical Norms (Animal Rights)' },
        ]
      },
      {
        code: '180',
        nameTh: 'ปรัชญาสมัยโบราณ สมัยกลาง และตะวันออก',
        nameEn: 'Ancient, Medieval & Eastern Philosophy',
        sections: [
          { code: '180', nameTh: 'ปรัชญาโบราณ ปรัชญาตะวันออก', nameEn: 'Ancient, Medieval, Eastern Philosophy' },
          { code: '181', nameTh: 'ปรัชญาตะวันออก (อินเดีย, จีน, พุทธ, ขงจื้อ)', nameEn: 'Eastern Philosophy (Indian, Chinese)' },
          { code: '182', nameTh: 'ปรัชญากรีกยุคแรกก่อนโซเครตีส', nameEn: 'Pre-Socratic Greek Philosophies' },
          { code: '183', nameTh: 'ปรัชญาโซฟิสต์ และโซเครตีส', nameEn: 'Sophistic & Socratic Philosophies' },
          { code: '184', nameTh: 'ปรัชญาเพลโต', nameEn: 'Platonic Philosophy' },
          { code: '185', nameTh: 'ปรัชญาอริสโตเติล', nameEn: 'Aristotelian Philosophy' },
          { code: '186', nameTh: 'ปรัชญาสเกปติก และนีโอเพลโต', nameEn: 'Skeptic & Neoplatonic Philosophies' },
          { code: '187', nameTh: 'ปรัชญาเอพิคิวเรียน', nameEn: 'Epicurean Philosophy' },
          { code: '188', nameTh: 'ปรัชญาสโตอิก', nameEn: 'Stoic Philosophy' },
          { code: '189', nameTh: 'ปรัชญาตะวันตกสมัยกลาง (สโกลาสติก)', nameEn: 'Medieval Western Philosophy' },
        ]
      },
      {
        code: '190',
        nameTh: 'ปรัชญาตะวันตกสมัยใหม่',
        nameEn: 'Modern Western Philosophy',
        sections: [
          { code: '190', nameTh: 'ปรัชญาตะวันตกสมัยใหม่', nameEn: 'Modern Western Philosophy' },
          { code: '191', nameTh: 'ปรัชญาในสหรัฐอเมริกาและแคนาดา', nameEn: 'Philosophy of United States & Canada' },
          { code: '192', nameTh: 'ปรัชญาในอังกฤษ', nameEn: 'Philosophy of British Isles' },
          { code: '193', nameTh: 'ปรัชญาในเยอรมนีและออสเตรีย (คานท์, นิทเช่)', nameEn: 'Philosophy of Germany & Austria' },
          { code: '194', nameTh: 'ปรัชญาในฝรั่งเศส (เดสการ์ตส์, ซาตร์)', nameEn: 'Philosophy of France' },
          { code: '195', nameTh: 'ปรัชญาในอิตาลี', nameEn: 'Philosophy of Italy' },
          { code: '196', nameTh: 'ปรัชญาในสเปนและโปรตุเกส', nameEn: 'Philosophy of Spain & Portugal' },
          { code: '197', nameTh: 'ปรัชญาในรัสเซีย', nameEn: 'Philosophy of Russia' },
          { code: '198', nameTh: 'ปรัชญาในสแกนดิเนเวีย', nameEn: 'Philosophy of Scandinavia' },
          { code: '199', nameTh: 'ปรัชญาในประเทศอื่นๆ', nameEn: 'Philosophy in Other Geographic Areas' },
        ]
      }
    ]
  },
  {
    code: '200',
    range: '200 - 299',
    nameTh: 'ศาสนา',
    nameEn: 'Religion',
    icon: '🙏',
    color: 'border-rose-500 bg-rose-50 text-rose-700 font-semibold',
    divisions: [
      {
        code: '200',
        nameTh: 'ศาสนาเรื่องทั่วไป',
        nameEn: 'Religion',
        sections: [
          { code: '200', nameTh: 'ศาสนาเรื่องทั่วไป', nameEn: 'Religion' },
          { code: '201', nameTh: 'ปรัชญาและทฤษฎีทางศาสนา', nameEn: 'Religious Mythology & Social Theology' },
          { code: '202', nameTh: 'หลักการและคำสอนทางศาสนา', nameEn: 'Doctrines & Beliefs' },
          { code: '203', nameTh: 'การบูชา และพิธีกรรมทางศาสนา', nameEn: 'Public Worship & Practices' },
          { code: '204', nameTh: 'ศาสนธรรม และชีวิตจิตวิญญาณ', nameEn: 'Religious Experience, Life & Practice' },
          { code: '205', nameTh: 'จริยธรรมทางศาสนา', nameEn: 'Religious Ethics' },
          { code: '206', nameTh: 'ผู้นำและองค์กรทางศาสนา', nameEn: 'Leaders & Organization' },
          { code: '207', nameTh: 'การศึกษาทางศาสนา', nameEn: 'Missions & Religious Education' },
          { code: '208', nameTh: 'ชุมนุมนิพนธ์ทางศาสนา', nameEn: 'Sources of Religion' },
          { code: '209', nameTh: 'ประวัติศาสตร์ศาสนา', nameEn: 'Sects & Nonchristian Religions' },
        ]
      },
      {
        code: '210',
        nameTh: 'ศาสนาธรรมชาติ ปรัชญาศาสนา',
        nameEn: 'Philosophy & Theory of Religion',
        sections: [
          { code: '210', nameTh: 'ศาสนาธรรมชาติ และปรัชญาศาสนา', nameEn: 'Philosophy & Theory of Religion' },
          { code: '211', nameTh: 'แนวคิดเกี่ยวกับพระเจ้า (เทวนิยม, อเทวนิยม)', nameEn: 'Concepts of God' },
          { code: '212', nameTh: 'การเข้าถึงพระเจ้าและจักรวาล', nameEn: 'Existence, Knowability & Attributes of God' },
          { code: '213', nameTh: 'การเนรมิตและการสร้างโลก', nameEn: 'Creation' },
          { code: '214', nameTh: 'เทวลิขิต และปัญหาความชั่วร้าย', nameEn: 'Theodicy' },
          { code: '215', nameTh: 'ศาสนากับวิทยาศาสตร์', nameEn: 'Science & Religion' },
          { code: '216', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '217', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '218', nameTh: 'มนุษย์ และการหลุดพ้น', nameEn: 'Humanity' },
          { code: '219', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      },
      {
        code: '220',
        nameTh: 'คริสต์ศาสนา - พระคัมภีร์ไบเบิล',
        nameEn: 'Bible',
        sections: [
          { code: '220', nameTh: 'พระคัมภีร์ไบเบิล (Bible)', nameEn: 'Bible' },
          { code: '221', nameTh: 'คัมภีร์เดิม (Old Testament)', nameEn: 'Old Testament (Tanakh)' },
          { code: '222', nameTh: 'หนังสือประวัติศาสตร์ในคัมภีร์เดิม', nameEn: 'Historical Books of Old Testament' },
          { code: '223', nameTh: 'หนังสือปรีชาญาณและบทเพลง', nameEn: 'Poetic Books of Old Testament' },
          { code: '224', nameTh: 'หนังสือประกาศก', nameEn: 'Prophetic Books of Old Testament' },
          { code: '225', nameTh: 'คัมภีร์ใหม่ (New Testament)', nameEn: 'New Testament' },
          { code: '226', nameTh: 'พระวรสาร และกิจการอัครสาวก', nameEn: 'Gospels & Acts' },
          { code: '227', nameTh: 'จดหมายเหตุอัครสาวก (จดหมายนักบุญเปาโล)', nameEn: 'Epistles' },
          { code: '228', nameTh: 'หนังสือนิมิต (Apocalypse / Revelation)', nameEn: 'Book of Revelation' },
          { code: '229', nameTh: 'คัมภีร์นอกสารบบ (Apocrypha)', nameEn: 'Apocrypha & Pseudepigrapha' },
        ]
      },
      {
        code: '230',
        nameTh: 'เทววิทยาคริสเตียน',
        nameEn: 'Christian Theology',
        sections: [
          { code: '230', nameTh: 'เทววิทยาคริสเตียน', nameEn: 'Christian Theology' },
          { code: '231', nameTh: 'พระเจ้า (พระบิดา, พระบุตร, พระจิต)', nameEn: 'God' },
          { code: '232', nameTh: 'พระเยซูคริสต์ และคริสตวิทยา', nameEn: 'Jesus Christ & His Family' },
          { code: '233', nameTh: 'มนุษยวิทยาทางเทววิทยา', nameEn: 'Humanity' },
          { code: '234', nameTh: 'ความรอดพ้น และพระคุณ', nameEn: 'Salvation & Grace' },
          { code: '235', nameTh: 'สิ่งมีชีวิตทางจิตวิญญาณ (ทูตสวรรค์)', nameEn: 'Spiritual Beings' },
          { code: '236', nameTh: 'อวสานวิทยา (การเสด็จกลับมา)', nameEn: 'Eschatology' },
          { code: '237', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '238', nameTh: 'หลักธรรมและบทบัญญัติความเชื่อ', nameEn: 'Creeds & Catechisms' },
          { code: '239', nameTh: 'การปกป้องความเชื่อทางศาสนา (Apologetics)', nameEn: 'Apologetics & Polemics' },
        ]
      },
      {
        code: '240',
        nameTh: 'จริยธรรมและข้อปฏิบัติของคริสต์ศาสนา',
        nameEn: 'Christian Moral & Devotional Theology',
        sections: [
          { code: '240', nameTh: 'จริยธรรมและข้อปฏิบัติทางคริสต์ศาสนา', nameEn: 'Christian Moral & Devotional Theology' },
          { code: '241', nameTh: 'จริยศาสตร์คริสเตียน', nameEn: 'Christian Ethics' },
          { code: '242', nameTh: 'หนังสือภาวนา และบทสวด', nameEn: 'Devotional Texts' },
          { code: '243', nameTh: 'ข้อคิดเตือนใจสำหรับบทเพลง', nameEn: 'Evangelistic Writings' },
          { code: '244', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '245', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '246', nameTh: 'ศิลปกรรมในคริสต์ศาสนา', nameEn: 'Christian Art & Iconography' },
          { code: '247', nameTh: 'เครื่องตกแต่ง และพิธีในคริสตจักร', nameEn: 'Church Furnishings & Articles' },
          { code: '248', nameTh: 'การดำเนินชีวิตคริสเตียนและการปฏิบัติ', nameEn: 'Christian Experience & Practice' },
          { code: '249', nameTh: 'การภาวนาในครอบครัว', nameEn: 'Christian Observances in Family Life' },
        ]
      },
      {
        code: '250',
        nameTh: 'คริสต์ศาสนจักรรวมและการทำงานในท้องถิ่น',
        nameEn: 'Christian Orders & Local Church',
        sections: [
          { code: '250', nameTh: 'คริสตจักรท้องถิ่นและคณะนักโปรด', nameEn: 'Local Christian Church & Religious Orders' },
          { code: '251', nameTh: 'การเทศนา (Homiletics)', nameEn: 'Preaching (Homiletics)' },
          { code: '252', nameTh: 'บทเทศน์และคำสอน', nameEn: 'Texts of Sermons' },
          { code: '253', nameTh: 'การอภิบาลและศิษยาภิบาล', nameEn: 'Pastoral Office & Work' },
          { code: '254', nameTh: 'การบริหารงานคริสตจักรท้องถิ่น', nameEn: 'Parish Administration' },
          { code: '255', nameTh: 'คณะนักบวชและอารามวิถี', nameEn: 'Religious Congregations & Orders' },
          { code: '256', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '257', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '258', nameTh: 'งานอภิบาลผู้ป่วยและผู้ตกทุกข์', nameEn: 'Pastoral Care of Sick & Disadvantaged' },
          { code: '259', nameTh: 'การดูแลเยาวชนและครอบครัวในคริสตจักร', nameEn: 'Pastoral Care of Families & Youth' },
        ]
      },
      {
        code: '260',
        nameTh: 'สังคมและเทววิทยาคริสเตียน',
        nameEn: 'Christian Social & Ecclesiastical Theology',
        sections: [
          { code: '260', nameTh: 'สถาบันคริสตจักรและสังคม', nameEn: 'Christian Social & Ecclesiastical Theology' },
          { code: '261', nameTh: 'เทววิทยาสังคมและคริสตจักรกิจการ', nameEn: 'Social Theology' },
          { code: '262', nameTh: 'โครงสร้างการปกครองคริสตจักร (พระสังฆราช/ปาปา)', nameEn: 'Ecclesiology & Church Governance' },
          { code: '263', nameTh: 'วันสำคัญและพิธีศักดิ์สิทธิ์', nameEn: 'Days, Times & Places of Observance' },
          { code: '264', nameTh: 'พิธีกรรมทางศาสนา (Liturgy)', nameEn: 'Public Worship (Liturgy)' },
          { code: '265', nameTh: 'ศีลศักดิ์สิทธิ์ (Sacraments)', nameEn: 'Sacraments & Rites' },
          { code: '266', nameTh: 'การประกาศข่าวประเสริฐและพันธกิจมิชชันนารี', nameEn: 'Missions' },
          { code: '267', nameTh: 'สมาคมคริสเตียน (YMCA, YWCA)', nameEn: 'Associations for Religious Work' },
          { code: '268', nameTh: 'การศึกษาทางศาสนาและโรงเรียนวันอาทิตย์', nameEn: 'Religious Education' },
          { code: '269', nameTh: 'การฟื้นฟูความเชื่อทางศาสนา', nameEn: 'Renovation & Renewal' },
        ]
      },
      {
        code: '270',
        nameTh: 'ประวัติศาสตร์คริสต์ศาสนา',
        nameEn: 'Historical Treatment of Christianity',
        sections: [
          { code: '270', nameTh: 'ประวัติศาสตร์คริสต์ศาสนาเรื่องทั่วไป', nameEn: 'History of Christianity' },
          { code: '271', nameTh: 'คณะนักบวชในประวัติศาสตร์', nameEn: 'Religious Orders in Church History' },
          { code: '272', nameTh: 'การกดขี่และการเบียดเบียนคริสตชน', nameEn: 'Persecutions' },
          { code: '273', nameTh: 'นอกลัทธิและความขัดแย้งทางเทววิทยา', nameEn: 'Doctrinal Controversies & Heresies' },
          { code: '274', nameTh: 'ประวัติคริสตจักรในยุโรป', nameEn: 'Christianity in Europe' },
          { code: '275', nameTh: 'ประวัติคริสตจักรในเอเชีย (ไทย)', nameEn: 'Christianity in Asia' },
          { code: '276', nameTh: 'ประวัติคริสตจักรในแอฟริกา', nameEn: 'Christianity in Africa' },
          { code: '277', nameTh: 'ประวัติคริสตจักรในอเมริกาเหนือ', nameEn: 'Christianity in North America' },
          { code: '278', nameTh: 'ประวัติคริสตจักรในอเมริกาใต้', nameEn: 'Christianity in South America' },
          { code: '279', nameTh: 'ประวัติคริสตจักรในส่วนอื่นๆ ของโลก', nameEn: 'Christianity in Australasia & Pacific' },
        ]
      },
      {
        code: '280',
        nameTh: 'นิกายต่างๆ ในคริสต์ศาสนา',
        nameEn: 'Christian Denominations',
        sections: [
          { code: '280', nameTh: 'นิกายและคริสตจักรต่างๆ', nameEn: 'Christian Denominations' },
          { code: '281', nameTh: 'คริสตจักรยุคแรกและคริสตจักรตะวันออก', nameEn: 'Early Church & Eastern Churches' },
          { code: '282', nameTh: 'นิกายโรมันคาทอลิก (Roman Catholic)', nameEn: 'Roman Catholic Church' },
          { code: '283', nameTh: 'นิกายแองกลิกัน (Anglican)', nameEn: 'Anglican Churches' },
          { code: '284', nameTh: 'นิกายโปรเตสแตนต์ยุคปฏิรูป (ลูเธอร์รัน)', nameEn: 'Protestant Denominations of Continental Origin' },
          { code: '285', nameTh: 'นิกายเพรสไบทีเรียนและคองเกรเกชันนัล', nameEn: 'Presbyterian & Congregational' },
          { code: '286', nameTh: 'นิกายแบปทิสต์ (Baptist)', nameEn: 'Baptist Denominations' },
          { code: '287', nameTh: 'นิกายเมโธดิสต์ (Methodist)', nameEn: 'Methodist Denominations' },
          { code: '288', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '289', nameTh: 'นิกายอื่นๆ (มอร์มอน, คริสเตียนวิทยาศาสตร์)', nameEn: 'Other Denominations' },
        ]
      },
      {
        code: '290',
        nameTh: 'ศาสนาเปรียบเทียบและศาสนาอื่นๆ',
        nameEn: 'Other Religions (Buddhism, Islam, Hinduism)',
        sections: [
          { code: '290', nameTh: 'ศาสนาอื่นๆ และศาสนาเปรียบเทียบ', nameEn: 'Other Religions' },
          { code: '291', nameTh: 'ว่าง (ยกเลิกใช้)', nameEn: 'Unassigned' },
          { code: '292', nameTh: 'ศาสนาโบราณกรีกและโรมัน', nameEn: 'Classical Religion (Greek & Roman)' },
          { code: '293', nameTh: 'ศาสนาโบราณเจอร์แมนิก', nameEn: 'Germanic Religion' },
          { code: '294', nameTh: 'ศาสนากำเนิดในอินเดีย (294.3 พระพุทธศาสนา, 294.5 ฮินดู)', nameEn: 'Religions of Indic Origin (Buddhism, Hinduism)' },
          { code: '295', nameTh: 'ศาสนาโซโรอัสเตอร์', nameEn: 'Zoroastrianism' },
          { code: '296', nameTh: 'ศาสนายิว (ยูดาห์)', nameEn: 'Judaism' },
          { code: '297', nameTh: 'ศาสนาอิสลาม (Islam)', nameEn: 'Islam' },
          { code: '298', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '299', nameTh: 'ศาสนาอื่นๆ (ชินโต, เต๋า, ขงจื้อ, บาไฮ)', nameEn: 'Religions Not Provided for Elsewhere' },
        ]
      }
    ]
  },
  {
    code: '300',
    range: '300 - 399',
    nameTh: 'สังคมศาสตร์',
    nameEn: 'Social Sciences',
    icon: '👥',
    color: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold',
    divisions: [
      {
        code: '300',
        nameTh: 'สังคมศาสตร์ และสังคมวิทยา',
        nameEn: 'Social Sciences & Sociology',
        sections: [
          { code: '300', nameTh: 'สังคมศาสตร์เรื่องทั่วไป', nameEn: 'Social Sciences' },
          { code: '301', nameTh: 'สังคมวิทยา และมนุษยวิทยา', nameEn: 'Sociology & Anthropology' },
          { code: '302', nameTh: 'ปฏิสัมพันธ์ทางสังคม จิตวิทยาสังคม', nameEn: 'Social Interaction & Social Psychology' },
          { code: '303', nameTh: 'กระบวนการทางสังคม การเปลี่ยนแปลงสังคม', nameEn: 'Social Processes & Change' },
          { code: '304', nameTh: 'ปัจจัยที่มีผลต่อพฤติกรรมสังคม (ประชากรศาสตร์)', nameEn: 'Factors Affecting Social Behavior' },
          { code: '305', nameTh: 'กลุ่มสังคม และชั้นชนทางสังคม (สตรี, เด็ก, ผู้สูงอายุ)', nameEn: 'Social Groups & Stratification' },
          { code: '306', nameTh: 'วัฒนธรรม และสถาบันสังคม', nameEn: 'Culture & Cultural Institutions' },
          { code: '307', nameTh: 'ชุมชน (ชุมชนเมือง, ชุมชนชนบท)', nameEn: 'Communities (Urban & Rural)' },
          { code: '308', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '309', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      },
      {
        code: '310',
        nameTh: 'สถิติทั่วไป',
        nameEn: 'Collections of General Statistics',
        sections: [
          { code: '310', nameTh: 'สถิติทั่วไป', nameEn: 'Collections of General Statistics' },
          { code: '311', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '312', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '313', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '314', nameTh: 'สถิติประเทศในยุโรป', nameEn: 'Statistics of European Countries' },
          { code: '315', nameTh: 'สถิติประเทศในเอเชีย (สถิติประเทศไทย)', nameEn: 'Statistics of Asian Countries (Thailand)' },
          { code: '316', nameTh: 'สถิติประเทศในแอฟริกา', nameEn: 'Statistics of African Countries' },
          { code: '317', nameTh: 'สถิติประเทศในอเมริกาเหนือ', nameEn: 'Statistics of North America' },
          { code: '318', nameTh: 'สถิติประเทศในอเมริกาใต้', nameEn: 'Statistics of South America' },
          { code: '319', nameTh: 'สถิติประเทศในออสเตรเลียและส่วนอื่นๆ', nameEn: 'Statistics of Other Geographic Areas' },
        ]
      },
      {
        code: '320',
        nameTh: 'รัฐศาสตร์และการเมือง',
        nameEn: 'Political Science & Government',
        sections: [
          { code: '320', nameTh: 'รัฐศาสตร์และการเมืองเรื่องทั่วไป', nameEn: 'Political Science' },
          { code: '321', nameTh: 'ระบบและรูปแบบการปกครอง (ประชาธิปไตย, ราชาธิปไตย)', nameEn: 'Systems of Government & States' },
          { code: '322', nameTh: 'ความสัมพันธ์ระหว่างรัฐกับกลุ่มสังคม', nameEn: 'Relation of State to Organized Groups' },
          { code: '323', nameTh: 'สิทธิมนุษยชน สิทธิพลเมือง และเสรีภาพ', nameEn: 'Civil & Political Rights' },
          { code: '324', nameTh: 'กระบวนการทางการเมือง พรรคการเมือง และการเลือกตั้ง', nameEn: 'Political Process, Parties & Elections' },
          { code: '325', nameTh: 'การอพยพ ย้ายถิ่นฐาน และการอาณานิคม', nameEn: 'International Migration & Colonization' },
          { code: '326', nameTh: 'ทาสและการเลิกทาส', nameEn: 'Slavery & Emancipation' },
          { code: '327', nameTh: 'ความสัมพันธ์ระหว่างประเทศ และการทูต', nameEn: 'International Relations & Diplomacy' },
          { code: '328', nameTh: 'รัฐสภา กระบวนการนิติบัญญัติ', nameEn: 'The Legislative Process' },
          { code: '329', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      },
      {
        code: '330',
        nameTh: 'เศรษฐศาสตร์',
        nameEn: 'Economics',
        sections: [
          { code: '330', nameTh: 'เศรษฐศาสตร์เรื่องทั่วไป', nameEn: 'Economics' },
          { code: '331', nameTh: 'แรงงาน ตลาดแรงงาน และการจ้างงาน', nameEn: 'Labor Economics' },
          { code: '332', nameTh: 'การเงิน การลงทุน การธนาคาร และตลาดทุน', nameEn: 'Financial Economics & Banking' },
          { code: '333', nameTh: 'เศรษฐศาสตร์ที่ดิน สิ่งแวดล้อม และพลังงาน', nameEn: 'Economics of Land & Energy' },
          { code: '334', nameTh: 'สหกรณ์', nameEn: 'Cooperatives' },
          { code: '335', nameTh: 'ระบบเศรษฐกิจสังคมนิยม และการวางแผน', nameEn: 'Socialism & Related Systems' },
          { code: '336', nameTh: 'การคลังสาธารณะ ภาษีอากร และงบประมาณ', nameEn: 'Public Finance & Taxation' },
          { code: '337', nameTh: 'เศรษฐศาสตร์ระหว่างประเทศ และการค้าเสรี', nameEn: 'International Economics' },
          { code: '338', nameTh: 'การผลิต อุตสาหกรรม และการพัฒนาเศรษฐกิจ', nameEn: 'Production & Industrial Economics' },
          { code: '339', nameTh: 'มหเศรษฐศาสตร์ และรายได้ประชาชาติ', nameEn: 'Macroeconomics & National Income' },
        ]
      },
      {
        code: '340',
        nameTh: 'กฎหมาย',
        nameEn: 'Law',
        sections: [
          { code: '340', nameTh: 'กฎหมายเรื่องทั่วไป', nameEn: 'Law' },
          { code: '341', nameTh: 'กฎหมายระหว่างประเทศ', nameEn: 'Law of Nations (International Law)' },
          { code: '342', nameTh: 'กฎหมายรัฐธรรมนูญและกฎหมายปกครอง', nameEn: 'Constitutional & Administrative Law' },
          { code: '343', nameTh: 'กฎหมายการคลัง ภาษี และสัมปทาน', nameEn: 'Military, Tax, Trade & Industrial Law' },
          { code: '344', nameTh: 'กฎหมายแรงงาน สวัสดิการ และสิ่งแวดล้อม', nameEn: 'Labor, Social, Education & Cultural Law' },
          { code: '345', nameTh: 'กฎหมายอาญา (Criminal Law)', nameEn: 'Criminal Law' },
          { code: '346', nameTh: 'กฎหมายแพ่งและพาณิชย์ (Civil & Commercial Law)', nameEn: 'Civil Law' },
          { code: '347', nameTh: 'วิธีพิจารณาความและศาล', nameEn: 'Civil Procedure & Courts' },
          { code: '348', nameTh: 'บทกฎหมาย สนธิสัญญา และพระราชกฤษฎีกา', nameEn: 'Laws, Regulations & Cases' },
          { code: '349', nameTh: 'กฎหมายเฉพาะประเทศ (กฎหมายไทย)', nameEn: 'Law of Specific Jurisdictions (Thai Law)' },
        ]
      },
      {
        code: '350',
        nameTh: 'รัฐประศาสนศาสตร์และการทหาร',
        nameEn: 'Public Administration & Military Science',
        sections: [
          { code: '350', nameTh: 'การบริหารราชการแผ่นดิน และรัฐประศาสนศาสตร์', nameEn: 'Public Administration' },
          { code: '351', nameTh: 'การบริหารงานรัฐบาลระดับชาติ', nameEn: 'Public Administration of Central Governments' },
          { code: '352', nameTh: 'การปกครองส่วนท้องถิ่น (กรุงเทพฯ, อบจ., อบต.)', nameEn: 'General Considerations of Public Administration' },
          { code: '353', nameTh: 'การบริหารราชการเฉพาะกระทรวง', nameEn: 'Specific Fields of Public Administration' },
          { code: '354', nameTh: 'การบริหารงานภาครัฐในต่างประเทศ', nameEn: 'Public Administration of Economy & Environment' },
          { code: '355', nameTh: 'วิทยาการทหาร และความมั่นคงแห่งชาติ', nameEn: 'Military Science' },
          { code: '356', nameTh: 'ทหารราบ และยุทธวิธีทางบก', nameEn: 'Infantry Forces & Warfare' },
          { code: '357', nameTh: 'ทหารม้า และกองกำลังยานเกราะ', nameEn: 'Mounted Forces & Warfare' },
          { code: '358', nameTh: 'ทหารปืนใหญ่ ทหารอากาศ และสงครามนิวเคลียร์', nameEn: 'Air & Other Specialized Forces' },
          { code: '359', nameTh: 'กองทัพเรือ และสงครามทางน้ำ', nameEn: 'Naval Forces & Warfare' },
        ]
      },
      {
        code: '360',
        nameTh: 'ปัญหาสังคม และสวัสดิการสังคม',
        nameEn: 'Social Problems, Social Services & Associations',
        sections: [
          { code: '360', nameTh: 'ปัญหาสังคม และบริการสวัสดิการสังคม', nameEn: 'Social Problems & Services' },
          { code: '361', nameTh: 'ปัญหาสังคมและการบรรเทาทุกข์ทั่วไป', nameEn: 'Social Problems & Social Welfare' },
          { code: '362', nameTh: 'สวัสดิการผู้ป่วย คนพิการ ผู้สูงอายุ เด็ก', nameEn: 'Social Welfare Problems & Services' },
          { code: '363', nameTh: 'ปัญหาสาธารณสุข ความปลอดภัย สิ่งแวดล้อม ยาเสพติด', nameEn: 'Other Social Problems & Services' },
          { code: '364', nameTh: 'อาชญาวิทยา อาชญากรรม และการราชทัณฑ์', nameEn: 'Criminology & Penology' },
          { code: '365', nameTh: 'เรือนจำ และสถาบันดัดนิสัย', nameEn: 'Penal & Related Institutions' },
          { code: '366', nameTh: 'สมาคมลับ และองค์กรความร่วมมือ', nameEn: 'Secret Societies & Associations' },
          { code: '367', nameTh: 'สโมสรทั่วไป', nameEn: 'General Clubs' },
          { code: '368', nameTh: 'การประกันภัย (ประกันชีวิต, ประกันวินาศภัย)', nameEn: 'Insurance' },
          { code: '369', nameTh: 'สมาคมเยาวชน (ลูกเสือ, เนตรนารี)', nameEn: 'Young People’s Associations' },
        ]
      },
      {
        code: '370',
        nameTh: 'การศึกษา',
        nameEn: 'Education',
        sections: [
          { code: '370', nameTh: 'การศึกษาเรื่องทั่วไป', nameEn: 'Education' },
          { code: '371', nameTh: 'การบริหารโรงเรียน การสอน และเทคโนโลยีการศึกษา', nameEn: 'School Management, Teaching & EdTech' },
          { code: '372', nameTh: 'การประถมศึกษา และอนุบาลศึกษา', nameEn: 'Elementary & Primary Education' },
          { code: '373', nameTh: 'การมัธยมศึกษา', nameEn: 'Secondary Education' },
          { code: '374', nameTh: 'การศึกษาผู้ใหญ่ และการเรียนรู้ตลอดชีวิต', nameEn: 'Adult Education' },
          { code: '375', nameTh: 'หลักสูตรและการพัฒนาหลักสูตร', nameEn: 'Curricula' },
          { code: '376', nameTh: 'ว่าง (เลิกใช้)', nameEn: 'Unassigned' },
          { code: '377', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '378', nameTh: 'การอุดมศึกษา (มหาวิทยาลัย)', nameEn: 'Higher Education (Universities)' },
          { code: '379', nameTh: 'นโยบายการศึกษา รัฐกับการศึกษา', nameEn: 'Public Policy Issues in Education' },
        ]
      },
      {
        code: '380',
        nameTh: 'การพาณิชย์ การสื่อสาร และการขนส่ง',
        nameEn: 'Commerce, Communications & Transportation',
        sections: [
          { code: '380', nameTh: 'การพาณิชย์ การสื่อสาร และการขนส่ง', nameEn: 'Commerce, Communications & Transportation' },
          { code: '381', nameTh: 'การค้าภายในประเทศ (ค้าปลีก ค้าส่ง)', nameEn: 'Domestic Trade (Commerce)' },
          { code: '382', nameTh: 'การค้าระหว่างประเทศ (นำเข้า ส่งออก)', nameEn: 'International Trade (Foreign Trade)' },
          { code: '383', nameTh: 'บริการไปรษณีย์ และแสตมป์', nameEn: 'Postal Communication' },
          { code: '384', nameTh: 'การโทรคมนาคม (โทรศัพท์, วิทยุ, โทรทัศน์, อินเทอร์เน็ต)', nameEn: 'Telecommunications' },
          { code: '385', nameTh: 'การขนส่งทางรถไฟ', nameEn: 'Rail Transportation' },
          { code: '386', nameTh: 'การขนส่งทางน้ำภายในประเทศ (คลอง/แม่น้ำ)', nameEn: 'Inland Waterway Transportation' },
          { code: '387', nameTh: 'การขนส่งทางทะเล และทางอากาศ', nameEn: 'Maritime & Air Transportation' },
          { code: '388', nameTh: 'การขนส่งทางบก (รถยนต์, ถนน, จราจร)', nameEn: 'Transportation & Ground Transportation' },
          { code: '389', nameTh: 'มาตรชั่งตวงวัด และมาตรฐานสินค้า', nameEn: 'Metrology & Standardization' },
        ]
      },
      {
        code: '390',
        nameTh: 'ขนบธรรมเนียมประเพณี คติชาวบ้าน และมารยาท',
        nameEn: 'Customs, Etiquette & Folklore',
        sections: [
          { code: '390', nameTh: 'ขนบธรรมเนียมประเพณี และคติชาวบ้าน', nameEn: 'Customs, Etiquette & Folklore' },
          { code: '391', nameTh: 'เครื่องแต่งกาย แฟชั่น และเครื่องประดับ', nameEn: 'Costume & Personal Appearance' },
          { code: '392', nameTh: 'ประเพณีเกี่ยวกับวงจรชีวิต (แต่งงาน, เกิด, ตาย)', nameEn: 'Customs of Life Cycle & Domestic Life' },
          { code: '393', nameTh: 'ประเพณีงานศพและการจัดการศพ', nameEn: 'Death Customs' },
          { code: '394', nameTh: 'ประเพณีเทศกาล วันสำคัญ และงานฉลอง', nameEn: 'General Customs & Holidays' },
          { code: '395', nameTh: 'มารยาททางสังคม และสมบัติผู้ดี', nameEn: 'Etiquette (Manners)' },
          { code: '396', nameTh: 'ว่าง (เลิกใช้)', nameEn: 'Unassigned' },
          { code: '397', nameTh: 'ว่าง (เลิกใช้)', nameEn: 'Unassigned' },
          { code: '398', nameTh: 'คติชาวบ้าน นิทานพื้นบ้าน และปริศนาคำทาย', nameEn: 'Folklore, Myths & Fairytales' },
          { code: '399', nameTh: 'ประเพณีการทำสงครามและการชนไก่', nameEn: 'Customs of War & Diplomacy' },
        ]
      }
    ]
  },
  {
    code: '400',
    range: '400 - 499',
    nameTh: 'ภาษาศาสตร์',
    nameEn: 'Language',
    icon: '🗣️',
    color: 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold',
    divisions: [
      {
        code: '400',
        nameTh: 'ภาษาศาสตร์เรื่องทั่วไป',
        nameEn: 'Language',
        sections: [
          { code: '400', nameTh: 'ภาษาศาสตร์เรื่องทั่วไป', nameEn: 'Language' },
          { code: '401', nameTh: 'ปรัชญาและทฤษฎีภาษาศาสตร์', nameEn: 'Philosophy & Theory' },
          { code: '402', nameTh: 'เบ็ดเตล็ดทางภาษา', nameEn: 'Miscellany' },
          { code: '403', nameTh: 'พจนานุกรม สารานุกรมภาษาศาสตร์', nameEn: 'Dictionaries & Encyclopedias' },
          { code: '404', nameTh: 'ข้อเขียนพิเศษทางภาษา', nameEn: 'Special Topics' },
          { code: '405', nameTh: 'สิ่งพิมพ์ต่อเนื่องทางภาษา', nameEn: 'Serial Publications' },
          { code: '406', nameTh: 'องค์การ สมาคมทางภาษา', nameEn: 'Organizations & Study' },
          { code: '407', nameTh: 'การศึกษา และการสอนภาษา', nameEn: 'Education, Research & Teaching' },
          { code: '408', nameTh: 'การใช้งานภาษาตามกลุ่มบุคคล', nameEn: 'Kinds of Persons in Language' },
          { code: '409', nameTh: 'ประวัติศาสตร์ภาษาศาสตร์', nameEn: 'Geographical Treatment' },
        ]
      },
      {
        code: '410',
        nameTh: 'ภาษาศาสตร์ทั่วไป',
        nameEn: 'Linguistics',
        sections: [
          { code: '410', nameTh: 'ภาษาศาสตร์ทั่วไป (Linguistics)', nameEn: 'Linguistics' },
          { code: '411', nameTh: 'ระบบการเขียน และอักขรวิทยา', nameEn: 'Writing Systems' },
          { code: '412', nameTh: 'นิรุกติศาสตร์ (Etymology)', nameEn: 'Etymology' },
          { code: '413', nameTh: 'พจนานุกรมเปรียบเทียบหลายภาษา', nameEn: 'Dictionaries' },
          { code: '414', nameTh: 'สระ และสัจวิทยา (Phonology)', nameEn: 'Phonology & Phonetics' },
          { code: '415', nameTh: 'ไวยากรณ์เปรียบเทียบ (Grammar)', nameEn: 'Grammar' },
          { code: '416', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '417', nameTh: 'ภาษาถิ่น และภาษาศาสตร์เชิงประวัติ', nameEn: 'Dialectology & Historical Linguistics' },
          { code: '418', nameTh: 'ภาษาศาสตร์ประยุกต์ และการแปล', nameEn: 'Standard Usage & Applied Linguistics' },
          { code: '419', nameTh: 'ภาษามือ (Sign Languages)', nameEn: 'Sign Languages' },
        ]
      },
      {
        code: '420',
        nameTh: 'ภาษาอังกฤษ',
        nameEn: 'English & Old English',
        sections: [
          { code: '420', nameTh: 'ภาษาอังกฤษเรื่องทั่วไป', nameEn: 'English' },
          { code: '421', nameTh: 'การเขียน และการออกเสียงภาษาอังกฤษ', nameEn: 'English Writing System & Phonology' },
          { code: '422', nameTh: 'นิรุกติศาสตร์ภาษาอังกฤษ', nameEn: 'English Etymology' },
          { code: '423', nameTh: 'พจนานุกรมภาษาอังกฤษ (English Dictionary)', nameEn: 'English Dictionaries' },
          { code: '424', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '425', nameTh: 'ไวยากรณ์ภาษาอังกฤษ (English Grammar)', nameEn: 'English Grammar' },
          { code: '426', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '427', nameTh: 'ภาษาอังกฤษถิ่น และสำนวนภาษาอังกฤษ', nameEn: 'English Language Variations & Slang' },
          { code: '428', nameTh: 'การใช้ภาษาอังกฤษ (การฟัง พูด อ่าน เขียน)', nameEn: 'Standard English Usage (ESL)' },
          { code: '429', nameTh: 'ภาษาอังกฤษโบราณ (Old English)', nameEn: 'Old English (Anglo-Saxon)' },
        ]
      },
      {
        code: '430',
        nameTh: 'ภาษาเยอรมัน',
        nameEn: 'Germanic Languages',
        sections: [
          { code: '430', nameTh: 'ภาษาเยอรมันเรื่องทั่วไป', nameEn: 'German' },
          { code: '431', nameTh: 'การเขียน การออกเสียงภาษาเยอรมัน', nameEn: 'German Writing & Phonology' },
          { code: '432', nameTh: 'นิรุกติศาสตร์ภาษาเยอรมัน', nameEn: 'German Etymology' },
          { code: '433', nameTh: 'พจนานุกรมภาษาเยอรมัน', nameEn: 'German Dictionaries' },
          { code: '434', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '435', nameTh: 'ไวยากรณ์ภาษาเยอรมัน', nameEn: 'German Grammar' },
          { code: '436', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '437', nameTh: 'ภาษาเยอรมันถิ่น', nameEn: 'German Language Variations' },
          { code: '438', nameTh: 'การใช้ภาษาเยอรมัน', nameEn: 'Standard German Usage' },
          { code: '439', nameTh: 'ภาษาในตระกูลเจอร์แมนิกอื่นๆ (ดัตช์, นอร์เวย์, สวีเดน)', nameEn: 'Other Germanic Languages' },
        ]
      },
      {
        code: '440',
        nameTh: 'ภาษาฝรั่งเศส',
        nameEn: 'Romance Languages & French',
        sections: [
          { code: '440', nameTh: 'ภาษาฝรั่งเศสเรื่องทั่วไป', nameEn: 'French' },
          { code: '441', nameTh: 'การเขียน ออกเสียงภาษาฝรั่งเศส', nameEn: 'French Writing & Phonology' },
          { code: '442', nameTh: 'นิรุกติศาสตร์ภาษาฝรั่งเศส', nameEn: 'French Etymology' },
          { code: '443', nameTh: 'พจนานุกรมภาษาฝรั่งเศส', nameEn: 'French Dictionaries' },
          { code: '444', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '445', nameTh: 'ไวยากรณ์ภาษาฝรั่งเศส', nameEn: 'French Grammar' },
          { code: '446', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '447', nameTh: 'ภาษาฝรั่งเศสถิ่น', nameEn: 'French Language Variations' },
          { code: '448', nameTh: 'การใช้ภาษาฝรั่งเศส', nameEn: 'Standard French Usage' },
          { code: '449', nameTh: 'ภาษาพรอว็องซาล และอ็อกซิตัน', nameEn: 'Occitan & Catalan' },
        ]
      },
      {
        code: '450',
        nameTh: 'ภาษาอิตาลี',
        nameEn: 'Italian, Romanian, Rhaeto-Romanic',
        sections: [
          { code: '450', nameTh: 'ภาษาอิตาลีเรื่องทั่วไป', nameEn: 'Italian' },
          { code: '451', nameTh: 'การเขียน ออกเสียงภาษาอิตาลี', nameEn: 'Italian Writing & Phonology' },
          { code: '452', nameTh: 'นิรุกติศาสตร์ภาษาอิตาลี', nameEn: 'Italian Etymology' },
          { code: '453', nameTh: 'พจนานุกรมภาษาอิตาลี', nameEn: 'Italian Dictionaries' },
          { code: '454', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '455', nameTh: 'ไวยากรณ์ภาษาอิตาลี', nameEn: 'Italian Grammar' },
          { code: '456', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '457', nameTh: 'ภาษาอิตาลีถิ่น', nameEn: 'Italian Language Variations' },
          { code: '458', nameTh: 'การใช้ภาษาอิตาลี', nameEn: 'Standard Italian Usage' },
          { code: '459', nameTh: 'ภาษาโรมาเนีย', nameEn: 'Romanian & Rhaeto-Romanic' },
        ]
      },
      {
        code: '460',
        nameTh: 'ภาษาสเปนและโปรตุเกส',
        nameEn: 'Spanish & Portuguese Languages',
        sections: [
          { code: '460', nameTh: 'ภาษาสเปนเรื่องทั่วไป', nameEn: 'Spanish' },
          { code: '461', nameTh: 'การเขียน ออกเสียงภาษาสเปน', nameEn: 'Spanish Writing & Phonology' },
          { code: '462', nameTh: 'นิรุกติศาสตร์ภาษาสเปน', nameEn: 'Spanish Etymology' },
          { code: '463', nameTh: 'พจนานุกรมภาษาสเปน', nameEn: 'Spanish Dictionaries' },
          { code: '464', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '465', nameTh: 'ไวยากรณ์ภาษาสเปน', nameEn: 'Spanish Grammar' },
          { code: '466', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '467', nameTh: 'ภาษาสเปนถิ่น (ละตินอเมริกา)', nameEn: 'Spanish Language Variations' },
          { code: '468', nameTh: 'การใช้ภาษาสเปน', nameEn: 'Standard Spanish Usage' },
          { code: '469', nameTh: 'ภาษาโปรตุเกส', nameEn: 'Portuguese' },
        ]
      },
      {
        code: '470',
        nameTh: 'ภาษาละติน',
        nameEn: 'Italic Languages & Latin',
        sections: [
          { code: '470', nameTh: 'ภาษาละตินเรื่องทั่วไป', nameEn: 'Latin' },
          { code: '471', nameTh: 'การเขียน ออกเสียงภาษาละติน', nameEn: 'Latin Writing & Phonology' },
          { code: '472', nameTh: 'นิรุกติศาสตร์ภาษาละติน', nameEn: 'Latin Etymology' },
          { code: '473', nameTh: 'พจนานุกรมภาษาละติน', nameEn: 'Latin Dictionaries' },
          { code: '474', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '475', nameTh: 'ไวยากรณ์ภาษาละติน', nameEn: 'Latin Grammar' },
          { code: '476', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '477', nameTh: 'ภาษาละตินยุคแรกและยุคเก่า', nameEn: 'Old & Vulgar Latin' },
          { code: '478', nameTh: 'การใช้ภาษาละตินคลาสสิก', nameEn: 'Classical Latin Usage' },
          { code: '479', nameTh: 'ภาษาในตระกูลอิตาลิกอื่นๆ', nameEn: 'Other Italic Languages' },
        ]
      },
      {
        code: '480',
        nameTh: 'ภาษากรีก',
        nameEn: 'Hellenic Languages & Classical Greek',
        sections: [
          { code: '480', nameTh: 'ภาษากรีกเรื่องทั่วไป', nameEn: 'Classical Greek' },
          { code: '481', nameTh: 'การเขียน ออกเสียงภาษากรีก', nameEn: 'Classical Greek Writing' },
          { code: '482', nameTh: 'นิรุกติศาสตร์ภาษากรีก', nameEn: 'Classical Greek Etymology' },
          { code: '483', nameTh: 'พจนานุกรมภาษากรีก', nameEn: 'Classical Greek Dictionaries' },
          { code: '484', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '485', nameTh: 'ไวยากรณ์ภาษากรีก', nameEn: 'Classical Greek Grammar' },
          { code: '486', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '487', nameTh: 'ภาษากรีกโบราณยุคก่อนคลาสสิก', nameEn: 'Preclassical Greek' },
          { code: '488', nameTh: 'การใช้ภาษากรีกคลาสสิก', nameEn: 'Classical Greek Usage' },
          { code: '489', nameTh: 'ภาษากรีกสมัยใหม่ (Modern Greek)', nameEn: 'Modern Greek' },
        ]
      },
      {
        code: '490',
        nameTh: 'ภาษาอื่นๆ (ภาษาไทย, จีน, ญี่ปุ่น, เกาหลี, อาหรับ)',
        nameEn: 'Other Languages (Thai, Chinese, Japanese, Arabic)',
        sections: [
          { code: '490', nameTh: 'ภาษาอื่นๆ เรื่องทั่วไป', nameEn: 'Other Languages' },
          { code: '491', nameTh: 'ภาษาในตระกูลอินโด-ยูโรเปียน (บาลี, สันสกฤต, ฮินดี)', nameEn: 'Indic Languages (Sanskrit, Pali, Hindi)' },
          { code: '492', nameTh: 'ภาษาในตระกูลแอฟโร-เอเชียติก (ภาษาอาหรับ, ฮีบรู)', nameEn: 'Afro-Asiatic Languages (Arabic, Hebrew)' },
          { code: '493', nameTh: 'ภาษาอียิปต์โบราณ', nameEn: 'Non-Semitic Afro-Asiatic' },
          { code: '494', nameTh: 'ภาษาในตระกูลอัลทาอิก และยูรัลลิก (ตุรกี, ฟินแลนด์)', nameEn: 'Uralic, Altaic, Dravidian Languages' },
          { code: '495', nameTh: 'ภาษาในตระกูลเอเชียตะวันออก (495.91 ภาษาไทย, 495.1 ภาษาจีน, 495.6 ญี่ปุ่น, 495.7 เกาหลี)', nameEn: 'East & Southeast Asian Languages (Thai, Chinese, Japanese, Korean)' },
          { code: '496', nameTh: 'ภาษาในแอฟริกา', nameEn: 'African Languages' },
          { code: '497', nameTh: 'ภาษาอเมริกันอินเดียน', nameEn: 'North American Native Languages' },
          { code: '498', nameTh: 'ภาษาอเมริกาใต้', nameEn: 'South American Native Languages' },
          { code: '499', nameTh: 'ภาษาออสโตรนีเซียน และประดิษฐ์ขึ้น (เอสเปรันโต)', nameEn: 'Austronesian & Artificial Languages' },
        ]
      }
    ]
  },
  {
    code: '500',
    range: '500 - 599',
    nameTh: 'วิทยาศาสตร์บริสุทธิ์',
    nameEn: 'Natural Sciences & Mathematics',
    icon: '🔬',
    color: 'border-teal-500 bg-teal-50 text-teal-700 font-semibold',
    divisions: [
      {
        code: '500',
        nameTh: 'วิทยาศาสตร์บริสุทธิ์เรื่องทั่วไป',
        nameEn: 'Natural Sciences & Mathematics',
        sections: [
          { code: '500', nameTh: 'วิทยาศาสตร์บริสุทธิ์เรื่องทั่วไป', nameEn: 'Natural Sciences & Mathematics' },
          { code: '501', nameTh: 'ปรัชญาและทฤษฎีทางวิทยาศาสตร์', nameEn: 'Philosophy & Theory' },
          { code: '502', nameTh: 'เครื่องมือและอุปกรณ์ทางวิทยาศาสตร์', nameEn: 'Miscellany' },
          { code: '503', nameTh: 'พจนานุกรม สารานุกรมวิทยาศาสตร์', nameEn: 'Dictionaries & Encyclopedias' },
          { code: '504', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '505', nameTh: 'สิ่งพิมพ์ต่อเนื่องทางวิทยาศาสตร์', nameEn: 'Serial Publications' },
          { code: '506', nameTh: 'องค์การ สมาคมทางวิทยาศาสตร์', nameEn: 'Organizations' },
          { code: '507', nameTh: 'การศึกษา และการสอนวิทยาศาสตร์', nameEn: 'Education, Research, Related Topics' },
          { code: '508', nameTh: 'ประวัติธรรมชาติ (Natural History)', nameEn: 'Natural History' },
          { code: '509', nameTh: 'ประวัติศาสตร์วิทยาศาสตร์', nameEn: 'Historical, Geographic, Persons Treatment' },
        ]
      },
      {
        code: '510',
        nameTh: 'คณิตศาสตร์',
        nameEn: 'Mathematics',
        sections: [
          { code: '510', nameTh: 'คณิตศาสตร์เรื่องทั่วไป', nameEn: 'Mathematics' },
          { code: '511', nameTh: 'หลักการทั่วไปทางคณิตศาสตร์ และคณิตศาสตร์ดิสครีต', nameEn: 'General Principles of Mathematics' },
          { code: '512', nameTh: 'พีชคณิต (Algebra)', nameEn: 'Algebra' },
          { code: '513', nameTh: 'เลขคณิต (Arithmetic)', nameEn: 'Arithmetic' },
          { code: '514', nameTh: 'โทโพโลยี (Topology)', nameEn: 'Topology' },
          { code: '515', nameTh: 'แคลคูลัสและการวิเคราะห์ (Calculus & Analysis)', nameEn: 'Analysis (Calculus)' },
          { code: '516', nameTh: 'เรขาคณิต (Geometry)', nameEn: 'Geometry' },
          { code: '517', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '518', nameTh: 'การวิเคราะห์เชิงตัวเลข (Numerical Analysis)', nameEn: 'Numerical Analysis' },
          { code: '519', nameTh: 'ความน่าจะเป็น สถิติศาสตร์ และคณิตศาสตร์ประยุกต์', nameEn: 'Probabilities & Applied Mathematics' },
        ]
      },
      {
        code: '520',
        nameTh: 'ดาราศาสตร์',
        nameEn: 'Astronomy & Allied Sciences',
        sections: [
          { code: '520', nameTh: 'ดาราศาสตร์เรื่องทั่วไป', nameEn: 'Astronomy & Allied Sciences' },
          { code: '521', nameTh: 'กลศาสตร์ท้องฟ้า (Celestial Mechanics)', nameEn: 'Celestial Mechanics' },
          { code: '522', nameTh: 'เทคนิค อุปกรณ์ และหอดูดาว', nameEn: 'Techniques, Equipment & Materials' },
          { code: '523', nameTh: 'ดาราศาสตร์อธิบายวัตถุท้องฟ้า (ดาวเคราะห์, ดวงอาทิตย์)', nameEn: 'Specific Celestial Bodies & Phenomena' },
          { code: '524', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '525', nameTh: 'โลกในเชิงดาราศาสตร์', nameEn: 'Earth (Astronomical Geography)' },
          { code: '526', nameTh: 'ภูมิมาตรศาสตร์ และการสร้างแผนที่ (Cartography)', nameEn: 'Mathematical Geography' },
          { code: '527', nameTh: 'ดาราศาสตร์สำหรับการเดินเรือ', nameEn: 'Celestial Navigation' },
          { code: '528', nameTh: 'ปฏิทินดาราศาสตร์ (Ephemerides)', nameEn: 'Ephemerides' },
          { code: '529', nameTh: 'ลำดับเวลา และปฏิทิน (Chronology)', nameEn: 'Chronology (Calendars, Time)' },
        ]
      },
      {
        code: '530',
        nameTh: 'ฟิสิกส์',
        nameEn: 'Physics',
        sections: [
          { code: '530', nameTh: 'ฟิสิกส์เรื่องทั่วไป', nameEn: 'Physics' },
          { code: '531', nameTh: 'กลศาสตร์ดั้งเดิม (Classical Mechanics)', nameEn: 'Classical Mechanics' },
          { code: '532', nameTh: 'กลศาสตร์ของไหล (Fluid Mechanics)', nameEn: 'Fluid Mechanics' },
          { code: '533', nameTh: 'กลศาสตร์ก๊าซ (Gas Mechanics)', nameEn: 'Pneumatics (Gas Mechanics)' },
          { code: '534', nameTh: 'เสียง และคลื่นเสียง (Acoustics Sound)', nameEn: 'Sound & Related Vibrations' },
          { code: '535', nameTh: 'แสง และทัศนศาสตร์ (Light & Optics)', nameEn: 'Light & Infrared Phenomena' },
          { code: '536', nameTh: 'ความร้อน และอุณหโมดายนิกส์ (Heat & Thermodynamics)', nameEn: 'Heat' },
          { code: '537', nameTh: 'ไฟฟ้า และอิเล็กทรอนิกส์พื้นฐาน', nameEn: 'Electricity & Electronics' },
          { code: '538', nameTh: 'แม่เหล็ก และสนามแม่เหล็ก (Magnetism)', nameEn: 'Magnetism' },
          { code: '539', nameTh: 'ฟิสิกส์สมัยใหม่ (อะตอม, นิวเคลียร์, ควอนตัม)', nameEn: 'Modern Physics (Quantum, Atomic)' },
        ]
      },
      {
        code: '540',
        nameTh: 'เคมี',
        nameEn: 'Chemistry & Allied Sciences',
        sections: [
          { code: '540', nameTh: 'เคมีเรื่องทั่วไป', nameEn: 'Chemistry' },
          { code: '541', nameTh: 'เคมีเชิงฟิสิกส์ (Physical Chemistry)', nameEn: 'Physical Chemistry' },
          { code: '542', nameTh: 'เทคนิค อุปกรณ์ และห้องปฏิบัติการเคมี', nameEn: 'Techniques, Equipment, Materials' },
          { code: '543', nameTh: 'เคมีวิเคราะห์ (Analytical Chemistry)', nameEn: 'Analytical Chemistry' },
          { code: '544', nameTh: 'การวิเคราะห์เชิงคุณภาพ', nameEn: 'Qualitative Analysis' },
          { code: '545', nameTh: 'การวิเคราะห์เชิงปริมาณ', nameEn: 'Quantitative Analysis' },
          { code: '546', nameTh: 'เคมีอนินทรีย์ (Inorganic Chemistry)', nameEn: 'Inorganic Chemistry' },
          { code: '547', nameTh: 'เคมีอินทรีย์ (Organic Chemistry)', nameEn: 'Organic Chemistry' },
          { code: '548', nameTh: 'ผลึกศาสตร์ (Crystallography)', nameEn: 'Crystallography' },
          { code: '549', nameTh: 'แร่วิทยา (Mineralogy)', nameEn: 'Mineralogy' },
        ]
      },
      {
        code: '550',
        nameTh: 'ธรณีวิทยา และวิทยาศาสตร์โลก',
        nameEn: 'Earth Sciences',
        sections: [
          { code: '550', nameTh: 'ธรณีวิทยา และวิทยาศาสตร์โลก', nameEn: 'Earth Sciences' },
          { code: '551', nameTh: 'ธรณีวิทยา อุตุนิยมวิทยา และสภาพอากาศ', nameEn: 'Geology, Meteorology, Climate' },
          { code: '552', nameTh: 'เพชรศาสตร์ และหินวิทยา (Petrology)', nameEn: 'Petrology (Rocks)' },
          { code: '553', nameTh: 'ธรณีวิทยาเศรษฐกิจ (แร่ธาตุ, น้ำมัน, แก๊ส)', nameEn: 'Economic Geology' },
          { code: '554', nameTh: 'ธรณีวิทยาในยุโรป', nameEn: 'Earth Sciences of Europe' },
          { code: '555', nameTh: 'ธรณีวิทยาในเอเชีย (ธรณีวิทยาประเทศไทย)', nameEn: 'Earth Sciences of Asia (Thailand)' },
          { code: '556', nameTh: 'ธรณีวิทยาในแอฟริกา', nameEn: 'Earth Sciences of Africa' },
          { code: '557', nameTh: 'ธรณีวิทยาในอเมริกาเหนือ', nameEn: 'Earth Sciences of North America' },
          { code: '558', nameTh: 'ธรณีวิทยาในอเมริกาใต้', nameEn: 'Earth Sciences of South America' },
          { code: '559', nameTh: 'ธรณีวิทยาในส่วนอื่นๆ ของโลก', nameEn: 'Earth Sciences of Other Areas' },
        ]
      },
      {
        code: '560',
        nameTh: 'บรรพชีวินวิทยา ซากดึกดำบรรพ์',
        nameEn: 'Paleontology & Paleozoology',
        sections: [
          { code: '560', nameTh: 'บรรพชีวินวิทยา (Paleontology)', nameEn: 'Paleontology' },
          { code: '561', nameTh: 'บรรพพฤกษศาสตร์ (พืชดึกดำบรรพ์)', nameEn: 'Paleobotany' },
          { code: '562', nameTh: 'ซากดึกดำบรรพ์สัตว์ไม่มีกระดูกสันหลัง', nameEn: 'Fossil Invertebrates' },
          { code: '563', nameTh: 'ซากดึกดำบรรพ์สัตว์ทะเลดึกดำบรรพ์', nameEn: 'Fossil Marine Invertebrates' },
          { code: '564', nameTh: 'ซากดึกดำบรรพ์หอยและสัตว์มีเปลือก', nameEn: 'Fossil Mollusks' },
          { code: '565', nameTh: 'ซากดึกดำบรรพ์แมลงและแมง', nameEn: 'Fossil Arthropods' },
          { code: '566', nameTh: 'ซากดึกดำบรรพ์สัตว์มีกระดูกสันหลัง', nameEn: 'Fossil Vertebrates' },
          { code: '567', nameTh: 'ซากดึกดำบรรพ์สัตว์เลือดเย็น (ปลา, ไดโนเสาร์)', nameEn: 'Fossil Cold-Blooded Vertebrates (Dinosaurs)' },
          { code: '568', nameTh: 'ซากดึกดำบรรพ์นก', nameEn: 'Fossil Birds' },
          { code: '569', nameTh: 'ซากดึกดำบรรพ์สัตว์เลี้ยงลูกด้วยนม', nameEn: 'Fossil Mammals' },
        ]
      },
      {
        code: '570',
        nameTh: 'วิทยาศาสตร์ชีวภาพ ชีววิทยา',
        nameEn: 'Life Sciences & Biology',
        sections: [
          { code: '570', nameTh: 'วิทยาศาสตร์ชีวภาพ และชีววิทยาเรื่องทั่วไป', nameEn: 'Life Sciences & Biology' },
          { code: '571', nameTh: 'สรีรวิทยา และระบบชีวภาพ', nameEn: 'Physiology & Related Subjects' },
          { code: '572', nameTh: 'ชีวเคมี (Biochemistry)', nameEn: 'Biochemistry' },
          { code: '573', nameTh: 'ระบบอวัยวะเฉพาะในสัตว์', nameEn: 'Specific Physiological Systems' },
          { code: '574', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '575', nameTh: 'ระบบสรีรวิทยาเฉพาะในพืช', nameEn: 'Specific Physiological Systems in Plants' },
          { code: '576', nameTh: 'พันธุศาสตร์ และวิวัฒนาการ (Genetics & Evolution)', nameEn: 'Genetics & Evolution' },
          { code: '577', nameTh: 'นิเวศวิทยา และสิ่งแวดล้อม (Ecology)', nameEn: 'Ecology' },
          { code: '578', nameTh: 'ประวัติธรรมชาติของสิ่งมีชีวิต', nameEn: 'Natural History of Organisms' },
          { code: '579', nameTh: 'จุลชีววิทยา ( Microorganisms, Fungi, Algae)', nameEn: 'Microorganisms, Fungi, Algae' },
        ]
      },
      {
        code: '580',
        nameTh: 'พฤกษศาสตร์ พืช',
        nameEn: 'Plants (Botany)',
        sections: [
          { code: '580', nameTh: 'พฤกษศาสตร์ และพืชเรื่องทั่วไป', nameEn: 'Plants (Botany)' },
          { code: '581', nameTh: 'หัวข้อเฉพาะทางพฤกษศาสตร์', nameEn: 'Specific Topics in Botany' },
          { code: '582', nameTh: 'พืชมีท่อลำเลียง และพืชดอก', nameEn: 'Plants Notable for Characteristics' },
          { code: '583', nameTh: 'พืชใบเลี้ยงคู่ (Dicotyledons)', nameEn: 'Magnoliopsida (Dicotyledons)' },
          { code: '584', nameTh: 'พืชใบเลี้ยงเดี่ยว (Monocotyledons - กล้วยไม้, ข้าว)', nameEn: 'Liliopsida (Monocotyledons)' },
          { code: '585', nameTh: 'พืชเมล็ดเปลือย (Gymnosperms - สน)', nameEn: 'Pinophyta (Conifers)' },
          { code: '586', nameTh: 'พืชไม่มีเมล็ด (Cryptogamia)', nameEn: 'Cryptogamia (Seedless Plants)' },
          { code: '587', nameTh: 'เฟิร์น (Pteridophyta)', nameEn: 'Pteridophyta (Ferns)' },
          { code: '588', nameTh: 'มอสส์ และลิเวอร์เวิร์ต (Bryophyta)', nameEn: 'Bryophyta (Mosses)' },
          { code: '589', nameTh: 'สาหร่าย และเห็ดรา (Algae & Fungi)', nameEn: 'Forestry' },
        ]
      },
      {
        code: '590',
        nameTh: 'สัตววิทยา สัตว์',
        nameEn: 'Animals (Zoology)',
        sections: [
          { code: '590', nameTh: 'สัตววิทยา และสัตว์เรื่องทั่วไป', nameEn: 'Animals (Zoology)' },
          { code: '591', nameTh: 'หัวข้อเฉพาะทางสัตววิทยา (พฤติกรรมสัตว์)', nameEn: 'Specific Topics in Zoology' },
          { code: '592', nameTh: 'สัตว์ไม่มีกระดูกสันหลัง (Invertebrates)', nameEn: 'Invertebrates' },
          { code: '593', nameTh: 'สัตว์ตัวแบน ปะการัง ฟองน้ำ', nameEn: 'Marine & Seashore Invertebrates' },
          { code: '594', nameTh: 'หอย และสัตว์มีเปลือก (Mollusks)', nameEn: 'Mollusks & Molluscoids' },
          { code: '595', nameTh: 'แมลง แมง กุ้ง กั้ง ปู (Arthropods & Insects)', nameEn: 'Arthropods (Insects, Spiders)' },
          { code: '596', nameTh: 'สัตว์มีกระดูกสันหลัง (Vertebrates)', nameEn: 'Vertebrates' },
          { code: '597', nameTh: 'ปลา สัตว์ครึ่งน้ำครึ่งบก และสัตว์เลื้อยคลาน', nameEn: 'Cold-Blooded Vertebrates (Fishes, Reptiles)' },
          { code: '598', nameTh: 'นก และปักษีวิทยา (Birds / Ornithology)', nameEn: 'Birds (Aves)' },
          { code: '599', nameTh: 'สัตว์เลี้ยงลูกด้วยนม (Mammals)', nameEn: 'Mammals (Mammalia)' },
        ]
      }
    ]
  },
  {
    code: '600',
    range: '600 - 699',
    nameTh: 'วิทยาศาสตร์ประยุกต์ และเทคโนโลยี',
    nameEn: 'Technology (Applied Sciences)',
    icon: '⚙️',
    color: 'border-blue-500 bg-blue-50 text-blue-700 font-semibold',
    divisions: [
      {
        code: '600',
        nameTh: 'เทคโนโลยี และวิทยาศาสตร์ประยุกต์',
        nameEn: 'Technology (Applied Sciences)',
        sections: [
          { code: '600', nameTh: 'เทคโนโลยีเรื่องทั่วไป', nameEn: 'Technology' },
          { code: '601', nameTh: 'ปรัชญาและทฤษฎีทางเทคโนโลยี', nameEn: 'Philosophy & Theory' },
          { code: '602', nameTh: 'เบ็ดเตล็ด สิ่งประดิษฐ์ สิทธิบัตร', nameEn: 'Miscellany & Patents' },
          { code: '603', nameTh: 'พจนานุกรม สารานุกรมเทคโนโลยี', nameEn: 'Dictionaries & Encyclopedias' },
          { code: '604', nameTh: 'เทคนิคการเขียนแบบ และการออกแบบอุตสาหกรรม', nameEn: 'Technical Drawing & Topics' },
          { code: '605', nameTh: 'สิ่งพิมพ์ต่อเนื่องทางเทคโนโลยี', nameEn: 'Serial Publications' },
          { code: '606', nameTh: 'องค์การ สมาคม และงานแสดงนวัตกรรม', nameEn: 'Organizations' },
          { code: '607', nameTh: 'การศึกษา และการวิจัยทางเทคโนโลยี', nameEn: 'Education, Research, Related Topics' },
          { code: '608', nameTh: 'สิทธิบัตร นวัตกรรม และสิ่งประดิษฐ์', nameEn: 'Inventions & Patents' },
          { code: '609', nameTh: 'ประวัติศาสตร์เทคโนโลยี', nameEn: 'Historical Treatment' },
        ]
      },
      {
        code: '610',
        nameTh: 'แพทยศาสตร์ และเวชศาสตร์',
        nameEn: 'Medicine & Health',
        sections: [
          { code: '610', nameTh: 'แพทยศาสตร์ และสุขภาพเรื่องทั่วไป', nameEn: 'Medicine & Health' },
          { code: '611', nameTh: 'กายวิภาคศาสตร์ (Anatomy)', nameEn: 'Human Anatomy' },
          { code: '612', nameTh: 'สรีรวิทยา (Human Physiology)', nameEn: 'Human Physiology' },
          { code: '613', nameTh: 'สุขอนามัย สุขภาพ โภชนาการ และการออกกำลังกาย', nameEn: 'Personal Health & Hygiene' },
          { code: '614', nameTh: 'สาธารณสุขศาสตร์ และเวชศาสตร์ป้องกัน', nameEn: 'Public Health & Preventive Medicine' },
          { code: '615', nameTh: 'เภสัชวิทยา เภสัชกรรม ยา และการบำบัดโรค', nameEn: 'Pharmacology & Therapeutics' },
          { code: '616', nameTh: 'พยาธิวิทยา และเวชศาสตร์คลินิก (โรคและการรักษา)', nameEn: 'Diseases (Clinical Medicine)' },
          { code: '617', nameTh: 'ศัลยศาสตร์ การผ่าตัด ทันตกรรม', nameEn: 'Surgery & Dentistry' },
          { code: '618', nameTh: 'สูติศาสตร์ กุมารเวชศาสตร์ นรีเวชวิทยา', nameEn: 'Gynecology, Obstetrics, Pediatrics' },
          { code: '619', nameTh: 'พยาบาลศาสตร์ (Nursing)', nameEn: 'Nursing & Allied Health' },
        ]
      },
      {
        code: '620',
        nameTh: 'วิศวกรรมศาสตร์',
        nameEn: 'Engineering & Allied Operations',
        sections: [
          { code: '620', nameTh: 'วิศวกรรมศาสตร์เรื่องทั่วไป', nameEn: 'Engineering & Applied Physics' },
          { code: '621', nameTh: 'วิศวกรรมไฟฟ้า อิเล็กทรอนิกส์ และพลังงาน', nameEn: 'Applied Physics (Electrical Engineering)' },
          { code: '622', nameTh: 'วิศวกรรมเหมืองแร่', nameEn: 'Mining & Related Operations' },
          { code: '623', nameTh: 'วิศวกรรมทหาร และวิศวกรรมนาวี', nameEn: 'Military & Naval Engineering' },
          { code: '624', nameTh: 'วิศวกรรมโยธา และโครงสร้าง', nameEn: 'Civil Engineering' },
          { code: '625', nameTh: 'วิศวกรรมทางหลวง ถนน และทางรถไฟ', nameEn: 'Railroads & Roads Engineering' },
          { code: '626', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '627', nameTh: 'วิศวกรรมชลประทาน ท่าเรือ และทางน้ำ', nameEn: 'Hydraulic Engineering' },
          { code: '628', nameTh: 'วิศวกรรมสิ่งแวดล้อม และสุขาภิบาล', nameEn: 'Sanitary & Environmental Engineering' },
          { code: '629', nameTh: 'วิศวกรรมยานยนต์ ยานอวกาศ หุ่นยนต์ และโดรน', nameEn: 'Other Branches (Automotive, Robotics)' },
        ]
      },
      {
        code: '630',
        nameTh: 'เกษตรศาสตร์ และเทคโนโลยีการเกษตร',
        nameEn: 'Agriculture & Related Technologies',
        sections: [
          { code: '630', nameTh: 'เกษตรศาสตร์เรื่องทั่วไป', nameEn: 'Agriculture' },
          { code: '631', nameTh: 'เทคนิคการเกษตร ดิน ปุ๋ย เครื่องจักรกลการเกษตร', nameEn: 'Techniques, Equipment, Materials' },
          { code: '632', nameTh: 'โรคพืช ศัตรูพืช และการกำจัดวัชพืช', nameEn: 'Plant Injuries, Diseases, Pests' },
          { code: '633', nameTh: 'พืชไร่ ข้าว พืชเศรษฐกิจ', nameEn: 'Field & Plantation Crops (Rice)' },
          { code: '634', nameTh: 'พืชสวน ไม้ผล การทำป่าไม้ (Forestry)', nameEn: 'Orchards, Fruits, Forestry' },
          { code: '635', nameTh: 'พืชผัก สวนครัว และพืชไม้ดอกไม้ประดับ', nameEn: 'Horticulture (Vegetables, Flowers)' },
          { code: '636', nameTh: 'สัตวบาล สัตวแพทย์ และการเลี้ยงสัตว์', nameEn: 'Animal Husbandry (Livestock)' },
          { code: '637', nameTh: 'อุตสาหกรรมนม และผลิตภัณฑ์จากนม', nameEn: 'Dairy Processing' },
          { code: '638', nameTh: 'การเลี้ยงแมลงเศรษฐกิจ (การเลี้ยงผึ้ง, หม่อนไหม)', nameEn: 'Insect Culture (Beekeeping, Sericulture)' },
          { code: '639', nameTh: 'การประมง การเลี้ยงสัตว์น้ำ และการล่าสัตว์', nameEn: 'Hunting, Fishing, Aquaculture' },
        ]
      },
      {
        code: '640',
        nameTh: 'คหกรรมศาสตร์และการจัดการชีวิตครอบครัว',
        nameEn: 'Home Economics & Family Living',
        sections: [
          { code: '640', nameTh: 'คหกรรมศาสตร์เรื่องทั่วไป', nameEn: 'Home Economics & Family Living' },
          { code: '641', nameTh: 'อาหาร การปรุงอาหาร และเครื่องดื่ม (Cookbooks)', nameEn: 'Food & Drink (Cooking, Recipes)' },
          { code: '642', nameTh: 'การจัดเลี้ยง โต๊ะอาหาร และภัตตาคาร', nameEn: 'Meals & Table Service' },
          { code: '643', nameTh: 'การจัดการบ้าน ที่อยู่อาศัย และอุปกรณ์ตกแต่ง', nameEn: 'Housing & Household Equipment' },
          { code: '644', nameTh: 'สาธารณูปโภคในบ้าน (ระบบไฟ, น้ำ, ความร้อน)', nameEn: 'Household Utilities' },
          { code: '645', nameTh: 'การตกแต่งภายในบ้าน เฟอร์นิเจอร์', nameEn: 'Household Furnishings' },
          { code: '646', nameTh: 'การตัดเย็บ เสื้อผ้า แฟชั่น และการดูแลตนเอง', nameEn: 'Sewing, Clothing & Personal Living' },
          { code: '647', nameTh: 'การบริหารโรงแรม ที่พัก และสถานบริการ', nameEn: 'Management of Public Households (Hotels)' },
          { code: '648', nameTh: 'การทำความสะอาด กำจัดสิ่งปฏิกูลในบ้าน', nameEn: 'Housekeeping' },
          { code: '649', nameTh: 'การเลี้ยงดูเด็ก การดูแลผู้ป่วยในบ้าน', nameEn: 'Child Rearing & Home Care' },
        ]
      },
      {
        code: '650',
        nameTh: 'การบริหารธุรกิจ การจัดการ และการบัญชี',
        nameEn: 'Management, Business & Accounting',
        sections: [
          { code: '650', nameTh: 'การบริหารธุรกิจเรื่องทั่วไป', nameEn: 'Management & Auxiliary Services' },
          { code: '651', nameTh: 'งานสารบรรณ งานสำนักงาน และเอกสาร', nameEn: 'Office Services (Secretarial)' },
          { code: '652', nameTh: 'การสื่อสารในงานสำนักงาน การพิมพ์ดีด', nameEn: 'Processes of Written Communication' },
          { code: '653', nameTh: 'การเขียนย่อความ ชอร์ทแฮนด์', nameEn: 'Shorthand' },
          { code: '654', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '655', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '656', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '657', nameTh: 'การบัญชี และการตรวจสอบบัญชี (Accounting)', nameEn: 'Accounting & Auditing' },
          { code: '658', nameTh: 'การจัดการ การบริหารธุรกิจ และทรัพยากรบุคคล (Management & HR)', nameEn: 'General Management & Executive Leadership' },
          { code: '659', nameTh: 'การประชาสัมพันธ์ และการโฆษณา (PR & Advertising)', nameEn: 'Advertising & Public Relations' },
        ]
      },
      {
        code: '660',
        nameTh: 'วิศวกรรมเคมี และเทคโนโลยีเคมี',
        nameEn: 'Chemical Engineering & Related Technologies',
        sections: [
          { code: '660', nameTh: 'วิศวกรรมเคมีเทคโนโลยีอุตสาหกรรม', nameEn: 'Chemical Engineering' },
          { code: '661', nameTh: 'เคมีอุตสาหกรรมขั้นพื้นฐาน', nameEn: 'Industrial Chemicals Technology' },
          { code: '662', nameTh: 'เทคโนโลยีระเบิด เชื้อเพลิง ดอกไม้ไฟ', nameEn: 'Explosives, Fuels & Related Products' },
          { code: '663', nameTh: 'เทคโนโลยีเครื่องดื่ม (เบียร์, ไวน์, น้ำอัดลม)', nameEn: 'Beverage Technology' },
          { code: '664', nameTh: 'เทคโนโลยีอาหาร และการถนอมอาหาร (Food Technology)', nameEn: 'Food Technology' },
          { code: '665', nameTh: 'เทคโนโลยีน้ำมัน แก๊ส ไขมัน และขี้ผึ้ง', nameEn: 'Industrial Oils, Fats, Waxes, Gases' },
          { code: '666', nameTh: 'เทคโนโลยีเซรามิก แก้ว และอิฐ', nameEn: 'Ceramic & Allied Technologies' },
          { code: '667', nameTh: 'เทคโนโลยีการย้อม สี ทาสี และสารทำความสะอาด', nameEn: 'Cleaning, Color & Coating Technologies' },
          { code: '668', nameTh: 'เทคโนโลยีพลาสติก ยาง สารอินทรีย์ประดิษฐ์', nameEn: 'Technology of Other Organic Products (Plastics)' },
          { code: '669', nameTh: 'โลหการ และการถลุงโลหะ (Metallurgy)', nameEn: 'Metallurgy' },
        ]
      },
      {
        code: '670',
        nameTh: 'การอุตสาหกรรมการผลิต',
        nameEn: 'Manufacturing',
        sections: [
          { code: '670', nameTh: 'อุตสาหกรรมการผลิตเรื่องทั่วไป', nameEn: 'Manufacturing' },
          { code: '671', nameTh: 'อุตสาหกรรมโลหะและการเชื่อมโลหะ', nameEn: 'Metalworking & Metal Products' },
          { code: '672', nameTh: 'อุตสาหกรรมเหล็กและเหล็กกล้า', nameEn: 'Iron, Steel, Other Iron Alloys' },
          { code: '673', nameTh: 'อุตสาหกรรมโลหะนอกกลุ่มเหล็ก (อลูมิเนียม)', nameEn: 'Nonferrous Metals' },
          { code: '674', nameTh: 'อุตสาหกรรมแปรรูปไม้ และโรงเลื่อย', nameEn: 'Lumber, Wood Products, Cork' },
          { code: '675', nameTh: 'อุตสาหกรรมเครื่องหนัง และหนังแท้', nameEn: 'Leather & Fur Processing' },
          { code: '676', nameTh: 'อุตสาหกรรมเยื่อกระดาษ และกระดาษ', nameEn: 'Pulp & Paper Technology' },
          { code: '677', nameTh: 'อุตสาหกรรมสิ่งทอ และเส้นใย', nameEn: 'Textiles' },
          { code: '678', nameTh: 'อุตสาหกรรมยางพารา และยางสังเคราะห์', nameEn: 'Elastomers & Elastomer Products (Rubber)' },
          { code: '679', nameTh: 'อุตสาหกรรมสิ่งประดิษฐ์จากวัสดุอื่นๆ', nameEn: 'Other Products of Specific Materials' },
        ]
      },
      {
        code: '680',
        nameTh: 'การผลิตสินค้าเฉพาะอย่าง',
        nameEn: 'Manufacture for Specific Uses',
        sections: [
          { code: '680', nameTh: 'การผลิตสินค้าเฉพาะอย่าง', nameEn: 'Manufacture for Specific Uses' },
          { code: '681', nameTh: 'การผลิตเครื่องมือแม่นยำ นาฬิกา เครื่องดนตรี', nameEn: 'Precision Instruments & Clockmaking' },
          { code: '682', nameTh: 'การช่างตีเหล็ก และงานช่างโลหะเบา', nameEn: 'Small Forge Work (Blacksmithing)' },
          { code: '683', nameTh: 'การผลิตเครื่องโลหะ อาวุธ และกุญแจ', nameEn: 'Hardware & Household Appliances' },
          { code: '684', nameTh: 'การทำเฟอร์นิเจอร์ และงานไม้DIY', nameEn: 'Furnishings & Home Workshops' },
          { code: '685', nameTh: 'การผลิตรองเท้า และเครื่องเดินทาง', nameEn: 'Leather, Fur & Related Goods (Footwear)' },
          { code: '686', nameTh: 'การพิมพ์ การเข้าเล่มหนังสือ และการทำสำเนา', nameEn: 'Printing & Related Activities (Bookbinding)' },
          { code: '687', nameTh: 'การผลิตเสื้อผ้าสำเร็จรูป (Garments)', nameEn: 'Clothing & Accessories' },
          { code: '688', nameTh: 'การผลิตของเล่น และสินค้าเบ็ดเตล็ด', nameEn: 'Other Final Products & Toys' },
          { code: '689', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      },
      {
        code: '690',
        nameTh: 'การก่อสร้าง และอาคาร',
        nameEn: 'Construction of Buildings',
        sections: [
          { code: '690', nameTh: 'การก่อสร้าง และอาคารเรื่องทั่วไป', nameEn: 'Construction of Buildings' },
          { code: '691', nameTh: 'วัสดุก่อสร้าง (คอนกรีต, อิฐ, ไม้)', nameEn: 'Building Materials' },
          { code: '692', nameTh: 'ขั้นตอนการก่อสร้าง ถอดแบบ ประเมินราคา', nameEn: 'Auxiliary Construction Practices' },
          { code: '693', nameTh: 'การก่อสร้างด้วยวัสดุเฉพาะ (คอนกรีตเสริมเหล็ก)', nameEn: 'Construction in Specific Materials' },
          { code: '694', nameTh: 'งานไม้ก่อสร้าง และช่างไม้โครงสร้าง', nameEn: 'Wood Construction (Carpentry)' },
          { code: '695', nameTh: 'การทำหลังคา และการกันซึม', nameEn: 'Roof Covering' },
          { code: '696', nameTh: 'งานระบบประปา และสุขาภิบาลในอาคาร', nameEn: 'Utilities (Plumbing)' },
          { code: '697', nameTh: 'งานระบบปรับอากาศ เครื่องทำความเย็น ความร้อน', nameEn: 'Heating, Ventilating, Air-Conditioning' },
          { code: '698', nameTh: 'งานตกแต่งผิวอาคาร การทาสี และการติดวอลเปเปอร์', nameEn: 'Detail Finishes (Painting, Wallpaper)' },
          { code: '699', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      }
    ]
  },
  {
    code: '700',
    range: '700 - 799',
    nameTh: 'ศิลปะ และนันทนาการ',
    nameEn: 'Arts & Recreation',
    icon: '🎨',
    color: 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 font-semibold',
    divisions: [
      {
        code: '700',
        nameTh: 'ศิลปะ และความบันเทิงเรื่องทั่วไป',
        nameEn: 'Arts & Recreation',
        sections: [
          { code: '700', nameTh: 'ศิลปะเรื่องทั่วไป', nameEn: 'The Arts' },
          { code: '701', nameTh: 'ปรัชญา และสุนทรียศาสตร์ (Aesthetics)', nameEn: 'Philosophy & Theory of Fine Arts' },
          { code: '702', nameTh: 'เทคนิค และอุปกรณ์ทางศิลปะ', nameEn: 'Miscellany of Fine Arts' },
          { code: '703', nameTh: 'พจนานุกรม สารานุกรมศิลปะ', nameEn: 'Dictionaries & Encyclopedias' },
          { code: '704', nameTh: 'ศิลปะเฉพาะกลุ่มประเด็น', nameEn: 'Special Topics in Fine Arts' },
          { code: '705', nameTh: 'สิ่งพิมพ์ต่อเนื่องทางศิลปะ', nameEn: 'Serial Publications' },
          { code: '706', nameTh: 'องค์การ สมาคม และการประมูลศิลปะ', nameEn: 'Organizations & Art Trade' },
          { code: '707', nameTh: 'การศึกษา และการสอนศิลปะ', nameEn: 'Education, Research, Related Topics' },
          { code: '708', nameTh: 'หอศิลป์ พิพิธภัณฑ์ และคอลเลกชันศิลปะ', nameEn: 'Galleries, Museums, Private Collections' },
          { code: '709', nameTh: 'ประวัติศาสตร์ศิลปะ (Art History)', nameEn: 'Historical, Geographic Treatment of Art' },
        ]
      },
      {
        code: '710',
        nameTh: 'การออกแบบภูมิทัศน์ และผังเมือง',
        nameEn: 'Area Planning & Landscape Architecture',
        sections: [
          { code: '710', nameTh: 'การออกแบบภูมิทัศน์ และผังเมือง', nameEn: 'Landscape Architecture' },
          { code: '711', nameTh: 'การผังเมือง และการจัดสรรพื้นที่ (Urban Planning)', nameEn: 'Area Planning (Civic Art)' },
          { code: '712', nameTh: 'สถาปัตยกรรมภูมิทัศน์ และการจัดสวน', nameEn: 'Landscape Design (Gardening)' },
          { code: '713', nameTh: 'การออกแบบเส้นทาง และถนนสวยงาม', nameEn: 'Landscape Design of Traffic Ways' },
          { code: '714', nameTh: 'การออกแบบภูมิทัศน์ทางน้ำ (น้ำพุ, สระน้ำ)', nameEn: 'Water Features in Landscape Design' },
          { code: '715', nameTh: 'การใช้พืชไม้ยืนต้นในการจัดสวน', nameEn: 'Woody Plants in Landscape Design' },
          { code: '716', nameTh: 'การใช้พืชไม้ดอกในการจัดสวน', nameEn: 'Herbaceous Plants in Landscape Design' },
          { code: '717', nameTh: 'สิ่งก่อสร้างประดับสวน (ศาลา, ซุ้มไม้)', nameEn: 'Structures in Landscape Design' },
          { code: '718', nameTh: 'การออกแบบสุสาน และฌาปนสถาน', nameEn: 'Landscape Design of Cemeteries' },
          { code: '719', nameTh: 'อุทยานแห่งชาติ และพื้นที่อนุรักษ์ธรรมชาติ', nameEn: 'Natural Landscapes (National Parks)' },
        ]
      },
      {
        code: '720',
        nameTh: 'สถาปัตยกรรม',
        nameEn: 'Architecture',
        sections: [
          { code: '720', nameTh: 'สถาปัตยกรรมเรื่องทั่วไป', nameEn: 'Architecture' },
          { code: '721', nameTh: 'โครงสร้างและองค์ประกอบสถาปัตยกรรม', nameEn: 'Architectural Structure' },
          { code: '722', nameTh: 'สถาปัตยกรรมยุคโบราณและตะวันออก', nameEn: 'Architecture from Ancient Times' },
          { code: '723', nameTh: 'สถาปัตยกรรมยุคกลาง', nameEn: 'Architecture from ca. 300 to 1399' },
          { code: '724', nameTh: 'สถาปัตยกรรมยุคเรเนสซองส์และสมัยใหม่', nameEn: 'Architecture from 1400' },
          { code: '725', nameTh: 'สถาปัตยกรรมอาคารสาธารณะ (อาคารสำนักงาน, โรงพยาบาล)', nameEn: 'Public Structures' },
          { code: '726', nameTh: 'สถาปัตยกรรมศาสนสถาน (วัด, โบสถ์, มัสยิด)', nameEn: 'Buildings for Religious Purposes' },
          { code: '727', nameTh: 'สถาปัตยกรรมสถานศึกษาและสถาบันวิจัย', nameEn: 'Buildings for Education & Research' },
          { code: '728', nameTh: 'สถาปัตยกรรมที่อยู่อาศัย (บ้าน, คอนโดมิเนียม)', nameEn: 'Residential & Related Buildings' },
          { code: '729', nameTh: 'การตกแต่งและประดับประดาสถาปัตยกรรม', nameEn: 'Design & Decoration of Structures' },
        ]
      },
      {
        code: '730',
        nameTh: 'ประติมากรรม และงานประดิษฐ์',
        nameEn: 'Plastic Arts & Sculpture',
        sections: [
          { code: '730', nameTh: 'ประติมากรรมเรื่องทั่วไป', nameEn: 'Plastic Arts & Sculpture' },
          { code: '731', nameTh: 'กระบวนการ เทคนิค และหัวข้อประติมากรรม', nameEn: 'Processes, Forms, Subjects of Sculpture' },
          { code: '732', nameTh: 'ประติมากรรมยุคโบราณ', nameEn: 'Sculpture from Ancient Times' },
          { code: '733', nameTh: 'ประติมากรรมกรีกและโรมัน', nameEn: 'Greek, Etruscan, Roman Sculpture' },
          { code: '734', nameTh: 'ประติมากรรมยุคกลาง', nameEn: 'Sculpture from ca. 500 to 1399' },
          { code: '735', nameTh: 'ประติมากรรมยุคสมัยใหม่', nameEn: 'Sculpture from 1400' },
          { code: '736', nameTh: 'การแกะสลัก ไม้ หิน หยก และการพับกระดาษ (Origami)', nameEn: 'Carving & Carvings (Wood, Jade, Origami)' },
          { code: '737', nameTh: 'นุมิสมาติกส์ การสะสมเหรียญและกษาปณ์', nameEn: 'Numismatics & Sigillography (Coins)' },
          { code: '738', nameTh: 'เครื่องเบญจรงค์ เครื่องเซรามิก และเครื่องดินเผา', nameEn: 'Ceramic Arts' },
          { code: '739', nameTh: 'ประติมากรรมโลหะ และเครื่องประดับโลหะมีค่า', nameEn: 'Art Metalwork (Jewelry)' },
        ]
      },
      {
        code: '740',
        nameTh: 'การวาดภาพ วาดเขียน และมัณฑนศิลป์',
        nameEn: 'Drawing & Decorative Arts',
        sections: [
          { code: '740', nameTh: 'การวาดเขียน และมัณฑนศิลป์เรื่องทั่วไป', nameEn: 'Drawing & Decorative Arts' },
          { code: '741', nameTh: 'การวาดเขียน ภาพการ์ตูน และคอมมิกส์ (Comics / Manga)', nameEn: 'Drawing, Cartoons & Manga' },
          { code: '742', nameTh: 'ทัศนียภาพในการวาดภาพ (Perspective)', nameEn: 'Perspective in Drawing' },
          { code: '743', nameTh: 'การวาดภาพตามหุ่นจริง (คน, สัตว์, สิ่งของ)', nameEn: 'Drawing & Drawings by Subject' },
          { code: '744', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '745', nameTh: 'มัณฑนศิลป์ งานหัตถกรรม และเรขศิลป์ (Graphic Design)', nameEn: 'Decorative Arts & Graphic Design' },
          { code: '746', nameTh: 'งานศิลปะสิ่งทอ งานปัก งานร้อยลูกปัด', nameEn: 'Textile Arts (Embroidery, Tapestry)' },
          { code: '747', nameTh: 'การตกแต่งภายใน (Interior Decoration)', nameEn: 'Interior Decoration' },
          { code: '748', nameTh: 'ศิลปะการทำกระจก และกระจกสี', nameEn: 'Glassware' },
          { code: '749', nameTh: 'ศิลปะเฟอร์นิเจอร์ และโคมไฟ', nameEn: 'Furniture & Accessories' },
        ]
      },
      {
        code: '750',
        nameTh: 'การจิตรกรรม และภาพเขียน',
        nameEn: 'Painting & Paintings',
        sections: [
          { code: '750', nameTh: 'จิตรกรรมเรื่องทั่วไป', nameEn: 'Painting & Paintings' },
          { code: '751', nameTh: 'เทคนิค วัสดุ อุปกรณ์การเขียนภาพ (สีน้ำ, สีน้ำมัน)', nameEn: 'Techniques, Equipment, Materials' },
          { code: '752', nameTh: 'ทฤษฎีสีในการจิตรกรรม (Color Theory)', nameEn: 'Color Theory' },
          { code: '753', nameTh: 'ภาพเขียนสัญลักษณ์ และตำนานปรัมปรา', nameEn: 'Symbolism, Allegory, Mythology' },
          { code: '754', nameTh: 'ภาพเขียนชีวิตประจำวัน (Genre Painting)', nameEn: 'Genre Painting' },
          { code: '755', nameTh: 'ภาพเขียนทางศาสนา', nameEn: 'Religion in Painting' },
          { code: '756', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '757', nameTh: 'ภาพเขียนบุคคล และภาพเหมือน (Portraits)', nameEn: 'Human Figures & Portraits' },
          { code: '758', nameTh: 'ภาพเขียนทิวทัศน์ ธรรมชาติ สัตว์ และหุ่นนิ่ง', nameEn: 'Other Subjects (Landscapes, Still Life)' },
          { code: '759', nameTh: 'ประวัติศาสตร์จิตรกรรมและจิตรกรชื่อดัง', nameEn: 'Historical Treatment of Painting' },
        ]
      },
      {
        code: '760',
        nameTh: 'ศิลปะการพิมพ์ และภาพพิมพ์',
        nameEn: 'Printmaking & Graphic Arts',
        sections: [
          { code: '760', nameTh: 'ภาพพิมพ์และศิลปะการพิมพ์', nameEn: 'Printmaking & Graphic Arts' },
          { code: '761', nameTh: 'ภาพพิมพ์แกะไม้ (Relief Processes / Woodcut)', nameEn: 'Relief Processes (Woodcut)' },
          { code: '762', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '763', nameTh: 'ภาพพิมพ์ร่องลึก ภาพพิมพ์หิน (Lithography)', nameEn: 'Lithographic Processes' },
          { code: '764', nameTh: 'โครโมลิโทกราฟี และสีพิมพ์', nameEn: 'Chromolithography & Serigraphy' },
          { code: '765', nameTh: 'การแกะสลักโลหะทำภาพพิมพ์', nameEn: 'Metal Engraving' },
          { code: '766', nameTh: 'เมซโซทินต์ และแอควาตินต์', nameEn: 'Mezzotint, Aquatint & Related Processes' },
          { code: '767', nameTh: 'ภาพพิมพ์กัดกรด (Etching & Drypoint)', nameEn: 'Etching & Drypoint' },
          { code: '768', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '769', nameTh: 'ภาพพิมพ์สะสม แสตมป์ และธนบัตรโปรดักต์', nameEn: 'Prints, Stamps & Currency Design' },
        ]
      },
      {
        code: '770',
        nameTh: 'การถ่ายภาพ และศิลปะดิจิทัล',
        nameEn: 'Photography, Film & Digital Arts',
        sections: [
          { code: '770', nameTh: 'การถ่ายภาพเรื่องทั่วไป', nameEn: 'Photography & Digital Image' },
          { code: '771', nameTh: 'อุปกรณ์ กล้องถ่ายรูป และห้องมืด', nameEn: 'Techniques, Equipment, Materials' },
          { code: '772', nameTh: 'กระบวนการถ่ายภาพด้วยสารเกลือโลหะ', nameEn: 'Metallic Salt Processes' },
          { code: '773', nameTh: 'กระบวนการพิมพ์ภาพถ่ายด้วยเม็ดสี', nameEn: 'Pigment Processes of Printing' },
          { code: '774', nameTh: 'ภาพถ่ายฮอโลกราฟี', nameEn: 'Holography' },
          { code: '775', nameTh: 'การถ่ายภาพดิจิทัล (Digital Photography)', nameEn: 'Digital Photography' },
          { code: '776', nameTh: 'ศิลปะดิจิทัล (Digital Art / Computer Art)', nameEn: 'Computer Art (Digital Art)' },
          { code: '777', nameTh: 'การถ่ายทำภาพยนตร์ วิดีโอ และการตัดต่อ', nameEn: 'Cinematography & Videography' },
          { code: '778', nameTh: 'เทคนิคพิเศษในการถ่ายภาพ (ถ่ายภาพใต้น้ำ, ภาพโดรน)', nameEn: 'Special Fields & Applications of Photography' },
          { code: '779', nameTh: 'คอลเลกชันภาพถ่าย และภาพถ่ายโดยศิลปิน', nameEn: 'Photographic Collections' },
        ]
      },
      {
        code: '780',
        nameTh: 'ดนตรี',
        nameEn: 'Music',
        sections: [
          { code: '780', nameTh: 'ดนตรีเรื่องทั่วไป', nameEn: 'Music' },
          { code: '781', nameTh: 'ทฤษฎีโน้ตดนตรี องค์ประกอบดนตรี', nameEn: 'General Principles & Musical Forms' },
          { code: '782', nameTh: 'ดนตรีขับร้อง เพลงโอเปรา และละครเพลง', nameEn: 'Vocal Music (Opera, Musicals)' },
          { code: '783', nameTh: 'ดนตรีขับร้องเดี่ยว และบทเพลงประสานเสียง', nameEn: 'Music for Single Voices' },
          { code: '784', nameTh: 'วงดนตรี ออร์เคสตรา และบทเพลงซิมโฟนี', nameEn: 'Instruments & Instrumental Ensembles' },
          { code: '785', nameTh: 'ดนตรีสำหรับวงออร์เคสตราและวงแบนด์', nameEn: 'Ensembles with One Instrument per Part' },
          { code: '786', nameTh: 'เครื่องดนตรีคีย์บอร์ด (เปียโน, ออร์แกน)', nameEn: 'Keyboard & Other Instruments (Piano)' },
          { code: '787', nameTh: 'เครื่องดนตรีสาย (ไวโอลิน, กีตาร์, อูคูเลเล่)', nameEn: 'Stringed Instruments (Violin, Guitar)' },
          { code: '788', nameTh: 'เครื่องลมไม้ และเครื่องลมทองเหลือง (แซกโซโฟน, ทรัมเป็ต)', nameEn: 'Wind Instruments (Saxophone, Trumpet)' },
          { code: '789', nameTh: 'เครื่องกระทบ (กลอง, ระนาด) และดนตรีอิเล็กทรอนิกส์', nameEn: 'Percussion Instruments & Electronic Music' },
        ]
      },
      {
        code: '790',
        nameTh: 'นันทนาการ กีฬา และศิลปะการแสดง',
        nameEn: 'Recreational & Performing Arts (Sports, Games)',
        sections: [
          { code: '790', nameTh: 'นันทนาการ กีฬา และศิลปะการแสดง', nameEn: 'Recreational & Performing Arts' },
          { code: '791', nameTh: 'มหรสพ ภาพยนตร์ การแสดงมายากล ละครหุ่น', nameEn: 'Public Performances (Cinema, Film)' },
          { code: '792', nameTh: 'ศิลปะละครเวที และการแสดงละคร', nameEn: 'Stage Presentations (Theater)' },
          { code: '793', nameTh: 'เกมการเล่นในบ้าน เต้นรำ การเต้นลีลาศ', nameEn: 'Indoor Games & Dancing' },
          { code: '794', nameTh: 'เกมกระดาน หมากรุก บอร์ดเกม และเกมฝึกสมอง', nameEn: 'Indoor Games of Skill (Chess, Board Games)' },
          { code: '795', nameTh: 'เกมการพนัน ไพ่ และเกมเสี่ยงโชค', nameEn: 'Games of Chance (Cards)' },
          { code: '796', nameTh: 'กลางแจ้ง กีฬา ฟุตบอล กอล์ฟ วิ่ง มวยไทย', nameEn: 'Athletic & Outdoor Sports (Football, Boxing)' },
          { code: '797', nameTh: 'กีฬาทางน้ำ และกีฬาทางอากาศ (ว่ายน้ำ, ดำน้ำ)', nameEn: 'Water & Air Sports (Swimming, Diving)' },
          { code: '798', nameTh: 'กีฬาสัตว์ (การแข่งขี่ม้า, กีฬาชนไก่)', nameEn: 'Equestrian Sports & Animal Racing' },
          { code: '799', nameTh: 'การตกปลา และการตั้งแคมป์พักแรม', nameEn: 'Fishing, Hunting, Camping' },
        ]
      }
    ]
  },
  {
    code: '800',
    range: '800 - 899',
    nameTh: 'วรรณคดี และวรรณกรรม',
    nameEn: 'Literature & Rhetoric',
    icon: '📚',
    color: 'border-orange-500 bg-orange-50 text-orange-700 font-semibold',
    divisions: [
      {
        code: '800',
        nameTh: 'วรรณคดี และวรรณกรรมเรื่องทั่วไป',
        nameEn: 'Literature & Rhetoric',
        sections: [
          { code: '801', nameTh: 'ปรัชญา ทฤษฎี และสุนทรียศาสตร์ทางวรรณคดี', nameEn: 'Philosophy & Theory' },
          { code: '802', nameTh: 'คู่อื่นๆ หรือคำถามทางวรรณกรรม', nameEn: 'Miscellany' },
          { code: '803', nameTh: 'พจนานุกรม สารานุกรมวรรณคดี', nameEn: 'Dictionaries & Encyclopedias' },
          { code: '804', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '805', nameTh: 'สิ่งพิมพ์ต่อเนื่องทางวรรณคดี', nameEn: 'Serial Publications' },
          { code: '806', nameTh: 'องค์การ สมาคมทางวรรณคดี', nameEn: 'Organizations' },
          { code: '807', nameTh: 'การศึกษา และการสอนวรรณคดี', nameEn: 'Education, Research, Related Topics' },
          { code: '808', nameTh: 'วาทศิลป์ ศิลปะการแต่งหนังสือ การเขียนเชิงสร้างสรรค์', nameEn: 'Rhetoric & Collections of Literature' },
          { code: '809', nameTh: 'ประวัติศาสตร์และวรรณคดีวิจารณ์', nameEn: 'History, Description, Critical Review' },
        ]
      },
      {
        code: '810',
        nameTh: 'วรรณคดีอเมริกัน',
        nameEn: 'American Literature in English',
        sections: [
          { code: '810', nameTh: 'วรรณคดีอเมริกันเรื่องทั่วไป', nameEn: 'American Literature' },
          { code: '811', nameTh: 'กวีนิพนธ์อเมริกัน (American Poetry)', nameEn: 'American Poetry' },
          { code: '812', nameTh: 'บทละครอเมริกัน (American Drama)', nameEn: 'American Drama' },
          { code: '813', nameTh: 'นวนิยายอเมริกัน (American Fiction)', nameEn: 'American Fiction' },
          { code: '814', nameTh: 'ความเรียงอเมริกัน (American Essays)', nameEn: 'American Essays' },
          { code: '815', nameTh: 'สุนทรพจน์อเมริกัน (American Speeches)', nameEn: 'American Speeches' },
          { code: '816', nameTh: 'จดหมายอเมริกัน (American Letters)', nameEn: 'American Letters' },
          { code: '817', nameTh: 'วรรณกรรมเรื่องขำขันอเมริกัน', nameEn: 'American Humor & Satire' },
          { code: '818', nameTh: 'วรรณกรรมผสมอเมริกัน', nameEn: 'American Miscellaneous Writings' },
          { code: '819', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
        ]
      },
      {
        code: '820',
        nameTh: 'วรรณคดีอังกฤษ',
        nameEn: 'English & Old English Literatures',
        sections: [
          { code: '820', nameTh: 'วรรณคดีอังกฤษเรื่องทั่วไป', nameEn: 'English Literature' },
          { code: '821', nameTh: 'กวีนิพนธ์อังกฤษ (English Poetry)', nameEn: 'English Poetry' },
          { code: '822', nameTh: 'บทละครอังกฤษ (เชกสเปียร์ / Shakespeare)', nameEn: 'English Drama (Shakespeare)' },
          { code: '823', nameTh: 'นวนิยายอังกฤษ (English Fiction)', nameEn: 'English Fiction' },
          { code: '824', nameTh: 'ความเรียงอังกฤษ (English Essays)', nameEn: 'English Essays' },
          { code: '825', nameTh: 'สุนทรพจน์อังกฤษ (English Speeches)', nameEn: 'English Speeches' },
          { code: '826', nameTh: 'จดหมายอังกฤษ (English Letters)', nameEn: 'English Letters' },
          { code: '827', nameTh: 'วรรณกรรมขำขันอังกฤษ', nameEn: 'English Humor & Satire' },
          { code: '828', nameTh: 'วรรณกรรมผสมอังกฤษ', nameEn: 'English Miscellaneous Writings' },
          { code: '829', nameTh: 'วรรณคดีอังกฤษโบราณ (Old English Literature)', nameEn: 'Old English (Anglo-Saxon) Literature' },
        ]
      },
      {
        code: '830',
        nameTh: 'วรรณคดีเยอรมัน',
        nameEn: 'Germanic Literatures',
        sections: [
          { code: '830', nameTh: 'วรรณคดีเยอรมันเรื่องทั่วไป', nameEn: 'German Literature' },
          { code: '831', nameTh: 'กวีนิพนธ์เยอรมัน', nameEn: 'German Poetry' },
          { code: '832', nameTh: 'บทละครเยอรมัน (เกอเธ่)', nameEn: 'German Drama' },
          { code: '833', nameTh: 'นวนิยายเยอรมัน', nameEn: 'German Fiction' },
          { code: '834', nameTh: 'ความเรียงเยอรมัน', nameEn: 'German Essays' },
          { code: '835', nameTh: 'สุนทรพจน์เยอรมัน', nameEn: 'German Speeches' },
          { code: '836', nameTh: 'จดหมายเยอรมัน', nameEn: 'German Letters' },
          { code: '837', nameTh: 'วรรณกรรมขำขันเยอรมัน', nameEn: 'German Humor & Satire' },
          { code: '838', nameTh: 'วรรณกรรมผสมเยอรมัน', nameEn: 'German Miscellaneous Writings' },
          { code: '839', nameTh: 'วรรณคดีตระกูลเจอร์แมนิกอื่นๆ (นอร์เวย์, สวีเดน)', nameEn: 'Other Germanic Literatures' },
        ]
      },
      {
        code: '840',
        nameTh: 'วรรณคดีฝรั่งเศส',
        nameEn: 'Romance Literatures & French Literature',
        sections: [
          { code: '840', nameTh: 'วรรณคดีฝรั่งเศสเรื่องทั่วไป', nameEn: 'French Literature' },
          { code: '841', nameTh: 'กวีนิพนธ์ฝรั่งเศส', nameEn: 'French Poetry' },
          { code: '842', nameTh: 'บทละครฝรั่งเศส', nameEn: 'French Drama' },
          { code: '843', nameTh: 'นวนิยายฝรั่งเศส (วิกตอร์ อูโก)', nameEn: 'French Fiction' },
          { code: '844', nameTh: 'ความเรียงฝรั่งเศส', nameEn: 'French Essays' },
          { code: '845', nameTh: 'สุนทรพจน์ฝรั่งเศส', nameEn: 'French Speeches' },
          { code: '846', nameTh: 'จดหมายฝรั่งเศส', nameEn: 'French Letters' },
          { code: '847', nameTh: 'วรรณกรรมขำขันฝรั่งเศส', nameEn: 'French Humor & Satire' },
          { code: '848', nameTh: 'วรรณกรรมผสมฝรั่งเศส', nameEn: 'French Miscellaneous Writings' },
          { code: '849', nameTh: 'วรรณคดีพรอว็องซาล และอ็อกซิตัน', nameEn: 'Occitan & Catalan Literatures' },
        ]
      },
      {
        code: '850',
        nameTh: 'วรรณคดีอิตาลี',
        nameEn: 'Italian Literature',
        sections: [
          { code: '850', nameTh: 'วรรณคดีอิตาลีเรื่องทั่วไป', nameEn: 'Italian Literature' },
          { code: '851', nameTh: 'กวีนิพนธ์อิตาลี (ดันเต)', nameEn: 'Italian Poetry' },
          { code: '852', nameTh: 'บทละครอิตาลี', nameEn: 'Italian Drama' },
          { code: '853', nameTh: 'นวนิยายอิตาลี', nameEn: 'Italian Fiction' },
          { code: '854', nameTh: 'ความเรียงอิตาลี', nameEn: 'Italian Essays' },
          { code: '855', nameTh: 'สุนทรพจน์อิตาลี', nameEn: 'Italian Speeches' },
          { code: '856', nameTh: 'จดหมายอิตาลี', nameEn: 'Italian Letters' },
          { code: '857', nameTh: 'วรรณกรรมขำขันอิตาลี', nameEn: 'Italian Humor & Satire' },
          { code: '858', nameTh: 'วรรณกรรมผสมอิตาลี', nameEn: 'Italian Miscellaneous Writings' },
          { code: '859', nameTh: 'วรรณคดีโรมาเนีย', nameEn: 'Romanian & Rhaeto-Romanic Literatures' },
        ]
      },
      {
        code: '860',
        nameTh: 'วรรณคดีสเปนและโปรตุเกส',
        nameEn: 'Spanish & Portuguese Literatures',
        sections: [
          { code: '860', nameTh: 'วรรณคดีสเปนเรื่องทั่วไป', nameEn: 'Spanish Literature' },
          { code: '861', nameTh: 'กวีนิพนธ์สเปน', nameEn: 'Spanish Poetry' },
          { code: '862', nameTh: 'บทละครสเปน', nameEn: 'Spanish Drama' },
          { code: '863', nameTh: 'นวนิยายสเปน (ดอน กิโฆเต้)', nameEn: 'Spanish Fiction' },
          { code: '864', nameTh: 'ความเรียงสเปน', nameEn: 'Spanish Essays' },
          { code: '865', nameTh: 'สุนทรพจน์สเปน', nameEn: 'Spanish Speeches' },
          { code: '866', nameTh: 'จดหมายสเปน', nameEn: 'Spanish Letters' },
          { code: '867', nameTh: 'วรรณกรรมขำขันสเปน', nameEn: 'Spanish Humor & Satire' },
          { code: '868', nameTh: 'วรรณกรรมผสมสเปน', nameEn: 'Spanish Miscellaneous Writings' },
          { code: '869', nameTh: 'วรรณคดีโปรตุเกส', nameEn: 'Portuguese Literature' },
        ]
      },
      {
        code: '870',
        nameTh: 'วรรณคดีละติน',
        nameEn: 'Italic Literatures & Latin Literature',
        sections: [
          { code: '870', nameTh: 'วรรณคดีละตินเรื่องทั่วไป', nameEn: 'Latin Literature' },
          { code: '871', nameTh: 'กวีนิพนธ์ละติน (เวอร์จิล)', nameEn: 'Latin Poetry' },
          { code: '872', nameTh: 'บทละครละติน', nameEn: 'Latin Dramatic Poetry' },
          { code: '873', nameTh: 'นวนิยายและบทมหากาพย์ละติน', nameEn: 'Latin Epic Poetry & Fiction' },
          { code: '874', nameTh: 'กวีนิพนธ์ลำนำละติน', nameEn: 'Latin Lyric Poetry' },
          { code: '875', nameTh: 'สุนทรพจน์ละติน (ซิเซโร)', nameEn: 'Latin Speeches' },
          { code: '876', nameTh: 'จดหมายละติน', nameEn: 'Latin Letters' },
          { code: '877', nameTh: 'วรรณกรรมขำขันละติน', nameEn: 'Latin Humor & Satire' },
          { code: '878', nameTh: 'วรรณกรรมผสมละติน', nameEn: 'Latin Miscellaneous Writings' },
          { code: '879', nameTh: 'วรรณคดีภาษาอิตาลิกอื่นๆ', nameEn: 'Literatures of Other Italic Languages' },
        ]
      },
      {
        code: '880',
        nameTh: 'วรรณคดีกรีก',
        nameEn: 'Hellenic Literatures & Classical Greek',
        sections: [
          { code: '880', nameTh: 'วรรณคดีกรีกเรื่องทั่วไป', nameEn: 'Classical Greek Literature' },
          { code: '881', nameTh: 'กวีนิพนธ์กรีก (โฮเมอร์ - อีเลียด / โอดิสซีย์)', nameEn: 'Classical Greek Poetry' },
          { code: '882', nameTh: 'บทละครโศกนาฏกรรมและสุขนาฏกรรมกรีก', nameEn: 'Classical Greek Drama' },
          { code: '883', nameTh: 'มหากาพย์และกวีนิพนธ์การเล่าเรื่องกรีก', nameEn: 'Classical Greek Epic Poetry' },
          { code: '884', nameTh: 'กวีนิพนธ์ลำนำกรีก', nameEn: 'Classical Greek Lyric Poetry' },
          { code: '885', nameTh: 'สุนทรพจน์กรีก', nameEn: 'Classical Greek Speeches' },
          { code: '886', nameTh: 'จดหมายกรีก', nameEn: 'Classical Greek Letters' },
          { code: '887', nameTh: 'วรรณกรรมขำขันกรีก', nameEn: 'Classical Greek Satire & Humor' },
          { code: '888', nameTh: 'วรรณกรรมผสมกรีก', nameEn: 'Classical Greek Miscellaneous Writings' },
          { code: '889', nameTh: 'วรรณคดีกรีกสมัยใหม่ (Modern Greek Literature)', nameEn: 'Modern Greek Literature' },
        ]
      },
      {
        code: '890',
        nameTh: 'วรรณคดีภาษาอื่นๆ (วรรณคดีไทย, จีน, ญี่ปุ่น)',
        nameEn: 'Other Literatures (Thai, Chinese, Japanese)',
        sections: [
          { code: '890', nameTh: 'วรรณคดีภาษาอื่นๆ เรื่องทั่วไป', nameEn: 'Literatures of Other Languages' },
          { code: '891', nameTh: 'วรรณคดีอินโด-ยูโรเปียน (วรรณคดีสันสกฤต, บาลี, ฮินดี)', nameEn: 'Indic Literatures (Sanskrit, Pali)' },
          { code: '892', nameTh: 'วรรณคดีแอฟโร-เอเชียติก (วรรณคดีอาหรับ, ฮีบรู)', nameEn: 'Afro-Asiatic Literatures (Arabic)' },
          { code: '893', nameTh: 'วรรณคดีอียิปต์โบราณ', nameEn: 'Non-Semitic Afro-Asiatic Literatures' },
          { code: '894', nameTh: 'วรรณคดีอัลทาอิก ยูรัลลิก และดราวิเดียน', nameEn: 'Uralic & Altaic Literatures' },
          { code: '895', nameTh: 'วรรณคดีเอเชีย (895.91 วรรณคดีไทย, 895.1 วรรณคดีจีน, 895.6 วรรณคดีญี่ปุ่น)', nameEn: 'East & Southeast Asian Literatures (Thai, Chinese, Japanese)' },
          { code: '896', nameTh: 'วรรณคดีแอฟริกัน', nameEn: 'African Literatures' },
          { code: '897', nameTh: 'วรรณคดีอเมริกันอินเดียน', nameEn: 'North American Native Literatures' },
          { code: '898', nameTh: 'วรรณคดีอเมริกาใต้', nameEn: 'South American Native Literatures' },
          { code: '899', nameTh: 'วรรณคดีภาษาประดิษฐ์ (เอสเปรันโต)', nameEn: 'Austronesian & Other Literatures' },
        ]
      }
    ]
  },
  {
    code: '900',
    range: '900 - 999',
    nameTh: 'ประวัติศาสตร์ ภูมิศาสตร์ และชีวประวัติ',
    nameEn: 'History, Geography & Biography',
    icon: '🗺️',
    color: 'border-cyan-500 bg-cyan-50 text-cyan-700 font-semibold',
    divisions: [
      {
        code: '900',
        nameTh: 'ประวัติศาสตร์เรื่องทั่วไป',
        nameEn: 'History, Geography & Biography',
        sections: [
          { code: '900', nameTh: 'ประวัติศาสตร์เรื่องทั่วไป', nameEn: 'History' },
          { code: '901', nameTh: 'ปรัชญาและทฤษฎีทางประวัติศาสตร์', nameEn: 'Philosophy & Theory of History' },
          { code: '902', nameTh: 'ตารางประวัติศาสตร์ ลำดับเหตุการณ์เบ็ดเตล็ด', nameEn: 'Miscellany of History' },
          { code: '903', nameTh: 'พจนานุกรม สารานุกรมประวัติศาสตร์', nameEn: 'Dictionaries & Encyclopedias' },
          { code: '904', nameTh: 'บันทึกเหตุการณ์สำคัญและภัยพิบัติในประวัติศาสตร์', nameEn: 'Collected Accounts of Events' },
          { code: '905', nameTh: 'สิ่งพิมพ์ต่อเนื่องทางประวัติศาสตร์', nameEn: 'Serial Publications' },
          { code: '906', nameTh: 'องค์การ สมาคมทางประวัติศาสตร์', nameEn: 'Organizations' },
          { code: '907', nameTh: 'การศึกษา การสอน และโบราณคดี', nameEn: 'Education, Research, Related Topics' },
          { code: '908', nameTh: 'เรื่องเกี่ยวกับกลุ่มบุคคลในประวัติศาสตร์', nameEn: 'Kinds of Persons in History' },
          { code: '909', nameTh: 'ประวัติศาสตร์โลก (World History)', nameEn: 'World History' },
        ]
      },
      {
        code: '910',
        nameTh: 'ภูมิศาสตร์และการท่องเที่ยว',
        nameEn: 'Geography & Travel',
        sections: [
          { code: '910', nameTh: 'ภูมิศาสตร์และการท่องเที่ยวเรื่องทั่วไป', nameEn: 'Geography & Travel' },
          { code: '911', nameTh: 'ภูมิศาสตร์ประวัติศาสตร์ และแผนที่ประวัติศาสตร์', nameEn: 'Historical Geography' },
          { code: '912', nameTh: 'สมุดแผนที่ แผนที่โลก และลูกโลก (Atlases & Maps)', nameEn: 'Maps, Charts, Atlases, Globes' },
          { code: '913', nameTh: 'ภูมิศาสตร์และโลกโบราณ', nameEn: 'Geography of & Travel in Ancient World' },
          { code: '914', nameTh: 'ภูมิศาสตร์และการท่องเที่ยวในยุโรป', nameEn: 'Geography of Europe' },
          { code: '915', nameTh: 'ภูมิศาสตร์และการท่องเที่ยวในเอเชีย (ประเทศไทย)', nameEn: 'Geography of Asia (Thailand)' },
          { code: '916', nameTh: 'ภูมิศาสตร์และการท่องเที่ยวในแอฟริกา', nameEn: 'Geography of Africa' },
          { code: '917', nameTh: 'ภูมิศาสตร์และการท่องเที่ยวในอเมริกาเหนือ', nameEn: 'Geography of North America' },
          { code: '918', nameTh: 'ภูมิศาสตร์และการท่องเที่ยวในอเมริกาใต้', nameEn: 'Geography of South America' },
          { code: '919', nameTh: 'ภูมิศาสตร์และการท่องเที่ยวในออสเตรเลียและขั้วโลก', nameEn: 'Geography of Australasia & Polar Regions' },
        ]
      },
      {
        code: '920',
        nameTh: 'ชีวประวัติ และประวัติบุคคล',
        nameEn: 'Biography, Genealogy & Insignia',
        sections: [
          { code: '920', nameTh: 'ชีวประวัติรวม และประวัติบุคคลทั่วไป', nameEn: 'Biography, Genealogy & Insignia' },
          { code: '921', nameTh: 'ชีวประวัตินักปรัชญา และจิตแพทย์', nameEn: 'Biographies of Philosophers' },
          { code: '922', nameTh: 'ชีวประวัติผู้นำศาสนา พระสงฆ์ และนักบุญ', nameEn: 'Biographies of Religious Figures' },
          { code: '923', nameTh: 'ชีวประวัตินักการเมือง กษัตริย์ ผู้นำรัฐบาล', nameEn: 'Biographies of Persons in Social Sciences' },
          { code: '924', nameTh: 'ชีวประวัตินักภาษาศาสตร์', nameEn: 'Biographies of Philologists & Linguists' },
          { code: '925', nameTh: 'ชีวประวัตินักวิทยาศาสตร์ และนักคณิตศาสตร์', nameEn: 'Biographies of Scientists' },
          { code: '926', nameTh: 'ชีวประวัตินักเทคโนโลยี แพทย์ นักธุรกิจ', nameEn: 'Biographies of Persons in Technology' },
          { code: '927', nameTh: 'ชีวประวัตินักศิลปะ ดารา นักดนตรี นักกีฬา', nameEn: 'Biographies of Persons in Arts & Sports' },
          { code: '928', nameTh: 'ชีวประวัตินักเขียน กวี และนักวรรณคดี', nameEn: 'Biographies of Authors & Poets' },
          { code: '929', nameTh: 'พงศาวลีวิทยา วงศ์ตระกูล นามสกุล และเครื่องราชอิสริยาภรณ์', nameEn: 'Genealogy, Names & Heraldry' },
        ]
      },
      {
        code: '930',
        nameTh: 'ประวัติศาสตร์โลกโบราณ',
        nameEn: 'History of Ancient World to ca. 499',
        sections: [
          { code: '930', nameTh: 'ประวัติศาสตร์โลกโบราณเรื่องทั่วไป', nameEn: 'History of Ancient World' },
          { code: '931', nameTh: 'ประวัติศาสตร์จีนโบราณ', nameEn: 'Ancient China' },
          { code: '932', nameTh: 'ประวัติศาสตร์อียิปต์โบราณ (พีระมิด, ฟาโรห์)', nameEn: 'Ancient Egypt' },
          { code: '933', nameTh: 'ประวัติศาสตร์ปาเลสไตน์และยูดายโบราณ', nameEn: 'Ancient Palestine' },
          { code: '934', nameTh: 'ประวัติศาสตร์อินเดียโบราณ', nameEn: 'Ancient India' },
          { code: '935', nameTh: 'ประวัติศาสตร์เมโสโปเตเมียและเปอร์เซียโบราณ', nameEn: 'Ancient Mesopotamia & Iranian Plateau' },
          { code: '936', nameTh: 'ประวัติศาสตร์ยุโรปเหนือและตะวันตกโบราณ', nameEn: 'Ancient Europe North & West of Italy' },
          { code: '937', nameTh: 'ประวัติศาสตร์โรมันโบราณ (คาบสมุทรอิตาลี)', nameEn: 'Ancient Italian Peninsula & Rome' },
          { code: '938', nameTh: 'ประวัติศาสตร์กรีกโบราณ', nameEn: 'Ancient Greece' },
          { code: '939', nameTh: 'ประวัติศาสตร์ภูมิภาคอื่นๆ ในโลกโบราณ', nameEn: 'Other Parts of Ancient World' },
        ]
      },
      {
        code: '940',
        nameTh: 'ประวัติศาสตร์ยุโรป',
        nameEn: 'General History of Europe',
        sections: [
          { code: '940', nameTh: 'ประวัติศาสตร์ยุโรปเรื่องทั่วไป (สงครามโลก)', nameEn: 'General History of Europe' },
          { code: '941', nameTh: 'ประวัติศาสตร์อังกฤษ สกอตแลนด์ ไอร์แลนด์', nameEn: 'History of British Isles' },
          { code: '942', nameTh: 'ประวัติศาสตร์อังกฤษและเวลส์', nameEn: 'History of England & Wales' },
          { code: '943', nameTh: 'ประวัติศาสตร์เยอรมนี ออสเตรีย สวิตเซอร์แลนด์', nameEn: 'History of Central Europe (Germany)' },
          { code: '944', nameTh: 'ประวัติศาสตร์ฝรั่งเศส และโมนาโก', nameEn: 'History of France & Monaco' },
          { code: '945', nameTh: 'ประวัติศาสตร์อิตาลี วาติกัน ซานมารีโน', nameEn: 'History of Italian Peninsula' },
          { code: '946', nameTh: 'ประวัติศาสตร์สเปน และโปรตุเกส', nameEn: 'History of Iberian Peninsula (Spain)' },
          { code: '947', nameTh: 'ประวัติศาสตร์รัสเซีย และยุโรปตะวันออก', nameEn: 'History of Russia & Eastern Europe' },
          { code: '948', nameTh: 'ประวัติศาสตร์สแกนดิเนเวีย (เดนมาร์ก, นอร์เวย์, สวีเดน)', nameEn: 'History of Scandinavia' },
          { code: '949', nameTh: 'ประวัติศาสตร์ประเทศอื่นๆ ในยุโรป (กรีซ, ตุรกี)', nameEn: 'History of Other Parts of Europe' },
        ]
      },
      {
        code: '950',
        nameTh: 'ประวัติศาสตร์เอเชีย (ประวัติศาสตร์ไทย)',
        nameEn: 'General History of Asia (Thai History)',
        sections: [
          { code: '950', nameTh: 'ประวัติศาสตร์เอเชียเรื่องทั่วไป', nameEn: 'General History of Asia' },
          { code: '951', nameTh: 'ประวัติศาสตร์จีน ไต้หวัน ฮ่องกง มาเก๊า', nameEn: 'History of China & Adjacent Areas' },
          { code: '952', nameTh: 'ประวัติศาสตร์ญี่ปุ่น', nameEn: 'History of Japan' },
          { code: '953', nameTh: 'ประวัติศาสตร์คาบสมุทรอาหรับ', nameEn: 'History of Arabian Peninsula' },
          { code: '954', nameTh: 'ประวัติศาสตร์อินเดีย ปากีสถาน บังกลาเทศ ศรีลังกา', nameEn: 'History of South Asia (India)' },
          { code: '955', nameTh: 'ประวัติศาสตร์อิหร่าน (เปอร์เซีย)', nameEn: 'History of Iran' },
          { code: '956', nameTh: 'ประวัติศาสตร์เอเชียตะวันตกเฉียงใต้ (ตะวันออกกลาง)', nameEn: 'History of Middle East' },
          { code: '957', nameTh: 'ประวัติศาสตร์ไซบีเรีย (รัสเซียในเอเชีย)', nameEn: 'History of Siberia' },
          { code: '958', nameTh: 'ประวัติศาสตร์เอเชียกลาง (อัฟกานิสถาน)', nameEn: 'History of Central Asia' },
          { code: '959', nameTh: 'ประวัติศาสตร์เอเชียตะวันออกเฉียงใต้ (959.3 ประวัติศาสตร์ไทย)', nameEn: 'History of Southeast Asia (959.3 Thailand)' },
        ]
      },
      {
        code: '960',
        nameTh: 'ประวัติศาสตร์แอฟริกา',
        nameEn: 'General History of Africa',
        sections: [
          { code: '960', nameTh: 'ประวัติศาสตร์แอฟริกาเรื่องทั่วไป', nameEn: 'General History of Africa' },
          { code: '961', nameTh: 'ประวัติศาสตร์แอฟริกาเหนือ (ตูนิเชีย, ลิเบีย)', nameEn: 'History of North Africa' },
          { code: '962', nameTh: 'ประวัติศาสตร์อียิปต์ และซูดาน', nameEn: 'History of Egypt & Sudan' },
          { code: '963', nameTh: 'ประวัติศาสตร์เอธิโอเปีย และเอริเทรีย', nameEn: 'History of Ethiopia & Eritrea' },
          { code: '964', nameTh: 'ประวัติศาสตร์โมร็อกโก', nameEn: 'History of Northwest African Coast' },
          { code: '965', nameTh: 'ประวัติศาสตร์แอลจีเรีย', nameEn: 'History of Algeria' },
          { code: '966', nameTh: 'ประวัติศาสตร์แอฟริกาตะวันตก (ไนจีเรีย, กานา)', nameEn: 'History of West Africa' },
          { code: '967', nameTh: 'ประวัติศาสตร์แอฟริกากลาง (แคเมอรูน, คองโก)', nameEn: 'History of Central Africa' },
          { code: '968', nameTh: 'ประวัติศาสตร์แอฟริกาใต้', nameEn: 'History of Southern Africa' },
          { code: '969', nameTh: 'ประวัติศาสตร์เกาะในมหาสมุทรอินเดียใต้ (มาดากัสการ์)', nameEn: 'History of South Indian Ocean Islands' },
        ]
      },
      {
        code: '970',
        nameTh: 'ประวัติศาสตร์อเมริกาเหนือ',
        nameEn: 'General History of North America',
        sections: [
          { code: '970', nameTh: 'ประวัติศาสตร์อเมริกาเหนือเรื่องทั่วไป', nameEn: 'History of North America' },
          { code: '971', nameTh: 'ประวัติศาสตร์แคนาดา', nameEn: 'History of Canada' },
          { code: '972', nameTh: 'ประวัติศาสตร์เม็กซิโก อเมริกากลาง', nameEn: 'History of Mexico & Central America' },
          { code: '973', nameTh: 'ประวัติศาสตร์สหรัฐอเมริกา (US History)', nameEn: 'History of United States' },
          { code: '974', nameTh: 'ประวัติศาสตร์สหรัฐฯ ฝั่งตะวันออกเฉียงเหนือ', nameEn: 'Northeastern United States' },
          { code: '975', nameTh: 'ประวัติศาสตร์สหรัฐฯ ฝั่งตะวันออกเฉียงใต้', nameEn: 'Southeastern United States' },
          { code: '976', nameTh: 'ประวัติศาสตร์สหรัฐฯ ฝั่งใต้ตอนกลาง', nameEn: 'South Central United States' },
          { code: '977', nameTh: 'ประวัติศาสตร์สหรัฐฯ ฝั่งเหนือตอนกลาง', nameEn: 'North Central United States' },
          { code: '978', nameTh: 'ประวัติศาสตร์สหรัฐฯ ฝั่งตะวันตก', nameEn: 'Western United States' },
          { code: '979', nameTh: 'ประวัติศาสตร์สหรัฐฯ ฝั่งมหาสมุทรแปซิฟิก (แคลิฟอร์เนีย)', nameEn: 'Great Basin & Pacific Slope Region' },
        ]
      },
      {
        code: '980',
        nameTh: 'ประวัติศาสตร์อเมริกาใต้',
        nameEn: 'General History of South America',
        sections: [
          { code: '980', nameTh: 'ประวัติศาสตร์อเมริกาใต้เรื่องทั่วไป', nameEn: 'History of South America' },
          { code: '981', nameTh: 'ประวัติศาสตร์บราซิล', nameEn: 'History of Brazil' },
          { code: '982', nameTh: 'ประวัติศาสตร์อาร์เจนตินา', nameEn: 'History of Argentina' },
          { code: '983', nameTh: 'ประวัติศาสตร์ชิลี', nameEn: 'History of Chile' },
          { code: '984', nameTh: 'ประวัติศาสตร์โบลิเวีย', nameEn: 'History of Bolivia' },
          { code: '985', nameTh: 'ประวัติศาสตร์เปรู', nameEn: 'History of Peru' },
          { code: '986', nameTh: 'ประวัติศาสตร์โคลอมเบีย และเอกวาดอร์', nameEn: 'History of Colombia & Ecuador' },
          { code: '987', nameTh: 'ประวัติศาสตร์เวเนซุเอลา', nameEn: 'History of Venezuela' },
          { code: '988', nameTh: 'ประวัติศาสตร์กายอานา', nameEn: 'History of Guiana' },
          { code: '989', nameTh: 'ประวัติศาสตร์ปารากวัย และอุรุกวัย', nameEn: 'History of Paraguay & Uruguay' },
        ]
      },
      {
        code: '990',
        nameTh: 'ประวัติศาสตร์ส่วนอื่นๆ ของโลก และออสเตรเลีย',
        nameEn: 'General History of Other Areas',
        sections: [
          { code: '990', nameTh: 'ประวัติศาสตร์ภูมิภาคอื่นๆ เรื่องทั่วไป', nameEn: 'History of Other World Areas' },
          { code: '991', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '992', nameTh: 'ว่าง (Unassigned)', nameEn: 'Unassigned' },
          { code: '993', nameTh: 'ประวัติศาสตร์นิวซีแลนด์', nameEn: 'History of New Zealand' },
          { code: '994', nameTh: 'ประวัติศาสตร์ออสเตรเลีย', nameEn: 'History of Australia' },
          { code: '995', nameTh: 'ประวัติศาสตร์ปาปัวนิวกินี และเมลาเนเชีย', nameEn: 'History of Papua New Guinea' },
          { code: '996', nameTh: 'ประวัติศาสตร์โพลินีเชีย และฮาวาย', nameEn: 'History of Polynesia & Hawaii' },
          { code: '997', nameTh: 'ประวัติศาสตร์เกาะในมหาสมุทรแอตแลนติกใต้', nameEn: 'History of Atlantic Ocean Islands' },
          { code: '998', nameTh: 'ประวัติศาสตร์ขั้วโลกเหนือ และแอนตาร์กติกา', nameEn: 'History of Arctic Islands & Antarctica' },
          { code: '999', nameTh: 'ประวัติศาสตร์วัตถุนอกโลก (ดวงจันทร์)', nameEn: 'Extraterrestrial Worlds' },
        ]
      }
    ]
  }
];
