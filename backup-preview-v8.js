'use strict';
/* POIKATSU QUEST v8: backup comparison preview. Never restores or writes saves. */
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
 function init(){
  const panel=document.getElementById('cloud-panel');
  if(!panel||document.getElementById('pq-backup-preview-v8'))return;
  const wrap=document.createElement('section');wrap.id='pq-backup-preview-v8';wrap.style.marginTop='14px';
  const heading=document.createElement('strong');heading.textContent='🧭 第8弾：バックアップ復旧プレビュー';
  const note=document.createElement('p');note.className='cloud-note';
  note.textContent='JSONファイルと現在の端末セーブを比較するだけ。復元・上書き・クラウド通信はしません。';
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
  input.setAttribute('aria-label','比較するバックアップファイル');
  const output=document.createElement('pre');output.setAttribute('aria-live','polite');
  output.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:13px';
  let prepared=null, generation=0;
  const safety=document.createElement('p');safety.className='cloud-note';safety.setAttribute('aria-live','polite');
  const rescue=document.createElement('button');rescue.type='button';rescue.textContent='復元前の退避用バックアップを保存';rescue.disabled=true;
  rescue.addEventListener('click',()=>{
   try{
    if(!prepared||JSON.stringify(s)!==prepared.snapshot)throw Error('端末データが変化しました。再比較してね');
    const now=new Date().toISOString();
    const blob=new Blob([JSON.stringify({format:'poikatsu-quest-manual-backup',version:1,createdAt:now,saveData:JSON.parse(prepared.snapshot)},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='poikatsu-quest-pre-restore-'+now.replace(/[:.]/g,'-')+'.json';
    document.body.appendChild(a);
    try{a.click();safety.textContent='退避ファイルのダウンロードを開始しました。保存先を確認してね。復元はまだ行いません。';}
    finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
   }catch(e){safety.textContent='⚠️ '+e.message;rescue.disabled=true;prepared=null;}
  });
  input.addEventListener('change',async()=>{
   const run=++generation;prepared=null;rescue.disabled=true;safety.textContent='';
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
    const r=compare(current,data);
    const result=restorePreparation(current,parsed);
    safety.textContent=result.issues.length?'復元準備：要確認 — '+result.issues.join('／'):result.identical?'復元準備：一致のため不要':'復元準備：基本チェック通過。完全な復元可能性は未保証です。';
    if(!result.issues.length&&!result.identical){prepared=result;rescue.disabled=false;}
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
  wrap.append(heading,note,input,output,safety,rescue);panel.appendChild(wrap);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
