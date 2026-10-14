import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, ShieldAlert, CheckCircle2, Copy, Check, FileText, MapPin, Compass, Clock, AlertTriangle, AlertCircle, UserPlus, Info, Sparkles, Lock, ChevronRight } from 'lucide-react';
import { Equipment, Member, Reservation, Trip } from '../types';
import { api } from '../lib/api';
import { checkTripBookingEligibility, resolveMemberTier, formatDateTr, formatDateRangeTr, getLocalDateString, parseDate, getDaysDifference } from '../utils/tripUtils';

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

  // Quick register for normal members
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regDept, setRegDept] = useState('Yıldız Teknik Üniversitesi');
  const [regLoading, setRegLoading] = useState(false);

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
    setShowQuickRegister(false);

    try {
      const result = await api.verifyStudentNumber(studentNumber);
      if (result.success && result.member) {
        setVerifiedMember(result.member);
        setVerificationError(null);
      } else {
        setVerifiedMember(null);
        setVerificationError(result.message);
        if (!result.member) {
          setShowQuickRegister(true);
        }
      }
    } catch {
      setVerificationError('Öğrenci numarası sorgulanırken hata oluştu.');
      setVerifiedMember(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleQuickRegisterNormal = async () => {
    if (!studentNumber.trim()) {
      alert('Lütfen öğrenci numaranızı giriniz.');
      return;
    }
    if (!regFullName.trim()) {
      alert('Lütfen ad ve soyadınızı giriniz.');
      return;
    }

    setRegLoading(true);
    try {
      const result = await api.quickRegisterNormalMember(
        studentNumber.trim(),
        regFullName.trim(),
        regDept.trim() || 'Yıldız Teknik Üniversitesi'
      );

      if (result.success && result.member) {
        setVerifiedMember(result.member);
        setVerificationError(null);
        setShowQuickRegister(false);
      } else {
        alert(result.message || 'Kayıt yapılırken bir hata oluştu.');
      }
    } catch (e) {
      alert('Kayıt oluşturulurken bağlantı hatası oluştu.');
    } finally {
      setRegLoading(false);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Editorial Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-white font-club tracking-tight">
          Ekipman Rezervasyonu
        </h1>
        <p className="text-sm text-[#a9b9d3] mt-1">
          Demirbaş gövde ve lens talebinizi oluşturmak için formu eksiksiz doldurunuz.
        </p>
      </div>

      {submittedReservation ? (
        /* Airbnb Checkout Confirmation Style */
        <div className="max-w-xl mx-auto surface-card p-8 space-y-6 text-center border border-white/[0.12]">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase font-semibold text-[#8193b2] tracking-wider">
              Talep Alındı • Yönetim Onayı Bekliyor
            </span>
            <h2 className="text-2xl font-bold text-white font-club">
              Rezervasyon Talebiniz İletildi
            </h2>
            <p className="text-xs text-[#a9b9d3] max-w-sm mx-auto">
              Talebiniz yönetim kuruluna ulaştı. İncelendikten sonra onay durumu güncellenecektir.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#140a12] border border-white/[0.08] space-y-2 text-left">
            <span className="text-[11px] text-[#a9b9d3] block">Takip Kodu:</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-bold text-white tracking-wider">
                {submittedReservation.reservation_code}
              </span>
              <button
                onClick={() => copyToClipboard(submittedReservation.reservation_code)}
                className="px-3 py-1.5 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>
            </div>
            {submittedReservation.trip && (
              <div className="pt-2 border-t border-white/[0.06] text-xs text-[#dce4ef]">
                Kulüp Gezisi: <strong>{submittedReservation.trip.title}</strong>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('status', submittedReservation.reservation_code)}
              className="px-5 py-2.5 rounded-lg bg-white text-[#12080f] font-semibold text-xs hover:bg-[#dce4ef] transition-all cursor-pointer"
            >
              Durumu Takip Et
            </button>
            <button
              onClick={() => {
                setSubmittedReservation(null);
                setPurpose('');
                setTripCustomNotes('');
              }}
              className="px-5 py-2.5 rounded-lg text-white/70 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Yeni Talep Oluştur
            </button>
          </div>
        </div>
      ) : (
        /* Airbnb 2-Column Checkout Layout */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Kimlik Doğrulama */}
            <div className="surface-card p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#8193b2] uppercase tracking-wider block">Adım 1</span>
                <h3 className="text-base font-semibold text-white font-club">
                  Öğrenci Numarası Doğrulama
                </h3>
                <p className="text-xs text-[#a9b9d3]">
                  Rezervasyon hakkınızı ve gezi önceliğinizi belirlemek için numaranızı sorgulayınız.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Öğrenci Numarası..."
                  value={studentNumber}
                  onChange={(e) => {
                    setStudentNumber(e.target.value);
                    if (verifiedMember) setVerifiedMember(null);
                    if (showQuickRegister) setShowQuickRegister(false);
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#140a12] border border-white/[0.08] text-white text-xs font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifyStudent}
                  disabled={verifying}
                  className="px-5 py-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white font-medium text-xs border border-white/[0.1] transition-all cursor-pointer disabled:opacity-50"
                >
                  {verifying ? 'Sorgulanıyor...' : 'Doğrula'}
                </button>
              </div>

              {/* Verified Member Badge */}
              {verifiedMember && (
                <div className="p-4 rounded-lg bg-[#140a12] border border-white/[0.08] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-sm">
                      {verifiedMember.full_name} ({verifiedMember.student_number})
                    </strong>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white/[0.06] text-white border border-white/[0.08]">
                      {memberTier === 'board' ? 'Yönetim Kurulu' : memberTier === 'audit' ? 'Denetim Kurulu' : memberTier === 'active' || memberTier === 'honorary_active' ? 'Aktif Üye' : 'Normal Üye'}
                    </span>
                  </div>
                  <p className="text-[#a9b9d3] text-xs leading-relaxed">
                    {verifiedMember.department} • {hasActivePrivileges ? 'Gezilerden 5 gün önce erken rezervasyon ve bireysel çekim yetkiniz aktiftir.' : 'Kulüp gezilerinden 3 gün önce rezervasyon yapabilirsiniz.'}
                  </p>
                </div>
              )}

              {/* Error & Quick Registration */}
              {verificationError && !verifiedMember && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                    {verificationError}
                  </div>

                  {showQuickRegister && (
                    <div className="p-4 rounded-lg bg-[#140a12] border border-white/[0.08] space-y-3">
                      <strong className="text-xs text-white block">Normal Üye Olarak Kayıt Ol</strong>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Ad Soyad..."
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#1a0e17] border border-white/[0.08] text-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Bölüm..."
                          value={regDept}
                          onChange={(e) => setRegDept(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#1a0e17] border border-white/[0.08] text-white text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleQuickRegisterNormal}
                        disabled={regLoading}
                        className="px-4 py-2 rounded-lg bg-white text-[#12080f] text-xs font-semibold cursor-pointer"
                      >
                        {regLoading ? 'Kaydediliyor...' : 'Kaydol ve Devam Et'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Kullanım Amacı & Gezi Seçimi */}
            <div className="surface-card p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#8193b2] uppercase tracking-wider block">Adım 2</span>
                <h3 className="text-base font-semibold text-white font-club">
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
                  className={`p-4 rounded-lg border text-left transition-all ${
                    trips.length === 0
                      ? 'border-white/[0.04] bg-white/[0.02] opacity-40 cursor-not-allowed'
                      : usageType === 'trip'
                      ? 'border-white bg-white/[0.08] cursor-pointer'
                      : 'border-white/[0.08] bg-[#140a12] hover:bg-white/[0.04] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-white block">Kulüp Gezisi</strong>
                    {trips.length === 0 && (
                      <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Aktif Gezi Yok
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#a9b9d3] block mt-0.5">
                    {trips.length === 0
                      ? 'Şu anda yayında veya rezervasyona açık bir gezi bulunmuyor.'
                      : 'Aktif üyeler 5 gün, normal üyeler 3 gün önce rezerve eder.'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsageType('custom');
                    setPurpose('');
                  }}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
                    usageType === 'custom'
                      ? 'border-white bg-white/[0.08]'
                      : 'border-white/[0.08] bg-[#140a12] hover:bg-white/[0.04]'
                  }`}
                >
                  <strong className="text-xs text-white block">Bireysel Çekim / Ders</strong>
                  <span className="text-[11px] text-[#a9b9d3] block mt-0.5">
                    Yalnızca Aktif Üyelere Özel (Maksimum 2 gün).
                  </span>
                </button>
              </div>

              {/* Normal Member Warning When No Active Trips */}
              {verifiedMember && !hasActivePrivileges && trips.length === 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold text-sm">Kulüp Gezisi Rezervasyonları Kapalı</strong>
                    <p className="mt-1 text-amber-200/80 leading-relaxed text-xs">
                      Şu anda tanımlı veya yayında aktif bir kulüp gezisi bulunmamaktadır. Kulüp yönergesi gereğince normal üyelerimiz yalnızca resmi kulüp gezileri için rezervasyon yapabilmektedir. Yeni bir gezi açıldığında rezervasyon sistemi otomatik olarak aktifleşecektir.
                    </p>
                  </div>
                </div>
              )}

              {/* If Trip */}
              {usageType === 'trip' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-medium text-white">Kulüp Gezisi Seçiniz:</label>
                  {trips.length === 0 ? (
                    <div className="p-4 rounded-lg bg-[#140a12] border border-white/[0.08] text-xs text-[#a9b9d3]">
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
                            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-white bg-white/[0.08]'
                                : 'border-white/[0.08] bg-[#140a12] hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <strong className="text-xs text-white">{trip.title}</strong>
                              <span className="text-xs text-[#8193b2]">{formatDateRangeTr(trip.start_date, trip.end_date)}</span>
                            </div>
                            <span className="text-[11px] text-[#a9b9d3] block mt-0.5">{trip.destination}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedTrip && tripEligibility && !tripEligibility.isOpen && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                      Bu gezi için rezervasyon dönemi henüz açılmamıştır. Açılış tarihi: <strong>{formatDateTr(tripEligibility.openDate)}</strong>.
                    </div>
                  )}
                </div>
              )}

              {/* If Custom */}
              {usageType === 'custom' && (
                <div className="space-y-3 pt-2">
                  {verifiedMember && !hasActivePrivileges ? (
                    <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                      Bireysel çekim ve ders projeleri için ekipman rezervasyonu kulüp yönergesi uyarınca yalnızca <strong>Aktif Üyelere</strong> açıktır. Lütfen Kulüp Gezisi seçeneğini tercih ediniz.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-white mb-1">Teslim Alma:</label>
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
                            className="w-full px-3 py-2 rounded-lg bg-[#140a12] border border-white/[0.08] text-white text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white mb-1">İade Tarihi (Maks 2 Gün):</label>
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
                            className="w-full px-3 py-2 rounded-lg bg-[#140a12] border border-white/[0.08] text-white text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white mb-1">Kullanım Amacı / Proje:</label>
                        <textarea
                          rows={2}
                          placeholder="Örn: Mimarlık Fakültesi Final Proje Çekimi..."
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#140a12] border border-white/[0.08] text-white text-xs"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 3. Notlar & Kural Onayı */}
            <div className="surface-card p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#8193b2] uppercase tracking-wider block">Adım 3</span>
                <h3 className="text-base font-semibold text-white font-club">
                  Notlar & Kural Onayı
                </h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1">Özel Not / SD Kart Durumu (Opsiyonel):</label>
                <textarea
                  rows={2}
                  placeholder="Ekipman teslim saati veya SD kart durumunuzu yazabilirsiniz..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#140a12] border border-white/[0.08] text-white text-xs"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesAccepted}
                    onChange={(e) => setRulesAccepted(e.target.checked)}
                    className="mt-0.5 rounded bg-[#140a12] border-white/20 text-white"
                  />
                  <span className="text-xs text-[#a9b9d3] leading-relaxed">
                    Ekipmanı <strong>yalnızca Kulüpler Vadisi, Davutpaşa Kampüsü</strong> noktasından öğrenci kimliğimle teslim alacağımı ve eksiksiz olarak <strong>yalnızca bu noktaya</strong> iade edeceğimi kabul ediyorum.
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Airbnb Booking Summary Sidebar */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <div className="surface-card p-6 space-y-6 border border-white/[0.12]">
              <h3 className="text-base font-semibold text-white font-club pb-3 border-b border-white/[0.08]">
                Rezervasyon Özeti
              </h3>

              {/* Selected Equipment */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#8193b2]">Seçili Ekipman:</label>
                <select
                  value={selectedEquipmentId}
                  onChange={(e) => setSelectedEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#140a12] border border-white/[0.08] text-white text-xs cursor-pointer focus:outline-none"
                >
                  {equipmentList.map((item) => (
                    <option key={item.id} value={item.id} disabled={item.status === 'maintenance'}>
                      {item.name} ({item.brand}) - [{item.serial_number}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedEquipment && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#140a12] border border-white/[0.06]">
                  <img 
                    src={selectedEquipment.image_url} 
                    alt={selectedEquipment.name} 
                    className="w-16 h-12 object-cover rounded border border-white/[0.06]"
                  />
                  <div className="text-xs space-y-0.5">
                    <strong className="text-white block font-club">{selectedEquipment.name}</strong>
                    <span className="text-[#8193b2] font-mono text-[11px] block">{selectedEquipment.serial_number}</span>
                  </div>
                </div>
              )}

              {/* Booking Dates Breakdown */}
              <div className="space-y-2 text-xs border-t border-white/[0.06] pt-4">
                <div className="flex justify-between text-[#a9b9d3]">
                  <span>Kullanım Türü:</span>
                  <strong className="text-white">{usageType === 'trip' ? 'Kulüp Gezisi' : 'Bireysel Çekim'}</strong>
                </div>
                <div className="flex justify-between text-[#a9b9d3]">
                  <span>Teslim Alma:</span>
                  <strong className="text-white font-mono">{pickupDate}</strong>
                </div>
                <div className="flex justify-between text-[#a9b9d3]">
                  <span>İade Tarihi:</span>
                  <strong className="text-white font-mono">{returnDate}</strong>
                </div>
                <div className="flex justify-between text-[#a9b9d3]">
                  <span>Teslimat Yeri:</span>
                  <strong className="text-white">Davutpaşa Kulüpler Vadisi</strong>
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
                  className="w-full py-3 rounded-lg bg-white hover:bg-[#dce4ef] text-[#12080f] font-semibold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
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
