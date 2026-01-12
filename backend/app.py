from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import joblib
import numpy as np
from datetime import datetime
import random
import logging
import asyncio
import json
import os
from typing import Dict, List, Optional
from contextlib import asynccontextmanager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables
model = None
scaler = None
data = None
fault_labels = {}
label_to_code = {}
all_features = []
connections = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    await startup()
    yield
    await shutdown()

async def startup():
    global model, scaler, data, fault_labels, label_to_code, all_features
    
    try:
        # Load dataset
        data = pd.read_csv("esp32_transformer_slightly_unpleasant.csv")
        logger.info(f"✅ Dataset loaded. Shape: {data.shape}")
        
        # Get unique fault labels
        unique_labels = sorted(data['fault_label'].unique())
        fault_labels = {i: label for i, label in enumerate(unique_labels)}
        label_to_code = {label: i for i, label in enumerate(unique_labels)}
        logger.info(f"🎯 Fault labels: {list(fault_labels.values())}")
        
        # Load model
        model_files = [
            "transformer_fault_xgboost.pkl",
            "transformer_fault_random_forest.pkl",
            "transformer_fault_lightgbm.pkl"
        ]
        
        model = None
        for model_file in model_files:
            if os.path.exists(model_file):
                model = joblib.load(model_file)
                logger.info(f"✅ Loaded model: {model_file}")
                break
        
        if model is None:
            logger.warning("⚠️ No model file found. Using dummy model.")
            from sklearn.dummy import DummyClassifier
            model = DummyClassifier(strategy="constant", constant=label_to_code.get("NORMAL", 0))
            dummy_X = np.random.randn(100, 15)
            dummy_y = np.full(100, label_to_code.get("NORMAL", 0))
            model.fit(dummy_X, dummy_y)
        
        # Load scaler
        if os.path.exists("transformer_scaler.pkl"):
            scaler = joblib.load("transformer_scaler.pkl")
            logger.info("✅ Loaded scaler from file")
        else:
            logger.warning("⚠️ Scaler file not found. Creating StandardScaler.")
            from sklearn.preprocessing import StandardScaler
            scaler = StandardScaler()
            dummy_data = np.random.randn(100, 15)
            scaler.fit(dummy_data)
        
        # Define features
        basic_features = ['dc_voltage', 'estimated_ac', 'current', 'temperature', 'power']
        engineered_features = ['voltage_current_ratio', 'power_temp_ratio', 
                              'voltage_deviation', 'current_deviation',
                              'voltage_rolling_mean', 'current_rolling_mean', 'temp_rolling_mean',
                              'voltage_roc', 'current_roc', 'temp_roc']
        all_features = basic_features + engineered_features
        
        logger.info("✅ Startup completed")
        
        # Start background task
        asyncio.create_task(send_continuous_data())
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise

async def shutdown():
    logger.info("🛑 Shutting down...")
    for connection in connections:
        try:
            await connection.close()
        except:
            pass

app = FastAPI(
    title="ESP32 Transformer Fault Detection API",
    description="Real-time transformer monitoring with ML fault detection",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def prepare_features(row_data: Dict) -> np.ndarray:
    try:
        dc_voltage = row_data.get('dc_voltage', 15.6)
        current = row_data.get('current', 0.25)
        temperature = row_data.get('temperature', 38.0)
        estimated_ac = row_data.get('estimated_ac', (dc_voltage + 1.4) / 1.414)
        power = row_data.get('power', dc_voltage * current)
        
        features = {}
        features['dc_voltage'] = dc_voltage
        features['estimated_ac'] = estimated_ac
        features['current'] = current
        features['temperature'] = temperature
        features['power'] = power
        
        # Engineered features
        features['voltage_current_ratio'] = dc_voltage / (current + 0.001)
        features['power_temp_ratio'] = power / (temperature + 1)
        features['voltage_deviation'] = abs(dc_voltage - 15.6)
        features['current_deviation'] = abs(current - 0.25)
        
        # Fill missing features
        for feat in all_features:
            if feat not in features:
                features[feat] = 0.0
        
        return np.array([features[feat] for feat in all_features]).reshape(1, -1)
        
    except Exception as e:
        logger.error(f"Error preparing features: {str(e)}")
        raise

def simulate_normal_reading() -> Dict:
    base_values = {
        'dc_voltage': 15.6,
        'current': 0.25,
        'temperature': 38.0
    }
    
    reading = {
        'dc_voltage': round(base_values['dc_voltage'] * random.uniform(0.98, 1.02), 3),
        'current': round(base_values['current'] * random.uniform(0.95, 1.05), 3),
        'temperature': round(base_values['temperature'] * random.uniform(0.97, 1.03), 1)
    }
    
    reading['estimated_ac'] = round((reading['dc_voltage'] + 1.4) / 1.414, 3)
    reading['power'] = round(reading['dc_voltage'] * reading['current'], 3)
    
    return reading

def get_fault_description(fault_label: str) -> Dict:
    descriptions = {
        "NORMAL": {
            "severity": "None",
            "description": "Transformer operating within normal parameters",
            "action": "Continue monitoring",
            "color": "green"
        },
        "OVERLOAD": {
            "severity": "High",
            "description": "Current exceeding safe operating limits",
            "action": "Reduce load or investigate cause",
            "color": "orange"
        },
        "OVERTEMP": {
            "severity": "High", 
            "description": "Temperature above safe operating range",
            "action": "Check cooling system, reduce load",
            "color": "red"
        },
        "OVERVOLTAGE": {
            "severity": "Medium",
            "description": "Voltage above nominal range",
            "action": "Check voltage regulation",
            "color": "yellow"
        },
        "SENSOR_FAULT": {
            "severity": "Medium",
            "description": "Sensor malfunction detected",
            "action": "Inspect sensor connections",
            "color": "purple"
        },
        "BORDERLINE_OVERLOAD": {
            "severity": "Low",
            "description": "Current approaching limit",
            "action": "Monitor closely",
            "color": "light-orange"
        },
        "BORDERLINE_OVERTEMP": {
            "severity": "Low",
            "description": "Temperature approaching limit",
            "action": "Monitor closely",
            "color": "light-red"
        },
        "BORDERLINE_OVERVOLTAGE": {
            "severity": "Low",
            "description": "Voltage approaching limit",
            "action": "Monitor closely",
            "color": "light-yellow"
        }
    }
    
    return descriptions.get(fault_label, {
        "severity": "Unknown",
        "description": f"Fault condition: {fault_label}",
        "action": "Investigate",
        "color": "gray"
    })

def predict_with_model(features_scaled: np.ndarray):
    try:
        prediction_code = int(model.predict(features_scaled)[0])
        
        probabilities = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(features_scaled)[0]
        
        predicted_label = fault_labels.get(prediction_code, f"UNKNOWN_{prediction_code}")
        fault_desc = get_fault_description(predicted_label)
        
        prob_dict = {}
        if probabilities is not None:
            for i, prob in enumerate(probabilities):
                label = fault_labels.get(i, f"UNKNOWN_{i}")
                prob_dict[label] = round(float(prob) * 100, 1)
        
        confidence = round(float(probabilities[prediction_code]) * 100, 1) if probabilities is not None else 50.0
        
        return {
            "status": predicted_label,
            "fault_type": predicted_label,
            "confidence": confidence,
            "severity": fault_desc["severity"],
            "action": fault_desc["action"],
            "color": fault_desc["color"],
            "all_probabilities": prob_dict
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return {
            "status": "ERROR",
            "fault_type": "Prediction Failed",
            "confidence": 0.0,
            "severity": "Unknown",
            "action": "Check model",
            "color": "gray",
            "all_probabilities": {}
        }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)
    logger.info(f"🔌 WebSocket connected. Total connections: {len(connections)}")
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "init",
            "message": "Connected to Transformer Fault Detection API",
            "timestamp": datetime.now().isoformat(),
            "fault_classes": list(fault_labels.values())
        })
        
        while True:
            try:
                data = await websocket.receive_json()
                logger.info(f"📥 Received from client: {data}")
                
                if data.get("type") == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    })
                    
                elif data.get("type") == "get_sample":
                    await send_random_sample(websocket)
                    
                elif data.get("type") == "get_normal":
                    await send_simulated_reading(websocket)
                    
                elif data.get("type") == "predict":
                    await send_prediction(websocket, data.get("readings", {}))
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {str(e)}")
    finally:
        connections.remove(websocket)
        await websocket.close()

async def send_random_sample(websocket: WebSocket):
    """Send a random sample from the dataset"""
    try:
        row = data.sample(1).iloc[0]
        
        # Prepare sensor readings for model (keep raw values)
        sensor_data = {
            "dc_voltage": float(row['dc_voltage']),
            "current": float(row['current']),
            "temperature": float(row['temperature']),
            "estimated_ac": float(row['estimated_ac']),
            "power": float(row['power'])
        }
        
        # ✅ CONSISTENT SCHEMA - NO SCALING, NO EXTRA FIELDS
        frontend_data = {
            "voltage": float(row['dc_voltage']),           # 15-17V DC
            "current": float(row['current']),             # 0.2-0.7A
            "temperature": float(row['temperature']),     # 38-56°C
            "power": float(row['power']),                 # 3-12W
            "estimated_ac": float(row['estimated_ac']),   # Calculated AC
            "timestamp": datetime.now().isoformat(),
            "pc_timestamp": datetime.now().isoformat()    # ✅ CORRECT: isoformat(), NOT isoString()
        }
        
        # Get prediction
        features_array = prepare_features(sensor_data)
        features_scaled = scaler.transform(features_array)
        prediction = predict_with_model(features_scaled)
        
        logger.info(f"📤 Sending random sample - Data: {frontend_data}")
        
        await websocket.send_json({
            "type": "live_data",
            "data": frontend_data,
            "prediction": prediction,
            "timestamp": datetime.now().isoformat(),
            "source": "dataset"
        })
        
    except Exception as e:
        logger.error(f"Error sending random sample: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })

async def send_simulated_reading(websocket: WebSocket):
    """Send simulated normal reading - SINGLE FUNCTION, NO DUPLICATION"""
    try:
        readings = simulate_normal_reading()
        
        # ✅ CONSISTENT SCHEMA - SAME AS send_random_sample
        frontend_data = {
            "voltage": readings['dc_voltage'],      # 15.6V ± noise
            "current": readings['current'],         # 0.25A ± noise
            "temperature": readings['temperature'], # 38°C ± noise
            "power": readings['power'],            # V × I
            "estimated_ac": readings['estimated_ac'],
            "timestamp": datetime.now().isoformat(),
            "pc_timestamp": datetime.now().isoformat()  # ✅ CORRECT
        }
        
        # Get prediction
        features_array = prepare_features(readings)
        features_scaled = scaler.transform(features_array)
        prediction = predict_with_model(features_scaled)
        
        logger.info(f"📤 Sending simulated reading - Data: {frontend_data}")
        
        await websocket.send_json({
            "type": "live_data",
            "data": frontend_data,
            "prediction": prediction,
            "timestamp": datetime.now().isoformat(),
            "source": "simulation"
        })
        
    except Exception as e:
        logger.error(f"Error sending simulated reading: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })

async def send_continuous_data():
    """Background task to send data automatically"""
    # Keep sending ONLY random samples for consistency
    while True:
        try:
            if connections:
                logger.info(f"🔄 Sending data to {len(connections)} connected clients")
                
                for connection in connections:
                    try:
                        # ✅ ALWAYS USE SAME FUNCTION - NO RANDOM SWITCHING
                        await send_random_sample(connection)
                        
                    except Exception as e:
                        logger.error(f"Error sending to client: {str(e)}")
                        try:
                            connections.remove(connection)
                        except:
                            pass
                        
        except Exception as e:
            logger.error(f"Background task error: {str(e)}")
        
        await asyncio.sleep(2)  # Send every 2 seconds

# REST API endpoints for testing
@app.get("/")
async def root():
    return {
        "message": "ESP32 Transformer Fault Detection API",
        "version": "1.0.0",
        "websocket": "ws://localhost:8000/ws",
        "rest_endpoints": [
            "/api/random-sample",
            "/api/simulated-reading",
            "/api/predict",
            "/api/health"
        ]
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": model is not None,
        "fault_classes": len(fault_labels),
        "connections": len(connections)
    }

@app.get("/api/random-sample")
async def get_random_sample():
    """REST endpoint for testing - SINGLE VERSION"""
    try:
        row = data.sample(1).iloc[0]
        
        sensor_data = {
            "dc_voltage": float(row['dc_voltage']),
            "current": float(row['current']),
            "temperature": float(row['temperature']),
            "estimated_ac": float(row['estimated_ac']),
            "power": float(row['power'])
        }
        
        features_array = prepare_features(sensor_data)
        features_scaled = scaler.transform(features_array)
        prediction = predict_with_model(features_scaled)
        
        # ✅ CONSISTENT SCHEMA - NO SCALED FIELDS
        frontend_data = {
            "voltage": float(row['dc_voltage']),
            "current": float(row['current']),
            "temperature": float(row['temperature']),
            "power": float(row['power']),
            "estimated_ac": float(row['estimated_ac'])
        }
        
        return {
            "timestamp": datetime.now().isoformat(),
            "sensor_readings": frontend_data,
            "prediction": prediction,
            "source": "dataset"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/simulated-reading")
async def get_simulated_reading():
    """REST endpoint for simulated data"""
    try:
        readings = simulate_normal_reading()
        
        features_array = prepare_features(readings)
        features_scaled = scaler.transform(features_array)
        prediction = predict_with_model(features_scaled)
        
        # ✅ SAME SCHEMA
        frontend_data = {
            "voltage": readings['dc_voltage'],
            "current": readings['current'],
            "temperature": readings['temperature'],
            "power": readings['power'],
            "estimated_ac": readings['estimated_ac']
        }
        
        return {
            "timestamp": datetime.now().isoformat(),
            "sensor_readings": frontend_data,
            "prediction": prediction,
            "source": "simulation"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting ESP32 Transformer Fault Detection API with WebSocket...")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )