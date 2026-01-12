import React, { useRef } from 'react';

const VoltageGauge = ({ value, min, max, title, unit }) => {
  /* ===============================
     1️⃣ STORE LAST VALID VOLTAGE
     =============================== */
  const lastValidRef = useRef(null);

  const parsed = Number(value);

  const isValid =
    value !== undefined &&
    value !== null &&
    value !== '' &&
    !isNaN(parsed) &&
    parsed > 0;

  /* SENSOR FAULT (explicit only) */
  if (parsed === -999) {
    return (
      <div className="gauge-container voltage-gauge fault">
        <div className="gauge-title">{title}</div>
        <div className="gauge-value">SENSOR FAULT</div>
        <div className="gauge-unit">{unit}</div>
      </div>
    );
  }

  /* Update last valid voltage ONLY when valid */
  if (isValid) {
    lastValidRef.current = parsed;
  }

  /* If we NEVER received valid voltage */
  if (lastValidRef.current === null) {
    return (
      <div className="gauge-container voltage-gauge">
        <div className="gauge-title">{title}</div>
        <div className="gauge-value">--</div>
        <div className="gauge-unit">{unit}</div>
        <div className="gauge-status">Waiting for data</div>
      </div>
    );
  }

  /* ===============================
     2️⃣ USE LAST VALID VOLTAGE
     =============================== */
  const voltage = lastValidRef.current;

  const percentage =
    ((Math.min(max, Math.max(min, voltage)) - min) / (max - min)) * 100;

  const safePercentage = Math.min(100, Math.max(0, percentage));

  /* ===============================
     3️⃣ STATUS & COLOR (VOLTS-BASED)
     =============================== */
  const getColor = (v) => {
    if (v > 16.5) return '#ff4757';   // Overvoltage
    if (v > 16.0) return '#ffa502';   // High
    if (v > 15.0) return '#2ed573';   // Normal
    if (v > 14.5) return '#ffa502';   // Low
    return '#ff4757';                 // Undervoltage
  };

  const getVoltageStatus = (v) => {
    if (v > 16.5) return 'Overvoltage';
    if (v > 16.0) return 'High';
    if (v > 15.0) return 'Normal';
    if (v > 14.5) return 'Low';
    return 'Undervoltage';
  };

  const status = getVoltageStatus(voltage);
  const statusColor = getColor(voltage);

  /* ===============================
     4️⃣ RENDER (NO GLITCH)
     =============================== */
  return (
    <div className="gauge-container voltage-gauge">
      <div className="gauge-title">{title}</div>

      <div className="gauge-value">
        {voltage.toFixed(2)}
      </div>

      <div className="gauge-unit">{unit}</div>

      <div className="gauge-status" style={{ color: statusColor }}>
        {status}
      </div>

      <div className="gauge-bar">
        <div
          className="gauge-fill"
          style={{
            width: `${safePercentage}%`,
            background: getColor(voltage)
          }}
        />
      </div>

      <div className="gauge-labels">
        <span>{min}{unit}</span>
        <span className="nominal-voltage">Nominal: 15.6{unit}</span>
        <span>{max}{unit}</span>
      </div>

      <div className="voltage-zones">
        <div className="zone" style={{ background: '#ff4757', width: '15%' }}>
          Low
        </div>
        <div className="zone" style={{ background: '#2ed573', width: '70%' }}>
          Normal
        </div>
        <div className="zone" style={{ background: '#ff4757', width: '15%' }}>
          High
        </div>
      </div>
    </div>
  );
};

VoltageGauge.defaultProps = {
  min: 14,
  max: 18,
  title: 'DC VOLTAGE',
  unit: 'V'
};

export default VoltageGauge;
