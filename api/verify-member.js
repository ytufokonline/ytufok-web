import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from './_security.js';

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

  // 1. Rate Limiting: Öğrenci no numarası taramasını engelle (BULGU-07)
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`verify-member:${clientIp}`, { maxRequests: 15, windowMs: 60000, lockoutMs: 180000 });
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      message: 'Çok fazla sorgu yapıldı. Lütfen birkaç dakika sonra tekrar deneyiniz.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { studentNumber, student_number } = body || {};

    const cleanNumber = String(studentNumber || student_number || '').trim();
    if (!cleanNumber || cleanNumber.length < 5) {
      return res.status(400).json({ success: false, message: 'Lütfen geçerli bir öğrenci numarası giriniz.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 2. Güvenli RPC dene
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('verify_student_member', {
        p_student_number: cleanNumber
      });
      if (!rpcErr && rpcData) {
        // GÜVENLİK (BULGU-06): role, member_type ve notes alanlarını ASLA dışarı sızdırma!
        return res.status(200).json({
          success: Boolean(rpcData.success),
          full_name: rpcData.member?.full_name || '',
          department: rpcData.member?.department || '',
          is_active: rpcData.member?.status === 'active',
          message: rpcData.message || (rpcData.success ? 'Kulüp üyeliğiniz doğrulandı.' : 'Üyelik bulunamadı.')
        });
      }
    } catch {
      // ignore and fallback
    }

    // 3. Güvenli tekil satır sorgusu
    const { data, error } = await supabase
      .from('members')
      .select('id, student_number, full_name, department, status')
      .ilike('student_number', cleanNumber)
      .maybeSingle();

    if (error || !data) {
      return res.status(200).json({
        success: false,
        message: 'Girdiğiniz öğrenci numarası kulüp üye listesinde bulunamadı.'
      });
    }

    if (data.status === 'suspended') {
      return res.status(200).json({
        success: false,
        is_active: false,
        full_name: data.full_name,
        message: 'Kulüp üyeliğiniz geçici olarak askıya alınmıştır. Detaylı bilgi için kulüp odamıza uğrayınız.'
      });
    }

    if (data.status === 'passive') {
      return res.status(200).json({
        success: false,
        is_active: false,
        full_name: data.full_name,
        message: 'Üyeliğiniz pasif durumdadır. Yeniden aktif etmek için kulüp odamıza uğrayınız.'
      });
    }

    // GÜVENLİK (BULGU-06): role ve member_type response'dan tamamen kaldırıldı!
    return res.status(200).json({
      success: true,
      is_active: true,
      full_name: data.full_name,
      department: data.department,
      message: `Hoş geldiniz, ${data.full_name} (${data.department}). Üyeliğiniz doğrulandı.`
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Doğrulama sunucu hatası.' });
  }
}
