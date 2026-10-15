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
    const { studentNumber } = body || {};

    const cleanNumber = String(studentNumber || '').trim();
    if (!cleanNumber) {
      return res.status(400).json({ success: false, message: 'Lütfen geçerli bir öğrenci numarası giriniz.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Try Supabase RPC first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('verify_student_member', {
        p_student_number: cleanNumber
      });

      if (!rpcError && rpcData) {
        return res.status(200).json(rpcData);
      }
    } catch {
      // Fallback
    }

    // 2. Safe single row lookup (select only safe public fields, never phone/email of all users)
    const { data, error } = await supabase
      .from('members')
      .select('id, student_number, full_name, department, status, role, penalty_count, penalty_reason')
      .eq('student_number', cleanNumber)
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
        member: data,
        message: `Rezervasyon yapamazsınız: Üyeliğiniz kısıtlanmıştır/cezalıdır. Gerekçe: ${data.penalty_reason || 'İade gecikmesi veya hasar.'}`
      });
    }

    if (data.status === 'passive') {
      return res.status(200).json({
        success: false,
        member: data,
        message: 'Üyeliğiniz pasif durumdadır. Yeniden aktif etmek için kulüp odamıza uğrayınız.'
      });
    }

    return res.status(200).json({
      success: true,
      member: data,
      message: `Hoş geldiniz, ${data.full_name} (${data.department}). Üyeliğiniz aktif.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Doğrulama sunucu hatası.' });
  }
}
