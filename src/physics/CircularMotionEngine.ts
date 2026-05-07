export interface CircularConfig {
  radius: number;      // m
  omega: number;       // rad/s (angular velocity)
  mass: number;        // kg
}

export interface CircularState {
  theta: number;       // rad (angular position)
  x: number;
  y: number;
  vx: number;          // tangential vx
  vy: number;          // tangential vy
  ax: number;          // centripetal ax
  ay: number;          // centripetal ay
  t: number;
  energy: {
    kinetic: number;
    total: number;
  };
  path: { x: number; y: number }[];
  history: {
    t: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    k: number;
  }[];
}

export class CircularMotionEngine {
  public config: CircularConfig;
  public state: CircularState;
  
  private isRunning: boolean = false; 
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  private listeners: ((state: CircularState, config: CircularConfig) => void)[] = [];

  public addListener(listener: (state: CircularState, config: CircularConfig) => void) {
    this.listeners.push(listener);
    // Notify immediately on add
    listener(this.state, this.config);
  }

  public removeListener(listener: (state: CircularState, config: CircularConfig) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.state, this.config));
  }

  constructor(config?: Partial<CircularConfig>) {
    this.config = {
      radius: 5,
      omega: 2, // 2 rad/s
      mass: 1,
      ...config
    };
    
    this.state = this.initialState();
    
    // Start automatically
    this.play();
  }

  private initialState(): CircularState {
    const theta = 0;
    const { radius, omega } = this.config;
    
    // Position
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    
    // Velocity (v = omega * r, perpendicular to radius)
    // r = (cos, sin) -> tangential = (-sin, cos)
    const v = omega * radius;
    const vx = -v * Math.sin(theta);
    const vy = v * Math.cos(theta);
    
    // Acceleration (ac = omega^2 * r, points to center: -cos, -sin)
    const ac = omega * omega * radius;
    const ax = -ac * Math.cos(theta);
    const ay = -ac * Math.sin(theta);

    return {
      theta,
      x, y,
      vx, vy,
      ax, ay,
      t: 0,
      energy: {
        kinetic: 0.5 * this.config.mass * v * v,
        total: 0.5 * this.config.mass * v * v
      },
      path: [{ x, y }],
      history: []
    };
  }

  public setConfig(newConfig: Partial<CircularConfig>) {
    this.config = { ...this.config, ...newConfig };
    // We don't necessarily reset theta to 0 when changing config,
    // but we update derived state immediately.
    this.updateStateFromTheta(this.state.theta);
    this.notifyListeners();
  }

  private updateStateFromTheta(theta: number) {
    const { radius, omega } = this.config;
    
    this.state.theta = theta;
    this.state.x = radius * Math.cos(theta);
    this.state.y = radius * Math.sin(theta);
    
    const v = omega * radius;
    this.state.vx = -v * Math.sin(theta);
    this.state.vy = v * Math.cos(theta);
    
    const ac = omega * omega * radius;
    this.state.ax = -ac * Math.cos(theta);
    this.state.ay = -ac * Math.sin(theta);
    
    const k = 0.5 * this.config.mass * v * v;
    this.state.energy = {
      kinetic: k,
      total: k
    };
  }

  public play() {
    if (this.animationFrameId !== null) return;
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
    this.state = this.initialState();
    this.notifyListeners();
  }

  public getIsRunning() {
    return this.isRunning;
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    if (dt > 0.05) dt = 0.05;
    this.lastTime = currentTime;

    this.step(dt);
    this.notifyListeners();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private step(dt: number) {
    const { omega } = this.config;
    
    // Update angle: theta = theta_0 + omega * dt
    let newTheta = this.state.theta + omega * dt;
    // Keep theta in [0, 2pi]
    newTheta = newTheta % (2 * Math.PI);
    
    this.updateStateFromTheta(newTheta);
    this.state.t += dt;

    // Record path
    const lastPoint = this.state.path[this.state.path.length - 1];
    const distSq = Math.pow(this.state.x - lastPoint.x, 2) + Math.pow(this.state.y - lastPoint.y, 2);
    if (distSq > 0.5) { 
        this.state.path.push({ x: this.state.x, y: this.state.y });
        if (this.state.path.length > 200) {
            this.state.path.shift();
        }
    }

    // Record history for graphs (every ~0.05s)
    if (this.state.history.length === 0 || this.state.t - this.state.history[this.state.history.length-1].t > 0.05) {
        this.state.history.push({
            t: this.state.t,
            x: this.state.x,
            y: this.state.y,
            vx: this.state.vx,
            vy: this.state.vy,
            k: this.state.energy.kinetic
        });
        if (this.state.history.length > 200) {
            this.state.history.shift();
        }
    }
  }
}
