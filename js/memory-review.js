// Short optional retrieval activity, based on existing approved chapter themes.
export const memoryReviews=[
 {q:'한양의 길을 이으며 누구의 삶을 떠올렸나요?',choices:['새 도읍을 만들며 여러 일을 맡은 사람들','왕 혼자 모든 길과 건물을 만든 모습'],correct:0,why:'도읍을 만드는 데에는 목수를 비롯해 여러 사람의 일이 필요했어요. 퍼즐의 길 모양은 실제 한양 지도와 구분해요.'},
 {q:'주민이 새 글자를 반긴 까닭은 무엇일까요?',choices:['글을 아는 사람만 마음을 전하게 되어서','자신의 말을 글로 전할 기회가 생겨서'],correct:1,why:'세종은 글을 몰라 어려움을 겪는 백성을 위해 훈민정음을 만들었어요. 이 조립 놀이는 오늘날 한글을 이용한 활동이에요.'},
 {q:'이웃을 돕는 모습과 신분에 따른 제약은 어떻게 볼까요?',choices:['서로 돕는 모습과 삶의 제약을 함께 살펴봐요','서로 도왔으니 모든 사람의 생활이 같았어요'],correct:0,why:'향약에는 서로 돕고 바르게 살자는 뜻이 있었어요. 한편 신분에 따른 부담과 제약도 있었으므로 함께 살펴보아야 해요.'},
 {q:'보급품을 옮긴 일을 어떻게 기억할까요?',choices:['심부름 한 번으로 전쟁 전체를 끝냈어요','전쟁을 견딘 여러 사람의 노력 중 하나예요'],correct:1,why:'수군과 의병, 백성, 지원군 등 여러 사람의 노력이 있었어요. 보급 심부름 하나로 전쟁 전체가 끝났다고 말하지 않아요.'},
 {q:'화성의 돌을 옮기며 무엇을 생각했나요?',choices:['여러 사람의 노동과 기술이 성을 만들었어요','수레 점수만 높으면 나라의 모든 문제가 해결돼요'],correct:0,why:'화성 건설에는 여러 사람의 노동과 기술이 필요했어요. 수레 놀이의 점수는 나라를 다스린 정책을 평가하는 점수가 아니에요.'},
 {q:'곡식을 갚으라는 요구가 부당한지 어떻게 살필까요?',choices:['빌린 양보다 많이 요구하면 모두 부당해요','약속한 조건·실제 받은 곡식·추가 요구를 비교해요'],correct:1,why:'정해진 이자가 있을 수 있어요. 놀이에서는 원금 10되와 이자 1되, 추가 요구 4되, 품질 문제를 구분해 살폈어요.'},
 {q:'장터의 합주와 조선 후기 문화를 어떻게 연결할까요?',choices:['삶을 표현하고 문화를 즐긴 사람들을 떠올려요','우리 게임의 박자가 실제 모든 판소리 공연과 같아요'],correct:0,why:'조선 후기에는 여러 서민 문화가 인기를 얻었어요. 이 합주는 창작 장단 놀이이므로 실제 판소리 형식과 같다고 보지는 않아요.'},
 {q:'천리경으로 풍경을 찾은 뒤 무엇을 기억할까요?',choices:['이 놀이로 우주의 모든 비밀을 알아냈어요','새로운 문물을 통해 더 넓은 시야를 만날 수 있어요'],correct:1,why:'천리경 등 새로운 문물은 사람들의 시야를 넓혔어요. 이번 활동은 나루터의 풍경 관찰이며 천체 관찰을 했다는 뜻은 아니에요.'}
];

export function openMemoryReview(api,id){
 const entry=memoryReviews[id-1],{el,button}=api;
 api.close();const body=el('div','memory-review');body.append(el('p','',entry.q));
 const feedback=el('p','review-feedback','점수 없이 함께 생각해요. 다른 생각을 골라도 다시 살펴볼 수 있어요.');feedback.setAttribute('role','status');
 entry.choices.forEach((text,index)=>body.append(button(text,()=>{
  if(index!==entry.correct){feedback.textContent='다시 생각해 볼까요? '+entry.why;feedback.classList.remove('review-confirmed');return;}
  if(!api.state().reviewed.includes(id))api.state().reviewed.push(id);api.save();feedback.textContent='이 생각을 그림첩에 남겼어요. '+entry.why;feedback.classList.add('review-confirmed');
 },'review-answer')));
 body.append(feedback);
 api.dialog('이 기억 되짚기',body,[button('이야기로 돌아가기',()=>{api.close();api.return();},'primary')],`${id}장 · 놀이와 배운 내용 연결`);
}
