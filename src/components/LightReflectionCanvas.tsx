import React, { useEffect, useRef, useState } from 'react';
import { LightReflectionEngine } from '../physics/LightReflectionEngine';
import type { ReflectionState } from '../physics/LightReflectionEngine';

interface LightReflectionCanvasProps {
  engineRef: React.MutableRefObject<LightReflectionEngine | null>;
}

export function LightReflectionCanvas({ engineRef }: LightReflectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingLaser, setIsDraggingLaser] = useState(false);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new LightReflectionEngine();
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (engineRef.current) engineRef.current.calculate();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = (state: ReflectionState) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw Protractor
      if (state.showProtractor && state.reflectedRay.length > 0) {
        const hit = state.incidentRay[1];
        ctx.save();
        ctx.translate(hit.x, hit.y);
        ctx.rotate(state.mirror.angle - Math.PI / 2);
        
        ctx.beginPath();
        ctx.arc(0, 0, 150, Math.PI, 0);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        for (let a = 0; a <= 180; a += 10) {
            const rad = (a * Math.PI) / 180;
            const r1 = 140, r2 = 150;
            ctx.beginPath();
            ctx.moveTo(Math.cos(rad) * r1, -Math.sin(rad) * r1);
            ctx.lineTo(Math.cos(rad) * r2, -Math.sin(rad) * r2);
            ctx.stroke();
            if (a % 30 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = '10px Arial';
                ctx.fillText(`${Math.abs(90-a)}°`, Math.cos(rad) * 120 - 5, -Math.sin(rad) * 120);
            }
        }
        ctx.restore();
      }

      // Draw Normal Line
      if (state.showNormal && state.reflectedRay.length > 0) {
        const hit = state.incidentRay[1];
        const normalAngle = state.mirror.angle - Math.PI / 2;
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(hit.x - Math.cos(normalAngle) * 100, hit.y - Math.sin(normalAngle) * 100);
        ctx.lineTo(hit.x + Math.cos(normalAngle) * 100, hit.y + Math.sin(normalAngle) * 100);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Arial';
        ctx.fillText('Pháp tuyến (n)', hit.x + Math.cos(normalAngle) * 110 - 20, hit.y + Math.sin(normalAngle) * 110);
      }

      // Draw Mirror
      const { mirror } = state;
      const mCos = Math.cos(mirror.angle);
      const mSin = Math.sin(mirror.angle);
      const halfL = mirror.length / 2;
      const p1 = { x: mirror.center.x - mCos * halfL, y: mirror.center.y - mSin * halfL };
      const p2 = { x: mirror.center.x + mCos * halfL, y: mirror.center.y + mSin * halfL };

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.stroke();
      
      // Mirror surface glow
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Incident Ray
      if (state.incidentRay.length > 0) {
        ctx.beginPath();
        ctx.moveTo(state.incidentRay[0].x, state.incidentRay[0].y);
        ctx.lineTo(state.incidentRay[1].x, state.incidentRay[1].y);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ef4444';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw Reflected Rays
      state.reflectedRay.forEach(ray => {
        ctx.beginPath();
        ctx.moveTo(ray[0].x, ray[0].y);
        ctx.lineTo(ray[1].x, ray[1].y);
        ctx.strokeStyle = state.mirror.isRough ? 'rgba(239, 68, 68, 0.4)' : '#ef4444';
        ctx.lineWidth = state.mirror.isRough ? 1 : 3;
        ctx.stroke();
      });

      // Draw Laser Pointer
      const { laser } = state;
      ctx.save();
      ctx.translate(laser.origin.x, laser.origin.y);
      ctx.rotate(laser.angle);
      
      ctx.fillStyle = '#334155';
      ctx.fillRect(-20, -10, 40, 20);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(15, -2, 10, 4);
      ctx.restore();

      // Angles display
      if (state.showAngles && state.reflectedRay.length > 0) {
        const hit = state.incidentRay[1];
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`i = ${state.incidentAngle.toFixed(1)}°`, hit.x - 60, hit.y - 40);
        ctx.fillText(`i' = ${state.reflectedAngle.toFixed(1)}°`, hit.x + 20, hit.y - 40);
      }
    };

    engineRef.current.addListener(draw);

    const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const laser = engineRef.current?.state.laser;
        if (laser && Math.hypot(x - laser.origin.x, y - laser.origin.y) < 30) {
            setIsDraggingLaser(true);
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDraggingLaser && engineRef.current) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // For now, dragging changes position. Rotating will be via controls.
            // Or use distance to origin to determine rotation?
            // Let's do: mouse position sets the origin, and it always points towards the center of the mirror
            const mirror = engineRef.current.state.mirror;
            const dx = mirror.center.x - x;
            const dy = mirror.center.y - y;
            const angle = Math.atan2(dy, dx);
            engineRef.current.updateLaser({ x, y }, angle);
        }
    };

    const handleMouseUp = () => setIsDraggingLaser(false);

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
  }, [engineRef, isDraggingLaser]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} style={{ cursor: isDraggingLaser ? 'grabbing' : 'crosshair' }} />
      <div className="canvas-overlay bottom-left">
        <div className="stats-badge">
            <span className="label">Góc tới i:</span>
            <span className="value">{engineRef.current?.state.incidentAngle.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
}

import type {  } from '../physics/LightReflectionEngine'; // For type consistency
