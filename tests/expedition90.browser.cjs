'use strict';
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.cwd();
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),name=url.pathname==='/'?'index.html':url.pathname.slice(1);
 if(!/^[a-zA-Z0-9_.-]+$/.test(name)){res.writeHead(404);return res.end();}
 try{const data=fs.readFileSync(path.join(root,name));res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8');res.end(data);}catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1280,height:850},{width:390,height:844}]){
   const context=await browser.newContext({viewport,reducedMotion:'reduce'});
   await context.route('**/*',r=>r.request().url().startsWith(url+'/')?r.continue():r.abort());
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.goto(url);await page.locator('nav[data-ui92="1"]').waitFor();
   const title=page.locator('#pq105-title');
   await title.waitFor({state:'visible'});
   assert.equal(await title.locator('.pq105-logo').innerText(),'POIKATSU\nQUEST');
   assert.match(await title.innerText(),/Ver\.10\.5/);
   assert.equal(await title.locator('svg').count(),1);
   assert.equal(await title.locator('.pq105-star').first().evaluate(e=>getComputedStyle(e).animationName),'none');
   const titleBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   for(const id of ['news','updates']){
    await title.locator('[data-pq105-title-link="'+id+'"]').click();
    assert.match(await title.locator('.pq105-detail').innerText(),/STAR EXPLORER/);
    await title.getByRole('button',{name:'タイトルへ戻る',exact:true}).click();
   }
   for(const id of ['account','settings']){
    await title.locator('[data-pq105-title-link="'+id+'"]').click();
    await title.waitFor({state:'hidden'});
    await page.locator('#settings92.active').waitFor();
    assert.equal(await page.locator('#cloud-email').isVisible(),true);
    await page.locator('#pq105-return').click();
    await title.waitFor({state:'visible'});
   }
   await title.locator('#pq105-start').click();
   await title.waitFor({state:'hidden'});
   await page.locator('#home.active').waitFor();
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),titleBefore,'title navigation must not alter game or storage');
   console.log('PASS title screen, news, account, settings and return '+viewport.width+'px');
   const {GROUPS}=require('../ui92.js');
   async function gotoTab(id){
    if(id==='home'){
     await page.locator('[data-pq92-group="home"]').click();
     assert.equal(await page.locator('#home.panel.active').isVisible(),true,'home must open');
     return;
    }
    const leaf=page.locator('button[data-tab="'+id+'"]');
    if(!await leaf.isVisible()){
     const g=GROUPS.find(x=>x.tabs.includes(id));
     await page.locator('[data-pq92-group="'+g.id+'"]').click();
    }
    await leaf.click();
    assert.equal(await page.locator('#'+id+'.panel.active').isVisible(),true,id+' must open');
   }
   assert.equal(await page.locator('[data-pq92-group]').count(),6);
   assert.equal(await page.locator('nav[data-ui92] button[data-tab]').count(),28);
   const navBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   for(const g of GROUPS)for(const id of g.tabs)await gotoTab(id);

   const {SCREEN_LAYOUTS}=require('../ui92.js');
   for(const [id,def] of Object.entries(SCREEN_LAYOUTS)){
    await gotoTab(id);
    const screen=page.locator('#'+id);
    assert.equal(await screen.getAttribute('data-ui92-sections'),'1',id+' section mapping');
    const original=screen.locator(def.selector);
    assert.equal(await original.count(),(def.keep||[]).length+def.views.flatMap(v=>v[1]).length);
    for(let i=0;i<def.views.length;i++){
     await screen.locator('[data-pq92-screen-choice="'+i+'"]').click();
     const expected=new Set([...(def.keep||[]),...def.views[i][1]]);
     for(let j=0;j<await original.count();j++)assert.equal(await original.nth(j).isVisible(),expected.has(j),id+' view '+i+' section '+j);
    }
    await screen.locator('[data-pq92-screen-choice="0"]').click();
   }
   await gotoTab('settings92');
   console.log('PASS all composite screen views '+viewport.width+'px');
   assert.equal(await page.locator('#settings92 #cloud-panel').isVisible(),true);
   const settings=page.locator('#settings92');
   assert.equal(await settings.getAttribute('data-ui92-settings'),'1');
   assert.equal(await settings.locator('#cloud-status').isVisible(),true);
   assert.equal(await settings.locator('#cloud-email').isVisible(),true);
   assert.equal(await settings.locator('#web-migration').isVisible(),false);
   await settings.locator('[data-pq92-settings-choice="1"]').click();
   assert.equal(await settings.locator('#web-migration').isVisible(),true);
   assert.equal(await settings.locator('#pq-v8-backup').isVisible(),true);
   assert.equal(await settings.locator('#pq-backup-preview-v8').isVisible(),true);
   assert.equal(await settings.locator('#cloud-email').isVisible(),false);
   await settings.locator('[data-pq92-settings-choice="2"]').click();
   assert.equal(await settings.getByRole('button',{name:'🔎 競合・復旧を診断',exact:true}).isVisible(),true);
   assert.equal(await settings.getByRole('button',{name:'🧪 遠征テストモードへ',exact:true}).isVisible(),true);
   assert.equal(await settings.locator('#cloud-status').isVisible(),true);
   await settings.locator('[data-pq92-settings-choice="0"]').click();
   console.log('PASS settings subviews and original controls '+viewport.width+'px');
   assert.equal(await page.locator('#cloud-panel').count(),1);
   await gotoTab('home');
   assert.equal(await page.locator('#cloud-panel').isVisible(),false);
   const home=page.locator('#home');
   assert.equal(await home.locator('#pq92-home-today').isVisible(),true);
   assert.equal(await home.locator('#equipmentList').isVisible(),false);
   assert.equal(await home.locator('#classes').isVisible(),false);
   assert.equal(await home.locator('[data-pq92-shortcut]').count(),6);
   await home.locator('[data-pq92-home-view="profile"]').click();
   assert.equal(await home.locator('#classes').isVisible(),true);
   assert.equal(await home.locator('#guildHeadline').isVisible(),false);
   await home.locator('[data-pq92-home-view="equipment"]').click();
   assert.equal(await home.locator('#equipmentList').isVisible(),true);
   assert.equal(await home.getByRole('button',{name:/1回引く（100G）/}).isVisible(),true);
   await home.locator('[data-pq92-home-view="today"]').click();
   for(const id of ['quests','outdoor60','expedition90','missions','grand50','season13']){
    await home.locator('[data-pq92-shortcut="'+id+'"]').click();
    assert.equal(await page.locator('#'+id+'.active').isVisible(),true);
    if(id==='expedition90')assert.equal(await page.locator('#expedition90 .pq9-hero').isVisible(),true);
    await gotoTab('home');
   }
   assert.ok(await home.locator('.pq92-shortcuts').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'home shortcuts overflow');
   console.log('PASS home views and quick links '+viewport.width+'px');

   const lobby=page.locator('#pq105-home');
   assert.equal(await lobby.isVisible(),true);
   assert.equal(await lobby.locator('[data-pq105-home-link]').count(),12);
   const readStatus=await page.evaluate(()=>({gold:document.getElementById('gold').textContent,energy:document.getElementById('energy').textContent,level:document.getElementById('lv').textContent}));
   assert.match(await lobby.innerText(),new RegExp(readStatus.level.replace('.','\\.')));
   assert.equal(await lobby.locator('.pq105-balance strong').first().innerText(),readStatus.gold);
   assert.equal(await lobby.locator('.pq105-balance strong').last().innerText(),readStatus.energy);
   const feature=lobby.locator('.pq105-feature');
   assert.equal(await feature.getAttribute('data-theme'),'expedition');
   await feature.getByRole('button',{name:'次のおすすめ',exact:true}).click();
   assert.equal(await feature.getAttribute('data-theme'),'outdoor');
   await feature.getByRole('button',{name:'コンテンツへ',exact:true}).click();
   await page.locator('#outdoor60.active').waitFor();
   await gotoTab('home');
   await feature.getByRole('button',{name:'前のおすすめ',exact:true}).click();
   assert.equal(await feature.getAttribute('data-theme'),'expedition');
   const {HOME_LINKS}=require('../game105.js');
   for(const [id] of HOME_LINKS){await lobby.locator('[data-pq105-home-link="'+id+'"]').click();await page.locator('#'+id+'.active').waitFor();await gotoTab('home');}
   await lobby.getByRole('button',{name:'🎒 装備・持ち物',exact:true}).click();
   assert.equal(await home.locator('#equipmentList').isVisible(),true);
   await gotoTab('home');
   await lobby.getByRole('button',{name:'🎁 ログイン報酬',exact:true}).click();
   assert.equal(await page.locator('#loginBtn').isVisible(),true);
   await gotoTab('home');
   assert.ok(await lobby.locator('.pq105-home-grid').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'lobby grid overflow');
   console.log('PASS lobby profile, currencies, all twelve links, featured carousel, equipment and reward routing '+viewport.width+'px');


   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),navBefore,'navigation must not change game or storage');
   assert.ok(await page.locator('.pq92-categories').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'categories overflow');
   await page.locator('#home').getByRole('button',{name:'📜 依頼を見る',exact:true}).click();
   assert.equal(await page.locator('#quests.active').isVisible(),true,'legacy shortcut still works');
   assert.equal(await page.locator('[data-pq92-group="activity"]').getAttribute('aria-pressed'),'true');
   console.log('PASS all 28 UI screens, 6 categories, navigation isolation '+viewport.width+'px');
   for(const width of [320,360,390,749,750,820,1120,1121,1280,1920]){
    await page.setViewportSize({width,height:850});
    await gotoTab('home');
    assert.ok(await page.locator('.pq92-categories').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'category overflow '+width);
    assert.ok(await home.locator('.pq92-shortcuts').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'shortcut overflow '+width);
    await gotoTab('expedition90');
    assert.ok(await page.locator('#expedition90').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'expedition overflow '+width);
    await gotoTab('home');
   }
   await page.setViewportSize(viewport);
   if(viewport.width<750){
    await page.locator('[data-pq92-group="activity"]').click();
    assert.equal(await page.locator('#pq92-subnav').isVisible(),true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#pq92-subnav').isVisible(),false);
    await page.locator('[data-pq92-group="activity"]').click();
    assert.equal(await page.locator('#pq92-subnav').isVisible(),true);
    await page.locator('#quests h2').first().click();
    assert.equal(await page.locator('#pq92-subnav').isVisible(),false);
   }
   console.log('PASS responsive widths 320–1920 and mobile dismissal');

   async function seed(){
    await page.evaluate(()=>{
     const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
     s.dailyQuestStats={[today]:{count:12,xp:500}};
     s.questHistory=['レシート','歩数・移動','アンケート','ゲーム','広告・ミニゲーム'].map((category,i)=>({id:'fixture'+i,day:today,category}));
    });
   }
   await seed();
   const base=await page.evaluate(()=>localStorage.getItem('poikatsu-quest-v01'));
   await gotoTab('expedition90');
   const panel=page.locator('#expedition90');
   assert.equal(await panel.isVisible(),true);
   assert.equal(await panel.locator('#pq9-shop').isVisible(),false);
   const overview=panel.locator('#pq10-map-overview');
   assert.equal(await overview.locator('.pq10-map-tile').count(),4);
   assert.equal(await overview.locator('.pq10-map-node').count(),9);
   assert.equal(await overview.locator('.pq10-map-node[data-state="cleared"]').count(),3);
   await overview.getByRole('button',{name:'🏜️ 黄金街道',exact:true}).click();
   assert.equal(await page.evaluate(()=>document.activeElement?.dataset.pq10Route),'market');

   await panel.locator('[data-pq9-view="growth"]').click();
   assert.match(await panel.locator('#pq10-growth').innerText(),/Lv\.1/);
   assert.match(await panel.locator('#pq10-growth').innerText(),/累計EXP 0/);

   await panel.locator('[data-pq9-view="rewards"]').click();
   const reward=panel.getByRole('button',{name:/受取可能な報酬を一括受取/});
   await reward.click();
   await page.locator('#pq9-reveal').waitFor({state:'visible'});
   assert.match(await page.locator('#pq9-reveal').getAttribute('data-rarity'),/^(N|R|SR|SSR|UR)$/);
   await page.locator('#pq9-reveal').getByRole('button',{name:'閉じる',exact:true}).click();
   assert.equal(await reward.isDisabled(),true);
   const chestText=await panel.locator('#pq10-chests').innerText();
   assert.match(chestText,/開封 1 回 ／ 発見 1 \/ 15 種/);
   assert.match(chestText,/(N|R|SR|SSR|UR) (黄金の古銭|交易商の印章|琥珀の星砂|黄金王の羅針盤|太陽王の聖杯)/);

   await panel.locator('[data-pq9-view="growth"]').click();
   const growthText=await panel.locator('#pq10-growth').innerText();
   assert.match(growthText,/累計EXP [1-9]\d*/);
   await panel.locator('[data-pq9-view="shop"]').click();

   await panel.locator('[data-pq9-view="shop"]').click();
   const lantern=panel.locator('#pq9-shop .pq9-grid > div').filter({hasText:'星灯のランタン'});
   await lantern.getByRole('button',{name:'交換する',exact:true}).click();
   await page.locator('#pq9-reveal').waitFor({state:'visible'});
   await page.locator('#pq9-reveal').getByRole('button',{name:'閉じる',exact:true}).click();
   assert.equal(await lantern.getByRole('button',{name:'獲得済み',exact:true}).isDisabled(),true);
   await lantern.getByRole('button',{name:'遠征に展示',exact:true}).click();
   assert.match(await panel.locator('.pq9-hero').innerText(),/星灯のランタン/);
   await panel.locator('[data-pq9-view="growth"]').click();
   assert.equal(await panel.locator('#pq10-growth').innerText(),growthText,'spending cannot reduce EXP');
   console.log('PASS explorer growth and spending isolation '+viewport.width+'px');
   const codexBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   await panel.locator('[data-pq9-view="codex"]').click();
   const codex=panel.locator('#pq10-codex');
   assert.match(await codex.innerText(),/図鑑達成 2 \/ 40 種/);
   assert.equal(await codex.locator('[data-codex-id]').count(),40);
   await codex.getByLabel('図鑑 分類',{exact:true}).selectOption('gear');
   assert.equal(await codex.locator('[data-codex-id]').count(),8);
   await codex.getByLabel('図鑑 収集状況',{exact:true}).selectOption('found');
   assert.equal(await codex.locator('[data-codex-id]').count(),1);
   assert.match(await codex.innerText(),/星灯のランタン/);
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),codexBefore,'codex must be read-only');
   console.log('PASS 40-entry codex and filtering '+viewport.width+'px');


   assert.equal(await page.evaluate(()=>localStorage.getItem('poikatsu-quest-v01')),base,'ordinary save unchanged by expedition');
   await panel.locator('[data-pq9-view="map"]').click();
   await panel.getByRole('button',{name:/黄金の番兵/}).click();
   assert.equal(await panel.locator('#pq9-battle').isVisible(),true);
   await panel.getByRole('button',{name:/通常攻撃（MP/}).click();
   assert.match(await panel.locator('#pq9-battle').innerText(),/TURN 2/);
   assert.match(await panel.locator('.pq10-impact').innerText(),/敵 −\d+ HP/);
   assert.equal(await panel.locator('.pq10-impact .pq10-hit').evaluate(e=>getComputedStyle(e).animationName),'none');
   assert.equal(await panel.locator('.pq9-arena').getAttribute('data-region'),'market');
   console.log('PASS regional map, rarity reveal, actual hit feedback and reduced-motion support '+viewport.width+'px');

   await panel.getByRole('button',{name:'戦闘を中断',exact:true}).click();
   assert.equal(await panel.locator('#pq9-battle').isVisible(),false);
   await page.reload();await page.locator('nav[data-ui92="1"]').waitFor();await page.locator('#pq105-start').click();await page.locator('#pq105-title').waitFor({state:'hidden'});await page.locator('#home.active').waitFor();await seed();
   await gotoTab('expedition90');
   await panel.locator('[data-pq9-view="rewards"]').click();
   assert.equal(await panel.locator('#pq10-chests').innerText(),chestText,'fixed chest collection survives reload');
   console.log('PASS chest reveal and persistent receipt-derived collection '+viewport.width+'px');

   await panel.locator('[data-pq9-view="shop"]').click();
   assert.equal(await lantern.getByRole('button',{name:'獲得済み',exact:true}).isDisabled(),true);
   assert.match(await panel.locator('.pq9-hero').innerText(),/星灯のランタン/);
   assert.ok(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'expedition panel overflows');
   const snapshot=()=>page.evaluate(()=>({local:Object.entries(localStorage).sort(),save:JSON.stringify(s)}));
   const original=await snapshot();
   const calls=[];page.on('request',req=>{if(req.url().includes('/rest/v1/'))calls.push(req.url());});
   await panel.getByRole('button',{name:'🧪 遠征テストモード',exact:true}).click();
   const sandbox=page.locator('#pq91-sandbox');await sandbox.waitFor({state:'visible'});
   assert.match(await sandbox.innerText(),/1000 個/);
   await sandbox.getByRole('button',{name:'報酬',exact:true}).click();
   const row=sandbox.locator('span').filter({hasText:'黄金街道：宝箱'}).locator('..');
   await row.getByRole('button',{name:'受け取る',exact:true}).click();
   assert.match(await sandbox.innerText(),/1015 個/);
   assert.match(await sandbox.innerText(),/試験宝箱コレクション 1\/15/);
   assert.match(await sandbox.innerText(),/(N|R|SR|SSR|UR) (黄金の古銭|交易商の印章|琥珀の星砂|黄金王の羅針盤|太陽王の聖杯)/);

   assert.equal(await row.getByRole('button',{name:'受取済み',exact:true}).isDisabled(),true);
   await sandbox.getByRole('button',{name:'ショップ',exact:true}).click();
   const sword=sandbox.getByRole('heading',{name:/星断の剣/}).locator('..');
   await sword.getByRole('button',{name:'交換する',exact:true}).click();
   assert.match(await sandbox.innerText(),/955 個/);
   await sword.getByRole('button',{name:'遠征に展示',exact:true}).click();
   assert.match(await sandbox.innerText(),/展示中：星断の剣/);
   await sandbox.getByRole('button',{name:'遠征',exact:true}).click();
   await sandbox.getByRole('button',{name:'金煌の機竜',exact:true}).click();
   await sandbox.getByRole('button',{name:'通常攻撃',exact:true}).click();
   assert.match(await sandbox.innerText(),/TURN 2/);
   assert.match(await sandbox.innerText(),/星断の剣.*通常攻撃 \+4/);
   assert.equal(await sandbox.getByRole('button',{name:'浄化',exact:true}).isDisabled(),true);
   await sandbox.getByRole('button',{name:'通常攻撃',exact:true}).click();
   await sandbox.getByRole('button',{name:'通常攻撃',exact:true}).click();
   assert.match(await sandbox.innerText(),/火傷 残り2行動/);
   assert.equal(await sandbox.getByRole('button',{name:'浄化',exact:true}).isEnabled(),true);
   await sandbox.getByRole('button',{name:'浄化',exact:true}).click();
   assert.match(await sandbox.innerText(),/状態異常：なし/);
   await sandbox.getByRole('button',{name:'防御',exact:true}).click();
   assert.equal(await sandbox.getByRole('button',{name:'星界奥義',exact:true}).isEnabled(),true);
   await sandbox.getByRole('button',{name:'星界奥義',exact:true}).click();
   assert.match(await sandbox.innerText(),/勝利！/);
   await sandbox.getByRole('button',{name:'ガチャ',exact:true}).click();
   assert.match(await sandbox.innerText(),/URまであと最大 20 回/);
   await sandbox.getByRole('button',{name:'試験召喚（20星晶石）',exact:true}).click();
   assert.match(await sandbox.innerText(),/935 個/);
   assert.match(await sandbox.innerText(),/召喚成功：/);
   assert.match(await sandbox.innerText(),/1：(?:N|R|SR|SSR|UR) /);
   console.log('PASS isolated summon, shared wallet and result '+viewport.width+'px');
   await sandbox.getByRole('button',{name:'図鑑',exact:true}).click();
   assert.match(await sandbox.innerText(),/図鑑達成 3 \/ 40 種/);
   await sandbox.getByLabel('図鑑 分類',{exact:true}).selectOption('gacha');
   await sandbox.getByLabel('図鑑 収集状況',{exact:true}).selectOption('found');
   assert.equal(await sandbox.locator('[data-codex-id]').count(),1);
   assert.equal(await sandbox.locator('[data-found="true"]').count(),1);
   await sandbox.getByLabel('図鑑 収集状況',{exact:true}).selectOption('missing');
   assert.equal(await sandbox.locator('[data-codex-id]').count(),9);
   console.log('PASS sandbox codex filters '+viewport.width+'px');
   await sandbox.getByRole('button',{name:'戦闘',exact:true}).click();
   await sandbox.getByRole('button',{name:'戦闘を終了して遠征へ',exact:true}).click();
   assert.equal(await sandbox.getByRole('button',{name:'隠しボスに挑戦',exact:true}).isDisabled(),true);
   await sandbox.getByRole('button',{name:'隠しボス解放条件を試す',exact:true}).click();
   await sandbox.getByRole('button',{name:'炎',exact:true}).click();
   await sandbox.getByRole('button',{name:'隠しボスに挑戦',exact:true}).click();
   assert.match(await sandbox.innerText(),/虚空の星喰竜ノヴァ/);
   for(const label of ['星脈斬','防御','防御','星界奥義'])await sandbox.getByRole('button',{name:label,exact:true}).click();
   assert.match(await sandbox.innerText(),/形態 2 \/ 2/);
   assert.match(await sandbox.locator('.pq10-impact').innerText(),/虚空覚醒/);

   for(const label of ['防御','防御','星界奥義','防御','星脈斬'])await sandbox.getByRole('button',{name:label,exact:true}).click();
   assert.match(await sandbox.innerText(),/勝利！/);
   await sandbox.getByRole('button',{name:'勝利報酬を受取',exact:true}).click();
   assert.match(await sandbox.innerText(),/星晶石 ＋40/);
   assert.equal(await sandbox.getByRole('button',{name:'勝利報酬を受取',exact:true}).isDisabled(),true);
   console.log('PASS hidden boss two-phase combat and single claim '+viewport.width+'px');



   console.log('PASS enhanced combat, sword effect, status and cleanse '+viewport.width+'px');

   await sandbox.getByRole('button',{name:'試験データをリセット',exact:true}).click();
   assert.match(await sandbox.innerText(),/1000 個/);

   async function scenario(label){
    await sandbox.getByText('🧪 テスト条件を選ぶ（試験記録を入れ替え）',{exact:true}).click();
    await sandbox.getByRole('button',{name:label,exact:true}).click();
   }
   await scenario('未解放状態');
   assert.match(await sandbox.innerText(),/0\/9地点仮クリア/);
   assert.equal(await sandbox.getByRole('button',{name:'黄金の番兵',exact:true}).isDisabled(),true);
   await scenario('星晶石不足（0個）');
   assert.equal(await sandbox.getByRole('button',{name:'試験召喚（20星晶石）',exact:true}).isDisabled(),true);
   await scenario('育成・隠しボス解放済み');
   assert.match(await sandbox.innerText(),/Lv\.5/);
   assert.match(await sandbox.innerText(),/累計EXP 655/);
   await scenario('UR天井直前（19連済み）');
   assert.match(await sandbox.innerText(),/URまであと最大 1 回/);
   await sandbox.getByRole('button',{name:'試験召喚（20星晶石）',exact:true}).click();
   assert.equal(await sandbox.locator('.pq10-test-loot').getAttribute('data-rarity'),'UR');
   assert.match(await sandbox.innerText(),/URまであと最大 20 回/);
   await sandbox.getByText('レアリティ別演出を確認（消費なし）',{exact:true}).click();
   const beforePreview=await sandbox.locator('strong').first().innerText();
   await sandbox.getByRole('button',{name:'SSR 演出確認',exact:true}).click();
   assert.equal(await sandbox.locator('.pq10-test-loot').getAttribute('data-rarity'),'SSR');
   assert.match(await sandbox.locator('.pq10-test-loot').innerText(),/演出確認のみ・獲得なし/);
   assert.equal(await sandbox.locator('strong').first().innerText(),beforePreview);
   console.log('PASS locked, insufficient, growth, pity and free rarity preview '+viewport.width+'px');
   await sandbox.getByRole('button',{name:'テストを終了',exact:true}).click();
   await sandbox.waitFor({state:'detached'});
   assert.deepEqual(await snapshot(),original,'sandbox must not change normal state or storage');
   assert.deepEqual(calls,[],'sandbox must not call cloud');
   await panel.getByRole('button',{name:'🧪 遠征テストモード',exact:true}).click();
   assert.match(await sandbox.innerText(),/1000 個/);
   await sandbox.getByRole('button',{name:'テストを終了',exact:true}).click();
   console.log('PASS sandbox isolation '+viewport.width+'px');
   assert.deepEqual(errors,[],'browser errors');
   console.log('PASS integrated expedition UI '+viewport.width+'px');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
