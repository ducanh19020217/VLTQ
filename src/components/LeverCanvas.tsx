import { useEffect, useRef } from 'react';
import { LeverEngine } from '../physics/LeverEngine';
import type { LeverState, LeverConfig } from '../physics/LeverEngine';

interface LeverCanvasProps {
  engineRef: React.MutableRefObject<LeverEngine | null>;
  showVectors?: boolean;
}

export function LeverCanvas({ engineRef, showVectors = true }: LeverCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (state: LeverState, config: LeverConfig) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height * 0.6;
      const scale = 40; // 1m = 40px

      // 1. Draw Support/Ground
      ctx.beginPath();
      ctx.moveTo(centerX - 100, centerY + 100);
      ctx.lineTo(centerX + 100, centerY + 100);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 2. Draw Fulcrum (Triangle)
      const fulcrumSize = 40;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX - fulcrumSize/2, centerY + fulcrumSize);
      ctx.lineTo(centerX + fulcrumSize/2, centerY + fulcrumSize);
      ctx.closePath();
      ctx.fillStyle = '#64748b';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Draw Lever Bar
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(state.angle);

      const barWidth = config.barLength * scale;
      const barHeight = 10;
      
      // Bar background
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-barWidth/2, -barHeight/2, barWidth, barHeight);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barWidth/2, -barHeight/2, barWidth, barHeight);

      // Markings (every 1m)
      ctx.textAlign = 'center';
      ctx.font = '10px Arial';
      ctx.fillStyle = '#475569';
      for (let i = -Math.floor(config.barLength/2); i <= Math.floor(config.barLength/2); i++) {
        const x = i * scale;
        ctx.beginPath();
        ctx.moveTo(x, -barHeight/2);
        ctx.lineTo(x, barHeight/2);
        ctx.stroke();
        if (i !== 0) {
          ctx.fillText(Math.abs(i) + 'm', x, barHeight + 10);
        }
      }

      // 4. Draw Weights
      const drawWeight = (dist: number, mass: number, label: string, color: string) => {
        const x = dist * scale;
        const wSize = 20 + Math.sqrt(mass) * 5;
        
        ctx.fillStyle = color;
        ctx.fillRect(x - wSize/2, -barHeight/2 - wSize, wSize, wSize);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(x - wSize/2, -barHeight/2 - wSize, wSize, wSize);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(mass + 'kg', x, -barHeight/2 - wSize/2 + 4);

        if (showVectors) {
          // Force Vector (Gravity) - In world space usually, but here rotated for convenience
          // Since gravity is always down, we need to counter-rotate the arrow
          ctx.restore();
          ctx.save();
          
          // Calculate world position of weight
          const worldX = centerX + (x * Math.cos(state.angle) - (-barHeight/2 - wSize/2) * Math.sin(state.angle));
          const worldY = centerY + (x * Math.sin(state.angle) + (-barHeight/2 - wSize/2) * Math.cos(state.angle));
          
          const forceScale = 5;
          drawArrow(ctx, worldX, worldY, worldX, worldY + mass * config.gravity * forceScale, color, 'P=' + (mass * config.gravity).toFixed(1) + 'N');
          
          // Go back to bar space
          ctx.translate(centerX, centerY);
          ctx.rotate(state.angle);
        }
      };

      drawWeight(-config.distLeft, config.massLeft, 'L', '#ef4444');
      drawWeight(config.distRight, config.massRight, 'R', '#3b82f6');

      ctx.restore();

      // 5. Info Overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(20, 20, 200, 80);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(20, 20, 200, 80);
      
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Momen trái: ${state.torques.left.toFixed(1)} N.m`, 30, 45);
      ctx.fillText(`Momen phải: ${state.torques.right.toFixed(1)} N.m`, 30, 65);
      ctx.fillStyle = state.isBalanced ? '#10b981' : '#f59e0b';
      ctx.fillText(state.isBalanced ? 'Cân bằng' : 'Không cân bằng', 30, 85);
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

      ctx.fillStyle = '#1e293b';
      ctx.font = '10px Arial';
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
      engineRef.current = new LeverEngine();
    }

    engineRef.current.onUpdate = draw;
    draw(engineRef.current.state, engineRef.current.config);

    const handleStart = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.6;
      let cx, cy;
      if (window.TouchEvent && e instanceof TouchEvent) {
        cx = e.touches[0].clientX; cy = e.touches[0].clientY;
      } else {
        cx = (e as MouseEvent).clientX; cy = (e as MouseEvent).clientY;
      }
      
      const mouseX = cx - rect.left;
      const mouseY = cy - rect.top;
      
      // Basic hit detection for dragging (simple box check in local coords roughly)
      const config = engineRef.current?.config;
      if (!config) return;

      const scale = 40;
      const leftWeightX = centerX - config.distLeft * scale;
      const rightWeightX = centerX + config.distRight * scale;
      
      if (Math.abs(mouseX - leftWeightX) < 30) isDragging.current = 'left';
      else if (Math.abs(mouseX - rightWeightX) < 30) isDragging.current = 'right';
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !engineRef.current) return;
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const centerX = canvas.width / 2;
      let cx;
      if (window.TouchEvent && e instanceof TouchEvent) {
        cx = e.touches[0].clientX;
      } else {
        cx = (e as MouseEvent).clientX;
      }
      
      const mouseX = cx - rect.left;
      const dist = Math.abs(mouseX - centerX) / 40;
      const maxDist = engineRef.current.config.barLength / 2;
      const clampedDist = Math.max(0.1, Math.min(dist, maxDist));

      if (isDragging.current === 'left' && mouseX < centerX) {
        engineRef.current.setConfig({ distLeft: clampedDist });
      } else if (isDragging.current === 'right' && mouseX > centerX) {
        engineRef.current.setConfig({ distRight: clampedDist });
      }
    };

    const handleEnd = () => { isDragging.current = null; };

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
