'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {KEY,DEFAULT,normalize,read,write,SONGS,EFFECTS,hz,sceneFor,notesFor}=require('../audio105.js');
assert.equal(DEFAULT.enabled,false);
assert.deepEqual(normalize({version:2}),DEFAULT);
assert.deepEqual(normalize({version:1,enabled:true,bgm:120,sfx:-9,motion:false}),{version:1,enabled:true,bgm:100,sfx:0,motion:false});
assert.equal(normalize({version:1,bgm:NaN,sfx:'5'}).bgm,35);
const data=new Map([['poikatsu-quest-v01','untouched']]),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
assert.deepEqual(read(storage),DEFAULT);const saved=write(storage,{...DEFAULT,enabled:true,bgm:20});assert.deepEqual(read(storage),saved);assert.equal(data.get('poikatsu-quest-v01'),'untouched');assert.equal(data.size,2);data.set(KEY,'broken');assert.deepEqual(read(storage),DEFAULT);
assert.throws(()=>write({getItem:()=>null,setItem:()=>{}},DEFAULT));
assert.equal(hz(69),440);assert.equal(hz(81),880);
assert.equal(sceneFor(true,'home'),'title');assert.equal(sceneFor(false,'expedition90'),'adventure');assert.equal(sceneFor(false,'home'),'home');
assert.equal(Object.keys(SONGS).length,3);assert.equal(Object.keys(EFFECTS).length,4);
for(const name of Object.keys(SONGS)){for(let i=0;i<8;i++){const p=notesFor(name,i);assert.equal(p.notes.length,7);assert.ok(p.length>0);assert.ok(p.notes.every(n=>n.duration>0&&n.offset>=0&&n.offset<p.length&&n.volume<=.12));}assert.deepEqual(notesFor(name,0),notesFor(name,8));}
const code=fs.readFileSync('audio105.js','utf8');
assert.ok(!/\b(?:fetch|XMLHttpRequest|cloudRequest|cloudEnsureToken|cloudRemote)\s*\(/.test(code));assert.ok(!/\b(?:s|cloud)\s*\.[A-Za-z_$][\w$]*\s*=(?!=)/.test(code));
assert.ok(code.includes("if(test){status.textContent="));
console.log('PASS audio defaults, preference-only persistence, three original loops, volume clamping and isolated preview');
