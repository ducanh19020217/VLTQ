export interface LeverConfig {
  barLength: number; // m
  fulcrumX: number;  // 0.5 is middle
  massLeft: number;  // kg
  distLeft: number;  // m (distance from fulcrum)
  massRight: number; // kg
  distRight: number; // m (distance from fulcrum)
  gravity: number;   // m/s^2
  damping: number;
}

export interface LeverState {
  angle: number; // radians
  angularVelocity: number;
  angularAcceleration: number;
  time: number;
  torques: {
    left: number;
    right: number;
    net: number;
  };
  isBalanced: boolean;
}

export class LeverEngine {
  public config: LeverConfig;
  public state: LeverState;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  public onUpdate?: (state: LeverState, config: LeverConfig) => void;

  constructor(config?: Partial<LeverConfig>) {
    this.config = {
      barLength: 10,
      fulcrumX: 0.5,
      massLeft: 5,
      distLeft: 2,
      massRight: 5,
      distRight: 2,
      gravity: 9.81,
      damping: 0.5,
      ...config
    };
    
    this.state = this.initialState();
    this.calculateDerived();
  }

  private initialState(): LeverState {
    return {
      angle: 0,
      angularVelocity: 0,
      angularAcceleration: 0,
      time: 0,
      torques: { left: 0, right: 0, net: 0 },
      isBalanced: true
    };
  }

  public setConfig(newConfig: Partial<LeverConfig>) {
    this.config = { ...this.config, ...newConfig };
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
    const { damping } = this.config;
    
    this.calculateDerived();
    
    // Equations of motion:
    // Torque_net = I * alpha
    // Moment of inertia I = m_L * d_L^2 + m_R * d_R^2 + (1/12)*m_bar*L^2 (ignoring bar mass for now or assuming small)
    // alpha = Torque_net / I
    
    const I = this.config.massLeft * Math.pow(this.config.distLeft, 2) + 
              this.config.massRight * Math.pow(this.config.distRight, 2) + 1; // +1 to avoid division by zero and simulate bar inertia
              
    this.state.angularAcceleration = this.state.torques.net / I - damping * this.state.angularVelocity;
    
    this.state.angularVelocity += this.state.angularAcceleration * dt;
    this.state.angle += this.state.angularVelocity * dt;
    
    // Constraints: Limit angle to +/- 20 degrees
    const maxAngle = 20 * Math.PI / 180;
    if (this.state.angle > maxAngle) {
      this.state.angle = maxAngle;
      this.state.angularVelocity = 0;
    } else if (this.state.angle < -maxAngle) {
      this.state.angle = -maxAngle;
      this.state.angularVelocity = 0;
    }

    this.state.time += dt;
  }

  private calculateDerived() {
    const { massLeft, distLeft, massRight, distRight, gravity } = this.config;
    
    // Torque = r x F = r * F * sin(phi)
    // For a horizontal-ish lever, phi is approx 90 deg relative to the normal, 
    // but the force is vertical. So Torque = r * (mg * cos(theta))
    const cosTheta = Math.cos(this.state.angle);
    
    const torqueL = massLeft * gravity * distLeft * cosTheta;
    const torqueR = massRight * gravity * distRight * cosTheta;
    
    // Assume anti-clockwise is positive for angle, but let's define:
    // massRight creates clockwise torque (negative for angle increase)
    // massLeft creates anti-clockwise torque (positive for angle increase)
    // Wait, if angle is positive (tilted up on the right), gravity on right pulls it back down.
    // Let's say: 
    // TorqueLeft = -m_L * g * d_L * cos(theta) (wants to rotate CCW, increasing theta)
    // Actually, if theta > 0 (right side down), then torque_net should be negative to pull it back.
    
    this.state.torques = {
      left: torqueL,
      right: torqueR,
      net: torqueL - torqueR // If L > R, it rotates CCW (left goes down, wait...)
    };
    
    // If net torque is positive, left goes down.
    // Let's standardise: Positive angle = Right side DOWN.
    // Torque_R = m_R * g * d_R * cos(theta) (positive torque -> increases theta)
    // Torque_L = -m_L * g * d_L * cos(theta) (negative torque -> decreases theta)
    this.state.torques.net = (torqueR - torqueL);

    this.state.isBalanced = Math.abs(this.state.torques.net) < 0.01;
  }

  public autoBalance() {
    // F1 * d1 = F2 * d2 -> d2 = (m1 * d1) / m2
    const d2 = (this.config.massLeft * this.config.distLeft) / this.config.massRight;
    this.setConfig({ distRight: Math.min(d2, this.config.barLength * (1 - this.config.fulcrumX)) });
    this.state.angle = 0;
    this.state.angularVelocity = 0;
    this.state.angularAcceleration = 0;
    if (this.onUpdate) this.onUpdate(this.state, this.config);
  }
}
