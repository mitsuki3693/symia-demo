/* Authored world catalogue. Preview choices never award expedition resources. */
(function(root){
'use strict';
const MAPS=[{id:'eiros',world:'Eiros',name:'灰月湿地',status:'完整章节'}, {id:'fionn-home',world:'维岚 · 菲恩的原生世界',name:'回潮原野',status:'下一世界 · 序章试玩'}];
// User-confirmed premise: natural and magical tides change roads; cartographers
// repeatedly correct them. Names and this episode are authored prototype lore.
const CANON_READY=true;
const PREVIEW=[
 {name:'折风驿站',title:'这张图，得重新画了',text:'菲恩把湿地手记放回包里，领着希莱斯走出维岚的界门。折风驿站门前的路牌被转向了东边，旧图上的直路却通向一片浅水。“昨天能走的地方，今天不一定还在。”他蹲下来，比较石阶上新旧两层潮痕。这片原野的道路受海潮与魔法潮汐共同影响；地图总要有人来更新。',choice:'沿路标前往回潮岔口'},
 {name:'回潮岔口',title:'选一条亲眼确认的路',text:'浅水正在退去，一串路石从水下露出来；另一边的高地有连续的旧路桩。菲恩没有立刻改图：“下面近，但现在看见，不代表一会儿也能走。上面绕一点，路基倒还连着。”希莱斯站在干燥的岸边，等你决定先核对哪条路。',choice:'选择调查路线'},
 {name:'定标台',title:'在地图上写下条件',text:'抵达定标台后，菲恩把刚才走过的路画进手记。他没有擦掉旧线，而是在旁边补上观察时的潮位与路况。希莱斯按住被风掀起的纸角：“所以，地图上还要写什么时候能走？”“嗯。能把人带回来，才算画对了。”',choice:'收好修订手记，完成序章'}
];
const ROUTES={tide:{name:'潮退近路',text:'你们沿露出的路石走了一小段，前方最后两块石头仍断在水里。菲恩停下来，给这条线画了虚线：当前潮位下未连通，不能当通路。你们沿原路退回，再从高地抵达定标台。'},ridge:{name:'稳定高路',text:'你们沿高地逐根核对路桩。虽然绕过了一段浅湾，路基始终连续。菲恩把这条线画成实线，注明：本次观察可通行；下次潮汐变化后仍需复核。低处的路没有亲自走过，暂时留白。'}};
const state=s=>s.atlas||{version:1,selected:'eiros',preview:0,finished:false};
const selected=s=>state(s).selected;
const unlocked=s=>!!s.marsh?.chapter?.completed;
function valid(v){return v===undefined||!!v&&v.version===1&&MAPS.some(m=>m.id===v.selected)&&Number.isInteger(v.preview)&&v.preview>=0&&v.preview<PREVIEW.length&&typeof v.finished==='boolean'&&(!v.finished||v.preview===2)&&(v.route===undefined||v.route===null||Object.hasOwn(ROUTES,v.route))&&(v.preview<2||Object.hasOwn(ROUTES,v.route));}
function act(s,a){
 if(!a.type.startsWith('WORLD_'))return false;
 if(a.type==='WORLD_SELECT'&&MAPS.some(m=>m.id===a.id)){s.atlas={...state(s),selected:a.id};return true;}
 // A preview cannot advance while the party is away or has unpacked rewards pending.
 if(!CANON_READY||!unlocked(s)||s.trip&&s.trip.phase!=='complete'||s.kitchen&&s.kitchen.status!=='completed')return true;
 const w=state(s);if(w.selected!=='fionn-home')return true;
 if(a.type==='WORLD_PREVIEW_NEXT'&&a.step===w.preview&&!w.finished){if(w.preview===1&&!Object.hasOwn(ROUTES,a.route))return true;s.atlas={...w,preview:Math.min(2,w.preview+1),route:w.preview===1?a.route:w.route||null,finished:w.preview===2};}
 if(a.type==='WORLD_PREVIEW_RESET')s.atlas={...w,preview:0,route:null,finished:false};
 return true;
}
const api={MAPS,PREVIEW,ROUTES,CANON_READY,state,selected,unlocked,valid,act};root.SymiaWorlds=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
