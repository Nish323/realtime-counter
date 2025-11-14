// src/components/Counter.jsx
function Counter({ label, value, onIncrement, onReset }) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '220px',
      }}
    >
      <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '8px' }}>
        {label}
      </h2>
      <div
        style={{
          fontSize: '40px',
          fontWeight: 'bold',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        {value}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={onIncrement}
          style={{
            fontSize: '18px',
            padding: '8px 16px',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ＋1
        </button>
        <button
          onClick={onReset}
          style={{
            fontSize: '14px',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid #ccc',
            cursor: 'pointer',
            background: '#f7f7f7',
          }}
        >
          リセット
        </button>
      </div>
    </div>
  );
}

export default Counter;
