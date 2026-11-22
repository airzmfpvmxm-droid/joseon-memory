import {storyChapters} from './story.js';
// Optional conversations; answers never determine historical outcomes or rewards.
export const residentQuestions=[
 [
  {q:'새 도읍에는 누가 모였나요?',a:'건물을 짓는 목수처럼 새 도읍에 필요한 일을 하는 사람들이 모였지. 궁궐과 길도 여러 사람의 손으로 만들어졌단다.'},
  {q:'우리의 길 퍼즐은 실제 지도인가요?',a:'길을 잇는 놀이는 이해를 돕기 위해 만든 거야. 실제 한양의 길이나 왕이 오가는 길은 시기와 목적에 따라 달랐단다.'}
 ],
 [
  {q:'새 글자가 왜 반가웠나요?',a:'마음을 전하고 싶어도 글로 적기 어려웠어요. 세종은 글을 몰라 어려움을 겪는 백성을 위해 훈민정음을 만들었어요.'},
  {q:'여기서 만든 글자는 옛 글자인가요?',a:'우리는 오늘날 쓰는 한글로 조립 놀이를 했어요. 옛 글자의 철자와 창제 과정을 그대로 재현한 것은 아니에요.'}
 ],
 [
  {q:'마을 사람들은 어떻게 도왔나요?',a:'이웃의 일에 손을 보태고 함께 지킬 약속도 만들었지. 향약에는 서로 돕고 바르게 살자는 뜻이 담겨 있었단다.'},
  {q:'모두 같은 생활을 했나요?',a:'그렇지는 않았어. 신분에 따라 할 수 있는 일과 부담이 달랐단다. 서로 돕는 모습과 삶의 제약을 함께 살펴보렴.'}
 ],
 [
  {q:'보급품도 전쟁에 도움이 되었나요?',a:'싸우는 일만 있었던 것은 아니야. 물과 식량을 옮기고 서로를 돌보는 여러 사람의 노력도 필요했단다.'},
  {q:'심부름을 마치면 전쟁이 끝나나요?',a:'이 심부름 하나로 전쟁이 끝난 것은 아니야. 임진왜란과 병자호란도 시기와 배경이 다른 전쟁으로 구분해서 기억해야 해.'}
 ],
 [
  {q:'성은 누가 만들었나요?',a:'수원 화성에는 여러 일꾼의 노동과 기술이 모였어. 돌을 옮기는 작은 일에도 많은 사람의 수고가 담겨 있지.'},
  {q:'정조는 어떤 노력을 했나요?',a:'정조는 규장각을 설치하고 수원 화성을 건설하는 등 나라를 다스리는 데 힘썼어. 영조도 탕평책 등 여러 정책을 폈단다.'}
 ],
 [
  {q:'빌린 양보다 많이 갚으면 모두 잘못인가요?',a:'정해진 이자가 있을 수 있어요. 그래서 빌린 조건, 실제 받은 곡식, 추가로 내라는 요구를 함께 확인해야 해요.'},
  {q:'이 사연에서는 무엇이 달랐나요?',a:'놀이 속 기록은 10되에 정해진 이자 1되였어요. 그런데 15되를 요구했지요. 추가 4되의 요구와 곡식 품질 문제를 구분해 살펴보았어요.'}
 ],
 [
  {q:'장터에서는 어떤 문화를 즐겼나요?',a:'조선 후기에는 판소리와 탈놀이, 한글 소설, 풍속화와 민화 등 서민 문화가 인기를 얻었단다.'},
  {q:'우리 합주는 옛 판소리와 같은가요?',a:'우리 합주는 게임을 위해 새로 만든 장단 놀이야. 실제 판소리 공연의 방식과 같은 것으로 생각하지는 말아 줘.'}
 ],
 [
  {q:'천리경으로 무엇을 볼 수 있나요?',a:'멀리 있는 것을 가까이 보도록 돕는 도구란다. 우리는 나루터의 풍경을 관찰했지. 천체를 관찰한 활동과는 구분해 기억하렴.'},
  {q:'또 어떤 새로운 문물이 있었나요?',a:'조선 후기에는 천리경과 자명종, 세계 지도 같은 새로운 문물이 알려졌단다. 낯선 문물은 세상을 보는 시야에도 영향을 주었지.'}
 ]
];

export function renderJournal(api,selection=1,page=0){
 const {el,button,main,chapters,state}=api;
 const chosen=chapters[Math.max(0,Math.min(7,selection-1))],complete=chosen.id<=state.memories,current=chosen.id===state.memories+1;
 const root=el('section','memory-journal');root.dataset.page=page;
 const head=el('header','journal-heading');head.append(el('div','', '그림첩 · 만난 사람과 찾은 기억'),button('그림첩 첫 화면',api.home,'quiet-button'));
 const body=el('div','journal-body'),list=el('div','journal-list');list.setAttribute('aria-label','시대별 기억 목록');
 for(const ch of chapters.slice(page*4,page*4+4)){
  const done=ch.id<=state.memories,now=ch.id===state.memories+1,locked=!done&&!now;
  const card=button('',()=>api.select(ch.id,page),'journal-entry');card.dataset.memory=ch.id;card.disabled=locked;card.setAttribute('aria-pressed',String(ch.id===chosen.id));
  card.append(el('span','journal-era',ch.era),el('strong','',`${ch.id}. ${ch.title}`),el('span','journal-state',done?'기억을 남긴 곳':now?'지금 찾아갈 곳':'아직 열리지 않은 기억'));list.append(card);
 }
 const pages=el('div','journal-pages');const prev=button('앞 네 장',()=>api.select(Math.min(4,selection),0),'quiet-button'),next=button('뒤 네 장',()=>api.select(Math.max(5,selection),1),'quiet-button');prev.disabled=page===0;next.disabled=page===1;pages.append(prev,el('span','',`${page+1} / 2`),next);list.append(pages);
 const detail=el('article','journal-detail');detail.append(el('p','eyebrow',chosen.era),el('h1','',chosen.title));
 if(complete||current){
  const relation=complete?'부탁을 함께 마친 사이':state.met.includes(chosen.id)?'인사를 나눈 사이':'아직 만나지 않았어요';
  const selected=state.notes[chosen.id],note=selected===0||selected===1?storyChapters[chosen.id-1].notes[selected]:null;
  detail.append(el('p','journal-relation',`${chosen.speaker} · ${relation}`),el('p','journal-summary',complete&&note?`내가 남긴 기록: “${note.text}”`:complete?chosen.after:api.goal(chosen.id)),el('p','journal-evidence',state.looked.includes(chosen.id)?'풍경 속 물건을 살펴보았어요.':'풍경 속 물건도 직접 살펴보세요.'));
  const asked=state.asked.filter(key=>key.startsWith(chosen.id+':')).length;detail.append(el('p','journal-evidence',`궁금한 점을 나눈 이야기 ${asked} / 2`));
  const actions=el('div','journal-actions');actions.append(button(complete?'이곳 다시 찾아가기':'현재 이야기로',()=>complete?api.visit(chosen.id):api.continue(),'primary'));if(complete){detail.append(el('p','journal-review-status',state.reviewed.includes(chosen.id)?'놀이 뒤의 생각을 남겼어요.':'놀이에서 떠올린 생각도 남겨 보세요.'));actions.append(button('이 기억 되짚기',()=>api.review(chosen.id),'secondary'));}detail.append(actions);
 }else detail.append(el('p','journal-summary','앞선 사람들의 기억을 찾으면 이 장을 펼칠 수 있어요.'));
 detail.append(el('p','journal-time-note','그림첩은 서로 다른 시대의 기억이에요. 한 마을에서 같은 날 벌어진 사건은 아니에요.'));
 body.append(list,detail);root.append(head,body);main.append(root);head.querySelector('button').focus();
}
