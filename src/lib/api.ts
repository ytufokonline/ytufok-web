import { supabase, isSupabaseConfigured } from './supabase';
import { Equipment, Member, Reservation, ReservationStatus, Announcement, GalleryItem, EquipmentStatus, AdminProfile, DarkroomSlot, DarkroomReservation, DarkroomStatus, Trip } from '../types';
import { INITIAL_EQUIPMENT, INITIAL_MEMBERS, INITIAL_RESERVATIONS, INITIAL_ANNOUNCEMENTS, INITIAL_GALLERY, INITIAL_ADMIN_PROFILES, DARKROOM_SLOTS, STANDARD_DARKROOM_TEMPLATES, INITIAL_DARKROOM_RESERVATIONS, INITIAL_TRIPS } from '../data/initialData';
import { checkTripBookingEligibility, resolveMemberTier } from '../utils/tripUtils';

// Local storage keys for seamless offline/demo functionality
const STORAGE_KEYS = {
  MEMBERS: 'ytufok_members_v13',
  EQUIPMENT: 'ytufok_equipment_v8',
  RESERVATIONS: 'ytufok_reservations_v8',
  ANNOUNCEMENTS: 'ytufok_announcements_v6',
  GALLERY: 'ytufok_gallery_v3',
  ADMIN_PROFILES: 'ytufok_admin_profiles_v8',
  ACTIVE_ADMIN_ID: 'ytufok_active_admin_id_v8',
  DARKROOM: 'ytufok_darkroom_v4',
  DARKROOM_SLOTS: 'ytufok_darkroom_slots_v4',
  TRIPS: 'ytufok_trips_v1'
};

// Initialize localStorage with initial data if empty
const getLocalData = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

export const api = {
  // ==========================================
  // 1. ÖĞRENCİ NUMARASI DOĞRULAMA (WHITELIST)
  // ==========================================
  async verifyStudentNumber(studentNumber: string): Promise<{
    success: boolean;
    member?: Member;
    message: string;
  }> {
    const cleanNumber = studentNumber.trim();
    if (!cleanNumber) {
      return { success: false, message: 'Lütfen öğrenci numaranızı giriniz.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('student_number', cleanNumber)
          .single();

        if (error || !data) {
          return {
            success: false,
            message: `"${cleanNumber}" numaralı öğrenci aktif kulüp üyesi listesinde (Whitelist) bulunamadı. Lütfen kulüp yönetimi ile iletişime geçiniz.`
          };
        }

        const member = data as Member;

        if (member.status === 'suspended') {
          return {
            success: false,
            member,
            message: `Rezervasyon yapamazsınız: Üyeliğiniz kısıtlanmıştır/cezalıdır. Gerekçe: ${member.penalty_reason || 'İade gecikmesi veya hasar.'}`
          };
        }

        if (member.status === 'passive') {
          return {
            success: false,
            member,
            message: 'Üyeliğiniz pasif durumdadır. Yeniden aktif etmek için kulüp odamıza uğrayınız.'
          };
        }

        return {
          success: true,
          member,
          message: `Hoş geldiniz, ${member.full_name} (${member.department}). Üyeliğiniz aktif.`
        };
      } catch (err) {
        console.warn('Supabase verification error, falling back to local store:', err);
      }
    }

    // Local / Offline Whitelist Check
    const members = getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const normalizedInput = cleanNumber.toLowerCase().replace(/[\s\.\-_]/g, '');

    const foundMember = members.find(m => {
      const normalizedTarget = m.student_number.toLowerCase().replace(/[\s\.\-_]/g, '');
      if (normalizedTarget === normalizedInput) return true;
      // Handle special aliases
      if ((normalizedInput === '2,50e+10' || normalizedInput === '2.50e+10' || normalizedInput === '25022018' || normalizedInput === '22052018') && 
          (m.full_name === 'Zeynep Kaya')) {
        return true;
      }
      if ((normalizedInput === 'g24100151017' || normalizedInput === '24000001') && 
          (m.full_name.includes('Hekimoğlu') || m.id === 'm-103')) {
        return true;
      }
      if ((normalizedInput === 'teknopark' || normalizedInput === '24000004') && 
          (m.full_name.includes('Aksoy') || m.id === 'm-49')) {
        return true;
      }
      if (normalizedInput === '02482721' && m.student_number === '2482721') {
        return true;
      }
      return false;
    });

    if (!foundMember) {
      return {
        success: false,
        message: `"${cleanNumber}" numaralı öğrenci kulüp üyesi listesinde (Whitelist) bulunamadı. Ekipman rezervasyonu yalnızca YTÜ Fotoğraf Kulübü üyelerine açıktır.`
      };
    }

    if (foundMember.status === 'suspended') {
      return {
        success: false,
        member: foundMember,
        message: `Rezervasyon yapamazsınız: Üyeliğiniz askıya alınmıştır. Ceza Puanı: ${foundMember.penalty_count}. Gerekçe: ${foundMember.penalty_reason || 'İade süresi ihlali.'}`
      };
    }

    if (foundMember.status === 'passive') {
      return {
        success: false,
        member: foundMember,
        message: 'Üyeliğiniz pasif durumdadır. Kulüp yönetimiyle görüşerek aktif ettiriniz.'
      };
    }

    return {
      success: true,
      member: foundMember,
      message: `Hoş geldiniz, ${foundMember.full_name} (${foundMember.department}). Üyeliğiniz aktif.`
    };
  },

  // ==========================================
  // 2. EKİPMAN İŞLEMLERİ (KAMERALAR & LENSLER)
  // ==========================================
  async getEquipment(): Promise<Equipment[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data) {
          return data as Equipment[];
        }
      } catch (err) {
        console.warn('Supabase getEquipment error, using fallback:', err);
      }
    }

    return getLocalData<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
  },

  async getEquipmentById(id: string): Promise<Equipment | null> {
    const list = await this.getEquipment();
    return list.find(e => e.id === id) || null;
  },

  async addEquipment(equipment: Omit<Equipment, 'id'>): Promise<Equipment> {
    const newEquipment: Equipment = {
      ...equipment,
      id: isSupabaseConfigured() ? crypto.randomUUID() : `e-${Date.now()}`
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('equipment')
          .insert([newEquipment])
          .select()
          .single();

        if (!error && data) {
          return data as Equipment;
        }
      } catch (err) {
        console.warn('Supabase addEquipment error:', err);
      }
    }

    const current = getLocalData<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    const updated = [newEquipment, ...current];
    setLocalData(STORAGE_KEYS.EQUIPMENT, updated);
    return newEquipment;
  },

  async updateEquipmentStatus(id: string, status: EquipmentStatus, conditionNotes?: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, unknown> = { status };
        if (conditionNotes) updatePayload.current_condition = conditionNotes;

        const { error } = await supabase
          .from('equipment')
          .update(updatePayload)
          .eq('id', id);

        if (!error) return true;
      } catch (err) {
        console.warn('Supabase updateEquipmentStatus error:', err);
      }
    }

    const current = getLocalData<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    const updated = current.map(e => {
      if (e.id === id) {
        return {
          ...e,
          status,
          current_condition: conditionNotes || e.current_condition
        };
      }
      return e;
    });
    setLocalData(STORAGE_KEYS.EQUIPMENT, updated);
    return true;
  },

  // ==========================================
  // 3. REZERVASYON İŞLEMLERİ & ADMIN ONAYI
  // ==========================================
  async createReservation(payload: {
    equipment_id: string;
    student_number: string;
    pickup_date: string;
    return_date: string;
    purpose: string;
    trip_id?: string;
    additional_notes?: string;
  }): Promise<{ success: boolean; reservation?: Reservation; message: string }> {
    // 1. Önce Whitelist Kontrolü Yap
    const verification = await this.verifyStudentNumber(payload.student_number);
    if (!verification.success || !verification.member) {
      return { success: false, message: verification.message };
    }

    const member = verification.member;
    const equipment = await this.getEquipmentById(payload.equipment_id);
    if (!equipment) {
      return { success: false, message: 'Seçilen ekipman bulunamadı.' };
    }

    if (equipment.status === 'maintenance') {
      return { success: false, message: 'Bu ekipman şu anda bakımda/serviste olduğu için rezerve edilemez.' };
    }

    // 2. Gezi veya Bireysel Çekim Kontrolü
    let trip: Trip | null = null;
    const memberTier = resolveMemberTier(member);

    if (payload.trip_id) {
      trip = await this.getTripById(payload.trip_id);
      if (!trip) {
        return { success: false, message: 'Seçilen gezi sistemde bulunamadı.' };
      }
      if (!trip.is_active) {
        return { success: false, message: 'Bu gezi şu anda aktif değildir veya rezervasyona kapatılmıştır.' };
      }

      const eligibility = checkTripBookingEligibility(trip.start_date, memberTier);

      if (!eligibility.isOpen) {
        const tierLabel = memberTier === 'active' || memberTier === 'honorary_active' ? 'Aktif kulüp üyeleri' : 'Normal ve Fahri üyeler';
        return {
          success: false,
          message: `${trip.title} için ${tierLabel} geziden en erken ${eligibility.daysBeforeAllowed} gün önce rezervasyon yapabilir. Rezervasyon açılış tarihi: ${eligibility.openDate} (${eligibility.daysUntilOpen} gün sonra).`
        };
      }
    } else {
      // Bireysel çekim rezervasyonu yalnızca aktif ve fahri aktif üyelere özeldir
      if (memberTier !== 'active' && memberTier !== 'honorary_active') {
        return {
          success: false,
          message: 'Bireysel ekipman rezervasyonu kulüp kuralları gereğince yalnızca YTÜFOK Aktif ve Fahri Aktif Üyelerine açıktır. Normal ve Fahri üyelerimiz ekipman rezervasyonunu Kulüp Gezileri için (geziden 3 gün önce) yapabilir.'
        };
      }
    }

    // Rezervasyon takip kodu oluştur
    const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = `YTU-2026-${codeSuffix}`;

    const newReservation: Reservation = {
      id: isSupabaseConfigured() ? crypto.randomUUID() : `r-${Date.now()}`,
      reservation_code,
      equipment_id: payload.equipment_id,
      member_id: member.id,
      student_number: member.student_number,
      pickup_date: payload.pickup_date,
      return_date: payload.return_date,
      purpose: payload.purpose,
      trip_id: payload.trip_id || null,
      additional_notes: payload.additional_notes || null,
      status: 'pending', // KRİTİK İŞ MANTIĞI: İlk talep "Onay Bekliyor" statüsünde düşer
      created_at: new Date().toISOString(),
      equipment,
      member,
      trip: trip || null
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .insert([{
            id: newReservation.id,
            reservation_code: newReservation.reservation_code,
            equipment_id: newReservation.equipment_id,
            member_id: newReservation.member_id,
            student_number: newReservation.student_number,
            pickup_date: newReservation.pickup_date,
            return_date: newReservation.return_date,
            purpose: newReservation.purpose,
            additional_notes: newReservation.additional_notes,
            status: 'pending'
          }])
          .select()
          .single();

        if (!error && data) {
          return {
            success: true,
            reservation: { ...newReservation, ...data },
            message: `Rezervasyon talebiniz başarıyla oluşturuldu! Takip Kodunuz: ${reservation_code}. Kulüp yönetimi onayından sonra e-posta ve panel üzerinden bilgilendirileceksiniz.`
          };
        }
      } catch (err) {
        console.warn('Supabase createReservation error, saving locally:', err);
      }
    }

    const currentReservations = getLocalData<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
    const updatedReservations = [newReservation, ...currentReservations];
    setLocalData(STORAGE_KEYS.RESERVATIONS, updatedReservations);

    return {
      success: true,
      reservation: newReservation,
      message: `Rezervasyon talebiniz başarıyla oluşturuldu! Takip Kodunuz: ${reservation_code}. Talebiniz kulüp yönetimine "Onay Bekliyor" olarak iletildi.`
    };
  },

  async getReservations(): Promise<Reservation[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            equipment:equipment_id (*),
            member:member_id (*)
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as Reservation[];
        }
      } catch (err) {
        console.warn('Supabase getReservations error, falling back:', err);
      }
    }

    // Populate relations locally
    const reservations = getLocalData<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
    const equipmentList = getLocalData<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    const memberList = getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const trips = getLocalData<Trip[]>(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);

    return reservations.map(r => ({
      ...r,
      equipment: r.equipment || equipmentList.find(e => e.id === r.equipment_id),
      member: r.member || memberList.find(m => m.id === r.member_id || m.student_number === r.student_number),
      trip: r.trip || (r.trip_id ? trips.find(t => t.id === r.trip_id) : null)
    }));
  },

  async updateReservationStatus(
    id: string,
    newStatus: ReservationStatus,
    options?: {
      approved_by?: string;
      checked_out_by?: string;
      returned_to?: string;
      rejection_reason?: string;
      return_condition_notes?: string;
    }
  ): Promise<boolean> {
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        const updates: Record<string, unknown> = {
          status: newStatus,
          updated_at: nowIso
        };

        if (newStatus === 'approved') {
          updates.approved_by = options?.approved_by || 'Yönetim Kurulu';
          updates.approved_at = nowIso;
        } else if (newStatus === 'in_use') {
          updates.checked_out_at = nowIso;
          if (options?.checked_out_by) updates.checked_out_by = options.checked_out_by;
        } else if (newStatus === 'returned') {
          updates.returned_at = nowIso;
          if (options?.returned_to) updates.returned_to = options.returned_to;
          if (options?.return_condition_notes) {
            updates.return_condition_notes = options.return_condition_notes;
          }
        } else if (newStatus === 'rejected') {
          updates.rejection_reason = options?.rejection_reason || 'Tarih çakışması veya kulüp etkinliği.';
          if (options?.approved_by) updates.approved_by = options.approved_by;
        }

        const { error } = await supabase
          .from('reservations')
          .update(updates)
          .eq('id', id);

        if (!error) return true;
      } catch (err) {
        console.warn('Supabase updateReservationStatus error:', err);
      }
    }

    // Local Storage update + Equipment status synchronization
    const reservations = getLocalData<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
    const target = reservations.find(r => r.id === id);

    if (!target) return false;

    const updatedReservations = reservations.map(r => {
      if (r.id === id) {
        const updated: Reservation = {
          ...r,
          status: newStatus,
          updated_at: nowIso
        };

        if (newStatus === 'approved') {
          updated.approved_by = options?.approved_by || 'Yönetim Kurulu';
          updated.approved_at = nowIso;
        } else if (newStatus === 'in_use') {
          updated.checked_out_at = nowIso;
          if (options?.checked_out_by) updated.checked_out_by = options.checked_out_by;
        } else if (newStatus === 'returned') {
          updated.returned_at = nowIso;
          if (options?.returned_to) updated.returned_to = options.returned_to;
          updated.return_condition_notes = options?.return_condition_notes || 'Eksiksiz ve hasarsız teslim alındı.';
        } else if (newStatus === 'rejected') {
          updated.rejection_reason = options?.rejection_reason || 'Kulüp etkinliği nedeniyle reddedildi.';
          if (options?.approved_by) updated.approved_by = options.approved_by;
        }

        return updated;
      }
      return r;
    });

    setLocalData(STORAGE_KEYS.RESERVATIONS, updatedReservations);

    // Sync equipment status
    let targetEquipStatus: EquipmentStatus = 'available';
    if (newStatus === 'approved') targetEquipStatus = 'reserved';
    else if (newStatus === 'in_use' || newStatus === 'overdue') targetEquipStatus = 'in_use';
    else if (newStatus === 'returned' || newStatus === 'rejected' || newStatus === 'cancelled') targetEquipStatus = 'available';

    await this.updateEquipmentStatus(
      target.equipment_id,
      targetEquipStatus,
      newStatus === 'returned' ? options?.return_condition_notes : undefined
    );

    return true;
  },

  // ==========================================
  // YÖNETİM KURULU PROFİLLERİ (ADMIN ACCOUNTS)
  // ==========================================
  async getAdminProfiles(): Promise<AdminProfile[]> {
    return getLocalData<AdminProfile[]>(STORAGE_KEYS.ADMIN_PROFILES, INITIAL_ADMIN_PROFILES);
  },

  async getActiveAdmin(): Promise<AdminProfile | null> {
    const profiles = await this.getAdminProfiles();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ADMIN_ID);
    if (!activeId) return null;
    return profiles.find(p => p.id === activeId) || null;
  },

  async setActiveAdmin(adminId: string | null): Promise<void> {
    if (!adminId) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ADMIN_ID);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ADMIN_ID, adminId);
    }
  },

  async updateAdminPin(
    adminId: string, 
    currentPin: string, 
    newPin: string
  ): Promise<{ success: boolean; message: string; updatedProfile?: AdminProfile }> {
    const cleanCurrent = currentPin.trim();
    const cleanNew = newPin.trim();

    if (!cleanNew) {
      return { success: false, message: 'Yeni şifre boş bırakılamaz.' };
    }
    if (cleanNew.length < 4) {
      return { success: false, message: 'Yeni şifre en az 4 karakter olmalıdır.' };
    }

    const profiles = await this.getAdminProfiles();
    const targetIndex = profiles.findIndex(p => p.id === adminId);
    if (targetIndex === -1) {
      return { success: false, message: 'Yönetici profili bulunamadı.' };
    }

    const currentProfile = profiles[targetIndex];
    const expectedPin = currentProfile.pin || '1911';

    if (cleanCurrent !== expectedPin) {
      return { success: false, message: 'Mevcut şifrenizi hatalı girdiniz.' };
    }

    const updatedProfile: AdminProfile = {
      ...currentProfile,
      pin: cleanNew
    };

    profiles[targetIndex] = updatedProfile;
    setLocalData(STORAGE_KEYS.ADMIN_PROFILES, profiles);

    return { 
      success: true, 
      message: `${updatedProfile.full_name} için şifre başarıyla güncellendi.`,
      updatedProfile 
    };
  },

  // ==========================================
  // 4. ÜYE YÖNETİMİ & WHITELIST (ADMIN)
  // ==========================================
  async getMembers(): Promise<Member[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('full_name', { ascending: true });

        if (!error && data) {
          return data as Member[];
        }
      } catch (err) {
        console.warn('Supabase getMembers error:', err);
      }
    }

    return getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  },

  async addMember(member: Omit<Member, 'id'>): Promise<Member> {
    const newMember: Member = {
      ...member,
      id: isSupabaseConfigured() ? crypto.randomUUID() : `m-${Date.now()}`
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('members')
          .insert([newMember])
          .select()
          .single();

        if (!error && data) return data as Member;
      } catch (err) {
        console.warn('Supabase addMember error:', err);
      }
    }

    const current = getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const updated = [newMember, ...current];
    setLocalData(STORAGE_KEYS.MEMBERS, updated);
    return newMember;
  },

  async updateMemberPenalty(memberId: string, penaltyCount: number, reason: string): Promise<boolean> {
    const newStatus = penaltyCount >= 2 ? 'suspended' : 'active';

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('members')
          .update({
            penalty_count: penaltyCount,
            penalty_reason: reason,
            status: newStatus
          })
          .eq('id', memberId);

        if (!error) return true;
      } catch (err) {
        console.warn('Supabase updateMemberPenalty error:', err);
      }
    }

    const current = getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const updated = current.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          penalty_count: penaltyCount,
          penalty_reason: reason,
          status: newStatus as any
        };
      }
      return m;
    });

    setLocalData(STORAGE_KEYS.MEMBERS, updated);
    return true;
  },

  // ==========================================
  // 5. DUYURULAR VE GALERİ
  // ==========================================
  async getAnnouncements(): Promise<Announcement[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) return data as Announcement[];
      } catch (err) {
        console.warn('Supabase getAnnouncements error:', err);
      }
    }

    return getLocalData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  },

  async getGallery(): Promise<GalleryItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('gallery_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) return data as GalleryItem[];
      } catch (err) {
        console.warn('Supabase getGallery error:', err);
      }
    }

    return getLocalData<GalleryItem[]>(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
  },

  // ==========================================
  // 6. KARANLIK ODA (DARKROOM) İŞLEMLERİ
  // ==========================================
  async getDarkroomSlots(): Promise<DarkroomSlot[]> {
    return getLocalData<DarkroomSlot[]>(STORAGE_KEYS.DARKROOM_SLOTS, DARKROOM_SLOTS);
  },

  async getDarkroomSlotsByDate(date: string): Promise<DarkroomSlot[]> {
    const all = await this.getDarkroomSlots();
    return all.filter(s => s.date === date && s.is_active !== false);
  },

  getStandardDarkroomTemplates() {
    return STANDARD_DARKROOM_TEMPLATES;
  },

  async createDarkroomSlot(slot: Omit<DarkroomSlot, 'id'>): Promise<DarkroomSlot> {
    const current = getLocalData<DarkroomSlot[]>(STORAGE_KEYS.DARKROOM_SLOTS, DARKROOM_SLOTS);
    const uniqueId = `dslot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newSlot: DarkroomSlot = {
      ...slot,
      id: uniqueId,
      is_active: slot.is_active !== undefined ? slot.is_active : true,
      created_at: new Date().toISOString()
    };
    const updated = [newSlot, ...current];
    setLocalData(STORAGE_KEYS.DARKROOM_SLOTS, updated);
    return newSlot;
  },

  async createBulkDarkroomSlots(slots: Array<Omit<DarkroomSlot, 'id'>>): Promise<DarkroomSlot[]> {
    const current = getLocalData<DarkroomSlot[]>(STORAGE_KEYS.DARKROOM_SLOTS, DARKROOM_SLOTS);
    const createdNow = new Date().toISOString();
    const newSlots: DarkroomSlot[] = slots.map((s, idx) => ({
      ...s,
      id: `dslot-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      is_active: s.is_active !== undefined ? s.is_active : true,
      created_at: createdNow
    }));
    const updated = [...newSlots, ...current];
    setLocalData(STORAGE_KEYS.DARKROOM_SLOTS, updated);
    return newSlots;
  },

  async deleteDarkroomSlot(id: string): Promise<boolean> {
    const current = getLocalData<DarkroomSlot[]>(STORAGE_KEYS.DARKROOM_SLOTS, DARKROOM_SLOTS);
    const updated = current.filter(s => s.id !== id);
    setLocalData(STORAGE_KEYS.DARKROOM_SLOTS, updated);
    return true;
  },

  async toggleDarkroomSlot(id: string, is_active: boolean): Promise<boolean> {
    const current = getLocalData<DarkroomSlot[]>(STORAGE_KEYS.DARKROOM_SLOTS, DARKROOM_SLOTS);
    const updated = current.map(s => s.id === id ? { ...s, is_active } : s);
    setLocalData(STORAGE_KEYS.DARKROOM_SLOTS, updated);
    return true;
  },

  async getDarkroomReservations(): Promise<DarkroomReservation[]> {
    const reservations = getLocalData<DarkroomReservation[]>(STORAGE_KEYS.DARKROOM, INITIAL_DARKROOM_RESERVATIONS);
    const members = getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    return reservations.map(r => ({
      ...r,
      member: members.find(m => m.id === r.member_id || m.student_number === r.student_number)
    }));
  },

  async getDarkroomReservationsByDate(date: string): Promise<DarkroomReservation[]> {
    const all = await this.getDarkroomReservations();
    return all.filter(r => r.date === date && r.status !== 'cancelled' && r.status !== 'rejected');
  },

  async createDarkroomReservation(data: Omit<DarkroomReservation, 'id' | 'reservation_code' | 'created_at' | 'status'> & { status?: DarkroomStatus }): Promise<DarkroomReservation> {
    const current = getLocalData<DarkroomReservation[]>(STORAGE_KEYS.DARKROOM, INITIAL_DARKROOM_RESERVATIONS);
    
    // Check if slot on that date is already booked and active
    const isSlotTaken = current.some(r => 
      r.date === data.date && 
      r.slot_id === data.slot_id && 
      (r.status === 'approved' || r.status === 'pending' || r.status === 'completed')
    );

    if (isSlotTaken) {
      throw new Error('Seçtiğiniz tarih ve seans saati maalesef az önce başka bir üye tarafından rezerve edildi. Lütfen başka bir seans seçiniz.');
    }

    // Kural: Film yıkama ve kağıda fotoğraf baskısı aynı güne alınamaz!
    if (data.process_type === 'bw_film' || data.process_type === 'photo_print') {
      const opposingType = data.process_type === 'bw_film' ? 'photo_print' : 'bw_film';
      const hasConflict = current.some(r => 
        (r.student_number === data.student_number || r.member_id === data.member_id) &&
        r.date === data.date &&
        r.process_type === opposingType &&
        r.status !== 'cancelled' && r.status !== 'rejected'
      );

      if (hasConflict) {
        throw new Error('Film yıkama ve kağıda fotoğraf baskısı aynı güne alınamaz. Banyonun kuruması ve laboratuvar düzeni gereği baskı için lütfen farklı bir gün seçiniz.');
      }
    }

    const uniqueId = `ko-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const randomCodeSuffix = Math.floor(100 + Math.random() * 900);
    const newReservation: DarkroomReservation = {
      ...data,
      id: uniqueId,
      reservation_code: `KO-2026-${randomCodeSuffix}`,
      status: data.status || 'pending',
      created_at: new Date().toISOString()
    };

    const updated = [newReservation, ...current];
    setLocalData(STORAGE_KEYS.DARKROOM, updated);

    const members = getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    return {
      ...newReservation,
      member: members.find(m => m.id === newReservation.member_id || m.student_number === newReservation.student_number)
    };
  },

  async updateDarkroomReservationStatus(
    id: string,
    status: DarkroomStatus,
    meta?: {
      approved_by?: string;
      rejection_reason?: string;
      supervisor?: string;
    }
  ): Promise<boolean> {
    const current = getLocalData<DarkroomReservation[]>(STORAGE_KEYS.DARKROOM, INITIAL_DARKROOM_RESERVATIONS);
    const updated = current.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          approved_by: meta?.approved_by !== undefined ? meta.approved_by : r.approved_by,
          approved_at: status === 'approved' ? new Date().toISOString() : r.approved_at,
          rejection_reason: meta?.rejection_reason !== undefined ? meta.rejection_reason : r.rejection_reason,
          supervisor: meta?.supervisor !== undefined ? meta.supervisor : (meta?.approved_by || r.supervisor)
        };
      }
      return r;
    });

    setLocalData(STORAGE_KEYS.DARKROOM, updated);
    return true;
  },

  async deleteDarkroomReservation(id: string): Promise<boolean> {
    const current = getLocalData<DarkroomReservation[]>(STORAGE_KEYS.DARKROOM, INITIAL_DARKROOM_RESERVATIONS);
    const updated = current.filter(r => r.id !== id);
    setLocalData(STORAGE_KEYS.DARKROOM, updated);
    return true;
  },

  // ==========================================
  // 6. KULÜP GEZİLERİ (TRIPS) YÖNETİMİ
  // Aktif üyeler geziden 5 gün önce, normal üyeler 3 gün önce rezerve edebilir
  // ==========================================
  async getTrips(): Promise<Trip[]> {
    const trips = getLocalData<Trip[]>(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    return trips.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  },

  async getActiveTrips(): Promise<Trip[]> {
    const trips = await this.getTrips();
    return trips.filter(t => t.is_active);
  },

  async getTripById(id: string): Promise<Trip | null> {
    const trips = await this.getTrips();
    return trips.find(t => t.id === id) || null;
  },

  async createTrip(tripData: Omit<Trip, 'id' | 'created_at'>): Promise<Trip> {
    const newTrip: Trip = {
      ...tripData,
      id: `trip-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    const current = getLocalData<Trip[]>(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    const updated = [newTrip, ...current];
    setLocalData(STORAGE_KEYS.TRIPS, updated);
    return newTrip;
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<boolean> {
    const current = getLocalData<Trip[]>(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    const updated = current.map(t => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      return t;
    });
    setLocalData(STORAGE_KEYS.TRIPS, updated);
    return true;
  },

  async deleteTrip(id: string): Promise<boolean> {
    const current = getLocalData<Trip[]>(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    const updated = current.filter(t => t.id !== id);
    setLocalData(STORAGE_KEYS.TRIPS, updated);
    return true;
  },

  // ==========================================
  // 7. ÜYE STATÜSÜ (AKTİF / NORMAL ÜYE) İŞLEMLERİ
  // ==========================================
  async updateMemberType(id: string, memberType: 'active' | 'normal' | 'honorary' | 'honorary_active'): Promise<boolean> {
    const members = getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const updated = members.map(m => {
      if (m.id === id) {
        return {
          ...m,
          member_type: memberType,
          notes: memberType === 'honorary_active'
            ? 'YTÜFOK Fahri Aktif Üyesi (Aktif Öncelik: Gezilerden 5 gün önce & Bireysel Çekim)'
            : memberType === 'honorary'
            ? 'YTÜFOK Fahri Üyesi (Normal Öncelik: Gezilerden 3 gün önce)'
            : memberType === 'active' 
            ? 'YTÜFOK Aktif Üyesi (Aktif Öncelik: Gezilerden 5 gün önce)' 
            : 'Normal Kulüp Üyesi (Normal Öncelik: Gezilerden 3 gün önce)'
        };
      }
      return m;
    });
    setLocalData(STORAGE_KEYS.MEMBERS, updated);
    return true;
  },

  async quickRegisterNormalMember(studentNumber: string, fullName: string, department: string): Promise<{ success: boolean; member?: Member; message: string }> {
    const cleanNumber = studentNumber.trim();
    const cleanName = fullName.trim();
    const cleanDept = department.trim() || 'Yıldız Teknik Üniversitesi';

    if (!cleanNumber || !cleanName) {
      return { success: false, message: 'Lütfen öğrenci numarası ve ad-soyad alanlarını doldurunuz.' };
    }

    const members = getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const existing = members.find(m => m.student_number.toLowerCase().replace(/[\s\.\-_]/g, '') === cleanNumber.toLowerCase().replace(/[\s\.\-_]/g, ''));
    if (existing) {
      return { success: true, member: existing, message: `Öğrenci zaten kayıtlı: ${existing.full_name}` };
    }

    const newMember: Member = {
      id: `m-norm-${Date.now()}`,
      student_number: cleanNumber,
      full_name: cleanName,
      email: `${cleanNumber}@std.yildiz.edu.tr`,
      phone: '+90 5XX XXX XX XX',
      department: cleanDept,
      status: 'active',
      member_type: 'normal',
      penalty_count: 0,
      role: 'member',
      notes: 'Normal Kulüp Üyesi (Gezilerden 3 gün önce rezervasyon)',
      created_at: new Date().toISOString()
    };

    const updated = [newMember, ...members];
    setLocalData(STORAGE_KEYS.MEMBERS, updated);
    return { success: true, member: newMember, message: `Normal üye kaydınız başarıyla oluşturuldu: ${cleanName}` };
  }
};
