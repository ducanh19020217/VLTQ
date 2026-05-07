import { useEffect, useRef } from 'react';
import { OhmsLawEngine } from '../physics/OhmsLawEngine';
import type { OhmsLawState } from '../physics/OhmsLawEngine';

interface OhmsLawCanvasProps {
  engineRef: React.MutableRefObject<OhmsLawEngine | null>;
}

export function OhmsLawCanvas({ engineRef }: OhmsLawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (state: OhmsLawState) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const circuitW = Math.min(width * 0.6, 400);
      const circuitH = Math.min(height * 0.4, 250);

      const left = centerX - circuitW / 2;
      const right = centerX + circuitW / 2;
      const top = centerY - circuitH / 2;
      const bottom = centerY + circuitH / 2;

      // Draw Wires
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.closePath();
      ctx.stroke();

      // Draw Battery (Left side)
      const batteryH = 60;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(left - 10, centerY - batteryH / 2, 20, batteryH);
      
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ef4444'; // Red for Positive
      ctx.beginPath();
      ctx.moveTo(left - 20, centerY - 15);
      ctx.lineTo(left + 20, centerY - 15);
      ctx.stroke();
      
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3b82f6'; // Blue for Negative
      ctx.beginPath();
      ctx.moveTo(left - 10, centerY + 15);
      ctx.lineTo(left + 10, centerY + 15);
      ctx.stroke();

      // Draw Resistor (Right side)
      const resistorH = 80;
      const resistorW = 30;
      ctx.fillStyle = '#fde047'; // Yellowish resistor body
      ctx.fillRect(right - resistorW/2, centerY - resistorH/2, resistorW, resistorH);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(right - resistorW/2, centerY - resistorH/2, resistorW, resistorH);

      // Draw color bands on resistor
      const bands = ['#92400e', '#000', '#ef4444']; // Brown, Black, Red (example)
      bands.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(right - resistorW/2, centerY - resistorH/2 + 15 + i * 15, resistorW, 8);
      });

      // Draw Ammeter (Bottom side)
      const ammeterR = 25;
      const ammeterX = centerX;
      const ammeterY = bottom;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ammeterX, ammeterY, ammeterR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A', ammeterX, ammeterY);

      // Draw Electrons (Animation)
      const electronCount = 20;
      const totalLength = (circuitW + circuitH) * 2;
      
      for (let i = 0; i < electronCount; i++) {
        const offset = (state.electronPosition + i / electronCount) % 1;
        const distance = offset * totalLength;
        
        let ex, ey;
        if (distance < circuitW) { // Top
          ex = left + distance;
          ey = top;
        } else if (distance < circuitW + circuitH) { // Right
          ex = right;
          ey = top + (distance - circuitW);
        } else if (distance < circuitW * 2 + circuitH) { // Bottom
          ex = right - (distance - (circuitW + circuitH));
          ey = bottom;
        } else { // Left
          ex = left;
          ey = bottom - (distance - (circuitW * 2 + circuitH));
        }

        ctx.fillStyle = '#34d399'; // Electron color
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect for electrons
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#34d399';
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Labels
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`U = ${state.voltage.toFixed(1)} V`, left - 40, centerY);
      ctx.fillText(`R = ${state.resistance.toFixed(0)} Ω`, right + 45, centerY);
      ctx.fillText(`I = ${state.current.toFixed(2)} A`, centerX, bottom + 45);

      // Bulb (Optional: if we want to show power)
      // For now, let's just stick to the resistor.
    };

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (engineRef.current) {
        draw(engineRef.current.state);
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (!engineRef.current) {
      engineRef.current = new OhmsLawEngine();
    }

    engineRef.current.onUpdate = draw;
    engineRef.current.play(); // Start animation
    draw(engineRef.current.state);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      engineRef.current?.pause();
    };
  }, [engineRef]);

  return (
    <div className="canvas-container" ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
