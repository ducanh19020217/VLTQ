import { Zap, Play, Pause, RotateCcw, Eye, Settings, MoveUp } from 'lucide-react';
import { LorentzEngine } from '../physics/LorentzEngine';
import { useState, useEffect } from 'react';

interface LorentzControlsProps {
  engineRef: React.MutableRefObject<LorentzEngine | null>;
  showForce: boolean;
  setShowForce: (v: boolean) => void;
  showVelocity: boolean;
  setShowVelocity: (v: boolean) => void;
  showBField: boolean;
  setShowBField: (v: boolean) => void;
}

export function LorentzControls({
  engineRef,
  showForce,
  setShowForce,
  showVelocity,
  setShowVelocity,
  showBField,
  setShowBField
}: LorentzControlsProps) {
  const [q, setQ] = useState(1);
  const [m, setM] = useState(1);
  const [bY, setBY] = useState(5);
  const [vX, setVX] = useState(10);
  const [vY, setVY] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (engineRef.current) {
        setIsPaused(engineRef.current.state.isPaused);
    }
  }, [engineRef.current]);

  const updateEngine = (updates: any) => {
    if (!engineRef.current) return;
    
    if (updates.q !== undefined) {
        setQ(updates.q);
        engineRef.current.setConfig({ q: updates.q });
    }
    if (updates.m !== undefined) {
        setM(updates.m);
        engineRef.current.setConfig({ m: updates.m });
    }
    if (updates.bY !== undefined) {
        setBY(updates.bY);
        engineRef.current.setConfig({ bField: { x: 0, y: updates.bY, z: 0 } });
    }
    if (updates.vX !== undefined || updates.vY !== undefined) {
        const newVX = updates.vX ?? vX;
        const newVY = updates.vY ?? vY;
        setVX(newVX);
        setVY(newVY);
        engineRef.current.setConfig({ initialVel: { x: newVX, y: newVY, z: 0 } });
    }
  };

  const handleReset = () => {
    engineRef.current?.reset();
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    engineRef.current?.togglePause();
    setIsPaused(!isPaused);
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3 className="section-title">
          <Zap size={18} /> Thông số hạt
        </h3>
        
        <div className="control-group">
          <label className="control-label">
            Điện tích (q): <span className="value">{q > 0 ? `+${q}` : q} C</span>
          </label>
          <input 
            type="range" min="-5" max="5" step="1" 
            value={q} 
            onChange={(e) => updateEngine({ q: parseInt(e.target.value) })} 
          />
        </div>

        <div className="control-group">
          <label className="control-label">
            Khối lượng (m): <span className="value">{m} kg</span>
          </label>
          <input 
            type="range" min="0.5" max="5" step="0.5" 
            value={m} 
            onChange={(e) => updateEngine({ m: parseFloat(e.target.value) })} 
          />
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <MoveUp size={18} /> Vận tốc ban đầu
        </h3>
        <div className="control-group">
          <label className="control-label">v_x: <span className="value">{vX} m/s</span></label>
          <input type="range" min="0" max="20" step="1" value={vX} onChange={(e) => updateEngine({ vX: parseInt(e.target.value) })} />
        </div>
        <div className="control-group">
          <label className="control-label">v_y (dọc theo B): <span className="value">{vY} m/s</span></label>
          <input type="range" min="-10" max="10" step="1" value={vY} onChange={(e) => updateEngine({ vY: parseInt(e.target.value) })} />
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Settings size={18} /> Từ trường (B)
        </h3>
        <div className="control-group">
          <label className="control-label">Cường độ B_y: <span className="value">{bY} T</span></label>
          <input type="range" min="1" max="20" step="1" value={bY} onChange={(e) => updateEngine({ bY: parseInt(e.target.value) })} />
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Eye size={18} /> Hiển thị
        </h3>
        <div className="control-grid">
            <label className="checkbox-label">
                <input type="checkbox" checked={showVelocity} onChange={(e) => setShowVelocity(e.target.checked)} />
                Vectơ Vận tốc (Xanh lá)
            </label>
            <label className="checkbox-label">
                <input type="checkbox" checked={showForce} onChange={(e) => setShowForce(e.target.checked)} />
                Vectơ Lực Lo-ren-xơ (Đỏ)
            </label>
            <label className="checkbox-label">
                <input type="checkbox" checked={showBField} onChange={(e) => setShowBField(e.target.checked)} />
                Từ trường (Xanh dương)
            </label>
        </div>
      </div>

      <div className="control-grid">
        <button className="control-btn primary" onClick={handleTogglePause}>
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
        </button>
        <button className="control-btn secondary" onClick={handleReset}>
          <RotateCcw size={16} /> Đặt lại
        </button>
      </div>

      <div className="info-card">
        <h4>Quy tắc bàn tay phải</h4>
        <p>
          - Ngón cái chỉ chiều vận tốc (v).<br/>
          - Các ngón còn lại chỉ chiều từ trường (B).<br/>
          - Lòng bàn tay đẩy ra là chiều lực (F) với q {'>'} 0.
        </p>
      </div>
    </div>
  );
}
