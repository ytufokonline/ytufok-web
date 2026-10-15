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
    const { adminId, currentPin, newPin } = body || {};

    if (!adminId || !currentPin || !newPin) {
      return res.status(400).json({ success: false, message: 'Tüm alanları doldurunuz.' });
    }

    const cleanNewPin = String(newPin).trim();
    if (cleanNewPin.length < 4) {
      return res.status(400).json({ success: false, message: 'Yeni PIN en az 4 karakter olmalıdır.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Try Supabase RPC first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_admin_pin', {
        p_admin_id: adminId,
        p_current_pin: String(currentPin).trim(),
        p_new_pin: cleanNewPin
      });

      if (!rpcError && rpcData) {
        return res.status(200).json(rpcData);
      }
    } catch {
      // Fallback
    }

    // 2. Server-side table update fallback
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('pin')
      .eq('id', adminId)
      .maybeSingle();

    const storedPin = String(data?.pin || '19111994').trim();
    if (storedPin !== String(currentPin).trim()) {
      return res.status(200).json({ success: false, message: 'Mevcut PIN şifresi hatalı.' });
    }

    const { error: updateError } = await supabase
      .from('admin_profiles')
      .upsert({
        id: adminId,
        pin: cleanNewPin,
        pin_updated_at: new Date().toISOString()
      });

    if (updateError) {
      return res.status(500).json({ success: false, message: 'PIN güncellenirken veritabanı hatası oluştu.' });
    }

    return res.status(200).json({ success: true, message: 'PIN şifreniz başarıyla güncellendi!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
}
