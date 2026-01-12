import React from 'react';

const CurrentGauge = ({ value, min, max, title, unit }) => {

  /* ===============================
     1️⃣ SANITIZE FIRST (TABLE LOGIC)
     =============================== */
  const numericCurrent =
    value === undefined ||
    value === null ||
    value === '' ||
    isNaN(Number(value)) ||
    Number(value) <= 0
      ? null
      : Number(value);

  /* SENSOR FAULT */
  if (numericCurrent === -999) {
    return (
      <div className="gauge-container current-gauge fault">
        <div className="gauge-title">{title}</div>
        <div className="gauge-value">SENSOR FAULT</div>
        <div className="gauge-unit">{unit}</div>
      </div>
    );
  }

  /* NO VALID DATA (backend hiccup, websocket delay, etc.) */
  if (numericCurrent === null) {
    return (
      <div className="gauge-container current-gauge">
        <div className="gauge-title">{title}</div>
        <div className="gauge-value">--</div>
        <div className="gauge-unit">{unit}</div>
        <div className="gauge-status">Waiting for data</div>
      </div>
    );
  }

  /* ===============================
     2️⃣ CLAMP ONLY FOR BAR DISPLAY
     =============================== */
  const clampedCurrent = Math.min(max, Math.max(min, numericCurrent));

  /* Convert Amps → % ONLY here */
  const loadPercentage =
    ((clampedCurrent - min) / (max - min)) * 100;

  const safeLoadPercentage = Math.min(100, Math.max(0, loadPercentage));

  /* ===============================
     3️⃣ AMPS-BASED STATUS & COLOR
     =============================== */
  const getColor = (current) => {
    if (current < 0.35) return '#2ed573';   // Light
    if (current < 0.5) return '#ffa502';    // Normal
    if (current < 0.6) return '#ff7b00';    // Heavy
    return '#ff4757';                       // Overload
  };

  const getCurrentStatus = (current) => {
    if (current < 0.35) return 'Light Load';
    if (current < 0.5) return 'Normal Load';
    if (current < 0.6) return 'Heavy Load';
    return 'Overload';
  };

  const status = getCurrentStatus(numericCurrent);
  const statusColor = getColor(numericCurrent);

  /* ===============================
     4️⃣ RENDER
     =============================== */
  return (
    <div className="gauge-container current-gauge">
      <div className="gauge-title">{title}</div>

      <div className="gauge-value">
        {numericCurrent.toFixed(3)}
      </div>

      <div className="gauge-unit">{unit}</div>

      <div className="gauge-status" style={{ color: statusColor }}>
        {status}
      </div>

      <div className="gauge-bar">
        <div
          className="gauge-fill"
          style={{
            width: `${safeLoadPercentage}%`,
            background: `linear-gradient(90deg, #2ed573, ${statusColor})`
          }}
        />
      </div>

      <div className="gauge-labels">
        <span>{min}{unit}</span>
        <span className="rated-current">Normal: 0.25{unit}</span>
        <span>{max}{unit}</span>
      </div>

      <div className="load-percentage">
        Load: {safeLoadPercentage.toFixed(0)}%
      </div>

      <div className="current-thresholds">
        <div className="threshold-item">
          <span className="threshold-dot" style={{ background: '#2ed573' }} />
          <span>Light: &lt; 0.35A</span>
        </div>
        <div className="threshold-item">
          <span className="threshold-dot" style={{ background: '#ff4757' }} />
          <span>Overload: &gt; 0.6A</span>
        </div>
      </div>
    </div>
  );
};

CurrentGauge.defaultProps = {
  min: 0.2,
  max: 0.8,
  title: 'CURRENT',
  unit: 'A'
};

export default CurrentGauge;
