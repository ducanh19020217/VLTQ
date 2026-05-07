import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, Trail, Sphere, Box, Cylinder, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { ArtilleryEngine3D } from '../../physics/ArtilleryEngine3D';
import type { ArtilleryState3D, ArtilleryConfig3D, ProjectileState, TargetState } from '../../physics/ArtilleryEngine3D';

// --- TERRAIN COMPONENT ---
function Terrain({ engineRef }: { engineRef: React.MutableRefObject<ArtilleryEngine3D | null> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    // Make terrain massive (5000x5000) for long range shots
    const geo = new THREE.PlaneGeometry(5000, 5000, 200, 200);
    geo.rotateX(-Math.PI / 2); // Lay flat
    
    // Apply engine's terrain height function
    const pos = geo.attributes.position;
    if (engineRef.current) {
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const y = engineRef.current.getTerrainHeight(x, z);
            pos.setY(i, y);
        }
    }
    geo.computeVertexNormals();
    return geo;
  }, [engineRef]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial 
        color="#4ade80" // Greenish
        wireframe={false}
        roughness={0.8}
        metalness={0.1}
      />
      {/* Grid helper for scale */}
      <gridHelper args={[5000, 500, 0x000000, 0x000000]} position={[0, 0.1, 0]} material-opacity={0.1} material-transparent />
    </mesh>
  );
}

// --- MORTAR COMPONENT ---
function Mortar({ config, engineRef }: { config: ArtilleryConfig3D, engineRef: React.MutableRefObject<ArtilleryEngine3D | null> }) {
  const azRad = (config.azimuth * Math.PI) / 180;
  const elRad = (config.elevation * Math.PI) / 180;
  
  // Calculate ground height at mortar position
  const mortarY = engineRef.current ? engineRef.current.getTerrainHeight(config.mortarX, config.mortarZ) : 0;

  return (
    <group position={[config.mortarX, mortarY + 0.5, config.mortarZ]} rotation={[0, -azRad, 0]}>
      {/* Base plate */}
      <Box args={[2, 0.2, 2]} position={[0, -0.4, 0]} castShadow>
        <meshStandardMaterial color="#334155" />
      </Box>
      
      {/* Rotating mount (Azimuth handled by parent group) */}
      <Cylinder args={[0.5, 0.5, 1]} position={[0, 0, 0]} castShadow>
           <meshStandardMaterial color="#475569" />
      </Cylinder>
      
      {/* Barrel (Elevation) */}
      {/* Note: Cylinder is Y-aligned. Rotate -90 on X to point North (Z-) at el=0. */}
      <group rotation={[elRad - Math.PI / 2, 0, 0]}>
         <Cylinder args={[0.3, 0.3, 4]} position={[0, 2, 0]} castShadow>
            <meshStandardMaterial color="#1e293b" />
         </Cylinder>
      </group>
    </group>
  );
}

// --- PROJECTILE COMPONENT ---
function Projectile({ projectile }: { projectile: ProjectileState }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (ref.current && projectile) {
      ref.current.position.set(projectile.x, projectile.y, projectile.z);
      ref.current.visible = projectile.t > 0 && !projectile.isLanded;
    }
  });

  return (
    <group>
        <Trail
            width={2}
            length={200}
            color="#ef4444"
            attenuation={(t) => t * t}
        >
            <Sphere ref={ref} args={[0.4, 16, 16]} castShadow>
                <meshStandardMaterial color="#ef4444" emissive="#991b1b" />
            </Sphere>
        </Trail>
        
        {/* Render static path for this projectile if it is landed */}
        {projectile.isLanded && projectile.path.length > 1 && (
            <Line
                points={projectile.path.map(p => new THREE.Vector3(p.x, p.y, p.z))}
                color="#3b82f6"
                lineWidth={2}
                transparent
                opacity={0.5}
            />
        )}
    </group>
  );
}

// --- IMPACT MARKER COMPONENT ---
function ImpactMarkers({ impacts }: { impacts: {x:number, y:number, z:number}[] }) {
    if (!impacts || impacts.length === 0) return null;
    
    return (
        <>
            {impacts.map((impactPos, index) => (
                <mesh key={index} position={[impactPos.x, impactPos.y, impactPos.z]}>
                    <ringGeometry args={[0.5, 2, 32]} />
                    <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.8} />
                    <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[0.5, 2, 32]} />
                        <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.8} />
                    </mesh>
                    
                    {/* Add a blast mark on the ground */}
                    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
                        <circleGeometry args={[1.5, 16]} />
                        <meshBasicMaterial color="#1c1917" transparent opacity={0.6} />
                    </mesh>
                </mesh>
            ))}
        </>
    );
}

// --- TARGETS COMPONENT ---
function Targets({ targets }: { targets: TargetState[] }) {
    if (!targets || targets.length === 0) return null;
    return (
        <>
            {targets.map(t => (
                <group key={t.id} position={[t.x, t.y, t.z]}>
                    {t.isDestroyed ? (
                        <mesh position={[0, 1, 0]}>
                            <boxGeometry args={[4, 2, 4]} />
                            <meshStandardMaterial color="#1c1917" roughness={0.9} />
                        </mesh>
                    ) : (
                        <mesh position={[0, 2, 0]} castShadow>
                            <boxGeometry args={[4, 4, 4]} />
                            <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.2} />
                            {/* Simple marker on top */}
                            <mesh position={[0, 4, 0]}>
                                <coneGeometry args={[1, 2, 4]} />
                                <meshStandardMaterial color="#ef4444" />
                            </mesh>
                        </mesh>
                    )}
                </group>
            ))}
        </>
    );
}

// --- SCENERY COMPONENT ---
function Scenery({ engineRef }: { engineRef: React.MutableRefObject<ArtilleryEngine3D | null> }) {
    const trunkRef = useRef<THREE.InstancedMesh>(null);
    const leavesRef = useRef<THREE.InstancedMesh>(null);
    
    const state = engineRef.current?.state;

    useEffect(() => {
        if (!state || !state.trees || state.trees.length === 0) return;
        if (!trunkRef.current || !leavesRef.current) return;
        
        const dummy = new THREE.Object3D();
        
        state.trees.forEach((tree, i) => {
            dummy.position.set(tree.x, tree.y + 1 * tree.scale, tree.z);
            dummy.scale.set(tree.scale, tree.scale, tree.scale);
            dummy.updateMatrix();
            trunkRef.current!.setMatrixAt(i, dummy.matrix);
            
            dummy.position.set(tree.x, tree.y + 3 * tree.scale, tree.z);
            dummy.scale.set(tree.scale * 1.5, tree.scale * 2, tree.scale * 1.5);
            dummy.updateMatrix();
            leavesRef.current!.setMatrixAt(i, dummy.matrix);
        });
        
        trunkRef.current.instanceMatrix.needsUpdate = true;
        leavesRef.current.instanceMatrix.needsUpdate = true;
    }, [state?.trees]);

    if (!state) return null;

    return (
        <group>
            {/* Trees InstancedMesh */}
            {state.trees && state.trees.length > 0 && (
                <group>
                    <instancedMesh ref={trunkRef} args={[undefined, undefined, state.trees.length]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.2, 0.4, 2, 8]} />
                        <meshStandardMaterial color="#78350f" roughness={0.9} />
                    </instancedMesh>
                    <instancedMesh ref={leavesRef} args={[undefined, undefined, state.trees.length]} castShadow receiveShadow>
                        <coneGeometry args={[1.5, 4, 8]} />
                        <meshStandardMaterial color="#166534" roughness={0.8} />
                    </instancedMesh>
                </group>
            )}
            
            {/* Villages */}
            {state.villages && state.villages.map(v => (
                <group key={v.id}>
                    {v.houses.map((h, i) => (
                        <group key={i} position={[h.x, h.y, h.z]} rotation={[0, h.rotation, 0]}>
                            {/* Base */}
                            <mesh position={[0, 2, 0]} castShadow receiveShadow>
                                <boxGeometry args={[h.scaleX, 4, h.scaleZ]} />
                                <meshStandardMaterial color="#e5e7eb" roughness={0.9} />
                            </mesh>
                            {/* Roof */}
                            <mesh position={[0, 4 + h.scaleX*0.2, 0]} rotation={[0, Math.PI/4, 0]} castShadow>
                                <coneGeometry args={[Math.max(h.scaleX, h.scaleZ)*0.8, h.scaleX*0.5, 4]} />
                                <meshStandardMaterial color="#991b1b" roughness={0.7} />
                            </mesh>
                        </group>
                    ))}
                    {/* Dirt patch under village */}
                    <mesh position={[v.x, v.y + 0.1, v.z]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                        <circleGeometry args={[60, 32]} />
                        <meshStandardMaterial color="#78350f" roughness={1} opacity={0.6} transparent />
                    </mesh>
                </group>
            ))}

            {/* Water Plane (River) */}
            <mesh position={[0, 1, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                <planeGeometry args={[6000, 6000]} />
                <meshStandardMaterial color="#0ea5e9" transparent opacity={0.7} roughness={0.1} metalness={0.1} />
            </mesh>
        </group>
    );
}

// --- MINIMAP 2D COMPONENT ---
function Minimap2D({ engineRef }: { engineRef: React.MutableRefObject<ArtilleryEngine3D | null> }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedPoint, setSelectedPoint] = React.useState<{x: number, y: number, z: number, dist: number, az: number} | null>(null);
    const selectedPointRef = useRef<{x: number, z: number} | null>(null);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!engineRef.current || !canvasRef.current) return;
        const engine = engineRef.current;
        const config = engine.config;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const W = canvasRef.current.width;
        const H = canvasRef.current.height;
        const scale = 200 / 6000;
        
        const worldX = config.mortarX + (mouseX - W/2) / scale;
        const worldZ = config.mortarZ + (mouseY - H/2) / scale;
        const worldY = engine.getTerrainHeight(worldX, worldZ);
        
        const dx = worldX - config.mortarX;
        const dz = worldZ - config.mortarZ;
        const dist = Math.sqrt(dx*dx + dz*dz);
        let az = Math.atan2(dx, -dz) * 180 / Math.PI;
        if (az < 0) az += 360;
        
        selectedPointRef.current = { x: worldX, z: worldZ };
        setSelectedPoint({ x: worldX, y: worldY, z: worldZ, dist, az });
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let animationFrame: number;
        
        const render = () => {
            if (!engineRef.current) return;
            const engine = engineRef.current;
            const state = engine.state;
            const config = engine.config;
            
            const W = canvas.width;
            const H = canvas.height;
            
            ctx.clearRect(0, 0, W, H);
            
            // Background
            ctx.fillStyle = 'rgba(0, 20, 0, 0.8)';
            ctx.fillRect(0, 0, W, H);
            
            // Map Scale: 200px = 6000m -> 1px = 30m
            const scale = 200 / 6000;
            const mapX = (worldX: number) => W/2 + (worldX - config.mortarX) * scale;
            const mapZ = (worldZ: number) => H/2 + (worldZ - config.mortarZ) * scale;
            
            // River (thick blue line)
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
            ctx.lineWidth = 10;
            ctx.beginPath();
            for(let i = -3000; i <= 3000; i+=200) {
                const rz = config.mortarZ + i;
                const rx = Math.sin(rz / 300) * 300 + Math.cos(rz / 800) * 400;
                if (i === -3000) ctx.moveTo(mapX(rx), mapZ(rz));
                else ctx.lineTo(mapX(rx), mapZ(rz));
            }
            ctx.stroke();

            // Grid lines (1000m)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let i = -3000; i <= 3000; i+=1000) {
                ctx.moveTo(mapX(config.mortarX + i), 0);
                ctx.lineTo(mapX(config.mortarX + i), H);
                ctx.moveTo(0, mapZ(config.mortarZ + i));
                ctx.lineTo(W, mapZ(config.mortarZ + i));
            }
            ctx.stroke();
            
            // Trees (Green dots)
            if (state.trees) {
                ctx.fillStyle = 'rgba(22, 101, 52, 0.6)';
                state.trees.forEach(t => {
                    ctx.fillRect(mapX(t.x), mapZ(t.z), 1, 1);
                });
            }

            // Villages (Gray blocks)
            if (state.villages) {
                ctx.fillStyle = 'rgba(229, 231, 235, 0.9)';
                state.villages.forEach(v => {
                    v.houses.forEach(h => {
                        ctx.fillRect(mapX(h.x)-1, mapZ(h.z)-1, 2, 2);
                    });
                });
            }

            // Impacts (Gray)
            ctx.fillStyle = '#9ca3af';
            state.impacts.forEach(imp => {
                ctx.beginPath();
                ctx.arc(mapX(imp.x), mapZ(imp.z), 2, 0, Math.PI*2);
                ctx.fill();
            });
            
            // Targets (Yellow/Gray)
            if (state.targets) {
                state.targets.forEach(t => {
                    ctx.fillStyle = t.isDestroyed ? '#374151' : '#eab308';
                    ctx.beginPath();
                    ctx.arc(mapX(t.x), mapZ(t.z), 4, 0, Math.PI*2);
                    ctx.fill();
                    if (!t.isDestroyed) {
                        ctx.strokeStyle = '#ca8a04';
                        ctx.stroke();
                    }
                });
            }
            
            // Flying Projectiles (Red)
            ctx.fillStyle = '#ef4444';
            state.projectiles.forEach(p => {
                if (!p.isLanded) {
                    ctx.beginPath();
                    ctx.arc(mapX(p.x), mapZ(p.z), 2, 0, Math.PI*2);
                    ctx.fill();
                }
            });
            
            // Mortar (Blue)
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(mapX(config.mortarX), mapZ(config.mortarZ), 5, 0, Math.PI*2);
            ctx.fill();
            
            // Direction line
            const dirLen = 25;
            const azRad = (config.azimuth * Math.PI) / 180;
            const dx = Math.sin(azRad) * dirLen;
            const dz = -Math.cos(azRad) * dirLen;
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mapX(config.mortarX), mapZ(config.mortarZ));
            ctx.lineTo(mapX(config.mortarX) + dx, mapZ(config.mortarZ) + dz);
            ctx.stroke();
            
            // Compass N
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.fillText('N', W/2 - 4, 12);

            // Draw selected point crosshair
            if (selectedPointRef.current) {
                const sp = selectedPointRef.current;
                const spX = mapX(sp.x);
                const spZ = mapZ(sp.z);
                ctx.strokeStyle = '#22d3ee'; // Cyan
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(spX - 6, spZ);
                ctx.lineTo(spX + 6, spZ);
                ctx.moveTo(spX, spZ - 6);
                ctx.lineTo(spX, spZ + 6);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(spX, spZ, 3, 0, Math.PI*2);
                ctx.stroke();
            }
            
            animationFrame = requestAnimationFrame(render);
        };
        
        render();
        
        return () => cancelAnimationFrame(animationFrame);
    }, [engineRef]);

    return (
        <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10 }}>
            <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                background: 'rgba(0,0,0,0.5)',
                position: 'relative'
            }}>
                <canvas 
                    ref={canvasRef} 
                    width={200} 
                    height={200} 
                    style={{ display: 'block', cursor: 'crosshair' }} 
                    onClick={handleCanvasClick}
                />
            </div>
            
            {selectedPoint && (
                <div style={{
                    position: 'absolute',
                    bottom: '105%',
                    right: '0',
                    width: 'max-content',
                    background: 'rgba(0,0,0,0.85)',
                    border: '1px solid #22d3ee',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ color: '#22d3ee', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Tọa độ trinh sát</span>
                        <button 
                            onClick={() => { setSelectedPoint(null); selectedPointRef.current = null; }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 0 0 12px', fontSize: '14px', lineHeight: 1 }}
                        >
                            &times;
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
                        <span style={{ color: '#9ca3af' }}>X (Đ-T):</span> <span>{selectedPoint.x.toFixed(1)} m</span>
                        <span style={{ color: '#9ca3af' }}>Z (B-N):</span> <span>{selectedPoint.z.toFixed(1)} m</span>
                        <span style={{ color: '#9ca3af' }}>Độ cao (Y):</span> <span>{selectedPoint.y.toFixed(1)} m</span>
                        <div style={{ gridColumn: 'span 2', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                        <span style={{ color: '#9ca3af' }}>Khoảng cách:</span> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{selectedPoint.dist.toFixed(1)} m</span>
                        <span style={{ color: '#9ca3af' }}>Phương vị:</span> <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{selectedPoint.az.toFixed(2)}°</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- MAIN CANVAS COMPONENT ---
interface ArtilleryCanvasProps {
  engineRef: React.MutableRefObject<ArtilleryEngine3D | null>;
}

export function ArtilleryCanvas3D({ engineRef }: ArtilleryCanvasProps) {
  const [, setTick] = React.useState(0);
  
  useEffect(() => {
    if (engineRef.current) {
        const listener = (s: ArtilleryState3D) => {
            setTick(t => t + 1);
        };
        engineRef.current.addListener(listener);
        return () => {
            engineRef.current?.removeListener(listener);
        };
    }
  }, [engineRef]);

  if (!engineRef.current || typeof engineRef.current.spawnTargets !== 'function' || !engineRef.current.state.trees) {
      engineRef.current = new ArtilleryEngine3D();
  }

  const state = engineRef.current.state;
  const config = engineRef.current.config;
  const mortarY = engineRef.current.getTerrainHeight(config.mortarX, config.mortarZ);

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
      <Canvas shadows camera={{ position: [-300, 200, 300], fov: 60, far: 20000 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <ambientLight intensity={0.4} />
        <directionalLight 
            castShadow 
            position={[1000, 1000, 500]} 
            intensity={1.5} 
            shadow-mapSize-width={2048} 
            shadow-mapSize-height={2048}
            shadow-camera-far={3000}
            shadow-camera-left={-1000}
            shadow-camera-right={1000}
            shadow-camera-top={1000}
            shadow-camera-bottom={-1000}
        />
        
        <OrbitControls makeDefault target={[config.mortarX, mortarY, config.mortarZ]} maxPolarAngle={Math.PI / 2 - 0.05} />
        
        {/* Compass Rose (Moves with Mortar) */}
        <group position={[config.mortarX, mortarY + 0.2, config.mortarZ]}>
            {/* Compass Axes */}
            <axesHelper args={[50]} />
            
            {/* Direction Labels (Always visible on top of terrain) */}
            <Text position={[0, 5, -55]} fontSize={10} color="#3b82f6" rotation={[-Math.PI/2, 0, 0]} depthTest={false} renderOrder={999}>BẮC (N)</Text>
            <Text position={[0, 5, 55]} fontSize={10} color="#ef4444" rotation={[-Math.PI/2, 0, 0]} depthTest={false} renderOrder={999}>NAM (S)</Text>
            <Text position={[55, 5, 0]} fontSize={10} color="#10b981" rotation={[-Math.PI/2, 0, 0]} depthTest={false} renderOrder={999}>ĐÔNG (E)</Text>
            <Text position={[-55, 5, 0]} fontSize={10} color="#f59e0b" rotation={[-Math.PI/2, 0, 0]} depthTest={false} renderOrder={999}>TÂY (W)</Text>
        </group>

        <Terrain engineRef={engineRef} />
        <Scenery engineRef={engineRef} />
        <Mortar config={config} engineRef={engineRef} />
        <Targets targets={state.targets || []} />
        {state.projectiles.map(p => (
            <Projectile key={p.id} projectile={p} />
        ))}
        <ImpactMarkers impacts={state.impacts} />
      </Canvas>
      <Minimap2D engineRef={engineRef} />
    </div>
  );
}
