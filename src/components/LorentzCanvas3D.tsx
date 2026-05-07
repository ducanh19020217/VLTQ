import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Trail, Sphere, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { LorentzEngine } from '../physics/LorentzEngine';
import type { LorentzState } from '../physics/LorentzEngine';

interface LorentzCanvasProps {
  engineRef: React.MutableRefObject<LorentzEngine | null>;
  showForce: boolean;
  showVelocity: boolean;
  showBField: boolean;
}

function Particle({ engineRef, showForce, showVelocity }: { 
  engineRef: React.MutableRefObject<LorentzEngine | null>,
  showForce: boolean,
  showVelocity: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const forceArrowRef = useRef<THREE.ArrowHelper>(null);
  const velArrowRef = useRef<THREE.ArrowHelper>(null);

  useFrame(() => {
    if (!engineRef.current || !meshRef.current) return;
    
    engineRef.current.update();
    const { pos, vel, force } = engineRef.current.state;
    
    meshRef.current.position.set(pos.x, pos.y, pos.z);

    if (forceArrowRef.current) {
        const forceVec = new THREE.Vector3(force.x, force.y, force.z);
        const mag = forceVec.length();
        if (mag > 0.01) {
            forceArrowRef.current.setDirection(forceVec.clone().normalize());
            forceArrowRef.current.setLength(Math.min(mag * 0.5, 5));
            forceArrowRef.current.visible = showForce;
        } else {
            forceArrowRef.current.visible = false;
        }
    }

    if (velArrowRef.current) {
        const velVec = new THREE.Vector3(vel.x, vel.y, vel.z);
        const mag = velVec.length();
        if (mag > 0.01) {
            velArrowRef.current.setDirection(velVec.clone().normalize());
            velArrowRef.current.setLength(Math.min(mag * 0.2, 5));
            velArrowRef.current.visible = showVelocity;
        } else {
            velArrowRef.current.visible = false;
        }
    }
  });

  const q = engineRef.current?.config.q || 1;

  return (
    <group>
        <Trail
            width={1.5}
            length={100}
            color={q > 0 ? "#ef4444" : "#3b82f6"}
            attenuation={(t) => t}
        >
            <Sphere ref={meshRef} args={[0.5, 16, 16]}>
                <meshStandardMaterial color={q > 0 ? "#ef4444" : "#3b82f6"} emissive={q > 0 ? "#991b1b" : "#1e3a8a"} />
                
                {/* Force Arrow (Yellow) */}
                <primitive 
                    object={new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0xef4444)} 
                    ref={forceArrowRef}
                />
                
                {/* Velocity Arrow (Green) */}
                <primitive 
                    object={new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0x22c55e)} 
                    ref={velArrowRef}
                />
            </Sphere>
        </Trail>
    </group>
  );
}

function BFieldVisualizer({ bField }: { bField: {x:number, y:number, z:number} }) {
    const arrows = useMemo(() => {
        const items = [];
        const bVec = new THREE.Vector3(bField.x, bField.y, bField.z);
        const mag = bVec.length();
        if (mag === 0) return [];

        const dir = bVec.clone().normalize();
        const spacing = 10;
        const range = 50;

        for (let x = -range; x <= range; x += spacing) {
            for (let z = -range; z <= range; z += spacing) {
                items.push(
                    <primitive 
                        key={`${x}-${z}`}
                        object={new THREE.ArrowHelper(dir, new THREE.Vector3(x, -range/2, z), range, 0x3b82f6, 2, 1)} 
                        alphaTest={0.5}
                    />
                );
            }
        }
        return items;
    }, [bField]);

    return <group opacity={0.2} transparent>{arrows}</group>;
}

export function LorentzCanvas3D({ engineRef, showForce, showVelocity, showBField }: LorentzCanvasProps) {
  if (!engineRef.current) {
    engineRef.current = new LorentzEngine();
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#020617' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[40, 40, 40]} fov={50} />
        <OrbitControls makeDefault />
        
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[100, 100, 100]} intensity={1} castShadow />
        
        <Grid 
            infiniteGrid 
            fadeDistance={100} 
            fadeStrength={5} 
            cellSize={5} 
            sectionSize={25} 
            sectionColor="#1e293b" 
            cellColor="#0f172a" 
        />

        {showBField && <BFieldVisualizer bField={engineRef.current.config.bField} />}
        
        <Particle engineRef={engineRef} showForce={showForce} showVelocity={showVelocity} />
      </Canvas>
    </div>
  );
}

// Simple wrapper for Sky since it wasn't imported from drei in my thought but I should check
import { Sky } from '@react-three/drei';
