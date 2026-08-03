export const TEMPORARY_PREVIEW_CSS = String.raw`
.ai-chat-message.vexa-preview-message{width:min(100%,760px);max-width:760px;display:block;margin-top:-18px;margin-bottom:34px}
.vexa-preview-card{width:100%;overflow:hidden;border:1px solid rgba(255,255,255,.09);border-radius:22px;background:rgba(12,11,16,.96);box-shadow:0 20px 52px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.045)}
.vexa-preview-head{min-height:54px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 9px 8px 15px;border-bottom:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018))}
.vexa-preview-heading{min-width:0;display:flex;align-items:center;gap:8px}
.vexa-preview-heading strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:680;letter-spacing:-.015em;color:#fff}
.vexa-preview-heading span{flex:0 0 auto;padding:4px 7px;border:1px solid rgba(190,164,255,.14);border-radius:999px;background:rgba(118,75,179,.13);font-size:9.5px;font-weight:650;letter-spacing:.02em;text-transform:uppercase;color:rgba(218,202,255,.72)}
.vexa-preview-controls{display:flex;align-items:center;gap:5px}
.vexa-preview-controls button,.vexa-preview-close{height:34px;padding:0 11px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.045);color:rgba(255,255,255,.72);font-size:11.5px;font-weight:620;transition:transform .17s ease,background .17s ease,color .17s ease}
.vexa-preview-controls button.primary{border-color:rgba(178,139,255,.18);background:linear-gradient(145deg,rgba(74,35,105,.9),rgba(34,15,48,.92));color:rgba(255,255,255,.94)}
.vexa-preview-controls button:active,.vexa-preview-close:active{transform:scale(.92)}
.vexa-preview-frame{display:block;width:100%;height:min(58vh,500px);border:0;background:#fff}
.vexa-preview-overlay{position:fixed;z-index:10000;inset:0;display:flex;flex-direction:column;background:#000}
.vexa-preview-overlay-bar{height:calc(58px + env(safe-area-inset-top));flex:0 0 auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:0 12px 10px;border-bottom:1px solid rgba(255,255,255,.08);background:#08070a;color:#fff}
.vexa-preview-overlay-bar strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:670}
.vexa-preview-overlay .vexa-preview-frame{height:auto;min-height:0;flex:1;background:#fff}
@media(max-width:520px){.ai-chat-message.vexa-preview-message{width:100%;max-width:100%;margin-top:-14px}.vexa-preview-card{border-radius:18px}.vexa-preview-head{padding-left:12px}.vexa-preview-heading span{display:none}.vexa-preview-frame{height:54vh}.vexa-preview-controls button{padding:0 9px}}
`;
