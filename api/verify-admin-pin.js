import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';
const DEFAULT_BOOTSTRAP_PIN = 'YTUFOK19';

function verifyPin(pin, hash, salt) {
  if (!hash || !salt) return false;
  try {
    const computed = crypto.pbkdf2Sync(pin, salt, 10000, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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
    const { adminId, pin } = body || {};

    if (!adminId || !pin) {
      return res.status(400).json({ success: false, message: 'Yönetici ve PIN bilgisi gereklidir.' });
    }

    const cleanAdminId = String(adminId).trim();
    const cleanPin = String(pin).trim();
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

    const FALLBACK_ADMINS = [
      { id: 'admin-baskan', full_name: 'Sıla Dönmez', student_number: '24084005' },
      { id: 'admin-by1', full_name: 'Yavuz Selim Bahadır', student_number: '21065054' },
      { id: 'admin-by2', full_name: 'Alara Tezelli', student_number: '23084041' },
      { id: 'admin-sayman', full_name: 'Duru Anlar', student_number: '23084006' },
      { id: 'admin-sekreter', full_name: 'Yağmur Dursun', student_number: '23084023' },
      { id: 'admin-sosyal-medya', full_name: 'Sümeyra Sever', student_number: '24084024' },
      { id: 'admin-gezi', full_name: 'İlayda Sudem Güneş', student_number: '24084602' },
      { id: 'admin-sponsorluk', full_name: 'Öykü Aydın', student_number: '24084025' }
    ];

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Canlı veritabanından üye kaydını esnek şekilde çek
    let member = null;

    // A. Slug haritalaması
    const mappedStudentNo = ADMIN_ID_TO_STUDENT[cleanAdminId];
    if (mappedStudentNo) {
      const { data } = await supabase
        .from('members')
        .select('notes')
        .eq('student_number', mappedStudentNo)
        .maybeSingle();
      if (data) member = data;
    }

    // B. UUID ise doğrudan ID üzerinden kontrol
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanAdminId);
    if (!member && isUuid) {
      const { data } = await supabase
        .from('members')
        .select('notes')
        .eq('id', cleanAdminId)
        .maybeSingle();
      if (data) member = data;
    }

    // C. Öğrenci numarası olarak kontrol
    if (!member) {
      const cleanNo = cleanAdminId.toLowerCase().replace(/\s+/g, '');
      const { data } = await supabase
        .from('members')
        .select('notes')
        .eq('student_number', cleanNo)
        .maybeSingle();
      if (data) member = data;
    }

    // D. FALLBACK_ADMINS eşleşmesi
    if (!member) {
      const fallback = FALLBACK_ADMINS.find(
        (a) => a.id === cleanAdminId || a.student_number === cleanAdminId || a.full_name.toLowerCase() === cleanAdminId.toLowerCase()
      );
      if (fallback) {
        const { data } = await supabase
          .from('members')
          .select('notes')
          .eq('student_number', fallback.student_number)
          .maybeSingle();
        if (data) member = data;
      }
    }

    let authData = null;
    if (member?.notes) {
      try {
        const parsed = JSON.parse(member.notes);
        if (parsed.auth && parsed.auth.hash && parsed.auth.salt) {
          authData = parsed.auth;
        } else if (parsed.admin_pin) {
          authData = { plain_pin: parsed.admin_pin };
        }
      } catch {
        if (member.notes.startsWith('pin:')) {
          authData = { plain_pin: member.notes.replace('pin:', '').trim() };
        }
      }
    }

    let isValid = false;
    if (authData && authData.hash && authData.salt) {
      // Özel şifre varsa sadece güncel hash kabul edilir
      isValid = verifyPin(cleanPin, authData.hash, authData.salt);
    } else if (authData && authData.plain_pin) {
      isValid = (cleanPin === authData.plain_pin);
    } else {
      // Özel şifre yoksa bootstrap şifre kabul edilir
      isValid = (cleanPin === DEFAULT_BOOTSTRAP_PIN || cleanPin.toUpperCase() === DEFAULT_BOOTSTRAP_PIN);
    }

    if (isValid) {
      return res.status(200).json({ success: true, message: 'Doğrulama başarılı.' });
    }

    return res.status(401).json({ success: false, message: 'Hatalı PIN kodu.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Sunucu doğrulama hatası.' });
  }
}
