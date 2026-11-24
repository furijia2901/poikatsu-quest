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
for(const [name,data] of [['invalid log object',{...current,log:{}}],['invalid level',{...current,level:0}],['missing gold',Object.fromEntries(Object.entries(current).filter(([k])=>k!=='gold'))]]){assert.ok(context.testAPI.preflight(current,wrap(data)).length>0,name);console.log('PASS',name);}
assert.ok(!source.includes('localStorage.setItem(KEY'));
assert.ok(!source.includes('apply.addEventListener'));
console.log('17 checks passed (15 functional, 2 source safety assertions)');
