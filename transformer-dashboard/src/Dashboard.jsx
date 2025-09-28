import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Color scheme for different fault types
const faultColors = {
  "Normal": "#10b981",
  "Overheating": "#ef4444", 
  "Winding Fault": "#f59e0b",
  "Insulation Degradation": "#8b5cf6",
  "Core Fault": "#06b6d4",
  "Partial Discharge": "#ec4899"
};

// Gauge component for better visualization
const GaugeCard = ({ title, value, unit, min, max, color = "#3b82f6" }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg"
    >
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>
      <div className="relative h-24 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={10}
            data={[{ name: title, value: percentage, fill: color }]}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              minAngle={15}
              background={{ fill: "#374151" }}
              clockWise
              dataKey="value"
              cornerRadius={5}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{unit}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </motion.div>
  );
};

// Fault status card with animations
const FaultStatusCard = ({ prediction, probability, timestamp }) => {
  const getFaultIcon = (fault) => {
    const icons = {
      "Normal": "✅",
      "Overheating": "🔥",
      "Winding Fault": "⚡", 
      "Insulation Degradation": "🛡️",
      "Core Fault": "🧲",
      "Partial Discharge": "💥"
    };
    return icons[fault] || "❓";
  };

  return (
    <motion.div
      key={timestamp}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-6 bg-gray-800 rounded-2xl border-2 shadow-xl"
      style={{ borderColor: faultColors[prediction] }}
    >
      <div className="text-center">
        <div className="text-4xl mb-2">{getFaultIcon(prediction)}</div>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">Current Status</h2>
        
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-3xl font-bold mb-2"
          style={{ color: faultColors[prediction] }}
        >
          {prediction}
        </motion.div>
        
        <div className="text-2xl font-mono mb-4">
          {probability}% <span className="text-sm text-gray-400">confidence</span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${probability}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-3 rounded-full"
            style={{ backgroundColor: faultColors[prediction] }}
          />
        </div>
        
        <div className="text-xs text-gray-400 mt-4">
          Last updated: {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    let interval;
    
    if (isRunning) {
      interval = setInterval(() => {
        fetch("http://127.0.0.1:8000/api/random-sample")
          .then((res) => res.json())
          .then((newData) => {
            setData(newData);
            setLogs((prev) => [newData, ...prev].slice(0, 8));
            
            // Update chart data
            setChartData((prev) => [
              ...prev.slice(-19), // Keep last 20 data points
              {
                time: new Date().toLocaleTimeString(),
                temperature: newData.features.Temperature_C,
                vibration: newData.features.Vibration_g * 100, // Scale for visibility
                thd: newData.features.THD_Current_pct,
                fault: newData.prediction
              }
            ]);
          })
          .catch(console.error);
      }, 3000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Initializing transformer monitoring system...</p>
        </div>
      </div>
    );
  }

  // Prepare gas data for pie chart
  const gasData = [
    { name: 'H₂', value: data.features.H2_ppm, color: '#fbbf24' },
    { name: 'CH₄', value: data.features.CH4_ppm, color: '#60a5fa' },
    { name: 'C₂H₂', value: data.features.C2H2_ppm, color: '#f472b6' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ⚡ Smart Transformer Monitor
          </h1>
          <p className="text-gray-400 mt-2">Real-time fault detection & predictive maintenance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isRunning ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {isRunning ? 'LIVE' : 'PAUSED'}
          </div>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {isRunning ? '⏸️ Pause' : '▶️ Resume'}
          </button>
        </div>
      </motion.header>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column - Key Metrics */}
        <div className="col-span-3 space-y-4">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Key Parameters</h2>
          
          <GaugeCard 
            title="Primary Voltage" 
            value={Math.round(data.features.VoltagePrimary_V)} 
            unit="V" 
            min={10000} 
            max={12000}
            color="#10b981"
          />
          
          <GaugeCard 
            title="Temperature" 
            value={Math.round(data.features.Temperature_C)} 
            unit="°C" 
            min={50} 
            max={120}
            color="#ef4444"
          />
          
          <GaugeCard 
            title="Current Load" 
            value={Math.round(data.features.CurrentSecondary_A)} 
            unit="A" 
            min={800} 
            max={1800}
            color="#3b82f6"
          />
          
          <GaugeCard 
            title="Power Factor" 
            value={data.features.PowerFactor.toFixed(2)} 
            unit="" 
            min={0.7} 
            max={1.0}
            color="#8b5cf6"
          />
        </div>

        {/* Center Column - Status & Charts */}
        <div className="col-span-6 space-y-6">
          {/* Fault Status */}
          <FaultStatusCard 
            prediction={data.prediction}
            probability={data.probability}
            timestamp={data.timestamp}
          />

          {/* Live Trends Chart */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-4">Live Parameter Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  name="Temperature (°C)"
                />
                <Line 
                  type="monotone" 
                  dataKey="vibration" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
                  name="Vibration (x100)"
                />
                <Line 
                  type="monotone" 
                  dataKey="thd" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={false}
                  name="THD Current (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gas Analysis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-2xl p-4">
              <h3 className="text-lg font-semibold mb-4">Dissolved Gas Analysis</h3>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={gasData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {gasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-2 text-xs">
                {gasData.map((gas) => (
                  <div key={gas.name} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: gas.color }}
                    />
                    {gas.name}: {gas.value}ppm
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Importance */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <h3 className="text-lg font-semibold mb-4">Top Contributors</h3>
              <div className="space-y-2">
                {data.top_features?.map(([feature, importance], index) => (
                  <div key={feature} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{feature}</span>
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${importance * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {(importance * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Logs & Details */}
        <div className="col-span-3 space-y-6">
          {/* Prediction History */}
          <div className="bg-gray-800 rounded-2xl p-4 h-96 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Prediction History</h3>
            <div className="space-y-3 overflow-y-auto h-80">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div
                    key={log.timestamp + index}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="p-3 bg-gray-700 rounded-lg border-l-4"
                    style={{ borderLeftColor: faultColors[log.prediction] }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div 
                          className="font-semibold"
                          style={{ color: faultColors[log.prediction] }}
                        >
                          {log.prediction}
                        </div>
                        <div className="text-sm text-gray-400">
                          {log.probability}% confidence
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gray-800 rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Data Source</span>
                <span className="text-green-400">● Live Simulation</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Model Accuracy</span>
                <span className="text-blue-400">95.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Last Update</span>
                <span className="text-gray-400">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Samples Processed</span>
                <span className="text-gray-400">{logs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}