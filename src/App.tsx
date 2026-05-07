import { useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { OhmsLawCanvas } from './components/OhmsLawCanvas';
import { OhmsLawControls } from './components/OhmsLawControls';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ControlPanel } from './components/ControlPanel';
import { PhotoelectricCanvas } from './components/PhotoelectricCanvas';
import { PhotoelectricControls } from './components/PhotoelectricControls';
import { SpringCanvas } from './components/SpringCanvas';
import { SpringControls } from './components/SpringControls';
import { WaveInterferenceCanvas } from './components/WaveInterferenceCanvas';
import { WaveInterferenceControls } from './components/WaveInterferenceControls';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { PendulumEngine } from './physics/PendulumEngine';
import { PhotoelectricEngine } from './physics/PhotoelectricEngine';
import { SpringEngine } from './physics/SpringEngine';
import { WaveInterferenceEngine } from './physics/WaveInterferenceEngine';
import { LeverEngine } from './physics/LeverEngine';
import { LeverCanvas } from './components/LeverCanvas';
import { LeverControls } from './components/LeverControls';
import { OhmsLawEngine } from './physics/OhmsLawEngine';
import { DensityEngine } from './physics/DensityEngine';
import { DensityCanvas } from './components/DensityCanvas';
import { DensityControls } from './components/DensityControls';
import { ProjectileEngine } from './physics/ProjectileEngine';
import { ProjectileCanvas } from './components/ProjectileCanvas';
import { ProjectileControls } from './components/ProjectileControls';
import { ArtilleryEngine3D } from './physics/ArtilleryEngine3D';
import { ArtilleryCanvas3D } from './components/artillery3d/ArtilleryCanvas3D';
import { ArtilleryControls3D } from './components/artillery3d/ArtilleryControls3D';
import { ArtilleryMultiplayer } from './components/artillery3d/ArtilleryMultiplayer';
import { CircularMotionEngine } from './physics/CircularMotionEngine';
import { CircularMotionCanvas } from './components/CircularMotionCanvas';
import { CircularMotionControls } from './components/CircularMotionControls';
import { ElectricFieldEngine } from './physics/ElectricFieldEngine';
import { ElectricFieldCanvas } from './components/ElectricFieldCanvas';
import { ElectricFieldControls } from './components/ElectricFieldControls';
import { LorentzEngine } from './physics/LorentzEngine';
import { LorentzCanvas3D } from './components/LorentzCanvas3D';
import { LorentzControls } from './components/LorentzControls';
import { MomentumEngine } from './physics/MomentumEngine';
import { MomentumCanvas } from './components/MomentumCanvas';
import { MomentumControls } from './components/MomentumControls';
import { ThermalExpansionEngine } from './physics/ThermalExpansionEngine';
import { ThermalExpansionCanvas } from './components/ThermalExpansionCanvas';
import { ThermalExpansionControls } from './components/ThermalExpansionControls';
import { LightReflectionEngine } from './physics/LightReflectionEngine';
import { LightReflectionCanvas } from './components/LightReflectionCanvas';
import { LightReflectionControls } from './components/LightReflectionControls';
import { SoundPitchEngine } from './physics/SoundPitchEngine';
import { SoundPitchCanvas } from './components/SoundPitchCanvas';
import { SoundPitchControls } from './components/SoundPitchControls';
import { MagnetismEngine } from './physics/MagnetismEngine';
import { MagnetismCanvas } from './components/MagnetismCanvas';
import { MagnetismControls } from './components/MagnetismControls';
import { RefractionEngine } from './physics/RefractionEngine';
import { RefractionCanvas } from './components/RefractionCanvas';
import { RefractionControls } from './components/RefractionControls';
import { Atom } from 'lucide-react';

function App() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showVectors, setShowVectors] = useState(true);
  const [showDiagram, setShowDiagram] = useState(true);
  const [showPath, setShowPath] = useState(true);
  
  const pendulumRef = useRef<PendulumEngine | null>(null);
  const photoRef = useRef<PhotoelectricEngine | null>(null);
  const springRef = useRef<SpringEngine | null>(null);
  const waveRef = useRef<WaveInterferenceEngine | null>(null);
  const leverRef = useRef<LeverEngine | null>(null);
  const densityRef = useRef<DensityEngine | null>(null);
  const projectileRef = useRef<ProjectileEngine | null>(null);
  const artilleryRef = useRef<ArtilleryEngine3D | null>(null);
  const circularRef = useRef<CircularMotionEngine | null>(null);
  const electricFieldRef = useRef<ElectricFieldEngine | null>(null);
  const lorentzRef = useRef<LorentzEngine | null>(null);
  const momentumRef = useRef<MomentumEngine | null>(null);
  const thermalExpansionRef = useRef<ThermalExpansionEngine | null>(null);
  const lightReflectionRef = useRef<LightReflectionEngine | null>(null);
  const soundPitchRef = useRef<SoundPitchEngine | null>(null);
  const magnetismRef = useRef<MagnetismEngine | null>(null);
  const ohmRef = useRef<OhmsLawEngine | null>(null);
  const refractionRef = useRef<RefractionEngine | null>(null);

  const activeTopicId = location.pathname.substring(1) || 'pendulum';

  // Auto-recovery for HMR stale state
  if (activeTopicId === 'circular-motion') {
    if (circularRef.current && !circularRef.current.state.history) {
      circularRef.current = new CircularMotionEngine();
    }
  }

  return (
    <div className="app-container">
      <MobileNav onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <Sidebar 
        onSelectTopic={() => setIsSidebarOpen(false)} 
      />
      
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'block'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ width: '280px', height: '100%', backgroundColor: 'var(--panel-bg)' }}
          >
            <Sidebar onSelectTopic={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/pendulum" replace />} />
        
        <Route path="/pendulum" element={
          <>
            <SimulationCanvas engineRef={pendulumRef} showVectors={showVectors} />
            <ControlPanel engineRef={pendulumRef} showVectors={showVectors} setShowVectors={setShowVectors} />
          </>
        } />
        
        <Route path="/photoelectric-effect" element={
          <>
            <PhotoelectricCanvas engineRef={photoRef} />
            <PhotoelectricControls engineRef={photoRef} />
          </>
        } />
        
        <Route path="/spring-oscillator" element={
          <>
            <SpringCanvas engineRef={springRef} />
            <SpringControls engineRef={springRef} />
          </>
        } />
        
        <Route path="/wave-interference" element={
          <>
            <WaveInterferenceCanvas engineRef={waveRef} showDiagram={showDiagram} />
            <WaveInterferenceControls engineRef={waveRef} showDiagram={showDiagram} setShowDiagram={setShowDiagram} />
          </>
        } />

        <Route path="/lever" element={
          <>
            <LeverCanvas engineRef={leverRef} showVectors={showVectors} />
            <LeverControls engineRef={leverRef} showVectors={showVectors} setShowVectors={setShowVectors} />
          </>
        } />

        <Route path="/density" element={
          <>
            <DensityCanvas engineRef={densityRef} />
            <DensityControls engineRef={densityRef} />
          </>
        } />

        <Route path="/projectile-motion" element={
          <>
            <ProjectileCanvas engineRef={projectileRef} showVectors={showVectors} showPath={showPath} />
            <ProjectileControls engineRef={projectileRef} showVectors={showVectors} setShowVectors={setShowVectors} showPath={showPath} setShowPath={setShowPath} />
          </>
        } />

        <Route path="/artillery-3d" element={
          <ArtilleryMultiplayer engineRef={artilleryRef} />
        } />

        <Route path="/circular-motion" element={
          <>
            <CircularMotionCanvas 
              engineRef={circularRef} 
              showVelocity={showVectors} 
              showAcceleration={showVectors} 
            />
            <CircularMotionControls 
              engineRef={circularRef} 
              showVelocity={showVectors} 
              setShowVelocity={setShowVectors}
              showAcceleration={showVectors}
              setShowAcceleration={setShowVectors}
            />
          </>
        } />

        <Route path="/electric-field" element={
          <>
            <ElectricFieldCanvas 
              engineRef={electricFieldRef} 
              showFieldLines={showDiagram} 
              showPotential={showPath}
              showVectors={showVectors}
            />
            <ElectricFieldControls 
              engineRef={electricFieldRef}
              showFieldLines={showDiagram}
              setShowFieldLines={setShowDiagram}
              showPotential={showPath}
              setShowPotential={setShowPath}
              showVectors={showVectors}
              setShowVectors={setShowVectors}
            />
          </>
        } />

        <Route path="/magnetic-force" element={
          <>
            <LorentzCanvas3D 
              engineRef={lorentzRef} 
              showForce={showVectors} 
              showVelocity={showDiagram}
              showBField={showPath}
            />
            <LorentzControls 
              engineRef={lorentzRef}
              showForce={showVectors}
              setShowForce={setShowVectors}
              showVelocity={showDiagram}
              setShowVelocity={setShowDiagram}
              showBField={showPath}
              setShowBField={setShowPath}
            />
          </>
        } />

        <Route path="/momentum" element={
          <>
            <MomentumCanvas engineRef={momentumRef} />
            <MomentumControls engineRef={momentumRef} />
          </>
        } />

        <Route path="/thermal-expansion" element={
          <>
            <ThermalExpansionCanvas engineRef={thermalExpansionRef} />
            <ThermalExpansionControls engineRef={thermalExpansionRef} />
          </>
        } />

        <Route path="/reflection" element={
          <>
            <LightReflectionCanvas engineRef={lightReflectionRef} />
            <LightReflectionControls engineRef={lightReflectionRef} />
          </>
        } />

        <Route path="/sound-pitch" element={
          <>
            <SoundPitchCanvas engineRef={soundPitchRef} />
            <SoundPitchControls engineRef={soundPitchRef} />
          </>
        } />

        <Route path="/magnet" element={
          <>
            <MagnetismCanvas engineRef={magnetismRef} />
            <MagnetismControls engineRef={magnetismRef} />
          </>
        } />

        <Route path="/ohm-law" element={
          <>
            <OhmsLawCanvas engineRef={ohmRef} />
            <OhmsLawControls engineRef={ohmRef} />
          </>
        } />

        <Route path="/refraction" element={
          <>
            <RefractionCanvas engineRef={refractionRef} />
            <RefractionControls engineRef={refractionRef} />
          </>
        } />

        <Route path="*" element={
          <div style={{ 
            gridColumn: 'span 2', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <Atom size={64} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            <h2>Mô phỏng đang được phát triển</h2>
            <p>Chọn các bài trong danh sách demo.</p>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
