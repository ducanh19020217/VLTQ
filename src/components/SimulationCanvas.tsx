import { useEffect, useRef } from 'react';
import { PendulumEngine } from '../physics/PendulumEngine';
import type { PendulumState, PendulumConfig, Vector2D } from '../physics/PendulumEngine';

interface SimulationCanvasProps {
  engineRef: React.MutableRefObject<PendulumEngine | null>;
  showVectors?: boolean;
}

export function SimulationCanvas({ engineRef, showVectors = true }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (state: PendulumState, config: PendulumConfig) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const originX = width / 2;
      const originY = height * 0.25;
      const scale = 120; // 1m = 120px
      
      const bobX = originX + config.length * scale * Math.sin(state.theta);
      const bobY = originY + config.length * scale * Math.cos(state.theta);

      // 1. Draw Energy Bars (Top Left) - Larger
      const barWidth = 25;
      const barMaxHeight = 150;
      const maxEnergy = 500; 
      
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(20, 20, 140, 200);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.strokeRect(20, 20, 140, 200);
      
      const drawBar = (x: number, value: number, color: string, label: string) => {
        const h = Math.min(barMaxHeight, (value / maxEnergy) * barMaxHeight);
        
        // Bar background
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(x, 30, barWidth, barMaxHeight);
        
        // Active bar
        ctx.fillStyle = color;
        ctx.fillRect(x, 30 + barMaxHeight - h, barWidth, h);
        
        // Label & Value
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth / 2, barMaxHeight + 50);
        
        ctx.fillStyle = color;
        ctx.font = 'bold 11px Arial';
        ctx.fillText(value.toFixed(1) + 'J', x + barWidth / 2, barMaxHeight + 65);
      };

      drawBar(35, state.energy.kinetic, '#3b82f6', 'Wđ');
      drawBar(75, state.energy.potential, '#ef4444', 'Wt');
      drawBar(115, state.energy.total, '#10b981', 'W');

      // Add energy conservation formula
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = 'italic 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Wđ = W - Wt', 35, barMaxHeight + 85);

      // 2. Draw Support & String
      ctx.beginPath();
      ctx.moveTo(originX - 50, originY);
      ctx.lineTo(originX + 50, originY);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(bobX, bobY);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      // 4. Draw Bob
      const radius = 15 + Math.sqrt(config.mass) * 5;
      const gradient = ctx.createRadialGradient(bobX - radius/3, bobY - radius/3, radius/10, bobX, bobY, radius);
      gradient.addColorStop(0, '#60a5fa');
      gradient.addColorStop(1, '#2563eb');

      ctx.beginPath();
      ctx.arc(bobX, bobY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#1e3a8a';
      ctx.stroke();

      // 5. Draw Vectors (Velocity, Acceleration, Tension, Gravity) - Now on top
      if (showVectors) {
        const forceScale = 10;
        
        // Tension (along string)
        drawArrow(ctx, bobX, bobY, bobX - Math.sin(state.theta) * state.tension * forceScale, bobY - Math.cos(state.theta) * state.tension * forceScale, '#8b5cf6', 'T');
        
        // Gravity (always down)
        drawArrow(ctx, bobX, bobY, bobX, bobY + config.mass * config.gravity * forceScale, '#10b981', 'P');

        // Velocity (tangent)
        const vScale = 40; 
        drawArrow(ctx, bobX, bobY, bobX + state.velocity.x * vScale, bobY + state.velocity.y * vScale, '#3b82f6', 'v');
        
        // Total Acceleration
        const aScale = 15; 
        drawArrow(ctx, bobX, bobY, bobX + state.acceleration.total.x * aScale, bobY + state.acceleration.total.y * aScale, '#ef4444', 'a');
      }

      // 6. Draw External Force Arrow (if exists) - Now on top
      if (config.externalForce !== 0) {
        drawArrow(ctx, bobX, bobY, bobX + config.externalForce * 10, bobY, '#f59e0b', 'F_ngoài');
      }

      // 6. State Info (Top Right) - Fixed colors for reliability
      const infoX = width - 20;
      const infoY = 40;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // More opaque
      ctx.fillRect(infoX - 180, infoY - 20, 180, 100);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(infoX - 180, infoY - 20, 180, 100);
      
      ctx.fillStyle = '#1e293b'; // Standard dark color
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Góc: ${(state.theta * 180 / Math.PI).toFixed(1)}°`, infoX - 10, infoY + 5);
      ctx.fillText(`Vận tốc: ${(state.omega * config.length).toFixed(2)} m/s`, infoX - 10, infoY + 30);
      ctx.fillText(`Lực căng: ${state.tension.toFixed(2)} N`, infoX - 10, infoY + 55);
      ctx.fillText(`Trọng lực: ${(config.mass * config.gravity).toFixed(2)} N`, infoX - 10, infoY + 80);
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
      if (engineRef.current && !engineRef.current.getIsRunning()) {
        draw(engineRef.current.state, engineRef.current.config);
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (!engineRef.current) {
      engineRef.current = new PendulumEngine();
    }

    engineRef.current.onUpdate = draw;
    draw(engineRef.current.state, engineRef.current.config);

    const getAngleFromEvent = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const originX = canvas.width / 2;
      const originY = canvas.height * 0.25;
      let cx, cy;
      if (window.TouchEvent && e instanceof TouchEvent) {
        cx = e.touches[0].clientX; cy = e.touches[0].clientY;
      } else {
        cx = (e as MouseEvent).clientX; cy = (e as MouseEvent).clientY;
      }
      return Math.atan2(cx - rect.left - originX, cy - rect.top - originY);
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (engineRef.current?.getIsRunning()) return;
      isDragging.current = true;
      engineRef.current?.setAngle(getAngleFromEvent(e));
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      engineRef.current?.setAngle(getAngleFromEvent(e));
    };

    const handleEnd = () => { isDragging.current = false; };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      if (engineRef.current) engineRef.current.pause();
    };
  }, [engineRef, showVectors]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
