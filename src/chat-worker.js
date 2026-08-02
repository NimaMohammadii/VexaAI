import app from './github-worker.js';

const SEARCH_USED_MARKER = '[[VEXA_WEB_SEARCH_USED]]';
const SEARCH_STATUS_MINIMUM_MS = 1100;

const RESPONSE_STYLE_INSTRUCTION = [
  'RESPONSE STYLE:',
  'Write the final answer with clean, natural formatting in the same response.',
  'Use double asterisks around only zero, one, or at most two short phrases that are genuinely important.',
  'Important phrases may be a conclusion, warning, action, status, file name, or key value.',
  'Do not bold greetings, filler, routine confirmations, ordinary explanations, full sentences, or whole paragraphs.',
  `If and only if you actually use the web_search tool for this request, prefix the message value with ${SEARCH_USED_MARKER}.`,
  `Never include ${SEARCH_USED_MARKER} when web_search was not used.`,
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
    const response = await app.fetch(styledRequest, env, ctx);
    return normalizeChatStatus(response);
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

async function normalizeChatStatus(response) {
  const contentType = String(response.headers.get('content-type') || '');

  if (
    !response.ok ||
    !contentType.includes('application/x-ndjson')
  ) {
    return response;
  }

  const raw = await response.text();
  const events = [];

  for (const line of raw.split('\n')) {
    const clean = line.trim();
    if (!clean) continue;

    try {
      events.push(JSON.parse(clean));
    } catch {
      events.push(clean);
    }
  }

  let usedSearch = false;

  for (const event of events) {
    if (!event || typeof event !== 'object') continue;

    if (
      event.type === 'status' &&
      (event.status === 'searching' ||
        event.status === 'working_on_repository')
    ) {
      usedSearch = true;
    }

    if (
      event.type === 'result' &&
      event.data &&
      typeof event.data.message === 'string' &&
      event.data.message.includes(SEARCH_USED_MARKER)
    ) {
      usedSearch = true;
      event.data.message = event.data.message
        .split(SEARCH_USED_MARKER)
        .join('')
        .trimStart();
    }
  }

  if (usedSearch) {
    let statusFound = false;

    for (const event of events) {
      if (!event || typeof event !== 'object' || event.type !== 'status') {
        continue;
      }

      if (!statusFound) {
        event.status = 'searching';
        statusFound = true;
      }
    }

    if (!statusFound) {
      events.unshift({ type: 'status', status: 'searching' });
    }
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store, no-cache, must-revalidate');

  if (!usedSearch) {
    return new Response(serializeEvents(events), {
      status: response.status,
      headers
    });
  }

  const statusEvents = [];
  const remainingEvents = [];

  for (const event of events) {
    if (
      event &&
      typeof event === 'object' &&
      event.type === 'status' &&
      statusEvents.length === 0
    ) {
      statusEvents.push(event);
    } else {
      remainingEvents.push(event);
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(serializeEvents(statusEvents))
      );

      await new Promise((resolve) =>
        setTimeout(resolve, SEARCH_STATUS_MINIMUM_MS)
      );

      if (remainingEvents.length) {
        controller.enqueue(
          encoder.encode(serializeEvents(remainingEvents))
        );
      }

      controller.close();
    }
  });

  return new Response(stream, {
    status: response.status,
    headers
  });
}

function serializeEvents(events) {
  return events
    .map((event) =>
      typeof event === 'string' ? event : JSON.stringify(event)
    )
    .join('\n') + '\n';
}
