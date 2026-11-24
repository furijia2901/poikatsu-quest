'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {ROUTES,TYPES,selectRoutes,summaryRows,SAMPLE}=require('../collection105.js');
const {GROUPS,SCREEN_LAYOUTS}=require('../ui92.js');
assert.equal(ROUTES.length,24);assert.equal(new Set(ROUTES.map(r=>r[0])).size,24);
assert.deepEqual(TYPES.map(([id])=>selectRoutes(id).length),[8,11,5]);
for(const [id,type,label,panel,selector] of ROUTES){
 assert.ok(GROUPS.some(g=>g.tabs.includes(panel)),id);
 if(panel!=='home'&&panel!=='expedition90'){const i=Number(selector.match(/\d+/g).at(-1));assert.ok(SCREEN_LAYOUTS[panel].views[i],id);}
}
assert.equal(selectRoutes('gacha','遠征').length,1);assert.equal(selectRoutes('codex','無関係').length,0);
assert.deepEqual(summaryRows(['  星剣   +12  ','']),['星剣 +12']);assert.equal(summaryRows(Array(20).fill('x')).length,12);assert.equal(summaryRows(['x'.repeat(300)])[0].length,180);
assert.equal(SAMPLE.equipment.length,2);
const code=fs.readFileSync('collection105.js','utf8');
assert.ok(!/\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|cloudRequest|cloudEnsureToken|cloudRemote|save)\s*(?:\.|\()/g.test(code));
assert.ok(!/\b(?:s|cloud)\s*\.[A-Za-z_$][\w$]*\s*=(?!=)/g.test(code));
console.log('PASS 24 collection routes, safe summary projection, search and read-only fixture safety');
