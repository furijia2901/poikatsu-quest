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

 // Hidden challenge: a separate versioned weekly receipt, not a change to v1 denominations.
 const HIDDEN_BOSS=Object.freeze({name:'虚空の星喰竜ノヴァ',icon:'🌑',element:'wind',hp:250,atk:15,skill:'虚空崩星',reward:40,xp:120});
 function hiddenRequirements(d,ledger){
  const claims=validateLedger(ledger).claims,level=explorerProgress(ledger).level;
  const bossCount=ROUTES.filter(r=>claims.includes(receiptId(d.period.start,r.id,'boss'))).length;
  const treasures=chestCollection(ledger).unique;
  const requirements=[{label:'今週の9地点攻略',value:d.cleared,target:9},{label:'今週の通常ボス報酬受取',value:bossCount,target:3},{label:'遠征レベル',value:level,target:5},{label:'地域の宝物を発見',value:treasures,target:2}];
  return {requirements,unlocked:requirements.every(x=>x.value>=x.target)};
 }
 function beginHiddenBattle(d,element,ledger,owned=[],display=null){
  if(!Object.hasOwn(ELEMENTS,element)||!hiddenRequirements(d,ledger).unlocked)return null;
  const p=explorerProgress(ledger),gear=activeGear(owned,display),mp=EXPLORER_GEAR[gear]?.mp||0;
  return {version:2,week:d.period.start,routeId:'all',branchId:'hidden',kind:'hidden',difficulty:'hard',
   player:{element,hp:p.hp,maxHp:p.hp,mp:2+mp,maxMp:4+mp,potions:2},
   enemy:{...HIDDEN_BOSS,hp:HIDDEN_BOSS.hp,maxHp:HIDDEN_BOSS.hp},turn:1,status:'active',log:['虚空の裂け目に到達！'],
   growth:{level:p.level,attack:p.attack,skill:p.skill},combat:{gear,status:null}};
 }
 function hiddenPhase(b){return b?.kind==='hidden'&&b.enemy.hp<=b.enemy.maxHp/2?2:1;}
 function enemyIntent(b){
  if(b.kind==='hidden'){const phase=hiddenPhase(b),special=b.turn%(phase===2?2:3)===0;return {special,name:special?(phase===2?'終焉の星嵐':'虚空崩星'):'虚空の爪',damage:Math.round(b.enemy.atk*(phase===2?1.2:1)*(special?2:1))};}
  const special=b.turn%3===0;
  return {special,name:special?b.enemy.skill:'通常攻撃',damage:Math.round(b.enemy.atk*(special?2.15:1))};
 }
 function affinity(a,b){return ADVANTAGE[a]===b?1.3:ADVANTAGE[b]===a?0.8:1;}

 // Ver.10 combat is opt-in through beginExplorerBattle. Legacy battle fixtures keep their rules.
 const EXPLORER_ACTIONS=Object.freeze({...ACTIONS,burst:'星界奥義',cleanse:'浄化'});
 const EXPLORER_GEAR=Object.freeze({
  sword:{label:'通常攻撃 +4',attack:4},
  shield:{label:'被ダメージ 15%軽減',defense:0.85},
  cloak:{label:'状態異常の付与を防ぐ',resist:true},
  crown:{label:'最大MP +1・初期MP +1',mp:1},
  compass:{label:'星脈斬・星界奥義 +3',skill:3},
  lantern:{label:'星灯の薬の回復 +10',heal:10},
  title:{label:'防御時の被ダメージ 80%軽減',guard:0.2},
  relic:{label:'星界奥義 +8',burst:8}
 });
 const STATUS_EFFECTS=Object.freeze({
  fire:{id:'burn',label:'火傷',description:'次の2行動後にHP-5'},
  water:{id:'frost',label:'凍傷',description:'次の2行動の攻撃威力-20%'},
  wind:{id:'exposed',label:'風裂',description:'次の2行動の被ダメージ+15%'}
 });
 function actionsFor(b){return b?.combat?EXPLORER_ACTIONS:ACTIONS;}
 function activeGear(owned,id){return validateOwned(owned).includes(id)&&Object.hasOwn(EXPLORER_GEAR,id)?id:null;}
 function battleGear(b){return EXPLORER_GEAR[b.combat?.gear]||{};}
 function statusLabel(b){const v=b.combat?.status;return v?Object.values(STATUS_EFFECTS).find(e=>e.id===v.id)?.label+' 残り'+v.turns+'行動':'なし';}
 function incomingDamage(b,guard=false,status=b.combat?.status){
  const g=battleGear(b),intent=enemyIntent(b);
  return Math.max(1,Math.round(intent.damage*affinity(b.enemy.element,b.player.element)*(g.defense??1)*(guard?(g.guard??0.3):1)*(status?.id==='exposed'?1.15:1)));
 }
 function enhancedStep(b,action){
  const p={...b.player},e={...b.enemy},g=battleGear(b),log=[...b.log],intent=enemyIntent(b);
  let effect=b.combat.status?{...b.combat.status}:null,guard=false;
  const note=t=>log.push('T'+b.turn+' '+t);
  const result=(status,nextEffect)=>({...b,player:p,enemy:e,combat:{...b.combat,status:nextEffect},turn:status==='active'?b.turn+1:b.turn,status,log:log.slice(-30)});
  if(['attack','skill','burst'].includes(action)){
   const power=action==='attack'?b.growth.attack+(g.attack||0):action==='skill'?b.growth.skill+(g.skill||0):58+Math.floor((b.growth.level-1)/2)+(g.skill||0)+(g.burst||0);
   const damage=Math.max(1,Math.round(power*affinity(p.element,e.element)*(effect?.id==='frost'?0.8:1)));
   e.hp=Math.max(0,e.hp-damage);
   if(b.kind==='hidden'&&hiddenPhase(b)===1&&e.hp>0&&e.hp<=e.maxHp/2)note('第2形態：虚空覚醒！ 次ターンから大技頻度が上昇');
   p.mp=action==='attack'?Math.min(p.maxMp,p.mp+1):p.mp-(action==='skill'?2:4);
   note(EXPLORER_ACTIONS[action]+'：'+damage+'ダメージ');
  }else if(action==='guard'){
   guard=true;p.mp=Math.min(p.maxMp,p.mp+2);note('防御：被ダメージを'+Math.round((1-(g.guard??0.3))*100)+'%軽減・状態異常を防ぐ');
  }else if(action==='cleanse'){
   p.mp--;effect=null;note('浄化：状態異常解除');
  }else{
   p.potions--;const restored=Math.min(38+(g.heal||0),p.maxHp-p.hp);p.hp+=restored;note('星灯の薬：HP '+restored+'回復');
  }
  if(e.hp===0){note('勝利！');return result('won',null);}
  const damage=incomingDamage(b,guard,effect);p.hp=Math.max(0,p.hp-damage);note(intent.name+'：'+damage+'ダメージを受けた');
  if(effect?.id==='burn'&&p.hp>0){p.hp=Math.max(0,p.hp-5);note('火傷：HP-5');}
  if(effect&&--effect.turns<=0){effect=null;note('状態異常が解除された');}
  if(intent.special&&p.hp>0&&!guard&&!g.resist){
   const next=STATUS_EFFECTS[e.element];if(next){effect={id:next.id,turns:2};note(next.label+'：'+next.description);}
  }else if(intent.special&&(guard||g.resist))note('状態異常を防いだ');
  const status=p.hp===0?'lost':b.turn>=30?'timeout':'active';
  if(status!=='active')note(status==='lost'?'敗北…':'制限ターン終了');
  return result(status,effect);
 }
 function canAct(b,action){
  if(!b||b.status!=='active'||!Object.hasOwn(actionsFor(b),action))return false;
  if(action==='burst')return b.player.mp>=4;
  if(action==='cleanse')return b.player.mp>=1&&!!b.combat?.status;
  return action==='skill'?b.player.mp>=2:action==='heal'?b.player.potions>0&&b.player.hp<b.player.maxHp:true;
 }
 function battleStep(b,action){
  if(!canAct(b,action))return b;
  if(b.combat)return enhancedStep(b,action);
  const p={...b.player},e={...b.enemy},log=[...b.log],intent=enemyIntent(b);
  const note=t=>log.push('T'+b.turn+' '+t);
  let guarding=false;
  if(action==='attack'||action==='skill'){
   const damage=Math.round((action==='skill'?(b.growth?.skill??36):(b.growth?.attack??21))*affinity(p.element,e.element));
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
  if(route==='all')return kind==='weekly'?'v1:'+week+':all:weekly':kind==='hidden'?'v2:'+week+':all:hidden':null;
  if(!Object.hasOwn(FOES,route)||!Object.hasOwn(REWARD_VALUES,kind)||kind==='weekly')return null;
  return 'v1:'+week+':'+route+':'+kind;
 }
 function receiptValue(id){
  if(typeof id!=='string')return null;
  const [version,week,route,kind,...extra]=id.split(':');
  return !extra.length&&receiptId(week,route,kind)===id?(kind==='hidden'?HIDDEN_BOSS.reward:REWARD_VALUES[kind]):null;
 }

 // Immutable chest v1 drops: the receipt is the single source of truth.
 // No extra wallet, random state, persistence key or database mutation is needed.
 const CHEST_RARITIES=Object.freeze([
  {id:'N',label:'N',weight:5000,color:'#b7c6d7'},
  {id:'R',label:'R',weight:3000,color:'#8cdda5'},
  {id:'SR',label:'SR',weight:1500,color:'#8ebfff'},
  {id:'SSR',label:'SSR',weight:400,color:'#d5a4ff'},
  {id:'UR',label:'UR',weight:100,color:'#ffdb8d'}
 ].map(Object.freeze));
 const CHEST_ITEMS=Object.freeze({
  market:Object.freeze([
   ['market-n','黄金の古銭','🪙'],['market-r','交易商の印章','📜'],['market-sr','琥珀の星砂','💎'],['market-ssr','黄金王の羅針盤','🧭'],['market-ur','太陽王の聖杯','🏆']
  ].map(Object.freeze)),
  trail:Object.freeze([
   ['trail-n','星露の葉','🍃'],['trail-r','風渡りの羽根','🪶'],['trail-sr','蒼樹の結晶','💎'],['trail-ssr','精霊樹の心臓','🌿'],['trail-ur','原初の星花','🌸']
  ].map(Object.freeze)),
  citadel:Object.freeze([
   ['citadel-n','月光の石片','🌙'],['citadel-r','観測者の星図','🗺️'],['citadel-sr','星海の水晶','🔮'],['citadel-ssr','天空城の星核','🌌'],['citadel-ur','創星の天球儀','✨']
  ].map(Object.freeze))
 });
 function chestRarity(roll){
  if(!Number.isInteger(roll)||roll<0||roll>=10000)throw Error('宝箱抽選値不正');
  for(const rarity of CHEST_RARITIES){if(roll<rarity.weight)return rarity;roll-=rarity.weight;}
  throw Error('宝箱排出率不正');
 }
 // Stable 32-bit mixed hash, versioned and independent of route branch/difficulty/device.
 function chestRoll(id){
  let h=hash('pq10-chest-v1:'+id);h=Math.imul(h^(h>>>16),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);return ((h^(h>>>16))>>>0)%10000;
 }
 function chestDrop(id){
  if(receiptValue(id)===null||!id.endsWith(':chest'))return null;
  const [,week,route]=id.split(':'),rarity=chestRarity(chestRoll(id));
  const [itemId,name,icon]=CHEST_ITEMS[route][CHEST_RARITIES.indexOf(rarity)];
  return {receipt:id,week,route,itemId,name,icon,rarity:rarity.id,color:rarity.color};
 }
 function chestCollection(raw){
  const drops=validateLedger(raw).claims.filter(id=>id.endsWith(':chest')).map(chestDrop).sort((a,b)=>b.week.localeCompare(a.week)||a.route.localeCompare(b.route));
  const counts={};for(const drop of drops)counts[drop.itemId]=(counts[drop.itemId]||0)+1;
  return {drops,counts,unique:Object.keys(counts).length,total:drops.length};
 }
 function emptyLedger(){return {version:1,claims:[]};}
 // Ver.10.0: progression is derived exclusively from validated immutable receipts.
 // Currency spending, retries and reloading never award EXP.
 const EXPLORER_XP=Object.freeze({step1:10,step2:16,step3:24,chest:25,normal:30,boss:80,weekly:100});
 const MAX_EXPLORER_LEVEL=30;
 function explorerProgress(raw){
  const claims=validateLedger(raw).claims;
  const xp=claims.reduce((total,id)=>total+(id.endsWith(':hidden')?HIDDEN_BOSS.xp:EXPLORER_XP[id.split(':')[3]]),0);
  let level=1,spent=0;
  while(level<MAX_EXPLORER_LEVEL){
   const need=100+20*(level-1);
   if(xp-spent<need)break;
   spent+=need;level++;
  }
  const maxed=level===MAX_EXPLORER_LEVEL,bonus=level-1;
  return {xp,level,maxed,progress:maxed?0:xp-spent,next:maxed?0:100+20*bonus,
   hp:120+bonus*2,attack:21+Math.floor(bonus/3),skill:36+Math.floor(bonus/2),
   rank:level>=25?'星海の先駆者':level>=15?'星界の探検王':level>=8?'熟練探索者':level>=3?'星灯の探索者':'遠征見習い'};
 }
 function beginExplorerBattle(d,map,routeId,kind,element,ledger,owned=[],display=null){
  const b=beginBattle(d,map,routeId,kind,element);if(!b)return null;
  const p=explorerProgress(ledger);
  const gear=activeGear(owned,display),mp=EXPLORER_GEAR[gear]?.mp||0;
  return {...b,player:{...b.player,hp:p.hp,maxHp:p.hp,mp:b.player.mp+mp,maxMp:b.player.maxMp+mp},growth:{level:p.level,attack:p.attack,skill:p.skill},combat:{gear,status:null}};
 }

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
 function rewardOptions(d,map,battle=null,ledger=emptyLedger()){
  const list=[];
  const add=(route,kind,label,ready)=>list.push({id:receiptId(d.period.start,route,kind),route,kind,label,ready:!!ready,value:kind==='hidden'?HIDDEN_BOSS.reward:REWARD_VALUES[kind]});
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
  const hidden=hiddenRequirements(d,ledger);if(hidden.unlocked||validateLedger(ledger).claims.includes(receiptId(d.period.start,'all','hidden')))add('all','hidden','虚空の星喰竜：討伐報酬',hidden.unlocked&&battle?.kind==='hidden'&&battle.week===d.period.start&&battle.status==='won'&&battle.enemy?.hp===0);
  return list;
 }
 function claimReward(raw,d,map,battle,id){
  const ledger=validateLedger(raw);
  if(ledger.claims.includes(id))return {ledger,credited:0,status:'duplicate'};
  const option=rewardOptions(d,map,battle,ledger).find(x=>x.id===id&&x.ready);
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

 // Phase 5: fixed-price, one-time collectibles. Account purchases are server-authoritative.
 const SHOP=Object.freeze({
  sword:{name:'星断の剣',icon:'⚔️',type:'武器',cost:60,description:'星の光を宿す遠征記念武器'},
  shield:{name:'蒼樹の盾',icon:'🛡️',type:'装備',cost:55,description:'星風の森の守護を象徴する盾'},
  cloak:{name:'宵星の外套',icon:'🧥',type:'装飾',cost:45,description:'夜空のような外套'},
  crown:{name:'星海の冠',icon:'👑',type:'装飾',cost:100,description:'星海の幻竜を称える冠'},
  compass:{name:'月銀の羅針盤',icon:'🧭',type:'宝物',cost:35,description:'未知の道を指す羅針盤'},
  lantern:{name:'星灯のランタン',icon:'🏮',type:'宝物',cost:25,description:'旅路を照らす小さな光'},
  title:{name:'星を継ぐ者',icon:'🏅',type:'称号',cost:80,description:'遠征者の特別な称号'},
  relic:{name:'双星の秘宝',icon:'💠',type:'宝物',cost:120,description:'二つの星が重なる伝説の秘宝'}
 });
 const SHOP_PREFIX='pq9-shop-v1:',EQUIP_PREFIX='pq9-display-v1:';
 function shopPrefix(scope){receiptPrefix(scope);return SHOP_PREFIX+encodeURIComponent(scope)+':';}
 function validateOwned(ids){
  if(!Array.isArray(ids)||ids.some(id=>typeof id!=='string'||!Object.hasOwn(SHOP,id))||new Set(ids).size!==ids.length)throw Error('遠征購入履歴が不正');
  return [...ids].sort();
 }
 function readOwned(storage,scope){
  const prefix=shopPrefix(scope),ids=[];
  for(let i=0;i<storage.length;i++){
   const k=storage.key(i);if(typeof k!=='string'||!k.startsWith(prefix))continue;
   if(storage.getItem(k)!=='1')throw Error('遠征購入履歴が破損');
   ids.push(k.slice(prefix.length));
  }
  return validateOwned(ids);
 }

 const GACHA_COST=20,GACHA_PITY=20;
 const GACHA_ITEMS=Object.freeze({
  n1:['N','星屑の小瓶','🫙'],n2:['N','旅人の星章','⭐'],r1:['R','月銀の羽飾り','🪶'],r2:['R','流星の護符','📿'],
  sr1:['SR','星霧の魔導書','📖'],sr2:['SR','蒼月の短剣','🗡️'],ssr1:['SSR','黎明の星杖','🪄'],ssr2:['SSR','銀河の翼','🪽'],
  ur1:['UR','星創の聖剣','⚔️'],ur2:['UR','永遠の星冠','👑']
 });
 const DRAW_PREFIX='pq10-draw-v1:',PENDING_PREFIX='pq10-pending-v1:';
 const validRequest=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
 function validateDraws(raw){
  if(!Array.isArray(raw)||raw.length>50000)throw Error('召喚履歴不正');
  const rows=raw.map(x=>{if(!x||!Number.isInteger(x.draw_no)||!validRequest(x.request_id)||!Object.hasOwn(GACHA_ITEMS,x.item_id))throw Error('召喚記録不正');return {draw_no:x.draw_no,request_id:x.request_id,item_id:x.item_id};}).sort((a,b)=>a.draw_no-b.draw_no);
  const seen=new Set();let pity=0;
  for(let i=0;i<rows.length;i++){const x=rows[i];if(x.draw_no!==i+1||seen.has(x.request_id))throw Error('召喚履歴に欠落または重複');seen.add(x.request_id);pity++;if(GACHA_ITEMS[x.item_id][0]==='UR')pity=0;else if(pity>=GACHA_PITY)throw Error('天井記録不正');}
  return rows;
 }
 function gachaSummary(raw){
  const rows=validateDraws(raw),counts={};let pity=0;
  for(const x of rows){counts[x.item_id]=(counts[x.item_id]||0)+1;pity=GACHA_ITEMS[x.item_id][0]==='UR'?0:pity+1;}
  return {total:rows.length,spent:rows.length*GACHA_COST,pity,remaining:GACHA_PITY-pity,counts,unique:Object.keys(counts).length,fragments:rows.length-Object.keys(counts).length};
 }
 function drawItem(pity,roll,variant){
  if(!Number.isInteger(pity)||pity<0||pity>=GACHA_PITY||!Number.isInteger(roll)||roll<0||roll>=10000||![1,2].includes(variant))throw Error('召喚抽選値不正');
  return (pity===GACHA_PITY-1||roll<300?'ur':roll<1000?'ssr':roll<3000?'sr':roll<6000?'r':'n')+variant;
 }
 function drawPlan(ledger,owned,raw,request,roll,variant,credit=0){
  const rows=validateDraws(raw),old=rows.find(x=>x.request_id===request);if(!validRequest(request))throw Error('召喚要求ID不正');
  if(old)return {status:'duplicate',row:old,rows};
  if(rows.length>=50000)throw Error('召喚上限');
  if(wallet(ledger,owned,rows).balance+credit<GACHA_COST)return {status:'insufficient',rows};
  const row={draw_no:rows.length+1,request_id:request,item_id:drawItem(gachaSummary(rows).pity,roll,variant)};
  return {status:'drawn',row,rows:validateDraws([...rows,row])};
 }
 function drawKey(scope){receiptPrefix(scope);return DRAW_PREFIX+encodeURIComponent(scope);}
 function readDraws(storage,scope){const raw=storage.getItem(drawKey(scope));return validateDraws(raw===null?[]:JSON.parse(raw));}
 function saveDraws(storage,scope,raw){
  const rows=validateDraws(raw),old=readDraws(storage,scope);
  if(old.some((x,i)=>JSON.stringify(x)!==JSON.stringify(rows[i])))throw Error('召喚履歴の消失・競合を検出');
  const key=drawKey(scope),value=JSON.stringify(rows);storage.setItem(key,value);if(storage.getItem(key)!==value)throw Error('召喚履歴保存失敗');return rows;
 }
 async function drawGuest(storage,scope,locks,request,random){
  if(scope!=='guest'||!locks?.request)throw Error('安全な端末召喚を利用できません');
  return locks.request('pq9-shop-guest',async()=>{
   const rows=readDraws(storage,scope),result=drawPlan(readReceipts(storage,scope),readOwned(storage,scope),rows,request,random(10000),1+random(2));
   if(result.status==='drawn')saveDraws(storage,scope,result.rows);return result;
  });
 }
 function secureRandom(max){const a=new Uint32Array(1),limit=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;}
 function wallet(ledger,owned,draws=[]){
  const earned=ledgerBalance(ledger),spent=validateOwned(owned).reduce((n,id)=>n+SHOP[id].cost,0)+validateDraws(draws).length*GACHA_COST;
  return {earned,spent,balance:earned-spent};
 }
 function purchasePlan(ledger,owned,id,draws=[]){
  const ids=validateOwned(owned),w=wallet(ledger,ids,draws);
  if(!Object.hasOwn(SHOP,id))return {status:'invalid',owned:ids,wallet:w};
  if(ids.includes(id))return {status:'duplicate',owned:ids,wallet:w};
  if(w.balance<SHOP[id].cost)return {status:'insufficient',owned:ids,wallet:w};
  const next=validateOwned([...ids,id]);return {status:'purchased',owned:next,wallet:wallet(ledger,next,draws)};
 }
 function storeOwned(storage,scope,id){
  if(!Object.hasOwn(SHOP,id))throw Error('商品ID不正');
  const key=shopPrefix(scope)+id,old=storage.getItem(key);
  if(old!==null&&old!=='1')throw Error('購入履歴が破損');
  if(old===null)storage.setItem(key,'1');
  if(storage.getItem(key)!=='1')throw Error('購入保存に失敗');
 }
 async function buyGuest(storage,scope,id,locks){
  if(scope!=='guest')throw Error('アカウント購入はクラウドで処理します');
  if(!locks||typeof locks.request!=='function')throw Error('このブラウザでは安全な購入が利用できません');
  return locks.request('pq9-shop-guest',async()=>{
   const plan=purchasePlan(readReceipts(storage,scope),readOwned(storage,scope),id,readDraws(storage,scope));
   if(plan.status==='purchased')storeOwned(storage,scope,id);
   return {...plan,owned:readOwned(storage,scope)};
  });
 }
 function collectionMilestones(ledger,owned){
  const ids=validateOwned(owned),claims=validateLedger(ledger).claims;
  const weeks=new Set(claims.filter(id=>id.endsWith(':all:weekly')).map(id=>id.split(':')[1]));
  const bosses=claims.filter(id=>id.endsWith(':boss')).length;
  return [{name:'初めての宝物',value:ids.length,target:1},{name:'遠征収集家',value:ids.length,target:4},{name:'星の宝物庫',value:ids.length,target:8},{name:'歴戦の遠征者',value:bosses,target:6},{name:'星巡りの常連',value:weeks.size,target:4}].map(x=>({...x,done:x.value>=x.target}));
 }
 function readDisplay(storage,scope,owned){
  const id=storage.getItem(EQUIP_PREFIX+encodeURIComponent(scope));
  return id&&validateOwned(owned).includes(id)?id:null;
 }
 function setDisplay(storage,scope,owned,id){
  const key=EQUIP_PREFIX+encodeURIComponent(scope);
  if(id===null){storage.removeItem(key);return null;}
  if(!validateOwned(owned).includes(id))throw Error('未所持のアイテム');
  storage.setItem(key,id);return readDisplay(storage,scope,owned);
 }

 function createSandbox(now=Date.now()){
  const d=derive({},now);
  d.metrics={quests:100,outdoor:100,categories:5,outdoorTypes:3,balanced:100,combinedDays:7};
  d.routes=d.routes.map(r=>({...r,cleared:3,steps:r.steps.map(s=>({...s,value:s.target,met:true,unlocked:true,cleared:true}))}));
  d.cleared=9;d.rank='星巡りの英雄';
  return {d,ledger:emptyLedger(),owned:[],display:null,battle:null,difficulty:'easy',element:'water',choices:{},credit:1000,draws:[]};
 }
 function sandboxWallet(t){const w=wallet(t.ledger,t.owned,t.draws||[]);return {...w,earned:w.earned+t.credit,balance:w.balance+t.credit};}
 function sandboxClaim(t,id){
  const result=claimReward(t.ledger,t.d,weeklyMap(t.d,t.choices,t.difficulty),t.battle,id);
  return {...t,ledger:result.ledger,lastClaim:result.credited,lastDrop:result.status==='claimed'?chestDrop(id):null};
 }
 function sandboxBuy(t,id){
  if(!Object.hasOwn(SHOP,id)||t.owned.includes(id)||sandboxWallet(t).balance<SHOP[id].cost)return t;
  return {...t,owned:validateOwned([...t.owned,id])};
 }

 // Collection is a read-only projection of the three immutable ledgers.
 const CODEX_GROUPS=Object.freeze({gear:'遠征装備',chest:'地域の宝物',gacha:'限定召喚',enemy:'討伐記録'});
 function expeditionCodex(ledger,owned,draws){
  const claims=validateLedger(ledger).claims,items=validateOwned(owned),chests=chestCollection(ledger),summons=gachaSummary(draws);
  const entries=[];
  const add=(group,id,name,icon,count,detail,rarity=null)=>entries.push({group,id,name,icon,count,detail,rarity,found:count>0});
  for(const [id,item] of Object.entries(SHOP))add('gear','gear:'+id,item.name,item.icon,items.includes(id)?1:0,EXPLORER_GEAR[id].label+' ／ ショップ '+item.cost+'星晶石');
  for(const route of ROUTES)CHEST_ITEMS[route.id].forEach(([id,name,icon],i)=>add('chest','chest:'+id,name,icon,chests.counts[id]||0,route.title+'の宝箱',CHEST_RARITIES[i].id));
  for(const [id,[rarity,name,icon]] of Object.entries(GACHA_ITEMS))add('gacha','gacha:'+id,name,icon,summons.counts[id]||0,'星界遠征限定召喚',rarity);
  const wins={};
  for(const id of claims){const [,week,route,kind]=id.split(':');if(kind==='normal'||kind==='boss'){const key=route+':'+kind;wins[key]=(wins[key]||0)+1;}}
  for(const route of ROUTES)for(const kind of ['normal','boss']){
   const foe=FOES[route.id][kind];add('enemy','enemy:'+route.id+':'+kind,foe.name,foe.icon,wins[route.id+':'+kind]||0,route.title+' ／ '+(kind==='boss'?'ボス':'通常敵')+' ／ '+ELEMENTS[foe.element]+'属性');
  }
  add('enemy','enemy:all:hidden',HIDDEN_BOSS.name,HIDDEN_BOSS.icon,claims.filter(x=>x.endsWith(':all:hidden')).length,'虚空の裂け目 ／ 隠しボス ／ 風属性');
  const groups=Object.fromEntries(Object.keys(CODEX_GROUPS).map(key=>{const rows=entries.filter(x=>x.group===key);return [key,{found:rows.filter(x=>x.found).length,total:rows.length}];}));
  return {entries,groups,found:entries.filter(x=>x.found).length,total:entries.length,fragments:summons.fragments};
 }
 function filterCodex(codex,group='all',status='all',rarity='all'){
  return codex.entries.filter(x=>(group==='all'||x.group===group)&&(status==='all'||(status==='found'?x.found:!x.found))&&(rarity==='all'||x.rarity===rarity));
 }
 function renderCodex(parent,add,model,state,change){
  const bar=add(parent,'progress','');bar.max=model.total;bar.value=model.found;bar.setAttribute('aria-label','図鑑達成率');
  add(parent,'strong','図鑑達成 '+model.found+' / '+model.total+' 種（'+Math.floor(model.found/model.total*100)+'%）');
  const filters=add(parent,'div','','pq10-codex-filters');
  for(const [key,label,options] of [
   ['group','分類',[['all','すべて'],...Object.entries(CODEX_GROUPS).map(([k,v])=>[k,v+' '+model.groups[k].found+'/'+model.groups[k].total])]],
   ['status','収集状況',[['all','すべて'],['found','発見済み'],['missing','未発見']]],
   ['rarity','レア度',[['all','すべて'],...CHEST_RARITIES.map(x=>[x.id,x.label])]]
  ]){
   const l=add(filters,'label',label+' '),select=add(l,'select','');select.setAttribute('aria-label','図鑑 '+label);
   for(const [id,name] of options){const opt=add(select,'option',name);opt.value=id;}
   select.value=state[key];select.onchange=()=>change(key,select.value);
  }
  const rows=filterCodex(model,state.group,state.status,state.rarity);
  add(parent,'p','表示 '+rows.length+' 種 ／ 重複星片 '+model.fragments,'pq9-note');
  const grid=add(parent,'div','','pq9-grid pq10-codex-grid');
  for(const item of rows){
   const card=add(grid,'div','','pq9-route pq10-codex-card');card.dataset.codexId=item.id;card.dataset.found=String(item.found);
   if(item.found)card.classList.add('pq9-item-owned');
   const color=CHEST_RARITIES.find(r=>r.id===item.rarity)?.color;
   if(color){card.style.borderColor=color;const badge=add(card,'strong',item.rarity);badge.style.color=color;}
   add(card,'div',item.found?item.icon:'❔','pq9-fighter-icon');
   add(card,'h4',item.found?item.name:'未発見');
   add(card,'p',item.detail,'pq9-note');
   add(card,'p',item.found?(item.group==='enemy'?'報酬受取済み '+item.count+' 回':'所持 ×'+item.count):'🔒 未発見','pq9-note');
  }
  if(!rows.length)add(parent,'p','条件に一致する記録はありません。','pq9-note');
  add(parent,'p','討伐記録は勝利報酬を受け取った週を計数。再戦だけでは増えません。図鑑の閲覧による報酬・セーブ変更はありません。','pq9-note');
 }

 // Presentation-only visual feedback derived from the actual battle transition.
 const REGION_ART=Object.freeze({
  market:{icon:'🏜️',label:'黄金の砂丘',accent:'#e4bc72'},
  trail:{icon:'🌲',label:'星風の樹海',accent:'#87d7b3'},
  citadel:{icon:'🏰',label:'天空の城塞',accent:'#b7a8ff'},
  all:{icon:'🌑',label:'虚空の裂け目',accent:'#ed9cdc'}
 });
 function battleFeedback(before,after,action){
  if(!before||!after||before===after)return null;
  return {action,enemyDamage:Math.max(0,before.enemy.hp-after.enemy.hp),playerLoss:Math.max(0,before.player.hp-after.player.hp),playerNetHeal:Math.max(0,after.player.hp-before.player.hp),awakened:before.kind==='hidden'&&hiddenPhase(before)===1&&hiddenPhase(after)===2&&after.status==='active',won:after.status==='won',lost:after.status==='lost'};
 }
 function renderBattleFeedback(parent,add,feedback){
  if(!feedback)return;
  const box=add(parent,'div','','pq10-impact');box.setAttribute('role','status');box.dataset.action=feedback.action;
  if(feedback.awakened)add(box,'strong','✦ 虚空覚醒 — PHASE 2 ✦','pq10-awaken');
  if(feedback.enemyDamage)add(box,'strong','敵 −'+feedback.enemyDamage+' HP','pq10-hit');
  if(feedback.playerLoss)add(box,'span','自分 −'+feedback.playerLoss+' HP','pq10-loss');
  if(feedback.playerNetHeal)add(box,'span','自分 ＋'+feedback.playerNetHeal+' HP','pq10-heal');
  if(feedback.action==='guard')add(box,'span','🛡️ 防御','pq10-defense');
  if(feedback.action==='cleanse')add(box,'span','✨ 浄化','pq10-heal');
  if(feedback.won)add(box,'strong','🏆 VICTORY','pq10-victory');
  if(feedback.lost)add(box,'strong','戦闘終了','pq10-loss');
 }
 function mountSandbox(openButton){
  const dialog=document.createElement('dialog');dialog.id='pq91-sandbox';dialog.setAttribute('aria-label','遠征テストモード');
  dialog.style.cssText='width:min(760px,calc(100% - 24px));max-height:90dvh;box-sizing:border-box;overflow:auto;background:#17213b;color:#fff;border:2px solid #e8b653;border-radius:16px;padding:18px';
  document.body.append(dialog);
  let t=createSandbox(),view='map',message='',feedback=null,codexFilter={group:'all',status:'all',rarity:'all'};
  const add=(p,tag,txt,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=txt;p.append(e);return e;};
  function button(p,label,fn,disabled=false){const b=add(p,'button',label);b.type='button';b.disabled=disabled;b.style.cssText='min-height:44px;margin:4px;white-space:normal;max-width:100%';b.onclick=fn;return b;}
  function section(p,title){const el=add(p,'section','');el.style.cssText='padding:12px;margin:10px 0;border:1px solid #8173a8;border-radius:12px;background:#202c47';add(el,'h3',title);return el;}
  function show(text){message=text;paint();}
  function paint(){
   if(!dialog.open)return;
   const impact=feedback;feedback=null;dialog.replaceChildren();add(dialog,'h2','🧪 Ver.10.0 遠征テストモード');
   add(dialog,'p','試験専用・本番反映なし。通常セーブ・端末台帳・クラウドには書き込みません。閉じると試験記録は破棄されます。');
   add(dialog,'strong','試験星晶石：'+sandboxWallet(t).balance+' 個 ／ 9/9地点仮クリア');
   const growth=explorerProgress(t.ledger);add(dialog,'p','試験遠征 Lv.'+growth.level+' ／ 累計EXP '+growth.xp+' ／ '+growth.rank);
   button(dialog,'テストを終了',()=>dialog.close());
   button(dialog,'試験データをリセット',()=>{t=createSandbox();view='map';codexFilter={group:'all',status:'all',rarity:'all'};show('試験データを初期化しました');});
   const nav=add(dialog,'div','');
   for(const [id,label] of [['map','遠征'],['battle','戦闘'],['rewards','報酬'],['shop','ショップ'],['gacha','ガチャ'],['codex','図鑑']]){const b=button(nav,label,()=>{view=id;paint();});b.setAttribute('aria-pressed',String(view===id));}
   const status=add(dialog,'p',message);status.setAttribute('role','status');
   const map=weeklyMap(t.d,t.choices,t.difficulty);
   if(view==='map'){
    const cfg=section(dialog,'難易度と属性');
    for(const [id,def] of Object.entries(DIFFICULTIES))button(cfg,def.label+(t.difficulty===id?' ✓':''),()=>{t.difficulty=id;paint();},t.battle?.status==='active');
    for(const [id,label] of Object.entries(ELEMENTS))button(cfg,label+(t.element===id?' ✓':''),()=>{t.element=id;paint();},t.battle?.status==='active');
    const hidden=section(dialog,'🌑 虚空の裂け目');const hr=hiddenRequirements(t.d,t.ledger);for(const x of hr.requirements)add(hidden,'p',x.label+' '+x.value+'/'+x.target);
    button(hidden,'隠しボス解放条件を試す',()=>{const claims=ROUTES.flatMap(r=>['step1','step2','step3','chest','normal','boss'].map(k=>receiptId(t.d.period.start,r.id,k))).concat(receiptId(t.d.period.start,'all','weekly'));t.ledger=mergeLedgers(t.ledger,{version:1,claims});show('試験専用の解放条件を設定しました');},!!t.battle);
    button(hidden,'隠しボスに挑戦',()=>{t.battle=beginHiddenBattle(t.d,t.element,t.ledger,t.owned,t.display);view='battle';show('隠しボス戦開始');},!hr.unlocked||!!t.battle);
    for(const route of t.d.routes){const m=map.find(x=>x.id===route.id),p=section(dialog,route.icon+' '+route.title+' 3/3');add(p,'p',m.region+' ／ '+m.event.name);
     for(const br of m.branches)button(p,br.name+(m.selected.id===br.id?' ✓':''),()=>{t.choices[route.id]=br.id;paint();});
     add(p,'p','宝箱：'+m.selected.chest+'（解放済み）');
     for(const kind of ['normal','boss'])button(p,FOES[route.id][kind].name,()=>{t.battle=beginExplorerBattle(t.d,map,route.id,kind,t.element,t.ledger,t.owned,t.display);view='battle';show('戦闘開始');},t.battle?.status==='active');
    }
   }else if(view==='battle'){
    const p=section(dialog,'遠征バトル');
    if(!t.battle){add(p,'p','遠征メニューで敵を選択してください');return;}
    const b=t.battle;renderBattleFeedback(p,add,impact);add(p,'strong',b.enemy.icon+' '+b.enemy.name+' ／ TURN '+b.turn);
    add(p,'p','HP '+b.player.hp+'/'+b.player.maxHp+' ／ MP '+b.player.mp+'/'+b.player.maxMp+' ／ 薬 '+b.player.potions);
    add(p,'p','敵HP '+b.enemy.hp+'/'+b.enemy.maxHp);if(b.kind==='hidden')add(p,'p','形態 '+hiddenPhase(b)+' / 2');
    if(b.status==='active'){const intent=enemyIntent(b);add(p,'p','敵の予告：'+intent.name+' ／ '+intent.damage);
     add(p,'p','装備：'+(b.combat?.gear?SHOP[b.combat.gear].name+' ／ '+EXPLORER_GEAR[b.combat.gear].label:'なし')+' ／ 状態異常：'+statusLabel(b));
     for(const [id,label] of Object.entries(actionsFor(b)))button(p,label,()=>{const before=t.battle;t.battle=battleStep(before,id);feedback=battleFeedback(before,t.battle,id);paint();},!canAct(b,id));
    }else{add(p,'strong',b.status==='won'?'🏆 勝利！':'戦闘終了：'+b.status);
     if(b.status==='won'){const id=receiptId(b.week,b.routeId,b.kind);button(p,'勝利報酬を受取',()=>{t=sandboxClaim(t,id);show('🏆 星晶石 ＋'+t.lastClaim);},t.ledger.claims.includes(id));}
    }
    for(const line of b.log.slice(-6))add(p,'p',line);
    button(p,'戦闘を終了して遠征へ',()=>{t.battle=null;view='map';paint();});
   }else if(view==='rewards'){
    const p=section(dialog,'試験報酬');
    const options=rewardOptions(t.d,map,t.battle,t.ledger);
    add(p,'p','受取履歴：'+t.ledger.claims.length+' / '+options.length+'件');
    for(const o of options){const got=t.ledger.claims.includes(o.id);const row=add(p,'div','');add(row,'span',o.label+' ／ ＋'+o.value+' ');
     button(row,got?'受取済み':o.ready?'受け取る':'未解放',()=>{t=sandboxClaim(t,o.id);show((o.kind==='chest'?'🎁 宝箱開封！':'💎 報酬獲得！')+' 星晶石 ＋'+t.lastClaim+(t.lastDrop?' ／ '+t.lastDrop.rarity+' '+t.lastDrop.name:''));},got||!o.ready);
    }
    const chests=chestCollection(t.ledger);add(p,'h3','試験宝箱コレクション '+chests.unique+'/15');
    for(const drop of chests.drops)add(p,'p',drop.icon+' '+drop.rarity+' '+drop.name);
    add(p,'p','クラウド同期は試験モードでは無効です。');
   }else if(view==='gacha'){
    const p=section(dialog,'試験限定召喚'),summary=gachaSummary(t.draws);
    add(p,'p','1回20星晶石 ／ URまであと最大 '+summary.remaining+' 回 ／ 星片 '+summary.fragments);
    button(p,'試験召喚（20星晶石）',()=>{const result=drawPlan(t.ledger,t.owned,t.draws,crypto.randomUUID(),secureRandom(10000),1+secureRandom(2),t.credit);if(result.status==='drawn'){t.draws=result.rows;show('召喚成功：'+GACHA_ITEMS[result.row.item_id].join(' '));}},sandboxWallet(t).balance<20);
    for(const row of [...t.draws].reverse().slice(0,10))add(p,'p',row.draw_no+'：'+GACHA_ITEMS[row.item_id].join(' '));
   }else if(view==='codex'){
    const p=section(dialog,'試験遠征図鑑');renderCodex(p,add,expeditionCodex(t.ledger,t.owned,t.draws),codexFilter,(key,value)=>{codexFilter[key]=value;paint();});
   }else{
    const p=section(dialog,'試験ショップ '+t.owned.length+'/8');
    for(const [id,item] of Object.entries(SHOP)){const row=section(p,item.icon+' '+item.name+' ／ '+item.cost+'星晶石');
     button(row,t.owned.includes(id)?'獲得済み':'交換する',()=>{const next=sandboxBuy(t,id);if(next!==t){t=next;show('🎉 '+item.name+' 獲得！');}},t.owned.includes(id)||sandboxWallet(t).balance<item.cost);
     if(t.owned.includes(id))button(row,t.display===id?'展示解除':'遠征に展示',()=>{t.display=t.display===id?null:id;show(t.display?'展示中：'+item.name:'展示解除');});
    }
    if(t.display)add(p,'strong','展示中：'+SHOP[t.display].name);
   }
  }
  dialog.addEventListener('close',()=>{t=createSandbox();dialog.remove();if(openButton.isConnected)openButton.focus();},{once:true});
  dialog.showModal();paint();
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

  style.textContent+='#expedition90 [hidden]{display:none!important}#expedition90 .pq9-menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,82px),1fr));gap:6px;margin:12px 0}#expedition90 .pq9-menu button{min-height:44px;white-space:normal;margin:0;padding:8px 4px}#expedition90 .pq9-menu button[aria-pressed=true]{border:1px solid #f1d292;background:#55486a;color:#fff4dc}#expedition90 .pq9-route{margin:10px 0;overflow-wrap:anywhere}#expedition90 .pq9-grid .pq9-route{margin:0}#expedition90 .pq9-route button{max-width:100%;white-space:normal;min-height:44px}#expedition90 .pq9-hero{position:relative;overflow:hidden;background:radial-gradient(ellipse at 85% 5%,#8172b877,transparent 55%),radial-gradient(circle at 8% 90%,#2b799955,transparent 50%),linear-gradient(145deg,#202b49,#10172e)}#expedition90 .pq9-hero h2{letter-spacing:.04em}#expedition90 .pq9-mapline{border-left:2px solid #ad98dd;padding-left:12px;margin:10px 0}#expedition90 .pq9-win{border-color:#e9c779;box-shadow:inset 0 0 20px #b39b5830}#expedition90 .pq9-item-owned{border-color:#a5d9b1}#pq9-reveal{box-sizing:border-box;width:min(420px,calc(100% - 28px));max-height:calc(100dvh - 28px);overflow:auto;border:1px solid #e9c779;border-radius:20px;padding:24px;background:radial-gradient(ellipse at 50% 0%,#64548c,#17213b 65%);color:#fff5db;text-align:center;box-shadow:0 12px 50px #0009}#pq9-reveal::backdrop{background:#050915cc}#pq9-reveal .pq9-reveal-icon{font-size:64px;margin:8px;animation:pq9-reveal .55s cubic-bezier(.2,.7,.2,1) both}#pq9-reveal button{min-height:44px;width:100%}@keyframes pq9-reveal{from{transform:scale(.6);opacity:.2}to{transform:scale(1);opacity:1}}@media(max-width:420px){#expedition90 .pq9-menu{grid-template-columns:repeat(2,minmax(0,1fr))}#expedition90 .pq9-arena{gap:6px}#expedition90 .pq9-fighter{padding:8px}}@media(prefers-reduced-motion:reduce){#pq9-reveal .pq9-reveal-icon{animation:none}}';
  style.textContent+='#expedition90 .pq10-codex-filters{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}#expedition90 .pq10-codex-filters label{flex:1 1 140px;min-width:0}#expedition90 .pq10-codex-filters select{width:100%;max-width:100%}#expedition90 .pq10-codex-card[data-found=false]{opacity:.75}#expedition90 .pq10-codex-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))}';
  style.textContent+="\n#expedition90 [data-region=market]{--pq10-accent:#e4bc72;--pq10-a:#654622;--pq10-b:#25233a}\n#expedition90 [data-region=trail]{--pq10-accent:#87d7b3;--pq10-a:#234f48;--pq10-b:#1c293f}\n#expedition90 [data-region=citadel]{--pq10-accent:#b7a8ff;--pq10-a:#453569;--pq10-b:#1b284a}\n#expedition90 [data-region=all]{--pq10-accent:#ed9cdc;--pq10-a:#512957;--pq10-b:#20182f}\n#expedition90 .pq10-region-card,#expedition90 .pq10-map-tile,#expedition90 .pq9-arena{background:radial-gradient(ellipse at 80% 0%,var(--pq10-a,#34294b),transparent 78%),linear-gradient(155deg,var(--pq10-b,#242c42),#151c2e);border:1px solid var(--pq10-accent,#8173a8);border-radius:16px}\n#expedition90 .pq10-region-banner{display:grid;place-items:center;font-size:48px;min-height:76px;background:radial-gradient(ellipse,var(--pq10-a),transparent 80%);border-bottom:1px solid var(--pq10-accent);margin-bottom:10px}\n#expedition90 .pq10-route-map{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:10px}\n#expedition90 .pq10-map-tile{padding:10px;text-align:center;min-width:0}\n#expedition90 .pq10-map-tile button{width:100%;white-space:normal;background:#17213c;color:#f8fafc;border:1px solid var(--pq10-accent)}\n#expedition90 .pq10-map-nodes{display:flex;justify-content:center;gap:4px;align-items:center;margin:10px 0}\n#expedition90 .pq10-map-node{border:1px solid var(--pq10-accent);border-radius:50%;width:28px;height:28px;display:grid;place-items:center;background:#1d2539;flex-shrink:0}\n#expedition90 .pq10-map-node[data-state=cleared]{background:#345f4b;color:#f2fff5}\n#expedition90 .pq10-map-node[data-state=open]{background:#65502b;color:#fff4bd}\n#expedition90 .pq10-map-node[data-state=locked]{opacity:.65}\n#expedition90 .pq9-arena{padding:8px}\n#expedition90 .pq9-arena[data-phase=\"2\"]{border:2px solid #ed9cdc;box-shadow:inset 0 0 28px #aa54bb44}\n.pq10-impact{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;padding:10px;border-radius:12px;background:#171d36;border:1px solid #b6a6e1;margin:8px 0;overflow:hidden}\n.pq10-impact>*{display:inline-block;font-weight:700;padding:3px 8px;animation:pq10-pop .38s ease-out both}\n.pq10-hit,.pq10-victory{color:#ffe3a0}.pq10-loss{color:#ffb9bd}.pq10-heal,.pq10-defense{color:#b6f0c7}\n.pq10-awaken{flex-basis:100%;text-align:center;color:#f4b0f9;font-size:1.05rem}\n.pq10-impact[data-action=burst]{border-color:#f0cf88;background:radial-gradient(ellipse,#67532c,#292141)}\n#pq9-reveal[data-rarity=UR]{border:2px solid #fbe08a;box-shadow:0 0 42px #ffdb8d66;background:radial-gradient(ellipse at 50% 0%,#77613a,#17213b 70%)}\n#pq9-reveal[data-rarity=SSR]{border-color:#d5a4ff;box-shadow:0 0 30px #d5a4ff55}\n#pq9-reveal[data-rarity=SR]{border-color:#8ebfff}#pq9-reveal[data-rarity=R]{border-color:#8cdda5}\n@keyframes pq10-pop{0%{transform:translateY(8px) scale(.8);opacity:.35}100%{transform:none;opacity:1}}\n@media(prefers-reduced-motion:reduce){.pq10-impact>*{animation:none}}\n";
  document.head.append(style);
  function add(parent,tag,text,cls){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=text;parent.append(el);return el;}
  function bar(parent,value,max,label){const e=document.createElement('progress');e.max=max;e.value=value;e.setAttribute('aria-label',label);parent.append(e);}
  let selectedWeek='',choices={},difficulty='easy',element='fire',battle=null,previewLedger=emptyLedger(),rewardMessage='',syncMessage='',syncChecking=false,activeScope='',storageError='',owned=[],shopError='',shopBusy=false,shopMessage='',view='map',draws=[],drawError='',drawBusy=false,drawMessage='',feedback=null,codexFilter={group:'all',status:'all',rarity:'all'};
  const scopeNow=()=>typeof cloud!=='undefined'&&cloud.session?.user?.id?'account:'+cloud.session.user.id:'guest';
  function refreshLedger(){try{previewLedger=readReceipts(localStorage,activeScope);storageError='';}catch(e){storageError=e.message;}try{owned=readOwned(localStorage,activeScope);shopError='';}catch(e){shopError=e.message;}try{draws=readDraws(localStorage,activeScope);drawError='';}catch(e){drawError=e.message;}}
  function receiveSaved(id){
   if(activeScope!==scopeNow()||storageError)return 0;
   try{const fresh=derive(typeof s==='undefined'?{}:s),freshMap=weeklyMap(fresh,choices,difficulty),result=persistClaim(localStorage,activeScope,fresh,freshMap,battle,id);previewLedger=result.ledger;rewardMessage=result.status==='claimed'?'✓ 星晶石 '+result.credited+' 個を受取':result.status==='duplicate'?'受取済みです':'まだ条件を達成していません';return result.credited;}
   catch(e){rewardMessage='受取中止：'+e.message;refreshLedger();return 0;}
  }

  const VIEWS=[['map','🧭 遠征'],['battle','⚔️ 戦闘'],['rewards','💎 報酬'],['shop','🏪 ショップ'],['growth','✨ 遠征育成'],['gacha','🌠 召喚'],['codex','📖 図鑑']];
  function changeView(id){if(!VIEWS.some(v=>v[0]===id))return;view=id;paint();}
  function reveal(icon,title,body,rarity=null){
   if(typeof HTMLDialogElement==='undefined'||!HTMLDialogElement.prototype.showModal)return;
   const old=document.getElementById('pq9-reveal');if(old){old.close();old.remove();}
   const dialog=document.createElement('dialog');dialog.id='pq9-reveal';if(rarity)dialog.dataset.rarity=rarity;dialog.setAttribute('aria-labelledby','pq9-reveal-title');
   add(dialog,'div',icon,'pq9-reveal-icon');const h=add(dialog,'h2',title);h.id='pq9-reveal-title';add(dialog,'p',body);
   const close=add(dialog,'button','閉じる');close.type='button';close.onclick=()=>dialog.close();
   dialog.addEventListener('close',()=>{dialog.remove();panel.querySelector('[data-pq9-view="'+view+'"]')?.focus();},{once:true});
   document.body.append(dialog);dialog.showModal();close.focus();
  }
  let cloudAvailable=false,cloudProbeScope='',cloudProbeBusy=false;
  async function probeCloud(){
   const scope=scopeNow();if(!scope.startsWith('account:')||cloudProbeBusy)return;
   cloudProbeBusy=true;cloudProbeScope=scope;cloudAvailable=false;paint();
   try{
    await cloudEnsureToken();if(scopeNow()!==scope)throw Error('アカウントが変わりました');
    const uid=encodeURIComponent(scope.slice(8));
    for(const [table,column] of [['pq_expedition_receipts','receipt_id'],['pq_expedition_purchases','item_id'],['pq_expedition_draws','draw_no']]){
     const rows=await cloudRequest('/rest/v1/'+table+'?user_id=eq.'+uid+'&select='+column+'&limit=1');
     if(scopeNow()!==scope||!Array.isArray(rows))throw Error('専用台帳の確認失敗');
    }
    cloudAvailable=true;syncMessage='専用クラウド台帳を確認しました。星晶石と購入履歴を同期できます。';
   }catch(e){if(scopeNow()===scope)syncMessage='専用クラウド台帳が利用できません。端末内の記録は保持します。'+e.message;}
   finally{cloudProbeBusy=false;paint();}
  }
  function cloudReady(){return cloudAvailable&&cloudProbeScope===scopeNow();}
  function paint(){
   if(!panel.classList.contains('active'))return;
   const impact=feedback;feedback=null;
   const scope=scopeNow();if(scope!==activeScope){activeScope=scope;cloudAvailable=false;cloudProbeScope='';previewLedger=emptyLedger();owned=[];battle=null;rewardMessage='';syncMessage='';shopMessage='';draws=[];drawError='';drawMessage='';}refreshLedger();
   const d=derive(typeof s==='undefined'?{}:s);
   if(selectedWeek!==d.period.start){selectedWeek=d.period.start;choices={};difficulty='easy';battle=null;rewardMessage='';}
   const map=weeklyMap(d,choices,difficulty);
   panel.replaceChildren();
   const hero=add(panel,'section','','pq9-hero');
   add(hero,'p','VER.10.0 · STAR EXPLORER','pq9-note');
   const testButton=add(hero,'button','🧪 遠征テストモード');testButton.type='button';testButton.onclick=()=>{if(!document.getElementById('pq91-sandbox'))mountSandbox(testButton);};
   add(hero,'h2','星巡り遠征');
   let display=null;try{if(!shopError)display=readDisplay(localStorage,activeScope,owned);}catch(e){shopError=e.message;}if(display)add(hero,'strong',SHOP[display].icon+' '+SHOP[display].name+'（遠征展示中）');
   add(hero,'p',d.period.start+' ～ '+d.period.end+'（日本時間）');
   add(hero,'strong',d.rank+'　｜　'+d.cleared+' / '+d.total+' 地点攻略');
   bar(hero,d.cleared,d.total,'遠征全体の攻略進捗');
   add(hero,'p','今週のポイ活 '+d.metrics.quests+'件 ／ 外出 '+d.metrics.outdoor+'件 ／ 両方達成 '+d.metrics.combinedDays+'日','pq9-note');
   const growth=storageError?null:explorerProgress(previewLedger);
   if(growth){add(hero,'strong','遠征 Lv.'+growth.level+' ｜ '+growth.rank);if(!growth.maxed)bar(hero,growth.progress,growth.next,'遠征レベル経験値');}
   const menu=add(panel,'div','','pq9-menu');menu.setAttribute('aria-label','遠征メニュー');
   for(const [id,label] of VIEWS){const b=add(menu,'button',label);b.type='button';b.dataset.pq9View=id;b.setAttribute('aria-pressed',String(view===id));b.onclick=()=>{changeView(id);panel.querySelector('[data-pq9-view="'+id+'"]')?.focus();};}
   const codex=add(panel,'section','','pq9-route');codex.id='pq10-codex';codex.hidden=view!=='codex';
   add(codex,'h3','📖 星巡り遠征図鑑');
   if(storageError||shopError||drawError)add(codex,'p','台帳の確認が必要です。図鑑は安全のため表示を停止しました。','pq9-note');
   else if(view==='codex')renderCodex(codex,add,expeditionCodex(previewLedger,owned,draws),codexFilter,(key,value)=>{codexFilter[key]=value;paint();panel.querySelector('#pq10-codex select[aria-label="図鑑 '+({group:'分類',status:'収集状況',rarity:'レア度'})[key]+'"]')?.focus();});
   const growthBox=add(panel,'section','','pq9-route');growthBox.id='pq10-growth';growthBox.hidden=view!=='growth';
   add(growthBox,'h3','✨ 遠征レベル・育成');
   if(growth){
    add(growthBox,'strong','Lv.'+growth.level+' ｜ '+growth.rank);
    add(growthBox,'p','累計EXP '+growth.xp+' ／ '+(growth.maxed?'最大レベル到達':'次のレベルまで '+(growth.next-growth.progress)+' EXP'));
    if(!growth.maxed)bar(growthBox,growth.progress,growth.next,'遠征育成EXP');
    const grid=add(growthBox,'div','','pq9-grid');
    for(const [label,value] of [['最大HP',growth.hp],['通常攻撃',growth.attack],['星脈斬',growth.skill]]){const card=add(grid,'div','','pq9-fighter');add(card,'p',label);add(card,'strong',String(value));}
    const rules=add(growthBox,'details','');add(rules,'summary','EXP獲得条件');
    for(const [label,key] of [['第1地点','step1'],['第2地点','step2'],['第3地点','step3'],['宝箱','chest'],['通常敵','normal'],['ボス','boss'],['週間達成','weekly'],['隠しボス','hidden']])add(rules,'p',label+'：'+(key==='hidden'?HIDDEN_BOSS.xp:EXPLORER_XP[key])+' EXP');
    add(growthBox,'p','受取済みの遠征報酬から計算。星晶石を使ってもレベルは下がりません。週更新でリセットされません。同期済みの専用台帳から各端末で同じ値を計算します。戦闘開始時のレベルを使用します。','pq9-note');
   }else add(growthBox,'p','台帳を確認できないため育成表示を停止しました。報酬画面で確認してください。');
   const settings=add(panel,'section','','pq9-route');settings.hidden=view!=='map';
   add(settings,'h3','🧭 今週の遠征マップ');
   add(settings,'p','分岐と難易度を選んで探索条件を確認しよう。既存の9地点攻略は変わりません。','pq9-note');
   const difficultyLabel=add(settings,'label','探索難易度　');
   const select=document.createElement('select');select.setAttribute('aria-label','探索難易度');
   for(const [id,def] of Object.entries(DIFFICULTIES)){const option=document.createElement('option');option.value=id;option.textContent=def.label;select.append(option);}
   select.value=difficulty;select.onchange=()=>{difficulty=select.value;paint();panel.querySelector('select')?.focus();};difficultyLabel.append(select);
   const battleBox=add(panel,'section','','pq9-route');
   battleBox.id='pq9-battle';battleBox.hidden=view!=='battle';if(battle?.status==='won')battleBox.classList.add('pq9-win');
   const battleTitle=add(battleBox,'h3','⚔️ 遠征バトル');battleTitle.tabIndex=-1;
   if(!battle){
    add(battleBox,'p','最初の地点を攻略すると番兵戦、全3地点と分岐条件を達成するとボス戦が解放。専用ステータスで挑戦できます。','pq9-note');
    const elLabel=add(battleBox,'label','使用属性　');
    const elSelect=document.createElement('select');elSelect.setAttribute('aria-label','戦闘属性');
    for(const [id,name] of Object.entries(ELEMENTS)){const opt=document.createElement('option');opt.value=id;opt.textContent=name;elSelect.append(opt);}
    elSelect.value=element;elSelect.onchange=()=>{element=elSelect.value;};elLabel.append(elSelect);
    const goMap=add(battleBox,'button','遠征マップで敵を選ぶ');goMap.type='button';goMap.onclick=()=>changeView('map');
    add(battleBox,'p','相性：炎 → 風 → 水 → 炎（有利30%増／不利20%減）。3ターンごとの大技は状態異常を付与。防御で予防、浄化で解除できます。','pq9-note');
    add(battleBox,'p','展示中の遠征装備：'+(display?SHOP[display].name+' ／ '+EXPLORER_GEAR[display].label:'なし')+'。ショップで展示を選ぶと次の戦闘に反映。','pq9-note');
   }else{
    add(battleBox,'p',battle.enemy.icon+' '+battle.enemy.name+' ／ '+DIFFICULTIES[battle.difficulty].label+' ／ '+ELEMENTS[battle.enemy.element]);
    add(battleBox,'strong','TURN '+battle.turn+' / 30');
    const arena=add(battleBox,'div','','pq9-arena');arena.dataset.region=battle.routeId;arena.dataset.phase=String(hiddenPhase(battle));
    const heroCard=add(arena,'div','','pq9-fighter'),enemyCard=add(arena,'div','','pq9-fighter');
    add(heroCard,'div','⚔️','pq9-fighter-icon');add(heroCard,'strong','遠征冒険者 Lv.'+(battle.growth?.level||1));
    add(heroCard,'p','HP '+battle.player.hp+'/'+battle.player.maxHp);
    bar(heroCard,battle.player.hp,battle.player.maxHp,'プレイヤーHP');
    add(heroCard,'p','状態異常：'+statusLabel(battle),'pq9-note');
    if(battle.combat?.gear)add(heroCard,'p',SHOP[battle.combat.gear].name+' ｜ '+EXPLORER_GEAR[battle.combat.gear].label,'pq9-note');
    add(heroCard,'p',ELEMENTS[battle.player.element]+'属性 ｜ MP '+battle.player.mp+'/'+battle.player.maxMp+' ｜ 薬 '+battle.player.potions,'pq9-note');
    add(enemyCard,'div',battle.enemy.icon,'pq9-fighter-icon');add(enemyCard,'strong',battle.enemy.name);
    add(enemyCard,'p','HP '+battle.enemy.hp+'/'+battle.enemy.maxHp);
    bar(enemyCard,battle.enemy.hp,battle.enemy.maxHp,'敵HP');
    add(enemyCard,'p',ELEMENTS[battle.enemy.element]+'属性','pq9-note');if(battle.kind==='hidden')add(enemyCard,'strong','形態 '+hiddenPhase(battle)+' / 2');
    renderBattleFeedback(battleBox,add,impact);
    if(battle.status==='active'){
     const intent=enemyIntent(battle);
     const expected=incomingDamage(battle);
     add(battleBox,'strong',(intent.special?'⚠️ 大技予告：':'次の敵行動：')+intent.name+' ／ 予想ダメージ '+expected+(intent.special?' ／ '+STATUS_EFFECTS[battle.enemy.element].label:'') ,'pq9-intent'+(intent.special?' pq9-danger':''));
     const actions=add(battleBox,'div','','pq9-actions');
     for(const [id,label] of Object.entries(actionsFor(battle))){
      const action=add(actions,'button',label+({attack:'（MP+1）',skill:'（MP2）',guard:'（MP+2）',heal:'（HP'+(38+(battleGear(battle).heal||0))+'）',burst:'（MP4）',cleanse:'（MP1）'}[id]));
      action.type='button';action.disabled=!canAct(battle,id);action.dataset.action=id;
      const expectedBattle=battle;
      action.onclick=()=>{if(battle!==expectedBattle||activeScope!==scopeNow())return;if(period(Date.now()).start!==battle.week){paint();return;}const before=battle;battle=battleStep(before,id);feedback=battleFeedback(before,battle,id);paint();panel.querySelector('[data-action="'+id+'"]:not(:disabled)')?.focus();};
     }
    }else add(battleBox,'strong',({won:'🏆 勝利！',lost:'敗北…',timeout:'制限ターン終了'})[battle.status]+'');
    if(battle.status==='won'){
     const id=receiptId(battle.week,battle.routeId,battle.kind),claimed=previewLedger.claims.includes(id);
     const prize=add(battleBox,'button',claimed?'報酬受取済み':'勝利報酬を受取（'+receiptValue(id)+' 星晶石）');prize.type='button';prize.disabled=claimed||!!storageError;
     prize.onclick=()=>{const credited=receiveSaved(id);paint();if(credited)reveal('🏆','勝利報酬獲得！','星晶石 ＋'+credited+' 個');};
    }
    const log=add(battleBox,'div','','pq9-note');log.setAttribute('aria-live','polite');
    for(const line of battle.log.slice(-6))add(log,'p',line);
    const exit=add(battleBox,'button',battle.status==='active'?'戦闘を中断':'戦闘結果を閉じる');exit.type='button';
    exit.onclick=()=>{if(battle.status==='active'&&!confirm('戦闘を中断しますか？'))return;battle=null;view='map';paint();};
   }
   const rewards=add(panel,'section','','pq9-route');rewards.hidden=view!=='rewards';
   add(rewards,'h3','💎 遠征報酬・星晶石');
   add(rewards,'strong',storageError?'残高確認不可':'獲得累計：'+ledgerBalance(previewLedger)+' 星晶石');
   add(rewards,'p','星晶石は通常セーブとは別に、このブラウザに保存されます。ログイン中のアカウントとゲストの台帳は別です。クラウド同期は専用テーブルが必要です。','pq9-note');
   const statusLine=add(rewards,'p',storageError?'⚠️ 保存停止：'+storageError:rewardMessage,'pq9-note');statusLine.setAttribute('role','status');
   function receive(id){const credited=receiveSaved(id),drop=credited?chestDrop(id):null;paint();if(credited)reveal(drop?drop.icon:'💎',drop?'宝箱開封！ '+drop.rarity:'報酬獲得！','星晶石 ＋'+credited+' 個'+(drop?' ／ '+drop.name:''),drop?.rarity);}
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
   const probe=add(rewards,'button',cloudProbeBusy?'専用DB確認中…':'☁️ 遠征クラウドの利用可否を確認');probe.type='button';probe.disabled=cloudProbeBusy||syncChecking||!activeScope.startsWith('account:');probe.onclick=probeCloud;
   const cloudSync=add(rewards,'button',syncChecking?'同期処理中…':'☁️ 星晶石を同期（専用台帳）');cloudSync.type='button';cloudSync.disabled=syncChecking||!!storageError||!cloudReady();
   cloudSync.onclick=async()=>{
    if(syncChecking||storageError||activeScope!==scopeNow()||!cloudReady())return;
    const scope=activeScope,uid=scope.slice(8);
    const check=()=>{if(scopeNow()!==scope)throw Error('アカウントが変わりました');};
    const table='/rest/v1/pq_expedition_receipts';
    const adapter={
     read:async()=>{
      check();await cloudEnsureToken();check();
      const claims=[];
      for(let offset=0;offset<=50000;offset+=500){
       const rows=await cloudRequest(table+'?user_id=eq.'+encodeURIComponent(uid)+'&select=receipt_id&order=receipt_id.asc&limit=500&offset='+offset);
       check();if(!Array.isArray(rows))throw Error('クラウド台帳の形式不正');
       claims.push(...rows.map(x=>x.receipt_id));if(rows.length<500)return validateLedger({version:1,claims});
      }
      throw Error('クラウド台帳が上限を超えています');
     },
     insert:async(ids)=>{
      for(let i=0;i<ids.length;i+=100){check();await cloudEnsureToken();check();await cloudRequest(table+'?on_conflict=user_id,receipt_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(ids.slice(i,i+100).map(receipt_id=>({user_id:uid,receipt_id})))});check();}
     }
    };
    syncChecking=true;syncMessage='専用台帳を照合中…';paint();
    try{await syncReceipts(localStorage,scope,adapter);check();syncMessage='✓ 星晶石の同期完了。通常セーブは変更していません。';}
    catch(e){if(scopeNow()===scope)syncMessage='同期中止：'+e.message+'。端末の記録は保持されています。専用テーブルが未設定の場合は導入が必要です。';}
    finally{syncChecking=false;paint();}
   };
   const options=rewardOptions(d,map,battle,previewLedger);
   const ready=options.filter(o=>o.ready&&!previewLedger.claims.includes(o.id));
   const allBtn=add(rewards,'button','受取可能な報酬を一括受取（'+ready.length+'件）');allBtn.type='button';allBtn.disabled=!ready.length||!!storageError;
   allBtn.onclick=()=>{let total=0;const drops=[];for(const o of ready){const credited=receiveSaved(o.id);total+=credited;const drop=credited?chestDrop(o.id):null;if(drop)drops.push(drop);}rewardMessage='今回受取：合計 '+total+' 星晶石';paint();if(total)reveal(drops.length?'🎁':'💎','遠征報酬獲得！','星晶石 ＋'+total+' 個'+(drops.length?' ／ 宝箱：'+drops.map(x=>x.rarity+' '+x.name).join('、'):''),[...drops].sort((a,b)=>CHEST_RARITIES.findIndex(r=>r.id===b.rarity)-CHEST_RARITIES.findIndex(r=>r.id===a.rarity))[0]?.rarity);};
   const detail=add(rewards,'details','');add(detail,'summary','報酬一覧（'+options.filter(o=>previewLedger.claims.includes(o.id)).length+'/'+options.length+'件受取済み）');
   for(const o of options){
    const claimed=previewLedger.claims.includes(o.id);
    const item=add(detail,'div','','pq9-step');
    add(item,'p',o.label+' ／ '+o.value+' 星晶石');
    const claim=add(item,'button',claimed?'受取済み':o.ready?'受け取る':'未解放');claim.type='button';claim.disabled=claimed||!o.ready||!!storageError;claim.onclick=()=>receive(o.id);
   }
   const chestBox=add(rewards,'section','','pq9-step');chestBox.id='pq10-chests';
   add(chestBox,'h3','🎁 地域限定ランダム宝箱');
   if(storageError)add(chestBox,'p','台帳を確認できないため宝箱記録を表示できません。','pq9-note');
   else{
    const collection=chestCollection(previewLedger);add(chestBox,'strong','開封 '+collection.total+' 回 ／ 発見 '+collection.unique+' / 15 種');
    const odds=add(chestBox,'details','');add(odds,'summary','排出率・仕組み');
    add(odds,'p',CHEST_RARITIES.map(r=>r.label+' '+(r.weight/100)+'%').join(' ／ '),'pq9-note');
    add(odds,'p','各地域・各週1個。受取済みの宝箱も対象。地域と週の受取IDから結果を固定するため、再読み込みや難易度変更で再抽選されません。アイテムは収集用で、星晶石15個も従来通り受取できます。','pq9-note');
    const list=add(chestBox,'div','','pq9-grid');
    for(const drop of collection.drops.slice(0,6)){
     const card=add(list,'div','','pq9-route');card.style.borderColor=drop.color;
     add(card,'div',drop.icon,'pq9-fighter-icon');const title=add(card,'strong',drop.rarity+' '+drop.name);title.style.color=drop.color;
     add(card,'p',drop.week+' ｜ '+d.routes.find(r=>r.id===drop.route).title,'pq9-note');
    }
    if(!collection.total)add(chestBox,'p','まだ宝箱を開けていません。分岐探索の条件を満たすと受取できます。','pq9-note');
    const log=add(chestBox,'details','');add(log,'summary','宝箱履歴（直近30件）');
    for(const drop of collection.drops.slice(0,30))add(log,'p',drop.week+' ｜ '+drop.rarity+' '+drop.name,'pq9-note');
   }
   const history=add(rewards,'details','');add(history,'summary','受取履歴（'+previewLedger.claims.length+'件）');
   for(const id of [...previewLedger.claims].reverse().slice(0,30)){const [,week,route,kind]=id.split(':');add(history,'p',week+' ｜ '+(d.routes.find(r=>r.id===route)?.title||'全体')+' ｜ '+({step1:'第1地点',step2:'第2地点',step3:'第3地点',chest:'宝箱',normal:'通常敵',boss:'ボス',weekly:'週間達成',hidden:'隠しボス'})[kind]+' ＋'+receiptValue(id),'pq9-note');}
   const shop=add(panel,'section','','pq9-route');shop.id='pq9-shop';shop.hidden=view!=='shop';
   add(shop,'h3','🏪 星巡り遠征ショップ');
   const w=storageError||shopError||drawError?null:wallet(previewLedger,owned,draws);
   add(shop,'strong',w?'💎 利用可能（端末記録）：'+w.balance+' ／ 消費 '+w.spent:'購入履歴の確認が必要です');
   add(shop,'p','限定品は各1個のみ。展示した限定品1つの効果が次回の遠征戦闘に適用されます。通常の冒険には影響しません。ゲストは端末内購入、ログイン中はクラウドで残高を確認して購入します。','pq9-note');
   if(activeScope.startsWith('account:')&&!cloudReady()){add(shop,'p','ログイン中の交換は専用クラウド台帳確認後に利用できます。報酬メニューから確認してください。','pq9-note');const checkBtn=add(shop,'button','報酬メニューへ');checkBtn.type='button';checkBtn.onclick=()=>changeView('rewards');}
   const msg=add(shop,'p',shopError||shopMessage,'pq9-note');msg.setAttribute('role','status');
   async function refreshPurchases(scope){
    if(!scope.startsWith('account:'))throw Error('ログインが必要');
    const uid=scope.slice(8);await cloudEnsureToken();if(scopeNow()!==scope)throw Error('アカウントが変わりました');
    const rows=await cloudRequest('/rest/v1/pq_expedition_purchases?user_id=eq.'+encodeURIComponent(uid)+'&select=item_id&limit=100');
    if(scopeNow()!==scope)throw Error('アカウントが変わりました');
    if(!Array.isArray(rows))throw Error('購入履歴の形式不正');
    const ids=validateOwned(rows.map(x=>x.item_id));
    for(const id of ids)storeOwned(localStorage,scope,id);
    if(readOwned(localStorage,scope).some(id=>!ids.includes(id)))throw Error('クラウド購入履歴との不一致');
    await refreshDraws(scope);return ids;
   }
   const refreshShop=add(shop,'button','☁️ 購入履歴を同期');refreshShop.type='button';refreshShop.disabled=shopBusy||!cloudReady();
   refreshShop.onclick=async()=>{if(shopBusy||scopeNow()!==activeScope)return;const scope=activeScope;shopBusy=true;paint();try{await refreshPurchases(scope);if(scopeNow()===scope)shopMessage='購入履歴を同期しました';}catch(e){if(scopeNow()===scope)shopMessage='同期中止：'+e.message;}finally{shopBusy=false;paint();}};
   async function buy(id){
    if(shopBusy||drawBusy||storageError||shopError||drawError||scopeNow()!==activeScope||(activeScope!=='guest'&&!cloudReady()))return;
    const scope=activeScope,item=SHOP[id];
    if(!confirm(item.name+' を '+item.cost+' 星晶石で交換しますか？'))return;
    shopBusy=true;paint();
    try{
     let status;
     if(scope==='guest')status=(await buyGuest(localStorage,scope,id,navigator.locks)).status;
     else{
      await cloudEnsureToken();if(scopeNow()!==scope)throw Error('アカウントが変わりました');
      const result=await cloudRequest('/rest/v1/rpc/pq_buy_expedition_item',{method:'POST',body:JSON.stringify({p_item:id})});
      if(scopeNow()!==scope)throw Error('アカウントが変わりました');
      status=result?.status;
      if(!['purchased','duplicate','insufficient'].includes(status))throw Error('購入結果が不明です。購入履歴を同期してください');
      await refreshPurchases(scope);
     }
     if(scopeNow()===scope&&status==='purchased')reveal(item.icon,item.name+' 獲得！','遠征コレクションに追加しました。');
     if(scopeNow()===scope)shopMessage=({purchased:'🎉 '+item.name+' を獲得！',duplicate:'すでに所持しています',insufficient:'星晶石が不足しています。ログイン中は先に星晶石を同期してね。'})[status]||'購入できませんでした';
    }catch(e){if(scopeNow()===scope)shopMessage='購入確認：'+e.message+'。クラウド購入の場合は履歴を同期してください。';}
    finally{shopBusy=false;paint();}
   }

   async function refreshDraws(scope){
    if(!scope.startsWith('account:'))throw Error('ログインが必要');
    const uid=encodeURIComponent(scope.slice(8)),rows=[];
    for(let offset=0;offset<=50000;offset+=500){
     await cloudEnsureToken();if(scopeNow()!==scope)throw Error('アカウント変更');
     const batch=await cloudRequest('/rest/v1/pq_expedition_draws?user_id=eq.'+uid+'&select=draw_no,request_id,item_id&order=draw_no.asc&limit=500&offset='+offset);
     if(scopeNow()!==scope||!Array.isArray(batch))throw Error('召喚台帳確認失敗');
     rows.push(...batch);if(batch.length<500)return saveDraws(localStorage,scope,rows);
    }throw Error('召喚履歴上限');
   }
   const summon=add(panel,'section','','pq9-route');summon.id='pq10-gacha';summon.hidden=view!=='gacha';
   add(summon,'h3','🌠 星界遠征限定召喚');
   const gs=drawError?null:gachaSummary(draws);
   add(summon,'strong',w?'端末記録の星晶石 '+w.balance+' 個':'台帳確認が必要');
   add(summon,'p','1回20星晶石 ／ UR 3%・SSR 7%・SR 20%・R 30%・N 40%（天井時はUR確定）','pq9-note');
   if(gs){add(summon,'p','URまで最大あと '+gs.remaining+' 回 ／ 召喚 '+gs.total+' 回 ／ 星片 '+gs.fragments);bar(summon,gs.pity,GACHA_PITY,'UR天井までの進捗');}
   add(summon,'p','全10種類。重複は収集用の星片として計数（星晶石には還元しません）。ログイン中はサーバーで残高と抽選結果を確定。','pq9-note');
   const pendingKey=PENDING_PREFIX+encodeURIComponent(activeScope);
   const pending=localStorage.getItem(pendingKey);
   const drawButton=add(summon,'button',pending?'未確認の召喚を再確認':'召喚する（20星晶石）');drawButton.type='button';
   drawButton.disabled=drawBusy||shopBusy||!!storageError||!!shopError||!!drawError||!navigator.locks||(!pending&&(activeScope==='guest'?(!w||w.balance<GACHA_COST):!cloudReady()))||(activeScope!=='guest'&&!cloudReady());
   drawButton.onclick=async()=>{
    if(drawBusy||shopBusy||scopeNow()!==activeScope||!navigator.locks)return;
    const scope=activeScope,key=PENDING_PREFIX+encodeURIComponent(scope);
    if(!localStorage.getItem(key)&&!confirm('星晶石20個で召喚しますか？'))return;
    drawBusy=true;paint();
    try{
     await navigator.locks.request('pq10-request:'+scope,async()=>{
      if(scopeNow()!==scope)throw Error('アカウント変更');
      let req=localStorage.getItem(key);if(!req){req=crypto.randomUUID();localStorage.setItem(key,req);}
      if(!validRequest(req))throw Error('未確認の召喚ID不正');
      let result;
      if(scope==='guest')result=await drawGuest(localStorage,scope,navigator.locks,req,secureRandom);
      else{
       await cloudEnsureToken();if(scopeNow()!==scope)throw Error('アカウント変更');
       result=await cloudRequest('/rest/v1/rpc/pq_draw_expedition_item',{method:'POST',body:JSON.stringify({p_request:req})});
       if(scopeNow()!==scope)throw Error('アカウント変更');
       if(['drawn','duplicate'].includes(result?.status)){
        const rows=await refreshDraws(scope),row=rows.find(x=>x.request_id===req);
        if(!row||row.item_id!==result.item_id||row.draw_no!==result.draw_no)throw Error('召喚結果の照合失敗');
        result={status:result.status,row};
       }
      }
      if(!['drawn','duplicate','insufficient'].includes(result?.status))throw Error('召喚結果未確認');
      if(result.status==='insufficient')drawMessage='星晶石が不足しています。';
      else{const [rarity,name,icon]=GACHA_ITEMS[result.row.item_id];drawMessage=rarity+' '+name+' 獲得！';reveal(icon,rarity+' '+name,'遠征召喚コレクションに追加しました',rarity);}
      localStorage.removeItem(key);
     });
    }catch(e){if(scopeNow()===scope)drawMessage='召喚結果未確認：'+e.message+'。再確認ボタンで同じ要求を照会してください。';}
    finally{drawBusy=false;paint();}
   };
   const syncDraw=add(summon,'button','☁️ 召喚・購入履歴を同期');syncDraw.type='button';syncDraw.disabled=drawBusy||shopBusy||!cloudReady();syncDraw.onclick=()=>refreshShop.click();
   add(summon,'p',drawError||drawMessage,'pq9-note');
   if(gs){const catalog=add(summon,'details','');add(catalog,'summary','召喚コレクション '+gs.unique+'/10');
    for(const [id,[rarity,name,icon]] of Object.entries(GACHA_ITEMS))add(catalog,'p',icon+' '+rarity+' '+name+' ×'+(gs.counts[id]||0));
    const recent=add(summon,'details','');add(recent,'summary','最近の召喚');for(const row of [...draws].reverse().slice(0,20))add(recent,'p',row.draw_no+'：'+GACHA_ITEMS[row.item_id].join(' '));}
   const catalog=add(shop,'div','','pq9-grid');
   for(const [id,item] of Object.entries(SHOP)){
    const card=add(catalog,'div','','pq9-route');
    add(card,'div',item.icon,'pq9-fighter-icon');add(card,'strong',item.name);
    add(card,'p',item.type+' ｜ 💎 '+item.cost,'pq9-note');add(card,'p',item.description,'pq9-note');add(card,'p','戦闘効果：'+EXPLORER_GEAR[id].label,'pq9-note');
    const got=owned.includes(id);if(got)card.classList.add('pq9-item-owned');const button=add(card,'button',got?'獲得済み':shopBusy?'処理中':'交換する');button.type='button';
    button.disabled=got||shopBusy||drawBusy||!!storageError||!!shopError||!!drawError||(activeScope==='guest'?(!w||w.balance<item.cost):!cloudReady());button.onclick=()=>buy(id);
    if(got){const eq=add(card,'button',display===id?'展示解除':'遠征に展示');eq.type='button';eq.onclick=()=>{if(scopeNow()!==activeScope)return;try{setDisplay(localStorage,activeScope,readOwned(localStorage,activeScope),display===id?null:id);}catch(e){shopMessage=e.message;}paint();};}
   }
   const backupBtn=add(shop,'button','📥 遠征専用バックアップを書き出す');backupBtn.type='button';backupBtn.disabled=!!storageError||!!shopError;
   backupBtn.onclick=()=>{
    if(scopeNow()!==activeScope)return;
    try{
     const ledger=readReceipts(localStorage,activeScope),items=readOwned(localStorage,activeScope);
     const backup={format:'poikatsu-quest-expedition-backup',version:2,createdAt:new Date().toISOString(),scope:activeScope,ledger,owned:items,draws:readDraws(localStorage,activeScope),display:readDisplay(localStorage,activeScope,items)};
     const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'})),a=document.createElement('a');
     a.href=url;a.download='pq-expedition-'+backup.createdAt.replace(/[:.]/g,'-')+'.json';document.body.append(a);
     try{a.click();shopMessage='遠征バックアップのダウンロードを開始しました。保存先を確認してね。';}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
    }catch(e){shopMessage='バックアップ失敗：'+e.message;}paint();
   };
   add(shop,'p','遠征バックアップは保管・照合用。購入履歴の安全な復元はクラウド同期で行います。ゲスト台帳のインポートは未対応です。','pq9-note');
   const collection=add(shop,'section','','pq9-step');add(collection,'h3','📖 遠征コレクション '+owned.length+'/'+Object.keys(SHOP).length);
   bar(collection,owned.length,Object.keys(SHOP).length,'コレクション達成度');
   for(const m of collectionMilestones(previewLedger,owned)){add(collection,'p',(m.done?'✓ ':'◇ ')+m.name+'　'+Math.min(m.value,m.target)+'/'+m.target,'pq9-note');}
   add(collection,'p','長期実績は表示専用。展示・遠征装備設定は端末内のみ保存されます。','pq9-note');

   const overview=add(panel,'section','','pq9-route pq10-map-overview');overview.id='pq10-map-overview';overview.hidden=view!=='map';
   add(overview,'h3','✦ 星界航路');
   const routes=add(overview,'div','','pq10-route-map');
   for(const route of d.routes){
    const art=REGION_ART[route.id],m=map.find(x=>x.id===route.id);
    const tile=add(routes,'div','','pq10-map-tile');tile.dataset.region=route.id;
    const jump=add(tile,'button',art.icon+' '+route.title);jump.type='button';jump.onclick=()=>{const dest=panel.querySelector('[data-pq10-route="'+route.id+'"]');dest?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});dest?.focus({preventScroll:true});};
    add(tile,'p',m.region,'pq9-note');
    const nodes=add(tile,'div','','pq10-map-nodes');nodes.setAttribute('aria-label',route.title+'攻略状況');
    route.steps.forEach((step,i)=>{const node=add(nodes,'span',step.cleared?'✓':step.unlocked?'◇':'🔒','pq10-map-node');node.dataset.state=step.cleared?'cleared':step.unlocked?'open':'locked';node.title=step.name+' '+step.value+'/'+step.target;node.setAttribute('aria-label',step.name+' '+step.value+'/'+step.target);});
    add(tile,'strong',route.cleared+'/3');
   }
   const voidTile=add(routes,'div','','pq10-map-tile');voidTile.dataset.region='all';
   const jump=add(voidTile,'button','🌑 虚空の裂け目');jump.type='button';jump.onclick=()=>{const dest=panel.querySelector('#pq10-hidden');dest?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});dest?.focus({preventScroll:true});};
   add(voidTile,'p',!storageError&&hiddenRequirements(d,previewLedger).unlocked?'挑戦可能':'条件達成で解放','pq9-note');
   const grid=add(panel,'div','','pq9-grid');grid.hidden=view!=='map';
   for(const route of d.routes){
    const card=add(grid,'section','','pq9-route pq10-region-card');card.dataset.region=route.id;card.dataset.pq10Route=route.id;card.tabIndex=-1;
    add(card,'div',REGION_ART[route.id].icon,'pq10-region-banner');
    add(card,'h3',route.icon+' '+route.title+'　'+route.cleared+'/3');
    add(card,'p',route.subtitle,'pq9-note');
    const m=map.find(x=>x.id===route.id);
    add(card,'h4',m.region);add(card,'p',m.weather+' ／ '+m.story,'pq9-note');
    const branchBox=add(card,'div','','pq9-step pq9-mapline');
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
      if(storageError)return;
      try{const items=readOwned(localStorage,activeScope);battle=beginExplorerBattle(fresh,freshMap,route.id,kind,element,readReceipts(localStorage,activeScope),items,readDisplay(localStorage,activeScope,items));}catch(e){storageError=e.message;rewardMessage='戦闘開始中止：'+e.message;paint();return;}
      if(battle)view='battle';paint();if(battle){const target=panel.querySelector('#pq9-battle h3');target?.focus();target?.scrollIntoView({block:'start'});}
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

   const hiddenBox=add(panel,'section','','pq9-route');hiddenBox.id='pq10-hidden';hiddenBox.dataset.region='all';hiddenBox.classList.add('pq10-region-card');hiddenBox.tabIndex=-1;hiddenBox.hidden=view!=='map';
   add(hiddenBox,'h3','🌑 虚空の裂け目');
   if(!storageError&&!shopError){
    const hr=hiddenRequirements(d,previewLedger);add(hiddenBox,'strong',hr.unlocked?HIDDEN_BOSS.name:'？？？（未解放）');
    for(const x of hr.requirements){add(hiddenBox,'p',(x.value>=x.target?'✓ ':'🔒 ')+x.label+' '+Math.min(x.value,x.target)+'/'+x.target,'pq9-note');bar(hiddenBox,Math.min(x.value,x.target),x.target,x.label);}
    add(hiddenBox,'p','高難度固定。HP半分以下で覚醒し、大技の頻度が増加。討伐報酬は週1回：星晶石40個・遠征EXP120。','pq9-note');
    const fight=add(hiddenBox,'button','隠しボスに挑戦');fight.type='button';fight.disabled=!hr.unlocked||!!battle;
    fight.onclick=()=>{if(battle||activeScope!==scopeNow())return;try{const fresh=derive(typeof s==='undefined'?{}:s),items=readOwned(localStorage,activeScope);if(fresh.period.start!==selectedWeek){paint();return;}battle=beginHiddenBattle(fresh,element,readReceipts(localStorage,activeScope),items,readDisplay(localStorage,activeScope,items));if(battle)view='battle';paint();}catch(e){rewardMessage='挑戦中止：'+e.message;paint();}};
   }else add(hiddenBox,'p','台帳の確認が必要です。');
   add(panel,'p','毎週月曜0時にマップ更新。分岐・難易度の選択は画面内だけ保持し、再読み込みで初期化します。宝箱は報酬受取時に限定収集品が確定します。遭遇イベントは発見表示のみ。戦闘は画面内で保持し、再読み込みや週更新で終了します。星晶石は独立した端末台帳に保存します。通常セーブには書き込みません。','pq9-note');
   const refresh=add(panel,'button','↻ 進捗を更新');refresh.type='button';refresh.onclick=paint;
  }
  const prev=render;render=function(){prev();paint();};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint();});
  window.addEventListener('storage',e=>{if(e.key===null||e.key?.startsWith(RECEIPT_PREFIX)||e.key?.startsWith(SHOP_PREFIX)||e.key?.startsWith(EQUIP_PREFIX)||e.key?.startsWith(DRAW_PREFIX)||e.key?.startsWith(PENDING_PREFIX))paint();});
 }
 if(typeof module==='object'&&module.exports)module.exports={period,derive,weeklyMap,battleEligible,beginBattle,beginExplorerBattle,beginHiddenBattle,hiddenRequirements,hiddenPhase,HIDDEN_BOSS,battleFeedback,REGION_ART,explorerProgress,CHEST_RARITIES,CHEST_ITEMS,chestRarity,chestRoll,chestDrop,chestCollection,expeditionCodex,filterCodex,CODEX_GROUPS,GACHA_ITEMS,GACHA_COST,GACHA_PITY,validateDraws,gachaSummary,drawItem,drawPlan,readDraws,saveDraws,drawGuest,EXPLORER_GEAR,STATUS_EFFECTS,actionsFor,activeGear,incomingDamage,EXPLORER_XP,MAX_EXPLORER_LEVEL,enemyIntent,affinity,canAct,battleStep,receiptId,receiptValue,emptyLedger,validateLedger,ledgerBalance,mergeLedgers,ledgerLoss,rewardOptions,claimReward,planLedgerSync,readReceipts,persistReceipt,persistClaim,syncReceipts,SHOP,validateOwned,readOwned,wallet,purchasePlan,storeOwned,buyGuest,collectionMilestones,readDisplay,setDisplay,createSandbox,sandboxWallet,sandboxClaim,sandboxBuy};
 else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
 else mount();
})(typeof globalThis!=='undefined'?globalThis:this);
