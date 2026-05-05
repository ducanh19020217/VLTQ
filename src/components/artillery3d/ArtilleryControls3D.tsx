import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Crosshair, Wind } from 'lucide-react';
import { ArtilleryEngine3D } from '../../physics/ArtilleryEngine3D';

interface ArtilleryControlsProps {
  engineRef: React.MutableRefObject<ArtilleryEngine3D | null>;
}

export function ArtilleryControls3D({ engineRef }: ArtilleryControlsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isLanded, setIsLanded] = useState(false);
  const [config, setConfig] = useState({
    v0: 150,
    elevation: 45,
    azimuth: 0,
    gravity: 9.81,
    dragCoef: 0.05,
    mass: 40,
    windSpeed: 0,
    windDir: 90,
    mortarX: 0,
    mortarZ: 0,
    latitude: 21,
    temperature: 25,
    dispersion: 0.2,
  });
  
  const [stats, setStats] = useState<{
    impact: {x:number, y:number, z:number} | null,
    time: number
  }>({
    impact: null,
    time: 0
  });

  const [targetStats, setTargetStats] = useState({ total: 0, destroyed: 0 });
  const [targetsList, setTargetsList] = useState<any[]>([]);

  useEffect(() => {
    if (engineRef.current) {
      const c = engineRef.current.config;
      setConfig({ 
        v0: c.v0, 
        elevation: c.elevation,
        azimuth: c.azimuth,
        gravity: c.gravity,
        dragCoef: c.dragCoef,
        mass: c.mass,
        windSpeed: c.windSpeed,
        windDir: c.windDir,
        mortarX: c.mortarX,
        mortarZ: c.mortarZ,
        latitude: c.latitude,
        temperature: c.temperature,
        dispersion: c.dispersion
      });
      
      const listener = (state: any, conf: any) => {
        setIsRunning(engineRef.current?.getIsRunning() || false);

        if (state.targets) {
            setTargetStats({
                total: state.targets.length,
                destroyed: state.targets.filter((t: any) => t.isDestroyed).length
            });
            setTargetsList(state.targets);
        }
        
        if (state.impacts && state.impacts.length > 0) {
            setIsLanded(true);
            setStats({
                impact: state.impacts[state.impacts.length - 1],
                time: 0 // Time is now tracked per projectile, we can omit it or show distance
            });
        } else {
            setIsLanded(false);
            setStats({ impact: null, time: 0 });
        }
      };
      
      engineRef.current.addListener(listener);
      return () => {
          engineRef.current?.removeListener(listener);
      };
    }
  }, [engineRef]);

  const handleFire = () => {
    if (!engineRef.current) return;
    engineRef.current.play();
    // setIsRunning isn't strictly necessary since the listener updates it, but we can set it
    setIsRunning(true);
  };

  const handleReset = () => {
    engineRef.current?.reset();
    setIsRunning(false);
    setIsLanded(false);
    setStats({ impact: null, time: 0 });
  };
  
  const handleClear = () => {
    engineRef.current?.clearImpacts();
    setStats({ impact: null, time: 0 });
  };

  const updateParam = (key: keyof typeof config, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    engineRef.current?.setConfig(newConfig);
  };

  return (
    <div className="control-panel" style={{ maxHeight: '100%', overflowY: 'auto' }}>
      <div className="control-group">
        {/* ... params ... */}
        <h2 className="panel-title">Đạn đạo ngoài Nâng cao</h2>
        
        <h3 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>1. Vị trí Pháo</h3>
        <div className="param-item">
          <div className="param-label">
            <span>Tọa độ X (Đông-Tây)</span>
            <span className="param-value">{config.mortarX} m</span>
          </div>
          <input type="range" min="-1000" max="1000" step="10" value={config.mortarX} onChange={(e) => updateParam('mortarX', parseFloat(e.target.value))} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span>Tọa độ Z (Nam-Bắc)</span>
            <span className="param-value">{config.mortarZ} m</span>
          </div>
          <input type="range" min="-1000" max="1000" step="10" value={config.mortarZ} onChange={(e) => updateParam('mortarZ', parseFloat(e.target.value))} />
        </div>

        <h3 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>2. Thông số bắn</h3>
        <div className="param-item">
          <div className="param-label">
            <span>Góc tà - Elevation (°)</span>
            <span className="param-value">{config.elevation}°</span>
          </div>
          <input type="range" min="0" max="90" step="1" value={config.elevation} onChange={(e) => updateParam('elevation', parseFloat(e.target.value))} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span>Phương vị - Azimuth (°)</span>
            <span className="param-value">{config.azimuth}°</span>
          </div>
          <input type="range" min="0" max="360" step="1" value={config.azimuth} onChange={(e) => updateParam('azimuth', parseFloat(e.target.value))} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span>Liều phóng (v0)</span>
            <span className="param-value">{config.v0} m/s</span>
          </div>
          <input type="range" min="50" max="500" step="10" value={config.v0} onChange={(e) => updateParam('v0', parseFloat(e.target.value))} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span>Sai số phân tán (Dispersion)</span>
            <span className="param-value">{config.dispersion}</span>
          </div>
          <input type="range" min="0" max="2" step="0.1" value={config.dispersion} onChange={(e) => updateParam('dispersion', parseFloat(e.target.value))} />
        </div>

        <h3 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>3. Khí quyển & Coriolis</h3>
        <div className="param-item">
          <div className="param-label">
            <span>Vĩ độ (Latitude)</span>
            <span className="param-value">{config.latitude}° {config.latitude >= 0 ? 'Bắc' : 'Nam'}</span>
          </div>
          <input type="range" min="-90" max="90" step="1" value={config.latitude} onChange={(e) => updateParam('latitude', parseFloat(e.target.value))} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span>Nhiệt độ bề mặt (°C)</span>
            <span className="param-value">{config.temperature}°C</span>
          </div>
          <input type="range" min="-30" max="50" step="1" value={config.temperature} onChange={(e) => updateParam('temperature', parseFloat(e.target.value))} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wind size={14}/> Tốc độ gió</span>
            <span className="param-value">{config.windSpeed} m/s</span>
          </div>
          <input type="range" min="0" max="50" step="1" value={config.windSpeed} onChange={(e) => updateParam('windSpeed', parseFloat(e.target.value))} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span>Hướng gió thổi về (°)</span>
            <span className="param-value">{config.windDir}°</span>
          </div>
          <input type="range" min="0" max="360" step="1" value={config.windDir} onChange={(e) => updateParam('windDir', parseFloat(e.target.value))} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span>Khối lượng đạn (kg)</span>
            <span className="param-value">{config.mass} kg</span>
          </div>
          <input type="range" min="5" max="100" step="1" value={config.mass} onChange={(e) => updateParam('mass', parseFloat(e.target.value))} />
        </div>

      </div>

      <div className="control-actions">
        <button className="primary-btn" onClick={handleFire} style={{ background: '#ef4444', border: 'none' }}>
          <Crosshair size={18} />
          Khai hỏa liên tục
        </button>
        
        <button className="secondary-btn" onClick={() => engineRef.current?.spawnTargets(5)} style={{ background: '#10b981', color: 'white', border: 'none' }}>
          Tạo mục tiêu
        </button>
        
        <button className="secondary-btn" onClick={handleClear} style={{ background: '#3b82f6', color: 'white', border: 'none' }}>
          Xóa hố bom
        </button>

        <button className="secondary-btn" onClick={handleReset}>
          <RotateCcw size={18} />
          Đặt lại pháo
        </button>
      </div>

      {targetStats.total > 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
            Mục tiêu tiêu diệt: {targetStats.destroyed} / {targetStats.total}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {targetsList.map((t, i) => {
              const dx = t.x - config.mortarX;
              const dz = t.z - config.mortarZ;
              const dist = Math.sqrt(dx*dx + dz*dz);
              let az = Math.atan2(dx, -dz) * 180 / Math.PI;
              if (az < 0) az += 360;
              
              return (
                <div key={t.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    textDecoration: t.isDestroyed ? 'line-through' : 'none', 
                    opacity: t.isDestroyed ? 0.5 : 1,
                    fontFamily: 'monospace'
                }}>
                  <span>MT{i + 1}: X:{t.x.toFixed(0)} Z:{t.z.toFixed(0)}</span>
                  <span>D:{dist.toFixed(0)}m, Az:{az.toFixed(1)}°</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLanded && stats.impact && (
        <div style={{ 
          marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ fontWeight: 'bold', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
             <Crosshair size={16}/> Tọa độ chạm nổ (Phát cuối)
          </div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontFamily: 'monospace' }}>
            <span>X: {stats.impact.x.toFixed(1)} m</span>
            <span>Y: {stats.impact.y.toFixed(1)} m (Độ cao)</span>
            <span>Z: {stats.impact.z.toFixed(1)} m</span>
            <div className="divider" style={{ margin: '4px 0' }}></div>
            <span>Distance: {Math.sqrt(Math.pow(stats.impact.x - config.mortarX, 2) + Math.pow(stats.impact.z - config.mortarZ, 2)).toFixed(1)} m</span>
          </div>
        </div>
      )}
    </div>
  );
}
