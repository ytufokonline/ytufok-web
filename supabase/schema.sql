-- ==============================================================================
-- YILDIZ TEKNİK ÜNİVERSİTESİ FOTOĞRAF KULÜBÜ (YTÜFOK)
-- KAMERA VE EKİPMAN REZERVASYON & TAKİP SİSTEMİ - SUPABASE VERİTABANI ŞEMASI
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLO: MEMBERS (Aktif Kulüp Üyeleri & Whitelist)
-- Öğrenci numarası doğrulama tablosu. Sadece burada 'active' olanlar rezervasyon yapabilir.
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_number VARCHAR(20) UNIQUE NOT NULL, -- Öğrenci No (Örn: 21011045)
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    department VARCHAR(150) NOT NULL, -- Fakülte / Bölüm
    membership_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'passive')),
    penalty_count INTEGER DEFAULT 0, -- Geciktirme veya hasar ceza puanı
    penalty_reason TEXT,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'board')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast whitelist lookup
CREATE INDEX IF NOT EXISTS idx_members_student_number ON public.members (student_number);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);

-- 3. TABLO: EQUIPMENT (Demirbaş Kamera, Lens ve Aksesuar Envanteri)
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL, -- Örn: Sony Alpha A7 III Gövde
    category VARCHAR(50) NOT NULL CHECK (category IN ('camera', 'lens', 'analog', 'accessory', 'lighting', 'tripod')),
    brand VARCHAR(50) NOT NULL, -- Sony, Fujifilm, Canon, Nikon, Sigma, Tamron
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL, -- Demirbaş / Seri No
    description TEXT,
    specs JSONB DEFAULT '{}'::jsonb, -- Çözünürlük, Bayonet, Sensör, Diyafram vb.
    package_contents TEXT[] DEFAULT ARRAY[]::TEXT[], -- Gövde kapağı, 2x Batarya, Şarj aleti, 64GB SD Kart
    image_url TEXT,
    status VARCHAR(30) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'in_use', 'maintenance')),
    current_condition TEXT DEFAULT 'Kusursuz / Temiz',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment (status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment (category);

-- 4. TABLO: RESERVATIONS (Rezervasyon Talepleri ve Zimmet Takibi)
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_code VARCHAR(30) UNIQUE NOT NULL, -- Örn: YTU-2026-A83F
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    student_number VARCHAR(20) NOT NULL,
    pickup_date DATE NOT NULL,
    return_date DATE NOT NULL,
    purpose TEXT NOT NULL, -- Kullanım Amacı (Örn: Mimarlık Fakültesi Proje Çekimi)
    additional_notes TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_use', 'returned', 'overdue', 'cancelled')),
    approved_by VARCHAR(150),
    approved_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ, -- Ekipmanın fiziken teslim edildiği an
    returned_at TIMESTAMPTZ, -- Ekipmanın kulübe iade edildiği an
    return_condition_notes TEXT, -- İade alındığındaki kontrol notu
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (return_date >= pickup_date)
);

CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_student_number ON public.reservations (student_number);
CREATE INDEX IF NOT EXISTS idx_reservations_equipment ON public.reservations (equipment_id);

-- 5. TABLO: ANNOUNCEMENTS (Kulüp Duyuruları)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Duyuru',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLO: GALLERY (Vitrin Galerisi)
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    photographer_name VARCHAR(150) NOT NULL,
    camera_used VARCHAR(100),
    location VARCHAR(100),
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. İŞ MANTIĞI FONKSİYONLARI VE TETİKLEYİCİLER (TRIGGERS)

-- Otomatik Güncelleme Zamanı Tetikleyicisi
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE TRIGGER trg_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE TRIGGER trg_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- Rezervasyon Durum Değiştiğinde Ekipman Durumunu Otomatik Güncelleyen Tetikleyici
CREATE OR REPLACE FUNCTION handle_reservation_equipment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Rezervasyon 'approved' (Onaylandı) olduğunda ekipmanı 'reserved' yap
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE public.equipment SET status = 'reserved' WHERE id = NEW.equipment_id;
    
    -- Rezervasyon 'in_use' (Teslim Edildi / Kullanımda) olduğunda ekipmanı 'in_use' yap
    ELSIF NEW.status = 'in_use' AND OLD.status != 'in_use' THEN
        UPDATE public.equipment SET status = 'in_use' WHERE id = NEW.equipment_id;
    
    -- Rezervasyon 'returned' veya 'rejected' veya 'cancelled' olduğunda ekipmanı tekrar 'available' (müsait) yap
    ELSIF NEW.status IN ('returned', 'rejected', 'cancelled') AND OLD.status NOT IN ('returned', 'rejected', 'cancelled') THEN
        UPDATE public.equipment SET status = 'available' WHERE id = NEW.equipment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_equipment_status
AFTER INSERT OR UPDATE OF status ON public.reservations
FOR EACH ROW EXECUTE FUNCTION handle_reservation_equipment_status();

-- 8. ROW LEVEL SECURITY (RLS) POLİTİKALARI
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Equipment: Herkes görebilir
CREATE POLICY "Public read equipment" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Admin write equipment" ON public.equipment FOR ALL USING (true);

-- Gallery & Announcements: Herkes görebilir
CREATE POLICY "Public read gallery" ON public.gallery_items FOR SELECT USING (true);
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);

-- Members (Whitelist):
-- Öğrenci no sorgulama ve admin yönetimi için okuma/yazma politikaları
CREATE POLICY "Allow student number verification" ON public.members FOR SELECT USING (true);
CREATE POLICY "Admin manage members" ON public.members FOR ALL USING (true);

-- Reservations:
CREATE POLICY "Public select reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Member insert reservations" ON public.reservations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE student_number = reservations.student_number 
        AND status = 'active'
    )
);
CREATE POLICY "Admin update reservations" ON public.reservations FOR UPDATE USING (true);

-- 9. BAŞLANGIÇ TEST VERİLERİ (SEED DATA)

-- Aktif Kulüp Üyeleri (Whitelist)
INSERT INTO public.members (student_number, full_name, email, phone, department, status, penalty_count, role)
VALUES
('21011045', 'Ahmet Yılmaz', 'ahmet.yilmaz@std.yildiz.edu.tr', '+90 532 111 22 33', 'Bilgisayar Mühendisliği', 'active', 0, 'admin'),
('22052018', 'Zeynep Kaya', 'zeynep.kaya@std.yildiz.edu.tr', '+90 533 222 33 44', 'Mimarlık', 'active', 0, 'board'),
('20034091', 'Emre Demir', 'emre.demir@std.yildiz.edu.tr', '+90 535 333 44 55', 'Elektrik Mühendisliği', 'active', 0, 'member'),
('23016022', 'Selin Öztürk', 'selin.ozturk@std.yildiz.edu.tr', '+90 536 444 55 66', 'Şehir ve Bölge Planlama', 'active', 0, 'member'),
('19041003', 'Burak Çelik (Cezalı)', 'burak.celik@std.yildiz.edu.tr', '+90 537 555 66 77', 'Makine Mühendisliği', 'suspended', 2, 'member')
ON CONFLICT (student_number) DO NOTHING;

-- Kameralar, Lensler ve Ekipmanlar (YTÜFOK Gerçek Demirbaş Listesi)
INSERT INTO public.equipment (id, name, category, brand, model, serial_number, description, specs, package_contents, image_url, status, current_condition)
VALUES
(
    'e01a1111-1111-1111-1111-111111111111',
    'Canon EOS 5D Mark II Gövde',
    'camera',
    'Canon',
    'EOS 5D Mark II',
    'YTU-EOS-5D2',
    'Kulübün efsanevi tam kare (Full Frame) amiral gemisi gövdesi. 21.1 MP çözünürlük, sinematik Canon renkleri ve 1080p Full HD video kabiliyeti ile stüdyo ve dış mekan portrelerinin vazgeçilmezi.',
    '{"sensor": "Full Frame 21.1 MP CMOS", "mount": "Canon EF Mount", "video": "1080p 30fps Full HD", "iso": "100 - 6400", "weight": "810g"}'::jsonb,
    ARRAY['Canon EOS 5D Mark II Gövde', '2x Orijinal LP-E6 Batarya', 'LC-E6 Hızlı Şarj Cihazı', 'SanDisk 32GB CF Kart', 'USB CF Kart Okuyucu', 'Omuz Askısı', 'Taşıma Çantası'],
    'https://upload.wikimedia.org/wikipedia/commons/b/bd/Appareil_photo_reflex_num%C3%A9rique_Canon_EOS_5D_%28de_face%29.jpg',
    'available',
    'Kusursuz / Sensör temizliği yeni yapıldı'
),
(
    'e01a2222-2222-2222-2222-222222222222',
    'Canon EOS 6D Gövde',
    'camera',
    'Canon',
    'EOS 6D',
    'YTU-EOS-6D',
    'Kompakt ve hafif tam kare gövde. -3 EV düşük ışık odaklama kabiliyeti, dahili Wi-Fi ve GPS özelliğiyle gece çekimleri, kulüp gezileri ve konser fotoğrafları için ideal.',
    '{"sensor": "Full Frame 20.2 MP CMOS", "mount": "Canon EF Mount", "iso": "100 - 25600", "storage": "SD / SDHC / SDXC", "weight": "755g"}'::jsonb,
    ARRAY['Canon EOS 6D Gövde', '2x Orijinal LP-E6 Batarya', 'LC-E6 Şarj Cihazı', 'SanDisk 64GB SD Kart', 'Orijinal Boyun Askısı'],
    'https://upload.wikimedia.org/wikipedia/commons/0/0c/Canon_EOS_6D_body.jpg',
    'available',
    'Temiz / Ekranda nano cam koruyucu mevcut'
),
(
    'e01a3333-3333-3333-3333-333333333333',
    'Canon EOS 1000D Gövde (Rebel XS)',
    'camera',
    'Canon',
    'EOS 1000D',
    'YTU-EOS-1000D',
    'Kulübe yeni katılan üyeler ve temel diyafram-enstantane-ISO eğitim atölyeleri için pratik, hafif ve dayanıklı APS-C DSLR gövde.',
    '{"sensor": "APS-C 10.1 MP CMOS", "mount": "Canon EF / EF-S Mount", "iso": "100 - 1600", "screen": "2.5 inç Live View LCD", "weight": "450g"}'::jsonb,
    ARRAY['Canon EOS 1000D Gövde', '2x LP-E5 Batarya', 'Orijinal Şarj Cihazı', 'Kingston 32GB SD Kart', 'Boyun Askısı'],
    'https://upload.wikimedia.org/wikipedia/commons/4/48/Canon_EOS_1000D_01.jpg',
    'available',
    'Çalışır durumda / Temel eğitim kullanımına hazır'
),
(
    'e01a4444-4444-4444-4444-444444444444',
    'Canon EOS 650 (35mm Analog Film SLR Gövde)',
    'analog',
    'Canon',
    'EOS 650 35mm SLR',
    'YTU-EOS-650-ANALOG',
    'Canon''un ilk elektronik otomatik odaklamalı (AF) 35mm film SLR fotoğraf makinesi (1987 klasiği). Kulübün tüm modern EF lensleriyle tam uyumludur; analog film çekip karanlık odada tab etmek isteyen üyelerimiz içindir.',
    '{"film_type": "35mm Film (135)", "mount": "Canon EF Mount (Elektronik AF)", "shutter": "1/2000s - 30s + Bulb", "battery": "2CR5 6V Lityum"}'::jsonb,
    ARRAY['Canon EOS 650 Analog Gövde', '2CR5 Lityum Pil (Dolu takılı)', 'Gövde Süngü Kapağı', 'Vintage Omuz Askısı'],
    'https://upload.wikimedia.org/wikipedia/commons/c/ce/Canon_EOS650_BL.jpg',
    'available',
    'Karanlık oda testleri yapıldı / Perde ve sarma motoru kusursuz'
),
(
    'e01a5555-5555-5555-5555-555555555555',
    'Nikon D5000 DSLR Gövde',
    'camera',
    'Nikon',
    'D5000',
    'YTU-NIK-D5000',
    'Kulübün Nikon sistemini ve ergonomisini tercih eden üyeleri için değişken açılı hareketli LCD ekrana ve HD video kaydına sahip Nikon DX format DSLR gövdesi.',
    '{"mount": "Nikon F-Mount (DX)", "storage": "SD Kart", "type": "DSLR", "sensor": "12.3 MP DX CMOS", "screen": "2.7 Değişken Açılı LCD"}'::jsonb,
    ARRAY['Nikon D5000 DSLR Gövde', '1x Orijinal EN-EL9a Batarya', 'Nikon MH-23 Şarj Cihazı', 'Nikon Omuz Askısı', 'Gövde Kapağı'],
    'https://upload.wikimedia.org/wikipedia/commons/9/95/Nikon_D5000_body_%28front%29.jpg',
    'available',
    'değerlendirilecek'
),
(
    'e01a6666-6666-6666-6666-666666666666',
    'Canon EF 50mm f/1.4 USM Lens',
    'lens',
    'Canon',
    'EF 50mm f/1.4 USM',
    'YTU-LENS-50MM',
    'Kulübün en çok talep gören standart prime portre ve sokak lensi. f/1.4 geniş diyaframı sayesinde loş ışıkta harikalar yaratır ve kremsi bokeh sunar.',
    '{"aperture": "f/1.4 - f/22", "mount": "Canon EF Mount", "filter_size": "58mm", "motor": "Mikro USM", "weight": "290g"}'::jsonb,
    ARRAY['Canon EF 50mm f/1.4 Lens', 'Ön ve Arka Kapaklar', 'Orijinal Parasoley', '58mm UV Filtre'],
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Canon_EF_50mm_f1.4_Front_%26_Rear.jpg',
    'available',
    'Optikler kusursuz / Diyafram bıçakları yağsız ve hızlı'
),
(
    'e01a7777-7777-7777-7777-777777777777',
    'Canon EF 85mm f/1.8 USM Lens',
    'lens',
    'Canon',
    'EF 85mm f/1.8 USM',
    'YTU-LENS-85MM',
    'Jilet keskinliğinde profesyonel portre lensi. Ring USM ultra hızlı netleme ve muazzam bokeh ayrımı.',
    '{"aperture": "f/1.8 - f/22", "mount": "Canon EF Mount", "filter_size": "58mm", "weight": "425g"}'::jsonb,
    ARRAY['Canon EF 85mm f/1.8 Lens', 'ET-65 III Parasoley', 'Ön & Arka Kapaklar', '58mm Koruyucu Filtre'],
    'https://upload.wikimedia.org/wikipedia/commons/8/81/Canon_85mm_comparison_%28front%29.jpg',
    'available',
    'Kusursuz / Portre çekimleri için hazır'
),
(
    'e01a7777-1000-0000-0000-000000000100',
    'Canon EF 100mm f/2.8 Macro USM Lens',
    'lens',
    'Canon',
    'EF 100mm f/2.8 Macro USM',
    'YTU-LENS-100-MACRO',
    '1:1 gerçek boyutlu büyütme oranına sahip efsanevi profesyonel makro lensi. Doğa, ürün, böcek, çiçek ve detay çekimlerinin yanı sıra 100mm odak uzaklığı ve f/2.8 diyaframıyla mükemmel bir portre lensidir.',
    '{"ratio": "1:1 Macro", "aperture": "f/2.8 - f/32", "mount": "Canon EF Mount", "filter_size": "58mm", "motor": "Ring USM", "weight": "600g"}'::jsonb,
    ARRAY['Canon EF 100mm f/2.8 Macro Lens', 'ET-67 Silindirik Derin Parasoley', 'Ön ve Arka Kapaklar', '58mm UV Filtre', 'Dolgulu Kılıf'],
    'https://upload.wikimedia.org/wikipedia/commons/c/c0/Canon_EF_100mm_f2.8_Macro_USM.jpg',
    'available',
    'Optikler pırıl pırıl / USM motoru ve 1:1 netleme kusursuz'
),
(
    'e01a8888-8888-8888-8888-888888888888',
    'Canon EF 70-200mm f/4L USM Telefoto Lens',
    'lens',
    'Canon',
    'EF 70-200mm f/4L USM',
    'YTU-LENS-70-200L',
    'Efsanevi kırmızı halkalı beyaz L serisi telefoto zoom lens. Konser, spor ve detay çekimleri için köşeden köşeye üst düzey keskinlik.',
    '{"aperture": "f/4 sabit", "mount": "Canon EF L Serisi", "filter_size": "67mm", "weight": "705g"}'::jsonb,
    ARRAY['Canon EF 70-200mm f/4L Lens', 'ET-74 Beyaz Parasoley', 'Ön ve Arka Kapaklar', '67mm UV Filtre', 'Dolgulu Çanta'],
    'https://upload.wikimedia.org/wikipedia/commons/5/53/Canon_EF_70-200mm_f2.8L_IS_II_USM_with_lens_hood%2C_2013_November.jpg',
    'available',
    'Optikler pırıl pırıl / Yakınlaştırma halkası akıcı'
),
(
    'e01a9999-9999-9999-9999-999999999999',
    'Canon EF 17-40mm f/4L USM Ultra Geniş Açı Lens',
    'lens',
    'Canon',
    'EF 17-40mm f/4L USM',
    'YTU-LENS-17-40L',
    'L serisi profesyonel ultra geniş açı zoom lens. Mimarlık Fakültesi öğrenci projeleri, Davutpaşa Kışlası iç mekanları ve manzara çekimleri için 1 numaralı tercih.',
    '{"aperture": "f/4 sabit", "mount": "Canon EF L Serisi", "filter_size": "77mm", "angle": "104° - 57°", "weight": "500g"}'::jsonb,
    ARRAY['Canon EF 17-40mm f/4L Lens', 'EW-83E Petal Parasoley', '77mm Slim UV Filtre', 'Ön ve Arka Kapaklar', 'Dolgulu Kılıf'],
    'https://upload.wikimedia.org/wikipedia/commons/6/66/Canon_EF_17-40mm_f4L_USM_front_angled.jpg',
    'available',
    'Tertemiz / Mimari çekimler için hazır'
),
(
    'e01baaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Canon EF 24-105mm f/4L IS USM Standart Zoom Lens',
    'lens',
    'Canon',
    'EF 24-105mm f/4L IS USM',
    'YTU-LENS-24-105L',
    'Kulübün en çok rezerve edilen genel amaçlı "tak-gez" L serisi zoom lensi. Geniş açıdan teleye uzanan odak erimi ve 3-stop IS optik sabitleme desteği.',
    '{"aperture": "f/4 sabit", "mount": "Canon EF L Serisi", "filter_size": "77mm", "stabilization": "3-Stop IS", "weight": "670g"}'::jsonb,
    ARRAY['Canon EF 24-105mm f/4L IS Lens', 'EW-83H Orijinal Parasoley', '77mm UV Filtre', 'Ön ve Arka Kapaklar'],
    'https://upload.wikimedia.org/wikipedia/commons/7/76/Canon_EF_24-105mm_f4L_IS_USM.jpg',
    'available',
    'IS motoru ve diyafram sorunsuz çalışıyor'
),
(
    'e01bbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Sigma 10-20mm f/3.5 EX DC HSM Ultra Geniş Açı Lens',
    'lens',
    'Sigma',
    '10-20mm f/3.5 EX DC HSM',
    'YTU-LENS-SIGMA-10-20',
    'Crop gövdeler (Canon 1000D vb.) için sabit f/3.5 diyaframlı ultra geniş açı lens. Dar iç mekanlarda ve etkinliklerde geniş kadraj imkanı sunar.',
    '{"aperture": "f/3.5 sabit", "mount": "Canon EF-S Mount", "filter_size": "82mm", "motor": "HSM Sessiz AF", "weight": "520g"}'::jsonb,
    ARRAY['Sigma 10-20mm f/3.5 Lens', 'Petal Parasoley', 'Ön ve Arka Kapaklar', 'Fermuarlı Taşıma Çantası'],
    'https://upload.wikimedia.org/wikipedia/commons/d/d9/Sigma_10-20mm_F3.5_EX_DC_HSM_01.jpg',
    'available',
    'değerlendirilecek'
),
(
    'e01b9999-9999-9999-9999-999999999999',
    'Nikon AF-S DX NIKKOR 18-55mm f/3.5-5.6G VR Lens',
    'lens',
    'Nikon',
    'AF-S DX NIKKOR 18-55mm f/3.5-5.6G VR',
    'YTU-LENS-NIK-18-55',
    'Nikon D5000 ve F-Mount DX gövdelerle tam uyumlu standart zoom lensi. 18-55mm ideal genel kullanım aralığı ve VR optik titreşim engelleme sistemi sunar.',
    '{"aperture": "f/3.5 - f/5.6", "mount": "Nikon F-Mount (DX)", "filter_size": "52mm", "vr": "3-Stop VR", "weight": "265g"}'::jsonb,
    ARRAY['Nikon AF-S DX 18-55mm f/3.5-5.6G VR Lens', 'Ön Lens Kapağı (52mm)', 'Arka Lens Kapağı', '52mm UV Filtre'],
    'https://upload.wikimedia.org/wikipedia/commons/5/5f/AF-S_DX_Nikkor_18-55mm_f_3.5-5.6G_VR.jpg',
    'available',
    'değerlendirilecek'
),
(
    'e01bcccc-cccc-cccc-cccc-cccccccccccc',
    'Canon Speedlite 580EX II Harici Tepe Flaşı',
    'lighting',
    'Canon',
    'Speedlite 580EX II',
    'YTU-FLASH-580EXII',
    'Canon EOS DSLR gövdelerle tam E-TTL II uyumlu amiral gemisi profesyonel harici tepe flaşı. Yüksek kılavuz numarası (GN 58), hızlı ve sessiz geri dolum, dönebilen sektirme reflektör kafası.',
    '{"mount": "Canon Hot-Shoe E-TTL II", "power": "4x AA Pil", "head": "Dikey -7° - 90° / Yatay 180°", "guide_number": "GN 58"}'::jsonb,
    ARRAY['Canon Speedlite 580EX II Flaş Gövdesi', '4x Panasonic Eneloop Pro Şarjlı Pil', 'Masaüstü Mini Flaş Standı', 'Difüzör Başlık', 'Kumaş Kılıf'],
    'https://upload.wikimedia.org/wikipedia/commons/3/38/Canon_Speedlite_580EX_II_Front.jpg',
    'available',
    'değerlendirilecek'
),
(
    'e01b1111-0000-0000-0000-000000000001',
    'Fujifilm Clear Shot M (35mm Analog Kompakt No: 1)',
    'analog',
    'Fujifilm',
    'Clear Shot M',
    'YTU-ANALOG-CS-01',
    'Kompakt 35mm film analog fotoğraf makinesi ("Point & Shoot"). Otomatik film sarma, dahili flaş ve sabit odaklı Fujinon lensi ile sokakta analog ruhunu yakalamak isteyen üyelerimiz için.',
    '{"film_type": "35mm Film (135)", "lens": "Fujinon Sabit Lens", "flash": "Dahili Otomatik / Manuel Flaş", "battery": "2x AA Pil"}'::jsonb,
    ARRAY['Fujifilm Clear Shot M Makine (No: 1)', 'Bilek Askısı', '2x AA Pil'],
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/Fuji_Mini_wide_DL-500_wide_date_%2851887701012%29.jpg',
    'available',
    'Perde ve flaş test edildi / Sorunsuz çalışıyor'
),
(
    'e01b2222-0000-0000-0000-000000000002',
    'Fujifilm Clear Shot M (35mm Analog Kompakt No: 2)',
    'analog',
    'Fujifilm',
    'Clear Shot M',
    'YTU-ANALOG-CS-02',
    'Kompakt 35mm film analog fotoğraf makinesi. Kulüp gezilerinde ve analog atölyelerinde kullanılmak üzere hazır bekleyen 2 numaralı demirbaş.',
    '{"film_type": "35mm Film (135)", "lens": "Fujinon Sabit Lens", "flash": "Dahili Flaş", "battery": "2x AA Pil"}'::jsonb,
    ARRAY['Fujifilm Clear Shot M Makine (No: 2)', 'Bilek Askısı', '2x AA Pil'],
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/Fuji_Mini_wide_DL-500_wide_date_%2851887701012%29.jpg',
    'available',
    'Çalışır durumda'
),
(
    'e01b3333-0000-0000-0000-000000000003',
    'Fujifilm Clear Shot M (35mm Analog Kompakt No: 3)',
    'analog',
    'Fujifilm',
    'Clear Shot M',
    'YTU-ANALOG-CS-03',
    'Kompakt 35mm film analog fotoğraf makinesi. Otomatik film sarma mekanizmalı 3 numaralı kulüp makinesi.',
    '{"film_type": "35mm Film (135)", "lens": "Fujinon Sabit Lens", "flash": "Dahili Flaş", "battery": "2x AA Pil"}'::jsonb,
    ARRAY['Fujifilm Clear Shot M Makine (No: 3)', 'Bilek Askısı', '2x AA Pil'],
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/Fuji_Mini_wide_DL-500_wide_date_%2851887701012%29.jpg',
    'available',
    'Çalışır durumda'
),
(
    'e01b4444-0000-0000-0000-000000000004',
    'Fujifilm Clear Shot M (35mm Analog Kompakt No: 4)',
    'analog',
    'Fujifilm',
    'Clear Shot M',
    'YTU-ANALOG-CS-04',
    'Kompakt 35mm film analog fotoğraf makinesi. 4 numaralı analog kulüp demirbaşı.',
    '{"film_type": "35mm Film (135)", "lens": "Fujinon Sabit Lens", "flash": "Dahili Flaş", "battery": "2x AA Pil"}'::jsonb,
    ARRAY['Fujifilm Clear Shot M Makine (No: 4)', 'Bilek Askısı', '2x AA Pil'],
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/Fuji_Mini_wide_DL-500_wide_date_%2851887701012%29.jpg',
    'available',
    'Çalışır durumda'
),
(
    'e01b5555-0000-0000-0000-000000000005',
    'Fujifilm Clear Shot M (35mm Analog Kompakt No: 5)',
    'analog',
    'Fujifilm',
    'Clear Shot M',
    'YTU-ANALOG-CS-05',
    'Kompakt 35mm film analog fotoğraf makinesi. 5 numaralı analog kulüp demirbaşı.',
    '{"film_type": "35mm Film (135)", "lens": "Fujinon Sabit Lens", "flash": "Dahili Flaş", "battery": "2x AA Pil"}'::jsonb,
    ARRAY['Fujifilm Clear Shot M Makine (No: 5)', 'Bilek Askısı', '2x AA Pil'],
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/Fuji_Mini_wide_DL-500_wide_date_%2851887701012%29.jpg',
    'available',
    'Çalışır durumda'
)
ON CONFLICT (id) DO NOTHING;

-- Örnek Rezervasyonlar
INSERT INTO public.reservations (reservation_code, equipment_id, member_id, student_number, pickup_date, return_date, purpose, additional_notes, status, approved_by, approved_at, checked_out_at)
VALUES
(
    'YTU-2026-B101',
    'e01a1111-1111-1111-1111-111111111111',
    (SELECT id FROM public.members WHERE student_number = '20034091'),
    '20034091',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '2 days',
    'Davutpaşa Kampüsü Bahar Mimari Fotoğraf Projesi',
    '50mm f/1.4 lens ile birlikte alındı.',
    'in_use',
    'Ahmet Yılmaz',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
),
(
    'YTU-2026-F204',
    'e01a4444-4444-4444-4444-444444444444',
    (SELECT id FROM public.members WHERE student_number = '22052018'),
    '22052018',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '4 days',
    'Karanlık Oda Siyah-Beyaz Film Atölyesi Çekimleri',
    'Ilford HP5 Plus film kullanılacak.',
    'approved',
    'Ahmet Yılmaz',
    NOW() - INTERVAL '3 hours',
    NULL
)
ON CONFLICT (reservation_code) DO NOTHING;

-- Kulüp Duyuruları
INSERT INTO public.announcements (title, content, category, is_pinned)
VALUES
(
    '2026-2027 Güz Dönemi Ekipman Zimmet Kuralları',
    'Değerli üyelerimiz, kulüp demirbaşı kameralar ve lensler tek seferde en fazla 4 (dört) gün süreyle rezerve edilebilir. İade tarihinde saat 17:00''a kadar kulüp odasına (Davutpaşa Kışlası A-104) teslim edilmelidir. İade gecikmelerinde 15 gün yeni rezervasyon kısıtlaması uygulanır.',
    'Kural & Yönetmelik',
    true
),
(
    'Analog Atölye & Karanlık Oda Günleri',
    'Canon EOS 650 ve Fujifilm Clear Shot M analog makinelerimizle karanlık oda siyah-beyaz banyo atölyemiz her Salı ve Perşembe Davutpaşa Kampüsü A Blok bodrum kattaki karanlık odamızda gerçekleşecektir.',
    'Analog Atölye',
    false
),
(
    'Canon L Serisi Lensler ve Stüdyo Portre Çalışması',
    'Bu Cuma saat 15:30''da Beşiktaş Oditoryum Stüdyosunda Canon 70-200mm f/4L, 85mm f/1.8 ve Speedlite flaş sistemleri ile pratik portre çekim atölyesi gerçekleştirilecektir. Tüm aktif üyelerimiz davetlidir.',
    'Atölye',
    false
);

-- Vitrin Galerisi
INSERT INTO public.gallery_items (title, photographer_name, camera_used, location, image_url)
VALUES
('En kısa zamanda yüklenecek', 'YTÜFOK', 'Kulüp Demirbaşı', 'YTÜ Davutpaşa', ''),
('En kısa zamanda yüklenecek', 'YTÜFOK', 'Kulüp Demirbaşı', 'YTÜ Davutpaşa', ''),
('En kısa zamanda yüklenecek', 'YTÜFOK', 'Kulüp Demirbaşı', 'YTÜ Davutpaşa', ''),
('En kısa zamanda yüklenecek', 'YTÜFOK', 'Kulüp Demirbaşı', 'YTÜ Davutpaşa', '');
