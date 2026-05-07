import React, { useState } from 'react';
import { NetworkManager } from '../../physics/NetworkManager';

interface Props {
  network: NetworkManager;
  onConnected: () => void;
}

export function MultiplayerLobby({ network, onConnected }: Props) {
  const [hostId, setHostId] = useState<string | null>(null);
  const [joinId, setJoinId] = useState('');
  const [status, setStatus] = useState<string>('');

  const handleHost = async () => {
    setStatus('Đang tạo phòng...');
    try {
      const id = await network.hostGame();
      setHostId(id);
      setStatus('Đang chờ đối thủ tham gia...');
      
      // Wait for connection
      const checkConnection = setInterval(() => {
        if (network.isConnected) {
          clearInterval(checkConnection);
          onConnected();
        }
      }, 500);
      
    } catch (e) {
      setStatus('Lỗi tạo phòng!');
    }
  };

  const handleJoin = async () => {
    if (!joinId.trim()) return;
    setStatus('Đang kết nối...');
    try {
      await network.joinGame(joinId.trim());
      setStatus('Đã kết nối!');
      onConnected();
    } catch (e) {
      setStatus('Không thể kết nối. Kiểm tra lại ID.');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Pháo Binh Đối Kháng - LAN</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Chọn Tạo phòng (Host) hoặc Nhập mã phòng để tham gia (Join).
        </p>

        <div style={{ display: 'flex', gap: 20, marginTop: 24 }}>
          {/* Host Section */}
          <div style={sectionStyle}>
            <h3>Tạo Phòng (Host)</h3>
            <button style={btnHostStyle} onClick={handleHost} disabled={!!hostId}>
              Tạo Mã Phòng
            </button>
            {hostId && (
              <div style={idBoxStyle}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mã phòng của bạn:</span>
                <strong style={{ fontSize: 18, color: '#facc15', userSelect: 'all' }}>{hostId}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>(Gửi mã này cho bạn bè)</span>
              </div>
            )}
          </div>

          <div style={{ width: 1, background: 'var(--border-color)' }}></div>

          {/* Join Section */}
          <div style={sectionStyle}>
            <h3>Vào Phòng (Join)</h3>
            <input 
              style={inputStyle}
              placeholder="Nhập mã phòng..."
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              disabled={!!hostId}
            />
            <button style={btnJoinStyle} onClick={handleJoin} disabled={!!hostId || !joinId}>
              Kết Nối
            </button>
          </div>
        </div>

        {status && <p style={{ marginTop: 24, color: '#34d399', fontWeight: 'bold' }}>{status}</p>}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.9)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--panel-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  padding: 32,
  width: 600,
  maxWidth: '90%',
  textAlign: 'center',
  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
};

const sectionStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  alignItems: 'center',
};

const btnHostStyle: React.CSSProperties = {
  background: 'var(--accent-color)',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 'bold',
};

const btnJoinStyle: React.CSSProperties = {
  background: '#34d399',
  color: '#000',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 'bold',
};

const inputStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: 6,
  border: '1px solid var(--border-color)',
  background: 'rgba(0,0,0,0.2)',
  color: 'white',
  textAlign: 'center',
  width: '100%',
};

const idBoxStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.3)',
  padding: '12px',
  borderRadius: 6,
  border: '1px dashed #facc15',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginTop: 12,
};
