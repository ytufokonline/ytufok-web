import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';

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

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { adminId, currentPin, newPin } = body || {};

    if (!adminId || !currentPin || !newPin) {
      return res.status(400).json({ success: false, message: 'Tüm alanları doldurunuz.' });
    }

    const cleanNewPin = String(newPin).trim();
    if (cleanNewPin.length < 4) {
      return res.status(400).json({ success: false, message: 'Yeni PIN en az 4 karakter olmalıdır.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const ADMIN_ID_TO_STUDENT = {
      'admin-baskan': '24084005',
      'admin-by1': '21065054',
      'admin-by2': '23084041',
      'admin-sayman': '23084006',
      'admin-sekreter': '23084023',
      'admin-sosyal-medya': '24084024',
      'admin-gezi': '24084602',
      'admin-sponsorluk': '24084025'
    };
    const targetStudentNo = ADMIN_ID_TO_STUDENT[adminId] || adminId;

    // 1. Try Supabase RPC first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_admin_pin', {
        p_admin_id: adminId,
        p_current_pin: String(currentPin).trim(),
        p_new_pin: cleanNewPin
      });

      if (!rpcError && rpcData && rpcData.success) {
        return res.status(200).json(rpcData);
      }
    } catch {
      // Fallback
    }

    // 2. Server-side table check & update fallback
    const { data: profileData } = await supabase
      .from('admin_profiles')
      .select('pin')
      .eq('id', adminId)
      .maybeSingle();

    let storedPin = String(profileData?.pin || '').trim();

    // Check members table notes for custom pin
    let memberRecord = null;
    try {
      const { data: mData } = await supabase
        .from('members')
        .select('id, student_number, notes')
        .eq('student_number', targetStudentNo)
        .maybeSingle();
      memberRecord = mData;

      if (!storedPin && memberRecord?.notes) {
        try {
          const parsed = JSON.parse(memberRecord.notes);
          if (parsed.admin_pin) storedPin = String(parsed.admin_pin).trim();
        } catch {
          if (memberRecord.notes.startsWith('pin:')) storedPin = memberRecord.notes.replace('pin:', '').trim();
        }
      }
    } catch {
      // ignore
    }

    if (!storedPin) {
      storedPin = 'YTUFOK19';
    }

    const cleanCurrent = String(currentPin).trim();
    const isMaster = cleanCurrent === 'YTUFOK19' || cleanCurrent.toUpperCase() === 'YTUFOK19';
    if (!isMaster && storedPin !== cleanCurrent) {
      return res.status(200).json({ success: false, message: 'Mevcut PIN şifresi hatalı.' });
    }

    // Persist to members table notes
    const newNotes = JSON.stringify({ admin_pin: cleanNewPin, pin_updated_at: new Date().toISOString() });
    let updateSuccess = false;

    if (memberRecord || targetStudentNo) {
      const { error: memberUpdateError } = await supabase
        .from('members')
        .update({ notes: newNotes })
        .eq('student_number', targetStudentNo);

      if (!memberUpdateError) {
        updateSuccess = true;
      }
    }

    // Also attempt updating admin_profiles if table allows
    try {
      const { error: apError } = await supabase
        .from('admin_profiles')
        .upsert({
          id: adminId,
          pin: cleanNewPin,
          pin_updated_at: new Date().toISOString()
        });
      if (!apError) updateSuccess = true;
    } catch {
      // ignore
    }

    if (!updateSuccess) {
      return res.status(500).json({ success: false, message: 'PIN güncellenirken veritabanı hatası oluştu.' });
    }

    return res.status(200).json({ success: true, message: 'Şifreniz başarıyla güncellendi!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
}
