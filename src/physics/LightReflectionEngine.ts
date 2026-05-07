export type Point = { x: number; y: number };

export type Ray = {
  origin: Point;
  angle: number; // in radians
};

export type Mirror = {
  center: Point;
  length: number;
  angle: number; // in radians
  isRough: boolean;
};

export type ReflectionState = {
  laser: Ray;
  mirror: Mirror;
  incidentRay: Point[];
  reflectedRay: Point[][];
  normalPoint: Point;
  incidentAngle: number; // in degrees
  reflectedAngle: number; // in degrees
  showNormal: boolean;
  showAngles: boolean;
  showProtractor: boolean;
};

export class LightReflectionEngine {
  public state: ReflectionState;
  private listeners: ((state: ReflectionState) => void)[] = [];

  constructor() {
    this.state = {
      laser: { origin: { x: 150, y: 150 }, angle: Math.PI / 4 },
      mirror: { center: { x: 400, y: 400 }, length: 300, angle: 0, isRough: false },
      incidentRay: [],
      reflectedRay: [],
      normalPoint: { x: 0, y: 0 },
      incidentAngle: 0,
      reflectedAngle: 0,
      showNormal: true,
      showAngles: true,
      showProtractor: false
    };
    this.calculate();
  }

  public addListener(listener: (state: ReflectionState) => void) {
    this.listeners.push(listener);
    listener(this.state);
  }

  public removeListener(listener: (state: ReflectionState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }

  public updateLaser(origin: Point, angle: number) {
    this.state.laser = { origin, angle };
    this.calculate();
    this.notify();
  }

  public updateMirror(angle: number, isRough: boolean) {
    this.state.mirror.angle = angle;
    this.state.mirror.isRough = isRough;
    this.calculate();
    this.notify();
  }

  public setVisibility(key: 'showNormal' | 'showAngles' | 'showProtractor', val: boolean) {
    this.state[key] = val;
    this.notify();
  }

  private calculate() {
    const { laser, mirror } = this.state;
    
    // Ray-Mirror intersection
    // Mirror start/end
    const mCos = Math.cos(mirror.angle);
    const mSin = Math.sin(mirror.angle);
    const halfL = mirror.length / 2;
    const p1 = { x: mirror.center.x - mCos * halfL, y: mirror.center.y - mSin * halfL };
    const p2 = { x: mirror.center.x + mCos * halfL, y: mirror.center.y + mSin * halfL };

    // Ray: P = O + t*D
    const dx = Math.cos(laser.angle);
    const dy = Math.sin(laser.angle);

    // Intersection with line segment p1-p2
    const denominator = (p2.y - p1.y) * dx - (p2.x - p1.x) * dy;
    
    if (Math.abs(denominator) < 1e-6) {
        // Parallel
        this.state.incidentRay = [laser.origin, { x: laser.origin.x + dx * 2000, y: laser.origin.y + dy * 2000 }];
        this.state.reflectedRay = [];
        return;
    }

    const t = ((p2.x - p1.x) * (laser.origin.y - p1.y) - (p2.y - p1.y) * (laser.origin.x - p1.x)) / denominator;
    const u = ((laser.origin.x - p1.x) * dy - (laser.origin.y - p1.y) * dx) / -denominator;

    if (t > 0 && u >= 0 && u <= 1) {
        // Hits mirror
        const hit = { x: laser.origin.x + dx * t, y: laser.origin.y + dy * t };
        this.state.incidentRay = [laser.origin, hit];

        // Normal vector to mirror
        // Mirror angle is alpha, normal is alpha - PI/2
        const normalAngle = mirror.angle - Math.PI / 2;
        const nx = Math.cos(normalAngle);
        const ny = Math.sin(normalAngle);

        this.state.normalPoint = hit;

        if (mirror.isRough) {
            // Diffuse: many rays
            const rays = [];
            for (let i = -30; i <= 30; i += 10) {
                const noise = (i * Math.PI) / 180;
                const rAngle = 2 * mirror.angle - laser.angle + noise;
                rays.push([hit, { x: hit.x + Math.cos(rAngle) * 1000, y: hit.y + Math.sin(rAngle) * 1000 }]);
            }
            this.state.reflectedRay = rays;
            this.state.incidentAngle = 0;
            this.state.reflectedAngle = 0;
        } else {
            // Specular
            // Reflection angle: theta_r = 2 * theta_mirror - theta_i
            const rAngle = 2 * mirror.angle - laser.angle;
            this.state.reflectedRay = [[hit, { x: hit.x + Math.cos(rAngle) * 1000, y: hit.y + Math.sin(rAngle) * 1000 }]];
            
            // Calculate i and i' relative to normal
            // Angle between ray and normal
            const laserVecAngle = laser.angle;
            const normalVecAngle = normalAngle;
            
            let diff = Math.abs(laserVecAngle - normalVecAngle) % (2 * Math.PI);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;
            this.state.incidentAngle = Math.abs(90 - (diff * 180 / Math.PI)); // Simplified for 2D visual
            
            // Actually, a better way for education:
            // Angle of incidence is the angle between incident ray and normal
            const vIncident = { x: -dx, y: -dy }; // Vector FROM hit TO laser
            const vNormal = { x: nx, y: ny };
            const dot = vIncident.x * vNormal.x + vIncident.y * vNormal.y;
            const cosI = dot / (Math.sqrt(vIncident.x**2 + vIncident.y**2) * Math.sqrt(vNormal.x**2 + vNormal.y**2));
            const angleI = Math.acos(Math.min(Math.max(cosI, -1), 1)) * 180 / Math.PI;
            
            this.state.incidentAngle = Math.abs(angleI);
            this.state.reflectedAngle = Math.abs(angleI);
        }
    } else {
        // Misses mirror
        this.state.incidentRay = [laser.origin, { x: laser.origin.x + dx * 2000, y: laser.origin.y + dy * 2000 }];
        this.state.reflectedRay = [];
    }
  }
}
