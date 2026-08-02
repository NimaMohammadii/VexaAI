import githubWorker from './github-worker.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-5.6-luna';
const MAX_PREVIEW_HTML_CHARS = 280_000;

const PREVIEW_ROUTER_INSTRUCTIONS = `
You are the workspace router and temporary preview builder for Vexa, an AI assistant inside a Telegram Mini App.
Use the full conversation to decide where the latest user request belongs. Never use keyword matching rules and never assume that a connected GitHub account means the user wants to modify a repository.
Return exactly one JSON object and no markdown.

Choose one result:

1. Delegate to the existing assistant or GitHub agent:
{"route":"delegate"}
Use this when the request is normal conversation, research, image, voice, or explicitly concerns an existing repository, branch, pull request, file, bug, current codebase, or connected project.

2. Ask one short clarification:
{"route":"clarify","message":"Ask whether to use the connected repository or create a temporary project inside Vexa."}
Use this only when the conversation genuinely refers to both possible targets and the intended target cannot be inferred.

3. Build a temporary preview inside Vexa:
{"route":"preview","title":"Short project title","message":"A short natural confirmation in the user's language","html":"complete self-contained HTML document"}
Use this when the user asks to create a brand-new website, landing page, dashboard, game, UI, or web app and does not explicitly target an existing repository. A generic request such as “build a website” or “make an app” belongs in the temporary Vexa preview, even when GitHub is connected. If the user explicitly asks for a new project inside Vexa, a temporary build, or a preview, also use this route.

Preview requirements:
- Return one complete HTML document with inline CSS and inline JavaScript.
- Make it polished, responsive, interactive, and usable on mobile.
- Do not return a skeleton or placeholder when the request contains enough detail.
- Avoid external JavaScript dependencies. External images or fonts are allowed only when useful.
- For a native mobile-app request, create a faithful interactive web preview of the app interface; do not claim to build an APK or iOS binary.
- The preview is temporary and must not write to GitHub.
- Keep the HTML under 280000 characters.
`;

const PREVIEW_CLIENT_JS = String.raw`
;(function(){
  if(window.__vexaTemporaryPreviewInstalled)return;
  window.__vexaTemporaryPreviewInstalled=true;

  var originalFetch=window.fetch.bind(window);

  window.fetch=function(input,init){
    return originalFetch(input,init).then(function(response){
      try{
        var requestUrl=typeof input==='string'
          ?input
          :(input&&input.url?String(input.url):'');
        if(
          requestUrl.indexOf('/mini-app/api/chat')!==-1
          &&response
          &&typeof response.clone==='function'
        ){
          observeTemporaryPreview(response.clone());
        }
      }catch(error){}
      return response;
    });
  };

  function observeTemporaryPreview(response){
    response.text().then(function(text){
      String(text||'').split(/\r?\n/).forEach(function(line){
        var clean=String(line||'').trim();
        if(!clean)return;
        var event;
        try{event=JSON.parse(clean)}catch(error){return}
        if(
          event
          &&event.type==='result'
          &&event.data
          &&event.data.type==='preview_document'
        ){
          setTimeout(function(){
            appendTemporaryPreview(event.data);
          },90);
        }
      });
    }).catch(function(){});
  }

  function safePreviewId(value){
    return String(value||'preview').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)||'preview';
  }

  function createPreviewFrame(html){
    var frame=document.createElement('iframe');
    frame.className='vexa-preview-frame';
    frame.setAttribute('sandbox','allow-scripts allow-forms allow-modals');
    frame.setAttribute('referrerpolicy','no-referrer');
    frame.setAttribute('title','Temporary project preview');
    frame.srcdoc=String(html||'');
    return frame;
  }

  function reloadPreviewFrame(frame,html){
    if(!frame)return;
    frame.srcdoc='';
    requestAnimationFrame(function(){
      frame.srcdoc=String(html||'');
    });
  }

  function openExpandedPreview(data){
    var existing=document.querySelector('.vexa-preview-overlay');
    if(existing)existing.remove();

    var overlay=document.createElement('section');
    overlay.className='vexa-preview-overlay';
    overlay.setAttribute('aria-label','Expanded temporary preview');

    var bar=document.createElement('header');
    bar.className='vexa-preview-overlay-bar';

    var title=document.createElement('strong');
    title.textContent=String(data.title||'Preview');

    var close=document.createElement('button');
    close.type='button';
    close.className='vexa-preview-close';
    close.setAttribute('aria-label','Close preview');
    close.textContent='Close';
    close.addEventListener('click',function(){overlay.remove()});

    bar.appendChild(title);
    bar.appendChild(close);
    overlay.appendChild(bar);
    overlay.appendChild(createPreviewFrame(data.html));
    document.body.appendChild(overlay);
  }

  function appendTemporaryPreview(data){
    var list=document.getElementById('aiChatMessages');
    if(!list)return;

    var previewId=safePreviewId(data.previewId);
    if(list.querySelector('[data-vexa-preview-id="'+previewId+'"]'))return;

    var item=document.createElement('div');
    item.className='ai-chat-message assistant vexa-preview-message';
    item.setAttribute('data-vexa-preview-id',previewId);

    var card=document.createElement('section');
    card.className='vexa-preview-card';

    var head=document.createElement('header');
    head.className='vexa-preview-head';

    var heading=document.createElement('div');
    heading.className='vexa-preview-heading';

    var title=document.createElement('strong');
    title.textContent=String(data.title||'Temporary preview');

    var badge=document.createElement('span');
    badge.textContent='Temporary';

    heading.appendChild(title);
    heading.appendChild(badge);

    var controls=document.createElement('div');
    controls.className='vexa-preview-controls';

    var reload=document.createElement('button');
    reload.type='button';
    reload.textContent='Reload';

    var expand=document.createElement('button');
    expand.type='button';
    expand.className='primary';
    expand.textContent='Open';

    controls.appendChild(reload);
    controls.appendChild(expand);
    head.appendChild(heading);
    head.appendChild(controls);

    var frame=createPreviewFrame(data.html);
    reload.addEventListener('click',function(){
      reloadPreviewFrame(frame,data.html);
    });
    expand.addEventListener('click',function(){
      openExpandedPreview(data);
    });

    card.appendChild(head);
    card.appendChild(frame);
    item.appendChild(card);
    list.appendChild(item);

    requestAnimationFrame(function(){
      list.scrollTop=list.scrollHeight;
    });
  }
})();
`;

const PREVIEW_CSS = String.raw`
.ai-chat-message.vexa-preview-message{width:min(100%,760px);max-width:760px;display:block;margin-top:-18px;margin-bottom:34px}
.vexa-preview-card{width:100%;overflow:hidden;border:1px solid rgba(255,255,255,.09);border-radius:22px;background:rgba(12,11,16,.96);box-shadow:0 20px 52px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.045)}
.vexa-preview-head{min-height:54px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 9px 8px 15px;border-bottom:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018))}
.vexa-preview-heading{min-width:0;display:flex;align-items:center;gap:8px}
.vexa-preview-heading strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:680;letter-spacing:-.015em;color:#fff}
.vexa-preview-heading span{flex:0 0 auto;padding:4px 7px;border:1px solid rgba(190,164,255,.14);border-radius:999px;background:rgba(118,75,179,.13);font-size:9.5px;font-weight:650;letter-spacing:.02em;text-transform:uppercase;color:rgba(218,202,255,.72)}
.vexa-preview-controls{display:flex;align-items:center;gap:5px}
.vexa-preview-controls button,.vexa-preview-close{height:34px;padding:0 11px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.045);color:rgba(255,255,255,.72);font-size:11.5px;font-weight:620;transition:transform .17s ease,background .17s ease,color .17s ease}
.vexa-preview-controls button.primary{border-color:rgba(178,139,255,.18);background:linear-gradient(145deg,rgba(74,35,105,.9),rgba(34,15,48,.92));color:rgba(255,255,255,.94)}
.vexa-preview-controls button:active,.vexa-preview-close:active{transform:scale(.92)}
.vexa-preview-frame{display:block;width:100%;height:min(58vh,500px);border:0;background:#fff}
.vexa-preview-overlay{position:fixed;z-index:10000;inset:0;display:flex;flex-direction:column;background:#000}
.vexa-preview-overlay-bar{height:calc(58px + env(safe-area-inset-top));flex:0 0 auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:0 12px 10px;border-bottom:1px solid rgba(255,255,255,.08);background:#08070a;color:#fff}
.vexa-preview-overlay-bar strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:670}
.vexa-preview-overlay .vexa-preview-frame{height:auto;min-height:0;flex:1;background:#fff}
@media(max-width:520px){.ai-chat-message.vexa-preview-message{width:100%;max-width:100%;margin-top:-14px}.vexa-preview-card{border-radius:18px}.vexa-preview-head{padding-left:12px}.vexa-preview-heading span{display:none}.vexa-preview-frame{height:54vh}.vexa-preview-controls button{padding:0 9px}}
`;

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
      return appendTextResponse(response, PREVIEW_CLIENT_JS);
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/mini-app/chat/styles.css' &&
      response.ok
    ) {
      return appendTextResponse(response, PREVIEW_CSS);
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

  const decision = await decideWorkspace(payload, env).catch(() => null);

  if (!decision || decision.route === 'delegate') {
    return githubWorker.fetch(request, env, ctx);
  }

  if (decision.route === 'clarify') {
    return ndjsonResponse([
      { type: 'status', status: 'thinking' },
      {
        type: 'result',
        data: {
          type: 'message',
          message: String(
            decision.message ||
              'Should I do this in the connected repository or create a temporary project inside Vexa?'
          )
        }
      }
    ]);
  }

  if (decision.route === 'preview') {
    return ndjsonResponse([
      { type: 'status', status: 'writing_code' },
      {
        type: 'result',
        data: {
          type: 'preview_document',
          previewId: crypto.randomUUID(),
          temporary: true,
          title: decision.title,
          message: decision.message,
          html: decision.html
        }
      }
    ]);
  }

  return githubWorker.fetch(request, env, ctx);
}

async function decideWorkspace(payload, env) {
  const apiKey = getOpenAiApiKey(env);
  const messages = Array.isArray(payload && payload.messages)
    ? payload.messages.slice(-20)
    : [];

  if (!apiKey || messages.length === 0) {
    return { route: 'delegate' };
  }

  const input = messages.map(buildModelMessage).filter(Boolean);
  if (input.length === 0) return { route: 'delegate' };

  input.push({
    role: 'user',
    content: String(payload.githubConnection || '').trim()
      ? 'SYSTEM WORKSPACE STATE: GitHub is connected, but connection alone does not select the repository workspace.'
      : 'SYSTEM WORKSPACE STATE: GitHub is not connected.'
  });

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: PREVIEW_ROUTER_INSTRUCTIONS,
      input,
      max_output_tokens: 16000,
      store: false
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) return { route: 'delegate' };

  const parsed = parseJsonObject(extractOpenAiText(data));
  const route = String(parsed && parsed.route || 'delegate');

  if (route === 'clarify') {
    const message = String(parsed.message || '').trim();
    return message ? { route, message } : { route: 'delegate' };
  }

  if (route !== 'preview') return { route: 'delegate' };

  const html = normalizePreviewHtml(parsed.html);
  if (!html) return { route: 'delegate' };

  return {
    route: 'preview',
    title: String(parsed.title || 'Temporary preview').trim().slice(0, 100),
    message: String(parsed.message || 'Your temporary preview is ready.').trim(),
    html
  };
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

  return html;
}

function parseJsonObject(value) {
  const clean = String(value || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(clean);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(clean.slice(start, end + 1));
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
}

function extractOpenAiText(data) {
  if (data && typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const output = data && Array.isArray(data.output) ? data.output : [];
  const parts = [];

  output.forEach((item) => {
    const content = item && Array.isArray(item.content) ? item.content : [];
    content.forEach((part) => {
      if (part && typeof part.text === 'string') parts.push(part.text);
    });
  });

  return parts.join('\n').trim();
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
