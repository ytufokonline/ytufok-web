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
    const { adminId, pin } = body || {};

    if (!adminId || !pin) {
      return res.status(400).json({ success: false, message: 'Yönetici ve PIN bilgisi gereklidir.' });
    }

    const cleanPin = String(pin).trim();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Try Supabase RPC first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('verify_admin_pin', {
        p_admin_id: adminId,
        p_pin: cleanPin
      });

      if (!rpcError && rpcData) {
        return res.status(200).json(rpcData);
      }
    } catch {
      // Fallback to table check on server if RPC not defined yet
    }

    // 2. Server-side table check fallback
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('pin')
      .eq('id', adminId)
      .maybeSingle();

    if (error || !data) {
      // Default fallback PIN for initial accounts if row doesn't exist
      if (cleanPin === '19111994') {
        return res.status(200).json({ success: true, message: 'Giriş başarılı.' });
      }
      return res.status(200).json({ success: false, message: 'Hatalı PIN kodu.' });
    }

    const storedPin = String(data.pin || '19111994').trim();
    if (storedPin === cleanPin) {
      return res.status(200).json({ success: true, message: 'Giriş başarılı.' });
    }

    return res.status(200).json({ success: false, message: 'Hatalı PIN kodu.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Sunucu doğrulama hatası.' });
  }
}
