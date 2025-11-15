// client/src/App.jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Counter from './components/Counter/Counter'; // ← ここは構成に合わせて

// ホスト名:4000 に Socket.IO で接続
const socket = io(`http://${window.location.hostname}:4000`);

function App() {
  const [counters, setCounters] = useState({ a: 0, b: 0 });
  const [connected, setConnected] = useState(false);
  const [recordStatus, setRecordStatus] = useState(null); // 記録結果のメッセージ

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // サーバーから2つ分まとめて受け取る
    socket.on('countersUpdated', (newCounters) => {
      setCounters(newCounters);
    });

    // 記録処理の結果
    socket.on('recordSaved', (result) => {
      if (result.success) {
        setRecordStatus('記録しました');
      } else {
        setRecordStatus('記録に失敗しました');
      }
      // 2秒後にメッセージを消す
      setTimeout(() => setRecordStatus(null), 2000);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('countersUpdated');
      socket.off('recordSaved');
    };
  }, []);

  const incrementA = () => socket.emit('increment', 'a');
  const incrementB = () => socket.emit('increment', 'b');
  const decrementA = () => socket.emit('decrement', 'a');
  const decrementB = () => socket.emit('decrement', 'b');
  const resetA = () => socket.emit('reset', 'a');
  const resetB = () => socket.emit('reset', 'b');

  // 記録ボタン
  const record = () => socket.emit('record');

  // 差分（最後尾 - 先頭） = B - A
  const diff = counters.b - counters.a;

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
      <h1 style={{ fontSize: '28px', margin: 0 }}>
        リアルタイム共有カウンター
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Counter
          label="先頭カウンター"
          value={counters.a}
          onIncrement={incrementA}
          onDecrement={decrementA}
          onReset={resetA}
        />
        <Counter
          label="最後尾カウンター"
          value={counters.b}
          onIncrement={incrementB}
          onDecrement={decrementB}
          onReset={resetB}
        />
      </div>

      {/* 差分表示 */}
      <div
        style={{
          marginTop: '8px',
          fontSize: '16px',
          textAlign: 'center',
        }}
      >
        並んでいる人数（最後尾カウンター - 先頭カウンター）：{' '}
        <span style={{ fontWeight: 'bold' }}>{diff}</span>
      </div>

      {/* 記録ボタン */}
      <div style={{ marginTop: '8px' }}>
        <button
          onClick={record}
          style={{
            fontSize: '16px',
            padding: '8px 16px',
            borderRadius: '999px',
            border: '1px solid #ccc',
            cursor: 'pointer',
            background: '#f0f0f0',
          }}
        >
          記録
        </button>
      </div>

      {/* 記録ステータス */}
      {recordStatus && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#555',
            textAlign: 'center',
          }}
        >
          {recordStatus}
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '12px', color: '#777' }}>
        接続状態:{' '}
        <span
          style={{ fontWeight: 'bold', color: connected ? 'green' : 'red' }}
        >
          {connected ? 'オンライン' : 'オフライン'}
        </span>
      </div>
    </div>
  );
}

export default App;
