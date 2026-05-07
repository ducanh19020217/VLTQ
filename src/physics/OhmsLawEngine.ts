export interface OhmsLawConfig {
  voltage: number; // V
  resistance: number; // Ohms
}

export interface OhmsLawState {
  voltage: number;
  resistance: number;
  current: number; // A
  power: number; // W
  time: number;
  electronPosition: number; // 0 to 1 for animation
}

export class OhmsLawEngine {
  public config: OhmsLawConfig;
  public state: OhmsLawState;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  public onUpdate?: (state: OhmsLawState, config: OhmsLawConfig) => void;

  constructor(config?: Partial<OhmsLawConfig>) {
    this.config = {
      voltage: 9,
      resistance: 10,
      ...config
    };
    
    this.state = this.calculateState();
  }

  private calculateState(): OhmsLawState {
    const { voltage, resistance } = this.config;
    const current = voltage / resistance;
    const power = voltage * current;
    
    return {
      voltage,
      resistance,
      current,
      power,
      time: this.state?.time || 0,
      electronPosition: this.state?.electronPosition || 0
    };
  }

  public setConfig(newConfig: Partial<OhmsLawConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.state = { ...this.state, ...this.calculateState() };
    if (this.onUpdate) {
      this.onUpdate(this.state, this.config);
    }
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

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    this.lastTime = currentTime;

    // Electron flow animation speed depends on current
    // Current is typically small, so we might need a multiplier
    const speedMultiplier = 0.5; 
    this.state.electronPosition = (this.state.electronPosition + this.state.current * speedMultiplier * dt) % 1;
    this.state.time += dt;

    if (this.onUpdate) {
      this.onUpdate(this.state, this.config);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
