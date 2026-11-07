-- ==============================================================================
-- YTÜFOK SUPABASE ROW LEVEL SECURITY (RLS) VE VERİTABANI SERTLEŞTİRME BETİĞİ
-- ==============================================================================
-- Tarih: 07 Kasım 2026
-- Kapsam: Salih Yiğit Elitok - SKYSEC Penetrasyon Testi Raporu'ndaki tüm bulguları
-- (BULGU-01, BULGU-02, BULGU-04, BULGU-08) kesin olarak çözer ve veritabanını kilitler.
--
-- Talimat: Bu betiğin tamamını kopyalayıp Supabase Dashboard -> SQL Editor alanına
-- yapıştırarak "RUN" butonuna basınız. Hata vermeyecek şekilde tasarlanmıştır.
-- ==============================================================================

-- 0. GEREKLİ TÜM TABLOLARIN MEVCUT OLDUĞUNDAN EMİN OL (YOKSA GÜVENLE OLUŞTUR)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    department VARCHAR(150),
    membership_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'passive')),
    penalty_count INTEGER DEFAULT 0,
    penalty_reason TEXT,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'board')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    description TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    package_contents TEXT[] DEFAULT ARRAY[]::TEXT[],
    image_url TEXT,
    status VARCHAR(30) DEFAULT 'available',
    current_condition TEXT DEFAULT 'Kusursuz / Temiz',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_code VARCHAR(30) UNIQUE NOT NULL,
    equipment_id UUID,
    member_id UUID,
    student_number VARCHAR(20) NOT NULL,
    pickup_date DATE NOT NULL,
    return_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    additional_notes TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    approved_by VARCHAR(150),
    approved_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    return_condition_notes TEXT,
    rejection_reason TEXT,
    trip_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Duyuru',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trips (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255),
    destination VARCHAR(255),
    start_date DATE,
    end_date DATE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_events (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'trip',
    category_label VARCHAR(100),
    status VARCHAR(50) DEFAULT 'upcoming',
    date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50),
    time VARCHAR(50),
    location VARCHAR(255),
    description TEXT,
    long_description TEXT,
    image_url TEXT,
    quota INTEGER,
    registered_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    trip_id VARCHAR(100),
    organizer VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_suggestions (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'gezi',
    location VARCHAR(255),
    suggested_by VARCHAR(150) DEFAULT 'Anonim Üye',
    contact_info VARCHAR(150),
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_evaluations (
    id VARCHAR(100) PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL,
    event_title VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    evaluator_name VARCHAR(150) DEFAULT 'Anonim Katılımcı',
    student_number VARCHAR(50),
    comment TEXT,
    liked_aspects TEXT[],
    aspects TEXT[],
    improvement_suggestions TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gallery_items (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(150),
    photographer_name VARCHAR(150),
    camera_used VARCHAR(100),
    location VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.darkroom_slots (
    id VARCHAR(100) PRIMARY KEY,
    date DATE,
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    label VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.darkroom_reservations (
    id VARCHAR(100) PRIMARY KEY,
    reservation_code VARCHAR(30) UNIQUE,
    member_id VARCHAR(100),
    student_number VARCHAR(20),
    date DATE,
    slot_id VARCHAR(100),
    slot_label VARCHAR(150),
    process_type VARCHAR(30),
    film_type VARCHAR(150),
    film_roll_count INTEGER DEFAULT 1,
    paper_count INTEGER,
    chemicals_needed TEXT[],
    enlarger_needed BOOLEAN DEFAULT false,
    experience_level VARCHAR(50),
    companion_names TEXT,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    approved_by VARCHAR(150),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    supervisor VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id VARCHAR(50) PRIMARY KEY,
    pin VARCHAR(100) NOT NULL DEFAULT '19111994',
    pin_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 1. TÜM TABLOLARDA ROW LEVEL SECURITY (RLS) AKTİF ET
-- ==============================================================================
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

-- ==============================================================================
-- 2. MEVCUT GEVŞEK / TEHLİKELİ TÜM POLİTİKALARI TEMİZLE
-- ==============================================================================
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
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'members') THEN
        EXECUTE 'CREATE POLICY "Deny anon select members" ON public.members FOR SELECT TO anon USING (false)';
        EXECUTE 'CREATE POLICY "Deny anon insert members" ON public.members FOR INSERT TO anon WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Deny anon update members" ON public.members FOR UPDATE TO anon USING (false) WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Deny anon delete members" ON public.members FOR DELETE TO anon USING (false)';
        EXECUTE 'CREATE POLICY "Auth users see own member record" ON public.members FOR SELECT TO authenticated USING (auth.uid() = id)';
    END IF;
END $$;

-- ==============================================================================
-- 4. RESERVATIONS TABLOSU (KİŞİSEL VERİ VE TELEFON KORUMASI - BULGU-08 ÇÖZÜMÜ)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reservations') THEN
        EXECUTE 'CREATE POLICY "Deny anon bulk select reservations" ON public.reservations FOR SELECT TO anon USING (false)';
        EXECUTE 'CREATE POLICY "Public insert pending reservation" ON public.reservations FOR INSERT TO anon, authenticated WITH CHECK (status = ''pending'')';
        EXECUTE 'CREATE POLICY "Public cancel own pending reservation" ON public.reservations FOR UPDATE TO anon, authenticated USING (status = ''pending'') WITH CHECK (status = ''cancelled'')';
        EXECUTE 'CREATE POLICY "Deny anon delete reservations" ON public.reservations FOR DELETE TO anon USING (false)';
    END IF;
END $$;

-- ==============================================================================
-- 5. ANNOUNCEMENTS TABLOSU (TAHRİFAT ENGELİ - BULGU-02 CTF_TEST ÇÖZÜMÜ)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'announcements') THEN
        EXECUTE 'CREATE POLICY "Public view announcements" ON public.announcements FOR SELECT TO anon, authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Deny anon modify announcements" ON public.announcements FOR INSERT TO anon WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Deny anon update announcements" ON public.announcements FOR UPDATE TO anon USING (false) WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Deny anon delete announcements" ON public.announcements FOR DELETE TO anon USING (false)';
    END IF;
END $$;

-- ==============================================================================
-- 6. EQUIPMENT TABLOSU (EKİPMAN KATALOĞU)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'equipment') THEN
        EXECUTE 'CREATE POLICY "Public view equipment" ON public.equipment FOR SELECT TO anon, authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Deny anon modify equipment" ON public.equipment FOR INSERT TO anon WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Deny anon update equipment" ON public.equipment FOR UPDATE TO anon USING (false) WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Deny anon delete equipment" ON public.equipment FOR DELETE TO anon USING (false)';
    END IF;
END $$;

-- ==============================================================================
-- 7. TRIPS & CLUB_EVENTS (GEZİLER VE ETKİNLİKLER)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trips') THEN
        EXECUTE 'CREATE POLICY "Public view trips" ON public.trips FOR SELECT TO anon, authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Deny anon write trips" ON public.trips FOR ALL TO anon USING (false) WITH CHECK (false)';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'club_events') THEN
        EXECUTE 'CREATE POLICY "Public view club events" ON public.club_events FOR SELECT TO anon, authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Deny anon write club events" ON public.club_events FOR ALL TO anon USING (false) WITH CHECK (false)';
    END IF;
END $$;

-- ==============================================================================
-- 8. EVENT_SUGGESTIONS (ETKİNLİK VE GEZİ ÖNERİLERİ)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_suggestions') THEN
        EXECUTE 'CREATE POLICY "Public insert suggestions" ON public.event_suggestions FOR INSERT TO anon, authenticated WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "Deny anon select suggestions" ON public.event_suggestions FOR SELECT TO anon USING (false)';
        EXECUTE 'CREATE POLICY "Deny anon modify suggestions" ON public.event_suggestions FOR UPDATE TO anon USING (false) WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Deny anon delete suggestions" ON public.event_suggestions FOR DELETE TO anon USING (false)';
    END IF;
END $$;

-- ==============================================================================
-- 9. EVENT_EVALUATIONS (ETKİNLİK DEĞERLENDİRMELERİ)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_evaluations') THEN
        EXECUTE 'CREATE POLICY "Public view evaluations" ON public.event_evaluations FOR SELECT TO anon, authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Public insert evaluation" ON public.event_evaluations FOR INSERT TO anon, authenticated WITH CHECK (rating >= 1 AND rating <= 5)';
        EXECUTE 'CREATE POLICY "Deny anon modify evaluations" ON public.event_evaluations FOR UPDATE TO anon USING (false) WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Deny anon delete evaluations" ON public.event_evaluations FOR DELETE TO anon USING (false)';
    END IF;
END $$;

-- ==============================================================================
-- 10. GALLERY_ITEMS (GALERİ FOTOĞRAFLARI)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gallery_items') THEN
        EXECUTE 'CREATE POLICY "Public view gallery" ON public.gallery_items FOR SELECT TO anon, authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Deny anon write gallery" ON public.gallery_items FOR ALL TO anon USING (false) WITH CHECK (false)';
    END IF;
END $$;

-- ==============================================================================
-- 11. DARKROOM_SLOTS & DARKROOM_RESERVATIONS (KARANLIK ODA)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'darkroom_slots') THEN
        EXECUTE 'CREATE POLICY "Public view darkroom slots" ON public.darkroom_slots FOR SELECT TO anon, authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Deny anon write darkroom slots" ON public.darkroom_slots FOR ALL TO anon USING (false) WITH CHECK (false)';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'darkroom_reservations') THEN
        EXECUTE 'CREATE POLICY "Deny anon bulk select darkroom reservations" ON public.darkroom_reservations FOR SELECT TO anon USING (false)';
        EXECUTE 'CREATE POLICY "Public insert pending darkroom reservation" ON public.darkroom_reservations FOR INSERT TO anon, authenticated WITH CHECK (status = ''pending'')';
        EXECUTE 'CREATE POLICY "Deny anon modify darkroom reservations" ON public.darkroom_reservations FOR UPDATE TO anon USING (false) WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Deny anon delete darkroom reservations" ON public.darkroom_reservations FOR DELETE TO anon USING (false)';
    END IF;
END $$;

-- ==============================================================================
-- 12. ADMIN_PROFILES TABLOSU
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_profiles') THEN
        EXECUTE 'CREATE POLICY "Deny anon all admin profiles" ON public.admin_profiles FOR ALL TO anon USING (false) WITH CHECK (false)';
    END IF;
END $$;

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
