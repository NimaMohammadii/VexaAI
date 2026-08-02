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
.ai-chat-message.github-connect-message,.ai-chat-message.github-result-message{width:min(100%,430px);max-width:430px;display:flex;flex-direction:column;align-items:stretch;gap:10px;margin-top:1px;margin-bottom:22px}
.github-connect-copy{max-width:92%;font-size:15px;line-height:1.62;letter-spacing:-.012em;color:rgba(255,255,255,.9);white-space:pre-wrap;overflow-wrap:anywhere}
.github-connect-card,.github-result-card{position:relative;width:100%;min-height:76px;display:flex;align-items:center;gap:12px;padding:12px 12px 12px 13px;border:1px solid rgba(255,255,255,.085);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.061),rgba(255,255,255,.024));box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 16px 40px rgba(0,0,0,.24);overflow:hidden;isolation:isolate}
.github-connect-card:before,.github-result-card:before{content:"";position:absolute;z-index:-1;left:-30px;top:-44px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(92,64,190,.17),rgba(92,64,190,0) 70%);pointer-events:none}
.github-result-card{min-height:70px;margin-top:-3px}
.github-card-icon{width:43px;height:43px;flex:0 0 43px;display:grid;place-items:center;border-radius:14px;background:rgba(114,88,205,.14);border:1px solid rgba(172,151,255,.1);color:rgba(229,224,255,.94);box-shadow:inset 0 1px 0 rgba(255,255,255,.055)}
.github-card-icon svg{width:23px;height:23px;display:block}
.github-card-body{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px;text-align:left}
.github-card-body strong{font-size:14px;line-height:1.15;font-weight:650;letter-spacing:-.015em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.github-card-body span{font-size:11.5px;line-height:1.35;font-weight:430;letter-spacing:-.006em;color:rgba(255,255,255,.48);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.github-card-button{height:36px;min-width:76px;display:grid;place-items:center;padding:0 15px;border:0;border-radius:12px;background:#f4f2f8;color:#0b0a0d;font-size:12px;font-weight:680;letter-spacing:-.01em;box-shadow:0 5px 18px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.72);transition:transform .18s cubic-bezier(.2,.9,.2,1),opacity .18s ease,background .18s ease}
.github-card-button.compact{min-width:61px;height:34px;padding:0 13px}
.github-card-button:active{transform:scale(.94);background:#fff}
.github-card-button:disabled{opacity:.5}
.ai-chat-message.rtl .github-connect-copy{text-align:right;align-self:flex-end}
.ai-chat-message.rtl .github-card-body{text-align:right}
.ai-thinking-row[data-state="working_on_repository"] span{color:rgba(232,227,255,.9)}
@media(max-width:420px){.ai-chat-message.github-connect-message,.ai-chat-message.github-result-message{width:100%;max-width:100%}.github-connect-card,.github-result-card{border-radius:18px;padding:11px}.github-card-icon{width:40px;height:40px;flex-basis:40px;border-radius:13px}.github-card-button{min-width:70px;padding:0 13px}.github-card-body span{max-width:160px}}
`;

export const AI_CHAT_CSS = AI_CHAT_STYLES_SOURCE
  .replace(OLD_SHARE_STYLE, NEW_SHARE_STYLE)
  + CHAT_REFINEMENTS;
