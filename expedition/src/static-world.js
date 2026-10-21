/* Three host-owned vector placeholders. They are neither world illustrations nor collectible CG. */
(function(root){'use strict';
const ID='world-static-v1',slots=['departure','discovery','homeward'];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palettes=[['#eee8d6','#c2cbb8','#849a8b','#f7d89b'],['#e4ece5','#a6bfb2','#657f78','#f6e8b7'],['#e6dfe8','#b3aabe','#7c8396','#eecfa1']];
const pictures=palettes.map((c,i)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 700"><rect width="1600" height="700" fill="${c[0]}"/><circle cx="${340+i*460}" cy="${170+i*30}" r="70" fill="${c[3]}"/><path d="M0 470 240 230 450 420 770 190 1100 440 1360 260 1600 430V700H0Z" fill="${c[1]}"/><path d="M0 550 320 430 600 540 950 400 1260 530 1600 450V700H0Z" fill="${c[2]}"/><path d="M610 700 780 540 800 500 830 540 1000 700" fill="${c[0]}" opacity=".55"/><path d="M0 590Q400 540 800 600T1600 580V700H0Z" fill="${c[0]}" opacity=".12"/></svg>`));
function check(p){
 const fail=()=>{throw Error('Invalid static world package');},str=x=>typeof x==='string'&&x.length>0&&x.length<=6000;
 if(!/^world-draft-[a-f0-9]{32}$/.test(p?.id)||p.version!==1||p.mode!=='solo-reading'||p.legacySaveCompatible!==false||p.rewardId!==null||p.rewardNode!==null||p.rewardQuantity!==0||JSON.stringify(p.participants)!=='["potion-maker"]'||!str(p.title)||!str(p.worldName)||!str(p.returnShare))fail();
 if(!/^[a-f0-9]{64}$/.test(p.sourceSha256)||!/^[a-f0-9]{64}$/.test(p.packageSha256)||!Array.isArray(p.nodes)||p.nodes.length<5||p.nodes.length>8||p.worldId!==p.id+'-world')fail();
 if(p.schedule?.version!==1||p.schedule?.durationMs!==0||JSON.stringify(p.schedule?.nodeOffsetsMs)!=='[]'||JSON.stringify(p.assets)!==JSON.stringify(slots.map(id=>({id,kind:'shared-placeholder'}))))fail();
 const v=p.presentation;
 if(v?.rendererId!==ID||JSON.stringify(v.backgroundSlots)!==JSON.stringify(slots)||!v.ui||Object.keys(v.moments||{}).length!==p.nodes.length)fail();
 p.nodes.forEach((n,i)=>{
  const m=v.moments[n.id],prefix=p.id;
  if(n.id!==prefix+'-n'+String(i+1).padStart(2,'0')||n.eventId!==prefix+'-e'+String(i+1).padStart(2,'0')||!new RegExp('^'+prefix+'-l0[1-5]$').test(n.location_id)||!str(n.title)||!str(n.narration)||n.choices||n.effects||n.interactions)fail();
  if(!m||m.eventId!==n.eventId||m.locationId!==n.location_id||m.backgroundSlot!==slots[Math.min(2,Math.floor(i*3/p.nodes.length))]||m.image||m.assetId||m.reward||!str(m.text)||!str(m.place))fail();
 });
 return true;
}
const is=p=>p?.presentation?.rendererId===ID;
function scene(t){const p=root.SymiaForge.forTrip(t),m=p.presentation.moments[root.SymiaForge.node(t).id],i=slots.indexOf(m.backgroundSlot);return {slot:slots[i],url:pictures[i],label:m.place,world:p.worldName};}
function stage(p,staticMode){return `<div class="travel-stage placeholder-travel-stage" data-travel-stage data-placeholder-stage data-state="${p.visualState}" data-static="${!!staticMode}" role="group" aria-label="${esc(p.placeholderScene.world)}的旅行示意舞台"><img class="placeholder-scenery" src="${p.placeholderScene.url}" alt="共用背景草图"><div class="placeholder-actor" aria-label="希莱斯">${['asset:travel-loop-walk-a','asset:travel-loop-walk-b','asset:travel-loop-walk-c','asset:travel-loop-walk-d'].map((f,i)=>`<img style="--frame:${i}" src="${f}" alt="">`).join('')}<img class="placeholder-idle" src="asset:travel-loop-idle" alt=""></div><span class="placeholder-label">共用示意背景 · 地点以文字为准</span><span class="journey-speech" data-journey-speech="potion-maker" hidden></span></div>`;}
function view(s,h){
 const F=root.SymiaForge,t=s.trip,p=F.forTrip(t),n=F.node(t),m=p.presentation.moments[n.id],i=t.forge.index,active=t.phase==='exploring',last=i===p.nodes.length-1;
 return `<section class="static-world-journey" data-static-world><header><div><span class="static-world-eyebrow">随机世界 · 文字旅行</span><h1>${esc(p.worldName)}</h1><p>${esc(p.title)} · 希莱斯独行</p></div>${h.button('返回家园','home','','text-button')}</header><figure class="static-world-scene"><img src="${pictures[slots.indexOf(m.backgroundSlot)]}" alt="${['启程','途中','归途'][slots.indexOf(m.backgroundSlot)]}的共用示意背景"><figcaption>共用占位背景 · 地点以文字为准</figcaption></figure><article class="static-world-prose" data-reading-node="${esc(n.id)}"><div class="static-world-meta"><span>${esc(m.place)}</span><span>${i+1} / ${p.nodes.length}</span></div><h2>${esc(n.title)}</h2>${n.narration.split('\n').filter(Boolean).map(line=>'<p>'+esc(line)+'</p>').join('')}<footer>${active?h.button(last?'结束旅行，回家':'继续旅程 →',last?'forge-return':'forge-next',`data-journey="${esc(t.id)}" data-node="${esc(n.id)}" ${h.submitting?'disabled':''}`,'primary'):t.phase==='returned'?root.SymiaForgeView.settlement(t,h):'<p>这段见闻已保存。</p>'}<small>阅读进度自动保存 · 本次不发放物品</small></footer></article>${h.button('旅行足迹','travel-footprints','','text-button')}</section>`;
}
root.SymiaStaticWorld={ID,slots,is,check,view,scene,stage};if(typeof module!=='undefined')module.exports=root.SymiaStaticWorld;
})(globalThis);
