export type Point = { x: number; y: number };

export type Magnet = {
  center: Point;
  angle: number; // in radians
  strength: number;
  length: number;
};

export type MagnetismState = {
  magnets: Magnet[];
  fieldLines: Point[][];
  showFieldLines: boolean;
  showFilings: boolean;
  showCompasses: boolean;
};

export class MagnetismEngine {
  public state: MagnetismState;
  private listeners: ((state: MagnetismState) => void)[] = [];

  constructor() {
    this.state = {
      magnets: [
        { center: { x: 400, y: 350 }, angle: 0, strength: 5, length: 160 }
      ],
      fieldLines: [],
      showFieldLines: true,
      showFilings: true,
      showCompasses: true
    };
    this.calculate();
  }

  public addListener(listener: (state: MagnetismState) => void) {
    this.listeners.push(listener);
    listener(this.state);
  }

  public removeListener(listener: (state: MagnetismState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }

  public updateMagnet(index: number, updates: Partial<Magnet>) {
    this.state.magnets[index] = { ...this.state.magnets[index], ...updates };
    this.calculate();
    this.notify();
  }

  public setVisibility(key: 'showFieldLines' | 'showFilings' | 'showCompasses', val: boolean) {
    this.state[key] = val;
    this.notify();
  }

  public getFieldAt(x: number, y: number): Point {
    let bx = 0;
    let by = 0;

    this.state.magnets.forEach(m => {
        // Dipole approximation: Field from N and S poles
        // North pole position
        const nx = m.center.x + Math.cos(m.angle) * m.length / 2;
        const ny = m.center.y + Math.sin(m.angle) * m.length / 2;
        // South pole position
        const sx = m.center.x - Math.cos(m.angle) * m.length / 2;
        const sy = m.center.y - Math.sin(m.angle) * m.length / 2;

        // North pole (positive monopole)
        const dxN = x - nx;
        const dyN = y - ny;
        const r2N = dxN * dxN + dyN * dyN;
        const rN = Math.sqrt(r2N);
        const fN = m.strength * 10000 / (r2N * rN + 1); // 1/r^2 force
        bx += (dxN / rN) * fN;
        by += (dyN / rN) * fN;

        // South pole (negative monopole)
        const dxS = x - sx;
        const dyS = y - sy;
        const r2S = dxS * dxS + dyS * dyS;
        const rS = Math.sqrt(r2S);
        const fS = -m.strength * 10000 / (r2S * rS + 1);
        bx += (dxS / rS) * fS;
        by += (dyS / rS) * fS;
    });

    return { x: bx, y: by };
  }

  private calculate() {
    if (!this.state.showFieldLines) {
        this.state.fieldLines = [];
        return;
    }

    const lines: Point[][] = [];
    const magnet = this.state.magnets[0];
    
    // Seed points around the North pole
    const nx = magnet.center.x + Math.cos(magnet.angle) * magnet.length / 2;
    const ny = magnet.center.y + Math.sin(magnet.angle) * magnet.length / 2;
    
    const numLines = 16;
    for (let i = 0; i < numLines; i++) {
        const a = (i / numLines) * Math.PI * 2;
        let curr = { x: nx + Math.cos(a) * 10, y: ny + Math.sin(a) * 10 };
        const line: Point[] = [curr];
        
        for (let step = 0; step < 200; step++) {
            const b = this.getFieldAt(curr.x, curr.y);
            const mag = Math.sqrt(b.x * b.x + b.y * b.y);
            if (mag < 0.1) break;
            
            const next = {
                x: curr.x + (b.x / mag) * 5,
                y: curr.y + (b.y / mag) * 5
            };
            
            // Check if reached South pole
            const sx = magnet.center.x - Math.cos(magnet.angle) * magnet.length / 2;
            const sy = magnet.center.y - Math.sin(magnet.angle) * magnet.length / 2;
            const distS = Math.hypot(next.x - sx, next.y - sy);
            
            line.push(next);
            if (distS < 10) break;
            if (next.x < -100 || next.x > 1500 || next.y < -100 || next.y > 1500) break;
            curr = next;
        }
        lines.push(line);
    }
    this.state.fieldLines = lines;
  }
}
