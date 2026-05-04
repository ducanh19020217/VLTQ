import { useEffect, useRef } from 'react';
import { WaveInterferenceEngine } from '../physics/WaveInterferenceEngine';
import type { WaveState, WaveConfig } from '../physics/WaveInterferenceEngine';

interface WaveInterferenceCanvasProps {
  engineRef: React.MutableRefObject<WaveInterferenceEngine | null>;
  showDiagram: boolean;
}

export function WaveInterferenceCanvas({ engineRef, showDiagram }: WaveInterferenceCanvasProps) {
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
      engineRef.current = new WaveInterferenceEngine();
    }

    const draw = (state: WaveState, config: WaveConfig) => {
      const { width, height } = canvas;
      const { time } = state;
      const { wavelength, sourceDistance, phaseDiff } = config;
      
      ctx.clearRect(0, 0, width, height);

      const s1x = width / 2 - sourceDistance / 2;
      const s1y = height / 2;
      const s2x = width / 2 + sourceDistance / 2;
      const s2y = height / 2;

      if (showDiagram) {
        // --- MODE: DIAGRAM (Textbook Style) ---
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        const drawWavefronts = (sx: number, sy: number, color1: string, color2: string) => {
          const speed = config.frequency * wavelength;
          const offset = Math.abs((time * speed) % wavelength);
          for (let r = offset; r < Math.max(width, height); r += wavelength) {
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.strokeStyle = color1;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            const r2 = r + wavelength / 2;
            if (r2 > 0) {
              ctx.beginPath(); ctx.arc(sx, sy, r2, 0, Math.PI * 2);
              ctx.strokeStyle = color2;
              ctx.setLineDash([2, 4]); ctx.lineWidth = 0.5; ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        };
        drawWavefronts(s1x, s1y, 'rgba(13, 148, 136, 0.5)', 'rgba(13, 148, 136, 0.15)');
        drawWavefronts(s2x, s2y, 'rgba(192, 38, 211, 0.5)', 'rgba(192, 38, 211, 0.15)');

        const c = sourceDistance / 2;
        const maxM = Math.floor(sourceDistance / wavelength);
        const centerX = width / 2;
        const centerY = height / 2;
        const sideLabelX = (side: number, a: number, bSq: number, y: number) => side * a * Math.sqrt(1 + (y**2) / bSq);

        const drawHyperbola = (m: number, isNode: boolean) => {
          const a = (m * wavelength) / 2;
          if (a >= c) return;
          const bSq = c**2 - a**2;
          for (let side = -1; side <= 1; side += 2) {
            if (side === 0 || (m === 0 && side === -1)) continue;
            ctx.beginPath();
            ctx.strokeStyle = isNode ? 'rgba(0,0,0,0.3)' : 'rgba(234, 179, 8, 0.7)';
            ctx.setLineDash(isNode ? [4, 4] : []);
            ctx.lineWidth = isNode ? 1 : 2;
            let first = true;
            for (let yOffset = -height / 2; yOffset <= height / 2; yOffset += 5) {
              const xOffset = sideLabelX(side, a, bSq, yOffset);
              if (first) { ctx.moveTo(centerX + xOffset, centerY + yOffset); first = false; }
              else { ctx.lineTo(centerX + xOffset, centerY + yOffset); }
            }
            ctx.stroke(); ctx.setLineDash([]);
            if (!isNode) {
              ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
              ctx.fillText(m === 0 ? 'CM' : `A${Math.abs(m)}`, centerX + sideLabelX(side, a, bSq, -height/2.2), centerY - height/2.2);
            }
          }
        };
        drawHyperbola(0, false);
        for (let m = 1; m <= maxM; m++) { drawHyperbola(m, false); drawHyperbola(m - 0.5, true); }
        if (maxM + 0.5 < sourceDistance/wavelength) drawHyperbola(maxM + 0.5, true);

      } else {
        // --- MODE: REALISTIC (Wave Field Style) ---
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, width, height);

        const k = (2 * Math.PI) / wavelength;
        const omega = 2 * Math.PI * config.frequency;
        const step = 4;

        for (let x = 0; x < width; x += step) {
          for (let y = 0; y < height; y += step) {
            const d1 = Math.sqrt((x - s1x)**2 + (y - s1y)**2);
            const d2 = Math.sqrt((x - s2x)**2 + (y - s2y)**2);
            const stationaryAmp = Math.abs(Math.cos(Math.PI * (d1 - d2) / wavelength + phaseDiff / 2));
            const val1 = Math.cos(k * d1 - omega * time);
            const val2 = Math.cos(k * d2 - omega * time + phaseDiff);
            const realTimeTotal = (val1 + val2) / 2;

            if (stationaryAmp > 0.8) {
              ctx.fillStyle = `rgba(34, 211, 238, ${(stationaryAmp - 0.8) * 0.6})`;
              ctx.fillRect(x, y, step, step);
            }
            const intensity = Math.abs(realTimeTotal);
            if (intensity > 0.1) {
              ctx.fillStyle = realTimeTotal > 0 ? `rgba(34, 211, 238, ${intensity * 0.7})` : `rgba(30, 58, 138, ${intensity * 0.7})`;
              ctx.fillRect(x, y, step, step);
            }
            if (stationaryAmp > 0.95 && realTimeTotal > 0.5) {
               ctx.fillStyle = `rgba(255, 255, 255, ${realTimeTotal * 0.5})`;
               ctx.fillRect(x, y, step, step);
            }
          }
        }
      }

      // --- Common Elements (Sources) ---
      const drawSource = (sx: number, sy: number, label: string, color: string) => {
        ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = showDiagram ? '#1e293b' : 'white';
        ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(label, sx, sy - 18);
      };
      drawSource(s1x, s1y, 'S1', '#0d9488');
      drawSource(s2x, s2y, 'S2', '#c026d2');
    };

    engineRef.current.onUpdate = draw;
    engineRef.current.play();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (engineRef.current) engineRef.current.pause();
    };
  }, [engineRef, showDiagram]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
