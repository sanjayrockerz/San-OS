"use client";

/**
 * A highly realistic synthesized restaurant/KDS bell using Web Audio API.
 * 
 * Generates a piercing, multi-frequency chime that cuts through kitchen noise.
 * Can also fall back to playing an Audio object if a sound_url is provided.
 */
class KDSAudioEngine {
  private audioContext: AudioContext | null = null;
  private timerId: NodeJS.Timeout | null = null;
  private isPlaying = false;
  private htmlAudio: HTMLAudioElement | null = null;

  private getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Synthesize a bell sound using multiple oscillators to simulate metal harmonics.
   */
  private playSyntheticBell(volumePct: number) {
    const ctx = this.getContext();
    const gainNode = ctx.createGain();
    
    // Convert 0-100 to 0-1 (we'll allow it to go a bit higher for extra loudness)
    const baseVolume = (volumePct / 100) * 1.5; 
    gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime);
    // Fast attack, slow exponential decay typical of a bell
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
    gainNode.connect(ctx.destination);

    // Fundamental frequency (e.g., D6)
    const fundamental = 1174.66;
    
    // Harmonic partials for a metallic bell-like chime
    const ratios = [1, 1.18, 1.5, 2.05, 2.65, 3.4];
    const amplitudes = [1, 0.6, 0.4, 0.25, 0.15, 0.1];

    ratios.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(fundamental * ratio, ctx.currentTime);
      
      const partialGain = ctx.createGain();
      partialGain.gain.setValueAtTime(amplitudes[i] * baseVolume, ctx.currentTime);
      partialGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (3 / (i + 1)));
      
      osc.connect(partialGain);
      partialGain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 3);
    });
  }

  private playSound(soundUrl: string | null, volume: number) {
    if (soundUrl && soundUrl.trim().length > 0) {
      if (!this.htmlAudio || this.htmlAudio.src !== soundUrl) {
        this.htmlAudio = new Audio(soundUrl);
      }
      this.htmlAudio.volume = Math.min(1, Math.max(0, volume / 100));
      this.htmlAudio.currentTime = 0;
      this.htmlAudio.play().catch((e) => {
        console.warn("Failed to play custom audio, falling back to synthetic bell:", e);
        this.playSyntheticBell(volume);
      });
    } else {
      this.playSyntheticBell(volume);
    }
  }

  /**
   * Start the continuous alert loop.
   */
  startAlert(volume: number, intervalSec: number, soundUrl: string | null) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    const intervalMs = Math.max(2000, intervalSec * 1000); // minimum 2s
    
    // Play immediately
    this.playSound(soundUrl, volume);
    
    // Then loop
    this.timerId = setInterval(() => {
      if (this.isPlaying) {
        this.playSound(soundUrl, volume);
      }
    }, intervalMs);
  }

  /**
   * Stop the alert loop immediately.
   */
  stopAlert() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      this.htmlAudio.currentTime = 0;
    }
  }

  /**
   * Play a single test ding.
   */
  testAlert(volume: number, soundUrl: string | null) {
    this.playSound(soundUrl, volume);
  }
}

export const kdsAlertEngine = new KDSAudioEngine();
