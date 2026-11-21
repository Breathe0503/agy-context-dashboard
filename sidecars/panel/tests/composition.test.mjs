// Issue #34: single-session context composition, trend and compaction markers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { tokenBaseMetrics, compositionMetrics, attachTokenBase } from '../composition.mjs';
import { MetricsStore } from '../store.mjs';
import { SessionHistory } from '../history.mjs';
import { TrajectoryJson } from '../trajectory-json.mjs';
import { validatedInput } from '../../../compat/runtime-ui.mjs';

const GUID='01234567-89ab-cdef-0123-456789abcdef';
const context={usedTokens:100000,maxTokens:1000000};
const stepUsage=(type,input,extra={})=>({type:`CORTEX_STEP_TYPE_${type}`,metadata:{modelUsage:{inputTokens:String(input),...extra}}});
const tokenBaseResponse={customizationTokenBase:{totalTokens:16489,groups:[{name:'Rules',numTokens:6642,children:[{name:'file',numTokens:1}]},{name:'Skills',numTokens:'9347'},{name:'broken'},{name:'Negative',numTokens:-5}]},remainingBudget:10153,customizationBudget:20000,rulesBudget:20000};

test('token base keeps exact totals, budgets and sanitized groups only',()=>{
  const base=tokenBaseMetrics(tokenBaseResponse);
  assert.equal(base.totalTokens,16489);assert.equal(base.budget,20000);assert.equal(base.remainingBudget,10153);
  assert.deepEqual(base.groups,[{name:'Rules',tokens:6642},{name:'Skills',tokens:9347}]);
  assert.equal(base.source,'GetTokenBase');
  assert.equal(tokenBaseMetrics(null),null);assert.equal(tokenBaseMetrics({}),null);
  assert.equal(tokenBaseMetrics({customizationTokenBase:{totalTokens:'x'}}),null);
  assert.equal(tokenBaseMetrics({customizationTokenBase:{totalTokens:-1}}),null);
  assert.equal(tokenBaseMetrics({customizationTokenBase:[]}),null);
});

test('composition buckets classify per-step usage and scale onto host usage',()=>{
  const steps=[stepUsage('USER_INPUT',3000),
    {type:'CORTEX_STEP_TYPE_PLANNER_RESPONSE',metadata:{modelUsage:{inputTokens:'90000',outputTokens:'12000',thinkingOutputTokens:'8000',responseOutputTokens:'4000'}}},
    stepUsage('TOOL_RESULT',2500),stepUsage('CHECKPOINT',500),stepUsage('SYSTEM_MESSAGE',200),
    {type:'CORTEX_STEP_TYPE_USER_INPUT',metadata:{modelUsage:{inputTokens:'0'}}}];
  const comp=compositionMetrics({context,steps,generators:[]});
  assert.equal(comp.source,'steps');
  assert.deepEqual(comp.parts,[['user',3000],['thinking',8000],['reply',4000],['tool',2500],['system',700]]);
  assert.equal(comp.customization.available,false);
  const dynamic=comp.segments.filter(segment=>segment.id!=='remaining');
  assert.deepEqual(dynamic.map(segment=>segment.id),['user','thinking','reply','tool','system']);
  // Raw estimates (18,200) are scaled so the dynamic layer fills the host-used
  // 10% exactly; titles keep the unscaled numbers.
  assert.ok(Math.abs(dynamic.reduce((n,segment)=>n+segment.fraction,0)-0.1)<1e-9);
  const remaining=comp.segments.at(-1);
  assert.equal(remaining.id,'remaining');assert.equal(remaining.tokens,900000);
  assert.ok(Math.abs(remaining.fraction-0.9)<1e-9);
});

test('logged-text classification is the fallback and merges assistant output',()=>{
  const transcript={status:'ready',matchedSteps:5,userTokens:2000,assistantTokens:6000,toolTokens:1000,systemTokens:100,totalTokens:9100};
  const comp=compositionMetrics({context,steps:[{type:'CORTEX_STEP_TYPE_USER_INPUT',metadata:{}}],generators:[],transcript});
  assert.equal(comp.source,'transcript');
  assert.deepEqual(comp.parts.map(([id])=>id),['user','assistant','tool','system']);
  const fallbackDynamic=comp.segments.filter(segment=>segment.id!=='remaining');
  assert.ok(Math.abs(fallbackDynamic.reduce((n,segment)=>n+segment.fraction,0)-0.1)<1e-9);
  const none=compositionMetrics({context,steps:[],generators:[]});
  assert.equal(none.source,null);assert.equal(none.segments.length,1);assert.equal(none.segments[0].id,'remaining');
  const partial=compositionMetrics({context,steps:[],generators:[],transcript:{...transcript,status:'unavailable'}});
  assert.equal(partial.source,null);
});

test('composition requires host used and max tokens',()=>{
  assert.equal(compositionMetrics({context:null,steps:[],generators:[]}),null);
  assert.equal(compositionMetrics({context:{usedTokens:100,maxTokens:null},steps:[],generators:[]}),null);
  assert.equal(compositionMetrics({context:{usedTokens:100,maxTokens:0},steps:[],generators:[]}),null);
  assert.equal(compositionMetrics({context:{usedTokens:'x',maxTokens:10},steps:[],generators:[]}),null);
});

test('token base attach rescales the dynamic layer without displacing host usage',()=>{
  const steps=[stepUsage('USER_INPUT',3000),{type:'CORTEX_STEP_TYPE_PLANNER_RESPONSE',metadata:{modelUsage:{inputTokens:'90000',thinkingOutputTokens:'8000',responseOutputTokens:'4000'}}}];
  const base=tokenBaseMetrics(tokenBaseResponse);
  const comp=attachTokenBase(compositionMetrics({context,steps,generators:[]}),base);
  assert.equal(comp.customization.available,true);assert.equal(comp.customization.tokens,16489);assert.equal(comp.customization.budget,20000);
  assert.deepEqual(comp.customization.groups.map(group=>group.name),['Rules','Skills']);
  const byId=Object.fromEntries(comp.segments.map(segment=>[segment.id,segment]));
  assert.ok(Math.abs(byId.customization.fraction-16489/1000000)<1e-9);
  const dynamic=comp.segments.filter(segment=>!['customization','remaining'].includes(segment.id));
  assert.ok(Math.abs(dynamic.reduce((n,segment)=>n+segment.fraction,0)-(100000-16489)/1000000)<1e-9);
  assert.ok(Math.abs(comp.segments.reduce((n,segment)=>n+segment.fraction,0)-1)<1e-9);
  assert.equal(attachTokenBase(null,base),null);
  assert.equal(attachTokenBase(compositionMetrics({context,steps,generators:[]}),null).customization.available,false);
});

test('trend uses total input per request, dedupes records and anchors markers',()=>{
  const chat=(messageId,input,read,indices)=>({stepIndices:indices,chatModel:{usage:{messageId,inputTokens:String(input),...(read===undefined?{}:{cacheReadTokens:String(read)}),apiProvider:'API_PROVIDER_GOOGLE_GEMINI'}}});
  const generators=[chat('a',1000,3000,[0,1]),chat('a',1000,3000,[0,1]),chat('b',500,0,[4]),chat('c',200,undefined,[6])];
  const steps=['USER_INPUT','PLANNER_RESPONSE','TOOL_RESULT','COMPACTION','PLANNER_RESPONSE','CHECKPOINT','PLANNER_RESPONSE'].map(type=>({type:`CORTEX_STEP_TYPE_${type}`}));
  const comp=compositionMetrics({context,steps,generators});
  // Total basis: uncached + cache read (+ write). Duplicate record counts once.
  assert.deepEqual(comp.trend.points.map(point=>point.inputTokens),[4000,500,200]);
  assert.deepEqual(comp.trend.markers,[
    {pointIndex:1,kind:'compaction',before:4000,after:500},
    {pointIndex:2,kind:'checkpoint',before:500,after:200},
  ]);
  assert.equal(comp.trend.totalRequests,3);assert.equal(comp.trend.totalMarkers,2);
});

test('trend caps the window to recent requests and keeps only visible markers',()=>{
  const generators=Array.from({length:10},(_,i)=>({stepIndices:[i],chatModel:{usage:{messageId:`m${i}`,inputTokens:String(100*(i+1))}}}));
  const steps=generators.map((_,i)=>({type:i===2?'CORTEX_STEP_TYPE_COMPACTION':'CORTEX_STEP_TYPE_PLANNER_RESPONSE'}));
  const comp=compositionMetrics({context,steps,generators,maxTrendPoints:6});
  assert.equal(comp.trend.points.length,6);assert.equal(comp.trend.points[0].inputTokens,500);
  assert.equal(comp.trend.totalRequests,10);assert.equal(comp.trend.totalMarkers,1);
  assert.deepEqual(comp.trend.markers,[]); // the early compaction fell out of the window
  const late=compositionMetrics({context,steps:[...steps,{type:'CORTEX_STEP_TYPE_COMPACTION'}],generators,maxTrendPoints:6});
  assert.deepEqual(late.trend.markers.map(marker=>marker.pointIndex),[6]); // past the last point; renderer clamps to the edge
  assert.equal(late.trend.markers[0].before,1000);assert.equal(late.trend.markers[0].after,null);
});

test('trajectory projection retains per-step usage buckets only',()=>{
  const parser=new TrajectoryJson();
  parser.write(JSON.stringify({trajectory:{steps:[{id:'s1',type:'CORTEX_STEP_TYPE_USER_INPUT',metadata:{createdAt:'2026-11-21T08:00:00Z',modelUsage:{inputTokens:'120',cacheReadTokens:'30',outputTokens:'0',responseOutputTokens:'0',thinkingOutputTokens:'0',extra:'drop'},generatorModel:'gemini'},content:'secret prompt'}]}}));
  const value=parser.end();
  const metadata=value.trajectory.steps[0].metadata;
  assert.deepEqual(metadata.modelUsage,{inputTokens:'120',outputTokens:'0',responseOutputTokens:'0',thinkingOutputTokens:'0',cacheReadTokens:'30'});
  assert.equal(metadata.generatorModel,undefined);
  assert.equal(value.trajectory.steps[0].content,undefined);
});

test('context detail lazily fetches the token base, caches it, and degrades silently',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'ag-composition-'));t.after(()=>rm(directory,{recursive:true,force:true}));
  const calls=[];let tokenBaseBroken=false;
  const raw={trajectory:{cascadeId:GUID,steps:[{type:'CORTEX_STEP_TYPE_USER_INPUT',metadata:{createdAt:'2026-11-21T08:00:00Z',modelUsage:{inputTokens:'3000'}}}],generatorMetadata:[{stepIndices:[0],chatModel:{usage:{messageId:'m1',inputTokens:'1000'},chatStartMetadata:{contextWindowMetadata:{estimatedTokensUsed:100000,maxContextTokens:1000000}}}}]},numTotalSteps:1};
  const client={call:async method=>{calls.push(method);
    if(method==='GetUserStatus')return{userStatus:{email:'a@example.test'}};
    if(method==='RetrieveUserQuotaSummary')return{response:{groups:[]}};
    if(method==='GetTokenBase'){if(tokenBaseBroken)throw new Error('offline');return tokenBaseResponse;}
    throw new Error('unexpected '+method);},
    discover:async()=>({pid:1}),trajectory:async()=>raw,resetTrajectories(){}};
  const store=new MetricsStore(client,{history:new SessionHistory(directory),transcripts:null});
  const plain=await store.snapshot({conversationId:GUID});
  assert.equal(calls.includes('GetTokenBase'),false); // lazy: plain polls never fetch it
  assert.equal(plain.speed.contextComposition.customization.available,false);
  const detailed=await store.snapshot({conversationId:GUID,contextDetail:true});
  assert.equal(calls.filter(name=>name==='GetTokenBase').length,1);
  assert.equal(detailed.speed.contextComposition.customization.tokens,16489);
  assert.ok(detailed.speed.contextComposition.segments.some(segment=>segment.id==='customization'));
  const cached=await store.snapshot({conversationId:GUID}); // later polls reuse the cache
  assert.equal(calls.filter(name=>name==='GetTokenBase').length,1);
  assert.equal(cached.speed.contextComposition.customization.tokens,16489);
  tokenBaseBroken=true;store.tokenBase=null;store.tokenBaseAt=0;store.tokenBaseFailedAt=0;
  const degraded=await store.snapshot({conversationId:GUID,contextDetail:true});
  assert.equal(calls.filter(name=>name==='GetTokenBase').length,2);
  assert.equal(degraded.speed.contextComposition.customization.available,false);
  assert.ok(degraded.speed.contextComposition.segments.every(segment=>segment.id!=='customization'));
  assert.ok(degraded.speed.contextComposition.segments.some(segment=>segment.id!=='remaining'));
  const afterCooldown=await store.snapshot({conversationId:GUID,contextDetail:true}); // failure backoff: no extra RPC
  assert.equal(calls.filter(name=>name==='GetTokenBase').length,2);
  assert.equal(afterCooldown.speed.contextComposition.customization.available,false);
  store.dispose();
});

test('metrics request validation passes contextDetail through explicitly',()=>{
  assert.equal(validatedInput({conversationId:null,contextDetail:true}).contextDetail,true);
  assert.equal(validatedInput({conversationId:null}).contextDetail,undefined);
  assert.equal(validatedInput({conversationId:null,contextDetail:'yes'}).contextDetail,undefined);
  assert.equal(validatedInput({conversationId:null,force:true}).contextDetail,undefined);
});
