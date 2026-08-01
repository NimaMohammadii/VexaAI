import { AI_CHAT_HTML } from './ai-chat-html.js';
import { AI_CHAT_JS } from './ai-chat-client.js';
import { AI_CHAT_CSS } from './ai-chat-styles.js';

const DEFAULT_APP_URL = 'https://vchat.vexaagent.workers.dev';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-5.6-luna';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      if (
        url.pathname === '/' ||
        url.pathname === '/mini-app/chat' ||
        url.pathname === '/mini-app/chat/'
      ) {
        return textResponse(AI_CHAT_HTML, 'text/html; charset=UTF-8');
      }

      if (url.pathname === '/mini-app/chat/styles.css') {
        return textResponse(AI_CHAT_CSS, 'text/css; charset=UTF-8');
      }

      if (url.pathname === '/mini-app/chat/app.js') {
        return textResponse(
          AI_CHAT_JS,
          'application/javascript; charset=UTF-8'
        );
      }

      if (url.pathname === '/mini-app') {
        return Response.redirect(new URL('/', request.url).toString(), 302);
      }
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/api/telegram'
    ) {
      return handleTelegramWebhook(request, env);
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/mini-app/api/session'
    ) {
      return jsonResponse({
        locked: false,
        aiChatLock: {
          locked: false
        },
        serverNow: Math.floor(Date.now() / 1000)
      });
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/mini-app/api/section-open'
    ) {
      return jsonResponse({ ok: true });
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/mini-app/api/chat'
    ) {
      return handleAiChat(request, env);
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/mini-app/api/image'
    ) {
      return proxyOrMissing(
        request,
        env.AI_IMAGE_API_URL,
        'Image generation backend is not configured',
        'application/json; charset=UTF-8'
      );
    }

    return new Response('Not Found', {
      status: 404,
      headers: noStoreHeaders('text/plain; charset=UTF-8')
    });
  }
};

async function handleAiChat(request, env) {
  const apiKey = getOpenAiApiKey(env);

  if (!apiKey) {
    return jsonResponse(
      {
        error:
          'OpenAI API key is not configured. Use OPENAI_API_KEY, GPT_API_KEY, GPT_API, or API_GPT.'
      },
      500
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid chat request' }, 400);
  }

  const messages = Array.isArray(payload.messages)
    ? payload.messages.slice(-20)
    : [];

  if (messages.length === 0) {
    return jsonResponse({ error: 'No chat messages were provided' }, 400);
  }

  const input = messages
    .map(buildOpenAiMessage)
    .filter(Boolean);

  if (input.length === 0) {
    return jsonResponse({ error: 'No valid chat messages were provided' }, 400);
  }

  let upstream;

  try {
    upstream = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input,
        max_output_tokens: 2048,
        store: false
      })
    });
  } catch {
    return jsonResponse(
      { error: 'Could not connect to the OpenAI API' },
      502
    );
  }

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const message =
      data && data.error && data.error.message
        ? data.error.message
        : 'OpenAI request failed';

    return jsonResponse({ error: message }, upstream.status);
  }

  const outputText = extractOpenAiText(data);

  if (!outputText) {
    return jsonResponse(
      { error: 'The model returned an empty response' },
      502
    );
  }

  return ndjsonResponse([
    {
      type: 'status',
      status: 'thinking'
    },
    {
      type: 'result',
      data: {
        type: 'message',
        message: outputText
      }
    }
  ]);
}

function buildOpenAiMessage(message) {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const role = message.role === 'assistant' ? 'assistant' : 'user';
  const text = String(message.content || '').trim();
  const attachment = message.attachment;

  if (role === 'assistant' || !attachment) {
    if (!text) {
      return null;
    }

    return {
      role,
      content: text
    };
  }

  const content = [];

  if (text) {
    content.push({
      type: 'input_text',
      text
    });
  }

  const dataUrl = String(attachment.dataUrl || '');

  if (attachment.isImage && dataUrl.startsWith('data:image/')) {
    content.push({
      type: 'input_image',
      image_url: dataUrl,
      detail: 'auto'
    });
  } else if (dataUrl.includes(';base64,')) {
    content.push({
      type: 'input_file',
      filename: String(attachment.name || 'attachment'),
      file_data: dataUrl.split(';base64,')[1]
    });
  }

  if (content.length === 0) {
    return null;
  }

  return {
    role,
    content
  };
}

function extractOpenAiText(data) {
  if (data && typeof data.output_text === 'string') {
    const outputText = data.output_text.trim();

    if (outputText) {
      return outputText;
    }
  }

  const output = data && Array.isArray(data.output) ? data.output : [];
  const textParts = [];

  for (const item of output) {
    const content = item && Array.isArray(item.content) ? item.content : [];

    for (const part of content) {
      if (part && part.type === 'output_text' && part.text) {
        textParts.push(String(part.text));
      }
    }
  }

  return textParts.join('\n').trim();
}

function getOpenAiApiKey(env) {
  return (
    env.OPENAI_API_KEY ||
    env.GPT_API_KEY ||
    env.GPT_API ||
    env.API_GPT ||
    ''
  );
}

async function handleTelegramWebhook(request, env) {
  if (!env.BOT_TOKEN) {
    return jsonResponse({ error: 'BOT_TOKEN is not configured' }, 500);
  }

  let update;

  try {
    update = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid Telegram update' }, 400);
  }

  const message = update && update.message;
  const chatId = message && message.chat && message.chat.id;

  if (chatId) {
    const appUrl = env.APP_URL || DEFAULT_APP_URL;

    await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'Open VexaAI Chat',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Open AI Chat',
                  web_app: {
                    url: appUrl
                  }
                }
              ]
            ]
          }
        })
      }
    );
  }

  return jsonResponse({ ok: true });
}

async function proxyOrMissing(
  request,
  targetUrl,
  missingMessage,
  contentType
) {
  if (!targetUrl) {
    return jsonResponse({ error: missingMessage }, 503);
  }

  const body = await request.arrayBuffer();
  const upstream = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'content-type':
        request.headers.get('content-type') || 'application/json',
      accept: request.headers.get('accept') || '*/*'
    },
    body
  });

  const headers = new Headers(upstream.headers);
  headers.set('cache-control', 'no-store');

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  });
}

function ndjsonResponse(events, status = 200) {
  const body = `${events.map((event) => JSON.stringify(event)).join('\n')}\n`;

  return textResponse(
    body,
    'application/x-ndjson; charset=UTF-8',
    status
  );
}

function textResponse(body, contentType, status = 200) {
  return new Response(body, {
    status,
    headers: noStoreHeaders(contentType)
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: noStoreHeaders('application/json; charset=UTF-8')
  });
}

function noStoreHeaders(contentType) {
  return {
    'content-type': contentType,
    'cache-control': 'no-cache, no-store, must-revalidate',
    pragma: 'no-cache',
    expires: '0'
  };
}
