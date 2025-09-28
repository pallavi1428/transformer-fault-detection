import numpy as np
import pandas as pd

# Set random seed for reproducibility
np.random.seed(42)

# Number of total samples
N = 20000   # you can increase to 50,000 or more

# Fault classes (balanced dataset)
fault_classes = {
    0: "Normal",
    1: "Overheating",
    2: "Winding Fault",
    3: "Insulation Degradation",
    4: "Core Fault",
    5: "Partial Discharge"
}

# Proportion of each fault type
class_distribution = {
    0: 0.60,   # 60% Normal
    1: 0.10,   # 10% Overheating
    2: 0.10,   # 10% Winding Fault
    3: 0.07,   # 7% Insulation Degradation
    4: 0.07,   # 7% Core Fault
    5: 0.06    # 6% Partial Discharge
}

# Calculate number of samples per class
samples_per_class = {cls: int(N * frac) for cls, frac in class_distribution.items()}

# Helper function: add noise
def noisy(val, scale=0.02):
    return val * (1 + np.random.normal(0, scale))

# Dataset rows
data = []

for fault, n_samples in samples_per_class.items():
    for _ in range(n_samples):
        
        # Base electrical ranges (Normal)
        voltage_primary = noisy(np.random.normal(11000, 80))    # kV side
        voltage_secondary = noisy(np.random.normal(433, 8))     # LV side
        current_primary = noisy(np.random.normal(50, 5))
        current_secondary = noisy(np.random.normal(1200, 100))
        frequency = noisy(50, 0.05)
        power_factor = np.clip(np.random.normal(0.95, 0.02), 0.7, 1.0)
        
        # Power calculations
        active_power = voltage_secondary * current_secondary * power_factor / 1000
        reactive_power = voltage_secondary * current_secondary * np.sqrt(1 - power_factor**2) / 1000
        apparent_power = voltage_secondary * current_secondary / 1000
        
        # Environmental
        temperature = np.random.normal(65, 5)
        humidity = np.random.uniform(25, 70)
        vibration = np.random.uniform(0.05, 0.5)
        
        # Harmonics baseline
        thd_voltage = np.random.normal(1.5, 0.3)
        thd_current = np.random.normal(2.0, 0.5)
        
        # Dissolved Gas baseline
        h2 = np.random.uniform(10, 40)
        ch4 = np.random.uniform(1, 8)
        c2h2 = np.random.uniform(0.1, 1.5)
        
        # -------- Inject Fault Conditions --------
        if fault == 1:  # Overheating
            temperature += np.random.uniform(15, 30)
            thd_current += np.random.uniform(1, 2)
        
        elif fault == 2:  # Winding Fault
            current_primary += np.random.uniform(20, 40)
            current_secondary += np.random.uniform(200, 400)
            thd_voltage += np.random.uniform(2, 4)
            thd_current += np.random.uniform(3, 6)
            vibration += np.random.uniform(0.5, 1.5)
            power_factor -= np.random.uniform(0.05, 0.15)
        
        elif fault == 3:  # Insulation Degradation
            thd_voltage += np.random.uniform(1.5, 3)
            thd_current += np.random.uniform(2, 4)
            power_factor -= np.random.uniform(0.05, 0.1)
            reactive_power += np.random.uniform(50, 100)
        
        elif fault == 4:  # Core Fault
            h2 += np.random.uniform(50, 150)
            ch4 += np.random.uniform(20, 60)
            power_factor -= np.random.uniform(0.1, 0.2)
        
        elif fault == 5:  # Partial Discharge
            c2h2 += np.random.uniform(10, 40)
            thd_voltage += np.random.uniform(3, 7)
            thd_current += np.random.uniform(3, 7)
            vibration += np.random.uniform(0.8, 2.0)
        
        # Append one row
        data.append([
            voltage_primary, voltage_secondary,
            current_primary, current_secondary,
            frequency, active_power, reactive_power, apparent_power,
            power_factor, temperature, humidity, vibration,
            thd_voltage, thd_current,
            h2, ch4, c2h2,
            fault
        ])

# Create DataFrame
columns = [
    "VoltagePrimary_V", "VoltageSecondary_V",
    "CurrentPrimary_A", "CurrentSecondary_A",
    "Frequency_Hz", "ActivePower_kW", "ReactivePower_kVAr", "ApparentPower_kVA",
    "PowerFactor", "Temperature_C", "Humidity_pct", "Vibration_g",
    "THD_Voltage_pct", "THD_Current_pct",
    "H2_ppm", "CH4_ppm", "C2H2_ppm",
    "FaultClass"
]

df = pd.DataFrame(data, columns=columns)

# Save to CSV
df.to_csv("huge_synthetic_transformer_data.csv", index=False)

print("✅ Huge synthetic dataset generated!")
print("Shape:", df.shape)
print(df['FaultClass'].value_counts())
print(df.head())
