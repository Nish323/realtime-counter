import './Counter.css';

function Counter({ label, value, onIncrement, onDecrement, onReset }) {
  const handleResetClick = () => {
    const isConfirmed = window.confirm(
      `${label} を本当にリセットしますか？\n（現在値: ${value}）`
    );

    if (isConfirmed) {
      onReset();
    }
  };

  return (
    <div className="counter">
      <h2 className="counter-title">{label}</h2>

      <div className="counter-value">{value}</div>

      <div className="counter-buttons">
        <button
          onClick={onIncrement}
          className="counter-button counter-button--increment"
        >
          ＋1
        </button>

        <button
          onClick={onDecrement}
          className="counter-button counter-button--increment"
        >
          ー1
        </button>

        <button
          onClick={handleResetClick}
          className="counter-button counter-button--reset"
        >
          リセット
        </button>
      </div>
    </div>
  );
}

export default Counter;
