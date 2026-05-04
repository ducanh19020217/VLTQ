export interface PhotoelectricConfig {
  wavelength: number; // nm (300nm - 700nm)
  intensity: number; // 0 - 100%
  metalWorkFunction: number; // eV
  metalName: string;
}

export interface Electron {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // To fade out
}

export interface PhotoelectricState {
  electrons: Electron[];
  isEmitting: boolean;
  photonEnergy: number; // eV
}

export class PhotoelectricEngine {
  public config: PhotoelectricConfig;
  public state: PhotoelectricState;
  
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private nextElectronId: number = 0;
  private emissionTimer: number = 0;

  public onUpdate?: (state: PhotoelectricState, config: PhotoelectricConfig) => void;

  constructor() {
    this.config = {
      wavelength: 400, // Violet/UV
      intensity: 50,
      metalWorkFunction: 2.3, // Sodium (eV)
      metalName: 'Natri'
    };
    
    this.state = {
      electrons: [],
      isEmitting: false,
      photonEnergy: 0
    };
    
    this.calculatePhysics();
  }

  public setConfig(newConfig: Partial<PhotoelectricConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.calculatePhysics();
  }

  private calculatePhysics() {
    // E = h*c / lambda
    // h*c approx 1240 eV*nm
    this.state.photonEnergy = 1240 / this.config.wavelength;
    this.state.isEmitting = this.state.photonEnergy > this.config.metalWorkFunction;
  }

  public start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number) => {
    let dt = (currentTime - this.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    this.lastTime = currentTime;

    this.update(dt);

    if (this.onUpdate) {
      this.onUpdate(this.state, this.config);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // 1. Handle emission
    if (this.state.isEmitting && this.config.intensity > 0) {
      // Frequency of emission based on intensity
      const emissionRate = this.config.intensity * 0.5; // electrons per second
      this.emissionTimer += dt;
      
      if (this.emissionTimer >= 1 / emissionRate) {
        this.emitElectron();
        this.emissionTimer = 0;
      }
    }

    // 2. Update existing electrons
    const K_max = Math.max(0, this.state.photonEnergy - this.config.metalWorkFunction);
    const speedBase = Math.sqrt(K_max) * 200; // Visual scale for speed

    this.state.electrons = this.state.electrons
      .map(e => ({
        ...e,
        x: e.x + e.vx * dt,
        y: e.y + e.vy * dt,
        life: e.life - dt
      }))
      .filter(e => e.life > 0);
  }

  private emitElectron() {
    const K_max = this.state.photonEnergy - this.config.metalWorkFunction;
    const speed = Math.sqrt(K_max) * 200;
    
    // Random angle mostly upwards
    const angle = (Math.random() - 0.5) * 0.5 - Math.PI / 2;

    this.state.electrons.push({
      id: this.nextElectronId++,
      x: 0, // Relative to plate center in canvas
      y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 2.0 // seconds
    });
    
    // Limit pool size for performance
    if (this.state.electrons.length > 100) {
      this.state.electrons.shift();
    }
  }
}
