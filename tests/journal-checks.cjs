const assert=require('assert/strict');
module.exports=async function checkJournal(page,layout,record){
 await page.getByRole('button',{name:'만난 사람과 기억',exact:true}).click();await page.locator('[data-memory="1"]').click();await layout(page,'journal-current-and-completed');
 assert.equal(await page.locator('[data-memory="3"]').isDisabled(),true);
 const snapshot=await page.evaluate(()=>{const {memories,phase,line,position}=JSON.parse(localStorage.getItem('joseon-memory.play.v1')).story;return {memories,phase,line,position};});
 await page.getByRole('button',{name:'이곳 다시 찾아가기',exact:true}).click();await page.locator('.exploration[data-visiting="true"] .exploration-world[data-ready="true"]').waitFor();await layout(page,'revisit-first-chapter');
 await page.locator('.world-npc').click();await page.locator('.question-choice').first().waitFor();await page.locator('.question-choice').first().click();await page.getByRole('button',{name:'다른 점도 물어보기',exact:true}).click();await page.getByRole('button',{name:'다시 둘러보기',exact:true}).click();
 const player=page.locator('.world-player'),before=await player.evaluate(n=>n.style.left);await page.locator('.exploration-world').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');assert.notEqual(await player.evaluate(n=>n.style.left),before);
 await page.getByRole('button',{name:'만난 사람과 기억',exact:true}).click();const after=await page.evaluate(()=>{const {memories,phase,line,position}=JSON.parse(localStorage.getItem('joseon-memory.play.v1')).story;return {memories,phase,line,position};});assert.deepEqual(after,snapshot);record('revisit-preserves-current-quest',{passed:true,memories:after.memories,phase:after.phase});
 await page.locator('[data-memory="2"]').click();await page.getByRole('button',{name:'현재 이야기로',exact:true}).click();assert.equal(await page.locator('.exploration').getAttribute('data-chapter'),'2');
};
