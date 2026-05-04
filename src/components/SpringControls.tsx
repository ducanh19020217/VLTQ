import { useState, useEffect } from 'react';
import { SpringEngine } from '../physics/SpringEngine';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SpringControlsProps {
  engineRef: React.MutableRefObject<SpringEngine | null>;
}

export function SpringControls({ engineRef }: SpringControlsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [stiffness, setStiffness] = useState(20);
  const [mass, setMass] = useState(1);
  const [damping, setDamping] = useState(0.1);

  useEffect(() => {
    if (engineRef.current) {
      setStiffness(engineRef.current.config.stiffness);
      setMass(engineRef.current.config.mass);
      setDamping(engineRef.current.config.damping);
    }
  }, [engineRef]);

  const updateConfig = (key: string, value: number) => {
    if (engineRef.current) {
      engineRef.current.setConfig({ [key]: value });
      if (key === 'stiffness') setStiffness(value);
      if (key === 'mass') setMass(value);
      if (key === 'damping') setDamping(value);
      
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
      <h2 className="panel-title">Thiết lập Lò xo</h2>

      <div className="control-group">
        <div className="control-label">
          <span>Độ cứng lò xo (k): <span className="value">{stiffness} N/m</span></span>
        </div>
        <input 
          type="range" 
          min="5" 
          max="100" 
          step="1" 
          value={stiffness}
          onChange={(e) => updateConfig('stiffness', parseInt(e.target.value))}
        />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>Khối lượng vật (m): <span className="value">{mass.toFixed(1)} kg</span></span>
        </div>
        <input 
          type="range" 
          min="0.1" 
          max="10" 
          step="0.1" 
          value={mass}
          onChange={(e) => updateConfig('mass', parseFloat(e.target.value))}
        />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>Hệ số ma sát: <span className="value">{damping.toFixed(2)}</span></span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.01" 
          value={damping}
          onChange={(e) => updateConfig('damping', parseFloat(e.target.value))}
        />
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Chu kỳ: T = {(2 * Math.PI * Math.sqrt(mass / stiffness)).toFixed(2)}s
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button className="primary-btn" onClick={togglePlay} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {isRunning ? <><Pause size={18} /> Tạm dừng</> : <><Play size={18} /> Chạy mô phỏng</>}
        </button>
        <button className="primary-btn" onClick={reset} style={{ flex: 1, backgroundColor: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
