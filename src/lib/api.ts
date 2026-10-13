import { supabase, isSupabaseConfigured } from './supabase';
import {
  Equipment,
  Member,
  Reservation,
  ReservationStatus,
  Announcement,
  GalleryItem,
  EquipmentStatus,
  AdminProfile,
  DarkroomSlot,
  DarkroomReservation,
  DarkroomStatus,
  Trip
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

const UNIFIED_NTFY_TOPIC = 'ytufok_unified_state_v6_948172';
const SNAPSHOT_KEY = 'ytufok_unified_cloud_snap_v8';

type CloudCollectionKey =
  | 'admin_profiles'
  | 'reservations'
  | 'equipment_state'
  | 'darkroom'
  | 'darkroom_slots'
  | 'trips'
  | 'announcements'
  | 'member_deltas';

interface AdminPinRecord {
  pin: string;
  pin_updated_at?: string;
}

type AdminPinMap = Record<string, AdminPinRecord>;

interface EquipmentStateDelta {
  overrides: Record<string, { status: EquipmentStatus; current_condition?: string }>;
  added: Equipment[];
}

interface MemberDeltas {
  overrides: Record<string, Partial<Member>>;
  added: Member[];
}

interface UnifiedStateEnvelope {
  updatedAt: number;
  collections: Partial<Record<CloudCollectionKey, any>>;
}

// Eski localStorage anahtarlarını temizle
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    Object.keys(window.localStorage).forEach((k) => {
      if (k.startsWith('ytufok_') && k !== SNAPSHOT_KEY) {
        window.localStorage.removeItem(k);
      }
    });
  }
} catch {
  // ignore
}

let activeSessionAdminId: string | null = null;
try {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    activeSessionAdminId = window.sessionStorage.getItem('ytufok_session_admin_id');
  }
} catch {
  // ignore
}

let memoryState: UnifiedStateEnvelope | null = null;
let lastFetchTimestamp = 0;
let inFlightUnifiedFetch: Promise<UnifiedStateEnvelope> | null = null;
const UNIFIED_CACHE_TTL_MS = 8000;

function loadSnapshot(): UnifiedStateEnvelope {
  if (memoryState) return memoryState;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(SNAPSHOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UnifiedStateEnvelope;
        if (parsed && typeof parsed === 'object' && parsed.collections) {
          memoryState = parsed;
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  const initial: UnifiedStateEnvelope = { updatedAt: 0, collections: {} };
  memoryState = initial;
  return initial;
}

function saveSnapshot(envelope: UnifiedStateEnvelope): void {
  memoryState = envelope;
  lastFetchTimestamp = Date.now();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(envelope));
    }
  } catch {
    // ignore
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 1800): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDirectNtfyUnified(): Promise<UnifiedStateEnvelope | null> {
  try {
    const res = await fetchWithTimeout(
      `https://ntfy.sh/${UNIFIED_NTFY_TOPIC}/json?poll=1&since=12h`,
      { method: 'GET', cache: 'no-store' },
      1800
    );
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim()) {
      return { updatedAt: Date.now(), collections: {} };
    }

    const lines = text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(
        (evt) =>
          evt &&
          evt.event === 'message' &&
          typeof evt.message === 'string' &&
          (evt.message.startsWith('YTUFOK_STATE:') || evt.message.startsWith('YTUFOK_PTR:'))
      );

    if (lines.length === 0) {
      return { updatedAt: Date.now(), collections: {} };
    }
    const last = lines[lines.length - 1];

    if (last.message.startsWith('YTUFOK_PTR:')) {
      const ptr = JSON.parse(last.message.slice(11));
      if (ptr?.inline && ptr.inline.collections) {
        return ptr.inline as UnifiedStateEnvelope;
      }
    }

    if (last.message.startsWith('YTUFOK_STATE:')) {
      const parsed = JSON.parse(last.message.slice(13)) as UnifiedStateEnvelope;
      if (parsed && parsed.collections) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function fetchUnifiedState(forceFresh = false): Promise<UnifiedStateEnvelope> {
  const now = Date.now();
  if (!forceFresh && memoryState && lastFetchTimestamp > 0 && now - lastFetchTimestamp < UNIFIED_CACHE_TTL_MS) {
    return memoryState;
  }

  if (inFlightUnifiedFetch) {
    return inFlightUnifiedFetch;
  }

  const promise = (async (): Promise<UnifiedStateEnvelope> => {
    const fallback = loadSnapshot();

    // 1. Önce aynı domaindeki Vercel Serverless API (/api/db) üzerinden dene
    try {
      const apiRes = await fetchWithTimeout(
        `/api/db?_t=${Date.now()}`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: { Accept: 'application/json' }
        },
        2000
      );
      const contentType = apiRes.headers.get('content-type') || '';
      if (apiRes.ok && contentType.includes('application/json')) {
        const data = (await apiRes.json()) as UnifiedStateEnvelope;
        if (data && data.collections !== undefined) {
          const remoteHasKeys = Object.keys(data.collections).length > 0;
          if (remoteHasKeys && (!fallback.updatedAt || (data.updatedAt || 0) >= fallback.updatedAt)) {
            saveSnapshot(data);
            return data;
          }
          // Sunucu boş döndüyse bile zaman damgasını güncelle, ikinci kez ntfy'a gitme!
          lastFetchTimestamp = Date.now();
          return fallback;
        }
      }
    } catch {
      // /api/db mevcut değilse (örn. vite local dev) doğrudan bulut kanalına geç
    }

    // 2. Yalnızca /api/db yanıt vermediyse doğrudan bulut kanalından oku
    const direct = await fetchDirectNtfyUnified();
    if (direct && direct.collections !== undefined) {
      const remoteHasKeys = Object.keys(direct.collections).length > 0;
      if (remoteHasKeys && (!fallback.updatedAt || (direct.updatedAt || 0) >= fallback.updatedAt)) {
        saveSnapshot(direct);
        return direct;
      }
      lastFetchTimestamp = Date.now();
    }

    return fallback;
  })();

  inFlightUnifiedFetch = promise;
  try {
    return await promise;
  } finally {
    inFlightUnifiedFetch = null;
  }
}

async function readCloudCollection<T>(
  key: CloudCollectionKey,
  defaultValue: T,
  forceFresh = false
): Promise<T> {
  const envelope = await fetchUnifiedState(forceFresh);
  const val = envelope.collections?.[key];
  if (val !== undefined && val !== null) {
    return val as T;
  }
  return defaultValue;
}

async function writeCloudCollection<T>(key: CloudCollectionKey, items: T): Promise<boolean> {
  const current = loadSnapshot();
  const nextEnvelope: UnifiedStateEnvelope = {
    updatedAt: Date.now(),
    collections: {
      ...(current.collections || {}),
      [key]: items
    }
  };

  saveSnapshot(nextEnvelope);

  let savedOnServer = false;

  try {
    const apiRes = await fetchWithTimeout(
      '/api/db',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          key,
          value: items,
          collections: nextEnvelope.collections
        })
      },
      2500
    );
    const contentType = apiRes.headers.get('content-type') || '';
    if (apiRes.ok && contentType.includes('application/json')) {
      const json = await apiRes.json();
      if (json?.ok) {
        savedOnServer = true;
      }
    }
  } catch {
    // ignore
  }

  if (!savedOnServer) {
    try {
      const rawState = JSON.stringify(nextEnvelope);
      const res = await fetchWithTimeout(
        `https://ntfy.sh/${UNIFIED_NTFY_TOPIC}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
          },
          body: `YTUFOK_STATE:${rawState}`
        },
        2500
      );
      if (res.ok) {
        savedOnServer = true;
      }
    } catch (err) {
      console.error(`Cloud write error (${key}):`, err);
    }
  }

  return savedOnServer;
}

const stripReservationRelations = (r: Reservation): Reservation => {
  const { equipment, member, trip, ...clean } = r;
  return clean;
};

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

// Senkron başlangıç verisi üreticisi (Sıfır gecikmeli ilk ekran çizimi için)
function computeSyncStateFromEnvelope(envelope: UnifiedStateEnvelope) {
  const cols = envelope.collections || {};

  // 1. Equipment
  const eqDelta: EquipmentStateDelta = cols.equipment_state || { overrides: {}, added: [] };
  const baseEq = INITIAL_EQUIPMENT.map((item) => {
    const ov = eqDelta.overrides?.[item.id];
    if (!ov) return item;
    return {
      ...item,
      status: ov.status ?? item.status,
      current_condition: ov.current_condition ?? item.current_condition
    };
  });
  const equipmentList: Equipment[] = [
    ...(Array.isArray(eqDelta.added) ? eqDelta.added : []),
    ...baseEq
  ];

  // 2. Members
  const memDelta: MemberDeltas = cols.member_deltas || { overrides: {}, added: [] };
  const baseMembers = INITIAL_MEMBERS.map((m) => {
    const ov = memDelta.overrides?.[m.id];
    const merged = ov ? { ...m, ...ov } : m;
    return normalizeMemberRecord(merged);
  });
  const addedMembers = (Array.isArray(memDelta.added) ? memDelta.added : []).map((m) => {
    const ov = memDelta.overrides?.[m.id];
    return normalizeMemberRecord(ov ? { ...m, ...ov } : m);
  });
  const members: Member[] = [...addedMembers, ...baseMembers];

  // Fast O(1) lookup maps
  const equipById = new Map<string, Equipment>();
  equipmentList.forEach((e) => equipById.set(e.id, e));

  const memberById = new Map<string, Member>();
  const memberByNo = new Map<string, Member>();
  members.forEach((m) => {
    memberById.set(m.id, m);
    memberByNo.set(m.student_number, m);
  });

  // 3. Trips
  const rawTrips: Trip[] = cols.trips || INITIAL_TRIPS;
  const trips = [...rawTrips].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  const tripById = new Map<string, Trip>();
  trips.forEach((t) => tripById.set(t.id, t));

  // 4. Reservations
  const rawReservations: Reservation[] = cols.reservations || INITIAL_RESERVATIONS;
  const reservations: Reservation[] = rawReservations.map((r) => ({
    ...r,
    equipment: r.equipment || equipById.get(r.equipment_id),
    member: r.member || memberById.get(r.member_id) || memberByNo.get(r.student_number),
    trip: r.trip || (r.trip_id ? tripById.get(r.trip_id) || null : null)
  }));

  // 5. Admin Profiles
  const pinMap: AdminPinMap | AdminProfile[] = cols.admin_profiles || {};
  let adminProfiles: AdminProfile[] = INITIAL_ADMIN_PROFILES;
  if (Array.isArray(pinMap)) {
    adminProfiles = INITIAL_ADMIN_PROFILES.map((def) => {
      const found = pinMap.find((cp) => cp.id === def.id);
      return found ? { ...def, pin: found.pin || def.pin, pin_updated_at: found.pin_updated_at } : def;
    });
  } else if (pinMap && typeof pinMap === 'object') {
    adminProfiles = INITIAL_ADMIN_PROFILES.map((def) => {
      const rec = (pinMap as AdminPinMap)[def.id];
      return rec && rec.pin ? { ...def, pin: rec.pin, pin_updated_at: rec.pin_updated_at } : def;
    });
  }

  const activeAdmin = activeSessionAdminId
    ? adminProfiles.find((p) => p.id === activeSessionAdminId) || null
    : null;

  // 6. Darkroom
  const darkroomSlots: DarkroomSlot[] = cols.darkroom_slots || DARKROOM_SLOTS;
  const rawDarkroom: DarkroomReservation[] = cols.darkroom || INITIAL_DARKROOM_RESERVATIONS;
  const darkroomReservations: DarkroomReservation[] = rawDarkroom.map((r) => ({
    ...r,
    member: memberById.get(r.member_id) || memberByNo.get(r.student_number)
  }));

  // 7. Announcements
  const rawAnnouncements: Announcement[] = (cols.announcements || INITIAL_ANNOUNCEMENTS)
    .filter((a: Announcement) => a.id !== 'a-2' && a.id !== 'a-3')
    .map((a: Announcement) => {
      if (a.id === 'a-1') {
        const updatedA1 = INITIAL_ANNOUNCEMENTS.find((ia) => ia.id === 'a-1');
        return updatedA1 || a;
      }
      return a;
    });
  const announcements = [...rawAnnouncements].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

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
}

export const api = {
  // Anında (0ms) senkron başlangıç verisi (Yükleme ekranı beklemelerini ortadan kaldırır)
  getInitialSyncState() {
    return computeSyncStateFromEnvelope(loadSnapshot());
  },

  // Tek bir toplu ağ isteğiyle tüm yönetici paneli verilerini getirir (Batch Request)
  async getDashboardBundle(forceFresh = false) {
    const envelope = await fetchUnifiedState(forceFresh);
    return computeSyncStateFromEnvelope(envelope);
  },

  // Yalnızca bekleyen rezervasyon sayısını hızlıca hesaplar (600 üyeyi birleştirmeden)
  async getPendingCount(): Promise<number> {
    if (isSupabaseConfigured()) {
      try {
        const { count, error } = await supabase
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (!error && typeof count === 'number') return count;
      } catch {
        // ignore
      }
    }
    const rawReservations = await readCloudCollection<Reservation[]>(
      'reservations',
      INITIAL_RESERVATIONS
    );
    return rawReservations.filter((r) => r.status === 'pending').length;
  },

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
        console.warn('Supabase verification error, using cloud store:', err);
      }
    }

    const members = await this.getMembers();
    const normalizedInput = cleanNumber.toLowerCase().replace(/[\s\.\-_]/g, '');

    const foundMember = members.find((m) => {
      const normalizedTarget = m.student_number.toLowerCase().replace(/[\s\.\-_]/g, '');
      if (normalizedTarget === normalizedInput) return true;
      if (
        (normalizedInput === '2,50e+10' ||
          normalizedInput === '2.50e+10' ||
          normalizedInput === '25022018' ||
          normalizedInput === '22052018') &&
        m.full_name === 'Zeynep Kaya'
      ) {
        return true;
      }
      if (
        (normalizedInput === 'g24100151017' || normalizedInput === '24000001') &&
        (m.full_name.includes('Hekimoğlu') || m.id === 'm-103')
      ) {
        return true;
      }
      if (
        (normalizedInput === 'teknopark' || normalizedInput === '24000004') &&
        (m.full_name.includes('Aksoy') || m.id === 'm-49')
      ) {
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

        if (!error && data && data.length > 0) {
          return data as Equipment[];
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
    return list.find((e) => e.id === id) || null;
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

    const delta = await readCloudCollection<EquipmentStateDelta>('equipment_state', {
      overrides: {},
      added: []
    });
    const updatedDelta: EquipmentStateDelta = {
      overrides: delta.overrides || {},
      added: [newEquipment, ...(Array.isArray(delta.added) ? delta.added : [])]
    };
    await writeCloudCollection('equipment_state', updatedDelta);
    return newEquipment;
  },

  async updateEquipmentStatus(
    id: string,
    status: EquipmentStatus,
    conditionNotes?: string
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, unknown> = { status };
        if (conditionNotes) updatePayload.current_condition = conditionNotes;

        const { error } = await supabase.from('equipment').update(updatePayload).eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase updateEquipmentStatus error:', err);
      }
    }

    const delta = await readCloudCollection<EquipmentStateDelta>('equipment_state', {
      overrides: {},
      added: []
    });

    const overrides = { ...(delta.overrides || {}) };
    const existingOv = overrides[id] || { status };
    overrides[id] = {
      status,
      current_condition: conditionNotes || existingOv.current_condition
    };

    const added = (Array.isArray(delta.added) ? delta.added : []).map((item) =>
      item.id === id
        ? { ...item, status, current_condition: conditionNotes || item.current_condition }
        : item
    );

    return await writeCloudCollection('equipment_state', { overrides, added });
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
          message:
            'Bireysel ekipman rezervasyonu kulüp kuralları gereğince yalnızca YTÜFOK Aktif ve Fahri Aktif Üyelerine açıktır. Normal ve Fahri üyelerimiz ekipman rezervasyonunu Kulüp Gezileri için (geziden 3 gün önce) yapabilir.'
        };
      }
    }

    const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = `YTU-2026-${codeSuffix}`;

    const newReservation: Reservation = {
      id: isSupabaseConfigured()
        ? crypto.randomUUID()
        : `r-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      reservation_code,
      equipment_id: payload.equipment_id,
      member_id: member.id,
      student_number: member.student_number,
      pickup_date: payload.pickup_date,
      return_date: payload.return_date,
      purpose: payload.purpose,
      trip_id: payload.trip_id || null,
      additional_notes: payload.additional_notes || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      equipment,
      member,
      trip: trip || null
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .insert([stripReservationRelations(newReservation)])
          .select()
          .single();

        if (!error && data) {
          return {
            success: true,
            reservation: { ...newReservation, ...data },
            message: `Rezervasyon talebiniz başarıyla oluşturuldu! Takip Kodunuz: ${reservation_code}.`
          };
        }
      } catch (err) {
        console.warn('Supabase createReservation error:', err);
      }
    }

    const currentReservations = await readCloudCollection<Reservation[]>(
      'reservations',
      INITIAL_RESERVATIONS
    );
    const updatedReservations = [
      stripReservationRelations(newReservation),
      ...currentReservations.map(stripReservationRelations)
    ];
    await writeCloudCollection('reservations', updatedReservations);

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
          .select(`*, equipment:equipment_id (*), member:member_id (*)`)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as Reservation[];
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
          updates.rejection_reason =
            options?.rejection_reason || 'Tarih çakışması veya kulüp etkinliği.';
          if (options?.approved_by) updates.approved_by = options.approved_by;
        }

        const { error } = await supabase.from('reservations').update(updates).eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase updateReservationStatus error:', err);
      }
    }

    const reservations = await readCloudCollection<Reservation[]>(
      'reservations',
      INITIAL_RESERVATIONS
    );
    const target = reservations.find((r) => r.id === id);
    if (!target) return false;

    const updatedReservations = reservations.map((r) => {
      if (r.id === id) {
        const updated: Reservation = {
          ...stripReservationRelations(r),
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
          updated.return_condition_notes =
            options?.return_condition_notes || 'Eksiksiz ve hasarsız teslim alındı.';
        } else if (newStatus === 'rejected') {
          updated.rejection_reason =
            options?.rejection_reason || 'Kulüp etkinliği nedeniyle reddedildi.';
          if (options?.approved_by) updated.approved_by = options.approved_by;
        }

        return updated;
      }
      return stripReservationRelations(r);
    });

    await writeCloudCollection('reservations', updatedReservations);

    let targetEquipStatus: EquipmentStatus = 'available';
    if (newStatus === 'approved') targetEquipStatus = 'reserved';
    else if (newStatus === 'in_use' || newStatus === 'overdue') targetEquipStatus = 'in_use';
    else if (newStatus === 'returned' || newStatus === 'rejected' || newStatus === 'cancelled') {
      targetEquipStatus = 'available';
    }

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
  async getAdminProfiles(forceFresh = false): Promise<AdminProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('admin_profiles')
          .select('*')
          .order('id', { ascending: true });
        if (!error && data && data.length > 0) {
          return INITIAL_ADMIN_PROFILES.map((def) => {
            const match = data.find((d: any) => d.id === def.id);
            return match ? { ...def, pin: match.pin || def.pin, pin_updated_at: match.pin_updated_at } : def;
          });
        }
      } catch (err) {
        console.warn('Supabase getAdminProfiles error:', err);
      }
    }

    const bundle = await this.getDashboardBundle(forceFresh);
    return bundle.adminProfiles;
  },

  async getActiveAdmin(): Promise<AdminProfile | null> {
    if (!activeSessionAdminId) return null;
    const profiles = await this.getAdminProfiles(false);
    return profiles.find((p) => p.id === activeSessionAdminId) || null;
  },

  async setActiveAdmin(adminId: string | null): Promise<void> {
    activeSessionAdminId = adminId;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (!adminId) {
          window.sessionStorage.removeItem('ytufok_session_admin_id');
        } else {
          window.sessionStorage.setItem('ytufok_session_admin_id', adminId);
        }
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
    const cleanCurrent = currentPin.trim();
    const cleanNew = newPin.trim();

    if (!cleanNew) {
      return { success: false, message: 'Yeni şifre boş bırakılamaz.' };
    }
    if (cleanNew.length < 4) {
      return { success: false, message: 'Yeni şifre en az 4 karakter olmalıdır.' };
    }

    const profiles = await this.getAdminProfiles(true);
    const targetIndex = profiles.findIndex((p) => p.id === adminId);
    if (targetIndex === -1) {
      return { success: false, message: 'Yönetici profili bulunamadı.' };
    }

    const currentProfile = profiles[targetIndex];
    const expectedPin = currentProfile.pin || '19111994';

    if (cleanCurrent !== expectedPin) {
      return { success: false, message: 'Mevcut şifrenizi hatalı girdiniz.' };
    }

    const nowIso = new Date().toISOString();
    const updatedProfile: AdminProfile = {
      ...currentProfile,
      pin: cleanNew,
      pin_updated_at: nowIso
    };

    profiles[targetIndex] = updatedProfile;

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('admin_profiles')
          .upsert([{ id: adminId, pin: cleanNew, pin_updated_at: nowIso }]);
      } catch (err) {
        console.warn('Supabase updateAdminPin error:', err);
      }
    }

    const pinMap: AdminPinMap = {};
    profiles.forEach((p) => {
      pinMap[p.id] = {
        pin: p.pin,
        ...(p.pin_updated_at ? { pin_updated_at: p.pin_updated_at } : {})
      };
    });

    await writeCloudCollection('admin_profiles', pinMap);

    return {
      success: true,
      message: `${updatedProfile.full_name} için şifre tüm cihazlarda geçerli olacak şekilde güncellendi.`,
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

        if (!error && data && data.length > 0) {
          const normalized = (data as Member[]).map(normalizeMemberRecord);
          const existingNos = new Set(normalized.map((m) => m.student_number));
          const missingBase = INITIAL_MEMBERS.filter((m) => !existingNos.has(m.student_number)).map(
            normalizeMemberRecord
          );
          return [...missingBase, ...normalized];
        }
      } catch (err) {
        console.warn('Supabase getMembers error:', err);
      }
    }

    const bundle = await this.getDashboardBundle();
    return bundle.members;
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

    const deltas = await readCloudCollection<MemberDeltas>('member_deltas', {
      overrides: {},
      added: []
    });
    const updatedDeltas: MemberDeltas = {
      overrides: deltas.overrides || {},
      added: [newMember, ...(Array.isArray(deltas.added) ? deltas.added : [])]
    };
    await writeCloudCollection('member_deltas', updatedDeltas);
    return newMember;
  },

  async updateMemberPenalty(
    memberId: string,
    penaltyCount: number,
    reason: string
  ): Promise<boolean> {
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

    const deltas = await readCloudCollection<MemberDeltas>('member_deltas', {
      overrides: {},
      added: []
    });
    const overrides = { ...(deltas.overrides || {}) };
    overrides[memberId] = {
      ...(overrides[memberId] || {}),
      penalty_count: penaltyCount,
      penalty_reason: reason,
      status: newStatus as any
    };

    return await writeCloudCollection('member_deltas', {
      overrides,
      added: Array.isArray(deltas.added) ? deltas.added : []
    });
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

        if (!error && data && data.length > 0) return data as Announcement[];
      } catch (err) {
        console.warn('Supabase getAnnouncements error:', err);
      }
    }

    const bundle = await this.getDashboardBundle();
    return bundle.announcements;
  },

  async createAnnouncement(
    payload: Omit<Announcement, 'id' | 'created_at'>
  ): Promise<Announcement> {
    const newAnn: Announcement = {
      ...payload,
      id: isSupabaseConfigured() ? crypto.randomUUID() : `ann-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .insert([newAnn])
          .select()
          .single();
        if (!error && data) return data as Announcement;
      } catch (err) {
        console.warn('Supabase createAnnouncement error:', err);
      }
    }

    const current = await readCloudCollection<Announcement[]>(
      'announcements',
      INITIAL_ANNOUNCEMENTS
    );
    await writeCloudCollection('announcements', [newAnn, ...current]);
    return newAnn;
  },

  async updateAnnouncement(
    id: string,
    updates: Partial<Announcement>
  ): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('announcements')
          .update(updates)
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase updateAnnouncement error:', err);
      }
    }

    const current = await readCloudCollection<Announcement[]>(
      'announcements',
      INITIAL_ANNOUNCEMENTS
    );
    const updated = current.map((a) => (a.id === id ? { ...a, ...updates } : a));
    return await writeCloudCollection('announcements', updated);
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteAnnouncement error:', err);
      }
    }

    const current = await readCloudCollection<Announcement[]>(
      'announcements',
      INITIAL_ANNOUNCEMENTS
    );
    const updated = current.filter((a) => a.id !== id);
    return await writeCloudCollection('announcements', updated);
  },

  async getGallery(): Promise<GalleryItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('gallery_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) return data as GalleryItem[];
      } catch (err) {
        console.warn('Supabase getGallery error:', err);
      }
    }

    return INITIAL_GALLERY;
  },

  // ==========================================
  // 6. KARANLIK ODA (DARKROOM) İŞLEMLERİ
  // ==========================================
  async getDarkroomSlots(): Promise<DarkroomSlot[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('darkroom_slots')
          .select('*')
          .order('date', { ascending: true });
        if (!error && data) return data as DarkroomSlot[];
      } catch (err) {
        console.warn('Supabase getDarkroomSlots error:', err);
      }
    }
    const bundle = await this.getDashboardBundle();
    return bundle.darkroomSlots;
  },

  async getDarkroomSlotsByDate(date: string): Promise<DarkroomSlot[]> {
    const all = await this.getDarkroomSlots();
    return all.filter((s) => s.date === date && s.is_active !== false);
  },

  getStandardDarkroomTemplates() {
    return STANDARD_DARKROOM_TEMPLATES;
  },

  async createDarkroomSlot(slot: Omit<DarkroomSlot, 'id'>): Promise<DarkroomSlot> {
    const uniqueId = `dslot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newSlot: DarkroomSlot = {
      ...slot,
      id: uniqueId,
      is_active: slot.is_active !== undefined ? slot.is_active : true,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('darkroom_slots')
          .insert([newSlot])
          .select()
          .single();
        if (!error && data) return data as DarkroomSlot;
      } catch (err) {
        console.warn('Supabase createDarkroomSlot error:', err);
      }
    }

    const current = await readCloudCollection<DarkroomSlot[]>(
      'darkroom_slots',
      DARKROOM_SLOTS
    );
    const updated = [newSlot, ...current];
    await writeCloudCollection('darkroom_slots', updated);
    return newSlot;
  },

  async createBulkDarkroomSlots(
    slots: Array<Omit<DarkroomSlot, 'id'>>
  ): Promise<DarkroomSlot[]> {
    const createdNow = new Date().toISOString();
    const newSlots: DarkroomSlot[] = slots.map((s, idx) => ({
      ...s,
      id: `dslot-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      is_active: s.is_active !== undefined ? s.is_active : true,
      created_at: createdNow
    }));

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('darkroom_slots')
          .insert(newSlots)
          .select();
        if (!error && data) return data as DarkroomSlot[];
      } catch (err) {
        console.warn('Supabase createBulkDarkroomSlots error:', err);
      }
    }

    const current = await readCloudCollection<DarkroomSlot[]>(
      'darkroom_slots',
      DARKROOM_SLOTS
    );
    const updated = [...newSlots, ...current];
    await writeCloudCollection('darkroom_slots', updated);
    return newSlots;
  },

  async deleteDarkroomSlot(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('darkroom_slots').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteDarkroomSlot error:', err);
      }
    }

    const current = await readCloudCollection<DarkroomSlot[]>(
      'darkroom_slots',
      DARKROOM_SLOTS
    );
    const updated = current.filter((s) => s.id !== id);
    return await writeCloudCollection('darkroom_slots', updated);
  },

  async toggleDarkroomSlot(id: string, is_active: boolean): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('darkroom_slots')
          .update({ is_active })
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase toggleDarkroomSlot error:', err);
      }
    }

    const current = await readCloudCollection<DarkroomSlot[]>(
      'darkroom_slots',
      DARKROOM_SLOTS
    );
    const updated = current.map((s) => (s.id === id ? { ...s, is_active } : s));
    return await writeCloudCollection('darkroom_slots', updated);
  },

  async getDarkroomReservations(): Promise<DarkroomReservation[]> {
    if (isSupabaseConfigured()) {
      try {
        const [resData, members] = await Promise.all([
          supabase.from('darkroom_reservations').select('*').order('created_at', { ascending: false }),
          this.getMembers()
        ]);
        if (!resData.error && resData.data) {
          const memberById = new Map<string, Member>();
          const memberByNo = new Map<string, Member>();
          members.forEach((m) => {
            memberById.set(m.id, m);
            memberByNo.set(m.student_number, m);
          });
          return (resData.data as DarkroomReservation[]).map((r) => ({
            ...r,
            member: memberById.get(r.member_id) || memberByNo.get(r.student_number)
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
    return all.filter(
      (r) => r.date === date && r.status !== 'cancelled' && r.status !== 'rejected'
    );
  },

  async createDarkroomReservation(
    data: Omit<DarkroomReservation, 'id' | 'reservation_code' | 'created_at' | 'status'> & {
      status?: DarkroomStatus;
    }
  ): Promise<DarkroomReservation> {
    const current = await this.getDarkroomReservations();

    const isSlotTaken = current.some(
      (r) =>
        r.date === data.date &&
        r.slot_id === data.slot_id &&
        (r.status === 'approved' || r.status === 'pending' || r.status === 'completed')
    );

    if (isSlotTaken) {
      throw new Error(
        'Seçtiğiniz tarih ve seans saati maalesef az önce başka bir üye tarafından rezerve edildi. Lütfen başka bir seans seçiniz.'
      );
    }

    if (data.process_type === 'bw_film' || data.process_type === 'photo_print') {
      const opposingType = data.process_type === 'bw_film' ? 'photo_print' : 'bw_film';
      const hasConflict = current.some(
        (r) =>
          (r.student_number === data.student_number || r.member_id === data.member_id) &&
          r.date === data.date &&
          r.process_type === opposingType &&
          r.status !== 'cancelled' &&
          r.status !== 'rejected'
      );

      if (hasConflict) {
        throw new Error(
          'Film yıkama ve kağıda fotoğraf baskısı aynı güne alınamaz. Banyonun kuruması ve laboratuvar düzeni gereği baskı için lütfen farklı bir gün seçiniz.'
        );
      }
    }

    const uniqueId = `ko-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const randomCodeSuffix = Math.floor(100 + Math.random() * 900);
    const { member: _ignoredMember, ...cleanData } = data as DarkroomReservation;
    const newReservation: DarkroomReservation = {
      ...cleanData,
      id: uniqueId,
      reservation_code: `KO-2026-${randomCodeSuffix}`,
      status: data.status || 'pending',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('darkroom_reservations').insert([newReservation]);
      } catch (err) {
        console.warn('Supabase createDarkroomReservation error:', err);
      }
    }

    const updated = [
      newReservation,
      ...current.map(({ member, ...rest }) => rest as DarkroomReservation)
    ];
    await writeCloudCollection('darkroom', updated);

    const members = await this.getMembers();
    return {
      ...newReservation,
      member: members.find(
        (m) => m.id === newReservation.member_id || m.student_number === newReservation.student_number
      )
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
    if (isSupabaseConfigured()) {
      try {
        const updates: Record<string, unknown> = { status };
        if (meta?.approved_by !== undefined) updates.approved_by = meta.approved_by;
        if (status === 'approved') updates.approved_at = new Date().toISOString();
        if (meta?.rejection_reason !== undefined) updates.rejection_reason = meta.rejection_reason;
        if (meta?.supervisor !== undefined) updates.supervisor = meta.supervisor;
        await supabase.from('darkroom_reservations').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateDarkroomReservationStatus error:', err);
      }
    }

    const current = await readCloudCollection<DarkroomReservation[]>(
      'darkroom',
      INITIAL_DARKROOM_RESERVATIONS
    );
    const updated = current.map(({ member, ...r }) => {
      if (r.id === id) {
        return {
          ...r,
          status,
          approved_by: meta?.approved_by !== undefined ? meta.approved_by : r.approved_by,
          approved_at: status === 'approved' ? new Date().toISOString() : r.approved_at,
          rejection_reason:
            meta?.rejection_reason !== undefined ? meta.rejection_reason : r.rejection_reason,
          supervisor:
            meta?.supervisor !== undefined ? meta.supervisor : meta?.approved_by || r.supervisor
        };
      }
      return r;
    });

    return await writeCloudCollection('darkroom', updated);
  },

  async deleteDarkroomReservation(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('darkroom_reservations').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteDarkroomReservation error:', err);
      }
    }

    const current = await readCloudCollection<DarkroomReservation[]>(
      'darkroom',
      INITIAL_DARKROOM_RESERVATIONS
    );
    const updated = current
      .filter((r) => r.id !== id)
      .map(({ member, ...rest }) => rest as DarkroomReservation);
    return await writeCloudCollection('darkroom', updated);
  },

  // ==========================================
  // 7. KULÜP GEZİLERİ (TRIPS) YÖNETİMİ
  // ==========================================
  async getTrips(): Promise<Trip[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .order('start_date', { ascending: true });
        if (!error && data) {
          return data as Trip[];
        }
      } catch (err) {
        console.warn('Supabase getTrips error:', err);
      }
    }

    const bundle = await this.getDashboardBundle();
    return bundle.trips;
  },

  async getActiveTrips(): Promise<Trip[]> {
    const trips = await this.getTrips();
    return trips.filter((t) => t.is_active);
  },

  async getTripById(id: string): Promise<Trip | null> {
    const trips = await this.getTrips();
    return trips.find((t) => t.id === id) || null;
  },

  async createTrip(tripData: Omit<Trip, 'id' | 'created_at'>): Promise<Trip> {
    const newTrip: Trip = {
      ...tripData,
      id: `trip-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('trips')
          .insert([newTrip])
          .select()
          .single();
        if (!error && data) return data as Trip;
      } catch (err) {
        console.warn('Supabase createTrip error:', err);
      }
    }

    const current = await readCloudCollection<Trip[]>('trips', INITIAL_TRIPS);
    const updated = [newTrip, ...current];
    await writeCloudCollection('trips', updated);
    return newTrip;
  },

  async updateTrip(id: string, updates: Partial<Trip>): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('trips').update(updates).eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase updateTrip error:', err);
      }
    }

    const current = await readCloudCollection<Trip[]>('trips', INITIAL_TRIPS);
    const updated = current.map((t) => (t.id === id ? { ...t, ...updates } : t));
    return await writeCloudCollection('trips', updated);
  },

  async deleteTrip(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('trips').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteTrip error:', err);
      }
    }

    const current = await readCloudCollection<Trip[]>('trips', INITIAL_TRIPS);
    const updated = current.filter((t) => t.id !== id);
    return await writeCloudCollection('trips', updated);
  },

  // ==========================================
  // 8. ÜYE STATÜSÜ (AKTİF / NORMAL ÜYE) İŞLEMLERİ
  // ==========================================
  async updateMemberType(
    id: string,
    memberType: 'active' | 'normal' | 'honorary' | 'honorary_active'
  ): Promise<boolean> {
    const notesText =
      memberType === 'honorary_active'
        ? 'YTÜFOK Fahri Aktif Üyesi (Aktif Öncelik: Gezilerden 5 gün önce & Bireysel Çekim)'
        : memberType === 'honorary'
        ? 'YTÜFOK Fahri Üyesi (Normal Öncelik: Gezilerden 3 gün önce)'
        : memberType === 'active'
        ? 'YTÜFOK Aktif Üyesi (Aktif Öncelik: Gezilerden 5 gün önce)'
        : 'Normal Kulüp Üyesi (Normal Öncelik: Gezilerden 3 gün önce)';

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('members')
          .update({ member_type: memberType, notes: notesText })
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase updateMemberType error:', err);
      }
    }

    const deltas = await readCloudCollection<MemberDeltas>('member_deltas', {
      overrides: {},
      added: []
    });
    const overrides = { ...(deltas.overrides || {}) };
    overrides[id] = {
      ...(overrides[id] || {}),
      member_type: memberType,
      notes: notesText
    };

    return await writeCloudCollection('member_deltas', {
      overrides,
      added: Array.isArray(deltas.added) ? deltas.added : []
    });
  },

  async quickRegisterNormalMember(
    studentNumber: string,
    fullName: string,
    department: string
  ): Promise<{ success: boolean; member?: Member; message: string }> {
    const cleanNumber = studentNumber.trim();
    const cleanName = fullName.trim();
    const cleanDept = department.trim() || 'Yıldız Teknik Üniversitesi';

    if (!cleanNumber || !cleanName) {
      return {
        success: false,
        message: 'Lütfen öğrenci numarası ve ad-soyad alanlarını doldurunuz.'
      };
    }

    const members = await this.getMembers();
    const existing = members.find(
      (m) =>
        m.student_number.toLowerCase().replace(/[\s\.\-_]/g, '') ===
        cleanNumber.toLowerCase().replace(/[\s\.\-_]/g, '')
    );
    if (existing) {
      return {
        success: true,
        member: existing,
        message: `Öğrenci zaten kayıtlı: ${existing.full_name}`
      };
    }

    const newMember: Member = {
      id: isSupabaseConfigured() ? crypto.randomUUID() : `m-norm-${Date.now()}`,
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

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('members')
          .insert([newMember])
          .select()
          .single();
        if (!error && data) {
          return {
            success: true,
            member: data as Member,
            message: `Normal üye kaydınız başarıyla oluşturuldu: ${cleanName}`
          };
        }
      } catch (err) {
        console.warn('Supabase quickRegisterNormalMember error:', err);
      }
    }

    const deltas = await readCloudCollection<MemberDeltas>('member_deltas', {
      overrides: {},
      added: []
    });
    await writeCloudCollection('member_deltas', {
      overrides: deltas.overrides || {},
      added: [newMember, ...(Array.isArray(deltas.added) ? deltas.added : [])]
    });

    return {
      success: true,
      member: newMember,
      message: `Normal üye kaydınız başarıyla oluşturuldu: ${cleanName}`
    };
  }
};
