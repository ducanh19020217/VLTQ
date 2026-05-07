import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Crosshair, Wind, Shield } from 'lucide-react';
import { ArtilleryEngine3D } from '../../physics/ArtilleryEngine3D';
import type { PlayerState } from '../../physics/ArtilleryEngine3D';
import { NetworkManager } from '../../physics/NetworkManager';

interface ArtilleryControlsProps {
  engineRef: React.MutableRefObject<ArtilleryEngine3D | null>;
  network: NetworkManager;
}

export function ArtilleryControls3D({ engineRef, network }: ArtilleryControlsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isLanded, setIsLanded] = useState(false);
  const myPlayerId = network.isHost ? 1 : 2;

  const [config, setConfig] = useState({
    v0: 150,
    elevation: 45,
    azimuth: network.isHost ? 90 : 270, // Host faces East, Client faces West
    dispersion: 0.2,
  });
  
  const [gameState, setGameState] = useState<{
    players: PlayerState[],
    activePlayerId: 1 | 2,
    gameOver: boolean,
    winner: 1 | 2 | null,
    windSpeed: number,
    windDir: number
  }>({
    players: [],
    activePlayerId: 1,
    gameOver: false,
    winner: null,
    windSpeed: 0,
    windDir: 0
  });

  const isMyTurn = gameState.activePlayerId === myPlayerId && !gameState.gameOver;

  // Sync local config to engine if it's my turn, so Minimap and Canvas draw correctly
  useEffect(() => {
    if (engineRef.current && isMyTurn) {
        engineRef.current.setConfig(config);
    }
  }, [config, isMyTurn, engineRef]);

  useEffect(() => {
    if (engineRef.current) {
      
      const listener = (state: any, conf: any) => {
        setIsRunning(engineRef.current?.getIsRunning() || false);

        setGameState({
            players: state.players || [],
            activePlayerId: state.activePlayerId || 1,
            gameOver: state.gameOver || false,
            winner: state.winner || null,
            windSpeed: conf.windSpeed,
            windDir: conf.windDir
        });
        
        if (state.impacts && state.impacts.length > 0) {
            setIsLanded(true);
        } else {
            setIsLanded(false);
        }
      };
      
      engineRef.current.addListener(listener);
      // init call
      listener(engineRef.current.state, engineRef.current.config);
      
      return () => {
          engineRef.current?.removeListener(listener);
      };
    }
  }, [engineRef]);

  const handleFire = () => {
    if (!engineRef.current || !isMyTurn) return;
    
    // If we are host, we just play.
    // If we are client, we send SHOOT command.
    if (network.isHost) {
        engineRef.current.play();
    } else {
        network.send({
            type: 'SHOOT',
            payload: {
                v0: config.v0,
                elevation: config.elevation,
                azimuth: config.azimuth
            }
        });
    }
  };

  const handleReset = () => {
    if (!network.isHost) return; // Only host can reset
    engineRef.current?.reset();
  };
  
  const updateParam = (key: keyof typeof config, value: number) => {
    if (!isMyTurn) return;
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    // Locally update config so it draws correctly, network handles sync on shoot if client, 
    // or if host, we might want to sync config live. For now, client sends config on SHOOT.
    if (engineRef.current) {
        engineRef.current.setConfig(newConfig);
    }
  };

  const p1 = gameState.players.find(p => p.id === 1);
  const p2 = gameState.players.find(p => p.id === 2);

  return (
    <div className="control-panel" style={{ maxHeight: '100%', overflowY: 'auto' }}>
      
      {/* HEADER: PLAYER STATUS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <div style={{ textAlign: 'center', opacity: gameState.activePlayerId === 1 ? 1 : 0.5 }}>
              <div style={{ fontWeight: 'bold', color: myPlayerId === 1 ? '#34d399' : '#fff' }}>Player 1 (Host)</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: p1?.hp! > 30 ? '#10b981' : '#ef4444' }}>{p1?.hp || 0} HP</div>
          </div>
          <div style={{ textAlign: 'center', opacity: gameState.activePlayerId === 2 ? 1 : 0.5 }}>
              <div style={{ fontWeight: 'bold', color: myPlayerId === 2 ? '#34d399' : '#fff' }}>Player 2 (Client)</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: p2?.hp! > 30 ? '#10b981' : '#ef4444' }}>{p2?.hp || 0} HP</div>
          </div>
      </div>

      {gameState.gameOver && (
          <div style={{ padding: 16, background: '#ef4444', color: 'white', borderRadius: 8, textAlign: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>TRÒ CHƠI KẾT THÚC</h2>
              <p>Player {gameState.winner} giành chiến thắng!</p>
          </div>
      )}

      {!gameState.gameOver && (
          <div style={{ textAlign: 'center', padding: 8, marginBottom: 16, background: isMyTurn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isMyTurn ? '#10b981' : '#ef4444', borderRadius: 6, fontWeight: 'bold' }}>
              {isMyTurn ? "ĐẾN LƯỢT CỦA BẠN" : "CHỜ ĐỐI THỦ..."}
          </div>
      )}

      {/* WEATHER HUD */}
      <div className="control-group" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: 12, borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}><Wind size={16}/> Thời tiết hiện tại</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Gió: <strong>{gameState.windSpeed.toFixed(1)} m/s</strong></span>
            <span>Hướng: <strong>{gameState.windDir.toFixed(0)}°</strong></span>
        </div>
      </div>

      <div className="control-group" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Thông số nhắm bắn</h3>
        <div className="param-item">
          <div className="param-label">
            <span>Góc tà (Elevation)</span>
            <span className="param-value">{config.elevation}°</span>
          </div>
          <input type="range" min="0" max="90" step="1" value={config.elevation} onChange={(e) => updateParam('elevation', parseFloat(e.target.value))} disabled={!isMyTurn} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span>Phương vị (Azimuth)</span>
            <span className="param-value">{config.azimuth}°</span>
          </div>
          <input type="range" min="0" max="360" step="1" value={config.azimuth} onChange={(e) => updateParam('azimuth', parseFloat(e.target.value))} disabled={!isMyTurn} />
        </div>
        <div className="param-item">
          <div className="param-label">
            <span>Lực bắn (v0)</span>
            <span className="param-value">{config.v0} m/s</span>
          </div>
          <input type="range" min="50" max="500" step="10" value={config.v0} onChange={(e) => updateParam('v0', parseFloat(e.target.value))} disabled={!isMyTurn} />
        </div>
      </div>

      <div className="control-actions">
        <button 
            className="primary-btn" 
            onClick={handleFire} 
            disabled={!isMyTurn || isRunning}
            style={{ background: isMyTurn ? '#ef4444' : '#6b7280', border: 'none', width: '100%', padding: 16, fontSize: 18 }}
        >
          <Crosshair size={24} />
          {isRunning ? "ĐANG BẮN..." : "KHAI HỎA"}
        </button>
        
        {network.isHost && (
            <button className="secondary-btn" onClick={handleReset} style={{ marginTop: 12 }}>
                <RotateCcw size={18} /> Chơi Lại (Host)
            </button>
        )}
      </div>
    </div>
  );
}
