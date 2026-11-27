/**
 * Lightweight zero-asset Web Audio synthesizer for Roleplay 3D maps (Airport & Supermarket).
 * Zero network fetches, zero memory overhead, gracefully unlocks on first user gesture.
 */
export class RoleplaySfx {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(m: boolean) {
    this.muted = m;
  }

  private ensure(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, dur: number, vol = 0.06, type: OscillatorType = 'sine', delay = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  playStep() {
    this.tone(180 + Math.random() * 40, 0.045, 0.022, 'triangle');
  }

  playJump() {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.12);
    gain.gain.setValueAtTime(0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playTeleport() {
    this.tone(440, 0.09, 0.045, 'sine', 0);
    this.tone(660, 0.12, 0.045, 'sine', 0.06);
  }

  playQuestComplete() {
    this.tone(523.25, 0.14, 0.06, 'triangle', 0);
    this.tone(659.25, 0.14, 0.06, 'triangle', 0.08);
    this.tone(783.99, 0.22, 0.065, 'triangle', 0.16);
    this.tone(1046.5, 0.3, 0.06, 'sine', 0.25);
  }

  dispose() {
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
