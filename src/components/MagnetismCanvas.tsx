import React, { useEffect, useRef, useState } from 'react';
import { MagnetismEngine } from '../physics/MagnetismEngine';
import type { MagnetismState } from '../physics/MagnetismEngine';

interface MagnetismCanvasProps {
  engineRef: React.MutableRefObject<MagnetismEngine | null>;
}

export function MagnetismCanvas({ engineRef }: MagnetismCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new MagnetismEngine();
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

    // Static iron filings positions
    const filings: {x: number, y: number, angle: number}[] = [];
    for (let i = 0; i < 2000; i++) {
        filings.push({
            x: Math.random() * 1500,
            y: Math.random() * 1000,
            angle: 0
        });
    }

    const draw = (state: MagnetismState) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw Iron Filings
      if (state.showFilings) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        filings.forEach(f => {
            if (f.x > width || f.y > height) return;
            const b = engineRef.current!.getFieldAt(f.x, f.y);
            const angle = Math.atan2(b.y, b.x);
            
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(angle);
            ctx.fillRect(-2, -0.5, 4, 1);
            ctx.restore();
        });
      }

      // Draw Field Lines
      if (state.showFieldLines) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1.5;
        state.fieldLines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line[0].x, line[0].y);
            for (let i = 1; i < line.length; i++) {
                ctx.lineTo(line[i].x, line[i].y);
            }
            ctx.stroke();
            
            // Arrows
            if (line.length > 50) {
                const mid = line[Math.floor(line.length / 2)];
                const b = engineRef.current!.getFieldAt(mid.x, mid.y);
                const angle = Math.atan2(b.y, b.x);
                ctx.save();
                ctx.translate(mid.x, mid.y);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(-5, -5);
                ctx.lineTo(5, 0);
                ctx.lineTo(-5, 5);
                ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
                ctx.fill();
                ctx.restore();
            }
        });
      }

      // Draw Magnet
      state.magnets.forEach(m => {
          ctx.save();
          ctx.translate(m.center.x, m.center.y);
          ctx.rotate(m.angle);
          
          // South half (Blue)
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(-m.length / 2, -25, m.length / 2, 50);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('S', -m.length / 4, 8);
          
          // North half (Red)
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(0, -25, m.length / 2, 50);
          ctx.fillStyle = 'white';
          ctx.fillText('N', m.length / 4, 8);
          
          // Shadow/Detail
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 2;
          ctx.strokeRect(-m.length / 2, -25, m.length, 50);
          
          ctx.restore();
      });

      // Draw Compasses
      if (state.showCompasses) {
          const spacing = 120;
          for (let x = spacing/2; x < width; x += spacing) {
              for (let y = spacing/2; y < height; y += spacing) {
                  // Don't draw over magnet
                  const m = state.magnets[0];
                  if (Math.hypot(x - m.center.x, y - m.center.y) < m.length * 0.7) continue;

                  const b = engineRef.current!.getFieldAt(x, y);
                  const angle = Math.atan2(b.y, b.x);
                  
                  ctx.save();
                  ctx.translate(x, y);
                  ctx.rotate(angle);
                  
                  // Compass circle
                  ctx.beginPath();
                  ctx.arc(0, 0, 15, 0, Math.PI * 2);
                  ctx.strokeStyle = '#475569';
                  ctx.stroke();
                  
                  // Needle
                  ctx.beginPath();
                  ctx.moveTo(12, 0); ctx.lineTo(-12, 5); ctx.lineTo(-12, -5); ctx.closePath();
                  ctx.fillStyle = '#dc2626'; // North
                  ctx.fill();
                  
                  ctx.beginPath();
                  ctx.moveTo(-12, 0); ctx.lineTo(12, 5); ctx.lineTo(12, -5); ctx.closePath();
                  ctx.fillStyle = '#2563eb'; // South
                  ctx.fill();
                  
                  ctx.restore();
              }
          }
      }
    };

    engineRef.current.addListener(draw);

    const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const m = engineRef.current?.state.magnets[0];
        if (m && Math.hypot(x - m.center.x, y - m.center.y) < 100) {
            setIsDragging(true);
            setDragOffset({ x: x - m.center.x, y: y - m.center.y });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && engineRef.current) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            engineRef.current.updateMagnet(0, { center: { x: x - dragOffset.x, y: y - dragOffset.y } });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      engineRef.current?.removeListener(draw);
    };
  }, [engineRef, isDragging, dragOffset]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} style={{ cursor: isDragging ? 'grabbing' : 'grab' }} />
      <div className="canvas-overlay bottom-right">
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Dùng chuột để di chuyển nam châm</p>
      </div>
    </div>
  );
}

import type {  } from '../physics/MagnetismEngine';
