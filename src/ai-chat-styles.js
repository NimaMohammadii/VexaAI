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
.ai-chat-message.assistant.has-actions{flex-direction:column;align-items:flex-start;justify-content:flex-start;margin-bottom:34px}
.ai-chat-message.assistant.rtl.has-actions .ai-chat-message-content{align-self:flex-end}
.ai-chat-message-actions{position:relative;display:inline-flex;align-items:center;justify-content:flex-start;gap:4px;margin-top:9px;padding:3px;border:1px solid rgba(255,255,255,.055);border-radius:13px;background:linear-gradient(180deg,rgba(255,255,255,.038),rgba(255,255,255,.018));box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 8px 24px rgba(0,0,0,.16);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.ai-chat-message-action{position:relative;width:31px;height:31px;display:grid;place-items:center;padding:0;border:0;border-radius:10px;background:transparent;color:rgba(255,255,255,.55);box-shadow:none;-webkit-tap-highlight-color:transparent;transition:transform .2s cubic-bezier(.2,.9,.2,1),background .18s ease,color .18s ease,box-shadow .18s ease}
.ai-chat-message-action:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.018));opacity:0;transition:opacity .18s ease}
.ai-chat-message-action svg{position:relative;z-index:1;width:16.5px;height:16.5px;display:block;overflow:visible;filter:drop-shadow(0 1px 1px rgba(0,0,0,.28));shape-rendering:geometricPrecision}
.ai-chat-message-action svg *{vector-effect:non-scaling-stroke}
@media(hover:hover){.ai-chat-message-action:hover{color:rgba(255,255,255,.92);background:rgba(255,255,255,.045);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}.ai-chat-message-action:hover:before{opacity:1}}
.ai-chat-message-action:focus-visible{outline:2px solid rgba(174,151,255,.78);outline-offset:2px;color:#fff}
.ai-chat-message-action:active{transform:scale(.9);background:rgba(255,255,255,.09);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.07)}
.ai-chat-message-action:active:before{opacity:1}
.ai-chat-rich-content{width:min(100%,680px);max-width:100%;white-space:normal!important;line-height:1.7!important;letter-spacing:-.012em;overflow-wrap:anywhere}
.ai-chat-rich-content p{margin:0 0 12px}.ai-chat-rich-content p:last-child{margin-bottom:0}
.ai-chat-rich-content strong{font-weight:720;color:#fff}
.ai-chat-rich-content h1,.ai-chat-rich-content h2,.ai-chat-rich-content h3{margin:18px 0 8px;color:#fff;letter-spacing:-.025em;line-height:1.25}
.ai-chat-rich-content h1:first-child,.ai-chat-rich-content h2:first-child,.ai-chat-rich-content h3:first-child{margin-top:0}
.ai-chat-rich-content h1{font-size:19px}.ai-chat-rich-content h2{font-size:17px}.ai-chat-rich-content h3{font-size:15.5px}
.ai-chat-rich-content ul,.ai-chat-rich-content ol{margin:5px 0 13px;padding-inline-start:22px}
.ai-chat-rich-content li{margin:5px 0;padding-inline-start:2px}
.ai-inline-code{padding:2px 6px;border-radius:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.06);font:500 12.5px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:rgba(244,241,255,.94)}
.ai-code-block{width:100%;margin:14px 0 15px;border:1px solid rgba(255,255,255,.085);border-radius:17px;background:linear-gradient(180deg,rgba(18,17,22,.98),rgba(10,9,13,.98));box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 14px 34px rgba(0,0,0,.22);overflow:hidden}
.ai-code-head{height:37px;display:flex;align-items:center;justify-content:space-between;padding:0 10px 0 13px;border-bottom:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.025)}
.ai-code-head span{font:600 10.5px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;text-transform:uppercase;letter-spacing:.045em;color:rgba(255,255,255,.42)}
.ai-code-head button{height:25px;padding:0 9px;border:0;border-radius:8px;background:rgba(255,255,255,.055);color:rgba(255,255,255,.68);font-size:10.5px;font-weight:620;transition:transform .16s ease,background .16s ease,color .16s ease}
.ai-code-head button:active{transform:scale(.94);background:rgba(255,255,255,.11);color:#fff}
.ai-code-block pre{margin:0;padding:15px 16px 17px;overflow:auto;-webkit-overflow-scrolling:touch}
.ai-code-block code{display:block;min-width:max-content;white-space:pre;tab-size:2;font:500 12.5px/1.62 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:rgba(244,241,255,.91);direction:ltr;text-align:left}
.ai-chat-message.rtl .ai-chat-rich-content{text-align:right}.ai-chat-message.rtl .ai-code-block{direction:ltr;text-align:left}
.ai-chat-message.github-connect-message{width:min(100%,430px);max-width:430px;display:flex;flex-direction:column;align-items:stretch;gap:10px;margin-top:1px;margin-bottom:22px}
.github-connect-copy{max-width:92%;font-size:15px;line-height:1.62;letter-spacing:-.012em;color:rgba(255,255,255,.9);white-space:pre-wrap;overflow-wrap:anywhere}
.github-connect-row{width:100%;display:flex;align-items:center;gap:10px}
.github-connect-icon{width:28px;height:40px;flex:0 0 28px;display:grid;place-items:center;color:rgba(255,255,255,.78)}
.github-connect-icon svg{width:22px;height:22px;display:block}
.github-connect-card{position:relative;min-width:0;min-height:40px;flex:1;display:flex;align-items:center;gap:6px;padding:3px;border:0;border-radius:16px;background:var(--ticket-glass-bg);box-shadow:var(--ticket-glass-shadow);backdrop-filter:blur(10px) saturate(1.12);-webkit-backdrop-filter:blur(10px) saturate(1.12)}
.github-card-body{min-width:0;flex:1;display:flex;flex-direction:column;justify-content:center;gap:2px;padding:0 8px;text-align:left}
.github-card-body strong{font-size:13px;line-height:1.1;font-weight:650;letter-spacing:-.015em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.github-card-body span{font-size:10.5px;line-height:1.2;font-weight:430;letter-spacing:-.006em;color:rgba(255,255,255,.42);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.github-card-button{width:auto;min-width:72px;height:34px;flex:0 0 auto;display:grid;place-items:center;padding:0 14px;border:0;border-radius:13px;background:linear-gradient(145deg,rgba(54,18,72,.88),rgba(23,8,31,.82));color:rgba(255,255,255,.9);font-size:12px;font-weight:680;letter-spacing:-.01em;box-shadow:inset 0 1px 0 rgba(232,202,255,.15),inset 0 -1px 0 rgba(0,0,0,.18),inset 0 0 18px rgba(121,52,161,.12),0 10px 24px rgba(0,0,0,.24);transition:transform .2s cubic-bezier(.16,1,.3,1),opacity .18s ease,background .2s ease,box-shadow .2s ease}
.github-card-button:active{transform:scale(.88)}
.github-card-button:disabled{opacity:.3}
.ai-chat-message.rtl .github-connect-copy{text-align:right;align-self:flex-end}
.ai-chat-message.rtl .github-card-body{text-align:right}
.ai-chat-message.github-result-message{width:auto;display:flex;justify-content:flex-start;margin-top:-10px;margin-bottom:22px}
.github-result-link{display:inline-flex;align-items:center;padding:0;border:0;background:transparent;color:rgba(210,185,255,.9);font-size:13px;font-weight:620;line-height:1.45;letter-spacing:-.012em;text-decoration:none;transition:opacity .18s ease,transform .18s ease}
.github-result-link:active{opacity:.62;transform:scale(.98)}
.ai-thinking-row[data-state="working_on_repository"] span{color:rgba(232,227,255,.9)}
@media(max-width:420px){.ai-chat-message.github-connect-message{width:100%;max-width:100%}.github-connect-row{gap:8px}.github-connect-icon{width:24px;flex-basis:24px}.github-connect-icon svg{width:20px;height:20px}.github-card-body span{max-width:150px}.github-card-button{min-width:68px;padding:0 12px}.ai-code-block{border-radius:15px}.ai-code-block pre{padding:14px}.ai-chat-message-actions{border-radius:12px}.ai-chat-message-action{width:32px;height:32px}}
`;

const FINAL_REFINEMENTS = `
.ai-chat-message.assistant .ai-chat-rich-content>p:first-child::first-line{font-weight:inherit!important;color:inherit!important}
.ai-chat-message.assistant .ai-chat-rich-content strong,.ai-chat-rich-content strong{font-weight:680!important;color:#fff!important}
.ai-chat-message.assistant.has-actions{margin-bottom:30px}
.ai-chat-message-actions{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;flex-wrap:wrap!important;gap:9px!important;margin-top:8px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.ai-chat-message.assistant.rtl.has-actions .ai-chat-message-actions{align-self:flex-end!important;direction:rtl!important}
.ai-chat-message-action{position:relative!important;width:27px!important;height:27px!important;display:grid!important;place-items:center!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:rgba(255,255,255,.48)!important;box-shadow:none!important;filter:none!important;transition:transform .18s cubic-bezier(.2,.9,.2,1),opacity .18s ease,color .18s ease!important}
.ai-chat-message-action:before{display:none!important}
.ai-chat-message-action svg{width:17px!important;height:17px!important;filter:none!important}
@media(hover:hover){.ai-chat-message-action:hover{background:transparent!important;box-shadow:none!important;color:rgba(255,255,255,.86)!important;opacity:1!important}}
.ai-chat-message-action:focus-visible{outline:1px solid rgba(255,255,255,.42)!important;outline-offset:3px!important;border-radius:2px!important}
.ai-chat-message-action:active{transform:scale(.86)!important;background:transparent!important;box-shadow:none!important;color:#fff!important;opacity:.72!important}
.github-result-message{display:none!important}
.github-result-link{order:-1!important;max-width:min(72vw,330px)!important;min-width:0!important;display:inline-flex!important;align-items:center!important;padding:0!important;margin:0 3px 0 0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:rgba(210,185,255,.9)!important;font-size:13px!important;font-weight:580!important;line-height:1.4!important;letter-spacing:-.01em!important;text-align:start!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-decoration:none!important;transition:opacity .18s ease,color .18s ease!important}
.github-result-link:active{transform:none!important;opacity:.58!important;color:rgba(225,209,255,.96)!important}
.ai-chat-message.rtl .github-result-link{margin:0 0 0 3px!important;text-align:right!important}
@media(max-width:420px){.ai-chat-message-actions{gap:8px!important}.ai-chat-message-action{width:27px!important;height:27px!important}.github-result-link{max-width:calc(100vw - 116px)!important;font-size:12.5px!important}}
`;

const TOPBAR_SPACING_FIX = `
.ai-chat-topbar{
  top:0!important;
  height:calc(88px + env(safe-area-inset-top))!important;
  padding:0 14px 12px!important;
  background:linear-gradient(180deg,#000 0%,rgba(0,0,0,.98) 58%,rgba(0,0,0,.82) 82%,rgba(0,0,0,0) 100%)!important;
}
.ai-chat-messages{
  padding-top:calc(116px + env(safe-area-inset-top))!important;
}
.ai-chat-drawer{
  padding-top:calc(45px + env(safe-area-inset-top))!important;
}
`;

export const AI_CHAT_CSS = AI_CHAT_STYLES_SOURCE
  .replace(OLD_SHARE_STYLE, NEW_SHARE_STYLE)
  + CHAT_REFINEMENTS
  + FINAL_REFINEMENTS
  + TOPBAR_SPACING_FIX;
