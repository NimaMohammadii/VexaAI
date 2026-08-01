export const AI_CHAT_CLIENT_PART_2 = `  function morphAiDotsToVoiceWave(
    dots,
    seconds,
    mix,
    width,
    height
  ){
    var amount=aiSmoothMorph(mix);
    if(amount<=0)return;

    var barCount=23;
    var dotsPerBar=9;
    var visibleDots=barCount*dotsPerBar;
    var left=2.5;
    var waveWidth=Math.max(1,width-left*2);
    var center=height/2;

    dots.forEach(function(dot,index){
      var visible=index<visibleDots;
      var bar=Math.floor(index/dotsPerBar);
      var level=index%dotsPerBar;
      var middle=(dotsPerBar-1)/2;
      var distance=Math.abs(level-middle);
      var envelope=visible
        ?aiVoiceWaveEnvelope(bar,barCount)
        :0;
      var barHeight=visible
        ?aiVoiceBarHeight(bar,barCount,seconds)
        :0;
      var targetX=
        left
        +waveWidth*bar/Math.max(1,barCount-1);
      var targetY=
        center
        +(level-middle)
        *barHeight/(dotsPerBar-1);
      var centerWeight=
        1-distance/Math.max(1,middle);
      var targetRadius=
        .28+.25*centerWeight;
      var targetAlpha=visible
        ?(.16+.56*centerWeight)*envelope
        :0;

      dot.x+=(targetX-dot.x)*amount;
      dot.y+=(targetY-dot.y)*amount;
      dot.z*=1-amount;
      dot.r+=(targetRadius-dot.r)*amount;
      dot.a+=(targetAlpha-dot.a)*amount;
      dot.white+=(.055-dot.white)*amount;

      if(visible){
        var shade=194+58*centerWeight;
        var currentColor=
          dot.color||[shade,shade,shade];

        dot.color=[
          currentColor[0]
            +(shade-currentColor[0])*amount,
          currentColor[1]
            +(shade-currentColor[1])*amount,
          currentColor[2]
            +(shade-currentColor[2])*amount
        ];
      }
    });
  }

  function drawAiThinkingOrb(
    canvas,
    seconds,
    searchMix,
    voiceMix
  ){
    if(!canvas)return;

    var bounds=canvas.getBoundingClientRect();
    var width=Math.max(
      1,
      Number(bounds.width)||48
    );
    var height=Math.max(
      1,
      Number(bounds.height)||48
    );
    var size=Math.min(width,height);
    var dpr=Math.min(
      3,
      window.devicePixelRatio||1
    );
    var pixelWidth=Math.round(width*dpr);
    var pixelHeight=Math.round(height*dpr);

    if(
      canvas.width!==pixelWidth
      ||canvas.height!==pixelHeight
    ){
      canvas.width=pixelWidth;
      canvas.height=pixelHeight;
    }

    var ctx=canvas.getContext('2d');
    if(!ctx)return;

    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';

    var searchMorph=aiSmoothMorph(searchMix);
    var voiceMorph=aiSmoothMorph(voiceMix);
    var searchPulse=
      1+Math.sin(seconds*2.15)*.052*searchMorph;
    var radius=
      size*(.39-.02*searchMorph)*searchPulse;
    var speedTime=seconds*2.34;
    var project=aiOrbProject(
      0,
      .55-.42*searchMorph,
      width/2,
      height/2
    );
    var dots=[];
    var dotScale=Math.pow(size/300,.6);
    var ghostCount=38;

    for(var ghost=0;ghost<ghostCount;ghost+=1){
      var point=aiOrbSpherePoint(
        ghost,
        ghostCount
      );
      var ghostPoint=project(
        point[0]*radius,
        point[1]*radius,
        point[2]*radius
      );
      var ghostDepth=
        (ghostPoint[2]/radius+1)/2;

      dots.push({
        x:ghostPoint[0],
        y:ghostPoint[1],
        z:ghostPoint[2],
        r:.8*dotScale,
        white:.78,
        a:
          (.1+.22*ghostDepth)
          *(1-searchMorph)
      });
    }

    var sinTilt=Math.sin(.55);
    var cosTilt=Math.cos(.55);
    var lanes=12;
    var segments=44;

    for(var lane=0;lane<lanes;lane+=1){
      var laneOffset=
        (lane-(lanes-1)/2)*.075;
      var laneDistance=
        Math.abs(lane-(lanes-1)/2)
        /Math.max(1,(lanes-1)/2);
      var latitude=
        Math.PI*(lane+.45)/(lanes-.1);
      var sphereY=Math.cos(latitude);
      var sphereRadius=Math.sin(latitude);

      for(
        var segment=0;
        segment<segments;
        segment+=1
      ){
        var angle=
          segment/segments*Math.PI*2;
        var wobble=
          .16*Math.sin(
            angle*3-speedTime*1.7+lane*.22
          )
          +.07*Math.sin(
            angle*5+speedTime*1.1
          );
        var elevation=laneOffset+wobble;
        var thinkingX=
          Math.cos(angle)-sinTilt*elevation;
        var thinkingY=
          cosTilt*Math.sin(angle);
        var thinkingZ=
          sinTilt*Math.sin(angle)-cosTilt*elevation;
        var thinkingLength=Math.sqrt(
          thinkingX*thinkingX
          +thinkingY*thinkingY
          +thinkingZ*thinkingZ
        );

        thinkingX/=thinkingLength;
        thinkingY/=thinkingLength;
        thinkingZ/=thinkingLength;

        var sphereAngle=
          angle+seconds*.48
          +(lane%2)*Math.PI/segments;
        var sphereX=
          Math.cos(sphereAngle)*sphereRadius;
        var sphereZ=
          Math.sin(sphereAngle)*sphereRadius;
        var x=
          thinkingX
          +(sphereX-thinkingX)*searchMorph;
        var y=
          thinkingY
          +(sphereY-thinkingY)*searchMorph;
        var z=
          thinkingZ
          +(sphereZ-thinkingZ)*searchMorph;
        var length=Math.sqrt(
          x*x+y*y+z*z
        )||1;
        var projected=project(
          x/length*radius,
          y/length*radius,
          z/length*radius
        );
        var depth=
          (projected[2]/radius+1)/2;
        var thinkingRadius=
          (.935+1.445*depth)
          *(1-.25*laneDistance)
          *dotScale;
        var searchRadius=.48+.52*depth;
        var searchVisible=
          segment%(
            lane===0||lane===lanes-1
              ?4
              :2
          )===0
            ?1
            :0;

        if(searchMorph>.999&&!searchVisible){
          continue;
        }

        dots.push({
          x:projected[0],
          y:projected[1],
          z:projected[2],
          r:
            thinkingRadius
            +(searchRadius-thinkingRadius)
            *searchMorph,
          white:
            (.52-.44*depth+.18*laneDistance)
            *(1-searchMorph)
            +(.22+.14*(1-depth))
            *searchMorph,
          a:
            (.4+.6*depth)
            *(1-searchMorph)
            +(.16+.66*depth)
            *searchMorph
            *searchVisible
        });
      }
    }

    morphAiDotsToVoiceWave(
      dots,
      seconds,
      voiceMorph,
      width,
      height
    );
    drawAiVoiceWaveBody(
      ctx,
      seconds,
      voiceMorph,
      width,
      height
    );
    aiOrbPaint(ctx,dots);
  }

  function approachAiThinkingMix(
    current,
    target,
    delta,
    speed
  ){
    var next=current
      +(target-current)*Math.min(1,delta*speed);

    if(Math.abs(target-next)<.001){
      return target;
    }

    return next;
  }

  function startAiThinkingOrb(){
    stopAiThinkingOrb();

    var canvas=q('aiThinkingOrb');
    var emptyCanvas=q('aiChatEmptyOrb');
    if(!canvas&&!emptyCanvas)return;

    var row=q('aiThinkingRow');
    var initialState=row
      ?row.getAttribute('data-state')
      :'';

    aiThinkingSearchMix=
      initialState==='searching'?1:0;
    aiThinkingVoiceMix=
      initialState==='generating_voice'?1:0;
    aiThinkingLastFrame=0;

    var reduced=window.matchMedia
      &&window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    function frame(now){
      var seconds=
        (now||performance.now())/1000;
      var currentRow=q('aiThinkingRow');
      var state=currentRow
        ?currentRow.getAttribute('data-state')
        :'';
      var searchTarget=
        state==='searching'?1:0;
      var voiceTarget=
        state==='generating_voice'?1:0;
      var delta=aiThinkingLastFrame
        ?Math.min(.05,seconds-aiThinkingLastFrame)
        :0;

      if(reduced){
        aiThinkingSearchMix=searchTarget;
        aiThinkingVoiceMix=voiceTarget;
      }else{
        aiThinkingSearchMix=approachAiThinkingMix(
          aiThinkingSearchMix,
          searchTarget,
          delta,
          2.6
        );
        aiThinkingVoiceMix=approachAiThinkingMix(
          aiThinkingVoiceMix,
          voiceTarget,
          delta,
          1.15
        );
      }

      aiThinkingLastFrame=seconds;

      if(canvas){
        drawAiThinkingOrb(
          canvas,
          seconds,
          aiThinkingSearchMix,
          aiThinkingVoiceMix
        );
      }

      if(emptyCanvas){
        drawAiThinkingOrb(
          emptyCanvas,
          seconds,
          0,
          0
        );
      }

      var list=q('aiChatMessages');
      var emptyVisible=!!(
        aiChatOpen
        &&list
        &&!list.querySelector(
          '.ai-chat-message,.ai-thinking-row'
        )
      );

      if(!reduced&&(aiChatBusy||emptyVisible)){
        aiThinkingFrame=requestAnimationFrame(frame);
      }
    }

    frame(performance.now());
  }

  function stopAiThinkingOrb(){if(aiThinkingFrame){cancelAnimationFrame(aiThinkingFrame);aiThinkingFrame=0}var canvas=q('aiThinkingOrb');if(canvas){var ctx=canvas.getContext('2d');if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height)}}
  function syncAiChatEmptyState(){var list=q('aiChatMessages');var empty=q('aiChatEmpty');if(!list||!empty)return;empty.classList.toggle('hidden',!!list.querySelector('.ai-chat-message,.ai-thinking-row'))}
  function scrollAiChat(){var list=q('aiChatMessages');if(!list)return;requestAnimationFrame(function(){var messages=list.querySelectorAll('.ai-chat-message.user');var latest=messages[messages.length-1];if(!latest)return;var top=(parseFloat(getComputedStyle(list).paddingTop)||0)+22;list.scrollTop=Math.max(0,list.scrollTop+latest.getBoundingClientRect().top-list.getBoundingClientRect().top-top)})}
  function resizeAiChatInput(){var input=q('aiChatInput');if(!input)return;input.style.height='auto';var full=input.scrollHeight;input.style.height=Math.min(120,Math.max(32,full))+'px';input.style.overflowY=full>120?'auto':'hidden'}
  function aiChatFileExtension(name){var parts=String(name||'').toLowerCase().split('.');return parts.length>1?parts.pop():''}
  function formatAiChatFileSize(bytes){var size=Math.max(0,Number(bytes)||0);if(size>=1024*1024)return(size/1024/1024).toFixed(size>=10*1024*1024?0:1)+' MB';if(size>=1024)return Math.round(size/1024)+' KB';return size+' B'}
  function buildAiChatAttachmentCard(attachment,removable){var card=document.createElement('div');card.className='ai-chat-attachment-card '+(attachment.isImage?'is-image':'is-file')+(removable?' is-selected':' ai-chat-message-attachment');if(attachment.isImage){var image=document.createElement('img');image.src=attachment.dataUrl;image.alt='';image.setAttribute('aria-hidden','true');card.appendChild(image)}else{var badge=document.createElement('span');badge.className='ai-chat-attachment-type';badge.textContent=(aiChatFileExtension(attachment.name)||'FILE').slice(0,4).toUpperCase();card.appendChild(badge)}var copy=document.createElement('span');copy.className='ai-chat-attachment-copy';var name=document.createElement('strong');name.textContent=attachment.name;var meta=document.createElement('small');meta.textContent=formatAiChatFileSize(attachment.size);copy.appendChild(name);copy.appendChild(meta);card.appendChild(copy);if(removable){var remove=document.createElement('button');remove.className='ai-chat-attachment-remove';remove.type='button';remove.setAttribute('aria-label','Remove attachment');remove.textContent='×';remove.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();clearAiChatAttachment()});card.appendChild(remove)}return card}
  function renderAiChatAttachment(){var composer=q('aiChatComposer');var preview=q('aiChatAttachmentPreview');if(!preview||!composer)return;preview.replaceChildren();var selected=!!aiChatAttachment;composer.classList.toggle('has-attachment',selected);preview.setAttribute('aria-hidden',selected?'false':'true');if(selected)preview.appendChild(buildAiChatAttachmentCard(aiChatAttachment,true))}
  function clearAiChatAttachment(){aiChatAttachment=null;var input=q('aiChatFile');if(input)input.value='';renderAiChatAttachment()}
  function readAiChatFile(file){return new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(String(reader.result||''))};reader.onerror=function(){reject(new Error('Could not read this file'))};reader.readAsDataURL(file)})}
  async function selectAiChatAttachment(file){if(!file)return;var extension=aiChatFileExtension(file.name);var mimeType=aiChatAttachmentMimes[extension];if(!mimeType){clearAiChatAttachment();toast('This file type is not supported');return}if(Number(file.size)<=0||Number(file.size)>aiChatAttachmentMaxBytes){clearAiChatAttachment();toast('File must be smaller than 10 MB');return}var button=q('aiChatAttach');if(button)button.classList.add('loading');try{var dataUrl=await readAiChatFile(file);aiChatAttachment={name:String(file.name||'attachment').slice(0,120),mimeType:mimeType,size:Number(file.size)||0,dataUrl:dataUrl.replace(/^data:[^;,]*/,'data:'+mimeType),isImage:mimeType.indexOf('image/')===0};renderAiChatAttachment();if(tg&&tg.HapticFeedback&&tg.HapticFeedback.impactOccurred)tg.HapticFeedback.impactOccurred('light')}catch(error){clearAiChatAttachment();toast(error.message||'Could not read this file')}finally{if(button)button.classList.remove('loading')}}

`;
