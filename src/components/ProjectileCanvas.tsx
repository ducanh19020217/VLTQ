import { useEffect, useRef } from 'react';
import { ProjectileEngine } from '../physics/ProjectileEngine';
import type { ProjectileState, ProjectileConfig } from '../physics/ProjectileEngine';

interface ProjectileCanvasProps {
  engineRef: React.MutableRefObject<ProjectileEngine | null>;
  showVectors?: boolean;
  showPath?: boolean;
}

export function ProjectileCanvas({ engineRef, showVectors = true, showPath = true }: ProjectileCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (state: ProjectileState, config: ProjectileConfig) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // 1. Dynamic Scaling
      // We want to fit the whole range and height.
      // Expected Range L = v0 * sqrt(2h/g)
      const expectedRange = config.v0 * Math.sqrt((2 * config.initialHeight) / config.gravity);
      const margin = 100;
      const scaleX = (width - margin * 2) / Math.max(expectedRange, 20);
      const scaleY = (height - margin * 2) / Math.max(config.initialHeight, 20);
      const scale = Math.min(scaleX, scaleY);

      const offsetX = margin;
      const offsetY = height - margin;

      const toCanvasX = (x: number) => offsetX + x * scale;
      const toCanvasY = (y: number) => offsetY - y * scale;

      // 2. Draw Axes
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Ox
      ctx.moveTo(offsetX - 20, offsetY);
      ctx.lineTo(width - 20, offsetY);
      // Oy
      ctx.moveTo(offsetX, offsetY + 20);
      ctx.lineTo(offsetX, 20);
      ctx.stroke();

      // Axis Labels
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('x (m)', width - 50, offsetY - 10);
      ctx.fillText('y (m)', offsetX + 10, 40);

      // 3. Draw Cliff/Platform & Cannon
      const cannonX = offsetX;
      const cannonY = toCanvasY(config.initialHeight);
      
      // Platform
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(offsetX - 60, cannonY, 60, height - cannonY - margin);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(offsetX - 60, cannonY, 60, height - cannonY - margin);

      // Cannon
      ctx.save();
      ctx.translate(cannonX, cannonY);
      ctx.rotate(-config.angle * Math.PI / 180); // Negative because canvas y is inverted
      
      const cannonW = 40;
      const cannonH = 15;
      
      // Cannon body
      const cannonGrad = ctx.createLinearGradient(0, -cannonH/2, 0, cannonH/2);
      cannonGrad.addColorStop(0, '#475569');
      cannonGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = cannonGrad;
      ctx.fillRect(0, -cannonH/2, cannonW, cannonH);
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(0, -cannonH/2, cannonW, cannonH);
      
      // Cannon detail
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(0, -cannonH/2, cannonW, cannonH/3);
      
      ctx.restore();

      // Base of cannon
      ctx.beginPath();
      ctx.arc(cannonX, cannonY, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.stroke();

      // 4. Draw Trajectory Path
      if (showPath && state.path.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.moveTo(toCanvasX(state.path[0].x), toCanvasY(state.path[0].y));
        for (let i = 1; i < state.path.length; i++) {
          ctx.lineTo(toCanvasX(state.path[i].x), toCanvasY(state.path[i].y));
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 5. Draw Projectile (Ball)
      const ballX = toCanvasX(state.x);
      const ballY = toCanvasY(state.y);
      const radius = 10;

      const gradient = ctx.createRadialGradient(ballX - 3, ballY - 3, 2, ballX, ballY, radius);
      gradient.addColorStop(0, '#ef4444');
      gradient.addColorStop(1, '#991b1b');

      ctx.beginPath();
      ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 6. Draw Vectors
      if (showVectors && !state.isLanded) {
        const vScale = 2;
        // vx (Horizontal)
        drawArrow(ctx, ballX, ballY, ballX + state.vx * vScale, ballY, '#3b82f6', 'vx');
        // vy (Vertical)
        drawArrow(ctx, ballX, ballY, ballX, ballY - state.vy * vScale, '#10b981', 'vy');
        // vTotal
        drawArrow(ctx, ballX, ballY, ballX + state.vx * vScale, ballY - state.vy * vScale, '#f59e0b', 'v');
      }

      // 7. Ground Markings
      ctx.fillStyle = '#475569';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      for (let i = 0; i <= expectedRange; i += 20) {
          ctx.beginPath();
          ctx.moveTo(toCanvasX(i), offsetY);
          ctx.lineTo(toCanvasX(i), offsetY + 5);
          ctx.stroke();
          ctx.fillText(i + 'm', toCanvasX(i), offsetY + 20);
      }
    };

    const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string, label: string) => {
      const headlen = 10;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const angle = Math.atan2(dy, dx);
      
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 12px Arial';
      ctx.fillText(label, toX + 5, toY + 5);
    };

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (engineRef.current) {
        draw(engineRef.current.state, engineRef.current.config);
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (!engineRef.current) {
      engineRef.current = new ProjectileEngine();
    }

    engineRef.current.onUpdate = draw;
    draw(engineRef.current.state, engineRef.current.config);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (engineRef.current) engineRef.current.pause();
    };
  }, [engineRef, showVectors, showPath]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
