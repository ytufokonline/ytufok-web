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
  MemberType,
  EventSuggestion,
  ClubEvent,
  EventEvaluation
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
  INITIAL_TRIPS,
  INITIAL_EVENTS,
  INITIAL_EVALUATIONS
} from '../data/initialData';
import { checkTripBookingEligibility, resolveMemberTier, getNextBusinessDay, getPreviousBusinessDay, getLocalDateString } from '../utils/tripUtils';

// Kriptografik Yönetici Oturumu ve Önbellek (BULGU-05 Fix: Client-side sessionStorage manipülasyonu engellendi)
let cachedAdminToken: string | null = null;
let cachedActiveAdmin: AdminProfile | null = null;
let cachedAdminProfiles: AdminProfile[] = [];

export function getAdminToken(): string | null {
  if (cachedAdminToken) return cachedAdminToken;
  try {
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem('ytufok_admin_token');
      if (stored) {
        cachedAdminToken = stored;
        return stored;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function getActiveSessionAdminId(): string | null {
  return cachedActiveAdmin?.id || null;
}

export async function callAdminAction(action: string, payload?: any): Promise<any> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapınız.');
  }

  const res = await fetch('/api/admin-action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    cache: 'no-store',
    body: JSON.stringify({ action, payload })
  });

  if (res.status === 401) {
    await api.signOut();
    throw new Error('Oturum süresi doldu veya yetkisiz işlem. Lütfen tekrar giriş yapınız.');
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Sunucu işlem hatası: ${res.statusText}`);
  }

  return json.data !== undefined ? json.data : json;
}

type AuthListener = (admin: AdminProfile | null) => void;
const authListeners = new Set<AuthListener>();

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
  const { equipment, member, trip, phone, ...clean } = r as any;
  return clean;
};

// Yerel depolama yardımcıları (Supabase henüz bağlanmadığında kesintisiz çalışma için)
function getLocalData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  // Security: Never save members or admin credentials into localStorage
  if (key.includes('members') || key.includes('admin_profiles')) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage error:', e);
  }
}

// Güvenlik: Eski sürümlerden kalma hassas verileri tarayıcı hafızasından (localStorage) derhal temizle
if (typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('ytufok_local_members');
    window.localStorage.removeItem('ytufok_local_admin_profiles');
    window.sessionStorage.removeItem('ytufok_local_members');
    window.sessionStorage.removeItem('ytufok_local_admin_profiles');
  } catch {
    // ignore
  }
}

// Supabase bağlantı kontrolü (Yapılandırılmadıysa hata patlatmak yerine güvenli yerel depolama moduna izin verir)
export function ensureSupabaseConfigured(): boolean {
  return isSupabaseConfigured();
}

// Sıfır gecikmeli ilk ekran çizimi için varsayılan başlangıç durumu
const defaultInitialState = {
  equipmentList: INITIAL_EQUIPMENT.map(sanitizeEquipmentItem),
  members: [] as Member[], // Güvenlik: Üye listesi başlangıç durumunda boş tutulur
  trips: INITIAL_TRIPS,
  activeTrips: INITIAL_TRIPS.filter((t) => t.is_active),
  reservations: INITIAL_RESERVATIONS,
  adminProfiles: INITIAL_ADMIN_PROFILES,
  get activeAdmin() {
    const adminId = getActiveSessionAdminId();
    return (adminId
      ? INITIAL_ADMIN_PROFILES.find((p) => p.id === adminId || p.student_number === adminId) || null
      : null) as AdminProfile | null;
  },
  darkroomSlots: DARKROOM_SLOTS,
  darkroomReservations: INITIAL_DARKROOM_RESERVATIONS,
  announcements: INITIAL_ANNOUNCEMENTS,
  gallery: INITIAL_GALLERY,
  eventSuggestions: [] as EventSuggestion[],
  events: INITIAL_EVENTS,
  eventEvaluations: INITIAL_EVALUATIONS
};

// Eski mock etkinliklerin ID'leri (Kullanıcının isteğiyle tamamen temizlendi, geri yüklenmez)
const MOCK_EVENT_IDS = new Set([
  'event-kapadokya-2026',
  'event-gece-atolyesi-2026',
  'event-studyo-portre-2026',
  'event-guz-sergisi-2026',
  'event-buyukada-2026',
  'event-eskisehir-2026',
  'event-darkroom-atolye-2026',
  'event-balat-photowalk-2026',
  'event-tanisma-egitim-2026'
]);

const MOCK_EVAL_IDS = new Set(['eval-1', 'eval-2', 'eval-3', 'eval-4', 'eval-5', 'eval-6']);

export const api = {
  // Anında (0ms) senkron başlangıç verisi (İlk React render için)
  getInitialSyncState() {
    const adminId = getActiveSessionAdminId();
    const rawEvents = getLocalData<ClubEvent[]>('ytufok_local_club_events', []);
    const cleanEvents = rawEvents.filter(e => !MOCK_EVENT_IDS.has(e.id));
    const rawEvals = getLocalData<EventEvaluation[]>('ytufok_local_event_evaluations', []);
    const cleanEvals = rawEvals.filter(e => !MOCK_EVAL_IDS.has(e.id) && !MOCK_EVENT_IDS.has(e.event_id));

    return {
      ...defaultInitialState,
      events: cleanEvents,
      eventEvaluations: cleanEvals,
      activeAdmin: (adminId
        ? INITIAL_ADMIN_PROFILES.find((p) => p.id === adminId || p.student_number === adminId) || null
        : null) as AdminProfile | null
    };
  },

  // ==========================================
  // 1. TOPLU PANO VERİSİ (SUPABASE CLOUD BUNDLE)
  // ==========================================
  async getDashboardBundle(_forceFresh = false) {
    if (!isSupabaseConfigured()) {
      const equipmentList = getLocalData<Equipment[]>('ytufok_local_equipment', defaultInitialState.equipmentList);
      const members = getLocalData<Member[]>('ytufok_local_members', defaultInitialState.members);
      const trips = getLocalData<Trip[]>('ytufok_local_trips', defaultInitialState.trips);
      const existingTripIds = new Set(trips.map(t => t.id));
      let tripsUpdated = false;
      for (const t of INITIAL_TRIPS) {
        if (!existingTripIds.has(t.id)) {
          trips.push(t);
          tripsUpdated = true;
        }
      }
      if (tripsUpdated) {
        setLocalData('ytufok_local_trips', trips);
      }
      const reservations = getLocalData<Reservation[]>('ytufok_local_reservations', defaultInitialState.reservations);
      const adminProfiles = getLocalData<AdminProfile[]>('ytufok_local_admin_profiles', defaultInitialState.adminProfiles);
      const darkroomSlots = getLocalData<DarkroomSlot[]>('ytufok_local_darkroom_slots', defaultInitialState.darkroomSlots);
      const darkroomReservations = getLocalData<DarkroomReservation[]>('ytufok_local_darkroom_reservations', defaultInitialState.darkroomReservations);
      const announcements = getLocalData<Announcement[]>('ytufok_local_announcements', defaultInitialState.announcements);
      const eventSuggestions = getLocalData<EventSuggestion[]>('ytufok_local_suggestions', []);

      const adminId = getActiveSessionAdminId();
      const activeAdmin = adminId
        ? adminProfiles.find((p) => p.id === adminId) || null
        : null;

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
        gallery: INITIAL_GALLERY,
        eventSuggestions
      };
    }

    try {
      const adminToken = getAdminToken();
      const isAdmin = Boolean(adminToken);

      // Kamuya açık veriler (Ekipman, Geziler, Duyurular, Karanlık Oda Seansları)
      const [
        eqRes,
        tripRes,
        annRes,
        darkSlotRes
      ] = await Promise.allSettled([
        supabase.from('equipment').select('*').order('name', { ascending: true }),
        supabase.from('trips').select('*').order('start_date', { ascending: true }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('darkroom_slots').select('*').order('date', { ascending: true })
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

      // 2. Trips
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

      // 3. Announcements
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

      // 4. Darkroom Slots
      let darkroomSlots: DarkroomSlot[] = defaultInitialState.darkroomSlots;
      if (
        darkSlotRes.status === 'fulfilled' &&
        !darkSlotRes.value.error &&
        Array.isArray(darkSlotRes.value.data) &&
        darkSlotRes.value.data.length > 0
      ) {
        darkroomSlots = darkSlotRes.value.data as DarkroomSlot[];
      }

      // 5. Yöneticiye Özel Veriler (BULGU-02 & BULGU-08 KVKK Koruması)
      // Normal ziyaretçilere üyelerin veya rezervasyonların listesi ASLA gönderilmez!
      let members: Member[] = [];
      let reservations: Reservation[] = [];
      let darkroomReservations: DarkroomReservation[] = [];
      let eventSuggestions: EventSuggestion[] = [];

      if (isAdmin) {
        try {
          const adminBundle = await callAdminAction('get_admin_bundle');
          if (adminBundle) {
            if (Array.isArray(adminBundle.members)) {
              members = adminBundle.members.map(normalizeMemberRecord);
            }
            const memberById = new Map<string, Member>();
            const memberByNo = new Map<string, Member>();
            members.forEach((m) => {
              if (m.id) memberById.set(m.id, m);
              if (m.student_number) memberByNo.set(m.student_number, m);
            });

            if (Array.isArray(adminBundle.reservations)) {
              reservations = adminBundle.reservations.map((r: any) => ({
                ...r,
                equipment: equipById.get(r.equipment_id),
                member: memberById.get(r.member_id) || memberByNo.get(r.student_number),
                trip: r.trip_id ? tripById.get(r.trip_id) || null : null
              }));
            }

            if (Array.isArray(adminBundle.darkroomReservations)) {
              darkroomReservations = adminBundle.darkroomReservations.map((r: any) => ({
                ...r,
                member: memberById.get(r.member_id) || memberByNo.get(r.student_number)
              }));
            }

            if (Array.isArray(adminBundle.eventSuggestions)) {
              eventSuggestions = adminBundle.eventSuggestions;
            }
          }
        } catch (adminErr) {
          console.warn('Yönetici verileri yüklenemedi:', adminErr);
        }
      }

      const adminProfiles: AdminProfile[] = cachedAdminProfiles;
      const activeAdmin = cachedActiveAdmin;

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
        gallery: INITIAL_GALLERY,
        eventSuggestions
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

    // 1. Güvenli PostgreSQL RPC Sorgusu (SECURITY DEFINER ile RLS aşımı ve güvenli tekil üye doğrulama)
    if (isSupabaseConfigured()) {
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('verify_student_member', {
          p_student_number: cleanNumber
        });

        if (!rpcErr && rpcRes) {
          if (!rpcRes.success) {
            return {
              success: false,
              member: rpcRes.member ? normalizeMemberRecord(rpcRes.member) : undefined,
              message: rpcRes.message || 'Girdiğiniz öğrenci numarası kulüp üye listesinde bulunamadı.'
            };
          }

          const member = normalizeMemberRecord(rpcRes.member);
          const tierLabel = member.role === 'board' || member.role === 'admin' || member.member_type === 'board'
            ? 'Yönetim Kurulu'
            : member.role === 'audit' || member.member_type === 'audit'
            ? 'Denetim Kurulu'
            : member.member_type === 'active' || member.member_type === 'honorary_active'
            ? 'Aktif Üye'
            : 'Normal Üye';

          return {
            success: true,
            member,
            message: `Hoş geldiniz, ${member.full_name} (${member.department}). ${tierLabel} olarak doğrulandınız.`
          };
        }
      } catch (err) {
        console.warn('Supabase RPC verification error:', err);
      }

      // 1.2. Fallback Tekil Satır Sorgusu
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, student_number, full_name, department, status, role, member_type, penalty_count, penalty_reason')
          .ilike('student_number', cleanNumber)
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

          const tierLabel = member.role === 'board' || member.role === 'admin' || member.member_type === 'board'
            ? 'Yönetim Kurulu'
            : member.role === 'audit' || member.member_type === 'audit'
            ? 'Denetim Kurulu'
            : member.member_type === 'active' || member.member_type === 'honorary_active'
            ? 'Aktif Üye'
            : 'Normal Üye';

          return {
            success: true,
            member,
            message: `Hoş geldiniz, ${member.full_name} (${member.department}). ${tierLabel} olarak doğrulandınız.`
          };
        }
      } catch (err) {
        console.warn('Supabase direct verification error:', err);
      }
    }

    // 2. Serverless API Endpoint'ini Fallback Olarak Dene
    try {
      const res = await fetch('/api/verify-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentNumber: cleanNumber })
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.member) {
          json.member = normalizeMemberRecord(json.member);
        }
        return json;
      }
    } catch {
      // ignore
    }

    return {
      success: false,
      message: 'Girdiğiniz öğrenci numarası kulüp üye listesinde bulunamadı.'
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

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Equipment[]>('ytufok_local_equipment', defaultInitialState.equipmentList);
      const sanitized = sanitizeEquipmentItem(insertPayload as any);
      list.unshift(sanitized);
      setLocalData('ytufok_local_equipment', list);
      return sanitized;
    }

    const { data, error } = await supabase
      .from('equipment')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase ekipman ekleme hatası: ${error.message}`);
    }
    return sanitizeEquipmentItem(data as Equipment);
  },

  async updateEquipment(
    id: string,
    updates: Partial<Equipment>
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const list = getLocalData<Equipment[]>('ytufok_local_equipment', defaultInitialState.equipmentList);
      const idx = list.findIndex(e => e.id === id || e.serial_number === id);
      if (idx !== -1) {
        list[idx] = sanitizeEquipmentItem({ ...list[idx], ...updates });
      } else {
        list.push(sanitizeEquipmentItem({ ...updates, id } as Equipment));
      }
      setLocalData('ytufok_local_equipment', list);
      return true;
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

    if (getAdminToken()) {
      if (targetId) {
        await callAdminAction('update_equipment', { id: targetId, updates: payload });
        return true;
      }
    }

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

      if (getAdminToken()) {
        await callAdminAction('create_equipment', insertPayload);
        return true;
      }

      const { error: insErr } = await supabase.from('equipment').insert([insertPayload]);
      if (insErr) {
        throw new Error(`Supabase ekipman ekleme hatası: ${insErr.message}`);
      }
      return true;
    }
  },

  async deleteEquipment(id: string): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('delete_equipment', { id });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Equipment[]>('ytufok_local_equipment', defaultInitialState.equipmentList);
      setLocalData('ytufok_local_equipment', list.filter(e => e.id !== id && e.serial_number !== id));
      return true;
    }

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
  async lookupReservation(query: string): Promise<{ equipment: Reservation[]; darkroom: DarkroomReservation[] }> {
    const res = await fetch('/api/lookup-reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || 'Rezervasyon sorgulanırken hata oluştu.');
    }
    return {
      equipment: Array.isArray(json.equipment) ? json.equipment : [],
      darkroom: Array.isArray(json.darkroom) ? json.darkroom : []
    };
  },

  async cancelReservationPublic(id: string, reservationCode: string, type: 'equipment' | 'darkroom' = 'equipment'): Promise<boolean> {
    const res = await fetch('/api/lookup-reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cancel',
        id,
        reservation_code: reservationCode,
        type
      })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || 'İptal işlemi gerçekleştirilemedi.');
    }
    return true;
  },

  async getMemberActiveReservations(studentNumber: string): Promise<Reservation[]> {
    if (!studentNumber) return [];
    try {
      const data = await this.lookupReservation(studentNumber.trim());
      return data.equipment.filter(r => ['pending', 'approved', 'in_use'].includes(r.status));
    } catch {
      const list = getLocalData<Reservation[]>('ytufok_local_reservations', defaultInitialState.reservations);
      return list.filter(r => r.student_number === studentNumber.trim() && ['pending', 'approved', 'in_use'].includes(r.status));
    }
  },

  async createReservation(payload: {
    equipment_id: string;
    student_number: string;
    pickup_date: string;
    return_date: string;
    purpose: string;
    phone?: string;
    trip_id?: string;
    additional_notes?: string;
  }): Promise<{ success: boolean; reservation?: Reservation; message: string }> {
    // 1. Sunucu Tarafı Güvenli Endpoint (BULGU-07, BULGU-08 & RLS Koruması)
    try {
      const apiRes = await fetch('/api/create-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const apiJson = await apiRes.json().catch(() => null);
      if (apiJson) {
        if (apiJson.success) {
          return {
            success: true,
            reservation: apiJson.reservation,
            message: apiJson.message
          };
        } else {
          return {
            success: false,
            message: apiJson.message || 'Rezervasyon oluşturulamadı.'
          };
        }
      }
    } catch (e) {
      console.warn('API create-reservation fallback:', e);
    }

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

    if (equipment.status === 'in_use') {
      return {
        success: false,
        message: 'Bu ekipman şu anda kullanımda/çekimde olduğu için rezerve edilemez.'
      };
    }

    if (equipment.status === 'reserved') {
      return {
        success: false,
        message: 'Bu ekipman için onaylanmış bir rezervasyon bulunmaktadır ve şu anda rezerve edilemez.'
      };
    }

    // Ekipmanın onaylı, bekleyen veya kullanımda aktif rezervasyonu olup olmadığını veritabanından doğrudan doğrula
    if (isSupabaseConfigured()) {
      const { data: activeRes } = await supabase
        .from('reservations')
        .select('id, reservation_code, pickup_date, return_date, status')
        .eq('equipment_id', payload.equipment_id)
        .in('status', ['pending', 'approved', 'in_use']);

      if (activeRes && activeRes.length > 0) {
        const resItem = activeRes[0];
        const statusLabel = resItem.status === 'pending'
          ? 'onay bekleyen bir rezervasyon talebi'
          : 'onaylanmış aktif bir rezervasyon';
        return {
          success: false,
          message: `Bu ekipman için şu anda ${statusLabel} bulunmaktadır (${resItem.reservation_code}). Lütfen listeden müsait başka bir ekipman seçiniz.`
        };
      }

      // 1. Mükerrer Talep Engeli: Aynı üyenin bu ekipman için zaten bekleyen veya aktif bir talebi var mı?
      const { data: duplicateMemberRes } = await supabase
        .from('reservations')
        .select('id, reservation_code, status')
        .eq('equipment_id', payload.equipment_id)
        .eq('student_number', payload.student_number.trim())
        .in('status', ['pending', 'approved', 'in_use']);

      if (duplicateMemberRes && duplicateMemberRes.length > 0) {
        const existing = duplicateMemberRes[0];
        const statusLabel = existing.status === 'pending' ? 'onay bekleyen' : 'onaylanmış';
        return {
          success: false,
          message: `Bu ekipman için zaten ${statusLabel} bir rezervasyon talebiniz bulunmaktadır (${existing.reservation_code}). Aynı ekipman için mükerrer talep açılamaz.`
        };
      }

      // 2. Kamera Limiti: Bir üye aynı gezi/etkinlik için en fazla 1 adet kamera gövdesi alabilir
      const isCamera = equipment.category === 'camera' || equipment.category === 'analog';
      if (isCamera) {
        let cameraQuery = supabase
          .from('reservations')
          .select('id, reservation_code, status, equipment_id, trip_id')
          .eq('student_number', payload.student_number.trim())
          .in('status', ['pending', 'approved', 'in_use']);

        if (payload.trip_id) {
          cameraQuery = cameraQuery.eq('trip_id', payload.trip_id);
        }

        const { data: userTripRes } = await cameraQuery;
        if (userTripRes && userTripRes.length > 0) {
          const allEq = await this.getEquipment();
          const existingCameraRes = userTripRes.find((r) => {
            const eq = allEq.find((e) => e.id === r.equipment_id);
            return eq && (eq.category === 'camera' || eq.category === 'analog');
          });

          if (existingCameraRes) {
            const existingEq = allEq.find((e) => e.id === existingCameraRes.equipment_id);
            const statusText = existingCameraRes.status === 'pending' ? 'onay bekleyen' : 'onaylanmış';
            return {
              success: false,
              message: `Bu gezi için zaten ${statusText} bir kamera talebiniz bulunmaktadır (${existingEq?.name || 'Kamera'} - ${existingCameraRes.reservation_code}). Aynı gezi için yalnızca 1 adet kamera gövdesi talep edilebilir.`
            };
          }
        }
      }
    } else {
      const list = getLocalData<Reservation[]>('ytufok_local_reservations', defaultInitialState.reservations);
      const isReservedByAny = list.some(r => r.equipment_id === equipment.id && ['pending', 'approved', 'in_use'].includes(r.status));
      if (isReservedByAny) {
        return {
          success: false,
          message: 'Bu ekipman için şu anda onay bekleyen veya aktif bir rezervasyon talebi bulunmaktadır. Lütfen listeden başka bir ekipman seçiniz.'
        };
      }
      const dup = list.find(r => r.equipment_id === equipment.id && r.student_number === payload.student_number.trim() && ['pending', 'approved', 'in_use'].includes(r.status));
      if (dup) {
        return {
          success: false,
          message: `Bu ekipman için zaten bekleyen/onaylı bir rezervasyon talebiniz bulunmaktadır (${dup.reservation_code}).`
        };
      }
      const isCamera = equipment.category === 'camera' || equipment.category === 'analog';
      if (isCamera) {
        const existingCamera = list.find(r => 
          r.student_number === payload.student_number.trim() && 
          ['pending', 'approved', 'in_use'].includes(r.status) &&
          (payload.trip_id ? r.trip_id === payload.trip_id : true) &&
          (r.equipment?.category === 'camera' || r.equipment?.category === 'analog')
        );
        if (existingCamera) {
          return {
            success: false,
            message: `Bu gezi için zaten bir kamera talebiniz bulunmaktadır (${existingCamera.equipment?.name || 'Kamera'} - ${existingCamera.reservation_code}). Aynı gezi için yalnızca 1 kamera gövdesi talep edilebilir.`
          };
        }
      }
    }

    let trip: Trip | null = null;
    const memberTier = resolveMemberTier(member);

    const allTrips = await this.getTrips();

    if (payload.trip_id) {
      trip = allTrips.find((t) => t.id === payload.trip_id) || null;
      if (!trip) {
        return { success: false, message: 'Seçilen gezi sistemde bulunamadı.' };
      }
      if (!trip.is_active) {
        return {
          success: false,
          message: `"${trip.title}" şu anda pasife alınmıştır / ertelenmiştir. Pasif geziler için ekipman rezervasyonu yapılamaz.`
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
      // Pasife alınmış gezinin adını yazarak rezervasyon yapma girişimini engelle
      const lowerPurpose = (payload.purpose || '').toLowerCase();
      const matchedPassiveTrip = allTrips.find(
        (t) => !t.is_active && (
          (t.title && lowerPurpose.includes(t.title.toLowerCase())) ||
          (t.destination && lowerPurpose.includes(t.destination.toLowerCase()))
        )
      );
      if (matchedPassiveTrip) {
        return {
          success: false,
          message: `"${matchedPassiveTrip.title}" şu anda pasife alınmış / ertelenmiştir. Bu gezi için ekipman rezervasyonu oluşturulamaz.`
        };
      }

      if (memberTier !== 'board' && memberTier !== 'audit' && memberTier !== 'active' && memberTier !== 'honorary_active') {
        return {
          success: false,
          message: 'Normal üyelerimiz yalnızca aktif ve resmi kulüp gezileri için rezervasyon yapabilir. Şu anda aktif bir gezi bulunmamaktadır.'
        };
      }
    }

    // Üyenin telefon numarasını veritabanında güvenli RPC ile güncelle
    if (payload.phone && member?.student_number && isSupabaseConfigured()) {
      const cleanPhone = payload.phone.trim();
      try {
        await supabase.rpc('update_member_contact_phone', {
          p_student_number: member.student_number,
          p_phone: cleanPhone
        });
      } catch {
        // Fallback doğrudan update
        try {
          await supabase.from('members').update({ phone: cleanPhone }).eq('id', member.id);
        } catch {
          // ignore
        }
      }
      member.phone = cleanPhone;
    }

    const effectivePickupDate = payload.trip_id && trip
      ? getPreviousBusinessDay(trip.start_date)
      : payload.pickup_date;
    const effectiveReturnDate = payload.trip_id && trip
      ? getNextBusinessDay(trip.end_date || trip.start_date)
      : payload.return_date;

    const formattedNotes = payload.phone
      ? (payload.additional_notes ? `Tel: ${payload.phone.trim()} | ${payload.additional_notes.trim()}` : `Tel: ${payload.phone.trim()}`)
      : payload.additional_notes;

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = `YTU-${new Date().getFullYear()}-${randomSuffix}`;
    const newReservation: Reservation = {
      id: crypto.randomUUID(),
      reservation_code,
      equipment_id: equipment.id,
      member_id: member.id,
      student_number: payload.student_number.trim(),
      phone: payload.phone?.trim(),
      pickup_date: effectivePickupDate,
      return_date: effectiveReturnDate,
      purpose: payload.purpose,
      trip_id: payload.trip_id,
      additional_notes: formattedNotes,
      status: 'pending',
      created_at: new Date().toISOString(),
      equipment,
      member,
      trip: trip || null
    };

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Reservation[]>('ytufok_local_reservations', defaultInitialState.reservations);
      list.unshift(newReservation);
      setLocalData('ytufok_local_reservations', list);
      await this.updateEquipmentStatus(equipment.id, 'reserved');
      return {
        success: true,
        reservation: newReservation,
        message: `Rezervasyon talebiniz başarıyla oluşturuldu! Takip Kodunuz: ${reservation_code}.`
      };
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert([stripReservationRelations(newReservation)])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase rezervasyon oluşturma hatası: ${error.message}`);
    }

    // Ekipmanın statüsünü derhal rezerve edildi olarak güncelle
    await this.updateEquipmentStatus(equipment.id, 'reserved');

    return {
      success: true,
      reservation: { ...newReservation, ...data },
      message: `Rezervasyon talebiniz başarıyla oluşturuldu! Takip Kodunuz: ${reservation_code}.`
    };
  },

  async getReservations(): Promise<Reservation[]> {
    const token = getAdminToken();
    if (!token) {
      return []; // Anonim kullanıcıların tüm rezervasyonları listelemesi engellendi (BULGU-08 Fix)
    }

    try {
      const data = await callAdminAction('get_reservations');
      if (Array.isArray(data)) {
        const bundle = await this.getDashboardBundle();
        const equipMap = new Map(bundle.equipmentList.map((e) => [e.id, e]));
        const memberMap = new Map(bundle.members.map((m) => [m.id, m]));
        const tripMap = new Map(bundle.trips.map((t) => [t.id, t]));

        return data.map((r: any) => ({
          ...r,
          equipment: equipMap.get(r.equipment_id),
          member: memberMap.get(r.member_id) || bundle.members.find((m) => m.student_number === r.student_number),
          trip: r.trip_id ? tripMap.get(r.trip_id) || null : null
        }));
      }
    } catch (err) {
      console.warn('Admin getReservations error:', err);
    }
    return [];
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
    } else if (status === 'cancelled') {
      if (options?.rejection_reason) updates.rejection_reason = options.rejection_reason;
      if (options?.approved_by) updates.approved_by = options.approved_by;
    }

    if (getAdminToken()) {
      await callAdminAction('update_reservation', { id, updates });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Reservation[]>('ytufok_local_reservations', defaultInitialState.reservations);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        setLocalData('ytufok_local_reservations', list);
      }
      return true;
    }

    const { error } = await supabase.from('reservations').update(updates).eq('id', id);
    if (error) {
      throw new Error(`Supabase rezervasyon güncelleme hatası: ${error.message}`);
    }
    return true;
  },

  async updateReservationDates(
    id: string,
    pickupDate: string,
    returnDate: string,
    additionalNotes?: string
  ): Promise<boolean> {
    const updates: Record<string, any> = {
      pickup_date: pickupDate,
      return_date: returnDate,
      updated_at: new Date().toISOString()
    };

    if (additionalNotes !== undefined) {
      updates.additional_notes = additionalNotes;
    }

    if (getAdminToken()) {
      await callAdminAction('update_reservation', { id, updates });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Reservation[]>('ytufok_local_reservations', defaultInitialState.reservations);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        setLocalData('ytufok_local_reservations', list);
      }
      return true;
    }

    const { error } = await supabase.from('reservations').update(updates).eq('id', id);
    if (error) {
      throw new Error(`Tarih güncelleme hatası: ${error.message}`);
    }
    return true;
  },

  async deleteReservation(id: string): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('delete_reservation', { id });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Reservation[]>('ytufok_local_reservations', defaultInitialState.reservations);
      const filtered = list.filter(r => r.id !== id);
      setLocalData('ytufok_local_reservations', filtered);
      return true;
    }

    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) throw new Error(`Supabase rezervasyon silme hatası: ${error.message}`);
    return true;
  },

  async clearReservations(): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('clear_all_reservations');
      return true;
    }

    if (!isSupabaseConfigured()) {
      setLocalData('ytufok_local_reservations', []);
      return true;
    }

    const { error } = await supabase.from('reservations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`Supabase rezervasyonları temizleme hatası: ${error.message}`);
    return true;
  },

  // ==========================================
  // 5. YÖNETİCİ PROFİLLERİ & PIN ŞİFRELERİ (GÜVENLİ SERVER-SIDE AUTH)
  // ==========================================
  getAdminToken(): string | null {
    return getAdminToken();
  },

  async getAdminProfiles(_forceFresh = false): Promise<AdminProfile[]> {
    if (cachedAdminProfiles && cachedAdminProfiles.length > 0) {
      return cachedAdminProfiles;
    }
    try {
      if (typeof window !== 'undefined') {
        const stored = window.sessionStorage.getItem('ytufok_admin_profiles');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedAdminProfiles = parsed;
            return parsed;
          }
        }
      }
    } catch {
      // ignore
    }
    return cachedActiveAdmin ? [cachedActiveAdmin] : [];
  },

  async getActiveAdmin(forceVerify = false): Promise<AdminProfile | null> {
    const token = this.getAdminToken();
    if (!token) {
      cachedActiveAdmin = null;
      return null;
    }

    if (cachedActiveAdmin && !forceVerify) {
      return cachedActiveAdmin;
    }

    // Sunucu tarafında kriptografik imza ve geçerlilik kontrolü (BULGU-05 Fix)
    try {
      const res = await fetch('/api/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.valid && data?.admin) {
          cachedActiveAdmin = data.admin;
          return data.admin;
        }
      }
    } catch {
      // ignore
    }

    // Oturum sahte veya süresi dolmuşsa oturumu temizle
    await this.signOut();
    return null;
  },

  async loginAdmin(
    studentNumber: string,
    pin: string
  ): Promise<{ success: boolean; message: string; admin?: AdminProfile }> {
    const cleanNo = studentNumber.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPin = pin.trim();
    if (!cleanNo || !cleanPin) {
      return { success: false, message: 'Lütfen öğrenci numaranızı ve şifrenizi giriniz.' };
    }

    try {
      const res = await fetch('/api/verify-admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ studentNumber: cleanNo, pin: cleanPin })
      });
      const json = await res.json().catch(() => null);
      if (json && json.success && json.token && json.admin) {
        await this.setAdminSession(json.token, json.admin, json.profiles);
        return json;
      }
      return json || {
        success: false,
        message: 'Öğrenci numarası veya şifre hatalı.'
      };
    } catch {
      return {
        success: false,
        message: 'Sunucu bağlantısı sağlanamadı. Lütfen daha sonra tekrar deneyiniz.'
      };
    }
  },

  async verifyAdminPin(adminId: string, pin: string): Promise<{ success: boolean; message: string }> {
    const cleanPin = pin.trim();
    if (!cleanPin) {
      return { success: false, message: 'Lütfen PIN şifrenizi giriniz.' };
    }

    try {
      const res = await fetch('/api/verify-admin-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAdminToken() || ''}`
        },
        cache: 'no-store',
        body: JSON.stringify({ adminId, pin: cleanPin })
      });
      const json = await res.json().catch(() => null);
      if (json && json.success && json.token && json.admin) {
        await this.setAdminSession(json.token, json.admin);
        return json;
      }
      return json || {
        success: false,
        message: 'Hatalı PIN kodu veya sunucuya ulaşılamadı.'
      };
    } catch {
      return {
        success: false,
        message: 'Hatalı PIN kodu veya sunucuya ulaşılamadı.'
      };
    }
  },

  async setAdminSession(token: string, admin: AdminProfile, profiles?: AdminProfile[]): Promise<void> {
    cachedAdminToken = token;
    cachedActiveAdmin = admin;
    if (profiles && profiles.length > 0) {
      cachedAdminProfiles = profiles;
    } else {
      cachedAdminProfiles = [admin];
    }

    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('ytufok_admin_token', token);
        window.sessionStorage.setItem('ytufok_admin_profile', JSON.stringify(admin));
        if (profiles) {
          window.sessionStorage.setItem('ytufok_admin_profiles', JSON.stringify(profiles));
        }
        // Eski güvensiz anahtarları temizle
        window.sessionStorage.removeItem('ytufok_session_admin_id');
        window.localStorage.removeItem('ytufok_session_admin_id');
      }
    } catch {
      // ignore
    }

    this.notifyAuthChange(admin);
  },

  async setActiveAdmin(adminId: string | null): Promise<void> {
    if (!adminId) {
      await this.signOut();
      return;
    }

    const profiles = await this.getAdminProfiles();
    const resolved = profiles.find((p) => p.id === adminId || p.student_number === adminId) || null;
    if (resolved && cachedAdminToken) {
      cachedActiveAdmin = resolved;
      this.notifyAuthChange(resolved);
    } else {
      await this.signOut();
    }
  },

  async signOut(): Promise<void> {
    cachedAdminToken = null;
    cachedActiveAdmin = null;
    cachedAdminProfiles = [];

    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('ytufok_admin_token');
        window.sessionStorage.removeItem('ytufok_admin_profile');
        window.sessionStorage.removeItem('ytufok_admin_profiles');
        window.sessionStorage.removeItem('ytufok_session_admin_id');
        window.localStorage.removeItem('ytufok_session_admin_id');
        window.localStorage.removeItem('ytufok_active_admin_profile');
      }
    } catch {
      // ignore
    }

    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }

    this.notifyAuthChange(null);
  },

  onAuthChange(listener: (admin: AdminProfile | null) => void): () => void {
    authListeners.add(listener);
    return () => authListeners.delete(listener);
  },

  notifyAuthChange(admin: AdminProfile | null): void {
    authListeners.forEach((listener) => {
      try {
        listener(admin);
      } catch (e) {
        console.error(e);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ytufok_auth_change', { detail: admin }));
    }
  },

  async updateAdminPin(
    adminId: string,
    currentPin: string,
    newPin: string
  ): Promise<{ success: boolean; message: string; updatedProfile?: AdminProfile }> {
    const cleanCurrent = currentPin.trim();
    const cleanNew = newPin.trim();

    if (!cleanCurrent || !cleanNew) {
      return { success: false, message: 'Lütfen tüm alanları doldurunuz.' };
    }
    if (cleanNew.length < 4) {
      return { success: false, message: 'Yeni PIN en az 4 karakter olmalıdır.' };
    }

    // Doğrudan Kriptografik Güvenli Sunucu Rotası (PBKDF2 Hash ve Canlı DB Güncelleme)
    try {
      const res = await fetch('/api/update-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ adminId, currentPin: cleanCurrent, newPin: cleanNew })
      });
      const json = await res.json().catch(() => null);
      if (json) {
        if (json.success) {
          const profiles = await this.getAdminProfiles();
          const updated = profiles.find((p) => p.id === adminId || p.student_number === adminId);
          return { success: true, message: json.message, updatedProfile: updated };
        }
        return { success: false, message: json.message || 'Şifre güncellenemedi.' };
      }
    } catch {
      // ignore
    }

    return {
      success: false,
      message: 'Şifre güncellenirken sunucu bağlantı hatası oluştu.'
    };
  },

  // ==========================================
  // 6. ÜYELER (SUPABASE MEMBERS)
  // ==========================================
  async getMembers(): Promise<Member[]> {
    // Güvenlik: Aktif yönetici oturumu yoksa (giriş yapılmadıysa) members tablosuna asla sorgu atma
    if (!getActiveSessionAdminId()) {
      return [];
    }
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
    return [];
  },

  async addMember(member: Omit<Member, 'id'>): Promise<Member> {
    const newId = crypto.randomUUID();
    const payload = {
      ...member,
      id: newId,
      student_number: member.student_number.trim(),
      created_at: new Date().toISOString()
    };

    if (getAdminToken()) {
      const data = await callAdminAction('add_member', payload);
      return normalizeMemberRecord(data as Member);
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Member[]>('ytufok_local_members', defaultInitialState.members);
      const normalized = normalizeMemberRecord(payload as Member);
      list.unshift(normalized);
      setLocalData('ytufok_local_members', list);
      return normalized;
    }

    const { data, error } = await supabase
      .from('members')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase üye ekleme hatası: ${error.message}`);
    }
    return normalizeMemberRecord(data as Member);
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

    if (getAdminToken()) {
      await callAdminAction('update_member', { id, updates });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Member[]>('ytufok_local_members', defaultInitialState.members);
      const idx = list.findIndex(m => m.id === id || m.student_number === id);
      if (idx !== -1) {
        list[idx] = normalizeMemberRecord({ ...list[idx], ...updates });
        setLocalData('ytufok_local_members', list);
      }
      return true;
    }

    const { error } = await supabase.from('members').update(updates).eq('id', id);
    if (error) throw new Error(`Supabase ceza güncelleme hatası: ${error.message}`);
    return true;
  },

  async updateMember(id: string, updates: Partial<Member>): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('update_member', { id, updates });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Member[]>('ytufok_local_members', defaultInitialState.members);
      const idx = list.findIndex(m => m.id === id || m.student_number === id);
      if (idx !== -1) {
        list[idx] = normalizeMemberRecord({ ...list[idx], ...updates });
        setLocalData('ytufok_local_members', list);
      }
      return true;
    }

    const { error } = await supabase.from('members').update(updates).eq('id', id);
    if (error) throw new Error(`Supabase üye güncelleme hatası: ${error.message}`);
    return true;
  },

  async deleteMember(id: string, studentNumber?: string): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('delete_member', { id });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Member[]>('ytufok_local_members', defaultInitialState.members);
      setLocalData('ytufok_local_members', list.filter(m => m.id !== id && m.student_number !== studentNumber));
      return true;
    }

    let query = supabase.from('members').delete();
    if (id) query = query.eq('id', id);
    else if (studentNumber) query = query.eq('student_number', studentNumber);

    const { error } = await query;
    if (error) throw new Error(`Supabase üye silme hatası: ${error.message}`);
    return true;
  },

  async updateMemberType(id: string, memberType: MemberType): Promise<boolean> {
    let role = 'member';
    if (memberType === 'board') role = 'admin';
    else if (memberType === 'audit') role = 'audit';

    if (getAdminToken()) {
      await callAdminAction('update_member', { id, updates: { role, member_type: memberType } });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Member[]>('ytufok_local_members', defaultInitialState.members);
      const idx = list.findIndex(m => m.id === id || m.student_number === id);
      if (idx !== -1) {
        list[idx] = normalizeMemberRecord({ ...list[idx], role: role as any, member_type: memberType });
        setLocalData('ytufok_local_members', list);
      }
      return true;
    }

    const { error } = await supabase
      .from('members')
      .update({ role, member_type: memberType })
      .eq('id', id);
    if (error) throw new Error(`Supabase üye rolü güncelleme hatası: ${error.message}`);
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
    const payload: Announcement = {
      ...announcement,
      id: newId,
      created_at: new Date().toISOString()
    };

    if (getAdminToken()) {
      const data = await callAdminAction('create_announcement', payload);
      return data as Announcement;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Announcement[]>('ytufok_local_announcements', defaultInitialState.announcements);
      list.unshift(payload);
      setLocalData('ytufok_local_announcements', list);
      return payload;
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(`Supabase duyuru ekleme hatası: ${error.message}`);
    return data as Announcement;
  },

  async updateAnnouncement(
    id: string,
    updates: Partial<Announcement>
  ): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('update_announcement', { id, updates });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Announcement[]>('ytufok_local_announcements', defaultInitialState.announcements);
      const idx = list.findIndex(a => a.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        setLocalData('ytufok_local_announcements', list);
      }
      return true;
    }

    const { error } = await supabase.from('announcements').update(updates).eq('id', id);
    if (error) throw new Error(`Supabase duyuru güncelleme hatası: ${error.message}`);
    return true;
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('delete_announcement', { id });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Announcement[]>('ytufok_local_announcements', defaultInitialState.announcements);
      setLocalData('ytufok_local_announcements', list.filter(a => a.id !== id));
      return true;
    }

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw new Error(`Supabase duyuru silme hatası: ${error.message}`);
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
    const payload: DarkroomSlot = { ...slot, id: newId };

    if (getAdminToken()) {
      const data = await callAdminAction('create_slot', payload);
      return (data || payload) as DarkroomSlot;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<DarkroomSlot[]>('ytufok_local_darkroom_slots', defaultInitialState.darkroomSlots);
      list.push(payload);
      setLocalData('ytufok_local_darkroom_slots', list);
      return payload;
    }

    const { data, error } = await supabase.from('darkroom_slots').insert([payload]).select().single();
    if (error) throw new Error(`Supabase seans ekleme hatası: ${error.message}`);
    return data as DarkroomSlot;
  },

  async createBulkDarkroomSlots(
    slots: Omit<DarkroomSlot, 'id'>[]
  ): Promise<DarkroomSlot[]> {
    const payloads: DarkroomSlot[] = slots.map((s, idx) => ({
      ...s,
      id: `slot-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`
    }));

    if (getAdminToken()) {
      const data = await callAdminAction('create_slots_batch', payloads);
      return (data || payloads) as DarkroomSlot[];
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<DarkroomSlot[]>('ytufok_local_darkroom_slots', defaultInitialState.darkroomSlots);
      list.push(...payloads);
      setLocalData('ytufok_local_darkroom_slots', list);
      return payloads;
    }

    const { data, error } = await supabase.from('darkroom_slots').insert(payloads).select();
    if (error) throw new Error(`Supabase toplu seans açma hatası: ${error.message}`);
    return data as DarkroomSlot[];
  },

  async deleteDarkroomSlot(id: string): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('delete_slot', { id });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<DarkroomSlot[]>('ytufok_local_darkroom_slots', defaultInitialState.darkroomSlots);
      setLocalData('ytufok_local_darkroom_slots', list.filter(s => s.id !== id));
      return true;
    }

    const { error } = await supabase.from('darkroom_slots').delete().eq('id', id);
    if (error) throw new Error(`Supabase seans silme hatası: ${error.message}`);
    return true;
  },

  async toggleDarkroomSlot(id: string, is_active: boolean): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('update_slot', { id, updates: { is_active } });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<DarkroomSlot[]>('ytufok_local_darkroom_slots', defaultInitialState.darkroomSlots);
      const idx = list.findIndex(s => s.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], is_active };
        setLocalData('ytufok_local_darkroom_slots', list);
      }
      return true;
    }

    const { error } = await supabase.from('darkroom_slots').update({ is_active }).eq('id', id);
    if (error) throw new Error(`Supabase seans durumu güncelleme hatası: ${error.message}`);
    return true;
  },

  async getDarkroomReservations(): Promise<DarkroomReservation[]> {
    const token = getAdminToken();
    if (!token) {
      return []; // Anonim kullanıcıların karanlık oda rezervasyonlarını listelemesi engellendi (BULGU-08 Fix)
    }

    try {
      const data = await callAdminAction('get_darkroom_reservations');
      if (Array.isArray(data)) return data as DarkroomReservation[];
    } catch (err) {
      console.warn('getDarkroomReservations error:', err);
    }
    return [];
  },

  async getDarkroomReservationsByDate(date: string): Promise<DarkroomReservation[]> {
    const all = await this.getDarkroomReservations();
    return all.filter((r) => r.date === date && r.status !== 'cancelled' && r.status !== 'rejected');
  },

  async createDarkroomReservation(
    payload: Omit<DarkroomReservation, 'id' | 'reservation_code' | 'created_at'>
  ): Promise<DarkroomReservation> {
    try {
      const res = await fetch('/api/create-darkroom-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json?.reservation) {
        return json.reservation;
      }
    } catch {
      // API erişilemezse yerel/doğrudan akışa devam et
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = `KO-${new Date().getFullYear()}-${randomSuffix}`;
    const newReservation: DarkroomReservation = {
      ...payload,
      id: `dk-res-${Date.now()}-${randomSuffix.toLowerCase()}`,
      reservation_code,
      created_at: new Date().toISOString()
    };

    if (!isSupabaseConfigured()) {
      const list = getLocalData<DarkroomReservation[]>('ytufok_local_darkroom_reservations', defaultInitialState.darkroomReservations);
      list.unshift(newReservation);
      setLocalData('ytufok_local_darkroom_reservations', list);
      return newReservation;
    }

    const { member: _m, ...clean } = newReservation;
    const { data, error } = await supabase.from('darkroom_reservations').insert([clean]).select().single();
    if (error) throw new Error(`Supabase karanlık oda rezervasyon hatası: ${error.message}`);
    return { ...newReservation, ...(data || {}) };
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
    } else if (status === 'cancelled') {
      if (options?.rejection_reason) updates.rejection_reason = options.rejection_reason;
      if (options?.approved_by) updates.approved_by = options.approved_by;
    }
    if (options?.supervisor) updates.supervisor = options.supervisor;

    if (getAdminToken()) {
      await callAdminAction('update_darkroom_reservation', { id, updates });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<DarkroomReservation[]>('ytufok_local_darkroom_reservations', defaultInitialState.darkroomReservations);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        setLocalData('ytufok_local_darkroom_reservations', list);
      }
      return true;
    }

    const { error } = await supabase.from('darkroom_reservations').update(updates).eq('id', id);
    if (error) throw new Error(`Supabase karanlık oda rezervasyon güncelleme hatası: ${error.message}`);
    return true;
  },

  async deleteDarkroomReservation(id: string): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('delete_darkroom_reservation', { id });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<DarkroomReservation[]>('ytufok_local_darkroom_reservations', defaultInitialState.darkroomReservations);
      setLocalData('ytufok_local_darkroom_reservations', list.filter(r => r.id !== id));
      return true;
    }

    const { error } = await supabase.from('darkroom_reservations').delete().eq('id', id);
    if (error) throw new Error(`Supabase karanlık oda rezervasyon silme hatası: ${error.message}`);
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

    if (getAdminToken()) {
      const data = await callAdminAction('create_trip', payload);
      return (data || payload) as Trip;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Trip[]>('ytufok_local_trips', defaultInitialState.trips);
      list.push(payload);
      setLocalData('ytufok_local_trips', list);
      return payload;
    }

    const { data, error } = await supabase.from('trips').insert([payload]).select().single();
    if (error) throw new Error(`Supabase gezi ekleme hatası: ${error.message}`);
    return data as Trip;
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('update_trip', { id, updates });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Trip[]>('ytufok_local_trips', defaultInitialState.trips);
      const idx = list.findIndex(t => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        setLocalData('ytufok_local_trips', list);
      }
      return true;
    }

    const { error } = await supabase.from('trips').update(updates).eq('id', id);
    if (error) throw new Error(`Supabase gezi güncelleme hatası: ${error.message}`);
    return true;
  },

  async deleteTrip(id: string): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('delete_trip', { id });
      return true;
    }

    if (!isSupabaseConfigured()) {
      const list = getLocalData<Trip[]>('ytufok_local_trips', defaultInitialState.trips);
      setLocalData('ytufok_local_trips', list.filter(t => t.id !== id));
      return true;
    }

    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw new Error(`Supabase gezi silme hatası: ${error.message}`);
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
  },

  // ==========================================
  // 12. ETKİNLİK ÖNERİLERİ (EVENT SUGGESTIONS)
  // ==========================================
  async getEventSuggestions(): Promise<EventSuggestion[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('event_suggestions')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          return data as EventSuggestion[];
        }
      } catch (err) {
        console.warn('Supabase getEventSuggestions error:', err);
      }
    }

    // Serverless API fallback
    try {
      const res = await fetch('/api/suggestions', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) return json as EventSuggestion[];
      }
    } catch {
      // ignore
    }

    const list = getLocalData<EventSuggestion[]>('ytufok_local_suggestions', []);
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  },

  async createEventSuggestion(data: Omit<EventSuggestion, 'id' | 'created_at'>): Promise<EventSuggestion> {
    const newId = `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const payload: EventSuggestion = {
      ...data,
      id: newId,
      status: data.status || 'pending',
      suggested_by: data.suggested_by && data.suggested_by.trim() ? data.suggested_by.trim() : 'Anonim Üye',
      created_at: new Date().toISOString()
    };

    // 1. Serverless API
    try {
      fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {
      // ignore
    }

    // 2. Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: insData, error } = await supabase
          .from('event_suggestions')
          .insert([payload])
          .select()
          .single();
        if (!error && insData) {
          return insData as EventSuggestion;
        }
      } catch {
        // ignore
      }
    }

    // 3. Local fallback
    const list = getLocalData<EventSuggestion[]>('ytufok_local_suggestions', []);
    list.unshift(payload);
    setLocalData('ytufok_local_suggestions', list);
    return payload;
  },

  async updateEventSuggestion(id: string, updates: Partial<EventSuggestion>): Promise<boolean> {
    try {
      fetch('/api/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      }).catch(() => {});
    } catch {
      // ignore
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('event_suggestions').update(updates).eq('id', id);
      } catch {
        // ignore
      }
    }

    const list = getLocalData<EventSuggestion[]>('ytufok_local_suggestions', []);
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setLocalData('ytufok_local_suggestions', list);
    }
    return true;
  },

  async deleteEventSuggestion(id: string): Promise<boolean> {
    try {
      fetch('/api/suggestions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(() => {});
    } catch {
      // ignore
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('event_suggestions').delete().eq('id', id);
      } catch {
        // ignore
      }
    }

    const list = getLocalData<EventSuggestion[]>('ytufok_local_suggestions', []);
    const filtered = list.filter(s => s.id !== id);
    setLocalData('ytufok_local_suggestions', filtered);
    return true;
  },

  // ==========================================
  // 13. KULÜP ETKİNLİKLERİ & DEĞERLENDİRMELERİ
  // ==========================================
  async getEvents(): Promise<ClubEvent[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('club_events')
          .select('*')
          .order('date', { ascending: false });
        if (!error && Array.isArray(data)) {
          return (data as ClubEvent[]).filter(e => !MOCK_EVENT_IDS.has(e.id));
        }
      } catch (err) {
        console.warn('Supabase getEvents error:', err);
      }
    }

    const rawList = getLocalData<ClubEvent[]>('ytufok_local_club_events', []);
    const cleaned = rawList.filter(e => !MOCK_EVENT_IDS.has(e.id));
    if (cleaned.length !== rawList.length) {
      setLocalData('ytufok_local_club_events', cleaned);
    }
    return cleaned;
  },

  async createEvent(data: Omit<ClubEvent, 'id' | 'created_at'>): Promise<ClubEvent> {
    const newId = `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const payload: ClubEvent = {
      ...data,
      id: newId,
      created_at: new Date().toISOString()
    };

    if (getAdminToken()) {
      const created = await callAdminAction('create_event', payload);
      return (created || payload) as ClubEvent;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: insData, error } = await supabase
          .from('club_events')
          .insert([payload])
          .select()
          .single();
        if (!error && insData) {
          return insData as ClubEvent;
        }
      } catch {
        // ignore
      }
    }

    const list = getLocalData<ClubEvent[]>('ytufok_local_club_events', []);
    list.unshift(payload);
    setLocalData('ytufok_local_club_events', list);
    return payload;
  },

  async updateEvent(id: string, updates: Partial<ClubEvent>): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('update_event', { id, updates });
      return true;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('club_events').update(updates).eq('id', id);
      } catch {
        // ignore
      }
    }

    const list = getLocalData<ClubEvent[]>('ytufok_local_club_events', []);
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setLocalData('ytufok_local_club_events', list);
    }
    return true;
  },

  async deleteEvent(id: string): Promise<boolean> {
    if (getAdminToken()) {
      await callAdminAction('delete_event', { id });
      return true;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('club_events').delete().eq('id', id);
        await supabase.from('event_evaluations').delete().eq('event_id', id);
      } catch {
        // ignore
      }
    }

    const list = getLocalData<ClubEvent[]>('ytufok_local_club_events', []);
    const filtered = list.filter(e => e.id !== id);
    setLocalData('ytufok_local_club_events', filtered);

    const evals = getLocalData<EventEvaluation[]>('ytufok_local_event_evaluations', []);
    const filteredEvals = evals.filter(e => e.event_id !== id);
    setLocalData('ytufok_local_event_evaluations', filteredEvals);

    return true;
  },

  async getEventEvaluations(eventId?: string): Promise<EventEvaluation[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('event_evaluations').select('*').order('created_at', { ascending: false });
        if (eventId) {
          query = query.eq('event_id', eventId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return (data as EventEvaluation[]).filter(e => !MOCK_EVAL_IDS.has(e.id) && !MOCK_EVENT_IDS.has(e.event_id));
        }
      } catch (err) {
        console.warn('Supabase getEventEvaluations error:', err);
      }
    }

    const rawList = getLocalData<EventEvaluation[]>('ytufok_local_event_evaluations', []);
    const cleaned = rawList.filter(e => !MOCK_EVAL_IDS.has(e.id) && !MOCK_EVENT_IDS.has(e.event_id));
    if (cleaned.length !== rawList.length) {
      setLocalData('ytufok_local_event_evaluations', cleaned);
    }
    cleaned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (eventId) {
      return cleaned.filter(e => e.event_id === eventId);
    }
    return cleaned;
  },

  async createEventEvaluation(data: Omit<EventEvaluation, 'id' | 'created_at'>): Promise<EventEvaluation> {
    const newId = `eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const payload: EventEvaluation = {
      ...data,
      id: newId,
      evaluator_name: data.evaluator_name && data.evaluator_name.trim() ? data.evaluator_name.trim() : 'Anonim Katılımcı',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data: insData, error } = await supabase
          .from('event_evaluations')
          .insert([payload])
          .select()
          .single();
        if (!error && insData) {
          return insData as EventEvaluation;
        }
      } catch {
        // ignore
      }
    }

    const list = getLocalData<EventEvaluation[]>('ytufok_local_event_evaluations', INITIAL_EVALUATIONS);
    list.unshift(payload);
    setLocalData('ytufok_local_event_evaluations', list);
    return payload;
  },

  async deleteEventEvaluation(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('event_evaluations').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
    const list = getLocalData<EventEvaluation[]>('ytufok_local_event_evaluations', INITIAL_EVALUATIONS);
    const filtered = list.filter(e => e.id !== id);
    setLocalData('ytufok_local_event_evaluations', filtered);
    return true;
  }
};

// Global Supabase Auth oturum durumunu anlık takip eden mekanizma
// NOT: Yöneticiler Kulüp Yönetim Kurulu PIN şifresiyle oturum açtığı için Gotrue SIGNED_OUT tetiklendiğinde
// PIN oturumunu kapatmamalıdır. Sadece doğrudan kullanıcı e-posta ile giriş yaptıysa eşleştirme yapılır.
if (typeof window !== 'undefined') {
  try {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userEmail = session.user.email || '';
        const userPrefix = userEmail.split('@')[0];
        const profiles = await api.getAdminProfiles();
        const matched = profiles.find(
          (p) => p.student_number === userPrefix || p.id === session.user.id
        );
        const currentId = getActiveSessionAdminId();
        if (matched && matched.id !== currentId) {
          await api.setActiveAdmin(matched.id);
        }
      }
    });
  } catch {
    // Supabase çevrimdışı veya yapılandırılmamışsa yutulur
  }
}
