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
const NEW_SCROLL = `  function scrollAiChat(){var list=q('aiChatMessages');if(!list)return;requestAnimationFrame(function(){var messages=list.querySelectorAll('.ai-chat-message.user');var latest=messages[messages.length-1];if(!latest)return;var top=(parseFloat(getComputedStyle(list).paddingTop)||0)+18;list.scrollTop=Math.max(0,list.scrollTop+latest.getBoundingClientRect().top-list.getBoundingClientRect().top-top)})}`;
const OLD_SHARE_ICON = `      +'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
      +'<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 13.5v4A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-4" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>'`;
const NEW_SHARE_ICON = `      +'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
      +'<path d="M12 15.5V4m0 0L7.5 8.5M12 4l4.5 4.5M5.5 13.5v4A2.5 2.5 0 0 0 8 20h8a2.5 2.5 0 0 0 2.5-2.5v-4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'`;

export const AI_CHAT_JS = AI_CHAT_SOURCE
  .replace(OLD_SCROLL, NEW_SCROLL)
  .replace(OLD_SHARE_ICON, NEW_SHARE_ICON);
