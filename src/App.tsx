import { useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { Atom } from 'lucide-react';

function App() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showVectors, setShowVectors] = useState(true);
  const [showDiagram, setShowDiagram] = useState(true);
  
  const pendulumRef = useRef<PendulumEngine | null>(null);
  const photoRef = useRef<PhotoelectricEngine | null>(null);
  const springRef = useRef<SpringEngine | null>(null);
  const waveRef = useRef<WaveInterferenceEngine | null>(null);

  const activeTopicId = location.pathname.substring(1) || 'pendulum';

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
