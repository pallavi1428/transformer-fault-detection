import React from 'react';
import '../Dashboard.css';

const PredictionTable = ({ prediction, isSimulating }) => {
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'normal':
        return 'prediction-normal';
      case 'warning':
      case 'medium':
        return 'prediction-warning';
      case 'danger':
      case 'high':
        return 'prediction-danger';
      default:
        return '';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity.toLowerCase()) {
      case 'low':
        return '#2ed573';
      case 'medium':
        return '#ffa502';
      case 'high':
        return '#ff4757';
      default:
        return '#ffffff';
    }
  };

  return (
    <div className="table-wrapper right-table">
      <h2 className="table-header">FAULT PREDICTION</h2>
      <div className="table-content">
        {isSimulating && (
          <div className="simulation-indicator">
            ⚡ SIMULATION
          </div>
        )}
        
        <div className="data-row">
          <span className="parameter">Status</span>
          <span className={`value ${getStatusColor(prediction.status)}`}>
            {prediction.status || 'Normal'}
          </span>
        </div>
        
        <div className="data-row">
          <span className="parameter">Fault Type</span>
          <span className="value">
            {prediction.fault_type || 'None'}
          </span>
        </div>
        
        <div className="data-row">
          <span className="parameter">Confidence</span>
          <span className="value">
            {prediction.confidence ? `${prediction.confidence}%` : '0%'}
          </span>
        </div>
        
        <div className="data-row">
          <span className="parameter">Severity</span>
          <span className="value" style={{ color: getSeverityColor(prediction.severity) }}>
            {prediction.severity || 'Low'}
          </span>
        </div>
        
        <div className="data-row">
          <span className="parameter">Action</span>
          <span className="value">
            {prediction.action || 'Monitor'}
          </span>
        </div>
        
        {/* Confidence Bar */}
        <div className="confidence-container">
          <div className="confidence-label">
            <span>Model Confidence</span>
            <span>{prediction.confidence || 0}%</span>
          </div>
          <div className="confidence-bar">
            <div 
              className="confidence-fill"
              style={{ 
                width: `${prediction.confidence || 0}%`,
                background: prediction.confidence > 70 ? 
                  'linear-gradient(90deg, #2ed573, #7bed9f)' :
                  prediction.confidence > 40 ?
                  'linear-gradient(90deg, #ffa502, #ffbe76)' :
                  'linear-gradient(90deg, #ff4757, #ff6b81)'
              }}
            ></div>
          </div>
        </div>
        
        {/* Probabilities */}
        {prediction.all_probabilities && Object.keys(prediction.all_probabilities).length > 0 && (
          <div className="probabilities-section">
            <h4 className="probabilities-title">All Fault Probabilities:</h4>
            {Object.entries(prediction.all_probabilities).map(([fault, prob]) => (
              <div key={fault} className="probability-row">
                <span className="probability-fault">{fault}:</span>
                <span className="probability-value">{prob}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="table-footer">
        <div className="model-info">
          ML Model: Random Forest
        </div>
      </div>
    </div>
  );
};

export default PredictionTable;