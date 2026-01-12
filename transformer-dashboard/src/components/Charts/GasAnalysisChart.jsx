import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const GasAnalysisChart = ({ h2, ch4, c2h2, title }) => {
  const data = [
    { name: 'H₂', value: h2, color: '#fbbf24' },
    { name: 'CH₄', value: ch4, color: '#60a5fa' },
    { name: 'C₂H₂', value: c2h2, color: '#f472b6' },
    { name: 'Other Gases', value: 5, color: '#10b981' }
  ];

  return (
    <div className="quick-chart">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GasAnalysisChart;