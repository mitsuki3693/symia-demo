/* Reader-facing expedition copy. Stable action IDs and rewards live in slice.js. */
(function(root){
'use strict';
const VERSION=4,PLACE='风车遗迹处';
const NAMES={'potion-maker':'希莱斯',fionn:'菲恩'};
const TITLES={entrance:'灰月湿地入口',salt:'通往温室的小沟',greenhouse:'湿地温室',marks:'风车遗迹处的石阶',guardian:'风车遗迹处的入口',device:'风车遗迹处的水渠旁',mill:PLACE};
const ACTIONS={inspect_water:'看看积水为什么排不出去',inspect_roots:'看看薄荷的根有没有受损',brace_frame:'扶稳摇晃的种植架',clear_channel:'清开堵住排水口的东西',check_level:'看看温室的水退了没有',record_recovery:'记下薄荷和土壤的恢复情况',compare_marks:'看看水面以前到过哪里',trace_feed:'沿着水槽看看水流向哪里',record_device:'检查挡水装置，记下发现',trace_outlet:'跟着外面的水流看看',record_outlet:'记下水流通往温室的方向'};
const OBJECTS={plant:['薄荷','根系（植物埋在土里的根）','支架（托住种植盆的架子）','木板','排水口（积水流出去的小沟口）','水位刻线（用来记录水有多高的短线）'],revisit:['薄荷','根系（植物埋在土里的根）','浅渠（温室边排水的小沟）','水位刻线（用来记录水有多高的短线）'],inside:['闸轴（连接挡水板的转轴）','水位刻线（用来记录水有多高的短线）','进水槽（水沿着它流入的石槽）','检修标记（修理装置时留下的记号）'],outside:['外渠（风车遗迹处外面的水沟）','水位刻线（用来记录水有多高的短线）','盐痕（水退后留下的白色盐印）','岸石（水沟旁的石头）']};
const AUTHORING={
 inside:{fixed_observations:{compare_marks:'旧水印比现在的水面高；只能证明水曾经更高。',trace_feed:'沿石槽观察，可以看见它接进通往温室的小沟；水流没有倒流或被堵住。',record_device:'挡水板停在半开处，连接它的转轴歪贴支架，有刮擦痕迹，可能卡住；只观察记录，不转动或试拉装置。'},allowed_conflict:'可以创造观察角度不方便、旧印子不易分辨、角色想先看不同东西等局部困难。不要创造新的堵塞、倒流、断流或完全不同的损坏。'},
 outside:{fixed_observations:{trace_outlet:'外面小沟的水流向温室。',compare_marks:'岸石的旧水印高于当前水面；不能凭此判断退水原因。',record_outlet:'可确认这段小沟通往温室，但不能据此编造内部的情况。'},allowed_conflict:'只能围绕岸石、盐印、水面细节与观察分工创作。不能越过守卫或看见墙后，更不能预知里面有怎样的装置。'},
 plant:{fixed_observations:{inspect_water:'温室出水的小沟口被东西堵住了。',inspect_roots:'薄荷的根还没烂，但不能继续泡着。',brace_frame:'扶稳松动的种植架，便于清理。',clear_channel:'清开沟口后积水流出，薄荷仍需要恢复；不额外修理其他地点。'},allowed_conflict:'在碎枝、木板、种植架、排水口的已有困难中安排查看角度、清理顺序与分工；不另造灾害或病因。'},
 revisit:{fixed_observations:{check_level:'温室的积水已经退下，水面低于上次留下的水印。',inspect_roots:'根旁已经露出湿土，叶子仍未完全恢复。',record_recovery:'记录上次清理后的恢复变化，不再次排水或重复发奖励。'},allowed_conflict:'围绕怎样比较记录、查看根旁土壤、是否继续等待展开，不把温室写成再次被淹。'}
};
const EVENTS={
 plant:{title:'水被堵在温室里',conflict:'希莱斯蹲在薄荷旁，把垂进水里的叶子轻轻托起来。水一直泡着种植床，却没从旁边的小沟流出去。沟口堆着碎枝，旁边的木板松了，连着种植架轻轻晃动。得先看清哪里堵住了，再找个稳妥的办法清开。',steps:[['inspect_water','map','沿着积水看一圈，找出水原本应该流出去的地方。'],['inspect_roots','potion-maker','轻轻拨开根旁的叶子，看看薄荷的根有没有受损。'],['brace_frame','map','先扶稳种植架，清理时就不会把薄荷一起碰倒。'],['clear_channel','potion-maker','把堵在小沟口的东西清开，让积水有路流出去。']],lines:[['potion-maker','我先看看薄荷的根伤没伤。水也得赶紧排出去，不能再这么泡着。'],['fionn','那我看看水堵在哪儿，再扶住这个架子。薄荷交给你。']]},
 revisit:{title:'再看看温室里的薄荷',conflict:'上次清开的小沟仍有水慢慢流过。希莱斯在种植床边停下，菲恩翻到了上次的记录。他们这次不用重新清理，只要看看积水是否退下、薄荷的根还泡不泡在水里。',steps:[['check_level','map','找到上次水面留下的印子，看看现在的水是不是更低了。'],['inspect_roots','potion-maker','拨开根旁的叶子，看看土里还积不积水。'],['record_recovery','map','把今天看见的变化记下来，留作下次观察的依据。']],lines:[['fionn','我把上次水淹到的位置画下来了。看看我们有没有白忙。'],['potion-maker','先让我看看薄荷。水退了是好事，叶子可没那么快缓过来。']]},
 inside:{title:'水从挡水板下流过',conflict:'穿过风车遗迹处的入口，水声从墙边的石槽里传来。石槽上横着一块挡水板，原本可以抬起或放下，让水通过或停住。板旁有一根连接它的转轴，墙上还刻着几道记录水有多高的短线。水正从板下流过；他们还得看清水流向哪里，以及装置有没有损坏。',steps:[['compare_marks','map','看看石壁上的旧水印和现在的水面，弄清水是不是比以前低了。'],['trace_feed','potion-maker','沿着能看见的石槽观察水流，确认它流向哪里。'],['record_device','map','看看挡水板和转轴有没有损坏，把水流方向与看到的问题一起记下。']],lines:[['fionn','墙上这些短线是记水有多高的吧？我先看看，水以前到过哪儿。'],['potion-maker','好，你去查看墙壁上的刻度线。我沿着石槽看看水流向哪里，先不碰挡水板。']]},
 outside:{title:'先看看风车遗迹处外面的水沟',conflict:'守卫没有离开入口，他们便沿着风车遗迹处外面的水沟蹲下。水贴着岸边的石头缓缓流动，石头上留着一层白色盐印。入口仍被守着，里面有什么还没看清。不过沿着眼前的水沟走走，也许能查到水的去向。',steps:[['trace_outlet','potion-maker','看看水带着的细小碎屑往哪边漂，沿岸边确认方向。'],['compare_marks','map','看看岸石上水曾经留下的印子，比较它和现在水面的位置。'],['record_outlet','map','把看得见的水沟画下来，记清它是不是通往温室。']],lines:[['fionn','都走到风车遗迹处了，进去看一眼都不行……那我先把外面这段画下来。'],['potion-maker','好，我陪你看看。至少弄清这些水会流到哪儿。']]}
};
const RESULTS={drained:'堵在沟口的东西清开后，水终于流出了温室。薄荷的根不再一直泡在水里，但还需要几天恢复。眼前的积水暂时解决了。薄荷能不能恢复，还要下次再来看看。',recovering:'和上次相比，温室的水已经退下，薄荷根旁也露出了湿土。上次的清理确实起了作用。两人记下了变化，留下薄荷慢慢恢复。',device:'他们在风车遗迹处确认：这条水槽通向温室，挡水板旁的转轴也有被卡住的迹象。他们记下了水流方向和受损的位置。装置还没有修好；它是不是温室积水的原因，现在也不能下结论。',outlet:'风车遗迹处外面的水沟确实通向温室，这一点已经记在图上。守卫仍拦着入口，这次没有进去调查，记录也只补上了看得见的这一段。',deferred:'他们把已经看见的情况记下来，决定这次先不继续。没做完的部分留待下次，眼前的问题也还没有解决。'};
// Stored world state is not automatically known to the travelling characters.
function knowledge(w){const d=w.discovered||[],e=w.evidence||[];return {greenhouse:d.includes('greenhouse')||w.greenhouse!=='waterlogged',greenhouseApproach:d.includes('salt')||e.includes('salt'),marks:d.includes('marks')||e.includes('old_marks'),guardian:d.includes('guardian')||w.guardian==='calmed',device:e.includes('device'),connection:e.includes('device')||e.includes('outlet')};}
function opening(w){const k=knowledge(w),parts=['薄雾贴着草地。远处能看见温室的玻璃屋顶，另一边露出风车遗迹处停转的叶片。'];if(k.greenhouse)parts.push(w.greenhouse==='waterlogged'?'上次看到的温室积水还没有处理，薄荷的根仍需要照看。':w.greenhouse==='drained'?'温室的小沟已经清开，薄荷有没有好转，还需要回去看看。':'上次复访时，温室的积水已经退下，薄荷正在恢复。');else if(k.greenhouseApproach)parts.push('上次在温室外看到了积水，还没有进去检查。');if(k.device)parts.push(w.chapter?.repaired?'风车遗迹处的卡点已经排除，挡水板能调节流向温室的水。':'风车遗迹处的记录也还在：挡水装置可能卡住了，尚未修理。');else if(k.marks)parts.push('上次在风车遗迹处的石阶旁看到了旧水印，水为什么退下，还没有查清。');return parts.join('');}
function departure(w){const k=knowledge(w);return [['potion-maker',k.greenhouse?(w.greenhouse==='waterlogged'?'先去看看积水，植物的根系泡久了会出问题。':'温室上次排过水了。我想回去看看，薄荷的根还泡不泡在水里。'):k.greenhouseApproach?'温室外面有积水。我想进去看看，植物的根系泡久了会出问题。':'那边像是座温室。我想先去看看，里面还种着什么。'],['fionn',k.device?'记录里写着，风车遗迹处的挡水装置可能卡住了。这次我想沿通往温室的小沟看看，还有哪里没查过。':k.marks?'风车遗迹处的石阶上有水位刻度线。水为什么退了，我还想查查。':'右边能看见风车遗迹处的叶片。我有点想去看看……先选一边吧。']];}
// General work is interchangeable; diagnosing roots belongs to the potion maker.
function actorsFor(action,ps){return action==='inspect_roots'?ps.filter(p=>p==='potion-maker'):[...ps];}
function plan(kind,ps){const p=EVENTS[kind],f=ps.includes('fionn')?'fionn':'potion-maker';return {title:p.title,conflict:ps.includes('fionn')?p.conflict:p.conflict.replace('，菲恩翻到了上次的记录','，翻开上次的记录').replaceAll('他们','希莱斯'),steps:p.steps.map(([action,actor,detail])=>({action,actor:actor==='map'?f:actor,detail})),lines:p.lines.filter(l=>ps.includes(l[0]))};}
function observation(kind,action,actor,ps){const name=NAMES[actor],f=actor==='fionn',findings={
 inspect_water:[`${name}沿着种植床走到小沟口。水在这里打着小旋，却流不出去；堵在出口的东西把水留在了温室里。`,f?'出口在这儿。先把这里清开，水才有地方走。':'找到堵住的地方了。先让水流出去，再照看薄荷。'],
 inspect_roots:[kind==='revisit'?`${name}拨开薄荷根旁的叶子。根边已经露出湿土，不再被积水淹着；垂下的叶子还没有完全挺起来。`:`${name}拨开薄荷根旁的叶子。根还没有烂，但一直浸在水里，泥土也湿得发黏。`,f?'还来得及。先别让它继续泡着。':kind==='revisit'?'根没再泡着了。叶子恢复要慢些，别急。':'根还好。把水排出去，它才有机会缓过来。'],
 brace_frame:[`${name}扶稳摇晃的种植架。木板没有再碰到薄荷，清理沟口时也不用担心把种植床一起带倒。`,f?'扶住了。你清沟口，我在这儿撑着。':'这边稳了，可以清理沟口了。'],
 clear_channel:[`${name}把堵在小沟口的东西清开。原本困在种植床边的水有了出口，细细一股流进小沟。薄荷叶下，湿漉漉的泥土逐渐露出来。`,f?'终于流动了。刚才这儿可一点都不肯往外走。':'好了，水能出去了。薄荷先留在这里，等它慢慢恢复。'],
 check_level:[`${name}找到种植床边上次留下的水印。那道印子仍在高处，今天的水却已经退到了下面，露出一圈湿土。`,f?'上次水淹到这儿，现在退下去了。没白忙。':'水退下去了，看来上次清理的小沟还通着。'],
 record_recovery:[`${name}记下今天的水面位置，希莱斯则查看薄荷根边的湿土。积水已经退下，叶子还需要继续观察。`.replace('希莱斯记下今天的水面位置，希莱斯则','希莱斯记下今天的水面位置，又'),f?'这回我把位置画清楚。下次一看，就知道有没有再积水。':'今天先记到这里。薄荷不用急着搬，让它缓一缓。'],
 compare_marks:[kind==='inside'?`${name}蹲到石槽旁。石壁上的旧水印高过现在的水面，旁边的短线只是记录高度的标记。这说明水曾经涨得更高，却不能说明水为什么退了。`:`${name}看向岸边的石头。旧水印留在高处，眼前的水面却低了一截：水以前曾经涨到上面，现在已经退下。`,f?'水以前到过这里。至于怎么退的……还得再找找。':'能看出水退过，原因还说不准。继续看看吧。'],
 trace_feed:[`${name}沿着风车遗迹处能看见的石槽望过去。水从挡水板下面流出，接进外面那条朝温室延伸的小沟。两段水流是相通的。`,f?'接上了。这槽里的水，会流进通往温室的那条沟。':'水往温室那边去了。先记住这个方向，还不能说积水就是它造成的。'],
 record_device:[`${name}查看了风车遗迹处的挡水装置。挡水板停在半开的地方，旁边的转轴歪贴着支架，留有刮擦的痕迹，像是卡住了。再往外看，板下的水沿石槽接进通往温室的小沟。${name}把这两处发现一并记下，没有试着强行转动装置。`,f?'转轴像是卡住了。位置我记下，先别硬拧。':'这里有卡住的迹象。今天先记下受损的位置，别急着动手修。'],
 trace_outlet:[`${name}看着水里一小片碎屑慢慢漂过岸石。水没有流向风车遗迹处，而是沿着外面的沟往温室方向走。`,f?'看那片碎屑，往温室那边漂了。':'水是往温室方向流的。我们沿着岸边再看看。'],
 record_outlet:[`${name}沿着风车遗迹处外面的岸边，认出了通向温室的小沟，又把能看见的这一段画在记录上。入口仍被守卫挡着，墙后还没调查过的地方暂时留白。`,f?'这段通往温室，我画好了。墙里面的先空着，总不能靠猜。':'外面的水流方向清楚了。墙后是什么情况，等能进去时再查。']
};const [text,line]=findings[action];return {text,lines:ps.includes(actor)?[[actor,line]]:[]};}
const api={VERSION,PLACE,TITLES,ACTIONS,OBJECTS,AUTHORING,EVENTS,RESULTS,knowledge,opening,departure,actorsFor,plan,observation};root.SymiaExpeditionText=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
