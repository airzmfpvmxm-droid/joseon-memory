import {prologue,storyChapters,ending} from './story.js';

export function createStoryFlow(api){
 const {el,button,main,chapters}=api;
 let active=true;
 const state=()=>api.data().story;
 const chapter=()=>chapters[Math.min(7,state().memories)];
 function prepare(){api.hideDialog();api.dispose();api.setScreen('story');main.replaceChildren();api.top();}
 function painting(){
  const art=el('div','memory-painting');art.setAttribute('role','img');art.setAttribute('aria-label',`마을 그림, 여덟 부분 중 ${state().memories}부분 복원`);
  const sketch=el('div','painting-sketch');art.append(sketch);
  for(let i=0;i<8;i++){const strip=el('div',`painting-strip${i<state().memories?' restored':''}`);strip.style.setProperty('--slice',i);art.append(strip);}
  art.append(el('span','painting-caption',state().memories===8?'사람들의 이야기가 담긴 마을':'사람들의 기억을 찾으면 그림에 색이 돌아와요'));
  return art;
 }
 function hub(){
  active=true;prepare();
  const view=el('section','memory-hub');
  const left=el('div','memory-gallery');left.append(el('p','eyebrow','시간을 건너 모으는 여덟 장의 기억'),el('h1','','사람들이 살아간 나라'),painting());
  const progress=el('div','story-progress');progress.setAttribute('aria-label','그림 복원 진행');
  for(let i=0;i<8;i++){const bead=el('span',i<state().memories?'recovered':'',String(i+1));bead.setAttribute('aria-label',`${i+1}장 ${i<state().memories?'복원 완료':'아직 찾지 않은 기억'}`);progress.append(bead);}left.append(progress);
  const right=el('div','memory-journey');const ch=chapter();
  right.append(el('p','eyebrow',state().memories===8?'그림이 완성되었어요':'지금 찾아갈 이야기'),el('h2','',state().memories===8?'여덟 사람의 기억':state().started?ch.title:'사람이 사라진 그림'));
  right.append(el('p','journey-description',state().memories===8?'길을 잇고, 마음을 전하고, 서로의 사연을 들었어요. 완성한 그림과 함께 여행을 돌아보세요.':state().started?storyChapters[ch.id-1].goal:'박물관에서 발견한 그림에 사람들의 이야기가 비어 있어요. 그림첩을 펼쳐 조선의 여러 시대로 떠나 보세요.'));
  if(state().started&&state().memories<8)right.append(el('p','journey-era',ch.era));
  const go=button(state().memories===8?'마지막 이야기 다시 보기':state().started?'이야기 이어하기':'이야기 시작',()=>{if(state().memories===8){state().phase='ending';state().line=0;api.save();}continueStory();},'primary');go.id='story-continue';right.append(go);
  right.append(button('놀이 골라하기',()=>{active=false;api.showPractice();},'secondary'));
  right.append(el('p','journey-note','주민의 부탁을 듣고 놀이를 마치면, 그림 한 부분을 되찾아요. 진행은 이 기기에 저장돼요.'));
  view.append(left,right);main.append(view);go.focus();
 }
 function continueStory(){
  active=true;state().started=true;api.save();
  if(state().phase==='done')return hub();
  if(state().phase==='play')return api.showIntro(chapter());
  scene();
 }
 function scene(){
  prepare();const s=state(),ch=chapter(),phase=s.phase;
  const lines=phase==='prologue'?prologue:phase==='ending'?ending:storyChapters[ch.id-1][phase];
  s.line=Math.min(Math.max(0,s.line),lines.length-1);api.save();
  const view=el('section',`story-view campaign-scene scene-${ch.scene}`);view.style.backgroundImage=`url("assets/scene-${phase==='prologue'||phase==='ending'?'village':ch.scene}.webp")`;
  const heading=el('div','scene-heading');heading.append(el('p','eyebrow',phase==='prologue'?'도입 · 오늘, 박물관':phase==='ending'?'마지막 장 · 다시 박물관':`${ch.id}장 · ${ch.era}`),el('h1','',phase==='prologue'?'사람이 사라진 그림':phase==='ending'?'사람들이 살아간 나라':ch.title));
  heading.append(el('span','chapter-genre',phase==='before'?storyChapters[ch.id-1].goal:phase==='after'?'주민에게 돌아와 이야기를 들어요':phase==='prologue'?'그림첩을 따라 서로 다른 시대로 떠나요':'여덟 장의 기억을 돌아봐요'));view.append(heading);
  if(phase==='ending')view.append(painting());
  if(ch.id===6&&phase!=='ending'&&phase!=='prologue'){const farmer=el('img','scene-farmer');farmer.src='assets/farmer.webp';farmer.alt='곡식 창고에서 사연을 전하는 농민';view.append(farmer);}
  const box=el('div','story-dialogue');box.dataset.storyPhase=phase;
  const quote=el('div','story-quote');const line=el('p','story-line',lines[s.line][1]);line.setAttribute('aria-live','polite');quote.append(el('span','speaker',lines[s.line][0]),line,el('span','dialogue-page',`${s.line+1} / ${lines.length}`));
  const actions=el('div','story-actions');
  if(s.line<lines.length-1)actions.append(button('다음 이야기',()=>{s.line++;api.save();scene();},'primary'));
  else if(phase==='before')actions.append(button('놀이 시작',()=>api.start(ch,'normal'),'primary'),button('천천히 함께하기',()=>api.start(ch,'assist'),'secondary'));
  else if(phase==='after')actions.append(button('그림에 기억 남기기',collect,'primary'));
  else if(phase==='prologue')actions.append(button('첫 번째 풍경으로',()=>{s.phase='before';s.line=0;api.save();scene();},'primary'));
  else actions.append(button('완성한 그림 보기',()=>{s.phase='done';s.line=0;api.save();hub();},'primary'));
  if(s.line>0)actions.append(button('앞 대사',()=>{s.line--;api.save();scene();},'quiet-button'));
  actions.append(button('그림첩으로',hub,'quiet-button'));box.append(quote,actions);view.append(box);main.append(view);actions.querySelector('button')?.focus();
 }
 function collect(){
  const s=state();s.memories=Math.min(8,s.memories+1);s.line=0;s.phase=s.memories===8?'ending':'before';api.save();
  prepare();const view=el('section','memory-restored');view.append(el('p','eyebrow',`${s.memories} / 8 · 그림 복원`),el('h1','',storyChapters[s.memories-1].memory),painting(),el('p','',s.memories===8?'마지막 기억까지 찾았어요. 이제 박물관으로 돌아가요.':'그림첩의 다음 장이 열렸어요. 다른 시대의 사람을 만나러 가요.'),button(s.memories===8?'마지막 이야기로':'다음 풍경으로',scene,'primary'),button('그림첩으로',hub,'quiet-button'));main.append(view);view.querySelector('.primary').focus();
 }
 function onStart(){if(!active)return;state().phase='play';state().line=0;api.save();}
 function onComplete(){if(!active)return;state().phase='after';state().line=0;api.save();}
 return {get active(){return active;},hub,continue:continueStory,after:scene,onStart,onComplete};
}
