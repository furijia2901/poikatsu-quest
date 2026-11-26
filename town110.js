/* TOWN REVOLUTION Phase 1: read-only city map over both existing building systems. */
(function(){
 'use strict';
 const FACILITIES=Object.freeze([
  {id:'forge',source:'town',key:'forge',name:'鍛冶屋',icon:'⚒️',max:5,base:80,benefit:'攻撃力 +2 / Lv',cell:6},
  {id:'market',source:'town',key:'market',name:'商店',icon:'🏪',max:5,base:90,benefit:'討伐報酬 +5G / Lv',cell:8},
  {id:'inn',source:'town',key:'inn',name:'宿屋',icon:'🏡',max:5,base:70,benefit:'最大HP +5 / Lv',cell:16},
  {id:'shop',source:'grand',key:'shop',name:'星巡り商店',icon:'🛍️',max:10,base:150,benefit:'拡張ごとにシーズンEXP +20',cell:18},
  {id:'garden',source:'grand',key:'garden',name:'星の庭園',icon:'🌳',max:10,base:250,benefit:'拡張ごとにシーズンEXP +20',cell:3},
  {id:'guild',source:'grand',key:'guild',name:'冒険者ギルド',icon:'🏰',max:10,base:400,benefit:'拡張ごとにシーズンEXP +20',cell:11},
  {id:'tower',source:'grand',key:'tower',name:'星見の塔',icon:'🔭',max:10,base:600,benefit:'拡張ごとにシーズンEXP +20',cell:21}
 ].map(Object.freeze));
 const TERRAIN=Object.freeze(['woods','woods','road','plot','woods','grass','plot','road','plot','water','road','plot','plaza','road','bridge','grass','plot','road','plot','water','woods','plot','road','grass','water']);
 const RANKS=Object.freeze([[0,'開拓地'],[5,'小さな村'],[15,'星灯の街'],[30,'繁栄都市'],[45,'星の王都'],[55,'星界首都']].map(Object.freeze));
 function levelOf(raw,max){return typeof raw==='number'&&Number.isFinite(raw)?Math.min(max,Math.max(0,Math.floor(raw))):0;}
 function deriveTown(state={}){
  const raw=state&&typeof state==='object'?state:{};
  const items=FACILITIES.map(f=>{const obj=f.source==='town'?raw.town:raw.v50?.buildings;const level=levelOf(obj?.[f.key],f.max);return {...f,level,nextCost:level<f.max?f.base*(level+1):null};});
  const total=items.reduce((n,f)=>n+f.level,0),built=items.filter(f=>f.level>0).length,max=items.reduce((n,f)=>n+f.max,0);
  const current=RANKS.filter(r=>total>=r[0]).at(-1),next=RANKS.find(r=>total<r[0]);
  return {items,total,built,max,rank:current[1],nextRank:next?.[1]||null,nextLevel:next?.[0]??max,gold:Number.isFinite(raw.gold)?Math.max(0,raw.gold):0};
 }
 function fixture(kind='basic'){
  if(kind==='empty')return {gold:0,town:{},v50:{buildings:{}}};
  if(kind==='max')return {gold:100000,town:{forge:5,market:5,inn:5},v50:{buildings:{shop:10,garden:10,guild:10,tower:10}}};
  return {gold:2500,town:{forge:2,market:1,inn:3},v50:{buildings:{shop:2,garden:1,guild:0,tower:1}}};
 }
 if(typeof module==='object'&&module.exports){module.exports={FACILITIES,TERRAIN,RANKS,deriveTown,fixture};return;}
 const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 function button(parent,label,fn){const b=el('button',label);b.type='button';b.onclick=fn;parent.append(b);return b;}
 function mount(){
  const panel=document.getElementById('town'),nav=document.querySelector('nav[data-ui92="1"]');
  if(!panel||!nav||document.getElementById('pq11-town'))return;
  const root=el('section','','pq11-town');root.id='pq11-town';panel.prepend(root);
  const style=el('style');style.textContent=
   '.pq11-town{background:linear-gradient(145deg,#203b42,#1d2943)!important;border:1px solid #8bb2a4!important;min-width:0}.pq11-town h2{color:#ffe4ad;margin:0 0 6px}.pq11-town .pq11-eyebrow{font-size:10px;letter-spacing:.16em;color:#d3e7cf;margin:0}.pq11-town .pq11-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:12px 0}.pq11-town .pq11-stat{padding:9px;border:1px solid #698d8b;border-radius:10px;background:#18323c;display:grid;gap:4px;min-width:0;overflow-wrap:anywhere}.pq11-town .pq11-stat small{color:#b9d7d0;font-size:11px}.pq11-town .pq11-stat strong{color:#ffebbd;font-size:16px}.pq11-town progress{width:100%;accent-color:#e1c48a;height:9px}.pq11-town .pq11-map{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:12px 0;padding:7px;border-radius:12px;background:#0f2930;border:1px solid #719d91;isolation:isolate}.pq11-town .pq11-cell{box-sizing:border-box;min-width:0;aspect-ratio:1;display:grid;align-content:center;justify-items:center;gap:3px;border-radius:7px;background:#355c4e;border:1px solid #4e7865;overflow:hidden;margin:0;padding:3px;font-size:10px;color:#f5efdd;line-height:1.1;text-align:center}.pq11-town .pq11-cell[data-terrain=woods]{background:#244d3d}.pq11-town .pq11-cell[data-terrain=road]{background:#827353;border-color:#968460}.pq11-town .pq11-cell[data-terrain=water]{background:linear-gradient(135deg,#265b78,#3e8297);border-color:#5491a6}.pq11-town .pq11-cell[data-terrain=bridge]{background:#957651;border-color:#c2a475}.pq11-town .pq11-cell[data-terrain=plaza]{background:#62576d;border-color:#a79ab5}.pq11-town button.pq11-cell{background:#3d5155;border:1px dashed #a0b8a7;cursor:pointer}.pq11-town button.pq11-cell[data-built=true]{background:linear-gradient(145deg,#605747,#3a4b54);border:1px solid #c3ae77}.pq11-town button.pq11-cell[aria-pressed=true]{outline:2px solid #ffe3a2;outline-offset:1px}.pq11-town .pq11-icon{font-size:clamp(18px,4vw,34px);line-height:1.15}.pq11-town .pq11-cell small{font-size:9px;color:#f5efdd;overflow-wrap:anywhere}.pq11-town .pq11-detail{border:1px solid #7d969c;border-radius:12px;background:#1b3042;padding:12px;min-width:0}.pq11-town .pq11-detail h3{margin:0;color:#ffe6aa}.pq11-town .pq11-detail p{font-size:13px;line-height:1.55;margin:7px 0}.pq11-town button:not(.pq11-cell){min-height:44px;margin:4px 0;padding:9px;border:1px solid #8da9a3;border-radius:9px;background:#304d58;color:#fff3d2}.pq11-town .pq11-actions{display:flex;flex-wrap:wrap;gap:7px}.pq11-town .pq11-actions button{flex:1 1 120px}.pq11-town .pq11-note{font-size:12px;color:#bed6d6}.pq11-town button:focus-visible{outline:2px solid #ffe3a2;outline-offset:2px}#pq11-town-test{box-sizing:border-box;width:min(650px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;background:#182a3d;color:#f4f1e9;border:1px solid #a7c3b4;border-radius:16px;padding:14px}#pq11-town-test::backdrop{background:#06101bd9}@media(max-width:360px){.pq11-town .pq11-cell small{font-size:8px}.pq11-town .pq11-map{gap:3px;padding:5px}.pq11-town .pq11-stat strong{font-size:13px}}';
  document.head.append(style);
  const old=document.getElementById('buildings'),grand=document.getElementById('v50buildings');
  const dialog=el('dialog');dialog.id='pq11-town-test';dialog.setAttribute('aria-label','街づくり試験');document.body.append(dialog);
  let selected='forge',testSelected='forge',scenario='basic';
  function navigate(f){
   if(f.source==='town'){old?.scrollIntoView({block:'start'});old?.querySelectorAll('button')[FACILITIES.filter(x=>x.source==='town').findIndex(x=>x.id===f.id)]?.focus({preventScroll:true});}
   else{nav.querySelector('button[data-tab="grand50"]')?.click();document.querySelector('#grand50 [data-pq92-screen-choice="2"]')?.click();grand?.scrollIntoView({block:'start'});grand?.querySelectorAll('button')[FACILITIES.filter(x=>x.source==='grand').findIndex(x=>x.id===f.id)]?.focus({preventScroll:true});}
  }
  function paint(target,model,isTest=false){
   target.replaceChildren(el('p',isTest?'TEST MODE · TOWN REVOLUTION':'TOWN REVOLUTION · CITY MAP','pq11-eyebrow'),el('h2',isTest?'🧪 街づくり試験':'🏰 星あかりの街'));
   const stat=el('div','','pq11-stats');for(const [label,value] of [['都市ランク',model.rank],['建設済み',model.built+' / 7'],['総施設Lv',model.total+' / '+model.max]]){const tile=el('div','','pq11-stat');tile.append(el('small',label),el('strong',value));stat.append(tile);}target.append(stat);
   const p=el('progress');p.max=model.max;p.value=model.total;p.setAttribute('aria-label','都市発展度');target.append(p,el('p',model.nextRank?'次の都市ランク：'+model.nextRank+'（あと '+(model.nextLevel-model.total)+' Lv）':'最高都市ランクに到達','pq11-note'));
   const map=el('div','','pq11-map');map.setAttribute('aria-label','街の配置マップ');
   const active=isTest?testSelected:selected;
   const detail=el('div','','pq11-detail');
   function choose(id){if(isTest)testSelected=id;else selected=id;for(const b of map.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.pq11Facility===id));showDetail();}
   for(let i=0;i<TERRAIN.length;i++){
    const f=model.items.find(x=>x.cell===i);let cell;
    if(f){cell=button(map,'',()=>choose(f.id));cell.dataset.pq11Facility=f.id;cell.dataset.built=String(f.level>0);cell.setAttribute('aria-pressed',String(active===f.id));cell.setAttribute('aria-label',f.name+' Lv.'+f.level);cell.append(el('span',f.level?f.icon:'◇','pq11-icon'),el('small',f.level?'Lv.'+f.level:'未建設'),el('small',f.name));}
    else{cell=el('div');cell.setAttribute('aria-hidden','true');cell.append(el('span',({woods:'🌲',plaza:'⛲',grass:'🌿',bridge:'═',water:'≈',road:'·'})[TERRAIN[i]]||'','pq11-icon'));map.append(cell);}
    cell.classList.add('pq11-cell');cell.dataset.terrain=TERRAIN[i];
   }
   target.append(map,detail);
   function showDetail(){
    const f=model.items.find(x=>x.id===(isTest?testSelected:selected))||model.items[0];
    detail.replaceChildren(el('h3',f.icon+' '+f.name+' · Lv.'+f.level+'/'+f.max),el('p',f.benefit),el('p',f.nextCost===null?'最大レベルに到達':('次の建設費：'+f.nextCost+'G / 所持 '+model.gold+'G')));
    if(!isTest)button(detail,'既存の建設画面へ',()=>navigate(f));else detail.append(el('p','試験表示のみ。建設・通貨消費なし。','pq11-note'));
   }
   showDetail();
   const actions=el('div','','pq11-actions');target.append(actions);
   if(isTest){for(const [id,label] of [['basic','発展中'],['empty','未建設・資金不足'],['max','最大レベル']])button(actions,label,()=>{scenario=id;testSelected='forge';paint(dialog,deriveTown(fixture(scenario)),true);});button(actions,'試験終了',()=>dialog.close());}
   else{button(actions,'🧪 街づくり試験',()=>{scenario='basic';testSelected='forge';paint(dialog,deriveTown(fixture(scenario)),true);dialog.showModal();});target.append(el('p','既存の鍛冶屋・商店・宿屋と星巡り施設を同じ街に表示。施設の効果・建設費・セーブはそのままです。','pq11-note'));}
  }
  function refresh(){if(panel.classList.contains('active'))paint(root,deriveTown(typeof s==='object'?s:{}));}
  let wasActive=panel.classList.contains('active');const activation=new MutationObserver(()=>{const active=panel.classList.contains('active');if(active&&!wasActive)refresh();wasActive=active;});activation.observe(panel,{attributes:true,attributeFilter:['class']});const observer=new MutationObserver(refresh);for(const n of [old,grand])if(n)observer.observe(n,{childList:true,subtree:true});
  paint(root,deriveTown(typeof s==='object'?s:{}));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
