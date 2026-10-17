import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, ShieldAlert, CheckCircle2, Copy, Check, FileText, MapPin, Compass, Clock, AlertTriangle, AlertCircle, UserPlus, Info, Sparkles, Lock, ChevronRight } from 'lucide-react';
import { Equipment, Member, Reservation, Trip } from '../types';
import { api } from '../lib/api';
import { checkTripBookingEligibility, resolveMemberTier, formatDateTr, formatDateRangeTr, getLocalDateString, parseDate, getDaysDifference } from '../utils/tripUtils';
import { AppleReveal } from '../components/AppleReveal';

interface ReservationPageProps {
  preselectedEquipmentId?: string;
  onNavigate: (tab: 'home' | 'equipment' | 'reserve' | 'status' | 'admin', extraParam?: string) => void;
}

export const ReservationPage: React.FC<ReservationPageProps> = ({ preselectedEquipmentId, onNavigate }) => {
  const initialSync = React.useMemo(() => api.getInitialSyncState(), []);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(initialSync.equipmentList);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    preselectedEquipmentId || initialSync.equipmentList[0]?.id || ''
  );
  
  // Whitelist & Member state
  const [studentNumber, setStudentNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedMember, setVerifiedMember] = useState<Member | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Trips state
  const [trips, setTrips] = useState<Trip[]>(initialSync.activeTrips);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [usageType, setUsageType] = useState<'trip' | 'custom'>(
    initialSync.activeTrips.length > 0 ? 'trip' : 'custom'
  );
  const [selectedTripId, setSelectedTripId] = useState<string>(
    initialSync.activeTrips[0]?.id || ''
  );

  // Dates & Purpose
  const todayStr = getLocalDateString();
  const defaultReturnDate = getLocalDateString(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));

  const [pickupDate, setPickupDate] = useState(
    initialSync.activeTrips[0]?.start_date || todayStr
  );
  const [returnDate, setReturnDate] = useState(
    initialSync.activeTrips[0]?.end_date || defaultReturnDate
  );
  const [purpose, setPurpose] = useState(
    initialSync.activeTrips[0]
      ? `YTÜFOK Kulüp Gezisi: ${initialSync.activeTrips[0].title} (${initialSync.activeTrips[0].destination})`
      : ''
  );
  const [tripCustomNotes, setTripCustomNotes] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedReservation, setSubmittedReservation] = useState<Reservation | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch equipment & active trips in a single batched request
  useEffect(() => {
    const syncBundle = async () => {
      try {
        const bundle = await api.getDashboardBundle();
        setEquipmentList(bundle.equipmentList);
        setTrips(bundle.activeTrips);
        if (!selectedEquipmentId && bundle.equipmentList.length > 0) {
          setSelectedEquipmentId(preselectedEquipmentId || bundle.equipmentList[0].id);
        }
        if (bundle.activeTrips.length > 0) {
          const isCurrentActive = bundle.activeTrips.some(t => t.id === selectedTripId);
          const tripToSelect = isCurrentActive 
            ? bundle.activeTrips.find(t => t.id === selectedTripId)! 
            : bundle.activeTrips[0];
          setSelectedTripId(tripToSelect.id);
          applyTripDetails(tripToSelect);
          setUsageType('trip');
        } else {
          // Aktif gezi yoksa veya pasife alınmışsa gezi seçimini temizle
          setSelectedTripId('');
          setUsageType('custom');
          setPurpose('');
          setPickupDate(todayStr);
          setReturnDate(defaultReturnDate);
        }
      } catch (err) {
        console.error('Geziler yüklenirken hata:', err);
      } finally {
        setLoadingTrips(false);
      }
    };

    syncBundle();
    window.addEventListener('focus', syncBundle);
    return () => window.removeEventListener('focus', syncBundle);
  }, [preselectedEquipmentId]);

  // Selected trip helper
  const selectedTrip = trips.find(t => t.id === selectedTripId) || null;
  const selectedEquipment = equipmentList.find(e => e.id === selectedEquipmentId) || null;
  const memberTier = resolveMemberTier(verifiedMember);
  const hasActivePrivileges = memberTier === 'board' || memberTier === 'audit' || memberTier === 'active' || memberTier === 'honorary_active';
  const tripEligibility = selectedTrip ? checkTripBookingEligibility(selectedTrip.start_date, memberTier) : null;

  // Apply trip dates & default purpose
  const applyTripDetails = (trip: Trip) => {
    setPickupDate(trip.start_date);
    setReturnDate(trip.end_date);
    setPurpose(`Kulüp Gezisi: ${trip.title} (${trip.destination})`);
  };

  const handleTripSelect = (trip: Trip) => {
    setSelectedTripId(trip.id);
    applyTripDetails(trip);
  };

  const handleVerifyStudent = async () => {
    if (!studentNumber.trim()) {
      setVerificationError('Lütfen geçerli bir öğrenci numarası giriniz.');
      setVerifiedMember(null);
      return;
    }

    setVerifying(true);
    setVerificationError(null);

    try {
      const result = await api.verifyStudentNumber(studentNumber);
      if (result.success && result.member) {
        setVerifiedMember(result.member);
        setVerificationError(null);
      } else {
        setVerifiedMember(null);
        setVerificationError(result.message || 'Girdiğiniz öğrenci numarası kulüp üye listesinde bulunamadı.');
      }
    } catch {
      setVerificationError('Öğrenci numarası sorgulanırken hata oluştu.');
      setVerifiedMember(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verifiedMember) {
      alert('Lütfen önce öğrenci numaranızı doğrulayınız.');
      return;
    }

    if (usageType === 'trip') {
      if (trips.length === 0 || !selectedTrip || !selectedTrip.is_active) {
        alert('Şu anda aktif veya rezervasyona açık bir kulüp gezisi bulunmamaktadır.');
        return;
      }
      if (tripEligibility && !tripEligibility.isOpen) {
        const tierTitle = memberTier === 'active' ? 'Aktif kulüp üyeleri' : 'Normal üyeler';
        alert(`Bu gezi için rezervasyon dönemi henüz açılmamıştır. ${tierTitle} geziden ${tripEligibility.daysBeforeAllowed} gün önce rezerve edebilir. Açılış: ${formatDateTr(tripEligibility.openDate)}.`);
        return;
      }
    } else {
      if (!hasActivePrivileges) {
        alert('Bireysel çekim ve dönem dersi projeleri için ekipman rezervasyonu yalnızca Aktif Kulüp Üyelerine açıktır. Normal üyelerimiz yalnızca aktif kulüp gezilerinde rezervasyon yapabilir.');
        return;
      }
      if (!purpose.trim()) {
        alert('Lütfen kullanım amacınızı belirtiniz.');
        return;
      }
      const isUnrestricted = memberTier === 'board' || memberTier === 'audit';
      if (!isUnrestricted && pickupDate && returnDate) {
        const diffDays = getDaysDifference(returnDate, pickupDate);
        if (diffDays > 2) {
          alert('Maksimum rezervasyon süresi 2 gündür. Lütfen iade tarihinizi teslim tarihinden en fazla 2 gün sonraya seçiniz.');
          return;
        }
      }
    }

    if (!rulesAccepted) {
      alert('Lütfen kuralları kabul ediniz.');
      return;
    }

    setSubmitting(true);

    try {
      const finalPurpose = usageType === 'trip' && selectedTrip
        ? (tripCustomNotes.trim() ? `${purpose} • Not: ${tripCustomNotes.trim()}` : purpose)
        : purpose;

      const response = await api.createReservation({
        equipment_id: selectedEquipmentId,
        student_number: verifiedMember.student_number,
        pickup_date: pickupDate,
        return_date: returnDate,
        purpose: finalPurpose,
        trip_id: usageType === 'trip' && selectedTrip ? selectedTrip.id : undefined,
        additional_notes: additionalNotes
      });

      if (response.success && response.reservation) {
        setSubmittedReservation(response.reservation);
        api.getDashboardBundle().then(b => {
          setEquipmentList(b.equipmentList);
        });
      } else {
        alert(response.message || 'Rezervasyon oluşturulamadı.');
      }
    } catch {
      alert('Rezervasyon gönderilirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-14 text-[#ded0d9]">
      
      {/* Editorial Header */}
      <AppleReveal className="space-y-4">
        <div className="space-y-3">
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/40">
            YTÜFOK Rezervasyon Sistemi
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-club">
            Ekipman Rezervasyonu
          </h1>
          <p className="text-base sm:text-lg text-white/60 font-light leading-relaxed max-w-2xl">
            Demirbaş gövde ve lens talebinizi oluşturmak için formu eksiksiz doldurunuz. Talepler yönetim kurulu tarafından incelenir.
          </p>
        </div>

        {/* Minimal Specs Strip */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-white/[0.08] text-xs font-mono text-white/50">
          <div>
            <span className="text-white/30 uppercase mr-2 tracking-wider">Teslimat & İade:</span>
            <span className="text-white">Davutpaşa Kulüpler Vadisi</span>
          </div>
          <div>
            <span className="text-white/30 uppercase mr-2 tracking-wider">Bireysel Süre:</span>
            <span className="text-white">Maksimum 2 Gün</span>
          </div>
          <div>
            <span className="text-white/30 uppercase mr-2 tracking-wider">Geziler:</span>
            <span className="text-white">Gezi Tarihine Özel</span>
          </div>
        </div>
      </AppleReveal>

      {submittedReservation ? (
        /* Success Screen */
        <div className="max-w-xl mx-auto rounded-3xl border border-white/10 bg-black/25 p-8 sm:p-10 space-y-6 text-center shadow-xl">
          <div className="w-14 h-14 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white mx-auto">
            <CheckCircle2 className="w-7 h-7 stroke-[2]" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
              Talep İletildi • Yönetim Onayı Bekliyor
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight">
              Rezervasyon Talebiniz Alındı
            </h2>
            <p className="text-xs text-white/50 font-light max-w-sm mx-auto leading-relaxed">
              Talebiniz yönetim kuruluna ulaştı. WhatsApp ve sorgulama ekranı üzerinden takip edebilirsiniz.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-black/35 space-y-2 text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Rezervasyon Takip Kodu</span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold text-white tracking-widest">
                {submittedReservation.reservation_code}
              </span>
              <button
                onClick={() => copyToClipboard(submittedReservation.reservation_code)}
                className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                title="Kopyala"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {submittedReservation.trip && (
              <div className="pt-2 border-t border-white/[0.06] text-xs font-mono text-white/60">
                Kulüp Gezisi: <strong className="text-white">{submittedReservation.trip.title}</strong>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('status', submittedReservation.reservation_code)}
              className="px-6 py-3 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-mono font-semibold transition-all cursor-pointer shadow-md"
            >
              Durumu Takip Et
            </button>
            <button
              onClick={() => {
                setSubmittedReservation(null);
                setPurpose('');
                setTripCustomNotes('');
              }}
              className="px-5 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/30 text-xs font-mono transition-colors cursor-pointer"
            >
              Yeni Talep Oluştur
            </button>
          </div>
        </div>
      ) : (
        /* 2-Column Checkout Layout */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Kimlik Doğrulama */}
            <div className="rounded-3xl border border-white/10 bg-black/25 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block">1. Adım</span>
                <h3 className="text-xl font-bold text-white font-club tracking-tight">
                  Öğrenci Numarası Doğrulama
                </h3>
                <p className="text-xs text-white/50 font-light">
                  Rezervasyon hakkınızı ve gezi önceliğinizi belirlemek için numaranızı sorgulayınız.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Öğrenci Numarası..."
                  value={studentNumber}
                  onChange={(e) => {
                    setStudentNumber(e.target.value);
                    if (verifiedMember) setVerifiedMember(null);
                    if (verificationError) setVerificationError(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/35 border border-white/10 text-white text-xs font-mono placeholder:text-white/35 focus:border-white/40 transition-all"
                />
                <button
                  type="button"
                  onClick={handleVerifyStudent}
                  disabled={verifying}
                  className="px-6 py-3 rounded-xl bg-white text-black hover:bg-white/90 font-semibold text-xs font-mono transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  {verifying ? 'Sorgulanıyor...' : 'Doğrula'}
                </button>
              </div>

              {/* Verified Member Badge */}
              {verifiedMember && (
                <div className="p-4 rounded-xl border border-white/15 bg-black/35 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-sm">
                      {verifiedMember.full_name} ({verifiedMember.student_number})
                    </strong>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-emerald-400/30 text-emerald-400">
                      {memberTier === 'board' ? 'Yönetim Kurulu' : memberTier === 'audit' ? 'Denetim Kurulu' : memberTier === 'active' || memberTier === 'honorary_active' ? 'Aktif Üye' : 'Normal Üye'}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs font-light leading-relaxed">
                    {verifiedMember.department} • {hasActivePrivileges ? 'Gezilerden 5 gün önce erken rezervasyon ve bireysel çekim hakkınız tanımlıdır.' : 'Kulüp gezilerinden 3 gün önce rezervasyon yapabilirsiniz.'}
                  </p>
                </div>
              )}

              {/* Error Notification */}
              {verificationError && !verifiedMember && (
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] text-xs text-rose-300">
                  {verificationError}
                </div>
              )}
            </div>

            {/* 2. Kullanım Amacı & Gezi Seçimi */}
            <div className="rounded-3xl border border-white/10 bg-black/25 p-6 sm:p-8 space-y-5 overflow-hidden shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block">2. Adım</span>
                <h3 className="text-xl font-bold text-white font-club tracking-tight">
                  Kullanım Amacı
                </h3>
              </div>

              {/* Segmented Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={trips.length === 0}
                  onClick={() => {
                    if (trips.length > 0) {
                      setUsageType('trip');
                      if (selectedTrip) applyTripDetails(selectedTrip);
                      else if (trips[0]) applyTripDetails(trips[0]);
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    trips.length === 0
                      ? 'border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed'
                      : usageType === 'trip'
                      ? 'bg-white text-black border-white shadow-md'
                      : 'border-white/10 bg-black/30 hover:bg-black/40 text-white/70 hover:text-white cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs block font-semibold">Kulüp Gezisi</strong>
                    {trips.length === 0 && (
                      <span className="text-[9px] font-mono text-white/40 border border-white/10 px-1.5 py-0.5 rounded">
                        Aktif Gezi Yok
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] block mt-1 ${usageType === 'trip' ? 'text-black/70' : 'text-white/40'}`}>
                    {trips.length === 0
                      ? 'Şu anda yayında veya rezervasyona açık bir gezi bulunmuyor.'
                      : 'Aktif üyeler 5 gün, normal üyeler 3 gün önce talep eder.'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsageType('custom');
                    setPurpose('');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    usageType === 'custom'
                      ? 'bg-white text-black border-white shadow-md'
                      : 'border-white/10 bg-black/30 hover:bg-black/40 text-white/70 hover:text-white'
                  }`}
                >
                  <strong className="text-xs block font-semibold">Bireysel Çekim / Ders</strong>
                  <span className={`text-[11px] block mt-1 ${usageType === 'custom' ? 'text-black/70' : 'text-white/40'}`}>
                    Yalnızca Aktif Üyelere Özel (Maksimum 2 gün).
                  </span>
                </button>
              </div>

              {/* Normal Member Warning When No Active Trips */}
              {verifiedMember && !hasActivePrivileges && trips.length === 0 && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] text-xs text-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold text-sm">Kulüp Gezisi Rezervasyonları Kapalı</strong>
                    <p className="mt-1 text-amber-200/80 leading-relaxed text-xs font-light">
                      Şu anda tanımlı veya yayında aktif bir kulüp gezisi bulunmamaktadır. Kulüp yönergesi gereğince normal üyelerimiz yalnızca resmi kulüp gezileri için rezervasyon yapabilmektedir. Yeni bir gezi açıldığında rezervasyon sistemi otomatik olarak aktifleşecektir.
                    </p>
                  </div>
                </div>
              )}

              {/* If Trip */}
              {usageType === 'trip' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70">Kulüp Gezisi Seçiniz:</label>
                  {trips.length === 0 ? (
                    <div className="p-4 rounded-xl border border-white/10 bg-black/30 text-xs text-white/50 font-mono">
                      Şu anda tanımlı aktif kulüp gezisi bulunmamaktadır.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {trips.map((trip) => {
                        const isSelected = selectedTripId === trip.id;
                        return (
                          <div
                            key={trip.id}
                            onClick={() => handleTripSelect(trip)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-white text-black border-white shadow-md'
                                : 'border-white/10 bg-black/30 hover:bg-black/40 text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <strong className={`text-xs ${isSelected ? 'text-black font-semibold' : 'text-white'}`}>{trip.title}</strong>
                              <span className={`text-xs font-mono ${isSelected ? 'text-black/60' : 'text-white/40'}`}>{formatDateRangeTr(trip.start_date, trip.end_date)}</span>
                            </div>
                            <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-black/70' : 'text-white/50'}`}>{trip.destination}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedTrip && tripEligibility && !tripEligibility.isOpen && (
                    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] text-xs text-amber-200">
                      Bu gezi için rezervasyon dönemi henüz açılmamıştır. Açılış tarihi: <strong>{formatDateTr(tripEligibility.openDate)}</strong>.
                    </div>
                  )}
                </div>
              )}

              {/* If Custom */}
              {usageType === 'custom' && (
                <div className="space-y-3 pt-2">
                  {verifiedMember && !hasActivePrivileges ? (
                    <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] text-xs text-rose-300">
                      Bireysel çekim ve ders projeleri için ekipman rezervasyonu kulüp yönergesi uyarınca yalnızca <strong>Aktif Üyelere</strong> açıktır. Lütfen Kulüp Gezisi seçeneğini tercih ediniz.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                        <div className="w-full min-w-0">
                          <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">Teslim Alma:</label>
                          <input
                            type="date"
                            value={pickupDate}
                            min={todayStr}
                            onChange={(e) => {
                              const newPickup = e.target.value;
                              setPickupDate(newPickup);
                              const isUnrestricted = memberTier === 'board' || memberTier === 'audit';
                              if (!isUnrestricted && newPickup) {
                                const p = parseDate(newPickup);
                                p.setDate(p.getDate() + 2);
                                const maxRet = getLocalDateString(p);
                                if (returnDate > maxRet || returnDate < newPickup) {
                                  setReturnDate(maxRet);
                                }
                              }
                            }}
                            className="block w-full max-w-full min-w-0 box-border px-3.5 py-2.5 rounded-xl bg-black/35 border border-white/10 text-white text-sm sm:text-xs font-mono focus:border-white/30 transition-all"
                            required
                          />
                        </div>
                        <div className="w-full min-w-0">
                          <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">İade Tarihi (Maks 2 Gün):</label>
                          <input
                            type="date"
                            value={returnDate}
                            min={pickupDate}
                            max={
                              memberTier === 'board' || memberTier === 'audit' || !pickupDate
                                ? undefined
                                : (() => {
                                    const p = parseDate(pickupDate);
                                    p.setDate(p.getDate() + 2);
                                    return getLocalDateString(p);
                                  })()
                            }
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="block w-full max-w-full min-w-0 box-border px-3.5 py-2.5 rounded-xl bg-black/35 border border-white/10 text-white text-sm sm:text-xs font-mono focus:border-white/30 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">Kullanım Amacı / Proje:</label>
                        <textarea
                          rows={2}
                          placeholder="Örn: Mimarlık Fakültesi Final Proje Çekimi..."
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-black/35 border border-white/10 text-white text-xs placeholder:text-white/35"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 3. Notlar & Kural Onayı */}
            <div className="rounded-3xl border border-white/10 bg-black/25 p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block">3. Adım</span>
                <h3 className="text-xl font-bold text-white font-club tracking-tight">
                  Notlar & Kural Onayı
                </h3>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">Özel Not / SD Kart Durumu (Opsiyonel):</label>
                <textarea
                  rows={2}
                  placeholder="Ekipman teslim saati veya SD kart durumunuzu yazabilirsiniz..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/35 border border-white/10 text-white text-xs placeholder:text-white/35"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(e) => setRulesAccepted(e.target.checked)}
                    className="mt-0.5 rounded bg-white/10 border-white/20 text-white cursor-pointer"
                  />
                  <span className="text-xs text-white/70 leading-relaxed font-light">
                    Ekipmanı <strong>yalnızca Kulüpler Vadisi, Davutpaşa Kampüsü</strong> noktasından öğrenci kimliğimle teslim alacağımı ve eksiksiz olarak <strong>yalnızca bu noktaya</strong> iade edeceğimi kabul ediyorum.
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Booking Summary Sidebar */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/25 p-6 sm:p-7 space-y-6 shadow-sm">
              <h3 className="text-lg font-bold text-white font-club pb-3 border-b border-white/[0.08] tracking-tight">
                Rezervasyon Özeti
              </h3>

              {/* Selected Equipment */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/40">Seçili Ekipman:</label>
                <select
                  value={selectedEquipmentId}
                  onChange={(e) => setSelectedEquipmentId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/35 border border-white/10 text-white text-xs font-mono cursor-pointer focus:border-white/40 transition-all"
                >
                  {equipmentList.map((item) => (
                    <option key={item.id} value={item.id} disabled={item.status === 'maintenance'}>
                      {item.name} ({item.brand}) - [{item.serial_number}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedEquipment && (
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/10 bg-black/30">
                  <img 
                    src={selectedEquipment.image_url} 
                    alt={selectedEquipment.name} 
                    className="w-16 h-12 object-cover rounded-xl border border-white/[0.08]"
                  />
                  <div className="text-xs space-y-0.5 min-w-0">
                    <strong className="text-white block font-club truncate">{selectedEquipment.name}</strong>
                    <span className="text-white/40 font-mono text-[11px] block">{selectedEquipment.serial_number}</span>
                  </div>
                </div>
              )}

              {/* Booking Dates Breakdown */}
              <div className="space-y-2.5 text-xs border-t border-white/[0.08] pt-4 divide-y divide-white/[0.04]">
                <div className="flex justify-between text-white/50 pt-1">
                  <span>Kullanım Türü:</span>
                  <strong className="text-white font-medium">{usageType === 'trip' ? 'Kulüp Gezisi' : 'Bireysel Çekim'}</strong>
                </div>
                <div className="flex justify-between text-white/50 pt-2">
                  <span>Teslim Alma:</span>
                  <strong className="text-white font-mono">{pickupDate}</strong>
                </div>
                <div className="flex justify-between text-white/50 pt-2">
                  <span>İade Tarihi:</span>
                  <strong className="text-white font-mono">{returnDate}</strong>
                </div>
                <div className="flex justify-between text-white/50 pt-2">
                  <span>Teslimat Yeri:</span>
                  <strong className="text-white font-medium">Davutpaşa Kulüpler Vadisi</strong>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 border-t border-white/[0.08]">
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !verifiedMember ||
                    !rulesAccepted ||
                    (usageType === 'trip' && (trips.length === 0 || !selectedTrip || !selectedTrip.is_active || (tripEligibility ? !tripEligibility.isOpen : false))) ||
                    (usageType === 'custom' && !hasActivePrivileges) ||
                    (!hasActivePrivileges && trips.length === 0)
                  }
                  className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-white/90 font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:bg-white/10 disabled:text-white/20 disabled:cursor-not-allowed shadow-md active:scale-[0.98]"
                >
                  {submitting
                    ? 'Talebiniz Gönderiliyor...'
                    : !hasActivePrivileges && trips.length === 0
                    ? 'Aktif Gezi Yok (Rezervasyon Kapalı)'
                    : usageType === 'trip' && trips.length === 0
                    ? 'Aktif Gezi Bulunmuyor'
                    : 'Rezervasyon Talebini Onayla'}
                </button>
              </div>
            </div>
          </div>

        </form>
      )}

    </div>
  );
};
