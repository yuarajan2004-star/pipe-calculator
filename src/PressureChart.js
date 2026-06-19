// PressureChart.js — Day 2, Phase 7
// Shows how pressure drop changes across different pipe diameters,
// for the SAME flow rate and fluid the user just calculated.
// Helps engineers visually pick the most efficient pipe size.

import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot
} from 'recharts'
import {
  PIPE_SIZES, FLUIDS, toM3PerSec, calcVelocity,
  calcReynolds, calcFrictionFactor, calcPressureDrop
} from './calculations'

export default function PressureChart({ inputs, results }) {

  if (!results) return null

  // Build one data point per standard pipe size, using the SAME
  // flow rate and fluid as the current calculation
  const fluid   = FLUIDS[inputs.fluidKey]
  const flowM3s = toM3PerSec(inputs.flowValue, inputs.flowUnit)

  const chartData = PIPE_SIZES.map(p => {
    const velocity = calcVelocity(flowM3s, p.diameter)
    const Re       = calcReynolds(fluid.density, velocity, p.diameter, fluid.viscosity)
    const f        = calcFrictionFactor(Re, p.diameter)
    const dP       = calcPressureDrop(f, inputs.pipeLength, p.diameter, fluid.density, velocity)

    return {
      size: p.label.replace('  (Sch 40)', '"').replace(' (Sch 40)', '"'),
      diameter: p.diameter,
      pressureDropBar: parseFloat(dP.bar.toFixed(4)),
      velocity: parseFloat(velocity.toFixed(2)),
    }
  })

  // Find which point matches the user's CURRENT pipe selection (for highlighting)
  const currentPoint = chartData.find(d => Math.abs(d.diameter - inputs.diameter) < 0.0001)

  const s = {
    card: {
      background: '#fff',
      borderRadius: '14px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      marginTop: '20px',
    },
    cardTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#185FA5',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '8px',
      paddingBottom: '10px',
      borderBottom: '2px solid #e0f0ff',
    },
    subtitle: {
      fontSize: '12px',
      color: '#9ca3af',
      marginBottom: '16px',
    },
    tooltipBox: {
      background: '#1a1a2e',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '8px',
      fontSize: '12px',
      lineHeight: 1.6,
    },
  }

  // Custom tooltip showing pipe size, pressure drop, and velocity together
  function CustomTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null
    const d = payload[0].payload
    return (
      <div style={s.tooltipBox}>
        <strong>{d.size} pipe</strong><br/>
        Pressure drop: {d.pressureDropBar} bar<br/>
        Velocity: {d.velocity} m/s
      </div>
    )
  }

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>📈 Pressure Drop vs Pipe Size</div>
      <p style={s.subtitle}>
        Same flow rate ({inputs.flowValue} {inputs.flowUnit}) and fluid across standard pipe sizes.
        Your current selection is highlighted.
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="size" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} label={{ value: 'bar', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="pressureDropBar"
            stroke="#185FA5"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#185FA5' }}
            activeDot={{ r: 6 }}
          />
          {currentPoint && (
            <ReferenceDot
              x={currentPoint.size}
              y={currentPoint.pressureDropBar}
              r={8}
              fill="#1D9E75"
              stroke="#fff"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}