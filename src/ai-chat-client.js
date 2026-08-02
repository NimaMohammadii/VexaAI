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
  function buildAiChatMessageActions(text){var actions=document.createElement('div');actions.className='ai-chat-message-actions';actions.innerHTML='<button class="ai-chat-message-action" type="button" aria-label="Copy message"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="3" stroke="currentColor" stroke-width="2.2"/><path d="M16 8V6.8A2.8 2.8 0 0 0 13.2 4H6.8A2.8 2.8 0 0 0 4 6.8v6.4A2.8 2.8 0 0 0 6.8 16H8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button><button class="ai-chat-message-action" type="button" aria-label="Share message"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15V4m0 0L7.8 8.2M12 4l4.2 4.2M5 13.5v3.7A2.8 2.8 0 0 0 7.8 20h8.4a2.8 2.8 0 0 0 2.8-2.8v-3.7" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';var buttons=actions.querySelectorAll('button');buttons[0].addEventListener('click',function(){copyAiChatMessageText(text).then(function(){toast('Copied')}).catch(function(){toast('Could not copy')})});buttons[1].addEventListener('click',async function(){if(navigator.share){try{await navigator.share({text:String(text||'')});return}catch(error){if(error&&error.name==='AbortError')return}}copyAiChatMessageText(text).then(function(){toast('Copied for sharing')}).catch(function(){toast('Could not share')})});return actions}
`;
const APPEND_MESSAGE_MARKER = `  function appendAiChatMessage`;
const CONTENT_MARKER = `item.appendChild(content);list.appendChild(item);`;
const CONTENT_WITH_ACTIONS = `item.appendChild(content);if(cleanRole==='assistant'){item.classList.add('has-actions');item.appendChild(buildAiChatMessageActions(value))}list.appendChild(item);`;

export const AI_CHAT_JS = AI_CHAT_SOURCE
  .replace(OLD_SCROLL, NEW_SCROLL)
  .replace(OLD_SHARE_ICON, NEW_SHARE_ICON)
  .replace(APPEND_MESSAGE_MARKER, MESSAGE_ACTION_HELPERS + APPEND_MESSAGE_MARKER)
  .replace(CONTENT_MARKER, CONTENT_WITH_ACTIONS);
