(function(root){
  'use strict';
  const Content = {
    VERSION:2, WORLD:{id:'eiros',regionId:'grey-moon-marsh',name:'Eiros',region:'灰月湿地'},
    TIMING:{node:60000,decision:50000,return:180000,grow:45000,cook:12000},
    CHARACTERS:{'potion-maker':{name:'希莱斯 Silas',role:'植物、茶与一点小魔法'},fionn:{name:'菲恩 Fionn',role:'地图师'}},
    ITEMS:{
      painted_reed_bookmark:{name:'手绘芦苇书签',unit:'枚',icon:'note',use:'月池边的旅人画了两道亮绿芦叶，赠给希莱斯夹书。'},
      glow_mint_seed:{name:'荧光薄荷种子',unit:'粒',icon:'leaf',use:'在花园种下，收获后可以做茶。'},
      glow_mint:{name:'荧光薄荷',unit:'份',icon:'leaf',use:'刚收获的叶片，边缘有微微的光。'},
      silver_salt:{name:'银露盐晶',unit:'份',icon:'sparkle',use:'来自浅滩，让薄荷茶的清甜更明显。'},
      windmill_page:{name:'风车残页',unit:'张',icon:'note',use:'放上地图桌，看看下一段路。'},
      marsh_pet:{name:'湿地小灯蛾',unit:'只',icon:'sun',use:'在家里的窗边，留一盏小小的灯。'}},
    NODES:[
      {id:'entrance',name:'湿地入口',short:'采种',image:'entrance',title:'把一点微光带回家',
       environment:'雾气贴着浅水流动。断裂的石阶旁，薄荷叶边缘泛着微光，几枚熟透的种子落在苔藓上。',
       action:'希莱斯俯身拢起叶片，挑出已经成熟的种子。',
       dialogue:[['potion-maker','是荧光薄荷。只捡落下来的种子就好，剩下的让它继续长。家里窗边正好有个空花盆。'],['fionn','那我记一下位置。下次来，别把旁边那株长得很像的也带回去了。']],
       inspect:[['potion-maker','闻一下，叶背有一点清凉的香气。等长成了，掐几片就能做茶。'],['fionn','我画的是这片叶子，不是随便涂的。你回去可以拿着比。']],
       choices:[{id:'gather',label:'捡起成熟的种子',detail:'带回种子 ×2，留根在原处。',items:{glow_mint_seed:2},reply:'两粒种子收进了纸袋。我留一半在原地，另一半交给你家的花盆。'},
                {id:'leave',label:'让它留在这里生长',detail:'记下位置，这次不采种。',items:{},reply:'好，就让它长在这里。我把这条路记住，下次想种的时候再来。'}],defaultChoice:'gather'},
      {id:'mill',name:'旧风车遗迹',short:'辨读',image:'mill',title:'风从缺了一角的纸上经过',
       environment:'风车叶片早已停了。木箱里压着半张旧地图，背面有一行模糊的茶饮注记；苔藓爬过了剩下的纸角。',
       action:'希莱斯扶住松动的木板；Fionn 展开地图，比对水道的方向。',soloAction:'希莱斯扶住松动的木板，仔细辨认纸页背面的草药图样。',
       dialogue:[['potion-maker','这幅叶形像刚才的薄荷。背面的配方还留着，先别急着把泥擦掉。'],['fionn','给我看看……这里不是断路，是一座桥。另一半地图应该就在对岸。']],
       inspect:[['fionn','读出来了：薄荷、银露盐，温水慢泡。旁边这条细线，通向芦苇桥。'],['potion-maker','你看，这趟不只带回种子。等它长好，我们照这个做一壶。']],
       soloInspect:[['potion-maker','文字有些模糊，但植物图样还认得：薄荷、银露盐，温水慢泡。至于地图上的旧地名，回去再慢慢核对。']],
       choices:[{id:'keep',label:'收好残页，带回地图桌',detail:'获得残页，解锁雾夜薄荷茶。',items:{windmill_page:1},reply:'纸页已经收平整了。配方记在背面，回家就能照着准备。'},
                {id:'copy',label:'抄下图样，留下原件',detail:'获得残页拓本，同样保留配方与线索。',items:{windmill_page:1},reply:'原件留在干燥的木箱里。我们带走拓本和配方，这条路不会丢。'}],defaultChoice:'copy'},
      {id:'shore',name:'银泥浅滩',short:'发现',image:'shore',title:'水边有一盏很小的灯',
       environment:'银白的盐晶覆在浅滩石缝里。倒下的枝条间，一只小灯蛾的翅膀被湿草勾住，光点一明一灭。',
       action:'希莱斯拨开湿草检查小灯蛾，Fionn 把干净的手帕铺在岸边。',soloAction:'希莱斯把手帕铺在岸边，轻轻拨开勾住小灯蛾的湿草。',
       dialogue:[['potion-maker','盐晶只取松散的就够了。等一下，那边有什么在动……翅膀被草缠住了。'],['fionn','别急，我把手帕放这儿。它要是想停一会儿，就让它停着。']],
       inspect:[['potion-maker','没有受伤，只是翅膀湿了。先帮它解开，它想去哪里由它自己决定。'],['fionn','它一直跟着你的影子。看起来，比我还会找路。']],
       choices:[{id:'help',label:'帮它脱困，再收集盐晶',detail:'盐晶 ×4；小灯蛾会自愿跟随归家。',items:{silver_salt:4,marsh_pet:1},reply:'翅膀松开了。它绕着手帕飞了一圈，又落回采集袋上——那就一起回去吧。'},
                {id:'salt',label:'只采盐晶，让它在岸边休息',detail:'盐晶 ×6；解开湿草后，小灯蛾留在湿地。',items:{silver_salt:6},reply:'草已经解开，我们把它留在干燥的石头上。多收了一点松散的盐晶，够回家做茶。'}],defaultChoice:'help'}],
    METHODS:[{id:'gentle',name:'温水慢泡',description:'让清香慢慢散开。',result:'清香雾夜薄荷茶'},
             {id:'bright',name:'轻揉叶片再泡',description:'让薄荷的清凉更明显。',result:'清凉雾夜薄荷茶'}]
  };
  root.SymiaContent=Content;if(typeof module!=='undefined')module.exports=Content;
})(globalThis);
