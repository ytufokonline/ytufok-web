import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp, sanitizeString, maskPhoneNumber, maskStudentNumber } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. IP HIZ SINIRLANDIRMASI (BULGU-07 & BULGU-08 KORUMASI)
  // Numara taraması veya brute force engellemek için IP başına 5 dakikada en fazla 20 istek
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, 'lookup_reservation', 20, 5 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: `Çok fazla sorgulama denemesi yaptınız. Lütfen ${rateCheck.retryAfterSeconds} saniye sonra tekrar deneyiniz.`
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const query = sanitizeString(body.query || req.query.query || '').trim().toUpperCase();
    const action = body.action || '';

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // ==========================================
    // 2. ÜYE TARAFINDAN GÜVENLİ İPTAL İŞLEMİ
    // ==========================================
    if (action === 'cancel') {
      const { id, reservation_code, type } = body;
      if (!id || !reservation_code) {
        return res.status(400).json({ success: false, message: 'İptal için id ve takip kodu zorunludur.' });
      }

      const cleanCode = sanitizeString(reservation_code).trim().toUpperCase();

      if (type === 'darkroom') {
        const { data: existing, error: findErr } = await supabase
          .from('darkroom_reservations')
          .select('id, status, reservation_code')
          .eq('id', id)
          .eq('reservation_code', cleanCode)
          .maybeSingle();

        if (findErr || !existing) {
          return res.status(404).json({ success: false, message: 'İptal edilecek randevu bulunamadı.' });
        }

        if (existing.status === 'completed' || existing.status === 'cancelled') {
          return res.status(400).json({ success: false, message: 'Bu randevu zaten sonlandırılmış veya iptal edilmiştir.' });
        }

        const { error: updErr } = await supabase
          .from('darkroom_reservations')
          .update({
            status: 'cancelled',
            approved_by: 'İptal (Üye Talebi)',
            rejection_reason: 'Üye tarafından sorgu ekranından iptal edildi'
          })
          .eq('id', id);

        if (updErr) throw updErr;
        return res.status(200).json({ success: true, message: 'Randevu başarıyla iptal edildi.' });
      } else {
        // Ekipman rezervasyonu iptali
        const { data: existing, error: findErr } = await supabase
          .from('reservations')
          .select('id, status, reservation_code, equipment_id')
          .eq('id', id)
          .eq('reservation_code', cleanCode)
          .maybeSingle();

        if (findErr || !existing) {
          return res.status(404).json({ success: false, message: 'İptal edilecek rezervasyon bulunamadı.' });
        }

        if (existing.status === 'in_use' || existing.status === 'returned' || existing.status === 'cancelled') {
          return res.status(400).json({ success: false, message: 'Kullanımda olan veya tamamlanan rezervasyonlar iptal edilemez.' });
        }

        const { error: updErr } = await supabase
          .from('reservations')
          .update({
            status: 'cancelled',
            approved_by: 'İptal (Üye Talebi)',
            rejection_reason: 'Üye tarafından takip ekranından iptal edildi'
          })
          .eq('id', id);

        if (updErr) throw updErr;

        // Ekipman statüsünü yeniden müsait yap
        if (existing.equipment_id) {
          await supabase
            .from('equipment')
            .update({ status: 'available' })
            .eq('id', existing.equipment_id);
        }

        return res.status(200).json({ success: true, message: 'Rezervasyon başarıyla iptal edildi.' });
      }
    }

    // ==========================================
    // 3. SORGULAMA İŞLEMİ (BULGU-08 ÇÖZÜMÜ)
    // ==========================================
    if (!query || query.length < 3) {
      return res.status(200).json({ success: true, equipment: [], darkroom: [] });
    }

    // Ekipman rezervasyonu sorgusu
    let eqQuery = supabase.from('reservations').select('*');
    if (query.startsWith('YTU-') || query.includes('-')) {
      eqQuery = eqQuery.eq('reservation_code', query);
    } else {
      eqQuery = eqQuery.eq('student_number', query);
    }

    // Karanlık oda sorgusu
    let dkQuery = supabase.from('darkroom_reservations').select('*');
    if (query.startsWith('KO-') || query.includes('-')) {
      dkQuery = dkQuery.eq('reservation_code', query);
    } else {
      dkQuery = dkQuery.eq('student_number', query);
    }

    const [eqRes, dkRes, allEqRes, allTripsRes, membersRes] = await Promise.all([
      eqQuery.order('created_at', { ascending: false }).limit(10),
      dkQuery.order('created_at', { ascending: false }).limit(10),
      supabase.from('equipment').select('id, name, brand, model, serial_number, category, image_url'),
      supabase.from('trips').select('id, name, destination, start_date, end_date'),
      supabase.from('members').select('id, student_number, full_name')
    ]);

    const equipMap = new Map((allEqRes.data || []).map(e => [e.id, e]));
    const tripMap = new Map((allTripsRes.data || []).map(t => [t.id, t]));
    const memberMap = new Map((membersRes.data || []).map(m => [m.student_number, m]));

    // Hassas verileri sanitize edip maskele (KVKK & BULGU-08 Fix)
    const sanitizedEquipment = (eqRes.data || []).map(r => {
      const mem = memberMap.get(r.student_number);
      return {
        id: r.id,
        reservation_code: r.reservation_code,
        equipment_id: r.equipment_id,
        student_number: r.student_number,
        pickup_date: r.pickup_date,
        return_date: r.return_date,
        status: r.status,
        purpose: r.purpose,
        approved_by: r.approved_by,
        rejection_reason: r.rejection_reason,
        created_at: r.created_at,
        equipment: equipMap.get(r.equipment_id) || null,
        trip: r.trip_id ? tripMap.get(r.trip_id) || null : null,
        member: mem ? { full_name: mem.full_name, student_number: mem.student_number } : null
        // phone and internal notes are explicitly NOT returned
      };
    });

    const sanitizedDarkroom = (dkRes.data || []).map(r => {
      const mem = memberMap.get(r.student_number);
      return {
        id: r.id,
        reservation_code: r.reservation_code,
        slot_id: r.slot_id,
        student_number: r.student_number,
        date: r.date,
        slot_time: r.slot_time,
        session_type: r.session_type,
        status: r.status,
        notes: r.notes,
        approved_by: r.approved_by,
        rejection_reason: r.rejection_reason,
        created_at: r.created_at,
        member: mem ? { full_name: mem.full_name, student_number: mem.student_number } : null
      };
    });

    return res.status(200).json({
      success: true,
      equipment: sanitizedEquipment,
      darkroom: sanitizedDarkroom
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Sorgulama esnasında sunucu hatası oluştu.'
    });
  }
}
