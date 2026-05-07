export type Material = {
  name: string;
  alpha: number; // Linear expansion coefficient (10^-6 / K)
  color: string;
};

export const MATERIALS: Record<string, Material> = {
  steel: { name: 'Thép', alpha: 12, color: '#94a3b8' },
  copper: { name: 'Đồng', alpha: 17, color: '#b45309' },
  aluminum: { name: 'Nhôm', alpha: 23, color: '#cbd5e1' },
  glass: { name: 'Thủy tinh', alpha: 9, color: '#bae6fd' }
};

export type ThermalState = {
  temp: number; // Current temperature in Celsius
  initialLength: number; // in meters
  currentLength: number;
  initialTemp: number;
  materialKey: string;
  heaterPower: number; // 0 to 1
  isPaused: boolean;
};

export class ThermalExpansionEngine {
  public state: ThermalState;
  private listeners: ((state: ThermalState) => void)[] = [];

  constructor() {
    this.state = {
      temp: 25,
      initialLength: 0.5, // 50cm
      currentLength: 0.5,
      initialTemp: 25,
      materialKey: 'copper',
      heaterPower: 0,
      isPaused: false
    };
  }

  public addListener(listener: (state: ThermalState) => void) {
    this.listeners.push(listener);
    listener(this.state);
  }

  public removeListener(listener: (state: ThermalState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }

  public setMaterial(key: string) {
    if (MATERIALS[key]) {
      this.state.materialKey = key;
      this.calculateExpansion();
      this.notify();
    }
  }

  public setHeaterPower(power: number) {
    this.state.heaterPower = power;
    this.notify();
  }

  public reset() {
    this.state.temp = this.state.initialTemp;
    this.state.heaterPower = 0;
    this.calculateExpansion();
    this.notify();
  }

  private calculateExpansion() {
    const material = MATERIALS[this.state.materialKey];
    const deltaT = this.state.temp - this.state.initialTemp;
    // deltaL = alpha * L0 * deltaT
    // alpha is in 10^-6
    const expansion = (material.alpha * 1e-6) * this.state.initialLength * deltaT;
    this.state.currentLength = this.state.initialLength + expansion;
  }

  public step(dt: number) {
    if (this.state.isPaused) return;

    // Simulate heating/cooling
    // If heater is on, temp increases. If off, temp slowly goes back to initialTemp (ambient)
    const heatingRate = 20; // degrees per second at full power
    const coolingRate = 2; // degrees per second back to ambient

    if (this.state.heaterPower > 0) {
      this.state.temp += heatingRate * this.state.heaterPower * dt;
    } else {
      if (this.state.temp > this.state.initialTemp) {
        this.state.temp -= coolingRate * dt;
        if (this.state.temp < this.state.initialTemp) this.state.temp = this.state.initialTemp;
      }
    }

    this.calculateExpansion();
    this.notify();
  }
}
