import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp, sanitizeString } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 1. IP HIZ SINIRLANDIRMASI (SPAM & BULGU-07 KORUMASI)
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, 'create_reservation', 12, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: `Çok fazla rezervasyon talebi gönderdiniz. Lütfen ${rateCheck.retryAfterSeconds} saniye sonra tekrar deneyiniz.`
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      equipment_id,
      student_number,
      pickup_date,
      return_date,
      purpose,
      phone,
      trip_id,
      additional_notes
    } = body;

    const cleanStudentNo = sanitizeString(student_number || '').replace(/\s+/g, '').trim();
    const cleanPurpose = sanitizeString(purpose || '').trim();
    const cleanPhone = sanitizeString(phone || '').trim();

    if (!equipment_id || !cleanStudentNo || !pickup_date || !return_date) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen ekipman, öğrenci numarası ve tarih aralığı alanlarını eksiksiz doldurunuz.'
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 2. ÜYE DOĞRULAMA (MEMBERS)
    const { data: member, error: memErr } = await supabase
      .from('members')
      .select('id, student_number, full_name, status, role, member_type')
      .eq('student_number', cleanStudentNo)
      .maybeSingle();

    if (memErr || !member) {
      return res.status(400).json({
        success: false,
        message: 'Girdiğiniz öğrenci numarası kulüp üye kütüğünde bulunamadı.'
      });
    }

    if (member.status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'Kulüp üyeliğiniz askıya alınmıştır. Rezervasyon yapamazsınız.'
      });
    }

    // 3. EKİPMAN KONTROLÜ
    const { data: eq, error: eqErr } = await supabase
      .from('equipment')
      .select('id, name, status, category')
      .eq('id', equipment_id)
      .maybeSingle();

    if (eqErr || !eq) {
      return res.status(404).json({ success: false, message: 'Seçilen ekipman bulunamadı.' });
    }

    if (eq.status === 'maintenance') {
      return res.status(400).json({ success: false, message: 'Bu ekipman bakımda/serviste olduğu için kiralanamaz.' });
    }

    // 4. AKTİF ÇAKIŞMA KONTROLÜ (Aynı ekipman kullanımda veya bekleyen talepte mi?)
    const { data: activeRes } = await supabase
      .from('reservations')
      .select('id, reservation_code, status')
      .eq('equipment_id', equipment_id)
      .in('status', ['pending', 'approved', 'in_use']);

    if (activeRes && activeRes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu ekipman için şu anda aktif veya onay bekleyen bir rezervasyon bulunmaktadır (${activeRes[0].reservation_code}).`
      });
    }

    // 5. MÜKERRER TALEP KONTROLÜ
    const { data: dupRes } = await supabase
      .from('reservations')
      .select('id, reservation_code')
      .eq('equipment_id', equipment_id)
      .eq('student_number', cleanStudentNo)
      .in('status', ['pending', 'approved', 'in_use']);

    if (dupRes && dupRes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu ekipman için zaten aktif bir rezervasyon talebiniz bulunmaktadır (${dupRes[0].reservation_code}).`
      });
    }

    // 6. TAKİP KODU VE KAYIT OLUŞTURMA
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = `YTU-${new Date().getFullYear()}-${randomSuffix}`;

    let fullNotes = cleanPurpose;
    if (cleanPhone) {
      fullNotes += ` | Tel: ${cleanPhone}`;
    }
    if (additional_notes) {
      fullNotes += ` | Not: ${sanitizeString(additional_notes)}`;
    }

    const newReservation = {
      id: crypto.randomUUID(),
      equipment_id,
      member_id: member.id,
      student_number: cleanStudentNo,
      pickup_date,
      return_date,
      purpose: fullNotes,
      status: 'pending',
      reservation_code,
      trip_id: trip_id || null,
      created_at: new Date().toISOString()
    };

    const { data: inserted, error: insErr } = await supabase
      .from('reservations')
      .insert([newReservation])
      .select()
      .single();

    if (insErr) throw insErr;

    // Telefon numarasını üye tablosuna güncelle
    if (cleanPhone) {
      await supabase
        .from('members')
        .update({ phone: cleanPhone })
        .eq('id', member.id);
    }

    return res.status(200).json({
      success: true,
      data: inserted,
      reservation: inserted,
      reservation_code,
      message: `Rezervasyon talebiniz başarıyla oluşturuldu! Takip Kodunuz: ${reservation_code}.`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Rezervasyon oluşturulurken sunucu hatası meydana geldi.'
    });
  }
}
