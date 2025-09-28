import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib

# Set random seed for reproducibility
np.random.seed(42)

# Generate synthetic data
n_samples = 1000

data = {
    'voltage_primary': [],
    'voltage_secondary': [],
    'current_primary': [],
    'current_secondary': [], 
    'active_power': [],
    'reactive_power': [],
    'temperature': [],
    'thd_voltage': [],
    'thd_current': [],
    'power_factor': [],
    'frequency': [],
    'fault_type': []  # 0=Normal, 1=Overheating, 2=Winding Fault, 3=Insulation Degradation
}

for i in range(n_samples):
    # 70% Normal operation
    if i < 700:
        data['voltage_primary'].append(np.random.normal(11000, 100))    # 11kV ± 100V
        data['voltage_secondary'].append(np.random.normal(433, 10))     # 433V ± 10V
        data['current_primary'].append(np.random.normal(50, 5))         # 50A ± 5A
        data['current_secondary'].append(np.random.normal(1200, 100))   # 1200A ± 100A
        data['active_power'].append(np.random.normal(800, 50))          # 800kW ± 50kW
        data['reactive_power'].append(np.random.normal(200, 30))        # 200kVAr ± 30kVAr
        data['temperature'].append(np.random.normal(65, 5))             # 65°C ± 5°C
        data['thd_voltage'].append(np.random.normal(1.5, 0.3))          # 1.5% THD ± 0.3%
        data['thd_current'].append(np.random.normal(2.0, 0.5))          # 2.0% THD ± 0.5%
        data['power_factor'].append(np.random.normal(0.95, 0.03))       # 0.95 ± 0.03
        data['frequency'].append(np.random.normal(50, 0.1))             # 50Hz ± 0.1Hz
        data['fault_type'].append(0)
    
    # 10% Overheating (Class 1)
    elif i < 800:
        data['voltage_primary'].append(np.random.normal(10900, 150))
        data['voltage_secondary'].append(np.random.normal(428, 15))
        data['current_primary'].append(np.random.normal(48, 6))
        data['current_secondary'].append(np.random.normal(1180, 120))
        data['active_power'].append(np.random.normal(780, 70))
        data['reactive_power'].append(np.random.normal(220, 40))
        data['temperature'].append(np.random.normal(85, 8))             # High temperature!
        data['thd_voltage'].append(np.random.normal(2.0, 0.5))
        data['thd_current'].append(np.random.normal(3.5, 1.0))          # Higher THD
        data['power_factor'].append(np.random.normal(0.92, 0.05))
        data['frequency'].append(np.random.normal(49.9, 0.2))
        data['fault_type'].append(1)
    
    # 10% Winding Fault (Class 2)  
    elif i < 900:
        data['voltage_primary'].append(np.random.normal(10700, 200))    # Voltage drop
        data['voltage_secondary'].append(np.random.normal(420, 20))     # Voltage drop
        data['current_primary'].append(np.random.normal(55, 8))         # Current increase
        data['current_secondary'].append(np.random.normal(1300, 150))   # Current increase
        data['active_power'].append(np.random.normal(750, 80))
        data['reactive_power'].append(np.random.normal(250, 50))        # Higher reactive power
        data['temperature'].append(np.random.normal(75, 10))
        data['thd_voltage'].append(np.random.normal(4.0, 1.0))          # Very high THD
        data['thd_current'].append(np.random.normal(6.0, 1.5))          # Very high THD
        data['power_factor'].append(np.random.normal(0.85, 0.08))       # Poor power factor
        data['frequency'].append(np.random.normal(49.8, 0.3))
        data['fault_type'].append(2)
    
    # 10% Insulation Degradation (Class 3)
    else:
        data['voltage_primary'].append(np.random.normal(10800, 120))
        data['voltage_secondary'].append(np.random.normal(430, 12))
        data['current_primary'].append(np.random.normal(52, 6))
        data['current_secondary'].append(np.random.normal(1250, 110))
        data['active_power'].append(np.random.normal(820, 60))
        data['reactive_power'].append(np.random.normal(280, 45))        # High reactive power
        data['temperature'].append(np.random.normal(70, 6))
        data['thd_voltage'].append(np.random.normal(3.0, 0.8))          # Elevated THD
        data['thd_current'].append(np.random.normal(4.5, 1.2))          # Elevated THD
        data['power_factor'].append(np.random.normal(0.88, 0.06))       # Reduced power factor
        data['frequency'].append(np.random.normal(49.9, 0.15))
        data['fault_type'].append(3)

# Create DataFrame
df = pd.DataFrame(data)
print("Dataset created!")
print(f"Dataset shape: {df.shape}")
print("\nFault type distribution:")
print(df['fault_type'].value_counts().sort_index())
print("\nFirst 5 rows:")
print(df.head())