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
 if(typeof module==='object'&&module.exports){module.exports={VERSION,TITLE_LINKS,NEWS,titleTarget,stars};return;}
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
  document.head.append(style);
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
  openTitle();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
