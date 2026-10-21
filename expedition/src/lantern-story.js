/* Authored chapter. Only visited scenes enter journals or model context. */
(function(root){
'use strict';
const N={};
const node=(id,location,title,text,options,lines=[])=>N[id]={location,title,text,options,lines};
const choice=(id,label,next,hint='')=>({id,label,next,hint});
node('opening','entrance','灰月湿地 · 第七盏灯',
'你出门前说，家里的窗台有点空。希莱斯便想起灰月湿地的荧光薄荷：等它长起来，夜里不用点灯，也能看见一点绿。\n菲恩带来了那张尚未画完的湿地地图。他一边走，一边用铅笔补上暮色里的灯光。画到第七个小点时，笔忽然停了。\n他低头数了一遍图上的建筑：一座温室，一座风车，渡口三间小屋，还有高处那间旧旅店。六处。\n芦苇深处，却亮着第七盏灯。那盏灯比窗户低，光在水面上一动不动。',
[choice('count','和菲恩一起核对灯的位置','count','那盏多出来的灯，停在风车下面')],
[['fionn','……我是不是漏画了一间房？'],['potion-maker','本来只是来找薄荷的。好吧，先看看。']]);
node('count','marks','多出来的那一点光',
'风推开一层芦苇，你终于看清：灯下面没有窗框，也没有屋檐。似乎有谁站在水边，始终没有挪动。\n左手的小沟通向温室，水已经漫过门槛；右边的窄路绕向风车，灯光就在桥头。菲恩把地图压在膝上，没有急着把第七个点擦掉。',
[choice('greenhouse','先看看温室里的积水','greenhouse','沿着小沟，寻找水排不出去的原因'),choice('light','先走近提灯的人','guardian','沿桥边的小路过去，别惊动它')],
[['fionn','这次可能不是地图错了。']]);
node('greenhouse','greenhouse','薄荷的根还泡在水里',
'推开温室门，一阵潮湿的草叶气味迎面而来。木架腿上结着白色盐痕，几只花盆已经浮了起来。希莱斯卷起袖子，把歪倒的种植盘托回高处。\n你顺着小沟拨开落叶，出口其实是通的。水缓缓流出去，又被下游更高的水位顶了回来。\n靠窗的架子下压着一只旧铁盒。水尚未漫到那里。盒盖上画着一株长了笑脸的薄荷，你记住了位置，先没有翻动它。',
[choice('trace','顺着水路，查看桥头的灯','after_greenhouse','弄清下游为什么一直蓄着水')],
[['potion-maker','光清理门口没有用。下游的水退不下去，根就一直泡着。'],['fionn','风车旁有一道闸门。我们去那里看看。']]);
node('guardian','guardian','回来几位？',
'桥头站着一只小小的苔石守卫，身高刚到菲恩胸口。它两脚陷在软泥里，手臂却稳稳托着一盏旧灯。\n灯没有灯芯。一只小灯蛾蜷在里面，翅膀微微发亮，每隔很久才动一下。\n守卫把灯举向你们。它的声音像两块被雨磨圆的石头轻轻相碰。\n“回来几位？”\n你说，你们是来找薄荷的。守卫停了一会儿，又低头看了看桥柱上的木牌。\n“名字不在这里。”',
[choice('list','蹲下来，看它守着的名单','waiting','木牌上有六道勾，第七行被盐霜盖住了')]);
node('waiting','guardian','留给最后一个人',
'木牌上的名字已经模糊了。你辨出第五行写着“米娅”，旁边有一个歪歪的勾；第七行被厚厚的盐霜遮住，只露出一笔很浅的划痕。\n牌子最上方写着一句话：人齐了，就熄灯，跟大家回家。\n守卫抬手指了指桥下的低路。那条路贴着水面，通向早已空下来的渡口。\n“留给最后一个人。”\n它把灯转向低路，仿佛你们已经问完了所有问题。',
[choice('wait','问问它，已经等了多久','shoulders','它肩头的苔藓里长着两丛薄荷')],
[['fionn','还有一个人，没回来？']]);
node('shoulders','guardian','别摘',
'“从什么时候开始等的？”你问。\n守卫没有回答。希莱斯的目光落在它肩上：两丛荧光薄荷扎根在浅浅的泥窝里，长得有些歪，叶尖泛白。\n他刚伸出手，守卫便向后缩了一点。灯罩发出轻轻一声响。\n“别摘。”\n希莱斯停住，摊开空着的手。\n守卫看了看他，又看了看自己的肩膀，过了一会儿才说：\n“米娅种的。她说，不要淹着。”',
[choice('water','一起查看闸门与低路','after_guardian','先找到能保住薄荷、也能保住等待的办法')],
[['potion-maker','不摘。我只想看看，根有没有泡坏。']]);
node('sluice','device','开闸，就会淹掉那条路',
'风车已经停转，闸门的手柄却还能转动。菲恩沿两边石槽走了一圈，在图上画出水流：开闸以后，温室的积水会流进月池，但桥下那条低路也会被淹没。\n他才碰到手柄，守卫就走过来，缓慢而坚决地挡在前面。它没有举拳，只把灯抱紧了。\n“那个人要走这里。”\n雨点开始敲打风车的叶片。你们现在知道水为什么不退了，却没办法直接把闸门打开。',
[choice('box','回温室，找找留下来的记录','box','那只画着薄荷笑脸的铁盒，还在窗边')],
[['fionn','我们先不动。……你们记得温室里的盒子吗？']]);
node('box','greenhouse','一只没有带走的铁盒',
'温室里的水又高了一点。你扶住木架，希莱斯俯身把铁盒取出来。盖子锈住了，他用布垫着，试了几次才打开。\n里面有几包受潮的种子，一小截黄色蜡笔，还有一本边角卷起的本子。第一页写着“米娅的种植记录”，日期是三年前。\n纸页粘在一起。你们把它放在干燥的架子上，一页一页慢慢分开。',
[choice('daily','先读薄荷旁边的小字','diary','字写得很认真，几处被泥手印盖住'),choice('drawing','先翻开夹着黄色蜡笔的那页','drawing_first','纸上画着一排手拉手的小人')]);
node('diary','greenhouse','它今天也帮忙了',
'“今天风很大，它帮我举着晒种子的布，一直举到吃饭。它说它不用吃饭，可是我也给它留了一个位置。”\n下面几行写得比前面大：\n“我给它种了两盆头发！它一直说痒。我说是肩膀，不是头发，它还是很高兴。”\n菲恩看看画里的薄荷，又望向窗外。桥头的灯仍然亮着。\n后一页记着一次涨水：“大家要搬去高地。它说，等人齐了就来。”纸边被水泡得透亮，后面的日期读不清了。',
[choice('picture','展开最后一张画','drawing','那一排小人旁边，还站着一个石头做的身影')]);
node('drawing_first','greenhouse','纸上也有七盏灯',
'你小心展开夹着蜡笔的纸。一排歪歪扭扭的小人，每个人手里都有一盏黄色的灯。\n六个人旁边，还画着一个方方的石头身影，肩上长着两丛绿草。它的手被画得很大，正牵着最小的女孩。\n希莱斯翻了翻前面的记录，读到女孩给守卫在饭桌边留位置、在它肩上种薄荷的小事。那句“等人齐了就来”，写在三年前搬去高地的那一页。',
[choice('caption','读出画下面的那句话','drawing','米娅把“七个”描了两遍')]);
node('drawing','greenhouse','我们家一共七个',
'画下面写着：\n“我们家一共七个。谁也不能落下。”\n菲恩用指尖沿着那排小人一个个数过去。数到最后，手指停在石头身影上。\n你忽然明白了木牌上空着的那一行。\n第七个人从来没有困在路的另一头。它一直站在这里，举着灯，替所有人等自己回家。\n雨水顺着玻璃往下淌。希莱斯把画托起来，等纸上的水滴落干净。',
[choice('show','把米娅的画带给守卫','refusal','让它看看，画里的第七个是谁')],
[['fionn','它把自己……漏掉了。']]);
node('refusal','guardian','我是守门人',
'你把画展开在灯旁，指给它看六个人，也指给它看那个长着薄荷的石头身影。\n守卫的目光停了一下，却很快移回低路。\n“我是守门人。要等人齐。”\n菲恩说，米娅已经把它画进去了。守卫不再看画，只用拇指慢慢擦着灯罩上同一块旧水痕。\n希莱斯没有继续解释。他把守卫肩头垂进积水的一根枝条轻轻托高。守卫这一次没有躲。\n“她说，不要淹着。”',
[choice('shelter','先替它和薄荷挡一挡雨','rain','有些事，知道答案也不等于立刻能放下')]);
node('rain','guardian','水正在上涨',
'雨忽然密起来。温室里传来一声闷响，一只泡软的木箱散了。希莱斯赶回去，把滑入水中的薄荷一盘盘托上高架；你帮忙扶住架子，袖口很快湿透。\n等你们回来，低路已只剩窄窄的一条脊。守卫把灯举得更高，自己却站得更低了。\n菲恩吸了一口气，像是要说“不会有人来了”。话到嘴边，他看见守卫肩上的两丛薄荷，又停住了。\n你把米娅的画收进防水袋。现在必须做些什么，但把灯抢走，或者重复一遍答案，都不能让它愿意离开。',
[choice('keep_light','告诉它：灯可以继续亮着','promise','我们一起换个不会被水淹到的地方等')]);
node('promise','guardian','好。灯留着',
'“不用熄灯。”你说，“我们把它带到高处，好不好？”\n守卫第一次抬头看你。\n菲恩把湿地图摊在一块石头上，用掌心护着纸。高坡上的旧旅店屋顶还在，门前有一段高于水面的石路。从那里望出去，能看见渡口。\n“她会找到吗？”守卫问。\n菲恩没有立刻点头。他看看地图，又看看雨里的路。',
[choice('check','先亲自确认去高处的路','highroad','答应带它走以前，先把路走清楚')],
[['fionn','我去看看。路口留标记，桥边也留。不能只在图上画一条线。'],['potion-maker','我留在这里。你们看好脚下。']]);
node('highroad','marks','一条真正能走的路',
'你和菲恩沿高坡走了一段。雨把土路冲出浅沟，旧旅店的屋檐仍完好，石阶却有一处被倒下的枝条遮住。\n菲恩没有用笔把整条路线一口气描实。他把未确认的转弯留空，和你商量先查哪一处。\n你们需要带着一个脚步缓慢、仍可能回头的守卫走过这里。图画得漂亮并不能代替这段路。',
[choice('steps','一起搬开石阶上的断枝','steps','先把守卫要踏过的路清出来'),choice('markers','先核对雾里容易错过的路口','markers','让后来的人也能顺着标记找到灯')]);
node('steps','marks','先腾出落脚的地方',
'菲恩托起断枝的一头，你把卡在石缝里的另一头慢慢移开。下面的石阶完整，只是覆着湿叶。\n你们清出一段能并肩通过的地方，再一起核对剩下的转弯。菲恩这才把路线描实，在旁边写下“今夜检查，雨中可行”。\n折返时，你在桥头留下箭头；菲恩在每个转弯补上相同的标记。那些箭头都朝着高处。',
[choice('return','带着确认过的路线回到桥头','handover','告诉守卫，灯会被带到哪里')]);
node('markers','marks','给后来的人留下方向',
'第一个岔口的旧路牌已经歪向低地。你扶正木杆，菲恩在背面补上朝高处的箭头，再退远几步，确认雨里仍看得清。\n你们沿标记走到旧旅店，顺手清开石阶上的断枝。菲恩把整条走过的路描实，旁边写下“今夜检查，雨中可行”。\n回到桥头，你又留下一块标记。米娅如果来到这里，会看见灯去了哪个方向。',
[choice('return','把桥头的箭头指给守卫看','handover','这次有实际走过的路，也有留下的指引')]);
node('handover','guardian','把灯交给我吧',
'你向守卫伸出手。它看着你的掌心，没有动。\n你把高处的屋顶指给它看，又让它看桥边的新箭头。灯罩里的小灯蛾动了动，微弱的光落在守卫石头做的指缝里。\n过了很久，它的手松开一点，又收紧了一点。你仍然伸着手，等它自己决定。',
[choice('carry','“我替你提着。你跟紧我。”','firststep','接过灯，先替它走出第一步'),choice('together','“灯在哪儿，我们就一起去哪儿。”','firststep','等它把灯交来，再和它并肩走')]);
node('firststep','guardian','跟上',
'灯的重量落进你的手心，比你想象中轻。守卫却像刚放下一块背了很久的石头，空着的两只手一时不知道该放在哪里。\n你往高路走了一步，回头举了举灯。\n“跟上。”\n石脚从软泥里拔出来，发出一声轻响。守卫低头看看留下的脚印，再慢慢迈出第二步。\n希莱斯护着它肩上的薄荷，菲恩走在前面，停在每个已经标好的转弯处等你们。旧旅店的屋檐越来越近。',
[choice('settle','把灯安放在高处的窗前','safe','先让守卫站稳，再处理闸门')]);
node('safe','inn','窗里有光了',
'旧旅店里没有人。你们扫开窗前的碎叶，把灯放在不会淋雨的地方。守卫站在门边，透过芦苇看向桥头；从这里，它仍然能看见那条低路。\n希莱斯留下陪它，你和菲恩沿刚走过的路回到闸门。桥边的箭头还牢牢立着。\n这一次，守卫已经不在闸前。温室的种植盘仍在水里摇晃。',
[choice('open_sluice','和菲恩一起缓缓打开闸门','flood','先让积水流向月池，观察水位再继续抬闸')]);
node('flood','device','低路沉下去了',
'手柄转动，水从闸下涌出。你们分几次抬起挡板，直到温室一侧的水位开始回落。桥下的低路一点一点沉进水面。\n高处传来石头碰地的声音。守卫冲到门外，朝着旧路迈了一步。\n你正沿高路返回，连忙举起从窗前递来的灯。光穿过雨幕，落在它眼前。守卫停住了。\n这时，桥柱上泡松的木牌脱落，沿水面旋转着漂来。希莱斯俯下身，用长树枝把它勾到岸边。',
[choice('plaque','接住木牌，擦掉最后一行的盐','seventh','水洗开了那层一直挡住字迹的白霜')]);
node('seventh','inn','第七位',
'木牌最后一行露了出来。字比前六行小，像是后来有人踮着脚补上去的。\n“提灯的那个。也要回来。”\n守卫伸出一根手指，沿着那行字慢慢摸过去。它看了看牌子，又看了看你手里的灯。\n“第七位。”\n菲恩点头：“嗯。”\n守卫站在屋檐下。肩上的薄荷滴着水，身后是亮起来的窗。它终于把一直朝向旧路的身体转了回来。\n“到了。”',
[choice('rest','把木牌放好，陪它等雨停','dawn','今夜不用再站在水里了')]);
node('dawn','greenhouse','第二天，温室还没有全好',
'你们在旧旅店歇了一夜。天亮后，雨停了。温室里的水退下去大半，泥地仍然潮湿，有几株薄荷没能撑过昨夜，旧叶上的白边也没有消失。\n希莱斯没有说“一切都好了”。他把还活着的植株挪到通风的位置，剪掉软烂的叶片。\n守卫跟着你们走进来，自然地托住种植盘，等希莱斯腾出手，又把盘子放回平稳的架子上。它做得很熟练。\n你想起米娅写过的那句话：它今天也帮忙了。',
[choice('mint','和它一起整理留下来的薄荷','mint','留下还能生长的，也记住没有救回来的')],
[['potion-maker','这几株要慢慢养。根没有泡着，就有机会。']]);
node('mint','greenhouse','别淹着',
'希莱斯从干燥的种穗里取出两粒成熟的种子，没有去碰守卫肩上的薄荷。\n你拿出种子袋，守卫伸来一只大手。它先把袋底托住，等种子放好，再笨拙而认真地把袋口折了两次。\n“别淹着。”\n你说，家里有一处空着的窗台。守卫想了一会儿，把折好的小袋推到你手边。',
[choice('take_seeds','收好这两粒种子','lamphouse','回家后，可以亲手在花园播种')]);
node('lamphouse','inn','灯屋',
'临走前，菲恩又摊开了地图。他没有擦去沉没的低路，只在旁边标上日期和水位，把昨夜确认的高路另画出来。\n旧旅店的位置，多了一个暖黄色的小点。\n“这里还叫旧旅店吗？”他问。\n守卫望着窗前的灯。你说，不如叫灯屋。\n它慢慢重复了一遍这个名字，然后用干燥的手指按住地图一角，让菲恩好把字写完。\n那块木牌被放在窗下。以后有人找来，就能读到完整的七行。',
[choice('lamp','看看已经不必彻夜举着的灯','moth','晨光里，灯罩内传来轻轻的翅声')]);
node('moth','inn','它下班了',
'你打开灯罩的小门。休息了一夜的小灯蛾爬到边缘，抖了抖翅膀。它先绕着守卫飞了一圈，又落在你的衣领上。\n菲恩压低声音：“它下班了。”\n希莱斯笑出声来。守卫认真想了想，看看空了的灯罩，又看看小灯蛾。\n“可以。”\n小灯蛾没有被关回去。窗外已经亮了，灯屋不需要谁一直站着发光。',
[choice('invite_moth','伸出手，让它自己选择同行','goodbye','它愿意跟来，就给它留一处窗边'),choice('leave_moth','把它送到灯屋窗边的薄荷上','goodbye','让它留在这里休息')]);
node('goodbye','inn','第七个小点不用擦掉',
'守卫送你们走到高路的第一个转弯，便停下来。它肩上的薄荷被晨风吹得轻轻摇晃。\n你回头看时，它已经转身朝灯屋走了。没有再下到桥头，也没有重新举起那盏灯。\n菲恩把地图递给你。图上保留着旧路，也有你们一起确认的新路；七个小点，每一个都有了自己的位置。',
[choice('home','带着地图和种子回家','window','这一段路，终于可以好好画完了')],
[['fionn','下次去我那边看看吧。有些路，潮一来就会换方向。'],['potion-maker','好。不过今天，先把种子安顿好。']]);
node('window','entrance','给窗台留下一个位置',
'回家的路上，菲恩把画着灯屋的那一页夹在最上面，提醒你不要把折好的种子袋压坏。\n你记起出发前说的那句话：窗台有点空。现在，空着的地方有了要等待的东西。\n薄荷还没有发芽。那张地图上，第七盏灯已经有了归处。',
[choice('return','回家，整理这次带回的东西','end','种子会进入花园库存，故事会留在探索日记里')]);
node('visit','inn','再来灯屋坐一会儿',
'沿高路走来，桥边的箭头仍然朝着灯屋。守卫没有站在水里；它正在窗边托着一只种植盘，让斜进来的光照到新叶。\n看见你们，它往旁边挪了挪，给地图留出一块干净的地方。那块写着七行字的木牌就在窗下。\n“回来几位？”\n这一次，它问完，也给自己留了一个位置。',
[choice('home','坐一会儿，再带着这次重逢回家','end','薄荷和灯屋都还在，旧的收获不会重复发放')]);
const active=s=>s.trip?.slice?.storyVersion==='seventh-lamp-v1';
const state=s=>s.marsh?.lantern;
function current(s){return N[s.trip?.slice?.storyNode]||N.opening;}
function start(s,now,h){let w=state(s);if(!w)w=s.marsh.lantern={version:1,node:'opening',seen:[],finished:false};const q=s.trip.slice;q.storyVersion='seventh-lamp-v1';q.storyNode=w.finished?'visit':w.node;w.node=q.storyNode;q.stage='lantern';q.location=N[q.storyNode].location;if(!w.seen.includes(q.storyNode))w.seen.push(q.storyNode);h.record(s,now,'encounter',current(s).text,current(s).lines,{title:current(s).title,chapter:'seventh-lamp-v1'});}
function scene(s){const x=current(s);return {...x,name:x.location==='inn'?(state(s).seen.includes('lamphouse')?'灯屋':'高处的旧旅店'):root.SymiaSlice.TITLES[x.location],discovery:''};}
function choices(s){return current(s).options.map(({id,label,hint})=>({id,label,hint}));}
function enter(s,id,now,h){const q=s.trip.slice,w=state(s),x=N[id];q.storyNode=id;w.node=id;if(!w.seen.includes(id))w.seen.push(id);if(q.location!==x.location)h.go(s,'lantern',x.location,now);else{q.stage='lantern';q.revision++;h.record(s,now,'encounter',x.text,x.lines,{title:x.title,chapter:'seventh-lamp-v1'});}}
function act(s,a,now,h){const t=s.trip,q=t.slice,w=state(s);if(a.type!=='SLICE_CHOOSE'||q.stage!=='lantern'||a.key!==h.key(t)||t.phase!=='exploring')return false;const c=current(s).options.find(c=>c.id===a.choice);if(!c)return true;
 h.record(s,now,'decision',`你决定${c.label}。`,[],{choice:c.id,actor:'user'});
 let next=c.next;if(next==='after_greenhouse')next=w.seen.includes('shoulders')?'sluice':'guardian';if(next==='after_guardian')next=w.seen.includes('greenhouse')?'sluice':'greenhouse';
 if(c.id==='open_sluice'){s.marsh.greenhouse='drained';s.marsh.guardian='calmed';s.marsh.chapter.repaired=true;h.record(s,now,'action','守卫已沿确认的高路抵达旧旅店。你与菲恩缓缓开闸，温室积水开始退向月池，桥下低路被水覆盖。',[],{action:'lantern_open_sluice'});}
 if(q.storyNode==='dawn'){s.marsh.greenhouse='recovering';s.marsh.chapter.verified=true;}
 if(c.id==='take_seeds'&&!s.marsh.rewardClaims.includes('lantern-seeds')){t.loot.glow_mint_seed+=2;s.marsh.rewardClaims.push('lantern-seeds');h.record(s,now,'reward','守卫把种子袋折了两次，叮嘱“别淹着”。荧光薄荷种子 ×2 已放进本次行囊。');}
 if(c.id==='invite_moth'){if(!s.home.pet&&!s.marsh.rewardClaims.includes('marsh-moth')){t.loot.marsh_pet=1;s.marsh.rewardClaims.push('marsh-moth');h.record(s,now,'reward','你摊开手，小灯蛾自己飞上行囊，愿意一起回家。');}else h.record(s,now,'action','你在窗边已有一位小灯蛾伙伴。这只在指尖歇了一会儿，便飞回灯屋的薄荷上。');}
 if(c.id==='leave_moth')h.record(s,now,'action','小灯蛾落在灯屋窗边的薄荷上。你把灯罩门留开，让它自由来去。');
 if(next==='end'){if(!w.finished){w.finished=true;s.marsh.chapter={repaired:true,verified:true,completed:true};h.record(s,now,'result','灰月湿地 · 第七盏灯。你接过灯，把等待自己的守卫带上高路。灯屋留在新地图上，米娅的木牌终于露出了完整的七行。',[],{action:'lantern_finish'});}h.returnHome(s,now);for(const p of t.participants)s.marsh.moods[p]={...s.marsh.moods[p],label:'开心',reason:'提灯的那个，也回到了大家之中。灯屋与这次同行已经留在地图上。'};return true;}
 enter(s,next,now,h);return true;
}
function progress(s){const w=state(s);return [['循着灯光','guardian'],['温室里的旧纸页','drawing'],['雨里的选择','safe'],['等到天亮','dawn'],['把故事带回家',null]].map(([label,id])=>({label,done:!!(id?w?.seen.includes(id):w?.finished)}));}
function tasks(s){const w=state(s);return progress(s).map((p,i)=>({id:['greenhouse','device','sluice','recovery','ending'][i],label:p.label,route:i===0||i===3?'plant':'ruins',done:p.done,description:p.done?'这一段经历已记在旅途日记里。':i===progress(s).findIndex(x=>!x.done)?(w?N[w.node].title:'和菲恩、希莱斯循着第七盏灯出发。'):'继续同行，新的线索会在路上出现。',proof:null}));}
function valid(w){return w===undefined||!!(w&&w.version===1&&Object.hasOwn(N,w.node)&&typeof w.finished==='boolean'&&Array.isArray(w.seen)&&w.seen.length<=Object.keys(N).length&&new Set(w.seen).size===w.seen.length&&w.seen.every(id=>Object.hasOwn(N,id))&&w.seen.includes(w.node)&&(!w.finished||w.seen.includes('window')));}
function validTrip(q){return q.storyVersion===undefined?q.storyNode===undefined&&q.stage!=='lantern'&&q.travel?.stage!=='lantern':q.storyVersion==='seventh-lamp-v1'&&Object.hasOwn(N,q.storyNode)&&['lantern','travel','returned'].includes(q.stage);}
const api={active,state,start,scene,choices,act,progress,tasks,valid,validTrip};root.SymiaLantern=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
