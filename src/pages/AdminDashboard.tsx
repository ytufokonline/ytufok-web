import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, AlertTriangle, UserCheck, 
  Camera, Plus, UserPlus, RefreshCw, Package,
  History, X, Check, Download, Search, Filter,
  User, FileText, CheckCircle2, ChevronRight,
  ArrowRightLeft, LogOut, Award, Sparkles, Droplets,
  Trash2, Calendar, CalendarPlus, Info, Compass, MapPin,
  KeyRound, Bell, Pencil
} from 'lucide-react';
import { Reservation, Equipment, EquipmentCategory, EquipmentStatus, Member, MemberType, AdminProfile, DarkroomReservation, DarkroomSlot, DarkroomSlotProcessPermission, Trip, Announcement } from '../types';
import { api } from '../lib/api';
import { 
  getSupabaseConfigStatus, 
  getStoredSupabaseUrl, 
  getStoredSupabaseAnonKey, 
  setSupabaseCredentials, 
  testSupabaseConnection 
} from '../lib/supabase';
import { StatusBadge } from '../components/StatusBadge';
import { AdminLogin } from '../components/AdminLogin';
import { SwitchProfileModal } from '../components/SwitchProfileModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { checkTripBookingEligibility, formatDateTr, formatDateRangeTr, getReservationOpenDate, getLocalDateString } from '../utils/tripUtils';

const cleanAdminName = (name?: string | null) => name ? name.replace(/\s*\([Rr]ed\)/gi, '').trim() : '';

export const AdminDashboard: React.FC = () => {
  const initialSync = React.useMemo(() => api.getInitialSyncState(), []);
  const [activeTab, setActiveTab] = useState<'reservations' | 'tracking' | 'equipment' | 'members' | 'history' | 'darkroom' | 'supabase' | 'trips' | 'announcements'>('reservations');
  const [loading, setLoading] = useState(false);

  // Board Member Accounts & Active Profile
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>(initialSync.adminProfiles);
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile | null>(initialSync.activeAdmin);
  const [showSwitchProfileModal, setShowSwitchProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Synchronize active admin with global auth state changes
  useEffect(() => {
    const unsub = api.onAuthChange((admin) => {
      setActiveAdmin(admin);
    });
    return unsub;
  }, []);

  // Darkroom State (Reservations + Admin-Managed Slots)
  const [darkroomReservations, setDarkroomReservations] = useState<DarkroomReservation[]>(initialSync.darkroomReservations);
  const [darkroomSlots, setDarkroomSlots] = useState<DarkroomSlot[]>(initialSync.darkroomSlots);
  const [darkroomSubTab, setDarkroomSubTab] = useState<'reservations' | 'slots'>('reservations');
  const [darkroomFilter, setDarkroomFilter] = useState<string>('all');
  const [darkroomSearchQuery, setDarkroomSearchQuery] = useState('');

  // Add Darkroom Slot Modal State
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [newSlotProcess, setNewSlotProcess] = useState<DarkroomSlotProcessPermission>('all');
  const [newSlotStartTime, setNewSlotStartTime] = useState('10:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState('11:30');
  const [newSlotSupervisor, setNewSlotSupervisor] = useState('');
  const [newSlotNotes, setNewSlotNotes] = useState('');

  // Data states
  const [reservations, setReservations] = useState<Reservation[]>(initialSync.reservations);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(initialSync.equipmentList);
  const [members, setMembers] = useState<Member[]>(initialSync.members);

  // Selected Equipment / Member for History Modal
  const [selectedEquipmentForHistory, setSelectedEquipmentForHistory] = useState<Equipment | null>(null);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);

  // Search & Filters for Reservations
  const [reservationFilter, setReservationFilter] = useState<string>('all');
  const [searchReservationQuery, setSearchReservationQuery] = useState('');

  // Search & Filters for Members Whitelist
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Search & Filters for Master History Log
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyMemberFilter, setHistoryMemberFilter] = useState<string>('all');
  const [historyEquipmentFilter, setHistoryEquipmentFilter] = useState<string>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyAdminFilter, setHistoryAdminFilter] = useState<string>('all');

  // Modals
  const [rejectModalData, setRejectModalData] = useState<{ id: string; code: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [returnModalData, setReturnModalData] = useState<{ id: string; equipmentName: string } | null>(null);
  const [returnConditionNote, setReturnConditionNote] = useState('Eksiksiz ve hasarsız teslim alındı.');

  // Form modals
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipBrand, setNewEquipBrand] = useState('Canon');
  const [newEquipModel, setNewEquipModel] = useState('');
  const [newEquipSerial, setNewEquipSerial] = useState('');
  const [newEquipCategory, setNewEquipCategory] = useState<EquipmentCategory>('camera');

  // Edit Equipment State
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editEquipName, setEditEquipName] = useState('');
  const [editEquipBrand, setEditEquipBrand] = useState('Canon');
  const [editEquipModel, setEditEquipModel] = useState('');
  const [editEquipSerial, setEditEquipSerial] = useState('');
  const [editEquipCategory, setEditEquipCategory] = useState<EquipmentCategory>('camera');
  const [editEquipDescription, setEditEquipDescription] = useState('');
  const [editEquipCondition, setEditEquipCondition] = useState('');
  const [editEquipStatus, setEditEquipStatus] = useState<EquipmentStatus>('available');
  const [editEquipImageUrl, setEditEquipImageUrl] = useState('');
  const [editEquipPackageContents, setEditEquipPackageContents] = useState('');
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);

  // Supabase Configuration & Sync State
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getStoredSupabaseUrl());
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getStoredSupabaseAnonKey());
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseFeedback, setSupabaseFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberNo, setNewMemberNo] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('Yıldız Teknik Üniversitesi');
  const [newMemberType, setNewMemberType] = useState<'active' | 'normal' | 'honorary' | 'honorary_active'>('active');
  const [memberTypeFilter, setMemberTypeFilter] = useState<'all' | 'active' | 'normal' | 'honorary'>('all');

  // Edit Member State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editMemberNo, setEditMemberNo] = useState('');
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberDept, setEditMemberDept] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberType, setEditMemberType] = useState<MemberType>('active');
  const [editMemberStatus, setEditMemberStatus] = useState<'active' | 'suspended' | 'passive'>('active');
  const [editMemberPenalty, setEditMemberPenalty] = useState(0);
  const [editMemberPenaltyReason, setEditMemberPenaltyReason] = useState('');
  const [editMemberNotes, setEditMemberNotes] = useState('');

  // Trips State
  const [trips, setTrips] = useState<Trip[]>(initialSync.trips);
  const [tripSearchQuery, setTripSearchQuery] = useState('');
  const [tripFilter, setTripFilter] = useState<'all' | 'active' | 'passive'>('all');
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripDestination, setNewTripDestination] = useState('');
  const [newTripStartDate, setNewTripStartDate] = useState(() => new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
  const [newTripEndDate, setNewTripEndDate] = useState(() => new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10));
  const [newTripDescription, setNewTripDescription] = useState('');
  const [newTripIsActive, setNewTripIsActive] = useState(true);

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialSync.announcements);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState('Ekipman & Kural');
  const [newAnnIsPinned, setNewAnnIsPinned] = useState(true);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = newAnnContent.trim();
    if (!cleanContent) return;

    try {
      await api.createAnnouncement({
        title: cleanContent,
        content: cleanContent,
        category: newAnnCategory,
        is_pinned: newAnnIsPinned
      });

      setNewAnnContent('');
      setShowAddAnnouncementModal(false);
      await loadAllData();
    } catch (err: any) {
      console.error('Duyuru eklenirken hata:', err);
      alert(err?.message || 'Duyuru eklenirken bir hata meydana geldi.');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Bu duyuru/not silinsin mi?')) return;
    try {
      await api.deleteAnnouncement(id);
      await loadAllData();
    } catch (err: any) {
      console.error('Duyuru silinirken hata:', err);
      alert(err?.message || 'Duyuru silinirken bir hata meydana geldi.');
    }
  };

  const handleTogglePinAnnouncement = async (ann: Announcement) => {
    try {
      await api.updateAnnouncement(ann.id, { is_pinned: !ann.is_pinned });
      await loadAllData();
    } catch (err: any) {
      console.error('Duyuru güncellenirken hata:', err);
      alert(err?.message || 'Duyuru güncellenirken bir hata meydana geldi.');
    }
  };

  const loadAllData = async (_silent?: boolean | React.MouseEvent) => {
    // Güvenlik: Giriş yapılmamışsa (login ekranındayken) ASLA pano verisi veya üye listesi çekme
    if (!activeAdmin) return;

    try {
      const bundle = await api.getDashboardBundle(true);
      setReservations(bundle.reservations);
      setEquipmentList(bundle.equipmentList);
      setAdminProfiles(bundle.adminProfiles);
      setDarkroomReservations(bundle.darkroomReservations);
      setDarkroomSlots(bundle.darkroomSlots);
      setTrips(bundle.trips);
      setAnnouncements(bundle.announcements);
    } catch (e) {
      console.error('Veri yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Güvenlik: Yalnızca yetkili yönetici oturumu varsa verileri yükle ve periyodik dinle
    if (!activeAdmin) return;

    loadAllData(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && activeAdmin) {
        loadAllData(true);
      }
    }, 12000);
    const handleFocus = () => {
      if (activeAdmin) loadAllData(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeAdmin]);

  // Üye listesi yalnızca oturum açmış yönetici "Üyeler" sekmesine girdiğinde yüklenir
  useEffect(() => {
    if (activeAdmin && activeTab === 'members' && members.length === 0) {
      api.getMembers().then((res) => {
        setMembers(res);
      });
    }
  }, [activeAdmin, activeTab, members.length]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  const getAdminStamp = () => {
    if (!activeAdmin) return 'YTÜFOK Yönetim Kurulu';
    return `${activeAdmin.full_name} (${activeAdmin.short_title})`;
  };

  const handleLogout = async () => {
    if (window.confirm(`${activeAdmin?.full_name || 'Yönetici'} oturumu kapatılsın mı? Giriş ekranına döneceksiniz.`)) {
      await api.signOut();
      setActiveAdmin(null);
    }
  };

  // Darkroom Actions
  const handleApproveDarkroom = async (id: string) => {
    if (!window.confirm('Karanlık oda rezervasyonu onaylansın mı?')) return;
    try {
      await api.updateDarkroomReservationStatus(id, 'approved', { approved_by: getAdminStamp() });
      await loadAllData();
    } catch (err: any) {
      console.error('Karanlık oda onay hatası:', err);
      alert(err?.message || 'İşlem sırasında bir hata meydana geldi.');
    }
  };

  const handleCompleteDarkroom = async (id: string) => {
    if (!window.confirm('Karanlık oda seansı tamamlandı olarak işaretlensin mi? (Temizlik ve kimyasal kontrolü yapıldı)')) return;
    try {
      await api.updateDarkroomReservationStatus(id, 'completed', { supervisor: getAdminStamp() });
      await loadAllData();
    } catch (err: any) {
      console.error('Karanlık oda tamamlama hatası:', err);
      alert(err?.message || 'İşlem sırasında bir hata meydana geldi.');
    }
  };

  const handleRejectDarkroom = async (id: string) => {
    const reason = window.prompt('Red gerekçesini giriniz:', 'Kulüp etkinliği nedeniyle seans müsait değildir.');
    if (reason === null) return;
    try {
      await api.updateDarkroomReservationStatus(id, 'rejected', {
        approved_by: getAdminStamp(),
        rejection_reason: reason.trim() || 'Kulüp etkinliği nedeniyle seans müsait değildir.'
      });
      await loadAllData();
    } catch (err: any) {
      console.error('Karanlık oda red hatası:', err);
      alert(err?.message || 'İşlem sırasında bir hata meydana geldi.');
    }
  };

  // Darkroom Slot Management Actions
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotStartTime || !newSlotEndTime) {
      alert('Lütfen tarih ve seans saatlerini eksiksiz giriniz.');
      return;
    }

    const supervisorName = newSlotSupervisor.trim() || (activeAdmin ? `${activeAdmin.full_name} (${activeAdmin.short_title})` : 'YTÜFOK Yönetim Kurulu');

    try {
      await api.createDarkroomSlot({
        date: newSlotDate,
        startTime: newSlotStartTime,
        endTime: newSlotEndTime,
        durationMinutes: 90,
        label: `${newSlotStartTime} - ${newSlotEndTime}`,
        allowed_process: newSlotProcess,
        supervisor: supervisorName,
        notes: newSlotNotes.trim() || undefined,
        is_active: true
      });

      setShowAddSlotModal(false);
      setNewSlotNotes('');
      await loadAllData();
    } catch (err: any) {
      console.error('Seans oluşturma hatası:', err);
      alert(err?.message || 'Seans oluşturulurken bir hata meydana geldi.');
    }
  };

  const handleCreateBulkStandardSlots = async (targetDate: string, proc: DarkroomSlotProcessPermission) => {
    const templates = api.getStandardDarkroomTemplates();
    const supervisorName = activeAdmin ? `${activeAdmin.full_name} (${activeAdmin.short_title})` : 'YTÜFOK Yönetim Kurulu';
    const slotsToCreate = templates.map(t => ({
      date: targetDate,
      startTime: t.startTime,
      endTime: t.endTime,
      durationMinutes: t.durationMinutes,
      label: t.label,
      allowed_process: proc,
      supervisor: supervisorName,
      is_active: true
    }));

    try {
      await api.createBulkDarkroomSlots(slotsToCreate);
      await loadAllData();
      alert(`${targetDate} tarihi için 6 adet standart seans başarıyla açıldı.`);
    } catch (err: any) {
      console.error('Toplu seans açma hatası:', err);
      alert(err?.message || 'Toplu seans açılırken bir hata meydana geldi.');
    }
  };

  const handleDeleteSlot = async (slot: DarkroomSlot) => {
    const bookedRes = darkroomReservations.find(r => r.slot_id === slot.id && r.status !== 'cancelled' && r.status !== 'rejected');
    const confirmMsg = bookedRes
      ? `DİKKAT: Bu seansta aktif rezervasyon bulunmaktadır (${bookedRes.member?.full_name || bookedRes.student_number} - ${bookedRes.reservation_code}). Yine de seansı kapatıp silmek istiyor musunuz?`
      : `${slot.date} tarihindeki ${slot.startTime} - ${slot.endTime} seansı kapatılsın mı?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.deleteDarkroomSlot(slot.id);
      await loadAllData();
    } catch (err: any) {
      console.error('Seans silme hatası:', err);
      alert(err?.message || 'Seans silinirken bir hata meydana geldi.');
    }
  };

  const handleApprove = async (reservationId: string) => {
    if (!window.confirm('Rezervasyon onaylansın mı?')) return;
    try {
      await api.updateReservationStatus(reservationId, 'approved', { approved_by: getAdminStamp() });
      await loadAllData();
    } catch (err: any) {
      console.error('Rezervasyon onay hatası:', err);
      alert(err?.message || 'Rezervasyon onaylanırken bir hata meydana geldi.');
    }
  };

  const handleDeliver = async (reservationId: string) => {
    if (!window.confirm('Ekipman teslim edildi mi?')) return;
    try {
      await api.updateReservationStatus(reservationId, 'in_use', { checked_out_by: getAdminStamp() });
      await loadAllData();
    } catch (err: any) {
      console.error('Ekipman teslim hatası:', err);
      alert(err?.message || 'Ekipman teslim edilirken bir hata meydana geldi.');
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnModalData) return;
    try {
      await api.updateReservationStatus(returnModalData.id, 'returned', {
        return_condition_notes: returnConditionNote,
        returned_to: getAdminStamp()
      });
      setReturnModalData(null);
      await loadAllData();
    } catch (err: any) {
      console.error('İade onay hatası:', err);
      alert(err?.message || 'İade onaylanırken bir hata meydana geldi.');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalData) return;
    try {
      await api.updateReservationStatus(rejectModalData.id, 'rejected', {
        rejection_reason: rejectionReason.trim() || 'Kulüp etkinliği nedeniyle reddedildi.',
        approved_by: getAdminStamp()
      });
      setRejectModalData(null);
      setRejectionReason('');
      await loadAllData();
    } catch (err: any) {
      console.error('Rezervasyon red hatası:', err);
      alert(err?.message || 'Rezervasyon reddedilirken bir hata meydana geldi.');
    }
  };

  const handleClearReservationHistory = async () => {
    if (reservations.length === 0) {
      alert('Temizlenecek herhangi bir zimmet kaydı bulunmuyor.');
      return;
    }
    const confirmed = window.confirm(
      `Tüm zimmet ve rezervasyon geçmişi (${reservations.length} kayıt) kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`
    );
    if (!confirmed) return;

    try {
      await api.clearReservations();
      await loadAllData();
    } catch (err: any) {
      console.error('Geçmiş temizleme hatası:', err);
      alert(err?.message || 'Geçmiş temizlenirken bir hata meydana geldi.');
    }
  };

  const handleDeleteReservation = async (res: Reservation) => {
    const confirmed = window.confirm(
      `"${res.reservation_code}" kodlu zimmet kaydını silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;

    try {
      await api.deleteReservation(res.id);
      await loadAllData();
    } catch (err: any) {
      console.error('Rezervasyon silme hatası:', err);
      alert(err?.message || 'Rezervasyon silinirken bir hata meydana geldi.');
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipName || !newEquipSerial) return;

    try {
      await api.addEquipment({
        name: newEquipName,
        brand: newEquipBrand,
        model: newEquipModel || newEquipName,
        serial_number: newEquipSerial,
        category: newEquipCategory,
        description: 'Kulüp demirbaşı.',
        specs: { 'Tip': newEquipCategory },
        package_contents: ['Gövde', '1x Batarya', 'Askı'],
        image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
        status: 'available',
        current_condition: 'değerlendirilecek'
      });

      setShowAddEquipmentModal(false);
      setNewEquipName('');
      setNewEquipSerial('');
      await loadAllData();
    } catch (err: any) {
      console.error('Ekipman ekleme hatası:', err);
      alert(err?.message || 'Ekipman eklenirken bir hata meydana geldi.');
    }
  };

  const handleOpenEditEquipment = (item: Equipment) => {
    setEditingEquipment(item);
    setEditEquipName(item.name || '');
    setEditEquipBrand(item.brand || 'Canon');
    setEditEquipModel(item.model || '');
    setEditEquipSerial(item.serial_number || '');
    setEditEquipCategory(item.category || 'camera');
    setEditEquipDescription(item.description || '');
    setEditEquipCondition(item.current_condition || '');
    setEditEquipStatus(item.status || 'available');
    setEditEquipImageUrl(item.image_url || '');
    setEditEquipPackageContents(
      Array.isArray(item.package_contents) ? item.package_contents.join('\n') : ''
    );
  };

  const handleSaveEditEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment || !editEquipName.trim() || !editEquipSerial.trim()) return;

    setIsSavingEquipment(true);
    try {
      const parsedContents = editEquipPackageContents
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(Boolean);

      await api.updateEquipment(editingEquipment.id, {
        name: editEquipName.trim(),
        brand: editEquipBrand.trim(),
        model: editEquipModel.trim() || editEquipName.trim(),
        serial_number: editEquipSerial.trim(),
        category: editEquipCategory,
        description: editEquipDescription.trim(),
        current_condition: editEquipCondition.trim(),
        status: editEquipStatus,
        image_url: editEquipImageUrl.trim(),
        package_contents: parsedContents.length > 0 ? parsedContents : editingEquipment.package_contents
      });

      setEditingEquipment(null);
      await loadAllData();
    } catch (err) {
      console.error('Ekipman güncellenirken hata:', err);
      alert('Ekipman güncellenirken bir hata meydana geldi.');
    } finally {
      setIsSavingEquipment(false);
    }
  };

  const handleSaveAndTestSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSupabase(true);
    setSupabaseFeedback(null);
    try {
      setSupabaseCredentials(supabaseUrlInput.trim(), supabaseKeyInput.trim());
      const res = await testSupabaseConnection();
      if (res.ok) {
        setSupabaseFeedback({ type: 'success', message: res.message });
        await loadAllData();
      } else {
        setSupabaseFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setSupabaseFeedback({
        type: 'error',
        message: err?.message || 'Supabase bağlantısı sırasında bir hata oluştu.'
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSyncEquipmentToSupabase = async () => {
    if (!window.confirm('Tüm güncel ekipman listesi Supabase veritabanına aktarılsın ve eşitlensin mi?')) return;
    setIsSyncingSupabase(true);
    setSupabaseFeedback(null);
    try {
      const res = await api.syncAllEquipmentToSupabase();
      if (res.success) {
        setSupabaseFeedback({
          type: 'success',
          message: `Başarılı! Toplam ${res.count} adet ekipman Supabase veritabanına aktarıldı ve eşitlendi.`
        });
        await loadAllData();
      } else {
        setSupabaseFeedback({
          type: 'error',
          message: `Eşitleme hatası: ${res.error || 'Bilinmeyen hata'}`
        });
      }
    } catch (err: any) {
      setSupabaseFeedback({
        type: 'error',
        message: err?.message || 'Eşitleme işlemi başarısız oldu.'
      });
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleDeleteEquipment = async (item: Equipment) => {
    const activeRes = reservations.filter(
      r => r.equipment_id === item.id && (r.status === 'in_use' || r.status === 'approved')
    );
    if (activeRes.length > 0) {
      alert(`Bu ekipman şu anda zimmette veya onaylı rezervasyonda (${activeRes.length} aktif talep). Silinemez!`);
      return;
    }

    const confirmed = window.confirm(
      `"${item.name}" (${item.serial_number}) demirbaşını envanterden tamamen silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;

    try {
      await api.deleteEquipment(item.id);
      await loadAllData();
    } catch (err: any) {
      console.error('Ekipman silme hatası:', err);
      alert(err?.message || 'Ekipman silinirken bir hata meydana geldi.');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberNo || !newMemberName) return;

    try {
      await api.addMember({
        student_number: newMemberNo.trim(),
        full_name: newMemberName.trim(),
        email: `${newMemberNo}@std.yildiz.edu.tr`,
        phone: '+90 5XX XXX XX XX',
        department: newMemberDept,
        status: 'active',
        member_type: newMemberType,
        notes: newMemberType === 'honorary_active'
          ? 'YTÜFOK Fahri Aktif Üyesi (Aktif Öncelik: Gezilerden 5 gün önce & Bireysel Çekim)'
          : newMemberType === 'honorary'
          ? 'YTÜFOK Fahri Üyesi (Normal Öncelik: Gezilerden 3 gün önce)'
          : newMemberType === 'active' 
          ? 'YTÜFOK Aktif Üyesi (Aktif Öncelik: Gezilerden 5 gün önce)' 
          : 'Normal Kulüp Üyesi (Normal Öncelik: Gezilerden 3 gün önce)',
        penalty_count: 0,
        role: 'member'
      });

      setShowAddMemberModal(false);
      setNewMemberNo('');
      setNewMemberName('');
      setNewMemberDept('Yıldız Teknik Üniversitesi');
      setNewMemberType('active');
      await loadAllData();
    } catch (err: any) {
      console.error('Üye ekleme hatası:', err);
      alert(err?.message || 'Üye eklenirken bir hata meydana geldi.');
    }
  };

  const handleToggleMemberType = async (member: Member) => {
    let nextType: 'active' | 'normal' | 'honorary' | 'honorary_active' = 'active';
    if (member.member_type === 'normal') nextType = 'active';
    else if (member.member_type === 'active') nextType = 'normal';
    else if (member.member_type === 'honorary') nextType = 'honorary_active';
    else if (member.member_type === 'honorary_active') nextType = 'honorary';
    else nextType = 'active';
    try {
      await api.updateMemberType(member.id, nextType);
      await loadAllData();
    } catch (err: any) {
      console.error('Üye tipi güncelleme hatası:', err);
      alert(err?.message || 'Üye tipi güncellenirken bir hata meydana geldi.');
    }
  };

  const handleToggleMemberStatus = async (member: Member) => {
    const nextStatus = member.status === 'active' ? 'suspended' : 'active';
    const reason = nextStatus === 'suspended' ? 'Yönetim tarafından askıya alındı.' : '';
    try {
      await api.updateMemberPenalty(member.id, nextStatus === 'suspended' ? 1 : 0, reason);
      await loadAllData();
    } catch (err: any) {
      console.error('Üye durumu güncelleme hatası:', err);
      alert(err?.message || 'Üye durumu güncellenirken bir hata meydana geldi.');
    }
  };

  const handleOpenEditMember = (member: Member) => {
    setEditingMember(member);
    setEditMemberNo(member.student_number || '');
    setEditMemberName(member.full_name || '');
    setEditMemberDept(member.department || 'Yıldız Teknik Üniversitesi');
    setEditMemberPhone(member.phone || '');
    setEditMemberEmail(member.email || '');
    setEditMemberType(member.member_type || 'active');
    setEditMemberStatus(member.status || 'active');
    setEditMemberPenalty(member.penalty_count || 0);
    setEditMemberPenaltyReason(member.penalty_reason || '');
    setEditMemberNotes(member.notes || '');
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editMemberNo || !editMemberName) return;

    try {
      await api.updateMember(editingMember.id, {
        student_number: editMemberNo.trim(),
        full_name: editMemberName.trim(),
        department: editMemberDept.trim(),
        phone: editMemberPhone.trim(),
        email: editMemberEmail.trim(),
        member_type: editMemberType,
        status: editMemberStatus,
        penalty_count: Number(editMemberPenalty) || 0,
        penalty_reason: editMemberPenaltyReason.trim(),
        notes: editMemberNotes.trim()
      });

      setEditingMember(null);
      await loadAllData();
    } catch (err: any) {
      console.error('Üye düzenleme hatası:', err);
      alert(err?.message || 'Üye düzenlenirken bir hata meydana geldi.');
    }
  };

  const handleDeleteMember = async (member: Member) => {
    const isBoard = isBoardMemberObj(member);
    if (isBoard) {
      alert('Yönetim kurulu profilleri bu listeden silinemez. Yönetici Masası sekmesinden yönetilmelidir.');
      return;
    }

    const confirmed = window.confirm(
      `"${member.full_name}" (${member.student_number}) isimli üyeyi whitelist ve üye listesinden tamamen silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;

    try {
      await api.deleteMember(member.id, member.student_number);
      await loadAllData();
    } catch (err: any) {
      console.error('Üye silme hatası:', err);
      alert(err?.message || 'Üye silinirken bir hata meydana geldi.');
    }
  };

  // Trip Management Handlers
  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle.trim() || !newTripDestination.trim() || !newTripStartDate || !newTripEndDate) {
      alert('Lütfen gezi başlığı, konum ve başlangıç/bitiş tarihlerini giriniz.');
      return;
    }

    if (newTripStartDate > newTripEndDate) {
      alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
      return;
    }

    try {
      if (editingTrip) {
        await api.updateTrip(editingTrip.id, {
          title: newTripTitle.trim(),
          destination: newTripDestination.trim(),
          start_date: newTripStartDate,
          end_date: newTripEndDate,
          description: newTripDescription.trim(),
          is_active: newTripIsActive
        });
      } else {
        await api.createTrip({
          title: newTripTitle.trim(),
          destination: newTripDestination.trim(),
          start_date: newTripStartDate,
          end_date: newTripEndDate,
          description: newTripDescription.trim(),
          is_active: newTripIsActive,
          created_by: activeAdmin?.full_name || 'Yönetim Kurulu'
        });
      }

      setShowAddTripModal(false);
      setEditingTrip(null);
      resetTripForm();
      await loadAllData();
    } catch (err: any) {
      console.error('Gezi kaydetme hatası:', err);
      alert(err?.message || 'Gezi kaydedilirken bir hata meydana geldi.');
    }
  };

  const handleToggleTripActive = async (trip: Trip) => {
    try {
      await api.updateTrip(trip.id, { is_active: !trip.is_active });
      await loadAllData();
    } catch (err: any) {
      console.error('Gezi durumu güncelleme hatası:', err);
      alert(err?.message || 'Gezi durumu güncellenirken bir hata meydana geldi.');
    }
  };

  const handleDeleteTrip = async (tripId: string, tripTitle: string) => {
    if (window.confirm(`"${tripTitle}" gezisini silmek istediğinize emin misiniz?`)) {
      try {
        await api.deleteTrip(tripId);
        await loadAllData();
      } catch (err: any) {
        console.error('Gezi silme hatası:', err);
        alert(err?.message || 'Gezi silinirken bir hata meydana geldi.');
      }
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setNewTripTitle(trip.title);
    setNewTripDestination(trip.destination);
    setNewTripStartDate(trip.start_date);
    setNewTripEndDate(trip.end_date);
    setNewTripDescription(trip.description || '');
    setNewTripIsActive(trip.is_active);
    setShowAddTripModal(true);
  };

  const resetTripForm = () => {
    setNewTripTitle('');
    setNewTripDestination('');
    setNewTripStartDate(new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
    setNewTripEndDate(new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10));
    setNewTripDescription('');
    setNewTripIsActive(true);
  };

  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const inUseCount = reservations.filter(r => r.status === 'in_use').length;
  const overdueCount = reservations.filter(r => r.status === 'overdue' || (r.status === 'in_use' && new Date(r.return_date) < new Date())).length;
  const totalEquipment = equipmentList.length;

  const filteredReservations = reservations.filter(r => {
    const matchesFilter = reservationFilter === 'all' || r.status === reservationFilter;
    const matchesSearch = 
      r.reservation_code.toLowerCase().includes(searchReservationQuery.toLowerCase()) ||
      r.student_number.includes(searchReservationQuery) ||
      (r.member?.full_name || '').toLowerCase().includes(searchReservationQuery.toLowerCase()) ||
      (r.equipment?.name || '').toLowerCase().includes(searchReservationQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const currentlyInUseList = reservations.filter(r => r.status === 'in_use');
  const supabaseConfig = getSupabaseConfigStatus();

  const isBoardMemberObj = (m?: Member | null) =>
    Boolean(m && (m.role === 'admin' || m.role === 'board' || m.member_type === 'board'));

  const filteredMembers = members.filter(m => {
    const isBoard = isBoardMemberObj(m);
    const matchesStatus = memberStatusFilter === 'all' || m.status === memberStatusFilter;
    const matchesTier = memberTypeFilter === 'all' ||
      (memberTypeFilter === 'normal' ? (m.member_type === 'normal' || m.member_type === 'honorary') :
       memberTypeFilter === 'honorary' ? (m.member_type === 'honorary' || m.member_type === 'honorary_active') :
       (!isBoard && (m.member_type === 'active' || m.member_type === 'honorary_active')));
    const q = memberSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      m.full_name.toLowerCase().includes(q) ||
      (!isBoard && m.student_number.includes(q)) ||
      m.department.toLowerCase().includes(q) ||
      (m.notes || '').toLowerCase().includes(q)
    );
    return matchesStatus && matchesTier && matchesSearch;
  });

  const filteredTrips = trips.filter(t => {
    const matchesFilter = tripFilter === 'all' || (tripFilter === 'active' ? t.is_active : !t.is_active);
    const q = tripSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      t.title.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      t.start_date.includes(q) ||
      t.end_date.includes(q)
    );
    return matchesFilter && matchesSearch;
  });

  const filteredDarkroomReservations = darkroomReservations.filter(r => {
    const matchesStatus = darkroomFilter === 'all' || r.status === darkroomFilter;
    const q = darkroomSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      r.reservation_code.toLowerCase().includes(q) ||
      r.student_number.includes(q) ||
      (r.member?.full_name || '').toLowerCase().includes(q) ||
      (r.member?.department || '').toLowerCase().includes(q) ||
      (r.notes || '').toLowerCase().includes(q) ||
      (r.approved_by || '').toLowerCase().includes(q) ||
      r.date.includes(q)
    );
    return matchesStatus && matchesSearch;
  });

  const filteredHistoryReservations = reservations.filter(r => {
    if (r.status === 'rejected') return false;
    const matchesMember = historyMemberFilter === 'all' || r.member_id === historyMemberFilter || r.student_number === historyMemberFilter;
    const matchesEquipment = historyEquipmentFilter === 'all' || r.equipment_id === historyEquipmentFilter;
    const matchesStatus = historyStatusFilter === 'all' || r.status === historyStatusFilter;
    const matchesAdmin = historyAdminFilter === 'all' ||
      (r.approved_by || '').toLowerCase().includes(historyAdminFilter.toLowerCase()) ||
      (r.checked_out_by || '').toLowerCase().includes(historyAdminFilter.toLowerCase()) ||
      (r.returned_to || '').toLowerCase().includes(historyAdminFilter.toLowerCase());
    const q = historySearchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      r.reservation_code.toLowerCase().includes(q) ||
      r.student_number.includes(q) ||
      (r.member?.full_name || '').toLowerCase().includes(q) ||
      (r.member?.department || '').toLowerCase().includes(q) ||
      (r.equipment?.name || '').toLowerCase().includes(q) ||
      (r.equipment?.serial_number || '').toLowerCase().includes(q) ||
      (r.approved_by || '').toLowerCase().includes(q) ||
      (r.checked_out_by || '').toLowerCase().includes(q) ||
      (r.returned_to || '').toLowerCase().includes(q) ||
      (r.purpose || '').toLowerCase().includes(q) ||
      (r.return_condition_notes || '').toLowerCase().includes(q)
    );
    return matchesMember && matchesEquipment && matchesStatus && matchesAdmin && matchesSearch;
  });

  const handleExportHistoryCSV = () => {
    const headers = [
      'Rezervasyon Kodu',
      'Öğrenci No',
      'Üye Adı',
      'Üniversite',
      'Ekipman',
      'Seri No',
      'Alış Tarihi',
      'İade Tarihi',
      'Durum',
      'Onay / Ret Yönetici',
      'Teslim Eden Yönetici',
      'İade Alan Yönetici',
      'Amaç',
      'İade Notu / Red Gerekçesi'
    ];
    const rows = filteredHistoryReservations.map(r => [
      r.reservation_code,
      isBoardMemberObj(r.member) ? '-' : r.student_number,
      `"${(r.member?.full_name || '').replace(/"/g, '""')}"`,
      `"${(r.member?.department || '').replace(/"/g, '""')}"`,
      `"${(r.equipment?.name || '').replace(/"/g, '""')}"`,
      r.equipment?.serial_number || '',
      r.pickup_date,
      r.return_date,
      r.status,
      `"${(r.status === 'rejected' ? `Ret: ${cleanAdminName(r.approved_by) || 'Yönetim Kurulu'}` : cleanAdminName(r.approved_by)).replace(/"/g, '""')}"`,
      `"${cleanAdminName(r.checked_out_by).replace(/"/g, '""')}"`,
      `"${cleanAdminName(r.returned_to).replace(/"/g, '""')}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      `"${(r.return_condition_notes || r.rejection_reason || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ytufok_tum_zimmet_gecmisi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#8193b2] animate-spin" />
        <p className="text-sm text-[#a9b9d3]">Yönetici oturumu ve veriler yükleniyor...</p>
      </div>
    );
  }

  if (!activeAdmin) {
    return (
      <AdminLogin
        onLogin={async (profile) => {
          setActiveAdmin(profile);
          await api.setActiveAdmin(profile.id);
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#657796]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#301322] border border-[#657796]/40 text-[#eed1d1] text-xs font-semibold mb-2 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8193b2]" />
            <span>Kulüp Yönetim Kurulu</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-club">
            Yönetim ve Zimmet Kontrol Paneli
          </h1>
          <p className="text-[#a9b9d3] text-xs sm:text-sm mt-1">
            Ekipman zimmet takibi, anlık onay, denetim izi ve üye whitelist.
          </p>
        </div>

        {/* Active Board Member Profile & Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {activeAdmin && (
            <div className="flex items-center gap-3 bg-[#1c0f18] border border-[#657796]/30 px-3.5 py-2 rounded-2xl shadow-md">
              <div className="w-9 h-9 rounded-xl bg-[#241120] flex items-center justify-center text-white text-xs font-mono font-medium shadow-inner border border-white/15 shrink-0">
                {activeAdmin.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white">{activeAdmin.full_name}</span>
                  <span className="text-[10px] font-bold text-[#eed1d1] bg-[#301322] px-2 py-0.5 rounded-full border border-[#657796]/40">
                    {activeAdmin.title}
                  </span>
                  <span className="text-[9px] font-bold text-[#8193b2] bg-[#657796]/15 px-1.5 py-0.5 rounded-full border border-[#657796]/30">
                    Tam Yetkili
                  </span>
                </div>
                <span className="text-[10px] text-[#8193b2] block">YTÜFOK Yönetim Kurulu Üyesi</span>
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[11px] font-semibold text-[#eed1d1] hover:text-white border border-[#657796]/30 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Yönetici şifreni (PIN) değiştir"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#8193b2]" />
                  <span className="hidden sm:inline">Şifremi Değiştir</span>
                </button>

                <button
                  onClick={() => setShowSwitchProfileModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[11px] font-semibold text-[#eed1d1] hover:text-white border border-[#657796]/30 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Başka bir yönetim kurulu üyesine geç"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#8193b2]" />
                  <span className="hidden sm:inline">Profil Değiştir</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Oturumu kapat ve giriş ekranına dön"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Güvenli Çıkış</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#eed1d1] hover:text-white text-xs font-semibold flex items-center gap-2 border border-[#657796]/30 transition-colors w-fit shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => { setActiveTab('reservations'); setReservationFilter('pending'); }}
          className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 cursor-pointer hover:border-[#657796] transition-all"
        >
          <div className="flex items-center justify-between text-xs text-[#a9b9d3] font-semibold mb-2">
            <span>Onay Bekleyen</span>
            <Clock className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div className="text-3xl font-bold text-white font-club">
            {pendingCount}
          </div>
          <p className="text-[11px] text-[#8193b2] mt-1">İncelenecek yeni talep</p>
        </div>

        <div 
          onClick={() => setActiveTab('tracking')}
          className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 cursor-pointer hover:border-[#657796] transition-all"
        >
          <div className="flex items-center justify-between text-xs text-[#a9b9d3] font-semibold mb-2">
            <span>Zimmette (Dışarıda)</span>
            <Camera className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div className="text-3xl font-bold text-white font-club">
            {inUseCount}
          </div>
          <p className="text-[11px] text-[#8193b2] mt-1">Öğrencinin elindeki ekipman</p>
        </div>

        <div 
          onClick={() => { setActiveTab('reservations'); setReservationFilter('in_use'); }}
          className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 cursor-pointer hover:border-rose-400 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-[#a9b9d3] font-semibold mb-2">
            <span>Geciken İadeler</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-white font-club">
            {overdueCount}
          </div>
          <p className="text-[11px] text-rose-300 mt-1">Riskli veya süresi aşanlar</p>
        </div>

        <div 
          onClick={() => setActiveTab('equipment')}
          className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 cursor-pointer hover:border-[#657796] transition-all"
        >
          <div className="flex items-center justify-between text-xs text-[#a9b9d3] font-semibold mb-2">
            <span>Toplam Demirbaş</span>
            <Package className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div className="text-3xl font-bold text-white font-club">
            {totalEquipment}
          </div>
          <p className="text-[11px] text-[#8193b2] mt-1">Kayıtlı makine ve lens</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'reservations' ? 'bg-white text-black font-semibold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Talepler {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'tracking' ? 'bg-white text-black font-semibold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Zimmet Takibi
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'equipment' ? 'bg-white text-black font-semibold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Ekipman Envanteri
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'members' ? 'bg-white text-black font-semibold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Üye Whitelist & Ceza
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'history' ? 'bg-white text-black font-semibold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Tüm Kullanım Geçmişi ({reservations.filter(r => r.status !== 'rejected').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('darkroom')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'darkroom' 
              ? 'bg-white text-black font-semibold shadow-sm' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Karanlık Oda ({darkroomReservations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'trips'
              ? 'bg-white text-black font-semibold shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Kulüp Gezileri ({trips.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-white text-black font-semibold shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Duyurular & Notlar ({announcements.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'supabase' ? 'bg-white text-black font-semibold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Supabase SQL Kılavuzu
        </button>
      </div>

      {/* TAB 1: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
            <input
              type="text"
              placeholder="Kod, öğrenci veya ekipman ara..."
              value={searchReservationQuery}
              onChange={(e) => setSearchReservationQuery(e.target.value)}
              className="w-full sm:w-72 px-3 py-1.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
            />
            <div className="flex flex-wrap gap-1 text-xs">
              {['all', 'pending', 'approved', 'in_use', 'returned', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setReservationFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                    reservationFilter === f ? 'bg-white text-[#301322] font-bold' : 'bg-[#301322] text-[#eed1d1] hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Tümü' : f === 'pending' ? 'Onay Bekleyen' : f === 'approved' ? 'Onaylı' : f === 'in_use' ? 'Zimmette' : f === 'returned' ? 'İade' : 'Reddedilen'}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#1c0f18] border border-[#657796]/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#eed1d1]">
                <thead className="bg-[#500b27] text-[10px] uppercase text-[#8193b2] border-b border-[#657796]/20">
                  <tr>
                    <th className="p-3.5">Kod & Talep Zamanı</th>
                    <th className="p-3.5">Öğrenci</th>
                    <th className="p-3.5">Ekipman</th>
                    <th className="p-3.5">Kullanım Tarihleri</th>
                    <th className="p-3.5">Durum</th>
                    <th className="p-3.5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#657796]/15">
                  {filteredReservations.map(r => (
                    <tr key={r.id} className="hover:bg-[#301322]/40">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-white block">{r.reservation_code}</span>
                        {r.created_at && (
                          <div className="text-[10px] text-[#8193b2] flex items-center gap-1 mt-0.5" title="Sisteme rezervasyon girilme anı">
                            <Clock className="w-3 h-3 text-[#8193b2] shrink-0" />
                            <span className="font-mono">{new Date(r.created_at).toLocaleDateString('tr-TR')} {new Date(r.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                        {r.trip && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-sans font-bold text-[#eed1d1] bg-[#301322] px-2 py-0.5 rounded-full border border-[#657796]/40 mt-1">
                            <Compass className="w-3 h-3 text-[#8193b2]" />
                            <span>{r.trip.title}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <strong className="text-white block">{r.member?.full_name}</strong>
                        {!isBoardMemberObj(r.member) && (
                          <span className="text-[#a9b9d3] font-mono text-[11px]">{r.student_number}</span>
                        )}
                        <span className="text-[9px] text-[#8193b2] block mt-0.5">
                          {isBoardMemberObj(r.member)
                            ? 'Yönetim Kurulu Üyesi'
                            : r.member?.member_type === 'active'
                            ? 'Aktif Üye'
                            : r.member?.member_type === 'honorary_active'
                            ? 'Fahri Aktif'
                            : r.member?.member_type === 'honorary'
                            ? 'Fahri Üye'
                            : 'Normal Üye'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <strong className="text-white block text-xs">{r.equipment?.name}</strong>
                        <span className="text-[#8193b2] font-mono text-[10px]">{r.equipment?.serial_number}</span>
                        {r.purpose && (
                          <div className="text-[10px] text-[#a9b9d3] mt-0.5 line-clamp-1" title={r.purpose}>
                            {r.purpose}
                          </div>
                        )}
                        {r.additional_notes && (
                          <div className="text-[10px] text-[#eed1d1] bg-[#301322] px-2 py-0.5 rounded-md border border-[#657796]/30 mt-1 inline-block" title={r.additional_notes}>
                            💬 {r.additional_notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-xs text-[#eed1d1] font-mono">{r.pickup_date} → {r.return_date}</div>
                        {r.status === 'rejected' ? (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-[11px] text-rose-400 font-semibold">
                              Ret: <strong className="text-rose-300 font-semibold">{cleanAdminName(r.approved_by) || 'Yönetim Kurulu'}</strong>
                            </div>
                            {r.rejection_reason && (
                              <div className="text-[10px] text-rose-400/90 italic">
                                Gerekçe: {r.rejection_reason}
                              </div>
                            )}
                          </div>
                        ) : r.approved_by ? (
                          <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                            Onay: <strong className="text-emerald-300 font-semibold">{cleanAdminName(r.approved_by)}</strong>
                          </div>
                        ) : null}
                        {r.checked_out_by && (
                          <div className="text-[10px] text-[#8193b2]">
                            Teslim: <strong>{cleanAdminName(r.checked_out_by)}</strong>
                          </div>
                        )}
                        {r.returned_to && (
                          <div className="text-[10px] text-emerald-400">
                            İade Alan: <strong>{cleanAdminName(r.returned_to)}</strong>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={r.status} type="reservation" size="sm" />
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => setRejectModalData({ id: r.id, code: r.reservation_code })}
                              className="px-2.5 py-1 rounded-lg bg-[#1c0d18] text-rose-300 text-xs hover:bg-rose-950/40 border border-rose-500/30 transition-colors cursor-pointer"
                            >
                              Reddet
                            </button>
                          </>
                        )}
                        {r.status === 'approved' && (
                          <button
                            onClick={() => handleDeliver(r.id)}
                            className="px-2.5 py-1 rounded-lg bg-white text-black font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Teslim Et
                          </button>
                        )}
                        {r.status === 'in_use' && (
                          <button
                            onClick={() => setReturnModalData({ id: r.id, equipmentName: r.equipment?.name || 'Ekipman' })}
                            className="px-2.5 py-1 rounded-lg bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            İade Al
                          </button>
                        )}
                        {['returned', 'rejected', 'cancelled'].includes(r.status) && (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-[#a9b9d3] text-[11px]">Kapatıldı</span>
                            <button
                              onClick={() => handleDeleteReservation(r)}
                              title="Kaydı Sil"
                              className="p-1 rounded-lg bg-[#301322] hover:bg-rose-950/70 text-[#8193b2] hover:text-rose-300 border border-[#657796]/30 hover:border-rose-500/30 transition-colors inline-flex items-center cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE TRACKING */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyInUseList.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-2xl bg-[#1c0f18] border border-[#657796]/20 text-[#a9b9d3]">
                Şu anda dışarıda zimmette olan makine yok.
              </div>
            ) : (
              currentlyInUseList.map(res => (
                <div key={res.id} className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 space-y-3 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-white">{res.reservation_code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#657796] text-white">Zimmette</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm font-club">{res.equipment?.name}</h4>
                    <span className="text-xs text-[#8193b2] font-mono">{res.equipment?.serial_number}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#500b27] border border-[#657796]/20 text-xs space-y-1.5">
                    <div className="text-white font-bold">
                      {res.member?.full_name} {!isBoardMemberObj(res.member) && `(${res.student_number})`}
                    </div>
                    <div className="text-[#a9b9d3]">Tel: {res.member?.phone}</div>
                    <div className="text-[#eed1d1]">Teslim: <strong className="text-white">{res.pickup_date}</strong> → İade: <strong className="text-white">{res.return_date}</strong></div>
                    {res.approved_by && (
                      <div className="text-[11px] pt-1 border-t border-[#657796]/15">
                        <span className="text-emerald-400 font-semibold">Onay: </span>
                        <strong className="text-emerald-300 font-semibold">{cleanAdminName(res.approved_by)}</strong>
                      </div>
                    )}
                    {res.checked_out_by && (
                      <div className="text-[11px] text-[#8193b2]">
                        Teslim Eden: <strong>{cleanAdminName(res.checked_out_by)}</strong>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setReturnModalData({ id: res.id, equipmentName: res.equipment?.name || 'Ekipman' })}
                    className="w-full py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    İade Alındı Olarak İşaretle
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EQUIPMENT INVENTORY */}
      {activeTab === 'equipment' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white font-club">Kulüp Demirbaş Listesi</h3>
            <button
              onClick={() => setShowAddEquipmentModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Ekipman Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {equipmentList.map(item => (
              <div key={item.id} className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="h-32 rounded-xl overflow-hidden bg-black mb-2 relative group">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleOpenEditEquipment(item)}
                      title="Ekipmanı Düzenle"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-[#301322] text-white/80 hover:text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white font-club">{item.name}</h4>
                  <div className="text-[11px] font-mono text-[#a9b9d3]">{item.serial_number}</div>
                  <div className="text-[11px] text-[#8193b2] mt-1 flex items-center justify-between">
                    <span>Kondisyon:</span>
                    <span className="text-[#eed1d1] font-medium truncate max-w-[120px]">{item.current_condition || 'değerlendirilecek'}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#657796]/20 flex justify-between items-center text-xs">
                  <StatusBadge status={item.status} type="equipment" size="sm" />
                  <button
                    onClick={async () => {
                      const next = item.status === 'maintenance' ? 'available' : 'maintenance';
                      try {
                        await api.updateEquipmentStatus(item.id, next);
                        await loadAllData();
                      } catch (err: any) {
                        console.error('Ekipman durumu güncelleme hatası:', err);
                        alert(err?.message || 'Ekipman durumu güncellenirken hata oluştu.');
                      }
                    }}
                    className="text-[11px] text-[#8193b2] hover:text-white underline cursor-pointer"
                  >
                    {item.status === 'maintenance' ? 'Müsait Yap' : 'Bakıma Al'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => handleOpenEditEquipment(item)}
                    className="py-1.5 rounded-xl bg-[#500b27] hover:bg-[#301322] text-[11px] text-[#eed1d1] hover:text-white font-medium border border-[#657796]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3 text-[#8193b2]" />
                    <span>Düzenle</span>
                  </button>

                  <button
                    onClick={() => handleDeleteEquipment(item)}
                    className="py-1.5 rounded-xl bg-[#500b27] hover:bg-rose-950/60 text-[11px] text-[#8193b2] hover:text-rose-300 font-medium border border-[#657796]/30 hover:border-rose-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Sil</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedEquipmentForHistory(item)}
                  className="w-full mt-1 py-1.5 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[11px] text-[#eed1d1] hover:text-white font-medium border border-[#657796]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-[#8193b2]" />
                  <span>Kullanım Geçmişi ({reservations.filter(r => r.equipment_id === item.id && r.status !== 'rejected').length})</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERS & WHITELIST */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-club">Aktif Üyeler & Whitelist</h3>
              <p className="text-xs text-[#a9b9d3]">Öğrenci numarası doğrulanan kulüp üyeleri ve zimmet geçmişleri.</p>
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Üye Ekle</span>
            </button>
          </div>

          {/* Members Search & Filter Toolbar */}
          <div className="p-3.5 rounded-2xl bg-[#1c0f18] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İsim, öğrenci no veya üniversite ara..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#500b27] border border-white/10 text-white text-xs placeholder-white/30"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs w-full sm:w-auto justify-end">
              <span className="text-[11px] text-white/40 mr-1 hidden sm:inline">Filtre:</span>
              <button
                onClick={() => { setMemberStatusFilter('all'); setMemberTypeFilter('all'); }}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                  memberStatusFilter === 'all' && memberTypeFilter === 'all'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-[#500b27] text-white/60 hover:text-white border border-white/10'
                }`}
              >
                Tümü ({members.length})
              </button>
              <button
                onClick={() => { setMemberStatusFilter('active'); setMemberTypeFilter('active'); }}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                  memberTypeFilter === 'active'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : 'bg-[#500b27] text-emerald-400/70 hover:text-emerald-300 border border-emerald-500/20'
                }`}
              >
                ★ Aktif Üyeler (5 Gün)
              </button>
              <button
                onClick={() => { setMemberStatusFilter('all'); setMemberTypeFilter('normal'); }}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                  memberTypeFilter === 'normal'
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                    : 'bg-[#500b27] text-blue-400/70 hover:text-blue-300 border border-blue-500/20'
                }`}
              >
                Normal Üyeler (3 Gün)
              </button>
              <button
                onClick={() => { setMemberStatusFilter('all'); setMemberTypeFilter('honorary'); }}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                  memberTypeFilter === 'honorary'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-[#500b27] text-white/60 hover:text-white border border-white/10'
                }`}
              >
                ★ Fahri Üyeler
              </button>
              <button
                onClick={() => { setMemberStatusFilter('suspended'); setMemberTypeFilter('all'); }}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                  memberStatusFilter === 'suspended'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                    : 'bg-[#500b27] text-rose-400/70 hover:text-rose-300 border border-rose-500/20'
                }`}
              >
                Askıda / Cezalı
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#1c0f18] border border-[#657796]/20 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-[#eed1d1]">
              <thead className="bg-[#500b27] text-[10px] uppercase text-[#8193b2] border-b border-[#657796]/20">
                <tr>
                  <th className="p-3.5">Öğrenci No</th>
                  <th className="p-3.5">İsim & Yetki</th>
                  <th className="p-3.5">Üye Statüsü</th>
                  <th className="p-3.5">Üniversite</th>
                  <th className="p-3.5">Zimmet Geçmişi</th>
                  <th className="p-3.5">Ceza Puanı</th>
                  <th className="p-3.5">Durum</th>
                  <th className="p-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#657796]/15">
                {filteredMembers.map(m => {
                  const mReservations = reservations.filter(r => (r.member_id === m.id || r.student_number === m.student_number) && r.status !== 'rejected');
                  const mInUse = mReservations.filter(r => r.status === 'in_use').length;
                  const isBoard = isBoardMemberObj(m);
                  const isAudit = Boolean(m.role === 'audit' || m.member_type === 'audit');

                  return (
                    <tr key={m.id} className="hover:bg-[#301322]/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white">
                        {isBoard ? <span className="text-[#8193b2]">—</span> : m.student_number}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-white font-bold">{m.full_name}</strong>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            isBoard || isAudit ? 'bg-[#657796]/20 text-[#eed1d1] border border-[#657796]/40' :
                            'text-[#8193b2]'
                          }`}>
                            {isBoard ? 'Yönetim Kurulu' : isAudit ? 'Denetim Kurulu' : 'Üye'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {isBoard ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#301322] text-[#eed1d1] border border-[#657796]/40 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3 text-[#8193b2]" />
                            <span>Yönetim Kurulu Üyesi</span>
                          </span>
                        ) : isAudit ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#301322] text-[#eed1d1] border border-[#657796]/40 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3 text-[#8193b2]" />
                            <span>Denetim Kurulu Üyesi</span>
                          </span>
                        ) : m.member_type === 'honorary_active' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/10 text-white/80 border border-white/20 flex items-center gap-1 w-fit">
                            <Award className="w-3 h-3 text-white/70" />
                            <span>★ Fahri Aktif (5 Gün)</span>
                          </span>
                        ) : m.member_type === 'honorary' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/10 text-white/80 border border-white/20 flex items-center gap-1 w-fit">
                            <Award className="w-3 h-3 text-white/70" />
                            <span>Fahri Üye (3 Gün)</span>
                          </span>
                        ) : m.member_type === 'normal' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Normal Üye (3 Gün)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>★ Aktif Üye (5 Gün)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#a9b9d3]">{m.department}</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => setSelectedMemberForHistory(m)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#301322] hover:bg-[#421d31] text-xs font-medium text-[#eed1d1] hover:text-white border border-[#657796]/30 transition-colors cursor-pointer"
                          title="Üyenin zimmet ve kullanım geçmişini aç"
                        >
                          <History className="w-3.5 h-3.5 text-[#8193b2]" />
                          <span>{mReservations.length} Zimmet</span>
                          {mInUse > 0 && (
                            <span className="w-2 h-2 rounded-full bg-[#8193b2] animate-pulse" title="Şu an zimmette ekipmanı var"></span>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5">
                        {m.penalty_count > 0 ? (
                          <div className="flex items-center gap-1 text-rose-400 font-semibold" title={m.penalty_reason || ''}>
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{m.penalty_count} Ceza</span>
                          </div>
                        ) : (
                          <span className="text-[#8193b2]">0 Ceza</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {m.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            Askıda
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {!isBoard && !isAudit && (
                          <button
                            onClick={() => handleToggleMemberType(m)}
                            className="px-2 py-1 rounded-lg bg-[#500b27] hover:bg-[#301322] text-[11px] font-semibold text-[#eed1d1] border border-[#657796]/30 transition-colors cursor-pointer"
                            title={
                              m.member_type === 'normal' ? 'Bu üyeyi Aktif Üye yap (5 gün önce rezervasyon & Bireysel Çekim)' :
                              m.member_type === 'active' ? 'Bu üyeyi Normal Üye yap (3 gün önce rezervasyon)' :
                              m.member_type === 'honorary' ? 'Bu fahri üyeyi Fahri Aktif yap (5 gün önce & Bireysel Çekim)' :
                              'Bu fahri üyeyi Normal Öncelikli yap (3 gün önce rezervasyon)'
                            }
                          >
                            {m.member_type === 'normal' ? '★ Aktif Yap' :
                             m.member_type === 'active' ? 'Normal Yap' :
                             m.member_type === 'honorary' ? '★ Aktif Yap' :
                             'Normal Öncelik Yap'}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedMemberForHistory(m)}
                          className="px-2 py-1 rounded-lg bg-[#657796]/30 hover:bg-[#657796]/50 text-xs font-semibold text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Zimmet Geçmişi"
                        >
                          <History className="w-3 h-3 text-[#eed1d1]" />
                          <span>Geçmiş</span>
                        </button>
                        <button
                          onClick={() => handleToggleMemberStatus(m)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            m.status === 'active' 
                              ? 'bg-[#301322] hover:bg-rose-900/40 text-rose-300 border border-rose-500/30' 
                              : 'bg-emerald-950 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {m.status === 'active' ? 'Askıya Al' : 'Aktif Et'}
                        </button>
                        <button
                          onClick={() => handleOpenEditMember(m)}
                          className="px-2 py-1 rounded-lg bg-[#500b27] hover:bg-[#301322] text-xs font-semibold text-[#eed1d1] hover:text-white border border-[#657796]/30 transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Üye Bilgilerini Düzenle"
                        >
                          <Pencil className="w-3 h-3 text-[#8193b2]" />
                          <span>Düzenle</span>
                        </button>
                        {!isBoard && (
                          <button
                            onClick={() => handleDeleteMember(m)}
                            className="px-2 py-1 rounded-lg bg-[#301322] hover:bg-rose-900/60 text-xs font-semibold text-rose-300 hover:text-rose-100 border border-rose-500/30 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Üyeyi Whitelist'ten Sil"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Sil</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ALL MEMBERS USAGE HISTORY & AUDIT LOG */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Header & Export Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/30">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <History className="w-4 h-4 text-[#8193b2]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8193b2]">Arşiv & Zimmet Denetim Kayıtları</span>
              </div>
              <h3 className="text-base font-bold text-white font-club">
                Tüm Üyelerin Ekipman Kullanım & Zimmet Geçmişi
              </h3>
              <p className="text-xs text-[#a9b9d3] mt-0.5">
                Kulüp üyelerinin geçmişten bugüne tüm makine, lens ve aksesuar zimmet kayıtları, teslim-iade kronolojisi ve kontrol notları.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {reservations.length > 0 && (
                <button
                  onClick={handleClearReservationHistory}
                  className="px-3.5 py-2 rounded-xl bg-[#301322] hover:bg-rose-950/70 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                  title="Tüm zimmet ve rezervasyon kayıtlarını temizle"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Geçmişi Temizle</span>
                </button>
              )}
              <button
                onClick={handleExportHistoryCSV}
                className="px-4 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>CSV Olarak Dışa Aktar</span>
              </button>
            </div>
          </div>

          {/* KPI Stats for History */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
              <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Toplam Zimmet Hareketi</span>
              <div className="text-2xl font-bold text-white font-club mt-1">{reservations.filter(r => r.status !== 'rejected').length}</div>
              <span className="text-[11px] text-[#a9b9d3]">Kayıtlı tüm zimmetler</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
              <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Başarıyla İade Edilen</span>
              <div className="text-2xl font-bold text-emerald-400 font-club mt-1">
                {reservations.filter(r => r.status === 'returned').length}
              </div>
              <span className="text-[11px] text-[#a9b9d3]">Eksiksiz tamamlanan zimmet</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
              <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Şu An Zimmette (Dışarıda)</span>
              <div className="text-2xl font-bold text-[#eed1d1] font-club mt-1">
                {reservations.filter(r => r.status === 'in_use').length}
              </div>
              <span className="text-[11px] text-[#a9b9d3]">Üyelerin elindeki ekipman</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
              <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Gecikmeli / Cezalı İadeler</span>
              <div className="text-2xl font-bold text-rose-400 font-club mt-1">
                {reservations.filter(r => (r.return_condition_notes || '').includes('gecikmeli') || r.status === 'overdue').length}
              </div>
              <span className="text-[11px] text-[#a9b9d3]">Ceza puanı işletilen kayıtlar</span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8193b2] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Üye, öğrenci no, ekipman, amaç..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs placeholder-[#8193b2]"
                />
              </div>

              {/* Member Filter Dropdown */}
              <div>
                <select
                  value={historyMemberFilter}
                  onChange={(e) => setHistoryMemberFilter(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
                >
                  <option value="all">Tüm Üyeler ({members.length})</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {isBoardMemberObj(m) ? `${m.full_name} (Yönetim Kurulu)` : `${m.full_name} (${m.student_number})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment Filter Dropdown */}
              <div>
                <select
                  value={historyEquipmentFilter}
                  onChange={(e) => setHistoryEquipmentFilter(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
                >
                  <option value="all">Tüm Ekipmanlar ({equipmentList.length})</option>
                  {equipmentList.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="returned">İade Alındı (Tamamlandı)</option>
                  <option value="in_use">Kullanımda / Zimmette</option>
                  <option value="approved">Onaylandı (Bekliyor)</option>
                  <option value="pending">Onay Bekliyor</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </div>

              {/* Board Member / Responsible Admin Filter */}
              <div>
                <select
                  value={historyAdminFilter}
                  onChange={(e) => setHistoryAdminFilter(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
                >
                  <option value="all">Tüm Yöneticiler ({adminProfiles.length})</option>
                  {adminProfiles.map(p => (
                    <option key={p.id} value={p.full_name}>
                      {p.short_title}: {p.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(historySearchQuery || historyMemberFilter !== 'all' || historyEquipmentFilter !== 'all' || historyStatusFilter !== 'all' || historyAdminFilter !== 'all') && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#657796]/20">
                <span className="text-[#a9b9d3]">
                  Filtrelenen: <strong className="text-white">{filteredHistoryReservations.length}</strong> kayıt
                </span>
                <button
                  onClick={() => {
                    setHistorySearchQuery('');
                    setHistoryMemberFilter('all');
                    setHistoryEquipmentFilter('all');
                    setHistoryStatusFilter('all');
                    setHistoryAdminFilter('all');
                  }}
                  className="text-[11px] text-[#8193b2] hover:text-white underline cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>

          {/* Results Table */}
          <div className="rounded-2xl bg-[#1c0f18] border border-[#657796]/20 overflow-hidden shadow-xl">
            {filteredHistoryReservations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#eed1d1]">
                  <thead className="bg-[#500b27] text-[10px] uppercase text-[#8193b2] border-b border-[#657796]/20">
                    <tr>
                      <th className="p-3.5">Takip Kodu & Statü</th>
                      <th className="p-3.5">Üye Bilgisi</th>
                      <th className="p-3.5">Zimmetlenen Ekipman</th>
                      <th className="p-3.5">Tarih Aralığı</th>
                      <th className="p-3.5">Yetkili Denetim İzi</th>
                      <th className="p-3.5">Kullanım Amacı & Proje</th>
                      <th className="p-3.5">İade / Teslim Kontrol Notu</th>
                      <th className="p-3.5 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#657796]/15">
                    {filteredHistoryReservations.map(res => (
                      <tr key={res.id} className="hover:bg-[#301322]/40 transition-colors">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-white text-xs">{res.reservation_code}</div>
                          <div className="mt-1">
                            <StatusBadge status={res.status} type="reservation" size="sm" />
                          </div>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => {
                              const found = members.find(m => m.id === res.member_id || m.student_number === res.student_number);
                              if (found) setSelectedMemberForHistory(found);
                            }}
                            className="text-left group cursor-pointer"
                          >
                            <strong className="text-white group-hover:text-[#8193b2] transition-colors block font-semibold">
                              {res.member?.full_name || res.student_number}
                            </strong>
                            <span className="text-[11px] font-mono text-[#a9b9d3] block">
                              {isBoardMemberObj(res.member) ? res.member?.department : `${res.student_number} • ${res.member?.department}`}
                            </span>
                          </button>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => {
                              const eq = equipmentList.find(e => e.id === res.equipment_id);
                              if (eq) setSelectedEquipmentForHistory(eq);
                            }}
                            className="flex items-center gap-2.5 text-left group cursor-pointer"
                          >
                            <img
                              src={res.equipment?.image_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-black border border-[#657796]/30 shrink-0"
                            />
                            <div>
                              <strong className="text-white group-hover:text-[#8193b2] transition-colors block text-xs">
                                {res.equipment?.name || 'Ekipman'}
                              </strong>
                              <span className="text-[11px] font-mono text-[#8193b2]">
                                {res.equipment?.serial_number}
                              </span>
                            </div>
                          </button>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="text-xs font-mono text-[#eed1d1]">{res.pickup_date} → {res.return_date}</div>
                          {res.returned_at && (
                            <span className="text-[10px] text-emerald-400 block mt-0.5">
                              İade Edildi: {new Date(res.returned_at).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 min-w-[190px]">
                          <div className="space-y-1 text-[11px]">
                            {res.status === 'rejected' ? (
                              <div className="flex items-center gap-1.5 text-rose-400">
                                <span className="font-semibold text-[10px] w-12 shrink-0">Ret:</span>
                                <span className="font-medium text-rose-300 truncate">{cleanAdminName(res.approved_by) || 'Yönetim Kurulu'}</span>
                              </div>
                            ) : res.approved_by ? (
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <span className="font-semibold text-[10px] w-12 shrink-0">Onay:</span>
                                <span className="font-medium text-emerald-300 truncate">{cleanAdminName(res.approved_by)}</span>
                              </div>
                            ) : null}
                            {res.checked_out_by && (
                              <div className="flex items-center gap-1.5 text-[#eed1d1]">
                                <span className="text-[#8193b2] font-semibold text-[10px] w-12 shrink-0">Teslim:</span>
                                <span className="text-cyan-400 font-medium truncate">{cleanAdminName(res.checked_out_by)}</span>
                              </div>
                            )}
                            {res.returned_to && (
                              <div className="flex items-center gap-1.5 text-[#eed1d1]">
                                <span className="text-[#8193b2] font-semibold text-[10px] w-12 shrink-0">İade:</span>
                                <span className="text-white/80 font-medium truncate">{cleanAdminName(res.returned_to)}</span>
                              </div>
                            )}
                            {!res.approved_by && !res.checked_out_by && !res.returned_to && (
                              <span className="text-[#8193b2] text-[10px] italic">İşlem kaydı yok</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="text-xs text-[#eed1d1] line-clamp-2">{res.purpose}</div>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          {res.return_condition_notes ? (
                            <div className="text-xs text-[#a9b9d3] flex items-start gap-1">
                              {res.return_condition_notes.includes('gecikmeli') ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              )}
                              <span className={res.return_condition_notes.includes('gecikmeli') ? 'text-rose-300 font-medium' : ''}>
                                {res.return_condition_notes}
                              </span>
                            </div>
                          ) : res.status === 'in_use' ? (
                            <span className="text-[#8193b2] text-[11px]">Şu an zimmette, iade bekleniyor</span>
                          ) : res.status === 'rejected' || res.rejection_reason ? (
                            <div className="text-rose-400 text-[11px] space-y-0.5">
                              <span className="font-semibold block">Red Gerekçesi:</span>
                              <span className="text-rose-300 font-medium">{res.rejection_reason || 'Gerekçe belirtilmedi'}</span>
                            </div>
                          ) : (
                            <span className="text-[#8193b2] text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                const found = members.find(m => m.id === res.member_id || m.student_number === res.student_number);
                                if (found) setSelectedMemberForHistory(found);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[11px] font-semibold text-[#eed1d1] hover:text-white border border-[#657796]/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <User className="w-3 h-3 text-[#8193b2]" />
                              <span>Üye Geçmişi</span>
                            </button>
                            <button
                              onClick={() => handleDeleteReservation(res)}
                              title="Kaydı Sil"
                              className="p-1.5 rounded-xl bg-[#301322] hover:bg-rose-950/70 text-[#8193b2] hover:text-rose-300 border border-[#657796]/30 hover:border-rose-500/30 transition-colors inline-flex items-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <History className="w-10 h-10 text-[#8193b2] mx-auto opacity-50" />
                <h4 className="text-sm font-bold text-white">Aranan Kriterlere Uygun Kayıt Bulunamadı</h4>
                <p className="text-xs text-[#a9b9d3]">Filtreleri sıfırlayarak tüm zimmet kayıtlarını görüntüleyebilirsiniz.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: KARANLIK ODA YÖNETİMİ */}
      {activeTab === 'darkroom' && (
        <div className="space-y-6">
          {/* Header & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white font-club flex items-center gap-2">
                <Droplets className="w-5 h-5 text-rose-400" />
                <span>Karanlık Oda & Randevu Yönetimi</span>
              </h3>
              <p className="text-xs text-[#a9b9d3] mt-1">
                Kulüpler Vadisi Davutpaşa Kampüsü karanlık oda randevu saatlerini belirleme, onay ve nöbetçi rehberlik takibi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddSlotModal(true)}
                className="px-4 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Seans Aç</span>
              </button>
            </div>
          </div>

          {/* Sub-tab Navigation: Talepler vs Seans Saatleri */}
          <div className="flex items-center gap-2 border-b border-[#657796]/20 pb-2">
            <button
              type="button"
              onClick={() => setDarkroomSubTab('reservations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                darkroomSubTab === 'reservations'
                  ? 'bg-[#301322] text-white border border-rose-500/40 shadow-sm'
                  : 'text-[#8193b2] hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Randevu Talepleri & Onay</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                {darkroomReservations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDarkroomSubTab('slots')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                darkroomSubTab === 'slots'
                  ? 'bg-[#301322] text-white border border-rose-500/40 shadow-sm'
                  : 'text-[#8193b2] hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Randevu Saatleri & Seans Yönetimi</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                {darkroomSlots.length} Seans Açık
              </span>
            </button>
          </div>

          {/* SUBTAB 1: REZERVASYON TALEPLERİ */}
          {darkroomSubTab === 'reservations' && (
            <div className="space-y-6">

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
              <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Toplam Seans Talebi</span>
              <div className="text-2xl font-bold text-white font-club mt-1">
                {darkroomReservations.length}
              </div>
              <span className="text-[11px] text-[#a9b9d3]">Kayıtlı tüm seanslar</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
              <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Onay Bekleyen</span>
              <div className="text-2xl font-bold text-[#eed1d1] font-club mt-1">
                {darkroomReservations.filter(r => r.status === 'pending').length}
              </div>
              <span className="text-[11px] text-[#a9b9d3]">Yönetim onayı gereken</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
              <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Onaylanan / Yaklaşan</span>
              <div className="text-2xl font-bold text-emerald-400 font-club mt-1">
                {darkroomReservations.filter(r => r.status === 'approved').length}
              </div>
              <span className="text-[11px] text-[#a9b9d3]">Hazırlık bekleyen seans</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
              <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Tamamlanan Banyo/Baskı</span>
              <div className="text-2xl font-bold text-cyan-400 font-club mt-1">
                {darkroomReservations.filter(r => r.status === 'completed').length}
              </div>
              <span className="text-[11px] text-[#a9b9d3]">Başarıyla sonuçlanan</span>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#8193b2] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Öğrenci no, üye adı, kod veya not ara..."
                value={darkroomSearchQuery}
                onChange={(e) => setDarkroomSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs placeholder-[#8193b2]"
              />
            </div>

            <select
              value={darkroomFilter}
              onChange={(e) => setDarkroomFilter(e.target.value)}
              className="p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs w-full sm:w-56"
            >
              <option value="all">Tüm Durumlar ({darkroomReservations.length})</option>
              <option value="pending">Onay Bekleyenler</option>
              <option value="approved">Onaylanan Seanslar</option>
              <option value="completed">Tamamlananlar</option>
              <option value="rejected">Reddedilenler</option>
            </select>
          </div>

          {/* Darkroom Reservations Table */}
          <div className="rounded-2xl bg-[#1c0f18] border border-[#657796]/20 overflow-hidden shadow-xl">
            {filteredDarkroomReservations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#eed1d1]">
                  <thead className="bg-[#500b27] text-[10px] uppercase text-[#8193b2] border-b border-[#657796]/20">
                    <tr>
                      <th className="p-3.5">Takip Kodu & Statü</th>
                      <th className="p-3.5">Tarih & Seans Saati</th>
                      <th className="p-3.5">Üye Bilgisi</th>
                      <th className="p-3.5">İşlem & Rulo</th>
                      <th className="p-3.5">Kimyasal & Rehberlik</th>
                      <th className="p-3.5">Onaylayan Yönetici</th>
                      <th className="p-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#657796]/15">
                    {filteredDarkroomReservations.map(res => (
                      <tr key={res.id} className="hover:bg-[#301322]/40 transition-colors">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-white text-xs">{res.reservation_code}</div>
                          <div className="mt-1">
                            {res.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#301322] text-[#eed1d1] border border-[#657796]/40">
                                Onay Bekliyor
                              </span>
                            )}
                            {res.status === 'approved' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                Onaylandı
                              </span>
                            )}
                            {res.status === 'completed' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                                Tamamlandı
                              </span>
                            )}
                            {res.status === 'rejected' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-400/20 text-rose-300 border border-rose-400/30">
                                Reddedildi
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <strong className="text-white block font-mono">{res.date}</strong>
                          <span className="text-[11px] font-mono text-rose-300 block mt-0.5">
                            {res.slot_time} (1,5 saat)
                          </span>
                        </td>

                        <td className="p-3.5">
                          <strong className="text-white block font-semibold">{res.member?.full_name || res.student_number}</strong>
                          <span className="text-[11px] font-mono text-[#a9b9d3] block">
                            {res.student_number} • {res.department || res.member?.department}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1 text-[9px]">
                            {res.has_washed_film_before !== undefined && (
                              <span className={`px-1.5 py-0.5 rounded border ${res.has_washed_film_before ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30' : 'bg-[#301322] text-[#eed1d1] border-[#657796]/40'}`}>
                                {res.has_washed_film_before ? 'Film Yıkamış' : 'İlk Film Banyosu'}
                              </span>
                            )}
                            {res.has_entered_darkroom_before !== undefined && (
                              <span className={`px-1.5 py-0.5 rounded border ${res.has_entered_darkroom_before ? 'bg-blue-950/50 text-blue-300 border-blue-500/30' : 'bg-rose-950/50 text-rose-300 border-rose-500/30'}`}>
                                {res.has_entered_darkroom_before ? 'K.Oda Biliyor' : 'İlk Kez K.Oda'}
                              </span>
                            )}
                            {res.knows_darkroom_rules === false && (
                              <span className="px-1.5 py-0.5 rounded border bg-rose-950/70 text-rose-300 border-rose-500/40 font-bold">
                                Kural Bilmiyor
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-white text-xs">
                            {res.process_type === 'bw_film' && 'S/B Film Yıkama'}
                            {res.process_type === 'photo_print' && 'Kağıda Fotoğraf Baskısı'}
                            {res.process_type === 'film_scan' && 'Film Tarama'}
                          </div>
                          <span className="text-[11px] text-[#8193b2] block mt-0.5">
                            {res.process_type === 'photo_print' ? `${res.film_count} Baskı Adedi` : `${res.film_count} Rulo Film`}
                          </span>
                          {res.film_brands_and_asa && (
                            <div className="text-[10px] text-[#eed1d1] font-mono mt-0.5 bg-[#500b27] p-1 rounded border border-[#657796]/20">
                              Filmler: {res.film_brands_and_asa}
                            </div>
                          )}
                          {res.paper_size && (
                            <div className="text-[10px] text-white/60 font-mono mt-0.5">
                              Kağıt: {res.paper_size}
                            </div>
                          )}
                          {res.notes && (
                            <span className="text-[10px] text-[#a9b9d3] italic block mt-0.5 max-w-xs truncate" title={res.notes}>
                              Not: {res.notes}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span className="text-[11px] text-[#eed1d1] block">
                            {res.process_type === 'film_scan' ? '🖥️ Negatif Film Tarayıcı' : res.chemical_source === 'club' ? '🧪 Kulüp Kimyasalları' : '🧴 Kendi Kimyası'}
                          </span>
                          {res.needs_assistance ? (
                            <span className="text-[10px] text-[#eed1d1] font-bold bg-[#301322] px-1.5 py-0.5 rounded border border-[#657796]/30 inline-block mt-1">
                              Rehberlik İstiyor
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#8193b2] block mt-1">
                              Bağımsız Çalışma
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {res.status === 'rejected' ? (
                            <div className="text-xs space-y-0.5">
                              <div className="text-rose-400 font-semibold">
                                Ret: <span className="text-rose-300 font-medium">{cleanAdminName(res.approved_by) || 'Yönetim Kurulu'}</span>
                              </div>
                              {res.rejection_reason && (
                                <span className="text-[11px] text-rose-400/90 italic block">
                                  Gerekçe: {res.rejection_reason}
                                </span>
                              )}
                            </div>
                          ) : res.approved_by ? (
                            <div className="text-xs space-y-0.5">
                              <div className="text-emerald-400 font-semibold">
                                Onay: <span className="text-emerald-300 font-medium">{cleanAdminName(res.approved_by)}</span>
                              </div>
                              {res.supervisor && (
                                <span className="text-[10px] text-[#8193b2] block">Rehber: {res.supervisor}</span>
                              )}
                            </div>
                          ) : res.rejection_reason ? (
                            <div className="text-xs text-rose-400 space-y-0.5">
                              <span className="font-semibold block">Reddedildi</span>
                              <span className="text-[11px] text-rose-300 italic block">Gerekçe: {res.rejection_reason}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8193b2] italic block">Onay Bekliyor</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {res.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveDarkroom(res.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition-colors cursor-pointer"
                                >
                                  Onayla
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectDarkroom(res.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  Reddet
                                </button>
                              </>
                            )}

                            {res.status === 'approved' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCompleteDarkroom(res.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-[11px] font-bold shadow transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Seansı Tamamla</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectDarkroom(res.id)}
                                  className="px-2 py-1.5 rounded-xl bg-[#301322] hover:bg-rose-950 text-rose-300 text-[11px] font-semibold border border-[#657796]/30 transition-colors cursor-pointer"
                                >
                                  İptal
                                </button>
                              </>
                            )}

                            {res.status === 'completed' && (
                              <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Tamamlandı</span>
                              </span>
                            )}

                            {res.status === 'rejected' && (
                              <span className="text-[11px] text-rose-400 font-semibold">
                                Reddedildi
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <Droplets className="w-10 h-10 text-[#8193b2] mx-auto opacity-50" />
                <h4 className="text-sm font-bold text-white">Kayıt Bulunamadı</h4>
                <p className="text-xs text-[#a9b9d3]">Filtre kriterlerine uygun karanlık oda rezervasyonu bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      )}

          {/* SUBTAB 2: SEANS & SAAT YÖNETİMİ (DEFAULTTA RANDEVU OLMASIN, BİZ AÇARSAK ALABİLSİNLER) */}
          {darkroomSubTab === 'slots' && (
            <div className="space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
                  <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Toplam Açık Seans</span>
                  <div className="text-2xl font-bold text-white font-club mt-1">
                    {darkroomSlots.length}
                  </div>
                  <span className="text-[11px] text-[#a9b9d3]">Yöneticilerin açtığı saatler</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
                  <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Müsait (Boş) Kontenjan</span>
                  <div className="text-2xl font-bold text-emerald-400 font-club mt-1">
                    {darkroomSlots.filter(s => !darkroomReservations.some(r => r.slot_id === s.id && r.status !== 'cancelled' && r.status !== 'rejected')).length}
                  </div>
                  <span className="text-[11px] text-[#a9b9d3]">Randevuya hazır seans</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20">
                  <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Rezerve Edilen Seanslar</span>
                  <div className="text-2xl font-bold text-rose-400 font-club mt-1">
                    {darkroomSlots.filter(s => darkroomReservations.some(r => r.slot_id === s.id && r.status !== 'cancelled' && r.status !== 'rejected')).length}
                  </div>
                  <span className="text-[11px] text-[#a9b9d3]">Öğrencilerce ayırtılan seans</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1c0f18] border border-white/10 flex flex-col justify-between">
                  <span className="text-white/40 text-[10px] uppercase font-mono block">Hızlı Aksiyon</span>
                  <button
                    type="button"
                    onClick={() => setShowAddSlotModal(true)}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Seans Tanımla</span>
                  </button>
                </div>
              </div>

              {/* Hızlı Toplu Seans Açma Çubuğu */}
              <div className="p-5 rounded-2xl bg-[#1c0f18] border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-white/60" />
                      <span>Hızlı Toplu Seans Açıcı (Standart 6 Seans)</span>
                    </h4>
                    <p className="text-xs text-white/50 mt-0.5">
                      Kulüp nöbetinizin olduğu güne 10:00 - 19:30 arasındaki tüm 1,5 saatlik seansları tek tıkla açın:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toISOString().slice(0, 10);
                        if (window.confirm(`Bugün (${todayStr}) için tüm standart 6 seansı açmak istiyor musunuz?`)) {
                          handleCreateBulkStandardSlots(todayStr, 'all');
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-rose-300 border border-rose-500/30 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Bugün İçin Aç (6 Seans)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
                        if (window.confirm(`Yarın (${tomorrow}) için tüm standart 6 seansı açmak istiyor musunuz?`)) {
                          handleCreateBulkStandardSlots(tomorrow, 'all');
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Yarın İçin Aç (6 Seans)
                    </button>
                  </div>
                </div>
              </div>

              {/* Açık Seanslar Listesi / Tablosu */}
              <div className="rounded-2xl bg-[#1c0f18] border border-[#657796]/20 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-[#657796]/20 bg-[#500b27] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Yöneticiler Tarafından Açılmış Seanslar ({darkroomSlots.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#8193b2]">
                    * Üyeler yalnızca burada listelenen saatlere randevu alabilir.
                  </span>
                </div>

                {darkroomSlots.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#eed1d1]">
                      <thead className="bg-[#500b27]/70 text-[10px] uppercase text-[#8193b2] border-b border-[#657796]/20">
                        <tr>
                          <th className="p-3.5">Tarih</th>
                          <th className="p-3.5">Seans Saati</th>
                          <th className="p-3.5">İzin Verilen İşlem</th>
                          <th className="p-3.5">Nöbetçi / Sorumlu Yönetici</th>
                          <th className="p-3.5">Rezervasyon Durumu</th>
                          <th className="p-3.5 text-right">Seansı Kapat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#657796]/15">
                        {darkroomSlots
                          .slice()
                          .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
                          .map((slot) => {
                            const bookedRes = darkroomReservations.find(
                              r => r.slot_id === slot.id && r.status !== 'cancelled' && r.status !== 'rejected'
                            );
                            const isBooked = Boolean(bookedRes);

                            const badgeText = slot.allowed_process === 'all'
                              ? 'Film Yıkama ve Baskı'
                              : slot.allowed_process === 'film_wash'
                              ? 'Yalnızca Film Yıkama & Tarama'
                              : 'Yalnızca Kağıda Fotoğraf Baskısı';

                            const badgeColor = slot.allowed_process === 'all'
                              ? 'bg-white/10 text-white border-white/20'
                              : slot.allowed_process === 'film_wash'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                              : 'bg-white/10 text-white/80 border-white/20';

                            return (
                              <tr key={slot.id} className="hover:bg-[#301322]/30 transition-colors">
                                <td className="p-3.5 whitespace-nowrap">
                                  <div className="font-bold text-white flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                                    <span>{slot.date}</span>
                                  </div>
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  <div className="font-mono font-bold text-rose-300 text-xs">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                  <span className="text-[10px] text-[#8193b2]">net 90 dakika</span>
                                </td>

                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
                                    {badgeText}
                                  </span>
                                  {slot.notes && (
                                    <div className="text-[10px] text-[#8193b2] italic mt-0.5 max-w-xs truncate">
                                      {slot.notes}
                                    </div>
                                  )}
                                </td>

                                <td className="p-3.5">
                                  <span className="text-white font-medium">
                                    {slot.supervisor || 'YTÜFOK Yönetim Kurulu'}
                                  </span>
                                </td>

                                <td className="p-3.5">
                                  {isBooked ? (
                                    <div>
                                      <div className="font-bold text-white flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#8193b2]" />
                                        <span>Rezerve Edildi</span>
                                      </div>
                                      <div className="text-[11px] text-[#eed1d1] mt-0.5">
                                        {bookedRes?.member?.full_name || bookedRes?.student_number} ({bookedRes?.reservation_code})
                                      </div>
                                      <div className="text-[10px] text-[#8193b2]">
                                        Statü: <strong className="text-white">{bookedRes?.status}</strong>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      <span>Müsait (Randevu Bekliyor)</span>
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(slot)}
                                    className="p-1.5 rounded-xl bg-[#301322] hover:bg-rose-950 text-[#8193b2] hover:text-rose-400 border border-[#657796]/30 transition-colors cursor-pointer"
                                    title="Seansı Kapat / Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#301322] border border-[#657796]/30 text-rose-300 flex items-center justify-center mx-auto shadow-inner">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white font-club">Açık Seans Bulunmuyor</h4>
                    <p className="text-xs text-[#a9b9d3] max-w-md mx-auto leading-relaxed">
                      Default olarak hiçbir randevu saati açık değildir. Üyelerin randevu alabilmesi için yukarıdaki <strong>"+ Yeni Seans Aç"</strong> butonunu veya hızlı butonları kullanarak nöbet gün ve saatlerinizi tanımlayınız.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: KULÜP GEZİLERİ (TRIPS) */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#657796]/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#8193b2]" />
                <h2 className="text-xl font-bold text-white font-club">Kulüp Gezileri Yönetimi</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#301322] text-[#eed1d1] border border-[#657796]/40">
                  {trips.length} Gezi
                </span>
              </div>
              <p className="text-xs text-[#a9b9d3]">
                Fotoğraf gezileri tanımlayın. Üyeler kamera rezerve ederken bu gezileri seçebilir.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTrip(null);
                resetTripForm();
                setShowAddTripModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Gezi Tanımla</span>
            </button>
          </div>

          {/* Rules Summary Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#140911] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
              <Sparkles className="w-4 h-4 text-white/60" />
              <span>Gezilerde Kamera Rezervasyon Kuralları (Otomatik Sistem Doğrulaması)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#500b27]/80 border border-emerald-500/30 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>1. Öncelikli Aktif Üyeler:</span>
                </div>
                <p className="text-[#eed1d1] text-[11px] leading-relaxed">
                  Gezinin başlangıç tarihinden <strong>en erken 5 gün önce</strong> kamera rezervasyonu yapabilir. Erken rezervasyon hakkına sahiptirler.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#500b27]/80 border border-blue-500/30 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span>Normal Kulüp Üyeleri:</span>
                </div>
                <p className="text-[#eed1d1] text-[11px] leading-relaxed">
                  Gezinin başlangıç tarihinden <strong>en erken 3 gün önce</strong> rezervasyon yapabilir. Aktif üyelerden 2 gün sonra rezervasyon ekranı açılır.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-3.5 rounded-2xl bg-[#1c0f18] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Gezi adı, konum veya rota ara..."
                value={tripSearchQuery}
                onChange={(e) => setTripSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#500b27] border border-white/10 text-white text-xs placeholder-white/30"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto justify-end">
              <span className="text-[11px] text-white/40 mr-1 hidden sm:inline">Durum:</span>
              {(['all', 'active', 'passive'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setTripFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                    tripFilter === filter
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-[#500b27] text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {filter === 'all' ? `Tümü (${trips.length})` : filter === 'active' ? 'Aktif Geziler' : 'Pasif / Taslak'}
                </button>
              ))}
            </div>
          </div>

          {/* Trips Cards Grid */}
          {filteredTrips.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#1c0f18] border border-[#657796]/20 space-y-3">
              <Compass className="w-10 h-10 text-[#8193b2] mx-auto opacity-50" />
              <h4 className="text-white font-bold text-sm">Tanımlı Gezi Bulunamadı</h4>
              <p className="text-xs text-[#a9b9d3] max-w-sm mx-auto">
                {tripSearchQuery ? 'Arama kriterlerinize uygun gezi bulunamadı.' : 'Henüz sisteme tanımlanmış bir gezi yok. "Yeni Gezi Tanımla" butonu ile gezi oluşturabilirsiniz.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTrips.map((trip) => {
                const activeTripReservations = reservations.filter(
                  r => r.trip_id === trip.id && (r.status === 'approved' || r.status === 'in_use')
                );
                const pendingTripReservations = reservations.filter(
                  r => r.trip_id === trip.id && r.status === 'pending'
                );
                const activeEligibility = checkTripBookingEligibility(trip.start_date, 'active');
                const normalEligibility = checkTripBookingEligibility(trip.start_date, 'normal');

                return (
                  <div
                    key={trip.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      trip.is_active
                        ? 'bg-[#1c0f18] border-[#657796]/30 hover:border-[#657796]/60 shadow-xl'
                        : 'bg-[#160b13] border-[#657796]/15 opacity-75'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white font-club">{trip.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            trip.is_active
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                          }`}>
                            {trip.is_active ? 'Yayında' : 'Pasif'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8193b2]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{trip.destination}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white block">
                          {formatDateRangeTr(trip.start_date, trip.end_date)}
                        </span>
                        <span className="text-[10px] text-[#8193b2] block">
                          Geziden {activeEligibility.daysBeforeTrip} gün önce
                        </span>
                      </div>
                    </div>

                    {trip.description && (
                      <p className="text-xs text-[#a9b9d3] leading-relaxed line-clamp-2">
                        {trip.description}
                      </p>
                    )}

                    {/* Reservation Timeline Details */}
                    <div className="p-3.5 rounded-xl bg-[#500b27] border border-[#657796]/20 space-y-2 text-xs">
                      <div className="text-[11px] font-bold text-[#8193b2] uppercase tracking-wider flex items-center justify-between">
                        <span>Rezervasyon Açılış Takvimi:</span>
                        <span className="text-[#eed1d1] font-mono">Bugün: {formatDateTr(getLocalDateString())}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* Aktif Üye Durumu */}
                        <div className={`p-2 rounded-lg border ${
                          activeEligibility.isOpen
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3]'
                        }`}>
                          <div className="flex items-center justify-between text-[11px] font-bold mb-0.5">
                            <span>★ Aktif Üye (5 Gün)</span>
                            <span>{activeEligibility.isOpen ? '🟢 Açık' : '⏳ Kapalı'}</span>
                          </div>
                          <div className="text-[10px]">
                            {activeEligibility.isOpen 
                              ? `Açılış: ${formatDateTr(activeEligibility.openDate)} (Rezerve edilebilir)` 
                              : `Açılış: ${formatDateTr(activeEligibility.openDate)} (${activeEligibility.daysUntilOpen} gün kaldı)`}
                          </div>
                        </div>

                        {/* Normal Üye Durumu */}
                        <div className={`p-2 rounded-lg border ${
                          normalEligibility.isOpen
                            ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                            : 'bg-[#1c0f18] border-[#657796]/20 text-[#a9b9d3]'
                        }`}>
                          <div className="flex items-center justify-between text-[11px] font-bold mb-0.5">
                            <span>Normal Üye (3 Gün)</span>
                            <span>{normalEligibility.isOpen ? '🔵 Açık' : '⏳ Kapalı'}</span>
                          </div>
                          <div className="text-[10px]">
                            {normalEligibility.isOpen 
                              ? `Açılış: ${formatDateTr(normalEligibility.openDate)} (Rezerve edilebilir)` 
                              : `Açılış: ${formatDateTr(normalEligibility.openDate)} (${normalEligibility.daysUntilOpen} gün kaldı)`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#657796]/15">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeTripReservations.length > 0 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                            📷 {activeTripReservations.length} Kamera Rezerve Edildi
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-[#500b27] text-xs font-semibold text-[#8193b2] border border-[#657796]/20">
                            📷 0 Kamera Rezerve
                          </span>
                        )}
                        {pendingTripReservations.length > 0 && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 text-xs font-semibold text-amber-300 border border-amber-500/30">
                            ⏳ {pendingTripReservations.length} Talep Bekliyor
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleTripActive(trip)}
                          className={`p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                            trip.is_active
                              ? 'bg-[#500b27] hover:bg-[#301322] text-[#8193b2] hover:text-white border-[#657796]/30'
                              : 'bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
                          }`}
                          title={trip.is_active ? 'Geziyi pasife al (üyelerin seçimine kapat)' : 'Geziyi yayına al'}
                        >
                          {trip.is_active ? 'Pasif Yap' : 'Yayına Al'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditTrip(trip)}
                          className="px-3 py-2 rounded-xl bg-[#301322] hover:bg-[#421d31] text-xs font-semibold text-white transition-colors cursor-pointer border border-[#657796]/30"
                        >
                          Düzenle
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTrip(trip.id, trip.title)}
                          className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition-colors cursor-pointer border border-rose-500/30"
                          title="Geziyi sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUPABASE GUIDE & SETTINGS */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#1c0f18] border border-[#657796]/30 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#657796]/20">
              <div>
                <h3 className="text-base font-bold text-white font-club flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#8193b2]" />
                  Ortak Veritabanı & Supabase Bağlantısı
                </h3>
                <p className="text-xs text-[#a9b9d3] mt-1">
                  Ekipman açıklamaları, demirbaş detayları, paket içerikleri ve durumları doğrudan Supabase veritabanına kaydedilir. Sayfa yenilendiğinde veya başka bir cihazdan girildiğinde en güncel veriler kalıcı olarak veritabanından çekilir.
                </p>
              </div>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    supabaseConfig.isConfigured
                      ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/70 border border-amber-500/40 text-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      supabaseConfig.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {supabaseConfig.isConfigured ? 'Supabase Bağlantısı Aktif' : 'Yerel / Bulut Yedek Modu'}
                </span>
              </div>
            </div>

            {/* Feedback Message Banner */}
            {supabaseFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  supabaseFeedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {supabaseFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{supabaseFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSupabaseFeedback(null)}
                  className="text-[#8193b2] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Supabase Credentials Form */}
            <form onSubmit={handleSaveAndTestSupabase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyzproject.supabase.co"
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white font-mono text-xs focus:outline-none focus:border-[#657796]"
                  />
                  <span className="text-[10px] text-[#8193b2] block">
                    Supabase Panel {'>'} Project Settings {'>'} API bölümünden alınır.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">
                    Supabase Anon / Public API Key
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white font-mono text-xs focus:outline-none focus:border-[#657796]"
                  />
                  <span className="text-[10px] text-[#8193b2] block">
                    Supabase Panel {'>'} Project Settings {'>'} API {'>'} anon / public anahtarı.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isTestingSupabase}
                  className="px-4 py-2.5 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isTestingSupabase ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {isTestingSupabase ? 'Bağlantı Test Ediliyor...' : 'Bağlantıyı Kaydet & Test Et'}
                </button>

                <button
                  type="button"
                  onClick={handleSyncEquipmentToSupabase}
                  disabled={isSyncingSupabase || !supabaseConfig.isConfigured}
                  className="px-4 py-2.5 rounded-xl bg-[#1c0d18] hover:bg-[#281323] disabled:opacity-50 text-white font-mono uppercase tracking-wider text-xs transition-colors border border-white/20 cursor-pointer flex items-center gap-2"
                  title="Mevcut envanteri Supabase 'equipment' tablosuna aktarır veya günceller."
                >
                  {isSyncingSupabase ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Package className="w-3.5 h-3.5" />
                  )}
                  {isSyncingSupabase ? 'Veritabanına Aktarılıyor...' : 'Tüm Ekipmanları Supabase\'e Aktar / Eşitle'}
                </button>
              </div>
            </form>

            {/* SQL Guide Note */}
            <div className="p-4 rounded-xl bg-[#500b27] border border-[#657796]/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#eed1d1] font-semibold">
                <Info className="w-4 h-4 text-[#8193b2]" />
                <span>Supabase Tablo Şeması Kurulumu</span>
              </div>
              <p className="text-[#a9b9d3]">
                Supabase projenizde tablolar henüz oluşturulmadıysa, proje kökündeki <code className="text-[#eed1d1] bg-[#1c0f18] px-1.5 py-0.5 rounded">supabase/schema.sql</code> dosyasının içeriğini kopyalayıp Supabase panelinizdeki <strong>SQL Editor</strong> bölümüne yapıştırarak <strong>Run</strong> butonuna tıklayınız. Tablolar otomatik olarak RLS izinleri ve tetikleyicileriyle hazır hale gelecektir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ANNOUNCEMENTS & NOTES */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/30 shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-[#8193b2]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8193b2]">Kulüp Bildirimleri</span>
              </div>
              <h3 className="text-base font-bold text-white font-club">
                Duyurular, Notlar ve Kural Hatırlatmaları
              </h3>
              <p className="text-xs text-[#a9b9d3] mt-0.5">
                Ana sayfadaki "Duyurular & Hatırlatmalar" bölümünde yayınlanan tek cümlelik bildirimler ve yönetici notları.
              </p>
            </div>
            <button
              onClick={() => setShowAddAnnouncementModal(true)}
              className="px-4 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Not / Duyuru Ekle</span>
            </button>
          </div>

          {/* Announcements List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 hover:border-[#657796]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full bg-[#301322] text-[#eed1d1] border border-[#657796]/30">
                      {ann.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {ann.is_pinned && (
                        <span className="text-[10px] font-bold text-[#8193b2] bg-[#657796]/20 px-2 py-0.5 rounded-full border border-[#657796]/40">
                          📌 Sabitlendi
                        </span>
                      )}
                      <span className="text-[11px] text-[#a9b9d3]">
                        {new Date(ann.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  <p className="text-white text-xs sm:text-sm font-medium leading-relaxed">
                    {ann.content || ann.title}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#657796]/15">
                  <button
                    onClick={() => handleTogglePinAnnouncement(ann)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#500b27] hover:bg-[#301322] text-[11px] font-semibold text-[#eed1d1] border border-[#657796]/30 transition-colors cursor-pointer"
                  >
                    {ann.is_pinned ? 'Sabitlemeyi Kaldır' : '📌 Öne Çıkar'}
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#301322] hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sil</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAddAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-[#500b27]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c0f18] border border-[#657796]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#657796]/20">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#8193b2]" />
                <h3 className="text-base font-bold text-white font-club">Yeni Not / Duyuru Ekle</h3>
              </div>
              <button
                onClick={() => setShowAddAnnouncementModal(false)}
                className="p-1 rounded-lg text-[#a9b9d3] hover:text-white hover:bg-[#301322] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Not / Duyuru Metni (Tek Cümle): *
                </label>
                <textarea
                  rows={3}
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  placeholder="Örn: Hafta sonu gezi hazırlığı sebebiyle perşembe günü ekipman teslim saatleri 17:00'ye kadar uzatılmıştır."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs placeholder-[#8193b2] focus:outline-none focus:border-[#657796]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Kategori:
                </label>
                <select
                  value={newAnnCategory}
                  onChange={(e) => setNewAnnCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs focus:outline-none focus:border-[#657796]"
                >
                  <option value="Ekipman & Kural">Ekipman & Kural</option>
                  <option value="Kural & Yönetmelik">Kural & Yönetmelik</option>
                  <option value="Genel Duyuru">Genel Duyuru</option>
                  <option value="Atölye & Gezi">Atölye & Gezi</option>
                  <option value="Hatırlatma">Hatırlatma</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ann_is_pinned"
                  checked={newAnnIsPinned}
                  onChange={(e) => setNewAnnIsPinned(e.target.checked)}
                  className="rounded border-[#657796]/40 bg-[#500b27] text-[#657796] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="ann_is_pinned" className="text-xs text-[#eed1d1] cursor-pointer">
                  📌 En başta sabitle (Öne Çıkar)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#657796]/20">
                <button
                  type="button"
                  onClick={() => setShowAddAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#a9b9d3] hover:text-white bg-[#500b27] border border-[#657796]/20"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider text-white bg-[#1c0d18] hover:bg-[#281323] border border-white/20 transition-colors cursor-pointer"
                >
                  Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModalData && (
        <div className="fixed inset-0 z-50 bg-[#500b27]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c0f18] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-club">İade Kontrolü ve Onay</h3>
            <p className="text-xs text-[#eed1d1]">{returnModalData.equipmentName} iade alındı. Hasar/eksik parça kontrol notu:</p>
            <input
              type="text"
              value={returnConditionNote}
              onChange={(e) => setReturnConditionNote(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#500b27] border border-white/10 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReturnModalData(null)} className="px-4 py-2 rounded-xl bg-[#1c0d18] text-xs text-white/70 hover:text-white cursor-pointer">Vazgeç</button>
              <button onClick={handleConfirmReturn} className="px-4 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer">İadeyi Tamamla</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 bg-[#500b27]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c0f18] border border-[#657796]/40 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-club">Talebi Reddet ({rejectModalData.code})</h3>
            <textarea
              rows={2}
              placeholder="Red gerekçesi..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRejectModalData(null)} className="px-4 py-2 rounded-xl bg-[#301322] text-xs text-[#eed1d1]">İptal</button>
              <button onClick={handleConfirmReject} className="px-4 py-2 rounded-xl bg-rose-700 text-white font-bold text-xs">Reddet</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipmentModal && (
        <div className="fixed inset-0 z-50 bg-[#500b27]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c0f18] border border-[#657796]/40 rounded-2xl max-w-md w-full p-6 space-y-3">
            <h3 className="text-sm font-bold text-white font-club">Yeni Ekipman Ekle</h3>
            <form onSubmit={handleAddEquipment} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Ekipman Adı (örn: Canon EOS 5D Mark II)"
                value={newEquipName}
                onChange={e => setNewEquipName(e.target.value)}
                className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newEquipBrand}
                  onChange={e => setNewEquipBrand(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white"
                >
                  <option value="Canon">Canon</option>
                  <option value="Fujifilm">Fujifilm</option>
                  <option value="Nikon">Nikon</option>
                  <option value="Sigma">Sigma</option>
                  <option value="Sony">Sony</option>
                </select>
                <select
                  value={newEquipCategory}
                  onChange={e => setNewEquipCategory(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white"
                >
                  <option value="camera">Dijital Gövde</option>
                  <option value="analog">Analog Makine</option>
                  <option value="lens">Lens / Objektif</option>
                  <option value="lighting">Flaş & Aydınlatma</option>
                  <option value="tripod">Tripod & Destek</option>
                  <option value="accessory">Filtre & Aksesuar</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Seri / Demirbaş No (örn: YTU-EOS-5D2)"
                value={newEquipSerial}
                onChange={e => setNewEquipSerial(e.target.value)}
                className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddEquipmentModal(false)} className="px-3 py-1.5 rounded-lg bg-[#1c0d18] text-white/70 hover:text-white cursor-pointer text-xs">İptal</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {editingEquipment && (
        <div className="fixed inset-0 z-50 bg-[#500b27]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c0f18] border border-[#657796]/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#657796]/20">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#8193b2]" />
                <h3 className="text-sm font-bold text-white font-club">Ekipmanı Düzenle</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEquipment(null)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEquipment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Ekipman Adı *</label>
                  <input
                    type="text"
                    value={editEquipName}
                    onChange={e => setEditEquipName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Seri / Demirbaş No *</label>
                  <input
                    type="text"
                    value={editEquipSerial}
                    onChange={e => setEditEquipSerial(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white font-mono focus:outline-none focus:border-[#657796]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Kategori</label>
                  <select
                    value={editEquipCategory}
                    onChange={e => setEditEquipCategory(e.target.value as EquipmentCategory)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  >
                    <option value="camera">Dijital Gövde</option>
                    <option value="analog">Analog Makine</option>
                    <option value="lens">Lens / Objektif</option>
                    <option value="lighting">Flaş & Aydınlatma</option>
                    <option value="tripod">Tripod & Destek</option>
                    <option value="accessory">Filtre & Aksesuar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Marka</label>
                  <input
                    type="text"
                    value={editEquipBrand}
                    onChange={e => setEditEquipBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Model</label>
                  <input
                    type="text"
                    value={editEquipModel}
                    onChange={e => setEditEquipModel(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Müsaitlik Durumu</label>
                  <select
                    value={editEquipStatus}
                    onChange={e => setEditEquipStatus(e.target.value as EquipmentStatus)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  >
                    <option value="available">🟢 Müsait (Rezerve Edilebilir)</option>
                    <option value="in_use">🔵 Kullanımda / Zimmette</option>
                    <option value="reserved">🟡 Rezerve Edildi</option>
                    <option value="maintenance">🔴 Bakımda / Serviste</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Kondisyon Notu</label>
                  <input
                    type="text"
                    value={editEquipCondition}
                    onChange={e => setEditEquipCondition(e.target.value)}
                    placeholder="Örn: Kusursuz, vizörde hafif toz"
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8193b2] block">Görsel URL / Dosya Yolu</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editEquipImageUrl}
                    onChange={e => setEditEquipImageUrl(e.target.value)}
                    placeholder="/equipment/canon-eos-1000d.jpg veya https://..."
                    className="flex-1 p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white font-mono text-[11px] focus:outline-none focus:border-[#657796]"
                  />
                  {editEquipImageUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-[#657796]/30">
                      <img src={editEquipImageUrl} alt="Önizleme" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8193b2] block">Açıklama</label>
                <textarea
                  rows={2}
                  value={editEquipDescription}
                  onChange={e => setEditEquipDescription(e.target.value)}
                  placeholder="Ekipman tanıtımı ve kullanım bilgisi..."
                  className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white resize-none focus:outline-none focus:border-[#657796]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8193b2] block">Çanta & Paket İçeriği (Virgül veya yeni satırla ayırın)</label>
                <textarea
                  rows={2}
                  value={editEquipPackageContents}
                  onChange={e => setEditEquipPackageContents(e.target.value)}
                  placeholder="Gövde, 1x LP-E5 Batarya, Şarj Aleti, Askı..."
                  className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white resize-none focus:outline-none focus:border-[#657796]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#657796]/20">
                <button
                  type="button"
                  onClick={() => setEditingEquipment(null)}
                  className="px-4 py-2 rounded-xl bg-[#1c0d18] text-white/70 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEquipment}
                  className="px-5 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSavingEquipment && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isSavingEquipment ? 'Veritabanına Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-[#500b27]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c0f18] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-3">
            <h3 className="text-sm font-bold text-white font-club">Whitelist'e Üye Ekle</h3>
            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Öğrenci Numarası (örn: 23015099)"
                value={newMemberNo}
                onChange={e => setNewMemberNo(e.target.value)}
                className="w-full p-2 rounded-xl bg-[#500b27] border border-white/10 text-white font-mono"
                required
              />
              <input
                type="text"
                placeholder="Ad Soyad"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                className="w-full p-2 rounded-xl bg-[#500b27] border border-white/10 text-white"
                required
              />
              <input
                type="text"
                placeholder="Üniversite (varsayılan: Yıldız Teknik Üniversitesi)"
                value={newMemberDept}
                onChange={e => setNewMemberDept(e.target.value)}
                className="w-full p-2 rounded-xl bg-[#500b27] border border-white/10 text-white"
              />
              <div className="space-y-1">
                <label className="text-[11px] text-white/50 block">Üye Statüsü / Gezi Önceliği:</label>
                <select
                  value={newMemberType}
                  onChange={e => setNewMemberType(e.target.value as 'active' | 'normal' | 'honorary' | 'honorary_active')}
                  className="w-full p-2 rounded-xl bg-[#500b27] border border-white/10 text-white"
                >
                  <option value="active">★ Aktif Üye (Geziden 5 gün önce & Bireysel Çekim)</option>
                  <option value="normal">Normal Üye (Geziden 3 gün önce rezervasyon hakkı)</option>
                  <option value="honorary">Fahri Üye (Geziden 3 gün önce - Normal Öncelik)</option>
                  <option value="honorary_active">★ Fahri Aktif Üye (Geziden 5 gün önce & Bireysel Çekim - Aktif Öncelik)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-3 py-1.5 rounded-lg bg-[#1c0d18] text-white/70 hover:text-white cursor-pointer text-xs">İptal</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer">Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-[#500b27]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c0f18] border border-[#657796]/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#657796]/20">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#8193b2]" />
                <h3 className="text-sm font-bold text-white font-club">Üye Bilgilerini Düzenle</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Ad Soyad *</label>
                  <input
                    type="text"
                    value={editMemberName}
                    onChange={e => setEditMemberName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Öğrenci Numarası *</label>
                  <input
                    type="text"
                    value={editMemberNo}
                    onChange={e => setEditMemberNo(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white font-mono focus:outline-none focus:border-[#657796]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Üniversite / Bölüm</label>
                  <input
                    type="text"
                    value={editMemberDept}
                    onChange={e => setEditMemberDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Telefon</label>
                  <input
                    type="text"
                    value={editMemberPhone}
                    onChange={e => setEditMemberPhone(e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Üye Statüsü / Gezi Önceliği</label>
                  <select
                    value={editMemberType}
                    onChange={e => setEditMemberType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  >
                    <option value="active">★ Aktif Üye (Geziden 5 gün önce & Bireysel Çekim)</option>
                    <option value="normal">Normal Üye (Geziden 3 gün önce)</option>
                    <option value="honorary">Fahri Üye (Geziden 3 gün önce)</option>
                    <option value="honorary_active">★ Fahri Aktif (Geziden 5 gün önce & Bireysel Çekim)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Hesap Durumu</label>
                  <select
                    value={editMemberStatus}
                    onChange={e => setEditMemberStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  >
                    <option value="active">🟢 Aktif (Zimmet Alabilir)</option>
                    <option value="suspended">🔴 Askıda / Cezalı (Engelli)</option>
                    <option value="passive">⚪ Pasif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Ceza Puanı</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={editMemberPenalty}
                    onChange={e => setEditMemberPenalty(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8193b2] block">Ceza Nedeni</label>
                  <input
                    type="text"
                    value={editMemberPenaltyReason}
                    onChange={e => setEditMemberPenaltyReason(e.target.value)}
                    placeholder="Örn: 2 gün gecikmeli iade"
                    className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white focus:outline-none focus:border-[#657796]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8193b2] block">Yönetici Notu</label>
                <textarea
                  rows={2}
                  value={editMemberNotes}
                  onChange={e => setEditMemberNotes(e.target.value)}
                  placeholder="Üye hakkında kulüp notu..."
                  className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white resize-none focus:outline-none focus:border-[#657796]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl bg-[#1c0d18] text-white/70 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 bg-[#500b27]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c0f18] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/5 text-white border border-white/10">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Yeni Randevu Seansı Aç</h3>
                  <p className="text-[11px] text-white/50">Karanlık oda kullanım seansı tanımlayın.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSlotModal(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
              {/* Tarih Seçimi */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/80 block mb-1">
                  Seans Tarihi *
                </label>
                <input
                  type="date"
                  value={newSlotDate}
                  onChange={e => setNewSlotDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#500b27] border border-white/10 text-white font-mono"
                  required
                />
              </div>

              {/* İzin Verilen İşlem Türü */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/80 block mb-1.5">
                  Bu Seansta Yapılabilecek İşlem Türü *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSlotProcess('all')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newSlotProcess === 'all'
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'bg-[#500b27] border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="text-[11px] block font-semibold">Her İkisi</span>
                    <span className="text-[9px] opacity-70 block mt-0.5">Yıkama / Baskı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSlotProcess('film_wash')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newSlotProcess === 'film_wash'
                        ? 'bg-rose-950/80 border-rose-500 text-white font-bold ring-2 ring-rose-500/30'
                        : 'bg-[#500b27] border-[#657796]/20 text-[#8193b2] hover:text-white'
                    }`}
                  >
                    <span className="text-[11px] block font-semibold">Film Yıkama</span>
                    <span className="text-[9px] text-[#8193b2] block mt-0.5">& Negatif Tarama</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSlotProcess('photo_print')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newSlotProcess === 'photo_print'
                        ? 'bg-[#301322] border-rose-400 text-white font-bold ring-2 ring-rose-400/30'
                        : 'bg-[#500b27] border-[#657796]/20 text-[#8193b2] hover:text-white'
                    }`}
                  >
                    <span className="text-[11px] block font-semibold">Kağıda Baskı</span>
                    <span className="text-[9px] text-[#8193b2] block mt-0.5">Agrandisör ile</span>
                  </button>
                </div>
              </div>

              {/* Hızlı Şablon Saatler */}
              <div>
                <label className="text-[11px] font-bold text-white block mb-1.5">
                  Standart 90 Dakikalık Seans Şablonları (Seçmek için tıklayın):
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { start: '10:00', end: '11:30', no: '1' },
                    { start: '11:30', end: '13:00', no: '2' },
                    { start: '13:30', end: '15:00', no: '3' },
                    { start: '15:00', end: '16:30', no: '4' },
                    { start: '16:30', end: '18:00', no: '5' },
                    { start: '18:00', end: '19:30', no: '6' }
                  ].map(item => {
                    const isSelected = newSlotStartTime === item.start && newSlotEndTime === item.end;
                    return (
                      <button
                        key={item.start}
                        type="button"
                        onClick={() => {
                          setNewSlotStartTime(item.start);
                          setNewSlotEndTime(item.end);
                        }}
                        className={`p-2 rounded-xl text-[11px] font-mono border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                            : 'bg-[#500b27] border-[#657796]/20 text-[#eed1d1] hover:border-[#657796]/50'
                        }`}
                      >
                        {item.no}. Seans: {item.start}-{item.end}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saat Girişi (Başlangıç & Bitiş) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#8193b2] block mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    value={newSlotStartTime}
                    onChange={e => setNewSlotStartTime(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8193b2] block mb-1">Bitiş Saati</label>
                  <input
                    type="time"
                    value={newSlotEndTime}
                    onChange={e => setNewSlotEndTime(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Nöbetçi Yönetici */}
              <div>
                <label className="text-[11px] font-bold text-white block mb-1">
                  Nöbetçi / Sorumlu Yönetici
                </label>
                <select
                  value={newSlotSupervisor || (activeAdmin ? `${activeAdmin.full_name} (${activeAdmin.short_title})` : '')}
                  onChange={e => setNewSlotSupervisor(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white"
                >
                  {adminProfiles.map(p => (
                    <option key={p.id} value={`${p.full_name} (${p.short_title})`}>
                      {p.full_name} — {p.title}
                    </option>
                  ))}
                  <option value="YTÜFOK Yönetim Kurulu">YTÜFOK Yönetim Kurulu</option>
                </select>
              </div>

              {/* Not */}
              <div>
                <label className="text-[11px] font-bold text-white block mb-1">
                  Özel Not / Açıklama (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: B&W kimyaları taze hazırlandı, agrandisör 50mm lens takılı"
                  value={newSlotNotes}
                  onChange={e => setNewSlotNotes(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white placeholder-[#8193b2]"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#657796]/20">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`${newSlotDate} tarihi için 6 adet standart seans (10:00 - 19:30 arası) açılsın mı?`)) {
                      handleCreateBulkStandardSlots(newSlotDate, newSlotProcess);
                      setShowAddSlotModal(false);
                    }
                  }}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#301322] hover:bg-[#421d31] text-rose-300 font-semibold text-[11px] border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tüm Gün 6 Seansı Aç</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddSlotModal(false)}
                    className="px-4 py-2 rounded-xl bg-[#301322] text-[#eed1d1] text-xs hover:text-white cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Seansı Aç
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Equipment Usage History Modal (Admin) */}
      {selectedEquipmentForHistory && (
        <div 
          onClick={() => setSelectedEquipmentForHistory(null)}
          className="fixed inset-0 z-50 bg-[#500b27]/92 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#1c0f18] border border-[#657796]/40 rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
          >
            <div className="p-6 border-b border-[#657796]/20 flex items-start justify-between bg-[#500b27]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase font-bold text-[#8193b2]">
                    {selectedEquipmentForHistory.brand} • {selectedEquipmentForHistory.model}
                  </span>
                  <StatusBadge status={selectedEquipmentForHistory.status} type="equipment" size="sm" />
                </div>
                <h3 className="text-base font-bold text-white font-club">
                  {selectedEquipmentForHistory.name} — Kullanım & Zimmet Geçmişi
                </h3>
                <span className="text-xs font-mono text-[#a9b9d3]">
                  Demirbaş Kodu: {selectedEquipmentForHistory.serial_number}
                </span>
              </div>
              <button
                onClick={() => setSelectedEquipmentForHistory(null)}
                className="p-2 rounded-xl bg-[#301322] text-[#a9b9d3] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#500b27] border border-[#657796]/30 text-center text-xs">
                <div>
                  <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Toplam Zimmet</span>
                  <strong className="text-white text-base font-club">
                    {reservations.filter(r => r.equipment_id === selectedEquipmentForHistory.id && r.status !== 'rejected').length} Kez
                  </strong>
                </div>
                <div>
                  <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Tamamlanan İade</span>
                  <strong className="text-[#a9b9d3] text-base font-club">
                    {reservations.filter(r => r.equipment_id === selectedEquipmentForHistory.id && r.status === 'returned').length} Kez
                  </strong>
                </div>
                <div>
                  <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Kondisyon</span>
                  <strong className="text-white text-xs font-semibold block truncate">
                    {selectedEquipmentForHistory.current_condition || 'değerlendirilecek'}
                  </strong>
                </div>
              </div>

              {reservations.filter(r => r.equipment_id === selectedEquipmentForHistory.id && r.status !== 'rejected').length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8193b2] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Zimmet Kronolojisi</span>
                  </h4>

                  {reservations
                    .filter(r => r.equipment_id === selectedEquipmentForHistory.id && r.status !== 'rejected')
                    .sort((a, b) => new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime())
                    .map(res => (
                      <div
                        key={res.id}
                        className="p-4 rounded-2xl bg-[#500b27] border border-[#657796]/20 space-y-2 hover:border-[#657796]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#eed1d1] text-xs">
                              {res.reservation_code}
                            </span>
                            <StatusBadge status={res.status} type="reservation" size="sm" />
                          </div>
                          <span className="text-[11px] text-[#8193b2] font-mono">
                            {res.pickup_date} → {res.return_date}
                          </span>
                        </div>

                        <div className="text-xs flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#657796]/10">
                          <div>
                            <span className="text-[#a9b9d3]">Kullanan Üye: </span>
                            <strong className="text-white">
                              {res.member?.full_name || res.student_number} ({res.student_number})
                            </strong>
                          </div>
                          {res.status === 'rejected' ? (
                            <span className="text-[11px] text-rose-400 font-semibold">
                              Ret: <strong className="text-rose-300 font-semibold">{cleanAdminName(res.approved_by) || 'Yönetim Kurulu'}</strong>
                            </span>
                          ) : res.approved_by ? (
                            <span className="text-[11px] text-emerald-400 font-semibold">
                              Onay: <strong className="text-emerald-300 font-semibold">{cleanAdminName(res.approved_by)}</strong>
                            </span>
                          ) : null}
                        </div>

                        <div className="text-xs text-[#eed1d1] bg-[#1c0f18] p-2.5 rounded-xl border border-[#657796]/20">
                          <span className="text-[10px] text-[#8193b2] block font-bold uppercase tracking-wider">
                            Proje / Kullanım Amacı:
                          </span>
                          <span>{res.purpose}</span>
                        </div>

                        {res.rejection_reason && (
                          <div className="text-[11px] text-rose-300 bg-rose-950/30 p-2 rounded-xl border border-rose-500/20">
                            <span className="text-[10px] uppercase font-bold text-rose-400 block">Red Gerekçesi:</span>
                            <span>{res.rejection_reason}</span>
                          </div>
                        )}

                        {res.return_condition_notes && (
                          <div className="text-[11px] text-[#8193b2] flex items-start gap-1.5 pt-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>İade Notu: <strong className="text-[#eed1d1]">{res.return_condition_notes}</strong></span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#500b27] border border-[#657796]/20 space-y-2">
                  <History className="w-8 h-8 text-[#8193b2] mx-auto opacity-60" />
                  <h4 className="text-xs font-bold text-white">Geçmiş Kullanım Kaydı Bulunmuyor</h4>
                  <p className="text-[11px] text-[#a9b9d3]">Bu ekipman henüz bir üyeye zimmetlenmemiştir.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#657796]/20 bg-[#500b27] flex justify-end">
              <button
                onClick={() => setSelectedEquipmentForHistory(null)}
                className="px-4 py-2 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#eed1d1] text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Usage History Modal (Admin) */}
      {selectedMemberForHistory && (() => {
        const memberResList = reservations
          .filter(r => (r.member_id === selectedMemberForHistory.id || r.student_number === selectedMemberForHistory.student_number) && r.status !== 'rejected')
          .sort((a, b) => new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime());
        const completedReturns = memberResList.filter(r => r.status === 'returned').length;
        const currentInUse = memberResList.filter(r => r.status === 'in_use').length;

        return (
          <div 
            onClick={() => setSelectedMemberForHistory(null)}
            className="fixed inset-0 z-50 bg-[#500b27]/92 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div 
              onClick={e => e.stopPropagation()}
              className="relative max-w-3xl w-full bg-[#1c0f18] border border-[#657796]/40 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#657796]/20 bg-[#500b27] flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#140911] flex items-center justify-center text-white/90 font-medium text-lg border border-white/15 shadow-inner shrink-0">
                    {selectedMemberForHistory.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white font-club">
                        {selectedMemberForHistory.full_name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isBoardMemberObj(selectedMemberForHistory)
                          ? 'bg-[#657796]/20 text-[#eed1d1] border border-[#657796]/40'
                          : 'bg-[#301322] text-[#8193b2] border border-[#657796]/20'
                      }`}>
                        {isBoardMemberObj(selectedMemberForHistory) ? 'Yönetim Kurulu Üyesi' : 'Kulüp Üyesi'}
                      </span>
                      {selectedMemberForHistory.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {isBoardMemberObj(selectedMemberForHistory) ? 'Aktif' : 'Aktif Üye'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Askıya Alındı
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#a9b9d3] flex flex-wrap items-center gap-x-3 gap-y-1">
                      {!isBoardMemberObj(selectedMemberForHistory) && (
                        <>
                          <span className="font-mono text-white font-bold">{selectedMemberForHistory.student_number}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{selectedMemberForHistory.department}</span>
                      {!isBoardMemberObj(selectedMemberForHistory) && (
                        <>
                          <span>•</span>
                          <span>{selectedMemberForHistory.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMemberForHistory(null)}
                  className="p-2 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#a9b9d3] hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Penalty Banner if penalized */}
                {selectedMemberForHistory.penalty_count > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-200 block font-bold">
                        Ceza Puanı: {selectedMemberForHistory.penalty_count} (Yeni Rezervasyon Kısıtlaması)
                      </strong>
                      <p className="text-rose-300/90 mt-0.5">
                        {selectedMemberForHistory.penalty_reason || 'Ekipman tesliminde gecikme veya eksik parça.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Member Notes if any */}
                {selectedMemberForHistory.notes && (
                  <div className="p-3.5 rounded-2xl bg-[#500b27] border border-[#657796]/20 text-xs text-[#eed1d1] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#8193b2] uppercase tracking-wider block">Yönetim Notu</span>
                      <span>{selectedMemberForHistory.notes}</span>
                    </div>
                    <div className="text-[11px] text-[#8193b2] font-mono">
                      Katılım: {selectedMemberForHistory.membership_year || 2024}
                    </div>
                  </div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-[#500b27] border border-[#657796]/20">
                    <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Toplam Talep</span>
                    <strong className="text-white text-xl font-club">{memberResList.length} Kez</strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#500b27] border border-[#657796]/20">
                    <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Tamamlanan İade</span>
                    <strong className="text-emerald-400 text-xl font-club">{completedReturns} Kez</strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#500b27] border border-[#657796]/20">
                    <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Şu An Zimmette</span>
                    <strong className="text-white text-xl font-club">{currentInUse} Ekipman</strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#500b27] border border-[#657796]/20">
                    <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Ceza Puanı</span>
                    <strong className={`text-xl font-club ${selectedMemberForHistory.penalty_count > 0 ? 'text-rose-400' : 'text-[#a9b9d3]'}`}>
                      {selectedMemberForHistory.penalty_count}
                    </strong>
                  </div>
                </div>

                {/* Reservation Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8193b2] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Üyenin Ekipman Zimmet Kronolojisi ({memberResList.length})</span>
                  </h4>

                  {memberResList.length > 0 ? (
                    <div className="space-y-3">
                      {memberResList.map(res => (
                        <div
                          key={res.id}
                          className="p-4 rounded-2xl bg-[#500b27] border border-[#657796]/20 space-y-3 hover:border-[#657796]/40 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-xs">{res.reservation_code}</span>
                              <StatusBadge status={res.status} type="reservation" size="sm" />
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono text-[#8193b2] block">
                                {res.pickup_date} → {res.return_date}
                              </span>
                              {res.status === 'rejected' ? (
                                <span className="text-[11px] text-rose-400 font-semibold block mt-0.5">
                                  Ret: <strong className="text-rose-300 font-semibold">{cleanAdminName(res.approved_by) || 'Yönetim Kurulu'}</strong>
                                </span>
                              ) : res.approved_by ? (
                                <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                                  Onay: <strong className="text-emerald-300 font-semibold">{cleanAdminName(res.approved_by)}</strong>
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1c0f18] border border-[#657796]/20">
                            <img
                              src={res.equipment?.image_url}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover bg-black border border-[#657796]/30 shrink-0"
                            />
                            <div>
                              <strong className="text-white text-xs block font-club">
                                {res.equipment?.name || 'Ekipman'}
                              </strong>
                              <span className="text-[11px] font-mono text-[#8193b2]">
                                Demirbaş No: {res.equipment?.serial_number}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-[#eed1d1]">
                            <span className="text-[10px] text-[#8193b2] block uppercase font-bold">Proje / Çekim Amacı:</span>
                            <p>{res.purpose}</p>
                          </div>

                          {res.return_condition_notes && (
                            <div className="text-xs p-2 rounded-xl bg-[#1c0f18] border border-[#657796]/20 flex items-start gap-1.5">
                              {res.return_condition_notes.includes('gecikmeli') ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="text-[10px] uppercase font-bold text-[#8193b2] block">İade Kontrol & Zimmet Notu</span>
                                <span className={res.return_condition_notes.includes('gecikmeli') ? 'text-rose-300 font-semibold' : 'text-[#eed1d1]'}>
                                  {res.return_condition_notes}
                                </span>
                              </div>
                            </div>
                          )}

                          {res.rejection_reason && (
                            <div className="text-xs text-rose-300 bg-rose-950/30 p-2 rounded-xl border border-rose-500/20">
                              <span className="text-[10px] uppercase font-bold block">Red Gerekçesi:</span>
                              <span>{res.rejection_reason}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-[#500b27] border border-[#657796]/20 space-y-2">
                      <History className="w-8 h-8 text-[#8193b2] mx-auto opacity-60" />
                      <h4 className="text-xs font-bold text-white">Zimmet Kaydı Bulunmuyor</h4>
                      <p className="text-[11px] text-[#a9b9d3]">Bu üye henüz kulüpten ekipman teslim almamıştır.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#657796]/20 bg-[#500b27] flex items-center justify-between gap-3">
                <button
                  onClick={async () => {
                    await handleToggleMemberStatus(selectedMemberForHistory);
                    setSelectedMemberForHistory(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    selectedMemberForHistory.status === 'active'
                      ? 'bg-[#301322] hover:bg-rose-900/60 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {selectedMemberForHistory.status === 'active' ? 'Üyeliği Askıya Al' : 'Üyeliği Aktif Et'}
                </button>

                <button
                  onClick={() => setSelectedMemberForHistory(null)}
                  className="px-4 py-2 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#eed1d1] text-xs font-semibold cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Switch Admin Profile Modal */}
      <SwitchProfileModal
        isOpen={showSwitchProfileModal}
        onClose={() => setShowSwitchProfileModal(false)}
        adminProfiles={adminProfiles}
        activeAdmin={activeAdmin}
        onSuccess={(newProfile) => {
          setActiveAdmin(newProfile);
        }}
        onSignOut={handleLogout}
      />

      {/* Add / Edit Trip Modal */}
      {showAddTripModal && (
        <div className="fixed inset-0 z-50 bg-[#500b27]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c0f18] border border-[#657796]/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#657796]/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#301322] text-[#eed1d1] border border-[#657796]/40">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-club">
                    {editingTrip ? 'Geziyi Düzenle' : 'Yeni Kulüp Gezisi Tanımla'}
                  </h3>
                  <p className="text-[11px] text-[#8193b2]">
                    Kamera rezervasyon formunda kullanım alanı olarak listelenir.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddTripModal(false);
                  setEditingTrip(null);
                }}
                className="p-1 rounded-lg text-[#8193b2] hover:text-white hover:bg-[#301322] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrip} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">Gezi Başlığı *</label>
                <input
                  type="text"
                  placeholder="Örn: Kapadokya Sonbahar Fotoğraf Gezisi"
                  value={newTripTitle}
                  onChange={(e) => setNewTripTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">Rota / Gidilecek Yer *</label>
                <input
                  type="text"
                  placeholder="Örn: Göreme & Uçhisar, Nevşehir"
                  value={newTripDestination}
                  onChange={(e) => setNewTripDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    value={newTripStartDate}
                    onChange={(e) => setNewTripStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    min={newTripStartDate}
                    value={newTripEndDate}
                    onChange={(e) => setNewTripEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Live Calculator Box inside modal */}
              {newTripStartDate && (
                <div className="p-3.5 rounded-xl bg-[#500b27] border border-[#657796]/40 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#eed1d1] block">
                    ⚡ Otomatik Rezervasyon Açılış Önizlemesi:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                      <strong>★ Aktif Üyeler (5 Gün):</strong>
                      <div className="text-[10px] text-white font-mono mt-0.5">
                        {formatDateTr(getReservationOpenDate(newTripStartDate, 5))}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-300">
                      <strong>Normal Üyeler (3 Gün):</strong>
                      <div className="text-[10px] text-white font-mono mt-0.5">
                        {formatDateTr(getReservationOpenDate(newTripStartDate, 3))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#a9b9d3] mb-1">Açıklama / Rota Detayı (Opsiyonel)</label>
                <textarea
                  rows={2}
                  placeholder="Gezi rotası, çekim konsepti ve katılımcılara yönelik notlar..."
                  value={newTripDescription}
                  onChange={(e) => setNewTripDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#500b27] border border-[#657796]/30 text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tripIsActive"
                  checked={newTripIsActive}
                  onChange={(e) => setNewTripIsActive(e.target.checked)}
                  className="rounded bg-[#500b27] border-[#657796]/30 text-[#657796]"
                />
                <label htmlFor="tripIsActive" className="text-xs text-[#eed1d1] cursor-pointer">
                  Gezi hemen yayına alınsın ve rezervasyon formunda görünsün
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#657796]/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTripModal(false);
                    setEditingTrip(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#eed1d1] text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1c0d18] hover:bg-[#281323] text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {editingTrip ? 'Geziyi Güncelle' : 'Geziyi Kaydet & Yayınla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        adminProfiles={adminProfiles}
        initialAdminId={activeAdmin?.id}
        onSuccess={(updatedProfile) => {
          setAdminProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
          if (activeAdmin && activeAdmin.id === updatedProfile.id) {
            setActiveAdmin(updatedProfile);
          }
        }}
      />
    </div>
  );
};
