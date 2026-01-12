import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LiveTrendChart = ({ data, title }) => {
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af"
            fontSize={11}
            tick={{ fill: '#9ca3af' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={11}
            tick={{ fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(10, 10, 10, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px'
            }}
            itemStyle={{ color: '#ffffff', padding: '4px 0' }}
          />
          <Line 
            type="monotone" 
            dataKey="voltage" 
            stroke="#00d4ff" 
            strokeWidth={2}
            dot={false}
            name="Voltage (V)"
          />
          <Line 
            type="monotone" 
            dataKey="current" 
            stroke="#2ed573" 
            strokeWidth={2}
            dot={false}
            name="Current (A)"
          />
          <Line 
            type="monotone" 
            dataKey="temperature" 
            stroke="#ff4757" 
            strokeWidth={2}
            dot={false}
            name="Temperature (°C)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LiveTrendChart;