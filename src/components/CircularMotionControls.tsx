import React, { useEffect, useState } from 'react';
import { Settings, Play, Pause, RotateCcw, Activity, ArrowRight, TrendingUp, BarChart3 } from 'lucide-react';
import { CircularMotionEngine } from '../physics/CircularMotionEngine';
import { CircularMotionGraphs } from './CircularMotionGraphs';

interface CircularMotionControlsProps {
  engineRef: React.MutableRefObject<CircularMotionEngine | null>;
  showVelocity: boolean;
  setShowVelocity: (val: boolean) => void;
  showAcceleration: boolean;
  setShowAcceleration: (val: boolean) => void;
}

export function CircularMotionControls({
  engineRef,
  showVelocity,
  setShowVelocity,
  showAcceleration,
  setShowAcceleration
}: CircularMotionControlsProps) {
  const [config, setConfig] = useState({
    radius: 5,
    omega: 2,
    mass: 1
  });
  
  const [stats, setStats] = useState({
    v: 0,
    ac: 0,
    fc: 0,
    T: 0,
    f: 0
  });

  const [history, setHistory] = useState<any[]>([]);
  const [showGraphs, setShowGraphs] = useState(true);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (engineRef.current) {
      const c = engineRef.current.config;
      setConfig({ radius: c.radius, omega: c.omega, mass: c.mass });
      setIsRunning(engineRef.current.getIsRunning());
      
      const listener = (state: any, config: any) => {
        const v = config.omega * config.radius;
        const ac = config.omega * config.omega * config.radius;
        const T = (2 * Math.PI) / config.omega;
        
        setStats({
          v,
          ac,
          fc: config.mass * ac,
          T,
          f: 1 / T
        });
        if (state.history) {
            setHistory([...state.history]);
        }
      };

      engineRef.current.addListener(listener);
      return () => engineRef.current?.removeListener(listener);
    }
  }, [engineRef]);

  const updateParam = (key: keyof typeof config, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    engineRef.current?.setConfig(newConfig);
  };

  const handleTogglePlay = () => {
    if (isRunning) {
      engineRef.current?.pause();
    } else {
      engineRef.current?.play();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    engineRef.current?.reset();
    setIsRunning(engineRef.current?.getIsRunning() || false);
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <Settings size={20} />
        <h2>Điều khiển Chuyển động tròn</h2>
      </div>

      <div className="params-grid">
        <div className="param-item">
          <div className="param-label">
            <span>Bán kính (r)</span>
            <span className="param-value">{config.radius} m</span>
          </div>
          <input 
            type="range" 
            min="1" max="8" step="0.1" 
            value={config.radius} 
            onChange={(e) => updateParam('radius', parseFloat(e.target.value))} 
          />
        </div>

        <div className="param-item">
          <div className="param-label">
            <span>Tốc độ góc (ω)</span>
            <span className="param-value">{config.omega.toFixed(2)} rad/s</span>
          </div>
          <input 
            type="range" 
            min="0.1" max="10" step="0.1" 
            value={config.omega} 
            onChange={(e) => updateParam('omega', parseFloat(e.target.value))} 
          />
        </div>

        <div className="param-item">
          <div className="param-label">
            <span>Khối lượng (m)</span>
            <span className="param-value">{config.mass} kg</span>
          </div>
          <input 
            type="range" 
            min="0.1" max="10" step="0.1" 
            value={config.mass} 
            onChange={(e) => updateParam('mass', parseFloat(e.target.value))} 
          />
        </div>
      </div>

      <div className="divider" />

      <div className="toggles-list">
        <label className="toggle-item">
          <input type="checkbox" checked={showVelocity} onChange={(e) => setShowVelocity(e.target.checked)} />
          <span className="toggle-label" style={{ color: '#ef4444' }}>Hiện Vector Vận tốc (v)</span>
        </label>
        <label className="toggle-item">
          <input type="checkbox" checked={showAcceleration} onChange={(e) => setShowAcceleration(e.target.checked)} />
          <span className="toggle-label" style={{ color: '#fbbf24' }}>Hiện Vector Gia tốc hướng tâm (an)</span>
        </label>
      </div>

      <div className="divider" />

      <div className="stats-panel">
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Tốc độ dài (v)</span>
            <span className="stat-value">{stats.v.toFixed(2)} m/s</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Gia tốc hướng tâm</span>
            <span className="stat-value">{stats.ac.toFixed(2)} m/s²</span>
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Chu kỳ (T)</span>
            <span className="stat-value">{stats.T.toFixed(2)} s</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tần số (f)</span>
            <span className="stat-value">{stats.f.toFixed(2)} Hz</span>
          </div>
        </div>
        <div className="stat-card full">
          <span className="stat-label">Lực hướng tâm (Fht)</span>
          <span className="stat-value highlight">{stats.fc.toFixed(2)} N</span>
        </div>
      </div>

      <div className="divider" />

      <div className="toggles-list">
        <label className="toggle-item">
          <input type="checkbox" checked={showGraphs} onChange={(e) => setShowGraphs(e.target.checked)} />
          <span className="toggle-label">Hiển thị Đồ thị & Năng lượng</span>
        </label>
      </div>

      {showGraphs && <CircularMotionGraphs history={history} />}

      <div className="control-actions">
        <button 
          className={`primary-btn ${isRunning ? 'pause' : 'play'}`}
          onClick={handleTogglePlay}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? 'Tạm dừng' : 'Bắt đầu'}
        </button>
        <button className="secondary-btn" onClick={handleReset}>
          <RotateCcw size={18} />
          Đặt lại
        </button>
      </div>
    </div>
  );
}
