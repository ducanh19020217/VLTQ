import React, { useState, useEffect } from 'react';
import { RefractionEngine, MEDIA } from '../physics/RefractionEngine';
import type { RefractionState } from '../physics/RefractionEngine';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { HelpCircle, Zap, Eye, Waves } from 'lucide-react';

interface RefractionControlsProps {
  engineRef: React.MutableRefObject<RefractionEngine | null>;
}

const mediaNames = Object.keys(MEDIA);

export function RefractionControls({ engineRef }: RefractionControlsProps) {
  const [state, setState] = useState<RefractionState | null>(null);

  useEffect(() => {
    if (!engineRef.current) return;
    const listener = (s: RefractionState) => setState({ ...s });
    engineRef.current.addListener(listener);
    return () => { engineRef.current?.removeListener(listener); };
  }, [engineRef]);

  if (!state) return null;

  const handleAngle = (e: React.ChangeEvent<HTMLInputElement>) => {
    engineRef.current?.setIncidentAngle(parseFloat(e.target.value));
  };

  const handleMedium = (which: 'medium1' | 'medium2', name: string) => {
    engineRef.current?.setMedium(which, name);
  };

  // θ₂ vs θ₁ curve data (Snell's law for current n1, n2)
  const snellData = Array.from({ length: 90 }, (_, i) => {
    const sinR = (state.n1 * Math.sin((i * Math.PI) / 180)) / state.n2;
    return {
      theta1: i,
      theta2: sinR <= 1 ? parseFloat(((Math.asin(sinR) * 180) / Math.PI).toFixed(2)) : null,
    };
  });

  const currentPoint = {
    theta1: state.incidentAngleDeg,
    theta2: state.refractedAngleDeg ?? null,
  };

  return (
    <aside className="control-panel">
      <h2 className="panel-title">Khúc xạ ánh sáng</h2>

      {/* Media selectors */}
      <div className="control-section">
        <h3 className="section-title"><span>Môi trường</span></h3>

        <div className="control-group">
          <label className="control-label">Môi trường 1 (trên)</label>
          <select
            value={state.medium1Name}
            onChange={e => handleMedium('medium1', e.target.value)}
            style={selectStyle}
          >
            {mediaNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <p style={nStyle}>n₁ = {state.n1.toFixed(3)}</p>
        </div>

        <div className="control-group">
          <label className="control-label">Môi trường 2 (dưới)</label>
          <select
            value={state.medium2Name}
            onChange={e => handleMedium('medium2', e.target.value)}
            style={selectStyle}
          >
            {mediaNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <p style={nStyle}>n₂ = {state.n2.toFixed(3)}</p>
        </div>
      </div>

      {/* Incident angle */}
      <div className="control-section">
        <h3 className="section-title">Góc tới</h3>
        <div className="control-group">
          <label className="control-label">
            θ₁ <span className="value">{state.incidentAngleDeg.toFixed(1)}°</span>
          </label>
          <input
            type="range" min="0" max="89" step="0.5"
            value={state.incidentAngleDeg}
            onChange={handleAngle}
          />
        </div>
      </div>

      {/* Results */}
      <div className="control-section">
        <h3 className="section-title"><Zap size={14} /> Kết quả</h3>
        <div style={resultGrid}>
          <ResultCard label="θ₁ (góc tới)" value={`${state.incidentAngleDeg.toFixed(1)}°`} color="#facc15" />
          <ResultCard
            label="θ₂ (góc khúc xạ)"
            value={state.isTotalInternalReflection ? 'Phản xạ toàn phần' : `${state.refractedAngleDeg?.toFixed(1)}°`}
            color={state.isTotalInternalReflection ? '#f87171' : '#34d399'}
          />
          {state.criticalAngleDeg !== null && (
            <ResultCard label="θc (góc giới hạn)" value={`${state.criticalAngleDeg.toFixed(1)}°`} color="#f87171" />
          )}
          <ResultCard
            label="n₁·sin θ₁"
            value={(state.n1 * Math.sin(state.incidentAngleDeg * Math.PI / 180)).toFixed(4)}
            color="#a78bfa"
          />
          {!state.isTotalInternalReflection && state.refractedAngleDeg !== null && (
            <ResultCard
              label="n₂·sin θ₂"
              value={(state.n2 * Math.sin(state.refractedAngleDeg * Math.PI / 180)).toFixed(4)}
              color="#a78bfa"
            />
          )}
        </div>
      </div>

      {/* θ₂ = f(θ₁) graph */}
      <div className="control-section">
        <h3 className="section-title">Đồ thị θ₂ theo θ₁</h3>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <LineChart data={snellData} margin={{ top: 6, right: 10, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="theta1" tickFormatter={v => `${v}°`} tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 90]} tickFormatter={v => `${v}°`} tick={{ fontSize: 9 }} />
              <Tooltip
                formatter={(v: number) => v !== null ? `${v.toFixed(1)}°` : 'TIR'}
                labelFormatter={v => `θ₁ = ${v}°`}
                contentStyle={{ fontSize: 10, backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)' }}
              />
              {state.criticalAngleDeg !== null && (
                <ReferenceLine x={state.criticalAngleDeg} stroke="#f87171" strokeDasharray="4 3" label={{ value: 'θc', fill: '#f87171', fontSize: 10 }} />
              )}
              <ReferenceLine x={state.incidentAngleDeg} stroke="#facc1560" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="theta2" stroke="#34d399" dot={false} strokeWidth={2} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 4 }}>
          Snell: n₁ sin θ₁ = n₂ sin θ₂
        </p>
      </div>

      {/* Visibility toggles */}
      <div className="control-section">
        <h3 className="section-title"><Eye size={14} /> Hiển thị</h3>
        <label className="checkbox-label">
          <input type="checkbox" checked={state.showNormal}
            onChange={e => engineRef.current?.setVisibility('showNormal', e.target.checked)} />
          Pháp tuyến
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={state.showAngles}
            onChange={e => engineRef.current?.setVisibility('showAngles', e.target.checked)} />
          Góc θ₁, θ₂
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={state.showWavefronts}
            onChange={e => engineRef.current?.setVisibility('showWavefronts', e.target.checked)} />
          Mặt sóng
        </label>
      </div>

      {/* Info card */}
      <div className="info-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <HelpCircle size={14} color="var(--accent-color)" />
          <h4 style={{ margin: 0 }}>Định luật Snell</h4>
        </div>
        <p>
          Khi ánh sáng truyền qua mặt phân cách giữa hai môi trường:
          <strong style={{ display: 'block', textAlign: 'center', margin: '6px 0', fontSize: '1.05rem' }}>
            n₁ · sin θ₁ = n₂ · sin θ₂
          </strong>
          Khi n₁ &gt; n₂ và θ₁ &gt; θc sẽ xảy ra <strong>phản xạ toàn phần</strong>.
        </p>
      </div>
    </aside>
  );
}

// ── Tiny sub-components ───────────────────────────────────────────────────────

function ResultCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-color)',
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 6,
      padding: '6px 10px',
    }}>
      <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color, margin: 0 }}>{value}</p>
    </div>
  );
}

const resultGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  marginTop: 4,
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-color)',
  color: 'var(--text-primary)',
  fontSize: 13,
  marginTop: 4,
};

const nStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-secondary)',
  marginTop: 4,
  fontFamily: 'monospace',
};
