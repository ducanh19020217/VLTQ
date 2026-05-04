import { useState } from 'react';
import { Calculator, HelpCircle, RefreshCcw, Type } from 'lucide-react';

type SolverMode = 'change-length' | 'equation';

export function ProblemSolver() {
  const [mode, setMode] = useState<SolverMode>('change-length');
  
  // State for Change Length mode
  const [values, setValues] = useState({
    t1: '', t2: '', l1: '', deltaL: ''
  });
  
  // State for Equation mode
  const [eqValues, setEqValues] = useState({
    l: '20', g: '9.8', s0_init: '0', v0_init: '14'
  });

  const [resultText, setResultText] = useState<string | null>(null);

  const clear = () => {
    setValues({ t1: '', t2: '', l1: '', deltaL: '' });
    setEqValues({ l: '', g: '9.8', s0_init: '0', v0_init: '' });
    setResultText(null);
  };

  const solveChangeLength = () => {
    const { t1, t2, l1, deltaL } = values;
    const numT1 = parseFloat(t1);
    const numT2 = parseFloat(t2);
    const numL1 = parseFloat(l1);
    const numDL = parseFloat(deltaL);

    if (!isNaN(numT1) && !isNaN(numT2) && !isNaN(numDL) && isNaN(numL1)) {
      const res = numDL / (Math.pow(numT2 / numT1, 2) - 1);
      setResultText(`Chiều dài ban đầu L1 = ${res.toFixed(2)} cm`);
    } else if (!isNaN(numT1) && !isNaN(numT2) && !isNaN(numL1) && isNaN(numDL)) {
      const res = numL1 * (Math.pow(numT2 / numT1, 2) - 1);
      setResultText(`Độ thay đổi chiều dài ΔL = ${res.toFixed(2)} cm`);
    } else if (!isNaN(numT1) && !isNaN(numL1) && !isNaN(numDL) && isNaN(numT2)) {
      const res = numT1 * Math.sqrt((numL1 + numDL) / numL1);
      setResultText(`Chu kỳ sau T2 = ${res.toFixed(2)} s`);
    } else if (!isNaN(numT2) && !isNaN(numL1) && !isNaN(numDL) && isNaN(numT1)) {
      const res = numT2 / Math.sqrt((numL1 + numDL) / numL1);
      setResultText(`Chu kỳ đầu T1 = ${res.toFixed(2)} s`);
    } else {
      setResultText('Vui lòng nhập đúng 3 trong 4 thông số.');
    }
  };

  const solveEquation = () => {
    const l = parseFloat(eqValues.l) / 100; // cm to m
    const g = parseFloat(eqValues.g);
    const s0 = parseFloat(eqValues.s0_init); // cm
    const v0 = parseFloat(eqValues.v0_init); // cm/s

    if (isNaN(l) || isNaN(g) || isNaN(v0)) {
      setResultText('Vui lòng nhập đầy đủ L, g và v0.');
      return;
    }

    const omega = Math.sqrt(g / l);
    const S0 = Math.sqrt(Math.pow(s0, 2) + Math.pow(v0 / omega, 2));
    
    // s = S0 * cos(phi) = s0 -> cos(phi) = s0/S0
    // v = -omega * S0 * sin(phi) = v0 -> sin(phi) = -v0 / (omega * S0)
    const phi = Math.atan2(-v0 / (omega * S0), s0 / S0);

    let phiStr = '';
    if (Math.abs(phi) < 0.001) phiStr = '';
    else {
      const piFrac = phi / Math.PI;
      if (Math.abs(piFrac - 0.5) < 0.01) phiStr = ' + π/2';
      else if (Math.abs(piFrac + 0.5) < 0.01) phiStr = ' - π/2';
      else if (Math.abs(piFrac - 1) < 0.01) phiStr = ' + π';
      else if (Math.abs(piFrac + 1) < 0.01) phiStr = ' - π';
      else phiStr = (phi > 0 ? ' + ' : ' ') + phi.toFixed(2);
    }

    setResultText(`Phương trình: s = ${S0.toFixed(1)} cos(${omega.toFixed(1)}t${phiStr}) cm`);
  };

  return (
    <div style={{
      marginTop: '2rem',
      padding: '1rem',
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      borderRadius: '0.5rem',
      border: '1px solid rgba(59, 130, 246, 0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => { setMode('change-length'); setResultText(null); }}
            style={{ 
              fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #ccc',
              backgroundColor: mode === 'change-length' ? 'var(--accent-color)' : 'white',
              color: mode === 'change-length' ? 'white' : 'black', cursor: 'pointer'
            }}
          >
            Thay đổi L
          </button>
          <button 
            onClick={() => { setMode('equation'); setResultText(null); }}
            style={{ 
              fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #ccc',
              backgroundColor: mode === 'equation' ? 'var(--accent-color)' : 'white',
              color: mode === 'equation' ? 'white' : 'black', cursor: 'pointer'
            }}
          >
            Lập phương trình
          </button>
        </div>
        <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <RefreshCcw size={14} />
        </button>
      </div>

      {mode === 'change-length' ? (
        <>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Nhập 3 thông số bất kỳ để tính giá trị còn lại (L tỉ lệ thuận với T²).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>T1 (s)</label>
              <input type="number" placeholder="?" value={values.t1} onChange={(e) => setValues({...values, t1: e.target.value})} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>T2 (s)</label>
              <input type="number" placeholder="?" value={values.t2} onChange={(e) => setValues({...values, t2: e.target.value})} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>L1 (cm)</label>
              <input type="number" placeholder="?" value={values.l1} onChange={(e) => setValues({...values, l1: e.target.value})} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>ΔL (cm)</label>
              <input type="number" placeholder="?" value={values.deltaL} onChange={(e) => setValues({...values, deltaL: e.target.value})} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
            </div>
          </div>
          <button className="primary-btn" onClick={solveChangeLength} style={{ fontSize: '0.85rem', padding: '0.5rem', marginTop: '1rem' }}>Tính toán</button>
        </>
      ) : (
        <>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Xác định s = S0 cos(ωt + φ) từ điều kiện ban đầu.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>L (cm)</label>
              <input type="number" value={eqValues.l} onChange={(e) => setEqValues({...eqValues, l: e.target.value})} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>g (m/s²)</label>
              <input type="number" value={eqValues.g} onChange={(e) => setEqValues({...eqValues, g: e.target.value})} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>Li độ s0 (cm)</label>
              <input type="number" value={eqValues.s0_init} onChange={(e) => setEqValues({...eqValues, s0_init: e.target.value})} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '0.2rem' }}>Vận tốc v0 (cm/s)</label>
              <input type="number" value={eqValues.v0_init} onChange={(e) => setEqValues({...eqValues, v0_init: e.target.value})} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
            </div>
          </div>
          <button className="primary-btn" onClick={solveEquation} style={{ fontSize: '0.85rem', padding: '0.5rem', marginTop: '1rem' }}>Lập phương trình</button>
        </>
      )}

      {resultText && (
        <div style={{ 
          marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--panel-bg)', borderRadius: '0.375rem', borderLeft: '4px solid var(--accent-color)'
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{resultText}</div>
          <div style={{ fontSize: '0.65rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            {mode === 'equation' ? 'ω = √(g/L); S0 = √(s0² + (v0/ω)²); φ từ s0 & v0' : 'Công thức: (T2/T1)² = (L1 + ΔL) / L1'}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.3rem', alignItems: 'flex-start', opacity: 0.7 }}>
        <HelpCircle size={12} style={{ marginTop: '0.1rem' }} />
        <span style={{ fontSize: '0.65rem' }}>ΔL &gt; 0: tăng chiều dài. v0 &gt; 0: truyền vận tốc theo chiều dương.</span>
      </div>
    </div>
  );
}
