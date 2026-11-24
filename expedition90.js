/* POIKATSU QUEST v9 - Star Expedition, phase 1.
 * Derived progress only. Never modifies save, rewards, or cloud. */
(function(root){
 'use strict';
 const JST=9*3600000, DAY=86400000;
 const dayKey=ms=>new Date(ms+JST).toISOString().slice(0,10);
 function period(now){
  const shifted=new Date(now+JST),weekday=(shifted.getUTCDay()+6)%7;
  const start=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate()-weekday)-JST;
  return {start:dayKey(start),end:dayKey(start+6*DAY),next:dayKey(start+7*DAY),today:dayKey(now)};
 }
 const validDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
 const count=x=>Number.isSafeInteger(x)&&x>=0?x:0;
 const CATS=['レシート','歩数・移動','アンケート','ゲーム','広告・ミニゲーム'];
 const ROUTES=[
  {id:'market',icon:'🪙',title:'黄金街道',subtitle:'ポイ活で物資を集める',steps:[['物資の調達','quests',3],['商人との交易','categories',2],['黄金門の突破','quests',10]]},
  {id:'trail',icon:'🌿',title:'星風の森',subtitle:'散歩・外出で未知の土地を探索',steps:[['森への第一歩','outdoor',1],['分岐路の探索','outdoorTypes',2],['森の守護者','outdoor',5]]},
  {id:'citadel',icon:'🌌',title:'星巡りの城塞',subtitle:'ポイ活と散歩を組み合わせる',steps:[['星灯の起動','combinedDays',1],['星の鍵の収集','balanced',3],['城塞への到達','combinedDays',3]]}
 ];
 function derive(state,now=Date.now()){
  const p=period(now),within=d=>validDay(d)&&d>=p.start&&d<=p.today;
  const stats=state?.dailyQuestStats;
  const questDays=new Set(),outdoorDays=new Set(),cats=new Set(),types=new Set(),seen=new Set();
  let quests=0,outdoor=0;
  for(const [day,row] of Object.entries(stats&&typeof stats==='object'&&!Array.isArray(stats)?stats:{})){
   if(!within(day))continue;
   const n=count(row?.count);quests+=n;if(n)questDays.add(day);
  }
  const history=Array.isArray(state?.questHistory)?state.questHistory:[];
  for(const row of history){if(within(row?.day)&&CATS.includes(row.category))cats.add(row.category);}
  const sessions=Array.isArray(state?.outdoorQuest?.completedSessions)?state.outdoorQuest.completedSessions:[];
  for(const row of sessions){
   if(typeof row?.id!=='string'||!row.id||seen.has(row.id)||typeof row.completedAt!=='string')continue;
   const at=Date.parse(row.completedAt);if(!Number.isFinite(at)||at>now)continue;
   const d=dayKey(at);if(!within(d))continue;
   seen.add(row.id);outdoor++;outdoorDays.add(d);
   if(['go','walk','explore'].includes(row.mission?.cat))types.add(row.mission.cat);
  }
  const metrics={quests,outdoor,categories:cats.size,outdoorTypes:types.size,balanced:Math.min(quests,outdoor),combinedDays:[...questDays].filter(d=>outdoorDays.has(d)).length};
  const routes=ROUTES.map(route=>{
   let open=true;
   const steps=route.steps.map(([name,key,target])=>{
    const value=Math.min(metrics[key],target),met=value>=target,unlocked=open;
    open=open&&met;
    return {name,key,target,value,met,unlocked,cleared:unlocked&&met};
   });
   return {id:route.id,icon:route.icon,title:route.title,subtitle:route.subtitle,steps,cleared:steps.filter(x=>x.cleared).length};
  });
  const cleared=routes.reduce((n,r)=>n+r.cleared,0);
  const rank=cleared===9?'星巡りの英雄':cleared>=6?'星界の探検家':cleared>=3?'星灯の旅人':'遠征見習い';
  return {period:p,metrics,routes,cleared,total:9,rank};
 }

 // Weekly map is stable across reloads and devices. Choices are preview-only.
 const VARIANTS={
  market:[
   {name:'黄昏の交易都市',weather:'黄金の追い風',story:'商隊が星砂の市場へ向かう。',branches:[['merchant','商人の小径','補給箱', 'quests',4],['ruins','古代の商路','封印された宝箱','categories',3]]},
   {name:'砂金の峡谷',weather:'砂塵の星空',story:'峡谷の奥から古い貨幣が見つかる。',branches:[['river','川沿いの道','流砂の宝箱','quests',5],['ridge','崖の見張り台','交易の秘宝','categories',3]]},
   {name:'月灯りの市場',weather:'月光の祝福',story:'夜の市場で旅商人の依頼を発見。',branches:[['inn','旅人の宿','旅支度の箱','quests',4],['tower','時計塔の裏路地','月銀の宝箱','categories',4]]}
  ],
  trail:[
   {name:'蒼星の樹海',weather:'星露の朝',story:'木々の間に光る足跡を見つけた。',branches:[['lake','湖畔の小径','星露の箱','outdoor',2],['grove','古樹の広場','森の宝箱','outdoorTypes',2]]},
   {name:'風渡る丘陵',weather:'穏やかな風',story:'丘の先に忘れられた祭壇がある。',branches:[['hill','花の丘','風の宝箱','outdoor',3],['altar','星風の祭壇','精霊の箱','outdoorTypes',2]]},
   {name:'月影の湿原',weather:'銀色の霧',story:'小さな精霊が安全な道を案内する。',branches:[['bridge','木橋の散策路','霧の宝箱','outdoor',2],['shrine','精霊の休息地','月影の箱','outdoorTypes',3]]}
  ],
  citadel:[
   {name:'宵星の空中庭園',weather:'流星群',story:'二つの活動の光が庭園の門を開く。',branches:[['garden','空中庭園','星花の宝箱','balanced',2],['spire','星見の尖塔','星核の箱','combinedDays',2]]},
   {name:'暁の浮遊城',weather:'夜明けの光',story:'浮遊城の鍵を探す遠征が始まる。',branches:[['hall','黎明の回廊','暁の宝箱','balanced',3],['gate','双星の門','双星の箱','combinedDays',2]]},
   {name:'星海の観測所',weather:'星海の静寂',story:'観測所に未知の星図が残されている。',branches:[['chart','星図の書庫','観測者の箱','balanced',2],['observatory','天球の間','星海の宝箱','combinedDays',3]]}
  ]
 };
 const DIFFICULTIES={easy:{label:'探索',extra:0},normal:{label:'冒険',extra:1},hard:{label:'挑戦',extra:2}};
 const EVENTS=[
  ['旅商人の補給','物資を分けてもらえる探索地点を発見。'],
  ['星の精霊','精霊が宝箱の眠る場所を教えてくれた。'],
  ['古代の石碑','遠征の記録が刻まれた石碑を発見。'],
  ['小さな野営地','旅の途中で休息できる場所に到着。'],
  ['流星の欠片','星空から落ちた光の欠片を見つけた。'],
  ['謎の門番','門番が次の探索地点への道を示した。']
 ];
 function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
 function weeklyMap(d,choices={},difficulty='easy'){
  const diff=Object.hasOwn(DIFFICULTIES,difficulty)?difficulty:'easy';
  const week=Math.floor(Date.parse(d.period.start+'T00:00:00Z')/(7*DAY));
  return d.routes.map(route=>{
   const variants=VARIANTS[route.id],v=variants[((week+hash(route.id))%variants.length+variants.length)%variants.length];
   const branches=v.branches.map(([id,name,chest,key,base])=>{
    const ceiling=key==='categories'?5:key==='outdoorTypes'?3:key==='combinedDays'?7:100;
    const target=Math.min(ceiling,base+DIFFICULTIES[diff].extra);
    const value=Math.min(d.metrics[key],target);
    return {id,name,chest,key,target,value,ready:route.steps[0].cleared&&value>=target};
   });
   const selected=branches.find(b=>b.id===choices?.[route.id])||branches[0];
   const event=EVENTS[hash(d.period.start+':'+route.id+':'+selected.id)%EVENTS.length];
   return {id:route.id,region:v.name,weather:v.weather,story:v.story,branches,selected,event:{name:event[0],description:event[1]},unlocked:route.steps[0].cleared,difficulty:diff};
  });
 }
 function mount(){
  const nav=document.querySelector('nav.tabs'),anchor=document.getElementById('outdoor60');
  if(!nav||!anchor||document.getElementById('expedition90'))return;
  const btn=document.createElement('button');btn.type='button';btn.dataset.tab='expedition90';btn.textContent='🌌 星巡り遠征';btn.onclick=()=>{tab('expedition90');paint();};nav.append(btn);
  const panel=document.createElement('div');panel.id='expedition90';panel.className='panel';anchor.insertAdjacentElement('afterend',panel);
  const style=document.createElement('style');style.textContent=
   '#expedition90 .pq9-hero{padding:22px;border:1px solid #9a89ca;border-radius:20px;background:radial-gradient(ellipse at 80% 0%,#7762a755,transparent 65%),linear-gradient(145deg,#202b49,#11182d);color:#f6efff}'+
   '#expedition90 .pq9-hero h2{margin:4px 0 8px;color:#ffe6ad;font-size:clamp(1.25rem,4vw,1.85rem)}'+
   '#expedition90 .pq9-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;margin:14px 0}'+
   '#expedition90 .pq9-route{border:1px solid #786ca6;border-radius:16px;padding:14px;background:#202c47;color:#f1efff;min-width:0}'+
   '#expedition90 .pq9-step{padding:10px 0;border-top:1px solid #ffffff24}#expedition90 .pq9-locked{opacity:.6}'+
   '#expedition90 .pq9-label{display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;font-size:.9rem}'+
   '#expedition90 progress{width:100%;height:9px;accent-color:#e9c779}#expedition90 .pq9-note{color:#c7d2e9;font-size:.85rem;line-height:1.6}';
  document.head.append(style);
  function add(parent,tag,text,cls){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=text;parent.append(el);return el;}
  function bar(parent,value,max,label){const e=document.createElement('progress');e.max=max;e.value=value;e.setAttribute('aria-label',label);parent.append(e);}
  let selectedWeek='',choices={},difficulty='easy';
  function paint(){
   if(!panel.classList.contains('active'))return;
   const d=derive(typeof s==='undefined'?{}:s);
   if(selectedWeek!==d.period.start){selectedWeek=d.period.start;choices={};difficulty='easy';}
   const map=weeklyMap(d,choices,difficulty);
   panel.replaceChildren();
   const hero=add(panel,'section','','pq9-hero');
   add(hero,'p','VER.9.0 · STAR EXPEDITION','pq9-note');
   add(hero,'h2','星巡り遠征');
   add(hero,'p',d.period.start+' ～ '+d.period.end+'（日本時間）');
   add(hero,'strong',d.rank+'　｜　'+d.cleared+' / '+d.total+' 地点攻略');
   bar(hero,d.cleared,d.total,'遠征全体の攻略進捗');
   add(hero,'p','今週のポイ活 '+d.metrics.quests+'件 ／ 外出 '+d.metrics.outdoor+'件 ／ 両方達成 '+d.metrics.combinedDays+'日','pq9-note');
   const settings=add(panel,'section','','pq9-route');
   add(settings,'h3','🧭 今週の遠征マップ');
   add(settings,'p','分岐と難易度を選んで探索条件を確認しよう。既存の9地点攻略は変わりません。','pq9-note');
   const difficultyLabel=add(settings,'label','探索難易度　');
   const select=document.createElement('select');select.setAttribute('aria-label','探索難易度');
   for(const [id,def] of Object.entries(DIFFICULTIES)){const option=document.createElement('option');option.value=id;option.textContent=def.label;select.append(option);}
   select.value=difficulty;select.onchange=()=>{difficulty=select.value;paint();panel.querySelector('select')?.focus();};difficultyLabel.append(select);
   const grid=add(panel,'div','','pq9-grid');
   for(const route of d.routes){
    const card=add(grid,'section','','pq9-route');
    add(card,'h3',route.icon+' '+route.title+'　'+route.cleared+'/3');
    add(card,'p',route.subtitle,'pq9-note');
    const m=map.find(x=>x.id===route.id);
    add(card,'h4',m.region);add(card,'p',m.weather+' ／ '+m.story,'pq9-note');
    const branchBox=add(card,'div','','pq9-step');
    add(branchBox,'strong','分岐探索');
    for(const branch of m.branches){
     const option=add(branchBox,'button',(m.selected.id===branch.id?'✓ ':'')+branch.name);
     option.type='button';option.setAttribute('aria-pressed',String(m.selected.id===branch.id));
     option.dataset.branch=m.id+':'+branch.id;
     option.onclick=()=>{choices[m.id]=branch.id;paint();[...panel.querySelectorAll('[data-branch]')].find(x=>x.dataset.branch===option.dataset.branch)?.focus();};
    }
    const sel=m.selected;
    const labels={quests:'ポイ活件数',categories:'ポイ活の種類',outdoor:'外出件数',outdoorTypes:'外出の種類',balanced:'ポイ活・外出の各件数',combinedDays:'両方達成した日数'};
    add(branchBox,'p',labels[sel.key]+' '+sel.value+'/'+sel.target+'　'+(!m.unlocked?'🔒 最初の攻略地点で解放':sel.ready?'✓ 探索達成':'探索中'),'pq9-note');
    bar(branchBox,sel.value,sel.target,sel.name);
    add(branchBox,'p',m.unlocked?'✨ '+m.event.name:'🔒 遭遇イベント');
    if(m.unlocked)add(branchBox,'p',m.event.description,'pq9-note');
    add(branchBox,'p',(sel.ready?'🔓 ':'🔒 ')+sel.chest+(sel.ready?'（発見・報酬未実装）':'（条件達成で発見）'),'pq9-note');
    for(const step of route.steps){
     const item=add(card,'div','','pq9-step'+(!step.unlocked?' pq9-locked':''));
     const label=add(item,'div','','pq9-label');
     add(label,'strong',(step.cleared?'✓ ':step.unlocked?'◇ ':'🔒 ')+step.name);
     add(label,'span',step.value+'/'+step.target);
     const goals={quests:'ポイ活クエストを合計'+step.target+'件達成',categories:'ポイ活を'+step.target+'種類達成',outdoor:'散歩・外出クエストを合計'+step.target+'件達成',outdoorTypes:'外出クエストを'+step.target+'種類達成',balanced:'ポイ活・外出をそれぞれ'+step.target+'件達成',combinedDays:'両方を達成した日が'+step.target+'日'};
     add(item,'p',goals[step.key],'pq9-note');
     bar(item,step.value,step.target,step.name);
    }
   }
   add(panel,'p','毎週月曜0時にマップ更新。分岐・難易度の選択は画面内だけ保持し、再読み込みで初期化します。宝箱・イベントは発見表示のみで、追加報酬やセーブ変更はありません。','pq9-note');
   const refresh=add(panel,'button','↻ 進捗を更新');refresh.type='button';refresh.onclick=paint;
  }
  const prev=render;render=function(){prev();paint();};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint();});
 }
 if(typeof module==='object'&&module.exports)module.exports={period,derive,weeklyMap};
 else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
 else mount();
})(typeof globalThis!=='undefined'?globalThis:this);
