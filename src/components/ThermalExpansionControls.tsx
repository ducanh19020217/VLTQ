import { Flame, Thermometer, RotateCcw, Boxes, Info } from 'lucide-react';
import { ThermalExpansionEngine, MATERIALS } from '../physics/ThermalExpansionEngine';
import type { ThermalState } from '../physics/ThermalExpansionEngine';
import { useState, useEffect } from 'react';

interface ThermalExpansionControlsProps {
  engineRef: React.MutableRefObject<ThermalExpansionEngine | null>;
}

export function ThermalExpansionControls({ engineRef }: ThermalExpansionControlsProps) {
  const [materialKey, setMaterialKey] = useState('copper');
  const [heaterPower, setHeaterPower] = useState(0);
  const [temp, setTemp] = useState(25);
  const [deltaL, setDeltaL] = useState(0);

  useEffect(() => {
    if (!engineRef.current) return;
    
    const listener = (state: ThermalState) => {
      setMaterialKey(state.materialKey);
      setHeaterPower(state.heaterPower);
      setTemp(state.temp);
      setDeltaL((state.currentLength - state.initialLength) * 1000); // mm
    };

    engineRef.current.addListener(listener);
    return () => engineRef.current?.removeListener(listener);
  }, [engineRef.current]);

  const handleMaterialChange = (key: string) => {
    engineRef.current?.setMaterial(key);
  };

  const handleHeaterChange = (power: number) => {
    engineRef.current?.setHeaterPower(power);
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3 className="section-title">
          <Boxes size={18} /> Vật liệu
        </h3>
        <div className="material-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {Object.entries(MATERIALS).map(([key, mat]) => (
            <button 
              key={key}
              className={`control-btn ${materialKey === key ? 'primary' : 'secondary'}`}
              onClick={() => handleMaterialChange(key)}
              style={{ fontSize: '0.85rem', padding: '8px' }}
            >
              {mat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Flame size={18} /> Nguồn nhiệt (Đèn cồn)
        </h3>
        <div className="power-controls" style={{ display: 'flex', gap: '8px' }}>
            <button 
                className={`control-btn ${heaterPower === 0 ? 'primary' : 'secondary'}`}
                onClick={() => handleHeaterChange(0)}
                style={{ flex: 1 }}
            >
                Tắt
            </button>
            <button 
                className={`control-btn ${heaterPower === 0.5 ? 'primary' : 'secondary'}`}
                onClick={() => handleHeaterChange(0.5)}
                style={{ flex: 1 }}
            >
                Thấp
            </button>
            <button 
                className={`control-btn ${heaterPower === 1.0 ? 'primary' : 'secondary'}`}
                onClick={() => handleHeaterChange(1.0)}
                style={{ flex: 1 }}
            >
                Cao
            </button>
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Thermometer size={18} /> Trạng thái
        </h3>
        <div className="info-card">
            <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Nhiệt độ hiện tại:</span>
                <b style={{ color: temp > 100 ? '#ef4444' : 'var(--text-primary)' }}>{temp.toFixed(1)} °C</b>
            </div>
            <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Độ nở dài (ΔL):</span>
                <b style={{ color: '#10b981' }}>{deltaL.toFixed(3)} mm</b>
            </div>
        </div>
      </div>

      <button className="control-btn secondary w-full" onClick={() => engineRef.current?.reset()}>
        <RotateCcw size={16} /> Làm nguội / Đặt lại
      </button>

      <div className="info-card" style={{ marginTop: 'auto' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} /> Kiến thức bổ sung
        </h4>
        <p style={{ fontSize: '0.8rem', lineHeight: '1.4', marginTop: '8px' }}>
            Công thức nở dài: <b>ΔL = α.L₀.Δt</b>
            <br/><br/>
            - <b>α</b>: Hệ số nở dài (đặc trưng cho vật liệu).
            <br/>
            - Nhôm nở nhiều hơn đồng, đồng nở nhiều hơn thép ở cùng điều kiện.
        </p>
      </div>
    </div>
  );
}
