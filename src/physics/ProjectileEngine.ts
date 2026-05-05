export interface ProjectileConfig {
  initialHeight: number; // m
  v0: number;            // m/s
  angle: number;         // degrees
  gravity: number;       // m/s^2
  drag: number;          // damping coefficient
  mass: number;          // kg
}

export interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  path: { x: number; y: number }[];
  isLanded: boolean;
}

export class ProjectileEngine {
  public config: ProjectileConfig;
  public state: ProjectileState;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  public onUpdate?: (state: ProjectileState, config: ProjectileConfig) => void;

  constructor(config?: Partial<ProjectileConfig>) {
    this.config = {
      initialHeight: 0,
      v0: 30,
      angle: 45,
      gravity: 9.81,
      drag: 0.1,
      mass: 1,
      ...config
    };
    
    this.state = this.initialState();
  }

  private initialState(): ProjectileState {
    const angleRad = (this.config.angle * Math.PI) / 180;
    return {
      x: 0,
      y: this.config.initialHeight,
      vx: this.config.v0 * Math.cos(angleRad),
      vy: this.config.v0 * Math.sin(angleRad),
      t: 0,
      path: [{ x: 0, y: this.config.initialHeight }],
      isLanded: false
    };
  }

  public setConfig(newConfig: Partial<ProjectileConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.reset();
  }

  public play() {
    if (this.isRunning || this.state.isLanded) return;
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
    this.state = this.initialState();
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
    if (dt > 0.05) dt = 0.05;
    this.lastTime = currentTime;

    // Run multiple sub-steps for better accuracy
    const subSteps = 5;
    const sdt = dt / subSteps;
    for (let i = 0; i < subSteps; i++) {
        this.step(sdt);
        if (this.state.isLanded) break;
    }

    if (this.onUpdate) {
      this.onUpdate(this.state, this.config);
    }

    if (!this.state.isLanded) {
        this.animationFrameId = requestAnimationFrame(this.loop);
    } else {
        this.isRunning = false;
    }
  };

  private step(dt: number) {
    if (this.state.isLanded) return;

    const { gravity, drag, mass } = this.config;
    
    // Forces: Fg = -m*g (vertical), Fd = -drag * v (opposite to velocity)
    const ax = -(drag / mass) * this.state.vx;
    const ay = -gravity - (drag / mass) * this.state.vy;

    // Euler integration
    this.state.vx += ax * dt;
    this.state.vy += ay * dt;
    this.state.x += this.state.vx * dt;
    this.state.y += this.state.vy * dt;
    this.state.t += dt;

    // Check if landed
    if (this.state.y <= 0) {
      this.state.y = 0;
      this.state.isLanded = true;
    }

    // Record path point
    const lastPoint = this.state.path[this.state.path.length - 1];
    const distSq = Math.pow(this.state.x - lastPoint.x, 2) + Math.pow(this.state.y - lastPoint.y, 2);
    if (distSq > 1) { // Only add if moved enough
        this.state.path.push({ x: this.state.x, y: this.state.y });
    }
  }
}
