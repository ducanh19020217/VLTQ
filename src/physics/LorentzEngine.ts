export type Vector3D = {
  x: number;
  y: number;
  z: number;
};

export type LorentzConfig = {
  q: number; // Charge
  m: number; // Mass
  bField: Vector3D; // Magnetic field
  eField: Vector3D; // Electric field
  initialVel: Vector3D;
  dt: number;
};

export type LorentzState = {
  pos: Vector3D;
  vel: Vector3D;
  force: Vector3D;
  time: number;
  isPaused: boolean;
};

export class LorentzEngine {
  public config: LorentzConfig;
  public state: LorentzState;
  private listeners: ((state: LorentzState) => void)[] = [];

  constructor() {
    this.config = {
      q: 1,
      m: 1,
      bField: { x: 0, y: 5, z: 0 },
      eField: { x: 0, y: 0, z: 0 },
      initialVel: { x: 10, y: 0, z: 0 },
      dt: 0.01
    };

    this.state = {
      pos: { x: 0, y: 0, z: 0 },
      vel: { ...this.config.initialVel },
      force: { x: 0, y: 0, z: 0 },
      time: 0,
      isPaused: false
    };
  }

  public addListener(listener: (state: LorentzState) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (state: LorentzState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }

  public setConfig(updates: Partial<LorentzConfig>) {
    this.config = { ...this.config, ...updates };
  }

  public reset() {
    this.state = {
      pos: { x: 0, y: 0, z: 0 },
      vel: { ...this.config.initialVel },
      force: { x: 0, y: 0, z: 0 },
      time: 0,
      isPaused: false
    };
    this.notify();
  }

  public togglePause() {
    this.state.isPaused = !this.state.isPaused;
    this.notify();
  }

  public update() {
    if (this.state.isPaused) return;

    const { q, m, bField, eField, dt } = this.config;
    const { vel, pos } = this.state;

    // F = q(E + v x B)
    // Cross product: v x B
    const crossX = vel.y * bField.z - vel.z * bField.y;
    const crossY = vel.z * bField.x - vel.x * bField.z;
    const crossZ = vel.x * bField.y - vel.y * bField.x;

    const fx = q * (eField.x + crossX);
    const fy = q * (eField.y + crossY);
    const fz = q * (eField.z + crossZ);

    this.state.force = { x: fx, y: fy, z: fz };

    // a = F / m
    const ax = fx / m;
    const ay = fy / m;
    const az = fz / m;

    // Euler integration (could use RK4 for better precision, but Euler is fine for many steps)
    this.state.vel.x += ax * dt;
    this.state.vel.y += ay * dt;
    this.state.vel.z += az * dt;

    this.state.pos.x += this.state.vel.x * dt;
    this.state.pos.y += this.state.vel.y * dt;
    this.state.pos.z += this.state.vel.z * dt;

    this.state.time += dt;

    this.notify();
  }
}
