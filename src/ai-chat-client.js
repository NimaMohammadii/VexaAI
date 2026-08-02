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

  function drawAiCodeLoader(ctx,seconds,mix,stage,width,height){
    var amount=aiSmoothMorph(mix);
    if(amount<.01)return;

    var size=Math.min(width,height);
    var scale=size/48;
    var inspect=aiCodeStageWeight(stage,0);
    var writing=aiCodeStageWeight(stage,1);
    var applying=aiCodeStageWeight(stage,2);
    var checking=aiCodeStageWeight(stage,3);
    var pulse=.5+.5*Math.sin(seconds*3.4);
    var open=1.1*inspect+.96*writing+.73*applying+1.03*checking;
    var drift=Math.sin(seconds*1.7)*.55*scale;

    ctx.save();
    ctx.globalCompositeOperation='destination-out';
    ctx.globalAlpha=amount;
    ctx.fillRect(0,0,width,height);
    ctx.restore();

    ctx.save();
    ctx.translate(width/2,height/2);
    ctx.scale(.68+.32*amount,.68+.32*amount);
    ctx.rotate((1-amount)*-.16);
    ctx.globalCompositeOperation='lighter';
    ctx.lineCap='round';
    ctx.lineJoin='round';

    var braceGradient=ctx.createLinearGradient(-17*scale,-16*scale,17*scale,16*scale);
    braceGradient.addColorStop(0,'rgba(255,255,255,'+(.44+.4*amount)+')');
    braceGradient.addColorStop(.5,'rgba(205,145,242,'+(.62+.35*amount)+')');
    braceGradient.addColorStop(1,'rgba(255,255,255,'+(.38+.4*amount)+')');
    ctx.strokeStyle=braceGradient;
    ctx.lineWidth=(1.38+.38*pulse)*scale;
    ctx.shadowColor='rgba(188,105,238,.58)';
    ctx.shadowBlur=(4.2+3.8*pulse)*scale;

    function brace(side){
      var edge=side*11.4*scale*open;
      var inner=side*6.3*scale*open;
      var middle=side*14.1*scale*open;
      ctx.beginPath();
      ctx.moveTo(inner,-16*scale+drift);
      ctx.bezierCurveTo(edge,-16*scale+drift,edge,-10.2*scale+drift,edge,-6.1*scale+drift);
      ctx.bezierCurveTo(edge,-2.1*scale+drift,middle,-2*scale+drift,middle,drift);
      ctx.bezierCurveTo(middle,2*scale+drift,edge,2.1*scale+drift,edge,6.1*scale+drift);
      ctx.bezierCurveTo(edge,10.2*scale+drift,edge,16*scale+drift,inner,16*scale+drift);
      ctx.stroke();
    }

    brace(-1);
    brace(1);
    ctx.shadowBlur=0;

    var coreRadius=(2.8+.55*pulse+1.5*applying)*scale;
    var core=ctx.createRadialGradient(0,0,.2*scale,0,0,coreRadius*2);
    core.addColorStop(0,'rgba(255,255,255,'+(.9*amount)+')');
    core.addColorStop(.32,'rgba(218,175,255,'+(.65*amount)+')');
    core.addColorStop(1,'rgba(135,50,190,0)');
    ctx.fillStyle=core;
    ctx.beginPath();
    ctx.arc(0,0,coreRadius*2,0,Math.PI*2);
    ctx.fill();

    for(var ring=0;ring<20;ring+=1){
      var angle=ring/20*Math.PI*2+seconds*(.5+applying*1.55+checking*.35);
      var radius=coreRadius*(.9+.13*Math.sin(seconds*2.8+ring*.72));
      var alpha=(.24+.55*(.5+.5*Math.sin(angle-seconds)))*amount;
      ctx.fillStyle='rgba(240,218,255,'+alpha+')';
      ctx.beginPath();
      ctx.arc(Math.cos(angle)*radius,Math.sin(angle)*radius,(.3+.16*pulse)*scale,0,Math.PI*2);
      ctx.fill();
    }

    var lengths=[.88,.61,.76,.49];
    var typing=(seconds*.48)%1;
    var scan=(seconds*.36)%1;
    var verify=(seconds*.3)%1;
    for(var row=0;row<4;row+=1){
      var y=(row-1.5)*5.05*scale;
      var contraction=1-.49*applying;
      var left=-7.7*scale*contraction;
      var full=15.4*scale*lengths[row]*contraction;
      var inspectVisible=.2+.8*Math.max(0,1-Math.abs(row/3-scan)*2.8);
      var writeVisible=Math.min(1,Math.max(0,typing*1.55-row*.13));
      var checkVisible=.24+.76*Math.max(0,1-Math.abs(row/3-verify)*3.3);
      var visible=inspect*inspectVisible+writing*writeVisible+applying*(.44+.56*pulse)+checking*checkVisible;
      visible=Math.max(.08,Math.min(1,visible));
      ctx.strokeStyle='rgba(248,237,255,'+(visible*.84*amount)+')';
      ctx.lineWidth=(.68+.32*visible)*scale;
      ctx.beginPath();
      ctx.moveTo(left,y);
      ctx.lineTo(left+full*visible,y+Math.sin(seconds*3.2+row)*.28*scale*writing);
      ctx.stroke();

      for(var dot=0;dot<9;dot+=1){
        var progress=dot/8;
        var dotVisible=progress<=visible?1:.07;
        var travel=writing*Math.sin(seconds*4.3+dot*.55+row)*.35*scale+applying*(.5-progress)*2.7*scale*pulse;
        ctx.fillStyle='rgba(213,166,241,'+((.18+.62*dotVisible)*amount)+')';
        ctx.beginPath();
        ctx.arc(left+full*progress+travel,y,(.27+.15*dotVisible)*scale,0,Math.PI*2);
        ctx.fill();
      }
    }

    if(inspect+checking>.01){
      var sweepY=(-14+28*((seconds*.37)%1))*scale;
      var sweep=ctx.createLinearGradient(-9*scale,0,9*scale,0);
      sweep.addColorStop(0,'rgba(255,255,255,0)');
      sweep.addColorStop(.5,'rgba(255,255,255,'+(.48*(inspect+checking)*amount)+')');
      sweep.addColorStop(1,'rgba(255,255,255,0)');
      ctx.strokeStyle=sweep;
      ctx.lineWidth=.72*scale;
      ctx.beginPath();
      ctx.moveTo(-9*scale,sweepY);
      ctx.lineTo(9*scale,sweepY);
      ctx.stroke();
    }

    if(writing>.05){
      var cursorAlpha=(.28+.72*(Math.sin(seconds*8)>0?1:0))*writing*amount;
      ctx.strokeStyle='rgba(255,255,255,'+cursorAlpha+')';
      ctx.lineWidth=1.05*scale;
      ctx.beginPath();
      ctx.moveTo(6.9*scale,-1.9*scale);
      ctx.lineTo(6.9*scale,2.2*scale);
      ctx.stroke();
    }

    if(checking>.05){
      var checkAmount=aiSmoothMorph(checking)*amount;
      ctx.strokeStyle='rgba(255,255,255,'+(.9*checkAmount)+')';
      ctx.lineWidth=1.55*scale;
      ctx.shadowColor='rgba(202,139,242,.7)';
      ctx.shadowBlur=4*scale;
      ctx.beginPath();
      ctx.moveTo(-3.7*scale,1.2*scale);
      ctx.lineTo(-.8*scale,4.2*scale);
      ctx.lineTo(5.1*scale,-3.5*scale);
      ctx.stroke();
    }

    ctx.restore();
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
          *(1-searchMorph)
          *(1-codeMorph)`;
const DOT_ALPHA_MARKER = `          a:
            (.4+.6*depth)
            *(1-searchMorph)
            +(.16+.66*depth)
            *searchMorph
            *searchVisible`;
const DOT_ALPHA_VALUE = `          a:(
            (.4+.6*depth)
            *(1-searchMorph)
            +(.16+.66*depth)
            *searchMorph
            *searchVisible
          )*(1-codeMorph)`;
const VOICE_BODY_MARKER = `      voiceMorph,
      width,
      height
    );
    aiOrbPaint(ctx,dots);`;
const VOICE_BODY_VALUE = `      voiceMorph*(1-codeMorph),
      width,
      height
    );
    aiOrbPaint(ctx,dots);
    drawAiCodeLoader(
      ctx,
      seconds,
      codeMorph,
      codeStage,
      width,
      height
    );`;
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
          2.25
        );
        aiThinkingCodeStage=approachAiThinkingMix(
          aiThinkingCodeStage,
          codeStageTarget,
          delta,
          2.4
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
