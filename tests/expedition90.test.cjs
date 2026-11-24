'use strict';
const assert=require('node:assert/strict');
const {period,derive,weeklyMap,battleEligible,beginBattle,enemyIntent,affinity,canAct,battleStep}=require('../expedition90.js');
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
console.log(n+' checks passed');
