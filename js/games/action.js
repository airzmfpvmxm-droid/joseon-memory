const cartArt = `<svg viewBox="0 0 150 120" aria-hidden="true"><g stroke="#59371e" stroke-width="4" stroke-linejoin="round"><path d="M24 47h99l-6 43H32z" fill="#b77836"/><path d="M35 53h78M35 67h78M43 48v41M70 48v41M98 48v41" fill="none"/><path d="M47 48c-20-4-25-30-6-32 3-10 24-12 28 0 15-7 29 5 25 18 20-2 24 10 21 16" fill="#eac36d"/><path d="M38 25l24 16M69 19l12 22M100 36l-4 14" fill="none" stroke-width="2"/><circle cx="43" cy="95" r="15" fill="#a66c32"/><circle cx="108" cy="95" r="15" fill="#a66c32"/><path d="M43 81v28M29 95h28M108 81v28M94 95h28M122 67l21 14" fill="none" stroke-width="3"/></g></svg>`;
const stoneCartArt = `<svg viewBox="0 0 180 135" aria-hidden="true"><g stroke="#51351f" stroke-width="4" stroke-linejoin="round"><path d="M18 76h126l-7 18H29z" fill="#b88145"/><path d="M34 76l-2-35 43-11 26 21-5 25z" fill="#aaa998"/><path d="M74 31l2 32 25-12M33 41l43 22 20 13" fill="none" stroke="#747568" stroke-width="2"/><path d="M98 75l3-31 25-8 18 15-3 25z" fill="#cac9b6"/><circle cx="48" cy="106" r="18" fill="#95612e"/><circle cx="126" cy="106" r="18" fill="#95612e"/><path d="M48 89v34M31 106h34M126 89v34M109 106h34M143 81l30 9" fill="none" stroke-width="3"/></g></svg>`;

function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; }
function button(ctx, label, callback, cls = '') {
  const b = node('button', `action-button ${cls}`, label); b.type = 'button'; b.addEventListener('click', callback); ctx.controls.append(b); return b;
}
function createSession(ctx) {
  let paused = false, disposed = false, finished = false, frame = 0, previous = performance.now();
  const cleanups = [];
  const session = {
    get paused() { return paused; }, get finished() { return finished; },
    loop(update) {
      const tick = now => {
        if (disposed || finished) return;
        const raw = (now - previous) / 1000; previous = now;
        if (!paused && raw >= 0 && raw < .25) update(Math.min(raw, .05));
        if (!disposed && !finished) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    },
    complete(score, message, assisted=false) { if (finished || disposed) return; finished = true; cancelAnimationFrame(frame); ctx.complete({ score: Math.round(score), message, assisted }); },
    pause() { paused = true; }, resume() { previous = performance.now(); paused = false; },
    addCleanup(fn) { cleanups.push(fn); },
    destroy() { disposed = true; cancelAnimationFrame(frame); cleanups.forEach(fn => fn()); ctx.mount.replaceChildren(); ctx.controls.replaceChildren(); }
  };
  return session;
}

function createRunner(ctx) {
  const life = createSession(ctx);
  const stage = node('div', 'action-stage runner-stage');
  const scene = node('div', 'runner-scene');
  scene.innerHTML = `<div class="runner-sky"></div><div class="runner-hill runner-hill-a"></div><div class="runner-hill runner-hill-b"></div><div class="runner-road"><div class="runner-dash runner-dash-a"></div><div class="runner-dash runner-dash-b"></div></div><div class="runner-trees runner-trees-a"></div><div class="runner-trees runner-trees-b"></div>`;
  const caption = node('div', 'action-caption', '안전한 보급길 · 임진왜란 때의 가상 장면');
  const meter = node('div', 'action-local-status'); meter.setAttribute('aria-live', 'polite');
  const itemLayer = node('div', 'runner-items');
  const cart = node('div', 'runner-cart'); cart.innerHTML = cartArt;
  const assistCard = node('div', 'action-assist-card'); assistCard.hidden = true;
  const assistText = node('p'); const lanes = node('div', 'action-lane-options');
  assistCard.append(assistText, lanes);
  scene.append(itemLayer, cart); stage.append(scene, caption, meter, assistCard); ctx.mount.append(stage);
  let lane = 1, elapsed = 0, nextSpawn = 2, row = 0, collected = 0, actions = 0, bumpUntil = 0, grace = 0;
  let assist = false, assistStep = 0; const items = [];
  const blockedSequence = [0, 2, 1, 0, 1, 2, 0, 2];
  const setLane = value => {
    if (life.paused || life.finished || assist) return;
    const next = Math.max(0, Math.min(2, value));
    if (next !== lane) { lane = next; actions++; ctx.sound('move'); }
    cart.style.left = `${18 + lane * 32}%`;
  };
  button(ctx, '왼쪽 길', () => setLane(lane - 1));
  const laneLabel = node('span', 'action-control-label', '좌우 화살표로도 이동'); ctx.controls.append(laneLabel);
  button(ctx, '오른쪽 길', () => setLane(lane + 1));
  const key = e => { if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { e.preventDefault(); setLane(lane - 1); } if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') { e.preventDefault(); setLane(lane + 1); } };
  window.addEventListener('keydown', key); life.addCleanup(() => window.removeEventListener('keydown', key));
  function spawn() {
    const blocked = blockedSequence[row % blockedSequence.length], prize = (blocked + 1) % 3;
    for (const [kind, targetLane] of [['puddle', blocked], ['supply', prize]]) {
      const el = node('div', `runner-item runner-${kind}`); el.style.left = `${18 + targetLane * 32}%`;
      if (kind === 'supply') el.innerHTML = `<svg viewBox="0 0 70 65" aria-hidden="true"><path d="M17 18q18-10 36 0l7 34q-25 14-50 0z" fill="#e5bc69" stroke="#624326" stroke-width="4"/><path d="M17 20l36 0M25 9h20l-4 10H29z" fill="#a87a3e" stroke="#624326" stroke-width="3"/></svg>`;
      else el.innerHTML = `<svg viewBox="0 0 100 55" aria-hidden="true"><path d="M5 31Q10 8 38 15Q67 1 88 22Q110 46 59 48Q15 55 5 31" fill="#8dafa8" stroke="#6b6545" stroke-width="4"/><path d="M28 29q15-8 29-3M56 36l16-4" stroke="#d5e5d6" stroke-width="3" fill="none"/></svg>`;
      itemLayer.append(el); items.push({ el, kind, lane: targetLane, y: -12, checked: false });
    }
    row++;
  }
  function enterAssist() {
    if (life.finished) return; assist = true; stage.classList.add('action-assisted'); assistCard.hidden = false;
    items.forEach(item => item.el.remove()); items.length = 0;
    ctx.setTime(null); laneLabel.textContent = '세 번 길을 골라 운반해요';
    ctx.say('시간 없이 길을 살펴봐요. 웅덩이가 없는 차선을 골라 주세요.'); renderAssist();
  }
  function renderAssist() {
    const blocked = [0, 2, 1][assistStep % 3];
    assistText.textContent = `${assistStep + 1} / 3 구간 · ${['왼쪽', '가운데', '오른쪽'][blocked]} 길에 웅덩이가 있어요.`;
    lanes.replaceChildren();
    for (let i = 0; i < 3; i++) {
      const b = node('button', 'action-button', `${['왼쪽', '가운데', '오른쪽'][i]} 길${i === blocked ? ' · 웅덩이' : ' · 안전'}`); b.type = 'button';
      b.addEventListener('click', () => {
        if (life.paused || life.finished) return;
        if (i === blocked) { ctx.say('웅덩이가 없는 다른 길을 살펴봐요.'); ctx.sound('soft'); return; }
        lane = i; actions++; cart.style.left = `${18 + lane * 32}%`; assistStep++; collected++;
        ctx.sound('collect'); ctx.setProgress(assistStep / 3, `${assistStep}/3 구간`);
        if (assistStep === 3) life.complete(100, '길을 직접 골라 보급품을 전달했어요. 주민들의 피란을 돕는 작은 힘이 되었어요.', true); else renderAssist();
      }); lanes.append(b);
    }
  }
  cart.style.left = '50%'; ctx.say('왼쪽·오른쪽 길로 움직여 웅덩이를 피하고 곡식 묶음을 모아 보세요.'); ctx.setTime(75);
  life.loop(dt => {
    if (assist) return;
    elapsed += dt; grace = Math.max(0, grace - dt); ctx.setTime(Math.max(0, Math.ceil(75 - elapsed))); ctx.setProgress(Math.min(elapsed / 75, 1), '보급소까지');
    scene.style.setProperty('--road-shift', `${(elapsed * 90) % 100}px`); cart.classList.toggle('runner-bump', elapsed < bumpUntil);
    if (elapsed > nextSpawn) { spawn(); nextSpawn += 2.5; }
    for (let n = items.length - 1; n >= 0; n--) {
      const item = items[n]; item.y += dt * 19; item.el.style.top = `${item.y}%`;
      if (!item.checked && item.y > 76) {
        item.checked = true;
        if (item.lane === lane) {
          if (item.kind === 'supply') { collected++; item.el.classList.add('runner-collected'); ctx.sound('collect'); }
          else if (grace <= 0) { bumpUntil = elapsed + .6; ctx.sound('soft'); ctx.say('잠깐 멈췄어요. 떨어진 묶음은 동행이 챙겼으니 다시 길을 골라요.'); }
        }
      }
      if (item.y > 110) { item.el.remove(); items.splice(n, 1); }
    }
    meter.textContent = `모은 보급 묶음 ${collected} · 남은 길 ${Math.max(0, Math.ceil((75 - elapsed) / 75 * 100))}%`;
    if (elapsed >= 75) {
      if (actions === 0) enterAssist();
      else life.complete(100 + collected * 10, '안전한 길을 지나 보급소에 도착했어요. 물과 식량이 주민들에게 전달됩니다.');
    }
  });
  if (ctx.isAssist()) enterAssist();
  return { pause: () => life.pause(), resume: () => { grace = 2; life.resume(); }, assist: enterAssist, destroy: () => life.destroy() };
}

function createBalance(ctx) {
  const life = createSession(ctx);
  const stage = node('div', 'action-stage balance-stage');
  const world = node('div', 'balance-world');
  world.innerHTML = `<div class="balance-castle"><span></span><span></span><span></span></div><div class="balance-distant-hill"></div>`;
  const ground = node('div', 'balance-ground'); const cart = node('div', 'balance-cart'); cart.innerHTML = stoneCartArt; ground.append(cart); world.append(ground);
  const caption = node('div', 'action-caption', '정조 때 수원 화성 · 돌을 나르는 작은 도움');
  const gauge = node('div', 'balance-gauge'); gauge.setAttribute('role', 'meter'); gauge.setAttribute('aria-label', '수레 기울기'); gauge.setAttribute('aria-valuemin', '-30'); gauge.setAttribute('aria-valuemax', '30');
  gauge.innerHTML = '<span class="balance-gauge-safe"></span><i class="balance-gauge-needle"></i>';
  const status = node('div', 'action-local-status'); status.setAttribute('aria-live', 'polite');
  const assistCard = node('div', 'action-assist-card'); assistCard.hidden = true; stage.append(world, caption, gauge, status, assistCard); ctx.mount.append(stage);
  let angle = 0, velocity = 0, distance = 0, elapsed = 0, controls = 0, halted = false, recovery = 0, assisted = false, step = 0, goodTime = 0;
  const adjust = dir => { if (life.paused || life.finished || assisted) return; controls++; velocity += dir * 6; angle += dir * 1.4; ctx.sound('move'); };
  button(ctx, '왼쪽 힘', () => adjust(-1));
  const brake = button(ctx, '잠깐 멈추기', () => { if (life.paused || life.finished || assisted) return; halted = !halted; controls++; brake.textContent = halted ? '다시 출발' : '잠깐 멈추기'; ctx.say(halted ? '평평하게 중심을 잡고 다시 출발해요.' : '서두르지 않고 앞으로 가요.'); });
  button(ctx, '오른쪽 힘', () => adjust(1));
  const key = e => { if (e.key === 'ArrowLeft') { e.preventDefault(); adjust(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); adjust(1); } else if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); brake.click(); } };
  window.addEventListener('keydown', key); life.addCleanup(() => window.removeEventListener('keydown', key));
  function renderAngle() { cart.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`; const percent = Math.max(2, Math.min(98, 50 + angle / 30 * 48)); gauge.querySelector('i').style.left = `${percent}%`; gauge.setAttribute('aria-valuenow', String(Math.round(angle))); }
  function enterAssist() {
    if (life.finished) return; assisted = true; assistCard.hidden = false; stage.classList.add('action-assisted'); ctx.setTime(null);
    ctx.say('수레를 멈춘 상태로 경사길을 살펴보고, 중심을 잡을 방향을 골라요.'); renderStep();
  }
  function renderStep() {
    assistCard.replaceChildren(); const slope = [-10, 12, -8][step % 3]; angle = slope; renderAngle();
    assistCard.append(node('p', '', `${step + 1} / 3 구간 · 수레가 ${slope < 0 ? '왼쪽' : '오른쪽'}으로 기울었어요. 반대쪽 힘으로 중심을 잡아요.`));
    const choices = node('div', 'action-lane-options');
    for (const [dir, label] of [[-1, '왼쪽으로 힘주기'], [1, '오른쪽으로 힘주기']]) {
      const b = node('button', 'action-button', label); b.type = 'button'; b.addEventListener('click', () => {
        if (life.paused || life.finished) return;
        if (Math.sign(slope) === dir) { ctx.say('기울어진 쪽의 반대 방향으로 힘을 주면 중심을 잡을 수 있어요.'); return; }
        controls++; angle = 0; renderAngle(); step++; ctx.sound('collect'); ctx.setProgress(step / 3, `${step}/3 구간`);
        if (step === 3) life.complete(100, '세 구간에서 힘의 방향을 골라 돌을 운반했어요. 일꾼들과 함께 화성 공사를 도왔어요.', true); else renderStep();
      }); choices.append(b);
    } assistCard.append(choices);
  }
  ctx.say('수레가 기우는 쪽의 반대로 힘을 주세요. 어려운 경사에서는 잠깐 멈춰도 좋아요.'); ctx.setTime(90);
  life.loop(dt => {
    if (assisted) return;
    elapsed += dt; recovery = Math.max(0, recovery - dt);
    const section = Math.min(2, Math.floor(distance / 33.34));
    const slope = [6, -7, 5][section];
    ground.style.transform = `rotate(${slope}deg)`;
    if (halted || recovery > 0) { angle *= Math.exp(-dt * 3); velocity *= Math.exp(-dt * 4); }
    else { velocity += (Math.sin(elapsed * .7) * 2 + slope * .17 - angle * .27) * dt; velocity *= Math.exp(-dt * 1.5); angle += velocity * dt; distance += dt * (100 / 90); }
    if (Math.abs(angle) > 23) { recovery = 1.2; angle = Math.sign(angle) * 17; velocity = 0; ctx.sound('soft'); ctx.say('일꾼이 수레를 잠깐 받쳤어요. 중심을 잡고 계속 운반해요.'); }
    if (Math.abs(angle) < 10 && !halted) goodTime += dt;
    renderAngle(); ctx.setProgress(Math.min(distance / 100, 1), `${section + 1}/3 경사길`); ctx.setTime(Math.max(0, Math.ceil(90 - distance * .9)));
    status.textContent = `${halted ? '잠깐 멈춰 중심 잡는 중' : recovery > 0 ? '동행이 잠깐 받치는 중' : '천천히 운반하는 중'} · 기울기 ${Math.abs(Math.round(angle))}도`;
    if (distance >= 100) { if (controls === 0) enterAssist(); else life.complete(100 + goodTime, '돌수레가 공사장에 도착했어요. 물리적인 균형과 나라의 정책은 다른 문제라는 것도 기억해요.'); }
  });
  if (ctx.isAssist()) enterAssist();
  return { pause: () => life.pause(), resume: () => { recovery = Math.max(recovery, 1); life.resume(); }, assist: enterAssist, destroy: () => life.destroy() };
}

export const actionGames = { 4: createRunner, 5: createBalance };
