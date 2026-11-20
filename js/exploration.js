const places=[
 {name:'목수',sprite:1,baked:true,npc:[62,91],spawn:[31,90],prop:[24,24,24,38],propName:'한양의 문',observe:'새 도읍으로 들어가는 문이에요. 목수는 건물을 지을 곳까지 수레가 다닐 길을 찾고 있어요.'},
 {name:'마을 주민',sprite:2,npc:[90,91],prop:[46,55,34,24],propName:'마당의 책상',observe:'말을 글로 남기는 자리를 살펴보았어요. 마당의 주민은 자신의 말을 새 글자로 전하고 싶어 해요.'},
 {name:'이웃',sprite:3,npc:[72,81],spawn:[49,89],bounds:{minX:42,maxX:92,minY:80,maxY:92},prop:[10,5,45,28],propName:'집의 지붕',observe:'집을 덮은 지붕을 살펴보았어요. 오늘은 어른들이 지붕을 고칠 수 있도록 작업대에서 재료를 맞춰요.'},
 {name:'보급소 주민',sprite:4,baked:true,npc:[61,88],spawn:[83,94],bounds:{minX:46,maxX:92,minY:92,maxY:95},prop:[8,20,35,40],propName:'들판',observe:'마을로 이어지는 들판이에요. 주민이 부탁할 물과 식량을 어디로 옮길지 먼저 들어보세요.'},
 {name:'화성의 일꾼',sprite:5,npc:[73,82],spawn:[49,89],bounds:{minX:42,maxX:92,minY:80,maxY:92},prop:[10,5,45,28],propName:'작업장',observe:'일할 자리를 살펴보았어요. 이번에는 정조 때 화성 공사장의 기억 속에서 돌수레를 옮겨요.'},
 {name:'농민',sprite:null,npc:[72,83],prop:[2,47,23,31],propName:'창고의 곡식 자루',observe:'곡식 자루가 쌓여 있어요. 빌릴 때와 갚을 때 무엇이 달랐는지는 자루만 보고 알 수 없어요. 농민의 사연을 들어보세요.'},
 {name:'장터의 광대',sprite:6,npc:[73,82],spawn:[46,91],bounds:{minX:40,maxX:90,minY:88,maxY:94},prop:[2,48,24,35],propName:'장터의 가게',observe:'물건과 이야기가 모이는 장터예요. 광대에게 말을 걸어 북과 손뼉으로 합주에 참여해 보세요.'},
 {name:'뱃사람',sprite:7,overview:true,npc:[74,85],spawn:[55,87],bounds:{minX:49,maxX:91,minY:82,maxY:91},prop:[31,24,31,25],propName:'마을 풍경',observe:'그림 속 멀고 가까운 풍경을 살펴보았어요. 뱃사람에게 천리경을 빌려 나루터의 물건도 찾아볼까요?'}
];

export function createExploration(api){
 const {el,button,ch,state,main}=api,place=places[ch.id-1];
 const returning=state.phase==='after';
 const root=el('section',`exploration${place.overview?' exploration-overview':''}`);root.dataset.chapter=ch.id;
 const header=el('div','exploration-heading');header.append(el('div','',`${ch.id}장 · ${ch.era}`),el('h1','',ch.title),el('p','',returning?`${place.name}에게 돌아가 이야기를 들어요.`:`${place.name}을 찾아 말을 걸어 보세요.`));
 const stage=el('div','exploration-stage'),world=el('div','exploration-world');world.style.backgroundImage=`url("${new URL(`assets/scene-${ch.scene}.webp`,document.baseURI).href}")`;world.tabIndex=0;world.setAttribute('role','group');world.setAttribute('aria-label','마을 탐험. 바닥을 누르거나 방향키로 이동. 주민을 누르면 다가가 대화해요.');world.setAttribute('aria-busy','true');
 const loading=el('span','exploration-loading','풍경을 불러오고 있어요.');world.append(loading);
 const info=el('p','exploration-info');info.setAttribute('role','status');
 const setInfo=text=>info.textContent=text;
 const prop=button('',inspect,'exploration-prop');prop.setAttribute('aria-label',`${place.propName} 살펴보기`);Object.assign(prop.style,{left:place.prop[0]+'%',top:place.prop[1]+'%',width:place.prop[2]+'%',height:place.prop[3]+'%'});prop.append(el('span','prop-label',place.propName));
 function sprite(index,cls){const n=el('span','character-sprite '+cls);n.style.backgroundPosition=`${(index%4)*100/3}% ${index<4?0:100}%`;return n;}
 const npc=button('',()=>walkTo(place.npc[0]-12,place.npc[1]+2,true),'world-npc world-actor');npc.setAttribute('aria-label',`${place.name}에게 말 걸기`);npc.style.left=place.npc[0]+'%';npc.style.top=place.npc[1]+'%';
 if(place.baked){npc.classList.add('baked-npc');}else if(place.sprite===null){const img=el('img','farmer-sprite');img.src='assets/farmer.webp';img.alt='';npc.append(img);}else npc.append(sprite(place.sprite,''));
 npc.append(el('span','actor-name',place.name),el('span','edge-spark','✦'));
 const player=el('div','world-player world-actor');player.setAttribute('aria-label','여행자');player.append(sprite(0,''),el('span','actor-name','나'));
 const targetMark=el('span','walk-destination');targetMark.hidden=true;targetMark.setAttribute('aria-hidden','true');
 const footer=el('div','exploration-footer'),talk=button('대화하기',()=>api.talk(),'secondary');talk.id='nearby-talk';talk.disabled=true;
 const relation=el('span','resident-relation',returning?'약속을 마치고 돌아왔어요':state.phase==='play'?'부탁을 받은 사이':state.met.includes(ch.id)?'인사를 나눈 사이':'아직 인사를 나누지 않았어요');
 footer.append(info,relation,talk,button('그림첩으로',api.exit,'quiet-button'));
 world.append(prop,npc,targetMark,player);stage.append(world);root.append(header,stage,footer);main.append(root);
 const keys=new Set();const bounds=place.bounds||{minX:8,maxX:92,minY:85,maxY:93};
 let position=state.position?{x:Math.max(bounds.minX,Math.min(bounds.maxX,state.position.x)),y:Math.max(bounds.minY,Math.min(bounds.maxY,state.position.y))}:{x:place.spawn?.[0]||25,y:place.spawn?.[1]||89},target=null,pendingTalk=false,dead=false,raf=0,last=0,saveAt=0;
 const near=()=>Math.abs(position.x-place.npc[0])<17&&Math.abs(position.y-place.npc[1])<12;
 function paint(){player.style.left=position.x+'%';player.style.top=position.y+'%';player.style.zIndex=String(Math.round(position.y));npc.style.zIndex=String(Math.round(place.npc[1]));talk.disabled=!near();}
 function persist(){state.position={x:position.x,y:position.y};api.save();}
 function walkTo(x,y,shouldTalk=false){
  if(dead)return;target={x:Math.max(bounds.minX,Math.min(bounds.maxX,x)),y:Math.max(bounds.minY,Math.min(bounds.maxY,y))};pendingTalk=shouldTalk;keys.clear();targetMark.hidden=false;targetMark.style.left=target.x+'%';targetMark.style.top=target.y+'%';world.focus({preventScroll:true});setInfo(shouldTalk?`${place.name}에게 다가가고 있어요.`:'누른 자리로 걸어가요.');
 }
 function inspect(event){event?.stopPropagation();target=null;pendingTalk=false;targetMark.hidden=true;if(!state.looked.includes(ch.id)){state.looked.push(ch.id);api.save();}setInfo(`${place.propName}을 살펴보았어요.`);api.inspect(place.propName,place.observe);}
 function pointer(event){if(event.target.closest('button'))return;const box=world.getBoundingClientRect(),x=(event.clientX-box.left)/box.width*100,y=(event.clientY-box.top)/box.height*100;if(y<bounds.minY){setInfo('화면 아래쪽의 바닥을 누르면 걸어가요. 주민을 직접 눌러도 돼요.');return;}walkTo(x,y);}
 function keyDown(event){if(event.target.closest('button')||document.querySelector('dialog[open]'))return;const key=event.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){event.preventDefault();keys.add(key);target=null;pendingTalk=false;targetMark.hidden=true;}if(key==='enter'&&near()){event.preventDefault();api.talk();}}
 function keyUp(event){keys.delete(event.key.toLowerCase());if(!keys.size)persist();}
 function visibility(){if(document.hidden){keys.clear();target=null;pendingTalk=false;persist();}}
 function frame(time){
  if(dead)return;const dt=Math.min(.05,(time-last)/1000||0);last=time;
  if(!document.hidden&&!document.querySelector('dialog[open]')){
   let dx=0,dy=0;if(keys.size){dx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);dy=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);}
   else if(target){dx=target.x-position.x;dy=target.y-position.y;const distance=Math.hypot(dx,dy);if(distance<1){position={...target};target=null;targetMark.hidden=true;persist();paint();if(pendingTalk){pendingTalk=false;api.talk();return;}}else{dx/=distance;dy/=distance;}}
   const moving=!!(dx||dy);player.classList.toggle('walking',moving);if(moving){position.x=Math.max(bounds.minX,Math.min(bounds.maxX,position.x+dx*30*dt));position.y=Math.max(bounds.minY,Math.min(bounds.maxY,position.y+dy*30*dt));paint();if(time-saveAt>1200){persist();saveAt=time;}}
  }else keys.clear();
  raf=requestAnimationFrame(frame);
 }
 world.addEventListener('click',pointer);world.addEventListener('keydown',keyDown);world.addEventListener('keyup',keyUp);world.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',visibility);
 paint();setInfo(returning?'주민을 누르면 다가가 이야기를 전해요.':'바닥을 눌러 걸어가요. 방향키도 사용할 수 있어요. 주민을 누르면 다가가 말을 걸어요.');world.focus({preventScroll:true});raf=requestAnimationFrame(frame);
 Promise.all([`assets/scene-${ch.scene}.webp`,'assets/exploration-characters.png',...(place.sprite===null?['assets/farmer.webp']:[])].map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=reject;image.src=new URL(src,document.baseURI).href;}))).then(()=>{if(dead)return;world.dataset.ready='true';world.setAttribute('aria-busy','false');loading.remove();}).catch(()=>{if(!dead)loading.textContent='풍경을 불러오지 못했어요. 그림첩으로 돌아가 다시 열어 주세요.';});
 return {destroy(){if(dead)return;dead=true;cancelAnimationFrame(raf);keys.clear();document.removeEventListener('visibilitychange',visibility);persist();}};
}
