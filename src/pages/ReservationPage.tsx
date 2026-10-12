import React, { useState, useEffect } from 'react';
import { Calendar, UserCheck, ShieldAlert, CheckCircle2, Copy, Check, FileText, MapPin, Compass, Clock, AlertTriangle, UserPlus, Info, Sparkles, Lock, Award } from 'lucide-react';
import { Equipment, Member, Reservation, Trip } from '../types';
import { api } from '../lib/api';
import { checkTripBookingEligibility, resolveMemberTier, formatDateTr, formatDateRangeTr, getLocalDateString } from '../utils/tripUtils';

interface ReservationPageProps {
  preselectedEquipmentId?: string;
  onNavigate: (tab: 'home' | 'equipment' | 'reserve' | 'status' | 'admin', extraParam?: string) => void;
}

export const ReservationPage: React.FC<ReservationPageProps> = ({ preselectedEquipmentId, onNavigate }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(preselectedEquipmentId || '');
  
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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [usageType, setUsageType] = useState<'trip' | 'custom'>('trip');
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  // Dates & Purpose
  const todayStr = getLocalDateString();
  const defaultReturnDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(todayStr);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [purpose, setPurpose] = useState('');
  const [tripCustomNotes, setTripCustomNotes] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedReservation, setSubmittedReservation] = useState<Reservation | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch equipment & active trips
  useEffect(() => {
    const fetchEquipment = async () => {
      const list = await api.getEquipment();
      setEquipmentList(list);
      if (!selectedEquipmentId && list.length > 0) {
        setSelectedEquipmentId(preselectedEquipmentId || list[0].id);
      }
    };

    const fetchTrips = async () => {
      try {
        setLoadingTrips(true);
        const activeTrips = await api.getActiveTrips();
        setTrips(activeTrips);
        if (activeTrips.length > 0) {
          setSelectedTripId(activeTrips[0].id);
          applyTripDetails(activeTrips[0]);
          setUsageType('trip');
        } else {
          setUsageType('custom');
        }
      } catch (err) {
        console.error('Geziler yüklenirken hata:', err);
      } finally {
        setLoadingTrips(false);
      }
    };

    fetchEquipment();
    fetchTrips();
  }, [preselectedEquipmentId]);

  // Selected trip helper
  const selectedTrip = trips.find(t => t.id === selectedTripId) || null;
  const selectedEquipment = equipmentList.find(e => e.id === selectedEquipmentId) || null;
  const memberTier = resolveMemberTier(verifiedMember);
  const hasActivePrivileges = memberTier === 'active' || memberTier === 'honorary_active';
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
        // If not in whitelist, allow normal member quick registration
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

  const handleQuickRegisterNormal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      alert('Lütfen ad ve soyadınızı giriniz.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await api.quickRegisterNormalMember(studentNumber, regFullName, regDept);
      if (res.success && res.member) {
        setVerifiedMember(res.member);
        setVerificationError(null);
        setShowQuickRegister(false);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Kayıt oluşturulamadı.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verifiedMember) {
      setVerificationError('Rezervasyon yapabilmek için önce öğrenci numaranızı doğrulamalısınız.');
      return;
    }

    if (!selectedEquipmentId) {
      alert('Lütfen bir ekipman seçiniz.');
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
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else {
        alert(response.message);
      }
    } catch (err) {
      console.error(err);
      alert('Rezervasyon talebi gönderilemedi.');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#301322] border border-[#657796]/40 text-[#dce4ef] text-xs font-semibold uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-[#8193b2]" />
          <span>Talep Modülü</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-club">
          Kamera & Ekipman Rezervasyon Formu
        </h1>
        <p className="text-[#a9b9d3] text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          YTÜ Fotoğraf Kulübü demirbaşlarını rezerve etmek için lütfen öğrenci numaranızı doğrulayınız.
        </p>
      </div>

      {/* Rules Banner (Gezi, Bireysel Çekim ve Teslimat Kuralları) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/40 shadow-xl space-y-3">
        {/* Delivery location */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#301322] border border-[#657796]/30 text-[#8193b2] shrink-0 mt-0.5">
            <MapPin className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Tek Teslim ve İade Noktası: Kulüpler Vadisi, Davutpaşa Kampüsü
            </h3>
            <p className="text-xs text-[#dce4ef] leading-relaxed">
              Tüm ekipman alımları ve iadeleri <strong>istisnasız yalnızca Kulüpler Vadisi (Davutpaşa Kampüsü)</strong> noktasından gerçekleştirilmektedir.
            </p>
          </div>
        </div>

        {/* Trip Reservation Rule (5 days vs 3 days) */}
        <div className="pt-2 border-t border-[#657796]/20 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#301322] border border-[#657796]/30 text-[#8193b2] shrink-0 mt-0.5">
            <Compass className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#dce4ef]">
                Kulüp Gezileri Rezervasyon Takvimi & Öncelik Kuralı
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#301322] text-[#dce4ef] border border-[#657796]/40">
                5 Gün / 3 Gün Kuralı
              </span>
            </div>
            <p className="text-xs text-[#dce4ef] leading-relaxed">
              Kulüp gezilerinde kamera kullanımında: <strong>Aktif Kulüp Üyeleri geziden 5 gün önce</strong>, <strong>Normal Üyeler ise geziden 3 gün önce</strong> rezervasyon yapabilmektedir.
            </p>
          </div>
        </div>

        {/* Individual Reservation Rule (Exclusive to Active Members) */}
        <div className="pt-2 border-t border-[#657796]/20 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#301322] border border-[#657796]/30 text-[#8193b2] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#dce4ef]">
                Bireysel Çekim / Ders / Proje Kullanımı
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4b253b] text-[#dce4ef] border border-[#657796]/40">
                ★ Yalnızca Aktif Üyelere Özel
              </span>
            </div>
            <p className="text-xs text-[#dce4ef] leading-relaxed">
              Bireysel çekim ve dönem dersi projeleri için kamera kullanımı kulüp kuralları uyarınca <strong>yalnızca YTÜFOK Aktif Üyelerine</strong> açıktır. Normal üyelerimiz kulüp gezilerinde kamera rezerve edebilir.
            </p>
          </div>
        </div>
      </div>

      {submittedReservation ? (
        <div className="rounded-3xl bg-[#1c0f18] border border-[#657796]/40 p-8 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#657796] to-[#4e3b52] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#301322]/50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#8193b2]">
              Talep Alındı (Onay Bekliyor)
            </span>
            <h2 className="text-2xl font-bold text-white font-club">
              Rezervasyon Talebiniz Oluşturuldu!
            </h2>
            <p className="text-[#a9b9d3] text-xs max-w-md mx-auto">
              Talebiniz yönetim kuruluna iletildi. İncelendikten sonra onay durumu güncellenecektir.
            </p>
          </div>

          <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#12080f] border border-[#657796]/20 space-y-3">
            <div className="text-xs text-[#a9b9d3]">Rezervasyon Takip Kodunuz:</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#dce4ef] tracking-wider">
                {submittedReservation.reservation_code}
              </span>
              <button
                onClick={() => copyToClipboard(submittedReservation.reservation_code)}
                className="p-2 rounded-lg bg-[#301322] hover:bg-[#421d31] text-white cursor-pointer border border-[#657796]/30"
                title="Kodu Kopyala"
              >
                {copiedCode ? <Check className="w-4 h-4 text-[#8193b2]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {submittedReservation.trip && (
              <div className="pt-2 border-t border-[#657796]/15 flex items-center justify-center gap-1.5 text-xs text-[#dce4ef]">
                <Compass className="w-3.5 h-3.5 text-[#8193b2]" />
                <span>Gezi: <strong>{submittedReservation.trip.title}</strong></span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('status', submittedReservation.reservation_code)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
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
              className="px-6 py-3 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#dce4ef] text-xs font-semibold border border-[#657796]/20 cursor-pointer"
            >
              Yeni Talep Oluştur
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: WHITELIST & ÜYE STATÜSÜ */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#1c0f18] border border-[#657796]/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#657796] text-white font-bold text-xs flex items-center justify-center font-club shadow-sm">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-club">Öğrenci Numarası Doğrulama (Üyelik & Yetki)</h3>
                <p className="text-[11px] text-[#a9b9d3]">
                  Rezervasyon statünüzü, gezi önceliğinizi ve bireysel çekim yetkinizi belirlemek için numaranızı sorgulayınız.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Öğrenci No (örn: 25093029, 21011045, 22052018)..."
                value={studentNumber}
                onChange={(e) => {
                  setStudentNumber(e.target.value);
                  if (verifiedMember) setVerifiedMember(null);
                  if (showQuickRegister) setShowQuickRegister(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs focus:outline-none focus:border-[#657796] font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyStudent}
                disabled={verifying}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {verifying ? 'Sorgulanıyor...' : <><UserCheck className="w-4 h-4" /><span>Doğrula</span></>}
              </button>
            </div>

            {/* Test numbers */}
            <div className="text-[11px] text-[#a9b9d3] flex flex-wrap items-center gap-2">
              <span className="text-[#8193b2]">Hızlı test:</span>
              <button type="button" onClick={() => setStudentNumber('25093029')} className="text-[#8193b2] underline font-mono hover:text-[#dce4ef]">25093029 (Aktif Üye - 5 Gün & Bireysel)</button>
              <span>•</span>
              <button type="button" onClick={() => setStudentNumber('21011045')} className="text-[#8193b2] underline font-mono hover:text-[#dce4ef]">21011045 (Başkan - 5 Gün & Bireysel)</button>
              <span>•</span>
              <button type="button" onClick={() => setStudentNumber('26084006')} className="text-[#8193b2] underline font-mono hover:text-[#dce4ef]">26084006 (Aktif Üye)</button>
            </div>

            {/* Verified Member Badge Card */}
            {verifiedMember && (
              <div className="p-4 rounded-xl bg-[#12080f] border border-[#657796]/40 text-xs flex items-start gap-3">
                <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${memberTier === 'honorary' || memberTier === 'honorary_active' ? 'text-purple-400' : memberTier === 'active' ? 'text-[#8193b2]' : 'text-[#657796]'}`} />
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-white text-sm">{verifiedMember.full_name} ({verifiedMember.student_number})</strong>
                    {memberTier === 'honorary_active' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                        <Award className="w-3 h-3 text-purple-400" />
                        <span>★ Fahri Aktif Üye (Geziden 5 Gün Önce & Bireysel Çekim Hakkı)</span>
                      </span>
                    ) : memberTier === 'honorary' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                        <Award className="w-3 h-3 text-purple-400" />
                        <span>Fahri Üye (Geziden 3 Gün Önce)</span>
                      </span>
                    ) : memberTier === 'active' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4b253b] text-[#dce4ef] border border-[#657796]/40 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#8193b2]" />
                        <span>★ Aktif Üye (Geziden 5 Gün Önce & Bireysel Çekim Hakkı)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#301322] text-[#8193b2] border border-[#657796]/30 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-[#8193b2]" />
                        <span>Normal Üye (Geziden 3 Gün Önce)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[#a9b9d3] text-xs leading-relaxed">
                    {verifiedMember.department} • {memberTier === 'honorary_active'
                      ? 'Fahri aktif kulüp üyesi statünüz sayesinde geziler için 5 gün önceden erken kamera rezervasyon hakkınız ve bireysel çekim yetkiniz aktiftir.'
                      : memberTier === 'honorary'
                      ? 'Fahri üye statünüz (normal üye ile aynı öncelikte) ile kulüp gezilerinden 3 gün önce rezervasyon yapabilirsiniz. (Bireysel çekim alanı tüzük gereği yalnızca aktif üyelere açıktır).'
                      : memberTier === 'active' 
                      ? 'Aktif kulüp üyesi statünüz sayesinde geziler için 5 gün önceden erken kamera rezervasyon hakkınız ve bireysel çekim yetkiniz aktiftir.' 
                      : 'Normal üye statünüz ile kulüp gezilerinden 3 gün önce rezervasyon yapabilirsiniz. (Bireysel çekim alanı tüzük gereği yalnızca aktif üyelere açıktır).'}
                  </p>
                </div>
              </div>
            )}

            {/* Error & Quick Registration for Normal Member */}
            {verificationError && !verifiedMember && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#301322] border border-rose-500/40 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[#dce4ef] block">{verificationError}</span>
                    <p className="text-[11px] text-[#a9b9d3]">
                      Öğrenci numaranız aktif üye listesinde bulunamadıysa, aşağıdaki formdan <strong>Normal Üye</strong> olarak kaydolup kulüp gezilerinden 3 gün önce kamera rezerve edebilirsiniz.
                    </p>
                  </div>
                </div>

                {showQuickRegister && (
                  <div className="p-4 rounded-2xl bg-[#12080f] border border-[#657796]/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <UserPlus className="w-4 h-4 text-[#8193b2]" />
                      <span>Normal Üye Olarak Hızlı Kayıt (Geziden 3 Gün Önce Rezervasyon)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#a9b9d3] mb-1">Ad Soyad *</label>
                        <input
                          type="text"
                          placeholder="Adınız Soyadınız..."
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#1c0f18] border border-[#657796]/30 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#a9b9d3] mb-1">Bölüm / Üniversite</label>
                        <input
                          type="text"
                          placeholder="Örn: Mimarlık, Fotoğraf..."
                          value={regDept}
                          onChange={(e) => setRegDept(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#1c0f18] border border-[#657796]/30 text-white text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickRegisterNormal}
                      disabled={regLoading}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {regLoading ? 'Kaydediliyor...' : 'Normal Üye Olarak Kaydol ve Devam Et'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: EQUIPMENT */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#1c0f18] border border-[#657796]/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#657796] text-white font-bold text-xs flex items-center justify-center font-club shadow-sm">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-club">Ekipman Tercihi</h3>
                <p className="text-[11px] text-[#a9b9d3]">Rezerve etmek istediğiniz kamera veya lensi seçiniz.</p>
              </div>
            </div>

            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs focus:outline-none focus:border-[#657796]"
            >
              {equipmentList.map((item) => (
                <option key={item.id} value={item.id} disabled={item.status === 'maintenance'}>
                  {item.name} ({item.brand}) - [{item.serial_number}] - Durum: {item.status === 'available' ? 'Müsait' : item.status === 'reserved' ? 'Rezerve' : item.status === 'in_use' ? 'Kullanımda' : 'Bakımda'}
                </option>
              ))}
            </select>

            {selectedEquipment?.category === 'camera' && (
              selectedEquipment.id === 'e-5d2' ? (
                <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-blue-300">
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>CompactFlash (CF) Kart Dahildir</span>
                  </div>
                  <p className="text-[11px] text-[#dce4ef] leading-relaxed">
                    Canon EOS 5D Mark II gövdesi için 32GB CF kart ve USB okuyucu, çanta içerisinde kulüp tarafından hazır olarak teslim edilmektedir (SD kart girişi bulunmaz).
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#4b253b]/40 via-[#301322] to-[#1c0f18] border border-[#657796]/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#dce4ef]">
                    <AlertTriangle className="w-4 h-4 text-[#8193b2] shrink-0" />
                    <span>Önemli SD Kart Uyarısı: Bu gövdeye SD kart dahil değildir!</span>
                  </div>
                  <p className="text-[11px] text-[#dce4ef] leading-relaxed">
                    Kulübümüzde SD kart temini bulunmamaktadır. Lütfen çekime gelirken <strong className="text-white">kendi SD kartınızı yanınızda getiriniz</strong>. Eğer kendi SD kartınız yoksa aşağıdaki <strong className="text-white">"Rezervasyon Notu"</strong> alanında mutlaka belirtiniz.
                  </p>
                </div>
              )
            )}
          </div>

          {/* STEP 3: KULLANIM ALANI & GEZİ SEÇİMİ */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#1c0f18] border border-[#657796]/20 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#657796] text-white font-bold text-xs flex items-center justify-center font-club shadow-sm">
                3
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-club">Kullanım Alanı & Tarih Aralığı</h3>
                <p className="text-[11px] text-[#a9b9d3]">Kulüp gezisi veya bireysel proje için kullanım amacınızı belirleyiniz.</p>
              </div>
            </div>

            {/* Segmented selector: Kulüp Gezisi vs Bireysel Proje */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#a9b9d3]">Kullanım Türü / Alanı:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUsageType('trip');
                    if (selectedTrip) applyTripDetails(selectedTrip);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    usageType === 'trip'
                      ? 'bg-gradient-to-br from-[#4b253b]/80 via-[#301322] to-[#1c0f18] border-[#657796] shadow-lg shadow-[#301322]/50 ring-1 ring-[#657796]/50'
                      : 'bg-[#12080f] border-[#657796]/30 hover:border-[#657796]/60 text-[#a9b9d3]'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${usageType === 'trip' ? 'bg-[#301322] text-[#dce4ef] border border-[#657796]/40' : 'bg-[#1c0f18] text-[#8193b2]'}`}>
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <strong className={`text-xs font-bold ${usageType === 'trip' ? 'text-white' : 'text-[#dce4ef]'}`}>
                        Kulüp Gezisi İle Kullanım
                      </strong>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#301322] text-[#dce4ef] border border-[#657796]/30 uppercase">
                        Tüm Üyeler
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8193b2] leading-relaxed">
                      Kulüp gezisi seçin (Aktif üyeler 5 gün, Normal üyeler 3 gün önce rezerve eder).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsageType('custom');
                    setPurpose('');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    usageType === 'custom'
                      ? 'bg-gradient-to-br from-[#421d31] via-[#301322] to-[#1c0f18] border-[#8193b2] shadow-lg shadow-[#301322]/50 ring-1 ring-[#8193b2]/50'
                      : 'bg-[#12080f] border-[#657796]/30 hover:border-[#657796]/60 text-[#a9b9d3]'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${usageType === 'custom' ? 'bg-[#301322] text-[#dce4ef] border border-[#657796]/40' : 'bg-[#1c0f18] text-[#8193b2]'}`}>
                    {verifiedMember && !hasActivePrivileges ? (
                      <Lock className="w-4 h-4 text-rose-300" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <strong className={`text-xs font-bold ${usageType === 'custom' ? 'text-white' : 'text-[#dce4ef]'}`}>
                        Bireysel Çekim / Ders / Proje
                      </strong>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#4b253b] text-[#dce4ef] border border-[#657796]/40 uppercase flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-[#8193b2]" />
                        <span>★ Aktif Üyelere Özel</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8193b2] leading-relaxed">
                      {verifiedMember && !hasActivePrivileges
                        ? '🔒 Normal ve Fahri üyelere kapalıdır. Yalnızca YTÜFOK Aktif ve Fahri Aktif Üyeleri bireysel ekipman alabilir.'
                        : 'Fakülte dersi, portre, serbest proje ve sergi hazırlığı (Maks 4 gün).'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* IF TRIP USAGE: SELECT ACTIVE TRIP */}
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
                  <div className="p-5 rounded-2xl bg-[#12080f] border border-[#657796]/20 text-center space-y-2">
                    <Compass className="w-6 h-6 text-[#8193b2] mx-auto" />
                    <p className="text-xs text-[#a9b9d3]">Şu anda sisteme tanımlı aktif bir gezi bulunmamaktadır.</p>
                    <p className="text-[11px] text-[#8193b2]">Kulüp yönetiminin yeni gezi duyurmasını bekleyebilir veya aktif üyeyseniz bireysel çekim yapabilirsiniz.</p>
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
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#4b253b]/80 via-[#301322] to-[#1c0f18] border-[#657796] shadow-md shadow-[#301322]/50 ring-1 ring-[#657796]/50'
                              : 'bg-[#12080f] border-[#657796]/20 hover:border-[#657796]/50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <strong className="text-sm font-bold text-white font-club">{trip.title}</strong>
                                <span className="text-[10px] text-[#dce4ef] px-2 py-0.5 rounded-full bg-[#301322] border border-[#657796]/40 font-medium">
                                  {trip.destination}
                                </span>
                              </div>
                              <p className="text-xs text-[#8193b2]">
                                {formatDateRangeTr(trip.start_date, trip.end_date)}
                              </p>
                            </div>

                            {/* Live Eligibility Status Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              {/* Aktif Üye Açılışı */}
                              <span className={`px-2 py-0.5 rounded-full font-medium border ${
                                activeOpenDate.isOpen
                                  ? 'bg-[#4b253b] text-[#dce4ef] border-[#657796]/40'
                                  : 'bg-[#1c0f18] text-[#8193b2] border-[#657796]/20'
                              }`} title={`Aktif üyeler için: ${formatDateTr(activeOpenDate.openDate)}`}>
                                Aktif Üye (5 Gün): {activeOpenDate.isOpen ? '🟢 Açık' : `⏳ ${formatDateTr(activeOpenDate.openDate)}`}
                              </span>

                              {/* Normal Üye Açılışı */}
                              <span className={`px-2 py-0.5 rounded-full font-medium border ${
                                normalOpenDate.isOpen
                                  ? 'bg-[#301322] text-[#dce4ef] border-[#657796]/30'
                                  : 'bg-[#1c0f18] text-[#8193b2] border-[#657796]/20'
                              }`} title={`Normal üyeler için: ${formatDateTr(normalOpenDate.openDate)}`}>
                                Normal Üye (3 Gün): {normalOpenDate.isOpen ? '🔵 Açık' : `⏳ ${formatDateTr(normalOpenDate.openDate)}`}
                              </span>
                            </div>
                          </div>

                          {trip.description && (
                            <p className="text-xs text-[#a9b9d3] leading-relaxed line-clamp-2">
                              {trip.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Trip Eligibility Verdict Banner */}
                {selectedTrip && (
                  <div className="space-y-3 pt-2">
                    {verifiedMember ? (
                      tripEligibility?.isOpen ? (
                        <div className="p-4 rounded-2xl bg-[#1c0f18] border border-emerald-500/50 text-[#dce4ef] text-xs flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <strong className="font-bold text-white text-sm block">
                              Rezervasyona Açık! ({selectedTrip.title})
                            </strong>
                            <p className="leading-relaxed">
                              {memberTier === 'active' ? (
                                <>★ <strong>Aktif Kulüp Üyesi</strong> statünüz ile geziden <strong>5 gün önce</strong> erken rezervasyon hakkınız aktiftir.</>
                              ) : (
                                <><strong>Normal Üye</strong> kuralına göre geziden <strong>3 gün önce</strong> rezervasyon hakkınız açılmıştır.</>
                              )} Teslim ({selectedTrip.start_date}) ve iade ({selectedTrip.end_date}) tarihleri gezi takvimine göre ayarlandı.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-[#301322] border border-rose-500/50 text-[#dce4ef] text-xs flex items-start gap-3">
                          <Clock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <strong className="font-bold text-rose-300 text-sm block">
                              Rezervasyon Dönemi Henüz Açılmadı!
                            </strong>
                            <p className="leading-relaxed">
                              <strong>{selectedTrip.title}</strong> gezisi için {memberTier === 'active' ? 'aktif üyeler' : 'normal üyeler'} geziden en erken <strong>{tripEligibility?.daysBeforeAllowed} gün önce</strong> rezervasyon yapabilir.
                            </p>
                            <div className="pt-1 text-xs font-mono text-white">
                              📅 Rezervasyon Açılış Tarihi: <strong>{formatDateTr(tripEligibility?.openDate || '')}</strong> ({tripEligibility?.daysUntilOpen} gün sonra açılacak).
                            </div>
                            {memberTier === 'normal' && (
                              <p className="text-[11px] text-[#8193b2] pt-1">
                                💡 Bilgi: YTÜFOK Aktif kulüp üyeleri gezilerden 5 gün önce erken rezervasyon yapabilmektedir.
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="p-3.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-xs text-[#a9b9d3] flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#8193b2] shrink-0" />
                        <span>
                          Rezerve edebilmek için lütfen yukarıdan <strong>Öğrenci Numaranızı doğrulayınız</strong>. Aktif üyeler 5 gün, normal üyeler 3 gün önce rezervasyon yapabilir.
                        </span>
                      </div>
                    )}

                    {/* Gezi Ek Notu */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">
                        Geziye Dair Not / Açıklama (Opsiyonel):
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: 24-70mm lens ile portre ve manzara çekimi yapacağım..."
                        value={tripCustomNotes}
                        onChange={(e) => setTripCustomNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* IF CUSTOM PURPOSE: RESTRICTED TO ACTIVE MEMBERS */}
            {usageType === 'custom' && (
              <div className="space-y-4 pt-1">
                {!verifiedMember ? (
                  <div className="p-4 rounded-2xl bg-[#301322] border border-[#657796]/40 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold font-club">
                      <Sparkles className="w-4 h-4 text-[#8193b2]" />
                      <span>Bireysel Rezervasyon Yalnızca Aktif Üyelere Açıktır</span>
                    </div>
                    <p className="text-[#dce4ef] leading-relaxed">
                      Ders, proje veya kişisel çekim amacıyla kamera rezervasyonu yapabilmek için lütfen yukarıdaki <strong>1. Adım</strong>'dan YTÜFOK Aktif Üye numaranızı doğrulayınız.
                    </p>
                    <p className="text-[11px] text-[#8193b2]">
                      Normal kulüp üyelerimiz ekipman rezervasyonunu yalnızca Kulüp Gezileri için (geziden 3 gün önce) yapabilmektedir.
                    </p>
                  </div>
                ) : !hasActivePrivileges ? (
                  <div className="p-5 rounded-2xl bg-[#301322] border border-rose-500/40 text-xs space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-[#1c0f18] border border-[#657796]/30 text-rose-300 shrink-0 mt-0.5">
                        <Lock className="w-5 h-5 text-rose-300" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <strong className="text-white text-sm font-bold font-club block">
                          Bireysel Ekipman Rezervasyonu Normal Öncelikli Üyelere Kapalıdır
                        </strong>
                        <p className="text-[#dce4ef] leading-relaxed">
                          Sayın <strong>{verifiedMember.full_name}</strong>, sistemde <strong>{memberTier === 'honorary' ? 'Fahri Üye' : 'Normal Üye'}</strong> statüsündesiniz. Kulüp yönergemiz gereğince:
                        </p>
                        <div className="p-3 rounded-xl bg-[#12080f] border border-[#657796]/30 space-y-1.5 my-2">
                          <div className="flex items-center gap-2 text-[#dce4ef] font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            <span>Bireysel Çekim / Ders / Proje: <strong>Yalnızca Aktif Üyelere Özel</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-[#8193b2] text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#657796]"></span>
                            <span>Kulüp Gezileri: <strong>Normal Üyeler (Geziden 3 Gün Önce) Rezervasyon Yapabilir</strong></span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#a9b9d3]">
                          Kamera rezerve etmek için lütfen yukarıdan <strong>"Kulüp Gezisi İle Kullanım"</strong> seçeneğini tercih ediniz.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUsageType('trip');
                          if (selectedTrip) applyTripDetails(selectedTrip);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Compass className="w-4 h-4" />
                        <span>Kulüp Gezisi Rezervasyonuna Geç</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-[#301322] border border-[#657796]/40 text-xs flex items-center gap-2 text-[#dce4ef]">
                      <Sparkles className="w-4 h-4 text-[#8193b2] shrink-0" />
                      <span>
                        ✓ <strong>Aktif Üye Onaylandı:</strong> Bireysel çekim ve dönem projesi için ekipman rezervasyon yetkiniz mevcuttur.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">Teslim Alma:</label>
                        <input
                          type="date"
                          value={pickupDate}
                          min={todayStr}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">İade Tarihi (Maks 4 Gün):</label>
                        <input
                          type="date"
                          value={returnDate}
                          min={pickupDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs"
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
                        className="w-full px-3 py-2 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Özel Rezervasyon Notu & SD Kart Durumu */}
            <div className="space-y-2 pt-3 border-t border-[#657796]/15">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-[#a9b9d3]">
                  Rezervasyon Notu / SD Kart Durumu (Opsiyonel):
                </label>
                {selectedEquipment?.category === 'camera' && selectedEquipment.id !== 'e-5d2' && (
                  <span className="text-[10px] text-[#8193b2] font-medium">
                    ⚠️ SD kartınız yoksa mutlaka belirtiniz
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                placeholder={
                  selectedEquipment?.category === 'camera' && selectedEquipment.id !== 'e-5d2'
                    ? "Örn: Yanımda kendi SD kartımı getireceğim / Kendi SD kartım bulunmamaktadır, kulüp desteği rica ediyorum..."
                    : "Ekipman teslimi, saat tercihi veya diğer özel taleplerinizi buraya yazabilirsiniz..."
                }
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white text-xs focus:outline-none focus:border-[#657796] transition-colors"
              />
              {selectedEquipment?.category === 'camera' && selectedEquipment.id !== 'e-5d2' && (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAdditionalNotes("Kendi SD kartımı getireceğim.")}
                    className="px-2.5 py-1 rounded-lg bg-[#301322] hover:bg-[#421d31] text-[11px] text-[#dce4ef] border border-[#657796]/30 transition-all cursor-pointer"
                  >
                    ✓ Kendi SD kartımı getireceğim
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdditionalNotes("Kendi SD kartım yok, kulüp desteği rica ediyorum.")}
                    className="px-2.5 py-1 rounded-lg bg-[#4b253b]/50 hover:bg-[#4b253b]/80 text-[11px] text-[#dce4ef] border border-[#657796]/40 transition-all cursor-pointer"
                  >
                    ⚠️ SD kartım yok, kulüp desteği rica ediyorum
                  </button>
                </div>
              )}
            </div>

            {/* Acceptance checkbox */}
            <div className="pt-2 border-t border-[#657796]/15">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  className="mt-0.5 rounded bg-[#12080f] border-[#657796]/30 text-[#657796]"
                />
                <span className="text-[11px] text-[#dce4ef] leading-relaxed">
                  Ekipmanı <strong>yalnızca Kulüpler Vadisi, Davutpaşa Kampüsü</strong> noktasından öğrenci kimliğimle teslim alacağımı, iademi de eksiksiz ve hasarsız olarak <strong>yalnızca bu noktaya</strong> yapacağımı (başka teslim/iade noktası olmadığını) ve aktif kulüp üyelerinin 1. derece öncelikli olduğunu kabul ediyorum.
                </span>
              </label>
            </div>
          </div>

          {/* Submit button */}
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
              className={`w-full sm:w-auto px-10 py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-xl transition-all cursor-pointer ${
                submitting ||
                !verifiedMember ||
                !rulesAccepted ||
                (usageType === 'trip' && tripEligibility ? !tripEligibility.isOpen : false) ||
                (usageType === 'custom' && !hasActivePrivileges)
                  ? 'bg-[#301322] text-[#a9b9d3] cursor-not-allowed border border-[#657796]/20 opacity-50'
                  : 'bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white shadow-lg shadow-[#301322]/50'
              }`}
            >
              {submitting ? (
                'Talebiniz Kaydediliyor...'
              ) : usageType === 'custom' && verifiedMember && !hasActivePrivileges ? (
                'Bireysel Çekim Yalnızca Aktif ve Fahri Aktif Üyelere Açıktır (Kulüp Gezisi Seçiniz)'
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
