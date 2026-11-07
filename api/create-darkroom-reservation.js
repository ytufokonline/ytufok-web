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

  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, 'create_darkroom', 10, 10 * 60 * 1000);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: `Çok fazla karanlık oda randevusu talebinde bulundunuz. Lütfen ${rateCheck.retryAfterSeconds} saniye sonra tekrar deneyiniz.`
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      slot_id,
      student_number,
      date,
      slot_time,
      session_type,
      notes
    } = body;

    const cleanStudentNo = sanitizeString(student_number || '').replace(/\s+/g, '').trim();
    const cleanNotes = sanitizeString(notes || '').trim();

    if (!slot_id || !cleanStudentNo || !date || !slot_time) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen seans, öğrenci numarası ve tarih alanlarını eksiksiz doldurunuz.'
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Üye Kontrolü
    const { data: member, error: memErr } = await supabase
      .from('members')
      .select('id, student_number, full_name, status')
      .eq('student_number', cleanStudentNo)
      .maybeSingle();

    if (memErr || !member) {
      return res.status(400).json({
        success: false,
        message: 'Girdiğiniz öğrenci numarası kulüp üye listesinde bulunamadı.'
      });
    }

    if (member.status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'Kulüp üyeliğiniz askıya alınmıştır. Randevu oluşturamazsınız.'
      });
    }

    // Seans Kontrolü
    const { data: slot, error: slotErr } = await supabase
      .from('darkroom_slots')
      .select('id, is_active')
      .eq('id', slot_id)
      .maybeSingle();

    if (slotErr || !slot || slot.is_active === false) {
      return res.status(400).json({
        success: false,
        message: 'Seçilen karanlık oda seansı artık müsait değildir.'
      });
    }

    // Mükerrer / Doluluk Kontrolü
    const { data: existingSlotBookings } = await supabase
      .from('darkroom_reservations')
      .select('id')
      .eq('slot_id', slot_id)
      .in('status', ['pending', 'approved', 'in_use']);

    if (existingSlotBookings && existingSlotBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu karanlık oda seansı için zaten aktif bir randevu kaydı bulunmaktadır.'
      });
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = `KO-${new Date().getFullYear()}-${randomSuffix}`;

    const newDarkroomRes = {
      id: crypto.randomUUID(),
      slot_id,
      member_id: member.id,
      student_number: cleanStudentNo,
      date,
      slot_time,
      session_type: session_type || 'bw_print',
      status: 'pending',
      reservation_code,
      notes: cleanNotes,
      created_at: new Date().toISOString()
    };

    const { data: inserted, error: insErr } = await supabase
      .from('darkroom_reservations')
      .insert([newDarkroomRes])
      .select()
      .single();

    if (insErr) throw insErr;

    return res.status(200).json({
      success: true,
      data: inserted,
      reservation: inserted,
      reservation_code,
      message: `Karanlık oda randevunuz oluşturuldu! Takip Kodunuz: ${reservation_code}.`
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Karanlık oda randevusu oluşturulurken sunucu hatası oluştu.'
    });
  }
}
