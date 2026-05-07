import { Sun, RotateCw, Eye, Ruler, Info, Layers } from 'lucide-react';
import { LightReflectionEngine } from '../physics/LightReflectionEngine';
import { useState, useEffect } from 'react';

interface LightReflectionControlsProps {
  engineRef: React.MutableRefObject<LightReflectionEngine | null>;
}

export function LightReflectionControls({ engineRef }: LightReflectionControlsProps) {
  const [mirrorAngle, setMirrorAngle] = useState(0);
  const [isRough, setIsRough] = useState(false);
  const [showNormal, setShowNormal] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [showProtractor, setShowProtractor] = useState(false);

  useEffect(() => {
    if (!engineRef.current) return;
    
    const listener = (state: any) => {
      setMirrorAngle((state.mirror.angle * 180) / Math.PI);
      setIsRough(state.mirror.isRough);
      setShowNormal(state.showNormal);
      setShowAngles(state.showAngles);
      setShowProtractor(state.showProtractor);
    };

    engineRef.current.addListener(listener);
    return () => engineRef.current?.removeListener(listener);
  }, [engineRef.current]);

  const handleMirrorRotate = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    engineRef.current?.updateMirror(rad, isRough);
  };

  const handleModeChange = (rough: boolean) => {
    setIsRough(rough);
    engineRef.current?.updateMirror((mirrorAngle * Math.PI) / 180, rough);
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3 className="section-title">
          <RotateCw size={18} /> Góc gương
        </h3>
        <div className="control-group">
          <label className="control-label">Xoay gương: <span className="value">{mirrorAngle.toFixed(0)}°</span></label>
          <input 
            type="range" min="-90" max="90" step="1" 
            value={mirrorAngle} 
            onChange={(e) => handleMirrorRotate(parseInt(e.target.value))} 
          />
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Layers size={18} /> Bề mặt
        </h3>
        <div className="control-grid">
            <button 
                className={`control-btn ${!isRough ? 'primary' : 'secondary'}`}
                onClick={() => handleModeChange(false)}
            >
                Gương phẳng (Nhẵn)
            </button>
            <button 
                className={`control-btn ${isRough ? 'primary' : 'secondary'}`}
                onClick={() => handleModeChange(true)}
            >
                Mặt nhám (Gồ ghề)
            </button>
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Eye size={18} /> Hiển thị
        </h3>
        <div className="control-grid">
            <label className="checkbox-label">
                <input 
                    type="checkbox" 
                    checked={showNormal} 
                    onChange={(e) => engineRef.current?.setVisibility('showNormal', e.target.checked)} 
                />
                Pháp tuyến (n)
            </label>
            <label className="checkbox-label">
                <input 
                    type="checkbox" 
                    checked={showAngles} 
                    onChange={(e) => engineRef.current?.setVisibility('showAngles', e.target.checked)} 
                />
                Giá trị góc (i, i')
            </label>
            <label className="checkbox-label">
                <input 
                    type="checkbox" 
                    checked={showProtractor} 
                    onChange={(e) => engineRef.current?.setVisibility('showProtractor', e.target.checked)} 
                />
                Thước đo góc
            </label>
        </div>
      </div>

      <div className="info-card">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} /> Định luật phản xạ
        </h4>
        <p style={{ fontSize: '0.85rem', lineHeight: '1.4', marginTop: '8px' }}>
            1. Tia phản xạ nằm trong cùng mặt phẳng với tia tới và pháp tuyến của gương tại điểm tới.
            <br/><br/>
            2. Góc phản xạ luôn bằng góc tới (<b>i' = i</b>).
        </p>
      </div>

      <div className="info-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444' }}>
        <p style={{ fontSize: '0.8rem' }}>
            <b>Mẹo:</b> Bạn có thể dùng chuột kéo tia laser trên màn hình để thay đổi hướng chiếu sáng!
        </p>
      </div>
    </div>
  );
}
