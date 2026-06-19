import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error'|'success', text }

  const handleSubmit = async () => {
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Enter your email and password.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: 'error', text: error.message });
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({
          type: 'success',
          text: 'Account created! Check your email to confirm, then log in.',
        });
        setMode('login');
      }
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / App name */}
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>⚙</span>
          <span style={styles.logoText}>Pipe Calculator</span>
        </div>

        <h1 style={styles.heading}>
          {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
        </h1>
        <p style={styles.subheading}>
          {mode === 'login'
            ? 'Access your saved calculations and history.'
            : 'Free forever. No credit card required.'}
        </p>

        {/* Tab switcher */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
            onClick={() => { setMode('login'); setMessage(null); }}
          >
            Log In
          </button>
          <button
            style={{ ...styles.tab, ...(mode === 'signup' ? styles.tabActive : {}) }}
            onClick={() => { setMode('signup'); setMessage(null); }}
          >
            Sign Up
          </button>
        </div>

        {/* Message banner */}
        {message && (
          <div style={message.type === 'error' ? styles.errorBanner : styles.successBanner}>
            {message.text}
          </div>
        )}

        {/* Form fields */}
        <div style={styles.fieldWrap}>
          <label style={styles.label}>Email address</label>
          <input
            style={styles.input}
            type="email"
            placeholder="engineer@company.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setMessage(null); }}
            onKeyDown={handleKeyDown}
            autoComplete="email"
          />
        </div>

        <div style={styles.fieldWrap}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setMessage(null); }}
            onKeyDown={handleKeyDown}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        <button
          style={loading ? styles.btnDisabled : styles.btn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? 'Please wait…'
            : mode === 'login'
            ? 'Log In'
            : 'Create Account'}
        </button>

        <p style={styles.switchText}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            style={styles.switchLink}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null); }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F0F4F8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 14,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.08)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoIcon: { fontSize: 28 },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0F2240',
    letterSpacing: '-0.3px',
  },
  heading: {
    margin: '0 0 6px',
    fontSize: 22,
    fontWeight: 700,
    color: '#0F2240',
    letterSpacing: '-0.3px',
  },
  subheading: {
    margin: '0 0 24px',
    fontSize: 13,
    color: '#6B7A90',
    lineHeight: 1.5,
  },
  tabs: {
    display: 'flex',
    background: '#EDF2F7',
    borderRadius: 8,
    padding: 3,
    marginBottom: 20,
    gap: 3,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    fontSize: 14,
    fontWeight: 500,
    color: '#6B7A90',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: '#fff',
    color: '#1E56A0',
    fontWeight: 700,
    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
  },
  errorBanner: {
    background: '#FFF5F5',
    border: '1px solid #FC8181',
    borderRadius: 7,
    padding: '10px 14px',
    fontSize: 13,
    color: '#742A2A',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  successBanner: {
    background: '#F0FFF4',
    border: '1px solid #68D391',
    borderRadius: 7,
    padding: '10px 14px',
    fontSize: 13,
    color: '#22543D',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '10px 13px',
    border: '1.5px solid #CBD5E0',
    borderRadius: 7,
    fontSize: 14,
    color: '#1A2332',
    background: '#FAFBFC',
    outline: 'none',
  },
  btn: {
    width: '100%',
    padding: '12px 0',
    background: '#1E56A0',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 6,
    letterSpacing: '0.2px',
  },
  btnDisabled: {
    width: '100%',
    padding: '12px 0',
    background: '#A0AEC0',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'not-allowed',
    marginTop: 6,
  },
  switchText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7A90',
    marginTop: 18,
    marginBottom: 0,
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#1E56A0',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
};