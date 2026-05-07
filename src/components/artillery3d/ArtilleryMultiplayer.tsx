import React, { useState, useEffect } from 'react';
import { ArtilleryEngine3D } from '../../physics/ArtilleryEngine3D';
import { NetworkManager } from '../../physics/NetworkManager';
import { ArtilleryCanvas3D } from './ArtilleryCanvas3D';
import { ArtilleryControls3D } from './ArtilleryControls3D';
import { MultiplayerLobby } from './MultiplayerLobby';

interface Props {
  engineRef: React.MutableRefObject<ArtilleryEngine3D | null>;
}

export function ArtilleryMultiplayer({ engineRef }: Props) {
  const [network] = useState(() => new NetworkManager());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isConnected && engineRef.current) {
        if (!engineRef.current) engineRef.current = new ArtilleryEngine3D();
        
        const onNetworkEvent = (event: any) => {
            if (event.type === 'STATE_SYNC') {
                if (!network.isHost) {
                   const oldTrees = engineRef.current!.state.trees;
                   const oldVillages = engineRef.current!.state.villages;
                   
                   // Client syncs state
                   engineRef.current!.state = event.payload.state;
                   
                   // Restore static heavy data if omitted
                   if (!engineRef.current!.state.trees || engineRef.current!.state.trees.length === 0) {
                       engineRef.current!.state.trees = oldTrees;
                   }
                   if (!engineRef.current!.state.villages || engineRef.current!.state.villages.length === 0) {
                       engineRef.current!.state.villages = oldVillages;
                   }
                   
                   // Sync only environment config from Host to avoid overwriting Client's live aiming state!
                   engineRef.current!.config = {
                       ...engineRef.current!.config,
                       windSpeed: event.payload.config.windSpeed,
                       windDir: event.payload.config.windDir,
                       temperature: event.payload.config.temperature,
                       seed: event.payload.config.seed
                   };
                   
                   // Force a private notify (since we bypassed setter)
                   // @ts-ignore
                   engineRef.current!.notifyListeners();
                }
            } else if (event.type === 'SHOOT') {
                engineRef.current!.config.v0 = event.payload.v0;
                engineRef.current!.config.elevation = event.payload.elevation;
                engineRef.current!.config.azimuth = event.payload.azimuth;
                engineRef.current!.play();
            }
        };
        network.onEvent(onNetworkEvent);
        
        // Host sends state updates
        if (network.isHost) {
           let lastSync = 0;
           const onEngineUpdate = () => {
              const now = performance.now();
              if (now - lastSync < 33) return; // limit to ~30fps max
              lastSync = now;
              
              const state = engineRef.current!.state;
              
              // Optimization: Strip heavy data so network doesn't freeze!
              const syncState = {
                  ...state,
                  trees: [], // Don't send trees every frame
                  villages: [], // Don't send villages every frame
                  projectiles: state.projectiles.map(p => ({
                      ...p,
                      path: p.isLanded ? p.path : [] // Only send path array when it lands
                  }))
              };
              
              network.send({ type: 'STATE_SYNC', payload: { state: syncState, config: engineRef.current!.config } });
           };
           engineRef.current.addListener(onEngineUpdate);
           // Initial sync (force full sync for the first time by bypassing the optimization for a moment if needed, but client generates it via the same seed anyway)
           onEngineUpdate();
        }
    }
    
    return () => {
        // Cleanup if needed
    };
  }, [isConnected, network, engineRef]);

  if (!isConnected) {
    return <MultiplayerLobby network={network} onConnected={() => setIsConnected(true)} />;
  }

  return (
    <>
      <ArtilleryCanvas3D engineRef={engineRef} network={network} />
      <ArtilleryControls3D engineRef={engineRef} network={network} />
    </>
  );
}
