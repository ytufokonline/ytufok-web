import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, 
  UserCheck, Check, Copy, ChevronLeft, ChevronRight, Droplets, 
  Info, MapPin, Image as ImageIcon, Scan, HelpCircle
} from 'lucide-react';
import { Member, DarkroomSlot, DarkroomReservation, DarkroomProcessType } from '../types';
import { api } from '../lib/api';

interface DarkroomPageProps {
  onNavigate: (tab: 'home' | 'equipment' | 'reserve' | 'status' | 'admin' | 'darkroom', extraParam?: string) => void;
}

export const DarkroomPage: React.FC<DarkroomPageProps> = ({ onNavigate }) => {
  const [slots, setSlots] = useState<DarkroomSlot[]>([]);
  const [allReservations, setAllReservations] = useState<DarkroomReservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Mode: 'wash' (Film Yıkama & Tarama) vs 'print' (Kağıda Fotoğraf Baskısı)
  const [activeMode, setActiveMode] = useState<'wash' | 'print'>('wash');

  // Calendar State
  const today = useMemo(() => new Date(), []);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Whitelist & Form State
  const [studentNumber, setStudentNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedMember, setVerifiedMember] = useState<Member | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // General Questions
  const [department, setDepartment] = useState('');
  const [hasEnteredDarkroomBefore, setHasEnteredDarkroomBefore] = useState<boolean | null>(null);
  const [knowsDarkroomRules, setKnowsDarkroomRules] = useState<boolean | null>(null);

  // Film Wash Specific
  const [processType, setProcessType] = useState<DarkroomProcessType>('bw_film');
  const [hasWashedFilmBefore, setHasWashedFilmBefore] = useState<boolean | null>(null);
  const [filmCount, setFilmCount] = useState<number>(1);
  const [filmBrandsAndAsa, setFilmBrandsAndAsa] = useState('');
  const [differentAsaAck, setDifferentAsaAck] = useState(false);

  // Photo Print Specific
  const [hasPrintedBefore, setHasPrintedBefore] = useState<boolean | null>(null);
  const [paperSize, setPaperSize] = useState('18x24 cm');
  const [printCount, setPrintCount] = useState(3);
  const [negativesReady, setNegativesReady] = useState<boolean | null>(null);

  // Common Chemical & Experience
  const [chemicalSource, setChemicalSource] = useState<'club' | 'personal'>('club');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [needsAssistance, setNeedsAssistance] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReservation, setSubmittedReservation] = useState<DarkroomReservation | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotList, resList] = await Promise.all([
        api.getDarkroomSlots(),
        api.getDarkroomReservations()
      ]);
      setSlots(slotList);
      setAllReservations(resList);
    } catch (e) {
      console.error('Karanlık oda verisi yüklenemedi:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When activeMode changes, adjust default processType
  useEffect(() => {
    if (activeMode === 'wash') {
      if (processType === 'photo_print') {
        setProcessType('bw_film');
      }
    } else {
      setProcessType('photo_print');
    }
    setSubmitError(null);
  }, [activeMode]);

  // Format Helper
  const formatMonthTitle = (d: Date) => {
    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now.toISOString().slice(0, 10));
    setSelectedSlotId(null);
  };

  // Calendar Days Calculation
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
      totalOpenSlots: number;
      bookedCount: number;
    }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isPast: dateStr < today.toISOString().slice(0, 10),
        isToday: dateStr === today.toISOString().slice(0, 10),
        totalOpenSlots: 0,
        bookedCount: 0
      });
    }

    const todayStr = today.toISOString().slice(0, 10);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const current = new Date(year, month, d);
      const dateStr = current.toISOString().slice(0, 10);

      // Yalnızca yöneticilerin açtığı ve bu işlem türüne izin verilen seanslar
      const openSlotsOnDay = slots.filter(s => {
        if (s.date !== dateStr || s.is_active === false) return false;
        if (activeMode === 'wash') {
          return s.allowed_process === 'all' || s.allowed_process === 'film_wash';
        } else {
          return s.allowed_process === 'all' || s.allowed_process === 'photo_print';
        }
      });

      const totalOpen = openSlotsOnDay.length;
      const bookedOnDay = allReservations.filter(
        r => r.date === dateStr && r.status !== 'cancelled' && r.status !== 'rejected' &&
        openSlotsOnDay.some(s => s.id === r.slot_id)
      ).length;

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isPast: dateStr < todayStr,
        isToday: dateStr === todayStr,
        totalOpenSlots: totalOpen,
        bookedCount: bookedOnDay
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isPast: false,
        isToday: dateStr === todayStr,
        totalOpenSlots: 0,
        bookedCount: 0
      });
    }

    return days;
  }, [currentMonthDate, allReservations, slots, activeMode, today]);

  // Selected Day Reservations & Available Slots (Yalnızca yöneticinin açtığı seanslar)
  const slotsOnSelectedDate = useMemo(() => {
    return slots.filter(s => {
      if (s.date !== selectedDate || s.is_active === false) return false;
      if (activeMode === 'wash') {
        return s.allowed_process === 'all' || s.allowed_process === 'film_wash';
      } else {
        return s.allowed_process === 'all' || s.allowed_process === 'photo_print';
      }
    });
  }, [slots, selectedDate, activeMode]);

  const reservationsOnSelectedDate = useMemo(() => {
    return allReservations.filter(
      r => r.date === selectedDate && r.status !== 'cancelled' && r.status !== 'rejected'
    );
  }, [allReservations, selectedDate]);

  const selectedSlot = useMemo(() => {
    return slotsOnSelectedDate.find(s => s.id === selectedSlotId);
  }, [slotsOnSelectedDate, selectedSlotId]);

  // Kural: Film yıkama ve kağıda fotoğraf baskısı aynı güne alınamaz!
  const memberConflictOnSelectedDate = useMemo(() => {
    if (!verifiedMember || !selectedDate) return null;
    const existing = allReservations.filter(
      r => (r.student_number === verifiedMember.student_number || r.member_id === verifiedMember.id) &&
      r.date === selectedDate &&
      r.status !== 'cancelled' && r.status !== 'rejected'
    );

    const hasWash = existing.some(r => r.process_type === 'bw_film');
    const hasPrint = existing.some(r => r.process_type === 'photo_print');

    if (hasWash && (activeMode === 'print' || processType === 'photo_print')) {
      return 'Bu tarihte zaten bir "S/B Film Yıkama" rezervasyonunuz bulunmaktadır. Film yıkama ve kağıda fotoğraf baskısı aynı güne alınamaz! Banyonuz kuruduktan sonra baskı için lütfen farklı bir gün seçiniz.';
    }

    if (hasPrint && (activeMode === 'wash' && processType === 'bw_film')) {
      return 'Bu tarihte zaten bir "Kağıda Fotoğraf Baskısı" rezervasyonunuz bulunmaktadır. Film yıkama ve kağıda fotoğraf baskısı aynı güne alınamaz! Lütfen film yıkama için farklı bir gün seçiniz.';
    }

    return null;
  }, [verifiedMember, selectedDate, allReservations, activeMode, processType]);

  const handleVerifyStudent = async () => {
    if (!studentNumber.trim()) {
      setVerificationError('Lütfen öğrenci numaranızı giriniz.');
      setVerifiedMember(null);
      return;
    }

    setVerifying(true);
    setVerificationError(null);

    try {
      const res = await api.verifyStudentNumber(studentNumber);
      if (res.success && res.member) {
        setVerifiedMember(res.member);
        const deptVal = res.member.department && res.member.department !== 'Yıldız Teknik Üniversitesi'
          ? res.member.department
          : '';
        setDepartment(deptVal);
        setVerificationError(null);
      } else {
        setVerifiedMember(null);
        setVerificationError(res.message);
      }
    } catch {
      setVerificationError('Öğrenci numarası doğrulanamadı.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedDate) {
      setSubmitError('Lütfen takvimden bir gün seçiniz.');
      return;
    }

    if (!selectedSlotId || !selectedSlot) {
      setSubmitError('Lütfen 1,5 saatlik bir seans saati seçiniz.');
      return;
    }

    if (!verifiedMember) {
      setSubmitError('Lütfen geçerli bir öğrenci numarası girip "Doğrula" butonuna basınız.');
      return;
    }

    if (!department.trim()) {
      setSubmitError('Lütfen okuduğunuz bölümü belirtiniz.');
      return;
    }

    if (memberConflictOnSelectedDate) {
      setSubmitError(memberConflictOnSelectedDate);
      return;
    }

    // Specific validations
    if (activeMode === 'wash' && processType === 'bw_film') {
      if (hasWashedFilmBefore === null) {
        setSubmitError('Lütfen daha önce film yıkayıp yıkamadığınızı belirtiniz.');
        return;
      }
      if (hasEnteredDarkroomBefore === null) {
        setSubmitError('Lütfen daha önce karanlık odaya girip girmediğinizi belirtiniz.');
        return;
      }
      if (knowsDarkroomRules === null) {
        setSubmitError('Lütfen karanlık oda kurallarını bilip bilmediğinizi belirtiniz.');
        return;
      }
      if (filmCount > 1 && !filmBrandsAndAsa.trim()) {
        setSubmitError('Birden fazla film yıkayacaksanız lütfen film marka ve ASA değerlerini belirtiniz.');
        return;
      }
      if (filmCount > 1 && !differentAsaAck) {
        setSubmitError('Farklı ASA/marka filmlerde işlem süresinin uzayacağını onaylamanız gerekmektedir.');
        return;
      }
    }

    if (activeMode === 'print') {
      if (hasEnteredDarkroomBefore === null) {
        setSubmitError('Lütfen daha önce karanlık odaya girip girmediğinizi belirtiniz.');
        return;
      }
      if (hasPrintedBefore === null) {
        setSubmitError('Lütfen daha önce agrandisör ile fotoğraf basıp basmadığınızı belirtiniz.');
        return;
      }
      if (knowsDarkroomRules === null) {
        setSubmitError('Lütfen karanlık oda kurallarını bilip bilmediğinizi belirtiniz.');
        return;
      }
    }

    if (!rulesAccepted) {
      setSubmitError('Lütfen Karanlık Oda Kullanım ve Güvenlik Kurallarını kabul ediniz.');
      return;
    }

    setSubmitting(true);
    try {
      const finalProcessType: DarkroomProcessType = activeMode === 'print' ? 'photo_print' : processType;

      const newRes = await api.createDarkroomReservation({
        member_id: verifiedMember.id,
        student_number: verifiedMember.student_number,
        department: department.trim(),
        date: selectedDate,
        slot_id: selectedSlot.id,
        slot_time: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
        process_type: finalProcessType,
        film_count: activeMode === 'print' ? Number(printCount) : Number(filmCount),
        film_brands_and_asa: filmCount > 1 ? filmBrandsAndAsa.trim() : null,
        different_asa_warning_ack: differentAsaAck,
        has_washed_film_before: hasWashedFilmBefore ?? undefined,
        has_entered_darkroom_before: hasEnteredDarkroomBefore ?? undefined,
        knows_darkroom_rules: knowsDarkroomRules ?? undefined,
        paper_size: activeMode === 'print' ? paperSize : null,
        chemical_source: finalProcessType === 'film_scan' ? 'personal' : chemicalSource,
        experience_level: experienceLevel,
        needs_assistance: needsAssistance,
        notes: notes.trim() || null,
        status: 'pending'
      });

      setSubmittedReservation(newRes);
      await loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Rezervasyon oluşturulurken bir hata meydana geldi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!submittedReservation) return;
    navigator.clipboard.writeText(submittedReservation.reservation_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const resetForm = () => {
    setSubmittedReservation(null);
    setSelectedSlotId(null);
    setNotes('');
    setFilmBrandsAndAsa('');
    setDifferentAsaAck(false);
    setRulesAccepted(false);
  };

  const getProcessTypeBadge = (type: DarkroomProcessType) => {
    switch (type) {
      case 'bw_film':
        return { label: 'S/B Film Yıkama', color: 'bg-zinc-800 text-zinc-200 border-zinc-700' };
      case 'photo_print':
        return { label: 'Kağıda Fotoğraf Baskısı', color: 'bg-purple-950/60 text-purple-300 border-purple-600/40' };
      case 'film_scan':
        return { label: 'Film Tarama', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-600/40' };
    }
  };

  const formattedSelectedDateTurkish = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Hero & Intro Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c0f18] via-[#2d1222] to-[#12080f] border border-[#657796]/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-[#4b253b]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-wider uppercase">
            <Droplets className="w-3.5 h-3.5 text-rose-400" />
            <span>Analog Laboratuvar & Karanlık Oda</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight font-club">
            Karanlık Oda & Analog Rezervasyon
          </h1>

          <p className="text-sm sm:text-base text-[#dce4ef] leading-relaxed">
            Kulüpler Vadisi Davutpaşa Kampüsü'ndeki karanlık odamızda siyah-beyaz film banyonuzu yapabilir, Epson V600 ile filmlerinizi tarayabilir veya agrandisör ile kağıda fotoğraf baskısı alabilirsiniz.
          </p>

          {/* Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3 rounded-2xl bg-[#12080f]/80 border border-[#657796]/20">
              <span className="text-[10px] text-[#8193b2] uppercase font-bold block">Seans Süresi</span>
              <strong className="text-white text-sm font-semibold flex items-center gap-1.5 mt-0.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#8193b2]" />
                1,5 Saat (90 dk)
              </strong>
            </div>

            <div className="p-3 rounded-2xl bg-[#12080f]/80 border border-[#657796]/20">
              <span className="text-[10px] text-[#8193b2] uppercase font-bold block">Konum & Teslim</span>
              <strong className="text-white text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Kulüpler Vadisi
              </strong>
            </div>

            <div className="p-3 rounded-2xl bg-[#12080f]/80 border border-[#657796]/20">
              <span className="text-[10px] text-[#8193b2] uppercase font-bold block">Aynı Gün Kuralı</span>
              <strong className="text-[#dce4ef] text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                Yıkama & Baskı Ayrı Gün
              </strong>
            </div>

            <div className="p-3 rounded-2xl bg-[#12080f]/80 border border-[#657796]/20">
              <span className="text-[10px] text-[#8193b2] uppercase font-bold block">Öncelik Durumu</span>
              <strong className="text-emerald-400 text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Aktif Üyeler
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED APPOINTMENT MODE SWITCHER (Film Yıkama vs Fotoğraf Baskısı) */}
      <div className="p-2 rounded-2xl bg-[#1c0f18] border border-[#657796]/30 shadow-lg flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveMode('wash');
            setSelectedSlotId(null);
          }}
          className={`flex-1 p-4 rounded-xl text-left transition-all flex items-center gap-3.5 cursor-pointer ${
            activeMode === 'wash'
              ? 'bg-gradient-to-r from-rose-950 to-[#301322] border border-rose-500/60 shadow-lg text-white'
              : 'hover:bg-[#12080f] text-[#8193b2] hover:text-white border border-transparent'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            activeMode === 'wash' ? 'bg-rose-600 text-white shadow-md' : 'bg-[#12080f] text-[#8193b2]'
          }`}>
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm sm:text-base font-bold font-club text-white">
                Film Yıkama & Tarama Randevusu
              </strong>
              {activeMode === 'wash' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  Seçili
                </span>
              )}
            </div>
            <p className="text-xs text-[#a9b9d3] mt-0.5">
              Film tankı ile S/B film banyosu veya negatif tarama
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('print');
            setSelectedSlotId(null);
          }}
          className={`flex-1 p-4 rounded-xl text-left transition-all flex items-center gap-3.5 cursor-pointer ${
            activeMode === 'print'
              ? 'bg-gradient-to-r from-purple-950 to-[#301322] border border-purple-500/60 shadow-lg text-white'
              : 'hover:bg-[#12080f] text-[#8193b2] hover:text-white border border-transparent'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            activeMode === 'print' ? 'bg-purple-600 text-white shadow-md' : 'bg-[#12080f] text-[#8193b2]'
          }`}>
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm sm:text-base font-bold font-club text-white">
                Kağıda Fotoğraf Baskısı Randevusu
              </strong>
              {activeMode === 'print' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-white">
                  Seçili
                </span>
              )}
            </div>
            <p className="text-xs text-[#a9b9d3] mt-0.5">
              Agrandisör ile karanlık oda fotoğraf kağıdına projeksiyon ve kart baskı seansı
            </p>
          </div>
        </button>
      </div>

      {/* Notice when no slots are open in the system */}
      {slots.length === 0 && (
        <div className="p-4 rounded-2xl bg-[#301322]/80 border border-[#657796]/40 flex items-start gap-3.5 text-xs text-[#dce4ef] shadow-lg">
          <div className="p-2 rounded-xl bg-[#12080f] text-[#8193b2] border border-[#657796]/30 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Şu Anda Açık Randevu Seansı Bulunmuyor</h4>
            <p className="text-[#a9b9d3] mt-0.5 leading-relaxed">
              Karanlık oda randevu saatleri yönetim kurulu tarafından nöbet takvimine göre belirlenmektedir. Yöneticilerimiz gün ve saat açtığında takvimde yeşil olarak görünecektir.
            </p>
          </div>
        </div>
      )}

      {/* Main Reservation Flow: Calendar + Slot Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Calendar (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-[#1c0f18] border border-[#657796]/25 shadow-xl space-y-5">
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#8193b2] uppercase font-bold tracking-wider block">
                  1. Adım: Müsait Tarihi Seçin
                </span>
                <h2 className="text-xl font-bold text-white font-club capitalize mt-0.5">
                  {formatMonthTitle(currentMonthDate)}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="px-3 py-1.5 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[11px] font-semibold text-[#dce4ef] hover:text-white border border-[#657796]/30 transition-colors cursor-pointer"
                >
                  Bugün
                </button>
                <div className="flex items-center gap-1 bg-[#12080f] p-1 rounded-xl border border-[#657796]/30">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-[#301322] text-[#8193b2] hover:text-white transition-colors cursor-pointer"
                    title="Önceki Ay"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-[#301322] text-[#8193b2] hover:text-white transition-colors cursor-pointer"
                    title="Sonraki Ay"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Weekday Names */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#8193b2] border-b border-[#657796]/20 pb-2">
              <span>Pzt</span>
              <span>Sal</span>
              <span>Çar</span>
              <span>Per</span>
              <span>Cum</span>
              <span className="text-rose-400/80">Cmt</span>
              <span className="text-rose-400/80">Paz</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDate;
                const totalOpen = cell.totalOpenSlots || 0;
                const hasOpen = totalOpen > 0;
                const availableCount = Math.max(0, totalOpen - cell.bookedCount);
                const isFull = hasOpen && availableCount === 0;

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    disabled={cell.isPast || !cell.isCurrentMonth}
                    onClick={() => {
                      if (!cell.isPast && cell.isCurrentMonth) {
                        setSelectedDate(cell.dateStr);
                        setSelectedSlotId(null);
                      }
                    }}
                    className={`relative p-2.5 rounded-2xl min-h-[72px] sm:min-h-[82px] text-left flex flex-col justify-between transition-all border cursor-pointer ${
                      isSelected
                        ? activeMode === 'print'
                          ? 'bg-gradient-to-br from-[#2a1334] to-[#1a0a22] border-purple-500 shadow-lg shadow-purple-950/40 ring-2 ring-purple-500/30'
                          : 'bg-gradient-to-br from-[#3a1529] to-[#250d1b] border-rose-500 shadow-lg shadow-rose-950/40 ring-2 ring-rose-500/30'
                        : cell.isPast || !cell.isCurrentMonth
                        ? 'bg-[#12080f]/40 border-transparent opacity-30 cursor-not-allowed text-[#657796]'
                        : hasOpen
                        ? 'bg-[#12080f] hover:bg-[#20101b] border-[#657796]/40 hover:border-[#657796]/80 text-white shadow-sm'
                        : 'bg-[#12080f]/50 hover:bg-[#1a0c16] border-[#657796]/15 text-[#8193b2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm font-bold ${
                        isSelected 
                          ? 'text-white' 
                          : cell.isToday 
                          ? 'text-white font-extrabold' 
                          : hasOpen
                          ? 'text-white'
                          : 'text-[#8193b2]'
                      }`}>
                        {cell.dayNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        {cell.isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8193b2] animate-pulse" title="Bugün" />
                        )}
                        {hasOpen && !cell.isPast && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Açık seans mevcut" />
                        )}
                      </div>
                    </div>

                    {/* Slot Availability Indicator */}
                    {cell.isCurrentMonth && !cell.isPast && (
                      <div className="mt-1">
                        {!hasOpen ? (
                          <span className="text-[9px] text-[#657796] block truncate">
                            Seans Yok
                          </span>
                        ) : isFull ? (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20 block truncate">
                            Dolu
                          </span>
                        ) : (
                          <span className={`text-[9px] font-medium block truncate ${
                            isSelected ? 'text-white font-bold' : 'text-emerald-400 font-semibold'
                          }`}>
                            {availableCount} seans açık
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-[#8193b2] border-t border-[#657796]/20">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Açık Seans Var</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span>Tüm Seanslar Dolu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#657796]" />
                  <span>Seans Açılmamış (Kapalı)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8193b2]" />
                  <span>Bugün</span>
                </div>
              </div>
              <span className="font-mono text-[#a9b9d3]">
                Her seans net 1,5 saattir
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Time Slot Picker on Selected Day (5 Cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-[#1c0f18] border border-[#657796]/25 shadow-xl space-y-4">
            <div>
              <span className="text-[10px] text-[#8193b2] uppercase font-bold tracking-wider block">
                2. Adım: 1,5 Saatlik Seans Saati Seçin
              </span>
              <h3 className="text-lg font-bold text-white font-club mt-0.5">
                {formattedSelectedDateTurkish}
              </h3>
              <p className="text-xs text-[#a9b9d3] mt-0.5">
                {activeMode === 'wash' ? 'Film yıkama / tarama' : 'Kağıda fotoğraf baskısı'} için açık saat dilimini seçiniz:
              </p>
            </div>

            {/* Slots List */}
            {slotsOnSelectedDate.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#12080f] border border-[#657796]/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#301322] border border-[#657796]/30 text-rose-300 flex items-center justify-center mx-auto shadow-inner">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white font-club">
                  Bu Tarihte Açık Randevu Saati Yok
                </h4>
                <p className="text-xs text-[#a9b9d3] leading-relaxed max-w-sm mx-auto">
                  Yönetim kurulu tarafından <strong className="text-white">{formattedSelectedDateTurkish}</strong> için henüz {activeMode === 'wash' ? 'film yıkama' : 'kağıda baskı'} randevusu açılmamıştır. Karanlık oda seansları nöbetçi yöneticiler tarafından belirlenmektedir.
                </p>
                <div className="p-2.5 rounded-xl bg-[#1c0f18] border border-[#657796]/20 text-[11px] text-[#8193b2] max-w-sm mx-auto">
                  💡 Takvimde yeşil renkle belirtilen açık günlerden seçim yapabilirsiniz.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {slotsOnSelectedDate.map((slot, index) => {
                  const bookedRes = reservationsOnSelectedDate.find(r => r.slot_id === slot.id);
                  const isBooked = Boolean(bookedRes);
                  const isSelected = selectedSlotId === slot.id;

                  const capabilityBadge = slot.allowed_process === 'all' 
                    ? 'Film Yıkama & Baskı' 
                    : slot.allowed_process === 'film_wash' 
                    ? 'Yalnızca Film Yıkama' 
                    : 'Yalnızca Kağıda Baskı';

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? activeMode === 'print'
                            ? 'bg-[#291334] border-purple-500 shadow-md ring-2 ring-purple-500/30'
                            : 'bg-[#301322] border-rose-500 shadow-md ring-2 ring-rose-500/30'
                          : isBooked
                          ? 'bg-[#12080f]/50 border-[#657796]/15 opacity-50 cursor-not-allowed'
                          : 'bg-[#12080f] hover:bg-[#20101b] border-[#657796]/25 hover:border-[#657796]/60 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold ${
                          isSelected 
                            ? activeMode === 'print' ? 'bg-purple-500 text-white' : 'bg-rose-500 text-white' 
                            : isBooked 
                            ? 'bg-zinc-800 text-zinc-500' 
                            : 'bg-[#301322] text-[#dce4ef] border border-[#657796]/30'
                        }`}>
                          {index + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-white text-sm font-mono font-semibold">
                              {slot.startTime} - {slot.endTime}
                            </strong>
                            <span className="text-[10px] text-[#8193b2] font-mono">
                              (90 dk)
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#301322] text-[#8193b2] border border-[#657796]/20">
                              {capabilityBadge}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#a9b9d3] flex items-center gap-2 mt-0.5">
                            <span>{slot.label}</span>
                            {slot.supervisor && (
                              <span className="text-[#8193b2]">
                                • Nöbetçi: <strong className="text-[#dce4ef]">{slot.supervisor}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isBooked ? (
                          <span className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-400 text-[10px] font-bold border border-zinc-700 block">
                            Rezerve Edildi
                          </span>
                        ) : isSelected ? (
                          <span className={`px-2.5 py-1 rounded-xl text-white text-[10px] font-bold flex items-center gap-1 shadow-sm ${
                            activeMode === 'print' ? 'bg-purple-600' : 'bg-rose-600'
                          }`}>
                            <Check className="w-3 h-3" />
                            <span>Seçildi</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            Müsait
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSlot && (
              <div className="p-3.5 rounded-2xl bg-[#301322]/40 border border-rose-500/30 text-xs text-[#dce4ef] space-y-1">
                <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Seçilen Seans Bilgisi</span>
                </div>
                <p>
                  <strong>{formattedSelectedDateTurkish}</strong> günü <strong>{selectedSlot.startTime} - {selectedSlot.endTime}</strong> (1,5 saat) için randevu formu aşağıdadır.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: Reservation Details Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1c0f18] border border-[#657796]/25 shadow-xl space-y-6">
        <div>
          <span className="text-[10px] text-[#8193b2] uppercase font-bold tracking-wider block">
            3. Adım: Bilgiler & Deneyim Anketi
          </span>
          <h3 className="text-xl font-bold text-white font-club mt-0.5">
            {activeMode === 'wash' ? 'Film Yıkama & Tarama Bilgi Formu' : 'Kağıda Fotoğraf Baskısı Bilgi Formu'}
          </h3>
          <p className="text-xs text-[#a9b9d3] mt-0.5">
            Laboratuvar güvenliği ve seans hazırlığı için lütfen aşağıdaki soruları eksiksiz yanıtlayınız.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Whitelist Verification Field */}
          <div className="p-5 rounded-2xl bg-[#12080f] border border-[#657796]/20 space-y-3">
            <label className="text-xs font-semibold text-white block">
              Öğrenci Numarası (Whitelist Doğrulaması) *
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Öğrenci Numaranız..."
                value={studentNumber}
                onChange={(e) => {
                  setStudentNumber(e.target.value);
                  setVerifiedMember(null);
                  setVerificationError(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1c0f18] border border-[#657796]/30 text-white text-xs font-mono placeholder-[#8193b2]"
              />

              <button
                type="button"
                onClick={handleVerifyStudent}
                disabled={verifying}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:opacity-90 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{verifying ? 'Doğrulanıyor...' : 'Üyeliği Doğrula'}</span>
              </button>
            </div>

            {verificationError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{verificationError}</span>
              </div>
            )}

            {verifiedMember && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white font-semibold">{verifiedMember.full_name}</strong>
                    <span className="text-[#a9b9d3] block text-[11px]">
                      {verifiedMember.role === 'admin' || verifiedMember.role === 'board' || verifiedMember.member_type === 'board' ? (
                        <>
                          {verifiedMember.department} • <strong className="text-emerald-400">Yönetim Kurulu Üyesi</strong>
                        </>
                      ) : verifiedMember.role === 'audit' || verifiedMember.member_type === 'audit' ? (
                        <>
                          {verifiedMember.department} • {verifiedMember.student_number} • <strong className="text-emerald-400">Denetim Kurulu Üyesi</strong>
                        </>
                      ) : (
                        <>
                          {verifiedMember.department} • {verifiedMember.student_number} • <strong className="text-emerald-400">Aktif Üye</strong>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  Öncelikli Onay
                </span>
              </div>
            )}
          </div>

          {/* Bölüm Field (Hangi bölümde okuyorsunuz) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white block">
              Hangi Bölümde Okuyorsunuz? *
            </label>
            <input
              type="text"
              placeholder="Örn: Fotoğraf ve Video, Mimarlık, Bilgisayar Mühendisliği, İletişim..."
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs placeholder-[#8193b2]"
            />
          </div>

          {/* SAME-DAY CONFLICT WARNING (Film yıkama ve baskı aynı güne alınamaz) */}
          {memberConflictOnSelectedDate && (
            <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold text-rose-300 block text-sm">Aynı Gün Kuralı Engeli:</strong>
                <p className="leading-relaxed">{memberConflictOnSelectedDate}</p>
              </div>
            </div>
          )}

          {/* MODE 1: FILM YIKAMA & TARAMA SPECIFIC FIELDS */}
          {activeMode === 'wash' && (
            <div className="p-5 rounded-2xl bg-[#12080f] border border-[#657796]/20 space-y-5">
              <div className="border-b border-[#657796]/20 pb-3">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                  Film Yıkama / Tarama İşlemi
                </span>
                <p className="text-[11px] text-[#a9b9d3] mt-0.5">
                  Yapmak istediğiniz işlemi seçiniz:
                </p>
              </div>

              {/* Sub-process selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProcessType('bw_film')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    processType === 'bw_film'
                      ? 'bg-[#301322] border-rose-500 text-white ring-1 ring-rose-500/40'
                      : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3]'
                  }`}
                >
                  <div>
                    <strong className="text-xs block text-white font-semibold">S/B Film Yıkama</strong>
                    <span className="text-[11px] text-[#8193b2] block mt-0.5">Film tankı & banyo/fiksaj kimyasalları</span>
                  </div>
                  {processType === 'bw_film' && <Check className="w-4 h-4 text-rose-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setProcessType('film_scan')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    processType === 'film_scan'
                      ? 'bg-[#1b2533] border-cyan-500 text-white ring-1 ring-cyan-500/40'
                      : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3]'
                  }`}
                >
                  <div>
                    <strong className="text-xs block text-white font-semibold">Film Tarama</strong>
                    <span className="text-[11px] text-[#8193b2] block mt-0.5">Epson Perfection V600 negatif tarayıcı</span>
                  </div>
                  {processType === 'film_scan' && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              </div>

              {/* Film Wash Questions */}
              {processType === 'bw_film' && (
                <div className="space-y-4 pt-2">
                  
                  {/* Q1: Daha önce film yıkadınız mı? */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white block">
                      Daha önce film yıkadınız mı? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setHasWashedFilmBefore(true)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          hasWashedFilmBefore === true
                            ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                            : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                        }`}
                      >
                        ✓ Evet, daha önce film yıkadım
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasWashedFilmBefore(false);
                          setNeedsAssistance(true); // Auto-suggest assistance
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          hasWashedFilmBefore === false
                            ? 'bg-[#301322] border-[#657796] text-white shadow-md'
                            : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                        }`}
                      >
                        ✗ Hayır, ilk defa film yıkayacağım
                      </button>
                    </div>
                  </div>

                  {/* Q2: Daha önce karanlık odaya girdiniz mi? */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white block">
                      Daha önce karanlık odaya girdiniz mi? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setHasEnteredDarkroomBefore(true)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          hasEnteredDarkroomBefore === true
                            ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                            : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                        }`}
                      >
                        ✓ Evet, daha önce girdim
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasEnteredDarkroomBefore(false)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          hasEnteredDarkroomBefore === false
                            ? 'bg-[#301322] border-[#657796] text-white shadow-md'
                            : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                        }`}
                      >
                        ✗ Hayır, ilk defa gireceğim
                      </button>
                    </div>
                  </div>

                  {/* Q3: Karanlık oda kurallarını biliyor musunuz? */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white block">
                      Karanlık oda kurallarını biliyor musunuz? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setKnowsDarkroomRules(true)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          knowsDarkroomRules === true
                            ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                            : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                        }`}
                      >
                        ✓ Evet, kuralları biliyorum
                      </button>
                      <button
                        type="button"
                        onClick={() => setKnowsDarkroomRules(false)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          knowsDarkroomRules === false
                            ? 'bg-rose-950/70 border-rose-500 text-rose-300'
                            : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                        }`}
                      >
                        ✗ Hayır, bilmiyorum (Rehberlik istiyorum)
                      </button>
                    </div>
                  </div>

                  {/* Q4: Kaç film yıkayacaksınız? */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white block">
                      Kaç film yıkayacaksınız? *
                    </label>
                    <select
                      value={filmCount}
                      onChange={(e) => setFilmCount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-[#1c0f18] border border-[#657796]/30 text-white text-xs font-semibold"
                    >
                      <option value={1}>1 Rulo Film (Önerilen - 1,5 saat için ideal)</option>
                      <option value={2}>2 Rulo Film</option>
                      <option value={3}>3 Rulo Film</option>
                      <option value={4}>4+ Rulo Film</option>
                    </select>
                  </div>

                  {/* Q5: Birden fazla ise film marka ve ASA değerleri */}
                  {filmCount > 1 && (
                    <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/40 space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#dce4ef] block">
                          Birden fazla ise film marka ve ASA (ISO) değerleri *
                        </label>
                        <p className="text-[11px] text-[#a9b9d3]">
                          Her bir filminizin marka, model ve ASA değerini yazınız:
                        </p>
                      </div>

                      <input
                        type="text"
                        placeholder="Örn: 1. Film: Kodak Tri-X 400, 2. Film: Ilford HP5+ 400"
                        value={filmBrandsAndAsa}
                        onChange={(e) => setFilmBrandsAndAsa(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs placeholder-[#8193b2]"
                      />

                      {/* ÖNEMLİ KURAL: AYNI DEĞİLSE İŞLEM SÜRESİ UZAR */}
                      <div className="p-3.5 rounded-xl bg-[#301322] border border-[#657796]/30 text-xs text-[#dce4ef] space-y-2">
                        <div className="flex items-center gap-2 font-bold text-[#dce4ef]">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Önemli Uyarı: Marka ve ASA değerleri aynı değilse işlem süresi uzar!</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#dce4ef]">
                          Farklı marka veya farklı ASA/ISO değerine sahip filmler aynı tankta aynı sürede geliştirilemez. Her biri için ayrı banyo ve yıkama döngüsü uygulanması gerektiğinden toplam seans süreniz uzayacaktır.
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="differentAsaAck"
                            checked={differentAsaAck}
                            onChange={(e) => setDifferentAsaAck(e.target.checked)}
                            className="w-4 h-4 rounded text-[#657796] focus:ring-[#657796] bg-[#12080f] border-[#657796]/40 cursor-pointer"
                          />
                          <label htmlFor="differentAsaAck" className="text-xs text-white font-medium cursor-pointer">
                            Filmlerimin marka/ASA durumunu biliyorum; farklı olmaları halinde sürenin uzayacağını onaylıyorum. *
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kimyasal Kaynağı */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white block">
                      Kullanılacak Kimyasal Kaynağı
                    </label>
                    <select
                      value={chemicalSource}
                      onChange={(e) => setChemicalSource(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-[#1c0f18] border border-[#657796]/30 text-white text-xs"
                    >
                      <option value="club">Kulübün Hazır Kimyasalları (Geliştirici / Stop / Fiksaj)</option>
                      <option value="personal">Kendi Özel Kimyasallarımı Getireceğim</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Scanning specific info */}
              {processType === 'film_scan' && (
                <div className="p-4 rounded-xl bg-[#1c0f18] border border-cyan-500/30 text-xs text-[#dce4ef] space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <Scan className="w-4 h-4" />
                    <span>Epson Perfection V600 Film Tarama İstasyonu</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#a9b9d3]">
                    Bu seansta kimyasal kullanılmaz. Banyo edilmiş, kuru ve kesilmiş 35mm veya 120 orta format negatif filmlerinizi yüksek optik çözünürlükle bilgisayara aktarabilirsiniz. Yanınızda USB bellek getirmeniz önerilir.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: KAĞIDA FOTOĞRAF BASKISI SPECIFIC FIELDS */}
          {activeMode === 'print' && (
            <div className="p-5 rounded-2xl bg-[#12080f] border border-purple-500/30 space-y-5">
              <div className="border-b border-[#657796]/20 pb-3">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  Kağıda Fotoğraf Baskısı (Agrandisör Seansı)
                </span>
                <p className="text-[11px] text-[#a9b9d3] mt-0.5">
                  Agrandisör ile karanlık oda kağıdına projeksiyon ve banyo tepsileri ile kart baskısı
                </p>
              </div>

              {/* Q1: Daha önce karanlık odaya girdiniz mi? */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">
                  Daha önce karanlık odaya girdiniz mi? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHasEnteredDarkroomBefore(true)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      hasEnteredDarkroomBefore === true
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                        : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                    }`}
                  >
                    ✓ Evet, daha önce girdim
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasEnteredDarkroomBefore(false)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      hasEnteredDarkroomBefore === false
                        ? 'bg-[#301322] border-[#657796] text-white shadow-md'
                        : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                    }`}
                  >
                    ✗ Hayır, ilk defa gireceğim
                  </button>
                </div>
              </div>

              {/* Q2: Daha önce agrandisör ile kağıda baskı yaptınız mı? */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">
                  Daha önce agrandisör ile kağıda fotoğraf baskısı yaptınız mı? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHasPrintedBefore(true)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      hasPrintedBefore === true
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                        : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                    }`}
                  >
                    ✓ Evet, daha önce baskı yaptım
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasPrintedBefore(false);
                      setNeedsAssistance(true);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      hasPrintedBefore === false
                        ? 'bg-[#301322] border-[#657796] text-white shadow-md'
                        : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                    }`}
                  >
                    ✗ Hayır, ilk defa baskı yapacağım
                  </button>
                </div>
              </div>

              {/* Q3: Karanlık oda kurallarını biliyor musunuz? */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">
                  Karanlık oda kurallarını biliyor musunuz? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setKnowsDarkroomRules(true)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      knowsDarkroomRules === true
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                        : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                    }`}
                  >
                    ✓ Evet, kuralları biliyorum
                  </button>
                  <button
                    type="button"
                    onClick={() => setKnowsDarkroomRules(false)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      knowsDarkroomRules === false
                        ? 'bg-rose-950/70 border-rose-500 text-rose-300'
                        : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                    }`}
                  >
                    ✗ Hayır, bilmiyorum (Rehberlik istiyorum)
                  </button>
                </div>
              </div>

              {/* Q4 & Q5: Basılacak fotoğraf adedi & Kağıt boyutu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Basılacak Tahmini Fotoğraf Sayısı
                  </label>
                  <select
                    value={printCount}
                    onChange={(e) => setPrintCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#1c0f18] border border-[#657796]/30 text-white text-xs font-semibold"
                  >
                    <option value={2}>1 - 2 Adet Baskı</option>
                    <option value={3}>3 - 4 Adet Baskı (Önerilen)</option>
                    <option value={5}>5 - 6 Adet Baskı</option>
                    <option value={8}>7+ Adet Seri Baskı</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Fotoğraf Kağıdı Ebadı
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#1c0f18] border border-[#657796]/30 text-white text-xs"
                  >
                    <option value="10x15 cm">10x15 cm (Küçük Kart)</option>
                    <option value="13x18 cm">13x18 cm</option>
                    <option value="18x24 cm">18x24 cm (Standart Sergi Ebadı)</option>
                    <option value="24x30 cm">24x30 cm (Büyük Ebat)</option>
                    <option value="custom">Kendi Özel Kağıdımı Getireceğim</option>
                  </select>
                </div>
              </div>

              {/* Q6: Negatifleriniz kuru ve hazır mı? */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">
                  Basılacak negatif filmleriniz tamamen kuru ve hazır mı? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNegativesReady(true)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      negativesReady === true
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                        : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                    }`}
                  >
                    ✓ Evet, negatiflerim kuru ve kesilmiş hazır
                  </button>
                  <button
                    type="button"
                    onClick={() => setNegativesReady(false)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      negativesReady === false
                        ? 'bg-[#301322] border-[#657796] text-white shadow-md'
                        : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3] hover:text-white'
                    }`}
                  >
                    ✗ Henüz kurumadı / hazır değil
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assistance Option (Rehberlik Desteği) */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#12080f] border border-[#657796]/20">
            <input
              type="checkbox"
              id="needsAssistance"
              checked={needsAssistance}
              onChange={(e) => setNeedsAssistance(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-[#1c0f18] border-[#657796]/40 cursor-pointer"
            />
            <label htmlFor="needsAssistance" className="text-xs text-[#dce4ef] cursor-pointer">
              <strong>Yönetim Kurulu Nöbetçi Rehberlik Desteği İstiyorum</strong>
              <span className="text-[11px] text-[#8193b2] block mt-0.5">
                İlk kez yapacaksanız nöbetçi yönetim kurulu üyemiz agrandisör ve banyoda baştan sona eşlik edecektir.
              </span>
            </label>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white block">
              Ekstra Notlar veya Özel İstekler (İsteğe Bağlı)
            </label>
            <input
              type="text"
              placeholder="Örn: Push banyo yapılacak, kendi kağıdımı getireceğim..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs placeholder-[#8193b2]"
            />
          </div>

          {/* Darkroom Rules & Guidelines */}
          <div className="p-4 rounded-2xl bg-[#301322]/60 border border-[#657796]/30 space-y-2 text-xs text-[#dce4ef]">
            <div className="flex items-center gap-2 font-bold text-[#dce4ef]">
              <Info className="w-4 h-4 text-[#8193b2] shrink-0" />
              <span>YTÜFOK Karanlık Oda Kullanım Yönergesi & Kuralları</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#a9b9d3]">
              <li><strong>Net 1,5 Saat:</strong> Her seans net 90 dakikadır. Süre bitiminde tankların durulanması ve tezgâh temizliği tamamlanmış olmalıdır.</li>
              <li><strong>Aynı Gün Kuralı:</strong> Film yıkama ve kağıda fotoğraf baskısı aynı güne alınamaz! Banyonun kuruması ve agrandisör düzeni gereği baskı farklı bir gün yapılmalıdır.</li>
              <li><strong>Kimyasal Güvenliği:</strong> Kullanılmış kimyasallar kesinlikle lavaboya dökülmez, kulübün kimyasal atık bidonuna boşaltılır.</li>
              <li><strong>Emniyet Lambası:</strong> Kırmızı emniyet lambası yanarken dışarıdan ışık girmemesi için kapı kilitli tutulmalıdır.</li>
              <li><strong>Zamanlama:</strong> Seans başlangıcından 10 dakika önce Kulüpler Vadisi kulüp odasında hazır bulunulmalıdır.</li>
            </ul>

            <div className="pt-2 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="rulesAccepted"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-[#1c0f18] border-[#657796]/40 cursor-pointer"
              />
              <label htmlFor="rulesAccepted" className="text-xs text-white font-medium cursor-pointer">
                Karanlık oda kurallarını, aynı gün kuralını ve güvenlik talimatlarını okudum, kabul ediyorum. *
              </label>
            </div>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-[#8193b2]">
              {selectedSlot ? (
                <span>
                  Seçilen: <strong className="text-white">{formattedSelectedDateTurkish}</strong> • <strong className="text-rose-300">{selectedSlot.startTime} - {selectedSlot.endTime} (1,5 saat)</strong>
                </span>
              ) : (
                <span className="text-[#a9b9d3]">Lütfen yukarıdan bir seans saati seçiniz</span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSlotId || !verifiedMember || !rulesAccepted || Boolean(memberConflictOnSelectedDate)}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                submitting || !selectedSlotId || !verifiedMember || !rulesAccepted || Boolean(memberConflictOnSelectedDate)
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  : activeMode === 'print'
                  ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white shadow-purple-900/40'
                  : 'bg-gradient-to-r from-rose-700 via-[#4b253b] to-[#301322] hover:from-rose-600 hover:to-[#421d31] text-white shadow-rose-950/40'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>
                {submitting ? 'Talep İletiliyor...' : activeMode === 'print' ? 'Fotoğraf Baskısı Randevusunu Tamamla' : 'Film Yıkama Randevusunu Tamamla'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {submittedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1c0f18] border border-[#657796]/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-950/40">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>

              <h3 className="text-2xl font-bold text-white font-club">
                Randevunuz Alındı!
              </h3>

              <p className="text-xs text-[#a9b9d3]">
                Talebiniz yönetim kurulunun onayına iletildi. Onay durumu WhatsApp ve sistem üzerinden bildirilecektir.
              </p>
            </div>

            {/* Reservation Code Card */}
            <div className="p-4 rounded-2xl bg-[#12080f] border border-[#657796]/20 text-center space-y-2">
              <span className="text-[10px] text-[#8193b2] uppercase font-bold tracking-wider block">
                Takip & Randevu Kodunuz
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-2xl font-bold text-white tracking-wider">
                  {submittedReservation.reservation_code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-[#301322] hover:bg-[#421d31] text-[#8193b2] hover:text-white transition-colors cursor-pointer"
                  title="Kodu Kopyala"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Details Summary */}
            <div className="p-4 rounded-2xl bg-[#12080f] border border-[#657796]/20 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-[#657796]/15">
                <span className="text-[#8193b2]">Tarih & Seans:</span>
                <strong className="text-white font-mono">{submittedReservation.date} • {submittedReservation.slot_time} (1,5 Saat)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#657796]/15">
                <span className="text-[#8193b2]">İşlem:</span>
                <span className="text-rose-300 font-semibold">{getProcessTypeBadge(submittedReservation.process_type).label}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#657796]/15">
                <span className="text-[#8193b2]">Üye & Bölüm:</span>
                <span className="text-white">{verifiedMember?.full_name} ({submittedReservation.department || verifiedMember?.department})</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8193b2]">Konum:</span>
                <span className="text-emerald-400 font-medium">Kulüpler Vadisi, Davutpaşa Kampüsü</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 rounded-xl bg-[#301322] hover:bg-[#421d31] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Yeni Randevu Al
              </button>
              <button
                type="button"
                onClick={() => {
                  const code = submittedReservation?.reservation_code;
                  resetForm();
                  onNavigate('status', code);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:opacity-95 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Talebi Sorgula →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Darkroom Facility Info & Equipment Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1c0f18] border border-[#657796]/20 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8193b2]" />
          <h3 className="text-lg font-bold text-white font-club">
            Kulüpler Vadisi Karanlık Oda Envanteri & İmkânları
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#12080f] border border-[#657796]/20 space-y-1.5">
            <strong className="text-white text-sm block font-club">Film Yıkama Tankları</strong>
            <p className="text-[#a9b9d3]">
              3 adet çiftli/tekli spiral film tankı, 35mm ve 120 orta format ayarlanabilir spiraller mevcuttur.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#12080f] border border-[#657796]/20 space-y-1.5">
            <strong className="text-white text-sm block font-club">S/B Agrandisör</strong>
            <p className="text-[#a9b9d3]">
              35mm ve 6x6 orta format kondansatörlü agrandisör, 50mm ve 75mm agrandisör lensleri ve ayarlanabilir marjör (kadraj).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#12080f] border border-[#657796]/20 space-y-1.5">
            <strong className="text-white text-sm block font-club">Epson V600 Film Tarayıcı</strong>
            <p className="text-[#a9b9d3]">
              35mm ve 120 orta format negatif tutucular, yüksek optik çözünürlüklü dijital film tarama ve arşivleme istasyonu.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
