import React, { useState, useEffect } from 'react';
import '../Dashboard.css';

const SimulationBox = ({ initialValues, onValueChange, onMapClick, onClose, liveData }) => {
  const [values, setValues] = useState(initialValues || {
    voltage: 0.008,
    current: 0.001,
    temperature: 25.0
  });

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  const handleChange = (param, value) => {
    const newValues = { ...values, [param]: parseFloat(value) || 0 };
    setValues(newValues);
    onValueChange(newValues);
  };

  const handleReset = () => {
    const resetValues = {
      voltage: liveData.voltage || 0.008,
      current: liveData.current || 0.001,
      temperature: liveData.temperature || 25.0
    };
    setValues(resetValues);
    onValueChange(resetValues);
  };

  return (
    <div className="simulation-box">
      <div className="simulation-header">
        <h3 className="simulation-title">⚙️ SIMULATION CONTROLS</h3>
        <button className="close-btn" onClick={onClose} title="Close Simulation">
          ✕
        </button>
      </div>
      
      <div className="simulation-content">
        {/* Current Values Display */}
        <div className="current-values">
          <h4>Current Simulation Values:</h4>
          <div className="values-grid">
            <div className="value-item">
              <span className="value-label">Voltage:</span>
              <span className="value-display">{values.voltage.toFixed(6)} V</span>
            </div>
            <div className="value-item">
              <span className="value-label">Current:</span>
              <span className="value-display">{values.current.toFixed(6)} A</span>
            </div>
            <div className="value-item">
              <span className="value-label">Temperature:</span>
              <span className="value-display">{values.temperature.toFixed(2)} °C</span>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="sliders-container">
          <div className="slider-group">
            <label>
              <span>Voltage: {values.voltage.toFixed(6)} V</span>
              <span className="slider-range">(0.001 - 0.020)</span>
            </label>
            <input
              type="range"
              min="0.001"
              max="0.020"
              step="0.0001"
              value={values.voltage}
              onChange={(e) => handleChange('voltage', e.target.value)}
              className="slider"
            />
          </div>

          <div className="slider-group">
            <label>
              <span>Current: {values.current.toFixed(6)} A</span>
              <span className="slider-range">(0.0001 - 0.010)</span>
            </label>
            <input
              type="range"
              min="0.0001"
              max="0.010"
              step="0.0001"
              value={values.current}
              onChange={(e) => handleChange('current', e.target.value)}
              className="slider"
            />
          </div>

          <div className="slider-group">
            <label>
              <span>Temperature: {values.temperature.toFixed(2)} °C</span>
              <span className="slider-range">(20 - 120)</span>
            </label>
            <input
              type="range"
              min="20"
              max="120"
              step="0.1"
              value={values.temperature}
              onChange={(e) => handleChange('temperature', e.target.value)}
              className="slider"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="action-btn map-btn"
            onClick={onMapClick}
            title="Convert to real-world values"
          >
            <span className="btn-icon">🗺️</span>
            MAP to Real World
          </button>
          
          <button 
            className="action-btn reset-btn"
            onClick={handleReset}
          >
            <span className="btn-icon">↺</span>
            Reset to Live
          </button>
          
          <button 
            className="action-btn apply-btn"
            onClick={() => onValueChange(values)}
          >
            <span className="btn-icon">✓</span>
            Apply Changes
          </button>
        </div>

        {/* Quick Presets */}
        <div className="presets">
          <h4>Quick Presets:</h4>
          <div className="preset-buttons">
            <button 
              className="preset-btn normal"
              onClick={() => handleChange('temperature', 25)}
            >
              Normal (25°C)
            </button>
            <button 
              className="preset-btn warning"
              onClick={() => handleChange('temperature', 65)}
            >
              Warning (65°C)
            </button>
            <button 
              className="preset-btn danger"
              onClick={() => handleChange('temperature', 85)}
            >
              Danger (85°C)
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .simulation-box {
          background: rgba(10, 10, 10, 0.95);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 12px;
          padding: 25px;
          width: 350px;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .simulation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .simulation-title {
          color: #00d4ff;
          font-size: 1.2rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 5px 10px;
          border-radius: 4px;
          transition: all 0.3s;
        }
        
        .close-btn:hover {
          color: #ff4757;
          background: rgba(255, 71, 87, 0.1);
        }
        
        .current-values {
          margin-bottom: 25px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .current-values h4 {
          margin-bottom: 10px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .values-grid {
          display: grid;
          gap: 8px;
        }
        
        .value-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0;
        }
        
        .value-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }
        
        .value-display {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          color: #ffffff;
          font-size: 1rem;
        }
        
        .sliders-container {
          margin-bottom: 25px;
        }
        
        .slider-group {
          margin-bottom: 20px;
        }
        
        .slider-group label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          font-size: 0.95rem;
        }
        
        .slider-range {
          color: rgba(0, 212, 255, 0.7);
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .slider {
          width: 100%;
          height: 8px;
          -webkit-appearance: none;
          background: linear-gradient(90deg, 
            rgba(46, 213, 115, 0.2) 0%, 
            rgba(255, 165, 2, 0.2) 50%, 
            rgba(255, 71, 87, 0.2) 100%);
          border-radius: 4px;
          outline: none;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #00d4ff;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
          transition: all 0.3s;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.8);
        }
        
        .action-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 5px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.8rem;
          transition: all 0.3s;
          gap: 5px;
        }
        
        .btn-icon {
          font-size: 1.2rem;
          margin-bottom: 2px;
        }
        
        .map-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .reset-btn {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .apply-btn {
          background: linear-gradient(135deg, #2ed573 0%, #1dd1a1 100%);
          color: white;
        }
        
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
        
        .presets {
          margin-top: 20px;
        }
        
        .presets h4 {
          margin-bottom: 10px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .preset-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        
        .preset-btn {
          padding: 8px 5px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.75rem;
          transition: all 0.3s;
        }
        
        .preset-btn.normal {
          background: rgba(46, 213, 115, 0.2);
          color: #2ed573;
          border: 1px solid rgba(46, 213, 115, 0.3);
        }
        
        .preset-btn.warning {
          background: rgba(255, 165, 2, 0.2);
          color: #ffa502;
          border: 1px solid rgba(255, 165, 2, 0.3);
        }
        
        .preset-btn.danger {
          background: rgba(255, 71, 87, 0.2);
          color: #ff4757;
          border: 1px solid rgba(255, 71, 87, 0.3);
        }
        
        .preset-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default SimulationBox;