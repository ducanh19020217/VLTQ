export interface PendulumConfig {
  length: number; // m
  mass: number; // kg
  gravity: number; // m/s^2
  damping: number; // Damping coefficient
  externalForce: number; // Horizontal force (N), e.g. Electric field
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface PendulumState {
  theta: number; // Angle in radians
  omega: number; // Angular velocity (rad/s)
  alpha: number; // Angular acceleration (rad/s^2)
  time: number;
  
  // Derived values for visualization
  energy: {
    potential: number;
    kinetic: number;
    total: number;
  };
  tension: number; // Force in the string (N)
  velocity: Vector2D; // m/s
  acceleration: {
    tangential: Vector2D;
    radial: Vector2D;
    total: Vector2D;
  };
}

export class PendulumEngine {
  public config: PendulumConfig;
  public state: PendulumState;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  public onUpdate?: (state: PendulumState, config: PendulumConfig) => void;

  constructor(config?: Partial<PendulumConfig>) {
    this.config = {
      length: 2,
      mass: 1,
      gravity: 9.81,
      damping: 0.05,
      externalForce: 0,
      ...config
    };
    
    this.state = this.initialState();
    this.calculateDerived();
  }

  private initialState(): PendulumState {
    return {
      theta: Math.PI / 4,
      omega: 0,
      alpha: 0,
      time: 0,
      energy: { potential: 0, kinetic: 0, total: 0 },
      tension: 0,
      velocity: { x: 0, y: 0 },
      acceleration: {
        tangential: { x: 0, y: 0 },
        radial: { x: 0, y: 0 },
        total: { x: 0, y: 0 }
      }
    };
  }

  public setConfig(newConfig: Partial<PendulumConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.calculateDerived();
  }

  public setAngle(angleRadians: number) {
    this.state.theta = angleRadians;
    this.state.omega = 0;
    this.state.alpha = 0;
    this.calculateDerived();
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
    this.state = this.initialState();
    this.calculateDerived();
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
    const { length, gravity, damping, externalForce, mass } = this.config;
    
    // Equations of motion with external horizontal force F:
    // Torque = -m*g*L*sin(theta) + F*L*cos(theta)
    // I * alpha = Torque -> m*L^2 * alpha = -m*g*L*sin(theta) + F*L*cos(theta)
    // alpha = (-g*sin(theta) + (F/m)*cos(theta)) / L
    
    this.state.alpha = (
      -gravity * Math.sin(this.state.theta) + 
      (externalForce / mass) * Math.cos(this.state.theta)
    ) / length - (damping * this.state.omega);
    
    this.state.omega += this.state.alpha * dt;
    this.state.theta += this.state.omega * dt;
    this.state.time += dt;

    this.calculateDerived();
  }

  private calculateDerived() {
    const { length, gravity, mass, externalForce } = this.config;
    const { theta, omega } = this.state;

    // 1. Energy
    const h = length * (1 - Math.cos(theta));
    const potential = mass * gravity * h;
    const linearVelocity = length * omega;
    const kinetic = 0.5 * mass * Math.pow(linearVelocity, 2);
    this.state.energy = {
      potential,
      kinetic,
      total: potential + kinetic
    };

    // 2. Tension: T = m*g*cos(theta) + m*v^2/L + F_ext*sin(theta)
    this.state.tension = mass * (gravity * Math.cos(theta) + Math.pow(linearVelocity, 2) / length) + externalForce * Math.sin(theta);

    // 3. Velocity Vector (tangent)
    this.state.velocity = {
      x: linearVelocity * Math.cos(theta),
      y: linearVelocity * -Math.sin(theta) // y is down in canvas coordinate usually, but let's keep physical signs
    };

    // 4. Acceleration Vectors
    // Tangential acceleration = alpha * L
    const aT = this.state.alpha * length;
    this.state.acceleration.tangential = {
      x: aT * Math.cos(theta),
      y: aT * -Math.sin(theta)
    };

    // Radial (centripetal) acceleration = omega^2 * L
    const aR = Math.pow(omega, 2) * length;
    this.state.acceleration.radial = {
      x: -aR * Math.sin(theta),
      y: -aR * Math.cos(theta)
    };

    this.state.acceleration.total = {
      x: this.state.acceleration.tangential.x + this.state.acceleration.radial.x,
      y: this.state.acceleration.tangential.y + this.state.acceleration.radial.y
    };
  }
}
