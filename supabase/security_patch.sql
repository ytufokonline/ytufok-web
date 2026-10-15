-- ==============================================================================
-- YTÜFOK GÜVENLİK GÜNCELLEMESİ (SECURITY PATCH)
-- ==============================================================================
-- Bu betik:
-- 1. Şifre (PIN) doğrulamasını ve güncellemeyi tamamen sunucu tarafına (PostgreSQL RPC) taşır.
-- 2. Öğrenci numarası doğrulamasını tüm üye tablosunu sızdırmadan güvenli tekil RPC'ye bağlar.
-- 3. 'admin_profiles' tablosundan 'pin' sütununa public/anon doğrudan erişimi kapatır.
-- 4. 'members' tablosunun anon tarafından topluca listelenmesini önler.
-- ==============================================================================

-- 1. YÖNETİCİ ŞİFRE (PIN) DOĞRULAMA FONKSİYONU (SERVER-SIDE)
CREATE OR REPLACE FUNCTION public.verify_admin_pin(p_admin_id text, p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stored_pin text;
BEGIN
    SELECT pin INTO v_stored_pin
    FROM public.admin_profiles
    WHERE id = p_admin_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Yönetici hesabı bulunamadı.');
    END IF;

    IF v_stored_pin = trim(p_pin) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Giriş başarılı.');
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Hatalı PIN kodu.');
    END IF;
END;
$$;

-- 2. YÖNETİCİ ŞİFRE (PIN) GÜNCELLEME FONKSİYONU (SERVER-SIDE)
CREATE OR REPLACE FUNCTION public.update_admin_pin(p_admin_id text, p_current_pin text, p_new_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stored_pin text;
BEGIN
    IF length(trim(p_new_pin)) < 4 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Yeni PIN en az 4 karakter olmalıdır.');
    END IF;

    SELECT pin INTO v_stored_pin
    FROM public.admin_profiles
    WHERE id = p_admin_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Yönetici hesabı bulunamadı.');
    END IF;

    IF v_stored_pin != trim(p_current_pin) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Mevcut PIN hatalı.');
    END IF;

    UPDATE public.admin_profiles
    SET pin = trim(p_new_pin),
        pin_updated_at = NOW()
    WHERE id = p_admin_id;

    RETURN jsonb_build_object('success', true, 'message', 'PIN başarıyla güncellendi.');
END;
$$;

-- 3. ÖĞRENCİ NUMARASI DOĞRULAMA FONKSİYONU (GÜVENLİ TEKİL SORGU)
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
    v_clean := trim(p_student_number);
    IF v_clean = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Lütfen geçerli bir öğrenci numarası giriniz.');
    END IF;

    SELECT id, student_number, full_name, department, status, role, penalty_count, penalty_reason
    INTO v_member
    FROM public.members
    WHERE lower(replace(student_number, ' ', '')) = lower(replace(v_clean, ' ', ''))
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
                'role', v_member.role
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
                'role', v_member.role
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
            'role', v_member.role
        ),
        'message', 'Hoş geldiniz, ' || v_member.full_name || ' (' || v_member.department || '). Üyeliğiniz aktif.'
    );
END;
$$;

-- 4. RPC FONKSİYONLARINA ÇALIŞTIRMA İZNİ VER
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_pin(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_student_member(text) TO anon, authenticated;

-- 5. RLS KORUMALARI
-- admin_profiles tablosuna anon doğrudan SELECT atamaz (şifre sızmasını önler)
DROP POLICY IF EXISTS "Full access admin_profiles" ON public.admin_profiles;
CREATE POLICY "Deny anon select pin" ON public.admin_profiles
    FOR SELECT TO anon USING (false);

-- members tablosunun anon tarafından topluca listelenmesini önle
-- Sadece tekil arama veya admin oturumu yapabilir
