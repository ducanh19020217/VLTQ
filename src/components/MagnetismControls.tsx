import { Compass, Zap, Eye, RotateCw, Info, Magnet as MagnetIcon } from 'lucide-react';
import { MagnetismEngine } from '../physics/MagnetismEngine';
import type { MagnetismState } from '../physics/MagnetismEngine';
import { useState, useEffect } from 'react';

interface MagnetismControlsProps {
  engineRef: React.MutableRefObject<MagnetismEngine | null>;
}

export function MagnetismControls({ engineRef }: MagnetismControlsProps) {
  const [strength, setStrength] = useState(5);
  const [angle, setAngle] = useState(0);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [showFilings, setShowFilings] = useState(true);
  const [showCompasses, setShowCompasses] = useState(true);

  useEffect(() => {
    if (!engineRef.current) return;
    
    const listener = (state: MagnetismState) => {
      const magnet = state.magnets[0];
      setStrength(magnet.strength);
      setAngle((magnet.angle * 180) / Math.PI);
      setShowFieldLines(state.showFieldLines);
      setShowFilings(state.showFilings);
      setShowCompasses(state.showCompasses);
    };

    engineRef.current.addListener(listener);
    return () => engineRef.current?.removeListener(listener);
  }, [engineRef.current]);

  const handleStrengthChange = (val: number) => {
    engineRef.current?.updateMagnet(0, { strength: val });
  };

  const handleRotate = (deg: number) => {
    engineRef.current?.updateMagnet(0, { angle: (deg * Math.PI) / 180 });
  };

  const togglePoles = () => {
    const newAngle = (angle + 180) % 360;
    handleRotate(newAngle);
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3 className="section-title">
          <MagnetIcon size={18} /> Thuộc tính nam châm
        </h3>
        <div className="control-group">
          <label className="control-label">Độ mạnh (Từ tính): <span className="value">{strength.toFixed(1)}</span></label>
          <input 
            type="range" min="1" max="15" step="0.5" 
            value={strength} 
            onChange={(e) => handleStrengthChange(parseFloat(e.target.value))} 
          />
        </div>
        <div className="control-group">
          <label className="control-label">Hướng (Xoay): <span className="value">{angle.toFixed(0)}°</span></label>
          <input 
            type="range" min="0" max="360" step="1" 
            value={angle} 
            onChange={(e) => handleRotate(parseInt(e.target.value))} 
          />
        </div>
        <button className="control-btn secondary w-full" onClick={togglePoles}>
            Đảo cực (Đổi chiều N-S)
        </button>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Eye size={18} /> Hiển thị trường
        </h3>
        <div className="control-grid">
            <label className="checkbox-label">
                <input 
                    type="checkbox" 
                    checked={showFieldLines} 
                    onChange={(e) => engineRef.current?.setVisibility('showFieldLines', e.target.checked)} 
                />
                Đường sức từ
            </label>
            <label className="checkbox-label">
                <input 
                    type="checkbox" 
                    checked={showFilings} 
                    onChange={(e) => engineRef.current?.setVisibility('showFilings', e.target.checked)} 
                />
                Mạt sắt
            </label>
            <label className="checkbox-label">
                <input 
                    type="checkbox" 
                    checked={showCompasses} 
                    onChange={(e) => engineRef.current?.setVisibility('showCompasses', e.target.checked)} 
                />
                La bàn thử
            </label>
        </div>
      </div>

      <div className="info-card">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} /> Kiến thức trọng tâm
        </h4>
        <ul style={{ fontSize: '0.85rem', lineHeight: '1.4', paddingLeft: '1.2rem', marginTop: '8px' }}>
            <li>Nam châm có 2 cực: <b>Bắc (N)</b> và <b>Nam (S)</b>.</li>
            <li>Đường sức từ đi ra từ cực <b>Bắc</b>, đi vào cực <b>Nam</b>.</li>
            <li>Nơi nào đường sức từ dày thì từ trường ở đó mạnh.</li>
            <li>Các cực cùng tên thì đẩy nhau, khác tên thì hút nhau.</li>
        </ul>
      </div>

      <div className="info-card" style={{ background: 'rgba(56, 189, 248, 0.1)', borderLeft: '4px solid #38bdf8' }}>
        <p style={{ fontSize: '0.8rem' }}>
            <b>Mẹo:</b> Bạn có thể dùng chuột để kéo nam châm di chuyển khắp màn hình!
        </p>
      </div>
    </div>
  );
}
