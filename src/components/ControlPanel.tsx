import { useState, useEffect } from 'react';
import { PendulumEngine } from '../physics/PendulumEngine';
import { Play, Pause, RotateCcw, Settings2, Eye, EyeOff } from 'lucide-react';
import { ProblemSolver } from './ProblemSolver';

interface ControlPanelProps {
  engineRef: React.MutableRefObject<PendulumEngine | null>;
  showVectors: boolean;
  setShowVectors: (show: boolean) => void;
}

export function ControlPanel({ engineRef, showVectors, setShowVectors }: ControlPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  
  const [length, setLength] = useState(2);
  const [mass, setMass] = useState(1);
  const [gravity, setGravity] = useState(9.81);
  const [damping, setDamping] = useState(0.05);
  const [externalForce, setExternalForce] = useState(0);

  useEffect(() => {
    if (engineRef.current) {
      setLength(engineRef.current.config.length);
      setMass(engineRef.current.config.mass);
      setGravity(engineRef.current.config.gravity);
      setDamping(engineRef.current.config.damping);
      setExternalForce(engineRef.current.config.externalForce);
    }
  }, [engineRef]);

  const updateConfig = (key: string, value: number) => {
    if (engineRef.current) {
      engineRef.current.setConfig({ [key]: value });
      if (key === 'length') setLength(value);
      if (key === 'mass') setMass(value);
      if (key === 'gravity') setGravity(value);
      if (key === 'damping') setDamping(value);
      if (key === 'externalForce') setExternalForce(value);
      
      if (!engineRef.current.getIsRunning() && engineRef.current.onUpdate) {
         engineRef.current.onUpdate(engineRef.current.state, engineRef.current.config);
      }
    }
  };

  const togglePlay = () => {
    if (!engineRef.current) return;
    if (engineRef.current.getIsRunning()) {
      engineRef.current.pause();
      setIsRunning(false);
    } else {
      engineRef.current.play();
      setIsRunning(true);
    }
  };

  const reset = () => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setIsRunning(false);
  };

  return (
    <div className="control-panel">
      <h2 className="panel-title">Bảng điều khiển</h2>
      
      <div className="mode-toggle">
        <label>
          <input 
            type="checkbox" 
            checked={isAdvanced} 
            onChange={(e) => setIsAdvanced(e.target.checked)} 
          />
          <Settings2 size={16} />
          Chế độ Nâng cao (THPT)
        </label>
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>Chiều dài dây (m)</span>
          <span className="value">{length.toFixed(1)}</span>
        </div>
        <input type="range" min="0.5" max="3.5" step="0.1" value={length} onChange={(e) => updateConfig('length', parseFloat(e.target.value))} />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>Khối lượng vật (kg)</span>
          <span className="value">{mass.toFixed(1)}</span>
        </div>
        <input type="range" min="0.1" max="5" step="0.1" value={mass} onChange={(e) => updateConfig('mass', parseFloat(e.target.value))} />
      </div>

      <div className="control-group">
        <button 
          onClick={() => setShowVectors(!showVectors)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: `1px solid var(--border-color)`,
            padding: '0.5rem', borderRadius: '0.375rem', fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer', width: '100%'
          }}
        >
          {showVectors ? <><EyeOff size={14} /> Ẩn Véc-tơ (v, a, T)</> : <><Eye size={14} /> Hiện Véc-tơ (v, a, T)</>}
        </button>
      </div>

      {isAdvanced && (
        <>
          <div className="control-group">
            <div className="control-label">
              <span>Trọng lực (m/s²)</span>
              <span className="value">{gravity.toFixed(2)}</span>
            </div>
            <input type="range" min="1" max="25" step="0.1" value={gravity} onChange={(e) => updateConfig('gravity', parseFloat(e.target.value))} />
          </div>

          <div className="control-group">
            <div className="control-label">
              <span>Lực ngoại phương ngang (N)</span>
              <span className="value">{externalForce.toFixed(1)}</span>
            </div>
            <input type="range" min="-10" max="10" step="0.5" value={externalForce} onChange={(e) => updateConfig('externalForce', parseFloat(e.target.value))} />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Mô phỏng tác dụng của điện trường hoặc gió.
            </div>
          </div>

          <div className="control-group">
            <div className="control-label">
              <span>Hệ số ma sát</span>
              <span className="value">{damping.toFixed(3)}</span>
            </div>
            <input type="range" min="0" max="0.5" step="0.01" value={damping} onChange={(e) => updateConfig('damping', parseFloat(e.target.value))} />
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button className="primary-btn" onClick={togglePlay} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {isRunning ? <><Pause size={18} /> Tạm dừng</> : <><Play size={18} /> Chạy mô phỏng</>}
        </button>
        <button className="primary-btn" onClick={reset} style={{ flex: 1, backgroundColor: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RotateCcw size={18} />
        </button>
      </div>

      <ProblemSolver />
    </div>
  );
}
