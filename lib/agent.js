/**
 * lib/agent.js  (CommonJS)
 * ------------------------------------------------------------
 * PipeCalc Copilot agent brain. Plain CommonJS — no "type": "module"
 * needed in package.json, so this doesn't interfere with CRA's build.
 * ------------------------------------------------------------
 */

const { geminiToolDeclarations, toolFunctionMap } = require('./pipecalc-tools');

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are PipeCalc Copilot, an engineering assistant for pipeline hydraulic design.
You help engineers size pipes, pumps, and diagnose pressure drop / cavitation risk.

Rules:
- Always use the provided tools to perform calculations. Never compute fluid mechanics yourself.
- If a fluid or pipe size isn't clearly specified, call listAvailableOptions first, then ask the
  user to confirm rather than guessing.
- If required inputs are missing or ambiguous, ask a single clarifying question before calling a tool.
- After getting tool results, explain the answer in plain engineering language. Always mention if
  npshWarning or a non-"Good" velocityCheck status is present in the result — these are safety-relevant.
- Keep responses concise and practical, as if advising a field engineer.`;

function validateArgs(toolName, args) {
  const errors = [];
  if (toolName !== 'calculatePipelineHydraulics') return errors;

  if ('flowValue' in args && args.flowValue <= 0) {
    errors.push(`flowValue must be positive, got ${args.flowValue}.`);
  }
  if ('pipeLength' in args && args.pipeLength <= 0) {
    errors.push(`pipeLength must be positive, got ${args.pipeLength}.`);
  }
  if ('pumpEfficiency' in args && args.pumpEfficiency != null) {
    if (args.pumpEfficiency <= 0 || args.pumpEfficiency > 1) {
      errors.push(`pumpEfficiency must be between 0 and 1, got ${args.pumpEfficiency}.`);
    }
  }
  if ('suctionHead' in args && Math.abs(args.suctionHead) > 50) {
    errors.push(`suctionHead of ${args.suctionHead}m is outside a plausible range (-50 to 50m).`);
  }
  return errors;
}

function executeTool(toolName, args) {
  const fn = toolFunctionMap[toolName];
  if (!fn) return { error: `Unknown tool: ${toolName}` };

  const validationErrors = validateArgs(toolName, args);
  if (validationErrors.length > 0) {
    return { error: 'Guardrail rejected input', details: validationErrors };
  }

  try {
    return fn(args);
  } catch (err) {
    return { error: `Tool execution failed: ${err.message}` };
  }
}

async function runAgentTurn({ userMessage, sessionHistory = [], apiKey }) {
  if (!apiKey) throw new Error('Missing Gemini API key');

  const contents = [...sessionHistory, { role: 'user', parts: [{ text: userMessage }] }];

  let finalText = null;
  const toolCallLog = [];

  for (let turn = 0; turn < 6; turn++) {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        tools: [{ functionDeclarations: geminiToolDeclarations }],
      }),
    });

    const data = await response.json();
    const candidate = data.candidates && data.candidates[0];
    if (!candidate) throw new Error('No response from Gemini: ' + JSON.stringify(data));

    const parts = candidate.content.parts;
    const functionCallPart = parts.find((p) => p.functionCall);

    if (functionCallPart) {
      const { name, args } = functionCallPart.functionCall;
      const result = executeTool(name, args);
      toolCallLog.push({ name, args, result });

      contents.push({ role: 'model', parts: [{ functionCall: { name, args } }] });
      contents.push({ role: 'function', parts: [{ functionResponse: { name, response: result } }] });
      continue;
    }

    finalText = parts.map((p) => p.text || '').join('\n');
    contents.push({ role: 'model', parts: [{ text: finalText }] });
    break;
  }

  return { reply: finalText, toolCallLog, updatedHistory: contents };
}

module.exports = { runAgentTurn };