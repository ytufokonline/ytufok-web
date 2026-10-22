export type EquipmentCategory = 'camera' | 'lens' | 'analog' | 'lighting' | 'tripod' | 'accessory';

export type EquipmentStatus = 'available' | 'reserved' | 'in_use' | 'maintenance';

export type ReservationStatus = 
  | 'pending'     // Onay Bekliyor
  | 'approved'    // Yönetim Tarafından Onaylandı
  | 'rejected'    // Reddedildi
  | 'in_use'      // Teslim Edildi / Kullanımda
  | 'returned'    // İade Alındı / Tamamlandı
  | 'overdue'     // Gecikmede / Süresi Geçti
  | 'cancelled';  // İptal Edildi

export type MemberStatus = 'active' | 'suspended' | 'passive';
export type MemberRole = 'member' | 'board' | 'audit' | 'admin';
export type MemberType = 'board' | 'audit' | 'active' | 'normal' | 'honorary' | 'honorary_active';

export interface Member {
  id: string;
  student_number: string;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  membership_year?: number;
  status: MemberStatus;
  member_type?: MemberType; // Aktif Üye veya Normal Üye
  penalty_count: number;
  penalty_reason?: string | null;
  role: MemberRole;
  notes?: string | null;
  created_at?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serial_number: string;
  description: string;
  specs: Record<string, string>;
  package_contents: string[];
  image_url: string;
  status: EquipmentStatus;
  current_condition?: string;
  created_at?: string;
}

export type BoardRole = 
  | 'president'           // Kulüp Başkanı
  | 'vice_president_1'    // Başkan Yardımcısı (1)
  | 'vice_president_2'    // Başkan Yardımcısı (2)
  | 'treasurer'           // Sayman
  | 'secretary'           // Genel Sekreter
  | 'social_media'        // Sosyal Medya Koordinatörü
  | 'trip_coordinator'    // Gezi Koordinatörü
  | 'sponsorship';        // Sponsorluk Koordinatörü

export interface AdminProfile {
  id: string;
  role: BoardRole;
  title: string;
  short_title: string;
  full_name: string;
  student_number: string;
  email?: string;
  phone: string;
  avatar_color: string;
  pin?: string;
  pin_updated_at?: string;
}

export interface Trip {
  id: string;
  title: string;              // örn: "Kapadokya Fotoğraf Gezisi"
  destination: string;        // örn: "Kapadokya / Nevşehir"
  start_date: string;         // "YYYY-MM-DD"
  end_date: string;           // "YYYY-MM-DD"
  description?: string;       // Gezi rotası ve açıklaması
  is_active: boolean;         // Rezerve edilebilir mi
  created_at: string;
  created_by?: string;        // Ekleyen yönetici
}

export interface Reservation {
  id: string;
  reservation_code: string;
  equipment_id: string;
  member_id: string;
  student_number: string;
  phone?: string;
  pickup_date: string;
  return_date: string;
  purpose: string;
  trip_id?: string | null;     // Bağlı olduğu kulüp gezisi (varsa)
  additional_notes?: string | null;
  status: ReservationStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  checked_out_at?: string | null;
  checked_out_by?: string | null;
  returned_at?: string | null;
  returned_to?: string | null;
  return_condition_notes?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string;
  // Joins / Populated
  equipment?: Equipment;
  member?: Member;
  trip?: Trip | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  photographer_name: string;
  camera_used: string;
  location: string;
  image_url: string;
  created_at: string;
}

// ==========================================
// KARANLIK ODA (DARKROOM) SİSTEMİ TİPLERİ
// ==========================================

export type DarkroomProcessType = 
  | 'bw_film'     // Siyah-Beyaz Film Yıkama (35mm / 120)
  | 'photo_print' // Kağıda Fotoğraf Baskısı (Agrandisör ile)
  | 'film_scan';  // Film Tarama (Negatif Film Tarayıcı)

export type DarkroomStatus = 
  | 'pending'    // Onay Bekliyor
  | 'approved'   // Yönetim Tarafından Onaylandı
  | 'completed'  // Seans Tamamlandı
  | 'cancelled'  // İptal Edildi
  | 'rejected';  // Reddedildi

export type DarkroomSlotProcessPermission = 'all' | 'film_wash' | 'photo_print';

export interface DarkroomSlot {
  id: string;             // örn: "slot-1728..."
  date: string;           // "YYYY-MM-DD"
  startTime: string;      // "10:00"
  endTime: string;        // "11:30"
  durationMinutes: number;// 90 (1,5 saat)
  label: string;          // "1. Seans (10:00 - 11:30)" veya "10:00 - 11:30"
  allowed_process: DarkroomSlotProcessPermission; // 'all' (Film Yıkama & Baskı), 'film_wash' (Yalnızca Yıkama/Tarama), 'photo_print' (Yalnızca Kağıda Baskı)
  supervisor?: string;    // Nöbetçi yönetici (örn: "Yavuz Selim Bahadır")
  notes?: string;         // Ek açıklama
  is_active: boolean;     // Seans açık mı (yönetici kapatabilir)
  created_at?: string;
  created_by?: string;
}

export interface DarkroomSlotTemplate {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  label: string;
}

export interface DarkroomReservation {
  id: string;
  reservation_code: string; // örn: "KO-2026-042"
  member_id: string;
  student_number: string;
  department?: string;     // Hangi bölümde okuyorsunuz
  date: string;            // "YYYY-MM-DD"
  slot_id: string;
  slot_time: string;       // "10:00 - 11:30"
  process_type: DarkroomProcessType;
  
  // Film Yıkama & Karanlık Oda Deneyim Soruları
  has_washed_film_before?: boolean;       // Daha önce film yıkadınız mı
  has_entered_darkroom_before?: boolean;   // Daha önce karanlık odaya girdiniz mi
  knows_darkroom_rules?: boolean;          // Karanlık oda kurallarını biliyor musunuz
  film_count: number;                      // Kaç film yıkayacak / basacak
  film_brands_and_asa?: string | null;     // Birden fazla ise film marka ve ASA değerleri
  different_asa_warning_ack?: boolean;     // Aynı değilse işlem süresi uzar uyarısı
  paper_size?: string | null;              // Fotoğraf baskısı kağıt ebadı

  chemical_source: 'club' | 'personal';    // Kulüp Kimyasalları / Kendi Kimyası
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  needs_assistance: boolean;
  notes?: string | null;
  status: DarkroomStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  supervisor?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  member?: Member;
}
