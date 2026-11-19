/** Original synthesized demo sounds. No reference-game recordings are used. */
export function createAudio() {
  let context = null, master = null, muted = false, dead = false;
  const voices = new Map();
  function ensure() {
    if (dead) return null;
    if (!context) {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio) return null;
      context = new Audio(); master = context.createGain();
      master.gain.value = muted ? 0 : .23;
      master.connect(context.destination);
    }
    return context;
  }
  function remember(node, group) {
    if (!voices.has(group)) voices.set(group, new Set());
    voices.get(group).add(node);
    node.onended = () => voices.get(group)?.delete(node);
  }
  function schedule(type, at, group = 'ui') {
    try {
      const c = ensure();
      if (!c || muted || c.state !== 'running') return;
      const t = Math.max(c.currentTime + .002, Number.isFinite(at) ? at : c.currentTime);
      const gain = c.createGain(); gain.connect(master);
      if (type === 'clap' || type === 'pour' || type === 'grain') {
        const duration = type === 'clap' ? .1 : .25;
        const b = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate);
        const samples = b.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples.length * .18));
        const noise = c.createBufferSource(); noise.buffer = b;
        const filter = c.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = type === 'clap' ? 1500 : 3000;
        noise.connect(filter); filter.connect(gain); gain.gain.setValueAtTime(type === 'clap' ? .65 : .18, t);
        noise.start(t); noise.stop(t + duration); remember(noise, group);
      } else {
        const osc = c.createOscillator(); osc.type = type === 'drum' ? 'sine' : 'triangle';
        const frequency = ({ drum: 150, metronome: 620, click: 420, success: 740, error: 230, note: 440, tick: 560 })[type] || 420;
        const duration = type === 'drum' ? .19 : type === 'success' ? .22 : .07;
        osc.frequency.setValueAtTime(frequency, t);
        if (type === 'drum') osc.frequency.exponentialRampToValueAtTime(48, t + duration);
        gain.gain.setValueAtTime(type === 'metronome' ? .12 : .42, t);
        gain.gain.exponentialRampToValueAtTime(.001, t + duration);
        osc.connect(gain); osc.start(t); osc.stop(t + duration + .015); remember(osc, group);
      }
    } catch { /* Audio must never prevent progress. */ }
  }
  function cancelGroup(group) {
    for (const node of voices.get(group) || []) { try { node.stop(); } catch {} }
    voices.delete(group);
  }
  return {
    async unlock() { try { const c = ensure(); if (c?.state === 'suspended') await c.resume(); } catch {} },
    play(type = 'click') { schedule(type, context?.currentTime || 0); },
    schedule,
    cancelGroup,
    time() { return context ? context.currentTime : performance.now() / 1000; },
    setMuted(value) {
      muted = Boolean(value);
      if (master && context) master.gain.setTargetAtTime(muted ? 0 : .23, context.currentTime, .025);
      if (muted) for (const group of [...voices.keys()]) cancelGroup(group);
    },
    async suspend() { for (const group of [...voices.keys()]) cancelGroup(group); try { await context?.suspend(); } catch {} },
    async resume() { try { if (context?.state === 'suspended') await context.resume(); } catch {} },
    destroy() { dead = true; for (const group of [...voices.keys()]) cancelGroup(group); try { context?.close(); } catch {} },
    get muted() { return muted; },
    get running() { return context?.state === 'running'; }
  };
}
