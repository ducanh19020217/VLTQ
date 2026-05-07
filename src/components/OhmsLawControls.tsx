import React, { useState, useEffect } from 'react';
import { OhmsLawEngine } from '../physics/OhmsLawEngine';
import type { OhmsLawState } from '../physics/OhmsLawEngine';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { HelpCircle, RefreshCcw, CheckCircle2, XCircle } from 'lucide-react';

interface OhmsLawControlsProps {
  engineRef: React.MutableRefObject<OhmsLawEngine | null>;
}

export function OhmsLawControls({ engineRef }: OhmsLawControlsProps) {
  const [voltage, setVoltage] = useState(9);
  const [resistance, setResistance] = useState(10);
  const [state, setState] = useState<OhmsLawState | null>(null);
  
  // Practice Mode state
  const [practiceMode, setPracticeMode] = useState(false);
  const [question, setQuestion] = useState<{ text: string, answer: number, unit: string } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean, message: string } | null>(null);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.onUpdate = (newState) => {
        setState({ ...newState });
      };
      setState(engineRef.current.state);
    }
  }, [engineRef]);

  const handleVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVoltage(val);
    engineRef.current?.setConfig({ voltage: val });
  };

  const handleResistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setResistance(val);
    engineRef.current?.setConfig({ resistance: val });
  };

  // Generate Graph Data
  const getIVData = () => {
    const data = [];
    for (let u = 0; u <= 24; u += 2) {
      data.push({ u, i: u / resistance });
    }
    return data;
  };

  const getIRData = () => {
    const data = [];
    for (let r = 5; r <= 100; r += 5) {
      data.push({ r, i: voltage / r });
    }
    return data;
  };

  const generateQuestion = () => {
    const type = Math.floor(Math.random() * 3);
    let u, r, i;
    
    switch (type) {
      case 0: // Calculate I
        u = Math.floor(Math.random() * 20) + 2;
        r = Math.floor(Math.random() * 50) + 5;
        setQuestion({
          text: `Cho hiệu điện thế U = ${u}V và điện trở R = ${r}Ω. Tính cường độ dòng điện I?`,
          answer: parseFloat((u / r).toFixed(2)),
          unit: 'A'
        });
        break;
      case 1: // Calculate U
        r = Math.floor(Math.random() * 50) + 5;
        i = Math.floor(Math.random() * 5) + 1;
        setQuestion({
          text: `Một điện trở R = ${r}Ω có dòng điện I = ${i}A chạy qua. Tính hiệu điện thế U?`,
          answer: r * i,
          unit: 'V'
        });
        break;
      case 2: // Calculate R
        u = Math.floor(Math.random() * 30) + 5;
        i = (Math.floor(Math.random() * 10) + 1) / 2;
        setQuestion({
          text: `Khi đặt hiệu điện thế U = ${u}V vào hai đầu dây dẫn thì dòng điện là I = ${i}A. Tính điện trở R?`,
          answer: parseFloat((u / i).toFixed(2)),
          unit: 'Ω'
        });
        break;
    }
    setUserAnswer('');
    setFeedback(null);
  };

  const checkAnswer = () => {
    if (!question) return;
    const val = parseFloat(userAnswer);
    if (Math.abs(val - question.answer) < 0.1) {
      setFeedback({ correct: true, message: 'Chính xác! Bạn đã nắm vững kiến thức.' });
    } else {
      setFeedback({ correct: false, message: `Chưa đúng. Đáp án là ${question.answer}${question.unit}.` });
    }
  };

  return (
    <aside className="control-panel">
      <h2 className="panel-title">Điều khiển Định luật Ôm</h2>

      <div className="mode-toggle">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={practiceMode} 
            onChange={(e) => {
              setPracticeMode(e.target.checked);
              if (e.target.checked && !question) generateQuestion();
            }} 
          />
          Chế độ luyện tập
        </label>
      </div>

      {!practiceMode ? (
        <>
          <div className="control-section">
            <h3 className="section-title">Thông số mạch</h3>
            <div className="control-group">
              <label className="control-label">
                Hiệu điện thế (U) <span className="value">{voltage.toFixed(1)} V</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="24" 
                step="0.1" 
                value={voltage} 
                onChange={handleVoltageChange} 
              />
            </div>
            <div className="control-group">
              <label className="control-label">
                Điện trở (R) <span className="value">{resistance.toFixed(0)} Ω</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                step="1" 
                value={resistance} 
                onChange={handleResistanceChange} 
              />
            </div>
          </div>

          <div className="control-section">
            <h3 className="section-title">Đồ thị I - U (R không đổi)</h3>
            <div style={{ width: '100%', height: '150px' }}>
              <ResponsiveContainer>
                <AreaChart data={getIVData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="u" hide />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', fontSize: '10px' }}
                    labelFormatter={(val) => `U = ${val}V`}
                  />
                  <Area type="monotone" dataKey="i" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '5px' }}>
              I tỷ lệ thuận với U
            </p>
          </div>

          <div className="control-section">
            <h3 className="section-title">Đồ thị I - R (U không đổi)</h3>
            <div style={{ width: '100%', height: '150px' }}>
              <ResponsiveContainer>
                <LineChart data={getIRData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="r" hide />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', fontSize: '10px' }}
                    labelFormatter={(val) => `R = ${val}Ω`}
                  />
                  <Line type="monotone" dataKey="i" stroke="#3b82f6" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '5px' }}>
              I tỷ lệ nghịch với R
            </p>
          </div>
        </>
      ) : (
        <div className="practice-section">
          <div className="info-card" style={{ marginTop: 0, borderLeft: '4px solid var(--accent-color)' }}>
            <h4>Câu hỏi luyện tập</h4>
            <p>{question?.text}</p>
          </div>

          <div className="control-group" style={{ marginTop: '1.5rem' }}>
            <label className="control-label">Câu trả lời của bạn</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="number" 
                className="control-input"
                style={{ 
                  flex: 1, 
                  padding: '0.6rem', 
                  borderRadius: '0.5rem', 
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-primary)'
                }}
                placeholder={`Nhập giá trị (${question?.unit})`}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              <button className="control-btn primary" onClick={checkAnswer} style={{ width: 'auto' }}>
                Gửi
              </button>
            </div>
          </div>

          {feedback && (
            <div className={`info-card`} style={{ 
              backgroundColor: feedback.correct ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: feedback.correct ? '#10b981' : '#ef4444'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {feedback.correct ? <CheckCircle2 size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                <p style={{ margin: 0, fontWeight: 500, color: feedback.correct ? '#065f46' : '#991b1b' }}>
                  {feedback.message}
                </p>
              </div>
            </div>
          )}

          <button className="control-btn secondary" onClick={generateQuestion} style={{ marginTop: '1rem', width: '100%' }}>
            <RefreshCcw size={16} /> Câu hỏi tiếp theo
          </button>
        </div>
      )}

      <div className="info-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <HelpCircle size={16} color="var(--accent-color)" />
          <h4 style={{ margin: 0 }}>Định luật Ôm</h4>
        </div>
        <p>
          Cường độ dòng điện chạy qua dây dẫn tỉ lệ thuận với hiệu điện thế đặt vào hai đầu dây và tỉ lệ nghịch với điện trở của dây:
          <br />
          <strong style={{ fontSize: '1.1rem', display: 'block', textAlign: 'center', margin: '0.5rem 0' }}>
            I = U / R
          </strong>
        </p>
      </div>
    </aside>
  );
}
