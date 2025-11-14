// client/src/App.jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Counter from './components/Counter/Counter';

// ホスト名:4000 に Socket.IO で接続
const socket = io(`http://${window.location.hostname}:4000`);

function App() {
  const [counters, setCounters] = useState({ a: 0, b: 0 });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // サーバーから2つ分まとめて受け取る
    socket.on('countersUpdated', (newCounters) => {
      setCounters(newCounters);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('countersUpdated');
    };
  }, []);

  const incrementA = () => socket.emit('increment', 'a');
  const incrementB = () => socket.emit('increment', 'b');
  const resetA = () => socket.emit('reset', 'a');
  const resetB = () => socket.emit('reset', 'b');

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
          value={counters.a}
          onIncrement={incrementA}
          onReset={resetA}
        />
        <Counter
          label="カウンター B"
          value={counters.b}
          onIncrement={incrementB}
          onReset={resetB}
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
