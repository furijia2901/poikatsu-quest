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

 // Phase 3: deterministic, isolated battle state. No reward or save writes.
 const ELEMENTS={fire:'炎',water:'水',wind:'風'};
 const ADVANTAGE={fire:'wind',wind:'water',water:'fire'};
 const FOES={
  market:{normal:{name:'黄金の番兵',icon:'⚔️',element:'fire',hp:78,atk:10,skill:'灼熱の斬撃'},boss:{name:'金煌の機竜',icon:'🐲',element:'fire',hp:136,atk:14,skill:'黄金崩壊砲'}},
  trail:{normal:{name:'星風の魔狼',icon:'🐺',element:'wind',hp:75,atk:11,skill:'疾風の牙'},boss:{name:'蒼樹の守護獣',icon:'🦌',element:'wind',hp:145,atk:13,skill:'樹海の大旋風'}},
  citadel:{normal:{name:'月影の魔導士',icon:'🔮',element:'water',hp:82,atk:10,skill:'月影の奔流'},boss:{name:'星海の幻竜',icon:'🐉',element:'water',hp:150,atk:14,skill:'星海の終焉'}}
 };
 const BATTLE_SCALE={easy:0.85,normal:1,hard:1.2};
 const ACTIONS={attack:'通常攻撃',skill:'星脈斬',guard:'防御',heal:'星灯の薬'};
 function battleEligible(d,map,routeId,kind){
  const route=d.routes.find(r=>r.id===routeId),m=map.find(r=>r.id===routeId);
  if(!route||!m||!['normal','boss'].includes(kind))return false;
  return kind==='boss'?route.cleared===route.steps.length&&m.selected.ready:m.unlocked;
 }
 function beginBattle(d,map,routeId,kind,element='fire'){
  if(!battleEligible(d,map,routeId,kind)||!Object.hasOwn(ELEMENTS,element))return null;
  const m=map.find(r=>r.id===routeId),f=FOES[routeId][kind],scale=BATTLE_SCALE[m.difficulty];
  const maxHp=Math.round(f.hp*scale);
  return {version:1,week:d.period.start,routeId,branchId:m.selected.id,kind,difficulty:m.difficulty,
   player:{element,hp:120,maxHp:120,mp:2,maxMp:4,potions:2},
   enemy:{...f,hp:maxHp,maxHp,atk:Math.round(f.atk*scale)},turn:1,status:'active',log:['遠征戦闘開始！']};
 }
 function enemyIntent(b){
  const special=b.turn%3===0;
  return {special,name:special?b.enemy.skill:'通常攻撃',damage:Math.round(b.enemy.atk*(special?2.15:1))};
 }
 function affinity(a,b){return ADVANTAGE[a]===b?1.3:ADVANTAGE[b]===a?0.8:1;}
 function canAct(b,action){
  if(!b||b.status!=='active'||!Object.hasOwn(ACTIONS,action))return false;
  return action==='skill'?b.player.mp>=2:action==='heal'?b.player.potions>0&&b.player.hp<b.player.maxHp:true;
 }
 function battleStep(b,action){
  if(!canAct(b,action))return b;
  const p={...b.player},e={...b.enemy},log=[...b.log],intent=enemyIntent(b);
  const note=t=>log.push('T'+b.turn+' '+t);
  let guarding=false;
  if(action==='attack'||action==='skill'){
   const damage=Math.round((action==='skill'?36:21)*affinity(p.element,e.element));
   e.hp=Math.max(0,e.hp-damage);
   p.mp=action==='skill'?p.mp-2:Math.min(p.maxMp,p.mp+1);
   note(ACTIONS[action]+'：'+damage+'ダメージ');
  }else if(action==='guard'){
   guarding=true;p.mp=Math.min(p.maxMp,p.mp+2);note('防御：被ダメージを70%軽減');
  }else{
   p.potions--;const restored=Math.min(38,p.maxHp-p.hp);p.hp+=restored;note('星灯の薬：HP '+restored+'回復');
  }
  if(e.hp===0){note('勝利！');return {...b,player:p,enemy:e,status:'won',log:log.slice(-30)};}
  const damage=Math.max(1,Math.round(intent.damage*affinity(e.element,p.element)*(guarding?0.3:1)));
  p.hp=Math.max(0,p.hp-damage);note(intent.name+'：'+damage+'ダメージを受けた');
  const status=p.hp===0?'lost':b.turn>=30?'timeout':'active';
  if(status!=='active')note(status==='lost'?'敗北…':'制限ターン終了');
  return {...b,player:p,enemy:e,turn:status==='active'?b.turn+1:b.turn,status,log:log.slice(-30)};
 }

 // Phase 4: append-only reward receipts. v1 denomination is immutable.
 // Persistent receipts are isolated from the production save.
 const REWARD_VALUES=Object.freeze({step1:5,step2:8,step3:12,chest:15,normal:10,boss:30,weekly:25});
 function receiptId(week,route,kind){
  if(!validDay(week)||new Date(week+'T00:00:00Z').getUTCDay()!==1)return null;
  if(route==='all')return kind==='weekly'?'v1:'+week+':all:weekly':null;
  if(!Object.hasOwn(FOES,route)||!Object.hasOwn(REWARD_VALUES,kind)||kind==='weekly')return null;
  return 'v1:'+week+':'+route+':'+kind;
 }
 function receiptValue(id){
  if(typeof id!=='string')return null;
  const [version,week,route,kind,...extra]=id.split(':');
  return version==='v1'&&!extra.length&&receiptId(week,route,kind)===id?REWARD_VALUES[kind]:null;
 }
 function emptyLedger(){return {version:1,claims:[]};}
 function validateLedger(raw){
  if(raw===undefined)return emptyLedger();
  if(!raw||raw.version!==1||!Array.isArray(raw.claims)||raw.claims.length>50000||Object.keys(raw).some(k=>!['version','claims'].includes(k)))throw Error('遠征台帳の形式不正');
  if(raw.claims.some(id=>receiptValue(id)===null))throw Error('遠征受取ID不正');
  if(new Set(raw.claims).size!==raw.claims.length)throw Error('遠征台帳に重複ID');
  return {version:1,claims:[...raw.claims].sort()};
 }
 function ledgerBalance(raw){return validateLedger(raw).claims.reduce((n,id)=>n+receiptValue(id),0);}
 function mergeLedgers(a,b){
  const local=validateLedger(a),remote=validateLedger(b),claims=[...new Set([...local.claims,...remote.claims])].sort();
  return validateLedger({version:1,claims});
 }
 function ledgerLoss(candidate,previous){
  const next=new Set(validateLedger(candidate).claims);
  return validateLedger(previous).claims.filter(id=>!next.has(id));
 }
 function rewardOptions(d,map,battle=null){
  const list=[];
  const add=(route,kind,label,ready)=>list.push({id:receiptId(d.period.start,route,kind),route,kind,label,ready:!!ready,value:REWARD_VALUES[kind]});
  for(const route of d.routes){
   const m=map.find(x=>x.id===route.id);
   route.steps.forEach((step,i)=>add(route.id,'step'+(i+1),route.title+'：'+step.name,step.cleared));
   // One chest per route/week. Selecting another branch or difficulty never duplicates a receipt.
   add(route.id,'chest',route.title+'：宝箱',m?.selected.ready);
   for(const kind of ['normal','boss']){
    const win=battle?.status==='won'&&battle.enemy?.hp===0&&battle.week===d.period.start&&battle.routeId===route.id&&battle.kind===kind;
    const winMap=win?weeklyMap(d,{[route.id]:battle.branchId},battle.difficulty):null;
    const sameBranch=winMap?.find(x=>x.id===route.id)?.selected.id===battle?.branchId;
    add(route.id,kind,route.title+'：'+(kind==='boss'?'ボス撃破':'通常敵撃破'),win&&sameBranch&&battleEligible(d,winMap,route.id,kind));
   }
  }
  add('all','weekly','全9地点攻略',d.cleared===d.total&&d.total===9);
  return list;
 }
 function claimReward(raw,d,map,battle,id){
  const ledger=validateLedger(raw);
  if(ledger.claims.includes(id))return {ledger,credited:0,status:'duplicate'};
  const option=rewardOptions(d,map,battle).find(x=>x.id===id&&x.ready);
  if(!option)return {ledger,credited:0,status:'locked'};
  const next=validateLedger({version:1,claims:[...ledger.claims,id]});
  return {ledger:next,credited:option.value,status:'claimed'};
 }

 // A cloud plan is intentionally read-only. Only the ledger may be merged automatically.
 const LEDGER_KEY='expedition90Rewards';
 const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
 function planLedgerSync(local,remote,revision){
  if(!local||typeof local!=='object'||Array.isArray(local)||!remote||typeof remote!=='object'||Array.isArray(remote)||!Number.isSafeInteger(revision)||revision<1)throw Error('同期元またはリビジョンが不正');
  const a=validateLedger(local[LEDGER_KEY]),b=validateLedger(remote[LEDGER_KEY]),merged=mergeLedgers(a,b);
  const strip=obj=>Object.fromEntries(Object.entries(obj).filter(([key])=>key!==LEDGER_KEY));
  const otherDifferent=JSON.stringify(canonical(strip(local)))!==JSON.stringify(canonical(strip(remote)));
  const onlyLocal=ledgerLoss(b,a),onlyRemote=ledgerLoss(a,b);
  return {revision,onlyLocal,onlyRemote,merged,balance:ledgerBalance(merged),status:otherDifferent?'blocked-other-data':onlyLocal.length||onlyRemote.length?'ledger-only':'identical'};
 }

 // Each receipt is an independent immutable key; different tabs cannot overwrite each other's receipts.
 const RECEIPT_PREFIX='pq9-receipt-v1:';
 function receiptPrefix(scope){
  if(typeof scope!=='string'||!scope||scope.length>256)throw Error('遠征アカウント不正');
  return RECEIPT_PREFIX+encodeURIComponent(scope)+':';
 }
 function readReceipts(storage,scope){
  const prefix=receiptPrefix(scope),claims=new Set();
  for(let i=0;i<storage.length;i++){
   const key=storage.key(i);
   if(typeof key!=='string'||!key.startsWith(prefix))continue;
   const id=key.slice(prefix.length),value=storage.getItem(key);
   if(receiptValue(id)===null||value!=='1')throw Error('端末の遠征台帳が破損しています');
   claims.add(id);
  }
  return validateLedger({version:1,claims:[...claims]});
 }
 function persistReceipt(storage,scope,id){
  if(receiptValue(id)===null)throw Error('受取ID不正');
  const key=receiptPrefix(scope)+id,old=storage.getItem(key);
  if(old!==null&&old!=='1')throw Error('受取記録が破損しています');
  if(old===null)storage.setItem(key,'1');
  if(storage.getItem(key)!=='1')throw Error('遠征報酬の保存確認に失敗');
  return readReceipts(storage,scope);
 }
 function persistClaim(storage,scope,d,map,battle,id){
  const ledger=readReceipts(storage,scope),result=claimReward(ledger,d,map,battle,id);
  if(result.status!=='claimed')return result;
  return {...result,ledger:persistReceipt(storage,scope,id)};
 }
 // Remote receipts live in a dedicated append-only table, not quest_saves.
 // Never import guest receipts into a signed-in account automatically.
 async function syncReceipts(storage,scope,adapter){
  if(!scope.startsWith('account:'))throw Error('ログインが必要です');
  const before=readReceipts(storage,scope);
  const remote=validateLedger(await adapter.read());
  const merged=mergeLedgers(before,remote);
  for(const id of remote.claims)persistReceipt(storage,scope,id);
  const missing=ledgerLoss(remote,merged);
  if(missing.length)await adapter.insert(missing);
  const verified=validateLedger(await adapter.read());
  if(ledgerLoss(verified,merged).length)throw Error('クラウド受取履歴の照合失敗。端末の記録は保持しています');
  for(const id of verified.claims)persistReceipt(storage,scope,id);
  return readReceipts(storage,scope);
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
   '#expedition90 progress{width:100%;height:9px;accent-color:#e9c779}#expedition90 .pq9-note{color:#c7d2e9;font-size:.85rem;line-height:1.6}'+
   '#expedition90 .pq9-arena{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px 0}#expedition90 .pq9-fighter{padding:12px;border-radius:14px;text-align:center;background:linear-gradient(160deg,#344660,#20263f);min-width:0}#expedition90 .pq9-fighter p{overflow-wrap:anywhere}#expedition90 .pq9-fighter-icon{font-size:clamp(2rem,8vw,3.5rem);margin:4px}#expedition90 .pq9-intent{padding:10px;border:1px solid #6f8fae;border-radius:10px;display:block}#expedition90 .pq9-danger{border-color:#edb27e;color:#ffd5a4;background:#50352f}#expedition90 .pq9-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}#expedition90 .pq9-actions button{white-space:normal;min-height:44px;overflow-wrap:anywhere}#expedition90 .pq9-route select{max-width:100%;padding:8px;border-radius:8px}';
  document.head.append(style);
  function add(parent,tag,text,cls){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=text;parent.append(el);return el;}
  function bar(parent,value,max,label){const e=document.createElement('progress');e.max=max;e.value=value;e.setAttribute('aria-label',label);parent.append(e);}
  let selectedWeek='',choices={},difficulty='easy',element='fire',battle=null,previewLedger=emptyLedger(),rewardMessage='',syncMessage='',syncChecking=false,activeScope='',storageError='';
  const scopeNow=()=>typeof cloud!=='undefined'&&cloud.session?.user?.id?'account:'+cloud.session.user.id:'guest';
  function refreshLedger(){try{previewLedger=readReceipts(localStorage,activeScope);storageError='';}catch(e){storageError=e.message;}}
  function receiveSaved(id){
   if(activeScope!==scopeNow()||storageError)return 0;
   try{const fresh=derive(typeof s==='undefined'?{}:s),freshMap=weeklyMap(fresh,choices,difficulty),result=persistClaim(localStorage,activeScope,fresh,freshMap,battle,id);previewLedger=result.ledger;rewardMessage=result.status==='claimed'?'✓ 星晶石 '+result.credited+' 個を受取':result.status==='duplicate'?'受取済みです':'まだ条件を達成していません';return result.credited;}
   catch(e){rewardMessage='受取中止：'+e.message;refreshLedger();return 0;}
  }
  function paint(){
   if(!panel.classList.contains('active'))return;
   const scope=scopeNow();if(scope!==activeScope){activeScope=scope;previewLedger=emptyLedger();battle=null;rewardMessage='';syncMessage='';}refreshLedger();
   const d=derive(typeof s==='undefined'?{}:s);
   if(selectedWeek!==d.period.start){selectedWeek=d.period.start;choices={};difficulty='easy';battle=null;rewardMessage='';}
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
   const battleBox=add(panel,'section','','pq9-route');
   battleBox.id='pq9-battle';
   const battleTitle=add(battleBox,'h3','⚔️ 遠征バトル');battleTitle.tabIndex=-1;
   if(!battle){
    add(battleBox,'p','最初の地点を攻略すると番兵戦、全3地点と分岐条件を達成するとボス戦が解放。専用ステータスで挑戦できます。','pq9-note');
    const elLabel=add(battleBox,'label','使用属性　');
    const elSelect=document.createElement('select');elSelect.setAttribute('aria-label','戦闘属性');
    for(const [id,name] of Object.entries(ELEMENTS)){const opt=document.createElement('option');opt.value=id;opt.textContent=name;elSelect.append(opt);}
    elSelect.value=element;elSelect.onchange=()=>{element=elSelect.value;};elLabel.append(elSelect);
    add(battleBox,'p','相性：炎 → 風 → 水 → 炎（有利30%増／不利20%減）','pq9-note');
   }else{
    add(battleBox,'p',battle.enemy.icon+' '+battle.enemy.name+' ／ '+DIFFICULTIES[battle.difficulty].label+' ／ '+ELEMENTS[battle.enemy.element]);
    add(battleBox,'strong','TURN '+battle.turn+' / 30');
    const arena=add(battleBox,'div','','pq9-arena');
    const heroCard=add(arena,'div','','pq9-fighter'),enemyCard=add(arena,'div','','pq9-fighter');
    add(heroCard,'div','⚔️','pq9-fighter-icon');add(heroCard,'strong','遠征冒険者');
    add(heroCard,'p','HP '+battle.player.hp+'/'+battle.player.maxHp);
    bar(heroCard,battle.player.hp,battle.player.maxHp,'プレイヤーHP');
    add(heroCard,'p',ELEMENTS[battle.player.element]+'属性 ｜ MP '+battle.player.mp+'/'+battle.player.maxMp+' ｜ 薬 '+battle.player.potions,'pq9-note');
    add(enemyCard,'div',battle.enemy.icon,'pq9-fighter-icon');add(enemyCard,'strong',battle.enemy.name);
    add(enemyCard,'p','HP '+battle.enemy.hp+'/'+battle.enemy.maxHp);
    bar(enemyCard,battle.enemy.hp,battle.enemy.maxHp,'敵HP');
    add(enemyCard,'p',ELEMENTS[battle.enemy.element]+'属性','pq9-note');
    if(battle.status==='active'){
     const intent=enemyIntent(battle);
     const expected=Math.max(1,Math.round(intent.damage*affinity(battle.enemy.element,battle.player.element)));
     add(battleBox,'strong',(intent.special?'⚠️ 大技予告：':'次の敵行動：')+intent.name+' ／ 予想ダメージ '+expected,'pq9-intent'+(intent.special?' pq9-danger':''));
     const actions=add(battleBox,'div','','pq9-actions');
     for(const [id,label] of Object.entries(ACTIONS)){
      const action=add(actions,'button',label+({attack:'（MP+1）',skill:'（MP2）',guard:'（MP+2）',heal:'（HP38）'}[id]));
      action.type='button';action.disabled=!canAct(battle,id);action.dataset.action=id;
      const expectedBattle=battle;
      action.onclick=()=>{if(battle!==expectedBattle||activeScope!==scopeNow())return;if(period(Date.now()).start!==battle.week){paint();return;}battle=battleStep(battle,id);paint();panel.querySelector('[data-action="'+id+'"]:not(:disabled)')?.focus();};
     }
    }else add(battleBox,'strong',({won:'🏆 勝利！',lost:'敗北…',timeout:'制限ターン終了'})[battle.status]+'');
    if(battle.status==='won'){
     const id=receiptId(battle.week,battle.routeId,battle.kind),claimed=previewLedger.claims.includes(id);
     const prize=add(battleBox,'button',claimed?'報酬受取済み':'勝利報酬を受取（'+receiptValue(id)+' 星晶石）');prize.type='button';prize.disabled=claimed||!!storageError;
     prize.onclick=()=>{receiveSaved(id);paint();};
    }
    const log=add(battleBox,'div','','pq9-note');log.setAttribute('aria-live','polite');
    for(const line of battle.log.slice(-6))add(log,'p',line);
    const exit=add(battleBox,'button',battle.status==='active'?'戦闘を中断':'戦闘結果を閉じる');exit.type='button';
    exit.onclick=()=>{if(battle.status==='active'&&!confirm('戦闘を中断しますか？'))return;battle=null;paint();};
   }
   const rewards=add(panel,'section','','pq9-route');
   add(rewards,'h3','💎 遠征報酬・星晶石');
   add(rewards,'strong',storageError?'残高確認不可':'所持数：'+ledgerBalance(previewLedger)+' 星晶石');
   add(rewards,'p','星晶石は通常セーブとは別に、このブラウザに保存されます。ログイン中のアカウントとゲストの台帳は別です。クラウド同期は専用テーブルが必要です。','pq9-note');
   const statusLine=add(rewards,'p',storageError?'⚠️ 保存停止：'+storageError:rewardMessage,'pq9-note');statusLine.setAttribute('role','status');
   function receive(id){receiveSaved(id);paint();}
   const syncText=add(rewards,'p',syncMessage,'pq9-note');syncText.setAttribute('role','status');
   const syncBtn=add(rewards,'button',syncChecking?'クラウド診断中…':'☁️ 遠征台帳の同期診断（読取専用）');syncBtn.type='button';syncBtn.disabled=syncChecking;
   syncBtn.onclick=async()=>{
    if(syncChecking)return;
    if(typeof cloud==='undefined'||!cloud.session){syncMessage='クラウドにログインしてから診断してね。';paint();return;}
    if(cloud.busy||cloud.checking||cloud.dirty){syncMessage='既存の同期処理が完了してから診断してね。';paint();return;}
    syncChecking=true;syncMessage='比較中…';paint();
    try{
     const local=JSON.parse(JSON.stringify(s)),uid=cloud.session.user.id,row=await cloudRemote();
     if(cloud.session?.user?.id!==uid||JSON.stringify(s)!==JSON.stringify(local)||cloud.busy||cloud.checking||cloud.dirty)throw Error('診断中に端末または同期状態が変わりました');
     if(!row?.save_data)throw Error('クラウドセーブがありません');
     const plan=planLedgerSync(local,row.save_data,row.revision);
     syncMessage='台帳のみの差分：端末 '+plan.onlyLocal.length+'件／クラウド '+plan.onlyRemote.length+'件。統合後 '+plan.balance+' 星晶石。'+(plan.status==='blocked-other-data'?'他のセーブ項目にも差があります。自動統合禁止。':plan.status==='identical'?'一致。':'台帳統合候補あり。')+' ※書き込みなし';
    }catch(e){syncMessage='診断中止：'+e.message;}
    finally{syncChecking=false;paint();}
   };
   const options=rewardOptions(d,map,battle);
   const ready=options.filter(o=>o.ready&&!previewLedger.claims.includes(o.id));
   const allBtn=add(rewards,'button','受取可能な報酬を一括受取（'+ready.length+'件）');allBtn.type='button';allBtn.disabled=!ready.length||!!storageError;
   allBtn.onclick=()=>{let total=0;for(const o of ready)total+=receiveSaved(o.id);rewardMessage='今回受取：合計 '+total+' 星晶石';paint();};
   const detail=add(rewards,'details','');add(detail,'summary','報酬一覧（'+options.filter(o=>previewLedger.claims.includes(o.id)).length+'/'+options.length+'件受取済み）');
   for(const o of options){
    const claimed=previewLedger.claims.includes(o.id);
    const item=add(detail,'div','','pq9-step');
    add(item,'p',o.label+' ／ '+o.value+' 星晶石');
    const claim=add(item,'button',claimed?'受取済み':o.ready?'受け取る':'未解放');claim.type='button';claim.disabled=claimed||!o.ready||!!storageError;claim.onclick=()=>receive(o.id);
   }
   const history=add(rewards,'details','');add(history,'summary','受取履歴（'+previewLedger.claims.length+'件）');
   for(const id of [...previewLedger.claims].reverse().slice(0,30)){const [,week,route,kind]=id.split(':');add(history,'p',week+' ｜ '+(d.routes.find(r=>r.id===route)?.title||'全体')+' ｜ '+({step1:'第1地点',step2:'第2地点',step3:'第3地点',chest:'宝箱',normal:'通常敵',boss:'ボス',weekly:'週間達成'})[kind]+' ＋'+receiptValue(id),'pq9-note');}
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
    add(branchBox,'p',(sel.ready?'🔓 ':'🔒 ')+sel.chest+(sel.ready?'（発見・受取可能）':'（条件達成で発見）'),'pq9-note');
    const fights=add(card,'div','','pq9-step');
    for(const kind of ['normal','boss']){
     const unlocked=battleEligible(d,map,route.id,kind),foe=FOES[route.id][kind];
     const fight=add(fights,'button',(unlocked?'⚔️ ':'🔒 ')+foe.name+(kind==='boss'?'（ボス）':''));
     fight.type='button';fight.disabled=!!battle||!unlocked;
     fight.onclick=()=>{
      if(battle||activeScope!==scopeNow())return;
      const fresh=derive(typeof s==='undefined'?{}:s),freshMap=weeklyMap(fresh,choices,difficulty);
      if(fresh.period.start!==selectedWeek){paint();return;}
      battle=beginBattle(fresh,freshMap,route.id,kind,element);
      paint();if(battle){const target=panel.querySelector('#pq9-battle h3');target?.focus();target?.scrollIntoView({block:'start'});}
     };
    }
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
   add(panel,'p','毎週月曜0時にマップ更新。分岐・難易度の選択は画面内だけ保持し、再読み込みで初期化します。宝箱・イベントは発見表示のみ。戦闘は画面内で保持し、再読み込みや週更新で終了します。星晶石は独立した端末台帳に保存します。通常セーブには書き込みません。','pq9-note');
   const refresh=add(panel,'button','↻ 進捗を更新');refresh.type='button';refresh.onclick=paint;
  }
  const prev=render;render=function(){prev();paint();};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint();});
  window.addEventListener('storage',e=>{if(e.key===null||e.key?.startsWith(RECEIPT_PREFIX))paint();});
 }
 if(typeof module==='object'&&module.exports)module.exports={period,derive,weeklyMap,battleEligible,beginBattle,enemyIntent,affinity,canAct,battleStep,receiptId,receiptValue,emptyLedger,validateLedger,ledgerBalance,mergeLedgers,ledgerLoss,rewardOptions,claimReward,planLedgerSync,readReceipts,persistReceipt,persistClaim,syncReceipts};
 else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
 else mount();
})(typeof globalThis!=='undefined'?globalThis:this);
