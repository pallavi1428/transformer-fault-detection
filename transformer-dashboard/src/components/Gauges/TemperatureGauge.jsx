import React from 'react';

const TemperatureGauge = ({ value, min, max, title, unit }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  const getColor = (percent) => {
    if (percent < 30) return '#2ed573';
    if (percent < 70) return '#ffa502';
    return '#ff4757';
  };

  return (
    <div className="gauge-container">
      <div className="gauge-title">{title}</div>
      <div className="gauge-value">{value.toFixed(1)}</div>
      <div className="gauge-unit">{unit}</div>
      <div className="gauge-bar">
        <div 
          className="gauge-fill"
          style={{
            width: `${Math.min(100, Math.max(0, percentage))}%`,
            background: getColor(percentage)
          }}
        ></div>
      </div>
      <div className="gauge-labels">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

export default TemperatureGauge;