import type { Phase } from "@/store/sequence";

/**
 * The soundscape.
 *
 * Entirely synthesised - no files, nothing to load, nothing fetched. A drone
 * built from detuned oscillators through a moving lowpass, a filtered noise
 * wash for air, and short transients for the moments a person causes.
 *
 * It cannot start before a user gesture; browsers refuse. So it starts on the
 * first scroll, which is also the first moment anything in the piece moves
 * because a person moved it. That constraint and the concept happen to agree.
 */

type Nodes = {
  ctx: AudioContext;
  master: GainNode;
  droneGain: GainNode;
  airGain: GainNode;
  filter: BiquadFilterNode;
  oscs: OscillatorNode[];
  noise: AudioBufferSourceNode;
};

let n: Nodes | null = null;
let muted = false;
let started = false;

const STORAGE = "echo.muted";

try {
  muted = localStorage.getItem(STORAGE) === "1";
} catch {
  /* private mode */
}

export const isMuted = () => muted;
export const isStarted = () => started;

function noiseBuffer(ctx: AudioContext) {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  // Brown-ish noise: integrated white, which sits far lower and reads as air
  // rather than as hiss.
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.2;
  }
  return buf;
}

/** Must be called from inside a user gesture. */
export function startAudio() {
  if (started) return;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return;

  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 220;
  filter.Q.value = 0.7;
  filter.connect(master);

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0;
  droneGain.connect(filter);

  // A minor-ish stack, detuned so it beats slowly against itself.
  const oscs = [55, 82.4, 110, 164.8].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 === 0 ? "sine" : "triangle";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 7;
    o.connect(droneGain);
    o.start();
    return o;
  });

  const airGain = ctx.createGain();
  airGain.gain.value = 0;
  airGain.connect(filter);

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.loop = true;
  noise.connect(airGain);
  noise.start();

  n = { ctx, master, droneGain, airGain, filter, oscs, noise };
  started = true;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(STORAGE, m ? "1" : "0");
  } catch {
    /* private mode */
  }
  if (!n) return;
  n.master.gain.cancelScheduledValues(n.ctx.currentTime);
  n.master.gain.linearRampToValueAtTime(m ? 0 : 1, n.ctx.currentTime + 0.35);
}

/** Per-beat mix. Everything ramps; nothing is ever switched. */
export function setAudioPhase(phase: Phase, progress: number) {
  if (!n) return;
  const t = n.ctx.currentTime;
  const to = (p: AudioParam, v: number, s = 1.4) => {
    p.cancelScheduledValues(t);
    p.setTargetAtTime(v, t, s / 3);
  };

  switch (phase) {
    case "void":
    case "reveal":
      to(n.droneGain.gain, 0.05);
      to(n.airGain.gain, 0.02);
      to(n.filter.frequency, 180);
      break;
    case "passage":
      // Opens up as the road runs on, so the passage feels like descent.
      to(n.droneGain.gain, 0.09 + progress * 0.07);
      to(n.airGain.gain, 0.03 + progress * 0.06);
      to(n.filter.frequency, 220 + progress * 900);
      break;
    case "galaxy":
      to(n.droneGain.gain, 0.13);
      to(n.airGain.gain, 0.05);
      to(n.filter.frequency, 900);
      break;
    case "ignition":
      to(n.droneGain.gain, 0.2, 0.6);
      to(n.filter.frequency, 2600, 0.5);
      break;
    case "profile":
      to(n.droneGain.gain, 0.08);
      to(n.airGain.gain, 0.03);
      to(n.filter.frequency, 700);
      break;
    case "dive":
      to(n.droneGain.gain, 0.22, 0.8);
      to(n.airGain.gain, 0.14, 0.8);
      to(n.filter.frequency, 4200, 1.6);
      break;
    case "constellation":
      to(n.droneGain.gain, 0.07, 2.6);
      to(n.airGain.gain, 0.035, 2.6);
      to(n.filter.frequency, 620, 2.6);
      break;
  }
}

/** One-shot transients for moments a person caused. */
export function cue(kind: "spark" | "arrive" | "tick") {
  if (!n || muted) return;
  const { ctx, master } = n;
  const t = ctx.currentTime;

  if (kind === "tick") {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.25);
    return;
  }

  if (kind === "spark") {
    // Bright strike plus a body that drops an octave - ignition, then weight.
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(1760, t);
    o.frequency.exponentialRampToValueAtTime(110, t + 1.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 1.7);
    return;
  }

  // arrive: a slow swell that opens and holds, then lets the drone take over.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(220, t);
  o.frequency.linearRampToValueAtTime(330, t + 2.4);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.07, t + 1.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 4.2);
}
