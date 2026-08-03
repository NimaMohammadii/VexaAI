import githubWorker from './github-worker.js';
import { TEMPORARY_PREVIEW_CLIENT_JS } from './temporary-preview-client.js';
import { TEMPORARY_PREVIEW_CSS } from './temporary-preview-styles.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-5.6-luna';
const MAX_PREVIEW_HTML_CHARS = 32_000;
const MAX_PREVIEW_TITLE_CHARS = 100;
const MAX_PREVIEW_MESSAGE_CHARS = 1_200;

const WORKSPACE_DECISION_INSTRUCTIONS = `
Choose Vexa's next action from the available functions using your own judgment and the full conversation. Do not answer directly.
`;

const WORKSPACE_TOOLS = [
  {
    type: 'function',
    name: 'delegate_to_vexa',
    description:
      'Pass the request unchanged to Vexa\'s existing assistant and GitHub agent.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    strict: true
  },
  {
    type: 'function',
    name: 'ask_user',
    description:
      'Ask the user concise, specific questions needed before deciding or creating or revising a temporary preview.',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The exact natural-language question or questions to show the user.'
        }
      },
      required: ['message'],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: 'function',
    name: 'render_temporary_preview',
    description:
      'Create or revise a temporary in-app web preview when there is enough information to make a useful result without inventing major choices.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'A short title for the temporary preview.'
        },
        message: {
          type: 'string',
          description: 'A short natural message describing what was created or changed.'
        },
        html: {
          type: 'string',
          description:
            'One complete self-contained HTML document with inline CSS and JavaScript, kept compact.'
        },
        start_new: {
          type: 'boolean',
          description:
            'True only when this should be a separate temporary project rather than a revision of the current preview.'
        }
      },
      required: ['title', 'message', 'html', 'start_new'],
      additionalProperties: false
    },
    strict: true
  }
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/mini-app/api/chat') {
      return handlePreviewAwareChat(request, env, ctx);
    }

    const response = await githubWorker.fetch(request, env, ctx);

    if (
      request.method === 'GET' &&
      url.pathname === '/mini-app/chat/app.js' &&
      response.ok
    ) {
      return appendTextResponse(response, TEMPORARY_PREVIEW_CLIENT_JS);
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/mini-app/chat/styles.css' &&
      response.ok
    ) {
      return appendTextResponse(response, TEMPORARY_PREVIEW_CSS);
    }

    return response;
  }
};

async function handlePreviewAwareChat(request, env, ctx) {
  let payload;

  try {
    payload = await request.clone().json();
  } catch {
    return githubWorker.fetch(request, env, ctx);
  }

  const action = await chooseWorkspaceAction(payload, env).catch(() => null);

  if (!action || action.name === 'delegate_to_vexa') {
    return githubWorker.fetch(request, env, ctx);
  }

  if (action.name === 'ask_user') {
    const message = normalizeText(
      action.arguments.message,
      MAX_PREVIEW_MESSAGE_CHARS
    );

    if (!message) return githubWorker.fetch(request, env, ctx);

    return ndjsonResponse([
      { type: 'status', status: 'thinking' },
      {
        type: 'result',
        data: { type: 'message', message }
      }
    ]);
  }

  if (action.name === 'render_temporary_preview') {
    const html = normalizePreviewHtml(action.arguments.html);
    if (!html) return githubWorker.fetch(request, env, ctx);

    const current = normalizeTemporaryPreview(payload.temporaryPreview);
    const startNew = action.arguments.start_new === true;
    const previewId = !startNew && current
      ? current.previewId
      : crypto.randomUUID();

    return ndjsonResponse([
      { type: 'status', status: 'writing_code' },
      {
        type: 'result',
        data: {
          type: 'preview_document',
          previewId,
          temporary: true,
          title:
            normalizeText(action.arguments.title, MAX_PREVIEW_TITLE_CHARS) ||
            'Temporary preview',
          message:
            normalizeText(action.arguments.message, MAX_PREVIEW_MESSAGE_CHARS) ||
            'The temporary preview is ready.',
          html
        }
      }
    ]);
  }

  return githubWorker.fetch(request, env, ctx);
}

async function chooseWorkspaceAction(payload, env) {
  const apiKey = getOpenAiApiKey(env);
  const messages = Array.isArray(payload && payload.messages)
    ? payload.messages.slice(-20)
    : [];

  if (!apiKey || messages.length === 0) return null;

  const input = messages.map(buildModelMessage).filter(Boolean);
  if (input.length === 0) return null;

  input.push({
    role: 'developer',
    content: JSON.stringify({
      githubConnected: !!String(payload.githubConnection || '').trim(),
      temporaryPreview: normalizeTemporaryPreview(payload.temporaryPreview)
    })
  });

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: WORKSPACE_DECISION_INSTRUCTIONS,
      input,
      tools: WORKSPACE_TOOLS,
      tool_choice: 'required',
      parallel_tool_calls: false,
      max_output_tokens: 5200,
      store: false
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) return null;

  return extractFunctionCall(data);
}

function extractFunctionCall(data) {
  const output = data && Array.isArray(data.output) ? data.output : [];

  for (const item of output) {
    if (!item || item.type !== 'function_call' || !item.name) continue;

    let args = {};
    try {
      args = JSON.parse(String(item.arguments || '{}'));
    } catch {
      return null;
    }

    if (!args || typeof args !== 'object' || Array.isArray(args)) return null;

    return {
      name: String(item.name),
      arguments: args
    };
  }

  return null;
}

function buildModelMessage(message) {
  if (!message || typeof message !== 'object') return null;

  const role = message.role === 'assistant' ? 'assistant' : 'user';
  const text = String(message.content || '').trim();
  const attachment = message.attachment;

  if (role === 'assistant' || !attachment) {
    return text ? { role, content: text } : null;
  }

  const content = [];
  if (text) content.push({ type: 'input_text', text });

  const dataUrl = String(attachment.dataUrl || '');
  if (attachment.isImage && dataUrl.startsWith('data:image/')) {
    content.push({
      type: 'input_image',
      image_url: dataUrl,
      detail: 'auto'
    });
  } else if (attachment.name) {
    content.push({
      type: 'input_text',
      text: `Attached file: ${String(attachment.name)}`
    });
  }

  return content.length ? { role, content } : null;
}

function normalizeTemporaryPreview(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const previewId = String(value.previewId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 80);
  const title = normalizeText(value.title, MAX_PREVIEW_TITLE_CHARS);
  const html = String(value.html || '').trim();

  if (!previewId || !html || html.length > MAX_PREVIEW_HTML_CHARS) return null;

  return { previewId, title, html };
}

function normalizePreviewHtml(value) {
  let html = String(value || '').trim();
  if (!html || html.length > MAX_PREVIEW_HTML_CHARS) return '';

  if (!/<html[\s>]/i.test(html)) {
    html = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  }

  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
    const viewport = '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">';
    html = /<head[\s>]/i.test(html)
      ? html.replace(/<head([^>]*)>/i, `<head$1>${viewport}`)
      : viewport + html;
  }

  return html.length <= MAX_PREVIEW_HTML_CHARS ? html : '';
}

function normalizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
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

function ndjsonResponse(events) {
  return new Response(
    events.map((event) => JSON.stringify(event)).join('\n') + '\n',
    {
      status: 200,
      headers: noStoreHeaders('application/x-ndjson; charset=UTF-8')
    }
  );
}

async function appendTextResponse(response, addition) {
  const text = await response.text();
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store');

  return new Response(`${text}\n${addition}`, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function noStoreHeaders(contentType) {
  return {
    'content-type': contentType,
    'cache-control': 'no-store, no-cache, must-revalidate',
    pragma: 'no-cache',
    expires: '0'
  };
}
