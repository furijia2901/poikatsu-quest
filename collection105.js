/* Ver.10.5 collection center: original data and spending controls remain in their native screens. */
(function(){
 'use strict';
 // id, type, label, panel, original subview selector, existing read-only source
 const ROUTES=Object.freeze([
 ['equipment','inventory','冒険者装備','home','[data-pq92-home-view="equipment"]','equipmentList'],
 ['companions','inventory','仲間・秘宝','craft','[data-pq92-screen-choice="1"]','companions'],
 ['relics','inventory','秘宝セット','craft','[data-pq92-screen-choice="1"]','relicInventory'],
 ['star-gear','inventory','仲間専用装備','update16','[data-pq92-screen-choice="1"]',null],
 ['festival-items','inventory','祭典限定収集品','event31','[data-pq92-screen-choice="2"]','ev31-collection'],
 ['grand-items','inventory','星巡りコレクション','grand50','[data-pq92-screen-choice="1"]','v50collection'],
 ['crystals','inventory','天空の結晶','update19','[data-pq92-screen-choice="2"]','crystalCollection19'],
 ['expedition-items','inventory','遠征の装備・星晶石','expedition90','[data-pq9-view="shop"]',null],
 ['equipment-gacha','gacha','装備ガチャ','home','[data-pq92-home-view="equipment"]',null],
 ['companion-gacha','gacha','仲間召喚','craft','[data-pq92-screen-choice="1"]',null],
 ['grand-gacha','gacha','星巡りガチャ','grand50','[data-pq92-screen-choice="1"]',null],
 ['season-gacha','gacha','星詠み限定召喚','season13','[data-pq92-screen-choice="2"]',null],
 ['ur-gacha','gacha','星界UR召喚','update15','[data-pq92-screen-choice="1"]',null],
 ['gear-gacha','gacha','星界召喚演出','update16','[data-pq92-screen-choice="2"]',null],
 ['crystal-gacha','gacha','天空の結晶ガチャ','update19','[data-pq92-screen-choice="2"]',null],
 ['arena-gacha','gacha','星界召喚ステージ','update20','[data-pq92-screen-choice="1"]',null],
 ['festival-gacha','gacha','星祭限定ガチャ','event31','[data-pq92-screen-choice="0"]',null],
 ['boundary-gacha','gacha','境界召喚','event40','[data-pq92-screen-choice="2"]',null],
 ['expedition-gacha','gacha','星界遠征限定召喚','expedition90','[data-pq9-view="gacha"]',null],
 ['star-codex','codex','星装図鑑','update17','[data-pq92-screen-choice="2"]','codex17'],
 ['festival-codex','codex','星祭探索図鑑','event32','[data-pq92-screen-choice="1"]','ev34-codex'],
 ['boundary-codex','codex','境界装備図鑑','event40','[data-pq92-screen-choice="1"]','v46-codex-grid'],
 ['expedition-codex','codex','星巡り遠征図鑑','expedition90','[data-pq9-view="codex"]',null],
 ['festival-collection','codex','祭典限定コレクション','event31','[data-pq92-screen-choice="2"]','ev31-collection']
 ].map(Object.freeze));
 const TYPES=Object.freeze([['inventory','🎒 持ち物'],['gacha','🌠 ガチャ'],['codex','📖 図鑑']]);
 const SAMPLE=Object.freeze({equipment:['SSR 試験星剣 +12','SR 試験月盾 +8'],companions:['UR 試験の仲間'],relics:['試験秘宝（所持）'],'star-codex':['試験図鑑：発見済み 2種類'],'festival-codex':['🔒 未発見','✅ 試験の星砂']});
 function selectRoutes(type,query=''){const q=String(query).normalize('NFKC').trim().toLowerCase();return ROUTES.filter(r=>r[1]===type&&(!q||[r[2],r[0]].join(' ').normalize('NFKC').toLowerCase().includes(q)));}
 function summaryRows(lines){return Array.from(lines||[]).map(x=>String(x).trim().replace(/\s+/g,' ')).filter(Boolean).slice(0,12).map(x=>x.slice(0,180));}
 if(typeof module==='object'&&module.exports){module.exports={ROUTES,TYPES,SAMPLE,selectRoutes,summaryRows};return;}
 const el=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 function btn(parent,label,action){const b=el('button',label);b.type='button';b.onclick=action;parent.append(b);return b;}
 function mount(nav){
  const lobby=document.getElementById('pq105-home');if(!lobby||document.getElementById('pq105-collection'))return;
  const style=el('style');style.textContent='#pq105-collection{box-sizing:border-box;width:min(800px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;background:#172139;color:#f5f0ff;border:1px solid #ae96d3;border-radius:18px;padding:16px}#pq105-collection::backdrop{background:#050b1bdc}#pq105-collection h2{margin:0;color:#ffe6ad;font-size:22px}#pq105-collection p{font-size:13px;line-height:1.6}#pq105-collection button{min-height:44px;margin:0;padding:9px;background:#2b3855;border:1px solid #7b89a8;border-radius:9px;color:#f6f2ff;white-space:normal;overflow-wrap:anywhere}#pq105-collection button[aria-pressed=true]{background:#58466e;border-color:#efd299;color:#ffe6ab}#pq105-collection input{box-sizing:border-box;width:100%;min-height:44px;margin:10px 0;padding:10px;border:1px solid #9d88c5;border-radius:9px;background:#111b31;color:#fff}.pq105-collection-tabs,.pq105-collection-launch{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pq105-collection-launch button{margin:0;font-size:12px;background:#37354f;border:1px solid #b09acb;color:#ffe8bb}.pq105-collection-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pq105-collection-card{min-width:0;border:1px solid #627599;background:#212e49;border-radius:12px;padding:12px;display:grid;align-content:start;gap:8px}.pq105-collection-card h3{margin:0;font-size:15px;color:#e9d7ff;overflow-wrap:anywhere}.pq105-collection-card ul{padding-left:18px;margin:0;font-size:12px;overflow-wrap:anywhere}.pq105-collection-card button{align-self:end}.pq105-collection-note{color:#c4d0e7}.pq105-collection-status{min-height:1em;color:#ffe4ac}@media(max-width:520px){.pq105-collection-grid{grid-template-columns:1fr}#pq105-collection{padding:12px}}';
  document.head.append(style);
  const launch=el('section','','pq105-collection-launch');launch.setAttribute('aria-label','コレクションセンター');
  for(const [id,label] of TYPES)btn(launch,label,()=>open(id,false)).dataset.pq105CollectionOpen=id;
  lobby.querySelector('.pq105-home-tools')?.before(launch);
  const dialog=el('dialog');dialog.id='pq105-collection';dialog.setAttribute('aria-label','コレクションセンター');document.body.append(dialog);
  let type='inventory',testing=false,query='',opener=null;
  function sourceRows(id){
   if(!id)return [];
   const source=document.getElementById(id);if(!source)return [];
   // Text projection only: do not copy buttons, IDs, handlers or HTML.
   const children=[...source.children];return summaryRows(children.length?children.map(n=>n.querySelector('span')?.textContent||n.textContent):[source.textContent]);
  }
  function open(id,mode){if(dialog.open)return;opener=document.activeElement;type=id;testing=mode;query='';render();dialog.showModal();}
  function render(){
   dialog.replaceChildren(el('h2',testing?'🧪 コレクションセンター試験':'コレクションセンター'));
   dialog.append(el('p',testing?'仮データで一覧・検索・画面切替を試します。移動ボタンは行き先の確認のみで、本番のガチャを実行しません。':'現在の所持品・図鑑の概要を確認できます。詳細・装備変更・召喚は従来の専用画面で行います。通貨・天井・報酬条件はそれぞれ独立しています。'));
   const tabs=el('div','','pq105-collection-tabs');dialog.append(tabs);
   for(const [id,label] of TYPES){const b=btn(tabs,label,()=>{type=id;query='';render();});b.dataset.pq105CollectionTab=id;b.setAttribute('aria-pressed',String(id===type));}
   const search=el('input');search.type='search';search.placeholder='コレクション名で検索';search.value=query;search.setAttribute('aria-label','コレクション検索');dialog.append(search);
   const grid=el('div','','pq105-collection-grid'),status=el('p','','pq105-collection-status');status.setAttribute('role','status');dialog.append(grid,status);
   const foot=el('div','','pq105-collection-tabs');dialog.append(foot);btn(foot,'閉じる',()=>dialog.close());if(testing)btn(foot,'試験初期化',()=>{type='inventory';query='';render();});
   function paint(){
    grid.replaceChildren();status.textContent='';
    const rows=selectRoutes(type,query);
    if(!rows.length)grid.append(el('p','該当するコンテンツはありません。'));
    for(const [id,kind,label,panel,selector,source] of rows){
     const card=el('article','','pq105-collection-card');card.dataset.pq105CollectionId=id;card.append(el('h3',label));
     const lines=testing?summaryRows(SAMPLE[id]):sourceRows(source);
     if(lines.length){const ul=el('ul');for(const line of lines)ul.append(el('li',line));card.append(ul);}
     else card.append(el('p',kind==='gacha'?'提供条件・残高・天井は専用画面で確認':'詳細な所持状況は専用画面で確認','pq105-collection-note'));
     btn(card,kind==='gacha'?'召喚画面へ':'詳細を開く',()=>{
      if(testing){status.textContent='試験移動：'+label+'（本番画面は変更していません）';return;}
      const leaf=nav.querySelector('button[data-tab="'+panel+'"]');if(!leaf){status.textContent='移動先を確認できません';return;}
      dialog.close();leaf.click();document.getElementById(panel)?.querySelector(selector)?.click();
     });
     grid.append(card);
    }
   }
   search.oninput=()=>{query=search.value;paint();};paint();
  }
  dialog.addEventListener('close',()=>{if(opener?.isConnected&&opener.offsetParent!==null)opener.focus();});
  const test=btn(launch,'🧪 コレクション試験',()=>open('inventory',true));test.style.gridColumn='1/-1';
  window.PQ105Collection.open=open;
 }
 window.PQ105Collection={mount,open:null};
})();
