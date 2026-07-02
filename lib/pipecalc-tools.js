/**
 * lib/pipecalc-tools.js  (CommonJS)
 * ------------------------------------------------------------
 * IMPORTANT: This is a standalone CommonJS mirror of the formulas
 * in src/calculations.js — NOT an import of that file.
 *
 * Why: src/calculations.js uses ES module syntax (`export function`),
 * which works fine inside your CRA app because webpack/Babel handles
 * it. But Vercel's serverless functions run in plain Node, and mixing
 * ESM + CommonJS between the two (via "type": "module" in package.json)
 * breaks CRA's own build process. So this file re-implements the same
 * math independently in CommonJS, verified to produce identical output
 * to src/calculations.js.
 *
 * If you ever change the formulas in src/calculations.js, mirror the
 * same change here so the agent's answers stay consistent with the UI.
 * ------------------------------------------------------------
 */

const FLUIDS = {
  water:        { label: 'Water',             density: 1000, viscosity: 0.001002 },
  seawater:     { label: 'Sea Water',         density: 1025, viscosity: 0.00107  },
  crude_oil:    { label: 'Crude Oil',         density: 850,  viscosity: 0.03     },
  diesel:       { label: 'Diesel',            density: 840,  viscosity: 0.0035   },
  gasoline:     { label: 'Gasoline',          density: 750,  viscosity: 0.00057  },
  natural_gas:  { label: 'Natural Gas (liq)', density: 450,  viscosity: 0.00011  },
  glycol:       { label: 'Ethylene Glycol',   density: 1113, viscosity: 0.0161   },
};

const PIPE_SIZES = [
  { label: '1 inch  (Sch 40)',  diameter: 0.02664 },
  { label: '2 inch  (Sch 40)',  diameter: 0.05250 },
  { label: '3 inch  (Sch 40)',  diameter: 0.07792 },
  { label: '4 inch  (Sch 40)',  diameter: 0.10226 },
  { label: '6 inch  (Sch 40)',  diameter: 0.15402 },
  { label: '8 inch  (Sch 40)',  diameter: 0.20274 },
  { label: '10 inch (Sch 40)',  diameter: 0.25450 },
  { label: '12 inch (Sch 40)',  diameter: 0.30380 },
];

function toM3PerSec(value, unit) {
  switch (unit) {
    case 'm3/hr':  return value / 3600;
    case 'L/min':  return value / 60000;
    case 'L/s':    return value / 1000;
    case 'bbl/day':return value * 0.158987 / 86400;
    case 'GPM':    return value * 0.0000630902;
    default:       return value / 3600;
  }
}

function calcVelocity(flowM3s, diameter) {
  const area = Math.PI / 4 * Math.pow(diameter, 2);
  return flowM3s / area;
}

function calcReynolds(density, velocity, diameter, viscosity) {
  return (density * velocity * diameter) / viscosity;
}

function calcFrictionFactor(Re, diameter, roughness = 0.000046) {
  if (Re < 2300) return 64 / Re;
  const relRoughness = roughness / diameter;
  let f = 0.02;
  for (let i = 0; i < 10; i++) {
    const rhs = -2 * Math.log10(relRoughness / 3.7 + 2.51 / (Re * Math.sqrt(f)));
    f = 1 / Math.pow(rhs, 2);
  }
  return f;
}

function calcPressureDrop(f, length, diameter, density, velocity) {
  const dP_Pa = f * (length / diameter) * (density * Math.pow(velocity, 2) / 2);
  return { Pa: dP_Pa, bar: dP_Pa / 100000, psi: dP_Pa / 6894.76 };
}

function calcPumpHead(dP_Pa, density, elevation, velocity) {
  const g = 9.81;
  const pressureHead  = dP_Pa / (density * g);
  const elevationHead = elevation;
  const velocityHead  = Math.pow(velocity, 2) / (2 * g);
  const minorLosses   = velocityHead * 0.1;
  const TDH = pressureHead + elevationHead + velocityHead + minorLosses;
  return { TDH, pressureHead, elevationHead, velocityHead };
}

function calcPumpPower(density, flowM3s, TDH, efficiency = 0.75) {
  const g = 9.81;
  const hydraulicPower = density * g * flowM3s * TDH;
  const shaftPower     = hydraulicPower / efficiency;
  return {
    hydraulic_W: hydraulicPower,
    shaft_W: shaftPower,
    shaft_kW: shaftPower / 1000,
    shaft_hp: shaftPower / 745.7,
  };
}

function calcNPSH(suctionHead, density, vapourPressure_Pa = 2338) {
  const g = 9.81;
  const Patm = 101325;
  const NPSHa = (Patm - vapourPressure_Pa) / (density * g) + suctionHead;
  return {
    NPSHa,
    warning: NPSHa < 3 ? 'Low NPSHa — cavitation risk. Check suction conditions.' : null,
  };
}

function flowRegime(Re) {
  if (Re < 2300) return { label: 'Laminar',    color: '#27500A', bg: '#EAF3DE' };
  if (Re < 4000) return { label: 'Transition', color: '#633806', bg: '#FAEEDA' };
  return                 { label: 'Turbulent', color: '#791F1F', bg: '#FCEBEB' };
}

function velocityCheck(velocity) {
  if (velocity < 0.5) return { status: 'Low',  message: 'Risk of sedimentation / fouling' };
  if (velocity > 3.0) return { status: 'High', message: 'Risk of erosion and noise' };
  return                     { status: 'Good', message: 'Velocity within recommended range' };
}

function runAllCalculations(inputs) {
  const { flowValue, flowUnit, diameter, pipeLength, elevation, fluidKey, suctionHead, pumpEfficiency } = inputs;
  const fluid = FLUIDS[fluidKey];
  const flowM3s  = toM3PerSec(flowValue, flowUnit);
  const velocity = calcVelocity(flowM3s, diameter);
  const Re       = calcReynolds(fluid.density, velocity, diameter, fluid.viscosity);
  const f        = calcFrictionFactor(Re, diameter);
  const dP       = calcPressureDrop(f, pipeLength, diameter, fluid.density, velocity);
  const pumpHead = calcPumpHead(dP.Pa, fluid.density, elevation, velocity);
  const power    = calcPumpPower(fluid.density, flowM3s, pumpHead.TDH, pumpEfficiency);
  const npsh     = calcNPSH(suctionHead, fluid.density);
  const regime   = flowRegime(Re);
  const velCheck = velocityCheck(velocity);

  return {
    inputs,
    flowM3s,
    flowM3hr: flowM3s * 3600,
    velocity: velocity.toFixed(3),
    velocityCheck: velCheck,
    reynoldsNumber: Math.round(Re),
    frictionFactor: f.toFixed(5),
    flowRegime: regime,
    pressureDrop_Pa: Math.round(dP.Pa),
    pressureDrop_bar: dP.bar.toFixed(4),
    pressureDrop_psi: dP.psi.toFixed(3),
    TDH: pumpHead.TDH.toFixed(2),
    pressureHead: pumpHead.pressureHead.toFixed(2),
    elevationHead: pumpHead.elevationHead.toFixed(2),
    shaft_kW: power.shaft_kW.toFixed(2),
    shaft_hp: power.shaft_hp.toFixed(2),
    NPSHa: npsh.NPSHa.toFixed(2),
    npshWarning: npsh.warning,
  };
}

// ------------------------------------------------------------
// Agent-facing tool functions
// ------------------------------------------------------------
function calculatePipelineHydraulics({
  flowValue, flowUnit, pipeSizeLabel, pipeLength, elevation, fluidKey, suctionHead, pumpEfficiency,
}) {
  const pipe = PIPE_SIZES.find((p) => p.label === pipeSizeLabel);
  if (!pipe) {
    return { error: `Unknown pipe size "${pipeSizeLabel}". Valid options: ${PIPE_SIZES.map((p) => p.label).join(', ')}` };
  }
  if (!FLUIDS[fluidKey]) {
    return { error: `Unknown fluid "${fluidKey}". Valid options: ${Object.keys(FLUIDS).join(', ')}` };
  }
  return runAllCalculations({
    flowValue, flowUnit, diameter: pipe.diameter, pipeLength, elevation, fluidKey,
    suctionHead, pumpEfficiency: pumpEfficiency ?? 0.75,
  });
}

function listAvailableOptions() {
  return {
    fluids: Object.entries(FLUIDS).map(([key, v]) => ({ key, label: v.label })),
    pipeSizes: PIPE_SIZES.map((p) => p.label),
    flowUnits: ['m3/hr', 'L/min', 'L/s', 'bbl/day', 'GPM'],
  };
}

const geminiToolDeclarations = [
  {
    name: 'calculatePipelineHydraulics',
    description:
      'Run the full pipeline hydraulics calculation: velocity, Reynolds number, friction factor, pressure drop, pump head (TDH), pump power, and NPSH available. Use this for any pipe sizing, pump sizing, or pressure drop question.',
    parameters: {
      type: 'object',
      properties: {
        flowValue: { type: 'number', description: 'Flow rate magnitude, e.g. 50' },
        flowUnit: { type: 'string', enum: ['m3/hr', 'L/min', 'L/s', 'bbl/day', 'GPM'], description: 'Unit for flowValue' },
        pipeSizeLabel: { type: 'string', description: 'Exact pipe size label, e.g. "6 inch  (Sch 40)". Call listAvailableOptions first if unsure of exact formatting.' },
        pipeLength: { type: 'number', description: 'Total pipe length in meters' },
        elevation: { type: 'number', description: 'Elevation change in meters. Positive = pumping uphill, negative = downhill.' },
        fluidKey: { type: 'string', enum: ['water', 'seawater', 'crude_oil', 'diesel', 'gasoline', 'natural_gas', 'glycol'], description: 'Key identifying the fluid' },
        suctionHead: { type: 'number', description: 'Vertical height from fluid surface to pump, in meters (used for NPSH)' },
        pumpEfficiency: { type: 'number', description: 'Pump efficiency as a fraction (0-1). Defaults to 0.75 if not given.' },
      },
      required: ['flowValue', 'flowUnit', 'pipeSizeLabel', 'pipeLength', 'elevation', 'fluidKey', 'suctionHead'],
    },
  },
  {
    name: 'listAvailableOptions',
    description: "List the supported fluids, standard pipe sizes, and flow rate units. Call this if the user's fluid or pipe size isn't clear, or they ask what's supported.",
    parameters: { type: 'object', properties: {} },
  },
];

const toolFunctionMap = { calculatePipelineHydraulics, listAvailableOptions };

module.exports = { geminiToolDeclarations, toolFunctionMap, FLUIDS, PIPE_SIZES, runAllCalculations };