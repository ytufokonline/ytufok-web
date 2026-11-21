-- ==============================================================================
-- YTÜFOK AKTİF ÜYE LİSTESİ TOPLU GÜNCELLEME BETİĞİ (KASIM 2026)
-- ==============================================================================
-- Talimat: Bu SQL betiğini Supabase Dashboard -> SQL Editor alanına yapıştırıp RUN butonuna basınız.
-- 1. members tablosundaki belirtilen 127 öğrenci numarasının tamamını status='active' ve member_type='active' (Aktif Üye) yapar.
-- 2. Eğer listedeki bir öğrenci veritabanında henüz kayıtlı değilse, otomatik olarak 'active' statüsünde oluşturur.
-- ==============================================================================

-- 1. Gerekli kolonların mevcut olduğundan emin ol
ALTER TABLE IF EXISTS public.members ADD COLUMN IF NOT EXISTS member_type VARCHAR(30) DEFAULT 'normal';
ALTER TABLE IF EXISTS public.members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 2. Toplu Güncelleme / Ekleme
DO 28116
DECLARE
    v_numbers text[] := ARRAY[
        '25093029',
        '25035705',
        '26046070',
        '2408A032',
        '2605C004',
        '26046027',
        '23028704',
        '24089053',
        '25033602',
        '23065601',
        '2,50E+10',
        '25014017',
        '24036029',
        '2508A018',
        '2505A007',
        '24089052',
        '24033616',
        '26084012',
        '26034015',
        '25049039',
        '24033079',
        '24024016',
        '24015050',
        '26054020',
        '24084042',
        '26041804',
        '25084016',
        '26084010',
        '2308A051',
        '24033033',
        '23011079',
        '25051010',
        '2608B007',
        '26840019',
        '26056033',
        '23065036',
        '26015028',
        '25028058',
        '26037022',
        'Teknopark',
        '26027015',
        '24037055',
        '26018021',
        '26084016',
        '25061007',
        '2605B015',
        '26084007',
        '26051002',
        '25056033',
        '25033052',
        '2505A020',
        '25023019',
        '26037030',
        '26141401011',
        '25084011',
        '26012073',
        '25046613',
        '25084028',
        '25037013',
        '24084017',
        '2608A010',
        '26065013',
        '26028019',
        '25094610',
        '24012059',
        '25049013',
        '12042119',
        '26084015',
        '26099006',
        '2608B604',
        '2502E045',
        '26096016',
        '26073021',
        '2605A001',
        '23084602',
        '25056017',
        '23052001',
        '26065078',
        '25058063',
        '25033057',
        '25035060',
        '2605A071',
        '25098010',
        '26084603',
        '26094025',
        '26084605',
        '23094029',
        '24091034',
        '25025011',
        '26061607',
        '26037611',
        '26036040',
        '25012020',
        'G2410.0151017',
        '25035057',
        '2602E019',
        '2602D029',
        '23017019',
        '26084006',
        '2408A015',
        '25037036',
        '260B037',
        '26028048',
        '2608B026',
        '24041501',
        '25033009',
        '25049036',
        '25022501',
        '2508A035',
        '25022024',
        '22058602',
        '25015610',
        '26011065',
        'Kunt',
        '25065127',
        '26028043',
        '2608B019',
        '19065214',
        '26024608',
        '26073014',
        '250A3610',
        '26034612',
        '26058027',
        '26056007',
        '26072030',
        '26011026',
        '2609A801'
    ];
    v_num text;
    v_updated_count integer := 0;
    v_inserted_count integer := 0;
BEGIN
    FOREACH v_num IN ARRAY v_numbers LOOP
        -- Var olan üyeyi 'active' ve 'active' (Aktif Üye) olarak güncelle
        UPDATE public.members 
        SET status = 'active', 
            member_type = 'active',
            updated_at = NOW()
        WHERE LOWER(REPLACE(student_number, ' ', '')) = LOWER(REPLACE(v_num, ' ', ''));

        IF FOUND THEN
            v_updated_count := v_updated_count + 1;
        ELSE
            -- Veritabanında henüz kaydı yoksa yeni üye olarak ekle
            INSERT INTO public.members (
                student_number, 
                full_name, 
                department, 
                status, 
                member_type, 
                role
            ) VALUES (
                TRIM(v_num), 
                'Kulüp Üyesi (' || TRIM(v_num) || ')', 
                'Yıldız Teknik Üniversitesi', 
                'active', 
                'active', 
                'member'
            )
            ON CONFLICT (student_number) 
            DO UPDATE SET status = 'active', member_type = 'active', updated_at = NOW();

            v_inserted_count := v_inserted_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'İşlem tamamlandı: % üye güncellendi, % yeni üye eklendi. Toplam: %', 
        v_updated_count, v_inserted_count, (v_updated_count + v_inserted_count);
END 28116;
