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
  noiseBuf: AudioBuffer;
};

/** Fundamentals of the drone stack, so pitch can be bent as a ratio. */
const BASE = [55, 82.4, 110, 164.8];

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
  const oscs = BASE.map((f, i) => {
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

  const buf = noiseBuffer(ctx);
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  noise.connect(airGain);
  noise.start();

  n = { ctx, master, droneGain, airGain, filter, oscs, noise, noiseBuf: buf };
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
  const nodes = n;
  const t = nodes.ctx.currentTime;

  const to = (p: AudioParam, v: number, s = 1.4) => {
    p.cancelScheduledValues(t);
    p.setTargetAtTime(v, t, s / 3);
  };

  /**
   * Bend the whole stack by a ratio rather than retuning each voice.
   * Everything sags together, which reads as the recording slowing down rather
   * than as the music changing key.
   */
  const pitch = (ratio: number, s = 3.5) => {
    nodes.oscs.forEach((o, i) => to(o.frequency, BASE[i] * ratio, s));
  };

  switch (phase) {
    case "void":
    case "reveal":
      pitch(1);
      to(nodes.droneGain.gain, 0.05);
      to(nodes.airGain.gain, 0.02);
      to(nodes.filter.frequency, 180);
      break;

    case "passage":
      // Opens up as the road runs on, so the passage feels like descent.
      pitch(1);
      to(nodes.droneGain.gain, 0.09 + progress * 0.07);
      to(nodes.airGain.gain, 0.03 + progress * 0.06);
      to(nodes.filter.frequency, 220 + progress * 900);
      break;

    case "galaxy":
      // Everything sags once the road runs out. The piece has arrived
      // somewhere and stops pushing forward.
      pitch(0.72, 5);
      to(nodes.droneGain.gain, 0.11, 3);
      to(nodes.airGain.gain, 0.04, 3);
      to(nodes.filter.frequency, 560, 3);
      break;

    case "ignition":
      pitch(0.68, 1.2);
      to(nodes.droneGain.gain, 0.16, 0.8);
      to(nodes.filter.frequency, 1400, 0.8);
      break;

    case "profile":
      pitch(0.7, 3);
      to(nodes.droneGain.gain, 0.07);
      to(nodes.airGain.gain, 0.028);
      to(nodes.filter.frequency, 520);
      break;

    case "dive":
      // Air stays almost shut. Opening the noise bed wide is what made this
      // sound like wind through a gap rather than like travelling.
      pitch(0.9, 1.2);
      to(nodes.droneGain.gain, 0.17, 0.8);
      to(nodes.airGain.gain, 0.018, 0.8);
      to(nodes.filter.frequency, 1900, 1.4);
      break;

    case "constellation":
      // The sky is still. Almost nothing left but a low bed and some air.
      pitch(0.62, 5);
      to(nodes.droneGain.gain, 0.042, 4);
      to(nodes.airGain.gain, 0.022, 4);
      to(nodes.filter.frequency, 300, 4);
      break;
  }
}

/** One-shot transients for moments a person caused. */
export function cue(kind: "spark" | "arrive" | "tick" | "click" | "dive") {
  if (!n || muted) return;
  const { ctx, master, noiseBuf } = n;
  const t = ctx.currentTime;

  /** Short burst of the noise bed through a band-pass. */
  const burst = (
    freq: number,
    q: number,
    peak: number,
    dur: number,
    sweepTo?: number,
  ) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(freq, t);
    if (sweepTo) bp.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  };

  if (kind === "click") {
    // A soft wooden tap, well under the drone. Nothing bright, nothing digital.
    burst(430, 7, 0.05, 0.09);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(196, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.028, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.16);
    return;
  }

  if (kind === "tick") {
    burst(700, 5, 0.045, 0.13);
    return;
  }

  if (kind === "dive") {
    // Travelling, built from pitch rather than from noise: a stack of fifths
    // sweeping upward through a resonant band, over a sub that swells and
    // holds. Doppler, not wind.
    [55, 82.5, 110, 165].forEach((f, i) => {
      const o = ctx.createOscillator();
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();

      o.type = i < 2 ? "sawtooth" : "triangle";
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 5.5, t + 3.1);
      o.detune.value = (i - 1.5) * 9;

      bp.type = "bandpass";
      bp.Q.value = 5.5;
      bp.frequency.setValueAtTime(f * 2.2, t);
      bp.frequency.exponentialRampToValueAtTime(f * 11, t + 3.1);

      const peak = 0.05 - i * 0.008;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 1.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);

      o.connect(bp).connect(g).connect(master);
      o.start(t);
      o.stop(t + 4.3);
    });

    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(34, t);
    sub.frequency.linearRampToValueAtTime(46, t + 2.6);
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.14, t + 0.5);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);
    sub.connect(sg).connect(master);
    sub.start(t);
    sub.stop(t + 4.1);
    return;
  }

  if (kind === "spark") {
    // Something being pulled apart, not a laser. A sub that drops and holds,
    // with a band of noise tearing upward across it. The previous version
    // swept a triangle down from 1760Hz, which is the exact recipe for a toy
    // "pew" and sat completely outside the register of everything else.
    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(72, t);
    sub.frequency.exponentialRampToValueAtTime(38, t + 1.4);
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.19, t + 0.06);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
    sub.connect(sg).connect(master);
    sub.start(t);
    sub.stop(t + 2.1);

    // The tear.
    burst(220, 1.4, 0.1, 1.5, 2400);
    return;
  }

  // arrive: a slow swell that opens and holds, then lets the drone take over.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(146, t);
  o.frequency.linearRampToValueAtTime(196, t + 2.6);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.06, t + 1.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 4.4);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 4.6);
}
