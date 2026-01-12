import React from 'react';

const PredictionHistory = ({ logs, title }) => {
  return (
    <div className="status-panel">
      {/* <h3 className="section-title">{title}</h3>
      <div className="history-list">
        {logs.map((log, index) => (
          <div key={index} className="history-item">
            <div className="history-time">
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className={`history-status ${log.prediction.toLowerCase()}`}>
              {log.prediction}
            </div>
            <div className="history-confidence">
              {log.confidence}%
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default PredictionHistory;