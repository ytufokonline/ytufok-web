import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';

// Default initial admin accounts fallback
const FALLBACK_ADMINS = [
  { id: 'admin-baskan', role: 'president', title: 'Kulüp Başkanı', short_title: 'Başkan', full_name: 'Sıla Dönmez', student_number: '24084005', phone: '+90 532 111 22 33', avatar_color: 'from-[#4b253b] via-[#301322] to-[#657796]' },
  { id: 'admin-by1', role: 'vice_president_1', title: 'Başkan Yardımcısı', short_title: 'Başkan Yrd.', full_name: 'Yavuz Selim Bahadır', student_number: '21065054', phone: '+90 533 222 33 44', avatar_color: 'from-[#657796] via-[#4e3b52] to-[#301322]' },
  { id: 'admin-by2', role: 'vice_president_2', title: 'Başkan Yardımcısı', short_title: 'Başkan Yrd.', full_name: 'Alara Tezelli', student_number: '23084041', phone: '+90 535 333 44 55', avatar_color: 'from-[#584964] via-[#4b253b] to-[#8193b2]' },
  { id: 'admin-sayman', role: 'treasurer', title: 'Mali İşler Sorumlusu (Sayman)', short_title: 'Sayman', full_name: 'Duru Anlar', student_number: '23084006', phone: '+90 536 444 55 66', avatar_color: 'from-[#301322] via-[#421d31] to-[#5b657e]' },
  { id: 'admin-sekreter', role: 'secretary', title: 'Genel Sekreter & Arşiv', short_title: 'Genel Sekreter', full_name: 'Yağmur Dursun', student_number: '23084023', phone: '+90 538 666 77 88', avatar_color: 'from-[#421d31] via-[#584964] to-[#657796]' },
  { id: 'admin-sosyal-medya', role: 'social_media', title: 'Sosyal Medya Koordinatörü', short_title: 'Sosyal Medya Koord.', full_name: 'Sümeyra Sever', student_number: '24084024', phone: '+90 539 777 88 99', avatar_color: 'from-[#6e2a4f] via-[#541e3d] to-[#7d8fa9]' },
  { id: 'admin-gezi', role: 'trip_coordinator', title: 'Gezi Koordinatörü', short_title: 'Gezi Koord.', full_name: 'İlayda Sudem Güneş', student_number: '24084602', phone: '+90 530 888 99 00', avatar_color: 'from-[#38263a] via-[#4b253b] to-[#657796]' },
  { id: 'admin-sponsorluk', role: 'sponsorship', title: 'Sponsorluk Koordinatörü', short_title: 'Sponsorluk Koord.', full_name: 'Öykü Aydın', student_number: '24084025', phone: '+90 531 999 00 11', avatar_color: 'from-[#4e3b52] via-[#301322] to-[#8193b2]' }
];

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
    const { studentNumber, pin } = body || {};

    if (!studentNumber || !pin) {
      return res.status(400).json({ success: false, message: 'Öğrenci numarası ve şifre gereklidir.' });
    }

    const cleanNo = String(studentNumber).trim().toLowerCase().replace(/\s+/g, '');
    const cleanPin = String(pin).trim();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Try Supabase RPC first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('verify_admin_login', {
        p_student_number: cleanNo,
        p_pin: cleanPin
      });

      if (!rpcError && rpcData && typeof rpcData === 'object') {
        return res.status(200).json(rpcData);
      }
    } catch {
      // Fallback if RPC not created yet
    }

    // 2. Server-side table check fallback
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .ilike('student_number', cleanNo)
        .maybeSingle();

      if (!error && data) {
        const storedPin = String(data.pin || '19111994').trim();
        if (storedPin === cleanPin) {
          const { pin: _p, ...safeProfile } = data;
          return res.status(200).json({
            success: true,
            message: 'Giriş başarılı.',
            admin: safeProfile
          });
        }
        return res.status(200).json({ success: false, message: 'Öğrenci numarası veya şifre hatalı.' });
      }
    } catch {
      // ignore
    }

    // 3. Fallback to initial admin accounts list (with default pin)
    const match = FALLBACK_ADMINS.find(
      (a) => a.student_number.toLowerCase().replace(/\s+/g, '') === cleanNo
    );

    if (match) {
      if (cleanPin === '19111994') {
        return res.status(200).json({
          success: true,
          message: 'Giriş başarılı.',
          admin: match
        });
      }
      return res.status(200).json({ success: false, message: 'Öğrenci numarası veya şifre hatalı.' });
    }

    return res.status(200).json({
      success: false,
      message: 'Girdiğiniz öğrenci numarasına ait yönetici hesabı bulunamadı.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Sunucu doğrulama hatası.' });
  }
}
