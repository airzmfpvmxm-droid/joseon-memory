const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const bounded=(value,min,max,fallback)=>finite(value)?Math.min(max,Math.max(min,value)):fallback;

export function normalizeSavedGame(value){
  const raw=record(value)?value:{};
  const state={completed:{},best:{},snapshots:{},last:1,muted:true,story:normalizeStory(raw.story)};
  if(record(raw.completed))for(let id=1;id<=8;id++)if(raw.completed[id]===true)state.completed[id]=true;
  if(record(raw.best))for(const [key,score] of Object.entries(raw.best))if(/^[1-8]:(normal|assist)$/.test(key)&&finite(score)&&score>=0)state.best[key]=Math.min(1e9,Math.round(score));
  if(record(raw.snapshots)&&record(raw.snapshots[6])&&(!state.completed[6]||(state.story.memories===5&&state.story.phase==='play')))state.snapshots[6]=normalizeGrainSnapshot(raw.snapshots[6]);
  if(Number.isInteger(raw.last)&&raw.last>=1&&raw.last<=8)state.last=raw.last;
  if(typeof raw.muted==='boolean')state.muted=raw.muted;
  return state;
}

function normalizeStory(value){
  const raw=record(value)?value:{};
  const memories=Number.isInteger(raw.memories)&&raw.memories>=0&&raw.memories<=8?raw.memories:0;
  const started=raw.started===true||memories>0;
  let phase=['prologue','before','play','after','ending','done'].includes(raw.phase)?raw.phase:'prologue';
  if(memories===8&&!['ending','done'].includes(phase))phase='ending';
  if(memories<8&&['ending','done'].includes(phase))phase=started?'before':'prologue';
  if(memories>0&&phase==='prologue')phase='before';
  const position=record(raw.position)&&finite(raw.position.x)&&finite(raw.position.y)?{x:bounded(raw.position.x,8,92,25),y:bounded(raw.position.y,75,95,89)}:null;
  const looked=Array.isArray(raw.looked)?[...new Set(raw.looked.filter(n=>Number.isInteger(n)&&n>=1&&n<=8))]:[];
  const met=Array.isArray(raw.met)?[...new Set(raw.met.filter(n=>Number.isInteger(n)&&n>=1&&n<=8))]:[];
  return {started,memories,phase,position,looked,met,line:Number.isInteger(raw.line)&&raw.line>=0&&raw.line<8?raw.line:0};
}

export function normalizeGrainSnapshot(value){
  const raw=record(value)?value:{};
  const sorted=Array.isArray(raw.sorted)?[...new Set(raw.sorted.filter(v=>Number.isInteger(v)&&v>=0&&v<6))]:[];
  const allowedRead=['record','demand','sample'];
  const read=Array.isArray(raw.read)?[...new Set(raw.read.filter(v=>allowedRead.includes(v)))]:[];
  const meterDone=sorted.length===6&&raw.meterDone===true;
  const total=read.length===3&&raw.total===11?11:null;
  const extra=total===11&&raw.extra===4?4:null;
  const linked=extra===4&&raw.linked===true;
  const available=linked&&meterDone?3:meterDone?2:sorted.length===6?1:0;
  const requested=Number.isInteger(raw.step)&&raw.step>=0&&raw.step<=3?raw.step:available;
  return {step:Math.min(requested,available),selected:Number.isInteger(raw.selected)&&raw.selected>=0&&raw.selected<6?raw.selected:null,sorted,mistakes:Math.round(bounded(raw.mistakes,0,9999,0)),fill:bounded(raw.fill,0,2.5,0),target:raw.target===2?2:1,meterDone,read,total,extra,linked,quality:linked&&raw.quality===true};
}
