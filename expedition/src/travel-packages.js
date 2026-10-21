/* Immutable package lookup, shared by the travel page and home save validator. */
(function(root){'use strict';
if(!root.SymiaForgeCatalog&&typeof require!=='undefined')require('./forge-episode.js');
const S=root.SymiaStaticWorld||(typeof require!=='undefined'&&require('./static-world.js'));
const catalog=root.SymiaForgeCatalog;
const packages=[...catalog.packages],CACHE='symia.travel.published.v1';
const key=p=>`${p.id}@${p.version}:${p.sourceSha256}`;
const byKey=new Map(catalog.packages.map(p=>[key(p),p]));
function get(id=catalog.defaultId){return packages.filter(p=>p.id===id).sort((a,b)=>b.version-a.version)[0]||null;}
function resolve(t){const f=t?.forge;if(!f)return null;const lookup=`${f.packetId}@${f.version}:${f.sourceSha256}`;if(!byKey.has(lookup))hydrate();const p=byKey.get(lookup);
 if(!p)return null;
 return f.packageSha256===p.packageSha256||f.packageSha256===undefined&&p.legacySaveCompatible?p:null;
}
const downloaded=new Map(),BLOCKED='symia.travel.unavailable.v1';
let blocked=new Set();
const available=id=>!!get(id)&&!blocked.has(id);
function register(raw){
 if(S.is(raw)){
  S.check(raw);const old=get(raw.id);if(old){if(old.packageSha256!==raw.packageSha256)throw Error('Published package changed');return old;}
  const p=JSON.parse(JSON.stringify(raw));function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
  freeze(p);packages.push(p);byKey.set(key(p),p);downloaded.set(p.id,raw);return p;
 }
 const base=catalog.packages.find(p=>p.id===catalog.defaultId);
 if(!/^silas-generated-[a-f0-9]{32}$/.test(raw?.id)||raw.version!==1||raw.rewardId!==null||raw.rewardNode!==null||raw.rewardQuantity!==0||raw.legacySaveCompatible!==false||raw.mode!=='solo-managed'||JSON.stringify(raw.participants)!=='["potion-maker"]')throw Error('Unsupported downloaded package');
 if(!/^[a-f0-9]{64}$/.test(raw.sourceSha256)||!/^[a-f0-9]{64}$/.test(raw.packageSha256)||raw.nodes?.length!==7)throw Error('Invalid downloaded identity');
 const old=get(raw.id);if(old){if(old.packageSha256!==raw.packageSha256)throw Error('Published package changed');return old;}
 const p=JSON.parse(JSON.stringify(raw)),presentation=p.presentation;
 if(presentation.rendererId!==base.presentation.rendererId||JSON.stringify(presentation.artAssets)!==JSON.stringify(base.presentation.artAssets)||p.assets.length!==20||p.schedule.version!==base.schedule.version||p.schedule.durationMs!==base.schedule.durationMs||JSON.stringify(p.schedule.nodeOffsetsMs)!==JSON.stringify(base.schedule.nodeOffsetsMs))throw Error('Unsupported downloaded renderer');
 for(const a of p.assets){if(!base.assets.some(b=>b.id===a.id&&b.sha256===a.sha256))throw Error('Unapproved artwork');}
 for(const n of p.nodes){const m=presentation.moments[n.id];if(!m||m.image||m.assetId||m.reward||m.painterPresent||typeof n.narration!=='string')throw Error('Unsupported event binding');}
 presentation.artUrls=[...base.presentation.artUrls];
 function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
 freeze(p);packages.push(p);byKey.set(key(p),p);downloaded.set(p.id,raw);return p;
}
function hydrate(){try{if(typeof localStorage!=='undefined'){const denied=JSON.parse(localStorage.getItem(BLOCKED)||'[]');if(Array.isArray(denied))blocked=new Set(denied.filter(id=>typeof id==='string'&&id!==catalog.defaultId));for(const p of JSON.parse(localStorage.getItem(CACHE)||'[]'))register(p);}}catch{/* Failed cache never replaces the baseline or writes a save. */}}
hydrate();
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key===CACHE||e.key===BLOCKED)hydrate();});
async function refresh(){
 if(typeof window==='undefined'||!/^https?:$/.test(location.protocol))return;
 const response=await fetch('/api/travel-production/packages',{signal:AbortSignal.timeout(4000)});
 if(!response.ok)throw Error('制作服务暂时不可用；已保存的旅行仍可使用。');
 const data=await response.json();if(data.schemaVersion!==1||!Array.isArray(data.packages))throw Error('Invalid package catalogue');
 for(const p of data.packages)register(p);
 if(!Array.isArray(data.unavailable))throw Error('Invalid unavailable catalogue');
 blocked=new Set(data.unavailable.filter(id=>typeof id==='string'&&id!==catalog.defaultId));
 localStorage.setItem(BLOCKED,JSON.stringify([...blocked]));
 // Cache the small JSON contract; artwork is already embedded in the accepted page.
 localStorage.setItem(CACHE,JSON.stringify([...downloaded.values()]));
}
const ready=refresh().catch(()=>{});
if(typeof window!=='undefined')window.setInterval(()=>{if(!document.hidden)void refresh().catch(()=>{});},30000);
const api=Object.freeze({get,resolve,available,list:()=>packages.filter(p=>available(p.id)),defaultId:catalog.defaultId,refresh,ready});
root.SymiaTravelPackages=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
