import { AI_CHAT_STYLES_PART_1 } from './ai-chat-styles-part-1.js';
import { AI_CHAT_STYLES_PART_2 } from './ai-chat-styles-part-2.js';
import { AI_CHAT_STYLES_PART_3 } from './ai-chat-styles-part-3.js';

const AI_CHAT_STYLES_SOURCE = [
  AI_CHAT_STYLES_PART_1,
  AI_CHAT_STYLES_PART_2,
  AI_CHAT_STYLES_PART_3
].join('');

const OLD_SHARE_STYLE = '.wave-share{width:32px;height:32px;flex:0 0 32px;border-radius:10px;display:grid;place-items:center;padding:0;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.075);color:rgba(255,255,255,.86);transition:transform .22s cubic-bezier(.2,.9,.2,1),color .2s ease,background .2s ease,border-color .2s ease}.wave-share svg{width:18px;height:18px}.wave-share:active{transform:scale(.86);background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.14);color:#fff}';
const NEW_SHARE_STYLE = '.wave-share{width:32px;height:32px;flex:0 0 32px;border-radius:0;display:grid;place-items:center;padding:0;background:transparent;border:0;box-shadow:none;color:rgba(255,255,255,.84);transition:transform .2s cubic-bezier(.2,.9,.2,1),color .18s ease}.wave-share svg{width:19px;height:19px}.wave-share:active{transform:scale(.86);background:transparent;color:#fff}';

export const AI_CHAT_CSS = AI_CHAT_STYLES_SOURCE.replace(
  OLD_SHARE_STYLE,
  NEW_SHARE_STYLE
);
