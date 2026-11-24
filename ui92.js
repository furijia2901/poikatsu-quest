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
 function groupFor(id){return GROUPS.find(g=>g.tabs.includes(id))?.id||'other';}
 if(typeof module==='object'&&module.exports){module.exports={GROUPS,LABELS,groupFor};return;}
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
  const originalTab=tab;
  tab=function(id){const result=originalTab.apply(this,arguments);current=id;group=groupFor(id);last.set(group,id);expanded=false;sync();return result;};
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
