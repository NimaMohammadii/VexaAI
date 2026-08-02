import { AI_CHAT_HTML } from './ai-chat-html.js';
import { AI_CHAT_JS } from './ai-chat-client.js';
import { AI_CHAT_CSS } from './ai-chat-styles.js';
import { VOICE_NAMES, VOICES } from '../voices.js';

const DEFAULT_APP_URL = 'https://vchat.vexaagent.workers.dev';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-5.6-luna';
const ELEVENLABS_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const ELEVENLABS_MODEL = 'eleven_v3';
const DEFAULT_VOICE = 'Nora';

const AI_CHAT_INSTRUCTIONS = `
You are Vexa, an AI assistant inside a Telegram Mini App.
Return exactly one JSON object and no markdown.

For a normal answer:
{"type":"message","message":"your answer"}

When the user explicitly asks you to read text aloud, generate a voice, create speech, create audio, narrate, or perform text-to-speech:
{"type":"speech_request","text":"the exact text to speak","voice":"Nora"}

Available voices:
- Nora: female/girl voice
- Boy: male/boy voice

Use the user's explicitly requested voice. Otherwise use the preferred voice supplied below.
For speech requests, the text field must contain only the text that should be spoken.
Eleven v3 audio tags are supported. When the user asks for a specific emotion, delivery, or non-verbal reaction, you may add suitable tags such as [whispers], [shouts], [sad], [happily], [laughs], [sighs], or [clears throat]. Do not add tags unnecessarily or change the intended words.

Use web search whenever the user asks to search, needs current information, or the answer depends on facts that may have changed. Base the answer on the search results and keep the final response inside the required JSON object.

When the user explicitly requests an image:
{"type":"image_request","prompt":"the image prompt","size":"1024x1024"}
`;

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
        serverNow: Math.floor(Date.now() / 1000),
        voice: DEFAULT_VOICE,
        savedVoices: VOICE_NAMES,
        voiceProfiles: {}
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
      url.pathname === '/mini-app/api/user-voices'
    ) {
      return handleVoiceSelection(request);
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/mini-app/api/voice-demo'
    ) {
      return handleVoiceDemo(request, env);
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/mini-app/api/tts'
    ) {
      return handleTextToSpeech(request, env);
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

  const preferredVoice = getPreferredVoice(messages);
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
        instructions:
          `${AI_CHAT_INSTRUCTIONS}\nPreferred voice: ${preferredVoice}`,
        input,
        tools: [
          {
            type: 'web_search',
            search_context_size: 'medium'
          }
        ],
        tool_choice: 'auto',
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

  const result = parseAiChatResult(outputText, preferredVoice);
  result.voice = normalizeVoiceName(result.voice || preferredVoice);
  result.savedVoices = VOICE_NAMES;
  result.voiceProfiles = {};

  const events = [
    {
      type: 'status',
      status:
        result.type === 'speech_request'
          ? 'generating_voice'
          : responseUsedWebSearch(data)
            ? 'searching'
            : 'thinking'
    },
    {
      type: 'result',
      data: result
    }
  ];

  return ndjsonResponse(events);
}

async function handleTextToSpeech(request, env) {
  const apiKey = String(env.ELEVEN_API || '').trim();

  if (!apiKey) {
    return jsonResponse(
      { error: 'ELEVEN_API is not configured' },
      500
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid text-to-speech request' }, 400);
  }

  const text = String(payload.text || '').trim();

  if (!text) {
    return jsonResponse({ error: 'Text is required' }, 400);
  }

  if (text.length > 5000) {
    return jsonResponse(
      { error: 'Text must be 5000 characters or fewer' },
      400
    );
  }

  const voiceName = normalizeVoiceName(payload.voice);
  const audio = await createElevenLabsSpeech(
    text,
    VOICES[voiceName],
    apiKey
  );

  if (audio.error) {
    return jsonResponse(
      { error: audio.error },
      audio.status || 502
    );
  }

  return jsonResponse({
    audioBase64: arrayBufferToBase64(audio.buffer),
    filename: `vexa-${voiceName.toLowerCase()}-${Date.now()}.mp3`,
    voice: voiceName,
    savedVoices: VOICE_NAMES,
    voiceProfiles: {}
  });
}

async function handleVoiceDemo(request, env) {
  const apiKey = String(env.ELEVEN_API || '').trim();

  if (!apiKey) {
    return jsonResponse(
      { error: 'ELEVEN_API is not configured' },
      500
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid voice preview request' }, 400);
  }

  const voiceName = normalizeVoiceName(payload.voice);
  const audio = await createElevenLabsSpeech(
    'Hello, I am your Vexa voice.',
    VOICES[voiceName],
    apiKey
  );

  if (audio.error) {
    return jsonResponse(
      { error: audio.error },
      audio.status || 502
    );
  }

  return jsonResponse({
    audioBase64: arrayBufferToBase64(audio.buffer),
    voice: voiceName
  });
}

async function handleVoiceSelection(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid voice request' }, 400);
  }

  return jsonResponse({
    selectedVoice: normalizeVoiceName(payload.voice),
    savedVoices: VOICE_NAMES,
    voiceProfiles: {}
  });
}

async function createElevenLabsSpeech(text, voiceId, apiKey) {
  let upstream;

  try {
    upstream = await fetch(
      `${ELEVENLABS_TTS_URL}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'content-type': 'application/json',
          accept: 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_MODEL
        })
      }
    );
  } catch {
    return {
      error: 'Could not connect to ElevenLabs',
      status: 502
    };
  }

  if (!upstream.ok) {
    const errorData = await upstream.json().catch(() => null);
    const message =
      errorData &&
      errorData.detail &&
      typeof errorData.detail === 'object' &&
      errorData.detail.message
        ? errorData.detail.message
        : errorData &&
            errorData.detail &&
            typeof errorData.detail === 'string'
          ? errorData.detail
          : 'ElevenLabs voice generation failed';

    return {
      error: message,
      status: upstream.status
    };
  }

  return {
    buffer: await upstream.arrayBuffer(),
    status: upstream.status
  };
}

function getPreferredVoice(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message && message.preferredVoice) {
      return normalizeVoiceName(message.preferredVoice);
    }
  }

  return DEFAULT_VOICE;
}

function normalizeVoiceName(value) {
  const voice = String(value || '').trim();

  if (voice === VOICES.Boy || /^(boy|male|man|پسر|مرد)$/i.test(voice)) {
    return 'Boy';
  }

  if (
    voice === VOICES.Nora ||
    /^(nora|girl|female|woman|دختر|زن)$/i.test(voice)
  ) {
    return 'Nora';
  }

  return DEFAULT_VOICE;
}

function parseAiChatResult(outputText, preferredVoice) {
  const clean = String(outputText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  let parsed;

  try {
    parsed = JSON.parse(clean);
  } catch {
    return {
      type: 'message',
      message: clean,
      voice: preferredVoice
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      type: 'message',
      message: clean,
      voice: preferredVoice
    };
  }

  if (parsed.type === 'speech_request') {
    const text = String(parsed.text || '').trim();

    if (text) {
      return {
        type: 'speech_request',
        text,
        voice: normalizeVoiceName(parsed.voice || preferredVoice)
      };
    }
  }

  if (parsed.type === 'image_request') {
    const prompt = String(parsed.prompt || '').trim();

    if (prompt) {
      return {
        type: 'image_request',
        prompt,
        size: String(parsed.size || '1024x1024')
      };
    }
  }

  return {
    type: 'message',
    message: String(parsed.message || clean),
    voice: preferredVoice
  };
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

function responseUsedWebSearch(data) {
  const output = data && Array.isArray(data.output) ? data.output : [];
  return output.some((item) => item && item.type === 'web_search_call');
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

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, index + chunkSize)
    );
  }

  return btoa(binary);
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
