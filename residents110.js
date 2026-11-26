/* Phase 3: residents, job assignment and happiness. All calculations are pure. */
(function(){
 'use strict';
 const JOBS=Object.freeze([
  ['idle','待機','🧑',null],['farmer','農家','🌾','farm'],['lumberjack','木こり','🪵','lumber'],
  ['miner','採石職人','⛏️','quarry'],['porter','倉庫係','📦','warehouse'],['artisan','職人','⚒️','workshop'],['clerk','行政官','📜','hall']
 ].map(Object.freeze));
 const NAMES=Object.freeze(['ルナ','アスター','ミラ','ノア','セラ','リオ','エルナ','カイル','フィオ','ユナ','レオン','シオン']);
 const TALENTS=Object.freeze(['勤勉','器用','社交的','集中力']);
 const RECRUIT_COST=50, MAX_POP=420;
 const fresh=()=>({nextId:1,people:[]});
 function validate(raw){
  if(raw===undefined)return fresh();
  if(!raw||!Array.isArray(raw.people)||raw.people.length>MAX_POP||!Number.isSafeInteger(raw.nextId)||raw.nextId<1||raw.nextId>MAX_POP+1)return null;
  const seen=new Set(),people=[];
  for(const p of raw.people){if(!p||!Number.isInteger(p.id)||p.id<1||p.id>=raw.nextId||seen.has(p.id)||!JOBS.some(j=>j[0]===p.job))return null;seen.add(p.id);people.push({...p});}
  return {...raw,people};
 }
 function derive(district){
  if(!district||!Array.isArray(district.buildings))return null;
  const residents=validate(district.residents);if(!residents)return null;
  const sum=type=>district.buildings.filter(b=>b.type===type).reduce((n,b)=>n+b.level,0);
  const capacity=sum('house')*4,slots=Object.fromEntries(JOBS.filter(j=>j[3]).map(j=>[j[0],sum(j[3])*2]));
  const used=Object.fromEntries(JOBS.map(j=>[j[0],residents.people.filter(p=>p.job===j[0]).length]));
  if(residents.people.length>capacity||Object.keys(slots).some(k=>used[k]>slots[k]))return null;
  const population=residents.people.length, employed=population-used.idle;
  const happiness=Math.max(0,Math.min(100,50+Math.min(25,sum('park')*5)+Math.min(15,sum('hall')*3)+(population?Math.floor(employed/population*10):0)));
  return {residents,capacity,population,employed,slots,used,happiness,efficiency:Math.round((.75+happiness/200)*100)};
 }
 function identity(id){return {name:NAMES[(id-1)%NAMES.length]+' #'+id,talent:TALENTS[(id-1)%TALENTS.length]};}
 function transact(district,gold,action){
  const m=derive(district);if(!m||!Number.isSafeInteger(gold)||gold<0)return {ok:false,reason:'invalid'};
  const residents=m.residents;let cost=0;
  if(action.kind==='resident-recruit'){
   if(m.population>=m.capacity||residents.nextId>MAX_POP)return {ok:false,reason:'housing'};
   cost=RECRUIT_COST;if(gold<cost)return {ok:false,reason:'gold'};
   residents.people.push({id:residents.nextId++,job:'idle'});
  }else if(action.kind==='resident-assign'){
   const person=residents.people.find(p=>p.id===action.id),job=action.job;
   if(!person||!JOBS.some(j=>j[0]===job))return {ok:false,reason:'job'};
   if(person.job===job)return {ok:false,reason:'same'};
   if(job!=='idle'&&m.used[job]>=m.slots[job])return {ok:false,reason:'slots'};
   person.job=job;
  }else return {ok:false,reason:'action'};
  return {ok:true,district:{...district,residents},gold:gold-cost,cost};
 }
 function fixture(kind='basic'){
  if(kind==='empty')return {district:{version:1,buildings:[]},gold:500};
  const buildings=[{cell:1,type:'house',level:1},{cell:3,type:'farm',level:1},{cell:4,type:'park',level:1},{cell:6,type:'lumber',level:1},{cell:7,type:'hall',level:1}];
  const people=kind==='full'?[{id:1,job:'farmer'},{id:2,job:'farmer'},{id:3,job:'idle'},{id:4,job:'idle'}]:[{id:1,job:'farmer'},{id:2,job:'idle'}];
  return {district:{version:1,buildings,residents:{nextId:people.length+1,people}},gold:kind==='poor'?0:500};
 }
 const MSG={invalid:'住民データを確認できません。変更を中止しました。',housing:'空き住宅がありません。',gold:'ゴールドが足りません。',job:'住民または職業を確認してください。',same:'すでにその職業です。',slots:'この職業の空き枠がありません。',action:'操作が無効です。'};
 if(typeof module==='object'&&module.exports){module.exports={JOBS,RECRUIT_COST,MAX_POP,validate,derive,identity,transact,fixture};return;}
 const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 const btn=(parent,label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;parent.append(b);return b;};
 function mount(){
  const anchor=document.getElementById('pq11-district');if(!anchor||document.getElementById('pq11-residents'))return;
  const root=el('section','','pq11-district pq11-residents');root.id='pq11-residents';anchor.after(root);
  const dialog=el('dialog','','pq11-district pq11-residents');dialog.id='pq11-residents-test';dialog.setAttribute('aria-label','住民試験');document.body.append(dialog);
  const style=el('style');style.textContent='.pq11-residents .pq11-resident-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0}.pq11-residents .pq11-resident-stat{padding:9px;background:#152e3d;border:1px solid #6d9290;border-radius:9px;display:grid;gap:4px}.pq11-resident-stat small{font-size:11px;color:#bad6d2}.pq11-resident-stat strong{font-size:18px;color:#ffe4a8}.pq11-jobs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:10px 0}.pq11-job{padding:7px;background:#25434b;border-radius:7px;font-size:12px;overflow-wrap:anywhere}.pq11-resident-list{display:grid;gap:6px;max-height:330px;overflow:auto;margin:10px 0}.pq11-person{padding:9px;background:#172d3e;border:1px solid #6c9296;border-radius:9px}.pq11-person p{margin:3px 0}.pq11-person select{margin:4px 0}.pq11-residents progress{width:100%;accent-color:#d3bf82}#pq11-residents-test{width:min(670px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;border-radius:15px;padding:14px}#pq11-residents-test::backdrop{background:#06101bdc}';
  document.head.append(style);
  let sample=fixture(),message='',testMessage='',busy=false;
  function paint(target,test){
   const d=test?sample.district:window.PQ110District.validate(s.town110),gold=test?sample.gold:s.gold,m=derive(d);
   target.replaceChildren(el('h2',test?'🧪 住民試験':'👥 住民と職業'),el('p',test?'試験用住民・ゴールドのみ。':'住宅1Lvにつき4人。職場1Lvにつき2人を配置できます。住民の特性は表示用、生産への反映は次のフェーズです。'));
   if(!m){target.append(el('p',MSG.invalid));if(test)btn(target,'試験終了',()=>dialog.close());return;}
   const stats=el('div','','pq11-resident-stats');for(const [label,value] of [['人口',m.population+' / '+m.capacity],['就業中',m.employed+' 人'],['幸福度',m.happiness+'%'],['生産効率の目安',m.efficiency+'%']]){const tile=el('div','','pq11-resident-stat');tile.append(el('small',label),el('strong',value));stats.append(tile);}target.append(stats);
   const bar=el('progress');bar.max=100;bar.value=m.happiness;bar.setAttribute('aria-label','幸福度');target.append(bar,el('p','所持 '+gold+'G ｜ 公園・市庁舎・就業率で幸福度アップ'));
   const recruit=btn(target,'住民を迎える（50G）',()=>run({kind:'resident-recruit'},test));recruit.disabled=busy&&!test||m.population>=m.capacity||m.residents.nextId>MAX_POP||gold<RECRUIT_COST;
   const jobs=el('div','','pq11-jobs');for(const [id,name,icon] of JOBS.filter(j=>j[3]))jobs.append(el('div',icon+' '+name+' '+m.used[id]+'/'+m.slots[id],'pq11-job'));target.append(jobs);
   const list=el('div','','pq11-resident-list');target.append(list);
   for(const p of m.residents.people){const person=el('article','','pq11-person');person.dataset.pq11Resident=String(p.id);const ident=identity(p.id);person.append(el('strong','👤 '+ident.name),el('p','特性：'+ident.talent));const sel=el('select');sel.setAttribute('aria-label',ident.name+'の職業');for(const [id,label,icon] of JOBS){const option=el('option',icon+' '+label+(id==='idle'?'':' ('+m.used[id]+'/'+m.slots[id]+')'));option.value=id;option.disabled=id!=='idle'&&p.job!==id&&m.used[id]>=m.slots[id];sel.append(option);}sel.value=p.job;sel.disabled=busy&&!test;sel.onchange=()=>run({kind:'resident-assign',id:p.id,job:sel.value},test);person.append(sel);list.append(person);}
   if(!m.population)list.append(el('p','住宅を建設して住民を迎えよう。'));
   const status=el('p',test?testMessage:message,'pq11-district-status');status.setAttribute('role','status');target.append(status);
   const actions=el('div','','pq11-district-actions');target.append(actions);
   if(test){for(const [id,label] of [['basic','試験初期化'],['empty','住宅なし'],['full','住宅・職場満員'],['poor','資金不足']])btn(actions,label,()=>{sample=fixture(id);testMessage='';paint(dialog,true);});btn(actions,'試験終了',()=>dialog.close());}
   else btn(actions,'🧪 住民試験',()=>{sample=fixture();testMessage='';paint(dialog,true);dialog.showModal();});
  }
  async function run(action,test){
   if(test){const next=transact(sample.district,sample.gold,action);if(next.ok){sample={district:next.district,gold:next.gold};testMessage='試験操作完了';}else testMessage=MSG[next.reason];paint(dialog,true);return;}
   if(busy)return;busy=true;
   try{const result=await window.PQ110District.commit(action);message=result?.ok?'住民の変更を保存しました。':MSG[result?.reason]||result?.message||'変更を中止しました。';}finally{busy=false;paint(root,false);}
  }
  window.PQ110Residents.refresh=()=>paint(root,false);paint(root,false);
 }
 window.PQ110Residents={derive,transact,messages:MSG,refresh:null};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
