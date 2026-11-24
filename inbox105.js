/* Ver.10.5 announcement and reward hub. Production claims use existing authoritative controls. */
(function(){
 'use strict';
 const NEWS=Object.freeze([
  {id:'105',category:'update',title:'GAME EXPERIENCE REVOLUTION',body:'タイトル、ロビー、総合メニュー、プロフィール、コレクションセンター、お知らせ・報酬センターを刷新。'},
  {id:'100',category:'update',title:'STAR EXPLORER',body:'星巡り遠征の育成、限定召喚、宝箱、図鑑、隠しボスを収録。'},
  {id:'festival',category:'event',title:'星降る収穫祭',body:'イベントの開催状況や受取条件はイベント本編で確認できます。',route:'event30'},
  {id:'safety',category:'guide',title:'セーブ・同期について',body:'各コンテンツの報酬は従来のセーブに保存されます。試験モードは本番データを変更しません。',route:'settings92'}
 ].map(Object.freeze));
 const SOURCES=Object.freeze([
  ['daily','デイリーログイン','chronicle','[data-pq92-screen-choice="3"]','loginBtn','loginInfo'],
  ['festival','イベントログイン','event31','[data-pq92-screen-choice="1"]','ev31-claim','ev31-manager'],
  ['missions','デイリー・週間任務','missions','[data-pq92-screen-choice="0"]',null,'dailyMissions'],
  ['season','星灯シーズンパス','season13','[data-pq92-screen-choice="0"]',null,'seasonTiers13'],
  ['grand','収益シーズンパス','grand50','[data-pq92-screen-choice="3"]',null,'v50season'],
  ['expedition','星巡り遠征報酬','expedition90','[data-pq9-view="rewards"]',null,null]
 ].map(Object.freeze));
 const SAMPLE=Object.freeze([
  {id:'welcome',title:'試験ウェルカム報酬',status:'ready',gold:100,energy:3,materials:5},
  {id:'login',title:'試験ログイン報酬',status:'ready',gold:40,energy:3,materials:2},
  {id:'received',title:'試験受取済み報酬',status:'claimed',gold:30,energy:0,materials:0},
  {id:'locked',title:'試験未達成報酬',status:'locked',gold:200,energy:5,materials:10},
  {id:'expired',title:'試験期限切れ報酬',status:'expired',gold:50,energy:1,materials:1}
 ].map(Object.freeze));
 function fixture(){return {items:SAMPLE.map(x=>({...x})),gold:0,energy:0,materials:0};}
 function claimTest(state,ids){const selected=new Set(ids);let gold=state.gold,energy=state.energy,materials=state.materials;const items=state.items.map(x=>{if(x.status!=='ready'||!selected.has(x.id))return {...x};gold+=x.gold;energy+=x.energy;materials+=x.materials;return {...x,status:'claimed'};});return {items,gold,energy,materials};}
 function statusOf(button,description=''){if(!button)return 'unknown';if(!button.disabled)return 'ready';return /受取済み|受け取り済み/.test(button.textContent+' '+description)?'claimed':'locked';}
 function filterNews(category){return NEWS.filter(n=>category==='all'||n.category===category);}
 if(typeof module==='object'&&module.exports){module.exports={NEWS,SOURCES,SAMPLE,fixture,claimTest,statusOf,filterNews};return;}
 const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 function btn(parent,label,action){const b=el('button',label);b.type='button';b.onclick=action;parent.append(b);return b;}
 const LABELS={ready:'受取可能',claimed:'受取済み',locked:'未達成・対象外',expired:'期限切れ',unknown:'専用画面で確認'};
 function mount(nav){
  const lobby=document.getElementById('pq105-home');if(!lobby||document.getElementById('pq105-inbox'))return;
  const style=el('style');style.textContent='#pq105-inbox{box-sizing:border-box;width:min(740px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;background:#172139;color:#f7f1ff;border:1px solid #b29bd5;border-radius:17px;padding:16px}#pq105-inbox::backdrop{background:#070b1ddd}#pq105-inbox h2{font-size:22px;margin:0;color:#ffe6ad}#pq105-inbox h3{font-size:15px;margin:0;color:#ead8ff}#pq105-inbox p{font-size:13px;line-height:1.6}#pq105-inbox button,.pq105-inbox-launch button{margin:0;min-height:44px;padding:9px;border:1px solid #8593af;border-radius:9px;background:#2b3855;color:#f6efff;overflow-wrap:anywhere;white-space:normal}#pq105-inbox button[aria-pressed=true]{border-color:#efd299;background:#57466e;color:#ffe4ad}#pq105-inbox button:disabled{opacity:.48}.pq105-inbox-launch,.pq105-inbox-tabs,.pq105-inbox-filters,.pq105-inbox-actions{display:flex;flex-wrap:wrap;gap:7px}.pq105-inbox-launch button,.pq105-inbox-actions button{flex:1 1 100px}.pq105-inbox-list{display:grid;gap:8px;margin:12px 0}.pq105-inbox-card{padding:12px;border:1px solid #647597;border-radius:12px;background:#212f49;min-width:0;overflow-wrap:anywhere}.pq105-inbox-card[data-status=ready]{border-color:#d1b978}.pq105-inbox-card p{margin:6px 0}.pq105-inbox-status{font-size:12px;color:#dcd0ed}.pq105-inbox-card[data-status=ready] .pq105-inbox-status{color:#ffe4a0}.pq105-inbox-card[data-status=claimed]{opacity:.72}.pq105-inbox-amount{font-weight:700;color:#ffe4ad}.pq105-inbox-note{color:#c6d3e9}';
  document.head.append(style);
  const launch=el('section','','pq105-inbox-launch');launch.setAttribute('aria-label','お知らせ・プレゼント');
  const newsBtn=btn(launch,'📢 お知らせ',()=>open('news',false));
  const giftBtn=btn(launch,'🎁 プレゼント',()=>open('gifts',false));
  btn(launch,'🧪 報酬試験',()=>open('gifts',true));
  lobby.querySelector('.pq105-home-tools')?.before(launch);
  const dialog=el('dialog');dialog.id='pq105-inbox';dialog.setAttribute('aria-label','お知らせ・プレゼント');document.body.append(dialog);
  let mode='news',testing=false,category='all',filter='all',sample=fixture(),opener=null;
  const readNews=new Set();
  function go(panel,selector){const leaf=nav.querySelector('button[data-tab="'+panel+'"]');if(!leaf)return;dialog.close();leaf.click();if(selector)document.getElementById(panel)?.querySelector(selector)?.click();}
  function refreshBadge(){const n=SOURCES.filter(r=>r[4]&&statusOf(document.getElementById(r[4]),document.getElementById(r[5])?.textContent)==='ready').length;giftBtn.textContent='🎁 プレゼント'+(n?' ('+n+')':'');const count=NEWS.filter(n=>!readNews.has(n.id)).length;newsBtn.textContent='📢 お知らせ'+(count?' ('+count+')':'');}
  function open(next,test=false){if(dialog.open)return;opener=document.activeElement;mode=next;testing=test;category='all';filter='all';sample=fixture();render();dialog.showModal();}
  function render(){
   dialog.replaceChildren(el('h2',testing?'🧪 報酬センター試験':mode==='news'?'お知らせ':'プレゼントボックス'));
   dialog.append(el('p',testing?'試験専用の仮想報酬です。受取・一括受取・初期化を試しても本番に反映されません。':mode==='gifts'?'既存の報酬を集約した入口です。受取条件・期限・重複防止は元の画面で管理します。新しい報酬は自動配布しません。':'アップデート情報・イベント・操作ガイド。既読状態はこの起動中のみ保持します。','pq105-inbox-note'));
   const tabs=el('div','','pq105-inbox-tabs');dialog.append(tabs);
   if(!testing)for(const [id,label] of [['news','📢 お知らせ'],['gifts','🎁 プレゼント']]){const b=btn(tabs,label,()=>{mode=id;render();});b.dataset.pq105InboxTab=id;b.setAttribute('aria-pressed',String(mode===id));}
   const filters=el('div','','pq105-inbox-filters');dialog.append(filters);
   const list=el('div','','pq105-inbox-list');dialog.append(list);
   const actions=el('div','','pq105-inbox-actions');dialog.append(actions);
   if(mode==='news'){
    for(const [id,label] of [['all','すべて'],['update','アップデート'],['event','イベント'],['guide','ガイド']]){const b=btn(filters,label,()=>{category=id;render();});b.setAttribute('aria-pressed',String(category===id));}
    for(const n of filterNews(category)){const card=el('article','','pq105-inbox-card');card.dataset.pq105NewsId=n.id;card.append(el('h3',n.title+(readNews.has(n.id)?'':' ・ NEW')),el('p',n.body));btn(card,readNews.has(n.id)?'既読':'既読にする',()=>{readNews.add(n.id);refreshBadge();render();}).disabled=readNews.has(n.id);if(n.route)btn(card,'詳細画面へ',()=>go(n.route));list.append(card);}
    btn(actions,'すべて既読',()=>{NEWS.forEach(n=>readNews.add(n.id));refreshBadge();render();});
   }else if(testing){
    const amount=el('p','試験獲得：'+sample.gold+'G / エネルギー '+sample.energy+' / 素材 '+sample.materials,'pq105-inbox-amount');amount.id='pq105-test-gift-balance';dialog.insertBefore(amount,filters);
    for(const [id,label] of [['all','すべて'],['ready','受取可能'],['claimed','受取済み'],['locked','未達成'],['expired','期限切れ']]){const b=btn(filters,label,()=>{filter=id;render();});b.setAttribute('aria-pressed',String(filter===id));}
    for(const x of sample.items.filter(x=>filter==='all'||x.status===filter)){const card=el('article','','pq105-inbox-card');card.dataset.pq105GiftId=x.id;card.dataset.status=x.status;card.append(el('h3',x.title),el('p',LABELS[x.status],'pq105-inbox-status'),el('p',x.gold+'G / エネルギー '+x.energy+' / 素材 '+x.materials));btn(card,'試験受取',()=>{sample=claimTest(sample,[x.id]);render();}).disabled=x.status!=='ready';list.append(card);}
    btn(actions,'試験一括受取',()=>{sample=claimTest(sample,sample.items.map(x=>x.id));render();}).disabled=!sample.items.some(x=>x.status==='ready');
    btn(actions,'試験初期化',()=>{sample=fixture();filter='all';render();});
   }else{
    for(const [id,label] of [['all','すべて'],['ready','受取可能'],['claimed','受取済み'],['unknown','詳細確認']]){const b=btn(filters,label,()=>{filter=id;render();});b.setAttribute('aria-pressed',String(filter===id));}
    for(const [id,title,panel,selector,control,description] of SOURCES){const original=control?document.getElementById(control):null,desc=description?document.getElementById(description)?.textContent||'':'',status=statusOf(original,desc);if(filter!=='all'&&status!==filter)continue;const card=el('article','','pq105-inbox-card');card.dataset.pq105GiftId=id;card.dataset.status=status;card.append(el('h3',title),el('p',LABELS[status],'pq105-inbox-status'));if(id==='daily'&&desc)card.append(el('p',desc));btn(card,'受取・詳細画面へ',()=>go(panel,selector));list.append(card);}
    if(!list.children.length)list.append(el('p','該当する報酬はありません。'));
   }
   btn(actions,'閉じる',()=>dialog.close());
  }
  dialog.addEventListener('close',()=>{testing=false;sample=fixture();if(opener?.isConnected&&opener.offsetParent!==null)opener.focus();});
  const observer=new MutationObserver(refreshBadge);
  for(const id of ['loginBtn','loginInfo','ev31-claim','ev31-manager']){const n=document.getElementById(id);if(n)observer.observe(n,{attributes:true,attributeFilter:['disabled'],childList:true,subtree:true,characterData:true});}
  refreshBadge();window.PQ105Inbox.open=open;
 }
 window.PQ105Inbox={mount,open:null};
})();
