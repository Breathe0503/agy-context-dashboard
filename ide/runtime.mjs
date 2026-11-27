import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {discoverIdeDebugPorts} from './discovery.mjs';
import {discoverIdeWebviews} from './webview-targets.mjs';
export function validIdeTarget(target,port){
  try{
    const page=new URL(target.url),ws=new URL(target.webSocketDebuggerUrl);
    return target.type==='page'&&page.protocol==='vscode-file:'&&page.hostname==='vscode-app'
      && /\/out\/vs\/code\/electron-browser\/workbench\/workbench\.html$/.test(page.pathname)
      && ws.protocol==='ws:'&&['127.0.0.1','localhost','[::1]'].includes(ws.hostname)&&Number(ws.port)===port;
  }catch{return false;}
}
const fallbackPorts=new Map();
async function probePort(port,{fetchFn=fetch,discoverWebviews=discoverIdeWebviews}={}){
  const res=await fetchFn(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(2000)});
  const body=await res.text();if(!res.ok||body.length>1048576)throw Error('IDE renderer discovery failed');
  const targets=JSON.parse(body);if(!Array.isArray(targets)||targets.length>128)throw Error('Invalid IDE renderer targets');
  const workbenches=targets.filter(t=>validIdeTarget(t,port));
  const webviews=await discoverWebviews({targets,workbenches,port});
  return {port,workbenches,targets:[...workbenches,...webviews]};
}
export async function ideTargets(profile,{read=readFile,fetchFn=fetch,discoverPorts=discoverIdeDebugPorts,discoverWebviews=discoverIdeWebviews}={}){
  const text=await read(join(profile,'DevToolsActivePort'),'utf8');
  const port=Number(text.split(/\r?\n/)[0]);
  if(text.length>1024||!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid IDE renderer port');
  try{
    const result=await probePort(port,{fetchFn,discoverWebviews});
    fallbackPorts.delete(profile);
    return {port:result.port,targets:result.targets};
  }catch(primaryError){
    // Launching a second IDE window with --remote-debugging-port=0 lets the
    // short-lived launcher process overwrite DevToolsActivePort with an
    // ephemeral port before handing off to the existing Electron root and
    // exiting. Recover the live CDP port owned by the running IDE root.
    const cached=fallbackPorts.get(profile);
    if(cached&&cached.stalePort===port){
      try{
        const recovered=await probePort(cached.livePort,{fetchFn,discoverWebviews});
        if(recovered.workbenches.length)return {port:recovered.port,targets:recovered.targets};
      }catch{}
      fallbackPorts.delete(profile);
    }
    const candidates=await discoverPorts().catch(()=>[]);
    for(const candidate of candidates){
      if(candidate===port)continue;
      try{
        const recovered=await probePort(candidate,{fetchFn,discoverWebviews});
        if(recovered.workbenches.length){
          fallbackPorts.set(profile,{stalePort:port,livePort:candidate});
          return {port:recovered.port,targets:recovered.targets};
        }
      }catch{}
    }
    throw primaryError;
  }
}
