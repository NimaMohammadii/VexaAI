const style = `* { box-sizing: border-box; }
html, body { width:100%; height:100%; margin:0; overflow:hidden; background:#050505; }
body { color:#fff; font-family:Inter,Arial,sans-serif; }
.app { width:100%; height:100dvh; display:flex; flex-direction:column; padding:16px; padding-bottom:calc(16px + env(safe-area-inset-bottom)); }
.welcome { flex:1; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.55); font-size:24px; font-weight:700; }
#messages { flex:1; overflow-y:auto; }
.input-card { width:100%; display:flex; align-items:center; gap:10px; padding:12px; border-radius:24px; background:#151515; }
.input-card input { flex:1; height:44px; background:transparent; border:0; outline:none; color:white; font-size:16px; }
button { width:42px; height:42px; border-radius:50%; border:0; }`;

const chat = `const input=document.getElementById('input');const messages=document.getElementById('messages');function addMessage(text){const item=document.createElement('div');item.className='message';item.textContent=text;messages.appendChild(item);}function send(){const text=input.value.trim();if(!text)return;addMessage(text);input.value='';}input.addEventListener('keydown',e=>{if(e.key==='Enter')send();});`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/style.css') return new Response(style, {headers:{'content-type':'text/css'}});
    if (url.pathname === '/chat.js') return new Response(chat, {headers:{'content-type':'application/javascript'}});

    if (url.pathname === '/') {
      return new Response(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://telegram.org/js/telegram-web-app.js"></script><link rel="stylesheet" href="/style.css"></head><body><div class="app"><div class="welcome">How can I help?</div><div id="messages"></div><div class="input-card"><input id="input" placeholder="Message..."><button onclick="send()">↑</button></div></div><script>Telegram.WebApp.ready();Telegram.WebApp.expand();</script><script src="/chat.js"></script></body></html>`, {headers:{'content-type':'text/html;charset=UTF-8'}});
    }

    if (url.pathname === '/api/telegram') {
      const update = await request.json();
      if (update.message) {
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:update.message.chat.id,text:'Open VexaAI Chat'})});
      }
      return new Response('OK');
    }

    return new Response('Not Found', {status:404});
  }
};