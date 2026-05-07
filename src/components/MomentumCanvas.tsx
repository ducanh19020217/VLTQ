import { useEffect, useRef } from 'react';
import { MomentumEngine } from '../physics/MomentumEngine';
import type { MomentumState } from '../physics/MomentumEngine';

interface MomentumCanvasProps {
  engineRef: React.MutableRefObject<MomentumEngine | null>;
}

export function MomentumCanvas({ engineRef }: MomentumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new MomentumEngine();
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (engineRef.current) engineRef.current.setConfig({ width: canvas.width });
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = (state: MomentumState) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw ground/track
      ctx.beginPath();
      ctx.moveTo(0, height / 2 + 50);
      ctx.lineTo(width, height / 2 + 50);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw objects
      state.objects.forEach(obj => {
        const y = height / 2;
        
        // Shadow
        ctx.beginPath();
        ctx.ellipse(obj.x, y + 50, obj.radius, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fill();

        // Object body
        ctx.beginPath();
        ctx.arc(obj.x, y, obj.radius, 0, Math.PI * 2);
        ctx.fillStyle = obj.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Labels
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${obj.m}kg`, obj.x, y + 5);
        
        // Velocity vector
        const arrowLen = obj.v * 2;
        if (Math.abs(arrowLen) > 5) {
            ctx.beginPath();
            ctx.moveTo(obj.x, y - obj.radius - 10);
            ctx.lineTo(obj.x + arrowLen, y - obj.radius - 10);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Arrow head
            const headSize = 8;
            const dir = obj.v > 0 ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(obj.x + arrowLen, y - obj.radius - 10);
            ctx.lineTo(obj.x + arrowLen - headSize * dir, y - obj.radius - 10 - headSize);
            ctx.lineTo(obj.x + arrowLen - headSize * dir, y - obj.radius - 10 + headSize);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            
            ctx.fillStyle = '#10b981';
            ctx.font = '12px Arial';
            ctx.fillText(`${obj.v.toFixed(1)} m/s`, obj.x + arrowLen / 2, y - obj.radius - 25);
        }
      });
    };

    engineRef.current.addListener(draw);

    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      
      if (engineRef.current) {
        engineRef.current.step(Math.min(dt, 0.1));
      }
      
      requestAnimationFrame(loop);
    };

    const animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, [engineRef]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
