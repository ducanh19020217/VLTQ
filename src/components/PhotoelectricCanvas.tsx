import { useEffect, useRef } from 'react';
import { PhotoelectricEngine } from '../physics/PhotoelectricEngine';
import type { PhotoelectricState, PhotoelectricConfig } from '../physics/PhotoelectricEngine';

interface PhotoelectricCanvasProps {
  engineRef: React.MutableRefObject<PhotoelectricEngine | null>;
}

export function PhotoelectricCanvas({ engineRef }: PhotoelectricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (!engineRef.current) {
      engineRef.current = new PhotoelectricEngine();
    }

    const wavelengthToColor = (nm: number) => {
      if (nm < 400) return 'rgba(147, 51, 234, 0.4)'; // UV
      if (nm < 450) return 'rgba(79, 70, 229, 0.6)'; // Violet
      if (nm < 500) return 'rgba(59, 130, 246, 0.6)'; // Blue
      if (nm < 570) return 'rgba(34, 197, 94, 0.6)'; // Green
      if (nm < 590) return 'rgba(234, 179, 8, 0.6)'; // Yellow
      if (nm < 640) return 'rgba(249, 115, 22, 0.6)'; // Orange
      return 'rgba(239, 68, 68, 0.6)'; // Red
    };

    const draw = (state: PhotoelectricState, config: PhotoelectricConfig) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const plateWidth = 200;
      const plateHeight = 20;
      const plateX = width / 2 - plateWidth / 2;
      const plateY = height * 0.7;

      // 1. Draw Plate
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(plateX, plateY, plateWidth, plateHeight);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(plateX, plateY, plateWidth, plateHeight);
      
      // Label Metal
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Kim loại: ${config.metalName} (Φ = ${config.metalWorkFunction} eV)`, width / 2, plateY + 40);

      // 2. Draw Incoming Light (Photons)
      if (config.intensity > 0) {
        const lightColor = wavelengthToColor(config.wavelength);
        const rayCount = Math.floor(config.intensity / 10) + 1;
        
        ctx.strokeStyle = lightColor;
        ctx.lineWidth = 4;
        
        for (let i = 0; i < rayCount; i++) {
          const x = plateX + (plateWidth / (rayCount + 1)) * (i + 1);
          const timeOffset = Date.now() / 100;
          
          ctx.beginPath();
          ctx.moveTo(x + 50, plateY - 150);
          // Wave effect
          for (let py = 0; py < 100; py += 5) {
            const px = x + 50 - py * 0.33 + Math.sin(py * 0.2 + timeOffset) * 5;
            ctx.lineTo(px, plateY - 150 + py);
          }
          ctx.stroke();
          
          // Arrow head
          ctx.beginPath();
          ctx.moveTo(x + 17, plateY - 50);
          ctx.lineTo(x + 10, plateY - 50);
          ctx.lineTo(x + 17, plateY - 60);
          ctx.stroke();
        }
      }

      // 3. Draw Electrons
      state.electrons.forEach(e => {
        const ex = width / 2 + e.x;
        const ey = plateY + e.y;
        
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${Math.min(1, e.life)})`; // Gold color
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fbbf24';
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 4. Energy Info
      ctx.fillStyle = config.wavelength < 400 ? '#7c3aed' : '#1e293b';
      ctx.textAlign = 'left';
      ctx.fillText(`Năng lượng Photon (E): ${state.photonEnergy.toFixed(2)} eV`, 20, 30);
      
      if (!state.isEmitting) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('E < Φ: Không đủ năng lượng để bứt electron', 20, 55);
      } else {
        const kmax = state.photonEnergy - config.metalWorkFunction;
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`E > Φ: Có bứt electron (Kmax = ${kmax.toFixed(2)} eV)`, 20, 55);
      }
    };

    engineRef.current.onUpdate = draw;
    engineRef.current.start();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, [engineRef]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
