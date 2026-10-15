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
    const targetStudentNo = ADMIN_ID_TO_STUDENT[adminId] || adminId;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Canlı veritabanından üye kaydını çek
    const { data: member, error } = await supabase
      .from('members')
      .select('notes')
      .eq('student_number', targetStudentNo)
      .maybeSingle();

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
