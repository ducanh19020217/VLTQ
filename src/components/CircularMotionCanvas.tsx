import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Sphere, Cylinder, Line, Trail, Text } from '@react-three/drei';
import * as THREE from 'three';
import { CircularMotionEngine } from '../physics/CircularMotionEngine';
import type { CircularState, CircularConfig } from '../physics/CircularMotionEngine';

interface VectorProps {
  start: [number, number, number];
  direction: [number, number, number];
  color: string;
  length: number;
  label?: string;
  visible?: boolean;
}

function VectorArrow({ start, direction, color, length, label, visible = true }: VectorProps) {
  if (!visible || length === 0) return null;
  
  const dir = new THREE.Vector3(...direction).normalize();
  const origin = new THREE.Vector3(...start);
  
  return (
    <group>
      <primitive 
        object={new THREE.ArrowHelper(dir, origin, length, color, 0.5, 0.3)} 
      />
      {label && (
        <Text
          position={[
            origin.x + dir.x * (length + 0.5),
            origin.y + dir.y * (length + 0.5),
            origin.z + dir.z * (length + 0.5)
          ]}
          fontSize={0.4}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

interface CircularMotionCanvasProps {
  engineRef: React.MutableRefObject<CircularMotionEngine | null>;
  showVelocity?: boolean;
  showAcceleration?: boolean;
  showForce?: boolean;
}

export function CircularMotionCanvas({ 
  engineRef, 
  showVelocity = true, 
  showAcceleration = true,
  showForce = false
}: CircularMotionCanvasProps) {
  const [state, setState] = React.useState<CircularState | null>(null);
  const [config, setConfig] = React.useState<CircularConfig | null>(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new CircularMotionEngine();
    }
    
    const engine = engineRef.current;
    
    const listener = (s: CircularState, c: CircularConfig) => {
      setState({ ...s });
      setConfig({ ...c });
    };

    engine.addListener(listener);

    return () => {
      engine.removeListener(listener);
      engine.pause(); // Stop loop on unmount
    };
  }, [engineRef]);

  // Path for the orbit
  const orbitPoints = useMemo(() => {
    if (!config) return [];
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(config.radius * Math.cos(angle), config.radius * Math.sin(angle), 0));
    }
    return points;
  }, [config]);

  if (!state || !config) return null;

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a' }}>
      <Canvas shadows camera={{ position: [0, 0, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        
        {/* Origin */}
        <Sphere args={[0.2, 16, 16]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </Sphere>
        
        {/* Orbit Path */}
        <Line 
          points={orbitPoints} 
          color="#334155" 
          lineWidth={1} 
          dashed={true} 
          dashScale={2} 
        />
        
        {/* Rotating Object */}
        <group position={[state.x, state.y, 0]}>
          <Sphere args={[0.5, 32, 32]} castShadow>
            <meshStandardMaterial color="#60a5fa" roughness={0.3} metalness={0.8} />
          </Sphere>
          
          {/* Tangential Velocity Vector */}
          <VectorArrow 
            start={[0, 0, 0]} 
            direction={[state.vx, state.vy, 0]} 
            color="#ef4444" 
            length={Math.sqrt(state.vx*state.vx + state.vy*state.vy) * 0.5} 
            label="v"
            visible={showVelocity}
          />
          
          {/* Centripetal Acceleration Vector */}
          <VectorArrow 
            start={[0, 0, 0]} 
            direction={[state.ax, state.ay, 0]} 
            color="#fbbf24" 
            length={Math.sqrt(state.ax*state.ax + state.ay*state.ay) * 0.2} 
            label="a"
            visible={showAcceleration}
          />
        </group>
        
        {/* String/Radius Line */}
        <Line 
          points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(state.x, state.y, 0)]} 
          color="#475569" 
          lineWidth={0.5} 
        />
        
        {/* Trail */}
        <Trail
          width={1}
          length={50}
          color="#3b82f6"
          attenuation={(t) => t * t}
        >
           <mesh position={[state.x, state.y, 0]}>
             <sphereGeometry args={[0.1]} />
             <meshBasicMaterial transparent opacity={0} />
           </mesh>
        </Trail>

        <OrbitControls enableRotate={true} />
      </Canvas>
    </div>
  );
}
