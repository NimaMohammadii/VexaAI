import { AI_CHAT_STYLES_PART_1 } from './ai-chat-styles-part-1.js';
import { AI_CHAT_STYLES_PART_2 } from './ai-chat-styles-part-2.js';
import { AI_CHAT_STYLES_PART_3 } from './ai-chat-styles-part-3.js';

const AI_CHAT_STYLES_SOURCE = [
  AI_CHAT_STYLES_PART_1,
  AI_CHAT_STYLES_PART_2,
  AI_CHAT_STYLES_PART_3
].join('');

export const AI_CHAT_CSS = AI_CHAT_STYLES_SOURCE
  .replace(
    ':root{--ai-chat-keyboard-offset:0px;--ai-chat-page-height:100dvh}',
    ':root{--ai-chat-page-height:100dvh}'
  )
  .replace(
    'body{position:fixed;inset:0;height:var(--ai-chat-page-height)}',
    'body{position:fixed;top:0;left:0;width:100%;height:var(--ai-chat-page-height)}'
  )
  .replace(
    'position:fixed;z-index:115;inset:0;width:100%;height:var(--ai-chat-page-height);display:flex',
    'position:fixed;z-index:115;top:0;left:0;right:0;width:100%;height:var(--ai-chat-page-height);display:flex'
  )
  .replace(
    'transform:translate3d(18px,0,0) scale(.996);transition:transform .3s cubic-bezier(.16,.86,.22,1)',
    'transform:none;transition:none'
  )
  .replace('html.ai-chat-ready .ai-chat-page{transform:none}', '')
  .replace(
    'bottom:calc(max(12px,env(safe-area-inset-bottom)) + var(--ai-chat-keyboard-offset,0px))',
    'bottom:max(12px,env(safe-area-inset-bottom))'
  )
  .replace(
    'opacity:0;transform:translate3d(0,26px,0) scale(.975);transition:transform .4s cubic-bezier(.16,1,.3,1),opacity .24s ease,border-color .28s ease,background .28s ease;will-change:opacity',
    'opacity:1;transform:none;transition:none;will-change:auto'
  )
  .replace('.ai-chat-page .ai-chat-composer{opacity:1;transform:none}', '');
