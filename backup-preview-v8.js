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
  input.addEventListener('change',async()=>{
   const f=input.files&&input.files[0];if(!f)return;
   output.textContent='比較中…';
   try{
    if(f.size>5*1024*1024)throw Error('5MBを超えるファイルは読み込めません');
    if(typeof s==='undefined')throw Error('現在のセーブを読み込めません');
    const before=JSON.stringify(s),current=clone(s),parsed=JSON.parse(await f.text());
    if(!valid(parsed))throw Error('バックアップ形式または保存日時が不正です');
    const data=parsed.saveData,history=data.outdoorQuest?.completedSessions;
    if(history!==undefined&&!Array.isArray(history))throw Error('バックアップのクリア履歴形式が不正です');
    if(history?.some(x=>!x?.id)||history&&new Set(history.map(x=>String(x.id))).size!==history.length)
     throw Error('バックアップのクリア履歴IDが欠落・重複しています');
    if(JSON.stringify(s)!==before)throw Error('比較中に端末セーブが変更されました。再試行してね');
    const r=compare(current,data);
    output.textContent=(r.identical?'🟢 一致：復元不要':'⚠️ 差分あり：自動復元は禁止')+
     '\nバックアップ日時：'+parsed.createdAt+
     '\n異なるトップレベル項目：'+r.changed+'件'+
     '\n現在の端末だけにあるクリア履歴：'+r.onlyCurrent+'件'+
     '\nバックアップだけにあるクリア履歴：'+r.onlyBackup+'件'+
     '\nEXP：端末 '+r.xpA+'／バックアップ '+r.xpB+
     '\nメダル：端末 '+r.medalA+'／バックアップ '+r.medalB+
     '\n受注中クエストの差：'+(r.activeDifferent?'あり':'なし')+
     '\n※プレビューのみ。端末・クラウドのセーブは変更していません。';
   }catch(e){output.textContent='❌ 比較できません：'+e.message}
   finally{input.value=''}
  });
  wrap.append(heading,note,input,output);panel.appendChild(wrap);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
