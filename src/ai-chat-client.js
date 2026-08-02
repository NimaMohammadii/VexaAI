import { AI_CHAT_CLIENT_PART_1 } from './ai-chat-client-part-1.js';
import { AI_CHAT_CLIENT_PART_2 } from './ai-chat-client-part-2.js';
import { AI_CHAT_CLIENT_PART_3 } from './ai-chat-client-part-3.js';
import { AI_CHAT_CLIENT_PART_4 } from './ai-chat-client-part-4.js';

const AI_CHAT_SOURCE = [
  AI_CHAT_CLIENT_PART_1,
  AI_CHAT_CLIENT_PART_2,
  AI_CHAT_CLIENT_PART_3,
  AI_CHAT_CLIENT_PART_4
].join('').replace(/\\\\/g, '\\');

function replaceRequired(source, marker, replacement, label) {
  if (!source.includes(marker)) {
    throw new Error(`AI chat build marker missing: ${label}`);
  }
  return source.replace(marker, replacement);
}

const OLD_SCROLL = `  function scrollAiChat(){var list=q('aiChatMessages');if(!list)return;requestAnimationFrame(function(){var messages=list.querySelectorAll('.ai-chat-message');var latest=messages[messages.length-1];if(!latest)return;var top=parseFloat(getComputedStyle(list).paddingTop)||0;list.scrollTop=Math.max(0,list.scrollTop+latest.getBoundingClientRect().top-list.getBoundingClientRect().top-top)})}`;
const NEW_SCROLL = `  function scrollAiChat(){var list=q('aiChatMessages');if(!list)return;requestAnimationFrame(function(){var messages=list.querySelectorAll('.ai-chat-message.user');var latest=messages[messages.length-1];if(!latest)return;var top=(parseFloat(getComputedStyle(list).paddingTop)||0)+22;list.scrollTop=Math.max(0,list.scrollTop+latest.getBoundingClientRect().top-list.getBoundingClientRect().top-top)})}`;

const OLD_SHARE_ICON = `      +'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
      +'<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 13.5v4A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-4" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>'`;
const NEW_SHARE_ICON = `      +'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
      +'<path d="M12 15.5V4m0 0L7.5 8.5M12 4l4.5 4.5M5.5 13.5v4A2.5 2.5 0 0 0 8 20h8a2.5 2.5 0 0 0 2.5-2.5v-4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'`;

const MESSAGE_ACTION_HELPERS = `  function copyAiChatMessageText(value){var text=String(value||'');if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);return new Promise(function(resolve,reject){var field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();try{document.execCommand('copy');resolve()}catch(error){reject(error)}finally{field.remove()}})}
  function decorateAiChatCodeBlocks(container){if(!container)return;container.querySelectorAll('pre:not([data-vexa-code])').forEach(function(pre){pre.setAttribute('data-vexa-code','true');var code=pre.querySelector('code');if(!code)return;var block=document.createElement('div');block.className='ai-code-block';var head=document.createElement('div');head.className='ai-code-head';var label=document.createElement('span');label.textContent='Code';var button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Copy code');button.textContent='Copy';button.addEventListener('click',function(){copyAiChatMessageText(code.textContent).then(function(){button.textContent='Copied';setTimeout(function(){button.textContent='Copy'},1300)}).catch(function(){toast('Could not copy')})});head.appendChild(label);head.appendChild(button);pre.parentNode.insertBefore(block,pre);block.appendChild(head);block.appendChild(pre)})}
  function buildAiChatMessageActions(text){var actions=document.createElement('div');actions.className='ai-chat-message-actions';actions.innerHTML='<button class="ai-chat-message-action" type="button" aria-label="Copy message"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="3" stroke="currentColor" stroke-width="1.75"/><path d="M16 8V6.8A2.8 2.8 0 0 0 13.2 4H6.8A2.8 2.8 0 0 0 4 6.8v6.4A2.8 2.8 0 0 0 6.8 16H8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg></button><button class="ai-chat-message-action" type="button" aria-label="Share message"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15V4m0 0L7.8 8.2M12 4l4.2 4.2M5 13.5v3.7A2.8 2.8 0 0 0 7.8 20h8.4a2.8 2.8 0 0 0 2.8-2.8v-3.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';var buttons=actions.querySelectorAll('button');buttons[0].addEventListener('click',function(){copyAiChatMessageText(text).then(function(){toast('Copied')}).catch(function(){toast('Could not copy')})});buttons[1].addEventListener('click',async function(){if(navigator.share){try{await navigator.share({text:String(text||'')});return}catch(error){if(error&&error.name==='AbortError')return}}copyAiChatMessageText(text).then(function(){toast('Copied for sharing')}).catch(function(){toast('Could not share')})});return actions}
`;

const GITHUB_HELPERS = `  var githubConnectionStorageKey='vexaGithubConnection';
  var githubPendingPromptStorageKey='vexaGithubPendingPrompt';
  var githubJustConnected=false;
  function getGitHubConnection(){try{return String(localStorage.getItem(githubConnectionStorageKey)||'')}catch(error){return''}}
  function captureGitHubConnection(){try{var url=new URL(window.location.href);var token=String(url.searchParams.get('github_connection')||'');if(!token)return;localStorage.setItem(githubConnectionStorageKey,token);githubJustConnected=true;url.searchParams.delete('github_connection');url.searchParams.delete('github_connected');var clean=url.pathname+(url.search||'')+(url.hash||'');history.replaceState(null,'',clean);toast('GitHub connected')}catch(error){}}
  function rememberGitHubPendingPrompt(){try{var latest='';for(var index=aiChatMessages.length-1;index>=0;index-=1){var item=aiChatMessages[index];if(item&&item.role==='user'&&String(item.content||'').trim()){latest=String(item.content).trim();break}}if(latest)localStorage.setItem(githubPendingPromptStorageKey,latest)}catch(error){}}
  function resumeGitHubPendingPrompt(){if(!githubJustConnected)return;var pending='';try{pending=String(localStorage.getItem(githubPendingPromptStorageKey)||'');localStorage.removeItem(githubPendingPromptStorageKey)}catch(error){}if(!pending)return;var input=q('aiChatInput');if(!input)return;input.value=pending;resizeAiChatInput();setTimeout(function(){sendAiChat()},180)}
  function githubMark(){return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.75a9.25 9.25 0 0 0-2.93 18.03c.46.09.63-.2.63-.44v-1.72c-2.56.56-3.1-1.09-3.1-1.09-.42-1.06-1.02-1.34-1.02-1.34-.84-.57.06-.56.06-.56.93.07 1.42.95 1.42.95.82 1.42 2.16 1.01 2.69.77.08-.6.32-1.01.59-1.24-2.05-.23-4.2-1.02-4.2-4.57 0-1.01.36-1.84.95-2.49-.1-.23-.41-1.17.09-2.45 0 0 .78-.25 2.54.95A8.8 8.8 0 0 1 12 7.2a8.8 8.8 0 0 1 2.31.31c1.77-1.2 2.54-.95 2.54-.95.5 1.28.19 2.22.09 2.45.59.65.95 1.48.95 2.49 0 3.55-2.16 4.33-4.21 4.56.33.29.62.85.62 1.72v2.56c0 .24.17.53.63.44A9.25 9.25 0 0 0 12 2.75Z" fill="currentColor"/></svg>'}
  async function openGitHubConnection(connectUrl){if(aiChatBusy)return;rememberGitHubPendingPrompt();var target=String(connectUrl||'');try{if(!target){var data=await api('/mini-app/api/github/connect',{});target=String(data.url||'')}if(!target)throw new Error('GitHub connection is unavailable');window.location.assign(target)}catch(error){toast(error.message||'Could not connect GitHub')}}
  function appendGitHubConnect(data){var list=q('aiChatMessages');if(!list)return;var item=document.createElement('div');item.className='ai-chat-message assistant github-connect-message';var message=document.createElement('div');message.className='github-connect-copy';message.textContent=String(data&&data.message||'Connect your GitHub repository so I can access the code and work on it.');var row=document.createElement('div');row.className='github-connect-row';var icon=document.createElement('div');icon.className='github-connect-icon';icon.innerHTML=githubMark();var card=document.createElement('section');card.className='github-connect-card';card.innerHTML='<div class="github-card-body"><strong>Connect GitHub</strong><span>Choose the repositories Vexa can work on</span></div><button class="github-card-button" type="button">Connect</button>';var button=card.querySelector('.github-card-button');button.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();openGitHubConnection(data&&data.connectUrl)});row.appendChild(icon);row.appendChild(card);item.appendChild(message);item.appendChild(row);list.appendChild(item);aiChatMessages.push({role:'assistant',content:message.textContent});syncAiChatEmptyState();scrollAiChat()}
  function openGitHubExternal(url){var target=String(url||'');if(!target)return;if(tg&&typeof tg.openLink==='function'){try{tg.openLink(target);return}catch(error){}}window.open(target,'_blank','noopener,noreferrer')}
  function appendGitHubResultLink(data){if(!data||typeof data!=='object')return;var list=q('aiChatMessages');if(!list)return;var url=String(data.url||'');if(!url)return;var label='View changes';var kind=String(data.kind||'');if(kind==='pull_request'&&data.number)label='Open pull request #'+String(data.number);else if(kind==='merged'&&data.number)label='View merged pull request #'+String(data.number);else if(kind==='status'&&data.number)label='View pull request #'+String(data.number);else if(kind==='workflow')label='View workflow';var messages=list.querySelectorAll('.ai-chat-message.assistant.has-actions');var item=messages[messages.length-1];var actions=item&&item.querySelector('.ai-chat-message-actions');if(!actions)return;var oldLink=actions.querySelector('.github-result-link');if(oldLink)oldLink.remove();var link=document.createElement('button');link.type='button';link.className='github-result-link';link.textContent=label;link.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();openGitHubExternal(url)});actions.insertBefore(link,actions.firstChild);item.classList.add('has-github-result');scrollAiChat()}
`;

const CODE_LOADER_HELPERS = `  function aiCodeStateStage(state){
  if(state==='writing_code')return 1;
  if(state==='applying_changes')return 2;
  if(state==='checking_changes')return 3;
  return 0;
}

function aiIsCodeState(state){
  return state==='inspecting_repo'
    ||state==='writing_code'
    ||state==='applying_changes'
    ||state==='checking_changes';
}

function aiCodeStageWeight(stage,index){
  return aiSmoothMorph(Math.max(0,1-Math.abs(stage-index)));
}

var aiCodeParticleShapes=null;

function aiCodeParticle(x,y,z){
  return{x:x,y:y,z:z};
}

function aiCodeParticleLine(target,from,to,count){
  for(var index=0;index<count;index+=1){
    var ratio=count===1?0:index/(count-1);
    target.push(aiCodeParticle(
      from[0]+(to[0]-from[0])*ratio,
      from[1]+(to[1]-from[1])*ratio,
      from[2]+(to[2]-from[2])*ratio
    ));
  }
}

function aiCodeParticleCircle(target,cx,cy,radius,count,z){
  for(var index=0;index<count;index+=1){
    var angle=-Math.PI/2+index/count*Math.PI*2;
    target.push(aiCodeParticle(
      cx+Math.cos(angle)*radius,
      cy+Math.sin(angle)*radius,
      z+Math.sin(angle*2)*.22
    ));
  }
}

function aiCodeParticleSquircle(target,count,width,height){
  for(var index=0;index<count;index+=1){
    var angle=-Math.PI/2+index/count*Math.PI*2;
    var cosine=Math.cos(angle);
    var sine=Math.sin(angle);
    var x=Math.sign(cosine)*Math.pow(Math.abs(cosine),.5)*width/2;
    var y=Math.sign(sine)*Math.pow(Math.abs(sine),.5)*height/2;
    target.push(aiCodeParticle(
      x,
      y,
      Math.sin(angle*2)*.42
    ));
  }
}

function aiCodeParticleCheck(target,count){
  for(var index=0;index<count;index+=1){
    var ratio=index/Math.max(1,count-1);
    var x;
    var y;

    if(ratio<.38){
      var first=ratio/.38;
      var inverse=1-first;
      x=inverse*inverse*-7.2+2*inverse*first*-4.2+first*first*-1.7;
      y=inverse*inverse*-.1+2*inverse*first*3.4+first*first*5.1;
    }else{
      var second=(ratio-.38)/.62;
      var remaining=1-second;
      x=remaining*remaining*-1.7+2*remaining*second*2.5+second*second*8.1;
      y=remaining*remaining*5.1+2*remaining*second*.8+second*second*-6.7;
    }

    target.push(aiCodeParticle(x,y,Math.sin(ratio*Math.PI)*.5));
  }
}

function aiCodeBuildParticleShapes(){
  if(aiCodeParticleShapes)return aiCodeParticleShapes;

  var inspect=[];
  var writing=[];
  var applying=[];
  var checking=[];
  var shapes=[inspect,writing,applying,checking];

  shapes.forEach(function(shape){
    aiCodeParticleSquircle(shape,96,24,24);
  });

  aiCodeParticleCircle(inspect,0,0,6.7,48,.1);
  aiCodeParticleLine(inspect,[-6.2,0,.2],[6.2,0,.2],24);

  aiCodeParticleLine(writing,[-7.2,-5.1,.1],[7.2,-5.1,.1],24);
  aiCodeParticleLine(writing,[-7.2,0,.1],[5.2,0,.1],24);
  aiCodeParticleLine(writing,[-7.2,5.1,.1],[2.9,5.1,.1],24);

  aiCodeParticleCircle(applying,-4.4,0,4.1,24,.1);
  aiCodeParticleCircle(applying,4.4,0,4.1,24,.1);
  aiCodeParticleLine(applying,[-3.2,0,.25],[3.2,0,.25],24);

  aiCodeParticleCheck(checking,72);

  if(
    inspect.length!==168
    ||writing.length!==168
    ||applying.length!==168
    ||checking.length!==168
  ){
    throw new Error('Repository loader particle count mismatch');
  }

  aiCodeParticleShapes=shapes;
  return aiCodeParticleShapes;
}

function drawAiCodeLoader(ctx,seconds,mix,stage,width,height,sourceDots){
  var amount=aiSmoothMorph(mix);
  if(amount<.001)return;

  var shapes=aiCodeBuildParticleShapes();
  var safeStage=Math.max(0,Math.min(3,stage));
  var fromStage=Math.floor(safeStage);
  var toStage=Math.min(3,fromStage+1);
  var morph=aiSmoothMorph(safeStage-fromStage);
  var inspect=aiCodeStageWeight(safeStage,0);
  var writing=aiCodeStageWeight(safeStage,1);
  var applying=aiCodeStageWeight(safeStage,2);
  var checking=aiCodeStageWeight(safeStage,3);
  var from=shapes[fromStage];
  var to=shapes[toStage];
  var sourceCount=sourceDots&&sourceDots.length?sourceDots.length:0;
  var size=Math.min(width,height);
  var scale=size/52;
  var breathe=1+.018*Math.sin(seconds*2.15);
  var rotation=Math.sin(seconds*.58)*.035;
  var cosine=Math.cos(rotation);
  var sine=Math.sin(rotation);
  var scanY=-5.5+11*((seconds*.31)%1);
  var merge=.5+.5*Math.sin(seconds*2.35);
  var verify=1+.025*Math.sin(seconds*2.7);
  var points=[];

  for(var index=0;index<from.length;index+=1){
    var first=from[index];
    var second=to[index];
    var x=first.x+(second.x-first.x)*morph;
    var y=first.y+(second.y-first.y)*morph;
    var z=first.z+(second.z-first.z)*morph;
    var brightness=1;

    if(index<96){
      x*=breathe;
      y*=breathe;
      brightness=.78+.16*(.5+.5*Math.sin(seconds*1.8+index*.11));
    }else if(inspect>.01){
      if(index>=144){
        y+=scanY*inspect;
        brightness=.72+.28*Math.max(0,1-Math.abs(y-scanY)/2.6);
      }else{
        brightness=.74+.22*(.5+.5*Math.sin(seconds*2.4+index*.12));
      }
    }

    if(writing>.01&&index>=96){
      var local=index-96;
      var row=Math.floor(local/24);
      var position=local%24;
      var cursor=(seconds*.72-row*.18)%1;
      if(cursor<0)cursor+=1;
      var progress=position/23;
      brightness*=.56+.44*Math.max(0,1-Math.abs(progress-cursor)*4.8)*writing;
    }

    if(applying>.01&&index>=96){
      if(index<120){
        x+=merge*.82*applying;
      }else if(index<144){
        x-=merge*.82*applying;
      }else{
        brightness*=.64+.36*merge;
      }
    }

    if(checking>.01&&index>=96){
      x*=1+(verify-1)*checking;
      y*=1+(verify-1)*checking;
      var reveal=(seconds*.42)%1;
      var checkProgress=(index-96)/71;
      brightness*=.5+.5*Math.max(0,1-Math.abs(checkProgress-reveal)*5.2)*checking;
    }

    var rotatedX=x*cosine-y*sine;
    var rotatedY=x*sine+y*cosine;
    var depth=Math.max(0,Math.min(1,.5+z*.24));
    var targetX=width/2+rotatedX*scale;
    var targetY=height/2+rotatedY*scale;
    var targetRadius=(.48+.15*depth)*scale;
    var targetAlpha=Math.min(1,(.58+.34*depth)*brightness);
    var targetWhite=.025+.13*(1-depth);
    var source=sourceCount
      ?sourceDots[Math.min(
        sourceCount-1,
        Math.round(index*(sourceCount-1)/(from.length-1))
      )]
      :null;
    var sourceX=source&&Number.isFinite(source.x)?source.x:targetX;
    var sourceY=source&&Number.isFinite(source.y)?source.y:targetY;
    var sourceZ=source&&Number.isFinite(source.z)?source.z:z;
    var sourceRadius=source&&Number.isFinite(source.r)?source.r:targetRadius;
    var sourceAlpha=source&&Number.isFinite(source.a)?source.a:0;
    var sourceWhite=source&&Number.isFinite(source.white)?source.white:targetWhite;

    points.push({
      x:sourceX+(targetX-sourceX)*amount,
      y:sourceY+(targetY-sourceY)*amount,
      z:sourceZ+(z-sourceZ)*amount,
      r:sourceRadius+(targetRadius-sourceRadius)*amount,
      a:sourceAlpha+(targetAlpha-sourceAlpha)*amount,
      white:sourceWhite+(targetWhite-sourceWhite)*amount
    });
  }

  aiOrbPaint(ctx,points);
}

`;
const APPEND_MESSAGE_MARKER = `  function appendAiChatMessage`;
const THINKING_MARKER = `  function showAiThinking`;
const CONTENT_MARKER = `item.appendChild(content);list.appendChild(item);`;
const CONTENT_WITH_ACTIONS = `item.appendChild(content);if(cleanRole==='assistant'){content.classList.add('ai-chat-rich-content');item.classList.add('has-actions');item.appendChild(buildAiChatMessageActions(value))}list.appendChild(item);`;
const RENDER_MARKER = `function render(displayValue){if(cleanRole==='assistant')renderAiChatMarkdown(content,displayValue);else content.textContent=displayValue}`;
const RENDER_WITH_CODE_DECORATION = `function render(displayValue){if(cleanRole==='assistant'){renderAiChatMarkdown(content,displayValue);decorateAiChatCodeBlocks(content)}else content.textContent=displayValue}`;
const GITHUB_REQUEST_MARKER = `{messages:requestMessages},`;
const GITHUB_REQUEST_VALUE = `{messages:requestMessages,githubConnection:getGitHubConnection()},`;
const RESULT_MARKER = `      if(data.type==='image_request'){`;
const RESULT_WITH_GITHUB = `      if(data.type==='github_connect'){
        hideAiThinking();
        appendGitHubConnect(data);
      }else if(data.type==='github_result'){
        hideAiThinking();
        await appendAiChatMessage(
          'assistant',
          String(data.message||''),
          true
        );
        appendGitHubResultLink(data.github);
      }else if(data.type==='image_request'){`;
const WORKING_STATUS_MARKER = `    }else if(state==='generating_voice'){
      next='generating_voice';
      labelText='Generating voice';
    }`;
const WORKING_STATUS_VALUE = `    }else if(state==='working_on_repository'||state==='inspecting_repo'){
      next='inspecting_repo';
      labelText='Inspecting repository';
    }else if(state==='writing_code'){
      next='writing_code';
      labelText='Writing code';
    }else if(state==='applying_changes'){
      next='applying_changes';
      labelText='Applying changes';
    }else if(state==='checking_changes'){
      next='checking_changes';
      labelText='Checking changes';
    }else if(state==='generating_voice'){
      next='generating_voice';
      labelText='Generating voice';
    }`;
const LOAD_MARKER = `  async function loadAiChat(){`;
const LOAD_WITH_CAPTURE = `  captureGitHubConnection();
  async function loadAiChat(){`;
const SECTION_OPEN_MARKER = `      api(
        '/mini-app/api/section-open',
        {section:'ai_chat'}
      ).catch(function(){});`;
const SECTION_OPEN_WITH_RESUME = `      api(
        '/mini-app/api/section-open',
        {section:'ai_chat'}
      ).catch(function(){});
      resumeGitHubPendingPrompt();`;

const CODE_VARS_MARKER = `  var aiThinkingVoiceMix=0;
  var aiThinkingLastFrame=0;`;
const CODE_VARS_VALUE = `  var aiThinkingVoiceMix=0;
  var aiThinkingCodeMix=0;
  var aiThinkingCodeStage=0;
  var aiThinkingLastFrame=0;`;
const CODE_HELPERS_MARKER = `  function aiVoiceWaveEnvelope(index,count){`;
const DRAW_SIGNATURE_MARKER = `  function drawAiThinkingOrb(
    canvas,
    seconds,
    searchMix,
    voiceMix
  ){`;
const DRAW_SIGNATURE_VALUE = `  function drawAiThinkingOrb(
    canvas,
    seconds,
    searchMix,
    voiceMix,
    codeMix,
    codeStage
  ){`;
const MORPH_MARKER = `    var searchMorph=aiSmoothMorph(searchMix);
    var voiceMorph=aiSmoothMorph(voiceMix);`;
const MORPH_VALUE = `    var searchMorph=aiSmoothMorph(searchMix);
    var voiceMorph=aiSmoothMorph(voiceMix);
    var codeMorph=aiSmoothMorph(codeMix);`;
const GHOST_ALPHA_MARKER = `        a:
          (.1+.22*ghostDepth)
          *(1-searchMorph)`;
const GHOST_ALPHA_VALUE = `        a:
          (.1+.22*ghostDepth)
          *(1-searchMorph)`;
const DOT_ALPHA_MARKER = `          a:
            (.4+.6*depth)
            *(1-searchMorph)
            +(.16+.66*depth)
            *searchMorph
            *searchVisible`;
const DOT_ALPHA_VALUE = `          a:
            (.4+.6*depth)
            *(1-searchMorph)
            +(.16+.66*depth)
            *searchMorph
            *searchVisible`;
const VOICE_BODY_MARKER = `      voiceMorph,
      width,
      height
    );
    aiOrbPaint(ctx,dots);`;
const VOICE_BODY_VALUE = `      voiceMorph*(1-codeMorph),
      width,
      height
    );
    var aiCodeSourceDots=dots.slice();
    if(codeMorph<.001){
      aiOrbPaint(ctx,dots);
    }else{
      drawAiCodeLoader(
        ctx,
        seconds,
        codeMorph,
        codeStage,
        width,
        height,
        aiCodeSourceDots
      );
    }`;
const INITIAL_MIX_MARKER = `    aiThinkingVoiceMix=
      initialState==='generating_voice'?1:0;
    aiThinkingLastFrame=0;`;
const INITIAL_MIX_VALUE = `    aiThinkingVoiceMix=
      initialState==='generating_voice'?1:0;
    aiThinkingCodeMix=
      aiIsCodeState(initialState)?1:0;
    aiThinkingCodeStage=
      aiCodeStateStage(initialState);
    aiThinkingLastFrame=0;`;
const TARGETS_MARKER = `      var voiceTarget=
        state==='generating_voice'?1:0;
      var delta=aiThinkingLastFrame`;
const TARGETS_VALUE = `      var voiceTarget=
        state==='generating_voice'?1:0;
      var codeTarget=aiIsCodeState(state)?1:0;
      var codeStageTarget=codeTarget
        ?aiCodeStateStage(state)
        :aiThinkingCodeStage;
      if(codeTarget&&aiThinkingCodeMix<.02){
        aiThinkingCodeStage=codeStageTarget;
      }
      var delta=aiThinkingLastFrame`;
const REDUCED_MARKER = `        aiThinkingSearchMix=searchTarget;
        aiThinkingVoiceMix=voiceTarget;`;
const REDUCED_VALUE = `        aiThinkingSearchMix=searchTarget;
        aiThinkingVoiceMix=voiceTarget;
        aiThinkingCodeMix=codeTarget;
        aiThinkingCodeStage=codeStageTarget;`;
const APPROACH_MARKER = `        aiThinkingVoiceMix=approachAiThinkingMix(
          aiThinkingVoiceMix,
          voiceTarget,
          delta,
          1.15
        );`;
const APPROACH_VALUE = `        aiThinkingVoiceMix=approachAiThinkingMix(
          aiThinkingVoiceMix,
          voiceTarget,
          delta,
          1.15
        );
        aiThinkingCodeMix=approachAiThinkingMix(
          aiThinkingCodeMix,
          codeTarget,
          delta,
          1.72
        );
        aiThinkingCodeStage=approachAiThinkingMix(
          aiThinkingCodeStage,
          codeStageTarget,
          delta,
          1.58
        );`;
const ACTIVE_DRAW_MARKER = `          aiThinkingSearchMix,
          aiThinkingVoiceMix
        );`;
const ACTIVE_DRAW_VALUE = `          aiThinkingSearchMix,
          aiThinkingVoiceMix,
          aiThinkingCodeMix,
          aiThinkingCodeStage
        );`;
const EMPTY_DRAW_MARKER = `          seconds,
          0,
          0
        );`;
const EMPTY_DRAW_VALUE = `          seconds,
          0,
          0,
          0,
          0
        );`;
const REDUCED_DRAW_MARKER = `        next==='searching'?1:0,
        next==='generating_voice'?1:0
      );`;
const REDUCED_DRAW_VALUE = `        next==='searching'?1:0,
        next==='generating_voice'?1:0,
        aiIsCodeState(next)?1:0,
        aiCodeStateStage(next)
      );`;

let builtSource = AI_CHAT_SOURCE;
builtSource = replaceRequired(builtSource, OLD_SCROLL, NEW_SCROLL, 'scroll');
builtSource = replaceRequired(builtSource, OLD_SHARE_ICON, NEW_SHARE_ICON, 'share icon');
builtSource = replaceRequired(builtSource, APPEND_MESSAGE_MARKER, MESSAGE_ACTION_HELPERS + APPEND_MESSAGE_MARKER, 'message helpers');
builtSource = replaceRequired(builtSource, THINKING_MARKER, GITHUB_HELPERS + THINKING_MARKER, 'GitHub helpers');
builtSource = replaceRequired(builtSource, CONTENT_MARKER, CONTENT_WITH_ACTIONS, 'message actions');
builtSource = replaceRequired(builtSource, RENDER_MARKER, RENDER_WITH_CODE_DECORATION, 'code blocks');
builtSource = replaceRequired(builtSource, GITHUB_REQUEST_MARKER, GITHUB_REQUEST_VALUE, 'GitHub connection request');
builtSource = replaceRequired(builtSource, RESULT_MARKER, RESULT_WITH_GITHUB, 'GitHub result');
builtSource = replaceRequired(builtSource, WORKING_STATUS_MARKER, WORKING_STATUS_VALUE, 'repository statuses');
builtSource = replaceRequired(builtSource, LOAD_MARKER, LOAD_WITH_CAPTURE, 'connection capture');
builtSource = replaceRequired(builtSource, SECTION_OPEN_MARKER, SECTION_OPEN_WITH_RESUME, 'connection resume');
builtSource = replaceRequired(builtSource, CODE_VARS_MARKER, CODE_VARS_VALUE, 'code loader state');
builtSource = replaceRequired(builtSource, CODE_HELPERS_MARKER, CODE_LOADER_HELPERS + CODE_HELPERS_MARKER, 'code loader drawing');
builtSource = replaceRequired(builtSource, DRAW_SIGNATURE_MARKER, DRAW_SIGNATURE_VALUE, 'code loader arguments');
builtSource = replaceRequired(builtSource, MORPH_MARKER, MORPH_VALUE, 'code loader morph');
builtSource = replaceRequired(builtSource, GHOST_ALPHA_MARKER, GHOST_ALPHA_VALUE, 'code loader ghost fade');
builtSource = replaceRequired(builtSource, DOT_ALPHA_MARKER, DOT_ALPHA_VALUE, 'code loader dot fade');
builtSource = replaceRequired(builtSource, VOICE_BODY_MARKER, VOICE_BODY_VALUE, 'code loader render');
builtSource = replaceRequired(builtSource, INITIAL_MIX_MARKER, INITIAL_MIX_VALUE, 'code loader initial state');
builtSource = replaceRequired(builtSource, TARGETS_MARKER, TARGETS_VALUE, 'code loader targets');
builtSource = replaceRequired(builtSource, REDUCED_MARKER, REDUCED_VALUE, 'code loader reduced motion');
builtSource = replaceRequired(builtSource, APPROACH_MARKER, APPROACH_VALUE, 'code loader animation');
builtSource = replaceRequired(builtSource, ACTIVE_DRAW_MARKER, ACTIVE_DRAW_VALUE, 'code loader active draw');
builtSource = replaceRequired(builtSource, EMPTY_DRAW_MARKER, EMPTY_DRAW_VALUE, 'code loader empty draw');
builtSource = replaceRequired(builtSource, REDUCED_DRAW_MARKER, REDUCED_DRAW_VALUE, 'code loader static draw');

export const AI_CHAT_JS = builtSource;
