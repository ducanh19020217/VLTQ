export interface Material {
  name: string;
  density: number; // kg/m3
  color: string;
}

export const MATERIALS: Material[] = [
  { name: 'Gỗ', density: 600, color: '#8b4513' },
  { name: 'Nhôm', density: 2700, color: '#d1d5db' },
  { name: 'Sắt', density: 7800, color: '#4b5563' },
  { name: 'Vàng', density: 19300, color: '#fbbf24' },
  { name: 'Đá', density: 2500, color: '#6b7280' },
  { name: 'Nước', density: 1000, color: '#3b82f6' }
];

export interface DensityObject {
  id: string;
  name: string;
  mass: number;    // kg
  volume: number;  // m3
  color: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  state: 'bench' | 'scale' | 'water';
  isDragging?: boolean;
}

export interface DensityState {
  objects: DensityObject[];
  liquidDensity: number;
  scaleReading: number; // kg
  beakerVolume: number; // m3 (current water level)
}

export class DensityEngine {
  public state: DensityState;
  public onUpdate?: (state: DensityState) => void;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  constructor() {
    this.state = {
      objects: [],
      liquidDensity: 1000,
      scaleReading: 0,
      beakerVolume: 0.005
    };
    this.reset();
    this.play();
  }

  public reset() {
    this.state.objects = MATERIALS.filter(m => m.name !== 'Nước').map((m, i) => ({
      id: `obj-${i}`,
      name: m.name,
      mass: m.density * 0.0002, 
      volume: 0.0002,
      color: m.color,
      position: { x: 100 + i * 100, y: 100 }, // Start in air for dramatic fall
      velocity: { x: 0, y: 0 },
      state: 'bench'
    } as DensityObject));
    this.calculateReadings();
  }

  public play() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;
    let dt = (currentTime - this.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    this.lastTime = currentTime;

    this.step(dt);
    if (this.onUpdate) this.onUpdate(this.state);
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private step(dt: number) {
    const gravity = 9.8;
    const drag = 0.95;
    const waterDrag = 0.8;

    this.state.objects.forEach(obj => {
      if (obj.isDragging) return;

      // Vertical physics
      let force = obj.mass * gravity;
      
      const inWater = obj.state === 'water';
      if (inWater) {
        // Buoyancy force = volume * liquidDensity * gravity
        const buoyancy = obj.volume * this.state.liquidDensity * gravity;
        force -= buoyancy;
        
        obj.velocity.y *= waterDrag;
        obj.velocity.x *= waterDrag;
      } else {
        obj.velocity.y *= drag;
      }

      const accel = force / obj.mass;
      obj.velocity.y += accel * dt;
      obj.position.y += obj.velocity.y * 100 * dt; // Scale factor for visual motion

      // Bench collision
      const benchY = 400; // Approx lab bench height
      if (obj.state === 'bench' && obj.position.y > benchY) {
        obj.position.y = benchY;
        obj.velocity.y = 0;
      }
      
      // Water surface limits
      const beakerTop = 280;
      const beakerBottom = 480;
      if (obj.state === 'water') {
          if (obj.position.y > beakerBottom - 20) {
              obj.position.y = beakerBottom - 20;
              obj.velocity.y *= -0.2; // Bounce
          }
          // If it floats, keep it at surface
          if (obj.mass / obj.volume < this.state.liquidDensity && obj.position.y < beakerTop + 20) {
              obj.position.y = beakerTop + 20;
              obj.velocity.y = 0;
          }
      }
    });

    this.calculateReadings();
  }

  public moveObject(id: string, x: number, y: number, canvasWidth: number, canvasHeight: number, isDragging: boolean = false) {
    const obj = this.state.objects.find(o => o.id === id);
    if (!obj) return;

    obj.position = { x, y };
    obj.isDragging = isDragging;
    if (isDragging) {
      obj.velocity = { x: 0, y: 0 };
    }

    const scaleArea = { x: canvasWidth * 0.25, y: canvasHeight * 0.7, w: 150, h: 100 };
    const beakerArea = { x: canvasWidth * 0.7, y: canvasHeight * 0.6, w: 140, h: 250 };

    if (x > scaleArea.x - 75 && x < scaleArea.x + 75 && y > scaleArea.y - 100 && y < scaleArea.y + 50) {
      obj.state = 'scale';
    } else if (x > beakerArea.x - 70 && x < beakerArea.x + 70 && y > beakerArea.y && y < beakerArea.y + 250) {
      obj.state = 'water';
    } else {
      obj.state = 'bench';
    }

    this.calculateReadings();
  }

  private calculateReadings() {
    // Scale
    const onScale = this.state.objects.filter(o => o.state === 'scale');
    this.state.scaleReading = onScale.reduce((sum, o) => sum + o.mass, 0);

    // Beaker
    const inWater = this.state.objects.filter(o => o.state === 'water');
    const displacedVolume = inWater.reduce((sum, o) => sum + o.volume, 0);
    this.state.beakerVolume = 0.005 + displacedVolume;
  }

  public setCustomObject(mass: number, volume: number) {
    const custom = this.state.objects.find(o => o.id === 'obj-custom') || {
        id: 'obj-custom',
        name: 'Vật bí ẩn',
        mass,
        volume,
        color: '#a855f7',
        position: { x: 500, y: 400 },
        state: 'bench'
    };
    
    // Update existing if found
    const index = this.state.objects.findIndex(o => o.id === 'obj-custom');
    if (index !== -1) {
        this.state.objects[index] = { ...this.state.objects[index], mass, volume };
    } else {
        this.state.objects.push(custom as DensityObject);
    }
    
    this.calculateReadings();
    if (this.onUpdate) this.onUpdate(this.state);
  }
}
