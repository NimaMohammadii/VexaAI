import app from './github-worker.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const FORMAT_MODEL = 'gpt-5.6-luna';

const FORMAT_INSTRUCTIONS = `
You select the most important phrases in an assistant response.
Return exactly one JSON object: {"phrases":["exact phrase 1","exact phrase 2"]}.
Choose 1 to 3 short, genuinely important phrases copied exactly from the input.
Good choices are conclusions, important actions, warnings, statuses, file names, or key values.
Each phrase must be a verbatim contiguous substring of the input.
Do not select an entire sentence or paragraph unless the response is extremely short.
Do not select text inside inline code, fenced code blocks, or URLs.
Do not explain your choices and do not change the phrases.
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
  const outputLines = [];
  let changed = false;

  for (const line of lines) {
    const clean = line.trim();
    if (!clean) continue;

    let event;
    try {
      event = JSON.parse(clean);
    } catch {
      outputLines.push(clean);
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

    outputLines.push(JSON.stringify(event));
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');

  if (!changed) {
    return new Response(raw, {
      status: response.status,
      headers
    });
  }

  headers.set('cache-control', 'no-store, no-cache, must-revalidate');
  return new Response(outputLines.join('\n') + '\n', {
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
        max_output_tokens: 1000,
        store: false
      })
    });

    if (!response.ok) return text;
    const data = await response.json().catch(() => null);
    const parsed = parseJsonObject(extractOpenAiText(data));
    const phrases = parsed && Array.isArray(parsed.phrases)
      ? parsed.phrases
      : [];

    return applyPhraseEmphasis(text, phrases);
  } catch {
    return text;
  }
}

function applyPhraseEmphasis(text, rawPhrases) {
  const blocked = findCodeRanges(text);
  const selected = [];
  const seen = new Set();

  for (const rawPhrase of rawPhrases.slice(0, 8)) {
    const phrase = String(rawPhrase || '');
    const normalized = phrase.trim();

    if (
      !normalized ||
      normalized.length < 2 ||
      normalized.length > 120 ||
      normalized.includes('\n') ||
      normalized.includes('**') ||
      seen.has(normalized) ||
      normalized.length >= Math.max(12, text.trim().length * 0.72)
    ) {
      continue;
    }

    const range = findAvailablePhraseRange(text, phrase, blocked, selected);
    if (!range) continue;

    seen.add(normalized);
    selected.push(range);
    if (selected.length === 3) break;
  }

  if (!selected.length) return text;

  let formatted = text;
  selected
    .sort((first, second) => second.start - first.start)
    .forEach(({ start, end }) => {
      formatted = `${formatted.slice(0, start)}**${formatted.slice(start, end)}**${formatted.slice(end)}`;
    });

  return formatted;
}

function findAvailablePhraseRange(text, phrase, blocked, selected) {
  let from = 0;

  while (from < text.length) {
    const start = text.indexOf(phrase, from);
    if (start < 0) return null;

    const range = { start, end: start + phrase.length };
    const unavailable = [...blocked, ...selected].some((item) => rangesOverlap(range, item));
    if (!unavailable) return range;

    from = start + Math.max(1, phrase.length);
  }

  return null;
}

function findCodeRanges(text) {
  const ranges = [];
  const patterns = [/```[\s\S]*?```/g, /`[^`\n]+`/g, /https?:\/\/\S+/g];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  return ranges;
}

function rangesOverlap(first, second) {
  return first.start < second.end && second.start < first.end;
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
