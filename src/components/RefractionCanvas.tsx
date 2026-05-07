import { useEffect, useRef, useState, useCallback } from 'react';
import { RefractionEngine } from '../physics/RefractionEngine';
import type { RefractionState } from '../physics/RefractionEngine';

interface RefractionCanvasProps {
  engineRef: React.MutableRefObject<RefractionEngine | null>;
}

export function RefractionCanvas({ engineRef }: RefractionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayState, setDisplayState] = useState<RefractionState | null>(null);
  const isDragging = useRef(false);

  const draw = useCallback((state: RefractionState, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;      // interface centre x
    const IY = H / 2;      // y-position of the interface (boundary line)

    ctx.clearRect(0, 0, W, H);

    // ── Background: upper & lower media ──────────────────────────────────────
    // Upper medium (medium 1)
    const upperGrad = ctx.createLinearGradient(0, 0, 0, IY);
    upperGrad.addColorStop(0, '#0f1e3a');
    upperGrad.addColorStop(1, '#0d2a4a');
    ctx.fillStyle = upperGrad;
    ctx.fillRect(0, 0, W, IY);

    // Lower medium (medium 2) – color shifts based on refractive index
    const n2norm = Math.min(1, (state.n2 - 1) / 1.5); // 0→1 for n2=1→2.5
    const r2 = Math.round(10 + n2norm * 30);
    const g2 = Math.round(30 + n2norm * 15);
    const b2 = Math.round(60 + n2norm * 70);
    const lowerGrad = ctx.createLinearGradient(0, IY, 0, H);
    lowerGrad.addColorStop(0, `rgb(${r2},${g2},${b2})`);
    lowerGrad.addColorStop(1, `rgb(${Math.round(r2 * 0.7)},${Math.round(g2 * 0.7)},${Math.round(b2 * 0.7)})`);
    ctx.fillStyle = lowerGrad;
    ctx.fillRect(0, IY, W, H - IY);

    // Medium labels
    ctx.font = 'bold 13px Inter, system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.medium1Name}  (n₁ = ${state.n1.toFixed(3)})`, 18, 28);
    ctx.fillText(`${state.medium2Name}  (n₂ = ${state.n2.toFixed(3)})`, 18, IY + 22);

    // ── Interface line ────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(0, IY);
    ctx.lineTo(W, IY);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Normal line ───────────────────────────────────────────────────────────
    if (state.showNormal) {
      ctx.beginPath();
      ctx.moveTo(CX, IY - 180);
      ctx.lineTo(CX, IY + 180);
      ctx.strokeStyle = 'rgba(148,163,184,0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.font = '11px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Pháp tuyến', CX + 50, IY - 170);
    }

    // ── Wavefronts (optional) ─────────────────────────────────────────────────
    if (state.showWavefronts) {
      const iRad = (state.incidentAngleDeg * Math.PI) / 180;
      const wfSpacing = 30;
      const wfCount = 4;
      const perpAngle = iRad - Math.PI / 2; // perpendicular to the ray

      ctx.strokeStyle = 'rgba(251,191,36,0.25)';
      ctx.lineWidth = 1.5;
      for (let k = 1; k <= wfCount; k++) {
        const originX = CX - Math.sin(iRad) * (k * wfSpacing + 40);
        const originY = IY - Math.cos(iRad) * (k * wfSpacing + 40);
        const len = 80;
        ctx.beginPath();
        ctx.moveTo(originX + Math.cos(perpAngle) * len, originY + Math.sin(perpAngle) * len);
        ctx.lineTo(originX - Math.cos(perpAngle) * len, originY - Math.sin(perpAngle) * len);
        ctx.stroke();
      }

      if (!state.isTotalInternalReflection && state.refractedAngleDeg !== null) {
        const rRad = (state.refractedAngleDeg * Math.PI) / 180;
        const perpR = rRad + Math.PI / 2;
        const wfSpacingR = wfSpacing * (state.n1 / state.n2); // wavelength changes
        ctx.strokeStyle = 'rgba(52,211,153,0.25)';
        for (let k = 1; k <= wfCount; k++) {
          const originX = CX + Math.sin(rRad) * (k * wfSpacingR + 40);
          const originY = IY + Math.cos(rRad) * (k * wfSpacingR + 40);
          const len = 80;
          ctx.beginPath();
          ctx.moveTo(originX + Math.cos(perpR) * len, originY + Math.sin(perpR) * len);
          ctx.lineTo(originX - Math.cos(perpR) * len, originY - Math.sin(perpR) * len);
          ctx.stroke();
        }
      }
    }

    // ── Incident ray ──────────────────────────────────────────────────────────
    const iRad = (state.incidentAngleDeg * Math.PI) / 180;
    const rayLen = Math.max(W, H);

    // Incident ray: from upper-left toward CX,IY
    const incStartX = CX - Math.sin(iRad) * rayLen;
    const incStartY = IY - Math.cos(iRad) * rayLen;

    ctx.beginPath();
    ctx.moveTo(incStartX, incStartY);
    ctx.lineTo(CX, IY);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#facc15';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arrowhead on incident ray
    drawArrow(ctx, CX - Math.sin(iRad) * 90, IY - Math.cos(iRad) * 90, CX, IY, '#facc15');

    if (!state.isTotalInternalReflection && state.refractedAngleDeg !== null) {
      // ── Refracted ray ───────────────────────────────────────────────────────
      const rRad = (state.refractedAngleDeg * Math.PI) / 180;
      const refEndX = CX + Math.sin(rRad) * rayLen;
      const refEndY = IY + Math.cos(rRad) * rayLen;

      ctx.beginPath();
      ctx.moveTo(CX, IY);
      ctx.lineTo(refEndX, refEndY);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#34d399';
      ctx.stroke();
      ctx.shadowBlur = 0;

      drawArrow(ctx, CX, IY, CX + Math.sin(rRad) * 90, IY + Math.cos(rRad) * 90, '#34d399');
    } else {
      // ── Total internal reflection ──────────────────────────────────────────
      // Draw reflected ray (i_r = i_incident, stays in upper medium)
      const reflEndX = CX + Math.sin(iRad) * rayLen;
      const reflEndY = IY - Math.cos(iRad) * rayLen;

      ctx.beginPath();
      ctx.moveTo(CX, IY);
      ctx.lineTo(reflEndX, reflEndY);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#f87171';
      ctx.stroke();
      ctx.shadowBlur = 0;

      drawArrow(ctx, CX, IY, CX + Math.sin(iRad) * 90, IY - Math.cos(iRad) * 90, '#f87171');

      // TIR label
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 14px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#f87171';
      ctx.fillText('⚡ Phản xạ toàn phần!', CX, IY - 210);
      ctx.shadowBlur = 0;
    }

    // ── Angle arcs & labels ───────────────────────────────────────────────────
    if (state.showAngles) {
      const arcR = 70;

      // Incident angle arc (between normal-up and incident ray)
      ctx.beginPath();
      ctx.arc(CX, IY, arcR, -Math.PI / 2, -Math.PI / 2 + iRad, false);
      ctx.strokeStyle = 'rgba(250,204,21,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label θ₁
      const midI = -Math.PI / 2 + iRad / 2;
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 15px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`θ₁=${state.incidentAngleDeg.toFixed(1)}°`, CX + Math.cos(midI) * (arcR + 22), IY + Math.sin(midI) * (arcR + 22));

      if (!state.isTotalInternalReflection && state.refractedAngleDeg !== null) {
        const rRad = (state.refractedAngleDeg * Math.PI) / 180;

        ctx.beginPath();
        ctx.arc(CX, IY, arcR, Math.PI / 2 - rRad, Math.PI / 2, false);
        ctx.strokeStyle = 'rgba(52,211,153,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const midR = Math.PI / 2 - rRad / 2;
        ctx.fillStyle = '#34d399';
        ctx.fillText(`θ₂=${state.refractedAngleDeg.toFixed(1)}°`, CX + Math.cos(midR) * (arcR + 22), IY + Math.sin(midR) * (arcR + 22));
      }

      // Critical angle indicator
      if (state.criticalAngleDeg !== null) {
        const critRad = (state.criticalAngleDeg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(CX, IY);
        ctx.lineTo(CX - Math.sin(critRad) * 160, IY - Math.cos(critRad) * 160);
        ctx.strokeStyle = 'rgba(251,113,133,0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(251,113,133,0.8)';
        ctx.font = '11px Inter, system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(`θc=${state.criticalAngleDeg.toFixed(1)}°`, CX - Math.sin(critRad) * 168, IY - Math.cos(critRad) * 168 + 5);
      }
    }

    // ── Draggable laser source ────────────────────────────────────────────────
    const laserX = CX - Math.sin(iRad) * 200;
    const laserY = IY - Math.cos(iRad) * 200;

    ctx.save();
    ctx.translate(laserX, laserY);
    ctx.rotate(iRad - Math.PI / 2);

    // Body
    const bodyGrad = ctx.createLinearGradient(-14, -8, 14, 8);
    bodyGrad.addColorStop(0, '#475569');
    bodyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-22, -9, 44, 18, 4);
    ctx.fill();

    // Aperture / emitter
    ctx.fillStyle = '#facc15';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#facc15';
    ctx.fillRect(18, -3, 8, 6);
    ctx.shadowBlur = 0;

    // Grip lines
    for (let k = -1; k <= 1; k++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(k * 8, -9);
      ctx.lineTo(k * 8, 9);
      ctx.stroke();
    }
    ctx.restore();

    // Drag hint
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Kéo đèn laser để thay đổi góc', CX, H - 14);

    setDisplayState({ ...state });
  }, []);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new RefractionEngine();
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      if (engineRef.current) draw(engineRef.current.state, canvas);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const listener = (state: RefractionState) => draw(state, canvas);
    engineRef.current.addListener(listener);

    // Drag-to-rotate incident angle
    const getLaserPos = () => {
      const s = engineRef.current!.state;
      const iRad = (s.incidentAngleDeg * Math.PI) / 180;
      return {
        x: canvas.width / 2 - Math.sin(iRad) * 200,
        y: canvas.height / 2 - Math.cos(iRad) * 200,
      };
    };

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const lp = getLaserPos();
      if (Math.hypot(mx - lp.x, my - lp.y) < 36) isDragging.current = true;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !engineRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const IY = canvas.height / 2;
      const CX = canvas.width / 2;
      // Angle from normal (vertical) at the interface point
      const dx = CX - mx;
      const dy = IY - my;
      let angle = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI;
      angle = Math.max(0, Math.min(89, angle));
      engineRef.current.setIncidentAngle(angle);
    };

    const onMouseUp = () => { isDragging.current = false; };

    const onTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      const mx = t.clientX - rect.left;
      const my = t.clientY - rect.top;
      const lp = getLaserPos();
      if (Math.hypot(mx - lp.x, my - lp.y) < 40) isDragging.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !engineRef.current) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      const mx = t.clientX - rect.left;
      const my = t.clientY - rect.top;
      const IY = canvas.height / 2;
      const CX = canvas.width / 2;
      const dx = CX - mx;
      const dy = IY - my;
      let angle = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI;
      angle = Math.max(0, Math.min(89, angle));
      engineRef.current.setIncidentAngle(angle);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onMouseUp);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      engineRef.current?.removeListener(listener);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [engineRef, draw]);

  return (
    <div className="canvas-container" ref={containerRef} style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ cursor: 'crosshair', display: 'block', width: '100%', height: '100%' }} />

      {/* HUD overlay */}
      {displayState && (
        <div style={{
          position: 'absolute',
          bottom: 28,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          pointerEvents: 'none',
        }}>
          <StatBadge label="n₁ · sin θ₁" value={(displayState.n1 * Math.sin(displayState.incidentAngleDeg * Math.PI / 180)).toFixed(4)} color="#facc15" />
          {!displayState.isTotalInternalReflection && displayState.refractedAngleDeg !== null && (
            <StatBadge label="n₂ · sin θ₂" value={(displayState.n2 * Math.sin(displayState.refractedAngleDeg * Math.PI / 180)).toFixed(4)} color="#34d399" />
          )}
          {displayState.criticalAngleDeg !== null && (
            <StatBadge label="θc" value={`${displayState.criticalAngleDeg.toFixed(1)}°`} color="#f87171" />
          )}
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(15,23,42,0.75)',
      backdropFilter: 'blur(6px)',
      border: `1px solid ${color}44`,
      borderRadius: 8,
      padding: '4px 10px',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      fontSize: 12,
      color: '#cbd5e1',
    }}>
      <span style={{ color, fontWeight: 700 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// Helper: draw an arrowhead at (tx, ty) pointing FROM (fx,fy)→(tx,ty)
function drawArrow(ctx: CanvasRenderingContext2D, fx: number, fy: number, tx: number, ty: number, color: string) {
  const angle = Math.atan2(ty - fy, tx - fx);
  const size = 10;
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - size * Math.cos(angle - Math.PI / 6), ty - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(tx - size * Math.cos(angle + Math.PI / 6), ty - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
