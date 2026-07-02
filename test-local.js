/**
 * test-local.js  (CommonJS)
 * ------------------------------------------------------------
 * Run locally to test/demo the agent without deploying.
 * Place at project root (pipe-calculator/test-local.js).
 *
 * Usage (PowerShell):
 *   $env:GEMINI_API_KEY="your_key_here"
 *   node test-local.js
 * (Requires Node 18+ for built-in fetch. No "type": "module" needed.)
 * ------------------------------------------------------------
 */

const { runAgentTurn } = require('./lib/agent');

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Set GEMINI_API_KEY environment variable first.');
    process.exit(1);
  }

  let sessionHistory = [];

  const prompts = [
    'I need to pump crude oil at 50 m3/hr through a 6 inch Sch 40 pipe, 2000 meters long, 30 meters uphill. Suction head is 2 meters. What is my pressure drop and pump power?',
    'Now try the same scenario with diesel instead.',
    'What if the suction head is -40 meters?',
  ];

  for (const prompt of prompts) {
    console.log('\n=== USER:', prompt);
    const result = await runAgentTurn({ userMessage: prompt, sessionHistory, apiKey });
    console.log('--- AGENT REPLY ---\n', result.reply);
    if (result.toolCallLog.length) {
      console.log('--- TOOL CALLS ---');
      console.log(JSON.stringify(result.toolCallLog, null, 2));
    }
    sessionHistory = result.updatedHistory;
  }
}

main().catch(console.error);