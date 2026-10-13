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

async function fetchUpstreamState() {
  try {
    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}/json?poll=1&since=12h`, {
      method: 'GET',
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim()) return null;

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

    if (lines.length === 0) return null;
    const last = lines[lines.length - 1];

    if (last.message.startsWith('YTUFOK_PTR:')) {
      const ptr = JSON.parse(last.message.slice(11));
      if (ptr && ptr.bytebinKey) {
        const bRes = await fetch(`${BYTEBIN_BASE}/${ptr.bytebinKey}`, {
          method: 'GET',
          cache: 'no-store'
        });
        if (bRes.ok) {
          const fullState = await bRes.json();
          writeLocalTmp(fullState);
          return fullState;
        }
      }
      if (ptr && ptr.inline) {
        writeLocalTmp(ptr.inline);
        return ptr.inline;
      }
    }

    if (last.message.startsWith('YTUFOK_STATE:')) {
      const state = JSON.parse(last.message.slice(13));
      writeLocalTmp(state);
      return state;
    }
  } catch (err) {
    console.error('Upstream fetch error:', err);
  }
  return null;
}

async function pushUpstreamState(state) {
  writeLocalTmp(state);
  const rawJson = JSON.stringify(state);

  let bytebinKey = null;
  try {
    const bRes = await fetch(`${BYTEBIN_BASE}/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawJson
    });
    if (bRes.ok) {
      const bData = await bRes.json();
      bytebinKey = bData?.key || null;
    }
  } catch {
    // ignore bytebin error
  }

  try {
    const payload =
      rawJson.length < 3200
        ? `YTUFOK_PTR:${JSON.stringify({ bytebinKey, updatedAt: state.updatedAt, inline: state })}`
        : `YTUFOK_PTR:${JSON.stringify({ bytebinKey, updatedAt: state.updatedAt })}`;

    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: payload
    });
  } catch (err) {
    console.error('Upstream ntfy push error:', err);
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
    // Refresh from upstream if cold start or older than 2 seconds
    if (!cached || !cached._fetchedAt || now - cached._fetchedAt > 2000) {
      const upstream = await fetchUpstreamState();
      if (upstream) {
        upstream._fetchedAt = now;
        writeLocalTmp(upstream);
        return res.status(200).json(upstream);
      }
    }
    return res.status(200).json(cached || { updatedAt: 0, collections: {} });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const current = (await fetchUpstreamState()) || readLocalTmp() || { updatedAt: 0, collections: {} };
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
