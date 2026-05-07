export type Point = { x: number; y: number };

// Common optical media with their refractive indices
export const MEDIA: Record<string, number> = {
  'Không khí': 1.000,
  'Nước': 1.333,
  'Thủy tinh (Crown)': 1.523,
  'Thủy tinh (Flint)': 1.720,
  'Kim cương': 2.417,
  'Dầu ăn': 1.474,
  'Băng': 1.310,
};

export type RefractionState = {
  /** Angle of incidence in degrees, measured from normal */
  incidentAngleDeg: number;
  /** Angle of refraction in degrees (Snell's law) */
  refractedAngleDeg: number | null;
  /** true when total internal reflection occurs */
  isTotalInternalReflection: boolean;
  /** Critical angle for TIR in degrees (only when n1 > n2) */
  criticalAngleDeg: number | null;

  n1: number; // refractive index of upper medium
  n2: number; // refractive index of lower medium
  medium1Name: string;
  medium2Name: string;

  showNormal: boolean;
  showAngles: boolean;
  showWavefronts: boolean;
};

export class RefractionEngine {
  public state: RefractionState;
  private listeners: ((state: RefractionState) => void)[] = [];

  constructor() {
    this.state = {
      incidentAngleDeg: 30,
      refractedAngleDeg: null,
      isTotalInternalReflection: false,
      criticalAngleDeg: null,
      n1: MEDIA['Không khí'],
      n2: MEDIA['Thủy tinh (Crown)'],
      medium1Name: 'Không khí',
      medium2Name: 'Thủy tinh (Crown)',
      showNormal: true,
      showAngles: true,
      showWavefronts: false,
    };
    this.calculate();
  }

  public addListener(listener: (state: RefractionState) => void) {
    this.listeners.push(listener);
    listener(this.state);
  }

  public removeListener(listener: (state: RefractionState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }

  public setIncidentAngle(deg: number) {
    this.state.incidentAngleDeg = Math.max(0, Math.min(89, deg));
    this.calculate();
    this.notify();
  }

  public setMedium(which: 'medium1' | 'medium2', name: string) {
    const n = MEDIA[name];
    if (n === undefined) return;
    if (which === 'medium1') {
      this.state.n1 = n;
      this.state.medium1Name = name;
    } else {
      this.state.n2 = n;
      this.state.medium2Name = name;
    }
    this.calculate();
    this.notify();
  }

  public setVisibility(key: 'showNormal' | 'showAngles' | 'showWavefronts', val: boolean) {
    this.state[key] = val;
    this.notify();
  }

  private calculate() {
    const { incidentAngleDeg, n1, n2 } = this.state;
    const i = (incidentAngleDeg * Math.PI) / 180;

    // Critical angle
    if (n1 > n2) {
      this.state.criticalAngleDeg = (Math.asin(n2 / n1) * 180) / Math.PI;
    } else {
      this.state.criticalAngleDeg = null;
    }

    // Snell's law: n1 * sin(i) = n2 * sin(r)
    const sinR = (n1 * Math.sin(i)) / n2;

    if (sinR > 1) {
      // Total internal reflection
      this.state.isTotalInternalReflection = true;
      this.state.refractedAngleDeg = null;
    } else {
      this.state.isTotalInternalReflection = false;
      this.state.refractedAngleDeg = (Math.asin(sinR) * 180) / Math.PI;
    }
  }
}
