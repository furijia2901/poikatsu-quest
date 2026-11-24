/* Ver.10.5 original procedural music and cosmetic device preferences. No game-save writes. */
(function(){
 'use strict';
 const KEY='pq105-audio-device-v1',DEFAULT=Object.freeze({version:1,enabled:false,bgm:35,sfx:45,motion:true});
 const clamp=(n,fallback)=>typeof n==='number'&&Number.isFinite(n)?Math.min(100,Math.max(0,Math.round(n))):fallback;
 function normalize(x){if(!x||x.version!==1)return {...DEFAULT};return {version:1,enabled:x.enabled===true,bgm:clamp(x.bgm,35),sfx:clamp(x.sfx,45),motion:x.motion!==false};}
 function read(storage){try{return normalize(JSON.parse(storage.getItem(KEY)||'null'));}catch{return {...DEFAULT};}}
 function write(storage,x){const next=normalize(x),raw=JSON.stringify(next);storage.setItem(KEY,raw);if(storage.getItem(KEY)!==raw)throw Error('Preference verification failed');return next;}
 // Original eight-bar motifs, composed for this game; MIDI pitch, beat, duration.
 const SONGS=Object.freeze({
  title:Object.freeze({beat:.58,chords:[[57,60,64],[53,57,60],[48,52,55],[55,59,62],[57,60,64],[53,57,60],[50,53,57],[52,56,59]],melody:[[69,72,76,74],[72,69,65,67],[67,72,71,67],[74,71,67,64],[69,76,79,76],[77,72,69,65],[69,74,77,74],[71,68,64,68]]}),
  home:Object.freeze({beat:.43,chords:[[60,64,67],[55,59,62],[57,60,64],[53,57,60],[60,64,67],[50,53,57],[55,59,62],[60,64,67]],melody:[[72,76,79,76],[74,71,67,71],[72,76,81,79],[77,76,72,69],[76,79,84,79],[74,77,81,77],[74,71,67,71],[72,76,74,72]]}),
  adventure:Object.freeze({beat:.36,chords:[[57,60,64],[55,59,62],[53,57,60],[52,56,59],[57,60,64],[50,53,57],[53,57,60],[52,56,59]],melody:[[69,76,72,76],[67,74,71,74],[65,72,69,72],[68,71,76,71],[69,72,76,81],[74,77,69,74],[72,77,69,72],[71,68,76,68]]})
 });
 const hz=n=>440*Math.pow(2,(n-69)/12);
 function sceneFor(title,panel){return title?'title':['expedition90','adventure','update17','update19','update20','event40'].includes(panel)?'adventure':'home';}
 function notesFor(scene,bar){const song=SONGS[scene]||SONGS.home,i=((bar%8)+8)%8,beat=song.beat;return {length:4*beat,notes:[...song.melody[i].map((pitch,j)=>({pitch,offset:j*beat,duration:beat*.8,volume:.12,type:'sine'})),...song.chords[i].map((pitch,j)=>({pitch:pitch-12,offset:j*beat*.5,duration:beat*2.8,volume:.045,type:'triangle'}))]};}
 const EFFECTS=Object.freeze({tap:[[76,0,.065,.09]],confirm:[[72,0,.1,.1],[79,.09,.18,.08]],transition:[[67,0,.09,.06],[72,.065,.14,.07]],reward:[[72,0,.12,.1],[76,.09,.12,.1],[79,.18,.26,.1]]});
 if(typeof module==='object'&&module.exports){module.exports={KEY,DEFAULT,normalize,read,write,SONGS,EFFECTS,hz,sceneFor,notesFor};return;}
 function engine(){
  let ctx=null,bgm=null,sfx=null,timer=null,bar=0,next=0,scene='',running=false;const voices=new Set();
  const Audio=window.AudioContext||window.webkitAudioContext;
  function init(){if(!Audio)return false;if(!ctx){ctx=new Audio();bgm=ctx.createGain();sfx=ctx.createGain();bgm.gain.value=0;sfx.gain.value=0;bgm.connect(ctx.destination);sfx.connect(ctx.destination);}return true;}
  function tone(pitch,t,duration,volume,type,bus){
   if(!ctx||ctx.state!=='running'||volume<=0)return;
   const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.value=hz(pitch);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+Math.min(.025,duration*.3));gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   osc.connect(gain);gain.connect(bus);const v={osc,gain,bus};voices.add(v);osc.onended=()=>{voices.delete(v);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+duration+.01);
  }
  function cut(bus){for(const v of [...voices])if(!bus||v.bus===bus){try{v.osc.stop();}catch{}voices.delete(v);}}
  function stopMusic(){running=false;if(timer!==null)clearInterval(timer);timer=null;cut(bgm);scene='';}
  function mix(p){if(!ctx)return;bgm.gain.value=p.enabled?p.bgm/100*.34:0;sfx.gain.value=p.enabled?p.sfx/100*.46:0;}
  async function unlock(){try{if(!init())return false;if(ctx.state!=='running')await ctx.resume();return ctx.state==='running';}catch{return false;}}
  function tick(){if(!running||!ctx||ctx.state!=='running')return;if(next<ctx.currentTime)next=ctx.currentTime+.03;while(next<ctx.currentTime+.28){const part=notesFor(scene,bar++);for(const n of part.notes)tone(n.pitch,next+n.offset,n.duration,n.volume,n.type,bgm);next+=part.length;}}
  function music(name,p){mix(p);if(!p.enabled||!p.bgm||!ctx||ctx.state!=='running'){stopMusic();return;}if(running&&scene===name)return;stopMusic();scene=name;bar=0;next=ctx.currentTime+.04;running=true;tick();timer=setInterval(tick,120);}
  function effect(name,p){if(!ctx||ctx.state!=='running'||!p.enabled||!p.sfx)return;mix(p);const t=ctx.currentTime+.01;for(const [pitch,offset,duration,volume] of EFFECTS[name]||EFFECTS.tap)tone(pitch,t+offset,duration,volume,'sine',sfx);}
  function halt(){stopMusic();cut(null);if(ctx?.state==='running')ctx.suspend().catch(()=>{});}
  async function dispose(){stopMusic();cut(null);if(ctx&&ctx.state!=='closed')try{await ctx.close();}catch{}}
  return {unlock,music,effect,mix,halt,dispose,available:!!Audio};
 }
 const el=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 function btn(parent,label,fn){const b=el('button',label);b.type='button';b.onclick=fn;parent.append(b);return b;}
 function mount(main,title){
  if(document.getElementById('pq105-audio'))return;
  const player=engine();let prefs=read(localStorage),unlocked=false,revision=0,paused=false,lastPanel='',lastTap=0;
  const currentScene=()=>sceneFor(title.open,main.querySelector(':scope > .panel.active')?.id);
  const style=el('style');style.textContent='#pq105-audio{box-sizing:border-box;width:min(560px,calc(100% - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:18px;border:1px solid #b5a0da;border-radius:17px;background:#172139;color:#f6efff}#pq105-audio::backdrop{background:#060b1cdd}#pq105-audio h2{margin:0;color:#ffe4ad;font-size:21px}#pq105-audio p{font-size:13px;line-height:1.65}#pq105-audio label{display:flex;align-items:center;gap:9px;margin:13px 0;font-size:14px}#pq105-audio input[type=range]{flex:1;min-width:0;width:auto;accent-color:#d6b9f5}#pq105-audio input[type=checkbox]{width:20px;height:20px;flex:none;accent-color:#b5a0da}#pq105-audio button{min-height:44px;margin:0;padding:9px;border:1px solid #8b91b0;border-radius:9px;background:#293653;color:#f5f0ff;white-space:normal;overflow-wrap:anywhere}.pq105-audio-actions{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}.pq105-audio-actions button{flex:1 1 120px}.pq105-audio-status{color:#ffe4a4;min-height:1em}.pq105-audio-entry{min-height:44px;margin:6px!important;background:#303952;border:1px solid #a08fc1;color:#ffe5b5}main>.panel.pq105-transition{animation:pq105-enter .2s ease-out both}@keyframes pq105-enter{from{opacity:.55;transform:translateY(4px)}to{opacity:1;transform:none}}html[data-pq105-motion=off] .pq105-transition,html[data-pq105-motion=off] #pq105-title *{animation:none!important;transition:none!important;transform:none!important}@media(prefers-reduced-motion:reduce){main>.panel.pq105-transition{animation:none!important;transform:none!important}}';
  document.head.append(style);
  function motion(){document.documentElement.dataset.pq105Motion=prefs.motion?'on':'off';}
  motion();
  function sync(){
   const panel=main.querySelector(':scope > .panel.active');if(panel&&panel.id!==lastPanel){const changed=!!lastPanel;lastPanel=panel.id;if(changed&&!paused&&!document.hidden&&unlocked)player.effect('transition',prefs);if(prefs.motion&&!matchMedia('(prefers-reduced-motion:reduce)').matches){panel.classList.add('pq105-transition');panel.addEventListener('animationend',()=>panel.classList.remove('pq105-transition'),{once:true});}}
   if(!paused&&!document.hidden&&unlocked&&prefs.enabled)player.music(currentScene(),prefs);else player.halt();
  }
  async function activate(){const token=++revision;if(!prefs.enabled||paused||document.hidden)return false;const ok=await player.unlock();if(token!==revision)return false;if(paused||document.hidden||!prefs.enabled){player.halt();return false;}unlocked=ok;sync();return ok;}
  function suspend(){revision++;unlocked=false;player.halt();}
  const observer=new MutationObserver(sync);
  for(const panel of main.querySelectorAll(':scope > .panel'))observer.observe(panel,{attributes:true,attributeFilter:['class']});
  observer.observe(title,{attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){suspend();stopPreview();}else if(prefs.enabled&&!paused)activate();});
  window.addEventListener('pagehide',()=>{suspend();stopPreview();});
  document.addEventListener('click',e=>{
   if(!e.isTrusted||paused||document.hidden||!prefs.enabled||e.target.closest('#pq105-audio'))return;
   if(!e.target.closest('button'))return;
   const now=performance.now();if(now-lastTap<80)return;lastTap=now;
   if(!unlocked){activate().then(ok=>{if(ok)player.effect('tap',prefs);});}else player.effect('tap',prefs);
  },true);
  const dialog=el('dialog');dialog.id='pq105-audio';dialog.setAttribute('aria-label','サウンド・演出設定');document.body.append(dialog);
  let draft={...prefs},test=false,preview=null,opener=null;
  function stopPreview(){const p=preview;preview=null;p?.dispose();}
  function open(mode=false){if(dialog.open)return;opener=document.activeElement;test=mode;draft=mode?{...DEFAULT,enabled:true}:{...prefs};paused=true;suspend();render();dialog.showModal();}
  function render(){
   stopPreview();dialog.replaceChildren(el('h2',test?'🧪 サウンド・演出試験':'サウンド・演出設定'));
   dialog.append(el('p',test?'試験設定・試聴は本番設定を変更しません。':'初期状態は消音です。音を有効にすると操作後に再生を開始します。この端末だけに保存します。'));
   const status=el('p','','pq105-audio-status');status.setAttribute('role','status');
   function check(label,key){const l=el('label'),i=el('input');i.type='checkbox';i.checked=draft[key];i.onchange=()=>{draft[key]=i.checked;if(!draft.enabled)stopPreview();else preview?.mix(draft);};l.append(i,el('span',label));dialog.append(l);}
   function slider(label,key){const l=el('label'),i=el('input'),v=el('span',draft[key]+'%');i.type='range';i.min=0;i.max=100;i.value=draft[key];i.setAttribute('aria-label',label);i.oninput=()=>{draft[key]=Number(i.value);v.textContent=draft[key]+'%';preview?.mix(draft);};l.append(el('span',label),i,v);dialog.append(l);}
   check('サウンドを有効にする','enabled');slider('BGM音量','bgm');slider('効果音音量','sfx');check('画面切替アニメーション','motion');
   const trials=el('div','','pq105-audio-actions');dialog.append(trials);
   async function sample(kind){stopPreview();if(!draft.enabled){status.textContent='サウンドを有効にしてください';return;}const p=engine();preview=p;const ok=await p.unlock();if(preview!==p||!dialog.open){await p.dispose();return;}if(!ok){status.textContent='音声を再生できない環境です';return;}if(kind in SONGS){p.music(kind,draft);status.textContent='試聴中：'+({title:'タイトル',home:'ロビー',adventure:'冒険'}[kind]);}else{p.effect(kind,draft);status.textContent='効果音を試聴しました';}}
   for(const [kind,label] of [['title','タイトルBGM'],['home','ロビーBGM'],['adventure','冒険BGM'],['tap','操作音'],['confirm','決定音'],['reward','報酬音']])btn(trials,label,()=>sample(kind));
   btn(trials,'試聴停止',()=>{stopPreview();status.textContent='試聴停止';});
   dialog.append(status);
   const actions=el('div','','pq105-audio-actions');dialog.append(actions);
   btn(actions,test?'試験保存':'保存する',()=>{
    stopPreview();if(test){status.textContent='試験保存成功（本番変更なし）';return;}
    try{prefs=write(localStorage,draft);motion();status.textContent='端末設定を保存しました';}catch{status.textContent='保存できませんでした';}
   });
   btn(actions,'初期値に戻す',()=>{draft={...DEFAULT};render();});
   btn(actions,'閉じる',()=>dialog.close());
  }
  dialog.addEventListener('close',()=>{stopPreview();paused=false;draft={...prefs};test=false;if(opener?.isConnected&&opener.offsetParent!==null)opener.focus();if(prefs.enabled)activate();else suspend();});
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){prefs=read(localStorage);motion();if(prefs.enabled&&!paused)activate();else suspend();}});
  const lobby=document.querySelector('#pq105-home .pq105-home-tools');if(lobby){btn(lobby,'🔊 サウンド設定',()=>open(false));btn(lobby,'🧪 サウンド試験',()=>open(true));}
  const settings=document.querySelector('#settings92 #cloud-panel');if(settings){const b=btn(settings,'🔊 サウンド・演出設定',()=>open(false));b.className='pq105-audio-entry';settings.prepend(b);}
  const links=title.querySelector('.pq105-links');if(links){const b=btn(links,'🔊 サウンド',()=>open(false));b.dataset.pq105AudioTitle='1';}
  window.PQ105Audio.open=open;
  sync();
 }
 window.PQ105Audio={mount,open:null};
})();
