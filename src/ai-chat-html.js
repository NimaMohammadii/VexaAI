export const AI_CHAT_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/>
  <meta name="theme-color" content="#000000"/>
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
  <meta http-equiv="Pragma" content="no-cache"/>
  <meta http-equiv="Expires" content="0"/>
  <title>AI Chat</title>
  <link rel="stylesheet" href="/mini-app/chat/styles.css?v=20260802-message-actions-brighter-5"/>
  <style>
    .ai-chat-message-action{color:rgba(255,255,255,.72)!important}
    .ai-chat-message-action svg,.ai-chat-message-action svg *{opacity:1!important}
    @media(hover:hover){.ai-chat-message-action:hover{color:rgba(255,255,255,.94)!important}}
  </style>
</head>
<body>
  <section id="aiChatPage" class="ai-chat-page" aria-hidden="false">
    <div id="aiChatMessages" class="ai-chat-messages" role="log" aria-live="polite"><div id="aiChatEmpty" class="ai-chat-empty"><span>How can I help?</span><canvas id="aiChatEmptyOrb" class="ai-chat-empty-orb" width="96" height="96" aria-hidden="true"></canvas></div></div>
    <form id="aiChatComposer" class="ai-chat-composer">
      <input id="aiChatFile" type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.txt,.md,.markdown,.json,.html,.htm,.xml,.csv,.tsv,.doc,.docx,.rtf,.odt,.ppt,.pptx,.xls,.xlsx,.js,.mjs,.ts,.tsx,.jsx,.py,.css,.sql,.log,.yaml,.yml,.toml,.eml,.ics,.srt,.vtt"/>
      <div id="aiChatAttachmentPreview" class="ai-chat-attachment-preview" aria-hidden="true"></div>
      <button id="aiChatAttach" class="ai-chat-attach" type="button" aria-label="Attach a file"><span aria-hidden="true">+</span></button>
      <textarea id="aiChatInput" maxlength="4000" rows="1" dir="ltr" placeholder="Ask Vexa" aria-label="Ask Vexa"></textarea>
      <button id="aiChatSend" type="submit" aria-label="Send message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m0 0L6.5 10.5M12 5l5.5 5.5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </form>
  </section>
  <div id="toast" class="toast" role="status"></div>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="/mini-app/chat/creature.js?v=20260801-ai-chat-creature-rounded-jelly-2"></script>
  <script>
    (function(){
      if(typeof window.matchMedia!=='function')return;
      var nativeMatchMedia=window.matchMedia.bind(window);
      window.matchMedia=function(query){
        var result=nativeMatchMedia(query);
        if(String(query).trim()!=='(prefers-reduced-motion: reduce)'){
          return result;
        }
        return new Proxy(result,{
          get:function(target,property){
            if(property==='matches')return false;
            var value=Reflect.get(target,property,target);
            return typeof value==='function'?value.bind(target):value;
          }
        });
      };
    })();

    (function(){
      var copySvg='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        +'<path d="M8.5 7.5h7A2.5 2.5 0 0 1 18 10v6.5a2.5 2.5 0 0 1-2.5 2.5H9a2.5 2.5 0 0 1-2.5-2.5v-7A2 2 0 0 1 8.5 7.5Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>'
        +'<path d="M15 7.5V6.8A2.8 2.8 0 0 0 12.2 4H6.8A2.8 2.8 0 0 0 4 6.8v5.4A2.8 2.8 0 0 0 6.5 15" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'
        +'</svg>';

      function refreshCopyIcons(root){
        var scope=root&&root.querySelectorAll?root:document;
        scope.querySelectorAll('.ai-chat-message-action[aria-label="Copy message"]').forEach(function(button){
          if(button.getAttribute('data-clean-copy-icon')==='2')return;
          button.setAttribute('data-clean-copy-icon','2');
          button.innerHTML=copySvg;
        });
      }

      refreshCopyIcons(document);
      new MutationObserver(function(records){
        records.forEach(function(record){
          record.addedNodes.forEach(function(node){
            if(node.nodeType===1)refreshCopyIcons(node);
          });
        });
      }).observe(document.documentElement,{childList:true,subtree:true});
    })();
  </script>
  <script type="module" src="/mini-app/chat/app.js?v=20260802-copy-layers-separated-15"></script>
</body>
</html>`;
