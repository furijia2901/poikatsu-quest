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

   const toolbar=page.locator('#pq105-toolbar'),menu=page.locator('#pq105-menu');
   await toolbar.getByRole('button',{name:'☰ メニュー',exact:true}).click();
   assert.equal(await menu.locator('[data-pq105-menu-id]').count(),28);
   const search=menu.getByRole('searchbox',{name:'コンテンツ検索'});
   await search.fill('星晶石');
   assert.equal(await menu.locator('[data-pq105-menu-id]').count(),1);
   await menu.locator('[data-pq105-menu-id="expedition90"]').click();
   await page.locator('#expedition90.active').waitFor();
   await toolbar.getByRole('button',{name:'☰ メニュー',exact:true}).click();
   await menu.locator('[data-pq105-menu-group="recent"]').click();
   assert.equal(await menu.locator('[data-pq105-menu-id]').first().getAttribute('data-pq105-menu-id'),'expedition90');
   await menu.getByRole('button',{name:'閉じる',exact:true}).click();
   await toolbar.getByRole('button',{name:'‹ 戻る',exact:true}).click();
   await page.locator('#home.active').waitFor();
   await toolbar.getByRole('button',{name:'☰ メニュー',exact:true}).click();
   await menu.locator('[data-pq105-menu-group="activity"]').click();
   assert.equal(await menu.locator('[data-pq105-menu-id]').count(),4);
   await menu.getByRole('searchbox').fill('該当しない検索');
   assert.match(await menu.innerText(),/一致するコンテンツがありません/);
   await menu.getByRole('searchbox').fill('');
   await menu.locator('[data-pq105-menu-id="quests"]').click();
   await page.locator('#quests.active').waitFor();
   await toolbar.getByRole('button',{name:'⌂ ホーム',exact:true}).click();
   await page.locator('#home.active').waitFor();
   console.log('PASS all-content menu, search, category, recent history, back and home '+viewport.width+'px');

   const profileEditor=page.locator('#pq105-profile-editor');
   const profileBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   await lobby.getByRole('button',{name:'🧪 プロフィール試験',exact:true}).click();
   await profileEditor.waitFor({state:'visible'});
   await profileEditor.getByRole('textbox',{name:/プレイヤー名/}).fill('テスト冒険者');
   await profileEditor.locator('[data-pq105-icon="dragon"]').click();
   await profileEditor.getByLabel('プロフィール用称号').selectOption('月夜の案内人');
   await profileEditor.getByLabel('ロビーのテーマ').selectOption('gold');
   assert.equal(await profileEditor.locator('.pq105-profile-preview').getAttribute('data-theme'),'gold');
   assert.match(await profileEditor.locator('.pq105-profile-preview').innerText(),/テスト冒険者/);
   await profileEditor.getByRole('button',{name:'試験保存',exact:true}).click();
   assert.match(await profileEditor.getByRole('status').innerText(),/本番変更なし/);
   await profileEditor.getByRole('button',{name:'初期値に戻す',exact:true}).click();
   assert.equal(await profileEditor.locator('.pq105-profile-preview').getAttribute('data-theme'),'astral');
   await profileEditor.getByRole('button',{name:'閉じる（未保存の変更を破棄）',exact:true}).click();
   await profileEditor.waitFor({state:'hidden'});
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),profileBefore);
   await lobby.getByRole('button',{name:'🎨 プロフィール編集',exact:true}).click();
   await profileEditor.getByRole('textbox',{name:/プレイヤー名/}).fill('ロビー確認用');
   await profileEditor.locator('[data-pq105-icon="fox"]').click();
   await profileEditor.getByLabel('プロフィール用称号').selectOption('星灯の旅人');
   await profileEditor.getByLabel('ロビーのテーマ').selectOption('forest');
   await profileEditor.getByRole('button',{name:'保存する',exact:true}).click();
   assert.equal(await lobby.getAttribute('data-profile-theme'),'forest');
   assert.equal(await lobby.locator('.pq105-custom-name').innerText(),'ロビー確認用');
   assert.equal(await lobby.locator('.pq105-emblem').innerText(),'🦊');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('pq105-profile-device-v1')));
   assert.equal(saved.name,'ロビー確認用');assert.equal(saved.theme,'forest');
   assert.equal(await page.evaluate(()=>JSON.stringify(s)),profileBefore.state);
   await profileEditor.getByRole('button',{name:'閉じる（未保存の変更を破棄）',exact:true}).click();
   await profileEditor.waitFor({state:'hidden'});
   await lobby.getByRole('button',{name:'🎨 プロフィール編集',exact:true}).click();
   assert.equal(await profileEditor.getByRole('textbox',{name:/プレイヤー名/}).inputValue(),'ロビー確認用');
   await profileEditor.getByRole('button',{name:'初期値に戻す',exact:true}).click();
   await profileEditor.getByRole('button',{name:'保存する',exact:true}).click();
   await profileEditor.getByRole('button',{name:'閉じる（未保存の変更を破棄）',exact:true}).click();
   await profileEditor.waitFor({state:'hidden'});
   await page.evaluate(()=>localStorage.removeItem('pq105-profile-device-v1'));
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),profileBefore);
   console.log('PASS cosmetic profile preview, test-mode isolation, explicit save, reset and original game preservation '+viewport.width+'px');

   const collection=page.locator('#pq105-collection');
   const collectionBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   await lobby.locator('[data-pq105-collection-open="inventory"]').click();
   assert.equal(await collection.locator('[data-pq105-collection-id]').count(),8);
   await collection.locator('[data-pq105-collection-tab="gacha"]').click();
   assert.equal(await collection.locator('[data-pq105-collection-id]').count(),11);
   await collection.getByRole('searchbox').fill('遠征');
   assert.equal(await collection.locator('[data-pq105-collection-id]').count(),1);
   await collection.locator('[data-pq105-collection-id="expedition-gacha"]').getByRole('button',{name:'召喚画面へ',exact:true}).click();
   await page.locator('#pq10-gacha').waitFor({state:'visible'});
   await page.locator('#pq105-toolbar').waitFor({state:'visible'});
   await gotoTab('home');
   await lobby.getByRole('button',{name:'🧪 コレクション試験',exact:true}).click();
   assert.match(await collection.innerText(),/SSR 試験星剣/);
   await collection.locator('[data-pq105-collection-tab="codex"]').click();
   assert.equal(await collection.locator('[data-pq105-collection-id]').count(),5);
   await collection.locator('[data-pq105-collection-id="festival-codex"]').getByRole('button',{name:'詳細を開く',exact:true}).click();
   assert.match(await collection.getByRole('status').innerText(),/本番画面は変更していません/);
   assert.equal(await page.locator('#home.active').count(),1);
   await collection.getByRole('searchbox').fill('該当しない');
   assert.match(await collection.innerText(),/該当するコンテンツはありません/);
   await collection.getByRole('button',{name:'試験初期化',exact:true}).click();
   assert.equal(await collection.locator('[data-pq105-collection-id]').count(),8);
   await collection.getByRole('button',{name:'閉じる',exact:true}).click();
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),collectionBefore);
   console.log('PASS collection center, 24 routes, search, direct navigation and isolated fixture '+viewport.width+'px');

   const inbox=page.locator('#pq105-inbox');
   const inboxBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   await lobby.getByRole('button',{name:/^📢 お知らせ/}).click();
   assert.equal(await inbox.locator('[data-pq105-news-id]').count(),4);
   await inbox.getByRole('button',{name:'イベント',exact:true}).click();
   assert.equal(await inbox.locator('[data-pq105-news-id]').count(),1);
   await inbox.getByRole('button',{name:'既読にする',exact:true}).click();
   assert.equal(await inbox.getByRole('button',{name:'既読',exact:true}).isDisabled(),true);
   await inbox.getByRole('button',{name:'閉じる',exact:true}).click();
   await lobby.getByRole('button',{name:/^🎁 プレゼント/}).click();
   assert.equal(await inbox.locator('[data-pq105-gift-id]').count(),6);
   await inbox.locator('[data-pq105-gift-id="daily"]').getByRole('button',{name:'受取・詳細画面へ'}).click();
   await page.locator('#loginBtn').waitFor({state:'visible'});
   await gotoTab('home');
   await lobby.getByRole('button',{name:'🧪 報酬試験',exact:true}).click();
   assert.equal(await inbox.locator('[data-status="ready"]').count(),2);
   assert.equal(await inbox.locator('[data-pq105-gift-id="expired"] button').isDisabled(),true);
   assert.equal(await inbox.locator('[data-pq105-gift-id="locked"] button').isDisabled(),true);
   await inbox.locator('[data-pq105-gift-id="welcome"] button').click();
   assert.match(await inbox.locator('#pq105-test-gift-balance').innerText(),/100G/);
   assert.equal(await inbox.locator('[data-pq105-gift-id="welcome"] button').isDisabled(),true);
   await inbox.getByRole('button',{name:'試験一括受取',exact:true}).click();
   assert.match(await inbox.locator('#pq105-test-gift-balance').innerText(),/140G/);
   assert.equal(await inbox.getByRole('button',{name:'試験一括受取',exact:true}).isDisabled(),true);
   await inbox.getByRole('button',{name:'試験初期化',exact:true}).click();
   assert.match(await inbox.locator('#pq105-test-gift-balance').innerText(),/0G/);
   await inbox.getByRole('button',{name:'閉じる',exact:true}).click();
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),inboxBefore);
   console.log('PASS news filters/read, native login route, isolated single and bulk reward claims, reset '+viewport.width+'px');

   const audio=page.locator('#pq105-audio');
   const audioBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   assert.equal(await page.locator('html').getAttribute('data-pq105-motion'),'on');
   await lobby.getByRole('button',{name:'🧪 サウンド試験',exact:true}).click();
   await audio.waitFor({state:'visible'});
   assert.equal(await audio.getByLabel('サウンドを有効にする').isChecked(),true);
   await audio.getByLabel('BGM音量',{exact:true}).fill('15');
   await audio.getByLabel('効果音音量',{exact:true}).fill('25');
   await audio.getByRole('button',{name:'タイトルBGM',exact:true}).click();
   await audio.getByRole('status').filter({hasText:'試聴中：タイトル'}).waitFor();
   await audio.getByRole('button',{name:'試聴停止',exact:true}).click();
   await audio.getByRole('button',{name:'報酬音',exact:true}).click();
   await audio.getByRole('status').filter({hasText:'効果音を試聴しました'}).waitFor();
   await audio.getByRole('button',{name:'試験保存',exact:true}).click();
   assert.match(await audio.getByRole('status').innerText(),/本番変更なし/);
   await audio.getByRole('button',{name:'閉じる',exact:true}).click();
   await audio.waitFor({state:'hidden'});
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),audioBefore);
   await lobby.getByRole('button',{name:'🔊 サウンド設定',exact:true}).click();
   assert.equal(await audio.getByLabel('サウンドを有効にする').isChecked(),false);
   await audio.getByLabel('画面切替アニメーション').uncheck();
   await audio.getByRole('button',{name:'保存する',exact:true}).click();
   assert.equal(await page.locator('html').getAttribute('data-pq105-motion'),'off');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pq105-audio-device-v1')).enabled),false);
   await audio.getByRole('button',{name:'初期値に戻す',exact:true}).click();
   await audio.getByRole('button',{name:'保存する',exact:true}).click();
   assert.equal(await page.locator('html').getAttribute('data-pq105-motion'),'on');
   await audio.getByRole('button',{name:'閉じる',exact:true}).click();
   await audio.waitFor({state:'hidden'});
   await page.evaluate(()=>localStorage.removeItem('pq105-audio-device-v1'));
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),audioBefore);
   console.log('PASS optional audio previews, volume controls, motion preferences, reset and save isolation '+viewport.width+'px');

   const center=page.locator('#pq105-tests');
   const centerBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   await lobby.getByRole('button',{name:'🧪 テストセンター',exact:true}).click();
   assert.equal(await center.locator('[data-pq105-check]').count(),10);
   await center.locator('[data-pq105-check="title"]').getByRole('button',{name:'PASS',exact:true}).click();
   assert.match(await center.locator('.pq105-test-summary').innerText(),/PASS 1 \/ 10/);
   assert.match(await center.getByRole('textbox',{name:'実機テスト結果'}).inputValue(),/タイトル・起動：PASS/);
   await center.locator('[data-pq105-check="profile"]').getByRole('button',{name:'確認画面へ'}).click();
   await profileEditor.waitFor({state:'visible'});
   assert.match(await profileEditor.innerText(),/テストモード/);
   await profileEditor.getByRole('button',{name:'閉じる（未保存の変更を破棄）',exact:true}).click();
   await lobby.getByRole('button',{name:'🧪 テストセンター',exact:true}).click();
   assert.match(await center.locator('.pq105-test-summary').innerText(),/PASS 1 \/ 10/);
   await center.locator('[data-pq105-check="collection"]').getByRole('button',{name:'確認画面へ'}).click();
   await collection.waitFor({state:'visible'});
   assert.match(await collection.innerText(),/SSR 試験星剣/);
   await collection.getByRole('button',{name:'閉じる',exact:true}).click();
   await lobby.getByRole('button',{name:'🧪 テストセンター',exact:true}).click();
   await center.locator('[data-pq105-check="gifts"]').getByRole('button',{name:'確認画面へ'}).click();
   await inbox.waitFor({state:'visible'});
   assert.match(await inbox.locator('#pq105-test-gift-balance').innerText(),/0G/);
   await inbox.getByRole('button',{name:'閉じる',exact:true}).click();
   await lobby.getByRole('button',{name:'🧪 テストセンター',exact:true}).click();
   await center.locator('[data-pq105-check="audio"]').getByRole('button',{name:'確認画面へ'}).click();
   await audio.waitFor({state:'visible'});
   assert.match(await audio.innerText(),/サウンド・演出試験/);
   await audio.getByRole('button',{name:'閉じる',exact:true}).click();
   await lobby.getByRole('button',{name:'🧪 テストセンター',exact:true}).click();
   await center.locator('[data-pq105-check="expedition"]').getByRole('button',{name:'確認画面へ'}).click();
   await page.locator('#pq91-sandbox').waitFor({state:'visible'});
   await page.locator('#pq91-sandbox').getByRole('button',{name:'テストを終了',exact:true}).click();
   await gotoTab('home');
   await lobby.getByRole('button',{name:'🧪 テストセンター',exact:true}).click();
   await center.getByRole('button',{name:'判定を初期化',exact:true}).click();
   assert.match(await center.locator('.pq105-test-summary').innerText(),/PASS 0 \/ 10/);
   await center.getByRole('button',{name:'閉じる',exact:true}).first().click();
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),centerBefore);
   console.log('PASS integrated test center fixture launch, result tracking, reset and data isolation '+viewport.width+'px');

   const townBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   await gotoTab('town');
   const town=page.locator('#pq11-town'),townTest=page.locator('#pq11-town-test');
   await town.waitFor({state:'visible'});
   assert.equal(await town.locator('.pq11-cell').count(),25);
   assert.equal(await town.locator('[data-pq11-facility]').count(),7);
   await town.locator('[data-pq11-facility="tower"]').click();
   assert.match(await town.locator('.pq11-detail').innerText(),/星見の塔/);
   await town.getByRole('button',{name:'既存の建設画面へ'}).click();
   await page.locator('#v50buildings').waitFor({state:'visible'});
   await gotoTab('town');
   await town.locator('[data-pq11-facility="inn"]').click();
   assert.match(await town.locator('.pq11-detail').innerText(),/宿屋/);
   await town.getByRole('button',{name:'既存の建設画面へ'}).click();
   await page.locator('#buildings').waitFor({state:'visible'});
   await town.getByRole('button',{name:'🧪 街づくり試験',exact:true}).click();
   await townTest.waitFor({state:'visible'});
   assert.match(await townTest.innerText(),/小さな村/);
   assert.equal(await townTest.locator('[data-built="true"]').count(),6);
   await townTest.getByRole('button',{name:'未建設・資金不足',exact:true}).click();
   assert.match(await townTest.innerText(),/開拓地/);
   assert.equal(await townTest.locator('[data-built="true"]').count(),0);
   await townTest.getByRole('button',{name:'最大レベル',exact:true}).click();
   assert.match(await townTest.innerText(),/星界首都/);
   assert.equal(await townTest.locator('[data-built="true"]').count(),7);
   assert.match(await townTest.locator('.pq11-detail').innerText(),/最大レベルに到達/);
   await townTest.getByRole('button',{name:'試験終了',exact:true}).click();
   assert.ok(await town.locator('.pq11-map').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'city map overflow');
   await gotoTab('home');
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),townBefore);
   console.log('PASS city map, seven legacy facilities, detail routing, empty/max fixtures and isolation '+viewport.width+'px');

   await gotoTab('town');
   const district=page.locator('#pq11-district'),districtTest=page.locator('#pq11-district-test');
   const districtBefore=await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()}));
   assert.equal(await district.locator('[data-pq11-plot]').count(),21);
   await district.getByRole('button',{name:'🧪 新区画建設試験',exact:true}).click();
   const plots=require('../district110.js').PLOTS;
   const plot=(p)=>districtTest.locator('[data-pq11-plot="'+p+'"]');
   await plot(plots[2]).click();
   await districtTest.getByLabel('建設施設').selectOption('warehouse');
   await districtTest.getByRole('button',{name:'建設 240G',exact:true}).click();
   assert.match(await districtTest.innerText(),/所持 4760G/);
   await districtTest.getByRole('button',{name:'強化 480G',exact:true}).click();
   assert.match(await districtTest.innerText(),/所持 4280G/);
   await districtTest.getByRole('button',{name:'移動先を選択',exact:true}).click();
   await plot(plots[0]).click();
   assert.equal(await districtTest.getByRole('button',{name:'ここへ移動（無料）',exact:true}).isDisabled(),true);
   await plot(plots[3]).click();
   await districtTest.getByRole('button',{name:'ここへ移動（無料）',exact:true}).click();
   assert.equal(await plot(plots[2]).getAttribute('data-built'),'false');
   assert.match(await plot(plots[3]).getAttribute('aria-label'),/倉庫 Lv.2/);
   assert.match(await districtTest.innerText(),/所持 4280G/);
   await districtTest.getByRole('button',{name:'資金不足',exact:true}).click();
   assert.equal(await districtTest.getByRole('button',{name:'建設 120G',exact:true}).isDisabled(),true);
   await districtTest.getByRole('button',{name:'全施設最大',exact:true}).click();
   assert.equal(await districtTest.getByRole('button',{name:'最大レベル',exact:true}).isDisabled(),true);
   await districtTest.getByRole('button',{name:'試験終了',exact:true}).click();
   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),districtBefore);
   await gotoTab('home');
   console.log('PASS district construction, upgrade, free move, occupied/poor/max, fixture isolation '+viewport.width+'px');










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
   await panel.locator('[data-pq9-view="map"]').click();
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
