/**
 * Mechanical sounds, synthesised with the Web Audio API so the project
 * ships without audio files. Every strike is randomised slightly so no two
 * keystrokes sound identical.
 */

type Ctx = AudioContext;

export class TypewriterAudio {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  muted = false;

  /** Must be called from a user gesture before the first sound. */
  private ensure(): Ctx | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
      } catch {
        return null;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;
      this.master.connect(comp).connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 1);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** Unlock audio on the first interaction (iOS needs this). */
  unlock() {
    this.ensure();
  }

  private burst(
    t: number,
    opts: { dur: number; freq: number; q: number; gain: number; type?: BiquadFilterType },
  ) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? "bandpass";
    f.frequency.value = opts.freq;
    f.Q.value = opts.q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain, t + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t, Math.random() * 0.5);
    src.stop(t + opts.dur + 0.02);
  }

  private thump(t: number, freq: number, gain: number, dur = 0.07) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.45, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private ready(): Ctx | null {
    if (this.muted) return null;
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noise) return null;
    return ctx;
  }

  strike() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const v = 0.85 + Math.random() * 0.3;
    // Key lever travelling down.
    this.burst(t, { dur: 0.012, freq: 5200, q: 0.8, gain: 0.12 * v, type: "highpass" });
    // Slug hitting ribbon and platen.
    this.burst(t + 0.018, { dur: 0.045, freq: 2400 + Math.random() * 900, q: 1.4, gain: 0.75 * v });
    this.thump(t + 0.018, 170 + Math.random() * 40, 0.35 * v);
    // Escapement letting the carriage step.
    this.burst(t + 0.05, { dur: 0.02, freq: 3800, q: 3, gain: 0.12 * v });
  }

  space() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.burst(t, { dur: 0.05, freq: 900, q: 0.9, gain: 0.35, type: "lowpass" });
    this.thump(t, 95, 0.4, 0.09);
    this.burst(t + 0.03, { dur: 0.02, freq: 3600, q: 3, gain: 0.1 });
  }

  backspace() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.burst(t, { dur: 0.02, freq: 2800, q: 2, gain: 0.25 });
    this.burst(t + 0.035, { dur: 0.025, freq: 1900, q: 2, gain: 0.18 });
  }

  shift() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.thump(t, 120, 0.3, 0.08);
    this.burst(t, { dur: 0.04, freq: 1400, q: 1, gain: 0.18 });
  }

  bell() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + 0.03;
    const partials: [number, number][] = [
      [2093, 0.22],
      [4186, 0.06],
      [5650, 0.04],
      [3122, 0.03],
    ];
    for (const [f, a] of partials) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(a, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 1.7);
    }
  }

  carriageReturn() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Line-space lever ratchet.
    for (let i = 0; i < 3; i++) {
      this.burst(t + i * 0.022, { dur: 0.016, freq: 2100 + i * 200, q: 2.5, gain: 0.3 });
    }
    // Carriage sliding on its rail.
    this.burst(t + 0.06, { dur: 0.2, freq: 700, q: 0.7, gain: 0.16, type: "lowpass" });
    // Hitting the stop.
    this.thump(t + 0.27, 110, 0.5, 0.11);
    this.burst(t + 0.27, { dur: 0.06, freq: 1600, q: 1, gain: 0.4 });
  }

  feed() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 16; i++) {
      this.burst(t + i * 0.034, { dur: 0.014, freq: 2600, q: 3, gain: 0.08 + (i % 4 === 0 ? 0.05 : 0) });
    }
    this.burst(t, { dur: 0.6, freq: 500, q: 0.6, gain: 0.08, type: "lowpass" });
  }

  roll() {
    const ctx = this.ready();
    if (!ctx) return;
    this.burst(ctx.currentTime, { dur: 0.014, freq: 2600, q: 3, gain: 0.07 });
  }
}
