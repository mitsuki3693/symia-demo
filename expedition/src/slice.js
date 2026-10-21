/* V1 vertical slice: finite authored routes, generated local problems, committed facts. */
(function(root){
'use strict';
const C=root.SymiaContent||(typeof require!=='undefined'&&require('./content.js'));
const X=root.SymiaExpeditionText||(typeof require!=='undefined'&&require('./expedition-text.js'));
const L=root.SymiaLantern||(typeof require!=='undefined'&&require('./lantern-story.js'));
const copy=x=>JSON.parse(JSON.stringify(x));
const NAMES={'potion-maker':'希莱斯',fionn:'菲恩'};
const POINTS={entrance:[155,459],salt:[275,403],greenhouse:[347,471],marks:[344,274],guardian:[430,300],device:[485,302],mill:[485,302],inn:[720,220],pool:[692,366]};
// Shared cubic geometry: the trail and the travelling characters use the same curve.
const TRAILS={
 'mill:salt':[[427,365],[319,354]],
 'mill:marks':[[449,248],[390,241]],
 'mill:device':[[485,302],[485,302]],
 'mill:pool':[[546,289],[630,335]],
 'pool:mill':[[630,335],[546,289]],
 'entrance:salt':[[180,420],[238,405]],
 'salt:greenhouse':[[310,406],[308,457]],
 'greenhouse:mill':[[428,492],[449,375]],
 'entrance:marks':[[212,361],[276,330]],
 'marks:guardian':[[373,258],[391,297]],
 'guardian:device':[[449,303],[464,302]],
 'guardian:mill':[[449,303],[464,302]]
};
const trips=s=>[s.trip,...s.history].filter((t,i,a)=>t?.slice&&a.findIndex(x=>x?.id===t.id)===i);
function arrivedLocation(r){return Object.hasOwn(POINTS,r.location)?r.location:Object.keys(TITLES).find(k=>[TITLES[k],OLD_TITLES[k]].some(title=>r.text.includes('抵达'+title+'。')));}
function exploredTrails(s){const found=new Set();for(const t of trips(s)){let from='entrance';for(const r of t.slice.records){if(r.kind!=='arrived')continue;const to=arrivedLocation(r);if(!to)continue;const id=from+':'+to;if(TRAILS[id]||t.slice.storyVersion)found.add(id);from=to;}}return [...found];}
function trailPath(id){const [from,to]=id.split(':'),c=TRAILS[id];if(!c)return '';return `M${POINTS[from].join(' ')} C${c[0].join(' ')} ${c[1].join(' ')} ${POINTS[to].join(' ')}`;}
function trailPoint(from,to,k){const a=POINTS[from],b=POINTS[to],c=TRAILS[from+':'+to];if(!c)return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];const u=1-k;return [0,1].map(i=>u*u*u*a[i]+3*u*u*k*c[0][i]+3*u*k*k*c[1][i]+k*k*k*b[i]);}
const TITLES={...X.TITLES,inn:'高处的旧旅店',pool:'月池岸边'},ACTIONS=X.ACTIONS;
// Old names only decode historical arrival records; player-facing names come from X.
const OLD_TITLES={entrance:'灰月湿地入口',salt:'浅渠的盐痕',greenhouse:'淹水温室',marks:'石阶上的旧标记',guardian:'风车前的守卫',device:'设备间与外渠',mill:'旧风车'};
const CONTRACTS={plant:{actions:['inspect_water','inspect_roots','brace_frame','clear_channel'],terminal:'clear_channel',required:'inspect_water',objects:X.OBJECTS.plant},revisit:{actions:['check_level','inspect_roots','record_recovery'],terminal:'record_recovery',required:'check_level',objects:X.OBJECTS.revisit},inside:{actions:['compare_marks','trace_feed','record_device'],terminal:'record_device',required:'compare_marks',objects:X.OBJECTS.inside},outside:{actions:['trace_outlet','compare_marks','record_outlet'],terminal:'record_outlet',required:'trace_outlet',objects:X.OBJECTS.outside}};
const INITIAL={version:1,greenhouse:'waterlogged',guardian:'active',evidence:[],discovered:[],rewardClaims:[],bookmarks:[],moods:{}};
const world=s=>s.marsh||INITIAL;
function chapter(s){return world(s).chapter||{repaired:false,verified:false,completed:false};}
function chapterProgress(s){if(L.state(s))return L.progress(s);const w=world(s),c=chapter(s);return [{label:'温室排水',done:w.greenhouse!=='waterlogged'},{label:'遗迹调查',done:w.evidence.includes('device')},{label:world(s).evidence.includes('device')?'修复挡水装置':'汇合调查线索',done:c.repaired},{label:'回访验证',done:c.verified},{label:'月池结局',done:c.completed}];}
function bookmarks(s){const w=world(s);return w.bookmarks||(w.bookmark?[w.bookmark]:[]);}
function ensure(s){if(!s.marsh)s.marsh=copy(INITIAL);if(!s.marsh.chapter)s.marsh.chapter={repaired:false,verified:false,completed:false};if(!s.marsh.bookmarks){s.marsh.bookmarks=copy(bookmarks(s));delete s.marsh.bookmark;}return s.marsh;}
const active=s=>!!s.trip?.slice;
const key=t=>`${t.id}:${t.slice.stage}:${t.slice.revision}`;
function location(t){const q=t?.slice;if(!q)return 'entrance';return q.location||'entrance';}
function eventKind(s){const q=s.trip.slice;return q.route==='plant'?(world(s).greenhouse==='waterlogged'?'plant':'revisit'):(q.access==='inside'?'inside':'outside');}
function fact(s,id){if(!world(s).evidence.includes(id))s.marsh.evidence.push(id);}
function record(s,now,id,text,lines=[],extra={}){const q=s.trip.slice;const item={id:`${s.trip.id}:entry:${q.records.length}`,kind:id,text,lines:lines.filter(l=>s.trip.participants.includes(l[0])),at:now,...extra};q.records.push(item);q.revision++;return item;}
function go(s,stage,loc,now){const q=s.trip.slice;q.travel={from:location(s.trip),to:loc,stage,startedAt:now,arrivesAt:now+2200};q.stage='travel';q.revision++;}
function arrive(s,now){const q=s.trip?.slice;if(!q?.travel||now<q.travel.arrivesAt)return;const a=q.travel;q.stage=a.stage;q.location=a.to;s.trip.nodes[['guardian','device','mill'].includes(a.to)?1:0].visited=true;q.travel=null;q.revision++;if(!s.marsh.discovered.includes(a.to))s.marsh.discovered.push(a.to);const x=scene(s);record(s,now,'arrived',`${s.trip.participants.map(p=>NAMES[p]).join('和')}抵达${TITLES[a.to]}。${x.text}`,x.lines,{location:a.to});}
function mood(s,p,now){const m=world(s).moods[p];return m?{...m,label:now>=m.until?'平静':m.label}:null;}
function knowledge(s){const w=world(s),k=X.knowledge(w);k.interior=k.device||trips(s).some(t=>t.slice.access==='inside'&&(t.slice.location==='device'||t.slice.records.some(r=>r.kind==='arrived'&&arrivedLocation(r)==='device')));return k;}
function pending(s){return tasks(s).filter(t=>!t.done).map(({id,label,route})=>({id,label,route}));}
function tasks(s){if(L.state(s))return L.tasks(s);const w=world(s),k=knowledge(s),entries=trips(s).flatMap(t=>t.slice.records.map(r=>({record:r,journeyId:t.id,number:t.number}))).sort((a,b)=>a.record.at-b.record.at);
 const definitions=[['greenhouse',k.greenhouse?'清理温室的排水口':'去温室看看','plant',w.greenhouse!=='waterlogged','clear_channel',k.greenhouse?'让薄荷的根离开积水。':'走近温室，看看里面种着什么。'],['recovery','回温室看看薄荷恢复得怎样','plant',w.greenhouse==='recovering','record_recovery','看看上次排水后留下的变化。'],['device',k.interior?'调查风车遗迹处的挡水装置':'探访风车遗迹处','ruins',w.evidence.includes('device'),'record_device',k.interior?'看看挡水装置有没有损坏，记下水往哪里流。':k.marks?'看看石阶上的旧水印与遗迹内部有没有关系。':'沿小路走近风车遗迹处，看看那里有什么。']];
 if(k.device)definitions.push(['sluice','排除挡水装置的卡点','ruins',chapter(s).repaired,'repair_sluice','先排出温室积水，再检查转轴卡点。']);if(chapter(s).repaired)definitions.push(['ending','回访验证，并在月池完成这一章','plant',chapter(s).completed,'finish_chapter','回温室核对实际水流变化，然后沿风车后的路走到月池。']);
 return definitions.filter(x=>x[0]!=='recovery'||w.greenhouse!=='waterlogged').map(([id,label,route,done,action,description])=>{const proof=done?entries.find(x=>x.record.action===action):null;return {id,label,route,done,description,proof:proof?{at:proof.record.at,journeyId:proof.journeyId,number:proof.number,text:proof.record.text}:null};});}
function updateBookmark(s){for(const b of bookmarks(s)){const task=tasks(s).find(x=>x.id===b.target);if(task){b.done=task.done;b.label=task.label;}}}
function sync(s,now){if(!s.marsh&&!active(s))return;ensure(s);if(active(s)&&s.trip.phase==='exploring')arrive(s,now);for(const m of Object.values(s.marsh.moods))if(now>=m.until)m.label='平静';updateBookmark(s);}
function validLines(lines,ps){return Array.isArray(lines)&&lines.length<=6&&lines.every(l=>Array.isArray(l)&&l.length===2&&ps.includes(l[0])&&typeof l[1]==='string'&&l[1].length>0&&l[1].length<=900);}
function validPlan(p,kind,ps,legacy=false){const c=CONTRACTS[kind],str=(x,n)=>typeof x==='string'&&x.trim().length>0&&x.length<=n;return !!c&&p&&Object.keys(p).every(k=>['title','conflict','steps','lines'].includes(k))&&str(p.title,80)&&str(p.conflict,600)&&Array.isArray(p.steps)&&p.steps.length>=2&&p.steps.length<=4&&new Set(p.steps.map(x=>x.action)).size===p.steps.length&&p.steps.every(x=>x&&Object.keys(x).every(k=>['action','actor','detail'].includes(k))&&c.actions.includes(x.action)&&ps.includes(x.actor)&&str(x.detail,220))&&p.steps.at(-1).action===c.terminal&&p.steps.slice(0,-1).some(x=>x.action===c.required)&&validLines(p.lines,ps)&&(legacy||p.steps.every(x=>X.actorsFor(x.action,ps).includes(x.actor)));}
function fallback(kind,ps){return X.plan(kind,ps);}
// Historical journals stay verbatim. Only unperformed specialist work is reassigned.
function displayEvent(t){const q=t.slice,p=q.event;if(!p)return p;const fresh=fallback(q.eventKind,t.participants),repair=p.steps.slice(q.step).some(x=>!X.actorsFor(x.action,t.participants).includes(x.actor));if(q.source!=='prepared'&&!repair)return p;return {...p,title:repair?p.title:fresh.title,conflict:repair?'希莱斯在薄荷旁蹲下，准备亲自检查根部。菲恩留意周围需要帮忙的地方；查看积水、扶稳架子和记录发现，都可以商量着分工。':fresh.conflict,lines:repair?[['potion-maker','根部我来检查。你帮我看看周围，别碰着薄荷。']]:fresh.lines,steps:p.steps.map((step,i)=>({...step,actor:i>=q.step&&!X.actorsFor(step.action,t.participants).includes(step.actor)?'potion-maker':step.actor,detail:fresh.steps.find(x=>x.action===step.action)?.detail||step.detail}))};}
function choices(s){const t=s.trip,q=t?.slice;if(!q||t.phase!=='exploring'||q.stage==='travel')return [];if(L.active(s))return L.choices(s);switch(q.stage){
case 'entrance':return [{id:'plant',label:knowledge(s).greenhouse?'去温室看看积水':'去温室看看',hint:knowledge(s).greenhouse?'看看薄荷的情况':'左边的小路通向玻璃屋顶'},{id:'ruins',label:'去风车遗迹处调查',hint:knowledge(s).guardian?'遗迹调查 · 入口有守卫':'右边的小路通向停转的风车'}];
case 'salt':return [{id:'follow',label:'沿着小沟走进温室',hint:'看看薄荷还好不好、水为什么排不出去'}];
case 'marks':return [{id:'approach',label:'走到风车遗迹处的入口',hint:'看看能不能进门，查查里面有什么'}];
case 'guardian':return world(s).guardian==='calmed'?[{id:'open_gate',label:'从已开放的入口进去',hint:'守卫已经安静，无需再战斗'}]:[];
case 'battle_result':return [{id:'investigate',label:q.access==='inside'?'走进风车遗迹处看看':'沿风车遗迹处外面的水沟调查',hint:q.access==='inside'?'沿门内的水声，看看里面有什么':'先查外面的水流，入口里面留待下次'}];
case 'event':if(!q.event)return [];return [{id:'step',label:ACTIONS[q.event.steps[q.step].action],hint:`${NAMES[displayEvent(t).steps[q.step].actor]}：${displayEvent(t).steps[q.step].detail}`},{id:'defer',label:'先记下这里，暂缓处理',hint:'把已经看见的情况记下来，下次再查'}];
case 'event_result':return q.route==='plant'&&['drained','recovering'].includes(q.outcome)&&!world(s).rewardClaims.includes('greenhouse-seeds')?[{id:'collect',label:'收下成熟种子 ×2',hint:'荧光薄荷种子 · 可以在现有花园播种'},{id:'leave',label:'种子留在这里',hint:'下次仍可来采集'}]:[{id:'continue',label:'在风车遗迹处收好记录',hint:'没有完成的调查可以下次继续'}];
case 'moth':return [{id:'help_moth',label:'帮小灯蛾离开积水',hint:'把它放到干燥处，等翅膀晾干'},{id:'leave_moth',label:'让它留在湿地',hint:'记住它的位置，这次不带新伙伴回家'}];
case 'repair':return [{id:'repair_sluice',label:'一起排除卡点，试着调节水流',hint:'先固定挡水板，再清走卡住转轴的碎枝'}];
case 'repair_result':return [{id:'continue',label:'收好修复记录',hint:'还要回温室验证水流的变化'}];
case 'finale':return [{id:'finish_chapter',label:'收好这张湿地手记',hint:'完成灰月湿地章节，开启下一个世界的预设'}];
case 'chapter_end':return [{id:'return',label:'带着湿地的故事回家',hint:'整理行囊后，可以出发去下一个世界'}];
case 'mill':{const c=chapter(s),next=[];
 if(!c.completed){if(waterlogged(s)||!world(s).evidence.includes('device'))next.push({id:waterlogged(s)?'continue_plant':'continue_ruins',label:waterlogged(s)?'继续去温室处理积水':'继续去风车遗迹处调查',hint:'沿另一条路接着走，也可以先回家'});
 else if(!c.repaired)next.push({id:'repair',label:'回到挡水装置前，检查卡点',hint:'两条调查记录已经齐全'});
 else if(!c.verified)next.push({id:'verify',label:'回温室验证修复后的变化',hint:'调过水流后，再亲眼看一次'});
 else next.push({id:'finale',label:'沿着水路，去月池收尾',hint:'在那里收好这一章的记录'});}
 return [...next,{id:'return',label:'带着这次经历回家',hint:'保存故事，整理行囊'}];} 
default:return [];}}
function waterlogged(s){return world(s).greenhouse==='waterlogged';}
function setPlan(s,plan,source,now){const q=s.trip.slice,kind=eventKind(s);if(!validPlan(plan,kind,s.trip.participants))return false;q.event=copy(plan);q.eventKind=kind;q.source=source;q.step=0;q.error='';record(s,now,'encounter',plan.conflict,plan.lines,{title:plan.title,source});return true;}
function result(s,now,outcome,text){const q=s.trip.slice;q.outcome=outcome;q.stage='event_result';record(s,now,'result',s.trip.participants.length===1?text.replaceAll('他们','希莱斯').replaceAll('两人','希莱斯'):text);updateBookmark(s);}
function performStep(s,now){const t=s.trip,q=t.slice,w=world(s);if(q.stage!=='event'||!q.event||q.step>=q.event.steps.length)return;const step=displayEvent(t).steps[q.step++],finding=X.observation(q.eventKind,step.action,step.actor,t.participants);record(s,now,'action',finding.text,finding.lines,{action:step.action,actor:step.actor});
 if(step.action==='clear_channel'){w.greenhouse='drained';fact(s,'channel');result(s,now,'drained',X.RESULTS.drained);}
 else if(step.action==='record_recovery'){w.greenhouse='recovering';if(chapter(s).repaired){w.chapter.verified=true;record(s,now,'action','他们沿小沟重新核对：温室入口的水流变缓，排水口仍畅通，根旁没有新增积水。挡水板已经能控制来水，清理沟口解决了排水；两件事都有各自的作用。薄荷旧叶的白边还在，不能把它当成已经恢复。',[],{action:'verify_flow'});}result(s,now,'recovering',X.RESULTS.recovering);}
 else if(step.action==='record_device'){fact(s,'device');result(s,now,'device',X.RESULTS.device);}
 else if(step.action==='record_outlet'){fact(s,'outlet');result(s,now,'outlet',X.RESULTS.outlet);}
}
function finishEvent(s,now){const q=s.trip.slice;while(q.stage==='event'&&q.event&&q.step<q.event.steps.length)performStep(s,now);}
function eventStory(t){const records=t.slice.records;const start=records.findLastIndex(r=>r.kind==='encounter');return records.slice(Math.max(0,start)).filter(r=>['encounter','action','result'].includes(r.kind));}
function homeImpact(s,now){const journeys=trips(s).filter(t=>t.phase==='complete'),ids=journeys.map(t=>t.id),fromTrip=ls=>ls.filter(l=>l.sourceJourneyIds?.some(id=>ids.includes(id)));return {version:1,journeys:journeys.map(t=>({id:t.id,number:t.number,participants:[...t.participants]})),seeds:fromTrip(s.lots.filter(l=>l.item==='glow_mint_seed'&&l.qty>0)).map(l=>({quantity:l.qty,sourceJourneyIds:[...l.sourceJourneyIds]})),plants:(s.garden?.plots||[]).flatMap((p,index)=>p?.sources.some(id=>ids.includes(id))?[{id:p.id,index,crop:p.crop,stage:p.displayStage||'刚播种',sourceJourneyIds:[...p.sources]}]:[]),harvest:fromTrip(s.lots.filter(l=>l.item==='glow_mint'&&l.qty>0)).map(l=>({quantity:l.qty,sourceJourneyIds:[...l.sourceJourneyIds]})),pet:s.home.pet?{objectId:'marsh-lantern-moth',slotId:'window-perch',sourceJourneyId:s.home.pet.journeyId,participants:[...s.home.pet.participants],greeted:s.home.pet.greeted}:null,moods:Object.fromEntries(['potion-maker','fionn'].map(p=>[p,mood(s,p,now)]))};}
function returnHome(s,now){const t=s.trip,q=t.slice;if(t.phase!=='exploring')return;t.phase='returned';t.returnedAt=now;q.travel=null;q.stage='returned';const entry=record(s,now,'return',`${t.participants.map(p=>NAMES[p]).join('和')}收好行囊返回家园。`);const w=ensure(s);q.pending=pending(s);for(const p of t.participants){const success=q.route==='plant'?['drained','recovering'].includes(q.outcome):q.outcome==='device';const upset=p==='fionn'&&['retreated','defeated'].includes(t.battle?.status);w.moods[p]={label:upset?'懊恼':success?'开心':'平静',reason:upset?'守卫仍拦着风车遗迹处的入口，这次没能进去调查。':success?(q.route==='plant'?'看见温室的水退下去，薄荷的根不再一直泡着。':'在风车遗迹处找到了通往温室的水槽，也记下了装置可能卡住的位置。'):'这次先记下了线索，还有一部分调查没做完。',eventId:entry.id,journeyId:t.id,until:now+15*60000};}}
function afterBattle(s,now){const t=s.trip,q=t?.slice;if(!q||q.stage!=='guardian'||!t.battle||t.battle.status==='active')return;q.access=t.battle.status==='victory'?'inside':'outside';q.stage='battle_result';if(t.battle.status==='victory'){s.marsh.guardian='calmed';if(!s.marsh.rewardClaims.includes('guardian-salt'))s.marsh.rewardClaims.push('guardian-salt');}record(s,now,'battle',t.battle.status==='victory'?'守卫垂下手臂，让出了风车遗迹处的入口。他们可以进去看看门内的水声从哪里传来了。队伍获得银露盐晶 ×2。':t.battle.status==='avoided'?'他们绕开守卫，来到风车遗迹处外面的水沟旁。入口还被守着，还没看清里面有什么。':'他们退到风车遗迹处外面的水沟旁。守卫没有追来，行囊和已经记下的发现都还在；门内的调查只能留到下次了。',[],{battle:copy(t.battle)});}
function act(s,a,now,h){
 if(!a.type.startsWith('SLICE_'))return false;
 const w=ensure(s);let t=s.trip,q=t?.slice;
 if(a.type==='SLICE_START'){if(s.atlas)s.atlas.selected='eiros';if(t&&t.phase!=='complete'||s.kitchen&&s.kitchen.status!=='completed')return true;s.tripCount++;t=s.trip={id:h.uid(s,'journey'),number:s.tripCount,participants:h.members(a.story?true:s.party.fionn),phase:'exploring',startedAt:now,returnedAt:null,claimedAt:null,loot:Object.fromEntries(Object.keys(C.ITEMS).map(k=>[k,0])),nodes:C.NODES.map((_,i)=>({visited:i===0,inspected:false,choice:null,automatic:false,resolvedAt:null})),slice:{version:1,route:null,stage:'entrance',location:'entrance',travel:null,revision:0,event:null,eventKind:null,source:null,step:0,outcome:null,access:null,error:'',records:[],turns:[],pending:[],worldBefore:copy(w)}};if(a.story){L.start(s,now,{record});return true;}record(s,now,'departure',`${t.participants.map(p=>NAMES[p]).join('和')}从家园出发，来到灰月湿地入口。`,X.departure(w));return true;}
 if(a.type==='SLICE_BOOKMARK'){if(a.remove){w.bookmarks=w.bookmarks.filter(b=>b.target!==a.target);return true;}const target=tasks(s).find(x=>x.id===a.target);if(target&&!w.bookmarks.some(b=>b.target===target.id))w.bookmarks.push({target:target.id,label:target.label,route:target.route,journeyId:t?.id||null,done:target.done});if(a.target==='clear')w.bookmarks=[];return true;}
 if(a.type==='SLICE_COMFORT'){const m=w.moods[a.actor];if(m&&now<m.until&&!m.comforted){m.until=Math.min(m.until,now+60000);m.comforted=true;}return true;}
 if(!q)return true;
 if(a.type==='SLICE_CLAIM'){if(t.phase!=='returned')return true;if(s.home.pet)t.loot.marsh_pet=0;for(const [item,qty]of Object.entries(t.loot))h.addLot(s,item,qty,[t.id],t.participants,now);if(t.loot.marsh_pet&&!s.home.pet){s.home.pet={journeyId:t.id,participants:[...t.participants],greeted:false};h.emit(s,'home.object_created',{objectId:'marsh-lantern-moth',slotId:'window-perch',sourceJourneyId:t.id,idempotencyKey:'home:marsh-lantern-moth'},now);record(s,now,'home','小灯蛾从行囊上飞起来，在窗边的干燥叶片上落下。这里多了一位从湿地跟回来的住客。');}if(L.active(s)&&L.state(s).finished&&q.storyNode==='window')record(s,now,'home','你把折了两次的种子袋放在窗台，留待亲手播种。菲恩把湿地地图贴在旁边；第七盏灯有了名字，叫灯屋。'+(s.home.pet?.journeyId===t.id?'小灯蛾落在那个黄色的小点上。菲恩伸出去想扶正地图的手，又轻轻收了回来。':''));t.phase='complete';t.claimedAt=now;record(s,now,'unpack',Object.entries(t.loot).filter(([,n])=>n).map(([id,n])=>`${C.ITEMS[id].name} ×${n}`).join('、')||'这一趟没有带走材料，调查记录已收好。');s.history.unshift(copy(t));h.remember(s,t.id+':slice',q.storyVersion?'第七盏灯 · 灰月湿地':'雨后的盐痕 · '+(q.route==='plant'?'植物调查':'遗迹调查'),summary(t),t.participants,[t.id],now,'journey');h.emit(s,'expedition.slice_claimed',{journeyId:t.id,items:t.loot},now);return true;}
 if(a.type==='SLICE_CHAT'){if(t.phase!=='exploring'||q.stage==='travel'||q.turns.length>=500||a.key!==key(t)||!validLines(a.lines,t.participants)||typeof a.narration!=='string'||a.narration.length>1200||typeof a.user!=='string'||a.user.length>500)return true;const turn={user:a.user,narration:a.narration,lines:copy(a.lines),at:now};q.turns.push(turn);record(s,now,'dialogue',a.narration,a.lines,{user:a.user});return true;}
 if(t.phase!=='exploring'||q.stage==='travel'||t.battle?.status==='active')return true;
 if(a.type==='SLICE_RETURN'){returnHome(s,now);return true;}
 if(a.type==='SLICE_PLAN'){if(a.key===key(t)&&q.stage==='event'&&!q.event&&setPlan(s,a.plan,'api',now)&&a.complete===true)finishEvent(s,now);return true;}
 if(a.type==='SLICE_PLAN_ERROR'){if(a.key===key(t)&&q.stage==='event'&&!q.event)q.error='这次创作没有完成。可以重试，或选择预备事件继续。';return true;}
 if(a.type==='SLICE_FALLBACK'){if(q.stage==='event'&&!q.event&&setPlan(s,fallback(eventKind(s),t.participants),'prepared',now)&&a.complete===true)finishEvent(s,now);return true;}
 if(a.type==='SLICE_FINISH_EVENT'){if(a.key===key(t)&&q.stage==='event')finishEvent(s,now);return true;}
 if(a.type==='SLICE_STORY'){if(a.key===key(t)&&q.stage==='event_result'&&!q.story&&typeof a.text==='string'&&a.text.trim()&&a.text.length<=1200&&validLines(a.lines,t.participants)){q.story={text:a.text,lines:copy(a.lines)};record(s,now,'story',a.text,a.lines,{source:'api',title:q.event?.title||'这一段经历'});}return true;}
 if(L.active(s)&&L.act(s,a,now,{record,go,key,returnHome}))return true;
 if(a.type!=='SLICE_CHOOSE'||a.key!==key(t)||!choices(s).some(c=>c.id===a.choice))return true;
 const id=a.choice,stage=q.stage;if(a.actor&&(!t.participants.includes(a.actor)||typeof a.reason!=='string'||!a.reason.trim()||a.reason.length>350))return true;
 record(s,now,'decision',a.actor?`${NAMES[a.actor]}受托决定：${a.reason}`:`${t.participants.map(p=>NAMES[p]).join('和')}按玩家的选择，决定${choices(s).find(c=>c.id===id).label}。`,[],{choice:id,actor:a.actor||'user',known:[...w.evidence]});
 if(stage==='entrance'){q.route=id;go(s,id==='plant'?'salt':'marks',id==='plant'?'salt':'marks',now);}
 else if(stage==='salt'){fact(s,'salt');go(s,'event','greenhouse',now);}
 else if(stage==='marks'){fact(s,'old_marks');t.nodes[1].visited=true;go(s,'guardian','guardian',now);}
 else if(stage==='guardian'){q.access='inside';record(s,now,'open_gate','守卫仍安静地靠在门边。上次让出的入口没有关上，他们从这里走进风车遗迹处。');go(s,chapter(s).repaired?'repair_result':'event','device',now);}
 else if(stage==='battle_result')go(s,'event','device',now);
 else if(stage==='event'){
  if(id==='defer')result(s,now,'deferred',X.RESULTS.deferred);
  else performStep(s,now);
 }else if(stage==='event_result'){if(id==='collect'){t.loot.glow_mint_seed+=2;w.rewardClaims.push('greenhouse-seeds');record(s,now,'reward','希莱斯收起两粒成熟的荧光薄荷种子，放进本次行囊。');}go(s,!s.home.pet&&!w.rewardClaims.includes('marsh-moth')?'moth':'mill','mill',now);}
 else if(stage==='moth'){if(id==='help_moth'&&!s.home.pet&&!w.rewardClaims.includes('marsh-moth')){t.loot.marsh_pet=1;w.rewardClaims.push('marsh-moth');record(s,now,'reward','希莱斯把一片干叶递到水边，小灯蛾慢慢爬了上来。晾干翅膀后，它绕了一圈，落到行囊上不肯走。队伍带上这位自愿跟随的小伙伴，准备回家。',[['potion-maker','翅膀干了。你想跟我们走？那就先在这里歇着。'],['fionn','行囊顶上留给你。我走慢点，别掉下去。']]);}else record(s,now,'moth','他们记下了小灯蛾停留的位置，没有把它带走。湿地的草叶间，还有别的小灯蛾正在飞。');q.stage='mill';q.revision++;}
 else if(stage==='repair'){
 w.chapter.repaired=true;
 record(s,now,'action','希莱斯扶稳挡水板，菲恩从干燥的检修侧查看转轴。支架与转轴之间卡着几截碎枝；两人先卸去挡水板的压力，再把碎枝逐段取出。菲恩轻推把手，这次转轴顺着支架转动了，水流也随挡水板抬落而改变。他们把挡水板停在较低的开口，保留细流，没有把沟截干。',[['fionn','这次能动了。你看，放低一点，流过去的水就少一点。'],['potion-maker','先留在这里。我们回温室看看，不能只听这边的水声就说全好了。']],{action:'repair_sluice'});
 q.stage='repair_result';q.revision++;updateBookmark(s);
 }else if(stage==='repair_result'){q.stage='mill';q.revision++;}
 else if(stage==='finale'){
 w.chapter.completed=true;
 record(s,now,'result','灰月湿地 · 雨后的盐痕，章节完成。温室排水口已经清开，挡水装置能调节来水，修复后的回访也确认没有新增积水。旧水印只是过去的水位记录，叶尖的白边仍需观察，不能推断所有异常都由同一原因造成。月池边，他们把亲眼见过的变化画在同一张图上。这片湿地仍可以再来，而新的远行已经有了起点。',[['fionn','总算不是一张到处留白的图了。下回……去我那边看看？'],['potion-maker','好。这次你认路。我把今天的记录带回去。']],{action:'finish_chapter'});
 q.stage='chapter_end';q.revision++;updateBookmark(s);
 }else if(stage==='chapter_end')returnHome(s,now);
 else if(stage==='mill'){
 if(id==='return')returnHome(s,now);
 else if(id==='repair')go(s,'repair','device',now);
 else if(id==='finale')go(s,'finale','pool',now);
 else {q.route=id==='continue_ruins'?'ruins':'plant';q.event=null;q.eventKind=null;q.step=0;q.outcome=null;q.access=null;q.error='';delete q.story;delete t.battle;go(s,q.route==='plant'?'salt':'marks',q.route==='plant'?'salt':'marks',now);}
 }
 return true;
}
function summary(t){const q=t.slice;if(q.storyVersion&&!q.records.some(r=>r.kind==='result'||r.kind==='reward'))return q.storyNode==='visit'?'你们重访灯屋，守卫正在照看窗边的薄荷。这次没有重新采集。':'《第七盏灯》的旅途暂时停在这里。已经读到的故事与下一步选择都已保存，出发后可以接着走。';return q.records.filter(x=>['result','battle','reward'].includes(x.kind)).map(x=>x.text).join(' ')||'队伍记录了沿途的发现，尚未完成这次调查。';}
function scene(s){if(L.active(s))return L.scene(s);const t=s.trip,q=t.slice,w=world(s),p=displayEvent(t),last=q.records.findLast(r=>r.kind==='action'),all=lines=>lines.filter(l=>t.participants.includes(l[0]));const data={
repair:['把记录变成一次验证','温室排水口已经清开，风车里的水路也调查过了。他们回到挡水装置前，从干燥的检修侧查看：几截碎枝挤在转轴和支架之间，正好抵住了转动的位置。先扶稳挡水板、卸去压力，才有机会把碎枝取出。', [['fionn','现在能看清卡在哪里了。你扶一下，我先从这边试试。'],['potion-maker','慢一点。取出来后先小幅试动，再去温室核对。']]],
repair_result:['水流终于能调节了',q.records.findLast(r=>r.action==='repair_sluice')?.text||'挡水板保持着上次留下的较小开口，转轴已经不再卡住，细流沿石槽流向温室。他们检查后没有再次拆动装置。',q.records.findLast(r=>r.action==='repair_sluice')?.lines||[['potion-maker','上次调好的位置还在。我们再看看温室就好。']]],
finale:['月池边，合上这一章','绕过风车，水沟接入月池。两人沿着岸边回看手记：清开温室出口，排除转轴卡点，再回到温室验证。他们确认了自己做过的事，也把未能解释的旧水印与白色叶尖留在观察页，没有把猜测写成答案。风从草叶间穿过，今天终于可以安心回家了。',[['fionn','入口、温室、风车……这次路线接起来了。'],['potion-maker','薄荷还要慢慢养。下次来，我们就知道该看哪里。']]],
chapter_end:['灰月湿地 · 章节完成',q.records.findLast(r=>r.action==='finish_chapter')?.text||'',q.records.findLast(r=>r.action==='finish_chapter')?.lines||[]],
entrance:['雨后的盐痕',X.opening(w)+'入口的小路在这里分成两条：左边沿小沟通向温室，右边通向风车遗迹处。',X.departure(w)],
salt:['薄荷的叶尖变白了','沿着小沟往温室走，岸边的薄荷越来越密。几片叶子的尖端泛着白，水面上漂着碎枝。温室就在前面。'+(w.greenhouse==='waterlogged'?'种植床旁还能看见积水。':'上次清开的小沟还在流水。'),[['potion-maker',w.greenhouse==='waterlogged'?'叶尖都变白了，根也可能一直泡着。进去看看，还有没有办法帮它们。':'这些叶子还没完全恢复。进去看看，根边是不是还积着水。'],['fionn',w.evidence.includes('device')?'上次在风车遗迹处看到的水槽，就接着这条沟。看看水到温室以后往哪儿走。':'这条沟朝着风车遗迹处延伸。我先记住位置，等会儿也许用得上。']]],
marks:['水以前涨到过这里','风车遗迹处的石阶旁，有几道人工刻下的短线，是用来记录水有多高的。菲恩蹲下身，指向短线旁一条旧水印：水以前曾经淹到那里，现在的水面却低了不少。至于水为什么退下去，眼前还看不出来。',[['fionn','以前的水到过这一级台阶，现在低了这么多。风车遗迹处是不是有东西在控制水？我想进去看看。'],['potion-maker','有这个可能。不过雨停了，水也会退。先看看里面有什么，别急着认定原因。']]],
guardian:[w.guardian==='calmed'?'风车遗迹处的入口还开着':'守卫拦住了风车遗迹处的入口',w.guardian==='calmed'?'守卫还靠在门边，没有再次挡路。他们可以从上次让出的入口进去，继续向里调查。':'风车遗迹处的门边，一团覆着苔藓的石甲抬起了手臂，挡在他们面前。门内能听见水声，门外也有一条小沟。想进去调查，需要先应对守卫；也可以绕开它，先调查外面的水流。',[]],
battle_result:[q.access==='inside'?'可以走进风车遗迹处了':'先留在风车遗迹处外面',q.records.findLast(x=>x.kind==='battle')?.text||'',[]],
event:[p?.title||(eventKind(s)==='revisit'?'回温室看看薄荷':q.route==='plant'?'温室的水为什么排不出去':q.access==='inside'?'走进风车遗迹处，听见水声':'风车遗迹处外面也有一条水沟'),p&&q.step>0?last?.text||p.conflict:p?.conflict||(q.route==='plant'?(w.greenhouse==='waterlogged'?'薄荷的根还泡在水里，旁边排水的小沟却没怎么流动。希莱斯蹲下来，准备找找是哪里堵住了。':'上次清开的小沟还在流水。今天要看看温室的水退了没有，以及薄荷恢复得怎样。'):q.access==='inside'?'门内有一条让水流过的石槽，上面横着一块挡水板。抬起它，水就能通过；放下它，就能把水拦住。墙边的短线记录过水有多高，他们准备看看这套装置有没有损坏。':'守卫仍拦着风车遗迹处的入口。门内还没调查过，不过可以沿外面的水沟，看看水是不是往温室流。'),p&&q.step>0?last?.lines||[]:p?.lines||[]],
event_result:['这次查明了什么',q.records.findLast(x=>x.kind==='result')?.text||'',q.outcome==='deferred'?[]:last?.lines||[]],
moth:['水边的一点微光','在风车遗迹处外面收拾行囊时，希莱斯注意到石阶下的一点微光。一只小灯蛾贴着湿叶，翅尖沾了水，扑动几次也没飞起来。旁边就有能供它落脚的干叶。',[['potion-maker','它的翅膀湿了。我把干叶伸过去，让它自己爬上来。'],['fionn','我把行囊挪开，给它留点地方。']]],
mill:['在风车遗迹处收好记录',summary(t),[['potion-maker',q.route==='plant'?(q.outcome==='deferred'?'温室那边还有没做完的事。先回去吧，下次再来。':'温室的情况记下了。回去歇歇，也给薄荷一点恢复的时间。'):'今天能看见的都记下了。剩下的事，下次带着这些记录再来。'],['fionn',q.outcome==='device'?'水往哪儿流、装置哪里可能卡住了，都在这张图上。总算没白跑。':q.outcome==='outlet'?'外面的水沟画好了。里面那一段还空着……下次我还想看看。':'记录收好了。没查完的地方，我也标出来了。']]]};const [title,text,lines]=data[q.stage]||['沿路前行','他们正走向下一处停留。',[]];return {title,text:t.participants.includes('fionn')?text:text.replace('菲恩蹲下身','希莱斯蹲下身'),lines:all(lines),discovery:q.stage==='event_result'&&q.outcome!=='deferred'?last?.text||'':'',name:q.location==='device'?(q.access==='inside'?'风车遗迹处 · 挡水装置':'风车遗迹处 · 外面的水沟'):TITLES[q.location]};}
function context(s,place,now){const t=s.trip,ps=place==='home'?['potion-maker',...(s.party.fionn?['fionn']:[])]:t.participants;const trips=[t,...s.history].filter((x,i,a)=>x?.slice&&a.findIndex(y=>y?.id===x.id)===i);return {mode:'slice_dialogue',participants:ps,location:place==='home'?'Symia 家园':scene(s).name,environment:place==='home'?'家园窗边与地图桌':scene(s).text,phase:t?.phase||'home',activity_id:t?.id||'home',authored_chapter:L.active(s)?{title:'第七盏灯',scene:scene(s).title,instruction:'只回应当前已发生的场景；不要继续剧情、预告答案、代替玩家作出选择或改写主线。'}:null,world:{chapter:chapter(s),greenhouse:knowledge(s).greenhouse?world(s).greenhouse:'unknown',guardian:knowledge(s).guardian?world(s).guardian:'unknown',evidence:[...world(s).evidence]},knowledge:knowledge(s),memories:trips.slice(0,3).map(x=>({journey:x.number,participants:x.participants,facts:x.slice.records.filter(r=>['result','battle','reward','action'].includes(r.kind)).slice(-10).map(r=>r.text)})).filter(x=>x.participants.some(p=>ps.includes(p))),moods:Object.fromEntries(ps.map(p=>[p,mood(s,p,now)])),goals:pending(s),scene_progress:t?.slice?{route:t.slice.route,stage:t.slice.stage,access:t.slice.access,completed_actions:t.slice.records.filter(r=>r.kind==='action').map(r=>r.action),planned_steps:displayEvent(t)?.steps||[]}:null,conversation:t?.slice?.turns.slice(-3)||[],available_actions:place==='home'||t?.slice?.stage==='event'?[]:choices(s),home:place==='home'?homeImpact(s,now):null,confirmed_items:place==='home'?s.inventory:t.loot};}
function pose(s,now){const t=s.trip,q=t?.slice;if(!q)return {x:155,y:459,marker:0,walking:false};let p=POINTS[q.location];if(q.travel){const k=Math.max(0,Math.min(1,(now-q.travel.startedAt)/2200));p=trailPoint(q.travel.from,q.travel.to,k);}return {x:p[0],y:p[1],marker:q.location==='entrance'?0:['guardian','device','mill'].includes(q.location)?2:1,walking:!!q.travel};}
function validBookmark(b){return b&&['greenhouse','recovery','device','sluice','ending'].includes(b.target)&&typeof b.label==='string'&&b.label.length<=100&&['plant','ruins'].includes(b.route)&&typeof b.done==='boolean';}
function validChapter(c){return c===undefined||c&&['repaired','verified','completed'].every(k=>typeof c[k]==='boolean')&&(!c.verified||c.repaired)&&(!c.completed||c.verified);}
function validWorld(w){if(w===undefined)return true;return w&&w.version===1&&L.valid(w.lantern)&&validChapter(w.chapter)&&['waterlogged','drained','recovering'].includes(w.greenhouse)&&['active','calmed'].includes(w.guardian)&&Array.isArray(w.evidence)&&new Set(w.evidence).size===w.evidence.length&&w.evidence.every(x=>['salt','old_marks','channel','device','outlet'].includes(x))&&Array.isArray(w.discovered)&&w.discovered.every(x=>Object.hasOwn(POINTS,x))&&Array.isArray(w.rewardClaims)&&new Set(w.rewardClaims).size===w.rewardClaims.length&&w.rewardClaims.every(x=>['greenhouse-seeds','guardian-salt','marsh-moth','lantern-seeds'].includes(x))&&(w.bookmarks!==undefined?Array.isArray(w.bookmarks)&&w.bookmarks.length<=5&&new Set(w.bookmarks.map(b=>b?.target)).size===w.bookmarks.length&&w.bookmarks.every(validBookmark):w.bookmark===null||validBookmark(w.bookmark))&&w.moods&&Object.entries(w.moods).every(([p,m])=>Object.hasOwn(NAMES,p)&&m&&['开心','平静','懊恼'].includes(m.label)&&typeof m.reason==='string'&&m.reason.length<400&&typeof m.eventId==='string'&&typeof m.journeyId==='string'&&Number.isFinite(m.until)&&m.until>=0);}
function validTrip(t){const q=t.slice,num=x=>Number.isFinite(x)&&x>=0,text=x=>typeof x==='string'&&x.length<=3000;return q&&L.validTrip(q)&&q.version===1&&[null,'plant','ruins'].includes(q.route)&&['entrance','salt','marks','guardian','battle_result','event','event_result','moth','mill','travel','returned','repair','repair_result','finale','chapter_end','lantern'].includes(q.stage)&&Object.hasOwn(POINTS,q.location)&&Number.isInteger(q.revision)&&q.revision>=0&&[null,'inside','outside'].includes(q.access)&&[null,'drained','recovering','device','outlet','deferred'].includes(q.outcome)&&text(q.error)&&Array.isArray(q.records)&&q.records.length<=1200&&new Set(q.records.map(r=>r.id)).size===q.records.length&&q.records.every(r=>r&&text(r.id)&&text(r.kind)&&text(r.text)&&num(r.at)&&validLines(r.lines,t.participants))&&Array.isArray(q.turns)&&q.turns.length<=500&&q.turns.every(x=>x&&text(x.user)&&text(x.narration)&&validLines(x.lines,t.participants)&&num(x.at))&&Array.isArray(q.pending)&&q.pending.length<=5&&q.pending.every(x=>x&&['greenhouse','recovery','device','sluice','ending'].includes(x.id)&&text(x.label)&&['plant','ruins'].includes(x.route))&&(q.story===undefined||q.story&&text(q.story.text)&&q.story.text.length<=1200&&validLines(q.story.lines,t.participants))&&validWorld(q.worldBefore)&&Number.isInteger(q.step)&&q.step>=0&&(q.event===null?q.step===0:validPlan(q.event,q.eventKind,t.participants,true)&&q.step<=q.event.steps.length&&!(q.stage==='event'&&q.step===q.event.steps.length))&&(q.travel===null?q.stage!=='travel':q.stage==='travel'&&Object.hasOwn(POINTS,q.travel.from)&&Object.hasOwn(POINTS,q.travel.to)&&['salt','marks','guardian','event','moth','mill','repair','repair_result','finale','lantern'].includes(q.travel.stage)&&num(q.travel.startedAt)&&q.travel.arrivesAt===q.travel.startedAt+2200)&&(t.phase==='exploring'||q.stage==='returned'&&num(t.returnedAt))&&(t.phase!=='complete'||num(t.claimedAt));}
const api={chapter,chapterProgress,world,knowledge,ensure,active,key,location,eventKind,CONTRACTS,ACTIONS,POINTS,TITLES,NAMES,TRAILS,exploredTrails,trailPath,trailPoint,tasks,bookmarks,sync,choices,act,afterBattle,summary,scene,context,pose,mood,pending,validPlan,validWorld,validTrip,fallback,displayEvent,eventStory,homeImpact};root.SymiaSlice=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
