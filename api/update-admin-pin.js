import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';
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
    const { adminId, currentPin, newPin } = body || {};

    if (!adminId || !currentPin || !newPin) {
      return res.status(400).json({ success: false, message: 'Lütfen tüm alanları doldurunuz.' });
    }

    const cleanCurrent = String(currentPin).trim();
    const cleanNewPin = String(newPin).trim();

    if (cleanNewPin.length < 4) {
      return res.status(400).json({ success: false, message: 'Yeni şifre en az 4 karakter olmalıdır.' });
    }

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

    // 1. Canlı veritabanından güncel yönetici kaydını çek
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, student_number, full_name, role, member_type, notes')
      .eq('student_number', targetStudentNo)
      .maybeSingle();

    if (memberError || !member) {
      return res.status(404).json({ success: false, message: 'Yönetici hesabı bulunamadı.' });
    }

    // 2. Mevcut şifreyi doğrula (Eski şifre kontrolü)
    let authData = null;
    if (member.notes) {
      try {
        const parsed = JSON.parse(member.notes);
        if (parsed.auth && parsed.auth.hash && parsed.auth.salt) {
          authData = parsed.auth;
        } else if (parsed.admin_pin) {
          // Eski düz metin formatından migrasyon desteği
          authData = { plain_pin: parsed.admin_pin };
        }
      } catch {
        if (member.notes.startsWith('pin:')) {
          authData = { plain_pin: member.notes.replace('pin:', '').trim() };
        }
      }
    }

    let isCurrentValid = false;
    if (authData && authData.hash && authData.salt) {
      // Kullanıcı daha önce şifre değiştirmiş; sadece veritabanındaki hash ile doğrulanır
      // (Eski varsayılan şifre YTUFOK19 bu kullanıcı için kesinlikle geçersizdir)
      isCurrentValid = verifyPin(cleanCurrent, authData.hash, authData.salt);
    } else if (authData && authData.plain_pin) {
      isCurrentValid = (cleanCurrent === authData.plain_pin);
    } else {
      // Kullanıcı ilk defa şifre belirliyor; başlangıç bootstrap şifresi geçerlidir
      isCurrentValid = (cleanCurrent === DEFAULT_BOOTSTRAP_PIN || cleanCurrent.toUpperCase() === DEFAULT_BOOTSTRAP_PIN);
    }

    if (!isCurrentValid) {
      return res.status(400).json({ success: false, message: 'Mevcut şifreniz hatalı.' });
    }

    // 3. Yeni şifreyi PBKDF2 + tuzlama (salt) ile kriptografik olarak hash'le
    const { hash, salt } = hashPin(cleanNewPin);

    // 4. Veritabanındaki üyeyi yeni hash ile güncelle (Eski şifre tamamen geçersiz kılınır)
    const newAuthPayload = {
      auth: {
        hash,
        salt,
        has_custom_password: true,
        updated_at: new Date().toISOString()
      }
    };

    const { error: updateError } = await supabase
      .from('members')
      .update({
        notes: JSON.stringify(newAuthPayload),
        updated_at: new Date().toISOString()
      })
      .eq('student_number', targetStudentNo);

    if (updateError) {
      return res.status(500).json({ success: false, message: 'Yeni şifre veritabanına kaydedilirken hata oluştu.' });
    }

    // admin_profiles tablosu mevcutsa senkron tutmaya çalış
    try {
      await supabase
        .from('admin_profiles')
        .upsert({
          id: adminId,
          pin: hash,
          pin_updated_at: new Date().toISOString()
        });
    } catch {
      // ignore
    }

    return res.status(200).json({
      success: true,
      message: 'Şifreniz güvenli bir şekilde güncellendi. Eski şifrenizin geçerliliği tamamen sonlandırıldı.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası oluştu.' });
  }
}
