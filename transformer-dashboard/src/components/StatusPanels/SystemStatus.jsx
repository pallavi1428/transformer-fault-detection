import React from 'react';

const SystemStatus = ({ serialConnected, isSimulating, confidence, title }) => {
  return (
    <div className="status-panel">
      {/* <h3 className="section-title">{title}</h3>
      <div className="status-grid">
        <div className="status-item">
          <span className="status-label">Data Source</span>
          <span className={`status-value ${serialConnected ? 'connected' : 'disconnected'}`}>
            {serialConnected ? 'ESP32 COM8' : 'Simulation'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Mode</span>
          <span className={`status-value ${isSimulating ? 'simulating' : 'live'}`}>
            {isSimulating ? 'Simulation' : 'Live'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Model Confidence</span>
          <span className="status-value confidence">
            {confidence.toFixed(1)}%
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Uptime</span>
          <span className="status-value">99.8%</span>
        </div>
      </div> */}
    </div>
  );
};

export default SystemStatus;