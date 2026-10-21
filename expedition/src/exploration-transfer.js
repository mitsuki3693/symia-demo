/* Import only exploration. The target garden, kitchen and home layout remain authoritative. */
(function(root){
'use strict';
const E=root.SymiaEngine||(typeof require!=='undefined'&&require('./engine.js'));
const copy=x=>JSON.parse(JSON.stringify(x));
function merge(target,source){
 if(!E.validateState(target)||!E.validateState(source))throw Error('存档格式不兼容，未修改任何进度。');
 if(!source.trip&&!source.history.length)throw Error('旧存档里还没有探索经历。');
 const imports=target.explorationImports||[];
 if(imports.includes(source.installationId))return copy(target);
 if(target.trip||target.history.length||target.marsh)throw Error('新家园已有独立探索进度。为保留两条旅途，这次未覆盖；可继续当前探索，旧进度仍在原页面。');
 const s=E.normalizeState(target),old=E.normalizeState(source),delta=target.clockOffsetMs-source.clockOffsetMs;
 // Logical demo clocks can differ; do not age any of the existing garden crops.
 function shift(value){if(!value||typeof value!=='object')return;for(const [key,v] of Object.entries(value)){if(typeof v==='number'&&(key.endsWith('At')||['at','until','deadline'].includes(key)))value[key]=Math.max(0,v+delta);else if(v&&typeof v==='object')shift(v);}}
 shift(old.trip);shift(old.history);shift(old.marsh);shift(old.memories);
 s.trip=old.trip;s.history=old.history;s.tripCount=old.tripCount;s.party=old.party;
 if(old.marsh)s.marsh=old.marsh;
 if(old.atlas)s.atlas=old.atlas;
 const journeys=new Set([old.trip,...old.history].filter(Boolean).map(t=>t.id));
 const lotIds=new Set(s.lots.map(l=>l.id));
 // Remaining expedition rewards only: no old crops, harvests or demo supplies.
 for(const lot of old.lots){if(lotIds.has(lot.id)||lot.item==='glow_mint'||!lot.sourceJourneyIds.length||!lot.sourceJourneyIds.every(id=>journeys.has(id)))continue;s.lots.push(lot);s.inventory[lot.item]+=lot.qty;lotIds.add(lot.id);}
 for(const m of old.memories){if(!['journey','home'].includes(m.kind)||!m.sourceJourneyIds.some(id=>journeys.has(id))||s.memories.some(x=>x.key===m.key))continue;s.memories.push(m);}
 for(const e of old.outbox){if(!(e.type.startsWith('expedition.')||['inventory.grant_requested','home.object_created'].includes(e.type))||s.outbox.some(x=>x.id===e.id))continue;s.outbox.push(e);}
 if(!s.home.pet&&old.home.pet)s.home.pet=old.home.pet;
 if(!s.home.map&&old.home.map)s.home.map=old.home.map;
 s.home.recipe=s.home.recipe||old.home.recipe;
 s.seq=Math.max(s.seq,old.seq);s.explorationImports=[...imports,old.installationId];
 if(!E.validateState(s))throw Error('接续后的存档校验未通过，原数据保持原样。');
 return s;
}
root.SymiaExplorationTransfer={merge};if(typeof module!=='undefined')module.exports={merge};
})(typeof globalThis!=='undefined'?globalThis:this);
