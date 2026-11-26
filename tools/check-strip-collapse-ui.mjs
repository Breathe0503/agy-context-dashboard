// End-to-end headless Chromium/Chrome CDP regression for PR #84 (main composer
// model selector truncation protection) + Issue #72 (persistent minimal/full
// strip collapse). Zero external dependencies.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { accessSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { CdpConnection } from '../compat/runtime-ui.mjs';
import { trajectoryMetrics } from '../sidecars/panel/metrics.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const extract = s => s.slice(s.indexOf('module.exports = ') + 17).trim().replace(/;$/, '');

function findBrowser() {
  const candidates = [
    process.env.AG_EDGE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  for (const file of candidates) {
    try { accessSync(file); return file; } catch {}
  }
  return null;
}

const BROWSER_EXE = findBrowser();
if (!BROWSER_EXE) {
  console.log('SKIP: No Chromium/Chrome/Edge executable found');
  process.exit(0);
}

async function launchBrowser(userDataDir, url) {
  const child = spawn(BROWSER_EXE, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${userDataDir}`, url,
  ], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  child.unref();
  let cdp = null;
  try {
    const port = await new Promise((resolve, reject) => {
      let errText = '';
      const timer = setTimeout(() => reject(new Error('Browser start timeout: ' + errText)), 30000);
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', chunk => {
        errText += chunk;
        const m = errText.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
        if (m) { clearTimeout(timer); resolve(Number(m[1])); }
      });
      child.once('exit', code => { clearTimeout(timer); reject(new Error('Browser exited ' + code)); });
    });
    let target;
    for (let i = 0; i < 150; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        target = list.find(t => t.type === 'page' && t.url.startsWith('http://127.0.0.1'));
        if (target) break;
      } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    if (!target) throw new Error('Page target not found');
    cdp = new CdpConnection(target.webSocketDebuggerUrl, { timeout: 30000 });
    await cdp.open();
    await cdp.command('Runtime.enable');
    await cdp.command('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    return { child, cdp };
  } catch (err) {
    try { cdp?.close(); } catch {}
    try { child.kill('SIGKILL'); } catch {}
    throw err;
  }
}

const [i18nSrc, themeSrc, widgetSrc, surfaceSrc] = await Promise.all(
  ['compat/i18n.cjs', 'compat/theme.cjs', 'compat/inline-widget.cjs', 'ide/surface.cjs'].map(p => readFile(join(REPO, p), 'utf8'))
);

const id = '11111111-1111-1111-1111-111111111111';
const reset5h = new Date(Date.now() + 3 * 3600000).toISOString();
const resetWk = new Date(Date.now() + 5 * 86400000).toISOString();
const speed = trajectoryMetrics({
  trajectory: {
    cascadeId: id,
    steps: [{ type: 'USER_INPUT' }],
    generatorMetadata: [{
      chatModel: {
        modelDisplayName: 'Gemini 4 Hydrogen (Medium)',
        chatStartMetadata: { contextWindowMetadata: { estimatedTokensUsed: 310000, maxContextTokens: 500000 } },
        usage: { messageId: 'm1', inputTokens: '1000000', cacheReadTokens: '800000', outputTokens: '50000', responseOutputTokens: '50000', apiProvider: 'API_PROVIDER_GOOGLE_GEMINI' },
        streamingDuration: '1.5s',
      },
    }],
  },
});

let prefs = { language: 'en', languageGuideDismissed: true, revision: 1 };
let emptyConversation = false;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/api/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connection: 'live', theme: 'light', preferences: prefs, serverTime: new Date().toISOString(),
      groups: [{ id: 'gemini', name: 'Gemini', windows: { '5h': { available: true, remaining: 0.8, resetAt: reset5h }, weekly: { available: true, remaining: 0.9, resetAt: resetWk } } }],
      speed: emptyConversation ? null : speed,
    }));
    return;
  }
  if (url.pathname === '/api/preferences') {
    if (req.method === 'POST') {
      const body = await new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(JSON.parse(d))); });
      prefs = { ...prefs, ...body, revision: prefs.revision + 1 };
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(prefs));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
  res.end(`<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#f5f7fb;color:#0f172a;font:13px sans-serif}
    .composer{width:880px;margin:0 auto;padding:12px;border-radius:14px;background:#fff;border:1px solid #ddd}
    .editor{height:36px}.actions{display:flex;align-items:center;justify-content:space-between;gap:6px}.left,.right{display:flex;align-items:center;gap:6px}
    [data-testid="model-selector-trigger"]{display:inline-flex;align-items:center;overflow:hidden;min-width:32px;max-width:100%}
    [data-testid="model-selector-trigger"] span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    button{background:transparent;border:0;color:inherit;height:28px;font:inherit;white-space:nowrap}
  </style></head><body><div class="composer"><div class="editor" contenteditable="true" role="combobox"></div><div class="actions"><div class="left"><button aria-label="Add">+</button><button data-testid="model-selector-trigger"><span>Gemini 4 Hydrogen (Medium)</span></button></div><div class="right"><button aria-label="Send">Send</button></div></div></div><script>
    history.replaceState({}, '', '/c/${id}');
    window.agPulseHost = {
      getMetrics: async () => (await fetch('/api/metrics')).json(),
      getPreferences: async () => (await fetch('/api/preferences')).json(),
      setPreferences: async input => (await fetch('/api/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })).json(),
      report: () => {},
    };
    window.__agPulseTestSurface = (${extract(surfaceSrc)})();
    window.__agPulseI18nFactory = (${extract(i18nSrc)});
    window.__agPulseThemeFactory = (${extract(themeSrc)});
    (${extract(widgetSrc)})();
  </script></body></html>`);
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const userDir = await mkdtemp(join(tmpdir(), 'ag-strip-ui-'));
let browser;
try {
  browser = await launchBrowser(userDir, `http://127.0.0.1:${port}/`);
  const evalJs = async fn => {
    const res = await browser.cdp.command('Runtime.evaluate', { expression: `(${fn})()`, awaitPromise: true, returnByValue: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text || 'Eval failed');
    return res.result?.value;
  };
  const waitUntil = async (fn, label) => {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      if (await evalJs(fn)) return;
      await new Promise(r => setTimeout(r, 80));
    }
    throw new Error('Timeout: ' + label);
  };

  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.density === 'full', 'initial full density');

  // 0. Medium-width main composer (758px, matching real Antigravity with XHigh model)
  // keeps numbers + cache-hit visible via compact-text/tight-text instead of premature icons-only.
  await evalJs(() => { document.querySelector('.composer').style.width = '758px'; });
  await waitUntil(() => ['full', 'compact-text', 'tight-text'].includes(document.getElementById('ag-pulse-status-bar')?.dataset.density), '758px stays in text density');
  const medState = await evalJs(() => {
    const n = document.getElementById('ag-pulse-status-bar');
    const sr = n.shadowRoot;
    return {
      density: n.dataset.density,
      cacheHit: getComputedStyle(sr.getElementById('cache-hit')).display,
      tps: getComputedStyle(sr.getElementById('tps')).display,
      span: document.querySelector('[data-testid="model-selector-trigger"] span'),
    };
  });
  assert.notEqual(medState.cacheHit, 'none', 'cache-hit stays visible at 758px');
  assert.notEqual(medState.tps, 'none', 'tps stays visible at 758px');

  // 0b. Issue #97: long Orchestrator model name in 758px composer uses tight-text
  // instead of dropping straight to icons-only.
  await evalJs(() => {
    document.querySelector('[data-testid="model-selector-trigger"] span').textContent = 'Orchestrator Gemini 4 Neon (Medium)';
  });
  await waitUntil(() => ['full', 'compact-text', 'tight-text'].includes(document.getElementById('ag-pulse-status-bar')?.dataset.density), 'long model name in 758px stays in text density');
  const longModelState = await evalJs(() => {
    const n = document.getElementById('ag-pulse-status-bar');
    const sr = n.shadowRoot;
    const span = document.querySelector('[data-testid="model-selector-trigger"] span');
    return {
      density: n.dataset.density,
      cacheHit: getComputedStyle(sr.getElementById('cache-hit')).display,
      tps: getComputedStyle(sr.getElementById('tps')).display,
      quotaText: getComputedStyle(sr.getElementById('quota-text')).display,
      ctxPct: getComputedStyle(sr.getElementById('context-percent')).display,
      ctxRounds: getComputedStyle(sr.getElementById('context-rounds')).display,
      modelTruncated: span.scrollWidth > span.clientWidth + 1,
    };
  });
  assert.notEqual(longModelState.density, 'icons', 'long model name at 758px must not drop to icons-only');
  assert.notEqual(longModelState.cacheHit, 'none', 'cache-hit stays visible with long model name');
  assert.notEqual(longModelState.tps, 'none', 'tps stays visible with long model name');
  assert.notEqual(longModelState.quotaText, 'none', 'primary quota stays visible with long model name');
  assert.notEqual(longModelState.ctxPct, 'none', 'context percent stays visible with long model name');
  assert.notEqual(longModelState.ctxRounds, 'none', 'context rounds stays visible with long model name at 758px');
  assert.equal(longModelState.modelTruncated, false, 'long model selector text must not be truncated');

  // Verify label / compact / rounds context sub-label modes stay responsive under
  // Orchestrator Gemini 4 Neon Extra High in compact-text / tight-text.
  await evalJs(`async () => {
    document.querySelector('[data-testid="model-selector-trigger"] span').textContent = 'Orchestrator Gemini 4 Neon Extra High';
    for (let w = 758; w >= 460; w -= 12) {
      document.querySelector('.composer').style.width = w + 'px';
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const d = document.getElementById('ag-pulse-status-bar')?.dataset.density;
      if (d === 'compact-text' || d === 'tight-text') break;
    }
  }`);
  await waitUntil(() => ['compact-text', 'tight-text'].includes(document.getElementById('ag-pulse-status-bar')?.dataset.density), 'long Orchestrator name reaches compact/tight tier');
  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.querySelector('[data-card="context"]').click();
    sr.getElementById('pulse-settings-toggle').click();
    sr.querySelector('[data-ctx-chip-mode="label"]').click();
    sr.getElementById('pulse-settings-close').click();
  });
  await waitUntil(() => {
    const sr = document.getElementById('ag-pulse-status-bar')?.shadowRoot;
    return sr && getComputedStyle(sr.querySelector('[data-card="context"] .context-label')).display !== 'none';
  }, 'context label stays visible in compact/tight tier');
  const labelState = await evalJs(() => {
    const n = document.getElementById('ag-pulse-status-bar');
    const sr = n.shadowRoot;
    return {
      density: n.dataset.density,
      label: getComputedStyle(sr.querySelector('[data-card="context"] .context-label')).display,
      rounds: getComputedStyle(sr.getElementById('context-rounds')).display,
    };
  });
  assert.ok(['compact-text', 'tight-text'].includes(labelState.density), 'label check runs in compact/tight tier: ' + labelState.density);
  assert.notEqual(labelState.label, 'none', 'context label visible under long Orchestrator model');
  assert.equal(labelState.rounds, 'none', 'rounds hidden when label mode selected');

  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.querySelector('[data-card="context"]').click();
    sr.getElementById('pulse-settings-toggle').click();
    sr.querySelector('[data-ctx-chip-mode="compact"]').click();
    sr.getElementById('pulse-settings-close').click();
  });
  await waitUntil(() => {
    const sr = document.getElementById('ag-pulse-status-bar')?.shadowRoot;
    return sr && getComputedStyle(sr.querySelector('[data-card="context"] .context-label')).display === 'none';
  }, 'compact mode hides context label');
  assert.equal(await evalJs(() => getComputedStyle(document.getElementById('ag-pulse-status-bar').shadowRoot.getElementById('context-rounds')).display), 'none', 'compact mode hides rounds');

  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.querySelector('[data-card="context"]').click();
    sr.getElementById('pulse-settings-toggle').click();
    sr.querySelector('[data-ctx-chip-mode="rounds"]').click();
    sr.getElementById('pulse-settings-close').click();
  });
  await waitUntil(() => {
    const sr = document.getElementById('ag-pulse-status-bar')?.shadowRoot;
    return sr && getComputedStyle(sr.getElementById('context-rounds')).display !== 'none';
  }, 'rounds mode restores context rounds');

  await evalJs(() => {
    document.querySelector('.composer').style.width = '758px';
    document.querySelector('[data-testid="model-selector-trigger"] span').textContent = 'Gemini 4 Hydrogen (Medium)';
  });

  // 0c. Issue #106: narrow widths preserve #context-rounds through compact-text and tight-text,
  // hiding it only at dense-text while keeping all 4 primary metrics visible.
  const setWidthAndSettle = async w => {
    return await evalJs(`async () => {
      document.querySelector('.composer').style.width = '${w}px';
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const n = document.getElementById('ag-pulse-status-bar');
      const sr = n.shadowRoot;
      const disp = sel => {
        const el = sr.querySelector(sel);
        return el ? getComputedStyle(el).display : 'missing';
      };
      return {
        density: n.dataset.density,
        rounds: disp('#context-rounds'),
        cacheHit: disp('#cache-hit'),
        cacheUnit: disp('.cache-unit'),
        quotaTag: disp('.quota-tag'),
        tps: disp('#tps'),
        cacheNum: disp('#cache-total-num'),
        quotaText: disp('#quota-text'),
        ctxPct: disp('#context-percent'),
      };
    }`);
  };
  let tightSnapshot = null;
  let denseSnapshot = null;
  for (let w = 640; w >= 320; w -= 6) {
    const snap = await setWidthAndSettle(w);
    if (!tightSnapshot && snap.density === 'tight-text') tightSnapshot = { width: w, ...snap };
    if (!denseSnapshot && snap.density === 'dense-text') denseSnapshot = { width: w, ...snap };
    if (tightSnapshot && denseSnapshot) break;
  }
  assert.ok(tightSnapshot, 'stepping down composer width must hit tight-text tier before icons');
  assert.notEqual(tightSnapshot.rounds, 'none', 'tight-text still keeps #context-rounds visible');
  assert.equal(tightSnapshot.cacheUnit, 'none', 'tight-text hides cache tok unit');
  assert.equal(tightSnapshot.cacheHit, 'none', 'tight-text hides inline cache hit');
  assert.equal(tightSnapshot.quotaTag, 'none', 'tight-text hides quota tag');
  assert.ok(denseSnapshot, 'stepping down further must hit dense-text tier before icons');
  assert.equal(denseSnapshot.rounds, 'none', 'dense-text hides #context-rounds');
  assert.notEqual(denseSnapshot.tps, 'none', 'dense-text keeps #tps visible');
  assert.notEqual(denseSnapshot.cacheNum, 'none', 'dense-text keeps #cache-total-num visible');
  assert.notEqual(denseSnapshot.quotaText, 'none', 'dense-text keeps #quota-text visible');
  assert.notEqual(denseSnapshot.ctxPct, 'none', 'dense-text keeps #context-percent visible');

  // 0d. Issue #106: quotaDisplay='compact' omits 5h prefix and resets density hysteresis cleanly.
  await evalJs(() => { document.querySelector('.composer').style.width = '880px'; });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.density === 'full', 'restore full before quotaDisplay check');
  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.querySelector('[data-card="context"]').click();
    sr.getElementById('pulse-settings-toggle').click();
    sr.querySelector('[data-quota-display-choice="compact"]').click();
    sr.getElementById('pulse-settings-close').click();
  });
  await waitUntil(() => !document.getElementById('ag-pulse-status-bar')?.shadowRoot.getElementById('quota-text')?.textContent.includes('5h'), 'compact quota omits 5h prefix');
  const compactQuotaText = await evalJs(() => document.getElementById('ag-pulse-status-bar').shadowRoot.getElementById('quota-text').textContent);
  assert.match(compactQuotaText, /^\d+%$/, 'compact quota renders percentage without 5h prefix');

  // Switch back to 'both' at a tight width where 'both' degrades to compact-text,
  // then switch to 'compact' and verify it recovers to full without dragging wider.
  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.querySelector('[data-card="context"]').click();
    sr.getElementById('pulse-settings-toggle').click();
    sr.querySelector('[data-quota-display-choice="both"]').click();
    sr.getElementById('pulse-settings-close').click();
  });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.shadowRoot.querySelector('.quota-secondary') !== null, 'both quota restored');
  let recoveryWidth = null;
  for (let w = 640; w >= 360; w -= 8) {
    const snap = await setWidthAndSettle(w);
    if (snap.density === 'compact-text' || snap.density === 'tight-text') { recoveryWidth = w; break; }
  }
  assert.ok(recoveryWidth !== null, 'found tight width where both mode degrades');
  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.querySelector('[data-card="context"]').click();
    sr.getElementById('pulse-settings-toggle').click();
    sr.querySelector('[data-quota-display-choice="compact"]').click();
    sr.getElementById('pulse-settings-close').click();
  });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.density === 'full', 'switching to compact quota breaks hysteresis and recovers to full');
  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.querySelector('[data-card="context"]').click();
    sr.getElementById('pulse-settings-toggle').click();
    sr.querySelector('[data-quota-display-choice="both"]').click();
    sr.getElementById('pulse-settings-close').click();
  });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.shadowRoot.querySelector('.quota-secondary') !== null, 'restored both quota before PR #84 check');

  // 1. PR #84: shrinking main composer preserves model selector width by dropping to icons-only
  await evalJs(() => { document.querySelector('.composer').style.width = '480px'; });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.density === 'icons', 'narrow main composer drops to icons');
  const modelTruncated = await evalJs(() => {
    const span = document.querySelector('[data-testid="model-selector-trigger"] span');
    return span.scrollWidth > span.clientWidth + 1;
  });
  assert.equal(modelTruncated, false, 'model selector text must not be truncated');

  // 2. Restore width -> click #strip-toggle -> Issue #72 minimal mode persists
  await evalJs(() => { document.querySelector('.composer').style.width = '880px'; });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.density === 'full', 'restores full');
  await evalJs(() => { document.getElementById('ag-pulse-status-bar').shadowRoot.getElementById('strip-toggle').click(); });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.stripMode === 'minimal', 'switches to minimal');
  assert.equal(prefs.stripMode, 'minimal');

  const minimalState = await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    const vis = sel => getComputedStyle(sr.querySelector(sel)).display !== 'none';
    return {
      density: document.getElementById('ag-pulse-status-bar').dataset.density,
      hasIconsOnly: document.getElementById('ag-pulse-status-bar').classList.contains('icons-only'),
      speed: vis('[data-card="speed"]'),
      cache: vis('[data-card="cache"]'),
      quota: vis('[data-card="quota"]'),
      context: vis('[data-card="context"]'),
      toggle: vis('#strip-toggle'),
    };
  });
  assert.equal(minimalState.density, 'minimal');
  assert.equal(minimalState.hasIconsOnly, true);
  assert.equal(minimalState.speed, true);
  assert.equal(minimalState.cache, true);
  assert.equal(minimalState.quota, true);
  assert.equal(minimalState.context, true);
  assert.equal(minimalState.toggle, true);

  // 3. Narrow width in minimal mode degrades to minimal-icon cleanly
  await evalJs(() => { document.querySelector('.composer').style.width = '310px'; });
  await waitUntil(() => ['minimal', 'minimal-icon'].includes(document.getElementById('ag-pulse-status-bar')?.dataset.density), 'minimal degrades cleanly');

  // 4. Restore width and expand back via hover card footer button
  await evalJs(() => { document.querySelector('.composer').style.width = '880px'; });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.density === 'minimal', 'minimal recovers');
  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.querySelector('[data-card="context"]').click();
    sr.getElementById('strip-mode-full').click();
  });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.density === 'full', 'expands back to full via footer toggle');
  assert.equal(prefs.stripMode, 'full');

  // 5. Issue #90: empty/new conversation with valid account quota stays full when stripMode=full,
  // and collapses all text when switched to stripMode=minimal.
  emptyConversation = true;
  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.querySelector('.refresh')?.click();
  });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.shadowRoot.getElementById('tps')?.textContent === '—', 'empty conversation rendered');
  const emptyFullState = await evalJs(() => {
    const n = document.getElementById('ag-pulse-status-bar');
    const sr = n.shadowRoot;
    return {
      density: n.dataset.density,
      iconsOnly: n.classList.contains('icons-only'),
      quotaDisplay: getComputedStyle(sr.getElementById('quota-text')).display,
      quotaText: sr.getElementById('quota-text').textContent,
      tpsDisplay: getComputedStyle(sr.getElementById('tps')).display,
    };
  });
  assert.equal(emptyFullState.density, 'full', 'empty conversation with quota stays full in stripMode=full');
  assert.equal(emptyFullState.iconsOnly, false, 'must not force icons-only when quota is loaded');
  assert.notEqual(emptyFullState.quotaDisplay, 'none', '#quota-text must stay visible');
  assert.match(emptyFullState.quotaText, /80%/, '#quota-text shows remaining quota');
  assert.notEqual(emptyFullState.tpsDisplay, 'none', 'all chips stay expanded in full mode');

  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.getElementById('strip-mode-minimal').click();
  });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.density === 'minimal', 'empty conversation collapses in minimal mode');
  const emptyMinimalQuota = await evalJs(() => getComputedStyle(document.getElementById('ag-pulse-status-bar').shadowRoot.getElementById('quota-text')).display);
  assert.equal(emptyMinimalQuota, 'none', 'minimal mode hides quota text');

  await evalJs(() => {
    const sr = document.getElementById('ag-pulse-status-bar').shadowRoot;
    sr.getElementById('strip-mode-full').click();
  });
  await waitUntil(() => document.getElementById('ag-pulse-status-bar')?.dataset.density === 'full', 'empty conversation expands back to full');

  console.log('PASS: check-strip-collapse-ui (PR #84 + Issue #72 + Issue #90 combined)');
} finally {
  if (browser) {
    try { browser.cdp.close(); } catch {}
    try { browser.child.kill('SIGKILL'); } catch {}
  }
  server.close();
  await rm(userDir, { recursive: true, force: true });
}
