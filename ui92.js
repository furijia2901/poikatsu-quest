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
  update15:{selector:'.v15-card',views:[['仲間の物語',[0]],['UR召喚',[1]],['レイド',[2]],['天文台',[3]]]},
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
   // Codex was nested inside the boss card; move the original node outside
   // before independent visibility is applied. Keep the original DOM order in nodes.
   if(id==='event40'){
    const boss=panel.querySelector('#v44-boss-section'),codex=panel.querySelector('#v46-codex');
    if(boss&&codex&&boss.contains(codex))boss.after(codex);
   }
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


 function organizeSettings(settings,openTab){
  const cloud=document.getElementById('cloud-panel'),migration=document.getElementById('web-migration');
  if(!cloud||!migration||settings.dataset.ui92Settings)return;
  const children=[...cloud.children],status=document.getElementById('cloud-status');
  const config=document.getElementById('cloud-config'),auth=cloud.querySelector('.cloud-grid');
  const authButtons=children.find(n=>n.querySelector('button[onclick="cloudLogin()"]'));
  const actions=children.find(n=>n.contains(document.getElementById('cloud-upload')));
  const tests=children.find(n=>n.contains(document.getElementById('cloud-reward-test-status')));
  const recovery=children.find(n=>n.contains(document.getElementById('pq-recovery-preview-result')));
  const backup=document.getElementById('pq-v8-backup'),preview=document.getElementById('pq-backup-preview-v8');
  if(!status||!config||!auth||!authButtons||!actions||!tests||!recovery||!backup||!preview)return;
  const el=(tag,txt='',cls='')=>{const n=document.createElement(tag);n.textContent=txt;if(cls)n.className=cls;return n;};
  const nav=el('div','','pq92-screen-nav');nav.setAttribute('aria-label','セーブ管理メニュー');
  const views=['同期・ログイン','バックアップ','診断・テスト'],groups=views.map((v,i)=>{const n=el('div','','pq92-settings-page');n.dataset.pq92SettingsPage=String(i);n.append(el('h3',v));return n;});
  const [sync,backups,diagnostics]=groups;
  // Move existing elements without recreating their controls, listeners or values.
  sync.append(auth,authButtons,config);
  for(const b of [...actions.children]){
   const action=b.getAttribute('onclick')||'';
   if(/^(backup|cloudBackupRemote)\(/.test(action))backups.append(b);
   else if(/^cloudDiagnose\(/.test(action))diagnostics.append(b);
   else sync.append(b);
  }
  backups.append(backup,preview);
  diagnostics.append(tests,recovery);
  const sandbox=el('button','🧪 遠征テストモードへ','alt');sandbox.type='button';sandbox.onclick=()=>{openTab('expedition90');document.querySelector('#pq10-test-open')?.click();};diagnostics.append(sandbox);
  actions.remove();
  cloud.append(...groups);
  const buttons=[];
  function select(i){settings.dataset.pq92SettingsView=String(i);groups.forEach((n,j)=>n.hidden=i!==j);migration.hidden=i!==1;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));}
  views.forEach((v,i)=>{const b=el('button',v);b.type='button';b.dataset.pq92SettingsChoice=String(i);b.onclick=()=>select(i);buttons.push(b);nav.append(b);});
  settings.prepend(nav);settings.dataset.ui92Settings='1';select(0);
  // Keep the original cloud status visible on every settings subview.
  const heading=cloud.querySelector('h2');if(heading)heading.textContent='☁️ セーブ管理';
  const warning=children.find(n=>n.tagName==='P'&&n.textContent.startsWith('初回は自動上書きしません'));
  if(warning){const details=el('details','','pq92-guide');details.append(el('summary','同期時の注意事項'),warning);sync.append(details);}
 }
 function polishCopy(main){
  // Only static headings are relabelled. Dynamic status and safety text stay intact.
  for(const heading of main.querySelectorAll('.panel h2:not([id]),.panel h3:not([id])')){
   for(const node of heading.childNodes)if(node.nodeType===3)node.textContent=node.textContent.replace(/\s*[—·]\s*Ver\.\d+(?:\.\d+)*/gi,'').replace(/\s*（Ver\.\d+(?:\.\d+)*）/gi,'');
  }
  for(const badge of main.querySelectorAll('.panel .new-badge'))if(badge.textContent.trim()==='NEW')badge.hidden=true;
  const guides=[
   ['outdoor60','抽選設定の説明', '#outdoor60 section:nth-of-type(3) > p.small:first-of-type'],
   ['event32','探索の進め方','#event32 .ev32-layout > div:first-child > section > p.small'],
   ['quests','達成報告のルール','#quests > section:first-of-type > p.small:not([id])']
  ];
  for(const [id,label,selector] of guides){
   const node=main.querySelector(selector);if(!node||node.closest('details'))continue;
   const details=document.createElement('details');details.className='pq92-guide';const summary=document.createElement('summary');summary.textContent=label;node.before(details);details.append(summary,node);
  }
 }
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
  organizeSettings(settings,id=>byId.get(id)?.click());
  polishCopy(main);
  const selectHome=organizeHome(id=>byId.get(id)?.click());
  const originalTab=tab;
  tab=function(id){const result=originalTab.apply(this,arguments);const changed=current!==id;current=id;group=groupFor(id);last.set(group,id);expanded=false;if(id==='home')selectHome?.('today');sync();if(changed)window.scrollTo({top:0,behavior:'instant'});return result;};
  for(const g of GROUPS){
   const b=document.createElement('button');b.type='button';b.className='pq92-category';b.dataset.pq92Group=g.id;b.setAttribute('aria-controls','pq92-subnav');
   const icon=document.createElement('span');icon.className='pq92-icon';icon.setAttribute('aria-hidden','true');icon.textContent=g.icon;
   const label=document.createElement('span');label.textContent=g.label;b.append(icon,label);categories.append(b);buttons.set(g.id,b);
   const list=document.createElement('div');list.className='pq92-leaves';list.dataset.pq92Leaves=g.id;
   const ids=g.id==='other'?[...g.tabs,...originals.filter(x=>!known.has(x.dataset.tab)).map(x=>x.dataset.tab)]:g.tabs;
   for(const id of ids){const leaf=byId.get(id);if(!leaf)continue;leaf.textContent=LABELS[id]||leaf.textContent;leaf.type='button';list.append(leaf);}
   sub.append(list);lists.set(g.id,list);
   b.onclick=()=>{
    if(group===g.id){if(g.id==='home'){byId.get('home')?.click();return;}expanded=!expanded;sync();return;}
    const target=byId.get(last.get(g.id))||ids.map(id=>byId.get(id)).find(Boolean);
    if(target)target.click();
    expanded=g.id!=='home';sync();
   };
  }
  nav.replaceChildren(categories,sub);nav.dataset.ui92='1';
  const active=main.querySelector('.panel.active');if(active){current=active.id;group=groupFor(current);last.set(group,current);}
  sync();window.matchMedia('(max-width:749px)').addEventListener('change',sync);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobile()&&expanded){expanded=false;sync();buttons.get(group)?.focus();}});
  document.addEventListener('pointerdown',e=>{if(mobile()&&expanded&&!nav.contains(e.target)){expanded=false;sync();}});
  // The desktop HUD is redundant on home and occupies valuable width on medium displays.
  const hud=document.getElementById('desktopHUD21');if(hud)hud.setAttribute('aria-label','冒険ステータス・補助情報');
  main.classList.add('pq92-shell');

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
   '#settings92 [hidden],.panel .new-badge[hidden]{display:none!important}'+
   '.pq92-settings-page{min-width:0}.pq92-settings-page>h3{margin:16px 0 10px;color:#e4dcfa}.pq92-settings-page>section{margin-top:16px}'+
   '.pq92-guide{margin:10px 0;padding:10px 12px;border:1px solid #455779;border-radius:10px;background:#14233b;color:#d8e5ff}.pq92-guide summary{cursor:pointer;font-size:13px;font-weight:700}.pq92-guide p{margin:8px 0 0;line-height:1.6}'+
   'main>.panel{--pq92-ink:#e9edf9;--pq92-muted:#bdcce4;--pq92-line:#465c7e;color:var(--pq92-ink);line-height:1.55}'+
   'main>.panel section{border-radius:15px;border-color:var(--pq92-line);min-width:0}'+
   'main>.panel h2{font-size:clamp(18px,2vw,23px);line-height:1.35;overflow-wrap:anywhere;margin-bottom:12px}main>.panel h3{font-size:16px;line-height:1.4;overflow-wrap:anywhere}'+
   'main>.panel :is(.small,.pq9-note){color:var(--pq92-muted);line-height:1.6}'+
   'main>.panel button:not([class*="node"]):not([class*="cell"]){border-radius:10px;min-height:42px;line-height:1.35;overflow-wrap:anywhere}'+
   'main>.panel button.alt{background:#324661;border:1px solid #597090}main>.panel button.good{background:#18734f;border:1px solid #3ca479}'+
   'main>.panel button:disabled{opacity:.48;cursor:not-allowed}main>.panel :is(button,input,select,summary):focus-visible{outline:2px solid #e8cc87;outline-offset:2px}'+
   'main>.panel :is(input:not([type="checkbox"]):not([type="radio"]),select){max-width:100%;min-width:0;border-radius:9px}'+
   '@media(prefers-reduced-motion:reduce){main>.panel button,main>nav.tabs button{transition:none!important;animation:none!important;transform:none!important}}'+
   'main.pq92-shell{grid-template-rows:auto auto auto minmax(0,1fr);align-content:start;--pq92-nav-height:76px}'+
   'main.pq92-shell>.panel{min-width:0;max-width:100%;overflow-wrap:anywhere}'+
   'main.pq92-shell>.panel :is(img,svg,video,canvas,progress){max-width:100%}'+
   'main.pq92-shell>.panel :is(.grid,.v20-grid,.ev32-layout,.v40-layout,.v41-layout,.ev31-grid)>*{min-width:0}'+
   'main.pq92-shell>.panel pre{white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%}'+
   '@media(min-width:1121px){main.pq92-shell{grid-template-columns:clamp(180px,14vw,230px) minmax(0,1fr) clamp(210px,19vw,300px)}main.pq92-shell .pq92-shortcuts{grid-template-columns:repeat(3,minmax(0,1fr))}'+
   'main.pq92-shell #home[data-home-view="equipment"]{grid-template-columns:repeat(2,minmax(0,1fr))}main.pq92-shell #home.active[data-home-view="equipment"]{display:grid;gap:12px}main.pq92-shell #home[data-home-view="equipment"]>.pq92-home-nav{grid-column:1/-1}}'+
   '@media(min-width:1600px){main.pq92-shell{grid-template-columns:240px minmax(0,1fr) 320px;max-width:1920px!important;margin-inline:auto!important}}'+
   '@media(min-width:750px) and (max-width:1120px){main.pq92-shell{grid-template-columns:clamp(160px,22vw,200px) minmax(0,1fr)}main.pq92-shell #update20 .v20-grid{grid-template-columns:minmax(0,1fr)}}'+
   '@media(max-width:749px){main.pq92-shell{padding-bottom:calc(var(--pq92-nav-height) + env(safe-area-inset-bottom) + 20px)!important}main.pq92-shell>.panel{margin-top:10px}'+
   'main.pq92-shell>.panel section{padding:12px}main.pq92-shell>.panel :is(.ev32-layout,.v40-layout,.v41-layout,.v20-grid){grid-template-columns:minmax(0,1fr)!important}'+
   'main.pq92-shell .pq92-screen-nav button{flex:1 1 40%;min-height:44px}main.pq92-shell .pq92-home-nav button{font-size:12px}'+
   'main.pq92-shell #pq92-subnav{overscroll-behavior:contain;max-height:min(45dvh,320px)}main.pq92-shell :is(.pq92-screen-nav,.pq92-home-nav) button{touch-action:manipulation}}'+
   '@media(max-width:360px){main.pq92-shell .pq92-categories{gap:2px}main.pq92-shell nav.tabs[data-ui92] .pq92-category{font-size:9px;padding-inline:0}main.pq92-shell .pq92-shortcuts{grid-template-columns:1fr}main.pq92-shell .pq92-home-nav button{font-size:11px}}'+
   '#settings92 #cloud-panel,#settings92 #web-migration{width:100%;min-width:0}'+
   '@media(max-width:749px){main>nav.tabs[data-ui92]{display:flex;flex-direction:column-reverse;gap:4px;overflow:visible;padding:6px 6px max(6px,env(safe-area-inset-bottom));}'+
   'main>nav.tabs[data-ui92]::before{display:none}.pq92-categories{grid-template-columns:repeat(6,minmax(0,1fr));gap:3px;width:100%}'+
   'main>nav.tabs[data-ui92] .pq92-category{flex-direction:column;justify-content:center;gap:3px;min-width:0;width:100%;max-width:none;padding:6px 1px;font-size:10px;line-height:1.2;text-align:center;min-height:49px}'+
   'main>nav.tabs[data-ui92][data-expanded="false"] #pq92-subnav{display:none}'+
   '#pq92-subnav{max-height:min(40vh,280px);overflow:auto;width:100%;padding:4px 3px 8px;border-bottom:1px solid #405475}'+
   '.pq92-leaves{grid-template-columns:repeat(2,minmax(0,1fr))}main>nav.tabs[data-ui92] .pq92-leaves button{width:100%;min-width:0;max-width:none;white-space:normal;text-align:left;font-size:12px}'+
   'main{padding-bottom:90px!important}}';
  document.head.append(style);
  const title=document.querySelector('main > h1');if(title){const tag=title.previousElementSibling;if(tag?.classList.contains('small'))tag.textContent='REAL-LIFE QUEST × FANTASY RPG · Ver.10.5';}
 }
 // Expedition and backup modules mount first (script is last in index).
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
