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
  const stable=x=>{if(Array.isArray(x))return x.map(stable);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])]));return x};
  const same=JSON.stringify(stable(local))===JSON.stringify(stable(remote));
  return {risks,localOnly:localOnly.length,remoteOnly:remoteOnly.length,otherCount:other.length,
    protectedCount:new Set([...li,...ri]).size,
    result:same?'PASS':(!l||!r||localOnly.length||remoteOnly.length)?'FAIL':'WARNING',
    recommendation:same?'両方一致。復旧操作は不要です。':'自動統合せず、両方のJSONバックアップを取って差分を確認してください。EXP・メダルは単純加算しないでください。'};
 }
 function selfTest(){
  const el=document.getElementById('pq-recovery-preview-result');if(!el)return;
  const base={level:2,quest:{id:'q'},outdoorQuest:{completedSessions:[{id:'a'}],outdoorXp:10,outdoorMedals:2,activeSession:null}};
  const copy=()=>clone(base);
  const scenarios=[
   ['一致',copy(),copy(),'PASS'],
   ['キー順序のみ異なる',{quest:{id:'q'},outdoorQuest:clone(base.outdoorQuest),level:2},copy(),'PASS'],
   ['端末側に履歴が追加',(()=>{const x=copy();x.outdoorQuest.completedSessions.push({id:'b'});return x})(),copy(),'FAIL'],
   ['クラウド側に履歴が追加',copy(),(()=>{const x=copy();x.outdoorQuest.completedSessions.push({id:'b'});return x})(),'FAIL'],
   ['EXP差分',copy(),(()=>{const x=copy();x.outdoorQuest.outdoorXp+=20;return x})(),'WARNING'],
   ['通常セーブ差分',copy(),(()=>{const x=copy();x.level=3;return x})(),'WARNING'],
   ['散歩データ欠落',copy(),(()=>{const x=copy();delete x.outdoorQuest;return x})(),'FAIL']
  ];
  const results=scenarios.map(([name,l,r,expected])=>({name,expected,actual:compare(l,r).result}));
  const failures=results.filter(x=>x.actual!==x.expected);
  el.textContent=(failures.length?'🔴 FAIL':'🟢 PASS')+'：模擬診断 '+(results.length-failures.length)+'/'+results.length+' 件成功\\n'+results.map(x=>(x.actual===x.expected?'✓ ':'✗ ')+x.name+'：'+x.actual).join('\\n')+'\\n※模擬データのみ。端末・クラウドの保存内容は変更していません。';
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
  const test=document.createElement('button');test.type='button';test.textContent='🧪 模擬データで7件テスト';test.addEventListener('click',selfTest);
  box.append(title,desc,test,btn,result);panel.appendChild(box);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();