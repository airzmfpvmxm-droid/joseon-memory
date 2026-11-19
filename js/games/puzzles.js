// Original casual minigames. Shared scene shell supplies focus, pause and result UI.
function lifecycle(ctx, seconds) {
  let paused = false, ended = false, time = seconds, free = ctx.isAssist();
  const cleanups = [];
  const timer = setInterval(() => {
    if (paused || ended || free || !time) return;
    time = Math.max(0, time - 1); ctx.setTime(time);
    if (!time) { free = true; ctx.setTime(null); ctx.say('시간 도전이 끝났어요. 지금 판을 시간 없이 이어서 완성해 보세요.'); }
  }, 1000);
  cleanups.push(() => clearInterval(timer)); ctx.setTime(free ? null : time);
  return {
    get active() { return !paused && !ended; },
    done(data) { if (ended) return; ended = true; ctx.complete({...data, assisted:free || ctx.isAssist()}); },
    onCleanup(fn) { cleanups.push(fn); },
    pause() { paused = true; }, resume() { paused = false; },
    assist() { free = true; ctx.setTime(null); },
    destroy() { ended = true; cleanups.forEach(fn => fn()); }
  };
}
function make(ctx, tag, className, text) { return ctx.el(tag, className, text); }
const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const dirNames = ['북', '동', '남', '서'];
function direction(a, b) { return dirs.findIndex(([y, x]) => a[0] + y === b[0] && a[1] + x === b[1]); }
const routePaths = [
  [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3],[3,3]],
  [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]],
  [[0,0],[0,1],[0,2],[1,2],[1,1],[2,1],[3,1],[3,2],[3,3]]
];

export function createRoute(ctx) {
  const life = lifecycle(ctx, 90); let round = 0, selected = 0;
  let tiles = [], buttons = [], path = [], assistRound = false;
  const panel = make(ctx, 'div', 'puzzle-panel route-panel');
  const caption = make(ctx, 'p', 'puzzle-caption');
  const board = make(ctx, 'div', 'route-board'); board.setAttribute('role', 'group'); board.setAttribute('aria-label', '한양 길 회전 판');
  const markers = make(ctx, 'div', 'route-markers'); markers.innerHTML = '<span>목수 출발</span><span>목적지 · 경복궁</span>';
  panel.append(caption, markers, board); ctx.mount.append(panel);
  const info = make(ctx, 'span', 'puzzle-control-note', '길을 누르면 90도 돌아가요.');
  function ends(t) { return t.base.map(d => (d + t.rot) % 4); }
  function art(t) {
    const strokes = ends(t).map(d => ['M50 50 V0','M50 50 H100','M50 50 V100','M50 50 H0'][d]).join(' ');
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="route-road-edge" d="${strokes}"/><path class="route-road" d="${strokes}"/><circle cx="50" cy="50" r="5" fill="#bc8b4b"/></svg>`;
  }
  function draw() {
    tiles.forEach((t, i) => { buttons[i].innerHTML = art(t); buttons[i].setAttribute('aria-label', `${Math.floor(i / 4)+1}행 ${i%4+1}열 길, ${ends(t).map(d=>dirNames[d]).join('·')}`); buttons[i].classList.toggle('route-endpoint', i===0 || i===15); });
  }
  function solved() {
    if (!ends(tiles[0]).includes(3) || !ends(tiles[15]).includes(1)) return false;
    const seen = new Set([0]), queue = [0];
    while (queue.length) {
      const i = queue.shift(); if (i === 15) return true;
      for (const d of ends(tiles[i])) {
        const y = Math.floor(i/4)+dirs[d][0], x=i%4+dirs[d][1], n=y*4+x;
        if (y<0 || y>3 || x<0 || x>3 || seen.has(n)) continue;
        if (ends(tiles[n]).includes((d+2)%4)) { seen.add(n); queue.push(n); }
      }
    } return false;
  }
  function load() {
    path = routePaths[round]; assistRound = ctx.isAssist();
    markers.lastElementChild.textContent='목적지 · '+['경복궁','종묘','사직단'][round];
    tiles = Array.from({length:16}, (_,i) => ({base:i%2 ? [0,1] : [1,3], rot:0}));
    path.forEach((p,k) => { tiles[p[0]*4+p[1]] = {base:[k ? direction(p,path[k-1]) : 3, k<path.length-1 ? direction(p,path[k+1]) : 1],rot:0}; });
    const changed = path.slice(1, round+3);
    changed.forEach((p,k)=> {tiles[p[0]*4+p[1]].rot=(k%3)+1;});
    board.replaceChildren(); buttons = tiles.map((_,i) => {
      const b = ctx.button('', () => { if (!life.active) return; selected=i; tiles[i].rot=(tiles[i].rot+1)%4; draw(); ctx.sound('tap'); }, 'route-tile');
      b.dataset.cell=String(i); board.append(b); return b;
    });
    caption.textContent = `길 ${round+1} / 3 · 출발에서 목적지까지 연결해요`;
    ctx.setProgress(round/3, `길 ${round}/3`); draw();
    if (assistRound) help();
  }
  function help() {
    life.assist(); assistRound=true;
    path.forEach(p => tiles[p[0]*4+p[1]].rot=0);
    const p=path[1]; selected=p[0]*4+p[1]; tiles[selected].rot=3; draw();
    buttons.forEach((b,i)=>b.classList.toggle('puzzle-hint', i===selected));
    ctx.say('반짝이는 길 하나를 한 번 돌린 뒤 수레를 출발시켜 보세요.');
  }
  const go=ctx.button('수레 출발',()=>{
    if (!life.active) return;
    if (!solved()) {ctx.say('길이 아직 끊겨 있어요. 이웃한 길의 입구와 출구를 이어 주세요.');ctx.sound('soft');return;}
    ctx.sound('success');round++;
    if(round===3) life.done({score:300,message:'경복궁·종묘·사직단으로 가는 길을 이었어요. 궁궐, 왕실의 제사 공간, 땅과 곡식의 제사 공간은 역할이 달랐어요.'});
    else {ctx.say('수레가 도착했어요! 다음 동네의 길도 이어 볼까요?');load();}
  },'primary');
  ctx.controls.append(info,ctx.button('길 도움',help),go);
  const key=e=>{if(!life.active || !board.contains(document.activeElement))return;selected=Number(document.activeElement.dataset.cell);let n=selected;
    if(e.key==='ArrowLeft')n=Math.max(0,selected-1);else if(e.key==='ArrowRight')n=Math.min(15,selected+1);else if(e.key==='ArrowUp')n=Math.max(0,selected-4);else if(e.key==='ArrowDown')n=Math.min(15,selected+4);else return;
    e.preventDefault();selected=n;buttons[n].focus();};
  board.addEventListener('keydown',key);life.onCleanup(()=>board.removeEventListener('keydown',key));
  load();ctx.say('길 조각을 돌려 목수의 수레가 지나갈 길을 만드세요.');
  return {...life,assist:help};
}

const syllables = {나:['ㄴ','ㅏ'],무:['ㅁ','ㅜ'],바:['ㅂ','ㅏ'],다:['ㄷ','ㅏ'],라:['ㄹ','ㅏ']};
export function createLetters(ctx) {
  const life=lifecycle(ctx,75);const requests=['나','나무','바다','나라'];let step=0,chosen=null,placed=[];
  const panel=make(ctx,'div','puzzle-panel letters-panel');
  const request=make(ctx,'h2','letters-request');
  const work=make(ctx,'div','letters-work');const palette=make(ctx,'div','letters-palette');
  panel.append(request,work,palette);ctx.mount.append(panel);
  const info=make(ctx,'span','puzzle-control-note','자모 선택 → 빈칸 선택');
  function required(){return [...requests[step]].flatMap(c=>syllables[c]);}
  function draw(){
    request.textContent=(step===0?'먼저 연습해요 · ':'주민의 부탁 · ')+requests[step];
    work.replaceChildren();
    [...requests[step]].forEach((c,i)=>{
      const group=make(ctx,'div','letters-syllable'); const preview=make(ctx,'div','letters-preview',placed[i*2]&&placed[i*2+1]?c:'');
      group.append(preview);
      syllables[c].forEach((expected,j)=>{
        const k=i*2+j,b=ctx.button(placed[k]|| (j?'모음':'자음'),()=>{
          if(!life.active)return;
          if(!chosen){ctx.say('아래에서 넣을 자모를 먼저 골라 주세요.');return;}
          if(chosen!==expected){ctx.say(`${i+1}번째 글자의 ${j?'모음':'자음'}을 다시 살펴봐요. 도움을 누르면 다음 조각을 알려 줘요.`);ctx.sound('soft');return;}
          placed[k]=chosen;chosen=null;draw();ctx.sound('tap');
          if(required().every((v,k)=>placed[k]===v))ctx.say('글자가 완성됐어요. 주민에게 전해 주세요.');
        },'letters-slot');b.setAttribute('aria-label',`${i+1}번째 글자 ${j?'모음':'자음'} 칸 ${placed[k]||'비어 있음'}`);group.append(b);
      });work.append(group);
    });
    palette.replaceChildren();['ㄴ','ㅁ','ㅂ','ㄷ','ㄹ','ㅏ','ㅜ'].forEach(c=>{
      const b=ctx.button(c,()=>{if(!life.active)return;chosen=c;draw();ctx.say(`${c} 선택. 넣을 칸을 눌러 주세요.`);},'letters-jamo');
      b.setAttribute('aria-pressed',String(chosen===c));palette.append(b);
    });ctx.setProgress(step/4,step===0?'연습':`부탁 ${step}/3`);
  }
  function help(){life.assist();const k=required().findIndex((v,i)=>placed[i]!==v);if(k<0){ctx.say('모두 완성됐어요. 전하기를 눌러 주세요.');return;}
    chosen=required()[k];draw();ctx.say(`${chosen}을 선택했어요. ${Math.floor(k/2)+1}번째 글자의 ${k%2?'모음':'자음'} 칸에 놓아 보세요.`);
  }
  ctx.controls.append(info,ctx.button('다음 조각 도움',help),ctx.button('주민에게 전하기',()=>{
    if(!life.active)return;if(!required().every((v,i)=>placed[i]===v)){ctx.say('글자에 빈칸이 남았어요. 자모를 조립해 주세요.');return;}
    step++;ctx.sound('success');if(step===requests.length){life.done({score:300,message:'내 말을 글자로 전했어요. 세종은 백성이 쉽게 익혀 쓸 수 있는 글자를 만들고자 했어요.'});return;}
    chosen=null;placed=[];draw();ctx.say('다음 부탁이에요. 소리와 글자 모양을 연결해 보세요.');
  },'primary'));
  draw();ctx.say('자모 조각을 골라 글자 칸에 놓아 보세요. 첫 연습은 ‘나’예요.');return {...life,assist:help};
}

export function createRoof(ctx) {
  const life=lifecycle(ctx,90);let selected=0,vertical=false,placed=Array(12).fill(null),pieces=Array(6).fill(false),preview=false;
  const panel=make(ctx,'div','puzzle-panel roof-panel');
  const caption=make(ctx,'p','puzzle-caption','짚단 여섯 묶음으로 지붕 모형의 빈틈을 채워요.');
  const board=make(ctx,'div','roof-board');const palette=make(ctx,'div','roof-palette');
  panel.append(caption,board,palette);ctx.mount.append(panel);
  function draw(){
    board.replaceChildren();placed.forEach((piece,i)=>{
      const b=ctx.button('',()=>{
        if(!life.active)return;
        if(piece!==null){placed=placed.map(p=>p===piece?null:p);pieces[piece]=false;selected=piece;draw();ctx.say('짚단을 다시 들어 올렸어요. 다른 자리에도 놓아 보세요.');return;}
        if(pieces[selected]){ctx.say('아래에서 아직 놓지 않은 짚단을 골라 주세요.');return;}
        const n=vertical?i+4:i+1;
        if(n>11 || (!vertical&&i%4===3) || placed[n]!==null){ctx.say('짚단 두 칸이 모두 들어갈 자리를 골라 주세요. 회전해서 놓을 수도 있어요.');ctx.sound('soft');return;}
        placed[i]=placed[n]=selected;pieces[selected]=true;selected=pieces.findIndex(v=>!v);if(selected<0)selected=0;draw();ctx.sound('tap');
      },'roof-cell');b.setAttribute('aria-label',`${Math.floor(i/4)+1}행 ${i%4+1}열 ${piece===null?'빈 자리':`짚단 ${piece+1}, 다시 들기`}`);
      if(piece!==null){b.classList.add('roof-filled');b.dataset.piece=String(piece);b.innerHTML='<span class="roof-straw"></span>';}
      if(preview&&piece===null)b.classList.add('puzzle-hint');board.append(b);
    });
    palette.replaceChildren();pieces.forEach((used,i)=>{
      const b=ctx.button(`짚단 ${i+1}`,()=>{if(!life.active||used)return;selected=i;preview=false;draw();},'roof-piece');b.disabled=used;b.setAttribute('aria-pressed',String(selected===i&&!used));palette.append(b);
    });ctx.setProgress(pieces.filter(Boolean).length/6,`짚단 ${pieces.filter(Boolean).length}/6`);
    if(pieces.every(Boolean))ctx.say('빈틈을 모두 채웠어요. 수리를 마쳐 주세요.');
  }
  function help(){
    life.assist(); // Preserve the user's agency: final piece must be placed by the player.
    placed=Array(12).fill(null);pieces=Array(6).fill(false);vertical=false;
    for(let p=0;p<5;p++){placed[p*2]=placed[p*2+1]=p;pieces[p]=true;}
    selected=5;preview=true;draw();ctx.say('빈 두 칸에 마지막 짚단을 직접 놓아 보세요. 왼쪽 빈칸을 누르면 돼요.');
  }
  const rotate=ctx.button('짚단 회전: 가로',()=>{if(!life.active)return;vertical=!vertical;rotate.textContent=`짚단 회전: ${vertical?'세로':'가로'}`;ctx.say(`${vertical?'세로':'가로'} 두 칸에 놓을 수 있어요.`);},'');
  ctx.controls.append(rotate,ctx.button('차근차근 배치',()=>{help();rotate.textContent='짚단 회전: 가로';}),ctx.button('수리 마치기',()=>{
    if(!life.active)return;if(!pieces.every(Boolean)){ctx.say('지붕에 빈틈이 남았어요. 놓은 짚단을 누르면 다시 들 수 있어요.');return;}
    life.done({score:300,message:'서로 힘을 모아 이웃집 지붕을 고쳤어요. 향약에는 어려운 이웃을 돕자는 약속이 담겼어요.'});
  },'primary'));
  draw();ctx.say('짚단을 고르고 빈칸에 놓아요. 놓인 짚단을 누르면 되돌릴 수 있어요.');return {...life,assist:()=>{help();rotate.textContent='짚단 회전: 가로';}};
}

function landscape(){return `<svg viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="obsSky" x2="0" y2="1"><stop stop-color="#a8d5d6"/><stop offset="1" stop-color="#f7e8ba"/></linearGradient><pattern id="obsWater" width="90" height="35" patternUnits="userSpaceOnUse"><path d="M8 18q18-7 34 0t35 0" fill="none" stroke="#e2efe0" stroke-width="3"/></pattern></defs><rect width="1200" height="600" fill="url(#obsSky)"/><path d="M0 250L135 90l135 150L450 65l195 190L820 105l160 130 110-120 110 110v190H0Z" fill="#8ba78c" stroke="#5d7f6c" stroke-width="4"/><path d="M0 345q150-100 330 0t410-20 460 0v275H0Z" fill="#d8c78a"/><path d="M0 430q240-110 500-25t700-50v245H0Z" fill="#7bb4b8"/><rect y="410" width="1200" height="190" fill="url(#obsWater)"/><g stroke="#66462d" stroke-width="5" stroke-linejoin="round"><path d="M65 410h310l-45 37H110Z" fill="#a7703d"/><path d="M220 165v245"/><path d="M225 170l112 200H225Z" fill="#f5e5b6"/><path d="M225 170l-88 200h88Z" fill="#ecdba8"/><path d="M210 210h44l16 20-16 20h-44Z" fill="#b85e46"/><path d="M430 350v99m75-99v99m75-99v99M405 353h200v20H405Z" fill="#986b43"/><path d="M470 275v78m-35-78h75v34h-75Z" fill="#e9c681"/><path d="M747 240h150v100H747Z" fill="#dba46b"/><path d="M724 240l96-60 100 60Z" fill="#5e6c60"/><path d="M766 240v95m36-95v95m36-95v95m36-95v95"/><path d="M1010 330h140v88h-140Z" fill="#ebc18b"/><path d="M989 330l90-52 90 52Z" fill="#927442"/><path d="M1060 368h34v50" fill="#8f6840"/></g><path d="M620 360q30-90 65-25t10 32" fill="#78965d"/><path d="M940 330q25-75 54-15" fill="#78965d"/></svg>`;}
export function createObserve(ctx) {
  const life=lifecycle(ctx,90);let x=0,y=0,zoom=1,found=new Set(),targetIndex=0;
  const targets=[{name:'돛대의 붉은 천',x:22,y:39,description:'돛대에 묶인 천이 바람에 움직여요.'},{name:'나루터 표지',x:39,y:49,description:'표지를 보면 배를 타는 곳을 찾을 수 있어요.'},{name:'산기슭 정자',x:68,y:44,description:'먼 산기슭의 정자가 가까이 보여요.'},{name:'먼 집 지붕',x:90,y:51,description:'멀리 있는 지붕의 모양도 자세히 살필 수 있어요.'}];
  const panel=make(ctx,'div','puzzle-panel observe-panel');
  const label=make(ctx,'p','puzzle-caption');const viewport=make(ctx,'div','observe-viewport');
  const world=make(ctx,'div','observe-world');world.innerHTML=landscape();
  const cross=make(ctx,'div','observe-cross');cross.setAttribute('aria-hidden','true');
  const lens=make(ctx,'div','observe-lens');lens.setAttribute('aria-hidden','true');
  viewport.append(world,cross,lens);const targetsBar=make(ctx,'div','observe-targets');panel.append(label,viewport,targetsBar);ctx.mount.append(panel);
  const targetsButtons=targets.map((t,i)=>{const b=ctx.button(t.name,()=>{if(!life.active)return;targetIndex=i;draw();ctx.say(`${t.name}을 찾아보세요. 방향으로 시야를 움직일 수 있어요.`);},'observe-target');targetsBar.append(b);return b;});
  targets.forEach((t,i)=>{const b=ctx.button('',()=>{
    if(!life.active)return;
    if(i!==targetIndex){ctx.say(`지금 찾는 것은 ${targets[targetIndex].name}이에요. 아래에서 관찰 대상을 바꿀 수도 있어요.`);return;}
    found.add(i);ctx.sound('success');ctx.say(t.description+' 천리경은 먼 물체를 살피는 데 쓰였어요.');
    if(found.size===4){life.done({score:400,message:'나루터의 네 물건을 관찰했어요. 천리경은 먼 곳을 살피는 새로운 도구였어요. 세계지도는 별도 자료로 세상을 넓혀 주었어요.'});return;}
    targetIndex=targets.findIndex((_,j)=>!found.has(j));draw();
  },'observe-hotspot');b.style.left=t.x+'%';b.style.top=t.y+'%';b.setAttribute('aria-label',t.name+' 관찰');world.append(b);});
  function draw(){
    world.style.transform=`translate(${x}%,${y}%) scale(${zoom})`;label.textContent=`찾을 물건 · ${targets[targetIndex].name}`;
    targetsButtons.forEach((b,i)=>{b.classList.toggle('observe-found',found.has(i));b.setAttribute('aria-pressed',String(targetIndex===i));});
    ctx.setProgress(found.size/4,`관찰 ${found.size}/4`);
  }
  function move(dx,dy){if(!life.active)return;x=Math.max(-24,Math.min(24,x+dx));y=Math.max(-16,Math.min(16,y+dy));draw();}
  function help(){life.assist();const t=targets[targetIndex];zoom=1.6;x=(50-t.x)*1.6;y=(50-t.y)*1.6;draw();ctx.say('찾을 물건을 시야 가운데로 가져왔어요. 물건을 눌러 직접 관찰해 보세요.');}
  const zoomButton=ctx.button('확대 1배',()=>{if(!life.active)return;zoom=zoom===1?1.6:1; x=y=0;zoomButton.textContent=`확대 ${zoom}배`;draw();},'');
  ctx.controls.append(ctx.button('왼쪽',()=>move(10,0)),ctx.button('오른쪽',()=>move(-10,0)),ctx.button('위쪽',()=>move(0,10)),ctx.button('아래쪽',()=>move(0,-10)),zoomButton,ctx.button('목표 찾기 도움',help));
  const key=e=>{if(!life.active || !panel.contains(document.activeElement))return;const d={ArrowLeft:[10,0],ArrowRight:[-10,0],ArrowUp:[0,10],ArrowDown:[0,-10]}[e.key];if(d){e.preventDefault();move(...d);}};
  panel.addEventListener('keydown',key);life.onCleanup(()=>panel.removeEventListener('keydown',key));
  draw();ctx.say('찾을 물건을 고르고 풍경 속 같은 물건을 눌러 관찰해요. 확대와 방향 버튼을 사용해 보세요.');
  return {...life,assist:help};
}

export const puzzleGames={1:createRoute,2:createLetters,3:createRoof,8:createObserve};
