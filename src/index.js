import { AI_CHAT_HTML } from './ai-chat-html.js';
import { getAiChatClient, getAiChatStyles } from './ai-chat-assets.js';

const DEFAULT_APP_URL = 'https://vchat.vexaagent.workers.dev';

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
        return textResponse(
          await getAiChatStyles(),
          'text/css; charset=UTF-8'
        );
      }

      if (url.pathname === '/mini-app/chat/app.js') {
        return textResponse(
          await getAiChatClient(),
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
      return proxyOrMissing(
        request,
        env.AI_CHAT_API_URL,
        'AI chat backend is not configured',
        'application/x-ndjson; charset=UTF-8'
      );
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
    if (contentType.startsWith('application/x-ndjson')) {
      return textResponse(
        `${JSON.stringify({
          type: 'error',
          error: missingMessage
        })}\n`,
        contentType,
        503
      );
    }

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
