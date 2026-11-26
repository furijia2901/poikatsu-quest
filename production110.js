/* Phase 4: bounded offline production; district transaction clock, no real-world value. */
(function(){
 'use strict';
 const R=typeof module==='object'&&module.exports?require('./residents110.js'):window.PQ110Residents;
 const HOUR=3600000,CAP_MS=12*HOUR,UNIT=1000;
 const RES=Object.freeze([['food','🌾','食料'],['wood','🪵','木材'],['stone','🪨','石材'],['goods','⚒️','加工品']].map(Object.freeze));
 const KEYS=RES.map(x=>x[0]);
 const fresh=now=>({version:1,lastAt:now,stock:{food:0,wood:0,stone:0,goods:0},carry:{food:0,wood:0,stone:0}});
 function validTime(n){return Number.isSafeInteger(n)&&n>=0&&n<=8640000000000000;}
 function validate(raw,now){
  if(!validTime(now))return null;if(raw===undefined)return fresh(now);
  if(!raw||raw.version!==1||!validTime(raw.lastAt)||!raw.stock||!raw.carry)return null;
  if(KEYS.some(k=>!Number.isSafeInteger(raw.stock[k])||raw.stock[k]<0||raw.stock[k]>1000000))return null;
  if(KEYS.slice(0,3).some(k=>!Number.isSafeInteger(raw.carry[k])||raw.carry[k]<0||raw.carry[k]>=HOUR*UNIT))return null;
  return {...raw,stock:{...raw.stock},carry:{...raw.carry}};
 }
 function rates(d){
  const m=R.derive(d);if(!m)return null;
  const sum=t=>d.buildings.filter(b=>b.type===t).reduce((n,b)=>n+b.level,0);
  const skill=(job)=>m.residents.people.filter(p=>p.job===job).reduce((n,p)=>n+100+(R.identity(p.id).talent==='勤勉'?10:R.identity(p.id).talent==='集中力'?5:0),0);
  const multiplier=m.efficiency+Math.min(20,m.used.clerk*2);
  const rate=(job,base)=>Math.floor(base*skill(job)*multiplier*UNIT/10000);
  return {rates:{food:rate('farmer',6),wood:rate('lumberjack',4),stone:rate('miner',3)},capacity:100+sum('warehouse')*100+m.used.porter*25,artisans:m.used.artisan,efficiency:multiplier};
 }
 function settle(d,now){
  const p=validate(d?.production,now),r=rates(d);if(!p||!r)return null;
  const elapsed=Math.min(CAP_MS,Math.max(0,now-p.lastAt)),gained={food:0,wood:0,stone:0};
  for(const k of KEYS.slice(0,3)){
   const numerator=p.carry[k]+r.rates[k]*elapsed;
   const whole=Math.floor(numerator/(HOUR*UNIT)),room=Math.max(0,r.capacity-p.stock[k]);
   gained[k]=Math.min(whole,room);p.stock[k]+=gained[k];
   p.carry[k]=p.stock[k]>=r.capacity?0:numerator%(HOUR*UNIT);
  }
  p.lastAt=Math.max(now,p.lastAt);
  return {district:{...d,production:p},gained,elapsed,capacity:r.capacity,rates:r.rates,artisans:r.artisans};
 }
 function transact(d,gold,action,now){
  const next=settle(d,now);if(!next||!Number.isSafeInteger(gold)||gold<0)return {ok:false,reason:'invalid'};
  const p=next.district.production;
  if(action.kind==='production-collect')return {ok:true,district:next.district,gold,cost:0,gained:next.gained};
  if(action.kind!=='production-craft')return {ok:false,reason:'action'};
  const count=action.count;if(!Number.isSafeInteger(count)||count<1||count>next.artisans)return {ok:false,reason:'workers'};
  if(p.stock.wood<count*2||p.stock.stone<count)return {ok:false,reason:'resources'};
  if(p.stock.goods+count>next.capacity)return {ok:false,reason:'storage'};
  p.stock.wood-=count*2;p.stock.stone-=count;p.stock.goods+=count;
  return {ok:true,district:next.district,gold,cost:0,gained:next.gained,crafted:count};
 }
 const FIX_NOW=1760000000000;
 function fixture(kind='basic'){
  const district={version:1,buildings:[{cell:1,type:'house',level:2},{cell:3,type:'farm',level:1},{cell:4,type:'lumber',level:1},{cell:6,type:'quarry',level:1},{cell:7,type:'warehouse',level:1},{cell:9,type:'workshop',level:1},{cell:10,type:'hall',level:1},{cell:11,type:'park',level:1}],residents:{nextId:7,people:[{id:1,job:'farmer'},{id:2,job:'lumberjack'},{id:3,job:'miner'},{id:4,job:'porter'},{id:5,job:'artisan'},{id:6,job:'clerk'}]}};
  district.production=fresh(FIX_NOW);
  if(kind==='full')for(const k of KEYS)district.production.stock[k]=rates(district).capacity;
  if(kind==='idle')district.residents.people.forEach(p=>p.job='idle');
  return {district,gold:500,now:FIX_NOW+(kind==='offline'?24:kind==='idle'?6:1)*HOUR};
 }
 const MSG={invalid:'資源データを確認できません。変更を中止しました。',workers:'工房に職人を配置してください。',resources:'木材・石材が足りません。',storage:'倉庫が満杯です。',action:'操作が無効です。'};
 if(typeof module==='object'&&module.exports){module.exports={HOUR,CAP_MS,UNIT,RES,fresh,validate,rates,settle,transact,fixture};return;}
 const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 const btn=(parent,label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;parent.append(b);return b;};
 function mount(){
  const anchor=document.getElementById('pq11-residents');if(!anchor||document.getElementById('pq11-production'))return;
  const root=el('section','','pq11-district pq11-production');root.id='pq11-production';anchor.after(root);
  const dialog=el('dialog','','pq11-district pq11-production');dialog.id='pq11-production-test';dialog.setAttribute('aria-label','資源生産試験');document.body.append(dialog);
  const style=el('style');style.textContent='.pq11-resource-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.pq11-resource-card{background:#172f3e;border:1px solid #73918d;border-radius:10px;padding:9px;min-width:0;overflow-wrap:anywhere}.pq11-resource-card strong{display:block;color:#ffe4ab;font-size:17px}.pq11-resource-card small{color:#bfdad2;font-size:11px}.pq11-resource-card progress{width:100%;accent-color:#d6bd7d}.pq11-production .pq11-district-actions{margin-top:10px}#pq11-production-test{width:min(650px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:14px;border-radius:15px}#pq11-production-test::backdrop{background:#06101bdc}';
  document.head.append(style);
  let sample=fixture(),msg='',testMsg='',busy=false;
  function paint(target,test){
   const now=test?sample.now:Date.now(),d=test?sample.district:window.PQ110District.validate(s.town110),gold=test?sample.gold:s.gold,model=d&&settle(d,now);
   target.replaceChildren(el('h2',test?'🧪 資源生産試験':'📦 資源生産・倉庫'),el('p','住民が働くと時間経過で資源を生産。最大12時間分まで、資源ごとの倉庫上限まで蓄積します。建設・転職時も変更前の生産量を確定します。'));
   if(!model){target.append(el('p',MSG.invalid));if(test)btn(target,'試験終了',()=>dialog.close());return;}
   const stored=validate(d.production,now),stock=model.district.production.stock;
   target.append(el('p','各資源の保管上限 '+model.capacity+'個 ｜ オフライン対象 '+Math.floor(model.elapsed/60000)+'分 / 720分'));
   const grid=el('div','','pq11-resource-grid');target.append(grid);
   for(const [id,icon,label] of RES){const card=el('div','','pq11-resource-card');card.dataset.pq11Resource=id;card.append(el('small',icon+' '+label),el('strong',stored.stock[id]+' / '+model.capacity),el('small',id==='goods'?'工房で加工':'生産 '+(model.rates[id]/UNIT).toFixed(2)+'個/時 ・ 未回収 +'+model.gained[id]));const bar=el('progress');bar.max=model.capacity;bar.value=Math.min(model.capacity,stock[id]);bar.setAttribute('aria-label',label+'保管率');card.append(bar);grid.append(card);}
   const actions=el('div','','pq11-district-actions');target.append(actions);
   btn(actions,'生産分を回収',()=>run({kind:'production-collect'},test)).disabled=(busy&&!test)||!Object.values(model.gained).some(n=>n>0);
   btn(actions,'加工品を1個作る',()=>run({kind:'production-craft',count:1},test)).disabled=(busy&&!test)||model.artisans<1||stock.wood<2||stock.stone<1||stock.goods>=model.capacity;
   target.append(el('p','工房：木材2＋石材1 → 加工品1。職人が必要。倉庫係1人で各資源の容量+25、行政官1人で生産効率+2%（最大20%）。'));
   const status=el('p',test?testMsg:msg,'pq11-district-status');status.setAttribute('role','status');target.append(status);
   const footer=el('div','','pq11-district-actions');target.append(footer);
   if(test){btn(footer,'時間を1時間進める',()=>{sample.now+=HOUR;paint(dialog,true);});for(const [id,label] of [['basic','試験初期化'],['offline','24時間経過'],['full','倉庫満杯'],['idle','住民待機']])btn(footer,label,()=>{sample=fixture(id);testMsg='';paint(dialog,true);});btn(footer,'試験終了',()=>dialog.close());}
   else btn(footer,'🧪 資源生産試験',()=>{sample=fixture();testMsg='';paint(dialog,true);dialog.showModal();});
  }
  async function run(action,test){
   if(test){const next=transact(sample.district,sample.gold,action,sample.now);if(next.ok){sample={...sample,district:next.district,gold:next.gold};testMsg=action.kind==='production-craft'?'試験加工完了':'試験回収完了';}else testMsg=MSG[next.reason];paint(dialog,true);return;}
   if(busy)return;busy=true;try{const next=await window.PQ110District.commit(action);msg=next?.ok?'資源を保存しました。':MSG[next?.reason]||next?.message||'操作を中止しました。';}finally{busy=false;paint(root,false);}
  }
  window.PQ110Production.refresh=()=>paint(root,false);paint(root,false);
  setInterval(()=>{if(!document.hidden&&document.getElementById('town')?.classList.contains('active')&&!busy)paint(root,false);},30000);
 }
 window.PQ110Production={validate,rates,settle,transact,messages:MSG,refresh:null};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
