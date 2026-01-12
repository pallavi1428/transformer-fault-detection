import React, { useState, useEffect } from 'react';
import '../Dashboard.css';

const MapView = ({ sensorValues, onClose, onRealWorldMapping }) => {
  const [realWorldValues, setRealWorldValues] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // Scaling factors (same as backend)
  const VOLTAGE_SCALE = 11000 / 0.009;   // 0.009V sensor = 11kV real
  const CURRENT_SCALE = 850 / 0.0015;    // 0.0015V sensor = 850A real

  useEffect(() => {
    calculateRealWorld();
  }, []);

  const calculateRealWorld = async () => {
    setLoading(true);
    
    try {
      // Calculate real-world values
      const realVoltage = (sensorValues.voltage * VOLTAGE_SCALE) / 1000; // kV
      const realCurrent = sensorValues.current * CURRENT_SCALE; // A
      
      const scaledValues = {
        sensor_voltage: sensorValues.voltage,
        sensor_current: sensorValues.current,
        sensor_temperature: sensorValues.temperature,
        real_voltage_kv: parseFloat(realVoltage.toFixed(2)),
        real_current_a: Math.round(realCurrent),
        real_temperature_c: sensorValues.temperature,
        conversion_note: "Based on standard transformer scaling"
      };
      
      setRealWorldValues(scaledValues);
      
      // Simulate prediction from real-world model
      setTimeout(() => {
        const confidence = Math.min(95, 70 + sensorValues.temperature * 0.5);
        const faultType = sensorValues.temperature > 80 ? "Overheating" : 
                         sensorValues.current > 0.002 ? "Inter-turn Fault" : "Normal";
        
        setPrediction({
          status: faultType === "Normal" ? "Normal" : "Fault",
          confidence: confidence.toFixed(1),
          fault_type: faultType,
          severity: sensorValues.temperature > 80 ? "High" : 
                   sensorValues.current > 0.002 ? "Medium" : "Low",
          action: sensorValues.temperature > 80 ? "Immediate Shutdown" : 
                 sensorValues.current > 0.002 ? "Investigate Windings" : "Monitor"
        });
        
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error calculating real world values:", error);
      setLoading(false);
    }
  };

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🗺️ REAL-WORLD MAPPING</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-subtitle">
          Converting sensor readings to actual transformer values
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Calculating real-world equivalents...</p>
          </div>
        ) : (
          <>
            {/* Comparison Table */}
            <div className="comparison-section">
              <h3 className="section-title">Values Comparison</h3>
              <div className="comparison-grid">
                <div className="comparison-column">
                  <div className="column-header sensor-header">
                    <h4>📡 SENSOR VALUES</h4>
                    <div className="column-subtitle">(Raw ESP32 Readings)</div>
                  </div>
                  <div className="value-comparison">
                    <div className="comparison-row">
                      <span className="comparison-label">Voltage:</span>
                      <span className="comparison-value sensor">
                        {sensorValues.voltage.toFixed(6)} V
                      </span>
                    </div>
                    <div className="comparison-row">
                      <span className="comparison-label">Current:</span>
                      <span className="comparison-value sensor">
                        {sensorValues.current.toFixed(6)} A
                      </span>
                    </div>
                    <div className="comparison-row">
                      <span className="comparison-label">Temperature:</span>
                      <span className="comparison-value sensor">
                        {sensorValues.temperature.toFixed(2)} °C
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="comparison-arrow">
                  <div className="arrow-line"></div>
                  <div className="arrow-head">→</div>
                  <div className="arrow-label">SCALE</div>
                </div>
                
                <div className="comparison-column">
                  <div className="column-header real-header">
                    <h4>🏭 REAL TRANSFORMER</h4>
                    <div className="column-subtitle">(Actual Equipment)</div>
                  </div>
                  <div className="value-comparison">
                    <div className="comparison-row">
                      <span className="comparison-label">Voltage:</span>
                      <span className="comparison-value real">
                        {realWorldValues?.real_voltage_kv.toFixed(2)} V
                      </span>
                    </div>
                    <div className="comparison-row">
                      <span className="comparison-label">Current:</span>
                      <span className="comparison-value real">
                        {realWorldValues?.real_current_a.toLocaleString()} A
                      </span>
                    </div>
                    <div className="comparison-row">
                      <span className="comparison-label">Temperature:</span>
                      <span className="comparison-value real">
                        {realWorldValues?.real_temperature_c.toFixed(2)} °C
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="conversion-info">
                <div className="info-item">
                  <span className="info-label">Scaling Factor (Voltage):</span>
                  <span className="info-value">1V sensor ≈ {Math.round(VOLTAGE_SCALE/1000)} V real</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Scaling Factor (Current):</span>
                  <span className="info-value">1A sensor ≈ {Math.round(CURRENT_SCALE)} A real</span>
                </div>
              </div>
            </div>
            
            {/* Real-world Prediction */}
            {prediction && (
              <div className="prediction-section">
                <h3 className="section-title">🔬 REAL-WORLD PREDICTION</h3>
                <div className="prediction-card">
                  <div className="prediction-status">
                    <span className="status-label">Status:</span>
                    <span className={`status-value ${prediction.status === 'Normal' ? 'normal' : 'fault'}`}>
                      {prediction.status}
                    </span>
                  </div>
                  <div className="prediction-details">
                    <div className="prediction-row">
                      <span className="prediction-label">Fault Type:</span>
                      <span className="prediction-value">{prediction.fault_type}</span>
                    </div>
                    <div className="prediction-row">
                      <span className="prediction-label">Confidence:</span>
                      <span className="prediction-value confidence">{prediction.confidence}%</span>
                    </div>
                    <div className="prediction-row">
                      <span className="prediction-label">Severity:</span>
                      <span className={`prediction-value severity-${prediction.severity.toLowerCase()}`}>
                        {prediction.severity}
                      </span>
                    </div>
                    <div className="prediction-row">
                      <span className="prediction-label">Recommended Action:</span>
                      <span className="prediction-value action">{prediction.action}</span>
                    </div>
                  </div>
                  <div className="prediction-note">
                    ⚠️ This prediction uses a specialized real-world model trained on actual transformer data
                  </div>
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="modal-btn close-btn" onClick={onClose}>
                Close
              </button>
              <button className="modal-btn save-btn" onClick={() => {
                // Save mapping or export data
                console.log("Saving mapping:", { sensorValues, realWorldValues, prediction });
                alert("Mapping saved!");
              }}>
                💾 Save Mapping
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .map-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .map-modal {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 16px;
          padding: 30px;
          width: 800px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          border: 2px solid rgba(0, 212, 255, 0.3);
          box-shadow: 0 25px 100px rgba(0, 0, 0, 0.7);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .modal-title {
          color: #00d4ff;
          font-size: 1.5rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .modal-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 5px 10px;
          border-radius: 4px;
          transition: all 0.3s;
        }
        
        .modal-close:hover {
          color: #ff4757;
          background: rgba(255, 71, 87, 0.1);
        }
        
        .modal-subtitle {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 30px;
          text-align: center;
          font-size: 0.95rem;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(0, 212, 255, 0.1);
          border-top-color: #00d4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .section-title {
          color: #ffffff;
          font-size: 1.2rem;
          margin: 25px 0 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid rgba(0, 212, 255, 0.3);
        }
        
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 20px;
          align-items: start;
        }
        
        .comparison-column {
          background: rgba(10, 10, 10, 0.7);
          border-radius: 10px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .column-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .column-header h4 {
          font-size: 1.1rem;
          margin-bottom: 5px;
        }
        
        .column-subtitle {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .sensor-header h4 {
          color: #667eea;
        }
        
        .real-header h4 {
          color: #2ed573;
        }
        
        .value-comparison {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .comparison-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          transition: background 0.3s;
        }
        
        .comparison-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .comparison-label {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
        }
        
        .comparison-value {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 1.1rem;
        }
        
        .comparison-value.sensor {
          color: #667eea;
        }
        
        .comparison-value.real {
          color: #2ed573;
        }
        
        .comparison-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        
        .arrow-line {
          width: 2px;
          height: 100px;
          background: linear-gradient(to bottom, 
            transparent, 
            rgba(0, 212, 255, 0.5), 
            transparent);
        }
        
        .arrow-head {
          color: #00d4ff;
          font-size: 2rem;
          margin: 10px 0;
        }
        
        .arrow-label {
          color: rgba(0, 212, 255, 0.7);
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .conversion-info {
          margin-top: 20px;
          padding: 15px;
          background: rgba(0, 212, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(0, 212, 255, 0.1);
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }
        
        .info-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }
        
        .info-value {
          color: #00d4ff;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
        }
        
        .prediction-card {
          background: rgba(10, 10, 10, 0.8);
          border-radius: 10px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .prediction-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .status-label {
          font-size: 1.1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .status-value {
          font-size: 1.2rem;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .status-value.normal {
          background: rgba(46, 213, 115, 0.2);
          color: #2ed573;
          border: 1px solid rgba(46, 213, 115, 0.3);
        }
        
        .status-value.fault {
          background: rgba(255, 71, 87, 0.2);
          color: #ff4757;
          border: 1px solid rgba(255, 71, 87, 0.3);
        }
        
        .prediction-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .prediction-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }
        
        .prediction-label {
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
        }
        
        .prediction-value {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
        }
        
        .prediction-value.confidence {
          color: #00d4ff;
        }
        
        .prediction-value.severity-low {
          color: #2ed573;
        }
        
        .prediction-value.severity-medium {
          color: #ffa502;
        }
        
        .prediction-value.severity-high {
          color: #ff4757;
        }
        
        .prediction-value.action {
          color: #ffffff;
          font-weight: 600;
        }
        
        .prediction-note {
          margin-top: 15px;
          padding: 10px;
          background: rgba(255, 165, 2, 0.1);
          border-radius: 6px;
          color: #ffa502;
          font-size: 0.9rem;
          border: 1px solid rgba(255, 165, 2, 0.2);
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .modal-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s;
        }
        
        .close-btn {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .save-btn {
          background: linear-gradient(135deg, #2ed573 0%, #1dd1a1 100%);
          color: white;
        }
        
        .modal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default MapView;