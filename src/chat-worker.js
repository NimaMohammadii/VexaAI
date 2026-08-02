import app from './github-worker.js';

const RESPONSE_FORMAT_INSTRUCTION = [
  'RESPONSE PRESENTATION:',
  'For every normal text response, choose 1 to 3 genuinely important phrases and wrap only those phrases in double asterisks.',
  'The client converts the markers into real bold text, so never discuss the markers and never bold an entire paragraph.',
  'Use short, ordered paragraphs. Use lists only when they improve clarity.',
  'Put multi-line code in fenced code blocks and short identifiers in inline code.'
].join(' ');

function withResponseFormatting(request) {
  const url = new URL(request.url);
  if (request.method !== 'POST' || url.pathname !== '/mini-app/api/chat') {
    return request;
  }

  return request.clone().json().then((payload) => {
    if (!payload || !Array.isArray(payload.messages)) return request;

    const messages = payload.messages.map((message) => {
      if (!message || typeof message !== 'object') return message;
      return { ...message };
    });

    const latestUserIndex = [...messages]
      .map((message, index) => ({ message, index }))
      .reverse()
      .find(({ message }) => message && message.role !== 'assistant')?.index;

    if (latestUserIndex === undefined) return request;

    const latest = messages[latestUserIndex];
    latest.content = `${RESPONSE_FORMAT_INSTRUCTION}\n\nUSER REQUEST:\n${String(latest.content || '')}`;
    payload.messages = messages;

    const headers = new Headers(request.headers);
    headers.set('content-type', 'application/json');
    headers.delete('content-length');

    return new Request(request.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  }).catch(() => request);
}

export default {
  async fetch(request, env, ctx) {
    const formattedRequest = await withResponseFormatting(request);
    return app.fetch(formattedRequest, env, ctx);
  }
};
