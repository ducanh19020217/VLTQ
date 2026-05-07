import React, { useEffect, useRef } from 'react';
import { SoundPitchEngine } from '../physics/SoundPitchEngine';
import type { SoundState } from '../physics/SoundPitchEngine';

interface SoundPitchCanvasProps {
  engineRef: React.MutableRefObject<SoundPitchEngine | null>;
}

export function SoundPitchCanvas({ engineRef }: SoundPitchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SoundPitchEngine();
    }

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

    const draw = (state: SoundState) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const margin = 50;
      const waveAreaHeight = height / 2 - margin;
      const stringY = height * 0.75;

      // Draw Grid for Oscilloscope
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height / 2);
        ctx.stroke();
      }
      for (let y = 0; y < height / 2; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Center Line
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, height / 4);
      ctx.lineTo(width, height / 4);
      ctx.stroke();

      // Draw Wave (Oscilloscope)
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#10b981';

      // f = frequency. Wavelength lambda = v / f. 
      // Visually, we want to see more cycles as frequency increases.
      const time = performance.now() / 1000;
      const visualFreq = state.frequency / 100; // scaling for visualization
      
      for (let x = 0; x < width; x++) {
        const y = height / 4 + Math.sin(x * 0.05 * visualFreq - time * 10) * (state.amplitude * 100);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Vibrating String
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, stringY);
      ctx.lineTo(width - margin, stringY);
      ctx.stroke();

      // String supports
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(margin - 10, stringY - 20, 10, 40);
      ctx.fillRect(width - margin, stringY - 20, 10, 40);

      // Vibrating part
      const stringVibe = Math.sin(time * state.frequency * 0.1) * (state.amplitude * 20);
      ctx.beginPath();
      ctx.moveTo(margin, stringY);
      ctx.quadraticCurveTo(width / 2, stringY + stringVibe, width - margin, stringY);
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Labels
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Màn hình Dao động ký (Oscilloscope)', width / 2, 20);
      ctx.fillText('Mô hình Dây đàn rung', width / 2, stringY + 60);
      
      if (state.frequency > 1000) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('Tần số cao -> Âm bổng (High pitch)', width / 2, height / 4 + 130);
      } else if (state.frequency < 200) {
        ctx.fillStyle = '#60a5fa';
        ctx.fillText('Tần số thấp -> Âm trầm (Low pitch)', width / 2, height / 4 + 130);
      }
    };

    engineRef.current.addListener(draw);

    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (engineRef.current) engineRef.current.update(Math.min(dt, 0.1));
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
            <span className="label">Tần số:</span>
            <span className="value">{engineRef.current?.state.frequency.toFixed(0)} Hz</span>
        </div>
      </div>
    </div>
  );
}

import type {  } from '../physics/SoundPitchEngine';
