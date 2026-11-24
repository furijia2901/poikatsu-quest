/* Ver.10.5 cosmetic profile — only explicit changes to a dedicated device preference. */
(function(){
 'use strict';
 const KEY='pq105-profile-device-v1';
 const ICONS=Object.freeze({star:'✦',sword:'⚔️',moon:'🌙',dragon:'🐉',flower:'🌸',crystal:'💎',fox:'🦊',crown:'👑',book:'📖',comet:'☄️',leaf:'🌿',shield:'🛡️'});
 const TITLES=Object.freeze(['星灯の旅人','星空の観測者','日常の冒険者','月夜の案内人','夢を集める者','星界の探求者']);
 const THEMES=Object.freeze({astral:'星降る夜',forest:'深緑の森',gold:'黄金の王都',ocean:'蒼海の月',rose:'花明かり',void:'虚空の星界'});
 const DEFAULT=Object.freeze({version:1,name:'',icon:'star',title:'',theme:'astral'});
 const nameClean=x=>typeof x==='string'?Array.from(x.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').trim()).slice(0,20).join(''):'';
 function normalize(x){
  if(!x||typeof x!=='object'||x.version!==1)return {...DEFAULT};
  return {version:1,name:nameClean(x.name),icon:Object.hasOwn(ICONS,x.icon)?x.icon:DEFAULT.icon,title:TITLES.includes(x.title)?x.title:'',theme:Object.hasOwn(THEMES,x.theme)?x.theme:DEFAULT.theme};
 }
 function read(storage){try{return normalize(JSON.parse(storage.getItem(KEY)||'null'));}catch{return {...DEFAULT};}}
 function write(storage,draft){const next=normalize(draft);const raw=JSON.stringify(next);storage.setItem(KEY,raw);if(storage.getItem(KEY)!==raw)throw Error('保存結果を確認できません');return next;}
 function fixture(){return {version:1,name:'試験冒険者',icon:'moon',title:'星空の観測者',theme:'ocean'};}
 if(typeof module==='object'&&module.exports){module.exports={KEY,ICONS,TITLES,THEMES,DEFAULT,normalize,read,write,fixture};return;}
 const make=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 function btn(parent,label,fn){const b=make('button',label);b.type='button';b.onclick=fn;parent.append(b);return b;}
 function mount(){
  const lobby=document.getElementById('pq105-home');if(!lobby||document.getElementById('pq105-profile-editor'))return;
  const style=make('style');style.textContent=
  '#pq105-home[data-profile-theme=forest] .pq105-profile,.pq105-profile-preview[data-theme=forest]{background:radial-gradient(ellipse at 0 0,#355d4e,#1b3040 75%)}'+
  '#pq105-home[data-profile-theme=gold] .pq105-profile,.pq105-profile-preview[data-theme=gold]{background:radial-gradient(ellipse at 0 0,#7e6436,#342b44 75%)}'+
  '#pq105-home[data-profile-theme=ocean] .pq105-profile,.pq105-profile-preview[data-theme=ocean]{background:radial-gradient(ellipse at 0 0,#326f8c,#192b4e 75%)}'+
  '#pq105-home[data-profile-theme=rose] .pq105-profile,.pq105-profile-preview[data-theme=rose]{background:radial-gradient(ellipse at 0 0,#86516f,#352946 75%)}'+
  '#pq105-home[data-profile-theme=void] .pq105-profile,.pq105-profile-preview[data-theme=void]{background:radial-gradient(ellipse at 0 0,#663787,#17172f 75%)}'+
  '#pq105-home[data-profile-theme=forest] .pq105-home-menu{border-color:#7aba9e}#pq105-home[data-profile-theme=gold] .pq105-home-menu{border-color:#d3b679}#pq105-home[data-profile-theme=ocean] .pq105-home-menu{border-color:#82c5e4}#pq105-home[data-profile-theme=rose] .pq105-home-menu{border-color:#d39aba}#pq105-home[data-profile-theme=void] .pq105-home-menu{border-color:#bda0ef}'+
  '#pq105-profile-editor{box-sizing:border-box;width:min(620px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;color:#f4efff;background:#172139;border:1px solid #b6a0d8;border-radius:17px;padding:18px}'+
  '#pq105-profile-editor::backdrop{background:#05091bd9}#pq105-profile-editor h2{margin:0 0 10px;color:#ffe5b0;font-size:21px}#pq105-profile-editor p{font-size:13px;line-height:1.6}'+
  '#pq105-profile-editor label{display:grid;gap:5px;margin:12px 0;font-size:13px;color:#e4daf8}#pq105-profile-editor :is(input,select){box-sizing:border-box;width:100%;min-height:44px;margin:0;padding:10px;background:#101b31;border:1px solid #8977ad;color:#f5f1ff;border-radius:8px;font:inherit}'+
  '#pq105-profile-editor button{min-height:44px;margin:0;padding:9px;background:#293653;border:1px solid #7383a5;border-radius:9px;color:#f5efff;cursor:pointer;white-space:normal;overflow-wrap:anywhere}'+
  '#pq105-profile-editor button[aria-pressed=true]{background:#59496e;color:#ffe7ad;border-color:#e5cb8c}'+
  '.pq105-profile-preview{display:grid;grid-template-columns:52px minmax(0,1fr);gap:10px;align-items:center;background:radial-gradient(ellipse at 0 0,#594674,#25324e 75%);border:1px solid #ae9acc;border-radius:12px;padding:12px}'+
  '.pq105-profile-preview-icon{font-size:32px;text-align:center;color:#ffe6a8}.pq105-profile-preview-name{font-size:17px;overflow-wrap:anywhere}.pq105-profile-preview-title{display:block;font-size:12px;color:#ffe3ad;overflow-wrap:anywhere}'+
  '.pq105-profile-icons{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin:8px 0}#pq105-profile-editor .pq105-profile-icons button{font-size:20px;padding:4px}'+
  '.pq105-profile-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}#pq105-profile-editor .pq105-profile-save{background:#e3c791;color:#221d37;font-weight:750}'+
  '.pq105-customize-entry{width:100%;margin-top:8px!important;background:#293651;border:1px solid #9b87be;color:#ffe6af}'+
  '#pq105-home .pq105-custom-name{color:#fff0c8}#pq105-home .pq105-custom-title{font-size:11px;color:#ffe4ac;overflow-wrap:anywhere}#pq105-home [hidden]{display:none!important}'+
  '@media(max-width:360px){#pq105-profile-editor{padding:12px}.pq105-profile-icons{grid-template-columns:repeat(4,minmax(0,1fr))}}';
  document.head.append(style);
  const profile=lobby.querySelector('.pq105-profile'),copy=lobby.querySelector('.pq105-profile-copy'),emblem=lobby.querySelector('.pq105-emblem');
  if(!profile||!copy||!emblem)return;
  const customName=make('strong','','pq105-custom-name'),customTitle=make('small','','pq105-custom-title');
  copy.append(customName,customTitle);
  let applied=read(localStorage);
  function apply(x){applied=normalize(x);lobby.dataset.profileTheme=applied.theme;emblem.textContent=ICONS[applied.icon];customName.textContent=applied.name;customName.hidden=!applied.name;customTitle.textContent=applied.title;customTitle.hidden=!applied.title;}
  apply(applied);
  const dialog=make('dialog');dialog.id='pq105-profile-editor';dialog.setAttribute('aria-labelledby','pq105-profile-heading');
  document.body.append(dialog);
  let draft={...applied},testing=false,opener=null;
  const entry=btn(profile,'🎨 プロフィール編集',()=>open(false));entry.className='pq105-customize-entry';entry.style.gridColumn='1/-1';
  const test=btn(profile,'🧪 プロフィール試験',()=>open(true));test.className='pq105-customize-entry';test.style.gridColumn='1/-1';
  function open(mode){
   if(dialog.open)return;opener=document.activeElement;testing=mode;draft=mode?fixture():{...applied};render();dialog.showModal();
  }
  function render(){
   dialog.replaceChildren();
   const heading=make('h2',testing?'プロフィール編集・テストモード':'プロフィール編集');heading.id='pq105-profile-heading';dialog.append(heading);
   dialog.append(make('p',testing?'仮データのみ使用。試験保存・初期化をしても実際のプロフィールやセーブには反映されません。':'この端末だけに保存する外見設定です。戦闘力・獲得済み称号・ゲームのセーブ・クラウド同期には影響しません。'));
   const preview=make('div','','pq105-profile-preview'),icon=make('div','','pq105-profile-preview-icon'),previewCopy=make('div'),name=make('strong','','pq105-profile-preview-name'),title=make('small','','pq105-profile-preview-title');
   previewCopy.append(name,title);preview.append(icon,previewCopy);dialog.append(preview);
   const nameLabel=make('label','プレイヤー名（20文字まで）'),input=make('input');input.type='text';input.maxLength=40;input.placeholder='未設定なら従来の表示';input.value=draft.name;nameLabel.append(input);dialog.append(nameLabel);
   const iconLabel=make('p','アイコンを選択');dialog.append(iconLabel);
   const iconGrid=make('div','','pq105-profile-icons');dialog.append(iconGrid);const buttons=new Map();
   for(const [id,symbol] of Object.entries(ICONS)){const b=btn(iconGrid,symbol,()=>{draft.icon=id;refresh();});b.dataset.pq105Icon=id;b.setAttribute('aria-label','アイコン '+symbol);buttons.set(id,b);}
   function selectField(label,values,value,onChange){const l=make('label',label),sel=make('select');for(const [id,text] of values){const o=make('option',text);o.value=id;sel.append(o);}sel.value=value;sel.onchange=()=>{onChange(sel.value);refresh();};l.append(sel);dialog.append(l);return sel;}
   selectField('プロフィール用称号',[['','未設定'],...TITLES.map(t=>[t,t])],draft.title,v=>draft.title=v);
   selectField('ロビーのテーマ',Object.entries(THEMES),draft.theme,v=>draft.theme=v);
   const status=make('p');status.setAttribute('role','status');dialog.append(status);
   const actions=make('div','','pq105-profile-actions');dialog.append(actions);
   const commit=btn(actions,testing?'試験保存':'保存する',()=>{
    draft=normalize(draft);
    if(testing){status.textContent='試験保存成功（本番変更なし）';return;}
    try{apply(write(localStorage,draft));status.textContent='保存しました。この端末のロビーに反映済み。';}catch(e){status.textContent='保存できませんでした。端末設定を確認してください。';}
   });commit.className='pq105-profile-save';
   btn(actions,'初期値に戻す',()=>{draft={...DEFAULT};render();});
   btn(actions,'閉じる（未保存の変更を破棄）',()=>dialog.close()).style.gridColumn='1/-1';
   function refresh(){const p=normalize(draft);preview.dataset.theme=p.theme;icon.textContent=ICONS[p.icon];name.textContent=p.name||'冒険者';title.textContent=p.title||'称号なし';for(const [id,b] of buttons)b.setAttribute('aria-pressed',String(id===p.icon));}
   input.addEventListener('input',()=>{draft.name=nameClean(input.value);refresh();});refresh();
  }
  dialog.addEventListener('close',()=>{draft={...applied};testing=false;if(opener?.isConnected)opener.focus();});
  window.PQ105Profile.open=open;
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)apply(read(localStorage));});
 }
 window.PQ105Profile={mount,open:null};
})();
