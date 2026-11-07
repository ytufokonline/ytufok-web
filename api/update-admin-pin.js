import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkRateLimit, getClientIp, getAuthenticatedAdmin } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';
const DEFAULT_BOOTSTRAP_PIN = 'YTUFOK19';

function hashPin(pin, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 10000, 32, 'sha256').toString('hex');
  return { hash, salt };
}

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
  const rateLimit = checkRateLimit(`pin-update-ip:${clientIp}`, { maxRequests: 5, windowMs: 600000, lockoutMs: 600000 });
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      message: rateLimit.message
    });
  }

  // Güvenlik: Oturum doğrulaması (Yetkisiz şifre değiştirme engeli)
  const authenticatedAdmin = getAuthenticatedAdmin(req);

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { adminId, currentPin, newPin } = body || {};

    if (!adminId || !currentPin || !newPin) {
      return res.status(400).json({ success: false, message: 'Lütfen tüm alanları doldurunuz.' });
    }

    const cleanCurrent = String(currentPin).trim();
    const cleanNewPin = String(newPin).trim();

    if (cleanNewPin.length < 4) {
      return res.status(400).json({ success: false, message: 'Yeni şifre en az 4 karakter olmalıdır.' });
    }

    const cleanAdminId = String(adminId).trim();

    // Oturum sahibi yalnızca kendi şifresini değiştirebilir
    if (authenticatedAdmin && authenticatedAdmin.id !== cleanAdminId && authenticatedAdmin.student_number !== cleanAdminId) {
      return res.status(403).json({
        success: false,
        message: 'Yalnızca kendi yönetici şifrenizi güncelleyebilirsiniz.'
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    let member = null;

    // A. Slug haritalamasından öğrenci numarası ile kontrol
    const mappedStudentNo = ADMIN_ID_TO_STUDENT[cleanAdminId];
    if (mappedStudentNo) {
      const { data } = await supabase
        .from('members')
        .select('id, student_number, full_name, role, member_type, notes')
        .eq('student_number', mappedStudentNo)
        .maybeSingle();
      if (data) member = data;
    }

    // B. UUID kontrolü
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanAdminId);
    if (!member && isUuid) {
      const { data } = await supabase
        .from('members')
        .select('id, student_number, full_name, role, member_type, notes')
        .eq('id', cleanAdminId)
        .maybeSingle();
      if (data) member = data;
    }

    // C. Doğrudan öğrenci numarası kontrolü
    if (!member) {
      const cleanNo = cleanAdminId.toLowerCase().replace(/\s+/g, '');
      const { data } = await supabase
        .from('members')
        .select('id, student_number, full_name, role, member_type, notes')
        .eq('student_number', cleanNo)
        .maybeSingle();
      if (data) member = data;
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Yönetici üye kaydı bulunamadı.'
      });
    }

    // 2. Mevcut şifreyi doğrula
    let authData = null;
    let existingNotesObj = {};
    if (member.notes) {
      try {
        existingNotesObj = JSON.parse(member.notes);
        if (existingNotesObj.auth && existingNotesObj.auth.hash && existingNotesObj.auth.salt) {
          authData = existingNotesObj.auth;
        } else if (existingNotesObj.admin_pin) {
          authData = { plain_pin: existingNotesObj.admin_pin };
        }
      } catch {
        if (member.notes.startsWith('pin:')) {
          authData = { plain_pin: member.notes.replace('pin:', '').trim() };
        }
      }
    }

    let isCurrentPinValid = false;
    if (authData && authData.hash && authData.salt) {
      isCurrentPinValid = verifyPin(cleanCurrent, authData.hash, authData.salt);
    } else if (authData && authData.plain_pin) {
      isCurrentPinValid = (cleanCurrent === authData.plain_pin);
    } else {
      isCurrentPinValid = (cleanCurrent === DEFAULT_BOOTSTRAP_PIN || cleanCurrent.toUpperCase() === DEFAULT_BOOTSTRAP_PIN);
    }

    if (!isCurrentPinValid) {
      return res.status(401).json({
        success: false,
        message: 'Girdiğiniz mevcut şifre hatalıdır.'
      });
    }

    // 3. Yeni şifre için tuzlu kriptografik hash oluştur
    const newAuthHash = hashPin(cleanNewPin);
    const updatedNotesObj = {
      ...existingNotesObj,
      auth: newAuthHash,
      admin_pin_updated_at: new Date().toISOString()
    };
    delete updatedNotesObj.admin_pin; // Düz metin şifreyi kesinlikle sil

    const { error: updateError } = await supabase
      .from('members')
      .update({ notes: JSON.stringify(updatedNotesObj) })
      .eq('id', member.id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Şifre güncellenirken veritabanı hatası oluştu.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Yönetici şifreniz başarıyla güncellendi.'
    });
  } catch {
    return res.status(500).json({ success: false, message: 'İşlem sırasında sunucu hatası oluştu.' });
  }
}
