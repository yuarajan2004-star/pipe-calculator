// components/CopilotChat.jsx
// PipeCalc Copilot — AI agent chat panel.
// Calls /api/agent-chat (Gemini function-calling agent that uses
// the real calculations.js engine as tools). Inline styles used
// throughout so no Tailwind or extra CSS setup is required.

import React, { useState } from 'react'

export default function CopilotChat() {
  const [messages, setMessages] = useState([])       // { role: 'user' | 'agent', text, toolCallLog? }
  const [input, setInput] = useState('')
  const [sessionHistory, setSessionHistory] = useState([])
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return
    const userText = input
    setMessages(m => [...m, { role: 'user', text: userText }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, sessionHistory }),
      })
      const data = await res.json()

      if (data.error) {
        setMessages(m => [...m, { role: 'agent', text: `Error: ${data.error}` }])
      } else {
        setMessages(m => [
          ...m,
          { role: 'agent', text: data.reply, toolCallLog: data.toolCallLog },
        ])
        setSessionHistory(data.updatedHistory)
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'agent', text: `Request failed: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') sendMessage()
  }

  // ── STYLES (matches App.js's inline-style pattern) ──────────
  const s = {
    card: {
      background: '#fff',
      borderRadius: '14px',
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    },
    title: {
      fontSize: '18px',
      fontWeight: '700',
      margin: 0,
      color: '#0f2027',
    },
    subtitle: {
      fontSize: '13px',
      color: '#6b7280',
      margin: 0,
    },
    messages: {
      minHeight: '260px',
      maxHeight: '420px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '4px',
    },
    rowUser: { display: 'flex', justifyContent: 'flex-end' },
    rowAgent: { display: 'flex', justifyContent: 'flex-start' },
    bubbleUser: {
      background: '#185FA5',
      color: '#fff',
      borderRadius: '12px',
      padding: '10px 14px',
      maxWidth: '80%',
      fontSize: '14px',
      lineHeight: '1.4',
      whiteSpace: 'pre-wrap',
    },
    bubbleAgent: {
      background: '#f0f4f8',
      color: '#111827',
      borderRadius: '12px',
      padding: '10px 14px',
      maxWidth: '80%',
      fontSize: '14px',
      lineHeight: '1.4',
      whiteSpace: 'pre-wrap',
    },
    toolDetails: {
      marginTop: '8px',
      fontSize: '12px',
      color: '#6b7280',
    },
    toolPre: {
      overflowX: 'auto',
      background: '#e5e7eb',
      padding: '8px',
      borderRadius: '8px',
      marginTop: '6px',
      fontSize: '11px',
    },
    loadingText: {
      fontSize: '13px',
      color: '#9ca3af',
      fontStyle: 'italic',
    },
    inputRow: {
      display: 'flex',
      gap: '10px',
    },
    input: {
      flex: 1,
      padding: '10px 14px',
      borderRadius: '10px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      outline: 'none',
    },
    sendBtn: {
      padding: '10px 20px',
      background: loading ? '#9ca3af' : '#1D9E75',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: loading ? 'not-allowed' : 'pointer',
    },
  }

  return (
    <div style={s.card}>
      <div>
        <p style={s.title}>🤖 PipeCalc Copilot</p>
        <p style={s.subtitle}>
          Describe your pipeline scenario in plain English — I'll run the real hydraulic calculations for you.
        </p>
      </div>

      <div style={s.messages}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? s.rowUser : s.rowAgent}>
            <div style={m.role === 'user' ? s.bubbleUser : s.bubbleAgent}>
              <div>{m.text}</div>
              {m.toolCallLog && m.toolCallLog.length > 0 && (
                <details style={s.toolDetails}>
                  <summary>Tool calls used ({m.toolCallLog.length})</summary>
                  <pre style={s.toolPre}>{JSON.stringify(m.toolCallLog, null, 2)}</pre>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && <div style={s.loadingText}>Copilot is calculating...</div>}
      </div>

      <div style={s.inputRow}>
        <input
          style={s.input}
          placeholder="e.g. Pump crude oil 2km uphill at 500 bbl/day, what pipe size do I need?"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button style={s.sendBtn} onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  )
}