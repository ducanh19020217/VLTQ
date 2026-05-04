import { useEffect, useRef } from 'react';
import { SpringEngine } from '../physics/SpringEngine';
import type { SpringState, SpringConfig } from '../physics/SpringEngine';

interface SpringCanvasProps {
  engineRef: React.MutableRefObject<SpringEngine | null>;
}

export function SpringCanvas({ engineRef }: SpringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (state: SpringState, config: SpringConfig) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const originX = width * 0.1; // Wall position
      const centerY = height / 2;
      const equilibriumX = width / 2;
      const scale = 100; // 1m = 100px
      
      const currentX = equilibriumX + state.x * scale;

      // 1. Draw Wall
      ctx.fillStyle = '#475569';
      ctx.fillRect(originX - 10, centerY - 60, 10, 120);
      
      // Wall texture (lines)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      for (let i = -60; i <= 60; i += 10) {
        ctx.beginPath();
        ctx.moveTo(originX - 10, centerY + i);
        ctx.lineTo(originX, centerY + i - 5);
        ctx.stroke();
      }

      // 2. Draw Ground
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, centerY + 40);
      ctx.lineTo(width - 50, centerY + 40);
      ctx.stroke();

      // 3. Draw Spring
      const coils = 15;
      const springWidth = currentX - originX;
      ctx.beginPath();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      
      ctx.moveTo(originX, centerY);
      for (let i = 0; i <= coils; i++) {
        const x = originX + (springWidth / coils) * i;
        const y = centerY + (i % 2 === 0 ? -20 : 20);
        if (i === 0 || i === coils) {
          ctx.lineTo(x, centerY);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 4. Draw Block (Mass)
      const blockSize = 40 + Math.sqrt(config.mass) * 10;
      const blockX = currentX;
      const blockY = centerY - blockSize / 2;

      const gradient = ctx.createLinearGradient(blockX, blockY, blockX + blockSize, blockY + blockSize);
      gradient.addColorStop(0, '#f97316');
      gradient.addColorStop(1, '#ea580c');

      ctx.fillStyle = gradient;
      ctx.fillRect(blockX, blockY, blockSize, blockSize);
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2;
      ctx.strokeRect(blockX, blockY, blockSize, blockSize);
      
      // Label mass
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${config.mass}kg`, blockX + blockSize/2, centerY + 5);

      // 5. Draw Equilibrium Reference Line
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(equilibriumX, centerY - 80);
      ctx.lineTo(equilibriumX, centerY + 80);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Arial';
      ctx.fillText('Vị trí cân bằng', equilibriumX, centerY - 90);
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
      engineRef.current = new SpringEngine();
    }

    engineRef.current.onUpdate = draw;
    draw(engineRef.current.state, engineRef.current.config);

    const getXFromEvent = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const equilibriumX = canvas.width / 2;
      const scale = 100;
      
      let clientX;
      if (window.TouchEvent && e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = (e as MouseEvent).clientX;
      }
      
      const x = clientX - rect.left - equilibriumX;
      return x / scale;
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (engineRef.current?.getIsRunning()) return;
      isDragging.current = true;
      const x = getXFromEvent(e);
      engineRef.current?.setDisplacement(x);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = getXFromEvent(e);
      engineRef.current?.setDisplacement(x);
    };

    const handleEnd = () => {
      isDragging.current = false;
    };

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
  }, [engineRef]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
