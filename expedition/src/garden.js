/* Local, persisted garden simulation. Hours are real hours; demo controls move the shared clock. */
(function(root){
  'use strict';
  const HOUR=3600000,LEGACY_OPEN=[0,1,2,4,5,6,8,9,10],OPEN=Array.from({length:12},(_,i)=>i),MAX_BOXES=48;
  const DEFAULT_BOXES=Object.freeze([-10,-11.38,-12.76].flatMap((z,row)=>[-6,-4.25,2,3.75].map((x,column)=>({id:`yard-bed-${row+1}-${column+1}`,index:row*4+column,x,z}))));
  const open=g=>g?.boxes?.map(box=>box.index)??OPEN;
  const CROPS={tomato:{name:'番茄',hours:6,yield:[2,4],regrow:3,second:[2,3],variant:'紫番茄'},lettuce:{name:'生菜',hours:2,yield:[1,2],variant:'红叶生菜'},mint:{name:'薄荷',hours:2,yield:[2,4],regrow:1,second:[1,3],variant:'银边薄荷'},garlic:{name:'大蒜',hours:6,yield:[1,3],variant:'紫纹大蒜'}};
  const ACTORS={'potion-maker':'希莱斯',fionn:'菲恩',user:'你'};
  const preferences={fionn:{tomato:3,lettuce:1,mint:4,garlic:1},'potion-maker':{tomato:2,lettuce:2,mint:4,garlic:3}};
  function create(){return {version:1,plots:Array(16).fill(null),boxes:DEFAULT_BOXES.map(box=>({...box})),seeds:{tomato:8,lettuce:6,mint:5,garlic:5},variantSeeds:{tomato:0,lettuce:0,mint:0,garlic:0},warehouse:{},discovered:[],managed:false,reservedEmpty:3,reserve:{tomato:1,lettuce:1,mint:1,garlic:1},pendingAt:null,actorCursor:0,serial:0,rng:Math.floor(Math.random()*4294967295)>>>0,events:[],lastEvent:null,legacyMigrated:false};}
  function random(g){g.rng=(Math.imul(g.rng,1664525)+1013904223)>>>0;return g.rng/4294967296;}
  const duration=p=>p.durationHours||((p.cycle===2?CROPS[p.crop].regrow:CROPS[p.crop].hours));
  const progress=(p,now)=>Math.max(0,Math.min(1,((now-p.plantedAt)/HOUR+p.bonusHours)/duration(p)));
  function stage(p,now){const v=progress(p,now);return v>=1?'可收获':p.cycle===2?'再生中':v<.18?'刚播种':v<.45?'幼苗':v<.7?'生长中':'结实中';}
  function log(g,text,now,activity){g.events.unshift({at:now,text,...(activity?{activity}:{})});g.events=g.events.slice(0,30);}
  const people=s=>['potion-maker',...(s.party.fionn?['fionn']:[])];
  const available=s=>s.trip?.phase==='exploring'?['potion-maker','fionn'].filter(a=>!s.trip.participants.includes(a)):['potion-maker','fionn'];
  function ensure(s,now){
    if(!s.garden)s.garden=create();const g=s.garden;
    // Old saves keep their sixteen plot slots and all plants; the three previously
    // locked slots become real boxes without renumbering the existing nine plants.
    if(!g.boxes)g.boxes=DEFAULT_BOXES.map(box=>({...box}));
    if(!g.legacyMigrated){g.legacyMigrated=true;const p=s.home.plant;
      if(p&&p.status!=='harvested')g.plots[0]={id:'legacy-'+p.id,crop:'mint',variantSeed:false,variant:false,revealed:true,cycle:1,plantedAt:p.plantedAt,bonusHours:0,watered:[],planter:'user',protected:false,durationHours:(p.readyAt-p.plantedAt)/HOUR,sources:p.sourceJourneyIds,participants:p.participants};
      // Preserve the old visual record, but retire its harvest action to prevent duplicate grants.
      if(p&&p.status!=='harvested')p.status='harvested';
      log(g,'种植箱准备好了。选一袋种子，再点空箱播种。',now);
    }return g;
  }
  function sow(s,index,crop,kind,actor,now,io){
    const g=s.garden;if(!open(g).includes(index)||g.plots[index]||!Object.hasOwn(CROPS,crop)||!['normal','variant','expedition'].includes(kind))return false;
    let sources=[],participants=actor==='user'?people(s).filter(a=>available(s).includes(a)):[actor];
    if(kind==='expedition') {if(crop!=='mint'||s.inventory.glow_mint_seed<1)return false;const lots=io.consume(s,'glow_mint_seed',1);sources=[...new Set(lots.flatMap(l=>l.sourceJourneyIds))];participants=[...new Set(lots.flatMap(l=>l.participants))];}
    else {const stock=kind==='variant'?g.variantSeeds:g.seeds;if(stock[crop]<1)return false;stock[crop]--;}
    const p={id:'garden-'+(++g.serial),crop,variantSeed:kind==='variant',variant:random(g)<(kind==='variant'?.7:.08),revealed:false,cycle:1,plantedAt:now,bonusHours:0,watered:[],planter:actor,protected:false,sources,participants};
    g.plots[index]=p;g.lastEvent={type:'plant',crop,participants,at:now};log(g,`${ACTORS[actor]}种下了${CROPS[crop].name} ×1。`,now,{id:'plant:'+p.id,type:'plant',actor,crop,quantity:1,index,variant:false});return true;
  }
  function reveal(g,p,now){if(!p.revealed&&progress(p,now)>=.7){p.revealed=true;if(p.variant){p.protected=true;if(!g.discovered.includes(p.crop))g.discovered.push(p.crop);log(g,`发现${CROPS[p.crop].variant}，已自动保护。`,now);}}}
  function harvest(s,index,explicit,now,io,actor='user'){
    const g=s.garden,p=g.plots[index];if(!p||progress(p,now)<1||p.protected&&!explicit)return false;reveal(g,p,now);if(p.protected&&!explicit)return false;
    const c=CROPS[p.crop],range=p.cycle===2?c.second:c.yield,qty=range[0]+Math.floor(random(g)*(range[1]-range[0]+1)),name=p.variant?c.variant:c.name;
    if(p.crop==='mint'&&!p.variant)io.addLot(s,'glow_mint',qty,p.sources,p.participants,now);
    else {const key=p.crop+(p.variant?':variant':':normal');g.warehouse[key]=(g.warehouse[key]||0)+qty;}
    log(g,`${ACTORS[actor]}收获了${name} ×${qty}${c.regrow&&p.cycle===1?'，留根再长一轮':'，空地可以重新播种'}。`,now,{id:'harvest:'+p.id+':'+p.cycle,type:'harvest',actor,crop:p.crop,quantity:qty,index,variant:p.variant});
    g.lastEvent={type:'harvest',crop:p.crop,participants:[actor],actor,at:now};
    if(p.variant)io.remember(s,p.id+':'+p.cycle,'花园里的收获',`${ACTORS[actor]}从第 ${index+1} 块田收好${name} ×${qty}。${p.sources.length?'它来自一次湿地远行。':''}`,[...new Set([actor,...p.participants])],p.sources,now,'garden',{harvest:{actor,crop:p.crop,variant:p.variant,quantity:qty,plotId:p.id,cycle:p.cycle}});
    if(c.regrow&&p.cycle===1){p.cycle=2;p.plantedAt=now;p.bonusHours=0;p.watered=[];delete p.durationHours;}
    else {const roll=random(g);let normal=0,variant=0;if(p.variant){if(roll>=.92)normal=2;else if(roll>=.83)variant=1;else if(roll>=.68){normal=1;variant=1;}else if(roll>=.25)normal=1;}else normal=roll<.15?0:roll<.85?1:2;
      g.seeds[p.crop]+=normal;g.variantSeeds[p.crop]+=variant;if(normal||variant)log(g,`${name}返种：普通 ${normal} 粒${variant?'、异色 '+variant+' 粒':''}。`,now);g.plots[index]=null;}
    return true;
  }
  function eligible(g){return Object.keys(CROPS).filter(c=>g.seeds[c]>g.reserve[c]);}
  function capacity(g){return Math.max(0,open(g).filter(i=>!g.plots[i]).length-g.reservedEmpty);}
  function sync(s,now,io){const g=ensure(s,now);for(const p of g.plots)if(p){reveal(g,p,now);p.displayStage=stage(p,now);}
    const actors=available(s);if(!actors.length){g.pendingAt=null;return;}
    for(const i of open(g)){const p=g.plots[i];if(p&&(g.managed||p.planter!=='user'&&actors.includes(p.planter)))harvest(s,i,false,now,io,actors.includes(p.planter)?p.planter:actors[0]);}
    if(!capacity(g)||!eligible(g).length){g.pendingAt=null;return;}
    if(g.pendingAt===null){g.pendingAt=now+120000;return;}
    if(now<g.pendingAt)return;
    const actor=actors[g.actorCursor++%actors.length],count=g.managed?capacity(g):Math.min(2,capacity(g));g.pendingAt=null;
    for(let n=0;n<count;n++){const choices=eligible(g).map(c=>({c,score:preferences[actor][c]-g.plots.filter(p=>p?.crop===c).length*.8+random(g)*.75})).sort((a,b)=>b.score-a.score);if(!choices.length)break;sow(s,open(g).find(i=>!g.plots[i]),choices[0].c,'normal',actor,now,io);}
    if(capacity(g)&&eligible(g).length)g.pendingAt=now+120000;
  }
  function act(s,a,now,io){const g=ensure(s,now),p=g.plots[a.index];switch(a.type){
    case 'GARDEN_KITCHEN_PREPARE':{
      if(g.kitchenTransfer||typeof a.requestId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(a.requestId))break;
      const items={},sources=[];
      for(const [key,qty] of Object.entries(g.warehouse)){if(!qty)continue;const [crop,kind]=key.split(':');items[crop+(kind==='variant'?'_variant':'')]=qty;}
      if(s.inventory.glow_mint>0){items.mint=(items.mint||0)+s.inventory.glow_mint;sources.push(...io.consume(s,'glow_mint',s.inventory.glow_mint));}
      if(!Object.keys(items).length)break;
      for(const key of Object.keys(g.warehouse))g.warehouse[key]=0;
      g.kitchenTransfer={id:a.requestId,items,sources,at:now};break;}
    case 'GARDEN_KITCHEN_ACK':if(g.kitchenTransfer?.id===a.requestId)g.kitchenTransfer=null;break;
    case 'GARDEN_SOW':{const actor=a.actor||'user';if(actor==='user'||available(s).includes(actor))sow(s,a.index,a.crop,a.kind||'normal',actor,now,io);break;}
    case 'GARDEN_HARVEST':{const actor=a.actor||'user';if(actor==='user'||available(s).includes(actor))harvest(s,a.index,true,now,io,actor);break;}
    case 'GARDEN_HARVEST_ALL':{const actor=a.actor||'user';if(actor==='user'||available(s).includes(actor))for(const i of open(g))harvest(s,i,false,now,io,actor);break;}
    case 'GARDEN_PROTECT':if(p)p.protected=!p.protected;break;
    case 'GARDEN_PULL':if(p&&a.confirm===p.id){g.plots[a.index]=null;log(g,`拔除了第 ${a.index+1} 格的${CROPS[p.crop].name}，没有返种。`,now);}break;
    case 'GARDEN_WATER':{let count=0;for(const p of g.plots){if(!p||progress(p,now)>=1)continue;const phase=Math.min(2,Math.floor(progress(p,now)*3));if(!p.watered.includes(phase)){p.watered.push(phase);p.bonusHours+=duration(p)*.05;count++;reveal(g,p,now);}}log(g,count?`浇过 ${count} 块田，各缩短本轮 5% 生长时间。`:'这一阶段已经浇过水了，等长大一点再来。',now);break;}
    case 'GARDEN_SETTINGS':if(typeof a.managed==='boolean')g.managed=a.managed;if(Number.isInteger(a.reservedEmpty))g.reservedEmpty=Math.max(0,Math.min(g.boxes.length,a.reservedEmpty));if(Object.hasOwn(CROPS,a.crop)&&Number.isInteger(a.reserve))g.reserve[a.crop]=Math.max(1,Math.min(99,a.reserve));g.pendingAt=null;break;
    case 'GARDEN_ADD_BOX':{
      const requestId=a.requestId,x=a.x,z=a.z;
      if(typeof requestId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(requestId)||g.boxes.some(box=>box.requestId===requestId)||g.boxes.length>=MAX_BOXES)break;
      // Spatial fit against the editable yard is checked by the home editor.
      // The simulation bounds reject corrupt coordinates and duplicate centers.
      if(!Number.isFinite(x)||!Number.isFinite(z)||x< -30||x>30||z< -50||z> -5||Math.round(x*4)!==x*4||Math.round(z*4)!==z*4)break;
      if(g.boxes.some(box=>Math.abs(box.x-x)<1.4&&Math.abs(box.z-z)<1.1))break;
      const index=g.plots.length,id=`yard-bed-extra-${g.boxes.length+1}`;
      g.boxes.push({id,index,x,z,requestId});g.plots.push(null);
      log(g,`新添了第 ${g.boxes.length} 个种植箱，可以在庭院里摆放。`,now);
      break;}
    case 'GARDEN_SET_BOX_POSITIONS':{
      const positions=a.positions,byId=new Map(g.boxes.map(box=>[box.id,box]));
      if(!Array.isArray(positions)||!positions.length||positions.length>g.boxes.length)break;
      const seen=new Set();let invalid=false;
      for(const item of positions){
        if(!item||typeof item.id!=='string'||!byId.has(item.id)||seen.has(item.id)||
          !Number.isFinite(item.x)||!Number.isFinite(item.z)||item.x< -30||item.x>30||item.z< -50||item.z> -5||
          Math.abs(Math.round(item.x*1000)-item.x*1000)>1e-6||Math.abs(Math.round(item.z*1000)-item.z*1000)>1e-6){invalid=true;break;}
        seen.add(item.id);
      }
      if(invalid)break;
      for(const item of positions){const box=byId.get(item.id);box.x=item.x;box.z=item.z;}
      break;}
    case 'GARDEN_ASSIST':{
      if(!['fionn','potion-maker'].includes(a.actor)||!available(s).includes(a.actor))break;
      const index=open(g).includes(a.index)&&!g.plots[a.index]?a.index:open(g).find(i=>!g.plots[i]);
      const crop=Object.keys(CROPS).filter(c=>g.seeds[c]>g.reserve[c]).sort((left,right)=>preferences[a.actor][right]-preferences[a.actor][left])[0];
      if(index!==undefined&&crop&&capacity(g)>0)sow(s,index,crop,'normal',a.actor,now,io);
      else log(g,`${ACTORS[a.actor]}到花园看了看，暂时没有可播种的空地或富余种子。`,now);
      break;}
    case 'GARDEN_DEMO_MATURE':for(const p of g.plots)if(p){p.bonusHours=duration(p);reveal(g,p,now);}log(g,'测试：现有植物已成熟。',now);break;
    case 'GARDEN_DEMO_SEEDS':for(const c of Object.keys(CROPS))g.seeds[c]+=5;log(g,'测试：四种普通种子各补充 5 粒。',now);break;
    case 'GARDEN_DEMO_AGENT':g.pendingAt=now;sync(s,now,io);break;
  }}
  function valid(g){
    if(!g||g.version!==1||!Array.isArray(g.plots)||!Array.isArray(g.events)||g.events.length>30||!Array.isArray(g.discovered)||g.discovered.some(c=>!Object.hasOwn(CROPS,c))||typeof g.managed!=='boolean'||typeof g.legacyMigrated!=='boolean')return false;
    const int=x=>Number.isSafeInteger(x)&&x>=0,finite=x=>Number.isFinite(x)&&x>=0&&x<8e15;
    const legacy=g.boxes===undefined;
    if(legacy){if(g.plots.length!==16)return false;}
    else{
      if(!Array.isArray(g.boxes)||g.boxes.length<12||g.boxes.length>MAX_BOXES||g.plots.length!==16+g.boxes.length-12)return false;
      const ids=new Set(),requests=new Set();
      for(let n=0;n<g.boxes.length;n++){
        const box=g.boxes[n],initial=n<12,index=initial?n:n+4,id=initial?`yard-bed-${Math.floor(n/4)+1}-${n%4+1}`:`yard-bed-extra-${n+1}`;
        if(!box||box.id!==id||box.index!==index||ids.has(box.id)||!Number.isFinite(box.x)||!Number.isFinite(box.z)||box.x< -30||box.x>30||box.z< -50||box.z> -5||Math.abs(Math.round(box.x*1000)-box.x*1000)>1e-6||Math.abs(Math.round(box.z*1000)-box.z*1000)>1e-6)return false;
        if(initial){if(box.requestId!==undefined)return false;}
        else if(typeof box.requestId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(box.requestId)||requests.has(box.requestId))return false;
        ids.add(box.id);if(box.requestId)requests.add(box.requestId);
      }
    }
    if(!int(g.rng)||g.rng>4294967295||!int(g.serial)||!int(g.actorCursor)||!int(g.reservedEmpty)||g.reservedEmpty>(legacy?9:g.boxes.length)||g.pendingAt!==null&&!finite(g.pendingAt))return false;
    for(const bag of ['seeds','variantSeeds','reserve'])if(!g[bag]||Object.keys(CROPS).some(c=>!int(g[bag][c])||(bag==='reserve'&&(g[bag][c]<1||g[bag][c]>99))))return false;
    if(!g.warehouse||Object.entries(g.warehouse).some(([k,v])=>! /^(tomato|lettuce|mint|garlic):(normal|variant)$/.test(k)||!int(v)))return false;
    if(g.kitchenTransfer!=null){const t=g.kitchenTransfer;if(!t||typeof t.id!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(t.id)||!finite(t.at)||!t.items||!Object.keys(t.items).length||Object.entries(t.items).some(([k,v])=>!/^(tomato|lettuce|mint|garlic)(_variant)?$/.test(k)||!int(v)||v<1||v>1000000)||!Array.isArray(t.sources))return false;}
    if(g.events.some(e=>!finite(e.at)||typeof e.text!=='string'||e.activity!==undefined&&(!e.activity||typeof e.activity.id!=='string'||!['plant','harvest'].includes(e.activity.type)||!Object.hasOwn(ACTORS,e.activity.actor)||!Object.hasOwn(CROPS,e.activity.crop)||!int(e.activity.quantity)||e.activity.quantity<1||!int(e.activity.index)||e.activity.index>=g.plots.length||typeof e.activity.variant!=='boolean')))return false;
    const strings=a=>Array.isArray(a)&&a.length<=100&&a.every(x=>typeof x==='string'&&x.length<=12000);const participants=a=>strings(a)&&a.length<=3&&new Set(a).size===a.length&&a.every(x=>Object.hasOwn(ACTORS,x));
    if(g.lastEvent!==null&&(!g.lastEvent||!['plant','harvest'].includes(g.lastEvent.type)||!Object.hasOwn(CROPS,g.lastEvent.crop)||!participants(g.lastEvent.participants)||!finite(g.lastEvent.at)))return false;
    const active=new Set(legacy?LEGACY_OPEN:open(g));
    return g.plots.every((p,i)=>p===null||active.has(i)&&p&&Object.hasOwn(CROPS,p.crop)&&typeof p.id==='string'&&['user','potion-maker','fionn'].includes(p.planter)&&[1,2].includes(p.cycle)&&(p.cycle!==2||!!CROPS[p.crop].regrow)&&finite(p.plantedAt)&&finite(p.bonusHours)&&Array.isArray(p.watered)&&p.watered.every(n=>[0,1,2].includes(n))&&['variant','variantSeed','revealed','protected'].every(k=>typeof p[k]==='boolean')&&strings(p.sources)&&participants(p.participants)&&(p.durationHours===undefined||Number.isFinite(p.durationHours)&&p.durationHours>0));
  }
  const api={create,ensure,sync,act,valid,CROPS,OPEN,MAX_BOXES,open,ACTORS,HOUR,progress,stage,duration,available};root.SymiaGarden=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
