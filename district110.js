/* TOWN REVOLUTION Phase 2. Pure district transactions, normal save integration, isolated fixtures. */
(function(){
 'use strict';
 const SIZE=6, PLOTS=Object.freeze(Array.from({length:36},(_,i)=>i).filter(i=>i%6!==2&&Math.floor(i/6)!==3&&![0,5,30,35].includes(i)));
 const TYPES=Object.freeze([
  ['house','🏠','住宅',120,5,'住民の居住区'],['farm','🌾','農場',160,5,'食料生産施設'],
  ['lumber','🪵','製材所',180,5,'木材生産施設'],['quarry','⛏️','採石場',200,5,'石材生産施設'],
  ['warehouse','📦','倉庫',240,5,'資源保管施設'],['workshop','⚒️','工房',320,5,'加工施設'],
  ['park','🌷','公園',150,5,'住民の憩いの場'],['hall','🏛️','市庁舎',450,5,'都市運営施設']
 ].map(x=>Object.freeze({id:x[0],icon:x[1],name:x[2],base:x[3],max:x[4],description:x[5]})));
 const byType=id=>TYPES.find(t=>t.id===id);
 const fresh=()=>({version:1,buildings:[]});
 // Invalid or newer saves are never silently replaced.
 function validate(raw){
  if(raw===undefined)return fresh();
  if(!raw||raw.version!==1||!Array.isArray(raw.buildings)||raw.buildings.length>PLOTS.length)return null;
  const seen=new Set();
  const buildings=[];
  for(const b of raw.buildings){const t=byType(b?.type);if(!t||!PLOTS.includes(b.cell)||seen.has(b.cell)||!Number.isInteger(b.level)||b.level<1||b.level>t.max)return null;seen.add(b.cell);buildings.push({...b});}
  return {...raw,buildings};
 }
 function transact(raw,gold,action){
  const d=validate(raw);if(!d)return {ok:false,reason:'invalid'};
  if(!Number.isSafeInteger(gold)||gold<0)return {ok:false,reason:'invalid'};
  if(!action||!PLOTS.includes(action.cell))return {ok:false,reason:'plot'};
  const b=d.buildings.find(x=>x.cell===action.cell);let cost=0;
  if(action.kind==='build'){const t=byType(action.type);if(!t)return {ok:false,reason:'type'};if(b)return {ok:false,reason:'occupied'};cost=t.base;if(gold<cost)return {ok:false,reason:'gold'};d.buildings.push({cell:action.cell,type:t.id,level:1});}
  else if(action.kind==='upgrade'){if(!b)return {ok:false,reason:'empty'};const t=byType(b.type);if(b.level>=t.max)return {ok:false,reason:'max'};cost=t.base*(b.level+1);if(gold<cost)return {ok:false,reason:'gold'};b.level++;}
  else if(action.kind==='move'){if(!b)return {ok:false,reason:'empty'};if(!PLOTS.includes(action.to)||action.to===action.cell)return {ok:false,reason:'plot'};if(d.buildings.some(x=>x.cell===action.to))return {ok:false,reason:'occupied'};b.cell=action.to;}
  else return {ok:false,reason:'action'};
  return {ok:true,district:d,gold:gold-cost,cost};
 }
 function fixture(kind='basic'){
  if(kind==='poor')return {district:fresh(),gold:0};
  if(kind==='max')return {district:{version:1,buildings:PLOTS.map((cell,i)=>({cell,type:TYPES[i%TYPES.length].id,level:5}))},gold:100000};
  return {district:{version:1,buildings:[{cell:PLOTS[0],type:'house',level:1},{cell:PLOTS[1],type:'farm',level:2}]},gold:5000};
 }
 const MESSAGES={invalid:'保存データを確認できません。変更を中止しました。',plot:'建設可能な区画を選んでください。',occupied:'その区画にはすでに施設があります。',empty:'施設がありません。',max:'最大レベルです。',gold:'ゴールドが足りません。',type:'施設を選択してください。',action:'操作が無効です。'};
 if(typeof module==='object'&&module.exports){module.exports={SIZE,PLOTS,TYPES,fresh,validate,transact,fixture};return;}
 const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 function btn(parent,label,fn){const b=el('button',label);b.type='button';b.onclick=fn;parent.append(b);return b;}
 function mount(){
  const panel=document.getElementById('town'),map=document.getElementById('pq11-town');if(!panel||!map||document.getElementById('pq11-district'))return;
  const root=el('section','','pq11-district');root.id='pq11-district';map.after(root);
  const dialog=el('dialog','','pq11-district');dialog.id='pq11-district-test';dialog.setAttribute('aria-label','新区画建設試験');document.body.append(dialog);
  const style=el('style');style.textContent='.pq11-district{box-sizing:border-box;background:#1d3541!important;border:1px solid #83a99b!important;color:#f6f3e6;min-width:0}.pq11-district h2,.pq11-district h3{color:#ffe1a2;margin:0 0 8px}.pq11-district p{font-size:13px;line-height:1.6;margin:7px 0}.pq11-district-map{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;padding:6px;background:#142b35;border-radius:12px;margin:10px 0}.pq11-district-cell{box-sizing:border-box;aspect-ratio:1;min-width:0;display:grid;align-content:center;justify-items:center;gap:2px;padding:3px!important;margin:0!important;border-radius:6px;background:#365b4c;color:#fff2cc;font-size:10px;overflow:hidden;line-height:1.1}.pq11-district-cell[data-road=true]{background:#817253}.pq11-district-cell[data-built=true]{background:#635d49;border:1px solid #c3ae77}.pq11-district-cell[data-built=false]{border:1px dashed #a3bdae;background:#365a58}.pq11-district-cell[aria-pressed=true]{outline:2px solid #ffe2a4;outline-offset:1px}.pq11-district-cell span{font-size:clamp(17px,3vw,28px)}.pq11-district-cell small{font-size:9px}.pq11-district-detail{padding:11px;background:#172d3e;border:1px solid #6f9194;border-radius:12px}.pq11-district-actions{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0}.pq11-district-actions button{flex:1 1 100px}.pq11-district button:not(.pq11-district-cell){min-height:44px;margin:0;padding:9px;background:#36535b;border:1px solid #8aa8a2;color:#fff1cb;border-radius:8px;white-space:normal}.pq11-district button[disabled]{opacity:.45}.pq11-district select{box-sizing:border-box;width:100%;padding:9px;background:#112936;color:#fff;border:1px solid #89a8a2;border-radius:8px;margin:8px 0}.pq11-district-status{color:#ffe1a2;min-height:1em}#pq11-district-test{width:min(700px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:14px;border-radius:16px}#pq11-district-test::backdrop{background:#06101bdb}';
  document.head.append(style);
  let selection=PLOTS[0],testSelection=PLOTS[0],moving=null,testMoving=null,chosen='house',testChosen='house',sample=fixture(),message='',testMessage='',pending=false;
  let baseline;
  try{baseline=localStorage.getItem(KEY);}catch{baseline=null;}
  // Only acknowledge a snapshot after this page has written its current state.
  const previousRender=render;
  render=function(){try{const raw=localStorage.getItem(KEY);if(raw===JSON.stringify(s))baseline=raw;}catch{}const result=previousRender.apply(this,arguments);if(panel.classList.contains('active')){paint(root,false);window.PQ110Residents?.refresh?.();}return result;};
  const refresh=()=>{if(panel.classList.contains('active')){paint(root,false);window.PQ110Residents?.refresh?.();}};
  let active=false;new MutationObserver(()=>{const next=panel.classList.contains('active');if(next&&!active)refresh();active=next;}).observe(panel,{attributes:true,attributeFilter:['class']});
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){message='別タブでセーブが更新された場合は再読み込みしてください。';refresh();}});
  async function commit(action){
   if(pending)return {ok:false,message:'別の都市操作を処理中です。'};pending=true;
   const expected=JSON.stringify(s),account=typeof cloud==='object'?cloud.session?.user?.id:null;
   try{
    if(!navigator.locks?.request)throw Error('安全な建設操作に対応したブラウザが必要です。');
    return await navigator.locks.request('pq11-district-save',()=>{
     if(JSON.stringify(s)!==expected||(typeof cloud==='object'?cloud.session?.user?.id:null)!==account)throw Error('操作中にセーブまたはアカウントが変更されました。再確認してください。');
     if(localStorage.getItem(KEY)!==baseline)throw Error('別タブの更新を検出。再読み込みしてください。');
     if(typeof cloud==='object'&&cloud.session&&(!cloud.enabled||cloud.conflict||cloud.busy||cloud.checking))throw Error('クラウド同期が安定してから建設してください。');
     const current=validate(s.town110);if(!current||!window.PQ110Residents?.derive(current))return {ok:false,reason:'invalid'};
     const residentAction=action.kind.startsWith('resident-');const next=residentAction?window.PQ110Residents.transact(current,s.gold,action):transact(current,s.gold,action);if(!next.ok){message=MESSAGES[next.reason]||window.PQ110Residents.messages[next.reason];return next;}
     const oldGold=s.gold,oldDistrict=s.town110,had=Object.hasOwn(s,'town110');
     s.gold=next.gold;s.town110=next.district;
     try{save();}catch(e){
      let persisted=false;try{const data=JSON.parse(localStorage.getItem(KEY));persisted=data.gold===next.gold&&JSON.stringify(data.town110)===JSON.stringify(next.district);}catch{}
      if(!persisted){s.gold=oldGold;if(had)s.town110=oldDistrict;else delete s.town110;throw Error('保存に失敗しました。建設を中止しました。');}
     }
     if(!residentAction)message=action.kind==='move'?'施設を移動しました。':'建設・強化完了：'+next.cost+'G消費';
     if(action.kind==='move'){selection=action.to;moving=null;}return next;
    });
   }catch(e){message=e.message||'操作を中止しました。';return {ok:false,message};}finally{pending=false;refresh();}
  }
  function action(a,test){
   if(!test){commit(a);return;}
   const next=transact(sample.district,sample.gold,a);
   if(next.ok){sample={district:next.district,gold:next.gold};testMessage=a.kind==='move'?'試験移動完了':'試験建設・強化：'+next.cost+'G消費';if(a.kind==='move'){testSelection=a.to;testMoving=null;}}
   else testMessage=MESSAGES[next.reason];
   paint(dialog,true);
  }
  function paint(target,test){
   const raw=test?sample.district:s.town110,gold=test?sample.gold:s.gold,d=validate(raw);
   target.replaceChildren(el('h2',test?'🧪 新区画建設試験':'🏘️ 新市街区'),el('p',test?'仮想ゴールド・仮データのみ使用します。':'新施設を建設・強化・移動できる区画です。旧市街の7施設には影響しません。住宅と職場は住民システムに連動します。資源生産は次のフェーズで追加予定。'));
   if(!d){target.append(el('p',MESSAGES.invalid));if(test)btn(target,'試験終了',()=>dialog.close());return;}
   const selected=test?testSelection:selection,move=test?testMoving:moving;
   target.append(el('p','所持 '+gold+'G　｜　新区画 '+d.buildings.length+'/'+PLOTS.length+'　｜　総Lv '+d.buildings.reduce((n,b)=>n+b.level,0)));
   const grid=el('div','','pq11-district-map');grid.setAttribute('aria-label','新区画配置');target.append(grid);
   for(let i=0;i<SIZE*SIZE;i++){
    const b=d.buildings.find(x=>x.cell===i),t=byType(b?.type);let cell;
    if(PLOTS.includes(i)){cell=btn(grid,'',()=>{if(test)testSelection=i;else selection=i;paint(target,test);});cell.dataset.pq11Plot=String(i);cell.dataset.built=String(!!b);cell.setAttribute('aria-pressed',String(i===selected));cell.setAttribute('aria-label','区画 '+(i+1)+' '+(t?t.name+' Lv.'+b.level:'空き地'));cell.append(el('span',t?.icon||'◇'),el('small',b?'Lv.'+b.level:'空き地'));}
    else{cell=el('div');cell.dataset.road=String(i%6===2||Math.floor(i/6)===3);cell.setAttribute('aria-hidden','true');cell.append(el('span',cell.dataset.road==='true'?'·':'🌲'));grid.append(cell);}
    cell.className='pq11-district-cell';
   }
   const detail=el('div','','pq11-district-detail'),b=d.buildings.find(x=>x.cell===selected),t=byType(b?.type);target.append(detail);
   detail.append(el('h3','区画 '+(selected+1)+(b?'：'+t.name+' Lv.'+b.level:'：空き地')));
   const actions=el('div','','pq11-district-actions');
   if(move!==null){detail.append(el('p','移動元：区画 '+(move+1)+'。空き区画を選択してください。'));btn(actions,'ここへ移動（無料）',()=>action({kind:'move',cell:move,to:selected},test)).disabled=!!b||selected===move||pending;btn(actions,'移動を取消',()=>{if(test)testMoving=null;else moving=null;paint(target,test);});}
   else if(b){detail.append(el('p',t.description));const cost=t.base*(b.level+1);btn(actions,b.level===t.max?'最大レベル':'強化 '+cost+'G',()=>action({kind:'upgrade',cell:selected},test)).disabled=b.level>=t.max||gold<cost||pending;btn(actions,'移動先を選択',()=>{if(test)testMoving=selected;else moving=selected;paint(target,test);});}
   else{const select=el('select');select.setAttribute('aria-label','建設施設');for(const item of TYPES){const opt=el('option',item.icon+' '+item.name+'（'+item.base+'G）');opt.value=item.id;select.append(opt);}select.value=test?testChosen:chosen;select.onchange=()=>{if(test)testChosen=select.value;else chosen=select.value;paint(target,test);};detail.append(select,el('p',byType(select.value).description));const cost=byType(select.value).base;btn(actions,'建設 '+cost+'G',()=>action({kind:'build',cell:selected,type:select.value},test)).disabled=gold<cost||pending;}
   detail.append(actions);const status=el('p',test?testMessage:message,'pq11-district-status');status.setAttribute('role','status');target.append(status);
   const footer=el('div','','pq11-district-actions');target.append(footer);
   if(test){for(const [id,label] of [['basic','試験初期化'],['poor','資金不足'],['max','全施設最大']])btn(footer,label,()=>{sample=fixture(id);testSelection=PLOTS[0];testMoving=null;testChosen='house';testMessage='';paint(dialog,true);});btn(footer,'試験終了',()=>dialog.close());}
   else btn(footer,'🧪 新区画建設試験',()=>{sample=fixture();testSelection=PLOTS[0];testMoving=null;testChosen='house';testMessage='';paint(dialog,true);dialog.showModal();});
  }
  window.PQ110District.commit=commit;paint(root,false);
 }
 window.PQ110District={validate,transact,fixture,commit:null};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
