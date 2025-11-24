import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Counter from './components/Counter/Counter';

const socket = io();

function App() {
  const [counters, setCounters] = useState({ a: 0, b: 0 });
  const [connected, setConnected] = useState(false);
  const [recordStatus, setRecordStatus] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedValue, setSelectedValue] = useState(0);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // サーバーから2つ分まとめて受け取る
    socket.on('countersUpdated', (newCounters) => {
      setCounters(newCounters);
    });

    // 最後尾の更新
    socket.on('selectedValueUpdated', (newValue) => {
      setSelectedValue(newValue);
    });

    // isRecordingを更新
    socket.on('recordingStatusUpdated', (status) => {
      setIsRecording(status.isRecording);
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

    socket.on('recordStopped', (result) => {
      if (result.success) {
        setIsRecording(false);
      }
      setRecordStatus(result.message || '記録を終了しました');
      setTimeout(() => setRecordStatus(null), 2000);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('countersUpdated');
      socket.off('selectedValueUpdated');
      socket.off('recordSaved');
      socket.off('recordingStatusUpdated');
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

  // レコード終了ボタン
  const recordStop = () => socket.emit('recordStop');

  // 選択値が変更されたときにサーバーに通知する関数
  const handleValueChange = (e) => {
    const newValue = Number(e.target.value);
    setSelectedValue(newValue);
    socket.emit('updateSelectedValue', newValue);
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
      <h1 style={{ fontSize: '28px', margin: 0 }}>
        リアルタイム共有カウンター
      </h1>

      {/* 差分表示 */}
      <div
        style={{
          fontSize: '24px',
          textAlign: 'center',
        }}
      >
        並んでいる人数： <span style={{ fontWeight: 'bold' }}>{diff}</span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '24px',
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

      {/* 0-25の選択UI */}
      <div style={{ fontSize: '18px', textAlign: 'center' }}>
        最後尾の位置番号
        <select
          value={selectedValue}
          onChange={handleValueChange}
          style={{
            fontSize: '18px',
            padding: '4px 8px',
            marginLeft: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          {Array.from({ length: 26 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      {/* 記録ボタン */}
      <div
        style={{
          marginTop: '8px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={record}
          disabled={isRecording} // 記録中の場合は無効化
          style={{
            fontSize: '16px',
            padding: '8px 16px',
            borderRadius: '999px',
            border: '1px solid #007bff',
            cursor: isRecording ? 'not-allowed' : 'pointer',
            background: isRecording ? '#ccc' : '#e6f2ff',
            color: isRecording ? '#888' : '#007bff',
            fontWeight: 'bold',
          }}
        >
          記録開始
        </button>
        <button
          onClick={recordStop}
          disabled={!isRecording} // 記録中ではない場合は無効化
          style={{
            fontSize: '16px',
            padding: '8px 16px',
            borderRadius: '999px',
            border: '1px solid #dc3545',
            cursor: !isRecording ? 'not-allowed' : 'pointer',
            background: !isRecording ? '#ccc' : '#ffe6e8',
            color: !isRecording ? '#888' : '#dc3545',
            fontWeight: 'bold',
          }}
        >
          記録終了
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

      <div
        style={{
          marginTop: '-16px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: isRecording ? '#007bff' : '#555',
        }}
      >
        自動記録: {isRecording ? '動作中' : '停止中'}
      </div>

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
