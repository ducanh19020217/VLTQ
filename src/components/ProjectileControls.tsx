import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, Map } from 'lucide-react';
import { ProjectileEngine } from '../physics/ProjectileEngine';

interface ProjectileControlsProps {
  engineRef: React.MutableRefObject<ProjectileEngine | null>;
  showVectors: boolean;
  setShowVectors: (show: boolean) => void;
  showPath: boolean;
  setShowPath: (show: boolean) => void;
}

export function ProjectileControls({ engineRef, showVectors, setShowVectors, showPath, setShowPath }: ProjectileControlsProps) {
  const [config, setConfig] = useState({
    initialHeight: 0,
    v0: 30,
    angle: 45,
    gravity: 9.81,
    drag: 0.1,
    mass: 1
  });
  const [stats, setStats] = useState({
    range: 0,
    time: 0,
    maxHeight: 0
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isLanded, setIsLanded] = useState(false);

  useEffect(() => {
    if (engineRef.current) {
      const c = engineRef.current.config;
      setConfig({ 
        initialHeight: c.initialHeight, 
        v0: c.v0, 
        angle: c.angle,
        gravity: c.gravity,
        drag: c.drag,
        mass: c.mass
      });
      
      const originalUpdate = engineRef.current.onUpdate;
      engineRef.current.onUpdate = (state, conf) => {
        if (originalUpdate) originalUpdate(state, conf);
        setIsRunning(engineRef.current?.getIsRunning() || false);
        setIsLanded(state.isLanded);
        
        // Calculate max height from path
        const maxH = Math.max(...state.path.map(p => p.y));
        
        setStats({
          range: state.x,
          time: state.t,
          maxHeight: maxH
        });
      };
    }
  }, [engineRef]);

  const handlePlayPause = () => {
    if (!engineRef.current) return;
    if (isRunning) {
      engineRef.current.pause();
    } else {
      engineRef.current.play();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    engineRef.current?.reset();
    setIsRunning(false);
    setIsLanded(false);
  };

  const updateParam = (key: keyof typeof config, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    engineRef.current?.setConfig(newConfig);
    setIsLanded(false);
  };

  const setEnv = (gravity: number, name: string) => {
    updateParam('gravity', gravity);
  };

  return (
    <div className="control-panel">
      <div className="control-group">
        <h2 className="panel-title">Thiết lập Ném xiên</h2>
        
        <div className="param-item">
          <div className="param-label">
            <span>Góc bắn (α)</span>
            <span className="param-value">{config.angle}°</span>
          </div>
          <input 
            type="range" min="0" max="90" step="1" 
            value={config.angle} 
            onChange={(e) => updateParam('angle', parseFloat(e.target.value))}
          />
        </div>

        <div className="param-item">
          <div className="param-label">
            <span>Vận tốc ban đầu (v0)</span>
            <span className="param-value">{config.v0} m/s</span>
          </div>
          <input 
            type="range" min="1" max="100" step="1" 
            value={config.v0} 
            onChange={(e) => updateParam('v0', parseFloat(e.target.value))}
          />
        </div>

        <div className="param-item">
          <div className="param-label">
            <span>Độ cao ban đầu (h)</span>
            <span className="param-value">{config.initialHeight} m</span>
          </div>
          <input 
            type="range" min="0" max="100" step="1" 
            value={config.initialHeight} 
            onChange={(e) => updateParam('initialHeight', parseFloat(e.target.value))}
          />
        </div>

        <div className="divider"></div>

        <div className="param-item">
          <div className="param-label">
            <span>Gia tốc trọng trường (g)</span>
            <span className="param-value">{config.gravity.toFixed(2)} m/s²</span>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
            <button className="mini-btn" onClick={() => setEnv(9.81, 'Trái Đất')}>T.Đất</button>
            <button className="mini-btn" onClick={() => setEnv(1.62, 'Mặt Trăng')}>M.Trăng</button>
            <button className="mini-btn" onClick={() => setEnv(3.71, 'S.Hỏa')}>S.Hỏa</button>
          </div>
          <input 
            type="range" min="0" max="30" step="0.1" 
            value={config.gravity} 
            onChange={(e) => updateParam('gravity', parseFloat(e.target.value))}
          />
        </div>

        <div className="param-item">
          <div className="param-label">
            <span>Lực cản không khí (k)</span>
            <span className="param-value">{config.drag.toFixed(2)}</span>
          </div>
          <input 
            type="range" min="0" max="2" step="0.01" 
            value={config.drag} 
            onChange={(e) => updateParam('drag', parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="control-actions">
        <button className="primary-btn" onClick={handlePlayPause} disabled={isLanded}>
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? 'Tạm dừng' : (isLanded ? 'Đã chạm đất' : 'Khai hỏa')}
        </button>
        
        <button className="secondary-btn" onClick={handleReset}>
          <RotateCcw size={18} />
          Đặt lại
        </button>
      </div>

      <div className="visibility-options">
        <button 
          className={`toggle-btn ${showVectors ? 'active' : ''}`}
          onClick={() => setShowVectors(!showVectors)}
        >
          {showVectors ? <Eye size={16} /> : <EyeOff size={16} />}
          Véc tơ v
        </button>
        <button 
          className={`toggle-btn ${showPath ? 'active' : ''}`}
          onClick={() => setShowPath(!showPath)}
        >
          {showPath ? <Map size={16} /> : <Map size={16} />}
          Quỹ đạo
        </button>
      </div>

      {isLanded && (
        <div style={{ 
          marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>Thông số thực tế:</div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <span>Tầm xa: <strong>{stats.range.toFixed(1)}m</strong></span>
            <span>Cao độ cực đại: <strong>{stats.maxHeight.toFixed(1)}m</strong></span>
            <span>Thời gian: <strong>{stats.time.toFixed(2)}s</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
