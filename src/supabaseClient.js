// supabaseClient.js
// This file creates ONE connection to Supabase and exports it.
// Every other file in the app imports 'supabase' from here.
// Think of this as the master valve — one place to control the DB connection.

import { createClient } from '@supabase/supabase-js'

// STEP: Replace these two values with YOUR values from Supabase
// Where to find them: Supabase Dashboard → Settings (gear icon) → API
const SUPABASE_URL = 'https://mztwbchhpqdfwwtjxvsn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dHdiY2hocHFkZnd3dGp4dnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDUzNTYsImV4cCI6MjA5NzM4MTM1Nn0.XEsTkbRWQzJ8vStDnJxhDehdEf6YDPNjIoMmn-EE_Mo'

// Creates and exports the Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─────────────────────────────────────────────────────────────
// HOW TO USE IN OTHER FILES:
//
//   import { supabase } from './supabaseClient'
//
// Then use it like:
//   const { data, error } = await supabase.from('calculations').select('*')
//   const { error } = await supabase.auth.signInWithPassword({ email, password })
// ─────────────────────────────────────────────────────────────