import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Layers,
  Sparkles,
  ListFilter,
  ArrowRight
} from 'lucide-react';
import {
  DDC_MAIN_CLASSES,
  DdcMainClass,
  DdcDivision,
  DdcSection
} from '../data/ddcClassificationData';

interface DdcClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDdc?: (ddcCode: string, nameTh: string) => void;
}

export const DdcClassificationModal: React.FC<DdcClassificationModalProps> = ({
  isOpen,
  onClose,
  onSelectDdc
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeClassCode, setActiveClassCode] = useState<string>('all');
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({
    '000': true,
    '100': false,
    '200': false,
    '300': false,
    '400': false,
    '500': false,
    '600': false,
    '700': false,
    '800': false,
    '900': false
  });
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleClassExpand = (code: string) => {
    setExpandedClasses(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleDivisionExpand = (code: string) => {
    setExpandedDivisions(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const handleExpandAll = () => {
    const allC: Record<string, boolean> = {};
    const allD: Record<string, boolean> = {};
    DDC_MAIN_CLASSES.forEach(mc => {
      allC[mc.code] = true;
      mc.divisions.forEach(d => {
        allD[d.code] = true;
      });
    });
    setExpandedClasses(allC);
    setExpandedDivisions(allD);
  };

  const handleCollapseAll = () => {
    setExpandedClasses({});
    setExpandedDivisions({});
  };

  const handleCopy = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSelect = (section: DdcSection, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onSelectDdc) {
      onSelectDdc(section.code, section.nameTh);
      onClose();
    } else {
      handleCopy(section.code);
    }
  };

  // Filtered dataset calculation based on search query and active tab
  const filteredClasses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return DDC_MAIN_CLASSES.filter(mc => {
      if (activeClassCode !== 'all' && mc.code !== activeClassCode) {
        return false;
      }
      if (!term) return true;

      // Check main class matches
      const mcMatch = mc.code.includes(term) ||
        mc.nameTh.toLowerCase().includes(term) ||
        mc.nameEn.toLowerCase().includes(term);

      if (mcMatch) return true;

      // Check division & section matches
      return mc.divisions.some(div => {
        const divMatch = div.code.includes(term) ||
          div.nameTh.toLowerCase().includes(term) ||
          (div.nameEn && div.nameEn.toLowerCase().includes(term));
        if (divMatch) return true;

        return div.sections.some(sec =>
          sec.code.includes(term) ||
          sec.nameTh.toLowerCase().includes(term) ||
          (sec.nameEn && sec.nameEn.toLowerCase().includes(term))
        );
      });
    }).map(mc => {
      if (!term) return mc;

      // Filter divisions & sections if searching
      const filteredDivisions = mc.divisions.filter(div => {
        const divMatch = div.code.includes(term) ||
          div.nameTh.toLowerCase().includes(term) ||
          (div.nameEn && div.nameEn.toLowerCase().includes(term));

        if (divMatch) return true;

        return div.sections.some(sec =>
          sec.code.includes(term) ||
          sec.nameTh.toLowerCase().includes(term) ||
          (sec.nameEn && sec.nameEn.toLowerCase().includes(term))
        );
      }).map(div => {
        const filteredSections = div.sections.filter(sec =>
          sec.code.includes(term) ||
          sec.nameTh.toLowerCase().includes(term) ||
          (sec.nameEn && sec.nameEn.toLowerCase().includes(term)) ||
          div.code.includes(term) ||
          div.nameTh.toLowerCase().includes(term)
        );

        return {
          ...div,
          sections: filteredSections
        };
      });

      return {
        ...mc,
        divisions: filteredDivisions
      };
    });
  }, [searchTerm, activeClassCode]);

  // Total matching count
  const totalMatchesCount = useMemo(() => {
    let count = 0;
    filteredClasses.forEach(mc => {
      mc.divisions.forEach(div => {
        count += div.sections.length;
      });
    });
    return count;
  }, [filteredClasses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col space-y-4 animate-scaleIn overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  ระบบการจัดหมวดหมู่แบบทศนิยมดิวอี้ (Dewey Decimal Classification - DDC)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                  คู่มือมาตรฐานห้องสมุดสากล
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ตารางจำแนกหมวดหมู่หนังสือ DDC แบ่งออกเป็น <span className="font-bold text-slate-800">10 หมวดใหญ่ (Class)</span> → <span className="font-bold text-slate-800">100 หมวดย่อย (Division)</span> → <span className="font-bold text-slate-800">1,000 หมู่ย่อย (Section)</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-2xl hover:bg-slate-100 transition cursor-pointer shrink-0"
            title="ปิดหน้าต่างคู่มือ DDC"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar & Quick Controls */}
        <div className="space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาเลขหมวด DDC หรือคีย์เวิร์ดวิชา (เช่น 005, 650, 370, คอมพิวเตอร์, บัญชี, จิตวิทยา, ประวัติศาสตร์)..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ล้าง
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ขยายทั้งหมด</span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>ย่อทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Quick Class Tabs (000 - 900) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setActiveClassCode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeClassCode === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌐 แสดงทั้งหมด (10 หมวดใหญ่)
            </button>
            {DDC_MAIN_CLASSES.map(mc => (
              <button
                key={mc.code}
                onClick={() => setActiveClassCode(mc.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeClassCode === mc.code
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{mc.icon}</span>
                <span>{mc.code} {mc.nameTh.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter Notice */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 bg-amber-50/60 border border-amber-200/80 px-3.5 py-2 rounded-xl shrink-0">
          <div className="flex items-center gap-1.5">
            <ListFilter className="w-4 h-4 text-amber-600" />
            <span>
              {searchTerm ? (
                <>ค้นพบหมวดย่อย <strong className="text-amber-800 font-bold">{totalMatchesCount}</strong> รายการสำหรับคำค้น "{searchTerm}"</>
              ) : (
                <>แสดงโครงสร้างหมวดหมู่หนังสือระบบ DDC ครบถ้วน <strong className="text-amber-800 font-bold">1,000 หมู่ย่อย</strong></>
              )}
            </span>
          </div>
          {onSelectDdc && (
            <span className="text-amber-700 text-[11px] font-bold">
              ✨ คลิกปุ่ม "เลือกใช้" เพื่อนำเลข DDC ไปใส่ในระเบียน
            </span>
          )}
        </div>

        {/* Accordion List Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {filteredClasses.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">ไม่พบเลขหมวดหมู่หรือคำค้นวิชาที่ตรงกับ "{searchTerm}"</p>
              <p className="text-xs text-slate-400">ลองค้นหาด้วยรหัสตัวเลข เช่น 005, 150, 330, 650 หรือคีย์เวิร์ดทั่วไป</p>
            </div>
          ) : (
            filteredClasses.map(mc => {
              const isMcExpanded = expandedClasses[mc.code] || Boolean(searchTerm);

              return (
                <div
                  key={mc.code}
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs transition"
                >
                  {/* Level 1: Main Class Header */}
                  <div
                    onClick={() => toggleClassExpand(mc.code)}
                    className="p-3.5 sm:p-4 bg-slate-50 hover:bg-slate-100/90 transition cursor-pointer flex items-center justify-between gap-3 border-b border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mc.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono border ${mc.color}`}>
                            หมวด {mc.range}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {mc.nameTh}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {mc.nameEn} ({mc.divisions.length} หมวดย่อย)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                        {isMcExpanded ? 'ซ่อน' : 'แสดง'}
                      </span>
                      {isMcExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Level 2: Divisions inside Main Class */}
                  {isMcExpanded && (
                    <div className="p-3 sm:p-4 space-y-3 bg-slate-50/30">
                      {mc.divisions.map(div => {
                        const divKey = `${mc.code}_${div.code}`;
                        const isDivExpanded = expandedDivisions[divKey] || Boolean(searchTerm) || isMcExpanded;

                        return (
                          <div
                            key={div.code}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
                          >
                            {/* Division Header */}
                            <div
                              onClick={() => toggleDivisionExpand(divKey)}
                              className="p-2.5 sm:p-3 bg-slate-100/70 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between gap-2 border-b border-slate-200/60"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-xs">
                                  {div.code}
                                </span>
                                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                                  {div.nameTh}
                                </h4>
                                {div.nameEn && (
                                  <span className="text-[11px] text-slate-400 hidden md:inline">
                                    ({div.nameEn})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                <span>{div.sections.length} หมู่ย่อย</span>
                                {isDivExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {/* Level 3: Sections Grid */}
                            {isDivExpanded && (
                              <div className="p-2 sm:p-3 grid grid-cols-1 md:grid-cols-2 gap-2 bg-white">
                                {div.sections.map(sec => (
                                  <div
                                    key={sec.code}
                                    className="p-2.5 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/40 transition flex items-center justify-between gap-2 group"
                                  >
                                    <div className="flex items-start gap-2.5 min-w-0">
                                      <span className="font-mono font-bold text-slate-900 bg-slate-100 group-hover:bg-amber-200 group-hover:text-amber-950 px-2 py-0.5 rounded text-xs shrink-0 transition">
                                        {sec.code}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-amber-900 transition">
                                          {sec.nameTh}
                                        </p>
                                        {sec.nameEn && (
                                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                            {sec.nameEn}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => handleCopy(sec.code, e)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition cursor-pointer"
                                        title={`คัดลอกเลขหมวด DDC ${sec.code}`}
                                      >
                                        {copiedCode === sec.code ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>

                                      {onSelectDdc && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleSelect(sec, e)}
                                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 shadow-xs"
                                          title={`เลือกเลข DDC ${sec.code} ${sec.nameTh}`}
                                        >
                                          <span>เลือกใช้</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              ระบบแนะนำเลข DDC สามารถใช้ร่วมกับการจัดหมู่หนังสือสากลและการสร้างบัตรรายการ MARC 21 Tag 082 $a
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            ปิดหน้าต่างคู่มือ DDC
          </button>
        </div>

      </div>
    </div>
  );
};
