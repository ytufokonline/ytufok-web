import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkRateLimit, getClientIp, createAdminSessionToken } from './_security.js';

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

const ADMIN_ID_TO_STUDENT = {
  'admin-baskan': '24084005',
  'admin-by1': '21065054',
  'admin-by2': '23084041',
  'admin-sayman': '23084006',
  'admin-sekreter': '24084023',
  'admin-sosyal-medya': '24084024',
  'admin-gezi': '24084602',
  'admin-sponsorluk': '24084025'
};

const SERVER_ADMIN_FALLBACKS = [
  { id: 'admin-baskan', full_name: 'Sıla Dönmez', student_number: '24084005', role: 'president', title: 'Kulüp Başkanı', short_title: 'Başkan', avatar_color: 'from-[#4b253b] via-[#301322] to-[#657796]' },
  { id: 'admin-by1', full_name: 'Yavuz Selim Bahadır', student_number: '21065054', role: 'vice_president_1', title: 'Başkan Yardımcısı', short_title: 'Başkan Yrd.', avatar_color: 'from-[#657796] via-[#4e3b52] to-[#301322]' },
  { id: 'admin-by2', full_name: 'Alara Tezelli', student_number: '23084041', role: 'vice_president_2', title: 'Başkan Yardımcısı', short_title: 'Başkan Yrd.', avatar_color: 'from-[#584964] via-[#4b253b] to-[#8193b2]' },
  { id: 'admin-sayman', full_name: 'Duru Anlar', student_number: '23084006', role: 'treasurer', title: 'Sayman', short_title: 'Sayman', avatar_color: 'from-[#301322] via-[#421d31] to-[#5b657e]' },
  { id: 'admin-sekreter', full_name: 'Yağmur Dursun', student_number: '24084023', role: 'secretary', title: 'Genel Sekreter', short_title: 'Genel Sekreter', avatar_color: 'from-[#421d31] via-[#584964] to-[#657796]' },
  { id: 'admin-sosyal-medya', full_name: 'Sümeyra Sever', student_number: '24084024', role: 'social_media', title: 'Sosyal Medya Koord.', short_title: 'Sosyal Medya', avatar_color: 'from-[#6e2a4f] via-[#541e3d] to-[#7d8fa9]' },
  { id: 'admin-gezi', full_name: 'İlayda Sudem Güneş', student_number: '24084602', role: 'trip_coordinator', title: 'Gezi Koord.', short_title: 'Gezi', avatar_color: 'from-[#38263a] via-[#4b253b] to-[#657796]' },
  { id: 'admin-sponsorluk', full_name: 'Öykü Aydın', student_number: '24084025', role: 'sponsorship', title: 'Sponsorluk Koord.', short_title: 'Sponsorluk', avatar_color: 'from-[#4e3b52] via-[#301322] to-[#8193b2]' }
];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Rate Limiting (Kaba kuvvet koruması - BULGU-07)
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`pin-verify-ip:${clientIp}`, { maxRequests: 5, windowMs: 300000, lockoutMs: 300000 });
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      message: rateLimit.message
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { adminId, pin } = body || {};

    if (!adminId || !pin) {
      return res.status(400).json({ success: false, message: 'Yönetici ve PIN bilgisi gereklidir.' });
    }

    const cleanAdminId = String(adminId).trim();
    const cleanPin = String(pin).trim();

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Canlı veritabanından üye kaydını çek
    let member = null;

    // A. Slug haritalaması
    const mappedStudentNo = ADMIN_ID_TO_STUDENT[cleanAdminId];
    if (mappedStudentNo) {
      const { data } = await supabase
        .from('members')
        .select('id, student_number, full_name, role, notes')
        .eq('student_number', mappedStudentNo)
        .maybeSingle();
      if (data) member = data;
    }

    // B. UUID kontrolü
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanAdminId);
    if (!member && isUuid) {
      const { data } = await supabase
        .from('members')
        .select('id, student_number, full_name, role, notes')
        .eq('id', cleanAdminId)
        .maybeSingle();
      if (data) member = data;
    }

    // C. Öğrenci numarası kontrolü
    if (!member) {
      const cleanNo = cleanAdminId.toLowerCase().replace(/\s+/g, '');
      const { data } = await supabase
        .from('members')
        .select('id, student_number, full_name, role, notes')
        .eq('student_number', cleanNo)
        .maybeSingle();
      if (data) member = data;
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

    let isPinValid = false;

    if (authData && authData.hash && authData.salt) {
      isPinValid = verifyPin(cleanPin, authData.hash, authData.salt);
    } else if (authData && authData.plain_pin) {
      isPinValid = (cleanPin === authData.plain_pin);
    } else {
      isPinValid = (cleanPin === DEFAULT_BOOTSTRAP_PIN || cleanPin.toUpperCase() === DEFAULT_BOOTSTRAP_PIN);
    }

    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: 'Girdiğiniz PIN şifresi hatalıdır.'
      });
    }

    // Doğrulama başarılı - Yönetici profilini bul ve yeni token üret
    const fallbackProfile = SERVER_ADMIN_FALLBACKS.find(p => p.id === cleanAdminId || p.student_number === cleanAdminId);
    const adminProfile = fallbackProfile || {
      id: member?.id || cleanAdminId,
      full_name: member?.full_name || 'Yönetici',
      student_number: member?.student_number || '',
      role: member?.role || 'board',
      title: 'Yönetim Kurulu',
      short_title: 'Yönetim'
    };

    const token = createAdminSessionToken(adminProfile);

    return res.status(200).json({
      success: true,
      message: 'PIN doğrulandı.',
      token: token,
      admin: adminProfile
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Doğrulama sunucu hatası.' });
  }
}
