import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedAdmin } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
// Öncelikli olarak service_role key kullanılır; tanımlı değilse anon key'e döner
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. ZORUNLU SUNUCU TARAFI OTURUM KONTROLÜ (BULGU-05 KORUMASI)
  const authenticatedAdmin = getAuthenticatedAdmin(req);
  if (!authenticatedAdmin) {
    return res.status(401).json({
      success: false,
      message: 'Yetkisiz işlem: Bu endpoint yalnızca geçerli bir yönetici oturum tokenı ile çağrılabilir.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, payload } = body || {};

    if (!action) {
      return res.status(400).json({ success: false, message: 'Geçersiz istek: action parametresi gereklidir.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // ==========================================
    // 0. ADMIN BUNDLE (YÖNETİCİ PANELİ TOPLU VERİ ÇEKİMİ)
    // ==========================================
    if (action === 'get_admin_bundle') {
      const [memRes, resRes, darkRes, sugRes] = await Promise.all([
        supabase.from('members').select('*').order('full_name', { ascending: true }),
        supabase.from('reservations').select('*').order('created_at', { ascending: false }),
        supabase.from('darkroom_reservations').select('*').order('created_at', { ascending: false }),
        supabase.from('event_suggestions').select('*').order('created_at', { ascending: false })
      ]);

      return res.status(200).json({
        success: true,
        data: {
          members: memRes.data || [],
          reservations: resRes.data || [],
          darkroomReservations: darkRes.data || [],
          eventSuggestions: sugRes.data || []
        }
      });
    }

    // ==========================================
    // 1. ÜYE YÖNETİMİ (MEMBERS)
    // ==========================================
    if (action === 'get_members') {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (action === 'add_member') {
      const { data, error } = await supabase
        .from('members')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'update_member') {
      const { id, updates } = payload || {};
      if (!id || !updates) {
        return res.status(400).json({ success: false, message: 'id ve updates gereklidir.' });
      }

      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete_member') {
      const { id } = payload || {};
      if (!id) return res.status(400).json({ success: false, message: 'id gereklidir.' });

      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Üye silindi.' });
    }

    // ==========================================
    // 2. REZERVASYON YÖNETİMİ (RESERVATIONS)
    // ==========================================
    if (action === 'get_reservations') {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (action === 'update_reservation') {
      const { id, updates } = payload || {};
      if (!id || !updates) {
        return res.status(400).json({ success: false, message: 'id ve updates gereklidir.' });
      }

      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete_reservation') {
      const { id } = payload || {};
      if (!id) return res.status(400).json({ success: false, message: 'id gereklidir.' });

      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Rezervasyon silindi.' });
    }

    if (action === 'clear_all_reservations') {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Tüm rezervasyonlar temizlendi.' });
    }

    // ==========================================
    // 3. DUYURU YÖNETİMİ (ANNOUNCEMENTS)
    // ==========================================
    if (action === 'create_announcement') {
      const { data, error } = await supabase
        .from('announcements')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'update_announcement') {
      const { id, updates } = payload || {};
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete_announcement') {
      const { id } = payload || {};
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Duyuru silindi.' });
    }

    // ==========================================
    // 4. EKİPMAN YÖNETİMİ (EQUIPMENT)
    // ==========================================
    if (action === 'create_equipment') {
      const { data, error } = await supabase
        .from('equipment')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'update_equipment') {
      const { id, updates } = payload || {};
      const { data, error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete_equipment') {
      const { id } = payload || {};
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Ekipman silindi.' });
    }

    // ==========================================
    // 5. KARANLIK ODA YÖNETİMİ
    // ==========================================
    if (action === 'get_darkroom_reservations') {
      const { data, error } = await supabase
        .from('darkroom_reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (action === 'update_darkroom_reservation') {
      const { id, updates } = payload || {};
      const { data, error } = await supabase
        .from('darkroom_reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete_darkroom_reservation') {
      const { id } = payload || {};
      const { error } = await supabase
        .from('darkroom_reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Karanlık oda rezervasyonu silindi.' });
    }

    if (action === 'create_slot') {
      const { data, error } = await supabase
        .from('darkroom_slots')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'create_slots_batch') {
      const { data, error } = await supabase
        .from('darkroom_slots')
        .insert(payload)
        .select();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'update_slot') {
      const { id, updates } = payload || {};
      const { data, error } = await supabase
        .from('darkroom_slots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete_slot') {
      const { id } = payload || {};
      const { error } = await supabase
        .from('darkroom_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Seans silindi.' });
    }

    // ==========================================
    // 6. GEZİ YÖNETİMİ (TRIPS)
    // ==========================================
    if (action === 'create_trip') {
      const { data, error } = await supabase
        .from('trips')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'update_trip') {
      const { id, updates } = payload || {};
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete_trip') {
      const { id } = payload || {};
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Gezi silindi.' });
    }

    // ==========================================
    // 7. ETKİNLİK YÖNETİMİ (CLUB EVENTS)
    // ==========================================
    if (action === 'create_event') {
      const { data, error } = await supabase
        .from('club_events')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'update_event') {
      const { id, updates } = payload || {};
      const { data, error } = await supabase
        .from('club_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete_event') {
      const { id } = payload || {};
      const { error } = await supabase
        .from('club_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Etkinlik silindi.' });
    }

    // ==========================================
    // 8. ETKİNLİK ÖNERİLERİ (EVENT SUGGESTIONS)
    // ==========================================
    if (action === 'get_suggestions') {
      const { data, error } = await supabase
        .from('event_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (action === 'update_suggestion') {
      const { id, updates } = payload || {};
      const { data, error } = await supabase
        .from('event_suggestions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (action === 'delete_suggestion') {
      const { id } = payload || {};
      const { error } = await supabase
        .from('event_suggestions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Öneri silindi.' });
    }

    // ==========================================
    // 9. ETKİNLİK DEĞERLENDİRMELERİ (EVALUATIONS)
    // ==========================================
    if (action === 'delete_evaluation') {
      const { id } = payload || {};
      const { error } = await supabase
        .from('event_evaluations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Değerlendirme silindi.' });
    }

    return res.status(400).json({ success: false, message: `Bilinmeyen aksiyon: ${action}` });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'İşlem yürütülürken sunucu hatası oluştu.'
    });
  }
}
