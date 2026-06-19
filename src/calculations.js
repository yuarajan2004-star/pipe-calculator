// calculations.js
// Pure engineering math engine — no UI code here.
// All functions take plain numbers in SI units and return plain numbers.
// Import and call these from any component.

// ─────────────────────────────────────────────────────────────
// FLUID PROPERTIES LIBRARY
// Pre-loaded fluid data at standard conditions (20°C, 1 atm)
// density in kg/m³ | viscosity in Pa·s (= kg/m·s)
// ─────────────────────────────────────────────────────────────
export const FLUIDS = {
  water:        { label: 'Water',             density: 1000, viscosity: 0.001002 },
  seawater:     { label: 'Sea Water',         density: 1025, viscosity: 0.00107  },
  crude_oil:    { label: 'Crude Oil',         density: 850,  viscosity: 0.03     },
  diesel:       { label: 'Diesel',            density: 840,  viscosity: 0.0035   },
  gasoline:     { label: 'Gasoline',          density: 750,  viscosity: 0.00057  },
  natural_gas:  { label: 'Natural Gas (liq)', density: 450,  viscosity: 0.00011  },
  glycol:       { label: 'Ethylene Glycol',   density: 1113, viscosity: 0.0161   },
};

// ─────────────────────────────────────────────────────────────
// PIPE SCHEDULE LIBRARY
// Internal diameters in meters for standard nominal pipe sizes
// ─────────────────────────────────────────────────────────────
export const PIPE_SIZES = [
  { label: '1 inch  (Sch 40)',  diameter: 0.02664 },
  { label: '2 inch  (Sch 40)',  diameter: 0.05250 },
  { label: '3 inch  (Sch 40)',  diameter: 0.07792 },
  { label: '4 inch  (Sch 40)',  diameter: 0.10226 },
  { label: '6 inch  (Sch 40)',  diameter: 0.15402 },
  { label: '8 inch  (Sch 40)',  diameter: 0.20274 },
  { label: '10 inch (Sch 40)',  diameter: 0.25450 },
  { label: '12 inch (Sch 40)',  diameter: 0.30380 },
]

// ─────────────────────────────────────────────────────────────
// 1. FLOW UNIT CONVERTER
// Converts flow rate to m³/s for all internal calculations
// ─────────────────────────────────────────────────────────────
export function toM3PerSec(value, unit) {
  switch (unit) {
    case 'm3/hr':  return value / 3600
    case 'L/min':  return value / 60000
    case 'L/s':    return value / 1000
    case 'bbl/day':return value * 0.158987 / 86400  // oil field barrels
    case 'GPM':    return value * 0.0000630902       // US gallons per minute
    default:       return value / 3600               // default m³/hr
  }
}

// ─────────────────────────────────────────────────────────────
// 2. PIPE FLOW VELOCITY
// v = Q / A   where A = π/4 × D²
// Input : flowM3s (m³/s), diameter (m)
// Output: velocity in m/s
// Rule of thumb: keep between 1–3 m/s for liquids
// ─────────────────────────────────────────────────────────────
export function calcVelocity(flowM3s, diameter) {
  const area = Math.PI / 4 * Math.pow(diameter, 2)
  return flowM3s / area
}

// ─────────────────────────────────────────────────────────────
// 3. REYNOLDS NUMBER
// Re = (density × velocity × diameter) / viscosity
// Input : density (kg/m³), velocity (m/s), diameter (m), viscosity (Pa·s)
// Output: dimensionless number
// Re < 2300  → Laminar flow  (smooth, layered)
// Re > 4000  → Turbulent flow (chaotic, mixing)
// 2300–4000  → Transition zone (unpredictable)
// ─────────────────────────────────────────────────────────────
export function calcReynolds(density, velocity, diameter, viscosity) {
  return (density * velocity * diameter) / viscosity
}

// ─────────────────────────────────────────────────────────────
// 4. FRICTION FACTOR (Moody Chart)
// For Laminar flow: f = 64 / Re  (exact)
// For Turbulent  : Colebrook-White equation (industry standard)
//   1/√f = -2 log(ε/3.7D + 2.51/Re√f)
//   Solved iteratively (10 loops is enough for engineering accuracy)
// Input : Re, diameter (m), roughness (m) — default steel pipe = 0.000046m
// Output: Darcy friction factor (dimensionless)
// ─────────────────────────────────────────────────────────────
export function calcFrictionFactor(Re, diameter, roughness = 0.000046) {
  if (Re < 2300) {
    return 64 / Re   // Laminar — exact formula
  }

  // Turbulent — Colebrook-White iterative solution
  const relRoughness = roughness / diameter
  let f = 0.02  // initial guess

  for (let i = 0; i < 10; i++) {
    const rhs = -2 * Math.log10(relRoughness / 3.7 + 2.51 / (Re * Math.sqrt(f)))
    f = 1 / Math.pow(rhs, 2)
  }

  return f
}

// ─────────────────────────────────────────────────────────────
// 5. PRESSURE DROP — Darcy-Weisbach Equation
// ΔP = f × (L/D) × (ρv²/2)
// Input : f (friction factor), length (m), diameter (m),
//         density (kg/m³), velocity (m/s)
// Output: pressure drop in Pa and bar
// ─────────────────────────────────────────────────────────────
export function calcPressureDrop(f, length, diameter, density, velocity) {
  const dP_Pa = f * (length / diameter) * (density * Math.pow(velocity, 2) / 2)
  return {
    Pa:  dP_Pa,
    bar: dP_Pa / 100000,
    psi: dP_Pa / 6894.76,
  }
}

// ─────────────────────────────────────────────────────────────
// 6. PUMP HEAD REQUIRED
// H = (ΔP / ρg) + elevation + velocity_head + losses
// Input : dP_Pa (Pa), density (kg/m³), elevation (m), velocity (m/s)
// Output: total dynamic head in meters (TDH)
// ─────────────────────────────────────────────────────────────
export function calcPumpHead(dP_Pa, density, elevation, velocity) {
  const g = 9.81
  const pressureHead  = dP_Pa / (density * g)
  const elevationHead = elevation                          // already in meters
  const velocityHead  = Math.pow(velocity, 2) / (2 * g)   // usually small
  const minorLosses   = velocityHead * 0.1                 // 10% allowance for fittings

  const TDH = pressureHead + elevationHead + velocityHead + minorLosses

  return {
    TDH,             // Total Dynamic Head in meters
    pressureHead,
    elevationHead,
    velocityHead,
  }
}

// ─────────────────────────────────────────────────────────────
// 7. PUMP POWER
// P = (ρ × g × Q × H) / η
// Input : density (kg/m³), flowM3s (m³/s), TDH (m), efficiency (0–1)
// Output: power in Watts and kW
// Typical pump efficiency: 0.65–0.85 for centrifugal pumps
// ─────────────────────────────────────────────────────────────
export function calcPumpPower(density, flowM3s, TDH, efficiency = 0.75) {
  const g = 9.81
  const hydraulicPower = density * g * flowM3s * TDH
  const shaftPower     = hydraulicPower / efficiency

  return {
    hydraulic_W:  hydraulicPower,
    shaft_W:      shaftPower,
    shaft_kW:     shaftPower / 1000,
    shaft_hp:     shaftPower / 745.7,
  }
}

// ─────────────────────────────────────────────────────────────
// 8. NPSH AVAILABLE
// NPSHa = (Patm + Ps - Pvapour) / (ρg) + Zs - hf_suction
// Simplified version for above-ground suction
// Input : suctionHead (m) — vertical height from fluid surface to pump
//         density (kg/m³), vapourPressure_Pa (Pa)
//         Typical vapour pressure of water at 20°C = 2338 Pa
// Output: NPSHa in meters
// Rule  : NPSHa must be > NPSHr (pump manufacturer's value) by at least 0.5m
// ─────────────────────────────────────────────────────────────
export function calcNPSH(suctionHead, density, vapourPressure_Pa = 2338) {
  const g           = 9.81
  const Patm        = 101325   // Pa (standard atmosphere)
  const NPSHa = (Patm - vapourPressure_Pa) / (density * g) + suctionHead

  return {
    NPSHa,
    warning: NPSHa < 3 ? 'Low NPSHa — cavitation risk. Check suction conditions.' : null
  }
}

// ─────────────────────────────────────────────────────────────
// 9. FLOW REGIME LABEL
// Returns human-readable flow type string for display
// ─────────────────────────────────────────────────────────────
export function flowRegime(Re) {
  if (Re < 2300)  return { label: 'Laminar',    color: '#27500A', bg: '#EAF3DE' }
  if (Re < 4000)  return { label: 'Transition', color: '#633806', bg: '#FAEEDA' }
  return                  { label: 'Turbulent', color: '#791F1F', bg: '#FCEBEB' }
}

// ─────────────────────────────────────────────────────────────
// 10. VELOCITY CHECK
// Flags velocity outside recommended range for liquid pipelines
// ─────────────────────────────────────────────────────────────
export function velocityCheck(velocity) {
  if (velocity < 0.5) return { status: 'Low',  message: 'Risk of sedimentation / fouling'  }
  if (velocity > 3.0) return { status: 'High', message: 'Risk of erosion and noise'         }
  return                     { status: 'Good', message: 'Velocity within recommended range' }
}

// ─────────────────────────────────────────────────────────────
// 11. MASTER CALCULATE FUNCTION
// Call this single function from the UI — it runs everything
// and returns one clean results object
// ─────────────────────────────────────────────────────────────
export function runAllCalculations(inputs) {
  const {
    flowValue,        // number  — e.g. 50
    flowUnit,         // string  — e.g. 'm3/hr'
    diameter,         // number  — meters, from PIPE_SIZES
    pipeLength,       // number  — meters
    elevation,        // number  — meters (+ = pumping uphill)
    fluidKey,         // string  — key from FLUIDS object
    suctionHead,      // number  — meters
    pumpEfficiency,   // number  — 0 to 1, e.g. 0.75
  } = inputs

  const fluid = FLUIDS[fluidKey];
  const flowM3s   = toM3PerSec(flowValue, flowUnit)
  const velocity  = calcVelocity(flowM3s, diameter)
  const Re        = calcReynolds(fluid.density, velocity, diameter, fluid.viscosity)
  const f         = calcFrictionFactor(Re, diameter)
  const dP        = calcPressureDrop(f, pipeLength, diameter, fluid.density, velocity)
  const pumpHead  = calcPumpHead(dP.Pa, fluid.density, elevation, velocity)
  const power     = calcPumpPower(fluid.density, flowM3s, pumpHead.TDH, pumpEfficiency)
  const npsh      = calcNPSH(suctionHead, fluid.density)
  const regime    = flowRegime(Re)
  const velCheck  = velocityCheck(velocity)

  return {
    // Inputs echo (for saving to DB)
    inputs,

    // Flow
    flowM3s,
    flowM3hr:         flowM3s * 3600,

    // Pipe
    velocity:         velocity.toFixed(3),
    velocityCheck:    velCheck,

    // Friction & Flow regime
    reynoldsNumber:   Math.round(Re),
    frictionFactor:   f.toFixed(5),
    flowRegime:       regime,

    // Pressure
    pressureDrop_Pa:  Math.round(dP.Pa),
    pressureDrop_bar: dP.bar.toFixed(4),
    pressureDrop_psi: dP.psi.toFixed(3),

    // Pump
    TDH:              pumpHead.TDH.toFixed(2),
    pressureHead:     pumpHead.pressureHead.toFixed(2),
    elevationHead:    pumpHead.elevationHead.toFixed(2),

    // Power
    shaft_kW:         power.shaft_kW.toFixed(2),
    shaft_hp:         power.shaft_hp.toFixed(2),

    // NPSH
    NPSHa:            npsh.NPSHa.toFixed(2),
    npshWarning:      npsh.warning,
  }
}