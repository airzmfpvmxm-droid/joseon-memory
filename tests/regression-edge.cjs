const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=process.env.TEST_OUTPUT_DIR?path.resolve(process.env.TEST_OUTPUT_DIR,'edge-audit'):path.join(root,'test-results/edge-audit');fs.mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4190',embedded=!process.env.BASE_URL;
const result={date:new Date().toISOString(),checks:[]};
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))throw Error();const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.woff':'font/woff'})[ext]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
async function start(page,id){await page.locator(`[data-chapter="${id}"]`).click();await page.getByRole('button',{name:'차근차근 시작',exact:true}).click();}
async function roof(page){await page.getByRole('button',{name:'3행 3열 빈 자리',exact:true}).click();await page.getByRole('button',{name:'수리 마치기',exact:true}).click();}
(async()=>{if(embedded)await new Promise(r=>server.listen(4190,'0.0.0.0',r));const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 for(const [name,saved] of [['completed-type',{completed:true}],['best-type',{best:'bad'}],['grain-bad-step',{completed:{1:true},snapshots:{6:{step:99}}}],['grain-null-array',{completed:{1:true},snapshots:{6:{step:0,sorted:null}}}]]){
  const context=await browser.newContext({viewport:{width:1024,height:768}});await context.addInitScript(value=>{localStorage.setItem('joseon-memory.play.v1',JSON.stringify(value));},saved);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.getByRole('button',{name:'놀이 골라하기',exact:true}).click();await start(page,name.startsWith('grain')?6:3);
  if(!name.startsWith('grain'))await roof(page);
  await page.waitForTimeout(100);
  const check={name,pageErrors:errors,completion:await page.getByRole('heading',{name:'이야기 한 조각을 되찾았어요',exact:true}).count(),recoveryError:await page.getByRole('heading',{name:'놀이를 준비하지 못했어요',exact:true}).count(),grainUI:await page.locator('.grain-heading').count(),preservedChapter1:await page.locator('#memory-count').innerText()};
  check.passed=name.startsWith('grain')?check.grainUI>0&&check.recoveryError===0:check.completion>0&&errors.length===0;
  await page.screenshot({path:path.join(out,name+'.png')});result.checks.push(check);await context.close();
 }
 const context=await browser.newContext({viewport:{width:1024,height:768}});
 await context.addInitScript(()=>{const A=window.AudioContext||window.webkitAudioContext;if(A){const original=A.prototype.resume;A.prototype.resume=function(...args){if(window.__qaHoldResume){return new Promise((resolve,reject)=>setTimeout(()=>original.apply(this,args).then(resolve,reject),1300));}return original.apply(this,args);};}});
 const page=await context.newPage();await page.goto(base);await page.getByRole('button',{name:'놀이 골라하기',exact:true}).click();await page.locator('[data-chapter="4"]').click();await page.getByRole('button',{name:'놀이 시작',exact:true}).click();await page.waitForTimeout(300);await page.locator('#pause-button').click();await page.waitForTimeout(300);await page.evaluate(()=>window.__qaHoldResume=true);await page.getByRole('button',{name:'계속하기',exact:true}).click();await page.keyboard.press('Escape');const before=await page.locator('#game-time').innerText();await page.waitForTimeout(2700);const after=await page.locator('#game-time').innerText();result.checks.push({name:'late-audio-resume-repause',before,after,pausedDialog:await page.getByRole('heading',{name:'잠깐 쉬어 가요',exact:true}).isVisible(),passed:before===after});await page.screenshot({path:path.join(out,'late-audio-resume.png')});await context.close();
}finally{await browser.close();if(embedded)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,process.env.EDGE_RESULT_NAME||'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(result.checks.some(c=>!c.passed))process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
