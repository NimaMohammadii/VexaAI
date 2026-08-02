import { AI_CHAT_STYLES_PART_1 } from './ai-chat-styles-part-1.js';
import { AI_CHAT_STYLES_PART_2 } from './ai-chat-styles-part-2.js';
import { AI_CHAT_STYLES_PART_3 } from './ai-chat-styles-part-3.js';

const AI_CHAT_STYLES_SOURCE = [
  AI_CHAT_STYLES_PART_1,
  AI_CHAT_STYLES_PART_2,
  AI_CHAT_STYLES_PART_3
].join('');

const OLD_SHARE_STYLE = '.wave-share{width:32px;height:32px;flex:0 0 32px;border-radius:10px;display:grid;place-items:center;padding:0;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.075);color:rgba(255,255,255,.86);transition:transform .22s cubic-bezier(.2,.9,.2,1),color .2s ease,background .2s ease,border-color .2s ease}.wave-share svg{width:18px;height:18px}.wave-share:active{transform:scale(.86);background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.14);color:#fff}';
const NEW_SHARE_STYLE = '.wave-share{width:28px;height:28px;flex:0 0 28px;border-radius:0;display:grid;place-items:center;padding:0;background:transparent;border:0;box-shadow:none;color:rgba(255,255,255,.88);transition:transform .2s cubic-bezier(.2,.9,.2,1),color .18s ease}.wave-share svg{width:18px;height:18px}.wave-share:active{transform:scale(.86);background:transparent;color:#fff}';
const CHAT_REFINEMENTS = `
.ai-chat-messages{padding-top:calc(26px + env(safe-area-inset-top))}
.wave-player{width:78%;height:46px;border-radius:19px;padding:5px;gap:6px}
.wave-play{width:34px;height:34px;flex-basis:34px;border-radius:13px}
.wave-player-body{padding:0 6px;border-radius:13px}
.wave-seek{height:27px}
.wave-svg{top:2px;height:23px}
.wave-actions{gap:4px}
.ai-chat-message.assistant.has-actions{flex-direction:column;align-items:flex-start;justify-content:flex-start;margin-bottom:31px}
.ai-chat-message.assistant.rtl.has-actions .ai-chat-message-content{align-self:flex-end}
.ai-chat-message-actions{display:flex;align-items:center;justify-content:flex-start;gap:5px;margin-top:7px}
.ai-chat-message-action{width:28px;height:28px;display:grid;place-items:center;padding:0;border:0;border-radius:10px;background:rgba(255,255,255,.045);color:rgba(255,255,255,.56);box-shadow:inset 0 1px 0 rgba(255,255,255,.035);transition:transform .18s cubic-bezier(.2,.9,.2,1),background .18s ease,color .18s ease}
.ai-chat-message-action svg{width:15px;height:15px}
.ai-chat-message-action:active{transform:scale(.86);background:rgba(255,255,255,.1);color:#fff}
`;

export const AI_CHAT_CSS = AI_CHAT_STYLES_SOURCE
  .replace(OLD_SHARE_STYLE, NEW_SHARE_STYLE)
  + CHAT_REFINEMENTS;
