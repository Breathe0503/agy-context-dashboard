import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAccountCredits,
  extractCreditUsageSummary,
  modelPricingRule,
  estimateTokenCost,
  estimateModelsCost,
  formatUsd,
} from '../pricing.mjs';

test('extractAccountCredits extracts GetUserStatus plan, tier and credit balances', () => {
  const res = extractAccountCredits({
    userStatus: {
      email: 'ignored@example.test',
      planStatus: {
        availablePromptCredits: 500,
        availableFlowCredits: 100,
        planInfo: {
          planName: 'Pro',
          teamsTier: 'TEAMS_TIER_PRO',
          monthlyPromptCredits: 50000,
          monthlyFlowCredits: 150000,
          monthlyFlexCreditPurchaseAmount: 25000,
          canBuyMoreCredits: true,
        },
      },
      userTier: {
        id: 'g1-ultra-tier',
        name: 'Google AI Ultra',
        availableCredits: [{ creditType: 'GOOGLE_ONE_AI', minimumCreditAmountForUsage: '50' }],
      },
      userUsedPromptCredits: '120',
      userUsedFlowCredits: 30,
    },
  });
  assert.equal(res.source, 'GetUserStatus');
  assert.equal(res.planName, 'Pro');
  assert.equal(res.tierId, 'g1-ultra-tier');
  assert.equal(res.tierName, 'Google AI Ultra');
  assert.equal(res.availablePromptCredits, 500);
  assert.equal(res.availableFlowCredits, 100);
  assert.equal(res.monthlyPromptCredits, 50000);
  assert.equal(res.monthlyFlowCredits, 150000);
  assert.equal(res.monthlyFlexCreditPurchaseAmount, 25000);
  assert.equal(res.usedPromptCredits, 120);
  assert.equal(res.usedFlowCredits, 30);
  assert.equal(res.canBuyMoreCredits, true);
  assert.deepEqual(res.tierCredits, [{ creditType: 'GOOGLE_ONE_AI', minimumCreditAmountForUsage: 50, creditAmount: null }]);
  assert.equal(extractAccountCredits(null), null);
  assert.equal(extractAccountCredits({}), null);
});

test('extractCreditUsageSummary aggregates consumed AI credits when present', () => {
  assert.equal(extractCreditUsageSummary(null), null);
  assert.equal(extractCreditUsageSummary({ consumedCredits: [] }), null);
  const summary = extractCreditUsageSummary({
    consumedCredits: [
      { firstStepIndex: 0, lastStepIndex: 2, credits: [{ creditType: 'GOOGLE_ONE_AI', creditAmount: '15' }] },
      { firstStepIndex: 3, lastStepIndex: 4, credits: [{ creditType: 'GOOGLE_ONE_AI', creditAmount: 25 }] },
    ],
  });
  assert.equal(summary.source, 'CreditUsageSummary');
  assert.deepEqual(summary.totals, { GOOGLE_ONE_AI: 40 });
  assert.equal(summary.entriesCount, 2);
});

test('model pricing table estimates known models and returns null for unknown/BYOM models', () => {
  assert.equal(modelPricingRule('Gemini 4 Neon (High)').key, 'gemini-4-neon');
  assert.equal(modelPricingRule('gemini-4-hydrogen-xhigh').key, 'gemini-4-hydrogen');
  assert.equal(modelPricingRule('gemini-flash-worker-agy').key, 'gemini-4-hydrogen');
  assert.equal(modelPricingRule('Gemini 4 Hydrogen (Orchestrator)').key, 'gemini-4-hydrogen');
  assert.equal(modelPricingRule('gemini-pro-orchestrator').key, 'gemini-4-carbon');
  assert.equal(modelPricingRule('Orchestrator (Neon)').key, 'gemini-4-neon');
  assert.equal(modelPricingRule('Orchestrator (Argon)').key, 'gemini-4-argon');
  assert.equal(modelPricingRule('Gemini 2.5 Flash').key, 'gemini-flash');
  assert.equal(modelPricingRule('Gemini 2.5 Pro').key, 'gemini-pro');
  assert.equal(modelPricingRule('Claude Sonnet 4.6 (Thinking)').key, 'claude-sonnet');
  assert.equal(modelPricingRule('Claude Opus 4.6 (Thinking)').key, 'claude-opus');
  assert.equal(modelPricingRule('GPT-OSS 120B (Medium)'), null);
  assert.equal(modelPricingRule('Gemini (Internal BYOM)'), null);
  assert.equal(modelPricingRule('GPT-6.1 Sol'), null);
  assert.equal(modelPricingRule('Unknown'), null);

  const cost = estimateTokenCost('Claude Sonnet 4.6 (Thinking)', {
    uncached: 1_000_000,
    cacheRead: 1_000_000,
    cacheWrite: 0,
    output: 100_000,
  });
  assert.equal(cost.estimated, true);
  assert.ok(Math.abs(cost.totalUsd - (3.0 + 0.3 + 1.5)) < 1e-9);

  const agg = estimateModelsCost({
    'Gemini 4 Hydrogen (High)': { uncached: 1_000_000, cacheRead: 0, cacheWrite: 0, output: 1_000_000 },
    'Unknown Model': { uncached: 500_000, cacheRead: 0, cacheWrite: 0, output: 500_000 },
  });
  assert.equal(agg.hasPriced, true);
  assert.equal(agg.complete, false);
  assert.equal(agg.pricedModels, 1);
  assert.equal(agg.unpricedModels, 1);
  assert.ok(Math.abs(agg.totalUsd - 9.0) < 1e-9);

  const none = estimateModelsCost({ 'Unknown Model': { uncached: 1000, output: 500 } });
  assert.equal(none.totalUsd, null);
  assert.equal(none.hasPriced, false);

  assert.equal(formatUsd(null), '—');
  assert.equal(formatUsd(0.004), '<$0.01');
  assert.equal(formatUsd(1.234), '$1.23');
  assert.equal(formatUsd(150.7), '$151');
});

test('calibrates Gemini 4 tiers and Claude 5.5 rates including Issue #134 workload', () => {
  for (const name of [
    'Claude Opus 5.5 (Medium)',
    'claude-opus-5-5-high',
    'claude-opus-5.5',
    'MODEL_CLAUDE_5_5_OPUS_MAX',
    'claude-opus-5-5@default',
    'MODEL_PLACEHOLDER_M368',
    'MODEL_PLACEHOLDER_M400',
    'MODEL_PLACEHOLDER_M401',
    'MODEL_PLACEHOLDER_M402',
    'MODEL_PLACEHOLDER_M406',
  ]) {
    assert.equal(modelPricingRule(name)?.key, 'claude-opus-5.5', name);
  }
  const opus55Cost = estimateTokenCost('Claude Opus 5.5 (Medium)', {
    uncached: 1_000_000,
    cacheRead: 1_000_000,
    cacheWrite: 1_000_000,
    output: 1_000_000,
  });
  assert.ok(Math.abs(opus55Cost.totalUsd - (4.00 + 0.20 + 5.00 + 20.00)) < 1e-9);

  for (const name of [
    'Claude Sonnet 5.5 (High)',
    'claude-sonnet-5-5-medium',
    'MODEL_PLACEHOLDER_M377',
    'MODEL_PLACEHOLDER_M403',
    'MODEL_PLACEHOLDER_M404',
    'MODEL_PLACEHOLDER_M405',
    'MODEL_PLACEHOLDER_M407',
  ]) {
    assert.equal(modelPricingRule(name)?.key, 'claude-sonnet-5.5', name);
  }
  const sonnet55Cost = estimateTokenCost('Claude Sonnet 5.5 (High)', {
    uncached: 1_000_000,
    cacheRead: 1_000_000,
    cacheWrite: 1_000_000,
    output: 1_000_000,
  });
  assert.ok(Math.abs(sonnet55Cost.totalUsd - (2.00 + 0.10 + 2.50 + 10.00)) < 1e-9);
  assert.equal(modelPricingRule('MODEL_PLACEHOLDER_M35')?.key, 'claude-sonnet');

  assert.equal(modelPricingRule('Claude Haiku 5.5')?.key, 'claude-haiku-5.5');
  assert.equal(modelPricingRule('claude-haiku-5-5')?.key, 'claude-haiku-5.5');
  const haiku55Cost = estimateTokenCost('claude-haiku-5-5', {
    uncached: 1_000_000,
    cacheRead: 1_000_000,
    cacheWrite: 1_000_000,
    output: 1_000_000,
  });
  assert.ok(Math.abs(haiku55Cost.totalUsd - (0.10 + 0.01 + 0.125 + 0.50)) < 1e-9);
  assert.equal(modelPricingRule('Claude Haiku 4.5')?.key, 'claude-haiku');
  const haiku45Cost = estimateTokenCost('Claude Haiku 4.5', {
    uncached: 1_000_000,
    cacheRead: 1_000_000,
    cacheWrite: 1_000_000,
    output: 1_000_000,
  });
  assert.ok(Math.abs(haiku45Cost.totalUsd - (1.00 + 0.10 + 1.25 + 5.00)) < 1e-9);

  assert.equal(modelPricingRule('gemini-4-hydrogen-tiered-high')?.key, 'gemini-4-hydrogen');
  assert.equal(modelPricingRule('Gemini 4 Argon (High)')?.key, 'gemini-4-argon');
  assert.equal(modelPricingRule('Gemini 4 Carbon (High)')?.key, 'gemini-4-carbon');
  const neonCost = estimateTokenCost('Gemini 4 Neon (High)', {
    uncached: 1_000_000,
    cacheRead: 1_000_000,
    cacheWrite: 0,
    output: 1_000_000,
  });
  assert.ok(Math.abs(neonCost.totalUsd - (3.00 + 0.15 + 15.00)) < 1e-9);
  const argonCost = estimateTokenCost('Gemini 4 Argon (High)', {
    uncached: 1_000_000,
    cacheRead: 1_000_000,
    cacheWrite: 0,
    output: 1_000_000,
  });
  assert.ok(Math.abs(argonCost.totalUsd - (2.00 + 0.10 + 10.00)) < 1e-9);
  const carbonCost = estimateTokenCost('Gemini 4 Carbon (High)', {
    uncached: 1_000_000,
    cacheRead: 1_000_000,
    cacheWrite: 0,
    output: 1_000_000,
  });
  assert.ok(Math.abs(carbonCost.totalUsd - (2.00 + 0.10 + 10.00)) < 1e-9);

  // Issue #134 workload: Hydrogen + Neon + Opus 5.5
  const workload = estimateModelsCost({
    'Gemini 4 Hydrogen (High)': { uncached: 5_240_000, cacheRead: 40_090_000, cacheWrite: 0, output: 340_000 },
    'Gemini 4 Neon (High)': { uncached: 1_370_000, cacheRead: 8_930_000, cacheWrite: 0, output: 70_000 },
    'Claude Opus 5.5 (Medium)': { uncached: 590_000, cacheRead: 2_380_000, cacheWrite: 0, output: 30_000 },
  });
  assert.equal(workload.complete, true);
  assert.equal(workload.pricedModels, 3);
  assert.equal(workload.unpricedModels, 0);
  const expectedWorkload = (5.24 * 1.50 + 40.09 * 0.075 + 0.34 * 7.50) +
    (1.37 * 3.00 + 8.93 * 0.15 + 0.07 * 15.00) +
    (0.59 * 4.00 + 2.38 * 0.20 + 0.03 * 20.00);
  assert.ok(Math.abs(workload.totalUsd - expectedWorkload) < 1e-9);
  assert.ok(workload.totalUsd > 23.0 && workload.totalUsd < 24.0);

  // Negative boundary checks: unverified placeholders, speculative versions, perplexity wrappers
  for (const unknown of [
    'MODEL_PLACEHOLDER_M408',
    'MODEL_PLACEHOLDER_M578',
    'claude-opus-5.2',
    'claude-opus-4.9',
    'perplexity/sonnet-5-5-high',
  ]) {
    assert.equal(modelPricingRule(unknown), null, unknown);
  }
});
