import React, { useRef, useEffect } from 'react';

interface GraphProps {
  data: { t: number, val: number }[];
  color: string;
  label: string;
  min: number;
  max: number;
}

function MiniGraph({ data, color, label, min, max }: GraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (data.length < 2) return;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * H;
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
    }
    ctx.stroke();

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const range = max - min;
    const tMin = data[0].t;
    const tMax = data[data.length - 1].t;
    const tRange = tMax - tMin || 1;

    data.forEach((p, i) => {
        const x = ((p.t - tMin) / tRange) * W;
        const normalizedY = (p.val - min) / (range || 1);
        const y = H - normalizedY * H;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Fill area
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fillStyle = color + '22';
    ctx.fill();

  }, [data, color, min, max]);

  return (
    <div className="mini-graph-container" style={{ marginBottom: '12px' }}>
      <div className="graph-label" style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color }}>{data.length > 0 ? data[data.length-1].val.toFixed(2) : '0.00'}</span>
      </div>
      <canvas ref={canvasRef} width={300} height={60} style={{ width: '100%', height: '60px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }} />
    </div>
  );
}

export function CircularMotionGraphs({ history }: { history: any[] }) {
  if (!history || history.length === 0) return <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '20px' }}>Đang thu thập dữ liệu...</div>;

  return (
    <div className="graphs-container" style={{ marginTop: '16px' }}>
      <MiniGraph 
        data={history.map(h => ({ t: h.t, val: h.x }))} 
        color="#60a5fa" 
        label="Li độ X (m)" 
        min={-8} max={8} 
      />
      <MiniGraph 
        data={history.map(h => ({ t: h.t, val: h.y }))} 
        color="#34d399" 
        label="Li độ Y (m)" 
        min={-8} max={8} 
      />
      <MiniGraph 
        data={history.map(h => ({ t: h.t, val: h.k }))} 
        color="#f87171" 
        label="Động năng (J)" 
        min={0} max={Math.max(...history.map(h => h.k)) * 1.5 || 10} 
      />
    </div>
  );
}
