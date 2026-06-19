// Results.js — Phase 4
// Displays calculation results ONLY. No logic here.
// Receives `results` object as a prop from App.js (parent).

import React from 'react'

export default function Results({ results }) {

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
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#9ca3af',
    },
    resultsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      marginBottom: '16px',
    },
    resultTile: {
      background: '#f8fafc',
      borderRadius: '10px',
      padding: '14px',
      border: '1px solid #e2e8f0',
    },
    resultLabel: {
      fontSize: '11px',
      color: '#6b7280',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: '4px',
    },
    resultValue: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#185FA5',
    },
    resultUnit: {
      fontSize: '12px',
      color: '#9ca3af',
      marginTop: '2px',
    },
    badge: (bg, color) => ({
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      background: bg,
      color: color,
    }),
    warningBox: {
      background: '#fffbeb',
      border: '1px solid #fcd34d',
      color: '#92400e',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '13px',
      marginTop: '12px',
    },
    sectionLabel: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      margin: '16px 0 10px',
    },
  }

  // ── EMPTY STATE (before first calculation) ──────────────────
  if (!results) {
    return (
      <div style={s.card}>
        <div style={s.cardTitle}>📊 Results</div>
        <div style={s.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📐</div>
          <p style={{ fontSize: '14px' }}>Fill in the inputs and click Calculate</p>
        </div>
      </div>
    )
  }

  // ── RESULTS STATE ────────────────────────────────────────────
  return (
    <div style={s.card}>
      <div style={s.cardTitle}>📊 Results</div>

      {/* Flow & Pipe */}
      <div style={s.sectionLabel}>Flow & Pipe</div>
      <div style={s.resultsGrid}>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>Velocity</div>
          <div style={s.resultValue}>{results.velocity}</div>
          <div style={s.resultUnit}>m/s</div>
        </div>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>Reynolds No.</div>
          <div style={s.resultValue}>{results.reynoldsNumber.toLocaleString()}</div>
          <div style={s.resultUnit}>dimensionless</div>
        </div>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>Flow Regime</div>
          <div style={{ marginTop: '6px' }}>
            <span style={s.badge(results.flowRegime.bg, results.flowRegime.color)}>
              {results.flowRegime.label}
            </span>
          </div>
        </div>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>Friction Factor</div>
          <div style={s.resultValue}>{results.frictionFactor}</div>
          <div style={s.resultUnit}>Darcy</div>
        </div>
      </div>

      {/* Pressure */}
      <div style={s.sectionLabel}>Pressure Drop</div>
      <div style={s.resultsGrid}>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>Pressure Drop</div>
          <div style={s.resultValue}>{results.pressureDrop_bar}</div>
          <div style={s.resultUnit}>bar</div>
        </div>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>Pressure Drop</div>
          <div style={s.resultValue}>{results.pressureDrop_psi}</div>
          <div style={s.resultUnit}>psi</div>
        </div>
      </div>

      {/* Pump */}
      <div style={s.sectionLabel}>Pump Sizing</div>
      <div style={s.resultsGrid}>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>Total Head (TDH)</div>
          <div style={s.resultValue}>{results.TDH}</div>
          <div style={s.resultUnit}>meters</div>
        </div>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>Shaft Power</div>
          <div style={s.resultValue}>{results.shaft_kW}</div>
          <div style={s.resultUnit}>kW</div>
        </div>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>Shaft Power</div>
          <div style={s.resultValue}>{results.shaft_hp}</div>
          <div style={s.resultUnit}>HP</div>
        </div>
        <div style={s.resultTile}>
          <div style={s.resultLabel}>NPSHa</div>
          <div style={s.resultValue}>{results.NPSHa}</div>
          <div style={s.resultUnit}>meters</div>
        </div>
      </div>

      {/* Warnings */}
      {results.velocityCheck.status !== 'Good' && (
        <div style={s.warningBox}>
          ⚠️ Velocity {results.velocityCheck.status}: {results.velocityCheck.message}
        </div>
      )}
      {results.npshWarning && (
        <div style={s.warningBox}>
          ⚠️ {results.npshWarning}
        </div>
      )}
    </div>
  )
}