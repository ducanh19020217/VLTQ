import { useEffect, useRef, useState, useCallback } from 'react';
import { ElectricFieldEngine } from '../physics/ElectricFieldEngine';
import type { Charge } from '../physics/ElectricFieldEngine';

interface ElectricFieldCanvasProps {
  engineRef: React.MutableRefObject<ElectricFieldEngine | null>;
  showFieldLines: boolean;
  showPotential: boolean;
  showVectors: boolean;
}

export function ElectricFieldCanvas({ 
  engineRef, 
  showFieldLines, 
  showPotential, 
  showVectors 
}: ElectricFieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [, setTick] = useState(0); // For forcing re-renders if needed

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ElectricFieldEngine();
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [engineRef]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Potential Heatmap
    if (showPotential) {
      const step = 10;
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          const v = engine.getPotential(x, y);
          // Map potential to color: Positive -> Red, Negative -> Blue
          const intensity = Math.min(Math.abs(v) / 2000, 1);
          if (v > 0) {
            ctx.fillStyle = `rgba(239, 68, 68, ${intensity * 0.4})`;
          } else {
            ctx.fillStyle = `rgba(59, 130, 246, ${intensity * 0.4})`;
          }
          ctx.fillRect(x, y, step, step);
        }
      }
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Vectors (Grid)
    if (showVectors) {
      const step = 40;
      for (let x = step / 2; x < width; x += step) {
        for (let y = step / 2; y < height; y += step) {
          const field = engine.getFieldValue(x, y);
          const mag = Math.sqrt(field.x * field.x + field.y * field.y);
          if (mag < 10) continue;

          const len = Math.min(mag / 200, step * 0.4);
          const angle = Math.atan2(field.y, field.x);

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Arrow head
          ctx.beginPath();
          ctx.arc(x + Math.cos(angle) * len, y + Math.sin(angle) * len, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fill();
        }
      }
    }

    // 3. Draw Field Lines
    if (showFieldLines) {
      ctx.lineWidth = 1.5;
      for (const charge of engine.charges) {
        if (charge.q > 0) {
          const numLines = engine.config.lineDensity * Math.abs(charge.q);
          for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const startX = charge.x + Math.cos(angle) * 10;
            const startY = charge.y + Math.sin(angle) * 10;
            
            const points = engine.traceFieldLine(startX, startY, 1);
            if (points.length < 2) continue;

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let j = 1; j < points.length; j++) {
              ctx.lineTo(points[j].x, points[j].y);
            }
            
            const gradient = ctx.createLinearGradient(points[0].x, points[0].y, points[points.length-1].x, points[points.length-1].y);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');
            
            ctx.strokeStyle = gradient;
            ctx.stroke();
          }
        }
      }
    }

    // 4. Draw Charges
    for (const charge of engine.charges) {
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = charge.q > 0 ? '#ef4444' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = selectedChargeId === charge.id ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = selectedChargeId === charge.id ? 3 : 2;
      ctx.stroke();

      // Label + or -
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(charge.q > 0 ? '+' : '-', charge.x, charge.y);
    }
  }, [engineRef, showFieldLines, showPotential, showVectors, selectedChargeId]);

  useEffect(() => {
    draw();
  }, [draw, showFieldLines, showPotential, showVectors, selectedChargeId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a charge
    const charge = engine.charges.find(c => {
      const dx = x - c.x;
      const dy = y - c.y;
      return dx * dx + dy * dy < 400; // 20px radius
    });

    if (charge) {
      setSelectedChargeId(charge.id);
      setIsDragging(true);
    } else {
      setSelectedChargeId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedChargeId || !engineRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    engineRef.current.updateCharge(selectedChargeId, { x, y });
    draw();
    setTick(t => t + 1); // Trigger update for controls if they rely on charge position
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      />
    </div>
  );
}
