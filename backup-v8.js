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
  box.append(title,note,btn,status);panel.appendChild(box);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
