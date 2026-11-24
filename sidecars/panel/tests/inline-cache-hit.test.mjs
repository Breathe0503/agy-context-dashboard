import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { PreferencesStore } from '../../../compat/preferences.mjs';

const require = createRequire(import.meta.url);
const createDashboardI18n = require('../../../compat/i18n.cjs');

test('PreferencesStore persists inlineCacheHit boolean preference', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ag-pulse-cache-hit-'));
  try {
    const file = join(dir, 'preferences.json');
    const store = new PreferencesStore({ file });
    const initial = await store.get();
    assert.equal(initial.inlineCacheHit, undefined);

    await store.set({ inlineCacheHit: false });
    const savedOff = await new PreferencesStore({ file }).get();
    assert.equal(savedOff.inlineCacheHit, false);

    await store.set({ language: 'zh-CN' });
    const afterLang = await new PreferencesStore({ file }).get();
    assert.equal(afterLang.inlineCacheHit, false);
    assert.equal(afterLang.language, 'zh-CN');

    await store.set({ inlineCacheHit: true });
    const savedOn = await new PreferencesStore({ file }).get();
    assert.equal(savedOn.inlineCacheHit, true);

    await assert.rejects(() => store.set({ inlineCacheHit: 'invalid' }), /Invalid inline cache hit preference/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('i18n connectInlineCacheHit defaults to true and translates across locales', async () => {
  for (const locale of ['en', 'zh-CN', 'zh-TW']) {
    const i18n = createDashboardI18n(locale);
    for (const key of ['inlineCacheHit', 'inlineCacheHitOn', 'inlineCacheHitOff', 'inlineCacheHitSaveFailed']) {
      assert.equal(i18n.t(key).length > 0, true, `missing ${key} for ${locale}`);
    }
  }
  const i18n = createDashboardI18n('zh-CN');
  let stored = null;
  let changes = 0;
  const ctrl = i18n.connectInlineCacheHit({
    initial: null,
    cache: v => { stored = v; },
    write: async input => ({ inlineCacheHit: input.inlineCacheHit, revision: 1 }),
    changed: () => { changes++; },
  });
  assert.equal(ctrl.enabled, true);
  await ctrl.choose(false);
  assert.equal(ctrl.enabled, false);
  assert.equal(stored, false);
  assert.equal(changes >= 1, true);
  ctrl.dispose();
});
