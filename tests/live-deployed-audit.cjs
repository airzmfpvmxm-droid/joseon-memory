/* Reads an existing owner access token only from hidden stdin. Never stores it. */
const path=require('node:path');
async function input(){
  if(process.stdin.isTTY){process.stdin.setRawMode(true);process.stderr.write('Ready for private-site test access on stdin (hidden).\n');}
  const value=await new Promise((resolve,reject)=>{let buffer='';const done=()=>{process.stdin.removeAllListeners('data');if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();resolve(buffer.trim());};process.stdin.setEncoding('utf8');process.stdin.on('data',part=>{buffer+=part;if(buffer.includes('\u0003'))reject(Error('Test cancelled'));else if(/[\r\n]/.test(buffer))done();});process.stdin.resume();});
  return JSON.parse(value);
}
(async()=>{
  const config=await input();
  const origin=new URL(config.url).origin;
  if(origin!=='https://joseon-memory-play.chlalsgh.chatgpt.site')throw Error('Unexpected test destination');
  let pw;try{pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');}catch{pw=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');}
  const launch=pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch=async options=>{
    const proxyAddress=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
    if(proxyAddress){const p=new URL(proxyAddress);options={...options,proxy:{server:p.protocol+'//'+p.host,...(p.username?{username:decodeURIComponent(p.username),password:decodeURIComponent(p.password)}:{})}};}
    console.log('Launching authenticated browser test using the existing network configuration.');
    const browser=await launch(options),newContext=browser.newContext.bind(browser);
    browser.newContext=async options=>{
      const context=await newContext(options);
      context.setDefaultNavigationTimeout(20000);
      await context.route(origin+'/**',route=>route.continue({headers:{...route.request().headers(),'OAI-Sites-Authorization':'Bearer '+config.token}}));
      return context;
    };
    return browser;
  };
  process.env.BASE_URL=config.url;
  process.env.TEST_OUTPUT_DIR=path.resolve(__dirname,'../test-results/live-deployed');
  process.env.EMBEDDED_SERVER='0';process.env.LOCAL_ROUTES='0';
  require(process.env.LIVE_EDGE==='1'?'./regression-edge.cjs':'./browser-check.cjs');
})().catch(()=>{console.error('Could not initialize the authenticated live-site test. No credentials were logged.');process.exitCode=1;});
