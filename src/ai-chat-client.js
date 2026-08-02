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
  function buildAiChatMessageActions(text){var actions=document.createElement('div');actions.className='ai-chat-message-actions';actions.innerHTML='<button class="ai-chat-message-action" type="button" aria-label="Copy message"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="3" stroke="currentColor" stroke-width="2.2"/><path d="M16 8V6.8A2.8 2.8 0 0 0 13.2 4H6.8A2.8 2.8 0 0 0 4 6.8v6.4A2.8 2.8 0 0 0 6.8 16H8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button><button class="ai-chat-message-action" type="button" aria-label="Share message"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15V4m0 0L7.8 8.2M12 4l4.2 4.2M5 13.5v3.7A2.8 2.8 0 0 0 7.8 20h8.4a2.8 2.8 0 0 0 2.8-2.8v-3.7" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';var buttons=actions.querySelectorAll('button');buttons[0].addEventListener('click',function(){copyAiChatMessageText(text).then(function(){toast('Copied')}).catch(function(){toast('Could not copy')})});buttons[1].addEventListener('click',async function(){if(navigator.share){try{await navigator.share({text:String(text||'')});return}catch(error){if(error&&error.name==='AbortError')return}}copyAiChatMessageText(text).then(function(){toast('Copied for sharing')}).catch(function(){toast('Could not share')})});return actions}
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
const WORKING_STATUS_VALUE = `    }else if(state==='working_on_repository'){
      next='working_on_repository';
      labelText='Working on repository';
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

let builtSource = AI_CHAT_SOURCE;
builtSource = replaceRequired(builtSource, OLD_SCROLL, NEW_SCROLL, 'scroll');
builtSource = replaceRequired(builtSource, OLD_SHARE_ICON, NEW_SHARE_ICON, 'share icon');
builtSource = replaceRequired(builtSource, APPEND_MESSAGE_MARKER, MESSAGE_ACTION_HELPERS + APPEND_MESSAGE_MARKER, 'message helpers');
builtSource = replaceRequired(builtSource, THINKING_MARKER, GITHUB_HELPERS + THINKING_MARKER, 'GitHub helpers');
builtSource = replaceRequired(builtSource, CONTENT_MARKER, CONTENT_WITH_ACTIONS, 'message actions');
builtSource = replaceRequired(builtSource, RENDER_MARKER, RENDER_WITH_CODE_DECORATION, 'code blocks');
builtSource = replaceRequired(builtSource, GITHUB_REQUEST_MARKER, GITHUB_REQUEST_VALUE, 'GitHub connection request');
builtSource = replaceRequired(builtSource, RESULT_MARKER, RESULT_WITH_GITHUB, 'GitHub result');
builtSource = replaceRequired(builtSource, WORKING_STATUS_MARKER, WORKING_STATUS_VALUE, 'repository status');
builtSource = replaceRequired(builtSource, LOAD_MARKER, LOAD_WITH_CAPTURE, 'connection capture');
builtSource = replaceRequired(builtSource, SECTION_OPEN_MARKER, SECTION_OPEN_WITH_RESUME, 'connection resume');

export const AI_CHAT_JS = builtSource;
