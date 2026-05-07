export interface ArtilleryConfig3D {
  v0: number;            // Initial velocity (m/s)
  elevation: number;     // Pitch angle (degrees)
  azimuth: number;       // Yaw angle (degrees)
  gravity: number;       // Gravity (m/s^2)
  dragCoef: number;      // Drag coefficient (k)
  mass: number;          // Mass of projectile (kg)
  windSpeed: number;     // Wind speed (m/s)
  windDir: number;       // Wind direction angle (degrees)
  // --- ADVANCED ---
  mortarX: number;       // Mortar X position
  mortarZ: number;       // Mortar Z position
  latitude: number;      // Latitude for Coriolis (degrees, positive = North)
  temperature: number;   // Surface Temperature (Celsius)
  dispersion: number;    // Dispersion variance multiplier (0 to 1)
  seed: number;          // Map seed
}


export interface ProjectileState {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  t: number;
  path: { x: number; y: number; z: number }[];
  isLanded: boolean;
  actualV0: number;
  actualEl: number;
  actualAz: number;
}

export interface TargetState {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  isDestroyed: boolean;
}

export interface TreeState {
  x: number;
  y: number;
  z: number;
  scale: number;
}

export interface VillageState {
  id: string;
  x: number;
  y: number;
  z: number;
  houses: { x: number; y: number; z: number; rotation: number; scaleX: number; scaleZ: number }[];
}

export interface PlayerState {
  id: 1 | 2;
  hp: number;
  x: number;
  z: number;
  y: number;
  weapon: 'standard' | 'he' | 'ap';
}

export interface ArtilleryState3D {
  projectiles: ProjectileState[];
  impacts: { x: number; y: number; z: number }[]; 
  targets: TargetState[];
  trees: TreeState[];
  villages: VillageState[];
  players: PlayerState[];
  activePlayerId: 1 | 2;
  gameOver: boolean;
  winner: 1 | 2 | null;
}

// Pseudo-random number generator for seeded terrain
function seededRandom(seed: number) {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// Box-Muller transform for standard normal distribution
function randomGaussian(seedRng?: () => number) {
    let u = 0, v = 0;
    const rng = seedRng || Math.random;
    while(u === 0) u = rng(); 
    while(v === 0) v = rng();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}


export class ArtilleryEngine3D {
  public config: ArtilleryConfig3D;
  public state: ArtilleryState3D;
  
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  private listeners: ((state: ArtilleryState3D, config: ArtilleryConfig3D) => void)[] = [];

  public addListener(listener: (state: ArtilleryState3D, config: ArtilleryConfig3D) => void) {
      this.listeners.push(listener);
  }

  public removeListener(listener: (state: ArtilleryState3D, config: ArtilleryConfig3D) => void) {
      this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
      this.listeners.forEach(l => l(this.state, this.config));
  }

  constructor(config?: Partial<ArtilleryConfig3D>) {
    this.config = {
      v0: 150,
      elevation: 45,
      azimuth: 0,
      gravity: 9.81,
      dragCoef: 0.05,
      mass: 40,
      windSpeed: 0,
      windDir: 90,
      mortarX: 0,
      mortarZ: 0,
      latitude: 21, // e.g. Hanoi
      temperature: 25,
      dispersion: 0.2,
      seed: 12345,
      ...config
    };
    
    this.state = {
        projectiles: [],
        impacts: [],
        targets: [],
        trees: [],
        villages: [],
        players: [
            { id: 1, hp: 100, x: -2000, z: 0, y: 0, weapon: 'standard' },
            { id: 2, hp: 100, x: 2000, z: 0, y: 0, weapon: 'standard' }
        ],
        activePlayerId: 1,
        gameOver: false,
        winner: null
    };
    this.initGame();
  }

  private initGame() {
    // Set heights for players
    this.state.players[0].y = this.getTerrainHeight(this.state.players[0].x, this.state.players[0].z);
    this.state.players[1].y = this.getTerrainHeight(this.state.players[1].x, this.state.players[1].z);
    
    this.generateScenery();
  }

  private rng() {
    return seededRandom(this.config.seed++);
  }

  private generateScenery() {
    this.state.trees = [];
    this.state.villages = [];
    let tempSeed = this.config.seed;
    const rng = () => seededRandom(tempSeed++);

    
    // Generate trees
    for (let i = 0; i < 3000; i++) {
        const x = (rng() - 0.5) * 6000;
        const z = (rng() - 0.5) * 6000;
        
        // Avoid river
        const riverCenterX = Math.sin(z / 300) * 300 + Math.cos(z / 800) * 400;
        if (Math.abs(x - riverCenterX) < 120) continue;
        
        const y = this.getTerrainHeight(x, z);
        
        // Avoid steep slopes
        const dx = this.getTerrainHeight(x + 5, z) - y;
        const dz = this.getTerrainHeight(x, z + 5) - y;
        const gradient = Math.sqrt(dx*dx + dz*dz) / 5;
        
        if (gradient > 0.4) continue;
        if (y < 1.5) continue;
        
        // Cluster trees using a noise function
        const noise = Math.sin(x/200) + Math.cos(z/200);
        if (noise > 0.5) {
            this.state.trees.push({
                x, y, z,
                scale: 0.8 + rng() * 0.6
            });
        }
    }
    
    // Generate villages
    for (let v = 0; v < 3; v++) {
        let cx = 0, cz = 0, cy = 0;
        let found = false;
        for(let attempts=0; attempts<50; attempts++) {
            cx = (rng() - 0.5) * 4000;
            cz = -1000 - rng() * 3000; 
            const riverCenterX = Math.sin(cz / 300) * 300 + Math.cos(cz / 800) * 400;
            if (Math.abs(cx - riverCenterX) < 150) continue; 
            
            cy = this.getTerrainHeight(cx, cz);
            if (cy < 2) continue;
            
            // Check flatness
            let flat = true;
            for(let i=0; i<5; i++) {
                const tx = cx + (rng()-0.5)*100;
                const tz = cz + (rng()-0.5)*100;
                if (Math.abs(this.getTerrainHeight(tx, tz) - cy) > 5) {
                    flat = false; break;
                }
            }
            if (flat) { found = true; break; }
        }
        
        if (found) {
            const village: VillageState = {
                id: `v_${v}`,
                x: cx, y: cy, z: cz,
                houses: []
            };
            
            const houseCount = 10 + Math.floor(rng() * 10);
            for(let h=0; h<houseCount; h++) {
                const hx = cx + (rng()-0.5)*80;
                const hz = cz + (rng()-0.5)*80;
                const hy = this.getTerrainHeight(hx, hz);
                village.houses.push({
                    x: hx, y: hy, z: hz,
                    rotation: rng() * Math.PI,
                    scaleX: 4 + rng() * 4,
                    scaleZ: 4 + rng() * 4
                });
            }
            this.state.villages.push(village);
        }
    }
  }

  public setConfig(newConfig: Partial<ArtilleryConfig3D>) {
    this.config = { ...this.config, ...newConfig };
    this.notifyListeners();
  }

  public play() {
    if (this.state.gameOver) return;

    const activePlayer = this.state.players.find(p => p.id === this.state.activePlayerId)!;
    this.config.mortarX = activePlayer.x;
    this.config.mortarZ = activePlayer.z;

    const variance = this.config.dispersion;
    const actualV0 = this.config.v0 + randomGaussian(() => this.rng()) * (variance * 2);
    const actualEl = this.config.elevation + randomGaussian(() => this.rng()) * (variance * 0.5);
    const actualAz = this.config.azimuth + randomGaussian(() => this.rng()) * (variance * 0.5);

    const elRad = (actualEl * Math.PI) / 180;
    const azRad = (actualAz * Math.PI) / 180;
    
    const mortarY = this.getTerrainHeight(this.config.mortarX, this.config.mortarZ) + 0.5;

    const newProjectile: ProjectileState = {
        id: Math.random().toString(36).substr(2, 9),
        x: this.config.mortarX,
        y: mortarY,
        z: this.config.mortarZ,
        vx: actualV0 * Math.cos(elRad) * Math.sin(azRad),
        vz: -actualV0 * Math.cos(elRad) * Math.cos(azRad),
        vy: actualV0 * Math.sin(elRad),
        t: 0,
        path: [{ x: this.config.mortarX, y: mortarY, z: this.config.mortarZ }],
        isLanded: false,
        actualV0,
        actualEl,
        actualAz
    };

    this.state.projectiles.push(newProjectile);

    this.notifyListeners();

    if (!this.isRunning) {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }
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
    this.state.projectiles = [];
    this.state.impacts = [];
    this.state.players[0].hp = 100;
    this.state.players[1].hp = 100;
    this.state.gameOver = false;
    this.state.winner = null;
    this.state.activePlayerId = 1;
    this.config.seed = Math.floor(Math.random() * 100000);
    this.initGame();
    this.notifyListeners();
  }

  public clearImpacts() {
    this.state.impacts = [];
    this.state.projectiles = [];
    this.notifyListeners();
  }

  public getIsRunning() {
    return this.isRunning;
  }

  // Complex Fractal Terrain with River
  public getTerrainHeight(x: number, z: number): number {
    const h1 = Math.sin(x / 150) * Math.cos(z / 150) * 40;
    const h2 = Math.sin(x / 50 + 2) * Math.cos(z / 40 - 1) * 15;
    const h3 = Math.sin(x / 15 - z / 20) * 5;
    
    let total = h1 + h2 + h3;
    if (total < 0) total *= 0.3;
    
    const slope = -z / 100;
    let baseHeight = Math.max(0, total + slope);
    
    // River carving
    const riverCenterX = Math.sin(z / 300) * 300 + Math.cos(z / 800) * 400;
    const distToRiver = Math.abs(x - riverCenterX);
    
    if (distToRiver < 100) {
        const riverDepth = -2;
        const factor = distToRiver / 100; // 0 to 1
        baseHeight = riverDepth + (baseHeight - riverDepth) * (factor * factor);
    }
    
    return baseHeight;
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    if (dt > 0.05) dt = 0.05; 
    this.lastTime = currentTime;

    const timeScale = 2.0;
    dt *= timeScale;

    const subSteps = 10;
    const sdt = dt / subSteps;
    
    for (let i = 0; i < subSteps; i++) {
        this.stepAll(sdt);
    }

    this.notifyListeners();

    const anyActive = this.state.projectiles.some(p => !p.isLanded);
    if (anyActive) {
        this.animationFrameId = requestAnimationFrame(this.loop);
    } else {
        this.isRunning = false;
        if (!this.state.gameOver) {
           this.endTurn();
        }
    }
  };

  private endTurn() {
     // Switch turn
     this.state.activePlayerId = this.state.activePlayerId === 1 ? 2 : 1;
     
     // Randomize weather slightly for the next turn
     this.config.windSpeed = Math.max(0, Math.min(20, this.config.windSpeed + (Math.random() - 0.5) * 10));
     this.config.windDir = (this.config.windDir + (Math.random() - 0.5) * 90) % 360;
     
     this.notifyListeners();
  }


  private stepAll(dt: number) {
    this.state.projectiles.forEach(p => {
        if (!p.isLanded) {
            this.stepProjectile(p, dt);
        }
    });
  }

  private stepProjectile(p: ProjectileState, dt: number) {
    const { gravity, dragCoef, mass, windSpeed, windDir, latitude, temperature } = this.config;
    
    const M = 0.02896; 
    const R = 8.314;   
    const T_kelvin = temperature + 273.15;
    const exponent = -(M * gravity * p.y) / (R * T_kelvin);
    const airDensityRatio = Math.exp(exponent); 
    
    const wdRad = (windDir * Math.PI) / 180;
    const wx = windSpeed * Math.cos(wdRad);
    const wz = windSpeed * Math.sin(wdRad);

    const vrx = p.vx - wx;
    const vry = p.vy;
    const vrz = p.vz - wz;
    const vr = Math.sqrt(vrx*vrx + vry*vry + vrz*vrz);

    const currentDrag = dragCoef * airDensityRatio;
    const Fdx = -currentDrag * vr * vrx;
    const Fdy = -currentDrag * vr * vry;
    const Fdz = -currentDrag * vr * vrz;

    const omega = 7.2921e-5; 
    const latRad = (latitude * Math.PI) / 180;
    const Ox = 0;
    const Oy = omega * Math.sin(latRad);
    const Oz = -omega * Math.cos(latRad);

    const cx = Oy * p.vz - Oz * p.vy;
    const cy = Oz * p.vx - Ox * p.vz;
    const cz = Ox * p.vy - Oy * p.vx;

    const ax = (Fdx / mass) - 2 * cx;
    const ay = -gravity + (Fdy / mass) - 2 * cy;
    const az = (Fdz / mass) - 2 * cz;

    p.vx += ax * dt;
    p.vy += ay * dt;
    p.vz += az * dt;
    
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.t += dt;

    const terrainH = this.getTerrainHeight(p.x, p.z);
    if (p.y <= terrainH && p.t > 0.2) {
      p.y = terrainH;
      p.isLanded = true;
      this.state.impacts.push({ x: p.x, y: p.y, z: p.z });
      
      // Hit detection on players
      const blastRadius = 30; // 30m explosion radius
      this.state.players.forEach(player => {
          const dx = p.x - player.x;
          const dz = p.z - player.z;
          const dist = Math.sqrt(dx*dx + dz*dz);
          
          if (dist <= blastRadius) {
              // Calculate damage: max 50, decreases with distance
              const damage = Math.floor(50 * (1 - dist / blastRadius));
              player.hp = Math.max(0, player.hp - damage);
              
              if (player.hp === 0 && !this.state.gameOver) {
                 this.state.gameOver = true;
                 this.state.winner = player.id === 1 ? 2 : 1;
              }
          }
      });
    }

    if (Math.floor(p.t * 100) % 5 === 0) {
        p.path.push({ x: p.x, y: p.y, z: p.z });
    }
  }
}
