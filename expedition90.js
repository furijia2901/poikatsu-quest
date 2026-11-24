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
  function paint(){
   if(!panel.classList.contains('active'))return;
   const d=derive(typeof s==='undefined'?{}:s);
   panel.replaceChildren();
   const hero=add(panel,'section','','pq9-hero');
   add(hero,'p','VER.9.0 · STAR EXPEDITION','pq9-note');
   add(hero,'h2','星巡り遠征');
   add(hero,'p',d.period.start+' ～ '+d.period.end+'（日本時間）');
   add(hero,'strong',d.rank+'　｜　'+d.cleared+' / '+d.total+' 地点攻略');
   bar(hero,d.cleared,d.total,'遠征全体の攻略進捗');
   add(hero,'p','今週のポイ活 '+d.metrics.quests+'件 ／ 外出 '+d.metrics.outdoor+'件 ／ 両方達成 '+d.metrics.combinedDays+'日','pq9-note');
   const grid=add(panel,'div','','pq9-grid');
   for(const route of d.routes){
    const card=add(grid,'section','','pq9-route');
    add(card,'h3',route.icon+' '+route.title+'　'+route.cleared+'/3');
    add(card,'p',route.subtitle,'pq9-note');
    for(const step of route.steps){
     const item=add(card,'div','','pq9-step'+(!step.unlocked?' pq9-locked':''));
     const label=add(item,'div','','pq9-label');
     add(label,'strong',(step.cleared?'✓ ':step.unlocked?'◇ ':'🔒 ')+step.name);
     add(label,'span',step.value+'/'+step.target);
     bar(item,step.value,step.target,step.name);
    }
   }
   add(panel,'p','毎週月曜0時に更新。既存の達成記録から進行を集計します。遠征の称号は表示専用で、現段階では追加報酬やセーブ変更はありません。','pq9-note');
   const refresh=add(panel,'button','↻ 進捗を更新');refresh.type='button';refresh.onclick=paint;
  }
  const prev=render;render=function(){prev();paint();};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint();});
 }
 if(typeof module==='object'&&module.exports)module.exports={period,derive};
 else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
 else mount();
})(typeof globalThis!=='undefined'?globalThis:this);
