export class AudioFX {
  private ctx: AudioContext | null = null;

  private get context(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(freq: number, endFreq: number, duration: number, type: OscillatorType, volume: number): void {
    const ctx = this.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  shoot(): void {
    this.tone(900, 300, 0.08, 'square', 0.04);
  }

  explosion(): void {
    this.tone(160, 40, 0.25, 'sawtooth', 0.07);
  }

  hit(): void {
    this.tone(220, 60, 0.35, 'sawtooth', 0.09);
  }

  wave(): void {
    this.tone(440, 660, 0.15, 'triangle', 0.05);
  }
}
