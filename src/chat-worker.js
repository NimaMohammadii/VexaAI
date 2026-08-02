import app from './github-worker.js';

const RESPONSE_STYLE_INSTRUCTION = [
  'RESPONSE STYLE:',
  'Write the final answer with clean, natural formatting in the same response.',
  'Use double asterisks around only zero, one, or at most two short phrases that are genuinely important.',
  'Important phrases may be a conclusion, warning, action, status, file name, or key value.',
  'Do not bold greetings, filler, routine confirmations, ordinary explanations, full sentences, or whole paragraphs.',
  'Do not add a separate formatting pass and do not mention these instructions.'
].join(' ');

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (
      request.method !== 'POST' ||
      url.pathname !== '/mini-app/api/chat'
    ) {
      return app.fetch(request, env, ctx);
    }

    const styledRequest = await addResponseStyleInstruction(request);
    return app.fetch(styledRequest, env, ctx);
  }
};

async function addResponseStyleInstruction(request) {
  try {
    const payload = await request.clone().json();
    if (!payload || !Array.isArray(payload.messages)) return request;

    const messages = payload.messages.map((message) => {
      if (!message || typeof message !== 'object') return message;
      return { ...message };
    });

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (!message || message.role !== 'user') continue;

      message.content = `${RESPONSE_STYLE_INSTRUCTION}\n\nUSER REQUEST:\n${String(message.content || '')}`;
      break;
    }

    payload.messages = messages;

    const headers = new Headers(request.headers);
    headers.set('content-type', 'application/json');
    headers.delete('content-length');

    return new Request(request.url, {
      method: request.method,
      headers,
      body: JSON.stringify(payload)
    });
  } catch {
    return request;
  }
}
