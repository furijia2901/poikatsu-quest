'use strict';
/* POIKATSU QUEST v8: manual, read-only local backup export.
   No automatic upload, remote write, or save-state mutation. */
(function(){
 function makeBackup(state, now){
  if(!state || typeof state!=='object' || Array.isArray(state))throw Error('セーブデータが見つかりません');
  const data=JSON.parse(JSON.stringify(state));
  if(!data || typeof data!=='object')throw Error('セーブデータの形式が不正です');
  return {format:'poikatsu-quest-manual-backup',version:1,createdAt:now,saveData:data};
 }
 function validateBackup(b){
  return !!(b && b.format==='poikatsu-quest-manual-backup' && b.version===1 &&
   typeof b.createdAt==='string' && b.saveData && typeof b.saveData==='object' && !Array.isArray(b.saveData));
 }
 function init(){
  const panel=document.getElementById('cloud-panel');
  if(!panel || document.getElementById('pq-v8-backup'))return;
  const box=document.createElement('section');box.id='pq-v8-backup';box.style.marginTop='14px';
  const title=document.createElement('strong');title.textContent='🛡️ 第8弾：手動バックアップ';
  const note=document.createElement('p');note.className='cloud-note';
  note.textContent='端末のセーブをJSONとして保存します。復元・クラウド上書きはしません。ファイルにはゲームの進行情報が含まれるので他人に共有しないでね。';
  const status=document.createElement('p');status.setAttribute('aria-live','polite');status.className='cloud-note';
  const btn=document.createElement('button');btn.type='button';btn.textContent='💾 端末セーブをバックアップ';
  btn.addEventListener('click',function(){
   try{
    if(typeof s==='undefined')throw Error('セーブを読み込めません');
    const now=new Date().toISOString();
    const backup=makeBackup(s,now);
    if(!validateBackup(backup))throw Error('バックアップ検証に失敗しました');
    const json=JSON.stringify(backup,null,2);
    const blob=new Blob([json],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='poikatsu-quest-backup-'+now.slice(0,10)+'.json';
    a.style.display='none';document.body.appendChild(a);
    try{a.click();status.textContent='バックアップのダウンロードを開始しました。保存できたか確認してね。';}
    finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
   }catch(e){status.textContent='⚠️ '+e.message;}
  });
  const inspectTitle=document.createElement('p');inspectTitle.textContent='🔍 バックアップファイルを検査（復元しない）';
  const file=document.createElement('input');file.type='file';file.accept='.json,application/json';
  file.setAttribute('aria-label','検査するバックアップJSONファイル');
  const inspectStatus=document.createElement('pre');inspectStatus.setAttribute('aria-live','polite');
  inspectStatus.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:13px';
  file.addEventListener('change',async function(){
   inspectStatus.textContent='';
   const selected=file.files&&file.files[0];if(!selected)return;
   if(selected.size>5*1024*1024){inspectStatus.textContent='⚠️ 5MBを超えるファイルは検査できません';return;}
   try{
    const parsed=JSON.parse(await selected.text());
    if(!validateBackup(parsed))throw Error('POIKATSU QUESTのバックアップ形式ではありません');
    if(!Number.isFinite(Date.parse(parsed.createdAt)))throw Error('保存日時が不正です');
    const data=parsed.saveData;
    const outdoor=data.outdoorQuest;
    const sessions=outdoor?.completedSessions;
    if(sessions!==undefined&&!Array.isArray(sessions))throw Error('散歩クリア履歴の形式が不正です');
    const duplicate=sessions?new Set(sessions.map(x=>String(x?.id??''))).size!==sessions.length:false;
    const missingId=sessions?sessions.some(x=>!x||!x.id):false;
    const issues=[];
    if(duplicate)issues.push('クリア履歴に重複IDがあります');
    if(missingId)issues.push('クリア履歴にID欠落があります');
    inspectStatus.textContent=(issues.length?'⚠️ 要確認':'🟢 形式チェックPASS')+
     '\\n保存日時：'+parsed.createdAt+
     '\\n散歩クリア履歴：'+(sessions?sessions.length:'データなし')+
     '\\n'+(issues.length?issues.join('\\n'):'基本形式に問題は見つかりませんでした')+
     '\\n※内容の完全性や復元可能性を保証するものではありません。セーブデータは変更していません。';
   }catch(e){inspectStatus.textContent='❌ 検査失敗：'+e.message;}
   finally{file.value='';}
  });
  box.append(title,note,btn,status,inspectTitle,file,inspectStatus);panel.appendChild(box);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
