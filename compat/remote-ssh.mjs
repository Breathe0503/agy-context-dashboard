import { createServer, request } from 'node:http';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost']);
const HOST_CHARS = /^[A-Za-z0-9._:@\[\]-]+$/;
const MAX_REMOTE_HOST_LEN = 160;
const MAX_REMOTE_RESPONSE_BYTES = 1048576;

export function sanitizeRemoteHost(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/^ssh:\s*/i, '').trim();
  if (!cleaned || cleaned.length > MAX_REMOTE_HOST_LEN) return null;
  if (!HOST_CHARS.test(cleaned)) return null;
  return cleaned;
}

export function validateBridgePort(value) {
  if (value === null || value === undefined || value === '') return null;
  const port = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : NaN;
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return null;
  return port;
}

export function validateLoopbackEndpoint(raw) {
  if (typeof raw === 'number') {
    if (!Number.isInteger(raw) || raw < 1 || raw > 65535) return null;
    return { hostname: '127.0.0.1', port: raw, origin: `http://127.0.0.1:${raw}` };
  }
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 128) return null;
  if (/^\d+$/.test(trimmed)) {
    const port = Number(trimmed);
    if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
    return { hostname: '127.0.0.1', port, origin: `http://127.0.0.1:${port}` };
  }
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:') return null;
  if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
  if (parsed.pathname && parsed.pathname !== '/') return null;
  const host = parsed.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(host)) return null;
  const port = Number(parsed.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { hostname: '127.0.0.1', port, origin: `http://127.0.0.1:${port}` };
}

export function resolveRemoteEndpoint(remoteHost, settings) {
  const host = sanitizeRemoteHost(remoteHost);
  if (!host) return null;
  const endpoints = settings?.remoteEndpoints;
  if (!endpoints || typeof endpoints !== 'object' || Array.isArray(endpoints)) return null;

  const lookup = new Map();
  for (const [rawKey, rawVal] of Object.entries(endpoints)) {
    if (typeof rawKey !== 'string') continue;
    const trimmedKey = rawKey.trim();
    if (trimmedKey === '*') {
      lookup.set('*', { key: '*', value: rawVal });
      continue;
    }
    const cleanKey = sanitizeRemoteHost(trimmedKey);
    if (cleanKey) lookup.set(cleanKey.toLowerCase(), { key: trimmedKey, value: rawVal });
  }

  const lower = host.toLowerCase();
  const candidates = [lower];
  const atIdx = lower.lastIndexOf('@');
  if (atIdx > 0 && atIdx < lower.length - 1) {
    candidates.push(lower.slice(atIdx + 1));
  }
  candidates.push('*');

  for (const cand of candidates) {
    const entry = lookup.get(cand);
    if (!entry) continue;
    const endpoint = validateLoopbackEndpoint(entry.value);
    if (endpoint) return { endpoint, matchKey: entry.key };
  }
  return null;
}

export function fetchRemoteMetrics(endpoint, input = {}, { timeoutMs = 3500, requestFn = request } = {}) {
  const valid = validateLoopbackEndpoint(endpoint?.origin || endpoint);
  if (!valid) return Promise.resolve({ ok: false, error: 'Invalid loopback endpoint' });

  const params = new URLSearchParams();
  if (typeof input.conversationId === 'string' && input.conversationId) params.set('conversationId', input.conversationId);
  if (input.force === true) params.set('force', '1');
  if (input.quotaRefresh === true) params.set('quotaRefresh', '1');
  if (input.contextDetail === true) params.set('contextDetail', '1');
  if (input.usageSync === true) params.set('usageSync', '1');
  if (input.usageOnly === true) params.set('usageOnly', '1');
  if (input.usageScope === 'local' || input.usageScope === 'account') params.set('usageScope', input.usageScope);
  const qs = params.toString();
  const path = qs ? `/api/metrics?${qs}` : '/api/metrics';

  return new Promise(resolve => {
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const req = requestFn(
      {
        hostname: valid.hostname,
        port: valid.port,
        path,
        method: 'GET',
        headers: {
          Host: `127.0.0.1:${valid.port}`,
          Accept: 'application/json',
        },
      },
      res => {
        let body = '';
        let bytes = 0;
        res.setEncoding('utf8');
        res.on('data', chunk => {
          bytes += Buffer.byteLength(chunk);
          if (bytes > MAX_REMOTE_RESPONSE_BYTES) {
            req.destroy(new Error('Remote metrics response too large'));
            finish({ ok: false, error: 'Remote metrics response too large' });
            return;
          }
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            finish({ ok: false, error: `Remote metrics HTTP ${res.statusCode}` });
            return;
          }
          try {
            const parsed = JSON.parse(body);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
              finish({ ok: false, error: 'Invalid remote metrics payload' });
              return;
            }
            finish({ ok: true, data: parsed });
          } catch {
            finish({ ok: false, error: 'Malformed remote metrics JSON' });
          }
        });
        res.on('error', err => finish({ ok: false, error: err?.message || 'Remote response error' }));
      },
    );
    req.on('error', err => finish({ ok: false, error: err?.message || 'Remote connection failed' }));
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Remote metrics timeout'));
      finish({ ok: false, error: 'Remote metrics timeout' });
    });
    req.end();
  });
}

export function mergeRemoteMetrics({
  remoteData,
  localBase = null,
  remoteHost,
  liveComposerModel = null,
  preferences,
  theme,
  orchestratorSettings,
  integration,
  update,
}) {
  const host = sanitizeRemoteHost(remoteHost) || String(remoteHost || '');
  const remoteGroups = Array.isArray(remoteData?.groups) && remoteData.groups.length > 0 ? remoteData.groups : null;
  const localGroups = Array.isArray(localBase?.groups) ? localBase.groups : [];
  const groups = remoteGroups || localGroups;
  return {
    connection: remoteData?.connection || localBase?.connection || 'live',
    groups,
    speed: remoteData?.speed ?? null,
    ...(remoteData?.collection ? { collection: remoteData.collection } : {}),
    ...(remoteData?.sessionError ? { sessionError: remoteData.sessionError } : {}),
    ...(remoteData?.error ? { error: remoteData.error } : {}),
    ...(liveComposerModel ? { composerModel: liveComposerModel } : remoteData?.composerModel ? { composerModel: remoteData.composerModel } : {}),
    ...(remoteData?.usage ? { usage: remoteData.usage } : localBase?.usage ? { usage: localBase.usage } : {}),
    preferences,
    theme,
    orchestratorSettings,
    integration,
    update,
    remoteSession: { host, mode: 'connected' },
  };
}

export function buildRemoteFallbackMetrics({
  localBase = null,
  remoteHost,
  reason = 'unconfigured',
  preferences,
  theme,
  orchestratorSettings,
  integration,
  update,
}) {
  const host = sanitizeRemoteHost(remoteHost) || String(remoteHost || '');
  return {
    connection: localBase?.connection || 'live',
    groups: Array.isArray(localBase?.groups) ? localBase.groups : [],
    speed: null,
    ...(localBase?.error ? { error: localBase.error } : {}),
    ...(localBase?.usage ? { usage: localBase.usage } : {}),
    preferences,
    theme,
    orchestratorSettings,
    integration,
    update,
    remoteSession: {
      host,
      mode: 'fallback',
      reason: reason === 'unreachable' ? 'unreachable' : 'unconfigured',
    },
  };
}

export function startRemoteBridgeServer({ port, metrics, sessionAudit, sessionInsights, health = null, onError = null } = {}) {
  const validPort = validateBridgePort(port);
  if (!validPort) return null;
  const server = createServer(async (req, res) => {
    const host = req.headers.host || '';
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(host)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (req.headers.origin && req.headers.origin !== `http://${host}`) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (req.method !== 'GET') {
      res.writeHead(405);
      res.end();
      return;
    }
    const url = new URL(req.url || '/', `http://${host}`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (url.pathname === '/api/health') {
      const payload = typeof health === 'function' ? await health() : { ok: true, mode: 'remote-bridge', port: validPort };
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(payload));
      return;
    }
    if (url.pathname === '/api/metrics' && typeof metrics === 'function') {
      try {
        const scopeParam = url.searchParams.get('usageScope');
        const payload = await metrics({
          conversationId: url.searchParams.get('conversationId') || null,
          selectLatest: false,
          force: url.searchParams.get('force') === '1',
          quotaRefresh: url.searchParams.get('quotaRefresh') === '1',
          ...(url.searchParams.get('contextDetail') === '1' ? { contextDetail: true } : {}),
          ...(url.searchParams.get('usageSync') === '1' ? { usageSync: true } : {}),
          ...(url.searchParams.get('usageOnly') === '1' ? { usageOnly: true } : {}),
          ...(scopeParam === 'local' || scopeParam === 'account' ? { usageScope: scopeParam } : {}),
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(payload));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end('{"error":"Remote metrics temporarily unavailable"}');
      }
      return;
    }
    if (url.pathname === '/api/session-audit' && typeof sessionAudit === 'function') {
      try {
        const payload = await sessionAudit({
          conversationId: url.searchParams.get('conversationId') || null,
          force: url.searchParams.get('force') === '1',
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(payload));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end('{"error":"Remote audit temporarily unavailable"}');
      }
      return;
    }
    if (url.pathname === '/api/insights' && typeof sessionInsights === 'function') {
      try {
        const payload = await sessionInsights({
          force: url.searchParams.get('force') === '1',
          status: url.searchParams.get('status') || 'all',
          sort: url.searchParams.get('sort') || 'recent',
          query: url.searchParams.get('query') || '',
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(payload));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end('{"error":"Remote insights temporarily unavailable"}');
      }
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.on('error', err => {
    if (typeof onError === 'function') onError(err);
  });
  server.listen(validPort, '127.0.0.1');
  server.unref?.();
  return server;
}
