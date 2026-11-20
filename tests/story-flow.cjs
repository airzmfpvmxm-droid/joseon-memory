const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
process.env.STORY_DRIVER_IMPORT='1';
const {finishChapter}=require('./browser-check.cjs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results/story');fs.mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4192',local=!process.env.BASE_URL;
const results={checks:[],errors:[]};
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,base).pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+path.sep))throw Error();const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.woff':'font/woff','.svg':'image/svg+xml'})[ext]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
function record(name,value){results.checks.push({name,...value});console.log(name,JSON.stringify(value));}
async function forward(page){while(await page.getByRole('button',{name:'다음 이야기',exact:true}).count())await page.getByRole('button',{name:'다음 이야기',exact:true}).click();}
async function layout(page,name){const r=await page.evaluate(()=>({overflow:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth,clipped:[...document.querySelectorAll('button,.story-line,.memory-painting')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1}).map(e=>e.textContent)}));record(name,r);assert.equal(r.overflow,false);assert.equal(r.clipped.length,0);await page.screenshot({path:path.join(out,name+'.png')});}
(async()=>{if(local)await new Promise(r=>server.listen(4192,'0.0.0.0',r));const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const context=await browser.newContext({viewport:{width:1024,height:768}}),page=await context.newPage();page.on('pageerror',e=>results.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)results.errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(base);await layout(page,'hub-1024x768');await page.locator('#story-continue').click();await layout(page,'prologue-1024x768');await forward(page);await page.getByRole('button',{name:'첫 번째 풍경으로',exact:true}).click();
 await page.getByRole('button',{name:'다음 이야기',exact:true}).click();const text=await page.locator('.story-line').innerText();await page.reload();await page.locator('#story-continue').click();assert.equal(await page.locator('.story-line').innerText(),text);record('dialogue-reload',{passed:true});
 for(let id=1;id<=8;id++){
  await forward(page);await layout(page,`before-${id}`);await page.getByRole('button',{name:'천천히 함께하기',exact:true}).click();await finishChapter(page,id,true);
  await page.getByRole('button',{name:'주민에게 돌아가기',exact:true}).click();await forward(page);await layout(page,`after-${id}`);await page.getByRole('button',{name:'그림에 기억 남기기',exact:true}).click();assert.equal(await page.locator('.painting-strip.restored').count(),id);record(`story-chapter-${id}`,{passed:true,restored:id});await layout(page,`restored-${id}`);await page.getByRole('button',{name:id===8?'마지막 이야기로':'다음 풍경으로',exact:true}).click();
 }
 await layout(page,'ending-1024x768');await forward(page);await page.getByRole('button',{name:'완성한 그림 보기',exact:true}).click();await page.reload();assert.equal(await page.locator('.painting-strip.restored').count(),8);record('ending-saved',{passed:true});
 await page.getByRole('button',{name:'놀이 골라하기',exact:true}).click();assert.equal(await page.locator('[data-chapter]').count(),8);record('practice-retained',{passed:true});await context.close();
 for(const viewport of [{width:768,height:1024},{width:1366,height:768}]){const c=await browser.newContext({viewport}),p=await c.newPage();await p.goto(base);await layout(p,`hub-${viewport.width}x${viewport.height}`);await p.locator('#story-continue').click();await layout(p,`prologue-${viewport.width}x${viewport.height}`);await forward(p);await p.getByRole('button',{name:'첫 번째 풍경으로',exact:true}).click();await layout(p,`before-${viewport.width}x${viewport.height}`);await c.close();}
 assert.equal(results.errors.length,0);
}finally{await browser.close();if(local)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
