import fs from 'fs';

const TMP_FILE = '/tmp/ytufok_unified_state_v6.json';
const NTFY_TOPIC = 'ytufok_unified_state_v6_948172';
const BYTEBIN_BASE = 'https://bytebin.lucko.me';

function readLocalTmp() {
  if (globalThis.__ytufokUnifiedState) {
    return globalThis.__ytufokUnifiedState;
  }
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      globalThis.__ytufokUnifiedState = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeLocalTmp(state) {
  globalThis.__ytufokUnifiedState = state;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(state), 'utf-8');
  } catch {
    // ignore
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchUpstreamState() {
  try {
    const res = await fetchWithTimeout(
      `https://ntfy.sh/${NTFY_TOPIC}/json?poll=1&since=12h`,
      { method: 'GET', cache: 'no-store' },
      1800
    );
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim()) {
      const emptyState = { updatedAt: Date.now(), _fetchedAt: Date.now(), collections: {} };
      writeLocalTmp(emptyState);
      return emptyState;
    }

    const lines = text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(
        (e) =>
          e &&
          e.event === 'message' &&
          typeof e.message === 'string' &&
          (e.message.startsWith('YTUFOK_STATE:') || e.message.startsWith('YTUFOK_PTR:'))
      );

    if (lines.length === 0) {
      const emptyState = { updatedAt: Date.now(), _fetchedAt: Date.now(), collections: {} };
      writeLocalTmp(emptyState);
      return emptyState;
    }
    const last = lines[lines.length - 1];

    if (last.message.startsWith('YTUFOK_PTR:')) {
      const ptr = JSON.parse(last.message.slice(11));
      if (ptr && ptr.inline) {
        ptr.inline._fetchedAt = Date.now();
        writeLocalTmp(ptr.inline);
        return ptr.inline;
      }
      if (ptr && ptr.bytebinKey) {
        const bRes = await fetchWithTimeout(
          `${BYTEBIN_BASE}/${ptr.bytebinKey}`,
          { method: 'GET', cache: 'no-store' },
          1500
        );
        if (bRes.ok) {
          const fullState = await bRes.json();
          fullState._fetchedAt = Date.now();
          writeLocalTmp(fullState);
          return fullState;
        }
      }
    }

    if (last.message.startsWith('YTUFOK_STATE:')) {
      const state = JSON.parse(last.message.slice(13));
      state._fetchedAt = Date.now();
      writeLocalTmp(state);
      return state;
    }
  } catch {
    // ignore timeout or network error
  }
  return null;
}

async function pushUpstreamState(state) {
  writeLocalTmp(state);
  const rawJson = JSON.stringify(state);

  try {
    if (rawJson.length < 3400) {
      await fetchWithTimeout(
        `https://ntfy.sh/${NTFY_TOPIC}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: `YTUFOK_STATE:${rawJson}`
        },
        2000
      );
      return;
    }

    let bytebinKey = null;
    try {
      const bRes = await fetchWithTimeout(
        `${BYTEBIN_BASE}/post`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: rawJson
        },
        2000
      );
      if (bRes.ok) {
        const bData = await bRes.json();
        bytebinKey = bData?.key || null;
      }
    } catch {
      // ignore
    }

    await fetchWithTimeout(
      `https://ntfy.sh/${NTFY_TOPIC}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: `YTUFOK_PTR:${JSON.stringify({ bytebinKey, updatedAt: state.updatedAt })}`
      },
      2000
    );
  } catch {
    // ignore
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const now = Date.now();
    const cached = readLocalTmp();
    // Sıcak önbellek varsa anında (<5ms) yanıt döndür, 8 saniyeden eskiyse arka planda güncelle
    if (cached && cached._fetchedAt && now - cached._fetchedAt < 8000) {
      return res.status(200).json(cached);
    }

    const upstream = await fetchUpstreamState();
    if (upstream) {
      return res.status(200).json(upstream);
    }
    return res.status(200).json(cached || { updatedAt: now, _fetchedAt: now, collections: {} });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const current = readLocalTmp() || { updatedAt: 0, collections: {} };
      const nextCollections = {
        ...(current.collections || {}),
        ...(body?.collections || {})
      };
      if (body?.key && body?.value !== undefined) {
        nextCollections[body.key] = body.value;
      }

      const nextState = {
        updatedAt: Date.now(),
        _fetchedAt: Date.now(),
        collections: nextCollections
      };

      await pushUpstreamState(nextState);
      return res.status(200).json({ ok: true, state: nextState });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err?.message || 'Write error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
