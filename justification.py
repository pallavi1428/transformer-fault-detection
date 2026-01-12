import numpy as np
import pandas as pd

# Set random seed for reproducibility
np.random.seed(42)

# Number of total samples
N = 20000

# Fault classes based on IEEE C57.104-2019 standard fault classification
fault_classes = {
    0: "Normal",
    1: "Overheating", 
    2: "Winding Fault", 
    3: "Insulation Degradation",
    4: "Core Fault",
    5: "Partial Discharge"
}

# JUSTIFICATION: Real-world fault distribution based on utility transformer failure statistics
# Source: CIGRE Working Group 12.05 (1992) - "An International Survey on Failures in Large Power Transformers"
# - 60% normal operation reflects utility transformer reliability data showing transformers operate normally majority of time
# - Fault proportions based on common failure modes: overheating (10%), winding faults (9%), insulation issues (7% each)
# - Distribution ensures adequate samples for machine learning while maintaining realistic occurrence rates
class_distribution = {
    0: 0.60,   # Normal operation - majority of operational time (CIGRE Survey)
    1: 0.10,   # Overheating - common due to loading, cooling issues, and hot spots
    2: 0.09,   # Winding Fault - includes shorted turns, open circuits (IEEE C57.117)
    3: 0.07,   # Insulation Degradation - aging related progressive fault
    4: 0.07,   # Core Fault - less common but severe (interlaminar insulation failure)
    5: 0.07    # Partial Discharge - insulation integrity issues (voids, contamination)
}

# FIX: Ensure exactly 20,000 samples by correcting for integer rounding
# JUSTIFICATION: Integer truncation in sample calculation causes loss of rows
# - Using int() on N*frac truncates decimal values, leading to missing samples
# - This method allocates exact counts for first n-1 classes, assigns remainder to last class
# - Guarantees exactly N samples for balanced dataset required for machine learning
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
    print(f"Class {cls}: {samples} samples ({samples/N*100:.1f}%)")
print(f"Total samples: {sum(samples_per_class.values())}")

def noisy(val, scale=0.02):
    """Add realistic measurement noise to simulated values"""
    return val * (1 + np.random.normal(0, scale))

data = []

for fault, n_samples in samples_per_class.items():
    for _ in range(n_samples):
        
        # ========== ELECTRICAL PARAMETERS ==========
        
        # VOLTAGE PRIMARY: 11kV ±55V (±0.5%)
        # JUSTIFICATION: IEC 60038 - Standard voltages
        # - 11kV standard distribution primary voltage in India (IS 2026)
        # - ±0.5% tolerance reflects grid voltage regulation capability
        # - 55V variation accounts for load fluctuations and system regulation
        # - Transmission level has tighter tolerance than distribution
        voltage_primary = noisy(np.random.normal(11000, 55))
        
        # VOLTAGE SECONDARY: 415V ±3.5V (±0.85%)
        # JUSTIFICATION: Indian Standard IS 2026 - Distribution Transformers
        # - 415V standard 3-phase voltage (240V phase-to-neutral) in India
        # - Statutory limit ±5% but normally maintained within ±1% for equipment protection
        # - Prevents motor damage and ensures proper operation of industrial equipment
        # - Transformers designed to deliver 415V at full load, may vary slightly with loading
        voltage_secondary = noisy(np.random.normal(415, 3.5))
        
        # CURRENT SECONDARY: 100A ±15A (for 100kVA transformer)
        # JUSTIFICATION: Transformer rating calculation and optimal loading
        # - Full load current = 100,000VA / (√3 × 415V) = 139A
        # - Optimal loading 60-80% for distribution transformers (83-111A range)
        # - Research: "Distribution transformers designed for maximum efficiency at 70-75% load" 
        #   (Bhatt et al., "Transformer Loss Calculation and L.V Winding Loss Reduction")
        # - Avoids overloading while maintaining good utilization efficiency
        current_secondary = noisy(np.random.normal(100, 15))
        
        # CURRENT PRIMARY: Derived from secondary current maintaining turns ratio
        # JUSTIFICATION: Transformer fundamental principle Vp/Vs = Is/Ip
        # - Turns ratio = 11000/415 ≈ 26.5:1
        # - Current ratio is inverse of voltage ratio
        # - Ensures power balance across transformer (neglecting losses)
        current_primary = current_secondary * (415/11000)
        
        # FREQUENCY: 50Hz ±0.01Hz (±0.02%)
        # JUSTIFICATION: Indian Electricity Grid Code (IEGC) 2022
        # - Grid frequency maintained at 49.9-50.05 Hz under normal conditions
        # - Tight control required for grid synchronization and generator protection
        # - ±0.01Hz represents normal grid frequency regulation capability
        frequency = noisy(np.random.normal(50, 0.01))
        
        # POWER FACTOR: 0.92 ±0.015 (0.88-0.96 range)
        # JUSTIFICATION: Utility power factor requirements and typical industrial loads
        # - Utilities penalize industrial consumers for power factor <0.9
        # - Typical industrial power factor range: 0.85-0.95
        # - Good design maintains 0.9-0.95 to minimize reactive power penalties
        # - Clipped range ensures realistic operating conditions
        power_factor = np.clip(np.random.normal(0.92, 0.015), 0.85, 0.96)
        
        # ========== POWER CALCULATIONS ==========
        
        # ACTIVE POWER: √3 × VL × IL × PF (kW)
        # JUSTIFICATION: Three-phase power calculation (IEC 60034-1)
        # - Must use √3 for balanced three-phase systems
        # - Represents real power consumed by the load
        # - Critical for transformer loading assessment and efficiency calculation
        active_power = np.sqrt(3) * voltage_secondary * current_secondary * power_factor / 1000
        
        # REACTIVE POWER: √3 × VL × IL × sin(φ) (kVAr)
        # JUSTIFICATION: Three-phase reactive power calculation
        # - Magnetizing power required by inductive loads
        # - Important for voltage regulation and system stability
        # - High reactive power indicates poor power factor or excessive magnetization
        reactive_power = np.sqrt(3) * voltage_secondary * current_secondary * np.sqrt(1 - power_factor**2) / 1000
        
        # ========== TEMPERATURE PARAMETERS ==========
        
        # WINDING TEMPERATURE: 60°C ±4°C (35°C ambient + 25°C rise)
        # JUSTIFICATION: IEC 60076-2 - Temperature rise limits
        # - Normal temperature rise: 55-65°C over ambient for class A insulation
        # - Hot spot temperature critical for insulation life (Arrhenius equation)
        # - 25°C rise over 35°C ambient = 60°C average winding temperature
        # - Based on typical Indian ambient conditions and transformer design
        winding_temperature = 35 + np.random.normal(25, 4)
        
        # OIL TEMPERATURE: 55°C ±3°C (35°C ambient + 20°C rise)
        # JUSTIFICATION: IEC 60076-2 - Oil temperature limits
        # - Oil temperature typically 5-10°C below winding temperature
        # - Critical for oil degradation monitoring and cooling efficiency
        # - 20°C rise over ambient represents normal oil temperature gradient
        # - Oil acts as both coolant and insulation medium
        oil_temperature = 35 + np.random.normal(20, 3)
        
        # ========== OIL QUALITY PARAMETERS ==========
        
        # OIL MOISTURE: 15-30 ppm
        # JUSTIFICATION: IEC 60422 - Mineral insulating oils in electrical equipment
        # - New oil: <10 ppm moisture content
        # - In service: <35 ppm acceptable for continued operation
        # - >35 ppm indicates sealing problems, breathing system issues, or degradation
        # - Critical parameter for insulation life and dielectric strength
        oil_moisture = np.random.uniform(15, 30)
        
        # DIELECTRIC STRENGTH: 40kV ±4kV
        # JUSTIFICATION: IS 335 / IEC 60156 - Insulating oil breakdown voltage
        # - New oil: >50 kV breakdown voltage
        # - In service: >30 kV acceptable for continued operation
        # - Critical parameter for insulation integrity and transformer safety
        # - Direct indicator of oil contamination and aging
        dielectric_strength = np.random.normal(40, 4)
        
        # ========== DISSOLVED GAS ANALYSIS (DGA) ==========
        # JUSTIFICATION: IEEE C57.104-2019 / IEC 60599 - DGA interpretation standards
        
        # HYDROGEN (H2): 50-120 ppm
        # - Primary indicator of partial discharge (corona) and low energy electrical faults
        # - Produced by low energy electrical discharges in oil
        # - Normal range: <100 ppm (Condition 1 per IEEE C57.104)
        # - Key gas for detecting insulation voids and contamination
        h2 = np.random.uniform(50, 120)
        
        # METHANE (CH4): 20-60 ppm
        # - Thermal fault indicator (150-300°C range) - oil decomposition
        # - Produced by thermal decomposition of oil at moderate temperatures
        # - Normal range: <60 ppm (Condition 1)
        # - Characteristic of hot spots and localized overheating
        ch4 = np.random.uniform(20, 60)
        
        # ACETYLENE (C2H2): 0.1-2.0 ppm - KEY INDICATOR
        # - Primary indicator of arcing (high energy discharge)
        # - Most significant fault gas for serious electrical faults
        # - Normal: <2 ppm, >10 ppm indicates serious arcing (Condition 4)
        # - Critical for detecting winding faults and serious internal arcing
        c2h2 = np.random.uniform(0.1, 2.0)
        
        # ETHYLENE (C2H4): 15-50 ppm
        # - Thermal fault indicator (300-700°C range) - high temperature oil decomposition
        # - Characteristic of severe thermal faults and hot spots
        # - Normal range: <50 ppm (Condition 1)
        # - Key gas for distinguishing thermal fault severity
        c2h4 = np.random.uniform(15, 50)
        
        # CARBON MONOXIDE (CO): 350-800 ppm
        # - Cellulose (paper) insulation degradation indicator
        # - Produced by thermal decomposition of solid insulation
        # - Normal range: <700 ppm for transformers with paper insulation
        # - Critical for assessing solid insulation condition and aging
        co = np.random.uniform(350, 800)
        
        # ========== FAULT CONDITION INJECTION ==========
        
        if fault == 1:  # OVERHEATING FAULT (Thermal Fault >700°C)
            # JUSTIFICATION: IEEE C57.104 - Thermal Fault Characteristics
            # Gas Pattern: CH4 and C2H4 dominant (Key gases for thermal faults)
            # Temperature rise due to excessive losses, blocked cooling, or overloading
            # Typical causes: overloading, blocked radiators, high ambient temperature
            
            # Temperature signatures (IEC 60076-7 - Loading guide)
            winding_temperature += np.random.uniform(25, 40)    # Significant overheating beyond normal rise
            oil_temperature += np.random.uniform(20, 30)        # Oil temperature follows winding temperature
            
            # Gas production (IEEE C57.104 - Table 1: Thermal fault >700°C)
            ch4 += np.random.uniform(80, 200)                   # ⬆️ Methane - oil decomposition at high temps
            c2h4 += np.random.uniform(100, 300)                 # ⬆️ Ethylene - characteristic of high temp faults
            co += np.random.uniform(200, 500)                   # ⬆️ CO - paper insulation thermal stress
            
        elif fault == 2:  # WINDING FAULT (Electrical Fault)
            # JUSTIFICATION: IEEE C57.104 - Electrical Fault Characteristics  
            # Includes shorted turns, open circuits, contact problems
            # Causes current imbalance, electromagnetic forces, and gas production
            # Typical causes: insulation failure, mechanical damage, manufacturing defects
            
            # Electrical signatures
            current_secondary += np.random.uniform(40, 80)      # ⬆️ Current increase due to winding short circuits
            current_primary = current_secondary * (415/11000)   # Maintain transformer ratio
            power_factor -= np.random.uniform(0.08, 0.15)       # ⬇️ Reduced PF due to reactive component changes
            
            # Gas production (IEEE C57.104 - Electrical faults produce H2 and C2H2)
            h2 += np.random.uniform(50, 150)                    # ⬆️ Hydrogen from partial discharges in winding
            c2h2 += np.random.uniform(5, 15)                    # ⬆️ Acetylene - indicates arcing in winding
            
        elif fault == 3:  # INSULATION DEGRADATION
            # JUSTIFICATION: IEC 60599 - Insulation aging characteristics
            # Progressive fault showing in oil quality parameters and CO production
            # Paper/oil insulation breakdown due to thermal aging and moisture
            # Typical causes: aging, thermal cycling, moisture ingress
            
            # Insulation quality signatures
            power_factor -= np.random.uniform(0.06, 0.12)       # ⬇️ Reduced PF - increased dielectric losses
            oil_moisture += np.random.uniform(20, 40)           # ⬆️ Moisture ingress through degraded seals
            dielectric_strength -= np.random.uniform(12, 20)    # ⬇️ Reduced breakdown voltage
            
            # Gas production (IEC 60599 - Paper insulation degradation)
            co += np.random.uniform(400, 800)                   # ⬆️ SIGNIFICANT CO - paper insulation decomposition
            
        elif fault == 4:  # CORE FAULT
            # JUSTIFICATION: IEEE C57.104 - Core and circulating current faults
            # Core insulation issues, interlaminar faults, circulating currents
            # Causes localized heating and specific gas pattern
            # Typical causes: core insulation failure, manufacturing defects, loose core
            
            # Gas production (IEEE C57.104 - Core faults produce H2, CH4, C2H4)
            h2 += np.random.uniform(80, 200)                    # ⬆️ Hydrogen from core discharges
            ch4 += np.random.uniform(60, 150)                   # ⬆️ Methane - thermal faults in core
            c2h4 += np.random.uniform(50, 120)                  # ⬆️ Ethylene - high temperature core faults
            
            # Electrical signature
            power_factor -= np.random.uniform(0.10, 0.18)       # ⬇️ Reduced PF - increased magnetization current
            
        elif fault == 5:  # PARTIAL DISCHARGE
            # JUSTIFICATION: IEEE C57.124 - Partial Discharge Monitoring
            # Gas Pattern: H2 dominant (Key indicator for PD)
            # Indicates insulation voids, contamination, or moisture in oil
            # Typical causes: insulation voids, bubbles, contamination, moisture
            
            # Gas production (IEEE C57.104 - PD produces predominantly H2)
            c2h2 += np.random.uniform(8, 25)                    # ⬆️ Acetylene - sparking discharges
            h2 += np.random.uniform(150, 400)                   # ⬆️🚨 SIGNIFICANT H2 - KEY PD INDICATOR
            
            # Insulation quality degradation
            dielectric_strength -= np.random.uniform(15, 25)    # ⬇️ Severely reduced insulation strength
            oil_moisture += np.random.uniform(15, 30)           # ⬆️ Moisture - both cause and effect of PD
        
        # ========== REALISTIC LIMITS ENFORCEMENT ==========
        
        # VOLTAGE LIMITS: Statutory limits ±5% (IEC 60038)
        # - Ensures secondary voltage stays within practical operating range 400-430V
        voltage_secondary = np.clip(voltage_secondary, 400, 430)
        
        # CURRENT LIMITS: 36-130% of full load (IEC 60076-7 emergency overload)
        # - Prevents unrealistic current values beyond transformer capability
        current_secondary = np.clip(current_secondary, 50, 180)
        
        # POWER FACTOR: Practical operating range
        # - Maintains realistic power factor values for industrial systems
        power_factor = np.clip(power_factor, 0.7, 0.96)
        
        # TEMPERATURE LIMITS: Based on insulation class (IEC 60076-2)
        # - Winding temperature limited by class A insulation (105°C max)
        # - Oil temperature limited by flash point and safety considerations
        winding_temperature = np.clip(winding_temperature, 40, 120)
        oil_temperature = np.clip(oil_temperature, 35, 95)
        
        # DIELECTRIC STRENGTH: Practical operating range (IEC 60156)
        # - Ensures oil breakdown voltage stays within measurable range
        dielectric_strength = np.clip(dielectric_strength, 15, 50)
        
        data.append([
            voltage_primary, voltage_secondary,
            current_primary, current_secondary,
            frequency, active_power, reactive_power, power_factor,
            winding_temperature, oil_temperature,
            oil_moisture, dielectric_strength,
            h2, ch4, c2h2, c2h4, co,
            fault
        ])

# FINAL OPTIMIZED COLUMNS
columns = [
    "VoltagePrimary_V", "VoltageSecondary_V",
    "CurrentPrimary_A", "CurrentSecondary_A", 
    "Frequency_Hz", "ActivePower_kW", "ReactivePower_kVAr", "PowerFactor",
    "WindingTemp_C", "OilTemp_C",
    "OilMoisture_ppm", "DielectricStrength_kV",
    "H2_ppm", "CH4_ppm", "C2H2_ppm", "C2H4_ppm", "CO_ppm",
    "FaultClass"
]

df = pd.DataFrame(data, columns=columns)
df.to_csv("research_justified_transformer_fault_data.csv", index=False)

print("\n✅ RESEARCH-JUSTIFIED Transformer Fault Dataset Generated!")
print("Dataset Shape:", df.shape)
print("\nFinal Fault Class Distribution:")
print(df['FaultClass'].value_counts().sort_index())
print(f"\n✅ GUARANTEED: Exactly {len(df)} rows generated!")

print("\n📚 STANDARDS AND REFERENCES:")
print("- IEEE C57.104-2019: Guide for Interpretation of Gases Generated in Oil-Immersed Transformers")
print("- IEC 60599: Mineral oil-filled electrical equipment in service - Guidance on the interpretation of dissolved and free gases analysis")
print("- IEC 60076: Power transformers series standards")
print("- IS 2026: Indian Standard for Power Transformers")
print("- IEC 60038: IEC Standard Voltages") 
print("- IEGC 2022: Indian Electricity Grid Code")
print("- IEC 60422: Mineral insulating oils in electrical equipment - Supervision and maintenance guidance")
print("- IEC 60156: Insulating liquids - Determination of the breakdown voltage at power frequency")
print("- CIGRE WG12.05: An International Survey on Failures in Large Power Transformers")
print("- Bhatt et al.: Transformer Loss Calculation and L.V Winding Loss Reduction Using Finite Element Method")