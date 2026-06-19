// History.js — Day 2, Phase 6
// Fetches and displays the logged-in user's saved calculations.
// Row-Level Security in Supabase ensures each user only ever sees their OWN rows.

import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function History({ session, refreshTrigger }) {

  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Fetch history whenever the component loads OR refreshTrigger changes
  // (refreshTrigger changes every time a new calculation is saved)
  useEffect(() => {
    fetchHistory()
  }, [refreshTrigger])

  async function fetchHistory() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      setError(error.message)
    } else {
      setRows(data)
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    const { error } = await supabase
      .from('calculations')
      .delete()
      .eq('id', id)

    if (!error) {
      setRows(prev => prev.filter(r => r.id !== id))
    }
  }

  // ── STYLES ─────────────────────────────────────────────────
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
      marginBottom: '18px',
      paddingBottom: '10px',
      borderBottom: '2px solid #e0f0ff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    refreshBtn: {
      fontSize: '12px',
      color: '#185FA5',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      textTransform: 'none',
      letterSpacing: '0',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#9ca3af',
      fontSize: '13px',
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 14px',
      background: '#f8fafc',
      borderRadius: '10px',
      marginBottom: '8px',
      border: '1px solid #e2e8f0',
    },
    rowLeft: { flex: 1 },
    rowTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
    },
    rowMeta: {
      fontSize: '11px',
      color: '#9ca3af',
      marginTop: '2px',
    },
    rowStats: {
      display: 'flex',
      gap: '16px',
      marginRight: '12px',
    },
    statItem: { textAlign: 'right' },
    statValue: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#185FA5',
    },
    statLabel: {
      fontSize: '10px',
      color: '#9ca3af',
      textTransform: 'uppercase',
    },
    deleteBtn: {
      padding: '6px 10px',
      background: '#fee2e2',
      color: '#991b1b',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      cursor: 'pointer',
    },
    errorBox: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '13px',
    },
  }

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>
        <span>📜 Calculation History</span>
        <button style={s.refreshBtn} onClick={fetchHistory}>↻ Refresh</button>
      </div>

      {loading && <div style={s.emptyState}>Loading...</div>}

      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div style={s.emptyState}>
          No saved calculations yet. Run a calculation and click "Save" to see it here.
        </div>
      )}

      {!loading && rows.map(row => {
        const inputs  = row.inputs  || {}
        const results = row.results || {}
        const date = new Date(row.created_at).toLocaleString()

        return (
          <div key={row.id} style={s.row}>
            <div style={s.rowLeft}>
              <div style={s.rowTitle}>
                {inputs.flowValue} {inputs.flowUnit} — {inputs.fluidKey}
              </div>
              <div style={s.rowMeta}>{date}</div>
            </div>
            <div style={s.rowStats}>
              <div style={s.statItem}>
                <div style={s.statValue}>{results.TDH}</div>
                <div style={s.statLabel}>TDH (m)</div>
              </div>
              <div style={s.statItem}>
                <div style={s.statValue}>{results.shaft_kW}</div>
                <div style={s.statLabel}>kW</div>
              </div>
            </div>
            <button style={s.deleteBtn} onClick={() => handleDelete(row.id)}>
              🗑
            </button>
          </div>
        )
      })}
    </div>
  )
}