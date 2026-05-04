export interface WaveConfig {
  frequency: number; // Hz
  wavelength: number; // px or arbitrary units
  amplitude: number;
  sourceDistance: number; // Distance between S1 and S2
  phaseDiff: number; // Radians
}

export interface WaveState {
  time: number;
}

export class WaveInterferenceEngine {
  public config: WaveConfig;
  public state: WaveState;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  public onUpdate?: (state: WaveState, config: WaveConfig) => void;

  constructor() {
    this.config = {
      frequency: 1.0, // Slower
      wavelength: 60, // Wider patterns
      amplitude: 1,
      sourceDistance: 120,
      phaseDiff: 0
    };
    
    this.state = {
      time: 0
    };
  }

  public setConfig(newConfig: Partial<WaveConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public play() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public getIsRunning() {
    return this.isRunning;
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    this.lastTime = currentTime;

    this.state.time += dt;

    if (this.onUpdate) {
      this.onUpdate(this.state, this.config);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
