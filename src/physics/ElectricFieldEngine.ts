export type Charge = {
  id: string;
  x: number;
  y: number;
  q: number; // Charge magnitude in arbitrary units
};

export type Vector2D = {
  x: number;
  y: number;
};

export type ElectricFieldConfig = {
  k: number; // Coulomb's constant (normalized)
  lineDensity: number;
  stepSize: number;
  maxSteps: number;
};

export class ElectricFieldEngine {
  public charges: Charge[] = [];
  public config: ElectricFieldConfig;

  constructor() {
    this.config = {
      k: 100000,
      lineDensity: 8,
      stepSize: 2,
      maxSteps: 500,
    };
    
    // Default Dipole
    this.addCharge(200, 300, 1);
    this.addCharge(600, 300, -1);
  }

  public addCharge(x: number, y: number, q: number): string {
    const id = Math.random().toString(36).substr(2, 9);
    this.charges.push({ id, x, y, q });
    return id;
  }

  public removeCharge(id: string) {
    this.charges = this.charges.filter(c => c.id !== id);
  }

  public updateCharge(id: string, updates: Partial<Charge>) {
    const charge = this.charges.find(c => c.id === id);
    if (charge) {
      Object.assign(charge, updates);
    }
  }

  public getFieldValue(x: number, y: number): Vector2D {
    let ex = 0;
    let ey = 0;

    for (const charge of this.charges) {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const r2 = dx * dx + dy * dy;
      if (r2 < 100) continue; // Softening to avoid infinity

      const r = Math.sqrt(r2);
      const force = (this.config.k * charge.q) / r2;
      ex += (force * dx) / r;
      ey += (force * dy) / r;
    }

    return { x: ex, y: ey };
  }

  public getPotential(x: number, y: number): number {
    let v = 0;
    for (const charge of this.charges) {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r < 10) continue; // Softening
      v += (this.config.k * charge.q) / r;
    }
    return v;
  }

  public traceFieldLine(startX: number, startY: number, direction: 1 | -1): Vector2D[] {
    const points: Vector2D[] = [{ x: startX, y: startY }];
    let currX = startX;
    let currY = startY;

    for (let i = 0; i < this.config.maxSteps; i++) {
      const field = this.getFieldValue(currX, currY);
      const mag = Math.sqrt(field.x * field.x + field.y * field.y);
      if (mag === 0) break;

      const stepX = (field.x / mag) * this.config.stepSize * direction;
      const stepY = (field.y / mag) * this.config.stepSize * direction;

      currX += stepX;
      currY += stepY;

      // Check if we hit a charge
      let hitCharge = false;
      for (const charge of this.charges) {
        const dx = currX - charge.x;
        const dy = currY - charge.y;
        if (dx * dx + dy * dy < 25) {
          points.push({ x: charge.x, y: charge.y });
          hitCharge = true;
          break;
        }
      }

      if (hitCharge) break;

      // Check if out of bounds (approximate)
      if (currX < -2000 || currX > 4000 || currY < -2000 || currY > 4000) break;

      points.push({ x: currX, y: currY });
    }

    return points;
  }
}
