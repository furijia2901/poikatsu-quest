'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {GROUPS,LABELS,groupFor,SCREEN_LAYOUTS,layoutValid}=require('../ui92.js');
const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('expedition90.js','utf8');
const original=[...html.matchAll(/<button[^>]*data-tab="([^"]+)"/g)].map(x=>x[1]);
assert.equal(original.length,26);
assert.ok(js.includes("btn.dataset.tab='expedition90'"));
const all=[...original,'expedition90','settings92'];
const grouped=GROUPS.flatMap(g=>g.tabs);
assert.equal(GROUPS.length,6);
assert.equal(new Set(grouped).size,28);
assert.deepEqual([...grouped].sort(),all.sort());
for(const group of GROUPS)for(const id of group.tabs){assert.equal(groupFor(id),group.id);assert.ok(LABELS[id]);}
assert.equal(groupFor('future-feature'),'other');
assert.ok(html.indexOf('src="./ui92.js"')>html.indexOf('src="./expedition90.js"'));
console.log('PASS complete tab coverage, no duplicates, labels and safe load order');

assert.equal(Object.keys(SCREEN_LAYOUTS).length,24);
for(const [id,def] of Object.entries(SCREEN_LAYOUTS)){const count=(def.keep||[]).length+def.views.flatMap(v=>v[1]).length;assert.ok(layoutValid(def,count),id);assert.ok(!layoutValid(def,count+1),id+' must fail open');}
assert.ok(!layoutValid({views:[['a',[0]],['b',[0]]]},2));
console.log('PASS composite view mapping and fail-open guard');
