/* Host-owned, version-pinned local episode. Prose cannot execute effects. */
(function(root){
'use strict';
const P=root.SymiaTravelPackages||(typeof require!=='undefined'&&require('./travel-packages.js'));
const D=P.get();
const forTrip=t=>P.resolve(t);
const scheduleFor=t=>forTrip(t)?.schedule;
const C=root.SymiaContent||(typeof require!=='undefined'&&require('./content.js'));
const copy=x=>JSON.parse(JSON.stringify(x));
const empty=()=>Object.fromEntries(Object.keys(C.ITEMS).map(k=>[k,0]));
const node=t=>forTrip(t)?.nodes[t.forge.index];
const time=n=>Number.isFinite(n)&&n>=0&&n<8e15;
// Version 1 remains fixed for saved journeys; reading or animations never move this clock.
const schedule=D.schedule;
const reading=t=>['solo-reading','together-reading'].includes(forTrip(t)?.mode);
const together=t=>forTrip(t)?.mode==='together-reading';
const stayReady=t=>!together(t)||node(t).id!=='t05'||['skipped','authored','completed'].includes(t.forge.stay?.status);
const cgAllowed=(t,id)=>!!t?.forge?.events.some(e=>e.nodeId===id)&&(!forTrip(t)?.presentation.moments[id]?.requiresStay||['active','authored','completed'].includes(t.forge.stay?.status));
function validStay(x){
 if(!x||!['active','skipped','authored','completed'].includes(x.status)||!Array.isArray(x.turns)||x.turns.length>6||typeof x.summary!=='string'||x.summary.length>600)return false;
 if(['skipped','authored'].includes(x.status))return !x.turns.length&&!x.summary;
 return x.turns.every(t=>typeof t.user==='string'&&t.user.length<=1000&&t.response&&['title','narration','summary'].every(k=>typeof t.response[k]==='string'&&t.response[k].length<=2000)&&typeof t.response.complete==='boolean'&&Array.isArray(t.response.dialogue)&&t.response.dialogue.length<=8&&t.response.dialogue.every(s=>typeof s==='string'&&s.length<=400)&&Array.isArray(t.response.choices)&&[0,3].includes(t.response.choices.length)&&t.response.choices.every(s=>typeof s==='string'&&s.length<=60));
}
function returnShare(t){const p=forTrip(t);if(!together(t))return p.returnShare;const x=t.forge.stay;return p.returnShare.replace('月池边的停留按你这次实际选择记录。',x?.status==='skipped'?'你们看见萤火虫后决定先回家。':x?.status==='authored'?'你们在月池边聊起陪伴与彼此的需要，又静静坐了一会儿。':x?.summary||'你们在月池边坐了一会儿，随后一起回家。');}
const managed=t=>!reading(t)&&!!scheduleFor(t)&&t?.forge?.timingVersion===scheduleFor(t).version;
function progress(t,now){
 const D=forTrip(t),schedule=scheduleFor(t);if(!D)return 0;
 if(t.phase!=='exploring')return 1;
 return managed(t)?Math.max(0,Math.min(.99,(now-t.startedAt)/schedule.durationMs)):t.forge.index/(D.nodes.length-1);
}
const completed=(s,id=D.id)=>s.history.some(t=>t.forge?.packetId===id);
const canStart=(s,id=D.id)=>P.available(id)&&(!s.trip||s.trip.phase==='complete')&&(!s.kitchen||s.kitchen.status==='completed')&&!completed(s,id);
function enterNode(s,t,at,h){
 const D=forTrip(t);
 t.forge.index++;t.forge.events.push({nodeId:node(t).id,at});
 if(node(t).id===D.rewardNode){t.forge.rewardEarned=true;t.loot[D.rewardId]=1;}
 h.emit(s,'expedition.episode_node',{journeyId:t.id,nodeId:node(t).id,packetId:D.id},at);
}
function returnHome(s,t,at,h){
 const D=forTrip(t);
 t.phase='returned';t.returnedAt=at;
 h.emit(s,'expedition.returned',{journeyId:t.id,participants:t.participants,items:t.loot,packetId:D.id},at);
}
function sync(s,now,h){
 const t=s.trip;
 if(!managed(t)||t.phase!=='exploring'||!validTrip(t))return;
 const D=forTrip(t),schedule=D.schedule;
 while(t.forge.index<D.nodes.length-1&&now>=t.startedAt+schedule.nodeOffsetsMs[t.forge.index+1]){
  enterNode(s,t,t.startedAt+schedule.nodeOffsetsMs[t.forge.index+1],h);
 }
 if(now>=t.startedAt+schedule.durationMs)returnHome(s,t,t.startedAt+schedule.durationMs,h);
}
function act(s,a,now,h){
 if(!a.type.startsWith('FORGE_'))return false;
 if(a.type==='FORGE_START'){
  const D=P.get(a.packetId),schedule=D?.schedule;
  if(!D||!canStart(s,D.id)||!time(now+schedule.durationMs))return true;
  s.tripCount++;
  const t={id:h.uid(s,'journey'),number:s.tripCount,participants:copy(D.participants),phase:'exploring',startedAt:now,returnedAt:null,claimedAt:null,
   nodes:C.NODES.map(()=>({visited:false,inspected:false,choice:null,automatic:false,resolvedAt:null})),loot:empty(),
   forge:{packetId:D.id,version:D.version,sourceSha256:D.sourceSha256,packageSha256:D.packageSha256,...(['solo-reading','together-reading'].includes(D.mode)?{}:{timingVersion:schedule.version}),...(D.mode==='together-reading'?{userPresent:true}:{}),index:0,events:[{nodeId:D.nodes[0].id,at:now}],rewardEarned:false}};
  s.trip=t;
  h.emit(s,'expedition.started',{journeyId:t.id,participants:t.participants,packetId:D.id,mode:D.mode==='together-reading'?'together':D.mode==='solo-reading'?'solo-fragments':'solo-managed'},now);
  h.emit(s,'expedition.episode_node',{journeyId:t.id,nodeId:node(t).id,packetId:D.id},now);
  return true;
 }
 const t=s.trip;
 if(!t?.forge||!validTrip(t)||a.journeyId!==t.id)return true;
 const D=forTrip(t);
 if(a.type==='FORGE_STAY'&&together(t)&&t.phase==='exploring'&&node(t).id==='t05'&&!t.forge.stay&&['active','skipped','authored'].includes(a.status)){
  t.forge.stay={status:a.status,turns:[],summary:''};h.emit(s,'expedition.together_stay',{journeyId:t.id,nodeId:'t05',status:a.status},now);return true;
 }
 if(a.type==='FORGE_STAY_SYNC'&&together(t)&&t.phase==='exploring'&&node(t).id==='t05'&&t.forge.stay?.status==='active'&&validStay(a.stay)&&['active','completed'].includes(a.stay.status)&&a.stay.turns.length>=t.forge.stay.turns.length){t.forge.stay=copy(a.stay);return true;}
 if(a.type==='FORGE_STAY_END'&&together(t)&&t.phase==='exploring'&&node(t).id==='t05'&&t.forge.stay?.status==='active'){
  t.forge.stay.status='completed';t.forge.stay.summary='你们在月池边停留了一会儿，随后决定一起回家。';return true;
 }
 // Pre-timing saves keep their original manual path; managed trips only move in sync.
 if(a.type==='FORGE_ADVANCE'&&!managed(t)&&stayReady(t)&&t.phase==='exploring'&&a.expectedNode===node(t).id&&t.forge.index<D.nodes.length-1&&now>=t.forge.events.at(-1).at){
  enterNode(s,t,now,h);
 }else if(a.type==='FORGE_RETURN'&&!managed(t)&&t.phase==='exploring'&&a.expectedNode===node(t).id&&t.forge.index===D.nodes.length-1&&now>=t.forge.events.at(-1).at){
  returnHome(s,t,now,h);
 }else if(a.type==='FORGE_CLAIM'&&t.phase==='returned'&&now>=t.returnedAt){
  // Exactly one item, decided by this host binding, never by packet text or click payload.
  if(D.rewardId)h.addLot(s,D.rewardId,D.rewardQuantity,[t.id],t.participants,now);
  t.phase='complete';t.claimedAt=now;s.history.unshift(copy(t));
  h.remember(s,t.id+':forge-return',D.title,returnShare(t),t.participants,[t.id],now,'journey');
  if(D.rewardId)h.emit(s,'inventory.grant_requested',{journeyId:t.id,items:{[D.rewardId]:D.rewardQuantity},idempotencyKey:t.id+':forge-reward'},now);
 }
 return true;
}
function validTrip(t){
 const f=t?.forge,D=forTrip(t),schedule=D?.schedule;
 if(!D)return false;
 if(!f||f.packetId!==D.id||f.version!==D.version||f.sourceSha256!==D.sourceSha256||!Number.isInteger(f.index)||f.index<0||f.index>=D.nodes.length)return false;
 if(typeof t.id!=='string'||!t.id||t.id.length>160||!Number.isSafeInteger(t.number)||t.number<1||!time(t.startedAt))return false;
 if(reading(t)&&f.timingVersion!==undefined)return false;
 if(together(t)){
  if(f.userPresent!==true||f.stay!==undefined&&(f.index<4||!validStay(f.stay))||f.index>4&&!stayReady({...t,forge:{...f,index:4}}))return false;
 }else if(f.stay!==undefined||f.userPresent!==undefined)return false;
 if(f.timingVersion!==undefined&&f.timingVersion!==schedule.version)return false;
 if(managed(t)&&!time(t.startedAt+schedule.durationMs))return false;
 if(JSON.stringify(t.participants)!=='["potion-maker"]'||!['exploring','returned','complete'].includes(t.phase)||['slice','auto','story','pacing','battle'].some(k=>t[k]!==undefined))return false;
 if(!Array.isArray(f.events)||f.events.length!==f.index+1||!f.events.every((e,i)=>e.nodeId===D.nodes[i].id&&time(e.at)&&e.at>=(i?f.events[i-1].at:t.startedAt)&&(!managed(t)||e.at===t.startedAt+schedule.nodeOffsetsMs[i])))return false;
 const earned=!!D.rewardId&&f.index>=D.nodes.findIndex(n=>n.id===D.rewardNode);
 if(f.rewardEarned!==earned||!t.loot||Object.keys(t.loot).length!==Object.keys(C.ITEMS).length||!Object.keys(C.ITEMS).every(k=>t.loot[k]===(k===D.rewardId&&earned?1:0)))return false;
 if(!Array.isArray(t.nodes)||t.nodes.length!==3||!t.nodes.every(n=>n.visited===false&&n.inspected===false&&n.choice===null&&n.automatic===false&&n.resolvedAt===null))return false;
 if(t.phase==='exploring')return t.returnedAt===null&&t.claimedAt===null;
 return f.index===D.nodes.length-1&&time(t.returnedAt)&&t.returnedAt>=f.events.at(-1).at&&(!managed(t)||t.returnedAt===t.startedAt+schedule.durationMs)&&(t.phase==='returned'?t.claimedAt===null:time(t.claimedAt)&&t.claimedAt>=t.returnedAt);
}
function validState(s){
 const histories=s.history.filter(t=>t.forge);
 if(new Set(histories.map(t=>t.id)).size!==histories.length||new Set(histories.map(t=>t.forge.packetId)).size!==histories.length)return false;
 for(const t of [s.trip,...histories].filter(t=>t?.forge)){
  if(!validTrip(t))return false;
  const D=forTrip(t),lots=s.lots.filter(l=>l.item===D.rewardId&&l.sourceJourneyIds.includes(t.id));
  if(t.phase==='complete'){
   if(D.rewardId?(lots.length!==1||lots[0].qty!==D.rewardQuantity||JSON.stringify(lots[0].participants)!==JSON.stringify(D.participants)||JSON.stringify(lots[0].sourceJourneyIds)!==JSON.stringify([t.id])):lots.length)return false;
   if(s.memories.filter(m=>m.key===t.id+':forge-return').length!==1||histories.filter(x=>x.id===t.id).length!==1)return false;
  }else if(lots.length||histories.some(x=>x.id===t.id))return false;
 }
 if(s.trip?.forge&&s.trip.phase==='complete'&&JSON.stringify(s.trip)!==JSON.stringify(histories.find(t=>t.id===s.trip.id)))return false;
 const rewardIds=new Set(P.list().map(p=>p.rewardId));
 return s.lots.filter(l=>rewardIds.has(l.item)).every(l=>histories.some(t=>t.id===l.sourceJourneyIds[0]&&forTrip(t).rewardId===l.item));
}
const api={data:D,packages:P,forTrip,scheduleFor,node,schedule,managed,together,stayReady,cgAllowed,returnShare,progress,completed,canStart,sync,act,validTrip,validState};
root.SymiaForge=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
