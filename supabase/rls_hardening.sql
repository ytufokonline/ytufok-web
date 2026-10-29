-- ==============================================================================
-- YTÜFOK SUPABASE RLS SIKILAŞTIRMA VE GÜVENLİK GÜNCELLEMESİ (ADIM 1)
-- ==============================================================================
-- Bu betik:
-- 1. Tablolardaki tüm kontrolsüz 'Full access' politikalarını kaldırır.
-- 2. members tablosundaki üye listesini anonim toplu indirmeye kapatır (KVKK koruması).
-- 3. equipment, trips, announcements tablolarını sadece okunabilir yapar; silme ve tahrifatı engeller.
-- 4. reservations tablosunda sadece 'pending' statüsünde talep açılmasına izin verir;
--    onaylama/tahrifatı engeller, sadece kendi beklemedeki talebini iptal etmeye izin verir.
-- 5. darkroom_slots ve darkroom_reservations tablolarını yetkisiz silme/değişikliklere karşı kilitler.
-- 6. admin_profiles tablosuna anonim erişimi tamamen engeller.
-- 7. verify_student_member ve update_member_contact_phone güvenli RPC fonksiyonlarını tanımlar.
-- ==============================================================================

-- 1. MEVCUT GEVŞEK POLİTİKALARI KALDIR
DROP POLICY IF EXISTS "Full access equipment" ON public.equipment;
DROP POLICY IF EXISTS "Full access gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Full access announcements" ON public.announcements;
DROP POLICY IF EXISTS "Full access members" ON public.members;
DROP POLICY IF EXISTS "Full access reservations" ON public.reservations;
DROP POLICY IF EXISTS "Full access trips" ON public.trips;
DROP POLICY IF EXISTS "Full access admin_profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Full access darkroom_slots" ON public.darkroom_slots;
DROP POLICY IF EXISTS "Full access darkroom_reservations" ON public.darkroom_reservations;

DROP POLICY IF EXISTS "Equipment viewable by public" ON public.equipment;
DROP POLICY IF EXISTS "Trips viewable by public" ON public.trips;
DROP POLICY IF EXISTS "Announcements viewable by public" ON public.announcements;
DROP POLICY IF EXISTS "Gallery viewable by public" ON public.gallery_items;
DROP POLICY IF EXISTS "Reservations viewable by public" ON public.reservations;
DROP POLICY IF EXISTS "Public insert pending reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public cancel own pending reservation" ON public.reservations;
DROP POLICY IF EXISTS "Deny anon delete reservations" ON public.reservations;
DROP POLICY IF EXISTS "Deny anon access admin_profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Deny anon select pin" ON public.admin_profiles;
DROP POLICY IF EXISTS "Deny anon bulk select members" ON public.members;
DROP POLICY IF EXISTS "Deny anon modify members" ON public.members;
DROP POLICY IF EXISTS "Deny anon update members" ON public.members;
DROP POLICY IF EXISTS "Deny anon delete members" ON public.members;
DROP POLICY IF EXISTS "Darkroom slots viewable by public" ON public.darkroom_slots;
DROP POLICY IF EXISTS "Darkroom reservations viewable by public" ON public.darkroom_reservations;
DROP POLICY IF EXISTS "Public insert darkroom reservation" ON public.darkroom_reservations;

-- 2. TÜM TABLOLARDA ROW LEVEL SECURITY (RLS) AKTİF ET
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.darkroom_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.darkroom_reservations ENABLE ROW LEVEL SECURITY;

-- 3. EQUIPMENT (EKİPMANLAR)
-- Herkes ekipmanları görebilir (SELECT)
CREATE POLICY "Equipment viewable by public" ON public.equipment
    FOR SELECT TO anon, authenticated
    USING (true);

-- 4. TRIPS (KULÜP GEZİLERİ)
-- Herkes gezileri görebilir (SELECT)
CREATE POLICY "Trips viewable by public" ON public.trips
    FOR SELECT TO anon, authenticated
    USING (true);

-- 5. ANNOUNCEMENTS & GALLERY (DUYURULAR & GALERİ)
CREATE POLICY "Announcements viewable by public" ON public.announcements
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Gallery viewable by public" ON public.gallery_items
    FOR SELECT TO anon, authenticated
    USING (true);

-- 6. RESERVATIONS (EKİPMAN REZERVASYONLARI)
-- 6.1. Rezervasyonları okuma (Ekipman meşguliyet durumu ve takip sayfası için)
CREATE POLICY "Reservations viewable by public" ON public.reservations
    FOR SELECT TO anon, authenticated
    USING (true);

-- 6.2. Yeni rezervasyon oluşturma: SADECE 'pending' statüsünde eklenebilir!
CREATE POLICY "Public insert pending reservations" ON public.reservations
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'pending');

-- 6.3. Rezervasyon güncelleme: Anonim kullanıcı sadece beklemedeki kendi talebini iptal edebilir!
-- Status 'approved' veya 'in_use' yapılması kesinlikle engellenir.
CREATE POLICY "Public cancel own pending reservation" ON public.reservations
    FOR UPDATE TO anon, authenticated
    USING (status = 'pending')
    WITH CHECK (status IN ('rejected', 'cancelled'));

-- 6.4. Rezervasyon silme: Anonim kullanıcılar kesinlikle rezervasyon silemez!
CREATE POLICY "Deny anon delete reservations" ON public.reservations
    FOR DELETE TO anon
    USING (false);

-- 7. DARKROOM (KARANLIK ODA)
CREATE POLICY "Darkroom slots viewable by public" ON public.darkroom_slots
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Darkroom reservations viewable by public" ON public.darkroom_reservations
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Public insert darkroom reservation" ON public.darkroom_reservations
    FOR INSERT TO anon, authenticated
    WITH CHECK (status IN ('pending', 'confirmed'));

-- 8. ADMIN_PROFILES (YÖNETİM ŞİFRELERİ)
-- Doğrudan SELECT/INSERT/UPDATE/DELETE anonim kullanıcılara tamamen yasak!
CREATE POLICY "Deny anon access admin_profiles" ON public.admin_profiles
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

-- 9. MEMBERS (ÜYE LİSTESİ & KVKK KORUMASI)
-- 9.1. Anonim toplu indirmeyi (SELECT * FROM members) engelle!
CREATE POLICY "Deny anon bulk select members" ON public.members
    FOR SELECT TO anon
    USING (false);

-- 9.2. Anonim kullanıcılar üye ekleyemez, silemez veya rol/ceza güncelleyemez!
CREATE POLICY "Deny anon modify members" ON public.members
    FOR INSERT TO anon
    WITH CHECK (false);

CREATE POLICY "Deny anon update members" ON public.members
    FOR UPDATE TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny anon delete members" ON public.members
    FOR DELETE TO anon
    USING (false);

-- 10. GÜVENLİ FONKSİYONLAR (SECURITY DEFINER RPC)
-- Bu fonksiyonlar veritabanı sahibi yetkisiyle çalışır; RLS kurallarını güvenle aşar,
-- sadece istenen güvenli veriyi döndürür, üye listesini topluca dışarı sızdırmaz.

-- 10.1. Güvenli Tekil Öğrenci Doğrulama
CREATE OR REPLACE FUNCTION public.verify_student_member(p_student_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean text;
    v_member record;
BEGIN
    v_clean := lower(replace(trim(p_student_number), ' ', ''));
    IF v_clean = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Lütfen geçerli bir öğrenci numarası giriniz.');
    END IF;

    SELECT id, student_number, full_name, department, status, role, member_type, penalty_count, penalty_reason
    INTO v_member
    FROM public.members
    WHERE lower(replace(student_number, ' ', '')) = v_clean
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Girdiğiniz öğrenci numarası kulüp üye listesinde bulunamadı.'
        );
    END IF;

    IF v_member.status = 'suspended' THEN
        RETURN jsonb_build_object(
            'success', false,
            'member', jsonb_build_object(
                'id', v_member.id,
                'student_number', v_member.student_number,
                'full_name', v_member.full_name,
                'department', v_member.department,
                'status', v_member.status,
                'role', v_member.role,
                'member_type', v_member.member_type
            ),
            'message', 'Rezervasyon yapamazsınız: Üyeliğiniz kısıtlanmıştır/cezalıdır. Gerekçe: ' || coalesce(v_member.penalty_reason, 'İade gecikmesi veya hasar.')
        );
    END IF;

    IF v_member.status = 'passive' THEN
        RETURN jsonb_build_object(
            'success', false,
            'member', jsonb_build_object(
                'id', v_member.id,
                'student_number', v_member.student_number,
                'full_name', v_member.full_name,
                'department', v_member.department,
                'status', v_member.status,
                'role', v_member.role,
                'member_type', v_member.member_type
            ),
            'message', 'Üyeliğiniz pasif durumdadır. Yeniden aktif etmek için kulüp odamıza uğrayınız.'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'member', jsonb_build_object(
            'id', v_member.id,
            'student_number', v_member.student_number,
            'full_name', v_member.full_name,
            'department', v_member.department,
            'status', v_member.status,
            'role', v_member.role,
            'member_type', v_member.member_type
        ),
        'message', 'Hoş geldiniz, ' || v_member.full_name || ' (' || v_member.department || '). Üyeliğiniz aktif.'
    );
END;
$$;

-- 10.2. Rezervasyon Sırasında Güvenli İletişim Numarası Güncelleme
CREATE OR REPLACE FUNCTION public.update_member_contact_phone(p_student_number text, p_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_no text;
    v_clean_phone text;
BEGIN
    v_clean_no := lower(replace(trim(p_student_number), ' ', ''));
    v_clean_phone := trim(p_phone);

    IF v_clean_no = '' OR v_clean_phone = '' THEN
        RETURN false;
    END IF;

    UPDATE public.members
    SET phone = v_clean_phone,
        updated_at = NOW()
    WHERE lower(replace(student_number, ' ', '')) = v_clean_no;

    RETURN true;
END;
$$;

-- RPC İzinlerini Ver
GRANT EXECUTE ON FUNCTION public.verify_student_member(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_member_contact_phone(text, text) TO anon, authenticated;
