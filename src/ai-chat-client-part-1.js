export const AI_CHAT_CLIENT_PART_1 = `(function(){
  var tg=window.Telegram&&window.Telegram.WebApp;
  if(tg){try{tg.ready&&tg.ready();tg.expand&&tg.expand();tg.disableVerticalSwipes&&tg.disableVerticalSwipes();tg.setBackgroundColor&&tg.setBackgroundColor('#000000');tg.setBottomBarColor&&tg.setBottomBarColor('#000000')}catch(e){}}
  var initData=(tg&&tg.initData)||'';
  var toastTimer=null;
  var lockTimer=null;
  var aiChatOpen=true;
  var aiChatBusy=false;
  var aiChatSendKeepsKeyboard=false;
  var aiChatMessages=[];
  var aiChatAudioUrls=[];
  var aiChatPreferredVoice='Nora';
  var aiChatSavedVoices=[];
  var aiChatVoiceProfiles={};
  var aiChatVoiceMenuBusy=false;
  var aiChatActivePreviewButton=null;
  var aiChatActivePreviewVoice='';
  var aiChatAttachment=null;
  var aiChatAttachmentMaxBytes=10*1024*1024;
  var aiChatAttachmentMimes={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',pdf:'application/pdf',txt:'text/plain',text:'text/plain',md:'text/markdown',markdown:'text/markdown',json:'application/json',html:'text/html',htm:'text/html',xml:'text/xml',csv:'text/csv',tsv:'text/tsv',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',rtf:'application/rtf',odt:'application/vnd.oasis.opendocument.text',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',js:'text/javascript',mjs:'text/javascript',ts:'text/x-typescript',tsx:'text/tsx',jsx:'text/jsx',py:'text/x-python',css:'text/css',sql:'text/x-sql',log:'text/plain',yaml:'text/x-yaml',yml:'text/x-yaml',toml:'application/toml',eml:'message/rfc822',ics:'text/calendar',srt:'application/x-subrip',vtt:'text/vtt'};
  var aiThinkingFrame=0;
  var aiThinkingSearchMix=0;
  var aiThinkingVoiceMix=0;
  var aiThinkingLastFrame=0;
  var stableViewportHeight=Math.max(1,Number(tg&&(tg.viewportStableHeight||tg.viewportHeight))||Number(window.innerHeight)||1);
  function q(id){return document.getElementById(id)}
  function setAiChatVoiceImage(image,voice){
    if(!image)return;

    var source=String(aiChatVoiceProfiles[voice]||'');
    var frame=image.parentElement;

    if(source){
      image.style.backgroundImage=
        'url("'+source.split('"').join('%22')+'")';
      image.classList.add('has-image');

      if(frame&&frame.classList.contains('voice-avatar')){
        frame.classList.add('has-image');
      }
    }else{
      image.style.backgroundImage='';
      image.classList.remove('has-image');

      if(frame&&frame.classList.contains('voice-avatar')){
        frame.classList.remove('has-image');
      }
    }
  }

  function setAiChatVoiceAvatar(avatar,voice){
    if(!avatar)return;

    var source=String(aiChatVoiceProfiles[voice]||'');
    if(source){
      avatar.style.backgroundImage=
        'url("'+source.split('"').join('%22')+'")';
      avatar.classList.add('has-image');
    }else{
      avatar.style.backgroundImage='';
      avatar.classList.remove('has-image');
    }
  }

  function renderAiChatVoiceMenu(){
    var rows=q('aiChatVoiceRows');
    var empty=q('aiChatVoicesEmpty');
    var count=q('aiChatVoiceMenuCount');
    if(!rows||!empty)return;

    var saved=new Set(aiChatSavedVoices);

    rows.querySelectorAll(
      '.voice-option[data-voice-row-name]'
    ).forEach(function(row){
      var voice=String(
        row.getAttribute('data-voice-row-name')||''
      );
      var isSaved=saved.has(voice);
      var select=row.querySelector('.voice-select');
      var image=row.querySelector('.voice-avatar-image');

      row.classList.toggle(
        'voice-not-saved',
        !isSaved
      );

      if(select){
        var active=voice===aiChatPreferredVoice;
        select.classList.toggle('active',active);
        select.setAttribute(
          'aria-pressed',
          active?'true':'false'
        );
      }

      setAiChatVoiceImage(image,voice);
    });

    empty.classList.toggle(
      'show',
      !aiChatSavedVoices.length
    );

    if(count){
      count.textContent=
        String(aiChatSavedVoices.length)+' / 6';
    }
  }

  function setAiChatVoiceMenu(open){
    var wrap=q('aiChatVoiceWrap');
    var card=q('aiChatVoiceCard');
    var menu=q('aiChatVoiceMenu');
    if(!wrap||!card||!menu)return;

    var shouldOpen=!!open;
    wrap.classList.toggle('open',shouldOpen);
    card.setAttribute(
      'aria-expanded',
      shouldOpen?'true':'false'
    );
    menu.setAttribute(
      'aria-hidden',
      shouldOpen?'false':'true'
    );
  }

  function toggleAiChatVoiceMenu(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }

    var wrap=q('aiChatVoiceWrap');
    setAiChatVoiceMenu(
      !(wrap&&wrap.classList.contains('open'))
    );
  }

  function stopAiChatVoicePreview(){
    var audio=q('aiChatVoicePreviewAudio');

    if(audio){
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    if(aiChatActivePreviewButton){
      aiChatActivePreviewButton.classList.remove(
        'loading',
        'playing'
      );
    }

    aiChatActivePreviewButton=null;
    aiChatActivePreviewVoice='';
  }

  async function previewAiChatVoice(button){
    var voiceId=String(
      button.getAttribute('data-preview-voice')||''
    );
    var voiceName=String(
      button.getAttribute('data-preview-name')||'Voice'
    );
    var audio=q('aiChatVoicePreviewAudio');
    if(!voiceId||!audio)return;

    if(
      aiChatActivePreviewButton===button
      &&aiChatActivePreviewVoice===voiceId
      &&!audio.paused
    ){
      audio.pause();
      return;
    }

    stopAiChatVoicePreview();
    aiChatActivePreviewButton=button;
    aiChatActivePreviewVoice=voiceId;
    button.classList.add('loading');

    try{
      var data=await api('/mini-app/api/voice-demo',{
        voice:voiceId
      });

      if(aiChatActivePreviewButton!==button){
        return;
      }

      audio.src=
        'data:audio/mpeg;base64,'
        +String(data.audioBase64||'');
      button.classList.remove('loading');
      button.classList.add('playing');
      await audio.play();
    }catch(error){
      button.classList.remove('loading','playing');
      aiChatActivePreviewButton=null;
      aiChatActivePreviewVoice='';
      toast(
        error.message||('Could not play '+voiceName)
      );
    }
  }

  function openAiChatVoicesPage(){
    stopAiChatVoicePreview();
    window.location.assign('/mini-app?section=voices');
  }

  async function selectAiChatVoice(voiceId,voiceName){
    var selectedId=String(voiceId||'').trim();
    var selectedName=String(voiceName||'').trim();

    if(
      !selectedId
      ||!selectedName
      ||aiChatVoiceMenuBusy
    ){
      return;
    }

    if(selectedName===aiChatPreferredVoice){
      setAiChatVoiceMenu(false);
      return;
    }

    var wrap=q('aiChatVoiceWrap');
    var card=q('aiChatVoiceCard');
    aiChatVoiceMenuBusy=true;
    stopAiChatVoicePreview();

    if(wrap){
      wrap.classList.add('updating');
    }
    if(card){
      card.setAttribute('aria-busy','true');
    }

    try{
      var data=await api('/mini-app/api/user-voices',{
        action:'select',
        voice:selectedId
      });

      updateAiChatHeader({
        voice:String(
          data.selectedVoice||selectedName
        ),
        savedVoices:Array.isArray(data.savedVoices)
          ?data.savedVoices
          :aiChatSavedVoices
      });
      setAiChatVoiceMenu(false);

      if(tg&&tg.HapticFeedback){
        try{
          tg.HapticFeedback.impactOccurred('light');
        }catch(error){}
      }
    }catch(error){
      toast(error.message);
    }finally{
      aiChatVoiceMenuBusy=false;

      if(wrap){
        wrap.classList.remove('updating');
      }
      if(card){
        card.removeAttribute('aria-busy');
      }
    }
  }

  function updateAiChatHeader(data){
    if(!data||typeof data!=='object')return;

    var voice=String(data.voice||'').trim();
    if(voice){
      aiChatPreferredVoice=voice;
    }

    if(Array.isArray(data.savedVoices)){
      aiChatSavedVoices=data.savedVoices
        .map(function(item){
          return String(item||'').trim();
        })
        .filter(function(item,index,list){
          return item&&list.indexOf(item)===index;
        })
        .slice(0,6);
    }

    if(data.voiceProfiles&&typeof data.voiceProfiles==='object'){
      aiChatVoiceProfiles=data.voiceProfiles;
    }

    var balance=q('aiChatBalance');
    if(
      balance
      &&data.balance!==undefined
      &&data.balance!==null
    ){
      balance.textContent=
        Number(data.balance).toLocaleString('en-US');
    }

    var label=q('aiChatVoiceLabel');
    if(label){
      label.textContent=aiChatPreferredVoice;
    }

    setAiChatVoiceAvatar(
      q('aiChatVoiceAvatar'),
      aiChatPreferredVoice
    );
    renderAiChatVoiceMenu();
  }

  function setAiChatCreatureState(state){if(typeof window.aiChatCreatureSetState==='function')window.aiChatCreatureSetState(state)}
  function withoutTrailingDot(value){return String(value==null?'':value).replace(/[.!؟。]+$/u,'')}
  function toast(value){var node=q('toast');if(!node)return;node.textContent=withoutTrailingDot(value);node.classList.remove('show');void node.offsetWidth;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){node.classList.remove('show')},3200)}
  function setAiChatKeyboardOffset(value){document.documentElement.style.setProperty('--ai-chat-keyboard-offset',Math.max(0,Math.round(Number(value)||0))+'px')}
  function syncAiChatKeyboardOffset(){setAiChatKeyboardOffset(stableViewportHeight-Number(tg&&tg.viewportHeight||stableViewportHeight))}
  document.documentElement.style.setProperty('--ai-chat-page-height',Math.round(stableViewportHeight)+'px');
  if(tg&&tg.onEvent){try{tg.onEvent('viewportChanged',syncAiChatKeyboardOffset)}catch(e){}}
  async function api(path,body){var response;try{response=await fetch(path,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify(Object.assign({initData:initData},body||{}))})}catch(error){throw new Error('Connection interrupted · Try again')}var data=await response.json().catch(function(){return{error:'Invalid response'}});if(!response.ok)throw new Error(data.error||'Request failed');return data}
  function aiOrbSpherePoint(index,count){var golden=Math.PI*(3-Math.sqrt(5));var y=1-2*(index+.5)/count;var radius=Math.sqrt(1-y*y);var angle=index*golden;return[radius*Math.cos(angle),y,radius*Math.sin(angle)]}
  function aiOrbProject(yaw,pitch,cx,cy){var sy=Math.sin(yaw),cyaw=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);return function(x,y,z){var rx=x*cyaw+z*sy;var rz=-x*sy+z*cyaw;var ry=y*cp-rz*sp;var depth=y*sp+rz*cp;return[cx+rx,cy-ry,depth]}}
  function aiOrbPaint(ctx,dots){
    dots.sort(function(first,second){
      return first.z-second.z;
    });

    dots.forEach(function(dot){
      if(dot.a<.02)return;

      if(dot.color){
        ctx.fillStyle='rgba('
          +Math.round(dot.color[0])+','
          +Math.round(dot.color[1])+','
          +Math.round(dot.color[2])+','
          +dot.a+')';
      }else{
        var ink=Math.max(0,Math.min(1,dot.white));
        var shade=Math.round((1-ink)*255);
        ctx.fillStyle='rgba('
          +shade+','
          +shade+','
          +shade+','
          +dot.a+')';
      }

      ctx.beginPath();
      ctx.arc(
        dot.x,
        dot.y,
        Math.max(.255,dot.r),
        0,
        Math.PI*2
      );
      ctx.fill();
    });
  }

  function aiSmoothMorph(value){
    var amount=Math.max(0,Math.min(1,Number(value)||0));
    return amount*amount*(3-2*amount);
  }

  function aiVoiceWaveEnvelope(index,count){
    var position=index/Math.max(1,count-1);
    return Math.pow(
      Math.sin(Math.PI*position),
      .78
    );
  }

  function aiVoiceBarHeight(index,count,seconds){
    var envelope=aiVoiceWaveEnvelope(index,count);
    var primary=
      .5+.5*Math.sin(seconds*3.9+index*.62);
    var secondary=
      .5+.5*Math.sin(seconds*5.7-index*.39);
    var texture=
      .5+.5*Math.sin(seconds*8.1+index*.21);

    return 1.2+envelope*(
      4.4
      +12.6*(
        primary*.5
        +secondary*.34
        +texture*.16
      )
    );
  }

  function drawAiVoiceWaveBody(
    ctx,
    seconds,
    mix,
    width,
    height
  ){
    var amount=aiSmoothMorph(mix);
    if(amount<.01)return;

    var barCount=23;
    var left=2.5;
    var waveWidth=Math.max(1,width-left*2);
    var center=height/2;

    ctx.save();
    ctx.lineCap='round';
    ctx.shadowColor='transparent';
    ctx.shadowBlur=0;

    for(var index=0;index<barCount;index+=1){
      var envelope=aiVoiceWaveEnvelope(
        index,
        barCount
      );
      var barHeight=aiVoiceBarHeight(
        index,
        barCount,
        seconds
      );
      var x=
        left
        +waveWidth*index/(barCount-1);

      ctx.beginPath();
      ctx.moveTo(x,center-barHeight/2);
      ctx.lineTo(x,center+barHeight/2);
      ctx.globalAlpha=
        .14*amount*envelope;
      ctx.strokeStyle='rgba(255,255,255,.64)';
      ctx.lineWidth=1.9;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x,center-barHeight*.41);
      ctx.lineTo(x,center+barHeight*.41);
      ctx.globalAlpha=
        .3*amount*envelope;
      ctx.strokeStyle='rgba(255,255,255,.86)';
      ctx.lineWidth=.95;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x,center-barHeight*.25);
      ctx.lineTo(x,center+barHeight*.25);
      ctx.globalAlpha=
        .52*amount*envelope;
      ctx.strokeStyle='rgba(255,255,255,.98)';
      ctx.lineWidth=.42;
      ctx.stroke();
    }

    ctx.restore();
  }

`;
