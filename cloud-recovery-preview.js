'use strict';
/* POIKATSU QUEST: read-only cloud recovery comparison v7.
   Does not modify save state, storage or remote data. */
(function(){
 const clone=x=>JSON.parse(JSON.stringify(x));
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const ids=o=>new Set((Array.isArray(o?.completedSessions)?o.completedSessions:[]).map(x=>String(x?.id??'')).filter(Boolean));
 function compare(local,remote){
  const l=local?.outdoorQuest,r=remote?.outdoorQuest;
  const li=ids(l),ri=ids(r);
  const localOnly=[...li].filter(x=>!ri.has(x)),remoteOnly=[...ri].filter(x=>!li.has(x));
  const risks=[];
  if(!l||!r)risks.push('散歩データが片方に存在しません');
  if(localOnly.length)risks.push('端末だけのクリア履歴 '+localOnly.length+'件');
  if(remoteOnly.length)risks.push('クラウドだけのクリア履歴 '+remoteOnly.length+'件');
  for(const [key,name] of [['outdoorXp','EXP'],['outdoorMedals','メダル']]){
   if(num(l?.[key])!==num(r?.[key]))risks.push(name+'差分：端末 '+num(l?.[key])+'／クラウド '+num(r?.[key]));
  }
  const la=l?.activeSession,ra=r?.activeSession;
  if((la?.id??null)!==(ra?.id??null))risks.push('受注中クエストが異なります');
  else if(la&&ra&&num(la.progress)!==num(ra.progress))risks.push('進捗が異なります');
  const allFields=new Set([...Object.keys(local||{}),...Object.keys(remote||{})]);
  const other=[...allFields].filter(k=>k!=='outdoorQuest'&&JSON.stringify(local?.[k])!==JSON.stringify(remote?.[k]));
  if(other.length)risks.push('通常セーブにも差分 '+other.length+'項目');
  const same=JSON.stringify(local)===JSON.stringify(remote);
  return {risks,localOnly:localOnly.length,remoteOnly:remoteOnly.length,otherCount:other.length,
    protectedCount:new Set([...li,...ri]).size,
    result:same?'PASS':risks.length?'WARNING':'WARNING',
    recommendation:same?'両方一致。復旧操作は不要です。':'自動統合せず、両方のJSONバックアップを取って差分を確認してください。EXP・メダルは単純加算しないでください。'};
 }
 async function run(){
  const el=document.getElementById('pq-recovery-preview-result');if(!el)return;
  el.textContent='🔎 端末とクラウドを読み取り中…';
  try{
   if(typeof cloud==='undefined'||!cloud.session)throw Error('クラウドにログインしてから実行してね');
   if(cloud.busy||cloud.checking)throw Error('同期処理が終わってから再実行してね');
   const before=JSON.stringify(s), local=clone(s), row=await cloudRemote();
   if(!row?.save_data)throw Error('クラウドに比較できるセーブがありません');
   const result=compare(local,clone(row.save_data));
   if(JSON.stringify(s)!==before)throw Error('確認中に端末データが変わりました。再実行してください');
   el.textContent='判定：'+result.result+'\n競合・差分：'+result.risks.length+'項目\n保護対象のユニークなクリア履歴：'+result.protectedCount+'件\n端末のみ：'+result.localOnly+'件／クラウドのみ：'+result.remoteOnly+'件\n通常セーブの差分：'+result.otherCount+'項目\n'+(result.risks.length?result.risks.join('\n')+'\n':'')+result.recommendation+'\n※読み取り専用。実データ・クラウドへの書き込みなし。';
  }catch(e){el.textContent='⚠️ '+e.message}
 }
 function init(){
  const panel=document.getElementById('cloud-panel');if(!panel||document.getElementById('pq-recovery-preview-result'))return;
  const box=document.createElement('div');box.style.marginTop='12px';
  const title=document.createElement('strong');title.textContent='🧪 第7弾：競合・復旧プレビュー';
  const desc=document.createElement('p');desc.className='cloud-note';desc.textContent='端末とクラウドの差分を読み取り専用で比較します。復元・統合・上書きは実行しません。';
  const btn=document.createElement('button');btn.type='button';btn.textContent='🔎 競合・復旧を診断';btn.addEventListener('click',run);
  const result=document.createElement('pre');result.id='pq-recovery-preview-result';result.setAttribute('aria-live','polite');result.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:13px';
  box.append(title,desc,btn,result);panel.appendChild(box);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();