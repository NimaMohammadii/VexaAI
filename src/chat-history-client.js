export const CHAT_HISTORY_CLIENT_JS = String.raw`
;(function(){
  if(window.__vexaPersistentChatsInstalled)return;
  window.__vexaPersistentChatsInstalled=true;

  var baseFetch=window.fetch.bind(window);
  var currentConversationId='';
  var historyReady=false;
  var historyLoading=false;

  window.fetch=function(input,init){
    var prepared=prepareChatRequest(input,init);
    return baseFetch(prepared.input,prepared.init).then(function(response){
      try{
        var requestUrl=requestUrlOf(prepared.input);
        if(requestUrl.indexOf('/mini-app/api/chat')!==-1){
          var responseConversationId=String(
            response.headers.get('x-vexa-conversation-id')||''
          );
          if(responseConversationId)currentConversationId=responseConversationId;
          if(response&&typeof response.clone==='function'){
            observeChatResponse(response.clone());
          }
        }
      }catch(error){}
      return response;
    });
  };

  function requestUrlOf(input){
    return typeof input==='string'
      ?input
      :(input&&input.url?String(input.url):'');
  }

  function prepareChatRequest(input,init){
    var requestUrl=requestUrlOf(input);
    if(requestUrl.indexOf('/mini-app/api/chat')===-1){
      return{input:input,init:init};
    }

    var nextInit=Object.assign({},init||{});
    if(typeof nextInit.body!=='string')return{input:input,init:nextInit};

    try{
      var body=JSON.parse(nextInit.body);
      var messages=Array.isArray(body.messages)?body.messages:[];
      var latest=null;
      for(var index=messages.length-1;index>=0;index-=1){
        if(messages[index]&&messages[index].role==='user'){
          latest=messages[index];
          break;
        }
      }
      body.messages=latest?[latest]:[];
      body.conversationId=currentConversationId;
      body.clientMessageId=makeRequestId();
      nextInit.body=JSON.stringify(body);
    }catch(error){}

    return{input:input,init:nextInit};
  }

  function makeRequestId(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function'){
      return window.crypto.randomUUID();
    }
    return 'msg_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);
  }

  function observeChatResponse(response){
    response.text().then(function(text){
      var hasResult=false;
      String(text||'').split(/\r?\n/).forEach(function(line){
        var clean=String(line||'').trim();
        if(!clean)return;
        try{
          var event=JSON.parse(clean);
          if(event&&event.type==='result')hasResult=true;
        }catch(error){}
      });
      if(hasResult)setTimeout(refreshConversationList,140);
    }).catch(function(){});
  }

  function storageApi(path,payload){
    return baseFetch(path,{
      method:'POST',
      headers:{'content-type':'application/json'},
      cache:'no-store',
      body:JSON.stringify(Object.assign({
        initData:window.Telegram&&Telegram.WebApp
          ?String(Telegram.WebApp.initData||'')
          :''
      },payload||{}))
    }).then(function(response){
      return response.json().catch(function(){return{error:'Invalid response'}})
        .then(function(data){
          if(!response.ok)throw new Error(data.error||'Chat history unavailable');
          return data;
        });
    });
  }

  function bootstrapHistory(){
    if(historyLoading)return;
    historyLoading=true;
    setHistoryStatus('Loading chats…');

    storageApi('/mini-app/api/chats/bootstrap',{
      conversationId:currentConversationId
    }).then(function(data){
      historyReady=true;
      currentConversationId=String(data.conversation&&data.conversation.id||'');
      renderConversationList(data.conversations||[]);
      renderStoredMessages(data.messages||[]);
      setHistoryStatus('Saved to your account');
    }).catch(function(error){
      setHistoryStatus('Chat history unavailable');
      console.warn(error);
    }).finally(function(){
      historyLoading=false;
    });
  }

  function refreshConversationList(){
    if(!historyReady)return;
    storageApi('/mini-app/api/chats/bootstrap',{
      conversationId:currentConversationId
    }).then(function(data){
      currentConversationId=String(data.conversation&&data.conversation.id||currentConversationId);
      renderConversationList(data.conversations||[]);
    }).catch(function(){});
  }

  function createNewConversation(){
    if(historyLoading)return;
    historyLoading=true;
    storageApi('/mini-app/api/chats/create',{}).then(function(data){
      currentConversationId=String(data.conversation&&data.conversation.id||'');
      renderConversationList(data.conversations||[]);
      clearConversationView();
      closeHistoryDrawer();
      var input=document.getElementById('aiChatInput');
      if(input)input.focus();
    }).catch(function(error){
      showHistoryToast(error.message||'Could not create chat');
    }).finally(function(){
      historyLoading=false;
    });
  }

  function openConversation(conversationId){
    var target=String(conversationId||'');
    if(!target||target===currentConversationId){
      closeHistoryDrawer();
      return;
    }
    if(historyLoading)return;
    historyLoading=true;

    storageApi('/mini-app/api/chats/open',{
      conversationId:target
    }).then(function(data){
      currentConversationId=String(data.conversation&&data.conversation.id||target);
      renderConversationList(data.conversations||[]);
      renderStoredMessages(data.messages||[]);
      closeHistoryDrawer();
    }).catch(function(error){
      showHistoryToast(error.message||'Could not open chat');
    }).finally(function(){
      historyLoading=false;
    });
  }

  function renderConversationList(conversations){
    var container=document.querySelector('.ai-chat-history');
    if(!container)return;
    container.innerHTML='';

    if(!conversations.length){
      var empty=document.createElement('div');
      empty.className='vexa-history-empty';
      empty.textContent='No chats yet';
      container.appendChild(empty);
      return;
    }

    conversations.forEach(function(conversation){
      var button=document.createElement('button');
      button.type='button';
      button.className='ai-chat-history-item';
      if(String(conversation.id)===currentConversationId){
        button.classList.add('active');
      }
      button.setAttribute('data-conversation-id',String(conversation.id||''));

      var title=document.createElement('strong');
      title.textContent=String(conversation.title||'New chat');

      var time=document.createElement('small');
      time.textContent=formatRelativeTime(Number(conversation.updatedAt)||0);

      button.appendChild(title);
      button.appendChild(time);
      container.appendChild(button);
    });
  }

  function renderStoredMessages(messages){
    clearConversationView();
    messages.forEach(function(message){
      if(message&&message.kind==='preview'&&message.metadata){
        appendStoredBubble(message);
        appendStoredPreview(message.metadata);
      }else{
        appendStoredBubble(message);
      }
    });
    syncStoredEmptyState();
    scrollStoredMessages();
  }

  function appendStoredBubble(message){
    if(!message||!message.content)return;
    var list=document.getElementById('aiChatMessages');
    if(!list)return;

    var item=document.createElement('div');
    var role=message.role==='assistant'?'assistant':'user';
    item.className='ai-chat-message '+role+' vexa-restored-message';

    var content=document.createElement('div');
    content.className='ai-chat-message-content';
    content.textContent=String(message.content||'');

    item.appendChild(content);
    list.appendChild(item);
  }

  function appendStoredPreview(metadata){
    if(!metadata||metadata.type!=='preview_document')return;
    var list=document.getElementById('aiChatMessages');
    if(!list)return;

    var previewId=String(metadata.previewId||'preview')
      .replace(/[^a-zA-Z0-9_-]/g,'')
      .slice(0,80)||'preview';

    var item=document.createElement('div');
    item.className='ai-chat-message assistant vexa-preview-message';
    item.setAttribute('data-vexa-preview-id',previewId);

    var data={
      previewId:previewId,
      title:String(metadata.title||'Temporary preview'),
      html:String(metadata.html||''),
      message:String(metadata.message||'')
    };
    item.__vexaPreviewData=data;

    var card=document.createElement('section');
    card.className='vexa-preview-card';
    var head=document.createElement('header');
    head.className='vexa-preview-head';
    var heading=document.createElement('div');
    heading.className='vexa-preview-heading';
    var title=document.createElement('strong');
    title.textContent=data.title;
    var badge=document.createElement('span');
    badge.textContent='Temporary';
    heading.appendChild(title);
    heading.appendChild(badge);

    var controls=document.createElement('div');
    controls.className='vexa-preview-controls';
    var reload=document.createElement('button');
    reload.type='button';
    reload.textContent='Reload';
    var open=document.createElement('button');
    open.type='button';
    open.className='primary';
    open.textContent='Open';
    controls.appendChild(reload);
    controls.appendChild(open);
    head.appendChild(heading);
    head.appendChild(controls);

    var frame=createStoredPreviewFrame(data.html);
    reload.addEventListener('click',function(){
      frame.srcdoc='';
      requestAnimationFrame(function(){frame.srcdoc=data.html});
    });
    open.addEventListener('click',function(){openStoredPreview(data)});

    card.appendChild(head);
    card.appendChild(frame);
    item.appendChild(card);
    list.appendChild(item);
  }

  function createStoredPreviewFrame(html){
    var frame=document.createElement('iframe');
    frame.className='vexa-preview-frame';
    frame.setAttribute('sandbox','allow-scripts allow-forms allow-modals');
    frame.setAttribute('referrerpolicy','no-referrer');
    frame.setAttribute('title','Temporary project preview');
    frame.srcdoc=String(html||'');
    return frame;
  }

  function openStoredPreview(data){
    var existing=document.querySelector('.vexa-preview-overlay');
    if(existing)existing.remove();
    var overlay=document.createElement('section');
    overlay.className='vexa-preview-overlay';
    var bar=document.createElement('header');
    bar.className='vexa-preview-overlay-bar';
    var title=document.createElement('strong');
    title.textContent=String(data.title||'Preview');
    var close=document.createElement('button');
    close.type='button';
    close.className='vexa-preview-close';
    close.textContent='Close';
    close.addEventListener('click',function(){overlay.remove()});
    bar.appendChild(title);
    bar.appendChild(close);
    overlay.appendChild(bar);
    overlay.appendChild(createStoredPreviewFrame(data.html));
    document.body.appendChild(overlay);
  }

  function clearConversationView(){
    var list=document.getElementById('aiChatMessages');
    if(!list)return;
    list.querySelectorAll('.ai-chat-message,#aiThinkingRow').forEach(function(node){
      node.remove();
    });
    syncStoredEmptyState();
  }

  function syncStoredEmptyState(){
    var list=document.getElementById('aiChatMessages');
    var empty=document.getElementById('aiChatEmpty');
    if(!list||!empty)return;
    empty.style.display=list.querySelector('.ai-chat-message')?'none':'';
  }

  function scrollStoredMessages(){
    var list=document.getElementById('aiChatMessages');
    if(!list)return;
    requestAnimationFrame(function(){list.scrollTop=list.scrollHeight});
  }

  function closeHistoryDrawer(){
    document.documentElement.classList.remove('chat-drawer-open');
    var toggle=document.getElementById('aiChatMenuToggle');
    var drawer=document.getElementById('aiChatDrawer');
    var backdrop=document.getElementById('aiChatDrawerBackdrop');
    if(toggle){
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Open chat history');
    }
    if(drawer)drawer.setAttribute('aria-hidden','true');
    if(backdrop)backdrop.setAttribute('aria-hidden','true');
  }

  function setHistoryStatus(text){
    var foot=document.querySelector('.ai-chat-drawer-foot');
    if(foot)foot.textContent=String(text||'');
  }

  function showHistoryToast(text){
    var toast=document.getElementById('toast');
    if(!toast)return;
    toast.textContent=String(text||'');
    toast.classList.add('show');
    setTimeout(function(){toast.classList.remove('show')},2200);
  }

  function formatRelativeTime(timestamp){
    if(!timestamp)return'';
    var difference=Math.max(0,Date.now()-timestamp);
    var minute=60*1000;
    var hour=60*minute;
    var day=24*hour;
    if(difference<minute)return'Now';
    if(difference<hour)return Math.floor(difference/minute)+'m ago';
    if(difference<day)return Math.floor(difference/hour)+'h ago';
    if(difference<7*day)return Math.floor(difference/day)+'d ago';
    try{
      return new Date(timestamp).toLocaleDateString(undefined,{month:'short',day:'numeric'});
    }catch(error){return''}
  }

  function bindHistoryControls(){
    var newButton=document.querySelector('.ai-chat-new-button');
    if(newButton){
      newButton.addEventListener('click',function(event){
        event.preventDefault();
        event.stopPropagation();
        createNewConversation();
      });
    }

    var history=document.querySelector('.ai-chat-history');
    if(history){
      history.addEventListener('click',function(event){
        var button=event.target&&event.target.closest
          ?event.target.closest('[data-conversation-id]')
          :null;
        if(!button)return;
        event.preventDefault();
        openConversation(button.getAttribute('data-conversation-id'));
      });
    }
  }

  function start(){
    bindHistoryControls();
    bootstrapHistory();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  }else{
    setTimeout(start,0);
  }
})();
`;
