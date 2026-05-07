import React, { useEffect, useRef, useState } from 'react';
import { ThermalExpansionEngine, MATERIALS } from '../physics/ThermalExpansionEngine';
import type { ThermalState } from '../physics/ThermalExpansionEngine';

interface ThermalExpansionCanvasProps {
  engineRef: React.MutableRefObject<ThermalExpansionEngine | null>;
}

export function ThermalExpansionCanvas({ engineRef }: ThermalExpansionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [atoms, setAtoms] = useState<{x: number, y: number, phase: number}[]>([]);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ThermalExpansionEngine();
    }

    // Initialize atoms for microscopic view
    const initialAtoms = [];
    const rows = 4;
    const cols = 10;
    const spacing = 20;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        initialAtoms.push({
          x: c * spacing,
          y: r * spacing,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
    setAtoms(initialAtoms);

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

    const draw = (state: ThermalState) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const material = MATERIALS[state.materialKey];
      const centerY = height / 2;
      const startX = 100;
      
      // Draw background track/support
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(startX - 20, centerY + 40, width - startX, 10);
      ctx.fillRect(startX - 20, centerY - 60, 20, 120); // Clamp

      // Draw Rod
      // We scale expansion visually so it's visible (e.g. 1000x magnification)
      const visualScale = 2000;
      const initialVisualLength = state.initialLength * 800; // base length in pixels
      const expansion = (state.currentLength - state.initialLength) * visualScale;
      const currentVisualLength = initialVisualLength + expansion;

      // Glow effect based on temperature
      const tempFactor = Math.min((state.temp - 25) / 200, 1);
      const glowColor = `rgba(239, 68, 68, ${tempFactor * 0.5})`;
      
      ctx.shadowBlur = 20 * tempFactor;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
      
      ctx.fillStyle = material.color;
      ctx.fillRect(startX, centerY - 15, currentVisualLength, 30);
      
      // Rod detail (gradient)
      const grad = ctx.createLinearGradient(0, centerY - 15, 0, centerY + 15);
      grad.addColorStop(0, 'rgba(255,255,255,0.2)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(startX, centerY - 15, currentVisualLength, 30);

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw Burner
      const burnerX = startX + initialVisualLength / 2;
      const burnerY = centerY + 80;
      ctx.fillStyle = '#475569';
      ctx.fillRect(burnerX - 25, burnerY, 50, 40);
      
      if (state.heaterPower > 0) {
        // Draw Flame
        const flameHeight = 30 + Math.random() * 20 * state.heaterPower;
        const flameGrad = ctx.createRadialGradient(burnerX, burnerY - 10, 5, burnerX, burnerY - 10, 40);
        flameGrad.addColorStop(0, '#fde68a');
        flameGrad.addColorStop(0.5, '#f59e0b');
        flameGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(burnerX - 15, burnerY);
        ctx.quadraticCurveTo(burnerX, burnerY - flameHeight, burnerX + 15, burnerY);
        ctx.fill();
      }

      // Draw Measurement Marker (Magnified tip)
      const tipX = startX + currentVisualLength;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(tipX, centerY - 50);
      ctx.lineTo(tipX, centerY + 50);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`ΔL = ${((state.currentLength - state.initialLength) * 1000).toFixed(3)} mm`, tipX + 10, centerY - 60);

      // --- Microscopic View ---
      const microX = 150;
      const microY = 100;
      const microSize = 120;

      ctx.save();
      ctx.beginPath();
      ctx.arc(microX + microSize/2, microY + microSize/2, microSize/2, 0, Math.PI * 2);
      ctx.clip();
      
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(microX, microY, microSize, microSize);
      
      // Draw atoms
      const vibeAmp = 1 + tempFactor * 10;
      const time = performance.now() / 100;
      
      ctx.fillStyle = material.color;
      initialAtoms.forEach((atom, i) => {
        const dx = Math.sin(time + atom.phase) * vibeAmp;
        const dy = Math.cos(time + atom.phase) * vibeAmp;
        
        ctx.beginPath();
        ctx.arc(microX + 15 + atom.x + dx, microY + 15 + atom.y + dy, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      
      // Microscopic Circle Border
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(microX + microSize/2, microY + microSize/2, microSize/2, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Cấu trúc nguyên tử', microX + microSize/2, microY + microSize + 20);
    };

    engineRef.current.addListener(draw);

    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (engineRef.current) engineRef.current.step(Math.min(dt, 0.1));
      requestAnimationFrame(loop);
    };
    const animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
      engineRef.current?.removeListener(draw);
    };
  }, [engineRef]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} />
      <div className="canvas-overlay top-right">
        <div className="stats-badge">
            <span className="label">Nhiệt độ:</span>
            <span className="value">{engineRef.current?.state.temp.toFixed(1)} °C</span>
        </div>
      </div>
    </div>
  );
}
