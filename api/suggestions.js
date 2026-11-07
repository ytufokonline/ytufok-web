import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { getAuthenticatedAdmin, checkRateLimit, getClientIp, sanitizeString } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';
const TMP_FILE = '/tmp/ytufok_suggestions_v1.json';

function readLocalTmp() {
  if (globalThis.__ytufokSuggestions) {
    return globalThis.__ytufokSuggestions;
  }
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      globalThis.__ytufokSuggestions = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function writeLocalTmp(list) {
  globalThis.__ytufokSuggestions = list;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(list), 'utf-8');
  } catch {
    // ignore
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIp = getClientIp(req);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // POST: Yeni etkinlik önerisi oluştur (Herkes önerebilir, rate-limitli ve sterilize)
  if (req.method === 'POST') {
    const rateLimit = checkRateLimit(`suggestion-post:${clientIp}`, { maxRequests: 5, windowMs: 600000, lockoutMs: 600000 });
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, message: rateLimit.message });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { title, description, category, location, suggested_by, contact_info } = body || {};

      if (!title || !description) {
        return res.status(400).json({ success: false, message: 'Etkinlik başlığı ve açıklaması zorunludur.' });
      }

      const newSuggestion = {
        id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: sanitizeString(title, 120),
        description: sanitizeString(description, 1000),
        category: sanitizeString(category || 'gezi', 40),
        location: location ? sanitizeString(location, 120) : null,
        suggested_by: suggested_by && String(suggested_by).trim() ? sanitizeString(suggested_by, 60) : 'Anonim Üye',
        contact_info: contact_info ? sanitizeString(contact_info, 80) : null,
        status: 'pending',
        admin_notes: null,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from('event_suggestions').insert([newSuggestion]);
      } catch {
        // ignore
      }

      const localList = readLocalTmp();
      localList.unshift(newSuggestion);
      writeLocalTmp(localList.slice(0, 100));

      return res.status(201).json({ success: true, message: 'Öneriniz yönetime iletildi!', suggestion: newSuggestion });
    } catch {
      return res.status(500).json({ success: false, message: 'Öneri kaydedilirken sunucu hatası oluştu.' });
    }
  }

  // GET, PATCH, DELETE: SADECE YETKİLİ YÖNETİCİLER ERİŞEBİLİR (BULGU-02 / BULGU-08 KORUMASI)
  const authenticatedAdmin = getAuthenticatedAdmin(req);
  if (!authenticatedAdmin) {
    return res.status(401).json({
      success: false,
      message: 'Bu işlem için yetkili yönetici oturumu gereklidir.'
    });
  }

  // GET: Tüm önerileri listele (Yalnızca yetkili yöneticiye açık)
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('event_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        writeLocalTmp(data);
        return res.status(200).json(data);
      }
    } catch {
      // ignore
    }

    const localList = readLocalTmp();
    localList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.status(200).json(localList);
  }

  // PATCH: Öneri durumunu veya yönetim notunu güncelle
  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, status, admin_notes } = body || {};

      if (!id) {
        return res.status(400).json({ success: false, message: 'Öneri ID gereklidir.' });
      }

      const updates = {};
      if (status) updates.status = sanitizeString(status, 30);
      if (admin_notes !== undefined) updates.admin_notes = sanitizeString(admin_notes, 500);

      try {
        await supabase.from('event_suggestions').update(updates).eq('id', id);
      } catch {
        // ignore
      }

      const localList = readLocalTmp();
      const idx = localList.findIndex((s) => s.id === id);
      if (idx !== -1) {
        localList[idx] = { ...localList[idx], ...updates };
        writeLocalTmp(localList);
      }

      return res.status(200).json({ success: true, message: 'Öneri güncellendi.' });
    } catch {
      return res.status(500).json({ success: false, message: 'Güncelleme sunucu hatası.' });
    }
  }

  // DELETE: Öneriyi sil
  if (req.method === 'DELETE') {
    try {
      const id = req.query?.id || (typeof req.body === 'object' ? req.body?.id : null);
      if (!id) {
        return res.status(400).json({ success: false, message: 'Silinecek ID belirtilmedi.' });
      }

      try {
        await supabase.from('event_suggestions').delete().eq('id', id);
      } catch {
        // ignore
      }

      const localList = readLocalTmp().filter((s) => s.id !== id);
      writeLocalTmp(localList);

      return res.status(200).json({ success: true, message: 'Öneri silindi.' });
    } catch {
      return res.status(500).json({ success: false, message: 'Silme işlemi hatası.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
