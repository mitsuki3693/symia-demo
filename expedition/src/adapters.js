(function(root){
  'use strict';
  const KEY='symia.expedition.prototype.v2';
  const api=()=>new URLSearchParams(location.search).get('embed')==='home'?'/expedition-api':'/api';
  class LocalStorageAdapter{
    constructor(key=KEY){this.key=key;this.error='';this.queue=Promise.resolve();}
    load(){try{const raw=localStorage.getItem(this.key);if(!raw)return null;const s=root.SymiaEngine.normalizeState(JSON.parse(raw));if(!root.SymiaEngine.validateState(s))throw Error('存档格式不兼容。原数据未覆盖，可先导出原始存档。');return s;}catch(e){this.error=e.message;return null;}}
    save(s){if(this.error)return false;try{localStorage.setItem(this.key,JSON.stringify(s));return true;}catch{this.error='浏览器无法保存。请导出存档，下次打开时导入。';return false;}}
    transact(reducer){
      const task=()=>{const previous=this.load();if(this.error)throw Error(this.error);const next=reducer(previous);const changed=JSON.stringify(next)!==JSON.stringify(previous);if(changed&&!this.save(next))throw Error(this.error||'保存失败');return {previous,next,changed};};
      const run=()=>globalThis.navigator?.locks?globalThis.navigator.locks.request('symia-garden-state',task):task();
      const result=this.queue.then(run,run);this.queue=result.catch(()=>{});return result;
    }
    raw(){try{return localStorage.getItem(this.key);}catch{return null;}}
    reset(){localStorage.removeItem(this.key);this.error='';}
  }
  class DialogueAdapter{
    constructor(){this.ready=false;this.model='';this.controller=null;}
    async status(){if(location.protocol==='file:')return false;try{const r=await fetch(api()+'/status',{signal:AbortSignal.timeout(2500)});if(!r.ok)return false;const d=await r.json();this.ready=d.ready===true;this.model=d.model||'';}catch{this.ready=false;}return this.ready;}
    cancel(){this.controller?.abort();}
    async reply(context,text){
      if(context.mode?.startsWith('slice_'))context=root.SymiaVoice.forTurn(context,text);
      this.cancel();const controller=new AbortController();this.controller=controller;const timeout=setTimeout(()=>controller.abort(),65000);
      try{
        let data;
        for(let attempt=0;attempt<2;attempt++){
          const r=await fetch(api()+'/dialogue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context,text}),signal:controller.signal});
          data=await r.json();
          const badEvent=context.mode==='slice_event'&&r.ok&&!root.SymiaSlice.validPlan(data.event,context.event_kind,context.participants);
          if(context.mode==='slice_event'&&attempt===0&&(r.status===400||badEvent)){
            context={...context,repair_request:{reason:badEvent?'步骤、行动者或收束不符合当前合同。':data.error,format:'最外层只有 event；event 仅含 title/conflict/steps/lines。steps 的每项仅含 action/actor/detail。lines 是 [角色ID,台词] 的数组。不要 narration、messages、rewards 或额外字段。'}};
            text=root.SymiaVoice.EVENT_REQUEST+' 上次提案未被采用，请重新生成符合合同的事件。';continue;
          }
          if(!r.ok)throw Error(data.error||'连接失败，请重试。');
          if(context.mode==='slice_event'){if(badEvent)throw Error('事件提案未符合当前分工或行动范围，尚未采用。');return data.event;}
          break;
        }
        if(context.mode?.startsWith('slice_')){
          const lines=data.messages?.map(m=>[m.speaker,m.text]);if(!Array.isArray(lines)||!lines.length||lines.length>6||lines.some(l=>!context.participants.includes(l[0])||typeof l[1]!=='string'||!l[1].trim()||l[1].length>900)||typeof data.narration!=='string'||data.narration.length>1200)throw Error('本轮对白不完整。');
          if(context.mode==='slice_decision'&&(!data.decision||!context.available_actions.some(x=>x.id===data.decision.choice)||!context.participants.includes(data.decision.actor)||typeof data.decision.reason!=='string'||!data.decision.reason.trim()||data.decision.reason.length>350))throw Error('这一步的提议超出授权范围。');lines.narration=data.narration;lines.decision=data.decision;return lines;
        }
        const story=context.mode==='story';
        if(!Array.isArray(data.messages)||!data.messages.length||data.messages.length>(story?6:context.participants.length)||data.messages.some(m=>!context.participants.includes(m.speaker)||typeof m.text!=='string'||!m.text.trim()||m.text.length>(story?900:2000))||story&&(typeof data.narration!=='string'||!data.narration.trim()||data.narration.length>1200))throw Error('回复格式不完整，已保留原有对白。');
        if(context.autonomy&&(!data.decision||!context.autonomy.choices.includes(data.decision.choice)||!context.autonomy.next.includes(data.decision.next)||!context.participants.includes(data.decision.actor)||typeof data.decision.inspected!=='boolean'||typeof data.decision.reason!=='string'||!data.decision.reason.trim()||data.decision.reason.length>350))throw Error('自主行动不在当前可执行范围，将按角色倾向继续。');
        const lines=data.messages.map(m=>[m.speaker,m.text]);lines.narration=story?data.narration:'';lines.decision=data.decision;return lines;
      }finally{clearTimeout(timeout);}
    }
  }
  function contextFor(s,index,place){
    if(s.trip?.slice||place==='home'&&s.history.some(t=>t.slice))return root.SymiaSlice.context(s,place,Date.now()+s.clockOffsetMs);
    const C=root.SymiaContent,t=s.trip,people=place==='home'?root.SymiaEngine.members(s.party.fionn):(t?.participants||root.SymiaEngine.members(s.party.fionn));
    const S=root.SymiaStories,n=S.node(t,index),e=t?.nodes[index],story=place!=='home'&&e?.visited&&S.byId(t?.story?.id);
    return {mode:story?'story':'dialogue',story:story?{id:story.id,title:story.title,premise:story.premise,chapter:n.title,continuity:S.bridge(t,index),known_clue:e.inspected?(t.participants.includes('fionn')?n.inspect:n.soloInspect).map(l=>l[1]):[],current_result:e.choice?n.choices.find(c=>c.id===e.choice).reply:null,available_choices:e.choice?[]:n.choices.map(c=>({id:c.id,label:c.label,consequence:c.detail})),battle:index===1&&t.battle?{status:t.battle.status,log:t.battle.log}:null}:null,
      conversation:story?t.story.turns.filter(x=>t.auto?t.nodes[x.node].visited:x.node<=index).slice(-3).map(x=>({location:C.NODES[x.node].name,user:x.user,narration:x.narration,lines:x.lines})):[],
      activity_id:place==='home'?(s.kitchen?.id||t?.id||'home'):(t?.id||'preview'),location:place==='home'?'Symia 家园':n.name,
      participants:people,phase:place==='home'?(s.kitchen?.status||'at-home'):(t?.phase||'not-started'),
      environment:place==='home'?'家园的窗边、地图桌与厨房':n.environment,
      user_choice:e?.visited?n.choices.find(c=>c.id===e.choice)?.label||'尚未选择':'尚未抵达',
      inspected:!!e?.inspected,confirmed_items:place==='home'?s.inventory:(t?.loot||{}),
      completed_nodes:t?t.nodes.map((x,i)=>x.visited&&(place==='home'||t.auto||i<=index)?{location:C.NODES[i].name,choice:S.node(t,i).choices.find(c=>c.id===x.choice)?.label||null}:null).filter(Boolean):[],
      home:place==='home'?{plant:s.home.plant?.status||'empty',pet:!!s.home.pet,map:!!s.home.map,tea:s.kitchen?.status||null}:null};
  }
  root.SymiaAdapters={LocalStorageAdapter,DialogueAdapter,contextFor,STORAGE_KEY:KEY};
})(globalThis);
