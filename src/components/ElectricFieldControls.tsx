import { Plus, Minus, Trash2, Eye, EyeOff, Grid, Zap } from 'lucide-react';
import { ElectricFieldEngine } from '../physics/ElectricFieldEngine';
import { useState } from 'react';

interface ElectricFieldControlsProps {
  engineRef: React.MutableRefObject<ElectricFieldEngine | null>;
  showFieldLines: boolean;
  setShowFieldLines: (val: boolean) => void;
  showPotential: boolean;
  setShowPotential: (val: boolean) => void;
  showVectors: boolean;
  setShowVectors: (val: boolean) => void;
}

export function ElectricFieldControls({
  engineRef,
  showFieldLines,
  setShowFieldLines,
  showPotential,
  setShowPotential,
  showVectors,
  setShowVectors
}: ElectricFieldControlsProps) {
  const [lineDensity, setLineDensity] = useState(8);

  const addCharge = (q: number) => {
    if (!engineRef.current) return;
    const x = 100 + Math.random() * 400;
    const y = 100 + Math.random() * 400;
    engineRef.current.addCharge(x, y, q);
    // Force re-render of canvas (usually handled by state in parent or trigger)
    window.dispatchEvent(new Event('resize')); 
  };

  const clearCharges = () => {
    if (!engineRef.current) return;
    engineRef.current.charges = [];
    window.dispatchEvent(new Event('resize'));
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3 className="section-title">
          <Zap size={18} /> Cấu hình điện tích
        </h3>
        <div className="control-grid">
          <button className="control-btn primary" onClick={() => addCharge(1)}>
            <Plus size={16} /> Thêm điện tích dương (+)
          </button>
          <button className="control-btn secondary" onClick={() => addCharge(-1)}>
            <Plus size={16} /> Thêm điện tích âm (-)
          </button>
          <button className="control-btn danger" onClick={clearCharges}>
            <Trash2 size={16} /> Xóa tất cả
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Eye size={18} /> Hiển thị
        </h3>
        <div className="control-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showFieldLines} 
              onChange={(e) => setShowFieldLines(e.target.checked)} 
            />
            Đường sức điện
          </label>
        </div>
        <div className="control-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showPotential} 
              onChange={(e) => setShowPotential(e.target.checked)} 
            />
            Bản đồ thế năng (Heatmap)
          </label>
        </div>
        <div className="control-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showVectors} 
              onChange={(e) => setShowVectors(e.target.checked)} 
            />
            Lưới vectơ cường độ
          </label>
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">Cài đặt mô phỏng</h3>
        <div className="control-group">
          <label>Mật độ đường sức: {lineDensity}</label>
          <input 
            type="range" 
            min="4" 
            max="20" 
            step="1"
            value={lineDensity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setLineDensity(val);
              if (engineRef.current) {
                engineRef.current.config.lineDensity = val;
                window.dispatchEvent(new Event('resize'));
              }
            }}
          />
        </div>
      </div>

      <div className="info-card">
        <h4>Kiến thức</h4>
        <p>
          - Đường sức điện luôn đi ra từ điện tích dương và đi vào điện tích âm.<br/>
          - Cường độ điện trường tỷ lệ thuận với độ lớn điện tích và tỷ lệ nghịch với bình phương khoảng cách.
        </p>
      </div>
    </div>
  );
}
