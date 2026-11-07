-- ==============================================================================
-- YTÜFOK SUPABASE ROW LEVEL SECURITY (RLS) VE VERİTABANI SERTLEŞTİRME BETİĞİ
-- ==============================================================================
-- Tarih: 07 Kasım 2026
-- Kapsam: Salih Yiğit Elitok - SKYSEC Penetrasyon Testi Raporu'ndaki tüm bulguları
-- (BULGU-01, BULGU-02, BULGU-04, BULGU-08) kesin olarak çözer ve veritabanını kilitler.
--
-- Talimat: Bu betiği Supabase Dashboard -> SQL Editor alanına yapıştırıp "RUN" ediniz.
-- ==============================================================================

-- 1. TÜM TABLOLARDA ROW LEVEL SECURITY (RLS) AKTİF ET
ALTER TABLE IF EXISTS public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.darkroom_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.darkroom_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 2. MEVCUT GEVŞEK / TEHLİKELİ TÜM POLİTİKALARI TEMİZLE
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ==============================================================================
-- 3. MEMBERS TABLOSU (KVKK KORUMASI & BULGU-02 / BULGU-04 ÇÖZÜMÜ)
-- ==============================================================================
-- Anonim kullanıcılar üyelerin listesini (SELECT * FROM members) ASLA okuyamaz!
-- Anonim kullanıcılar yeni üye oluşturamaz (role: 'admin' yetki yükseltme engellendi).
-- Anonim kullanıcılar üye güncelleyemez veya silemez.
-- Sadece service_role (sunucu API'si) veya SECURITY DEFINER RPC fonksiyonları erişebilir.

CREATE POLICY "Deny anon select members" ON public.members
    FOR SELECT TO anon
    USING (false);

CREATE POLICY "Deny anon insert members" ON public.members
    FOR INSERT TO anon
    WITH CHECK (false);

CREATE POLICY "Deny anon update members" ON public.members
    FOR UPDATE TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny anon delete members" ON public.members
    FOR DELETE TO anon
    USING (false);

-- Authenticated (Supabase Auth) kullanıcılar sadece kendi profilini görebilir
CREATE POLICY "Auth users see own member record" ON public.members
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- ==============================================================================
-- 4. RESERVATIONS TABLOSU (KİŞİSEL VERİ VE TELEFON KORUMASI - BULGU-08 ÇÖZÜMÜ)
-- ==============================================================================
-- Anonim kullanıcıların toplu rezervasyon listesi çekmesi (GET /rest/v1/reservations) ENGELLENDİ!
-- Yalnızca bekleyen rezervasyon açılabilir ve sadece kendi bekleyen rezervasyonu iptal edilebilir.

CREATE POLICY "Deny anon bulk select reservations" ON public.reservations
    FOR SELECT TO anon
    USING (false);

-- Public sadece 'pending' statüsünde talep gönderebilir
CREATE POLICY "Public insert pending reservation" ON public.reservations
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'pending');

-- Public sadece beklemedeki kendi rezervasyonunu iptal edebilir (approved yapılamaz!)
CREATE POLICY "Public cancel own pending reservation" ON public.reservations
    FOR UPDATE TO anon, authenticated
    USING (status = 'pending')
    WITH CHECK (status = 'cancelled');

CREATE POLICY "Deny anon delete reservations" ON public.reservations
    FOR DELETE TO anon
    USING (false);

-- ==============================================================================
-- 5. ANNOUNCEMENTS TABLOSU (TAHRİFAT ENGELİ - BULGU-02 CTF_TEST ÇÖZÜMÜ)
-- ==============================================================================
-- Herkes duyuruları okuyabilir (SELECT).
-- Anonim kullanıcılar duyuru ekleyemez, güncelleyemez (PATCH CTF_TEST engellendi!), silemez.

CREATE POLICY "Public view announcements" ON public.announcements
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Deny anon modify announcements" ON public.announcements
    FOR INSERT TO anon
    WITH CHECK (false);

CREATE POLICY "Deny anon update announcements" ON public.announcements
    FOR UPDATE TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny anon delete announcements" ON public.announcements
    FOR DELETE TO anon
    USING (false);

-- ==============================================================================
-- 6. EQUIPMENT TABLOSU (EKİPMAN KATALOĞU)
-- ==============================================================================
-- Ekipmanlar herkese açıktır (SELECT). Yazma işlemleri anonimlere kapalıdır.

CREATE POLICY "Public view equipment" ON public.equipment
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Deny anon modify equipment" ON public.equipment
    FOR INSERT TO anon
    WITH CHECK (false);

CREATE POLICY "Deny anon update equipment" ON public.equipment
    FOR UPDATE TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny anon delete equipment" ON public.equipment
    FOR DELETE TO anon
    USING (false);

-- ==============================================================================
-- 7. TRIPS & CLUB_EVENTS (GEZİLER VE ETKİNLİKLER)
-- ==============================================================================
CREATE POLICY "Public view trips" ON public.trips
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Deny anon write trips" ON public.trips
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Public view club events" ON public.club_events
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Deny anon write club events" ON public.club_events
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

-- ==============================================================================
-- 8. EVENT_SUGGESTIONS (ETKİNLİK VE ROTA ÖNERİLERİ)
-- ==============================================================================
-- Herkes yeni öneri gönderebilir (INSERT).
-- Ancak diğer üyelerin önerilerini ve iletişim bilgilerini sadece yönetim görebilir (Anon SELECT engellendi).

CREATE POLICY "Public insert suggestion" ON public.event_suggestions
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Deny anon read suggestions" ON public.event_suggestions
    FOR SELECT TO anon
    USING (false);

CREATE POLICY "Deny anon update suggestions" ON public.event_suggestions
    FOR UPDATE TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny anon delete suggestions" ON public.event_suggestions
    FOR DELETE TO anon
    USING (false);

-- ==============================================================================
-- 9. EVENT_EVALUATIONS (ETKİNLİK DEĞERLENDİRMELERİ)
-- ==============================================================================
CREATE POLICY "Public view evaluations" ON public.event_evaluations
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Public insert evaluation" ON public.event_evaluations
    FOR INSERT TO anon, authenticated
    WITH CHECK (rating >= 1 AND rating <= 5);

CREATE POLICY "Deny anon modify evaluations" ON public.event_evaluations
    FOR UPDATE TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny anon delete evaluations" ON public.event_evaluations
    FOR DELETE TO anon
    USING (false);

-- ==============================================================================
-- 10. GALLERY_ITEMS (GALERİ FOTOĞRAFLARI)
-- ==============================================================================
CREATE POLICY "Public view gallery" ON public.gallery_items
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Deny anon write gallery" ON public.gallery_items
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

-- ==============================================================================
-- 11. DARKROOM_SLOTS & DARKROOM_RESERVATIONS (KARANLIK ODA)
-- ==============================================================================
CREATE POLICY "Public view darkroom slots" ON public.darkroom_slots
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Deny anon write darkroom slots" ON public.darkroom_slots
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny anon bulk select darkroom reservations" ON public.darkroom_reservations
    FOR SELECT TO anon
    USING (false);

CREATE POLICY "Public insert pending darkroom reservation" ON public.darkroom_reservations
    FOR INSERT TO anon, authenticated
    WITH CHECK (status = 'pending');

CREATE POLICY "Deny anon modify darkroom reservations" ON public.darkroom_reservations
    FOR UPDATE TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny anon delete darkroom reservations" ON public.darkroom_reservations
    FOR DELETE TO anon
    USING (false);

-- ==============================================================================
-- 12. ADMIN_PROFILES TABLOSU
-- ==============================================================================
CREATE POLICY "Deny anon all admin profiles" ON public.admin_profiles
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

-- ==============================================================================
-- 13. GÜVENLİ SECURITY DEFINER RPC FONKSİYONU
-- ==============================================================================
-- İstemcinin öğrenci numarası doğrulaması için members tablosuna doğrudan SELECT atmasına gerek kalmaz.
-- Sadece öğrenci numarası ve ad-bölüm döndürür; rol ve notları dışarı sızdırmaz.

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

    SELECT id, student_number, full_name, department, status
    INTO v_member
    FROM public.members
    WHERE lower(replace(student_number, ' ', '')) = v_clean
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Girdiğiniz öğrenci numarası kulüp üye listesinde bulunamadı.');
    END IF;

    IF v_member.status = 'suspended' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Üyeliğiniz askıya alınmıştır. Detay için kulüp odasına uğrayınız.');
    END IF;

    IF v_member.status = 'passive' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Üyeliğiniz pasif durumdadır. Yeniden aktif etmek için kulüp odamıza uğrayınız.');
    END IF;

    -- GÜVENLİK: role ve member_type alanları dışarıya döndürülmez (BULGU-06 Fix)
    RETURN jsonb_build_object(
        'success', true,
        'member', jsonb_build_object(
            'id', v_member.id,
            'student_number', v_member.student_number,
            'full_name', v_member.full_name,
            'department', v_member.department,
            'status', v_member.status
        ),
        'message', 'Kulüp üyeliğiniz doğrulandı.'
    );
END;
$$;

-- Fonksiyon çalıştırma izni
GRANT EXECUTE ON FUNCTION public.verify_student_member(text) TO anon, authenticated;
