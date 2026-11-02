import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // GET: Tüm önerileri tarihe göre sıralı (yeniden eskiye) döndür
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
      // Supabase tablosu henüz yoksa yerel önbellekten oku
    }

    const localList = readLocalTmp();
    localList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.status(200).json(localList);
  }

  // POST: Yeni etkinlik önerisi oluştur (Anonim veya isimli)
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { title, description, category, location, suggested_by, contact_info } = body || {};

      if (!title || !description) {
        return res.status(400).json({ success: false, message: 'Etkinlik başlığı ve açıklaması zorunludur.' });
      }

      const newSuggestion = {
        id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: String(title).trim(),
        description: String(description).trim(),
        category: category ? String(category).trim() : 'gezi',
        location: location ? String(location).trim() : null,
        suggested_by: suggested_by && String(suggested_by).trim() ? String(suggested_by).trim() : 'Anonim Üye',
        contact_info: contact_info ? String(contact_info).trim() : null,
        status: 'pending',
        admin_notes: null,
        created_at: new Date().toISOString()
      };

      // 1. Supabase tablosuna yazmayı dene
      let supabaseSuccess = false;
      try {
        const { error: insErr } = await supabase
          .from('event_suggestions')
          .insert([newSuggestion]);
        if (!insErr) {
          supabaseSuccess = true;
        }
      } catch {
        // Tablo yoksa fallback yap
      }

      // 2. Yerel ve hafıza önbelleğine ekle
      const currentList = readLocalTmp();
      currentList.unshift(newSuggestion);
      writeLocalTmp(currentList);

      return res.status(201).json({
        success: true,
        message: 'Etkinlik öneriniz başarıyla iletildi! Yönetim kurulu olarak değerlendireceğiz.',
        suggestion: newSuggestion,
        synced: supabaseSuccess
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message || 'Öneri kaydedilemedi.' });
    }
  }

  // PATCH: Yönetim tarafından durum veya not güncelleme
  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, status, admin_notes } = body || {};

      if (!id) {
        return res.status(400).json({ success: false, message: 'ID gereklidir.' });
      }

      const updates = {};
      if (status !== undefined) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;

      try {
        await supabase.from('event_suggestions').update(updates).eq('id', id);
      } catch {
        // ignore
      }

      const currentList = readLocalTmp();
      const idx = currentList.findIndex(s => s.id === id);
      if (idx !== -1) {
        currentList[idx] = { ...currentList[idx], ...updates };
        writeLocalTmp(currentList);
      }

      return res.status(200).json({ success: true, message: 'Öneri güncellendi.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message || 'Güncelleme hatası.' });
    }
  }

  // DELETE: Öneriyi silme
  if (req.method === 'DELETE') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id } = body || req.query || {};

      if (!id) {
        return res.status(400).json({ success: false, message: 'ID gereklidir.' });
      }

      try {
        await supabase.from('event_suggestions').delete().eq('id', id);
      } catch {
        // ignore
      }

      const currentList = readLocalTmp();
      const filtered = currentList.filter(s => s.id !== id);
      writeLocalTmp(filtered);

      return res.status(200).json({ success: true, message: 'Öneri silindi.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message || 'Silme hatası.' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
