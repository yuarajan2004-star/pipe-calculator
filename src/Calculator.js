// Calculator.js — Phase 4
// Input form ONLY. No results logic here.
// Receives inputs/setInputs and onCalculate as props from App.js (parent).

import React from 'react'
import { FLUIDS, PIPE_SIZES } from './calculations'

export default function Calculator({ inputs, setInputs, onCalculate, error }) {

  function handleChange(e) {
  const { name, value } = e.target
  console.log('name:', name, 'value:', value)
  setInputs(prev => ({
    ...prev,
    [name]: isNaN(value) ? value : parseFloat(value) || value
  }))
}

  const s = {
    card: {
      background: '#fff',
      borderRadius: '14px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    },
    cardTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#185FA5',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '18px',
      paddingBottom: '10px',
      borderBottom: '2px solid #e0f0ff',
    },
    row: { marginBottom: '16px' },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      color: '#6b7280',
      marginBottom: '5px',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    input: {
      width: '100%',
      padding: '9px 12px',
      border: '1.5px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#111827',
      boxSizing: 'border-box',
      outline: 'none',
    },
    select: {
      width: '100%',
      padding: '9px 12px',
      border: '1.5px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#111827',
      boxSizing: 'border-box',
      background: '#fff',
      outline: 'none',
    },
    inputRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '8px',
    },
    calcBtn: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #185FA5, #1D9E75)',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      fontSize: '15px',
      fontWeight: '700',
      cursor: 'pointer',
      marginTop: '8px',
      letterSpacing: '0.02em',
    },
    errorBox: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '13px',
      marginTop: '12px',
    },
  }

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>📥 Input Parameters</div>

      {/* Flow Rate */}
      <div style={s.row}>
        <label style={s.label}>Flow Rate</label>
        <div style={s.inputRow}>
          <input
            style={s.input}
            type="number"
            name="flowValue"
            value={inputs.flowValue}
            onChange={handleChange}
            min="0.1"
          />
          <select style={s.select} name="flowUnit" value={inputs.flowUnit} onChange={handleChange}>
            <option value="m3/hr">m³/hr</option>
            <option value="L/min">L/min</option>
            <option value="L/s">L/s</option>
            <option value="bbl/day">bbl/day</option>
            <option value="GPM">GPM</option>
          </select>
        </div>
      </div>

      {/* Fluid Type */}
      <div style={s.row}>
        <label style={s.label}>Fluid Type</label>
        <select style={s.select} name="fluidKey" value={inputs.fluidKey} onChange={handleChange}>
          {Object.entries(FLUIDS).map(([key, f]) => (
            <option key={key} value={key}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Pipe Size */}
      <div style={s.row}>
        <label style={s.label}>Pipe Size (Sch 40)</label>
        <select style={s.select} name="diameter" value={inputs.diameter} onChange={handleChange}>
          {PIPE_SIZES.map(p => (
            <option key={p.diameter} value={p.diameter}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Pipe Length */}
      <div style={s.row}>
        <label style={s.label}>Pipe Length (m)</label>
        <input
          style={s.input}
          type="number"
          name="pipeLength"
          value={inputs.pipeLength}
          onChange={handleChange}
          min="1"
        />
      </div>

      {/* Elevation */}
      <div style={s.row}>
        <label style={s.label}>Elevation Change (m) — positive = uphill</label>
        <input
          style={s.input}
          type="number"
          name="elevation"
          value={inputs.elevation}
          onChange={handleChange}
        />
      </div>

      {/* Suction Head */}
      <div style={s.row}>
        <label style={s.label}>Suction Head (m) — for NPSH</label>
        <input
          style={s.input}
          type="number"
          name="suctionHead"
          value={inputs.suctionHead}
          onChange={handleChange}
        />
      </div>

      {/* Pump Efficiency */}
      <div style={s.row}>
        <label style={s.label}>Pump Efficiency (0.50 – 0.90)</label>
        <input
          style={s.input}
          type="number"
          name="pumpEfficiency"
          value={inputs.pumpEfficiency}
          onChange={handleChange}
          min="0.5"
          max="0.95"
          step="0.01"
        />
      </div>

      <button style={s.calcBtn} onClick={onCalculate}>
        ⚡ Calculate
      </button>

      {error && <div style={s.errorBox}>⚠️ {error}</div>}
    </div>
  )
}