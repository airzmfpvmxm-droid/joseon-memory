const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const {restartStoryProgress}=await import(require('url').pathToFileURL(path.join(root,'js/save-state.js')));
 const seed={completed:{1:true,6:true},best:{'1:assist':300},muted:false,last:8,snapshots:{6:{step:0}},story:{started:true,memories:8,phase:'done',line:0,notes:{1:1,8:0},caption:1,asked:['1:0'],reviewed:[1]}};
 const next=restartStoryProgress(seed);assert.equal(next.story.phase,'prologue');assert.equal(next.story.memories,0);assert.deepEqual(next.story.notes,{});assert.equal(next.completed[1],true);assert.equal(next.best['1:assist'],300);assert.equal(next.muted,false);assert.equal(seed.story.memories,8);
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{for(const viewport of [{width:1024,height:768},{width:768,height:1024},{width:1366,height:768}]){
 const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://joseon.test/**',async route=>{const url=new URL(route.request().url());const f=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!f.startsWith(root+path.sep))return route.fulfill({status:403});try{await route.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.woff':'font/woff'})[path.extname(f)]||'application/octet-stream'});}catch{await route.fulfill({status:404});}});
 await page.addInitScript(seed=>{if(!localStorage.getItem('qa-seeded')){localStorage.setItem('joseon-memory.play.v1',JSON.stringify(seed));localStorage.setItem('qa-seeded','1');}},seed);
 await page.goto('http://joseon.test/');
 const layout=async()=>{const r=await page.evaluate(()=>({overflow:document.documentElement.scrollHeight>innerHeight+1,clipped:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.bottom>innerHeight+1||r.top<0;}).map(e=>e.textContent)}));assert.equal(r.overflow,false);assert.deepEqual(r.clipped,[]);};
 await layout();const original=await page.evaluate(()=>localStorage.getItem('joseon-memory.play.v1'));
 await page.getByRole('button',{name:'처음부터 다시 시작',exact:true}).click();await layout();await page.getByRole('button',{name:'취소',exact:true}).click();assert.equal(await page.evaluate(()=>localStorage.getItem('joseon-memory.play.v1')),original);
 await page.getByRole('button',{name:'처음부터 다시 시작',exact:true}).click();await page.locator('#confirm-story-restart').click();await page.locator('[data-story-phase="prologue"]').waitFor();await layout();assert.match(await page.locator('.story-line').innerText(),/학교 전시/);
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('joseon-memory.play.v1')));assert.equal(state.story.memories,0);assert.deepEqual(state.story.notes,{});assert.equal(state.completed[6],true);assert.equal(state.best['1:assist'],300);assert.equal(state.muted,false);assert.deepEqual(state.snapshots,{});
 await page.reload();await page.locator('#story-continue').click();await page.locator('[data-story-phase="prologue"]').waitFor();assert.equal(errors.length,0);console.log(JSON.stringify({viewport,cancel:true,restart:true,persist:true,layout:true}));await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
