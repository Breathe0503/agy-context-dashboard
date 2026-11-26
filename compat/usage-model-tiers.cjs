'use strict';
// Presentation-layer helpers that roll thinking/effort tiers of the same base
// model into a single display key (issue #83). Raw per-tier records stay in
// storage; only the usage UI aggregates them.
const TIER_SUFFIX_RE=/\s*\((n|xhigh|extra-high|extrahigh|extra|high|medium|low|max|thinking)\)$/i;
const TIER_MERGE_KEYS=['total','requests','uncached','cacheRead','cacheWrite','output'];
// Strip only effort-tier suffixes such as "(High)", "(XHigh)", "(Thinking)".
// Role/variant suffixes like "(Orchestrator)", "(Neon)", "(Trial)" and
// "(Internal BYOM)" are preserved so distinct models never get merged.
function baseModelName(name){
  const s=String(name??'').trim();
  const m=s.match(TIER_SUFFIX_RE);
  if(!m)return s;
  const base=s.slice(0,m.index).trimEnd();
  return base||s;
}
// Canonical tier label from a tier-suffixed display name ("Gemini 4 Neon
// (XHigh)" -> "XHigh"); models without a tier suffix keep their full name.
function tierLabel(canon){
  const m=String(canon??'').match(TIER_SUFFIX_RE);
  if(!m)return String(canon??'');
  const v=m[1].toLowerCase();
  return v==='xhigh'?'XHigh':v==='n'?'N':v[0].toUpperCase()+v.slice(1);
}
// Merge a day-models-like record ({model: counters}) by base model. Tier
// sub-counters are preserved under `tiers[label]` when a merge actually
// happens, so tooltips can still show the distribution.
function mergeModelTiers(rawModels,toCanon,toBase){
  const merged={};let changed=false;
  for(const [rawModel,r]of Object.entries(rawModels||{})){
    const canon=toCanon(rawModel),base=toBase(canon);
    if(base!==rawModel||Object.hasOwn(merged,base))changed=true;
    if(!Object.hasOwn(merged,base)){
      Object.defineProperty(merged,base,{value:{total:0,requests:0,uncached:0,cacheRead:0,cacheWrite:0,output:0,tiers:null},enumerable:true,writable:true,configurable:true});
    }
    const target=merged[base];
    for(const key of TIER_MERGE_KEYS)target[key]+=Number(r?.[key])||0;
    if(base!==canon){
      target.tiers||(target.tiers={});
      const label=tierLabel(canon),tier=target.tiers[label]||(target.tiers[label]={total:0,requests:0,uncached:0,cacheRead:0,cacheWrite:0,output:0});
      for(const key of TIER_MERGE_KEYS)tier[key]+=Number(r?.[key])||0;
    }
  }
  return {merged,changed};
}
module.exports={TIER_SUFFIX_RE,TIER_MERGE_KEYS,baseModelName,tierLabel,mergeModelTiers};
