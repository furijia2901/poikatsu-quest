'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {GROUPS,LABELS,groupFor}=require('../ui92.js');
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
