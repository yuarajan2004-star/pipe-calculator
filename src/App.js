// App.js — Day 2, Phase 6
// Adds: Save Calculation button + History list below the calculator.

import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Calculator from './Calculator'
import Results from './Results'
import History from './History'
import PressureChart from './PressureChart'
import { runAllCalculations } from './calculations'

export default function App() {

  // ── AUTH STATE ─────────────────────────────────────────────
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── CALCULATOR STATE ───────────────────────────────────────
  const [inputs, setInputs] = useState({
    flowValue:      50,
    flowUnit:       'm3/hr',
    diameter:       0.10226,
    pipeLength:     100,
    elevation:      10,
    fluidKey:       'water',
    suctionHead:    3,
    pumpEfficiency: 0.75,
  })

  const [results, setResults]   = useState(null)
  const [error, setError]       = useState('')
  const [saveMsg, setSaveMsg]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  function handleCalculate() {
    try {
      setError('')
      setSaveMsg('')
      const res = runAllCalculations(inputs)
      setResults(res)
    } catch (err) {
      setError('Calculation error: ' + err.message)
    }
  }

  // ── SAVE TO SUPABASE ─────────────────────────────────────────
  async function handleSave() {
    if (!results) return
    setSaving(true)
    setSaveMsg('')

    const { error } = await supabase.from('calculations').insert({
      user_id: session.user.id,
      inputs:  inputs,
      results: results,
    })

    if (error) {
      setSaveMsg('❌ Save failed: ' + error.message)
    } else {
      setSaveMsg('✅ Saved successfully')
      setRefreshTrigger(prev => prev + 1)   // tells History.js to reload
    }
    setSaving(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setResults(null)
  }

  // ── STYLES ─────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: '100vh',
      background: '#f0f4f8',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '24px 16px',
    },
    header: {
      background: 'linear-gradient(135deg, #0f2027, #185FA5)',
      borderRadius: '14px',
      padding: '20px 28px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      maxWidth: '1100px',
      margin: '0 auto 24px',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
    headerTitle: { color: '#fff', fontSize: '22px', fontWeight: '700', margin: 0 },
    headerSub: { color: '#93c5fd', fontSize: '13px', margin: '4px 0 0' },
    userBox: { display: 'flex', alignItems: 'center', gap: '12px' },
    userEmail: { color: '#cbd5e1', fontSize: '13px' },
    signOutBtn: {
      padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff',
      border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      maxWidth: '1100px',
      margin: '0 auto',
    },
    fullWidth: { maxWidth: '1100px', margin: '0 auto' },
    loadingPage: {
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif", color: '#6b7280',
    },
    saveBtn: {
      width: '100%',
      padding: '12px',
      background: saving ? '#9ca3af' : '#1D9E75',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: saving ? 'not-allowed' : 'pointer',
      marginTop: '12px',
    },
    saveMsg: {
      fontSize: '13px',
      marginTop: '10px',
      textAlign: 'center',
      color: saveMsg.startsWith('✅') ? '#15803d' : '#991b1b',
    },
  }

  if (authLoading) return <div style={s.loadingPage}>Loading...</div>
  if (!session) return <Auth />

  return (
    <div style={s.page}>

      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={{ fontSize: '36px' }}>⚙️</div>
          <div>
            <p style={s.headerTitle}>PipeCalc Pro</p>
            <p style={s.headerSub}>Pipeline & Pump Sizing Calculator — Oil & Gas / Process Engineering</p>
          </div>
        </div>
        <div style={s.userBox}>
          <span style={s.userEmail}>{session.user.email}</span>
          <button style={s.signOutBtn} onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      <div style={s.grid}>
        <Calculator
          inputs={inputs}
          setInputs={setInputs}
          onCalculate={handleCalculate}
          error={error}
        />

        <div>
          <Results results={results} />
          <PressureChart inputs={inputs} results={results} />

          {results && (
            <>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Calculation'}
              </button>
              {saveMsg && <div style={s.saveMsg}>{saveMsg}</div>}
            </>
          )}
        </div>
      </div>

      <div style={s.fullWidth}>
        <History session={session} refreshTrigger={refreshTrigger} />
      </div>

    </div>
  )
}