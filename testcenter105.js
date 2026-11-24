/* Ver.10.5 test center — session-only checklist and direct links to isolated fixtures. */
(function(){
 'use strict';
 const CHECKS=Object.freeze([
  ['title','タイトル・起動','タイトルロゴ、開始、更新情報、設定への移動を確認。受取操作は行わない。'],
  ['home','星灯のロビー','ステータスとおすすめ3種、12個の入口を確認。'],
  ['menu','総合メニュー','検索、カテゴリー、最近使った画面、戻る・ホームを確認。'],
  ['profile','プロフィール','試験名・アイコン・称号・テーマを変更し、試験保存と初期化。'],
  ['collection','コレクション','持ち物8・ガチャ11・図鑑5の切替、検索、試験移動と初期化。'],
  ['news','お知らせ','カテゴリー・既読・全既読を確認。既読は起動中のみ。'],
  ['gifts','プレゼント','試験100G受取→一括受取で140G、再受取不可、初期化で0G。'],
  ['audio','サウンド・演出','3種BGM・操作音・報酬音、音量、停止、試験保存。'],
  ['expedition','遠征','既存の遠征専用試験で育成・戦闘・召喚・図鑑などを確認。'],
  ['safety','データ保護','試験終了後のゴールド・エネルギー・所持品・プロフィール・設定を比較。']
 ].map(Object.freeze));
 function setResult(state,id,value){if(!CHECKS.some(c=>c[0]===id)||!['pass','fail','pending'].includes(value))return {...state};return {...state,[id]:value};}
 function tally(state){return CHECKS.reduce((a,[id])=>{const v=state[id];a[v==='pass'?'pass':v==='fail'?'fail':'pending']++;return a;},{pass:0,fail:0,pending:0});}
 function report(state){return ['Ver.10.5 実機テスト結果',...CHECKS.map(([id,name],i)=>(i+1)+'. '+name+'：'+({pass:'PASS',fail:'FAIL',pending:'未確認'}[state[id]]||'未確認'))].join('\n');}
 if(typeof module==='object'&&module.exports){module.exports={CHECKS,setResult,tally,report};return;}
 const el=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 function btn(parent,label,fn){const b=el('button',label);b.type='button';b.onclick=fn;parent.append(b);return b;}
 function mount(nav,openTitle){
  const home=document.getElementById('pq105-home');if(!home||document.getElementById('pq105-tests'))return;
  const style=el('style');style.textContent='#pq105-tests{box-sizing:border-box;width:min(780px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:16px;background:#172139;color:#f5efff;border:1px solid #b29bd5;border-radius:17px}#pq105-tests::backdrop{background:#050b1bde}#pq105-tests h2{margin:0;color:#ffe5b0;font-size:22px}#pq105-tests p{font-size:13px;line-height:1.6}#pq105-tests button{min-height:44px;margin:0;padding:8px;background:#2c3955;color:#f5efff;border:1px solid #7985a5;border-radius:9px;white-space:normal;overflow-wrap:anywhere}#pq105-tests button[aria-pressed=true]{background:#554569;border-color:#e5c78d;color:#ffe4a8}.pq105-test-card{display:grid;gap:7px;margin:9px 0;padding:12px;background:#24314c;border:1px solid #657696;border-radius:11px}.pq105-test-card h3{font-size:15px;margin:0;color:#f1dbff}.pq105-test-card p{margin:0}.pq105-test-actions{display:flex;flex-wrap:wrap;gap:6px}.pq105-test-actions button{flex:1 1 80px}.pq105-test-entry{min-height:44px;width:100%;background:#373652;border:1px solid #b29bd5;color:#ffe7b5;margin:0}.pq105-test-summary{color:#ffe3aa;font-weight:700}#pq105-tests textarea{box-sizing:border-box;width:100%;min-height:150px;background:#10192d;color:#f3efff;border:1px solid #7e89a7;border-radius:8px;padding:9px}';
  document.head.append(style);
  const dialog=el('dialog');dialog.id='pq105-tests';dialog.setAttribute('aria-label','テストセンター');document.body.append(dialog);
  let state={},opener=null;
  function go(id){nav.querySelector('button[data-tab="'+id+'"]')?.click();}
  const launchers={
   title:()=>openTitle(),home:()=>go('home'),menu:()=>document.querySelector('#pq105-toolbar .pq105-menu-launch')?.click(),
   profile:()=>window.PQ105Profile?.open?.(true),collection:()=>window.PQ105Collection?.open?.('inventory',true),
   news:()=>window.PQ105Inbox?.open?.('news',false),gifts:()=>window.PQ105Inbox?.open?.('gifts',true),audio:()=>window.PQ105Audio?.open?.(true),
   expedition:()=>{go('expedition90');document.getElementById('pq10-test-open')?.click();}
  };
  function open(){if(dialog.open)return;opener=document.activeElement;render();dialog.showModal();}
  function render(){
   dialog.replaceChildren(el('h2','🧪 テストセンター'),el('p','試験は実際のゲーム内報酬・ガチャを消費しません。タイトル・ロビー・メニュー・お知らせは通常の画面移動だけを確認します。判定はこの起動中だけ保持します。'));
   const counts=tally(state);dialog.append(el('p','PASS '+counts.pass+' / '+CHECKS.length+'　FAIL '+counts.fail+'　未確認 '+counts.pending,'pq105-test-summary'));
   const top=el('div','','pq105-test-actions');dialog.append(top);
   btn(top,'閉じる',()=>dialog.close());btn(top,'判定を初期化',()=>{state={};render();});
   for(const [id,name,detail] of CHECKS){
    const card=el('article','','pq105-test-card');card.dataset.pq105Check=id;card.append(el('h3',name),el('p',detail));const actions=el('div','','pq105-test-actions');card.append(actions);
    if(launchers[id])btn(actions,'確認画面へ',()=>{dialog.close();launchers[id]();});
    for(const [v,label] of [['pass','PASS'],['fail','FAIL'],['pending','未確認']]){const b=btn(actions,label,()=>{state=setResult(state,id,v);render();dialog.querySelector('[data-pq105-check="'+id+'"] button[aria-pressed=true]')?.focus();});b.setAttribute('aria-pressed',String((state[id]||'pending')===v));}
    dialog.append(card);
   }
   const result=el('textarea');result.readOnly=true;result.value=report(state);result.setAttribute('aria-label','実機テスト結果');dialog.append(result);
   const actions=el('div','','pq105-test-actions');dialog.append(actions);
   btn(actions,'結果を選択',()=>{result.focus();result.select();});
   btn(actions,'閉じる',()=>dialog.close());
  }
  dialog.addEventListener('close',()=>{if(opener?.isConnected&&opener.offsetParent!==null&&!document.querySelector('dialog[open]'))opener.focus();});
  const entry=btn(home,'🧪 テストセンター',open);entry.className='pq105-test-entry';
  const settings=document.querySelector('#settings92 [data-pq92-settings-page="2"]');if(settings){const b=btn(settings,'🧪 総合テストセンター',open);b.className='pq105-test-entry';}
  window.PQ105Tests.open=open;
 }
 window.PQ105Tests={mount,open:null};
})();
