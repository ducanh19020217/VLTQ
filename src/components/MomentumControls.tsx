import { Play, Pause, RotateCcw, TrendingUp, Settings } from 'lucide-react';
import { MomentumEngine } from '../physics/MomentumEngine';
import { useState, useEffect } from 'react';

interface MomentumControlsProps {
  engineRef: React.MutableRefObject<MomentumEngine | null>;
}

export function MomentumControls({ engineRef }: MomentumControlsProps) {
  const [m1, setM1] = useState(2);
  const [v1, setV1] = useState(50);
  const [m2, setM2] = useState(4);
  const [v2, setV2] = useState(-20);
  const [e, setE] = useState(1.0);
  const [isPaused, setIsPaused] = useState(true);

  // Live stats
  const [stats, setStats] = useState({ p1: 0, p2: 0, pTotal: 0, keTotal: 0 });

  useEffect(() => {
    if (!engineRef.current) return;
    
    const listener = (state: any) => {
      const obj1 = state.objects[0];
      const obj2 = state.objects[1];
      const p1 = obj1.m * obj1.v;
      const p2 = obj2.m * obj2.v;
      const ke1 = 0.5 * obj1.m * obj1.v * obj1.v;
      const ke2 = 0.5 * obj2.m * obj2.v * obj2.v;
      
      setStats({
        p1,
        p2,
        pTotal: p1 + p2,
        keTotal: ke1 + ke2
      });
      setIsPaused(state.isPaused);
    };

    engineRef.current.addListener(listener);
    return () => engineRef.current?.removeListener(listener);
  }, [engineRef.current]);

  const handleUpdate = (objIdx: number, key: string, val: number) => {
    if (!engineRef.current) return;
    if (key === 'm') {
        if (objIdx === 0) setM1(val); else setM2(val);
        engineRef.current.updateObject(objIdx, { m: val, radius: 25 + val * 2.5 });
    } else if (key === 'v') {
        if (objIdx === 0) setV1(val); else setV2(val);
        engineRef.current.updateObject(objIdx, { v: val });
    }
  };

  const handleToggle = () => {
    if (isPaused) engineRef.current?.play();
    else engineRef.current?.pause();
    setIsPaused(!isPaused);
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3 className="section-title">
          <TrendingUp size={18} /> Vật 1 (Đỏ)
        </h3>
        <div className="control-group">
          <label className="control-label">Khối lượng: <span className="value">{m1} kg</span></label>
          <input type="range" min="1" max="10" step="1" value={m1} onChange={(e) => handleUpdate(0, 'm', parseInt(e.target.value))} />
        </div>
        <div className="control-group">
          <label className="control-label">Vận tốc đầu: <span className="value">{v1} m/s</span></label>
          <input type="range" min="-100" max="100" step="5" value={v1} onChange={(e) => handleUpdate(0, 'v', parseInt(e.target.value))} />
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <TrendingUp size={18} /> Vật 2 (Xanh)
        </h3>
        <div className="control-group">
          <label className="control-label">Khối lượng: <span className="value">{m2} kg</span></label>
          <input type="range" min="1" max="10" step="1" value={m2} onChange={(e) => handleUpdate(1, 'm', parseInt(e.target.value))} />
        </div>
        <div className="control-group">
          <label className="control-label">Vận tốc đầu: <span className="value">{v2} m/s</span></label>
          <input type="range" min="-100" max="100" step="5" value={v2} onChange={(e) => handleUpdate(1, 'v', parseInt(e.target.value))} />
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Settings size={18} /> Loại va chạm
        </h3>
        <div className="control-group">
            <select 
                className="control-btn" 
                style={{ width: '100%', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                value={e} 
                onChange={(event) => {
                    const val = parseFloat(event.target.value);
                    setE(val);
                    engineRef.current?.setConfig({ e: val });
                }}
            >
                <option value="1.0">Va chạm Đàn hồi (e = 1.0)</option>
                <option value="0.5">Va chạm Một phần (e = 0.5)</option>
                <option value="0.0">Va chạm Mềm (e = 0.0)</option>
            </select>
        </div>
      </div>

      <div className="control-grid">
        <button className="control-btn primary" onClick={handleToggle}>
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          {isPaused ? 'Bắt đầu' : 'Tạm dừng'}
        </button>
        <button className="control-btn secondary" onClick={() => engineRef.current?.reset()}>
          <RotateCcw size={16} /> Đặt lại
        </button>
      </div>

      <div className="info-card" style={{ borderLeft: '4px solid #10b981' }}>
        <h4 style={{ color: '#10b981' }}>Thông số Động lượng</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
            <span>p1: <b>{stats.p1.toFixed(1)}</b></span>
            <span>p2: <b>{stats.p2.toFixed(1)}</b></span>
            <span style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '4px' }}>
                Tổng P: <b style={{ fontSize: '1rem' }}>{stats.pTotal.toFixed(1)} kg.m/s</b>
            </span>
            <span style={{ gridColumn: 'span 2', color: 'var(--text-secondary)' }}>
                Tổng Động năng: <b>{stats.keTotal.toFixed(0)} J</b>
            </span>
        </div>
      </div>
    </div>
  );
}
