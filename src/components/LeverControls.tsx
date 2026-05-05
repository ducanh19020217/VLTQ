import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Scale, Eye, EyeOff } from 'lucide-react';
import { LeverEngine } from '../physics/LeverEngine';

interface LeverControlsProps {
  engineRef: React.MutableRefObject<LeverEngine | null>;
  showVectors: boolean;
  setShowVectors: (show: boolean) => void;
}

export function LeverControls({ engineRef, showVectors, setShowVectors }: LeverControlsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState({
    massLeft: 5,
    distLeft: 2,
    massRight: 5,
    distRight: 2
  });

  useEffect(() => {
    if (engineRef.current) {
      const currentConfig = engineRef.current.config;
      setConfig({
        massLeft: currentConfig.massLeft,
        distLeft: currentConfig.distLeft,
        massRight: currentConfig.massRight,
        distRight: currentConfig.distRight
      });
      setIsRunning(engineRef.current.getIsRunning());
    }
  }, [engineRef]);

  // Sync state with engine updates (for dragging or auto-balance)
  useEffect(() => {
    if (engineRef.current) {
      const originalUpdate = engineRef.current.onUpdate;
      engineRef.current.onUpdate = (state, conf) => {
        if (originalUpdate) originalUpdate(state, conf);
        setConfig({
          massLeft: conf.massLeft,
          distLeft: conf.distLeft,
          massRight: conf.massRight,
          distRight: conf.distRight
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
  };

  const handleAutoBalance = () => {
    engineRef.current?.autoBalance();
  };

  const updateParam = (key: keyof typeof config, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    engineRef.current?.setConfig(newConfig);
  };

  return (
    <div className="control-panel">
      <div className="control-group">
        <h2 className="panel-title">Thiết lập Đòn bẩy</h2>
        
        <div className="param-item">
          <div className="param-label">
            <span>Khối lượng trái (m1)</span>
            <span className="param-value">{config.massLeft} kg</span>
          </div>
          <input 
            type="range" min="1" max="20" step="0.5" 
            value={config.massLeft} 
            onChange={(e) => updateParam('massLeft', parseFloat(e.target.value))}
          />
        </div>

        <div className="param-item">
          <div className="param-label">
            <span>Khoảng cách trái (d1)</span>
            <span className="param-value">{config.distLeft.toFixed(1)} m</span>
          </div>
          <input 
            type="range" min="0.5" max="5" step="0.1" 
            value={config.distLeft} 
            onChange={(e) => updateParam('distLeft', parseFloat(e.target.value))}
          />
        </div>

        <div className="divider"></div>

        <div className="param-item">
          <div className="param-label">
            <span>Khối lượng phải (m2)</span>
            <span className="param-value">{config.massRight} kg</span>
          </div>
          <input 
            type="range" min="1" max="20" step="0.5" 
            value={config.massRight} 
            onChange={(e) => updateParam('massRight', parseFloat(e.target.value))}
          />
        </div>

        <div className="param-item">
          <div className="param-label">
            <span>Khoảng cách phải (d2)</span>
            <span className="param-value">{config.distRight.toFixed(1)} m</span>
          </div>
          <input 
            type="range" min="0.5" max="5" step="0.1" 
            value={config.distRight} 
            onChange={(e) => updateParam('distRight', parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="control-actions">
        <button className="primary-btn" onClick={handlePlayPause}>
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? 'Tạm dừng' : 'Bắt đầu'}
        </button>
        
        <button className="secondary-btn" onClick={handleReset}>
          <RotateCcw size={18} />
          Đặt lại
        </button>

        <button className="secondary-btn" onClick={handleAutoBalance} title="Tự động cân bằng">
          <Scale size={18} />
          Cân bằng
        </button>
      </div>

      <div className="visibility-options">
        <button 
          className={`toggle-btn ${showVectors ? 'active' : ''}`}
          onClick={() => setShowVectors(!showVectors)}
        >
          {showVectors ? <Eye size={16} /> : <EyeOff size={16} />}
          Hiển thị lực (P)
        </button>
      </div>

      <div className="theory-box">
        <h4>Điều kiện cân bằng:</h4>
        <p className="formula">F₁ × d₁ = F₂ × d₂</p>
        <p>Trong đó:</p>
        <ul>
          <li>F = m × g (Trọng lực)</li>
          <li>d: Cánh tay đòn</li>
        </ul>
      </div>
    </div>
  );
}
