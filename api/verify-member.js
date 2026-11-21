import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hqmwlrilmtblnsumwcmr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_FprSN-yF3DLUu8MRs-g7Yg_gSC9TQvj';

// 127 Aktif Üye Öğrenci Numaraları Listesi (Kasım 2026)
const ACTIVE_STUDENT_WHITELIST = new Set([
  '25093029', '25035705', '26046070', '2408a032', '2605c004', '26046027', '23028704', '24089053',
  '25033602', '23065601', '2,50e+10', '25014017', '24036029', '2508a018', '2505a007', '24089052',
  '24033616', '26084012', '26034015', '25049039', '24033079', '24024016', '24015050', '26054020',
  '24084042', '26041804', '25084016', '26084010', '2308a051', '24033033', '23011079', '25051010',
  '2608b007', '26840019', '26056033', '23065036', '26015028', '25028058', '26037022', 'teknopark',
  '26027015', '24037055', '26018021', '26084016', '25061007', '2605b015', '26084007', '26051002',
  '25056033', '25033052', '2505a020', '25023019', '26037030', '26141401011', '25084011', '26012073',
  '25046613', '25084028', '25037013', '24084017', '2608a010', '26065013', '26028019', '25094610',
  '24012059', '25049013', '12042119', '26084015', '26099006', '2608b604', '2502e045', '26096016',
  '26073021', '2605a001', '23084602', '25056017', '23052001', '26065078', '25058063', '25033057',
  '25035060', '2605a071', '25098010', '26084603', '26094025', '26084605', '23094029', '24091034',
  '25025011', '26061607', '26037611', '26036040', '25012020', 'g2410.0151017', '25035057', '2602e019',
  '2602d029', '23017019', '26084006', '2408a015', '25037036', '260b037', '26028048', '2608b026',
  '24041501', '25033009', '25049036', '25022501', '2508a035', '25022024', '22058602', '25015610',
  '26011065', 'kunt', '25065127', '26028043', '2608b019', '19065214', '26024608', '26073014',
  '250a3610', '26034612', '26058027', '26056007', '26072030', '26011026', '2609a801'
]);

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
  const rateLimit = checkRateLimit(`verify-member:${clientIp}`, { maxRequests: 20, windowMs: 60000, lockoutMs: 180000 });
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
    if (!cleanNumber || cleanNumber.length < 4) {
      return res.status(400).json({ success: false, message: 'Lütfen geçerli bir öğrenci numarası giriniz.' });
    }

    const normalizedNo = cleanNumber.toLowerCase().replace(/\s+/g, '');
    const isWhitelistedActive = ACTIVE_STUDENT_WHITELIST.has(normalizedNo);

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 2. Güvenli RPC dene
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('verify_student_member', {
        p_student_number: cleanNumber
      });
      if (!rpcErr && rpcData && rpcData.success) {
        const effType = (isWhitelistedActive || rpcData.member?.member_type === 'active' || rpcData.member?.role === 'admin' || rpcData.member?.role === 'board')
          ? 'active'
          : (rpcData.member?.member_type || 'normal');

        // GÜVENLİK (BULGU-06): role bilgisi ASLA dışarı sızdırılmaz (daima 'member' maskelenir).
        // member_type ise rezervasyon önceliği için güvenle döndürülür.
        return res.status(200).json({
          success: true,
          full_name: rpcData.member?.full_name || '',
          department: rpcData.member?.department || '',
          is_active: rpcData.member?.status === 'active',
          member_type: effType,
          member: {
            id: rpcData.member?.id || cleanNumber,
            student_number: rpcData.member?.student_number || cleanNumber,
            full_name: rpcData.member?.full_name || '',
            department: rpcData.member?.department || '',
            status: rpcData.member?.status || 'active',
            member_type: effType,
            role: 'member'
          },
          message: rpcData.message || 'Kulüp üyeliğiniz doğrulandı.'
        });
      }
    } catch {
      // ignore and fallback
    }

    // 3. Güvenli tekil satır sorgusu
    const { data, error } = await supabase
      .from('members')
      .select('id, student_number, full_name, department, status, role, member_type')
      .ilike('student_number', cleanNumber)
      .maybeSingle();

    if (error || !data) {
      // Eğer numarası beyaz listedeyse ama veritabanında henüz satırı yoksa otomatik güvenli üye kaydı oluştur
      if (isWhitelistedActive) {
        try {
          const newMember = {
            student_number: cleanNumber,
            full_name: `Kulüp Üyesi (${cleanNumber})`,
            department: 'Yıldız Teknik Üniversitesi',
            status: 'active',
            member_type: 'active',
            role: 'member'
          };
          const { data: inserted } = await supabase
            .from('members')
            .insert([newMember])
            .select()
            .maybeSingle();

          const finalRecord = inserted || newMember;
          return res.status(200).json({
            success: true,
            is_active: true,
            member_type: 'active',
            full_name: finalRecord.full_name,
            department: finalRecord.department,
            member: {
              id: finalRecord.id || cleanNumber,
              student_number: cleanNumber,
              full_name: finalRecord.full_name,
              department: finalRecord.department,
              status: 'active',
              member_type: 'active',
              role: 'member'
            },
            message: `Hoş geldiniz, ${finalRecord.full_name} (${finalRecord.department}). Aktif Üye olarak doğrulandınız.`
          });
        } catch {
          return res.status(200).json({
            success: true,
            is_active: true,
            member_type: 'active',
            full_name: `Kulüp Üyesi (${cleanNumber})`,
            department: 'Yıldız Teknik Üniversitesi',
            member: {
              id: cleanNumber,
              student_number: cleanNumber,
              full_name: `Kulüp Üyesi (${cleanNumber})`,
              department: 'Yıldız Teknik Üniversitesi',
              status: 'active',
              member_type: 'active',
              role: 'member'
            },
            message: `Hoş geldiniz. Aktif Üye olarak doğrulandınız.`
          });
        }
      }

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

    // Beyaz listedeyse ve DB'de active değilse arkaplanda güncelle
    if (isWhitelistedActive && (data.member_type !== 'active' || data.status !== 'active')) {
      supabase
        .from('members')
        .update({ status: 'active', member_type: 'active', updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .then(() => {})
        .catch(() => {});
    }

    const effType = (isWhitelistedActive || data.member_type === 'active' || data.role === 'admin' || data.role === 'board')
      ? 'active'
      : (data.member_type || 'normal');

    // GÜVENLİK (BULGU-06): role alanı ASLA sızdırılmaz (daima 'member' maskelenir).
    // member_type ise rezervasyon kuralları ve hakları için güvenle döner.
    return res.status(200).json({
      success: true,
      is_active: true,
      member_type: effType,
      full_name: data.full_name,
      department: data.department,
      member: {
        id: data.id,
        student_number: data.student_number,
        full_name: data.full_name,
        department: data.department,
        status: data.status,
        member_type: effType,
        role: 'member'
      },
      message: `Hoş geldiniz, ${data.full_name} (${data.department}). Üyeliğiniz doğrulandı.`
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Doğrulama sunucu hatası.' });
  }
}
