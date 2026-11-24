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
   await page.goto(url);await page.locator('button[data-tab="expedition90"]').waitFor();
   async function seed(){
    await page.evaluate(()=>{
     const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
     s.dailyQuestStats={[today]:{count:12,xp:500}};
     s.questHistory=['レシート','歩数・移動','アンケート','ゲーム','広告・ミニゲーム'].map((category,i)=>({id:'fixture'+i,day:today,category}));
    });
   }
   await seed();
   const base=await page.evaluate(()=>localStorage.getItem('poikatsu-quest-v01'));
   await page.locator('button[data-tab="expedition90"]').click();
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
   await page.reload();await seed();
   await page.locator('button[data-tab="expedition90"]').click();
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
   const chest=sandbox.locator('div').filter({has: sandbox.locator('span').filter({hasText:'黄金街道：宝箱'})}).filter({hasText:'黄金街道：宝箱'});
   const row=sandbox.locator('span').filter({hasText:'黄金街道：宝箱'}).locator('..');
   await row.getByRole('button',{name:'受け取る',exact:true}).click();
   assert.match(await sandbox.innerText(),/1015 個/);
   assert.equal(await row.getByRole('button',{name:'受取済み',exact:true}).isDisabled(),true);
   await sandbox.getByRole('button',{name:'ショップ',exact:true}).click();
   const sword=sandbox.locator('section').filter({has: sandbox.getByRole('heading',{name:/星断の剣/})}).last();
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
