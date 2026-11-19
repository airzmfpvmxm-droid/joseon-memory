const grainSvg = (damaged, seed = 0) => `<svg viewBox="0 0 170 105" aria-hidden="true"><ellipse cx="85" cy="82" rx="65" ry="10" fill="#794e2920"/>${Array.from({length:11},(_,i)=>{const x=37+(i*31+seed*7)%100,y=31+(i*19)%44,r=(i*27)%70-35;return `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="15" ry="6" fill="${damaged?'#c7a363':'#eed197'}" stroke="#78522f" stroke-width="2"/><path d="M-9 0H9" stroke="#b28c52" stroke-width="1.2"/>${damaged&&i%3===0?'<circle r="3" fill="#755035"/><path d="M-5 -3L3 3" stroke="#85643f"/>':''}</g>`}).join('')}</svg>`;

export const grainGames = {6:createGrain};

function createGrain(ctx) {
  const el = (tag, cls='', text='') => ctx.el(tag, cls, text);
  const button = (text, fn, cls='') => ctx.button(text, fn, cls);
  const state = Object.assign({step:0, selected:null, sorted:[], mistakes:0, fill:0, target:1, meterDone:false, read:[], total:null, extra:null, linked:false, quality:false}, ctx.saved || {});
  let stopped=false, paused=false, raf=0;
  const damaged = [true,false,true,false,false,true];
  const names = ['첫째 표본','둘째 표본','셋째 표본','넷째 표본','다섯째 표본','여섯째 표본'];
  function say(text) { if (!stopped) ctx.say(text); }
  function sound(type) { if (!paused) ctx.sound(type); }
  function active(fn) { return (...args)=>{if(!paused&&!stopped) fn(...args)}; }
  function clear() {ctx.mount.replaceChildren();ctx.controls.replaceChildren();ctx.setTime(null);}
  function heading(title, sub) {const h=el('div','grain-heading');h.append(el('span','grain-step',`곡식 창고 · ${state.step+1}/4`),el('h2','',title),el('p','',sub));ctx.mount.append(h);}
  function next(label) {ctx.controls.append(button(label,active(()=>{state.step++;render()}),'grain-primary'));}
  function setProgress() {ctx.setProgress((state.step+(state.step===0?state.sorted.length/6:state.step===1?(state.target===2?.6:0):0))/4, ['표본 관찰','되 계량','기록 비교','농민에게 보고'][state.step]);}
  function render() {
    if(stopped)return;clear();ctx.mount.classList.add('grain-game');setProgress();
    [renderSorting,renderMeter,renderEvidence,renderReport][state.step]();
  }
  function renderSorting() {
    heading('작은 곡식도 자세히 살펴봐요','연습 표본 하나를 고른 뒤, 보이는 흔적에 맞는 관찰 칸에 놓으세요.');
    const body=el('div','grain-sort-layout');
    const tray=el('div','grain-tray');tray.setAttribute('aria-label','분류할 연습 표본');
    damaged.forEach((d,i)=>{
      const item=button(names[i],active(()=>{state.selected=i;renderSortingSelection();say(`${names[i]}을 골랐어요. 구멍이나 깨진 흔적을 살펴보세요.`)}),'grain-sample');
      item.dataset.sample=String(i);item.setAttribute('aria-label',`${names[i]} 관찰`);
      const pic=el('span','grain-sample-pic');pic.innerHTML=grainSvg(d,i);item.replaceChildren(pic,el('span','grain-sample-name',names[i]));
      if(state.sorted.includes(i)){item.disabled=true;item.classList.add('grain-sorted');item.append(el('span','grain-done-label','관찰 완료'));}
      tray.append(item);
    });
    const sides=el('div','grain-sort-sides');
    const preserved=el('aside','grain-preserved');preserved.innerHTML=`<div class="grain-preserved-pic">${grainSvg(true,4)}</div>`;preserved.append(el('strong','','막동이 보관한 피해 표본'),el('p','','이 꾸러미는 그대로 보존해요. 지금 옮기는 것은 별도의 연습 표본이에요.'));
    const bins=el('div','grain-bins');
    bins.append(button('손상 흔적이 보여요',active(()=>classify(true)),'grain-bin grain-bin-damaged'),button('더 확인해 봐야 해요',active(()=>classify(false)),'grain-bin'));
    sides.append(preserved,bins);body.append(tray,sides);ctx.mount.append(body);
    ctx.controls.append(el('span','grain-counter',`${state.sorted.length}/6 관찰`));
    if(state.sorted.length===6)next('되 계량 연습으로');
    else ctx.controls.append(button('관찰 힌트',active(()=>{say(state.selected===null?'먼저 표본 하나를 골라 보세요.':'뚫린 구멍이나 짙은 손상 흔적이 있는지 살펴보세요. 흔적이 안 보여도 먹어도 안전하다고 단정하지 않아요.')})));
    renderSortingSelection();
    say(state.sorted.length===6?'여섯 표본을 모두 관찰했어요. 이제 곡식의 양을 재는 단위를 연습해 볼까요?':'표본을 고르고 관찰 칸을 선택하세요. 그림만 보고 먹어도 안전하다고 판단하지는 않아요.');
  }
  function renderSortingSelection(){
    ctx.mount.querySelectorAll('[data-sample]').forEach(node=>{const selected=Number(node.dataset.sample)===state.selected;node.classList.toggle('grain-selected',selected);node.setAttribute('aria-pressed',String(selected));});
  }
  function classify(answer){
    if(state.selected===null){say('먼저 표본 하나를 눌러 크게 살펴보세요.');return;}
    if(state.sorted.includes(state.selected))return;
    if(answer!==damaged[state.selected]){state.mistakes++;sound('soft');say(damaged[state.selected]?'작은 구멍과 짙은 흔적을 다시 살펴보세요. 손상 흔적이 보이는 표본이에요.':'이 표본은 뚜렷한 손상 흔적이 보이지 않아요. 하지만 더 확인하기 전에는 안전하다고 단정할 수 없어요.');return;}
    state.sorted.push(state.selected);state.selected=null;sound('tap');render();
  }
  function renderMeter(){
    heading('찰랑찰랑, 한 되를 맞춰요','깨끗한 연습 곡식을 붓거나 덜어 목표선에 맞추세요. 실제로 빌려준 양을 재는 활동은 아니에요.');
    const body=el('div','grain-meter-layout');
    const vessel=el('div','grain-vessel-panel');
    vessel.innerHTML='<svg class="grain-measure-svg" viewBox="0 0 310 280" role="img" aria-label="되의 곡식 수위"><defs><pattern id="grainTexture" width="19" height="15" patternUnits="userSpaceOnUse"><ellipse cx="7" cy="7" rx="6" ry="2.8" transform="rotate(-22 7 7)" fill="#efd395" stroke="#9b733e" stroke-width=".8"/></pattern><clipPath id="grainCupClip"><path d="M61 55L78 239Q155 260 232 239L249 55Z"/></clipPath></defs><ellipse cx="155" cy="250" rx="104" ry="17" fill="#67422220"/><path d="M61 55L78 239Q155 260 232 239L249 55Z" fill="#c99659" stroke="#69452b" stroke-width="5"/><path d="M89 63L99 235M124 63L129 244M186 63L181 244M222 63L211 235" stroke="#9c6d3d" stroke-width="3"/><g clip-path="url(#grainCupClip)"><rect class="grain-fill-bg" x="60" y="240" width="190" height="0" fill="#e6c47f"/><rect class="grain-fill" x="60" y="240" width="190" height="0" fill="url(#grainTexture)"/></g><path d="M61 55Q155 34 249 55Q155 78 61 55Z" fill="none" stroke="#69452b" stroke-width="5"/><path class="grain-target-line" d="M49 160H263" stroke="#a74f34" stroke-width="3" stroke-dasharray="8 5"/><text class="grain-target-caption" x="258" y="151" text-anchor="end" font-size="16" fill="#7a3d2a">목표</text></svg>';
    const info=el('div','grain-meter-info');info.append(el('span','grain-target-number',`목표 ${state.target}되`),el('strong','grain-current-number',''),el('p','','큰 붓기 → 조금 붓기 → 덜기로 양을 조절해 보세요.'),el('p','grain-small-note','이 연습으로 봄에 실제 받은 양을 알 수는 없어요.'));
    body.append(vessel,info);ctx.mount.append(body);
    const pour=amount=>active(()=>{state.fill=Math.max(0,Math.min(2.5,Math.round((state.fill+amount)*10)/10));updateMeter();sound(amount>0?'grain':'tap');if(state.fill>state.target+.15)say('목표선보다 높아요. 조금 덜면 다시 맞출 수 있어요.');else say('곡식의 수위와 목표선을 비교해 보세요.');});
    ctx.controls.append(button('크게 붓기 +0.3되',pour(.3),'grain-pour'),button('조금 붓기 +0.1되',pour(.1)),button('조금 덜기 −0.1되',pour(-.1)),button('이 양으로 확인',active(checkMeter),'grain-primary'));
    updateMeter();say('연습용 되를 채워 보세요. 넘쳐도 덜어서 고칠 수 있어요.');
  }
  function updateMeter(){
    const h=state.fill/2.5*181,y=240-h;
    ctx.mount.querySelectorAll('.grain-fill,.grain-fill-bg').forEach(n=>{n.setAttribute('height',h);n.setAttribute('y',y)});
    const targetY=240-state.target/2.5*181;
    ctx.mount.querySelector('.grain-target-line')?.setAttribute('d',`M49 ${targetY}H263`);
    ctx.mount.querySelector('.grain-target-caption')?.setAttribute('y',targetY-9);
    const readout=ctx.mount.querySelector('.grain-current-number');if(readout)readout.textContent=`지금 ${state.fill.toFixed(1)}되`;
  }
  function checkMeter(){
    const tolerance=ctx.isAssist()?.25:.051;
    if(Math.abs(state.fill-state.target)>tolerance){state.mistakes++;sound('soft');say(state.fill<state.target?'조금 더 부어 목표선에 가까이 맞춰 보세요.':'조금 덜어 목표선에 가까이 맞춰 보세요.');return;}
    sound('success');if(state.target===1){state.target=2;state.fill=0;render();say('한 되를 맞췄어요! 이번에는 두 되를 채워 볼까요?');}
    else {state.meterDone=true;state.step=2;render();}
  }
  function renderEvidence(){
    heading('약속한 양과 요구한 양, 무엇이 다를까요?','자료 세 가지를 읽고, 기록에 근거해 차이를 찾아보세요.');
    const body=el('div','grain-evidence-layout');
    const paper=el('div','grain-papers');
    const docs=[['record','봄의 대여 기록','막동에게 지급한 곡식 10되\n처음 안내한 이자 1되\n가을에 갚을 양 11되'],['demand','가을의 요구 쪽지','돌려받을 곡식 11되\n아전의 몫 4되\n내어 올 양 15되'],['sample','피해 곡식에 대한 증언','“빌릴 때부터 벌레 먹은 곡식이 섞여 있었어요.”\n막동이 봄부터 보관했다고 말한 표본입니다.\n이 표본만으로 그때 받은 전체 양을 알 수는 없습니다.']];
    docs.forEach(([key,title,text])=>{const card=button(title,active(()=>{if(!state.read.includes(key))state.read.push(key);sound('paper');render();say(`${title}을 확인했어요. ${state.read.length}/3 자료 확인.`)}),'grain-paper');card.append(el('span','grain-paper-title',title),el('span','grain-paper-body',text),el('span','grain-paper-read',state.read.includes(key)?'확인했어요':'눌러서 확인'));card.setAttribute('aria-label',`${title} 확인`);paper.append(card);});
    const work=el('div','grain-evidence-work');
    if(state.read.length<3){work.append(el('h3','','먼저 세 자료를 살펴보세요'),el('p','','봄 기록, 가을 쪽지, 피해 곡식에 대한 증언을 각각 눌러 확인하세요.'));}
    else if(state.total===null){work.append(el('h3','','처음 약속한 상환량은?'),el('p','','지급한 양과 처음 안내한 이자를 함께 생각해 보세요.'));choices(work,[10,11,15],'되',value=>{if(value===11){state.total=value;sound('tap');render()}else{state.mistakes++;say('지급 10되에 처음 안내된 이자 1되를 더해 보세요.');sound('soft')}});}
    else if(state.extra===null){work.append(el('h3','','처음 약속 외에 더 요구한 양은?'),el('p','','처음 약속 11되와 지금 요구 15되를 비교하세요.'));choices(work,[1,4,15],'되',value=>{if(value===4){state.extra=value;sound('tap');render()}else{state.mistakes++;say('15되 전부가 추가분은 아니에요. 처음 약속한 11되를 빼 보세요.');sound('soft')}});}
    else if(!state.linked){work.append(el('h3','','추가 요구를 보여 주는 근거는?'));const reasons=[['봄 기록 11되 + 쪽지의 아전 몫 4되',true],['지금 연습으로 계량한 곡식',false],['피해 표본의 겉모습만',false]];reasons.forEach(([label,ok])=>work.append(button(label,active(()=>{if(ok){state.linked=true;state.step=3;sound('success');render();}else{state.mistakes++;say('연습 계량이나 표본만으로 과거 상환량을 알 수는 없어요. 두 기록을 함께 비교해 보세요.');sound('soft')}}),'grain-reason')));}
    body.append(paper,work);ctx.mount.append(body);ctx.controls.append(el('span','grain-small-note','이자가 있다는 사실만이 아니라, 처음 기록에 없는 개인 몫의 추가 요구를 살펴보세요.'));
    say(state.read.length<3?'각 자료를 눌러 내용을 확인하세요.':'숫자 차이만이 아니라 어떤 근거에서 알 수 있는지 연결해 보세요.');
  }
  function choices(container, values, unit, fn){const row=el('div','grain-number-choices');values.forEach(v=>row.append(button(`${v}${unit}`,active(()=>fn(v)),'grain-number-choice')));container.append(row);}
  function renderReport(){
    heading('막동에게 확인한 내용을 전해요','손놀이 결과와 역사적 근거를 구분하고, 주민의 고충을 함께 남깁니다.');
    const panel=el('div','grain-report');
    panel.append(el('h3','','함께 확인한 사실'),el('p','','처음 기록의 상환량은 11되. 가을 쪽지는 아전의 몫 4되를 더해 15되를 요구했어요.'),el('p','','이자가 있다는 사실만으로 부정이라고 판단한 것이 아니라, 기록에 없는 개인 몫의 추가 요구를 확인했어요.'));
    const quality=button(state.quality?'품질 고충도 함께 전할 준비가 됐어요':'품질 고충도 함께 전하기',active(()=>{state.quality=true;sound('tap');render();say('빌릴 때부터 벌레 먹은 곡식이 있었다는 막동의 말도 함께 남겨요.');}),'grain-quality');quality.setAttribute('aria-pressed',String(state.quality));panel.append(quality,el('p','grain-report-quote','“제가 잘못 기억한 게 아니었군요. 다른 주민들과도 이야기해 봐야겠어요.”'));
    ctx.mount.append(panel);
    const report=button('막동에게 조사 결과 전하기',active(()=>{if(!state.quality){say('먼저 곡식의 품질에 대한 고충도 함께 전할 준비를 해 보세요.');return;}ctx.setProgress(1,'조사와 보고 완료');ctx.complete({score:Math.max(60,100-state.mistakes*2),message:'추가 4되의 근거와 곡식의 품질 고충을 함께 전했어요. 어려움이 모두 해결된 것은 아니지만, 함께 확인할 근거가 생겼습니다.'});}),'grain-primary');ctx.controls.append(report);say('추가 요구의 기록과 품질에 대한 증언을 모두 확인했어요. 막동에게 전해 주세요.');
  }
  render();
  return {
    pause(){paused=true;},
    resume(){paused=false;},
    assist(){if(stopped)return; paused=false; if(state.step===0){const i=state.selected??damaged.findIndex((_,i)=>!state.sorted.includes(i));state.selected=i;renderSortingSelection();say(`${names[i]}: ${damaged[i]?'작은 구멍과 손상 흔적이 보여요. 손상 관찰 칸을 골라 보세요.':'뚜렷한 손상 흔적은 보이지 않아요. 더 확인해 봐야 하는 칸을 골라 보세요.'}`);}else if(state.step===1){state.fill=Math.max(0,state.target-.1);updateMeter();say('목표 바로 아래까지 함께 채웠어요. 조금 붓기를 누르고 확인해 보세요.');}else if(state.step===2){say(state.read.length<3?'종이 자료 세 개를 각각 눌러 확인하세요.':'처음 약속 10+1=11되, 지금 요구 15되. 차이 4되가 쪽지의 어느 행에 있는지 살펴보세요.');}else say('품질 고충도 함께 전하기를 누른 뒤, 조사 결과를 전해 주세요.');},
    snapshot(){return JSON.parse(JSON.stringify(state));},
    destroy(){stopped=true;cancelAnimationFrame(raf);ctx.mount.classList.remove('grain-game');ctx.mount.replaceChildren();ctx.controls.replaceChildren();}
  };
}
