import React, { useRef } from 'react';

const PowerGauge = ({ value, min, max, title, unit }) => {
  const lastValidRef = useRef(null);

  /* ===============================
     🔒 HARD SANITIZER (CRITICAL)
     =============================== */
  const sanitizePower = (raw) => {
    if (raw === undefined || raw === null || raw === '') return null;

    let num = Number(raw);
    if (!Number.isFinite(num)) return null;

    /* 🚨 SCIENTIFIC / SCALED VALUE FIX */
    if (num > 1000) {
      // Try common scalings
      if (num <= 1e6) num = num / 1000;   // mW → W
      else if (num <= 1e9) num = num / 1e6; // µW → W
      else return null; // totally invalid
    }

    /* 🚨 FINAL SAFETY CLAMP */
    if (num < 0 || num > max * 2) return null;

    return num;
  };

  const sanitized = sanitizePower(value);

  if (sanitized !== null) {
    lastValidRef.current = sanitized;
  }

  if (lastValidRef.current === null) {
    return (
      <div className="gauge-container power-gauge">
        <div className="gauge-title">{title}</div>
        <div className="gauge-value">--</div>
        <div className="gauge-unit">{unit}</div>
        <div className="gauge-status">Waiting for data</div>
      </div>
    );
  }

  const numericPower = lastValidRef.current;

  /* ===============================
     SAFE VISUAL SCALE
     =============================== */
  const percentage = ((numericPower - min) / (max - min)) * 100;
  const safePercentage = Math.min(100, Math.max(0, percentage));

  const getColor = (p) => {
    if (p < 30) return '#6b7280';
    if (p < 60) return '#3b82f6';
    if (p < 85) return '#8b5cf6';
    return '#ec4899';
  };

  const getStatus = (p) => {
    if (p < 30) return 'Idle';
    if (p < 60) return 'Moderate';
    if (p < 85) return 'High';
    return 'Peak';
  };

  const statusColor = getColor(safePercentage);
  const status = getStatus(safePercentage);

  const powerFactor = Math.min(0.95, 0.8 + safePercentage * 0.0015);
  const efficiency = Math.min(100, 85 + safePercentage * 0.15);

  return (
    <div className="gauge-container power-gauge">
      <div className="gauge-title">{title}</div>

      <div className="gauge-value">
        {numericPower.toFixed(3)}
      </div>

      <div className="gauge-unit">W</div>

      <div className="gauge-status" style={{ color: statusColor }}>
        {status} Power
      </div>

      <div className="gauge-bar">
        <div
          className="gauge-fill"
          style={{
            width: `${safePercentage}%`,
            background: `linear-gradient(90deg, #6b7280, ${statusColor}, #ec4899)`
          }}
        />
      </div>

      <div className="gauge-labels">
        <span>{min}W</span>
        <span className="efficiency">
          Efficiency: {efficiency.toFixed(0)}%
        </span>
        <span>{max}W</span>
      </div>
    </div>
  );
};

PowerGauge.defaultProps = {
  min: 0,
  max: 15,   // ✅ real electrical range
  title: 'POWER',
  unit: 'W'
};

export default PowerGauge;
