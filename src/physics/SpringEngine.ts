export interface SpringConfig {
  stiffness: number; // k (N/m)
  mass: number; // kg
  damping: number; // damping coefficient
}

export interface SpringState {
  x: number; // Displacement from equilibrium (m)
  v: number; // Velocity (m/s)
  a: number; // Acceleration (m/s^2)
  time: number;
}

export class SpringEngine {
  public config: SpringConfig;
  public state: SpringState;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  public onUpdate?: (state: SpringState, config: SpringConfig) => void;

  constructor(config?: Partial<SpringConfig>) {
    this.config = {
      stiffness: 20,
      mass: 1,
      damping: 0.1,
      ...config
    };
    
    this.state = {
      x: 1, // Initial displacement: 1 meter
      v: 0,
      a: 0,
      time: 0
    };
  }

  public setConfig(newConfig: Partial<SpringConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public setDisplacement(x: number) {
    this.state.x = x;
    this.state.v = 0;
    this.state.a = 0;
    if (!this.isRunning && this.onUpdate) {
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

  public reset() {
    this.pause();
    this.state = {
      x: 1,
      v: 0,
      a: 0,
      time: 0
    };
    if (this.onUpdate) {
      this.onUpdate(this.state, this.config);
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

    this.step(dt);

    if (this.onUpdate) {
      this.onUpdate(this.state, this.config);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private step(dt: number) {
    const { stiffness, mass, damping } = this.config;
    
    // F = -kx - cv
    // a = F/m
    this.state.a = (-stiffness * this.state.x - damping * this.state.v) / mass;
    
    // Semi-implicit Euler
    this.state.v += this.state.a * dt;
    this.state.x += this.state.v * dt;
    
    this.state.time += dt;
  }
}
