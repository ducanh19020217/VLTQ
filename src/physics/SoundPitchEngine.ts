export type SoundState = {
  frequency: number; // Hz
  amplitude: number; // 0 to 1
  phase: number;
  isPlaying: boolean;
};

export class SoundPitchEngine {
  public state: SoundState;
  private listeners: ((state: SoundState) => void)[] = [];
  
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    this.state = {
      frequency: 440, // A4
      amplitude: 0.5,
      phase: 0,
      isPlaying: false
    };
  }

  public addListener(listener: (state: SoundState) => void) {
    this.listeners.push(listener);
    listener(this.state);
  }

  public removeListener(listener: (state: SoundState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }

  public setFrequency(freq: number) {
    this.state.frequency = freq;
    if (this.oscillator) {
      this.oscillator.frequency.setTargetAtTime(freq, this.audioCtx!.currentTime, 0.05);
    }
    this.notify();
  }

  public setAmplitude(amp: number) {
    this.state.amplitude = amp;
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(amp, this.audioCtx!.currentTime, 0.05);
    }
    this.notify();
  }

  public togglePlay() {
    this.state.isPlaying = !this.state.isPlaying;
    if (this.state.isPlaying) {
      this.startAudio();
    } else {
      this.stopAudio();
    }
    this.notify();
  }

  private startAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
    }

    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();

    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(this.state.frequency, this.audioCtx.currentTime);
    this.gainNode.gain.setValueAtTime(this.state.amplitude, this.audioCtx.currentTime);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    this.oscillator.start();
  }

  private stopAudio() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
    }
  }

  public update(dt: number) {
    this.state.phase += 2 * Math.PI * this.state.frequency * dt;
    // We keep phase bounded to avoid precision issues
    this.state.phase %= 2 * Math.PI;
    this.notify();
  }
}
