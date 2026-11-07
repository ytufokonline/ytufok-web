import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { createAdminSessionToken, checkRateLimit, getClientIp } from './_security.js';

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

// Sunucu tarafında saklanan yönetim kurulu profilleri (Client JS bundle'a ASLA dahil edilmez)
const SERVER_ADMIN_PROFILES = [
  { id: 'admin-baskan', role: 'president', title: 'Kulüp Başkanı', short_title: 'Başkan', full_name: 'Sıla Dönmez', student_number: '24084005', phone: '', avatar_color: 'from-[#4b253b] via-[#301322] to-[#657796]' },
  { id: 'admin-by1', role: 'vice_president_1', title: 'Başkan Yardımcısı', short_title: 'Başkan Yrd.', full_name: 'Yavuz Selim Bahadır', student_number: '21065054', phone: '', avatar_color: 'from-[#657796] via-[#4e3b52] to-[#301322]' },
  { id: 'admin-by2', role: 'vice_president_2', title: 'Başkan Yardımcısı', short_title: 'Başkan Yrd.', full_name: 'Alara Tezelli', student_number: '23084041', phone: '', avatar_color: 'from-[#584964] via-[#4b253b] to-[#8193b2]' },
  { id: 'admin-sayman', role: 'treasurer', title: 'Mali İşler Sorumlusu (Sayman)', short_title: 'Sayman', full_name: 'Duru Anlar', student_number: '23084006', phone: '', avatar_color: 'from-[#301322] via-[#421d31] to-[#5b657e]' },
  { id: 'admin-sekreter', role: 'secretary', title: 'Genel Sekreter & Arşiv', short_title: 'Genel Sekreter', full_name: 'Yağmur Dursun', student_number: '24084023', phone: '', avatar_color: 'from-[#421d31] via-[#584964] to-[#657796]' },
  { id: 'admin-sosyal-medya', role: 'social_media', title: 'Sosyal Medya Koordinatörü', short_title: 'Sosyal Medya Koord.', full_name: 'Sümeyra Sever', student_number: '24084024', phone: '', avatar_color: 'from-[#6e2a4f] via-[#541e3d] to-[#7d8fa9]' },
  { id: 'admin-gezi', role: 'trip_coordinator', title: 'Gezi Koordinatörü', short_title: 'Gezi Koord.', full_name: 'İlayda Sudem Güneş', student_number: '24084602', phone: '', avatar_color: 'from-[#38263a] via-[#4b253b] to-[#657796]' },
  { id: 'admin-sponsorluk', role: 'sponsorship', title: 'Sponsorluk Koordinatörü', short_title: 'Sponsorluk Koord.', full_name: 'Öykü Aydın', student_number: '24084025', phone: '', avatar_color: 'from-[#4e3b52] via-[#301322] to-[#8193b2]' }
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

  // 1. IP ve Kullanıcı bazlı Rate Limiting (Kaba kuvvet koruması - BULGU-07)
  const clientIp = getClientIp(req);
  const ipLimit = checkRateLimit(`login-ip:${clientIp}`, { maxRequests: 5, windowMs: 300000, lockoutMs: 300000 });
  if (!ipLimit.allowed) {
    return res.status(429).json({
      success: false,
      message: ipLimit.message
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { studentNumber, pin } = body || {};

    if (!studentNumber || !pin) {
      return res.status(400).json({ success: false, message: 'Öğrenci numarası ve şifre gereklidir.' });
    }

    const cleanNo = String(studentNumber).trim().toLowerCase().replace(/\s+/g, '');
    const cleanPin = String(pin).trim();

    // Öğrenci numarasına özel rate limiting
    const accountLimit = checkRateLimit(`login-acc:${cleanNo}`, { maxRequests: 5, windowMs: 300000, lockoutMs: 300000 });
    if (!accountLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: accountLimit.message
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 2. Canlı veritabanından üyeyi sorgula (Asla önbellekten okuma)
    const { data: member } = await supabase
      .from('members')
      .select('id, student_number, full_name, department, role, member_type, status, notes')
      .eq('student_number', cleanNo)
      .maybeSingle();

    // Yönetici kontrolü
    const matchedProfile = SERVER_ADMIN_PROFILES.find(
      (a) => a.student_number.toLowerCase().replace(/\s+/g, '') === cleanNo
    );

    const isAuthorizedAdmin = (
      matchedProfile ||
      (member && (member.role === 'board' || member.role === 'admin' || member.role === 'audit' || member.member_type === 'board' || member.member_type === 'audit'))
    );

    if (!isAuthorizedAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Girdiğiniz öğrenci numarasına ait yönetici hesabı bulunamadı.'
      });
    }

    // 3. Veritabanındaki güncel şifre verisini kontrol et
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

    let isPasswordValid = false;

    if (authData && authData.hash && authData.salt) {
      isPasswordValid = verifyPin(cleanPin, authData.hash, authData.salt);
    } else if (authData && authData.plain_pin) {
      isPasswordValid = (cleanPin === authData.plain_pin);
    } else {
      isPasswordValid = (cleanPin === DEFAULT_BOOTSTRAP_PIN || cleanPin.toUpperCase() === DEFAULT_BOOTSTRAP_PIN);
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Öğrenci numarası veya şifre hatalı.'
      });
    }

    // 4. Giriş başarılı: Profil nesnesi oluştur ve İMZALI OTURUM TOKENI (JWT/HMAC) üret
    const profileToReturn = matchedProfile || {
      id: member.id,
      role: member.role || 'board',
      title: 'Yönetim Kurulu Üyesi',
      short_title: 'Yönetim',
      full_name: member.full_name,
      student_number: member.student_number,
      phone: '',
      avatar_color: 'from-[#4e3b52] via-[#301322] to-[#8193b2]'
    };

    // Sunucu imzalı oturum token'ı oluştur (Client-side manipülasyonu imkansızdır - BULGU-05)
    const token = createAdminSessionToken(profileToReturn);

    // Profil listesini sadece giriş yapan yetkiliye döndür (Bundle'da sızmaz - BULGU-03)
    const sanitizedProfiles = SERVER_ADMIN_PROFILES.map(p => ({
      id: p.id,
      role: p.role,
      title: p.title,
      short_title: p.short_title,
      full_name: p.full_name,
      avatar_color: p.avatar_color
    }));

    return res.status(200).json({
      success: true,
      message: 'Giriş başarılı.',
      token: token,
      admin: profileToReturn,
      profiles: sanitizedProfiles
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Sunucu doğrulama hatası oluştu.' });
  }
}
