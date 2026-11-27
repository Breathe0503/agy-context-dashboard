import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SidecarOwner} from '../compat/sidecar-owner.mjs';
import {RuntimeUi,makeRendererSource} from '../compat/runtime-ui.mjs';
import {PreferencesStore} from '../compat/preferences.mjs';
import {readHostTheme} from '../compat/host-theme.mjs';
import {MetricsStore} from '../sidecars/panel/store.mjs';
import {SessionHistory} from '../sidecars/panel/history.mjs';
import {TranscriptReader,transcriptBrainRoot} from '../sidecars/panel/transcript.mjs';
import {DesktopUsage as LocalUsage,UsageLedger} from '../sidecars/panel/usage.mjs';
import {IdeClient} from './client.mjs';
import {ideTargets} from './runtime.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const profile=process.env.AG_PULSE_IDE_PROFILE;
if(!profile)throw Error('IDE profile is required');
const data=process.env.AG_PULSE_IDE_DATA||join(profile,'User','globalStorage','you-should-know-me.antigrative-dashboard-ide');
let debugPort=0;
const client=new IdeClient({profile,debugPort:()=>debugPort});
const ownership=new SidecarOwner(data);
const history=new SessionHistory(join(data,'history-v1'));
const transcripts=new TranscriptReader({root:transcriptBrainRoot('ide')});
const store=new MetricsStore(client,{history,transcripts,owns:()=>ownership.owns()});
const usage=new LocalUsage(store,new UsageLedger(join(data,'usage-v1'),{source:'ide-local'}),{host:'ide',owns:()=>ownership.owns()});
const wireStore=targetStore=>{
  targetStore.onTrajectory=async(scope,id,raw,options={})=>{
    const {isCurrent=()=>true}=options;
    if(isCurrent()!==true)return;
    if(!store.identity&&targetStore.identity)store.identity=targetStore.identity;
    if(await ownership.isOwner()&&isCurrent()===true)return usage.ingestLive(scope,id,raw,{...options,isCurrent});
  };
  targetStore.onBackgroundResult=(scope,id,file,options)=>usage.ingestDisk(scope,id,file,options);
  return targetStore;
};
wireStore(store);
// IDE 2.6 spawns one agy --hub per window; route each webview's live snapshot
// to its own verified hub port so concurrent windows see real-time requests.
const hubStores=new Map();
function storeForInput(input){
  const hubPort=input?.ideHubPort;
  if(!Number.isInteger(hubPort)||hubPort<1||hubPort>65535)return {activeClient:client,activeStore:store};
  let entry=hubStores.get(hubPort);
  if(entry){hubStores.delete(hubPort);hubStores.set(hubPort,entry);return entry;}
  while(hubStores.size>=4){const [oldestPort,oldest]=hubStores.entries().next().value;hubStores.delete(oldestPort);oldest.activeStore.dispose();}
  const activeClient=new IdeClient({profile,debugPort:()=>debugPort,preferredHubPort:hubPort});
  const activeStore=wireStore(new MetricsStore(activeClient,{history,transcripts,owns:()=>ownership.owns()}));
  entry={activeClient,activeStore};
  hubStores.set(hubPort,entry);
  return entry;
}
const preferences=new PreferencesStore({file:join(data,'preferences.json')});
const files=await Promise.all(['compat/i18n.cjs','compat/inline-widget.cjs','compat/theme.cjs','ide/surface.cjs','compat/usage-ui.cjs','compat/host-i18n.cjs','compat/host-i18n-dict.json'].map(f=>readFile(join(root,f),'utf8')));
const extract=s=>s.slice(s.indexOf('module.exports = ')+17).trim().replace(/;$/,'');
if(!await ownership.claim())process.exit(0);
const usageSource=`window.__agPulseUsageFactory=(${extract(files[4])});`;
let hostI18nDict={};try{hostI18nDict=JSON.parse(files[6].replace(/^\uFEFF/,''));}catch{}
const hostI18nSource=`window.__agPulseHostI18nDict=${JSON.stringify(hostI18nDict)};window.__agPulseHostI18nFactory=(${extract(files[5])});`;
const owner=ownership.token;
const adapter=`window.__agPulseSurface=(${extract(files[3])})();`;
const source=makeRendererSource(...files.slice(0,3),owner,ownership.startedAt,adapter+usageSource+hostI18nSource);
const webviewAdapter=`window.__agPulseSurface=(${extract(files[3])})({webview:true});`;
const webviewSource=makeRendererSource(...files.slice(0,3),owner,ownership.startedAt,webviewAdapter+usageSource+hostI18nSource,{allowNested:true});
// Each workbench has its own bridge request ID and DOM conversation ID. Empty
// composers request account quota only; no most-recent-conversation fallback.
const snapshot=async input=>{
  if(!await ownership.isOwner())throw Error('Sidecar ownership changed');
  const prefs=await preferences.snapshot();
  const hostTheme=await readHostTheme(),liveTheme=ui.rendererTheme;
  const theme=(liveTheme?.fontFamily||liveTheme?.monoFontFamily)?{...liveTheme,...hostTheme}:hostTheme;
  if(input?.usageOnly===true){
    if(!store.serverPid&&!store.identity){
      try{
        const server=await client.discover();
        if(server.pid!==store.serverPid){store.epoch++;store.background?.reset();store.delegated.reset();store.transcripts?.reset();store.identity=null;store.quota=null;store.quotaAt=0;store.tokenBase=null;store.tokenBaseAt=0;store.tokenBaseFailedAt=0;store.sessions.clear();store.clearUsagePersistenceErrors();store.serverPid=server.pid;}
        await store.refreshQuota(false);
      }catch{}
    }
    const requestedScope=(input.usageScope==='local'||input.usageScope==='account')?input.usageScope:(prefs?.usageScope||'local');
    return {connection:store.quota?'live':'stale',speed:null,groups:store.quota||[],usage:await usage.snapshot({sync:false,scope:requestedScope,groups:store.quota}),enabled:true,preferences:prefs,theme};
  }
  let value;
  const {activeClient,activeStore}=storeForInput(input);
  if(input.conversationId)value=await activeStore.snapshot(input);
  else{
    try{
      const server=await activeClient.discover();
      if(server.pid!==activeStore.serverPid){activeStore.epoch++;activeStore.background?.reset();activeStore.delegated.reset();activeStore.transcripts?.reset();activeStore.identity=null;activeStore.quota=null;activeStore.quotaAt=0;activeStore.tokenBase=null;activeStore.tokenBaseAt=0;activeStore.tokenBaseFailedAt=0;activeStore.sessions.clear();activeStore.clearUsagePersistenceErrors();activeStore.serverPid=server.pid;}
      await activeStore.refreshQuota(input.force);
      value={connection:'live',speed:null,groups:activeStore.quota||[],quotaUpdatedAt:new Date(activeStore.quotaAt).toISOString()};
    }catch{value={connection:'offline',speed:null,groups:[],error:'IDE local API unavailable'};}
  }
  if(input.usageSync===true)void usage.sync(true);
  return {...value,usage:await usage.snapshot({sync:input.usageSync===true,scope:prefs?.usageScope||'local',groups:value.groups}),enabled:true,preferences:prefs,theme};
};
const ui=new RuntimeUi({profile,source,sourceForTarget:target=>target.ideWebview?webviewSource:source,owner,owns:()=>ownership.isOwner(),preferences,snapshot,dataDir:data,targetOrigin:target=>target.ideWebview?new URL(target.url).origin:'vscode-file://vscode-app',
  discover:async()=>{const result=await ideTargets(profile);debugPort=result.port;return result.targets;}});
await mkdir(data,{recursive:true});
await writeFile(join(data,'runtime.json'),JSON.stringify({pid:process.pid,startedAt:new Date().toISOString(),mode:'ide'}));
ui.start();
const keepAlive=setInterval(()=>{},60000);
async function stop(){usage.dispose();for(const {activeStore}of hubStores.values())activeStore.dispose();hubStores.clear();store.dispose();clearInterval(keepAlive);await ui.stop();ownership.stop();process.exit(0);}
ownership.watch(stop);
process.on('message',message=>{if(message?.type==='stop')void stop();});
if(process.connected)process.once('disconnect',()=>{void stop();});
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{void stop();});
