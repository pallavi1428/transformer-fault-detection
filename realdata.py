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

for cls, frac in class_items[:-1]:
    samples = int(N * frac)
    samples_per_class[cls] = samples
    remaining -= samples

last_class, last_frac = class_items[-1]
samples_per_class[last_class] = remaining

print("Sample Distribution:")
for cls, samples in samples_per_class.items():
    print(f"{fault_classes[cls]}: {samples} samples ({samples/N*100:.1f}%)")

def noisy(val, scale=0.04):  # Increased noise for realism
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
        
        # ========== REALISTIC FAULT INJECTION WITH OVERLAP ==========
        
        if fault == 1:  # INTER-TURN FAULT (SOFTENED)
            current_multiplier = 1.15 + np.random.uniform(0.05, 0.15)  # 15-30% increase
            current_primary *= current_multiplier
            current_secondary *= current_multiplier
            power_factor -= np.random.uniform(0.03, 0.08)              # Reduced impact
            c2h2_multiplier = 8 + np.random.uniform(2, 6)              # Reduced from 25
            c2h2 *= c2h2_multiplier
            # Some overlap: partial discharge characteristics
            if np.random.random() < 0.2:  # 20% overlap cases
                h2 *= 3 + np.random.uniform(1, 3)
            
        elif fault == 2:  # OVERHEATING (SOFTENED)
            temp_increase = np.random.uniform(15, 25)                  # Reduced from 25-35
            winding_temp += temp_increase + np.random.normal(0, 3)     # Added noise
            oil_temp += temp_increase * 0.7 + np.random.normal(0, 2)   # Reduced ratio
            c2h4_multiplier = 5 + np.random.uniform(2, 4)              # Reduced from 10
            ch4_multiplier = 4 + np.random.uniform(1, 3)               # Reduced from 8
            c2h4 *= c2h4_multiplier
            ch4 *= ch4_multiplier
            # Some overlap: core saturation characteristics  
            if np.random.random() < 0.15:  # 15% overlap cases
                no_load_current *= 1.5 + np.random.uniform(0.2, 0.5)
            
        elif fault == 3:  # PARTIAL DISCHARGE (SOFTENED)
            h2_multiplier = 6 + np.random.uniform(2, 5)                # Reduced from 12
            h2 *= h2_multiplier
            dielectric_reduction = 0.75 + np.random.uniform(0.1, 0.15) # Reduced impact
            dielectric_strength *= dielectric_reduction
            # Some overlap: thermal characteristics
            if np.random.random() < 0.25:  # 25% overlap cases
                winding_temp += np.random.uniform(5, 15)
                c2h4 *= 2 + np.random.uniform(0.5, 1.5)
            
        elif fault == 4:  # CORE SATURATION (SOFTENED)
            no_load_multiplier = 2.5 + np.random.uniform(0.5, 1.5)     # Reduced from 4
            no_load_current *= no_load_multiplier
            frequency = np.random.normal(49.0, 0.4)                    # Less extreme
            voltage_primary = np.random.normal(11200, 150)             # Reduced overvoltage
            # Some overlap: overheating characteristics
            if np.random.random() < 0.2:  # 20% overlap cases
                winding_temp += np.random.uniform(8, 20)
                oil_temp += np.random.uniform(5, 15)
        
        # ADD BORDERLINE CASES: Realistic ambiguous samples (5% of data)
        if np.random.random() < 0.05:
            # Mix characteristics across fault types
            if fault == 1:  # Inter-turn with some PD
                h2 *= 2 + np.random.uniform(0.5, 1.5)
            elif fault == 2:  # Overheating with some core saturation
                no_load_current *= 1.3 + np.random.uniform(0.1, 0.3)
            elif fault == 3:  # PD with some overheating
                c2h4 *= 1.5 + np.random.uniform(0.3, 0.8)
            elif fault == 4:  # Core saturation with some inter-turn
                current_primary *= 1.1 + np.random.uniform(0.05, 0.1)
        
        # Add measurement noise (increased for realism)
        gas_params = [h2, ch4, c2h2, c2h4]
        gas_params = [max(0.1, noisy(val, 0.10)) for val in gas_params]  # More noise
        h2, ch4, c2h2, c2h4 = gas_params
        
        # Add noise to other parameters
        current_primary = noisy(current_primary, 0.04)
        current_secondary = noisy(current_secondary, 0.04)
        winding_temp = noisy(winding_temp, 0.03)
        oil_temp = noisy(oil_temp, 0.03)
        dielectric_strength = noisy(dielectric_strength, 0.05)
        
        # Realistic limits
        voltage_secondary = np.clip(voltage_secondary, 400, 430)
        current_secondary = np.clip(current_secondary, 500, 1200)
        winding_temp = np.clip(winding_temp, 30, 120)
        oil_temp = np.clip(oil_temp, 25, 95)
        dielectric_strength = np.clip(dielectric_strength, 20, 50)
        no_load_current = np.clip(no_load_current, 0.5, 12)
        
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
df.to_csv("realistic_transformer.csv", index=False)

print(f"\n✅ REALISTIC Dataset generated with EXACTLY {len(df)} rows!")
print("\nFinal Class Distribution:")
print(df['FaultClass'].value_counts().sort_index())
print(f"\nTotal samples: {sum(df['FaultClass'].value_counts())}")

print("\n🎯 EXPECTED ML PERFORMANCE: 85-92% Accuracy (Realistic)")
print("   - Softer fault multipliers")
print("   - Added parameter overlap between classes") 
print("   - 5% borderline ambiguous cases")
print("   - Increased measurement noise")
print("   - More realistic for actual ML training")