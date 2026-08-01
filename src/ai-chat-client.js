import { AI_CHAT_CLIENT_PART_1 } from './ai-chat-client-part-1.js';
import { AI_CHAT_CLIENT_PART_2 } from './ai-chat-client-part-2.js';
import { AI_CHAT_CLIENT_PART_3 } from './ai-chat-client-part-3.js';
import { AI_CHAT_CLIENT_PART_4 } from './ai-chat-client-part-4.js';

const AI_CHAT_SOURCE = [
  AI_CHAT_CLIENT_PART_1,
  AI_CHAT_CLIENT_PART_2,
  AI_CHAT_CLIENT_PART_3,
  AI_CHAT_CLIENT_PART_4
].join('');

const AI_CHAT_KEYBOARD_SYNCED_SOURCE = AI_CHAT_SOURCE.replace(
  "if(window.visualViewport)window.visualViewport.addEventListener('resize',syncAiChatKeyboardOffset,{passive:true});",
  "if(window.visualViewport){window.visualViewport.addEventListener('resize',syncAiChatKeyboardOffset,{passive:true});window.visualViewport.addEventListener('scroll',syncAiChatKeyboardOffset,{passive:true})}"
);

export const AI_CHAT_JS = AI_CHAT_KEYBOARD_SYNCED_SOURCE.replace(/\\\\/g, '\\');
