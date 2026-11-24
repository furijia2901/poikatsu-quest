'use strict';
const assert=require('node:assert/strict');
const {period,derive,weeklyMap,battleEligible,beginBattle,enemyIntent,affinity,canAct,battleStep,receiptId,receiptValue,emptyLedger,validateLedger,ledgerBalance,mergeLedgers,ledgerLoss,rewardOptions,claimReward,planLedgerSync,readReceipts,persistReceipt,persistClaim,syncReceipts,SHOP,validateOwned,readOwned,wallet,purchasePlan,storeOwned,buyGuest,collectionMilestones,readDisplay,setDisplay}=require('../expedition90.js');
const now=Date.parse('2026-11-24T03:00:00Z');
const date=d=>d+'T03:00:00Z';
const session=(id,d,cat='walk')=>({id,completedAt:date(d),mission:{cat}});
let n=0;function check(name,f){f();n++;console.log('PASS',name);}
check('JST weekly boundary',()=>{assert.equal(period(Date.parse('2026-11-22T14:59:59Z')).start,'2026-11-16');assert.equal(period(Date.parse('2026-11-22T15:00:00Z')).start,'2026-11-23');});
check('empty state',()=>{const x=derive({},now);assert.equal(x.cleared,0);assert.equal(x.total,9);assert.equal(x.rank,'遠征見習い');});
check('week dates',()=>{assert.deepEqual(period(now),{start:'2026-11-23',end:'2026-11-29',next:'2026-11-30',today:'2026-11-24'});});
const state={dailyQuestStats:{'2026-11-22':{count:99},'2026-11-23':{count:4},'2026-11-24':{count:6},'2026-11-25':{count:100}},questHistory:[{day:'2026-11-23',category:'ゲーム'},{day:'2026-11-24',category:'レシート'}],outdoorQuest:{completedSessions:[session('a','2026-11-23'),session('a','2026-11-23'),session('b','2026-11-24','go'),session('c','2026-11-22'),session('d','2026-11-25')]}};
check('quest date filter',()=>assert.equal(derive(state,now).metrics.quests,10));
check('duplicate and out-of-period outdoor filter',()=>assert.equal(derive(state,now).metrics.outdoor,2));
check('distinct categories',()=>{const x=derive(state,now);assert.equal(x.metrics.categories,2);assert.equal(x.metrics.outdoorTypes,2);});
check('cross-mode dates',()=>assert.equal(derive(state,now).metrics.combinedDays,2));
check('route unlock',()=>{const x=derive(state,now);assert.equal(x.routes[0].cleared,3);assert.equal(x.routes[2].steps[2].unlocked,false);});
check('read only',()=>{const before=JSON.stringify(state);derive(state,now);assert.equal(JSON.stringify(state),before);});
check('invalid rows',()=>{const x=derive({dailyQuestStats:{'2026-11-24':{count:-3}},questHistory:[null],outdoorQuest:{completedSessions:[null,{id:'x',completedAt:'bad'}]}},now);assert.equal(x.cleared,0);});
check('all routes cleared',()=>{const x=structuredClone(state);x.dailyQuestStats['2026-11-25']={count:1};x.outdoorQuest.completedSessions.push(session('e','2026-11-25'),session('f','2026-11-25'),session('g','2026-11-25'));const d=derive(x,Date.parse('2026-11-25T12:00:00Z'));assert.equal(d.cleared,9);assert.equal(d.rank,'星巡りの英雄');});
check('weekly map stable',()=>{const d=derive(state,now);assert.deepEqual(weeklyMap(d),weeklyMap(d));});
check('weekly rotation',()=>{const a=weeklyMap(derive(state,now)),b=weeklyMap(derive(state,now+7*86400000));assert.ok(a.every((r,i)=>r.region!==b[i].region));});
check('two branches per route',()=>assert.ok(weeklyMap(derive(state,now)).every(r=>r.branches.length===2&&r.branches[0].id!==r.branches[1].id)));
check('branch selection',()=>{const d=derive(state,now),r=weeklyMap(d)[0];assert.equal(weeklyMap(d,{market:r.branches[1].id})[0].selected.id,r.branches[1].id);});
check('invalid branch fallback',()=>{const d=derive(state,now),r=weeklyMap(d,{market:'invalid'},'invalid')[0];assert.equal(r.selected.id,r.branches[0].id);assert.equal(r.difficulty,'easy');});
check('difficulty targets nondecreasing',()=>{const d=derive(state,now),a=weeklyMap(d),b=weeklyMap(d,{},'hard');assert.ok(a.every((r,i)=>r.branches.every((x,j)=>x.target<=b[i].branches[j].target)));});
check('locked chest',()=>assert.ok(weeklyMap(derive({},now)).every(r=>!r.unlocked&&r.branches.every(b=>!b.ready))));
check('eligible chest',()=>assert.equal(weeklyMap(derive(state,now))[0].branches[0].ready,true));
check('event stable for same selection',()=>{const d=derive(state,now),r=weeklyMap(d)[0],choice={market:r.branches[1].id};assert.deepEqual(weeklyMap(d,choice)[0].event,weeklyMap(d,choice)[0].event);});
check('map does not mutate derived state or choices',()=>{const d=derive(state,now),choice={market:'invalid'},before=JSON.stringify([d,choice]);weeklyMap(d,choice,'hard');assert.equal(JSON.stringify([d,choice]),before);});

const full={dailyQuestStats:{},questHistory:[],outdoorQuest:{completedSessions:[]}};
for(let i=23;i<=29;i++){
 const day='2026-11-'+i;
 full.dailyQuestStats[day]={count:5};
 full.outdoorQuest.completedSessions.push(session('walk'+i,day,'walk'),session('go'+i,day,'go'),session('explore'+i,day,'explore'));
}
for(const category of ['レシート','歩数・移動','アンケート','ゲーム','広告・ミニゲーム'])full.questHistory.push({day:'2026-11-23',category});
const end=Date.parse('2026-11-29T12:00:00Z'),done=derive(full,end);
const map=weeklyMap(done,{},'hard');
const start=(id='market',kind='boss',el='water',diff='hard')=>beginBattle(done,weeklyMap(done,{},diff),id,kind,el);
check('battle eligibility respects real progression',()=>{const d=derive({},now),m=weeklyMap(d);assert.equal(beginBattle(d,m,'market','normal','water'),null);const partial=derive(state,now);assert.equal(battleEligible(partial,weeklyMap(partial),'trail','normal'),true);assert.equal(battleEligible(partial,weeklyMap(partial),'trail','boss'),false);});
check('boss requires selected branch discovery',()=>{const blocked=structuredClone(map);blocked[0].selected.ready=false;assert.equal(battleEligible(done,blocked,'market','boss'),false);assert.equal(battleEligible(done,map,'market','boss'),true);});
check('invalid battle input rejected',()=>{assert.equal(beginBattle(done,map,'unknown','boss','water'),null);assert.equal(beginBattle(done,map,'market','bad','water'),null);assert.equal(beginBattle(done,map,'market','boss','bad'),null);});
check('difficulty scales enemy stats',()=>{const a=start('market','boss','water','easy'),b=start('market','boss','water','normal'),c=start();assert.ok(a.enemy.hp<b.enemy.hp&&b.enemy.hp<c.enemy.hp);assert.ok(a.enemy.atk<b.enemy.atk&&b.enemy.atk<c.enemy.atk);});
check('elemental advantages',()=>{for(const [a,b] of [['fire','wind'],['wind','water'],['water','fire']]){assert.equal(affinity(a,b),1.3);assert.equal(affinity(b,a),0.8);}assert.equal(affinity('fire','fire'),1);});
check('normal attack and MP gain',()=>{const b=start(),x=battleStep(b,'attack');assert.equal(b.enemy.hp-x.enemy.hp,27);assert.equal(x.player.mp,3);assert.equal(x.turn,2);});
check('skill resource cost and invalid skill',()=>{const b=start(),x=battleStep(b,'skill');assert.equal(b.enemy.hp-x.enemy.hp,47);assert.equal(x.player.mp,0);assert.equal(canAct(x,'skill'),false);assert.equal(battleStep(x,'skill'),x);});
check('special telegraph on every third turn',()=>{const b=start();assert.equal(enemyIntent(b).special,false);assert.equal(enemyIntent({...b,turn:3}).special,true);assert.equal(enemyIntent({...b,turn:6}).name,b.enemy.skill);});
check('guard reduces damage and caps MP',()=>{const b={...start(),turn:3};const a=battleStep(b,'attack'),g=battleStep(b,'guard');assert.ok(b.player.hp-g.player.hp<(b.player.hp-a.player.hp)/2);assert.equal(g.player.mp,4);});
check('heal limited to two uses and HP cap',()=>{const b=start();assert.equal(canAct(b,'heal'),false);const hurt={...b,player:{...b.player,hp:105}};const a=battleStep(hurt,'heal');assert.equal(a.player.potions,1);assert.ok(a.player.hp<=a.player.maxHp);const zero={...hurt,player:{...hurt.player,potions:0}};assert.equal(battleStep(zero,'heal'),zero);});
check('victory prevents retaliation and subsequent actions',()=>{const b=start();const weak={...b,enemy:{...b.enemy,hp:1}};const won=battleStep(weak,'attack');assert.equal(won.status,'won');assert.equal(won.player.hp,weak.player.hp);assert.equal(battleStep(won,'attack'),won);});
check('defeat and timeout terminal',()=>{const b=start(),weak={...b,player:{...b.player,hp:1}};assert.equal(battleStep(weak,'attack').status,'lost');assert.equal(battleStep({...b,turn:30},'guard').status,'timeout');});
check('battle state immutable',()=>{const b=start(),before=JSON.stringify([b,full,done,map]);battleStep(b,'skill');assert.equal(JSON.stringify([b,full,done,map]),before);});
check('all 18 encounter/difficulty combinations beatable with elemental tactics',()=>{
 for(const [route,el] of [['market','water'],['trail','fire'],['citadel','wind']])for(const kind of ['normal','boss'])for(const diff of ['easy','normal','hard']){
  let b=start(route,kind,el,diff);
  for(let i=0;i<30&&b.status==='active';i++){
   const lethal=Math.round((b.player.mp>=2?36:21)*affinity(b.player.element,b.enemy.element))>=b.enemy.hp;
   const act=lethal?(b.player.mp>=2?'skill':'attack'):enemyIntent(b).special?'guard':b.player.hp<=55&&b.player.potions?'heal':b.player.mp>=2?'skill':'attack';
   b=battleStep(b,act);
  }
  assert.equal(b.status,'won',route+'/'+kind+'/'+diff+' '+JSON.stringify(b));
 }
});

const week=done.period.start,rid=(r,k)=>receiptId(week,r,k);
check('canonical receipt validation',()=>{assert.equal(receiptValue(rid('market','chest')),15);assert.equal(receiptId('2026-11-24','market','chest'),null);assert.equal(receiptId(week,'all','boss'),null);assert.equal(receiptValue('v1:'+week+':market:chest:extra'),null);});
check('empty and legacy migration',()=>{assert.deepEqual(validateLedger(undefined),emptyLedger());assert.equal(ledgerBalance(undefined),0);});
check('malformed ledger rejected',()=>{for(const x of [null,{version:2,claims:[]},{version:1,claims:['bad']},{version:1,claims:[rid('market','chest'),rid('market','chest')]},{version:1,claims:[],balance:999}])assert.throws(()=>validateLedger(x));});
check('reward slots fixed at 19',()=>assert.equal(rewardOptions(done,map).length,19));
check('locked and forged rewards refused',()=>{const d=derive({},now);for(const id of [rid('market','step1'),rid('market','chest'),rid('all','weekly'),'fake'])assert.equal(claimReward(emptyLedger(),d,weeklyMap(d),null,id).credited,0);});
check('claim and duplicate',()=>{const a=claimReward(emptyLedger(),done,map,null,rid('market','chest'));assert.equal(a.credited,15);assert.equal(ledgerBalance(a.ledger),15);const b=claimReward(a.ledger,done,map,null,rid('market','chest'));assert.equal(b.status,'duplicate');assert.equal(b.credited,0);});
check('branch and difficulty cannot duplicate receipt',()=>{const a=claimReward(emptyLedger(),done,map,null,rid('market','chest'));const other=weeklyMap(done,{market:map[0].branches[1].id},'easy');assert.equal(claimReward(a.ledger,done,other,null,rid('market','chest')).status,'duplicate');});
check('boss must be won in correct week and route',()=>{let b=start();while(b.status==='active')b=battleStep(b,b.player.mp>=2?'skill':'attack');assert.equal(b.status,'won');assert.equal(claimReward(emptyLedger(),done,map,b,rid('market','boss')).credited,30);for(const x of [{...b,status:'lost'},{...b,week:'2026-11-16'},{...b,routeId:'trail'},{...b,branchId:'fake'},{...b,enemy:{...b.enemy,hp:1}}])assert.equal(claimReward(emptyLedger(),done,map,x,rid('market','boss')).credited,0);});
check('weekly completion reward',()=>{assert.equal(claimReward(emptyLedger(),done,map,null,rid('all','weekly')).credited,25);const d=derive(state,now);assert.equal(claimReward(emptyLedger(),d,weeklyMap(d),null,rid('all','weekly')).credited,0);});
check('week boundary denies expired unclaimed receipt',()=>{const d=derive(full,end+86400000);assert.equal(claimReward(emptyLedger(),d,weeklyMap(d),null,rid('market','chest')).credited,0);});
check('same claim on two devices merges once',()=>{const a={version:1,claims:[rid('market','chest')]};assert.equal(ledgerBalance(mergeLedgers(a,a)),15);});
check('divergent device receipts union',()=>{const a={version:1,claims:[rid('market','chest')]},b={version:1,claims:[rid('trail','boss')]};assert.equal(ledgerBalance(mergeLedgers(a,b)),45);assert.deepEqual(mergeLedgers(a,b),mergeLedgers(b,a));assert.deepEqual(mergeLedgers(a,mergeLedgers(a,b)),mergeLedgers(a,b));});
check('detect stale overwrite and old backup',()=>{const a={version:1,claims:[rid('market','chest')]};assert.deepEqual(ledgerLoss(undefined,a),a.claims);assert.deepEqual(ledgerLoss(a,a),[]);});
check('claim and union do not mutate inputs',()=>{const a=emptyLedger(),before=JSON.stringify([a,full,done,map]);const b=claimReward(a,done,map,null,rid('market','chest'));mergeLedgers(a,b.ledger);assert.equal(JSON.stringify([a,full,done,map]),before);});

check('cloud plan legacy saves identical',()=>{const p=planLedgerSync({gold:5},{gold:5},1);assert.equal(p.status,'identical');assert.equal(p.balance,0);});
check('cloud plan unions disjoint receipts only',()=>{const a={gold:5,expedition90Rewards:{version:1,claims:[rid('market','chest')]}},b={gold:5,expedition90Rewards:{version:1,claims:[rid('trail','boss')]}};const before=JSON.stringify([a,b]),p=planLedgerSync(a,b,3);assert.equal(p.status,'ledger-only');assert.equal(p.balance,45);assert.equal(p.revision,3);assert.equal(p.onlyLocal.length,1);assert.equal(p.onlyRemote.length,1);assert.equal(JSON.stringify([a,b]),before);});
check('cloud plan refuses other save differences',()=>{assert.equal(planLedgerSync({gold:1},{gold:2},2).status,'blocked-other-data');assert.equal(planLedgerSync({x:{a:1,b:2}},{x:{b:2,a:1}},2).status,'identical');});
check('cloud plan rejects invalid revision and malformed ledger',()=>{assert.throws(()=>planLedgerSync({}, {},0));assert.throws(()=>planLedgerSync({}, {expedition90Rewards:null},1));});

function mockStorage(){
 const m=new Map();return {get length(){return m.size;},key:i=>[...m.keys()][i]??null,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
}
check('persistent reward survives reconstructed ledger',()=>{const store=mockStorage();const a=persistClaim(store,'guest',done,map,null,rid('market','chest'));assert.equal(a.credited,15);assert.equal(ledgerBalance(readReceipts(store,'guest')),15);assert.equal(persistClaim(store,'guest',done,map,null,rid('market','chest')).credited,0);});
check('scope isolation and independent receipt keys',()=>{const store=mockStorage();persistReceipt(store,'guest',rid('market','chest'));persistReceipt(store,'account:a',rid('trail','boss'));persistReceipt(store,'account:a',rid('market','chest'));assert.equal(ledgerBalance(readReceipts(store,'guest')),15);assert.equal(ledgerBalance(readReceipts(store,'account:a')),45);assert.equal(ledgerBalance(readReceipts(store,'account:b')),0);});
check('unrelated keys unchanged and duplicate id stable',()=>{const store=mockStorage();store.setItem('poikatsu-quest-v01','original');persistReceipt(store,'guest',rid('market','chest'));persistReceipt(store,'guest',rid('market','chest'));assert.equal(store.length,2);assert.equal(store.getItem('poikatsu-quest-v01'),'original');});
check('storage quota failure does not invent balance',()=>{const store=mockStorage();store.setItem=()=>{throw Error('quota');};assert.throws(()=>persistClaim(store,'guest',done,map,null,rid('market','chest')));assert.equal(ledgerBalance(readReceipts(store,'guest')),0);});
check('corrupt persistent receipt blocks writes',()=>{const store=mockStorage();store.setItem('pq9-receipt-v1:guest:'+rid('market','chest'),'bad');assert.throws(()=>readReceipts(store,'guest'));assert.throws(()=>persistClaim(store,'guest',done,map,null,rid('trail','chest')));});
check('catalog prices fixed and eight items',()=>{assert.equal(Object.keys(SHOP).length,8);assert.equal(SHOP.sword.cost,60);});
check('wallet derives cost from owned receipts',()=>{const l={version:1,claims:[rid('market','boss'),rid('trail','boss')]};assert.deepEqual(wallet(l,['lantern']),{earned:60,spent:25,balance:35});});
check('insufficient and invalid purchase rejected',()=>{assert.equal(purchasePlan(emptyLedger(),[],'sword').status,'insufficient');assert.equal(purchasePlan(emptyLedger(),[],'invalid').status,'invalid');});
check('purchase exactly once and immutable',()=>{const l={version:1,claims:[rid('market','boss'),rid('trail','boss')]},owned=[];const p=purchasePlan(l,owned,'sword');assert.equal(p.status,'purchased');assert.equal(p.wallet.balance,0);assert.equal(purchasePlan(l,p.owned,'sword').status,'duplicate');assert.deepEqual(owned,[]);});
check('invalid owned history rejected',()=>{assert.throws(()=>validateOwned(['sword','sword']));assert.throws(()=>validateOwned(['fake']));});
check('collection progress and display scope',()=>{const store=mockStorage(),scope='guest';storeOwned(store,scope,'lantern');assert.deepEqual(readOwned(store,scope),['lantern']);assert.deepEqual(readOwned(store,'account:a'),[]);assert.equal(collectionMilestones(emptyLedger(),['lantern'])[0].done,true);assert.throws(()=>setDisplay(store,scope,['lantern'],'sword'));setDisplay(store,scope,['lantern'],'lantern');assert.equal(readDisplay(store,scope,['lantern']),'lantern');assert.equal(readDisplay(store,'account:a',[]),null);setDisplay(store,scope,['lantern'],null);assert.equal(readDisplay(store,scope,['lantern']),null);});
(async()=>{
 const store=mockStorage(),scope='account:a',a=rid('market','chest'),b=rid('trail','boss');
 persistReceipt(store,scope,a);
 const remote=new Set([b]);
 const adapter={read:async()=>({version:1,claims:[...remote]}),insert:async ids=>ids.forEach(x=>remote.add(x))};
 let synced=await syncReceipts(store,scope,adapter);assert.equal(ledgerBalance(synced),45);assert.equal(remote.size,2);n++;console.log('PASS cloud union');
 synced=await syncReceipts(store,scope,adapter);assert.equal(ledgerBalance(synced),45);assert.equal(remote.size,2);n++;console.log('PASS repeated cloud sync');
 await assert.rejects(syncReceipts(store,'guest',adapter));n++;console.log('PASS guest cannot upload');
 await assert.rejects(syncReceipts(store,scope,{read:async()=>{throw Error('network');},insert:async()=>{throw Error('unexpected');}}));assert.equal(ledgerBalance(readReceipts(store,scope)),45);n++;console.log('PASS network failure preserves local');
 const missing=rid('market','normal');persistReceipt(store,scope,missing);
 await assert.rejects(syncReceipts(store,scope,{read:adapter.read,insert:async()=>{}}));assert.equal(ledgerBalance(readReceipts(store,scope)),55);n++;console.log('PASS cloud verification failure preserves local');
 const shopStore=mockStorage();persistReceipt(shopStore,'guest',rid('market','boss'));persistReceipt(shopStore,'guest',rid('trail','boss'));
 let tail=Promise.resolve();const locks={request:(name,fn)=>{const next=tail.then(fn);tail=next.catch(()=>{});return next;}};
 const purchases=await Promise.all([buyGuest(shopStore,'guest','sword',locks),buyGuest(shopStore,'guest','shield',locks)]);
 assert.deepEqual(purchases.map(x=>x.status),['purchased','insufficient']);assert.equal(wallet(readReceipts(shopStore,'guest'),readOwned(shopStore,'guest')).balance,0);n++;console.log('PASS serialized guest purchases');
 await assert.rejects(buyGuest(shopStore,'guest','lantern',null));await assert.rejects(buyGuest(shopStore,'account:a','lantern',locks));n++;console.log('PASS unsafe or wrong scope purchase blocked');
 console.log(n+' checks passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
