export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(await getChatPage(), {
        headers: {
          "content-type": "text/html;charset=UTF-8"
        }
      });
    }

    if (url.pathname === "/api/telegram") {
      const update = await request.json();

      if (update.message) {
        const chatId = update.message.chat.id;

        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Open VexaAI Chat",
            reply_markup: {
              inline_keyboard: [[
                {
                  text: "Open AI Chat",
                  web_app: {
                    url: "https://vchat.vexaagent.workers.dev"
                  }
                }
              ]]
            }
          })
        });
      }

      return new Response("OK");
    }

    return new Response("Not Found", { status: 404 });
  }
};

async function getChatPage() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<title>VexaAI</title>
<link rel="stylesheet" href="/style.css" />
</head>
<body>
<div class="app">
  <div class="welcome">How can I help?</div>
  <div id="messages"></div>
  <div class="input-card">
    <input id="input" placeholder="Message..." />
    <button onclick="send()">↑</button>
  </div>
</div>
<script>
if (window.Telegram?.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}
</script>
<script src="/chat.js"></script>
</body>
</html>`;
}
