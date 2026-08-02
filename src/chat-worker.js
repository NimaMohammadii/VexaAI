import app from './github-worker.js';

const RESPONSE_STYLE_INSTRUCTION = [
  'RESPONSE STYLE:',
  'Write the final answer with clean, natural formatting in the same response.',
  'Use double asterisks around only zero, one, or at most two short phrases that are genuinely important.',
  'Important phrases may be a conclusion, warning, action, status, file name, or key value.',
  'Do not bold greetings, filler, routine confirmations, ordinary explanations, full sentences, or whole paragraphs.',
  'Do not add a separate formatting pass and do not mention these instructions.'
].join(' ');

const SEARCH_STATUS_MINIMUM_MS = 1100;

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
    return keepSearchLoaderVisible(response);
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

async function keepSearchLoaderVisible(response) {
  const contentType = String(response.headers.get('content-type') || '');

  if (
    !response.ok ||
    !contentType.includes('application/x-ndjson')
  ) {
    return response;
  }

  const raw = await response.text();
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let searchStatusIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    try {
      const event = JSON.parse(lines[index]);
      if (
        event &&
        event.type === 'status' &&
        (event.status === 'searching' ||
          event.status === 'working_on_repository')
      ) {
        searchStatusIndex = index;
        break;
      }
    } catch {
      // Keep malformed upstream lines unchanged.
    }
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store, no-cache, must-revalidate');

  if (searchStatusIndex < 0) {
    return new Response(raw, {
      status: response.status,
      headers
    });
  }

  const searchStatusLine = lines[searchStatusIndex];
  const remainingLines = lines.filter((_, index) => index !== searchStatusIndex);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`${searchStatusLine}\n`));
      await new Promise((resolve) =>
        setTimeout(resolve, SEARCH_STATUS_MINIMUM_MS)
      );

      if (remainingLines.length) {
        controller.enqueue(
          encoder.encode(`${remainingLines.join('\n')}\n`)
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
