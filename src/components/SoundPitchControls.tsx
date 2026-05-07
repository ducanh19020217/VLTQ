import { Music, Volume2, VolumeX, Activity, Info, Zap } from 'lucide-react';
import { SoundPitchEngine } from '../physics/SoundPitchEngine';
import { useState, useEffect } from 'react';

interface SoundPitchControlsProps {
  engineRef: React.MutableRefObject<SoundPitchEngine | null>;
}

const PRESETS = [
  { name: 'Đô (C4)', freq: 261.63 },
  { name: 'Mi (E4)', freq: 329.63 },
  { name: 'Son (G4)', freq: 392.00 },
  { name: 'La (A4)', freq: 440.00 },
  { name: 'Đô (C5)', freq: 523.25 },
];

export function SoundPitchControls({ engineRef }: SoundPitchControlsProps) {
  const [frequency, setFrequency] = useState(440);
  const [amplitude, setAmplitude] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!engineRef.current) return;
    
    const listener = (state: any) => {
      setFrequency(state.frequency);
      setAmplitude(state.amplitude);
      setIsPlaying(state.isPlaying);
    };

    engineRef.current.addListener(listener);
    return () => engineRef.current?.removeListener(listener);
  }, [engineRef.current]);

  const handleFreqChange = (val: number) => {
    engineRef.current?.setFrequency(val);
  };

  const handleAmpChange = (val: number) => {
    engineRef.current?.setAmplitude(val);
  };

  const handleTogglePlay = () => {
    engineRef.current?.togglePlay();
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <h3 className="section-title">
          <Activity size={18} /> Tần số (Độ cao)
        </h3>
        <div className="control-group">
          <label className="control-label">Tần số: <span className="value">{frequency.toFixed(0)} Hz</span></label>
          <input 
            type="range" min="100" max="2000" step="10" 
            value={frequency} 
            onChange={(e) => handleFreqChange(parseFloat(e.target.value))} 
          />
        </div>
        
        <div className="presets-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            {PRESETS.map(p => (
                <button 
                    key={p.name}
                    className={`control-btn ${frequency === p.freq ? 'primary' : 'secondary'}`}
                    onClick={() => handleFreqChange(p.freq)}
                    style={{ fontSize: '0.8rem', padding: '6px' }}
                >
                    {p.name}
                </button>
            ))}
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">
          <Zap size={18} /> Biên độ (Độ to)
        </h3>
        <div className="control-group">
          <label className="control-label">Âm lượng: <span className="value">{(amplitude * 100).toFixed(0)}%</span></label>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={amplitude} 
            onChange={(e) => handleAmpChange(parseFloat(e.target.value))} 
          />
        </div>
      </div>

      <div className="control-section">
        <button 
            className={`control-btn ${isPlaying ? 'danger' : 'primary'} w-full`}
            onClick={handleTogglePlay}
            style={{ height: '50px', fontSize: '1.1rem' }}
        >
            {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
            {isPlaying ? 'Tắt âm thanh' : 'Nghe âm thanh'}
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
            (Nhấn để cảm nhận sự thay đổi độ cao của âm)
        </p>
      </div>

      <div className="info-card" style={{ marginTop: 'auto' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} /> Đặc điểm của âm
        </h4>
        <p style={{ fontSize: '0.85rem', lineHeight: '1.4', marginTop: '8px' }}>
            - <b>Tần số</b> là số dao động trong 1 giây.
            <br/><br/>
            - <b>Âm bổng (cao)</b>: Khi vật dao động nhanh, tần số lớn.
            <br/>
            - <b>Âm trầm (thấp)</b>: Khi vật dao động chậm, tần số nhỏ.
        </p>
      </div>
    </div>
  );
}
