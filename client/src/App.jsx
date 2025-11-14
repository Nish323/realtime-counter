import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Counter from './components/Counter';

// ホスト名:4000 に Socket.IOで接続
const socket = io(`http://${window.location.hostname}:4000`);

function App() {
  const [value, setValue] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // サーバーからカウンター更新を受け取る
    socket.on('counterUpdated', (val) => {
      setValue(val);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('counterUpdated');
    };
  }, []);

  const handleIncrement = () => {
    socket.emit('increment');
  };

  const handleReset = () => {
    socket.emit('reset');
  };

  return (
    <div
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '16px',
      }}
    >
      <h1 style={{ fontSize: '28px', margin: 0 }}>リアルタイム共有カウンター</h1>
      <p style={{ margin: 0, color: '#555', textAlign: 'center' }}>
        同じページを開いている全端末で
        <br />
        カウント値がリアルタイムに共有されます。
      </p>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Counter
          label="カウンター A"
          value={value}
          onIncrement={handleIncrement}
          onReset={handleReset}
        />
        <Counter
          label="カウンター B"
          value={value}
          onIncrement={handleIncrement}
          onReset={handleReset}
        />
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#777' }}>
        接続状態:{' '}
        <span style={{ fontWeight: 'bold', color: connected ? 'green' : 'red' }}>
          {connected ? 'オンライン' : 'オフライン'}
        </span>
      </div>
    </div>
  );
}

export default App;
