import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FaultProbabilityChart = ({ probabilities, title }) => {
  // Prepare data for pie chart
  const chartData = Object.entries(probabilities || {}).map(([name, value]) => ({
    name: name.length > 10 ? name.substring(0, 10) + '...' : name,
    value: parseFloat(value) || 0,
    fullName: name
  })).filter(item => item.value > 0);

  // Colors for different fault types
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${payload[0].payload.fullName}: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title || "Fault Probabilities"}</h3>
        <div className="no-data">
          <p>No probability data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>{title || "Fault Probabilities"}</h3>
      <div style={{ width: '100%', height: 300, minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FaultProbabilityChart;