// Official Antigravity credit extraction and public fallback cost estimation.
// Public fallback rates are approximate reference estimates, never official bills.
import { formatModelName } from './context.mjs';

const cleanText = (value, max = 96) => typeof value === 'string'
  ? value.replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g, '').trim().slice(0, max)
  : '';

const countOrNull = value => {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const n = Number(value.trim());
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  }
  return null;
};

const nonNegNumber = value => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);

/**
 * Extract official Antigravity credit balances and plan metadata from GetUserStatus.
 */
export function extractAccountCredits(input) {
  const user = input?.userStatus && typeof input.userStatus === 'object' ? input.userStatus : input;
  if (!user || typeof user !== 'object' || Array.isArray(user)) return null;

  const planStatus = user.planStatus && typeof user.planStatus === 'object' ? user.planStatus : null;
  const planInfo = planStatus?.planInfo && typeof planStatus.planInfo === 'object' ? planStatus.planInfo : null;
  const userTier = user.userTier && typeof user.userTier === 'object' ? user.userTier : null;

  const availablePromptCredits = countOrNull(planStatus?.availablePromptCredits);
  const availableFlowCredits = countOrNull(planStatus?.availableFlowCredits);
  const monthlyPromptCredits = countOrNull(planInfo?.monthlyPromptCredits);
  const monthlyFlowCredits = countOrNull(planInfo?.monthlyFlowCredits);
  const monthlyFlexCreditPurchaseAmount = countOrNull(planInfo?.monthlyFlexCreditPurchaseAmount);
  const usedPromptCredits = countOrNull(user.userUsedPromptCredits);
  const usedFlowCredits = countOrNull(user.userUsedFlowCredits);

  const tierCredits = Array.isArray(userTier?.availableCredits)
    ? userTier.availableCredits
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        creditType: cleanText(item.creditType, 48) || 'UNKNOWN',
        minimumCreditAmountForUsage: countOrNull(item.minimumCreditAmountForUsage),
        creditAmount: countOrNull(item.creditAmount),
      }))
      .slice(0, 16)
    : [];

  const planName = cleanText(planInfo?.planName || planInfo?.teamsTier || '', 64) || null;
  const tierId = cleanText(userTier?.id || '', 64) || null;
  const tierName = cleanText(userTier?.name || '', 64) || null;
  const canBuyMoreCredits = planInfo?.canBuyMoreCredits === true;

  const hasCredits = availablePromptCredits !== null || availableFlowCredits !== null ||
    monthlyPromptCredits !== null || monthlyFlowCredits !== null ||
    usedPromptCredits !== null || usedFlowCredits !== null || tierCredits.length > 0;

  if (!hasCredits && !planName && !tierName) return null;

  return {
    source: 'GetUserStatus',
    planName,
    tierId,
    tierName,
    availablePromptCredits,
    availableFlowCredits,
    monthlyPromptCredits,
    monthlyFlowCredits,
    monthlyFlexCreditPurchaseAmount,
    usedPromptCredits,
    usedFlowCredits,
    canBuyMoreCredits,
    tierCredits,
    hasCredits,
  };
}

/**
 * Extract per-session consumed AI credits from StreamAgentStateUpdates CreditUsageSummary.
 */
export function extractCreditUsageSummary(summary) {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return null;
  const items = Array.isArray(summary.consumedCredits) ? summary.consumedCredits : [];
  if (!items.length) return null;

  const totals = {};
  let entriesCount = 0;
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const credits = Array.isArray(item.credits) ? item.credits : [];
    for (const c of credits) {
      if (!c || typeof c !== 'object') continue;
      const type = cleanText(c.creditType, 48) || 'UNKNOWN';
      const amount = countOrNull(c.creditAmount);
      if (amount === null) continue;
      totals[type] = (totals[type] || 0) + amount;
      entriesCount++;
    }
  }
  if (!entriesCount) return null;
  return { source: 'CreditUsageSummary', totals, entriesCount };
}

// Public reference rates in USD per 1M tokens. Always marked estimated.
const PUBLIC_PRICE_RULES = [
  { key: 'gemini-4-hydrogen', test: s => /gemini[-._\s]*4[-._\s]*hydrogen|gemini-flash-worker|model_placeholder_m(?:432|433|434|525|526|527|528|529|530|531|669)\b/.test(s), input: 1.50, cacheRead: 0.075, cacheWrite: 1.50, output: 7.50 },
  { key: 'gemini-4-neon', test: s => /gemini[-._\s]*4[-._\s]*neon|orchestrator[-._\s()]*neon|model_placeholder_m(?:465|466|467|468|532|533|534|535|536|537)\b/.test(s), input: 3.00, cacheRead: 0.15, cacheWrite: 3.00, output: 15.00 },
  { key: 'gemini-4-argon', test: s => /gemini[-._\s]*4[-._\s]*argon|orchestrator[-._\s()]*argon|gemini-pro-orchestrator-g1-pro|model_placeholder_m(?:417|418|419|681)\b/.test(s), input: 2.00, cacheRead: 0.10, cacheWrite: 2.00, output: 10.00 },
  { key: 'gemini-4-carbon', test: s => /gemini[-._\s]*4[-._\s]*carbon|orchestrator|model_placeholder_m(?:420|421|427|437|438|667|668|670)\b/.test(s), input: 2.00, cacheRead: 0.10, cacheWrite: 2.00, output: 10.00 },
  { key: 'gemini-flash', test: s => /gemini[-._\s]*(?:2\.5|3\.8)[-._\s]*flash|model_placeholder_m(?:50|198|317|318|319|320|322)\b/.test(s), input: 0.15, cacheRead: 0.0375, cacheWrite: 0.15, output: 0.60 },
  { key: 'gemini-pro', test: s => /gemini[-._\s]*2\.5[-._\s]*pro|model_placeholder_m(?:18|148)\b/.test(s), input: 1.25, cacheRead: 0.125, cacheWrite: 1.25, output: 10.00 },
  { key: 'claude-opus-5.5', test: s => /claude[-._\s]*(?:opus[-._\s]*5[._-]5|5[._-]5[-._\s]*opus)(?!\.[0-9]|[_-][0-9](?![0-9]))|model_placeholder_m(?:368|400|401|402|406)\b/.test(s), input: 4.00, cacheRead: 0.20, cacheWrite: 5.00, output: 20.00 },
  { key: 'claude-opus', test: s => /claude[-._\s]*(?:opus[-._\s]*(?:4[._-][5678]|5(?:[._-]0)?)|(?:4[._-][5678]|5(?:[._-]0)?)[-._\s]*opus)(?!\.[0-9]|[_-][0-9](?![0-9]))|model_placeholder_m(?:11|12|26|254)\b/.test(s), input: 5.00, cacheRead: 0.50, cacheWrite: 6.25, output: 25.00 },
  { key: 'claude-opus-legacy', test: s => /claude[-._\s]*(?:opus[-._\s]*4(?:[._-][01])?|4(?:[._-][01])?[-._\s]*opus)(?!\.[0-9]|[_-][0-9](?![0-9]))/.test(s), input: 15.00, cacheRead: 1.50, cacheWrite: 18.75, output: 75.00 },
  { key: 'claude-sonnet-5.5', test: s => /claude[-._\s]*(?:sonnet[-._\s]*5[._-]5|5[._-]5[-._\s]*sonnet)(?!\.[0-9]|[_-][0-9](?![0-9]))|model_placeholder_m(?:377|403|404|405|407)\b/.test(s), input: 2.00, cacheRead: 0.10, cacheWrite: 2.50, output: 10.00 },
  { key: 'claude-sonnet', test: s => /claude[-._\s]*(?:sonnet[-._\s]*(?:4(?:[._-][567])?|3[._-][57])|(?:4(?:[._-][567])?|3[._-][57])[-._\s]*sonnet)(?!\.[0-9]|[_-][0-9](?![0-9]))|model_placeholder_m35\b/.test(s), input: 3.00, cacheRead: 0.30, cacheWrite: 3.75, output: 15.00 },
  { key: 'claude-haiku-5.5', test: s => /claude[-._\s]*(?:haiku[-._\s]*5[._-]5|5[._-]5[-._\s]*haiku)(?!\.[0-9]|[_-][0-9](?![0-9]))/.test(s), input: 0.10, cacheRead: 0.01, cacheWrite: 0.125, output: 0.50 },
  { key: 'claude-haiku', test: s => /claude[-._\s]*(?:haiku[-._\s]*4[._-]5|4[._-]5[-._\s]*haiku)(?!\.[0-9]|[_-][0-9](?![0-9]))/.test(s), input: 1.00, cacheRead: 0.10, cacheWrite: 1.25, output: 5.00 },
  { key: 'gpt-4.1', test: s => /^gpt-4\.1(?:-|$)/.test(s), input: 2.00, cacheRead: 0.50, cacheWrite: 2.00, output: 8.00 },
  { key: 'gpt-4o', test: s => /^gpt-4o(?:-|$)/.test(s), input: 2.50, cacheRead: 1.25, cacheWrite: 2.50, output: 10.00 },
];

/**
 * Resolve public reference pricing rates for a known model, or null if unknown.
 */
export function modelPricingRule(modelName) {
  const raw = cleanText(modelName, 128).toLowerCase();
  if (!raw || /byom|unknown|gpt-oss|sol|astra|perplexity/.test(raw)) return null;
  const formatted = cleanText(formatModelName(modelName) || '', 128).toLowerCase();
  const candidates = [raw, formatted].filter(Boolean);
  for (const rule of PUBLIC_PRICE_RULES) {
    if (candidates.some(candidate => rule.test(candidate))) return rule;
  }
  return null;
}

/**
 * Estimate USD cost for a single model's token bucket using public fallback pricing.
 */
export function estimateTokenCost(modelName, usage = {}) {
  const rule = modelPricingRule(modelName);
  if (!rule || !usage || typeof usage !== 'object') return null;

  const uncached = nonNegNumber(usage.uncached ?? usage.inputTokens ?? usage.input ?? 0);
  const cacheRead = nonNegNumber(usage.cacheRead ?? usage.cacheReadTokens ?? 0);
  const cacheWrite = nonNegNumber(usage.cacheWrite ?? usage.cacheWriteTokens ?? 0);
  const output = nonNegNumber(usage.output ?? usage.outputTokens ?? 0);
  if (uncached === null || cacheRead === null || cacheWrite === null || output === null) return null;

  const inputUsd = (uncached / 1e6) * rule.input;
  const cacheReadUsd = (cacheRead / 1e6) * rule.cacheRead;
  const cacheWriteUsd = (cacheWrite / 1e6) * rule.cacheWrite;
  const outputUsd = (output / 1e6) * rule.output;
  const totalUsd = inputUsd + cacheReadUsd + cacheWriteUsd + outputUsd;

  return {
    totalUsd,
    inputUsd,
    cacheReadUsd,
    cacheWriteUsd,
    outputUsd,
    estimated: true,
    rateKey: rule.key,
  };
}

/**
 * Aggregate estimated USD cost across a dictionary or list of model token buckets.
 */
export function estimateModelsCost(modelBuckets) {
  const entries = Array.isArray(modelBuckets)
    ? modelBuckets.map(item => [item?.model || '', item])
    : modelBuckets && typeof modelBuckets === 'object'
      ? Object.entries(modelBuckets)
      : [];

  let totalUsd = 0, pricedModels = 0, unpricedModels = 0;
  for (const [model, bucket] of entries) {
    if (!bucket || typeof bucket !== 'object') continue;
    const hasTokens = (bucket.uncached || bucket.inputTokens || bucket.input || 0) > 0 ||
      (bucket.cacheRead || bucket.cacheReadTokens || 0) > 0 ||
      (bucket.cacheWrite || bucket.cacheWriteTokens || 0) > 0 ||
      (bucket.output || bucket.outputTokens || 0) > 0;
    if (!hasTokens) continue;
    const cost = estimateTokenCost(model, bucket);
    if (cost) {
      totalUsd += cost.totalUsd;
      pricedModels++;
    } else {
      unpricedModels++;
    }
  }

  return {
    totalUsd: pricedModels > 0 ? totalUsd : null,
    pricedModels,
    unpricedModels,
    hasPriced: pricedModels > 0,
    complete: pricedModels > 0 && unpricedModels === 0,
    estimated: true,
  };
}

export function formatUsd(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) return '—';
  if (amount > 0 && amount < 0.01) return '<$0.01';
  if (amount >= 100) return `$${amount.toFixed(0)}`;
  return `$${amount.toFixed(2)}`;
}
