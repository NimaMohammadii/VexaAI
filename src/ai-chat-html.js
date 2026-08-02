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
  <link rel="stylesheet" href="/mini-app/chat/styles.css?v=20260802-minimal-actions-link-4"/>
  <style>.ai-chat-message-action[aria-label="Copy message"] svg path{stroke-linecap:butt;opacity:.72}</style>
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
      var searchRequested=false;
      var thinkingHoldMs=160;

      function isSearchRequest(value){
        var text=String(value||'')
          .toLowerCase()
          .replace(/[\u200c\u200f]/g,' ');

        return /(search|browse|look\s*up|find\s+online|web|internet|latest|current|today|news|price|weather|github|repository|سرچ|جستجو|جست\s+وجو|بگرد|پیدا\s+کن|چک\s+کن|بررسی\s+کن|تحقیق\s+کن|اینترنت|آنلاین|وب|آخرین|جدیدترین|به\s*روز|امروز|اخبار|قیمت|آب\s*و\s*هوا|هوا|گیت\s*هاب|گیتهاب|ریپو)/i.test(text);
      }

      document.addEventListener('submit',function(event){
        var form=event.target;
        if(!form||form.id!=='aiChatComposer')return;
        var input=document.getElementById('aiChatInput');
        searchRequested=isSearchRequest(input&&input.value);
      },true);

      new MutationObserver(function(){
        if(!searchRequested)return;

        var row=document.getElementById('aiThinkingRow');
        if(!row||row.getAttribute('data-search-transition')==='1')return;

        row.setAttribute('data-search-transition','1');
        row.setAttribute('data-state','thinking');

        var label=row.querySelector('span');
        if(label)label.textContent='Thinking';

        searchRequested=false;

        setTimeout(function(){
          if(!row.isConnected||document.getElementById('aiThinkingRow')!==row){
            return;
          }

          row.setAttribute('data-state','searching');
          var currentLabel=row.querySelector('span');
          if(currentLabel)currentLabel.textContent='Searching…';
        },thinkingHoldMs);
      }).observe(document.documentElement,{
        childList:true,
        subtree:true
      });
    })();
  </script>
  <script type="module" src="/mini-app/chat/app.js?v=20260802-thinking-then-search-12"></script>
</body>
</html>`;
