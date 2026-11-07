import crypto from 'crypto';

// Sunucu tarafı gizli anahtarı (Vercel ortam değişkeni veya güçlü fallback)
const SESSION_SECRET = process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'ytufok_prod_secure_hmac_secret_2026_948172_c7e9a8f2b1d4e6';

/**
 * 1. KRİPTOGRAFİK YÖNETİCİ OTURUM TOKENI (HMAC-SHA256 İMZALI)
 * Token yapısı: base64url(payload) . base64url(hmac_signature)
 * İstemci tarafında manipüle edilemez; sunucu dışında üretilemez.
 */
export function createAdminSessionToken(admin) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    id: admin.id,
    student_number: String(admin.student_number || '').trim().toLowerCase(),
    full_name: admin.full_name,
    role: admin.role,
    title: admin.title || 'Yönetim Kurulu',
    short_title: admin.short_title || 'Yönetim',
    avatar_color: admin.avatar_color,
    iat: now,
    exp: now + (12 * 3600) // 12 saat geçerli
  };

  const payloadStr = JSON.stringify(payload);
  const data = Buffer.from(payloadStr, 'utf-8').toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyAdminSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  if (!data || !signature) return null;

  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);

    // Süre kontrolü
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * İstek başlığından (Authorization: Bearer <token> veya x-admin-token)
 * oturum token'ını alır ve doğrular.
 */
export function getAuthenticatedAdmin(req) {
  if (!req || !req.headers) return null;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  let token = '';

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }

  if (!token) return null;
  return verifyAdminSessionToken(token);
}

/**
 * 2. GELİŞMİŞ BELLEK-İÇİ RATE LIMITER (SLIDING WINDOW)
 * Kaba kuvvet (brute-force) ve servis dışı bırakma saldırılarına karşı korur.
 */
const rateLimitStore = new Map();

// Bellek sızıntısını önlemek için her 5 dakikada eski kayıtları temizle
if (typeof setInterval !== 'undefined') {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now - record.lastReset > 600000) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
  if (cleanupInterval.unref) cleanupInterval.unref();
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) return String(realIp).trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * @param {string} key - örn: `${ip}:login` veya `${ip}:${studentNumber}`
 * @param {object} opts - { maxRequests: 5, windowMs: 300000, lockoutMs: 300000 }
 */
export function checkRateLimit(key, { maxRequests = 5, windowMs = 300000, lockoutMs = 300000 } = {}) {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { count: 0, firstRequest: now, lastReset: now, lockedUntil: 0 };
    rateLimitStore.set(key, record);
  }

  // Kilit süresi kontrolü
  if (record.lockedUntil > now) {
    const remainingLock = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: remainingLock,
      message: `Çok fazla hatalı deneme yapıldı. Lütfen ${remainingLock} saniye sonra tekrar deneyiniz.`
    };
  }

  // Pencere süresi dolmuşsa sıfırla
  if (now - record.firstRequest > windowMs) {
    record.count = 0;
    record.firstRequest = now;
    record.lastReset = now;
  }

  record.count += 1;

  if (record.count > maxRequests) {
    record.lockedUntil = now + lockoutMs;
    const remainingLock = Math.ceil(lockoutMs / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: remainingLock,
      message: `Güvenlik limiti aşıldı. ${remainingLock} saniye boyunca işlem kısıtlandı.`
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    retryAfterSeconds: 0
  };
}

/**
 * 3. XSS VE ZARARLI GİRDİ SANITİZASYONU
 */
export function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // HTML tag karakterlerini temizle
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * 4. KİŞİSEL VERİ MASKESİ (KVKK)
 */
export function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 7) return '***';
  return clean.slice(0, 4) + ' *** ** ' + clean.slice(-2);
}

export function maskStudentNumber(no) {
  if (!no || typeof no !== 'string') return '';
  const clean = no.trim();
  if (clean.length < 5) return '****';
  return clean.slice(0, 4) + '****';
}
