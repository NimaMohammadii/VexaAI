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

    .ai-chat-topbar{position:absolute;z-index:40;top:14px;left:0;right:0;height:calc(56px + env(safe-area-inset-top));display:flex;align-items:flex-end;justify-content:space-between;padding:0 14px 10px;background:linear-gradient(180deg,rgba(0,0,0,.96) 0%,rgba(0,0,0,.82) 72%,rgba(0,0,0,0) 100%);pointer-events:none}
    .ai-chat-topbar button{pointer-events:auto;-webkit-tap-highlight-color:transparent}
    .ai-chat-menu-toggle{position:relative;width:38px;height:38px;display:grid;place-items:center;padding:0;border:0;border-radius:14px;background:rgba(255,255,255,.045);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.055);transition:transform .25s cubic-bezier(.2,.9,.2,1),background .2s ease}
    .ai-chat-menu-toggle:active{transform:scale(.9);background:rgba(255,255,255,.085)}
    .ai-chat-menu-icon{position:relative;width:17px;height:14px;display:block}
    .ai-chat-menu-icon i{position:absolute;left:0;width:17px;height:1.5px;border-radius:999px;background:currentColor;transform-origin:center;transition:top .34s cubic-bezier(.2,.85,.2,1),transform .34s cubic-bezier(.2,.85,.2,1),opacity .18s ease,width .25s ease}
    .ai-chat-menu-icon i:nth-child(1){top:1px}
    .ai-chat-menu-icon i:nth-child(2){top:6.25px;width:13px}
    .ai-chat-menu-icon i:nth-child(3){top:11.5px}
    .chat-drawer-open .ai-chat-menu-icon i:nth-child(1){top:6.25px;transform:rotate(45deg)}
    .chat-drawer-open .ai-chat-menu-icon i:nth-child(2){opacity:0;transform:scaleX(.2)}
    .chat-drawer-open .ai-chat-menu-icon i:nth-child(3){top:6.25px;transform:rotate(-45deg)}

    .ai-model-wrap{position:relative;pointer-events:auto}
    .ai-model-trigger{height:38px;display:flex;align-items:center;gap:7px;padding:0 12px;border:0;border-radius:14px;background:rgba(255,255,255,.045);box-shadow:inset 0 0 0 1px rgba(255,255,255,.055);color:rgba(255,255,255,.9);font:620 12.5px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;letter-spacing:-.012em;transition:transform .2s ease,background .2s ease}
    .ai-model-trigger:active{transform:scale(.94);background:rgba(255,255,255,.085)}
    .ai-model-trigger svg{width:12px;height:12px;transition:transform .25s ease}
    .ai-model-wrap.open .ai-model-trigger svg{transform:rotate(180deg)}
    .ai-model-menu{position:absolute;top:45px;right:0;width:172px;padding:6px;border:1px solid rgba(255,255,255,.075);border-radius:16px;background:rgba(15,15,17,.94);box-shadow:0 18px 50px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.045);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);opacity:0;visibility:hidden;transform:translateY(-7px) scale(.97);transform-origin:top right;transition:opacity .2s ease,visibility .2s ease,transform .28s cubic-bezier(.2,.9,.2,1)}
    .ai-model-wrap.open .ai-model-menu{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
    .ai-model-option{width:100%;height:39px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border:0;border-radius:11px;background:transparent;color:rgba(255,255,255,.58);font:560 12px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;text-align:left}
    .ai-model-option.active{background:rgba(255,255,255,.06);color:#fff}
    .ai-model-option span:last-child{font-size:9px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.06em}

    .ai-chat-drawer-backdrop{position:fixed;z-index:48;inset:0;background:rgba(0,0,0,.48);opacity:0;visibility:hidden;transition:opacity .3s ease,visibility .3s ease;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
    .chat-drawer-open .ai-chat-drawer-backdrop{opacity:1;visibility:visible}
    .ai-chat-drawer{position:fixed;z-index:50;top:0;bottom:0;left:0;width:50vw;overflow:hidden;display:flex;flex-direction:column;padding:calc(31px + env(safe-area-inset-top)) 10px calc(14px + env(safe-area-inset-bottom));background:rgba(10,10,12,.97);border-right:1px solid rgba(255,255,255,.065);box-shadow:18px 0 55px rgba(0,0,0,.42);transform:translateX(-102%);transition:transform .42s cubic-bezier(.2,.85,.2,1);will-change:transform}
    .chat-drawer-open .ai-chat-drawer{transform:translateX(0)}
    .ai-chat-drawer-head{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 5px 0 8px}
    .ai-chat-drawer-head strong{font:650 14px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;letter-spacing:-.025em;color:rgba(255,255,255,.92)}
    .ai-chat-new-button{width:31px;height:31px;display:grid;place-items:center;padding:0;border:0;border-radius:11px;background:rgba(255,255,255,.055);color:rgba(255,255,255,.82);font-size:21px;font-weight:300}
    .ai-chat-history-label{margin:19px 9px 8px;font:560 9.5px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;text-transform:uppercase;letter-spacing:.085em;color:rgba(255,255,255,.26)}
    .ai-chat-history{min-height:0;flex:1;display:flex;flex-direction:column;gap:3px;overflow:auto;padding:0 2px;-webkit-overflow-scrolling:touch}
    .ai-chat-history-item{width:100%;min-height:45px;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:7px 10px;border:0;border-radius:13px;background:transparent;color:rgba(255,255,255,.72);text-align:left;transition:background .18s ease,transform .18s ease}
    .ai-chat-history-item.active{background:rgba(255,255,255,.065);color:#fff}
    .ai-chat-history-item:active{transform:scale(.975);background:rgba(255,255,255,.09)}
    .ai-chat-history-item strong{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:570 12px/1.15 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;letter-spacing:-.015em}
    .ai-chat-history-item small{font:450 9.5px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;color:rgba(255,255,255,.26)}
    .ai-chat-drawer-foot{padding:9px 8px 2px;border-top:1px solid rgba(255,255,255,.045);font:480 10px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;color:rgba(255,255,255,.27)}
    .ai-chat-messages{padding-top:calc(88px + env(safe-area-inset-top))!important}
    @media(max-width:430px){.ai-chat-drawer{width:50vw}.ai-chat-history-item{padding-left:8px;padding-right:8px}.ai-chat-history-item strong{font-size:11.5px}}
  </style>
</head>
<body>
  <section id="aiChatPage" class="ai-chat-page" aria-hidden="false">
    <header class="ai-chat-topbar" aria-label="Chat controls">
      <button id="aiChatMenuToggle" class="ai-chat-menu-toggle" type="button" aria-label="Open chat history" aria-expanded="false" aria-controls="aiChatDrawer"><span class="ai-chat-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span></button>
      <div id="aiModelWrap" class="ai-model-wrap">
        <button id="aiModelTrigger" class="ai-model-trigger" type="button" aria-label="Choose model" aria-expanded="false"><span id="aiModelLabel">Vexa Pro</span><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div id="aiModelMenu" class="ai-model-menu" role="menu" aria-hidden="true">
          <button class="ai-model-option active" type="button" data-model="Vexa Pro"><span>Vexa Pro</span><span>Demo</span></button>
          <button class="ai-model-option" type="button" data-model="Vexa Fast"><span>Vexa Fast</span><span>Demo</span></button>
          <button class="ai-model-option" type="button" data-model="Vexa Reasoning"><span>Vexa Reasoning</span><span>Demo</span></button>
        </div>
      </div>
    </header>

    <div id="aiChatDrawerBackdrop" class="ai-chat-drawer-backdrop" aria-hidden="true"></div>
    <aside id="aiChatDrawer" class="ai-chat-drawer" aria-hidden="true" aria-label="AI chat history">
      <div class="ai-chat-drawer-head"><strong>Chats</strong><button class="ai-chat-new-button" type="button" aria-label="New chat">+</button></div>
      <div class="ai-chat-history-label">Recent</div>
      <div class="ai-chat-history">
        <button class="ai-chat-history-item active" type="button"><strong>Building Vexa AI</strong><small>Now</small></button>
        <button class="ai-chat-history-item" type="button"><strong>GitHub repository setup</strong><small>Yesterday</small></button>
        <button class="ai-chat-history-item" type="button"><strong>App design ideas</strong><small>2 days ago</small></button>
        <button class="ai-chat-history-item" type="button"><strong>AI model pricing</strong><small>3 days ago</small></button>
      </div>
      <div class="ai-chat-drawer-foot">Chat history preview</div>
    </aside>

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
      var menuToggle=document.getElementById('aiChatMenuToggle');
      var drawer=document.getElementById('aiChatDrawer');
      var backdrop=document.getElementById('aiChatDrawerBackdrop');
      var modelWrap=document.getElementById('aiModelWrap');
      var modelTrigger=document.getElementById('aiModelTrigger');
      var modelMenu=document.getElementById('aiModelMenu');
      var modelLabel=document.getElementById('aiModelLabel');

      function setDrawer(open){
        document.documentElement.classList.toggle('chat-drawer-open',!!open);
        menuToggle.setAttribute('aria-expanded',open?'true':'false');
        menuToggle.setAttribute('aria-label',open?'Close chat history':'Open chat history');
        drawer.setAttribute('aria-hidden',open?'false':'true');
        backdrop.setAttribute('aria-hidden',open?'false':'true');
      }

      function setModelMenu(open){
        modelWrap.classList.toggle('open',!!open);
        modelTrigger.setAttribute('aria-expanded',open?'true':'false');
        modelMenu.setAttribute('aria-hidden',open?'false':'true');
      }

      menuToggle.addEventListener('click',function(event){
        event.stopPropagation();
        setModelMenu(false);
        setDrawer(!document.documentElement.classList.contains('chat-drawer-open'));
      });
      backdrop.addEventListener('click',function(){setDrawer(false)});
      modelTrigger.addEventListener('click',function(event){
        event.stopPropagation();
        setDrawer(false);
        setModelMenu(!modelWrap.classList.contains('open'));
      });
      modelMenu.addEventListener('click',function(event){
        var option=event.target.closest('.ai-model-option');
        if(!option)return;
        modelMenu.querySelectorAll('.ai-model-option').forEach(function(item){item.classList.toggle('active',item===option)});
        modelLabel.textContent=option.getAttribute('data-model')||'Vexa Pro';
        setModelMenu(false);
      });
      drawer.addEventListener('click',function(event){
        var item=event.target.closest('.ai-chat-history-item');
        if(!item)return;
        drawer.querySelectorAll('.ai-chat-history-item').forEach(function(row){row.classList.toggle('active',row===item)});
      });
      document.addEventListener('click',function(event){
        if(!modelWrap.contains(event.target))setModelMenu(false);
      });
      document.addEventListener('keydown',function(event){
        if(event.key==='Escape'){
          setDrawer(false);
          setModelMenu(false);
        }
      });
    })();

    (function(){
      var copySvg='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">'
        +'<path d="M15.8 7.6v-.8A2.8 2.8 0 0 0 13 4H6.8A2.8 2.8 0 0 0 4 6.8V13a2.8 2.8 0 0 0 2.8 2.8h.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'
        +'<path d="M9.2 7.6h7A2.8 2.8 0 0 1 19 10.4v6a2.8 2.8 0 0 1-2.8 2.8h-6a2.8 2.8 0 0 1-2.8-2.8v-7a1.8 1.8 0 0 1 1.8-1.8Z" fill="#000" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>'
        +'</svg>';

      function refreshCopyIcons(root){
        var scope=root&&root.querySelectorAll?root:document;
        scope.querySelectorAll('.ai-chat-message-action[aria-label="Copy message"]').forEach(function(button){
          if(button.getAttribute('data-clean-copy-icon')==='3')return;
          button.setAttribute('data-clean-copy-icon','3');
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
  <script type="module" src="/mini-app/chat/app.js?v=20260802-github-same-webview-19"></script>
</body>
</html>`;
