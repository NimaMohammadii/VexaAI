import app from './github-worker.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const FORMAT_MODEL = 'gpt-5.6-luna';

const FORMAT_INSTRUCTIONS = `
You are a response presentation formatter.
Return exactly one JSON object: {"message":"formatted text"}.
Preserve the input text exactly: every character, word, punctuation mark, line break, list item, URL, and code block must remain unchanged and in the same order.
Your only allowed change is adding double-asterisk markers around 1 to 3 genuinely important short phrases.
Choose conclusions, important actions, warnings, statuses, file names, or key values.
Never emphasize an entire paragraph or the entire response.
Never place markers inside inline code or fenced code blocks.
Do not add explanations or new text.
The client converts the markers into real bold text, so the user will not see the markers.
`;

export default {
  async fetch(request, env, ctx) {
    const response = await app.fetch(request, env, ctx);
    const url = new URL(request.url);

    if (
      request.method !== 'POST' ||
      url.pathname !== '/mini-app/api/chat' ||
      !response.ok ||
      !String(response.headers.get('content-type') || '').includes('application/x-ndjson')
    ) {
      return response;
    }

    return formatChatResponse(response, env);
  }
};

async function formatChatResponse(response, env) {
  const raw = await response.text();
  const lines = raw.split('\n');
  const events = [];
  let changed = false;

  for (const line of lines) {
    const clean = line.trim();
    if (!clean) continue;

    let event;
    try {
      event = JSON.parse(clean);
    } catch {
      events.push(clean);
      continue;
    }

    if (
      event &&
      event.type === 'result' &&
      event.data &&
      (event.data.type === 'message' || event.data.type === 'github_result') &&
      typeof event.data.message === 'string'
    ) {
      const original = event.data.message;
      const formatted = await addMeaningfulEmphasis(original, env);
      if (formatted !== original) {
        event.data.message = formatted;
        changed = true;
      }
    }

    events.push(JSON.stringify(event));
  }

  if (!changed) {
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(raw, {
      status: response.status,
      headers
    });
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store, no-cache, must-revalidate');

  return new Response(events.join('\n') + '\n', {
    status: response.status,
    headers
  });
}

async function addMeaningfulEmphasis(original, env) {
  const text = String(original || '');
  if (!text.trim() || text.includes('**')) return text;

  const apiKey = getOpenAiApiKey(env);
  if (!apiKey) return text;

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: FORMAT_MODEL,
        instructions: FORMAT_INSTRUCTIONS,
        input: [{ role: 'user', content: text.slice(0, 16000) }],
        max_output_tokens: 6000,
        store: false
      })
    });

    if (!response.ok) return text;
    const data = await response.json().catch(() => null);
    const output = extractOpenAiText(data);
    if (!output) return text;

    const parsed = parseJsonObject(output);
    const formatted = String(parsed && parsed.message || '');
    if (!isSafeFormatting(text, formatted)) return text;
    return formatted;
  } catch {
    return text;
  }
}

function isSafeFormatting(original, formatted) {
  if (!formatted || formatted === original) return false;
  const markers = formatted.match(/\*\*/g) || [];
  const pairCount = markers.length / 2;
  if (!Number.isInteger(pairCount) || pairCount < 1 || pairCount > 3) return false;
  return formatted.replace(/\*\*/g, '') === original;
}

function parseJsonObject(value) {
  const clean = String(value || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function extractOpenAiText(data) {
  if (data && typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const output = data && Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    if (!item || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content.text === 'string' && content.text.trim()) {
        return content.text.trim();
      }
    }
  }
  return '';
}

function getOpenAiApiKey(env) {
  return String(
    env.OPENAI_API_KEY ||
      env.GPT_API_KEY ||
      env.GPT_API ||
      env.API_GPT ||
      ''
  ).trim();
}
