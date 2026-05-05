import { useState, useEffect } from 'react';
import { RotateCcw, Calculator, Info } from 'lucide-react';
import { DensityEngine } from '../physics/DensityEngine';

interface DensityControlsProps {
  engineRef: React.MutableRefObject<DensityEngine | null>;
}

export function DensityControls({ engineRef }: DensityControlsProps) {
  const [customMass, setCustomMass] = useState(0.5); // kg
  const [customVolume, setCustomVolume] = useState(0.0002); // m3
  const [showDensity, setShowDensity] = useState<string | null>(null);

  const handleReset = () => {
    engineRef.current?.reset();
    setShowDensity(null);
  };

  const handleAddCustom = () => {
    engineRef.current?.setCustomObject(customMass, customVolume);
  };

  const calculateDensity = () => {
    const state = engineRef.current?.state;
    if (!state) return;

    // Focus on the object currently on scale or in water for the result
    const activeObj = state.objects.find(o => o.state !== 'bench');
    if (activeObj) {
        const d = activeObj.mass / activeObj.volume;
        setShowDensity(`${activeObj.name}: D = ${d.toFixed(0)} kg/m³`);
    } else {
        setShowDensity('Hãy đặt một vật lên cân hoặc vào bình nước!');
    }
  };

  return (
    <div className="control-panel">
      <div className="control-group">
        <h2 className="panel-title">Phòng thí nghiệm KLR</h2>
        
        <div className="param-item">
          <div className="param-label">
            <span>Khối lượng vật bí ẩn</span>
            <span className="param-value">{(customMass * 1000).toFixed(0)} g</span>
          </div>
          <input 
            type="range" min="0.1" max="2.0" step="0.1" 
            value={customMass} 
            onChange={(e) => setCustomMass(parseFloat(e.target.value))}
          />
        </div>

        <div className="param-item">
          <div className="param-label">
            <span>Thể tích vật bí ẩn</span>
            <span className="param-value">{(customVolume * 1000000).toFixed(0)} cm³</span>
          </div>
          <input 
            type="range" min="0.0001" max="0.001" step="0.0001" 
            value={customVolume} 
            onChange={(e) => setCustomVolume(parseFloat(e.target.value))}
          />
        </div>

        <button className="secondary-btn" onClick={handleAddCustom} style={{ marginTop: '0.5rem', width: '100%' }}>
          Thêm vật bí ẩn
        </button>
      </div>

      <div className="control-actions">
        <button className="primary-btn" onClick={calculateDensity}>
          <Calculator size={18} />
          Tính khối lượng riêng
        </button>
        
        <button className="secondary-btn" onClick={handleReset}>
          <RotateCcw size={18} />
          Làm mới lab
        </button>
      </div>

      {showDensity && (
        <div style={{ 
          marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--panel-bg)', borderRadius: '0.5rem', borderLeft: '4px solid #a855f7'
        }}>
          <div style={{ fontWeight: 'bold', color: '#a855f7' }}>Kết quả đo:</div>
          <div style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>{showDensity}</div>
        </div>
      )}

      <div className="theory-box">
        <h4>Công thức:</h4>
        <p className="formula">D = m / V</p>
        <p>Trong đó:</p>
        <ul>
          <li>m: Khối lượng (kg)</li>
          <li>V: Thể tích (m³)</li>
          <li>D: Khối lượng riêng (kg/m³)</li>
        </ul>
      </div>

      <div style={{ marginTop: 'auto', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem' }}>
        <Info size={16} color="#3b82f6" />
        <span style={{ fontSize: '0.75rem', color: '#1e40af' }}>
          Gợi ý: Thể tích vật chìm trong nước bằng thể tích nước dâng lên (V_vật = V_sau - V_đầu).
        </span>
      </div>
    </div>
  );
}
