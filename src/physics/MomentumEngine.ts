export type ObjectState = {
  id: number;
  x: number;
  v: number;
  m: number;
  radius: number;
  color: string;
};

export type MomentumConfig = {
  e: number; // Coefficient of restitution (1 = elastic, 0 = inelastic)
  width: number;
};

export type MomentumState = {
  objects: ObjectState[];
  time: number;
  isPaused: boolean;
  collisionOccurred: boolean;
};

export class MomentumEngine {
  public config: MomentumConfig;
  public state: MomentumState;
  private listeners: ((state: MomentumState) => void)[] = [];

  constructor() {
    this.config = {
      e: 1.0,
      width: 800
    };

    this.state = {
      objects: [
        { id: 1, x: 200, v: 50, m: 2, radius: 30, color: '#ef4444' },
        { id: 2, x: 600, v: -20, m: 4, radius: 40, color: '#3b82f6' }
      ],
      time: 0,
      isPaused: true,
      collisionOccurred: false
    };
  }

  public addListener(listener: (state: MomentumState) => void) {
    this.listeners.push(listener);
    listener(this.state); // Initial notify
  }

  public removeListener(listener: (state: MomentumState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }

  public setConfig(updates: Partial<MomentumConfig>) {
    this.config = { ...this.config, ...updates };
  }

  public updateObject(index: number, updates: Partial<ObjectState>) {
    this.state.objects[index] = { ...this.state.objects[index], ...updates };
    this.notify();
  }

  public play() {
    this.state.isPaused = false;
    this.notify();
  }

  public pause() {
    this.state.isPaused = true;
    this.notify();
  }

  public reset() {
    this.state.time = 0;
    this.state.isPaused = true;
    this.state.collisionOccurred = false;
    this.state.objects[0].x = 200;
    this.state.objects[1].x = 600;
    // Keep current m and v from UI but reset positions
    this.notify();
  }

  public step(dt: number) {
    if (this.state.isPaused) return;

    const [obj1, obj2] = this.state.objects;

    // Move
    obj1.x += obj1.v * dt;
    obj2.x += obj2.v * dt;

    // Collision detection
    const dist = Math.abs(obj1.x - obj2.x);
    const minDist = obj1.radius + obj2.radius;

    if (dist <= minDist && !this.state.collisionOccurred) {
      // Resolve collision
      const m1 = obj1.m;
      const m2 = obj2.m;
      const v1 = obj1.v;
      const v2 = obj2.v;
      const e = this.config.e;

      // Conservation of momentum + Coefficient of restitution
      // v1' = ((m1 - e*m2)*v1 + (1+e)*m2*v2) / (m1+m2)
      // v2' = ((1+e)*m1*v1 + (m2 - e*m1)*v2) / (m1+m2)
      
      const newV1 = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
      const newV2 = ((1 + e) * m1 * v1 + (m2 - e * m1) * v2) / (m1 + m2);

      obj1.v = newV1;
      obj2.v = newV2;

      // Prevent overlapping
      const overlap = minDist - dist;
      const direction = obj1.x < obj2.x ? -1 : 1;
      obj1.x += direction * (overlap / 2);
      obj2.x -= direction * (overlap / 2);

      this.state.collisionOccurred = true;
    }

    // Boundary check
    if (obj1.x - obj1.radius < 0) {
        obj1.x = obj1.radius;
        obj1.v *= -1;
    }
    if (obj1.x + obj1.radius > this.config.width) {
        obj1.x = this.config.width - obj1.radius;
        obj1.v *= -1;
    }
    if (obj2.x - obj2.radius < 0) {
        obj2.x = obj2.radius;
        obj2.v *= -1;
    }
    if (obj2.x + obj2.radius > this.config.width) {
        obj2.x = this.config.width - obj2.radius;
        obj2.v *= -1;
    }

    this.state.time += dt;
    if (this.listeners.length > 0) this.notify();
  }
}
