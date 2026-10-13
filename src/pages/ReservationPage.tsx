import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, ShieldAlert, CheckCircle2, Copy, Check, FileText, MapPin, Compass, Clock, AlertTriangle, UserPlus, Info, Sparkles, Lock, Award, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [rulesExpanded, setRulesExpanded] = useState(false);

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
        if (bundle.activeTrips.length > 0 && !selectedTripId) {
          setSelectedTripId(bundle.activeTrips[0].id);
          applyTripDetails(bundle.activeTrips[0]);
          setUsageType('trip');
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

    if (usageType === 'custom' && !hasActivePrivileges) {
      alert('Bireysel çekim ve dönem dersi projeleri için ekipman rezervasyonu yalnızca Aktif Kulüp Üyelerine açıktır. Normal üyelerimiz kulüp gezilerinde kamera rezerve edebilir.');
      return;
    }

    if (usageType === 'trip') {
      if (!selectedTrip) {
        alert('Lütfen rezervasyon yapmak istediğiniz kulüp gezisini seçiniz.');
        return;
      }
      if (tripEligibility && !tripEligibility.isOpen) {
        const tierTitle = memberTier === 'active' ? 'Aktif kulüp üyeleri' : 'Normal üyeler';
        alert(`Bu gezi için rezervasyon dönemi henüz açılmamıştır. ${tierTitle} geziden ${tripEligibility.daysBeforeAllowed} gün önce rezerve edebilir. Açılış: ${formatDateTr(tripEligibility.openDate)}.`);
        return;
      }
    } else {
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
        // Refresh equipment bundle in background
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Editorial Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#a9b9d3] text-[11px] font-medium uppercase tracking-[0.14em]">
          <Calendar className="w-3.5 h-3.5 text-[#8193b2]" />
          <span>Talep Modülü</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-club">
          Ekipman Rezervasyon Formu
        </h1>
        <p className="text-[#a9b9d3] text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Demirbaş gövde ve lens talebinizi oluşturmak için lütfen öğrenci numaranızı doğrulayınız.
        </p>
      </div>

      {/* Sleek Accordion Rules Bar */}
      <div className="studio-card rounded-2xl overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => setRulesExpanded(!rulesExpanded)}
          className="w-full p-4 flex items-center justify-between text-left text-xs text-[#dce4ef] hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-[#8193b2] shrink-0" />
            <span className="font-semibold text-white">Kulüp Rezervasyon ve Teslimat Kuralları</span>
            <span className="hidden sm:inline-block text-[11px] text-[#8193b2] font-normal">
              (Tek Nokta: Davutpaşa • Gezi: 5/3 Gün • Bireysel: Maks 2 Gün)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#8193b2] text-[11px]">
            <span>{rulesExpanded ? 'Gizle' : 'Görüntüle'}</span>
            {rulesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {rulesExpanded && (
          <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-[#12080f]/50 space-y-3 text-xs text-[#a9b9d3] animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#8193b2] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Tek Teslim ve İade Noktası</strong>
                <span>Tüm ekipman teslimleri ve iadeleri istisnasız yalnızca Davutpaşa Kampüsü Kulüpler Vadisi'nden yapılır.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-2 border-t border-white/[0.04]">
              <Compass className="w-4 h-4 text-[#8193b2] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Kulüp Gezileri 5/3 Gün Kuralı</strong>
                <span>Aktif üyeler geziden 5 gün önce, normal üyeler ise 3 gün önce rezervasyon yapabilir.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-2 border-t border-white/[0.04]">
              <Sparkles className="w-4 h-4 text-[#8193b2] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Bireysel Çekim & Maksimum Süre</strong>
                <span>Bireysel çekim ve ders projeleri yalnızca Aktif Üyelere açıktır (Maksimum standart rezervasyon süresi 2 gündür).</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {submittedReservation ? (
        /* Apple Wallet Ticket Pass Style Confirmation */
        <div className="studio-card rounded-2xl p-6 sm:p-8 space-y-6 text-center border border-white/[0.12] shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] uppercase font-semibold tracking-wider text-[#8193b2]">
              Talep Alındı • Onay Bekliyor
            </span>
            <h2 className="text-2xl font-bold text-white font-club">
              Rezervasyon Talebiniz Oluşturuldu
            </h2>
            <p className="text-[#a9b9d3] text-xs max-w-sm mx-auto">
              Talebiniz yönetim kuruluna iletildi. İncelendikten sonra onay durumu güncellenecektir.
            </p>
          </div>

          {/* Ticket Body */}
          <div className="max-w-md mx-auto p-5 rounded-xl bg-[#12080f]/80 border border-white/[0.08] space-y-3">
            <span className="text-xs text-[#a9b9d3] block">Rezervasyon Takip Kodunuz:</span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
                {submittedReservation.reservation_code}
              </span>
              <button
                onClick={() => copyToClipboard(submittedReservation.reservation_code)}
                className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white transition-colors cursor-pointer border border-white/[0.08]"
                title="Kodu Kopyala"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {submittedReservation.trip && (
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-xs text-[#dce4ef]">
                <Compass className="w-3.5 h-3.5 text-[#8193b2]" />
                <span>Gezi: <strong>{submittedReservation.trip.title}</strong></span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('status', submittedReservation.reservation_code)}
              className="px-6 py-2.5 rounded-full bg-[#dce4ef] hover:bg-white text-[#12080f] font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <FileText className="w-4 h-4" />
              <span>Durumu Takip Et</span>
            </button>
            <button
              onClick={() => {
                setSubmittedReservation(null);
                setPurpose('');
                setTripCustomNotes('');
              }}
              className="px-6 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#dce4ef] text-xs font-medium border border-white/[0.08] cursor-pointer transition-all"
            >
              Yeni Talep Oluştur
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: KIMLIK & UYE DOGRULAMA */}
          <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06]">
              <span className="w-6 h-6 rounded-full bg-white/[0.1] text-white font-semibold text-xs flex items-center justify-center font-mono">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-white font-club">Öğrenci Numarası Doğrulama</h3>
                <p className="text-[11px] text-[#a9b9d3]">
                  Rezervasyon hakkınızı ve gezi önceliğinizi belirlemek için numaranızı sorgulayınız.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Öğrenci Numaranız (örn: 22052018)..."
                value={studentNumber}
                onChange={(e) => {
                  setStudentNumber(e.target.value);
                  if (verifiedMember) setVerifiedMember(null);
                  if (showQuickRegister) setShowQuickRegister(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-white text-xs font-mono focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleVerifyStudent}
                disabled={verifying}
                className="px-6 py-2.5 rounded-xl bg-white/[0.12] hover:bg-white/[0.2] text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer border border-white/[0.14] transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {verifying ? 'Sorgulanıyor...' : <><UserCheck className="w-4 h-4 text-[#8193b2]" /><span>Doğrula</span></>}
              </button>
            </div>

            {/* Verified Member Apple ID Card */}
            {verifiedMember && (
              <div className="p-4 rounded-xl bg-[#12080f]/90 border border-white/[0.08] text-xs flex items-start gap-3 animate-in fade-in duration-200">
                <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0 mt-0.5 text-[#8193b2]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-white text-sm">
                      {memberTier === 'board' ? verifiedMember.full_name : `${verifiedMember.full_name} (${verifiedMember.student_number})`}
                    </strong>
                    {memberTier === 'board' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.1] text-white border border-white/[0.12]">
                        Yönetim Kurulu Üyesi
                      </span>
                    ) : memberTier === 'audit' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.1] text-white border border-white/[0.12]">
                        Denetim Kurulu Üyesi
                      </span>
                    ) : memberTier === 'honorary_active' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-200 border border-purple-500/25">
                        Fahri Aktif Üye (5 Gün & Bireysel Çekim)
                      </span>
                    ) : memberTier === 'honorary' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-200 border border-purple-500/25">
                        Fahri Üye (Geziden 3 Gün Önce)
                      </span>
                    ) : memberTier === 'active' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#4b253b]/60 text-[#dce4ef] border border-[#657796]/40">
                        ★ Aktif Üye (5 Gün & Bireysel Çekim)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.05] text-[#8193b2] border border-white/[0.08]">
                        Normal Üye (Geziden 3 Gün Önce)
                      </span>
                    )}
                  </div>
                  <p className="text-[#a9b9d3] text-xs leading-relaxed">
                    {verifiedMember.department} • {memberTier === 'board'
                      ? 'Yönetim Kurulu Üyesi kaydınız doğrulandı. Tüm rezervasyon haklarınız sınırsız olarak tanımlanmıştır.'
                      : memberTier === 'audit'
                      ? 'Denetim Kurulu Üyesi kaydınız doğrulandı. Ekipman rezervasyon yetkiniz yönetim ile aynıdır.'
                      : memberTier === 'honorary_active' || memberTier === 'active'
                      ? 'Aktif üyelik statünüz sayesinde kulüp gezileri için 5 gün önceden erken rezerve hakkınız ve bireysel çekim izniniz aktiftir.'
                      : 'Normal üyelik statünüz ile kulüp gezilerinden 3 gün önce rezervasyon yapabilirsiniz (Bireysel çekim alanı tüzük gereği aktif üyelere açıktır).'}
                  </p>
                </div>
              </div>
            )}

            {/* Error & Normal Member Quick Registration */}
            {verificationError && !verifiedMember && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[#dce4ef] block font-medium">{verificationError}</span>
                    <p className="text-[11px] text-[#a9b9d3]">
                      Öğrenci numaranız listede bulunamadıysa, aşağıdaki formdan <strong>Normal Üye</strong> olarak tek tıkla kaydolup gezilerden 3 gün önce kamera rezerve edebilirsiniz.
                    </p>
                  </div>
                </div>

                {showQuickRegister && (
                  <div className="p-4 rounded-xl bg-[#12080f]/80 border border-white/[0.08] space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <UserPlus className="w-4 h-4 text-[#8193b2]" />
                      <span>Normal Üye Hızlı Kayıt Formu</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#a9b9d3] mb-1">Ad Soyad *</label>
                        <input
                          type="text"
                          placeholder="Adınız Soyadınız..."
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#1a0e17] border border-white/[0.08] text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#a9b9d3] mb-1">Bölüm / Üniversite</label>
                        <input
                          type="text"
                          placeholder="Örn: Mimarlık Fakültesi..."
                          value={regDept}
                          onChange={(e) => setRegDept(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#1a0e17] border border-white/[0.08] text-white text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickRegisterNormal}
                      disabled={regLoading}
                      className="px-4 py-2 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors border border-white/[0.1]"
                    >
                      {regLoading ? 'Kaydediliyor...' : 'Normal Üye Olarak Kaydol ve Devam Et'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: EKIPMAN SECIMI */}
          <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06]">
              <span className="w-6 h-6 rounded-full bg-white/[0.1] text-white font-semibold text-xs flex items-center justify-center font-mono">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-white font-club">Ekipman Tercihi</h3>
                <p className="text-[11px] text-[#a9b9d3]">Rezerve etmek istediğiniz kamera veya lensi seçiniz.</p>
              </div>
            </div>

            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-white text-xs focus:outline-none cursor-pointer"
            >
              {equipmentList.map((item) => (
                <option key={item.id} value={item.id} disabled={item.status === 'maintenance'}>
                  {item.name} ({item.brand}) - [{item.serial_number}] - Durum: {item.status === 'available' ? 'Müsait' : item.status === 'reserved' ? 'Rezerve' : item.status === 'in_use' ? 'Kullanımda' : 'Bakımda'}
                </option>
              ))}
            </select>

            {/* Selected Equipment Preview Card */}
            {selectedEquipment && (
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#12080f]/60 border border-white/[0.06]">
                <img 
                  src={selectedEquipment.image_url} 
                  alt={selectedEquipment.name} 
                  className="w-14 h-14 object-cover rounded-lg border border-white/[0.06]"
                />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-club">{selectedEquipment.name}</span>
                    <span className="text-[11px] text-[#8193b2] font-mono">{selectedEquipment.serial_number}</span>
                  </div>
                  <p className="text-[11px] text-[#a9b9d3] line-clamp-1">{selectedEquipment.description}</p>
                </div>
              </div>
            )}

            {selectedEquipment?.category === 'camera' && (
              selectedEquipment.id === 'e-5d2' ? (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-blue-200">
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>CompactFlash (CF) Kart Dahildir</span>
                  </div>
                  <p className="text-[11px] text-[#dce4ef] leading-relaxed">
                    Canon EOS 5D Mark II gövdesi için 32GB CF kart ve USB okuyucu, çanta içerisinde kulüp tarafından hazır olarak teslim edilmektedir (SD kart girişi bulunmaz).
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-[#dce4ef]">
                    <AlertTriangle className="w-4 h-4 text-amber-300/80 shrink-0" />
                    <span>SD Kart Uyarısı: Bu gövdeye SD kart dahil değildir</span>
                  </div>
                  <p className="text-[11px] text-[#a9b9d3] leading-relaxed">
                    Lütfen çekime gelirken kendi SD kartınızı yanınızda getiriniz. Eğer SD kartınız yoksa aşağıdaki rezervasyon notunda belirtebilirsiniz.
                  </p>
                </div>
              )
            )}
          </div>

          {/* STEP 3: KULLANIM ALANI & TARIH ARALIGI */}
          <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06]">
              <span className="w-6 h-6 rounded-full bg-white/[0.1] text-white font-semibold text-xs flex items-center justify-center font-mono">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold text-white font-club">Kullanım Alanı & Tarihler</h3>
                <p className="text-[11px] text-[#a9b9d3]">Kulüp gezisi veya bireysel proje için kullanım amacınızı belirleyiniz.</p>
              </div>
            </div>

            {/* Apple Segmented Selector: Gezi vs Bireysel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUsageType('trip');
                  if (selectedTrip) applyTripDetails(selectedTrip);
                }}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  usageType === 'trip'
                    ? 'bg-white/[0.1] border-white/[0.2] shadow-sm'
                    : 'bg-[#12080f]/60 border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${usageType === 'trip' ? 'bg-white/[0.1] text-white' : 'bg-white/[0.04] text-[#8193b2]'}`}>
                  <Compass className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <strong className={`text-xs font-semibold ${usageType === 'trip' ? 'text-white' : 'text-[#dce4ef]'}`}>
                      Kulüp Gezisi
                    </strong>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.06] text-[#a9b9d3]">
                      Tüm Üyeler
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8193b2] leading-relaxed">
                    Aktif üyeler 5 gün, normal üyeler 3 gün önce rezerve eder.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsageType('custom');
                  setPurpose('');
                }}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  usageType === 'custom'
                    ? 'bg-white/[0.1] border-white/[0.2] shadow-sm'
                    : 'bg-[#12080f]/60 border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${usageType === 'custom' ? 'bg-white/[0.1] text-white' : 'bg-white/[0.04] text-[#8193b2]'}`}>
                  {verifiedMember && !hasActivePrivileges ? (
                    <Lock className="w-4 h-4 text-rose-300" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <strong className={`text-xs font-semibold ${usageType === 'custom' ? 'text-white' : 'text-[#dce4ef]'}`}>
                      Bireysel Çekim / Ders
                    </strong>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.06] text-[#a9b9d3]">
                      ★ Aktif Üyelere Özel
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8193b2] leading-relaxed">
                    Fakülte dersi, portre, serbest proje ve sergi (Maks 2 gün).
                  </p>
                </div>
              </button>
            </div>

            {/* IF TRIP USAGE */}
            {usageType === 'trip' && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-[#a9b9d3]">
                    Tanımlı Kulüp Gezileri ({trips.length}):
                  </label>
                  <span className="text-[11px] text-[#dce4ef] font-mono">
                    Bugün: {formatDateTr(todayStr)}
                  </span>
                </div>

                {loadingTrips ? (
                  <div className="p-4 text-center text-xs text-[#8193b2]">Geziler yükleniyor...</div>
                ) : trips.length === 0 ? (
                  <div className="p-5 rounded-xl bg-[#12080f]/60 border border-white/[0.06] text-center space-y-2">
                    <Compass className="w-6 h-6 text-[#8193b2] mx-auto opacity-70" />
                    <p className="text-xs text-[#a9b9d3]">Şu anda sisteme tanımlı aktif bir gezi bulunmamaktadır.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {trips.map((trip) => {
                      const isSelected = selectedTripId === trip.id;
                      const activeOpenDate = checkTripBookingEligibility(trip.start_date, 'active');
                      const normalOpenDate = checkTripBookingEligibility(trip.start_date, 'normal');

                      return (
                        <div
                          key={trip.id}
                          onClick={() => handleTripSelect(trip)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? 'bg-white/[0.08] border-white/[0.2] shadow-sm'
                              : 'bg-[#12080f]/60 border-white/[0.06] hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <strong className="text-sm font-bold text-white font-club">{trip.title}</strong>
                                <span className="text-[10px] text-[#dce4ef] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                                  {trip.destination}
                                </span>
                              </div>
                              <p className="text-xs text-[#8193b2] mt-0.5">
                                {formatDateRangeTr(trip.start_date, trip.end_date)}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className={`px-2 py-0.5 rounded-full font-medium border ${
                                activeOpenDate.isOpen
                                  ? 'bg-emerald-500/12 text-emerald-200 border-emerald-500/25'
                                  : 'bg-white/[0.04] text-[#8193b2] border-white/[0.06]'
                              }`}>
                                Aktif (5 Gün): {activeOpenDate.isOpen ? '🟢 Açık' : `⏳ ${formatDateTr(activeOpenDate.openDate)}`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full font-medium border ${
                                normalOpenDate.isOpen
                                  ? 'bg-emerald-500/12 text-emerald-200 border-emerald-500/25'
                                  : 'bg-white/[0.04] text-[#8193b2] border-white/[0.06]'
                              }`}>
                                Normal (3 Gün): {normalOpenDate.isOpen ? '🔵 Açık' : `⏳ ${formatDateTr(normalOpenDate.openDate)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Trip Eligibility Verdict */}
                {selectedTrip && (
                  <div className="space-y-3 pt-1">
                    {verifiedMember ? (
                      tripEligibility?.isOpen ? (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#dce4ef] text-xs flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <strong className="font-bold text-white text-xs block">
                              Rezervasyona Açık: {selectedTrip.title}
                            </strong>
                            <p className="leading-relaxed text-[#a9b9d3]">
                              Teslim ({selectedTrip.start_date}) ve iade ({selectedTrip.end_date}) tarihleri gezi takvimine göre ayarlandı.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#dce4ef] text-xs flex items-start gap-3">
                          <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <strong className="font-bold text-amber-200 text-xs block">
                              Rezervasyon Dönemi Henüz Açılmadı
                            </strong>
                            <p className="leading-relaxed text-[#a9b9d3]">
                              Bu gezi için açılış tarihi: <strong>{formatDateTr(tripEligibility?.openDate || '')}</strong> ({tripEligibility?.daysUntilOpen} gün sonra açılacak).
                            </p>
                          </div>
                        </div>
                      )
                    ) : null}

                    <div>
                      <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">
                        Gezi Notu / Açıklama (Opsiyonel):
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: 24-70mm lens ile manzara çekimi yapacağım..."
                        value={tripCustomNotes}
                        onChange={(e) => setTripCustomNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* IF CUSTOM USAGE */}
            {usageType === 'custom' && (
              <div className="space-y-4 pt-1">
                {!verifiedMember ? (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-white font-bold font-club">
                      <Sparkles className="w-4 h-4 text-[#8193b2]" />
                      <span>Bireysel Rezervasyon Yalnızca Aktif Üyelere Açıktır</span>
                    </div>
                    <p className="text-[#a9b9d3] leading-relaxed">
                      Lütfen yukarıdaki 1. Adım'dan öğrenci numaranızı doğrulayınız. Normal üyeler ekipman rezervasyonunu kulüp gezilerinde yapabilir.
                    </p>
                  </div>
                ) : !hasActivePrivileges ? (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
                    <strong className="text-rose-200 text-xs block">
                      Bireysel Ekipman Rezervasyonu Normal Üyelere Kapalıdır
                    </strong>
                    <p className="text-[#dce4ef] leading-relaxed text-[11px]">
                      Sayın {verifiedMember.full_name}, kulüp tüzüğü uyarınca bireysel çekim izni yalnızca Aktif Üyelere açıktır. Kamera rezerve etmek için lütfen <strong>Kulüp Gezisi</strong> seçeneğini tercih ediniz.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setUsageType('trip');
                        if (selectedTrip) applyTripDetails(selectedTrip);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-white/[0.1] text-white text-xs font-semibold"
                    >
                      Kulüp Gezisi Rezervasyonuna Geç
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">Teslim Alma:</label>
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
                          className="w-full px-3 py-2 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-white text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">İade Tarihi (Maks 2 Gün):</label>
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
                          className="w-full px-3 py-2 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-white text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">Kullanım Amacı / Proje:</label>
                      <textarea
                        rows={2}
                        placeholder="Örnek: Mimarlık Fakültesi Final Proje Çekimi..."
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-white text-xs"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Ek Notlar & SD Kart Notu */}
            <div className="space-y-2 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-[#a9b9d3]">
                  Rezervasyon Notu (Opsiyonel):
                </label>
              </div>
              <textarea
                rows={2}
                placeholder="Ekipman teslimi veya saat tercihinizi buraya yazabilirsiniz..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-white text-xs"
              />
              {selectedEquipment?.category === 'camera' && selectedEquipment.id !== 'e-5d2' && (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAdditionalNotes("Kendi SD kartımı getireceğim.")}
                    className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-[#dce4ef] border border-white/[0.08] cursor-pointer"
                  >
                    ✓ Kendi SD kartımı getireceğim
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdditionalNotes("Kendi SD kartım yok, kulüp desteği rica ediyorum.")}
                    className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-[#dce4ef] border border-white/[0.08] cursor-pointer"
                  >
                    ⚠️ SD kartım yok, kulüp desteği rica ediyorum
                  </button>
                </div>
              )}
            </div>

            {/* Kural Onay Checkbox */}
            <div className="pt-2 border-t border-white/[0.06]">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  className="mt-0.5 rounded bg-[#12080f] border-white/[0.1] text-[#657796]"
                />
                <span className="text-[11px] text-[#dce4ef] leading-relaxed">
                  Ekipmanı <strong>yalnızca Kulüpler Vadisi (Davutpaşa Kampüsü)</strong> noktasından öğrenci kimliğimle teslim alacağımı ve iademi de eksiksiz olarak <strong>yalnızca bu noktaya</strong> yapacağımı kabul ediyorum.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <div className="text-center pt-2">
            <button
              type="submit"
              disabled={
                submitting ||
                !verifiedMember ||
                !rulesAccepted ||
                (usageType === 'trip' && tripEligibility ? !tripEligibility.isOpen : false) ||
                (usageType === 'custom' && !hasActivePrivileges)
              }
              className={`w-full sm:w-auto px-10 py-3.5 rounded-full font-semibold text-xs tracking-wide transition-all cursor-pointer ${
                submitting ||
                !verifiedMember ||
                !rulesAccepted ||
                (usageType === 'trip' && tripEligibility ? !tripEligibility.isOpen : false) ||
                (usageType === 'custom' && !hasActivePrivileges)
                  ? 'bg-white/[0.05] text-[#a9b9d3]/40 border border-white/[0.06] cursor-not-allowed'
                  : 'bg-[#dce4ef] hover:bg-white text-[#12080f] shadow-[0_4px_20px_rgba(220,228,239,0.15)] active:scale-[0.98]'
              }`}
            >
              {submitting ? (
                'Talebiniz Kaydediliyor...'
              ) : usageType === 'custom' && verifiedMember && !hasActivePrivileges ? (
                'Bireysel Çekim Yalnızca Aktif Üyelere Açıktır'
              ) : usageType === 'trip' && tripEligibility && !tripEligibility.isOpen ? (
                `Rezervasyon Henüz Açılmadı (${formatDateTr(tripEligibility.openDate)})`
              ) : (
                'Rezervasyon Talebini Gönder (Onay Bekliyor)'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
