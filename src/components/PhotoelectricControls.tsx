import { useState, useEffect } from 'react';
import { PhotoelectricEngine } from '../physics/PhotoelectricEngine';
import { Sun, Zap, Layers } from 'lucide-react';

interface PhotoelectricControlsProps {
  engineRef: React.MutableRefObject<PhotoelectricEngine | null>;
}

const METALS = [
  { name: 'Natri (Sodium)', workFunction: 2.28 },
  { name: 'Kẽm (Zinc)', workFunction: 4.33 },
  { name: 'Đồng (Copper)', workFunction: 4.70 },
  { name: 'Bạch kim (Platinum)', workFunction: 6.35 },
  { name: 'Canxi (Calcium)', workFunction: 2.87 }
];

export function PhotoelectricControls({ engineRef }: PhotoelectricControlsProps) {
  const [wavelength, setWavelength] = useState(400);
  const [intensity, setIntensity] = useState(50);
  const [metalIdx, setMetalIdx] = useState(0);

  useEffect(() => {
    if (engineRef.current) {
      setWavelength(engineRef.current.config.wavelength);
      setIntensity(engineRef.current.config.intensity);
    }
  }, [engineRef]);

  const updateWavelength = (val: number) => {
    setWavelength(val);
    engineRef.current?.setConfig({ wavelength: val });
  };

  const updateIntensity = (val: number) => {
    setIntensity(val);
    engineRef.current?.setConfig({ intensity: val });
  };

  const updateMetal = (idx: number) => {
    setMetalIdx(idx);
    const metal = METALS[idx];
    engineRef.current?.setConfig({ 
      metalName: metal.name, 
      metalWorkFunction: metal.workFunction 
    });
  };

  return (
    <div className="control-panel">
      <h2 className="panel-title">Thiết lập Quang điện</h2>

      <div className="control-group">
        <div className="control-label">
          <span><Sun size={14} inline /> Bước sóng (λ): <span className="value">{wavelength} nm</span></span>
        </div>
        <input 
          type="range" 
          min="100" 
          max="800" 
          step="1" 
          value={wavelength}
          onChange={(e) => updateWavelength(parseInt(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '0.2rem' }}>
          <span>Tử ngoại (UV)</span>
          <span>Khả kiến</span>
          <span>Hồng ngoại (IR)</span>
        </div>
      </div>

      <div className="control-group">
        <div className="control-label">
          <span><Zap size={14} inline /> Cường độ sáng: <span className="value">{intensity}%</span></span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="1" 
          value={intensity}
          onChange={(e) => updateIntensity(parseInt(e.target.value))}
        />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span><Layers size={14} inline /> Vật liệu kim loại</span>
        </div>
        <select 
          value={metalIdx} 
          onChange={(e) => updateMetal(parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--panel-bg)',
            color: 'var(--text-primary)'
          }}
        >
          {METALS.map((m, i) => (
            <option key={i} value={i}>{m.name} (Φ = {m.workFunction} eV)</option>
          ))}
        </select>
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: 'rgba(59, 130, 246, 0.05)', 
        borderRadius: '0.5rem',
        fontSize: '0.85rem',
        lineHeight: '1.4'
      }}>
        <strong>Giải thích:</strong> Khi bước sóng đủ nhỏ (năng lượng Photon lớn hơn công thoát của kim loại), các electron sẽ bị bứt ra khỏi bề mặt. Cường độ sáng càng mạnh thì số lượng electron bứt ra càng nhiều.
      </div>
    </div>
  );
}
