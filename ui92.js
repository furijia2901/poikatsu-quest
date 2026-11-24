/* Ver.9.2 UI reorganization: navigation only; never writes game data. */
(function(){
 'use strict';
 const GROUPS=[
  {id:'home',label:'ホーム',icon:'🏠',tabs:['home']},
  {id:'activity',label:'活動',icon:'📋',tabs:['quests','outdoor60','missions','grand50']},
  {id:'adventure',label:'冒険',icon:'⚔️',tabs:['expedition90','adventure','update20','update17','update19','chronicle']},
  {id:'growth',label:'育成',icon:'🔨',tabs:['craft','town','update14','update15','update16','update18']},
  {id:'events',label:'イベント',icon:'🎁',tabs:['season13','event30','event31','event32','event36','event37','event40','event41']},
  {id:'other',label:'その他',icon:'📚',tabs:['records','story','settings92']}
 ];
 const LABELS={home:'ホーム',quests:'ポイ活クエスト',outdoor60:'散歩・外出',missions:'任務・称号',grand50:'収益・ガチャ・施設',expedition90:'星巡り遠征',adventure:'通常冒険',update20:'星界アリーナ・召喚',update17:'天空試練',update19:'星蝕編',chronicle:'星天の年代記',craft:'工房・仲間',town:'街づくり',update14:'絆・季節遺跡',update15:'星界同盟',update16:'星装・竜の秘宝',update18:'天空鍛冶・覚醒',season13:'シーズン',event30:'星降る収穫祭',event31:'祭典ガチャ',event32:'祭典探索',event36:'祭典の仲間',event37:'祭典の物語',event40:'星蝕境界戦線',event41:'境界の物語',records:'記録・境界共闘',story:'物語・実績',settings92:'設定・セーブ管理'};

 // Groups use original sections/cards, not copies. A schema mismatch leaves the original screen untouched.
 const SCREEN_LAYOUTS={
  outdoor60:{selector:':scope > section',keep:[0],views:[['依頼',[1]],['抽選設定',[2]],['ショップ',[3]],['記録・実績',[4]]]},
  grand50:{selector:':scope > section',keep:[0],views:[['収益台帳',[1]],['ガチャ',[2]],['施設',[3]],['シーズン',[4]]]},
  missions:{selector:':scope > section',views:[['任務',[0]],['称号',[1]]]},
  quests:{selector:':scope > section',views:[['クエスト',[0]],['活動記録',[1]]]},
  adventure:{selector:':scope > section',keep:[0],views:[['戦闘',[1,2]],['属性試練',[3]],['探索',[4,5]]]},
  craft:{selector:':scope > section',views:[['装備・工房',[0]],['仲間・編成',[1]]]},
  update14:{selector:':scope > section',views:[['絆',[0]],['季節遺跡',[1]],['覚醒工房',[2]]]},
  season13:{selector:':scope > section',views:[['シーズンパス',[0]],['ギルドランク',[1]],['限定召喚',[2]],['ボス',[3]]]},
  story:{selector:':scope > section',views:[['物語',[0]],['実績',[1]]]},
  chronicle:{selector:':scope > section',views:[['年代記',[0]],['魔王戦',[1]],['衣装',[2]],['ログイン報酬',[3]]]},
  records:{selector:':scope > section',views:[['冒険記録',[1]],['境界共闘',[0]]]},
  update15:{selector:'.v15-grid > .v15-card',views:[['仲間の物語',[0]],['UR召喚',[1]],['レイド',[2]],['天文台',[3]]]},
  update16:{selector:'.v16-grid > .v16-card',views:[['戦利品',[0]],['仲間装備',[1]],['召喚',[2]],['外見',[3]]]},
  update17:{selector:'.v17-grid > .v17-card',views:[['スキル',[0]],['レイド',[1]],['図鑑',[2]],['浮遊島',[3]]]},
  update18:{selector:'.v18-grid > .v18-card',views:[['装備製作',[0]],['覚醒進化',[1]],['施設',[2]],['討伐報酬',[3]]]},
  update19:{selector:'.v19-grid > .v19-card',views:[['物語',[0]],['覚醒技',[1]],['ガチャ',[2]],['古竜戦',[3]]]},
  update20:{selector:'.v20-grid > .v20-card',views:[['戦闘・マップ',[0,1]],['召喚',[2]],['冒険者カード',[3]]]},
  event30:{selector:'section',keep:[0],views:[['物語・ボス',[1,2]],['任務・報酬',[3,5]],['交換所',[4]]]},
  event31:{selector:'section',keep:[0],views:[['ガチャ',[1]],['ログイン・開催情報',[2]],['コレクション',[3]]]},
  event36:{selector:':scope > section',keep:[0],views:[['仲間',[1]],['育成',[2]],['任務・記録',[3,4]]]},
  event37:{selector:':scope > section',keep:[0],views:[['物語',[1]],['支援技',[2]],['記録',[3]]]},
  event40:{selector:'section',keep:[0],views:[['探索・ボス戦',[1,2,4]],['装備図鑑',[3]],['召喚・交換',[5,6]],['任務・記録',[7,8]]]},
  event41:{selector:'section',keep:[0],views:[['物語・任務',[1,2]],['仲間・絆',[3,4]],['記録',[5]]]},
  event32:{selector:'.ev32-layout > div > .ev32-map,.ev32-layout > div > section,.ev32-layout > div > .ev32-card,.ev32-layout > div > .ev34-panel',views:[['探索',[0,1,2,3,7]],['図鑑',[5]],['挑戦・隠しボス',[6]],['履歴',[4]]]}
 };
 function layoutValid(def,n){
  const indexes=[...(def.keep||[]),...def.views.flatMap(v=>v[1])];
  return indexes.length===n&&new Set(indexes).size===n&&indexes.every(i=>Number.isInteger(i)&&i>=0&&i<n);
 }
 function organizeScreens(){
  for(const [id,def] of Object.entries(SCREEN_LAYOUTS)){
   const panel=document.getElementById(id);if(!panel||panel.dataset.ui92Sections)continue;
   const nodes=[...panel.querySelectorAll(def.selector)];
   if(!layoutValid(def,nodes.length))continue;
   const menu=document.createElement('div');menu.className='pq92-screen-nav';menu.setAttribute('aria-label','画面内メニュー');
   const buttons=[];
   function select(index){
    if(!def.views[index])return;
    panel.dataset.pq92ScreenView=String(index);
    const show=new Set([...(def.keep||[]),...def.views[index][1]]);
    nodes.forEach((node,i)=>{node.hidden=!show.has(i);});
    buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
   }
   def.views.forEach(([label],i)=>{
    const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.pq92ScreenChoice=String(i);
    b.onclick=()=>select(i);buttons.push(b);menu.append(b);
   });
   panel.prepend(menu);panel.dataset.ui92Sections='1';select(0);
   // Legacy mobile links target these same nodes, so reveal the appropriate view before scrolling.
   if(id==='event40')for(const b of panel.querySelectorAll('.v45-quick button')){
    const targetId=b.getAttribute('onclick')?.match(/getElementById\('([^']+)'\)/)?.[1];const target=targetId&&document.getElementById(targetId);
    if(!target)continue;
    const index=nodes.findIndex(n=>n===target||n.contains(target));
    const viewIndex=def.views.findIndex(v=>v[1].includes(index));if(viewIndex<0)continue;
    b.removeAttribute('onclick');b.onclick=()=>{select(viewIndex);target.scrollIntoView({block:'start',behavior:'smooth'});};
   }
  }
 }
 function groupFor(id){return GROUPS.find(g=>g.tabs.includes(id))?.id||'other';}
 if(typeof module==='object'&&module.exports){module.exports={GROUPS,LABELS,groupFor,SCREEN_LAYOUTS,layoutValid};return;}

 function organizeHome(openTab){
  const home=document.getElementById('home');
  if(!home||home.dataset.ui92Home)return;
  const profile=home.querySelector(':scope > section'),equip=document.getElementById('equipmentList')?.closest('section'),gacha=document.getElementById('inventory')?.closest('section');
  const guild=document.getElementById('guildHeadline')?.closest('.guild-banner'),summary=document.getElementById('homeSummary');
  if(!profile||!equip||!gacha||!guild||!summary)return;
  const el=(tag,txt='',cls='')=>{const n=document.createElement(tag);n.textContent=txt;if(cls)n.className=cls;return n;};
  const dashboard=el('section','','pq92-dashboard');dashboard.id='pq92-home-today';
  const label=el('p','ADVENTURER HUB','pq92-eyebrow'),heading=el('h2','今日の冒険');
  dashboard.append(label,heading,guild,summary);
  dashboard.append(el('h3','すぐに始める'));
  const shortcuts=el('div','','pq92-shortcuts');
  for(const [id,icon,title,note] of [
   ['quests','📜','ポイ活クエスト','今日の依頼・達成報告'],
   ['outdoor60','🚶','散歩・外出','外出クエスト・メダル'],
   ['expedition90','🌌','星巡り遠征','今週の探索・報酬'],
   ['missions','🏆','任務・称号','デイリー・週間報酬'],
   ['grand50','🪙','収益記録','ポイ活収益・収集'],
   ['season13','🌠','シーズン','進捗・報酬']
  ]){
   const b=el('button','','pq92-shortcut');b.type='button';b.dataset.pq92Shortcut=id;
   const mark=el('span',icon,'pq92-shortcut-icon');mark.setAttribute('aria-hidden','true');
   const copy=el('span','','pq92-shortcut-copy');copy.append(el('strong',title),el('small',note));b.append(mark,copy);b.onclick=()=>openTab(id);shortcuts.append(b);
  }
  dashboard.append(shortcuts);
  const nav=el('div','','pq92-home-nav');nav.setAttribute('aria-label','ホーム内メニュー');
  const views={today:[dashboard],profile:[profile],equipment:[equip,gacha]},buttons=new Map();
  function select(id){
   if(!Object.hasOwn(views,id))return;
   home.dataset.homeView=id;
   for(const [key,nodes] of Object.entries(views))for(const node of nodes)node.hidden=key!==id;
   for(const [key,b] of buttons)b.setAttribute('aria-pressed',String(key===id));
  }
  for(const [id,title] of [['today','今日'],['profile','冒険者育成'],['equipment','装備・ガチャ']]){
   const b=el('button',title);b.type='button';b.dataset.pq92HomeView=id;b.onclick=()=>select(id);buttons.set(id,b);nav.append(b);
  }
  home.prepend(nav,dashboard);home.dataset.ui92Home='1';select('today');
  return select;
 }
 function mount(){
  const nav=document.querySelector('main > nav.tabs'),main=document.querySelector('main');
  if(!nav||!main||nav.dataset.ui92||typeof tab!=='function')return;
  // Existing nodes and their handlers are kept intact, including dynamic expedition button.
  const cloudPanel=document.getElementById('cloud-panel'),migration=document.getElementById('web-migration');
  const settings=document.createElement('div');settings.id='settings92';settings.className='panel';
  if(cloudPanel)settings.append(cloudPanel);
  if(migration)settings.append(migration);
  main.append(settings);
  const settingsButton=document.createElement('button');settingsButton.type='button';settingsButton.dataset.tab='settings92';settingsButton.textContent='⚙️ 設定・セーブ管理';settingsButton.onclick=()=>tab('settings92');nav.append(settingsButton);
  const originals=[...nav.querySelectorAll('button[data-tab]')],byId=new Map(originals.map(b=>[b.dataset.tab,b]));
  const known=new Set(GROUPS.flatMap(g=>g.tabs));
  const categories=document.createElement('div');categories.className='pq92-categories';categories.setAttribute('aria-label','メインカテゴリー');
  const sub=document.createElement('div');sub.className='pq92-subnav';sub.id='pq92-subnav';sub.setAttribute('aria-label','カテゴリー内の画面');
  const heading=document.createElement('div');heading.className='pq92-subheading';sub.append(heading);
  const lists=new Map(),buttons=new Map(),last=new Map();
  let current='home',group='home',expanded=false;
  const mobile=()=>window.matchMedia('(max-width:749px)').matches;
  function sync(){
   nav.dataset.group=group;nav.dataset.expanded=String(expanded);
   const g=GROUPS.find(x=>x.id===group)||GROUPS[0];
   heading.textContent=g.icon+' '+g.label+' · '+(LABELS[current]||current);
   for(const [id,b] of buttons){b.classList.toggle('pq92-active',id===group);b.setAttribute('aria-pressed',String(id===group));b.setAttribute('aria-expanded',String(id===group&&(!mobile()||expanded)));}
   for(const [id,list] of lists)list.hidden=id!==group;
   for(const b of originals){if(b.dataset.tab===current)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
  }
  organizeScreens();
  const selectHome=organizeHome(id=>byId.get(id)?.click());
  const originalTab=tab;
  tab=function(id){const result=originalTab.apply(this,arguments);current=id;group=groupFor(id);last.set(group,id);expanded=false;if(id==='home')selectHome?.('today');sync();return result;};
  for(const g of GROUPS){
   const b=document.createElement('button');b.type='button';b.className='pq92-category';b.dataset.pq92Group=g.id;b.setAttribute('aria-controls','pq92-subnav');
   const icon=document.createElement('span');icon.className='pq92-icon';icon.setAttribute('aria-hidden','true');icon.textContent=g.icon;
   const label=document.createElement('span');label.textContent=g.label;b.append(icon,label);categories.append(b);buttons.set(g.id,b);
   const list=document.createElement('div');list.className='pq92-leaves';list.dataset.pq92Leaves=g.id;
   const ids=g.id==='other'?[...g.tabs,...originals.filter(x=>!known.has(x.dataset.tab)).map(x=>x.dataset.tab)]:g.tabs;
   for(const id of ids){const leaf=byId.get(id);if(!leaf)continue;leaf.textContent=LABELS[id]||leaf.textContent;leaf.type='button';list.append(leaf);}
   sub.append(list);lists.set(g.id,list);
   b.onclick=()=>{
    if(group===g.id){expanded=!expanded;sync();return;}
    const target=byId.get(last.get(g.id))||ids.map(id=>byId.get(id)).find(Boolean);
    if(target)target.click();
    expanded=true;sync();
   };
  }
  nav.replaceChildren(categories,sub);nav.dataset.ui92='1';
  const active=main.querySelector('.panel.active');if(active){current=active.id;group=groupFor(current);last.set(group,current);}
  sync();window.matchMedia('(max-width:749px)').addEventListener('change',sync);
  const style=document.createElement('style');style.id='pq92-style';style.textContent=
   'main>nav.tabs[data-ui92]{gap:12px;overflow:auto;align-items:stretch}'+
   'main>nav.tabs[data-ui92]::before{content:"✦ メインメニュー";font-size:11px;letter-spacing:.12em}'+
   '#pq92-subnav{min-width:0} .pq92-categories,.pq92-leaves{display:grid;gap:5px;min-width:0}'+
   'main>nav.tabs[data-ui92] .pq92-category{display:flex;align-items:center;gap:10px;min-height:43px;padding:9px 10px;color:#d8e5ff;border:1px solid #405475;background:#15243a;white-space:normal}'+
   'main>nav.tabs[data-ui92] .pq92-category.pq92-active{background:#49418a;border-color:#b4a2f5;color:#fff}'+
   '.pq92-icon{font-size:18px}.pq92-subheading{font-size:12px;color:#c6d5ef;padding:7px 4px;overflow-wrap:anywhere}'+
   'main>nav.tabs[data-ui92] .pq92-leaves button{min-height:42px;padding:9px 10px;font-size:13px;overflow-wrap:anywhere}'+
   'main>nav.tabs[data-ui92] [hidden]{display:none!important}'+
   '.panel[data-ui92-sections] [hidden]{display:none!important}'+
   '.pq92-screen-nav{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;padding:7px;background:#101e35;border:1px solid #405475;border-radius:12px}'+
   '.pq92-screen-nav button{flex:1 1 105px;min-width:0;min-height:43px;margin:0;padding:8px 6px;font-size:13px;background:#233652;border:1px solid #4a6083;overflow-wrap:anywhere}'+
   '.pq92-screen-nav button[aria-pressed="true"]{background:#50438e;border-color:#b4a2f5}'+
   '.panel[data-ui92-sections] :is(.v15-grid,.v16-grid,.v17-grid,.v18-grid,.v19-grid,.ev30-layout,.ev31-grid,.v40-layout,.v41-layout){grid-template-columns:minmax(0,1fr)!important}'+
   '#update20[data-ui92-sections][data-pq92-screen-view]:not([data-pq92-screen-view="0"]) .v20-grid{grid-template-columns:minmax(0,1fr)}'+
   '#home[data-ui92-home] > [hidden]{display:none!important}'+
   '.pq92-home-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0 0 12px}'+
   '.pq92-home-nav button{min-width:0;min-height:44px;margin:0;padding:8px 5px;background:#20324e;border:1px solid #475d80;font-size:13px}'+
   '.pq92-home-nav button[aria-pressed="true"]{background:#50438e;border-color:#b4a2f5}'+
   'main>#home .pq92-dashboard{background:linear-gradient(145deg,#203453,#1a233c);border-color:#586e97}'+
   '.pq92-eyebrow{font-size:11px;letter-spacing:.14em;color:#d9c6ff;margin:0 0 8px}'+
   '.pq92-dashboard .guild-banner{margin:12px 0;flex-wrap:wrap}.pq92-dashboard .guild-banner>div{min-width:0;flex:1;overflow-wrap:anywhere}'+
   '.pq92-dashboard .home-summary{margin:14px 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}'+
   '.pq92-dashboard .home-summary .tile{padding:10px 6px;min-width:0;font-size:12px;overflow-wrap:anywhere}'+
   '.pq92-shortcuts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}'+
   '.pq92-shortcut{min-width:0;display:flex;align-items:center;gap:9px;padding:13px 10px;margin:0;text-align:left;background:#273957;border:1px solid #55698e;border-radius:13px;color:#fff}'+
   '.pq92-shortcut-icon{font-size:22px;flex:none}.pq92-shortcut-copy{display:grid;gap:4px;min-width:0;overflow-wrap:anywhere}.pq92-shortcut-copy strong{font-size:14px}.pq92-shortcut-copy small{font-size:11px;color:#c6d5ef;font-weight:400}'+
   '@media(max-width:420px){.pq92-shortcut{gap:6px;padding:10px 7px}.pq92-shortcut-icon{font-size:18px}.pq92-shortcut-copy strong{font-size:12px}}'+
   '#settings92 #cloud-panel,#settings92 #web-migration{width:100%;min-width:0}'+
   '@media(max-width:749px){main>nav.tabs[data-ui92]{display:flex;flex-direction:column-reverse;gap:4px;overflow:visible;padding:6px 6px max(6px,env(safe-area-inset-bottom));}'+
   'main>nav.tabs[data-ui92]::before{display:none}.pq92-categories{grid-template-columns:repeat(6,minmax(0,1fr));gap:3px;width:100%}'+
   'main>nav.tabs[data-ui92] .pq92-category{flex-direction:column;justify-content:center;gap:3px;min-width:0;width:100%;max-width:none;padding:6px 1px;font-size:10px;line-height:1.2;text-align:center;min-height:49px}'+
   'main>nav.tabs[data-ui92][data-expanded="false"] #pq92-subnav{display:none}'+
   '#pq92-subnav{max-height:min(40vh,280px);overflow:auto;width:100%;padding:4px 3px 8px;border-bottom:1px solid #405475}'+
   '.pq92-leaves{grid-template-columns:repeat(2,minmax(0,1fr))}main>nav.tabs[data-ui92] .pq92-leaves button{width:100%;min-width:0;max-width:none;white-space:normal;text-align:left;font-size:12px}'+
   'main{padding-bottom:90px!important}}';
  document.head.append(style);
  const title=document.querySelector('main > h1');if(title){const tag=title.previousElementSibling;if(tag?.classList.contains('small'))tag.textContent='REAL-LIFE QUEST × FANTASY RPG · Ver.9.2';}
 }
 // Expedition and backup modules mount first (script is last in index).
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
