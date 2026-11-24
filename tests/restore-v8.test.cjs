'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('backup-preview-v8.js','utf8');
const context={document:{readyState:'loading',addEventListener(){}},classes:{warrior:[]},areas:[{}]};
vm.createContext(context);
const instrumented=source.replace(/\}\)\(\);\s*$/, 'globalThis.testAPI={runRestoreTests,preflight};})();');
assert.notEqual(source,instrumented);
vm.runInContext(instrumented,context);
const cases=context.testAPI.runRestoreTests();
for(const item of cases){assert.equal(item.pass,true,item.name);console.log('PASS',item.name);}
const current={level:1,xp:0,gold:0,energy:2,completed:0,log:[],inventory:[],kills:[],bosses:[],achievements:[],storySeen:[],classId:'warrior',area:0,hp:30,maxHp:30,attack:5,stage:1,enemyHp:20,enemyMax:20,rerolls:3};
const wrap=saveData=>({format:'poikatsu-quest-manual-backup',version:1,createdAt:'2026-11-24T00:00:00Z',saveData});
for(const [name,data,pass] of [['valid',current,true],['negative gold',{...current,gold:-1},false],['wrong class',{...current,classId:'invalid'},false],['wrong log',{...current,log:[7]},false],['duplicate history',{...current,questHistory:[{id:'a'},{id:'a'}]},false]]){
 assert.equal(context.testAPI.preflight(current,wrap(data)).length===0,pass,name);console.log('PASS',name);
}
const html=fs.readFileSync('index.html','utf8');
const guard=html.match(/function pqStopStale\(\)[\s\S]*?(?=window\.addEventListener\('storage')/)[0];
let raw='initial',stopped=false;
const g={KEY:'save',pqSaveBaseline:'initial',pqSaveBlocked:false,s:{level:2},localStorage:{getItem:()=>raw,setItem:(_,v)=>{raw=v}},cloud:{enabled:true,timer:null},clearTimeout(){},cloudStatus(){stopped=true}};
vm.createContext(g);vm.runInContext(guard,g);g.pqGuardedSave();assert.equal(raw,'{"level":2}');console.log('PASS normal save');
raw='other tab';assert.throws(()=>g.pqGuardedSave());assert.equal(raw,'other tab');assert.equal(g.cloud.enabled,false);assert.equal(stopped,true);console.log('PASS stale save stops sync');
console.log('14 checks passed');
