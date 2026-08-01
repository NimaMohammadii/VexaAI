export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(await getChatPage(), {
        headers: {
          "content-type": "text/html;charset=UTF-8"
        }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};

async function getChatPage() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
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
<script src="/chat.js"></script>
</body>
</html>`;
}
