import numpy as np
import pandas as pd

# Set random seed for reproducibility
np.random.seed(42)

# Number of samples
N = 20000

# Fault classes based on research papers
fault_classes = {
    0: "NORMAL",
    1: "INTER_TURN", 
    2: "OVERHEATING",
    3: "PARTIAL_DISCHARGE",
    4: "CORE_SATURATION"
}

# Distribution based on industry statistics
class_distribution = {
    0: 0.70,   # Normal operation - majority
    1: 0.12,   # Inter-turn faults - most common
    2: 0.08,   # Overheating - due to Indian overloading conditions
    3: 0.05,   # Partial discharge - insulation aging
    4: 0.05    # Core saturation - grid instability issues
}

# Calculate samples per class (ensuring exactly 20,000 total)
samples_per_class = {}
remaining = N
class_items = list(class_distribution.items())

# Calculate samples for all classes except the last one
for cls, frac in class_items[:-1]:
    samples = int(N * frac)
    samples_per_class[cls] = samples
    remaining -= samples

# Assign all remaining samples to the last class to ensure total = 20,000
last_class, last_frac = class_items[-1]
samples_per_class[last_class] = remaining

print("Sample Distribution:")
for cls, samples in samples_per_class.items():
    print(f"{fault_classes[cls]}: {samples} samples ({samples/N*100:.1f}%)")

def noisy(val, scale=0.03):
    """Add realistic measurement noise"""
    return val * (1 + np.random.normal(0, scale))

data = []

for fault, n_samples in samples_per_class.items():
    for _ in range(n_samples):
        
        # ========== CORE ELECTRICAL PARAMETERS ==========
        voltage_primary = noisy(np.random.normal(11000, 55))
        voltage_secondary = noisy(np.random.normal(415, 2.5))
        current_primary = noisy(np.random.normal(33, 1.5))
        current_secondary = noisy(np.random.normal(877, 40))
        frequency = noisy(np.random.normal(50, 0.05))
        power_factor = np.clip(noisy(np.random.normal(0.85, 0.02)), 0.8, 0.92)
        
        active_power = np.sqrt(3) * voltage_secondary * current_secondary * power_factor / 1000
        
        # ========== THERMAL PARAMETERS ==========
        ambient_temp = np.random.normal(32, 4)
        oil_temp = ambient_temp + np.random.normal(28, 3)
        winding_temp = oil_temp + np.random.normal(12, 2)
        
        # ========== DGA PARAMETERS (MOST CRITICAL) ==========
        h2 = np.random.lognormal(2.5, 0.4)
        ch4 = np.random.lognormal(2.0, 0.4)
        c2h2 = np.random.lognormal(-1, 0.8)
        c2h4 = np.random.lognormal(2.3, 0.4)
        
        # ========== INSULATION PARAMETERS ==========
        dielectric_strength = np.random.normal(45, 3)
        
        # ========== CORE PARAMETERS ==========
        no_load_current = np.random.normal(2, 0.5)
        
        # ========== FAULT INJECTION ==========
        
        if fault == 1:  # INTER-TURN FAULT
            current_primary *= 1.4 + np.random.uniform(0.1, 0.2)
            current_secondary *= 1.4 + np.random.uniform(0.1, 0.2)
            power_factor -= np.random.uniform(0.08, 0.12)
            c2h2 *= 25 + np.random.uniform(5, 10)  # Arcing signature
            
        elif fault == 2:  # OVERHEATING
            winding_temp += np.random.uniform(25, 35)
            oil_temp += np.random.uniform(20, 30)
            c2h4 *= 10 + np.random.uniform(3, 7)   # Thermal marker
            ch4 *= 8 + np.random.uniform(2, 5)     # Methane increase
            
        elif fault == 3:  # PARTIAL DISCHARGE
            h2 *= 12 + np.random.uniform(3, 8)     # H₂ dominant
            dielectric_strength *= 0.65 + np.random.uniform(0.1, 0.15)
            
        elif fault == 4:  # CORE SATURATION
            no_load_current *= 4 + np.random.uniform(1, 2)
            frequency = np.random.normal(48.5, 0.3)
            voltage_primary = np.random.normal(11550, 100)
        
        # Add measurement noise
        gas_params = [h2, ch4, c2h2, c2h4]
        gas_params = [max(0.1, noisy(val, 0.08)) for val in gas_params]
        h2, ch4, c2h2, c2h4 = gas_params
        
        # Realistic limits
        voltage_secondary = np.clip(voltage_secondary, 400, 430)
        current_secondary = np.clip(current_secondary, 500, 1200)
        winding_temp = np.clip(winding_temp, 30, 120)
        oil_temp = np.clip(oil_temp, 25, 95)
        dielectric_strength = np.clip(dielectric_strength, 20, 50)
        no_load_current = np.clip(no_load_current, 0.5, 15)
        
        data.append([
            voltage_primary, voltage_secondary,
            current_primary, current_secondary,
            frequency, active_power, power_factor,
            ambient_temp, oil_temp, winding_temp,
            dielectric_strength, no_load_current,
            h2, ch4, c2h2, c2h4,
            fault
        ])

# FINAL STREAMLINED COLUMNS
columns = [
    "VoltagePrimary_V", "VoltageSecondary_V",
    "CurrentPrimary_A", "CurrentSecondary_A", 
    "Frequency_Hz", "ActivePower_kW", "PowerFactor",
    "AmbientTemp_C", "OilTemp_C", "WindingTemp_C",
    "DielectricStrength_kV", "NoLoadCurrent_A",
    "H2_ppm", "CH4_ppm", "C2H2_ppm", "C2H4_ppm",
    "FaultClass"
]

df = pd.DataFrame(data, columns=columns)
df.to_csv("transformer_fault_dataset_focused.csv", index=False)

print(f"\n✅ Dataset generated with EXACTLY {len(df)} rows!")
print("\nFinal Class Distribution:")
print(df['FaultClass'].value_counts().sort_index())
print(f"\nTotal samples: {sum(df['FaultClass'].value_counts())}")

# Verify the distribution
print("\nVerification:")
for cls in range(5):
    count = len(df[df['FaultClass'] == cls])
    print(f"Class {fault_classes[cls]}: {count} samples ({count/N*100:.1f}%)")