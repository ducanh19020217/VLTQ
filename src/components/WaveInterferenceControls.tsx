import { useState, useEffect } from 'react';
import { WaveInterferenceEngine } from '../physics/WaveInterferenceEngine';
import { Play, Pause, Waves, FileText } from 'lucide-react';

interface WaveInterferenceControlsProps {
  engineRef: React.MutableRefObject<WaveInterferenceEngine | null>;
  showDiagram: boolean;
  setShowDiagram: (val: boolean) => void;
}

export function WaveInterferenceControls({ engineRef, showDiagram, setShowDiagram }: WaveInterferenceControlsProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [freq, setFreq] = useState(2);
  const [wavelength, setWavelength] = useState(40);
  const [dist, setDist] = useState(100);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (engineRef.current) {
      setFreq(engineRef.current.config.frequency);
      setWavelength(engineRef.current.config.wavelength);
      setDist(engineRef.current.config.sourceDistance);
      setPhase(engineRef.current.config.phaseDiff);
    }
  }, [engineRef]);

  const update = (key: string, val: number) => {
    if (!engineRef.current) return;
    engineRef.current.setConfig({ [key]: val });
    if (key === 'frequency') setFreq(val);
    if (key === 'wavelength') setWavelength(val);
    if (key === 'sourceDistance') setDist(val);
    if (key === 'phaseDiff') setPhase(val);
  };

  const toggle = () => {
    if (!engineRef.current) return;
    if (engineRef.current.getIsRunning()) {
      engineRef.current.pause();
      setIsRunning(false);
    } else {
      engineRef.current.play();
      setIsRunning(true);
    }
  };

  return (
    <div className="control-panel">
      <h2 className="panel-title">Thiết lập Sóng</h2>

      {/* Mode Switcher - Tabs Style for visibility */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: 'var(--bg-color)', 
        padding: '0.25rem', 
        borderRadius: '0.5rem',
        marginBottom: '1.5rem',
        gap: '0.25rem'
      }}>
        <button 
          onClick={() => setShowDiagram(false)}
          style={{
            flex: 1, padding: '0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            backgroundColor: !showDiagram ? 'white' : 'transparent',
            boxShadow: !showDiagram ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            color: !showDiagram ? 'var(--accent-color)' : 'var(--text-secondary)',
            fontWeight: !showDiagram ? '600' : '400'
          }}
        >
          <Waves size={14} /> Sóng thực tế
        </button>
        <button 
          onClick={() => setShowDiagram(true)}
          style={{
            flex: 1, padding: '0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            backgroundColor: showDiagram ? 'white' : 'transparent',
            boxShadow: showDiagram ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            color: showDiagram ? 'var(--accent-color)' : 'var(--text-secondary)',
            fontWeight: showDiagram ? '600' : '400'
          }}
        >
          <FileText size={14} /> Sơ đồ giáo khoa
        </button>
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>Tần số (f): <span className="value">{freq.toFixed(1)} Hz</span></span>
        </div>
        <input type="range" min="0.5" max="5" step="0.1" value={freq} onChange={(e) => update('frequency', parseFloat(e.target.value))} />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>Bước sóng (λ): <span className="value">{wavelength} px</span></span>
        </div>
        <input type="range" min="10" max="100" step="1" value={wavelength} onChange={(e) => update('wavelength', parseInt(e.target.value))} />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>Khoảng cách nguồn (d): <span className="value">{dist} px</span></span>
        </div>
        <input type="range" min="20" max="300" step="1" value={dist} onChange={(e) => update('sourceDistance', parseInt(e.target.value))} />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>Độ lệch pha (Δφ): <span className="value">{(phase / Math.PI).toFixed(2)}π</span></span>
        </div>
        <input type="range" min="0" max={Math.PI * 2} step={Math.PI / 10} value={phase} onChange={(e) => update('phaseDiff', parseFloat(e.target.value))} />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button className="primary-btn" onClick={toggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {isRunning ? <><Pause size={18} /> Tạm dừng</> : <><Play size={18} /> Chạy tiếp</>}
        </button>
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: 'rgba(59, 130, 246, 0.05)', 
        borderRadius: '0.5rem',
        fontSize: '0.85rem'
      }}>
        <strong>Ghi chú:</strong> {showDiagram ? 'Vẽ các đường Hyperbol cực đại (vàng) và cực tiểu (đen) theo lý thuyết.' : 'Quan sát sự lan truyền và giao thoa của các dải màu xanh Neon.'}
      </div>
    </div>
  );
}
