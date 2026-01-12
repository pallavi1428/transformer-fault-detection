import React, { useEffect, useRef } from 'react';

const WebSocketManager = ({ onDataUpdate, onPredictionUpdate, onConnectionStatus }) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isConnectingRef = useRef(false);

  const connectWebSocket = () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;
    
    try {
      console.log('🔗 Connecting to WebSocket...');
      const ws = new WebSocket('ws://localhost:8000/ws');
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected to backend');
        isConnectingRef.current = false;
        onConnectionStatus(true);
        
        // Start ping interval (every 30 seconds)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received:', data.type);
          
          switch(data.type) {
            case 'init':
              console.log('🚀 Initialized:', data.message);
              // Request initial data
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'get_sample' }));
                }
              }, 1000);
              break;
              
            case 'live_data':
              console.log('📊 Live data:', data.data);
              console.log('🎯 Prediction:', data.prediction);
              
              if (data.data) {
                // Ensure data has all required fields
                const processedData = {
                  ...data.data,
                  timestamp: data.data.timestamp || new Date().toISOString(),
                  pc_timestamp: data.data.pc_timestamp || new Date().toISOString()
                };
                onDataUpdate(processedData);
              }
              if (data.prediction) {
                onPredictionUpdate(data.prediction);
              }
              break;
              
            case 'simulation_data':
              if (data.data && data.prediction) {
                onDataUpdate(data.data);
                onPredictionUpdate(data.prediction);
              }
              break;
              
            case 'error':
              console.error('❌ WebSocket error:', data.message);
              break;
              
            case 'pong':
              console.log('🏓 Pong received');
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error, 'Raw:', event.data);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error event:', error);
        isConnectingRef.current = false;
        onConnectionStatus(false);
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        isConnectingRef.current = false;
        onConnectionStatus(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Don't reconnect if we closed it intentionally
        if (event.code !== 1000) {
          // Try to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Reconnecting...');
            connectWebSocket();
          }, 5000);
        }
      };
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      isConnectingRef.current = false;
      onConnectionStatus(false);
      
      // Try again after 10 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 10000);
    }
  };

  useEffect(() => {
    console.log('🔧 WebSocketManager mounting...');
    connectWebSocket();
    
    // Cleanup
    return () => {
      console.log('🧹 WebSocketManager unmounting...');
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, []);

  return null;
};

export default WebSocketManager;