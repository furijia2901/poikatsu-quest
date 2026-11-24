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
   const {GROUPS}=require('../ui92.js');
   async function gotoTab(id){
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
   assert.equal(await page.locator('#settings92 #cloud-panel').isVisible(),true);
   assert.equal(await page.locator('#settings92 #web-migration').isVisible(),true);
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

   assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(s),storage:Object.entries(localStorage).sort()})),navBefore,'navigation must not change game or storage');
   assert.ok(await page.locator('.pq92-categories').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'categories overflow');
   await page.locator('#home').getByRole('button',{name:'📜 依頼を見る',exact:true}).click();
   assert.equal(await page.locator('#quests.active').isVisible(),true,'legacy shortcut still works');
   assert.equal(await page.locator('[data-pq92-group="activity"]').getAttribute('aria-pressed'),'true');
   console.log('PASS all 28 UI screens, 6 categories, navigation isolation '+viewport.width+'px');
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
   await panel.locator('[data-pq9-view="rewards"]').click();
   const reward=panel.getByRole('button',{name:/受取可能な報酬を一括受取/});
   await reward.click();
   await page.locator('#pq9-reveal').waitFor({state:'visible'});
   await page.locator('#pq9-reveal').getByRole('button',{name:'閉じる',exact:true}).click();
   assert.equal(await reward.isDisabled(),true);
   await panel.locator('[data-pq9-view="shop"]').click();
   const lantern=panel.locator('#pq9-shop .pq9-grid > div').filter({hasText:'星灯のランタン'});
   await lantern.getByRole('button',{name:'交換する',exact:true}).click();
   await page.locator('#pq9-reveal').waitFor({state:'visible'});
   await page.locator('#pq9-reveal').getByRole('button',{name:'閉じる',exact:true}).click();
   assert.equal(await lantern.getByRole('button',{name:'獲得済み',exact:true}).isDisabled(),true);
   await lantern.getByRole('button',{name:'遠征に展示',exact:true}).click();
   assert.match(await panel.locator('.pq9-hero').innerText(),/星灯のランタン/);
   assert.equal(await page.evaluate(()=>localStorage.getItem('poikatsu-quest-v01')),base,'ordinary save unchanged by expedition');
   await panel.locator('[data-pq9-view="map"]').click();
   await panel.getByRole('button',{name:/黄金の番兵/}).click();
   assert.equal(await panel.locator('#pq9-battle').isVisible(),true);
   await panel.getByRole('button',{name:/通常攻撃（MP/}).click();
   assert.match(await panel.locator('#pq9-battle').innerText(),/TURN 2/);
   await panel.getByRole('button',{name:'戦闘を中断',exact:true}).click();
   assert.equal(await panel.locator('#pq9-battle').isVisible(),false);
   await page.reload();await page.locator('nav[data-ui92="1"]').waitFor();await seed();
   await gotoTab('expedition90');
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
   await sandbox.getByRole('button',{name:'試験データをリセット',exact:true}).click();
   assert.match(await sandbox.innerText(),/1000 個/);
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
