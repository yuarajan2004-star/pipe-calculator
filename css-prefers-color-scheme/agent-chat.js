/**
 * api/agent-chat.js  (CommonJS)
 * ------------------------------------------------------------
 * Vercel serverless function. No "type": "module" required.
 * Env var required: GEMINI_API_KEY (Vercel Project Settings ->
 * Environment Variables, same place as your Supabase keys)
 * ------------------------------------------------------------
 */

const { runAgentTurn } = require('../lib/agent');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, sessionHistory } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: "Missing 'message' string in request body" });
  }

  try {
    const result = await runAgentTurn({
      userMessage: message,
      sessionHistory: sessionHistory || [],
      apiKey: process.env.GEMINI_API_KEY,
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('Agent error:', err);
    return res.status(500).json({ error: err.message });
  }
};