import { useEffect, useRef } from 'react';
import { DensityEngine } from '../physics/DensityEngine';
import type { DensityState } from '../physics/DensityEngine';

interface DensityCanvasProps {
  engineRef: React.MutableRefObject<DensityEngine | null>;
}

export function DensityCanvas({ engineRef }: DensityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (state: DensityState) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Lab Wall (Background)
      const wallGradient = ctx.createLinearGradient(0, 0, 0, height * 0.8);
      wallGradient.addColorStop(0, '#f8fafc');
      wallGradient.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = wallGradient;
      ctx.fillRect(0, 0, width, height * 0.8);

      // 2. Draw Lab Bench (Floor) with perspective
      const benchGradient = ctx.createLinearGradient(0, height * 0.8, 0, height);
      benchGradient.addColorStop(0, '#cbd5e1');
      benchGradient.addColorStop(1, '#94a3b8');
      ctx.fillStyle = benchGradient;
      ctx.fillRect(0, height * 0.8, width, height * 0.2);
      
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.8);
      ctx.lineTo(width, height * 0.8);
      ctx.stroke();

      // 3. Draw Scale
      const scaleX = width * 0.25;
      const scaleY = height * 0.8 - 45;
      
      // Scale Base
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(scaleX - 70, scaleY, 140, 45);
      
      // Platter (Glass)
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(scaleX - 60, scaleY - 5, 120, 8);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(scaleX - 60, scaleY - 5, 120, 8);

      // LCD Display
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(scaleX - 45, scaleY + 10, 90, 25);
      
      ctx.fillStyle = '#34d399'; // Mint green LCD
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText((state.scaleReading * 1000).toFixed(1) + ' g', scaleX, scaleY + 28);

      // 4. Draw Beaker
      const beakerX = width * 0.7;
      const beakerY = height * 0.8 - 200;
      const beakerW = 140;
      const beakerH = 200;
      
      // Water
      const waterLevel = (state.beakerVolume / 0.01) * beakerH; // 10L max
      ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.fillRect(beakerX - beakerW/2, beakerY + beakerH - waterLevel, beakerW, waterLevel);
      
      // Dynamic Water Ripples
      if (state.objects.some(o => o.state === 'water')) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        const rippleY = beakerY + beakerH - waterLevel;
        const time = Date.now() / 300;
        ctx.moveTo(beakerX - beakerW/2, rippleY);
        for(let x = -beakerW/2; x <= beakerW/2; x += 4) {
            ctx.lineTo(beakerX + x, rippleY + Math.sin(x/8 + time) * 2.5);
        }
        ctx.stroke();
      }
      
      // Beaker glass with reflection
      const glassGradient = ctx.createLinearGradient(beakerX - beakerW/2, 0, beakerX + beakerW/2, 0);
      glassGradient.addColorStop(0, 'rgba(255,255,255,0.1)');
      glassGradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
      glassGradient.addColorStop(1, 'rgba(255,255,255,0.1)');
      
      ctx.fillStyle = glassGradient;
      ctx.fillRect(beakerX - beakerW/2, beakerY, beakerW, beakerH);

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(beakerX - beakerW/2, beakerY);
      ctx.lineTo(beakerX - beakerW/2, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW/2, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW/2, beakerY);
      ctx.stroke();

      // Better Graduations
      ctx.textAlign = 'right';
      ctx.font = 'bold 10px Arial';
      for (let i = 1; i <= 10; i++) {
        const y = beakerY + beakerH - (i / 10) * beakerH;
        ctx.strokeStyle = i % 2 === 0 ? '#475569' : '#94a3b8';
        ctx.lineWidth = i % 2 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(beakerX - beakerW/2, y);
        ctx.lineTo(beakerX - beakerW/2 + (i % 2 === 0 ? 15 : 10), y);
        ctx.stroke();
        if (i % 2 === 0) {
            ctx.fillStyle = '#475569';
            ctx.fillText(i + ' L', beakerX - beakerW/2 - 5, y + 4);
        }
      }

      // 5. Draw Objects
      state.objects.forEach(obj => {
        // Increase scale multiplier from 2 to 12 for better visibility
        const size = Math.pow(obj.volume * 1000000, 1/3) * 12; 
        
        ctx.save();
        ctx.translate(obj.position.x, obj.position.y);
        
        // Shadow if on bench
        if (obj.state === 'bench') {
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.ellipse(0, size/2, size/2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Beautiful Gradient for the object
        const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        gradient.addColorStop(0, obj.color);
        gradient.addColorStop(1, adjustColor(obj.color, -30)); // Darken slightly

        ctx.fillStyle = gradient;
        ctx.fillRect(-size/2, -size/2, size, size);
        
        // Highlight effect
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(-size/2, -size/2, size, size/4);

        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-size/2, -size/2, size, size);
        
        // Label with shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(obj.name, 0, 4);
        
        ctx.restore();
      });

      // 6. Instruction Overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(10, 10, 300, 40);
      ctx.fillStyle = '#475569';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Kéo thả vật vào cân hoặc bình nước để đo.', 20, 35);
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
      engineRef.current = new DensityEngine();
    }

    engineRef.current.onUpdate = draw;
    draw(engineRef.current.state);

    const handleStart = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let cx, cy;
      if (window.TouchEvent && e instanceof TouchEvent) {
        cx = e.touches[0].clientX; cy = e.touches[0].clientY;
      } else {
        cx = (e as MouseEvent).clientX; cy = (e as MouseEvent).clientY;
      }
      
      const mouseX = cx - rect.left;
      const mouseY = cy - rect.top;
      
      // Find object under cursor (top-most)
      const state = engineRef.current?.state;
      if (!state) return;

      for (let i = state.objects.length - 1; i >= 0; i--) {
        const obj = state.objects[i];
        const size = Math.pow(obj.volume * 1000000, 1/3) * 12; // Updated to 12
        if (Math.abs(mouseX - obj.position.x) < size/2 && Math.abs(mouseY - obj.position.y) < size/2) {
          draggingId.current = obj.id;
          dragOffset.current = { x: mouseX - obj.position.x, y: mouseY - obj.position.y };
          engineRef.current.moveObject(obj.id, obj.position.x, obj.position.y, canvas.width, canvas.height, true);
          break;
        }
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingId.current || !engineRef.current) return;
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      let cx, cy;
      if (window.TouchEvent && e instanceof TouchEvent) {
        cx = e.touches[0].clientX; cy = e.touches[0].clientY;
      } else {
        cx = (e as MouseEvent).clientX; cy = (e as MouseEvent).clientY;
      }
      
      const mouseX = cx - rect.left;
      const mouseY = cy - rect.top;
      
      engineRef.current.moveObject(
        draggingId.current, 
        mouseX - dragOffset.current.x, 
        mouseY - dragOffset.current.y,
        canvas.width,
        canvas.height,
        true
      );
    };

    const handleEnd = () => { 
      if (draggingId.current && engineRef.current) {
        const obj = engineRef.current.state.objects.find(o => o.id === draggingId.current);
        if (obj) {
            engineRef.current.moveObject(obj.id, obj.position.x, obj.position.y, canvas.width, canvas.height, false);
        }
      }
      draggingId.current = null; 
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
    };
  }, [engineRef]);

  // Helper to darken/lighten colors
  const adjustColor = (hex: string, amt: number) => {
    let usePound = false;
    if (hex[0] === "#") {
      hex = hex.slice(1);
      usePound = true;
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  };

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
