import assert from 'node:assert/strict';
import {normalizeSavedGame} from '../js/save-state.js';
import {storyChapters,chapterDialogue,endingDialogue,initialCaption,finalCaptions,prologue} from '../js/story.js';
import {chapters} from '../js/chapters.js';
import {renderJournal} from '../js/resident-questions.js';

// Pure Node regression tests. These do not establish browser layout or student engagement.
const checks=[];
function check(name,fn){fn();checks.push({name,passed:true});}
const roundtrip=raw=>normalizeSavedGame(JSON.parse(JSON.stringify(raw)));
const joined=lines=>lines.map(([,text])=>text).join('\n');

check('initial promise and flawed caption are present in the actual prologue',()=>{
 const text=joined(prologue);
 assert.ok(text.includes(initialCaption));
 assert.ok(text.includes('할머니'));
 assert.ok(text.includes('상상화'));
 assert.ok(text.includes('내가 알아와서'));
});

check('256 note paths survive save roundtrip and reach actual dialogue callbacks',()=>{
 for(let mask=0;mask<256;mask++){
  const notes=Object.fromEntries(storyChapters.map((_,i)=>[i+1,(mask>>i)&1]));
  for(const caption of [0,1]){
   const state=roundtrip({story:{memories:8,phase:'ending',notes,caption,line:8}}).story;
   assert.deepEqual(state.notes,notes);
   assert.equal(state.caption,caption);
   for(let id=1;id<=8;id++){
    const entry=storyChapters[id-1],choice=notes[id];
    assert.equal(chapterDialogue(id,'after',state).at(-1)[1],entry.notes[choice].reply);
    assert.notEqual(entry.notes[0].reply,entry.notes[1].reply);
    if(id>1){
     const first=chapterDialogue(id,'before',state)[0][1];
     assert.ok(first.includes(storyChapters[id-2].notes[notes[id-1]].text));
     assert.ok(!first.includes(storyChapters[id-2].notes[1-notes[id-1]].text));
    }
   }
   const ending=joined(endingDialogue(state));
   for(const id of [1,4,6,8]){
    assert.ok(ending.includes(storyChapters[id-1].notes[notes[id]].text));
    assert.ok(!ending.includes(storyChapters[id-1].notes[1-notes[id]].text));
   }
   assert.ok(ending.includes(finalCaptions[caption].text));
   assert.ok(ending.includes(initialCaption));
  }
 }
});

check('last chapter is explicitly recalled and final line index 8 survives reload',()=>{
 const notes=Object.fromEntries(storyChapters.map((_,i)=>[i+1,i%2]));
 const raw={story:{memories:8,phase:'ending',notes,caption:1,line:8}};
 const loaded=roundtrip(raw).story;
 assert.equal(loaded.line,8);
 const lines=endingDialogue(loaded);
 assert.equal(lines.length,9);
 assert.ok(lines[loaded.line][1].includes(finalCaptions[1].text));
 assert.ok(joined(lines).includes(storyChapters[7].notes[1].text));
});

check('legacy completed saves retain progress without invented notes or caption',()=>{
 const raw={completed:{1:true,6:true,8:true},best:{'1:normal':200,'6:assist':150},last:8,muted:false,story:{memories:8,phase:'done',line:0,met:[1,6,8],looked:[1,6],asked:['1:0'],reviewed:[1,6]}};
 const loaded=roundtrip(raw);
 assert.deepEqual(loaded.completed,raw.completed);
 assert.deepEqual(loaded.best,raw.best);
 assert.equal(loaded.muted,false);
 assert.equal(loaded.story.memories,8);
 assert.equal(loaded.story.phase,'done');
 assert.deepEqual(loaded.story.notes,{});
 assert.equal(loaded.story.caption,null);
 const ending=joined(endingDialogue(loaded.story));
 for(const entry of storyChapters)for(const note of entry.notes)assert.ok(!ending.includes(note.text));
 assert.ok(!ending.includes(finalCaptions[0].text));
 assert.ok(!ending.includes(finalCaptions[1].text));
});

check('pending current-chapter note survives but invalid and future values do not',()=>{
 const loaded=roundtrip({story:{memories:1,phase:'after',line:2,notes:{1:0,2:1,3:0,4:'1',5:true},caption:0}}).story;
 assert.deepEqual(loaded.notes,{1:0,2:1});
 assert.equal(loaded.caption,null);
 assert.equal(chapterDialogue(2,'after',loaded).at(-1)[1],storyChapters[1].notes[1].reply);
 for(const notes of [null,[],true,'0'])assert.deepEqual(roundtrip({story:{memories:8,notes}}).story.notes,{});
});

class Node {
 constructor(tag,cls='',text=''){this.tag=tag;this.className=cls;this.text=text;this.children=[];this.dataset={};this.attributes={};}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(key,value){this.attributes[key]=value;}
 focus(){}
 querySelector(selector){for(const node of this.children){if(typeof node==='object'){if(node.tag===selector)return node;const child=node.querySelector(selector);if(child)return child;}}return null;}
}
const allText=node=>typeof node==='object'?node.text+node.children.map(allText).join(''):String(node);

check('journal renders each selected note rather than the unselected alternative',()=>{
 for(let id=1;id<=8;id++)for(const choice of [0,1]){
  const state=roundtrip({story:{memories:8,phase:'done',notes:{[id]:choice}}}).story;
  const main=new Node('main');
  const api={main,chapters,state,el:(...args)=>new Node(...args),button:text=>new Node('button','',text),home(){},select(){},visit(){},continue(){},review(){},goal(){return '';}};
  renderJournal(api,id,Math.floor((id-1)/4));
  const output=allText(main);
  assert.ok(output.includes(storyChapters[id-1].notes[choice].text));
  assert.ok(!output.includes(storyChapters[id-1].notes[1-choice].text));
 }
});

console.log(JSON.stringify({kind:'Node source/data regression',noteCombinations:256,captionVariants:2,journalCases:16,checks,passed:true,browserTest:false,studentPlaytest:false},null,2));
