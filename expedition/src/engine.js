/* Pure rules. Pass absolute logical time; model text never changes resources. */
(function(root){
  'use strict';
  const C=root.SymiaContent||(typeof require!=='undefined'&&require('./content.js'));
  const G=root.SymiaGarden||(typeof require!=='undefined'&&require('./garden.js'));
  const S=root.SymiaStories||(typeof require!=='undefined'&&require('./stories.js'));
  const A=root.SymiaAutonomy||(typeof require!=='undefined'&&require('./autonomy.js'));
  const W=root.SymiaWorlds||(typeof require!=='undefined'&&require('./worlds.js'));
  const F=root.SymiaForge||(typeof require!=='undefined'&&require('./forge-runtime.js'));
  const K=root.SymiaSlice||(typeof require!=='undefined'&&require('./slice.js'));
  const clone=x=>JSON.parse(JSON.stringify(x)),members=f=>['potion-maker',...(f?['fionn']:[])];
  const emptyItems=()=>Object.fromEntries(Object.keys(C.ITEMS).map(k=>[k,0]));
  function createState(installationId='local-demo'){
    return {schemaVersion:2,installationId,seq:0,clockOffsetMs:0,tripCount:0,party:{fionn:true},trip:null,history:[],inventory:emptyItems(),lots:[],memories:[],outbox:[],home:{plant:null,map:null,pet:null,recipe:false},kitchen:null};
  }
  function uid(s,kind){return `${s.installationId}:${kind}:${++s.seq}`;}
  function emit(s,type,payload,now){s.outbox.push({id:uid(s,'event'),schemaVersion:2,type,occurredAt:new Date(now).toISOString(),payload:clone(payload),delivery:'pending'});}
  function remember(s,key,title,text,people,sources,now,kind,extra={}){
    if(s.memories.some(m=>m.key===key))return;
    const m={id:uid(s,'memory'),key,title,text,participants:[...people],sourceJourneyIds:[...new Set(sources)],at:now,kind,visibility:'participants',source:'expedition-v2',...extra};
    s.memories.unshift(m);emit(s,'memory.proposed',m,now);
  }
  function away(s){return s.trip?.phase==='exploring';}
  const scheduleStart=t=>t.startedAt+(t.delayMs||0)-(together(t)?t.pacing.advanceMs:0);
  function currentNode(s,now){if(s.trip?.forge)return 0;if(s.trip?.slice)return ['guardian','device','mill'].includes(s.trip.slice.location)?1:0;if(s.trip?.auto)return A.current(s.trip,now);return s.trip?.battle?.status==='active'?1:s.trip?Math.min(2,Math.max(0,Math.floor((now-scheduleStart(s.trip))/C.TIMING.node))):0;}
  // Per-journey narrative pacing. The shared real-time clock is never advanced.
  const together=t=>!!t&&!t.auto&&!t.slice&&!t.forge&&t.pacing?.version===1;
  const travelElapsed=(t,now)=>Math.max(0,now-t.startedAt+(together(t)?t.pacing.advanceMs:0));
  function travelProgress(t,now){
    if(t.forge)return F.progress(t,now);
    if(t.phase!=='exploring')return 1;
    const raw=Math.max(0,Math.min(.99,(now-scheduleStart(t))/C.TIMING.return));
    return together(t)?Math.max(t.pacing.progressFloor,raw):raw;
  }
  function continuePlan(s,now){
    const t=s.trip,i=currentNode(s,now);
    if(!together(t)||t.phase!=='exploring')return {allowed:false,reason:'这趟旅行已结束'};
    if(t.battle?.status==='active')return {allowed:false,reason:'先处理眼前的战斗'};
    if(t.nodes.some(n=>n.visited&&!n.choice))return {allowed:false,reason:'先处理眼前的发现'};
    const next=t.nodes.findIndex((n,index)=>index>i&&!n.visited);
    const target=scheduleStart(t)+(next<0?C.TIMING.return:next*C.TIMING.node);
    return {allowed:target>now,key:`${t.id}:continue:${t.pacing.advanceMs}:${i}:${t.nodes[i].choice}`,amount:Math.max(0,target-now),returning:next<0,reason:''};
  }

  function finishBattle(s,status,now){
    const t=s.trip,b=t.battle;b.status=status;
    if(status==='victory')t.loot.silver_salt+=2;
    emit(s,'expedition.battle_resolved',{journeyId:t.id,status,rounds:b.round,participants:t.participants,reward:status==='victory'?{silver_salt:2}:{},idempotencyKey:t.id+':mill-battle'},now);
  }
  function addLot(s,item,qty,sources,people,now){if(!qty)return;s.inventory[item]+=qty;s.lots.push({id:uid(s,'lot'),item,qty,sourceJourneyIds:[...sources],participants:[...people],at:now});}
  function consume(s,item,qty){
    if(s.inventory[item]<qty)throw new Error('Insufficient inventory');s.inventory[item]-=qty;const used=[];
    for(const l of s.lots){if(l.item!==item||l.qty<=0)continue;const n=Math.min(l.qty,qty);if(n){used.push({...clone(l),qty:n});l.qty-=n;qty-=n;}if(!qty)break;}
    if(qty)throw new Error('Inventory provenance missing');return used;
  }
  function resolve(s,i,choiceId,now,automatic){
    const t=s.trip,n=C.NODES[i],e=t.nodes[i],c=n.choices.find(x=>x.id===choiceId);if(e.choice||!c)return;
    e.choice=choiceId;e.resolvedAt=now;e.automatic=automatic;for(const[k,q]of Object.entries(c.items))t.loot[k]+=q;
    emit(s,'expedition.choice_resolved',{journeyId:t.id,nodeId:n.id,choice:choiceId,inspected:e.inspected,automatic,participants:t.participants},now);
  }
  function sync(s,now){
    G.sync(s,now,{consume,addLot,remember});
    K.sync(s,now);
    F.sync(s,now,{emit});
    const t=s.trip;
    if(t?.readingHold&&!together(t)){const h=t.readingHold;if(t.battle?.status!=='active')t.delayMs=(t.delayMs||0)+Math.max(0,Math.min(now,h.until)-h.at);h.at=Math.max(h.at,Math.min(now,h.until));if(now>=h.until)delete t.readingHold;}
    if(t?.battle?.status==='active'){
      t.delayMs=(t.delayMs||0)+Math.max(0,now-t.battle.updatedAt);t.battle.updatedAt=Math.max(now,t.battle.updatedAt);
      if(together(t))t.pacing.progressFloor=travelProgress(t,now);
      return;
    }
    if(t?.phase==='exploring'&&t.auto){
      for(let pos=0;pos<t.auto.route.length;pos++){const i=t.auto.route[pos],at=scheduleStart(t)+pos*t.auto.stepMs;if(now>=at&&!t.nodes[i].visited){t.nodes[i].visited=true;emit(s,'expedition.node_entered',{journeyId:t.id,nodeId:C.NODES[i].id,participants:t.participants},at);}if(now>=at+70000&&!t.nodes[i].choice)A.commit(t,i,A.fallback(t,i),'rule',at+70000,(j,c,n,auto)=>resolve(s,j,c,n,auto));}
      if(now>=scheduleStart(t)+t.auto.route.length*t.auto.stepMs){t.phase='returned';t.returnedAt=scheduleStart(t)+t.auto.route.length*t.auto.stepMs;emit(s,'expedition.returned',{journeyId:t.id,participants:t.participants,items:t.loot},t.returnedAt);}
    }
    if(t?.phase==='exploring'&&!t.auto&&!t.slice&&!t.forge){
      for(let i=0;i<3;i++){
        const at=scheduleStart(t)+i*C.TIMING.node;
        if(now>=at&&!t.nodes[i].visited){t.nodes[i].visited=true;emit(s,'expedition.node_entered',{journeyId:t.id,nodeId:C.NODES[i].id,participants:t.participants},at);}
        if(now>=at+C.TIMING.decision&&!t.nodes[i].choice)resolve(s,i,C.NODES[i].defaultChoice,at+C.TIMING.decision,true);
      }
      if(now>=scheduleStart(t)+C.TIMING.return){t.phase='returned';t.returnedAt=scheduleStart(t)+C.TIMING.return;emit(s,'expedition.returned',{journeyId:t.id,participants:t.participants,items:t.loot},t.returnedAt);}
    }
    if(together(t))t.pacing.progressFloor=travelProgress(t,now);
    const p=s.home.plant;if(p?.status==='growing'&&now>=p.readyAt){p.status='ready';emit(s,'garden.ready',{plantId:p.id,sourceJourneyIds:p.sourceJourneyIds},p.readyAt);}
    const k=s.kitchen;if(k?.status==='cooking'&&now>=k.readyAt){k.status='ready';emit(s,'kitchen.ready',{activityId:k.id},k.readyAt);}
  }
  function transition(state,action,now){
    if(!Number.isFinite(now)||now<0||now>8e15)throw new TypeError('Invalid clock');
    if(!action||typeof action.type!=='string')throw new TypeError('Invalid action');
    const s=normalizeState(state);
    if(action.type==='ADVANCE_DEMO'){if(!Number.isFinite(action.ms)||action.ms<0||action.ms>86400000)return s;s.clockOffsetMs+=action.ms;now+=action.ms;}
    if(action.type==='GARDEN_SETTINGS'){G.ensure(s,now);G.act(s,action,now,{consume,addLot,remember});sync(s,now);return s;}
    sync(s,now);const t=s.trip;
    if(t?.battle?.status==='active'&&!['BATTLE_ACTION','BATTLE_RETREAT','TICK','ADVANCE_DEMO','WORLD_SELECT'].includes(action.type))return s;
    if(action.type.startsWith('GARDEN_')){G.act(s,action,now,{consume,addLot,remember});return s;}
    if(F.act(s,action,now,{uid,addLot,remember,emit}))return s;
    // Episode actions cannot be interpreted as legacy exploration decisions.
    if(t?.forge&&t.phase!=='complete'&&!['TICK','ADVANCE_DEMO','WORLD_SELECT'].includes(action.type))return s;
    if(W.act(s,action))return s;
    if(K.act(s,action,now,{uid,members,addLot,remember,emit}))return s;
    if(t?.slice&&['INSPECT','CHOOSE','CLAIM','STORY_DIALOGUE','AUTO_DECIDE','AUTO_REQUEST','AUTO_FAILURE'].includes(action.type))return s;
    switch(action.type){
      case 'TICK':if(!together(t)&&!t?.slice&&!t?.auto&&t?.story&&t.phase==='exploring'&&action.reading&&t.battle?.status!=='active')t.readingHold={at:now,until:now+1500};else if(action.reading===false&&t)delete t.readingHold;break;
      case 'AUTO_REQUEST':if(t?.auto&&t.phase==='exploring'&&action.node===currentNode(s,now)&&!t.nodes[action.node].choice&&!t.auto.attempted.includes(action.node))t.auto.attempted.push(action.node);break;
      case 'AUTO_FAILURE':if(t?.auto&&t.id===action.journeyId&&t.phase==='exploring'&&!t.nodes[action.node]?.choice)t.auto.error='API 暂未完成，将按角色倾向继续，不会卡住旅途。';break;
      case 'AUTO_DECIDE':{
        const i=action.node;if(!t?.auto||t.phase!=='exploring'||i!==currentNode(s,now)||action.key!==A.decisionKey(t,i)||!t.nodes[i].visited||!t.auto.attempted.includes(i))break;
        const turn={node:i,key:S.key(t,i),user:'',narration:action.narration,lines:action.lines,at:now};if(!S.valid({...t,story:{...t.story,turns:[turn]}}))break;
        if(A.commit(t,i,action.decision,'api',now,(j,c,n,auto)=>resolve(s,j,c,n,auto))){turn.key=S.key(t,i);t.story.turns.push(turn);t.story.turns=t.story.turns.slice(-18);}break;}
      case 'STORY_DIALOGUE':{
        const i=action.node;if(!t?.story||!Number.isInteger(i)||i<0||i>2||!t.nodes[i].visited||action.key!==S.key(t,i)||t.phase!=='exploring'||t.battle?.status==='active')break;
        const turn={node:i,key:action.key,user:action.user||'',narration:action.narration||'',lines:action.lines,at:now};
        const candidate={...t,story:{...t.story,turns:[...t.story.turns,turn].slice(-18)}};if(S.valid(candidate))t.story=candidate.story;break;}
      case 'BATTLE_START':case 'BATTLE_SKIP':{
        if(t?.slice&&(t.slice.stage!=='guardian'||K.world(s).guardian==='calmed'))break;
        if(t?.auto||t?.phase!=='exploring'||currentNode(s,now)!==1||t.nodes[1].choice||t.battle)break;
        t.battle={status:action.type==='BATTLE_SKIP'?'avoided':'active',round:0,hp:14,enemyHp:18,tonic:1,exposed:false,updatedAt:now,log:[]};
        emit(s,'expedition.battle_entered',{journeyId:t.id,participants:t.participants,avoided:action.type==='BATTLE_SKIP'},now);break;}
      case 'BATTLE_RETREAT':if(t?.battle?.status==='active'){t.battle.log.push('队伍沿风车外侧退开，已经收好的发现都还在。');finishBattle(s,'retreated',now);}break;
      case 'BATTLE_ACTION':{
        const b=t?.battle;if(b?.status!=='active'||!['attack','guard','tonic'].includes(action.move)||action.round!==b.round||action.move==='tonic'&&!b.tonic)break;
        const duo=t.participants.includes('fionn'),heavy=b.round%2===1,move=action.move;
        let damage=(move==='attack'?4:move==='guard'?2:3)+(duo?1:0)+(b.exposed?2:0);b.exposed=false;
        if(move==='tonic'){b.tonic=0;b.hp=Math.min(14,b.hp+5);}
        b.enemyHp=Math.max(0,b.enemyHp-damage);b.round++;
        let line=`第 ${b.round} 回合：${move==='attack'?'希莱斯以藤杖攻击':move==='guard'?'希莱斯守护反击':'希莱斯使用随身药剂，恢复至 '+b.hp+' 点状态'}${duo?'，Fionn 指出苔甲缝隙':''}，削减守卫 ${damage} 点耐久。`;
        if(!b.enemyHp){b.log.push(line+' 守卫安静下来，让开了小路。');finishBattle(s,'victory',now);break;}
        const hit=move==='guard'?1:heavy?6:3;b.hp=Math.max(0,b.hp-hit);b.exposed=move==='guard'&&heavy;
        line+=` 守卫${heavy?'重击':'挥臂'}，队伍损失 ${hit} 点状态。${b.exposed?'重击被挡开，下次行动额外削减 2 点耐久。':''}`;b.log.push(line);
        if(!b.hp)finishBattle(s,'defeated',now);else if(b.round>=5){b.log.push('风车开始晃动，队伍及时退出。');finishBattle(s,'retreated',now);}break;}
      case 'SET_PARTY':if((!t||t.phase==='complete')&&(!s.kitchen||s.kitchen.status==='completed'))s.party.fionn=!!action.fionn;break;
      case 'ENABLE_TOGETHER':{
        if(!t||t.id!==action.journeyId||t.phase!=='exploring'||t.auto||t.slice||t.pacing)break;
        t.pacing={version:1,advanceMs:0,progressFloor:travelProgress(t,now)};delete t.readingHold;break;
      }
      case 'CONTINUE_JOURNEY':{
        const plan=continuePlan(s,now);
        if(t?.id!==action.journeyId||!plan.allowed||action.expectedEventKey!==plan.key)break;
        t.pacing.advanceMs+=plan.amount;
        sync(s,now);break;
      }
      case 'START':{
        if(t&&t.phase!=='complete'||s.kitchen&&s.kitchen.status!=='completed')break;
        s.tripCount++;s.trip={id:uid(s,'journey'),number:s.tripCount,participants:members(s.party.fionn),phase:'exploring',startedAt:now,returnedAt:null,claimedAt:null,nodes:C.NODES.map(()=>({visited:false,inspected:false,choice:null,automatic:false,resolvedAt:null})),loot:emptyItems(),story:{id:S.byId(action.storyId)?.id||S.STORIES[(s.tripCount-1)%S.STORIES.length].id,turns:[]}};
        if(action.together&&!action.autonomous)s.trip.pacing={version:1,advanceMs:0,progressFloor:0};
        if(action.autonomous){s.trip.auto=A.create(Number.isInteger(action.seed)?action.seed:Math.floor(Math.random()*4294967296));s.trip.story.id=['letter','echo','glimmer'][s.trip.auto.rng%3];}
        emit(s,'expedition.started',{journeyId:s.trip.id,participants:s.trip.participants,worldId:C.WORLD.id,regionId:C.WORLD.regionId},now);sync(s,now);break;}
      case 'INSPECT':{
        const i=currentNode(s,now),e=t?.nodes[i];if(t?.phase==='exploring'&&action.nodeId===C.NODES[i].id&&!e.inspected&&!e.choice){e.inspected=true;emit(s,'expedition.clue_discovered',{journeyId:t.id,nodeId:action.nodeId,participants:t.participants},now);}break;}
      case 'CHOOSE':{const i=currentNode(s,now);if(t?.phase==='exploring'&&action.nodeId===C.NODES[i].id){if(t.auto)A.commit(t,i,{choice:action.choice,inspected:t.nodes[i].inspected,actor:'potion-maker',reason:'听从你的建议，先做好眼前这一步。',next:A.remaining(t,i)[0]??null},'user',now,(j,c,n,auto)=>resolve(s,j,c,n,auto));else resolve(s,i,action.choice,now,false);}break;}
      case 'CLAIM':{
        if(t?.phase!=='returned')break;if(s.home.map)t.loot.windmill_page=0;if(s.home.pet)t.loot.marsh_pet=0;
        for(const[item,qty]of Object.entries(t.loot))addLot(s,item,qty,[t.id],t.participants,now);
        s.home.recipe=s.home.recipe||!t.auto||!!t.nodes[1].choice;
        if(t.loot.windmill_page)s.home.map={journeyId:t.id,variant:t.nodes[1].choice==='copy'?'copy':'original',participants:[...t.participants]};
        if(t.loot.marsh_pet){s.home.pet={journeyId:t.id,participants:[...t.participants],greeted:false};emit(s,'home.object_created',{objectId:'marsh-lantern-moth',slotId:'window-perch',sourceJourneyId:t.id,idempotencyKey:'home:marsh-lantern-moth'},now);}
        t.phase='complete';t.claimedAt=now;s.history.unshift(clone(t));
        const conclusion=S.ending(t),text=t.nodes[0].choice==='gather'?'纸袋里装着两粒薄荷种子。':'薄荷留在湿地，我们记下了它的位置。';
        remember(s,`${t.id}:return`,conclusion?.title||'从灰月湿地带回的一天',conclusion?.text||`${text}${t.nodes[1].choice==='copy'?'风车残页被抄成拓本':'风车残页被小心收好'}，盐晶落在厨房的小罐里。${t.nodes[2].choice==='help'?'一只小灯蛾跟着回到了窗边。':'小灯蛾留在岸边休息。'}`,t.participants,[t.id],now,'journey');
        if(t.battle&&t.battle.status!=='avoided')remember(s,`${t.id}:battle`,'旧风车旁的一次遭遇',`${t.battle.status==='victory'?'你们让苔石守卫安静下来，带回额外的盐晶。':'你们从苔石守卫身旁安全退开，保住了已经收好的发现。'}${t.participants.includes('fionn')?'Fionn 指出的苔甲缝隙，让希莱斯找到了出手的位置。':'希莱斯独自判断守卫的动作，决定何时守护与补给。'}`,t.participants,[t.id],now,'battle');
        emit(s,'inventory.grant_requested',{journeyId:t.id,items:t.loot,idempotencyKey:`${t.id}:loot`},now);break;}
      case 'PLANT':{
        if(away(s)||s.home.plant&&s.home.plant.status!=='harvested'||s.inventory.glow_mint_seed<1)break;
        const used=consume(s,'glow_mint_seed',1),p={id:uid(s,'plant'),status:'growing',plantedAt:now,readyAt:now+C.TIMING.grow,sourceJourneyIds:used.flatMap(x=>x.sourceJourneyIds),participants:members(s.party.fionn)};
        s.home.plant=p;emit(s,'garden.planted',{...p,cost:{glow_mint_seed:1}},now);break;}
      case 'HARVEST':{
        const p=s.home.plant;if(away(s)||p?.status!=='ready')break;p.status='harvested';p.harvestedAt=now;addLot(s,'glow_mint',3,p.sourceJourneyIds,p.participants,now);
        emit(s,'garden.harvested',{plantId:p.id,items:{glow_mint:3},sourceJourneyIds:p.sourceJourneyIds,idempotencyKey:`${p.id}:harvest`},now);
        // Ordinary harvest is inventory provenance, not a companion memory.
        break;}
      case 'PREPARE_TEA':{
        if(away(s)||!s.home.recipe||s.kitchen&&s.kitchen.status!=='completed')break;const people=members(s.party.fionn),qty=people.length+1;
        if(s.inventory.glow_mint<qty||s.inventory.silver_salt<qty)break;const used=[...consume(s,'glow_mint',qty),...consume(s,'silver_salt',qty)];
        s.kitchen={id:uid(s,'cooking'),recipeId:'mist-mint-tea',status:'prepared',participants:people,portions:qty,ingredients:{glow_mint:qty,silver_salt:qty},reserved:used,sourceJourneyIds:[...new Set(used.flatMap(x=>x.sourceJourneyIds))],method:null,readyAt:null,createdAt:now};
        emit(s,'kitchen.prepared',{activityId:s.kitchen.id,ingredients:s.kitchen.ingredients,participants:people},now);break;}
      case 'CANCEL_TEA':{const k=s.kitchen;if(!k||!['prepared','choosing'].includes(k.status))break;for(const l of k.reserved)addLot(s,l.item,l.qty,l.sourceJourneyIds,l.participants,now);emit(s,'kitchen.cancelled',{activityId:k.id,refund:k.ingredients},now);s.kitchen=null;break;}
      case 'BEGIN_TEA':if(s.kitchen?.status==='prepared')s.kitchen.status='choosing';break;
      case 'CHOOSE_TEA':{const k=s.kitchen;if(k?.status!=='choosing'||!C.METHODS.some(m=>m.id===action.method))break;k.method=action.method;k.status='cooking';k.readyAt=now+C.TIMING.cook;emit(s,'kitchen.started',{activityId:k.id,method:k.method,ingredients:k.ingredients},now);break;}
      case 'TASTE':{
        const k=s.kitchen;if(k?.status!=='ready')break;k.status='completed';k.completedAt=now;const method=C.METHODS.find(m=>m.id===k.method);
        remember(s,`${k.id}:tea`,'那次远行，变成了一壶茶',`你们一起尝过${method.result}。${k.method==='gentle'?'清香慢慢散开':'轻揉过的叶片更清凉'}，希莱斯把壶留在桌上${k.participants.includes('fionn')?'，Fionn 把地图挪远了一点，给你的杯子让出位置':'，替你的杯子添了些温茶'}。`,['user',...k.participants],k.sourceJourneyIds,now,'tea');
        emit(s,'kitchen.completed',{activityId:k.id,result:method.result,participants:k.participants,sourceJourneyIds:k.sourceJourneyIds,idempotencyKey:`${k.id}:result`},now);break;}
      case 'GREET_PET':{const p=s.home.pet;if(!p||p.greeted||away(s))break;p.greeted=true;remember(s,'home:pet:greeted','窗边多了一点微光','你把手停在窗边，小灯蛾落了一会儿，又飞回干燥的叶片上。它在这里找到了一处落脚的地方。',['user',...members(s.party.fionn)],[p.journeyId],now,'home');break;}
    }K.afterBattle(s,now);return s;
  }
  function normalizeState(value){
    const v=clone(value);
    // Add only this new catalogue entry; never repair arbitrary missing data.
    for(const items of [v?.inventory,...[v?.trip,...(Array.isArray(v?.history)?v.history:[])].filter(Boolean).map(t=>t.loot)]){
      if(items&&typeof items==='object'&&!Array.isArray(items)&&!Object.hasOwn(items,'painted_reed_bookmark'))items.painted_reed_bookmark=0;
    }
    return v;
  }
  function validateState(v){
    try{
      v=normalizeState(v);
      const obj=x=>x&&typeof x==='object'&&!Array.isArray(x),str=x=>typeof x==='string'&&x.length<=12000,num=x=>Number.isFinite(x)&&x>=0&&x<8e15,int=x=>Number.isSafeInteger(x)&&x>=0;
      const people=x=>Array.isArray(x)&&x.length<=3&&new Set(x).size===x.length&&x.every(p=>['user','fionn','potion-maker'].includes(p));
      const sources=x=>Array.isArray(x)&&x.length<=100&&x.every(str),items=x=>obj(x)&&Object.keys(x).every(k=>Object.hasOwn(C.ITEMS,k))&&Object.values(x).every(n=>int(n)&&n<=1e6);
      if(!obj(v)||JSON.stringify(v).length>4000000||v.schemaVersion!==2||!str(v.installationId)||!v.installationId||!int(v.seq)||!int(v.tripCount)||!num(v.clockOffsetMs)||v.clockOffsetMs>86400000*365)return false;
      if(v.garden!==undefined&&!G.valid(v.garden))return false;
      if(!W.valid(v.atlas))return false;
      if(!K.validWorld(v.marsh))return false;
      if(v.trip?.slice?.storyVersion&&(!v.marsh?.lantern||v.trip.phase==='exploring'&&v.trip.slice.storyNode!==v.marsh.lantern.node))return false;
      if(!obj(v.party)||typeof v.party.fionn!=='boolean'||!obj(v.home)||typeof v.home.recipe!=='boolean'||!items(v.inventory)||!Object.keys(C.ITEMS).every(k=>Object.hasOwn(v.inventory,k)))return false;
      if(!['lots','history','memories','outbox'].every(k=>Array.isArray(v[k])&&v[k].length<=10000))return false;
      const lot=l=>obj(l)&&str(l.id)&&Object.hasOwn(C.ITEMS,l.item)&&int(l.qty)&&l.qty<=1e6&&sources(l.sourceJourneyIds)&&people(l.participants)&&num(l.at);
      if(!v.lots.every(lot)||!Object.keys(C.ITEMS).every(item=>v.lots.filter(l=>l.item===item).reduce((a,l)=>a+l.qty,0)===v.inventory[item]))return false;
      if(!v.memories.every(m=>obj(m)&&['id','key','title','text','kind'].every(k=>str(m[k]))&&people(m.participants)&&sources(m.sourceJourneyIds)&&num(m.at)))return false;
      if(!v.memories.every(m=>m.harvest===undefined||(m.kind==='garden'&&obj(m.harvest)&&people([m.harvest.actor])&&Object.hasOwn(G.CROPS,m.harvest.crop)&&typeof m.harvest.variant==='boolean'&&int(m.harvest.quantity)&&m.harvest.quantity>0&&str(m.harvest.plotId)&&[1,2].includes(m.harvest.cycle))))return false;
      if(!v.outbox.every(e=>obj(e)&&str(e.id)&&str(e.type)&&str(e.occurredAt)&&obj(e.payload)&&e.delivery==='pending'))return false;
      const legacyTrip=t=>obj(t)&&str(t.id)&&int(t.number)&&people(t.participants)&&t.participants.includes('potion-maker')&&!t.participants.includes('user')&&['exploring','returned','complete'].includes(t.phase)&&num(t.startedAt)&&items(t.loot)&&Object.keys(C.ITEMS).every(k=>Object.hasOwn(t.loot,k))&&Array.isArray(t.nodes)&&t.nodes.length===3&&t.nodes.every((e,i)=>obj(e)&&typeof e.visited==='boolean'&&typeof e.inspected==='boolean'&&typeof e.automatic==='boolean'&&(e.resolvedAt===null||num(e.resolvedAt))&&(e.choice===null||C.NODES[i].choices.some(c=>c.id===e.choice)))&&(t.phase==='exploring'||num(t.returnedAt)&&(t.auto?t.auto.route?.every(i=>t.nodes[i]?.choice):t.nodes.every(e=>e.choice)))&&(t.phase!=='complete'||num(t.claimedAt));
      const trip=t=>t?.forge?F.validTrip(t):t?.slice?obj(t)&&str(t.id)&&int(t.number)&&people(t.participants)&&t.participants.includes('potion-maker')&&!t.participants.includes('user')&&['exploring','returned','complete'].includes(t.phase)&&num(t.startedAt)&&items(t.loot)&&Object.keys(C.ITEMS).every(k=>Object.hasOwn(t.loot,k))&&Array.isArray(t.nodes)&&t.nodes.length===3&&t.nodes.every(e=>obj(e)&&typeof e.visited==='boolean'&&typeof e.inspected==='boolean'&&e.choice===null)&&K.validTrip(t):legacyTrip(t);
      if(v.trip!==null&&!trip(v.trip)||!v.history.every(t=>trip(t)&&t.phase==='complete'))return false;
      if(!F.validState(v))return false;
      for(const t of [v.trip,...v.history].filter(Boolean)){
        if(!S.valid(t)||!A.valid(t))return false;
        if(t.pacing!==undefined&&(!together(t)||!obj(t.pacing)||t.pacing.version!==1||!num(t.pacing.advanceMs)||t.pacing.advanceMs>C.TIMING.return||!num(t.pacing.progressFloor)||t.pacing.progressFloor>1))return false;
        if(t.readingHold&&(!num(t.readingHold.at)||!num(t.readingHold.until)||t.readingHold.until<t.readingHold.at||t.readingHold.until-t.readingHold.at>1500))return false;
        if(t.delayMs!==undefined&&!num(t.delayMs))return false;
        const b=t.battle;if(b!==undefined&&(!obj(b)||!['active','avoided','victory','retreated','defeated'].includes(b.status)||!int(b.round)||b.round>5||!int(b.hp)||b.hp>14||!int(b.enemyHp)||b.enemyHp>18||![0,1].includes(b.tonic)||typeof b.exposed!=='boolean'||!num(b.updatedAt)||!Array.isArray(b.log)||b.log.length>7||!b.log.every(str)))return false;
        if(b?.status==='active'&&(t.phase!=='exploring'||!t.nodes[1].visited||t.nodes[1].choice||t.nodes[2].visited||!b.hp||!b.enemyHp||b.round>=5))return false;
        if(b?.status==='victory'&&b.enemyHp!==0||b?.status==='defeated'&&b.hp!==0)return false;
      }
      const p=v.home.plant;if(p!==null&&(!obj(p)||!str(p.id)||!['growing','ready','harvested'].includes(p.status)||!num(p.plantedAt)||!num(p.readyAt)||!sources(p.sourceJourneyIds)||!people(p.participants)))return false;
      const m=v.home.map;if(m!==null&&(!obj(m)||!str(m.journeyId)||!['copy','original'].includes(m.variant)||!people(m.participants)))return false;
      const pet=v.home.pet;if(pet!==null&&(!obj(pet)||!str(pet.journeyId)||!people(pet.participants)||typeof pet.greeted!=='boolean'))return false;
      const k=v.kitchen;if(k!==null&&(!obj(k)||!str(k.id)||k.recipeId!=='mist-mint-tea'||!['prepared','choosing','cooking','ready','completed'].includes(k.status)||!people(k.participants)||!int(k.portions)||k.portions!==k.participants.length+1||!items(k.ingredients)||!Array.isArray(k.reserved)||!k.reserved.every(lot)||!sources(k.sourceJourneyIds)||!num(k.createdAt)||(k.readyAt!==null&&!num(k.readyAt))||(k.method!==null&&!C.METHODS.some(m=>m.id===k.method))||(['cooking','ready','completed'].includes(k.status)&&(!num(k.readyAt)||!k.method))))return false;
      return true;
    }catch{return false;}
  }
  const nextNode=(t,i)=>t.auto?(A.remaining(t,i)[0]??null):(i<2?i+1:null);
  const nodeEnd=(t,i)=>scheduleStart(t)+(t.auto?(t.auto.route.indexOf(i)+1)*t.auto.stepMs:(i+1)*C.TIMING.node);
  const Engine={normalizeState,together,travelElapsed,travelProgress,continuePlan,nextNode,nodeEnd,createState,transition,validateState,currentNode,away,members,scheduleStart};root.SymiaEngine=Engine;if(typeof module!=='undefined')module.exports=Engine;
})(globalThis);
