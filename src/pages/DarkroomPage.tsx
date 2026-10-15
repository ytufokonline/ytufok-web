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
        return { label: 'S/B Film Yıkama', color: 'border-white/20 bg-white/5 text-white' };
      case 'photo_print':
        return { label: 'Kağıda Fotoğraf Baskısı', color: 'border-white/20 bg-white/5 text-white' };
      case 'film_scan':
        return { label: 'Film Tarama', color: 'border-white/20 bg-white/5 text-white' };
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16 text-[#eed1d1]">
      
      {/* Header & Editorial Spec Strip */}
      <header className="space-y-6">
        <div className="space-y-3">
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/40">
            YTÜFOK Laboratuvar & Karanlık Oda
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-club">
            Karanlık Oda & Analog Rezervasyon
          </h1>
          <p className="text-base sm:text-lg text-white/60 font-light leading-relaxed max-w-3xl">
            Kulüpler Vadisi Davutpaşa Kampüsü'ndeki karanlık odamızda siyah-beyaz film banyonuzu yapabilir, negatif film tarayıcı ile arşivinizi dijitalleştirebilir veya agrandisör ile kart baskısı alabilirsiniz.
          </p>
        </div>

        {/* Minimalist Specs Strip */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-white/[0.08] text-xs font-mono text-white/50">
          <div>
            <span className="text-white/30 uppercase mr-2 tracking-wider">Seans:</span>
            <span className="text-white font-semibold">Net 1,5 Saat (90 dk)</span>
          </div>
          <div>
            <span className="text-white/30 uppercase mr-2 tracking-wider">Konum:</span>
            <span className="text-white">Kulüpler Vadisi</span>
          </div>
          <div>
            <span className="text-white/30 uppercase mr-2 tracking-wider">Kural:</span>
            <span className="text-white">Yıkama & Baskı Ayrı Gün</span>
          </div>
          <div>
            <span className="text-white/30 uppercase mr-2 tracking-wider">Erişim:</span>
            <span className="text-white">Aktif Üyeler</span>
          </div>
        </div>
      </header>

      {/* Mode Switcher: Apple Segmented Control */}
      <div className="p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row gap-1.5">
        <button
          type="button"
          onClick={() => {
            setActiveMode('wash');
            setSelectedSlotId(null);
          }}
          className={`flex-1 p-4 rounded-xl text-left transition-all flex items-start gap-3.5 cursor-pointer ${
            activeMode === 'wash'
              ? 'bg-white text-black shadow-lg'
              : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Droplets className={`w-5 h-5 shrink-0 mt-0.5 ${activeMode === 'wash' ? 'text-black' : 'text-white/40'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">Film Yıkama & Tarama</span>
              {activeMode === 'wash' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-black text-white">
                  Seçili
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 leading-normal ${activeMode === 'wash' ? 'text-black/70' : 'text-white/40'}`}>
              Film tankı ile S/B film banyosu veya negatif film tarayıcı seansı
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('print');
            setSelectedSlotId(null);
          }}
          className={`flex-1 p-4 rounded-xl text-left transition-all flex items-start gap-3.5 cursor-pointer ${
            activeMode === 'print'
              ? 'bg-white text-black shadow-lg'
              : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <ImageIcon className={`w-5 h-5 shrink-0 mt-0.5 ${activeMode === 'print' ? 'text-black' : 'text-white/40'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">Kağıda Fotoğraf Baskısı</span>
              {activeMode === 'print' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-black text-white">
                  Seçili
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 leading-normal ${activeMode === 'print' ? 'text-black/70' : 'text-white/40'}`}>
              Agrandisör ile karanlık oda kağıdına projeksiyon ve kart banyosu
            </p>
          </div>
        </button>
      </div>

      {/* Notice when no slots are open in the system */}
      {slots.length === 0 && (
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-start gap-4">
          <Clock className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-white tracking-tight">Şu Anda Açık Randevu Seansı Bulunmuyor</h4>
            <p className="text-white/50 leading-relaxed font-light">
              Karanlık oda randevu saatleri yönetim kurulu tarafından nöbet takvimine göre açılmaktadır. Takvim güncellendiğinde açık seanslar yeşil göstergeyle listelenecektir.
            </p>
          </div>
        </div>
      )}

      {/* Main Reservation Flow: Calendar + Slot Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Calendar (7 Cols on desktop) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7 space-y-6">
          
          {/* Calendar Controls */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40 block">
                1. Adım: Tarih Seçimi
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white capitalize mt-1">
                {formatMonthTitle(currentMonthDate)}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-white/70 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
              >
                Bugün
              </button>
              <div className="flex items-center border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Önceki Ay"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Sonraki Ay"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono uppercase tracking-wider text-white/35 border-b border-white/[0.06] pb-2.5">
            <span>Pzt</span>
            <span>Sal</span>
            <span>Çar</span>
            <span>Per</span>
            <span>Cum</span>
            <span className="text-white/60">Cmt</span>
            <span className="text-white/60">Paz</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
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
                  className={`relative p-2.5 rounded-xl min-h-[68px] sm:min-h-[76px] text-left flex flex-col justify-between transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-lg'
                      : cell.isPast || !cell.isCurrentMonth
                      ? 'border-transparent opacity-20 cursor-not-allowed text-white/20'
                      : hasOpen
                      ? 'border-white/20 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/40 text-white'
                      : 'border-white/[0.04] bg-transparent hover:bg-white/[0.02] text-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm ${
                      isSelected
                        ? 'font-bold text-black'
                        : cell.isToday
                        ? 'font-bold text-white'
                        : 'font-normal'
                    }`}>
                      {cell.dayNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      {cell.isToday && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60" title="Bugün" />
                      )}
                      {hasOpen && !cell.isPast && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-emerald-400'}`} title="Açık seans mevcut" />
                      )}
                    </div>
                  </div>

                  {/* Slot Availability Indicator */}
                  {cell.isCurrentMonth && !cell.isPast && (
                    <div className="mt-1">
                      {!hasOpen ? (
                        <span className="text-[9px] font-mono text-white/20 block truncate">
                          Kapalı
                        </span>
                      ) : isFull ? (
                        <span className={`text-[9px] font-mono block truncate ${isSelected ? 'text-black/60 font-semibold' : 'text-white/40'}`}>
                          Dolu
                        </span>
                      ) : (
                        <span className={`text-[9px] font-mono block truncate ${
                          isSelected ? 'text-black font-semibold' : 'text-emerald-400 font-medium'
                        }`}>
                          {availableCount} seans
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] font-mono text-white/40 border-t border-white/[0.06]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Açık Seans Var</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span>Tüm Seanslar Dolu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/15" />
                <span>Kapalı</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/60" />
                <span>Bugün</span>
              </div>
            </div>
            <span>Her seans 1,5 saattir</span>
          </div>
        </div>

        {/* Right Column: Time Slot Picker on Selected Day (5 Cols on desktop) */}
        <div className="lg:col-span-5 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7 space-y-5">
          <div>
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40 block">
              2. Adım: Seans Saati
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white capitalize mt-1">
              {formattedSelectedDateTurkish}
            </h3>
            <p className="text-xs text-white/50 font-light mt-1">
              {activeMode === 'wash' ? 'Film yıkama / tarama' : 'Kağıda fotoğraf baskısı'} için uygun saati belirleyin:
            </p>
          </div>

          {/* Slots List */}
          {slotsOnSelectedDate.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-3">
              <Clock className="w-6 h-6 text-white/30 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white tracking-tight">
                  Bu Tarihte Açık Randevu Saati Yok
                </h4>
                <p className="text-xs text-white/50 font-light leading-relaxed max-w-xs mx-auto">
                  {formattedSelectedDateTurkish} günü için henüz seans tanımlanmamıştır. Takvimde yeşil işaretli günleri inceleyebilirsiniz.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {slotsOnSelectedDate.map((slot, index) => {
                const bookedRes = reservationsOnSelectedDate.find(r => r.slot_id === slot.id);
                const isBooked = Boolean(bookedRes);
                const isSelected = selectedSlotId === slot.id;

                const capabilityBadge = slot.allowed_process === 'all' 
                  ? 'Yıkama & Baskı' 
                  : slot.allowed_process === 'film_wash' 
                  ? 'Yalnızca Yıkama' 
                  : 'Yalnızca Baskı';

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-lg'
                        : isBooked
                        ? 'border-white/[0.04] bg-white/[0.01] opacity-35 cursor-not-allowed'
                        : 'border-white/[0.08] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-semibold ${
                        isSelected 
                          ? 'bg-black text-white' 
                          : isBooked 
                          ? 'bg-white/5 text-white/30' 
                          : 'bg-white/10 text-white/80'
                      }`}>
                        {index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className={`text-sm font-mono font-semibold ${isSelected ? 'text-black' : 'text-white'}`}>
                            {slot.startTime} – {slot.endTime}
                          </strong>
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                            (90 dk)
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                            isSelected ? 'bg-black/10 text-black' : 'border border-white/10 text-white/50'
                          }`}>
                            {capabilityBadge}
                          </span>
                        </div>
                        <div className={`text-[11px] flex items-center gap-2 mt-0.5 ${isSelected ? 'text-black/70' : 'text-white/50'}`}>
                          <span>{slot.label}</span>
                          {slot.supervisor && (
                            <span>
                              • Nöbetçi: <strong className={isSelected ? 'text-black font-semibold' : 'text-white/80 font-medium'}>{slot.supervisor}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isBooked ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-white/30 border border-white/10 block">
                          Rezerve
                        </span>
                      ) : isSelected ? (
                        <span className="px-2.5 py-1 rounded-full text-white text-[10px] font-mono bg-black font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Seçildi</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
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
            <div className="p-4 rounded-2xl border border-white/15 bg-white/[0.04] text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Seçilen Seans</span>
              </div>
              <p className="text-white/70 font-light">
                <strong>{formattedSelectedDateTurkish}</strong> • <strong>{selectedSlot.startTime} – {selectedSlot.endTime}</strong> (1,5 saat)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Reservation Details Form */}
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-10 space-y-8">
        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40 block">
            3. Adım: Bilgiler & Deneyim Anketi
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-club mt-1">
            {activeMode === 'wash' ? 'Film Yıkama & Tarama Bilgi Formu' : 'Kağıda Fotoğraf Baskısı Bilgi Formu'}
          </h3>
          <p className="text-xs sm:text-sm text-white/50 font-light mt-1">
            Laboratuvar güvenliği ve kimyasal hazırlığı için aşağıdaki bilgileri eksiksiz yanıtlayınız.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Whitelist Verification Field */}
          <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.01] space-y-4">
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
              Öğrenci Numarası (Üyelik Doğrulaması) *
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
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono placeholder:text-white/25 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
              />

              <button
                type="button"
                onClick={handleVerifyStudent}
                disabled={verifying}
                className="px-6 py-3 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{verifying ? 'Doğrulanıyor...' : 'Üyeliği Doğrula'}</span>
              </button>
            </div>

            {verificationError && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{verificationError}</span>
              </div>
            )}

            {verifiedMember && (
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/15 bg-white/[0.04] text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white font-semibold">{verifiedMember.full_name}</strong>
                    <span className="text-white/60 block text-[11px] font-light">
                      {verifiedMember.role === 'admin' || verifiedMember.role === 'board' || verifiedMember.member_type === 'board' ? (
                        <>
                          {verifiedMember.department} • <strong className="text-white font-semibold">Yönetim Kurulu Üyesi</strong>
                        </>
                      ) : verifiedMember.role === 'audit' || verifiedMember.member_type === 'audit' ? (
                        <>
                          {verifiedMember.department} • {verifiedMember.student_number} • <strong className="text-white font-semibold">Denetim Kurulu Üyesi</strong>
                        </>
                      ) : (
                        <>
                          {verifiedMember.department} • {verifiedMember.student_number} • <strong className="text-white font-semibold">Aktif Üye</strong>
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  Onaylı Üye
                </span>
              </div>
            )}
          </div>

          {/* Bölüm Field */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
              Hangi Bölümde Okuyorsunuz? *
            </label>
            <input
              type="text"
              placeholder="Örn: Fotoğraf ve Video, Mimarlık, Bilgisayar Mühendisliği, İletişim..."
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
            />
          </div>

          {/* SAME-DAY CONFLICT WARNING */}
          {memberConflictOnSelectedDate && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] text-rose-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-semibold text-rose-300 block text-sm">Aynı Gün Kuralı Engeli</strong>
                <p className="leading-relaxed font-light">{memberConflictOnSelectedDate}</p>
              </div>
            </div>
          )}

          {/* MODE 1: FILM YIKAMA & TARAMA SPECIFIC FIELDS */}
          {activeMode === 'wash' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.01] space-y-5">
              <div className="border-b border-white/[0.06] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                  İşlem Türü
                </span>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Yapmak istediğiniz işlemi belirleyin:
                </p>
              </div>

              {/* Sub-process selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProcessType('bw_film')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    processType === 'bw_film'
                      ? 'bg-white text-black border-white shadow-md'
                      : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                  }`}
                >
                  <div>
                    <strong className="text-xs block font-semibold">S/B Film Yıkama</strong>
                    <span className={`text-[11px] block mt-0.5 ${processType === 'bw_film' ? 'text-black/70' : 'text-white/40'}`}>
                      Film tankı & banyo/fiksaj kimyasalları
                    </span>
                  </div>
                  {processType === 'bw_film' && <Check className="w-4 h-4 text-black" />}
                </button>

                <button
                  type="button"
                  onClick={() => setProcessType('film_scan')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    processType === 'film_scan'
                      ? 'bg-white text-black border-white shadow-md'
                      : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                  }`}
                >
                  <div>
                    <strong className="text-xs block font-semibold">Film Tarama</strong>
                    <span className={`text-[11px] block mt-0.5 ${processType === 'film_scan' ? 'text-black/70' : 'text-white/40'}`}>
                      Negatif film dijital tarayıcı
                    </span>
                  </div>
                  {processType === 'film_scan' && <Check className="w-4 h-4 text-black" />}
                </button>
              </div>

              {/* Film Wash Questions */}
              {processType === 'bw_film' && (
                <div className="space-y-5 pt-2">
                  
                  {/* Q1: Daha önce film yıkadınız mı? */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                      Daha önce film yıkadınız mı? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setHasWashedFilmBefore(true)}
                        className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                          hasWashedFilmBefore === true
                            ? 'bg-white text-black border-white shadow-md'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                        }`}
                      >
                        Evet, daha önce film yıkadım
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasWashedFilmBefore(false);
                          setNeedsAssistance(true);
                        }}
                        className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                          hasWashedFilmBefore === false
                            ? 'bg-white text-black border-white shadow-md'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                        }`}
                      >
                        Hayır, ilk defa yıkayacağım
                      </button>
                    </div>
                  </div>

                  {/* Q2: Daha önce karanlık odaya girdiniz mi? */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                      Daha önce karanlık odaya girdiniz mi? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setHasEnteredDarkroomBefore(true)}
                        className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                          hasEnteredDarkroomBefore === true
                            ? 'bg-white text-black border-white shadow-md'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                        }`}
                      >
                        Evet, daha önce girdim
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasEnteredDarkroomBefore(false)}
                        className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                          hasEnteredDarkroomBefore === false
                            ? 'bg-white text-black border-white shadow-md'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                        }`}
                      >
                        Hayır, ilk defa gireceğim
                      </button>
                    </div>
                  </div>

                  {/* Q3: Karanlık oda kurallarını biliyor musunuz? */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                      Karanlık oda kurallarını biliyor musunuz? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setKnowsDarkroomRules(true)}
                        className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                          knowsDarkroomRules === true
                            ? 'bg-white text-black border-white shadow-md'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                        }`}
                      >
                        Evet, kuralları biliyorum
                      </button>
                      <button
                        type="button"
                        onClick={() => setKnowsDarkroomRules(false)}
                        className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                          knowsDarkroomRules === false
                            ? 'bg-white text-black border-white shadow-md'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                        }`}
                      >
                        Hayır, bilmiyorum (Rehberlik talep ediyorum)
                      </button>
                    </div>
                  </div>

                  {/* Q4: Kaç film yıkayacaksınız? */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                      Kaç film yıkayacaksınız? *
                    </label>
                    <select
                      value={filmCount}
                      onChange={(e) => setFilmCount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-[#140911] border border-white/10 text-white text-xs focus:outline-none focus:border-white/40 transition-all font-mono"
                    >
                      <option value={1}>1 Rulo Film (Önerilen — 1,5 saat için ideal)</option>
                      <option value={2}>2 Rulo Film</option>
                      <option value={3}>3 Rulo Film</option>
                      <option value={4}>4+ Rulo Film</option>
                    </select>
                  </div>

                  {/* Q5: Birden fazla ise film marka ve ASA değerleri */}
                  {filmCount > 1 && (
                    <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.01] space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                          Birden fazla film için marka ve ASA (ISO) değerleri *
                        </label>
                        <p className="text-[11px] text-white/40">
                          Her bir filminizin marka, model ve ASA değerini belirtiniz:
                        </p>
                      </div>

                      <input
                        type="text"
                        placeholder="Örn: 1. Film: Kodak Tri-X 400, 2. Film: Ilford HP5+ 400"
                        value={filmBrandsAndAsa}
                        onChange={(e) => setFilmBrandsAndAsa(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
                      />

                      {/* Önemli Uyarı: Farklı ASA */}
                      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] text-xs space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-amber-200">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>Önemli Uyarı: Marka ve ASA değerleri aynı değilse seans uzar</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-200/80 font-light">
                          Farklı marka veya farklı ASA/ISO değerindeki filmler aynı tankta aynı sürede banyo edilemez. Her biri için ayrı geliştirme süreci uygulanması seans sürenizi aşabilir.
                        </p>
                        <div className="pt-1 flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            id="differentAsaAck"
                            checked={differentAsaAck}
                            onChange={(e) => setDifferentAsaAck(e.target.checked)}
                            className="w-4 h-4 rounded text-white focus:ring-white bg-white/10 border-white/20 cursor-pointer"
                          />
                          <label htmlFor="differentAsaAck" className="text-xs text-white/90 font-medium cursor-pointer">
                            Filmlerimin marka/ASA durumunu biliyorum; farklı olmaları halinde sürenin uzayacağını onaylıyorum. *
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kimyasal Kaynağı */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                      Kullanılacak Kimyasal Kaynağı
                    </label>
                    <select
                      value={chemicalSource}
                      onChange={(e) => setChemicalSource(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl bg-[#140911] border border-white/10 text-white text-xs focus:outline-none focus:border-white/40 transition-all"
                    >
                      <option value="club">Kulübün Hazır Kimyasalları (Geliştirici / Stop / Fiksaj)</option>
                      <option value="personal">Kendi Özel Kimyasallarımı Getireceğim</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Scanning specific info */}
              {processType === 'film_scan' && (
                <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Scan className="w-4 h-4 text-white/70" />
                    <span>Negatif Film Tarama İstasyonu</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-white/50 font-light">
                    Bu seansta kimyasal banyo kullanılmaz. Banyo edilmiş, kuru ve kesilmiş 35mm negatif filmlerinizi yüksek optik çözünürlükle dijital ortama aktarabilirsiniz. Yanınızda USB bellek getirmeniz önerilir.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: KAĞIDA FOTOĞRAF BASKISI SPECIFIC FIELDS */}
          {activeMode === 'print' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.01] space-y-5">
              <div className="border-b border-white/[0.06] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                  Kağıda Fotoğraf Baskısı (Agrandisör Seansı)
                </span>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Agrandisör ile karanlık oda kağıdına projeksiyon ve banyo tepsileri ile kart baskısı
                </p>
              </div>

              {/* Q1: Daha önce karanlık odaya girdiniz mi? */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                  Daha önce karanlık odaya girdiniz mi? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHasEnteredDarkroomBefore(true)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                      hasEnteredDarkroomBefore === true
                        ? 'bg-white text-black border-white shadow-md'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                    }`}
                  >
                    Evet, daha önce girdim
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasEnteredDarkroomBefore(false)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                      hasEnteredDarkroomBefore === false
                        ? 'bg-white text-black border-white shadow-md'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                    }`}
                  >
                    Hayır, ilk defa gireceğim
                  </button>
                </div>
              </div>

              {/* Q2: Daha önce agrandisör ile kağıda baskı yaptınız mı? */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                  Daha önce agrandisör ile kağıda fotoğraf baskısı yaptınız mı? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHasPrintedBefore(true)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                      hasPrintedBefore === true
                        ? 'bg-white text-black border-white shadow-md'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                    }`}
                  >
                    Evet, daha önce baskı yaptım
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasPrintedBefore(false);
                      setNeedsAssistance(true);
                    }}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                      hasPrintedBefore === false
                        ? 'bg-white text-black border-white shadow-md'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                    }`}
                  >
                    Hayır, ilk defa yapacağım
                  </button>
                </div>
              </div>

              {/* Q3: Karanlık oda kurallarını biliyor musunuz? */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                  Karanlık oda kurallarını biliyor musunuz? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setKnowsDarkroomRules(true)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                      knowsDarkroomRules === true
                        ? 'bg-white text-black border-white shadow-md'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                    }`}
                  >
                    Evet, kuralları biliyorum
                  </button>
                  <button
                    type="button"
                    onClick={() => setKnowsDarkroomRules(false)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                      knowsDarkroomRules === false
                        ? 'bg-white text-black border-white shadow-md'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                    }`}
                  >
                    Hayır, bilmiyorum (Rehberlik talep ediyorum)
                  </button>
                </div>
              </div>

              {/* Q4 & Q5: Basılacak fotoğraf adedi & Kağıt boyutu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                    Tahmini Baskı Adedi
                  </label>
                  <select
                    value={printCount}
                    onChange={(e) => setPrintCount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-[#140911] border border-white/10 text-white text-xs focus:outline-none focus:border-white/40 transition-all font-mono"
                  >
                    <option value={2}>1 – 2 Adet Baskı</option>
                    <option value={3}>3 – 4 Adet Baskı (Önerilen)</option>
                    <option value={5}>5 – 6 Adet Baskı</option>
                    <option value={8}>7+ Adet Seri Baskı</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                    Fotoğraf Kağıdı Ebadı
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#140911] border border-white/10 text-white text-xs focus:outline-none focus:border-white/40 transition-all"
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
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                  Basılacak negatifleriniz tamamen kuru ve hazır mı? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNegativesReady(true)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                      negativesReady === true
                        ? 'bg-white text-black border-white shadow-md'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                    }`}
                  >
                    Evet, negatiflerim kuru ve hazır
                  </button>
                  <button
                    type="button"
                    onClick={() => setNegativesReady(false)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                      negativesReady === false
                        ? 'bg-white text-black border-white shadow-md'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                    }`}
                  >
                    Henüz kurumadı / hazır değil
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assistance Option */}
          <div className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.08] bg-white/[0.01]">
            <input
              type="checkbox"
              id="needsAssistance"
              checked={needsAssistance}
              onChange={(e) => setNeedsAssistance(e.target.checked)}
              className="w-4 h-4 rounded text-white focus:ring-white bg-white/10 border-white/20 cursor-pointer mt-0.5"
            />
            <label htmlFor="needsAssistance" className="text-xs text-white/80 cursor-pointer">
              <strong className="text-white block font-medium">Yönetim Kurulu Nöbetçi Rehberlik Desteği İstiyorum</strong>
              <span className="text-[11px] text-white/50 block mt-0.5 font-light">
                İlk kez yapacaksanız nöbetçi yönetim kurulu üyemiz agrandisör ve banyoda baştan sona eşlik edecektir.
              </span>
            </label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
              Ekstra Notlar veya Özel İstekler (İsteğe Bağlı)
            </label>
            <input
              type="text"
              placeholder="Örn: Push banyo yapılacak, kendi kağıdımı getireceğim..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
            />
          </div>

          {/* Darkroom Rules & Guidelines */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-white tracking-tight">
              <Info className="w-4 h-4 text-white/50 shrink-0" />
              <span>YTÜFOK Karanlık Oda Kullanım Yönergesi & Kuralları</span>
            </div>
            <ul className="space-y-2 text-[11px] text-white/60 font-light leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-white/30">•</span>
                <span><strong className="text-white font-medium">Net 1,5 Saat:</strong> Her seans net 90 dakikadır. Süre bitiminde tankların durulanması ve tezgâh temizliği tamamlanmış olmalıdır.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30">•</span>
                <span><strong className="text-white font-medium">Aynı Gün Kuralı:</strong> Film yıkama ve kağıda fotoğraf baskısı aynı güne alınamaz! Banyonun kuruması ve agrandisör düzeni gereği baskı farklı bir gün yapılmalıdır.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30">•</span>
                <span><strong className="text-white font-medium">Kimyasal Güvenliği:</strong> Kullanılmış kimyasallar kesinlikle lavaboya dökülmez, kulübün kimyasal atık bidonuna boşaltılır.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30">•</span>
                <span><strong className="text-white font-medium">Emniyet Lambası:</strong> Kırmızı emniyet lambası yanarken dışarıdan ışık sızmaması için kapı kilitli tutulmalıdır.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30">•</span>
                <span><strong className="text-white font-medium">Zamanlama:</strong> Seans başlangıcından 10 dakika önce Kulüpler Vadisi kulüp odasında hazır bulunulmalıdır.</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2.5">
              <input
                type="checkbox"
                id="rulesAccepted"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="w-4 h-4 rounded text-white focus:ring-white bg-white/10 border-white/20 cursor-pointer"
              />
              <label htmlFor="rulesAccepted" className="text-xs text-white font-medium cursor-pointer">
                Karanlık oda kurallarını, aynı gün kuralını ve güvenlik talimatlarını okudum, kabul ediyorum. *
              </label>
            </div>
          </div>

          {submitError && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
            <div className="text-xs font-mono text-white/50">
              {selectedSlot ? (
                <span>
                  Seçilen Seans: <strong className="text-white">{formattedSelectedDateTurkish}</strong> • <strong className="text-white">{selectedSlot.startTime} – {selectedSlot.endTime}</strong>
                </span>
              ) : (
                <span className="text-white/30">Lütfen yukarıdaki takvimden bir seans seçiniz</span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSlotId || !verifiedMember || !rulesAccepted || Boolean(memberConflictOnSelectedDate)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/20 disabled:cursor-not-allowed"
            >
              <Droplets className="w-4 h-4" />
              <span>
                {submitting ? 'Talep İletiliyor...' : activeMode === 'print' ? 'Fotoğraf Baskısı Randevusunu Tamamla' : 'Film Yıkama Randevusunu Tamamla'}
              </span>
            </button>
          </div>
        </form>
      </section>

      {/* Success Modal */}
      {submittedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-[#140911] border border-white/15 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white mx-auto">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-white font-club">
                Randevunuz Alındı
              </h3>

              <p className="text-xs text-white/50 font-light">
                Talebiniz yönetim kurulunun onayına iletildi. Onay durumu WhatsApp ve sistem üzerinden bildirilecektir.
              </p>
            </div>

            {/* Reservation Code Card */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] text-center space-y-2">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40 block">
                Randevu Takip Kodu
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-bold text-white tracking-widest">
                  {submittedReservation.reservation_code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                  title="Kodu Kopyala"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Details Summary */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] text-xs divide-y divide-white/[0.06]">
              <div className="flex justify-between py-2">
                <span className="text-white/40">Tarih & Seans:</span>
                <strong className="text-white font-mono">{submittedReservation.date} • {submittedReservation.slot_time} (90 dk)</strong>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white/40">İşlem:</span>
                <span className="text-white font-medium">{getProcessTypeBadge(submittedReservation.process_type).label}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white/40">Üye & Bölüm:</span>
                <span className="text-white">{verifiedMember?.full_name} ({submittedReservation.department || verifiedMember?.department})</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white/40">Konum:</span>
                <span className="text-white font-mono">Kulüpler Vadisi</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/80 hover:text-white hover:border-white/30 text-xs font-mono transition-colors cursor-pointer text-center"
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
                className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-mono font-semibold transition-colors cursor-pointer text-center"
              >
                Talebi Sorgula →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Darkroom Facility Info & Equipment Overview */}
      <footer className="border-t border-white/[0.08] pt-12 space-y-6">
        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40 block">
            Laboratuvar Altyapısı
          </span>
          <h3 className="text-xl font-bold tracking-tight text-white font-club mt-1">
            Kulüpler Vadisi Karanlık Oda Envanteri
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-2">
            <strong className="text-white text-sm block font-medium tracking-tight">Film Yıkama Tankları</strong>
            <p className="text-white/50 font-light leading-relaxed">
              3 adet çiftli ve tekli spiral film tankı; 35mm spiraller ile tam donanımlı banyo istasyonu.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-2">
            <strong className="text-white text-sm block font-medium tracking-tight">S/B Agrandisör</strong>
            <p className="text-white/50 font-light leading-relaxed">
              35mm kondansatörlü agrandisör, 50mm lens ve ayarlanabilir kadraj marjörü.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-2">
            <strong className="text-white text-sm block font-medium tracking-tight">Negatif Film Tarayıcı</strong>
            <p className="text-white/50 font-light leading-relaxed">
              35mm negatif tutucular; yüksek optik çözünürlüklü dijital film tarama ve arşiv istasyonu.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
