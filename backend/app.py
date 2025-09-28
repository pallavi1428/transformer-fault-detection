from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import numpy as np
from datetime import datetime
import random

# Load model + scaler + dataset
model = joblib.load("transformer_fault_random_forest.pkl")
scaler = joblib.load("transformer_scaler.pkl")
data = pd.read_csv("huge_synthetic_transformer_data.csv")

# Map labels
fault_labels = {
    0: "Normal",
    1: "Overheating",
    2: "Winding Fault", 
    3: "Insulation Degradation",
    4: "Core Fault",
    5: "Partial Discharge"
}

app = FastAPI(title="Transformer Fault Detection API")

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store some state for realistic trends
current_trend = "normal"
trend_counter = 0

@app.get("/api/random-sample")
def random_sample():
    global current_trend, trend_counter
    
    # Pick random row
    row = data.sample(1).iloc[0].copy()
    
    # Simulate realistic trends occasionally
    trend_counter += 1
    if trend_counter >= 10:  # Change trend every 10 samples
        current_trend = random.choice(["normal", "overheating", "winding_fault", "spike"])
        trend_counter = 0
    
    # Apply trends for more realistic simulation
    if current_trend == "overheating":
        row["Temperature_C"] += random.uniform(5, 15)
        row["THD_Current_pct"] += random.uniform(0.5, 2)
    elif current_trend == "winding_fault":
        row["CurrentPrimary_A"] += random.uniform(10, 25)
        row["Vibration_g"] += random.uniform(0.3, 1.0)
    elif current_trend == "spike":
        spike_feature = random.choice(["VoltagePrimary_V", "CurrentSecondary_A", "THD_Voltage_pct"])
        row[spike_feature] *= random.uniform(1.1, 1.3)
    
    # Add small random noise to all features for realism
    for col in row.index:
        if col != "FaultClass" and pd.api.types.is_numeric_dtype(row[col]):
            row[col] *= random.uniform(0.99, 1.01)
    
    # Prepare features for prediction
    features = row.drop("FaultClass").values.reshape(1, -1)
    features_scaled = scaler.transform(features)
    
    # Predict fault
    pred = model.predict(features_scaled)[0]
    proba = model.predict_proba(features_scaled)[0]
    confidence = proba[pred]
    
    # Get feature importance (simplified - using model's feature importances)
    if hasattr(model, 'feature_importances_'):
        feature_importance = list(zip(row.drop("FaultClass").index, model.feature_importances_))
        top_features = sorted(feature_importance, key=lambda x: x[1], reverse=True)[:3]
    else:
        top_features = [("Temperature_C", 0.3), ("H2_ppm", 0.25), ("THD_Current_pct", 0.2)]
    
    return {
        "features": row.drop("FaultClass").to_dict(),
        "actual_class": fault_labels[row["FaultClass"]],
        "prediction": fault_labels[pred],
        "probability": round(float(confidence) * 100, 1),
        "all_probabilities": {fault_labels[i]: round(float(prob) * 100, 1) for i, prob in enumerate(proba)},
        "top_features": top_features,
        "timestamp": datetime.now().isoformat(),
        "trend": current_trend
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "model_loaded": True, "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)