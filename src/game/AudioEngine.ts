/**
 * Pure Web Audio API Procedural Synthesizer for Mechanical Stepper Slot
 * Emulates vintage stepper clicks, heavy solenoid clunks, flapper ratchets, and jackpot fanfare.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public async init(): Promise<void> {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
  }

  public async resume(): Promise<void> {
    return this.init();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Stepper ratchet click: rapid mechanical tooth gear click
   */
  public playStepperClick(pitch = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // High click burst using bandpassed noise + square blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(120 * pitch, now + 0.025);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Solenoid Clunk: Heavy mechanical solenoid relay braking the stepper reel
   */
  public playSolenoidClunk(reelIndex = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Low frequency mechanical thud
      const baseFreq = 95 - reelIndex * 8;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq * 1.5, now);
      osc1.frequency.exponentialRampToValueAtTime(32, now + 0.12);

      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Metallic click impact
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(450 + reelIndex * 50, now);
      osc2.frequency.exponentialRampToValueAtTime(60, now + 0.04);

      gain2.gain.setValueAtTime(0.35, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.04);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Booster Reel Special Impact (for multipliers, respin, wheel)
   */
  public playBoosterImpact(type: 'multiplier' | 'respin' | 'wheel') {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      if (type === 'respin') {
        // Neon zap riser
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'wheel') {
        // Grand gong chime
        [392, 523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.25, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.4);
        });
      } else {
        // Multiplier punch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Flapper Ratchet: Crisp peg click when the wheel rotates
   */
  public playFlapperClick(speedPitch = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800 * speedPitch, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.015);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.015);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Win Ticker Counting Chime: crisp coin drop / bell
   */
  public playWinChime(step = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
      const freq = scale[step % scale.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Jackpot / Big Win Fanfare
   */
  public playJackpotFanfare() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 1046.5, d: 0.35 },
      ];
      let t = ctx.currentTime;

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + note.d);
        t += note.d * 0.85;
      });
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Button Press / Denom click
   */
  public playButtonPress() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Heavy mechanical slot spin lever pull with dual solenoid impact
   */
  public playSpinLeverPull() {
    this.playButtonPress();
    this.playSolenoidClunk(0);
  }

  /**
   * Escalating Mechanical Siren / Warning Buzzer for Red-Spin Savior
   * Urgent comic klaxon with rising mechanical sweeps and staccato warning harmonics
   */
  public playRedSpinAlarm() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 3 ascending mechanical siren pulses
      const pulses = [
        { startF: 440, endF: 660, startT: 0, dur: 0.12 },
        { startF: 580, endF: 880, startT: 0.13, dur: 0.13 },
        { startF: 750, endF: 1200, startT: 0.27, dur: 0.22 },
      ];

      pulses.forEach((p) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(p.startF, now + p.startT);
        osc.frequency.exponentialRampToValueAtTime(p.endF, now + p.startT + p.dur);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now + p.startT);

        gain.gain.setValueAtTime(0.32, now + p.startT);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.startT + p.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + p.startT);
        osc.stop(now + p.startT + p.dur);
      });

      // Warning buzzer undertone
      const buzz = ctx.createOscillator();
      const buzzGain = ctx.createGain();
      buzz.type = 'square';
      buzz.frequency.setValueAtTime(140, now);
      buzz.frequency.setValueAtTime(175, now + 0.2);
      buzzGain.gain.setValueAtTime(0.22, now);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

      buzz.connect(buzzGain);
      buzzGain.connect(ctx.destination);
      buzz.start(now);
      buzz.stop(now + 0.52);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Crisp mechanical lock impact when Reel 2 snaps into place on salvaged digit
   */
  public playRedSpinSnap() {
    if (this.isMuted) return;
    this.playSolenoidClunk(1);
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.16);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // AudioContext error handling
    }
  }
}

export const soundEngine = new SoundEngine();
export const AudioEngine = soundEngine;
