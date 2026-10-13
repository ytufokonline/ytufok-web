import { supabase, isSupabaseConfigured } from './supabase';
import {
  Equipment,
  Member,
  Reservation,
  Announcement,
  GalleryItem,
  EquipmentStatus,
  AdminProfile,
  DarkroomSlot,
  DarkroomReservation,
  DarkroomSlotTemplate,
  Trip,
  MemberType
} from '../types';
import {
  INITIAL_EQUIPMENT,
  INITIAL_MEMBERS,
  INITIAL_RESERVATIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_GALLERY,
  INITIAL_ADMIN_PROFILES,
  DARKROOM_SLOTS,
  STANDARD_DARKROOM_TEMPLATES,
  INITIAL_DARKROOM_RESERVATIONS,
  INITIAL_TRIPS
} from '../data/initialData';
import { checkTripBookingEligibility, resolveMemberTier } from '../utils/tripUtils';

// Aktif yönetici oturumu (Yalnızca tarayıcı sekmesi bazlı oturum kimliği)
let activeSessionAdminId: string | null = null;
try {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    activeSessionAdminId = window.sessionStorage.getItem('ytufok_session_admin_id');
  }
} catch {
  // ignore
}

// Üye unvan ve denetim kurulu normalizasyonu
function normalizeMemberRecord(m: Member): Member {
  if (m.student_number === '23023616' || m.id === 'm-isil') {
    return {
      ...m,
      full_name: 'Işıl Tınmaz',
      role: 'audit',
      member_type: 'audit',
      notes: 'Denetim Kurulu Üyesi'
    };
  }
  if (m.student_number === '23084501' || m.id === 'm-dk-ilyas') {
    return {
      ...m,
      full_name: 'İlyas Güner',
      role: 'audit',
      member_type: 'audit',
      notes: 'Denetim Kurulu Üyesi'
    };
  }
  if (m.role === 'admin' || m.role === 'board') {
    return { ...m, member_type: 'board' };
  }
  if (m.role === 'audit') {
    return { ...m, member_type: 'audit' };
  }
  return m;
}

// Lens paket içeriklerinden parasoleyi arındırma filtresi
function sanitizeEquipmentItem(item: Equipment): Equipment {
  if (item.category === 'lens') {
    let desc = item.description || '';
    if (desc.toLowerCase().includes('parasol')) {
      desc = desc.replace(/,?\s*parasoley[i|ı|ü|u]?\s*,?/gi, '').replace(/\s+/g, ' ').trim();
    }
    const contents = Array.isArray(item.package_contents)
      ? item.package_contents.filter((c) => !c.toLowerCase().includes('parasol'))
      : [];
    return {
      ...item,
      description: desc,
      package_contents: contents
    };
  }
  return item;
}

// Rezervasyon ilişkisel nesnelerini Supabase tablosuna yazmadan önce temizleme
const stripReservationRelations = (r: Reservation): Record<string, any> => {
  const { equipment, member, trip, ...clean } = r;
  return clean;
};

// Sıfır gecikmeli ilk ekran çizimi için varsayılan başlangıç durumu
const defaultInitialState = {
  equipmentList: INITIAL_EQUIPMENT.map(sanitizeEquipmentItem),
  members: INITIAL_MEMBERS.map(normalizeMemberRecord),
  trips: INITIAL_TRIPS,
  activeTrips: INITIAL_TRIPS.filter((t) => t.is_active),
  reservations: INITIAL_RESERVATIONS,
  adminProfiles: INITIAL_ADMIN_PROFILES,
  activeAdmin: INITIAL_ADMIN_PROFILES[0] || null,
  darkroomSlots: DARKROOM_SLOTS,
  darkroomReservations: INITIAL_DARKROOM_RESERVATIONS,
  announcements: INITIAL_ANNOUNCEMENTS,
  gallery: INITIAL_GALLERY
};

export const api = {
  // Anında (0ms) senkron başlangıç verisi (İlk React render için)
  getInitialSyncState() {
    return defaultInitialState;
  },

  // ==========================================
  // 1. TOPLU PANO VERİSİ (SUPABASE CLOUD BUNDLE)
  // ==========================================
  async getDashboardBundle(_forceFresh = false) {
    if (!isSupabaseConfigured()) {
      return defaultInitialState;
    }

    try {
      const [
        eqRes,
        memRes,
        resRes,
        tripRes,
        annRes,
        darkSlotRes,
        darkResRes,
        adminRes
      ] = await Promise.allSettled([
        supabase.from('equipment').select('*').order('name', { ascending: true }),
        supabase.from('members').select('*').order('full_name', { ascending: true }),
        supabase.from('reservations').select('*').order('created_at', { ascending: false }),
        supabase.from('trips').select('*').order('start_date', { ascending: true }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('darkroom_slots').select('*').order('date', { ascending: true }),
        supabase.from('darkroom_reservations').select('*').order('created_at', { ascending: false }),
        supabase.from('admin_profiles').select('*')
      ]);

      const baseBySerial = new Map<string, Equipment>();
      const baseById = new Map<string, Equipment>();
      INITIAL_EQUIPMENT.forEach((e) => {
        if (e.serial_number) baseBySerial.set(e.serial_number, e);
        baseById.set(e.id, e);
      });

      // 1. Equipment
      let equipmentList: Equipment[] = defaultInitialState.equipmentList;
      if (
        eqRes.status === 'fulfilled' &&
        !eqRes.value.error &&
        Array.isArray(eqRes.value.data) &&
        eqRes.value.data.length > 0
      ) {
        equipmentList = eqRes.value.data.map((row: any) => {
          const base = (row.serial_number && baseBySerial.get(row.serial_number)) || baseById.get(row.id);
          return sanitizeEquipmentItem({
            id: String(row.id),
            name: row.name || base?.name || 'Ekipman',
            category: row.category || base?.category || 'accessory',
            brand: row.brand || base?.brand || '',
            model: row.model || base?.model || '',
            serial_number: row.serial_number || base?.serial_number || '',
            description: row.description ?? base?.description ?? '',
            specs: row.specs || base?.specs || {},
            package_contents: Array.isArray(row.package_contents)
              ? row.package_contents
              : (base?.package_contents || []),
            image_url: row.image_url || base?.image_url || '',
            status: row.status || base?.status || 'available',
            current_condition: row.current_condition || base?.current_condition || 'değerlendirilecek'
          });
        });
      }

      // Fast O(1) Equipment Lookup Map
      const equipById = new Map<string, Equipment>();
      equipmentList.forEach((e) => {
        equipById.set(e.id, e);
        if (e.serial_number) {
          equipById.set(e.serial_number, e);
          const initMatch = INITIAL_EQUIPMENT.find((ie) => ie.serial_number === e.serial_number);
          if (initMatch) {
            equipById.set(initMatch.id, e);
          }
        }
      });

      // 2. Members
      let members: Member[] = defaultInitialState.members;
      if (
        memRes.status === 'fulfilled' &&
        !memRes.value.error &&
        Array.isArray(memRes.value.data) &&
        memRes.value.data.length > 0
      ) {
        members = memRes.value.data.map((m: any) => normalizeMemberRecord(m));
      }
      const memberById = new Map<string, Member>();
      const memberByNo = new Map<string, Member>();
      members.forEach((m) => {
        memberById.set(m.id, m);
        memberByNo.set(m.student_number, m);
      });

      // 3. Trips
      let trips: Trip[] = defaultInitialState.trips;
      if (
        tripRes.status === 'fulfilled' &&
        !tripRes.value.error &&
        Array.isArray(tripRes.value.data) &&
        tripRes.value.data.length > 0
      ) {
        trips = (tripRes.value.data as Trip[]).sort(
          (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
      }
      const tripById = new Map<string, Trip>();
      trips.forEach((t) => tripById.set(t.id, t));

      // 4. Reservations
      let reservations: Reservation[] = defaultInitialState.reservations;
      if (
        resRes.status === 'fulfilled' &&
        !resRes.value.error &&
        Array.isArray(resRes.value.data) &&
        resRes.value.data.length > 0
      ) {
        reservations = resRes.value.data.map((r: any) => ({
          ...r,
          equipment: equipById.get(r.equipment_id),
          member: memberById.get(r.member_id) || memberByNo.get(r.student_number),
          trip: r.trip_id ? tripById.get(r.trip_id) || null : null
        }));
      }

      // 5. Announcements
      let announcements: Announcement[] = defaultInitialState.announcements;
      if (
        annRes.status === 'fulfilled' &&
        !annRes.value.error &&
        Array.isArray(annRes.value.data) &&
        annRes.value.data.length > 0
      ) {
        announcements = (annRes.value.data as Announcement[]).sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }

      // 6. Admin Profiles & PINs
      let adminProfiles: AdminProfile[] = INITIAL_ADMIN_PROFILES;
      if (
        adminRes.status === 'fulfilled' &&
        !adminRes.value.error &&
        Array.isArray(adminRes.value.data) &&
        adminRes.value.data.length > 0
      ) {
        const pinMap = new Map(adminRes.value.data.map((r: any) => [r.id, r]));
        adminProfiles = INITIAL_ADMIN_PROFILES.map((def) => {
          const match = pinMap.get(def.id);
          return match ? { ...def, pin: match.pin || def.pin, pin_updated_at: match.pin_updated_at } : def;
        });
      }
      const activeAdmin = activeSessionAdminId
        ? adminProfiles.find((p) => p.id === activeSessionAdminId) || null
        : null;

      // 7. Darkroom Slots
      let darkroomSlots: DarkroomSlot[] = defaultInitialState.darkroomSlots;
      if (
        darkSlotRes.status === 'fulfilled' &&
        !darkSlotRes.value.error &&
        Array.isArray(darkSlotRes.value.data) &&
        darkSlotRes.value.data.length > 0
      ) {
        darkroomSlots = darkSlotRes.value.data as DarkroomSlot[];
      }

      // 8. Darkroom Reservations
      let darkroomReservations: DarkroomReservation[] = defaultInitialState.darkroomReservations;
      if (
        darkResRes.status === 'fulfilled' &&
        !darkResRes.value.error &&
        Array.isArray(darkResRes.value.data) &&
        darkResRes.value.data.length > 0
      ) {
        darkroomReservations = darkResRes.value.data.map((r: any) => ({
          ...r,
          member: memberById.get(r.member_id) || memberByNo.get(r.student_number)
        }));
      }

      return {
        equipmentList,
        members,
        trips,
        activeTrips: trips.filter((t) => t.is_active),
        reservations,
        adminProfiles,
        activeAdmin,
        darkroomSlots,
        darkroomReservations,
        announcements,
        gallery: INITIAL_GALLERY
      };
    } catch (err) {
      console.error('Supabase getDashboardBundle hatası:', err);
      return defaultInitialState;
    }
  },

  // Bekleyen rezervasyon sayısı sorgusu
  async getPendingCount(): Promise<number> {
    if (isSupabaseConfigured()) {
      try {
        const { count, error } = await supabase
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (!error && typeof count === 'number') return count;
      } catch (err) {
        console.warn('Supabase getPendingCount error:', err);
      }
    }
    return defaultInitialState.reservations.filter((r) => r.status === 'pending').length;
  },

  // ==========================================
  // 2. ÖĞRENCİ NUMARASI DOĞRULAMA (WHITELIST)
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
          .maybeSingle();

        if (!error && data) {
          const member = normalizeMemberRecord(data as Member);
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
        }
      } catch (err) {
        console.warn('Supabase verification error:', err);
      }
    }

    const members = await this.getMembers();
    const normalizedInput = cleanNumber.toLowerCase().replace(/[\s\.\-_]/g, '');
    const foundMember = members.find((m) => {
      const normalizedTarget = m.student_number.toLowerCase().replace(/[\s\.\-_]/g, '');
      return normalizedTarget === normalizedInput;
    });

    if (!foundMember) {
      return {
        success: false,
        message: 'Bu öğrenci numarası aktif kulüp üyesi whitelist listesinde bulunamadı.'
      };
    }

    return {
      success: true,
      member: foundMember,
      message: `Hoş geldiniz, ${foundMember.full_name} (${foundMember.department}). Üyeliğiniz aktif.`
    };
  },

  // ==========================================
  // 3. EKİPMAN CRUD İŞLEMLERİ (SUPABASE EQUIPMENT)
  // ==========================================
  async getEquipment(): Promise<Equipment[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const baseBySerial = new Map<string, Equipment>();
          const baseById = new Map<string, Equipment>();
          INITIAL_EQUIPMENT.forEach((e) => {
            if (e.serial_number) baseBySerial.set(e.serial_number, e);
            baseById.set(e.id, e);
          });

          return (data as any[]).map((row) => {
            const base = (row.serial_number && baseBySerial.get(row.serial_number)) || baseById.get(row.id);
            return sanitizeEquipmentItem({
              id: String(row.id),
              name: row.name || base?.name || 'Ekipman',
              category: row.category || base?.category || 'accessory',
              brand: row.brand || base?.brand || '',
              model: row.model || base?.model || '',
              serial_number: row.serial_number || base?.serial_number || '',
              description: row.description ?? base?.description ?? '',
              specs: row.specs || base?.specs || {},
              package_contents: Array.isArray(row.package_contents)
                ? row.package_contents
                : (base?.package_contents || []),
              image_url: row.image_url || base?.image_url || '',
              status: row.status || base?.status || 'available',
              current_condition: row.current_condition || base?.current_condition || 'değerlendirilecek'
            });
          });
        }
      } catch (err) {
        console.warn('Supabase getEquipment error:', err);
      }
    }

    const bundle = await this.getDashboardBundle();
    return bundle.equipmentList;
  },

  async getEquipmentById(id: string): Promise<Equipment | null> {
    const list = await this.getEquipment();
    return list.find((e) => e.id === id || e.serial_number === id) || null;
  },

  async addEquipment(equipment: Omit<Equipment, 'id'>): Promise<Equipment> {
    const newId = crypto.randomUUID();
    const insertPayload = {
      id: newId,
      name: equipment.name,
      category: equipment.category,
      brand: equipment.brand,
      model: equipment.model,
      serial_number: equipment.serial_number,
      description: equipment.description || '',
      specs: equipment.specs || {},
      package_contents: Array.isArray(equipment.package_contents)
        ? equipment.package_contents.filter((c) => !c.toLowerCase().includes('parasol'))
        : [],
      image_url: equipment.image_url || '',
      status: equipment.status || 'available',
      current_condition: equipment.current_condition || 'değerlendirilecek'
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('equipment')
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase ekipman ekleme hatası: ${error.message}`);
      }
      return sanitizeEquipmentItem(data as Equipment);
    }

    return sanitizeEquipmentItem({ ...insertPayload });
  },

  async updateEquipment(
    id: string,
    updates: Partial<Equipment>
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase yapılandırılmamış, değişiklikler kalıcı olarak kaydedilemiyor.');
      return false;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let targetId: string | null = null;

    if (isUuid) {
      const { data } = await supabase.from('equipment').select('id').eq('id', id).maybeSingle();
      if (data?.id) targetId = data.id;
    }

    if (!targetId && updates.serial_number) {
      const { data } = await supabase.from('equipment').select('id').eq('serial_number', updates.serial_number).maybeSingle();
      if (data?.id) targetId = data.id;
    }

    if (!targetId) {
      const { data } = await supabase.from('equipment').select('id').eq('serial_number', id).maybeSingle();
      if (data?.id) targetId = data.id;
    }

    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.brand !== undefined) payload.brand = updates.brand;
    if (updates.model !== undefined) payload.model = updates.model;
    if (updates.serial_number !== undefined) payload.serial_number = updates.serial_number;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.specs !== undefined) payload.specs = updates.specs;
    if (updates.package_contents !== undefined) {
      payload.package_contents = Array.isArray(updates.package_contents)
        ? updates.package_contents.filter((c) => !c.toLowerCase().includes('parasol'))
        : [];
    }
    if (updates.image_url !== undefined) payload.image_url = updates.image_url;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.current_condition !== undefined) payload.current_condition = updates.current_condition;

    if (targetId) {
      const { error } = await supabase.from('equipment').update(payload).eq('id', targetId);
      if (error) {
        throw new Error(`Supabase ekipman güncelleme hatası: ${error.message}`);
      }
      return true;
    } else {
      // Supabase tablosunda henüz bu kayıt yoksa sıfırdan ekle
      const currentList = await this.getEquipment();
      const currentItem = currentList.find((e) => e.id === id) || INITIAL_EQUIPMENT.find((e) => e.id === id);
      const newId = isUuid ? id : crypto.randomUUID();

      const insertPayload = {
        id: newId,
        name: updates.name ?? currentItem?.name ?? 'Ekipman',
        category: updates.category ?? currentItem?.category ?? 'accessory',
        brand: updates.brand ?? currentItem?.brand ?? '',
        model: updates.model ?? currentItem?.model ?? '',
        serial_number: updates.serial_number ?? currentItem?.serial_number ?? `SN-${Date.now()}`,
        description: updates.description ?? currentItem?.description ?? '',
        specs: updates.specs ?? currentItem?.specs ?? {},
        package_contents: Array.isArray(updates.package_contents ?? currentItem?.package_contents)
          ? ((updates.package_contents ?? currentItem?.package_contents) as string[]).filter((c) => !c.toLowerCase().includes('parasol'))
          : [],
        image_url: updates.image_url ?? currentItem?.image_url ?? '',
        status: updates.status ?? currentItem?.status ?? 'available',
        current_condition: updates.current_condition ?? currentItem?.current_condition ?? 'değerlendirilecek'
      };

      const { error: insErr } = await supabase.from('equipment').insert([insertPayload]);
      if (insErr) {
        throw new Error(`Supabase ekipman ekleme hatası: ${insErr.message}`);
      }
      return true;
    }
  },

  async deleteEquipment(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) throw new Error(`Supabase ekipman silme hatası: ${error.message}`);
    } else {
      const { error } = await supabase.from('equipment').delete().eq('serial_number', id);
      if (error) throw new Error(`Supabase ekipman silme hatası: ${error.message}`);
    }
    return true;
  },

  async updateEquipmentStatus(
    id: string,
    status: EquipmentStatus,
    conditionNotes?: string
  ): Promise<boolean> {
    const payload: Partial<Equipment> = { status };
    if (conditionNotes !== undefined) {
      payload.current_condition = conditionNotes;
    }
    return this.updateEquipment(id, payload);
  },

  // ==========================================
  // 4. REZERVASYON İŞLEMLERİ (SUPABASE RESERVATIONS)
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
      return {
        success: false,
        message: 'Bu ekipman şu anda bakımda/serviste olduğu için rezerve edilemez.'
      };
    }

    let trip: Trip | null = null;
    const memberTier = resolveMemberTier(member);

    if (payload.trip_id) {
      trip = await this.getTripById(payload.trip_id);
      if (!trip) {
        return { success: false, message: 'Seçilen gezi sistemde bulunamadı.' };
      }
      if (!trip.is_active) {
        return {
          success: false,
          message: 'Bu gezi şu anda aktif değildir veya rezervasyona kapatılmıştır.'
        };
      }

      const eligibility = checkTripBookingEligibility(trip.start_date, memberTier);
      if (memberTier !== 'board' && memberTier !== 'audit' && !eligibility.isOpen) {
        const tierLabel =
          memberTier === 'active' || memberTier === 'honorary_active'
            ? 'Aktif kulüp üyeleri'
            : 'Normal ve Fahri üyeler';
        return {
          success: false,
          message: `${trip.title} için ${tierLabel} geziden en erken ${eligibility.daysBeforeAllowed} gün önce rezervasyon yapabilir. Rezervasyon açılış tarihi: ${eligibility.openDate} (${eligibility.daysUntilOpen} gün sonra).`
        };
      }
    } else {
      if (memberTier !== 'board' && memberTier !== 'audit' && memberTier !== 'active' && memberTier !== 'honorary_active') {
        return {
          success: false,
          message: 'Normal ve fahri üyeler sadece resmi kulüp gezileri için rezervasyon yapabilir. Bireysel çekim rezervasyonları aktif üyelere özeldir.'
        };
      }
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = `YTU-${new Date().getFullYear()}-${randomSuffix}`;
    const newReservation: Reservation = {
      id: crypto.randomUUID(),
      reservation_code,
      equipment_id: equipment.id,
      member_id: member.id,
      student_number: payload.student_number.trim(),
      pickup_date: payload.pickup_date,
      return_date: payload.return_date,
      purpose: payload.purpose,
      trip_id: payload.trip_id,
      additional_notes: payload.additional_notes,
      status: 'pending',
      created_at: new Date().toISOString(),
      equipment,
      member,
      trip: trip || null
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('reservations')
        .insert([stripReservationRelations(newReservation)])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase rezervasyon oluşturma hatası: ${error.message}`);
      }
      return {
        success: true,
        reservation: { ...newReservation, ...data },
        message: `Rezervasyon talebiniz başarıyla oluşturuldu! Takip Kodunuz: ${reservation_code}.`
      };
    }

    return {
      success: true,
      reservation: newReservation,
      message: `Rezervasyon talebiniz başarıyla oluşturuldu! Takip Kodunuz: ${reservation_code}.`
    };
  },

  async getReservations(): Promise<Reservation[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const bundle = await this.getDashboardBundle();
          const equipMap = new Map(bundle.equipmentList.map((e) => [e.id, e]));
          const memberMap = new Map(bundle.members.map((m) => [m.id, m]));
          const tripMap = new Map(bundle.trips.map((t) => [t.id, t]));

          return (data as any[]).map((r) => ({
            ...r,
            equipment: equipMap.get(r.equipment_id),
            member: memberMap.get(r.member_id) || bundle.members.find((m) => m.student_number === r.student_number),
            trip: r.trip_id ? tripMap.get(r.trip_id) || null : null
          }));
        }
      } catch (err) {
        console.warn('Supabase getReservations error:', err);
      }
    }

    const bundle = await this.getDashboardBundle();
    return bundle.reservations;
  },

  async updateReservationStatus(
    id: string,
    status: Reservation['status'],
    options?: {
      approved_by?: string;
      checked_out_by?: string;
      returned_by?: string;
      returned_to?: string;
      return_condition_notes?: string;
      rejection_reason?: string;
    }
  ): Promise<boolean> {
    const updates: Record<string, any> = { status };
    const now = new Date().toISOString();

    if (status === 'approved') {
      updates.approved_at = now;
      if (options?.approved_by) updates.approved_by = options.approved_by;
    } else if (status === 'in_use') {
      updates.checked_out_at = now;
      if (options?.checked_out_by) updates.approved_by = options.checked_out_by;
    } else if (status === 'returned') {
      updates.returned_at = now;
      if (options?.return_condition_notes) updates.return_condition_notes = options.return_condition_notes;
      if (options?.returned_to || options?.returned_by) updates.approved_by = options?.returned_to || options?.returned_by;
    } else if (status === 'rejected') {
      if (options?.rejection_reason) updates.rejection_reason = options.rejection_reason;
      if (options?.approved_by) updates.approved_by = options.approved_by;
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('reservations').update(updates).eq('id', id);
      if (error) {
        throw new Error(`Supabase rezervasyon güncelleme hatası: ${error.message}`);
      }

      // İlgili ekipmanın durumunu güncelle
      const resList = await this.getReservations();
      const resItem = resList.find((r) => r.id === id);
      if (resItem?.equipment_id) {
        let nextEqStatus: EquipmentStatus = 'available';
        if (status === 'approved') nextEqStatus = 'reserved';
        else if (status === 'in_use') nextEqStatus = 'in_use';
        else if (status === 'returned' || status === 'rejected' || status === 'cancelled') nextEqStatus = 'available';

        await this.updateEquipmentStatus(resItem.equipment_id, nextEqStatus);
      }
      return true;
    }

    return true;
  },

  async deleteReservation(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) throw new Error(`Supabase rezervasyon silme hatası: ${error.message}`);
    }
    return true;
  },

  async clearReservations(): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('reservations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw new Error(`Supabase rezervasyonları temizleme hatası: ${error.message}`);
    }
    return true;
  },

  // ==========================================
  // 5. YÖNETİCİ PROFİLLERİ & PIN ŞİFRELERİ
  // ==========================================
  async getAdminProfiles(_forceFresh = false): Promise<AdminProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('admin_profiles').select('*');
        if (!error && data && data.length > 0) {
          const pinMap = new Map(data.map((r: any) => [r.id, r]));
          return INITIAL_ADMIN_PROFILES.map((def) => {
            const match = pinMap.get(def.id);
            return match ? { ...def, pin: match.pin || def.pin, pin_updated_at: match.pin_updated_at } : def;
          });
        }
      } catch (err) {
        console.warn('Supabase getAdminProfiles error:', err);
      }
    }
    return INITIAL_ADMIN_PROFILES;
  },

  async getActiveAdmin(): Promise<AdminProfile | null> {
    const profiles = await this.getAdminProfiles();
    if (!activeSessionAdminId) return profiles[0] || null;
    return profiles.find((p) => p.id === activeSessionAdminId) || profiles[0] || null;
  },

  async setActiveAdmin(adminId: string | null): Promise<void> {
    activeSessionAdminId = adminId;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (adminId) window.sessionStorage.setItem('ytufok_session_admin_id', adminId);
        else window.sessionStorage.removeItem('ytufok_session_admin_id');
      }
    } catch {
      // ignore
    }
  },

  async updateAdminPin(
    adminId: string,
    currentPin: string,
    newPin: string
  ): Promise<{ success: boolean; message: string; updatedProfile?: AdminProfile }> {
    const profiles = await this.getAdminProfiles(true);
    const target = profiles.find((p) => p.id === adminId);
    if (!target) return { success: false, message: 'Yönetici hesabı bulunamadı.' };

    if (target.pin !== currentPin.trim()) {
      return { success: false, message: 'Mevcut PIN şifresi hatalı.' };
    }

    if (!newPin || newPin.trim().length < 4) {
      return { success: false, message: 'Yeni PIN en az 4 karakter olmalıdır.' };
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('admin_profiles')
        .upsert({ id: adminId, pin: newPin.trim(), pin_updated_at: new Date().toISOString() });

      if (error) {
        throw new Error(`Supabase PIN güncelleme hatası: ${error.message}`);
      }
    }

    const updatedProfile: AdminProfile = {
      ...target,
      pin: newPin.trim(),
      pin_updated_at: new Date().toISOString()
    };

    return {
      success: true,
      message: 'PIN şifreniz başarıyla güncellendi!',
      updatedProfile
    };
  },

  // ==========================================
  // 6. ÜYELER (SUPABASE MEMBERS)
  // ==========================================
  async getMembers(): Promise<Member[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('full_name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((m: any) => normalizeMemberRecord(m as Member));
        }
      } catch (err) {
        console.warn('Supabase getMembers error:', err);
      }
    }
    const bundle = await this.getDashboardBundle();
    return bundle.members;
  },

  async addMember(member: Omit<Member, 'id'>): Promise<Member> {
    const newId = crypto.randomUUID();
    const payload = {
      ...member,
      id: newId,
      student_number: member.student_number.trim(),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('members')
        .insert([payload])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase üye ekleme hatası: ${error.message}`);
      }
      return normalizeMemberRecord(data as Member);
    }

    return normalizeMemberRecord(payload as Member);
  },

  async updateMemberPenalty(
    id: string,
    penaltyCount: number,
    penaltyReason?: string,
    status?: 'active' | 'suspended' | 'passive'
  ): Promise<boolean> {
    const updates: Record<string, any> = {
      penalty_count: penaltyCount,
      penalty_reason: penaltyReason || null
    };
    if (status) updates.status = status;

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('members').update(updates).eq('id', id);
      if (error) throw new Error(`Supabase ceza güncelleme hatası: ${error.message}`);
    }
    return true;
  },

  async updateMember(id: string, updates: Partial<Member>): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('members').update(updates).eq('id', id);
      if (error) throw new Error(`Supabase üye güncelleme hatası: ${error.message}`);
    }
    return true;
  },

  async deleteMember(id: string, studentNumber?: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      let query = supabase.from('members').delete();
      if (id) query = query.eq('id', id);
      else if (studentNumber) query = query.eq('student_number', studentNumber);

      const { error } = await query;
      if (error) throw new Error(`Supabase üye silme hatası: ${error.message}`);
    }
    return true;
  },

  async updateMemberType(id: string, memberType: MemberType): Promise<boolean> {
    let role = 'member';
    if (memberType === 'board') role = 'admin';
    else if (memberType === 'audit') role = 'audit';

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('members').update({ role }).eq('id', id);
      if (error) throw new Error(`Supabase üye rolü güncelleme hatası: ${error.message}`);
    }
    return true;
  },

  async quickRegisterNormalMember(
    name: string,
    studentNo: string,
    dept = 'Yıldız Teknik Üniversitesi'
  ): Promise<{ success: boolean; member?: Member; message: string }> {
    const cleanNo = studentNo.trim();
    const cleanName = name.trim();
    if (!cleanNo || !cleanName) {
      return { success: false, message: 'Lütfen ad soyad ve öğrenci numarasını eksiksiz giriniz.' };
    }

    const newMember: Omit<Member, 'id'> = {
      student_number: cleanNo,
      full_name: cleanName,
      email: `${cleanNo}@std.yildiz.edu.tr`,
      phone: '+90 5xx xxx xx xx',
      department: dept,
      status: 'active',
      penalty_count: 0,
      role: 'member',
      membership_year: new Date().getFullYear(),
      notes: 'Hızlı Kayıt (Normal Üye)'
    };

    const added = await this.addMember(newMember);
    return {
      success: true,
      member: added,
      message: `Üyeliğiniz başarıyla oluşturuldu, ${cleanName}! Rezervasyon talebinizi iletebilirsiniz.`
    };
  },

  // ==========================================
  // 7. DUYURULAR (SUPABASE ANNOUNCEMENTS)
  // ==========================================
  async getAnnouncements(): Promise<Announcement[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return (data as Announcement[]).sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        }
      } catch (err) {
        console.warn('Supabase getAnnouncements error:', err);
      }
    }
    const bundle = await this.getDashboardBundle();
    return bundle.announcements;
  },

  async createAnnouncement(
    announcement: Omit<Announcement, 'id' | 'created_at'>
  ): Promise<Announcement> {
    const newId = crypto.randomUUID();
    const payload = {
      ...announcement,
      id: newId,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('announcements')
        .insert([payload])
        .select()
        .single();

      if (error) throw new Error(`Supabase duyuru ekleme hatası: ${error.message}`);
      return data as Announcement;
    }
    return payload as Announcement;
  },

  async updateAnnouncement(
    id: string,
    updates: Partial<Announcement>
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('announcements').update(updates).eq('id', id);
      if (error) throw new Error(`Supabase duyuru güncelleme hatası: ${error.message}`);
    }
    return true;
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw new Error(`Supabase duyuru silme hatası: ${error.message}`);
    }
    return true;
  },

  // ==========================================
  // 8. GALERİ (SUPABASE GALLERY_ITEMS)
  // ==========================================
  async getGallery(): Promise<GalleryItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('gallery_items').select('*');
        if (!error && data && data.length > 0) return data as GalleryItem[];
      } catch (err) {
        console.warn('Supabase getGallery error:', err);
      }
    }
    return INITIAL_GALLERY;
  },

  // ==========================================
  // 9. KARANLIK ODA SEANSLARI & REZERVASYONLARI
  // ==========================================
  async getDarkroomSlots(): Promise<DarkroomSlot[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('darkroom_slots').select('*').order('date', { ascending: true });
        if (!error && data && data.length > 0) return data as DarkroomSlot[];
      } catch (err) {
        console.warn('Supabase getDarkroomSlots error:', err);
      }
    }
    const bundle = await this.getDashboardBundle();
    return bundle.darkroomSlots;
  },

  async getDarkroomSlotsByDate(date: string): Promise<DarkroomSlot[]> {
    const slots = await this.getDarkroomSlots();
    return slots.filter((s) => s.date === date && s.is_active);
  },

  getStandardDarkroomTemplates(): DarkroomSlotTemplate[] {
    return STANDARD_DARKROOM_TEMPLATES;
  },

  async createDarkroomSlot(slot: Omit<DarkroomSlot, 'id'>): Promise<DarkroomSlot> {
    const newId = `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const payload = { ...slot, id: newId };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('darkroom_slots').insert([payload]).select().single();
      if (error) throw new Error(`Supabase seans ekleme hatası: ${error.message}`);
      return data as DarkroomSlot;
    }
    return payload as DarkroomSlot;
  },

  async createBulkDarkroomSlots(
    slots: Omit<DarkroomSlot, 'id'>[]
  ): Promise<DarkroomSlot[]> {
    const payloads = slots.map((s, idx) => ({
      ...s,
      id: `slot-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`
    }));

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('darkroom_slots').insert(payloads).select();
      if (error) throw new Error(`Supabase toplu seans açma hatası: ${error.message}`);
      return data as DarkroomSlot[];
    }
    return payloads as DarkroomSlot[];
  },

  async deleteDarkroomSlot(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('darkroom_slots').delete().eq('id', id);
      if (error) throw new Error(`Supabase seans silme hatası: ${error.message}`);
    }
    return true;
  },

  async toggleDarkroomSlot(id: string, is_active: boolean): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('darkroom_slots').update({ is_active }).eq('id', id);
      if (error) throw new Error(`Supabase seans durumu güncelleme hatası: ${error.message}`);
    }
    return true;
  },

  async getDarkroomReservations(): Promise<DarkroomReservation[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('darkroom_reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const members = await this.getMembers();
          const memMap = new Map(members.map((m) => [m.id, m]));
          return (data as any[]).map((r) => ({
            ...r,
            member: memMap.get(r.member_id) || members.find((m) => m.student_number === r.student_number)
          }));
        }
      } catch (err) {
        console.warn('Supabase getDarkroomReservations error:', err);
      }
    }
    const bundle = await this.getDashboardBundle();
    return bundle.darkroomReservations;
  },

  async getDarkroomReservationsByDate(date: string): Promise<DarkroomReservation[]> {
    const all = await this.getDarkroomReservations();
    return all.filter((r) => r.date === date && r.status !== 'cancelled' && r.status !== 'rejected');
  },

  async createDarkroomReservation(
    payload: Omit<DarkroomReservation, 'id' | 'reservation_code' | 'created_at'>
  ): Promise<DarkroomReservation> {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = `KO-${new Date().getFullYear()}-${randomSuffix}`;
    const newReservation: DarkroomReservation = {
      ...payload,
      id: `dk-res-${Date.now()}-${randomSuffix.toLowerCase()}`,
      reservation_code,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { member: _m, ...clean } = newReservation;
      const { data, error } = await supabase.from('darkroom_reservations').insert([clean]).select().single();
      if (error) throw new Error(`Supabase karanlık oda rezervasyon hatası: ${error.message}`);
      return { ...newReservation, ...(data || {}) };
    }

    return newReservation;
  },

  async updateDarkroomReservationStatus(
    id: string,
    status: DarkroomReservation['status'],
    options?: {
      approved_by?: string;
      rejection_reason?: string;
      supervisor?: string;
    }
  ): Promise<boolean> {
    const updates: Record<string, any> = { status };
    const now = new Date().toISOString();
    if (status === 'approved') {
      updates.approved_at = now;
      if (options?.approved_by) updates.approved_by = options.approved_by;
    } else if (status === 'rejected') {
      if (options?.rejection_reason) updates.rejection_reason = options.rejection_reason;
      if (options?.approved_by) updates.approved_by = options.approved_by;
    }
    if (options?.supervisor) updates.supervisor = options.supervisor;

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('darkroom_reservations').update(updates).eq('id', id);
      if (error) throw new Error(`Supabase karanlık oda rezervasyon güncelleme hatası: ${error.message}`);
    }
    return true;
  },

  async deleteDarkroomReservation(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('darkroom_reservations').delete().eq('id', id);
      if (error) throw new Error(`Supabase karanlık oda rezervasyon silme hatası: ${error.message}`);
    }
    return true;
  },

  // ==========================================
  // 10. KULÜP GEZİLERİ (SUPABASE TRIPS)
  // ==========================================
  async getTrips(): Promise<Trip[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('trips').select('*').order('start_date', { ascending: true });
        if (!error && data && data.length > 0) return data as Trip[];
      } catch (err) {
        console.warn('Supabase getTrips error:', err);
      }
    }
    const bundle = await this.getDashboardBundle();
    return bundle.trips;
  },

  async getActiveTrips(): Promise<Trip[]> {
    const all = await this.getTrips();
    return all.filter((t) => t.is_active);
  },

  async getTripById(id: string): Promise<Trip | null> {
    const all = await this.getTrips();
    return all.find((t) => t.id === id) || null;
  },

  async createTrip(tripData: Omit<Trip, 'id' | 'created_at'>): Promise<Trip> {
    const newId = `trip-${Date.now()}`;
    const payload: Trip = {
      ...tripData,
      id: newId,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('trips').insert([payload]).select().single();
      if (error) throw new Error(`Supabase gezi ekleme hatası: ${error.message}`);
      return data as Trip;
    }
    return payload;
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('trips').update(updates).eq('id', id);
      if (error) throw new Error(`Supabase gezi güncelleme hatası: ${error.message}`);
    }
    return true;
  },

  async deleteTrip(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw new Error(`Supabase gezi silme hatası: ${error.message}`);
    }
    return true;
  },

  // ==========================================
  // 11. BULUT VERİTABANINI SENKRONİZE ET / TOHUMLA
  // ==========================================
  async syncAllEquipmentToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, count: 0, error: 'Supabase bağlantısı henüz yapılandırılmadı.' };
    }
    try {
      const bundle = await this.getDashboardBundle();
      const itemsToSync = bundle.equipmentList;
      let syncedCount = 0;

      for (const item of itemsToSync) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
        const { data: existing } = await supabase
          .from('equipment')
          .select('id')
          .eq('serial_number', item.serial_number)
          .maybeSingle();

        const payload = {
          name: item.name,
          category: item.category,
          brand: item.brand,
          model: item.model,
          serial_number: item.serial_number,
          description: item.description,
          specs: item.specs || {},
          package_contents: Array.isArray(item.package_contents)
            ? item.package_contents.filter((c) => !c.toLowerCase().includes('parasol'))
            : [],
          image_url: item.image_url || '',
          status: item.status || 'available',
          current_condition: item.current_condition || 'değerlendirilecek'
        };

        if (existing?.id) {
          await supabase.from('equipment').update(payload).eq('id', existing.id);
        } else {
          await supabase.from('equipment').insert([
            {
              ...payload,
              id: isUuid ? item.id : crypto.randomUUID()
            }
          ]);
        }
        syncedCount++;
      }
      return { success: true, count: syncedCount };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || String(err) };
    }
  }
};
