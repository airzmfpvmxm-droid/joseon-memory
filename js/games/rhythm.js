export const rhythmGames = { 7: createRhythm };

function createRhythm(ctx) {
  const make = (tag, cls, text) => ctx.el(tag, cls, text);
  const audio = ctx.audio;
  const beat = 60 / 72, total = 72 * beat, group = 'market-rhythm';
  let frame = 0, dead = false, paused = false, phase = 'ready', elapsed = 0;
  let anchor = 0, countdownAt = 0, resumeAt = 0, nextClick = 0, nextNote = 0;
  let score = 0, combo = 0, maxCombo = 0, actions = { drum: 0, clap: 0 }, assistStep = 0;
  let feedbackTimer = 0, usedAssist = false, useAudioClock = false;
  const notes = [];
  const pattern = ['drum', null, 'clap', null, 'drum', 'clap', null, 'clap'];
  for (let i = 0; i < 72; i++) {
    const type = pattern[i % pattern.length];
    if (type) notes.push({ at: i * beat, type, status: '', index: i });
  }
  const shell = make('section', 'rhythm-shell');
  shell.setAttribute('aria-label', '장터 리듬 합주');
  const headline = make('div', 'rhythm-headline', '장터의 작은 합주');
  const info = make('p', 'rhythm-instruction', 'F는 북, J는 손뼉. 쉼 칸에서는 소리를 잠깐 쉬어요.');
  const meter = make('div', 'rhythm-meter');
  const count = make('strong', 'rhythm-count', '준비');
  const scoreText = make('span', 'rhythm-score', '맞춘 소리 0 · 이어 치기 0');
  meter.append(count, scoreText);
  const stage = make('div', 'rhythm-stage');
  const laneLabels = make('div', 'rhythm-lane-labels');
  laneLabels.append(make('span', '', '북 · F'), make('span', '', '손뼉 · J'));
  const target = make('div', 'rhythm-target');
  target.append(make('span', '', '여기서'), make('span', '', '맞춰요'));
  const message = make('p', 'rhythm-feedback', '4박 준비 뒤 신호가 내려옵니다.');
  message.setAttribute('aria-live', 'polite');
  const decoration = make('div', 'rhythm-drum-art');
  decoration.innerHTML = '<svg viewBox="0 0 220 100" aria-hidden="true"><path d="M28 68 Q110 95 192 68 L183 34 Q110 10 37 34Z" fill="#b85e39" stroke="#674325" stroke-width="4"/><ellipse cx="110" cy="34" rx="74" ry="24" fill="#f4d7a1" stroke="#674325" stroke-width="4"/><path d="M49 44L61 76M76 53L85 82M110 57V86M143 53L136 82M171 44L160 76" stroke="#efcf87" stroke-width="3"/><path d="M42 13L82 33M172 10L139 32" stroke="#6b4429" stroke-width="7" stroke-linecap="round"/></svg>';
  stage.append(laneLabels, target, decoration);
  for (const note of notes) {
    note.node = make('div', `rhythm-note rhythm-note-${note.type}`, note.type === 'drum' ? '북' : '짝');
    note.node.setAttribute('aria-hidden', 'true'); stage.append(note.node);
  }
  const footer = make('div', 'rhythm-local-actions');
  const startButton = ctx.button('합주 시작', () => start(), 'rhythm-start');
  footer.append(startButton);
  shell.append(headline, info, meter, stage, message, footer); ctx.mount.append(shell);
  const drumButton = ctx.button('북 · F', () => hit('drum'), 'rhythm-pad rhythm-pad-drum');
  const clapButton = ctx.button('손뼉 · J', () => hit('clap'), 'rhythm-pad rhythm-pad-clap');
  drumButton.setAttribute('aria-label', '북 치기 F'); clapButton.setAttribute('aria-label', '손뼉 치기 J');
  ctx.controls.append(drumButton, clapButton);
  const clock = () => useAudioClock && audio?.time ? audio.time() : performance.now() / 1000;
  function feedback(text) {
    message.textContent = text;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { if (phase === 'playing' && !dead) message.textContent = '신호가 아래 선에 닿을 때 눌러요. 쉬는 칸도 음악이에요.'; }, 1000);
  }
  function cancelAudio() { audio?.cancelGroup?.(group); }
  function recalc() {
    score = 0; combo = 0; maxCombo = 0;
    for (const n of notes) {
      if (n.status === 'hit') { score++; combo++; maxCombo = Math.max(combo, maxCombo); }
      else if (n.status === 'miss') combo = 0;
    }
    scoreText.textContent = `맞춘 소리 ${score} · 이어 치기 ${combo}`;
  }
  async function start() {
    if (dead || paused || phase !== 'ready') return;
    phase = 'loading'; startButton.disabled = true;
    try { await audio?.unlock?.(); } catch {}
    useAudioClock = audio?.running === true;
    if (dead) return;
    if (paused) { phase = 'ready'; startButton.disabled = false; return; }
    footer.replaceChildren(); beginCountdown(0);
  }
  function beginCountdown(at) {
    cancelAudio(); resumeAt = at; elapsed = at; countdownAt = clock(); nextClick = 0; phase = 'countdown';
    ctx.say('4박 준비! 아래 선에 닿는 신호를 북과 손뼉으로 받아 주세요.');
    requestLoop();
  }
  function requestLoop() { cancelAnimationFrame(frame); if (!dead && !paused) frame = requestAnimationFrame(loop); }
  function loop() {
    if (dead || paused) return;
    const now = clock();
    if (phase === 'countdown') {
      const passed = now - countdownAt;
      count.textContent = String(Math.max(1, 4 - Math.floor(passed / beat)));
      while (nextClick < 4 && countdownAt + nextClick * beat <= now + .08) {
        if (useAudioClock) audio?.schedule?.('metronome', countdownAt + nextClick * beat, group); nextClick++;
      }
      if (passed >= 4 * beat) {
        anchor = countdownAt + 4 * beat - resumeAt;
        phase = 'playing'; nextClick = Math.floor(resumeAt / beat);
        nextNote = notes.findIndex(n => n.at >= resumeAt - .01); if (nextNote < 0) nextNote = notes.length;
        count.textContent = '함께!';
      }
    }
    if (phase === 'playing') {
      elapsed = Math.min(total, Math.max(0, now - anchor));
      count.textContent = `${Math.min(72, Math.floor(elapsed / beat) + 1)} / 72박`;
      ctx.setProgress(elapsed / total, '장터 합주'); ctx.setTime(Math.max(0, Math.ceil(total - elapsed)));
      while (nextClick < 72 && anchor + nextClick * beat <= now + .08) {
        if (useAudioClock) audio?.schedule?.('metronome', anchor + nextClick * beat, group); nextClick++;
      }
      // The accompaniment follows precisely the same beat map as the visible notes.
      while (nextNote < notes.length && anchor + notes[nextNote].at <= now + .08) {
        const n = notes[nextNote++]; if (useAudioClock) audio?.schedule?.(n.type, anchor + n.at, group);
      }
      let changed = false;
      for (const n of notes) if (!n.status && elapsed > n.at + .18) { n.status = 'miss'; changed = true; }
      if (changed) recalc();
      if (elapsed >= total) { finishRound(); return; }
    }
    renderNotes(); requestLoop();
  }
  function renderNotes() {
    for (const n of notes) {
      const delta = n.at - elapsed;
      const visible = phase !== 'assist' && !n.status && delta < 2.8 && delta > -.25;
      n.node.hidden = !visible;
      if (visible) n.node.style.top = `${80 - delta / 2.8 * 68}%`;
    }
  }
  function hit(type) {
    if (dead || paused) return;
    if (phase === 'assist') { assistInput(type); return; }
    if (phase !== 'playing') return;
    const time = clock() - anchor; actions[type]++;
    ctx.sound(type);
    const node = type === 'drum' ? drumButton : clapButton;
    node.classList.remove('rhythm-pad-flash'); void node.offsetWidth; node.classList.add('rhythm-pad-flash');
    const candidates = notes.filter(n => n.type === type && !n.status && Math.abs(n.at - time) <= .18);
    candidates.sort((a, b) => Math.abs(a.at - time) - Math.abs(b.at - time));
    if (candidates.length) { candidates[0].status = 'hit'; recalc(); feedback(combo >= 3 ? `${combo}번 이어졌어요!` : '좋아요, 박자가 만났어요!'); }
    else feedback('괜찮아요. 아래 선에 맞춰 다음 소리를 받아요.');
  }
  function finishRound() {
    phase = 'reflection'; cancelAnimationFrame(frame); cancelAudio(); renderNotes();
    ctx.setTime(null); ctx.setProgress(1, '합주 마무리');
    count.textContent = '잘 들었어요';
    footer.replaceChildren();
    if (actions.drum && actions.clap) {
      feedback(`북과 손뼉으로 함께했어요. 쉼 칸에서는 어떻게 했나요?`);
      footer.append(ctx.button('소리를 잠깐 쉬었어요', () => complete(), 'rhythm-finish'));
    } else {
      feedback('점수와 관계없이 참여할 수 있어요. 북·손뼉·쉼을 한 번씩 함께해 볼까요?');
      footer.append(ctx.button('차근차근 완료하기', () => assist(), 'rhythm-finish'));
    }
  }
  function complete() {
    if (dead || paused || phase === 'done') return;
    phase = 'done'; cancelAudio(); cancelAnimationFrame(frame);
    ctx.complete({ assisted: usedAssist, score: usedAssist ? 0 : score * 10 + maxCombo * 2, message: '북과 손뼉, 소리를 쉬는 칸으로 장터의 합주에 함께했어요. 이 리듬 놀이는 새로 만든 창작 장단이에요.' });
  }
  function assist() {
    if (dead || phase === 'done') return;
    usedAssist = true; cancelAudio(); cancelAnimationFrame(frame); phase = 'assist'; assistStep = 0;
    for (const n of notes) n.node.hidden = true;
    ctx.setTime(null); ctx.setProgress(0, '차근차근 합주');
    count.textContent = '한 동작씩'; footer.replaceChildren();
    info.textContent = '시간 제한 없이 북 → 손뼉 → 쉼을 함께해요.';
    feedback('먼저 아래의 북을 한 번 눌러 주세요.'); ctx.say('시간은 멈췄어요. 북을 한 번 치며 시작해 볼까요?');
  }
  function assistInput(type) {
    if (assistStep === 0 && type === 'drum') {
      ctx.sound('drum'); assistStep = 1; ctx.setProgress(1 / 3, '북 참여 완료'); feedback('둥! 이번에는 손뼉을 한 번 눌러 주세요.');
    } else if (assistStep === 1 && type === 'clap') {
      ctx.sound('clap'); assistStep = 2; ctx.setProgress(2 / 3, '손뼉 참여 완료'); feedback('짝! 이제 소리를 잠깐 쉬는 칸이에요.');
      footer.append(ctx.button('쉼 · 소리를 잠깐 쉬어요', () => { if (!paused && phase === 'assist' && assistStep === 2) { assistStep = 3; complete(); } }, 'rhythm-finish'));
    } else if (assistStep < 2) feedback(assistStep === 0 ? '첫 동작은 북이에요. 북을 눌러 볼까요?' : '이제 손뼉을 눌러 볼까요?');
  }
  function pause() {
    if (paused || dead) return;
    paused = true; cancelAnimationFrame(frame); cancelAudio();
    if (phase === 'playing') {
      resumeAt = Math.max(0, Math.floor(elapsed / (4 * beat)) * 4 * beat);
      for (const n of notes) if (n.at >= resumeAt - .01) n.status = '';
      recalc(); phase = 'paused-play';
    } else if (phase === 'countdown') phase = 'paused-play';
  }
  function resume() {
    if (dead || !paused) return;
    paused = false;
    if (phase === 'paused-play') beginCountdown(resumeAt);
  }
  function keydown(event) {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const type = event.code === 'KeyF' || event.code === 'ArrowLeft' ? 'drum' : event.code === 'KeyJ' || event.code === 'ArrowRight' ? 'clap' : null;
    if (type && (phase === 'playing' || phase === 'assist') && !paused) { event.preventDefault(); hit(type); }
  }
  document.addEventListener('keydown', keydown);
  ctx.say('장터에서 북과 손뼉으로 짧은 합주를 해요. 준비되면 합주 시작을 눌러 주세요.');
  ctx.setTime(null); ctx.setProgress(0, '합주 준비');
  if (ctx.isAssist()) assist();
  return {
    pause, resume, assist,
    destroy() { dead = true; cancelAnimationFrame(frame); clearTimeout(feedbackTimer); cancelAudio(); document.removeEventListener('keydown', keydown); }
  };
}
