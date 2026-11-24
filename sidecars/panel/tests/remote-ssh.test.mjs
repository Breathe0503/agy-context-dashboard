import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { request } from 'node:http';
import {
  sanitizeRemoteHost,
  validateBridgePort,
  validateLoopbackEndpoint,
  resolveRemoteEndpoint,
  fetchRemoteMetrics,
  mergeRemoteMetrics,
  buildRemoteFallbackMetrics,
  startRemoteBridgeServer,
} from '../../../compat/remote-ssh.mjs';
import { validatedInput } from '../../../compat/runtime-ui.mjs';

const require = createRequire(import.meta.url);
const createDashboardI18n = require('../../../compat/i18n.cjs');

test('sanitizeRemoteHost normalizes SSH labels and rejects unsafe inputs', () => {
  assert.equal(sanitizeRemoteHost('SSH: dev@198.51.100.10'), 'dev@198.51.100.10');
  assert.equal(sanitizeRemoteHost('  ssh: dev-box.internal:2222  '), 'dev-box.internal:2222');
  assert.equal(sanitizeRemoteHost('alice@prod'), 'alice@prod');
  assert.equal(sanitizeRemoteHost(''), null);
  assert.equal(sanitizeRemoteHost('SSH:   '), null);
  assert.equal(sanitizeRemoteHost('dev@host; rm -rf /'), null);
  assert.equal(sanitizeRemoteHost('dev@host\nnewline'), null);
  assert.equal(sanitizeRemoteHost('a'.repeat(200)), null);
});

test('validateLoopbackEndpoint and validateBridgePort enforce strict loopback security boundaries', () => {
  assert.deepEqual(validateLoopbackEndpoint(17891), { hostname: '127.0.0.1', port: 17891, origin: 'http://127.0.0.1:17891' });
  assert.deepEqual(validateLoopbackEndpoint('127.0.0.1:17891'), { hostname: '127.0.0.1', port: 17891, origin: 'http://127.0.0.1:17891' });
  assert.deepEqual(validateLoopbackEndpoint('http://localhost:17892/'), { hostname: '127.0.0.1', port: 17892, origin: 'http://127.0.0.1:17892' });

  for (const bad of [
    'http://198.51.100.10:17891',
    'http://example.com:17891',
    'https://127.0.0.1:17891',
    'http://user:pass@127.0.0.1:17891',
    'http://127.0.0.1:17891/api/metrics',
    'http://127.0.0.1:17891?x=1',
    'http://0.0.0.0:17891',
    0,
    70000,
    '',
  ]) {
    assert.equal(validateLoopbackEndpoint(bad), null, `should reject ${String(bad)}`);
  }

  assert.equal(validateBridgePort(17891), 17891);
  assert.equal(validateBridgePort('17891'), 17891);
  assert.equal(validateBridgePort(80), null);
  assert.equal(validateBridgePort(0), null);
  assert.equal(validateBridgePort('abc'), null);
});

test('resolveRemoteEndpoint matches exact host, hostname after @, and wildcard in priority order', () => {
  const settings = {
    remoteEndpoints: {
      'SSH: dev@198.51.100.10': 'http://127.0.0.1:17891',
      '10.0.0.5': 17892,
      '*': 'http://localhost:17899',
      'bad@host': 'http://evil.example.com:17891',
    },
  };
  assert.equal(resolveRemoteEndpoint('dev@198.51.100.10', settings)?.endpoint.port, 17891);
  assert.equal(resolveRemoteEndpoint('root@10.0.0.5', settings)?.endpoint.port, 17892);
  assert.equal(resolveRemoteEndpoint('other@anywhere', settings)?.endpoint.port, 17899);
  // Invalid non-loopback endpoint for bad@host falls through to wildcard
  assert.equal(resolveRemoteEndpoint('bad@host', settings)?.endpoint.port, 17899);
  assert.equal(resolveRemoteEndpoint('bad@host', { remoteEndpoints: { 'bad@host': 'http://evil.example.com:17891' } }), null);
});

test('startRemoteBridgeServer serves loopback metrics and rejects non-loopback Host/Origin', async t => {
  const received = [];
  const server = startRemoteBridgeServer({
    port: 18943,
    metrics: async input => {
      received.push(input);
      return {
        connection: 'live',
        groups: [{ id: 'gemini', windows: {} }],
        speed: { conversationId: input.conversationId, sessionTps: 142.5, rounds: 5 },
      };
    },
  });
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));

  const ok = await fetchRemoteMetrics('http://127.0.0.1:18943', {
    conversationId: '11111111-2222-3333-4444-555555555555',
    force: true,
    contextDetail: true,
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.data.speed.sessionTps, 142.5);
  assert.equal(received.length, 1);
  assert.equal(received[0].conversationId, '11111111-2222-3333-4444-555555555555');
  assert.equal(received[0].selectLatest, false);
  assert.equal(received[0].force, true);
  assert.equal(received[0].contextDetail, true);

  // Reject spoofed Host header
  const badHostStatus = await new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: 18943, path: '/api/health', headers: { Host: 'evil.example.com' } }, res => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.end();
  });
  assert.equal(badHostStatus, 403);

  // Reject cross-origin header
  const badOriginStatus = await new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: 18943, path: '/api/health', headers: { Host: '127.0.0.1:18943', Origin: 'https://evil.example.com' } }, res => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.end();
  });
  assert.equal(badOriginStatus, 403);

  // Unreachable port fails cleanly
  const fail = await fetchRemoteMetrics('http://127.0.0.1:18944', {}, { timeoutMs: 400 });
  assert.equal(fail.ok, false);
});

test('mergeRemoteMetrics and buildRemoteFallbackMetrics preserve local prefs and prevent local session bleed', () => {
  const localBase = {
    connection: 'live',
    groups: [{ id: 'local-quota' }],
    speed: { conversationId: 'local-conv', sessionTps: 99 },
    usage: { todayTokens: 500 },
  };
  const prefs = { language: 'zh-CN', hostUiLocalization: true };

  const merged = mergeRemoteMetrics({
    remoteData: { connection: 'live', groups: [], speed: { conversationId: 'remote-conv', sessionTps: 150 } },
    localBase,
    remoteHost: 'SSH: dev@198.51.100.10',
    preferences: prefs,
    theme: { mode: 'light' },
    orchestratorSettings: null,
    integration: { state: 'mounted' },
    update: { available: false },
  });
  assert.equal(merged.speed.conversationId, 'remote-conv');
  assert.deepEqual(merged.groups, [{ id: 'local-quota' }]);
  assert.deepEqual(merged.preferences, prefs);
  assert.deepEqual(merged.remoteSession, { host: 'dev@198.51.100.10', mode: 'connected' });

  const fallback = buildRemoteFallbackMetrics({
    localBase,
    remoteHost: 'dev@198.51.100.10',
    reason: 'unconfigured',
    preferences: prefs,
    theme: { mode: 'light' },
    orchestratorSettings: null,
    integration: { state: 'mounted' },
    update: { available: false },
  });
  assert.equal(fallback.speed, null);
  assert.deepEqual(fallback.groups, [{ id: 'local-quota' }]);
  assert.deepEqual(fallback.remoteSession, { host: 'dev@198.51.100.10', mode: 'fallback', reason: 'unconfigured' });
});

test('validatedInput whitelists sanitized remoteHost and i18n provides trilingual remote SSH strings', () => {
  assert.deepEqual(
    validatedInput({ conversationId: null, remoteHost: 'SSH: dev@198.51.100.10' }),
    { conversationId: null, force: false, remoteHost: 'dev@198.51.100.10' },
  );
  assert.deepEqual(
    validatedInput({ conversationId: null, remoteHost: 'bad host with spaces' }),
    { conversationId: null, force: false },
  );

  const keys = ['remoteFallbackUnconfigured', 'remoteFallbackUnreachable', 'remoteConnectedBadge', 'remoteQuotaTitle'];
  for (const locale of ['en', 'zh-CN', 'zh-TW']) {
    const i18n = createDashboardI18n(locale);
    for (const k of keys) {
      const rendered = i18n.t(k, { host: 'dev@198.51.100.10' });
      assert.notEqual(rendered, k);
      assert.ok(rendered.includes('dev@198.51.100.10'));
    }
  }
});
