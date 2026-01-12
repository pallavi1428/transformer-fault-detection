import React from 'react';
import '../Dashboard.css';

const RealTimeTable = ({ data, isSimulating, simulationValues }) => {
  // Use simulation data if active, otherwise use real data
  const displayData = isSimulating && simulationValues ? {
    ...data,
    voltage: simulationValues.voltage,
    current: simulationValues.current,
    temperature: simulationValues.temperature,
    power: (simulationValues.voltage * simulationValues.current).toFixed(3),
    estimated_ac: simulationValues.voltage ? ((simulationValues.voltage + 1.4) / 1.414).toFixed(3) : '--'
  } : data || {};

  // Safe format function
  const formatValue = (value, decimals = 3) => {
    if (value === undefined || value === null || value === "") return '--';
    const numValue = Number(value);
    if (isNaN(numValue)) return '--';
    if (numValue === -999) return 'SENSOR FAULT';
    
    return numValue.toFixed(decimals);
  };

  const formatTemperature = (temp) => {
    if (temp === undefined || temp === null || temp === "") return '--';
    const numTemp = Number(temp);
    if (isNaN(numTemp)) return '--';
    if (numTemp === -999) return 'SENSOR FAULT';
    return numTemp.toFixed(1);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '--';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '--';
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      return '--';
    }
  };

  return (
    <div className="table-wrapper left-table">
      <h2 className="table-header">
        TRANSFORMER DATA
        {/* <span className="status-indicator">
          {isSimulating ? '⚡ SIMULATION' : '📡 LIVE'}
        </span> */}
      </h2>
      
      <div className="table-content">
        {isSimulating && (
          <div className="simulation-indicator">
            ⚡ SIMULATION MODE ACTIVE
          </div>
        )}
        
        {/* Raw Sensor Readings Section */}
        <div className="table-section">
          <h3 className="section-title">RAW ESP32 SENSOR READINGS</h3>
          <div className="data-row">
            <span className="parameter">
              <span className="parameter-name">DC Voltage</span>
              <span className="parameter-desc"></span>
            </span>
            <span className="value">
              {formatValue(displayData.voltage, 3)}
              <span className="unit">V</span>
            </span>
          </div>
          
          <div className="data-row">
            <span className="parameter">
              <span className="parameter-name">Current</span>
              
            </span>
            <span className="value">
              {formatValue(displayData.current, 3)}
              <span className="unit">A</span>
            </span>
          </div>
          
          <div className="data-row">
            <span className="parameter">
              <span className="parameter-name">Power</span>
              <span className="parameter-desc"> V × I (Instantaneous)</span>
            </span>
            <span className="value">
              {formatValue(displayData.power, 3)}
              <span className="unit">W</span>
            </span>
          </div>
          
          <div className="data-row">
            <span className="parameter">
              <span className="parameter-name">Temperature</span>

            </span>
            <span className="value">
              {formatTemperature(displayData.temperature)}
              <span className="unit">°C</span>
            </span>
          </div>
        </div>
        
        {/* Calculated Values Section */}
        <div className="table-section">
          <h3 className="section-title">CALCULATED VALUES</h3>
          
          <div className="data-row">
            <span className="parameter">
              <span className="parameter-name">Estimated AC</span>
              <span className="parameter-desc">(DC + 1.4) / 1.414</span>
            </span>
            <span className="value">
              {formatValue(displayData.estimated_ac, 3)}
              <span className="unit">V</span>
            </span>
          </div>
          
          <div className="data-row">
            <span className="parameter">
              <span className="parameter-name">Power Factor</span>
              <span className="parameter-desc">Estimated</span>
            </span>
            <span className="value">
              0.95
              <span className="unit">PF</span>
            </span>
          </div>
          
          <div className="data-row">
            <span className="parameter">
              <span className="parameter-name">Apparent Power</span>
              <span className="parameter-desc"> S = VI/PF</span>
            </span>
            <span className="value">
              {displayData.voltage && displayData.current ? 
                ((displayData.voltage * displayData.current) / 0.95).toFixed(3) : '--'}
              <span className="unit">VA</span>
            </span>
          </div>
        </div>
        
        {/* System Info Section */}
        <div className="table-section">
          <h3 className="section-title">SYSTEM INFO</h3>
          
          <div className="data-row">
            <span className="parameter">
              <span className="parameter-name">Timestamp</span>
              <span className="parameter-desc">Measurement Time</span>
            </span>
            <span className="value timestamp">
              {formatTimestamp(displayData.pc_timestamp || displayData.timestamp)}
            </span>
          </div>
          
          <div className="data-row">
            {/* <span className="parameter">
              <span className="parameter-name">Sample Rate</span>
              <span className="parameter-desc">Data Collection</span>
            </span>
            <span className="value">
              2
              <span className="unit">Hz</span>
            </span> */}
          {/* </div>
          
          <div className="data-row">
            <span className="parameter">
              <span className="parameter-name">Sensor Status</span>
              <span className="parameter-desc">Health Check</span>
            </span> */}
            {/* <span className="value status-indicator">
              {displayData.temperature === -999 ? 
                <span className="status-bad">FAULT</span> : 
                <span className="status-good">OK</span>
              }
            </span> */}
          </div>
        </div>
      </div>
      
      <div className="table-footer">
        
        
      </div>
    </div>
  );
};

export default RealTimeTable;