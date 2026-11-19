/* Actual Chrome UI checks. No application state or answers are injected. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
let pw;
try { pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { pw = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const embedded = process.env.EMBEDDED_SERVER === '1';
const base = process.env.BASE_URL || (embedded?'http://127.0.0.1:4180':'http://127.0.0.1:4173');
const localRoutes = process.env.LOCAL_ROUTES === '1';
const appRoot = path.resolve(__dirname, '..');
const output = process.env.TEST_OUTPUT_DIR ? path.resolve(process.env.TEST_OUTPUT_DIR) : path.resolve(__dirname, '../test-results');
fs.mkdirSync(output, { recursive: true });
const findings = { date: new Date().toISOString(), browser: 'Chrome headless', base:localRoutes?'http://joseon.test/':base, transport:localRoutes?'Playwright fulfills the original repository file bytes; no application state injection':'HTTP server', checks: [], errors: [] };
function record(name, value) { findings.checks.push({ name, ...value }); console.log(name, JSON.stringify(value)); }
async function layout(page, name) {
  const result = await page.evaluate(() => {
    const w = innerWidth, h = innerHeight;
    const visible = [...document.querySelectorAll('button')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
    return {
      viewport: [w,h], document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      overflow: document.documentElement.scrollWidth > w + 1 || document.documentElement.scrollHeight > h + 1,
      clippedButtons: visible.filter(e => { const r=e.getBoundingClientRect(); return r.left < -1 || r.top < -1 || r.right > w+1 || r.bottom > h+1; }).map(e=>e.textContent.trim()).filter(Boolean)
    };
  });
  record(name, result);
  await page.screenshot({ path: path.join(output, `${name}.png`) });
  return result;
}
async function load(page) {
  if (localRoutes) {
    await page.route('http://joseon.test/**', async route=>{
      const pathname=decodeURIComponent(new URL(route.request().url()).pathname);
      const file=path.resolve(appRoot,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
      if(!file.startsWith(appRoot+path.sep)){await route.fulfill({status:403});return;}
      const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff'};
      try{await route.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}
      catch{findings.errors.push({missingFile:file});await route.fulfill({status:404,body:'Not found'});}
    });
  }
  await page.goto(localRoutes?'http://joseon.test/':base,{waitUntil:'networkidle'});
}
async function begin(page,id,assist=true) {
  await page.locator(`[data-chapter="${id}"]`).click();
  await page.getByRole('button',{name:assist?'차근차근 시작':'놀이 시작',exact:true}).click();
  await page.locator(`.play-shell[data-game="${id}"]`).waitFor();
}
async function finishPuzzleRoute(page, assist) {
  const paths=[[[0,0],[0,1],[1,1],[1,2],[2,2],[2,3],[3,3]],[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]],[[0,0],[0,1],[0,2],[1,2],[1,1],[2,1],[3,1],[3,2],[3,3]]];
  const dirs=[[-1,0],[0,1],[1,0],[0,-1]],names=['북','동','남','서'];
  for(let round=0;round<3;round++) {
    if(assist){await page.locator('.route-tile.puzzle-hint').click();}
    else {
      const routePath=paths[round];
      for(let k=0;k<routePath.length;k++){
        const p=routePath[k], before=k?dirs.findIndex(([y,x])=>p[0]+y===routePath[k-1][0]&&p[1]+x===routePath[k-1][1]):3;
        const after=k<routePath.length-1?dirs.findIndex(([y,x])=>p[0]+y===routePath[k+1][0]&&p[1]+x===routePath[k+1][1]):1;
        const tile=page.locator(`.route-tile[data-cell="${p[0]*4+p[1]}"]`);
        for(let turn=0;turn<4;turn++){
          const label=await tile.getAttribute('aria-label');
          if(label.includes(names[before])&&label.includes(names[after]))break;
          await tile.click();
        }
      }
    }
    await page.getByRole('button',{name:'수레 출발',exact:true}).click();
  }
}
async function finishLetters(page) {
  const syllables={나:['ㄴ','ㅏ'],무:['ㅁ','ㅜ'],바:['ㅂ','ㅏ'],다:['ㄷ','ㅏ'],라:['ㄹ','ㅏ']};
  for(const word of ['나','나무','바다','나라']){
    for(let i=0;i<word.length;i++)for(let j=0;j<2;j++){
      await page.locator('.letters-jamo').filter({hasText:new RegExp('^'+syllables[word[i]][j]+'$')}).click();
      await page.getByRole('button',{name:`${i+1}번째 글자 ${j?'모음':'자음'} 칸 비어 있음`,exact:true}).click();
    }
    await page.getByRole('button',{name:'주민에게 전하기',exact:true}).click();
  }
}
async function finishGrain(page,assist) {
  const labels=['첫째','둘째','셋째','넷째','다섯째','여섯째'],damaged=[true,false,true,false,false,true];
  for(let i=0;i<6;i++){
    await page.getByRole('button',{name:`${labels[i]} 표본 관찰`,exact:true}).click();
    await page.getByRole('button',{name:damaged[i]?'손상 흔적이 보여요':'더 확인해 봐야 해요',exact:true}).click();
  }
  await page.getByRole('button',{name:'되 계량 연습으로',exact:true}).click();
  for(const target of [1,2]){
    if(assist){await page.locator('#assist-button').click();await page.getByRole('button',{name:'조금 붓기 +0.1되',exact:true}).click();}
    else {for(let n=0;n<Math.floor(target/.3);n++)await page.getByRole('button',{name:'크게 붓기 +0.3되',exact:true}).click();for(let n=0;n<(target===1?1:2);n++)await page.getByRole('button',{name:'조금 붓기 +0.1되',exact:true}).click();}
    await page.getByRole('button',{name:'이 양으로 확인',exact:true}).click();
  }
  for(const title of ['봄의 대여 기록 확인','가을의 요구 쪽지 확인','피해 곡식에 대한 증언 확인'])await page.getByRole('button',{name:title,exact:true}).click();
  await page.getByRole('button',{name:'11되',exact:true}).click();
  await page.getByRole('button',{name:'4되',exact:true}).click();
  await page.getByRole('button',{name:'봄 기록 11되 + 쪽지의 아전 몫 4되',exact:true}).click();
  await page.getByRole('button',{name:'품질 고충도 함께 전하기',exact:true}).click();
  await page.getByRole('button',{name:'막동에게 조사 결과 전하기',exact:true}).click();
}
async function finishChapter(page,id,assist=true){
  if(id===1)await finishPuzzleRoute(page,assist);
  if(id===2)await finishLetters(page);
  if(id===3){await page.getByRole('button',{name:'3행 3열 빈 자리',exact:true}).click();await page.getByRole('button',{name:'수리 마치기',exact:true}).click();}
  if(id===4)for(let i=0;i<3;i++)await page.locator('.action-assist-card button').filter({hasText:'안전'}).first().click();
  if(id===5)for(const side of ['오른쪽으로 힘주기','왼쪽으로 힘주기','오른쪽으로 힘주기'])await page.getByRole('button',{name:side,exact:true}).click();
  if(id===6)await finishGrain(page,assist);
  if(id===7){await page.keyboard.press('f');await page.keyboard.press('j');await page.getByRole('button',{name:'쉼 · 소리를 잠깐 쉬어요',exact:true}).click();}
  if(id===8)for(const title of ['돛대의 붉은 천','나루터 표지','산기슭 정자','먼 집 지붕']){await page.locator('#assist-button').click();const target=page.getByRole('button',{name:title+' 관찰',exact:true});record('observation-target-'+title,await target.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{bounds:{x:r.x,y:r.y,width:r.width,height:r.height},pointerEvents:s.pointerEvents,zIndex:s.zIndex,atCenter:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,200)}}));await target.click({timeout:8000});}
  await page.getByRole('heading',{name:'이야기 한 조각을 되찾았어요',exact:true}).waitFor();
}
async function longChecks(browser){
  await Promise.all([4,7].map(async id=>{
    const context=await browser.newContext({viewport:{width:1024,height:768}}),page=await context.newPage();
    page.on('pageerror',e=>findings.errors.push({chapter:id,error:e.message}));
    await load(page);await begin(page,id,false);
    if(id===7)await page.getByRole('button',{name:'합주 시작',exact:true}).click();
    const started=Date.now();let moves=0,captured=false;
    while(Date.now()-started<90000){
      const seconds=(Date.now()-started)/1000;
      if(await page.locator('#overlay[open]').count())break;
      if(id===4 && seconds>moves*5){await page.getByRole('button',{name:moves%2?'왼쪽 길':'오른쪽 길',exact:true}).click();moves++;}
      if(id===7 && seconds>4){
        const rest=page.getByRole('button',{name:'소리를 잠깐 쉬었어요',exact:true});
        if(await rest.count()){await rest.click();break;}
        await page.keyboard.press(moves++%2?'j':'f');
      }
      if(!captured&&seconds>12){await layout(page,`normal-live-${id}`);captured=true;}
      await page.waitForTimeout(id===4?400:230);
    }
    await page.getByRole('heading',{name:'이야기 한 조각을 되찾았어요',exact:true}).waitFor({timeout:5000});
    record(`normal-full-duration-${id}`,{passed:true,seconds:Math.round((Date.now()-started)/1000),result:await page.locator('#dialog-content').innerText(),input:'actual button/key events; no clock/state manipulation'});
    await page.screenshot({path:path.join(output,`normal-result-${id}.png`)});await context.close();
  }));
}
async function main() {
  let server;
  if(embedded){server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,base).pathname);const file=path.resolve(appRoot,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));if(!file.startsWith(appRoot+path.sep)){res.writeHead(403);return res.end();}const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff'};const body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}});await new Promise(resolve=>server.listen(Number(new URL(base).port)||4180,'0.0.0.0',resolve));}
  const browser = await pw.chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    if(process.env.ONLY_LONG==='1')await longChecks(browser);
    else for (const viewport of [{width:1024,height:768},{width:768,height:1024},{width:1366,height:768}]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.on('pageerror', e=>findings.errors.push({viewport,error:e.message}));
      page.on('console', m=>{if(m.type()==='error') findings.errors.push({viewport,console:m.text()});});
      page.on('response',r=>{if(r.status()>=400)findings.errors.push({viewport,status:r.status(),url:r.url()});});
      await load(page);
      await layout(page, `home-${viewport.width}x${viewport.height}`);
      record(`home-buttons-${viewport.width}`, { buttons: await page.getByRole('button').allTextContents() });
      for(let id=1;id<=8;id++){
        if(process.env.ONLY_CHAPTER && Number(process.env.ONLY_CHAPTER)!==id)continue;
        await begin(page,id,true);
        await layout(page, `game-${id}-${viewport.width}x${viewport.height}`);
        if(viewport.width===1024){
          await finishChapter(page,id,true);
          await layout(page,`result-${id}-${viewport.width}x${viewport.height}`);
          record(`assisted-complete-${id}`,{passed:true,method:'actual buttons and keyboard'});
          await page.getByRole('button',{name:'마을로',exact:true}).click();
        }else{await page.locator('#pause-button').click();await page.getByRole('button',{name:'마을로',exact:true}).click();}
      }
      if(viewport.width===1024&&!process.env.ONLY_CHAPTER){
        await page.reload({waitUntil:'networkidle'});
        record('save-after-reload',{completedCards:await page.locator('.chapter-state.done').count(),memoryText:await page.locator('#memory-count').innerText()});
        for(const id of [1,6]){await begin(page,id,false);await finishChapter(page,id,false);record(`normal-complete-${id}`,{passed:true});if(id===1){await page.keyboard.press('Escape');record('result-escape-home',{passed:await page.locator('[data-chapter]').count()===8});}else await page.getByRole('button',{name:'마을로',exact:true}).click();}
        await begin(page,4,false);await page.getByRole('button',{name:'왼쪽 길',exact:true}).click();await page.locator('#pause-button').click();const time=await page.locator('#game-time').innerText();await page.waitForTimeout(1300);record('runner-pause',{timeBefore:time,timeAfter:await page.locator('#game-time').innerText(),passed:time===await page.locator('#game-time').innerText()});await page.getByRole('button',{name:'계속하기',exact:true}).click();await page.locator('#pause-button').click();await page.getByRole('button',{name:'마을로',exact:true}).click();
      }
      await context.close();
    }
    if(process.env.ONLY_LONG!=='1'&&!process.env.ONLY_CHAPTER){
      const touchContext=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true});const touchPage=await touchContext.newPage();await load(touchPage);await touchPage.locator('[data-chapter="4"]').tap();await touchPage.getByRole('button',{name:'차근차근 시작',exact:true}).tap();for(let i=0;i<3;i++)await touchPage.locator('.action-assist-card button').filter({hasText:'안전'}).first().tap();record('touch-emulation-ch04',{passed:await touchPage.getByRole('heading',{name:'이야기 한 조각을 되찾았어요',exact:true}).isVisible(),physicalDevice:false});await touchContext.close();
      const blocked=await browser.newContext({viewport:{width:1024,height:768}});await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('QA storage unavailable','QuotaExceededError')};});const blockedPage=await blocked.newPage();await load(blockedPage);await begin(blockedPage,3,true);await finishChapter(blockedPage,3,true);record('storage-failure-completion',{passed:await blockedPage.getByRole('heading',{name:'이야기 한 조각을 되찾았어요',exact:true}).isVisible(),warning:await blockedPage.locator('#save-status').innerText(),faultInjection:'Storage.setItem throws; no completion state injection'});await blocked.close();
      const keyboard=await browser.newContext({viewport:{width:1024,height:768}});const keyboardPage=await keyboard.newPage();await load(keyboardPage);for(let i=0;i<4;i++)await keyboardPage.keyboard.press('Tab');await keyboardPage.keyboard.press('Enter');await keyboardPage.getByRole('button',{name:'놀이 시작',exact:true}).waitFor();await keyboardPage.keyboard.press('Enter');await keyboardPage.keyboard.press('Escape');record('keyboard-tab-enter-escape',{passed:await keyboardPage.getByRole('heading',{name:'잠깐 쉬어 가요',exact:true}).isVisible(),scope:'home chapter1 selection, start, pause'});await keyboard.close();
    }
  } finally {
    await browser.close();
    if(server)await new Promise(resolve=>server.close(resolve));
    fs.writeFileSync(path.join(output,process.env.ONLY_LONG==='1'?'browser-results-long.json':'browser-results.json'),JSON.stringify(findings,null,2));
  }
  if (findings.errors.length || findings.checks.some(c=>c.overflow||c.clippedButtons?.length)) process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
