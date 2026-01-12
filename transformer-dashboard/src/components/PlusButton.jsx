import React from 'react';
import '../Dashboard.css';

const PlusButton = ({ onClick, disabled }) => {
  return (
    <div className="plus-button-container">
      <button 
        className={`plus-button ${disabled ? 'disabled' : ''}`}
        onClick={onClick}
        disabled={disabled}
        title={disabled ? "Connect to WebSocket first" : "Start simulation"}
      >
        <div className="plus-icon">+</div>
        <div className="plus-label">SIMULATE</div>
      </button>
      {disabled && (
        <div className="tooltip">
          Connect to WebSocket to enable simulation
        </div>
      )}
    </div>
  );
};

export default PlusButton;