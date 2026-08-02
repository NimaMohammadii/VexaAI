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

const OLD_SCROLL = `  function scrollAiChat(){var list=q('aiChatMessages');if(!list)return;requestAnimationFrame(function(){var messages=list.querySelectorAll('.ai-chat-message');var latest=messages[messages.length-1];if(!latest)return;var top=parseFloat(getComputedStyle(list).paddingTop)||0;list.scrollTop=Math.max(0,list.scrollTop+latest.getBoundingClientRect().top-list.getBoundingClientRect().top-top)})}`;
const NEW_SCROLL = `  function scrollAiChat(){var list=q('aiChatMessages');if(!list)return;requestAnimationFrame(function(){var messages=list.querySelectorAll('.ai-chat-message.user');var latest=messages[messages.length-1];if(!latest)return;var top=(parseFloat(getComputedStyle(list).paddingTop)||0)+22;list.scrollTop=Math.max(0,list.scrollTop+latest.getBoundingClientRect().top-list.getBoundingClientRect().top-top)})}`;
const OLD_SHARE_ICON = `      +'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
      +'<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 13.5v4A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-4" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>'`;
const NEW_SHARE_ICON = `      +'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
      +'<path d="M12 15.5V4m0 0L7.5 8.5M12 4l4.5 4.5M5.5 13.5v4A2.5 2.5 0 0 0 8 20h8a2.5 2.5 0 0 0 2.5-2.5v-4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'`;
const MESSAGE_ACTION_HELPERS = `  function copyAiChatMessageText(value){var text=String(value||'');if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);return new Promise(function(resolve,reject){var field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();try{document.execCommand('copy');resolve()}catch(error){reject(error)}finally{field.remove()}})}
  function escapeAiChatHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;')}
  function renderAiChatInline(value){var text=escapeAiChatHtml(value);text=text.replace(/\\\\`([^\\\\`]+)\\\\`/g,'<code class="ai-inline-code">$1</code>');text=text.replace(/\\*\\*([^*\\n]+)\\*\\*/g,'<strong>$1</strong>');text=text.replace(/__([^_\\n]+)__/g,'<strong>$1</strong>');return text}
  function renderAiChatMarkdown(container,value){if(!container)return;var source=String(value==null?'':value).replace(/\\r\\n?/g,'\\n').trim();if(!source){container.textContent='';return}var blocks=[];source=source.replace(/\\\`\\\`\\\`([A-Za-z0-9_+.#-]*)\\n?([\\s\\S]*?)\\\`\\\`\\\`/g,function(match,language,code){var index=blocks.length;blocks.push({language:String(language||'').trim(),code:String(code||'').replace(/\\n$/,'')});return '\\n@@VEXA_CODE_'+index+'@@\\n'});var lines=source.split('\\n');var html=[];var paragraph=[];var listType='';var listItems=[];function flushParagraph(){if(!paragraph.length)return;html.push('<p>'+renderAiChatInline(paragraph.join('\\n')).replace(/\\n/g,'<br>')+'</p>');paragraph=[]}function flushList(){if(!listItems.length)return;var tag=listType==='ol'?'ol':'ul';html.push('<'+tag+'>'+listItems.map(function(item){return'<li>'+renderAiChatInline(item)+'</li>'}).join('')+'</'+tag+'>');listItems=[];listType=''}lines.forEach(function(raw){var line=String(raw||'');var codeMatch=line.match(/^@@VEXA_CODE_(\\d+)@@$/);if(codeMatch){flushParagraph();flushList();var block=blocks[Number(codeMatch[1])];var label=block.language?'<span>'+escapeAiChatHtml(block.language)+'</span>':'';html.push('<div class="ai-code-block"><div class="ai-code-head">'+label+'<button type="button" aria-label="Copy code">Copy</button></div><pre><code>'+escapeAiChatHtml(block.code)+'</code></pre></div>');return}var heading=line.match(/^(#{1,3})\\s+(.+)$/);if(heading){flushParagraph();flushList();var level=Math.min(3,heading[1].length);html.push('<h'+level+'>'+renderAiChatInline(heading[2])+'</h'+level+'>');return}var unordered=line.match(/^\\s*[-*]\\s+(.+)$/);var ordered=line.match(/^\\s*\\d+[.)]\\s+(.+)$/);if(unordered||ordered){flushParagraph();var nextType=ordered?'ol':'ul';if(listType&&listType!==nextType)flushList();listType=nextType;listItems.push((ordered||unordered)[1]);return}if(!line.trim()){flushParagraph();flushList();return}if(listItems.length)flushList();paragraph.push(line)});flushParagraph();flushList();container.innerHTML=html.join('');container.querySelectorAll('.ai-code-head button').forEach(function(button){button.addEventListener('click',function(){var code=button.closest('.ai-code-block').querySelector('code').textContent;copyAiChatMessageText(code).then(function(){button.textContent='Copied';setTimeout(function(){button.textContent='Copy'},1300)}).catch(function(){toast('Could not copy')})})})}
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
  function appendGitHubConnect(data){var list=q('aiChatMessages');if(!list)return;var item=document.createElement('div');item.className='ai-chat-message assistant github-connect-message';var message=document.createElement('div');message.className='github-connect-copy';message.textContent=String(data&&data.message||'Connect your GitHub repository so I can access the code and work on it.');var card=document.createElement('section');card.className='github-connect-card';card.innerHTML='<div class="github-card-icon">'+githubMark()+'</div><div class="github-card-body"><strong>Connect GitHub</strong><span>Choose the repositories Vexa can work on</span></div><button class="github-card-button" type="button">Connect</button>';var button=card.querySelector('.github-card-button');button.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();openGitHubConnection(data&&data.connectUrl)});item.appendChild(message);item.appendChild(card);list.appendChild(item);aiChatMessages.push({role:'assistant',content:message.textContent});syncAiChatEmptyState();scrollAiChat()}
  function openGitHubExternal(url){var target=String(url||'');if(!target)return;if(tg&&typeof tg.openLink==='function'){try{tg.openLink(target);return}catch(error){}}window.open(target,'_blank','noopener,noreferrer')}
  function appendGitHubResultCard(data){if(!data||typeof data!=='object')return;var list=q('aiChatMessages');if(!list)return;var kind=String(data.kind||'');var title='GitHub updated';var detail=String(data.repository||'');var actionLabel='';var actionUrl=String(data.url||'');if(kind==='pull_request'){title='Pull request #'+String(data.number||'');var count=Array.isArray(data.changedFiles)?data.changedFiles.length:0;detail=String(data.repository||'')+(count?' · '+count+' file'+(count===1?'':'s'):'');actionLabel='Open'}else if(kind==='merged'){title='Pull request #'+String(data.number||'')+' merged';detail=String(data.repository||'')+(data.sha?' · '+String(data.sha).slice(0,7):'')}else if(kind==='status'){title='Pull request #'+String(data.number||'');var checks=Array.isArray(data.checks)?data.checks:[];var failed=checks.filter(function(check){return check&&check.conclusion&&check.conclusion!=='success'&&check.conclusion!=='neutral'&&check.conclusion!=='skipped'}).length;detail=String(data.repository||'')+' · '+String(data.state||'status')+(failed?' · '+failed+' failed':'');actionLabel=actionUrl?'Open':''}else if(kind==='workflow'){title='Workflow started';detail=String(data.repository||'')+(data.workflow?' · '+String(data.workflow):'')}var item=document.createElement('div');item.className='ai-chat-message assistant github-result-message';var card=document.createElement('section');card.className='github-result-card';var icon=document.createElement('div');icon.className='github-card-icon';icon.innerHTML=githubMark();var body=document.createElement('div');body.className='github-card-body';var strong=document.createElement('strong');strong.textContent=title;var span=document.createElement('span');span.textContent=detail;body.appendChild(strong);body.appendChild(span);card.appendChild(icon);card.appendChild(body);if(actionLabel&&actionUrl){var button=document.createElement('button');button.className='github-card-button compact';button.type='button';button.textContent=actionLabel;button.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();openGitHubExternal(actionUrl)});card.appendChild(button)}item.appendChild(card);list.appendChild(item);syncAiChatEmptyState();scrollAiChat()}
`;
const APPEND_MESSAGE_MARKER = `  function appendAiChatMessage`;
const THINKING_MARKER = `  function showAiThinking`;
const CONTENT_MARKER = `item.appendChild(content);list.appendChild(item);`;
const CONTENT_WITH_ACTIONS = `if(cleanRole==='assistant'){content.classList.add('ai-chat-rich-content');renderAiChatMarkdown(content,value)}item.appendChild(content);if(cleanRole==='assistant'){item.classList.add('has-actions');item.appendChild(buildAiChatMessageActions(value))}list.appendChild(item);`;
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
        appendGitHubResultCard(data.github);
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

export const AI_CHAT_JS = AI_CHAT_SOURCE
  .replace(OLD_SCROLL, NEW_SCROLL)
  .replace(OLD_SHARE_ICON, NEW_SHARE_ICON)
  .replace(APPEND_MESSAGE_MARKER, MESSAGE_ACTION_HELPERS + APPEND_MESSAGE_MARKER)
  .replace(THINKING_MARKER, GITHUB_HELPERS + THINKING_MARKER)
  .replace(CONTENT_MARKER, CONTENT_WITH_ACTIONS)
  .replace(GITHUB_REQUEST_MARKER, GITHUB_REQUEST_VALUE)
  .replace(RESULT_MARKER, RESULT_WITH_GITHUB)
  .replace(WORKING_STATUS_MARKER, WORKING_STATUS_VALUE)
  .replace(LOAD_MARKER, LOAD_WITH_CAPTURE)
  .replace(SECTION_OPEN_MARKER, SECTION_OPEN_WITH_RESUME);
