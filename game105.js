/* Ver.10.5 GAME EXPERIENCE — presentation shell. Existing game rules and saves are untouched. */
(function(){
 'use strict';
 const VERSION='10.5';
 const TITLE_LINKS=Object.freeze([
  {id:'start',label:'冒険を始める',icon:'✦',target:'home'},
  {id:'news',label:'お知らせ',icon:'📢',target:null},
  {id:'account',label:'アカウント',icon:'👤',target:'settings92'},
  {id:'settings',label:'設定',icon:'⚙',target:'settings92'},
  {id:'updates',label:'アップデート情報',icon:'📜',target:null}
 ]);
 const NEWS=Object.freeze([
  {title:'GAME EXPERIENCE REVOLUTION',body:'タイトル画面を刷新。今後のホーム・メニュー改善に向けた新しいゲーム体験の入り口です。'},
  {title:'STAR EXPLORER',body:'遠征育成、星界奥義、地域限定宝箱、限定召喚、遠征図鑑、隠しボスを収録。'}
 ]);
 function titleTarget(id){return TITLE_LINKS.find(x=>x.id===id)?.target??null;}
 function stars(n=64){return Array.from({length:n},(_,i)=>({x:(i*173.31+51)%1200,y:(i*79.73+12)%690,r:i%7===0?2:0.85,opacity:0.35+(i%5)*0.12}));}

 const HOME_LINKS=Object.freeze([
  ['quests','📜','クエスト','日常の依頼'],
  ['outdoor60','👟','散歩・外出','外出ミッション'],
  ['expedition90','🌌','星巡り遠征','週間の大冒険'],
  ['adventure','⚔️','冒険','戦闘と探索'],
  ['town','🏰','街づくり','施設の発展'],
  ['craft','⚒️','工房・仲間','装備と育成'],
  ['grand50','🪙','収益記録','ポイ活の記録'],
  ['missions','🏆','任務・称号','実績と報酬'],
  ['season13','🌠','シーズン','シーズン報酬'],
  ['event31','🎁','祭典ガチャ','イベント収集'],
  ['story','📖','物語・実績','冒険の軌跡'],
  ['settings92','⚙️','設定','セーブ・同期']
 ].map(Object.freeze));
 const HOME_FEATURES=Object.freeze([
  ['expedition90','STAR EXPLORER','星巡り遠征','星界の秘宝と隠しボスに挑戦しよう。','🌌','expedition'],
  ['outdoor60','OUTDOOR QUEST','散歩・外出','いつもの外出を冒険に変えよう。','🌿','outdoor'],
  ['town','STARLIGHT TOWN','星あかりの街','集めたゴールドで施設を育てよう。','🏰','town']
 ].map(Object.freeze));
 function homeStatus(source={}){
  const safe=(key,fallback)=>typeof source[key]==='string'&&source[key].trim()?source[key].trim().slice(0,120):fallback;
  return {name:safe('name','冒険者'),subtitle:safe('subtitle','日常を冒険に。'),level:safe('level','Lv. —'),gold:safe('gold','🪙 — G'),energy:safe('energy','⚡ —'),xp:safe('xp','EXP —'),progress:Math.max(0,Math.min(100,Number(source.progress)||0))};
 }

 // Menu state is session-only. Never modify the original save or browser history.
 function searchMenu(entries,query=''){
  const normalize=x=>String(x??'').normalize('NFKC').toLocaleLowerCase('ja').trim();
  const words=normalize(query).split(/\s+/).filter(Boolean);
  return entries.filter(e=>words.every(w=>normalize([e.label,e.group,e.id,e.keywords||''].join(' ')).includes(w)));
 }
 function recordVisit(history,id,limit=16){
  if(typeof id!=='string'||!id)return history.slice();
  if(history.at(-1)===id)return history.slice();
  return [...history,id].slice(-limit);
 }
 function recentVisits(history,limit=6){return [...new Set([...history].reverse())].slice(0,limit);}
 const MENU_ALIASES=Object.freeze({home:'ロビー プロフィール 装備 持ち物',quests:'ポイ活 依頼 ミッション',outdoor60:'散歩 ポケモンGO 歩数',grand50:'収益 ガチャ 台帳 施設',expedition90:'星巡り 遠征 星晶石 召喚 図鑑 隠しボス',adventure:'ダンジョン 戦闘 探索',town:'街 建築 施設',craft:'工房 仲間 装備 製作',settings92:'設定 セーブ バックアップ テスト アカウント 同期',story:'物語 実績',chronicle:'ログイン 報酬 魔王 衣装'});
 if(typeof module==='object'&&module.exports){module.exports={VERSION,TITLE_LINKS,NEWS,titleTarget,stars,HOME_LINKS,HOME_FEATURES,homeStatus,searchMenu,recordVisit,recentVisits,MENU_ALIASES};return;}
 function el(tag,text='',cls=''){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
 function button(parent,label,action,cls=''){const b=el('button',label,cls);b.type='button';b.onclick=action;parent.append(b);return b;}
 const NS='http://www.w3.org/2000/svg';
 function svgNode(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(parent)parent.append(n);return n;}
 function landscape(){
  const svg=svgNode('svg',{viewBox:'0 0 1200 800',preserveAspectRatio:'xMidYMid slice',class:'pq105-landscape','aria-hidden':'true'});
  const defs=svgNode('defs',{},svg);
  const sky=svgNode('linearGradient',{id:'pq105-sky',x1:0,y1:0,x2:0,y2:1},defs);
  for(const [offset,color] of [['0%','#080e24'],['53%','#29294d'],['100%','#665271']])svgNode('stop',{offset,'stop-color':color},sky);
  const glow=svgNode('radialGradient',{id:'pq105-glow'},defs);svgNode('stop',{offset:'0%','stop-color':'#e6c9ff','stop-opacity':'.38'},glow);svgNode('stop',{offset:'100%','stop-color':'#c1a0fa','stop-opacity':'0'},glow);
  svgNode('rect',{width:1200,height:800,fill:'url(#pq105-sky)'},svg);
  svgNode('circle',{cx:600,cy:310,r:290,fill:'url(#pq105-glow)'},svg);
  for(const star of stars(94))svgNode('circle',{cx:star.x,cy:star.y,r:star.r,fill:'#efe4ff',opacity:star.opacity,class:star.r>1?'pq105-star':''},svg);
  svgNode('circle',{cx:600,cy:294,r:153,fill:'#efd9b0',opacity:'.8'},svg);
  svgNode('circle',{cx:600,cy:294,r:175,fill:'none',stroke:'#d9c2ff','stroke-width':'.8',opacity:'.5'},svg);
  const rings=svgNode('g',{transform:'translate(600 294) rotate(-22)',opacity:'.46'},svg);
  svgNode('ellipse',{rx:240,ry:49,fill:'none',stroke:'#e6c5ff','stroke-width':1.2},rings);
  svgNode('ellipse',{rx:260,ry:62,fill:'none',stroke:'#dbcaff','stroke-width':.7},rings);
  svgNode('path',{d:'M0 580L100 425 203 540 320 399 442 563 558 460 710 555 840 405 970 541 1100 438 1200 570V800H0Z',fill:'#262641'},svg);
  svgNode('path',{d:'M0 670L145 553 260 637 376 542 513 670 694 551 832 634 980 561 1200 674V800H0Z',fill:'#171e35'},svg);
  const castle=svgNode('g',{fill:'#111a30',stroke:'#35334e','stroke-width':1},svg);
  svgNode('path',{d:'M477 686V592H499V573H519V592H539V525L555 501 571 525V592H589V466L606 431 623 466V592H641V544L658 517 675 544V592H700V578H722V592H742V686Z'},castle);
  for(const [x,y] of [[555,549],[606,491],[606,526],[658,568]])svgNode('rect',{x:x-2,y,width:4,height:10,rx:2,fill:'#e7bb70',stroke:'none',opacity:'.9'},castle);
  svgNode('path',{d:'M0 743Q240 665 412 728T780 711T1200 722V800H0Z',fill:'#0b1428'},svg);
  return svg;
 }

 function mountHome(nav){
  const dashboard=document.getElementById('pq92-home-today');
  if(!dashboard||document.getElementById('pq105-home'))return;
  const panel=el('div','','pq105-home');panel.id='pq105-home';
  const go=(id,view=null)=>{
   const leaf=nav.querySelector('button[data-tab="'+id+'"]');if(!leaf)return;
   leaf.click();if(view)document.querySelector('[data-pq92-home-view="'+view+'"]')?.click();
  };
  const heading=el('div','','pq105-home-head');heading.append(el('span','ADVENTURER LOBBY','pq105-overline'),el('h2','星灯のロビー'));panel.append(heading);
  const profile=el('section','','pq105-profile');profile.setAttribute('aria-label','冒険者ステータス');
  const emblem=el('div','✦','pq105-emblem');emblem.setAttribute('aria-hidden','true');
  const copy=el('div','','pq105-profile-copy'),name=el('strong'),subtitle=el('small'),level=el('span','','pq105-level');
  copy.append(level,name,subtitle);profile.append(emblem,copy);
  button(profile,'プロフィール',()=>go('home','profile'),'pq105-small-button');
  const xp=el('div','','pq105-xp');const xpText=el('small'),progress=el('progress');progress.max=100;progress.setAttribute('aria-label','冒険者EXP進捗');xp.append(xpText,progress);profile.append(xp);panel.append(profile);
  const currency=el('div','','pq105-currency'),gold=el('strong'),energy=el('strong');
  for(const [label,value] of [['ゴールド',gold],['エネルギー',energy]]){const tile=el('div','','pq105-balance');tile.append(el('small',label),value);currency.append(tile);}
  panel.append(currency);
  const feature=el('section','','pq105-feature');feature.setAttribute('aria-label','おすすめコンテンツ');
  const featureCopy=el('div','','pq105-feature-copy'),featureKicker=el('span','','pq105-overline'),featureTitle=el('h3'),featureText=el('p'),featureIcon=el('div','','pq105-feature-icon');
  featureIcon.setAttribute('aria-hidden','true');featureCopy.append(featureKicker,featureTitle,featureText);feature.append(featureCopy,featureIcon);
  const featureBottom=el('div','','pq105-feature-bottom');let selected=0;
  const prev=button(featureBottom,'‹',()=>select(selected-1),'pq105-arrow');prev.setAttribute('aria-label','前のおすすめ');
  const open=button(featureBottom,'コンテンツへ',()=>go(HOME_FEATURES[selected][0]),'pq105-feature-go');
  const next=button(featureBottom,'›',()=>select(selected+1),'pq105-arrow');next.setAttribute('aria-label','次のおすすめ');
  feature.append(featureBottom);const dots=el('div','','pq105-feature-dots');feature.append(dots);
  const dotButtons=HOME_FEATURES.map((x,i)=>{const b=button(dots,'●',()=>select(i));b.setAttribute('aria-label',x[2]+'を表示');return b;});
  function select(i){selected=(i+HOME_FEATURES.length)%HOME_FEATURES.length;const [,kicker,title,text,icon,theme]=HOME_FEATURES[selected];feature.dataset.theme=theme;featureKicker.textContent=kicker;featureTitle.textContent=title;featureText.textContent=text;featureIcon.textContent=icon;dotButtons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===selected)));}
  select(0);panel.append(feature);
  const menu=el('section','','pq105-home-menu');menu.append(el('h3','冒険メニュー'),el('p','遊びたいコンテンツを選択','pq105-overline'));
  const grid=el('div','','pq105-home-grid');
  for(const [id,icon,title,note] of HOME_LINKS){const b=button(grid,'',()=>go(id),'pq105-home-tile');b.dataset.pq105HomeLink=id;const mark=el('span',icon,'pq105-tile-icon');mark.setAttribute('aria-hidden','true');b.append(mark,el('strong',title),el('small',note));}
  menu.append(grid);panel.append(menu);
  const tools=el('div','','pq105-home-tools');
  button(tools,'🎒 装備・持ち物',()=>go('home','equipment'));
  button(tools,'🌟 冒険者育成',()=>go('home','profile'));
  button(tools,'🎁 ログイン報酬',()=>{go('chronicle');document.querySelector('#chronicle [data-pq92-screen-choice="3"]')?.click();});
  panel.append(tools);
  // Preserve all original dashboard children and controls. New sections are read-only.
  dashboard.prepend(panel);
  function read(){
   const readText=id=>document.getElementById(id)?.textContent||'';
   return homeStatus({name:readText('heroTitle'),subtitle:readText('heroSubtitle'),level:readText('lv'),gold:readText('gold'),energy:readText('energy'),xp:readText('xp'),progress:parseFloat(document.getElementById('xpbar')?.style.width)||0});
  }
  function refresh(){const p=read();name.textContent=p.name;subtitle.textContent=p.subtitle;level.textContent=p.level;gold.textContent=p.gold;energy.textContent=p.energy;xpText.textContent=p.xp;progress.value=p.progress;}
  const observer=new MutationObserver(refresh);
  for(const id of ['heroTitle','heroSubtitle','lv','gold','energy','xp','xpbar']){const n=document.getElementById(id);if(n)observer.observe(n,{childList:true,characterData:true,subtree:true,attributes:id==='xpbar',attributeFilter:id==='xpbar'?['style']:undefined});}
  refresh();
 }

 function mountMenu(main,nav,openTitle){
  if(document.getElementById('pq105-menu'))return;
  const leaves=[...nav.querySelectorAll('button[data-tab]')];
  const entries=leaves.map(b=>{const groupId=b.closest('[data-pq92-leaves]')?.dataset.pq92Leaves||'other';const g=nav.querySelector('[data-pq92-group="'+groupId+'"]');return {id:b.dataset.tab,label:b.textContent.trim(),group:g?.textContent.trim()||'その他',groupId,keywords:MENU_ALIASES[b.dataset.tab]||'',button:b};});
  const byId=new Map(entries.map(e=>[e.id,e]));
  const active=()=>main.querySelector(':scope > .panel.active')?.id||'home';
  let history=[active()],recent=[active()],last=active(),returning=null,opener=null;
  const toolbar=el('div','','pq105-toolbar');toolbar.id='pq105-toolbar';toolbar.setAttribute('aria-label','ゲームナビゲーション');
  const back=button(toolbar,'‹ 戻る',()=>{if(history.length<2)return;const dest=history[history.length-2];history=history.slice(0,-1);returning=dest;byId.get(dest)?.button.click();sync();},'pq105-back');
  const caption=el('div','','pq105-breadcrumb');caption.setAttribute('aria-live','polite');toolbar.append(caption);
  button(toolbar,'⌂ ホーム',()=>byId.get('home')?.button.click(),'pq105-toolbar-home');
  const launcher=button(toolbar,'☰ メニュー',()=>showMenu(),'pq105-menu-launch');launcher.setAttribute('aria-haspopup','dialog');
  const dialog=el('dialog');dialog.id='pq105-menu';dialog.setAttribute('aria-labelledby','pq105-menu-heading');
  const head=el('div','','pq105-menu-head');const heading=el('h2','総合メニュー');heading.id='pq105-menu-heading';head.append(heading);
  button(head,'閉じる',()=>dialog.close());dialog.append(head);
  const search=el('input');search.type='search';search.placeholder='コンテンツを検索（例：ガチャ、散歩）';search.setAttribute('aria-label','コンテンツ検索');dialog.append(search);
  const filters=el('div','','pq105-menu-filters');dialog.append(filters);
  const body=el('div','','pq105-menu-content');dialog.append(body);
  const foot=el('div','','pq105-menu-foot');button(foot,'◀ タイトル画面へ',()=>{dialog.close();openTitle();});dialog.append(foot);
  document.body.append(dialog);
  let group='all';
  const groups=[...new Map(entries.map(e=>[e.groupId,e.group])).entries()];
  const tabs=[['all','すべて'],['recent','最近使った画面'],...groups];
  const controls=new Map();
  for(const [id,label] of tabs){const b=button(filters,label,()=>{group=id;render();});b.dataset.pq105MenuGroup=id;controls.set(id,b);}
  function go(id){const e=byId.get(id);if(!e)return;dialog.close();e.button.click();sync();launcher.focus();}
  function render(){
   for(const [id,b] of controls)b.setAttribute('aria-pressed',String(id===group));
   let selected=group==='recent'?recentVisits(recent).map(id=>byId.get(id)).filter(Boolean):entries.filter(e=>group==='all'||e.groupId===group);
   selected=searchMenu(selected,search.value);body.replaceChildren();
   body.append(el('p',selected.length+' 件のコンテンツ','pq105-menu-count'));
   const displayGroups=group==='recent'?[['recent','最近使った画面']]:groups;
   for(const [id,label] of displayGroups){
    const matches=selected.filter(e=>id==='recent'||e.groupId===id);if(!matches.length)continue;
    const sec=el('section','','pq105-menu-group');sec.append(el('h3',label));const grid=el('div','','pq105-menu-grid');
    for(const e of matches){const b=button(grid,e.label,()=>go(e.id));b.dataset.pq105MenuId=e.id;if(e.id===active())b.setAttribute('aria-current','page');}
    sec.append(grid);body.append(sec);
   }
   if(!selected.length)body.append(el('p','一致するコンテンツがありません。検索条件を変えてください。'));
  }
  search.addEventListener('input',render);
  function showMenu(){if(dialog.open)return;opener=document.activeElement;group='all';search.value='';render();dialog.showModal();search.focus();}
  dialog.addEventListener('close',()=>{if(opener?.isConnected&&!document.querySelector('#pq105-title[open]'))opener.focus();});
  function sync(){
   const id=active();if(id!==last){if(returning===id)returning=null;else history=recordVisit(history,id);recent=recordVisit(recent,id,48);last=id;}
   const panel=main.querySelector(':scope > .panel.active');if(panel&&toolbar.parentNode!==panel)panel.prepend(toolbar);
   back.disabled=history.length<2;const entry=byId.get(id);caption.textContent=(entry?.group||'')+' / '+(entry?.label||id);
  }
  const observer=new MutationObserver(sync);
  for(const panel of main.querySelectorAll(':scope > .panel'))observer.observe(panel,{attributes:true,attributeFilter:['class']});
  sync();
 }
 function mount(){
  const main=document.querySelector('main'),nav=document.querySelector('nav[data-ui92="1"]');
  if(!main||!nav||document.getElementById('pq105-title')||typeof HTMLDialogElement==='undefined'||!HTMLDialogElement.prototype.showModal)return;
  const style=el('style');style.id='pq105-style';style.textContent=
   '#pq105-title{position:fixed;inset:0;width:100%;max-width:none;height:100%;height:100dvh;max-height:none;box-sizing:border-box;margin:0;padding:0;border:0;border-radius:0;background:#080e24;color:#f8f3ff;overflow:auto;isolation:isolate;z-index:9999}'+
   '#pq105-title::backdrop{background:#080e24}#pq105-title .pq105-landscape{position:fixed;inset:0;width:100%;height:100%;z-index:-2;pointer-events:none}'+
   '#pq105-title .pq105-shade{position:fixed;inset:0;background:linear-gradient(0deg,#070e20f5 0%,#10192d80 48%,#10192d30 100%);z-index:-1;pointer-events:none}'+
   '#pq105-title .pq105-stage{box-sizing:border-box;width:min(100%,610px);min-height:100%;margin:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:max(30px,env(safe-area-inset-top)) 20px max(20px,env(safe-area-inset-bottom));gap:12px;text-align:center}'+
   '#pq105-title .pq105-kicker{font-size:11px;letter-spacing:.22em;color:#efe0c0;text-shadow:0 2px 8px #0a1020;margin:0}'+
   '#pq105-title .pq105-logo{font-family:Georgia,"Times New Roman",serif;font-size:clamp(37px,9vw,78px);line-height:.96;letter-spacing:.08em;margin:0;color:#fff2cd;text-shadow:0 2px 0 #90754f,0 4px 18px #050816,0 0 26px #c5a0ff70;font-weight:700;display:grid;gap:5px}'+
   '#pq105-title .pq105-logo span:last-child{font-size:1.19em;letter-spacing:.12em}'+
   '#pq105-title .pq105-divider{height:1px;width:min(340px,90%);background:linear-gradient(90deg,transparent,#f0d5a2,transparent)}'+
   '#pq105-title .pq105-version{font-size:12px;letter-spacing:.14em;color:#e3d4ff;margin:2px 0 18px}'+
   '#pq105-title button{box-sizing:border-box;font:inherit;color:#f5edff;min-height:48px;border:1px solid #9a88bd;border-radius:10px;background:#202944db;max-width:100%;margin:0;padding:12px;white-space:normal;cursor:pointer}'+
   '#pq105-title button:focus-visible{outline:3px solid #ffdf91;outline-offset:3px}'+
   '#pq105-title .pq105-start{width:min(100%,430px);font-weight:800;letter-spacing:.08em;font-size:18px;color:#241d37;background:linear-gradient(110deg,#e7c17b,#fff0c4,#c6a6e8);border:1px solid #fff0c4;box-shadow:0 0 25px #f4d3a24a}'+
   '#pq105-title .pq105-links{width:min(100%,430px);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}'+
   '#pq105-title .pq105-links button{font-size:13px;min-width:0;overflow-wrap:anywhere}'+
   '#pq105-title .pq105-detail{width:min(100%,430px);box-sizing:border-box;background:#111c33ec;border:1px solid #8d7cab;border-radius:14px;padding:16px;text-align:left}'+
   '#pq105-title .pq105-detail h2{font-size:19px;color:#f5dba6;margin:0 0 12px}#pq105-title .pq105-detail h3{font-size:15px;color:#dec9ff;margin:12px 0 4px}#pq105-title .pq105-detail p{font-size:13px;line-height:1.65;margin:4px 0 12px}'+
   '#pq105-title .pq105-detail button{width:100%}#pq105-title [hidden]{display:none!important}'+
   '#pq105-title .pq105-footer{font-size:11px;color:#c4c4dd;line-height:1.5;margin:10px 0 0}'+
   '#pq105-title .pq105-star{animation:pq105-twinkle 4s ease-in-out infinite alternate}#pq105-title .pq105-star:nth-child(3n){animation-delay:-1.6s}'+
   '#pq105-return{margin:8px 0;min-height:44px;font-size:12px;background:#24334f;border:1px solid #8d7cab;border-radius:9px;color:#f5edff}'+
   '@keyframes pq105-twinkle{from{opacity:.25}to{opacity:.95}}'+
   '@media(max-height:550px){#pq105-title .pq105-stage{justify-content:flex-start;padding-top:20px}#pq105-title .pq105-logo{font-size:clamp(29px,7vw,48px)}}'+
   '@media(prefers-reduced-motion:reduce){#pq105-title *{animation:none!important;transition:none!important}}';
  style.textContent+="\n#pq105-home{display:grid;gap:14px;margin-bottom:20px;color:#f7f2ff;min-width:0}\n#pq105-home section{margin:0;padding:14px;min-width:0;box-sizing:border-box}\n#pq105-home .pq105-home-head h2{font-size:clamp(22px,3vw,32px);margin:3px 0;color:#fff2d0;letter-spacing:.06em}\n#pq105-home .pq105-overline{font-size:10px;letter-spacing:.15em;color:#d4c5ee;margin:0}\n#pq105-home .pq105-profile{display:grid;grid-template-columns:54px minmax(0,1fr) auto;align-items:center;gap:12px;background:radial-gradient(ellipse at 15% 0%,#574471,#25324e 68%);border:1px solid #a58fc2;border-radius:16px}\n#pq105-home .pq105-emblem{width:52px;height:52px;display:grid;place-items:center;border:1px solid #d9bc84;border-radius:14px;font-size:29px;color:#ffedbb;background:radial-gradient(#71608b,#2b2d4c);text-shadow:0 0 12px #fff0b4}\n#pq105-home .pq105-profile-copy{display:grid;gap:2px;min-width:0}\n#pq105-home .pq105-profile-copy strong{font-size:18px;overflow-wrap:anywhere}\n#pq105-home .pq105-profile-copy small{font-size:11px;color:#ded5f3;overflow-wrap:anywhere}\n#pq105-home .pq105-level{font-size:12px;font-weight:700;color:#ffdf97}\n#pq105-home .pq105-small-button{font-size:11px;padding:7px 9px;min-height:44px;margin:0;background:#283451;border:1px solid #9f8ac2}\n#pq105-home .pq105-xp{grid-column:1/-1;display:grid;gap:5px}\n#pq105-home progress{width:100%;height:9px;accent-color:#d0b0fa}\n#pq105-home .pq105-currency{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}\n#pq105-home .pq105-balance{padding:10px 12px;border:1px solid #665b86;border-radius:12px;background:#1e2943;display:grid;gap:4px;overflow-wrap:anywhere}\n#pq105-home .pq105-balance small{font-size:11px;color:#cec4e3}\n#pq105-home .pq105-balance strong{color:#f6e3b2;font-size:16px}\n#pq105-home .pq105-feature{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) 80px;gap:12px;border:1px solid #ad99d4;border-radius:16px;background:radial-gradient(ellipse at 90% 0%,#6e5389,#242d4b 65%)}\n#pq105-home .pq105-feature[data-theme=outdoor]{background:radial-gradient(ellipse at 90% 0%,#3d7763,#1e3547 70%);border-color:#85c1a9}\n#pq105-home .pq105-feature[data-theme=town]{background:radial-gradient(ellipse at 90% 0%,#946d40,#3b2e44 70%);border-color:#d5b780}\n#pq105-home .pq105-feature-copy h3{font-size:clamp(18px,3vw,25px);color:#ffe4ae;margin:8px 0}\n#pq105-home .pq105-feature-copy p{font-size:13px;line-height:1.65;margin:0;color:#f1ecfb}\n#pq105-home .pq105-feature-icon{font-size:52px;align-self:center;text-align:center;filter:drop-shadow(0 0 14px #f4dfff88)}\n#pq105-home .pq105-feature-bottom{grid-column:1/-1;display:grid;grid-template-columns:44px minmax(0,1fr) 44px;gap:8px}\n#pq105-home .pq105-feature-bottom button{margin:0;min-height:44px;border:1px solid #c0a5d7;background:#2f3655}\n#pq105-home .pq105-feature-go{font-weight:750;background:linear-gradient(110deg,#d7b77f,#f5e3b9)!important;color:#201b33}\n#pq105-home .pq105-feature-dots{grid-column:1/-1;display:flex;justify-content:center;gap:3px}\n#pq105-home .pq105-feature-dots button{min-height:36px;min-width:40px;margin:0;padding:0;border:0;background:transparent;color:#b4a3c7;font-size:10px}\n#pq105-home .pq105-feature-dots button[aria-pressed=true]{color:#ffe3a7}\n#pq105-home .pq105-home-menu{background:#18253c;border:1px solid #56698a;border-radius:16px}\n#pq105-home .pq105-home-menu h3{margin:0 0 6px;color:#f3e8ff;font-size:18px}\n#pq105-home .pq105-home-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}\n#pq105-home .pq105-home-tile{min-width:0;margin:0;padding:12px 5px;display:grid;justify-items:center;align-content:start;gap:5px;min-height:96px;background:linear-gradient(145deg,#354563,#232d47);border:1px solid #677b9e;color:#fff;text-align:center}\n#pq105-home .pq105-tile-icon{font-size:25px;line-height:1.15}\n#pq105-home .pq105-home-tile strong{font-size:12px;overflow-wrap:anywhere}\n#pq105-home .pq105-home-tile small{font-size:10px;line-height:1.3;color:#c7d4ed;overflow-wrap:anywhere;font-weight:400}\n#pq105-home .pq105-home-tools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}\n#pq105-home .pq105-home-tools button{margin:0;padding:10px 4px;font-size:11px;background:#27334f;border:1px solid #7a719d}\n@media(max-width:360px){#pq105-home .pq105-home-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#pq105-home .pq105-profile{grid-template-columns:44px minmax(0,1fr)}#pq105-home .pq105-emblem{width:42px;height:42px}#pq105-home .pq105-small-button{grid-column:1/-1}#pq105-home .pq105-home-tools{grid-template-columns:1fr}}\n";
  style.textContent+="\n.pq105-toolbar{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:6px;margin:0 0 10px;padding:7px;background:#151f36;border:1px solid #6e608d;border-radius:12px;grid-column:1/-1;min-width:0}\n.pq105-toolbar button{margin:0;min-height:44px;padding:7px 9px;font-size:12px;background:#293652;color:#f4efff;border:1px solid #6f7e9d;white-space:normal}\n.pq105-toolbar .pq105-menu-launch{border-color:#d9c396;color:#ffe5b1;background:#403754}\n.pq105-breadcrumb{font-size:11px;color:#d5c8ed;min-width:0;overflow-wrap:anywhere;line-height:1.4}\n#pq105-menu{box-sizing:border-box;width:min(760px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;background:#172139;color:#f4f0ff;border:1px solid #ad99d4;border-radius:18px;padding:18px;box-shadow:0 20px 65px #0009}\n#pq105-menu::backdrop{background:#060b1bd9}\n#pq105-menu .pq105-menu-head{display:flex;align-items:center;justify-content:space-between;gap:12px}\n#pq105-menu h2{margin:0;font-size:22px;color:#ffe4ad}\n#pq105-menu button{min-height:44px;margin:0;padding:9px 10px;background:#293653;color:#f2efff;border:1px solid #6d7da0;border-radius:9px;white-space:normal;overflow-wrap:anywhere;cursor:pointer}\n#pq105-menu button[aria-pressed=true],#pq105-menu button[aria-current=page]{border-color:#e7cb90;background:#544369;color:#ffe6b0}\n#pq105-menu input{box-sizing:border-box;width:100%;min-height:46px;margin:14px 0 10px;padding:10px;border-radius:10px;border:1px solid #aa98cf;background:#101a30;color:#f5f1ff;font:inherit}\n#pq105-menu .pq105-menu-filters{display:flex;flex-wrap:wrap;gap:6px}\n#pq105-menu .pq105-menu-filters button{font-size:12px}\n#pq105-menu .pq105-menu-count{font-size:12px;color:#c9bfdf}\n#pq105-menu .pq105-menu-group{margin:10px 0;padding:10px;border:1px solid #5e6c8c;background:#202c47;border-radius:12px}\n#pq105-menu .pq105-menu-group h3{margin:0 0 9px;font-size:14px;color:#dbc6ff}\n#pq105-menu .pq105-menu-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}\n#pq105-menu .pq105-menu-grid button{font-size:13px;min-width:0}\n#pq105-menu .pq105-menu-foot button{width:100%}\n#pq105-menu :is(button,input):focus-visible,.pq105-toolbar button:focus-visible{outline:2px solid #ffe2a2;outline-offset:2px}\n@media(max-width:520px){.pq105-toolbar{grid-template-columns:auto 1fr auto;gap:5px}.pq105-breadcrumb{grid-column:1/-1;grid-row:1}.pq105-toolbar button{font-size:11px}#pq105-menu .pq105-menu-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#pq105-menu{padding:12px}}\n";
  document.head.append(style);
  mountHome(nav);
  const dialog=el('dialog');dialog.id='pq105-title';dialog.setAttribute('aria-label','POIKATSU QUEST タイトル画面');
  dialog.append(landscape(),el('div','','pq105-shade'));
  const stage=el('div','','pq105-stage');dialog.append(stage);
  stage.append(el('p','REAL LIFE × FANTASY RPG','pq105-kicker'));
  const logo=el('h1','','pq105-logo');logo.append(el('span','POIKATSU'),el('span','QUEST'));stage.append(logo,el('div','','pq105-divider'),el('p','Ver.'+VERSION+' · GAME EXPERIENCE','pq105-version'));
  const actions=el('div');actions.style.cssText='display:grid;justify-items:center;gap:12px;width:100%';stage.append(actions);
  const detail=el('section','','pq105-detail');detail.hidden=true;stage.append(detail);
  const footer=el('p','日常を冒険に。｜ POIKATSU QUEST','pq105-footer');stage.append(footer);
  let destination=null;
  function navigate(id){const target=titleTarget(id);if(!target)return;destination=target;dialog.close();}
  function showActions(){detail.hidden=true;actions.hidden=false;actions.querySelector('button')?.focus();}
  function info(id){
   actions.hidden=true;detail.hidden=false;detail.replaceChildren(el('h2',id==='news'?'お知らせ':'アップデート情報'));
   for(const entry of NEWS){detail.append(el('h3',entry.title),el('p',entry.body));}
   button(detail,'タイトルへ戻る',showActions).focus();
  }
  const start=button(actions,'✦ 冒険を始める',()=>navigate('start'),'pq105-start');start.id='pq105-start';
  const links=el('div','','pq105-links');actions.append(links);
  for(const x of TITLE_LINKS.slice(1)){const b=button(links,x.icon+' '+x.label,()=>x.target?navigate(x.id):info(x.id));b.dataset.pq105TitleLink=x.id;}
  document.body.append(dialog);
  const settings=document.querySelector('#settings92 #cloud-panel');
  const ret=button(settings||main,'◀ タイトル画面へ',()=>openTitle());ret.id='pq105-return';
  if(settings)settings.prepend(ret);
  function openTitle(){if(dialog.open)return;destination=null;showActions();dialog.showModal();start.focus();}
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(!detail.hidden)showActions();});
  dialog.addEventListener('close',()=>{const target=destination;destination=null;if(target){const leaf=nav.querySelector('button[data-tab="'+target+'"]');leaf?.click();if(target==='settings92')document.querySelector('#settings92 [data-pq92-settings-choice="0"]')?.click();document.querySelector('#'+target+' h2')?.scrollIntoView({block:'start'});}});
  mountMenu(main,nav,openTitle);
  openTitle();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
