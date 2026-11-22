// audio.js — tiny WebAudio bleeps for LANTERN DUEL.
// One job: small synthesized sounds, no audio files, no network.
// Everything is guarded: no AudioContext until the first user gesture.

export function createAudio() {
  return { ctx: null, unlocked: false };
}

function ensure(audio) {
  if (audio.unlocked) return audio.ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audio.ctx = new Ctx();
    audio.unlocked = true;
  } catch (err) {
    audio.ctx = null;
  }
  return audio.ctx;
}

export function unlockAudio(audio) {
  const ctx = ensure(audio);
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function blip(audio, freq, dur, type, vol, when) {
  const ctx = ensure(audio);
  if (!ctx) return;
  const t0 = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol || 0.08, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function makeSounds(audio) {
  return {
    unlock() {
      unlockAudio(audio);
    },
    playCard() {
      blip(audio, 660, 0.09, 'triangle', 0.09);
      blip(audio, 990, 0.12, 'triangle', 0.06, 0.05);
    },
    deny() {
      blip(audio, 160, 0.12, 'square', 0.05);
    },
    hurt() {
      blip(audio, 140, 0.18, 'sawtooth', 0.07);
    },
    guard() {
      blip(audio, 420, 0.1, 'sine', 0.07);
    },
    charge() {
      blip(audio, 220, 0.25, 'sawtooth', 0.06);
      blip(audio, 330, 0.25, 'sawtooth', 0.05, 0.08);
    },
    resonance() {
      blip(audio, 880, 0.1, 'sine', 0.07);
      blip(audio, 1174, 0.14, 'sine', 0.07, 0.07);
    },
    reward() {
      blip(audio, 523, 0.1, 'triangle', 0.08);
      blip(audio, 659, 0.1, 'triangle', 0.08, 0.08);
      blip(audio, 784, 0.16, 'triangle', 0.08, 0.16);
    },
    winRound() {
      blip(audio, 523, 0.12, 'triangle', 0.08);
      blip(audio, 784, 0.2, 'triangle', 0.08, 0.1);
    },
    start() {
      blip(audio, 392, 0.1, 'triangle', 0.08);
      blip(audio, 523, 0.14, 'triangle', 0.08, 0.08);
    },
    lose() {
      blip(audio, 330, 0.2, 'sine', 0.07);
      blip(audio, 220, 0.3, 'sine', 0.07, 0.15);
    },
  };
}
