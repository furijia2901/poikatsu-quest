'use strict';
/* POIKATSU QUEST v8: backup comparison preview. Read-only diagnostics and isolated staging; no live restore. */
(function(){
 const clone=x=>JSON.parse(JSON.stringify(x));
 const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
 const equal=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
 const ids=x=>new Set((Array.isArray(x?.completedSessions)?x.completedSessions:[]).map(v=>String(v?.id??'')).filter(Boolean));
 function compare(current,backup){
  const a=current?.outdoorQuest,b=backup?.outdoorQuest,ai=ids(a),bi=ids(b);
  const onlyCurrent=[...ai].filter(id=>!bi.has(id)).length;
  const onlyBackup=[...bi].filter(id=>!ai.has(id)).length;
  const fields=new Set([...Object.keys(current||{}),...Object.keys(backup||{})]);
  const changed=[...fields].filter(k=>!equal(current?.[k],backup?.[k]));
  const xpA=Number(a?.outdoorXp??0),xpB=Number(b?.outdoorXp??0);
  const medalA=Number(a?.outdoorMedals??0),medalB=Number(b?.outdoorMedals??0);
  const identical=equal(current,backup);
  return {identical,onlyCurrent,onlyBackup,changed:changed.length,xpA,xpB,medalA,medalB,
   activeDifferent:!equal(a?.activeSession??null,b?.activeSession??null)};
 }
 function valid(x){return x&&x.format==='poikatsu-quest-manual-backup'&&x.version===1&&
  typeof x.createdAt==='string'&&Number.isFinite(Date.parse(x.createdAt))&&
  x.saveData&&typeof x.saveData==='object'&&!Array.isArray(x.saveData)}

 function preflight(current,backup){
  const issues=[];
  if(!valid(backup))return ['バックアップ形式不正'];
  const data=backup.saveData;
  for(const k of ['level','xp','gold','energy','completed']){
   if(!Number.isSafeInteger(data[k])||data[k]<0||(k==='level'&&data[k]<1))issues.push(k+' の値が不正');
  }
  for(const k of ['log','inventory','kills','bosses','achievements','storySeen']){
   if(!Array.isArray(data[k]))issues.push(k+' の形式不正');
  }
  function shape(a,b,path,depth){
   if(depth>40){issues.push('階層が深すぎます');return;}
   if(b===null){if(a!==null&&typeof a!=='object')issues.push(path+' が null');return;}
   if(a!==null&&typeof a!==typeof b){issues.push(path+' の型不一致');return;}
   if(typeof b==='number'&&!Number.isFinite(b))issues.push(path+' の数値不正');
   if(b&&typeof b==='object'){
    if(a!==null&&Array.isArray(a)!==Array.isArray(b)){issues.push(path+' の配列形式不正');return;}
    for(const k of Object.keys(b)){
     if(['__proto__','constructor','prototype'].includes(k)){issues.push(path+' に禁止キー');continue;}
     if(issues.length>=30)return;
     if(!Array.isArray(b)&&a&&Object.hasOwn(a,k))shape(a[k],b[k],path+'.'+k,depth+1);
     else shape(null,b[k],path+'.'+k,depth+1);
    }
   }
  }
  shape(current,data,'save',0);
  if(Array.isArray(data.log)&&data.log.some(x=>typeof x!=='string'))issues.push('ログ形式不正');
  if(typeof data.classId!=='string'||!Object.hasOwn(classes,data.classId))issues.push('職業ID不正');
  if(!Number.isInteger(data.area)||data.area<0||data.area>=areas.length)issues.push('エリア不正');
  for(const k of ['hp','maxHp','attack','stage','enemyHp','enemyMax','rerolls']){
   if(!Number.isFinite(data[k])||data[k]<0)issues.push(k+' の値不正');
  }
  const missing=Object.keys(current).filter(k=>!Object.hasOwn(data,k));
  if(missing.length)issues.push('現在のセーブ項目が '+missing.length+' 件欠落');
  for(const k of ['questHistory','outdoorQuest.completedSessions']){
   const rows=k==='questHistory'?data.questHistory:data.outdoorQuest?.completedSessions;
   if(rows!==undefined&&(!Array.isArray(rows)||rows.some(x=>!x?.id)||new Set(rows.map(x=>String(x.id))).size!==rows.length))issues.push(k+' の履歴ID不正');
  }
  return issues;
 }
 function restorePreparation(current,backup){
  const issues=preflight(current,backup);
  return {issues,identical:equal(current,backup.saveData),snapshot:JSON.stringify(current)};
 }

 // Storage transaction with verified rescue copy.
 function restoreTransaction(store,expected,candidate){
  const original=store.read();
  if(original!==expected)throw Error('比較後にデータが変更されました');
  const next=JSON.stringify(candidate);
  if(typeof next!=='string')throw Error('復元データが不正です');
  if(next===original)return 'unchanged';
  store.reserve(original);
  if(store.readReserved()!==original)throw Error('退避確認失敗');
  if(store.read()!==original)throw Error('退避中にデータが変更されました');
  try{
   store.write(next);
   if(store.read()!==next)throw Error('復元後の照合失敗');
   return 'restored';
  }catch(e){
   try{store.write(original);if(store.read()!==original)throw Error('照合失敗');}
   catch(rollback){throw Error('ロールバック失敗：退避データを保持してください');}
   throw Error('復元中止・元データに戻しました：'+e.message);
  }
 }
 function runRestoreTests(){
  const original=JSON.stringify({level:2,gold:20}),target={level:1,gold:0};
  function memory(mode){
   let data=original,reserved=null, writes=0;
   return {read:()=>data,readReserved:()=>reserved,reserve:v=>{if(mode==='reserve')throw Error('容量不足');reserved=v;if(mode==='race')data='newer';},
    write:v=>{writes++;if(mode==='rollback'&&writes>1)throw Error('書き戻し失敗');data=(mode==='verify'||mode==='rollback')&&writes===1?'broken':v;},count:()=>writes};
  }
  const cases=[
   ['正常復元',()=>{const m=memory();return restoreTransaction(m,original,target)==='restored'&&m.read()===JSON.stringify(target)&&m.readReserved()===original;}],
   ['一致時は書き込みなし',()=>{const m=memory();return restoreTransaction(m,original,JSON.parse(original))==='unchanged'&&m.count()===0;}],
   ['比較後の変更',()=>{const m=memory();try{restoreTransaction(m,'stale',target);}catch(e){return m.count()===0&&m.read()===original;}return false;}],
   ['退避失敗',()=>{const m=memory('reserve');try{restoreTransaction(m,original,target);}catch(e){return m.count()===0&&m.read()===original;}return false;}],
   ['退避中の競合',()=>{const m=memory('race');try{restoreTransaction(m,original,target);}catch(e){return m.count()===0&&m.read()==='newer';}return false;}],
   ['照合失敗・ロールバック',()=>{const m=memory('verify');try{restoreTransaction(m,original,target);}catch(e){return m.read()===original&&m.readReserved()===original;}return false;}],
   ['ロールバック失敗時の退避保持',()=>{const m=memory('rollback');try{restoreTransaction(m,original,target);}catch(e){return e.message.includes('ロールバック失敗')&&m.readReserved()===original;}return false;}]
  ];
  return cases.map(([name,test])=>{try{return {name,pass:test()===true};}catch(e){return {name,pass:false};}});
 }
 function init(){
  const panel=document.getElementById('cloud-panel');
  if(!panel||document.getElementById('pq-backup-preview-v8'))return;
  const wrap=document.createElement('section');wrap.id='pq-backup-preview-v8';wrap.style.marginTop='14px';
  const heading=document.createElement('strong');heading.textContent='🧭 第8弾：バックアップ復旧プレビュー';
  const note=document.createElement('p');note.className='cloud-note';
  note.textContent='比較と隔離検証のみ利用できます。実際のセーブやクラウドには書き込みません。';
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
  input.setAttribute('aria-label','比較するバックアップファイル');
  const output=document.createElement('pre');output.setAttribute('aria-live','polite');
  output.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:13px';
  let prepared=null, generation=0, staged=false, exported=false;
  const safety=document.createElement('p');safety.className='cloud-note';safety.setAttribute('aria-live','polite');
  const refreshApply=()=>{};
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){generation++;prepared=null;staged=false;exported=false;rescue.disabled=true;stage.disabled=true;safety.textContent='別タブでセーブが変更されました。再読み込みしてね。';}});
  const stage=document.createElement('button');stage.type='button';stage.textContent='復元候補を端末内の隔離領域で検証';stage.disabled=true;
  stage.addEventListener('click',()=>{
   let stageKey,reserveKey,stageOwned=false,reserveOwned=false;staged=false;refreshApply();
   try{
    if(!prepared||JSON.stringify(s)!==prepared.snapshot)throw Error('端末データが変化しました。再比較してね');
    if(typeof cloud==='undefined'||cloud.busy||cloud.checking)throw Error('同期処理中は検証できません');
    const before=localStorage.getItem(KEY);
    if(!before||!equal(JSON.parse(before),JSON.parse(prepared.snapshot)))throw Error('端末の保存内容が一致しません');
    const id=crypto.randomUUID();
    stageKey='pq-restore-stage-'+id;reserveKey='pq-restore-reserve-'+id;
    if(localStorage.getItem(stageKey)!==null||localStorage.getItem(reserveKey)!==null)throw Error('隔離領域の衝突');
    localStorage.setItem(stageKey,before);stageOwned=true;
    const store={read:()=>localStorage.getItem(stageKey),reserve:v=>{localStorage.setItem(reserveKey,v);reserveOwned=true;},readReserved:()=>localStorage.getItem(reserveKey),write:v=>localStorage.setItem(stageKey,v)};
    const result=restoreTransaction(store,before,prepared.candidate);
    if(localStorage.getItem(KEY)!==before||JSON.stringify(s)!==prepared.snapshot)throw Error('検証中に実セーブが変化しました');
    staged=true;refreshApply();safety.textContent='🟢 隔離復元検証PASS：'+result+'。実セーブとクラウドは変更していません。';
   }catch(e){safety.textContent='⚠️ 隔離復元検証中止：'+e.message;}
   finally{
    try{if(stageOwned)localStorage.removeItem(stageKey);if(reserveOwned)localStorage.removeItem(reserveKey);}
    catch(e){staged=false;refreshApply();safety.textContent+='／隔離領域の削除に失敗しました。';}
   }
  });
  const rescue=document.createElement('button');rescue.type='button';rescue.textContent='復元前の退避用バックアップを保存';rescue.disabled=true;
  rescue.addEventListener('click',()=>{
   try{
    if(!prepared||JSON.stringify(s)!==prepared.snapshot)throw Error('端末データが変化しました。再比較してね');
    const now=new Date().toISOString();
    const blob=new Blob([JSON.stringify({format:'poikatsu-quest-manual-backup',version:1,createdAt:now,saveData:JSON.parse(prepared.snapshot)},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='poikatsu-quest-pre-restore-'+now.replace(/[:.]/g,'-')+'.json';
    document.body.appendChild(a);
    try{a.click();exported=true;refreshApply();safety.textContent='退避ファイルのダウンロードを開始しました。保存先を確認してね。復元はまだ行いません。';}
    finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
   }catch(e){safety.textContent='⚠️ '+e.message;rescue.disabled=true;stage.disabled=true;prepared=null;refreshApply();}
  });
  input.addEventListener('change',async()=>{
   const run=++generation;prepared=null;staged=false;exported=false;refreshApply();rescue.disabled=true;stage.disabled=true;safety.textContent='';
   const f=input.files&&input.files[0];if(!f)return;
   output.textContent='比較中…';
   try{
    if(f.size>5*1024*1024)throw Error('5MBを超えるファイルは読み込めません');
    if(typeof s==='undefined')throw Error('現在のセーブを読み込めません');
    const before=JSON.stringify(s),current=clone(s),parsed=JSON.parse(await f.text());
    if(!valid(parsed))throw Error('バックアップ形式または保存日時が不正です');
    if(run!==generation)return;
    const data=parsed.saveData,history=data.outdoorQuest?.completedSessions;
    if(history!==undefined&&!Array.isArray(history))throw Error('バックアップのクリア履歴形式が不正です');
    if(history?.some(x=>!x?.id)||history&&new Set(history.map(x=>String(x.id))).size!==history.length)
     throw Error('バックアップのクリア履歴IDが欠落・重複しています');
    if(JSON.stringify(s)!==before)throw Error('比較中に端末セーブが変更されました。再試行してね');
    const result=restorePreparation(current,parsed);
    if(result.issues.length){safety.textContent='復元準備：要確認 — '+result.issues.join('／');output.textContent='不正または未対応のデータです。セーブは変更していません。';return;}
    const r=compare(current,data);
    safety.textContent=result.issues.length?'復元準備：要確認 — '+result.issues.join('／'):result.identical?'復元準備：一致のため不要':'復元準備：基本チェック通過。完全な復元可能性は未保証です。';
    if(!result.issues.length&&!result.identical){prepared={...result,candidate:clone(data)};rescue.disabled=false;stage.disabled=false;}
    output.textContent=(r.identical?'🟢 一致：復元不要':'⚠️ 差分あり：自動復元は禁止')+
     '\nバックアップ日時：'+parsed.createdAt+
     '\n異なるトップレベル項目：'+r.changed+'件'+
     '\n現在の端末だけにあるクリア履歴：'+r.onlyCurrent+'件'+
     '\nバックアップだけにあるクリア履歴：'+r.onlyBackup+'件'+
     '\nEXP：端末 '+r.xpA+'／バックアップ '+r.xpB+
     '\nメダル：端末 '+r.medalA+'／バックアップ '+r.medalB+
     '\n受注中クエストの差：'+(r.activeDifferent?'あり':'なし')+
     '\n※プレビューのみ。端末・クラウドのセーブは変更していません。';
   }catch(e){if(run===generation)output.textContent='❌ 比較できません：'+e.message}
   finally{if(run===generation)input.value=''}
  });
  const test=document.createElement('button');test.type='button';test.textContent='🧪 第8.2弾：復元シミュレーション';
  const report=document.createElement('pre');report.setAttribute('aria-live','polite');report.style.whiteSpace='pre-wrap';
  test.addEventListener('click',()=>{
   const results=runRestoreTests(),passed=results.filter(x=>x.pass).length;
   report.textContent=passed+'/'+results.length+' PASS\n'+results.map(x=>(x.pass?'✅ ':'❌ ')+x.name).join('\n')+'\n※メモリ上の架空データのみ。実際のセーブ・クラウドは変更していません。';
  });
  wrap.append(heading,note,input,output,safety,rescue,stage,test,report);panel.appendChild(wrap);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
